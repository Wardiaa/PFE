// components/header/Header.tsx
import { Button } from "../../../components/ui/button";
import { 
  ChevronRight, 
  ArrowLeft, 
  LayoutGrid, 
  Layers, 
  Settings2, 
  Rocket,
  Save,
  Eye,
  Undo2,
  Redo2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../../lib/utils";

interface CreateHeaderProps {
  step: number;
  setStep: (step: number) => void;
  onPublish?: () => void;
  onSaveDraft?: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved';
  lastSaved?: Date | null;
  onPreview?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  contextTitle?: string;
}

const tabs = [
  { id: "blueprint", label: "BLUEPRINT", icon: LayoutGrid, activeSteps: [1], targetStep: 1 },
  { id: "studio", label: "STUDIO", icon: Layers, activeSteps: [2, 3], targetStep: 2 },
  { id: "systems", label: "SYSTEMS", icon: Settings2, activeSteps: [4], targetStep: 4 },
  { id: "deploy", label: "DEPLOY", icon: Rocket, activeSteps: [5], targetStep: 5 },
];

export function Header({ 
  step, 
  setStep, 
  onPublish, 
  onSaveDraft,
  saveStatus = 'idle',
  lastSaved,
  onPreview,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  contextTitle = "Untitled Session" 
}: CreateHeaderProps) {
  const navigate = useNavigate();

  const getSaveButtonText = () => {
    if (saveStatus === 'saving') return '...';
    if (saveStatus === 'saved') return '✓';
    return 'SAVE';
  };

  return (
    <header className="sticky top-0 z-[50] w-full bg-white h-[64px] border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between overflow-hidden">
      
      {/* LEFT: Project Context & Nav */}
      <div className="flex items-center gap-4 min-w-0">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-[1px] h-6 bg-slate-200 hidden sm:block" />

        {/* Hide title on very small screens so the tab nav and action buttons have room */}
        <div className="hidden sm:flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-900 truncate max-w-[150px] lg:max-w-[280px]">
              {contextTitle.toUpperCase()}
            </h1>
          </div>
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium italic">
              saved at {lastSaved?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      {/* CENTER: Tab Control (Mentimeter Style Segmented)
          Small screens (< md): icon-only tabs, no text — keeps it compact.
          md+: icons + labels, absolutely centered as before. */}
      <nav className="flex items-center bg-slate-100 p-1 rounded-xl md:absolute md:left-1/2 md:-translate-x-1/2">
        {tabs.map((tab) => {
          const isActive = tab.activeSteps.includes(step);
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => setStep(tab.targetStep)}
              className={cn(
                "relative flex items-center gap-2 px-2.5 md:px-4 py-1.5 rounded-lg transition-all text-[11px] font-black tracking-[0.05em]",
                isActive ? "text-indigo-600 bg-white ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {/* Label hidden on small screens — icon alone navigates */}
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* RIGHT: Actions & Contextual Buttons */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Undo/Redo: Visible steps 2-5 */}
        {step >= 2 && step <= 5 && onUndo && (
          <div className="hidden sm:flex items-center bg-slate-50 border border-slate-100 p-0.5 rounded-lg">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-25 transition-all"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-3 bg-slate-200" />
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-25 transition-all"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Save Draft: Visible steps 2-5 */}
        {step >= 2 && step <= 5 && onSaveDraft && (
          <Button 
            onClick={onSaveDraft}
            disabled={saveStatus === 'saving'}
            className={cn(
              "h-9 px-3 sm:px-5 rounded-lg text-[11px] font-black tracking-[0.05em] text-white transition-all shadow-none",
              saveStatus === 'saved' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-700 hover:bg-slate-800"
            )}
          >
            <Save className="w-3.5 h-3.5 sm:mr-2 shrink-0" />
            {/* Hide label on very small screens — icon alone is enough */}
            <span className="hidden sm:inline">{getSaveButtonText()}</span>
          </Button>
        )}

        {/* Preview: Only Step 3 */}
        {step === 3 && onPreview && (
          <button
            onClick={onPreview}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all"
            title="Live Preview"
          >
            <Eye className="w-4.5 h-4.5" />
          </button>
        )}

        <div className="w-[1px] h-6 bg-slate-200 hidden lg:block" />

        {/* Main Action Button (NEXT button) */}
        {step < 5 && (
          <button 
            onClick={() => setStep(step + 1)} 
            className="h-10 px-4 sm:px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            NEXT
            <ChevronRight className="w-4 h-4 stroke-[3px]" />
          </button>
        )}
      </div>
    </header>
  );
}