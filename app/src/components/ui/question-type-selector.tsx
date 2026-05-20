// question-type-selector.tsx — Updated to include Scales + Ranking + Grid 2x2 + Vote question types
// Rating Scale now uses Star icon only (removed BarChart2)

import React from "react";
import { cn } from "../../lib/utils";
import { Card, CardContent } from "./card";
import { 
  ListChecks, 
  MessageSquare, 
  Cloud, 
  Star,
  SlidersHorizontal, 
  ArrowUpDown,
  Grid3X3,
  Vote
} from "lucide-react";

interface QuestionType {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

interface QuestionTypeSelectorProps {
  onSelect: (type: string) => void;
  selectedType?: string;
}

export function QuestionTypeSelector({ onSelect, selectedType }: QuestionTypeSelectorProps) {
  const questionTypes: QuestionType[] = [
    {
      id: 'multiple-choice',
      name: 'Multiple Choice',
      icon: ListChecks,
      description: 'Single or multiple answer selection',
      color: 'bg-primary/20 text-primary'
    },
    {
      id: 'open-text',
      name: 'Open Text',
      icon: MessageSquare,
      description: 'Free-form text responses',
      color: 'bg-warning/20 text-warning'
    },
    {
      id: 'word-cloud',
      name: 'Word Cloud',
      icon: Cloud,
      description: 'Visual word frequency display',
      color: 'bg-accent text-primary'
    },
    {
      id: 'rating-scale',
      name: 'Rating Scale',
      icon: Star,
      description: 'Star-based rating',
      color: 'bg-amber-500/20 text-amber-600'
    },
    {
      id: 'scales',
      name: 'Scales',
      icon: SlidersHorizontal,
      description: 'Rate multiple statements on a 1–5 scale',
      color: 'bg-teal-500/20 text-teal-600'
    },
    {
      id: 'ranking',
      name: 'Ranking',
      icon: ArrowUpDown,
      description: 'Drag items into your preferred order',
      color: 'bg-violet-500/20 text-violet-600'
    },
    {
      id: 'grid-2x2',
      name: 'Grid 2×2',
      icon: Grid3X3,
      description: 'Place items on a two-axis matrix',
      color: 'bg-emerald-500/20 text-emerald-600'
    },
    {
      id: 'vote',
      name: 'Vote',
      icon: Vote,
      description: 'Cast a vote for one option',
      color: 'bg-rose-500/20 text-rose-600'
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground mb-4">Question Types</h3>
      {questionTypes.map((type) => {
        const Icon = type.icon;
        return (
          <Card
            key={type.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedType === type.id && "ring-2 ring-primary"
            )}
            onClick={() => onSelect(type.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn("flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center", type.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-foreground">{type.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}