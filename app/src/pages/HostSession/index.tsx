import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppIcon from '../../components/AppIcon';
import QuestionDisplay from './components/QuestionDisplay';
import ControlPanel from './components/ControlPanel';
import PauseOverlay from './components/PauseOverlay';
import EndSessionModal from './components/EndSessionModal';
import { 
  type Session, 
  type Question, 
  type QuestionResponses,
  type MultipleChoiceResponses,
  type RatingResponses,
  type OpenTextResponses,
  type WordCloudResponses
} from '../../lib/presentation.types';

// Mock data (replace with actual API calls)
const mockSession: Session = {
    code: "ABC123",
    participantCount: 47,
    startTime: new Date(Date.now() - 900000),
    presentation: {
        id: "pres-001",
        title: "Employee Engagement Survey 2026",
        questions: [
            {
                id: "q1",
                number: 1,
                type: "multiple-choice",
                text: "How satisfied are you with your current work-life balance?",
                description: "Select the option that best describes your experience",
                options: [
                    { id: "opt1", text: "Very Satisfied" },
                    { id: "opt2", text: "Satisfied" },
                    { id: "opt3", text: "Neutral" },
                    { id: "opt4", text: "Dissatisfied" },
                    { id: "opt5", text: "Very Dissatisfied" }
                ]
            },
            {
                id: "q2",
                number: 2,
                type: "rating",
                text: "On a scale of 1-5, how would you rate team collaboration?",
                description: "1 = Poor, 5 = Excellent"
            },
            {
                id: "q3",
                number: 3,
                type: "open-text",
                text: "What improvements would you suggest for our workplace culture?",
                description: "Share your thoughts and ideas"
            },
            {
                id: "q4",
                number: 4,
                type: "word-cloud",
                text: "Describe our company culture in one word",
                description: "Submit a single word that comes to mind"
            },
            {
                id: "q5",
                number: 5,
                type: "multiple-choice",
                text: "Which benefit would you value most?",
                description: "Choose your top priority",
                options: [
                    { id: "opt1", text: "Flexible Working Hours" },
                    { id: "opt2", text: "Professional Development Budget" },
                    { id: "opt3", text: "Additional Vacation Days" },
                    { id: "opt4", text: "Health & Wellness Programs" }
                ]
            }
        ]
    },
    id: undefined
};

const mockResponses: Record<string, QuestionResponses> = {
  q1: {
    opt1: 18,
    opt2: 15,
    opt3: 8,
    opt4: 4,
    opt5: 2
  } as MultipleChoiceResponses,
  q2: {
      1: 2,
      2: 5,
      3: 12,
      4: 20,
      5: 8,
      average: "3.8",
      total: 47
  } as unknown as RatingResponses,
  q3: {
    count: 32,
    recent: [
      {
        text: "More flexible remote work options would greatly improve work-life balance and productivity.",
        timestamp: new Date(Date.now() - 120000)
      },
      {
        text: "Regular team building activities and better communication channels between departments.",
        timestamp: new Date(Date.now() - 180000)
      },
      {
        text: "Investment in modern tools and technology to streamline workflows and reduce manual tasks.",
        timestamp: new Date(Date.now() - 240000)
      }
    ]
  } as OpenTextResponses,
  q4: {
    uniqueWords: 28,
    words: [
      { text: "Collaborative", count: 6 },
      { text: "Innovative", count: 5 },
      { text: "Supportive", count: 4 },
      { text: "Dynamic", count: 3 },
      { text: "Inclusive", count: 3 },
      { text: "Flexible", count: 2 },
      { text: "Energetic", count: 2 },
      { text: "Professional", count: 1 }
    ]
  } as WordCloudResponses,
  q5: {
    opt1: 22,
    opt2: 12,
    opt3: 8,
    opt4: 5
  } as MultipleChoiceResponses
};

const HostSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [session] = useState<Session>(mockSession);
  const [responses] = useState<Record<string, QuestionResponses>>(mockResponses);

  const currentQuestion: Question | undefined = session?.presentation?.questions?.[currentQuestionIndex];
  const currentResponses: QuestionResponses = currentQuestion ? responses[currentQuestion.id] || {} : {};
  
  // Calculate response progress (mock implementation)
  const responseProgress = Math.round((session?.participantCount / session?.participantCount) * 85);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isPaused) return;
      
      if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        handlePrevious();
      } else if (e.key === 'ArrowRight' && currentQuestionIndex < session?.presentation?.questions?.length - 1) {
        handleNext();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        handlePause();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestionIndex, isPaused, session?.presentation?.questions?.length]);

  const handlePrevious = (): void => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = (): void => {
    if (currentQuestionIndex < (session?.presentation?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePause = (): void => {
    setIsPaused(!isPaused);
  };

  const handleRestart = (): void => {
    setCurrentQuestionIndex(0);
    setIsPaused(false);
  };

  const handleEnd = (): void => {
    setIsEndModalOpen(true);
  };

  const handleConfirmEnd = (): void => {
    navigate(`/results/${id || session?.id}`);
  };

  const handleViewResults = (): void => {
    navigate(`/results/${id || session?.id}`);
  };

  const toggleFullscreen = (): void => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!session || !currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <AppIcon name="Loader" size={32} />
          </div>
          <p className="text-lg text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="main-content">
        <div className="min-h-[calc(100vh-64px)] flex flex-col">
          {/* Presentation Header */}
          <div className="bg-card border-b border-border px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                    <AppIcon name="Radio" size={24} color="#FFFFFF" />
                  </div>
                  <div>
                    <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-foreground">
                      {session?.presentation?.title}
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Started {new Date(session.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  <button
                    onClick={toggleFullscreen}
                    className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <AppIcon name={isFullscreen ? 'Minimize2' : 'Maximize2'} size={18} />
                    <span className="text-sm font-medium text-foreground hidden md:inline">
                      {isFullscreen ? 'Exit' : 'Fullscreen'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Question Display Area */}
          <div className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12 overflow-y-auto custom-scrollbar">
            <div className="max-w-5xl mx-auto pb-32 md:pb-40">
              <QuestionDisplay
                question={currentQuestion}
                responses={currentResponses}
              />
            </div>
          </div>

          {/* Control Panel */}
          <ControlPanel
            sessionCode={session?.code}
            participantCount={session?.participantCount}
            responseProgress={responseProgress}
            currentQuestion={currentQuestionIndex + 1}
            totalQuestions={session?.presentation?.questions?.length}
            isPaused={isPaused}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onPause={handlePause}
            onRestart={handleRestart}
            onEnd={handleEnd}
            onViewResults={handleViewResults}
          />

          {/* Pause Overlay */}
          {isPaused && <PauseOverlay onResume={handlePause} />}

          {/* End Session Modal */}
          <EndSessionModal
            isOpen={isEndModalOpen}
            onClose={() => setIsEndModalOpen(false)}
            onConfirm={handleConfirmEnd}
            onViewResults={handleViewResults}
          />
        </div>
      </main>
    </div>
  );
};

export default HostSession;