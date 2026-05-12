// components/ui/template-preview-modal.tsx
import { X, CheckCircle2, Clock, Users, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Template } from "../../lib/templates";

interface TemplatePreviewModalProps {
  template: Template | null;
  open: boolean;
  onClose: () => void;
  onUse: () => void;
}

export function TemplatePreviewModal({ template, open, onClose, onUse }: TemplatePreviewModalProps) {
  if (!open || !template) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-10 bg-[#1A1D21]/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-6xl h-full md:h-[85vh] rounded-none md:rounded-[32px] overflow-hidden flex flex-col md:flex-row relative shadow-2xl"
      >
        {/* Mobile Close */}
        <button onClick={onClose} className="absolute top-6 left-6 z-10 md:hidden bg-white rounded-full p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Info Column */}
        <div className="w-full md:w-[400px] p-8 md:p-12 flex flex-col border-r border-slate-100 overflow-y-auto bg-white">

          <div className="mb-2">
             <span className="text-xs font-black uppercase tracking-widest text-indigo-600">
               {template.questions?.length || 0} Questions
             </span>
          </div>
          <h2 className="text-3xl font-bold text-[#1A1D21] mb-4 leading-tight">
            {template.name}
          </h2>
          <p className="text-[#6D7278] leading-relaxed mb-8">
            {template.description}
          </p>

          <div className="space-y-4 mb-10">
             <div className="flex items-center gap-3 text-sm text-[#1A1D21] font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Makes sure everyone's voice is heard
             </div>
             <div className="flex items-center gap-3 text-sm text-[#1A1D21] font-medium">
                <Clock className="w-5 h-5 text-indigo-500" />
                Setup time: {template.estimatedSetupTime || '2 min'}
             </div>
             <div className="flex items-center gap-3 text-sm text-[#1A1D21] font-medium">
                <Users className="w-5 h-5 text-amber-500" />
                Best for {template.targetAudience || 'Any size'}
             </div>
          </div>

          <div className="mt-auto pt-6">
            <button
              onClick={onUse}
              className="w-full py-4 bg-[#1A1D21] hover:bg-black text-white rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              Use this template
            </button>
          </div>
        </div>

        {/* Preview Scroll Column */}
        <div className="flex-1 bg-[#F0F2F5] p-6 md:p-12 overflow-y-auto no-scrollbar">
          <div className="max-w-3xl mx-auto space-y-8">
            {template.questions?.map((q, idx) => (
              <div key={q.id} className="aspect-[16/9] bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center text-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Question {idx + 1} • {q.type.replace('_', ' ')}
                 </span>
                 <h3 className="text-2xl font-bold text-[#1A1D21] max-w-md">
                   {q.title}
                 </h3>
                 {q.options && (
                   <div className="mt-8 flex flex-wrap justify-center gap-2">
                     {q.options.slice(0, 4).map((opt: any) => (
                       <div key={opt.id} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600">
                         {opt.text}
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            ))}
          </div>
        </div>

        {/* Close Button Desktop */}
        <button 
          onClick={onClose} 
          className="hidden md:flex absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </motion.div>
    </div>
  );
}