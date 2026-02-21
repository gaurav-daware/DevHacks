import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import api, { getWsUrl } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Play, Trophy, Users, Clock, CheckCircle2, XCircle,
  Wifi, WifiOff, Loader2, ArrowLeft, Crown
} from "lucide-react";
import { toast } from "sonner";

const DIFFICULTY_COLORS = {
  easy: "text-green-400", medium: "text-yellow-400", hard: "text-red-400"
};

const VERDICT_STYLES = {
  "Accepted": "text-green-400",
  "Wrong Answer": "text-red-400",
  "Time Limit Exceeded": "text-yellow-400",
  "Runtime Error": "text-orange-400",
};

const DEFAULT_CODE = {
  python: `import sys\ninput = sys.stdin.readline\n\n# Read input from stdin\n# Print output to stdout\n`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your solution\n    return 0;\n}`,
  javascript: `// Simulated execution\nconst lines = require('fs').readFileSync('/dev/stdin','utf8').split('\\n');\n`
};

function useContestTimer(endTime) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!endTime) return;

    const update = () => {
      const remaining = Math.max(0, new Date(endTime) - new Date());
      setTimeLeft(remaining);
      if (remaining <= 0) setExpired(true);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const hours = Math.floor(timeLeft / 3600000);
  const mins = Math.floor((timeLeft % 3600000) / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);

  return { hours, mins, secs, expired, timeLeft };
}

