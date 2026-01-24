import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useContexts, type Context } from "../lib/mock-data";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Clock } from "lucide-react";

export default function ParticipantSession() {
  const { id } = useParams<{ id: string }>();
  const { getContext } = useContexts();
  const [context, setContext] = useState<Context | null>(null);
  
  // Participant State
  const [status, setStatus] = useState<'WAITING' | 'QUESTION' | 'ANSWERED' | 'RESULT'>('WAITING');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (id) {
      const ctx = getContext(id);
      if (ctx) setContext(ctx);
    }
  }, [id]);

  // Simulate receiving "Start Question" signal from host
  useEffect(() => {
    if (!context) return;
    
    // Mock simulation loop
    const flow = async () => {
      // Waiting in lobby
      await new Promise(r => setTimeout(r, 3000));
      setStatus('QUESTION');
      
      // Time to answer... simulated by user action or timeout
    };
    
    flow();
  }, [context]);

  if (!context) return <div className="p-10 text-center">Loading...</div>;

  const currentQ = context.questions[currentQIndex];

  const handleAnswer = (optionId: string) => {
    setSelectedOption(optionId);
    setStatus('ANSWERED');
    
    // Simulate waiting for result reveal
    setTimeout(() => {
       const correct = currentQ.options?.find(o => o.id === optionId)?.isCorrect;
       setIsCorrect(!!correct);
       setStatus('RESULT');
       
       // Move to next question after delay
       setTimeout(() => {
          if (currentQIndex < context.questions.length - 1) {
            setCurrentQIndex(i => i + 1);
            setSelectedOption(null);
            setStatus('QUESTION');
          } else {
            setStatus('WAITING'); // End screen
          }
       }, 5000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       {/* Top Bar */}
       <div className="bg-white p-4 shadow-sm flex items-center justify-between">
         <div className="font-bold">{context.title}</div>
         <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">1200 pts</div>
       </div>

       <main className="flex-1 p-4 flex flex-col justify-center max-w-md mx-auto w-full">
         <AnimatePresence mode="wait">
            {status === 'WAITING' && (
              <motion.div 
                key="waiting"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center space-y-6"
              >
                <div className="animate-bounce text-6xl">⏳</div>
                <h2 className="text-2xl font-bold">You're in!</h2>
                <p className="text-muted-foreground">Waiting for {currentQIndex === 0 ? "host to start" : "next question"}...</p>
                <div className="text-sm font-mono bg-white p-2 rounded-lg border inline-block">
                  You are: <span className="font-bold text-primary">Anonymous Guest</span>
                </div>
              </motion.div>
            )}

            {status === 'QUESTION' && (
               <motion.div 
                 key="question"
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                 className="space-y-6"
               >
                 <div className="text-center mb-8">
                   <div className="text-sm uppercase text-muted-foreground font-bold mb-2">Question {currentQIndex + 1}</div>
                   <h2 className="text-2xl font-bold leading-tight">{currentQ.title}</h2>
                 </div>

                 <div className="grid grid-cols-1 gap-3">
                   {currentQ.options?.map((opt, i) => (
                     <Button 
                       key={opt.id}
                       variant="outline" 
                       className="h-16 text-lg justify-start px-6 border-2 hover:border-primary hover:bg-primary/5 shadow-sm"
                       onClick={() => handleAnswer(opt.id)}
                     >
                       <span className="bg-muted w-8 h-8 rounded-full flex items-center justify-center mr-4 text-sm font-bold">
                         {String.fromCharCode(65 + i)}
                       </span>
                       {opt.text}
                     </Button>
                   ))}
                 </div>
               </motion.div>
            )}

            {status === 'ANSWERED' && (
              <motion.div 
                key="answered"
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-6"
              >
                <div className="text-6xl">🔒</div>
                <h2 className="text-2xl font-bold">Answer Locked!</h2>
                <p className="text-muted-foreground">Waiting for results...</p>
              </motion.div>
            )}

            {status === 'RESULT' && (
              <motion.div 
                key="result"
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className={`text-center space-y-6 p-8 rounded-2xl ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                <div className="text-6xl mb-4">
                  {isCorrect ? <Check className="h-20 w-20 mx-auto" /> : <X className="h-20 w-20 mx-auto" />}
                </div>
                <h2 className="text-3xl font-black">{isCorrect ? "Correct!" : "Wrong!"}</h2>
                <div className="text-xl font-bold bg-white/50 inline-block px-4 py-2 rounded-lg">
                  {isCorrect ? "+100 Points" : "+0 Points"}
                </div>
                <p className="font-medium opacity-80">
                  {isCorrect ? "Great job! Keep it up." : "Better luck next time!"}
                </p>
              </motion.div>
            )}
         </AnimatePresence>
       </main>
    </div>
  );
}