import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import AppIcon from '../../../components/AppIcon';

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
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isElimination: boolean;
  onToggleEliminationPanel: () => void;
  // New props for the action button
  showResultsActionButton?: boolean;
  onViewResults?: () => void;
  onShowWinner?: () => void;
  isLastQuestion?: boolean;
  isRevealingWinner?: boolean;
  hasWinner?: boolean;
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
  isFullscreen,
  onToggleFullscreen,
  isElimination,
  onToggleEliminationPanel,
  showResultsActionButton = false,
  onViewResults,
  onShowWinner,
  isLastQuestion = false,
  isRevealingWinner = false,
  hasWinner = false,
}) => {
  const [showQr, setShowQr] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const joinUrl = `${window.location.origin}/audience-participation?code=${sessionCode}`;

  // Close QR popover when clicking outside the toolbar wrapper
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowQr(false);
      }
    };
    if (showQr) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showQr]);

  const sep = <div className="w-px h-5 bg-border mx-0.5 flex-shrink-0" />;

  const iconBtn = (
    label: string,
    iconName: string,
    onClick: () => void,
    opts: {
      disabled?: boolean;
      active?: boolean;
      activeClass?: string;
      colorClass?: string;
    } = {}
  ) => (
    <button
      onClick={onClick}
      disabled={opts.disabled}
      title={label}
      className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0
        disabled:opacity-30 disabled:cursor-not-allowed
        ${opts.active
          ? opts.activeClass ?? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : opts.colorClass ?? 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
    >
      <AppIcon name={iconName as any} size={15} />
    </button>
  );

  // Render the action button - ONLY for the last question
  const renderActionButton = () => {
    // Only show when results are showing AND it's the last question
    if (!showResultsActionButton || !isLastQuestion) return null;

    if (isElimination) {
      return (
        <button
          onClick={onShowWinner}
          disabled={isRevealingWinner || hasWinner}
          className="h-9 flex items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-colors flex-shrink-0 bg-yellow-500 hover:bg-yellow-600 text-yellow-950"
        >
          {isRevealingWinner ? (
            <>
              <AppIcon name="Loader2" size={14} className="animate-spin" />
              <span className="hidden sm:inline">Revealing...</span>
            </>
          ) : (
            <>
              <AppIcon name="Crown" size={14} />
              <span className="hidden sm:inline">Show Winner</span>
              <span className="sm:hidden">Winner</span>
            </>
          )}
        </button>
      );
    } else {
      return (
        <button
          onClick={onViewResults}
          className="h-9 flex items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-colors flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <AppIcon name="BarChart3" size={14} />
          <span className="hidden sm:inline">View Results</span>
          <span className="sm:hidden">Results</span>
        </button>
      );
    }
  };

  // Determine if the panel should be fully visible
  const isFullyVisible = showResultsActionButton && isLastQuestion;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pb-4 sm:pb-5 pointer-events-none">
      <div ref={wrapperRef} className="pointer-events-auto w-full max-w-5xl px-4 flex flex-col items-center gap-2">

        {/* ── QR / Session code popover ── */}
        {showQr && (
          <div className="bg-card/98 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-5 flex flex-col items-center gap-3 animate-in slide-in-from-bottom-3 duration-200">
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <QRCodeSVG value={joinUrl} size={148} level="M" includeMargin={false} />
            </div>
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-0.5">Session Code</p>
              <p className="font-mono font-black text-3xl tracking-widest text-foreground">{sessionCode}</p>
              <p className="text-[11px] text-muted-foreground mt-1 truncate max-w-[220px]">
                {window.location.host}/audience-participation
              </p>
            </div>
          </div>
        )}

        {/* ── Main floating bar ── */}
        <div 
          className={`w-full transition-all duration-300 ${
            isFullyVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-[0.18] hover:opacity-100 focus-within:opacity-100 translate-y-1.5 hover:translate-y-0 focus-within:translate-y-0'
          }`}
        >
          <div className="flex items-center bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl px-2 py-1.5 gap-0.5">

            {/* ── Far left: Restart + End + Elimination history ── */}
            {iconBtn('Restart session', 'RotateCcw', onRestart)}
            {iconBtn('End session', 'X', onEnd, { colorClass: 'text-destructive/70 hover:bg-destructive/10 hover:text-destructive' })}
            {isElimination && iconBtn('Elimination history', 'History', onToggleEliminationPanel)}

            {sep}

            {/* ── Navigation ── */}
            {iconBtn('Previous question (←)', 'ChevronLeft', onPrevious, {
              disabled: currentQuestion === 1,
              colorClass: 'text-foreground hover:bg-muted',
            })}
            {iconBtn(isPaused ? 'Resume' : 'Pause', isPaused ? 'Play' : 'Pause', onPause, {
              colorClass: 'text-foreground hover:bg-muted',
            })}
            {iconBtn('Next question (→)', 'ChevronRight', onNext, {
              disabled: currentQuestion === totalQuestions,
              colorClass: 'text-foreground hover:bg-muted',
            })}

            {sep}

            {/* ── Show / Hide Results (with label) ── */}
            <button
              onClick={onToggleQuestionResults}
              title={isShowingResults ? 'Hide results' : 'Show results'}
              className={`h-9 flex items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition-colors flex-shrink-0 ${
                isShowingResults
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <AppIcon name={isShowingResults ? 'EyeOff' : 'BarChart3'} size={15} />
              <span className="hidden sm:inline whitespace-nowrap">
                {isShowingResults ? 'Hide Results' : 'Show Results'}
              </span>
            </button>

            {/* ── Hide participant names — icon toggle, right next to results ── */}
            <button
              onClick={() => onToggleHideParticipantNames(!hideParticipantNames)}
              title={hideParticipantNames ? 'Show participant names' : 'Hide participant names'}
              className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
                hideParticipantNames
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <AppIcon name={hideParticipantNames ? 'EyeOff' : 'Eye'} size={15} />
            </button>

            {/* ── Correct answer (MC only) ── */}
            {isMultipleChoice && (
              <button
                onClick={onToggleCorrectAnswer}
                title={showCorrectAnswer ? 'Hide correct answer' : 'Show correct answer'}
                className={`h-9 flex items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition-colors flex-shrink-0 ${
                  showCorrectAnswer
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <AppIcon name={showCorrectAnswer ? 'EyeOff' : 'Check'} size={15} />
                <span className="hidden sm:inline whitespace-nowrap">
                  {showCorrectAnswer ? 'Hide Answer' : 'Show Answer'}
                </span>
              </button>
            )}

            {sep}

            {/* ── Session code / QR button ── */}
            <button
              onClick={() => setShowQr((v) => !v)}
              title="Show session code & QR"
              className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
                showQr
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <AppIcon name="QrCode" size={15} />
            </button>

            {/* ── Fullscreen toggle ── */}
            <button
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="h-9 w-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <AppIcon name={isFullscreen ? 'Minimize' : 'Maximize'} size={15} />
            </button>

            {sep}

            {/* ── Question progress ── */}
            <div className="flex items-center gap-2 flex-shrink-0 px-1">
              {/* Fraction */}
              <span className="text-xs font-semibold tabular-nums text-foreground whitespace-nowrap">
                {currentQuestion}
                <span className="text-muted-foreground font-normal"> / {totalQuestions}</span>
              </span>
              {/* Mini segmented bar */}
              <div className="flex items-center gap-[3px]">
                {Array.from({ length: totalQuestions }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-colors duration-300 ${
                      i < currentQuestion ? 'bg-primary' : 'bg-border'
                    }`}
                    style={{ width: Math.max(4, Math.min(16, Math.floor(96 / totalQuestions))) }}
                  />
                ))}
              </div>
            </div>

            {/* ── Flexible spacer — pushes stats and action button to the far right ── */}
            <div className="flex-1 min-w-2" />

            {/* ── Far right: Action Button (only for last question) + Stats ── */}
            <div className="flex items-center gap-3 flex-shrink-0 pr-1">
              {/* Action Button - appears only for last question when results are showing */}
              {renderActionButton()}
              
              {/* Divider before stats (only if action button is shown) */}
              {isFullyVisible && <div className="w-px h-4 bg-border flex-shrink-0" />}
              
              {/* Participants count */}
              <div className="flex items-center gap-1.5">
                <AppIcon name="Users" size={14} className="text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-semibold tabular-nums text-foreground">{participantCount}</span>
              </div>
              
              <div className="w-px h-4 bg-border flex-shrink-0" />
              
              {/* Response progress */}
              <div className="flex items-center gap-1.5">
                <AppIcon name="CheckCircle2" size={14} className="text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-semibold tabular-nums text-foreground">{responseProgress}%</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;