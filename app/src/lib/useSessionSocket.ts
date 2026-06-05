// src/lib/useSessionSocket.ts
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
 *   WINNER_REVEAL      { winner }         ← broadcast when host clicks "Show Winner"
 *   FORCE_QUESTION_CLOSE {}               ← for no‑timer questions, host forces round end
 *   GAME_OVER          {}                 ← all players eliminated; no winner this session
 *
 * Speed Question + Final Round message types:
 *   SPEED_QUESTION_RESULTS  { advancingParticipantIds, eliminatedCount }
 *   FINAL_ROUND_DECISION    { decisionTimer }
 *   FINAL_ROUND_DECISION_RESPONSE { participantId, choseContinue }
 *   FINAL_ROUND_START       { questionId, timeLimit }
 *   FINAL_ROUND_RESULTS     { winner }
 *
 * Session Connection & Restoration message types:
 *   GOODBYE            { participantId, participantName }
 *     ← sent by a participant when their tab closes (beforeunload).
 *       Allows the host to immediately decrement the visible participant count
 *       without waiting for the Supabase connection to time out.
 *       In elimination mode the host should also mark the participant eliminated.
 *   HEARTBEAT          { participantId }
 *     ← sent by each participant every 30 s while connected.
 *       The host can use the absence of heartbeats to detect silent disconnects
 *       (e.g. mobile killed the tab without firing beforeunload). After 90 s of
 *       silence (3 missed heartbeats) the host may eliminate the participant in
 *       elimination mode.
 *   SESSION_RESTORE    { participantId, participantName }
 *     ← sent by a participant after a successful "Welcome back" session restore.
 *       Allows the host to re-add the participant to their online count so the
 *       display reflects the true number of connected participants.
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
  // Hunt Arena
  PLAYER_ELIMINATED: "PLAYER_ELIMINATED",
  GAME_STATE_UPDATE: "GAME_STATE_UPDATE",
  GAME_END: "GAME_END",
  ANSWER_RECEIVED: "ANSWER_RECEIVED",
  WINNER_REVEAL: "WINNER_REVEAL",
  // late-joiner support
  REQUEST_GAME_STATE: "REQUEST_GAME_STATE",
  // force round end for no‑timer questions
  FORCE_QUESTION_CLOSE: "FORCE_QUESTION_CLOSE",
  // all players eliminated — no winner
  GAME_OVER: "GAME_OVER",
  // ── NEW: Speed Question + Final Round ────────────────────────────────────
  SPEED_QUESTION_RESULTS: "SPEED_QUESTION_RESULTS",
  FINAL_ROUND_DECISION: "FINAL_ROUND_DECISION",
  FINAL_ROUND_DECISION_RESPONSE: "FINAL_ROUND_DECISION_RESPONSE",
  FINAL_ROUND_START: "FINAL_ROUND_START",
  FINAL_ROUND_RESULTS: "FINAL_ROUND_RESULTS",
  // ── NEW: Session Connection & Restoration ────────────────────────────────
  // Sent by participant on tab close (beforeunload). Host decrements count immediately.
  // In elimination mode the host should treat this as a disconnection-elimination.
  GOODBYE: "GOODBYE",
  // Sent by participant every 30 s. Host uses absence to detect silent disconnects.
  HEARTBEAT: "HEARTBEAT",
  // Sent by participant after a successful "Welcome back" restore. Host re-adds to count.
  SESSION_RESTORE: "SESSION_RESTORE",
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
