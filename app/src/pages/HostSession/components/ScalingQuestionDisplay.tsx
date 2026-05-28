import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, SlidersHorizontal, TrendingUp, Sparkles } from "lucide-react";
import type { ScalingStatement, ScalingResponses } from "../../../lib/presentation.types";

interface ScalingQuestionDisplayProps {
  statements: ScalingStatement[];
  responses: ScalingResponses;
  showResults?: boolean;
  scale?: { min: number; max: number };
  labels?: { min?: string; max?: string };
}

const generateSmoothPath = (data: number[], width: number, height: number) => {
  if (data.length === 0) return "";
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - (val * height * 0.8),
  }));

  let d = `M ${points[0].x} ${height}`;
  d += ` L ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const controlX = (curr.x + next.x) / 2;
    d += ` C ${controlX} ${curr.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  d += ` L ${points[points.length - 1].x} ${height} Z`;
  return d;
};

const ScalingQuestionDisplay: React.FC<ScalingQuestionDisplayProps> = ({
  statements,
  responses,
  showResults = false,
  scale,
  labels,
}) => {
  const scaleMin = scale?.min ?? 1;
  const scaleMax = scale?.max ?? 5;
  const steps = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => scaleMin + i);
  const totalSteps = steps.length;
  const minLabel = labels?.min ?? "Strongly disagree";
  const maxLabel = labels?.max ?? "Strongly agree";
  const totalRespondents = responses?.total ?? 0;

  const [hoveredStmtId, setHoveredStmtId] = useState<string | null>(null);
  const [isTopMode, setIsTopMode] = useState(false);

  // Identify the statement with the highest average – fixed TypeScript types
  const topStatement = useMemo(() => {
    if (!responses.statements) return null;
    let maxAvg = -1;
    let winnerId: string | null = null;

    Object.entries(responses.statements).forEach(([id, data]) => {
      const avg = parseFloat(data.average || "0");
      if (avg > maxAvg) {
        maxAvg = avg;
        winnerId = id;
      }
    });

    return winnerId ? statements.find(s => s.id === winnerId) : null;
  }, [responses, statements]);

  if (!showResults) {
    return (
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-10 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary mb-6">
            <SlidersHorizontal className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Waiting for responses...</h3>
          <p className="text-muted-foreground mb-8">Participants are rating {statements.length} statements.</p>
          <div className="space-y-3 max-w-md mx-auto">
            {statements.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 text-left border border-border/50">
                <span className="text-xs font-bold opacity-50">{i + 1}</span>
                <span className="text-sm font-medium truncate">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      {/* Header – exactly as in your second version, plus the toggle button next to it */}
      <div className="flex items-center justify-between mb-12 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">Live Results</p>
            <p className="text-sm font-bold">{totalRespondents} participants have voted</p>
          </div>
        </div>

        {/* Menti‑style toggle button – placed right beside the header */}
        <button
          onClick={() => setIsTopMode(!isTopMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border ${
            isTopMode 
              ? "bg-primary border-primary text-white" 
              : "bg-transparent border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
          }`}
        >
          {isTopMode ? "Top Insight Active" : "Show Top Rated"}
        </button>
      </div>

      {/* Top statement highlight card – appears when toggle is ON */}
        <AnimatePresence>
        {isTopMode && topStatement && (
            <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-12 p-14 rounded-3xl border-2 border-primary/30 bg-primary/[0.03] relative overflow-hidden"
            >
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-5">
                <span className="bg-primary/10 text-primary text-base font-black px-5 py-2 rounded-full uppercase tracking-widest">
                    Leading Insight
                </span>
                </div>
                <h4 className="text-6xl font-bold tracking-tight text-foreground leading-tight">
                "{topStatement.text}" is the highest rated.
                </h4>
                <p className="mt-5 text-2xl text-muted-foreground font-medium">
                Average score: <span className="text-primary font-bold text-4xl">{responses.statements?.[topStatement.id]?.average}</span>
                </p>
            </div>
            </motion.div>
        )}
        </AnimatePresence>

      {/* Statements list – dims non‑winners when top mode is active */}
      <div className="space-y-16">
        {statements.map((stmt, idx) => {
          const result = responses.statements?.[stmt.id];
          const average = parseFloat(result?.average ?? "0");
          const avgPercent = totalSteps > 1 ? ((average - scaleMin) / (scaleMax - scaleMin)) * 100 : 50;

          const isWinner = topStatement?.id === stmt.id;
          const counts = steps.map(stepVal => result?.distribution?.[stepVal] ?? 0);
          const maxCount = Math.max(...counts, 1);
          const densityData = counts.map(v => v / maxCount);
          const isHovered = hoveredStmtId === stmt.id;

          return (
            <motion.div
              key={stmt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isTopMode && !isWinner ? 0.4 : 1,
                scale: isTopMode && isWinner ? 1.01 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="relative transition-all duration-300"
              onMouseEnter={() => setHoveredStmtId(stmt.id)}
              onMouseLeave={() => setHoveredStmtId(null)}
            >
              <div className="flex items-center justify-between mb-4 pl-1">
                <h4 className="text-lg md:text-xl font-semibold text-foreground">
                  {stmt.text}
                </h4>
            
              </div>

              <div className="relative h-24 w-full">
                {/* Density Cloud */}
                <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={`grad-${stmt.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={isWinner && isTopMode ? 0.4 : 0.25} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <motion.path
                    initial={{ d: generateSmoothPath(densityData.map(() => 0), 1000, 100) }}
                    animate={{ d: generateSmoothPath(densityData, 1000, 100) }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    fill={`url(#grad-${stmt.id})`}
                    className={`stroke-[1.5px] ${isWinner && isTopMode ? "stroke-primary" : "stroke-primary/30"}`}
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                {/* Hover bubbles */}
                <div className="absolute inset-0 pointer-events-none">
                  {steps.map((step, sIdx) => {
                    const count = counts[sIdx];
                    const xPos = (sIdx / (totalSteps - 1)) * 100;
                    const yPos = 100 - (densityData[sIdx] * 100 * 0.8);

                    return (
                      <AnimatePresence key={step}>
                        {isHovered && count > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: yPos }}
                            animate={{ opacity: 1, y: yPos - 18 }}
                            exit={{ opacity: 0, y: yPos }}
                            className="absolute"
                            style={{ left: `${xPos}%` }}
                          >
                            <div className="relative -translate-x-1/2 flex flex-col items-center">
                              <span className="bg-foreground text-background dark:bg-white dark:text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                                {count}
                              </span>
                              <div className="w-[1px] h-1.5 bg-primary/40 mt-0.5" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    );
                  })}
                </div>

                {/* Track line */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-muted-foreground/10 rounded-full" />

                {/* Progress fill */}
                <motion.div
                  className="absolute bottom-0 left-0 h-[2px] bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${avgPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />

                {/* Average bubble */}
                <motion.div
                  className="absolute bottom-[-14px] z-10"
                  initial={{ left: 0 }}
                  animate={{ left: `${avgPercent}%` }}
                  transition={{ type: "spring", stiffness: 60, damping: 15 }}
                >
                  <div className="relative -translate-x-1/2">
                    <div className="w-10 h-10 rounded-full bg-primary border-[3px] border-white dark:border-[#1e1b4b] shadow-xl flex items-center justify-center">
                      <span className="text-white text-xs font-black tabular-nums">
                        {result?.average ?? "0.0"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer labels (min/max) – unchanged from original */}
      <div className="mt-10 pt-6 border-t border-border flex justify-between px-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {minLabel}
        </span>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {maxLabel}
        </span>
      </div>

      {/* participants badge */}
      <div className="fixed bottom-8 right-8">
        <div className="bg-foreground text-background px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-background/20">
          <Users className="w-4 h-4" />
          <span className="text-sm font-black tracking-tight">{totalRespondents}</span>
        </div>
      </div>
    </div>
  );
};

export default ScalingQuestionDisplay;
