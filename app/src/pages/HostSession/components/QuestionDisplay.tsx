import React from 'react';
import AppIcon from '../../../components/AppIcon';
import type {
    Question,
    QuestionResponses,
    MultipleChoiceResponses,
    RatingResponses,
    OpenTextResponses,
    WordCloudResponses
} from '../../../lib/presentation.types';

interface QuestionDisplayProps {
  question: Question;
  responses: QuestionResponses;
  onResponseUpdate?: () => void;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question, responses }) => {
  const renderQuestionContent = () => {
    switch (question.type) {
      case 'multiple-choice':
        return renderMultipleChoice(question, responses as MultipleChoiceResponses);
      case 'rating':
        return renderRating(responses as RatingResponses);
      case 'open-text':
        return renderOpenText(responses as OpenTextResponses);
      case 'word-cloud':
        return renderWordCloud(responses as WordCloudResponses);
      default:
        return null;
    }
  };

  const renderMultipleChoice = (
    question: Question, 
    responses: MultipleChoiceResponses
  ) => {
    if (!question.options) return null;
    
    const totalResponses = Object.values(responses).reduce((sum, count) => sum + count, 0);

    return (
      <div className="space-y-3 md:space-y-4">
        {question.options.map((option, index) => {
          const responseCount = responses[option.id] || 0;
          const percentage = totalResponses > 0 ? Math.round((responseCount / totalResponses) * 100) : 0;

          return (
            <div
              key={option.id}
              className="relative bg-card border-2 border-border rounded-xl p-4 md:p-6 transition-all duration-300 hover:border-primary/50"
            >
              <div className="flex items-center gap-3 md:gap-4 mb-2">
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-lg md:text-xl font-semibold text-primary">
                    {String.fromCharCode(65 + index)}
                  </span>
                </div>
                <p className="text-base md:text-lg lg:text-xl font-medium text-foreground flex-1">
                  {option.text}
                </p>
              </div>
              <div className="ml-13 md:ml-16">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs md:text-sm text-muted-foreground">
                    {responseCount} {responseCount === 1 ? 'response' : 'responses'}
                  </span>
                  <span className="text-sm md:text-base font-semibold text-primary">
                    {percentage}%
                  </span>
                </div>
                <div className="h-2 md:h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
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
            const rawCount = responses[rating];
            const count = typeof rawCount === 'number' ? rawCount : Number(rawCount || 0);
            const totalResponses = typeof responses.total === 'number' ? responses.total : Number(responses.total || 0);
            const percentage = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;

            return (
              <div key={rating} className="flex flex-col items-center gap-2">
                <button
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-xl md:text-2xl font-bold transition-all duration-300 ${
                    count > 0
                      ? 'bg-yellow-500 text-white shadow-lg scale-110'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {rating}
                </button>
                <div className="text-center">
                  <p className="text-xs md:text-sm font-semibold text-foreground">{percentage}%</p>
                  <p className="text-xs text-muted-foreground">{count}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="bg-card border-2 border-border rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AppIcon name="TrendingUp" size={20} />
              <span className="text-sm md:text-base font-medium text-foreground">Average Rating</span>
            </div>
            <span className="text-2xl md:text-3xl font-bold text-primary">
              {responses.average || '0.0'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <AppIcon name="Users" size={16} />
            <span>Based on {responses.total || 0} responses</span>
          </div>
        </div>
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
              Participants can submit their text responses. Recent submissions will appear below.
            </p>
            <div className="flex items-center gap-2 text-sm md:text-base text-foreground">
              <AppIcon name="Users" size={18} />
              <span className="font-semibold">{responses.count || 0}</span>
              <span className="text-muted-foreground">responses received</span>
            </div>
          </div>
        </div>
        {responses.recent && responses.recent.length > 0 && (
          <div className="space-y-3 max-h-64 md:max-h-80 overflow-y-auto">
            {responses.recent.map((response, index) => (
              <div
                key={index}
                className="bg-muted/50 rounded-lg p-3 md:p-4 border border-border"
              >
                <p className="text-sm md:text-base text-foreground">{response.text}</p>
                <span className="text-xs text-muted-foreground mt-2 block">
                  {new Date(response.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderWordCloud = (responses: WordCloudResponses) => {
    const sizes = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
    const colors = ['text-primary', 'text-secondary', 'text-yellow-600', 'text-green-600'];

    return (
      <div className="bg-card border-2 border-border rounded-xl p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <AppIcon name="Cloud" size={24} />
          </div>
          <div className="flex-1">
            <p className="text-base md:text-lg text-muted-foreground mb-4">
              Participants submit single words or short phrases. Popular responses appear larger.
            </p>
            <div className="flex items-center gap-2 text-sm md:text-base text-foreground">
              <AppIcon name="Hash" size={18} />
              <span className="font-semibold">{responses.uniqueWords || 0}</span>
              <span className="text-muted-foreground">unique words submitted</span>
            </div>
          </div>
        </div>
        {responses.words && responses.words.length > 0 && (
          <div className="flex flex-wrap gap-2 md:gap-3 justify-center items-center min-h-40 md:min-h-48">
            {responses.words.map((word, index) => {
              const sizeClass = sizes[Math.min(word.count - 1, sizes.length - 1)] || sizes[0];
              const colorClass = colors[index % colors.length];

              return (
                <span
                  key={index}
                  className={`${sizeClass} ${colorClass} font-semibold transition-all duration-300 hover:scale-110`}
                >
                  {word.text}
                </span>
              );
            })}
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
      </div>
      {renderQuestionContent()}
    </div>
  );
};

export default QuestionDisplay;