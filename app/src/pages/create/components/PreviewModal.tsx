import { useState } from "react";
import { X, Smartphone, Monitor, Eye, Heart, Smile, Star } from "lucide-react";
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

// ─── Theme definitions (keep in sync with QuestionSidePanel) ───────────────
const QUESTION_THEMES = {
  default: {
    bg: "#ffffff",
    surface: "#f8fafc",
    text: "#0f172a",
    subtext: "#64748b",
    accent: "#6366f1",
    accentFg: "#ffffff",
    border: "#e2e8f0",
    optionBg: "#ffffff",
    optionHover: "#eef2ff",
    optionBorder: "#e2e8f0",
    progressBg: "#e2e8f0",
    inputBg: "#f8fafc",
    frameChrome: "#f1f5f9",
  },
  ocean: {
    bg: "#0c1445",
    surface: "#0f1a52",
    text: "#e0f2fe",
    subtext: "#7dd3fc",
    accent: "#22d3ee",
    accentFg: "#0c1445",
    border: "#1e3a8a",
    optionBg: "rgba(255,255,255,0.07)",
    optionHover: "rgba(34,211,238,0.15)",
    optionBorder: "#1e3a8a",
    progressBg: "rgba(255,255,255,0.15)",
    inputBg: "rgba(255,255,255,0.07)",
    frameChrome: "#0a1130",
  },
  sunset: {
    bg: "#431407",
    surface: "#4c1a0a",
    text: "#fef3c7",
    subtext: "#fca5a5",
    accent: "#fb7185",
    accentFg: "#ffffff",
    border: "#7c2d12",
    optionBg: "rgba(255,255,255,0.07)",
    optionHover: "rgba(251,113,133,0.18)",
    optionBorder: "#7c2d12",
    progressBg: "rgba(255,255,255,0.15)",
    inputBg: "rgba(255,255,255,0.07)",
    frameChrome: "#3b0d04",
  },
  forest: {
    bg: "#052e16",
    surface: "#064e1e",
    text: "#d1fae5",
    subtext: "#6ee7b7",
    accent: "#34d399",
    accentFg: "#052e16",
    border: "#065f46",
    optionBg: "rgba(255,255,255,0.07)",
    optionHover: "rgba(52,211,153,0.15)",
    optionBorder: "#065f46",
    progressBg: "rgba(255,255,255,0.15)",
    inputBg: "rgba(255,255,255,0.07)",
    frameChrome: "#03180c",
  },
  midnight: {
    bg: "#020617",
    surface: "#0f172a",
    text: "#e2e8f0",
    subtext: "#94a3b8",
    accent: "#8b5cf6",
    accentFg: "#ffffff",
    border: "#1e293b",
    optionBg: "rgba(255,255,255,0.05)",
    optionHover: "rgba(139,92,246,0.15)",
    optionBorder: "#1e293b",
    progressBg: "rgba(255,255,255,0.1)",
    inputBg: "rgba(255,255,255,0.05)",
    frameChrome: "#01030f",
  },
  candy: {
    bg: "#fff0f6",
    surface: "#fce7f3",
    text: "#500724",
    subtext: "#9d174d",
    accent: "#ec4899",
    accentFg: "#ffffff",
    border: "#fbcfe8",
    optionBg: "#ffffff",
    optionHover: "#fdf2f8",
    optionBorder: "#fbcfe8",
    progressBg: "#fbcfe8",
    inputBg: "#ffffff",
    frameChrome: "#fce7f3",
  },
  golden: {
    bg: "#292800",
    surface: "#322f00",
    text: "#fef9c3",
    subtext: "#fcd34d",
    accent: "#fbbf24",
    accentFg: "#292800",
    border: "#713f12",
    optionBg: "rgba(255,255,255,0.07)",
    optionHover: "rgba(251,191,36,0.15)",
    optionBorder: "#713f12",
    progressBg: "rgba(255,255,255,0.15)",
    inputBg: "rgba(255,255,255,0.07)",
    frameChrome: "#1a1800",
  },
  arctic: {
    bg: "#082f49",
    surface: "#0c3d5e",
    text: "#e0f2fe",
    subtext: "#bae6fd",
    accent: "#7dd3fc",
    accentFg: "#082f49",
    border: "#0c4a6e",
    optionBg: "rgba(255,255,255,0.07)",
    optionHover: "rgba(125,211,252,0.15)",
    optionBorder: "#0c4a6e",
    progressBg: "rgba(255,255,255,0.15)",
    inputBg: "rgba(255,255,255,0.07)",
    frameChrome: "#041c30",
  },
} as const;

type ThemeKey = keyof typeof QUESTION_THEMES;
type Theme = typeof QUESTION_THEMES[ThemeKey];

