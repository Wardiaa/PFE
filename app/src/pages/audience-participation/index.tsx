import React, { useState } from 'react';

import SessionJoinForm from './components/SessionJoinForm';
import MultipleChoiceQuestion from './components/MultipleChoiceQuestion';
import OpenTextQuestion from './components/OpenTextQuestion';
import RatingScaleQuestion from './components/RatingScaleQuestion';
import WordCloudQuestion from './components/WordCloudQuestion';
import WaitingState from './components/WaitingState';
import SubmissionConfirmation from './components/SubmissionConfirmation';
import SessionEndedState from './components/SessionEndedState';
import ErrorState from './components/ErrorState';

type SessionState = 'join' | 'question' | 'submitted' | 'waiting' | 'ended' | 'error';

interface Question {
  id: string;
  type: 'multiple_choice' | 'open_text' | 'rating_scale' | 'word_cloud';
  text: string;
  description?: string;
  options?: Array<{ id: string; text: string }>;
  responseCount?: number;
  maxLength?: number;
  minLength?: number;
  maxWords?: number;
  scale?: { min: number; max: number };
  labels?: { min?: string; max?: string };
}

interface SessionData {
  code: string;
  title: string;
  presenter: string;
  isActive: boolean;
  currentQuestionIndex: number;
  questions: Question[];
  participantName?: string;
}

interface ErrorData {
  type?: string;
  message?: string;
}

interface MockSessions {
  [key: string]: SessionData;
}

