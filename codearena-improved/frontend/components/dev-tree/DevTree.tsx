"use client";

import { useState, useMemo } from "react";
import { SKILL_TREE_CONFIG } from "@/lib/utils";

interface DevTreeProps {
  userSkills: Record<string, number>;
}

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  "Arrays": { x: 220, y: 20 },
  "Strings": { x: 60, y: 120 },
  "Hash Map": { x: 380, y: 120 },
  "Stack": { x: 60, y: 230 },
  "Linked List": { x: 380, y: 230 },
  "Binary Search": { x: 220, y: 160 },
  "Sliding Window": { x: 600, y: 160 },
  "Trees": { x: 220, y: 340 },
  "Heap": { x: 480, y: 340 },
  "Graphs": { x: 100, y: 450 },
  "Dynamic Programming": { x: 380, y: 450 },
  "Backtracking": { x: 250, y: 560 },
};

export function DevTree({ userSkills }: DevTreeProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const getNodeStatus = (skillId: string): "unlocked" | "available" | "locked" => {
    const config = SKILL_TREE_CONFIG.find((s) => s.id === skillId);
    if (!config) return "locked";

    const solved = userSkills[skillId] || 0;
    if (solved >= config.problemsRequired) return "unlocked";

    const prereqsMet = config.prereqs.every((prereq) => {
      const prereqConfig = SKILL_TREE_CONFIG.find((s) => s.id === prereq);
      return prereqConfig && (userSkills[prereq] || 0) >= prereqConfig.problemsRequired;
    });

    return prereqsMet ? "available" : "locked";
  };

  const selectedConfig = selected ? SKILL_TREE_CONFIG.find((s) => s.id === selected) : null;
  const selectedStatus = selected ? getNodeStatus(selected) : null;

  return (
    <div className="flex gap-4">
      {/* SVG Canvas */}
      <div className="flex-1 bg-github-secondary border border-github-border rounded-md overflow-hidden relative" style={{ minHeight: 640 }}>
        <div className="p-4 border-b border-github-border flex items-center justify-between">
          <h3 className="text-[13px] font-semibold">🌳 Dev-Tree — Skill Progression</h3>
          <div className="flex items-center gap-4 text-[11px] text-github-muted">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-github-green inline-block" />Unlocked</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-github-blue inline-block" />Available</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-github-border inline-block" />Locked</span>
          </div>
        </div>

        <div className="relative overflow-auto" style={{ height: 580 }}>
          <svg
            style={{ position: "absolute", top: 0, left: 0, width: 740, height: 620, pointerEvents: "none" }}
          >
            {SKILL_TREE_CONFIG.map((node) =>
              node.prereqs.map((prereqId) => {
                const from = NODE_POSITIONS[prereqId];
                const to = NODE_POSITIONS[node.id];
                if (!from || !to) return null;
                const x1 = from.x + 65, y1 = from.y + 34;
                const x2 = to.x + 65, y2 = to.y;
                const status = getNodeStatus(node.id);
                const color = status === "unlocked" ? "#238636" : status === "available" ? "#58a6ff" : "#30363d";
                return (
                  <path
                    key={`${prereqId}-${node.id}`}
                    d={`M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`}
                    stroke={color}
                    strokeWidth={status === "unlocked" ? 2 : 1.5}
                    fill="none"
                    strokeDasharray={status === "locked" ? "5 5" : undefined}
                    opacity={status === "locked" ? 0.4 : 0.8}
                  />
                );
              })
            )}
          </svg>

          {SKILL_TREE_CONFIG.map((node) => {
            const pos = NODE_POSITIONS[node.id];
            if (!pos) return null;
            const status = getNodeStatus(node.id);
            const solved = userSkills[node.id] || 0;
            const pct = Math.min((solved / node.problemsRequired) * 100, 100);
            const isSelected = selected === node.id;

            return (
              <div
                key={node.id}
                onClick={() => status !== "locked" && setSelected(isSelected ? null : node.id)}
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  width: 130,
                  padding: "10px 12px",
                  background: "#161b22",
                  borderRadius: 4,
                  cursor: status === "locked" ? "not-allowed" : "pointer",
                  opacity: status === "locked" ? 0.45 : 1,
                  border: `1px solid ${isSelected ? "#58a6ff" : status === "unlocked" ? "#238636" : status === "available" ? "#58a6ff55" : "#30363d"}`,
                  boxShadow: isSelected ? "0 0 0 2px rgba(88,166,255,0.2)" : status === "unlocked" ? "0 0 8px rgba(35,134,54,0.2)" : "none",
                  transition: "all 0.15s",
                }}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[13px]">
                    {status === "unlocked" ? "✅" : status === "available" ? "🔵" : "🔒"}
                  </span>
                </div>
                <div className="text-[11px] font-semibold mb-1.5" style={{ color: status === "unlocked" ? "#3fb950" : "#c9d1d9" }}>
                  {node.id}
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "#30363d" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: status === "unlocked" ? "#238636" : "#58a6ff", borderRadius: 999, transition: "width 0.4s" }} />
                </div>
                <div className="text-[10px] mt-1" style={{ color: "#8b949e" }}>{solved}/{node.problemsRequired} solved</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side panel */}
      <div className="w-64 flex-shrink-0 space-y-3">
        {selected && selectedConfig ? (
          <div className="bg-github-secondary border border-github-border rounded-md p-5 space-y-4 animate-fade-in">
            <div>
              <h3 className="font-bold text-[15px] mb-1">{selectedConfig.id}</h3>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                selectedStatus === "unlocked" ? "bg-github-green/15 text-[#3fb950] border border-github-green/30" :
                selectedStatus === "available" ? "bg-github-blue/15 text-github-blue border border-github-blue/30" :
                "bg-github-red/15 text-github-red border border-github-red/30"
              }`}>
                {selectedStatus === "unlocked" ? "✓ Unlocked" : selectedStatus === "available" ? "○ Available" : "🔒 Locked"}
              </span>
            </div>

            <div>
              <div className="flex justify-between text-[12px] mb-1.5">
                <span className="text-github-muted">Progress</span>
                <span>{userSkills[selected] || 0}/{selectedConfig.problemsRequired}</span>
              </div>
              <div className="h-2 bg-github-border rounded-full overflow-hidden">
                <div style={{
                  height: "100%", width: `${Math.min(((userSkills[selected] || 0) / selectedConfig.problemsRequired) * 100, 100)}%`,
                  background: "#238636", borderRadius: 999, transition: "width 0.4s"
                }} />
              </div>
            </div>

            {selectedConfig.prereqs.length > 0 && (
              <div>
                <p className="text-[12px] text-github-muted mb-2">Prerequisites</p>
                <div className="flex gap-1.5 flex-wrap">
                  {selectedConfig.prereqs.map((p) => (
                    <span key={p} className="text-[11px] px-2 py-0.5 bg-github-blue/10 text-github-blue border border-github-blue/20 rounded-full">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[12px] text-github-muted mb-1.5">XP Required</p>
              <span className="text-[11px] px-2 py-0.5 bg-github-yellow/10 text-[#e3b341] border border-github-yellow/20 rounded-full">
                ✦ {selectedConfig.xpRequired} XP
              </span>
            </div>

            <a href={`/practice?tag=${encodeURIComponent(selectedConfig.id)}`}
              className="block w-full text-center py-2 bg-github-green/80 hover:bg-github-green text-white rounded-md text-[13px] font-medium transition-colors">
              Practice {selectedConfig.id} →
            </a>
          </div>
        ) : (
          <div className="bg-github-secondary border border-github-border rounded-md p-5">
            <p className="text-[13px] text-github-muted">Click a node to see details and related problems</p>
          </div>
        )}

        <div className="bg-github-secondary border border-github-border rounded-md p-5 space-y-2">
          <h4 className="text-[13px] font-semibold mb-3">Skill Summary</h4>
          {SKILL_TREE_CONFIG.map((node) => {
            const solved = userSkills[node.id] || 0;
            const status = getNodeStatus(node.id);
            return (
              <div key={node.id} className="flex items-center gap-2 py-1 border-b border-github-border/50">
                <span className="text-[11px]">{status === "unlocked" ? "✅" : status === "available" ? "🔵" : "⬜"}</span>
                <span className="text-[12px] flex-1 text-github-muted">{node.id}</span>
                <span className="text-[11px] font-mono text-github-muted">{solved}/{node.problemsRequired}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
