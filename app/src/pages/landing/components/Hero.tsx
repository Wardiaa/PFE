import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ArrowRight, Zap } from 'lucide-react';
import { ContainerScroll } from '../../../components/ui/container-scroll-animation';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MCOption {
  id: string;
  label: string;
  text: string;
  isCorrect?: boolean;
}

interface ResponseEntry {
  participantName: string;
  optionId: string;
  timestamp: number;
}

// ─── Static data ─────────────────────────────────────────────────────────────

const QUESTION_TEXT = "What's your biggest challenge with remote engagement?";

const OPTIONS: MCOption[] = [
  { id: 'a', label: 'A', text: 'Keeping participants focused',   isCorrect: true  },
  { id: 'b', label: 'B', text: 'Technical issues / lag',          isCorrect: false },
  { id: 'c', label: 'C', text: 'Getting honest feedback',         isCorrect: false },
  { id: 'd', label: 'D', text: 'Managing Q&A effectively',        isCorrect: false },
];

// The simulated "incoming" responses — each one arrives with a delay
const INCOMING_RESPONSES: ResponseEntry[] = [
  { participantName: 'Alice',   optionId: 'a', timestamp: 0    },
  { participantName: 'Marcus',  optionId: 'b', timestamp: 900  },
  { participantName: 'Priya',   optionId: 'a', timestamp: 1700 },
  { participantName: 'Jerome',  optionId: 'c', timestamp: 2400 },
  { participantName: 'Sofia',   optionId: 'a', timestamp: 3100 },
  { participantName: 'Lena',    optionId: 'd', timestamp: 3800 },
  { participantName: 'Kwame',   optionId: 'b', timestamp: 4500 },
  { participantName: 'Yuki',    optionId: 'a', timestamp: 5200 },
  { participantName: 'Carlos',  optionId: 'c', timestamp: 5900 },
  { participantName: 'Aisha',   optionId: 'a', timestamp: 6600 },
  { participantName: 'Dev',     optionId: 'b', timestamp: 7300 },
  { participantName: 'Hannah',  optionId: 'a', timestamp: 8000 },
];

const TOTAL_PARTICIPANTS = 24;
const SESSION_CODE = 'ABC123';
const SESSION_TITLE = 'Product Strategy Q3';
const INITIAL_TIMER = 10;

// ─── Helper ──────────────────────────────────────────────────────────────────

function countByOption(responses: ResponseEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};
  OPTIONS.forEach(o => { counts[o.id] = 0; });
  responses.forEach(r => { counts[r.optionId] = (counts[r.optionId] || 0) + 1; });
  return counts;
}

// ─── Sub-components (self-contained, no external deps) ───────────────────────

