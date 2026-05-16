// useQuizBuilder.ts — COMPLETE FILE WITH RANKING + SCALING + GRID 2x2 + VOTE + 100% Logique INTEGRATION
// MODE SELECTION UPDATE: Added showModeSelection state, updated handleTemplateSelect
// SKIP UPDATE: Added maxSkipsPerParticipant to ContextData and reducer
// SPEED QUESTION UPDATE: Added isSpeedQuestion, speedMaxAdvance, finalRoundDecisionTimer
// GRID 2x2 & VOTE: Added support for grid-2x2 and vote question types

import { useState, useEffect, useCallback, useReducer, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../../../hooks/use-toast";
import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";
import { templates } from "../../../lib/templates";
import { getDefaultQuestion } from "../../../lib/question-types";
import { QUESTION_TYPE_DETAILS } from "../../../lib/question-types";
import type { ContextData, HistoryAction, Question } from "../types";

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
function historyReducer(state: ContextData, action: HistoryAction): ContextData {
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
    case "SET_GAME_MODE":
      return { ...state, gameMode: action.payload };
    case "SET_THEME_ID":
      return { ...state, themeId: action.payload };
    case "SET_MAX_SKIPS":
      return { ...state, maxSkipsPerParticipant: action.payload };
    case "SET_FINAL_ROUND_TIMER":
      return { ...state, finalRoundDecisionTimer: action.payload };
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
  gameMode: "standard",
  themeId: "default",
  maxSkipsPerParticipant: 1,
  finalRoundDecisionTimer: 20,
};

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------
type SupabaseContextType = "QUIZ" | "POLL" | "VOTE" | "GAME";

function deriveContextType(templateId: string | null): SupabaseContextType {
  if (!templateId) return "QUIZ";
  const lower = templateId.toLowerCase();
  if (lower.includes("logique") || lower.includes("elimination")) return "GAME";
  if (lower.includes("poll")) return "POLL";
  if (lower.includes("vote")) return "VOTE";
  if (lower.includes("game")) return "GAME";
  return "QUIZ";
}

// ---------------------------------------------------------------------------
// Map local question type strings → DB enum values
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
  | "SCALING"
  | "RANKING"
  | "GRID_2X2"
  | "VOTE";

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
    SCALING: "SCALING",
    scaling: "SCALING",
    RANKING: "RANKING",
    ranking: "RANKING",
    "grid-2x2": "GRID_2X2",
    GRID_2X2: "GRID_2X2",
    vote: "VOTE",
    VOTE: "VOTE",
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
    statements: (q as any).statements ?? null,
    skip_allowed: q.skipAllowed ?? false,
    is_speed_question: q.isSpeedQuestion ?? false,
    speed_max_advance: q.speedMaxAdvance ?? null,
    x_axis: (q as any).xAxis ?? null,
    y_axis: (q as any).yAxis ?? null,
  };
}

