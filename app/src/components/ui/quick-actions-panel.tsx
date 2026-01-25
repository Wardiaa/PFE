// components/ui/quick-actions-panel.tsx - UPDATED WITHOUT AI
import { Button } from "./button";
import { 
  Copy,
  Trash2,
  Settings,
  Timer,
  BarChart2,
  AlignLeft,
  CheckSquare,
  Zap,
  RotateCcw,
  Upload,
  Download
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Badge } from "./badge";
import { useToast } from "../../hooks/use-toast";
import { QUESTION_TYPES } from "../../lib/question-types";

interface QuickActionsPanelProps {
  questions: any[];
  currentQuestionIndex: number;
  onAddQuestion: (type: string) => void;
  onDuplicateQuestion: () => void;
  onDeleteQuestion: () => void;
  onUpdateQuestion: (updates: any) => void;
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
  const { toast } = useToast();
  const currentQuestion = questions[currentQuestionIndex];


  const handleAddQuickQuestion = (type: string) => {
    onAddQuestion(type);
    toast({
      title: "Question added",
      description: `Added ${type.replace('_', ' ').toLowerCase()} question`,
    });
  };

  const handleApplyTimeLimit = (seconds: number) => {
    if (currentQuestion) {
      onUpdateQuestion({ timeLimit: seconds });
      toast({
        title: "Time limit updated",
        description: `Set to ${seconds} seconds`,
      });
    }
  };

  const handleApplyPoints = (points: number) => {
    if (currentQuestion) {
      onUpdateQuestion({ points: points });
      toast({
        title: "Points updated",
        description: `Set to ${points} points`,
      });
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'duplicate':
        onDuplicateQuestion();
        break;
      case 'delete':
        onDeleteQuestion();
        break;
      case 'shuffle':
        onBulkAction('shuffle');
        break;
      case 'reset':
        onUpdateQuestion({
          timeLimit: 30,
          points: 100,
          options: currentQuestion.options?.map((opt: any) => ({
            ...opt,
            isCorrect: false
          }))
        });
        toast({
          title: "Question reset",
          description: "Reset to default values",
        });
        break;
    }
  };

  return (
    <div className="fixed right-6 bottom-6 z-50">
      <div className="flex flex-col gap-2 items-end">
        {/* Main Quick Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg h-14 w-14">
              <Zap className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">QUICK ACTIONS</p>
              
              <DropdownMenuItem onClick={() => handleAddQuickQuestion(QUESTION_TYPES.SINGLE_CHOICE)}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-blue-500" />
                    <span>Add Multiple Choice</span>
                  </div>
                  <Badge variant="outline" className="text-xs">M</Badge>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => handleAddQuickQuestion(QUESTION_TYPES.OPEN_TEXT)}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="h-4 w-4 text-orange-500" />
                    <span>Add Open Question</span>
                  </div>
                  <Badge variant="outline" className="text-xs">O</Badge>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => handleAddQuickQuestion(QUESTION_TYPES.POLL)}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-cyan-500" />
                    <span>Add Poll</span>
                  </div>
                  <Badge variant="outline" className="text-xs">P</Badge>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={onDuplicateQuestion} disabled={!currentQuestion}>
                <Copy className="h-4 w-4 mr-2" />
                <span>Duplicate Current</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={onDeleteQuestion} disabled={!currentQuestion}>
                <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                <span className="text-destructive">Delete Current</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => handleQuickAction('shuffle')} disabled={!currentQuestion?.options}>
                <Settings className="h-4 w-4 mr-2" />
                <span>Shuffle Answers</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => handleQuickAction('reset')} disabled={!currentQuestion}>
                <RotateCcw className="h-4 w-4 mr-2" />
                <span>Reset Question</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Time/Points Quick Set */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="secondary" className="rounded-full shadow-lg" disabled={!currentQuestion}>
              <Timer className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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
                {[0, 50, 100, 200, 300, 500].map((points) => (
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
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export/Import Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="secondary" className="rounded-full shadow-lg">
              <Upload className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">EXPORT</p>
              <DropdownMenuItem onClick={() => onBulkAction('export-json')}>
                <Download className="h-4 w-4 mr-2" />
                <span>Export as JSON</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction('export-csv')}>
                <Download className="h-4 w-4 mr-2" />
                <span>Export as CSV</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <p className="text-xs font-medium text-muted-foreground mb-2">IMPORT</p>
              <DropdownMenuItem onClick={() => document.getElementById('import-file')?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                <span>Import Questions</span>
              </DropdownMenuItem>
              <input type="file" id="import-file" className="hidden" accept=".json,.csv" />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}