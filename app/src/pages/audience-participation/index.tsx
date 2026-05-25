// src/pages/audience-participation/index.tsx
// Version avec UI de l'ancienne version ET timer wall-clock optimisé
// SKIP BUTTON UPDATE: Added skip functionality for elimination mode
// SPEED QUESTION UPDATE: Added speed question waiting state and final round decision
//   SpeedQuestionWaiting now shows correctly even when participant is eliminated
//       (isEliminatedSpectator no longer fires during speed_waiting state)
// SPEED QUESTION BUG FIXES:
//   • Track speedAnsweredCorrectly so we distinguish "correct-but-slow" eliminations
//     (show rank in overlay) from "wrong-answer" eliminations (default overlay, no rank).
//   • "Vous passez" screen no longer auto-dismisses — it persists until the next
//     question resets the speed state, satisfying the "don't disappear until next
//     question" requirement.
// GRID 2x2 & VOTE: Added support for grid-2x2 and vote question types
// UI UPDATE: Collapsible session info header (3-dots menu)

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
import ScalingQuestion from "./components/ScalingQuestion.tsx";
import RankingQuestion from "./components/RankingQuestion.tsx";
import Grid2x2Question from "./components/Grid2x2Question";
import VoteQuestion from "./components/VoteQuestion";
import WaitingState from "./components/WaitingState";
import SubmissionConfirmation from "./components/SubmissionConfirmation";
import SessionEndedState from "./components/SessionEndedState";
import ErrorState from "./components/ErrorState";
import { FinalRoundDecision } from "./components/FinalRoundDecision";
import { SpeedQuestionWaiting } from "./components/SpeedQuestionWaiting";
import type {
  Question,
  Session,
  GameState,
  EliminationEvent,
  Participant,
} from "../../lib/presentation.types";
import AppIcon from "../../components/AppIcon";
import { MoreHorizontal, ChevronUp, ChevronDown } from "lucide-react";

import { EliminationOverlay } from "./components/EliminationOverlay";
import { SpectatorMode } from "./components/SpectatorMode";
import { LiveLeaderboard } from "./components/LiveLeaderboard";
import { WinnerCelebration } from "./components/WinnerCelebration";
import { GameOverOverlay } from "./components/GameOverOverlay";
import { CentPourCentBackground } from "./components/CentPourCentBackground";
import { SessionService } from "../../service/session.service.ts";
import "../../styles/cent-pour-cent-logique.css";

type SessionState =
  | "join"
  | "question"
  | "submitted"
  | "waiting"
  | "ended"
  | "error"
  | "speed_waiting"
  | "final_decision";

interface ParticipantSession {
  session: Session;
  participantId: string;
  participantName: string;
  participantToken: string;
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
  const [showResults, setShowResults] = useState<boolean>(false);

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
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [submittedOptionId, setSubmittedOptionId] = useState<string | null>(
    null,
  );
  const [showAnswerReveal, setShowAnswerReveal] = useState<boolean>(false);

  // ── SKIP BUTTON STATE ───────────────────────────────────────────────
  const [skipsRemaining, setSkipsRemaining] = useState<number>(0);
  const [maxSkipsPerParticipant, setMaxSkipsPerParticipant] = useState<number>(1);
  const [isSkipping, setIsSkipping] = useState<boolean>(false);

  // ── SPEED QUESTION STATE ────────────────────────────────────────────
  const [isSpeedWaiting, setIsSpeedWaiting] = useState<boolean>(false);
  const [speedRank, setSpeedRank] = useState<number | null>(null);
  const [speedMaxAdvance, setSpeedMaxAdvance] = useState<number>(3);
  const [hasSubmittedThisRound, setHasSubmittedThisRound] = useState<boolean>(false);
  const [showSpeedEliminationOverlay, setShowSpeedEliminationOverlay] = useState<boolean>(false);
  const [speedEliminationRank, setSpeedEliminationRank] = useState<number | null>(null);
  // NEW: whether the participant answered correctly on the current speed question.
  // Used to decide if the elimination overlay should show rank info.
  //   true  → correct but too slow → show rank in overlay
  //   false → wrong answer         → show default overlay (no rank)
  const [speedAnsweredCorrectly, setSpeedAnsweredCorrectly] = useState<boolean>(false);

  // ── FINAL ROUND STATE ───────────────────────────────────────────────
  const [isFinalDecision, setIsFinalDecision] = useState<boolean>(false);
  const [finalDecisionTimer, setFinalDecisionTimer] = useState<number>(20);
  const [hasMadeDecision, setHasMadeDecision] = useState<boolean>(false);

  // ── UI STATE: Collapsible session info header ───────────────────────
  const [isHeaderOpen, setIsHeaderOpen] = useState<boolean>(false);

  const participantSessionRef = useRef<ParticipantSession | null>(null);
  const currentQuestionRef = useRef<Question | null>(null);
  const sessionStateRef = useRef<SessionState>("join");
  const questionClosedRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const questionActiveRef = useRef<boolean>(true);
  const timerRemainingRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const toastRef = useRef(toast);
  const isEliminatedRef = useRef<boolean>(false);
  const answerRevealTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const eliminationOverlayShownRef = useRef<boolean>(false);
  // Ref mirror of speedAnsweredCorrectly — safe to read inside broadcast callbacks.
  const speedAnsweredCorrectlyRef = useRef<boolean>(false);

  // BUG FIX (Bug 3): tracks whether THIS participant explicitly chose "No" in
  // the final-round decision. Used in the FINAL_ROUND_START guard so that only
  // withdrawn participants are blocked from receiving the final question.
  // Legitimate spectators (eliminated in a prior round) must still receive it
  // so SpectatorMode can display it in read-only mode.
  const hasWithdrawnFromFinalRoundRef = useRef<boolean>(false);

  // OPTIMIZED: wall-clock anchor reference
  const questionEndsAtRef = useRef<number | null>(null);

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
  useEffect(() => {
    speedAnsweredCorrectlyRef.current = speedAnsweredCorrectly;
  }, [speedAnsweredCorrectly]);

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

