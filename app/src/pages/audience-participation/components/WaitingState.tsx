import React from 'react';
import AppIcon from '../../../components/AppIcon';

interface WaitingStateProps {
  message?: string;
  showSpinner?: boolean;
}

const WaitingState: React.FC<WaitingStateProps> = ({ message, showSpinner = true }) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card rounded-xl p-8 md:p-10 lg:p-12 shadow-lg border border-border text-center">
        <div className="mb-6">
          {showSpinner ? (
            <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-linear-to-br from-primary/20 to-secondary/20  ">
              <AppIcon name="Loader2" size={40} color="var(--color-primary)" className="animate-spin" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-linear-to-br from-primary/20 to-secondary/20">
              <AppIcon name="Clock" size={40} color="var(--color-primary)" />
            </div>
          )}
        </div>

        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-3">
          {message || 'Please Wait'}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          The presenter will share the next question shortly
        </p>

        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <AppIcon name="Wifi" size={18} />
            <span>Connected to session</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingState;