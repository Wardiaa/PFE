// components/ui/question-type-selector.tsx
import { 
  CheckCircle, 
  ListChecks, 
  Type, 
  Star, 
  Image as ImageIcon, 
  Music, 
  Video,
  TrendingUp,
  Grid
} from "lucide-react";
import { cn } from "../../lib/utils";

const questionTypes = [
  {
    id: "SINGLE_CHOICE",
    name: "Single Choice",
    description: "One correct answer",
    icon: CheckCircle,
    color: "bg-blue-500",
    popular: true,
  },
  {
    id: "MULTIPLE_CHOICE",
    name: "Multiple Choice",
    description: "Multiple correct answers",
    icon: ListChecks,
    color: "bg-purple-500",
    popular: true,
  },
  {
    id: "OPEN_TEXT",
    name: "Open Text",
    description: "Text-based answers",
    icon: Type,
    color: "bg-green-500",
    popular: false,
  },
  {
    id: "RATING_SCALE",
    name: "Rating Scale",
    description: "1-5 or 1-10 scale",
    icon: Star,
    color: "bg-yellow-500",
    popular: true,
  },
  {
    id: "IMAGE_CHOICE",
    name: "Image Choice",
    description: "Choose from images",
    icon: ImageIcon,
    color: "bg-pink-500",
    popular: false,
  },
  {
    id: "AUDIO_QUESTION",
    name: "Audio Question",
    description: "Listen and answer",
    icon: Music,
    color: "bg-indigo-500",
    popular: false,
  },
  {
    id: "VIDEO_QUESTION",
    name: "Video Question",
    description: "Watch and answer",
    icon: Video,
    color: "bg-red-500",
    popular: false,
  },
  {
    id: "RANKING",
    name: "Ranking",
    description: "Rank options in order",
    icon: TrendingUp,
    color: "bg-orange-500",
    popular: false,
  },
  {
    id: "MATRIX",
    name: "Matrix",
    description: "Grid of questions",
    icon: Grid,
    color: "bg-cyan-500",
    popular: false,
  },
];

interface QuestionTypeSelectorProps {
  value: string;
  onChange: (typeId: string) => void;
}

export function QuestionTypeSelector({ value, onChange }: QuestionTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Question Type</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {questionTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => onChange(type.id)}
              className={cn(
                "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:shadow-md",
                value === type.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center mb-3",
                type.color,
                "text-white"
              )}>
                <Icon className="h-6 w-6" />
              </div>
              
              <span className="font-medium text-sm mb-1">{type.name}</span>
              <span className="text-xs text-muted-foreground text-center">
                {type.description}
              </span>
              
              {type.popular && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Popular
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}