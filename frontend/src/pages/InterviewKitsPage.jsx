import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Briefcase, Building2, ChevronRight, CheckCircle2, Circle, ArrowRight } from "lucide-react";

// Company logos/colors
const companyStyles = {
  google: { bg: "from-blue-500/20 to-red-500/10", border: "border-blue-500/30", icon: "🔍" },
  meta: { bg: "from-blue-600/20 to-transparent", border: "border-blue-500/30", icon: "📘" },
  amazon: { bg: "from-orange-500/20 to-transparent", border: "border-orange-500/30", icon: "📦" },
  microsoft: { bg: "from-cyan-500/20 to-transparent", border: "border-cyan-500/30", icon: "🪟" },
  apple: { bg: "from-zinc-400/20 to-transparent", border: "border-zinc-400/30", icon: "🍎" }
};

export default function InterviewKitsPage() {
  const { user } = useAuth();
  const [kits, setKits] = useState([]);
  const [selectedKit, setSelectedKit] = useState(null);
  const [kitDetail, setKitDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKits();
  }, []);

  const loadKits = async () => {
    try {
      const res = await api.get("/api/interview-kits");
      setKits(res.data);
    } catch (error) {
      toast.error("Failed to load interview kits");
    } finally {
      setLoading(false);
    }
  };

  const loadKitDetail = async (kitId) => {
    try {
      const res = await api.get(`/api/interview-kits/${kitId}`);
      setKitDetail(res.data);
      setSelectedKit(kitId);
    } catch (error) {
      toast.error("Failed to load kit details");
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy": return "text-emerald-400";
      case "medium": return "text-amber-400";
      case "hard": return "text-red-400";
      default: return "text-zinc-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] px-6 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Briefcase className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Interview Prep</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Interview Kits</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Curated problem sets based on real interview questions from top tech companies
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Kits List */}
          <div className="lg:col-span-1 space-y-4" data-testid="interview-kits-list">
            {kits.map((kit) => {
              const style = companyStyles[kit.id] || companyStyles.google;
              const isSelected = selectedKit === kit.id;
              
              return (
                <Card 
                  key={kit.id}
                  className={`bg-gradient-to-r ${style.bg} ${style.border} cursor-pointer transition-all hover:scale-[1.02] ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => loadKitDetail(kit.id)}
                  data-testid={`kit-${kit.id}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{style.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{kit.company}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {kit.description}
                        </p>
                        
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">
                              {kit.solved_count}/{kit.problem_count} completed
                            </span>
                            <span className="text-primary font-medium">{kit.progress}%</span>
                          </div>
                          <Progress value={kit.progress} className="h-2" />
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-zinc-400 transition-transform ${
                        isSelected ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Kit Detail */}
          <div className="lg:col-span-2">
            {kitDetail ? (
              <Card className="bg-[#0a0a0b] border-zinc-800 sticky top-6">
                <CardHeader className="border-b border-zinc-800">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{companyStyles[kitDetail.id]?.icon || "🏢"}</div>
                    <div>
                      <CardTitle className="text-2xl text-white">{kitDetail.company}</CardTitle>
                      <p className="text-muted-foreground mt-1">{kitDetail.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Difficulty Distribution */}
                  <div className="flex gap-4 mb-6">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      {kitDetail.difficulty_distribution?.easy || 0} Easy
                    </Badge>
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      {kitDetail.difficulty_distribution?.medium || 0} Medium
                    </Badge>
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      {kitDetail.difficulty_distribution?.hard || 0} Hard
                    </Badge>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {kitDetail.tags?.map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Problems List */}
                  <h4 className="text-lg font-semibold text-white mb-4">Problems</h4>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {kitDetail.problems?.map((problem) => (
                      <Link
                        key={problem.id}
                        to={`/problems/${problem.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors group"
                      >
                        {problem.is_solved ? (
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-600 flex-shrink-0" />
                        )}
                        <span className="text-white flex-1">{problem.title}</span>
                        <span className={`text-sm ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                        <ArrowRight className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>

                  {/* Progress Summary */}
                  <div className="mt-6 pt-6 border-t border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Your Progress</p>
                        <p className="text-2xl font-bold text-white">
                          {kitDetail.solved_count}/{kitDetail.problem_count} <span className="text-primary">({kitDetail.progress}%)</span>
                        </p>
                      </div>
                      <Link to="/problems">
                        <Button className="group">
                          Start Practicing
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-[#0a0a0b] border-zinc-800 h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Building2 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Select a Company</h3>
                  <p className="text-muted-foreground">
                    Choose an interview kit from the left to see problems
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
