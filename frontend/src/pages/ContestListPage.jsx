import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Trophy, Users, Clock, ChevronRight, Hash,
  Loader2, CheckCircle2, Lock
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, parseISO } from "date-fns";

function ContestStatusBadge({ status, endTime }) {
  if (status === "active") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-green-400 font-mono">LIVE</span>
      </div>
    );
  }
  if (status === "ended") {
    return <span className="text-xs text-muted-foreground font-mono">ENDED</span>;
  }
  return <span className="text-xs text-blue-400 font-mono uppercase">{status}</span>;
}

export default function ContestListPage() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const res = await api.get("/contests");
      setContests(res.data);
    } catch (e) {
      toast.error("Failed to load contests");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to join a contest");
      navigate("/auth");
      return;
    }
    if (!joinCode.trim()) {
      toast.error("Enter a join code");
      return;
    }
    setJoining(true);
    try {
      const res = await api.post("/contests/join", { join_code: joinCode.trim() });
      toast.success("Joined contest successfully!");
      setJoinDialogOpen(false);
      setJoinCode("");
      navigate(`/contests/${res.data.contest_id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid join code");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-1">Contests</h1>
          <p className="text-muted-foreground text-sm">{contests.length} contests available</p>
        </div>

        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              data-testid="join-contest-btn"
            >
              <Hash className="w-4 h-4" />
              Join with Code
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#121215] border-[#27272a] max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-heading">Join Contest</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleJoin} className="space-y-4" data-testid="join-contest-form">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-sm">Contest Code</Label>
                <Input
                  placeholder="e.g. ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="bg-[#09090b] border-[#27272a] font-mono text-lg tracking-widest text-center h-12"
                  maxLength={6}
                  data-testid="join-code-input"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-center">
                  6-character alphanumeric code
                </p>
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={joining}
                data-testid="join-code-submit"
              >
                {joining ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Joining...</>
                ) : (
                  "Join Contest"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contest list */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading contests...
        </div>
      ) : contests.length === 0 ? (
        <div className="text-center py-16 bg-[#121215] border border-[#27272a] rounded-sm">
          <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-heading font-semibold mb-1">No contests yet</h3>
          <p className="text-muted-foreground text-sm">
            {user?.role === "admin"
              ? "Go to Admin Dashboard to create a contest."
              : "Check back later or ask an admin to create one."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contests.map((contest) => (
            <div
              key={contest.id}
              className="bg-[#121215] border border-[#27272a] rounded-sm p-5 card-hover cursor-pointer"
              onClick={() => navigate(`/contests/${contest.id}`)}
              data-testid={`contest-card-${contest.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="font-heading font-semibold text-base truncate">{contest.title}</h3>
                    <ContestStatusBadge status={contest.status} endTime={contest.end_time} />
                  </div>
                  {contest.description && (
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-1">
                      {contest.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {contest.duration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />
                      {contest.problem_count} problems
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {contest.participant_count} participants
                    </span>
                    {contest.created_at && (
                      <span className="hidden sm:block">
                        {formatDistanceToNow(parseISO(contest.created_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    {contest.join_code}
                  </div>
                  {contest.is_joined && (
                    <div className="flex items-center gap-1 text-xs text-primary">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Joined
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 bg-[#121215] border border-[#27272a] rounded-sm p-4 flex items-start gap-3">
        <Hash className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium mb-0.5">Have a join code?</p>
          <p className="text-xs text-muted-foreground">
            Click "Join with Code" and enter your 6-character code to join a private or public contest instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
