// QuickActionsPanel.tsx (updated - fully responsive)
import { useState } from "react";
import type { Question } from "../types";
import {
  Zap,
  ListChecks,
  MessageSquare,
  Cloud,
  BarChart2,
  Copy,
  Trash2,
  Shuffle,
  RefreshCw,
  Timer,
  Upload,
  Download,
  Star,
  X,
  ChevronUp,
  Plus
} from "lucide-react";

interface QuickActionsPanelProps {
  questions: Question[];
  currentQuestionIndex: number;
  onAddQuestion: (type: string) => void;
  onDuplicateQuestion: () => void;
  onDeleteQuestion: () => void;
  onUpdateQuestion: (updates: Partial<Question>) => void;
  onBulkAction: (action: string) => void;
}

const MenuSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-1">
    <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] sm:tracking-[0.35em] px-3 py-2">
      {label}
    </p>
    {children}
  </div>
);

const MenuItem = ({
  icon, label, shortcut, onClick, disabled, variant = "default",
}: {
  icon: React.ReactNode; label: string; shortcut?: string;
  onClick: () => void; disabled?: boolean; variant?: "default" | "danger";
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-2 sm:gap-2.5 px-3 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-semibold transition-all text-left
      ${variant === "danger"
        ? "text-rose-500 hover:text-rose-600 hover:bg-rose-50"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
      }
      ${disabled ? "opacity-30 pointer-events-none" : ""}
    `}
  >
    <span className="flex-shrink-0 text-slate-400">{icon}</span>
    <span className="flex-1">{label}</span>
    {shortcut && (
      <kbd className="hidden sm:inline-block text-[7px] sm:text-[8px] text-slate-400 bg-slate-100 border border-slate-200 px-1 sm:px-1.5 py-0.5 rounded font-mono">
        {shortcut}
      </kbd>
    )}
  </button>
);

const Divider = () => <div className="h-px bg-slate-100 mx-3 my-1" />;

export function QuickActionsPanel({
  questions, currentQuestionIndex, onAddQuestion, onDuplicateQuestion,
  onDeleteQuestion, onUpdateQuestion, onBulkAction,
}: QuickActionsPanelProps) {
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const closeAll = () => { setShowMainMenu(false); setShowTimeMenu(false); setShowExportMenu(false); };

  const handleAddQuestion = (type: string) => { onAddQuestion(type); closeAll(); };
  const handleApplyTimeLimit = (seconds: number) => { if (currentQuestion) onUpdateQuestion({ timeLimit: seconds }); closeAll(); };
  const handleApplyPoints = (points: number) => { if (currentQuestion) onUpdateQuestion({ points }); closeAll(); };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "duplicate": onDuplicateQuestion(); break;
      case "delete": onDeleteQuestion(); break;
      case "shuffle":
        if (currentQuestion?.options)
          onUpdateQuestion({ options: [...currentQuestion.options].sort(() => Math.random() - 0.5) });
        break;
      case "reset":
        if (currentQuestion)
          onUpdateQuestion({ timeLimit: 30, points: 10, options: currentQuestion.options?.map((o) => ({ ...o, isCorrect: false })) });
        break;
    }
    closeAll();
  };

  const handleExport = (format: string) => {
    if (format === "json") {
      onBulkAction("export-json");
    } else if (format === "csv") {
      const rows = questions.map((q) => ({ Question: q.title, Type: q.type, Points: q.points || 0, "Time Limit": q.timeLimit || 30 }));
      const csv = [Object.keys(rows[0]).join(","), ...rows.map((r) => Object.values(r).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "questions.csv";
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    }
    closeAll();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          if (Array.isArray(imported)) {
            onBulkAction('import');
          }
        } catch {
          // CSV parsing would go here
        }
      };
      reader.readAsText(file);
    };
    input.click();
    closeAll();
  };

  const secondaryButtons = [
    {
      icon: <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
      active: showTimeMenu,
      disabled: !currentQuestion,
      title: "Timer & Points",
      toggle: () => { setShowTimeMenu(!showTimeMenu); setShowMainMenu(false); setShowExportMenu(false); },
      menu: showTimeMenu && (
        <div className="absolute bottom-full right-0 mb-2 w-48 sm:w-56 bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/80 overflow-hidden py-2">
          <MenuSection label="Time Limit">
            <div className="grid grid-cols-3 gap-1 px-3 pb-2">
              {[15, 30, 45, 60, 90, 120].map((s) => (
                <button key={s} onClick={() => handleApplyTimeLimit(s)}
                  className="py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-[9px] sm:text-[10px] font-black text-slate-500 hover:text-indigo-600 transition-all">
                  {s}s
                </button>
              ))}
            </div>
          </MenuSection>
          <Divider />
          <MenuSection label="Points">
            <div className="grid grid-cols-3 gap-1 px-3 pb-2">
              {[0, 10, 20, 30, 50, 100].map((p) => (
                <button key={p} onClick={() => handleApplyPoints(p)}
                  className="py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-[9px] sm:text-[10px] font-black text-slate-500 hover:text-amber-600 transition-all flex items-center justify-center gap-0.5 sm:gap-1">
                  <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5" />{p}
                </button>
              ))}
            </div>
          </MenuSection>
        </div>
      ),
    },
    {
      icon: <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
      active: showExportMenu,
      disabled: false,
      title: "Export/Import",
      toggle: () => { setShowExportMenu(!showExportMenu); setShowMainMenu(false); setShowTimeMenu(false); },
      menu: showExportMenu && (
        <div className="absolute bottom-full right-0 mb-2 w-44 sm:w-52 bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/80 overflow-hidden py-2">
          <MenuSection label="Export">
            <MenuItem icon={<Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} label="Export as JSON" onClick={() => handleExport("json")} />
            <MenuItem icon={<Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} label="Export as CSV" onClick={() => handleExport("csv")} />
          </MenuSection>
          <Divider />
          <MenuSection label="Import">
            <MenuItem icon={<Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} label="Import Questions" onClick={handleImport} />
          </MenuSection>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed right-3 sm:right-6 bottom-3 sm:bottom-6 z-50">
      <div className="flex flex-col items-end gap-1.5 sm:gap-2">

        {secondaryButtons.map(({ icon, active, disabled, title, toggle, menu }) => (
          <div key={title} className="relative">
            <button onClick={toggle} disabled={disabled} title={title}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border flex items-center justify-center transition-all shadow-md
                ${active
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-indigo-200"
                  : disabled
                  ? "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed shadow-slate-100"
                  : "bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 shadow-slate-200/80"
                }`}
            >
              {icon}
            </button>
            {menu}
          </div>
        ))}

        <div className="relative">
          <button
            onClick={() => { setShowMainMenu(!showMainMenu); setShowTimeMenu(false); setShowExportMenu(false); }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all shadow-lg active:scale-95
              ${showMainMenu
                ? "bg-slate-100 border border-slate-200 text-slate-700 shadow-slate-200/60"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-200 hover:-translate-y-0.5"
              }`}
          >
            {showMainMenu ? <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            <span className="hidden sm:inline">{showMainMenu ? "Close" : ""}</span>
          </button>

          {showMainMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-56 sm:w-64 bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/80 overflow-hidden py-2">
              <MenuSection label="Add Question">
                <MenuItem icon={<ListChecks className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-500" />} label="Multiple Choice" shortcut="M" onClick={() => handleAddQuestion("multiple-choice")} />
                <MenuItem icon={<MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500" />} label="Open Text" shortcut="O" onClick={() => handleAddQuestion("open-text")} />
                <MenuItem icon={<Cloud className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-500" />} label="Word Cloud" shortcut="W" onClick={() => handleAddQuestion("word-cloud")} />
                <MenuItem icon={<BarChart2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />} label="Rating Scale" shortcut="R" onClick={() => handleAddQuestion("rating-scale")} />
              </MenuSection>
              <Divider />
              <MenuSection label="Current Question">
                <MenuItem icon={<Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} label="Duplicate" onClick={() => handleQuickAction("duplicate")} disabled={!currentQuestion} />
                <MenuItem icon={<Shuffle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} label="Shuffle Answers" onClick={() => handleQuickAction("shuffle")} disabled={!currentQuestion?.options} />
                <MenuItem icon={<RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} label="Reset Question" onClick={() => handleQuickAction("reset")} disabled={!currentQuestion} />
              </MenuSection>
              <Divider />
              <MenuItem icon={<Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} label="Delete Current" onClick={() => handleQuickAction("delete")} disabled={!currentQuestion} variant="danger" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}