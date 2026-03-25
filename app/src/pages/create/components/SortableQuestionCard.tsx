// SortableQuestionCard.tsx - OPTIMIZED FOR GRID VIEW
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
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
  ChevronDown,
  ChevronUp,
  X,
  Palette,
  Copy,
  MoreVertical
} from "lucide-react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  viewMode?: 'grid' | 'list';
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
  activeDragId,
  viewMode = 'list'
}: SortableQuestionCardProps) {
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(isCurrent);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const isGridView = viewMode === 'grid';

  useEffect(() => {
    setIsExpanded(isCurrent);
  }, [isCurrent]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  };

  const getTypeIcon = (type: string) => {
    if (type === 'multiple-choice' || type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE' || type === 'POLL') 
      return { icon: ListChecks, color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-200' };
    if (type === 'open-text' || type === 'OPEN_TEXT') 
      return { icon: MessageSquare, color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-200' };
    if (type === 'word-cloud' || type === 'WORD_CLOUD') 
      return { icon: Cloud, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' };
    if (type === 'rating-scale' || type === 'RATING') 
      return { icon: BarChart2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    return { icon: HelpCircle, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' };
  };

  const getDisplayType = (question: Question) => {
    const type = question.type;
    if (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE' || type === 'POLL') 
      return 'MC';
    if (type === 'OPEN_TEXT') return 'Text';
    if (type === 'WORD_CLOUD') return 'Cloud';
    if (type === 'RATING') return 'Rating';
    return type.replace(/-/g, ' ').substring(0, 6);
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

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const max = parseInt(e.target.value) || 5;
    const clampedMax = Math.max(2, Math.min(10, max));
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

  const handleDuplicate = () => {
    const duplicate = {
      ...question,
      id: Date.now().toString(),
      title: `${question.title} (Copy)`
    };
    onUpdate(duplicate.id, duplicate);
    setShowMenu(false);
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

  useEffect(() => {
    if (isExpanded && (question.type === 'rating-scale' || question.type === 'RATING')) {
      const currentScale = question.scale;
      if (!currentScale) {
        onUpdate(question.id, { scale: { min: 1, max: 5 } });
      } else if (currentScale.min !== 1) {
        onUpdate(question.id, { scale: { min: 1, max: currentScale.max || 5 } });
      }
    }
  }, [isExpanded, question.id, question.type, question.scale, onUpdate]);

  useEffect(() => {
    if (isExpanded && shouldHaveOptions(question.type) && (!question.options || question.options.length === 0)) {
      initializeOptionsIfNeeded();
    }
  }, [isExpanded, question.type, question.options]);

  const typeData = getTypeIcon(question.type);
  const TypeIcon = typeData.icon;
  const isRatingScale = question.type === 'rating-scale' || question.type === 'RATING';

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={false}
      animate={isExpanded ? 'expanded' : 'collapsed'}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        "group relative rounded-xl transition-all duration-200",
        isDragging && 'shadow-2xl scale-[1.01] rotate-[0.5deg]',
        isCurrent 
          ? "bg-white shadow-lg shadow-indigo-100/50 ring-2 ring-indigo-200" 
          : isSelected
          ? "bg-indigo-50/50 border border-indigo-200 hover:shadow-md"
          : "bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md"
      )}
    >
      {/* Accent bar for current */}
      {isCurrent && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-r-full" />
      )}

      <div className="p-3 sm:p-4">
        {/* Header Row - Optimized for grid view */}
        <div className="flex items-start gap-1.5 sm:gap-2">
          {/* Drag Handle - Hide on mobile grid? No, keep but smaller */}
          <div 
            className={cn(
              "mt-0.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-500 transition-colors",
              isDragging && 'cursor-grabbing text-indigo-500',
              isGridView && "sm:block"
            )}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>

          {/* Selection Checkbox */}
          <div 
            className="mt-0.5 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(index);
            }}
          >
            <div className={cn(
              "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md border flex items-center justify-center transition-all",
              isSelected 
                ? "bg-indigo-600 border-indigo-600 shadow-sm shadow-indigo-200" 
                : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50"
            )}>
              {isSelected && <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />}
            </div>
          </div>

          {/* Type Badge & Number */}
          <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
            <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-md flex-shrink-0">
              #{index + 1}
            </span>
            <div className={cn(
              "inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-medium flex-shrink-0",
              typeData.bg,
              typeData.color,
              `border ${typeData.border}`
            )}>
              <TypeIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="hidden xs:inline">{getDisplayType(question)}</span>
            </div>
            {question.locked && (
              <span className="inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-600 text-[8px] sm:text-[9px] font-medium flex-shrink-0">
                <Lock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              </span>
            )}
          </div>

          {/* Stats and Controls - Adjusted for grid view */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
            {/* Points Badge - Simplified in grid view */}
            {question.points > 0 && (
              <div className={cn(
                "flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 font-medium",
                isGridView ? "text-[8px] sm:text-[9px]" : "text-[9px] sm:text-[10px]"
              )}>
                <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-amber-400" />
                <span className={cn(isGridView && "hidden xs:inline")}>{question.points}</span>
              </div>
            )}
            
            {/* Time Badge - Simplified in grid view */}
            {question.timeLimit && (
              <div className={cn(
                "flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium",
                isGridView ? "text-[8px] sm:text-[9px]" : "text-[9px] sm:text-[10px]"
              )}>
                <Timer className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                <span className={cn(isGridView && "hidden xs:inline")}>{question.timeLimit}s</span>
              </div>
            )}
            
            {/* Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <MoreVertical className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
              
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-20"
                  >
                    <button
                      onClick={handleDuplicate}
                      className="w-full px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Copy className="w-3 h-3" />
                      Duplicate
                    </button>
                    <button
                      onClick={() => onDelete(question.id)}
                      className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Expand/Collapse Toggle - Always visible and properly sized */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isExpanded) onQuestionClick(index);
                else setIsExpanded(false);
              }}
              className={cn(
                "p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0",
                isGridView && "ml-0.5"
              )}
            >
              {isExpanded ? <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            </button>
          </div>
        </div>

        {/* Title - Always visible */}
        <div 
          className={cn(
            "mt-2 cursor-pointer",
            !isExpanded && "pl-6 sm:pl-7"
          )}
          onClick={() => !isExpanded && onQuestionClick(index)}
        >
          <p className={cn(
            "font-medium text-slate-800",
            !isExpanded && "text-xs sm:text-sm line-clamp-2",
            isExpanded && "text-sm sm:text-base"
          )}>
            {question.title || "Untitled question"}
          </p>
          {!isExpanded && question.description && (
            <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-1 mt-0.5">{question.description}</p>
          )}
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4 pl-6 sm:pl-7 border-t border-slate-100 pt-3 sm:pt-4">
                {/* Description Input */}
                <div>
                  <Input 
                    value={question.description || ''} 
                    onChange={(e) => onUpdate(question.id, { description: e.target.value })}
                    placeholder="Add a description (optional)"
                    className="text-xs sm:text-sm bg-slate-50 border-slate-200 rounded-lg sm:rounded-xl focus:border-indigo-300"
                  />
                </div>

                {/* Time & Points */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Timer className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      Time
                    </Label>
                    <Input 
                      type="number" 
                      value={question.timeLimit || 30} 
                      onChange={handleTimeLimitChange}
                      className="h-8 sm:h-9 text-xs sm:text-sm bg-slate-50 border-slate-200 rounded-lg sm:rounded-xl"
                      min="5"
                      max="300"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      Points
                    </Label>
                    <Input 
                      type="number" 
                      value={question.points || 10} 
                      onChange={handlePointsChange}
                      className="h-8 sm:h-9 text-xs sm:text-sm bg-slate-50 border-slate-200 rounded-lg sm:rounded-xl"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                {/* Rating Scale Specific */}
                {isRatingScale && (
                  <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-lg sm:rounded-xl border border-indigo-100">
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <Label className="text-[9px] sm:text-[10px] font-bold text-slate-500">Max Rating</Label>
                        <Input 
                          type="number" 
                          value={question.scale?.max || 5} 
                          onChange={handleMaxChange}
                          className="mt-1 h-8 sm:h-9 text-xs"
                          min="2"
                          max="10"
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] sm:text-[10px] font-bold text-slate-500">Style</Label>
                        <div className="flex gap-1 mt-1">
                          {(['numbers', 'stars', 'hearts', 'smileys'] as const).map((style) => (
                            <button
                              key={style}
                              onClick={() => handleDisplayStyleChange(style)}
                              className={cn(
                                "flex-1 py-1 rounded-md text-[8px] sm:text-[9px] font-medium transition-all",
                                (question.displayStyle || 'numbers') === style
                                  ? "bg-indigo-600 text-white shadow-sm"
                                  : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300"
                              )}
                            >
                              {style === 'numbers' ? '1-10' : style === 'stars' ? '★' : style === 'hearts' ? '❤' : '☺'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <Input 
                        value={question.labels?.min || ''} 
                        onChange={handleMinLabelChange}
                        placeholder="Min label"
                        className="text-xs h-8 sm:h-9"
                      />
                      <Input 
                        value={question.labels?.max || ''} 
                        onChange={handleMaxLabelChange}
                        placeholder="Max label"
                        className="text-xs h-8 sm:h-9"
                      />
                    </div>
                  </div>
                )}

                {/* Multiple Choice Options */}
                {!isRatingScale && shouldHaveOptions(question.type) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Options
                      </Label>
                      <span className="text-[8px] sm:text-[9px] text-slate-400">{question.options?.length || 0}</span>
                    </div>

                    {question.options && question.options.length > 0 ? (
                      <div className="space-y-1.5 sm:space-y-2">
                        {question.options.map((opt, optIndex) => (
                          <div key={opt.id} className="flex items-center gap-1.5 sm:gap-2 group">
                            <div 
                              className={cn(
                                "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all shrink-0",
                                opt.isCorrect 
                                  ? "border-emerald-500 bg-emerald-500 shadow-sm" 
                                  : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50"
                              )}
                              onClick={() => handleOptionCorrectToggle(opt.id)}
                            >
                              {opt.isCorrect && <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />}
                            </div>
                            <Input 
                              value={opt.text}
                              onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                              className="h-7 sm:h-9 text-xs sm:text-sm bg-slate-50 border-slate-200 rounded-lg flex-1"
                              placeholder={`Option ${optIndex + 1}`}
                            />
                            <button 
                              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                              onClick={() => handleDeleteOption(opt.id)}
                            >
                              <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                          </div>
                        ))}
                        
                        <button
                          onClick={handleAddOption}
                          className="w-full py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-dashed border-slate-300 bg-slate-50/50 hover:bg-indigo-50 hover:border-indigo-300 transition-all group flex items-center justify-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] font-medium text-slate-500 hover:text-indigo-600"
                        >
                          <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          Add option
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                        <p className="text-[10px] sm:text-xs text-slate-500 mb-2">No options added yet</p>
                        <button
                          onClick={initializeOptionsIfNeeded}
                          className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] sm:text-[10px] font-medium transition-all"
                        >
                          Add default options
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}