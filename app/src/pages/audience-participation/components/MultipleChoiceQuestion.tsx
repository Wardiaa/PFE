import React, { useState } from 'react';
import Button from '../../../components/ui/Button2';
import AppIcon from '../../../components/AppIcon';

interface Option {
  id: string;
  text: string;
  imageUrl?: string | null;
}

interface Question {
  text: string;
  description?: string;
  image?: string | null;
  imageUrl?: string | null;
  options?: Option[];
  responseCount?: number;
}

interface MultipleChoiceQuestionProps {
  question: Question;
  onSubmit: (response: { optionId: string }) => void;
}

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({ question, onSubmit }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // PRIORITY 2: Add hasSubmitted state to prevent double submissions
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const questionImage = question?.image || question?.imageUrl;

  // Check if an option has only an image and no text
  const isImageOnlyOption = (option: Option): boolean => {
    // Check if imageUrl exists AND text is either undefined, null, or empty string
    const hasImage = !!option.imageUrl;
    const hasNoText = !option.text || option.text.trim() === '';
    return hasImage && hasNoText;
  };

  const handleOptionSelect = (optionId: string): void => {
    if (!isSubmitting && !hasSubmitted) {
      setSelectedOption(optionId);
    }
  };

  // PRIORITY 2: Updated handleSubmit with guard clause and error recovery
  const handleSubmit = async (): Promise<void> => {
    if (selectedOption === null) return;
    if (hasSubmitted) return; // Guard against double submission
    
    setHasSubmitted(true);
    setIsSubmitting(true);
    
    try {
      await onSubmit({ optionId: selectedOption });
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
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card rounded-xl p-6 md:p-8 lg:p-10 shadow-lg border border-border">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <AppIcon name="CheckSquare" size={18} color="hsl(var(--secondary-foreground))" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Multiple Choice
            </span>
          </div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
            {question?.text}
          </h2>
          {question?.description && (
            <p className="mt-3 text-sm md:text-base text-muted-foreground">
              {question?.description}
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

        {/* Grid layout: 2 columns for options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 md:mb-8">
          {question?.options?.map((option) => {
            const imageOnly = isImageOnlyOption(option);

            return (
              <button
                key={option?.id}
                onClick={() => handleOptionSelect(option?.id)}
                disabled={isSubmitting || hasSubmitted}
                className={`text-left transition-all duration-250 ${
                  selectedOption === option?.id
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border bg-background hover:border-primary/50 hover:bg-muted'
                } ${isSubmitting || hasSubmitted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                  imageOnly ? 'rounded-xl border-2 overflow-hidden p-0' : 'rounded-xl border-2 p-4 md:p-5'
                }`}
              >
                {imageOnly ? (
                  // Image-only option - show full image without padding
                  <div className="relative w-full">
                    <img
                      src={option.imageUrl || ''}
                      alt=""
                      className="w-full h-auto object-contain max-h-32"
                    />
                    <div
                      className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-250 bg-white/80 ${
                        selectedOption === option?.id
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {selectedOption === option?.id && (
                        <AppIcon name="Check" size={12} className="text-white" />
                      )}
                    </div>
                  </div>
                ) : (
                  // Option with text (may also have an image)
                  <>
                    <div className="flex items-start gap-3 md:gap-4">
                      <div
                        className={`flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full border-2 transition-all duration-250 flex items-center justify-center mt-0.5 ${
                          selectedOption === option?.id
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/30'
                        }`}
                      >
                        {selectedOption === option?.id && (
                          <AppIcon name="Check" size={12} className="text-white" />
                        )}
                      </div>
                      <span className="text-sm md:text-base lg:text-lg font-medium text-foreground flex-1 leading-snug">
                        {option?.text}
                      </span>
                    </div>

                    {option?.imageUrl && (
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

        <Button
          variant="default"
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={hasSubmitted || isSubmitting || selectedOption === null} // 👈 Updated disabled condition
          loading={isSubmitting}
          iconName="Send"
          iconPosition="right"
        >
          Submit Answer
        </Button>
      </div>
    </div>
  );
};

export default MultipleChoiceQuestion;