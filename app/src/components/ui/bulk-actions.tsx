// components/ui/bulk-actions.tsx
import React, { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { 
  Copy,
  Shuffle,
  Timer,
  Download,
  Upload,
  Trash2,
  Lock,
  Unlock,
  Star,
  Edit,
  X,
  Settings,
  FileUp,
  FileDown,
  ListOrdered,
  ListChecks
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./select";
import { Slider } from "./slider";
import { Switch } from "./switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { useToast } from "../../hooks/use-toast";

interface BulkActionsProps {
  questions: any[];
  onUpdateQuestions: (questions: any[]) => void;
  selectedQuestions: number[];
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export function BulkActions({ 
  questions, 
  onUpdateQuestions, 
  selectedQuestions, 
  onSelectAll, 
  onClearSelection 
}: BulkActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);
  const [timeLimitValue, setTimeLimitValue] = useState(30);
  const [pointsValue, setPointsValue] = useState(100);
  const [shuffleAnswers, setShuffleAnswers] = useState(false);
  
  const { toast } = useToast();

  const handleBulkUpdate = () => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "No questions selected",
        description: "Please select questions to apply bulk actions",
        variant: "destructive",
      });
      return;
    }

    let updatedQuestions = [...questions];

    switch (actionType) {
      case "time":
        updatedQuestions = updatedQuestions.map((q, index) => {
          if (selectedQuestions.includes(index)) {
            return { ...q, timeLimit: timeLimitValue };
          }
          return q;
        });
        break;
        
      case "points":
        updatedQuestions = updatedQuestions.map((q, index) => {
          if (selectedQuestions.includes(index)) {
            return { ...q, points: pointsValue };
          }
          return q;
        });
        break;
        
      case "shuffle":
        updatedQuestions = updatedQuestions.map((q, index) => {
          if (selectedQuestions.includes(index) && q.options) {
            const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
            return { ...q, options: shuffledOptions };
          }
          return q;
        });
        break;
        
      case "duplicate":
        const duplicates: any[] = [];
        updatedQuestions.forEach((q, index) => {
          if (selectedQuestions.includes(index)) {
            const duplicate = {
              ...q,
              id: `q${Date.now() + index}`,
              title: `${q.title} (Copy)`
            };
            duplicates.push(duplicate);
          }
        });
        // Insert duplicates after originals
        let newIndex = 0;
        selectedQuestions.forEach((originalIndex, idx) => {
          const insertPosition = originalIndex + idx + 1 + newIndex;
          updatedQuestions.splice(insertPosition, 0, duplicates[idx]);
          newIndex++;
        });
        break;
        
      case "delete":
        updatedQuestions = updatedQuestions.filter((_, index) => 
          !selectedQuestions.includes(index)
        );
        onClearSelection();
        break;
        
      case "lock":
        updatedQuestions = updatedQuestions.map((q, index) => {
          if (selectedQuestions.includes(index)) {
            return { ...q, locked: true };
          }
          return q;
        });
        break;
        
      case "unlock":
        updatedQuestions = updatedQuestions.map((q, index) => {
          if (selectedQuestions.includes(index)) {
            return { ...q, locked: false };
          }
          return q;
        });
        break;
    }

    onUpdateQuestions(updatedQuestions);
    setIsOpen(false);
    
    toast({
      title: "Bulk action applied",
      description: `Applied to ${selectedQuestions.length} questions`,
    });
  };

  const handleExportQuestions = (format: string) => {
    const selectedData = questions.filter((_, index) => 
      selectedQuestions.length > 0 ? selectedQuestions.includes(index) : true
    );
    
    let content = "";
    let filename = "";
    
    switch (format) {
      case "json":
        content = JSON.stringify(selectedData, null, 2);
        filename = "questions.json";
        break;
      case "csv":
        const headers = ["Question", "Type", "Points", "Time Limit"];
        const rows = selectedData.map(q => [
          q.title,
          q.type,
          q.points,
          q.timeLimit
        ]);
        content = [headers, ...rows].map(row => row.join(",")).join("\n");
        filename = "questions.csv";
        break;
      case "text":
        content = selectedData.map((q, i) => 
          `${i + 1}. ${q.title}\nType: ${q.type}\nPoints: ${q.points}\nTime: ${q.timeLimit}s\n`
        ).join("\n");
        filename = "questions.txt";
        break;
    }
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Questions exported",
      description: `Exported ${selectedData.length} questions as ${format.toUpperCase()}`,
    });
  };

  const handleImportQuestions = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let importedQuestions: any[] = [];
        
        if (file.name.endsWith('.json')) {
          importedQuestions = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV parsing
          const lines = content.split('\n');
          importedQuestions = lines.slice(1).map(line => {
            const values = line.split(',');
            return {
              id: `q${Date.now() + Math.random()}`,
              title: values[0] || "Imported Question",
              type: values[1] || "SINGLE_CHOICE",
              points: parseInt(values[2]) || 100,
              timeLimit: parseInt(values[3]) || 30,
              options: []
            };
          }).filter(q => q.title);
        }
        
        if (importedQuestions.length > 0) {
          const updatedQuestions = [...questions, ...importedQuestions];
          onUpdateQuestions(updatedQuestions);
          
          toast({
            title: "Questions imported",
            description: `Imported ${importedQuestions.length} questions`,
          });
        }
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Could not parse the file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset input
  };

  const handleReorderQuestions = (direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (selectedQuestions.length === 0) return;
    
    const updatedQuestions = [...questions];
    
    selectedQuestions.forEach((selectedIndex) => {
      const currentIndex = updatedQuestions.findIndex((_, idx) => idx === selectedIndex);
      if (currentIndex === -1) return;
      
      const question = updatedQuestions[currentIndex];
      updatedQuestions.splice(currentIndex, 1);
      
      let newIndex;
      switch (direction) {
        case 'up':
          newIndex = Math.max(0, currentIndex - 1);
          break;
        case 'down':
          newIndex = Math.min(updatedQuestions.length, currentIndex);
          break;
        case 'top':
          newIndex = 0;
          break;
        case 'bottom':
          newIndex = updatedQuestions.length;
          break;
        default:
          newIndex = currentIndex;
      }
      
      updatedQuestions.splice(newIndex, 0, question);
    });
    
    onUpdateQuestions(updatedQuestions);
    
    toast({
      title: "Questions reordered",
      description: `Moved ${selectedQuestions.length} questions`,
    });
  };

  const actionOptions = [
    {
      id: "time",
      name: "Set Time Limit",
      icon: Timer,
      description: "Apply same time limit to selected questions",
      component: (
        <div className="space-y-4">
          <div>
            <Label>Time Limit (seconds)</Label>
            <Slider
              value={[timeLimitValue]}
              onValueChange={([value]) => setTimeLimitValue(value)}
              min={5}
              max={300}
              step={5}
            />
            <div className="flex justify-between mt-2">
              <span className="text-sm text-muted-foreground">5s</span>
              <span className="font-medium">{timeLimitValue}s</span>
              <span className="text-sm text-muted-foreground">5m</span>
            </div>
          </div>
          <div className="flex gap-2">
            {[15, 30, 60, 120].map((time) => (
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
    {
      id: "points",
      name: "Set Points",
      icon: Star,
      description: "Apply same point value to selected questions",
      component: (
        <div className="space-y-4">
          <div>
            <Label>Points per Question</Label>
            <Slider
              value={[pointsValue]}
              onValueChange={([value]) => setPointsValue(value)}
              min={0}
              max={500}
              step={10}
            />
            <div className="flex justify-between mt-2">
              <span className="text-sm text-muted-foreground">0</span>
              <span className="font-medium">{pointsValue} points</span>
              <span className="text-sm text-muted-foreground">500</span>
            </div>
          </div>
          <div className="flex gap-2">
            {[0, 50, 100, 200].map((points) => (
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
    {
      id: "shuffle",
      name: "Shuffle Answers",
      icon: Shuffle,
      description: "Randomize answer order in selected questions",
      component: (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="shuffle-toggle"
              checked={shuffleAnswers}
              onCheckedChange={setShuffleAnswers}
            />
            <Label htmlFor="shuffle-toggle">
              Shuffle answer options
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            This will randomize the order of answer options for each selected question.
          </p>
        </div>
      )
    },
    {
      id: "duplicate",
      name: "Duplicate Questions",
      icon: Copy,
      description: "Create copies of selected questions",
      component: (
        <div className="space-y-4">
          <p className="text-sm">
            This will create exact copies of {selectedQuestions.length} selected questions.
            The copies will be inserted immediately after the original questions.
          </p>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Example:</p>
            <p className="text-sm text-muted-foreground mt-1">
              Original Question → Original Question (Copy)
            </p>
          </div>
        </div>
      )
    },
    {
      id: "delete",
      name: "Delete Questions",
      icon: Trash2,
      description: "Remove selected questions",
      component: (
        <div className="space-y-4">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="font-medium text-destructive">Warning: This action cannot be undone</p>
            <p className="text-sm text-destructive/80 mt-1">
              You are about to delete {selectedQuestions.length} questions.
              This will permanently remove them from your quiz.
            </p>
          </div>
          <p className="text-sm">
            Make sure you have exported or backed up any important questions before proceeding.
          </p>
        </div>
      )
    },
    {
      id: "lock",
      name: "Lock Questions",
      icon: Lock,
      description: "Prevent editing of selected questions",
      component: (
        <div className="space-y-4">
          <p className="text-sm">
            Locking questions will prevent them from being edited accidentally.
            Locked questions can still be moved or deleted.
          </p>
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <p className="text-sm font-medium">Locked questions will show a lock icon</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "unlock",
      name: "Unlock Questions",
      icon: Unlock,
      description: "Allow editing of selected questions",
      component: (
        <div className="space-y-4">
          <p className="text-sm">
            Unlocking questions will allow them to be edited again.
          </p>
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Unlock className="h-4 w-4" />
              <p className="text-sm font-medium">Unlocked questions can be modified</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Selection Info */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4" />
          <span className="text-sm font-medium">
            {selectedQuestions.length} of {questions.length} questions selected
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            disabled={selectedQuestions.length === questions.length}
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={selectedQuestions.length === 0}
          >
            Clear Selection
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Bulk Actions
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Apply Bulk Action</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={actionType || ""} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an action" />
                </SelectTrigger>
                <SelectContent>
                  {actionOptions.map((action) => (
                    <SelectItem key={action.id} value={action.id}>
                      <div className="flex items-center gap-2">
                        <action.icon className="h-4 w-4" />
                        {action.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {actionType && (
                <div className="space-y-4">
                  {actionOptions.find(a => a.id === actionType)?.component}
                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActionType(null);
                        setIsOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBulkUpdate}
                      variant={actionType === "delete" ? "destructive" : "default"}
                    >
                      Apply to {selectedQuestions.length} Questions
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Reorder Buttons */}
        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none border-r"
            onClick={() => handleReorderQuestions('top')}
            disabled={selectedQuestions.length === 0}
          >
            <ListOrdered className="h-4 w-4 rotate-90" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none border-r"
            onClick={() => handleReorderQuestions('up')}
            disabled={selectedQuestions.length === 0}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none border-r"
            onClick={() => handleReorderQuestions('down')}
            disabled={selectedQuestions.length === 0}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none"
            onClick={() => handleReorderQuestions('bottom')}
            disabled={selectedQuestions.length === 0}
          >
            <ListOrdered className="h-4 w-4 -rotate-90" />
          </Button>
        </div>

        {/* Export Buttons */}
        <Select onValueChange={handleExportQuestions}>
          <SelectTrigger className="w-32">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="json">
              <div className="flex items-center gap-2">
                <FileUp className="h-4 w-4" />
                JSON
              </div>
            </SelectItem>
            <SelectItem value="csv">
              <div className="flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                CSV
              </div>
            </SelectItem>
            <SelectItem value="text">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Text
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Import Button */}
        <div>
          <Input
            type="file"
            id="import-questions"
            className="hidden"
            accept=".json,.csv,.txt"
            onChange={handleImportQuestions}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('import-questions')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>

        {/* Quick Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setActionType("time");
            setTimeLimitValue(30);
            handleBulkUpdate();
          }}
          disabled={selectedQuestions.length === 0}
        >
          <Timer className="h-4 w-4 mr-2" />
          30s All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setActionType("points");
            setPointsValue(100);
            handleBulkUpdate();
          }}
          disabled={selectedQuestions.length === 0}
        >
          <Star className="h-4 w-4 mr-2" />
          100pts All
        </Button>
      </div>

      {/* Selected Questions Preview */}
      {selectedQuestions.length > 0 && (
        <div className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Selected Questions:</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {selectedQuestions.map((index) => {
              const question = questions[index];
              return (
                <div
                  key={index}
                  className="px-3 py-1 bg-primary/10 rounded-full text-xs font-medium"
                >
                  Q{index + 1}: {question.title.substring(0, 20)}...
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Add missing import
import { ChevronUp, ChevronDown } from "lucide-react";