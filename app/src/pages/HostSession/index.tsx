// src/pages/HostSession/index.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { SessionService } from '../../service/session.service';
import { useSessionSocket } from '../../lib/useSessionSocket';
import AppIcon from '../../components/AppIcon';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useToast } from '../../hooks/use-toast';
import QuestionDisplay from './components/QuestionDisplay';
import ControlPanel from './components/ControlPanel';
import PauseOverlay from './components/PauseOverlay';
import EndSessionModal from './components/EndSessionModal';
import type {
  Session,
  Question,
  QuestionResponses,
  Participant,
} from '../../lib/presentation.types';

const HostSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [responses, setResponses] = useState<Record<string, QuestionResponses>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  // ── Stable refs ──────────────────────────────────────────────────────────
  const timerRef = useRef<number>(0);
  const timerActiveRef = useRef<boolean>(false);
  const timerIntervalRef = useRef<number | undefined>(undefined);
  const isPausedRef = useRef<boolean>(false);
  const sessionRef = useRef<Session | null>(null);
  const currentQuestionRef = useRef<Question | undefined>(undefined);
  const hasLoadedRef = useRef<boolean>(false);

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

  const currentQuestion: Question | undefined =
    currentQuestionIndex >= 0
      ? session?.presentation?.questions?.[currentQuestionIndex]
      : undefined;

  const currentResponses: QuestionResponses = currentQuestion
    ? responses[currentQuestion.id] || {}
    : {};

  const isCurrentMultipleChoice = currentQuestion?.type === 'multiple-choice';

  const getQuestionTimeLimit = (question?: Question | null): number | null => {
    if (!question || question.timeLimit == null || question.timeLimit <= 0) return null;
    return question.timeLimit;
  };

  const applyQuestionTimer = (question?: Question | null) => {
    const limit = getQuestionTimeLimit(question);
    setTimer(limit ?? 0);
    timerRef.current = limit ?? 0;
    setTimerActive(limit !== null);
    timerActiveRef.current = limit !== null;
    return limit;
  };

  // Keep refs in sync
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);
  useEffect(() => { timerRef.current = timer; }, [timer]);
  useEffect(() => { timerActiveRef.current = timerActive; }, [timerActive]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // ── Real-time: receive RESPONSE_SUBMITTED from audience ─────────────────
  const handleWsMessage = useCallback(
    (msg: { type: string; payload?: Record<string, unknown> }) => {
      if (msg.type === 'RESPONSE_SUBMITTED') {
        const q = currentQuestionRef.current;
        const sess = sessionRef.current;
        if (q && sess) {
          SessionService.getQuestionResponses(sess.id, q.id).then((updated) => {
            setResponses((prev) => ({ ...prev, [q.id]: updated }));
          });
        }
      }
    },
    []
  );

  // Single hook call — used for both sending (sendMessage) and receiving
  const { sendMessage, connected: wsConnected } = useSessionSocket({
    sessionId: session?.id ?? null,
    role: 'host',
    onMessage: handleWsMessage,
    enabled: !!session,
  });

  // ── Timer interval ───────────────────────────────────────────────────────
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = undefined;
    }

    if (
      currentQuestionIndex >= 0 &&
      timerActiveRef.current &&
      timerRef.current > 0
    ) {
      timerIntervalRef.current = window.setInterval(() => {
        if (!isPausedRef.current && timerActiveRef.current && timerRef.current > 0) {
          timerRef.current -= 1;
          setTimer(timerRef.current);

          if (timerRef.current <= 0) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = undefined;
            timerActiveRef.current = false;
            setTimerActive(false);
            setShowResults(true);
            toast({ title: "Time's Up!", description: 'Showing results...' });
          }
        }
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = undefined;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[currentQuestionIndex, timerActive, timerRef.current, isPaused]);

  useEffect(() => () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); }, []);

  // ── Load session ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !user || hasLoadedRef.current) return;

    const loadSession = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: existingSession, error: sessionFetchError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!sessionFetchError && existingSession) {
          const { data: contextData } = await supabase
            .from('contexts')
            .select(`
              id, title,
              questions (
                id, title, description, type, points, time_limit,
                options, scale, labels, display_style, image_url, question_order,
                show_results_instantly
              )
            `)
            .eq('id', existingSession.context_id)
            .maybeSingle();

          const questionsArray = contextData?.questions || [];
          const questions: Question[] = questionsArray
            .sort((a: any, b: any) => a.question_order - b.question_order)
            .map((q: any, idx: number) => ({
              id: q.id,
              number: idx + 1,
              type: mapQuestionType(q.type),
              text: q.title,
              description: q.description,
              timeLimit: q.time_limit,
              options: q.options,
              scale: q.scale,
              labels: q.labels,
              points: q.points,
              image: q.image_url,
              displayStyle: q.display_style,
              showResultsInstantly: q.show_results_instantly ?? false,
            }));

          const sessionData: Session = {
            id: existingSession.id,
            code: existingSession.code,
            participantCount: existingSession.participant_count,
            startTime: new Date(existingSession.created_at),
            presentation: {
              id: existingSession.context_id,
              title: contextData?.title || 'Untitled Session',
              questions,
            },
            status: existingSession.status as 'WAITING' | 'ACTIVE' | 'PAUSED' | 'ENDED',
            currentQuestionIndex: existingSession.current_question_index,
          };

          setSession(sessionData);
          setCurrentQuestionIndex(existingSession.current_question_index);
          setIsPaused(existingSession.is_paused || false);
          isPausedRef.current = existingSession.is_paused || false;

          // Restore timer if rejoining mid-session
          if (
            existingSession.current_question_index >= 0 &&
            existingSession.status === 'ACTIVE'
          ) {
            const currentQ = questions[existingSession.current_question_index];
            if (currentQ) {
              if (currentQ.showResultsInstantly) {
                setShowResults(true);
              }

              const limit = getQuestionTimeLimit(currentQ);
              let remaining = limit ?? 0;
              if (limit === null) {
                remaining = 0;
              } else if (existingSession.is_paused && existingSession.timer_paused_remaining != null) {
                remaining = existingSession.timer_paused_remaining;
              } else if (
                !existingSession.is_paused &&
                existingSession.timer_resumed_at != null &&
                existingSession.timer_paused_remaining != null
              ) {
                const elapsedSinceResume = Math.floor(
                  (Date.now() - new Date(existingSession.timer_resumed_at).getTime()) / 1000
                );
                remaining = Math.max(0, existingSession.timer_paused_remaining - elapsedSinceResume);
              } else if (existingSession.current_question_started_at) {
                const elapsed = Math.floor(
                  (Date.now() - new Date(existingSession.current_question_started_at).getTime()) / 1000
                );
                remaining = Math.max(0, limit - elapsed);
              } else {
                remaining = limit;
              }

              setTimer(remaining);
              timerRef.current = remaining;
              const shouldBeActive = limit !== null && !existingSession.is_paused && remaining > 0;
              setTimerActive(shouldBeActive);
              timerActiveRef.current = shouldBeActive;
            }
          }

          const participantsData = await SessionService.getParticipants(existingSession.id);
          setParticipants(participantsData);

          if (existingSession.current_question_index >= 0) {
            const currentQ = questions[existingSession.current_question_index];
            if (currentQ) {
              const responsesData = await SessionService.getQuestionResponses(
                existingSession.id,
                currentQ.id
              );
              setResponses((prev) => ({ ...prev, [currentQ.id]: responsesData }));
            }
          }

          hasLoadedRef.current = true;
        } else {
          // id is a context ID — create a new session
          const { data: contextData, error: contextError } = await supabase
            .from('contexts')
            .select('id, title')
            .eq('id', id)
            .maybeSingle();

          if (contextError || !contextData) {
            throw new Error(`Context "${id}" not found.`);
          }

          const newSession = await SessionService.createSession({ contextId: id, hostId: user.id });
          if (!newSession) throw new Error('Failed to create session');

          hasLoadedRef.current = true;
          navigate(`/session/${newSession.id}/host`, { replace: true });
          return;
        }
      } catch (err: any) {
        console.error('Failed to load session:', err);
        setError(err.message || 'Failed to load session');
        toast({
          title: 'Error',
          description: err.message || 'Failed to load session',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  // ── Supabase subscriptions: participants + response fallback ────────────
  useEffect(() => {
    if (!session) return;

    const participantsChannel = supabase
      .channel(`host-participants-${session.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'participants', filter: `session_id=eq.${session.id}` },
        (payload) => {
          const p = payload.new as any;
          setParticipants((prev) => {
            if (prev.find((x) => x.id === p.id)) return prev;
            return [
              ...prev,
              {
                id: p.id,
                name: p.name,
                score: p.score,
                avatar: p.avatar_url,
                isAnonymous: p.is_anonymous,
                joinedAt: new Date(p.joined_at),
              },
            ];
          });
          toast({ title: 'New Participant', description: `${p.name} joined the session` });
        }
      )
      .subscribe();

    // Supabase fallback — catches responses when the broadcast channel is reconnecting
    const responsesChannel = supabase
      .channel(`host-responses-${session.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'responses', filter: `session_id=eq.${session.id}` },
        async () => {
          const q = currentQuestionRef.current;
          const sess = sessionRef.current;
          if (q && sess) {
            const updated = await SessionService.getQuestionResponses(sess.id, q.id);
            setResponses((prev) => ({ ...prev, [q.id]: updated }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(responsesChannel);
    };
  }, [session, toast]);

  const applyQuestionSettings = (question?: Question) => {
    if (question?.showResultsInstantly) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
    setShowCorrectAnswer(false);
  };

  const handleStart = async (): Promise<void> => {
    if (!session) return;
    const firstQuestion = session.presentation.questions[0];
    if (!firstQuestion) {
      toast({ title: 'Error', description: 'No questions found', variant: 'destructive' });
      return;
    }

    const startedAt = new Date().toISOString();
    await SessionService.updateSessionStatus(session.id, 'ACTIVE');
    await SessionService.setCurrentQuestion(session.id, 0, firstQuestion.id);

    setCurrentQuestionIndex(0);
    const timeLimit = applyQuestionTimer(firstQuestion);
    applyQuestionSettings(firstQuestion);
    setIsPaused(false);
    isPausedRef.current = false;

    sendMessage({
      type: 'SESSION_START',
      payload: {
        sessionId: session.id,
        questionId: firstQuestion.id,
        questionIndex: 0,
        timeLimit,
        startedAt,
      },
    });

    toast({ title: 'Session Started', description: 'Participants can now join and answer' });
  };

  const handlePrevious = async (): Promise<void> => {
    if (!session || currentQuestionIndex <= 0) return;

    const newIndex = currentQuestionIndex - 1;
    const prevQuestion = session.presentation.questions[newIndex];
    const startedAt = new Date().toISOString();

    await SessionService.setCurrentQuestion(session.id, newIndex, prevQuestion?.id);

    setCurrentQuestionIndex(newIndex);
    const timeLimit = applyQuestionTimer(prevQuestion);
    applyQuestionSettings(prevQuestion);
    setIsPaused(false);
    isPausedRef.current = false;

    sendMessage({
      type: 'QUESTION_CHANGE',
      payload: {
        questionId: prevQuestion?.id,
        questionIndex: newIndex,
        timeLimit,
        startedAt,
      },
    });
  };

  const handleNext = async (): Promise<void> => {
    if (!session) return;

    if (currentQuestionIndex < session.presentation.questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      const nextQuestion = session.presentation.questions[newIndex];
      const startedAt = new Date().toISOString();

      await SessionService.setCurrentQuestion(session.id, newIndex, nextQuestion?.id);

      setCurrentQuestionIndex(newIndex);
      const timeLimit = applyQuestionTimer(nextQuestion);
      applyQuestionSettings(nextQuestion);
      setIsPaused(false);
      isPausedRef.current = false;

      sendMessage({
        type: 'QUESTION_CHANGE',
        payload: {
          questionId: nextQuestion?.id,
          questionIndex: newIndex,
          timeLimit,
          startedAt,
        },
      });
    } else {
      sendMessage({ type: 'SESSION_END', payload: {} });
      await SessionService.updateSessionStatus(session.id, 'ENDED');
      navigate(`/results/${session.id}`);
    }
  };

  const handlePause = async (): Promise<void> => {
    if (!session) return;

    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    isPausedRef.current = newPausedState;

    if (newPausedState) {
      setTimerActive(false);
      timerActiveRef.current = false;
      sendMessage({ type: 'PAUSE', payload: { remainingSeconds: timerRef.current } });
    } else {
      setTimerActive(true);
      timerActiveRef.current = true;
      sendMessage({
        type: 'RESUME',
        payload: { remainingSeconds: timerRef.current, resumedAt: new Date().toISOString() },
      });
    }

    const success = await SessionService.togglePause(session.id, newPausedState, timerRef.current);
    if (!success) {
      // Roll back
      setIsPaused(!newPausedState);
      isPausedRef.current = !newPausedState;
      setTimerActive(newPausedState);
      timerActiveRef.current = newPausedState;
      toast({ title: 'Error', description: 'Failed to pause/resume session', variant: 'destructive' });
    }
  };

  const handleRestart = async (): Promise<void> => {
    if (!session) return;
    const firstQuestion = session.presentation.questions[0];
    const startedAt = new Date().toISOString();

    await SessionService.setCurrentQuestion(session.id, 0, firstQuestion?.id);

    setCurrentQuestionIndex(0);
    const timeLimit = applyQuestionTimer(firstQuestion);
    applyQuestionSettings(firstQuestion);
    setIsPaused(false);
    isPausedRef.current = false;

    sendMessage({
      type: 'QUESTION_CHANGE',
      payload: {
        questionId: firstQuestion?.id,
        questionIndex: 0,
        timeLimit,
        startedAt,
      },
    });

    toast({ title: 'Session Restarted', description: 'Reset to the first question' });
  };

  const handleEnd = (): void => setIsEndModalOpen(true);

  const handleConfirmEnd = async (): Promise<void> => {
    if (!session) return;
    sendMessage({ type: 'SESSION_END', payload: {} });
    await SessionService.updateSessionStatus(session.id, 'ENDED');
    navigate(`/results/${session.id}`);
  };

  const handleToggleQuestionResults = (): void => {
    setShowResults((prev) => !prev);
  };

  const handleToggleCorrectAnswer = (): void => {
    setShowCorrectAnswer((prev) => !prev);
  };

  const handleViewFinalResults = (): void => {
    if (session) navigate(`/results/${session.id}`);
  };

  const handleCopyLink = (): void => {
    const joinUrl = `${window.location.origin}/audience-participation?code=${session?.code}`;
    navigator.clipboard.writeText(joinUrl);
    toast({ title: 'Link Copied!', description: 'Share this link with participants to join' });
  };

  const responseProgress =
    currentQuestion && session
      ? Math.min(
          100,
          Math.round(
            (Object.keys(currentResponses).length / (session.participantCount || 1)) * 100
          )
        )
      : 0;

  // ── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <AppIcon name="Loader2" size={32} className="text-primary animate-spin" />
          </div>
          <p className="text-muted-foreground">Setting up your session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <AppIcon name="AlertCircle" size={40} className="text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Session Error</h2>
          <p className="text-muted-foreground mb-6">{error || 'Session not found.'}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
            <Button onClick={() => navigate('/create')}>Create New Context</Button>
          </div>
        </div>
      </div>
    );
  }

  // LOBBY VIEW
  if (currentQuestionIndex === -1) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center text-white p-4">
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-8">
            <div>
              <Badge variant="outline" className="text-white border-white mb-4 bg-white/20">
                Join at {window.location.host}
              </Badge>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-2">
                Code: {session.code}
              </h1>
              <p className="text-xl opacity-90 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                </span>
                Waiting for participants...
              </p>
            </div>

            <Card className="p-6 bg-white/10 border-white/20 backdrop-blur-md text-white">
              <div className="flex items-center gap-6">
                <div className="h-32 w-32 bg-white rounded-lg flex items-center justify-center text-black">
                  <AppIcon name="QrCode" size={80} />
                </div>
                <div className="space-y-3">
                  <div className="text-sm uppercase tracking-wider opacity-75">Scan to join</div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full bg-white text-primary hover:bg-white/90"
                    onClick={handleCopyLink}
                  >
                    <AppIcon name="Copy" className="mr-2 h-4 w-4" /> Copy Link
                  </Button>
                  <p className="text-xs opacity-75">or enter code: {session.code}</p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">{session.presentation.questions.length}</div>
                <div className="text-sm opacity-75">Questions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">{participants.length}</div>
                <div className="text-sm opacity-75">Participants</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 h-125 flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 font-bold text-lg">
                <AppIcon name="Users" className="h-5 w-5" />
                <span>{participants.length} Joined</span>
              </div>
              <div className="flex items-center gap-2">
                {wsConnected && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Live
                  </div>
                )}
                <Badge variant="outline" className="text-white border-white">
                  {session.code}
                </Badge>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
              <AnimatePresence>
                {participants.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Avatar className="h-8 w-8 border-2 border-white/20">
                      <AvatarImage src={p.avatar} />
                      <AvatarFallback>{p.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium flex-1">{p.name}</span>
                    {p.score > 0 && (
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">
                        {p.score} pts
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <Button
              size="lg"
              className="w-full mt-4 bg-white text-primary hover:bg-white/90 font-bold text-lg shadow-xl"
              onClick={handleStart}
            >
              Start Presentation <AppIcon name="Play" className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE QUESTION VIEW
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6 bg-card sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <AppIcon name="Radio" size={16} className="text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-foreground">{session.presentation.title}</span>
            <span className="text-xs text-muted-foreground ml-2">• {session.code}</span>
            {isPaused && (
              <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded">
                Paused
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {wsConnected && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Real-time
            </div>
          )}
          {currentQuestion && getQuestionTimeLimit(currentQuestion) === null && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
              <AppIcon name="Infinity" size={16} className="text-primary" />
              <span className="font-semibold text-primary">No timer</span>
            </div>
          )}
          {currentQuestion && getQuestionTimeLimit(currentQuestion) !== null && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                isPaused ? 'bg-yellow-500/20' : 'bg-muted'
              }`}
            >
              <AppIcon name="Clock" size={16} className="text-primary" />
              <span className="font-mono font-bold text-primary">{timer}s</span>
            </div>
          )}
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {currentQuestionIndex + 1} / {session.presentation.questions.length}
          </Badge>
          <Button variant="destructive" size="sm" onClick={() => navigate('/dashboard')}>
            Exit
          </Button>
        </div>
      </header>

      {currentQuestion && getQuestionTimeLimit(currentQuestion) !== null && (
        <div className="h-1 w-full bg-muted/40">
          {isPaused ? (
            <div
              className="h-full bg-yellow-500"
              style={{ width: `${Math.max(0, (timer / (getQuestionTimeLimit(currentQuestion) || 1)) * 100)}%` }}
            />
          ) : timerActive ? (
            <motion.div
              className="h-full bg-primary origin-left"
              initial={false}
              animate={{ scaleX: timer / (getQuestionTimeLimit(currentQuestion) || 1) }}
              transition={{ duration: 1, ease: 'linear' }}
              style={{ transformOrigin: 'left' }}
            />
          ) : null}
        </div>
      )}

      <main className="flex-1 flex flex-col items-center p-4 md:p-6 lg:p-8 relative overflow-hidden">
        <div className="max-w-5xl w-full">
          {currentQuestion && (
            <QuestionDisplay
              question={currentQuestion}
              responses={currentResponses}
              showResults={showResults}
              showCorrectAnswer={showCorrectAnswer}
            />
          )}

          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card p-6 rounded-xl border border-border shadow-xl mt-8"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <AppIcon name="Trophy" size={24} className="text-yellow-600" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Ready for next question?</div>
                    <div className="text-sm text-muted-foreground">
                      {participants.slice(0, 3).map((p) => p.name).join(', ')} and others are waiting
                    </div>
                  </div>
                </div>
                <Button size="lg" onClick={handleNext} className="min-w-37.5">
                  {currentQuestionIndex === session.presentation.questions.length - 1 ? (
                    <>
                      View Results <AppIcon name="BarChart3" className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Next Question <AppIcon name="ChevronRight" className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <ControlPanel
        sessionCode={session.code}
        participantCount={participants.length}
        responseProgress={responseProgress}
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={session.presentation.questions.length}
        isPaused={isPaused}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onPause={handlePause}
        onRestart={handleRestart}
        onEnd={handleEnd}
        onToggleQuestionResults={handleToggleQuestionResults}
        isShowingResults={showResults}
        showCorrectAnswer={showCorrectAnswer}
        onToggleCorrectAnswer={handleToggleCorrectAnswer}
        isMultipleChoice={isCurrentMultipleChoice}
      />

      {isPaused && <PauseOverlay onResume={handlePause} />}

      <EndSessionModal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        onConfirm={handleConfirmEnd}
        onViewResults={handleViewFinalResults}
      />
    </div>
  );
};

export default HostSession;
