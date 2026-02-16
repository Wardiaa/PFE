import React from 'react';
import AppIcon from '../../../components/AppIcon';
import { Button } from '../../../components/ui/button';

interface PauseOverlayProps {
  onResume: () => void;
}

const PauseOverlay: React.FC<PauseOverlayProps> = ({ onResume }) => {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
          <AppIcon name="Pause" size={48} />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Presentation Paused
        </h2>
        <p className="text-base md:text-lg text-muted-foreground mb-8">
          Take your time for discussion. Resume when ready to continue.
        </p>
        <Button
          variant="default"
          size="lg"
          icon="Play"
          iconPosition="left"
          onClick={onResume}
        >
          Resume Presentation
        </Button>
      </div>
    </div>
  );
};

export default PauseOverlay;