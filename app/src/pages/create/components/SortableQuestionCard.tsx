// SortableQuestionCard.tsx - Combined: Mentimeter card style + smooth grid transitions
import { cn } from "../../../lib/utils";
import { type Question } from "../types";
import {
  GripVertical,
  Trash2,
  Check,
  ListChecks,
  MessageSquare,
  Cloud,
  HelpCircle,
  Timer,
  Star,
  Copy,
  MoreVertical,
  ChevronDown,
  SlidersHorizontal,
  ListOrdered,
  Grid3X3,
  Vote,
  BarChart3,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect, useRef } from "react";

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
  viewMode?: "grid" | "list";
}

// Updated TYPE_META with all question types
const TYPE_META: Record<string, { icon: React.ElementType; label: string }> = {
  // Multiple Choice variants
  "multiple-choice": { icon: ListChecks, label: "MCQ" },
  "SINGLE_CHOICE": { icon: ListChecks, label: "MCQ" },
  "MULTIPLE_CHOICE": { icon: ListChecks, label: "MCQ" },
  // Open Text
  "open-text": { icon: MessageSquare, label: "Open Text" },
  "OPEN_TEXT": { icon: MessageSquare, label: "Open Text" },
  // Word Cloud
  "word-cloud": { icon: Cloud, label: "Word Cloud" },
  "WORD_CLOUD": { icon: Cloud, label: "Word Cloud" },
  // Rating Scale
  "rating-scale": { icon: Star, label: "Rating Scale" },
  "RATING": { icon: Star, label: "Rating Scale" },
  "RATING_SCALE": { icon: Star, label: "Rating Scale" },
  // Scales (multiple statements)
  "scaling": { icon: SlidersHorizontal, label: "Scales" },
  "SCALING": { icon: SlidersHorizontal, label: "Scales" },
  // Ranking
  "ranking": { icon: ListOrdered, label: "Ranking" },
  "RANKING": { icon: ListOrdered, label: "Ranking" },
  // Grid 2x2
  "grid-2x2": { icon: Grid3X3, label: "Grid 2×2" },
  "GRID_2X2": { icon: Grid3X3, label: "Grid 2×2" },
  // Vote
  "vote": { icon: Vote, label: "Vote" },
  "VOTE": { icon: Vote, label: "Vote" },
};

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
  viewMode = "list",
}: SortableQuestionCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(isCurrent);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsExpanded(isCurrent);
  }, [isCurrent]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDuplicate = () => {
    const duplicate: Question = {
      ...question,
      id: Date.now().toString(),
      title: `${question.title} (Copy)`,
    };
    onUpdate(duplicate.id, duplicate);
    setShowMenu(false);
  };

  const meta = TYPE_META[question.type] ?? { icon: HelpCircle, label: "Question" };
  const TypeIcon = meta.icon;
  
  // Check if this is a type that has options/items to preview
  const isChoiceType = ["multiple-choice", "SINGLE_CHOICE", "MULTIPLE_CHOICE"].includes(question.type);
  const isRankingType = question.type === "ranking" || question.type === "RANKING";
  const isScalingType = question.type === "scaling" || question.type === "SCALING";
  const isGrid2x2Type = question.type === "grid-2x2" || question.type === "GRID_2X2";
  const isVoteType = question.type === "vote" || question.type === "VOTE";
  const isRatingType = question.type === "rating-scale" || question.type === "RATING" || question.type === "RATING_SCALE";
  const isOpenTextType = question.type === "open-text" || question.type === "OPEN_TEXT";
  const isWordCloudType = question.type === "word-cloud" || question.type === "WORD_CLOUD";
  
  const isGridView = viewMode === "grid";

  // Helper to render preview items with unified dot + text style (for types that have list items)
  const renderPreviewItems = () => {
    const items: Array<{ id: string; text: string; isCorrect?: boolean }> = [];
    
    // Collect items based on question type
    if (isChoiceType && question.options) {
      items.push(...question.options);
    } else if (isRankingType && question.options) {
      items.push(...question.options);
    } else if (isScalingType && (question as any).statements) {
      items.push(...(question as any).statements.map((s: { id: string; text: string }) => ({ id: s.id, text: s.text })));
    } else if (isVoteType && question.options) {
      items.push(...question.options);
    }
    
    if (items.length === 0) return null;
    
    return (
      <div className="space-y-1.5">
        {items.slice(0, 4).map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-1 px-1 min-w-0">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                item.isCorrect ? "bg-indigo-500" : "bg-slate-200"
              )}
            />
            <span
              className={cn(
                "text-[11px] font-bold truncate",
                item.isCorrect ? "text-indigo-900" : "text-slate-500"
              )}
            >
              {item.text || "Empty item"}
            </span>
          </div>
        ))}
        {items.length > 4 && (
          <p className="text-[10px] text-slate-300 font-bold pl-4">
            + {items.length - 4} more
          </p>
        )}
      </div>
    );
  };

  // Helper to render special previews for types that don't use the unified list style
  const renderSpecialPreview = () => {
    // Grid 2x2 - show axis preview
    if (isGrid2x2Type) {
      const xAxis = (question as any).xAxis;
      const yAxis = (question as any).yAxis;
      const items = question.options || [];
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[9px] text-slate-400 px-1">
            <span className="font-mono">X: {xAxis?.label || "Effort"}</span>
            <span className="font-mono">Y: {yAxis?.label || "Impact"}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {items.slice(0, 3).map((item) => (
              <span key={item.id} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 truncate max-w-[80px]">
                {item.text || "Item"}
              </span>
            ))}
            {items.length > 3 && (
              <span className="text-[10px] text-slate-300">+{items.length - 3}</span>
            )}
          </div>
        </div>
      );
    }

    // Rating Scale - show star preview
    if (isRatingType) {
      const scaleMax = (question as any).scale?.max || 5;
      const minLabel = (question as any).labels?.min || "Low";
      const maxLabel = (question as any).labels?.max || "High";
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: Math.min(scaleMax, 5) }).map((_, i) => (
              <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
            ))}
            {scaleMax > 5 && (
              <span className="text-[9px] text-slate-400 ml-1">+{scaleMax - 5}</span>
            )}
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 px-0.5">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        </div>
      );
    }

    // Open Text - keep original styling (no changes)
    if (isOpenTextType) {
      return null; // Return null to use the original multiple-choice style? No, Open Text originally had no preview items
    }

    // Word Cloud - keep original styling (no changes)
    if (isWordCloudType) {
      return null; // Return null to use the original multiple-choice style? No, Word Cloud originally had no preview items
    }

    return null;
  };

  // Check if there's any expandable content
  const hasExpandableContent = () => {
    if (question.description) return true;
    if (isChoiceType && question.options && question.options.length > 0) return true;
    if (isRankingType && question.options && question.options.length > 0) return true;
    if (isScalingType && (question as any).statements && (question as any).statements.length > 0) return true;
    if (isGrid2x2Type) return true;
    if (isVoteType && question.options && question.options.length > 0) return true;
    if (isRatingType) return true;
    // Open Text and Word Cloud don't show preview items originally, so only description triggers expand
    return false;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onQuestionClick(index)}
      className={cn(
        "group relative bg-white rounded-2xl transition-all duration-200 cursor-pointer",
        isDragging && "shadow-2xl z-50 scale-[1.02]",
        isCurrent
          ? "ring-[2.5px] ring-indigo-500"
          : "border border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-md",
        isSelected && !isCurrent && "border-indigo-300 bg-indigo-50/10"
      )}
    >
      {/* Left side controls */}
      <div className="absolute left-4 top-4 flex flex-col items-center gap-3">
        {/* FIX: drag handle — touch-none prevents the browser from hijacking the
            pointer/touch sequence for scrolling, which is the most common reason
            dnd-kit drag doesn't start on mobile or in scrollable containers.
            data-no-dnd="false" ensures the handle is NOT excluded from drag. */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "p-1 rounded-md text-slate-300 hover:text-indigo-500 hover:bg-slate-50 transition-colors cursor-grab active:cursor-grabbing touch-none",
            isCurrent && "text-indigo-300"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(index);
          }}
          className={cn(
            "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
            isSelected
              ? "bg-indigo-600 border-indigo-600 text-white"
              : "border-slate-200 bg-white hover:border-indigo-400"
          )}
        >
          {isSelected && <Check size={10} strokeWidth={4} />}
        </button>
      </div>

      {/* Main content — min-w-0 is critical: without it, flex children don't shrink below
          their content width, causing text overflow in grid mode. */}
      <div className="pl-12 pr-4 py-4 min-w-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden mr-1">
            <span className={cn(
              "flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold tracking-tight",
              isCurrent ? "bg-slate-100 text-slate-500" : "bg-slate-100 text-slate-500"
            )}>
              {index + 1}
            </span>
            <div className="h-3 w-px bg-slate-100" />
            <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
              <TypeIcon size={12} className="shrink-0" />
              <span className={cn("text-[10px] font-bold uppercase tracking-wider truncate", isGridView ? "hidden" : "block")}>
                {meta.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {question.timeLimit && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[9px] font-bold border border-slate-100">
                <Timer size={10} />
                <span>{question.timeLimit}s</span>
              </div>
            )}
            {question.points > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[9px] font-bold border border-amber-100/50">
                <Star size={10} fill="currentColor" />
                <span>{question.points}</span>
              </div>
            )}
            {/* Speed question badge */}
            {(question as any).isSpeedQuestion && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-bold border border-indigo-100">
                <BarChart3 size={10} />
                <span>Speed</span>
              </div>
            )}
            {/* Skip badge */}
            {(question as any).skipAllowed && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[9px] font-bold border border-slate-100">
                <span>Skip</span>
              </div>
            )}

            <div className="relative ml-1" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
              >
                <MoreVertical size={14} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-100 shadow-xl rounded-xl py-1.5 z-50 overflow-hidden">
                  <button
                    onClick={handleDuplicate}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <Copy size={14} /> Duplicate
                  </button>
                  <button
                    onClick={() => onDelete(question.id)}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-red-500 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h4
          className={cn(
            "text-sm font-bold leading-tight mb-1 transition-colors break-words",
            isCurrent ? "text-slate-900" : "text-slate-700"
          )}
        >
          {question.title || (
            <span className="text-slate-300 italic font-medium">
              Untitled Question
            </span>
          )}
        </h4>

        {/* COLLAPSIBLE SECTION - with grid transition */}
        <div className={cn(
          "grid transition-all duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
        )}>
          <div className="overflow-hidden space-y-3">
            {/* Description */}
            {question.description && (
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                {question.description}
              </p>
            )}

            {/* Unified list preview for types with items/options/statements */}
            {renderPreviewItems()}

            {/* Special previews for Grid 2x2 and Rating Scale */}
            {renderSpecialPreview()}

            {/* No content message for empty types */}
            {!hasExpandableContent() && (
              <p className="text-[10px] text-slate-300 italic text-center py-2">
                Click to edit this question
              </p>
            )}
          </div>
        </div>

        {/* Expand/Collapse Toggle Button - only show if there's content to expand */}
        {hasExpandableContent() && (
          <div className="mt-2 flex justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 rounded-full text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all"
            >
              <ChevronDown 
                size={14} 
                className={cn("transition-transform duration-200", isExpanded && "rotate-180")} 
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
