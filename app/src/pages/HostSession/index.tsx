// src/pages/HostSession/index.tsx
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
import { SessionService } from "../../service/session.service.ts";
import "../../styles/cent-pour-cent-logique.css";
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

  // ── 100% Logique elimination state ───────────────────────────────────────
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

  // ── Frozen game state for the EliminationHistory side-panel ─────────────
  // The live `gameState` updates the instant the server reports a player
  // elimination via realtime. To avoid spoiling the round in progress, we
  // keep a delayed mirror that is only refreshed when the round actually
  // ends (timer hits 0 / showResults flips on) or when a new question
  // starts. EliminationHistory reads from this frozen snapshot.
  const [displayedGameState, setDisplayedGameState] = useState<GameState>({
    alive: [],
    eliminated: [],
    winner: null,
    totalPlayers: 0,
    currentRound: 0,
    history: [],
  });

  // Snapshot of `gameState.eliminated.length` taken when the current round
  // started. Used to compute "how many got eliminated during this round"
  // for the round-end overlay below.
  const roundStartEliminatedCountRef = useRef<number>(0);

  // When non-null, the round-end overlay is shown with this number.
  const [roundEliminationCount, setRoundEliminationCount] = useState<
    number | null
  >(null);
  // Round number captured at the moment the overlay is triggered, so the
  // overlay keeps showing the correct round even if state advances.
  const [overlayRoundNumber, setOverlayRoundNumber] = useState<number>(0);

  // ── Winner reveal (host-controlled) ───────────────────────────────────────
  // The WinnerCelebration overlay is now opt-in: it only appears after the
  // host clicks the "Show Winner" button below the results of the LAST
  // question. We store the revealed winner locally and broadcast it so the
  // audience can render their own WinnerCelebration screen.
  const [revealedWinner, setRevealedWinner] = useState<Participant | null>(null);
  const [isRevealingWinner, setIsRevealingWinner] = useState<boolean>(false);

  // ── Derived values ────────────────────────────────────────────────────────
  const isElimination = contextMeta.gameMode === "elimination";
  const themeId = contextMeta.themeId;

  // ── Survivor / eliminated counters ────────────────────────────────────────
  const survivorsCount = isElimination ? gameState.alive.length : 0;
  const eliminatedCount = isElimination ? gameState.eliminated.length : 0;

  // ── All useRef hooks ──────────────────────────────────────────────────────
  const timerRef = useRef<number>(0);
  const timerActiveRef = useRef<boolean>(false);
  const timerIntervalRef = useRef<number | undefined>(undefined);
  const isPausedRef = useRef<boolean>(false);
  const sessionRef = useRef<Session | null>(null);
  const currentQuestionRef = useRef<Question | undefined>(undefined);
  const hasLoadedRef = useRef<boolean>(false);
  const hideParticipantNamesRef = useRef<boolean>(false);
  const gameStateRef = useRef<GameState>(gameState);
  const isEliminationRef = useRef<boolean>(false);
  const sendMessageRef = useRef<(msg: any) => void>(() => {});

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

  const currentQuestion: Question | undefined =
    currentQuestionIndex >= 0
      ? session?.presentation?.questions?.[currentQuestionIndex]
      : undefined;

  const currentResponses: QuestionResponses = currentQuestion
    ? responses[currentQuestion.id] || {}
    : {};

  const isCurrentMultipleChoice = currentQuestion?.type === "multiple-choice";

  const getQuestionTimeLimit = (question?: Question | null): number | null => {
    if (!question || question.timeLimit == null || question.timeLimit <= 0)
      return null;
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

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // ── Keep refs in sync ────────────────────────────────────────────────────
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);
  useEffect(() => { timerRef.current = timer; }, [timer]);
  useEffect(() => { timerActiveRef.current = timerActive; }, [timerActive]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { hideParticipantNamesRef.current = hideParticipantNames; }, [hideParticipantNames]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { isEliminationRef.current = isElimination; }, [isElimination]);


  // ── Fullscreen change listener ───────────────────────────────────────────
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ── Real-time message handler ────────────────────────────────────────────
  const handleWsMessage = useCallback(
    (msg: { type: string; payload?: Record<string, unknown> }) => {
      if (msg.type === SESSION_EVENTS.RESPONSE_SUBMITTED) {
        const q = currentQuestionRef.current;
        const sess = sessionRef.current;
        if (q && sess) {
          SessionService.getQuestionResponses(
            sess.id,
            q.id,
            hideParticipantNamesRef.current,
          ).then((updated) => {
            setResponses((prev) => ({ ...prev, [q.id]: updated }));
          });
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
          sendMessageRef.current?.({
            type: SESSION_EVENTS.GAME_STATE_UPDATE,
            payload: gameStateRef.current as unknown as Record<string, unknown>,
          });
        }
        return;
      }
    },
    [toast],
  );

  const { sendMessage, connected: wsConnected } = useSessionSocket({
    sessionId: session?.id ?? null,
    role: "host",
    onMessage: handleWsMessage,
    enabled: !!session,
  });

  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

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
        if (
          !isPausedRef.current &&
          timerActiveRef.current &&
          timerRef.current > 0
        ) {
          timerRef.current -= 1;
          setTimer(timerRef.current);

          if (timerRef.current <= 0) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = undefined;
            timerActiveRef.current = false;
            setTimerActive(false);
            setShowResults(true);
            toast({ title: "Time's Up!", description: "Showing results..." });

            // ── Round just ended: refresh the EliminationHistory snapshot
            // and show the round-end overlay with the count of players
            // eliminated during this round. We wait briefly so any
            // server-side eliminations triggered by the round end have
            // time to propagate via realtime.
            if (isEliminationRef.current) {
              window.setTimeout(() => {
                const latest = gameStateRef.current;
                const count =
                  latest.eliminated.length -
                  roundStartEliminatedCountRef.current;
                setDisplayedGameState(latest);
                if (count > 0) {
                  setRoundEliminationCount(count);
                  setOverlayRoundNumber(latest.currentRound);
                }
              }, 1200);
            }
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
  }, [currentQuestionIndex, timerActive, timerRef.current, isPaused, toast]);

  useEffect(
    () => () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    },
    [],
  );

  // ── Update hideParticipantNames when currentQuestion changes ──────────
  useEffect(() => {
    if (currentQuestion) {
      setHideParticipantNames(currentQuestion.hideParticipantNames ?? false);
    }
  }, [currentQuestion?.id]);

  // ── New round started: take baseline snapshot for the overlay & sync
  // the EliminationHistory mirror so it shows the state as of round-start.
  // Also dismiss any leftover round-end overlay from the previous round.
  useEffect(() => {
    if (currentQuestionIndex < 0) return;
    roundStartEliminatedCountRef.current = gameStateRef.current.eliminated.length;
    setDisplayedGameState(gameStateRef.current);
    setRoundEliminationCount(null);
  }, [currentQuestionIndex]);

  // ── Reload responses when hideParticipantNames or showResults changes ────
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

  // ── Load session ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !user || hasLoadedRef.current) return;

    const loadSession = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: existingSession, error: sessionFetchError } =
          await supabase
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
                show_results_instantly, hide_participant_names
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
              hideParticipantNames: q.hide_participant_names ?? false,
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
              if (currentQ.showResultsInstantly) {
                setShowResults(true);
              }

              const limit = getQuestionTimeLimit(currentQ);
              let remaining = limit ?? 0;
              if (limit === null) {
                remaining = 0;
              } else if (
                existingSession.is_paused &&
                existingSession.timer_paused_remaining != null
              ) {
                remaining = existingSession.timer_paused_remaining;
              } else if (
                !existingSession.is_paused &&
                existingSession.timer_resumed_at != null &&
                existingSession.timer_paused_remaining != null
              ) {
                const elapsedSinceResume = Math.floor(
                  (Date.now() -
                    new Date(existingSession.timer_resumed_at).getTime()) /
                    1000,
                );
                remaining = Math.max(
                  0,
                  existingSession.timer_paused_remaining - elapsedSinceResume,
                );
              } else if (existingSession.current_question_started_at) {
                const elapsed = Math.floor(
                  (Date.now() -
                    new Date(
                      existingSession.current_question_started_at,
                    ).getTime()) /
                    1000,
                );
                remaining = Math.max(0, limit - elapsed);
              } else {
                remaining = limit;
              }

              setTimer(remaining);
              timerRef.current = remaining;
              const shouldBeActive =
                limit !== null && !existingSession.is_paused && remaining > 0;
              setTimerActive(shouldBeActive);
              timerActiveRef.current = shouldBeActive;
            }
          }

          const participantsData = await SessionService.getParticipants(
            existingSession.id,
          );
          setParticipants(participantsData);

          if (existingSession.current_question_index >= 0) {
            const currentQ = questions[existingSession.current_question_index];
            if (currentQ) {
              const responsesData = await SessionService.getQuestionResponses(
                existingSession.id,
                currentQ.id,
                currentQ.hideParticipantNames ?? false,
              );
              setResponses((prev) => ({
                ...prev,
                [currentQ.id]: responsesData,
              }));
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

  // ── Hydrate elimination game state ───────────────────────────────────────
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

  // ── Periodic game state refresh for elimination mode (fallback) ────────────
  useEffect(() => {
    if (!session?.id || !isElimination) return;

    const interval = setInterval(async () => {
      const newState = await SessionService.getGameState(session.id);
      setGameState(newState);
    }, 3000);

    return () => clearInterval(interval);
  }, [session?.id, isElimination]);

  // ── Supabase subscriptions: participants (INSERT + UPDATE) + responses ──
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
        async () => {
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
        },
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
      toast({
        title: "Error",
        description: "No questions found",
        variant: "destructive",
      });
      return;
    }

    const startedAt = new Date().toISOString();
    await SessionService.updateSessionStatus(session.id, "ACTIVE");
    await SessionService.setCurrentQuestion(session.id, 0, firstQuestion.id);

    setCurrentQuestionIndex(0);
    const timeLimit = applyQuestionTimer(firstQuestion);
    applyQuestionSettings(firstQuestion);
    setIsPaused(false);
    isPausedRef.current = false;

    sendMessage({
      type: "SESSION_START",
      payload: {
        sessionId: session.id,
        questionId: firstQuestion.id,
        questionIndex: 0,
        timeLimit,
        startedAt,
      },
    });

    toast({
      title: "Session Started",
      description: "Participants can now join and answer",
    });
  };

  const handlePrevious = async (): Promise<void> => {
    if (!session || currentQuestionIndex <= 0) return;

    const newIndex = currentQuestionIndex - 1;
    const prevQuestion = session.presentation.questions[newIndex];
    const startedAt = new Date().toISOString();

    await SessionService.setCurrentQuestion(
      session.id,
      newIndex,
      prevQuestion?.id,
    );

    setCurrentQuestionIndex(newIndex);
    const timeLimit = applyQuestionTimer(prevQuestion);
    applyQuestionSettings(prevQuestion);
    setIsPaused(false);
    isPausedRef.current = false;

    sendMessage({
      type: "QUESTION_CHANGE",
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

      await SessionService.setCurrentQuestion(
        session.id,
        newIndex,
        nextQuestion?.id,
      );

      setCurrentQuestionIndex(newIndex);
      const timeLimit = applyQuestionTimer(nextQuestion);
      applyQuestionSettings(nextQuestion);
      setIsPaused(false);
      isPausedRef.current = false;

      sendMessage({
        type: "QUESTION_CHANGE",
        payload: {
          questionId: nextQuestion?.id,
          questionIndex: newIndex,
          timeLimit,
          startedAt,
        },
      });
    } else {
      // Last question completed.
      if (isElimination) {
        // In elimination mode we do NOT auto-end the session and we do NOT
        // determine the winner here. The host must click the dedicated
        // "Show Winner" button (rendered in the showResults panel below
        // the last question). That button calls `handleShowWinner` which
        // determines the winner and broadcasts WINNER_REVEAL.
        toast({
          title: "Dernière question terminée",
          description: "Cliquez sur « Afficher le gagnant » pour révéler le gagnant.",
        });
      } else {
        sendMessage({ type: "SESSION_END", payload: {} });
        await SessionService.updateSessionStatus(session.id, "ENDED");
        navigate(`/results/${session.id}`);
      }
    }
  };

  /**
   * Reveal the winner. Triggered by the "Show Winner" button shown after the
   * last question in elimination mode. Determines the winner using the
   * official rules (alive participant — i.e. answered every question
   * correctly — with the earliest correct response on the last question as
   * the tie-breaker), broadcasts a WINNER_REVEAL event so the audience can
   * render their own celebration overlay, and then ends the session.
   */
  const handleShowWinner = async (): Promise<void> => {
    if (!session || !isElimination) return;
    if (isRevealingWinner) return;

    setIsRevealingWinner(true);
    try {
      const winner = await SessionService.determineWinner(session.id);

      if (!winner) {
        toast({
          title: "Aucun gagnant",
          description: "Impossible de déterminer un gagnant pour cette session.",
          variant: "destructive",
        });
        return;
      }

      setRevealedWinner(winner);

      // Broadcast to all audience participants so they show the same screen.
      sendMessage({
        type: SESSION_EVENTS.WINNER_REVEAL,
        payload: winner as unknown as Record<string, unknown>,
      });

      // Mark session ended in the backend.
      sendMessage({ type: SESSION_EVENTS.SESSION_END, payload: {} });
      await SessionService.updateSessionStatus(session.id, "ENDED");
    } catch (err: any) {
      console.error("handleShowWinner error:", err);
      toast({
        title: "Erreur",
        description: err?.message || "Échec de la révélation du gagnant.",
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
      setTimerActive(true);
      timerActiveRef.current = true;
      sendMessage({
        type: "RESUME",
        payload: {
          remainingSeconds: timerRef.current,
          resumedAt: new Date().toISOString(),
        },
      });
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
      toast({
        title: "Error",
        description: "Failed to pause/resume session",
        variant: "destructive",
      });
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
      type: "QUESTION_CHANGE",
      payload: {
        questionId: firstQuestion?.id,
        questionIndex: 0,
        timeLimit,
        startedAt,
      },
    });

    toast({
      title: "Session Restarted",
      description: "Reset to the first question",
    });
  };

  useEffect(() => {
    const handler = () => {
      sendMessage({ type: "SESSION_END", payload: {} });
    };
    window.addEventListener("syncra:session-end-requested", handler);
    return () => window.removeEventListener("syncra:session-end-requested", handler);
  }, [sendMessage]);

  const handleEnd = (): void => setIsEndModalOpen(true);

  const handleConfirmEnd = async (): Promise<void> => {
    if (!session) return;
    sendMessage({ type: "SESSION_END", payload: {} });
    await SessionService.updateSessionStatus(session.id, "ENDED");
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
    toast({
      title: "Link Copied!",
      description: "Share this link with participants to join",
      duration: 2000,
    });
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

  // ── Render ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <AppIcon
              name="Loader2"
              size={28}
              className="text-primary animate-spin"
            />
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
            <AppIcon
              name="AlertCircle"
              size={32}
              className="text-destructive"
            />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
            Session Error
          </h2>
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

  // ── LOBBY VIEW ────────────────────────────────────────────────────────────
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
                            <Badge
                              variant="secondary"
                              className="bg-yellow-500/20 text-yellow-300 text-xs"
                            >
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
                  <Badge
                    variant="outline"
                    className="text-white border-white mb-3 bg-white/20 text-xs sm:text-sm"
                  >
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
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full bg-white text-primary hover:bg-white/90"
                        onClick={handleCopyLink}
                      >
                        <AppIcon name="Copy" className="mr-2 h-4 w-4" /> Copy Link
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

              <div className="hidden md:flex bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 flex-col" style={{ minHeight: "380px", maxHeight: "500px" }}>
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
                            <Badge
                              variant="secondary"
                              className="bg-yellow-500/20 text-yellow-300"
                            >
                              {p.score} pts
                            </Badge>
                          )}
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>

                <Button
                  size="lg"
                  className="w-full mt-4 bg-white text-primary hover:bg-white/90 font-bold text-lg shadow-xl"
                  onClick={handleStart}
                >
                  Start Presentation{" "}
                  <AppIcon name="Play" className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="md:hidden mt-4 pb-safe">
              <Button
                size="lg"
                className="w-full bg-white text-primary hover:bg-white/90 font-bold text-base shadow-xl"
                onClick={handleStart}
              >
                Start Presentation{" "}
                <AppIcon name="Play" className="ml-2 h-5 w-5" />
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

  // ── ACTIVE QUESTION VIEW ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 md:h-16 border-b border-border flex items-center justify-between px-3 md:px-6 bg-card sticky top-0 z-30 gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <AppIcon name="Radio" size={14} className="text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-foreground text-sm md:text-base truncate block max-w-[120px] sm:max-w-[200px] md:max-w-none">
              {session.presentation.title}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                • {session.code}
              </span>
              {isPaused && (
                <span className="text-xs bg-yellow-500/20 text-yellow-600 px-1.5 py-0.5 rounded">
                  Paused
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
          {isElimination && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowEliminationPanel((v) => !v)}
                title="Historique des éliminations"
                className="h-8 w-8 md:h-9 md:w-9 relative"
              >
                <AppIcon name="History" size={15} />
              </Button>
            </>
          )}

          {currentQuestion && getQuestionTimeLimit(currentQuestion) === null && (
            <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-muted">
              <AppIcon name="Infinity" size={14} className="text-primary" />
              <span className="font-semibold text-primary text-xs sm:text-sm hidden sm:inline">No timer</span>
            </div>
          )}
          {currentQuestion && getQuestionTimeLimit(currentQuestion) !== null && (
            <div
              className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg ${
                isPaused ? "bg-yellow-500/20" : "bg-muted"
              }`}
            >
              <AppIcon name="Clock" size={14} className="text-primary" />
              <span className="font-mono font-bold text-primary text-xs sm:text-sm">
                {timer}s
              </span>
            </div>
          )}

          <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1">
            {currentQuestionIndex + 1}/{session.presentation.questions.length}
          </Badge>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="hidden md:flex h-8 w-8 md:h-9 md:w-9"
          >
            <AppIcon name={isFullscreen ? "Minimize" : "Maximize"} size={15} />
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleEnd}
            className="text-xs px-2 sm:px-3"
          >
            Exit
          </Button>
        </div>
      </header>

      {currentQuestion && getQuestionTimeLimit(currentQuestion) !== null && (
        <div className="h-1 w-full bg-muted/40">
          {isPaused ? (
            <div
              className="h-full bg-yellow-500"
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
              transition={{ duration: 1, ease: "linear" }}
              style={{ transformOrigin: "left" }}
            />
          ) : null}
        </div>
      )}

      <main className="flex-1 flex flex-col items-center p-3 sm:p-4 md:p-6 lg:p-8 pb-72 sm:pb-64 lg:pb-8 relative overflow-hidden">
        <div className="max-w-5xl w-full">
          {currentQuestion && (
            <QuestionDisplay
              question={currentQuestion}
              responses={currentResponses}
              showResults={showResults}
              showCorrectAnswer={showCorrectAnswer}
              hideParticipantNames={hideParticipantNames}
            />
          )}

          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card p-4 sm:p-6 rounded-xl border border-border shadow-xl mt-6 sm:mt-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    <AppIcon name="Trophy" size={22} className="text-yellow-600" />
                  </div>
                  <div>
                    <div className="font-bold text-base sm:text-lg">
                      Ready for next question?
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {participants.slice(0, 3).map((p) => p.name).join(", ")}{" "}
                      {participants.length > 3 ? "and others are waiting" : ""}
                    </div>
                  </div>
                </div>
                {currentQuestionIndex === session.presentation.questions.length - 1 ? (
                  isElimination ? (
                    <Button
                      size="lg"
                      onClick={handleShowWinner}
                      disabled={isRevealingWinner || !!revealedWinner}
                      className="w-full sm:w-auto sm:min-w-40 bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold"
                    >
                      {isRevealingWinner ? (
                        <>
                          Révélation…{" "}
                          <AppIcon name="Loader2" className="ml-2 h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        <>
                          Afficher le gagnant{" "}
                          <AppIcon name="Crown" className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button size="lg" onClick={handleNext} className="w-full sm:w-auto sm:min-w-40">
                      View Results{" "}
                      <AppIcon name="BarChart3" className="ml-2 h-4 w-4" />
                    </Button>
                  )
                ) : (
                  <Button size="lg" onClick={handleNext} className="w-full sm:w-auto sm:min-w-40">
                    Next Question{" "}
                    <AppIcon name="ChevronRight" className="ml-2 h-4 w-4" />
                  </Button>
                )}
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
        hideParticipantNames={hideParticipantNames}
        onToggleHideParticipantNames={setHideParticipantNames}
      />

      {isPaused && <PauseOverlay onResume={handlePause} />}

      <EndSessionModal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        onConfirm={handleConfirmEnd}
        onViewResults={handleViewFinalResults}
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

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                    {survivorsCount}
                  </div>
                  <div className="text-xs text-muted-foreground">En lice</div>
                </div>
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center">
                  <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                    {eliminatedCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Éliminés</div>
                </div>
              </div>

              <EliminationHistory
                sessionId={session.id}
                gameState={displayedGameState}
              />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        Winner overlay (host side).
        Shown ONLY after the host clicks the "Show Winner" button — i.e.
        once `revealedWinner` is set. Previously this was driven by
        `gameState.winner`, which auto-popped as soon as the last question
        was displayed.
      */}
      {isElimination && revealedWinner && (
        <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 16, stiffness: 240 }}
            className="max-w-md w-full text-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 rounded-3xl p-8 shadow-2xl border-4 border-yellow-200/40"
          >
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-yellow-950/15 flex items-center justify-center">
              <AppIcon name="Crown" size={48} className="text-yellow-950" />
            </div>
            <div className="text-xs uppercase tracking-[0.3em] text-yellow-900/80 font-bold mb-2">
              100% Logique
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-yellow-950 mb-2">
              {revealedWinner.name}
            </h2>
            <p className="text-yellow-950/80 font-semibold mb-6">
              remporte la manche
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-yellow-950/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-950">
                  {revealedWinner.score}
                </div>
                <div className="text-xs text-yellow-950/70">Points</div>
              </div>
              <div className="bg-yellow-950/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-950">
                  {gameState.totalPlayers}
                </div>
                <div className="text-xs text-yellow-950/70">Joueurs</div>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full bg-yellow-950 text-yellow-100 hover:bg-yellow-900"
              onClick={handleViewFinalResults}
            >
              Voir les résultats
              <AppIcon name="ArrowRight" className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      )}

      {showQrModal && session?.code && (
        <QrFullscreenModal code={session.code} onClose={() => setShowQrModal(false)} />
      )}

      {/*
        Round-end elimination overlay. Pops the moment the timer hits 0
        (with a short delay so server-side eliminations propagate), shows
        the count of players eliminated during the round that just ended,
        and is dismissed by the host with the X button or by clicking the
        backdrop.
      */}
      {isElimination && (
        <RoundEliminationsOverlay
          count={roundEliminationCount}
          roundNumber={overlayRoundNumber}
          onClose={() => setRoundEliminationCount(null)}
        />
      )}
    </div>
  );
};

export default HostSession;
