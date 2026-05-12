import { useState } from "react";
import { X, Smartphone, Monitor, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Question } from "../types";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  question?: Question;
  presentationSettings: any;
  questions: Question[];
  currentQuestionIndex: number;
}

const normalizeType = (t: string) => {
  if (["SINGLE_CHOICE","MULTIPLE_CHOICE","TRUE_FALSE","POLL","multiple-choice"].includes(t)) return "multiple-choice";
  if (["OPEN_TEXT","open-text"].includes(t)) return "open-text";
  if (["RATING","rating","rating-scale"].includes(t)) return "rating-scale";
  if (["WORD_CLOUD","word-cloud"].includes(t)) return "word-cloud";
  return "multiple-choice";
};

// ─── Lucide-equivalent inline SVGs ───────────────────────────────────────────
const IconCheckSquare = ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
);
const IconMessageSquare = ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);
const IconStar = ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconCloud = ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>
  </svg>
);
const IconCheck = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconSend = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IconUsers = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

// Type config matching the original component icon/label/bg exactly
const typeConfig = {
  "multiple-choice": {
    icon: <IconCheckSquare size={18} color="#6366f1" />,
    label: "Multiple Choice",
    iconBg: "bg-indigo-100/60",
  },
  "open-text": {
    icon: <IconMessageSquare size={18} color="#64748b" />,
    label: "Open Response",
    iconBg: "bg-slate-100",
  },
  "rating-scale": {
    icon: <IconStar size={18} color="#f59e0b" />,
    label: "Rating Scale",
    iconBg: "bg-amber-100/60",
  },
  "word-cloud": {
    icon: <IconCloud size={18} color="#22c55e" />,
    label: "Word Cloud",
    iconBg: "bg-green-100/60",
  },
};

