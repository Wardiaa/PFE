import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Trash2, X, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ 
  count, 
  onConfirm, 
  onCancel,
  isDeleting = false 
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger the enter animation on mount
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleCancel = () => {
    if (isDeleting) return; // Prevent closing while deleting
    setVisible(false);
    setTimeout(onCancel, 220);
  };

  return (
    <>
      <style>{`
        @keyframes dmBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes dmBackdropOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes dmCardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes dmCardOut {
          from { opacity: 1; transform: translateY(0)    scale(1); }
          to   { opacity: 0; transform: translateY(12px) scale(0.97); }
        }
        .dm-backdrop-enter { animation: dmBackdropIn  200ms ease forwards; }
        .dm-backdrop-exit  { animation: dmBackdropOut 220ms ease forwards; }
        .dm-card-enter     { animation: dmCardIn  220ms cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .dm-card-exit      { animation: dmCardOut 200ms ease forwards; }
      `}</style>

      <div
        className={`fixed inset-0 z-[200] flex items-center justify-center p-4 ${
          visible ? 'dm-backdrop-enter' : 'dm-backdrop-exit'
        }`}
        style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        onClick={handleCancel}
      >
        <div
          className={`relative w-full max-w-sm ${visible ? 'dm-card-enter' : 'dm-card-exit'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Card */}
          <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
            {/* Red top strip */}
            <div className="h-1 w-full bg-destructive" />

            <div className="p-6">
              {/* Close button */}
              <button
                onClick={handleCancel}
                disabled={isDeleting}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-5">
                {isDeleting ? (
                  <Loader2 className="h-6 w-6 text-destructive animate-spin" />
                ) : (
                  <Trash2 className="h-6 w-6 text-destructive" />
                )}
              </div>

              {/* Heading */}
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {isDeleting 
                  ? 'Deleting...' 
                  : `Delete ${count === 1 ? 'this context' : `${count} contexts`}?`
                }
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {isDeleting ? (
                  'Please wait while we delete your content...'
                ) : count === 1 ? (
                  'This will permanently remove all questions, sessions, and responses. You cannot undo this.'
                ) : (
                  `All ${count} selected contexts — including their questions, sessions, and responses — will be permanently removed.`
                )}
              </p>

              {/* What gets deleted - hide during deletion */}
              {!isDeleting && (
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {['Questions & content', 'Session history', 'Participant responses', 'Shared links'].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive/60 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleCancel} 
                  className="flex-1"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Cancelling...' : 'Keep it'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={onConfirm}
                  className="flex-1 gap-2"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete{count > 1 ? ` (${count})` : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteConfirmModal;