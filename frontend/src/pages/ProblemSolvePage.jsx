import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play, Lightbulb, RotateCcw, Clock, CheckCircle2, XCircle,
  AlertTriangle, ChevronDown, ChevronUp, History, Loader2, Brain, Eye, MessageSquare, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import CodePlayback from "@/components/CodePlayback";
import DiscussionsTab from "@/components/DiscussionsTab";
import SimilarProblems from "@/components/SimilarProblems";
import CodeReview from "@/components/CodeReview";

const DIFFICULTY_COLORS = {
  easy: "text-green-400 border-green-400/30 bg-green-400/5",
  medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
  hard: "text-red-400 border-red-400/30 bg-red-400/5"
};

const VERDICT_STYLES = {
  "Accepted": "text-green-400 bg-green-400/10 border-green-400/30",
  "Wrong Answer": "text-red-400 bg-red-400/10 border-red-400/30",
  "Time Limit Exceeded": "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  "Runtime Error": "text-orange-400 bg-orange-400/10 border-orange-400/30",
  "Compilation Error": "text-red-400 bg-red-400/10 border-red-400/30",
};

const DEFAULT_CODE = {
  python: `import sys
input = sys.stdin.readline

def solve():
    # Read input and solve
    pass

solve()
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Your solution here
    
    return 0;
}`,
  javascript: `// Note: JavaScript execution is simulated for this demo
process.stdin.resume();
process.stdin.setEncoding('utf8');
let input = '';
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
    const lines = input.trim().split('\\n');
    // Your solution here
    console.log(lines[0]);
});`
};

