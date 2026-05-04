// useQuizBuilder.ts — COMPLETE FILE WITH 100% Logique INTEGRATION
//
// What changed vs your original:
//  1. ContextData now carries `gameMode` + `themeId` (top-level, not in settings).
//  2. Reducer handles new actions SET_GAME_MODE and SET_THEME_ID.
//  3. INITIAL_STATE / DB load / draft restore / undo/redo all carry them.
//  4. handleTemplateCustomize copies template.gameMode / template.themeId
//     into the working context (so the new "100% Logique" template
//     activates the elimination flow + the game-show theme).
//  5. saveToSupabase persists the new `game_mode` column on contexts and
//     stores `themeId` inside `theme` (existing column — no schema change).
//  6. deriveContextType returns "GAME" for any template whose id contains
//     "logique" or "elimination" so it lands in the right bucket.
//  7. Added handleGameModeChange to allow toggling elimination mode manually.
//
// SCALING additions (drop-in for Scaling question type support):
//  A. DbQuestionType union now includes "SCALING".
//  B. toDbQuestionType maps "scaling" / "SCALING" → "SCALING" instead of
//     falling through to the "MULTIPLE_CHOICE" default.
//  C. toDbQuestion now sends `statements` to the DB on INSERT.
//  D. The UPDATE loop for existing questions also sends `statements`.
//  E. Edit-load mapping reads `statements` back from the DB row.
//
// Everything else is byte-for-byte identical to your original file.

import { useState, useEffect, useCallback, useReducer, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../../../hooks/use-toast";
import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";
import { templates } from "../../../lib/templates";
import { getDefaultQuestion } from "../../../lib/question-types";
import { QUESTION_TYPE_DETAILS } from "../../../lib/question-types";
import type { ContextData, HistoryAction, Question, SessionThemeId } from "../types";
import type { GameMode } from "../../../lib/presentation.types";

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
function historyReducer(
  state: ContextData,
  action: HistoryAction,
): ContextData {
  switch (action.type) {
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload };
    case "SET_TITLE":
      return { ...state, title: action.payload };
    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };
    case "SET_THEME":
      return { ...state, theme: action.payload };
    case "SET_SETTINGS":
      return { ...state, settings: action.payload };
    case "SET_CATEGORY":
      return { ...state, category: action.payload };
    case "SET_TAGS":
      return { ...state, tags: action.payload };
    case "SET_COVER_IMAGE":
      return { ...state, coverImage: action.payload };
    // ── NEW: 100% Logique support ─────────────────────────────────────────
    case "SET_GAME_MODE":
      return { ...state, gameMode: action.payload };
    case "SET_THEME_ID":
      return { ...state, themeId: action.payload };
    case "UPDATE_QUESTION":
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload.id ? { ...q, ...action.payload.updates } : q,
        ),
      };
    case "ADD_QUESTION":
      return { ...state, questions: [...state.questions, action.payload] };
    case "DELETE_QUESTION":
      return {
        ...state,
        questions: state.questions.filter((q) => q.id !== action.payload),
      };
    case "REORDER_QUESTIONS":
      return { ...state, questions: action.payload };
    default:
      return state;
  }
}

const DEFAULT_SETTINGS: ContextData["settings"] = {
  participationMode: "PUBLIC",
  requireAccount: false,
  allowGuest: true,
  allowAnonymous: false,
  maxParticipants: 100,
  timeLimit: 60,
  shuffleQuestions: false,
  showLeaderboard: true,
  showProgress: true,
  allowRetry: false,
  answerValidation: "AUTO",
  soundEffects: true,
  backgroundMusic: "",
  notifications: true,
};

const INITIAL_STATE: ContextData = {
  title: "Untitled Quiz",
  description: "",
  theme: "default",
  category: "",
  tags: [],
  coverImage: null,
  questions: [],
  settings: DEFAULT_SETTINGS,
  // ── NEW ─────────────────────────────────────────────────────────────────
  gameMode: "standard",
  themeId: "default",
};

// ---------------------------------------------------------------------------
// Context type — stored as separate useState to avoid touching existing types
// ---------------------------------------------------------------------------
type SupabaseContextType = "QUIZ" | "POLL" | "VOTE" | "GAME";

function deriveContextType(templateId: string | null): SupabaseContextType {
  if (!templateId) return "QUIZ";
  const lower = templateId.toLowerCase();
  // 100% Logique elimination → GAME bucket
  if (lower.includes("logique") || lower.includes("elimination")) return "GAME";
  if (lower.includes("poll")) return "POLL";
  if (lower.includes("vote")) return "VOTE";
  if (lower.includes("game")) return "GAME";
  return "QUIZ";
}

