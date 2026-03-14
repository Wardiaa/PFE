import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";
import { type Question } from "../types";
import { 
  GripVertical, 
  Trash2, 
  Check, 
  Lock,
  ListChecks,
  MessageSquare,
  Cloud,
  BarChart2,
  HelpCircle,
  Sparkles,
  Timer,
  Star,
  ChevronRight,
  X,
  Palette
} from "lucide-react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect } from "react";

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

export function SortableQuestionCard({ 
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
}: SortableQuestionCardProps) {
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
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

  const getTypeIcon = (type: string) => {
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

  const getTypeStyles = (type: string) => {
    if (type === 'multiple-choice' || type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE' || type === 'POLL')
      return {
        bg: 'bg-teal-50 dark:bg-teal-950/30',
        text: 'text-teal-700 dark:text-teal-400',
        border: 'border-teal-200 dark:border-teal-800',
        icon: 'text-teal-500',
        gradient: 'from-teal-500 to-teal-400'
      };
    if (type === 'open-text' || type === 'OPEN_TEXT')
      return {
        bg: 'bg-cyan-50 dark:bg-cyan-950/30',
        text: 'text-cyan-700 dark:text-cyan-400',
        border: 'border-cyan-200 dark:border-cyan-800',
        icon: 'text-cyan-500',
        gradient: 'from-cyan-500 to-cyan-400'
      };
    if (type === 'word-cloud' || type === 'WORD_CLOUD')
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/30',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
        icon: 'text-orange-500',
        gradient: 'from-orange-500 to-orange-400'
      };
    if (type === 'rating-scale' || type === 'RATING')
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        icon: 'text-emerald-500',
        gradient: 'from-emerald-500 to-emerald-400'
      };
    return {
      bg: 'bg-slate-50 dark:bg-slate-950/30',
      text: 'text-slate-700 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-800',
      icon: 'text-slate-500',
      gradient: 'from-slate-500 to-slate-400'
    };
  };

  const getDisplayType = (question: Question) => {
    const type = question.type;
    if (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE' || type === 'POLL') 
      return 'multiple choice';
    if (type === 'OPEN_TEXT') return 'open text';
    if (type === 'WORD_CLOUD') return 'word cloud';
    if (type === 'RATING') return 'rating scale';
    return type.replace(/-/g, ' ');
  };

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

  // Options handlers (only for multiple choice types)
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

  // Rating scale specific handlers
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const max = parseInt(e.target.value) || 5;
    // Clamp max to be at least 2 and at most 10
    const clampedMax = Math.max(2, Math.min(10, max));
    // Always keep min at 1
    onUpdate(question.id, { scale: { min: 1, max: clampedMax } });
  };

  const handleMinLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const labels = { ...(question.labels || {}), min: e.target.value };
    onUpdate(question.id, { labels });
  };

  const handleMaxLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const labels = { ...(question.labels || {}), max: e.target.value };
    onUpdate(question.id, { labels });
  };

  const handleDisplayStyleChange = (style: 'numbers' | 'stars' | 'hearts' | 'smileys') => {
    onUpdate(question.id, { displayStyle: style });
  };

  const handleDeleteQuestion = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(question.id);
  };

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

  // Initialize scale with min=1 for rating questions
  useEffect(() => {
    if (isCurrent && (question.type === 'rating-scale' || question.type === 'RATING')) {
      const currentScale = question.scale;
      
      // If no scale exists, create one with min=1, max=5
      if (!currentScale) {
        onUpdate(question.id, { scale: { min: 1, max: 5 } });
      } 
      // If scale exists but min is not 1, update it to 1
      else if (currentScale.min !== 1) {
        onUpdate(question.id, { 
          scale: { 
            min: 1, 
            max: currentScale.max || 5
          } 
        });
      }
      // If scale exists but max is undefined, set a default
      else if (currentScale.max === undefined) {
        onUpdate(question.id, { 
          scale: { 
            min: 1, 
            max: 5 
          } 
        });
      }
    }
  }, [isCurrent, question.id, question.type, question.scale, onUpdate]);

  // Only auto-initialize options for multiple choice
  useEffect(() => {
    if (isCurrent && shouldHaveOptions(question.type) && (!question.options || question.options.length === 0)) {
      initializeOptionsIfNeeded();
    }
  }, [isCurrent, question.type, question.options]);

  const TypeIcon = getTypeIcon(question.type);
  const typeStyles = getTypeStyles(question.type);

  const getCardBorderStyle = () => {
    if (isCurrent) {
      return 'border-indigo-200 ring-2 ring-indigo-100 ring-offset-0';
    }
    if (isSelected) {
      return 'border-blue-200 bg-blue-50/30';
    }
    return 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50';
  };

  const isRatingScale = question.type === 'rating-scale' || question.type === 'RATING';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative rounded-2xl border bg-white/90 backdrop-blur-sm transition-all duration-200 mb-3",
        getCardBorderStyle(),
        isDragging && 'shadow-xl shadow-indigo-100/50 scale-[1.02] rotate-[0.5deg]',
        !isCurrent && !isSelected && 'hover:shadow-md'
      )}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('.no-select')) return;
        if ((e.target as HTMLElement).tagName === 'INPUT') return;
        if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
        if ((e.target as HTMLElement).closest('button')) return;
        onQuestionClick(index);
      }}
    >
      {isCurrent && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-indigo-400 rounded-l-2xl" />
      )}
      
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div 
            className="mt-0.5 cursor-grab active:cursor-grabbing text-slate-400 hover:text-indigo-500 transition-colors no-select"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </div>
          
          <div 
            className="mt-0.5 cursor-pointer no-select"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(index);
            }}
          >
            <div className={cn(
              "w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-150",
              isSelected 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200' 
                : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'
            )}>
              {isSelected && <Check className="w-3 h-3" />}
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">
                Q{index + 1}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-wider",
                typeStyles.bg,
                typeStyles.text,
                typeStyles.border
              )}>
                <TypeIcon className={cn("w-3 h-3", typeStyles.icon)} />
                {getDisplayType(question)}
              </span>
              {question.locked && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 text-[9px] font-bold uppercase tracking-wider">
                  <Lock className="w-3 h-3" />
                  Locked
                </span>
              )}
            </div>
            
            <button
              onClick={handleDeleteQuestion}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all no-select"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isCurrent ? (
          <div className="space-y-5 pl-7">
            <div className="relative">
              <Input 
                value={question.title} 
                onChange={handleTitleChange}
                onFocus={() => setFocusedInput('title')}
                onBlur={() => setFocusedInput(null)}
                className={cn(
                  "w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium transition-all",
                  focusedInput === 'title' 
                    ? '!border-indigo-500 !border-2 !ring-0 !outline-none bg-white' 
                    : 'border border-slate-200 hover:border-slate-300'
                )}
                placeholder="Type your question here..."
                autoFocus
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Timer className="w-3 h-3" />
                  Time Limit
                </Label>
                <Input 
                  type="number" 
                  value={question.timeLimit || 30} 
                  onChange={handleTimeLimitChange}
                  onFocus={() => setFocusedInput('time')}
                  onBlur={() => setFocusedInput(null)}
                  className={cn(
                    "h-9 bg-slate-50 border rounded-lg text-xs font-medium transition-all",
                    focusedInput === 'time' 
                      ? '!border-indigo-500 !border-2 !ring-0 !outline-none bg-white' 
                      : 'border border-slate-200 hover:border-slate-300'
                  )}
                  min="5"
                  max="300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Star className="w-3 h-3" />
                  Points
                </Label>
                <Input 
                  type="number" 
                  value={question.points || 10} 
                  onChange={handlePointsChange}
                  onFocus={() => setFocusedInput('points')}
                  onBlur={() => setFocusedInput(null)}
                  className={cn(
                    "h-9 bg-slate-50 border rounded-lg text-xs font-medium transition-all",
                    focusedInput === 'points' 
                      ? '!border-indigo-500 !border-2 !ring-0 !outline-none bg-white' 
                      : 'border border-slate-200 hover:border-slate-300'
                  )}
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {isRatingScale && (
              <>
                {/* Max Value Input Only - Min Value is fixed at 1 */}
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Maximum Rating Value
                  </Label>
                  <Input 
                    type="number" 
                    value={question.scale?.max || 5} 
                    onChange={handleMaxChange}
                    onFocus={() => setFocusedInput('max')}
                    onBlur={() => setFocusedInput(null)}
                    className={cn(
                      "h-9 bg-slate-50 border rounded-lg text-xs font-medium transition-all",
                      focusedInput === 'max' 
                        ? '!border-indigo-500 !border-2 !ring-0 !outline-none bg-white' 
                        : 'border border-slate-200 hover:border-slate-300'
                    )}
                    min="2"
                    max="10"
                  />
                  <p className="text-[8px] text-slate-400 mt-1">
                    Scale from 1 to {question.scale?.max || 5} ({question.scale?.max || 5} options)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Min Label
                    </Label>
                    <Input 
                      value={question.labels?.min || ''} 
                      onChange={handleMinLabelChange}
                      onFocus={() => setFocusedInput('minLabel')}
                      onBlur={() => setFocusedInput(null)}
                      className={cn(
                        "h-9 bg-slate-50 border rounded-lg text-xs font-medium transition-all",
                        focusedInput === 'minLabel' 
                          ? '!border-indigo-500 !border-2 !ring-0 !outline-none bg-white' 
                          : 'border border-slate-200 hover:border-slate-300'
                      )}
                      placeholder="e.g., Poor"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Max Label
                    </Label>
                    <Input 
                      value={question.labels?.max || ''} 
                      onChange={handleMaxLabelChange}
                      onFocus={() => setFocusedInput('maxLabel')}
                      onBlur={() => setFocusedInput(null)}
                      className={cn(
                        "h-9 bg-slate-50 border rounded-lg text-xs font-medium transition-all",
                        focusedInput === 'maxLabel' 
                          ? '!border-indigo-500 !border-2 !ring-0 !outline-none bg-white' 
                          : 'border border-slate-200 hover:border-slate-300'
                      )}
                      placeholder="e.g., Excellent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Palette className="w-3 h-3" />
                    Display Style
                  </Label>
                  <div className="flex gap-2">
                    {(['numbers', 'stars', 'hearts', 'smileys'] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() => handleDisplayStyleChange(style)}
                        className={cn(
                          "flex-1 py-2 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all",
                          (question.displayStyle || 'numbers') === style
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-300'
                        )}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!isRatingScale && shouldHaveOptions(question.type) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Answer Options
                  </Label>
                  <span className="text-[8px] text-slate-400">
                    {question.options?.length || 0} options
                  </span>
                </div>

                {question.options && question.options.length > 0 ? (
                  <div className="space-y-2">
                    {question.options.map((opt, optIndex) => (
                      <div key={opt.id} className="flex items-center gap-2 group">
                        <div 
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all no-select shrink-0",
                            opt.isCorrect 
                              ? 'border-emerald-500 bg-emerald-500 shadow-sm shadow-emerald-200' 
                              : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOptionCorrectToggle(opt.id);
                          }}
                        >
                          {opt.isCorrect && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <Input 
                          value={opt.text}
                          onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                          onFocus={() => setFocusedInput(`option-${optIndex}`)}
                          onBlur={() => setFocusedInput(null)}
                          className={cn(
                            "h-9 bg-slate-50 border rounded-lg text-xs transition-all",
                            focusedInput === `option-${optIndex}`
                              ? '!border-indigo-500 !border-2 !ring-0 !outline-none bg-white' 
                              : 'border border-slate-200 hover:border-slate-300 group-hover:bg-white'
                          )}
                          placeholder={`Option ${optIndex + 1}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button 
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 no-select"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOption(opt.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddOption();
                      }}
                      className="mt-2 w-full py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 hover:bg-indigo-50 hover:border-indigo-300 transition-all group flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600"
                    >
                      <Sparkles className="w-3 h-3 group-hover:text-indigo-500" />
                      Add Option
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-500 mb-3">No options yet</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        initializeOptionsIfNeeded();
                      }}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-sm shadow-indigo-200"
                    >
                      Initialize with defaults
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="pl-7 flex items-center justify-between">
            <p className="text-sm text-slate-600 truncate max-w-[70%]">
              {question.title || 'Untitled question'}
            </p>
            <div className="flex items-center gap-3">
              {isRatingScale && question.displayStyle && (
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200">
                  {question.displayStyle}
                </span>
              )}
              {question.points !== undefined && question.points > 0 && (
                <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                  <Star className="w-2.5 h-2.5 fill-amber-400" />
                  {question.points}
                </span>
              )}
              {question.timeLimit && (
                <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                  <Timer className="w-2.5 h-2.5" />
                  {question.timeLimit}s
                </span>
              )}
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}