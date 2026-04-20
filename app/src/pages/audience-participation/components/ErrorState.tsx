import React from 'react';
import Button from '../../../components/ui/Button2';
import AppIcon from '../../../components/AppIcon';

interface ErrorStateProps {
  error: {
    type?: string;
    message?: string;
  } | null;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  interface ErrorDetails {
    icon: string;
    title: string;
    message: string;
    color: string;
  }

  const getErrorDetails = (): ErrorDetails => {
    switch (error?.type) {
      case 'invalid_code':
        return {
          icon: 'AlertCircle',
          title: 'Invalid Session Code',
          message: 'The session code you entered is not valid. Please check and try again.',
          color: 'var(--color-destructive)'
        };
      case 'session_not_found':
        return {
          icon: 'Search',
          title: 'Session Not Found',
          message: 'This session does not exist or has been deleted.',
          color: 'var(--color-warning)'
        };
      case 'connection_error':
        return {
          icon: 'WifiOff',
          title: 'Connection Error',
          message: 'Unable to connect to the session. Please check your internet connection.',
          color: 'var(--color-destructive)'
        };
      default:
        return {
          icon: 'AlertTriangle',
          title: 'Something Went Wrong',
          message: error?.message || 'An unexpected error occurred. Please try again.',
          color: 'var(--color-destructive)'
        };
    }
  };

  const errorDetails = getErrorDetails();

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card rounded-xl p-8 md:p-10 lg:p-12 shadow-lg border border-border text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-destructive/10">
            <AppIcon name={errorDetails.icon as any} size={48} color={errorDetails.color} />
          </div>
        </div>

        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-3">
          {errorDetails.title}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mb-8">
          {errorDetails.message}
        </p>

        <div className="space-y-3">
           <Button
          onClick={onRetry}
          className="w-full py-3.5 rounded-xl bg-slate-950 hover:bg-indigo-600 text-white font-bold text-sm tracking-wide transition-all duration-200 shadow-md hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Try Again
        </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <AppIcon name="Info" size={18} className="shrink-0 mt-0.5" />
            <p className="text-left">
              If the problem persists, please contact the presenter or session organizer for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;