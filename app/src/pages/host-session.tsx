import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContexts, useParticipation, type Context,type  Question } from "../lib/mock-data";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Play, SkipForward, BarChart2, Trophy, Users, Clock, QrCode, Copy, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HostSession() {
  const { id } = useParams<{ id: string }>();
  const { getContext } = useContexts();
  const [context, setContext] = useState<Context | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // -1 = Lobby
  const [showResults, setShowResults] = useState(false);
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();

  // Mock participants joining
  const [participants, setParticipants] = useState([
    { name: "Alice", score: 0 },
    { name: "Bob", score: 0 },
    { name: "Charlie", score: 0 },
  ]);

  useEffect(() => {
    if (id) {
      const ctx = getContext(id);
      if (ctx) setContext(ctx);
    }
  }, [id]);

  useEffect(() => {
    if (currentQuestionIndex >= 0 && !showResults && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && currentQuestionIndex >= 0 && !showResults) {
      setShowResults(true);
    }
  }, [timer, currentQuestionIndex, showResults]);

  if (!context) return <div className="p-10 text-center">Loading context...</div>;

  const currentQuestion = context.questions[currentQuestionIndex];

  const handleStart = () => {
    setCurrentQuestionIndex(0);
    setTimer(context.questions[0].timeLimit || 30);
    setShowResults(false);
  };

  const handleNext = () => {
    if (currentQuestionIndex < context.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setTimer(context.questions[nextIndex].timeLimit || 30);
      setShowResults(false);
    } else {
      navigate(`/results/${context.id}`);
    }
  };

  // Lobby View
  if (currentQuestionIndex === -1) {
    return (
      <div className="min-h-screen bg-linear-to-br from-primary/90 to-accent/90 flex flex-col items-center justify-center text-white p-4">
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-8">
            <div>
              <Badge variant="outline" className="text-white border-white mb-4">Join at engage.app</Badge>
              <h1 className="text-6xl font-heading font-black tracking-tight mb-2">Code: {context.code}</h1>
              <p className="text-xl opacity-90">Waiting for players...</p>
            </div>
            
            <Card className="p-4 bg-white/10 border-white/20 backdrop-blur-md text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-32 w-32 bg-white rounded-lg flex items-center justify-center text-black">
                  <QrCode className="h-20 w-20" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm uppercase tracking-wider opacity-75">Scan to join</div>
                  <Button variant="secondary" size="sm" className="w-full">
                    <Copy className="mr-2 h-4 w-4" /> Copy Link
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Users className="h-5 w-5" />
                {participants.length} Joined
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              <AnimatePresence>
                {participants.map((p, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i} 
                    className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
                  >
                    <Avatar className="h-8 w-8 border border-white/20">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} />
                      <AvatarFallback>{p.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{p.name}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <Button size="lg" className="w-full mt-4 bg-white text-primary hover:bg-white/90 font-bold text-lg shadow-xl" onClick={handleStart}>
              Start Quiz <Play className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active Question View
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 border-b flex items-center justify-between px-6 bg-card">
        <div className="font-bold text-lg">{context.title}</div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {currentQuestionIndex + 1} / {context.questions.length}
          </Badge>
          <Button variant="destructive" size="sm" onClick={() => navigate("/dashboard")}>Exit</Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Timer Bar */}
        {!showResults && (
           <motion.div 
             className="absolute top-0 left-0 h-2 bg-primary w-full origin-left"
             initial={{ scaleX: 1 }}
             animate={{ scaleX: timer / (currentQuestion.timeLimit || 30) }}
             transition={{ duration: 1, ease: "linear" }}
           />
        )}

        <div className="max-w-5xl w-full space-y-8 z-10">
          <div className="text-center space-y-6">
             <div className="inline-flex items-center gap-2 text-2xl font-mono font-bold text-primary">
               <Clock className="h-6 w-6" /> {timer}s
             </div>
             
             <motion.h2 
               key={currentQuestion.title}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-4xl md:text-5xl font-heading font-black text-balance"
             >
               {currentQuestion.title}
             </motion.h2>

             {currentQuestion.media && (
                <div className="rounded-xl overflow-hidden shadow-2xl mx-auto max-w-lg">
                  <img src="https://images.unsplash.com/photo-1534081333815-ae5019106622?auto=format&fit=crop&q=80&w=800" alt="Question Media" className="w-full" />
                </div>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8">
            {currentQuestion.options?.map((opt, i) => {
              const isCorrect = showResults && opt.isCorrect;
              const isWrong = showResults && !opt.isCorrect;
              
              return (
                <motion.div
                  key={opt.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`
                    p-6 rounded-xl border-2 flex items-center justify-between text-xl font-bold shadow-sm transition-all
                    ${isCorrect ? 'bg-green-100 border-green-500 text-green-800 scale-105' : ''}
                    ${isWrong ? 'opacity-50' : 'bg-card border-border'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                      {String.fromCharCode(65 + i)}
                    </div>
                    {opt.text}
                  </div>
                  {showResults && opt.isCorrect && <CheckCircle className="text-green-600" />}
                </motion.div>
              );
            })}
          </div>

          {showResults && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card p-6 rounded-xl border shadow-xl mt-8"
            >
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <Trophy className="h-8 w-8 text-yellow-500" />
                   <div>
                     <div className="font-bold text-lg">Leaderboard Top 3</div>
                     <div className="text-sm text-muted-foreground">Alice (1200), Bob (900), Charlie (850)</div>
                   </div>
                 </div>
                 <Button size="lg" onClick={handleNext}>
                   {currentQuestionIndex === context.questions.length - 1 ? "Finish" : "Next Question"} <SkipForward className="ml-2 h-4 w-4" />
                 </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}