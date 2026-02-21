"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { ContestTimer } from "@/components/contest/ContestTimer";
import { Trophy, CheckCircle2 } from "lucide-react";
import { getDifficultyBg } from "@/lib/utils";
import Image from "next/image";

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  tags: string[];
}

interface Standing {
  id: string;
  userId: string;
  score: number;
  penalty: number;
  solvedAt?: Record<string, string>;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
    rating: number;
  };
}

interface Contest {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  problems: Problem[];
  standings: Standing[];
  userStanding: Standing | null;
}

export default function ContestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const contestId = params.id as string;

  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"problems" | "standings">("problems");

  useEffect(() => {
    fetch(`/api/contests/${contestId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.push("/contest");
          return;
        }
        setContest(data);
        setLoading(false);
      })
      .catch(() => {
        router.push("/contest");
      });
  }, [contestId, router]);

  useEffect(() => {
    if (activeTab === "standings" && contest) {
      // Refresh standings every 5 seconds
      const interval = setInterval(() => {
        fetch(`/api/contests/${contestId}/standings`)
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setContest((prev) => prev ? { ...prev, standings: data } : null);
            }
          })
          .catch(() => {});
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [activeTab, contestId, contest]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[14px] animate-pulse" style={{ color: "var(--text-muted)" }}>
            Loading contest...
          </div>
        </div>
      </div>
    );
  }

  if (!contest) return null;

  const now = new Date();
  const start = new Date(contest.startTime);
  const end = new Date(contest.endTime);
  const isActive = now >= start && now <= end;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <main className="max-w-[1200px] mx-auto w-full px-5 py-6 space-y-4">
        {/* Header */}
        <div className="rounded-xl p-6" style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}>
          <h1 className="text-[24px] font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            {contest.title}
          </h1>
          {contest.description && (
            <p className="text-[14px] mb-4" style={{ color: "var(--text-muted)" }}>
              {contest.description}
            </p>
          )}
          <ContestTimer
            startTime={start}
            endTime={end}
            onEnd={() => {
              setContest((prev) => prev ? { ...prev, isActive: false } : null);
            }}
          />
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: "1px solid var(--border-subtle)" }} className="flex">
          {[
            { id: "problems", label: "📋 Problems" },
            { id: "standings", label: "🏆 Leaderboard" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "problems" | "standings")}
              className="px-5 py-3 text-[13px] font-medium border-b-2 transition-all"
              style={{
                color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-muted)",
                borderBottomColor: activeTab === tab.id ? "var(--accent-blue)" : "transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Problems Tab */}
        {activeTab === "problems" && (
          <div className="space-y-3">
            {contest.problems.length === 0 ? (
              <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
                <p className="text-[14px]">No problems in this contest</p>
              </div>
            ) : (
              contest.problems.map((problem, idx) => {
                const solved = contest.userStanding?.solvedAt
                  ? Object.keys(contest.userStanding.solvedAt as Record<string, string>).includes(problem.id)
                  : false;

                return (
                  <div
                    key={problem.id}
                    onClick={() => router.push(`/contest/${contestId}/problem/${problem.slug}`)}
                    className="rounded-xl p-4 cursor-pointer transition-all"
                    style={{
                      background: "var(--bg-raised)",
                      border: "1px solid var(--border-subtle)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent-blue)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-subtle)";
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[14px]"
                        style={{
                          background: solved ? "var(--accent-green-dim)" : "var(--bg-overlay)",
                          color: solved ? "var(--accent-green)" : "var(--text-muted)",
                        }}
                      >
                        {solved ? <CheckCircle2 className="w-5 h-5" /> : String.fromCharCode(65 + idx)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                            {problem.title}
                          </h3>
                          {problem.difficulty && (
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${getDifficultyBg(problem.difficulty)}`}>
                              {problem.difficulty}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {problem.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{
                                background: "var(--bg-overlay)",
                                color: "var(--text-muted)",
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Standings Tab */}
        {activeTab === "standings" && (
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}>
            {contest.standings.length === 0 ? (
              <div className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-[14px]">No participants yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <th className="text-left p-4 text-[12px] font-semibold" style={{ color: "var(--text-muted)" }}>
                        Rank
                      </th>
                      <th className="text-left p-4 text-[12px] font-semibold" style={{ color: "var(--text-muted)" }}>
                        Participant
                      </th>
                      <th className="text-right p-4 text-[12px] font-semibold" style={{ color: "var(--text-muted)" }}>
                        Score
                      </th>
                      <th className="text-right p-4 text-[12px] font-semibold" style={{ color: "var(--text-muted)" }}>
                        Penalty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {contest.standings.map((standing, idx) => (
                      <tr
                        key={standing.id}
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          background: contest.userStanding?.id === standing.id ? "var(--bg-overlay)" : "transparent",
                        }}
                      >
                        <td className="p-4 text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
                          {idx + 1}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {standing.user?.image ? (
                              <Image src={standing.user.image} alt="" width={24} height={24} className="rounded-full" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-github-blue/20 text-github-blue text-xs font-bold flex items-center justify-center">
                                {standing.user?.name?.[0] || "?"}
                              </div>
                            )}
                            <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                              {standing.user?.name || "Anonymous"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                          {standing.score}
                        </td>
                        <td className="p-4 text-right text-[13px]" style={{ color: "var(--text-muted)" }}>
                          {Math.floor(standing.penalty / 60)}m {standing.penalty % 60}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
