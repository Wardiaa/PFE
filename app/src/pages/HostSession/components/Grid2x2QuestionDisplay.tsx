// Grid2x2QuestionDisplay.tsx — Host view for 2×2 grid question results
// Shows aggregated placements as a heatmap-style scatter plot with density visualization

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, TrendingUp, Grid3X3, EyeOff } from "lucide-react";

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
  x: number;
  y: number;
}

interface ParticipantPlacement {
  participantId: string;
  participantName: string;
  placements: Record<string, Placement>;
}

// Replace the existing interface with this:
interface Grid2x2QuestionDisplayProps {
  question: {
    text: string;
    description?: string;
    image?: string | null;
    imageUrl?: string | null;
    options: GridItem[];
    xAxis?: GridAxis;
    yAxis?: GridAxis;
  };
  responses: {
    individualResponses?: Array<{
      participantId?: string;      
      participantName?: string;     
      placements: Record<string, Placement>;
      timestamp?: Date;
    }>;
    totalResponses?: number;
  };
  showResults?: boolean;
  hideParticipantNames?: boolean;
}

const DEFAULT_X_AXIS: GridAxis = { label: "Effort", minLabel: "Low", maxLabel: "High" };
const DEFAULT_Y_AXIS: GridAxis = { label: "Impact", minLabel: "Low", maxLabel: "High" };

const ITEM_COLORS = [
  { bg: "#5e5fb7", text: "#fff", light: "rgba(94, 95, 183, 0.15)" },
  { bg: "#e05c7a", text: "#fff", light: "rgba(224, 92, 122, 0.15)" },
  { bg: "#2da875", text: "#fff", light: "rgba(45, 168, 117, 0.15)" },
  { bg: "#e8a020", text: "#fff", light: "rgba(232, 160, 32, 0.15)" },
  { bg: "#4898d4", text: "#fff", light: "rgba(72, 152, 212, 0.15)" },
  { bg: "#9b59b6", text: "#fff", light: "rgba(155, 89, 182, 0.15)" },
];

