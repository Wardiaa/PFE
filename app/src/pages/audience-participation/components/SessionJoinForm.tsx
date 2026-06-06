// SessionJoinForm.tsx — split-screen, flat monochromatic left panel
// UPDATED: Accepts an optional `prefilledCode` prop. When provided (e.g. when
// the participant arrives via /audience-participation?code=XXXXXX), the code
// field is pre-filled and hidden so the participant only has to enter their
// name and click "Join". This makes the QR / shared-link flow a one-tap join
// instead of forcing the participant to re-type the code they were just sent.
// 
// The loading button stays active until the join operation
// fully completes (including navigation/session setup). The timeout that
// was prematurely resetting the button state has been removed. The
// `isJoining` state is now only cleared when an error occurs, not on
// success. The parent component's `onJoin` handler will unmount this form
// on success, and error handling resets the button.
import React, { useState, useEffect } from 'react';

interface JoinData {
  code: string;
  name: string;
}

interface SessionJoinFormProps {
  onJoin: (data: JoinData) => void;
  prefilledCode?: string;
  restoreSlot?: React.ReactNode;
}

interface Errors {
  sessionCode?: string;
  participantName?: string;
}

const SessionJoinForm: React.FC<SessionJoinFormProps> = ({ onJoin, prefilledCode, restoreSlot }) => {
  const [sessionCode, setSessionCode]         = useState((prefilledCode ?? '').toUpperCase());
  const [participantName, setParticipantName] = useState('');
  const [errors, setErrors]                   = useState<Errors>({});
  const [isJoining, setIsJoining]             = useState(false);

  // If the URL code arrives after first render, sync it in.
  useEffect(() => {
    if (prefilledCode) {
      setSessionCode(prefilledCode.toUpperCase());
    }
  }, [prefilledCode]);

  const hasPrefilledCode = !!prefilledCode && prefilledCode.trim().length >= 6;

  const validate = (): boolean => {
    const e: Errors = {};
    if (!sessionCode.trim()) e.sessionCode = 'Session code is required';
    else if (sessionCode.trim().length < 6) e.sessionCode = 'Must be at least 6 characters';
    if (!participantName.trim()) e.participantName = 'Your name is required';
    else if (participantName.trim().length < 2) e.participantName = 'Must be at least 2 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Set joining state immediately - this disables the button
    setIsJoining(true);
    
    // Clear any existing errors from previous failed attempts
    setErrors({});
    
    try {
      // Format the data
      const formattedCode = sessionCode.trim().toUpperCase();
      const formattedName = participantName.trim();
      
      // Call the parent's onJoin handler
      // IMPORTANT: The parent component is responsible for handling errors.
      // If onJoin throws an error, we catch it and reset the loading state.
      await onJoin({ code: formattedCode, name: formattedName });
      
      // IMPORTANT: We do NOT reset isJoining here on success.
      // The parent component will unmount this form when navigation occurs.
      // If we reset isJoining, the button would briefly become interactive again
      // before unmounting, which could lead to double submissions.
      // 
      // The isJoining state will be cleaned up when this component unmounts.
      
    } catch (error) {
      // Only reset the joining state on error, so the user can retry
      console.error("Join submission failed:", error);
      setIsJoining(false);
      
      // Optionally set a generic error message
      setErrors({ 
        ...errors, 
        sessionCode: error instanceof Error ? error.message : 'Failed to join session. Please try again.' 
      });
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setSessionCode(v);
    if (errors.sessionCode) setErrors({ ...errors, sessionCode: '' });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParticipantName(e.target.value);
    if (errors.participantName) setErrors({ ...errors, participantName: '' });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── LEFT PANEL — flat slate-950, no gradient ───────────── */}
      <div className="relative lg:w-5/12 bg-slate-950 flex flex-col justify-between p-10 lg:p-16 min-h-[260px] lg:min-h-screen overflow-hidden">

        {/* Subtle grid — same quiet treatment */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>

        {/* Blob — kept, just tinted to match slate */}
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-slate-800 rounded-full opacity-60 blur-3xl pointer-events-none" />

        {/* Top spacer (no logo) */}
        <div />

        {/* Headline */}
        <div className="relative z-10">
          <p className="text-slate-600 text-xs font-bold uppercase tracking-[0.3em] mb-5">
            Live session        
          </p>
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-[0.95] tracking-tighter mb-8">
            All<br />Set?
          </h2>

          {/* Simplified tags — just dots + text, no pill borders */}
          <div className="space-y-2.5">
            {['No signup needed', 'Instant access', 'Anonymous by default'].map(tag => (
              <div key={tag} className="flex items-center gap-2.5">
                <div className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0" />
                <span className="text-sm text-slate-400 font-medium">{tag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom label */}
        <p className="relative z-10 text-slate-700 text-[10px] font-mono tracking-widest uppercase">
          
        </p>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div className="lg:w-7/12 bg-white flex items-center justify-center px-8 py-16 lg:px-20">
        <div className="w-full max-w-md">

          <div className="mb-10">
            <h1 className="text-2xl font-black text-slate-950 tracking-tight mb-1.5">
              {hasPrefilledCode ? 'Almost there!' : 'Join a session'}
            </h1>
            <p className="text-sm text-slate-400">
              {hasPrefilledCode
                ? <>You're joining session <span className="font-mono font-bold text-slate-700">{sessionCode}</span>. Just tell us your name.</>
                : 'Enter the code your presenter shared with you.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Session code — only shown when not prefilled */}
            {!hasPrefilledCode && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                  Session Code
                </label>
                <input
                  type="text"
                  placeholder="ABC123"
                  value={sessionCode}
                  onChange={handleCodeChange}
                  maxLength={10}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  disabled={isJoining}
                  className={`
                    w-full px-4 py-3.5 rounded-xl border-2 bg-slate-50
                    font-mono text-xl font-black text-slate-900 tracking-[0.2em]
                    placeholder:font-sans placeholder:text-base placeholder:font-normal
                    placeholder:text-slate-300 placeholder:tracking-normal
                    focus:outline-none focus:bg-white transition-all duration-150
                    ${errors.sessionCode ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-indigo-500'}
                    ${isJoining ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                />
                {errors.sessionCode && (
                  <p className="text-xs text-red-500 font-semibold">{errors.sessionCode}</p>
                )}
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                Your Name
              </label>
              <input
                type="text"
                placeholder="What should we call you?"
                value={participantName}
                onChange={handleNameChange}
                maxLength={50}
                autoFocus={hasPrefilledCode}
                disabled={isJoining}
                className={`
                  w-full px-4 py-3.5 rounded-xl border-2 bg-slate-50
                  text-sm font-semibold text-slate-900
                  placeholder:font-normal placeholder:text-slate-300
                  focus:outline-none focus:bg-white transition-all duration-150
                  ${errors.participantName ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-indigo-500'}
                  ${isJoining ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              />
              {errors.participantName && (
                <p className="text-xs text-red-500 font-semibold">{errors.participantName}</p>
              )}
            </div>

            {/* Restore card slot — injected by the parent when a previous session exists */}
            {restoreSlot}

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isJoining}
                className={`
                  w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                  text-sm font-bold tracking-wide transition-all duration-200
                  ${isJoining
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-950 hover:bg-indigo-600 text-white shadow-md shadow-slate-200 hover:shadow-indigo-100 hover:-translate-y-0.5 active:translate-y-0'
                  }
                `}
              >
                {isJoining ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Joining...
                  </>
                ) : (
                  <>
                    Join session
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="mt-8 text-xs text-slate-400 leading-relaxed border-t border-slate-100 pt-6">
            No registration required. Your responses are anonymous unless you choose to share your name.
          </p>

        </div>
      </div>
    </div>
  );
};

export default SessionJoinForm;