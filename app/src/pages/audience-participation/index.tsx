// src/pages/audience-participation/index.tsx
// COMPLETE FILE — original behavior preserved + 100% Logique elimination flow.
//
// Updates in this version:
//   1. When a participant submits a WRONG answer, after the round timer ends
//      we first show the SpectatorMode with the correct answer highlighted in
//      green and the participant's wrong answer highlighted in red for ~2
//      seconds, then the EliminationOverlay slides in. Correct answers keep
//      their original behaviour (no answer reveal).
//   2. If the host moves on to the next question while the EliminationOverlay
//      is still visible, the overlay is auto-dismissed and the participant
//      drops straight into spectator mode for the new round.
//   3. The AnswerFeedback component has been removed from this page (it was
//      not behaving correctly).

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSessionSocket, SESSION_EVENTS } from '../../lib/useSessionSocket';
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
import type {
  Question,
  Session,
  GameState,
  EliminationEvent,
  Participant,
} from '../../lib/presentation.types';
import AppIcon from '../../components/AppIcon';

// ── 100% Logique additions ──────────────────────────────────────────────────
import { EliminationOverlay } from './components/EliminationOverlay';
import { SpectatorMode } from './components/SpectatorMode';
import { LiveLeaderboard } from './components/LiveLeaderboard';
import { WinnerCelebration } from './components/WinnerCelebration';
import { CentPourCentBackground } from './components/CentPourCentBackground';
import { SessionService } from '../../service/session.service.ts';
import '../../styles/cent-pour-cent-logique.css';

type SessionState = 'join' | 'question' | 'submitted' | 'waiting' | 'ended' | 'error';

interface ParticipantSession {
  session: Session;
  participantId: string;
  participantName: string;
}

