// enhanced-create.tsx - COMPLETE VERSION WITH STEP-CONDITIONAL CONTROLS
import { useState, useEffect, useCallback, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  ArrowLeft, 
  Plus, 
  Settings, 
  Eye, 
  Copy, 
  QrCode,
  Lock,
  Globe,
  Users,
  Music,
  Bell,
  Download,
  Save,
  Sparkles,
  Trophy,
  BarChart3,
  ThumbsUp,
  Gamepad2,
  Star,
  FileText,
  Trash2,
  GripVertical,
  Check,
  ChevronRight,
  CheckCircle2,
  Calendar,
  TestTube,
  Timer,
  Star,
  Download,
  Undo,
  Redo,
  Clock,
  Save as SaveIcon,
  RotateCcw
} from "lucide-react";
import { TemplateCard } from "../components/ui/template-card";
import { ThemeSelector } from "../components/ui/theme-selector";
import { QuestionTypeSelector } from "../components/ui/question-type-selector";
import { DevicePreview } from "../components/ui/device-preview";
import { useToast } from "../hooks/use-toast";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { cn } from "../lib/utils";
import { templates } from "../lib/templates";
import { getDefaultQuestion, QUESTION_TYPE_DETAILS } from "../lib/question-types";
import { BulkActions } from "../components/ui/bulk-actions";
import { TemplateCustomizationDialog } from "../components/ui/template-customization-dialog";
import { QuickActionsPanel } from "../components/ui/quick-actions-panel";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  type DragEndEvent,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Types
interface Question {
  id: string;
  type: string;
  title: string;
  points: number;
  timeLimit: number;
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
  locked?: boolean;
}

interface ContextData {
  title: string;
  description: string;
  theme: string;
  category: string;
  tags: string[];
  questions: Question[];
  settings: any;
}

// History State Management
type HistoryAction = 
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'SET_SETTINGS'; payload: any }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'SET_TAGS'; payload: string[] }
  | { type: 'UPDATE_QUESTION'; payload: { id: string; updates: Partial<Question> } }
  | { type: 'ADD_QUESTION'; payload: Question }
  | { type: 'DELETE_QUESTION'; payload: string }
  | { type: 'REORDER_QUESTIONS'; payload: Question[] };

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

// Sortable Question Item Component
interface SortableQuestionProps {
  id: string;
  question: Question;
  index: number;
  isCurrent: boolean;
  isSelected: boolean;
  onQuestionClick: (index: number) => void;
  onToggleSelect: (index: number) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Question>) => void;
  children?: React.ReactNode;
}

