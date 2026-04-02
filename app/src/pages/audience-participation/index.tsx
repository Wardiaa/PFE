// src/pages/audience-participation/index.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SessionService } from '../../service/session.service';
import { useToast } from '../../hooks/use-toast';
import SessionJoinForm from './components/SessionJoinForm';
import MultipleChoiceQuestion from './components/MultipleChoiceQuestion';
import OpenTextQuestion from './components/OpenTextQuestion';
import RatingScaleQuestion from './components/RatingScaleQuestion';
import WordCloudQuestion from './components/WordCloudQuestion';
import WaitingState from './components/WaitingState';
import SubmissionConfirmation from './components/SubmissionConfirmation';
import SessionEndedState from './components/SessionEndedState';
import ErrorState from './components/ErrorState';
import type { Question, Session } from '../../lib/presentation.types';
import AppIcon from '../../components/AppIcon';

type SessionState = 'join' | 'question' | 'submitted' | 'waiting' | 'ended' | 'error';

interface ParticipantSession {
  session: Session;
  participantId: string;
  participantName: string;
}

/**
 * Compute remaining seconds from the authoritative DB session row.
 *
 * Scenarios:
 *   1. Currently paused       → remaining = timer_paused_remaining (frozen)
 *   2. Was paused, now resumed → remaining = timer_paused_remaining - elapsed(now - resumedAt)
 *   3. Never paused           → remaining = timeLimit - elapsed(now - startedAt)
 */
function computeRemainingFromDbRow(
  row: {
    is_paused: boolean;
    current_question_started_at: string | null;
    timer_paused_remaining: number | null;
    timer_resumed_at: string | null;
  },
  timeLimit: number
): number {
  const { is_paused, current_question_started_at, timer_paused_remaining, timer_resumed_at } = row;

  if (is_paused && timer_paused_remaining != null) {
    return Math.max(0, timer_paused_remaining);
  }

  if (!is_paused && timer_resumed_at != null && timer_paused_remaining != null) {
    const elapsedSinceResume = Math.floor((Date.now() - new Date(timer_resumed_at).getTime()) / 1000);
    return Math.max(0, timer_paused_remaining - elapsedSinceResume);
  }

  if (current_question_started_at) {
    const elapsed = Math.floor((Date.now() - new Date(current_question_started_at).getTime()) / 1000);
    return Math.max(0, timeLimit - elapsed);
  }

  return timeLimit;
}

