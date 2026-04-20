// Header.tsx (updated - fully responsive)
import { Button } from "../../../components/ui/button";
import { 
  ChevronRight, 
  ArrowLeft, 
  LayoutGrid, 
  Sparkles, 
  Settings2, 
  Rocket,
  Save,
  Eye,
  Undo2,
  Redo2} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

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
  // Add context title prop
  contextTitle?: string;
}

const tabs = [
  { id: "blueprint", label: "BLUEPRINT", icon: LayoutGrid, activeSteps: [1], targetStep: 1, mobileLabel: "1" },
  { id: "studio", label: "STUDIO", icon: Sparkles, activeSteps: [2, 3], targetStep: 2, mobileLabel: "2" },
  { id: "systems", label: "SYSTEMS", icon: Settings2, activeSteps: [4], targetStep: 4, mobileLabel: "3" },
  { id: "deploy", label: "DEPLOY", icon: Rocket, activeSteps: [5], targetStep: 5, mobileLabel: "4" },
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
  contextTitle = "Untitled Session" // Default value
}: CreateHeaderProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getSaveButtonText = () => {
    if (saveStatus === 'saving') return '...';
    if (saveStatus === 'saved') return '✓';
    return isMobile ? '' : 'SAVE';
  };

  const getSaveButtonColor = () => {
    if (saveStatus === 'saved') return 'bg-emerald-600 hover:bg-emerald-500';
    return 'bg-slate-600 hover:bg-slate-500';
  };

  const renderDesktopHeader = () => (
    <header className="sticky top-0 z-40 w-full bg-[#F8FAFC] border-b border-slate-200/60 px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-2 sm:gap-5">
        <button 
          onClick={() => navigate(-1)}
          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
        </button>

        <div className="hidden sm:block h-10 w-[1px] bg-slate-200" />

        <div className="hidden sm:flex flex-col">
          <h1 className="text-[10px] sm:text-[13px] font-black tracking-[0.15em] text-[#0F172A] leading-none mb-1.5">
            {contextTitle.toUpperCase().slice(0, 40)}
          </h1>
          <div className="flex items-center gap-2">
            
          </div>
        </div>

        <div className="sm:hidden">
          <span className="text-[10px] font-bold text-slate-500">ENGAGE</span>
        </div>
      </div>

      {/* CENTER SECTION - Tabs */}
      <nav className="hidden md:flex items-center bg-[#EDF2F7] p-1.5 rounded-[20px] border border-slate-200/50">
        {tabs.map((tab) => {
          const isActive = tab.activeSteps.includes(step);
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => setStep(tab.targetStep)}
              className={`
                relative flex items-center gap-2 px-4 lg:px-5 py-1.5 lg:py-2 rounded-[14px] transition-all duration-200
                ${isActive ? 'text-[#5D5FEF]' : 'text-slate-400 hover:text-slate-600'}
              `}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-[14px]"
                  transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                />
              )}
              <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? 'text-[#5D5FEF]' : 'text-slate-400'}`} />
              <span className="relative z-10 text-[10px] font-black tracking-widest leading-none hidden lg:block">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Tab Indicator */}
      <div className="md:hidden flex items-center gap-1">
        {tabs.map((tab) => {
          const isActive = tab.activeSteps.includes(step);
          return (
            <button
              key={tab.id}
              onClick={() => setStep(tab.targetStep)}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Undo/Redo - Hidden on very small screens */}
        {step >= 2 && step <= 5 && onUndo && onRedo && (
          <>
            <div className="hidden sm:flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`p-1.5 sm:p-2 rounded-lg transition-all duration-150 ${
                  canUndo 
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' 
                    : 'text-slate-300 cursor-not-allowed'
                }`}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`p-1.5 sm:p-2 rounded-lg transition-all duration-150 ${
                  canRedo 
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' 
                    : 'text-slate-300 cursor-not-allowed'
                }`}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
            <div className="hidden sm:block w-[1px] h-8 bg-slate-200" />
          </>
        )}

        {/* Save Draft Button */}
        {step >= 2 && step <= 5 && onSaveDraft && (
          <>
            <Button 
              onClick={onSaveDraft}
              disabled={saveStatus === 'saving'}
              className={`
                h-9 sm:h-11 px-3 sm:px-6 rounded-full 
                ${getSaveButtonColor()}
                hover:opacity-90 transition-all
                text-[9px] sm:text-[10px] font-black tracking-[0.1em] text-white shadow-md
                flex items-center gap-1 sm:gap-2
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">{getSaveButtonText()}</span>
              {lastSaved && saveStatus === 'saved' && (
                <span className="hidden sm:inline ml-1 text-[8px] opacity-80">
                  {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </Button>
            <div className="hidden sm:block w-[1px] h-8 bg-slate-200" />
          </>
        )}

        {/* Preview Button */}
        {step === 3 && onPreview && (
          <button
            onClick={onPreview}
            className="
              w-9 h-9 sm:w-11 sm:h-11 rounded-full 
              bg-white border border-slate-200
              hover:bg-slate-50 hover:border-slate-300
              flex items-center justify-center
              transition-all duration-200
              group shadow-sm
            "
            title="Preview"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
          </button>
        )}

        {/* Next Step / Publish Button */}
        {step < 5 ? (
          <Button 
            onClick={() => setStep(step + 1)} 
            className="
              h-9 sm:h-11 px-4 sm:px-7 rounded-full 
              bg-gradient-to-r from-[#5D5FEF] to-[#4A4DE6] 
              hover:opacity-90 transition-opacity
              text-[9px] sm:text-[11px] font-black tracking-[0.1em] text-white shadow-lg shadow-indigo-200/50
              flex items-center gap-2 sm:gap-3
            "
          >
            <span className="hidden sm:inline">NEXT</span>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3px]" />
          </Button>
        ) : (
          <Button 
            onClick={onPublish}
            className="
              h-9 sm:h-11 px-4 sm:px-7 rounded-full 
              bg-gradient-to-r from-[#5D5FEF] to-[#4A4DE6] 
              hover:opacity-90 text-[9px] sm:text-[11px] font-black tracking-[0.1em] text-white shadow-lg shadow-indigo-200/50
            "
          >
            <span className="hidden sm:inline">PUBLISH</span>
            <span className="sm:hidden">✓</span>
          </Button>
        )}
      </div>
    </header>
  );

  return renderDesktopHeader();
}