  // ── Load skips data when participant joins ─────────────────────────
  // OPTIMIZED: accepts an optional `preloadedMaxSkips` parameter that is
  // supplied by joinSession (which now returns max_skips_per_participant
  // directly from the context row). When provided the 2-query chain
  // sessions→contexts inside getMaxSkipsForSession is skipped entirely,
  // saving 2 DB round-trips per participant join (200 fewer queries for
  // 100 concurrent participants).
  const loadSkipsData = useCallback(async (preloadedMaxSkips?: number) => {
    if (!participantSessionRef.current) return;
    
    const sessionId = participantSessionRef.current.session.id;
    const participantId = participantSessionRef.current.participantId;
    
    // Use preloaded value when available; fall back to a DB fetch only for
    // the rare case where loadSkipsData is called outside of the join flow.
    const maxSkips = preloadedMaxSkips !== undefined
      ? preloadedMaxSkips
      : await SessionService.getMaxSkipsForSession(sessionId);
    setMaxSkipsPerParticipant(maxSkips);
    
    const skipsUsed = await SessionService.getParticipantSkipsUsed(participantId);
    const remaining = Math.max(0, maxSkips - skipsUsed);
    setSkipsRemaining(remaining);
  }, []);

  // OPTIMIZED: loadMetadata has been removed from this useEffect.
  // The context metadata (gameMode, themeId, finalRoundDecisionTimer,
  // maxSkipsPerParticipant) is now returned directly by SessionService.joinSession
  // and applied synchronously in handleJoinSession, eliminating 2 extra DB
  // round-trips (sessions→contexts) that previously fired after every join.
  //
  // This useEffect now only calls loadSkipsData to refresh the skips-used
  // count from the DB (1 query). The maxSkipsPerParticipant state is already
  // set by handleJoinSession before this fires, so loadSkipsData receives it
  // as a preloaded value and skips its own DB fetch.
  useEffect(() => {
    const sessionId = participantSession?.session?.id;
    if (!sessionId) return;

    // Pass the already-known maxSkipsPerParticipant so loadSkipsData skips
    // the redundant getMaxSkipsForSession DB call.
    loadSkipsData(maxSkipsPerParticipant);
  }, [participantSession?.session?.id, loadSkipsData, maxSkipsPerParticipant]);

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

    // OPTIMIZED: Removed setInterval(refreshGameState, 2000).
    // Previously this polled the DB every 2 s per participant in elimination
    // mode — 100 participants × 1 query/2 s = 50 queries/s just for game state.
    // Game-state changes (eliminations, round advances) are already delivered
    // in real-time via Supabase Broadcast events (PLAYER_ELIMINATED,
    // GAME_STATE_UPDATE) which trigger setGameState updates. The one-time
    // fetch below is enough to hydrate state on initial join.
    refreshGameState();