const AudienceParticipation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [sessionState, setSessionState] = useState<SessionState>('join');
  const [participantSession, setParticipantSession] = useState<ParticipantSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<{ type?: string; message?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [timerTotal, setTimerTotal] = useState<number>(0);
  const [questionActive, setQuestionActive] = useState<boolean>(true);
  const [questionClosed, setQuestionClosed] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // ── Refs used inside subscription callbacks ─────────────────────────────
  // These avoid stale closures without forcing subscription recreation.
  const participantSessionRef = useRef<ParticipantSession | null>(null);
  const currentQuestionRef = useRef<Question | null>(null);
  const sessionStateRef = useRef<SessionState>('join');
  const questionClosedRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const questionActiveRef = useRef<boolean>(true);
  const timerRemainingRef = useRef<number>(0);
  const timerIntervalRef = useRef<number | undefined>(undefined);
  const toastRef = useRef(toast);

  // Keep refs in sync with state
  useEffect(() => { participantSessionRef.current = participantSession; }, [participantSession]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);
  useEffect(() => { sessionStateRef.current = sessionState; }, [sessionState]);
  useEffect(() => { questionClosedRef.current = questionClosed; }, [questionClosed]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { questionActiveRef.current = questionActive; }, [questionActive]);
  useEffect(() => { timerRemainingRef.current = timerRemaining; }, [timerRemaining]);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  // Check for code in URL on mount
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      sessionStorage.setItem('pending-session-code', code);
    }
  }, [searchParams]);

  const mapQuestionType = (dbType: string): Question['type'] => {
    const mapping: Record<string, Question['type']> = {
      'MULTIPLE_CHOICE': 'multiple-choice',
      'SINGLE_CHOICE': 'multiple-choice',
      'TRUE_FALSE': 'multiple-choice',
      'POLL': 'multiple-choice',
      'RATING': 'rating',
      'OPEN_TEXT': 'open-text',
      'WORD_CLOUD': 'word-cloud',
    };
    return mapping[dbType] || 'multiple-choice';
  };

  // ── Local countdown interval ─────────────────────────────────────────────
  const stopLocalCountdown = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = undefined;
    }
  }, []);

  const startLocalCountdown = useCallback(() => {
    stopLocalCountdown();

    timerIntervalRef.current = window.setInterval(() => {
      if (isPausedRef.current || !questionActiveRef.current) return;

      const next = timerRemainingRef.current - 1;
      if (next <= 0) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = undefined;
        timerRemainingRef.current = 0;
        setTimerRemaining(0);
        setQuestionActive(false);
        questionActiveRef.current = false;
        setQuestionClosed(true);
        questionClosedRef.current = true;
        toastRef.current({
          title: "Time's Up!",
          description: 'The time for this question has expired.',
          variant: 'destructive',
        });
      } else {
        timerRemainingRef.current = next;
        setTimerRemaining(next);
      }
    }, 1000);
  }, [stopLocalCountdown]);

  useEffect(() => {
    return () => stopLocalCountdown();
  }, [stopLocalCountdown]);

  // ── Load a question by ID ────────────────────────────────────────────────
  // Uses ref (participantSessionRef) not state, so it never needs to be
  // recreated due to participantSession changes.
  const loadQuestion = useCallback(async (questionId: string, questionIndex: number) => {
    // Guard: only run if we have a session
    if (!participantSessionRef.current) {
      console.warn('loadQuestion called with no participantSession');
      return;
    }

    console.log('Loading question:', { questionId, questionIndex });

    try {
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .maybeSingle();

      if (questionError) {
        console.error('Failed to load question:', questionError);
        setSessionState('waiting');
        sessionStateRef.current = 'waiting';
        return;
      }

      if (questionData) {
        const newQuestion: Question = {
          id: questionData.id,
          number: questionIndex + 1,
          type: mapQuestionType(questionData.type),
          text: questionData.title,
          description: questionData.description,
          timeLimit: questionData.time_limit,
          options: questionData.options,
          scale: questionData.scale,
          labels: questionData.labels,
          points: questionData.points,
          image: questionData.image_url,
          displayStyle: questionData.display_style,
        };

        const timeLimit = questionData.time_limit || 30;

        setCurrentQuestion(newQuestion);
        currentQuestionRef.current = newQuestion;
        setTimerTotal(timeLimit);
        setTimerRemaining(timeLimit);
        timerRemainingRef.current = timeLimit;
        setQuestionActive(true);
        questionActiveRef.current = true;
        setQuestionClosed(false);
        questionClosedRef.current = false;
        setIsPaused(false);
        isPausedRef.current = false;
        setSessionState('question');
        sessionStateRef.current = 'question';
        startLocalCountdown();
      } else {
        setSessionState('waiting');
        sessionStateRef.current = 'waiting';
      }
    } catch (err) {
      console.error('Load question error:', err);
      setSessionState('waiting');
      sessionStateRef.current = 'waiting';
    }
  }, [startLocalCountdown]); // does NOT depend on participantSession state

  // ── Realtime subscription ────────────────────────────────────────────────
  // CRITICAL: this effect only depends on session ID (stable after join).
  // All mutable values are accessed via refs to avoid recreating the
  // subscription on every state change (which causes missed events).
  useEffect(() => {
    if (!participantSession) return;

    const sessionId = participantSession.session.id;
    console.log('Setting up realtime subscription for session:', sessionId);

    const sessionChannel = supabase
      .channel(`session-audience-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Session update received:', payload.new);
          const updatedSession = payload.new as any;

          // ── Session ended ─────────────────────────────────────────────
          if (updatedSession.status === 'ENDED') {
            stopLocalCountdown();
            setSessionState('ended');
            sessionStateRef.current = 'ended';
            toastRef.current({
              title: 'Session Ended',
              description: 'The presenter has ended this session',
            });
            return;
          }

          // ── Pause state changed ───────────────────────────────────────
          const newIsPaused: boolean = updatedSession.is_paused ?? false;
          const wasPaused = isPausedRef.current;

          if (newIsPaused !== wasPaused) {
            setIsPaused(newIsPaused);
            isPausedRef.current = newIsPaused;

            if (newIsPaused) {
              // PAUSED — freeze at the DB-authoritative value
              stopLocalCountdown();
              const frozen: number = updatedSession.timer_paused_remaining ?? timerRemainingRef.current;
              setTimerRemaining(frozen);
              timerRemainingRef.current = frozen;
              toastRef.current({
                title: 'Session Paused',
                description: 'The presenter has paused the session',
              });
            } else {
              // RESUMED — recompute from DB to eliminate any drift
              const timeLimit = currentQuestionRef.current?.timeLimit ?? 30;
              const recalculated = computeRemainingFromDbRow(
                {
                  is_paused: false,
                  current_question_started_at: updatedSession.current_question_started_at,
                  timer_paused_remaining: updatedSession.timer_paused_remaining,
                  timer_resumed_at: updatedSession.timer_resumed_at,
                },
                timeLimit
              );
              setTimerRemaining(recalculated);
              timerRemainingRef.current = recalculated;

              if (recalculated > 0 && questionActiveRef.current) {
                startLocalCountdown();
              }
              toastRef.current({
                title: 'Session Resumed',
                description: 'The presentation has resumed',
              });
            }
          }

          // ── Question changed ──────────────────────────────────────────
          const newQuestionId: string | null = updatedSession.current_question_id;
          const newQuestionIndex: number = updatedSession.current_question_index;

          if (newQuestionId && newQuestionId !== currentQuestionRef.current?.id) {
            stopLocalCountdown();
            loadQuestion(newQuestionId, newQuestionIndex);
            return; // loadQuestion will handle all state transitions
          }

          // ── Went back to waiting ──────────────────────────────────────
          if (newQuestionIndex === -1 && sessionStateRef.current === 'question') {
            stopLocalCountdown();
            setSessionState('waiting');
            sessionStateRef.current = 'waiting';
            setCurrentQuestion(null);
            currentQuestionRef.current = null;
          }
        }
      )
      .subscribe((status) => {
        console.log('Audience subscription status:', status);
      });

    return () => {
      console.log('Removing audience subscription for session:', sessionId);
      supabase.removeChannel(sessionChannel);
    };
    // Only depends on session ID — all other values read from refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantSession?.session.id]);

  const handleJoinSession = async (joinData: { code: string; name: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionExists, error: sessionCheckError } = await supabase
        .from('sessions')
        .select('id, code, status, context_id, is_paused, current_question_started_at, timer_paused_remaining, timer_resumed_at')
        .eq('code', joinData.code.toUpperCase())
        .maybeSingle();

      if (sessionCheckError) {
        throw new Error('Database error. Please try again.');
      }

      if (!sessionExists) {
        throw new Error(`No session found with code "${joinData.code.toUpperCase()}". Please check the code and try again.`);
      }

      if (sessionExists.status === 'ENDED') {
        throw new Error('This session has already ended.');
      }

      const result = await SessionService.joinSession({
        sessionCode: joinData.code,
        participantName: joinData.name,
        userId: user?.id,
        isAnonymous: !user,
      });

      if (!result) {
        throw new Error('Failed to join session');
      }

      const ps: ParticipantSession = {
        session: result.session,
        participantId: result.participantId,
        participantName: joinData.name,
      };

      // Set ref immediately so loadQuestion can use it before state propagates
      participantSessionRef.current = ps;
      setParticipantSession(ps);

      const paused = sessionExists.is_paused || false;
      setIsPaused(paused);
      isPausedRef.current = paused;

      if (result.session.status === 'ACTIVE' && result.session.currentQuestionIndex >= 0) {
        const currentQ = result.session.presentation.questions[result.session.currentQuestionIndex];
        if (currentQ && currentQ.id) {
          const timeLimit = currentQ.timeLimit || 30;

          // Use DB-authoritative remaining time so late-joiners are in sync
          const remaining = computeRemainingFromDbRow(
            {
              is_paused: paused,
              current_question_started_at: sessionExists.current_question_started_at,
              timer_paused_remaining: sessionExists.timer_paused_remaining,
              timer_resumed_at: sessionExists.timer_resumed_at,
            },
            timeLimit
          );

          setCurrentQuestion(currentQ);
          currentQuestionRef.current = currentQ;
          setTimerTotal(timeLimit);
          setTimerRemaining(remaining);
          timerRemainingRef.current = remaining;
          setQuestionActive(true);
          questionActiveRef.current = true;
          setQuestionClosed(false);
          questionClosedRef.current = false;
          setSessionState('question');
          sessionStateRef.current = 'question';

          if (!paused && remaining > 0) {
            startLocalCountdown();
          }
        } else {
          setSessionState('waiting');
          sessionStateRef.current = 'waiting';
        }
      } else if (result.session.status === 'ENDED') {
        setSessionState('ended');
        sessionStateRef.current = 'ended';
      } else {
        setSessionState('waiting');
        sessionStateRef.current = 'waiting';
      }

      toast({
        title: 'Joined Successfully',
        description: `Welcome to "${result.session.presentation.title}"`,
      });

    } catch (err: any) {
      console.error('Join error:', err);
      setError({
        type: err.message?.includes('ended') ? 'session_not_found' : 'invalid_code',
        message: err.message || 'Failed to join session',
      });
      setSessionState('error');
      sessionStateRef.current = 'error';
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitResponse = async (response: any) => {
    if (!questionActiveRef.current || questionClosedRef.current || isPausedRef.current) {
      toast({
        title: 'Cannot Submit',
        description: isPausedRef.current
          ? 'The session is paused. Please wait for the presenter to resume.'
          : 'The time for this question has expired. You cannot submit a response.',
        variant: 'destructive',
      });
      return;
    }

    const ps = participantSessionRef.current;
    const q = currentQuestionRef.current;
    if (!ps || !q) return;

    try {
      const success = await SessionService.submitResponse({
        sessionId: ps.session.id,
        participantId: ps.participantId,
        questionId: q.id,
        answer: response,
      });

      if (success) {
        setSessionState('submitted');
        sessionStateRef.current = 'submitted';
        toast({
          title: 'Response Submitted!',
          description: 'Your answer has been recorded',
        });
      } else {
        throw new Error('Failed to submit response');
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast({
        title: 'Error',
        description: 'Failed to submit response. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleJoinNewSession = () => {
    stopLocalCountdown();
    participantSessionRef.current = null;
    currentQuestionRef.current = null;
    sessionStateRef.current = 'join';
    questionClosedRef.current = false;
    isPausedRef.current = false;
    questionActiveRef.current = true;
    timerRemainingRef.current = 0;

    setParticipantSession(null);
    setCurrentQuestion(null);
    setError(null);
    setSessionState('join');
    setTimerRemaining(0);
    setTimerTotal(0);
    setQuestionActive(true);
    setQuestionClosed(false);
    setIsPaused(false);
  };

  const handleRetry = () => {
    setError(null);
    setSessionState('join');
    sessionStateRef.current = 'join';
  };

  // ── Timer bar (audience view) ─────────────────────────────────────────────
  const renderTimerBar = () => {
    if (sessionState !== 'question' || !currentQuestion) return null;

    const total = timerTotal || currentQuestion.timeLimit || 30;
    const fraction = total > 0 ? timerRemaining / total : 0;
    const isWarning = timerRemaining <= 10 && timerRemaining > 0;

    let barColor = 'bg-primary';
    if (isPaused) barColor = 'bg-yellow-500';
    else if (isWarning) barColor = 'bg-red-500';

    return (
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* Track */}
        <div className="h-1.5 w-full bg-muted/60">
          <div
            className={`h-full transition-none ${barColor}`}
            style={{ width: `${Math.max(0, Math.min(100, fraction * 100))}%` }}
          />
        </div>
        {/* Pill */}
        <div className="flex justify-end px-4 pt-1">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border ${
              isPaused
                ? 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950/40 dark:border-yellow-800 dark:text-yellow-400'
                : isWarning
                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400 animate-pulse'
                : 'bg-background border-border text-foreground'
            }`}
          >
            <AppIcon name={isPaused ? 'PauseCircle' : 'Clock'} size={12} />
            <span>{isPaused ? 'Paused' : `${timerRemaining}s`}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = (): React.ReactNode => {
    switch (sessionState) {
      case 'join':
        return <SessionJoinForm onJoin={handleJoinSession} />;

      case 'question': {
        if (!currentQuestion) return null;
        return (
          <div className="relative">
            {/* Pause overlay */}
            {isPaused && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center">
                <div className="bg-card rounded-xl p-8 text-center max-w-md mx-4">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <AppIcon name="Pause" size={40} className="text-yellow-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Session Paused</h2>
                  <p className="text-muted-foreground">
                    The presenter has paused the session. Please wait for them to resume.
                  </p>
                </div>
              </div>
            )}

            {currentQuestion.type === 'multiple-choice' && (
              <MultipleChoiceQuestion
                question={{
                  text: currentQuestion.text,
                  description: currentQuestion.description,
                  options: currentQuestion.options,
                  responseCount: 0,
                }}
                onSubmit={(response) => handleSubmitResponse({ optionId: response.optionId })}
              />
            )}
            {currentQuestion.type === 'open-text' && (
              <OpenTextQuestion
                question={{
                  text: currentQuestion.text,
                  description: currentQuestion.description,
                  maxLength: 500,
                  minLength: 1,
                  responseCount: 0,
                }}
                onSubmit={(response) => handleSubmitResponse({ text: response.text })}
              />
            )}
            {currentQuestion.type === 'rating' && (
              <RatingScaleQuestion
                question={{
                  text: currentQuestion.text,
                  description: currentQuestion.description,
                  scale: currentQuestion.scale,
                  labels: currentQuestion.labels,
                  displayStyle: currentQuestion.displayStyle || 'numbers',
                  responseCount: 0,
                }}
                onSubmit={(response) => handleSubmitResponse({ rating: response.rating })}
              />
            )}
            {currentQuestion.type === 'word-cloud' && (
              <WordCloudQuestion
                question={{
                  text: currentQuestion.text,
                  description: currentQuestion.description,
                  maxWords: 5,
                  responseCount: 0,
                }}
                onSubmit={(response) => handleSubmitResponse({ words: response.words })}
              />
            )}
          </div>
        );
      }

      case 'submitted':
        return <SubmissionConfirmation message="Your response has been recorded successfully" />;

      case 'waiting':
        return <WaitingState message="Waiting for the presenter to start..." showSpinner={true} />;

      case 'ended':
        return <SessionEndedState onJoinNew={handleJoinNewSession} />;

      case 'error':
        return <ErrorState error={error} onRetry={handleRetry} />;

      default:
        return null;
    }
  };

  const getSessionTitle = () => {
    if (sessionState === 'join') return null;
    if (!participantSession) return null;

    return (
      <div className="max-w-2xl mx-auto mb-6 md:mb-8">
        <div className="bg-card rounded-xl p-4 md:p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-foreground truncate">
                {participantSession.session.presentation.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Code: {participantSession.session.code} • Joined as {participantSession.participantName}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
              <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-success animate-pulse'}`} />
              <span className="text-sm font-medium text-success whitespace-nowrap">
                {isPaused ? 'Paused' : 'Live'}
              </span>
            </div>
          </div>

          {sessionState === 'question' && currentQuestion && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Question {currentQuestion.number} of {participantSession.session.presentation.questions.length}
                </span>
                <div className="flex gap-1">
                  {participantSession.session.presentation.questions.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors duration-250 ${
                        index === currentQuestion.number - 1
                          ? 'bg-primary'
                          : index < (currentQuestion.number - 1)
                          ? 'bg-success'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {renderTimerBar()}
      <main className={`main-content ${sessionState === 'question' ? 'pt-8' : ''}`}>
        <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
          {getSessionTitle()}
          <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AudienceParticipation;
