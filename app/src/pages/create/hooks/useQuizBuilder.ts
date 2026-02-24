import { useState, useEffect, useCallback, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../hooks/use-toast";
import { templates } from "../../../lib/templates";
import { getDefaultQuestion } from "../../../lib/question-types";
import { QUESTION_TYPE_DETAILS } from "../../../lib/question-types";
import type { ContextData, HistoryAction, Question } from "../types";

function historyReducer(state: ContextData, action: HistoryAction): ContextData {
  switch (action.type) {
    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload };
    case 'SET_TITLE':
      return { ...state, title: action.payload };
    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_CATEGORY':
      return { ...state, category: action.payload };
    case 'SET_TAGS':
      return { ...state, tags: action.payload };
    case 'UPDATE_QUESTION':
      return {
        ...state,
        questions: state.questions.map(q => 
          q.id === action.payload.id ? { ...q, ...action.payload.updates } : q
        )
      };
    case 'ADD_QUESTION':
      return { ...state, questions: [...state.questions, action.payload] };
    case 'DELETE_QUESTION':
      return { ...state, questions: state.questions.filter(q => q.id !== action.payload) };
    case 'REORDER_QUESTIONS':
      return { ...state, questions: action.payload };
    default:
      return state;
  }
}

export function useQuizBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [showTemplateCustomization, setShowTemplateCustomization] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'workspace' | 'preview'>('workspace');
  const [leftPanelTab, setLeftPanelTab] = useState<'types' | 'bulk'>('types');
  
  const [context, dispatch] = useReducer(historyReducer, {
    title: "Untitled Quiz",
    description: "",
    theme: "default",
    category: "",
    tags: [],
    questions: [],
    settings: {
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
    }
  });
  
  const [history, setHistory] = useState<ContextData[]>([{
    title: "Untitled Quiz",
    description: "",
    theme: "default",
    category: "",
    tags: [],
    questions: [],
    settings: {
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
    }
  }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const showEditingControls = step >= 2;

  useEffect(() => {
    const draft = localStorage.getItem('quiz-draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        dispatch({ type: 'SET_TITLE', payload: parsed.title || "Untitled Quiz" });
        dispatch({ type: 'SET_DESCRIPTION', payload: parsed.description || "" });
        dispatch({ type: 'SET_THEME', payload: parsed.theme || "default" });
        dispatch({ type: 'SET_QUESTIONS', payload: parsed.questions || [] });
        dispatch({ type: 'SET_SETTINGS', payload: parsed.settings || context.settings });
        dispatch({ type: 'SET_CATEGORY', payload: parsed.category || "" });
        dispatch({ type: 'SET_TAGS', payload: parsed.tags || [] });
        
        toast({
          title: "Draft restored",
          description: "Your unsaved changes have been restored",
        });
      } catch (error) {
        console.error("Failed to restore draft:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const interval = setInterval(() => {
      saveToLocalStorage();
    }, 30000);

    return () => clearInterval(interval);
  }, [hasUnsavedChanges, context]);

  const markUnsaved = useCallback(() => {
    if (!hasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }
  }, [hasUnsavedChanges]);

  const saveToLocalStorage = useCallback(() => {
    if (!hasUnsavedChanges) return;
    
    setSaveStatus('saving');
    
    setTimeout(() => {
      localStorage.setItem('quiz-draft', JSON.stringify(context));
      setLastSaved(new Date());
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  }, [context, hasUnsavedChanges]);

  const handleManualSave = () => {
    saveToLocalStorage();
    toast({
      title: "Progress saved",
      description: "Your changes have been saved locally",
    });
  };

  const addToHistory = useCallback((_actionType: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ...context });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    markUnsaved();
  }, [context, history, historyIndex, markUnsaved]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const previousIndex = historyIndex - 1;
      const previousState = history[previousIndex];
      
      Object.keys(previousState).forEach(key => {
        const typedKey = key as keyof ContextData;
        if (typedKey === 'questions') {
          dispatch({ type: 'SET_QUESTIONS', payload: previousState.questions });
        } else if (typedKey === 'title') {
          dispatch({ type: 'SET_TITLE', payload: previousState.title });
        } else if (typedKey === 'description') {
          dispatch({ type: 'SET_DESCRIPTION', payload: previousState.description });
        } else if (typedKey === 'theme') {
          dispatch({ type: 'SET_THEME', payload: previousState.theme });
        } else if (typedKey === 'settings') {
          dispatch({ type: 'SET_SETTINGS', payload: previousState.settings });
        } else if (typedKey === 'category') {
          dispatch({ type: 'SET_CATEGORY', payload: previousState.category });
        } else if (typedKey === 'tags') {
          dispatch({ type: 'SET_TAGS', payload: previousState.tags });
        }
      });
      
      setHistoryIndex(previousIndex);
      
      toast({
        title: "Undo",
        description: "Last action undone",
        duration: 1500,
      });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];
      
      Object.keys(nextState).forEach(key => {
        const typedKey = key as keyof ContextData;
        if (typedKey === 'questions') {
          dispatch({ type: 'SET_QUESTIONS', payload: nextState.questions });
        } else if (typedKey === 'title') {
          dispatch({ type: 'SET_TITLE', payload: nextState.title });
        } else if (typedKey === 'description') {
          dispatch({ type: 'SET_DESCRIPTION', payload: nextState.description });
        } else if (typedKey === 'theme') {
          dispatch({ type: 'SET_THEME', payload: nextState.theme });
        } else if (typedKey === 'settings') {
          dispatch({ type: 'SET_SETTINGS', payload: nextState.settings });
        } else if (typedKey === 'category') {
          dispatch({ type: 'SET_CATEGORY', payload: nextState.category });
        } else if (typedKey === 'tags') {
          dispatch({ type: 'SET_TAGS', payload: nextState.tags });
        }
      });
      
      setHistoryIndex(nextIndex);
      
      toast({
        title: "Redo",
        description: "Action restored",
        duration: 1500,
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showEditingControls) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault();
          handleUndo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          handleManualSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEditingControls, handleUndo, handleRedo]);

  const addQuestion = (type: string) => {
    const typeInfo = QUESTION_TYPE_DETAILS.find(t => t.uiId === type);
    
    if (typeInfo && !typeInfo.available) {
      toast({
        title: "Coming Soon",
        description: `"${typeInfo.name}" will be available soon!`,
        variant: "destructive",
      });
      return;
    }
    
    const newQuestion = getDefaultQuestion(type, `q${Date.now()}`);
    dispatch({ type: 'ADD_QUESTION', payload: newQuestion });
    setCurrentQuestionIndex(context.questions.length);
    setSelectedQuestions([]);
    addToHistory(`Add ${type.replace('-', ' ')} question`);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    dispatch({ type: 'UPDATE_QUESTION', payload: { id, updates } });
    addToHistory(`Update question`);
  };

  const deleteQuestion = (id: string) => {
    dispatch({ type: 'DELETE_QUESTION', payload: id });
    addToHistory(`Delete question`);
    
    toast({
      title: "Question deleted",
      description: "Question has been removed",
      duration: 1500,
    });
  };

  const handleTitleChange = (value: string) => {
    dispatch({ type: 'SET_TITLE', payload: value });
    markUnsaved();
  };

  const handleDescriptionChange = (value: string) => {
    dispatch({ type: 'SET_DESCRIPTION', payload: value });
    markUnsaved();
  };

  const handleThemeChange = (value: string) => {
    dispatch({ type: 'SET_THEME', payload: value });
    markUnsaved();
  };

  const handleCategoryChange = (value: string) => {
    dispatch({ type: 'SET_CATEGORY', payload: value });
    markUnsaved();
  };

  const handleTagsChange = (tags: string[]) => {
    dispatch({ type: 'SET_TAGS', payload: tags });
    markUnsaved();
  };

  const handleSettingsChange = (updates: any) => {
    dispatch({ type: 'SET_SETTINGS', payload: { ...context.settings, ...updates } });
    markUnsaved();
  };

  const toggleQuestionSelection = (index: number) => {
    setSelectedQuestions(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setSelectedTemplate(templateId);
    
    if (templateId !== 'custom-blank') {
      setShowTemplateCustomization(true);
    } else {
      handleTitleChange("Untitled Context");
      dispatch({ type: 'SET_QUESTIONS', payload: [] });
      setStep(2);
      toast({
        title: "Blank canvas selected",
        description: "Start creating from scratch!",
      });
    }
  };

  const handleTemplateCustomize = (options: any) => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    handleTitleChange(options.customTitle || template.name);
    
    if (options.includeQuestions && template.questions) {
      dispatch({ type: 'SET_QUESTIONS', payload: JSON.parse(JSON.stringify(template.questions)) });
    } else {
      dispatch({ type: 'SET_QUESTIONS', payload: [] });
    }

    if (options.includeSettings && template.settings) {
      handleSettingsChange(template.settings);
    }

    setStep(2);
    toast({
      title: "Template customized",
      description: "Let's continue editing!",
    });
  };

  const handleCreate = () => {
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
    
    localStorage.removeItem('quiz-draft');
    
    toast({
      title: "Success!",
      description: `${selectedTemplate || "Context"} created successfully`,
    });
    
    navigate("/dashboard");
  };

  const handleSelectAllQuestions = () => {
    setSelectedQuestions(context.questions.map((_, index) => index));
  };

  const handleClearSelection = () => {
    setSelectedQuestions([]);
  };

  const handleBulkUpdate = (updatedQuestions: Question[]) => {
    dispatch({ type: 'SET_QUESTIONS', payload: updatedQuestions });
    setSelectedQuestions([]);
    addToHistory("Bulk update questions");
  };

  const handleDuplicateCurrentQuestion = () => {
    if (currentQuestionIndex >= 0 && context.questions[currentQuestionIndex]) {
      const current = context.questions[currentQuestionIndex];
      const duplicate: Question = {
        ...current,
        id: `q${Date.now()}`,
        title: `${current.title} (Copy)`
      };
      const newQuestions = [...context.questions];
      newQuestions.splice(currentQuestionIndex + 1, 0, duplicate);
      dispatch({ type: 'SET_QUESTIONS', payload: newQuestions });
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleDeleteCurrentQuestion = () => {
    if (currentQuestionIndex >= 0) {
      const newQ = context.questions.filter((_, i) => i !== currentQuestionIndex);
      dispatch({ type: 'SET_QUESTIONS', payload: newQ });
      setCurrentQuestionIndex(Math.max(0, newQ.length - 1));
      setSelectedQuestions(selectedQuestions.filter(i => i !== currentQuestionIndex));
      toast({
        title: "Question deleted",
        description: "Question has been removed",
        duration: 1500,
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

  const handleReorderQuestions = (direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (selectedQuestions.length === 0) return;
    
    const updatedQuestions = [...context.questions];
    const sortedSelected = [...selectedQuestions].sort((a, b) => a - b);
    
    if (direction === 'up' || direction === 'top') {
      for (let i = 0; i < sortedSelected.length; i++) {
        const selectedIndex = sortedSelected[i];
        const currentIndex = updatedQuestions.findIndex((_, idx) => idx === selectedIndex);
        if (currentIndex === -1) continue;
        
        const question = updatedQuestions[currentIndex];
        updatedQuestions.splice(currentIndex, 1);
        
        let newIndex;
        switch (direction) {
          case 'up':
            newIndex = Math.max(0, currentIndex - 1);
            break;
          case 'top':
            newIndex = 0;
            break;
          default:
            newIndex = currentIndex;
        }
        
        updatedQuestions.splice(newIndex, 0, question);
      }
    } else {
      for (let i = sortedSelected.length - 1; i >= 0; i--) {
        const selectedIndex = sortedSelected[i];
        const currentIndex = updatedQuestions.findIndex((_, idx) => idx === selectedIndex);
        if (currentIndex === -1) continue;
        
        const question = updatedQuestions[currentIndex];
        updatedQuestions.splice(currentIndex, 1);
        
        let newIndex;
        switch (direction) {
          case 'down':
            newIndex = Math.min(updatedQuestions.length, currentIndex);
            break;
          case 'bottom':
            newIndex = updatedQuestions.length;
            break;
          default:
            newIndex = currentIndex;
        }
        
        updatedQuestions.splice(newIndex, 0, question);
      }
    }
    
    dispatch({ type: 'SET_QUESTIONS', payload: updatedQuestions });
    addToHistory('Reorder questions');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'export-json':
        const data = JSON.stringify(context.questions, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'questions.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({
          title: "Exported",
          description: "Questions exported as JSON",
        });
        break;
    }
  };

  return {
    // State
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
    showEditingControls,
    
    // Actions
    addQuestion,
    updateQuestion,
    deleteQuestion,
    handleTitleChange,
    handleDescriptionChange,
    handleThemeChange,
    handleCategoryChange,
    handleTagsChange,
    handleSettingsChange,
    toggleQuestionSelection,
    handleTemplateSelect,
    handleTemplateCustomize,
    handleCreate,
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