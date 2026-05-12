import { Input, Textarea, Label, cn } from "../../../../components/ui/base";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { DevicePreview } from "../../../../components/ui/device-preview";
import { ImageUploadWidget } from "../../../../components/ui/image-upload-widget";
import { Layout, Image as ImageIcon, Tag, Check, Clock } from "lucide-react";
import type { ContextData } from "../../types";
import { motion } from "framer-motion";

interface Step2Props {
  context: ContextData;
  selectedTemplate: string | null;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onThemeChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
  onCoverImageChange: (imageUrl: string | null) => void;
  // ── NEW: game mode toggle callback ───────────────────────────────────────
  onGameModeChange?: (mode: "standard" | "elimination") => void;
}

const DEFAULT_COVER_IMAGES = [
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200",
  "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1200",
  "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200",
];

// ── ComingSoon wrapper ─────────────────────────────────────────────────────
// Greys out + disables interaction on a section, but keeps it visible so
// the demo still shows that the feature is planned.
function ComingSoon({
  children,
  label = "Coming soon",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="opacity-40 pointer-events-none select-none filter grayscale"
      >
        {children}
      </div>
      <div className="absolute top-0 right-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.15em] shadow-md">
        <Clock className="w-3 h-3" />
        {label}
      </div>
    </div>
  );
}

// ── MentiToggle – same style as in QuestionSidePanel ───────────────────────
const MentiToggle = ({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={cn(
      "w-9 h-5 rounded-full transition-all relative flex items-center px-0.5",
      checked ? "bg-[#6366F1]" : "bg-slate-200",
      disabled && "opacity-40 cursor-not-allowed",
    )}
  >
    <div
      className={cn(
        "w-4 h-4 bg-white rounded-full shadow transition-transform",
        checked ? "translate-x-4" : "translate-x-0",
      )}
    />
  </button>
);

export function Step2({
  context,
  selectedTemplate,
  onTitleChange,
  onDescriptionChange,
  onThemeChange,
  onCategoryChange,
  onTagsChange,
  onCoverImageChange,
  onGameModeChange,
}: Step2Props) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 lg:p-16 xl:p-24">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 sm:mb-12 lg:mb-16"
          >
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 lg:mb-8">
              <span className="text-indigo-600 font-black text-lg sm:text-xl tracking-tighter">
                02
              </span>
              <div className="h-[2px] w-8 sm:w-12 bg-gradient-to-r from-indigo-500 to-transparent" />
              <span className="text-slate-400 font-bold text-[8px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em]">
                Context & Style
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-950 tracking-tighter leading-[1.1] sm:leading-[0.9] mb-3 sm:mb-6">
              Define the{" "}
              <span className="text-indigo-600 italic">Experience.</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-500 font-medium">
              Give your session a personality. Set the tone with a title,
              description, cover image, and visual theme.
            </p>
          </motion.div>

          <div className="space-y-8 sm:space-y-12">
            <section className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Layout className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-900">
                  General Info
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs sm:text-sm">
                    Session Title
                  </Label>
                  <Input
                    id="title"
                    value={context.title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className="text-base sm:text-lg font-bold h-12 sm:h-14 rounded-xl sm:rounded-2xl border-slate-200 focus:ring-indigo-500"
                    placeholder="e.g., Q3 Strategy Workshop"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc" className="text-xs sm:text-sm">
                    Description
                  </Label>
                  <Textarea
                    id="desc"
                    value={context.description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    placeholder="What should your audience know?"
                    className="resize-none min-h-28 sm:min-h-32 rounded-xl sm:rounded-2xl border-slate-200 focus:ring-indigo-500 text-sm sm:text-base"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-900">
                  Classification
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-xs sm:text-sm">
                    Category
                  </Label>
                  <Select
                    value={context.category}
                    onValueChange={onCategoryChange}
                  >
                    <SelectTrigger className="h-10 sm:h-12 rounded-xl sm:rounded-2xl border-slate-200 text-sm">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="entertainment">
                        Entertainment
                      </SelectItem>
                      <SelectItem value="team-building">
                        Team Building
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Quick Tags</Label>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {["Quiz", "Team", "Live", "Strategy"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          onTagsChange(
                            context.tags.includes(tag)
                              ? context.tags.filter((t) => t !== tag)
                              : [...context.tags, tag],
                          );
                        }}
                        className={cn(
                          "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest transition-all",
                          context.tags.includes(tag)
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Game Mode Toggle ── */}
              {onGameModeChange && (
                <div className="space-y-2 mt-4">
                  <Label className="text-xs sm:text-sm">Game Mode</Label>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">Elimination Mode</span>                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Wrong answer = eliminated. Last player standing wins.
                      </p>
                    </div>
                    <MentiToggle
                      checked={context.gameMode === "elimination"}
                      onChange={(val) => onGameModeChange(val ? "elimination" : "standard")}
                    />
                  </div>
                </div>
              )}
            </section>


            <section className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-900">
                  Cover Image
                </h3>
              </div>

              <ImageUploadWidget
                currentImageUrl={context.coverImage || undefined}
                onImageSelect={onCoverImageChange}
                onImageRemove={() => onCoverImageChange(null)}
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
                {DEFAULT_COVER_IMAGES.map((url, i) => {
                  const selected = context.coverImage === url;

                  return (
                    <button
                      key={url}
                      onClick={() => onCoverImageChange(url)}
                      className={cn(
                        "relative aspect-video rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden cursor-pointer border-2 sm:border-4 transition-all group",
                        selected
                          ? "border-indigo-600 shadow-lg shadow-indigo-100"
                          : "border-transparent hover:border-indigo-600",
                      )}
                    >
                      <img
                        src={url}
                        alt={`Cover option ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors" />
                      {selected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex w-[400px] xl:w-[550px] bg-slate-950 relative flex-col items-center justify-center p-8 xl:p-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,_rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_100%,_rgba(244,63,94,0.1),transparent_50%)]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 w-full"
        >
          <div className="text-center mb-8 xl:mb-12">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
              Participants View
            </h3>
          </div>

          <DevicePreview
            title={context.title}
            themeId={context.theme}
            questions={context.questions}
            currentQuestionIndex={0}
          />
        </motion.div>
      </div>
    </div>
  );
}