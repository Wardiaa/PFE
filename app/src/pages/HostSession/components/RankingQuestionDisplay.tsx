import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EyeOff, Users, Trophy } from "lucide-react";
import type { RankingItem, RankingResponses } from "../../../lib/presentation.types";

interface RankingQuestionDisplayProps {
  options: RankingItem[];
  responses: RankingResponses;
  showResults?: boolean;
}

const BAR_COLORS = [
  "bg-[#5e5fb7]",
  "bg-[#8f9eff]",
  "bg-[#7a88cf]",
  "bg-[#6b76c0]",
];

const MIN_BAR_WIDTH_PERCENT = 4;

const RankingQuestionDisplay: React.FC<RankingQuestionDisplayProps> = ({
  options,
  responses,
  showResults = true,
}) => {
  const [showHighest, setShowHighest] = useState(false);

  const totalRespondents = responses?.total ?? 0;

  const rankedItems = useMemo(() => {
    return options
      .map((item) => ({
        item,
        result: responses?.items?.[item.id] ?? { bordaScore: 0, rankDistribution: {}, total: 0 },
      }))
      .sort((a, b) => b.result.bordaScore - a.result.bordaScore);
  }, [options, responses]);

  const maxBordaScore = useMemo(() => {
    return Math.max(...rankedItems.map((r) => r.result.bordaScore), 1);
  }, [rankedItems]);

  const isResultsHidden = !showResults;
  const topItem = rankedItems[0];

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-8 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            {isResultsHidden ? "Results Hidden" : "Live Results"}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isResultsHidden
              ? "Click 'Show Results' to reveal rankings"
              : "Based on Borda count ranking"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isResultsHidden && topItem && totalRespondents > 0 && (
            <button
              onClick={() => setShowHighest((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                showHighest
                  ? "bg-[#5e5fb7] text-white border-[#5e5fb7] shadow-md"
                  : "bg-white text-[#5e5fb7] border-[#5e5fb7] hover:bg-[#5e5fb7]/10"
              }`}
            >
              <Trophy className="w-4 h-4" />
              {showHighest ? "Hide Highest" : "Show Highest Ranked"}
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700 tabular-nums">{totalRespondents}</span>
            <span className="text-xs text-slate-400">voters</span>
          </div>
        </div>
      </div>

      {/* Highest Ranked Spotlight */}
      <AnimatePresence>
        {showHighest && topItem && (
          <motion.div
            key="highest-ranked"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-10 rounded-3xl bg-[#5e5fb7] text-white px-14 py-14 flex items-center gap-10 shadow-2xl"
          >
            <div className="flex-shrink-0 w-36 h-36 rounded-full bg-white/20 flex items-center justify-center">
              <Trophy className="w-20 h-20 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-semibold uppercase tracking-widest text-white/60 mb-3">
                Highest Ranked
              </p>
              <p className="text-7xl font-bold leading-tight">
                {topItem.item.text}
              </p>
              {topItem.result.bordaScore > 0 && (
                <p className="text-2xl text-white/70 mt-4">
                  {topItem.result.bordaScore} pts · ranked #1 by the group
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ranking list */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {rankedItems.map(({ item, result }, index) => {
            const rank = index + 1;
            let widthPercent;
            if (isResultsHidden) {
              widthPercent = MIN_BAR_WIDTH_PERCENT;
            } else {
              widthPercent = maxBordaScore > 0 ? (result.bordaScore / maxBordaScore) * 100 : 0;
            }
            const barColor = BAR_COLORS[index] || "bg-[#5e5fb7]";

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex items-start gap-4 w-full"
              >
                <div className="w-8 pt-[30px] shrink-0 text-right">
                  <span className="text-2xl font-semibold text-slate-600 tabular-nums">
                    {rank}.
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="mb-1">
                    <span className="text-lg font-medium text-slate-700">
                      {item.text}
                    </span>
                  </div>

                  <div className="relative h-11 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                    <motion.div
                      className={`h-full rounded-r-xl ${barColor} shadow-sm`}
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercent}%` }}
                      transition={{ duration: 0.8, ease: "circOut" }}
                    >
                      {!isResultsHidden && rank === 1 && totalRespondents > 0 && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-full"
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                        />
                      )}
                    </motion.div>

                    {!isResultsHidden && result.bordaScore > 0 && (
                      <div className="absolute right-3 top-0 h-full flex items-center">
                        <span className="text-xs font-black text-slate-400 tabular-nums">
                          {result.bordaScore} pts
                        </span>
                      </div>
                    )}
                  </div>

                  {!isResultsHidden && totalRespondents > 0 && (
                    <div className="mt-1 flex gap-2 flex-wrap">
                      {Object.entries(result.rankDistribution)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([rankPos, count]) => (
                          <span key={rankPos} className="text-[10px] font-bold text-slate-400 tabular-nums uppercase tracking-tighter">
                            #{rankPos}: {count}×
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {totalRespondents === 0 && !isResultsHidden && (
        <div className="text-center py-12 text-slate-400">
          No rankings submitted yet.
        </div>
      )}
    </div>
  );
};

export default RankingQuestionDisplay;
