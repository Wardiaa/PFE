import React, { useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, SkipForward, RotateCcw } from "lucide-react";
import Button from "../../../components/ui/Button2";

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
  1: "Strongly disagree",
  2: "Disagree",
  3: "Neutral",
  4: "Agree",
  5: "Strongly agree",
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

  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // PRIORITY 2: Add hasSubmitted state to prevent double submissions
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const minLabel = question.labels?.min ?? "Strongly disagree";
  const maxLabel = question.labels?.max ?? "Strongly agree";

  const totalStatements = question.statements.length;
  const answeredCount = question.statements.filter(
    (s) => answers[s.id] !== undefined || skipped[s.id],
  ).length;
  const allAnswered = answeredCount === totalStatements;

  const handleSelect = (statementId: string, value: number) => {
    if (hasSubmitted) return; // Don't allow changes after submission
    setAnswers((prev) => ({ ...prev, [statementId]: value }));
    setSkipped((prev) => {
      const next = { ...prev };
      delete next[statementId];
      return next;
    });
  };

  const handleSkip = (statementId: string) => {
    if (hasSubmitted) return; // Don't allow changes after submission
    setSkipped((prev) => ({ ...prev, [statementId]: true }));
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[statementId];
      return next;
    });
  };

  // PRIORITY 2: Updated handleSubmit with guard clause and error recovery
  const handleSubmit = async () => {
    if (!allAnswered || isSubmitting) return;
    if (hasSubmitted) return; //  Guard against double submission

    const scalingAnswers: Record<string, number | null> = {};
    question.statements.forEach((s) => {
      scalingAnswers[s.id] = skipped[s.id] ? null : (answers[s.id] ?? null);
    });

    setHasSubmitted(true);
    setIsSubmitting(true);
    
    try {
      await onSubmit({ scalingAnswers });
      // Success - stay disabled
    } catch (error) {
      console.error("Submission failed:", error);
      // On error, re-enable so user can retry
      setHasSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-12">
      {/* Header Card */}
      <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden mb-6">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Rating Scales
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
            {question.text}
          </h2>

          {question.description && (
            <p className="mt-3 text-muted-foreground leading-relaxed italic">
              {question.description}
            </p>
          )}

          {question.image && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 rounded-2xl overflow-hidden border border-border shadow-sm bg-muted/20"
            >
              <img
                src={question.image}
                alt="Question"
                className="w-full h-auto max-h-64 object-contain mx-auto"
              />
            </motion.div>
          )}

          {/* Progress Header */}
          <div className="mt-8 flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-foreground">Progress</span>
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {answeredCount} of {totalStatements} statements rated
            </span>
          </div>
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-border/50">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/80"
              initial={{ width: 0 }}
              animate={{ width: `${(answeredCount / totalStatements) * 100}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.6 }}
            />
          </div>
        </div>
      </div>

      {/* Statements List */}
      <div className="space-y-4 px-1">
        {question.statements.map((statement, idx) => {
          const selectedValue = answers[statement.id];
          const isSkipped = skipped[statement.id];
          const isDone = selectedValue !== undefined || isSkipped;

          return (
            <motion.div
              key={statement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                isDone 
                  ? "border-primary/30 bg-card shadow-md" 
                  : "border-border bg-card/50"
              } ${hasSubmitted ? "opacity-70" : ""}`}
            >
              {/* Active Indicator Bar */}
              <div 
                className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300 ${
                  isSkipped ? "bg-muted" : isDone ? "bg-primary" : "bg-transparent"
                }`}
              />

              <div className="p-5 md:p-6">
                <div className="flex justify-between items-start gap-4 mb-6">
                  <div className="flex gap-3 min-w-0">
                    <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-muted text-[11px] font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <h3 className={`text-base md:text-lg font-bold leading-snug transition-opacity ${isSkipped ? "opacity-40 line-through" : "opacity-100"}`}>
                      {statement.text}
                    </h3>
                  </div>

                  {!hasSubmitted && ( // Only show skip/undo if not submitted
                    isSkipped ? (
                      <button
                        onClick={() => {
                          setSkipped((prev) => {
                            const next = { ...prev };
                            delete next[statement.id];
                            return next;
                          });
                        }}
                        className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors group"
                      >
                        <RotateCcw className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                        Undo
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSkip(statement.id)}
                        className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors group"
                      >
                        <SkipForward className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        Skip
                      </button>
                    )
                  )}
                </div>

                {!isSkipped && !hasSubmitted ? (
                  <div className="space-y-6">
                    {/* Visual Button Row */}
                    <div className="relative pt-2 pb-2">
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2" />
                      <div className="relative flex justify-between">
                        {steps.map((step) => {
                          const isSelected = selectedValue === step;

                          return (
                            <button
                              key={step}
                              onClick={() => handleSelect(statement.id, step)}
                              className="relative z-10 group focus:outline-none"
                              disabled={hasSubmitted}
                            >
                              <div
                                className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center transition-colors duration-150 ${
                                  isSelected 
                                    ? "bg-slate-700 border-slate-700 text-white" 
                                    : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                                }`}
                              >
                                <span className="text-sm md:text-base font-black tabular-nums">{step}</span>
                              </div>

                              {/* Hover label (tooltip) */}
                              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-muted-foreground pointer-events-none">
                                {SCALE_LABELS[step] ?? ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Scale Footers */}
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground max-w-[80px]">
                        {minLabel}
                      </span>

                      {selectedValue != null && (
                        <div className="bg-muted/50 px-3 py-1 rounded-full border border-border">
                          <span className="text-xs font-extrabold uppercase tracking-tight text-slate-700 dark:text-slate-300">
                            {SCALE_LABELS[selectedValue as keyof typeof SCALE_LABELS] ?? selectedValue}
                          </span>
                        </div>
                      )}

                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right max-w-[80px]">
                        {maxLabel}
                      </span>
                    </div>
                  </div>
                ) : !hasSubmitted && isSkipped ? (
                  <div className="flex flex-col items-center justify-center py-4 bg-muted/30 rounded-xl">
                    <span className="text-sm font-medium text-muted-foreground">This item was skipped</span>
                  </div>
                ) : hasSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-4 bg-primary/5 rounded-xl">
                    <span className="text-sm font-medium text-foreground">Response submitted</span>
                  </div>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Unified Button Component */}
      <div className="mt-10 px-1">
        <Button
          variant="default"
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={hasSubmitted || !allAnswered || isSubmitting} // 👈 Updated disabled condition
          loading={isSubmitting}
          iconName="Send"
          iconPosition="right"
        >
          {hasSubmitted ? "Submitted!" : allAnswered ? "Submit All Ratings" : `Rated ${answeredCount} of ${totalStatements}`}
        </Button>
        {!allAnswered && !hasSubmitted && (
          <p className="mt-3 text-center text-xs font-semibold text-muted-foreground">
             Please provide a rating or skip for every statement to continue.
          </p>
        )}
      </div>
    </div>
  );
};

export default ScalingQuestion;