const AudienceParticipation: React.FC = () => {
  const [sessionState, setSessionState] = useState<SessionState>('join');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<ErrorData | null>(null);

  const mockSessions: MockSessions = {
    'ABC123': {
      code: 'ABC123',
      title: 'Employee Engagement Survey 2026',
      presenter: 'Sarah Johnson',
      isActive: true,
      currentQuestionIndex: 0,
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          text: 'How satisfied are you with your current work-life balance?',
          description: 'Please select the option that best describes your experience',
          options: [
            { id: 'opt1', text: 'Very Satisfied' },
            { id: 'opt2', text: 'Satisfied' },
            { id: 'opt3', text: 'Neutral' },
            { id: 'opt4', text: 'Dissatisfied' },
            { id: 'opt5', text: 'Very Dissatisfied' }
          ],
          responseCount: 47
        },
        {
          id: 'q2',
          type: 'rating_scale',
          text: 'Rate the effectiveness of team communication',
          description: 'On a scale of 1 to 10, where 1 is poor and 10 is excellent',
          scale: { min: 1, max: 10 },
          labels: { min: 'Poor', max: 'Excellent' },
          responseCount: 45
        },
        {
          id: 'q3',
          type: 'open_text',
          text: 'What improvements would you suggest for our workplace culture?',
          description: 'Share your thoughts and ideas (minimum 20 characters)',
          minLength: 20,
          maxLength: 500,
          responseCount: 42
        },
        {
          id: 'q4',
          type: 'word_cloud',
          text: 'Describe our company culture in 3-5 words',
          description: 'Type words separated by spaces',
          maxWords: 5,
          responseCount: 48
        }
      ]
    },
    'XYZ789': {
      code: 'XYZ789',
      title: 'Product Feedback Session',
      presenter: 'Michael Chen',
      isActive: true,
      currentQuestionIndex: 0,
      questions: [
        {
          id: 'q1',
          type: 'rating_scale',
          text: 'How likely are you to recommend our product to others?',
          description: 'Net Promoter Score (0 = Not at all likely, 10 = Extremely likely)',
          scale: { min: 0, max: 10 },
          labels: { min: 'Not Likely', max: 'Very Likely' },
          responseCount: 32
        }
      ]
    }
  };

  const handleJoinSession = (joinData: { code: string; name: string }): void => {
    const session = mockSessions?.[joinData?.code];
    
    if (!session) {
      setError({
        type: 'invalid_code',
        message: 'Invalid session code. Please try ABC123 or XYZ789'
      });
      setSessionState('error');
      return;
    }

    if (!session?.isActive) {
      setError({
        type: 'session_not_found',
        message: 'This session has ended'
      });
      setSessionState('error');
      return;
    }

    setSessionData({
      ...session,
      participantName: joinData?.name
    });
    setCurrentQuestion(session?.questions?.[session?.currentQuestionIndex]);
    setSessionState('question');
  };

  const handleSubmitResponse = (_response: any): void => {
    setSessionState('submitted');
    
    setTimeout(() => {
      const nextQuestionIndex = (sessionData?.currentQuestionIndex ?? 0) + 1;
      
      if (sessionData && nextQuestionIndex < sessionData?.questions?.length) {
        setCurrentQuestion(sessionData?.questions?.[nextQuestionIndex]);
        setSessionData({
          ...sessionData,
          currentQuestionIndex: nextQuestionIndex
        });
        setSessionState('question');
      } else {
        setSessionState('waiting');
        
        setTimeout(() => {
          setSessionState('ended');
        }, 3000);
      }
    }, 2000);
  };

  const handleJoinNewSession = (): void => {
    setSessionState('join');
    setSessionData(null);
    setCurrentQuestion(null);
    setError(null);
  };

  const handleRetry = (): void => {
    setSessionState('join');
    setError(null);
  };

  const renderContent = (): React.ReactNode => {
    switch (sessionState) {
      case 'join':
        return <SessionJoinForm onJoin={handleJoinSession} />;

      case 'question':
        if (!currentQuestion) return null;
        
        switch (currentQuestion?.type) {
          case 'multiple_choice':
            return (
              <MultipleChoiceQuestion
                question={currentQuestion}
                onSubmit={handleSubmitResponse}
              />
            );
          case 'open_text':
            return (
              <OpenTextQuestion
                question={currentQuestion}
                onSubmit={handleSubmitResponse}
              />
            );
          case 'rating_scale':
            return (
              <RatingScaleQuestion
                question={currentQuestion}
                onSubmit={handleSubmitResponse}
              />
            );
          case 'word_cloud':
            return (
              <WordCloudQuestion
                question={currentQuestion}
                onSubmit={handleSubmitResponse}
              />
            );
          default:
            return null;
        }

      case 'submitted':
        return (
          <SubmissionConfirmation
            message="Your response has been recorded successfully"
          />
        );

      case 'waiting':
        return (
          <WaitingState
            message="Waiting for Next Question"
            showSpinner={true}
          />
        );

      case 'ended':
        return <SessionEndedState onJoinNew={handleJoinNewSession} />;

      case 'error':
        return <ErrorState error={error} onRetry={handleRetry} />;

      default:
        return null;
    }
  };

  return (
    <>
     
      <div className="min-h-screen bg-background">
        
        <main className="main-content">
          <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
            {sessionData && sessionState !== 'join' && sessionState !== 'error' && (
              <div className="max-w-2xl mx-auto mb-6 md:mb-8">
                <div className="bg-card rounded-xl p-4 md:p-6 shadow-sm border border-border">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base md:text-lg font-semibold text-foreground truncate">
                        {sessionData?.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Presented by {sessionData?.presenter}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-sm font-medium text-success whitespace-nowrap">
                        Live
                      </span>
                    </div>
                  </div>
                  
                  {sessionState === 'question' && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Question {sessionData?.currentQuestionIndex + 1} of {sessionData?.questions?.length}
                        </span>
                        <div className="flex gap-1">
                          {sessionData?.questions?.map((_, index) => (
                            <div
                              key={index}
                              className={`w-2 h-2 rounded-full transition-colors duration-250 ${
                                index === sessionData?.currentQuestionIndex
                                  ? 'bg-primary'
                                  : index < sessionData?.currentQuestionIndex
                                  ? 'bg-success' : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
      <style>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </>
  );
};

export default AudienceParticipation;