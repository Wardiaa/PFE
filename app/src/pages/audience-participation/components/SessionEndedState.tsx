import React from 'react';
import Button from '../../../components/ui/Button2';
import AppIcon from '../../../components/AppIcon';

interface SessionEndedStateProps {
  onJoinNew: () => void;
}

const SessionEndedState: React.FC<SessionEndedStateProps> = ({ onJoinNew }) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card rounded-xl p-8 md:p-10 lg:p-12 shadow-lg border border-border text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-linear-to-br from-primary/20 to-secondary/20">
            <AppIcon name="CheckCircle2" size={48} color="var(--color-primary)" />
          </div>
        </div>

        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-3">
          Session Ended
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mb-8">
          Thank you for participating! The presenter has ended this session.
        </p>

        <div className="space-y-4">
          <Button
            variant="default"
            size="lg"
            fullWidth
            onClick={onJoinNew}
            iconName="Plus"
            iconPosition="left"
          >
            Join Another Session
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs md:text-sm text-muted-foreground">
            Your responses have been recorded and will be included in the presenter's results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionEndedState;