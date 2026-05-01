// src/pages/audience-participation/index.tsx
// COMPLETE FILE — original behavior preserved + token-based existing response check.
// Prevents re-submission when host goes back to already answered question.
//
// FIX: When timer ends on any question, eliminated participants (spectators) now
// always see the spectator answer-reveal view — never the "bonne réponse" screen.
// The `isEliminatedRef.current` check is evaluated BEFORE the `sessionState ===
// "submitted"` check so that going back to a previously-answered question cannot
// accidentally show the wrong feedback to an already-eliminated player.
//
// MOD: "Time's Up!" toast duration set to 2 seconds (2000ms) for better UX.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useSessionSocket, SESSION_EVENTS } from "../../lib/useSessionSocket";
import { useToast } from "../../hooks/use-toast";
import SessionJoinForm from "./components/SessionJoinForm";
import MultipleChoiceQuestion from "./components/MultipleChoiceQuestion";
import OpenTextQuestion from "./components/OpenTextQuestion";
import RatingScaleQuestion from "./components/RatingScaleQuestion";
import WordCloudQuestion from "./components/WordCloudQuestion";
import WaitingState from "./components/WaitingState";
import SubmissionConfirmation from "./components/SubmissionConfirmation";
import SessionEndedState from "./components/SessionEndedState";
import ErrorState from "./components/ErrorState";
import type {
  Question,
  Session,
  GameState,
  EliminationEvent,
  Participant,
} from "../../lib/presentation.types";
import AppIcon from "../../components/AppIcon";

import { EliminationOverlay } from "./components/EliminationOverlay";
import { SpectatorMode } from "./components/SpectatorMode";
import { LiveLeaderboard } from "./components/LiveLeaderboard";
import { WinnerCelebration } from "./components/WinnerCelebration";
import { CentPourCentBackground } from "./components/CentPourCentBackground";
import { SessionService } from "../../service/session.service.ts";
import "../../styles/cent-pour-cent-logique.css";

type SessionState =
  | "join"
  | "question"
  | "submitted"
  | "waiting"
  | "ended"
  | "error";

interface ParticipantSession {
  session: Session;
  participantId: string;
  participantName: string;
  participantToken: string; // NEW
}

const ANSWER_REVEAL_DURATION_MS = 2000;

function computeRemainingFromDbRow(
  row: {
    is_paused: boolean;
    current_question_started_at: string | null;
    timer_paused_remaining: number | null;
    timer_resumed_at: string | null;
  },
  timeLimit: number | null,
): number | null {
  if (timeLimit == null || timeLimit <= 0) return null;

  const {
    is_paused,
    current_question_started_at,
    timer_paused_remaining,
    timer_resumed_at,
  } = row;

  if (is_paused && timer_paused_remaining != null) {
    return Math.max(0, timer_paused_remaining);
  }
  if (
    !is_paused &&
    timer_resumed_at != null &&
    timer_paused_remaining != null
  ) {
    const elapsed = Math.floor(
      (Date.now() - new Date(timer_resumed_at).getTime()) / 1000,
    );
    return Math.max(0, timer_paused_remaining - elapsed);
  }
  if (current_question_started_at) {
    const elapsed = Math.floor(
      (Date.now() - new Date(current_question_started_at).getTime()) / 1000,
    );
    return Math.max(0, timeLimit - elapsed);
  }
  return timeLimit;
}

const AudienceParticipation: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [sessionState, setSessionState] = useState<SessionState>("join");
  const [participantSession, setParticipantSession] =
    useState<ParticipantSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<{
    type?: string;
    message?: string;
  } | null>(null);
  const [, setIsLoading] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [timerTotal, setTimerTotal] = useState<number>(0);
  const [questionActive, setQuestionActive] = useState<boolean>(true);
  const [questionClosed, setQuestionClosed] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const [gameState, setGameState] = useState<GameState>({
    alive: [],
    eliminated: [],
    winner: null,
    totalPlayers: 0,
    currentRound: 0,
    history: [],
  });
  const [eliminationEvents, setEliminationEvents] = useState<
    EliminationEvent[]
  >([]);
  const [isEliminated, setIsEliminated] = useState<boolean>(false);
  const [eliminatedAtRound, setEliminatedAtRound] = useState<number>(0);
  const [showEliminationOverlay, setShowEliminationOverlay] =
    useState<boolean>(false);
  const [showCorrectAnswerFeedback, setShowCorrectAnswerFeedback] =
    useState<boolean>(false);
  const [revealedWinner, setRevealedWinner] = useState<Participant | null>(
    null,
  );
  const [submittedOptionId, setSubmittedOptionId] = useState<string | null>(
    null,
  );
  const [showAnswerReveal, setShowAnswerReveal] = useState<boolean>(false);

  const participantSessionRef = useRef<ParticipantSession | null>(null);
  const currentQuestionRef = useRef<Question | null>(null);
  const sessionStateRef = useRef<SessionState>("join");
  const questionClosedRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const questionActiveRef = useRef<boolean>(true);
  const timerRemainingRef = useRef<number>(0);
  const timerIntervalRef = useRef<number | undefined>(undefined);
  const toastRef = useRef(toast);
  const isEliminatedRef = useRef<boolean>(false);
  const answerRevealTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    participantSessionRef.current = participantSession;
  }, [participantSession]);
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);
  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);
  useEffect(() => {
    questionClosedRef.current = questionClosed;
  }, [questionClosed]);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  useEffect(() => {
    questionActiveRef.current = questionActive;
  }, [questionActive]);
  useEffect(() => {
    timerRemainingRef.current = timerRemaining;
  }, [timerRemaining]);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);
  useEffect(() => {
    isEliminatedRef.current = isEliminated;
  }, [isEliminated]);

  const prefilledCode = (searchParams.get("code") || "").toUpperCase();

  useEffect(() => {
    if (prefilledCode)
      sessionStorage.setItem("pending-session-code", prefilledCode);
  }, [prefilledCode]);

  const [contextMeta, setContextMeta] = useState<{
    gameMode: "standard" | "elimination";
    themeId: string;
  }>({ gameMode: "standard", themeId: "default" });

  const isEliminationRef = useRef<boolean>(false);

  const sessionAny = participantSession?.session as any;
  const isElimination: boolean = contextMeta.gameMode === "elimination";

  useEffect(() => {
    isEliminationRef.current = isElimination;
  }, [isElimination]);

  const themeId: string = contextMeta.themeId || "default";
  const themeClass = (isElimination || themeId === "cent-pour-cent-logique") ? "cpl-theme" : "";

  const clearAnswerRevealTimeout = useCallback(() => {
    if (answerRevealTimeoutRef.current !== undefined) {
      clearTimeout(answerRevealTimeoutRef.current);
      answerRevealTimeoutRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    const sessionId = participantSession?.session?.id;
    if (!sessionId) return;

    let cancelled = false;

    const loadMetadata = async () => {
      try {
        const { data: sessionRow, error: sessionErr } = await supabase
          .from("sessions")
          .select("context_id")
          .eq("id", sessionId)
          .maybeSingle();

        if (sessionErr || !sessionRow?.context_id) return;

        const { data: ctx, error: ctxErr } = await supabase
          .from("contexts")
          .select("game_mode, theme")
          .eq("id", sessionRow.context_id)
          .maybeSingle();

        if (ctxErr || !ctx || cancelled) return;

        const gameModeValue =
          ctx?.game_mode === "elimination" ? "elimination" : "standard";
        const themeValue = ctx?.theme || "default";

        setContextMeta({
          gameMode: gameModeValue,
          themeId: themeValue,
        });

        isEliminationRef.current = gameModeValue === "elimination";
      } catch (err) {
        console.error("[Metadata] Error:", err);
      }
    };

    loadMetadata();

    return () => {
      cancelled = true;
    };
  }, [participantSession?.session?.id]);

  useEffect(() => {
    if (!isElimination || !participantSession?.session.id) return;

    let isMounted = true;

    const refreshGameState = async () => {
      if (!isMounted) return;
      try {
        const newState = await SessionService.getGameState(
          participantSession.session.id,
        );
        if (isMounted) {
          setGameState(newState);
          const me = newState.eliminated.find(
            (p) => p.id === participantSession.participantId,
          );
          if (me && !isEliminated) {
            setIsEliminated(true);
            setEliminatedAtRound(me.eliminatedAtRound ?? newState.currentRound);
          }
        }
      } catch (err) {
        console.error("Failed to refresh game state:", err);
      }
    };

    refreshGameState();
    const interval = setInterval(refreshGameState, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [
    isElimination,
    participantSession?.session.id,
    participantSession?.participantId,
  ]);

  const getQuestionImage = (question: Question | null): string | null => {
    if (!question) return null;
    return (question as any).image || (question as any).imageUrl || null;
  };

  const mapQuestionType = (dbType: string): Question["type"] => {
    const mapping: Record<string, Question["type"]> = {
      MULTIPLE_CHOICE: "multiple-choice",
      SINGLE_CHOICE: "multiple-choice",
      TRUE_FALSE: "multiple-choice",
      POLL: "multiple-choice",
      RATING: "rating",
      OPEN_TEXT: "open-text",
      WORD_CLOUD: "word-cloud",
    };
    return mapping[dbType] || "multiple-choice";
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
        // Toast with 2 seconds duration
        toastRef.current({
          title: "Time's Up!",
          description: "The time for this question has expired.",
          duration: 2000, // Auto-dismiss after 2 seconds
        });
      } else {
        timerRemainingRef.current = next;
        setTimerRemaining(next);
      }
    }, 1000);
  }, [stopLocalCountdown]);

  useEffect(() => () => stopLocalCountdown(), [stopLocalCountdown]);
  useEffect(() => () => clearAnswerRevealTimeout(), [clearAnswerRevealTimeout]);

  const applyQuestion = useCallback(
    (
      question: Question,
      timeLimit: number | null,
      startedAt?: string,
      useElapsed: boolean = false,
      hasAlreadyResponded: boolean = false,
    ) => {
      const limit = timeLimit == null || timeLimit <= 0 ? null : timeLimit;
      let remaining = limit ?? 0;
      if (limit !== null && useElapsed && startedAt) {
        const elapsed = Math.floor(
          (Date.now() - new Date(startedAt).getTime()) / 1000,
        );
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
      setShowCorrectAnswerFeedback(false);
      setSubmittedOptionId(null);
      setShowAnswerReveal(false);
      clearAnswerRevealTimeout();
      setShowEliminationOverlay(false);

      if (hasAlreadyResponded) {
        setSessionState("submitted");
        sessionStateRef.current = "submitted";
      } else {
        setSessionState("question");
        sessionStateRef.current = "question";
      }
      if (limit !== null && remaining > 0) startLocalCountdown();
    },
    [startLocalCountdown, clearAnswerRevealTimeout],
  );

  const loadQuestion = useCallback(
    async (
      questionId: string,
      questionIndex: number,
      timeLimit?: number | null,
      startedAt?: string,
      useElapsed: boolean = false,
    ) => {
      if (!participantSessionRef.current) return;

      let hasAlreadyResponded = false;
      try {
        hasAlreadyResponded = await SessionService.checkExistingResponse(
          participantSessionRef.current.session.id,
          participantSessionRef.current.participantId,
          questionId,
          participantSessionRef.current.participantToken, // PASS TOKEN
        );
      } catch (err) {
        console.error('Failed to check existing response:', err);
      }

      const cachedQ =
        participantSessionRef.current.session.presentation.questions.find(
          (q) => q.id === questionId,
        );

      if (cachedQ) {
        applyQuestion(
          cachedQ,
          cachedQ.timeLimit ?? timeLimit ?? null,
          startedAt,
          useElapsed,
          hasAlreadyResponded,
        );
        return;
      }

      try {
        const { data: questionData, error: questionError } = await supabase
          .from("questions")
          .select("*")
          .eq("id", questionId)
          .maybeSingle();

        if (questionError || !questionData) {
          setSessionState("waiting");
          sessionStateRef.current = "waiting";
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
          useElapsed,
          hasAlreadyResponded,
        );
      } catch (err) {
        console.error("Load question error:", err);
        setSessionState("waiting");
        sessionStateRef.current = "waiting";
      }
    },
    [applyQuestion],
  );

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
        console.error("Failed to hydrate game state:", err);
      });
  }, [
    participantSession?.session.id,
    participantSession?.participantId,
    isElimination,
  ]);

  const handleBroadcast = useCallback(
    (msg: { type: string; payload?: Record<string, unknown> }) => {
      const { type, payload } = msg;

      switch (type) {
        case "SESSION_START":
        case "QUESTION_CHANGE": {
          const questionId = payload?.questionId as string | undefined;
          const questionIndex = (payload?.questionIndex as number) ?? 0;
          const timeLimit = payload?.timeLimit as number | null | undefined;
          if (questionId) {
            stopLocalCountdown();
            clearAnswerRevealTimeout();
            setShowAnswerReveal(false);
            setShowEliminationOverlay(false);
            loadQuestion(
              questionId,
              questionIndex,
              timeLimit,
              undefined,
              false,
            );
          }
          break;
        }

        case "PAUSE": {
          const remaining =
            (payload?.remainingSeconds as number) ?? timerRemainingRef.current;
          stopLocalCountdown();
          setIsPaused(true);
          isPausedRef.current = true;
          setTimerRemaining(remaining);
          timerRemainingRef.current = remaining;
          break;
        }

        case "RESUME": {
          const remaining =
            (payload?.remainingSeconds as number) ?? timerRemainingRef.current;
          setIsPaused(false);
          isPausedRef.current = false;
          setTimerRemaining(remaining);
          timerRemainingRef.current = remaining;
          if (remaining > 0 && questionActiveRef.current) startLocalCountdown();
          break;
        }

        //handle host forcing close for no‑timer questions ──
        case SESSION_EVENTS.FORCE_QUESTION_CLOSE: {
          if (!questionClosedRef.current) {
            setQuestionClosed(true);
            questionClosedRef.current = true;
            stopLocalCountdown(); // just in case
          }
          break;
        }

        case "SESSION_END": {
          stopLocalCountdown();
          clearAnswerRevealTimeout();
          setShowAnswerReveal(false);
          setShowEliminationOverlay(false);
          setSessionState("ended");
          sessionStateRef.current = "ended";
          break;
        }

        case SESSION_EVENTS.PLAYER_ELIMINATED: {
          const ev = payload as unknown as EliminationEvent;
          setEliminationEvents((prev) => [...prev, ev]);
          if (participantSessionRef.current?.session.id) {
            SessionService.getGameState(
              participantSessionRef.current.session.id,
            )
              .then((newState) => {
                setGameState(newState);
                const me = newState.eliminated.find(
                  (p) => p.id === participantSessionRef.current?.participantId,
                );
                if (me && !isEliminatedRef.current) {
                  setIsEliminated(true);
                  setEliminatedAtRound(
                    me.eliminatedAtRound ?? newState.currentRound,
                  );
                }
              })
              .catch((err) =>
                console.error("Failed to refresh game state:", err),
              );
          }
          break;
        }

        case SESSION_EVENTS.GAME_STATE_UPDATE: {
          setGameState(payload as unknown as GameState);
          break;
        }

        case SESSION_EVENTS.GAME_END: {
          if (participantSessionRef.current?.session.id) {
            SessionService.getGameState(
              participantSessionRef.current.session.id,
            )
              .then(setGameState)
              .catch((err) =>
                console.error("Failed to refresh game state:", err),
              );
          }
          break;
        }

        case SESSION_EVENTS.WINNER_REVEAL: {
          const winner = payload as unknown as Participant;
          if (winner && winner.id) {
            setRevealedWinner(winner);
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
    [
      loadQuestion,
      startLocalCountdown,
      stopLocalCountdown,
      clearAnswerRevealTimeout,
    ],
  );

  const { connected: wsConnected, sendMessage } = useSessionSocket({
    sessionId: participantSession?.session.id ?? null,
    role: "audience",
    onMessage: handleBroadcast,
    enabled: !!participantSession,
  });

  // ── Timer-end effect: determine what to show when a question closes ────────
  //
  // IMPORTANT — ordering of checks:
  //
  // 1. `isEliminatedRef.current` is checked FIRST so that a participant who is
  //    already in spectator mode always sees the answer-reveal view, regardless
  //    of `sessionState`. Without this, navigating back to a previously-answered
  //    question sets sessionState = "submitted" (hasAlreadyResponded = true) and
  //    the old code would hit the "submitted" branch first, incorrectly showing
  //    "Bonne réponse ! Préparez-vous…" to an already-eliminated player.
  //
  // 2. `sessionStateRef.current === "submitted"` is checked SECOND — only
  //    reached by active (non-eliminated) players who answered correctly.
  //
  // 3. The final async block handles auto-elimination for players who never
  //    submitted an answer before the timer expired.
  useEffect(() => {
    if (!questionClosed) return;
    if (!isElimination) return;
    if (!participantSession || !currentQuestion) return;
    if (revealedWinner) return;

    const ps = participantSession;
    const q = currentQuestion;

    // ── CHECK 1: Already-eliminated spectator ─────────────────────────────
    // Must come before the "submitted" check. When the host goes back to a
    // question the participant previously answered wrong, loadQuestion sets
    // sessionState = "submitted" (hasAlreadyResponded = true). Without this
    // guard being first, the participant would wrongly see "Bonne réponse".
    if (isEliminatedRef.current) {
      const liveRoundNumber =
        currentQuestionRef.current?.number ?? gameState.currentRound ?? 0;

      if (eliminatedAtRound === liveRoundNumber && sessionStateRef.current !== "submitted") {
        // First-time elimination on this question (sessionState is still
        // "question" because they just answered wrong — not a revisit).
        // Show the answer reveal briefly, then transition to the overlay.
        setShowAnswerReveal(true);
        clearAnswerRevealTimeout();
        answerRevealTimeoutRef.current = window.setTimeout(() => {
          setShowAnswerReveal(false);
          setShowEliminationOverlay(true);
          answerRevealTimeoutRef.current = undefined;
        }, ANSWER_REVEAL_DURATION_MS);
      } else {
        // Established spectator — either watching a different question OR
        // the host went back to the question where they were eliminated
        // (sessionState = "submitted" because hasAlreadyResponded = true).
        // Just reveal the correct answer indefinitely — no overlay, no timer.
        setShowAnswerReveal(true);
      }
      return;
    }

    // ── CHECK 2: Active player who submitted a correct answer ──────────────
    if (sessionStateRef.current === "submitted") {
      setShowCorrectAnswerFeedback(true);
      return;
    }

    // ── CHECK 3: Active player who never submitted — auto-eliminate ────────
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
        setShowAnswerReveal(true);
        clearAnswerRevealTimeout();
        answerRevealTimeoutRef.current = window.setTimeout(() => {
          setShowAnswerReveal(false);
          setShowEliminationOverlay(true);
          answerRevealTimeoutRef.current = undefined;
        }, ANSWER_REVEAL_DURATION_MS);
      } catch (err) {
        console.error("Auto-eliminate on timer end failed:", err);
        setShowEliminationOverlay(true);
      }
    })();
  }, [questionClosed]);

  useEffect(() => {
    if (!participantSession) return;
    const sessionId = participantSession.session.id;

    const endedWatcher = supabase
      .channel(`session-ended-watcher-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (
            updated.status === "ENDED" &&
            sessionStateRef.current !== "ended"
          ) {
            stopLocalCountdown();
            setSessionState("ended");
            sessionStateRef.current = "ended";
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(endedWatcher);
    };
  }, [participantSession?.session.id]);

  useEffect(() => {
    if (!participantSession) return;
    const sessionId = participantSession.session.id;

    const sessionChannel = supabase
      .channel(`session-audience-fallback-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (wsConnected) return;

          const updatedSession = payload.new as any;
          if (updatedSession.status === "ENDED") return;

          const newIsPaused: boolean = updatedSession.is_paused ?? false;
          const wasPaused = isPausedRef.current;

          if (newIsPaused !== wasPaused) {
            setIsPaused(newIsPaused);
            isPausedRef.current = newIsPaused;
            if (newIsPaused) {
              stopLocalCountdown();
              const frozen: number =
                updatedSession.timer_paused_remaining ??
                timerRemainingRef.current;
              setTimerRemaining(frozen);
              timerRemainingRef.current = frozen;
            } else {
              const timeLimit = currentQuestionRef.current?.timeLimit ?? null;
              const recalculated = computeRemainingFromDbRow(
                {
                  is_paused: false,
                  current_question_started_at:
                    updatedSession.current_question_started_at,
                  timer_paused_remaining: updatedSession.timer_paused_remaining,
                  timer_resumed_at: updatedSession.timer_resumed_at,
                },
                timeLimit,
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
                if (recalculated > 0 && questionActiveRef.current)
                  startLocalCountdown();
              }
            }
          }

          const newQuestionId: string | null =
            updatedSession.current_question_id;
          const newQuestionIndex: number =
            updatedSession.current_question_index;
          if (
            newQuestionId &&
            newQuestionId !== currentQuestionRef.current?.id
          ) {
            stopLocalCountdown();
            clearAnswerRevealTimeout();
            setShowAnswerReveal(false);
            setShowEliminationOverlay(false);
            loadQuestion(
              newQuestionId,
              newQuestionIndex,
              undefined,
              updatedSession.current_question_started_at,
              true,
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
    };
  }, [
    participantSession?.session.id,
    wsConnected,
    loadQuestion,
    startLocalCountdown,
    stopLocalCountdown,
    clearAnswerRevealTimeout,
  ]);

  const handleJoinSession = async (joinData: {
    code: string;
    name: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionExists, error: sessionCheckError } = await supabase
        .from("sessions")
        .select(
          "id, code, status, context_id, is_paused, current_question_started_at, timer_paused_remaining, timer_resumed_at",
        )
        .eq("code", joinData.code.toUpperCase())
        .maybeSingle();

      if (sessionCheckError)
        throw new Error("Database error. Please try again.");
      if (!sessionExists)
        throw new Error(
          `No session found with code "${joinData.code.toUpperCase()}".`,
        );
      if (sessionExists.status === "ENDED")
        throw new Error("This session has already ended.");

      const result = await SessionService.joinSession({
        sessionCode: joinData.code,
        participantName: joinData.name,
        userId: user?.id,
        isAnonymous: !user,
      });

      if (!result) throw new Error("Failed to join session");

      const ps: ParticipantSession = {
        session: result.session,
        participantId: result.participantId,
        participantName: joinData.name,
        participantToken: result.participantToken, // STORE TOKEN
      };

      participantSessionRef.current = ps;
      setParticipantSession(ps);

      const joinedCode = joinData.code.toUpperCase();
      if (searchParams.get("code") !== joinedCode) {
        setSearchParams({ code: joinedCode }, { replace: true });
      }

      const paused = sessionExists.is_paused || false;
      setIsPaused(paused);
      isPausedRef.current = paused;

      if (
        result.session.status === "ACTIVE" &&
        result.session.currentQuestionIndex >= 0
      ) {
        const currentQ =
          result.session.presentation.questions[
            result.session.currentQuestionIndex
          ];
        if (currentQ?.id) {
          const timeLimit = currentQ.timeLimit ?? null;
          const remaining = computeRemainingFromDbRow(
            {
              is_paused: paused,
              current_question_started_at:
                sessionExists.current_question_started_at,
              timer_paused_remaining: sessionExists.timer_paused_remaining,
              timer_resumed_at: sessionExists.timer_resumed_at,
            },
            timeLimit,
          );

          let hasAlreadyResponded = false;
          try {
            hasAlreadyResponded = await SessionService.checkExistingResponse(
              result.session.id,
              result.participantId,
              currentQ.id,
              result.participantToken, // PASS TOKEN
            );
          } catch (err) {
            console.error('Failed to check existing response:', err);
          }

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
          setSessionState(hasAlreadyResponded ? "submitted" : "question");
          sessionStateRef.current = hasAlreadyResponded ? "submitted" : "question";
          if (
            timeLimit !== null &&
            !paused &&
            remaining !== null &&
            remaining > 0
          )
            startLocalCountdown();
        } else {
          setSessionState("waiting");
          sessionStateRef.current = "waiting";
        }
      } else if (result.session.status === "ENDED") {
        setSessionState("ended");
        sessionStateRef.current = "ended";
      } else {
        setSessionState("waiting");
        sessionStateRef.current = "waiting";
      }

      toast({
        title: "Joined Successfully",
        duration: 2000,
      });
    } catch (err: any) {
      console.error("Join error:", err);
      setError({
        type: err.message?.includes("ended")
          ? "session_not_found"
          : "invalid_code",
        message: err.message || "Failed to join session",
      });
      setSessionState("error");
      sessionStateRef.current = "error";
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitResponse = async (response: any) => {
    if (
      !questionActiveRef.current ||
      questionClosedRef.current ||
      isPausedRef.current
    ) {
      toast({
        title: "Cannot Submit",
        description: isPausedRef.current
          ? "The session is paused. Please wait for the presenter to resume."
          : "The time for this question has expired.",
        variant: "destructive",
      });
      return;
    }

    const ps = participantSessionRef.current;
    const q = currentQuestionRef.current;
    if (!ps || !q) return;

    const eliminationActive = isEliminationRef.current;

    if (eliminationActive && q.type === "multiple-choice") {
      if (isEliminated) {
        toast({
          title: "Vous êtes éliminé",
          description: "Profitez du show en spectateur.",
          variant: "destructive",
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

      setSubmittedOptionId(chosenOptionId);

      try {
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
          setSessionState("submitted");
          sessionStateRef.current = "submitted";
        }
      } catch (err: any) {
        console.error("Elimination submit failed:", err);
        toast({
          title: "Erreur",
          description: err.message || "Impossible d'enregistrer votre réponse.",
          variant: "destructive",
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
        setSessionState("submitted");
        sessionStateRef.current = "submitted";
        toast({
          title: "Response Submitted!",
          description: "Your answer has been recorded",
        });
      } else {
        throw new Error("Failed to submit response");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJoinNewSession = () => {
    stopLocalCountdown();
    clearAnswerRevealTimeout();
    participantSessionRef.current = null;
    currentQuestionRef.current = null;
    sessionStateRef.current = "join";
    questionClosedRef.current = false;
    isPausedRef.current = false;
    questionActiveRef.current = true;
    timerRemainingRef.current = 0;

    setParticipantSession(null);
    setCurrentQuestion(null);
    setError(null);
    setSessionState("join");
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
    setSessionState("join");
    sessionStateRef.current = "join";
  };

  const renderTimerBar = () => {
    if (sessionState !== "question" || !currentQuestion) return null;

    const total = timerTotal || currentQuestion.timeLimit || 0;
    if (!total || total <= 0) {
      return (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="flex justify-between px-4 pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border bg-background border-border text-foreground">
              <AppIcon name={isPaused ? "PauseCircle" : "Infinity"} size={12} />
              <span>{isPaused ? "Paused" : "No timer"}</span>
            </div>
          </div>
        </div>
      );
    }
    const fraction = total > 0 ? timerRemaining / total : 0;
    const isWarning = timerRemaining <= 10 && timerRemaining > 0;

    let barColor = "bg-primary";
    if (isPaused) barColor = "bg-yellow-500";
    else if (isWarning) barColor = "bg-red-500";

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
                ? "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950/40 dark:border-yellow-800 dark:text-yellow-400"
                : isWarning
                  ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400 animate-pulse"
                  : "bg-background border-border text-foreground"
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
      case "join":
        return (
          <SessionJoinForm
            onJoin={handleJoinSession}
            prefilledCode={prefilledCode}
          />
        );

      case "question": {
        if (!currentQuestion) return null;
        return (
          <div className="relative">
            {isPaused && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center">
                <div className="bg-card rounded-xl p-8 text-center max-w-md mx-4">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <AppIcon
                      name="Pause"
                      size={40}
                      className="text-yellow-500"
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Session Paused
                  </h2>
                  <p className="text-muted-foreground">
                    The presenter has paused the session. Please wait for them
                    to resume.
                  </p>
                </div>
              </div>
            )}

            {currentQuestion.type === "multiple-choice" && (
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
            {currentQuestion.type === "open-text" && (
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
            {currentQuestion.type === "rating" && (
              <RatingScaleQuestion
                question={{
                  text: currentQuestion.text,
                  description: currentQuestion.description,
                  image: getQuestionImage(currentQuestion),
                  scale: currentQuestion.scale,
                  labels: currentQuestion.labels,
                  displayStyle: currentQuestion.displayStyle || "numbers",
                  responseCount: 0,
                }}
                onSubmit={(r) => handleSubmitResponse({ rating: r.rating })}
              />
            )}
            {currentQuestion.type === "word-cloud" && (
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
          </div>
        );
      }

      case "submitted":
        if (isElimination) {
          if (!showCorrectAnswerFeedback) return null;
          return (
            <CentPourCentBackground subtitle="Bonne réponse ! Préparez-vous pour la prochaine question…" />
          );
        }
        return (
          <SubmissionConfirmation message="Your response has been recorded successfully" />
        );

      case "waiting":
        if (isElimination) {
          return (
            <CentPourCentBackground subtitle="Préparez-vous… le premier joueur éliminé sera le premier sorti." />
          );
        }
        return (
          <WaitingState
            message="Waiting for the presenter to start..."
            showSpinner
          />
        );

      case "ended":
        return <SessionEndedState onJoinNew={handleJoinNewSession} />;

      case "error":
        return <ErrorState error={error} onRetry={handleRetry} />;

      default:
        return null;
    }
  };

  const getSessionTitle = () => {
    if (sessionState === "join" || !participantSession) return null;
    return (
      <div className="max-w-2xl mx-auto mb-6 md:mb-8">
        <div className="bg-card rounded-xl p-4 md:p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-foreground truncate">
                {participantSession.session.presentation.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Code: {participantSession.session.code} • Joined as{" "}
                {participantSession.participantName}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
              <div
                className={`w-2 h-2 rounded-full ${isPaused ? "bg-yellow-500" : "bg-success animate-pulse"}`}
              />
              <span className="text-sm font-medium text-success whitespace-nowrap">
                {isPaused ? "Paused" : "Live"}
              </span>
            </div>
          </div>

          {sessionState === "question" && currentQuestion && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Question {currentQuestion.number} of{" "}
                  {participantSession.session.presentation.questions.length}
                </span>
                <div className="flex gap-1">
                  {participantSession.session.presentation.questions.map(
                    (_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors duration-250 ${
                          index === currentQuestion.number - 1
                            ? "bg-primary"
                            : index < currentQuestion.number - 1
                              ? "bg-success"
                              : "bg-muted"
                        }`}
                      />
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

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

  if (isElimination) {
    const liveRoundNumber =
      currentQuestion?.number ?? gameState.currentRound ?? 0;

    // True only for NON-eliminated players who submitted correctly and are
    // waiting for the round timer to finish before seeing "Bonne réponse".
    const hasJustSubmittedAndWaiting =
      !isEliminated && sessionState === "submitted" && !showCorrectAnswerFeedback;

    // True only during the very first elimination window — the player JUST
    // answered wrong this round, the timer is still running, and we haven't
    // confirmed their elimination to them yet. Does NOT apply when the host
    // revisits a previous question (sessionState would be "submitted" there).
    const eliminatedThisRoundWaiting =
      isEliminated &&
      !questionClosed &&
      eliminatedAtRound === liveRoundNumber &&
      sessionState !== "submitted";

    const isEliminatedSpectator =
      isEliminated && !showEliminationOverlay && !showCorrectAnswerFeedback;

    if (hasJustSubmittedAndWaiting || isEliminatedSpectator) {
      // The elimination banner is hidden only while we are still waiting to
      // reveal the participant's fate for the first time (timer still running,
      // first-time elimination). In every other case — including watching the
      // answer reveal on a revisited question — the banner stays visible.
      const hideBanner = hasJustSubmittedAndWaiting || eliminatedThisRoundWaiting;
      return (
        <div className={themeClass + " min-h-screen"}>
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

  return (
    <div className={`${themeClass} min-h-screen bg-background relative`}>
      {isElimination && (
        <EliminationOverlay
          show={showEliminationOverlay}
          roundNumber={eliminatedAtRound}
          onStay={() => setShowEliminationOverlay(false)}
          onLeave={handleJoinNewSession}
        />
      )}

      {renderTimerBar()}

      <main
        className={`main-content ${sessionState === "question" ? "pt-8" : ""}`}
      >
        <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
          {getSessionTitle()}
          <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
            {renderContent()}
          </div>

          {isElimination &&
            sessionState !== "join" &&
            (timerRemaining === 0 || showAnswerReveal || isEliminated) && (
              <div className="mx-auto max-w-3xl mt-8">
                <LiveLeaderboard
                  gameState={gameState}
                  highlightParticipantId={participantSession?.participantId}
                  defaultCollapsed
                />
              </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default AudienceParticipation;