function getTheme(question: Question | null | undefined): Theme {
  const id = ((question as any)?.theme ?? "default") as string;
  return (QUESTION_THEMES as Record<string, Theme>)[id] ?? QUESTION_THEMES.default;
}

// ─── Question type renderers ───────────────────────────────────────────────
const MultipleChoiceRenderer = ({ options, theme }: { options: any[]; theme: Theme }) => (
  <div className="space-y-2.5">
    {options.map((opt) => (
      <button
        key={opt.id}
        style={{
          background: theme.optionBg,
          borderColor: theme.optionBorder,
          color: theme.text,
        }}
        className="w-full p-3 rounded-xl border-2 text-left transition-all"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-5 h-5 rounded-full border-2 flex-shrink-0"
            style={{ borderColor: theme.optionBorder }}
          />
          <span className="text-xs">{opt.text}</span>
        </div>
      </button>
    ))}
  </div>
);

const OpenTextRenderer = ({ theme }: { theme: Theme }) => (
  <div className="space-y-3">
    <textarea
      placeholder="Type your answer here..."
      style={{
        background: theme.inputBg,
        borderColor: theme.border,
        color: theme.text,
      }}
      className="w-full min-h-[90px] p-3 rounded-xl border text-xs resize-none focus:outline-none placeholder:opacity-50"
      disabled
    />
    <button
      style={{ background: theme.accent, color: theme.accentFg }}
      className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-md"
    >
      Submit Response
    </button>
  </div>
);

