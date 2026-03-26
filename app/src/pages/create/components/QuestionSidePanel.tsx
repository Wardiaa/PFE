// QuestionSidePanel.tsx - ORIGINAL LAYOUT WITH NEW UI CONTENT (NO QUESTION INDICATOR)
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
  Plus,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Heart,
  PawPrint,
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
  { id: "edit", label: "Edit", icon: BarChart2 },
  { id: "comments", label: "Comments", icon: MessageSquareText },
  { id: "interactivity", label: "Interactivity", icon: Pointer },
  { id: "themes", label: "Themes", icon: PaintRoller },
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

// Menti-style toggle component
const MentiToggle = ({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={cn(
      "w-9 h-5 rounded-full transition-all relative flex items-center px-0.5",
      checked ? "bg-[#6366F1]" : "bg-slate-200",
      disabled && "opacity-40 cursor-not-allowed"
    )}
  >
    <div className={cn("w-4 h-4 bg-white rounded-full shadow transition-transform", checked ? "translate-x-4" : "translate-x-0")} />
  </button>
);

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

  // Edit Panel - New UI Style
  const renderEditPanel = () => {
    if (!currentQuestion) {
      return (
        <div className="text-center py-20">
          <BarChart2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">No question selected</p>
          <p className="text-xs text-slate-300 mt-1">Select a question to edit</p>
        </div>
      );
    }

    const isChoiceType = currentQuestion.type === "multiple-choice" || 
                         currentQuestion.type === "SINGLE_CHOICE" ||
                         currentQuestion.type === "MULTIPLE_CHOICE" ||
                         currentQuestion.type === "POLL";

    return (
      <div className="space-y-6">
        {/* Header with Back Arrow and Question Type */}
        <div className="flex items-center gap-3">
          <button className="p-1 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-lg font-medium text-slate-800">
            {currentQuestion.type === "multiple-choice" ? "Multiple Choice" :
             currentQuestion.type === "open-text" ? "Open Text" :
             currentQuestion.type === "word-cloud" ? "Word Cloud" :
             currentQuestion.type === "rating-scale" ? "Rating Scale" : "Question"}
          </h2>
        </div>

        {/* Question Title Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Question</label>
          <input
            type="text"
            value={currentQuestion.title || ""}
            onChange={(e) => onUpdateQuestion({ title: e.target.value })}
            className="w-full px-4 py-3 bg-[#F1F3F5] rounded-xl border border-transparent focus:border-slate-200 outline-none text-sm font-medium"
            placeholder="Enter your question..."
          />
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description (optional)</label>
          <textarea
            value={currentQuestion.description || ""}
            onChange={(e) => onUpdateQuestion({ description: e.target.value })}
            className="w-full px-4 py-3 bg-[#F1F3F5] rounded-xl border border-transparent focus:border-slate-200 outline-none text-sm resize-none min-h-[80px]"
            placeholder="Add additional context or instructions..."
          />
        </div>

        {/* Options Section (for choice types) */}
        {isChoiceType && (
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Options</label>
            <div className="space-y-2">
              {currentQuestion.options?.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2 group">
                  {/* Checkbox for correct answer */}
                  <button 
                    onClick={() => {
                      const newOpts = [...(currentQuestion.options || [])];
                      newOpts[idx] = { ...newOpts[idx], isCorrect: !newOpts[idx].isCorrect };
                      onUpdateQuestion({ options: newOpts });
                    }}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                      opt.isCorrect ? "bg-[#6366F1] border-[#6366F1]" : "border-slate-200"
                    )}
                  >
                    {opt.isCorrect && <Check className="w-3 h-3 text-white" />}
                  </button>

                  {/* Pill Input Area */}
                  <div className="flex-1 flex items-center gap-2 bg-[#F1F3F5] rounded-xl px-3 py-2.5 border border-transparent focus-within:border-slate-200 transition-all">
                    <div className={cn("w-4 h-4 rounded-full shrink-0", 
                      idx === 0 ? "bg-blue-500" : 
                      idx === 1 ? "bg-rose-400" : 
                      idx === 2 ? "bg-indigo-900" : "bg-emerald-500"
                    )} />
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const newOpts = [...(currentQuestion.options || [])];
                        newOpts[idx] = { ...newOpts[idx], text: e.target.value };
                        onUpdateQuestion({ options: newOpts });
                      }}
                      className="bg-transparent border-none outline-none text-sm w-full font-medium"
                      placeholder={`Option ${idx + 1}`}
                    />
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600" />
                  </div>
                  
                  <button 
                    onClick={() => {
                      const newOpts = (currentQuestion.options || []).filter((_, i) => i !== idx);
                      onUpdateQuestion({ options: newOpts });
                    }}
                    className="text-slate-400 hover:text-rose-500 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                const newOpts = [...(currentQuestion.options || [])];
                const newId = `${currentQuestion.id}-${Date.now()}`;
                newOpts.push({ 
                  id: newId, 
                  text: `Option ${newOpts.length + 1}`, 
                  isCorrect: false 
                });
                onUpdateQuestion({ options: newOpts });
              }}
              className="w-full py-3 bg-[#F1F3F5] hover:bg-[#E9ECEF] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add option
            </button>
          </div>
        )}

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Image</label>
          {(currentQuestion as any)?.image ? (
            <div className="relative rounded-xl overflow-hidden group">
              <img
                src={(currentQuestion as any).image}
                alt="Question"
                className="w-full h-28 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 bg-white rounded-full shadow text-slate-700 hover:bg-indigo-50 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onUpdateQuestion({ image: undefined })}
                  className="p-1.5 bg-white rounded-full shadow text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
            >
              <ImageIcon className="w-5 h-5 text-slate-300" />
              <p className="text-[10px] font-bold text-indigo-600 underline text-center">
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
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</label>
          <div className="grid grid-cols-2 gap-2">
            {onDuplicateQuestion && (
              <button
                onClick={onDuplicateQuestion}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-xs font-semibold text-slate-600"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                Duplicate
              </button>
            )}
            {onDeleteQuestion && (
              <button
                onClick={onDeleteQuestion}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 transition-all text-xs font-semibold text-rose-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Comments Panel - New UI Style
  const renderCommentsPanel = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 overflow-y-auto mb-4 min-h-0">
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
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E9ECEF] flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                {comment.author.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{comment.author}</span>
                  <span className="text-[10px] text-slate-400">
                    {comment.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{comment.text}</p>
                <div className="flex items-center gap-3">
                  <button className="text-[11px] font-bold text-slate-800 pt-1 hover:text-indigo-600">Reply</button>
                  <button 
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-[11px] font-bold text-rose-500 pt-1 hover:text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="relative pt-4 border-t border-slate-100">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
          placeholder="Enter your comment here..."
          disabled={!currentQuestion}
          className="w-full bg-[#F1F3F5] rounded-xl px-4 py-3 text-sm font-medium outline-none border-none placeholder:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed"
        />
        {!currentQuestion && (
          <p className="text-[9px] text-slate-400 mt-2 text-center">
            Select a question to add comments
          </p>
        )}
      </div>
    </div>
  );

  // Interactivity Panel - New UI Style
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

    const hasOptions = q.type === "multiple-choice" || 
                       q.type === "SINGLE_CHOICE" || 
                       q.type === "MULTIPLE_CHOICE" || 
                       q.type === "TRUE_FALSE" || 
                       q.type === "POLL";

    return (
      <div className="space-y-6">
        {/* Timer Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Time limit</h3>
            <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[15, 30, 45, 60].map((s) => (
              <button
                key={s}
                onClick={() => onUpdateQuestion({ timeLimit: s })}
                className={cn(
                  "py-2 rounded-lg text-xs font-bold transition-all",
                  q.timeLimit === s
                    ? "bg-[#6366F1] text-white"
                    : "bg-[#F1F3F5] text-slate-600 hover:bg-slate-200"
                )}
              >
                {s}s
              </button>
            ))}
          </div>
        </section>

        <div className="h-px bg-slate-100" />

        {/* Points Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Points</h3>
            <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 10, 20, 30, 50, 100].map((p) => (
              <button
                key={p}
                onClick={() => onUpdateQuestion({ points: p })}
                className={cn(
                  "py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1",
                  q.points === p
                    ? "bg-amber-500 text-white"
                    : "bg-[#F1F3F5] text-slate-600 hover:bg-slate-200"
                )}
              >
                <Star className="w-3 h-3" />
                {p}
              </button>
            ))}
          </div>
        </section>

        <div className="h-px bg-slate-100" />

        {/* Participant Names Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Participant names</h3>
            <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase">Pro</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">Participant names are required</span>
            <MentiToggle checked={(q as any).requireNames || false} onChange={(val) => onUpdateQuestion({ requireNames: val })} />
          </div>
        </section>

        <div className="h-px bg-slate-100" />

        {/* Reactions Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Reactions</h3>
            <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="flex gap-1.5">
            {[PawPrint, Heart, HelpCircle, ThumbsUp, ThumbsDown].map((Icon, i) => (
              <button key={i} className={cn(
                "w-9 h-9 rounded-lg border flex items-center justify-center transition-all",
                i === 3 ? "border-[#6366F1] bg-indigo-50/50" : "border-slate-200 bg-white hover:border-slate-300"
              )}>
                <Icon className={cn("w-4 h-4", i === 3 ? "text-slate-800" : "text-slate-800")} fill={i === 3 ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </section>

        <div className="h-px bg-slate-100" />

        {/* Q&A Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Q&A</h3>
            <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Enable Q&A</span>
              <MentiToggle checked={(q as any).qaEnabled || false} onChange={(val) => onUpdateQuestion({ qaEnabled: val })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 leading-tight">Questions are visible to everyone</span>
              <MentiToggle checked={(q as any).qaVisibleToAll !== false} onChange={(val) => onUpdateQuestion({ qaVisibleToAll: val })} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-600">Moderation</span>
                <div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Star className="w-2.5 h-2.5 text-emerald-700 fill-current" />
                </div>
              </div>
              <MentiToggle checked={(q as any).qaModeration || false} onChange={(val) => onUpdateQuestion({ qaModeration: val })} />
            </div>
          </div>
        </section>

        <div className="h-px bg-slate-100" />

        {/* Advanced Settings */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800">Settings</h3>
          <div className="space-y-2.5">
            {/* Allow Skip */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SkipForward className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-600">Allow skip</span>
              </div>
              <MentiToggle checked={(q as any).allowSkip || false} onChange={(val) => onUpdateQuestion({ allowSkip: val })} />
            </div>

            {/* Shuffle Options */}
            {hasOptions && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shuffle className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600">Shuffle options</span>
                </div>
                <MentiToggle checked={(q as any).shuffleOptions || false} onChange={(val) => onUpdateQuestion({ shuffleOptions: val })} />
              </div>
            )}

            {/* Show Correct Answer */}
            {hasOptions && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600">Show correct answer</span>
                </div>
                <MentiToggle checked={(q as any).showCorrectAnswer || false} onChange={(val) => onUpdateQuestion({ showCorrectAnswer: val })} />
              </div>
            )}

            {/* Lock Question */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {q.locked ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
                <span className="text-xs text-slate-600">Lock question</span>
              </div>
              <MentiToggle checked={q.locked || false} onChange={(val) => onUpdateQuestion({ locked: val })} />
            </div>
          </div>
        </section>
      </div>
    );
  };

  // Themes Panel
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

  const panelTitle = menuItems.find((m) => m.id === activeMenu)?.label ?? "Edit";

  return (
    <div className="absolute right-0 top-0 h-full flex z-30 bg-white">

      {/* 1. CONTENT PANEL - ORIGINAL 360px WIDTH */}
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

              {/* Panel Body - No question indicator */}
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

      {/* 2. NAVIGATION RAIL - ORIGINAL 92px WIDTH */}
      <div className="w-[92px] bg-white border-l border-slate-200 flex flex-col items-center py-4 gap-3">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id && isOpen;
          const hasNotification = item.id === "comments" && comments.length > 0;
          return (
            <div key={item.id} className="flex flex-col items-center">
              <button
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
            </div>
          );
        })}
      </div>
    </div>
  );
}