import React, { useState } from 'react';
import Button from '../../../components/ui/Button2';
import AppIcon from '../../../components/AppIcon';

interface Question {
  text: string;
  description?: string;
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

  const maxLength = question?.maxLength || 500;
  const remainingChars = maxLength - response?.length;

  const handleSubmit = (): void => {
    if (!response?.trim()) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({ text: response?.trim() });
    }, 500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
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
        </div>

        <div className="mb-6">
          <textarea
            value={response}
            onChange={handleChange}
            placeholder="Type your response here..."
            disabled={isSubmitting}
            className="w-full min-h-[160px] md:min-h-[200px] px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none transition-all duration-250 text-base md:text-lg"
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
          disabled={!response?.trim() || (question?.minLength ? response?.trim()?.length < question?.minLength : false)}
          loading={isSubmitting}
          iconName="Send"
          iconPosition="right"
        >
          Submit Response
        </Button>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <AppIcon name="Users" size={16} color="var(--color-muted-foreground)" />
          <span>{question?.responseCount} participants have responded</span>
        </div>
      </div>
    </div>
  );
};

export default OpenTextQuestion;