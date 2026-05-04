// src/pages/audience-participation/components/ScalingQuestion.tsx
// Audience-side Scaling question — Mentimeter-style sliders per statement.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, SkipForward, Send, CheckCircle2 } from "lucide-react";

interface ScalingStatement {
  id: string;
  text: string;
}

interface Scale {
  min: number;
  max: number;
}

interface Labels {
  min?: string;
  max?: string;
}

interface ScalingQuestionProps {
  question: {
    text: string;
    description?: string;
    image?: string | null;
    statements: ScalingStatement[];
    scale?: Scale;
    labels?: Labels;
    responseCount?: number;
  };
  onSubmit: (response: { scalingAnswers: Record<string, number | null> }) => void;
}

const SCALE_LABELS: Record<number, string> = {
  1: "Strongly\ndisagree",
  2: "Disagree",
  3: "Neither",
  4: "Agree",
  5: "Strongly\nagree",
};

const SCALE_COLORS: Record<number, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#22c55e",
  5: "#10b981",
};

const ScalingQuestion: React.FC<ScalingQuestionProps> = ({ question, onSubmit }) => {
  const scale = {
    min: question.scale?.min ?? 1,
    max: question.scale?.max ?? 5,
  };

  const steps = Array.from(
    { length: scale.max - scale.min + 1 },
    (_, i) => scale.min + i,
  );

  // answers: null = not answered, undefined = not touched yet
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minLabel = question.labels?.min ?? "Strongly disagree";
  const maxLabel = question.labels?.max ?? "Strongly agree";
  const questionImage = question.image;

  const totalStatements = question.statements.length;
  const answeredCount = question.statements.filter(
    (s) => answers[s.id] !== undefined || skipped[s.id],
  ).length;
  const allAnswered = answeredCount === totalStatements;

  const handleSelect = (statementId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [statementId]: value }));
    setSkipped((prev) => {
      const next = { ...prev };
      delete next[statementId];
      return next;
    });
  };

  const handleSkip = (statementId: string) => {
    setSkipped((prev) => ({ ...prev, [statementId]: true }));
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[statementId];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!allAnswered || isSubmitting) return;

    const scalingAnswers: Record<string, number | null> = {};
    question.statements.forEach((s) => {
      scalingAnswers[s.id] = skipped[s.id] ? null : (answers[s.id] ?? null);
    });

    setIsSubmitting(true);
    try {
      await onSubmit({ scalingAnswers });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Scales
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-foreground leading-snug">
            {question.text}
          </h2>

          {question.description && (
            <p className="mt-2 text-sm text-muted-foreground">{question.description}</p>
          )}

          {questionImage && (
            <div className="mt-4 rounded-xl border border-border bg-muted/30 flex justify-center p-2">
              <img
                src={questionImage}
                alt="Question visual"
                className="block w-auto max-w-full h-auto max-h-48 object-contain rounded-lg"
              />
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-teal-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(answeredCount / totalStatements) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {answeredCount}/{totalStatements}
            </span>
          </div>
        </div>

        {/* Statements */}
        <div className="px-6 py-4 space-y-5">
          {question.statements.map((statement, idx) => {
            const selectedValue = answers[statement.id];
            const isSkipped = skipped[statement.id];
            const isDone = selectedValue !== undefined || isSkipped;

            return (
              <motion.div
                key={statement.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className={`rounded-xl border-2 transition-colors duration-200 ${
                  isSkipped
                    ? "border-muted bg-muted/20"
                    : selectedValue !== undefined
                    ? "border-teal-200 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/10"
                    : "border-border bg-background"
                }`}
              >
                <div className="p-4">
                  {/* Statement text row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div
                        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 transition-colors ${
                          isDone
                            ? "bg-teal-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isDone ? (
                          isSkipped ? (
                            <span className="text-[9px]">–</span>
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <p
                        className={`text-sm font-medium leading-snug ${
                          isSkipped ? "text-muted-foreground line-through" : "text-foreground"
                        }`}
                      >
                        {statement.text}
                      </p>
                    </div>

                    {!isSkipped && (
                      <button
                        onClick={() => handleSkip(statement.id)}
                        className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
                      >
                        <SkipForward className="w-3 h-3" />
                        Skip
                      </button>
                    )}

                    {isSkipped && (
                      <button
                        onClick={() => {
                          setSkipped((prev) => {
                            const next = { ...prev };
                            delete next[statement.id];
                            return next;
                          });
                        }}
                        className="shrink-0 text-xs text-teal-600 hover:underline"
                      >
                        Undo
                      </button>
                    )}
                  </div>

                  {/* Slider dots */}
                  {!isSkipped && (
                    <div className="space-y-2">
                      {/* Dot row */}
                      <div className="relative">
                        {/* Track line */}
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 mx-5" />

                        <div className="relative flex justify-between items-center">
                          {steps.map((step) => {
                            const isSelected = selectedValue === step;
                            const color = SCALE_COLORS[step] ?? "#6366f1";

                            return (
                              <button
                                key={step}
                                onClick={() => handleSelect(statement.id, step)}
                                style={
                                  isSelected
                                    ? { backgroundColor: color, borderColor: color }
                                    : {}
                                }
                                className={`relative z-10 flex flex-col items-center transition-all duration-150 ${
                                  isSelected ? "scale-125" : "hover:scale-110"
                                }`}
                              >
                                <div
                                  style={
                                    isSelected
                                      ? { backgroundColor: color, boxShadow: `0 0 0 4px ${color}25` }
                                      : {}
                                  }
                                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-150 ${
                                    isSelected
                                      ? "text-white border-transparent shadow-md"
                                      : "bg-background border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                                  }`}
                                >
                                  {step}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Labels */}
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-medium text-muted-foreground max-w-[80px] leading-tight">
                          {minLabel}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground max-w-[80px] text-right leading-tight">
                          {maxLabel}
                        </span>
                      </div>

                      {/* Selected label display */}
                      <AnimatePresence>
                        {selectedValue != null && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-center"
                          >
                            {(() => {
                              const val = selectedValue as number;
                              return (
                                <span
                                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: `${SCALE_COLORS[val] ?? "#6366f1"}18`,
                                    color: SCALE_COLORS[val] ?? "#6366f1",
                                  }}
                                >
                                  {SCALE_LABELS[val] ?? val}
                                </span>
                              );
                            })()}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {isSkipped && (
                    <div className="text-xs text-muted-foreground italic text-center py-1">
                      This statement was skipped
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Submit footer */}
        <div className="px-6 pb-6">
          <motion.button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
            whileTap={allAnswered && !isSubmitting ? { scale: 0.97 } : {}}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${
              allAnswered && !isSubmitting
                ? "bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                {allAnswered ? "Submit Ratings" : `Answer all statements (${answeredCount}/${totalStatements})`}
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ScalingQuestion;