export default function ContestArenaPage() {
  const { contestId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeProblem, setActiveProblem] = useState(null);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  const wsRef = useRef(null);
  const keystrokesRef = useRef([]);
  const startTimeRef = useRef(Date.now());

  const { hours, mins, secs, expired } = useContestTimer(contest?.end_time);

  useEffect(() => {
    fetchContest();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [contestId]);

  useEffect(() => {
    if (contestId) connectWs();
  }, [contestId]);

  const fetchContest = async () => {
    try {
      const res = await api.get(`/contests/${contestId}`);
      setContest(res.data);
      if (!res.data.is_joined) {
        toast.error("You need to join this contest first");
        navigate("/contests");
        return;
      }
      if (res.data.problems?.length > 0) {
        setActiveProblem(res.data.problems[0]);
      }
    } catch {
      toast.error("Contest not found");
      navigate("/contests");
    } finally {
      setLoading(false);
    }
  };

  const connectWs = useCallback(() => {
    const wsUrl = getWsUrl(`/contest/${contestId}`);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsConnected(true);
      // Heartbeat
      const hb = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("ping");
      }, 30000);
      ws._hb = hb;
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "leaderboard_update") {
          setLeaderboard(data.data);
        }
      } catch {}
    };

    ws.onclose = () => {
      setWsConnected(false);
      clearInterval(ws._hb);
      // Reconnect after 3 seconds
      setTimeout(connectWs, 3000);
    };

    ws.onerror = () => setWsConnected(false);
    wsRef.current = ws;
  }, [contestId]);

  const handleCodeChange = (val) => {
    setCode(val || "");
    keystrokesRef.current.push({
      timestamp: Date.now() - startTimeRef.current,
      value: val || ""
    });
    if (keystrokesRef.current.length > 300) {
      keystrokesRef.current = keystrokesRef.current.slice(-300);
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
    keystrokesRef.current = [];
    startTimeRef.current = Date.now();
  };

  const handleSubmit = async () => {
    if (!activeProblem) return;
    if (expired) {
      toast.error("Contest has ended");
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await api.post("/submit", {
        language,
        code,
        problem_id: activeProblem.id,
        contest_id: contestId,
        keystrokes: keystrokesRef.current.slice(0, 200)
      });
      setResult(res.data);
      if (res.data.verdict === "Accepted") {
        toast.success(`Accepted! Problem solved!`);
        // Refresh contest to update solved status
        fetchContest();
      } else {
        toast.error(res.data.verdict);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contest) return null;

  const timerColor = expired ? "text-red-400" : secs <= 0 && mins <= 5 ? "text-yellow-400" : "text-primary";

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Contest Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#27272a] bg-[#09090b]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/contests")}
            className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-heading font-semibold text-sm">{contest.title}</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {contest.participants?.length || 0} participants
              </span>
              <span className="flex items-center gap-1">
                {wsConnected ? (
                  <><Wifi className="w-3 h-3 text-green-400" /><span className="text-green-400">Live</span></>
                ) : (
                  <><WifiOff className="w-3 h-3 text-red-400" /><span className="text-red-400">Offline</span></>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className={`font-mono font-bold text-2xl sm:text-3xl ${timerColor} ${expired ? "" : "animate-glow-pulse"}`}
          data-testid="contest-timer">
          {expired ? "ENDED" : `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`}
        </div>

        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-32 h-8 bg-[#121215] border-[#27272a] text-xs" data-testid="contest-language-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#121215] border-[#27272a]">
              <SelectItem value="python">Python 3</SelectItem>
              <SelectItem value="cpp">C++ (Mock)</SelectItem>
              <SelectItem value="javascript">JS (Mock)</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleSubmit}
            disabled={submitting || expired}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 gap-1.5 text-sm"
            data-testid="contest-submit-btn"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Submit
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Problem sidebar */}
        <div className="w-48 sm:w-52 flex-shrink-0 border-r border-[#27272a] flex flex-col">
          <div className="px-3 py-2 border-b border-[#27272a] text-xs text-muted-foreground uppercase tracking-widest">
            Problems
          </div>
          <div className="flex-1 overflow-y-auto">
            {contest.problems?.map((p, i) => (
              <button
                key={p.id}
                onClick={() => {
                  setActiveProblem(p);
                  setResult(null);
                  setCode(DEFAULT_CODE[language]);
                }}
                className={`w-full text-left px-3 py-3 border-b border-[#27272a]/50 hover:bg-white/[0.03] transition-colors ${
                  activeProblem?.id === p.id ? "bg-primary/10 border-l-2 border-l-primary" : ""
                }`}
                data-testid={`problem-tab-${i}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">P{i + 1}</span>
                  {p.solved_in_contest && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  )}
                </div>
                <div className="text-xs font-medium mt-0.5 line-clamp-2">{p.title}</div>
                <div className={`text-xs mt-0.5 capitalize ${DIFFICULTY_COLORS[p.difficulty]}`}>
                  {p.difficulty}
                </div>
              </button>
            ))}
          </div>

          {/* Leaderboard toggle */}
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="flex items-center gap-2 px-3 py-2 border-t border-[#27272a] text-xs text-muted-foreground hover:text-foreground"
            data-testid="toggle-leaderboard"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            Leaderboard
          </button>
        </div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Problem title bar */}
          {activeProblem && (
            <div className="px-4 py-2 border-b border-[#27272a] bg-[#09090b]">
              <span className="font-heading font-semibold text-sm">{activeProblem.title}</span>
              <span className={`ml-2 text-xs capitalize ${DIFFICULTY_COLORS[activeProblem.difficulty]}`}>
                {activeProblem.difficulty}
              </span>
              {activeProblem.sample_input && (
                <div className="mt-2 flex gap-3 text-xs">
                  <div className="bg-[#121215] border border-[#27272a] rounded-sm px-2 py-1">
                    <span className="text-muted-foreground">In: </span>
                    <code className="font-mono">{activeProblem.sample_input}</code>
                  </div>
                  <div className="bg-[#121215] border border-[#27272a] rounded-sm px-2 py-1">
                    <span className="text-muted-foreground">Out: </span>
                    <code className="font-mono">{activeProblem.sample_output}</code>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Monaco editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : language === "javascript" ? "javascript" : "python"}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 12 },
                automaticLayout: true,
                tabSize: 4,
              }}
            />
          </div>

          {/* Result mini panel */}
          {result && (
            <div className="border-t border-[#27272a] px-4 py-3 bg-[#09090b]" data-testid="contest-result">
              <div className="flex items-center gap-2 text-sm">
                {result.verdict === "Accepted" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className={VERDICT_STYLES[result.verdict] || "text-foreground"}>
                  {result.verdict}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {result.execution_time?.toFixed(3)}s
                </span>
                {result.test_results?.map((tc, i) => (
                  <span key={i} className={`w-4 h-4 rounded-full text-xs flex items-center justify-center ${tc.passed ? "bg-green-400/20 text-green-400" : "bg-red-400/20 text-red-400"}`}>
                    {i + 1}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard panel */}
        {showLeaderboard && (
          <div className="w-52 sm:w-60 flex-shrink-0 border-l border-[#27272a] flex flex-col" data-testid="leaderboard-panel">
            <div className="px-3 py-2 border-b border-[#27272a] flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Leaderboard</span>
              {wsConnected && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-auto" />}
            </div>
            <div className="flex-1 overflow-y-auto">
              {leaderboard.length === 0 ? (
                <div className="p-3 text-xs text-muted-foreground text-center">
                  No submissions yet
                </div>
              ) : (
                leaderboard.map((entry, i) => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-2 px-3 py-2.5 border-b border-[#27272a]/50 ${
                      entry.user_id === user?.id ? "bg-primary/5" : ""
                    }`}
                    data-testid={`leaderboard-row-${i}`}
                  >
                    <div className="w-5 text-center">
                      {i === 0 ? (
                        <Crown className="w-3.5 h-3.5 text-yellow-400" />
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-medium truncate ${entry.user_id === user?.id ? "text-primary" : "text-foreground"}`}>
                          {entry.username}
                        </span>
                        {entry.user_id === user?.id && (
                          <span className="text-xs text-primary">(you)</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {entry.solved_count}/{contest.problems?.length || 0} · {entry.penalty}min
                      </div>
                    </div>
                    <div className="text-xs font-bold font-mono text-primary">
                      {entry.solved_count}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
