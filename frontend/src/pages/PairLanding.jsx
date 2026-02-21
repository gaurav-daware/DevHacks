import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Users, Plus, Hash, Play, Info,
    MessageSquare, Mic, Shield, Zap
} from "lucide-react";
import { toast } from "sonner";

export default function PairLanding() {
    const navigate = useNavigate();
    const [roomCode, setRoomCode] = useState("");

    const activeRooms = [
        { id: "room-123", name: "Dynamic Programming Grind", participants: 2, status: "live", creator: "vickyg" },
        { id: "room-456", name: "Google Mock Interview", participants: 1, status: "waiting", creator: "alex_code" },
        { id: "room-789", name: "Two Sum Pair Solve", participants: 2, status: "live", creator: "sarah_99" },
    ];

    const handleJoin = (id) => {
        navigate(`/pair/${id || roomCode}`);
    };

    const handleCreate = () => {
        const id = Math.random().toString(36).substring(7);
        toast.success("Pair session created!");
        navigate(`/pair/${id}`);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-foreground p-6">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Hero Section */}
                <div className="text-center space-y-4 pt-10 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 blur-[120px] rounded-full -z-10" />
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                        Pair <span className="text-primary font-mono italic">Programming</span>
                    </h1>
                    <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
                        Code together. Think together. Win together. Real-time collaboration for the modern developer.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                        <Button size="lg" className="h-12 px-8 gap-2 bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all hover:scale-105" onClick={handleCreate}>
                            <Plus className="w-5 h-5" />
                            Create Session
                        </Button>
                        <div className="flex items-center gap-2 bg-[#121215] border border-[#27272a] rounded-sm p-1 pr-2 w-full sm:w-auto">
                            <Input
                                placeholder="Enter room code..."
                                className="border-none bg-transparent focus-visible:ring-0 w-40"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value)}
                            />
                            <Button size="sm" variant="secondary" className="gap-1 h-8" onClick={() => handleJoin()} disabled={!roomCode}>
                                <Hash className="w-3.5 h-3.5" />
                                Join
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Feature Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-10">
                    {[
                        { icon: Zap, title: "Real-time Sync", desc: "Monaco editor with collaborative editing and live cursors." },
                        { icon: Mic, title: "Voice & Chat", desc: "Integrated voice channels and chat for seamless communication." },
                        { icon: Shield, title: "Secure Rooms", desc: "Private sessions with role-based controls (Driver/Navigator)." }
                    ].map((f, i) => (
                        <Card key={i} className="bg-[#0c0c0e] border-[#1d1d21] hover:border-primary/50 transition-colors group">
                            <CardContent className="p-6 space-y-3">
                                <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <f.icon className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="font-bold text-lg">{f.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Active Rooms */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="w-6 h-6 text-primary" />
                            Active Sessions
                        </h2>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            Live Now
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeRooms.map((room) => (
                            <Card key={room.id} className="bg-[#0c0c0e] border-[#1d1d21] overflow-hidden group hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all transform hover:-translate-y-1">
                                <CardContent className="p-0">
                                    <div className="p-5 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${room.status === 'live' ? 'bg-primary' : 'bg-yellow-500'}`} />
                                                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{room.status}</span>
                                                </div>
                                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{room.name}</h3>
                                            </div>
                                            <div className="flex -space-x-2">
                                                {[...Array(room.participants)].map((_, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0c0c0e] bg-[#1d1d21] flex items-center justify-center">
                                                        <span className="text-[10px] font-bold">U{i + 1}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-sm text-muted-foreground font-mono">
                                            <span>Ref: #{room.id.split('-')[1]}</span>
                                            <span>By {room.creator}</span>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-[#121215] border-t border-[#1d1d21] flex gap-2">
                                        <Button className="flex-1 gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20" variant="outline" onClick={() => handleJoin(room.id)}>
                                            <Play className="w-3.5 h-3.5 fill-current" />
                                            Join Session
                                        </Button>
                                        <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                            <Info className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {activeRooms.length === 0 && (
                        <div className="border-2 border-dashed border-[#1d1d21] rounded-lg p-20 flex flex-col items-center gap-4">
                            <Users className="w-12 h-12 text-muted-foreground/30" />
                            <p className="text-muted-foreground text-center max-w-xs">
                                No active sessions found. Why don't you start one and invite your friends?
                            </p>
                            <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10" onClick={handleCreate}>
                                Create First Session
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
