// Grid2x2Question.tsx — Participant view for the 2×2 grid question type
// Participants drag/tap items onto a two-axis matrix (Mentimeter-style).
// Each item gets placed independently. Mobile-friendly with tap-to-select + tap-to-place.

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RotateCcw, CheckCircle2 } from "lucide-react";

interface GridAxis {
  label: string;
  minLabel: string;
  maxLabel: string;
}

interface GridItem {
  id: string;
  text: string;
}

interface Placement {
  x: number; // 0-100 normalised
  y: number; // 0-100 normalised (0 = bottom, 100 = top)
}

interface Grid2x2QuestionProps {
  question: {
    text: string;
    description?: string;
    image?: string | null;
    imageUrl?: string | null;
    options: GridItem[];
    xAxis?: GridAxis;
    yAxis?: GridAxis;
  };
  onSubmit: (response: { placements: Record<string, Placement> }) => void;
  isSubmitting?: boolean;
}

const DEFAULT_X_AXIS: GridAxis = { label: "Effort", minLabel: "Low", maxLabel: "High" };
const DEFAULT_Y_AXIS: GridAxis = { label: "Impact", minLabel: "Low", maxLabel: "High" };

const ITEM_COLORS = [
  { bg: "#5e5fb7", text: "#fff" },
  { bg: "#e05c7a", text: "#fff" },
  { bg: "#2da875", text: "#fff" },
  { bg: "#e8a020", text: "#fff" },
  { bg: "#4898d4", text: "#fff" },
  { bg: "#9b59b6", text: "#fff" },
];

