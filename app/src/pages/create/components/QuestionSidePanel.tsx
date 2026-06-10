// QuestionSidePanel.tsx - UPDATED with Skip toggle for elimination mode
// Added skipAllowed toggle in Interactivity panel when isEliminationMode is true
// SPEED QUESTION UPDATE: Added isSpeedQuestion toggle and speedMaxAdvance input
// GRID 2x2 & VOTE UPDATE: Added edit panels for grid-2x2 and vote question types
// RATING SCALE UPDATE: Removed hearts, smileys, numbers - stars only
// Speed and Skip toggles now only show for multiple-choice questions
// Speed and Skip are mutually exclusive - enabling one disables the other

import { useState, useEffect, type ChangeEvent, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../lib/utils";
import type { Question } from "../types";
import { ImageUploadWidget } from "../../../components/ui/image-upload-widget";
import {
  optimizeImageUrl,
  uploadImageToCloudinary,
  validateImageFile,
} from "../../../lib/cloudinary";
import {
  MessageSquareText,
  Pointer,
  PaintRoller,
  X,
  Trash2,
  Star,
  Check,
  BarChart2,
  HelpCircle,
  RefreshCw,
  Loader2,
  Plus,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Heart,
  PawPrint,
  Clock,
  Upload,
  SlidersHorizontal,
  GripVertical,
  ListOrdered,
  Zap,
  Grid3X3,
  Vote,
  ArrowLeftRight,
  ArrowUpDown,
} from "lucide-react";

// ── DnD imports for Grid 2x2 and Vote ─────────────────────────────────────────
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Types for Grid 2x2 ────────────────────────────────────────────────────────
interface GridAxis {
  label: string;
  minLabel: string;
  maxLabel: string;
}

// ── Sortable option row (shared by Grid 2x2 and Vote) ─────────────────────────
function SortableOptionRow({
  option,
  onTextChange,
  onDelete,
  placeholder,
}: {
  option: { id: string; text: string };
  onTextChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  placeholder?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: option.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-center gap-2 group"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 transition-colors p-0.5"
        tabIndex={-1}
        type="button"
      >
        <GripVertical size={14} />
      </button>

      <input
        type="text"
        value={option.text}
        onChange={(e) => onTextChange(option.id, e.target.value)}
        placeholder={placeholder ?? "Enter option text…"}
        className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 bg-[#F1F3F5] focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-all"
      />

      <button
        type="button"
        onClick={() => onDelete(option.id)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// GRID 2×2 FIELDS (inline component)
// ═════════════════════════════════════════════════════════════════════════════
function Grid2x2Fields({
  question,
  onUpdate,
}: {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
}) {
  const options: Array<{ id: string; text: string }> = (question.options as any) ?? [];
  const xAxis: GridAxis = (question as any).xAxis ?? { label: "Effort", minLabel: "Low", maxLabel: "High" };
  const yAxis: GridAxis = (question as any).yAxis ?? { label: "Impact", minLabel: "Low", maxLabel: "High" };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const updateOption = (id: string, text: string) => {
    onUpdate({ options: options.map((o) => (o.id === id ? { ...o, text } : o)) } as any);
  };

  const deleteOption = (id: string) => {
    if (options.length <= 2) return;
    onUpdate({ options: options.filter((o) => o.id !== id) } as any);
  };

  const addOption = () => {
    const newId = `grid-${Date.now()}`;
    onUpdate({ options: [...options, { id: newId, text: "" }] } as any);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = options.findIndex((o) => o.id === active.id);
      const newIdx = options.findIndex((o) => o.id === over.id);
      onUpdate({ options: arrayMove(options, oldIdx, newIdx) } as any);
    }
  };

  const updateAxis = (axis: "xAxis" | "yAxis", field: keyof GridAxis, value: string) => {
    const current = axis === "xAxis" ? xAxis : yAxis;
    onUpdate({ [axis]: { ...current, [field]: value } } as any);
  };

  return (
    <div className="space-y-5">
      {/* Grid Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Grid Items
          </label>
          <span className="text-xs text-slate-400">{options.length} items</span>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={options.map((o) => o.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <SortableOptionRow
                  key={opt.id}
                  option={opt}
                  onTextChange={updateOption}
                  onDelete={deleteOption}
                  placeholder={`Item ${idx + 1}`}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button
          type="button"
          onClick={addOption}
          className="mt-2 w-full py-3 bg-[#F1F3F5] hover:bg-[#E9ECEF] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add item
        </button>
      </div>

      <div className="h-px bg-slate-100" />

      {/* X Axis Config */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ArrowLeftRight size={14} className="text-slate-400" />
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            X Axis (Horizontal)
          </label>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Axis Name</label>
            <input
              type="text"
              value={xAxis.label}
              onChange={(e) => updateAxis("xAxis", "label", e.target.value)}
              placeholder="e.g. Effort"
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-[#F1F3F5] focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Left label</label>
              <input
                type="text"
                value={xAxis.minLabel}
                onChange={(e) => updateAxis("xAxis", "minLabel", e.target.value)}
                placeholder="Low"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-[#F1F3F5] focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Right label</label>
              <input
                type="text"
                value={xAxis.maxLabel}
                onChange={(e) => updateAxis("xAxis", "maxLabel", e.target.value)}
                placeholder="High"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-[#F1F3F5] focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Y Axis Config */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpDown size={14} className="text-slate-400" />
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Y Axis (Vertical)
          </label>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Axis Name</label>
            <input
              type="text"
              value={yAxis.label}
              onChange={(e) => updateAxis("yAxis", "label", e.target.value)}
              placeholder="e.g. Impact"
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-[#F1F3F5] focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Bottom label</label>
              <input
                type="text"
                value={yAxis.minLabel}
                onChange={(e) => updateAxis("yAxis", "minLabel", e.target.value)}
                placeholder="Low"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-[#F1F3F5] focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Top label</label>
              <input
                type="text"
                value={yAxis.maxLabel}
                onChange={(e) => updateAxis("yAxis", "maxLabel", e.target.value)}
                placeholder="High"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-[#F1F3F5] focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid preview hint */}
      <div className="rounded-xl bg-indigo-50/40 border border-indigo-100 p-3">
        <p className="text-xs text-slate-600 text-center">
          Participants will drag each item onto the <strong>{xAxis.label} × {yAxis.label}</strong> grid.
          Tip: keep items to 4–6 for best usability.
        </p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// VOTE FIELDS (inline component)
// ═════════════════════════════════════════════════════════════════════════════
function VoteFields({
  question,
  onUpdate,
}: {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
}) {
  const options: Array<{ id: string; text: string }> = (question.options as any) ?? [];

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const updateOption = (id: string, text: string) => {
    onUpdate({ options: options.map((o) => (o.id === id ? { ...o, text } : o)) } as any);
  };

  const deleteOption = (id: string) => {
    if (options.length <= 2) return;
    onUpdate({ options: options.filter((o) => o.id !== id) } as any);
  };

  const addOption = () => {
    const newId = `vote-${Date.now()}`;
    onUpdate({ options: [...options, { id: newId, text: "" }] } as any);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = options.findIndex((o) => o.id === active.id);
      const newIdx = options.findIndex((o) => o.id === over.id);
      onUpdate({ options: arrayMove(options, oldIdx, newIdx) } as any);
    }
  };

  return (
    <div className="space-y-4">
      

      {/* Options */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Vote Options
          </label>
          <span className="text-xs text-slate-400">{options.length} options</span>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={options.map((o) => o.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <SortableOptionRow
                  key={opt.id}
                  option={opt}
                  onTextChange={updateOption}
                  onDelete={deleteOption}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button
          type="button"
          onClick={addOption}
          disabled={options.length >= 8}
          className="mt-2 w-full py-3 bg-[#F1F3F5] hover:bg-[#E9ECEF] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          Add option {options.length >= 8 && "(max 8)"}
        </button>
      </div>

      {/* Reveal hint */}
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
        <p className="text-xs text-slate-500 text-center">
          After participants vote, click <strong>Reveal Winner</strong> in the host view to highlight the most-voted option.
        </p>
      </div>
    </div>
  );
}

// Local interactivity settings state
interface InteractivitySettings {
  hideParticipantNames: boolean;
  qaEnabled: boolean;
  qaVisibleToAll: boolean;
  qaModeration: boolean;
  allowSkip: boolean;
  shuffleOptions: boolean;
  showResultsInstantly: boolean;
}

interface QuestionSidePanelProps {
  currentQuestion: Question | null;
  onUpdateQuestion: (updates: Partial<Question>) => void;
  onDuplicateQuestion?: () => void;
  onDeleteQuestion?: () => void;
  isOpen: boolean;
  onToggle: () => void;
  /** When true, renders as a flat inline panel (no absolute positioning — for mobile bottom sheets) */
  inline?: boolean;
  /** whether elimination mode is active (shows skip toggle) */
  isEliminationMode?: boolean;
  /** global max skips per participant */
  maxSkipsPerParticipant?: number;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
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

const MentiToggle = ({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={cn(
      "w-9 h-5 rounded-full transition-all relative flex items-center px-0.5",
      checked ? "bg-[#6366F1]" : "bg-slate-200",
      disabled && "opacity-40 cursor-not-allowed",
    )}
  >
    <div
      className={cn(
        "w-4 h-4 bg-white rounded-full shadow transition-transform",
        checked ? "translate-x-4" : "translate-x-0",
      )}
    />
  </button>
);

function ComingSoon({
  children,
  label = "Coming soon",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="opacity-40 pointer-events-none select-none filter grayscale"
      >
        {children}
      </div>
      <div className="absolute top-0 right-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.15em] shadow-md">
        <Clock className="w-2.5 h-2.5" />
        {label}
      </div>
    </div>
  );
}

function ThemePreviewCard({
  theme,
  isSelected,
  onClick,
}: {
  theme: (typeof QUESTION_THEMES)[0];
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
          : "border-transparent hover:border-slate-300",
      )}
    >
      <div
        className={cn(
          "w-full h-28 bg-gradient-to-br p-4 flex flex-col gap-2",
          theme.preview,
        )}
      >
        <div
          className={cn("h-2.5 rounded-full w-3/4", theme.accent, "opacity-80")}
        />
        <div className={cn("h-2 rounded-full w-1/2 bg-white opacity-20")} />
        <div className="flex flex-col gap-1.5 mt-1">
          {[1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-6 rounded-lg flex items-center px-2 gap-2 border",
                theme.border,
                "bg-white/10",
              )}
            >
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full border flex-shrink-0",
                  theme.border,
                  "border-2",
                )}
              />
              <div className="h-1.5 rounded-full bg-white/30 flex-1" />
            </div>
          ))}
        </div>
      </div>
      <div
        className={cn(
          "px-3 py-2 flex items-center justify-between",
          theme.bg,
          theme.text,
        )}
      >
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
  inline = false,
  isEliminationMode = false,
  maxSkipsPerParticipant = 1,
}: QuestionSidePanelProps) {
  const [activeMenu, setActiveMenu] = useState<string>("edit");
  const [uploadStates, setUploadStates] = useState<Record<number, UploadState>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const [interactivitySettings, setInteractivitySettings] =
    useState<InteractivitySettings>({
      hideParticipantNames: false,
      qaEnabled: true,
      qaVisibleToAll: true,
      qaModeration: false,
      allowSkip: false,
      shuffleOptions: false,
      showResultsInstantly: false,
    });

  useEffect(() => {
    if (currentQuestion) {
      setInteractivitySettings((prev) => ({
        ...prev,
        showResultsInstantly: currentQuestion.showResultsInstantly ?? false,
        hideParticipantNames: currentQuestion.hideParticipantNames ?? false,
      }));
    }
  }, [
    currentQuestion?.id,
    currentQuestion?.showResultsInstantly,
    currentQuestion?.hideParticipantNames,
  ]);

  const handleMenuClick = (menuId: string) => {
    if (activeMenu === menuId && isOpen) {
      onToggle();
    } else {
      setActiveMenu(menuId);
      if (!isOpen) onToggle();
    }
  };

  const handleThemeSelect = (themeId: string) => {
    onUpdateQuestion({ theme: themeId });
  };

  const selectedThemeId = (currentQuestion as any)?.theme || "default";

  const updateOption = (
    optionIndex: number,
    updates: Partial<NonNullable<Question["options"]>[number]>,
  ) => {
    if (!currentQuestion?.options) return;
    const newOptions = [...currentQuestion.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates };
    onUpdateQuestion({ options: newOptions });
  };

  const removeOptionImage = (optionIndex: number) => {
    if (!currentQuestion?.options) return;
    const newOptions = [...currentQuestion.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], imageUrl: null };
    onUpdateQuestion({ options: newOptions });
  };

  const setUploadingState = (optionIndex: number, state: Partial<UploadState>) => {
    setUploadStates((prev) => {
      const existing = prev[optionIndex] || { isUploading: false, progress: 0, error: null };
      return { ...prev, [optionIndex]: { ...existing, ...state } };
    });
  };

  const simulateUploadProgress = (optionIndex: number) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 8;
      if (progress >= 95) {
        clearInterval(interval);
        setUploadingState(optionIndex, { progress: 95 });
      } else {
        setUploadingState(optionIndex, { progress });
      }
    }, 100);
    return () => clearInterval(interval);
  };

  const handleOptionImageUpload = async (
    optionIndex: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    const input = event.currentTarget;
    setUploadingState(optionIndex, { isUploading: true, progress: 0, error: null });

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadingState(optionIndex, {
        isUploading: false,
        progress: 0,
        error: validation.error || "Invalid image file",
      });
      if (input) input.value = '';
      return;
    }

    const clearProgressInterval = simulateUploadProgress(optionIndex);
    try {
      const uploadedUrl = await uploadImageToCloudinary(file);
      const optimizedUrl = optimizeImageUrl(uploadedUrl, {
        width: 600,
        height: 400,
        quality: "auto",
        format: "auto",
      });
      setUploadingState(optionIndex, { progress: 100 });
      setTimeout(() => {
        updateOption(optionIndex, { imageUrl: optimizedUrl });
        setUploadingState(optionIndex, { isUploading: false, progress: 0, error: null });
      }, 200);
    } catch (error) {
      setUploadingState(optionIndex, {
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : "Failed to upload image",
      });
    } finally {
      clearProgressInterval();
      if (input) input.value = '';
    }
  };

  const triggerFileInput = (optionIndex: number) => {
    fileInputRefs.current[optionIndex]?.click();
  };

  // ── Scaling statements helpers ─────────────────────────────────────────────
  const getStatements = (): Array<{ id: string; text: string }> => {
    return (currentQuestion as any)?.statements ?? [];
  };

  const updateStatement = (idx: number, text: string) => {
    const stmts = getStatements();
    const updated = stmts.map((s, i) => (i === idx ? { ...s, text } : s));
    onUpdateQuestion({ statements: updated } as any);
  };

  const addStatement = () => {
    const stmts = getStatements();
    const newId = `${currentQuestion?.id ?? "q"}-s${Date.now()}`;
    onUpdateQuestion({ statements: [...stmts, { id: newId, text: "" }] } as any);
  };

  const removeStatement = (idx: number) => {
    const stmts = getStatements();
    onUpdateQuestion({ statements: stmts.filter((_, i) => i !== idx) } as any);
  };

  const updateLabel = (key: "min" | "max", value: string) => {
    const current = (currentQuestion as any)?.labels ?? {};
    onUpdateQuestion({ labels: { ...current, [key]: value } } as any);
  };

  // ── Ranking item helpers ─────────────────────────────────────────────
  const getRankingItems = (): Array<{ id: string; text: string; isCorrect: boolean }> => {
    return (currentQuestion as any)?.options ?? [];
  };

  const updateRankingItem = (idx: number, text: string) => {
    const items = getRankingItems();
    const updated = items.map((item, i) => (i === idx ? { ...item, text } : item));
    onUpdateQuestion({ options: updated } as any);
  };

  const addRankingItem = () => {
    const items = getRankingItems();
    const newId = `${currentQuestion?.id ?? "q"}-r${Date.now()}`;
    onUpdateQuestion({
      options: [...items, { id: newId, text: "", isCorrect: false }],
    } as any);
  };

  const removeRankingItem = (idx: number) => {
    const items = getRankingItems();
    if (items.length <= 2) return;
    onUpdateQuestion({ options: items.filter((_, i) => i !== idx) } as any);
  };

  // ── Rating scale helpers (stars only) ─────────────────────────────────────
  const updateRatingScaleConfig = (field: "scaleMax" | "minLabel" | "maxLabel", value: string | number) => {
    if (!currentQuestion) return;
    
    if (field === "scaleMax") {
      const max = typeof value === 'number' ? value : parseInt(value as string, 10);
      onUpdateQuestion({ scale: { min: 1, max: isNaN(max) ? 5 : max } });
    } else if (field === "minLabel") {
      onUpdateQuestion({ labels: { ...(currentQuestion.labels || {}), min: value as string } });
    } else if (field === "maxLabel") {
      onUpdateQuestion({ labels: { ...(currentQuestion.labels || {}), max: value as string } });
    }
  };

  // Helper to check if current question is multiple-choice type
  const isMultipleChoiceType = (): boolean => {
    if (!currentQuestion) return false;
    const type = currentQuestion.type;
    return type === "multiple-choice" || 
           type === "SINGLE_CHOICE" || 
           type === "MULTIPLE_CHOICE" ||
           type === "POLL";
  };

  // ── Edit Panel ─────────────────────────────────────────────────────────────
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

    const isChoiceType =
      currentQuestion.type === "multiple-choice" ||
      currentQuestion.type === "SINGLE_CHOICE" ||
      currentQuestion.type === "MULTIPLE_CHOICE" ||
      currentQuestion.type === "POLL";

    const isScalingType =
      currentQuestion.type === "scaling" ||
      (currentQuestion as any).type === "SCALING";

    const isRankingType =
      currentQuestion.type === "ranking" ||
      (currentQuestion as any).type === "RANKING";

    const isGrid2x2Type = currentQuestion.type === "grid-2x2" || (currentQuestion as any).type === "GRID_2X2";
    const isVoteType = currentQuestion.type === "vote" || (currentQuestion as any).type === "VOTE";
    const isRatingScaleType = currentQuestion.type === "rating-scale" || currentQuestion.type === "RATING";

    let questionTypeLabel = "Question";
    if (isGrid2x2Type) questionTypeLabel = "Grid 2×2";
    else if (isVoteType) questionTypeLabel = "Vote";
    else if (isRankingType) questionTypeLabel = "Ranking";
    else if (isScalingType) questionTypeLabel = "Scales";
    else if (isRatingScaleType) questionTypeLabel = "Rating Scale";
    else if (currentQuestion.type === "multiple-choice") questionTypeLabel = "Multiple Choice";
    else if (currentQuestion.type === "open-text") questionTypeLabel = "Open Text";
    else if (currentQuestion.type === "word-cloud") questionTypeLabel = "Word Cloud";

    // ── Grid 2x2 render ───────────────────────────────────────────────────────
    if (isGrid2x2Type) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button className="p-1 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-lg font-medium text-slate-800">{questionTypeLabel}</h2>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Question</label>
            <input
              type="text"
              value={currentQuestion.title || ""}
              onChange={(e) => onUpdateQuestion({ title: e.target.value })}
              className="w-full px-4 py-3 bg-[#F1F3F5] rounded-xl border border-transparent focus:border-slate-200 outline-none text-sm font-medium"
              placeholder="What would you like to place on the grid?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description (optional)</label>
            <textarea
              value={currentQuestion.description || ""}
              onChange={(e) => onUpdateQuestion({ description: e.target.value })}
              className="w-full px-4 py-3 bg-[#F1F3F5] rounded-xl border border-transparent focus:border-slate-200 outline-none text-sm resize-none min-h-[80px]"
              placeholder="Add additional context or instructions..."
            />
          </div>

          <Grid2x2Fields question={currentQuestion} onUpdate={onUpdateQuestion} />

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Question Image</label>
            <ImageUploadWidget
              currentImageUrl={currentQuestion.imageUrl || undefined}
              onImageSelect={(imageUrl) => onUpdateQuestion({ imageUrl })}
              onImageRemove={() => onUpdateQuestion({ imageUrl: null })}
            />
          </div>

        </div>
      );
    }

    // ── Vote render ───────────────────────────────────────────────────────────
    if (isVoteType) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button className="p-1 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-lg font-medium text-slate-800">{questionTypeLabel}</h2>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Question</label>
            <input
              type="text"
              value={currentQuestion.title || ""}
              onChange={(e) => onUpdateQuestion({ title: e.target.value })}
              className="w-full px-4 py-3 bg-[#F1F3F5] rounded-xl border border-transparent focus:border-slate-200 outline-none text-sm font-medium"
              placeholder="What would you like participants to vote on?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description (optional)</label>
            <textarea
              value={currentQuestion.description || ""}
              onChange={(e) => onUpdateQuestion({ description: e.target.value })}
              className="w-full px-4 py-3 bg-[#F1F3F5] rounded-xl border border-transparent focus:border-slate-200 outline-none text-sm resize-none min-h-[80px]"
              placeholder="Add additional context or instructions..."
            />
          </div>

          <VoteFields question={currentQuestion} onUpdate={onUpdateQuestion} />

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Question Image</label>
            <ImageUploadWidget
              currentImageUrl={currentQuestion.imageUrl || undefined}
              onImageSelect={(imageUrl) => onUpdateQuestion({ imageUrl })}
              onImageRemove={() => onUpdateQuestion({ imageUrl: null })}
            />
          </div>

        </div>
      );
    }

    // ── Rating Scale render (STARS ONLY - stars below slider) ──────────────────────────────────────
    if (isRatingScaleType) {
      const currentScaleMax = (currentQuestion as any).scale?.max || 5;
      const currentMinLabel = (currentQuestion as any).labels?.min || "Low";
      const currentMaxLabel = (currentQuestion as any).labels?.max || "High";

      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button className="p-1 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-lg font-medium text-slate-800">{questionTypeLabel}</h2>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Question</label>
            <input
              type="text"
              value={currentQuestion.title || ""}
              onChange={(e) => onUpdateQuestion({ title: e.target.value })}
              className="w-full px-4 py-3 bg-[#F1F3F5] rounded-xl border border-transparent focus:border-slate-200 outline-none text-sm font-medium"
              placeholder="How would you rate this?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description (optional)</label>
            <textarea
              value={currentQuestion.description || ""}
              onChange={(e) => onUpdateQuestion({ description: e.target.value })}
              className="w-full px-4 py-3 bg-[#F1F3F5] rounded-xl border border-transparent focus:border-slate-200 outline-none text-sm resize-none min-h-[80px]"
              placeholder="Add additional context or instructions..."
            />
          </div>

          {/* Star scale configuration */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Star Scale</label>
            
            {/* Slider row */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 flex-shrink-0">1</span>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={currentScaleMax}
                onChange={(e) => updateRatingScaleConfig("scaleMax", parseInt(e.target.value, 10))}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 accent-indigo-600"
              />
              <span className="text-xs text-slate-500 flex-shrink-0">10</span>
              <span className="text-sm font-bold text-indigo-600 w-8 text-right">{currentScaleMax}</span>
            </div>

            {/* Stars displayed below the slider - WRAPPING LAYOUT */}
            <div className="flex flex-wrap justify-center gap-1.5 pt-2">
              {Array.from({ length: currentScaleMax }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400 flex-shrink-0" />
              ))}
            </div>

            {/* Labels */}
            <div className="flex justify-between text-[10px] text-slate-500 pt-1">
              <span>{currentMinLabel}</span>
              <span>{currentMaxLabel}</span>
            </div>
          </div>

          {/* Scale labels edit inputs */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Scale Labels</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Low label</label>
                <input
                  type="text"
                  value={currentMinLabel}
                  onChange={(e) => updateRatingScaleConfig("minLabel", e.target.value)}
                  className="w-full px-3 py-2 bg-[#F1F3F5] rounded-xl text-sm border border-transparent focus:border-slate-200 outline-none"
                  placeholder="e.g., Poor, Low, Bad"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">High label</label>
                <input
                  type="text"
                  value={currentMaxLabel}
                  onChange={(e) => updateRatingScaleConfig("maxLabel", e.target.value)}
                  className="w-full px-3 py-2 bg-[#F1F3F5] rounded-xl text-sm border border-transparent focus:border-slate-200 outline-none"
                  placeholder="e.g., Excellent, High, Great"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Question Image</label>
            <ImageUploadWidget
              currentImageUrl={currentQuestion.imageUrl || undefined}
              onImageSelect={(imageUrl) => onUpdateQuestion({ imageUrl })}
              onImageRemove={() => onUpdateQuestion({ imageUrl: null })}
            />
          </div>
        </div>
      );
    }

    // ── Rest of the renderEditPanel for other question types ─────────────────
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button className="p-1 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-lg font-medium text-slate-800">{questionTypeLabel}</h2>
        </div>

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

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description (optional)</label>
          <textarea
            value={currentQuestion.description || ""}
            onChange={(e) => onUpdateQuestion({ description: e.target.value })}
            className="w-full px-4 py-3 bg-[#F1F3F5] rounded-xl border border-transparent focus:border-slate-200 outline-none text-sm resize-none min-h-[80px]"
            placeholder="Add additional context or instructions..."
          />
        </div>

        {/* Ranking items editor */}
        {isRankingType && (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <ListOrdered className="w-3.5 h-3.5 text-violet-600" />
                Ranking Items
              </label>
              <p className="text-[11px] text-slate-400 leading-relaxed -mt-1">
                Add 2–8 items. Participants will drag them into their preferred order.
              </p>
              <div className="space-y-2">
                {getRankingItems().map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                    <div className="flex-1 flex items-center gap-2 bg-[#F1F3F5] rounded-xl px-3 py-2.5 border border-transparent focus-within:border-violet-200 transition-all">
                      <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => updateRankingItem(idx, e.target.value)}
                        className="bg-transparent border-none outline-none text-sm w-full font-medium"
                        placeholder={`Item ${idx + 1}`}
                      />
                    </div>
                    <button
                      onClick={() => removeRankingItem(idx)}
                      disabled={getRankingItems().length <= 2}
                      className="text-slate-300 hover:text-rose-500 shrink-0 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addRankingItem}
                disabled={getRankingItems().length >= 8}
                className="w-full py-3 bg-[#F1F3F5] hover:bg-[#E9ECEF] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                {getRankingItems().length >= 8 ? "Maximum 8 items" : "Add item"}
              </button>
            </div>
          </div>
        )}

        {/* Scaling statements editor */}
        {isScalingType && (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
                Statements
              </label>
              <div className="space-y-2">
                {getStatements().map((stmt, idx) => (
                  <div key={stmt.id} className="flex items-center gap-2 group">
                    <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                    <div className="flex-1 flex items-center gap-2 bg-[#F1F3F5] rounded-xl px-3 py-2.5 border border-transparent focus-within:border-slate-200 transition-all">
                      <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        value={stmt.text}
                        onChange={(e) => updateStatement(idx, e.target.value)}
                        className="bg-transparent border-none outline-none text-sm w-full font-medium"
                        placeholder={`Statement ${idx + 1}`}
                      />
                    </div>
                    <button
                      onClick={() => removeStatement(idx)}
                      className="text-slate-300 hover:text-rose-500 shrink-0 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addStatement}
                className="w-full py-3 bg-[#F1F3F5] hover:bg-[#E9ECEF] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add statement
              </button>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Scale Labels</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium">Min label</span>
                  <input
                    type="text"
                    value={(currentQuestion as any)?.labels?.min ?? "Strongly disagree"}
                    onChange={(e) => updateLabel("min", e.target.value)}
                    className="w-full px-3 py-2 bg-[#F1F3F5] rounded-xl border border-transparent focus:border-slate-200 outline-none text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium">Max label</span>
                  <input
                    type="text"
                    value={(currentQuestion as any)?.labels?.max ?? "Strongly agree"}
                    onChange={(e) => updateLabel("max", e.target.value)}
                    className="w-full px-3 py-2 bg-[#F1F3F5] rounded-xl border border-transparent focus:border-slate-200 outline-none text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Multiple choice options editor */}
        {isChoiceType && (
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Options</label>
            <div className="space-y-2">
              {currentQuestion.options?.map((opt, idx) => {
                const uploadState = uploadStates[idx] || { isUploading: false, progress: 0, error: null };
                return (
                  <div key={opt.id} className="space-y-2">
                    <div className="flex items-center gap-2 group">
                      <button
                        onClick={() => {
                          const newOpts = [...(currentQuestion.options || [])];
                          newOpts[idx] = { ...newOpts[idx], isCorrect: !newOpts[idx].isCorrect };
                          onUpdateQuestion({ options: newOpts });
                        }}
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                          opt.isCorrect ? "bg-[#6366F1] border-[#6366F1]" : "border-slate-200",
                        )}
                      >
                        {opt.isCorrect && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <div className="flex-1 flex items-center gap-2 bg-[#F1F3F5] rounded-xl px-3 py-2.5 border border-transparent focus-within:border-slate-200 transition-all">
                        <div className={cn("w-4 h-4 rounded-full shrink-0", idx === 0 ? "bg-blue-500" : idx === 1 ? "bg-rose-400" : idx === 2 ? "bg-indigo-900" : "bg-emerald-500")} />
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => updateOption(idx, { text: e.target.value })}
                          className="bg-transparent border-none outline-none text-sm w-full font-medium"
                          placeholder={"Option " + (idx + 1)}
                        />
                        <button
                          type="button"
                          onClick={() => triggerFileInput(idx)}
                          disabled={uploadState.isUploading}
                          className="w-8 h-8 shrink-0 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-[#6366F1] hover:text-[#6366F1] transition-colors disabled:opacity-60 disabled:cursor-not-allowed relative"
                        >
                          {uploadState.isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6366F1]" /> : <Upload className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                        <input ref={(el) => { fileInputRefs.current[idx] = el; }} type="file" accept="image/*" className="hidden" onChange={(event) => handleOptionImageUpload(idx, event)} disabled={uploadState.isUploading} />
                      </div>
                      <button onClick={() => { const newOpts = (currentQuestion.options || []).filter((_, i) => i !== idx); onUpdateQuestion({ options: newOpts }); }} className="text-slate-400 hover:text-rose-500 shrink-0"><X className="w-4 h-4" /></button>
                    </div>
                    {uploadState.isUploading && uploadState.progress > 0 && uploadState.progress < 100 && (
                      <div className="ml-7">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><Loader2 className="w-3 h-3 animate-spin" /><span>Uploading... {uploadState.progress}%</span></div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${uploadState.progress}%` }} /></div>
                      </div>
                    )}
                    {uploadState.error && <p className="ml-7 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{uploadState.error}</p>}
                    {opt.imageUrl && !uploadState.isUploading && (
                      <div className="ml-7 relative w-full max-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <img src={opt.imageUrl} alt="" className="w-full h-28 object-contain" />
                        <button type="button" onClick={() => removeOptionImage(idx)} className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-colors"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={() => { const newOpts = [...(currentQuestion.options || [])]; const newId = `${currentQuestion.id}-${Date.now()}`; newOpts.push({ id: newId, text: `Option ${newOpts.length + 1}`, isCorrect: false }); onUpdateQuestion({ options: newOpts }); }} className="w-full py-3 bg-[#F1F3F5] hover:bg-[#E9ECEF] rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors"><Plus className="w-3.5 h-3.5" /> Add option</button>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Question Image</label>
          <ImageUploadWidget currentImageUrl={currentQuestion.imageUrl || undefined} onImageSelect={(imageUrl) => onUpdateQuestion({ imageUrl })} onImageRemove={() => onUpdateQuestion({ imageUrl: null })} />
        </div>

      </div>
    );
  };

  // ── Comments Panel ──────────────────────────────────────────
  const renderCommentsPanel = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="relative w-16 h-16 mb-5">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full blur-2xl opacity-70" />
        <div className="relative w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
          <MessageSquareText className="w-7 h-7 text-slate-300" />
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.15em] shadow-md mb-4">
        <Clock className="w-2.5 h-2.5" />
        Coming soon
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1.5">Collaborator comments</h3>
      <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">Leave notes for your team or yourself on each question. This is still being built and will be available in a future release.</p>
    </div>
  );

  // ── Interactivity Panel ─────────────────────────────────────
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

    const maxAdvance = Math.min(100, Math.max(1, q.speedMaxAdvance ?? 3));
    const isMultiChoice = isMultipleChoiceType();

    // Get current values for mutual exclusivity
    const isSpeedOn = q.isSpeedQuestion ?? false;
    const isSkipOn = q.skipAllowed ?? false;

    // Handlers that enforce mutual exclusivity
    const handleSkipToggle = (val: boolean) => {
      if (val) {
        // Turning skip ON: turn speed OFF
        onUpdateQuestion({ skipAllowed: true, isSpeedQuestion: false });
      } else {
        onUpdateQuestion({ skipAllowed: false });
      }
    };

    const handleSpeedToggle = (val: boolean) => {
      if (val) {
        // Turning speed ON: turn skip OFF
        onUpdateQuestion({ isSpeedQuestion: true, skipAllowed: false });
      } else {
        onUpdateQuestion({ isSpeedQuestion: false });
      }
    };

    return (
      <div className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Time limit</h3>
            <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[15, 30, 45, 60].map((s) => (
              <button key={s} onClick={() => onUpdateQuestion({ timeLimit: s })} className={cn("py-2 rounded-lg text-xs font-bold transition-all", q.timeLimit === s ? "bg-[#6366F1] text-white" : "bg-[#F1F3F5] text-slate-600 hover:bg-slate-200")}>{s}s</button>
            ))}
            <button onClick={() => onUpdateQuestion({ timeLimit: null })} className={cn("py-2 rounded-lg text-xs font-bold transition-all", q.timeLimit == null ? "bg-[#6366F1] text-white" : "bg-[#F1F3F5] text-slate-600 hover:bg-slate-200")}>No timer</button>
          </div>
        </section>

        <div className="h-px bg-slate-100" />

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Points</h3>
            <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 10, 20, 30, 50, 100].map((p) => (
              <button key={p} onClick={() => onUpdateQuestion({ points: p })} className={cn("py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1", q.points === p ? "bg-amber-500 text-white" : "bg-[#F1F3F5] text-slate-600 hover:bg-slate-200")}><Star className="w-3 h-3" />{p}</button>
            ))}
          </div>
        </section>

        <div className="h-px bg-slate-100" />

        <section className="space-y-3">
          <div className="flex items-center gap-2"><h3 className="text-sm font-bold text-slate-800">Participant names</h3></div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">Hide participant names</span>
            <MentiToggle checked={interactivitySettings.hideParticipantNames} onChange={(val) => { setInteractivitySettings((prev) => ({ ...prev, hideParticipantNames: val })); onUpdateQuestion({ hideParticipantNames: val }); }} />
          </div>
        </section>

        <div className="h-px bg-slate-100" />

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800">Settings</h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><BarChart2 className="w-3.5 h-3.5 text-slate-400" /><span className="text-xs text-slate-600">Show results instantly</span></div>
              <MentiToggle checked={interactivitySettings.showResultsInstantly} onChange={(val) => { setInteractivitySettings((prev) => ({ ...prev, showResultsInstantly: val })); onUpdateQuestion({ showResultsInstantly: val }); }} />
            </div>
          </div>

          {/* ============================================================ */}
          {/* UPDATED: Skip toggle - disabled when speed is ON */}
          {/* ============================================================ */}
          {isEliminationMode && isMultiChoice && (
            <>
              <div className="h-px bg-slate-100 mt-2" />
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-xs text-slate-600 font-medium">Allow skip on this question</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Participants can skip without elimination</p>
                </div>
                <MentiToggle 
                  checked={isSkipOn} 
                  onChange={handleSkipToggle}
                  disabled={isSpeedOn}  // Disabled when speed is on
                />
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* UPDATED: Speed toggle - disabled when skip is ON */}
          {/* ============================================================ */}
          {isEliminationMode && isMultiChoice && (
            <>
              <div className="h-px bg-slate-100 mt-2" />
              <div className="flex items-center justify-between pt-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-600 font-medium">Speed Question</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Eliminate participants based on response speed.</p>
                </div>
                <MentiToggle 
                  checked={isSpeedOn} 
                  onChange={handleSpeedToggle}
                  disabled={isSkipOn}  // Disabled when skip is on
                />
              </div>
              {isSpeedOn && (
                <div className="mt-2.5 ml-7 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">Advance limit</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="1" 
                        max="100" 
                        value={maxAdvance} 
                        onChange={(e) => { 
                          const val = parseInt(e.target.value, 10); 
                          onUpdateQuestion({ speedMaxAdvance: isNaN(val) ? 3 : Math.max(1, val) }); 
                        }} 
                        className="w-14 px-2 py-1 text-center text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Only the first {maxAdvance} participants who answer correctly will move to the next round.
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        <div className="h-px bg-slate-100" />

        <ComingSoon>
          <section className="space-y-3">
            <div className="flex items-center gap-2"><h3 className="text-sm font-bold text-slate-800">Reactions</h3><HelpCircle className="w-3.5 h-3.5 text-slate-300" /></div>
            <div className="flex gap-1.5">{ [Heart, PawPrint, HelpCircle, ThumbsUp, ThumbsDown].map((Icon, i) => (<button key={i} className={cn("w-9 h-9 rounded-lg border flex items-center justify-center transition-all", i === 3 ? "border-[#6366F1] bg-indigo-50/50" : "border-slate-200 bg-white hover:border-slate-300")}><Icon className={cn("w-4 h-4", i === 3 ? "text-slate-800" : "text-slate-800")} fill={i === 3 ? "currentColor" : "none"} /></button>)) }</div>
          </section>
        </ComingSoon>

        <div className="h-px bg-slate-100" />

        <ComingSoon>
          <section className="space-y-3">
            <div className="flex items-center gap-2"><h3 className="text-sm font-bold text-slate-800">Q&A</h3><HelpCircle className="w-3.5 h-3.5 text-slate-300" /></div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-xs text-slate-600">Enable Q&A</span><MentiToggle checked={interactivitySettings.qaEnabled} onChange={() => {}} /></div>
              <div className="flex items-center justify-between"><span className="text-xs text-slate-600 leading-tight">Questions are visible to everyone</span><MentiToggle checked={interactivitySettings.qaVisibleToAll} onChange={() => {}} /></div>
              <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><span className="text-xs text-slate-600">Moderation</span><div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center"><Star className="w-2.5 h-2.5 text-emerald-700 fill-current" /></div></div><MentiToggle checked={interactivitySettings.qaModeration} onChange={() => {}} /></div>
            </div>
          </section>
        </ComingSoon>
      </div>
    );
  };

  // ── Themes Panel ───────────────────────────────────────────────
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
      <ComingSoon>
        <div className="space-y-5">
          <div><p className="text-sm font-bold text-slate-800 mb-1">Question Theme</p><p className="text-xs text-slate-400">Choose a visual style for this question. It will appear in the participant preview.</p></div>
          <div className="grid grid-cols-2 gap-3">{QUESTION_THEMES.map((theme) => (<ThemePreviewCard key={theme.id} theme={theme} question={currentQuestion} isSelected={selectedThemeId === theme.id} onClick={() => handleThemeSelect(theme.id)} />))}</div>
          {selectedThemeId !== "default" && (<button onClick={() => handleThemeSelect("default")} className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Reset to Default</button>)}
        </div>
      </ComingSoon>
    );
  };

  const renderPanelContent = () => {
    switch (activeMenu) {
      case "edit": return renderEditPanel();
      case "comments": return renderCommentsPanel();
      case "interactivity": return renderInteractivityPanel();
      case "themes": return renderThemesPanel();
      default: return null;
    }
  };

  const panelTitle = menuItems.find((m) => m.id === activeMenu)?.label ?? "Edit";

  if (inline) {
    return (
      <div className="flex flex-col">
        <div className="flex border-b border-slate-100 bg-white sticky top-0 z-10">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (<button key={item.id} onClick={() => setActiveMenu(item.id)} className={cn("flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-bold border-b-2 transition-all", isActive ? "border-[#6366F1] text-[#6366F1]" : "border-transparent text-slate-400")}><Icon className="w-4 h-4" />{item.label}</button>);
          })}
        </div>
        <div className="px-4 py-4 pb-8">{renderPanelContent()}</div>
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-0 h-full flex z-30 bg-white">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 360, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="bg-white border-l border-slate-200 overflow-hidden h-full">
            <div className="w-[360px] h-full flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{panelTitle}</h3>
                <button onClick={onToggle} className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5">{renderPanelContent()}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-[92px] bg-white border-l border-slate-200 flex flex-col items-center py-4 gap-1 shrink-0 h-full">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id && isOpen;
          return (<button key={item.id} onClick={() => handleMenuClick(item.id)} className={cn("w-[76px] h-[76px] flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all", isActive ? "bg-indigo-50 text-[#6366F1]" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50")}><Icon className="w-6 h-6" /><span className="text-[11px] font-semibold">{item.label}</span></button>);
        })}
      </div>
    </div>
  );
}