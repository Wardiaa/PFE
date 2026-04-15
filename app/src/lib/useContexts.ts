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
  coverImage?: string | null;
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
    coverImage: row.cover_image ?? null,
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
    try {
      // Step 1: Get all session IDs for this context
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id')
        .eq('context_id', id);

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        throw sessionsError;
      }

      // Step 2: Delete responses for each session
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);
        
        const { error: responsesError } = await supabase
          .from('responses')
          .delete()
          .in('session_id', sessionIds);

        if (responsesError) {
          console.error('Error deleting responses:', responsesError);
          throw responsesError;
        }
      }

      // Step 3: Delete sessions
      const { error: deleteSessionsError } = await supabase
        .from('sessions')
        .delete()
        .eq('context_id', id);

      if (deleteSessionsError) {
        console.error('Error deleting sessions:', deleteSessionsError);
        throw deleteSessionsError;
      }

      // Step 4: Delete questions
      const { error: deleteQuestionsError } = await supabase
        .from('questions')
        .delete()
        .eq('context_id', id);

      if (deleteQuestionsError) {
        console.error('Error deleting questions:', deleteQuestionsError);
        throw deleteQuestionsError;
      }

      // Step 5: Finally delete the context
      const { error: deleteContextError } = await supabase
        .from('contexts')
        .delete()
        .eq('id', id);

      if (deleteContextError) {
        console.error('Error deleting context:', deleteContextError);
        throw deleteContextError;
      }

      // Step 6: Update local state
      setContexts((prev) => prev.filter((c) => c.id !== id));
      
    } catch (err: any) {
      console.error('Delete context failed:', err);
      throw new Error(err.message || 'Failed to delete context');
    }
  };

  return { contexts, loading, error, deleteContext, refetch: fetchContexts };
}