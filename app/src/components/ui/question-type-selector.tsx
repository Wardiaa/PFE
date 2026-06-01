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
    },
    {
      id: 'open-text',
      name: 'Open Text',
      icon: MessageSquare,
      description: 'Free-form text responses',
    },
    {
      id: 'word-cloud',
      name: 'Word Cloud',
      icon: Cloud,
      description: 'Visual word frequency display',
    },
    {
      id: 'rating-scale',
      name: 'Rating Scale',
      icon: Star,
      description: 'Star-based rating',
    },
    {
      id: 'scales',
      name: 'Scales',
      icon: SlidersHorizontal,
      description: 'Rate multiple statements on a 1–5 scale',
    },
    {
      id: 'ranking',
      name: 'Ranking',
      icon: ArrowUpDown,
      description: 'Drag items into your preferred order',
    },
    {
      id: 'grid-2x2',
      name: 'Grid 2×2',
      icon: Grid3X3,
      description: 'Place items on a two-axis matrix',
    },
    {
      id: 'vote',
      name: 'Vote',
      icon: Vote,
      description: 'Cast a vote for one option',
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
        Question Types
      </h3>
      {questionTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = selectedType === type.id;
        
        return (
          <Card
            key={type.id}
            className={cn(
              "cursor-pointer transition-all duration-200 bg-white",
              isSelected 
                ? "border-indigo-500 ring-1 ring-indigo-500 shadow-sm" 
                : "border-slate-100 hover:border-slate-300 shadow-none"
            )}
            onClick={() => onSelect(type.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon Container: Unified Indigo color, same 10x10 size */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-stale-50 flex items-center justify-center text-indigo-500">
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800">
                    {type.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {type.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}