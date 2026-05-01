/**
 * Real-time session events via Supabase Broadcast channels.
 *
 * Standard message types (unchanged):
 *   SESSION_START      { questionId, questionIndex, timeLimit, startedAt }
 *   QUESTION_CHANGE    { questionId, questionIndex, timeLimit, startedAt }
 *   PAUSE              { remainingSeconds }
 *   RESUME             { remainingSeconds, resumedAt }
 *   SESSION_END        {}
 *   RESPONSE_SUBMITTED { participantId, questionId }
 *
 * Elimination message types:
 *   PLAYER_ELIMINATED  { participantId, participantName, questionId, roundNumber, eliminatedAt }
 *   GAME_STATE_UPDATE  { alive, eliminated, totalPlayers, currentRound, history }
 *   GAME_END           { winner }
 *   ANSWER_RECEIVED    { participantId, questionId, correct }
 *   WINNER_REVEAL      { winner }   ← NEW: broadcast when host clicks "Show Winner"
 *   FORCE_QUESTION_CLOSE {}         ← NEW: for no‑timer questions, host forces round end
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface WSMessage {
  type: string;
  payload?: Record<string, unknown>;
}

export interface UseSessionSocketOptions {
  sessionId: string | null;
  role: "host" | "audience";
  onMessage: (msg: WSMessage) => void;
  enabled?: boolean;
}

export interface UseSessionSocketResult {
  sendMessage: (msg: WSMessage) => void;
  connected: boolean;
}

const BROADCAST_EVENT = "session-event";

/** Strongly-typed message kinds — useful in switch statements. */
export const SESSION_EVENTS = {
  // existing
  SESSION_START: "SESSION_START",
  QUESTION_CHANGE: "QUESTION_CHANGE",
  PAUSE: "PAUSE",
  RESUME: "RESUME",
  SESSION_END: "SESSION_END",
  RESPONSE_SUBMITTED: "RESPONSE_SUBMITTED",
  // 100% Logique
  PLAYER_ELIMINATED: "PLAYER_ELIMINATED",
  GAME_STATE_UPDATE: "GAME_STATE_UPDATE",
  GAME_END: "GAME_END",
  ANSWER_RECEIVED: "ANSWER_RECEIVED",
  WINNER_REVEAL: "WINNER_REVEAL",
  // late-joiner support
  REQUEST_GAME_STATE: "REQUEST_GAME_STATE",
  // ── NEW: force round end for no‑timer questions ──
  FORCE_QUESTION_CLOSE: "FORCE_QUESTION_CLOSE",
} as const;

export function useSessionSocket({
  sessionId,
  role,
  onMessage,
  enabled = true,
}: UseSessionSocketOptions): UseSessionSocketResult {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!sessionId || !enabled) return;

    const channelName = `session-broadcast-${sessionId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on("broadcast", { event: BROADCAST_EVENT }, ({ payload }) => {
        if (payload) onMessageRef.current(payload as WSMessage);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          // Late-joining audience asks the host for the current game state.
          if (role === "audience") {
            channel.send({
              type: "broadcast",
              event: BROADCAST_EVENT,
              payload: { type: SESSION_EVENTS.REQUEST_GAME_STATE },
            });
          }
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      setConnected(false);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId, enabled, role]);

  const sendMessage = useCallback((msg: WSMessage) => {
    const channel = channelRef.current;
    if (!channel) return;

    channel.send({
      type: "broadcast",
      event: BROADCAST_EVENT,
      payload: msg,
    });
  }, []);

  return { sendMessage, connected };
}