// ---------------------------------------------------------------------------
// Map local question type strings → DB enum values
// DB enum: MULTIPLE_CHOICE | SINGLE_CHOICE | TRUE_FALSE | OPEN_TEXT |
//          POLL | RATING | WORD_CLOUD | IMAGE_CHOICE | SCALING
// ---------------------------------------------------------------------------
type DbQuestionType =
  | "MULTIPLE_CHOICE"
  | "SINGLE_CHOICE"
  | "TRUE_FALSE"
  | "OPEN_TEXT"
  | "POLL"
  | "RATING"
  | "WORD_CLOUD"
  | "IMAGE_CHOICE"
  // FIX A: add SCALING so the type-system knows it's a valid DB value
  | "SCALING";

function toDbQuestionType(localType: string): DbQuestionType {
  const map: Record<string, DbQuestionType> = {
    MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
    SINGLE_CHOICE: "SINGLE_CHOICE",
    TRUE_FALSE: "TRUE_FALSE",
    OPEN_TEXT: "OPEN_TEXT",
    POLL: "POLL",
    RATING: "RATING",
    WORD_CLOUD: "WORD_CLOUD",
    IMAGE_CHOICE: "IMAGE_CHOICE",
    // FIX B: map scaling (both cases) → SCALING instead of falling through
    // to the "MULTIPLE_CHOICE" default, which caused the wrong type to be
    // saved and the question to render as multiple-choice on edit.
    SCALING: "SCALING",
    scaling: "SCALING",
    // local aliases
    QUIZ: "MULTIPLE_CHOICE",
    OPEN: "OPEN_TEXT",
    "multiple-choice": "MULTIPLE_CHOICE",
    "single-choice": "SINGLE_CHOICE",
    "true-false": "TRUE_FALSE",
    "open-text": "OPEN_TEXT",
    "word-cloud": "WORD_CLOUD",
    "image-choice": "IMAGE_CHOICE",
  };
  return map[localType] ?? "MULTIPLE_CHOICE";
}

// ---------------------------------------------------------------------------
// Map a local Question → DB row for the `questions` table
// There is NO correct_answer column — answers live inside options JSONB
// ---------------------------------------------------------------------------
function toDbQuestion(q: Question, contextId: string, questionOrder: number) {
  return {
    context_id: contextId,
    question_order: questionOrder,
    type: toDbQuestionType(q.type),
    title: q.title,
    description: q.description || null,
    points: q.points ?? 10,
    time_limit: q.timeLimit ?? null,
    locked: q.locked ?? false,
    is_visible: q.isVisible ?? true,
    options: q.options?.length ? q.options : [],
    scale: q.scale ?? null,
    labels: q.labels ?? null,
    display_style: q.displayStyle ?? "numbers",
    image_url: q.imageUrl || null,
    theme: q.theme || null,
    show_results_instantly: q.showResultsInstantly ?? false,
    hide_participant_names: q.hideParticipantNames ?? false,
    // FIX C: persist statements so Scaling questions survive a save/reload
    statements: (q as any).statements ?? null,
  };
}

