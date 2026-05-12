import { useState } from "react";
import { cn } from "../../lib/utils";
import { Smartphone, Monitor } from "lucide-react";
import { Button } from "./button";
import { themes } from "./theme-selector";

interface DevicePreviewProps {
  title: string;
  themeId: string;
  questions: any[];
  currentQuestionIndex: number;
}

// ─── CSS variable → concrete colour mapping (mirroring real audience page) ───
// bg-background     → white
// bg-card           → white
// border-border     → #e2e8f0 (slate-200)
// bg-primary        → #4f46e5 (indigo-600)
// bg-primary/5      → #eef2ff (indigo-50)
// bg-primary/10     → indigo-100/60
// border-primary    → #4f46e5 (indigo-600)
// text-foreground   → #0f172a (slate-900)
// text-muted-foreground → #64748b (slate-500)
// bg-muted          → #f1f5f9 (slate-100)
// bg-muted/60       → rgb(241 245 249/0.6)
// bg-success/10     → rgb(34 197 94/0.1)
// border-success/20 → rgb(34 197 94/0.2)
// text-success      → #16a34a (green-600)
// bg-success        → #22c55e (green-500)
// bg-secondary/10   → slate-100

const normalizeType = (t: string) => {
  if (["SINGLE_CHOICE","MULTIPLE_CHOICE","TRUE_FALSE","POLL","multiple-choice"].includes(t)) return "multiple-choice";
  if (["OPEN_TEXT","open-text"].includes(t)) return "open-text";
  if (["RATING","rating","rating-scale"].includes(t)) return "rating-scale";
  if (["WORD_CLOUD","word-cloud"].includes(t)) return "word-cloud";
  return "multiple-choice";
};

