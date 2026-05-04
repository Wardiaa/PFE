// src/pages/HostSession/components/ScalingQuestionDisplay.tsx
// Host-side results display for a Scaling question.
// Shows a Mentimeter-style distribution visualization per statement.

import React from "react";
import { motion } from "framer-motion";
import { Users, SlidersHorizontal, BarChart3 } from "lucide-react";
import type { ScalingStatement, ScalingResponses } from "../../../lib/presentation.types";

interface ScalingQuestionDisplayProps {
  statements: ScalingStatement[];
  responses: ScalingResponses;
  showResults?: boolean;
  scale?: { min: number; max: number };
  labels?: { min?: string; max?: string };
}

const SCALE_COLORS: Record<number, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#22c55e",
  5: "#10b981",
};

const BAR_BG = "#f1f5f9";

function DistributionChart({
  distribution,
  total,
  steps,
  average,
}: {
  distribution: Record<number, number>;
  total: number;
  steps: number[];
  average: string;
}) {
  const maxCount = Math.max(...steps.map((s) => distribution[s] ?? 0), 1);
  const avgNum = parseFloat(average);
  const min = steps[0];
  const max = steps[steps.length - 1];
  const avgPercent = max > min ? ((avgNum - min) / (max - min)) * 100 : 50;

  return (
    <div className="space-y-2">
      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-16">
        {steps.map((step, idx) => {
          const count = distribution[step] ?? 0;
          const heightPct = (count / maxCount) * 100;
          const color = SCALE_COLORS[step] ?? "#6366f1";

          return (
            <motion.div
              key={step}
              className="flex-1 flex flex-col items-center justify-end gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              {count > 0 && (
                <span className="text-[10px] font-bold text-foreground">{count}</span>
              )}
              <motion.div
                className="w-full rounded-t-md min-h-[3px]"
                style={{ backgroundColor: heightPct > 0 ? color : BAR_BG }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(heightPct, 4)}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: idx * 0.05 }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Step labels */}
      <div className="flex gap-1.5">
        {steps.map((step) => (
          <div key={step} className="flex-1 text-center text-[10px] font-semibold text-muted-foreground">
            {step}
          </div>
        ))}
      </div>

      {/* Average slider track */}
      <div className="relative mt-3 h-6">
        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-muted rounded-full -translate-y-1/2 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #10b981)",
            }}
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.6 }}
          />
        </div>
        {/* Average bubble */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${avgPercent}%` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 20 }}
        >
          <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-black shadow-md border-2 border-background">
            {average}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

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
  const minLabel = labels?.min ?? "Strongly disagree";
  const maxLabel = labels?.max ?? "Strongly agree";
  const totalRespondents = responses?.total ?? 0;

  if (!showResults) {
    return (
      <div className="bg-card border-2 border-border rounded-xl p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center">
            <SlidersHorizontal className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex-1">
            <p className="text-base text-muted-foreground mb-2">
              Participants rate each statement on a scale from{" "}
              <strong>{scaleMin}</strong> to <strong>{scaleMax}</strong>.
            </p>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{totalRespondents}</span>
              <span className="text-muted-foreground">responses received</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {statements.map((stmt, idx) => (
            <div
              key={stmt.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border"
            >
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                {idx + 1}
              </div>
              <p className="text-sm text-foreground">{stmt.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          <span>{minLabel}</span>
          <div className="flex gap-1">
            {steps.map((s) => (
              <div
                key={s}
                className="w-6 h-1.5 rounded-full"
                style={{ backgroundColor: SCALE_COLORS[s] ?? "#6366f1" }}
              />
            ))}
          </div>
          <span>{maxLabel}</span>
        </div>
      </div>
    );
  }

  // ── Results mode ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="w-4 h-4" />
          <span>
            <strong className="text-foreground">{totalRespondents}</strong> responses
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          <span>{minLabel}</span>
          <div className="hidden sm:flex gap-1">
            {steps.map((s) => (
              <div
                key={s}
                className="w-5 h-1.5 rounded-full"
                style={{ backgroundColor: SCALE_COLORS[s] ?? "#6366f1" }}
              />
            ))}
          </div>
          <span>{maxLabel}</span>
        </div>
      </div>

      {/* Per-statement cards */}
      {statements.map((stmt, idx) => {
        const stmtResult = responses.statements?.[stmt.id];
        const distribution = stmtResult?.distribution ?? {};
        const average = stmtResult?.average ?? "–";
        const stmtTotal = stmtResult?.total ?? 0;

        return (
          <motion.div
            key={stmt.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
            className="bg-card border-2 border-border rounded-xl p-4 md:p-5"
          >
            {/* Statement header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <div className="shrink-0 w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center text-xs font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-sm md:text-base font-medium text-foreground leading-snug">
                  {stmt.text}
                </p>
              </div>

              {/* Average badge */}
              <div className="shrink-0 flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl bg-muted/60">
                <span className="text-xs text-muted-foreground font-medium">avg</span>
                <span className="text-lg font-black text-foreground leading-none">{average}</span>
              </div>
            </div>

            {/* Distribution chart */}
            {stmtTotal > 0 ? (
              <DistributionChart
                distribution={distribution}
                total={stmtTotal}
                steps={steps}
                average={average}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <SlidersHorizontal className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs">No responses yet</p>
              </div>
            )}

            {/* Response count */}
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>
                {stmtTotal} {stmtTotal === 1 ? "response" : "responses"}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ScalingQuestionDisplay;