// ─── Multiple Choice ──────────────────────────────────────────────────────────
function MultipleChoicePreview({ question, scale }: { question: Question; scale: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const options = question.options || [];
  const s = scale;

  // Check if an option has only an image and no text
  const isImageOnlyOption = (opt: any) => {
    return opt.imageUrl && (!opt.text || opt.text.trim() === "");
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Grid layout of 2 columns for options */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt: any) => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            className={`text-left rounded-xl border-2 transition-all duration-150 ${
              selected === opt.id
                ? "border-indigo-600 bg-indigo-50 shadow-md"
                : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-100"
            } ${isImageOnlyOption(opt) ? "p-0 overflow-hidden" : ""}`}
            style={{ minHeight: isImageOnlyOption(opt) ? "auto" : 56 * s }}
          >
            {isImageOnlyOption(opt) ? (
              // Image-only option - show full image without padding
              <div className="relative w-full">
                <img
                  src={opt.imageUrl}
                  alt=""
                  className="w-full h-auto object-contain max-h-32"
                />
                <div
                  className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150 bg-white/80 ${
                    selected === opt.id ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                  }`}
                >
                  {selected === opt.id && <IconCheck size={12} />}
                </div>
              </div>
            ) : (
              <div className="flex items-center" style={{ padding: `${12 * s}px ${16 * s}px`, gap: 12 * s }}>
                <div
                  className={`flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
                    selected === opt.id ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                  }`}
                  style={{ width: 20 * s, height: 20 * s }}
                >
                  {selected === opt.id && <IconCheck size={Math.round(12 * s)} />}
                </div>
                <div className="flex-1">
                  <span
                    className={`font-medium ${selected === opt.id ? "text-slate-900" : "text-slate-900"}`}
                    style={{ fontSize: 16 * s }}
                  >
                    {opt.text}
                  </span>
                  {opt.imageUrl && (
                    <div className="mt-2 overflow-hidden rounded-lg">
                      <img
                        src={opt.imageUrl}
                        alt=""
                        className="w-full h-auto max-h-24 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
      {options.length === 0 && (
        <p className="text-center text-slate-400" style={{ fontSize: 14 * s, padding: `${12 * s}px 0` }}>
          No options added yet
        </p>
      )}
      {/* Submit button — mirrors Button variant=default size=lg fullWidth */}
      <button
        disabled={!selected}
        className={`w-full flex items-center justify-center gap-2 rounded-xl font-semibold transition-all ${
          selected ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed"
        }`}
        style={{ padding: `${10 * s}px`, fontSize: 14 * s, marginTop: 8 * s }}
      >
        Submit Answer <IconSend size={Math.round(14 * s)} />
      </button>
     
    </div>
  );
}

// ─── Open Text ────────────────────────────────────────────────────────────────
function OpenTextPreview({ scale }: { scale: number }) {
  const [text, setText] = useState("");
  const maxLength = 500;
  const remaining = maxLength - text.length;
  const s = scale;

  return (
    <div className="mb-6">
      <textarea
        value={text}
        onChange={(e) => e.target.value.length <= maxLength && setText(e.target.value)}
        placeholder="Type your response here..."
        className="w-full rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 resize-none transition-all"
        style={{ minHeight: 160 * s, padding: `${12 * s}px ${16 * s}px`, fontSize: 15 * s }}
      />
      <div className="flex items-center justify-between px-1" style={{ marginTop: 8 * s }}>
        <span className="text-slate-400" style={{ fontSize: 12 * s }} />
        <span className={`font-medium ${remaining < 50 ? "text-amber-500" : "text-slate-400"}`} style={{ fontSize: 12 * s }}>
          {remaining} characters remaining
        </span>
      </div>
      <button
        disabled={!text.trim()}
        className={`w-full flex items-center justify-center gap-2 rounded-xl font-semibold transition-all ${
          text.trim() ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed"
        }`}
        style={{ padding: `${10 * s}px`, fontSize: 14 * s, marginTop: 8 * s }}
      >
        Submit Response <IconSend size={Math.round(14 * s)} />
      </button>
      
    </div>
  );
}

// ─── Rating Scale ─────────────────────────────────────────────────────────────
function RatingPreview({ question, scale: s }: { question: Question; scale: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const scaleMin = 1;
  const scaleMax = (question as any).scale?.max || 5;
  const ratings = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => scaleMin + i);
  const displayStyle = (question as any).displayStyle || "numbers";

  const getRatingColor = (r: number) => {
    const pct = ((r - scaleMin) / (scaleMax - scaleMin)) * 100;
    if (pct <= 33) return "#ef4444";
    if (pct <= 66) return "#f59e0b";
    return "#22c55e";
  };

  return (
    <div className="mb-8">
      {/* Grid — exact original: grid gap-2, gridTemplateColumns repeat */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${ratings.length}, minmax(0, 1fr))`,
          gap: 8 * s,
        }}
      >
        {ratings.map((r) => {
          const isSelected = selected === r;
          const isHovered = hovered === r;
          return (
            <button
              key={r}
              onClick={() => setSelected(r)}
              onMouseEnter={() => setHovered(r)}
              onMouseLeave={() => setHovered(null)}
              className={`rounded-xl border-2 flex items-center justify-center transition-all duration-150 ${
                isSelected
                  ? "border-indigo-600 bg-indigo-600 shadow-lg scale-105"
                  : isHovered
                  ? "border-indigo-400 bg-indigo-50 scale-105 shadow-md"
                  : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-100"
              }`}
              style={{ width: "100%", height: 40 * s }}
            >
              {displayStyle === "stars" && (
                <svg width={16 * s} height={16 * s} viewBox="0 0 24 24" fill={isSelected ? "white" : "#fbbf24"} stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              )}
              {displayStyle === "hearts" && (
                <svg width={16 * s} height={16 * s} viewBox="0 0 24 24" fill={isSelected ? "white" : "#fb7185"} stroke="none">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              )}
              {displayStyle === "smileys" && (
                <svg width={16 * s} height={16 * s} viewBox="0 0 24 24" fill="none" stroke={isSelected ? "white" : "#eab308"} strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M8 13s1.5 3 4 3 4-3 4-3"/>
                  <circle cx="9" cy="10" r="1" fill={isSelected ? "white" : "#eab308"}/><circle cx="15" cy="10" r="1" fill={isSelected ? "white" : "#eab308"}/>
                </svg>
              )}
              {displayStyle === "numbers" && (
                <span
                  className="font-bold"
                  style={{
                    fontSize: 15 * s,
                    color: isSelected ? "#fff" : isHovered ? "#4f46e5" : getRatingColor(r),
                  }}
                >
                  {r}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Labels — exact original: text-[9px] font-bold text-muted-foreground uppercase tracking-widest */}
      <div
        className="flex items-center justify-between font-bold text-slate-400 uppercase tracking-widest px-2"
        style={{ marginTop: 12 * s, fontSize: 9 * s }}
      >
        <span>{(question as any).labels?.min || "Low"}</span>
        <span>{(question as any).labels?.max || "High"}</span>
      </div>

      {/* "You selected" text */}
      {selected !== null && (
        <div className="text-center" style={{ marginTop: 16 * s }}>
          <p className="text-slate-500" style={{ fontSize: 13 * s }}>
            You selected: <span className="font-semibold text-slate-900">{selected}</span>
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        disabled={selected === null}
        className={`w-full flex items-center justify-center gap-2 rounded-xl font-semibold transition-all ${
          selected !== null ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed"
        }`}
        style={{ padding: `${10 * s}px`, fontSize: 14 * s, marginTop: 8 * s }}
      >
        Submit Rating <IconSend size={Math.round(14 * s)} />
      </button>
      
    </div>
  );
}

// ─── Word Cloud ───────────────────────────────────────────────────────────────
function WordCloudPreview({ question, scale: s }: { question: Question; scale: number }) {
  const [words, setWords] = useState("");
  const maxWords = (question as any).maxWords || 5;
  const wordArray = words.trim().split(/\s+/).filter((w) => w.length > 0);
  const remaining = maxWords - wordArray.length;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = e.target.value.trim().split(/\s+/).filter((w) => w.length > 0);
    if (arr.length <= maxWords) setWords(e.target.value);
  };

  const removeWord = (i: number) => {
    const arr = [...wordArray];
    arr.splice(i, 1);
    setWords(arr.join(" "));
  };

  return (
    <div className="mb-6">
      <input
        type="text"
        value={words}
        onChange={handleChange}
        placeholder="Type words separated by spaces..."
        className="w-full rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 transition-all"
        style={{ padding: `${12 * s}px ${16 * s}px`, fontSize: 15 * s }}
      />
      <div className="flex items-center justify-between px-1" style={{ marginTop: 8 * s }}>
        <span className="text-slate-400" style={{ fontSize: 12 * s }}>Press space to add multiple words</span>
        <span className={`font-medium ${remaining <= 2 ? "text-amber-500" : "text-slate-400"}`} style={{ fontSize: 12 * s }}>
          {remaining} words remaining
        </span>
      </div>

      {/* Word chips — bg-primary/10 border border-primary/20 */}
      {wordArray.length > 0 && (
        <div
          className="rounded-xl bg-slate-100/60 border border-slate-200 flex flex-wrap"
          style={{ padding: 16 * s, gap: 8 * s, marginTop: 12 * s }}
        >
          {wordArray.map((w, i) => (
            <div
              key={i}
              className="inline-flex items-center rounded-lg bg-indigo-50 border border-indigo-200"
              style={{ padding: `${6 * s}px ${12 * s}px`, gap: 8 * s }}
            >
              <span className="font-medium text-slate-900" style={{ fontSize: 13 * s }}>{w}</span>
              <button
                onClick={() => removeWord(i)}
                className="flex items-center justify-center rounded-full hover:bg-red-100 transition-colors"
                style={{ width: 20 * s, height: 20 * s }}
                aria-label="Remove word"
              >
                <svg width={14 * s} height={14 * s} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        disabled={wordArray.length === 0}
        className={`w-full flex items-center justify-center gap-2 rounded-xl font-semibold transition-all ${
          wordArray.length > 0 ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed"
        }`}
        style={{ padding: `${10 * s}px`, fontSize: 14 * s, marginTop: 8 * s }}
      >
        Submit Words <IconSend size={Math.round(14 * s)} />
      </button>
    </div>
  );
}

// ─── Question card ────────────────────────────────────────────────────────────
function QuestionCard({ question, scale = 1 }: { question: Question; scale?: number }) {
  const type = normalizeType(question.type || "");
  const cfg = typeConfig[type as keyof typeof typeConfig] || typeConfig["multiple-choice"];
  const s = scale;

  return (
    <div
      className="bg-white rounded-xl shadow-lg border border-slate-200"
      style={{ padding: `${24 * s}px` }}
    >
      {/* Type indicator — flex items-center gap-2 mb-3; icon in w-8 h-8 rounded-lg */}
      <div className="flex items-center" style={{ gap: 8 * s, marginBottom: 12 * s }}>
        <div
          className={`flex items-center justify-center rounded-lg flex-shrink-0 ${cfg.iconBg}`}
          style={{ width: 32 * s, height: 32 * s }}
        >
          <span style={{ transform: `scale(${s})`, display: "flex" }}>{cfg.icon}</span>
        </div>
        <span className="font-medium text-slate-500" style={{ fontSize: 14 * s }}>
          {cfg.label}
        </span>
      </div>

      {/* Question title — text-xl font-bold text-foreground leading-tight */}
      <h2
        className="font-bold text-slate-900 leading-tight"
        style={{ fontSize: Math.min(22, 22 * s), marginBottom: 4 * s }}
      >
        {question.title || question.text || "Untitled question"}
      </h2>

      {/* Description */}
      {question.description && (
        <p className="text-slate-500" style={{ fontSize: 14 * s, marginTop: 8 * s, marginBottom: 8 * s }}>
          {question.description}
        </p>
      )}

      {/* Question image — full image visible, never cropped, only scaled down */}
      {((question as any).imageUrl || (question as any).image) && (
        <div
          className="rounded-xl border border-slate-200 bg-slate-100 flex justify-center"
          style={{ marginTop: 20 * s, marginBottom: 20 * s, padding: 8 * s }}
        >
          <img
            src={(question as any).imageUrl || (question as any).image}
            alt=""
            className="block mx-auto object-contain rounded-lg"
            style={{
              width: "auto",
              height: "auto",
              maxWidth: "100%",
              maxHeight: 360 * s,
            }}
          />
        </div>
      )}

      {/* Answer area */}
      {type === "multiple-choice" && <MultipleChoicePreview question={question} scale={s} />}
      {type === "open-text"       && <OpenTextPreview scale={s} />}
      {type === "rating-scale"    && <RatingPreview question={question} scale={s} />}
      {type === "word-cloud"      && <WordCloudPreview question={question} scale={s} />}
    </div>
  );
}

// ─── Session title card ───────────────────────────────────────────────────────
function SessionHeader({
  totalQuestions,
  currentIndex,
  scale,
}: {
  totalQuestions: number;
  currentIndex: number;
  scale: number;
}) {
  const s = scale;
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-slate-200"
      style={{ padding: `${16 * s}px ${24 * s}px`, marginBottom: 24 * s }}
    >
      <div className="flex items-center justify-between flex-wrap" style={{ gap: 12 * s }}>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate" style={{ fontSize: 16 * s }}>
            Session Preview
          </h3>
          <p className="text-slate-500" style={{ fontSize: 14 * s, marginTop: 4 * s }}>
            Code: ABC123 • Joined as Participant
          </p>
        </div>
        <div
          className="flex items-center rounded-lg border"
          style={{
            padding: `${6 * s}px ${12 * s}px`,
            gap: 8 * s,
            backgroundColor: "rgb(34 197 94 / 0.1)",
            borderColor: "rgb(34 197 94 / 0.2)",
          }}
        >
          <div
            className="rounded-full bg-green-500 animate-pulse"
            style={{ width: 8 * s, height: 8 * s }}
          />
          <span className="font-medium text-green-600 whitespace-nowrap" style={{ fontSize: 14 * s }}>
            Live
          </span>
        </div>
      </div>

      {totalQuestions > 0 && (
        <div
          className="flex items-center justify-between border-t border-slate-200"
          style={{ marginTop: 16 * s, paddingTop: 16 * s }}
        >
          <span className="text-slate-500" style={{ fontSize: 13 * s }}>
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <div className="flex" style={{ gap: 4 * s }}>
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-colors duration-250"
                style={{
                  width: 8 * s,
                  height: 8 * s,
                  backgroundColor:
                    i === currentIndex
                      ? "#4f46e5"
                      : i < currentIndex
                      ? "#22c55e"
                      : "#e2e8f0",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Timer bar stub ───────────────────────────────────────────────────────────
function TimerBarStub({ scale }: { scale: number }) {
  return (
    <div
      className="w-full"
      style={{ height: 6 * scale, backgroundColor: "rgb(241 245 249 / 0.6)" }}
    >
      <div
        className="h-full bg-indigo-600"
        style={{ width: "60%" }}
      />
    </div>
  );
}

// ─── Phone frame ──────────────────────────────────────────────────────────────
function PhoneFrame({ question, totalQuestions, currentIndex }: { question: Question; totalQuestions: number; currentIndex: number }) {
  const SCALE = 0.55;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative overflow-hidden"
        style={{
          width: 320,
          height: 620,
          borderRadius: 44,
          border: "10px solid #1e293b",
          boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.6)",
        }}
      >
        {/* Notch */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bg-slate-800 z-20"
          style={{ top: 0, width: 96, height: 24, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}
        />
        {/* Screen — bg-background (white) */}
        <div className="w-full h-full overflow-y-auto bg-white" style={{ paddingTop: 28 }}>
          <TimerBarStub scale={SCALE} />
          <div style={{ padding: `${8 * SCALE}px ${16 * SCALE}px ${32 * SCALE}px` }}>
            <SessionHeader totalQuestions={totalQuestions} currentIndex={currentIndex} scale={SCALE} />
            <QuestionCard question={question} scale={SCALE} />
          </div>
        </div>
      </div>
      <p className="text-center text-slate-400 mt-3" style={{ fontSize: 11 }}>
        Question {currentIndex + 1} of {totalQuestions}
      </p>
    </div>
  );
}

// ─── Desktop frame ────────────────────────────────────────────────────────────
function DesktopFrame({ question, totalQuestions, currentIndex }: { question: Question; totalQuestions: number; currentIndex: number }) {
  const SCALE = 0.75;

  return (
    <div className="w-full max-w-3xl flex flex-col items-center">
      <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border-b border-slate-200">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-2 h-6 rounded-md bg-white border border-slate-200 flex items-center px-3">
            <span className="text-xs text-slate-400">your-session.app/join</span>
          </div>
        </div>
        {/* Page — no internal scrolling, expands naturally */}
        <div className="bg-white">
          <TimerBarStub scale={SCALE} />
          <div
            className="mx-auto"
            style={{
              maxWidth: 672,
              padding: `${32 * SCALE}px ${16 * SCALE}px`,
            }}
          >
            <SessionHeader totalQuestions={totalQuestions} currentIndex={currentIndex} scale={SCALE} />
            <QuestionCard question={question} scale={SCALE} />
          </div>
        </div>
      </div>
      <p className="text-center text-slate-400 mt-3 text-xs">
        Question {currentIndex + 1} of {totalQuestions}
      </p>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export function PreviewModal({
  isOpen,
  onClose,
  question,
  questions,
  currentQuestionIndex,
}: PreviewModalProps) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const displayQuestion = question || questions[currentQuestionIndex];

  if (!displayQuestion) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[92vh] overflow-y-auto px-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Audience Preview</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      See how your audience will experience this
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
                    {(["mobile", "desktop"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDevice(d)}
                        className={`p-2 rounded-lg transition-all ${
                          device === d
                            ? "bg-indigo-600 text-white shadow-md"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {d === "mobile" ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 bg-slate-100 flex items-start justify-center min-h-[500px]">
                {device === "mobile" ? (
                  <PhoneFrame
                    question={displayQuestion}
                    totalQuestions={questions.length || 1}
                    currentIndex={currentQuestionIndex}
                  />
                ) : (
                  <DesktopFrame
                    question={displayQuestion}
                    totalQuestions={questions.length || 1}
                    currentIndex={currentQuestionIndex}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
