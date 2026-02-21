import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle2, Lock, ChevronRight, Filter } from "lucide-react";
import { toast } from "sonner";

const DIFFICULTY_COLORS = {
  easy: "text-green-400 border-green-400/30 bg-green-400/5",
  medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
  hard: "text-red-400 border-red-400/30 bg-red-400/5"
};

export default function ProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProblems();
  }, [diffFilter]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (diffFilter) params.difficulty = diffFilter;
      const res = await api.get("/problems", { params });
      setProblems(res.data);
    } catch (e) {
      toast.error("Failed to load problems");
    } finally {
      setLoading(false);
    }
  };

  const filtered = problems.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = {
    all: problems.length,
    easy: problems.filter(p => p.difficulty === "easy").length,
    medium: problems.filter(p => p.difficulty === "medium").length,
    hard: problems.filter(p => p.difficulty === "hard").length,
    solved: problems.filter(p => p.is_solved).length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold mb-1">Problems</h1>
        <p className="text-muted-foreground text-sm">
          {counts.solved} / {counts.all} solved
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: counts.all, color: "text-foreground" },
          { label: "Easy", value: counts.easy, color: "text-green-400" },
          { label: "Medium", value: counts.medium, color: "text-yellow-400" },
          { label: "Hard", value: counts.hard, color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#121215] border border-[#27272a] rounded-sm p-3 text-center">
            <div className={`text-xl font-bold font-heading ${color}`}>{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search problems or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#121215] border-[#27272a] h-9"
            data-testid="problem-search"
          />
        </div>
        <div className="flex gap-2">
          <Filter className="w-4 h-4 text-muted-foreground self-center" />
          {["", "easy", "medium", "hard"].map((d) => (
            <button
              key={d}
              onClick={() => setDiffFilter(d)}
              className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${
                diffFilter === d
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-[#27272a] text-muted-foreground hover:border-[#3f3f46] hover:text-foreground"
              }`}
              data-testid={`filter-${d || "all"}`}
            >
              {d ? d.charAt(0).toUpperCase() + d.slice(1) : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Problems Table */}
      <div className="bg-[#121215] border border-[#27272a] rounded-sm overflow-hidden">
        <div className="grid grid-cols-12 text-xs text-muted-foreground uppercase tracking-widest font-mono px-4 py-2.5 border-b border-[#27272a]">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-2 hidden sm:block">Difficulty</div>
          <div className="col-span-3 hidden md:block">Tags</div>
          <div className="col-span-1 text-right">Solved</div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading problems...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No problems found
          </div>
        ) : (
          filtered.map((problem, idx) => (
            <div
              key={problem.id}
              className="grid grid-cols-12 items-center px-4 py-3.5 border-b border-[#1e1e22] last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors group"
              onClick={() => navigate(`/problems/${problem.id}`)}
              data-testid={`problem-row-${idx}`}
            >
              <div className="col-span-1 text-xs text-muted-foreground font-mono">
                {idx + 1}
              </div>
              <div className="col-span-5 flex items-center gap-2">
                {problem.is_solved ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-[#27272a] flex-shrink-0" />
                )}
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  {problem.title}
                </span>
              </div>
              <div className="col-span-2 hidden sm:block">
                <span className={`text-xs font-mono capitalize px-2 py-0.5 rounded-sm border ${DIFFICULTY_COLORS[problem.difficulty] || ""}`}>
                  {problem.difficulty}
                </span>
              </div>
              <div className="col-span-3 hidden md:flex flex-wrap gap-1">
                {problem.tags?.slice(0, 2).map(t => (
                  <span key={t} className="tag-badge">{t}</span>
                ))}
                {problem.tags?.length > 2 && (
                  <span className="text-xs text-muted-foreground">+{problem.tags.length - 2}</span>
                )}
              </div>
              <div className="col-span-1 text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-xs text-muted-foreground hidden sm:block">{problem.solved_count}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
