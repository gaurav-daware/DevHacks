"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getDifficultyBg } from "@/lib/utils";
import { Search, CheckCircle2, Circle, Filter, TrendingUp, Target, Zap } from "lucide-react";

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  acceptance: string;
  solved: boolean;
}

const ALL_TAGS = ["All", "Arrays", "Strings", "Hash Map", "Dynamic Programming", "Graphs", "BFS", "DFS", "Stack", "Linked List", "Sliding Window", "Binary Search", "Trees", "Heap"];

function DiffBadge({ difficulty }: { difficulty: string }) {
  const cls = difficulty === "Easy" ? "badge-easy" : difficulty === "Medium" ? "badge-medium" : "badge-hard";
  return (
    <span className={`${cls} text-[11px] px-2 py-0.5 rounded-full font-medium`}>
      {difficulty}
    </span>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1"
      style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
    >
      <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-[22px] font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

export default function PracticePage() {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [tag, setTag] = useState("All");

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (difficulty !== "All") params.set("difficulty", difficulty);
    if (tag !== "All") params.set("tag", tag);
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/problems?${params}`);
      const data = await res.json();
      setProblems(Array.isArray(data) ? data : []);
    } catch {
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }, [difficulty, tag, search]);

  useEffect(() => {
    const t = setTimeout(fetchProblems, 300);
    return () => clearTimeout(t);
  }, [fetchProblems]);

  const stats = {
    easy:   problems.filter((p) => p.difficulty === "Easy" && p.solved).length,
    medium: problems.filter((p) => p.difficulty === "Medium" && p.solved).length,
    hard:   problems.filter((p) => p.difficulty === "Hard" && p.solved).length,
    total:  problems.filter((p) => p.solved).length,
  };

  const easyTotal   = problems.filter((p) => p.difficulty === "Easy").length;
  const mediumTotal = problems.filter((p) => p.difficulty === "Medium").length;
  const hardTotal   = problems.filter((p) => p.difficulty === "Hard").length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <main className="flex-1 max-w-[1260px] mx-auto w-full px-5 py-5 flex gap-5">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 space-y-4">
          {/* Progress card */}
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--accent-blue)" }} />
              <p className="text-[12px] font-semibold" style={{ color: "var(--text-secondary)" }}>Progress</p>
            </div>

            {/* Ring progress */}
            <div className="flex justify-center mb-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border-default)" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke="var(--accent-green)" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - (stats.total / Math.max(problems.length, 1)))}`}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>{stats.total}</span>
                  <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>solved</span>
                </div>
              </div>
            </div>

            {[
              { label: "Easy",   count: stats.easy,   total: easyTotal,   color: "var(--accent-green)" },
              { label: "Medium", count: stats.medium, total: mediumTotal, color: "var(--accent-yellow)" },
              { label: "Hard",   count: stats.hard,   total: hardTotal,   color: "var(--accent-red)" },
            ].map((s) => (
              <div key={s.label} className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-medium" style={{ color: s.color }}>{s.label}</span>
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.count}/{s.total}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${s.total > 0 ? (s.count / s.total) * 100 : 0}%`, background: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-3.5 h-3.5" style={{ color: "var(--accent-blue)" }} />
              <p className="text-[12px] font-semibold" style={{ color: "var(--text-secondary)" }}>Filter by Tag</p>
            </div>
            <div className="flex flex-col gap-0.5">
              {ALL_TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className="text-left text-[12px] px-2.5 py-1.5 rounded-lg transition-all"
                  style={{
                    color: tag === t ? "var(--accent-blue)" : "var(--text-muted)",
                    background: tag === t ? "var(--accent-blue-dim)" : "transparent",
                    border: tag === t ? "1px solid rgba(79,142,247,0.2)" : "1px solid transparent",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Filters row */}
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search problems..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-[13px] transition-all"
                style={{
                  background: "var(--bg-raised)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent-blue)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-default)")}
              />
            </div>

            {["All", "Easy", "Medium", "Hard"].map((d) => {
              const active = difficulty === d;
              const clr = d === "Easy" ? "var(--accent-green)" : d === "Medium" ? "var(--accent-yellow)" : d === "Hard" ? "var(--accent-red)" : "var(--accent-blue)";
              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className="px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
                  style={{
                    color: active ? clr : "var(--text-muted)",
                    background: active ? `${clr}18` : "var(--bg-raised)",
                    border: `1px solid ${active ? `${clr}40` : "var(--border-default)"}`,
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
          >
            {/* Table header */}
            <div
              className="grid items-center px-5 py-3 text-[10px] font-bold uppercase tracking-widest"
              style={{
                gridTemplateColumns: "36px 1fr 90px 90px 160px 48px",
                gap: "8px",
                color: "var(--text-muted)",
                borderBottom: "1px solid var(--border-subtle)",
                background: "var(--bg-overlay)",
              }}
            >
              <div>#</div>
              <div>Title</div>
              <div>Acceptance</div>
              <div>Difficulty</div>
              <div>Topics</div>
              <div className="text-center">✓</div>
            </div>

            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="grid items-center px-5 py-3.5"
                  style={{ gridTemplateColumns: "36px 1fr 90px 90px 160px 48px", gap: "8px", borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <div className="skeleton h-3 w-6" />
                  <div className="skeleton h-3 w-48" />
                  <div className="skeleton h-3 w-14" />
                  <div className="skeleton h-5 w-16 rounded-full" />
                  <div className="skeleton h-3 w-24" />
                  <div className="skeleton h-4 w-4 rounded-full" />
                </div>
              ))
            ) : problems.length === 0 ? (
              <div className="py-20 text-center" style={{ color: "var(--text-muted)" }}>
                <Target className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-[14px]">No problems found</p>
              </div>
            ) : (
              problems.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/practice/${p.slug}`)}
                  className="grid items-center px-5 py-3.5 cursor-pointer transition-all group"
                  style={{
                    gridTemplateColumns: "36px 1fr 90px 90px 160px 48px",
                    gap: "8px",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-overlay)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                  <span
                    className="text-[13px] font-medium truncate transition-colors"
                    style={{ color: p.solved ? "var(--accent-green)" : "var(--text-primary)" }}
                  >
                    {p.title}
                  </span>
                  <span className="text-[12px] font-mono" style={{ color: "var(--text-muted)" }}>{p.acceptance}</span>
                  <DiffBadge difficulty={p.difficulty} />
                  <div className="flex gap-1 flex-wrap">
                    {p.tags.slice(0, 2).map((t) => (
                      <span key={t} className="badge-blue text-[10px] px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-center">
                    {p.solved
                      ? <CheckCircle2 className="w-4 h-4" style={{ color: "var(--accent-green)" }} />
                      : <Circle className="w-4 h-4" style={{ color: "var(--border-strong)" }} />}
                  </div>
                </div>
              ))
            )}
          </div>

          {problems.length > 0 && (
            <p className="text-[11px] text-center" style={{ color: "var(--text-muted)" }}>
              {problems.length} problems · {stats.total} solved
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
