// src/pages/HostSession/index.tsx
// Version avec UI de l'ancienne version ET timer wall-clock optimisé
// OPTIMIZED: Added debounced response refreshes to reduce database queries with 100+ participants
// SPEED QUESTION UPDATE: Added speed question processing and final round handling
// SPEED INTRO FIXES:
//   • SpeedQuestionIntro no longer re-shows after "Show Results" (or timer end).
//     handleStart/handleNext/handlePrevious gate setShowSpeedIntro(true) against
//     processedSpeedQuestionIdsRef — if the question was already processed the
//     overlay is simply skipped.
//   • The countdown timer in SpeedQuestionIntro has been replaced with a manual
//     "Show Question" button.  The host clicks it when ready; the click closes
//     the host overlay AND broadcasts SPEED_INTRO_DISMISS so all participant
//     overlays close simultaneously — no timer sync issues.
// FINAL ROUND FIXES:
//   • FinalRoundDecision (participant) no longer has an auto-withdraw timer.
//     Participants decide at their own pace.
//   • FinalRoundWaitingOverlay (host) no longer has an auto-advance timer.
//     The host clicks "Start Final Round" manually when ready.
//  Final round decision now triggers BEFORE the last question is shown.
//      handleNext now checks if the *next* question would be the last one (not the current).
// Untimed elimination questions now properly show the round elimination overlay
//      when the host clicks "Show Results" (not just when timer expires).
// SESSION CONNECTION & RESTORATION:
//   • GOODBYE handler: removes participant from local participants list immediately
//     when they close their tab, so the host count decrements without waiting for a
//     Supabase connection timeout (which can take 30-90 s).
//   • SESSION_RESTORE handler: re-adds a returning participant to the local participants
//     list after they successfully complete a "Welcome back" restore on the audience side.
//     Fetches the participant row from DB to ensure name/score/alive status are current.
//   • HEARTBEAT handler: presence-only signal logged for diagnostics. Can be extended
//     to implement timeout-based elimination (90 s = 3 missed heartbeats).
// BUG FIX: Timed elimination questions now call processUntimedQuestionEliminations()
//   when the timer expires instead of only setShowResults(true). Previously, participants
//   who left (tab close or explicit) as well as wrong-answer / no-answer participants were
//   never eliminated in the DB for timed questions — the elimination pipeline was only
//   wired to the host's "Show Results" click for untimed questions. The old 1200 ms
//   overlay block has been removed; processUntimedQuestionEliminations() already builds
//   the RoundEliminationsOverlay after fetching fresh game state.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { useSessionSocket, SESSION_EVENTS } from "../../lib/useSessionSocket";
import AppIcon from "../../components/AppIcon";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { useToast } from "../../hooks/use-toast";
import QuestionDisplay from "./components/QuestionDisplay";
import ControlPanel from "./components/ControlPanel";
import PauseOverlay from "./components/PauseOverlay";
import EndSessionModal from "./components/EndSessionModal";
import { EliminationHistory } from "./components/EliminationHistory";
import { RoundEliminationsOverlay } from "./components/RoundEliminationsOverlay";
import { SpeedQuestionAdvancingOverlay } from "./components/SpeedQuestionAdvancingOverlay";
import { SpeedQuestionIntro } from "../audience-participation/components/SpeedQuestionIntro";
import { FinalRoundWaitingOverlay } from "./components/FinalRoundWaitingOverlay";
import { GameOverOverlay } from "../audience-participation/components/GameOverOverlay";
import WinnerReveal from "./components/WinnerReveal";
import { SessionService } from "../../service/session.service.ts";
import "../../styles/hunt-arena.css";
import type {
  Session,
  Question,
  QuestionResponses,
  Participant,
  GameState,
  EliminationEvent,
  GameMode,
} from "../../lib/presentation.types";