const Grid2x2Question: React.FC<Grid2x2QuestionProps> = ({ question, onSubmit, isSubmitting = false }) => {
  const items: GridItem[] = question.options ?? [];
  const xAxis = question.xAxis ?? DEFAULT_X_AXIS;
  const yAxis = question.yAxis ?? DEFAULT_Y_AXIS;

  const [placements, setPlacements] = useState<Record<string, Placement>>({});
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);

  const getGridPosition = useCallback((clientX: number, clientY: number): Placement | null => {
    const el = gridRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const rawX = (clientX - rect.left) / rect.width;
    const rawY = (clientY - rect.top) / rect.height;
    const x = Math.max(0, Math.min(1, rawX)) * 100;
    const y = (1 - Math.max(0, Math.min(1, rawY))) * 100; // flip Y so top = high
    return { x: Math.round(x), y: Math.round(y) };
  }, []);

  // ── Drag handlers (desktop) ───────────────────────────────────────────────
  const handleGridMouseDown = (e: React.MouseEvent) => {
    if (hasSubmitted || !activeItemId) return;
    e.preventDefault();
    const pos = getGridPosition(e.clientX, e.clientY);
    if (!pos) return;
    setIsDragging(true);
    setPlacements((prev) => ({ ...prev, [activeItemId]: pos }));
  };

  const handleGridMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !activeItemId || hasSubmitted) return;
    const pos = getGridPosition(e.clientX, e.clientY);
    if (!pos) return;
    setPlacements((prev) => ({ ...prev, [activeItemId]: pos }));
  };

  const handleGridMouseUp = () => {
    setIsDragging(false);
  };

  // ── Touch handlers (mobile) ───────────────────────────────────────────────
  const handleGridTouchStart = (e: React.TouchEvent) => {
    if (hasSubmitted || !activeItemId) return;
    const touch = e.touches[0];
    const pos = getGridPosition(touch.clientX, touch.clientY);
    if (!pos) return;
    setIsDragging(true);
    setPlacements((prev) => ({ ...prev, [activeItemId]: pos }));
  };

  const handleGridTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !activeItemId || hasSubmitted) return;
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getGridPosition(touch.clientX, touch.clientY);
    if (!pos) return;
    setPlacements((prev) => ({ ...prev, [activeItemId]: pos }));
  };

  const handleGridTouchEnd = () => {
    setIsDragging(false);
  };

  // ── Click-to-place fallback when item is active ───────────────────────────
  const handleGridClick = (e: React.MouseEvent) => {
    if (hasSubmitted || !activeItemId || isDragging) return;
    const pos = getGridPosition(e.clientX, e.clientY);
    if (!pos) return;
    setPlacements((prev) => ({ ...prev, [activeItemId]: pos }));
    // Auto-advance to next unplaced item
    const nextUnplaced = items.find((it) => it.id !== activeItemId && !placements[it.id]);
    setActiveItemId(nextUnplaced?.id ?? null);
  };

  const handleReset = () => {
    if (hasSubmitted) return;
    setPlacements({});
    setActiveItemId(null);
  };

  const handleSubmit = async () => {
    if (hasSubmitted || isSubmitting) return;
    const allPlaced = items.every((it) => placements[it.id] !== undefined);
    if (!allPlaced) return;
    setHasSubmitted(true);
    try {
      await onSubmit({ placements });
    } catch (err) {
      console.error("Grid submission failed:", err);
      setHasSubmitted(false);
    }
  };

  const placedCount = items.filter((it) => placements[it.id] !== undefined).length;
  const allPlaced = placedCount === items.length;
  const questionImage = question?.image || question?.imageUrl;

  return (
    <div style={{ background: "#ebedfb", minHeight: "100vh", width: "100%", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 20px 48px" }}>

        {/* Question title */}
        <h2 style={{ fontSize: "clamp(1.4rem, 4vw, 2.2rem)", fontWeight: 500, color: "#111", textAlign: "center", marginBottom: "8px", lineHeight: 1.3 }}>
          {question.text}
        </h2>
        {question.description && (
          <p style={{ textAlign: "center", color: "#555", fontSize: "1rem", marginBottom: "16px" }}>
            {question.description}
          </p>
        )}
        {questionImage && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <img src={questionImage} alt="" style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "12px" }} />
          </div>
        )}

        {/* Progress hint */}
        <p style={{ textAlign: "center", color: "#5e5fb7", fontWeight: 600, fontSize: "0.9rem", marginBottom: "20px" }}>
          {hasSubmitted
            ? "Submitted!"
            : allPlaced
            ? "All items placed — ready to submit!"
            : `${placedCount} / ${items.length} items placed`}
        </p>

        {/* Item selector chips */}
        {!hasSubmitted && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "20px" }}>
            {items.map((item, idx) => {
              const color = ITEM_COLORS[idx % ITEM_COLORS.length];
              const isActive = activeItemId === item.id;
              const isPlaced = placements[item.id] !== undefined;
              return (
                <button
                  key={item.id}
                  onClick={() => !hasSubmitted && setActiveItemId(isActive ? null : item.id)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "999px",
                    border: `2px solid ${color.bg}`,
                    background: isActive ? color.bg : isPlaced ? `${color.bg}22` : "#fff",
                    color: isActive ? color.text : color.bg,
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    opacity: hasSubmitted ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {isPlaced && (
                    <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                  )}
                  <span>{item.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Instruction text */}
        {!hasSubmitted && activeItemId && (
          <p style={{ textAlign: "center", color: "#888", fontSize: "0.85rem", marginBottom: "8px" }}>
            Click or drag on the grid to place <strong>{items.find(i => i.id === activeItemId)?.text}</strong>
          </p>
        )}
        {!hasSubmitted && !activeItemId && (
          <p style={{ textAlign: "center", color: "#888", fontSize: "0.85rem", marginBottom: "8px" }}>
            Select an item above, then click the grid to place it
          </p>
        )}

        {/* 2×2 Grid */}
        <div style={{ position: "relative", width: "100%", paddingBottom: "8px" }}>
          {/* Y-axis label */}
          <div style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateX(-4px) translateY(-50%) rotate(-90deg)",
            transformOrigin: "center center",
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#555",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 2,
          }}>
            {yAxis.label} →
          </div>

          <div style={{ marginLeft: "36px" }}>
            {/* Max Y label */}
            <div style={{ textAlign: "left", fontSize: "0.72rem", color: "#888", marginBottom: "2px", paddingLeft: "4px" }}>
              {yAxis.maxLabel}
            </div>

            {/* Grid area */}
            <div
              ref={gridRef}
              onMouseDown={handleGridMouseDown}
              onMouseMove={handleGridMouseMove}
              onMouseUp={handleGridMouseUp}
              onMouseLeave={handleGridMouseUp}
              onTouchStart={handleGridTouchStart}
              onTouchMove={handleGridTouchMove}
              onTouchEnd={handleGridTouchEnd}
              onClick={handleGridClick}
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1 / 1",
                maxHeight: "420px",
                background: "#dde0f5",
                borderRadius: "4px",
                cursor: activeItemId && !hasSubmitted ? "crosshair" : "default",
                userSelect: "none",
                touchAction: "none",
                overflow: "hidden",
              }}
            >
              {/* Quadrant dividers */}
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "2px", background: "#b8bcdc" }} />
              <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "2px", background: "#b8bcdc" }} />

              {/* Quadrant labels */}
              {[
                { top: 0, left: 0, label: `${yAxis.maxLabel} ${xAxis.minLabel}`, align: "left" as const },
                { top: 0, left: "50%", label: `${yAxis.maxLabel} ${xAxis.maxLabel}`, align: "right" as const },
                { top: "50%", left: 0, label: `${yAxis.minLabel} ${xAxis.minLabel}`, align: "left" as const },
                { top: "50%", left: "50%", label: `${yAxis.minLabel} ${xAxis.maxLabel}`, align: "right" as const },
              ].map((q, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: q.top,
                    left: q.left,
                    width: "50%",
                    height: "50%",
                    display: "flex",
                    alignItems: q.top === 0 ? "flex-start" : "flex-end",
                    justifyContent: q.align === "left" ? "flex-start" : "flex-end",
                    padding: "6px",
                    pointerEvents: "none",
                  }}
                >
                  <span style={{ fontSize: "0.6rem", color: "#a0a4c0", fontWeight: 500, textAlign: q.align }}>
                    {q.label}
                  </span>
                </div>
              ))}

              {/* Placed item dots */}
              {items.map((item, idx) => {
                const pos = placements[item.id];
                if (!pos) return null;
                const color = ITEM_COLORS[idx % ITEM_COLORS.length];
                const isActive = activeItemId === item.id;
                return (
                  <div
                    key={item.id}
                    style={{
                      position: "absolute",
                      left: `${pos.x}%`,
                      bottom: `${pos.y}%`,
                      transform: "translate(-50%, 50%)",
                      zIndex: isActive ? 10 : 5,
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: color.bg,
                        color: color.text,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        border: isActive ? "3px solid #fff" : "2px solid rgba(255,255,255,0.6)",
                        boxShadow: isActive ? `0 0 0 2px ${color.bg}` : "0 2px 6px rgba(0,0,0,0.2)",
                        cursor: hasSubmitted ? "default" : "pointer",
                      }}
                      onClick={(e) => {
                        if (hasSubmitted) return;
                        e.stopPropagation();
                        setActiveItemId(item.id);
                      }}
                      title={item.text}
                    >
                      {idx + 1}
                    </div>
                  </div>
                );
              })}

              {/* Submitted checkmark overlay */}
              {hasSubmitted && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(94,95,183,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  pointerEvents: "none",
                }}>
                  <CheckCircle2 size={48} color="#5e5fb7" strokeWidth={1.5} />
                </div>
              )}
            </div>

            

            {/* X-axis labels */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", paddingLeft: "4px", paddingRight: "4px" }}>
              <span style={{ fontSize: "0.72rem", color: "#888" }}>{xAxis.minLabel}</span>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#555" }}>{xAxis.label} →</span>
              <span style={{ fontSize: "0.72rem", color: "#888" }}>{xAxis.maxLabel}</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginTop: "16px", marginBottom: "24px" }}>
          {items.map((item, idx) => {
            const color = ITEM_COLORS[idx % ITEM_COLORS.length];
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: color.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, color: color.text, flexShrink: 0 }}>
                  {idx + 1}
                </div>
                <span style={{ fontSize: "0.82rem", color: "#444" }}>{item.text}</span>
              </div>
            );
          })}
        </div>

        {/* Reset + Submit */}
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", paddingBottom: "32px" }}>
          {!hasSubmitted && placedCount > 0 && (
            <button
              onClick={handleReset}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "10px 20px", borderRadius: "999px",
                border: "2px solid #aab2d4", background: "transparent",
                color: "#5e5fb7", fontWeight: 600, fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={hasSubmitted || isSubmitting || !allPlaced}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              minWidth: "160px",
              height: "48px",
              padding: "0 24px",
              borderRadius: "9999px",
              fontSize: "1rem",
              fontWeight: 500,
              transition: "all 0.2s",
              boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
              cursor: hasSubmitted || isSubmitting || !allPlaced ? "not-allowed" : "pointer",
              opacity: hasSubmitted || isSubmitting || !allPlaced ? 0.6 : 1,
              backgroundColor: hasSubmitted ? "#10b981" : "#5e5fb7",
              color: "white",
              border: "none",
            }}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : hasSubmitted ? (
              "Submitted!"
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Grid2x2Question;