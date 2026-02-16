// enhanced-create.tsx - UPDATED VERSION WITH BUILDER STEP 3 AND OPTION EDITING
import { useState, useEffect, useCallback, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  ArrowLeft, 
  Plus, 
  Settings, 
  Eye, 
  Copy, 
  Lock,
  Globe,
  Users,
  Music,
  Bell,
  Save,
  Sparkles,
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
  RotateCcw,
  X,
  FileText,
  Upload,
  Zap,
  Shuffle,
  RotateCcw as RefreshCw,
  Smartphone,
  Monitor,
  ListChecks,
  MessageSquare,
  Cloud,
  BarChart2,
  FileQuestion,
  HelpCircle,
  Loader2,
  ArrowUpToLine,
  ChevronUp,
  ChevronDown,
  ArrowDownToLine,
  ChevronLeft
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
import { Checkbox } from "../components/ui/checkbox";
import { cn } from "../lib/utils";
import { templates } from "../lib/templates";
import { getDefaultQuestion, QUESTION_TYPE_DETAILS } from "../lib/question-types";
import { TemplateCustomizationDialog } from "../components/ui/template-customization-dialog";
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
interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  type: string;
  title: string;
  description?: string;
  points: number;
  timeLimit: number;
  options?: QuestionOption[];
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

// BulkActions Component
interface BulkActionsProps {
  questions: Question[];
  onUpdateQuestions: (questions: Question[]) => void;
  selectedQuestions: number[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onReorderQuestions: (direction: 'up' | 'down' | 'top' | 'bottom') => void;
}

const BulkActions = ({ 
  questions, 
  onUpdateQuestions, 
  selectedQuestions, 
  onSelectAll, 
  onClearSelection,
  onReorderQuestions 
}: BulkActionsProps) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);
  const [timeLimitValue, setTimeLimitValue] = useState(30);
  const [pointsValue, setPointsValue] = useState(10);
  
  const selectedQuestionsCount = selectedQuestions.length;
  const totalQuestionsCount = questions.length;

  const handleBulkAction = () => {
    if (!selectedQuestionsCount) return;
    
    let updatedQuestions = [...questions];

    switch (actionType) {
      case 'time':
        updatedQuestions = updatedQuestions.map((q, index) => 
          selectedQuestions.includes(index) ? { ...q, timeLimit: timeLimitValue } : q
        );
        break;
        
      case 'points':
        updatedQuestions = updatedQuestions.map((q, index) => 
          selectedQuestions.includes(index) ? { ...q, points: pointsValue } : q
        );
        break;
        
      case 'shuffle':
        updatedQuestions = updatedQuestions.map((q, index) => {
          if (selectedQuestions.includes(index) && q.options) {
            const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
            return { ...q, options: shuffledOptions };
          }
          return q;
        });
        break;
        
      case 'duplicate':
        const duplicates: Question[] = [];
        questions.forEach((q, index) => {
          if (selectedQuestions.includes(index)) {
            const duplicate: Question = {
              ...q,
              id: Date.now().toString() + index,
              title: `${q.title} (Copy)`
            };
            duplicates.push(duplicate);
          }
        });
        // Insert duplicates after originals
        let newIndex = 0;
        selectedQuestions.forEach((originalIndex, idx) => {
          const insertPosition = originalIndex + idx + 1 + newIndex;
          updatedQuestions.splice(insertPosition, 0, duplicates[idx]);
          newIndex++;
        });
        break;
        
      case 'delete':
        if (!confirm(`Delete ${selectedQuestionsCount} question(s)?`)) return;
        updatedQuestions = questions.filter((_, index) => !selectedQuestions.includes(index));
        onClearSelection();
        break;
        
      case 'lock':
        updatedQuestions = updatedQuestions.map((q, index) => 
          selectedQuestions.includes(index) ? { ...q, locked: true } : q
        );
        break;
        
      case 'unlock':
        updatedQuestions = updatedQuestions.map((q, index) => 
          selectedQuestions.includes(index) ? { ...q, locked: false } : q
        );
        break;
        
      default:
        return;
    }
    
    onUpdateQuestions(updatedQuestions);
    setIsDialogOpen(false);
    setActionType(null);
  };

  const handleExportSelected = () => {
    if (!selectedQuestionsCount) return;
    
    const selectedQ = questions.filter((_, index) => selectedQuestions.includes(index));
    const data = JSON.stringify(selectedQ, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'selected-questions.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Exported",
      description: `${selectedQuestionsCount} questions exported`,
    });
  };

  const handleExportAll = () => {
    const data = JSON.stringify(questions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all-questions.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Exported",
      description: `${questions.length} questions exported`,
    });
  };

  const handleImportQuestions = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedQuestions = JSON.parse(content);
        
        if (Array.isArray(importedQuestions) && importedQuestions.length > 0) {
          const updatedQuestions = [...questions, ...importedQuestions];
          onUpdateQuestions(updatedQuestions);
          toast({
            title: "Imported",
            description: `${importedQuestions.length} questions imported`,
          });
        }
      } catch (error) {
        console.error('Failed to import questions:', error);
        toast({
          title: "Import failed",
          description: "Please check the file format",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const renderActionDialog = () => {
    if (!actionType) return null;

    const actionConfigs: Record<string, { title: string; content: React.ReactNode }> = {
      time: {
        title: 'Set Time Limit',
        content: (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Time Limit (seconds)</Label>
              <Input
                type="number"
                value={timeLimitValue}
                onChange={(e) => setTimeLimitValue(parseInt(e.target.value) || 30)}
                className="mt-1"
                min="5"
                max="300"
              />
            </div>
            <div className="flex gap-2">
              {[15, 30, 45, 60].map((time) => (
                <Button
                  key={time}
                  variant="outline"
                  size="sm"
                  onClick={() => setTimeLimitValue(time)}
                >
                  {time}s
                </Button>
              ))}
            </div>
          </div>
        )
      },
      points: {
        title: 'Set Points',
        content: (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Points per Question</Label>
              <Input
                type="number"
                value={pointsValue}
                onChange={(e) => setPointsValue(parseInt(e.target.value) || 10)}
                className="mt-1"
                min="0"
                max="100"
              />
            </div>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map((points) => (
                <Button
                  key={points}
                  variant="outline"
                  size="sm"
                  onClick={() => setPointsValue(points)}
                >
                  {points} pts
                </Button>
              ))}
            </div>
          </div>
        )
      },
      delete: {
        title: 'Delete Questions',
        content: (
          <div className="space-y-4">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="font-medium text-destructive">Warning: This action cannot be undone</p>
              <p className="text-sm text-destructive/80 mt-1">
                You are about to delete {selectedQuestionsCount} questions.
              </p>
            </div>
          </div>
        )
      },
      duplicate: {
        title: 'Duplicate Questions',
        content: (
          <div className="space-y-4">
            <p className="text-sm">
              This will create exact copies of {selectedQuestionsCount} selected questions.
            </p>
          </div>
        )
      },
      lock: {
        title: 'Lock Questions',
        content: (
          <div className="space-y-4">
            <p className="text-sm">
              Locking questions will prevent them from being edited accidentally.
            </p>
          </div>
        )
      },
      unlock: {
        title: 'Unlock Questions',
        content: (
          <div className="space-y-4">
            <p className="text-sm">
              Unlocking questions will allow them to be edited again.
            </p>
          </div>
        )
      },
      shuffle: {
        title: 'Shuffle Answers',
        content: (
          <div className="space-y-4">
            <p className="text-sm">
              This will randomize the order of answer options for each selected question.
            </p>
          </div>
        )
      }
    };

    const config = actionConfigs[actionType];
    if (!config) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">{config.title}</h3>
          {config.content}
          <div className="flex gap-2 justify-end mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setActionType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAction}
              variant={actionType === 'delete' ? 'destructive' : 'default'}
            >
              Apply to {selectedQuestionsCount} Questions
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Bulk Actions</h3>
        <span className="text-xs text-muted-foreground">
          {selectedQuestionsCount} of {totalQuestionsCount} selected
        </span>
      </div>

      {selectedQuestionsCount > 0 ? (
        <div className="space-y-3">
          {/* Duplicate & Delete - side by side */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionType('duplicate');
                setIsDialogOpen(true);
              }}
              className="flex-1 bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionType('delete');
                setIsDialogOpen(true);
              }}
              className="flex-1 bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 hover:text-red-700 transition-all"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>

          {/* Update Points */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">Update Points for All Selected</Label>
            <div className="flex gap-3">
              {[5, 10, 15, 20].map(points => (
                <Button
                  key={points}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActionType('points');
                    setPointsValue(points);
                    setIsDialogOpen(true);
                  }}
                  className="flex-1 bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  {points}
                </Button>
              ))}
            </div>
          </div>

          {/* Update Time Limit */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">Update Time Limit (seconds)</Label>
            <div className="flex gap-3">
              {[15, 30, 45, 60].map(time => (
                <Button
                  key={time}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActionType('time');
                    setTimeLimitValue(time);
                    setIsDialogOpen(true);
                  }}
                  className="flex-1 bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  {time}s
                </Button>
              ))}
            </div>
          </div>

          {/* Lock & Unlock - side by side */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionType('lock');
                setIsDialogOpen(true);
              }}
              className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <Lock className="w-4 h-4 mr-2" />
              Lock
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionType('unlock');
                setIsDialogOpen(true);
              }}
              className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <Lock className="w-4 h-4 mr-2" />
              Unlock
            </Button>
          </div>

          {/* Shuffle Answers & Export Selected - side by side */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionType('shuffle');
                setIsDialogOpen(true);
              }}
              className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Shuffle Answers
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportSelected}
              className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Selected
            </Button>
          </div>

          {/* Reorder Controls - keep as is but with cleaner style */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="grid grid-cols-4">
              <button
                onClick={() => onReorderQuestions('top')}
                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-r border-gray-100 dark:border-gray-700"
              >
                <ArrowUpToLine className="w-4 h-4 mx-auto text-muted-foreground" />
              </button>
              <button
                onClick={() => onReorderQuestions('up')}
                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-r border-gray-100 dark:border-gray-700"
              >
                <ChevronUp className="w-4 h-4 mx-auto text-muted-foreground" />
              </button>
              <button
                onClick={() => onReorderQuestions('down')}
                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-r border-gray-100 dark:border-gray-700"
              >
                <ChevronDown className="w-4 h-4 mx-auto text-muted-foreground" />
              </button>
              <button
                onClick={() => onReorderQuestions('bottom')}
                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowDownToLine className="w-4 h-4 mx-auto text-muted-foreground" />
              </button>
            </div>
            <div className="p-2 text-center text-xs text-muted-foreground border-t border-gray-100 dark:border-gray-700">
              Reorder selected questions
            </div>
          </div>

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="w-full text-muted-foreground hover:text-foreground hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            Clear Selection
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* No selection state */}
          <div className="text-center p-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
            <ChevronUp className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Select questions to perform bulk actions
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Select All Questions
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-foreground">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportAll}
                className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
              <div>
                <input
                  type="file"
                  id="import-file"
                  className="hidden"
                  accept=".json"
                  onChange={handleImportQuestions}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => document.getElementById('import-file')?.click()}
                  className="w-full bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDialogOpen && renderActionDialog()}
    </div>
  );
};

