// QuestionSidePanel.tsx - FULLY FUNCTIONAL
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../lib/utils";
import type { Question } from "../types";
import {
  PencilRuler,
  MessageSquareText,
  Pointer,
  PaintRoller,
  ChevronDown,
  X,
  Upload,
  Send,
  Trash2,
  Timer,
  Star,
  Shuffle,
  SkipForward,
  Eye,
  EyeOff,
  Check,
  ListChecks,
  MessageSquare,
  Cloud,
  BarChart2,
  HelpCircle,
  Lock,
  Unlock,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";

interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
}

interface QuestionSidePanelProps {
  currentQuestion: Question | null;
  onUpdateQuestion: (updates: Partial<Question>) => void;
  onDuplicateQuestion?: () => void;
  onDeleteQuestion?: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { id: "edit", label: "Edit", icon: PencilRuler },
  { id: "comments", label: "Comments", icon: MessageSquareText },
  { id: "interactivity", label: "Interactivity", icon: Pointer },
  { id: "themes", label: "Themes", icon: PaintRoller },
];

const QUESTION_TYPES = [
  { id: "multiple-choice", label: "Multiple Choice", shortLabel: "MC", icon: ListChecks, color: "bg-teal-600" },
  { id: "open-text", label: "Open Text", shortLabel: "OT", icon: MessageSquare, color: "bg-cyan-600" },
  { id: "word-cloud", label: "Word Cloud", shortLabel: "WC", icon: Cloud, color: "bg-orange-500" },
  { id: "rating-scale", label: "Rating Scale", shortLabel: "RS", icon: BarChart2, color: "bg-emerald-600" },
];

const QUESTION_THEMES = [
  {
    id: "default",
    label: "Default",
    bg: "bg-white",
    text: "text-slate-900",
    accent: "bg-indigo-600",
    border: "border-slate-200",
    preview: "from-slate-50 to-white",
    accentColor: "#6366f1",
  },
  {
    id: "ocean",
    label: "Ocean",
    bg: "bg-blue-950",
    text: "text-white",
    accent: "bg-cyan-400",
    border: "border-blue-800",
    preview: "from-blue-950 to-blue-900",
    accentColor: "#22d3ee",
  },
  {
    id: "sunset",
    label: "Sunset",
    bg: "bg-orange-950",
    text: "text-white",
    accent: "bg-rose-400",
    border: "border-orange-800",
    preview: "from-orange-900 to-rose-900",
    accentColor: "#fb7185",
  },
  {
    id: "forest",
    label: "Forest",
    bg: "bg-emerald-950",
    text: "text-white",
    accent: "bg-emerald-400",
    border: "border-emerald-800",
    preview: "from-emerald-950 to-teal-900",
    accentColor: "#34d399",
  },
  {
    id: "midnight",
    label: "Midnight",
    bg: "bg-slate-950",
    text: "text-white",
    accent: "bg-violet-500",
    border: "border-slate-800",
    preview: "from-slate-950 to-slate-900",
    accentColor: "#8b5cf6",
  },
  {
    id: "candy",
    label: "Candy",
    bg: "bg-pink-50",
    text: "text-pink-950",
    accent: "bg-pink-500",
    border: "border-pink-200",
    preview: "from-pink-100 to-rose-50",
    accentColor: "#ec4899",
  },
  {
    id: "golden",
    label: "Golden",
    bg: "bg-amber-950",
    text: "text-white",
    accent: "bg-amber-400",
    border: "border-amber-800",
    preview: "from-amber-950 to-yellow-900",
    accentColor: "#fbbf24",
  },
  {
    id: "arctic",
    label: "Arctic",
    bg: "bg-sky-950",
    text: "text-white",
    accent: "bg-sky-300",
    border: "border-sky-800",
    preview: "from-sky-950 to-indigo-950",
    accentColor: "#7dd3fc",
  },
];

