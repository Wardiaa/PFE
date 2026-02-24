import { useState } from "react";
import { Button } from "../../../components/ui/button";
import type { Question } from "../types";
import { 
  Zap, 
  ListChecks, 
  MessageSquare, 
  Cloud, 
  BarChart2, 
  Copy, 
  Trash2, 
  Shuffle, 
  RefreshCw, 
  Timer, 
  Upload, 
  Download 
} from "lucide-react";

interface QuickActionsPanelProps {
  questions: Question[];
  currentQuestionIndex: number;
  onAddQuestion: (type: string) => void;
  onDuplicateQuestion: () => void;
  onDeleteQuestion: () => void;
  onUpdateQuestion: (updates: Partial<Question>) => void;
  onBulkAction: (action: string) => void;
}

export function QuickActionsPanel({
  questions,
  currentQuestionIndex,
  onAddQuestion,
  onDuplicateQuestion,
  onDeleteQuestion,
  onUpdateQuestion,
  onBulkAction
}: QuickActionsPanelProps) {
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const currentQuestion = questions[currentQuestionIndex];

  const handleAddQuickQuestion = (type: string) => {
    onAddQuestion(type);
    setShowMainMenu(false);
  };

  const handleApplyTimeLimit = (seconds: number) => {
    if (currentQuestion) {
      onUpdateQuestion({ timeLimit: seconds });
    }
    setShowTimeMenu(false);
  };

  const handleApplyPoints = (points: number) => {
    if (currentQuestion) {
      onUpdateQuestion({ points: points });
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'duplicate':
        onDuplicateQuestion();
        setShowMainMenu(false);
        break;
      case 'delete':
        onDeleteQuestion();
        setShowMainMenu(false);
        break;
      case 'shuffle':
        if (currentQuestion?.options) {
          const shuffledOptions = [...currentQuestion.options].sort(() => Math.random() - 0.5);
          onUpdateQuestion({ options: shuffledOptions });
          setShowMainMenu(false);
        }
        break;
      case 'reset':
        onUpdateQuestion({
          timeLimit: 30,
          points: 10,
          options: currentQuestion.options?.map((opt) => ({
            ...opt,
            isCorrect: false
          }))
        });
        setShowMainMenu(false);
        break;
    }
  };

  const handleExport = (format: string) => {
    switch (format) {
      case 'json':
        onBulkAction('export-json');
        break;
      case 'csv':
        const csvData = questions.map(q => ({
          Question: q.title,
          Type: q.type,
          Points: q.points || 0,
          'Time Limit': q.timeLimit || 30
        }));
        
        const csvContent = [
          Object.keys(csvData[0]).join(','),
          ...csvData.map(row => Object.values(row).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'questions.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        break;
    }
    setShowExportMenu(false);
  };

  return (
    <div className="fixed right-6 bottom-6 z-50">
      <div className="flex flex-col gap-2 items-end">
        <div className="relative">
          <Button
            size="icon"
            className="rounded-full shadow-lg h-14 w-14"
            onClick={() => {
              setShowMainMenu(!showMainMenu);
              setShowTimeMenu(false);
              setShowExportMenu(false);
            }}
          >
            <Zap className="w-6 h-6" />
          </Button>
          
          {showMainMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-64 bg-card border border-border rounded-lg shadow-xl">
              <div className="p-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">QUICK ACTIONS</p>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-1"
                  onClick={() => handleAddQuickQuestion('multiple-choice')}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-blue-500" />
                      <span>Add Multiple Choice</span>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded border border-border">M</span>
                  </div>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-1"
                  onClick={() => handleAddQuickQuestion('open-text')}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-orange-500" />
                      <span>Add Open Text</span>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded border border-border">O</span>
                  </div>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-1"
                  onClick={() => handleAddQuickQuestion('word-cloud')}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-purple-500" />
                      <span>Add Word Cloud</span>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded border border-border">W</span>
                  </div>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-1"
                  onClick={() => handleAddQuickQuestion('rating-scale')}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-cyan-500" />
                      <span>Add Rating Scale</span>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded border border-border">R</span>
                  </div>
                </Button>
                
                <div className="border-t border-border my-2"></div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-1"
                  onClick={() => handleQuickAction('duplicate')}
                  disabled={!currentQuestion}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  <span>Duplicate Current</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-1 text-destructive"
                  onClick={() => handleQuickAction('delete')}
                  disabled={!currentQuestion}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span>Delete Current</span>
                </Button>
                
                <div className="border-t border-border my-2"></div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-1"
                  onClick={() => handleQuickAction('shuffle')}
                  disabled={!currentQuestion?.options}
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  <span>Shuffle Answers</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleQuickAction('reset')}
                  disabled={!currentQuestion}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  <span>Reset Question</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full shadow-lg"
            disabled={!currentQuestion}
            onClick={() => {
              setShowTimeMenu(!showTimeMenu);
              setShowMainMenu(false);
              setShowExportMenu(false);
            }}
          >
            <Timer className="w-5 h-5" />
          </Button>
          
          {showTimeMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-card border border-border rounded-lg shadow-xl">
              <div className="p-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">TIME LIMIT</p>
                <div className="grid grid-cols-2 gap-1">
                  {[15, 30, 45, 60, 90, 120].map((seconds) => (
                    <Button
                      key={seconds}
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8"
                      onClick={() => handleApplyTimeLimit(seconds)}
                    >
                      {seconds}s
                    </Button>
                  ))}
                </div>
                
                <p className="text-xs font-medium text-muted-foreground mt-3 mb-2">POINTS</p>
                <div className="grid grid-cols-2 gap-1">
                  {[0, 10, 20, 30, 50, 100].map((points) => (
                    <Button
                      key={points}
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8"
                      onClick={() => handleApplyPoints(points)}
                    >
                      {points} pts
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full shadow-lg"
            onClick={() => {
              setShowExportMenu(!showExportMenu);
              setShowMainMenu(false);
              setShowTimeMenu(false);
            }}
          >
            <Upload className="w-5 h-5" />
          </Button>
          
          {showExportMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-card border border-border rounded-lg shadow-xl">
              <div className="p-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">EXPORT</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-1"
                  onClick={() => handleExport('json')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span>Export as JSON</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mb-1"
                  onClick={() => handleExport('csv')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span>Export as CSV</span>
                </Button>
                
                <div className="border-t border-border my-2"></div>
                
                <p className="text-xs font-medium text-muted-foreground mb-2">IMPORT</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => document.getElementById('import-file')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  <span>Import Questions</span>
                </Button>
                <input type="file" id="import-file" className="hidden" accept=".json,.csv" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}