// Duration of the "answer reveal" window shown to a wrongly-answering
// participant before the EliminationOverlay slides in.
const ANSWER_REVEAL_DURATION_MS = 2000;

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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
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

  // ── 100% Logique state ────────────────────────────────────────────────────
  const [gameState, setGameState] = useState<GameState>({
    alive: [],
    eliminated: [],
    winner: null,
    totalPlayers: 0,
    currentRound: 0,
    history: [],
  });
  const [eliminationEvents, setEliminationEvents] = useState<EliminationEvent[]>([]);
  const [isEliminated, setIsEliminated] = useState<boolean>(false);
  const [eliminatedAtRound, setEliminatedAtRound] = useState<number>(0);
  const [showEliminationOverlay, setShowEliminationOverlay] = useState<boolean>(false);
  // Becomes true ONLY when the question timer ends AND the participant had
  // submitted a correct answer. Drives the "Bonne réponse !" screen so it no
  // longer pops up the instant they answer — they sit in a spectator-style
  // waiting view until the round closes.
  const [showCorrectAnswerFeedback, setShowCorrectAnswerFeedback] = useState<boolean>(false);
  // Local state holding the winner once the host explicitly reveals it.
  // The WinnerCelebration overlay is rendered ONLY when this is set —
  // we no longer auto-show it from gameState.winner.
  const [revealedWinner, setRevealedWinner] = useState<Participant | null>(null);

  // ── Answer-reveal state (NEW) ─────────────────────────────────────────────
  // The option id this participant submitted for the CURRENT question. Reset
  // whenever a new question starts. Used by SpectatorMode to draw the red
  // border around a wrong submitted answer during the reveal window.
  const [submittedOptionId, setSubmittedOptionId] = useState<string | null>(null);
  // When true, SpectatorMode highlights the correct option in green and the
  // participant's submitted option in red. Only flipped on for participants
  // who answered incorrectly, for ~2s before the EliminationOverlay opens.
  const [showAnswerReveal, setShowAnswerReveal] = useState<boolean>(false);

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
  const isEliminatedRef = useRef<boolean>(false);
  // Tracks pending timeouts so that a question change can cancel the
  // "answer reveal → elimination overlay" sequence cleanly.
  const answerRevealTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => { participantSessionRef.current = participantSession; }, [participantSession]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);
  useEffect(() => { sessionStateRef.current = sessionState; }, [sessionState]);
  useEffect(() => { questionClosedRef.current = questionClosed; }, [questionClosed]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { questionActiveRef.current = questionActive; }, [questionActive]);
  useEffect(() => { timerRemainingRef.current = timerRemaining; }, [timerRemaining]);
  useEffect(() => { toastRef.current = toast; }, [toast]);
  useEffect(() => {
    isEliminatedRef.current = isEliminated;
  }, [isEliminated]);

  const prefilledCode = (searchParams.get('code') || '').toUpperCase();

  useEffect(() => {
    if (prefilledCode) sessionStorage.setItem('pending-session-code', prefilledCode);
  }, [prefilledCode]);

  const [contextMeta, setContextMeta] = useState<{
    gameMode: 'standard' | 'elimination';
    themeId: string;
  }>({ gameMode: 'standard', themeId: 'default' });

  const isEliminationRef = useRef<boolean>(false);

  const sessionAny = participantSession?.session as any;
  const isElimination: boolean = contextMeta.gameMode === 'elimination';

  useEffect(() => {
    isEliminationRef.current = isElimination;
  }, [isElimination]);

  const themeId: string = contextMeta.themeId || 'default';
  const themeClass = themeId === 'cent-pour-cent-logique' ? 'cpl-theme' : '';

  // Helper: cancel any in-flight "answer reveal → overlay" timer.
  const clearAnswerRevealTimeout = useCallback(() => {
    if (answerRevealTimeoutRef.current !== undefined) {
      clearTimeout(answerRevealTimeoutRef.current);
      answerRevealTimeoutRef.current = undefined;
    }
  }, []);

  // Pull game_mode + theme from the contexts table once we know the session.
  useEffect(() => {
    const sessionId = participantSession?.session?.id;
    if (!sessionId) return;

    let cancelled = false;

    const loadMetadata = async () => {
      try {
        const { data: sessionRow, error: sessionErr } = await supabase
          .from('sessions')
          .select('context_id')
          .eq('id', sessionId)
          .maybeSingle();

        if (sessionErr || !sessionRow?.context_id) return;

        const { data: ctx, error: ctxErr } = await supabase
          .from('contexts')
          .select('game_mode, theme')
          .eq('id', sessionRow.context_id)
          .maybeSingle();

        if (ctxErr || !ctx || cancelled) return;

        const gameModeValue = ctx?.game_mode === 'elimination' ? 'elimination' : 'standard';
        const themeValue = ctx?.theme || 'default';

        setContextMeta({
          gameMode: gameModeValue,
          themeId: themeValue
        });

        isEliminationRef.current = gameModeValue === 'elimination';

      } catch (err) {
        console.error('[Metadata] Error:', err);
      }
    };

    loadMetadata();

    return () => {
      cancelled = true;
    };
  }, [participantSession?.session?.id]);

  // Refresh game state frequently for elimination mode
  useEffect(() => {
    if (!isElimination || !participantSession?.session.id) return;

    let isMounted = true;

    const refreshGameState = async () => {
      if (!isMounted) return;
      try {
        const newState = await SessionService.getGameState(participantSession.session.id);
        if (isMounted) {
          console.log('[Leaderboard] Refreshing game state:', {
            alive: newState.alive.length,
            eliminated: newState.eliminated.length,
            total: newState.totalPlayers
          });
          setGameState(newState);

          // Check if current user is eliminated
          const me = newState.eliminated.find(p => p.id === participantSession.participantId);
          if (me && !isEliminated) {
            setIsEliminated(true);
            setEliminatedAtRound(me.eliminatedAtRound ?? newState.currentRound);
          }
        }
      } catch (err) {
        console.error('Failed to refresh game state:', err);
      }
    };

    // Refresh immediately
    refreshGameState();

    // Then refresh every 2 seconds
    const interval = setInterval(refreshGameState, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isElimination, participantSession?.session.id, participantSession?.participantId]);

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
  // Also clear any pending answer-reveal timeout on unmount.
  useEffect(() => () => clearAnswerRevealTimeout(), [clearAnswerRevealTimeout]);

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
      // New round → clear any leftover post-timer feedback / reveal state
      // from the previous one.
      setShowCorrectAnswerFeedback(false);
      setSubmittedOptionId(null);
      setShowAnswerReveal(false);
      clearAnswerRevealTimeout();
      // If the EliminationOverlay was still visible from the previous round
      // (the host moved on before the participant clicked either button),
      // dismiss it so the participant drops into spectator mode for the
      // new question.
      setShowEliminationOverlay(false);
      setSessionState('question');
      sessionStateRef.current = 'question';
      if (limit !== null && remaining > 0) startLocalCountdown();
    },
    [startLocalCountdown, clearAnswerRevealTimeout]
  );

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

  // Hydrate full game state on join
  useEffect(() => {
    if (!participantSession?.session.id || !isElimination) return;
    SessionService.getGameState(participantSession.session.id)
      .then((state: GameState) => {
        setGameState(state);
        const me = state.eliminated.find(
          (p: any) => p.id === participantSession.participantId,
        );
        if (me) {
          setIsEliminated(true);
          setEliminatedAtRound(me.eliminatedAtRound ?? state.currentRound);
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to hydrate game state:', err);
      });
  }, [participantSession?.session.id, participantSession?.participantId, isElimination]);

  // Broadcast message handler
  const handleBroadcast = useCallback(
    (msg: { type: string; payload?: Record<string, unknown> }) => {
      const { type, payload } = msg;

      switch (type) {
        case 'SESSION_START':
        case 'QUESTION_CHANGE': {
          const questionId = payload?.questionId as string | undefined;
          const questionIndex = (payload?.questionIndex as number) ?? 0;
          const timeLimit = payload?.timeLimit as number | null | undefined;
          if (questionId) {
            stopLocalCountdown();
            // Auto-dismiss the EliminationOverlay (and cancel any pending
            // reveal-then-overlay sequence) if the host moves on to the
            // next question before the participant chose a button. The
            // participant will fall through into spectator mode for the
            // new round via `applyQuestion` resetting state.
            clearAnswerRevealTimeout();
            setShowAnswerReveal(false);
            setShowEliminationOverlay(false);
            loadQuestion(questionId, questionIndex, timeLimit, undefined, false);
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
          clearAnswerRevealTimeout();
          setShowAnswerReveal(false);
          setShowEliminationOverlay(false);
          setSessionState('ended');
          sessionStateRef.current = 'ended';
          break;
        }

        case SESSION_EVENTS.PLAYER_ELIMINATED: {
          const ev = payload as unknown as EliminationEvent;
          console.log('[Leaderboard] Player eliminated event received:', ev);
          setEliminationEvents((prev) => [...prev, ev]);

          // Immediately refresh game state
          if (participantSessionRef.current?.session.id) {
            SessionService.getGameState(participantSessionRef.current.session.id)
              .then((newState) => {
                console.log('[Leaderboard] Updated game state after elimination:', {
                  alive: newState.alive.length,
                  eliminated: newState.eliminated.length
                });
                setGameState(newState);

                // Check if current user was eliminated
                const me = newState.eliminated.find(p => p.id === participantSessionRef.current?.participantId);
                if (me && !isEliminatedRef.current) {
                  setIsEliminated(true);
                  setEliminatedAtRound(me.eliminatedAtRound ?? newState.currentRound);
                }
              })
              .catch((err) => console.error('Failed to refresh game state:', err));
          }
          break;
        }

        case SESSION_EVENTS.GAME_STATE_UPDATE: {
          setGameState(payload as unknown as GameState);
          break;
        }

        case SESSION_EVENTS.GAME_END: {
          if (participantSessionRef.current?.session.id) {
            SessionService.getGameState(participantSessionRef.current.session.id)
              .then(setGameState)
              .catch((err) => console.error('Failed to refresh game state:', err));
          }
          break;
        }

        case SESSION_EVENTS.WINNER_REVEAL: {
          // Host clicked "Show Winner" — render the celebration overlay
          // for everyone using the broadcast payload.
          const winner = payload as unknown as Participant;
          if (winner && winner.id) {
            setRevealedWinner(winner);
            // Make sure the elimination overlay is dismissed so the
            // winner overlay can take the whole screen.
            clearAnswerRevealTimeout();
            setShowAnswerReveal(false);
            setShowEliminationOverlay(false);
          }
          break;
        }

        default:
          break;
      }
    },
    [loadQuestion, startLocalCountdown, stopLocalCountdown, clearAnswerRevealTimeout]
  );

  const { connected: wsConnected, sendMessage } = useSessionSocket({
    sessionId: participantSession?.session.id ?? null,
    role: 'audience',
    onMessage: handleBroadcast,
    enabled: !!participantSession,
  });

  // ── EliminationOverlay trigger ────────────────────────────────────────────
  // The overlay is shown when the question timer ends, NOT when the
  // participant submits a wrong answer. If the participant did not submit
  // anything in time, they are auto-eliminated (no answer = wrong) and
  // the overlay is then shown.
  //
  // For wrongly-answering participants we now insert a brief "answer
  // reveal" window first: SpectatorMode highlights the correct option in
  // green and the submitted (wrong) option in red for ANSWER_REVEAL_DURATION_MS,
  // then the EliminationOverlay slides in.
  useEffect(() => {
    if (!questionClosed) return;
    if (!isElimination) return;
    if (!participantSession || !currentQuestion) return;
    // Already a winner has been revealed → never show this overlay.
    if (revealedWinner) return;

    const ps = participantSession;
    const q = currentQuestion;

    // Case A: I already answered correctly → no elimination overlay,
    // but NOW (timer is up) we flip on the "Bonne réponse !" screen.
    // It was held back until this moment so the participant sat in a
    // spectator-style waiting view right after submitting.
    if (sessionStateRef.current === 'submitted') {
      setShowCorrectAnswerFeedback(true);
      return;
    }

    // Case B: I submitted a wrong answer earlier (already marked eliminated).
    // The overlay must fire ONLY on the round I was actually eliminated in.
    // Otherwise — once I've chosen "Stay as spectator" — every subsequent
    // round's timer end would pop the overlay back up.
    //
    // IMPORTANT: don't read the round number from `ps.session` — that's a
    // snapshot captured at join time and never updates. Use the live
    // `currentQuestion.number` (set every time `loadQuestion` runs) with a
    // fallback to `gameState.currentRound`.
    if (isEliminatedRef.current) {
      const liveRoundNumber =
        currentQuestionRef.current?.number ?? gameState.currentRound ?? 0;
      if (eliminatedAtRound === liveRoundNumber) {
        // Reveal the correct answer (green border) and the wrong submitted
        // answer (red border) for ~2 seconds before opening the overlay.
        setShowAnswerReveal(true);
        clearAnswerRevealTimeout();
        answerRevealTimeoutRef.current = window.setTimeout(() => {
          setShowAnswerReveal(false);
          setShowEliminationOverlay(true);
          answerRevealTimeoutRef.current = undefined;
        }, ANSWER_REVEAL_DURATION_MS);
      }
      return;
    }

    // Case C: I never submitted before time ran out → auto-eliminate.
    // Same caveat as Case B — read the round number from the live question.
    const roundNumber =
      currentQuestionRef.current?.number ?? gameState.currentRound ?? 0;
    (async () => {
      try {
        const eliminated = await SessionService.eliminateParticipant({
          sessionId: ps.session.id,
          participantId: ps.participantId,
          questionId: q.id,
          roundNumber,
        });

        if (eliminated) {
          sendMessage({
            type: SESSION_EVENTS.PLAYER_ELIMINATED,
            payload: eliminated as unknown as Record<string, unknown>,
          });
          setEliminatedAtRound(eliminated.roundNumber);
          setIsEliminated(true);
        }
        // Show the correct answer briefly (no submitted option to mark in
        // red since this participant never answered) and then open the
        // EliminationOverlay.
        setShowAnswerReveal(true);
        clearAnswerRevealTimeout();
        answerRevealTimeoutRef.current = window.setTimeout(() => {
          setShowAnswerReveal(false);
          setShowEliminationOverlay(true);
          answerRevealTimeoutRef.current = undefined;
        }, ANSWER_REVEAL_DURATION_MS);
      } catch (err) {
        console.error('Auto-eliminate on timer end failed:', err);
        // Even on failure, show the overlay so the user can opt to leave.
        setShowEliminationOverlay(true);
      }
    })();
    // We intentionally only react to questionClosed flipping to true.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionClosed]);

  // Dedicated ENDED watcher
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
  }, [participantSession?.session.id]);

  // Supabase fallback
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
            // Same auto-dismiss logic as the broadcast path: if the host
            // advances while the EliminationOverlay (or its preceding
            // answer-reveal window) is still visible, drop them straight
            // into spectator mode for the next round.
            clearAnswerRevealTimeout();
            setShowAnswerReveal(false);
            setShowEliminationOverlay(false);
            loadQuestion(
              newQuestionId,
              newQuestionIndex,
              undefined,
              updatedSession.current_question_started_at,
              true
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(sessionChannel); };
  }, [participantSession?.session.id, wsConnected, loadQuestion, startLocalCountdown, stopLocalCountdown, clearAnswerRevealTimeout]);

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

      const joinedCode = joinData.code.toUpperCase();
      if (searchParams.get('code') !== joinedCode) {
        setSearchParams({ code: joinedCode }, { replace: true });
      }

      const paused = sessionExists.is_paused || false;
      setIsPaused(paused);
      isPausedRef.current = paused;

      if (result.session.status === 'ACTIVE' && result.session.currentQuestionIndex >= 0) {
        const currentQ = result.session.presentation.questions[result.session.currentQuestionIndex];
        if (currentQ?.id) {
          const timeLimit = currentQ.timeLimit ?? null;
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
          setShowCorrectAnswerFeedback(false);
          setSubmittedOptionId(null);
          setShowAnswerReveal(false);
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

    const eliminationActive = isEliminationRef.current;

    if (eliminationActive && q.type === 'multiple-choice') {
      if (isEliminated) {
        toast({
          title: 'Vous êtes éliminé',
          description: 'Profitez du show en spectateur.',
          variant: 'destructive',
        });
        return;
      }

      const chosenOptionId: string | undefined = response?.optionId;
      if (!chosenOptionId) return;

      const chosenOption = (q.options ?? []).find(
        (o: any) => o.id === chosenOptionId,
      ) as any;
      const isCorrect = !!chosenOption?.isCorrect;
      const pts = (q as any).points ?? 0;

      // Remember this submission so we can highlight it in the answer
      // reveal window once the round timer ends.
      setSubmittedOptionId(chosenOptionId);

      try {
        // IMPORTANT: read the round number from the live question, NOT from
        // `ps.session.currentQuestionIndex` (which is captured at join time
        // and never updates). Using the stale value caused the server to
        // store `eliminated.roundNumber = 1` even when the player was
        // actually eliminated in round 3, which then broke the
        // `eliminatedAtRound === liveRoundNumber` check in the
        // `questionClosed` effect — so the EliminationOverlay never fired.
        const liveRoundNumber =
          currentQuestionRef.current?.number ?? gameState.currentRound ?? 0;

        const result = await SessionService.submitEliminationAnswer({
          sessionId: ps.session.id,
          participantId: ps.participantId,
          questionId: q.id,
          roundNumber: liveRoundNumber,
          chosenOptionId,
          isCorrect,
          pointsIfCorrect: pts,
        });

        if (!result.correct && result.eliminated) {
          sendMessage({
            type: SESSION_EVENTS.PLAYER_ELIMINATED,
            payload: result.eliminated as unknown as Record<string, unknown>,
          });
          setEliminatedAtRound(result.eliminated.roundNumber);
          setIsEliminated(true);
          // NOTE: Do NOT show the EliminationOverlay here.
          // The overlay must only appear AFTER the question timer ends —
          // see the `useEffect` watching `questionClosed` above.
        }

        sendMessage({
          type: SESSION_EVENTS.ANSWER_RECEIVED,
          payload: {
            participantId: ps.participantId,
            questionId: q.id,
            correct: result.correct,
          },
        });

        if (result.correct) {
          setSessionState('submitted');
          sessionStateRef.current = 'submitted';
        }
      } catch (err: any) {
        console.error('Elimination submit failed:', err);
        toast({
          title: 'Erreur',
          description: err.message || "Impossible d'enregistrer votre réponse.",
          variant: 'destructive',
        });
      }
      return;
    }

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
    clearAnswerRevealTimeout();
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

    setGameState({
      alive: [],
      eliminated: [],
      winner: null,
      totalPlayers: 0,
      currentRound: 0,
      history: [],
    });
    setEliminationEvents([]);
    setIsEliminated(false);
    setEliminatedAtRound(0);
    setShowEliminationOverlay(false);
    setShowCorrectAnswerFeedback(false);
    setSubmittedOptionId(null);
    setShowAnswerReveal(false);
    setRevealedWinner(null);
  };

  const handleRetry = () => {
    setError(null);
    setSessionState('join');
    sessionStateRef.current = 'join';
  };

  const renderTimerBar = () => {
    if (sessionState !== 'question' || !currentQuestion) return null;

    const total = timerTotal || currentQuestion.timeLimit || 0;
    if (!total || total <= 0) {
      return (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="flex justify-between px-4 pt-2">
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
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border ${
              isPaused
                ? 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950/40 dark:border-yellow-800 dark:text-yellow-400'
                : isWarning
                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400 animate-pulse'
                : 'bg-background border-border text-foreground'
            }`}
          >
            <span>{`${timerRemaining}s`}</span>
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
                question={{
                  text: currentQuestion.text,
                  description: currentQuestion.description,
                  image: getQuestionImage(currentQuestion),
                  options: currentQuestion.options,
                  responseCount: 0,
                }}
                onSubmit={(r) => handleSubmitResponse({ optionId: r.optionId })}
              />
            )}
            {currentQuestion.type === 'open-text' && (
              <OpenTextQuestion
                question={{
                  text: currentQuestion.text,
                  description: currentQuestion.description,
                  image: getQuestionImage(currentQuestion),
                  maxLength: 500,
                  minLength: 1,
                  responseCount: 0,
                }}
                onSubmit={(r) => handleSubmitResponse({ text: r.text })}
              />
            )}
            {currentQuestion.type === 'rating' && (
              <RatingScaleQuestion
                question={{
                  text: currentQuestion.text,
                  description: currentQuestion.description,
                  image: getQuestionImage(currentQuestion),
                  scale: currentQuestion.scale,
                  labels: currentQuestion.labels,
                  displayStyle: currentQuestion.displayStyle || 'numbers',
                  responseCount: 0,
                }}
                onSubmit={(r) => handleSubmitResponse({ rating: r.rating })}
              />
            )}
            {currentQuestion.type === 'word-cloud' && (
              <WordCloudQuestion
                question={{
                  text: currentQuestion.text,
                  description: currentQuestion.description,
                  image: getQuestionImage(currentQuestion),
                  maxWords: 5,
                  responseCount: 0,
                }}
                onSubmit={(r) => handleSubmitResponse({ words: r.words })}
              />
            )}

            {/* AnswerFeedback removed — was not behaving correctly. */}
          </div>
        );
      }

      case 'submitted':
        if (isElimination) {
          // The "Bonne réponse !" screen is now held back until the round
          // timer finishes. While waiting, the participant is rendered into
          // a spectator-style waiting view by the conditional block at the
          // bottom of this component (see `isElimination && (… || isEliminated …)`),
          // so we return null here for that interim state.
          if (!showCorrectAnswerFeedback) return null;
          return (
            <CentPourCentBackground
              subtitle="Bonne réponse ! Préparez-vous pour la prochaine question…"
            />
          );
        }
        return <SubmissionConfirmation message="Your response has been recorded successfully" />;

      case 'waiting':
        if (isElimination) {
          return (
            <CentPourCentBackground
              subtitle="Préparez-vous… le premier joueur éliminé sera le premier sorti."
            />
          );
        }
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

  // Winner reached → confetti screen for everyone.
  // The overlay is rendered ONLY after the host clicks "Show Winner"
  // and broadcasts a WINNER_REVEAL event (handled in `handleBroadcast`).
  if (isElimination && revealedWinner) {
    return (
      <div className={themeClass}>
        <WinnerCelebration
          winner={revealedWinner}
          isWinnerMe={revealedWinner.id === participantSession?.participantId}
        />
      </div>
    );
  }

  // ── Spectator-style waiting view ──────────────────────────────────────────
  // Three situations now render the spectator UI:
  //
  //   1. The participant has just SUBMITTED an answer (correct OR wrong) and
  //      the round timer has not finished yet. They sit in this view —
  //      with the "you have been eliminated" banner HIDDEN — so we don't
  //      reveal whether their answer was correct before everyone else's
  //      time is up.
  //
  //   2. The participant answered WRONG and the timer just ended → for
  //      ANSWER_REVEAL_DURATION_MS we show this view with the correct option
  //      highlighted in green and the wrong submitted option highlighted in
  //      red. Then the EliminationOverlay slides in.
  //
  //   3. The participant is eliminated, the dramatic EliminationOverlay
  //      has been dismissed (they chose "Stay as spectator", or the host
  //      moved on), and a winner hasn't been revealed yet. In this case we
  //      show the banner.
  if (isElimination) {
    const liveRoundNumber =
      currentQuestion?.number ?? gameState.currentRound ?? 0;

    // I just submitted in THIS round and the timer hasn't ended yet.
    const hasJustSubmittedAndWaiting =
      sessionState === 'submitted' && !showCorrectAnswerFeedback;

    // I just got eliminated in THIS round and the timer hasn't ended yet
    // (so we still want to hide the banner — see `hideBanner` below).
    const eliminatedThisRoundWaiting =
      isEliminated &&
      !questionClosed &&
      eliminatedAtRound === liveRoundNumber;

    // I was eliminated in a PRIOR round (or in this round, after the
    // EliminationOverlay was dismissed) → established spectator. Also
    // covers the brief answer-reveal window after the timer ends.
    const isEliminatedSpectator =
      isEliminated && !showEliminationOverlay && !showCorrectAnswerFeedback;

    if (hasJustSubmittedAndWaiting || isEliminatedSpectator) {
      // Only hide the "Vous avez été éliminé" banner during the
      // post-submit waiting window of the CURRENT round, or during the
      // brief answer-reveal window — never for an established spectator
      // from a prior round.
      const hideBanner =
        hasJustSubmittedAndWaiting ||
        eliminatedThisRoundWaiting ||
        showAnswerReveal;
      return (
        <div className={themeClass + ' min-h-screen'}>
          <SpectatorMode
            currentQuestion={currentQuestion ?? null}
            gameState={gameState}
            eliminatedAtRound={eliminatedAtRound}
            onLeave={handleJoinNewSession}
            hideEliminationBanner={hideBanner}
            showAnswerReveal={showAnswerReveal}
            submittedOptionId={submittedOptionId}
          />
        </div>
      );
    }
  }

  // Standard render flow
  return (
    <div className={`${themeClass} min-h-screen bg-background relative`}>
      {/* 100% Logique chrome - removed EliminationToast */}
      {isElimination && (
        <EliminationOverlay
          show={showEliminationOverlay}
          roundNumber={eliminatedAtRound}
          onStay={() => setShowEliminationOverlay(false)}
          onLeave={handleJoinNewSession}
        />
      )}

      {renderTimerBar()}

      <main className={`main-content ${sessionState === 'question' ? 'pt-8' : ''}`}>
        <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
          {getSessionTitle()}
          <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
            {renderContent()}
          </div>

          {/* Live leaderboard sits below the question in elimination mode */}
          {isElimination && sessionState !== 'join' && (
            <div className="mx-auto max-w-3xl mt-8">
              <LiveLeaderboard
                gameState={gameState}
                highlightParticipantId={participantSession?.participantId}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AudienceParticipation;