// PreviewPanel Component
interface PreviewPanelProps {
  question?: Question;
  presentationSettings: any;
  questions: Question[];
  currentQuestionIndex: number;
}

const PreviewPanel = ({ question, presentationSettings, questions, currentQuestionIndex }: PreviewPanelProps) => {
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
  const totalTime = questions.reduce((sum, q) => sum + (q.timeLimit || 0), 0);

  const defaultQuestion: Question = {
    id: 'preview',
    type: 'multiple-choice',
    title: "Add your first question to see it here",
    description: "Preview will appear once you add questions",
    points: 10,
    timeLimit: 30,
    options: [
      { id: "1", text: "Sample Option 1", isCorrect: false },
      { id: "2", text: "Sample Option 2", isCorrect: true },
      { id: "3", text: "Sample Option 3", isCorrect: false },
      { id: "4", text: "Sample Option 4", isCorrect: false }
    ]
  };
  
  const displayQuestion = question || defaultQuestion;
  const displayOptions = displayQuestion.options || [];

  const renderQuestionTypeContent = () => {
    switch(displayQuestion.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {displayOptions.map((opt, idx) => (
              <button
                key={opt.id}
                className={`w-full p-3 rounded-lg border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-250 text-left ${
                  opt.isCorrect ? 'ring-1 ring-green-500/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    opt.isCorrect ? 'border-green-500 bg-green-500 text-white' : 'border-border'
                  }`}>
                    {opt.isCorrect && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-sm md:text-base text-foreground">{opt.text}</span>
                </div>
              </button>
            ))}
          </div>
        );
      
      case 'open-text':
        return (
          <div className="space-y-3">
            <textarea
              placeholder="Type your answer here..."
              className="w-full min-h-[120px] p-4 rounded-lg border-2 border-border bg-card text-foreground resize-none focus:outline-none focus:border-primary transition-colors"
              disabled
            />
            <button className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              Submit Response
            </button>
          </div>
        );
      
      case 'word-cloud':
        return (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter a word or phrase..."
              className="w-full p-4 rounded-lg border-2 border-border bg-card text-foreground focus:outline-none focus:border-primary transition-colors"
              disabled
            />
            <button className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              Submit Word
            </button>
          </div>
        );
      
      case 'rating-scale':
        return (
          <div className="space-y-4">
            <div className="flex justify-center gap-2 md:gap-4">
              {[1, 2, 3, 4, 5]?.map((rating) => (
                <button
                  key={rating}
                  className="w-12 h-12 md:w-16 md:h-16 rounded-lg border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-250 flex items-center justify-center"
                >
                  <Star className="w-6 h-6 text-muted-foreground" />
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs md:text-sm text-muted-foreground px-2">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-3">
            {displayOptions.map((opt, idx) => (
              <button
                key={opt.id}
                className="w-full p-3 rounded-lg border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-250 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-border flex-shrink-0 flex items-center justify-center">
                    <span className="text-xs font-medium">{String.fromCharCode(65 + idx)}</span>
                  </div>
                  <span className="text-sm md:text-base text-foreground">{opt.text}</span>
                </div>
              </button>
            ))}
          </div>
        );
    }
  };

  const renderEmptyState = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Eye className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Question Selected</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Select a question to see how it will appear to your audience
        </p>
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Presentation Stats</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{questions.length}</div>
              <div className="text-xs text-muted-foreground">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalPoints}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalTime}s</div>
              <div className="text-xs text-muted-foreground">Time</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDeviceFrame = () => {
    if (!question) return renderEmptyState();

    return (
      <div className={`relative border-gray-800 shadow-lg overflow-hidden bg-background mx-auto ${
        device === "mobile" 
          ? "w-full max-w-[280px] h-[500px] rounded-[2rem] border-[10px]" 
          : "w-full max-w-full h-[500px] rounded-lg border-[6px]"
      }`}>
        
        {/* Mobile Notch */}
        {device === "mobile" && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 rounded-b-xl z-20" />
        )}

        {/* Desktop Top Bar */}
        {device === "desktop" && (
          <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800 rounded-t flex items-center px-4 z-20">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1 text-center">
              <span className="text-white text-xs">presentation.example.com</span>
            </div>
          </div>
        )}

        {/* Screen Content */}
        <div className={`w-full h-full overflow-y-auto flex flex-col bg-card ${
          device === "mobile" ? "rounded-[1.5rem]" : "rounded-b"
        }`}>
          
          {/* Header */}
          <div className={`border-b border-border flex items-center justify-between ${
            device === "mobile" ? "p-4" : "pt-8 px-6 pb-4"
          }`}>
            <div className="flex items-center gap-2">
              {presentationSettings?.showLogo && (
                <div 
                  className={`flex items-center justify-center ${
                    device === "mobile" ? "w-8 h-8" : "w-10 h-10"
                  } rounded-lg`}
                  style={{ background: presentationSettings.brandColor }}
                >
                  <BarChart2 className={device === "mobile" ? "w-4 h-4" : "w-5 h-5"} color="#FFFFFF" />
                </div>
              )}
              <div>
                <h3 className={`font-semibold truncate ${
                  device === "mobile" ? "text-sm" : "text-base"
                }`}>
                  {presentationSettings?.title || 'Presentation'}
                </h3>
                <p className={`text-muted-foreground ${
                  device === "mobile" ? "text-xs" : "text-sm"
                }`}>
                  Live session
                </p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full bg-primary/10 text-primary ${
              device === "mobile" ? "text-xs" : "text-sm"
            }`}>
              {question ? `Question ${currentQuestionIndex + 1}` : 'No question'}
            </div>
          </div>

          {/* Main Content */}
          <div className={`flex-1 overflow-y-auto ${
            device === "mobile" ? "p-4" : "p-6"
          }`}>
            <div className="space-y-6">
              {/* Question Progress */}
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                </div>
              </div>
              
              <div className="text-center">
                <h2 className={`font-semibold text-foreground mb-2 ${
                  device === "mobile" ? "text-lg" : "text-xl"
                }`}>
                  {displayQuestion?.title}
                </h2>
                
                {displayQuestion?.description && (
                  <p className={`text-muted-foreground ${
                    device === "mobile" ? "text-sm" : "text-base"
                  }`}>
                    {displayQuestion?.description}
                  </p>
                )}
                
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="w-4 h-4" />
                    <span>{displayQuestion?.points || 10} points</span>
                  </div>
                  {displayQuestion?.timeLimit && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{displayQuestion.timeLimit}s</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                {renderQuestionTypeContent()}
              </div>
              
              <div className="pt-4 border-t">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-sm font-medium">{questions.length}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{totalPoints}</div>
                    <div className="text-xs text-muted-foreground">Points</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{totalTime}s</div>
                    <div className="text-xs text-muted-foreground">Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Side Buttons */}
        {device === "mobile" && (
          <>
            <div className="absolute -left-2 top-20 w-1 h-10 bg-gray-800 rounded-l"></div>
            <div className="absolute -left-2 top-32 w-1 h-10 bg-gray-800 rounded-l"></div>
            <div className="absolute -right-2 top-20 w-1 h-16 bg-gray-800 rounded-r"></div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Audience Preview
        </h3>
        <div className="flex items-center gap-2">
          {/* Device Toggle */}
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border">
            <Button 
              variant={device === "mobile" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setDevice("mobile")}
              className="h-7 px-2"
            >
              <Smartphone className="w-3 h-3" />
            </Button>
            <Button 
              variant={device === "desktop" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setDevice("desktop")}
              className="h-7 px-2"
            >
              <Monitor className="w-3 h-3" />
            </Button>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
            Live Preview
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="h-full">
          {renderDeviceFrame()}
        </div>
      </div>
      
     
    </div>
  );
};

// SortableQuestionCard Component
interface SortableQuestionCardProps {
  id: string;
  question: Question;
  index: number;
  isCurrent: boolean;
  isSelected: boolean;
  onQuestionClick: (index: number) => void;
  onToggleSelect: (index: number) => void;
  onUpdate: (id: string, updates: Partial<Question>) => void;
  onDelete: (id: string) => void;
  activeDragId?: string | null;
}

const SortableQuestionCard = ({ 
  id,
  question, 
  index, 
  isCurrent,
  isSelected,
  onQuestionClick,
  onToggleSelect,
  onUpdate,
  onDelete,
  activeDragId
}: SortableQuestionCardProps) => {
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

  // Helper function to get the appropriate icon based on question type
  const getTypeIcon = (type: string) => {
    // Handle both UI types and constant types
    if (type === 'multiple-choice' || type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE' || type === 'POLL') 
      return ListChecks;
    if (type === 'open-text' || type === 'OPEN_TEXT') 
      return MessageSquare;
    if (type === 'word-cloud' || type === 'WORD_CLOUD') 
      return Cloud;
    if (type === 'rating-scale' || type === 'RATING') 
      return BarChart2;
    return HelpCircle;
  };

  // Helper function to get the appropriate color based on question type
  const getTypeColor = (type: string) => {
    // Handle both UI types and constant types
    if (type === 'multiple-choice' || type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE' || type === 'POLL')
      return 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400';
    if (type === 'open-text' || type === 'OPEN_TEXT')
      return 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400';
    if (type === 'word-cloud' || type === 'WORD_CLOUD')
      return 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400';
    if (type === 'rating-scale' || type === 'RATING')
      return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400';
    return 'bg-gray-50 dark:bg-gray-950/30 text-gray-700 dark:text-gray-400';
  };

  // Helper function to get display-friendly type name
  const getDisplayType = (question: Question) => {
    const type = question.type;
    if (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE' || type === 'POLL') 
      return 'multiple choice';
    if (type === 'OPEN_TEXT') return 'open text';
    if (type === 'WORD_CLOUD') return 'word cloud';
    if (type === 'RATING') return 'rating scale';
    return type.replace(/-/g, ' ');
  };

  // Helper function to check if question type should have options
  const shouldHaveOptions = (type: string) => {
    return type === 'multiple-choice' || 
           type === 'SINGLE_CHOICE' || 
           type === 'MULTIPLE_CHOICE' || 
           type === 'TRUE_FALSE' || 
           type === 'POLL';
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(question.id, { title: e.target.value });
  };

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(question.id, { points: parseInt(e.target.value) || 10 });
  };

  const handleTimeLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(question.id, { timeLimit: parseInt(e.target.value) || 30 });
  };

  const handleOptionChange = (optionId: string, text: string) => {
    if (!question.options) return;
    
    const newOptions = question.options.map(opt =>
      opt.id === optionId ? { ...opt, text } : opt
    );
    onUpdate(question.id, { options: newOptions });
  };

  const handleOptionCorrectToggle = (optionId: string) => {
    if (!question.options) return;
    
    const newOptions = question.options.map(opt => ({
      ...opt,
      isCorrect: opt.id === optionId ? !opt.isCorrect : false
    }));
    onUpdate(question.id, { options: newOptions });
  };

  const handleAddOption = () => {
    const newOptions = [
      ...(question.options || []),
      { id: Date.now().toString(), text: '', isCorrect: false }
    ];
    onUpdate(question.id, { options: newOptions });
  };

  const handleDeleteOption = (optionId: string) => {
    if (!question.options) return;
    
    const newOptions = question.options.filter(opt => opt.id !== optionId);
    onUpdate(question.id, { options: newOptions });
  };

  const handleDeleteQuestion = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(question.id);
  };

  // Initialize options if they don't exist for multiple choice questions
  const initializeOptionsIfNeeded = () => {
    if (shouldHaveOptions(question.type) && (!question.options || question.options.length === 0)) {
      const defaultOptions = [
        { id: Date.now().toString() + '-1', text: 'Option 1', isCorrect: false },
        { id: Date.now().toString() + '-2', text: 'Option 2', isCorrect: true },
        { id: Date.now().toString() + '-3', text: 'Option 3', isCorrect: false },
        { id: Date.now().toString() + '-4', text: 'Option 4', isCorrect: false }
      ];
      onUpdate(question.id, { options: defaultOptions });
    }
  };

  // Initialize options when question becomes current
  if (isCurrent && shouldHaveOptions(question.type) && (!question.options || question.options.length === 0)) {
    setTimeout(() => initializeOptionsIfNeeded(), 0);
  }

  const TypeIcon = getTypeIcon(question.type);
  const typeColor = getTypeColor(question.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-lg overflow-hidden transition-all cursor-pointer mb-3",
        isCurrent ? 'border-primary ring-1 ring-primary/20 shadow-md' : 
        isSelected ? 'border-blue-500 ring-1 ring-blue-500/20 bg-blue-50/50' :
        'border-border opacity-80 hover:opacity-100 hover:border-muted-foreground',
        isDragging && 'shadow-lg scale-105'
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
        {/* Drag Handle */}
        <div 
          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground no-select"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5" />
        </div>
        
        {/* Selection Checkbox */}
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
              ? 'bg-blue-500 border-blue-500 text-white' 
              : 'border-muted-foreground hover:border-primary hover:bg-primary/10'
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
              <span className={cn("text-xs px-2 py-1 rounded-full capitalize", typeColor)}>
                {getDisplayType(question)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6 text-destructive no-select"
                onClick={handleDeleteQuestion}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          {isCurrent ? (
            <div className="space-y-4">
              <Input 
                value={question.title} 
                onChange={handleTitleChange}
                className="text-lg font-medium border-x-0 border-t-0 border-b rounded-none px-0 focus-visible:ring-0 no-select"
                placeholder="Type your question..."
                autoFocus
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Time Limit (s)</Label>
                  <Input 
                    type="number" 
                    value={question.timeLimit || 30} 
                    onChange={handleTimeLimitChange}
                    className="h-8 no-select"
                    min="5"
                    max="300"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Points</Label>
                  <Input 
                    type="number" 
                    value={question.points || 10} 
                    onChange={handlePointsChange}
                    className="h-8 no-select"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Show options for question types that have options */}
              {shouldHaveOptions(question.type) && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Answer Options</Label>
                  {question.options && question.options.length > 0 ? (
                    <>
                      {question.options.map((opt) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <div 
                            className={cn(
                              "w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer transition-colors no-select",
                              opt.isCorrect ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground hover:border-primary'
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOptionCorrectToggle(opt.id);
                            }}
                          >
                            {opt.isCorrect && <Check className="w-3 h-3" />}
                          </div>
                          <Input 
                            value={opt.text}
                            onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                            className="h-8 no-select"
                            placeholder="Option text"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-muted-foreground no-select"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOption(opt.id);
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddOption();
                        }}
                      >
                        + Add Option
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">No options yet. Click the button below to add options.</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          initializeOptionsIfNeeded();
                        }}
                      >
                        Initialize with default options
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {question.locked && (
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Locked
                </span>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground truncate">{question.title}</div>
          )}
        </div>
      </div>
    </div>
  );
};

// QuickActionsPanel Component
interface QuickActionsPanelProps {
  questions: Question[];
  currentQuestionIndex: number;
  onAddQuestion: (type: string) => void;
  onDuplicateQuestion: () => void;
  onDeleteQuestion: () => void;
  onUpdateQuestion: (updates: Partial<Question>) => void;
  onBulkAction: (action: string) => void;
}

const QuickActionsPanel = ({
  questions,
  currentQuestionIndex,
  onAddQuestion,
  onDuplicateQuestion,
  onDeleteQuestion,
  onUpdateQuestion,
  onBulkAction
}: QuickActionsPanelProps) => {
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const currentQuestion = questions[currentQuestionIndex];

  const handleAddQuickQuestion = (type: string) => {
    onAddQuestion(type);
    setShowMainMenu(false);
  };

  const handleApplyTimeLimit = (seconds: number) => {
    if (currentQuestion) {
      onUpdateQuestion({ timeLimit: seconds });
    }
    setShowTimeMenu(false);
  };

  const handleApplyPoints = (points: number) => {
    if (currentQuestion) {
      onUpdateQuestion({ points: points });
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'duplicate':
        onDuplicateQuestion();
        setShowMainMenu(false);
        break;
      case 'delete':
        onDeleteQuestion();
        setShowMainMenu(false);
        break;
      case 'shuffle':
        if (currentQuestion?.options) {
          const shuffledOptions = [...currentQuestion.options].sort(() => Math.random() - 0.5);
          onUpdateQuestion({ options: shuffledOptions });
          setShowMainMenu(false);
        }
        break;
      case 'reset':
        onUpdateQuestion({
          timeLimit: 30,
          points: 10,
          options: currentQuestion.options?.map((opt) => ({
            ...opt,
            isCorrect: false
          }))
        });
        setShowMainMenu(false);
        break;
    }
  };

  const handleExport = (format: string) => {
    switch (format) {
      case 'json':
        onBulkAction('export-json');
        break;
      case 'csv':
        const csvData = questions.map(q => ({
          Question: q.title,
          Type: q.type,
          Points: q.points || 0,
          'Time Limit': q.timeLimit || 30
        }));
        
        const csvContent = [
          Object.keys(csvData[0]).join(','),
          ...csvData.map(row => Object.values(row).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'questions.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        break;
    }
    setShowExportMenu(false);
  };

  return (
    <div className="fixed right-6 bottom-6 z-50">
      <div className="flex flex-col gap-2 items-end">
        {/* Main Quick Actions Menu */}
        <div className="relative">
          <Button
            size="icon"
            className="rounded-full shadow-lg h-14 w-14"
            onClick={() => {
              setShowMainMenu(!showMainMenu);
              setShowTimeMenu(false);
              setShowExportMenu(false);
            }}
          >
            <Zap className="w-6 h-6" />
          </Button>
          
          {showMainMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-64 bg-card border border-border rounded-lg shadow-xl">
              <div className="p-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">QUICK ACTIONS</p>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-1"
                  onClick={() => handleAddQuickQuestion('multiple-choice')}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-blue-500" />
                      <span>Add Multiple Choice</span>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded border border-border">M</span>
                  </div>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-1"
                  onClick={() => handleAddQuickQuestion('open-text')}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-orange-500" />
                      <span>Add Open Question</span>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded border border-border">O</span>
                  </div>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-1"
                  onClick={() => handleAddQuickQuestion('rating-scale')}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-cyan-500" />
                      <span>Add Rating Scale</span>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded border border-border">R</span>
                  </div>
                </Button>
                
                <div className="border-t border-border my-2"></div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-1"
                  onClick={() => handleQuickAction('duplicate')}
                  disabled={!currentQuestion}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  <span>Duplicate Current</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-1 text-destructive"
                  onClick={() => handleQuickAction('delete')}
                  disabled={!currentQuestion}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span>Delete Current</span>
                </Button>
                
                <div className="border-t border-border my-2"></div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-1"
                  onClick={() => handleQuickAction('shuffle')}
                  disabled={!currentQuestion?.options}
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  <span>Shuffle Answers</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleQuickAction('reset')}
                  disabled={!currentQuestion}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  <span>Reset Question</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Time/Points Quick Set */}
        <div className="relative">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full shadow-lg"
            disabled={!currentQuestion}
            onClick={() => {
              setShowTimeMenu(!showTimeMenu);
              setShowMainMenu(false);
              setShowExportMenu(false);
            }}
          >
            <Timer className="w-5 h-5" />
          </Button>
          
          {showTimeMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-card border border-border rounded-lg shadow-xl">
              <div className="p-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">TIME LIMIT</p>
                <div className="grid grid-cols-2 gap-1">
                  {[15, 30, 45, 60, 90, 120].map((seconds) => (
                    <Button
                      key={seconds}
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8"
                      onClick={() => handleApplyTimeLimit(seconds)}
                    >
                      {seconds}s
                    </Button>
                  ))}
                </div>
                
                <p className="text-xs font-medium text-muted-foreground mt-3 mb-2">POINTS</p>
                <div className="grid grid-cols-2 gap-1">
                  {[0, 10, 20, 30, 50, 100].map((points) => (
                    <Button
                      key={points}
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8"
                      onClick={() => handleApplyPoints(points)}
                    >
                      {points} pts
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export/Import Button */}
        <div className="relative">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full shadow-lg"
            onClick={() => {
              setShowExportMenu(!showExportMenu);
              setShowMainMenu(false);
              setShowTimeMenu(false);
            }}
          >
            <Upload className="w-5 h-5" />
          </Button>
          
          {showExportMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-card border border-border rounded-lg shadow-xl">
              <div className="p-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">EXPORT</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-1"
                  onClick={() => handleExport('json')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span>Export as JSON</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-1"
                  onClick={() => handleExport('csv')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span>Export as CSV</span>
                </Button>
                
                <div className="border-t border-border my-2"></div>
                
                <p className="text-xs font-medium text-muted-foreground mb-2">IMPORT</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => document.getElementById('import-file')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  <span>Import Questions</span>
                </Button>
                <input type="file" id="import-file" className="hidden" accept=".json,.csv" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main EnhancedCreate Component
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
  
  // FIXED: Moved these state variables from inside renderStep3 to here
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
  // Map UI type to actual question type constant
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
    
    selectedQuestions.forEach((selectedIndex) => {
      const currentIndex = updatedQuestions.findIndex((_, idx) => idx === selectedIndex);
      if (currentIndex === -1) return;
      
      const question = updatedQuestions[currentIndex];
      updatedQuestions.splice(currentIndex, 1);
      
      let newIndex;
      switch (direction) {
        case 'up':
          newIndex = Math.max(0, currentIndex - 1);
          break;
        case 'down':
          newIndex = Math.min(updatedQuestions.length, currentIndex);
          break;
        case 'top':
          newIndex = 0;
          break;
        case 'bottom':
          newIndex = updatedQuestions.length;
          break;
        default:
          newIndex = currentIndex;
      }
      
      updatedQuestions.splice(newIndex, 0, question);
    });
    
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
  <div className="min-h-[calc(100vh-64px)] flex flex-col lg:flex-row">
    {/* Left Panel - Context Settings Form */}
    <div className="flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 w-full lg:w-[60%]">
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
    </div>

    {/* Right Panel - Device Preview (hidden on mobile) - EXACTLY LIKE BEFORE */}
    <div className="hidden lg:block w-[40%] bg-muted/30 border-l relative">
      <div className="absolute inset-0 bg-grid-slate-200/50 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800/50" />
      
      <div className="relative h-full p-8 flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Live Preview
          </h3>
          <Badge variant="outline" className="text-xs">
            Auto-updates
          </Badge>
        </div>
        
        <div className="flex-1">
          <DevicePreview 
            title={context.title} 
            themeId={context.theme} 
            questions={context.questions} 
            currentQuestionIndex={0} 
          />
        </div>
        
        <div className="mt-4 p-4 bg-background/80 backdrop-blur rounded-xl border text-xs text-muted-foreground text-center">
          This is how your participants will see the experience on their devices.
          Changes are reflected in real-time.
        </div>
      </div>
    </div>
  </div>
);
  // NEW STEP 3 - Using builder interface
  const renderStep3 = () => {
    const currentQuestion = context.questions[currentQuestionIndex] || null;

    return (
      <div className="h-[calc(100vh-64px)] flex flex-col lg:flex-row w-full">
        {/* Mobile Tab Navigation */}
        <div className="lg:hidden border-b border-border bg-card">
          <div className="flex">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'workspace' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
              }`}
            >
              Workspace
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'preview' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {/* Left Panel - Question Types & Bulk Actions */}
        <div className={`w-full lg:w-80 border-r border-border bg-card overflow-y-auto custom-scrollbar ${
          activeTab === 'workspace' ? 'block' : 'hidden lg:block'
        }`}>
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Builder Tools</h2>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setActiveTab('workspace')}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setLeftPanelTab('types')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  leftPanelTab === 'types' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Question Types
              </button>
              <button
                onClick={() => setLeftPanelTab('bulk')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  leftPanelTab === 'bulk' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Bulk Actions
              </button>
            </div>

            {leftPanelTab === 'types' ? (
              <QuestionTypeSelector
                onSelect={addQuestion}
                selectedType={currentQuestion?.type}
              />
            ) : (
              <BulkActions
                questions={context.questions}
                onUpdateQuestions={handleBulkUpdate}
                selectedQuestions={selectedQuestions}
                onSelectAll={handleSelectAllQuestions}
                onClearSelection={handleClearSelection}
                onReorderQuestions={handleReorderQuestions}
              />
            )}
          </div>
        </div>

        {/* Center Panel - Question Workspace */}
        <div className={`flex-1 flex flex-col overflow-hidden ${
          activeTab === 'workspace' ? 'block' : 'hidden lg:block'
        }`}>
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-border bg-card">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-1 truncate">
                {context.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {context.questions?.length} {context.questions?.length === 1 ? 'question' : 'questions'}
                {hasUnsavedChanges && ' • Unsaved changes'}
              </p>
            </div>
            
            {/* Save Status and Actions - Moved next to title */}
            <div className="flex items-center gap-2 ml-4">
              {/* Undo/Redo Controls */}
              <div className="flex items-center gap-1 mr-2">
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
              
              {saveStatus === 'saving' ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Saving...
                </div>
              ) : saveStatus === 'saved' ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="w-4 h-4" />
                  Saved
                </div>
              ) : lastSaved ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <SaveIcon className="w-4 h-4" />
                  Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <SaveIcon className="w-4 h-4" />
                  Not saved
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSave}
                className="hidden md:flex"
                title="Save (Ctrl+S)"
              >
                <SaveIcon className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
            {context.questions?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                  <FileQuestion className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No Questions Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  Start building your presentation by selecting a question type from the left panel
                </p>
                <Button
                  variant="default"
                  onClick={() => setLeftPanelTab('types')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-4">
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
                    {context.questions.map((question, index) => {
                      const isCurrent = currentQuestionIndex === index;
                      const isSelected = selectedQuestions.includes(index);
                      
                      return (
                        <SortableQuestionCard
                          key={question.id}
                          id={question.id}
                          question={question}
                          index={index}
                          isCurrent={isCurrent}
                          isSelected={isSelected}
                          onQuestionClick={setCurrentQuestionIndex}
                          onToggleSelect={toggleQuestionSelection}
                          onUpdate={updateQuestion}
                          onDelete={deleteQuestion}
                          activeDragId={activeDragId}
                        />
                      );
                    })}
                  </SortableContext>
                  
                  <DragOverlay>
                    {activeDragId && (
                      <div className="border rounded-lg overflow-hidden bg-card shadow-xl opacity-80 rotate-2">
                        <div className="p-4">
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-5 h-5 text-muted-foreground" />
                            <span className="font-medium">
                              {context.questions.find(q => q.id === activeDragId)?.title}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
                
                {/* Add Question Button */}
                <div className="p-4 border-2 border-dashed rounded-xl text-center bg-muted/30 hover:bg-muted/50 transition-colors">
                  <p className="text-sm text-muted-foreground mb-4">Add a new question type</p>
                  <QuestionTypeSelector onSelect={addQuestion} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className={`w-full lg:w-96 xl:w-[480px] border-l border-border bg-card overflow-hidden ${
          activeTab === 'preview' ? 'block' : 'hidden lg:block'
        }`}>
          <PreviewPanel
            question={currentQuestion}
            presentationSettings={context.settings}
            questions={context.questions}
            currentQuestionIndex={currentQuestionIndex}
          />
        </div>

        {/* Floating Quick Actions Panel */}
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
          onBulkAction={handleQuickAction}
        />
      </div>
    );
  };

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
          {/* NEXT STEP BUTTON - Show from step 2 to 4 */}
          {step > 1 && step < 5 && (
            <Button variant="outline" className="gap-2" onClick={() => setStep(step + 1)}>
              Next Step <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <main className="flex-1 overflow-hidden w-full">
        <div className="p-0 h-full">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          
          {step > 1 && step < 5 && step !== 3 && (
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 md:pt-8 border-t mt-8 p-4 md:p-8">
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
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 md:pt-8 border-t mt-8 p-4 md:p-8">
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
      </main>
    </div>
  );
}