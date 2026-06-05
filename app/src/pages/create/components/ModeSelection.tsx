// src/pages/create/components/ModeSelection.tsx
// Mode selection screen shown when creating a blank template
// User chooses between Standard and Elimination mode before Step 2

import { motion } from "framer-motion";
import { Trophy, ChevronRight, BarChart2 } from "lucide-react";
import { cn } from "../../../lib/utils";

export type GameMode = "standard" | "elimination";

interface ModeSelectionProps {
  selectedMode: GameMode | null;
  onSelectMode: (mode: GameMode) => void;
  onContinue: () => void;
}

interface ModeCardProps {
  mode: GameMode;
  title: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  isSelected: boolean;
  onSelect: () => void;
}

const ModeCard = ({
  mode,
  title,
  description,
  features,
  icon,
  isSelected,
  onSelect,
}: ModeCardProps) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    onClick={onSelect}
    className={cn(
      "w-full text-left p-6 rounded-2xl border-2 transition-all duration-200",
      // Remove hover translate and keep shadow consistent
      "hover:shadow-md",
      isSelected
        ? "border-indigo-500 bg-indigo-50/30 shadow-md shadow-indigo-100"
        : "border-slate-200 bg-white hover:border-indigo-200"
    )}
  >
    <div className="flex items-start gap-4">
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
          isSelected ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"
        )}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        </div>
        <p className="text-sm text-slate-500 mb-3">{description}</p>
        <div className="flex flex-wrap gap-2">
          {features.map((feature, idx) => (
            <span
              key={idx}
              className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
      {/* Checkmark icon - always present but invisible when not selected to maintain consistent width */}
      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0">
        {isSelected && (
          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  </motion.button>
);

export function ModeSelection({ selectedMode, onSelectMode, onContinue }: ModeSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4">
            
            Choose your experience
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
            How do you want to play?
          </h1>
          <p className="text-slate-500">
            Select a game mode for your session. You can change this later.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <ModeCard
            mode="standard"
            title="Standard Mode"
            description="Classic quiz experience for classrooms, meetings, and casual events. Perfect for polls, surveys, feedback collection, and knowledge checks."
            features={["Points & scoring", "Time limits", "All question types"]}
            icon={<BarChart2 className="w-6 h-6" />}
            isSelected={selectedMode === "standard"}
            onSelect={() => onSelectMode("standard")}
          />

          <ModeCard
            mode="elimination"
            title="Elimination Mode"
            description="You are the hunter. Every question is a prey. Answer wrong, and you become the hunted. Last hunter alive wins."
            features={["Wrong answer = eliminated", "Speed questions", "Skip button", "Final round showdown"]}
            icon={
              <div className="relative">
                <Trophy className="w-6 h-6" />
              </div>
            }
            isSelected={selectedMode === "elimination"}
            onSelect={() => onSelectMode("elimination")}
          />
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            onClick={onContinue}
            disabled={!selectedMode}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all",
              selectedMode
                ? "bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
                : "bg-slate-100 text-slate-300 cursor-not-allowed"
            )}
          >
            Continue to setup
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}