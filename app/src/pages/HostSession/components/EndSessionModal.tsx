// EndSessionModal.tsx
import React from 'react';
import AppIcon from '../../../components/AppIcon';
import { Button } from '../../../components/ui/button';

interface EndSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onViewResults: () => void;
  isEnding?: boolean;
}

const EndSessionModal: React.FC<EndSessionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isEnding = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card border-2 border-border rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md p-6 md:p-8">
        {/* Drag handle for mobile sheet feel */}
        <div className="flex justify-center mb-4 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="text-center mb-6">
          <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <AppIcon name="AlertCircle" size={32} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
            End Presentation?
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
            This will close the session for all participants. You can view the results afterwards.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="destructive"
            icon="X"
            iconPosition="left"
            onClick={onConfirm}
            className="w-full"
            disabled={isEnding}
          >
            {isEnding ? (
              <>
                <AppIcon name="Loader2" size={16} className="animate-spin mr-2" />
                Ending...
              </>
            ) : (
              "End Session"
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full"
            disabled={isEnding}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EndSessionModal;