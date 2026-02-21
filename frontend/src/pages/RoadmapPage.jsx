import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Route, CheckCircle2, Circle, ChevronRight, Lock,
  Layers, GitBranch, Search, Box, Binary, Link as LinkIcon,
  TreePine, Waypoints, BarChart3, Repeat, Network, Sparkles, Coins, Calculator, Cpu
} from "lucide-react";

const topicIcons = {
  "arrays": Layers,
  "two-pointers": GitBranch,
  "sliding-window": Box,
  "stack": Layers,
  "binary-search": Search,
  "linked-list": LinkIcon,
  "trees": TreePine,
  "tries": TreePine,
  "heap": BarChart3,
  "backtracking": Repeat,
  "graphs": Network,
  "dp": Sparkles,
  "greedy": Coins,
  "math": Calculator,
  "bit-manipulation": Cpu
};

export default function RoadmapPage() {
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTopic, setExpandedTopic] = useState(null);

  useEffect(() => {
    loadRoadmap();
  }, []);

  const loadRoadmap = async () => {
    try {
      const res = await api.get("/api/roadmap");
      setRoadmap(res.data);
    } catch (error) {
      toast.error("Failed to load roadmap");
    } finally {
      setLoading(false);
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Route className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Learning Path</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Topic Roadmap</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Master data structures and algorithms systematically with our curated roadmap
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="bg-[#0a0a0b] border-zinc-800 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Overall Progress</h3>
              <span className="text-primary font-mono">
                {roadmap.reduce((acc, t) => acc + t.solved_count, 0)} / {roadmap.reduce((acc, t) => acc + t.problem_count, 0)} problems
              </span>
            </div>
            <Progress 
              value={(roadmap.reduce((acc, t) => acc + t.solved_count, 0) / Math.max(roadmap.reduce((acc, t) => acc + t.problem_count, 0), 1)) * 100} 
              className="h-3"
            />
          </CardContent>
        </Card>

        {/* Roadmap Topics */}
        <div className="space-y-4" data-testid="roadmap-list">
          {roadmap.map((topic, index) => {
            const Icon = topicIcons[topic.id] || Layers;
            const isExpanded = expandedTopic === topic.id;
            const isCompleted = topic.solved_count === topic.problem_count && topic.problem_count > 0;
            const isUnlocked = index === 0 || roadmap[index - 1]?.progress >= 50;

            return (
              <Card 
                key={topic.id}
                className={`bg-[#0a0a0b] border-zinc-800 overflow-hidden transition-all ${
                  isExpanded ? 'ring-1 ring-primary' : ''
                } ${!isUnlocked ? 'opacity-60' : ''}`}
              >
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => isUnlocked && setExpandedTopic(isExpanded ? null : topic.id)}
                  data-testid={`topic-${topic.id}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Order number */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      isCompleted 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : topic.order}
                    </div>

                    {/* Icon */}
                    <div className={`p-3 rounded-xl ${
                      isCompleted ? 'bg-primary/10' : 'bg-zinc-800'
                    }`}>
                      <Icon className={`w-5 h-5 ${isCompleted ? 'text-primary' : 'text-zinc-400'}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">{topic.name}</h3>
                        {!isUnlocked && <Lock className="w-4 h-4 text-zinc-500" />}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {topic.problem_count} problems
                        </span>
                        <span className="text-sm text-primary">
                          {topic.solved_count} solved
                        </span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="w-32 hidden sm:block">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-white font-medium">{topic.progress}%</span>
                      </div>
                      <Progress value={topic.progress} className="h-2" />
                    </div>

                    {/* Chevron */}
                    {isUnlocked && (
                      <ChevronRight className={`w-5 h-5 text-zinc-400 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`} />
                    )}
                  </div>
                </div>

                {/* Expanded Problems */}
                {isExpanded && topic.problems && (
                  <div className="border-t border-zinc-800 p-4 bg-[#080808]">
                    <div className="space-y-2">
                      {topic.problems.map((problem) => (
                        <Link
                          key={problem.id}
                          to={`/problems/${problem.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors"
                        >
                          {user?.solved_problems?.includes(problem.id) ? (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-600" />
                          )}
                          <span className="text-white flex-1">{problem.title}</span>
                          <span className={`text-sm ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