    return () => {
      isMounted = false;
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
      SCALING: "scaling",
      RANKING: "ranking",
      GRID_2X2: "grid-2x2",
      VOTE: "vote",
    };
    return mapping[dbType] || "multiple-choice";
  };

  const stopLocalCountdown = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = undefined;
    }
  }, []);

  const startWallClockCountdown = useCallback(
    (endsAtMs: number) => {
      stopLocalCountdown();

      timerIntervalRef.current = setInterval(() => {
        if (isPausedRef.current || !questionActiveRef.current) return;

        const remaining = Math.max(
          0,
          Math.ceil((endsAtMs - Date.now()) / 1000),
        );

        timerRemainingRef.current = remaining;
        setTimerRemaining(remaining);

        if (remaining <= 0) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = undefined;
          }
          timerRemainingRef.current = 0;
          setTimerRemaining(0);
          setQuestionActive(false);
          questionActiveRef.current = false;
          setQuestionClosed(true);
          questionClosedRef.current = true;
          toastRef.current({
            title: "Time's Up!",
            description: "The time for this question has expired.",
            duration: 2000,
          });
        }
      }, 500);
    },
    [stopLocalCountdown],
  );

  useEffect(() => () => stopLocalCountdown(), [stopLocalCountdown]);
  useEffect(() => () => clearAnswerRevealTimeout(), [clearAnswerRevealTimeout]);

  const applyQuestion = useCallback(
    (
      question: Question,
      timeLimit: number | null,
      endsAtMs?: number,
      hasAlreadyResponded: boolean = false,
    ) => {
      const limit = timeLimit == null || timeLimit <= 0 ? null : timeLimit;

      let remaining = limit ?? 0;
      let actualEndsAtMs: number | null = null;

      if (limit !== null) {
        if (endsAtMs && endsAtMs > Date.now()) {
          actualEndsAtMs = endsAtMs;
          remaining = Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000));
          questionEndsAtRef.current = endsAtMs;
        } else {
          actualEndsAtMs = Date.now() + limit * 1000;
          remaining = limit;
          questionEndsAtRef.current = actualEndsAtMs;
        }
      } else {
        questionEndsAtRef.current = null;
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
      setShowSpeedEliminationOverlay(false);
      setSpeedEliminationRank(null);
      eliminationOverlayShownRef.current = false;
      
      if (question.showResultsInstantly) {
        setShowResults(true);
      } else {
        setShowResults(false);
      }
      
      // Reset ALL speed state for the new question — this is what clears the
      // "vous passez" screen for advancing participants.
      setIsSpeedWaiting(false);
      setSpeedRank(null);
      setHasSubmittedThisRound(false);
      setSpeedAnsweredCorrectly(false);
      speedAnsweredCorrectlyRef.current = false;

      if (hasAlreadyResponded) {
        setSessionState("submitted");
        sessionStateRef.current = "submitted";
      } else {
        setSessionState("question");
        sessionStateRef.current = "question";
      }

      if (limit !== null && remaining > 0 && actualEndsAtMs) {
        startWallClockCountdown(actualEndsAtMs);
      }
    },
    [startWallClockCountdown, clearAnswerRevealTimeout],
  );

  const loadQuestion = useCallback(
    async (
      questionId: string,
      questionIndex: number,
      timeLimit?: number | null,
      endsAtMs?: number,
    ) => {
      if (!participantSessionRef.current) return;

      let hasAlreadyResponded = false;
      try {
        hasAlreadyResponded = await SessionService.checkExistingResponse(
          participantSessionRef.current.session.id,
          participantSessionRef.current.participantId,
          questionId,
          participantSessionRef.current.participantToken,
        );
      } catch (err) {
        console.error('Failed to check existing response:', err);
      }

      // Always fetch from the DB so that is_speed_question and speed_max_advance
      // are guaranteed accurate.
      try {
        const { data: questionData, error: questionError } = await supabase
          .from("questions")
          .select("*")
          .eq("id", questionId)
          .maybeSingle();

        if (questionError || !questionData) {
          const cachedQ =
            participantSessionRef.current.session.presentation.questions.find(
              (q) => q.id === questionId,
            );
          if (cachedQ) {
            applyQuestion(
              cachedQ,
              cachedQ.timeLimit ?? timeLimit ?? null,
              endsAtMs,
              hasAlreadyResponded,
            );
          } else {
            setSessionState("waiting");
            sessionStateRef.current = "waiting";
          }
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
          statements: questionData.statements || undefined,
          scale: questionData.scale,
          labels: questionData.labels,
          points: questionData.points,
          image: questionData.image_url,
          displayStyle: questionData.display_style,
          skipAllowed: questionData.skip_allowed ?? false,
          isSpeedQuestion: questionData.is_speed_question ?? false,
          speedMaxAdvance: questionData.speed_max_advance ?? null,
          showResultsInstantly: questionData.show_results_instantly ?? false,
          xAxis: questionData.x_axis,
          yAxis: questionData.y_axis,
        };

        if (newQuestion.isSpeedQuestion && newQuestion.speedMaxAdvance) {
          setSpeedMaxAdvance(newQuestion.speedMaxAdvance);
        }

        applyQuestion(
          newQuestion,
          questionData.time_limit ?? timeLimit ?? null,
          endsAtMs,
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
          const endsAt = payload?.endsAt as number | undefined;

          if (questionId) {
            stopLocalCountdown();
            clearAnswerRevealTimeout();
            setShowAnswerReveal(false);
            setShowEliminationOverlay(false);
            setShowSpeedEliminationOverlay(false);
            eliminationOverlayShownRef.current = false;
            setIsFinalDecision(false);
            setHasMadeDecision(false);
            loadQuestion(questionId, questionIndex, timeLimit ?? null, endsAt);
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
          const endsAt = payload?.endsAt as number | undefined;

          setIsPaused(false);
          isPausedRef.current = false;
          setTimerRemaining(remaining);
          timerRemainingRef.current = remaining;

          if (remaining > 0 && questionActiveRef.current) {
            const endsAtMs = endsAt ?? Date.now() + remaining * 1000;
            startWallClockCountdown(endsAtMs);
          }
          break;
        }

        case SESSION_EVENTS.FORCE_QUESTION_CLOSE: {
          if (!questionClosedRef.current) {
            setQuestionClosed(true);
            questionClosedRef.current = true;
            stopLocalCountdown();
          }
          // BUG FIX: For untimed speed questions the host sends FORCE_QUESTION_CLOSE
          // when "Show Results" is clicked (timer never expires naturally). Participants
          // who haven't answered yet would be left on the frozen question form with
          // no feedback while the host processes results in the background.
          // Fix: transition unanswered participants to speed_waiting so they see
          // SpeedQuestionWaiting, and when SPEED_QUESTION_RESULTS arrives shortly
          // after they are processed correctly (eliminated or advancing).
          if (
            currentQuestionRef.current?.isSpeedQuestion &&
            sessionStateRef.current === "question" &&
            !isEliminatedRef.current
          ) {
            setIsSpeedWaiting(true);
            setSessionState("speed_waiting");
            sessionStateRef.current = "speed_waiting";
          }
          break;
        }

        case "SESSION_END": {
          stopLocalCountdown();
          clearAnswerRevealTimeout();
          setShowAnswerReveal(false);
          setShowEliminationOverlay(false);
          setShowSpeedEliminationOverlay(false);
          eliminationOverlayShownRef.current = false;
          setIsFinalDecision(false);
          setSessionState("ended");
          sessionStateRef.current = "ended";
          break;
        }

        case SESSION_EVENTS.PLAYER_ELIMINATED: {
          const ev = payload as unknown as EliminationEvent;
          setEliminationEvents((prev) => [...prev, ev]);

          // BUG FIX: Participant count inconsistency.
          // Previously each participant called getGameState() independently on
          // receiving PLAYER_ELIMINATED. These DB queries ran at slightly different
          // times, so fast participants saw the updated count while slow ones still
          // saw the old count — causing every participant to potentially show a
          // different totalPlayers or alive count for a few seconds.
          //
          // Fix: update gameState locally (move participant from alive → eliminated)
          // so all clients apply the same deterministic change to the same starting
          // state. The host's GAME_STATE_UPDATE broadcast (sent after processing)
          // will arrive shortly and overwrite with the authoritative DB values,
          // so any minor local inaccuracy corrects itself automatically.
          setGameState((prev) => {
            const participant = prev.alive.find((p) => p.id === ev.participantId);
            if (!participant) return prev; // already eliminated or not in state yet
            return {
              ...prev,
              alive: prev.alive.filter((p) => p.id !== ev.participantId),
              eliminated: [
                ...prev.eliminated,
                {
                  ...participant,
                  isAlive: false,
                  eliminatedAtRound: ev.roundNumber ?? null,
                  eliminatedAtQuestionId: ev.questionId ?? null,
                },
              ],
              history: [
                ...prev.history,
                {
                  participantId: ev.participantId,
                  participantName: ev.participantName,
                  questionId: ev.questionId,
                  roundNumber: ev.roundNumber,
                  eliminatedAt:
                    ev.eliminatedAt instanceof Date
                      ? ev.eliminatedAt
                      : new Date(ev.eliminatedAt as unknown as string),
                },
              ],
            };
          });

          // Check if the eliminated participant is the local user.
          const myId = participantSessionRef.current?.participantId;
          if (myId && ev.participantId === myId && !isEliminatedRef.current) {
            setIsEliminated(true);
            isEliminatedRef.current = true;
            setEliminatedAtRound(ev.roundNumber);
          }
          break;
        }

        case SESSION_EVENTS.GAME_STATE_UPDATE: {
          const incoming = payload as unknown as GameState;
          setGameState((prev) => {
            // BUG FIX: monotonic guard against stale host broadcasts.
            // When a participant connects, the host may respond with a
            // GAME_STATE_UPDATE whose totalPlayers is lower than what the
            // participant already knows (e.g. the host's ref was empty/stale
            // before its own DB refresh completed). Accepting that blindly would
            // overwrite a correctly-fetched local state, causing the "N/N → 0/0"
            // flash. totalPlayers is monotonically non-decreasing (players only
            // join; they are never removed), so a lower incoming count means
            // the host's snapshot is older than ours — discard it.
            if (prev.totalPlayers > 0 && (incoming.totalPlayers ?? 0) < prev.totalPlayers) {
              return prev;
            }
            return incoming;
          });
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
            setShowSpeedEliminationOverlay(false);
            eliminationOverlayShownRef.current = false;
            setIsFinalDecision(false);
          }
          break;
        }

        case "GAME_OVER": {
          setIsGameOver(true);
          break;
        }

        case SESSION_EVENTS.FINAL_ROUND_DECISION: {
          // Only alive participants get the decision screen.
          if (isEliminatedRef.current) break;

          const decisionPayload = payload as { decisionTimer: number };
          console.log("[FINAL] Decision screen received, timer:", decisionPayload.decisionTimer);
          setFinalDecisionTimer(decisionPayload.decisionTimer);
          setIsFinalDecision(true);
          setHasMadeDecision(false);
          setSessionState("final_decision");
          sessionStateRef.current = "final_decision";

          stopLocalCountdown();
          clearAnswerRevealTimeout();
          break;
        }

        case SESSION_EVENTS.SPEED_QUESTION_RESULTS: {
          const results = payload as {
            advancingParticipantIds: string[];
            eliminatedCount: number;
            maxAdvance: number;
          };

          console.log("[SPEED] Results received:", results);
          console.log("[SPEED] My participant ID:", participantSessionRef.current?.participantId);

          if (participantSessionRef.current) {
            const myId = participantSessionRef.current.participantId;
            const isAdvancing = results.advancingParticipantIds.includes(myId);

            // Rank among all submitters (1-indexed). Non-advancing participants
            // who answered correctly will have a rank > maxAdvance.
            const rankIndex = results.advancingParticipantIds.findIndex(
              (id) => id === myId,
            );
            const rank = rankIndex !== -1 ? rankIndex + 1 : results.maxAdvance + 1;

            console.log("[SPEED] Am I advancing?", isAdvancing, "Rank:", rank, "Answered correctly:", speedAnsweredCorrectlyRef.current);

            setSpeedRank(rank);
            setSpeedMaxAdvance(results.maxAdvance);

            if (!isAdvancing) {
              // Only propagate rank to the EliminationOverlay when the participant
              // answered CORRECTLY but was too slow. Wrong-answer eliminations
              // should show the default overlay without rank information.
              setSpeedEliminationRank(
                speedAnsweredCorrectlyRef.current ? rank : null,
              );
            }
          }
          break;
        }

        case SESSION_EVENTS.FINAL_ROUND_START: {
          // BUG FIX (Bug 3): only block participants who explicitly withdrew.
          // Previously the guard was `isEliminatedRef.current` which blocked ALL
          // eliminated participants, preventing legitimate spectators from seeing
          // the final question in read-only SpectatorMode. Now only "No" voters
          // (hasWithdrawnFromFinalRoundRef) are blocked; spectators whose
          // elimination happened in a prior round receive the updated
          // currentQuestion so SpectatorMode renders the correct question text.
          // BUG FIX (Final-round withdrawal): removed the blanket break on
          // hasWithdrawnFromFinalRoundRef. Withdrawn participants are now
          // properly marked isEliminated=true and receive the final question
          // here so SpectatorMode can render it in read-only mode.

          const finalPayload = payload as {
            questionId: string;
            timeLimit: number;
            startedAt: string;
            endsAt: number;
          };
          console.log("[FINAL] Final round starting");
          setIsFinalDecision(false);
          setHasMadeDecision(false);
          loadQuestion(
            finalPayload.questionId,
            (participantSession?.session.presentation.questions.length ?? 1) - 1,
            finalPayload.timeLimit,
            finalPayload.endsAt,
          );
          break;
        }

        default:
          break;
      }
    },
    [
      loadQuestion,
      startWallClockCountdown,
      stopLocalCountdown,
      clearAnswerRevealTimeout,
      gameState.currentRound,
    ],
  );

  const { connected: wsConnected, sendMessage } = useSessionSocket({
    sessionId: participantSession?.session.id ?? null,
    role: "audience",
    onMessage: handleBroadcast,
    enabled: !!participantSession,
  });

  // ── Timer-end effect: determine what to show when a question closes ───────
  useEffect(() => {
    if (!questionClosed) return;
    if (!isElimination) return;
    if (!participantSession || !currentQuestion) return;
    if (revealedWinner) return;
    if (isFinalDecision) return;

    const ps = participantSession;
    const q = currentQuestion;

    // For speed questions the results arrive via broadcast; nothing extra needed here.
    if (q.isSpeedQuestion) {
      return;
    }

    if (isEliminatedRef.current) {
      const liveRoundNumber =
        currentQuestionRef.current?.number ?? gameState.currentRound ?? 0;

      if (eliminatedAtRound === liveRoundNumber && sessionStateRef.current !== "submitted") {
        setShowAnswerReveal(true);
        clearAnswerRevealTimeout();
        answerRevealTimeoutRef.current = setTimeout(() => {
          setShowAnswerReveal(false);
          setShowEliminationOverlay(true);
          answerRevealTimeoutRef.current = undefined;
        }, ANSWER_REVEAL_DURATION_MS);
      } else {
        setShowAnswerReveal(true);
      }
      return;
    }

    if (sessionStateRef.current === "submitted") {
      setShowCorrectAnswerFeedback(true);
      return;
    }

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
        answerRevealTimeoutRef.current = setTimeout(() => {
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
                if (recalculated > 0 && questionActiveRef.current) {
                  const endsAtMs = Date.now() + recalculated * 1000;
                  startWallClockCountdown(endsAtMs);
                }
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
            setShowSpeedEliminationOverlay(false);
            eliminationOverlayShownRef.current = false;
            const endsAtMs = updatedSession.current_question_ends_at
              ? new Date(updatedSession.current_question_ends_at).getTime()
              : undefined;
            loadQuestion(
              newQuestionId,
              newQuestionIndex,
              undefined,
              endsAtMs,
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
    startWallClockCountdown,
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
          "id, code, status, context_id, is_paused, current_question_started_at, current_question_ends_at, timer_paused_remaining, timer_resumed_at",
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
        participantToken: result.participantToken,
      };

      participantSessionRef.current = ps;
      setParticipantSession(ps);

      // OPTIMIZED: Apply context metadata bundled in the join result.
      // Previously these values required 2 extra DB round-trips after joining
      // (sessions → contexts). Now they come for free from joinSession,
      // which fetches the context row as part of its existing query.
      const joinedGameMode = result.gameMode ?? "standard";
      const joinedThemeId = result.themeId ?? "default";
      setContextMeta({ gameMode: joinedGameMode, themeId: joinedThemeId });
      isEliminationRef.current = joinedGameMode === "elimination";
      if (result.finalRoundDecisionTimer) {
        setFinalDecisionTimer(result.finalRoundDecisionTimer);
      }
      // Set maxSkipsPerParticipant immediately so the loadSkipsData call
      // below can use it without an extra DB round-trip.
      const joinedMaxSkips = result.maxSkipsPerParticipant ?? 1;
      setMaxSkipsPerParticipant(joinedMaxSkips);

      const joinedCode = joinData.code.toUpperCase();
      if (searchParams.get("code") !== joinedCode) {
        setSearchParams({ code: joinedCode }, { replace: true });
      }

      const paused = sessionExists.is_paused || false;
      setIsPaused(paused);
      isPausedRef.current = paused;

      // Pass the preloaded maxSkips to avoid the redundant
      // getMaxSkipsForSession DB call inside loadSkipsData.
      await loadSkipsData(joinedMaxSkips);

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
          
          let endsAtMs: number | undefined = undefined;
          if (sessionExists.current_question_ends_at) {
            endsAtMs = new Date(sessionExists.current_question_ends_at).getTime();
          } else {
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
            if (remaining !== null && remaining > 0) {
              endsAtMs = Date.now() + remaining * 1000;
            }
          }

          let hasAlreadyResponded = false;
          try {
            hasAlreadyResponded = await SessionService.checkExistingResponse(
              result.session.id,
              result.participantId,
              currentQ.id,
              result.participantToken,
            );
          } catch (err) {
            console.error('Failed to check existing response:', err);
          }

          setCurrentQuestion(currentQ);
          currentQuestionRef.current = currentQ;
          setTimerTotal(timeLimit ?? 0);
          
          // A timed question whose wall-clock end has already passed means the
          // timer is expired. Late-joining participants must see WaitingState
          // instead of the question form so they cannot submit answers after
          // time has run out (standard mode only — elimination mode blocks
          // mid-session joins entirely).
          const isTimedQuestion = timeLimit !== null && timeLimit > 0;
          const timerAlreadyExpired =
            isTimedQuestion && (!endsAtMs || endsAtMs <= Date.now());

          if (endsAtMs && endsAtMs > Date.now()) {
            const remaining = Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000));
            setTimerRemaining(remaining);
            timerRemainingRef.current = remaining;
            questionEndsAtRef.current = endsAtMs;
            if (!paused && remaining > 0) {
              startWallClockCountdown(endsAtMs);
            }
          } else {
            // If the timer has expired set remaining to 0; otherwise fall back
            // to the full timeLimit for untimed / no-anchor questions.
            const remaining = timerAlreadyExpired ? 0 : (timeLimit ?? 0);
            setTimerRemaining(remaining);
            timerRemainingRef.current = remaining;
          }

          // Mark the question as closed when the timer has already expired so
          // the submit / skip guards inside handleSubmitResponse and
          // handleSkipResponse also block any late submissions.
          if (timerAlreadyExpired) {
            setQuestionActive(false);
            questionActiveRef.current = false;
            setQuestionClosed(true);
            questionClosedRef.current = true;
          } else {
            setQuestionActive(true);
            questionActiveRef.current = true;
            setQuestionClosed(false);
            questionClosedRef.current = false;
          }

          setShowCorrectAnswerFeedback(false);
          setSubmittedOptionId(null);
          setShowAnswerReveal(false);

          // Late-joining participants with an expired timer see WaitingState
          // (even if they have not yet responded) so they cannot answer.
          if (timerAlreadyExpired && !hasAlreadyResponded) {
            setSessionState("waiting");
            sessionStateRef.current = "waiting";
          } else {
            setSessionState(hasAlreadyResponded ? "submitted" : "question");
            sessionStateRef.current = hasAlreadyResponded ? "submitted" : "question";
          }
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

  // ── Handle final round decision ─────────────────────────────────────────
  const handleFinalRoundContinue = async () => {
    if (hasMadeDecision) return;
    setHasMadeDecision(true);
    
    if (participantSessionRef.current) {
      await SessionService.recordFinalRoundDecision(
        participantSessionRef.current.participantId,
        true,
      );
      sendMessage({
        type: SESSION_EVENTS.FINAL_ROUND_DECISION_RESPONSE,
        payload: {
          participantId: participantSessionRef.current.participantId,
          choseContinue: true,
        },
      });
    }
    
    setSessionState("waiting");
    sessionStateRef.current = "waiting";
    setIsFinalDecision(false);
  };

  const handleFinalRoundWithdraw = async () => {
    if (hasMadeDecision) return;
    
    // Immediately exit final decision state
    setIsFinalDecision(false);
    setSessionState("waiting");
    sessionStateRef.current = "waiting";
    
    setHasMadeDecision(true);

    if (participantSessionRef.current) {
      const myId = participantSessionRef.current.participantId;
      const myName = participantSessionRef.current.participantName;
      const qId = currentQuestionRef.current?.id ?? "";
      const roundNum = gameState.currentRound ?? 0;
      const sessId = participantSessionRef.current.session.id;

      // FIX: Immediately update local gameState so the participant sees themselves as eliminated
      setGameState((prev) => {
        // Remove myself from alive
        const stillAlive = prev.alive.filter((p) => p.id !== myId);
        // Add myself to eliminated
        const me = prev.alive.find((p) => p.id === myId);
        const newEliminated = me
          ? [
              ...prev.eliminated,
              {
                ...me,
                isAlive: false,
                eliminatedAtRound: roundNum,
                eliminatedAtQuestionId: qId,
              },
            ]
          : prev.eliminated;

        return {
          ...prev,
          alive: stillAlive,
          eliminated: newEliminated,
          history: [
            ...prev.history,
            {
              participantId: myId,
              participantName: myName,
              questionId: qId,
              roundNumber: roundNum,
              eliminatedAt: new Date(),
            },
          ],
        };
      });

      // Mark eliminated in state
      setIsEliminated(true);
      isEliminatedRef.current = true;
      setEliminatedAtRound(roundNum);

      // Show elimination overlay
      setShowEliminationOverlay(true);
      eliminationOverlayShownRef.current = true;

      // Write to database (async, don't wait)
      SessionService.recordFinalRoundDecision(
        myId,
        false,
        sessId,
        qId,
        roundNum,
        myName
      );

      // Broadcast to host
      sendMessage({
        type: SESSION_EVENTS.PLAYER_ELIMINATED,
        payload: {
          participantId: myId,
          participantName: myName,
          questionId: qId,
          roundNumber: roundNum,
          eliminatedAt: new Date().toISOString(),
        },
      });

      sendMessage({
        type: SESSION_EVENTS.FINAL_ROUND_DECISION_RESPONSE,
        payload: { participantId: myId, choseContinue: false },
      });
    }
  };

  // ── Handle speed waiting screen callbacks ───────────────────────────────
  // NOTE: handleSpeedAdvanced is intentionally never called automatically.
  // The "vous passez" screen persists until applyQuestion resets speed state
  // when the next QUESTION_CHANGE broadcast arrives.
  const handleSpeedAdvanced = useCallback(() => {
    console.log("[SPEED] Participant advanced - waiting for next question to reset state");
    // No-op: state reset happens in applyQuestion on next question load.
  }, []);

  const handleSpeedEliminated = useCallback(() => {
    console.log("[SPEED] Participant eliminated - showing elimination overlay");
    setIsSpeedWaiting(false);
    setSpeedRank(null);
    // Must move out of "speed_waiting" so the early return no longer blocks the
    // EliminationOverlay render. "submitted" is correct — the participant did submit.
    setSessionState("submitted");
    sessionStateRef.current = "submitted";
    // Show the speed elimination overlay (rank info already set in SPEED_QUESTION_RESULTS)
    setShowSpeedEliminationOverlay(true);
  }, []);

  // ── Handle skip submission ──────────────────────────────────────────
  const handleSkipResponse = async () => {
    if (
      !questionActiveRef.current ||
      questionClosedRef.current ||
      isPausedRef.current
    ) {
      toast({
        title: "Cannot Skip",
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

    setIsSkipping(true);

    try {
      const result = await SessionService.submitSkip({
        sessionId: ps.session.id,
        participantId: ps.participantId,
        questionId: q.id,
        participantToken: ps.participantToken,
        maxSkipsPerParticipant,
      });

      if (result.success) {
        setSkipsRemaining((prev) => Math.max(0, prev - 1));
        setSessionState("submitted");
        sessionStateRef.current = "submitted";
        toast({
          title: "Question Skipped",
          description: `You have ${Math.max(0, skipsRemaining - 1)} skip(s) remaining.`,
        });
        sendMessage({
          type: SESSION_EVENTS.ANSWER_RECEIVED,
          payload: {
            participantId: ps.participantId,
            questionId: q.id,
            correct: false,
            skipped: true,
          },
        });
      } else {
        toast({
          title: "Skip Failed",
          description: result.error || "Unable to skip this question.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Skip submission failed:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to skip question.",
        variant: "destructive",
      });
    } finally {
      setIsSkipping(false);
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

    if (eliminationActive && (q.type === "multiple-choice" || q.type === "vote")) {
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
      setHasSubmittedThisRound(true);

      // For speed questions: immediately show the waiting screen and record
      // whether the answer was correct. This is used later when SPEED_QUESTION_RESULTS
      // arrives to decide whether to show rank info in the elimination overlay.
      if (q.isSpeedQuestion) {
        setSpeedAnsweredCorrectly(isCorrect);
        speedAnsweredCorrectlyRef.current = isCorrect;
        setIsSpeedWaiting(true);
        setSessionState("speed_waiting");
        sessionStateRef.current = "speed_waiting";
      }

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
          // NOTE: We do NOT override sessionState here for speed questions —
          // SpeedQuestionWaiting must remain visible so the participant sees their result.
        }

        sendMessage({
          type: SESSION_EVENTS.ANSWER_RECEIVED,
          payload: {
            participantId: ps.participantId,
            questionId: q.id,
            correct: result.correct,
          },
        });

        if (result.correct && !q.isSpeedQuestion) {
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

    // Grid 2x2 submission
    if (q.type === "grid-2x2") {
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
            description: "Your grid placements have been recorded",
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
      return;
    }

    // Standard submission for non-elimination
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
    eliminationOverlayShownRef.current = false;
    questionEndsAtRef.current = null;
    speedAnsweredCorrectlyRef.current = false;
    hasWithdrawnFromFinalRoundRef.current = false;

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
    setShowSpeedEliminationOverlay(false);
    setSpeedEliminationRank(null);
    setShowCorrectAnswerFeedback(false);
    setSubmittedOptionId(null);
    setShowAnswerReveal(false);
    setRevealedWinner(null);
    setIsGameOver(false);
    setSkipsRemaining(0);
    setMaxSkipsPerParticipant(1);
    setIsSkipping(false);
    setIsSpeedWaiting(false);
    setSpeedRank(null);
    setHasSubmittedThisRound(false);
    setSpeedAnsweredCorrectly(false);
    setIsFinalDecision(false);
    setHasMadeDecision(false);
    setShowResults(false);
    setIsHeaderOpen(false); // Reset header state
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
           
          </div>
        </div>
      );
    }
    const fraction = total > 0 ? timerRemaining / total : 0;
    const isWarning = timerRemaining <= 10 && timerRemaining > 0;

    let barColor = "bg-primary";
    if (isWarning )  barColor = "bg-red-500";

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
              isWarning
                  ? "bg-background border-border text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400 "
                  : "bg-background border-border text-foreground"
            }`}
          >
            <span>{`${timerRemaining}s`}</span>
          </div>
        </div>
      </div>
    );
  };

  // ── Collapsible Session Info Header (3-dots menu) ─────────────────────────
  const renderSessionInfo = () => {
    if (sessionState === "join" || !participantSession) return null;

    return (
      <div className="relative z-50 flex justify-end mb-2">
        {/* 3-dots button */}
        <button
          onClick={() => setIsHeaderOpen(!isHeaderOpen)}
          className="w-8 h-8 rounded-full bg-card border border-border shadow-sm hover:bg-muted transition-colors flex items-center justify-center"
          aria-label="Session info"
        >
          <MoreHorizontal size={16} className="text-muted-foreground" />
        </button>
        
        {/* Dropdown menu */}
        {isHeaderOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsHeaderOpen(false)} />
            <div className="absolute top-10 right-0 z-50 w-64 bg-card rounded-xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-3 border-b border-border bg-muted/20">
                <p className="text-xs font-medium text-foreground truncate">
                  {participantSession.session.presentation.title}
                </p>
                <p className="font-mono text-sm font-bold mt-1 tracking-wider">
                  {participantSession.session.code}
                </p>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isPaused ? "bg-yellow-500" : "bg-success"}`} />
                    <span className="text-xs font-medium">{isPaused ? "Paused" : "Live"}</span>
                  </div>
                </div>
                {sessionState === "question" && currentQuestion && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Question</span>
                    <span className="text-xs font-medium">
                      {currentQuestion.number} / {participantSession.session.presentation.questions.length}
                    </span>
                  </div>
                )}
                {participantSession.participantName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Joined as</span>
                    <span className="text-xs font-medium truncate max-w-[120px]">
                      {participantSession.participantName}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setIsHeaderOpen(false);
                    handleJoinNewSession();
                  }}
                  className="w-full mt-2 text-center text-xs text-red-500 hover:text-red-600 py-1.5 border-t border-border pt-2 transition-colors"
                >
                  Leave Session
                </button>
              </div>
            </div>
          </>
        )}
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
        const isSpeed = currentQuestion.isSpeedQuestion === true;
        
        return (
          <div className="relative">
            {isPaused && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center">
                <div className="bg-card rounded-xl p-8 text-center max-w-md mx-4">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-100  flex items-center justify-center">
                    <AppIcon
                      name="Pause"
                      size={40}
                      className="dark:bg-yellow-900/20"
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
                  skipAllowed: currentQuestion.skipAllowed,
                }}
                onSubmit={(r) => handleSubmitResponse({ optionId: r.optionId })}
                onSkip={currentQuestion.skipAllowed && skipsRemaining > 0 ? handleSkipResponse : undefined}
                skipsRemaining={skipsRemaining}
                maxSkips={maxSkipsPerParticipant}
                isSubmitting={isSkipping}
                isSpeedQuestion={isSpeed}
                speedMaxAdvance={currentQuestion.speedMaxAdvance ?? 3}
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
            {currentQuestion.type === "scaling" && (
              <ScalingQuestion
                question={{
                  text: currentQuestion.text,
                  description: currentQuestion.description,
                  image: getQuestionImage(currentQuestion),
                  statements: (currentQuestion as any).statements ?? [],
                  scale: currentQuestion.scale,
                  labels: currentQuestion.labels,
                  responseCount: 0,
                }}
                onSubmit={(r) =>
                  handleSubmitResponse({
                    scalingAnswers: r.scalingAnswers,
                  })
                }
              />
            )}
            {currentQuestion.type === "ranking" && (
              <RankingQuestion
                question={{
                  text: currentQuestion.text,
                  description: currentQuestion.description,
                  image: getQuestionImage(currentQuestion),
                  options: (currentQuestion.options ?? []) as Array<{
                    id: string;
                    text: string;
                  }>,
                  responseCount: 0,
                }}
                onSubmit={(r) => handleSubmitResponse({ rankingOrder: r.rankingOrder })}
              />
            )}
            {currentQuestion.type === "grid-2x2" && (
              <Grid2x2Question
                question={{
                  text: currentQuestion.text,
                  description: currentQuestion.description,
                  image: getQuestionImage(currentQuestion),
                  imageUrl: getQuestionImage(currentQuestion),
                  options: (currentQuestion.options ?? []) as Array<{ id: string; text: string }>,
                  xAxis: (currentQuestion as any).xAxis,
                  yAxis: (currentQuestion as any).yAxis,
                }}
                onSubmit={(r) => handleSubmitResponse({ placements: r.placements })}
                isSubmitting={false}
              />
            )}
            {currentQuestion.type === "vote" && (
              <VoteQuestion
                question={{
                  text: currentQuestion.text,
                  description: currentQuestion.description,
                  image: getQuestionImage(currentQuestion),
                  imageUrl: getQuestionImage(currentQuestion),
                  options: (currentQuestion.options ?? []) as Array<{ id: string; text: string; imageUrl?: string | null }>,
                }}
                onSubmit={(r) => handleSubmitResponse({ optionId: r.optionId })}
                isSubmitting={false}
              />
            )}
          </div>
        );
      }

      case "speed_waiting":
        return (
          <SpeedQuestionWaiting
            visible={true}
            rank={speedRank}
            maxAdvance={speedMaxAdvance}
            waitingForOthers={speedRank === null}
            onAdvanced={handleSpeedAdvanced}
            onEliminated={handleSpeedEliminated}
          />
        );

      case "final_decision":
        return (
          <FinalRoundDecision
            visible={true}
            decisionTimer={finalDecisionTimer}
            onContinue={handleFinalRoundContinue}
            onWithdraw={handleFinalRoundWithdraw}
          />
        );

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

  // Detect Fin de Partie: all players eliminated, no winner.
  useEffect(() => {
    if (!isElimination || revealedWinner || isGameOver) return;
    if (!questionClosed) return;
    if (gameState.alive.length === 0 && gameState.totalPlayers > 0) {
      setIsGameOver(true);
    }
  }, [isElimination, revealedWinner, isGameOver, questionClosed, gameState.alive.length, gameState.totalPlayers]);

  if (isElimination && isGameOver && !revealedWinner) {
    return (
      <div className={themeClass}>
        <GameOverOverlay visible onQuit={() => { window.location.href = "/audience-participation"; }} />
      </div>
    );
  }

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
    // PRIORITY 1 — Speed question waiting: must bypass ALL elimination checks.
    // This handles both the "en attente" phase and the "vous passez" phase for
    // advancing participants (who stay here until the next question clears state).
    if (isSpeedWaiting || sessionState === "speed_waiting") {
      return (
        <div className={`${themeClass} min-h-screen bg-background relative`}>
          <SpeedQuestionWaiting
            visible={true}
            rank={speedRank}
            maxAdvance={speedMaxAdvance}
            waitingForOthers={speedRank === null}
            onAdvanced={handleSpeedAdvanced}
            onEliminated={handleSpeedEliminated}
          />
        </div>
      );
    }

    const liveRoundNumber =
      currentQuestion?.number ?? gameState.currentRound ?? 0;

    const hasJustSubmittedAndWaiting =
      !isEliminated && sessionState === "submitted" && !showCorrectAnswerFeedback;

    const eliminatedThisRoundWaiting =
      isEliminated &&
      !questionClosed &&
      eliminatedAtRound === liveRoundNumber &&
      sessionState !== "submitted";

    // Eliminated players drop into spectator mode — but NOT when speed_waiting
    // (handled above) or final_decision (FinalRoundDecision is only sent to alive players).
    const isEliminatedSpectator =
      isEliminated &&
      !showEliminationOverlay &&
      !showSpeedEliminationOverlay &&
      !showCorrectAnswerFeedback &&
      sessionState !== "final_decision";

    if (hasJustSubmittedAndWaiting || isEliminatedSpectator) {
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
        <>
          {/* Regular elimination overlay (non-speed questions) */}
          <EliminationOverlay
            show={showEliminationOverlay && !showSpeedEliminationOverlay}
            roundNumber={eliminatedAtRound}
            onStay={() => setShowEliminationOverlay(false)}
            onLeave={handleJoinNewSession}
          />

          {/* Speed-question elimination overlay.
              isSpeedQuestion=true + rank>0  → correct-but-slow → shows rank text.
              isSpeedQuestion=true + rank=null → wrong answer    → default text. */}
          <EliminationOverlay
            show={showSpeedEliminationOverlay}
            roundNumber={eliminatedAtRound}
            onStay={() => setShowSpeedEliminationOverlay(false)}
            onLeave={handleJoinNewSession}
            isSpeedQuestion={true}
            rank={speedEliminationRank}
            maxAdvance={speedMaxAdvance}
          />
        </>
      )}

      {renderTimerBar()}

      {/* Collapsible Session Info Header */}
      {renderSessionInfo()}

      <main
        className={`main-content ${sessionState === "question" ? "pt-0" : ""}`}
      >
        <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
          <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
            {renderContent()}
          </div>

          {/* BUG FIX: Leaderboard visibility.
               Previously shown to ALL participants when timerRemaining reached 0,
               which cluttered the UI for alive participants who are about to answer
               the next question. Now only visible to:
               - Eliminated participants (isEliminated) — they are in spectator mode
                 and the leaderboard is their primary view.
               - Waiting participants (sessionState === "waiting") — covers both
                 freshly-joined participants and the inter-question wait period. */}
          {isElimination &&
            sessionState !== "join" &&
            (isEliminated || sessionState === "waiting") && (
              <div className="mx-auto max-w-3xl mt-8">
                <LiveLeaderboard
                  gameState={gameState}
                  highlightParticipantId={participantSession?.participantId}
                  currentQuestionNumber={currentQuestion?.number}
                  defaultCollapsed={!isEliminated}
                />
              </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default AudienceParticipation;