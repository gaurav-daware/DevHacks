"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Swords, Zap, Target, Clock, ChevronRight, Shield, Flame, Users } from "lucide-react";

type Phase = "lobby" | "searching";

const HOW_IT_WORKS = [
  { step: "1", title: "Join Queue",       desc: "We match you with an opponent near your ELO rating" },
  { step: "2", title: "Same Problem",     desc: "Both players receive the identical random challenge" },
  { step: "3", title: "Race to Solve",    desc: "Real-time health bars show opponent progress" },
  { step: "4", title: "Win ELO + XP",     desc: "First to pass all tests wins rating and experience points" },
];

export default function DuelPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("lobby");
  const [queueTime, setQueueTime] = useState(0);

  useEffect(() => {
    if (phase !== "searching") return;
    const iv = setInterval(() => setQueueTime((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, [phase]);

  const handleJoinQueue = async () => {
    if (!session) { router.push("/login"); return; }
    setPhase("searching");
    try {
      const res = await fetch("/api/duels", { method: "POST" });
      const data = await res.json();
      if (data.duel_id) {
        router.push(`/duel/${data.duel_id}`);
      } else {
        const poll = setInterval(async () => {
          try {
            const pollRes = await fetch(`/api/duels/status?queue_id=${data.queue_id}`);
            const pollData = await pollRes.json();
            if (pollData.duel_id) {
              clearInterval(poll);
              router.push(`/duel/${pollData.duel_id}`);
            }
          } catch {}
        }, 2000);
        setTimeout(() => { clearInterval(poll); setPhase("lobby"); }, 60000);
      }
    } catch {
      setPhase("lobby");
    }
  };

  const handleCancel = () => {
    setPhase("lobby");
    setQueueTime(0);
    fetch("/api/duels/cancel", { method: "POST" }).catch(() => {});
  };

  const mm = String(Math.floor(queueTime / 60)).padStart(2, "0");
  const ss = String(queueTime % 60).padStart(2, "0");

  if (phase === "searching") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
          {/* Animated searching visual */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: "radial-gradient(circle, rgba(79,142,247,0.15), transparent)", animationDuration: "2s" }}
            />
            <div
              className="absolute inset-4 rounded-full animate-ping"
              style={{ background: "radial-gradient(circle, rgba(79,142,247,0.2), transparent)", animationDuration: "2s", animationDelay: "0.4s" }}
            />
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg-overlay)", border: "2px solid var(--accent-blue)" }}
            >
              <Swords className="w-8 h-8" style={{ color: "var(--accent-blue)" }} />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              Finding your opponent...
            </h2>
            <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
              Matching by ELO rating · Estimated wait: ~30s
            </p>
          </div>

          {/* Timer */}
          <div
            className="px-8 py-3 rounded-xl"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)" }}
          >
            <span className="font-mono text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {mm}:{ss}
            </span>
          </div>

          {/* Dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full animate-blink"
                style={{ background: "var(--accent-blue)", animationDelay: `${i * 0.35}s` }}
              />
            ))}
          </div>

          <button
            onClick={handleCancel}
            className="px-5 py-2 rounded-lg text-[13px] font-medium transition-all"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border-default)",
              color: "var(--text-muted)",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.borderColor = "var(--accent-red)";
              (e.target as HTMLElement).style.color = "var(--accent-red)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.borderColor = "var(--border-default)";
              (e.target as HTMLElement).style.color = "var(--text-muted)";
            }}
          >
            Cancel search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="max-w-xl w-full space-y-6">
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-2"
              style={{ background: "linear-gradient(135deg, rgba(79,142,247,0.15), rgba(155,108,247,0.15))", border: "1px solid rgba(79,142,247,0.3)" }}>
              <Swords className="w-9 h-9" style={{ color: "var(--accent-blue)" }} />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
              Duel Arena
            </h1>
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Challenge a random opponent to a 1v1 coding battle.<br />
              First to solve wins <span style={{ color: "var(--accent-green)" }}>ELO + XP</span>.
            </p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Clock,  value: "5 min",   label: "Time limit",  color: "var(--accent-orange)" },
              { icon: Zap,    value: "ELO",      label: "Rating change", color: "var(--accent-purple)" },
              { icon: Target, value: "1",        label: "Problem each",  color: "var(--accent-blue)" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-4 text-center"
                style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
              >
                <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
                <div className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>{s.value}</div>
                <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
          >
            <h3 className="text-[13px] font-bold mb-4" style={{ color: "var(--text-secondary)" }}>
              HOW IT WORKS
            </h3>
            <div className="space-y-3">
              {HOW_IT_WORKS.map((s, i) => (
                <div key={s.step} className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={{ background: "var(--accent-blue-dim)", color: "var(--accent-blue)" }}
                  >
                    {s.step}
                  </div>
                  <div>
                    <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{s.title}</span>
                    <span className="text-[12px] ml-2" style={{ color: "var(--text-muted)" }}>{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleJoinQueue}
            className="w-full py-4 rounded-xl text-[15px] font-bold transition-all flex items-center justify-center gap-2.5 animate-pulse-green"
            style={{ background: "var(--accent-green)", color: "#08090c" }}
          >
            <Swords className="w-5 h-5" />
            Find Opponent
            <ChevronRight className="w-4 h-4" />
          </button>

          {!session && (
            <p className="text-center text-[12px]" style={{ color: "var(--text-muted)" }}>
              <button onClick={() => router.push("/login")} style={{ color: "var(--accent-blue)" }}>
                Sign in
              </button>
              {" "}to start dueling
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
