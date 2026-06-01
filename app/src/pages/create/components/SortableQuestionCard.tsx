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

const TYPE_META: Record<string, { icon: React.ElementType; label: string }> = {
  "multiple-choice": { icon: ListChecks, label: "Multiple Choice" },
  SINGLE_CHOICE: { icon: ListChecks, label: "Multiple Choice" },
  MULTIPLE_CHOICE: { icon: ListChecks, label: "Multiple Choice" },
  "open-text": { icon: MessageSquare, label: "Open Text" },
  "word-cloud": { icon: Cloud, label: "Word Cloud" },
  "rating-scale": { icon: Star, label: "Rating" },
  RATING: { icon: Star, label: "Rating" },
  scales: { icon: SlidersHorizontal, label: "Scales" },
  ranking: { icon: ListOrdered, label: "Ranking" },
  "grid-2x2": { icon: Grid3X3, label: "Grid 2x2" },
  vote: { icon: Vote, label: "Vote" },
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
  const isChoice = ["multiple-choice", "SINGLE_CHOICE", "MULTIPLE_CHOICE"].includes(question.type);
  const isGridView = viewMode === "grid";

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onQuestionClick(index)}
      className={cn(
        "group relative bg-white rounded-2xl transition-all duration-200 cursor-pointer",
        isDragging && "shadow-2xl z-50 scale-[1.02]",
        isCurrent
          ? "ring-[2.5px] ring-indigo-500 shadow-xl shadow-indigo-100/40"
          : "border border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-md",
        isSelected && !isCurrent && "border-indigo-300 bg-indigo-50/10"
      )}
    >
      {/* Left side controls */}
      <div className="absolute left-4 top-4 flex flex-col items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "p-1 rounded-md text-slate-300 hover:text-indigo-500 hover:bg-slate-50 transition-colors cursor-grab active:cursor-grabbing",
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

      {/* Main content */}
      <div className="pl-12 pr-4 py-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={cn(
              "flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold tracking-tight",
              isCurrent ? "bg-slate-100 text-slate-500" : "bg-slate-100 text-slate-500"
            )}>
              {index + 1}
            </span>
            <div className="h-3 w-px bg-slate-100" />
            <div className="flex items-center gap-1.5 text-slate-400">
              <TypeIcon size={12} />
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", isGridView ? "hidden" : "block")}>
                {meta.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
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
            "text-sm font-bold leading-tight mb-1 transition-colors",
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
            {question.description && (
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                {question.description}
              </p>
            )}

            {isChoice && question.options && (
              <div className="space-y-1.5">
                {question.options.slice(0, 4).map((opt) => (
                  <div key={opt.id} className="flex items-center gap-3 py-1 px-1">
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        opt.isCorrect ? "bg-indigo-500" : "bg-slate-200"
                      )}
                    />
                    <span
                      className={cn(
                        "text-[11px] font-bold truncate",
                        opt.isCorrect ? "text-indigo-900" : "text-slate-500"
                      )}
                    >
                      {opt.text || "Empty option"}
                    </span>
                  </div>
                ))}
                {question.options.length > 4 && (
                  <p className="text-[10px] text-slate-300 font-bold pl-4">
                    + {question.options.length - 4} more options
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expand/Collapse Toggle Button */}
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
      </div>
    </div>
  );
}