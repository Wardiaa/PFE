/**
 * useSessionSocket.ts
 *
 * Real-time session events via Supabase Broadcast channels.
 * Broadcast is a pub/sub layer — it does NOT poll the database,
 * so latency is ~50-100ms regardless of internet speed.
 *
 * Drop-in replacement for a native WebSocket hook.
 * The host broadcasts events; all audience clients receive them instantly.
 *
 * Message types:
 *   SESSION_START   { questionId, questionIndex, timeLimit, startedAt }
 *   QUESTION_CHANGE { questionId, questionIndex, timeLimit, startedAt }
 *   PAUSE           { remainingSeconds }
 *   RESUME          { remainingSeconds, resumedAt }
 *   SESSION_END     {}
 *   RESPONSE_SUBMITTED { participantId, questionId }  (audience → host)
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface WSMessage {
  type: string;
  payload?: Record<string, unknown>;
}

export interface UseSessionSocketOptions {
  sessionId: string | null;
  role: 'host' | 'audience';
  onMessage: (msg: WSMessage) => void;
  enabled?: boolean;
}

export interface UseSessionSocketResult {
  sendMessage: (msg: WSMessage) => void;
  connected: boolean;
}

const BROADCAST_EVENT = 'session-event';

export function useSessionSocket({
  sessionId,
  role,
  onMessage,
  enabled = true,
}: UseSessionSocketOptions): UseSessionSocketResult {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);

  // Keep callback fresh without re-subscribing
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!sessionId || !enabled) return;

    const channelName = `session-broadcast-${sessionId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false }, // host doesn't echo back to itself
      },
    });

    channel
      .on('broadcast', { event: BROADCAST_EVENT }, ({ payload }) => {
        if (payload) {
          onMessageRef.current(payload as WSMessage);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      setConnected(false);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId, enabled]);

  const sendMessage = useCallback((msg: WSMessage) => {
    const channel = channelRef.current;
    if (!channel) return;

    channel.send({
      type: 'broadcast',
      event: BROADCAST_EVENT,
      payload: msg,
    });
  }, []);

  return { sendMessage, connected };
}
