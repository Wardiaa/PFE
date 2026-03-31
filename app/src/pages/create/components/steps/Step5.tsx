// Step5.tsx — Designer-feel UI, monochromatic, typographic
import { motion } from "framer-motion";
import {
  Eye, Users, Globe, Timer, Star, Copy, Calendar,
  Bell, TestTube, Download, Rocket, ArrowRight, CheckCircle2,
  Loader2, Save,
} from "lucide-react";
import type { ContextData } from "../../types";
import { cn } from "../../../../lib/utils";

interface Step5Props {
  context: ContextData;
  isPublishing: boolean;
  isSavingDraft: boolean;
  onHandleCreate: () => void;
  onSaveDraft: () => void;
}

function QuickAction({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button className="flex items-center gap-3 w-full py-3 border-b border-slate-100 last:border-0 group text-left transition-colors hover:text-indigo-600">
      <Icon className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
      <span className="text-sm font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors flex-1">
        {label}
      </span>
      <ArrowRight className="w-3 h-3 text-slate-200 group-hover:text-indigo-400 transition-all group-hover:translate-x-0.5 flex-shrink-0" />
    </button>
  );
}

export function Step5({ context, isPublishing, isSavingDraft, onHandleCreate, onSaveDraft }: Step5Props) {
  const totalSeconds = context.questions.reduce((s, q) => s + (q.timeLimit || 30), 0);
  const totalPoints  = context.questions.reduce((s, q) => s + (q.points  || 0),  0);
  const avgTime      = context.questions.length > 0
    ? Math.round(totalSeconds / context.questions.length) : 0;
  const uniqueTypes  = [...new Set(context.questions.map(q => q.type))].length;

  const checks = [
    { label: "Title and description set",      ok: !!context.title },
    { label: "At least one question added",    ok: context.questions.length > 0 },
    { label: "Participation settings saved",   ok: true },
    { label: "Visual theme selected",          ok: !!context.theme },
  ];

  const allReady = checks.every(c => c.ok);
  const isBusy   = isPublishing || isSavingDraft;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-14">

        {/* ── Page header ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-14"
        >
          <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 lg:mb-8">
              <span className="text-indigo-600 font-black text-lg sm:text-xl tracking-tighter">05</span>
              <div className="h-[2px] w-8 sm:w-12 bg-gradient-to-r from-indigo-500 to-transparent" />
              <span className="text-slate-400 font-bold text-[8px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em]">Deploy</span>
          </div>
          <h1 className="text-4xl sm:text-[3.25rem] font-black text-slate-950 tracking-tighter leading-[0.95] mb-4">
            Review &amp;<br />
            <span className="text-indigo-600 italic">go live.</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-sm">
            Everything looks good? Hit publish and share your session with the world.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-10">

          {/* ── LEFT: preview + quick actions ─────────────────────── */}
          <div className="lg:col-span-3 space-y-8">

            {/* Session preview card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 }}
            >
              {/* Thin accent line */}
              <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-transparent rounded-full mb-6" />

              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">
                    <Eye className="w-2.5 h-2.5" />
                    Preview
                  </div>
                  <h2 className="text-2xl font-black text-slate-950 tracking-tight leading-tight">
                    {context.title || "Untitled session"}
                  </h2>
                  {context.description && (
                    <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                      {context.description}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="text-3xl font-black text-slate-950 tabular-nums">{context.questions.length}</span>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Qs</p>
                </div>
              </div>

              {/* Meta chips — minimal, monochromatic */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { icon: Users,  label: `${context.settings.maxParticipants} max` },
                  { icon: Globe,  label: context.settings.participationMode.replace("_", " ").toLowerCase() },
                  { icon: Timer,  label: `${context.settings.timeLimit} min` },
                  { icon: Star,   label: `${totalPoints} pts` },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-500 capitalize"
                  >
                    <Icon className="w-3 h-3 text-slate-300" />
                    {label}
                  </div>
                ))}
              </div>

              {/* Stats row — big numbers, small labels */}
              <div className="grid grid-cols-4 gap-0 border border-slate-200 rounded-xl overflow-hidden">
                {[
                  { value: context.questions.length, label: "Questions" },
                  { value: `${avgTime}s`,            label: "Avg time" },
                  { value: uniqueTypes,              label: "Types" },
                  { value: totalPoints,              label: "Points" },
                ].map(({ value, label }, i) => (
                  <div
                    key={label}
                    className={cn(
                      "px-4 py-4 text-center",
                      i < 3 && "border-r border-slate-200"
                    )}
                  >
                    <p className="text-xl font-black text-slate-950 tabular-nums">{value}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
                Quick actions
              </p>
              <QuickAction icon={Copy}     label="Duplicate template" />
              <QuickAction icon={Calendar} label="Schedule launch" />
              <QuickAction icon={Bell}     label="Set reminders" />
              <QuickAction icon={TestTube} label="Test participation" />
              <QuickAction icon={Download} label="Export questions" />
            </motion.div>
          </div>

          {/* ── RIGHT: checklist + CTA ─────────────────────────────── */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="sticky top-8"
            >
              {/* Checklist */}
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-5">
                Readiness check
              </p>

              <div className="space-y-3 mb-8">
                {checks.map(({ label, ok }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors",
                      ok
                        ? "border-slate-900 bg-slate-900"
                        : "border-slate-200 bg-white"
                    )}>
                      {ok && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      ok ? "text-slate-800" : "text-slate-400"
                    )}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-100 mb-8" />

              {/* CTA block */}
              <div className="space-y-3">
                {/* ── Publish button ── */}
                <button
                  onClick={onHandleCreate}
                  disabled={!allReady || isBusy}
                  className={cn(
                    "w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-black uppercase tracking-[0.12em] transition-all duration-200",
                    allReady && !isBusy
                      ? "bg-slate-950 hover:bg-indigo-600 text-white shadow-lg shadow-slate-950/20 hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0"
                      : "bg-slate-100 text-slate-300 cursor-not-allowed"
                  )}
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publishing…
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      Publish &amp; share
                    </>
                  )}
                </button>

                {/* ── Save Draft button ── */}
                <button
                  onClick={onSaveDraft}
                  disabled={isBusy || !context.title.trim()}
                  className={cn(
                    "w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-[0.1em] border transition-all duration-200",
                    !isBusy && context.title.trim()
                      ? "border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900"
                      : "border-slate-100 text-slate-300 cursor-not-allowed"
                  )}
                >
                  {isSavingDraft ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save as draft
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-400">
                  {allReady
                    ? "You can always edit this later from your dashboard"
                    : "Complete all checks above to publish"}
                </p>
              </div>

              {/* Decorative session label */}
              <div className="mt-10 pt-8 border-t border-slate-100">
                <p className="text-[10px] text-slate-300 font-mono uppercase tracking-widest text-center">
                  {context.title ? context.title.toUpperCase().slice(0, 24) : "UNTITLED SESSION"} · READY
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
