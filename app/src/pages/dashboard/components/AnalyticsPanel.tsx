// src/pages/dashboard/components/AnalyticsPanel.tsx
import React from 'react';
import {
  BarChart2,
  Users,
  Layers,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import { type DisplayContext } from '../../../lib/useContexts';

interface AnalyticsPanelProps {
  context: DisplayContext | null;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ context }) => {
  if (!context) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 md:p-8 lg:p-10">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <BarChart2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Context Selected
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Select a context from the library to view detailed analytics and
            engagement metrics
          </p>
        </div>
      </div>
    );
  }

  // Real calculated metrics
  // Participation rate: participants per session (capped at 100%)
  const avgParticipantsPerSession =
    context.sessionCount > 0
      ? Math.round(context.participantsCount / context.sessionCount)
      : 0;

  // Completion rate: percentage of sessions that ended (CLOSED/ENDED)
  // We approximate as: if status is 'published' (ACTIVE/CLOSED), treat as >= 1 completed session
  // A more precise rate would require querying sessions table directly
  const completionRate =
    context.sessionCount > 0 && context.displayStatus === 'published' ? 100 : 0;

  // Response rate: rough measure — participants / (sessions * 10 expected max) capped at 100%
  const responseRate =
    context.sessionCount > 0
      ? Math.min(
          100,
          Math.round(
            (context.participantsCount / (context.sessionCount * 10)) * 100
          )
        )
      : 0;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 md:p-5 lg:p-6 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg lg:text-xl font-semibold text-foreground mb-1 line-clamp-2">
              {context.title}
            </h3>
            <p className="text-sm text-muted-foreground">Analytics Overview</p>
          </div>
          <span
            className={`px-3 py-1 rounded-md text-xs font-medium flex-shrink-0 ${
              context.displayStatus === 'published'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            }`}
          >
            {context.displayStatus === 'published' ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>

      <div className="p-4 md:p-5 lg:p-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-muted rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Questions</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">
              {context.questionCount}
            </p>
          </div>

          <div className="bg-muted rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-secondary" />
              <span className="text-xs text-muted-foreground">Participants</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">
              {context.participantsCount}
            </p>
          </div>

          <div className="bg-muted rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Sessions</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">
              {context.sessionCount}
            </p>
          </div>

          <div className="bg-muted rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Avg / Session</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">
              {avgParticipantsPerSession}
            </p>
          </div>
        </div>

        {/* Rate bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">
                Response Rate
              </span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {context.participantsCount} participant
                  {context.participantsCount !== 1 ? 's' : ''}
                </span>
                <span className="font-semibold text-foreground">
                  {responseRate}%
                </span>
              </div>
              <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${responseRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">
                Session Status
              </span>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {context.sessionCount} session
                  {context.sessionCount !== 1 ? 's' : ''} run
                </span>
                <span className="font-semibold text-foreground">
                  {completionRate}%
                </span>
              </div>
              <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* No sessions yet state */}
        {context.sessionCount === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No sessions run yet. Present this context to start collecting data.
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPanel;
