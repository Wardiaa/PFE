import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppIcon from '../../components/AppIcon';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import QuestionDisplay from './components/QuestionDisplay';
import ControlPanel from './components/ControlPanel';
import PauseOverlay from './components/PauseOverlay';
import EndSessionModal from './components/EndSessionModal';
import type {
  Session,
  Question,
  QuestionResponses,
  MultipleChoiceResponses,
  RatingResponses,
  OpenTextResponses,
  WordCloudResponses,
  Participant
} from '../../lib/presentation.types';

// Mock data (replace with actual API calls)
const mockSession: Session = {
  id: "pres-001",
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
        timeLimit: 30,
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
        description: "1 = Poor, 5 = Excellent",
        timeLimit: 25
      },
      {
        id: "q3",
        number: 3,
        type: "open-text",
        text: "What improvements would you suggest for our workplace culture?",
        description: "Share your thoughts and ideas",
        timeLimit: 45
      },
      {
        id: "q4",
        number: 4,
        type: "word-cloud",
        text: "Describe our company culture in one word",
        description: "Submit a single word that comes to mind",
        timeLimit: 20
      },
      {
        id: "q5",
        number: 5,
        type: "multiple-choice",
        text: "Which benefit would you value most?",
        description: "Choose your top priority",
        timeLimit: 30,
        options: [
          { id: "opt1", text: "Flexible Working Hours" },
          { id: "opt2", text: "Professional Development Budget" },
          { id: "opt3", text: "Additional Vacation Days" },
          { id: "opt4", text: "Health & Wellness Programs" }
        ]
      }
    ]
  }
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
  } as RatingResponses,
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
      { text: "Innovative", count: 5, color: "text-purple-600" },
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

