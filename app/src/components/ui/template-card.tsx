
import { cn } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { type LucideIcon, Sparkles } from "lucide-react";

interface TemplateCardProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  category: string;
  popularity: number;
  questionsCount: number;
  isPopular?: boolean;
  isNew?: boolean;
  onClick: () => void;
  selected?: boolean;
}

export function TemplateCard({
  name,
  description,
  icon: Icon,
  color,
  category,
  questionsCount,
  isPopular,
  isNew,
  onClick,
  selected,
}: TemplateCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden border-2",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity", color)} />
      
      {isPopular && (
        <Badge className="absolute top-3 right-3 bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
          <Sparkles className="w-3 h-3 mr-1" /> Popular
        </Badge>
      )}
      
      {isNew && (
        <Badge className="absolute top-3 right-3 bg-blue-500 hover:bg-blue-600 text-white shadow-xs">
          New
        </Badge>
      )}

      <CardHeader className="pb-3 pt-6">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3 shadow-md", color)}>
          <Icon className="w-6 h-6" />
        </div>
        <CardTitle className="text-lg font-heading group-hover:text-primary transition-colors">
          {name}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t">
          <span className="bg-secondary/50 px-2 py-1 rounded-md">{category}</span>
          <span>{questionsCount} questions</span>
        </div>
      </CardContent>
    </Card>
  );
}
