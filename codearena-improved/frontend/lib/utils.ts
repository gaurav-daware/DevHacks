import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function calcEloChange(
  myRating: number,
  opponentRating: number,
  won: boolean
): number {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));
  const actual = won ? 1 : 0;
  return Math.round(K * (actual - expected));
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case "easy": return "text-github-green";
    case "medium": return "text-github-yellow";
    case "hard": return "text-github-red";
    default: return "text-github-muted";
  }
}

export function getDifficultyBg(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case "easy": return "bg-[rgba(35,134,54,0.15)] text-[#3fb950] border border-[rgba(35,134,54,0.3)]";
    case "medium": return "bg-[rgba(210,153,34,0.15)] text-[#e3b341] border border-[rgba(210,153,34,0.3)]";
    case "hard": return "bg-[rgba(218,54,51,0.15)] text-[#f85149] border border-[rgba(218,54,51,0.3)]";
    default: return "";
  }
}

export function formatRuntime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatMemory(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export const LANGUAGE_IDS: Record<string, number> = {
  python: 71,    // Python 3.8
  cpp: 54,       // C++ 17
  java: 62,      // Java 11
  javascript: 63, // Node.js 12
};

export const LANGUAGE_LABELS: Record<string, string> = {
  python: "🐍 Python 3",
  cpp: "⚡ C++17",
  java: "☕ Java 11",
  javascript: "🟨 JavaScript",
};

export const SKILL_TREE_CONFIG = [
  { id: "Arrays", prereqs: [], xpRequired: 0, problemsRequired: 3 },
  { id: "Strings", prereqs: ["Arrays"], xpRequired: 100, problemsRequired: 3 },
  { id: "Hash Map", prereqs: ["Arrays"], xpRequired: 100, problemsRequired: 3 },
  { id: "Stack", prereqs: ["Strings"], xpRequired: 200, problemsRequired: 2 },
  { id: "Linked List", prereqs: ["Hash Map"], xpRequired: 200, problemsRequired: 3 },
  { id: "Trees", prereqs: ["Linked List", "Stack"], xpRequired: 350, problemsRequired: 3 },
  { id: "Graphs", prereqs: ["Trees"], xpRequired: 500, problemsRequired: 4 },
  { id: "Dynamic Programming", prereqs: ["Trees"], xpRequired: 600, problemsRequired: 4 },
  { id: "Sliding Window", prereqs: ["Strings", "Arrays"], xpRequired: 250, problemsRequired: 3 },
  { id: "Binary Search", prereqs: ["Arrays"], xpRequired: 150, problemsRequired: 3 },
  { id: "Heap", prereqs: ["Trees"], xpRequired: 450, problemsRequired: 3 },
  { id: "Backtracking", prereqs: ["Graphs", "Dynamic Programming"], xpRequired: 700, problemsRequired: 4 },
];
