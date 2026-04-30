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
  image?: string | null;
  imageUrl?: string | null;
  scale?: Scale;
  labels?: Labels;
  responseCount?: number;
  displayStyle?: 'numbers' | 'stars' | 'hearts' | 'smileys';
}

interface RatingScaleQuestionProps {
  question: Question;
  onSubmit: (response: { rating: number }) => void;
}

const RatingScaleQuestion: React.FC<RatingScaleQuestionProps> = ({ question, onSubmit }) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const questionImage = question?.image || question?.imageUrl;

  // Min is fixed at 1, max is adjustable
  const scale = {
    min: 1,
    max: question?.scale?.max || 5
  };

  const ratings = Array.from(
    { length: scale.max - scale.min + 1 },
    (_, i) => scale.min + i
  );

  const displayStyle = question?.displayStyle || 'numbers';

  const handleRatingSelect = (rating: number): void => {
    if (!isSubmitting) {
      setSelectedRating(rating);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (selectedRating === null) return;
    setIsSubmitting(true);
    try {
      await Promise.resolve(onSubmit({ rating: selectedRating }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingColor = (rating: number): string => {
    const percentage = ((rating - scale.min) / (scale.max - scale.min)) * 100;
    if (percentage <= 33) return 'hsl(var(--destructive))';
    if (percentage <= 66) return 'hsl(var(--warning, 45 95% 60%))';
    return 'hsl(var(--success, 160 70% 50%))';
  };

  const renderRatingButton = (rating: number) => {
    const isSelected = selectedRating === rating;
    const isHovered = hoveredRating === rating;

    const baseClass = `w-10 h-10 md:w-12 md:h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-250 ${
      isSelected
        ? 'border-primary bg-primary shadow-lg scale-105'
        : isHovered
        ? 'border-primary/70 bg-primary/10 scale-105 shadow-md'
        : 'border-border bg-background hover:border-primary/50 hover:bg-muted hover:scale-102'
    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;

    if (displayStyle === 'stars') {
      return (
        <button
          key={rating}
          onClick={() => handleRatingSelect(rating)}
          onMouseEnter={() => setHoveredRating(rating)}
          onMouseLeave={() => setHoveredRating(null)}
          disabled={isSubmitting}
          className={baseClass}
        >
          <AppIcon
            name="Star"
            size={16}
            color={isSelected ? 'hsl(var(--primary-foreground))' : 'currentColor'}
            className={isSelected ? '' : 'text-amber-400 fill-amber-400'}
          />
        </button>
      );
    }

    if (displayStyle === 'hearts') {
      return (
        <button
          key={rating}
          onClick={() => handleRatingSelect(rating)}
          onMouseEnter={() => setHoveredRating(rating)}
          onMouseLeave={() => setHoveredRating(null)}
          disabled={isSubmitting}
          className={baseClass}
        >
          <AppIcon
            name="Heart"
            size={16}
            color={isSelected ? 'hsl(var(--primary-foreground))' : 'currentColor'}
            className={isSelected ? '' : 'text-rose-400 fill-rose-400'}
          />
        </button>
      );
    }

    if (displayStyle === 'smileys') {
      return (
        <button
          key={rating}
          onClick={() => handleRatingSelect(rating)}
          onMouseEnter={() => setHoveredRating(rating)}
          onMouseLeave={() => setHoveredRating(null)}
          disabled={isSubmitting}
          className={baseClass}
        >
          <AppIcon
            name="Smile"
            size={16}
            color={isSelected ? 'hsl(var(--primary-foreground))' : 'currentColor'}
            className={isSelected ? '' : 'text-yellow-500'}
          />
        </button>
      );
    }

    // Default: numbers
    return (
      <button
        key={rating}
        onClick={() => handleRatingSelect(rating)}
        onMouseEnter={() => setHoveredRating(rating)}
        onMouseLeave={() => setHoveredRating(null)}
        disabled={isSubmitting}
        className={baseClass}
      >
        <span
          className="text-base md:text-lg font-bold"
          style={{
            color: isSelected
              ? 'hsl(var(--primary-foreground))'
              : isHovered
              ? 'hsl(var(--primary))'
              : getRatingColor(rating),
          }}
        >
          {rating}
        </span>
      </button>
    );
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

        <div className="mb-8">
          <div className="grid gap-2 md:gap-3" style={{ gridTemplateColumns: `repeat(${ratings.length}, minmax(0, 1fr))` }}>
            {ratings.map((rating) => renderRatingButton(rating))}
          </div>

          <div className="flex items-center justify-between mt-3 px-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            <span>{question?.labels?.min || 'Low'}</span>
            <span>{question?.labels?.max || 'High'}</span>
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
