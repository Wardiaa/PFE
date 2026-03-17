import React from 'react';
import { BarChart2, Users, Layers, TrendingUp, Activity, CheckCircle } from 'lucide-react';
import { type Context } from '../../../lib/types';

interface AnalyticsPanelProps {
  context: (Context & { 
    questionCount?: number; 
    sessionCount?: number; 
    displayStatus?: 'published' | 'draft' 
  }) | null;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ context }) => {
  if (!context) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 md:p-8 lg:p-10">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <BarChart2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Context Selected</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Select a context from the library to view detailed analytics and engagement metrics
          </p>
        </div>
      </div>
    );
  }

  // Mock data for stats
  const responseRate = context.participantsCount > 0 ? Math.min(100, Math.round((context.participantsCount / 300) * 100)) : 0;
  const completionRate = context.participantsCount > 0 ? Math.min(100, Math.round((context.participantsCount / 350) * 100)) : 0;
  const avgScore = context.type === 'QUIZ' ? Math.floor(Math.random() * 30) + 70 : null;
  const displayStatus = context.displayStatus || (context.status === 'ACTIVE' ? 'published' : 'draft');

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
          <span className={`px-3 py-1 rounded-md text-xs font-medium flex-shrink-0 ${
            displayStatus === 'published' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
          }`}>
            {displayStatus === 'published' ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>

      <div className="p-4 md:p-5 lg:p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-muted rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Questions</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{context.questionCount || 0}</p>
          </div>

          <div className="bg-muted rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-secondary" />
              <span className="text-xs text-muted-foreground">Participants</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{context.participantsCount}</p>
          </div>

          <div className="bg-muted rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Sessions</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{context.sessionCount || 0}</p>
          </div>

          <div className="bg-muted rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Avg. Rate</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{avgScore || responseRate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Response Rate</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Average</span>
                <span className="font-semibold text-foreground">{responseRate}%</span>
              </div>
              <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${responseRate}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Completion Rate</span>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Average</span>
                <span className="font-semibold text-foreground">{completionRate}%</span>
              </div>
              <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-green-600 rounded-full" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
          </div>
        </div>

        {context.type === 'QUIZ' && avgScore && (
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Average Score</span>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Overall</span>
                <span className="font-semibold text-foreground">{avgScore}%</span>
              </div>
              <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${avgScore}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPanel;