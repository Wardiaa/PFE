// components/ui/template-card.tsx
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { ChevronRight, Star, Users, Zap } from "lucide-react";
import { cn } from "../../lib/utils";

interface TemplateCardProps {
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  popularity: number;
  questionsCount: number;
  isPopular?: boolean;
  isNew?: boolean;
  onClick: () => void;
}

export function TemplateCard({
  name,
  description,
  icon,
  color,
  category,
  popularity,
  questionsCount,
  isPopular = false,
  isNew = false,
  onClick,
}: TemplateCardProps) {
  return (
    <Card 
      className="group relative overflow-hidden border-2 hover:border-primary transition-all duration-300 hover:shadow-xl cursor-pointer h-full"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg",
            color
          )}>
            {icon}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {isPopular && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                <Star className="h-3 w-3 mr-1 fill-current" /> Popular
              </Badge>
            )}
            {isNew && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                NEW
              </Badge>
            )}
          </div>
        </div>

        <h3 className="font-heading font-bold text-xl mb-2">{name}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-orange-500" />
              <span className="text-muted-foreground">{popularity}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-blue-500" />
              <span className="text-muted-foreground">{questionsCount} Qs</span>
            </div>
          </div>
          
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
        >
          Use Template <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}