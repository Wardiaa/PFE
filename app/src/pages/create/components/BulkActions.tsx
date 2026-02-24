import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useToast } from "../../../hooks/use-toast";
import type { Question } from "../types";
import { 
  Copy, 
  Trash2, 
  Lock, 
  Shuffle, 
  Download, 
  Upload, 
  ChevronUp, 
  ChevronDown,
  ArrowUpToLine,
  ArrowDownToLine
} from "lucide-react";

interface BulkActionsProps {
  questions: Question[];
  onUpdateQuestions: (questions: Question[]) => void;
  selectedQuestions: number[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onReorderQuestions: (direction: 'up' | 'down' | 'top' | 'bottom') => void;
}

export function BulkActions({ 
  questions, 
  onUpdateQuestions, 
  selectedQuestions, 
  onSelectAll, 
  onClearSelection,
  onReorderQuestions 
}: BulkActionsProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);
  const [timeLimitValue, setTimeLimitValue] = useState(30);
  const [pointsValue, setPointsValue] = useState(10);
  
  const selectedQuestionsCount = selectedQuestions.length;
  const totalQuestionsCount = questions.length;

  const handleBulkAction = () => {
    if (!selectedQuestionsCount) return;
    
    let updatedQuestions = [...questions];

    switch (actionType) {
      case 'time':
        updatedQuestions = updatedQuestions.map((q, index) => 
          selectedQuestions.includes(index) ? { ...q, timeLimit: timeLimitValue } : q
        );
        break;
        
      case 'points':
        updatedQuestions = updatedQuestions.map((q, index) => 
          selectedQuestions.includes(index) ? { ...q, points: pointsValue } : q
        );
        break;
        
      case 'shuffle':
        updatedQuestions = updatedQuestions.map((q, index) => {
          if (selectedQuestions.includes(index) && q.options) {
            const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
            return { ...q, options: shuffledOptions };
          }
          return q;
        });
        break;
        
      case 'duplicate':
        const duplicates: Question[] = [];
        questions.forEach((q, index) => {
          if (selectedQuestions.includes(index)) {
            const duplicate: Question = {
              ...q,
              id: Date.now().toString() + index,
              title: `${q.title} (Copy)`
            };
            duplicates.push(duplicate);
          }
        });
        let newIndex = 0;
        selectedQuestions.forEach((originalIndex, idx) => {
          const insertPosition = originalIndex + idx + 1 + newIndex;
          updatedQuestions.splice(insertPosition, 0, duplicates[idx]);
          newIndex++;
        });
        break;
        
      case 'delete':
        if (!confirm(`Delete ${selectedQuestionsCount} question(s)?`)) return;
        updatedQuestions = questions.filter((_, index) => !selectedQuestions.includes(index));
        onClearSelection();
        break;
        
      case 'lock':
        updatedQuestions = updatedQuestions.map((q, index) => 
          selectedQuestions.includes(index) ? { ...q, locked: true } : q
        );
        break;
        
      case 'unlock':
        updatedQuestions = updatedQuestions.map((q, index) => 
          selectedQuestions.includes(index) ? { ...q, locked: false } : q
        );
        break;
        
      default:
        return;
    }
    
    onUpdateQuestions(updatedQuestions);
    setIsDialogOpen(false);
    setActionType(null);
  };

