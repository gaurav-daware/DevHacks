import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useAuth } from "@/contexts/AuthContext";
import { usePairRoom } from "@/hooks/usePairRoom";
import { WebRTCService } from "@/services/webrtc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Users, Mic, MicOff, PhoneOff,
    MessageSquare, ChevronLeft, ChevronRight,
    Play, Settings, User, Terminal,
    ShieldCheck, Share2, Info, Layout, Zap, Send
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function PairRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // --- State & Sockets ---
    const {
        status,
        participants,
        role,
        code,
        chatHistory,
        error,
        signalingMessage,
        myClientId,
        sendMessage,
        sendEdit,
        requestRoleSwitch,
        sendSignaling
    } = usePairRoom(roomId, user?.username);

    const [isMuted, setIsMuted] = useState(true);
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [chatOpen, setChatOpen] = useState(true);
    const [chatInput, setChatInput] = useState("");
    const [voiceStatus, setVoiceStatus] = useState("disconnected");

    // --- WebRTC ---
    const webrtcRef = useRef(null);
    const remoteAudioRef = useRef(new Audio());
    const chatEndRef = useRef(null);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    const initWebRTC = useCallback(async () => {
        webrtcRef.current = new WebRTCService(
            (stream) => {
                remoteAudioRef.current.srcObject = stream;
                remoteAudioRef.current.play().catch(e => console.error("Autoplay blocked", e));
                toast.success("Voice connection established", {
                    style: { background: '#09090b', color: '#22c55e', border: '1px solid #22c55e' }
                });
            },
            (signal) => sendSignaling(signal),
            (state) => setVoiceStatus(state)
        );

        try {
            await webrtcRef.current.init();
            // Default to muted
            webrtcRef.current.setMute(true);
            setIsMuted(true);

            // Only one person initiates (lexicographical check)
            if (participants.length === 2) {
                const sortedClients = [...participants].sort((a, b) => a.clientId < b.clientId ? -1 : 1);
                // The second one in sorted order initiates
                if (myClientId === sortedClients[1].clientId) {
                    // Small delay to ensure both are ready
                    setTimeout(() => webrtcRef.current?.createOffer(), 1000);
                }
            }
        } catch (err) {
            toast.error("Microphone access denied or failed.");
        }
    }, [participants, user.username, sendSignaling]);

    // Initialize WebRTC when 2 people are present
    useEffect(() => {
        if (participants.length === 2 && !webrtcRef.current) {
            initWebRTC();
        } else if (participants.length < 2 && webrtcRef.current) {
            webrtcRef.current.close();
            webrtcRef.current = null;
            setVoiceStatus("disconnected");
        }
    }, [participants.length, initWebRTC]);

    // Handle Signaling
    useEffect(() => {
        if (!signalingMessage || !webrtcRef.current) return;
        webrtcRef.current.handleSignal(signalingMessage);
    }, [signalingMessage]);

    const toggleMute = () => {
        if (webrtcRef.current) {
            const newMuted = !isMuted;
            webrtcRef.current.setMute(newMuted);
            setIsMuted(newMuted);
        } else {
            toast.error("Wait for a partner to use voice.");
        }
    };

    const handleSendChat = (e) => {
        e.preventDefault();
        if (chatInput.trim()) {
            sendMessage(chatInput);
            setChatInput("");
        }
    };

    const handleLeave = () => {
        webrtcRef.current?.close();
        navigate("/pair");
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#050505] text-white p-4 font-inter">
                <Card className="max-w-md p-8 bg-[#0c0c0e] border-[#27272a] text-center space-y-6 shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                        <Info className="w-8 h-8 text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">Session Error</h2>
                        <p className="text-muted-foreground text-sm">{error}</p>
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => navigate("/pair")}>Back to Lobby</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#050505] text-foreground overflow-hidden font-inter selection:bg-primary/30">
            {/* Header */}
            <header className="h-12 border-b border-[#27272a] bg-[#0c0c0e]/80 backdrop-blur-md px-4 flex items-center justify-between z-50">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" onClick={() => navigate("/pair")}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-[#121215] border border-[#27272a] rounded-sm px-2 py-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${status === 'Connected' ? 'bg-primary shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500'}`} />
                            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{status}</span>
                        </div>
                        <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 font-mono text-[10px]">
                            {roomId}
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {participants.map((u, i) => (
                            <div key={i} title={`${u.username} (${u.role})`} className={`w-7 h-7 rounded-full border-2 border-[#0c0c0e] flex items-center justify-center text-[10px] font-bold transition-all ring-offset-2 ring-offset-[#050505] ${u.role === 'Driver' ? 'bg-primary text-[#050505] scale-110 z-10' : 'bg-[#27272a] text-foreground'} relative`}>
                                {u.username ? u.username[0].toUpperCase() : "?"}
                                {u.role === 'Driver' && <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5 border border-[#0c0c0e] shadow-lg">
                                    <Zap className="w-2.5 h-2.5 fill-current text-[#050505]" />
                                </div>}
                            </div>
                        ))}
                    </div>

                    <div className="h-6 w-[1px] bg-[#27272a] mx-2" />

                    <Button size="sm" variant="ghost" className="h-8 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={requestRoleSwitch} disabled={participants.length < 2}>
                        <Layout className="w-4 h-4" />
                        <span className="hidden sm:inline">Switch Role</span>
                    </Button>

                    <Button size="sm" className="h-8 gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20" variant="outline" onClick={handleLeave}>
                        <PhoneOff className="w-4 h-4" />
                        <span className="hidden sm:inline">Leave</span>
                    </Button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Problem Info */}
                <aside className={`${isPanelOpen ? 'w-80 lg:w-96' : 'w-0'} border-r border-[#27272a] bg-[#09090b] transition-all duration-300 flex flex-col relative`}>
                    <div className="p-6 overflow-y-auto flex-1 space-y-8 scrollbar-hide">
                        <div>
                            <h1 className="text-xl font-bold mb-3 tracking-tight">1. Two Sum</h1>
                            <div className="flex gap-2">
                                <Badge className="bg-green-500/10 text-green-500 border-none px-2 py-0">Easy</Badge>
                                <Badge variant="outline" className="border-[#27272a] text-muted-foreground text-[10px]">Arrays</Badge>
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground leading-relaxed space-y-4 font-inter">
                            <p>Given an array of integers <code className="text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">nums</code> and an integer <code className="text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">target</code>, return <em>indices</em> of the two numbers such that they add up to <code className="text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">target</code>.</p>
                            <p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsPanelOpen(!isPanelOpen)}
                        className="absolute top-1/2 -right-3 h-10 w-6 bg-[#27272a] rounded flex items-center justify-center hover:bg-primary transition-colors z-20 shadow-lg group"
                    >
                        {isPanelOpen ? <ChevronLeft className="w-4 h-4 group-hover:text-[#050505]" /> : <ChevronRight className="w-4 h-4 group-hover:text-[#050505]" />}
                    </button>
                </aside>

                {/* Editor Section */}
                <section className="flex-1 flex flex-col bg-[#050505] relative">
                    <div className="h-10 border-b border-[#27272a] bg-[#0c0c0e]/50 flex items-center justify-between px-4 text-xs font-mono text-muted-foreground">
                        <div className="flex items-center gap-4 h-full">
                            <span className="text-primary border-b-2 border-primary h-full flex items-center px-4 bg-primary/5 font-bold">Solution.py</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {role === "Driver" ?
                                <Badge className="bg-primary/20 text-primary border-primary/30 flex items-center gap-1.5 py-0 px-3 h-6">
                                    <Zap className="w-3 h-3 fill-current" /> DRIVER MODE
                                </Badge> :
                                <Badge variant="outline" className="text-muted-foreground border-[#27272a] h-6 px-3">
                                    NAVIGATOR (READ-ONLY)
                                </Badge>
                            }
                        </div>
                    </div>

                    <div className="flex-1 relative group">
                        <Editor
                            height="100%"
                            defaultLanguage="python"
                            theme="vs-dark"
                            value={code}
                            onChange={(val) => sendEdit(val)}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontFamily: "JetBrains Mono, Menlo, Monaco, Courier New, monospace",
                                renderLineHighlight: "all",
                                autoIndent: "full",
                                scrollBeyondLastLine: false,
                                readOnly: role !== "Driver",
                                lineNumbersMinChars: 3,
                                glyphMargin: true,
                                padding: { top: 20 },
                                cursorSmoothCaretAnimation: "on"
                            }}
                        />

                        {/* Waiting Overlay */}
                        {participants.length < 2 && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30 flex items-center justify-center transition-all">
                                <div className="text-center space-y-4 max-w-xs animate-in fade-in zoom-in duration-500">
                                    <div className="relative">
                                        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                                        <Users className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground text-lg">Waiting for partner</h3>
                                        <p className="text-muted-foreground text-sm">Share the room ID with your collaborator to start the session.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Console/Run Bar */}
                    <div className="h-12 border-t border-[#27272a] bg-[#0c0c0e] px-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="h-8 gap-2 text-muted-foreground group">
                                <Terminal className="w-4 h-4 group-hover:text-primary transition-colors" />
                                <span>Console</span>
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="h-8 gap-2 border-[#27272a] hover:bg-[#121215]" disabled={role !== "Driver"}>
                                <Play className="w-3 h-3 fill-current" /> Run
                            </Button>
                            <Button size="sm" className="h-8 gap-2 bg-primary text-[#050505] font-bold" disabled={role !== "Driver"}>
                                <ShieldCheck className="w-4 h-4" />
                                Submit
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Right Panel: Chat & Voice */}
                <aside className={`${chatOpen ? 'w-80' : 'w-16'} border-l border-[#27272a] bg-[#0c0c0e] transition-all duration-300 flex flex-col`}>
                    {/* Controls Header */}
                    <div className="flex flex-col items-center py-4 gap-4 border-b border-[#27272a]">
                        <div title={`Voice: ${voiceStatus}`} className="relative">
                            <Button
                                size="icon"
                                variant={isMuted ? "destructive" : "secondary"}
                                className={`w-10 h-10 rounded-full transition-all duration-300 ${!isMuted && 'bg-primary shadow-[0_0_12px_#22c55e] text-[#050505] hover:bg-primary/90'}`}
                                onClick={toggleMute}
                                disabled={participants.length < 2}
                            >
                                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 flex-shrink-0" />}
                            </Button>
                            {!isMuted && <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />}
                        </div>
                        <Button
                            size="icon"
                            variant="ghost"
                            className={`w-10 h-10 transition-colors ${chatOpen && 'text-primary bg-primary/10'}`}
                            onClick={() => setChatOpen(!chatOpen)}
                        >
                            <MessageSquare className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Chat Section */}
                    {chatOpen && (
                        <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                            <div className="p-3 border-b border-[#27272a] text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex justify-between">
                                LIVE CHAT
                                <span className="text-primary italic opacity-50">{voiceStatus}</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                                {chatHistory.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                                        <MessageSquare className="w-8 h-8 mb-2" />
                                        <p className="text-[10px]">No messages yet</p>
                                    </div>
                                )}
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={`flex flex-col ${msg.clientId === myClientId ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-1.5 mb-1 px-1">
                                            <span className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">{msg.username}</span>
                                            <span className="text-[8px] opacity-30 font-mono">{new Date(msg.ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className={`text-xs px-3 py-2 rounded-2xl max-w-[85%] break-words ${msg.clientId === myClientId ? 'bg-primary text-[#050505] font-medium rounded-tr-none' : 'bg-[#27272a] text-foreground rounded-tl-none border border-[#3f3f46]'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={handleSendChat} className="p-3 border-t border-[#27272a] bg-[#09090b]">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        className="w-full bg-[#121215] border border-[#27272a] rounded-sm py-2 pl-3 pr-10 text-xs focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/30"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Footer User Profile */}
                    <div className="mt-auto p-4 border-t border-[#27272a] flex items-center justify-center">
                        <div className="relative group">
                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:border-primary transition-all">
                                <div className="text-sm font-bold text-primary">{user?.username ? user.username[0].toUpperCase() : "?"}</div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-[#0c0c0e]" />
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
}
