import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, SlidersHorizontal, TrendingUp } from "lucide-react";
import type { ScalingStatement, ScalingResponses } from "../../../lib/presentation.types";

interface ScalingQuestionDisplayProps {
  statements: ScalingStatement[];
  responses: ScalingResponses;
  showResults?: boolean;
  scale?: { min: number; max: number };
  labels?: { min?: string; max?: string };
}

// Utility to generate a smooth SVG path for the density "cloud"
const generateSmoothPath = (data: number[], width: number, height: number) => {
  if (data.length === 0) return "";
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - (val * height * 0.8), // 0.8 to leave some padding at top
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
      {/* Header Summary */}
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
      </div>

      <div className="space-y-16">
        {statements.map((stmt, idx) => {
          const result = responses.statements?.[stmt.id];
          const average = parseFloat(result?.average ?? "0");
          const avgPercent = totalSteps > 1 ? ((average - scaleMin) / (scaleMax - scaleMin)) * 100 : 50;

          // Prepare density data (normalized counts per step)
          const densityData = useMemo(() => {
            const counts = steps.map(stepVal => result?.distribution?.[stepVal] ?? 0);
            const max = Math.max(...counts, 1);
            return counts.map(v => v / max);
          }, [result, steps]);

          const counts = steps.map(stepVal => result?.distribution?.[stepVal] ?? 0);
          const maxCountInStmt = Math.max(...counts, 1);
          const normalizedForBubbles = counts.map(v => v / maxCountInStmt);

          const isHovered = hoveredStmtId === stmt.id;

          return (
            <motion.div
              key={stmt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative group"
              onMouseEnter={() => setHoveredStmtId(stmt.id)}
              onMouseLeave={() => setHoveredStmtId(null)}
            >
              <h4 className="text-lg md:text-xl font-semibold text-foreground mb-4 pl-1">
                {stmt.text}
              </h4>

              <div className="relative h-24 w-full">
                {/* 1. The Density Cloud (SVG) */}
                <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={`grad-${stmt.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  <motion.path
                    initial={{ d: generateSmoothPath(densityData.map(() => 0), 1000, 100) }}
                    animate={{ d: generateSmoothPath(densityData, 1000, 100) }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    fill={`url(#grad-${stmt.id})`}
                    className="stroke-primary/30 stroke-[1px]"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                {/* 2. Hover‑only vote count bubbles (room spread) */}
                <div className="absolute inset-0 pointer-events-none">
                  {steps.map((step, sIdx) => {
                    const count = counts[sIdx];
                    const xPos = (sIdx / (totalSteps - 1)) * 100;
                    // y position follows the same curve calculation as SVG
                    const yPos = 100 - (normalizedForBubbles[sIdx] * 100 * 0.8); // matches generateSmoothPath height * 0.8

                    return (
                      <AnimatePresence key={step}>
                        {isHovered && count > 0 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: yPos }}
                            animate={{ opacity: 1, scale: 1, y: yPos - 20 }}
                            exit={{ opacity: 0, scale: 0.5, y: yPos }}
                            className="absolute"
                            style={{ left: `${xPos}%` }}
                          >
                            <div className="relative -translate-x-1/2 flex flex-col items-center">
                              <div className="bg-foreground text-background dark:bg-background dark:text-foreground px-1.5 py-0.5 rounded text-[10px] font-black shadow-md whitespace-nowrap">
                                {count}
                              </div>
                              <div className="w-[1px] h-2 bg-primary/40 mt-0.5" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    );
                  })}
                </div>

                {/* 3. The Slider Track */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-muted-foreground/20 rounded-full" />

                {/* 4. The Active Progress Fill */}
                <motion.div
                  className="absolute bottom-0 left-0 h-[3px] bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${avgPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />

                {/* 5. The Average Handle (The Bubble) */}
                <motion.div
                  className="absolute bottom-[-14px] z-10"
                  initial={{ left: 0 }}
                  animate={{ left: `${avgPercent}%` }}
                  transition={{ type: "spring", stiffness: 60, damping: 15 }}
                >
                  <div className="relative -translate-x-1/2 flex flex-col items-center">
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

      {/* Shared Footer Labels */}
      <div className="mt-10 pt-6 border-t border-border flex justify-between px-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {minLabel}
        </span>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {maxLabel}
        </span>
      </div>

      {/* Participants Badge */}
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