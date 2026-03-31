// src/lib/useContexts.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export type ContextType = 'QUIZ' | 'VOTE' | 'POLL' | 'GAME';
export type ContextStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export interface DisplayContext {
  id: string;
  title: string;
  description?: string;
  type: ContextType;
  creatorId: string;
  status: ContextStatus;
  code: string;
  coverImage?: string;
  createdAt: string;
  updatedAt?: string;
  participantsCount: number;
  questionCount: number;
  sessionCount: number;
  lastModified: string;
  displayStatus: 'published' | 'draft';
}

function mapContext(row: any): DisplayContext {
  const questions = row.questions ?? [];
  const sessions = row.sessions ?? [];
  const participantsCount = sessions.reduce(
    (sum: number, s: any) => sum + (s.participant_count ?? 0),
    0
  );
  const status: ContextStatus = row.status;
  const displayStatus: 'published' | 'draft' =
    status === 'ACTIVE' || status === 'CLOSED' ? 'published' : 'draft';

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    type: row.type as ContextType,
    creatorId: row.creator_id,
    status,
    code: row.code,
    coverImage: row.cover_image ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    participantsCount,
    questionCount: questions.length,
    sessionCount: sessions.length,
    lastModified: row.updated_at ?? row.created_at,
    displayStatus,
  };
}

export function useContexts(userId: string | null) {
  const [contexts, setContexts] = useState<DisplayContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContexts = useCallback(async () => {
    if (!userId) {
      setContexts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('contexts')
      .select(
        `
        *,
        questions(id),
        sessions(id, participant_count)
      `
      )
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setContexts([]);
    } else {
      setContexts((data ?? []).map(mapContext));
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchContexts();
  }, [fetchContexts]);

  const deleteContext = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('contexts')
      .delete()
      .eq('id', id);

    if (!deleteError) {
      setContexts((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return { contexts, loading, error, deleteContext, refetch: fetchContexts };
}
