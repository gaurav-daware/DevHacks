import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import { Swords, Copy, Trophy, Clock, Play, Loader2, CheckCircle2, XCircle, AlertCircle, ArrowLeft, FlaskConical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function BattleModePage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const wsRef = useRef(null);

  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [difficulty, setDifficulty] = useState("any");
  const [myBattles, setMyBattles] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Editor state
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  // Bottom panel tab: "testcases" or "result"
  const [activeTab, setActiveTab] = useState("testcases");

  useEffect(() => {
    if (battleId) {
      loadBattle();
      connectWebSocket();

      const pollInterval = setInterval(() => {
        if (battle?.status === 'active') {
          loadBattle();
        }
      }, 3000);

      return () => {
        clearInterval(pollInterval);
        if (wsRef.current) wsRef.current.close();
      };
    } else {
      loadMyBattles();
      setLoading(false);
    }
  }, [battleId]);

  // Timer countdown
  useEffect(() => {
    if (!battle || battle.status !== 'active' || !battle.started_at) return;

    const interval = setInterval(() => {
      const startTime = new Date(battle.started_at);
      const now = new Date();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, (battle.duration || 600) - elapsed);
      setTimeRemaining(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        toast.info("Time's up!");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [battle]);

  // Auto-redirect loser
  useEffect(() => {
    if (battle?.status === 'finished' && battle.winner_id && battle.winner_id !== user?.id && battle.winner_id !== 'tie') {
      const timer = setTimeout(() => {
        toast.info("Redirecting to battle lobby...");
        navigate('/battle');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [battle?.status, battle?.winner_id, user?.id, navigate]);

  const connectWebSocket = () => {
    if (!battleId) return;
    try {
      const wsUrl = `${process.env.REACT_APP_BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://')}/api/ws/battle/${battleId}`;
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'battle_update') {
          loadBattle();
          if (data.data?.battle?.status === 'finished' && data.data?.battle?.winner_id) {
            const winnerId = data.data.battle.winner_id;
            if (winnerId !== user?.id && winnerId !== 'tie') {
              toast.error("Your opponent won the battle!");
            }
          }
        }
      };
      wsRef.current.onerror = () => { };
      wsRef.current.onclose = () => { };
    } catch { }
  };

  const loadBattle = async () => {
    try {
      const res = await api.get(`/battles/${battleId}`);
      setBattle(res.data);
      if (!code) setCode(getCodeTemplate(language, res.data.problem));
    } catch {
      toast.error("Failed to load battle");
      navigate("/battle");
    } finally {
      setLoading(false);
    }
  };

  const loadMyBattles = async () => {
    try {
      const res = await api.get("/battles/active/list");
      setMyBattles(res.data);
    } catch { }
  };

  const createBattle = async () => {
    if (!user) { toast.error("Please sign in to create a battle"); navigate("/auth"); return; }
    setCreating(true);
    try {
      const res = await api.post("/battles/create", { difficulty: difficulty === "any" ? null : difficulty });
      toast.success("Battle created! Share the code with your opponent.");
      navigate(`/battle/${res.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create battle");
    } finally { setCreating(false); }
  };

  const joinBattle = async () => {
    if (!joinCode.trim()) { toast.error("Enter a battle code"); return; }
    setJoining(true);
    try {
      const res = await api.post("/battles/join", { battle_id: joinCode.trim() });
      toast.success("Joined battle!");
      navigate(`/battle/${res.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to join battle");
    } finally { setJoining(false); }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ─── RUN (sample test cases only) ───
  const runCode = async () => {
    if (!code.trim()) { toast.error("Write some code first"); return; }
    setRunning(true);
    setRunResult(null);
    setActiveTab("testcases");

    try {
      const res = await api.post(`/battles/${battleId}/run`, { language, code });
      setRunResult(res.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Run failed");
    } finally { setRunning(false); }
  };

  // ─── SUBMIT (all test cases) ───
  const submitSolution = async () => {
    if (!code.trim()) { toast.error("Write some code first"); return; }
    if (!battle?.problem_id) { toast.error("Battle not loaded yet"); return; }
    setSubmitting(true);
    setResult(null);
    setActiveTab("result");

    const timeoutId = setTimeout(() => { setSubmitting(false); toast.error("Submission timed out."); }, 30000);

    try {
      const res = await api.post(`/battles/${battleId}/submit`, { language, code, problem_id: battle.problem_id });
      clearTimeout(timeoutId);
      setResult(res.data.submission);
      setBattle(res.data.battle);
      if (res.data.submission.verdict === "Accepted") {
        toast.success("🎉 You solved it!");
        if (res.data.battle.winner_id === user?.id) setTimeout(() => setShowVictoryModal(true), 500);
      } else {
        toast.error(`${res.data.submission.verdict}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      toast.error(error.response?.data?.detail || "Submission failed");
      setResult(null);
    } finally { setSubmitting(false); }
  };

  const copyJoinCode = () => {
    navigator.clipboard.writeText(battle.join_code);
    toast.success("Join code copied!");
  };

  const getCodeTemplate = (lang, problem) => {
    const templates = {
      python: `# ${problem?.title || 'Solution'}\n\n# Read input and solve the problem\n\n`,
      cpp: `// ${problem?.title || 'Solution'}\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}\n`,
      javascript: `// ${problem?.title || 'Solution'}\n\n// Read input and solve\nconst readline = require('readline');\n`
    };
    return templates[lang] || templates.python;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  BATTLE LOBBY
  // ═══════════════════════════════════════════
  if (!battleId) {
    return (
      <div className="min-h-screen bg-[#050505] px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
              <Swords className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">Battle Mode</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">1v1 Code Battle</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Challenge a friend to a real-time coding duel. First to solve wins!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-[#0a0a0b] border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Swords className="w-5 h-5 text-primary" />
                  Create Battle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Difficulty (optional)</label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700"><SelectValue placeholder="Any difficulty" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={createBattle} disabled={creating} data-testid="create-battle-btn">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Battle
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#0a0a0b] border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Copy className="w-5 h-5 text-primary" />
                  Join with Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Battle Code</label>
                  <Input
                    placeholder="Enter 6-character code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="bg-zinc-900 border-zinc-700 uppercase"
                    maxLength={6}
                  />
                </div>
                <Button className="w-full" onClick={joinBattle} disabled={joining} data-testid="join-battle-btn">
                  {joining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Join Battle
                </Button>
              </CardContent>
            </Card>
          </div>

          {myBattles.length > 0 && (
            <Card className="bg-[#0a0a0b] border-zinc-800">
              <CardHeader><CardTitle className="text-lg text-white">Your Battles</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myBattles.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => navigate(`/battle/${b.id}`)}>
                      <div className="flex items-center gap-4">
                        <Badge className={b.status === 'active' ? 'bg-green-500/20 text-green-400' : b.status === 'waiting' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-500/20 text-zinc-400'}>{b.status}</Badge>
                        <span className="text-white">vs {b.player2_username || 'Waiting...'}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground font-mono">{b.join_code}</span>
                        {b.winner_id === user?.id && <Trophy className="w-5 h-5 text-yellow-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  BATTLE ARENA
  // ═══════════════════════════════════════════
  const sampleCases = battle?.sample_test_cases || [];

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Battle Header */}
      <div className="border-b border-zinc-800 bg-[#0a0a0b]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button variant="ghost" size="sm" onClick={() => navigate('/battle')} className="text-muted-foreground hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />Back
              </Button>
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-red-400" />
                <span className="font-semibold text-white">Battle Mode</span>
              </div>
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${battle?.player1_solved ? 'bg-primary/20' : 'bg-zinc-800'}`}>
                  <span className="text-white font-medium">{battle?.player1_username || 'Player 1'}</span>
                  {battle?.player1_solved && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <span className="text-zinc-500">vs</span>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${battle?.player2_solved ? 'bg-primary/20' : 'bg-zinc-800'}`}>
                  <span className="text-white font-medium">{battle?.player2_username || 'Waiting...'}</span>
                  {battle?.player2_solved && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {battle?.status === 'active' && timeRemaining !== null && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-lg ${timeRemaining < 60 ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-white'}`}>
                  <Clock className="w-5 h-5" />{formatTime(timeRemaining)}
                </div>
              )}
              <Badge className={
                battle?.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  battle?.status === 'waiting' ? 'bg-amber-500/20 text-amber-400' :
                    battle?.status === 'finished' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-zinc-500/20 text-zinc-400'
              }>{battle?.status?.toUpperCase() || 'LOADING'}</Badge>
              {battle?.status === 'waiting' && (
                <Button variant="outline" size="sm" onClick={copyJoinCode}><Copy className="w-4 h-4 mr-2" />{battle.join_code}</Button>
              )}
              {battle?.winner_id && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <Trophy className="w-5 h-5" />
                  <span className="font-medium">{battle.winner_id === user?.id ? 'You Win!' : 'Opponent Wins'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Battle Content */}
      <div className="flex h-[calc(100vh-130px)] relative">
        {/* Battle Over Overlay */}
        {battle?.status === 'finished' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-[#0a0a0b] border-2 border-yellow-400/50 rounded-lg p-8 max-w-md text-center shadow-2xl">
              <div className="text-6xl mb-4">{battle.winner_id === user?.id ? '🏆' : battle.winner_id === 'tie' ? '🤝' : '😔'}</div>
              <h2 className="text-3xl font-bold text-white mb-2">Battle Over!</h2>
              <p className={`text-xl mb-6 ${battle.winner_id === user?.id ? 'text-yellow-400' : battle.winner_id === 'tie' ? 'text-blue-400' : 'text-red-400'}`}>
                {battle.winner_id === user?.id ? 'You Won!' : battle.winner_id === 'tie' ? "It's a Tie!" : 'You Lost!'}
              </p>
              <div className="bg-zinc-900 rounded-lg p-4 mb-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Winner:</span>
                  <span className="text-white font-medium">
                    {battle.winner_id === user?.id ? 'You' : battle.winner_id === 'tie' ? 'Tie' : battle.player1_id === user?.id ? battle.player2_username : battle.player1_username}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Your Score:</span>
                  <span className="text-emerald-400 font-mono">{(battle.player1_id === user?.id ? battle.player1_score : battle.player2_score)?.toFixed(1) || '0.0'}/100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Opponent Score:</span>
                  <span className="text-blue-400 font-mono">{(battle.player1_id === user?.id ? battle.player2_score : battle.player1_score)?.toFixed(1) || '0.0'}/100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Your Time:</span>
                  <span className="text-white font-mono">
                    {battle.player1_id === user?.id
                      ? (battle.player1_time ? `${battle.player1_time.toFixed(1)}s` : 'N/A')
                      : (battle.player2_time ? `${battle.player2_time.toFixed(1)}s` : 'N/A')}
                  </span>
                </div>
              </div>
              {battle.winner_id !== user?.id && battle.winner_id !== 'tie' && (
                <p className="text-sm text-muted-foreground mb-4">Redirecting to lobby in 5 seconds...</p>
              )}
              <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => navigate('/battle')}>Back to Battle Lobby</Button>
            </div>
          </div>
        )}

        {/* Problem Description */}
        <div className="w-1/3 border-r border-zinc-800 overflow-y-auto p-6">
          {battle?.problem ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-white">{battle.problem.title}</h2>
                <Badge className={
                  battle.problem.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' :
                    battle.problem.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                }>{battle.problem.difficulty}</Badge>
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-zinc-300 whitespace-pre-wrap">{battle.problem.description}</div>
              </div>
              {battle.problem.sample_input && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Sample Input</h4>
                  <pre className="p-3 bg-zinc-900 rounded-lg text-sm text-zinc-300 overflow-x-auto">{battle.problem.sample_input}</pre>
                </div>
              )}
              {battle.problem.sample_output && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Sample Output</h4>
                  <pre className="p-3 bg-zinc-900 rounded-lg text-sm text-zinc-300 overflow-x-auto">{battle.problem.sample_output}</pre>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Code Editor + Bottom Panel */}
        <div className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#0a0a0b]">
            <Select value={language} onValueChange={(v) => { setLanguage(v); setCode(getCodeTemplate(v, battle?.problem)); }}>
              <SelectTrigger className="w-40 bg-zinc-900 border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              {/* Run Button */}
              <Button
                variant="outline"
                onClick={runCode}
                disabled={running || battle?.status !== 'active'}
                data-testid="battle-run-btn"
              >
                {running ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Running...</>
                ) : (
                  <><FlaskConical className="w-4 h-4 mr-2" />Run</>
                )}
              </Button>

              {/* Submit Button */}
              <Button
                onClick={submitSolution}
                disabled={submitting || battle?.status !== 'active'}
                data-testid="battle-submit-btn"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" />{battle?.status === 'finished' ? 'Battle Ended' : 'Submit'}</>
                )}
              </Button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              value={code}
              onChange={(v) => setCode(v || "")}
              theme="vs-dark"
              options={{ fontSize: 14, minimap: { enabled: false }, padding: { top: 16 }, scrollBeyondLastLine: false }}
            />
          </div>

          {/* ─── Bottom Panel: Test Cases / Result ─── */}
          <div className="border-t border-zinc-800 bg-[#0a0a0b] max-h-[280px] flex flex-col">
            {/* Tabs */}
            <div className="flex items-center border-b border-zinc-800 px-4">
              <button
                onClick={() => setActiveTab("testcases")}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "testcases"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-white"
                  }`}
              >
                <span className="flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" />
                  Test Cases
                  {sampleCases.length > 0 && (
                    <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{sampleCases.length}</span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("result")}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "result"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-white"
                  }`}
              >
                <span className="flex items-center gap-1.5">
                  {result?.verdict === "Accepted" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5" />}
                  Result
                </span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* ─── TEST CASES TAB ─── */}
              {activeTab === "testcases" && (
                <div className="space-y-3">
                  {sampleCases.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No sample test cases available for this problem.</p>
                  ) : (
                    sampleCases.map((tc, idx) => {
                      // Match run result per test case
                      const runTc = runResult?.test_results?.[idx];
                      return (
                        <div key={idx} className="rounded-lg border border-zinc-800 overflow-hidden">
                          {/* Case header */}
                          <div className={`flex items-center justify-between px-3 py-2 text-xs font-medium ${runTc
                              ? runTc.passed
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400'
                              : 'bg-zinc-900 text-zinc-400'
                            }`}>
                            <span className="flex items-center gap-1.5">
                              {runTc ? (
                                runTc.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />
                              ) : null}
                              Case {idx + 1}
                            </span>
                            {runTc && (
                              <span>{runTc.passed ? 'Passed' : runTc.verdict || 'Failed'}</span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-px bg-zinc-800">
                            {/* Input */}
                            <div className="bg-[#0a0a0b] p-3">
                              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Input</div>
                              <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">{tc.input}</pre>
                            </div>
                            {/* Expected Output */}
                            <div className="bg-[#0a0a0b] p-3">
                              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Expected Output</div>
                              <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">{tc.output}</pre>
                            </div>
                          </div>

                          {/* Actual output (only shown after run) */}
                          {runTc && runTc.actual_output !== undefined && (
                            <div className="bg-[#0a0a0b] border-t border-zinc-800 p-3">
                              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Your Output</div>
                              <pre className={`text-xs font-mono whitespace-pre-wrap ${runTc.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                                {runTc.actual_output || "(empty)"}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Run verdict summary */}
                  {runResult && (
                    <div className={`flex items-center gap-2 mt-2 text-sm font-medium ${runResult.verdict === 'Accepted' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                      {runResult.verdict === 'Accepted' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {runResult.verdict} &middot; {runResult.execution_time}s
                    </div>
                  )}
                </div>
              )}

              {/* ─── RESULT TAB ─── */}
              {activeTab === "result" && (
                <div>
                  {submitting ? (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Running against all test cases...</span>
                    </div>
                  ) : result ? (
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        {result.verdict === 'Accepted' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className={`font-medium text-lg ${result.verdict === 'Accepted' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {result.verdict}
                        </span>
                        <span className="text-muted-foreground text-sm">Runtime: {result.execution_time}s</span>
                        {result.verdict === 'Accepted' && result.score && (
                          <span className="text-emerald-400 ml-auto text-sm">Score: {result.score.toFixed(1)}/100</span>
                        )}
                      </div>
                      {result.verdict !== 'Accepted' && result.test_results && (
                        <div className="space-y-2">
                          {result.test_results.slice(0, 3).map((tc, i) => (
                            <div key={i} className="text-xs">
                              {!tc.passed && (
                                <div className="flex items-start gap-2 text-red-400">
                                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <div>Test {i + 1}: {tc.verdict}</div>
                                    {tc.note && <div className="text-muted-foreground">{tc.note}</div>}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No submission yet. Click <strong>Submit</strong> to run against all test cases.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Victory Modal */}
      <Dialog open={showVictoryModal} onOpenChange={setShowVictoryModal}>
        <DialogContent className="bg-[#121215] border-[#27272a] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-yellow-400 flex items-center justify-center gap-2">
              <Trophy className="w-8 h-8" />Victory!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-xl text-white mb-2">You Won the Battle!</p>
            <p className="text-muted-foreground mb-4">You solved the problem first and claimed victory!</p>
            {result && (
              <div className="bg-zinc-900 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Your Score:</span><span className="text-emerald-400 font-mono">{result.score?.toFixed(1)}/100</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Time Taken:</span><span className="text-white font-mono">{result.time_taken?.toFixed(1)}s</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Execution Time:</span><span className="text-white font-mono">{result.execution_time}s</span></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => { setShowVictoryModal(false); navigate('/battle'); }}>Back to Battle Lobby</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
