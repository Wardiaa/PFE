import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Trophy, BarChart3, Activity } from "lucide-react";

interface VoteOption {
  id: string;
  text: string;
  imageUrl?: string | null;
}

interface IndividualVote {
  optionId: string;
  participantName?: string;
  timestamp: Date;
}

interface VoteResponses {
  [optionId: string]: number | IndividualVote[] | undefined;
  total?: number;
  individualResponses?: IndividualVote[];
}

interface WinnerType {
  option: VoteOption;
  votes: number;
  percentage: number;
}

interface VoteQuestionDisplayProps {
  question: {
    text: string;
    description?: string;
    image?: string | null;
    imageUrl?: string | null;
    options: VoteOption[];
  };
  responses: VoteResponses;
  showResults?: boolean;
  hideParticipantNames?: boolean;
  revealWinner?: boolean;
  onRevealWinner?: () => void;
}

const VoteQuestionDisplay: React.FC<VoteQuestionDisplayProps> = ({
  question,
  responses,
  showResults = true,
  hideParticipantNames = false,
  revealWinner = false,
  onRevealWinner,
}) => {
  const options: VoteOption[] = question?.options ?? [];
  const questionImage = question?.image || question?.imageUrl;
  
  const totalVotes = useMemo(() => {
    if (!options.length) return 0;
    return options.reduce((acc, opt) => acc + (typeof responses[opt.id] === 'number' ? (responses[opt.id] as number) : 0), 0);
  }, [options, responses]);

  const winner: WinnerType | null = useMemo(() => {
    if (!showResults || totalVotes === 0 || !options.length) return null;
    let maxVotes = -1;
    let winnerOption: VoteOption | null = null;
    options.forEach((option) => {
      const votes = typeof responses[option.id] === 'number' ? (responses[option.id] as number) : 0;
      if (votes > maxVotes) { maxVotes = votes; winnerOption = option; }
    });
    return winnerOption && maxVotes > 0 
      ? { option: winnerOption, votes: maxVotes, percentage: Math.round((maxVotes / totalVotes) * 100) } 
      : null;
  }, [options, responses, showResults, totalVotes]);

  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) => {
      const vA = typeof responses[a.id] === 'number' ? (responses[a.id] as number) : 0;
      const vB = typeof responses[b.id] === 'number' ? (responses[b.id] as number) : 0;
      return vB - vA;
    });
  }, [options, responses]);

  if (!showResults) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4">
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-10 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary mb-6">
            <Activity className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Poll Active</h3>
          <p className="text-muted-foreground mb-8">Participants are voting on {options.length} options.</p>
          <div className="space-y-3 max-w-md mx-auto">
            {options.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 text-left border border-border/50">
                <span className="text-xs font-bold opacity-50">{String.fromCharCode(65 + i)}</span>
                <span className="text-sm font-medium truncate">{opt.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      {/* Winner card - at the top like Scaling/Ranking */}
      <AnimatePresence>
        {revealWinner && winner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-12 p-14 rounded-3xl border-2 border-primary/30 bg-primary/[0.03] relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-5">
                <span className="bg-primary/10 text-primary text-base font-black px-5 py-2 rounded-full uppercase tracking-widest">
                  Top Result
                </span>
              </div>
              <h4 className="text-6xl font-bold tracking-tight text-foreground leading-tight">
                "{winner.option.text}" takes the lead.
              </h4>
              <p className="mt-5 text-2xl text-muted-foreground font-medium">
                Votes: <span className="text-primary font-bold text-4xl">{winner.votes}</span> ({winner.percentage}%)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Main Results Bar Charts (Left) */}
        <div className="lg:col-span-2 space-y-3">
          {sortedOptions.map((option, idx) => {
            const votes = typeof responses[option.id] === 'number' ? (responses[option.id] as number) : 0;
            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isWinner = revealWinner && winner?.option.id === option.id;

            return (
              <motion.div 
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: revealWinner && !isWinner ? 0.5 : 1,
                  scale: revealWinner && isWinner ? 1.01 : 1,
                }}
                transition={{ duration: 0.3 }}
                className={`relative overflow-hidden border-2 rounded-[1.5rem] transition-all duration-300 ${
                  isWinner ? 'border-primary bg-primary/[0.03]' : 'border-border bg-card'
                }`}
              >
                <div className="relative z-10 p-5">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-black w-8 h-8 rounded-xl flex items-center justify-center ${isWinner ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className={`text-lg font-bold ${isWinner ? 'text-primary' : 'text-foreground'}`}>
                        {option.text}
                        {isWinner && <span className="ml-3 text-[10px] bg-primary text-white px-2 py-0.5 rounded inline-block uppercase tracking-widest font-black">Winner</span>}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black tabular-nums text-foreground">{percentage}%</span>
                      <span className="text-[10px] block font-bold text-muted-foreground uppercase tracking-widest">{votes} Votes</span>
                    </div>
                  </div>
                  
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      className={`h-full rounded-full ${isWinner ? 'bg-primary' : 'bg-primary/60'}`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Sidebar: Live Analytics (Right) - No button here anymore */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-[2rem] p-8 space-y-8">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Live Analytics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-muted-foreground text-sm">Total responses</span>
                  <span className="text-xl font-black tabular-nums text-foreground">{totalVotes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-muted-foreground text-sm">Options defined</span>
                  <span className="text-xl font-black tabular-nums text-foreground">{options.length}</span>
                </div>
                
                {winner !== null && sortedOptions.length > 1 && (
                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-muted-foreground text-sm">Leading margin</span>
                      <span className="text-xl font-black text-primary tabular-nums">
                        +{winner.votes - (typeof responses[sortedOptions[1]?.id] === 'number' ? (responses[sortedOptions[1].id] as number) : 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual responses (Footer section) */}
      {!hideParticipantNames && responses.individualResponses && responses.individualResponses.length > 0 && (
        <div className="mt-8 bg-card border border-border rounded-[2rem] p-8">
          <div className="flex items-center gap-2 mb-6">
            <Users size={16} className="text-muted-foreground" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Activity stream</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {responses.individualResponses.slice(0, 15).map((vote, idx) => (
              <div key={idx} className="bg-muted/50 border border-border/50 px-4 py-2 rounded-2xl flex items-center gap-3">
                <div className="w-5 h-5 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-[9px] font-black">
                  {vote.participantName?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-foreground">{vote.participantName}</span>
                <span className="text-[10px] text-muted-foreground font-bold">picked {options.find(o => o.id === vote.optionId)?.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoteQuestionDisplay;