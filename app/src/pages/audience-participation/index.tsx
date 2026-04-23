// src/pages/audience-participation/index.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SessionService } from '../../service/session.service';
import { useSessionSocket } from '../../lib/useSessionSocket';
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
 * Compute remaining seconds from a DB row.
 *
 * NOTE: this is used ONLY for late-joiner / refresh / fallback paths where
 * the participant did NOT receive the original broadcast and therefore has
 * to estimate elapsed time from the host-written timestamp.  In that case
 * we accept a small clock-skew error in exchange for showing *some* timer
 * to the late joiner.
 *
 * The HOT PATH (host triggers SESSION_START / QUESTION_CHANGE while the
 * participant is connected) deliberately does NOT compute elapsed time —
 * it just starts from `timeLimit` so every device begins counting from
 * exactly the same number, immune to phone clock skew.
 */
function computeRemainingFromDbRow(
  row: {
    is_paused: boolean;
    current_question_started_at: string | null;
    timer_paused_remaining: number | null;
    timer_resumed_at: string | null;
  },
  timeLimit: number | null
): number | null {
  if (timeLimit == null || timeLimit <= 0) return null;

  const { is_paused, current_question_started_at, timer_paused_remaining, timer_resumed_at } = row;

  if (is_paused && timer_paused_remaining != null) {
    return Math.max(0, timer_paused_remaining);
  }
  if (!is_paused && timer_resumed_at != null && timer_paused_remaining != null) {
    const elapsed = Math.floor((Date.now() - new Date(timer_resumed_at).getTime()) / 1000);
    return Math.max(0, timer_paused_remaining - elapsed);
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
  const [, setIsLoading] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [timerTotal, setTimerTotal] = useState<number>(0);
  const [questionActive, setQuestionActive] = useState<boolean>(true);
  const [questionClosed, setQuestionClosed] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // ── Refs ────────────────────────────────────────────────────────────────
  const participantSessionRef = useRef<ParticipantSession | null>(null);
  const currentQuestionRef = useRef<Question | null>(null);
  const sessionStateRef = useRef<SessionState>('join');
  const questionClosedRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const questionActiveRef = useRef<boolean>(true);
  const timerRemainingRef = useRef<number>(0);
  const timerIntervalRef = useRef<number | undefined>(undefined);
  const toastRef = useRef(toast);

  useEffect(() => { participantSessionRef.current = participantSession; }, [participantSession]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);
  useEffect(() => { sessionStateRef.current = sessionState; }, [sessionState]);
  useEffect(() => { questionClosedRef.current = questionClosed; }, [questionClosed]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { questionActiveRef.current = questionActive; }, [questionActive]);
  useEffect(() => { timerRemainingRef.current = timerRemaining; }, [timerRemaining]);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  // ── Read session code from URL (?code=ABC123) ──────────────────────────
  // When the participant scans the QR code or clicks the shared link from
  // the lobby, they arrive here with `?code=XXXXXX`. We surface that code
  // to the join form so it can pre-fill (and hide) the code field — the
  // participant only has to type their name and click Join.
  const prefilledCode = (searchParams.get('code') || '').toUpperCase();

  useEffect(() => {
    if (prefilledCode) sessionStorage.setItem('pending-session-code', prefilledCode);
  }, [prefilledCode]);

  const getQuestionImage = (question: Question | null): string | null => {
    if (!question) return null;
    return (question as any).image || (question as any).imageUrl || null;
  };

  const mapQuestionType = (dbType: string): Question['type'] => {
    const mapping: Record<string, Question['type']> = {
      MULTIPLE_CHOICE: 'multiple-choice',
      SINGLE_CHOICE: 'multiple-choice',
      TRUE_FALSE: 'multiple-choice',
      POLL: 'multiple-choice',
      RATING: 'rating',
      OPEN_TEXT: 'open-text',
      WORD_CLOUD: 'word-cloud',
    };
    return mapping[dbType] || 'multiple-choice';
  };

  // ── Local countdown ──────────────────────────────────────────────────────
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

  useEffect(() => () => stopLocalCountdown(), [stopLocalCountdown]);

  /**
   * Start a question's countdown.
   *
   * The third parameter `useElapsed` controls whether to subtract elapsed
   * time from the host's `startedAt`:
   *
   *   useElapsed === false  →  start from the full `timeLimit` (used for the
   *                            real-time broadcast path: the message just
   *                            arrived ~50 ms ago, so any elapsed math
   *                            is just clock-skew noise that produces
   *                            wrong numbers like "32 instead of 30").
   *
   *   useElapsed === true   →  subtract `(localNow - startedAt)` (used only
   *                            for the late-join / refresh / fallback path,
   *                            where there is no other way to estimate how
   *                            far into the question we already are).
   *
   * This is the core fix for the timer-skew bug: by treating the broadcast
   * as authoritative ("the question begins NOW"), every device starts from
   * the configured time limit regardless of phone-clock skew.
   */
  const applyQuestion = useCallback(
    (
      question: Question,
      timeLimit: number | null,
      startedAt?: string,
      useElapsed: boolean = false
    ) => {
      const limit = timeLimit == null || timeLimit <= 0 ? null : timeLimit;
      let remaining = limit ?? 0;
      if (limit !== null && useElapsed && startedAt) {
        const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
        remaining = Math.max(0, limit - elapsed);
      }

      setCurrentQuestion(question);
      currentQuestionRef.current = question;
      setTimerTotal(limit ?? 0);
      setTimerRemaining(remaining);
      timerRemainingRef.current = remaining;
      setQuestionActive(true);
      questionActiveRef.current = true;
      setQuestionClosed(false);
      questionClosedRef.current = false;
      setIsPaused(false);
      isPausedRef.current = false;
      setSessionState('question');
      sessionStateRef.current = 'question';
      if (limit !== null && remaining > 0) startLocalCountdown();
    },
    [startLocalCountdown]
  );

  // ── Load question — tries cache first, falls back to DB ─────────────────
  const loadQuestion = useCallback(
    async (
      questionId: string,
      questionIndex: number,
      timeLimit?: number | null,
      startedAt?: string,
      useElapsed: boolean = false
    ) => {
      if (!participantSessionRef.current) return;

      const cachedQ = participantSessionRef.current.session.presentation.questions.find(
        (q) => q.id === questionId
      );

      if (cachedQ) {
        applyQuestion(cachedQ, cachedQ.timeLimit ?? timeLimit ?? null, startedAt, useElapsed);
        return;
      }

      // DB fallback (late joiner who doesn't have questions cached yet)
      try {
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .select('*')
          .eq('id', questionId)
          .maybeSingle();

        if (questionError || !questionData) {
          setSessionState('waiting');
          sessionStateRef.current = 'waiting';
          return;
        }

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

        applyQuestion(
          newQuestion,
          questionData.time_limit ?? timeLimit ?? null,
          startedAt,
          useElapsed
        );
      } catch (err) {
        console.error('Load question error:', err);
        setSessionState('waiting');
        sessionStateRef.current = 'waiting';
      }
    },
    [applyQuestion]
  );

  // ── Broadcast message handler (real-time, ~50ms latency) ────────────────
  const handleBroadcast = useCallback(
    (msg: { type: string; payload?: Record<string, unknown> }) => {
      const { type, payload } = msg;

      switch (type) {
        case 'SESSION_START':
        case 'QUESTION_CHANGE': {
          const questionId = payload?.questionId as string | undefined;
          const questionIndex = (payload?.questionIndex as number) ?? 0;
          const timeLimit = payload?.timeLimit as number | null | undefined;
          // ── FIX: Ignore the host-provided `startedAt` on the broadcast
          // hot path.  The broadcast arrived ~50 ms ago, so the question
          // truly begins NOW for this participant.  Starting fresh from
          // `timeLimit` (instead of subtracting `localNow - startedAt`,
          // which compares two devices' wall clocks) eliminates the
          // 32-vs-30 phone-clock-skew bug.
          if (questionId) {
            stopLocalCountdown();
            loadQuestion(
              questionId,
              questionIndex,
              timeLimit,
              undefined,
              /* useElapsed */ false
            );
          }
          break;
        }

        case 'PAUSE': {
          const remaining = (payload?.remainingSeconds as number) ?? timerRemainingRef.current;
          stopLocalCountdown();
          setIsPaused(true);
          isPausedRef.current = true;
          setTimerRemaining(remaining);
          timerRemainingRef.current = remaining;
          break;
        }

        case 'RESUME': {
          // ── FIX: Just resume from the host-snapshotted `remainingSeconds`.
          // We deliberately do NOT subtract `(localNow - resumedAt)` here:
          // that subtraction was the second source of the same clock-skew
          // bug (a phone with a clock 2 s behind the PC was effectively
          // adding 2 seconds to the resumed timer).  Resume latency is
          // ~50 ms anyway — negligible.
          const remaining = (payload?.remainingSeconds as number) ?? timerRemainingRef.current;
          setIsPaused(false);
          isPausedRef.current = false;
          setTimerRemaining(remaining);
          timerRemainingRef.current = remaining;
          if (remaining > 0 && questionActiveRef.current) startLocalCountdown();
          break;
        }

        case 'SESSION_END': {
          stopLocalCountdown();
          setSessionState('ended');
          sessionStateRef.current = 'ended';
          break;
        }

        default:
          break;
      }
    },
    [loadQuestion, startLocalCountdown, stopLocalCountdown]
  );

  // ── Broadcast channel — only active after joining ────────────────────────
  const { connected: wsConnected } = useSessionSocket({
    sessionId: participantSession?.session.id ?? null,
    role: 'audience',
    onMessage: handleBroadcast,
    enabled: !!participantSession,
  });

  // ── Dedicated ENDED watcher — stable, never torn down while in session ───
  useEffect(() => {
    if (!participantSession) return;
    const sessionId = participantSession.session.id;

    const endedWatcher = supabase
      .channel(`session-ended-watcher-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as any;
          if (updated.status === 'ENDED' && sessionStateRef.current !== 'ended') {
            stopLocalCountdown();
            setSessionState('ended');
            sessionStateRef.current = 'ended';
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(endedWatcher); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantSession?.session.id]);

  // ── Supabase fallback for pause/resume/question changes ──────────────────
  // Only fires when the WebSocket broadcast channel is disconnected — i.e.
  // we missed the broadcast and have to recover from the DB row.  In that
  // case we DO need elapsed-time math because we have no other reference.
  useEffect(() => {
    if (!participantSession) return;
    const sessionId = participantSession.session.id;

    const sessionChannel = supabase
      .channel(`session-audience-fallback-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          if (wsConnected) return;

          const updatedSession = payload.new as any;
          if (updatedSession.status === 'ENDED') return;

          const newIsPaused: boolean = updatedSession.is_paused ?? false;
          const wasPaused = isPausedRef.current;

          if (newIsPaused !== wasPaused) {
            setIsPaused(newIsPaused);
            isPausedRef.current = newIsPaused;
            if (newIsPaused) {
              stopLocalCountdown();
              const frozen: number = updatedSession.timer_paused_remaining ?? timerRemainingRef.current;
              setTimerRemaining(frozen);
              timerRemainingRef.current = frozen;
            } else {
              const timeLimit = currentQuestionRef.current?.timeLimit ?? null;
              const recalculated = computeRemainingFromDbRow(
                {
                  is_paused: false,
                  current_question_started_at: updatedSession.current_question_started_at,
                  timer_paused_remaining: updatedSession.timer_paused_remaining,
                  timer_resumed_at: updatedSession.timer_resumed_at,
                },
                timeLimit
              );
              if (recalculated === null) {
                setTimerRemaining(0);
                timerRemainingRef.current = 0;
                setQuestionActive(true);
                questionActiveRef.current = true;
                setQuestionClosed(false);
                questionClosedRef.current = false;
              } else {
                setTimerRemaining(recalculated);
                timerRemainingRef.current = recalculated;
                if (recalculated > 0 && questionActiveRef.current) startLocalCountdown();
              }
            }
          }

          const newQuestionId: string | null = updatedSession.current_question_id;
          const newQuestionIndex: number = updatedSession.current_question_index;
          if (newQuestionId && newQuestionId !== currentQuestionRef.current?.id) {
            stopLocalCountdown();
            // Fallback path = we missed the broadcast → we DO need elapsed
            // math from the DB timestamp (best estimate available).
            loadQuestion(
              newQuestionId,
              newQuestionIndex,
              undefined,
              updatedSession.current_question_started_at,
              /* useElapsed */ true
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(sessionChannel); };
  }, [participantSession?.session.id, wsConnected, loadQuestion, startLocalCountdown, stopLocalCountdown]);

  // ── Join session ─────────────────────────────────────────────────────────
  const handleJoinSession = async (joinData: { code: string; name: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionExists, error: sessionCheckError } = await supabase
        .from('sessions')
        .select('id, code, status, context_id, is_paused, current_question_started_at, timer_paused_remaining, timer_resumed_at')
        .eq('code', joinData.code.toUpperCase())
        .maybeSingle();

      if (sessionCheckError) throw new Error('Database error. Please try again.');
      if (!sessionExists) throw new Error(`No session found with code "${joinData.code.toUpperCase()}".`);
      if (sessionExists.status === 'ENDED') throw new Error('This session has already ended.');

      const result = await SessionService.joinSession({
        sessionCode: joinData.code,
        participantName: joinData.name,
        userId: user?.id,
        isAnonymous: !user,
      });

      if (!result) throw new Error('Failed to join session');

      const ps: ParticipantSession = {
        session: result.session,
        participantId: result.participantId,
        participantName: joinData.name,
      };

      participantSessionRef.current = ps;
      setParticipantSession(ps);

      const paused = sessionExists.is_paused || false;
      setIsPaused(paused);
      isPausedRef.current = paused;

      if (result.session.status === 'ACTIVE' && result.session.currentQuestionIndex >= 0) {
        const currentQ = result.session.presentation.questions[result.session.currentQuestionIndex];
        if (currentQ?.id) {
          const timeLimit = currentQ.timeLimit ?? null;
          // Late-join path: must compute elapsed from DB timestamp because
          // we have no other reference for "how long has this question
          // been running already?".
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
          setTimerTotal(timeLimit ?? 0);
          setTimerRemaining(remaining ?? 0);
          timerRemainingRef.current = remaining ?? 0;
          setQuestionActive(true);
          questionActiveRef.current = true;
          setQuestionClosed(false);
          questionClosedRef.current = false;
          setSessionState('question');
          sessionStateRef.current = 'question';
          if (timeLimit !== null && !paused && remaining !== null && remaining > 0) startLocalCountdown();
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

  // ── Submit response ──────────────────────────────────────────────────────
  const handleSubmitResponse = async (response: any) => {
    if (!questionActiveRef.current || questionClosedRef.current || isPausedRef.current) {
      toast({
        title: 'Cannot Submit',
        description: isPausedRef.current
          ? 'The session is paused. Please wait for the presenter to resume.'
          : 'The time for this question has expired.',
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
        toast({ title: 'Response Submitted!', description: 'Your answer has been recorded' });
      } else {
        throw new Error('Failed to submit response');
      }
    } catch (err) {
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

  // ── Timer bar ────────────────────────────────────────────────────────────
  const renderTimerBar = () => {
    if (sessionState !== 'question' || !currentQuestion) return null;

    const total = timerTotal || currentQuestion.timeLimit || 0;
    if (!total || total <= 0) {
      return (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="flex justify-between px-4 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {wsConnected ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Live
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  Connecting...
                </>
              )}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border bg-background border-border text-foreground">
              <AppIcon name={isPaused ? 'PauseCircle' : 'Infinity'} size={12} />
              <span>{isPaused ? 'Paused' : 'No timer'}</span>
            </div>
          </div>
        </div>
      );
    }
    const fraction = total > 0 ? timerRemaining / total : 0;
    const isWarning = timerRemaining <= 10 && timerRemaining > 0;

    let barColor = 'bg-primary';
    if (isPaused) barColor = 'bg-yellow-500';
    else if (isWarning) barColor = 'bg-red-500';

    return (
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1.5 w-full bg-muted/60">
          <div
            className={`h-full transition-none ${barColor}`}
            style={{ width: `${Math.max(0, Math.min(100, fraction * 100))}%` }}
          />
        </div>
        <div className="flex justify-between px-4 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {wsConnected ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Live
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                Connecting...
              </>
            )}
          </div>
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
        return <SessionJoinForm onJoin={handleJoinSession} prefilledCode={prefilledCode} />;

      case 'question': {
        if (!currentQuestion) return null;
        return (
          <div className="relative">
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
                question={{ text: currentQuestion.text, description: currentQuestion.description, image: getQuestionImage(currentQuestion), options: currentQuestion.options, responseCount: 0 }}
                onSubmit={(r) => handleSubmitResponse({ optionId: r.optionId })}
              />
            )}
            {currentQuestion.type === 'open-text' && (
              <OpenTextQuestion
                question={{ text: currentQuestion.text, description: currentQuestion.description, image: getQuestionImage(currentQuestion), maxLength: 500, minLength: 1, responseCount: 0 }}
                onSubmit={(r) => handleSubmitResponse({ text: r.text })}
              />
            )}
            {currentQuestion.type === 'rating' && (
              <RatingScaleQuestion
                question={{ text: currentQuestion.text, description: currentQuestion.description, image: getQuestionImage(currentQuestion), scale: currentQuestion.scale, labels: currentQuestion.labels, displayStyle: currentQuestion.displayStyle || 'numbers', responseCount: 0 }}
                onSubmit={(r) => handleSubmitResponse({ rating: r.rating })}
              />
            )}
            {currentQuestion.type === 'word-cloud' && (
              <WordCloudQuestion
                question={{ text: currentQuestion.text, description: currentQuestion.description, image: getQuestionImage(currentQuestion), maxWords: 5, responseCount: 0 }}
                onSubmit={(r) => handleSubmitResponse({ words: r.words })}
              />
            )}
          </div>
        );
      }

      case 'submitted':
        return <SubmissionConfirmation message="Your response has been recorded successfully" />;

      case 'waiting':
        return <WaitingState message="Waiting for the presenter to start..." showSpinner />;

      case 'ended':
        return <SessionEndedState onJoinNew={handleJoinNewSession} />;

      case 'error':
        return <ErrorState error={error} onRetry={handleRetry} />;

      default:
        return null;
    }
  };

  const getSessionTitle = () => {
    if (sessionState === 'join' || !participantSession) return null;
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
                          : index < currentQuestion.number - 1
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
