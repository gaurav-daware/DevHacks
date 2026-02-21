"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { Trophy, Clock, Users, Calendar, ArrowRight, Plus } from "lucide-react";

interface Contest {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  _count: { standings: number };
}

export default function ContestPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "active" | "past">("all");

  useEffect(() => {
    fetch(`/api/contests?status=${filter === "all" ? "" : filter}`)
      .then((r) => r.json())
      .then((data) => {
        setContests(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  const getContestStatus = (contest: Contest) => {
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    if (now < start) return { label: "Upcoming", color: "var(--accent-blue)" };
    if (now >= start && now <= end) return { label: "Active", color: "var(--accent-green)" };
    return { label: "Past", color: "var(--text-muted)" };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <main className="max-w-[1200px] mx-auto w-full px-5 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold" style={{ color: "var(--text-primary)" }}>
              🏆 Contests
            </h1>
            <p className="text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>
              Compete in time-based coding challenges
            </p>
          </div>
          {session && (
            <button
              onClick={() => router.push("/contest/create")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
              style={{
                background: "var(--accent-blue)",
                color: "white",
              }}
            >
              <Plus className="w-4 h-4" /> Create Contest
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(["all", "upcoming", "active", "past"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-[12px] font-semibold transition-all capitalize"
              style={{
                color: filter === f ? "var(--accent-blue)" : "var(--text-muted)",
                background: filter === f ? "var(--accent-blue-dim)" : "var(--bg-raised)",
                border: `1px solid ${filter === f ? "var(--accent-blue)" : "var(--border-subtle)"}`,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Contest List */}
        {loading ? (
          <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
            Loading contests...
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-[14px]">No contests found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {contests.map((contest) => {
              const status = getContestStatus(contest);
              return (
                <div
                  key={contest.id}
                  onClick={() => router.push(`/contest/${contest.id}`)}
                  className="rounded-xl p-5 cursor-pointer transition-all"
                  style={{
                    background: "var(--bg-raised)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-blue)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
                          {contest.title}
                        </h3>
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: `${status.color}20`,
                            color: status.color,
                            border: `1px solid ${status.color}40`,
                          }}
                        >
                          {status.label}
                        </span>
                      </div>
                      {contest.description && (
                        <p className="text-[13px] mb-3" style={{ color: "var(--text-muted)" }}>
                          {contest.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                  </div>

                  <div className="flex items-center gap-6 text-[12px]" style={{ color: "var(--text-muted)" }}>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>Start: {formatDate(contest.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>End: {formatDate(contest.endTime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{contest._count.standings} participants</span>
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
