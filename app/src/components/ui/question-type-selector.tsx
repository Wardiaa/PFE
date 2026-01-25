
import { Button } from "./button";
import { cn } from "../../lib/utils";
import { 
  CheckSquare, 
  AlignLeft, 
  BarChart2, 
  Star, 
  Image as ImageIcon,
  Type,
  List,
  Trophy
} from "lucide-react";

interface QuestionTypeSelectorProps {
  onSelect: (type: string) => void;
}

const questionTypes = [
  {
    id: "SINGLE_CHOICE",
    name: "Multiple Choice",
    icon: CheckSquare,
    color: "text-blue-500 bg-blue-50",
    description: "Participants choose one correct answer"
  },
  {
    id: "MULTIPLE_CHOICE",
    name: "Multi-Select",
    icon: List,
    color: "text-purple-500 bg-purple-50",
    description: "Participants choose all correct answers"
  },
  {
    id: "TRUE_FALSE",
    name: "True or False",
    icon: Trophy,
    color: "text-green-500 bg-green-50",
    description: "Simple binary choice question"
  },
  {
    id: "OPEN_TEXT",
    name: "Open Ended",
    icon: AlignLeft,
    color: "text-orange-500 bg-orange-50",
    description: "Participants type their own answer"
  },
  {
    id: "POLL",
    name: "Poll",
    icon: BarChart2,
    color: "text-cyan-500 bg-cyan-50",
    description: "Gather opinions, no correct answer"
  },
  {
    id: "RATING",
    name: "Rating",
    icon: Star,
    color: "text-yellow-500 bg-yellow-50",
    description: "Rate on a scale of stars or numbers"
  },
  {
    id: "IMAGE_CHOICE",
    name: "Image Choice",
    icon: ImageIcon,
    color: "text-pink-500 bg-pink-50",
    description: "Use images as answer options"
  },
  {
    id: "WORD_CLOUD",
    name: "Word Cloud",
    icon: Type,
    color: "text-indigo-500 bg-indigo-50",
    description: "Visualize popular text answers"
  }
];

export function QuestionTypeSelector({ onSelect }: QuestionTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {questionTypes.map((type) => (
        <Button
          key={type.id}
          variant="outline"
          className="h-auto py-4 px-3 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5 transition-all text-center"
          onClick={() => onSelect(type.id)}
        >
          <div className={cn("p-2 rounded-lg", type.color)}>
            <type.icon className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="font-medium text-sm">{type.name}</div>
            <div className="text-[10px] text-muted-foreground leading-tight max-w-30 mx-auto hidden sm:block">
              {type.description}
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
}
