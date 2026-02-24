import { useState } from "react";
import { Button } from "../../../components/ui/button";
import type { Question } from "../types";
import { 
  Eye, 
  Smartphone, 
  Monitor, 
  Check, 
  Star, 
  FileText, 
  Clock,
  BarChart2 
} from "lucide-react";

interface PreviewPanelProps {
  question?: Question;
  presentationSettings: any;
  questions: Question[];
  currentQuestionIndex: number;
}

export function PreviewPanel({ question, presentationSettings, questions, currentQuestionIndex }: PreviewPanelProps) {
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
  const totalTime = questions.reduce((sum, q) => sum + (q.timeLimit || 0), 0);

  const defaultQuestion: Question = {
    id: 'preview',
    type: 'multiple-choice',
    title: "Add your first question to see it here",
    description: "Preview will appear once you add questions",
    points: 10,
    timeLimit: 30,
    options: [
      { id: "1", text: "Sample Option 1", isCorrect: false },
      { id: "2", text: "Sample Option 2", isCorrect: true },
      { id: "3", text: "Sample Option 3", isCorrect: false },
      { id: "4", text: "Sample Option 4", isCorrect: false }
    ]
  };
  
  const displayQuestion = question || defaultQuestion;
  const displayOptions = displayQuestion.options || [];

  const getDisplayType = () => {
    const type = displayQuestion.type;
    if (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE' || type === 'POLL' || type === 'multiple-choice') 
      return 'multiple-choice';
    if (type === 'OPEN_TEXT' || type === 'open-text') return 'open-text';
    if (type === 'WORD_CLOUD' || type === 'word-cloud') return 'word-cloud';
    if (type === 'RATING' || type === 'rating-scale') return 'rating-scale';
    return 'multiple-choice';
  };

  const renderQuestionTypeContent = () => {
    const displayType = getDisplayType();
    
    switch(displayType) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {displayOptions.map((opt, idx) => (
              <button
                key={opt.id}
                className={`w-full p-3 rounded-lg border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-250 text-left ${
                  opt.isCorrect ? 'ring-1 ring-green-500/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    opt.isCorrect ? 'border-green-500 bg-green-500 text-white' : 'border-border'
                  }`}>
                    {opt.isCorrect && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-sm md:text-base text-foreground">{opt.text}</span>
                </div>
              </button>
            ))}
          </div>
        );
      
      case 'open-text':
        return (
          <div className="space-y-3">
            <textarea
              placeholder="Type your answer here..."
              className="w-full min-h-[120px] p-4 rounded-lg border-2 border-border bg-card text-foreground resize-none focus:outline-none focus:border-primary transition-colors"
              disabled
            />
            <button className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              Submit Response
            </button>
          </div>
        );
      
      case 'word-cloud':
        return (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter a word or phrase..."
              className="w-full p-4 rounded-lg border-2 border-border bg-card text-foreground focus:outline-none focus:border-primary transition-colors"
              disabled
            />
            <button className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              Submit Word
            </button>
          </div>
        );
      
      case 'rating-scale':
        return (
          <div className="space-y-4">
            <div className="flex justify-center gap-2 md:gap-4">
              {[1, 2, 3, 4, 5]?.map((rating) => (
                <button
                  key={rating}
                  className="w-12 h-12 md:w-16 md:h-16 rounded-lg border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-250 flex items-center justify-center"
                >
                  <Star className="w-6 h-6 text-muted-foreground" />
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs md:text-sm text-muted-foreground px-2">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-3">
            {displayOptions.map((opt, idx) => (
              <button
                key={opt.id}
                className="w-full p-3 rounded-lg border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-250 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-border flex-shrink-0 flex items-center justify-center">
                    <span className="text-xs font-medium">{String.fromCharCode(65 + idx)}</span>
                  </div>
                  <span className="text-sm md:text-base text-foreground">{opt.text}</span>
                </div>
              </button>
            ))}
          </div>
        );
    }
  };

  const renderEmptyState = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Eye className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Question Selected</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Select a question to see how it will appear to your audience
        </p>
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Presentation Stats</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{questions.length}</div>
              <div className="text-xs text-muted-foreground">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalPoints}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalTime}s</div>
              <div className="text-xs text-muted-foreground">Time</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDeviceFrame = () => {
    if (!question && questions.length === 0) return renderEmptyState();

    return (
      <div className={`relative border-gray-800 shadow-lg overflow-hidden bg-background mx-auto ${
        device === "mobile" 
          ? "w-full max-w-[280px] h-[500px] rounded-[2rem] border-[10px]" 
          : "w-full max-w-full h-[500px] rounded-lg border-[6px]"
      }`}>
        
        {/* Mobile Notch */}
        {device === "mobile" && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 rounded-b-xl z-20" />
        )}

        {/* Desktop Top Bar */}
        {device === "desktop" && (
          <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800 rounded-t flex items-center px-4 z-20">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1 text-center">
              <span className="text-white text-xs">presentation.example.com</span>
            </div>
          </div>
        )}

        {/* Screen Content */}
        <div className={`w-full h-full overflow-y-auto flex flex-col bg-card ${
          device === "mobile" ? "rounded-[1.5rem]" : "rounded-b"
        }`}>
          
          {/* Header */}
          <div className={`border-b border-border flex items-center justify-between ${
            device === "mobile" ? "p-4" : "pt-8 px-6 pb-4"
          }`}>
            <div className="flex items-center gap-2">
              {presentationSettings?.showLogo && (
                <div 
                  className={`flex items-center justify-center ${
                    device === "mobile" ? "w-8 h-8" : "w-10 h-10"
                  } rounded-lg`}
                  style={{ background: presentationSettings.brandColor || '#6366f1' }}
                >
                  <BarChart2 className={device === "mobile" ? "w-4 h-4" : "w-5 h-5"} color="#FFFFFF" />
                </div>
              )}
              <div>
                <h3 className={`font-semibold truncate ${
                  device === "mobile" ? "text-sm" : "text-base"
                }`}>
                  {presentationSettings?.title || 'Presentation'}
                </h3>
                <p className={`text-muted-foreground ${
                  device === "mobile" ? "text-xs" : "text-sm"
                }`}>
                  Live session
                </p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full bg-primary/10 text-primary ${
              device === "mobile" ? "text-xs" : "text-sm"
            }`}>
              {question ? `Question ${currentQuestionIndex + 1}` : 'No question'}
            </div>
          </div>

          {/* Main Content */}
          <div className={`flex-1 overflow-y-auto ${
            device === "mobile" ? "p-4" : "p-6"
          }`}>
            <div className="space-y-6">
              {/* Question Progress */}
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                </div>
              </div>
              
              <div className="text-center">
                <h2 className={`font-semibold text-foreground mb-2 ${
                  device === "mobile" ? "text-lg" : "text-xl"
                }`}>
                  {displayQuestion?.title}
                </h2>
                
                {displayQuestion?.description && (
                  <p className={`text-muted-foreground ${
                    device === "mobile" ? "text-sm" : "text-base"
                  }`}>
                    {displayQuestion?.description}
                  </p>
                )}
                
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="w-4 h-4" />
                    <span>{displayQuestion?.points || 10} points</span>
                  </div>
                  {displayQuestion?.timeLimit && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{displayQuestion.timeLimit}s</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                {renderQuestionTypeContent()}
              </div>
              
              <div className="pt-4 border-t">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-sm font-medium">{questions.length}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{totalPoints}</div>
                    <div className="text-xs text-muted-foreground">Points</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{totalTime}s</div>
                    <div className="text-xs text-muted-foreground">Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Side Buttons */}
        {device === "mobile" && (
          <>
            <div className="absolute -left-2 top-20 w-1 h-10 bg-gray-800 rounded-l"></div>
            <div className="absolute -left-2 top-32 w-1 h-10 bg-gray-800 rounded-l"></div>
            <div className="absolute -right-2 top-20 w-1 h-16 bg-gray-800 rounded-r"></div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Audience Preview
        </h3>
        <div className="flex items-center gap-2">
          {/* Device Toggle */}
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border">
            <Button 
              variant={device === "mobile" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setDevice("mobile")}
              className="h-7 px-2"
            >
              <Smartphone className="w-3 h-3" />
            </Button>
            <Button 
              variant={device === "desktop" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setDevice("desktop")}
              className="h-7 px-2"
            >
              <Monitor className="w-3 h-3" />
            </Button>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
            Live Preview
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="h-full">
          {renderDeviceFrame()}
        </div>
      </div>
    </div>
  );
}