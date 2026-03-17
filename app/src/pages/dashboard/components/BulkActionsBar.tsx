import React from 'react';
import { Button } from '../../../components/ui/button';
import { CheckSquare, Download, Trash2, X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onExport: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onExport,
  onDelete,
  onClearSelection
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl">
      <div className="bg-primary text-primary-foreground rounded-xl shadow-2xl border border-primary-foreground/10 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {selectedCount} {selectedCount === 1 ? 'context' : 'contexts'} selected
              </p>
              <p className="text-xs opacity-80">Choose an action to apply</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon="Download"
              iconPosition="left"
              onClick={onExport}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon="Trash2"
              iconPosition="left"
              onClick={onDelete}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              Delete
            </Button>
            <button
              onClick={onClearSelection}
              className="w-8 h-8 rounded-lg hover:bg-primary-foreground/10 flex items-center justify-center transition-colors duration-150"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;