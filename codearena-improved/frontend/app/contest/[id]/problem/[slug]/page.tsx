"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { ContestTimer } from "@/components/contest/ContestTimer";
import { getDifficultyBg, LANGUAGE_LABELS } from "@/lib/utils";
import { Play, Upload } from "lucide-react";

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  starterCode: Record<string, string>;
}

interface Contest {
  id: string;
  startTime: string;
  endTime: string;
}

export default function ContestProblemPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const contestId = params.id as string;
  const slug = params.slug as string;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/problems/${slug}`).then((r) => r.json()),
      fetch(`/api/contests/${contestId}`).then((r) => r.json()),
    ])
      .then(([problemData, contestData]) => {
        setProblem(problemData);
        setContest(contestData);
        setCode(problemData.starterCode?.python || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug, contestId]);

  const handleSubmit = async () => {
    if (!problem || !session || running) return;
    setRunning(true);

    try {
      const res = await fetch(`/api/contests/${contestId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          code,
          language,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[14px] animate-pulse" style={{ color: "var(--text-muted)" }}>
            Loading problem...
          </div>
        </div>
      </div>
    );
  }

  if (!problem || !contest) return null;

  const now = new Date();
  const start = new Date(contest.startTime);
  const end = new Date(contest.endTime);
  const isActive = now >= start && now <= end;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <div className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="max-w-[1400px] mx-auto px-5 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push(`/contest/${contestId}`)}
            className="text-[13px] hover:underline"
            style={{ color: "var(--accent-blue)" }}
          >
            ← Back to Contest
          </button>
          <ContestTimer startTime={start} endTime={end} />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Problem Panel */}
        <div className="w-[400px] flex-shrink-0 border-r overflow-y-auto p-5 space-y-4" style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-[20px] font-bold" style={{ color: "var(--text-primary)" }}>
                {problem.title}
              </h1>
              {problem.difficulty && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${getDifficultyBg(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>
              )}
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {problem.description}
            </p>
          </div>

          {problem.examples?.slice(0, 2).map((ex, i) => (
            <div key={i}>
              <p className="text-[11px] font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
                Example {i + 1}
              </p>
              <div className="rounded p-3 font-mono text-[11px] space-y-1" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                <div><span style={{ color: "var(--text-muted)" }}>Input: </span>{ex.input}</div>
                <div><span style={{ color: "var(--text-muted)" }}>Output: </span><span style={{ color: "var(--accent-green)" }}>{ex.output}</span></div>
              </div>
            </div>
          ))}
        </div>

        {/* Editor Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-raised)" }}>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setCode(problem.starterCode?.[e.target.value] || "");
              }}
              className="bg-github-bg border border-github-border text-github-text rounded px-2 py-1 text-[12px] focus:outline-none"
            >
              {Object.entries(LANGUAGE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>

            <div className="ml-auto flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={running || !isActive}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-colors disabled:opacity-50"
                style={{
                  background: result?.status === "Accepted" ? "var(--accent-green)" : "var(--accent-blue)",
                  color: "white",
                }}
              >
                <Upload className="w-3.5 h-3.5" />
                {running ? "Running..." : result?.status === "Accepted" ? "✓ Accepted!" : "Submit"}
              </button>
            </div>
          </div>

          <MonacoEditor value={code} onChange={(v) => setCode(v || "")} language={language} />

          {result && (
            <div className="p-4 border-t" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-raised)" }}>
              <div className="text-[13px]" style={{ color: result.status === "Accepted" ? "var(--accent-green)" : "var(--accent-red)" }}>
                Status: {result.status}
              </div>
              {result.runtime && <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>Runtime: {result.runtime}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
