// SortableQuestionCard.tsx - DISPLAY ONLY
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
  Timer,
  Star,
  Copy,
  MoreVertical,
  CheckCircle2,
  ChevronDown,
  SlidersHorizontal,
  ListOrdered,
  Grid3X3,
  Vote, 
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

const TYPE_META: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; border: string; label: string }
> = {
  "multiple-choice": {
    icon: ListChecks,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    label: "MC",
  },
  SINGLE_CHOICE: {
    icon: ListChecks,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    label: "MC",
  },
  MULTIPLE_CHOICE: {
    icon: ListChecks,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    label: "MC",
  },
  TRUE_FALSE: {
    icon: ListChecks,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    label: "T/F",
  },
  POLL: {
    icon: ListChecks,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    label: "Poll",
  },
  "open-text": {
    icon: MessageSquare,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    label: "Text",
  },
  OPEN_TEXT: {
    icon: MessageSquare,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    label: "Text",
  },
  "word-cloud": {
    icon: Cloud,
    color: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
    label: "Cloud",
  },
  WORD_CLOUD: {
    icon: Cloud,
    color: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
    label: "Cloud",
  },
  "rating-scale": {
    icon: BarChart2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Rating",
  },
  RATING: {
    icon: BarChart2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Rating",
  },
   scales: {
    icon: SlidersHorizontal,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    label: "Scale",
  },
  SCALING: {
    icon: SlidersHorizontal,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    label: "Scale",
  },

  
  ranking: {
    icon: ListOrdered,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    label: "Rank",
  },
  RANKING: {
    icon: ListOrdered,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    label: "Rank",
  },
  "grid-2x2": {
    icon: Grid3X3,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Grid",
  },
  "GRID_2X2": {
    icon: Grid3X3,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Grid",
  },
  "vote": {
    icon: Vote,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    label: "Vote",
  },
  "VOTE": {
    icon: Vote,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    label: "Vote",
  },
};

const DEFAULT_META = {
  icon: HelpCircle,
  color: "text-slate-500",
  bg: "bg-slate-50",
  border: "border-slate-200",
  label: "?",
};

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? DEFAULT_META;
}

function isChoiceType(type: string) {
  return [
    "multiple-choice",
    "SINGLE_CHOICE",
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "POLL",
  ].includes(type);
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
    opacity: isDragging ? 0.4 : 1,
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

  const meta = getTypeMeta(question.type);
  const TypeIcon = meta.icon;
  const hasOptions = isChoiceType(question.type) && question.options && question.options.length > 0;
  const isGridView = viewMode === "grid";

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onQuestionClick(index)}
      className={cn(
        "group relative rounded-xl cursor-pointer transition-all duration-150 select-none",
        isDragging && "shadow-2xl scale-[1.01] rotate-[0.5deg]",
        isCurrent
          ? "bg-white shadow-lg shadow-indigo-100/50 ring-2 ring-indigo-200"
          : isSelected
          ? "bg-indigo-50/50 border border-indigo-200 hover:shadow-md"
          : "bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm"
      )}
    >
      {/* Active accent bar */}
      {isCurrent && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-r-full" />
      )}

      <div className="p-3 sm:p-4 pl-4 sm:pl-5">
        {/* ── Top row: left shrinks, right is always locked inside card ── */}
        <div className="flex items-center gap-1 min-w-0">

          {/* LEFT GROUP — can be clipped by min-w-0 */}
          <div className="flex items-center gap-1 min-w-0 overflow-hidden">
            {/* Drag handle */}
            <div
              className={cn(
                "flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-400 transition-colors",
                isDragging && "cursor-grabbing text-indigo-500"
              )}
              onClick={(e) => e.stopPropagation()}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>

            {/* Checkbox */}
            <div
              className="flex-shrink-0 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onToggleSelect(index); }}
            >
              <div className={cn(
                "w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all",
                isSelected
                  ? "bg-indigo-600 border-indigo-600"
                  : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50"
              )}>
                {isSelected && <Check className="w-2 h-2 text-white" />}
              </div>
            </div>

            {/* Index */}
            <span className="flex-shrink-0 text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
              #{index + 1}
            </span>

            {/* Type badge */}
            <div className={cn(
              "flex-shrink-0 inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold border",
              meta.bg, meta.color, meta.border
            )}>
              <TypeIcon className="w-2.5 h-2.5" />
              <span className={cn(isGridView ? "hidden" : "inline")}>{meta.label}</span>
            </div>
          </div>

          {/* SPACER */}
          <div className="flex-1" />

          {/* RIGHT GROUP — never shrinks, always inside card */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Points badge */}
            {question.points > 0 && (
              <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-50 text-amber-600 text-[9px] font-medium">
                <Star className="w-2.5 h-2.5 fill-amber-400 flex-shrink-0" />
                <span className={cn(isGridView ? "hidden" : "inline")}>{question.points}</span>
              </div>
            )}

            {/* Timer badge */}
            {question.timeLimit && (
              <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-medium">
                <Timer className="w-2.5 h-2.5 flex-shrink-0" />
                <span className={cn(isGridView ? "hidden" : "inline")}>{question.timeLimit}s</span>
              </div>
            )}

            {/* Expand / collapse toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded((v) => !v); }}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ChevronDown className={cn(
                "w-3.5 h-3.5 transition-transform duration-200",
                isExpanded && "rotate-180"
              )} />
            </button>

            {/* Context menu — 3 dots */}
            <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30">
                  <button
                    onClick={handleDuplicate}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Copy className="w-3 h-3" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => { onDelete(question.id); setShowMenu(false); }}
                    className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Title — always visible ── */}
        <p className="mt-2 text-sm font-semibold text-slate-800 leading-snug truncate">
          {question.title || (
            <span className="text-slate-400 font-normal italic">Untitled question</span>
          )}
        </p>

        {/* ── Expanded: description + options ── */}
        {isExpanded && (
          <>
            {/* Description */}
            {question.description && (
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                {question.description}
              </p>
            )}

            {/* Options (choice types only) */}
            {hasOptions && (
              <div className="mt-3 space-y-2">
                {question.options!.slice(0, isGridView ? 3 : 4).map((opt) => (
                  <div
                    key={opt.id}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium",
                      opt.isCorrect
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    )}
                  >
                    {opt.isCorrect ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                    )}
                    <span className="truncate">
                      {opt.text || <em className="text-slate-400 font-normal">Empty option</em>}
                    </span>
                  </div>
                ))}
                {question.options!.length > (isGridView ? 3 : 4) && (
                  <p className="text-xs text-slate-400 pl-1">
                    +{question.options!.length - (isGridView ? 3 : 4)} more options
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
