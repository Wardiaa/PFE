import React, { useState } from 'react';
import Button from '../../../components/ui/Button2';
import AppIcon from '../../../components/AppIcon';

interface Option {
  id: string;
  text: string;
}

interface Question {
  text: string;
  description?: string;
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

  const handleOptionSelect = (optionId: string): void => {
    if (!isSubmitting) {
      setSelectedOption(optionId);
    }
  };

  const handleSubmit = (): void => {
    if (selectedOption === null) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({ optionId: selectedOption });
    }, 500);
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
        </div>

        <div className="space-y-3 mb-6 md:mb-8">
          {question?.options?.map((option) => (
            <button
              key={option?.id}
              onClick={() => handleOptionSelect(option?.id)}
              disabled={isSubmitting}
              className={`w-full min-h-[56px] md:min-h-[64px] px-4 md:px-6 py-3 md:py-4 rounded-xl border-2 transition-all duration-250 text-left ${
                selectedOption === option?.id
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border bg-background hover:border-primary/50 hover:bg-muted'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div
                  className={`flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full border-2 transition-all duration-250 flex items-center justify-center ${
                    selectedOption === option?.id
                      ? 'border-primary bg-primary' 
                      : 'border-muted-foreground/30'
                  }`}
                >
                  {selectedOption === option?.id && (
                    <AppIcon name="Check" size={12} className="text-white" />
                  )}
                </div>
                <span className="text-base md:text-lg font-medium text-foreground flex-1">
                  {option?.text}
                </span>
              </div>
            </button>
          ))}
        </div>

        <Button
          variant="default"
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={selectedOption === null}
          loading={isSubmitting}
          iconName="Send"
          iconPosition="right"
        >
          Submit Answer
        </Button>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <AppIcon name="Users" size={16} className="text-muted-foreground" />
          <span>{question?.responseCount} participants have responded</span>
        </div>
      </div>
    </div>
  );
};

export default MultipleChoiceQuestion;