// components/ui/template-card.tsx
// components/ui/template-card.tsx
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";

export interface TemplateCardProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  category: string;
  popularity: number;
  questionsCount: number;
  isPopular: boolean;
  isNew: boolean;
  onClick?: () => void;
}

export function TemplateCard({
  name,
  description,
  icon: Icon,
  color,
  category,
  popularity,
  questionsCount,
  isPopular,
  isNew,
  onClick,
}: TemplateCardProps) {
  return (
    <Card
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 overflow-hidden"
      onClick={onClick}
    >
      <div className={`h-24 md:h-32 ${color} relative`}>
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
        <div className="absolute top-2 md:top-3 right-2 md:right-3 flex gap-2">
          {isNew && (
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
              New
            </Badge>
          )}
          {isPopular && (
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
              Popular
            </Badge>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 flex items-end justify-between">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 md:p-3 shadow-lg">
            <Icon className="h-6 w-6 md:h-8 md:w-8" />
          </div>
        </div>
      </div>
      
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-sm md:text-base lg:text-lg line-clamp-1">{name}</h3>
          <Badge variant="outline" className="text-xs shrink-0 ml-2">
            {questionsCount}Q
          </Badge>
        </div>
        
        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-3">
          {description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{category}</span>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-12 sm:w-16 md:w-20 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${popularity}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{popularity}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}