const Grid2x2QuestionDisplay: React.FC<Grid2x2QuestionDisplayProps> = ({
  question,
  responses,
  showResults = true,
  hideParticipantNames = false,
}) => {
  const items: GridItem[] = question.options ?? [];
  const xAxis = question.xAxis ?? DEFAULT_X_AXIS;
  const yAxis = question.yAxis ?? DEFAULT_Y_AXIS;
  const questionImage = question?.image || question?.imageUrl;

  const totalResponses = responses?.totalResponses ?? responses?.individualResponses?.length ?? 0;

  // Aggregate all placements across participants
  const aggregatedPlacements = useMemo(() => {
    const placementsByItem: Record<string, Placement[]> = {};
    
    items.forEach(item => {
      placementsByItem[item.id] = [];
    });

    (responses?.individualResponses ?? []).forEach(participant => {
      Object.entries(participant.placements).forEach(([itemId, placement]) => {
        if (placementsByItem[itemId]) {
          placementsByItem[itemId].push(placement);
        }
      });
    });

    // Calculate centroids (average position) for each item
    const centroids: Record<string, { x: number; y: number; count: number }> = {};
    items.forEach(item => {
      const placements = placementsByItem[item.id];
      if (placements.length > 0) {
        const avgX = placements.reduce((sum, p) => sum + p.x, 0) / placements.length;
        const avgY = placements.reduce((sum, p) => sum + p.y, 0) / placements.length;
        centroids[item.id] = { x: avgX, y: avgY, count: placements.length };
      } else {
        centroids[item.id] = { x: 50, y: 50, count: 0 };
      }
    });

    return { placementsByItem, centroids };
  }, [responses, items]);

  // Calculate heatmap density for each quadrant (percentage of placements per quadrant)
  const quadrantStats = useMemo(() => {
    const quadrants = [
      { name: "top-left", xMin: 0, xMax: 50, yMin: 50, yMax: 100, count: 0 },
      { name: "top-right", xMin: 50, xMax: 100, yMin: 50, yMax: 100, count: 0 },
      { name: "bottom-left", xMin: 0, xMax: 50, yMin: 0, yMax: 50, count: 0 },
      { name: "bottom-right", xMin: 50, xMax: 100, yMin: 0, yMax: 50, count: 0 },
    ];

    let totalPlacements = 0;
    Object.values(aggregatedPlacements.placementsByItem).forEach(placements => {
      placements.forEach(placement => {
        totalPlacements++;
        const quadrant = quadrants.find(q =>
          placement.x >= q.xMin && placement.x < q.xMax &&
          placement.y >= q.yMin && placement.y < q.yMax
        );
        if (quadrant) quadrant.count++;
      });
    });

    return quadrants.map(q => ({
      ...q,
      percentage: totalPlacements > 0 ? Math.round((q.count / totalPlacements) * 100) : 0,
    }));
  }, [aggregatedPlacements]);

  if (!showResults) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-10 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary mb-6">
            <Grid3X3 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Waiting for responses...</h3>
          <p className="text-muted-foreground mb-8">
            Participants are placing {items.length} items on the 2×2 grid.
          </p>
          <div className="space-y-3 max-w-md mx-auto">
            {items.map((item, i) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 text-left border border-border/50">
                <div className="w-6 h-6 rounded-full" style={{ background: ITEM_COLORS[i % ITEM_COLORS.length].bg }} />
                <span className="text-sm font-medium truncate">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">

      {questionImage && (
        <div className="mb-6 rounded-xl overflow-hidden border border-border bg-muted/20 flex justify-center p-2">
          <img src={questionImage} alt="" className="max-h-48 object-contain" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Grid Visualization */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Placement Map
            </h3>

            {/* Grid container */}
            <div style={{ position: "relative", width: "100%", paddingBottom: "8px" }}>
              {/* Y-axis label - positioned on the left side (vertical text) */}
              <div style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateX(-4px) translateY(-50%) rotate(-90deg)",
                transformOrigin: "center center",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#555",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                zIndex: 2,
              }}>
                {yAxis.label} →
              </div>

              <div style={{ marginLeft: "36px" }}>
                {/* OUTER TOP Y-AXIS LABEL - should be yAxis.maxLabel ONLY */}
                <div style={{ textAlign: "left", fontSize: "0.7rem", color: "#888", marginBottom: "2px", paddingLeft: "4px" }}>
                  {yAxis.maxLabel}
                </div>

                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "1 / 1",
                    maxHeight: "400px",
                    background: "#f0f2fa",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid #e2e4ea",
                  }}
                >
                  {/* Quadrant dividers */}
                  <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "2px", background: "#cbd0e0" }} />
                  <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "2px", background: "#cbd0e0" }} />

                  {/* Quadrant backgrounds with heatmap intensity */}
                  {quadrantStats.map((q, i) => {
                    const intensity = Math.min(q.percentage / 100, 0.8);
                    return (
                      <div
                        key={i}
                        style={{
                          position: "absolute",
                          top: q.name.includes("top") ? 0 : "50%",
                          left: q.name.includes("left") ? 0 : "50%",
                          width: "50%",
                          height: "50%",
                          background: `radial-gradient(circle at center, rgba(94, 95, 183, ${intensity * 0.3}) 0%, transparent 70%)`,
                          pointerEvents: "none",
                        }}
                      />
                    );
                  })}

                  {/* INNER QUADRANT LABELS - Show both X and Y axis values */}
                  {/* Top-Left: High Y, Low X */}
                  <div style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "50%", display: "flex", alignItems: "flex-start", justifyContent: "flex-start", padding: "8px", pointerEvents: "none" }}>
                    <span style={{ fontSize: "0.6rem", color: "#a0a4c0", fontWeight: 500 }}>
                      {yAxis.maxLabel} / {xAxis.minLabel}
                    </span>
                  </div>
                  {/* Top-Right: High Y, High X */}
                  <div style={{ position: "absolute", top: 0, left: "50%", width: "50%", height: "50%", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: "8px", pointerEvents: "none" }}>
                    <span style={{ fontSize: "0.6rem", color: "#a0a4c0", fontWeight: 500 }}>
                      {yAxis.maxLabel} / {xAxis.maxLabel}
                    </span>
                  </div>
                  {/* Bottom-Left: Low Y, Low X */}
                  <div style={{ position: "absolute", top: "50%", left: 0, width: "50%", height: "50%", display: "flex", alignItems: "flex-end", justifyContent: "flex-start", padding: "8px", pointerEvents: "none" }}>
                    <span style={{ fontSize: "0.6rem", color: "#a0a4c0", fontWeight: 500 }}>
                      {yAxis.minLabel} / {xAxis.minLabel}
                    </span>
                  </div>
                  {/* Bottom-Right: Low Y, High X */}
                  <div style={{ position: "absolute", top: "50%", left: "50%", width: "50%", height: "50%", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: "8px", pointerEvents: "none" }}>
                    <span style={{ fontSize: "0.6rem", color: "#a0a4c0", fontWeight: 500 }}>
                      {yAxis.minLabel} / {xAxis.maxLabel}
                    </span>
                  </div>

                  {/* Placed item dots with size based on frequency */}
                  {items.map((item, idx) => {
                    const centroids = aggregatedPlacements.centroids[item.id];
                    if (!centroids || centroids.count === 0) return null;
                    const color = ITEM_COLORS[idx % ITEM_COLORS.length];
                    const size = Math.max(24, Math.min(48, 24 + Math.floor(centroids.count / totalResponses * 24)));
                    
                    return (
                      <div
                        key={item.id}
                        style={{
                          position: "absolute",
                          left: `${centroids.x}%`,
                          bottom: `${centroids.y}%`,
                          transform: "translate(-50%, 50%)",
                          zIndex: 5,
                        }}
                      >
                        <div
                          style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            borderRadius: "50%",
                            background: color.bg,
                            color: color.text,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: size > 30 ? "0.8rem" : "0.65rem",
                            fontWeight: 700,
                            border: "2px solid white",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            cursor: "default",
                          }}
                          title={`${item.text}: ${centroids.count} placement${centroids.count !== 1 ? "s" : ""}`}
                        >
                          {centroids.count}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* X-axis labels (bottom) */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", paddingLeft: "4px", paddingRight: "4px" }}>
                  <span style={{ fontSize: "0.7rem", color: "#888" }}>{xAxis.minLabel}</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#555" }}>{xAxis.label} →</span>
                  <span style={{ fontSize: "0.7rem", color: "#888" }}>{xAxis.maxLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Stats and Item Breakdown */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quadrant Distribution */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Quadrant Distribution</h3>
            <div className="space-y-2">
              {quadrantStats.map((q) => (
                <div key={q.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize text-muted-foreground">{q.name.replace("-", " ")}</span>
                    <span className="font-medium">{q.percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${q.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Item Breakdown */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Item Placement</h3>
            <div className="space-y-3">
              {items.map((item, idx) => {
                const centroids = aggregatedPlacements.centroids[item.id];
                const color = ITEM_COLORS[idx % ITEM_COLORS.length];
                const placements = aggregatedPlacements.placementsByItem[item.id] || [];
                
                // Determine dominant quadrant
                let dominantQuadrant = "—";
                let maxCount = 0;
                quadrantStats.forEach(q => {
                  const count = placements.filter(p =>
                    p.x >= q.xMin && p.x < q.xMax &&
                    p.y >= q.yMin && p.y < q.yMax
                  ).length;
                  if (count > maxCount) {
                    maxCount = count;
                    dominantQuadrant = q.name.replace("-", " ");
                  }
                });

                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: color.bg }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.text}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{centroids?.count || 0} votes</span>
                        <span>·</span>
                        <span>Mostly {dominantQuadrant}</span>
                      </div>
                      {centroids && (
                        <div className="mt-1.5 flex items-center gap-1">
                          <div className="text-[10px] text-muted-foreground">Avg:</div>
                          <div className="text-[10px] font-mono">
                            X: {Math.round(centroids.x)}%, Y: {Math.round(centroids.y)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {!hideParticipantNames && responses?.individualResponses && responses.individualResponses.length > 0 && (
        <div className="mt-6 bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Individual Submissions
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {responses.individualResponses.slice(0, 10).map((participant, idx) => (
              <div key={idx} className="text-xs p-2 bg-muted/30 rounded-lg">
                <span className="font-medium">{participant.participantName}</span>
                <span className="text-muted-foreground ml-2">
                  placed {Object.keys(participant.placements).length} items
                </span>
              </div>
            ))}
            {responses.individualResponses.length > 10 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{responses.individualResponses.length - 10} more submissions
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Grid2x2QuestionDisplay;