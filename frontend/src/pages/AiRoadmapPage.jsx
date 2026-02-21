import { useState } from "react";
import api from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Target, Zap, Clock, BookOpen, Layers, CheckCircle2, ChevronRight, Route } from "lucide-react";

export default function AiRoadmapPage() {
    const [time, setTime] = useState("");
    const [level, setLevel] = useState("Beginner");
    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(false);

    const generate = async () => {
        if (!time.trim()) return;
        setLoading(true);

        try {
            const res = await api.post("/roadmap/generate", {
                preparation_time: time,
                current_level: level
            });
            setRoadmap(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] px-6 py-12">
            <style dangerouslySetInnerHTML={{
                __html: `
        .neon-glow {
          text-shadow: 0 0 5px #00F5FF, 0 0 10px #00F5FF, 0 0 20px #00F5FF;
        }
        .neon-text { color: #00F5FF; }
      `}} />

            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary uppercase tracking-widest">AI Generated</span>
                    </div>
                    <h1 className="text-4xl font-bold text-emerald-400 mb-4">
    DSA Roadmap Generator
</h1>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Harness the power of Gemini AI to build a customized, highly-structured preparation timeline that fits your exact deadline and skill level.
                    </p>
                </div>

                <Card className="bg-[#0a0a0b] border-zinc-800 p-6 shadow-2xl mb-12 flex flex-col md:flex-row gap-4 items-center justify-center relative overflow-hidden">
                    <div className="relative w-full md:w-auto flex-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 block">Preparation Time</label>
                        <input
                            className="w-full bg-black border border-zinc-800 px-5 py-3 rounded-lg text-primary placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-primary transition-all font-medium"
                            placeholder="e.g. 3 months, 6 weeks..."
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </div>

                    <div className="relative w-full md:w-64">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 block">Current Level</label>
                        <select
                            className="w-full bg-black border border-zinc-800 px-5 py-3 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all font-medium appearance-none"
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                        >
                            <option>Beginner</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                        </select>
                    </div>

                    <div className="relative w-full md:w-auto md:pt-6">
                        <Button
                            onClick={generate}
                            disabled={loading || !time.trim()}
                            className="w-full md:w-auto h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-widest transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5 mr-2" />
                                    Generate
                                </>
                            )}
                        </Button>
                    </div>
                </Card>

                {roadmap && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700" data-testid='roadmap-list'>
                        {/* Stats Header */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-[#0a0a0b] border-zinc-800">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="bg-primary/10 p-3 rounded-xl"><Clock className="w-6 h-6 text-primary" /></div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Duration</p>
                                        <p className="text-lg font-bold text-white">{roadmap.total_duration}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#0a0a0b] border-zinc-800">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="bg-primary/10 p-3 rounded-xl"><Target className="w-6 h-6 text-primary" /></div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Target Level</p>
                                        <p className="text-lg font-bold text-white">{roadmap.difficulty_level}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#0a0a0b] border-zinc-800">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="bg-primary/10 p-3 rounded-xl"><BookOpen className="w-6 h-6 text-primary" /></div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Commitment</p>
                                        <p className="text-lg font-bold text-white">{roadmap.weekly_commitment}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-4">
                            {roadmap.phases.map((phase, index) => (
                                <Card
                                    key={phase.phase}
                                    className="bg-[#0a0a0b] border-zinc-800 overflow-hidden transition-all ring-1 ring-primary/20 hover:border-primary/50"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center gap-4 border-b border-zinc-800 pb-4 mb-4">
                                            {/* Order number */}
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-primary/10 text-primary">
                                                {phase.phase}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-semibold text-white">{phase.title}</h3>
                                                </div>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="text-sm text-primary">
                                                        Duration: {phase.duration}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Phase Details */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#080808] p-4 rounded-lg">
                                            <div>
                                                <h4 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                                                    <Layers className="w-4 h-4 text-primary" /> Focus Topics
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {phase.focus_topics.map((t, i) => (
                                                        <Badge key={i} variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                                            {t}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="text-sm font-semibold text-zinc-400 mb-2">Practice Goal</h4>
                                                    <p className="text-white text-sm bg-zinc-900 p-2 rounded-md border border-zinc-800">{phase.practice_goal}</p>
                                                </div>
                                                {phase.milestones && phase.milestones.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-zinc-400 mb-2">Milestones</h4>
                                                        <ul className="space-y-2">
                                                            {phase.milestones.map((m, i) => (
                                                                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                                                                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                                                    <span>{m}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Bottom Strategy Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <Card className="bg-[#0a0a0b] border-zinc-800">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Route className="w-5 h-5 text-primary" /> Revision Strategy
                                    </h3>
                                    <ul className="space-y-3">
                                        {roadmap.revision_strategy.map((s, i) => (
                                            <li key={i} className="flex items-start gap-3 text-zinc-300">
                                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
                                                <span className="text-sm leading-relaxed">{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#0a0a0b] border-zinc-800">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-primary" /> Mock Interview Plan
                                    </h3>
                                    <p className="text-zinc-300 text-sm leading-relaxed">
                                        {roadmap.mock_interview_plan}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
