"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { AIChat } from "@/components/editor/AIChat";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getDifficultyBg, LANGUAGE_LABELS } from "@/lib/utils";
import { Play, Upload, Users, Bot } from "lucide-react";
import Image from "next/image";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

interface PairSession {
  id: string;
  problemId: string;
  hostId: string;
  partnerId: string | null;
  status: "WAITING" | "ACTIVE" | "FINISHED";
  sharedCode: string;
  sharedLanguage: string;
  startedAt: string | null;
  endedAt: string | null;
  aiAnalysis: any;
  problem: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
    description: string;
    examples: Array<{ input: string; output: string; explanation?: string }>;
    starterCode: Record<string, string>;
  };
  host: {
    id: string;
    name: string | null;
    image: string | null;
    rating: number;
  };
  partner: {
    id: string;
    name: string | null;
    image: string | null;
    rating: number;
  } | null;
}

export default function PairSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const sessionId = params.id as string;

  const [pairSession, setPairSession] = useState<PairSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showAI, setShowAI] = useState(false);
  const [lastError, setLastError] = useState("");
  const codeUpdateTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetch(`/api/pair/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.push("/pair");
          return;
        }
        setPairSession(data);
        setCode(data.sharedCode || "");
        setLanguage(data.sharedLanguage || "python");
        setLoading(false);
      })
      .catch(() => {
        router.push("/pair");
      });
  }, [sessionId, router]);

  // WebSocket for code sync
  const { send, connected } = useWebSocket(
    pairSession && pairSession.status === "ACTIVE"
      ? `${WS_URL}/ws/duel/${sessionId}?user_id=${session?.user?.id}`
      : null,
    {
      onMessage: useCallback((data: any) => {
        if (data.type === "code_sync") {
          // Update code from partner
          if (data.user_id !== session?.user?.id && data.code !== undefined) {
            setCode(data.code);
          }
        }
        if (data.type === "language_sync") {
          if (data.user_id !== session?.user?.id && data.language) {
            setLanguage(data.language);
            setCode(pairSession?.problem.starterCode?.[data.language] || "");
          }
        }
      }, [session?.user?.id, pairSession]),
    }
  );

  // Sync code changes via WebSocket
  useEffect(() => {
    if (!connected || !session?.user?.id || pairSession?.status !== "ACTIVE") return;

    clearTimeout(codeUpdateTimer.current);
    codeUpdateTimer.current = setTimeout(() => {
      send({
        type: "code_sync",
        user_id: session.user.id,
        code,
        language,
      });
    }, 300);

    return () => clearTimeout(codeUpdateTimer.current);
  }, [code, language, connected, send, session?.user?.id, pairSession]);

  // Also sync to backend via API
  useEffect(() => {
    if (!pairSession || pairSession.status !== "ACTIVE") return;

    const syncTimer = setTimeout(() => {
      fetch(`/api/pair/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_code",
          code,
          language,
        }),
      }).catch(() => {});
    }, 2000);

    return () => clearTimeout(syncTimer);
  }, [code, language, sessionId, pairSession]);

  const handleSubmit = async () => {
    if (!pairSession || !session || running) return;
    setRunning(true);

    try {
      const res = await fetch(`/api/pair/${sessionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      setResult(data);
      setLastError(data.error_output || "");

      // Refresh session to get AI analysis
      if (data.status === "Accepted") {
        setTimeout(() => {
          fetch(`/api/pair/${sessionId}`)
            .then((r) => r.json())
            .then((updated) => {
              setPairSession(updated);
            });
        }, 2000);
      } else {
        setShowAI(true);
      }
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
            Loading session...
          </div>
        </div>
      </div>
    );
  }

  if (!pairSession) return null;

  const isHost = pairSession.hostId === session?.user?.id;
  const isPartner = pairSession.partnerId === session?.user?.id;
  const partner = isHost ? pairSession.partner : pairSession.host;
  const otherUser = isHost ? pairSession.partner : pairSession.host;

  return (
    <div className="flex flex-col h-screen bg-github-bg overflow-hidden">
      <Navbar />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-github-secondary border-b border-github-border flex-shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <Users className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            {isHost ? "Host" : "Partner"} • {pairSession.status}
          </span>
          {otherUser && (
            <>
              <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>with</span>
              {otherUser.image ? (
                <Image src={otherUser.image} alt="" width={20} height={20} className="rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-github-blue/20 text-github-blue text-xs font-bold flex items-center justify-center">
                  {otherUser.name?.[0] || "?"}
                </div>
              )}
              <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
                {otherUser.name || "Partner"}
              </span>
            </>
          )}
        </div>
        {connected && (
          <div className="w-2 h-2 rounded-full bg-github-green" title="Connected" />
        )}
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Problem Panel */}
        <div className="w-[300px] flex-shrink-0 border-r border-github-border overflow-y-auto scrollbar p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-[15px]">{pairSession.problem.title}</span>
              {pairSession.problem.difficulty && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${getDifficultyBg(pairSession.problem.difficulty)}`}>
                  {pairSession.problem.difficulty}
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-github-muted leading-relaxed">{pairSession.problem.description}</p>
          </div>

          {pairSession.problem.examples?.slice(0, 2).map((ex, i) => (
            <div key={i}>
              <p className="text-[11px] font-semibold text-github-muted uppercase tracking-wider mb-1.5">Example {i + 1}</p>
              <div className="bg-github-bg border border-github-border rounded p-2.5 font-mono text-[11px] space-y-0.5">
                <div><span className="text-github-muted">In: </span>{ex.input}</div>
                <div><span className="text-github-muted">Out: </span><span className="text-github-green">{ex.output}</span></div>
              </div>
            </div>
          ))}
        </div>

        {/* Editor Panel */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-github-secondary border-b border-github-border flex-shrink-0">
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setCode(pairSession.problem.starterCode?.[e.target.value] || "");
              }}
              className="bg-github-bg border border-github-border text-github-text rounded px-2 py-1 text-[12px] focus:outline-none"
            >
              {Object.entries(LANGUAGE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>

            <div className="ml-auto flex gap-2">
              <button onClick={handleSubmit} disabled={running}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-github-secondary border border-github-border text-github-text rounded text-[12px] hover:bg-github-tertiary transition-colors disabled:opacity-50">
                <Play className="w-3.5 h-3.5" /> Run
              </button>
              <button onClick={handleSubmit} disabled={running}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium text-white transition-colors disabled:opacity-50 ${result?.status === "Accepted" ? "bg-github-green animate-win-glow" : "bg-github-green/80 hover:bg-github-green"}`}>
                <Upload className="w-3.5 h-3.5" />
                {running ? "Running..." : result?.status === "Accepted" ? "✓ Accepted!" : "Submit"}
              </button>
            </div>
          </div>

          <MonacoEditor value={code} onChange={(v) => setCode(v || "")} language={language} />
        </div>

        {/* Right Panel: Partner Info + AI */}
        <div className="w-[240px] flex-shrink-0 border-l border-github-border flex flex-col overflow-hidden">
          <div className="p-3 border-b border-github-border space-y-3">
            <p className="text-[11px] font-semibold text-github-muted uppercase tracking-wider">Collaborators</p>
            {[pairSession.host, pairSession.partner].filter(Boolean).map((user) => (
              <div key={user!.id} className="bg-github-bg border border-github-border rounded-md p-2.5">
                <div className="flex items-center gap-2">
                  {user!.image ? (
                    <Image src={user!.image} alt="" width={24} height={24} className="rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-github-blue/20 text-github-blue text-xs font-bold flex items-center justify-center">
                      {user!.name?.[0] || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {user!.name || "Anonymous"}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      Rating: {user!.rating}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Analysis */}
          {pairSession.status === "FINISHED" && pairSession.aiAnalysis && (
            <div className="p-3 border-b border-github-border">
              <p className="text-[11px] font-semibold text-github-muted uppercase tracking-wider mb-2">Session Analysis</p>
              <div className="text-[12px] space-y-2" style={{ color: "var(--text-muted)" }}>
                {pairSession.aiAnalysis.analysis && (
                  <p>{pairSession.aiAnalysis.analysis}</p>
                )}
                {pairSession.aiAnalysis.strengths && (
                  <div>
                    <p className="font-semibold mb-1">Strengths:</p>
                    <p>{pairSession.aiAnalysis.strengths}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Chat */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-2.5 border-b border-github-border flex justify-between items-center">
              <span className="text-[11px] text-github-blue font-semibold">🤖 AI Mentor</span>
              <button onClick={() => setShowAI((s) => !s)}
                className="text-[11px] text-github-muted hover:text-github-text transition-colors">
                {showAI ? "hide" : "show"}
              </button>
            </div>
            {showAI ? (
              <div className="flex-1 overflow-hidden">
                <AIChat
                  problemDescription={pairSession.problem.description}
                  code={code}
                  errorOutput={lastError}
                  language={language}
                  onClose={() => setShowAI(false)}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <button onClick={() => setShowAI(true)}
                  className="flex flex-col items-center gap-2 text-github-muted hover:text-github-blue transition-colors p-4">
                  <Bot className="w-8 h-8" />
                  <span className="text-[12px]">Get a hint</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
