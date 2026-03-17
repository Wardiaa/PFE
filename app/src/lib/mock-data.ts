import { useState, useCallback } from 'react';
import { type User, type Context, MOCK_USERS, MOCK_CONTEXTS } from './types';

// Re-export types for convenience
export * from './types';

// Simple in-memory storage simulation
let users = [...MOCK_USERS];
let contexts = [...MOCK_CONTEXTS];
let currentUser: User | null = MOCK_USERS[0]; // Default logged in as Alice

export function useAuth() {
  const [user, setUser] = useState<User | null>(currentUser);

  const login = useCallback((email: string) => {
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

  const createContext = (newContext: Omit<Context, 'id' | 'createdAt' | 'updatedAt' | 'participantsCount' | 'status' | 'code' | 'questions'> & { questions?: Context['questions'] }) => {
    const context: Context = {
      ...newContext,
      id: `c${contexts.length + 1}`,
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participantsCount: 0,
      status: 'DRAFT',
      questions: newContext.questions || [],
      questionCount: 0,
      sessionCount: 0,
    };
    contexts = [...contexts, context];
    refresh();
    return context;
  };

  const updateContext = (id: string, updates: Partial<Context>) => {
    contexts = contexts.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c);
    refresh();
  };

  const deleteContext = (id: string) => {
    contexts = contexts.filter(c => c.id !== id);
    refresh();
  };
  
  const getContext = (id: string) => contexts.find(c => c.id === id);
  const getContextByCode = (code: string) => contexts.find(c => c.code === code);

  return { 
    contexts: data, 
    createContext, 
    updateContext, 
    deleteContext, 
    getContext, 
    getContextByCode 
  };
}