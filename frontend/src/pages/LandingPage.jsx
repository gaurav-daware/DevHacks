import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Code2, Trophy, Zap, Brain, Play, Users,
  ChevronRight, Terminal, Lock, Clock
} from "lucide-react";

const features = [
  {
    icon: Code2,
    title: "Monaco Editor",
    desc: "Professional-grade code editor with syntax highlighting for Python, C++, and JavaScript.",
    color: "text-primary"
  },
  {
    icon: Brain,
    title: "AI-Powered Hints",
    desc: "Stuck on a problem? Get intelligent, contextual hints powered by Gemini AI without spoilers.",
    color: "text-blue-400"
  },
  {
    icon: Trophy,
    title: "Live Contests",
    desc: "Join timed contests, compete in real-time, and watch the leaderboard update live.",
    color: "text-yellow-400"
  },
  {
    icon: Play,
    title: "Code Playback",
    desc: "Record your coding session keystroke-by-keystroke and replay your problem-solving process.",
    color: "text-purple-400"
  },
  {
    icon: Zap,
    title: "Instant Verdicts",
    desc: "Submit and get results instantly with detailed test case breakdowns.",
    color: "text-orange-400"
  },
  {
    icon: Users,
    title: "Live Leaderboard",
    desc: "Real-time WebSocket-powered leaderboard shows rank updates the moment someone submits.",
    color: "text-pink-400"
  }
];

const difficultyColors = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400"
};

const sampleProblems = [
  { title: "Two Sum", difficulty: "easy", tags: ["array", "hash-table"] },
  { title: "Valid Parentheses", difficulty: "medium", tags: ["string", "stack"] },
  { title: "Maximum Subarray", difficulty: "medium", tags: ["dp", "greedy"] },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="bg-[#050505] min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />
        </div>

        {/* Floating code snippets */}
        <div className="absolute top-16 right-8 hidden xl:block opacity-20 rotate-2">
          <div className="bg-[#121215] border border-[#27272a] rounded-sm p-3 font-mono text-xs text-green-400 w-52">
            <div className="text-muted-foreground mb-1"># Two Sum</div>
            <div>seen = {"{}"}</div>
            <div>for i, n in enumerate(nums):</div>
            <div className="pl-4">if target-n in seen:</div>
            <div className="pl-8">return [seen[target-n], i]</div>
          </div>
        </div>
        <div className="absolute bottom-20 left-6 hidden xl:block opacity-15 -rotate-1">
          <div className="bg-[#121215] border border-[#27272a] rounded-sm p-3 font-mono text-xs text-blue-400 w-44">
            <div className="text-muted-foreground mb-1">// Accepted</div>
            <div className="text-green-400">Runtime: 48ms</div>
            <div>Memory: 41.2 MB</div>
            <div className="text-primary mt-1">Rank: #1</div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-primary/30 rounded-sm px-3 py-1 mb-6 bg-primary/5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-xs font-mono uppercase tracking-widest">
              AI-Powered Competitive Programming
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-heading font-bold tracking-tight mb-4 leading-none">
            Compete.
            <br />
            <span className="gradient-text">Solve. Level Up.</span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            A competitive programming platform with AI hints, live contests, real-time leaderboards,
            and code playback. Built for serious coders.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11 px-6 font-medium"
              onClick={() => navigate(user ? "/problems" : "/auth")}
              data-testid="hero-start-btn"
            >
              Start Solving
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-[#27272a] text-foreground hover:bg-white/5 gap-2 h-11 px-6"
              onClick={() => navigate("/contests")}
              data-testid="hero-contest-btn"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              Browse Contests
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Preview Strip */}
      <section className="border-y border-[#27272a] bg-[#09090b] py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-widest font-mono mb-6">
            Featured Problems
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sampleProblems.map((p, i) => (
              <div
                key={i}
                className="bg-[#121215] border border-[#27272a] rounded-sm p-4 card-hover cursor-pointer"
                onClick={() => navigate("/problems")}
                data-testid={`featured-problem-${i}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium font-heading text-foreground">{p.title}</span>
                  <span className={`text-xs font-mono capitalize ${difficultyColors[p.difficulty]}`}>
                    {p.difficulty}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {p.tags.map(t => (
                    <span key={t} className="tag-badge">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold mb-3">Everything You Need to Excel</h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              A complete competitive programming environment designed for modern coders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc, color }, i) => (
              <div
                key={i}
                className="bg-[#121215] border border-[#27272a] rounded-sm p-5 card-hover animate-fade-in"
                style={{ animationDelay: `${i * 0.08}s` }}
                data-testid={`feature-card-${i}`}
              >
                <div className={`mb-3 ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-semibold text-base mb-1.5">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contest CTA */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-[#121215] border border-[#27272a] rounded-sm p-10 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Terminal className="w-5 h-5 text-primary" />
                <span className="text-primary font-mono text-sm uppercase tracking-widest">
                  Contest Mode
                </span>
              </div>
              <h2 className="text-3xl font-heading font-bold mb-3">
                Ready to compete?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Join or create timed contests. The leaderboard updates in real-time.
                May the best coder win.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11"
                  onClick={() => navigate(user ? "/contests" : "/auth")}
                  data-testid="cta-join-contest"
                >
                  <Trophy className="w-4 h-4" />
                  Join a Contest
                </Button>
                <div className="flex items-center gap-2 text-muted-foreground text-sm justify-center">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Join with code, no invite needed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#27272a] py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-heading font-bold text-sm">
              Code<span className="text-primary">Arena</span>
            </span>
          </div>
          <p className="text-muted-foreground text-xs font-mono">
            Powered by Gemini AI · Built for developers
          </p>
        </div>
      </footer>
    </div>
  );
}
