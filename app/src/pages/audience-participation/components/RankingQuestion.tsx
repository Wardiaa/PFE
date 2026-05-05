import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { ArrowUp, ArrowDown, Loader2, RotateCcw } from "lucide-react";
import Button from "../../../components/ui/Button2";

interface RankingItem {
  id: string;
  text: string;
}

interface RankingQuestionProps {
  question: {
    text: string;
    description?: string;
    image?: string | null;
    options: RankingItem[];
    responseCount?: number;
  };
  onSubmit: (response: { rankingOrder: string[] }) => void;
}

const RankingQuestion: React.FC<RankingQuestionProps> = ({ question, onSubmit }) => {
  const [rankedIds, setRankedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const unrankedItems = useMemo(() => {
    return (question.options ?? []).filter((opt) => !rankedIds.includes(opt.id));
  }, [question.options, rankedIds]);

  const rankedItems = useMemo(() => {
    return rankedIds
      .map((id) => question.options.find((opt) => opt.id === id))
      .filter(Boolean) as RankingItem[];
  }, [rankedIds, question.options]);

  const handleToggleItem = (id: string) => {
    if (!rankedIds.includes(id)) {
      setRankedIds(prev => [...prev, id]);
    }
  };

  const handleReset = () => {
    setRankedIds([]);
  };

  const moveItem = useCallback((index: number, direction: "up" | "down") => {
    const nextIds = [...rankedIds];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= nextIds.length) return;
    [nextIds[index], nextIds[targetIndex]] = [nextIds[targetIndex], nextIds[index]];
    setRankedIds(nextIds);
  }, [rankedIds]);

  const handleSubmit = async () => {
    if (isSubmitting || submitted || rankedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ rankingOrder: rankedIds });
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* Outer: fills whatever space the parent gives, background only */
    <div style={{ background: "#ebedfb", minHeight: "100vh", width: "100%", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      {/* Inner: max-width content column, block layout, no flex */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 32px" }}>

        <h2 className="text-[2.6rem] font-medium text-[#111] text-center mb-12 tracking-tight leading-tight">
          {question.text}
        </h2>

        {/* ── Your Ranking ── */}
        <div style={{ marginBottom: "40px" }}>

          {/* Label row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingLeft: "8px", paddingRight: "8px" }}>
            <label className="text-[1.1rem] text-[#333] font-normal">
              Your ranking
            </label>
            {rankedIds.length > 0 && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#5e5fb7] hover:text-[#4f50a8] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>

          {/* Drop zone / ranked list */}
          {rankedIds.length === 0 ? (
            <div className="min-h-[140px] rounded-[2.5rem] border-2 border-dashed border-[#aab2d4] bg-[#cbd2ee]/60 text-[#555] text-[1.1rem]"
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              Click or drop options
            </div>
          ) : (
            <Reorder.Group
              as="div"
              axis="y"
              values={rankedIds}
              onReorder={setRankedIds}
              style={{ display: "block", width: "100%", minHeight: "100px", padding: 0, margin: 0 }}
            >
              <AnimatePresence mode="popLayout">
                {rankedItems.map((item, idx) => (
                  <Reorder.Item
                    as="div"
                    key={item.id}
                    value={item.id}
                    style={{ display: "flex", alignItems: "center", width: "100%", height: "72px", position: "relative", cursor: "grab", padding: "0 8px", margin: 0, boxSizing: "border-box" }}
                    className="active:cursor-grabbing"
                  >
                    {/* Rank Number */}
                    <div className="w-10 text-[1.2rem] font-medium text-[#111]">
                      {idx + 1}
                    </div>

                    {/* Item Text */}
                    <div className="flex-1 text-[1.2rem] font-normal text-[#111] px-4">
                      {item.text}
                    </div>

                    {/* Control Arrows */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", color: "#888" }}>
                      <button
                        onClick={() => moveItem(idx, "up")}
                        disabled={idx === 0}
                        className="hover:text-[#5e5fb7] disabled:text-[#cbd2ee] transition-colors p-1"
                      >
                        <ArrowUp className="w-6 h-6 stroke-[2.5px]" />
                      </button>
                      <button
                        onClick={() => moveItem(idx, "down")}
                        disabled={idx === rankedIds.length - 1}
                        className="hover:text-[#5e5fb7] disabled:text-[#cbd2ee] transition-colors p-1"
                      >
                        <ArrowDown className="w-6 h-6 stroke-[2.5px]" />
                      </button>
                    </div>

                    {/* Divider */}
                    <div style={{ position: "absolute", bottom: 0, left: "8px", right: "8px", height: "1px", background: "#cbd2ee" }} />
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          )}
        </div>

        {/* ── Unranked Options ── */}
        <div style={{ marginBottom: "64px" }}>
          <label className="text-[1.1rem] text-[#333] mb-4 block font-normal px-2">
            Unranked options
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <AnimatePresence mode="popLayout">
              {unrankedItems.map((item) => (
                <motion.button
                  key={item.id}
                  layout="position"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleToggleItem(item.id)}
                  style={{ width: "100%", boxSizing: "border-box" }}
                  className="bg-white border border-[#d1d5e8] py-7 px-10 rounded-[2rem] text-left text-[1.15rem] font-normal text-[#111] shadow-sm hover:border-[#5e5fb7] active:scale-[0.99] transition-all"
                >
                  {item.text}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Submit ── */}
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: "48px" }}>
          <Button
            variant="default"
            size="lg"
            iconName="Send"
            iconPosition="right"
            onClick={handleSubmit}
            disabled={isSubmitting || submitted || rankedIds.length === 0}
            className={`w-[180px] h-12 rounded-full text-base font-normal transition-all shadow-md active:scale-95 ${
              submitted
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-[#5e5fb7] hover:bg-[#4f50a8] text-white"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : submitted ? (
              "Done!"
            ) : (
              "Submit"
            )}
          </Button>
        </div>

      </div>
    </div>
  );
};
export default RankingQuestion;
