"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { AIChat } from "@/components/editor/AIChat";
import { getDifficultyBg, LANGUAGE_LABELS } from "@/lib/utils";
import {
  Play, Upload, ChevronLeft, Lightbulb, RotateCcw,
  CheckCircle2, XCircle, Clock, Cpu, Bot, ChevronDown
} from "lucide-react";

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  tags: string[];
  description: string;
  constraints: string[];
  hints: string[];
  examples: Array<{ input: string; output: string; explanation?: string }>;
  starterCode: Record<string, string>;
  testCases: Array<{ input: string; output: string; isSample: boolean }>;
}

interface TestResult {
  input: string;
  expected: string;
  output: string;
  status: "pass" | "fail";
  runtime?: string;
  memory?: string;
}

type TabType = "description" | "results" | "submissions";

function DiffBadge({ difficulty }: { difficulty: string }) {
  const cls = difficulty === "Easy" ? "badge-easy" : difficulty === "Medium" ? "badge-medium" : "badge-hard";
  return <span className={`${cls} text-[11px] px-2 py-0.5 rounded-full font-semibold`}>{difficulty}</span>;
}

export default function ProblemPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const slug = params.slug as string;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("description");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [showAI, setShowAI] = useState(false);
  const [lastError, setLastError] = useState("");

  useEffect(() => {
    fetch(`/api/problems/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setProblem(data);
        setCode(data.starterCode?.python || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (problem) setCode(problem.starterCode[lang] || "");
  };

  const handleRun = async () => {
    if (!problem || !session) {
      console.warn("Cannot run: problem or session missing", { problem: !!problem, session: !!session });
      return;
    }
    setRunning(true);
    setActiveTab("results");
    try {
      console.log("Submitting code to /api/submit", { problemSlug: slug, language, codeLength: code.length });
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemSlug: slug, code, language }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("API error response:", res.status, errorText);
        throw new Error(`API returned ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log("Submit response received:", data);
      setResults(data.results || []);
      setSubmissionStatus(data.status);
      setLastError(data.error_output || "");
      if (data.status !== "Accepted") setShowAI(true);
    } catch (error) {
      console.error("Submit error:", error);
      setResults([]);
      setLastError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[14px] animate-pulse" style={{ color: "var(--text-muted)" }}>Loading problem...</div>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p style={{ color: "var(--text-muted)" }}>Problem not found</p>
          <button onClick={() => router.push("/practice")} style={{ color: "var(--accent-blue)", fontSize: 13 }}>
            ← Back to problems
          </button>
        </div>
      </div>
    );
  }

  const allPassed = results !== null && results.length > 0 && results.every((r) => r.status === "pass");
  const passCount = results?.filter((r) => r.status === "pass").length ?? 0;
  const totalCount = results?.length ?? 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <Navbar />

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* LEFT: Problem panel */}
        <div
          className="w-[400px] flex-shrink-0 flex flex-col overflow-hidden"
          style={{ borderRight: "1px solid var(--border-subtle)" }}
        >
          {/* Tabs */}
          <div
            className="flex flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-raised)" }}
          >
            {(["description", "results", "submissions"] as TabType[]).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className="px-4 py-3 text-[13px] font-medium border-b-2 transition-all capitalize"
                style={{
                  color: activeTab === t ? "var(--text-primary)" : "var(--text-muted)",
                  borderBottomColor: activeTab === t ? "var(--accent-blue)" : "transparent",
                }}
              >
                {t}
                {t === "results" && results !== null && (
                  <span
                    className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-bold"
                    style={{
                      background: allPassed ? "var(--accent-green-dim)" : "var(--accent-red-dim)",
                      color: allPassed ? "var(--accent-green)" : "var(--accent-red)",
                    }}
                  >
                    {passCount}/{totalCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ fontSize: 13 }}>

            {/* DESCRIPTION TAB */}
            {activeTab === "description" && (
              <>
                <button
                  onClick={() => router.push("/practice")}
                  className="flex items-center gap-1 text-[12px] transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--text-primary)")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-muted)")}
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>

                <div>
                  <div className="flex items-start gap-2 flex-wrap mb-2">
                    <h1 className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>{problem.title}</h1>
                    <DiffBadge difficulty={problem.difficulty} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {problem.tags.map((t) => (
                      <span key={t} className="badge-blue text-[10px] px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>

                <p className="leading-relaxed" style={{ color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                  {problem.description}
                </p>

                {problem.examples.map((ex, i) => (
                  <div key={i}>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                      Example {i + 1}
                    </p>
                    <div
                      className="rounded-lg p-3 font-mono text-[12px] space-y-1"
                      style={{ background: "var(--bg-void)", border: "1px solid var(--border-subtle)" }}
                    >
                      <div><span style={{ color: "var(--text-muted)" }}>Input: </span><span style={{ color: "var(--text-primary)" }}>{ex.input}</span></div>
                      <div><span style={{ color: "var(--text-muted)" }}>Output: </span><span style={{ color: "var(--accent-green)" }}>{ex.output}</span></div>
                      {ex.explanation && <div className="pt-1" style={{ color: "var(--text-muted)", fontSize: 11 }}>{ex.explanation}</div>}
                    </div>
                  </div>
                ))}

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Constraints</p>
                  <ul className="space-y-1.5">
                    {problem.constraints.map((c, i) => (
                      <li key={i} className="flex gap-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        <span style={{ color: "var(--border-strong)", marginTop: 2 }}>•</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>

                {problem.hints.length > 0 && (
                  <details className="group">
                    <summary
                      className="cursor-pointer flex items-center gap-2 text-[12px] font-medium list-none"
                      style={{ color: "var(--accent-yellow)" }}
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      Hints ({problem.hints.length})
                      <ChevronDown className="w-3 h-3 ml-auto group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-3 space-y-2 pl-5">
                      {problem.hints.map((h, i) => (
                        <details key={i} className="group/hint">
                          <summary
                            className="cursor-pointer text-[12px] list-none"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Hint {i + 1}
                          </summary>
                          <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{h}</p>
                        </details>
                      ))}
                    </div>
                  </details>
                )}
              </>
            )}

            {/* RESULTS TAB */}
            {activeTab === "results" && (
              <div className="space-y-3">
                {results === null ? (
                  <div className="flex flex-col items-center py-14 gap-3" style={{ color: "var(--text-muted)" }}>
                    <Play className="w-8 h-8 opacity-30" />
                    <p className="text-[13px]">Run your code to see results</p>
                  </div>
                ) : (
                  <>
                    {/* Summary banner */}
                    <div
                      className="p-4 rounded-xl"
                      style={{
                        background: allPassed ? "var(--accent-green-dim)" : "var(--accent-red-dim)",
                        border: `1px solid ${allPassed ? "rgba(0,208,132,0.3)" : "rgba(255,79,106,0.3)"}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {allPassed
                          ? <CheckCircle2 className="w-4 h-4" style={{ color: "var(--accent-green)" }} />
                          : <XCircle className="w-4 h-4" style={{ color: "var(--accent-red)" }} />}
                        <span
                          className="font-bold text-[14px]"
                          style={{ color: allPassed ? "var(--accent-green)" : "var(--accent-red)" }}
                        >
                          {allPassed ? `✓ All ${totalCount} Tests Passed!` : `✗ ${submissionStatus || "Failed"} — ${passCount}/${totalCount} passed`}
                        </span>
                      </div>
                      {!allPassed && lastError && (
                        <pre
                          className="mt-2 text-[11px] font-mono overflow-auto rounded p-2"
                          style={{ color: "var(--accent-red)", background: "rgba(0,0,0,0.3)", maxHeight: 100 }}
                        >
                          {lastError.slice(0, 400)}
                        </pre>
                      )}
                    </div>

                    {results.map((r, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-3.5 space-y-2"
                        style={{
                          background: "var(--bg-raised)",
                          border: `1px solid ${r.status === "pass" ? "rgba(0,208,132,0.2)" : "rgba(255,79,106,0.2)"}`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[12px] font-bold"
                            style={{ color: r.status === "pass" ? "var(--accent-green)" : "var(--accent-red)" }}
                          >
                            {r.status === "pass" ? "✓ Passed" : "✗ Failed"} — Case {i + 1}
                          </span>
                          {(r.runtime || r.memory) && (
                            <div className="flex gap-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
                              {r.runtime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.runtime}</span>}
                              {r.memory && <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />{r.memory}</span>}
                            </div>
                          )}
                        </div>
                        <div
                          className="rounded-lg p-2.5 font-mono text-[11px] space-y-1"
                          style={{ background: "var(--bg-void)", border: "1px solid var(--border-subtle)" }}
                        >
                          <div><span style={{ color: "var(--text-muted)" }}>Input: </span><span style={{ color: "var(--text-secondary)" }}>{r.input}</span></div>
                          <div><span style={{ color: "var(--text-muted)" }}>Expected: </span><span style={{ color: "var(--accent-green)" }}>{r.expected}</span></div>
                          <div>
                            <span style={{ color: "var(--text-muted)" }}>Got: </span>
                            <span style={{ color: r.status === "pass" ? "var(--accent-green)" : "var(--accent-red)" }}>{r.output}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {!allPassed && (
                      <button
                        onClick={() => setShowAI(true)}
                        className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2"
                        style={{
                          background: "var(--accent-blue-dim)",
                          border: "1px solid rgba(79,142,247,0.3)",
                          color: "var(--accent-blue)",
                        }}
                      >
                        <Bot className="w-4 h-4" />
                        Ask AI Mentor
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* SUBMISSIONS TAB */}
            {activeTab === "submissions" && (
              <div className="space-y-2">
                <p className="text-[12px] mb-3" style={{ color: "var(--text-muted)" }}>
                  Your recent submissions for this problem.
                </p>
                {submissions.length === 0 ? (
                  <div className="py-12 text-center" style={{ color: "var(--text-muted)" }}>
                    <p className="text-[13px]">No submissions yet</p>
                  </div>
                ) : (
                  submissions.map((s: any, i: number) => (
                    <div
                      key={i}
                      className="rounded-xl p-3.5 transition-all cursor-pointer"
                      style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
                    >
                      <div className="flex justify-between mb-1.5">
                        <span
                          className="text-[13px] font-semibold"
                          style={{
                            color: s.status === "Accepted" ? "var(--accent-green)"
                                 : s.status === "Wrong Answer" ? "var(--accent-red)"
                                 : "var(--accent-yellow)",
                          }}
                        >
                          {s.status}
                        </span>
                        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {new Date(s.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
                        <span>{LANGUAGE_LABELS[s.language] || s.language}</span>
                        {s.runtime && <span>⏱ {s.runtime}</span>}
                        {s.memory && <span>💾 {s.memory}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* AI Chat */}
          {showAI && (
            <AIChat
              problemDescription={problem.description}
              code={code}
              errorOutput={lastError}
              language={language}
              onClose={() => setShowAI(false)}
            />
          )}
        </div>

        {/* RIGHT: Editor */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Editor toolbar */}
          <div
            className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
            style={{ background: "var(--bg-raised)", borderBottom: "1px solid var(--border-subtle)" }}
          >
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="rounded-lg px-2.5 py-1.5 text-[12px] transition-all outline-none"
              style={{
                background: "var(--bg-overlay)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {Object.entries(LANGUAGE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>

            <button
              onClick={() => setCode(problem.starterCode[language] || "")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-all"
              style={{
                background: "var(--bg-overlay)",
                border: "1px solid var(--border-default)",
                color: "var(--text-muted)",
              }}
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>

            {!showAI && (
              <button
                onClick={() => setShowAI(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-all"
                style={{
                  background: "var(--accent-blue-dim)",
                  border: "1px solid rgba(79,142,247,0.25)",
                  color: "var(--accent-blue)",
                }}
              >
                <Bot className="w-3 h-3" /> AI Mentor
              </button>
            )}

            <div className="ml-auto flex gap-2">
              <button
                onClick={handleRun}
                disabled={running || !session}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-40"
                style={{
                  background: "var(--bg-overlay)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                <Play className="w-3.5 h-3.5" />
                {running ? "Running..." : "Run"}
              </button>

              <button
                onClick={handleRun}
                disabled={running || !session}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-bold transition-all disabled:opacity-40 ${allPassed ? "animate-pulse-green" : ""}`}
                style={{
                  background: allPassed ? "var(--accent-green)" : "rgba(0,208,132,0.85)",
                  color: "#08090c",
                }}
              >
                <Upload className="w-3.5 h-3.5" />
                {allPassed ? "✓ Accepted!" : "Submit"}
              </button>
            </div>
          </div>

          <MonacoEditor
            value={code}
            onChange={(v) => setCode(v || "")}
            language={language}
          />

          {/* Status bar */}
          <div
            className="h-6 flex items-center px-3 gap-4 text-[11px] flex-shrink-0"
            style={{ background: "var(--bg-void)", borderTop: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
          >
            <span style={{ fontFamily: "var(--font-mono)" }}>{LANGUAGE_LABELS[language]}</span>
            {results !== null && (
              <span style={{ color: allPassed ? "var(--accent-green)" : "var(--accent-red)" }}>
                {allPassed
                  ? `✓ All ${totalCount} tests passed`
                  : `✗ ${totalCount - passCount} test(s) failed`}
              </span>
            )}
            {!session && (
              <span style={{ color: "var(--accent-yellow)" }}>⚠ Sign in to submit</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
