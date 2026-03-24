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

// Question type renderers (simplified versions from your PreviewPanel)
const MultipleChoiceRenderer = ({ options }: { options: any[] }) => (
  <div className="space-y-2.5">
    {options.map((opt) => (
      <button
        key={opt.id}
        className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 text-left transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
          <span className="text-xs text-slate-700">{opt.text}</span>
        </div>
      </button>
    ))}
  </div>
);

const OpenTextRenderer = () => (
  <div className="space-y-3">
    <textarea
      placeholder="Type your answer here..."
      className="w-full min-h-[90px] p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs resize-none focus:outline-none"
      disabled
    />
    <button className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-md shadow-indigo-200">
      Submit Response
    </button>
  </div>
);

const RatingRenderer = ({ question }: { question: Question }) => {
  const scale = { min: 1, max: question.scale?.max || 5 };
  const ratings = Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i);
  
  return (
    <div className="space-y-3">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${ratings.length}, minmax(0, 1fr))` }}>
        {ratings.map((rating) => (
          <button
            key={rating}
            className="w-10 h-10 rounded-xl border-2 border-slate-200 bg-white flex items-center justify-center hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
            disabled
          >
            <span className="text-base font-bold text-slate-600">{rating}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const getDisplayType = (q: Question) => {
  const t = q.type;
  if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "POLL", "multiple-choice"].includes(t)) return "multiple-choice";
  if (["OPEN_TEXT", "open-text"].includes(t)) return "open-text";
  if (["RATING", "rating-scale"].includes(t)) return "rating-scale";
  return "multiple-choice";
};

const QuestionContent = ({ question }: { question: Question }) => {
  const type = getDisplayType(question);
  const options = question.options || [];
  
  switch (type) {
    case "multiple-choice":
      return options.length > 0 ? <MultipleChoiceRenderer options={options} /> : <div className="text-center py-4 text-xs text-slate-400">No options added yet</div>;
    case "open-text":
      return <OpenTextRenderer />;
    case "rating-scale":
      return <RatingRenderer question={question} />;
    default:
      return <MultipleChoiceRenderer options={options} />;
  }
};

const PhoneFrame = ({ question, totalQuestions, currentIndex }: { question: Question; totalQuestions: number; currentIndex: number }) => (
  <div className="w-full max-w-[320px] mx-auto">
    <div className="relative border-gray-800 shadow-2xl overflow-hidden bg-white mx-auto rounded-[2rem] border-[10px]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 rounded-b-xl z-20" />
      <div className="w-full h-[600px] overflow-y-auto flex flex-col bg-white rounded-[1.5rem]">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Preview Mode</h3>
          <p className="text-xs text-slate-400">Question {currentIndex + 1} of {totalQuestions}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">{question?.title || "Untitled question"}</h2>
            {question?.description && <p className="text-sm text-slate-500 mb-3">{question.description}</p>}
            <QuestionContent question={question} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DesktopFrame = ({ question, totalQuestions, currentIndex }: { question: Question; totalQuestions: number; currentIndex: number }) => (
  <div className="w-full max-w-2xl mx-auto">
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 border-b border-slate-200">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 mx-2 h-6 bg-white rounded-md border border-slate-200 flex items-center px-2">
          <span className="text-[8px] text-slate-400">preview.engage.app</span>
        </div>
      </div>
      <div className="bg-white p-8">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Question {currentIndex + 1} of {totalQuestions}</h3>
          <div className="h-0.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-slate-900 mb-2">{question?.title || "Untitled question"}</h2>
        {question?.description && <p className="text-sm text-slate-500 mb-4">{question.description}</p>}
        <QuestionContent question={question} />
      </div>
    </div>
  </div>
);

export function PreviewModal({ isOpen, onClose, question, presentationSettings, questions, currentQuestionIndex }: PreviewModalProps) {
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Live Preview</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">See how your audience will experience this</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Device Toggle */}
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
              
              {/* Modal Content */}
              <div className="p-8 bg-slate-50 flex items-center justify-center min-h-[500px]">
                {device === "mobile" ? (
                  <PhoneFrame 
                    question={displayQuestion} 
                    totalQuestions={questions.length} 
                    currentIndex={currentQuestionIndex} 
                  />
                ) : (
                  <DesktopFrame 
                    question={displayQuestion} 
                    totalQuestions={questions.length} 
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