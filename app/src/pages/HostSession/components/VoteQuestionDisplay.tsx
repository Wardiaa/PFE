// VoteQuestionDisplay.tsx — Host view for voting question results
// Shows vote distribution with bar charts, reveals the winner, and supports "most voted" highlighting

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Trophy, BarChart3, EyeOff } from "lucide-react";

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
  /** When true, highlights the winning option  */
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
  // Ensure options is always an array with proper typing
  const options: VoteOption[] = question?.options ?? [];
  const questionImage = question?.image || question?.imageUrl;
  
  // Calculate total votes safely
  const totalVotes = useMemo(() => {
    if (!options.length) return 0;
    let total = 0;
    options.forEach((option) => {
      const val = responses[option.id];
      if (typeof val === 'number') {
        total += val;
      }
    });
    return total;
  }, [options, responses]);

  // Calculate winner (most voted option) - properly typed
  const winner: WinnerType | null = useMemo(() => {
    if (!showResults || totalVotes === 0 || !options.length) return null;
    
    let maxVotes = -1;
    let winnerOption: VoteOption | null = null;
    
    options.forEach((option) => {
      const votes = typeof responses[option.id] === 'number' ? (responses[option.id] as number) : 0;
      if (votes > maxVotes) {
        maxVotes = votes;
        winnerOption = option;
      }
    });
    
    return winnerOption && maxVotes > 0 
      ? { option: winnerOption, votes: maxVotes, percentage: Math.round((maxVotes / totalVotes) * 100) } 
      : null;
  }, [options, responses, showResults, totalVotes]);

  // Sort options by vote count (descending) for display
  const sortedOptions = useMemo(() => {
    if (!options.length) return [];
    return [...options].sort((a, b) => {
      const votesA = typeof responses[a.id] === 'number' ? (responses[a.id] as number) : 0;
      const votesB = typeof responses[b.id] === 'number' ? (responses[b.id] as number) : 0;
      return votesB - votesA;
    });
  }, [options, responses]);

  const isImageOnlyOption = (option: VoteOption): boolean => {
    const hasImage = !!option.imageUrl;
    const hasNoText = !option.text || option.text.trim() === '';
    return hasImage && hasNoText;
  };

  if (!showResults) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-10 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary mb-6">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Waiting for votes...</h3>
          <p className="text-muted-foreground mb-8">
            Participants are voting on {options.length} options.
          </p>
          <div className="space-y-3 max-w-md mx-auto">
            {options.map((option, i) => (
              <div key={option.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 text-left border border-border/50">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                  {String.fromCharCode(65 + i)}
                </div>
                <span className="text-sm font-medium truncate">{option.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      {questionImage && (
        <div className="mb-6 rounded-xl overflow-hidden border border-border bg-muted/20 flex justify-center p-2">
          <img src={questionImage} alt="" className="max-h-48 object-contain" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main results area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Vote Distribution
              </h3>
              
              {/* Reveal / Hide Winner Toggle Button - placed in header of results area */}
              {winner && onRevealWinner && (
                <button
                  onClick={onRevealWinner}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-all shadow-md"
                >
                  {revealWinner ? (
                    <>
                      <EyeOff size={14} />
                      Hide Winner
                    </>
                  ) : (
                    <>
                      <Trophy size={14} />
                      Reveal Winner
                    </>
                  )}
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {sortedOptions.map((option, idx) => {
                const votes = typeof responses[option.id] === 'number' ? (responses[option.id] as number) : 0;
                const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                const isWinner = revealWinner && winner !== null && winner.option.id === option.id;
                const imageOnly = isImageOnlyOption(option);
                
                return (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative ${isWinner ? 'bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 -mx-3' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {!imageOnly && (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isWinner ? 'bg-amber-500 text-white' : 'bg-primary/20 text-primary'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                          <span className={`text-sm font-medium ${isWinner ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'}`}>
                            {option.text}
                            {isWinner && <span className="ml-2 text-xs font-bold text-amber-500">★ WINNER</span>}
                          </span>
                          <span className="text-sm font-semibold text-primary tabular-nums">
                            {percentage}% ({votes})
                          </span>
                        </div>
                        
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full transition-all ${isWinner ? 'bg-amber-500' : 'bg-primary'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                        
                        {option.imageUrl && (
                          <div className="mt-2">
                            <img
                              src={option.imageUrl}
                              alt=""
                              className="max-h-16 rounded-lg object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: Winner Card (when revealed) */}
        <div className="lg:col-span-1">
          {revealWinner && winner !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white shadow-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={20} />
                <span className="text-sm font-bold uppercase tracking-wider">Winner</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{winner.option.text}</h3>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
                <span className="text-sm opacity-90">Votes received</span>
                <span className="text-2xl font-bold">{winner.votes}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm opacity-90">Percentage</span>
                <span className="text-xl font-bold">{winner.percentage}%</span>
              </div>
            </motion.div>
          )}

          {/* Quick stats card */}
          <div className="bg-card border border-border rounded-xl p-4 mt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total votes</span>
                <span className="font-medium">{totalVotes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Options</span>
                <span className="font-medium">{options.length}</span>
              </div>
              {winner !== null && sortedOptions.length > 1 && (
                <div className="flex justify-between text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Leading margin</span>
                  <span className="font-medium text-amber-500">
                    +{winner.votes - (typeof responses[sortedOptions[1]?.id] === 'number' ? (responses[sortedOptions[1].id] as number) : 0)} votes
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Individual responses (if not hiding names) */}
      {!hideParticipantNames && responses.individualResponses && responses.individualResponses.length > 0 && (
        <div className="mt-6 bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Recent Votes
          </h3>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {responses.individualResponses.slice(0, 20).map((vote, idx) => {
              const option = options.find(o => o.id === vote.optionId);
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                >
                  <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-bold">
                    {vote.participantName?.charAt(0).toUpperCase() || "?"}
                  </span>
                  <span>{vote.participantName}</span>
                  <span className="text-primary/60">→</span>
                  <span className="max-w-[100px] truncate">{option?.text || vote.optionId}</span>
                </span>
              );
            })}
          </div>
          {responses.individualResponses.length > 20 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              +{responses.individualResponses.length - 20} more votes
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default VoteQuestionDisplay;