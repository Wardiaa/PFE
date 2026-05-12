// pages/create/components/steps/Step1.tsx
import { useState } from "react";
import { TemplateCard } from "../../../../components/ui/template-card";
import { TemplatePreviewModal } from "../../../../components/ui/template-preview-modal";
import { LayoutGrid, GraduationCap, Briefcase, Sparkles, Users, Crown } from "lucide-react";
import { templates, type Template } from "../../../../lib/templates";
import { cn } from "../../../../lib/utils";

interface Step1Props {
  selectedTemplate: string | null;
  onTemplateSelect: (templateId: string) => void;
}

const categoryFilters = [
  { id: "all", label: "All Templates", icon: LayoutGrid },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "team", label: "Team Building", icon: Users },
  { id: "game-show", label: "Game Shows", icon: Crown },
  { id: "entertainment", label: "Fun", icon: Sparkles },
];

export function Step1({ selectedTemplate, onTemplateSelect }: Step1Props) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const filteredTemplates = () => {
    if (activeCategory === "all") return templates;
    if (activeCategory === "game-show") return templates.filter(t => t.category === "Game Show");
    if (activeCategory === "team") return templates.filter(t => t.category === "Team Building");
    return templates.filter(t => t.category?.toLowerCase() === activeCategory);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        
        {/* Sleek Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 lg:mb-8">
              <span className="text-indigo-600 font-black text-lg sm:text-xl tracking-tighter">
                02
              </span>
              <div className="h-[2px] w-8 sm:w-12 bg-gradient-to-r from-indigo-500 to-transparent" />
              <span className="text-slate-400 font-bold text-[8px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em]">
                Select a template
              </span>
            </div>
          
          <p className="text-[#6D7278] text-lg max-w-2xl">
            Choose a starting point or build your own from scratch.
          </p>
        </div>

        {/* Filter Navigation Bar (Stable & Clean) */}
        <div className="flex flex-wrap items-center gap-2 mb-10 border-b border-slate-100 pb-8">
          {categoryFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveCategory(filter.id)}
              className={cn(
                "px-5 py-2.5 text-sm font-bold rounded-full transition-all border-2",
                activeCategory === filter.id 
                  ? "border-[#4A3AFF] bg-white text-[#4A3AFF]" 
                  : "border-slate-100 bg-white text-[#6D7278] hover:border-slate-300 hover:text-[#1A1D21]"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Standard Grid (No Layout Shifting) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates().map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selectedTemplate === template.id}
              onSelect={() => onTemplateSelect(template.id)}
              onPreview={() => setPreviewTemplate(template)}
            />
          ))}
        </div>
      </div>

      <TemplatePreviewModal
        template={previewTemplate}
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUse={() => {
          if (previewTemplate) {
            onTemplateSelect(previewTemplate.id);
            setPreviewTemplate(null);
          }
        }}
      />
    </div>
  );
}