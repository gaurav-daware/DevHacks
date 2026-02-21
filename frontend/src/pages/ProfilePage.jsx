import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Code2, Trophy, Calendar, Clock, ChevronRight, Loader2, Shield } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "sonner";

const VERDICT_COLORS = {
  "Accepted": "text-green-400",
  "Wrong Answer": "text-red-400",
  "Time Limit Exceeded": "text-yellow-400",
  "Runtime Error": "text-orange-400",
};

const DIFFICULTY_COLORS = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400"
};

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/users/profile");
      setProfile(res.data);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return null;

  const acceptRate = profile.recent_submissions.length > 0
    ? Math.round((profile.recent_submissions.filter(s => s.verdict === "Accepted").length / profile.recent_submissions.length) * 100)
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile header */}
      <div className="bg-[#121215] border border-[#27272a] rounded-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-2xl font-bold font-heading">
              {profile.username[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-heading font-bold">{profile.username}</h1>
              {profile.role === "admin" && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-400/10 border border-yellow-400/30 rounded-sm">
                  <Shield className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400 text-xs font-mono">ADMIN</span>
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
            {profile.created_at && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Joined {formatDistanceToNow(parseISO(profile.created_at), { addSuffix: true })}
              </p>
            )}
          </div>
          {profile.role === "admin" && (
            <Button
              onClick={() => navigate("/admin")}
              variant="outline"
              size="sm"
              className="border-[#27272a] hover:bg-white/5 gap-2"
            >
              <Shield className="w-3.5 h-3.5 text-yellow-400" />
              Admin Panel
            </Button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Problems Solved", value: profile.solved_count, icon: CheckCircle2, color: "text-primary" },
          { label: "Submissions", value: profile.recent_submissions.length, icon: Code2, color: "text-blue-400" },
          { label: "Accept Rate", value: `${acceptRate}%`, icon: Trophy, color: "text-yellow-400" },
          { label: "Contests", value: profile.contest_history?.length || 0, icon: Trophy, color: "text-purple-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#121215] border border-[#27272a] rounded-sm p-4 text-center">
            <Icon className={`w-4 h-4 mx-auto mb-2 ${color}`} />
            <div className={`text-2xl font-bold font-heading ${color}`}>{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent submissions */}
        <div>
          <h2 className="text-lg font-heading font-semibold mb-3">Recent Submissions</h2>
          <div className="bg-[#121215] border border-[#27272a] rounded-sm overflow-hidden">
            {profile.recent_submissions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No submissions yet. Start solving!
              </div>
            ) : (
              profile.recent_submissions.map((sub, i) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e22] last:border-0 hover:bg-white/[0.02] cursor-pointer"
                  onClick={() => navigate(`/problems/${sub.problem_id}`)}
                  data-testid={`submission-row-${i}`}
                >
                  <div className={`text-xs font-medium w-28 flex-shrink-0 ${VERDICT_COLORS[sub.verdict] || "text-muted-foreground"}`}>
                    {sub.verdict}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-muted-foreground truncate">
                      {sub.language}
                    </div>
                    {sub.created_at && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(parseISO(sub.created_at), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Solved problems */}
        <div>
          <h2 className="text-lg font-heading font-semibold mb-3">
            Solved Problems
            <span className="ml-2 text-sm text-muted-foreground font-normal">
              ({profile.solved_problems.length})
            </span>
          </h2>
          <div className="bg-[#121215] border border-[#27272a] rounded-sm overflow-hidden">
            {profile.solved_problems.length === 0 ? (
              <div className="py-8 text-center">
                <Code2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No problems solved yet.</p>
                <Button
                  onClick={() => navigate("/problems")}
                  size="sm"
                  className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Start Solving
                </Button>
              </div>
            ) : (
              profile.solved_problems.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e22] last:border-0 hover:bg-white/[0.02] cursor-pointer"
                  onClick={() => navigate(`/problems/${p.id}`)}
                  data-testid={`solved-problem-${i}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm">{p.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs capitalize ${DIFFICULTY_COLORS[p.difficulty]}`}>
                      {p.difficulty}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