// ---------------------------------------------------------------------------
// Returns true if the string looks like a real Postgres UUID (from the DB).
// Temp IDs created locally start with "q" followed by digits (e.g. "q1704123456").
// ---------------------------------------------------------------------------
function isDbUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useQuizBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  // Store step in sessionStorage to persist across tab visibility changes
  const getStoredStep = () => {
    const stored = sessionStorage.getItem("quiz-builder-step");
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) return parsed;
    }
    return 1;
  };

  const [step, setStepState] = useState(getStoredStep);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [contextType, setContextType] = useState<SupabaseContextType>("QUIZ");

  // Track the Supabase row ID once a draft has been saved (or when editing).
  // Used to UPDATE rather than INSERT on subsequent saves (no duplicate drafts).
  const [draftContextId, setDraftContextId] = useState<string | null>(null);

  // True while loading an existing context for editing (?edit=<id>)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  // Track if edit has been loaded to prevent resetting step
  const [editLoaded, setEditLoaded] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [showTemplateCustomization, setShowTemplateCustomization] =
    useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"workspace" | "preview">(
    "workspace",
  );
  const [leftPanelTab, setLeftPanelTab] = useState<"types" | "bulk">("types");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [context, dispatch] = useReducer(historyReducer, INITIAL_STATE);
  const [history, setHistory] = useState<ContextData[]>([INITIAL_STATE]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // ── Delete confirmation state ─────────────────────────────────────────────
  const [pendingDeleteQuestion, setPendingDeleteQuestion] =
    useState<Question | null>(null);

  // forceDeleteIds: DB question UUIDs the user confirmed deleting. On save,
  // their responses are deleted first so the FK constraint is satisfied.
  const [forceDeleteIds, setForceDeleteIds] = useState<string[]>([]);

  const showEditingControls = step >= 2;

  // Custom setStep that also persists to sessionStorage
  const setStep = useCallback((newStep: number) => {
    setStepState(newStep);
    sessionStorage.setItem("quiz-builder-step", newStep.toString());
  }, []);

  // ── Load existing context for editing (?edit=<id>) ───────────────────────
  const editId = searchParams.get("edit");

  useEffect(() => {
    if (editId && !editLoaded) {
      sessionStorage.removeItem("quiz-builder-step");
    }
  }, [editId, editLoaded]);

  useEffect(() => {
    if (!editId) return;
    if (!user) return;
    if (editLoaded) return;

    setIsLoadingEdit(true);

    (async () => {
      try {
        const { data: ctx, error: ctxError } = await supabase
          .from("contexts")
          .select("*")
          .eq("id", editId)
          .single();

        if (ctxError || !ctx) {
          throw new Error(ctxError?.message ?? "Context not found.");
        }

        const { data: questions, error: qError } = await supabase
          .from("questions")
          .select("*")
          .eq("context_id", editId)
          .order("question_order", { ascending: true });

        if (qError) throw new Error(qError.message);

        dispatch({ type: "SET_TITLE", payload: ctx.title || "" });
        dispatch({ type: "SET_DESCRIPTION", payload: ctx.description || "" });
        dispatch({ type: "SET_THEME", payload: ctx.theme || "default" });
        dispatch({ type: "SET_CATEGORY", payload: ctx.category || "" });
        dispatch({ type: "SET_TAGS", payload: ctx.tags || [] });
        dispatch({ type: "SET_COVER_IMAGE", payload: ctx.cover_image || null });
        if (ctx.settings) {
          dispatch({ type: "SET_SETTINGS", payload: ctx.settings });
        }

        // ── NEW: hydrate gameMode + themeId from DB ───────────────────────
        // game_mode is a real DB column (added by the migration).
        // themeId is stored in the existing `theme` column for portability.
        const dbGameMode =
          (ctx as any).game_mode === "elimination" ? "elimination" : "standard";
        dispatch({ type: "SET_GAME_MODE", payload: dbGameMode });
        dispatch({
          type: "SET_THEME_ID",
          payload: (ctx as any).theme || "default",
        });

        // Map DB question rows → local Question shape, keeping the real DB UUID as id
        const localQuestions: Question[] = (questions ?? []).map((q: any) => ({
          id: q.id,
          type: q.type,
          title: q.title,
          // Question.text is required by the local type. The DB stores the
          // prompt in `title`, so mirror it into `text` for the editor.
          text: q.title ?? "",
          description: q.description || "",
          options: q.options ?? [],
          points: q.points ?? 10,
          timeLimit: q.time_limit ?? null,
          isVisible: q.is_visible ?? true,
          locked: q.locked ?? false,
          imageUrl: q.image_url || null,
          scale: q.scale || undefined,
          labels: q.labels || undefined,
          displayStyle: q.display_style || "numbers",
          theme: q.theme || undefined,
          showResultsInstantly: q.show_results_instantly ?? false,
          hideParticipantNames: q.hide_participant_names ?? false,
          // FIX E: restore statements so Scaling questions load correctly in the editor
          statements: q.statements ?? undefined,
        }));
        dispatch({ type: "SET_QUESTIONS", payload: localQuestions });

        setContextType(ctx.type as SupabaseContextType);
        setDraftContextId(editId);

        const loadedState: ContextData = {
          title: ctx.title || "",
          description: ctx.description || "",
          theme: ctx.theme || "default",
          category: ctx.category || "",
          tags: ctx.tags || [],
          coverImage: ctx.cover_image || null,
          questions: localQuestions,
          settings: ctx.settings || DEFAULT_SETTINGS,
          gameMode: dbGameMode,
          themeId: (ctx as any).theme || "default",
        };
        setHistory([loadedState]);
        setHistoryIndex(0);

        setStep(2);
        setEditLoaded(true);
      } catch (err: any) {
        console.error("Failed to load context for editing:", err);
        toast({
          title: "Could not load context",
          description: err.message ?? "Something went wrong.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingEdit(false);
      }
    })();
  }, [user, editId, editLoaded, setStep, toast]);

  // ── Restore local draft on mount (skipped when editing an existing context) ──
  useEffect(() => {
    if (editId) return;

    const draft = localStorage.getItem("quiz-draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        dispatch({
          type: "SET_TITLE",
          payload: parsed.title || "Untitled Quiz",
        });
        dispatch({
          type: "SET_DESCRIPTION",
          payload: parsed.description || "",
        });
        dispatch({ type: "SET_THEME", payload: parsed.theme || "default" });
        dispatch({ type: "SET_QUESTIONS", payload: parsed.questions || [] });
        dispatch({
          type: "SET_SETTINGS",
          payload: parsed.settings || DEFAULT_SETTINGS,
        });
        dispatch({ type: "SET_CATEGORY", payload: parsed.category || "" });
        dispatch({ type: "SET_TAGS", payload: parsed.tags || [] });
        dispatch({
          type: "SET_COVER_IMAGE",
          payload: parsed.coverImage || null,
        });
        // ── NEW ─────────────────────────────────────────────────────────────
        if (parsed.gameMode) {
          dispatch({ type: "SET_GAME_MODE", payload: parsed.gameMode });
        }
        if (parsed.themeId) {
          dispatch({ type: "SET_THEME_ID", payload: parsed.themeId });
        }
        if (parsed.contextType) setContextType(parsed.contextType);
        toast({
          title: "Draft restored",
          description: "Your unsaved changes have been restored",
        });
      } catch (error) {
        console.error("Failed to restore draft:", error);
      }
    }
  }, [editId, toast]);

  // ── Auto-save to localStorage every 30 s ──────────────────────────────────
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const interval = setInterval(() => saveToLocalStorage(), 30000);
    return () => clearInterval(interval);
  }, [hasUnsavedChanges, context]);

  const markUnsaved = useCallback(() => {
    if (!hasUnsavedChanges) setHasUnsavedChanges(true);
  }, [hasUnsavedChanges]);

  const saveToLocalStorage = useCallback(() => {
    if (!hasUnsavedChanges) return;
    setSaveStatus("saving");
    setTimeout(() => {
      localStorage.setItem(
        "quiz-draft",
        JSON.stringify({ ...context, contextType }),
      );
      setLastSaved(new Date());
      setSaveStatus("saved");
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 500);
  }, [context, contextType, hasUnsavedChanges]);

  const handleManualSave = () => {
    saveToLocalStorage();
    toast({
      title: "Progress saved",
      description: "Your changes have been saved locally",
    });
  };

  // FIX: Accept an optional explicit snapshot so callers that already know the
  // next state (e.g. after dispatch) can pass it in, avoiding a stale-closure
  // capture of `context` before the reducer has flushed the update.
  const addToHistory = useCallback(
    (_actionType: string, snapshot?: ContextData) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(snapshot ? { ...snapshot } : { ...context });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      markUnsaved();
    },
    [context, history, historyIndex, markUnsaved],
  );

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      dispatch({ type: "SET_QUESTIONS", payload: prev.questions });
      dispatch({ type: "SET_TITLE", payload: prev.title });
      dispatch({ type: "SET_DESCRIPTION", payload: prev.description });
      dispatch({ type: "SET_THEME", payload: prev.theme });
      dispatch({ type: "SET_SETTINGS", payload: prev.settings });
      dispatch({ type: "SET_CATEGORY", payload: prev.category });
      dispatch({ type: "SET_TAGS", payload: prev.tags });
      dispatch({ type: "SET_COVER_IMAGE", payload: prev.coverImage || null });
      // ── NEW ─────────────────────────────────────────────────────────────
      dispatch({ type: "SET_GAME_MODE", payload: prev.gameMode ?? "standard" });
      dispatch({ type: "SET_THEME_ID", payload: prev.themeId ?? "default" });
      setHistoryIndex(historyIndex - 1);
      toast({
        title: "Undo",
        description: "Last action undone",
        duration: 1500,
      });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      dispatch({ type: "SET_QUESTIONS", payload: next.questions });
      dispatch({ type: "SET_TITLE", payload: next.title });
      dispatch({ type: "SET_DESCRIPTION", payload: next.description });
      dispatch({ type: "SET_THEME", payload: next.theme });
      dispatch({ type: "SET_SETTINGS", payload: next.settings });
      dispatch({ type: "SET_CATEGORY", payload: next.category });
      dispatch({ type: "SET_TAGS", payload: next.tags });
      dispatch({ type: "SET_COVER_IMAGE", payload: next.coverImage || null });
      // ── NEW ─────────────────────────────────────────────────────────────
      dispatch({ type: "SET_GAME_MODE", payload: next.gameMode ?? "standard" });
      dispatch({ type: "SET_THEME_ID", payload: next.themeId ?? "default" });
      setHistoryIndex(historyIndex + 1);
      toast({ title: "Redo", description: "Action restored", duration: 1500 });
    }
  };

  // FIX: Use refs so the keyboard event listener always calls the current
  // version of each handler — prevents stale closures over `context` when
  // Ctrl+S, Ctrl+Z, or Ctrl+Y is pressed after a mutation (e.g. delete).
  const handleBackgroundSaveRef = useRef<(() => Promise<void>) | undefined>(
    undefined,
  );
  const handleUndoRef = useRef<(() => void) | undefined>(undefined);
  const handleRedoRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showEditingControls) {
        if ((e.ctrlKey || e.metaKey) && e.key === "z") {
          e.preventDefault();
          handleUndoRef.current?.();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "y") {
          e.preventDefault();
          handleRedoRef.current?.();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          handleBackgroundSaveRef.current?.();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showEditingControls]);

  // ── Question helpers ───────────────────────────────────────────────────────
  const addQuestion = (type: string) => {
    const typeInfo = QUESTION_TYPE_DETAILS.find((t) => t.uiId === type);
    if (typeInfo && !typeInfo.available) {
      toast({
        title: "Coming Soon",
        description: `"${typeInfo.name}" will be available soon!`,
        variant: "destructive",
      });
      return;
    }
    const raw = getDefaultQuestion(type, `q${Date.now()}`);
    // The local Question type requires `text`. getDefaultQuestion only sets
    // `title`, so mirror it here to keep TS happy and the editor in sync.
    const newQuestion: Question = {
      ...(raw as any),
      text: (raw as any).text ?? (raw as any).title ?? "",
    };
    dispatch({ type: "ADD_QUESTION", payload: newQuestion });
    setCurrentQuestionIndex(context.questions.length);
    setSelectedQuestions([]);
    addToHistory(`Add ${type.replace("-", " ")} question`, {
      ...context,
      questions: [...context.questions, newQuestion],
    });
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    dispatch({ type: "UPDATE_QUESTION", payload: { id, updates } });
    addToHistory("Update question", {
      ...context,
      questions: context.questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q,
      ),
    });
  };

  // ── Delete with confirmation ───────────────────────────────────────────────
  const deleteQuestion = (id: string) => {
    const question = context.questions.find((q) => q.id === id);
    if (question) setPendingDeleteQuestion(question);
  };

  const handleDeleteCurrentQuestion = () => {
    if (
      currentQuestionIndex >= 0 &&
      context.questions[currentQuestionIndex]
    ) {
      setPendingDeleteQuestion(context.questions[currentQuestionIndex]);
    }
  };

  const confirmDeleteQuestion = useCallback(() => {
    if (!pendingDeleteQuestion) return;
    const q = pendingDeleteQuestion;
    const newQ = context.questions.filter((qi) => qi.id !== q.id);

    dispatch({ type: "SET_QUESTIONS", payload: newQ });

    if (isDbUUID(q.id)) {
      setForceDeleteIds((prev) =>
        prev.includes(q.id) ? prev : [...prev, q.id],
      );
    }

    if (context.questions[currentQuestionIndex]?.id === q.id) {
      setCurrentQuestionIndex(Math.max(0, newQ.length - 1));
    }
    setSelectedQuestions((prev) =>
      prev.filter((i) => context.questions[i]?.id !== q.id),
    );

    addToHistory("Delete question", { ...context, questions: newQ });

    setPendingDeleteQuestion(null);
    toast({
      title: "Question deleted",
      description: "Question has been removed",
      duration: 1500,
    });
  }, [
    pendingDeleteQuestion,
    context,
    currentQuestionIndex,
    addToHistory,
    toast,
  ]);

  const cancelDeleteQuestion = useCallback(() => {
    setPendingDeleteQuestion(null);
  }, []);

  // ── Field change handlers ──────────────────────────────────────────────────
  const handleTitleChange = (value: string) => {
    dispatch({ type: "SET_TITLE", payload: value });
    markUnsaved();
  };
  const handleDescriptionChange = (value: string) => {
    dispatch({ type: "SET_DESCRIPTION", payload: value });
    markUnsaved();
  };
  const handleThemeChange = (value: string) => {
    dispatch({ type: "SET_THEME", payload: value });
    // Keep themeId in sync with the underlying `theme` field — the live
    // session reads `themeId` to know which CSS class to apply.
    dispatch({ type: "SET_THEME_ID", payload: value });
    markUnsaved();
  };
  const handleCategoryChange = (value: string) => {
    dispatch({ type: "SET_CATEGORY", payload: value });
    markUnsaved();
  };
  const handleTagsChange = (tags: string[]) => {
    dispatch({ type: "SET_TAGS", payload: tags });
    markUnsaved();
  };
  const handleCoverImageChange = (imageUrl: string | null) => {
    dispatch({ type: "SET_COVER_IMAGE", payload: imageUrl });
    markUnsaved();
  };
  const handleSettingsChange = (updates: any) => {
    dispatch({
      type: "SET_SETTINGS",
      payload: { ...context.settings, ...updates },
    });
    markUnsaved();
  };

  // ── NEW: Manual game mode toggle ─────────────────────────────────────────
  const handleGameModeChange = (mode: "standard" | "elimination") => {
    dispatch({ type: "SET_GAME_MODE", payload: mode });
    // FIX: dispatch SET_THEME alongside SET_THEME_ID so the value is reliably
    // written to the DB. saveToSupabase uses:
    //   const persistedTheme = context.themeId || context.theme || "default"
    // Without SET_THEME, context.theme stayed "default" for non-CPL contexts
    // set to elimination mode, and the audience page never got cpl-theme CSS
    // variables (white background / missing colours bug).
    const derivedThemeId = mode === "elimination" ? "cent-pour-cent-logique" : "default";
    dispatch({ type: "SET_THEME_ID", payload: derivedThemeId });
    dispatch({ type: "SET_THEME", payload: derivedThemeId });
    markUnsaved();
  };

  // ── Template helpers ───────────────────────────────────────────────────────
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setSelectedTemplate(templateId);
    setContextType(deriveContextType(templateId));

    if (templateId !== "custom-blank") {
      setShowTemplateCustomization(true);
    } else {
      handleTitleChange("Untitled Context");
      dispatch({ type: "SET_QUESTIONS", payload: [] });
      // Blank canvas → make sure we're back on standard mode + default theme
      dispatch({ type: "SET_GAME_MODE", payload: "standard" });
      dispatch({ type: "SET_THEME_ID", payload: "default" });
      dispatch({ type: "SET_THEME", payload: "default" });
      setStep(2);
      toast({
        title: "Blank canvas selected",
        description: "Start creating from scratch!",
      });
    }
  };

  const handleTemplateCustomize = (options: any) => {
    const template = templates.find((t) => t.id === selectedTemplate) as any;
    if (!template) return;
    handleTitleChange(options.customTitle || template.name);
    dispatch({
      type: "SET_QUESTIONS",
      payload:
        options.includeQuestions && template.questions
          ? JSON.parse(JSON.stringify(template.questions))
          : [],
    });
    if (options.includeSettings && template.settings)
      handleSettingsChange(template.settings);

    // ── NEW: propagate gameMode + themeId from the template ───────────────
    const tplGameMode =
      template.gameMode === "elimination" ? "elimination" : "standard";
    const tplThemeId = template.themeId ?? "default";
    dispatch({ type: "SET_GAME_MODE", payload: tplGameMode });
    dispatch({ type: "SET_THEME_ID", payload: tplThemeId });
    // Keep the legacy `theme` field aligned so existing code still works.
    dispatch({ type: "SET_THEME", payload: tplThemeId });

    setStep(2);
    toast({
      title: "Template customized",
      description: "Let's continue editing!",
    });
  };

  // ── Core Supabase upsert ──────────────────────────────────────────────────
  async function saveToSupabase(status: "ACTIVE" | "DRAFT"): Promise<string> {
    if (!user) throw new Error("You must be signed in to save.");

    // Resolve the values we'll persist for game mode + theme. The new
    // `game_mode` column was added by the DB migration; theme stays in the
    // existing `theme` column so we don't need a second new column.
    const persistedGameMode: "standard" | "elimination" =
      context.gameMode === "elimination" ? "elimination" : "standard";
    const persistedTheme = context.themeId || context.theme || "default";

    // ── UPDATE existing context ────────────────────────────────────────────
    if (draftContextId) {
      const { error: ctxError } = await supabase
        .from("contexts")
        .update({
          title: context.title.trim(),
          description: context.description.trim() || null,
          type: contextType,
          status,
          theme: persistedTheme,
          category: context.category || null,
          tags: context.tags ?? [],
          settings: context.settings,
          cover_image: context.coverImage || null,
          // ── NEW DB column from the migration ────────────────────────────
          game_mode: persistedGameMode,
        })
        .eq("id", draftContextId);

      if (ctxError) throw new Error(ctxError.message);

      const localQuestions = context.questions;

      // Split questions: ones with real DB UUIDs vs. newly created (temp IDs)
      const existingDbQuestions = localQuestions.filter((q) => isDbUUID(q.id));
      const newLocalQuestions = localQuestions.filter((q) => !isDbUUID(q.id));
      const currentDbIds = new Set(existingDbQuestions.map((q) => q.id));

      // 1. UPDATE existing questions in-place (their IDs are preserved → responses remain valid)
      for (let i = 0; i < existingDbQuestions.length; i++) {
        const q = existingDbQuestions[i];
        const { error } = await supabase
          .from("questions")
          .update({
            question_order: localQuestions.indexOf(q),
            type: toDbQuestionType(q.type),
            title: q.title,
            description: q.description || null,
            points: q.points ?? 10,
            time_limit: q.timeLimit ?? null,
            locked: q.locked ?? false,
            is_visible: q.isVisible ?? true,
            options: q.options?.length ? q.options : [],
            scale: q.scale ?? null,
            labels: q.labels ?? null,
            display_style: q.displayStyle ?? "numbers",
            image_url: q.imageUrl || null,
            theme: q.theme || null,
            show_results_instantly: q.showResultsInstantly ?? false,
            hide_participant_names: q.hideParticipantNames ?? false,
            // FIX D: send statements on UPDATE so edits to Scaling questions are saved
            statements: (q as any).statements ?? null,
          })
          .eq("id", q.id);
        if (error) throw new Error(error.message);
      }

      // 2. INSERT new questions and patch local state with real DB IDs
      if (newLocalQuestions.length > 0) {
        const { data: inserted, error: insertErr } = await supabase
          .from("questions")
          .insert(
            newLocalQuestions.map((q) =>
              toDbQuestion(q, draftContextId, localQuestions.indexOf(q)),
            ),
          )
          .select("id");

        if (insertErr) throw new Error(insertErr.message);

        if (inserted && inserted.length === newLocalQuestions.length) {
          const tempIdToReal: Record<string, string> = {};
          newLocalQuestions.forEach((q, i) => {
            if (inserted[i]) tempIdToReal[q.id] = inserted[i].id;
          });
          const patched = localQuestions.map((q) =>
            tempIdToReal[q.id] ? { ...q, id: tempIdToReal[q.id] } : q,
          );
          dispatch({ type: "SET_QUESTIONS", payload: patched });
          patched
            .filter((q) => isDbUUID(q.id))
            .forEach((q) => currentDbIds.add(q.id));
        }
      }

      // 3. Find questions that were removed in the editor
      const { data: dbRows, error: fetchErr } = await supabase
        .from("questions")
        .select("id")
        .eq("context_id", draftContextId);

      if (fetchErr) throw new Error(fetchErr.message);

      const allDbIds = (dbRows ?? []).map((r: any) => r.id as string);
      const removedIds = allDbIds.filter((id) => !currentDbIds.has(id));

      const allIdsToDelete = [...new Set([...removedIds, ...forceDeleteIds])];

      if (allIdsToDelete.length > 0) {
        const { error: respDelErr } = await supabase
          .from("responses")
          .delete()
          .in("question_id", allIdsToDelete);

        if (respDelErr) throw new Error(respDelErr.message);

        const { error: delErr } = await supabase
          .from("questions")
          .delete()
          .in("id", allIdsToDelete);

        if (delErr) throw new Error(delErr.message);

        setForceDeleteIds([]);
      }

      return draftContextId;
    }

    // ── INSERT new row ────────────────────────────────────────────────────
    const { data: contextRow, error: ctxError } = await supabase
      .from("contexts")
      .insert({
        title: context.title.trim(),
        description: context.description.trim() || null,
        type: contextType,
        status,
        creator_id: user.id,
        theme: persistedTheme,
        category: context.category || null,
        tags: context.tags ?? [],
        settings: context.settings,
        cover_image: context.coverImage || null,
        // ── NEW DB column from the migration ──────────────────────────────
        game_mode: persistedGameMode,
      })
      .select("id")
      .single();

    if (ctxError || !contextRow) {
      throw new Error(ctxError?.message ?? "Failed to create context.");
    }

    const contextId = contextRow.id as string;
    setDraftContextId(contextId);

    if (context.questions.length > 0) {
      const { data: inserted, error: qError } = await supabase
        .from("questions")
        .insert(context.questions.map((q, i) => toDbQuestion(q, contextId, i)))
        .select("id");

      if (qError) {
        await supabase.from("contexts").delete().eq("id", contextId);
        setDraftContextId(null);
        throw new Error(qError.message);
      }

      if (inserted && inserted.length === context.questions.length) {
        const patched = context.questions.map((q, i) =>
          inserted[i] ? { ...q, id: inserted[i].id } : q,
        );
        dispatch({ type: "SET_QUESTIONS", payload: patched });
      }
    }

    return contextId;
  }

  // ── Background save — header button (steps 2-4) ───────────────────────────
  const handleBackgroundSave = async () => {
    if (!context.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaveStatus("saving");
    try {
      await saveToSupabase("DRAFT");
      localStorage.removeItem("quiz-draft");
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err: any) {
      console.error("Background save error:", err);
      setSaveStatus("idle");
      toast({
        title: "Save failed",
        description: err.message ?? "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  // Keep the refs current so the keyboard shortcut always calls the latest version
  handleBackgroundSaveRef.current = handleBackgroundSave;
  handleUndoRef.current = handleUndo;
  handleRedoRef.current = handleRedo;

  // ── Publish (status = ACTIVE) — Step 5 ───────────────────────────────────
  const handleCreate = async () => {
    if (!context.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your context",
        variant: "destructive",
      });
      return;
    }
    if (context.questions.length === 0) {
      toast({
        title: "No questions",
        description: "Add at least one question to your quiz",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      await saveToSupabase("ACTIVE");
      localStorage.removeItem("quiz-draft");
      sessionStorage.removeItem("quiz-builder-step");
      toast({
        title: "Published!",
        description: `"${context.title}" is now live.`,
      });
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Publish error:", err);
      toast({
        title: "Publish failed",
        description: err.message ?? "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // ── Save Draft — Step 5 button (redirects to dashboard) ──────────────────
  const handleSaveDraft = async () => {
    if (!context.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title before saving a draft.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDraft(true);
    try {
      await saveToSupabase("DRAFT");
      localStorage.removeItem("quiz-draft");
      sessionStorage.removeItem("quiz-builder-step");
      toast({
        title: "Draft saved",
        description: `"${context.title}" saved to your dashboard.`,
      });
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Save draft error:", err);
      toast({
        title: "Save failed",
        description: err.message ?? "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleQuestionSelection = (index: number) => {
    setSelectedQuestions((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleSelectAllQuestions = () =>
    setSelectedQuestions(context.questions.map((_, i) => i));
  const handleClearSelection = () => setSelectedQuestions([]);

  const handleBulkUpdate = (updatedQuestions: Question[]) => {
    dispatch({ type: "SET_QUESTIONS", payload: updatedQuestions });
    setSelectedQuestions([]);
    addToHistory("Bulk update questions", {
      ...context,
      questions: updatedQuestions,
    });
  };

  const handleDuplicateCurrentQuestion = () => {
    if (currentQuestionIndex >= 0 && context.questions[currentQuestionIndex]) {
      const current = context.questions[currentQuestionIndex];
      const duplicate: Question = {
        ...current,
        id: `q${Date.now()}`,
        title: `${current.title} (Copy)`,
      };
      const newQuestions = [...context.questions];
      newQuestions.splice(currentQuestionIndex + 1, 0, duplicate);
      dispatch({ type: "SET_QUESTIONS", payload: newQuestions });
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      addToHistory("Duplicate question", {
        ...context,
        questions: newQuestions,
      });
    }
  };

  const handleShuffleAnswers = () => {
    if (currentQuestionIndex >= 0) {
      const question = context.questions[currentQuestionIndex];
      if (question.options) {
        const shuffledOptions = [...question.options].sort(
          () => Math.random() - 0.5,
        );
        updateQuestion(question.id, { options: shuffledOptions });
      }
    }
  };

  const handleReorderQuestions = (
    direction: "up" | "down" | "top" | "bottom",
  ) => {
    if (selectedQuestions.length === 0) return;
    const updatedQuestions = [...context.questions];
    const sortedSelected = [...selectedQuestions].sort((a, b) => a - b);

    if (direction === "up" || direction === "top") {
      for (let i = 0; i < sortedSelected.length; i++) {
        const currentIndex = updatedQuestions.findIndex(
          (_, idx) => idx === sortedSelected[i],
        );
        if (currentIndex === -1) continue;
        const [question] = updatedQuestions.splice(currentIndex, 1);
        const newIndex = direction === "up" ? Math.max(0, currentIndex - 1) : 0;
        updatedQuestions.splice(newIndex, 0, question);
      }
    } else {
      for (let i = sortedSelected.length - 1; i >= 0; i--) {
        const currentIndex = updatedQuestions.findIndex(
          (_, idx) => idx === sortedSelected[i],
        );
        if (currentIndex === -1) continue;
        const [question] = updatedQuestions.splice(currentIndex, 1);
        const newIndex =
          direction === "down"
            ? Math.min(updatedQuestions.length, currentIndex)
            : updatedQuestions.length;
        updatedQuestions.splice(newIndex, 0, question);
      }
    }

    dispatch({ type: "SET_QUESTIONS", payload: updatedQuestions });
    addToHistory("Reorder questions", {
      ...context,
      questions: updatedQuestions,
    });
  };

  const handleQuickAction = (action: string) => {
    if (action === "export-json") {
      const data = JSON.stringify(context.questions, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "questions.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "Questions exported as JSON" });
    }
  };

  return {
    step,
    setStep,
    selectedTemplate,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    selectedQuestions,
    showTemplateCustomization,
    setShowTemplateCustomization,
    lastSaved,
    saveStatus,
    hasUnsavedChanges,
    activeDragId,
    setActiveDragId,
    activeTab,
    setActiveTab,
    leftPanelTab,
    setLeftPanelTab,
    context,
    history,
    historyIndex,
    isPublishing,
    isSavingDraft,
    isLoadingEdit,
    isEditMode: !!editId,

    // Delete confirmation
    pendingDeleteQuestion,
    confirmDeleteQuestion,
    cancelDeleteQuestion,

    // Actions
    addQuestion,
    updateQuestion,
    deleteQuestion,
    handleTitleChange,
    handleDescriptionChange,
    handleThemeChange,
    handleCategoryChange,
    handleTagsChange,
    handleCoverImageChange,
    handleSettingsChange,
    handleGameModeChange,
    toggleQuestionSelection,
    handleTemplateSelect,
    handleTemplateCustomize,
    handleCreate,
    handleSaveDraft,
    handleBackgroundSave,
    handleSelectAllQuestions,
    handleClearSelection,
    handleBulkUpdate,
    handleDuplicateCurrentQuestion,
    handleDeleteCurrentQuestion,
    handleShuffleAnswers,
    handleReorderQuestions,
    handleQuickAction,
    handleManualSave,
    handleUndo,
    handleRedo,
  };
}
