import { useState } from "react";
import type { Question } from "../types";
import {
  Eye,
  Smartphone,
  Monitor,
  Check,
  Star,
  Clock,
  BarChart2,
  FileText,
  Heart,
  Smile,
} from "lucide-react";

interface PreviewPanelProps {
  question?: Question;
  presentationSettings: any;
  questions: Question[];
  currentQuestionIndex: number;
}

// ─── Question type renderers ─────────────────────────────────────────────────

const MultipleChoiceRenderer = ({ options }: { options: any[] }) => (
  <div className="space-y-2.5">
    {options.map((opt) => (
      <button key={opt.id}
        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
          opt.isCorrect
            ? "border-emerald-300 bg-emerald-50"
            : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
            opt.isCorrect ? "border-emerald-500 bg-emerald-500 shadow-md shadow-emerald-100" : "border-slate-300 group-hover:border-indigo-400"
          }`}>
            {opt.isCorrect && <Check className="w-2.5 h-2.5 text-white" />}
          </div>
          <span className="text-xs text-slate-700">{opt.text}</span>
        </div>
      </button>
    ))}
  </div>
);

const OpenTextRenderer = () => (
  <div className="space-y-3">
    <div className="relative">
      <textarea placeholder="Type your answer here..."
        className="w-full min-h-[90px] p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs resize-none focus:outline-none placeholder:text-slate-400" disabled />
      <span className="absolute bottom-2 right-3 text-[9px] text-slate-400">0 / 500</span>
    </div>
    <button className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-md shadow-indigo-200 hover:bg-indigo-500 transition-colors">
      Submit Response
    </button>
  </div>
);

const WordCloudRenderer = () => (
  <div className="space-y-3">
    <input type="text" placeholder="Enter a word or phrase..."
      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs focus:outline-none placeholder:text-slate-400" disabled />
    <button className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-md shadow-indigo-200 hover:bg-indigo-500 transition-colors">
      Submit Word
    </button>
  </div>
);

// Enhanced RatingRenderer with hover effects and min=1
const RatingRenderer = ({ question }: { question: Question }) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  
  // Min fixed at 1, max adjustable
  const scale = { 
    min: 1, 
    max: question.scale?.max || 5 
  };
  
  const minLabel = question.labels?.min || 'Low';
  const maxLabel = question.labels?.max || 'High';
  const displayStyle = question.displayStyle || 'numbers';
  const ratings = Array.from(
    { length: scale.max - scale.min + 1 },
    (_, i) => scale.min + i
  );

  const getRatingColor = (rating: number): string => {
    const percentage = ((rating - scale.min) / (scale.max - scale.min)) * 100;
    if (percentage <= 33) return 'hsl(var(--destructive))';
    if (percentage <= 66) return 'hsl(var(--warning, 45 95% 60%))';
    return 'hsl(var(--success, 160 70% 50%))';
  };

  const renderButton = (rating: number) => {
    const isHovered = hoveredRating === rating;
    
    const baseClass = `w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
      isHovered
        ? 'border-indigo-400 bg-indigo-50 scale-110 shadow-md'
        : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 hover:scale-105'
    }`;

    if (displayStyle === 'stars') {
      return (
        <button 
          key={rating} 
          className={baseClass}
          onMouseEnter={() => setHoveredRating(rating)}
          onMouseLeave={() => setHoveredRating(null)}
          disabled
        >
          <Star className={`w-4 h-4 transition-all ${
            isHovered ? 'text-amber-500 fill-amber-500 scale-110' : 'text-amber-400 fill-amber-400'
          }`} />
        </button>
      );
    }
    if (displayStyle === 'hearts') {
      return (
        <button 
          key={rating} 
          className={baseClass}
          onMouseEnter={() => setHoveredRating(rating)}
          onMouseLeave={() => setHoveredRating(null)}
          disabled
        >
          <Heart className={`w-4 h-4 transition-all ${
            isHovered ? 'text-rose-500 fill-rose-500 scale-110' : 'text-rose-400 fill-rose-400'
          }`} />
        </button>
      );
    }
    if (displayStyle === 'smileys') {
      return (
        <button 
          key={rating} 
          className={baseClass}
          onMouseEnter={() => setHoveredRating(rating)}
          onMouseLeave={() => setHoveredRating(null)}
          disabled
        >
          <Smile className={`w-4 h-4 transition-all ${
            isHovered ? 'text-yellow-600 scale-110' : 'text-yellow-500'
          }`} />
        </button>
      );
    }
    // numbers
    return (
      <button 
        key={rating} 
        className={baseClass}
        onMouseEnter={() => setHoveredRating(rating)}
        onMouseLeave={() => setHoveredRating(null)}
        disabled
      >
        <span 
          className="text-base font-bold transition-all"
          style={{ 
            color: isHovered ? 'hsl(var(--primary))' : getRatingColor(rating),
            transform: isHovered ? 'scale(1.1)' : 'scale(1)'
          }}
        >
          {rating}
        </span>
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
      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
};

const getDisplayType = (q: Question) => {
  const t = q.type;
  if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "POLL", "multiple-choice"].includes(t)) return "multiple-choice";
  if (["OPEN_TEXT", "open-text"].includes(t)) return "open-text";
  if (["WORD_CLOUD", "word-cloud"].includes(t)) return "word-cloud";
  if (["RATING", "rating-scale"].includes(t)) return "rating-scale";
  return "multiple-choice";
};

const QuestionContent = ({ question }: { question: Question }) => {
  const type = getDisplayType(question);
  const options = question.options || [];
  switch (type) {
    case "multiple-choice": return options.length > 0 ? <MultipleChoiceRenderer options={options} /> : <div className="text-center py-4 text-xs text-slate-400">No options added yet</div>;
    case "open-text": return <OpenTextRenderer />;
    case "word-cloud": return <WordCloudRenderer />;
    case "rating-scale": return <RatingRenderer question={question} />;
    default: return <MultipleChoiceRenderer options={options} />;
  }
};

// ─── Phone Frame ─────────────────────────────────────────────────

const PhoneFrame = ({ question, settings, totalQuestions, currentIndex }: { question: Question; settings: any; totalQuestions: number; currentIndex: number }) => (
  <div className="w-full max-w-[280px] mx-auto">
    <div className="relative border-gray-800 shadow-lg overflow-hidden bg-background mx-auto rounded-[2rem] border-[10px]">
      
      {/* Mobile Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 rounded-b-xl z-20" />
      
      {/* Mobile Side Buttons */}
      <div className="absolute -left-2 top-20 w-1 h-10 bg-gray-800 rounded-l"></div>
      <div className="absolute -left-2 top-32 w-1 h-10 bg-gray-800 rounded-l"></div>
      <div className="absolute -right-2 top-20 w-1 h-16 bg-gray-800 rounded-r"></div>

      {/* Screen Content */}
      <div className="w-full h-[500px] overflow-y-auto flex flex-col bg-white rounded-[1.5rem]">
        
        {/* Header */}
        <div className="border-b border-slate-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings?.showLogo && (
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: settings.brandColor || '#6366f1' }}
              >
                <BarChart2 className="w-4 h-4 text-white" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 truncate max-w-[120px]">
                {settings?.title || 'Presentation'}
              </h3>
              <p className="text-xs text-slate-400">
                Live session
              </p>
            </div>
          </div>
          <div className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs">
            {question ? `Q ${currentIndex + 1}` : 'No question'}
          </div>
        </div>

        {/* Progress */}
        {totalQuestions > 0 && (
          <div className="px-4 pt-2.5">
            <div className="flex justify-between text-[8px] font-bold text-slate-400 mb-1">
              <span>Question {currentIndex + 1} of {totalQuestions}</span>
              <span>{Math.round(((currentIndex + 1) / totalQuestions) * 100)}%</span>
            </div>
            <div className="h-0.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            
            {/* Question Header */}
            <div className="text-center">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {question?.title || "Untitled question"}
              </h2>
              
              {question?.description && (
                <p className="text-sm text-slate-500 mb-3">
                  {question.description}
                </p>
              )}
              
              <div className="flex items-center justify-center gap-4">
                {question?.points !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Star className="w-3 h-3" />
                    <span>{question.points} points</span>
                  </div>
                )}
                {question?.timeLimit && (
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{question.timeLimit}s</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Question Content */}
            <div className="mt-4">
              <QuestionContent question={question} />
            </div>
            
            {/* Footer Stats */}
            <div className="pt-4 border-t border-slate-100">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-sm font-medium text-slate-900">{totalQuestions}</div>
                  <div className="text-xs text-slate-400">Total</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900">{question?.points || 0}</div>
                  <div className="text-xs text-slate-400">Points</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900">{question?.timeLimit || 0}s</div>
                  <div className="text-xs text-slate-400">Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DesktopFrame = ({ question, settings, totalQuestions, currentIndex }: { question: Question; settings: any; totalQuestions: number; currentIndex: number }) => (
  <div className="w-full max-w-sm mx-auto">
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg shadow-slate-200/60">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border-b border-slate-200">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 mx-2 h-5 bg-white rounded-md border border-slate-200 flex items-center px-2">
          <span className="text-[8px] text-slate-400">engagelive.app/session</span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-6 min-h-[500px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {settings?.showLogo && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: settings.brandColor || "#6366f1" }}>
                <BarChart2 className="w-4 h-4 text-white" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 truncate max-w-[150px]">
                {settings?.title || "Live Session"}
              </h3>
              <p className="text-[9px] text-slate-400">Live session</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 border border-indigo-200">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[9px] font-bold text-indigo-600">Q {currentIndex + 1}</span>
          </div>
        </div>

        {totalQuestions > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-[9px] text-slate-400 mb-1.5">
              <FileText className="w-3 h-3" />
              <span>Question {currentIndex + 1} of {totalQuestions}</span>
            </div>
            <div className="h-0.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="text-center mb-4">
          <h2 className="text-base font-bold text-slate-900 mb-2 leading-snug">{question.title}</h2>
          {question.description && <p className="text-xs text-slate-500 mb-3">{question.description}</p>}
          <div className="flex items-center justify-center gap-4">
            {question.points !== undefined && (
              <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                <Star className="w-3 h-3 fill-amber-400" /> {question.points} pts
              </span>
            )}
            {question.timeLimit && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <Clock className="w-3 h-3" /> {question.timeLimit}s
              </span>
            )}
          </div>
        </div>

        <QuestionContent question={question} />

        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Total", value: totalQuestions },
            { label: "Points", value: question.points || 0 },
            { label: "Time", value: question.timeLimit ? `${question.timeLimit}s` : "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs font-bold text-slate-900">{value}</div>
              <div className="text-[9px] text-slate-400 uppercase tracking-widest">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export function PreviewPanel({ question, presentationSettings, questions, currentQuestionIndex }: PreviewPanelProps) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  const totalPoints = questions.reduce((s, q) => s + (q.points || 0), 0);
  const totalTime = questions.reduce((s, q) => s + (q.timeLimit || 0), 0);

  const defaultQuestion: Question = {
      id: "preview", type: "multiple-choice",
      title: "Add your first question to see it here",
      description: "Preview will appear once you add questions",
      points: 10, timeLimit: 30,
      options: [
          { id: "1", text: "Sample Option 1", isCorrect: false },
          { id: "2", text: "Sample Option 2", isCorrect: true },
          { id: "3", text: "Sample Option 3", isCorrect: false },
          { id: "4", text: "Sample Option 4", isCorrect: false },
      ],
      isVisible: false
  };

  const displayQuestion = question || defaultQuestion;
  const hasRealQuestion = !!question;

  return (
    <div className="h-full flex flex-col bg-slate-50">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Preview</span>
          {hasRealQuestion}
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
          {(["mobile", "desktop"] as const).map((d) => (
            <button key={d} onClick={() => setDevice(d)}
              className={`p-1.5 rounded-lg transition-all ${
                device === d
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "text-slate-400 hover:text-slate-700"
              }`}
              title={d === "mobile" ? "Mobile View" : "Desktop View"}
            >
              {d === "mobile" ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center p-6"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}>
        {!hasRealQuestion && questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 mx-auto shadow-sm">
              <Eye className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-500 mb-1">No Questions Yet</p>
            <p className="text-xs text-slate-400 max-w-[160px] leading-relaxed mb-5">
              Add questions to see how they'll appear to your audience
            </p>
            <div className="w-full max-w-[200px] p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Session Stats</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[{ label: "Questions", value: "0" }, { label: "Points", value: "0" }, { label: "Time", value: "0s" }].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl py-2 border border-slate-200">
                    <div className="text-sm font-black text-slate-900">{value}</div>
                    <div className="text-[8px] text-slate-400 uppercase tracking-widest mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : device === "mobile" ? (
          <PhoneFrame question={displayQuestion} settings={presentationSettings} totalQuestions={questions.length} currentIndex={currentQuestionIndex} />
        ) : (
          <DesktopFrame question={displayQuestion} settings={presentationSettings} totalQuestions={questions.length} currentIndex={currentQuestionIndex} />
        )}
      </div>
    </div>
  );
}