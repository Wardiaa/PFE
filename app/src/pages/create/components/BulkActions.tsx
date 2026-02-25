import { useState } from "react";
import { useToast } from "../../../hooks/use-toast";
import type { Question } from "../types";
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
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
  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.35em] mb-2 px-0.5">
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
    "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-150 cursor-pointer select-none";
  const variants = {
    default: "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 shadow-sm",
    danger:  "bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100 hover:border-rose-300",
    accent:  "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300",
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

const StudioModal = ({ title, onConfirm, onCancel, confirmLabel = "Apply", confirmVariant = "accent", children }: ModalProps) => (
  <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[100]">
    <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-slate-200/80">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mb-6">{children}</div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] transition-all"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
            confirmVariant === "danger"
              ? "bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-200"
              : "bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-200"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

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
      case "lock":
        updated = updated.map((q, i) => selectedQuestions.includes(i) ? { ...q, locked: true } : q);
        toast({ title: "Locked", description: `${selectedCount} questions locked` });
        break;
      case "unlock":
        updated = updated.map((q, i) => selectedQuestions.includes(i) ? { ...q, locked: false } : q);
        toast({ title: "Unlocked", description: `${selectedCount} questions unlocked` });
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
        title: "Set Time Limit", label: `Apply to ${selectedCount} Questions`, variant: "accent",
        body: (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Duration (seconds)</label>
              <input type="number" value={timeLimitValue} onChange={(e) => setTimeLimitValue(parseInt(e.target.value) || 30)} min={5} max={300}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm font-semibold focus:outline-none focus:border-indigo-400 transition-colors" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 45, 60].map((t) => (
                <button key={t} onClick={() => setTimeLimitValue(t)}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${timeLimitValue === t ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-100 border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"}`}>
                  {t}s
                </button>
              ))}
            </div>
          </div>
        ),
      },
      points: {
        title: "Set Points", label: `Apply to ${selectedCount} Questions`, variant: "accent",
        body: (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Points per question</label>
              <input type="number" value={pointsValue} onChange={(e) => setPointsValue(parseInt(e.target.value) || 10)} min={0} max={100}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm font-semibold focus:outline-none focus:border-indigo-400 transition-colors" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((p) => (
                <button key={p} onClick={() => setPointsValue(p)}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${pointsValue === p ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-100 border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"}`}>
                  {p}pt
                </button>
              ))}
            </div>
          </div>
        ),
      },
      delete: {
        title: "Delete Questions", label: `Delete ${selectedCount} Questions`, variant: "danger",
        body: (
          <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-700 mb-1">This cannot be undone</p>
              <p className="text-xs text-rose-500">You are about to permanently delete {selectedCount} question{selectedCount > 1 ? "s" : ""}.</p>
            </div>
          </div>
        ),
      },
      duplicate: {
        title: "Duplicate Questions", label: `Duplicate ${selectedCount} Questions`, variant: "accent",
        body: <p className="text-sm text-slate-500 leading-relaxed">This will create exact copies of <span className="text-slate-900 font-semibold">{selectedCount}</span> selected question{selectedCount > 1 ? "s" : ""}, inserted right after the originals.</p>,
      },
      lock: {
        title: "Lock Questions", label: `Lock ${selectedCount} Questions`, variant: "accent",
        body: <p className="text-sm text-slate-500 leading-relaxed">Locking will protect <span className="text-slate-900 font-semibold">{selectedCount}</span> question{selectedCount > 1 ? "s" : ""} from accidental edits.</p>,
      },
      unlock: {
        title: "Unlock Questions", label: `Unlock ${selectedCount} Questions`, variant: "accent",
        body: <p className="text-sm text-slate-500 leading-relaxed">Unlocking will allow <span className="text-slate-900 font-semibold">{selectedCount}</span> question{selectedCount > 1 ? "s" : ""} to be edited again.</p>,
      },
      shuffle: {
        title: "Shuffle Answers", label: `Shuffle ${selectedCount} Questions`, variant: "accent",
        body: <p className="text-sm text-slate-500 leading-relaxed">This will randomize the order of answer options for each of the <span className="text-slate-900 font-semibold">{selectedCount}</span> selected question{selectedCount > 1 ? "s" : ""}.</p>,
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

      {/* Selection Status */}
      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Selection</span>
          <span className={`text-[10px] font-bold ${hasSelection ? "text-indigo-600" : "text-slate-400"}`}>
            {selectedCount} / {totalCount}
          </span>
        </div>
        <div className="h-0.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
            style={{ width: totalCount > 0 ? `${(selectedCount / totalCount) * 100}%` : "0%" }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={allSelected ? onClearSelection : onSelectAll}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-indigo-600 transition-all shadow-sm"
          >
            {allSelected ? <><Square className="w-3 h-3" /> Deselect All</> : <><CheckSquare className="w-3 h-3" /> Select All</>}
          </button>
          {hasSelection && (
            <button
              onClick={onClearSelection}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-700 text-[9px] font-black uppercase tracking-[0.15em] transition-all shadow-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {hasSelection ? (
        <>
          {/* Reorder */}
          <div>
            <SectionLabel>Reorder</SectionLabel>
            <div className="grid grid-cols-4 gap-1 bg-slate-50 rounded-xl border border-slate-200 p-1">
              {[
                { icon: <ArrowUpToLine className="w-3.5 h-3.5" />, dir: "top" as const, tip: "To Top" },
                { icon: <ChevronUp className="w-3.5 h-3.5" />, dir: "up" as const, tip: "Move Up" },
                { icon: <ChevronDown className="w-3.5 h-3.5" />, dir: "down" as const, tip: "Move Down" },
                { icon: <ArrowDownToLine className="w-3.5 h-3.5" />, dir: "bottom" as const, tip: "To Bottom" },
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
            <p className="text-[9px] text-slate-400 text-center mt-1.5 uppercase tracking-widest font-medium">Move selected questions</p>
          </div>

          {/* Points */}
          <div>
            <SectionLabel>Set Points</SectionLabel>
            <div className="grid grid-cols-4 gap-1.5">
              {[5, 10, 15, 20].map((pts) => (
                <button key={pts} onClick={() => { setPointsValue(pts); setActionType("points"); }}
                  className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-[10px] font-black text-slate-500 hover:text-amber-600 transition-all shadow-sm">
                  <Star className="w-2.5 h-2.5" />{pts}
                </button>
              ))}
            </div>
          </div>

          {/* Timer */}
          <div>
            <SectionLabel>Set Timer</SectionLabel>
            <div className="grid grid-cols-4 gap-1.5">
              {[15, 30, 45, 60].map((t) => (
                <button key={t} onClick={() => { setTimeLimitValue(t); setActionType("time"); }}
                  className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-[10px] font-black text-slate-500 hover:text-indigo-600 transition-all shadow-sm">
                  <Timer className="w-2.5 h-2.5" />{t}s
                </button>
              ))}
            </div>
          </div>

          {/* Manage */}
          <div>
            <SectionLabel>Manage</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <StudioButton variant="accent" onClick={() => setActionType("duplicate")}><Copy className="w-3.5 h-3.5" /> Duplicate</StudioButton>
              <StudioButton onClick={() => setActionType("shuffle")}><Shuffle className="w-3.5 h-3.5" /> Shuffle</StudioButton>
              <StudioButton onClick={() => setActionType("lock")}><Lock className="w-3.5 h-3.5" /> Lock</StudioButton>
              <StudioButton onClick={() => setActionType("unlock")}><Unlock className="w-3.5 h-3.5" /> Unlock</StudioButton>
            </div>
          </div>

          {/* Export & Delete */}
          <div className="space-y-2">
            <StudioButton className="w-full" onClick={handleExportSelected}><Download className="w-3.5 h-3.5" /> Export Selected ({selectedCount})</StudioButton>
            <StudioButton className="w-full" variant="danger" onClick={() => setActionType("delete")}><Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedCount})</StudioButton>
          </div>
        </>
      ) : (
        <>
          {/* Empty state */}
          <div className="py-6 flex flex-col items-center text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-sm">
              <CheckSquare className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-xs font-semibold text-slate-500 mb-1">No questions selected</p>
            <p className="text-[10px] text-slate-400 mb-4 max-w-[160px] leading-relaxed">Select questions using the checkboxes to perform bulk actions</p>
            <button
              onClick={onSelectAll}
              disabled={totalCount === 0}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-md shadow-indigo-200 disabled:opacity-30"
            >
              Select All
            </button>
          </div>

          {/* Stats */}
          {totalCount > 0 && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.35em] mb-3 flex items-center gap-1.5">
                <LayoutGrid className="w-3 h-3" /> Overview
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Total", value: questions.length },
                  { label: "Timed", value: questions.filter((q) => q.timeLimit).length },
                  { label: "Locked", value: questions.filter((q) => q.locked).length },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-xl py-2.5 px-1 border border-slate-200 shadow-sm">
                    <div className="text-base font-black text-slate-900 tabular-nums">{value}</div>
                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data */}
          <div>
            <SectionLabel>Data</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <StudioButton onClick={handleExportAll} disabled={totalCount === 0}><Download className="w-3.5 h-3.5" /> Export All</StudioButton>
              <div>
                <input type="file" id="import-file" className="hidden" accept=".json" onChange={handleImportQuestions} />
                <StudioButton className="w-full" onClick={() => document.getElementById("import-file")?.click()}><Upload className="w-3.5 h-3.5" /> Import</StudioButton>
              </div>
            </div>
          </div>
        </>
      )}

      {renderModal()}
    </div>
  );
}