"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { AIChat } from "@/components/editor/AIChat";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useTimer } from "@/hooks/useTimer";
import { LANGUAGE_LABELS, getDifficultyBg } from "@/lib/utils";
import { Play, Upload, Bot } from "lucide-react";
import Image from "next/image";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

interface PlayerState {
  name: string;
  image?: string;
  rating: number;
  progress: number;
  testsPassed: number;
  totalTests: number;
  status: "CODING" | "SUBMITTED" | "COMPLETED";
}

interface DuelData {
  id: string;
  problem: any;
  myState: PlayerState;
  opponentState: PlayerState;
  status: string;
  winner?: string;
}

export default function DuelArenaPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const duelId = params.id as string;

  const [duel, setDuel] = useState<DuelData | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [lastError, setLastError] = useState("");
  const [gameOver, setGameOver] = useState<{ winner: string; myEloDelta: number } | null>(null);

  const { seconds, formatted, start } = useTimer(300);
  const timerClass = seconds < 60 ? "text-github-red animate-blink" : seconds < 120 ? "text-github-yellow" : "text-github-text";

  // Load duel data
  useEffect(() => {
    fetch(`/api/duels/${duelId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push("/duel"); return; }
        setDuel(data);
        setCode(data.problem?.starterCode?.python || "");
        setLoading(false);
        start();
      })
      .catch(() => { router.push("/duel"); });
  }, [duelId, router, start]);

  // WebSocket for real-time updates
  const { send, connected } = useWebSocket(
    duel ? `${WS_URL}/ws/duel/${duelId}` : null,
    {
      onMessage: useCallback((data: any) => {
        if (data.type === "progress_update") {
          setDuel((prev) => {
            if (!prev) return prev;
            const isMe = data.user_id === session?.user?.id;
            return {
              ...prev,
              myState: isMe ? { ...prev.myState, progress: data.progress, testsPassed: data.tests_passed } : prev.myState,
              opponentState: !isMe ? { ...prev.opponentState, progress: data.progress, testsPassed: data.tests_passed } : prev.opponentState,
            };
          });
        }
        if (data.type === "duel_finished") {
          setGameOver({ winner: data.winner_name, myEloDelta: data.my_elo_delta || 0 });
        }
      }, [session?.user?.id]),
    }
  );

  // Send typing activity to show live activity
  useEffect(() => {
    if (!connected || !session?.user?.id) return;
    const timer = setTimeout(() => {
      send({ type: "code_update", user_id: session.user.id, code_length: code.length });
    }, 500);
    return () => clearTimeout(timer);
  }, [code, connected, send, session?.user?.id]);

  const handleSubmit = async () => {
    if (!duel || !session || running) {
      console.warn("Cannot submit: duel or session missing or already running", { duel: !!duel, session: !!session, running });
      return;
    }
    setRunning(true);

    try {
      console.log("Submitting duel code to /api/submit", { duelId, language, codeLength: code.length });
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemSlug: duel.problem.slug, code, language, duelId }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Duel API error response:", res.status, errorText);
        throw new Error(`API returned ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log("Duel submit response received:", data);

      const progress = Math.round((data.tests_passed / data.total_tests) * 100) || 0;
      setLastError(data.error_output || "");

      // Update local state
      setDuel((prev) => prev ? {
        ...prev,
        myState: {
          ...prev.myState,
          progress,
          testsPassed: data.tests_passed,
          totalTests: data.total_tests,
          status: progress === 100 ? "COMPLETED" : "SUBMITTED",
        },
      } : prev);

      // Broadcast via WebSocket
      send({
        type: "submission",
        user_id: session.user.id,
        progress,
        tests_passed: data.tests_passed,
        total_tests: data.total_tests,
        status: data.status,
      });

      if (data.status !== "Accepted") setShowAI(true);
    } catch (error) {
      console.error("Duel submit error:", error);
      setLastError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-github-bg flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-github-muted animate-pulse">Loading duel...</div>
        </div>
      </div>
    );
  }

  if (!duel) return null;

  const myProgress = duel.myState.progress;
  const opProgress = duel.opponentState.progress;

  return (
    <div className="flex flex-col h-screen bg-github-bg overflow-hidden">
      <Navbar />

      {/* Health bar header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-github-secondary border-b border-github-border flex-shrink-0">
        {/* Player 1 (me) */}
        <div className="flex items-center gap-2 flex-1">
          {duel.myState.image ? (
            <Image src={duel.myState.image} alt="" width={22} height={22} className="rounded-full" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-github-green/20 text-github-green text-xs font-bold flex items-center justify-center">
              {duel.myState.name?.[0]}
            </div>
          )}
          <span className="text-[12px] font-semibold text-github-green">You</span>
          <div className="flex-1 h-2 bg-github-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${myProgress}%`, background: "linear-gradient(90deg, #238636, #3fb950)" }}
            />
          </div>
          <span className="text-[11px] font-mono text-github-green w-8 text-right">{myProgress}%</span>
        </div>

        {/* Timer */}
        <div className="text-center flex-shrink-0">
          <div className={`font-mono text-lg font-bold tracking-widest ${timerClass}`}>{formatted}</div>
        </div>

        {/* Player 2 (opponent) */}
        <div className="flex items-center gap-2 flex-1 flex-row-reverse">
          {duel.opponentState.image ? (
            <Image src={duel.opponentState.image} alt="" width={22} height={22} className="rounded-full" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-github-red/20 text-github-red text-xs font-bold flex items-center justify-center">
              {duel.opponentState.name?.[0]}
            </div>
          )}
          <span className="text-[12px] font-semibold text-github-red">{duel.opponentState.name}</span>
          <div className="flex-1 h-2 bg-github-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${opProgress}%`, background: "linear-gradient(90deg, #da3633, #f85149)" }}
            />
          </div>
          <span className="text-[11px] font-mono text-github-red w-8">{Math.round(opProgress)}%</span>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left: Problem */}
        <div className="w-[300px] flex-shrink-0 border-r border-github-border overflow-y-auto scrollbar p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-[15px]">{duel.problem?.title}</span>
              {duel.problem?.difficulty && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${getDifficultyBg(duel.problem.difficulty)}`}>
                  {duel.problem.difficulty}
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-github-muted leading-relaxed">{duel.problem?.description}</p>
          </div>

          {duel.problem?.examples?.slice(0, 2).map((ex: any, i: number) => (
            <div key={i}>
              <p className="text-[11px] font-semibold text-github-muted uppercase tracking-wider mb-1.5">Example {i + 1}</p>
              <div className="bg-github-bg border border-github-border rounded p-2.5 font-mono text-[11px] space-y-0.5">
                <div><span className="text-github-muted">In: </span>{ex.input}</div>
                <div><span className="text-github-muted">Out: </span><span className="text-github-green">{ex.output}</span></div>
              </div>
            </div>
          ))}

          <div>
            <p className="text-[11px] font-semibold text-github-muted uppercase tracking-wider mb-2">Test Cases</p>
            {Array.from({ length: duel.myState.totalTests || 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-github-border/50 text-[12px]">
                <span className={duel.myState.testsPassed > i ? "text-github-green" : "text-github-muted"}>
                  {duel.myState.testsPassed > i ? "✓" : "○"}
                </span>
                <span className="text-github-muted">Case {i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Editor */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-github-secondary border-b border-github-border flex-shrink-0">
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setCode(duel.problem?.starterCode?.[e.target.value] || "");
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium text-white transition-colors disabled:opacity-50 ${myProgress === 100 ? "bg-github-green animate-win-glow" : "bg-github-green/80 hover:bg-github-green"}`}>
                <Upload className="w-3.5 h-3.5" />
                {running ? "Running..." : myProgress === 100 ? "✓ Accepted!" : "Submit"}
              </button>
            </div>
          </div>

          <MonacoEditor value={code} onChange={(v) => setCode(v || "")} language={language} />
        </div>

        {/* Right: Player tracker + AI */}
        <div className="w-[240px] flex-shrink-0 border-l border-github-border flex flex-col overflow-hidden">
          <div className="p-3 border-b border-github-border space-y-3">
            <p className="text-[11px] font-semibold text-github-muted uppercase tracking-wider">Competitors</p>
            {[
              { ...duel.myState, label: "You", color: "github-green", isMe: true },
              { ...duel.opponentState, label: duel.opponentState.name, color: "github-red", isMe: false },
            ].map((pl) => (
              <div key={pl.label} className="bg-github-bg border border-github-border rounded-md p-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-full bg-${pl.color}/20 text-${pl.color} text-xs font-bold flex items-center justify-center`}>
                    {pl.name?.[0]}
                  </div>
                  <span className={`text-[12px] font-semibold text-${pl.color}`}>{pl.label}</span>
                  <span className="ml-auto text-[10px] font-mono text-github-muted">{pl.rating}</span>
                </div>
                <div className="h-1.5 bg-github-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pl.progress}%`, background: pl.isMe ? "#238636" : "#da3633" }} />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-github-muted">
                  <span>{pl.status}</span>
                  <span>{pl.progress}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-2.5 border-b border-github-border flex justify-between items-center">
              <span className="text-[11px] text-github-blue font-semibold">🤖 AI Mentor</span>
              <button onClick={() => setShowAI((s) => !s)}
                className="text-[11px] text-github-muted hover:text-github-text transition-colors">
                {showAI ? "hide" : "show"}
              </button>
            </div>
            {!showAI ? (
              <div className="flex-1 flex items-center justify-center">
                <button onClick={() => setShowAI(true)}
                  className="flex flex-col items-center gap-2 text-github-muted hover:text-github-blue transition-colors p-4">
                  <Bot className="w-8 h-8" />
                  <span className="text-[12px]">Get a hint</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden">
                <AIChat
                  problemDescription={duel.problem?.description || ""}
                  code={code}
                  errorOutput={lastError}
                  language={language}
                  onClose={() => setShowAI(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Game over modal */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className={`bg-github-secondary border rounded-lg p-10 text-center max-w-sm w-full mx-4 ${gameOver.myEloDelta >= 0 ? "border-github-green/50 shadow-lg shadow-github-green/10" : "border-github-red/50"}`}>
            <div className="text-6xl mb-4">{gameOver.myEloDelta >= 0 ? "🏆" : "💀"}</div>
            <h2 className={`text-2xl font-bold mb-2 ${gameOver.myEloDelta >= 0 ? "text-github-green" : "text-github-red"}`}>
              {gameOver.myEloDelta >= 0 ? "Victory!" : "Defeated"}
            </h2>
            <p className="text-github-muted text-sm mb-6">
              {gameOver.myEloDelta >= 0 ? "+" : ""}{gameOver.myEloDelta} ELO •{" "}
              {gameOver.myEloDelta >= 0 ? "+150" : "+50"} XP
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push("/duel")}
                className="px-4 py-2 bg-github-green text-white rounded-md text-sm font-medium hover:bg-[#2ea043] transition-colors">
                Rematch
              </button>
              <button onClick={() => router.push("/practice")}
                className="px-4 py-2 bg-github-secondary border border-github-border text-github-text rounded-md text-sm hover:bg-github-tertiary transition-colors">
                Practice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