const RatingRenderer = ({ question, theme }: { question: Question; theme: Theme }) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const scale = { min: 1, max: question.scale?.max || 5 };
  const minLabel = question.labels?.min || "Low";
  const maxLabel = question.labels?.max || "High";
  const displayStyle = question.displayStyle || "numbers";
  const ratings = Array.from(
    { length: scale.max - scale.min + 1 },
    (_, i) => scale.min + i
  );

  const getRatingColor = (rating: number): string => {
    const pct = ((rating - scale.min) / (scale.max - scale.min)) * 100;
    if (pct <= 33) return "#f87171";
    if (pct <= 66) return "#fbbf24";
    return "#34d399";
  };

  const renderButton = (rating: number) => {
    const isHovered = hoveredRating === rating;
    return (
      <button
        key={rating}
        onMouseEnter={() => setHoveredRating(rating)}
        onMouseLeave={() => setHoveredRating(null)}
        disabled
        style={{
          background: isHovered ? theme.optionHover : theme.optionBg,
          borderColor: isHovered ? theme.accent : theme.optionBorder,
          transform: isHovered ? "scale(1.1)" : "scale(1)",
        }}
        className="w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-200"
      >
        {displayStyle === "stars" && (
          <Star
            className="w-4 h-4 transition-all"
            style={{ color: "#fbbf24", fill: "#fbbf24" }}
          />
        )}
        {displayStyle === "hearts" && (
          <Heart
            className="w-4 h-4 transition-all"
            style={{ color: "#fb7185", fill: "#fb7185" }}
          />
        )}
        {displayStyle === "smileys" && (
          <Smile className="w-4 h-4 transition-all" style={{ color: "#facc15" }} />
        )}
        {displayStyle === "numbers" && (
          <span
            className="text-base font-bold"
            style={{ color: isHovered ? theme.accent : getRatingColor(rating) }}
          >
            {rating}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${ratings.length}, minmax(0, 1fr))` }}
      >
        {ratings.map(renderButton)}
      </div>
      <div
        className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest"
        style={{ color: theme.subtext }}
      >
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
};

const WordCloudRenderer = ({ theme }: { theme: Theme }) => (
  <div className="space-y-3">
    <input
      type="text"
      placeholder="Enter a word or phrase..."
      style={{
        background: theme.inputBg,
        borderColor: theme.border,
        color: theme.text,
      }}
      className="w-full p-3 rounded-xl border text-xs focus:outline-none placeholder:opacity-50"
      disabled
    />
    <button
      style={{ background: theme.accent, color: theme.accentFg }}
      className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-md"
    >
      Submit Word
    </button>
  </div>
);

const getDisplayType = (q: Question) => {
  const t = q.type;
  if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "POLL", "multiple-choice"].includes(t))
    return "multiple-choice";
  if (["OPEN_TEXT", "open-text"].includes(t)) return "open-text";
  if (["RATING", "rating-scale"].includes(t)) return "rating-scale";
  if (["WORD_CLOUD", "word-cloud"].includes(t)) return "word-cloud";
  return "multiple-choice";
};

const QuestionContent = ({ question, theme }: { question: Question; theme: Theme }) => {
  const type = getDisplayType(question);
  const options = question.options || [];

  switch (type) {
    case "multiple-choice":
      return options.length > 0 ? (
        <MultipleChoiceRenderer options={options} theme={theme} />
      ) : (
        <div className="text-center py-4 text-xs" style={{ color: theme.subtext }}>
          No options added yet
        </div>
      );
    case "open-text":
      return <OpenTextRenderer theme={theme} />;
    case "word-cloud":
      return <WordCloudRenderer theme={theme} />;
    case "rating-scale":
      return <RatingRenderer question={question} theme={theme} />;
    default:
      return <MultipleChoiceRenderer options={options} theme={theme} />;
  }
};



// ─── Phone frame ───────────────────────────────────────────────────────────
const PhoneFrame = ({
  question,
  totalQuestions,
  currentIndex,
  theme,
}: {
  question: Question;
  totalQuestions: number;
  currentIndex: number;
  theme: Theme;
}) => (
  <div className="w-full max-w-[320px] mx-auto">
    <div
      className="relative shadow-2xl overflow-hidden mx-auto rounded-[2rem] border-[10px] border-gray-800"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 rounded-b-xl z-20 bg-gray-800" />

      <div
        className="w-full h-[600px] overflow-y-auto flex flex-col rounded-[1.5rem]"
        style={{ background: theme.bg }}
      >
        {/* Header */}
        <div
          className="border-b p-4 pt-7"
          style={{ borderColor: theme.border, background: theme.surface }}
        >
          <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
            Preview Mode
          </h3>
          <p className="text-xs" style={{ color: theme.subtext }}>
            Question {currentIndex + 1} of {totalQuestions}
          </p>
          {/* Progress bar */}
          <div
            className="mt-2 h-1 rounded-full overflow-hidden"
            style={{ background: theme.progressBg }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
                background: theme.accent,
              }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4" style={{ background: theme.bg }}>
          <div className="relative space-y-4">
            {(question as any)?.image && (
              <img
                src={(question as any).image}
                alt=""
                className="w-full h-32 object-cover rounded-xl mb-3"
              />
            )}
            <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
              {question?.title || "Untitled question"}
            </h2>
            {question?.description && (
              <p className="text-sm mb-3" style={{ color: theme.subtext }}>
                {question.description}
              </p>
            )}
            <QuestionContent question={question} theme={theme} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Desktop frame ─────────────────────────────────────────────────────────
const DesktopFrame = ({
  question,
  totalQuestions,
  currentIndex,
  theme,
}: {
  question: Question;
  totalQuestions: number;
  currentIndex: number;
  theme: Theme;
}) => (
  <div className="w-full max-w-2xl mx-auto">
    <div className="rounded-2xl overflow-hidden shadow-xl" style={{ borderColor: theme.border }}>
      {/* Browser chrome */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ background: theme.frameChrome, borderColor: theme.border }}
      >
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <div
          className="flex-1 mx-2 h-6 rounded-md border flex items-center px-2"
          style={{ background: theme.bg, borderColor: theme.border }}
        >
          <span className="text-[8px]" style={{ color: theme.subtext }}>
            preview.engage.app
          </span>
        </div>
      </div>

      {/* Page content */}
      <div className="p-8" style={{ background: theme.bg }}>
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
              Question {currentIndex + 1} of {totalQuestions}
            </h3>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: theme.progressBg }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
                background: theme.accent,
              }}
            />
          </div>
        </div>

        {/* Question image */}
        {(question as any)?.image && (
          <img
            src={(question as any).image}
            alt=""
            className="w-full h-48 object-cover rounded-xl mb-5"
          />
        )}

        <h2 className="text-xl font-bold mb-2" style={{ color: theme.text }}>
          {question?.title || "Untitled question"}
        </h2>
        {question?.description && (
          <p className="text-sm mb-4" style={{ color: theme.subtext }}>
            {question.description}
          </p>
        )}

        <QuestionContent question={question} theme={theme} />
      </div>
    </div>
  </div>
);

// ─── Main modal ────────────────────────────────────────────────────────────
export function PreviewModal({
  isOpen,
  onClose,
  question,
  presentationSettings,
  questions,
  currentQuestionIndex,
}: PreviewModalProps) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const displayQuestion = question || questions[currentQuestionIndex];
  const theme = getTheme(displayQuestion);

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Modal header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Live Preview</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      See how your audience will experience this
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Device toggle */}
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
                        {d === "mobile" ? (
                          <Smartphone className="w-4 h-4" />
                        ) : (
                          <Monitor className="w-4 h-4" />
                        )}
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

              {/* Modal content */}
              <div className="p-8 bg-slate-50 flex items-center justify-center min-h-[500px]">
                {device === "mobile" ? (
                  <PhoneFrame
                    question={displayQuestion}
                    totalQuestions={questions.length}
                    currentIndex={currentQuestionIndex}
                    theme={theme}
                  />
                ) : (
                  <DesktopFrame
                    question={displayQuestion}
                    totalQuestions={questions.length}
                    currentIndex={currentQuestionIndex}
                    theme={theme}
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
