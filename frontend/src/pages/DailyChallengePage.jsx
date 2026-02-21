import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Trophy, Flame, CheckCircle2, ArrowRight, Zap } from "lucide-react";

export default function DailyChallengePage() {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [challengeRes] = await Promise.all([
        api.get("/daily-challenge"),
      ]);
      setChallenge(challengeRes.data);
      if (user) {
        setStreak({
          current_streak: user.current_streak || 0,
          total_submissions: user.total_submissions || 0,
          activity: user.activity || {}
        });
      }
    } catch (error) {
      toast.error("Failed to load daily challenge");
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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Daily Challenge</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Solve today's challenge to maintain your streak and improve your skills
          </p>
        </div>

        {/* Streak Stats */}
        {streak && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orange-500/20">
                  <Flame className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold text-white">{streak.current_streak} days</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Submissions</p>
                  <p className="text-2xl font-bold text-white">{streak.total_submissions}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/20">
                  <Trophy className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Days</p>
                  <p className="text-2xl font-bold text-white">{Object.keys(streak.activity || {}).length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Daily Challenge Card */}
        {challenge?.problem && (
          <Card className="bg-[#0a0a0b] border-zinc-800 overflow-hidden" data-testid="daily-challenge-card">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-primary" />
            <CardHeader className="border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl text-white">{challenge.problem.title}</CardTitle>
                  <Badge className={getDifficultyColor(challenge.problem.difficulty)}>
                    {challenge.problem.difficulty}
                  </Badge>
                </div>
                {challenge.problem.is_solved && (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Completed!</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-6 line-clamp-3">
                {challenge.problem.description?.split('\n')[0]}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {challenge.problem.tags?.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-sm">
                    {tag}
                  </span>
                ))}
              </div>

              <Link to={`/problems/${challenge.problem.id}`}>
                <Button className="w-full group" data-testid="solve-daily-btn">
                  {challenge.problem.is_solved ? "Problem Solved! Come back tomorrow" : "Solve Challenge"}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Activity Heatmap Preview */}
        {streak?.activity && Object.keys(streak.activity).length > 0 && (
          <Card className="bg-[#0a0a0b] border-zinc-800 mt-8">
            <CardHeader>
              <CardTitle className="text-lg text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {(() => {
                  const days = [];
                  const today = new Date();
                  for (let i = 29; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    const count = streak.activity[dateStr] || 0;

                    let intensity = "bg-zinc-800";
                    if (count > 0) intensity = "bg-primary/30";
                    if (count >= 3) intensity = "bg-primary/60";
                    if (count >= 5) intensity = "bg-primary";

                    days.push(
                      <div
                        key={dateStr}
                        className={`w-4 h-4 rounded-sm ${intensity}`}
                        title={`${dateStr}: ${count} submissions`}
                      />
                    );
                  }
                  return days;
                })()}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Last 30 days</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
