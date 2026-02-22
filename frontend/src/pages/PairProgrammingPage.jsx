import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api, { getWsUrl } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import {
  Users, Copy, Play, Loader2, CheckCircle2, XCircle,
  Send, Hash, MessageSquare, Code2, Zap, ArrowLeft, UserPlus, LogOut
} from "lucide-react";

const DEFAULT_CODE = {
  python: `# Pair Programming Session\nimport sys\ninput = sys.stdin.readline\n\ndef solve():\n    # Read input and solve together!\n    pass\n\nsolve()\n`,
  cpp: `// Pair Programming Session\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // Solve together!\n    \n    return 0;\n}`,
  javascript: `// Pair Programming Session\nprocess.stdin.resume();\nprocess.stdin.setEncoding('utf8');\nlet input = '';\nprocess.stdin.on('data', d => input += d);\nprocess.stdin.on('end', () => {\n    const lines = input.trim().split('\\n');\n    // Solve together!\n    console.log(lines[0]);\n});`
};

export default function PairProgrammingPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const wsRef = useRef(null);
  const chatEndRef = useRef(null);
  const skipNextUpdate = useRef(false);

  // Lobby state
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  // Session state
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(!!roomId);
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [language, setLanguage] = useState("python");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Problem selection
  const [problems, setProblems] = useState([]);
  const [showProblemPicker, setShowProblemPicker] = useState(false);

  // ── Load room data ──────────────────────────
  const loadRoom = useCallback(async (id) => {
    try {
      const res = await api.get(`/pair/room/${id}`);
      setRoom(res.data);
      if (res.data.code) setCode(res.data.code);
      if (res.data.language) setLanguage(res.data.language);
      if (res.data.chat) setChatMessages(res.data.chat);
    } catch {
      toast.error("Room not found");
      navigate("/pair");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ── WebSocket connection ────────────────────
  const connectWs = useCallback((id) => {
    if (wsRef.current) wsRef.current.close();
    const url = getWsUrl(`/pair/${id}`);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "code_update":
          if (data.sender !== user?.id) {
            skipNextUpdate.current = true;
            setCode(data.code);
          }
          break;
        case "language_change":
          if (data.sender !== user?.id) {
            setLanguage(data.language);
          }
          break;
        case "chat_message":
          setChatMessages(prev => [...prev, data.message]);
          break;
        case "user_joined":
          setRoom(prev => prev ? { ...prev, participants: data.participants, status: "active" } : prev);
          toast.success(`${data.username} joined the room!`);
          break;
        case "user_left":
          setRoom(prev => prev ? { ...prev, participants: data.participants } : prev);
          toast.info("Your partner left the room");
          break;
        case "problem_selected":
          setRoom(prev => prev ? { ...prev, problem: data.problem, problem_id: data.problem.id } : prev);
          toast.success(`Problem selected: ${data.problem.title}`);
          break;
        case "submission_result":
          if (data.sender !== user?.id) {
            setResult(data.result);
            if (data.result.verdict === "Accepted") {
              toast.success(`🎉 ${data.username} submitted — Accepted!`);
            } else {
              toast.error(`${data.username} submitted — ${data.result.verdict}`);
            }
          }
          break;
        default:
          break;
      }
    };

    ws.onclose = () => {
      // Could reconnect here
    };
  }, [user]);

  useEffect(() => {
    if (roomId) {
      loadRoom(roomId);
      connectWs(roomId);
    }
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [roomId, loadRoom, connectWs]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ── Room actions ────────────────────────────
  const createRoom = async () => {
    setCreating(true);
    try {
      const res = await api.post("/pair/create");
      toast.success("Room created! Share the code with your partner.");
      navigate(`/pair/${res.data.room_id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!joinCode.trim()) {
      toast.error("Enter a room code");
      return;
    }
    setJoining(true);
    try {
      const res = await api.post("/pair/join", { room_id: joinCode.trim() });
      toast.success("Joined room!");
      navigate(`/pair/${res.data.room_id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to join room");
    } finally {
      setJoining(false);
    }
  };

  // ── Code sync ───────────────────────────────
  const handleCodeChange = (val) => {
    const newCode = val || "";
    setCode(newCode);

    if (skipNextUpdate.current) {
      skipNextUpdate.current = false;
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "code_update",
        code: newCode,
        language,
        sender: user?.id
      }));
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    const newCode = DEFAULT_CODE[lang] || DEFAULT_CODE.python;
    setCode(newCode);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "language_change",
        language: lang,
        code: newCode,
        sender: user?.id
      }));
    }
  };

  // ── Chat ────────────────────────────────────
  const sendChat = () => {
    if (!chatInput.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({
      type: "chat_message",
      user_id: user?.id,
      username: user?.username,
      text: chatInput.trim()
    }));
    setChatInput("");
  };

  // ── Problem picker ──────────────────────────
  const loadProblems = async () => {
    try {
      const res = await api.get("/problems");
      setProblems(res.data.items || res.data || []);
    } catch {
      toast.error("Failed to load problems");
    }
  };

  const selectProblem = (prob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "problem_select",
        problem_id: prob.id
      }));
    }
    setShowProblemPicker(false);
  };

  // ── Submit ──────────────────────────────────
  const handleSubmit = async () => {
    if (!room?.problem_id) {
      toast.error("Select a problem first");
      return;
    }
    if (!code.trim()) {
      toast.error("Write some code first!");
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await api.post("/submit", {
        language,
        code,
        problem_id: room.problem_id
      });
      setResult(res.data);
      if (res.data.verdict === "Accepted") {
        toast.success("🎉 Accepted! Great teamwork!");
      } else {
        toast.error(`Verdict: ${res.data.verdict}`);
      }
      // Broadcast result to partner via WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "submission_result",
          sender: user?.id,
          username: user?.username,
          result: res.data
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const copyRoomCode = () => {
    if (room?.join_code) {
      navigator.clipboard.writeText(room.join_code);
      toast.success("Room code copied!");
    }
  };

  // ── Loading state ───────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-mono">Connecting to room...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  LOBBY VIEW (no roomId)
  // ═══════════════════════════════════════════
  if (!roomId) {
    return (
      <div className="min-h-screen bg-[#050505] px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Pair Programming</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Code <span className="text-primary">Together</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Collaborate in real-time with a shared editor, live chat, and synchronized problem solving.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Create Room */}
            <Card className="bg-[#0a0a0b] border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Create Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Start a new pair programming session and invite your partner with a room code.
                </p>
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={createRoom}
                  disabled={creating}
                  data-testid="create-pair-btn"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Create Session
                </Button>
              </CardContent>
            </Card>

            {/* Join Room */}
            <Card className="bg-[#0a0a0b] border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Hash className="w-5 h-5 text-primary" />
                  Join Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Room Code</label>
                  <Input
                    placeholder="Enter 6-character code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="bg-zinc-900 border-zinc-700 uppercase font-mono tracking-widest text-center"
                    maxLength={6}
                    onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                  />
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={joinRoom}
                  disabled={joining}
                  data-testid="join-pair-btn"
                >
                  {joining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
                  Join Session
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Code2, title: "Real-time Sync", desc: "Monaco editor with live collaborative editing" },
              { icon: MessageSquare, title: "Built-in Chat", desc: "Discuss approaches and share ideas instantly" },
              { icon: Zap, title: "Instant Submit", desc: "Submit together and see results side by side" }
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                <Icon className="w-5 h-5 text-primary mb-2" />
                <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  SESSION VIEW (with roomId)
  // ═══════════════════════════════════════════
  const partner = room?.participants?.find(p => p.user_id !== user?.id);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* ─── Session Header ─── */}
      <div className="border-b border-zinc-800 bg-[#0a0a0b] px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/pair")}
            className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Leave
          </button>

          <div className="h-5 w-px bg-zinc-800" />

          {/* Participants */}
          <div className="flex items-center gap-3">
            {room?.participants?.map((p) => (
              <div
                key={p.user_id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm ${p.user_id === user?.id
                    ? "bg-primary/15 border border-primary/30 text-primary"
                    : "bg-zinc-800 border border-zinc-700 text-white"
                  }`}
              >
                <div className={`w-2 h-2 rounded-full ${p.user_id === user?.id ? "bg-primary" : "bg-emerald-400"}`} />
                <span className="font-medium">{p.username}</span>
                <span className="text-xs text-muted-foreground capitalize">({p.role})</span>
              </div>
            ))}
            {room?.participants?.length === 1 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm bg-zinc-800/50 border border-dashed border-zinc-700 text-zinc-500">
                <Users className="w-3.5 h-3.5" />
                Waiting for partner...
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className={
            room?.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
              room?.status === "waiting" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
          }>
            {room?.status?.toUpperCase()}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={copyRoomCode}
            className="gap-1.5 border-zinc-700 text-xs font-mono"
          >
            <Copy className="w-3.5 h-3.5" />
            {room?.join_code}
          </Button>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ─── Left: Problem Panel ─── */}
        <div className="w-[30%] border-r border-zinc-800 flex flex-col overflow-hidden">
          {room?.problem ? (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-bold text-white truncate">{room.problem.title}</h2>
                <Badge className={
                  room.problem.difficulty === "easy" ? "bg-emerald-500/20 text-emerald-400" :
                    room.problem.difficulty === "medium" ? "bg-amber-500/20 text-amber-400" :
                      "bg-red-500/20 text-red-400"
                }>
                  {room.problem.difficulty}
                </Badge>
              </div>
              <div className="text-sm text-zinc-300 whitespace-pre-wrap mb-4">{room.problem.description}</div>

              {room.problem.sample_input && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-zinc-400 mb-1.5">Sample Input</h4>
                  <pre className="p-2.5 bg-zinc-900 rounded-lg text-xs text-zinc-300 overflow-x-auto border border-zinc-800">
                    {room.problem.sample_input}
                  </pre>
                </div>
              )}
              {room.problem.sample_output && (
                <div>
                  <h4 className="text-xs font-medium text-zinc-400 mb-1.5">Sample Output</h4>
                  <pre className="p-2.5 bg-zinc-900 rounded-lg text-xs text-zinc-300 overflow-x-auto border border-zinc-800">
                    {room.problem.sample_output}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <Code2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No problem selected yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700"
                  onClick={() => { loadProblems(); setShowProblemPicker(true); }}
                >
                  Choose a Problem
                </Button>
              </div>
            </div>
          )}

          {/* Problem Picker Overlay */}
          {showProblemPicker && (
            <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
              <div className="bg-[#0a0a0b] border border-zinc-800 rounded-lg w-full max-w-lg max-h-[70vh] flex flex-col">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="font-semibold text-white">Select a Problem</h3>
                  <button onClick={() => setShowProblemPicker(false)} className="text-zinc-400 hover:text-white text-sm">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {problems.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading problems...
                    </div>
                  ) : (
                    problems.slice(0, 30).map(p => (
                      <button
                        key={p.id}
                        onClick={() => selectProblem(p)}
                        className="w-full text-left px-3 py-2.5 rounded-md hover:bg-zinc-800 transition-colors flex items-center justify-between group"
                      >
                        <span className="text-sm text-white group-hover:text-primary transition-colors truncate">{p.title}</span>
                        <Badge className={
                          p.difficulty === "easy" ? "bg-emerald-500/20 text-emerald-400 text-xs" :
                            p.difficulty === "medium" ? "bg-amber-500/20 text-amber-400 text-xs" :
                              "bg-red-500/20 text-red-400 text-xs"
                        }>
                          {p.difficulty}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Change Problem Button */}
          {room?.problem && (
            <div className="p-3 border-t border-zinc-800">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-zinc-700 text-xs"
                onClick={() => { loadProblems(); setShowProblemPicker(true); }}
              >
                Change Problem
              </Button>
            </div>
          )}
        </div>

        {/* ─── Center: Code Editor ─── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Editor toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-[#0a0a0b] shrink-0">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-36 h-8 bg-zinc-900 border-zinc-700 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#121215] border-zinc-700">
                <SelectItem value="python">Python 3</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !room?.problem_id}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 gap-2"
              data-testid="pair-submit-btn"
            >
              {submitting ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running...</>
              ) : (
                <><Play className="w-3.5 h-3.5" /> Submit</>
              )}
            </Button>
          </div>

          {/* Monaco Editor */}
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
                padding: { top: 12, bottom: 12 },
                lineNumbers: "on",
                automaticLayout: true,
                tabSize: 4,
              }}
              data-testid="pair-code-editor"
            />
          </div>

          {/* Result Panel */}
          {result && (
            <div className={`p-3 border-t border-zinc-800 ${result.verdict === "Accepted" ? "bg-emerald-500/5" : "bg-red-500/5"
              }`}>
              <div className="flex items-center gap-2">
                {result.verdict === "Accepted" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm font-medium ${result.verdict === "Accepted" ? "text-emerald-400" : "text-red-400"
                  }`}>
                  {result.verdict}
                </span>
                {result.execution_time && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {result.execution_time.toFixed(3)}s
                  </span>
                )}
              </div>
              {result.test_results?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {result.test_results.slice(0, 5).map((tc, i) => (
                    <div key={i} className={`text-xs rounded px-2 py-1 ${tc.passed ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                      }`}>
                      Test {i + 1}: {tc.verdict}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Right: Chat Panel ─── */}
        <div className="w-[22%] border-l border-zinc-800 flex flex-col bg-[#09090b]">
          <div className="px-3 py-2.5 border-b border-zinc-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-white">Chat</span>
            <span className="text-xs text-muted-foreground">({chatMessages.length})</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {chatMessages.length === 0 && (
              <div className="text-center mt-8">
                <MessageSquare className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                <p className="text-xs text-zinc-600">No messages yet</p>
              </div>
            )}
            {chatMessages.map((msg) => {
              const isMe = msg.user_id === user?.id;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] text-zinc-600 mb-0.5 px-1">{msg.username}</span>
                  <div className={`max-w-[90%] px-2.5 py-1.5 rounded-lg text-sm ${isMe
                      ? "bg-primary/15 border border-primary/25 text-foreground"
                      : "bg-zinc-800 border border-zinc-700 text-foreground"
                    }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-zinc-700 mt-0.5 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-2 border-t border-zinc-800">
            <div className="flex gap-1.5">
              <Input
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                className="bg-zinc-900 border-zinc-700 h-8 text-sm"
              />
              <Button
                size="sm"
                onClick={sendChat}
                disabled={!chatInput.trim()}
                className="h-8 w-8 p-0 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
