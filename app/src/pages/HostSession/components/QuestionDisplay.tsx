import React from "react";
import { motion } from "framer-motion";
import AppIcon from "../../../components/AppIcon";
import type {
  Question,
  QuestionResponses,
  MultipleChoiceResponses,
  RatingResponses,
  OpenTextResponses,
  WordCloudResponses,
} from "../../../lib/presentation.types";

interface QuestionDisplayProps {
  question: Question;
  responses: QuestionResponses;
  showResults?: boolean;
  showCorrectAnswer?: boolean;
  onResponseUpdate?: () => void;
  hideParticipantNames?: boolean;
}

// ── Compact participant names chip list ──────────────────────────────────────
// Shows up to MAX_VISIBLE avatar-style chips in a wrap layout.
// Any extras are collapsed into a "+N more" chip.
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
          <span
            className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-bold flex-shrink-0"
          >
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[6rem] truncate">{name}</span>
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

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  responses,
  showResults = false,
  showCorrectAnswer = false,
  hideParticipantNames = false,
}) => {
  const questionImage = (question as any).image || (question as any).imageUrl;

  const renderQuestionContent = () => {
    switch (question.type) {
      case "multiple-choice":
        return renderMultipleChoice(
          question,
          responses as MultipleChoiceResponses,
        );
      case "rating":
        return renderRating(responses as RatingResponses);
      case "open-text":
        return renderOpenText(responses as OpenTextResponses);
      case "word-cloud":
        return renderWordCloud(responses as WordCloudResponses);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {question.options.map((option, index) => {
          const optionImage = (option as any).imageUrl || (option as any).image;
          const responseCount = (responses[option.id] as number) || 0;
          const percentage =
            totalResponses > 0
              ? Math.round((responseCount / totalResponses) * 100)
              : 0;
          const isCorrect = showCorrectAnswer && option.isCorrect;

          // Names that chose this option
          const respondentNames: string[] =
            !hideParticipantNames && responses.individualResponses
              ? responses.individualResponses
                  .filter((r) => r.optionId === option.id && r.participantName)
                  .map((r) => r.participantName as string)
              : [];

          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative bg-card border-2 rounded-xl p-4 md:p-6 transition-all duration-300
                ${
                  isCorrect
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : "border-border hover:border-primary/50"
                }
              `}
            >
              {/* Option header row */}
              <div className="flex items-center gap-3 md:gap-4 mb-2">
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-lg md:text-xl font-semibold text-primary">
                    {String.fromCharCode(65 + index)}
                  </span>
                </div>
                <p className="text-base md:text-lg lg:text-xl font-medium text-foreground flex-1">
                  {option.text}
                </p>
                {isCorrect && (
                  <AppIcon
                    name="CheckCircle"
                    size={24}
                    className="text-green-600 flex-shrink-0"
                  />
                )}
              </div>

              {/* Option image — reduced height so options with images stay compact */}
              {optionImage && (
                <div className="mt-4 ml-13 md:ml-16 overflow-hidden rounded-lg border border-border bg-muted">
                  <img
                    src={optionImage}
                    alt=""
                    className="w-full max-h-28 md:max-h-32 object-cover"
                  />
                </div>
              )}

              {/* Results bar + participant name chips */}
              {showResults && (
                <div className="ml-13 md:ml-16 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs md:text-sm text-muted-foreground">
                      {responseCount}{" "}
                      {responseCount === 1 ? "response" : "responses"}
                    </span>
                    <span className="text-sm md:text-base font-semibold text-primary">
                      {percentage}%
                    </span>
                  </div>
                  <div className="h-2 md:h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isCorrect ? "bg-green-500" : "bg-primary"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Compact participant name chips */}
                  {!hideParticipantNames && respondentNames.length > 0 && (
                    <ParticipantChips names={respondentNames} />
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderRating = (responses: RatingResponses) => {
    const ratings = [1, 2, 3, 4, 5];

    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex justify-center gap-2 md:gap-4 mb-6 md:mb-8">
          {ratings.map((rating) => {
            const count = Number(responses[rating]) || 0;
            const total = Number(responses.total) || 0;
            const percentage =
              total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div key={rating} className="flex flex-col items-center gap-2">
                <div
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-xl md:text-2xl font-bold transition-all duration-300 ${
                    count > 0
                      ? "bg-yellow-500 text-white shadow-lg scale-110"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {rating}
                </div>
                {showResults && (
                  <div className="text-center">
                    <p className="text-xs md:text-sm font-semibold text-foreground">
                      {percentage}%
                    </p>
                    <p className="text-xs text-muted-foreground">{count}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {showResults && (
          <div className="bg-card border-2 border-border rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AppIcon name="TrendingUp" size={20} />
                <span className="text-sm md:text-base font-medium text-foreground">
                  Average Rating
                </span>
              </div>
              <span className="text-2xl md:text-3xl font-bold text-primary">
                {responses.average || "0.0"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <AppIcon name="Users" size={16} />
              <span>Based on {responses.total || 0} responses</span>
            </div>
          </div>
        )}

        {showResults &&
          responses.individualRatings &&
          responses.individualRatings.length > 0 &&
          !hideParticipantNames && (
            <div className="bg-card border-2 border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center gap-2 mb-3">
                <AppIcon name="List" size={20} />
                <span className="text-sm md:text-base font-medium text-foreground">
                  Individual Ratings
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto">
                {/* Compact chip grid for rating respondents */}
                <div className="flex flex-wrap gap-1.5">
                  {responses.individualRatings
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((rating, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 text-xs font-medium"
                        title={rating.participantName || undefined}
                      >
                        <span className="font-bold">{rating.rating}★</span>
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
      <div className="bg-card border-2 border-border rounded-xl p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-lg bg-secondary/10 flex items-center justify-center">
            <AppIcon name="MessageSquare" size={24} />
          </div>
          <div className="flex-1">
            <p className="text-base md:text-lg text-muted-foreground mb-4">
              Participants can submit their text responses.
              {showResults
                ? " Recent submissions appear below."
                : " Waiting for responses..."}
            </p>
            <div className="flex items-center gap-2 text-sm md:text-base text-foreground">
              <AppIcon name="Users" size={18} />
              <span className="font-semibold">{responses.count || 0}</span>
              <span className="text-muted-foreground">responses received</span>
            </div>
          </div>
        </div>

        {showResults && responses.recent && responses.recent.length > 0 && (
          <div className="space-y-3 max-h-64 md:max-h-80 overflow-y-auto custom-scrollbar">
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
                        <span className="max-w-[8rem] truncate">{response.participantName}</span>
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
    const sizes = [
      "text-sm",
      "text-base",
      "text-lg",
      "text-xl",
      "text-2xl",
      "text-3xl",
    ];
    const colors = [
      "text-primary",
      "text-secondary",
      "text-yellow-600",
      "text-green-600",
    ];

    return (
      <div className="bg-card border-2 border-border rounded-xl p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <AppIcon name="Cloud" size={24} />
          </div>
          <div className="flex-1">
            <p className="text-base md:text-lg text-muted-foreground mb-4">
              Participants submit single words or short phrases. Popular
              responses appear larger.
            </p>
            <div className="flex items-center gap-2 text-sm md:text-base text-foreground">
              <AppIcon name="Hash" size={18} />
              <span className="font-semibold">
                {responses.uniqueWords || 0}
              </span>
              <span className="text-muted-foreground">
                unique words submitted
              </span>
            </div>
          </div>
        </div>

        {showResults && responses.words && responses.words.length > 0 && (
          <div className="flex flex-wrap gap-2 md:gap-3 justify-center items-center min-h-40 md:min-h-48">
            {responses.words.map((word, index) => {
              const sizeClass =
                sizes[Math.min(word.count - 1, sizes.length - 1)] || sizes[0];
              const colorClass = word.color || colors[index % colors.length];

              return (
                <span
                  key={index}
                  className={`${sizeClass} ${colorClass} font-semibold transition-all duration-300 hover:scale-110 cursor-default`}
                >
                  {word.text}
                </span>
              );
            })}
          </div>
        )}

        {showResults &&
          responses.individualWords &&
          responses.individualWords.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <AppIcon name="List" size={20} />
                <span className="text-sm md:text-base font-medium text-foreground">
                  Individual Submissions
                </span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {responses.individualWords
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .slice(0, 8)
                  .map((submission, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3 gap-2"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                        {submission.words.map((word, wordIdx) => (
                          <span
                            key={wordIdx}
                            className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium"
                          >
                            {word}
                          </span>
                        ))}
                        <span className="text-muted-foreground text-xs ml-1">
                          {new Date(submission.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {submission.participantName && !hideParticipantNames && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                          <span className="w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-bold">
                            {submission.participantName.charAt(0).toUpperCase()}
                          </span>
                          <span className="max-w-[6rem] truncate">{submission.participantName}</span>
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-6 md:mb-8 lg:mb-10">
        <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-lg md:text-xl font-bold text-primary-foreground">
              {question.number}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
            {question.text}
          </h2>
        </div>

        {question.description && (
          <p className="text-base md:text-lg text-muted-foreground ml-13 md:ml-16">
            {question.description}
          </p>
        )}

        {questionImage && (
          <div className="mt-6 ml-13 md:ml-16 overflow-hidden rounded-xl border border-border bg-muted/30 flex justify-center">
            <img
              src={questionImage}
              alt="Question visual"
              className="w-auto max-w-full max-h-60 md:max-h-64 lg:max-h-72 object-contain"
            />
          </div>
        )}
      </div>

      {renderQuestionContent()}
    </div>
  );
};

export default QuestionDisplay;
