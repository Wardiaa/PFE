// VoteQuestion.tsx — Participant view for voting questions
// Participants select one option to vote for. Simple and mobile-friendly.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, Vote as VoteIcon } from "lucide-react";

interface VoteOption {
  id: string;
  text: string;
  imageUrl?: string | null;
}

interface VoteQuestionProps {
  question: {
    text: string;
    description?: string;
    image?: string | null;
    imageUrl?: string | null;
    options: VoteOption[];
  };
  onSubmit: (response: { optionId: string }) => void;
  isSubmitting?: boolean;
}

const VoteQuestion: React.FC<VoteQuestionProps> = ({ question, onSubmit, isSubmitting = false }) => {
  const options: VoteOption[] = question.options ?? [];
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const questionImage = question?.image || question?.imageUrl;

  const isImageOnlyOption = (option: VoteOption): boolean => {
    const hasImage = !!option.imageUrl;
    const hasNoText = !option.text || option.text.trim() === '';
    return hasImage && hasNoText;
  };

  const handleOptionSelect = (optionId: string) => {
    if (!isSubmitting && !hasSubmitted) {
      setSelectedOptionId(optionId);
    }
  };

  const handleSubmit = async () => {
    if (selectedOptionId === null) return;
    if (hasSubmitted) return;
    
    setHasSubmitted(true);
    
    try {
      await onSubmit({ optionId: selectedOptionId });
    } catch (error) {
      console.error("Vote submission failed:", error);
      setHasSubmitted(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card rounded-xl p-6 md:p-8 lg:p-10 shadow-lg border border-border">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <VoteIcon size={18} className="text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Vote
            </span>
          </div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
            {question.text}
          </h2>
          {question.description && (
            <p className="mt-3 text-sm md:text-base text-muted-foreground">
              {question.description}
            </p>
          )}
          {questionImage && (
            <div className="mt-5 rounded-xl border border-border bg-muted/30 flex justify-center p-2">
              <img
                src={questionImage}
                alt="Question visual"
                className="block w-auto max-w-full h-auto max-h-[420px] object-contain mx-auto rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 md:mb-8">
          {options.map((option) => {
            const imageOnly = isImageOnlyOption(option);
            const isSelected = selectedOptionId === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                disabled={isSubmitting || hasSubmitted}
                className={`text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                    : 'border-border bg-background hover:border-primary/50 hover:bg-muted'
                } ${isSubmitting || hasSubmitted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                  imageOnly ? 'rounded-xl border-2 overflow-hidden p-0' : 'rounded-xl border-2 p-4 md:p-5'
                }`}
              >
                {imageOnly ? (
                  // Image-only option - show full image
                  <div className="relative w-full">
                    <img
                      src={option.imageUrl || ''}
                      alt=""
                      className="w-full h-auto object-contain max-h-32"
                    />
                    <div
                      className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 bg-white/90 ${
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2 size={14} className="text-white" />
                      )}
                    </div>
                  </div>
                ) : (
                  // Option with text
                  <>
                    <div className="flex items-start gap-3 md:gap-4">
                      <div
                        className={`flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center mt-0.5 ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/30'
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle2 size={12} className="text-white" />
                        )}
                      </div>
                      <span className="text-sm md:text-base lg:text-lg font-medium text-foreground flex-1 leading-snug">
                        {option.text}
                      </span>
                    </div>

                    {option.imageUrl && (
                      <div className="mt-3 ml-8 md:ml-10 overflow-hidden rounded-lg border border-border bg-muted/30">
                        <img
                          src={option.imageUrl}
                          alt=""
                          className="w-full max-h-28 md:max-h-32 object-contain"
                        />
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={hasSubmitted || isSubmitting || selectedOptionId === null}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
            hasSubmitted || isSubmitting || selectedOptionId === null
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md active:scale-[0.98]'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : hasSubmitted ? (
            <>
              <CheckCircle2 size={16} />
              Vote Recorded!
            </>
          ) : (
            <>
              <VoteIcon size={16} />
              Cast Vote
            </>
          )}
        </button>

        {!hasSubmitted && selectedOptionId && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Your vote is anonymous and will be counted in the final results.
          </p>
        )}
      </div>
    </div>
  );
};

export default VoteQuestion;