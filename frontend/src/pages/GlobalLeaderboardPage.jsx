import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trophy, Medal, Target, TrendingUp, Crown, User } from "lucide-react";

export default function GlobalLeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const res = await api.get("/leaderboard/global?limit=100");
      setLeaderboard(res.data);
    } catch (error) {
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-zinc-300" />;
      case 3: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return null;
    }
  };

  const getRankBg = (rank) => {
    switch (rank) {
      case 1: return "bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/30";
      case 2: return "bg-gradient-to-r from-zinc-400/20 to-transparent border-zinc-400/30";
      case 3: return "bg-gradient-to-r from-amber-600/20 to-transparent border-amber-600/30";
      default: return "bg-[#0a0a0b] border-zinc-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Find current user's rank
  const currentUserEntry = leaderboard.find(e => e.is_current_user);

  return (
    <div className="min-h-screen bg-[#050505] px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Rankings</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Global Leaderboard</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Top performers across all challenges and competitions
          </p>
        </div>

        {/* Current User Rank Card */}
        {currentUserEntry && (
          <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/30 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Ranking</p>
                    <p className="text-2xl font-bold text-white">#{currentUserEntry.rank}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-2xl font-bold text-primary">{currentUserEntry.score}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 0, 2].map((index) => {
            const entry = leaderboard[index];
            if (!entry) return null;

            return (
              <Card
                key={entry.user_id}
                className={`${getRankBg(entry.rank)} ${entry.rank === 1 ? 'transform -translate-y-4' : ''}`}
              >
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    {getRankIcon(entry.rank)}
                  </div>
                  <p className="text-xl font-bold text-white mb-1">{entry.username}</p>
                  <p className="text-3xl font-bold text-primary mb-2">{entry.score}</p>
                  <div className="flex justify-center gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Solved</p>
                      <p className="text-white font-medium">{entry.solved_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Accuracy</p>
                      <p className="text-white font-medium">{entry.accuracy}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Full Leaderboard */}
        <Card className="bg-[#0a0a0b] border-zinc-800" data-testid="leaderboard-table">
          <CardHeader className="border-b border-zinc-800">
            <CardTitle className="text-lg text-white">All Rankings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-zinc-900/50">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="p-4 font-medium">Rank</th>
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium text-center">Solved</th>
                  <th className="p-4 font-medium text-center">Avg Time</th>
                  <th className="p-4 font-medium text-center">Accuracy</th>
                  <th className="p-4 font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {leaderboard.map((entry) => (
                  <tr
                    key={entry.user_id}
                    className={`hover:bg-zinc-800/30 transition-colors ${entry.is_current_user ? 'bg-primary/5' : ''
                      }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getRankIcon(entry.rank) || (
                          <span className="text-zinc-400 font-mono w-6 text-center">{entry.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {entry.username[0].toUpperCase()}
                          </span>
                        </div>
                        <span className={`font-medium ${entry.is_current_user ? 'text-primary' : 'text-white'}`}>
                          {entry.username}
                          {entry.is_current_user && <Badge className="ml-2 bg-primary/20 text-primary text-xs">You</Badge>}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-white font-medium">{entry.solved_count}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-muted-foreground">{entry.avg_time}s</span>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="outline" className={
                        entry.accuracy >= 70 ? 'border-emerald-500/30 text-emerald-400' :
                          entry.accuracy >= 40 ? 'border-amber-500/30 text-amber-400' :
                            'border-red-500/30 text-red-400'
                      }>
                        {entry.accuracy}%
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-primary font-bold">{entry.score}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
