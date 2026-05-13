import React, { useState } from 'react';
import Button from '../../../components/ui/Button2';
import AppIcon from '../../../components/AppIcon';

interface Question {
  text: string;
  description?: string;
  image?: string | null;
  imageUrl?: string | null;
  maxLength?: number;
  minLength?: number;
  responseCount?: number;
}

interface OpenTextQuestionProps {
  question: Question;
  onSubmit: (response: { text: string }) => void;
}

const OpenTextQuestion: React.FC<OpenTextQuestionProps> = ({ question, onSubmit }) => {
  const [response, setResponse] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // PRIORITY 2: Add hasSubmitted state to prevent double submissions
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const questionImage = question?.image || question?.imageUrl;

  const maxLength = question?.maxLength || 500;
  const remainingChars = maxLength - response?.length;

  // PRIORITY 2: Updated handleSubmit with guard clause and error recovery
  const handleSubmit = async (): Promise<void> => {
    if (!response?.trim()) return;
    if (hasSubmitted) return; //  Guard against double submission
    
    setHasSubmitted(true);
    setIsSubmitting(true);
    
    try {
      await onSubmit({ text: response.trim() });
      // Success - stay disabled
    } catch (error) {
      console.error("Submission failed:", error);
      // On error, re-enable so user can retry
      setHasSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    if (hasSubmitted) return; // Don't allow changes after submission
    const value = e?.target?.value;
    if (value?.length <= maxLength) {
      setResponse(value);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card rounded-xl p-6 md:p-8 lg:p-10 shadow-lg border border-border">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/10">
              <AppIcon name="MessageSquare" size={18} color="hsl(var(--secondary-foreground))" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Open Response
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

        <div className="mb-6">
          <textarea
            value={response}
            onChange={handleChange}
            placeholder="Type your response here..."
            disabled={isSubmitting || hasSubmitted}
            className="w-full min-h-[160px] md:min-h-[200px] px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:!outline-none focus:!border-primary focus:!border-2 focus:!ring-0 resize-none transition-all duration-250 text-base md:text-lg"
          />
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-xs md:text-sm text-muted-foreground">
              {question?.minLength && `Minimum ${question?.minLength} characters`}
            </span>
            <span
              className={`text-xs md:text-sm font-medium ${
                remainingChars < 50
                  ? 'text-warning'
                  : remainingChars === 0
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              }`}
            >
              {remainingChars} characters remaining
            </span>
          </div>
        </div>

        <Button
          variant="default"
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={hasSubmitted || isSubmitting || !response?.trim() || (question?.minLength ? response?.trim()?.length < question?.minLength : false)} // 👈 Updated disabled condition
          loading={isSubmitting}
          iconName="Send"
          iconPosition="right"
        >
          Submit Response
        </Button>
      </div>
    </div>
  );
};

export default OpenTextQuestion;