// ── Fullscreen QR modal ──────────────────────────────────────────────────────
const QrFullscreenModal: React.FC<{ code: string; onClose: () => void }> = ({ code, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483000,
        backgroundColor: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(12px, 3vh, 28px)",
        padding: "clamp(12px, 4vmin, 32px)",
        cursor: "zoom-out",
        boxSizing: "border-box",
      }}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close"
        style={{
          position: "absolute",
          top: "clamp(12px, 2vmin, 24px)",
          right: "clamp(12px, 2vmin, 24px)",
          height: 40, width: 40,
          borderRadius: 9999,
          background: "rgba(255,255,255,0.15)",
          color: "white",
          fontSize: 18,
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <AppIcon name="X" size={20} />
      </button>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 16,
          padding: "clamp(10px, 2vmin, 20px)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          cursor: "default",
          flexShrink: 0,
          lineHeight: 0,
        }}
      >
        <QRCodeSVG
          value={`${window.location.origin}/audience-participation?code=${code}`}
          size={512}
          level="M"
          includeMargin={false}
          style={{
            display: "block",
            width: "min(55vh, 55vw, 480px)",
            height: "min(55vh, 55vw, 480px)",
          }}
        />
      </div>
      <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center", color: "white", flexShrink: 0 }}>
        <div style={{ fontSize: "clamp(10px, 1.4vmin, 13px)", textTransform: "uppercase", letterSpacing: "0.3em", opacity: 0.7, marginBottom: 6 }}>
          Scan to join
        </div>
        <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: "clamp(28px, 6vmin, 52px)", fontWeight: 900, letterSpacing: "0.2em" }}>
          {code}
        </div>
        <div style={{ marginTop: 8, fontSize: "clamp(10px, 1.2vmin, 12px)", opacity: 0.5 }}>
          Click anywhere or press Esc to close
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Leave Session Warning Modal ──────────────────────────────────────────────
const LeaveWarningModal: React.FC<{
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
  isLeaving: boolean;
}> = ({ isOpen, onStay, onLeave, isLeaving }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onStay} />
      <div className="relative bg-background rounded-2xl shadow-2xl border w-full max-w-md mx-4 overflow-hidden">
        <div className="h-1.5 w-full bg-amber-500" />
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AppIcon name="AlertTriangle" size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                You're still hosting a session
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Leaving this page will{" "}
                <span className="font-medium text-foreground">end the session</span> and
                disconnect all participants. This cannot be undone.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" onClick={onStay} disabled={isLeaving}>
              Stay in session
            </Button>
            <Button
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={onLeave}
              disabled={isLeaving}
            >
              {isLeaving ? "Ending session…" : "End session & leave"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HostSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // ── All useState hooks first ──────────────────────────────────────────────
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
  const [hideParticipantNames, setHideParticipantNames] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showMobileParticipants, setShowMobileParticipants] = useState<boolean>(false);
  const [showVoteWinner, setShowVoteWinner] = useState<boolean>(false);
  // ── Copy link button state ────────────────────────────────────────────────
  const [isCopySuccess, setIsCopySuccess] = useState<boolean>(false);
  // ── Start presentation loading state ──────────────────────────────────────
  const [isStarting, setIsStarting] = useState<boolean>(false);
  // ── End session loading state ─────────────────────────────────────────────
  const [isEnding, setIsEnding] = useState<boolean>(false);

  // ── Leave warning state ───────────────────────────────────────────────────
  const [showLeaveWarning, setShowLeaveWarning] = useState<boolean>(false);
  const [isLeaving, setIsLeaving] = useState<boolean>(false);

  // ── Elimination state ─────────────────────────────────────────────────────
  const [contextMeta, setContextMeta] = useState<{
    gameMode: GameMode;
    themeId: string;
  }>({ gameMode: "standard", themeId: "default" });

  const [gameState, setGameState] = useState<GameState>({
    alive: [],
    eliminated: [],
    winner: null,
    totalPlayers: 0,
    currentRound: 0,
    history: [],
  });

  const [showEliminationPanel, setShowEliminationPanel] = useState<boolean>(false);
  const [displayedGameState, setDisplayedGameState] = useState<GameState>(gameState);
  const roundStartEliminatedCountRef = useRef<number>(0);
  const [roundEliminationCount, setRoundEliminationCount] = useState<number | null>(null);
  const [overlayRoundNumber, setOverlayRoundNumber] = useState<number>(0);
  // Names for the current round's elimination overlay — set atomically when
  // the overlay is triggered so the list is never stale at render time.
  const [currentRoundEliminatedNames, setCurrentRoundEliminatedNames] = useState<string[]>([]);
  const [revealedWinner, setRevealedWinner] = useState<Participant | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const isGameOverRef = useRef<boolean>(false);
  const [isRevealingWinner, setIsRevealingWinner] = useState<boolean>(false);
  
  // ── Speed Question state ───────────────────────────────────────────────────
  const [isProcessingSpeedQuestion, setIsProcessingSpeedQuestion] = useState<boolean>(false);
  const [speedQuestionResults, setSpeedQuestionResults] = useState<{ advancingParticipantIds: string[]; eliminatedCount: number } | null>(null);
  // SpeedQuestionIntro overlay — shown when the host navigates to a speed question.
  // The overlay is now dismissed manually (host clicks "Show Question") rather
  // than auto-dismissing after a countdown.
  const [showSpeedIntro, setShowSpeedIntro] = useState<boolean>(false);

  // ── Final Round state ─────────────────────────────────────────────────────
  const [isFinalRoundDecision, setIsFinalRoundDecision] = useState<boolean>(false);
  const [continuingParticipants, setContinuingParticipants] = useState<Participant[]>([]);
  const [finalRoundStarted, setFinalRoundStarted] = useState<boolean>(false);
  const [pendingFinalRoundStart, setPendingFinalRoundStart] = useState<boolean>(false);
  const [finalRoundDecidedCount, setFinalRoundDecidedCount] = useState<number>(0);
  // Snapshot of alive.length when the decision phase begins so totalDeciding
  // remains stable even as withdrawals move players to the eliminated list.
  const [finalRoundDecidingTotal, setFinalRoundDecidingTotal] = useState<number>(0);
  
  // ── Debounced refresh timeout ref ─────────────────────────────────────────
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cache processed speed question results so that when the host navigates
  // back and clicks "Show Results" again, processSpeedQuestionEnd() can restore the
  // result display WITHOUT re-running the DB pipeline or re-broadcasting
  // SPEED_QUESTION_RESULTS (which would show the elimination overlay a second time
  // on already-eliminated participants' screens).
  // Map: question ID → result object (so we can restore speedQuestionResults state).
  const processedSpeedQuestionIdsRef = useRef<Map<string, { advancingParticipantIds: string[]; eliminatedCount: number }>>(new Map());

  // ── currentRoundRef — readable inside ws callbacks without stale closures ─
  const currentRoundRef = useRef<number>(0);
  // Keep currentRoundRef synced with gameState.currentRound so the GOODBYE
  // handler can stamp the correct round when eliminating on explicit leave.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { currentRoundRef.current = gameState.currentRound; }, [gameState.currentRound]);

  // currentQuestionIndexRef: stale-closure-safe mirror of currentQuestionIndex.
  // Used in ws callbacks so roundNumber always equals currentQuestionIndex+1,
  // matching processUntimedQuestionEliminations exactly.
  const currentQuestionIndexRef = useRef<number>(-1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex; }, [currentQuestionIndex]);

  // pendingEliminatedRef: names of explicit-leave participants for the current
  // question. Populated synchronously in GOODBYE so the 1200 ms timer-end check
  // can show the overlay immediately for timed questions (before processUntimed
  // is invoked by the host).
  const pendingEliminatedRef = useRef<{ name: string; roundNumber: number }[]>([]);

  // leftDuringQuestionRef: participants who explicitly left during the CURRENT
  // question. processUntimedQuestionEliminations picks these up and eliminates
  // them in the same DB batch as wrong-answer participants so they appear in the
  // same round's overlay. Cleared at question start.
  const leftDuringQuestionRef = useRef<{ id: string; name: string }[]>([]);

  // ── Derived values ────────────────────────────────────────────────────────
  const isElimination = contextMeta.gameMode === "elimination";
  const themeId = contextMeta.themeId;
  const survivorsCount = isElimination ? gameState.alive.length : 0;
  const eliminatedCount = isElimination ? gameState.eliminated.length : 0;

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

  const currentQuestion: Question | undefined =
    currentQuestionIndex >= 0
      ? session?.presentation?.questions?.[currentQuestionIndex]
      : undefined;

  const currentResponses: QuestionResponses = currentQuestion
    ? responses[currentQuestion.id] || {}
    : {};

  const isCurrentMultipleChoice = currentQuestion?.type === "multiple-choice";
  const isSpeedQuestion = currentQuestion?.isSpeedQuestion === true;
  const speedMaxAdvance = currentQuestion?.speedMaxAdvance ?? 3;

  //  isLastQuestion is kept for display purposes only (ControlPanel prop).
  // The final-round decision trigger now uses isNextLastQuestion inside handleNext.
  const isLastQuestion = currentQuestionIndex === (session?.presentation.questions.length ?? 0) - 1;

  const getQuestionTimeLimit = (question?: Question | null): number | null => {
    if (!question || question.timeLimit == null || question.timeLimit <= 0)
      return null;
    return question.timeLimit;
  };

  // ── All useRef hooks ──────────────────────────────────────────────────────
  const timerRef = useRef<number>(0);
  const timerActiveRef = useRef<boolean>(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const isPausedRef = useRef<boolean>(false);
  const sessionRef = useRef<Session | null>(null);
  const currentQuestionRef = useRef<Question | undefined>(undefined);
  const hasLoadedRef = useRef<boolean>(false);
  const hideParticipantNamesRef = useRef<boolean>(false);
  const gameStateRef = useRef<GameState>(gameState);
  const isEliminationRef = useRef<boolean>(false);
  const sendMessageRef = useRef<(msg: any) => void>(() => {});
  const currentQuestionTimeLimitRef = useRef<number | null | undefined>(null);
  const questionEndsAtRef = useRef<number | null>(null);

  const applyQuestionTimer = (question?: Question | null, overrideEndsAtMs?: number) => {
    const limit = getQuestionTimeLimit(question);

    if (limit !== null) {
      const endsAtMs = overrideEndsAtMs ?? Date.now() + limit * 1000;
      questionEndsAtRef.current = endsAtMs;
      const remaining = Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000));
      setTimer(remaining);
      timerRef.current = remaining;
    } else {
      questionEndsAtRef.current = null;
      setTimer(0);
      timerRef.current = 0;
    }

    setTimerActive(limit !== null);
    timerActiveRef.current = limit !== null;
    return limit;
  };

  // ── Debounced refresh function ────────────────────────────────────────────
  const debouncedRefreshResponses = useCallback(async () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(async () => {
      const q = currentQuestionRef.current;
      const sess = sessionRef.current;
      if (q && sess) {
        const updated = await SessionService.getQuestionResponses(
          sess.id,
          q.id,
          hideParticipantNamesRef.current,
        );
        setResponses((prev) => ({ ...prev, [q.id]: updated }));
      }
      refreshTimeoutRef.current = null;
    }, 500);
  }, []);

  const processSpeedQuestionEnd = useCallback(async () => {
    if (!session || !currentQuestion || isProcessingSpeedQuestion || showResults) return;

    // If this speed question was already processed (e.g. host navigated
    // back with handlePrevious which resets showResults to false, then clicked
    // "Show Results" again), restore the results display without re-running the
    // DB pipeline or re-broadcasting SPEED_QUESTION_RESULTS. Re-broadcasting
    // causes already-eliminated participants to see the overlay a second time.
    // Also restores speedQuestionResults so the advancing count card still shows
    // (the per-question-index useEffect clears it on navigation, so we re-apply it).
    if (processedSpeedQuestionIdsRef.current.has(currentQuestion.id)) {
      console.log("[HOST] Speed question already processed — restoring results display only.");
      const cached = processedSpeedQuestionIdsRef.current.get(currentQuestion.id)!;
      setSpeedQuestionResults(cached);
      setShowResults(true);
      return;
    }
    
    console.log("[HOST] Processing speed question end...");
    setIsProcessingSpeedQuestion(true);
    
    try {
      const roundNumber = currentQuestionIndex + 1;
      const result = await SessionService.processSpeedQuestion(
        session.id,
        currentQuestion.id,
        roundNumber,
        speedMaxAdvance
      );
      
      console.log("[HOST] Speed question results:", result);
      setSpeedQuestionResults(result);
      
      // Broadcast results to all participants
      sendMessageRef.current({
        type: SESSION_EVENTS.SPEED_QUESTION_RESULTS,
        payload: {
          advancingParticipantIds: result.advancingParticipantIds,
          eliminatedCount: result.eliminatedCount,
          maxAdvance: speedMaxAdvance,
        },
      });
      
      // Refresh game state and broadcast it to spectators / all participants.
      // Without this broadcast, eliminated spectators never receive the updated
      // alive/eliminated counts after a speed round because SPEED_QUESTION_RESULTS
      // only carries advancingParticipantIds, not the full game state.
      const newState = await SessionService.getGameState(session.id);
      setGameState(newState);
      sendMessageRef.current({
        type: SESSION_EVENTS.GAME_STATE_UPDATE,
        payload: newState as unknown as Record<string, unknown>,
      });

      // Mark this question ID as processed and cache the result so re-navigation
      // can restore the advancing count card without re-broadcasting.
      processedSpeedQuestionIdsRef.current.set(currentQuestion.id, result);
      
      // Show results
      setShowResults(true);
      
      toast({
        title: "Speed Question Complete",
        description: `${result.eliminatedCount} participant(s) eliminated. ${result.advancingParticipantIds.length} advance.`,
      });
    } catch (error) {
      console.error("Failed to process speed question:", error);
      toast({ title: "Error", description: "Failed to process speed question", variant: "destructive" });
    } finally {
      setIsProcessingSpeedQuestion(false);
    }
  }, [session, currentQuestion, currentQuestionIndex, speedMaxAdvance, isProcessingSpeedQuestion, showResults, toast]);

  // Process untimed question eliminations (for non-speed elimination questions) ──
  const processUntimedQuestionEliminations = useCallback(async () => {
    if (!session || !currentQuestion || isProcessingSpeedQuestion || showResults) return;
    
    console.log("[HOST] Processing untimed question eliminations...");
    setIsProcessingSpeedQuestion(true);
    
    try {
      const roundNumber = currentQuestionIndex + 1;
      
      // Get all participants who submitted an answer to this question
      const { data: responsesData, error: responsesError } = await supabase
        .from("responses")
        .select("participant_id, is_correct, answer")
        .eq("session_id", session.id)
        .eq("question_id", currentQuestion.id);
      
      if (responsesError) {
        console.error("[HOST] Failed to get responses:", responsesError);
        return;
      }
      
      // Filter participants who answered incorrectly
      const wrongAnswerIds = (responsesData || [])
        .filter(r => r.is_correct === false)
        .map(r => r.participant_id);
      
      // Also get all alive participants to find those who didn't answer at all
      const { data: allParticipants, error: participantsError } = await supabase
        .from("participants")
        .select("id, name")
        .eq("session_id", session.id)
        .eq("is_alive", true);
      
      if (participantsError) {
        console.error("[HOST] Failed to get participants:", participantsError);
        return;
      }
      
      const answeredIds = (responsesData || []).map(r => r.participant_id);
      const noAnswerIds = (allParticipants || [])
        .filter(p => !answeredIds.includes(p.id))
        .map(p => p.id);
      
      // Combine wrong answers and no-answers for elimination
      const idsToEliminate = [...new Set([...wrongAnswerIds, ...noAnswerIds])];

      // Snapshot explicit leavers BEFORE any await so we don't lose entries
      // that arrive concurrently. We clear the ref now; any new leaves after
      // this point will be caught by the next question's processUntimed.
      const leftEntries = leftDuringQuestionRef.current;
      leftDuringQuestionRef.current = [];

      // Explicit leavers not already in idsToEliminate (alive participants who
      // happened to also leave in the same window).
      const leftEntriesNew = leftEntries.filter(
        (e) => !idsToEliminate.includes(e.id),
      );

      console.log(
        "[HOST] Eliminating participants:",
        idsToEliminate.length,
        "+ explicit leavers:",
        leftEntriesNew.length,
      );

      // ── Eliminate alive participants (wrong / no answer) ─────────────────
      for (const participantId of idsToEliminate) {
        const participant = allParticipants?.find(p => p.id === participantId);
        if (participant) {
          await SessionService.eliminateParticipant({
            sessionId: session.id,
            participantId: participant.id,
            questionId: currentQuestion.id,
            roundNumber,
          });
          sendMessageRef.current({
            type: SESSION_EVENTS.PLAYER_ELIMINATED,
            payload: {
              participantId: participant.id,
              participantName: participant.name,
              questionId: currentQuestion.id,
              roundNumber,
              eliminatedAt: new Date().toISOString(),
            },
          });
        }
      }

      // ── Eliminate explicit leavers in the same batch ──────────────────────
      // eliminateParticipant is idempotent: if the GOODBYE safety-net call
      // already wrote to the DB it returns null without creating a duplicate
      // elimination_log row. Either way getGameState() below will see them.
      for (const { id: pid, name: pname } of leftEntriesNew) {
        await SessionService.eliminateParticipant({
          sessionId: session.id,
          participantId: pid,
          questionId: currentQuestion.id,
          roundNumber,
        });
        sendMessageRef.current({
          type: SESSION_EVENTS.PLAYER_ELIMINATED,
          payload: {
            participantId: pid,
            participantName: pname,
            questionId: currentQuestion.id,
            roundNumber,
            eliminatedAt: new Date().toISOString(),
          },
        });
        console.log(`[HOST] Eliminated (explicit leave): ${pname} (round ${roundNumber})`);
      }

      // Refresh game state — runs AFTER all eliminations (alive + leavers) so
      // newState.history contains everyone eliminated this round.
      const newState = await SessionService.getGameState(session.id);
      setGameState(newState);
      setDisplayedGameState(newState);
      sendMessageRef.current({
        type: SESSION_EVENTS.GAME_STATE_UPDATE,
        payload: newState as unknown as Record<string, unknown>,
      });

      // Show results
      setShowResults(true);

      // Build overlay name list from history (all eliminations this round) +
      // any pending explicit-leave names not yet reflected in newState.history.
      const dbNamesUntimed = newState.history
        .filter((h) => h.roundNumber === roundNumber)
        .map((h) => h.participantName);
      const pendingNamesUntimed = pendingEliminatedRef.current
        .filter(
          (e) => e.roundNumber === roundNumber && !dbNamesUntimed.includes(e.name),
        )
        .map((e) => e.name);
      const allEliminatedNames = [...dbNamesUntimed, ...pendingNamesUntimed];
      const totalEliminated = idsToEliminate.length + leftEntriesNew.length;
      if (allEliminatedNames.length > 0 || totalEliminated > 0) {
        setCurrentRoundEliminatedNames(allEliminatedNames);
        setRoundEliminationCount(Math.max(allEliminatedNames.length, totalEliminated));
        setOverlayRoundNumber(roundNumber);
      }

      toast({
        title: "Results Ready",
        description: `${totalEliminated} participant(s) eliminated.`,
      });
    } catch (error) {
      console.error("Failed to process untimed question eliminations:", error);
      toast({ title: "Error", description: "Failed to process results", variant: "destructive" });
    } finally {
      setIsProcessingSpeedQuestion(false);
    }
  }, [session, currentQuestion, currentQuestionIndex, isProcessingSpeedQuestion, showResults, toast]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // (Final round decision countdown removed — transition is now manual via
  //  the "Start Final Round" button in FinalRoundWaitingOverlay.)

  // ── Keep refs in sync ─────────────────────────────────────────────────────
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);
  useEffect(() => { currentQuestionTimeLimitRef.current = currentQuestion?.timeLimit; }, [currentQuestion]);
  useEffect(() => { timerRef.current = timer; }, [timer]);
  useEffect(() => { timerActiveRef.current = timerActive; }, [timerActive]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { hideParticipantNamesRef.current = hideParticipantNames; }, [hideParticipantNames]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { isEliminationRef.current = isElimination; }, [isElimination]);

  // ── Fullscreen change listener ─────────────────────────────────────────────
  useEffect(() => {
    const onFsChange = () => { setIsFullscreen(!!document.fullscreenElement); };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ── Real-time message handler ─────────────────────────────────────────────
  const handleWsMessage = useCallback(
    (msg: { type: string; payload?: Record<string, unknown> }) => {
      if (msg.type === SESSION_EVENTS.RESPONSE_SUBMITTED) {
        const q = currentQuestionRef.current;
        const sess = sessionRef.current;
        if (q && sess) {
          debouncedRefreshResponses();
        }
        return;
      }

      if (msg.type === SESSION_EVENTS.PLAYER_ELIMINATED) {
        const sess = sessionRef.current;
        if (sess) {
          SessionService.getGameState(sess.id).then((newState) => {
            setGameState(newState);
          });
        }
        return;
      }

      if (msg.type === SESSION_EVENTS.GAME_STATE_UPDATE) {
        setGameState(msg.payload as unknown as GameState);
        return;
      }

      if (msg.type === SESSION_EVENTS.GAME_END) {
        const sess = sessionRef.current;
        if (sess) SessionService.getGameState(sess.id).then(setGameState);
        return;
      }

      if (msg.type === SESSION_EVENTS.REQUEST_GAME_STATE) {
        if (isEliminationRef.current) {
          const sess = sessionRef.current;
          if (sess) {
            // bug avant: stale broadcast overwrites participant game state with 0/0.
            // Previously the host replied with gameStateRef.current, which can be
            // empty/stale when a participant first connects (the host's ref hasn't
            // been refreshed to include the new joiner yet). Every client on the
            // channel receives this GAME_STATE_UPDATE broadcast and overwrites their
            // correctly-fetched local state with totalPlayers: 0.
            //
            // donc : always do a fresh DB fetch before broadcasting so the response
            // reflects the true current state. The host's own view is also updated.
            SessionService.getGameState(sess.id).then((freshState) => {
              setGameState(freshState);
              sendMessageRef.current?.({
                type: SESSION_EVENTS.GAME_STATE_UPDATE,
                payload: freshState as unknown as Record<string, unknown>,
              });
            });
          }
        }
        return;
      }
      
      // Final round decision response
      if (msg.type === SESSION_EVENTS.FINAL_ROUND_DECISION_RESPONSE) {
        refreshFinalRoundParticipants();
        setFinalRoundDecidedCount((prev) => prev + 1);
        return;
      }

      // ── GOODBYE: participant closed their tab or explicitly left ─────────────
      // Remove the participant from the local participants list immediately so the
      // host count decreases without waiting for a Supabase connection timeout
      // (which can take 30–90 s).
      // isExplicitLeave=true means the user clicked "Leave Session" — in
      // elimination mode this also marks them eliminated in the DB and broadcasts
      // PLAYER_ELIMINATED so all participants receive the update.
      if (msg.type === SESSION_EVENTS.GOODBYE) {
        const { participantId, participantName, isExplicitLeave } = msg.payload as {
          participantId: string;
          participantName: string;
          isExplicitLeave?: boolean;
        };
        setParticipants((prev) => prev.filter((p) => p.id !== participantId));
        console.log(`[HOST] Participant disconnected: ${participantName} (${participantId}), explicit=${isExplicitLeave ?? false}`);

        if (isExplicitLeave && isElimination) {
          const round = currentQuestionIndexRef.current + 1;

          // 1. Register in leftDuringQuestionRef so processUntimedQuestionEliminations
          //    includes this participant in the SAME elimination batch as wrong-answer
          //    participants. This guarantees the same roundNumber, questionId, and
          //    getGameState() snapshot — so they appear in the overlay alongside others.
          leftDuringQuestionRef.current = [
            ...leftDuringQuestionRef.current,
            { id: participantId, name: participantName },
          ];

          // 2. Register in pendingEliminatedRef so the 1200 ms timer-end check can
          //    show the overlay immediately for timed questions (before processUntimed
          //    is invoked by the host).
          pendingEliminatedRef.current = [
            ...pendingEliminatedRef.current,
            { name: participantName, roundNumber: round },
          ];

          // 3. Safety-net DB write: eliminates the participant even if the host
          //    advances to the next question without clicking Eliminate. The call is
          //    idempotent — processUntimedQuestionEliminations calling it again is safe.
          const sess = sessionRef.current;
          if (sess) {
            const questionId = currentQuestionRef.current?.id ?? "";
            SessionService.eliminateParticipant({
              sessionId: sess.id,
              participantId,
              questionId,
              roundNumber: round,
            })
              .then(() => {
                SessionService.getGameState(sess.id).then(setGameState);
                sendMessageRef.current({
                  type: SESSION_EVENTS.PLAYER_ELIMINATED,
                  payload: {
                    participantId,
                    participantName,
                    roundNumber: round,
                    eliminatedAt: new Date().toISOString(),
                  },
                });
                console.log(`[HOST] Safety-net eliminated: ${participantName} (round ${round})`);
              })
              .catch((err: unknown) => {
                console.error(`[HOST] Safety-net eliminate failed for ${participantName}:`, err);
              });
          }
        }
        return;
      }

      // ── SESSION_RESTORE: participant returned and reconnected ───────────────
      // Re-add the participant to the local participants list so the host count
      // goes back up. Fetches the participant row from the DB to ensure the
      // displayed data (name, score, alive status) is current. If the participant
      // is already in the list (e.g. the DB subscription INSERT beat us here),
      // the duplicate check inside setParticipants() prevents double-counting.
      if (msg.type === SESSION_EVENTS.SESSION_RESTORE) {
        const { participantId, participantName } = msg.payload as {
          participantId: string;
          participantName: string;
        };
        const sess = sessionRef.current;
        if (sess) {
          supabase
            .from("participants")
            .select(
              "id, name, score, avatar_url, is_anonymous, joined_at, is_alive, eliminated_at_round, eliminated_at_question_id, skips_used, chose_continue",
            )
            .eq("id", participantId)
            .maybeSingle()
            .then(({ data: p }) => {
              if (!p) return;
              setParticipants((prev) => {
                // Idempotency guard — skip if the participant is already present.
                if (prev.find((x) => x.id === p.id)) return prev;
                return [
                  ...prev,
                  {
                    id: p.id,
                    name: p.name,
                    score: p.score ?? 0,
                    avatar: p.avatar_url,
                    isAnonymous: p.is_anonymous,
                    joinedAt: new Date(p.joined_at),
                    isAlive: p.is_alive ?? true,
                    eliminatedAtRound: p.eliminated_at_round ?? null,
                    eliminatedAtQuestionId: p.eliminated_at_question_id ?? null,
                    skipsUsed: p.skips_used ?? 0,
                    choseContinue: p.chose_continue ?? null,
                  },
                ];
              });
              console.log(`[HOST] Participant restored: ${participantName} (${participantId})`);
            });
        }
        return;
      }

      // ── HEARTBEAT: participant is still connected ───────────────────────────
      // Presence-only signal — no action needed on the host side in the current
      // implementation. Log at debug level for diagnostics.
      // NOTE: To implement heartbeat-based timeout elimination, track the last
      // heartbeat timestamp per participant here and start a 90 s clearTimeout
      // that eliminates the participant if no further HEARTBEAT arrives:
      //   heartbeatMap.set(participantId, Date.now());
      //   clearTimeout(heartbeatTimeouts.get(participantId));
      //   heartbeatTimeouts.set(participantId, setTimeout(() => eliminateParticipant(participantId), 90_000));
      if (msg.type === SESSION_EVENTS.HEARTBEAT) {
        return;
      }
    },
    [debouncedRefreshResponses],
  );

  const { sendMessage, connected: wsConnected } = useSessionSocket({
    sessionId: session?.id ?? null,
    role: "host",
    onMessage: handleWsMessage,
    enabled: !!session,
  });

  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  // ── Refresh final round participants ──────────────────────────────────────
  const refreshFinalRoundParticipants = useCallback(async () => {
    if (!session) return;
    const continuing = await SessionService.getContinuingParticipants(session.id);
    setContinuingParticipants(continuing);
    console.log("[HOST] Continuing participants:", continuing.length);
    
    // If no one continues, end session
    if (continuing.length === 0 && !finalRoundStarted) {
      sendMessage({ type: SESSION_EVENTS.GAME_OVER, payload: {} });
      setIsGameOver(true);
      isGameOverRef.current = true;
      setIsFinalRoundDecision(false);
    }
  }, [session, finalRoundStarted, sendMessage]);

  // ── Start final round decision ────────────────────────────────────────────
  //  This is now triggered BEFORE navigating to the last question (from handleNext),
  // so participants see the decision screen before the final question appears.
  // The timer has been removed — the host manually starts the final round via
  // handleManualFinalRoundStart (the "Start Final Round" button in the overlay).
  const startFinalRoundDecision = useCallback(async () => {
    if (!session) return;
    
    console.log("[HOST] Starting final round decision for", gameState.alive.length, "alive participants");
    setIsFinalRoundDecision(true);
    setFinalRoundDecidedCount(0);
    setFinalRoundDecidingTotal(gameState.alive.length);
    
    // Show decision screen to ALL ALIVE participants (no timer payload needed).
    sendMessage({
      type: SESSION_EVENTS.FINAL_ROUND_DECISION,
      payload: {},
    });
  }, [session, sendMessage, gameState.alive.length]);


  // ── Advance to final question ─────────────────────────────────────────────
  const advanceToFinalQuestion = useCallback(async () => {
    if (!session) return;
    if (!pendingFinalRoundStart && finalRoundStarted) return;
    
    setPendingFinalRoundStart(false);
    setFinalRoundStarted(true);
    
    const lastIndex = session.presentation.questions.length - 1;
    const lastQuestion = session.presentation.questions[lastIndex];
    
    if (!lastQuestion) {
      console.error("[HOST] No final question found");
      return;
    }
    
    const timeLimit = getQuestionTimeLimit(lastQuestion);
    const { startedAt, endsAt } = await SessionService.setCurrentQuestion(
      session.id,
      lastIndex,
      lastQuestion.id,
      timeLimit,
    );
    
    setCurrentQuestionIndex(lastIndex);
    applyQuestionTimer(lastQuestion, endsAt ?? undefined);
    applyQuestionSettings(lastQuestion);
    setIsPaused(false);
    isPausedRef.current = false;
    
    sendMessage({
      type: SESSION_EVENTS.FINAL_ROUND_START,
      payload: {
        questionId: lastQuestion.id,
        timeLimit,
        startedAt,
        endsAt,
      },
    });
    
    setShowResults(false);
    toast({ title: "Final Round", description: "The final question has started!" });
  }, [session, finalRoundStarted, pendingFinalRoundStart, sendMessage, toast, getQuestionTimeLimit, applyQuestionTimer]);

  // ── Manual final round start (host button in FinalRoundWaitingOverlay) ────
  // Replaces the old setTimeout auto-advance.  Called when the host clicks
  // "Start Final Round".  Fetches who decided to continue, then either ends
  // the game (if nobody continues) or advances to the final question.
  // Participants who did NOT respond (did not choose "OUI" or "NON")
  // are eliminated immediately when the host clicks the button. Their
  // elimination is recorded in the DB but NO elimination overlay is shown
  // on the host screen — we advance directly to the final question.
  const handleManualFinalRoundStart = useCallback(async () => {
    if (!session) return;

    console.log("[HOST] Manual final round start triggered");
    
    // STEP 1: Get all alive participants
    const aliveParticipants = gameState.alive;
    const roundNumber = session.presentation.questions.length; // Final question number
    
    // STEP 2: Identify who decided to continue (from DB)
    const continuing = await SessionService.getContinuingParticipants(session.id);
    const continuingIds = new Set(continuing.map(p => p.id));
    
    // STEP 3: Participants who are alive but did NOT decide to continue = withdraw/eliminate
    const nonRespondingParticipants = aliveParticipants.filter(p => !continuingIds.has(p.id));
    
    // STEP 4: Eliminate non-responding participants (NO overlay, just DB + broadcast)
    for (const p of nonRespondingParticipants) {
      console.log(`[HOST] Eliminating non-responding participant: ${p.name} (round ${roundNumber})`);
      
      await SessionService.eliminateParticipant({
        sessionId: session.id,
        participantId: p.id,
        questionId: "", // No specific question for final round withdrawal
        roundNumber,
      });
      
      // Broadcast elimination so participants see the update
      sendMessage({
        type: SESSION_EVENTS.PLAYER_ELIMINATED,
        payload: {
          participantId: p.id,
          participantName: p.name,
          questionId: "",
          roundNumber,
          eliminatedAt: new Date().toISOString(),
        },
      });
    }
    
    // STEP 5: Refresh game state after eliminations
    if (nonRespondingParticipants.length > 0) {
      const newState = await SessionService.getGameState(session.id);
      setGameState(newState);
      sendMessage({
        type: SESSION_EVENTS.GAME_STATE_UPDATE,
        payload: newState as unknown as Record<string, unknown>,
      });
    }
    
    // STEP 6: Close the decision overlay
    setIsFinalRoundDecision(false);
    
    // STEP 7: Get updated list of continuing participants (after eliminations)
    const updatedContinuing = await SessionService.getContinuingParticipants(session.id);
    console.log("[HOST] Continuing participants after processing non-responders:", updatedContinuing.length);
    setContinuingParticipants(updatedContinuing);

    // STEP 8: Either end game or advance to final question
    if (updatedContinuing.length === 0) {
      // No one chose to continue — game over.
      sendMessage({ type: SESSION_EVENTS.GAME_OVER, payload: {} });
      setIsGameOver(true);
      isGameOverRef.current = true;
    } else {
      setPendingFinalRoundStart(true);
      await advanceToFinalQuestion();
    }
  }, [session, gameState.alive, sendMessage, advanceToFinalQuestion]);

  // ── All players eliminated ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isElimination || isGameOverRef.current || revealedWinner) return;
    if (!showResults) return;
    if (gameState.alive.length === 0 && gameState.totalPlayers > 0) {
      isGameOverRef.current = true;
      setIsGameOver(true);
      sendMessage({ type: "GAME_OVER", payload: {} });
    }
  }, [isElimination, revealedWinner, showResults, gameState.alive.length, gameState.totalPlayers, sendMessage]);

  // ── OPTIMIZED: Wall-clock-anchored timer interval ─────────────────────────
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = undefined;
    }

    if (
      currentQuestionIndex >= 0 &&
      timerActiveRef.current &&
      questionEndsAtRef.current !== null &&
      !isFinalRoundDecision
    ) {
      timerIntervalRef.current = window.setInterval(() => {
        if (
          isPausedRef.current ||
          !timerActiveRef.current ||
          questionEndsAtRef.current === null
        ) {
          return;
        }

        const remaining = Math.max(
          0,
          Math.ceil((questionEndsAtRef.current - Date.now()) / 1000),
        );
        timerRef.current = remaining;
        setTimer(remaining);

        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = undefined;
          timerActiveRef.current = false;
          setTimerActive(false);

          if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
          debouncedRefreshResponses();

          // Handle speed question when timer ends
          if (isSpeedQuestion && !isProcessingSpeedQuestion && !showResults) {
            console.log("[HOST] Speed question timer ended, processing...");
            processSpeedQuestionEnd();
          } else if (isEliminationRef.current && !isSpeedQuestion && !isProcessingSpeedQuestion && !showResults) {
            // BUG FIX: For timed elimination questions, run the full elimination
            // pipeline (same as host clicking "Show Results" for untimed questions).
            // Previously only setShowResults(true) was called here, which meant:
            //   • Wrong-answer participants were never eliminated in the DB.
            //   • No-answer / tab-close participants were never eliminated in the DB.
            //   • The overlay was built only from pendingEliminatedRef (explicit
            //     leavers who clicked "Leave") and DB history, missing everyone else.
            // processUntimedQuestionEliminations() handles all three categories —
            // wrong answers, no answers (including tab-close leavers whose is_alive
            // is still true in DB), and explicit leavers via leftDuringQuestionRef —
            // then fetches fresh game state and sets the overlay atomically.
            console.log("[HOST] Timed elimination question timer ended, processing eliminations...");
            processUntimedQuestionEliminations();
          } else {
            setShowResults(true);
            toast({ title: "Time's Up!", description: "Showing results..." });
          }
          // NOTE: The separate 1200 ms overlay block that previously existed here
          // for isEliminationRef.current && !isSpeedQuestion has been removed.
          // processUntimedQuestionEliminations() already builds and sets the
          // RoundEliminationsOverlay after fetching fresh game state from the DB.
          // The old block only caught explicit leavers (pendingEliminatedRef) and
          // missed wrong-answer / no-answer / tab-close participants entirely.
        }
      }, 500);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = undefined;
      }
    };
  }, [currentQuestionIndex, timerActive, toast, debouncedRefreshResponses, isSpeedQuestion, isProcessingSpeedQuestion, showResults, processSpeedQuestionEnd, processUntimedQuestionEliminations, isFinalRoundDecision]);

  useEffect(
    () => () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    },
    [],
  );

  // ── Update hideParticipantNames when question changes ─────────────────────
  useEffect(() => {
    if (currentQuestion) {
      setHideParticipantNames(currentQuestion.hideParticipantNames ?? false);
    }
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (currentQuestionIndex < 0) return;
    roundStartEliminatedCountRef.current = gameStateRef.current.eliminated.length;
    setDisplayedGameState(gameStateRef.current);
    setRoundEliminationCount(null);
    setSpeedQuestionResults(null);
    // Clear per-round refs so previous-question leavers never bleed into the
    // next question's overlay count or name list.
    pendingEliminatedRef.current = [];
    leftDuringQuestionRef.current = [];
    setCurrentRoundEliminatedNames([]);
  }, [currentQuestionIndex]);

  // ── Reload responses when hideParticipantNames or showResults changes ─────
  useEffect(() => {
    if (currentQuestion && session) {
      SessionService.getQuestionResponses(
        session.id,
        currentQuestion.id,
        hideParticipantNames,
      ).then((updated) => {
        setResponses((prev) => ({ ...prev, [currentQuestion.id]: updated }));
      });
    }
  }, [hideParticipantNames, currentQuestion?.id, session?.id, showResults]);

  // ── Load session ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !user || hasLoadedRef.current) return;

    const loadSession = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: existingSession, error: sessionFetchError } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!sessionFetchError && existingSession) {
          const { data: contextData } = await supabase
            .from("contexts")
            .select(
              `
              id, title, game_mode, theme,
              questions (
                id, title, description, type, points, time_limit,
                options, scale, labels, display_style, image_url, question_order,
                show_results_instantly, hide_participant_names,
                statements, skip_allowed, is_speed_question, speed_max_advance,
                x_axis, y_axis 
              )
            `,
            )
            .eq("id", existingSession.context_id)
            .maybeSingle();

          const ctxGameMode: GameMode =
            (contextData as any)?.game_mode === "elimination"
              ? "elimination"
              : "standard";
          const ctxThemeId: string =
            (contextData as any)?.theme || "default";
          setContextMeta({ gameMode: ctxGameMode, themeId: ctxThemeId });
          
          // (final_round_decision_timer no longer used — transition is manual.)

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
              statements: q.statements,
              scale: q.scale,
              labels: q.labels,
              points: q.points,
              image: q.image_url,
              displayStyle: q.display_style,
              showResultsInstantly: q.show_results_instantly ?? false,
              hideParticipantNames: q.hide_participant_names ?? false,
              skipAllowed: q.skip_allowed ?? false,
              isSpeedQuestion: q.is_speed_question ?? false,
              speedMaxAdvance: q.speed_max_advance ?? null,
              xAxis: q.x_axis,       
              yAxis: q.y_axis,
            }));

          const sessionData: Session = {
            id: existingSession.id,
            code: existingSession.code,
            participantCount: existingSession.participant_count,
            startTime: new Date(existingSession.created_at),
            presentation: {
              id: existingSession.context_id,
              title: contextData?.title || "Untitled Session",
              questions,
              gameMode: ctxGameMode,
              themeId: ctxThemeId,
            },
            status: existingSession.status as
              | "WAITING"
              | "ACTIVE"
              | "PAUSED"
              | "ENDED",
            currentQuestionIndex: existingSession.current_question_index,
            gameMode: ctxGameMode,
          };

          setSession(sessionData);
          setCurrentQuestionIndex(existingSession.current_question_index);
          setIsPaused(existingSession.is_paused || false);
          isPausedRef.current = existingSession.is_paused || false;

          if (
            existingSession.current_question_index >= 0 &&
            existingSession.status === "ACTIVE"
          ) {
            const currentQ = questions[existingSession.current_question_index];
            if (currentQ) {
              if (currentQ.showResultsInstantly) setShowResults(true);

              const limit = getQuestionTimeLimit(currentQ);
              if (limit !== null) {
                let endsAtMs: number | null = null;

                if (existingSession.current_question_ends_at) {
                  endsAtMs = new Date(existingSession.current_question_ends_at).getTime();
                } else if (
                  existingSession.is_paused &&
                  existingSession.timer_paused_remaining != null
                ) {
                  const remaining = existingSession.timer_paused_remaining;
                  setTimer(remaining);
                  timerRef.current = remaining;
                  setTimerActive(false);
                  timerActiveRef.current = false;
                  endsAtMs = null;
                } else if (
                  !existingSession.is_paused &&
                  existingSession.timer_resumed_at != null &&
                  existingSession.timer_paused_remaining != null
                ) {
                  const elapsedSinceResume = Math.floor(
                    (Date.now() - new Date(existingSession.timer_resumed_at).getTime()) / 1000,
                  );
                  const remaining = Math.max(0, existingSession.timer_paused_remaining - elapsedSinceResume);
                  endsAtMs = Date.now() + remaining * 1000;
                } else if (existingSession.current_question_started_at) {
                  endsAtMs =
                    new Date(existingSession.current_question_started_at).getTime() +
                    limit * 1000;
                } else {
                  endsAtMs = Date.now() + limit * 1000;
                }

                if (endsAtMs !== null) {
                  questionEndsAtRef.current = endsAtMs;
                  const remaining = Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000));
                  setTimer(remaining);
                  timerRef.current = remaining;
                  const shouldBeActive = !existingSession.is_paused && remaining > 0;
                  setTimerActive(shouldBeActive);
                  timerActiveRef.current = shouldBeActive;
                }
              }
            }
          }

          const participantsData = await SessionService.getParticipants(existingSession.id);
          setParticipants(participantsData);

          if (existingSession.current_question_index >= 0) {
            const currentQ = questions[existingSession.current_question_index];
            if (currentQ) {
              const responsesData = await SessionService.getQuestionResponses(
                existingSession.id,
                currentQ.id,
                currentQ.hideParticipantNames ?? false,
              );
              setResponses((prev) => ({ ...prev, [currentQ.id]: responsesData }));
            }
          }

          hasLoadedRef.current = true;
        } else {
          const { data: contextData, error: contextError } = await supabase
            .from("contexts")
            .select("id, title")
            .eq("id", id)
            .maybeSingle();

          if (contextError || !contextData) {
            throw new Error(`Context "${id}" not found.`);
          }

          const newSession = await SessionService.createSession({
            contextId: id,
            hostId: user.id,
          });
          if (!newSession) throw new Error("Failed to create session");

          hasLoadedRef.current = true;
          navigate(`/session/${newSession.id}/host`, { replace: true });
          return;
        }
      } catch (err: any) {
        console.error("Failed to load session:", err);
        setError(err.message || "Failed to load session");
        toast({
          title: "Error",
          description: err.message || "Failed to load session",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [id, user, navigate, toast]);

  // ── Hydrate elimination game state ─────────────────────────────────────────
  useEffect(() => {
    if (!session?.id || !isElimination) return;
    SessionService.getGameState(session.id).then(setGameState);
  }, [session?.id, isElimination]);

  // ── Real-time game state updates via Supabase subscription ────────────────
  useEffect(() => {
    if (!session?.id || !isElimination) return;

    const gameStateChannel = supabase
      .channel(`game-state-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          SessionService.getGameState(session.id).then(setGameState);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "elimination_log",
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          SessionService.getGameState(session.id).then(setGameState);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameStateChannel);
    };
  }, [session?.id, isElimination]);

  // ── Fallback polling (30s, safety net) ────────────────────────────────────
  useEffect(() => {
    if (!session?.id || !isElimination) return;

    const interval = setInterval(async () => {
      const newState = await SessionService.getGameState(session.id);
      setGameState(newState);
    }, 30000);

    return () => clearInterval(interval);
  }, [session?.id, isElimination]);

  // ── Supabase subscriptions: participants + responses ───────────────────────
  useEffect(() => {
    if (!session) return;

    const participantsChannel = supabase
      .channel(`host-participants-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${session.id}`,
        },
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
                isAlive: p.is_alive ?? true,
                eliminatedAtRound: p.eliminated_at_round ?? null,
                eliminatedAtQuestionId: p.eliminated_at_question_id ?? null,
                skipsUsed: p.skips_used ?? 0,
                choseContinue: p.chose_continue ?? null,
              },
            ];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const p = payload.new as any;
          setParticipants((prev) =>
            prev.map((existing) =>
              existing.id === p.id
                ? {
                    ...existing,
                    score: p.score ?? existing.score,
                    isAlive: p.is_alive ?? existing.isAlive ?? true,
                    eliminatedAtRound:
                      p.eliminated_at_round ?? existing.eliminatedAtRound ?? null,
                    eliminatedAtQuestionId:
                      p.eliminated_at_question_id ??
                      existing.eliminatedAtQuestionId ??
                      null,
                    skipsUsed: p.skips_used ?? existing.skipsUsed ?? 0,
                    choseContinue: p.chose_continue ?? existing.choseContinue ?? null,
                  }
                : existing,
            ),
          );
          if (isEliminationRef.current && p.is_alive === false) {
            SessionService.getGameState(session.id).then(setGameState);
          }
        },
      )
      .subscribe();

    const responsesChannel = supabase
      .channel(`host-responses-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "responses",
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          debouncedRefreshResponses();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(responsesChannel);
    };
  }, [session, debouncedRefreshResponses]);

  const applyQuestionSettings = (question?: Question) => {
    if (question?.showResultsInstantly) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
    setShowCorrectAnswer(false);
  };

  // ── Copy link handler with inline confirmation ────────────────────────────
  const handleCopyLink = useCallback(() => {
    const joinUrl = `${window.location.origin}/audience-participation?code=${session?.code}`;
    navigator.clipboard.writeText(joinUrl);
    
    // Show success state
    setIsCopySuccess(true);
    
    // Reset after 2 seconds
    setTimeout(() => {
      setIsCopySuccess(false);
    }, 2000);
  }, [session?.code]);

  // ── Action handlers ───────────────────────────────────────────────────────

  const handleStart = async (): Promise<void> => {
    // Guard against double submission
    if (isStarting) return;
    if (!session) return;
    
    const firstQuestion = session.presentation.questions[0];
    if (!firstQuestion) {
      toast({ title: "Error", description: "No questions found", variant: "destructive" });
      return;
    }

    setIsStarting(true);
    
    try {
      const timeLimit = getQuestionTimeLimit(firstQuestion);

      await SessionService.updateSessionStatus(session.id, "ACTIVE");
      const { startedAt, endsAt } = await SessionService.setCurrentQuestion(
        session.id,
        0,
        firstQuestion.id,
        timeLimit,
      );

      setCurrentQuestionIndex(0);
      applyQuestionTimer(firstQuestion, endsAt ?? undefined);
      applyQuestionSettings(firstQuestion);
      setIsPaused(false);
      isPausedRef.current = false;

      // Show speed intro overlay when the first question is a speed question.
      // Guard: do not re-show if this question was already processed (cached).
      // The overlay is dismissed manually — no timer anchor needed in the payload.
      if (firstQuestion?.isSpeedQuestion && !processedSpeedQuestionIdsRef.current.has(firstQuestion.id)) {
        setShowSpeedIntro(true);
      }

      sendMessage({
        type: "SESSION_START",
        payload: {
          sessionId: session.id,
          questionId: firstQuestion.id,
          questionIndex: 0,
          timeLimit,
          startedAt,
          endsAt,
        },
      });

      toast({ title: "Session Started", description: "Participants can now join and answer" });
    } catch (error) {
      console.error("Failed to start session:", error);
      toast({ title: "Error", description: "Failed to start session", variant: "destructive" });
    } finally {
      setIsStarting(false);
    }
  };

  const handlePrevious = async (): Promise<void> => {
    if (!session || currentQuestionIndex <= 0) return;

    const newIndex = currentQuestionIndex - 1;
    const prevQuestion = session.presentation.questions[newIndex];
    const timeLimit = getQuestionTimeLimit(prevQuestion);

    const { startedAt, endsAt } = await SessionService.setCurrentQuestion(
      session.id,
      newIndex,
      prevQuestion?.id,
      timeLimit,
    );

    setCurrentQuestionIndex(newIndex);
    applyQuestionTimer(prevQuestion, endsAt ?? undefined);
    applyQuestionSettings(prevQuestion);
    setIsPaused(false);
    isPausedRef.current = false;

    // Show speed intro overlay when navigating back to a speed question.
    // Guard: do not re-show if this question was already processed (cached).
    if (prevQuestion?.isSpeedQuestion && !processedSpeedQuestionIdsRef.current.has(prevQuestion.id)) {
      setShowSpeedIntro(true);
    }

    sendMessage({
      type: "QUESTION_CHANGE",
      payload: {
        questionId: prevQuestion?.id,
        questionIndex: newIndex,
        timeLimit,
        startedAt,
        endsAt,
      },
    });
  };

  //  handleNext now triggers the final round decision when the NEXT question
  // would be the last one — not when the current question already IS the last one.
  // This ensures participants see the FinalRoundDecision screen BEFORE the last question loads.
  const handleNext = async (): Promise<void> => {
    if (!session) return;

    const nextIndex = currentQuestionIndex + 1;
    const totalQuestions = session.presentation.questions.length;

    // In elimination mode: if the next question is the last one, show decision screen first.
    const nextIsLastQuestion = isElimination && nextIndex === totalQuestions - 1;

    if (nextIsLastQuestion && !finalRoundStarted && !isFinalRoundDecision && !pendingFinalRoundStart) {
      console.log("[HOST] Next question is the last — starting final round decision. Alive:", gameState.alive.length);
      await startFinalRoundDecision();
      return;
    }

    // Normal navigation to next question (not the final-round trigger case)
    if (nextIndex < totalQuestions) {
      const nextQuestion = session.presentation.questions[nextIndex];
      const timeLimit = getQuestionTimeLimit(nextQuestion);

      const { startedAt, endsAt } = await SessionService.setCurrentQuestion(
        session.id,
        nextIndex,
        nextQuestion?.id,
        timeLimit,
      );

      setCurrentQuestionIndex(nextIndex);
      applyQuestionTimer(nextQuestion, endsAt ?? undefined);
      applyQuestionSettings(nextQuestion);
      setIsPaused(false);
      isPausedRef.current = false;

      // Show speed intro overlay when navigating to a speed question.
      // Guard: do not re-show if this question was already processed (cached).
      if (nextQuestion?.isSpeedQuestion && !processedSpeedQuestionIdsRef.current.has(nextQuestion.id)) {
        setShowSpeedIntro(true);
      }

      sendMessage({
        type: "QUESTION_CHANGE",
        payload: {
          questionId: nextQuestion?.id,
          questionIndex: nextIndex,
          timeLimit,
          startedAt,
          endsAt,
        },
      });
    } else {
      // End of session (non-elimination, or elimination after final round)
      if (session) {
        sendMessage({ type: "SESSION_END", payload: {} });
        await SessionService.updateSessionStatus(session.id, "ENDED");
        navigate(`/results/${session.id}`);
      }
    }
  };

  const handleGameOver = async (): Promise<void> => {
    if (!session) return;
    sendMessage({ type: SESSION_EVENTS.SESSION_END, payload: {} });
    await SessionService.updateSessionStatus(session.id, "ENDED");
    navigate(`/results/${session.id}`);
  };

  const handleShowWinner = async (): Promise<void> => {
    if (!session) return;
    setIsRevealingWinner(true);
    try {
      const winner = await SessionService.determineWinner(session.id);
      if (!winner) {
        toast({
          title: "Aucun gagnant trouvé",
          description: "Tous les joueurs ont été éliminés.",
          variant: "destructive",
        });
        return;
      }

      setRevealedWinner(winner);

      sendMessage({
        type: SESSION_EVENTS.WINNER_REVEAL,
        payload: winner as unknown as Record<string, unknown>,
      });

      sendMessage({ type: SESSION_EVENTS.SESSION_END, payload: {} });
      await SessionService.updateSessionStatus(session.id, "ENDED");
    } catch (err: any) {
      console.error("handleShowWinner error:", err);
      toast({
        title: "Erreur",
        description: err.message || "Failed to determine winner",
        variant: "destructive",
      });
    } finally {
      setIsRevealingWinner(false);
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

      sendMessage({
        type: "PAUSE",
        payload: { remainingSeconds: timerRef.current },
      });
    } else {
      const hasTimer = getQuestionTimeLimit(currentQuestion) !== null;
      if (hasTimer && timerRef.current > 0) {
        const newEndsAtMs = Date.now() + timerRef.current * 1000;
        questionEndsAtRef.current = newEndsAtMs;
        setTimerActive(true);
        timerActiveRef.current = true;

        sendMessage({
          type: "RESUME",
          payload: {
            remainingSeconds: timerRef.current,
            endsAt: newEndsAtMs,
          },
        });
      } else {
        sendMessage({
          type: "RESUME",
          payload: { remainingSeconds: timerRef.current },
        });
      }
    }

    const success = await SessionService.togglePause(
      session.id,
      newPausedState,
      timerRef.current,
    );
    if (!success) {
      setIsPaused(!newPausedState);
      isPausedRef.current = !newPausedState;
      setTimerActive(newPausedState);
      timerActiveRef.current = newPausedState;
      toast({ title: "Error", description: "Failed to pause/resume session", variant: "destructive" });
    }
  };

  const handleRestart = async (): Promise<void> => {
    if (!session) return;
    const firstQuestion = session.presentation.questions[0];
    const timeLimit = getQuestionTimeLimit(firstQuestion);

    const { startedAt, endsAt } = await SessionService.setCurrentQuestion(
      session.id,
      0,
      firstQuestion?.id,
      timeLimit,
    );

    setCurrentQuestionIndex(0);
    applyQuestionTimer(firstQuestion, endsAt ?? undefined);
    applyQuestionSettings(firstQuestion);
    setIsPaused(false);
    isPausedRef.current = false;

    sendMessage({
      type: "QUESTION_CHANGE",
      payload: {
        questionId: firstQuestion?.id,
        questionIndex: 0,
        timeLimit,
        startedAt,
        endsAt,
      },
    });

    toast({ title: "Session Restarted", description: "Reset to the first question" });
  };

  useEffect(() => {
    const handler = () => {
      sendMessage({ type: "SESSION_END", payload: {} });
    };
    window.addEventListener("syncra:session-end-requested", handler);
    return () => window.removeEventListener("syncra:session-end-requested", handler);
  }, [sendMessage]);

  const handleEnd = (): void => setIsEndModalOpen(true);

  // ── Updated handleConfirmEnd with loading state ───────────────────────────
  const handleConfirmEnd = async (): Promise<void> => {
    // Guard against double submission
    if (isEnding) return;
    if (!session) return;

    setIsEnding(true);

    try {
      sendMessage({ type: "SESSION_END", payload: {} });
      await SessionService.updateSessionStatus(session.id, "ENDED");
      navigate(`/results/${session.id}`);
    } catch (error) {
      console.error("Failed to end session:", error);
      toast({ title: "Error", description: "Failed to end session", variant: "destructive" });
      setIsEnding(false);
    }
  };

  const handleToggleQuestionResults = (): void => {
    setShowResults((prev) => !prev);
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    debouncedRefreshResponses();
  };

  // Handle show results button for elimination questions ─────────
  const handleToggleResultsWithNoTimer = (): void => {
    // bug avant : Untimed speed question — processSpeedQuestionEnd() was never
    // called because it was only triggered by timer expiry. For untimed speed
    // questions the timer never runs, so the host clicking "Show Results"
    // previously only sent FORCE_QUESTION_CLOSE without broadcasting
    // SPEED_QUESTION_RESULTS, leaving all participants stuck with no overlays.
    //
    // sol : send FORCE_QUESTION_CLOSE first (blocks any late submissions on the
    // participant side immediately), then call processSpeedQuestionEnd() which
    // processes the DB eliminations and broadcasts SPEED_QUESTION_RESULTS so
    // participants see the correct elimination/advancing overlays.
    if (
      isElimination &&
      isSpeedQuestion &&
      currentQuestionTimeLimitRef.current === null &&
      !isProcessingSpeedQuestion &&
      !showResults
    ) {
      sendMessage({ type: SESSION_EVENTS.FORCE_QUESTION_CLOSE, payload: {} });
      processSpeedQuestionEnd(); // async: processes DB + broadcasts SPEED_QUESTION_RESULTS
      return;
    }

    // For non-speed untimed questions in elimination mode, we need to
    // process eliminations BEFORE showing results. Without this, participants
    // who answered incorrectly never see the elimination overlay because the
    // timer never expires to trigger the elimination logic.
    if (
      isElimination &&
      !isSpeedQuestion &&
      currentQuestionTimeLimitRef.current === null &&
      !isProcessingSpeedQuestion &&
      !showResults
    ) {
      // Close the question for participants
      sendMessage({ type: SESSION_EVENTS.FORCE_QUESTION_CLOSE, payload: {} });
      
      // Process eliminations for this untimed question
      processUntimedQuestionEliminations();
      return;
    }

    handleToggleQuestionResults();
    if (isElimination && currentQuestionTimeLimitRef.current === null) {
      sendMessage({ type: SESSION_EVENTS.FORCE_QUESTION_CLOSE, payload: {} });
    }
  };

  const handleToggleCorrectAnswer = (): void => {
    setShowCorrectAnswer((prev) => !prev);
  };

  const handleViewFinalResults = (): void => {
    if (session) navigate(`/results/${session.id}`);
  };

  const handleRevealVoteWinner = (): void => {
    setShowVoteWinner((prev) => !prev);  // Toggle
  };

  // ── Leave warning handlers ─────────────────────────────────────────────────
  const signalSessionEnd = () => {
    window.dispatchEvent(new CustomEvent("syncra:session-end-requested"));
  };

  const endSessionDB = async () => {
    if (!session) return;
    try {
      await supabase
        .from("sessions")
        .update({ status: "ENDED" })
        .eq("id", session.id);
    } catch (err: unknown) {
      console.error("Failed to end session:", err);
    }
  };

  const handleBackToDashboard = () => { setShowLeaveWarning(true); };
  const handleStay = () => { setShowLeaveWarning(false); };

  const handleLeaveAndEnd = async () => {
    setIsLeaving(true);
    signalSessionEnd();
    await new Promise<void>((resolve) => setTimeout(resolve, 150));
    await endSessionDB();
    setIsLeaving(false);
    setShowLeaveWarning(false);
    navigate("/dashboard");
  };

  const responseProgress =
    currentQuestion && session
      ? Math.min(
          100,
          Math.round(
            (Object.keys(currentResponses).length /
              (session.participantCount || 1)) *
              100,
          ),
        )
      : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <AppIcon name="Loader2" size={28} className="text-primary animate-spin" />
          </div>
          <p className="text-muted-foreground text-sm">Setting up your session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <AppIcon name="AlertCircle" size={32} className="text-destructive" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">Session Error</h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6">
            {error || "Session not found."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/dashboard")} className="w-full sm:w-auto">
              Return to Dashboard
            </Button>
            <Button onClick={() => navigate("/create")} className="w-full sm:w-auto">
              Create New Context
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── LOBBY VIEW ─────────────────────────────────────────────────────────────
  if (currentQuestionIndex === -1) {
    return (
      <div className="min-h-screen bg-primary flex flex-col text-white">
        <AnimatePresence>
          {showMobileParticipants && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setShowMobileParticipants(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-2xl p-5 max-h-[75vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-1 rounded-full bg-white/30" />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 font-bold text-base">
                    <AppIcon name="Users" size={18} />
                    <span>{participants.length} Joined</span>
                  </div>
                  <button
                    onClick={() => setShowMobileParticipants(false)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <AppIcon name="X" size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                  <AnimatePresence>
                    {participants.length === 0 ? (
                      <p className="text-center opacity-60 py-8 text-sm">
                        Waiting for participants to join...
                      </p>
                    ) : (
                      participants.map((p, i) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -16 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                        >
                          <Avatar className="h-8 w-8 border-2 border-white/20">
                            <AvatarImage src={p.avatar} />
                            <AvatarFallback>{p.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium flex-1 text-sm">{p.name}</span>
                          {p.score > 0 && (
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 text-xs">
                              {p.score} pts
                            </Badge>
                          )}
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8">
          <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col">
            {isElimination && (
              <div className="mb-4 sm:mb-6 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-3 flex items-center justify-center gap-2 text-sm sm:text-base font-semibold backdrop-blur-sm">
                <span>Mode élimination activé</span>
              </div>
            )}

            <div className="flex-1 flex flex-col md:grid md:grid-cols-2 md:gap-8 md:items-center gap-6">
              <div className="space-y-5 sm:space-y-6 md:space-y-8">
                <div>
                  <Badge variant="outline" className="text-white border-white mb-3 bg-white/20 text-xs sm:text-sm">
                    Join at {window.location.host}
                  </Badge>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-2">
                    Code: {session.code}
                  </h1>
                  <p className="text-base sm:text-xl opacity-90 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                    </span>
                    Waiting for participants...
                  </p>
                </div>

                <Card className="p-4 sm:p-6 bg-white/10 border-white/20 backdrop-blur-md text-white">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <button
                      type="button"
                      onClick={() => session?.code && setShowQrModal(true)}
                      disabled={!session?.code}
                      title="Click to enlarge"
                      className="h-24 w-24 sm:h-32 sm:w-32 bg-white rounded-lg flex items-center justify-center text-black flex-shrink-0 p-2 transition-transform hover:scale-105 hover:ring-2 hover:ring-white/60 disabled:cursor-not-allowed"
                    >
                      {session?.code ? (
                        <QRCodeSVG
                          value={`${window.location.origin}/audience-participation?code=${session.code}`}
                          size={256}
                          level="M"
                          includeMargin={false}
                          className="h-full w-full"
                        />
                      ) : (
                        <AppIcon name="QrCode" size={64} />
                      )}
                    </button>
                    <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                      <div className="text-xs sm:text-sm uppercase tracking-wider opacity-75">
                        Scan to join
                      </div>
                      {/* Copy Link Button with inline success state */}
                      <Button
                        variant="secondary"
                        size="sm"
                        className={`w-full transition-all duration-200 ${
                          isCopySuccess
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-white text-primary hover:bg-white/90"
                        }`}
                        onClick={handleCopyLink}
                      >
                        {isCopySuccess ? (
                          <>
                            <AppIcon name="Check" className="mr-2 h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <AppIcon name="Copy" className="mr-2 h-4 w-4" />
                            Copy Link
                          </>
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full bg-white/20 text-white border border-white/30 hover:bg-white/30"
                        onClick={() => session?.code && setShowQrModal(true)}
                        disabled={!session?.code}
                      >
                        <AppIcon name="Maximize" size={14} className="mr-2" />
                        Show QR fullscreen
                      </Button>
                      <p className="text-xs opacity-75 truncate">
                        or enter code: {session.code}
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                    <div className="text-2xl sm:text-3xl font-bold">
                      {session.presentation.questions.length}
                    </div>
                    <div className="text-xs sm:text-sm opacity-75">Questions</div>
                  </div>
                  <button
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-left hover:bg-white/20 transition-colors md:cursor-default"
                    onClick={() => setShowMobileParticipants(true)}
                  >
                    <div className="text-2xl sm:text-3xl font-bold">{participants.length}</div>
                    <div className="text-xs sm:text-sm opacity-75 flex items-center gap-1">
                      Participants
                      <AppIcon name="ChevronUp" size={12} className="md:hidden opacity-60" />
                    </div>
                  </button>
                </div>
              </div>

              <div
                className="hidden md:flex bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 flex-col"
                style={{ minHeight: "380px", maxHeight: "500px" }}
              >
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
                    {participants.length === 0 ? (
                      <p className="text-center opacity-60 py-8 text-sm">
                        Waiting for participants to join...
                      </p>
                    ) : (
                      participants.map((p, i) => (
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
                      ))
                    )}
                  </AnimatePresence>
                </div>

                {/* Start Presentation Button with loading state */}
                <Button
                  size="lg"
                  className={`w-full mt-4 font-bold text-lg shadow-xl transition-all duration-200 ${
                    isStarting
                      ? "bg-white/50 text-primary cursor-not-allowed"
                      : "bg-white text-primary hover:bg-white/90"
                  }`}
                  onClick={handleStart}
                  disabled={isStarting}
                >
                  {isStarting ? (
                    <>
                      <AppIcon name="Loader2" className="mr-2 h-5 w-5 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      Start Presentation
                      <AppIcon name="Play" className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="md:hidden mt-4 pb-safe">
              {/* Mobile Start Presentation Button with loading state */}
              <Button
                size="lg"
                className={`w-full font-bold text-base shadow-xl transition-all duration-200 ${
                  isStarting
                    ? "bg-white/50 text-primary cursor-not-allowed"
                    : "bg-white text-primary hover:bg-white/90"
                }`}
                onClick={handleStart}
                disabled={isStarting}
              >
                {isStarting ? (
                  <>
                    <AppIcon name="Loader2" className="mr-2 h-5 w-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start Presentation
                    <AppIcon name="Play" className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {showQrModal && session?.code && (
          <QrFullscreenModal code={session.code} onClose={() => setShowQrModal(false)} />
        )}
      </div>
    );
  }

  // ── ACTIVE QUESTION VIEW ────────────────────────────────────────────────────
  return (
    <>
      {/* Timer progress bar */}
      {currentQuestion && getQuestionTimeLimit(currentQuestion) !== null && (
        <div className="fixed top-0 left-0 right-0 h-1 w-full bg-muted/40 z-[9999]">
          {isPaused ? (
            <div
              className="h-full bg-primary"
              style={{
                width: `${Math.max(0, (timer / (getQuestionTimeLimit(currentQuestion) || 1)) * 100)}%`,
              }}
            />
          ) : timerActive ? (
            <motion.div
              className="h-full bg-primary origin-left"
              initial={false}
              animate={{
                scaleX: timer / (getQuestionTimeLimit(currentQuestion) || 1),
              }}
              transition={{ duration: 0.5, ease: "linear" }}
              style={{ transformOrigin: "left" }}
            />
          ) : null}
        </div>
      )}

      {/* Clock pill - centered */}
      {currentQuestion && getQuestionTimeLimit(currentQuestion) !== null && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
          <div
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 shadow-lg border backdrop-blur-sm transition-colors ${
              isPaused
                ? 'bg-card/80 border-border text-foreground'
                : 'bg-card/80 border-border text-foreground'
            }`}
          >
            <AppIcon name={isPaused ? 'PauseCircle' : 'Clock'} size={13} className="text-primary" />
            <span className="font-mono font-bold text-sm tabular-nums">
              {timer}s
            </span>
          </div>
        </div>
      )}

      {/* Back arrow and logo */}
      {!isFullscreen && (
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <AppIcon name="ArrowLeft" size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm font-medium hidden sm:inline cursor-pointer">Back to Dashboard</span>
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-2 -mr-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center">
                <svg
                  viewBox="16 6 70 89"
                  width="100%"
                  height="100%"
                  preserveAspectRatio="xMidYMid meet"
                  className="fill-primary"
                >
                  <path d="M52.0032727,91.1841818 L45.484,84.6649091 L85.3654545,84.6649091 L85.3654545,17.5625455 L80.836,17.5625455 L80.836,80.1354545 L45.484,80.1354545 L52.0032727,73.6161818 L48.8009091,70.4138182 L36.8161818,82.4001818 L48.8009091,94.3865455 L52.0032727,91.1841818 L52.0032727,91.1841818 Z M55.7456364,19.8272727 L48.8009091,26.7703636 L52.0032727,29.9727273 L63.9912727,17.988 L52.0032727,6 L48.8009091,9.20236364 L54.8963636,15.2994545 L16,15.2994545 L16,82.4001818 L20.5278182,82.4001818 L20.5278182,19.8272727 L55.7456364,19.8272727 L55.7456364,19.8272727 Z" />
                </svg>
              </div>
              <span className="font-heading font-bold text-lg text-foreground">Syncra</span>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        <main className="flex-1 flex flex-col items-center p-3 sm:p-4 md:p-6 lg:p-8 pb-24 relative overflow-hidden">
          <div className="max-w-5xl w-full">
            {currentQuestion && (
              <QuestionDisplay
                question={currentQuestion}
                responses={currentResponses}
                showResults={showResults}
                showCorrectAnswer={showCorrectAnswer}
                hideParticipantNames={hideParticipantNames}
                revealVoteWinner={showVoteWinner}      
                onRevealVoteWinner={handleRevealVoteWinner}  
              />
            )}
          </div>
        </main>

        {/* Floating bottom control panel */}
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
          onToggleQuestionResults={handleToggleResultsWithNoTimer}
          isShowingResults={showResults}
          showCorrectAnswer={showCorrectAnswer}
          onToggleCorrectAnswer={handleToggleCorrectAnswer}
          isMultipleChoice={isCurrentMultipleChoice}
          hideParticipantNames={hideParticipantNames}
          onToggleHideParticipantNames={setHideParticipantNames}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          isElimination={isElimination}
          onToggleEliminationPanel={() => setShowEliminationPanel((v) => !v)}
          showResultsActionButton={showResults}
          onViewResults={() => {
            sendMessage({ type: "SESSION_END", payload: {} });
            SessionService.updateSessionStatus(session.id, "ENDED");
            navigate(`/results/${session.id}`);
          }}
          onShowWinner={handleShowWinner}
          isLastQuestion={isLastQuestion}
          isRevealingWinner={isRevealingWinner}
          hasWinner={!!revealedWinner}
        />

        {isPaused && <PauseOverlay onResume={handlePause} />}

        <EndSessionModal
          isOpen={isEndModalOpen}
          onClose={() => setIsEndModalOpen(false)}
          onConfirm={handleConfirmEnd}
          onViewResults={handleViewFinalResults}
          isEnding={isEnding}
        />

        <AnimatePresence>
          {isElimination && showEliminationPanel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[140] bg-black/40"
              onClick={() => setShowEliminationPanel(false)}
            >
              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 right-0 h-full w-full sm:w-[380px] bg-background border-l border-border shadow-2xl p-4 sm:p-5 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AppIcon name="History" size={18} className="text-primary" />
                    <h2 className="text-base font-semibold">Historique des éliminations</h2>
                  </div>
                  <button
                    onClick={() => setShowEliminationPanel(false)}
                    className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center"
                    aria-label="Fermer"
                  >
                    <AppIcon name="X" size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-border/50 overflow-hidden mb-8 shadow-sm">
                  <div className="py-5 flex flex-col items-center justify-center border-r border-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-1.5">
                      En lice
                    </span>
                    <span className="text-3xl font-black tracking-tighter text-foreground tabular-nums">
                      {survivorsCount}
                    </span>
                  </div>
                  <div className="py-5 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-1.5">
                      Éliminés
                    </span>
                    <span className="text-3xl font-black tracking-tighter text-red-600 dark:text-red-500 tabular-nums">
                      {eliminatedCount}
                    </span>
                  </div>
                </div>

                {/* OPTIMIZED: eliminationHistory prop replaces the internal 2s DB poll.
                    gameState.history is kept current by Broadcast events so no extra
                    DB queries are needed inside EliminationHistory. */}
                <EliminationHistory
                  sessionId={session.id}
                  eliminationHistory={gameState.history}
                  gameState={gameState}
                  currentQuestionId={currentQuestion?.id}
                  revealHistory={
                    getQuestionTimeLimit(currentQuestion) !== null
                      ? !timerActive && !isProcessingSpeedQuestion
                      : showResults
                  }
                />
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {isElimination && isGameOver && !revealedWinner && (
          <GameOverOverlay visible isHost onEnd={handleGameOver} />
        )}

        <WinnerReveal
          isElimination={isElimination}
          revealedWinner={revealedWinner}
          gameState={gameState}
          handleViewFinalResults={handleViewFinalResults}
        />

        {showQrModal && session?.code && (
          <QrFullscreenModal code={session.code} onClose={() => setShowQrModal(false)} />
        )}

        {isElimination && (
          <RoundEliminationsOverlay
            count={roundEliminationCount}
            roundNumber={overlayRoundNumber}
            eliminatedNames={currentRoundEliminatedNames}
            onClose={() => setRoundEliminationCount(null)}
          />
        )}

        {/* Speed question advancing overlay — shown after timer ends and results are processed */}
        {isElimination && isSpeedQuestion && (
          <SpeedQuestionAdvancingOverlay
            count={speedQuestionResults ? speedQuestionResults.advancingParticipantIds.length : null}
            questionNumber={currentQuestionIndex + 1}
            advancingNames={
              speedQuestionResults
                ? speedQuestionResults.advancingParticipantIds
                    .map((pid) => participants.find((p) => p.id === pid)?.name ?? "")
                    .filter(Boolean)
                : []
            }
            onClose={() => setSpeedQuestionResults(null)}
          />
        )}

        {/* Final round decision overlay — prevents host screen from appearing frozen.
            onStart is the manual trigger: the host clicks "Start Final Round"
            when they decide enough participants have responded. */}
        <FinalRoundWaitingOverlay
          visible={isFinalRoundDecision}
          totalDeciding={finalRoundDecidingTotal || gameState.alive.length}
          decidedCount={finalRoundDecidedCount}
          onStart={handleManualFinalRoundStart}
        />

        {/* Speed question intro overlay — shown when the host navigates to a speed
            question.  The host dismisses it manually by clicking "Show Question",
            which also broadcasts SPEED_INTRO_DISMISS to all participant screens. */}
        <SpeedQuestionIntro
          visible={showSpeedIntro}
          maxAdvance={speedMaxAdvance}
          isHost
          onDismiss={() => {
            setShowSpeedIntro(false);
            sendMessage({ type: "SPEED_INTRO_DISMISS", payload: {} });
          }}
        />
      </div>

      <LeaveWarningModal
        isOpen={showLeaveWarning}
        onStay={handleStay}
        onLeave={handleLeaveAndEnd}
        isLeaving={isLeaving}
      />
    </>
  );
};

export default HostSession;