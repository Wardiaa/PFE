// Step1.tsx (updated - fully responsive filters)
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs"
import { TemplateCard } from "../../../../components/ui/template-card"
import { TemplateCustomizationDialog } from "../../../../components/ui/template-customization-dialog"
import { Briefcase, GraduationCap, LayoutGrid, PartyPopper } from "lucide-react"
import { templates } from "../../../../lib/templates"
import { motion } from "framer-motion"

interface Step1Props {
  selectedTemplate: string | null
  showTemplateCustomization: boolean
  setShowTemplateCustomization: (show: boolean) => void
  onTemplateSelect: (templateId: string) => void
  onTemplateCustomize: (options: any) => void
}

export function Step1({
  selectedTemplate,
  showTemplateCustomization,
  setShowTemplateCustomization,
  onTemplateSelect,
  onTemplateCustomize
}: Step1Props) {
  return (
    <div className="relative min-h-screen pt-20 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 overflow-hidden bg-white">
      {/* Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-50/50 rounded-full blur-[140px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-rose-50/40 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12 sm:mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-4 sm:px-6 py-1.5 sm:py-2 mb-6 sm:mb-10 rounded-full border border-slate-200 bg-white/50 backdrop-blur shadow-sm text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-slate-900"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>STEP 01 • THE CREATIVE</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-display font-bold text-slate-950 leading-[1.1] sm:leading-[0.9] mb-4 sm:mb-8 tracking-tighter text-balance px-2"
          >
            Choose Your <span className="text-indigo-600 italic">Starting Point.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed px-4"
          >
            Select a pre-crafted template designed for maximum engagement or start with a blank canvas to build your own vision.
          </motion.p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          {/* Filter tabs - fully responsive, show full labels on all screen sizes */}
          <div className="flex justify-center mb-8 sm:mb-12">
            <TabsList className="bg-slate-100/50 backdrop-blur p-1 rounded-2xl border border-slate-200 h-auto gap-0.5 sm:gap-1 grid grid-cols-4 w-full max-w-xs sm:max-w-none sm:flex sm:w-auto">
              {[
                { id: 'all', label: 'All', icon: LayoutGrid },
                { id: 'education', label: 'Education', icon: GraduationCap },
                { id: 'business', label: 'Business', icon: Briefcase },
                { id: 'fun', label: 'Social', icon: PartyPopper },
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl px-2 sm:px-6 py-2 sm:py-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest transition-all flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 whitespace-nowrap"
                >
                  <tab.icon className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {["all", "education", "business", "fun"].map(tab => (
            <TabsContent key={tab} value={tab} className="mt-0 outline-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
              >
                {templates
                  .filter(t => tab === 'all' || 
                    (tab === 'education' && t.category === 'Education') ||
                    (tab === 'business' && (t.category === 'Business' || t.category === 'HR')) ||
                    (tab === 'fun' && (t.category === 'Entertainment' || t.category === 'Team Building'))
                  )
                  .map((template) => (
                    <div key={template.id} className="group">
                      <TemplateCard
                        {...template}
                        questionsCount={template.questions?.length || 0}
                        selected={selectedTemplate === template.id}
                        onClick={() => onTemplateSelect(template.id)}
                      />
                    </div>
                  ))}
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <TemplateCustomizationDialog
        template={templates.find(t => t.id === selectedTemplate)}
        open={showTemplateCustomization}
        onOpenChange={setShowTemplateCustomization}
        onCustomize={onTemplateCustomize}
      />
    </div>
  )
}