export default function ProblemSolvePage() {
  const { problemId } = useParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [hint, setHint] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);
  const [hintOpen, setHintOpen] = useState(false);
  const [playbackSub, setPlaybackSub] = useState(null);
  const [playbackOpen, setPlaybackOpen] = useState(false);
  const [showCodeReview, setShowCodeReview] = useState(false);
  const [selectedSubForReview, setSelectedSubForReview] = useState(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Keystroke recording
  const keystrokesRef = useRef([]);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    fetchProblem();
    fetchSubmissions();
  }, [problemId]);

  const fetchProblem = async () => {
    try {
      const res = await api.get(`/problems/${problemId}`);
      setProblem(res.data);
    } catch {
      toast.error("Problem not found");
      navigate("/problems");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await api.get(`/submissions/problem/${problemId}`);
      setSubmissions(res.data);
    } catch {
      // Not logged in, ignore
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
    keystrokesRef.current = [];
    startTimeRef.current = Date.now();
  };

  const handleCodeChange = (val) => {
    setCode(val || "");
    // Record keystroke
    keystrokesRef.current.push({
      timestamp: Date.now() - startTimeRef.current,
      value: val || ""
    });
    // Keep only last 500 keystrokes to manage size
    if (keystrokesRef.current.length > 500) {
      keystrokesRef.current = keystrokesRef.current.slice(-500);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to submit");
      navigate("/auth");
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
        problem_id: problemId,
        keystrokes: keystrokesRef.current.slice(0, 200) // Limit keystrokes saved
      });
      setResult(res.data);
      if (res.data.verdict === "Accepted") {
        toast.success("Accepted! Great job!");
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        toast.error(`${res.data.verdict}`);
      }
      await fetchSubmissions();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHint = async () => {
    setHintLoading(true);
    setHintOpen(true);
    try {
      const res = await api.post(`/problems/${problemId}/hint`, {
        problem_id: problemId,
        code,
        hint_level: hintLevel
      });
      setHint(res.data.hint);
    } catch {
      setHint("Could not load hint. Try again.");
    } finally {
      setHintLoading(false);
    }
  };

  const handleAskAI = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiInput("");
    setAiMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setAiLoading(true);
    try {
      const res = await api.post(`/problems/${problemId}/ask_ai`, {
        code,
        language,
        error: result?.verdict && result.verdict !== "Accepted" ? result.verdict : "",
        question: userMsg
      });
      setAiMessages(prev => [...prev, { role: "ai", content: res.data.response }]);
    } catch {
      setAiMessages(prev => [...prev, { role: "ai", content: "Sorry, I couldn't connect to the AI. Please try again." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const loadPlayback = async (subId) => {
    try {
      const res = await api.get(`/submissions/${subId}/playback`);
      setPlaybackSub(res.data);
      setPlaybackOpen(true);
    } catch {
      toast.error("No playback data for this submission");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!problem) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#27272a] bg-[#09090b]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/problems")}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Problems
          </button>
          <span className="text-[#27272a]">/</span>
          <h1 className="font-heading font-semibold text-sm truncate max-w-[200px] sm:max-w-none">
            {problem.title}
          </h1>
          <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border capitalize ${DIFFICULTY_COLORS[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
          {problem.is_solved && (
            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-36 h-8 bg-[#121215] border-[#27272a] text-sm" data-testid="language-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#121215] border-[#27272a]">
              <SelectItem value="python">Python 3</SelectItem>
              <SelectItem value="cpp">C++ (Simulated)</SelectItem>
              <SelectItem value="javascript">JavaScript (Simulated)</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setAiChatOpen(true)}
            variant="outline"
            className="h-8 px-3 gap-1.5 border-purple-500/40 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 hover:text-purple-300 transition-colors"
            data-testid="ask-ai-btn"
          >
            <Sparkles className="w-3.5 h-3.5" /> Ask AI
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 gap-2"
            data-testid="submit-btn"
          >
            {submitting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running...</>
            ) : (
              <><Play className="w-3.5 h-3.5" /> Submit</>
            )}
          </Button>
        </div>
      </div>

      {/* Main split layout */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Left: Problem description */}
        <div className="w-full lg:w-[42%] flex flex-col border-r border-[#27272a] overflow-hidden">
          <Tabs defaultValue="description" className="flex flex-col h-full">
            <TabsList className="bg-[#09090b] border-b border-[#27272a] rounded-none h-9 px-3 gap-1 justify-start">
              <TabsTrigger value="description" className="text-xs h-7 data-[state=active]:bg-[#121215]">
                Description
              </TabsTrigger>
              <TabsTrigger value="hints" className="text-xs h-7 data-[state=active]:bg-[#121215]">
                Hints
              </TabsTrigger>
              <TabsTrigger value="submissions" className="text-xs h-7 data-[state=active]:bg-[#121215]">
                Submissions
              </TabsTrigger>
              <TabsTrigger value="discussions" className="text-xs h-7 data-[state=active]:bg-[#121215]">
                <MessageSquare className="w-3 h-3 mr-1" />
                Discuss
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="flex-1 overflow-y-auto p-4 mt-0">
              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {problem.tags?.map(t => (
                  <span key={t} className="tag-badge">{t}</span>
                ))}
              </div>

              {/* Description */}
              <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed">
                <ReactMarkdown>{problem.description}</ReactMarkdown>
              </div>

              {/* Sample I/O */}
              {problem.sample_input && (
                <div className="mt-4 space-y-3">
                  <h3 className="text-sm font-semibold font-heading">Example</h3>
                  <div className="bg-[#09090b] border border-[#27272a] rounded-sm p-3">
                    <div className="text-xs text-muted-foreground mb-1">Input:</div>
                    <pre className="text-xs font-mono text-foreground">{problem.sample_input}</pre>
                  </div>
                  <div className="bg-[#09090b] border border-[#27272a] rounded-sm p-3">
                    <div className="text-xs text-muted-foreground mb-1">Output:</div>
                    <pre className="text-xs font-mono text-foreground">{problem.sample_output}</pre>
                  </div>
                </div>
              )}

              {/* Constraints */}
              {problem.constraints && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold font-heading mb-2">Constraints</h3>
                  <pre className="text-xs font-mono text-muted-foreground bg-[#09090b] border border-[#27272a] rounded-sm p-3 whitespace-pre-wrap">
                    {problem.constraints}
                  </pre>
                </div>
              )}

              {/* Time limit */}
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                Time limit: {problem.time_limit}s
              </div>

              {/* Similar Problems */}
              <div className="mt-6">
                <SimilarProblems problemId={problemId} />
              </div>
            </TabsContent>

            <TabsContent value="hints" className="flex-1 overflow-y-auto p-4 mt-0">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Get AI-powered hints (powered by Gemini) without spoiling the solution.
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3].map(l => (
                    <button
                      key={l}
                      onClick={() => setHintLevel(l)}
                      className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${hintLevel === l
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-[#27272a] text-muted-foreground hover:border-[#3f3f46]"
                        }`}
                      data-testid={`hint-level-${l}`}
                    >
                      Level {l}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={handleHint}
                  disabled={hintLoading}
                  variant="outline"
                  className="gap-2 border-[#27272a] hover:bg-white/5"
                  data-testid="get-hint-btn"
                >
                  {hintLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Getting Hint...</>
                  ) : (
                    <><Brain className="w-4 h-4 text-blue-400" /> Get Hint {hintLevel}/3</>
                  )}
                </Button>

                {hint && (
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-sm p-4 animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-blue-400 font-mono uppercase tracking-wide">
                        Hint Level {hintLevel}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{hint}</p>
                  </div>
                )}

                {/* Static hints */}
                {problem.hints?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                      Built-in Hints
                    </h4>
                    <div className="space-y-2">
                      {problem.hints.map((h, i) => (
                        <details key={i} className="group">
                          <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1 list-none">
                            <ChevronDown className="w-3.5 h-3.5 group-open:hidden" />
                            <ChevronUp className="w-3.5 h-3.5 hidden group-open:block" />
                            Hint {i + 1}
                          </summary>
                          <p className="mt-2 text-sm text-foreground pl-4 border-l border-[#27272a]">{h}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="submissions" className="flex-1 overflow-y-auto p-4 mt-0">
              {submissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No submissions yet. Write your solution and hit Submit!</p>
              ) : (
                <div className="space-y-2">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="bg-[#09090b] border border-[#27272a] rounded-sm p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-sm border ${VERDICT_STYLES[sub.verdict] || ""}`}>
                          {sub.verdict}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">{sub.language}</span>
                          {sub.verdict === "Accepted" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs gap-1 text-primary hover:text-primary/80"
                              onClick={() => {
                                setSelectedSubForReview(sub.id);
                                setShowCodeReview(true);
                              }}
                              data-testid={`review-btn-${sub.id}`}
                            >
                              <Sparkles className="w-3 h-3" /> Review
                            </Button>
                          )}
                          {sub.keystrokes?.length > 5 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                              onClick={() => loadPlayback(sub.id)}
                              data-testid={`playback-btn-${sub.id}`}
                            >
                              <Eye className="w-3 h-3" /> Replay
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(sub.created_at).toLocaleString()} · {sub.execution_time?.toFixed(3)}s
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="discussions" className="flex-1 overflow-y-auto p-4 mt-0">
              <DiscussionsTab problemId={problemId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Editor + results */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Editor */}
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
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 12, bottom: 12 },
                lineNumbers: "on",
                renderLineHighlight: "line",
                cursorStyle: "line",
                automaticLayout: true,
                tabSize: 4,
              }}
              data-testid="code-editor"
            />
          </div>

          {/* Result panel */}
          {result && (
            <div className="border-t border-[#27272a] p-4 max-h-48 overflow-y-auto bg-[#09090b]" data-testid="result-panel">
              <div className="flex items-center gap-2 mb-3">
                {result.verdict === "Accepted" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm font-semibold ${result.verdict === "Accepted" ? "text-green-400" : "text-red-400"}`}>
                  {result.verdict}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {result.execution_time?.toFixed(3)}s avg
                </span>
              </div>

              {result.test_results?.length > 0 && (
                <div className="space-y-2">
                  {result.test_results.map((tc, i) => (
                    <div key={i} className={`text-xs rounded-sm p-2 border ${tc.passed ? "border-green-400/20 bg-green-400/5" : "border-red-400/20 bg-red-400/5"}`}>
                      <div className="flex items-center gap-1 mb-1">
                        {tc.passed ? (
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-400" />
                        )}
                        <span className="font-mono">Test {i + 1}: {tc.verdict}</span>
                        {tc.note && <span className="text-muted-foreground">({tc.note})</span>}
                      </div>
                      {!tc.passed && tc.output && (
                        <div className="font-mono text-muted-foreground pl-4">
                          Got: <span className="text-red-400">{tc.output?.slice(0, 100)}</span>
                          {tc.expected && <> | Expected: <span className="text-green-400">{tc.expected?.slice(0, 100)}</span></>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Playback dialog */}
      <Dialog open={playbackOpen} onOpenChange={setPlaybackOpen}>
        <DialogContent className="bg-[#121215] border-[#27272a] max-w-3xl" data-testid="playback-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Code Playback
            </DialogTitle>
          </DialogHeader>
          {playbackSub && (
            <CodePlayback submission={playbackSub} />
          )}
        </DialogContent>
      </Dialog>

      {/* Code Review dialog */}
      <Dialog open={showCodeReview} onOpenChange={setShowCodeReview}>
        <DialogContent className="bg-[#121215] border-[#27272a] max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="code-review-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Code Review
            </DialogTitle>
          </DialogHeader>
          {selectedSubForReview && (
            <CodeReview submissionId={selectedSubForReview} onClose={() => setShowCodeReview(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* AI Coding Assistant Dialog */}
      <Dialog open={aiChatOpen} onOpenChange={setAiChatOpen}>
        <DialogContent className="bg-[#121215] border-[#27272a] max-w-2xl max-h-[80vh] flex flex-col" data-testid="ai-chat-dialog">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-heading flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              AI Coding Assistant
              <span className="text-xs font-normal text-muted-foreground ml-1">Ask for hints, debug help, or discuss your approach</span>
            </DialogTitle>
          </DialogHeader>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-[250px] max-h-[400px] pr-1">
            {aiMessages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm mt-8">
                <Sparkles className="w-8 h-8 mx-auto mb-3 text-purple-500/50" />
                <p className="font-medium">Ask me anything about this problem!</p>
                <p className="text-xs mt-1 text-muted-foreground/70">I can help you debug, suggest approaches, or explain edge cases.</p>
              </div>
            )}
            {aiMessages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${msg.role === "user" ? "bg-primary/20 text-primary" : "bg-purple-500/20 text-purple-400"
                  }`}>
                  {msg.role === "user" ? "U" : "AI"}
                </div>
                <div className={`flex-1 text-sm rounded-lg p-3 max-w-[85%] ${msg.role === "user"
                    ? "bg-primary/10 border border-primary/20 text-foreground ml-auto"
                    : "bg-[#0a0a0b] border border-[#27272a] text-foreground"
                  }`}>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full flex-shrink-0 bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">AI</div>
                <div className="bg-[#0a0a0b] border border-[#27272a] rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2 mt-2 pt-3 border-t border-[#27272a] shrink-0">
            <input
              className="flex-1 bg-[#0a0a0b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              placeholder="Ask a question, e.g. 'Why is my approach O(n²)?'"
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAskAI()}
              disabled={aiLoading}
            />
            <Button
              onClick={handleAskAI}
              disabled={aiLoading || !aiInput.trim()}
              className="bg-purple-600 hover:bg-purple-500 text-white h-9 px-4 shrink-0"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