// ─── Lucide-equivalent inline SVGs ───────────────────────────────────────────
const IconCheck = ({ size = 12, color = "white" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconSend = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IconUsers = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

export function DevicePreview({ title, themeId, questions, currentQuestionIndex }: DevicePreviewProps) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const theme = themes.find((t) => t.id === themeId) || themes[0];
  const question = questions[currentQuestionIndex] || questions[0];
  const hasQuestions = questions.length > 0;
  const totalQ = questions.length;

  // Reset selection when question changes
  const displayQuestion = hasQuestions
    ? question
    : {
        title: "Add your first question to see it here",
        type: "multiple-choice",
        options: [
          { id: "1", text: "Sample Option A" },
          { id: "2", text: "Sample Option B" },
          { id: "3", text: "Sample Option C" },
        ],
      };

  const displayType = normalizeType(displayQuestion.type || "multiple-choice");
  const options = displayQuestion.options || [];
  const scaleMin = 1;
  const scaleMax = displayQuestion.scale?.max || 5;
  const ratings = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => scaleMin + i);
  const displayStyle = displayQuestion.displayStyle || "numbers";

  const getRatingColor = (r: number) => {
    const pct = ((r - scaleMin) / (scaleMax - scaleMin)) * 100;
    if (pct <= 33) return "#ef4444";
    if (pct <= 66) return "#f59e0b";
    return "#22c55e";
  };

  // Scale factor — bigger for mobile to make content readable
  // Mobile frame width is 300px, we increase scale to 0.72 (was 0.48)
  // Desktop frame uses 0.62 (unchanged)
  const S = device === "mobile" ? 0.72 : 0.62;

  // ── Shared screen content (matches the real page's DOM tree) ───────────────
  const renderScreen = () => (
    <div className="w-full h-full overflow-y-auto bg-white flex flex-col">
      {/* Timer bar: h-1.5 w-full bg-muted/60 + inner bg-primary at 60% */}
      <div
        className="flex-shrink-0 w-full"
        style={{ height: Math.max(3, 6 * S), backgroundColor: "rgb(241 245 249 / 0.6)" }}
      >
        <div className="h-full bg-indigo-600" style={{ width: "60%" }} />
      </div>

      {/* container mx-auto px-4 py-8 */}
      <div
        className="mx-auto w-full"
        style={{ padding: `${32 * S}px ${16 * S}px`, maxWidth: 672 * S }}
      >
        {/* ── Session header card: bg-card rounded-xl p-4 shadow-sm border border-border ── */}
        <div
          className="bg-white rounded-xl border border-slate-200"
          style={{
            padding: `${16 * S}px ${20 * S}px`,
            marginBottom: 24 * S,
            boxShadow: "0 1px 2px 0 rgb(0 0 0/0.05)",
          }}
        >
          <div className="flex items-center justify-between flex-wrap" style={{ gap: 8 * S }}>
            <div className="flex-1 min-w-0">
              {/* text-base font-semibold text-foreground */}
              <p className="font-semibold text-slate-900 truncate" style={{ fontSize: 15 * S }}>
                {title || "Untitled Session"}
              </p>
              {/* text-sm text-muted-foreground mt-1 */}
              <p className="text-slate-500" style={{ fontSize: 13 * S, marginTop: 4 * S }}>
                Code: ABC123 • Joined as Participant
              </p>
            </div>
            {/* bg-success/10 border border-success/20 px-3 py-1.5 rounded-lg */}
            <div
              className="flex items-center rounded-lg border flex-shrink-0"
              style={{
                padding: `${5 * S}px ${10 * S}px`,
                gap: 6 * S,
                backgroundColor: "rgb(34 197 94 / 0.1)",
                borderColor: "rgb(34 197 94 / 0.2)",
              }}
            >
              
              <div
                className="rounded-full bg-green-500 "
                style={{ width: 7 * S, height: 7 * S }}
              />
              {/* text-sm font-medium text-success */}
              <span className="font-medium text-green-600" style={{ fontSize: 13 * S }}>
                Live
              </span>
            </div>
          </div>

          {/* Progress row: mt-4 pt-4 border-t border-border */}
          {hasQuestions && (
            <div
              className="flex items-center justify-between border-t border-slate-200"
              style={{ marginTop: 14 * S, paddingTop: 14 * S }}
            >
              <span className="text-slate-500" style={{ fontSize: 12 * S }}>
                Question {currentQuestionIndex + 1} of {totalQ}
              </span>
              <div className="flex" style={{ gap: 3 * S }}>
                {questions.map((_: any, i: number) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: 7 * S,
                      height: 7 * S,
                      backgroundColor:
                        i === currentQuestionIndex
                          ? "#4f46e5"  // bg-primary (indigo-600)
                          : i < currentQuestionIndex
                          ? "#22c55e"  // bg-success (green-500)
                          : "#e2e8f0", // bg-muted (slate-200)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Question card: bg-card rounded-xl p-6 shadow-lg border border-border ── */}
        <div
          className="bg-white rounded-xl border border-slate-200"
          style={{
            padding: `${24 * S}px`,
            boxShadow: "0 10px 15px -3px rgb(0 0 0/0.1), 0 4px 6px -4px rgb(0 0 0/0.1)",
          }}
        >
          {/* Type indicator row */}
          <div className="flex items-center" style={{ gap: 8 * S, marginBottom: 12 * S }}>
            <div
              className={cn(
                "flex items-center justify-center rounded-lg flex-shrink-0",
                displayType === "multiple-choice" && "bg-indigo-100/60",
                displayType === "open-text" && "bg-slate-100",
                displayType === "rating-scale" && "bg-amber-100/60",
                displayType === "word-cloud" && "bg-green-100/60",
              )}
              style={{ width: 28 * S, height: 28 * S }}
            >
              {displayType === "multiple-choice" && (
                <svg width={16 * S} height={16 * S} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
              )}
              {displayType === "open-text" && (
                <svg width={16 * S} height={16 * S} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              )}
              {displayType === "rating-scale" && (
                <svg width={16 * S} height={16 * S} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              )}
              {displayType === "word-cloud" && (
                <svg width={16 * S} height={16 * S} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>
                </svg>
              )}
            </div>
            {/* text-sm font-medium text-muted-foreground */}
            <span className="font-medium text-slate-500" style={{ fontSize: 13 * S }}>
              {displayType === "multiple-choice" && "Multiple Choice"}
              {displayType === "open-text" && "Open Response"}
              {displayType === "rating-scale" && "Rating Scale"}
              {displayType === "word-cloud" && "Word Cloud"}
            </span>
          </div>

          {/* text-xl font-bold text-foreground leading-tight */}
          <h2
            className="font-bold text-slate-900 leading-tight"
            style={{ fontSize: 18 * S, marginBottom: 16 * S }}
          >
            {displayQuestion.title}
          </h2>

          {/* ── Multiple choice answer area ── */}
          {displayType === "multiple-choice" && (
            <div style={{ marginBottom: 16 * S }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 * S }}>
                {options.map((opt: any) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    className="w-full text-left rounded-xl border-2 transition-all"
                    style={{
                      minHeight: 50 * S,
                      padding: `${10 * S}px ${14 * S}px`,
                      borderColor: selectedOption === opt.id ? "#4f46e5" : "#e2e8f0",
                      backgroundColor: selectedOption === opt.id ? "#eef2ff" : "#ffffff",
                      boxShadow: selectedOption === opt.id ? "0 4px 6px -1px rgb(0 0 0/0.1)" : "none",
                    }}
                  >
                    <div className="flex items-center" style={{ gap: 10 * S }}>
                      {/* Radio circle: w-5 h-5 rounded-full border-2 */}
                      <div
                        className="rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 18 * S,
                          height: 18 * S,
                          borderColor: selectedOption === opt.id ? "#4f46e5" : "#94a3b8",
                          backgroundColor: selectedOption === opt.id ? "#4f46e5" : "transparent",
                        }}
                      >
                        {selectedOption === opt.id && <IconCheck size={Math.round(10 * S)} />}
                      </div>
                      {/* text-base font-medium text-foreground */}
                      <span
                        className="font-medium text-slate-900 flex-1"
                        style={{ fontSize: 14 * S }}
                      >
                        {opt.text}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {/* Submit button */}
              <div
                className="w-full flex items-center justify-center rounded-xl font-semibold"
                style={{
                  marginTop: 10 * S,
                  padding: `${9 * S}px`,
                  fontSize: 13 * S,
                  gap: 6 * S,
                  backgroundColor: selectedOption ? "#4f46e5" : "#f1f5f9",
                  color: selectedOption ? "#fff" : "#94a3b8",
                }}
              >
                Submit Answer <IconSend size={Math.round(12 * S)} />
              </div>
             
            </div>
          )}

          {/* ── Open text answer area ── */}
          {displayType === "open-text" && (
            <div style={{ marginBottom: 16 * S }}>
              <div
                className="w-full rounded-xl border-2 border-slate-200 text-slate-400"
                style={{ padding: `${12 * S}px ${14 * S}px`, fontSize: 13 * S, minHeight: 80 * S }}
              >
                Type your response here...
              </div>
              <div className="flex justify-end" style={{ marginTop: 6 * S }}>
                <span className="text-slate-400" style={{ fontSize: 10 * S }}>500 characters remaining</span>
              </div>
              <div
                className="w-full flex items-center justify-center rounded-xl font-semibold bg-indigo-600 text-white"
                style={{ marginTop: 8 * S, padding: `${9 * S}px`, fontSize: 13 * S, gap: 6 * S }}
              >
                Submit Response <IconSend size={Math.round(12 * S)} />
              </div>
              
            </div>
          )}

          {/* ── Rating scale answer area ── */}
          {displayType === "rating-scale" && (
            <div style={{ marginBottom: 16 * S }}>
              {/* grid gap-2 gridTemplateColumns repeat */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${ratings.length}, minmax(0, 1fr))`,
                  gap: 6 * S,
                }}
              >
                {ratings.map((r) => {
                  const isSelected = selectedRating === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setSelectedRating(r)}
                      className="rounded-xl border-2 flex items-center justify-center transition-all"
                      style={{
                        height: 36 * S,
                        borderColor: isSelected ? "#4f46e5" : "#e2e8f0",
                        backgroundColor: isSelected ? "#4f46e5" : "#ffffff",
                        transform: isSelected ? "scale(1.05)" : "scale(1)",
                        boxShadow: isSelected ? "0 4px 6px -1px rgb(0 0 0/0.2)" : "none",
                      }}
                    >
                      {displayStyle === "stars" && (
                        <svg width={14 * S} height={14 * S} viewBox="0 0 24 24" fill={isSelected ? "white" : "#fbbf24"} stroke="none">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      )}
                      {displayStyle === "hearts" && (
                        <svg width={14 * S} height={14 * S} viewBox="0 0 24 24" fill={isSelected ? "white" : "#fb7185"} stroke="none">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      )}
                      {displayStyle === "smileys" && (
                        <svg width={14 * S} height={14 * S} viewBox="0 0 24 24" fill="none" stroke={isSelected ? "white" : "#eab308"} strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <path strokeLinecap="round" d="M8 13s1.5 3 4 3 4-3 4-3"/>
                          <circle cx="9" cy="10" r="1" fill={isSelected ? "white" : "#eab308"}/>
                          <circle cx="15" cy="10" r="1" fill={isSelected ? "white" : "#eab308"}/>
                        </svg>
                      )}
                      {displayStyle === "numbers" && (
                        <span
                          className="font-bold"
                          style={{ fontSize: 13 * S, color: isSelected ? "#fff" : getRatingColor(r) }}
                        >
                          {r}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {/* text-[9px] font-bold text-muted-foreground uppercase tracking-widest */}
              <div
                className="flex items-center justify-between font-bold text-slate-400 uppercase tracking-widest"
                style={{ marginTop: 10 * S, paddingLeft: 6 * S, paddingRight: 6 * S, fontSize: 8 * S }}
              >
                <span>{displayQuestion.labels?.min || "Low"}</span>
                <span>{displayQuestion.labels?.max || "High"}</span>
              </div>
              {selectedRating !== null && (
                <p className="text-center text-slate-500" style={{ fontSize: 11 * S, marginTop: 10 * S }}>
                  You selected: <span className="font-semibold text-slate-900">{selectedRating}</span>
                </p>
              )}
              <div
                className="w-full flex items-center justify-center rounded-xl font-semibold"
                style={{
                  marginTop: 8 * S,
                  padding: `${9 * S}px`,
                  fontSize: 13 * S,
                  gap: 6 * S,
                  backgroundColor: selectedRating !== null ? "#4f46e5" : "#f1f5f9",
                  color: selectedRating !== null ? "#fff" : "#94a3b8",
                }}
              >
                Submit Rating <IconSend size={Math.round(12 * S)} />
              </div>
              
            </div>
          )}

          {/* ── Word cloud answer area ── */}
          {displayType === "word-cloud" && (
            <div style={{ marginBottom: 16 * S }}>
              <div
                className="w-full rounded-xl border-2 border-slate-200 text-slate-400"
                style={{ padding: `${10 * S}px ${14 * S}px`, fontSize: 13 * S }}
              >
                Type words separated by spaces...
              </div>
              <div className="flex justify-between" style={{ marginTop: 6 * S }}>
                <span className="text-slate-400" style={{ fontSize: 10 * S }}>Press space to add multiple words</span>
                <span className="text-slate-400" style={{ fontSize: 10 * S }}>5 words remaining</span>
              </div>
              <div
                className="w-full flex items-center justify-center rounded-xl font-semibold bg-slate-100 text-slate-400"
                style={{ marginTop: 8 * S, padding: `${9 * S}px`, fontSize: 13 * S, gap: 6 * S }}
              >
                Submit Words <IconSend size={Math.round(12 * S)} />
              </div>
              
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center h-full w-full">
      {/* Device toggle */}
      <div className="flex items-center gap-1 mb-4 bg-muted/50 p-1 rounded-xl border">
        <Button
          variant={device === "mobile" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => { setDevice("mobile"); setSelectedOption(null); setSelectedRating(null); }}
          className="h-8 gap-1.5"
        >
          <Smartphone className="w-3.5 h-3.5" /> Mobile
        </Button>
        <Button
          variant={device === "desktop" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => { setDevice("desktop"); setSelectedOption(null); setSelectedRating(null); }}
          className="h-8 gap-1.5"
        >
          <Monitor className="w-3.5 h-3.5" /> Desktop
        </Button>
      </div>

      {device === "mobile" ? (
        <div
          className="relative overflow-hidden"
          style={{
            width: 300,
            height: 600,
            borderRadius: 44,
            border: "10px solid #1e293b",
            boxShadow: "0 25px 50px -12px rgb(0 0 0/0.5)",
          }}
        >
          {/* Notch */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bg-slate-800 z-20"
            style={{ top: 0, width: 88, height: 22, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }}
          />
          <div className="w-full h-full overflow-hidden" style={{ paddingTop: 24 }}>
            {renderScreen()}
          </div>
        </div>
      ) : (
        <div
          className="w-full max-w-3xl overflow-hidden rounded-xl"
          style={{
            border: "4px solid #1e293b",
            boxShadow: "0 25px 50px -12px rgb(0 0 0/0.4)",
            height: 520,
          }}
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border-b border-slate-200">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 mx-2 h-5 rounded bg-white border border-slate-200 flex items-center px-2">
              <span className="text-[9px] text-slate-400">your-session.app/join</span>
            </div>
          </div>
          <div className="overflow-y-auto" style={{ height: "calc(100% - 37px)" }}>
            {renderScreen()}
          </div>
        </div>
      )}

      {hasQuestions && (
        <p className="mt-3 text-[10px] text-muted-foreground text-center">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
      )}
    </div>
  );
}