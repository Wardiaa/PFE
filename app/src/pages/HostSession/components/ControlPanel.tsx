import React, { useState } from 'react';
import AppIcon from '../../../components/AppIcon';
import { Button } from '../../../components/ui/button';
import { Switch } from '../../../components/ui/switch';

interface ControlPanelProps {
  sessionCode: string;
  participantCount: number;
  responseProgress: number;
  currentQuestion: number;
  totalQuestions: number;
  isPaused: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPause: () => void;
  onRestart: () => void;
  onEnd: () => void;
  onToggleQuestionResults: () => void;
  isShowingResults: boolean;
  showCorrectAnswer: boolean;
  onToggleCorrectAnswer: () => void;
  isMultipleChoice: boolean;
  hideParticipantNames: boolean;
  onToggleHideParticipantNames: (checked: boolean) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  sessionCode,
  participantCount,
  responseProgress,
  currentQuestion,
  totalQuestions,
  isPaused,
  onPrevious,
  onNext,
  onPause,
  onRestart,
  onEnd,
  onToggleQuestionResults,
  isShowingResults,
  showCorrectAnswer,
  onToggleCorrectAnswer,
  isMultipleChoice,
  hideParticipantNames,
  onToggleHideParticipantNames,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:bottom-6 lg:left-auto lg:right-6 lg:w-96 z-50">
      <div className="bg-card border-t-2 lg:border-2 border-border lg:rounded-xl shadow-2xl overflow-hidden">

        {/* ── Collapse toggle handle ── */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="w-full flex items-center justify-center gap-2 py-2 border-b border-border bg-muted/40 hover:bg-muted/70 transition-colors group"
          aria-label={collapsed ? 'Expand control panel' : 'Collapse control panel'}
        >
          <div className="w-8 h-1 rounded-full bg-border group-hover:bg-muted-foreground/60 transition-colors" />
          <AppIcon
            name={collapsed ? 'ChevronUp' : 'ChevronDown'}
            size={14}
            className="text-muted-foreground"
          />
          <div className="w-8 h-1 rounded-full bg-border group-hover:bg-muted-foreground/60 transition-colors" />
        </button>

        {/* ── Collapsed: compact quick-action bar (mobile-first) ── */}
        {collapsed && (
          <div className="flex items-center gap-2 px-3 py-2">
            {/* Session code pill */}
            <div className="flex items-center gap-1.5 bg-primary/10 rounded-lg px-2.5 py-1.5 flex-shrink-0">
              <AppIcon name="Radio" size={13} className="text-primary" />
              <span className="text-xs font-bold text-primary">{sessionCode}</span>
            </div>

            {/* Participants pill */}
            <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1.5 flex-shrink-0">
              <AppIcon name="Users" size={13} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">{participantCount}</span>
            </div>

            {/* Responses pill */}
            <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1.5 flex-shrink-0">
              <AppIcon name="CheckCircle2" size={13} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">{responseProgress}%</span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Essential nav controls always visible when collapsed */}
            <Button
              variant="outline"
              size="icon"
              icon="ChevronLeft"
              onClick={onPrevious}
              disabled={currentQuestion === 1}
              className="h-8 w-8 flex-shrink-0"
            />
            <Button
              variant="outline"
              size="icon"
              icon={isPaused ? 'Play' : 'Pause'}
              onClick={onPause}
              className="h-8 w-8 flex-shrink-0"
            />
            <Button
              variant="outline"
              size="icon"
              icon="ChevronRight"
              onClick={onNext}
              disabled={currentQuestion === totalQuestions}
              className="h-8 w-8 flex-shrink-0"
            />
          </div>
        )}

        {/* ── Panel body (collapsible) ── */}
        {!collapsed && (
          <div className="p-4 md:p-6 space-y-4 max-h-[80vh] overflow-y-auto">

            {/* Session code + live indicator */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <AppIcon name="Radio" size={18} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Session Code</p>
                  <p className="text-lg md:text-xl font-bold text-primary">{sessionCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-green-100 dark:bg-green-900/20 rounded-lg flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs md:text-sm font-medium text-green-600 dark:text-green-400">Live</span>
              </div>
            </div>

            {/* Participants & Progress */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <AppIcon name="Users" size={14} />
                  <span className="text-xs text-muted-foreground">Participants</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-foreground">{participantCount}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <AppIcon name="CheckCircle2" size={14} />
                  <span className="text-xs text-muted-foreground">Responses</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-foreground">{responseProgress}%</p>
              </div>
            </div>

            {/* Question Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Question Progress</span>
                <span className="text-sm font-semibold text-foreground">
                  {currentQuestion} / {totalQuestions}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                icon="ChevronLeft"
                onClick={onPrevious}
                disabled={currentQuestion === 1}
                className="flex-shrink-0"
              />
              <Button
                variant="outline"
                size="icon"
                icon={isPaused ? 'Play' : 'Pause'}
                onClick={onPause}
                className="flex-shrink-0"
              />
              <Button
                variant="outline"
                size="icon"
                icon="ChevronRight"
                onClick={onNext}
                disabled={currentQuestion === totalQuestions}
                className="flex-shrink-0"
              />
              <Button
                variant="default"
                icon={isShowingResults ? 'EyeOff' : 'BarChart3'}
                iconPosition="left"
                onClick={onToggleQuestionResults}
                className="flex-1 text-xs md:text-sm"
              >
                {isShowingResults ? 'Hide Results' : 'Show Results'}
              </Button>
            </div>

            {isMultipleChoice && (
              <div className="flex items-center gap-2">
                <Button
                  variant={showCorrectAnswer ? 'default' : 'outline'}
                  icon={showCorrectAnswer ? 'EyeOff' : 'Check'}
                  iconPosition="left"
                  onClick={onToggleCorrectAnswer}
                  className="flex-1 text-xs md:text-sm"
                >
                  {showCorrectAnswer ? 'Hide Answer' : 'Show Answer'}
                </Button>
              </div>
            )}

            {/* Show / Hide participant names */}
            <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-2">
                <AppIcon name="EyeOff" size={14} className="text-muted-foreground flex-shrink-0" />
                <span className="text-xs md:text-sm text-muted-foreground">Hide Participant Names</span>
              </div>
              <Switch
                checked={hideParticipantNames}
                onCheckedChange={onToggleHideParticipantNames}
              />
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                icon="RotateCcw"
                iconPosition="left"
                onClick={onRestart}
                className="flex-1 text-xs md:text-sm"
              >
                Restart
              </Button>
              <Button
                variant="destructive"
                icon="X"
                iconPosition="left"
                onClick={onEnd}
                className="flex-1 text-xs md:text-sm"
              >
                End
              </Button>
            </div>

            {/* Keyboard Shortcuts Hint – hidden on mobile (no keyboard) */}
            <div className="hidden md:block pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Use ← → arrow keys to navigate questions
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