/** Mimics the host's QuestionDisplay for multiple-choice with no images */
const HostQuestionDisplay: React.FC<{
  counts: Record<string, number>;
  totalResponses: number;
  showResults: boolean;
  showCorrectAnswer: boolean;
  latestResponder: string | null;
}> = ({ counts, totalResponses, showResults, showCorrectAnswer, latestResponder }) => {
  return (
    <div className="w-full">
      {/* Question header — mirrors QuestionDisplay header */}
      <div className="mb-4">
        <div className="flex items-start gap-2.5 mb-2">
          {/* Question number badge */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mt-0.5">
            <span className="text-sm font-bold text-white">1</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            {QUESTION_TEXT}
          </h2>
        </div>
        <p className="text-xs text-slate-500 ml-10">
          Select the option that resonates most with your team.
        </p>
      </div>

      {/* Options grid — mirrors QuestionDisplay renderMultipleChoice */}
      <div className="grid grid-cols-1 gap-2">
        {OPTIONS.map((option, index) => {
          const responseCount = counts[option.id] || 0;
          const percentage = totalResponses > 0
            ? Math.round((responseCount / totalResponses) * 100)
            : 0;
          const isCorrect = showCorrectAnswer && option.isCorrect;

          return (
            <div
              key={option.id}
              className={`relative border-2 rounded-xl p-2.5 transition-all duration-300 ${
                isCorrect
                  ? 'border-green-500 bg-green-50'
                  : 'border-slate-200 bg-white hover:border-indigo-300'
              }`}
            >
              {/* Option header row */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-indigo-600">{option.label}</span>
                </div>
                <p className="text-xs font-medium text-slate-800 flex-1 leading-snug">
                  {option.text}
                </p>
                {isCorrect && (
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M2.25 12a9.75 9.75 0 1119.5 0 9.75 9.75 0 01-19.5 0zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {/* Results bar — only when showResults */}
              {showResults && (
                <div className="ml-9">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400">
                      {responseCount} {responseCount === 1 ? 'response' : 'responses'}
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-600">{percentage}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isCorrect ? 'bg-green-500' : 'bg-indigo-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};



// ─── Main HostSessionPreview ─────────────────────────────────────────────────

const HostSessionPreview: React.FC = () => {
  const [responses, setResponses] = useState<ResponseEntry[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [timer, setTimer] = useState(INITIAL_TIMER);
  const [timerActive, setTimerActive] = useState(true);
  const [latestResponder, setLatestResponder] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [isPaused] = useState(false);

  const responseIndexRef = useRef(0);
  const timerRef = useRef(INITIAL_TIMER);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Timer countdown ──
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      timerRef.current = Math.max(0, timerRef.current - 1);
      setTimer(timerRef.current);
      if (timerRef.current <= 0) {
        clearInterval(interval);
        setTimerActive(false);
        setShowResults(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // ── Simulate incoming responses ──
  const scheduleNextResponse = () => {
    const idx = responseIndexRef.current;
    if (idx >= INCOMING_RESPONSES.length) return;

    const current = INCOMING_RESPONSES[idx];
    const next = INCOMING_RESPONSES[idx + 1];
    const delay = next ? next.timestamp - current.timestamp : 1500;

    cycleRef.current = setTimeout(() => {
      const entry = INCOMING_RESPONSES[responseIndexRef.current];
      setResponses(prev => [...prev, entry]);
      setLatestResponder(entry.participantName);
      setToastVisible(true);

      // Hide toast after 1.2s
      setTimeout(() => setToastVisible(false), 1200);

      responseIndexRef.current += 1;
      scheduleNextResponse();
    }, delay);
  };

  useEffect(() => {
    // Start first response after 800ms
    cycleRef.current = setTimeout(() => {
      scheduleNextResponse();
    }, 800);

    return () => {
      if (cycleRef.current) clearTimeout(cycleRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-cycle: reset after all responses done + show correct answer ──
  useEffect(() => {
    if (responseIndexRef.current >= INCOMING_RESPONSES.length && !timerActive) {
      // After showing results + correct answer for a while, reset everything
      const t1 = setTimeout(() => setShowCorrectAnswer(true), 1500);
      const t2 = setTimeout(() => {
        // Full reset
        setResponses([]);
        setShowResults(false);
        setShowCorrectAnswer(false);
        setTimer(INITIAL_TIMER);
        timerRef.current = INITIAL_TIMER;
        setTimerActive(true);
        setLatestResponder(null);
        setToastVisible(false);
        responseIndexRef.current = 0;
        scheduleNextResponse();
      }, 5000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive]);

  const counts = countByOption(responses);
  const totalResponses = responses.length;
  const responseProgress = Math.round((totalResponses / TOTAL_PARTICIPANTS) * 100);

  return (
    <div className="w-full h-full bg-slate-50 flex flex-col relative overflow-hidden rounded-2xl">

      {/* ── Header — mirrors HostSession <header> ── */}
      <header className="bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between flex-shrink-0">
        {/* Left: logo + session title + code */}
        <div className="flex items-center gap-2">
          
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-bold text-slate-800 leading-tight">{SESSION_TITLE}</span>
            <span className="text-[9px] text-slate-400 font-mono">• {SESSION_CODE}</span>
          </div>
        </div>

        {/* Right: real-time dot, timer, Q counter, exit */}
        <div className="flex items-center gap-1.5">
          {/* Real-time indicator */}
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] text-slate-400">Real-time</span>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${isPaused ? 'bg-yellow-100' : 'bg-slate-100'}`}>
            <svg className="w-2.5 h-2.5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="font-mono font-bold text-indigo-600 text-[10px]">{timer}s</span>
          </div>

          {/* Question counter badge */}
          <span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-[9px] font-semibold text-slate-600">
            1/5
          </span>

          {/* Exit button */}
          <button className="px-2 py-0.5 rounded-md bg-red-500 text-white text-[9px] font-bold">
            Exit
          </button>
        </div>
      </header>

      {/* ── Timer progress bar ── */}
      <div className="h-0.5 w-full bg-slate-100 flex-shrink-0">
        <div
          className="h-full bg-indigo-600 transition-all duration-1000 ease-linear"
          style={{ width: `${(timer / INITIAL_TIMER) * 100}%` }}
        />
      </div>

      {/* ── Main content — mirrors HostSession <main> ── */}
      <main className="flex-1 overflow-y-auto p-3 pb-16">
        <div className="max-w-full">

          {/* QuestionDisplay */}
          <HostQuestionDisplay
            counts={counts}
            totalResponses={totalResponses}
            showResults={showResults}
            showCorrectAnswer={showCorrectAnswer}
            latestResponder={latestResponder}
          />

          {/* "Ready for next question?" banner — mirrors showResults block in index.tsx */}
          {showResults && (
            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-yellow-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Ready for next question?</p>
                  <p className="text-[9px] text-slate-400">Alice, Marcus, Priya and others are waiting</p>
                </div>
              </div>
              <button className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold whitespace-nowrap">
                Next Question
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── ControlPanel — mimics the fixed bottom panel ── */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 shadow-lg z-20">
        {/* Drag handle */}
        <div className="flex items-center justify-center gap-2 py-1 border-b border-slate-100 bg-slate-50">
          <div className="w-6 h-0.5 rounded-full bg-slate-200" />
          <svg className="w-2.5 h-2.5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <div className="w-6 h-0.5 rounded-full bg-slate-200" />
        </div>

        <div className="px-3 py-2 flex items-center gap-2">
          {/* Session code pill */}
          <div className="flex items-center gap-1 bg-indigo-50 rounded-md px-2 py-1 flex-shrink-0">
            <svg className="w-2.5 h-2.5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/>
            </svg>
            <span className="text-[9px] font-bold text-indigo-600">{SESSION_CODE}</span>
          </div>

          {/* Participants pill */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-md px-2 py-1 flex-shrink-0">
            <svg className="w-2.5 h-2.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/>
            </svg>
            <span className="text-[9px] font-semibold text-slate-700">{TOTAL_PARTICIPANTS}</span>
          </div>

          {/* Responses pill */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-md px-2 py-1 flex-shrink-0">
            <svg className="w-2.5 h-2.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span className="text-[9px] font-semibold text-slate-700">{responseProgress}%</span>
          </div>

          <div className="flex-1" />

          {/* Navigation controls — mirrors ControlPanel collapsed nav */}
          <button className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center bg-white opacity-40">
            <svg className="w-3 h-3 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center bg-white">
            <svg className="w-3 h-3 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
            </svg>
          </button>
          <button className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center bg-white">
            <svg className="w-3 h-3 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Show/Hide Results button */}
          <button
            onClick={() => setShowResults(v => !v)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-600 text-white text-[9px] font-bold"
          >
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="18" y="2" width="4" height="20"/><rect x="10" y="7" width="4" height="15"/><rect x="2" y="12" width="4" height="10"/>
            </svg>
            {showResults ? 'Hide' : 'Results'}
          </button>
        </div>
      </div>

   

      {/* ── Home indicator ── */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-slate-300 rounded-full z-50" />
    </div>
  );
};

// ─── Hero ─────────────────────────────────────────────────────────────────────

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      tl.fromTo('.reveal-hero',
        { y: 120, opacity: 0, rotateX: -20 },
        { y: 0, opacity: 1, rotateX: 0, duration: 1.8, stagger: 0.1, delay: 0.2 }
      )
      .fromTo('.hero-fade',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1 },
        '-=1.2'
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative min-h-screen pt-48 pb-32 px-6 flex flex-col items-center overflow-hidden bg-white">
      {/* Abstract Background Accents */}
      <div className="absolute top-[10%] left-[20%] w-[50vw] h-[50vw] bg-indigo-50/50 rounded-full blur-[140px] -z-10" />
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-rose-50/40 rounded-full blur-[120px] -z-10" />

      <div className="max-w-6xl mx-auto text-center z-10 mb-20">
        <h1 className="text-[clamp(3.5rem,10vw,8.5rem)] font-display text-slate-950 leading-[0.8] mb-14 tracking-tighter text-balance">
          <div className="overflow-hidden">
            <span className="reveal-hero inline-block">The New Standard</span>
          </div>
          <div className="overflow-hidden">
            <span className="reveal-hero inline-block text-indigo-600 italic">Of Participation.</span>
          </div>
        </h1>

        <p className="hero-fade text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto mb-14 leading-relaxed font-medium">
          Create, share, and engage. Present from your laptop while your audience joins on their phones instantly. No apps. No accounts. No lag.
        </p>

        <div className="hero-fade flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/create" className="group w-full sm:w-auto">
            <button className="w-full sm:w-auto px-10 py-5 bg-slate-950 text-white rounded-full font-bold text-lg hover:bg-indigo-600 transition-all shadow-[0_20px_40px_-15px_rgba(2,6,23,0.3)] hover:shadow-indigo-500/20 hover:-translate-y-1 flex items-center justify-center gap-2">
              Start Hosting
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <Link to="/audience-participation" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-10 py-5 bg-white text-slate-950 border border-slate-200 rounded-full font-bold text-lg hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500" />
              Join Session
            </button>
          </Link>
        </div>
      </div>

      {/* ContainerScroll — device frame is untouched, only the content inside changes */}
      <div className="w-full">
        <ContainerScroll
          titleComponent={
            <>
              <h1 className="text-4xl font-semibold text-black dark:text-white">
                Experience the future of
                <br />
                <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none text-indigo-600">
                  Live Participation
                </span>
              </h1>
            </>
          }
        >
          <HostSessionPreview />
        </ContainerScroll>
      </div>
    </section>
  );
};

export default Hero;