import React, { useState } from 'react';
import Button from '../../../components/ui/Button2';
import AppIcon from '../../../components/AppIcon';

interface Question {
  text: string;
  description?: string;
  image?: string | null;
  imageUrl?: string | null;
  maxWords?: number;
  responseCount?: number;
}

interface WordCloudQuestionProps {
  question: Question;
  onSubmit: (response: { words: string[] }) => void;
}

const WordCloudQuestion: React.FC<WordCloudQuestionProps> = ({ question, onSubmit }) => {
  const [words, setWords] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const questionImage = question?.image || question?.imageUrl;

  const maxWords = question?.maxWords || 5;
  const wordArray = words?.trim()?.split(/\s+/)?.filter(word => word?.length > 0);
  const remainingWords = maxWords - wordArray?.length;

  const handleSubmit = (): void => {
    if (wordArray?.length === 0) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({ words: wordArray });
    }, 500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e?.target?.value;
    const newWordArray = value?.trim()?.split(/\s+/)?.filter(word => word?.length > 0);
    
    if (newWordArray?.length <= maxWords) {
      setWords(value);
    }
  };

  const removeWord = (index: number): void => {
    const newWordArray = [...wordArray];
    newWordArray?.splice(index, 1);
    setWords(newWordArray?.join(' '));
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card rounded-xl p-6 md:p-8 lg:p-10 shadow-lg border border-border">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-success/10">
              <AppIcon name="Cloud" size={18} color="hsl(var(--success))" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Word Cloud
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
            <div className="mt-5 overflow-hidden rounded-xl border border-border bg-muted/30 flex justify-center">
              <img
                src={questionImage}
                alt="Question visual"
                className="w-full max-h-[360px] object-contain"
              />
            </div>
          )}
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={words}
            onChange={handleChange}
            placeholder="Type words separated by spaces..."
            disabled={isSubmitting}
            className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-250 text-base md:text-lg"
          />
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-xs md:text-sm text-muted-foreground">
              Press space to add multiple words
            </span>
            <span
              className={`text-xs md:text-sm font-medium ${
                remainingWords <= 2
                  ? 'text-warning'
                  : remainingWords === 0
                  ? 'text-destructive' 
                  : 'text-muted-foreground'
              }`}
            >
              {remainingWords} words remaining
            </span>
          </div>
        </div>

        {wordArray?.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex flex-wrap gap-2">
              {wordArray?.map((word, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <span className="text-sm md:text-base font-medium text-foreground">
                    {word}
                  </span>
                  <button
                    onClick={() => removeWord(index)}
                    disabled={isSubmitting}
                    className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-destructive/10 transition-colors duration-250"
                    aria-label="Remove word"
                  >
                    <AppIcon name="X" size={14} color="var(--color-destructive)" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          variant="default"
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={wordArray?.length === 0}
          loading={isSubmitting}
          iconName="Send"
          iconPosition="right"
        >
          Submit Words
        </Button>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <AppIcon name="Users" size={16} color="var(--color-muted-foreground)" />
          <span>{question?.responseCount} participants have responded</span>
        </div>
      </div>
    </div>
  );
};

export default WordCloudQuestion;