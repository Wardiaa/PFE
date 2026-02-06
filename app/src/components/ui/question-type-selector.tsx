// question-type-selector.tsx
import React from "react";
import { cn } from "../../lib/utils";
import { Card, CardContent } from "./card";
import { ListChecks, MessageSquare, Cloud, BarChart2, HelpCircle } from "lucide-react";

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
      color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
    },
    {
      id: 'open-text',
      name: 'Open Text',
      icon: MessageSquare,
      description: 'Free-form text responses',
      color: 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400'
    },
    {
      id: 'word-cloud',
      name: 'Word Cloud',
      icon: Cloud,
      description: 'Visual word frequency display',
      color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400'
    },
    {
      id: 'rating-scale',
      name: 'Rating Scale',
      icon: BarChart2,
      description: 'Numeric or star-based ratings',
      color: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400'
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