// Mock participants for lobby
const mockParticipants: Participant[] = [
  { id: "1", name: "Alice", score: 0, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice" },
  { id: "2", name: "Bob", score: 0, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob" },
  { id: "3", name: "Charlie", score: 0, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie" },
  { id: "4", name: "Diana", score: 0, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diana" },
  { id: "5", name: "Eve", score: 0, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Eve" },
];

const HostSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1); // -1 = Lobby
  const [showResults, setShowResults] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [session] = useState<Session>(mockSession);
  const [responses] = useState<Record<string, QuestionResponses>>(mockResponses);
  const [participants] = useState<Participant[]>(mockParticipants);

  const currentQuestion: Question | undefined = currentQuestionIndex >= 0 
    ? session?.presentation?.questions?.[currentQuestionIndex] 
    : undefined;
  const currentResponses: QuestionResponses = currentQuestion ? responses[currentQuestion.id] || {} : {};
  
  // Calculate response progress (mock implementation)
  const responseProgress = currentQuestion 
    ? Math.round((session?.participantCount / session?.participantCount) * 85) 
    : 0;

  // Timer effect
  useEffect(() => {
    if (currentQuestionIndex >= 0 && !showResults && !isPaused && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && currentQuestionIndex >= 0 && !showResults && !isPaused) {
      setShowResults(true);
    }
  }, [timer, currentQuestionIndex, showResults, isPaused]);

  // Keyboard navigation effect (only when not in lobby and not paused)
  // Keyboard navigation effect
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (currentQuestionIndex === -1 || isPaused) return;
    
    // Always allow arrow key navigation when not in lobby and not paused
    if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
      e.preventDefault();
      handlePrevious();
    } else if (e.key === 'ArrowRight' && currentQuestionIndex < (session?.presentation?.questions?.length || 0) - 1) {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    } else if (e.key === ' ' || e.key === 'Space') {
      e.preventDefault();
      if (currentQuestionIndex >= 0) {
        handlePause();
      }
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [currentQuestionIndex, isPaused, session?.presentation?.questions?.length]);

  const handleStart = (): void => {
    setCurrentQuestionIndex(0);
    const firstQuestion = session?.presentation?.questions?.[0];
    setTimer(firstQuestion?.timeLimit || 30);
    setShowResults(false);
    setIsPaused(false);
  };

  const handlePrevious = (): void => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevQuestion = session?.presentation?.questions?.[currentQuestionIndex - 1];
      setTimer(prevQuestion?.timeLimit || 30);
      setShowResults(false);
    }
  };

  const handleNext = (): void => {
    if (currentQuestionIndex < (session?.presentation?.questions?.length || 0) - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      const nextQuestion = session?.presentation?.questions?.[nextIndex];
      setTimer(nextQuestion?.timeLimit || 30);
      setShowResults(false);
    } else {
      // Last question finished, go to results
      navigate(`/results/${id || session?.id}`);
    }
  };

  const handlePause = (): void => {
    setIsPaused(!isPaused);
  };

  const handleRestart = (): void => {
    setCurrentQuestionIndex(0);
    const firstQuestion = session?.presentation?.questions?.[0];
    setTimer(firstQuestion?.timeLimit || 30);
    setShowResults(false);
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

  const handleCopyLink = (): void => {
    navigator.clipboard.writeText(window.location.href);
    // You could add a toast notification here
  };

  // Loading state
  if (!session) {
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

  // LOBBY VIEW
if (currentQuestionIndex === -1) {
  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center text-white p-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Left Column - Session Info */}
        <div className="space-y-8">
          <div>
            <Badge variant="outline" className="text-white border-white mb-4 bg-white/20">
              Join at engage.app
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-2">
              Code: {session.code}
            </h1>
            <p className="text-xl opacity-90 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Waiting for participants...
            </p>
          </div>
          
          {/* QR Code Card */}
          <Card className="p-6 bg-white/10 border-white/20 backdrop-blur-md text-white">
            <div className="flex items-center gap-6">
              <div className="h-32 w-32 bg-white rounded-lg flex items-center justify-center text-black">
                <AppIcon name="QrCode" size={80} />
              </div>
              <div className="space-y-3">
                <div className="text-sm uppercase tracking-wider opacity-75">
                  Scan to join
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full bg-white text-primary hover:bg-white/90"
                  onClick={handleCopyLink}
                >
                  <AppIcon name="Copy" className="mr-2 h-4 w-4" /> Copy Link
                </Button>
                <p className="text-xs opacity-75">
                  or visit: engage.app/join
                </p>
              </div>
            </div>
          </Card>

          {/* Session Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">{session.presentation.questions.length}</div>
              <div className="text-sm opacity-75">Questions</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">{session.participantCount}</div>
              <div className="text-sm opacity-75">Max Participants</div>
            </div>
          </div>
        </div>

        {/* Right Column - Participants List */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 font-bold text-lg">
              <AppIcon name="Users" className="h-5 w-5" />
              <span>{participants.length} Joined</span>
            </div>
            <Badge variant="outline" className="text-white border-white">
              Live
            </Badge>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            <AnimatePresence>
              {participants.map((p, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  key={p.id} 
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Avatar className="h-8 w-8 border-2 border-white/20">
                    <AvatarImage src={p.avatar} />
                    <AvatarFallback>{p.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium flex-1">{p.name}</span>
                  {p.score && p.score > 0 && (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">
                      {p.score} pts
                    </Badge>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Start Button */}
          <Button 
            size="lg" 
            className="w-full mt-4 bg-white text-primary hover:bg-white/90 font-bold text-lg shadow-xl"
            onClick={handleStart}
          >
            Start Presentation <AppIcon name="Play" className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

  // ACTIVE QUESTION VIEW
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Simple Header for Active View */}
      <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6 bg-card sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <AppIcon name="Radio" size={16} className="text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-foreground">{session.presentation.title}</span>
            <span className="text-xs text-muted-foreground ml-2">• {session.code}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Timer Display */}
          {!showResults && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
              <AppIcon name="Clock" size={16} className="text-primary" />
              <span className="font-mono font-bold text-primary">{timer}s</span>
            </div>
          )}
          
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {currentQuestionIndex + 1} / {session.presentation.questions.length}
          </Badge>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => navigate("/dashboard")}
          >
            Exit
          </Button>
        </div>
      </header>

      {/* Timer Progress Bar */}
      {!showResults && !isPaused && currentQuestion && (
        <motion.div 
          className="h-1 bg-primary w-full origin-left"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: timer / (currentQuestion.timeLimit || 30) }}
          transition={{ duration: 1, ease: "linear" }}
        />
      )}

      <main className="flex-1 flex flex-col items-center p-4 md:p-6 lg:p-8 relative overflow-hidden">
        <div className="max-w-5xl w-full">
          {/* Question Display */}
          {currentQuestion && (
            <QuestionDisplay
              question={currentQuestion}
              responses={currentResponses}
              showResults={showResults}
            />
          )}

          {/* Results Section with Next Button */}
          {showResults && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card p-6 rounded-xl border border-border shadow-xl mt-8"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <AppIcon name="Trophy" size={24} className="text-yellow-600" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Ready for next question?</div>
                    <div className="text-sm text-muted-foreground">
                      {participants.slice(0, 3).map(p => p.name).join(', ')} and others are waiting
                    </div>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  onClick={handleNext}
                  className="min-w-[150px]"
                >
                  {currentQuestionIndex === session.presentation.questions.length - 1 ? (
                    <>View Results <AppIcon name="BarChart3" className="ml-2 h-4 w-4" /></>
                  ) : (
                    <>Next Question <AppIcon name="ChevronRight" className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Control Panel - Only show when not in results view or when paused? 
          You can decide when to show this */}
      {!showResults && (
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
      )}

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
  );
};

export default HostSession;