// ---------------------------------------------------------------------------
// Returns true if the string looks like a real Postgres UUID
// ---------------------------------------------------------------------------
function isDbUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useQuizBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

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
  const [draftContextId, setDraftContextId] = useState<string | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [editLoaded, setEditLoaded] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [showTemplateCustomization, setShowTemplateCustomization] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"workspace" | "preview">("workspace");
  const [leftPanelTab, setLeftPanelTab] = useState<"types" | "bulk">("types");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(false);

  const [context, dispatch] = useReducer(historyReducer, INITIAL_STATE);
  const [history, setHistory] = useState<ContextData[]>([INITIAL_STATE]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [pendingDeleteQuestion, setPendingDeleteQuestion] = useState<Question | null>(null);
  const [forceDeleteIds, setForceDeleteIds] = useState<string[]>([]);

  const showEditingControls = step >= 2;

  const setStep = useCallback((newStep: number) => {
    setStepState(newStep);
    sessionStorage.setItem("quiz-builder-step", newStep.toString());
  }, []);

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

        const dbGameMode = (ctx as any).game_mode === "elimination" ? "elimination" : "standard";
        dispatch({ type: "SET_GAME_MODE", payload: dbGameMode });
        dispatch({ type: "SET_THEME_ID", payload: (ctx as any).theme || "default" });
        dispatch({ type: "SET_MAX_SKIPS", payload: (ctx as any).max_skips_per_participant ?? 1 });
        dispatch({ type: "SET_FINAL_ROUND_TIMER", payload: (ctx as any).final_round_decision_timer ?? 20 });

        const localQuestions: Question[] = (questions ?? []).map((q: any) => ({
          id: q.id,
          type: q.type,
          title: q.title,
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
          statements: q.statements ?? undefined,
          skipAllowed: q.skip_allowed ?? false,
          isSpeedQuestion: q.is_speed_question ?? false,
          speedMaxAdvance: q.speed_max_advance ?? undefined,
          xAxis: q.x_axis ?? undefined,
          yAxis: q.y_axis ?? undefined,
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
          maxSkipsPerParticipant: (ctx as any).max_skips_per_participant ?? 1,
          finalRoundDecisionTimer: (ctx as any).final_round_decision_timer ?? 20,
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

  useEffect(() => {
    if (editId) return;

    const draft = localStorage.getItem("quiz-draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        dispatch({ type: "SET_TITLE", payload: parsed.title || "Untitled Quiz" });
        dispatch({ type: "SET_DESCRIPTION", payload: parsed.description || "" });
        dispatch({ type: "SET_THEME", payload: parsed.theme || "default" });
        dispatch({ type: "SET_QUESTIONS", payload: parsed.questions || [] });
        dispatch({ type: "SET_SETTINGS", payload: parsed.settings || DEFAULT_SETTINGS });
        dispatch({ type: "SET_CATEGORY", payload: parsed.category || "" });
        dispatch({ type: "SET_TAGS", payload: parsed.tags || [] });
        dispatch({ type: "SET_COVER_IMAGE", payload: parsed.coverImage || null });
        if (parsed.gameMode) {
          dispatch({ type: "SET_GAME_MODE", payload: parsed.gameMode });
        }
        if (parsed.themeId) {
          dispatch({ type: "SET_THEME_ID", payload: parsed.themeId });
        }
        if (parsed.maxSkipsPerParticipant) {
          dispatch({ type: "SET_MAX_SKIPS", payload: parsed.maxSkipsPerParticipant });
        }
        if (parsed.finalRoundDecisionTimer) {
          dispatch({ type: "SET_FINAL_ROUND_TIMER", payload: parsed.finalRoundDecisionTimer });
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
      localStorage.setItem("quiz-draft", JSON.stringify({ ...context, contextType }));
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

  const addToHistory = useCallback((_actionType: string, snapshot?: ContextData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(snapshot ? { ...snapshot } : { ...context });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    markUnsaved();
  }, [context, history, historyIndex, markUnsaved]);

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
      dispatch({ type: "SET_GAME_MODE", payload: prev.gameMode ?? "standard" });
      dispatch({ type: "SET_THEME_ID", payload: prev.themeId ?? "default" });
      dispatch({ type: "SET_MAX_SKIPS", payload: prev.maxSkipsPerParticipant ?? 1 });
      dispatch({ type: "SET_FINAL_ROUND_TIMER", payload: prev.finalRoundDecisionTimer ?? 20 });
      setHistoryIndex(historyIndex - 1);
      toast({ title: "Undo", description: "Last action undone", duration: 1500 });
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
      dispatch({ type: "SET_GAME_MODE", payload: next.gameMode ?? "standard" });
      dispatch({ type: "SET_THEME_ID", payload: next.themeId ?? "default" });
      dispatch({ type: "SET_MAX_SKIPS", payload: next.maxSkipsPerParticipant ?? 1 });
      dispatch({ type: "SET_FINAL_ROUND_TIMER", payload: next.finalRoundDecisionTimer ?? 20 });
      setHistoryIndex(historyIndex + 1);
      toast({ title: "Redo", description: "Action restored", duration: 1500 });
    }
  };

  const handleBackgroundSaveRef = useRef<(() => Promise<void>) | undefined>(undefined);
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
    const newQuestion: Question = {
      ...(raw as any),
      text: (raw as any).text ?? (raw as any).title ?? "",
      skipAllowed: false,
      isSpeedQuestion: false,
      speedMaxAdvance: undefined,
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

  const deleteQuestion = (id: string) => {
    const question = context.questions.find((q) => q.id === id);
    if (question) setPendingDeleteQuestion(question);
  };

  const handleDeleteCurrentQuestion = () => {
    if (currentQuestionIndex >= 0 && context.questions[currentQuestionIndex]) {
      setPendingDeleteQuestion(context.questions[currentQuestionIndex]);
    }
  };

  const confirmDeleteQuestion = useCallback(() => {
    if (!pendingDeleteQuestion) return;
    const q = pendingDeleteQuestion;
    const newQ = context.questions.filter((qi) => qi.id !== q.id);

    dispatch({ type: "SET_QUESTIONS", payload: newQ });

    if (isDbUUID(q.id)) {
      setForceDeleteIds((prev) => (prev.includes(q.id) ? prev : [...prev, q.id]));
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
  }, [pendingDeleteQuestion, context, currentQuestionIndex, addToHistory, toast]);

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

  const handleGameModeChange = (mode: "standard" | "elimination") => {
    dispatch({ type: "SET_GAME_MODE", payload: mode });
    const derivedThemeId = mode === "elimination" ? "cent-pour-cent-logique" : "default";
    dispatch({ type: "SET_THEME_ID", payload: derivedThemeId });
    dispatch({ type: "SET_THEME", payload: derivedThemeId });
    markUnsaved();
  };

  const handleMaxSkipsChange = (maxSkips: number) => {
    dispatch({ type: "SET_MAX_SKIPS", payload: maxSkips });
    markUnsaved();
  };

  const handleFinalRoundTimerChange = (timer: number) => {
    dispatch({ type: "SET_FINAL_ROUND_TIMER", payload: timer });
    markUnsaved();
  };

  // ── Template helpers ───────────────────────────────────────────────────────
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setSelectedTemplate(templateId);
    setContextType(deriveContextType(templateId));

    if (templateId === "custom-blank") {
      setShowModeSelection(true);
      handleTitleChange("Untitled Context");
      dispatch({ type: "SET_QUESTIONS", payload: [] });
      dispatch({ type: "SET_GAME_MODE", payload: "standard" });
      dispatch({ type: "SET_THEME_ID", payload: "default" });
      dispatch({ type: "SET_THEME", payload: "default" });
      return;
    }

    const templateGameMode = (template as any).gameMode === "elimination" ? "elimination" : "standard";
    dispatch({ type: "SET_GAME_MODE", payload: templateGameMode });
    dispatch({ type: "SET_THEME_ID", payload: (template as any).themeId || "default" });
    
    handleTitleChange(template.name);
    if (template.description) {
      dispatch({ type: "SET_DESCRIPTION", payload: template.description });
    }
    if (template.questions?.length) {
      const clonedQuestions = JSON.parse(JSON.stringify(template.questions));
      dispatch({ type: "SET_QUESTIONS", payload: clonedQuestions });
    } else {
      dispatch({ type: "SET_QUESTIONS", payload: [] });
    }
    if (template.settings) {
      dispatch({
        type: "SET_SETTINGS",
        payload: { ...DEFAULT_SETTINGS, ...template.settings },
      });
    }
    if (template.category) {
      dispatch({ type: "SET_CATEGORY", payload: template.category });
    }
    if ((template as any).coverImage) {
      dispatch({ type: "SET_COVER_IMAGE", payload: (template as any).coverImage });
    }

    setShowModeSelection(false);
    setStep(2);
    toast({
      title: "Template loaded",
      description: `"${template.name}" is ready for customization.`,
    });
  };

  const handleTemplateCustomize = (options: any) => {
    const template = templates.find((t) => t.id === selectedTemplate) as any;
    if (!template) return;
    handleTitleChange(options.customTitle || template.name);
    dispatch({
      type: "SET_QUESTIONS",
      payload: options.includeQuestions && template.questions
        ? JSON.parse(JSON.stringify(template.questions))
        : [],
    });
    if (options.includeSettings && template.settings) handleSettingsChange(template.settings);

    const tplGameMode = template.gameMode === "elimination" ? "elimination" : "standard";
    const tplThemeId = template.themeId ?? "default";
    dispatch({ type: "SET_GAME_MODE", payload: tplGameMode });
    dispatch({ type: "SET_THEME_ID", payload: tplThemeId });
    dispatch({ type: "SET_THEME", payload: tplThemeId });

    setStep(2);
    toast({
      title: "Template customized",
      description: "Let's continue editing!",
    });
  };

  // ── Core Supabase upsert ───────────────────────────────────────────────────
  async function saveToSupabase(status: "ACTIVE" | "DRAFT"): Promise<string> {
    if (!user) throw new Error("You must be signed in to save.");

    const persistedGameMode: "standard" | "elimination" =
      context.gameMode === "elimination" ? "elimination" : "standard";
    const persistedTheme = context.themeId || context.theme || "default";

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
          game_mode: persistedGameMode,
          max_skips_per_participant: context.maxSkipsPerParticipant ?? 1,
          final_round_decision_timer: context.finalRoundDecisionTimer ?? 20,
        })
        .eq("id", draftContextId);

      if (ctxError) throw new Error(ctxError.message);

      const localQuestions = context.questions;
      const existingDbQuestions = localQuestions.filter((q) => isDbUUID(q.id));
      const newLocalQuestions = localQuestions.filter((q) => !isDbUUID(q.id));
      const currentDbIds = new Set(existingDbQuestions.map((q) => q.id));

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
            statements: (q as any).statements ?? null,
            skip_allowed: q.skipAllowed ?? false,
            is_speed_question: q.isSpeedQuestion ?? false,
            speed_max_advance: q.speedMaxAdvance ?? null,
            x_axis: (q as any).xAxis ?? null,
            y_axis: (q as any).yAxis ?? null,
          })
          .eq("id", q.id);
        if (error) throw new Error(error.message);
      }

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
          patched.filter((q) => isDbUUID(q.id)).forEach((q) => currentDbIds.add(q.id));
        }
      }

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

    const { data: contextRow, error: ctxError } = await supabase
      .from("contexts")
      .insert({
        creator_id: user.id,
        title: context.title.trim(),
        description: context.description.trim() || null,
        type: contextType,
        status,
        theme: persistedTheme,
        category: context.category || null,
        tags: context.tags ?? [],
        settings: context.settings,
        cover_image: context.coverImage || null,
        game_mode: persistedGameMode,
        max_skips_per_participant: context.maxSkipsPerParticipant ?? 1,
        final_round_decision_timer: context.finalRoundDecisionTimer ?? 20,
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

  const handleSelectAllQuestions = () => setSelectedQuestions(context.questions.map((_, i) => i));
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
        skipAllowed: current.skipAllowed ?? false,
        isSpeedQuestion: current.isSpeedQuestion ?? false,
        speedMaxAdvance: current.speedMaxAdvance ?? undefined,
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
        const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5);
        updateQuestion(question.id, { options: shuffledOptions });
      }
    }
  };

  const handleReorderQuestions = (direction: "up" | "down" | "top" | "bottom") => {
    if (selectedQuestions.length === 0) return;
    const updatedQuestions = [...context.questions];
    const sortedSelected = [...selectedQuestions].sort((a, b) => a - b);

    if (direction === "up" || direction === "top") {
      for (let i = 0; i < sortedSelected.length; i++) {
        const currentIndex = updatedQuestions.findIndex((_, idx) => idx === sortedSelected[i]);
        if (currentIndex === -1) continue;
        const [question] = updatedQuestions.splice(currentIndex, 1);
        const newIndex = direction === "up" ? Math.max(0, currentIndex - 1) : 0;
        updatedQuestions.splice(newIndex, 0, question);
      }
    } else {
      for (let i = sortedSelected.length - 1; i >= 0; i--) {
        const currentIndex = updatedQuestions.findIndex((_, idx) => idx === sortedSelected[i]);
        if (currentIndex === -1) continue;
        const [question] = updatedQuestions.splice(currentIndex, 1);
        const newIndex = direction === "down" ? Math.min(updatedQuestions.length, currentIndex) : updatedQuestions.length;
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
    showModeSelection,
    setShowModeSelection,

    pendingDeleteQuestion,
    confirmDeleteQuestion,
    cancelDeleteQuestion,

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
    handleMaxSkipsChange,
    handleFinalRoundTimerChange,
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