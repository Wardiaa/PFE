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

// Mentimeter-inspired flat color palette
const ITEM_COLORS = [
  { bg: "#4549f5", text: "#ffffff" },
  { bg: "#ec4899", text: "#ffffff" },
  { bg: "#10b981", text: "#ffffff" },
  { bg: "#f59e0b", text: "#ffffff" },
  { bg: "#6366f1", text: "#ffffff" },
  { bg: "#ef4444", text: "#ffffff" },
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
    const y = (1 - Math.max(0, Math.min(1, rawY))) * 100; 
    return { x: Math.round(x), y: Math.round(y) };
  }, []);

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
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    const pos = getGridPosition(touch.clientX, touch.clientY);
    if (!pos) return;
    setPlacements((prev) => ({ ...prev, [activeItemId]: pos }));
  };

  const handleGridTouchEnd = () => {
    setIsDragging(false);
  };

  const handleGridClick = (e: React.MouseEvent) => {
    if (hasSubmitted || !activeItemId || isDragging) return;
    const pos = getGridPosition(e.clientX, e.clientY);
    if (!pos) return;
    setPlacements((prev) => ({ ...prev, [activeItemId]: pos }));
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
    <div style={{ 
      background: "#ffffff", 
      minHeight: "100vh", 
      width: "100%", 
      boxSizing: "border-box", 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: "#1a1a1a"
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
        
        {/* Question Header */}
        <header style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "12px", letterSpacing: "-0.02em" }}>
            {question.text}
          </h2>
          {question.description && (
            <p style={{ color: "#666", fontSize: "1.05rem", maxWidth: "600px", margin: "0 auto" }}>
              {question.description}
            </p>
          )}
          {questionImage && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
              <img src={questionImage} alt="" style={{ maxWidth: "100%", maxHeight: "160px", borderRadius: "12px" }} />
            </div>
          )}
        </header>

        {/* Top Toggle Selection */}
        {!hasSubmitted && (
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
              {items.map((item, idx) => {
                const color = ITEM_COLORS[idx % ITEM_COLORS.length];
                const isActive = activeItemId === item.id;
                const isPlaced = placements[item.id] !== undefined;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveItemId(isActive ? null : item.id)}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "12px",
                      border: "none",
                      background: isActive ? color.bg : isPlaced ? "#f1f5f9" : "#f8fafc",
                      color: isActive ? "#fff" : isPlaced ? "#94a3b8" : "#475569",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {isPlaced ? <CheckCircle2 size={16} /> : <div style={{ width: 8, height: 8, borderRadius: "50%", background: color.bg }} />}
                    {item.text}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* The Grid */}
        <div style={{ position: "relative", padding: "20px 0" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", maxWidth: "500px", margin: "0 auto" }}>
            
            {/* Y-Axis Side Label */}
            <div style={{
              position: "absolute",
              left: "-35px",
              top: "50%",
              transform: "rotate(-90deg) translateY(-50%)",
              fontSize: "0.7rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#94a3b8"
            }}>
              {yAxis.label}
            </div>

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
                width: "100%",
                height: "100%",
                background: "#fcfcfc",
                borderRadius: "16px",
                border: "2px solid #94a3b8", // More visible border
                position: "relative",
                cursor: activeItemId && !hasSubmitted ? "crosshair" : "default",
                overflow: "hidden",
                touchAction: "none",
              }}
            >
              {/* Visible Grid Lines (Quadrants) - More visible */}
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "2px", background: "#64748b", zIndex: 1 }} />
              <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "2px", background: "#64748b", zIndex: 1 }} />

              {/* Subtle background quadrants */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", pointerEvents: "none" }}>
                <div style={{ background: "rgba(0,0,0,0.02)" }} />
                <div style={{ background: "rgba(0,0,0,0.01)" }} />
                <div style={{ background: "rgba(0,0,0,0.01)" }} />
                <div style={{ background: "rgba(0,0,0,0.02)" }} />
              </div>

              {/* Quadrant Labels */}
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", padding: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", zIndex: 2 }}>
                <span style={{ fontSize: "0.7rem", color: "#475569", fontWeight: 600, alignSelf: "start", justifySelf: "start" }}>{yAxis.maxLabel} / {xAxis.minLabel}</span>
                <span style={{ fontSize: "0.7rem", color: "#475569", fontWeight: 600, alignSelf: "start", justifySelf: "end" }}>{yAxis.maxLabel} / {xAxis.maxLabel}</span>
                <span style={{ fontSize: "0.7rem", color: "#475569", fontWeight: 600, alignSelf: "end", justifySelf: "start" }}>{yAxis.minLabel} / {xAxis.minLabel}</span>
                <span style={{ fontSize: "0.7rem", color: "#475569", fontWeight: 600, alignSelf: "end", justifySelf: "end" }}>{yAxis.minLabel} / {xAxis.maxLabel}</span>
              </div>

              {/* Placed Items - No shadows, flat design */}
              {items.map((item, idx) => {
                const pos = placements[item.id];
                if (!pos) return null;
                const color = ITEM_COLORS[idx % ITEM_COLORS.length];
                const isActive = activeItemId === item.id;
                
                return (
                  <motion.div
                    key={item.id}
                    layoutId={item.id}
                    style={{
                      position: "absolute",
                      left: `${pos.x}%`,
                      bottom: `${pos.y}%`,
                      zIndex: isActive ? 20 : 10,
                    }}
                  >
                    <div
                      style={{
                        transform: "translate(-50%, 50%)",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: color.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        border: isActive ? "3px solid #1a1a1a" : "2px solid #ffffff",
                        cursor: "pointer",
                        boxShadow: "none", // No shadow, flat
                        transition: "transform 0.1s ease",
                      }}
                      onClick={(e) => {
                        if (hasSubmitted) return;
                        e.stopPropagation();
                        setActiveItemId(item.id);
                      }}
                    >
                      {idx + 1}
                    </div>
                  </motion.div>
                );
              })}
              
              {hasSubmitted && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.75)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30 }}>
                  <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <CheckCircle2 size={60} color="#10b981" strokeWidth={2.5} />
                  </motion.div>
                </div>
              )}
            </div>

            {/* X-Axis Labels */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
              <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 600 }}>{xAxis.minLabel}</span>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#64748b" }}>{xAxis.label}</span>
              <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 600 }}>{xAxis.maxLabel}</span>
            </div>
          </div>
        </div>

        {/* Text Legend */}
        <div style={{ marginTop: "32px", display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
          {items.map((item, idx) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ 
                width: "24px", height: "24px", borderRadius: "50%", background: ITEM_COLORS[idx % ITEM_COLORS.length].bg,
                color: "#fff", fontSize: "0.75rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {idx + 1}
              </div>
              <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "#334155" }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
          {!hasSubmitted ? (
            <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "center" }}>
              {placedCount > 0 && (
                <button
                  onClick={handleReset}
                  style={{
                    padding: "0 24px",
                    height: "48px",
                    borderRadius: "12px",
                    border: "2px solid #e2e8f0",
                    background: "white",
                    color: "#64748b",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
              )}
              
              <button
                onClick={handleSubmit}
                disabled={!allPlaced || isSubmitting}
                style={{
                  height: "48px",
                  padding: "0 40px",
                  borderRadius: "12px",
                  border: "none",
                  background: allPlaced ? "#6366f1" : "#cbd5e1", // Changed to indigo-500 to match MultipleChoiceQuestion
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  cursor: allPlaced ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  opacity: allPlaced ? 1 : 0.6,
                }}
                onMouseEnter={(e) => {
                  if (allPlaced && !isSubmitting) {
                    e.currentTarget.style.background = "#4f46e5"; // hover:indigo-600
                  }
                }}
                onMouseLeave={(e) => {
                  if (allPlaced && !isSubmitting) {
                    e.currentTarget.style.background = "#6366f1"; // back to indigo-500
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Answer
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div style={{ 
              background: "#f0fdf4", 
              color: "#166534", 
              padding: "12px 24px", 
              borderRadius: "12px", 
              fontWeight: 600,
              fontSize: "0.95rem"
            }}>
              Response Submitted
            </div>
          )}

          <p style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            {placedCount} / {items.length} items placed
          </p>
        </div>
      </div>
    </div>
  );
};

export default Grid2x2Question;