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
import { Swords, Copy, Users, Trophy, Clock, Play, Loader2, CheckCircle2, XCircle } from "lucide-react";

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
  const [difficulty, setDifficulty] = useState("");
  const [myBattles, setMyBattles] = useState([]);
  
  // Editor state
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (battleId) {
      loadBattle();
      connectWebSocket();
    } else {
      loadMyBattles();
      setLoading(false);
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [battleId]);

  const connectWebSocket = () => {
    if (!battleId) return;
    
    const wsUrl = `${process.env.REACT_APP_BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://')}/api/ws/battle/${battleId}`;
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'battle_update') {
        loadBattle(); // Refresh battle state
      }
    };
  };

  const loadBattle = async () => {
    try {
      const res = await api.get(`/api/battles/${battleId}`);
      setBattle(res.data);
      
      // Set default code template
      if (!code) {
        setCode(getCodeTemplate(language, res.data.problem));
      }
    } catch (error) {
      toast.error("Failed to load battle");
      navigate("/battle");
    } finally {
      setLoading(false);
    }
  };

  const loadMyBattles = async () => {
    try {
      const res = await api.get("/api/battles/active/list");
      setMyBattles(res.data);
    } catch (error) {
      console.error("Failed to load battles:", error);
    }
  };

  const createBattle = async () => {
    setCreating(true);
    try {
      const res = await api.post("/api/battles/create", { difficulty: difficulty || null });
      toast.success("Battle created! Share the code with your opponent.");
      navigate(`/battle/${res.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create battle");
    } finally {
      setCreating(false);
    }
  };

  const joinBattle = async () => {
    if (!joinCode.trim()) {
      toast.error("Enter a battle code");
      return;
    }
    setJoining(true);
    try {
      const res = await api.post("/api/battles/join", { battle_id: joinCode.trim() });
      toast.success("Joined battle!");
      navigate(`/battle/${res.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to join battle");
    } finally {
      setJoining(false);
    }
  };

  const submitSolution = async () => {
    if (!code.trim()) {
      toast.error("Write some code first");
      return;
    }
    setSubmitting(true);
    setResult(null);
    
    try {
      const res = await api.post(`/api/battles/${battleId}/submit`, {
        language,
        code,
        problem_id: battle.problem_id
      });
      
      setResult(res.data.submission);
      setBattle(res.data.battle);
      
      if (res.data.submission.verdict === "Accepted") {
        toast.success("🎉 You solved it!");
      } else {
        toast.error(`Verdict: ${res.data.submission.verdict}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Submission failed");
    } finally {
      setSubmitting(false);
    }
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

  // Battle Lobby (no battleId)
  if (!battleId) {
    return (
      <div className="min-h-screen bg-[#050505] px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
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
            {/* Create Battle */}
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
                    <SelectTrigger className="bg-zinc-900 border-zinc-700">
                      <SelectValue placeholder="Any difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full" 
                  onClick={createBattle} 
                  disabled={creating}
                  data-testid="create-battle-btn"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Battle
                </Button>
              </CardContent>
            </Card>

            {/* Join Battle */}
            <Card className="bg-[#0a0a0b] border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Join Battle
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
                <Button 
                  className="w-full" 
                  onClick={joinBattle} 
                  disabled={joining}
                  data-testid="join-battle-btn"
                >
                  {joining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Join Battle
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* My Battles */}
          {myBattles.length > 0 && (
            <Card className="bg-[#0a0a0b] border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">Your Battles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myBattles.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/battle/${b.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <Badge className={
                          b.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          b.status === 'waiting' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-zinc-500/20 text-zinc-400'
                        }>
                          {b.status}
                        </Badge>
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

  // Battle Arena
  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Battle Header */}
      <div className="border-b border-zinc-800 bg-[#0a0a0b]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-red-400" />
                <span className="font-semibold text-white">Battle Mode</span>
              </div>
              
              {/* Players */}
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  battle.player1_solved ? 'bg-primary/20' : 'bg-zinc-800'
                }`}>
                  <span className="text-white font-medium">{battle.player1_username}</span>
                  {battle.player1_solved && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                
                <span className="text-zinc-500">vs</span>
                
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  battle.player2_solved ? 'bg-primary/20' : 'bg-zinc-800'
                }`}>
                  <span className="text-white font-medium">{battle.player2_username || 'Waiting...'}</span>
                  {battle.player2_solved && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge className={
                battle.status === 'active' ? 'bg-green-500/20 text-green-400' :
                battle.status === 'waiting' ? 'bg-amber-500/20 text-amber-400' :
                'bg-zinc-500/20 text-zinc-400'
              }>
                {battle.status.toUpperCase()}
              </Badge>
              
              {battle.status === 'waiting' && (
                <Button variant="outline" size="sm" onClick={copyJoinCode}>
                  <Copy className="w-4 h-4 mr-2" />
                  {battle.join_code}
                </Button>
              )}
              
              {battle.winner_id && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <Trophy className="w-5 h-5" />
                  <span className="font-medium">
                    {battle.winner_id === user?.id ? 'You Win!' : 'Opponent Wins'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Battle Content */}
      <div className="flex h-[calc(100vh-130px)]">
        {/* Problem Description */}
        <div className="w-1/3 border-r border-zinc-800 overflow-y-auto p-6">
          {battle.problem && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-white">{battle.problem.title}</h2>
                <Badge className={
                  battle.problem.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' :
                  battle.problem.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                }>
                  {battle.problem.difficulty}
                </Badge>
              </div>
              
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-zinc-300 whitespace-pre-wrap">{battle.problem.description}</div>
              </div>
              
              {battle.problem.sample_input && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Sample Input</h4>
                  <pre className="p-3 bg-zinc-900 rounded-lg text-sm text-zinc-300 overflow-x-auto">
                    {battle.problem.sample_input}
                  </pre>
                </div>
              )}
              
              {battle.problem.sample_output && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Sample Output</h4>
                  <pre className="p-3 bg-zinc-900 rounded-lg text-sm text-zinc-300 overflow-x-auto">
                    {battle.problem.sample_output}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#0a0a0b]">
            <Select value={language} onValueChange={(v) => {
              setLanguage(v);
              setCode(getCodeTemplate(v, battle.problem));
            }}>
              <SelectTrigger className="w-40 bg-zinc-900 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={submitSolution} 
              disabled={submitting || battle.status !== 'active'}
              data-testid="battle-submit-btn"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Submit
            </Button>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              value={code}
              onChange={(v) => setCode(v || "")}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                padding: { top: 16 },
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          {/* Result Panel */}
          {result && (
            <div className={`p-4 border-t border-zinc-800 ${
              result.verdict === 'Accepted' ? 'bg-emerald-500/10' : 'bg-red-500/10'
            }`}>
              <div className="flex items-center gap-3">
                {result.verdict === 'Accepted' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={`font-medium ${
                  result.verdict === 'Accepted' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {result.verdict}
                </span>
                <span className="text-muted-foreground">
                  Runtime: {result.execution_time}s
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
