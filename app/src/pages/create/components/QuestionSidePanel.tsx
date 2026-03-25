// QuestionSidePanel.tsx - UPDATED POSITIONING
import { useState } from "react";
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
  Upload
} from "lucide-react";

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

export function QuestionSidePanel({
  currentQuestion,
  onUpdateQuestion,
  onToggle,
  isOpen
}: QuestionSidePanelProps) {
  const [activeMenu, setActiveMenu] = useState<string>("edit");

  const handleMenuClick = (menuId: string) => {
    if (activeMenu === menuId && isOpen) {
      onToggle();
    } else {
      setActiveMenu(menuId);
      if (!isOpen) onToggle();
    }
  };

  return (
    /* Changed fixed to absolute and top to 0 */
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
            <div className="w-[360px] p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900 capitalize">Slide</h2>
                <button onClick={onToggle} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {activeMenu === "edit" ? (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-800">Question type</label>
                    <button className="w-full flex items-center justify-between p-3 bg-slate-100/80 rounded-xl hover:bg-slate-200/50 transition-all group">
                       <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-[10px] text-white font-bold">MC</div>
                          <span className="text-sm font-medium text-slate-700">Multiple Choice</span>
                       </div>
                       <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-800">Image</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-indigo-400 transition-all cursor-pointer group">
                       <Upload className="w-6 h-6 text-slate-300 group-hover:text-indigo-500" />
                       <p className="text-xs font-bold text-indigo-600 underline text-center">Click to add an image</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                   <p className="text-slate-400 text-sm">More controls coming soon</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. NAV RAIL */}
      <div className="w-[92px] bg-white border-l border-slate-200 flex flex-col items-center py-4 gap-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id && isOpen;
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={cn(
                "w-[76px] h-[76px] rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 border-2",
                isActive
                  ? "bg-white border-[#6366F1] text-[#4F46E5] shadow-lg shadow-indigo-50"
                  : "bg-white border-transparent text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive ? "text-[#4F46E5]" : "text-black")} />
              <span className="text-[11px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}