function SortableQuestion({
  id,
  question,
  index,
  isCurrent,
  isSelected,
  onQuestionClick,
  onToggleSelect,
  onDelete,
  onUpdate,
  children
}: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        className={cn(
          "overflow-hidden transition-all border-l-4 cursor-pointer",
          isCurrent ? "border-l-primary ring-1 ring-primary/20 shadow-md" : 
          isSelected ? "border-l-blue-500 ring-1 ring-blue-500/20 bg-blue-50/50" :
          "border-l-transparent opacity-80 hover:opacity-100 hover:border-l-muted-foreground",
          isDragging && "shadow-lg scale-105"
        )}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('.no-select')) return;
          if ((e.target as HTMLElement).tagName === 'INPUT') return;
          if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
          if ((e.target as HTMLElement).closest('button')) return;
          onQuestionClick(index);
        }}
      >
        <div className="p-4 flex items-start gap-3">
          <div 
            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground no-select"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5" />
          </div>
          
          <div 
            className="mt-1 cursor-pointer no-select"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(index);
            }}
          >
            <div className={cn(
              "w-5 h-5 border rounded flex items-center justify-center transition-colors",
              isSelected 
                ? "bg-blue-500 border-blue-500 text-white" 
                : "border-muted-foreground hover:border-primary hover:bg-primary/10"
            )}>
              {isSelected && <Check className="w-3 h-3" />}
            </div>
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Question {index + 1}
                </span>
                <Badge variant="outline" className="text-xs capitalize">
                  {question.type.replace('_', ' ').toLowerCase()}
                </Badge>
                {question.locked && (
                  <Badge variant="outline" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" /> Locked
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-destructive no-select"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(question.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            {children}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function EnhancedCreate() {
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
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const addToHistory = useCallback((actionType: string) => {
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
    const typeInfo = QUESTION_TYPE_DETAILS.find(t => t.id === type);
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
    addToHistory(`Add ${type.replace('_', ' ').toLowerCase()} question`);
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

  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = context.questions.findIndex(q => q.id === active.id);
      const newIndex = context.questions.findIndex(q => q.id === over.id);
      
      const newQuestions = arrayMove(context.questions, oldIndex, newIndex);
      dispatch({ type: 'REORDER_QUESTIONS', payload: newQuestions });
      addToHistory(`Reorder questions`);
    }
    
    setActiveDragId(null);
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

  const handleBulkUpdate = (updatedQuestions: any[]) => {
    dispatch({ type: 'SET_QUESTIONS', payload: updatedQuestions });
    setSelectedQuestions([]);
    addToHistory("Bulk update questions");
  };

  const handleDuplicateCurrentQuestion = () => {
    if (currentQuestionIndex >= 0 && context.questions[currentQuestionIndex]) {
      const current = context.questions[currentQuestionIndex];
      const duplicate = {
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

  const renderStep1 = () => (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Sparkles className="mr-2 h-4 w-4" /> Start creating
        </div>
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-balance">Choose a starting point</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select a pre-made template designed for engagement or start from scratch with a blank canvas.
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-transparent border-b rounded-none mb-6 gap-2">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-4 py-2">All Templates</TabsTrigger>
          <TabsTrigger value="education" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-4 py-2">Education</TabsTrigger>
          <TabsTrigger value="business" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-4 py-2">Business</TabsTrigger>
          <TabsTrigger value="fun" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-4 py-2">Fun & Games</TabsTrigger>
        </TabsList>
        
        {["all", "education", "business", "fun"].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {templates
                .filter(t => tab === 'all' || 
                  (tab === 'education' && t.category === 'Education') ||
                  (tab === 'business' && (t.category === 'Business' || t.category === 'HR')) ||
                  (tab === 'fun' && (t.category === 'Entertainment' || t.category === 'Team Building'))
                )
                .map((template) => (
                  <TemplateCard
                    key={template.id}
                    id={template.id}
                    name={template.name}
                    description={template.description}
                    icon={template.icon}
                    category={template.category}
                    questionsCount={template.questions ? template.questions.length : 0}
                    color={template.color}
                    popularity={template.popularity}
                    isNew={template.isNew}
                    selected={selectedTemplate === template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                  />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <TemplateCustomizationDialog
        template={templates.find(t => t.id === selectedTemplate)}
        open={showTemplateCustomization}
        onOpenChange={setShowTemplateCustomization}
        onCustomize={handleTemplateCustomize}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-heading font-bold">Context Settings</h3>
            <Badge variant="outline" className="gap-2">
              <Sparkles className="h-3 w-3" />
              Template: {templates.find(t => t.id === selectedTemplate)?.name || "Custom"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={context.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-lg font-medium"
                placeholder="Enter a catchy title..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={context.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="What is this about?"
                className="resize-none min-h-24"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={context.category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="team-building">Team Building</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="hr">Human Resources</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {["Quiz", "Team", "Fun", "Learning", "Challenge"].map((tag) => (
                  <Badge
                    key={tag}
                    variant={context.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      handleTagsChange(
                        context.tags.includes(tag)
                          ? context.tags.filter((t) => t !== tag)
                          : [...context.tags, tag]
                      );
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
                <Input
                  placeholder="Add custom tag..."
                  className="w-full sm:w-32 h-8"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value) {
                      handleTagsChange([...context.tags, e.currentTarget.value]);
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <Label className="mb-3 block">Visual Theme</Label>
            <ThemeSelector selectedTheme={context.theme} onSelect={handleThemeChange} />
          </div>
          
          <div className="space-y-4 pt-4">
            <h3 className="font-medium">Cover Image</h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {[
                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600",
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600",
                "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=600",
                "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=600",
              ].map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 hover:border-primary transition-all group"
                >
                  <img
                    src={url}
                    alt={`Cover ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="secondary">
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full">
              Upload Custom Image
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-heading font-bold">Questions ({context.questions.length})</h3>
            <p className="text-sm text-muted-foreground">
              Design and organize your questions
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => addQuestion("SINGLE_CHOICE")}>
              <Plus className="w-4 h-4 mr-2" /> Add Question
            </Button>
          </div>
        </div>

        {context.questions.length > 0 && (
          <BulkActions
            questions={context.questions}
            onUpdateQuestions={handleBulkUpdate}
            selectedQuestions={selectedQuestions}
            onSelectAll={handleSelectAllQuestions}
            onClearSelection={handleClearSelection}
          />
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={context.questions.map(q => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {context.questions.map((q, idx) => {
              const isCurrent = currentQuestionIndex === idx;
              const isSelected = selectedQuestions.includes(idx);
              
              return (
                <SortableQuestion
                  key={q.id}
                  id={q.id}
                  question={q}
                  index={idx}
                  isCurrent={isCurrent}
                  isSelected={isSelected}
                  onQuestionClick={setCurrentQuestionIndex}
                  onToggleSelect={toggleQuestionSelection}
                  onDelete={deleteQuestion}
                  onUpdate={updateQuestion}
                >
                  {isCurrent ? (
                    <div className="space-y-4">
                      <Input 
                        value={q.title} 
                        onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                        className="text-lg font-medium border-x-0 border-t-0 border-b rounded-none px-0 focus-visible:ring-0"
                        placeholder="Type your question..."
                        autoFocus
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Time Limit (s)</Label>
                          <Input 
                            type="number" 
                            value={q.timeLimit} 
                            onChange={(e) => updateQuestion(q.id, { timeLimit: parseInt(e.target.value) || 30 })} 
                            className="no-select"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Points</Label>
                          <Input 
                            type="number" 
                            value={q.points} 
                            onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) || 100 })} 
                            className="no-select"
                          />
                        </div>
                      </div>

                      {q.options && q.options.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs">Answer Options</Label>
                          {q.options.map((opt, optIdx) => (
                            <div key={opt.id} className="flex items-center gap-2">
                              <div 
                                className={cn(
                                  "w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer transition-colors no-select",
                                  opt.isCorrect ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground hover:border-primary"
                                )}
                                onClick={() => {
                                  const newOptions = [...q.options!];
                                  if (q.type === 'SINGLE_CHOICE' || q.type === 'TRUE_FALSE') {
                                    newOptions.forEach(o => o.isCorrect = false);
                                  }
                                  newOptions[optIdx] = { ...opt, isCorrect: !opt.isCorrect };
                                  updateQuestion(q.id, { options: newOptions });
                                }}
                              >
                                {opt.isCorrect && <Check className="w-3 h-3" />}
                              </div>
                              <Input 
                                value={opt.text}
                                onChange={(e) => {
                                  const newOptions = [...q.options!];
                                  newOptions[optIdx] = { ...opt, text: e.target.value };
                                  updateQuestion(q.id, { options: newOptions });
                                }}
                                className="h-9 no-select"
                                placeholder={`Option ${optIdx + 1}`}
                              />
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground no-select"
                                onClick={() => {
                                  const newOptions = q.options!.filter((_, i) => i !== optIdx);
                                  updateQuestion(q.id, { options: newOptions });
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:text-primary/80 p-0 h-auto font-normal no-select"
                            onClick={() => {
                              const newOptions = [...q.options!, { 
                                id: Date.now().toString(), 
                                text: "", 
                                isCorrect: false 
                              }];
                              updateQuestion(q.id, { options: newOptions });
                            }}
                          >
                            + Add Option
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted-foreground truncate">{q.title}</div>
                  )}
                </SortableQuestion>
              );
            })}
          </div>
        </SortableContext>
        
        <DragOverlay>
          {activeDragId && (
            <Card className="opacity-80 rotate-2 shadow-2xl">
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">
                    {context.questions.find(q => q.id === activeDragId)?.title}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      <div className="p-4 border-2 border-dashed rounded-xl text-center bg-muted/30 hover:bg-muted/50 transition-colors">
           <p className="text-sm text-muted-foreground mb-4">Add a new question type</p>
           <QuestionTypeSelector onSelect={addQuestion} />
        </div>

      <QuickActionsPanel
        questions={context.questions}
        currentQuestionIndex={currentQuestionIndex}
        onAddQuestion={addQuestion}
        onDuplicateQuestion={handleDuplicateCurrentQuestion}
        onDeleteQuestion={handleDeleteCurrentQuestion}
        onUpdateQuestion={(updates) => {
          if (currentQuestionIndex >= 0) {
            const questionId = context.questions[currentQuestionIndex].id;
            updateQuestion(questionId, updates);
          }
        }}
        onBulkAction={(action) => {
          switch (action) {
            case 'shuffle':
              handleShuffleAnswers();
              break;
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
        }}
      />
    </div>
  );

  const renderStep4 = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8">
      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-6">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5" /> Participation
          </h3>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <Label>Participation Mode</Label>
                <p className="text-sm text-muted-foreground">Who can join?</p>
              </div>
              <Select
                value={context.settings.participationMode}
                onValueChange={(value) =>
                  handleSettingsChange({ participationMode: value })
                }
              >
                <SelectTrigger className="w-full sm:w-45">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">
                    <Globe className="mr-2 h-4 w-4 inline" /> Public
                  </SelectItem>
                  <SelectItem value="INVITE_ONLY">
                    <Lock className="mr-2 h-4 w-4 inline" /> Invite Only
                  </SelectItem>
                  <SelectItem value="CODE_REQUIRED">
                    <Copy className="mr-2 h-4 w-4 inline" /> Code Required
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Require Account</Label>
                  <p className="text-sm text-muted-foreground">Users must sign in</p>
                </div>
                <Switch
                  checked={context.settings.requireAccount}
                  onCheckedChange={(checked) =>
                    handleSettingsChange({ requireAccount: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Allow Guest Participation</Label>
                  <p className="text-sm text-muted-foreground">Guests can join without account</p>
                </div>
                <Switch
                  checked={context.settings.allowGuest}
                  onCheckedChange={(checked) =>
                    handleSettingsChange({ allowGuest: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Allow Anonymous</Label>
                  <p className="text-sm text-muted-foreground">Hide participant names</p>
                </div>
                <Switch
                  checked={context.settings.allowAnonymous}
                  onCheckedChange={(checked) =>
                    handleSettingsChange({ allowAnonymous: checked })
                  }
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Max Participants: {context.settings.maxParticipants}</Label>
              </div>
              <Slider
                value={[context.settings.maxParticipants]}
                onValueChange={([value]) =>
                  handleSettingsChange({ maxParticipants: value })
                }
                min={1}
                max={1000}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Settings className="h-5 w-5" /> Game Rules
          </h3>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <Label>Time Limit (minutes)</Label>
                <p className="text-sm text-muted-foreground">Overall time limit</p>
              </div>
              <Input
                type="number"
                value={context.settings.timeLimit}
                onChange={(e) =>
                  handleSettingsChange({ timeLimit: parseInt(e.target.value) || 60 })
                }
                className="w-full sm:w-24"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Answer Validation</Label>
              </div>
              <Select
                value={context.settings.answerValidation}
                onValueChange={(value) =>
                  handleSettingsChange({ answerValidation: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTO">Automatic</SelectItem>
                  <SelectItem value="MANUAL">Manual Review</SelectItem>
                  <SelectItem value="REAL_TIME">Real-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Show Leaderboard</Label>
                  <p className="text-sm text-muted-foreground">Display scores during game</p>
                </div>
                <Switch
                  checked={context.settings.showLeaderboard}
                  onCheckedChange={(checked) =>
                    handleSettingsChange({ showLeaderboard: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Show Progress</Label>
                  <p className="text-sm text-muted-foreground">Show question progress</p>
                </div>
                <Switch
                  checked={context.settings.showProgress}
                  onCheckedChange={(checked) =>
                    handleSettingsChange({ showProgress: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Allow Retry</Label>
                  <p className="text-sm text-muted-foreground">Participants can try again</p>
                </div>
                <Switch
                  checked={context.settings.allowRetry}
                  onCheckedChange={(checked) =>
                    handleSettingsChange({ allowRetry: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Shuffle Questions</Label>
                  <p className="text-sm text-muted-foreground">Randomize question order</p>
                </div>
                <Switch
                  checked={context.settings.shuffleQuestions}
                  onCheckedChange={(checked) =>
                    handleSettingsChange({ shuffleQuestions: checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Music className="h-5 w-5" /> Audio & Effects
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label>Sound Effects</Label>
                <p className="text-sm text-muted-foreground">Play sounds during game</p>
              </div>
              <Switch
                checked={context.settings.soundEffects}
                onCheckedChange={(checked) =>
                  handleSettingsChange({ soundEffects: checked })
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label>Background Music</Label>
              <Select
                value={context.settings.backgroundMusic}
                onValueChange={(value) =>
                  handleSettingsChange({ backgroundMusic: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select music track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upbeat">Upbeat Energy</SelectItem>
                  <SelectItem value="calm">Calm Focus</SelectItem>
                  <SelectItem value="epic">Epic Adventure</SelectItem>
                  <SelectItem value="none">No Music</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notifications
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label>Send Notifications</Label>
                <p className="text-sm text-muted-foreground">Email reminders and updates</p>
                </div>
              <Switch
                checked={context.settings.notifications}
                onCheckedChange={(checked) =>
                  handleSettingsChange({ notifications: checked })
                }
              />
            </div>
            
            {context.settings.notifications && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Join reminders</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Results ready</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Time limit warnings</Label>
                  <Switch defaultChecked />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8">
      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <Card className="overflow-hidden border-2">
            <div className="h-32 md:h-48 bg-linear-to-r from-purple-500 to-pink-500 relative">
              <div className="absolute bottom-3 md:bottom-4 left-4 md:left-6">
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                  <Eye className="mr-1 h-3 w-3" /> Preview Mode
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">{context.title || "Your Context Title"}</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {context.description || "Context description will appear here"}
                  </p>
                </div>
                <Badge variant="outline" className="text-base md:text-lg">
                  {context.questions.length} Qs
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  {context.settings.maxParticipants} Participants
                </div>
                <div className="flex items-center">
                  <Globe className="mr-1 h-4 w-4" />
                  {context.settings.participationMode}
                </div>
                <div className="flex items-center">
                  <Timer className="mr-1 h-4 w-4" />
                  {context.settings.timeLimit} min limit
                </div>
                <div className="flex items-center">
                  <Star className="mr-1 h-4 w-4" />
                  {context.questions.reduce((sum, q) => sum + (q.points || 0), 0)} total points
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 md:p-6">
              <h4 className="font-bold mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Template
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Launch
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Bell className="mr-2 h-4 w-4" />
                  Set Reminders
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Participation
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Questions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quiz Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">{context.questions.length}</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">
                    {context.questions.reduce((sum, q) => sum + (q.timeLimit || 30), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total seconds</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Avg. time per question:</span>
                  <span className="font-medium">
                    {context.questions.length > 0 
                      ? Math.round(context.questions.reduce((sum, q) => sum + (q.timeLimit || 30), 0) / context.questions.length)
                      : 0}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total points:</span>
                  <span className="font-medium">
                    {context.questions.reduce((sum, q) => sum + (q.points || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Question types:</span>
                  <span className="font-medium">
                    {[...new Set(context.questions.map(q => q.type))].length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ready to Launch?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Title and description set</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-5 w-5 ${context.questions.length > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm">At least one question added</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Participation settings configured</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Theme selected</span>
                </div>
              </div>
              
              <div className="pt-4">
                <Button onClick={handleCreate} className="w-full" size="lg">
                  <Save className="mr-2 h-5 w-5" />
                  Publish & Share
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  You can always edit this later from your dashboard
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="hidden md:block">
            <h1 className="font-bold text-lg">
              {step === 1 && "Create New"}
              {step === 2 && "Customize Details"}
              {step === 3 && "Design Questions"}
              {step === 4 && "Configure Settings"}
              {step === 5 && "Preview & Launch"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {step === 1 && "Select a template"}
              {step === 2 && "Edit basic information"}
              {step === 3 && "Add and customize questions"}
              {step === 4 && "Set up participation rules"}
              {step === 5 && "Review and publish"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* UNDO/REDO CONTROLS - Only show from step 2 */}
          {showEditingControls && (
            <div className="flex items-center gap-2 mr-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                disabled={historyIndex === 0}
                className={historyIndex === 0 ? "opacity-50" : ""}
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRedo}
                disabled={historyIndex === history.length - 1}
                className={historyIndex === history.length - 1 ? "opacity-50" : ""}
                title="Redo (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {/* AUTO-SAVE STATUS INDICATOR - Only show from step 2 */}
          {showEditingControls && (
            <div className="flex items-center gap-2 mr-4">
              {saveStatus === 'saving' ? (
                <Badge variant="outline" className="gap-2">
                  <RotateCcw className="w-3 h-3 animate-spin" />
                  Saving...
                </Badge>
              ) : saveStatus === 'saved' ? (
                <Badge variant="outline" className="gap-2">
                  <Check className="w-3 h-3" />
                  Saved
                </Badge>
              ) : hasUnsavedChanges ? (
                <Badge variant="outline" className="gap-2">
                  <Clock className="w-3 h-3" />
                  Draft
                </Badge>
              ) : lastSaved ? (
                <Badge variant="outline" className="gap-2">
                  <SaveIcon className="w-3 h-3" />
                  Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-2">
                  <SaveIcon className="w-3 h-3" />
                  Not saved
                </Badge>
              )}
            </div>
          )}
          
          {/* SAVE DRAFT BUTTON - Only show from step 2 */}
          {showEditingControls && (
            <Button variant="outline" size="sm" onClick={handleManualSave} className="gap-2" title="Save (Ctrl+S)">
              <SaveIcon className="w-4 h-4" />
              Save Draft
            </Button>
          )}
          
          {/* NEXT STEP BUTTON - Show from step 2 to 4 */}
          {step > 1 && step < 5 && (
            <Button variant="outline" className="gap-2" onClick={() => setStep(step + 1)}>
              Next Step <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 border-b">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex flex-col items-center ${s <= step ? "text-primary" : "text-muted-foreground"}`}
              >
                <div
                  className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center border-2 mb-1 md:mb-2 text-sm md:text-base ${
                    s < step
                      ? "bg-primary border-primary text-primary-foreground"
                      : s === step
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                >
                  {s < step ? <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" /> : s}
                </div>
                <span className="text-xs hidden sm:block">
                  {s === 1 && "Template"}
                  {s === 2 && "Details"}
                  {s === 3 && "Questions"}
                  {s === 4 && "Settings"}
                  {s === 5 && "Launch"}
                </span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden flex">
        <div className={cn(
          "flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300",
          (step === 2 || step === 3) ? "md:w-1/2 lg:w-[60%]" : "w-full"
        )}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          
          {step > 1 && step < 5 && (
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 md:pt-8 border-t mt-8">
              <Button variant="outline" onClick={() => setStep(step - 1)} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(step + 1)} className="w-full sm:w-auto">
                Next: {step === 2 && "Questions"}
                {step === 3 && "Settings"}
                {step === 4 && "Preview"}
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </Button>
            </div>
          )}
          
          {step === 5 && (
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 md:pt-8 border-t mt-8">
              <Button variant="outline" onClick={() => setStep(4)} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings
              </Button>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  Save as Template
                </Button>
                <Button size="lg" onClick={handleCreate} className="w-full sm:w-auto">
                  <Save className="mr-2 h-5 w-5" /> Publish Now
                </Button>
              </div>
            </div>
          )}
        </div>

        {(step === 2 || step === 3) && (
          <div className="hidden lg:block w-[40%] bg-muted/30 border-l relative">
            <div className="absolute inset-0 bg-grid-slate-200/50 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800/50" />
            
            <div className="relative h-full p-8 flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Live Preview
                </h3>
              </div>
              
              <div className="flex-1">
                <DevicePreview 
                  title={context.title} 
                  themeId={context.theme} 
                  questions={context.questions} 
                  currentQuestionIndex={currentQuestionIndex} 
                />
              </div>
              
              <div className="mt-4 p-4 bg-background/80 backdrop-blur rounded-xl border text-xs text-muted-foreground text-center">
                This is how your participants will see the experience on their devices.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}