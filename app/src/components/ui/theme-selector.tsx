// components/ui/theme-selector.tsx
import { Check, Palette } from "lucide-react";
import { cn } from "../../lib/utils";

const themes = [
  {
    id: "default",
    name: "Default",
    bgFrom: "from-purple-500",
    bgTo: "to-pink-500",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
  },
  {
    id: "professional",
    name: "Professional",
    bgFrom: "from-blue-500",
    bgTo: "to-cyan-500",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  {
    id: "energetic",
    name: "Energetic",
    bgFrom: "from-orange-500",
    bgTo: "to-yellow-500",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
  },
  {
    id: "calm",
    name: "Calm",
    bgFrom: "from-green-500",
    bgTo: "to-emerald-500",
    textColor: "text-green-700",
    borderColor: "border-green-200",
  },
  {
    id: "dark",
    name: "Dark",
    bgFrom: "from-gray-800",
    bgTo: "to-gray-900",
    textColor: "text-gray-300",
    borderColor: "border-gray-700",
    dark: true,
  },
  {
    id: "colorful",
    name: "Colorful",
    bgFrom: "from-purple-500",
    bgTo: "to-pink-500 via-blue-500",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
  },
];

interface ThemeSelectorProps {
  value: string;
  onChange: (themeId: string) => void;
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium">Choose Theme</h3>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onChange(theme.id)}
            className={cn(
              "relative rounded-xl border-2 p-4 transition-all hover:scale-105",
              value === theme.id 
                ? "border-primary ring-2 ring-primary/20" 
                : "border-border hover:border-primary/50",
              theme.borderColor
            )}
          >
            <div className={cn(
              "h-12 w-full rounded-lg mb-2 bg-gradient-to-r",
              theme.bgFrom,
              theme.bgTo
            )} />
            <span className={cn("text-sm font-medium", theme.textColor)}>
              {theme.name}
            </span>
            
            {value === theme.id && (
              <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                <Check className="h-3 w-3" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}