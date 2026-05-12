// components/ui/template-card.tsx
import { useState } from "react";
import { cn } from "../../lib/utils";
import type { Template } from "../../lib/templates";
import { motion, AnimatePresence } from "framer-motion";

interface TemplateCardProps {
  template: Template;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

// Map templates to Mentimeter's specific pastel theme colors
const getMentimeterColors = (category: string) => {
  const map: Record<string, { bg: string; text: string }> = {
    Education: { bg: "bg-[#EEF2FF]", text: "text-indigo-900" },
    Business: { bg: "bg-[#FDF2F2]", text: "text-rose-900" },
    "Team Building": { bg: "bg-[#F0F9FF]", text: "text-sky-900" },
    Entertainment: { bg: "bg-[#F5F3FF]", text: "text-purple-900" },
    default: { bg: "bg-[#F8F9FA]", text: "text-slate-900" },
  };
  return map[category] || map.default;
};

export function TemplateCard({ template, selected, onSelect, onPreview }: TemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = getMentimeterColors(template.category);
  const questionsCount = template.questions?.length || 0;

  return (
    <div 
      className="group relative flex flex-col h-full transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Card Body */}
      <div
        onClick={onSelect}
        className={cn(
          "flex-1 flex flex-col rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200",
          selected 
            ? "border-indigo-600 shadow-md" 
            : "border-transparent shadow-sm bg-white hover:shadow-lg"
        )}
      >
        {/* Top: The "Slide" Preview Area */}
        <div className={cn("relative aspect-[16/10] p-6 overflow-hidden", colors.bg)}>
          {/* Mock Slide Content (Mentimeter Style) */}
          <div className="space-y-2 max-w-[80%]">
             <div className={cn("text-xs font-bold mb-1 opacity-80 uppercase tracking-tight", colors.text)}>
                {template.category}
             </div>
             <h4 className={cn("text-sm font-semibold leading-tight line-clamp-3", colors.text)}>
                {template.questions?.[0]?.title || "How would you describe your team?"}
             </h4>
          </div>

          {/* Abstract graphic decoration (circles/bars like in your image) */}
          <div className="absolute right-4 bottom-4 opacity-20">
             <div className={cn("w-12 h-12 rounded-full border-4 border-current", colors.text)} />
             <div className={cn("w-8 h-2 mt-2 rounded-full bg-current", colors.text)} />
          </div>

          {/* Hover Overlay Button */}
          <AnimatePresence>
            {isHovered && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/20 backdrop-blur-[1px] flex items-center justify-center p-4"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onPreview(); }}
                  className="bg-[#1A1D21] hover:bg-black text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-xl transition-transform active:scale-95 cursor-pointer"
                >
                  Preview
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom: Information Area */}
        <div className="bg-white p-4 pt-5 border-t border-slate-100 flex-grow">
          <h3 className="text-[15px] font-semibold text-[#1A1D21] mb-1 line-clamp-1">
            {template.name}
          </h3>
          <p className="text-xs text-[#6D7278] font-medium">
            {questionsCount} slides
          </p>
        </div>
      </div>
      
      {/* Outer selection border logic - simple version included in card logic above */}
    </div>
  );
}