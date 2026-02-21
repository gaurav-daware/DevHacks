"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { DevTree } from "@/components/dev-tree/DevTree";
import { SKILL_TREE_CONFIG } from "@/lib/utils";
import Image from "next/image";
import { CheckCircle2, XCircle, Zap, Trophy, Flame, Star, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"devtree" | "submissions" | "duels">("devtree");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session]);

  const heatmap = (() => {
    const map: Record<string, number> = {};
    if (profile?.submissions) {
      for (const s of profile.submissions) {
        const d = new Date(s.submittedAt).toDateString();
        map[d] = (map[d] || 0) + 1;
      }
    }
    return map;
  })();

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[14px] animate-pulse" style={{ color: "var(--text-muted)" }}>Loading profile...</div>
        </div>
      </div>
    );
  }

  const userSkills: Record<string, number> = {};
  if (profile?.skills) {
    for (const s of profile.skills as any[]) {
      userSkills[s.name] = s.solvedCount || 0;
    }
  }

  const statCards = [
    { label: "Rating",  value: profile?.rating || 1200, icon: Zap,       color: "var(--accent-purple)" },
    { label: "XP",      value: `${profile?.xp || 0}`,  icon: Star,      color: "var(--accent-yellow)" },
    { label: "Wins",    value: profile?.wins || 0,      icon: Trophy,    color: "var(--accent-green)" },
    { label: "Streak",  value: `${profile?.streak || 0}d`, icon: Flame, color: "var(--accent-orange)" },
    { label: "Solved",  value: profile?.totalSolved || 0, icon: TrendingUp, color: "var(--accent-blue)" },
  ];

  const tabs = [
    { id: "devtree",     label: "🌳 Dev-Tree" },
    { id: "submissions", label: "📤 Submissions" },
    { id: "duels",       label: "⚔️ Duels" },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <main className="max-w-[1260px] mx-auto w-full px-5 py-5 space-y-4">

        {/* Profile header */}
        <div
          className="rounded-xl p-6 flex items-start gap-5 flex-wrap relative overflow-hidden"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
        >
          {/* Subtle gradient bg */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at top right, rgba(79,142,247,0.04) 0%, transparent 60%)" }}
          />

          {session?.user?.image ? (
            <Image src={session.user.image} alt="" width={72} height={72} className="rounded-xl relative z-10" />
          ) : (
            <div
              className="w-[72px] h-[72px] rounded-xl flex items-center justify-center text-2xl font-bold relative z-10"
              style={{ background: "var(--accent-blue-dim)", color: "var(--accent-blue)" }}
            >
              {session?.user?.name?.[0]}
            </div>
          )}

          <div className="flex-1 min-w-0 relative z-10">
            <h1 className="text-[20px] font-bold" style={{ color: "var(--text-primary)" }}>
              {profile?.name || session?.user?.name}
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>{profile?.email}</p>
          </div>

          <div className="grid grid-cols-5 gap-2 relative z-10">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-3 text-center min-w-[70px]"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
              >
                <s.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: s.color }} />
                <div className="text-[16px] font-bold" style={{ color: "var(--text-primary)" }}>{s.value}</div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
        >
          <h3 className="text-[12px] font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
            Contribution Activity
          </h3>
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-1">
              {Array.from({ length: 52 }, (_, weekIdx) => {
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - (51 - weekIdx) * 7);
                return (
                  <div key={weekIdx} className="flex flex-col gap-1">
                    {Array.from({ length: 7 }, (_, dayIdx) => {
                      const date = new Date(weekStart);
                      date.setDate(date.getDate() + dayIdx);
                      const count = heatmap[date.toDateString()] || 0;
                      const alpha = count === 0 ? 0 : count === 1 ? 0.25 : count <= 3 ? 0.5 : count <= 6 ? 0.75 : 1;
                      return (
                        <div
                          key={dayIdx}
                          title={`${date.toDateString()}: ${count} submissions`}
                          style={{
                            width: 11, height: 11, borderRadius: 2,
                            background: count === 0 ? "var(--border-subtle)" : `rgba(0, 208, 132, ${alpha})`,
                            cursor: "pointer",
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
            <span>Less</span>
            {[0, 0.25, 0.5, 0.75, 1].map((a) => (
              <div
                key={a}
                style={{ width: 10, height: 10, borderRadius: 2, background: a === 0 ? "var(--border-subtle)" : `rgba(0,208,132,${a})` }}
              />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: "1px solid var(--border-subtle)" }} className="flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="px-5 py-3 text-[13px] font-medium border-b-2 transition-all"
              style={{
                color: activeTab === t.id ? "var(--text-primary)" : "var(--text-muted)",
                borderBottomColor: activeTab === t.id ? "var(--accent-blue)" : "transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "devtree" && <DevTree userSkills={userSkills} />}

        {activeTab === "submissions" && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
          >
            {(!profile?.submissions || profile.submissions.length === 0) ? (
              <div className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
                <p className="text-[14px]">No submissions yet. Start solving!</p>
              </div>
            ) : (
              profile.submissions.map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-all"
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                  onClick={() => router.push(`/practice/${s.problem.slug}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-overlay)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {s.status === "Accepted"
                    ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent-green)" }} />
                    : <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent-red)" }} />}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {s.problem.title}
                    </div>
                    <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {s.language} · {new Date(s.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className="text-[12px] font-semibold"
                    style={{
                      color: s.status === "Accepted" ? "var(--accent-green)"
                           : s.status === "Wrong Answer" ? "var(--accent-red)"
                           : "var(--accent-yellow)",
                    }}
                  >
                    {s.status}
                  </span>
                  {s.runtime && (
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.runtime}</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "duels" && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
          >
            {(!profile?.duelsAsP1?.length && !profile?.duelsAsP2?.length) ? (
              <div className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
                <p className="text-[14px]">No duels yet.{" "}
                  <button onClick={() => router.push("/duel")} style={{ color: "var(--accent-blue)" }}>
                    Challenge someone!
                  </button>
                </p>
              </div>
            ) : (
              [...(profile.duelsAsP1 || []), ...(profile.duelsAsP2 || [])]
                .sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime())
                .map((d: any) => {
                  const won = d.winner?.id === session?.user?.id;
                  return (
                    <div
                      key={d.id}
                      className="flex items-center gap-4 px-5 py-3.5 transition-all"
                      style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      <span className="text-xl">{won ? "🏆" : "💀"}</span>
                      <div className="flex-1">
                        <div className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                          {d.problem.title}
                        </div>
                        <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          vs {d.player1?.id === session?.user?.id ? d.player2?.name : d.player1?.name}
                        </div>
                      </div>
                      <span
                        className="text-[12px] font-bold"
                        style={{ color: won ? "var(--accent-green)" : "var(--accent-red)" }}
                      >
                        {won ? "Victory" : "Defeat"}
                      </span>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
