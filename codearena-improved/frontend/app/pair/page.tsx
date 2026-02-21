"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { Users, Plus, Clock, CheckCircle2, Circle } from "lucide-react";
import Image from "next/image";

interface PairSession {
  id: string;
  problemId: string;
  hostId: string;
  partnerId: string | null;
  status: "WAITING" | "ACTIVE" | "FINISHED";
  startedAt: string | null;
  endedAt: string | null;
  problem: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
  };
  host: {
    id: string;
    name: string | null;
    image: string | null;
  };
  partner: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

export default function PairPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<PairSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState("");
  const [problems, setProblems] = useState<Array<{ id: string; title: string; slug: string }>>([]);

  useEffect(() => {
    if (session) {
      fetch("/api/pair")
        .then((r) => r.json())
        .then((data) => {
          setSessions(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (showCreate) {
      fetch("/api/problems")
        .then((r) => r.json())
        .then((data) => {
          setProblems(Array.isArray(data) ? data : []);
        });
    }
  }, [showCreate]);

  const handleCreate = async () => {
    if (!selectedProblem || !session) return;

    const res = await fetch("/api/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId: selectedProblem }),
    });

    const data = await res.json();
    if (data.id) {
      router.push(`/pair/${data.id}`);
    }
  };

  const handleJoin = async (sessionId: string) => {
    if (!session) return;

    const res = await fetch(`/api/pair/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join" }),
    });

    const data = await res.json();
    if (data.id) {
      router.push(`/pair/${sessionId}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <main className="max-w-[1200px] mx-auto w-full px-5 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold" style={{ color: "var(--text-primary)" }}>
              👥 Pair Programming
            </h1>
            <p className="text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>
              Collaborate and solve problems together
            </p>
          </div>
          {session && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
              style={{
                background: "var(--accent-blue)",
                color: "white",
              }}
            >
              <Plus className="w-4 h-4" /> New Session
            </button>
          )}
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-github-secondary border border-github-border rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-[18px] font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                Create Pair Session
              </h3>
              <select
                value={selectedProblem}
                onChange={(e) => setSelectedProblem(e.target.value)}
                className="w-full mb-4 px-3 py-2 rounded-lg text-[13px]"
                style={{
                  background: "var(--bg-overlay)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="">Select a problem...</option>
                {problems.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!selectedProblem}
                  className="flex-1 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50"
                  style={{
                    background: "var(--accent-blue)",
                    color: "white",
                  }}
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
                  style={{
                    background: "var(--bg-overlay)",
                    color: "var(--text-primary)",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        {loading ? (
          <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-[14px]">No pair sessions yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sessions.map((sessionItem) => {
              const isHost = sessionItem.hostId === session?.user?.id;
              const isPartner = sessionItem.partnerId === session?.user?.id;
              const canJoin = !isHost && !isPartner && !sessionItem.partnerId && sessionItem.status === "WAITING";

              return (
                <div
                  key={sessionItem.id}
                  className="rounded-xl p-5"
                  style={{
                    background: "var(--bg-raised)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
                          {sessionItem.problem.title}
                        </h3>
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: sessionItem.status === "ACTIVE" ? "var(--accent-green-dim)" : sessionItem.status === "FINISHED" ? "var(--accent-blue-dim)" : "var(--bg-overlay)",
                            color: sessionItem.status === "ACTIVE" ? "var(--accent-green)" : sessionItem.status === "FINISHED" ? "var(--accent-blue)" : "var(--text-muted)",
                          }}
                        >
                          {sessionItem.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[12px]" style={{ color: "var(--text-muted)" }}>
                        <div className="flex items-center gap-1.5">
                          {sessionItem.host.image ? (
                            <Image src={sessionItem.host.image} alt="" width={20} height={20} className="rounded-full" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-github-blue/20 text-github-blue text-xs font-bold flex items-center justify-center">
                              {sessionItem.host.name?.[0] || "H"}
                            </div>
                          )}
                          <span>{sessionItem.host.name || "Host"}</span>
                        </div>
                        {sessionItem.partner && (
                          <>
                            <span>+</span>
                            <div className="flex items-center gap-1.5">
                              {sessionItem.partner.image ? (
                                <Image src={sessionItem.partner.image} alt="" width={20} height={20} className="rounded-full" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-github-green/20 text-github-green text-xs font-bold flex items-center justify-center">
                                  {sessionItem.partner.name?.[0] || "P"}
                                </div>
                              )}
                              <span>{sessionItem.partner.name || "Partner"}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(isHost || isPartner) && (
                        <button
                          onClick={() => router.push(`/pair/${sessionItem.id}`)}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                          style={{
                            background: "var(--accent-blue)",
                            color: "white",
                          }}
                        >
                          Open
                        </button>
                      )}
                      {canJoin && (
                        <button
                          onClick={() => handleJoin(sessionItem.id)}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                          style={{
                            background: "var(--accent-green)",
                            color: "white",
                          }}
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
