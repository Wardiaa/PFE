import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Star } from "lucide-react";
import cloud from "d3-cloud";
import { scaleLinear, scaleSqrt } from "d3-scale";
import AppIcon from "../../../components/AppIcon";
import ScalingQuestionDisplay from "./ScalingQuestionDisplay";
import RankingQuestionDisplay from "./RankingQuestionDisplay";
import Grid2x2QuestionDisplay from "./Grid2x2QuestionDisplay";
import VoteQuestionDisplay from "./VoteQuestionDisplay";
import type {
  Question,
  QuestionResponses,
  MultipleChoiceResponses,
  RatingResponses,
  OpenTextResponses,
  WordCloudResponses,
  ScalingResponses,
  RankingResponses,
  Grid2x2Responses,
  VoteResponses,
} from "../../../lib/presentation.types";

interface Word {
  text: string;
  count: number;
}

const WordCloudVisual: React.FC<{ words: Word[] }> = ({ words }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<any[]>([]);

  // The refined indigo/navy palette from your "fast creative" goal screenshot
  const colors = ["#2D366D", "#4B56A8", "#5D68BD", "#8892D6", "#94A3B8"];
  
  const getFontWeight = (count: number, maxCount: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 900; // Extra heavy for the main word
    if (ratio > 0.5) return 700; 
    return 500; 
  };

  useEffect(() => {
    if (!containerRef.current || words.length === 0) {
      setPositions([]);
      return;
    }

    const width = containerRef.current.offsetWidth;
    const height = 400;
    
    const counts = words.map(w => w.count);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    
    // Controlled scaling so words aren't too huge or too small
    const fontSizeScale = scaleLinear()
      .domain([minCount, maxCount])
      .range([22, 85]); 
    
    const sorted = [...words].sort((a, b) => b.count - a.count);
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    
    const positions_arr: Array<{text: string, size: number, x: number, y: number, color: string, fontWeight: number}> = [];
    const placedBounds: Array<{x: number, y: number, w: number, h: number}> = [];
    
    // Increased padding for better separation
    const PADDING = 18; // Solid padding between blocks
    
    const checkOverlap = (x: number, y: number, w: number, h: number): boolean => {
      for (const b of placedBounds) {
        const horizontalOverlap = Math.abs(x - b.x) < (w / 2 + b.w / 2 + PADDING);
        const verticalOverlap = Math.abs(y - b.y) < (h / 2 + b.h / 2 + PADDING);
        if (horizontalOverlap && verticalOverlap) return true;
      }
      return false;
    };
    
    // Sort by count descending to place larger words first (they're harder to place)
    for (let i = 0; i < sorted.length; i++) {
      const word = sorted[i];
      const size = fontSizeScale(word.count);
      const fontWeight = getFontWeight(word.count, maxCount);
      
      // Match exactly the font being rendered to avoid measurement drift
      ctx.font = `${fontWeight} ${size}px "Inter", "Plus Jakarta Sans", system-ui, sans-serif`;
      const metrics = ctx.measureText(word.text);
      
      // More generous dimensions to prevent any possible touching
      const wordW = metrics.width * 1.15; // 15% extra width buffer
      const wordH = size * 1.45; // 45% extra height buffer for descenders/ascenders
      
      let x = 0, y = 0, angle = 0, radius = 0;
      let foundSpot = false;
      let attempts = 0;
      let maxAttempts = 4000; // More attempts to find a good spot
      
      // Spiral outward with slower radius growth for more precise placement
      while (!foundSpot && attempts < maxAttempts) {
        // Wider oval shape (1.6x) to encourage horizontal spread
        x = Math.round(Math.cos(angle) * radius * 1.6);
        y = Math.round(Math.sin(angle) * radius);
        
        if (!checkOverlap(x, y, wordW, wordH)) {
          foundSpot = true;
        } else {
          angle += 0.12; // Smaller angle increment for finer search
          radius += 0.6; // Slower radius growth for more placement options
        }
        attempts++;
      }
      
      // If we couldn't find a spot after max attempts, place it at the edge
      // but still ensure minimal overlap by pushing it outward
      if (!foundSpot) {
        // Place at a larger radius as a fallback
        const fallbackAngle = (i * 137.5) * Math.PI / 180; // Golden angle
        const fallbackRadius = Math.max(width, height) / 2.5;
        x = Math.round(Math.cos(fallbackAngle) * fallbackRadius * 1.6);
        y = Math.round(Math.sin(fallbackAngle) * fallbackRadius);
      }
      
      positions_arr.push({
        text: word.text,
        size,
        x,
        y,
        color: colors[i % colors.length],
        fontWeight
      });
      
      placedBounds.push({ x, y, w: wordW, h: wordH });
    }
    
    // Auto-centering the group with fallback for empty array
    if (positions_arr.length === 0) {
      setPositions([]);
      return;
    }
    
    const avgX = positions_arr.reduce((acc, p) => acc + p.x, 0) / positions_arr.length;
    const avgY = positions_arr.reduce((acc, p) => acc + p.y, 0) / positions_arr.length;
    
    // Center the entire cloud in the container
    const centerX = width / 2;
    const centerY = height / 2;
    
    setPositions(positions_arr.map(p => ({
      ...p,
      x: p.x - avgX + centerX,
      y: p.y - avgY + centerY
    })));
  }, [words]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-slate-50/40 dark:bg-slate-950/20 rounded-2xl border border-border/30 overflow-hidden"
      style={{ height: '450px' }}
    >
      <AnimatePresence>
        {positions.map((word, i) => (
          <motion.span
            key={`${word.text}-${i}`}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.008, duration: 0.35 }}
            className="absolute select-none cursor-default whitespace-nowrap text-center flex items-center justify-center"
            style={{
              fontSize: `${word.size}px`,
              fontWeight: word.fontWeight,
              color: word.color,
              left: `${word.x}px`,
              top: `${word.y}px`,
              transform: `translate(-50%, -50%)`,
              lineHeight: 1.2, // Slightly increased line height
              letterSpacing: word.size > 50 ? '-0.06em' : '-0.02em',
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              textShadow: '0 1px 0 rgba(255,255,255,0.1)',
              zIndex: word.size > 60 ? 10 : 1 // Larger words on top
            }}
          >
            {word.text}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
};

// ── Compact participant names chip list ──────────────────────────────────────
const MAX_VISIBLE = 8;

interface ParticipantChipsProps {
  names: string[];
}

const ParticipantChips: React.FC<ParticipantChipsProps> = ({ names }) => {
  if (names.length === 0) return null;

  const visible = names.slice(0, MAX_VISIBLE);
  const overflow = names.length - MAX_VISIBLE;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {visible.map((name, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
          title={name}
        >
          <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-bold flex-shrink-0">
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[5rem] sm:max-w-[6rem] truncate">{name}</span>
        </span>
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
          +{overflow} more
        </span>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

interface QuestionDisplayProps {
  question: Question;
  responses: QuestionResponses;
  showResults?: boolean;
  showCorrectAnswer?: boolean;
  onResponseUpdate?: () => void;
  hideParticipantNames?: boolean;
  /** For vote questions: reveals the winner when true */
  revealVoteWinner?: boolean;
  /** Callback when host clicks "Reveal Winner" on vote question */
  onRevealVoteWinner?: () => void;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  responses,
  showResults = false,
  showCorrectAnswer = false,
  hideParticipantNames = false,
  revealVoteWinner = false,
  onRevealVoteWinner,
}) => {
  const questionImage = (question as any).image || (question as any).imageUrl;

  const isImageOnlyOption = (option: any): boolean => {
    const hasImage = !!option.imageUrl || !!option.image;
    const hasNoText = !option.text || option.text.trim() === '';
    return hasImage && hasNoText;
  };

  // Helper to get total responses count for grid-2x2
  const getGridTotalResponses = (): number => {
    const gridResponses = responses as Grid2x2Responses;
    return gridResponses?.totalResponses ?? gridResponses?.individualResponses?.length ?? 0;
  };

  // Helper to get total votes for vote questions
  const getVoteTotalVotes = (): number => {
    const voteResponses = responses as VoteResponses;
    if (voteResponses.total) return voteResponses.total;
    
    let total = 0;
    if (voteResponses) {
      Object.entries(voteResponses).forEach(([key, value]) => {
        if (key !== "individualResponses" && key !== "total" && typeof value === "number") {
          total += value;
        }
      });
    }
    return total;
  };

  const renderQuestionContent = () => {
    // Normalize to lowercase so raw DB values also match.
    switch ((question.type as string).toLowerCase()) {
      case "multiple-choice":
      case "single_choice":
      case "true_false":
      case "poll":
        return renderMultipleChoice(
          question,
          responses as MultipleChoiceResponses,
        );
      case "rating":
      case "rating-scale":
        return renderRating(responses as RatingResponses);
      case "open-text":
      case "open_text":
        return renderOpenText(responses as OpenTextResponses);
      case "word-cloud":
      case "word_cloud":
        return renderWordCloud(responses as WordCloudResponses);
      case "scaling":
        return renderScaling(responses as ScalingResponses);
      case "ranking":
        return renderRanking(responses as RankingResponses);
      case "grid-2x2":
      case "grid_2x2":
        return renderGrid2x2(responses as Grid2x2Responses);
      case "vote":
        return renderVote(responses as VoteResponses);
      default:
        return null;
    }
  };

  const renderMultipleChoice = (
    question: Question,
    responses: MultipleChoiceResponses,
  ) => {
    if (!("options" in question) || !question.options) return null;

    const totalResponses = Object.entries(responses).reduce((sum, [key, value]) => {
      if (key !== "individualResponses" && typeof value === "number") {
        return sum + value;
      }
      return sum;
    }, 0);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {question.options.map((option, index) => {
          const optionImage = (option as any).imageUrl || (option as any).image;
          const responseCount = (responses[option.id] as number) || 0;
          const percentage =
            totalResponses > 0
              ? Math.round((responseCount / totalResponses) * 100)
              : 0;
          const isCorrect = showCorrectAnswer && option.isCorrect;
          const imageOnly = isImageOnlyOption(option);

          const respondentNames: string[] =
            !hideParticipantNames && responses.individualResponses
              ? responses.individualResponses
                  .filter((r) => r.optionId === option.id && r.participantName)
                  .map((r) => r.participantName as string)
              : [];

          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08 }}
              className={`
                relative bg-card border-2 rounded-xl transition-all duration-300
                ${
                  isCorrect
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : "border-border hover:border-primary/50"
                }
                ${imageOnly ? "overflow-hidden p-0" : "p-3 sm:p-4 md:p-5"}
              `}
            >
              {imageOnly ? (
                <div className="relative">
                  <img
                    src={optionImage}
                    alt=""
                    className="w-full h-auto object-contain max-h-48"
                  />
                  <div className="absolute top-2 left-2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/90 flex items-center justify-center shadow-md">
                    <span className="text-sm sm:text-lg font-bold text-white">
                      {String.fromCharCode(65 + index)}
                    </span>
                  </div>
                  {isCorrect && (
                    <div className="absolute top-2 right-2">
                      <AppIcon
                        name="CheckCircle"
                        size={24}
                        className="text-green-600 bg-white rounded-full shadow-md"
                      />
                    </div>
                  )}
                  {showResults && (
                    <div className="p-3 sm:p-4 md:p-5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground">
                          {responseCount}{" "}
                          {responseCount === 1 ? "response" : "responses"}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-primary">
                          {percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            isCorrect ? "bg-green-500" : "bg-primary"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      {!hideParticipantNames && respondentNames.length > 0 && (
                        <ParticipantChips names={respondentNames} />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-base sm:text-lg font-semibold text-primary">
                        {String.fromCharCode(65 + index)}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg font-medium text-foreground flex-1 leading-snug">
                      {option.text}
                    </p>
                    {isCorrect && (
                      <AppIcon
                        name="CheckCircle"
                        size={20}
                        className="text-green-600 flex-shrink-0"
                      />
                    )}
                  </div>

                  {optionImage && (
                    <div className="mt-3 ml-10 sm:ml-13 overflow-hidden rounded-lg border border-border bg-muted/30 flex justify-center">
                      <img
                        src={optionImage}
                        alt=""
                        className="w-full max-h-28 sm:max-h-32 object-contain"
                      />
                    </div>
                  )}

                  {showResults && (
                    <div className="ml-10 sm:ml-13 mt-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground">
                          {responseCount}{" "}
                          {responseCount === 1 ? "response" : "responses"}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-primary">
                          {percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            isCorrect ? "bg-green-500" : "bg-primary"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      {!hideParticipantNames && respondentNames.length > 0 && (
                        <ParticipantChips names={respondentNames} />
                      )}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  // Star rating renderer - STARS ONLY
  const renderRating = (responses: RatingResponses) => {
    // Get the max scale from the question (default to 5)
    const scaleMax = (question as any).scale?.max || 5;
    const ratings = Array.from({ length: scaleMax }, (_, i) => i + 1);
    const total = Number(responses.total) || 0;

    // Calculate average rating (convert to stars)
    const averageRating = responses.average ? parseFloat(responses.average) : 0;
    const averageStars = averageRating.toFixed(1);

    return (
      <div className="space-y-4 md:space-y-6">
        {/* Stars grid - responsive flex wrap */}
        <div className="flex justify-center gap-2 sm:gap-3 md:gap-4 mb-4 md:mb-6 flex-wrap">
          {ratings.map((rating) => {
            const count = Number(responses[rating]) || 0;
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div key={rating} className="flex flex-col items-center gap-1.5 sm:gap-2">
                <div
                  className={`w-11 h-11 sm:w-13 sm:h-13 md:w-16 md:h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${
                    count > 0
                      ? "bg-amber-500 text-white shadow-lg scale-110"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Star className={`w-5 h-5 ${count > 0 ? "fill-white" : ""}`} />
                  <span className="text-xs font-bold">{rating}</span>
                </div>
                {showResults && (
                  <div className="text-center">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">
                      {percentage}%
                    </p>
                    <p className="text-xs text-muted-foreground">{count}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Labels */}
        <div className="flex items-center justify-between px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>{(question as any).labels?.min || "Low"}</span>
          <span>{(question as any).labels?.max || "High"}</span>
        </div>

        {showResults && (
          <div className="bg-card border-2 border-border rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AppIcon name="TrendingUp" size={18} />
                <span className="text-sm md:text-base font-medium text-foreground">
                  Average Rating
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-2xl md:text-3xl font-bold text-primary">
                  {averageStars}
                </span>
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <AppIcon name="Users" size={15} />
              <span>Based on {total} responses</span>
            </div>
          </div>
        )}

        {showResults &&
          responses.individualRatings &&
          responses.individualRatings.length > 0 &&
          !hideParticipantNames && (
            <div className="bg-card border-2 border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center gap-2 mb-3">
                <AppIcon name="List" size={18} />
                <span className="text-sm md:text-base font-medium text-foreground">
                  Individual Ratings
                </span>
              </div>
              <div className="max-h-32 sm:max-h-36 overflow-y-auto">
                <div className="flex flex-wrap gap-1.5">
                  {responses.individualRatings
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((rating, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-medium"
                        title={rating.participantName || undefined}
                      >
                        <Star className="w-3 h-3 fill-current" />
                        <span className="font-bold">{rating.rating}</span>
                        {rating.participantName && (
                          <span className="max-w-[5rem] truncate">
                            {rating.participantName}
                          </span>
                        )}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          )}
      </div>
    );
  };

  const renderOpenText = (responses: OpenTextResponses) => {
    return (
      <div className="bg-card border-2 border-border rounded-xl p-4 sm:p-6 md:p-8">
        <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg bg-secondary/10 flex items-center justify-center">
            <AppIcon name="MessageSquare" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-3 sm:mb-4">
              Participants can submit their text responses.
              {showResults
                ? " Recent submissions appear below."
                : " Waiting for responses..."}
            </p>
            <div className="flex items-center gap-2 text-sm md:text-base text-foreground">
              <AppIcon name="Users" size={16} />
              <span className="font-semibold">{responses.count || 0}</span>
              <span className="text-muted-foreground">responses received</span>
            </div>
          </div>
        </div>

        {showResults && responses.recent && responses.recent.length > 0 && (
          <div className="space-y-2 sm:space-y-3 max-h-52 sm:max-h-64 md:max-h-80 overflow-y-auto custom-scrollbar">
            {responses.recent.map((response: any, index: number) => {
              return (
                <div
                  key={index}
                  className="bg-muted/50 rounded-lg p-3 md:p-4 border border-border"
                >
                  <p className="text-sm md:text-base text-foreground">
                    {response.text}
                  </p>
                  <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(response.timestamp).toLocaleTimeString()}
                    </span>
                    {response.participantName && !hideParticipantNames && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <span className="w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                          {(response.participantName as string).charAt(0).toUpperCase()}
                        </span>
                        <span className="max-w-[7rem] truncate">{response.participantName}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderWordCloud = (responses: WordCloudResponses) => {
    return (
      <div className="bg-card border-2 border-border rounded-xl p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <AppIcon name="Cloud" size={24} className="text-indigo-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground">Word Cloud</h3>
              <p className="text-sm text-muted-foreground leading-tight">
                Watch the conversation grow in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-muted/30 px-4 py-2 rounded-full self-start">
             <div className="flex items-center gap-2 border-r border-border pr-4">
                <AppIcon name="Hash" size={14} className="text-muted-foreground" />
                <span className="font-bold text-sm">{responses.uniqueWords || 0} Words</span>
             </div>
             <div className="flex items-center gap-2">
                <Users size={14} className="text-muted-foreground" />
                <span className="font-bold text-sm">{(responses.individualWords?.length) || 0} Voters</span>
             </div>
          </div>
        </div>

        {showResults && responses.words && responses.words.length > 0 ? (
          <WordCloudVisual words={responses.words} />
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-muted/5 gap-3">
             <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
             <p className="text-muted-foreground font-medium italic">Collecting thoughts...</p>
          </div>
        )}

        {showResults && responses.individualWords && responses.individualWords.length > 0 && (
          <div className="mt-8">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-4 block">
              Recent Feed
            </span>
            <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto">
              {responses.individualWords
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 15)
                .map((submission, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold animate-in fade-in zoom-in duration-300"
                  >
                    {submission.words.join(", ")}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Scaling renderer ────────────────────────────────────────────────
  const renderScaling = (responses: ScalingResponses) => {
    const statements = (question as any).statements ?? [];
    return (
      <ScalingQuestionDisplay
        statements={statements}
        responses={responses}
        showResults={showResults}
        scale={(question as any).scale}
        labels={(question as any).labels}
      />
    );
  };

  // ── Ranking renderer ────────────────────────────────────────────────
  const renderRanking = (responses: RankingResponses) => {
    const options = (question as any).options ?? [];
    return (
      <RankingQuestionDisplay
        options={options}
        responses={responses}
        showResults={showResults}
      />
    );
  };

  // ── Grid 2x2 renderer ────────────────────────────────────────────────
  const renderGrid2x2 = (responses: Grid2x2Responses) => {
    return (
      <Grid2x2QuestionDisplay
        question={{
          text: question.text,
          description: question.description,
          image: questionImage,
          options: (question.options ?? []) as Array<{ id: string; text: string }>,
          xAxis: (question as any).xAxis,
          yAxis: (question as any).yAxis,
        }}
        responses={responses}
        showResults={showResults}
        hideParticipantNames={hideParticipantNames}
      />
    );
  };

  // ── Vote renderer ────────────────────────────────────────────────────
  const renderVote = (responses: VoteResponses) => {
    return (
      <VoteQuestionDisplay
        question={{
          text: question.text,
          description: question.description,
          image: questionImage,
          options: (question.options ?? []) as Array<{ id: string; text: string; imageUrl?: string | null }>,
        }}
        responses={responses}
        showResults={showResults}
        hideParticipantNames={hideParticipantNames}
        revealWinner={revealVoteWinner}
        onRevealWinner={onRevealVoteWinner}
      />
    );
  };

  return (
    <div className="w-full">
      <div className="mb-5 sm:mb-6 md:mb-8 lg:mb-10">
        <div className="flex items-start justify-between gap-2.5 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
          <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4 flex-1 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-primary flex items-center justify-center mt-0.5">
              <span className="text-sm sm:text-lg md:text-xl font-bold text-primary-foreground">
                {question.number}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                {question.text}
              </h2>
              {(question as any).isSpeedQuestion && (
                <p className="mt-1.5 text-sm font-semibold text-primary">
                  Speed · Top {(question as any).speedMaxAdvance ?? 3} advance
                </p>
              )}
            </div>
          </div>
          
          {/* Stats Badge & Reveal Winner Button - only for vote and grid-2x2 when showing results */}
          {showResults && (
            <div className="flex-shrink-0 flex items-center gap-3">
              {/* Reveal Winner Button - for vote questions only */}
              {question.type === "vote" && onRevealVoteWinner && (
                <button
                  onClick={onRevealVoteWinner}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border ${
                    revealVoteWinner 
                      ? "bg-primary border-primary text-white" 
                      : "bg-transparent border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {revealVoteWinner ? "Winner Revealed" : "Reveal Winner"}
                </button>
              )}
              
              {/* Stats Badge */}
              {(question.type === "grid-2x2" || question.type === "vote") && (
                <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">
                    {question.type === "vote" ? (
                      <>
                        {getVoteTotalVotes()} vote{getVoteTotalVotes() !== 1 ? 's' : ''}
                      </>
                    ) : (
                      <>
                        {getGridTotalResponses()} response{getGridTotalResponses() !== 1 ? 's' : ''}
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {question.description && (
          <p className="text-sm sm:text-base text-muted-foreground ml-10 sm:ml-13 md:ml-16 leading-relaxed italic">
            {question.description}
          </p>
        )}

        {questionImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 sm:mt-5 md:mt-6 ml-10 sm:ml-13 md:ml-16 rounded-xl overflow-hidden border border-border shadow-sm bg-muted/20"
          >
            <img
              src={questionImage}
              alt="Question"
              className="w-full h-auto max-h-48 sm:max-h-60 md:max-h-80 object-contain mx-auto"
            />
          </motion.div>
        )}
      </div>

      {renderQuestionContent()}
    </div>
  );
};

export default QuestionDisplay;