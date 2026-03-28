// Step4.tsx — current typography/color style + previous 2-column grid layout
import { Slider } from "../../../../components/ui/slider";
import { Globe, Lock, Copy, Check, Settings, Music, Bell, Users } from "lucide-react";
import type { ContextData } from "../../types";
import { cn } from "../../../../lib/utils";
import { motion } from "framer-motion";

interface Step4Props {
  context: ContextData;
  onSettingsChange: (updates: any) => void;
}

// ── Toggle ────────────────────────────────────────────────────────────────
const AppToggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    onClick={() => onChange(!checked)}
    className={cn(
      "w-9 h-5 rounded-full transition-all relative flex items-center px-0.5 flex-shrink-0",
      checked ? "bg-[#6366F1]" : "bg-slate-200"
    )}
  >
    <div
      className={cn(
        "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
        checked ? "translate-x-4" : "translate-x-0"
      )}
    />
  </button>
);

// ── Toggle row ────────────────────────────────────────────────────────────
const ToggleRow = ({
  label,
  description,
  checked,
  onChange,
  last = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) => (
  <div className={cn("flex items-center justify-between gap-6 py-3.5", !last && "border-b border-slate-100")}>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
    </div>
    <AppToggle checked={checked} onChange={onChange} />
  </div>
);

// ── Section card — borderless, labelled block ─────────────────────────────
const SectionCard = ({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
    {/* Header */}
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{label}</p>
    </div>
    {/* Body */}
    <div className="px-5 py-4">{children}</div>
  </div>
);

const MODES = [
  { value: "PUBLIC",       label: "Public",         desc: "Anyone with the link", Icon: Globe },
  { value: "INVITE_ONLY", label: "Invite only",     desc: "Invited participants",  Icon: Lock },
  { value: "CODE_REQUIRED",label: "Code required",  desc: "Passcode at entry",     Icon: Copy },
];

const VALIDATION_OPTS = [
  { value: "AUTO",      label: "Auto" },
  { value: "MANUAL",    label: "Manual" },
  { value: "REAL_TIME", label: "Real-time" },
];

const MUSIC_OPTS = [
  { value: "upbeat", label: "Upbeat" },
  { value: "calm",   label: "Calm" },
  { value: "epic",   label: "Epic" },
  { value: "none",   label: "None" },
];

export function Step4({ context, onSettingsChange }: Step4Props) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        {/* ── Page header ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 lg:mb-8">
              <span className="text-indigo-600 font-black text-lg sm:text-xl tracking-tighter">04</span>
              <div className="h-[2px] w-8 sm:w-12 bg-gradient-to-r from-indigo-500 to-transparent" />
              <span className="text-slate-400 font-bold text-[8px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em]">Systems</span>
          </div>
          <h1 className="text-4xl sm:text-[3.25rem] font-black text-slate-950 tracking-tighter leading-[0.95] mb-4">
            Configure<br />
            <span className="text-indigo-600 italic">the rules.</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-sm">
            Set participation access, scoring, audio, and notification preferences.
          </p>
        </motion.div>

        {/* ── Layout ─────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Row 1 — Participation (full width) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <SectionCard icon={Users} label="Participation">
              {/* Mode picker */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
                {MODES.map(({ value, label, desc, Icon }) => {
                  const active = context.settings.participationMode === value;
                  return (
                    <button
                      key={value}
                      onClick={() => onSettingsChange({ participationMode: value })}
                      className={cn(
                        "relative text-left px-4 py-4 rounded-xl border-2 transition-all duration-150",
                        active
                          ? "border-slate-900 bg-slate-950"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                      )}
                    >
                      {active && (
                        <div className="absolute top-3 right-3">
                          <Check className="w-3.5 h-3.5 text-white/50" />
                        </div>
                      )}
                      <Icon className={cn("w-3.5 h-3.5 mb-3", active ? "text-white/40" : "text-slate-400")} />
                      <p className={cn("text-xs font-black", active ? "text-white" : "text-slate-800")}>{label}</p>
                      <p className={cn("text-[11px] mt-0.5 leading-snug", active ? "text-white/50" : "text-slate-400")}>{desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Toggle group */}
              <div className="border border-slate-200 rounded-xl px-4 mb-5">
                <ToggleRow
                  label="Require account"
                  description="Participants must be signed in"
                  checked={context.settings.requireAccount}
                  onChange={(v) => onSettingsChange({ requireAccount: v })}
                />
                <ToggleRow
                  label="Allow guests"
                  description="Join without an account"
                  checked={context.settings.allowGuest}
                  onChange={(v) => onSettingsChange({ allowGuest: v })}
                />
                <ToggleRow
                  label="Allow anonymous"
                  description="Hide participant names"
                  checked={context.settings.allowAnonymous}
                  onChange={(v) => onSettingsChange({ allowAnonymous: v })}
                  last
                />
              </div>

              {/* Slider */}
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-800">Max participants</p>
                  <span className="text-2xl font-black text-slate-950 tabular-nums">
                    {context.settings.maxParticipants}
                  </span>
                </div>
                <Slider
                  value={[context.settings.maxParticipants]}
                  onValueChange={([v]) => onSettingsChange({ maxParticipants: v })}
                  min={1}
                  max={1000}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-slate-300 font-mono">1</span>
                  <span className="text-[10px] text-slate-300 font-mono">1,000</span>
                </div>
              </div>
            </SectionCard>
          </motion.div>

          {/* Row 2 — Game Rules + (Audio + Notifications) */}
          <div className="grid sm:grid-cols-2 gap-5 items-start">

            {/* Game rules */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <SectionCard icon={Settings} label="Game rules">
                {/* Time limit */}
                <div className="flex items-center justify-between py-3.5 border-b border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Time limit</p>
                    <p className="text-xs text-slate-400 mt-0.5">Overall session</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={context.settings.timeLimit}
                      onChange={(e) => onSettingsChange({ timeLimit: parseInt(e.target.value) || 60 })}
                      className="w-14 text-center text-sm font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400 transition-colors"
                    />
                    <span className="text-xs text-slate-400">min</span>
                  </div>
                </div>

                {/* Validation */}
                <div className="py-3.5 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800 mb-2">Answer validation</p>
                  <div className="flex gap-1">
                    {VALIDATION_OPTS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => onSettingsChange({ answerValidation: opt.value })}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                          context.settings.answerValidation === opt.value
                            ? "bg-slate-900 text-white"
                            : "text-slate-500 hover:bg-slate-100"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <ToggleRow
                  label="Show leaderboard"
                  description="Display scores live"
                  checked={context.settings.showLeaderboard}
                  onChange={(v) => onSettingsChange({ showLeaderboard: v })}
                />
                <ToggleRow
                  label="Show progress"
                  description="Question progress bar"
                  checked={context.settings.showProgress}
                  onChange={(v) => onSettingsChange({ showProgress: v })}
                />
                <ToggleRow
                  label="Allow retry"
                  description="Try questions again"
                  checked={context.settings.allowRetry}
                  onChange={(v) => onSettingsChange({ allowRetry: v })}
                />
                <ToggleRow
                  label="Shuffle questions"
                  description="Randomize order per participant"
                  checked={context.settings.shuffleQuestions}
                  onChange={(v) => onSettingsChange({ shuffleQuestions: v })}
                  last
                />
              </SectionCard>
            </motion.div>

            {/* Audio + Notifications stacked */}
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.11 }}
              >
                <SectionCard icon={Music} label="Audio & effects">
                  <ToggleRow
                    label="Sound effects"
                    description="Audio cues during the game"
                    checked={context.settings.soundEffects}
                    onChange={(v) => onSettingsChange({ soundEffects: v })}
                  />
                  <div className="pt-3.5">
                    <p className="text-sm font-semibold text-slate-800 mb-2.5">Background music</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {MUSIC_OPTS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => onSettingsChange({ backgroundMusic: opt.value })}
                          className={cn(
                            "py-2 rounded-lg text-[11px] font-bold transition-all",
                            context.settings.backgroundMusic === opt.value
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </SectionCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
              >
                <SectionCard icon={Bell} label="Notifications">
                  <ToggleRow
                    label="Send notifications"
                    description="Email reminders & updates"
                    checked={context.settings.notifications}
                    onChange={(v) => onSettingsChange({ notifications: v })}
                    last={!context.settings.notifications}
                  />
                  {context.settings.notifications && (
                    <div className="pl-0 mt-1 space-y-0 border-t border-slate-100 divide-y divide-slate-100">
                      {[
                        "Join reminders",
                        "Results ready",
                        "Time limit warnings",
                      ].map((item, i, arr) => (
                        <ToggleRow
                          key={item}
                          label={item}
                          checked
                          onChange={() => {}}
                          last={i === arr.length - 1}
                        />
                      ))}
                    </div>
                  )}
                </SectionCard>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
