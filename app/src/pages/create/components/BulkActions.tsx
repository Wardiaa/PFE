// BulkActions.tsx (updated - fully responsive)
import { useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "../../../hooks/use-toast";
import type { Question } from "../types";
import {
  Copy,
  Trash2,
  Shuffle,
  Download,
  Upload,
  ChevronUp,
  ChevronDown,
  ArrowUpToLine,
  ArrowDownToLine,
  CheckSquare,
  Square,
  Timer,
  Star,
  X,
  LayoutGrid,
  AlertTriangle
} from "lucide-react";

interface BulkActionsProps {
  questions: Question[];
  onUpdateQuestions: (questions: Question[]) => void;
  selectedQuestions: number[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onReorderQuestions: (direction: "up" | "down" | "top" | "bottom") => void;
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
    {children}
  </p>
);

const StudioButton = ({
  onClick,
  disabled,
  children,
  variant = "default",
  className = "",
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "default" | "danger" | "accent" | "ghost";
  className?: string;
}) => {
  const base =
    "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer select-none";
  const variants = {
    default: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300",
    danger:  "bg-white border-slate-200 text-red-600 hover:border-red-600 hover:bg-red-50/50",
    accent:  "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700",
    ghost:   "bg-transparent border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-100",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabled ? "opacity-30 pointer-events-none" : ""} ${className}`}
    >
      {children}
    </button>
  );
};

interface ModalProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmVariant?: "danger" | "accent";
  children: React.ReactNode;
}

const StudioModal = ({ title, onConfirm, onCancel, confirmLabel = "Apply", confirmVariant = "accent", children }: ModalProps) => {
  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-[340px] shadow-2xl shadow-black/10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{title}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mb-6">{children}</div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-wider transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white text-[10px] font-bold uppercase tracking-wider transition-all ${
              confirmVariant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export function BulkActions({
  questions,
  onUpdateQuestions,
  selectedQuestions,
  onSelectAll,
  onClearSelection,
  onReorderQuestions,
}: BulkActionsProps) {
  const { toast } = useToast();
  const [actionType, setActionType] = useState<string | null>(null);
  const [timeLimitValue, setTimeLimitValue] = useState(30);
  const [pointsValue, setPointsValue] = useState(10);

  const selectedCount = selectedQuestions.length;
  const totalCount = questions.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const hasSelection = selectedCount > 0;

  const handleBulkAction = () => {
    if (!selectedCount) return;
    let updated = [...questions];

    switch (actionType) {
      case "time":
        updated = updated.map((q, i) => selectedQuestions.includes(i) ? { ...q, timeLimit: timeLimitValue } : q);
        toast({ title: "Updated", description: `Time limit set for ${selectedCount} questions` });
        break;
      case "points":
        updated = updated.map((q, i) => selectedQuestions.includes(i) ? { ...q, points: pointsValue } : q);
        toast({ title: "Updated", description: `Points set for ${selectedCount} questions` });
        break;
      case "shuffle":
        updated = updated.map((q, i) => {
          if (selectedQuestions.includes(i) && q.options)
            return { ...q, options: [...q.options].sort(() => Math.random() - 0.5) };
          return q;
        });
        toast({ title: "Shuffled", description: `Answer options shuffled for ${selectedCount} questions` });
        break;
      case "duplicate": {
        const duplicates: Question[] = [];
        questions.forEach((q, i) => {
          if (selectedQuestions.includes(i))
            duplicates.push({ ...q, id: Date.now().toString() + i, title: `${q.title} (Copy)` });
        });
        let offset = 0;
        selectedQuestions.forEach((origIdx, idx) => {
          updated.splice(origIdx + idx + 1 + offset, 0, duplicates[idx]);
          offset++;
        });
        toast({ title: "Duplicated", description: `${selectedCount} questions duplicated` });
        break;
      }
      case "delete":
        updated = questions.filter((_, i) => !selectedQuestions.includes(i));
        onClearSelection();
        toast({ title: "Deleted", description: `${selectedCount} questions removed` });
        break;
      default:
        return;
    }
    onUpdateQuestions(updated);
    setActionType(null);
  };

  const handleExportSelected = () => {
    if (!selectedCount) return;
    const data = JSON.stringify(questions.filter((_, i) => selectedQuestions.includes(i)), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "selected-questions.json";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${selectedCount} questions exported` });
  };

  const handleExportAll = () => {
    const data = JSON.stringify(questions, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "all-questions.json";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${questions.length} questions exported` });
  };

  const handleImportQuestions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (Array.isArray(imported) && imported.length > 0) {
          onUpdateQuestions([...questions, ...imported]);
          toast({ title: "Imported", description: `${imported.length} questions imported` });
        }
      } catch {
        toast({ title: "Import failed", description: "Invalid file format", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const renderModal = () => {
    if (!actionType) return null;

    const configs: Record<string, { title: string; body: React.ReactNode; label: string; variant: "accent" | "danger" }> = {
      time: {
        title: "Set Time Limit", label: `Apply to ${selectedCount}`, variant: "accent",
        body: (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Seconds</label>
              <input type="number" value={timeLimitValue} onChange={(e) => setTimeLimitValue(parseInt(e.target.value) || 30)} min={5} max={300}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm font-semibold focus:outline-none focus:border-indigo-400 transition-colors" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 45, 60].map((t) => (
                <button key={t} onClick={() => setTimeLimitValue(t)}
                  className={`py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${timeLimitValue === t ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300"}`}>
                  {t}s
                </button>
              ))}
            </div>
          </div>
        ),
      },
      points: {
        title: "Set Points", label: `Apply to ${selectedCount}`, variant: "accent",
        body: (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Points</label>
              <input type="number" value={pointsValue} onChange={(e) => setPointsValue(parseInt(e.target.value) || 10)} min={0} max={100}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm font-semibold focus:outline-none focus:border-indigo-400 transition-colors" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((p) => (
                <button key={p} onClick={() => setPointsValue(p)}
                  className={`py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${pointsValue === p ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300"}`}>
                  {p}pt
                </button>
              ))}
            </div>
          </div>
        ),
      },
      delete: {
        title: "Delete Questions", label: `Delete Selection`, variant: "danger",
        body: (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <p className="text-sm font-bold uppercase tracking-tight">Warning</p>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              You are about to permanently delete <span className="font-bold text-slate-900">{selectedCount}</span> selected question{selectedCount > 1 ? 's' : ''}. This action cannot be undone.
            </p>
          </div>
        ),
      },
      duplicate: {
        title: "Duplicate Questions", label: `Duplicate ${selectedCount}`, variant: "accent",
        body: <p className="text-xs text-slate-500 leading-relaxed">Create exact copies of <span className="text-slate-900 font-bold">{selectedCount}</span> selected items.</p>,
      },
      shuffle: {
        title: "Shuffle Answers", label: `Shuffle ${selectedCount}`, variant: "accent",
        body: <p className="text-xs text-slate-500 leading-relaxed">Randomize answer order for <span className="text-slate-900 font-bold">{selectedCount}</span> selected items.</p>,
      },
    };

    const cfg = configs[actionType];
    if (!cfg) return null;
    return (
      <StudioModal title={cfg.title} confirmLabel={cfg.label} confirmVariant={cfg.variant} onConfirm={handleBulkAction} onCancel={() => setActionType(null)}>
        {cfg.body}
      </StudioModal>
    );
  };

  return (
    <div className="text-slate-700 space-y-5">
      <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selection Status</span>
          <span className={`text-[10px] font-bold ${hasSelection ? "text-indigo-600" : "text-slate-400"}`}>
            {selectedCount} / {totalCount}
          </span>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: totalCount > 0 ? `${(selectedCount / totalCount) * 100}%` : "0%" }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={allSelected ? onClearSelection : onSelectAll}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-all"
          >
            {allSelected ? <><Square className="w-3 h-3" /> Deselect</> : <><CheckSquare className="w-3 h-3" /> Select All</>}
          </button>
          {hasSelection && (
            <button
              onClick={onClearSelection}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 text-[10px] font-bold uppercase transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {hasSelection ? (
        <>
          <div>
            <SectionLabel>Reorder</SectionLabel>
            <div className="grid grid-cols-4 gap-1 bg-white rounded-xl border border-slate-200 p-1">
              {[
                { icon: <ArrowUpToLine className="w-3.5 h-3.5" />, dir: "top" as const, tip: "Top" },
                { icon: <ChevronUp className="w-3.5 h-3.5" />, dir: "up" as const, tip: "Up" },
                { icon: <ChevronDown className="w-3.5 h-3.5" />, dir: "down" as const, tip: "Down" },
                { icon: <ArrowDownToLine className="w-3.5 h-3.5" />, dir: "bottom" as const, tip: "Bottom" },
              ].map(({ icon, dir, tip }) => (
                <button
                  key={dir}
                  onClick={() => onReorderQuestions(dir)}
                  title={tip}
                  className="flex items-center justify-center py-2.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <SectionLabel>Points</SectionLabel>
              <div className="grid grid-cols-2 gap-1.5">
                {[10, 20].map((pts) => (
                  <button key={pts} onClick={() => { setPointsValue(pts); setActionType("points"); }}
                    className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-all">
                    <Star className="w-2.5 h-2.5" />{pts}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <SectionLabel>Timer</SectionLabel>
              <div className="grid grid-cols-2 gap-1.5">
                {[30, 60].map((t) => (
                  <button key={t} onClick={() => { setTimeLimitValue(t); setActionType("time"); }}
                    className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-all">
                    <Timer className="w-2.5 h-2.5" />{t}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <SectionLabel>Bulk Manage</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <StudioButton onClick={() => setActionType("duplicate")}><Copy className="w-3.5 h-3.5" /> Duplicate</StudioButton>
              <StudioButton onClick={() => setActionType("shuffle")}><Shuffle className="w-3.5 h-3.5" /> Shuffle</StudioButton>
              <StudioButton className="w-full col-span-2" onClick={handleExportSelected}><Download className="w-3.5 h-3.5" /> Export Selected</StudioButton>
              <StudioButton className="w-full col-span-2"  onClick={() => setActionType("delete")}><Trash2 className="w-3.5 h-3.5" /> Delete Selection</StudioButton>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="py-8 flex flex-col items-center text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-3">
              <CheckSquare className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-tight">No Selection</p>
            <p className="text-[10px] text-slate-400 mb-4 max-w-[140px] leading-normal">Choose questions to enable bulk editing tools</p>
            <button
              onClick={onSelectAll}
              disabled={totalCount === 0}
              className="px-5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all disabled:opacity-30"
            >
              Select All
            </button>
          </div>

          {totalCount > 0 && (
            <div className="p-3 rounded-2xl bg-white border border-slate-200">
              <SectionLabel>Quick Stats</SectionLabel>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Total", value: questions.length },
                  { label: "Timed", value: questions.filter((q) => q.timeLimit).length },
                  { label: "Star", value: questions.filter((q) => q.points && q.points > 0).length },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl py-2 px-1 border border-slate-100">
                    <div className="text-sm font-bold text-slate-900">{value}</div>
                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <SectionLabel>Data Management</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <StudioButton onClick={handleExportAll} disabled={totalCount === 0}><Download className="w-3.5 h-3.5" /> Export All</StudioButton>
              <div>
                <input type="file" id="import-file-bulk" className="hidden" accept=".json" onChange={handleImportQuestions} />
                <StudioButton className="w-full" onClick={() => document.getElementById("import-file-bulk")?.click()}><Upload className="w-3.5 h-3.5" /> Import</StudioButton>
              </div>
            </div>
          </div>
        </>
      )}

      {renderModal()}
    </div>
  );
}