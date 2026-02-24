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
  HelpCircle
} from "lucide-react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

  const getTypeColor = (type: string) => {
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
           type === 'POLL' ||
           type === 'rating-scale' ||
           type === 'RATING';
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
}