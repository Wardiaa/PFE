import React from 'react';
import AppIcon from '../../../components/AppIcon';

interface SubmissionConfirmationProps {
  message?: string;
}

const SubmissionConfirmation: React.FC<SubmissionConfirmationProps> = ({ message }) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card rounded-xl p-8 md:p-10 lg:p-12 shadow-lg border border-border text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-success/10 animate-scale-in">
            <AppIcon name="CheckCircle" size={48} color="hsl(var(--success))" />
          </div>
        </div>

        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-3">
          Response Submitted!
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mb-6">
          {message || 'Thank you for your participation. Your response has been recorded.'}
        </p>

        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <AppIcon name="Clock" size={18} color="var(--color-muted-foreground)" />
            <span>Waiting for next question...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionConfirmation;