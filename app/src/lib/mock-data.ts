import { useState, useEffect, useCallback } from 'react';
import { type User, type Context, type Participation, MOCK_USERS, MOCK_CONTEXTS, MOCK_PARTICIPATIONS } from './types';

// Re-export types for convenience
export * from './types';

// Simple in-memory storage simulation
let users = [...MOCK_USERS];
let contexts = [...MOCK_CONTEXTS];
let participations = [...MOCK_PARTICIPATIONS];
let currentUser: User | null = MOCK_USERS[0]; // Default logged in as Alice

export function useAuth() {
  const [user, setUser] = useState<User | null>(currentUser);

  const login = useCallback((email: string) => {
    // Mock login
    const found = users.find(u => u.email === email);
    if (found) {
      currentUser = found;
      setUser(found);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    currentUser = null;
    setUser(null);
  }, []);

  const signup = useCallback((name: string, email: string) => {
    const newUser: User = {
      id: `u${users.length + 1}`,
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      role: 'USER',
      createdAt: new Date().toISOString(),
    };
    users = [...users, newUser];
    currentUser = newUser;
    setUser(newUser);
  }, []);

  return { user, login, logout, signup };
}

export function useContexts() {
  const [data, setData] = useState<Context[]>(contexts);

  const refresh = () => setData([...contexts]);

  const createContext = (newContext: Omit<Context, 'id' | 'createdAt' | 'participantsCount' | 'status'>) => {
    const context: Context = {
      ...newContext,
      id: `c${contexts.length + 1}`,
      createdAt: new Date().toISOString(),
      participantsCount: 0,
      status: 'DRAFT',
    };
    contexts = [...contexts, context];
    refresh();
    return context;
  };

  const updateContext = (id: string, updates: Partial<Context>) => {
    contexts = contexts.map(c => c.id === id ? { ...c, ...updates } : c);
    refresh();
  };

  const deleteContext = (id: string) => {
    contexts = contexts.filter(c => c.id !== id);
    refresh();
  };
  
  const getContext = (id: string) => contexts.find(c => c.id === id);
  const getContextByCode = (code: string) => contexts.find(c => c.code === code);

  return { contexts: data, createContext, updateContext, deleteContext, getContext, getContextByCode };
}

export function useParticipation(contextId?: string) {
  const [contextParticipations, setContextParticipations] = useState<Participation[]>([]);

  useEffect(() => {
    if (contextId) {
      setContextParticipations(participations.filter(p => p.contextId === contextId));
    }
  }, [contextId]);

  const joinContext = (contextId: string, userName: string, userId?: string) => {
    const newParticipation: Participation = {
      id: `p${participations.length + 1}`,
      contextId,
      userId: userId || `guest-${Date.now()}`,
      userName,
      answers: {},
      score: 0,
      joinedAt: new Date().toISOString(),
    };
    participations = [...participations, newParticipation];
    
    // Update participant count
    contexts = contexts.map(c => 
      c.id === contextId 
        ? { ...c, participantsCount: c.participantsCount + 1 } 
        : c
    );
    
    return newParticipation;
  };

  const submitAnswer = (participationId: string, questionId: string, answer: any) => {
    participations = participations.map(p => 
      p.id === participationId 
        ? { ...p, answers: { ...p.answers, [questionId]: answer } }
        : p
    );
    if (contextId) {
      setContextParticipations(participations.filter(p => p.contextId === contextId));
    }
  };

  return { participations: contextParticipations, joinContext, submitAnswer };
}
