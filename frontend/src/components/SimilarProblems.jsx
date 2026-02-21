import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, CheckCircle2, Circle, ArrowRight } from "lucide-react";

export default function SimilarProblems({ problemId }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (problemId) {
      loadSimilar();
    }
  }, [problemId]);

  const loadSimilar = async () => {
    try {
      const res = await api.get(`/api/problems/${problemId}/similar?limit=5`);
      setProblems(res.data);
    } catch (error) {
      console.error("Failed to load similar problems:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "medium": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "hard": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  if (loading) {
    return (
      <Card className="bg-zinc-900/30 border-zinc-800">
        <CardContent className="p-4">
          <div className="h-20 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (problems.length === 0) {
    return null;
  }

  return (
    <Card className="bg-zinc-900/30 border-zinc-800" data-testid="similar-problems">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          Similar Problems
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {problems.map((problem) => (
            <Link
              key={problem.id}
              to={`/problems/${problem.id}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group"
            >
              {problem.is_solved ? (
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-zinc-600 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{problem.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`text-xs ${getDifficultyColor(problem.difficulty)}`}>
                    {problem.difficulty}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {problem.similarity_score} tags match
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
