import React, { useState } from 'react';
import Button from '../../../components/ui/Button2';
import AppIcon from '../../../components/AppIcon';

interface Scale {
  min: number;
  max: number;
}

interface Labels {
  min?: string;
  max?: string;
}

interface Question {
  text: string;
  description?: string;
  scale?: Scale;
  labels?: Labels;
  responseCount?: number;
}

interface RatingScaleQuestionProps {
  question: Question;
  onSubmit: (response: { rating: number }) => void;
}

const RatingScaleQuestion: React.FC<RatingScaleQuestionProps> = ({ question, onSubmit }) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const scale = question?.scale || { min: 1, max: 5 };
  const ratings = Array.from(
    { length: scale?.max - scale?.min + 1 },
    (_, i) => scale?.min + i
  );

  const handleRatingSelect = (rating: number): void => {
    if (!isSubmitting) {
      setSelectedRating(rating);
    }
  };

  const handleSubmit = (): void => {
    if (selectedRating === null) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({ rating: selectedRating });
    }, 500);
  };

  const getRatingColor = (rating: number): string => {
    const percentage = ((rating - scale?.min) / (scale?.max - scale?.min)) * 100;
    if (percentage <= 33) return 'hsl(var(--destructive))';
    if (percentage <= 66) return 'hsl(var(--warning, 45 95% 60%))';
    return 'hsl(var(--success, 160 70% 50%))';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card rounded-xl p-6 md:p-8 lg:p-10 shadow-lg border border-border">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10">
              <AppIcon name="Star" size={18} color="var(--color-accent)" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Rating Scale
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

        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs md:text-sm font-medium text-muted-foreground">
              {question?.labels?.min || 'Low'}
            </span>
            <span className="text-xs md:text-sm font-medium text-muted-foreground">
              {question?.labels?.max || 'High'}
            </span>
          </div>

          <div className="grid gap-2 md:gap-3" style={{ gridTemplateColumns: `repeat(${ratings?.length}, minmax(0, 1fr))` }}>
            {ratings?.map((rating) => (
              <button
                key={rating}
                onClick={() => handleRatingSelect(rating)}
                disabled={isSubmitting}
                className={`aspect-square min-h-[56px] md:min-h-[72px] rounded-xl border-2 transition-all duration-250 flex flex-col items-center justify-center gap-1 ${
                  selectedRating === rating
                    ? 'border-primary bg-primary shadow-lg scale-105'
                    : 'border-border bg-background hover:border-primary/50 hover:bg-muted hover:scale-102'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className="text-2xl md:text-3xl lg:text-4xl font-bold transition-colors duration-250"
                  style={{
                    color: selectedRating === rating 
                      ? 'hsl(var(--primary-foreground))' 
                      : getRatingColor(rating)
                  }}
                >
                  {rating}
                </span>
              </button>
            ))}
          </div>

          {selectedRating !== null && (
            <div className="mt-4 text-center">
              <p className="text-sm md:text-base text-muted-foreground">
                You selected: <span className="font-semibold text-foreground">{selectedRating}</span>
              </p>
            </div>
          )}
        </div>

        <Button
          variant="default"
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={selectedRating === null}
          loading={isSubmitting}
          iconName="Send"
          iconPosition="right"
        >
          Submit Rating
        </Button>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <AppIcon name="Users" size={16} className="text-muted-foreground" />
          <span>{question?.responseCount} participants have responded</span>
        </div>
      </div>
    </div>
  );
};

export default RatingScaleQuestion;