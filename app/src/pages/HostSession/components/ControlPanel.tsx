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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLButtonElement>(null);

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 846);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 846);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const joinUrl = `${window.location.origin}/audience-participation?code=${sessionCode}`;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowQr(false);
      }
    };
    if (showQr) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showQr]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        showMobileMenu &&
        sheetRef.current &&
        !sheetRef.current.contains(e.target as Node) &&
        !chevronRef.current?.contains(e.target as Node)
      ) {
        setShowMobileMenu(false);
        setShowQr(false);
      }
    };
    if (showMobileMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMobileMenu]);

  const [desktopRevealed, setDesktopRevealed] = useState(false);
  const desktopBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (desktopBarRef.current && !desktopBarRef.current.contains(e.target as Node)) {
        setDesktopRevealed(false);
      }
    };
    if (desktopRevealed) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [desktopRevealed]);

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

  const renderActionButton = () => {
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

  const isFullyVisible = showResultsActionButton && isLastQuestion;

  const menuRow = (
    label: string,
    iconName: string,
    onClick: () => void,
    opts: {
      disabled?: boolean;
      active?: boolean;
      activeClass?: string;
      destructive?: boolean;
      rightEl?: React.ReactNode;
    } = {}
  ) => (
    <button
      onClick={onClick}
      disabled={opts.disabled}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium
        disabled:opacity-30 disabled:cursor-not-allowed
        ${opts.destructive
          ? 'text-destructive hover:bg-destructive/10'
          : opts.active
            ? opts.activeClass ?? 'bg-primary/10 text-primary'
            : 'text-foreground hover:bg-muted'
        }`}
    >
      <AppIcon name={iconName as any} size={16} className="flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {opts.rightEl}
    </button>
  );

  const activeDot = (active: boolean) =>
    active ? <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" /> : null;

  return (
    <>
      {showMobileMenu && !isDesktop && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
      )}

      {showMobileMenu && !isDesktop && (
        <div
          ref={sheetRef}
          className="fixed bottom-[72px] left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-200 px-3"
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            {showQr && (
              <div className="mx-3 mt-3 bg-muted/50 rounded-xl p-4 flex flex-col items-center gap-3">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <QRCodeSVG value={joinUrl} size={140} level="M" includeMargin={false} />
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
            <div className="p-2 flex flex-col gap-0.5">
              {showResultsActionButton && isLastQuestion && (
                <div className="px-2 pb-1">
                  {isElimination ? (
                    <button
                      onClick={() => { onShowWinner?.(); setShowMobileMenu(false); }}
                      disabled={isRevealingWinner || hasWinner}
                      className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors bg-yellow-500 hover:bg-yellow-600 text-yellow-950 disabled:opacity-30"
                    >
                      {isRevealingWinner
                        ? <><AppIcon name="Loader2" size={16} className="animate-spin" />Revealing...</>
                        : <><AppIcon name="Crown" size={16} />Show Winner</>
                      }
                    </button>
                  ) : (
                    <button
                      onClick={() => { onViewResults?.(); setShowMobileMenu(false); }}
                      className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <AppIcon name="BarChart3" size={16} />View Results
                    </button>
                  )}
                </div>
              )}
              {menuRow(
                isShowingResults ? 'Hide Results' : 'Show Results',
                isShowingResults ? 'EyeOff' : 'BarChart3',
                onToggleQuestionResults,
                { active: isShowingResults, rightEl: activeDot(isShowingResults) }
              )}
              {menuRow(
                hideParticipantNames ? 'Show Participant Names' : 'Hide Participant Names',
                hideParticipantNames ? 'Eye' : 'EyeOff',
                () => onToggleHideParticipantNames(!hideParticipantNames),
                { active: hideParticipantNames, rightEl: activeDot(hideParticipantNames) }
              )}
              {isMultipleChoice && menuRow(
                showCorrectAnswer ? 'Hide Correct Answer' : 'Show Correct Answer',
                showCorrectAnswer ? 'EyeOff' : 'Check',
                onToggleCorrectAnswer,
                {
                  active: showCorrectAnswer,
                  activeClass: 'bg-green-600/10 text-green-700 dark:text-green-400',
                  rightEl: activeDot(showCorrectAnswer),
                }
              )}
              {isElimination && menuRow(
                'Elimination History',
                'History',
                () => { onToggleEliminationPanel(); setShowMobileMenu(false); }
              )}
              {menuRow(
                showQr ? 'Hide QR Code' : 'Show QR & Session Code',
                'QrCode',
                () => setShowQr((v) => !v),
                { active: showQr, rightEl: activeDot(showQr) }
              )}
              {menuRow(
                isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen',
                isFullscreen ? 'Minimize' : 'Maximize',
                () => { onToggleFullscreen(); setShowMobileMenu(false); }
              )}
              <div className="h-px bg-border mx-2 my-1" />
              {menuRow('Restart Session', 'RotateCcw', () => { onRestart(); setShowMobileMenu(false); })}
              {menuRow('End Session', 'X', () => { onEnd(); setShowMobileMenu(false); }, { destructive: true })}
            </div>
          </div>
        </div>
      )}

      {!isDesktop && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <button
                ref={chevronRef}
                onClick={() => setShowMobileMenu((v) => !v)}
                title={showMobileMenu ? 'Close menu' : 'More options'}
                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                  showMobileMenu
                    ? 'bg-muted text-foreground rotate-180'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                style={{ transition: 'transform 0.2s ease, background-color 0.15s' }}
              >
                <AppIcon name="ChevronUp" size={18} />
              </button>
              <div className="flex items-center bg-muted rounded-full p-1 gap-0.5">
                <button
                  onClick={onPrevious}
                  disabled={currentQuestion === 1}
                  title="Previous question"
                  className="h-9 w-9 rounded-full flex items-center justify-center transition-colors text-foreground hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <AppIcon name="ChevronLeft" size={18} />
                </button>
                <button
                  onClick={onPause}
                  title={isPaused ? 'Resume' : 'Pause'}
                  className="h-9 px-4 rounded-full flex items-center justify-center transition-colors bg-background text-foreground shadow-sm hover:bg-background/80"
                >
                  <AppIcon name={isPaused ? 'Play' : 'Pause'} size={18} />
                </button>
                <button
                  onClick={onNext}
                  disabled={currentQuestion === totalQuestions}
                  title="Next question"
                  className="h-9 w-9 rounded-full flex items-center justify-center transition-colors text-foreground hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <AppIcon name="ChevronRight" size={18} />
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <AppIcon name="Users" size={15} className="text-muted-foreground" />
                <span className="text-sm font-semibold tabular-nums text-foreground">{participantCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* desktop - KEPT EXACTLY THE SAME STRUCTURE with flex class */}
      {isDesktop && (
        <div className="flex fixed bottom-0 left-0 right-0 z-50 flex-col items-center pb-5 pointer-events-none">
          <div ref={wrapperRef} className="pointer-events-auto w-full max-w-5xl px-4 flex flex-col items-center gap-2">
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
            <div
              ref={desktopBarRef}
              onClick={() => setDesktopRevealed(true)}
              className={`w-full transition-all duration-300 cursor-pointer ${
                isFullyVisible || desktopRevealed
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-[0.18] hover:opacity-100 focus-within:opacity-100 translate-y-1.5 hover:translate-y-0 focus-within:translate-y-0'
              }`}
            >
              <div className="flex items-center bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl px-2 py-1.5 gap-0.5">
                {iconBtn('End session', 'X', onEnd)}
                {iconBtn('Restart session', 'RotateCcw', onRestart)}
                {isElimination && iconBtn('Elimination history', 'History', onToggleEliminationPanel)}
                {sep}
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
                <button
                  onClick={onToggleFullscreen}
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  className="h-9 w-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <AppIcon name={isFullscreen ? 'Minimize' : 'Maximize'} size={15} />
                </button>
                {sep}
                <div className="flex items-center gap-2 flex-shrink-0 px-1">
                  <span className="text-xs font-semibold tabular-nums text-foreground whitespace-nowrap">
                    {currentQuestion}
                    <span className="text-muted-foreground font-normal"> / {totalQuestions}</span>
                  </span>
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
                <div className="flex-1 min-w-2" />
                <div className="flex items-center gap-3 flex-shrink-0 pr-1">
                  {renderActionButton()}
                  {isFullyVisible && <div className="w-px h-4 bg-border flex-shrink-0" />}
                  <div className="flex items-center gap-1.5">
                    <AppIcon name="Users" size={14} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-semibold tabular-nums text-foreground">{participantCount}</span>
                  </div>
                  <div className="w-px h-4 bg-border flex-shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <AppIcon name="CheckCircle2" size={14} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-semibold tabular-nums text-foreground">{responseProgress}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ControlPanel;