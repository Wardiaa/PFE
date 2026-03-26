import { cn } from "../../lib/utils";
import { Check } from "lucide-react";

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    background: string;
    text: string;
    accent: string;
  };
  font: string;
}

interface ThemeSelectorProps {
  selectedTheme: string;
  onSelect: (themeId: string) => void;
}

export const themes: Theme[] = [
  {
    id: "default",
    name: "Modern Clean",
    colors: {
      primary: "bg-primary",
      background: "bg-background",
      text: "text-foreground",
      accent: "bg-accent/20",
    },
    font: "font-sans",
  },
  {
    id: "ocean",
    name: "Ocean Breeze",
    colors: {
      primary: "bg-info",
      background: "bg-background",
      text: "text-foreground",
      accent: "bg-info/20",
    },
    font: "font-sans",
  },
  {
    id: "dark-future",
    name: "Dark Future",
    colors: {
      primary: "bg-success",
      background: "bg-background",
      text: "text-foreground",
      accent: "bg-muted",
    },
    font: "font-mono",
  },
  {
    id: "sunset",
    name: "Sunset Vibes",
    colors: {
      primary: "bg-warning",
      background: "bg-background",
      text: "text-foreground",
      accent: "bg-warning/20",
    },
    font: "font-serif",
  },
  {
    id: "playful",
    name: "Playful Pop",
    colors: {
      primary: "bg-accent",
      background: "bg-background",
      text: "text-foreground",
      accent: "bg-accent/30",
    },
    font: "font-heading",
  },
];

export function ThemeSelector({ selectedTheme, onSelect }: ThemeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {themes.map((theme) => {
        const isSelected = selectedTheme === theme.id;
        
        return (
          <div
            key={theme.id}
            className={cn(
              "cursor-pointer group relative rounded-xl border-2 transition-all duration-200 overflow-hidden",
              isSelected 
                ? "border-primary ring-2 ring-primary/20 scale-105 shadow-lg" 
                : "border-border hover:border-muted-foreground/20 hover:scale-105"
            )}
            onClick={() => onSelect(theme.id)}
          >
            <div className={cn("aspect-video w-full p-3 flex flex-col justify-between", theme.colors.background)}>
              <div className="flex gap-2">
                <div className={cn("w-full h-2 rounded-full", theme.colors.primary)} />
                <div className={cn("w-1/3 h-2 rounded-full", theme.colors.accent)} />
              </div>
              
              <div className="space-y-1.5">
                <div className={cn("w-3/4 h-2 rounded-full opacity-40", theme.colors.text, theme.colors.primary)} />
                <div className={cn("w-1/2 h-2 rounded-full opacity-20", theme.colors.text, theme.colors.primary)} />
              </div>
              
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center ml-auto shadow-sm", theme.colors.primary)}>
                <div className="w-4 h-4 rounded-full bg-background/50" />
              </div>
            </div>
            
            <div className="p-2 text-center text-xs font-medium border-t bg-muted/20">
              {theme.name}
            </div>

            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-sm">
                <Check className="w-3 h-3" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}