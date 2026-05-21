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
  displayStyle?: 'stars' | 'numbers' | 'hearts' | 'smileys';
}

interface RatingScaleQuestionProps {
  question: Question;
  onSubmit: (response: { rating: number }) => void;
}

const RatingScaleQuestion: React.FC<RatingScaleQuestionProps> = ({ question, onSubmit }) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
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

  const handleRatingSelect = (rating: number): void => {
    if (!isSubmitting && !hasSubmitted) {
      setSelectedRating(rating);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (selectedRating === null) return;
    if (hasSubmitted) return;
    
    setHasSubmitted(true);
    setIsSubmitting(true);
    
    try {
      await onSubmit({ rating: selectedRating });
    } catch (error) {
      console.error("Submission failed:", error);
      setHasSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Star rendering helper
  const renderStars = (rating: number, isHovered: boolean, isSelected: boolean) => {
    const stars = [];
    for (let i = 1; i <= scale.max; i++) {
      const isFilled = i <= (hoveredRating !== null ? hoveredRating : selectedRating || 0);
      stars.push(
        <button
          key={i}
          onClick={() => handleRatingSelect(i)}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(null)}
          disabled={isSubmitting || hasSubmitted}
          className="focus:outline-none transition-transform duration-150 hover:scale-110"
        >
          <svg
            width={32}
            height={32}
            viewBox="0 0 24 24"
            fill={isFilled ? "#fbbf24" : "none"}
            stroke="#fbbf24"
            strokeWidth="1.5"
            className="transition-all duration-150"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      );
    }
    return stars;
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
          <div className="flex justify-center gap-2 flex-wrap">
            {ratings.map((rating) => (
              <button
                key={rating}
                onClick={() => handleRatingSelect(rating)}
                onMouseEnter={() => setHoveredRating(rating)}
                onMouseLeave={() => setHoveredRating(null)}
                disabled={isSubmitting || hasSubmitted}
                className="focus:outline-none transition-transform duration-150 hover:scale-110"
              >
                <svg
                  width={40}
                  height={40}
                  viewBox="0 0 24 24"
                  fill={
                    (hoveredRating !== null && rating <= hoveredRating) ||
                    (selectedRating !== null && rating <= selectedRating)
                      ? "#fbbf24"
                      : "none"
                  }
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  className="transition-all duration-150"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3 px-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            <span>{question?.labels?.min || 'Low'}</span>
            <span>{question?.labels?.max || 'High'}</span>
          </div>

          {selectedRating !== null && (
            <div className="mt-4 text-center">
              <p className="text-sm md:text-base text-muted-foreground">
                You selected: <span className="font-semibold text-foreground">{selectedRating} {selectedRating === 1 ? 'star' : 'stars'}</span>
              </p>
            </div>
          )}
        </div>

        <Button
          variant="default"
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={hasSubmitted || isSubmitting || selectedRating === null}
          loading={isSubmitting}
          iconName="Send"
          iconPosition="right"
        >
          Submit Rating
        </Button>
      </div>
    </div>
  );
};

export default RatingScaleQuestion;