function ThemePreviewCard({
  theme,
  question,
  isSelected,
  onClick,
}: {
  theme: typeof QUESTION_THEMES[0];
  question: Question | null;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full rounded-2xl overflow-hidden border-2 transition-all duration-200 group",
        isSelected
          ? "border-[#6366F1] shadow-lg shadow-indigo-100"
          : "border-transparent hover:border-slate-300"
      )}
    >
      <div className={cn("w-full h-28 bg-gradient-to-br p-4 flex flex-col gap-2", theme.preview)}>
        <div className={cn("h-2.5 rounded-full w-3/4", theme.accent, "opacity-80")} />
        <div className={cn("h-2 rounded-full w-1/2 bg-white opacity-20")} />
        <div className="flex flex-col gap-1.5 mt-1">
          {[1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-6 rounded-lg flex items-center px-2 gap-2 border",
                theme.border,
                "bg-white/10"
              )}
            >
              <div
                className={cn("w-2.5 h-2.5 rounded-full border flex-shrink-0", theme.border, "border-2")}
              />
              <div className="h-1.5 rounded-full bg-white/30 flex-1" />
            </div>
          ))}
        </div>
      </div>
      <div className={cn("px-3 py-2 flex items-center justify-between", theme.bg, theme.text)}>
        <span className="text-xs font-semibold">{theme.label}</span>
        {isSelected && (
          <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
    </button>
  );
}

