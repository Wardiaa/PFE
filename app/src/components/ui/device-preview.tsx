
import { useState } from "react";
import { cn } from "../../lib/utils";
import { Smartphone, Monitor } from "lucide-react";
import { Button } from "./button";
import { themes } from "./theme-selector";

interface DevicePreviewProps {
  title: string;
  themeId: string;
  questions: any[]; // Using any for simplicity in mockup
  currentQuestionIndex: number;
}

export function DevicePreview({ title, themeId, questions, currentQuestionIndex }: DevicePreviewProps) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  
  const theme = themes.find(t => t.id === themeId) || themes[0];
  const question = questions[currentQuestionIndex] || questions[0];
  
  // Handle empty questions array (Blank Canvas case)
  const hasQuestions = questions.length > 0;
  
  // Default question for preview when no questions exist
  const defaultQuestion = {
    title: "Add your first question to see it here",
    options: [
      { id: "1", text: "Sample Option 1", isCorrect: false },
      { id: "2", text: "Sample Option 2", isCorrect: true },
    ]
  };
  
  const displayQuestion = hasQuestions ? question : defaultQuestion;
  const displayOptions = displayQuestion.options || [];

  return (
    <div className="flex flex-col items-center h-full">
      <div className="flex items-center gap-2 mb-4 bg-muted/50 p-1 rounded-lg border">
        <Button 
          variant={device === "mobile" ? "secondary" : "ghost"} 
          size="sm" 
          onClick={() => setDevice("mobile")}
          className="h-8"
        >
          <Smartphone className="w-4 h-4 mr-2" /> Mobile
        </Button>
        <Button 
          variant={device === "desktop" ? "secondary" : "ghost"} 
          size="sm" 
          onClick={() => setDevice("desktop")}
          className="h-8"
        >
          <Monitor className="w-4 h-4 mr-2" /> Desktop
        </Button>
      </div>

      <div className={cn(
        "relative transition-all duration-500 ease-in-out border-8 border-gray-900 shadow-2xl overflow-hidden bg-background",
        device === "mobile" 
          ? "w-[320px] h-160 rounded-[3rem]" 
          : "w-full max-w-4xl h-150 rounded-xl border-4"
      )}>
        {/* Device Notch/Camera for Mobile */}
        {device === "mobile" && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-20" />
        )}

        {/* Screen Content */}
        <div className={cn(
          "w-full h-full overflow-y-auto flex flex-col",
          theme.colors.background,
          theme.font
        )}>
          {/* Header */}
          <div className={cn(
            "p-4 flex items-center justify-between shadow-sm z-10",
            theme.colors.background === "bg-slate-900" ? "border-b border-white/10" : "border-b"
          )}>
            <span className={cn("font-bold truncate max-w-50", theme.colors.text)}>{title || "Untitled Context"}</span>
            <div className={cn("text-xs font-mono px-2 py-1 rounded", theme.colors.accent, theme.colors.text === "text-white" ? "text-slate-900" : "")}>
              {hasQuestions ? `${currentQuestionIndex + 1}/${questions.length}` : "0/0"}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-8">
            {/* Question Card */}
            <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2 text-center">
                <span className={cn("text-xs font-bold uppercase tracking-wider opacity-60", theme.colors.text)}>
                  {hasQuestions ? `Question ${currentQuestionIndex + 1}` : "No questions yet"}
                </span>
                <h2 className={cn("text-xl md:text-2xl font-bold leading-tight", theme.colors.text)}>
                  {displayQuestion.title}
                </h2>
              </div>

              {/* Options */}
              <div className="grid gap-3 w-full">
                {displayOptions.map((opt: any, i: number) => (
                  <div
                    key={opt.id}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3",
                      theme.colors.background === "bg-slate-900" 
                        ? "border-white/10 hover:bg-white/5" 
                        : "border-black/5 hover:border-black/10 hover:bg-black/5",
                      opt.isCorrect && "border-green-500/50 bg-green-500/10"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      theme.colors.primary,
                      "text-white"
                    )}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className={cn("font-medium", theme.colors.text)}>{opt.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={cn("p-4 border-t", theme.colors.background === "bg-slate-900" ? "border-white/10" : "")}>
            <div className={cn("h-1.5 w-full rounded-full overflow-hidden", theme.colors.accent)}>
              <div 
                className={cn("h-full transition-all duration-300", theme.colors.primary)} 
                style={{ 
                  width: hasQuestions 
                    ? `${((currentQuestionIndex + 1) / questions.length) * 100}%` 
                    : '0%' 
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}