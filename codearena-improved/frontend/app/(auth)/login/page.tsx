"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Zap, Github, Code2, Swords, Brain, GitBranch } from "lucide-react";

const features = [
  { icon: Swords,    label: "1v1 Duels",       desc: "Real-time competitive coding" },
  { icon: Brain,     label: "AI Mentor",        desc: "Socratic guidance, never spoilers" },
  { icon: GitBranch, label: "Dev-Tree",         desc: "Visual skill progression tree" },
  { icon: Code2,     label: "1200+ Problems",   desc: "All difficulty levels" },
];

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (session) router.push("/practice");
  }, [session, router]);

  const handleSignIn = async (provider: string) => {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/practice" });
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--bg-void)" }}
    >
      {/* Left panel — hero */}
      <div
        className="hidden lg:flex flex-col justify-between p-14 w-[480px] flex-shrink-0 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0d0f14 0%, #0a0c10 100%)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        {/* Grid bg */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Gradient orb */}
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,208,132,0.08) 0%, transparent 70%)" }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--accent-green), var(--accent-blue))" }}
            >
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-xl" style={{ color: "var(--text-primary)" }}>
              Code<span style={{ color: "var(--accent-green)" }}>Arena</span>
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-bold"
              style={{ background: "var(--accent-blue-dim)", color: "var(--accent-blue)" }}
            >
              AI
            </span>
          </div>

          <h1
            className="text-4xl font-bold leading-tight mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Compete. Learn.<br />
            <span style={{ color: "var(--accent-green)" }}>Dominate.</span>
          </h1>
          <p className="text-base leading-relaxed mb-12" style={{ color: "var(--text-secondary)" }}>
            The competitive coding platform where AI guides you to mastery, not just answers.
          </p>

          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-4">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)" }}
                >
                  <f.icon className="w-4 h-4" style={{ color: "var(--accent-green)" }} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{f.label}</p>
                  <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-8">
          {[["50K+", "Developers"], ["1.2K", "Problems"], ["∞", "Duels"]].map(([v, l]) => (
            <div key={l}>
              <div className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{v}</div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — auth */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--accent-green), var(--accent-blue))" }}
          >
            <Zap className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
            Code<span style={{ color: "var(--accent-green)" }}>Arena</span>
          </span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: "var(--text-primary)" }}>
            Welcome back
          </h2>
          <p className="text-center text-[14px] mb-8" style={{ color: "var(--text-muted)" }}>
            Sign in to your account to continue
          </p>

          <div className="space-y-3">
            <button
              onClick={() => handleSignIn("github")}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold text-[14px] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              style={{
                background: "#24292f",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Github className="w-5 h-5" />
              {loading === "github" ? "Redirecting..." : "Continue with GitHub"}
            </button>

            <button
              onClick={() => handleSignIn("google")}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold text-[14px] transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50"
              style={{ background: "#fff", color: "#1a1a1a", border: "1px solid #e2e8f0" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {loading === "google" ? "Redirecting..." : "Continue with Google"}
            </button>
          </div>

          <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <p className="text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