export function QuestionSidePanel({
  currentQuestion,
  onUpdateQuestion,
  onDuplicateQuestion,
  onDeleteQuestion,
  onToggle,
  isOpen,
}: QuestionSidePanelProps) {
  const [activeMenu, setActiveMenu] = useState<string>("edit");
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMenuClick = (menuId: string) => {
    if (activeMenu === menuId && isOpen) {
      onToggle();
    } else {
      setActiveMenu(menuId);
      if (!isOpen) onToggle();
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: newComment.trim(),
        author: "You",
        timestamp: new Date(),
      },
    ]);
    setNewComment("");
  };

  const handleDeleteComment = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const handleTypeChange = (typeId: string) => {
    onUpdateQuestion({ type: typeId as Question["type"] });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdateQuestion({ image: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleThemeSelect = (themeId: string) => {
    onUpdateQuestion({ theme: themeId });
  };

  const selectedThemeId = (currentQuestion as any)?.theme || "default";

  const renderEditPanel = () => (
    <div className="space-y-8">
      {/* Question Type */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-800">Question type</label>
        <div className="grid grid-cols-2 gap-2">
          {QUESTION_TYPES.map((type) => {
            const Icon = type.icon;
            const isActive =
              currentQuestion?.type === type.id ||
              currentQuestion?.type === type.id.toUpperCase().replace(/-/g, "_");
            return (
              <button
                key={type.id}
                onClick={() => handleTypeChange(type.id)}
                disabled={!currentQuestion}
                className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left",
                  isActive
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50",
                  !currentQuestion && "opacity-40 cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0",
                    type.color
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold leading-tight",
                    isActive ? "text-indigo-700" : "text-slate-600"
                  )}
                >
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Image Upload */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-800">Image</label>
        {(currentQuestion as any)?.image ? (
          <div className="relative rounded-2xl overflow-hidden group">
            <img
              src={(currentQuestion as any).image}
              alt="Question"
              className="w-full h-40 object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white rounded-full shadow text-slate-700 hover:bg-indigo-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                onClick={() => onUpdateQuestion({ image: undefined })}
                className="p-2 bg-white rounded-full shadow text-rose-500 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => currentQuestion && fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all",
              currentQuestion
                ? "cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30"
                : "opacity-40 cursor-not-allowed"
            )}
          >
            <ImageIcon className="w-6 h-6 text-slate-300" />
            <p className="text-xs font-bold text-indigo-600 underline text-center">
              Click to add an image
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* Quick Actions */}
      {currentQuestion && (
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-800">Actions</label>
          <div className="grid grid-cols-2 gap-2">
            {onDuplicateQuestion && (
              <button
                onClick={onDuplicateQuestion}
                className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-xs font-semibold text-slate-600"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                Duplicate
              </button>
            )}
            {onDeleteQuestion && (
              <button
                onClick={onDeleteQuestion}
                className="flex items-center gap-2 p-3 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 transition-all text-xs font-semibold text-rose-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderCommentsPanel = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-3 overflow-y-auto mb-4 min-h-0">
        {comments.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquareText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">No comments yet</p>
            <p className="text-xs text-slate-300 mt-1">
              Leave notes for collaborators or yourself
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="group bg-slate-50 rounded-2xl p-3 border border-slate-100 relative"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white">
                    Y
                  </div>
                  <span className="text-xs font-bold text-slate-700">{comment.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400">
                    {comment.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-rose-100 text-slate-400 hover:text-rose-500 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{comment.text}</p>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-100 pt-4 mt-auto">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            placeholder="Add a comment..."
            disabled={!currentQuestion}
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleAddComment}
            disabled={!currentQuestion || !newComment.trim()}
            className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {!currentQuestion && (
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Select a question to add comments
          </p>
        )}
      </div>
    </div>
  );

  const renderInteractivityPanel = () => {
    const q = currentQuestion;
    if (!q) {
      return (
        <div className="text-center py-20">
          <Pointer className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">No question selected</p>
          <p className="text-xs text-slate-300 mt-1">Select a question to configure interactivity</p>
        </div>
      );
    }

    const hasOptions =
      q.type === "multiple-choice" ||
      q.type === "SINGLE_CHOICE" ||
      q.type === "MULTIPLE_CHOICE" ||
      q.type === "TRUE_FALSE" ||
      q.type === "POLL";

    return (
      <div className="space-y-6">
        {/* Time Limit */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Timer className="w-4 h-4 text-indigo-500" />
            Time Limit
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[15, 30, 45, 60, 90, 120].map((s) => (
              <button
                key={s}
                onClick={() => onUpdateQuestion({ timeLimit: s })}
                className={cn(
                  "py-2.5 rounded-xl border-2 text-xs font-bold transition-all",
                  q.timeLimit === s
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                )}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>

        {/* Points */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Points
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[0, 10, 20, 30, 50, 100].map((p) => (
              <button
                key={p}
                onClick={() => onUpdateQuestion({ points: p })}
                className={cn(
                  "py-2.5 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-1",
                  q.points === p
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:text-amber-600"
                )}
              >
                <Star className="w-3 h-3" />
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Options */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-800">Settings</label>
          <div className="space-y-2">
            {/* Allow Skip */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2.5">
                <SkipForward className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">Allow Skip</p>
                  <p className="text-[10px] text-slate-400">Participants can skip this question</p>
                </div>
              </div>
              <button
                onClick={() => onUpdateQuestion({ allowSkip: !(q as any).allowSkip })}
                className={cn(
                  "w-9 h-5 rounded-full transition-all relative flex-shrink-0",
                  (q as any).allowSkip ? "bg-indigo-600" : "bg-slate-200"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all",
                    (q as any).allowSkip ? "left-4" : "left-0.5"
                  )}
                />
              </button>
            </div>

            {/* Shuffle Options */}
            {hasOptions && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <Shuffle className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Shuffle Options</p>
                    <p className="text-[10px] text-slate-400">Randomize answer order per participant</p>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateQuestion({ shuffleOptions: !(q as any).shuffleOptions })}
                  className={cn(
                    "w-9 h-5 rounded-full transition-all relative flex-shrink-0",
                    (q as any).shuffleOptions ? "bg-indigo-600" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all",
                      (q as any).shuffleOptions ? "left-4" : "left-0.5"
                    )}
                  />
                </button>
              </div>
            )}

            {/* Show Correct Answer */}
            {hasOptions && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Show Correct Answer</p>
                    <p className="text-[10px] text-slate-400">Reveal correct answer after submission</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    onUpdateQuestion({ showCorrectAnswer: !(q as any).showCorrectAnswer })
                  }
                  className={cn(
                    "w-9 h-5 rounded-full transition-all relative flex-shrink-0",
                    (q as any).showCorrectAnswer ? "bg-indigo-600" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all",
                      (q as any).showCorrectAnswer ? "left-4" : "left-0.5"
                    )}
                  />
                </button>
              </div>
            )}

            {/* Lock Question */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2.5">
                {q.locked ? (
                  <Lock className="w-4 h-4 text-amber-500" />
                ) : (
                  <Unlock className="w-4 h-4 text-slate-400" />
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-700">Lock Question</p>
                  <p className="text-[10px] text-slate-400">Prevent accidental edits</p>
                </div>
              </div>
              <button
                onClick={() => onUpdateQuestion({ locked: !q.locked })}
                className={cn(
                  "w-9 h-5 rounded-full transition-all relative flex-shrink-0",
                  q.locked ? "bg-amber-500" : "bg-slate-200"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all",
                    q.locked ? "left-4" : "left-0.5"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderThemesPanel = () => {
    if (!currentQuestion) {
      return (
        <div className="text-center py-20">
          <PaintRoller className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">No question selected</p>
          <p className="text-xs text-slate-300 mt-1">Select a question to apply a theme</p>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm font-bold text-slate-800 mb-1">Question Theme</p>
          <p className="text-xs text-slate-400">
            Choose a visual style for this question. It will appear in the participant preview.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {QUESTION_THEMES.map((theme) => (
            <ThemePreviewCard
              key={theme.id}
              theme={theme}
              question={currentQuestion}
              isSelected={selectedThemeId === theme.id}
              onClick={() => handleThemeSelect(theme.id)}
            />
          ))}
        </div>

        {selectedThemeId !== "default" && (
          <button
            onClick={() => handleThemeSelect("default")}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset to Default
          </button>
        )}
      </div>
    );
  };

  const renderPanelContent = () => {
    switch (activeMenu) {
      case "edit":
        return renderEditPanel();
      case "comments":
        return renderCommentsPanel();
      case "interactivity":
        return renderInteractivityPanel();
      case "themes":
        return renderThemesPanel();
      default:
        return null;
    }
  };

  const panelTitle = menuItems.find((m) => m.id === activeMenu)?.label ?? "Slide";

  return (
    <div className="absolute right-0 top-0 h-full flex z-30 bg-white">

      {/* 1. CONTENT PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="bg-white border-l border-slate-200 overflow-hidden h-full"
          >
            <div className="w-[360px] h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
                <h2 className="text-xl font-bold text-slate-900 capitalize">{panelTitle}</h2>
                <button
                  onClick={onToggle}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Question indicator */}
              {currentQuestion ? (
                <div className="mx-6 mb-4 px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-100 shrink-0">
                  <p className="text-xs font-semibold text-indigo-700 truncate">{currentQuestion.title || "Untitled question"}</p>
                </div>
              ) : (
                <div className="mx-6 mb-4 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
                  <p className="text-xs text-slate-400">No question selected</p>
                </div>
              )}

              {/* Panel Body */}
              <div
                className={cn(
                  "flex-1 overflow-y-auto px-6 pb-6 min-h-0",
                  activeMenu === "comments" && "flex flex-col"
                )}
              >
                {renderPanelContent()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. NAV RAIL */}
      <div className="w-[92px] bg-white border-l border-slate-200 flex flex-col items-center py-4 gap-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id && isOpen;
          const hasNotification = item.id === "comments" && comments.length > 0;
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={cn(
                "w-[76px] h-[76px] rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 border-2 relative",
                isActive
                  ? "bg-white border-[#6366F1] text-[#4F46E5] shadow-lg shadow-indigo-50"
                  : "bg-white border-transparent text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive ? "text-[#4F46E5]" : "text-black")} />
              <span className="text-[11px] font-bold">{item.label}</span>
              {hasNotification && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