  const handleExportSelected = () => {
    if (!selectedQuestionsCount) return;
    
    const selectedQ = questions.filter((_, index) => selectedQuestions.includes(index));
    const data = JSON.stringify(selectedQ, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'selected-questions.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Exported",
      description: `${selectedQuestionsCount} questions exported`,
    });
  };

  const handleExportAll = () => {
    const data = JSON.stringify(questions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all-questions.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Exported",
      description: `${questions.length} questions exported`,
    });
  };

  const handleImportQuestions = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedQuestions = JSON.parse(content);
        
        if (Array.isArray(importedQuestions) && importedQuestions.length > 0) {
          const updatedQuestions = [...questions, ...importedQuestions];
          onUpdateQuestions(updatedQuestions);
          toast({
            title: "Imported",
            description: `${importedQuestions.length} questions imported`,
          });
        }
      } catch (error) {
        console.error('Failed to import questions:', error);
        toast({
          title: "Import failed",
          description: "Please check the file format",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const renderActionDialog = () => {
    if (!actionType) return null;

    const actionConfigs: Record<string, { title: string; content: React.ReactNode }> = {
      time: {
        title: 'Set Time Limit',
        content: (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Time Limit (seconds)</Label>
              <Input
                type="number"
                value={timeLimitValue}
                onChange={(e) => setTimeLimitValue(parseInt(e.target.value) || 30)}
                className="mt-1"
                min="5"
                max="300"
              />
            </div>
            <div className="flex gap-2">
              {[15, 30, 45, 60].map((time) => (
                <Button
                  key={time}
                  variant="outline"
                  size="sm"
                  onClick={() => setTimeLimitValue(time)}
                >
                  {time}s
                </Button>
              ))}
            </div>
          </div>
        )
      },
      points: {
        title: 'Set Points',
        content: (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Points per Question</Label>
              <Input
                type="number"
                value={pointsValue}
                onChange={(e) => setPointsValue(parseInt(e.target.value) || 10)}
                className="mt-1"
                min="0"
                max="100"
              />
            </div>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map((points) => (
                <Button
                  key={points}
                  variant="outline"
                  size="sm"
                  onClick={() => setPointsValue(points)}
                >
                  {points} pts
                </Button>
              ))}
            </div>
          </div>
        )
      },
      delete: {
        title: 'Delete Questions',
        content: (
          <div className="space-y-4">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="font-medium text-destructive">Warning: This action cannot be undone</p>
              <p className="text-sm text-destructive/80 mt-1">
                You are about to delete {selectedQuestionsCount} questions.
              </p>
            </div>
          </div>
        )
      },
      duplicate: {
        title: 'Duplicate Questions',
        content: (
          <div className="space-y-4">
            <p className="text-sm">
              This will create exact copies of {selectedQuestionsCount} selected questions.
            </p>
          </div>
        )
      },
      lock: {
        title: 'Lock Questions',
        content: (
          <div className="space-y-4">
            <p className="text-sm">
              Locking questions will prevent them from being edited accidentally.
            </p>
          </div>
        )
      },
      unlock: {
        title: 'Unlock Questions',
        content: (
          <div className="space-y-4">
            <p className="text-sm">
              Unlocking questions will allow them to be edited again.
            </p>
          </div>
        )
      },
      shuffle: {
        title: 'Shuffle Answers',
        content: (
          <div className="space-y-4">
            <p className="text-sm">
              This will randomize the order of answer options for each selected question.
            </p>
          </div>
        )
      }
    };

    const config = actionConfigs[actionType];
    if (!config) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">{config.title}</h3>
          {config.content}
          <div className="flex gap-2 justify-end mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setActionType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAction}
              variant={actionType === 'delete' ? 'destructive' : 'default'}
            >
              Apply to {selectedQuestionsCount} Questions
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Bulk Actions</h3>
        <span className="text-xs text-muted-foreground">
          {selectedQuestionsCount} of {totalQuestionsCount} selected
        </span>
      </div>

      {selectedQuestionsCount > 0 ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionType('duplicate');
                setIsDialogOpen(true);
              }}
              className="flex-1 bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionType('delete');
                setIsDialogOpen(true);
              }}
              className="flex-1 bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 hover:text-red-700 transition-all"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">Update Points for All Selected</Label>
            <div className="flex gap-3">
              {[5, 10, 15, 20].map(points => (
                <Button
                  key={points}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActionType('points');
                    setPointsValue(points);
                    setIsDialogOpen(true);
                  }}
                  className="flex-1 bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  {points}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">Update Time Limit (seconds)</Label>
            <div className="flex gap-3">
              {[15, 30, 45, 60].map(time => (
                <Button
                  key={time}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActionType('time');
                    setTimeLimitValue(time);
                    setIsDialogOpen(true);
                  }}
                  className="flex-1 bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  {time}s
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionType('lock');
                setIsDialogOpen(true);
              }}
              className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <Lock className="w-4 h-4 mr-2" />
              Lock
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionType('unlock');
                setIsDialogOpen(true);
              }}
              className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <Lock className="w-4 h-4 mr-2" />
              Unlock
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionType('shuffle');
                setIsDialogOpen(true);
              }}
              className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Shuffle Answers
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportSelected}
              className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Selected
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="grid grid-cols-4">
              <button
                onClick={() => onReorderQuestions('top')}
                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-r border-gray-100 dark:border-gray-700"
              >
                <ArrowUpToLine className="w-4 h-4 mx-auto text-muted-foreground" />
              </button>
              <button
                onClick={() => onReorderQuestions('up')}
                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-r border-gray-100 dark:border-gray-700"
              >
                <ChevronUp className="w-4 h-4 mx-auto text-muted-foreground" />
              </button>
              <button
                onClick={() => onReorderQuestions('down')}
                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-r border-gray-100 dark:border-gray-700"
              >
                <ChevronDown className="w-4 h-4 mx-auto text-muted-foreground" />
              </button>
              <button
                onClick={() => onReorderQuestions('bottom')}
                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowDownToLine className="w-4 h-4 mx-auto text-muted-foreground" />
              </button>
            </div>
            <div className="p-2 text-center text-xs text-muted-foreground border-t border-gray-100 dark:border-gray-700">
              Reorder selected questions
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="w-full text-muted-foreground hover:text-foreground hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            Clear Selection
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-center p-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
            <ChevronUp className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Select questions to perform bulk actions
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Select All Questions
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-medium text-foreground">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportAll}
                className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
              <div>
                <input
                  type="file"
                  id="import-file"
                  className="hidden"
                  accept=".json"
                  onChange={handleImportQuestions}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => document.getElementById('import-file')?.click()}
                  className="w-full bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDialogOpen && renderActionDialog()}
    </div>
  );
}