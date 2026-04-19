import React from 'react';
import AppIcon from '../../../components/AppIcon';
import { Button } from '../../../components/ui/button';

interface PauseOverlayProps {
  onResume: () => void;
}

const PauseOverlay: React.FC<PauseOverlayProps> = ({ onResume }) => {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="text-center max-w-xs sm:max-w-sm md:max-w-md w-full">
        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
          <AppIcon name="Pause" size={36} className="sm:hidden" />
          <AppIcon name="Pause" size={48} className="hidden sm:block" />
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
          Presentation Paused
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 md:mb-8 px-2">
          Take your time for discussion. Resume when ready to continue.
        </p>
        <Button
          variant="default"
          size="lg"
          icon="Play"
          iconPosition="left"
          onClick={onResume}
          className="w-full sm:w-auto"
        >
          Resume Presentation
        </Button>
      </div>
    </div>
  );
};

export default PauseOverlay;
