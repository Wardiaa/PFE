import { Input, Textarea, Label, cn } from "../../../../components/ui/base"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { ThemeSelector } from "../../../../components/ui/theme-selector"
import { DevicePreview } from "../../../../components/ui/device-preview"
import { Sparkles, Layout, Image as ImageIcon, Tag } from "lucide-react"
import type { ContextData } from "../../types"
import { motion } from "framer-motion"

interface Step2Props {
  context: ContextData
  selectedTemplate: string | null
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onThemeChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onTagsChange: (tags: string[]) => void
}

export function Step2({
  context,
  selectedTemplate,
  onTitleChange,
  onDescriptionChange,
  onThemeChange,
  onCategoryChange,
  onTagsChange
}: Step2Props) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left Side: Form - Light & Clean */}
      <div className="flex-1 overflow-y-auto p-8 md:p-16 lg:p-24">
        <div className="max-w-2xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-16"
          >
            <div className="flex items-center space-x-4 mb-8">
              <span className="text-indigo-600 font-black text-xl tracking-tighter">02</span>
              <div className="h-[2px] w-12 bg-gradient-to-r from-indigo-500 to-transparent" />
              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em]">Context & Style</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-display font-bold text-slate-950 tracking-tighter leading-[0.9] mb-6">
              Define the <span className="text-indigo-600 italic">Experience.</span>
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              Give your session a personality. Set the tone with a title, description, and visual theme.
            </p>
          </motion.div>

          <div className="space-y-12">
            {/* Title & Description */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Layout className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">General Info</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Session Title</Label>
                  <Input
                    id="title"
                    value={context.title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className="text-lg font-bold h-14 rounded-2xl border-slate-200 focus:ring-indigo-500"
                    placeholder="e.g., Q3 Strategy Workshop"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea
                    id="desc"
                    value={context.description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    placeholder="What should your audience know?"
                    className="resize-none min-h-32 rounded-2xl border-slate-200 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </section>

            {/* Category & Tags */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Classification</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={context.category} onValueChange={onCategoryChange}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="team-building">Team Building</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Quick Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Quiz", "Team", "Live", "Strategy"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          onTagsChange(
                            context.tags.includes(tag)
                              ? context.tags.filter((t) => t !== tag)
                              : [...context.tags, tag]
                          );
                        }}
                        className={cn(
                          "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                          context.tags.includes(tag)
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Visual Theme */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Visual Identity</h3>
              </div>
              <ThemeSelector selectedTheme={context.theme} onSelect={onThemeChange} />
            </section>

            {/* Cover Image */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Cover Image</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600",
                    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600",
                    "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=600",
                    "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=600",
                ].map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-video rounded-3xl overflow-hidden cursor-pointer border-4 border-transparent hover:border-indigo-600 transition-all group"
                  >
                    <img src={url} alt="Cover" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors" />
                  </div>
                ))}
                <button className="aspect-video rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 hover:border-indigo-300 transition-all text-slate-400 hover:text-indigo-600">
                   <ImageIcon className="w-6 h-6" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Upload Custom</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Right Side: Preview - Dark & Immersive */}
      <div className="hidden lg:flex w-[450px] xl:w-[550px] bg-slate-950 relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,_rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_100%,_rgba(244,63,94,0.1),transparent_50%)]" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 w-full"
        >
          <div className="text-center mb-12">
             <div className="inline-flex items-center space-x-2 px-4 py-1.5 mb-6 rounded-full border border-white/10 bg-white/5 backdrop-blur text-[9px] font-black uppercase tracking-[0.3em] text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Preview Mode</span>
             </div>
             <h3 className="text-2xl font-display font-bold text-white tracking-tight">Real-time Participant View</h3>
          </div>

          <DevicePreview 
            title={context.title} 
            themeId={context.theme} 
            questions={context.questions} 
            currentQuestionIndex={0} 
          />

          <div className="mt-12 p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-sm text-center">
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              This is exactly how your audience will see the session on their mobile devices. 
              All changes are synced instantly via our edge network.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}