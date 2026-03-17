import React from 'react';
import { Button } from '../../../components/ui/button';
import { AlertTriangle, Info, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ count, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-4 md:p-5 lg:p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
                Delete {count === 1 ? 'Context' : 'Contexts'}?
              </h3>
              <p className="text-sm text-muted-foreground">
                {count === 1 
                  ? 'This context will be permanently deleted. This action cannot be undone.'
                  : `${count} contexts will be permanently deleted. This action cannot be undone.`
                }
              </p>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">What will be deleted:</p>
                <ul className="space-y-1">
                  <li>• All questions and content</li>
                  <li>• Session history and analytics</li>
                  <li>• Participant responses</li>
                  <li>• Shared links and permissions</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              icon="Trash2"
              iconPosition="left"
              onClick={onConfirm}
              className="flex-1"
            >
              Delete {count > 1 ? `(${count})` : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;