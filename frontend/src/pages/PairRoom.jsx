import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useAuth } from "@/contexts/AuthContext";
import { usePairSocket } from "@/hooks/usePairSocket";
import { WebRTCService } from "@/services/webrtc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Users, Mic, MicOff, PhoneOff,
    MessageSquare, ChevronLeft, ChevronRight,
    Play, Settings, User, Terminal,
    ShieldCheck, Share2, Info, Layout, Zap
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
        error,
        signalingMessage,
        sendEdit,
        requestRoleSwitch,
        sendSignaling
    } = usePairSocket(roomId, user?.username);

    const [isMuted, setIsMuted] = useState(true);
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [chatOpen, setChatOpen] = useState(false);

    // --- WebRTC ---
    const webrtcRef = useRef(null);
    const remoteAudioRef = useRef(new Audio());

    useEffect(() => {
        if (participants.length === 2 && !webrtcRef.current) {
            // Start WebRTC initialization when 2nd user joins
            initWebRTC();
        }
    }, [participants.length]);

    useEffect(() => {
        if (!signalingMessage || !webrtcRef.current) return;

        const { type, data } = signalingMessage;

        const handleSignal = async () => {
            if (type === "webrtc_offer") {
                const answer = await webrtcRef.current.handleOffer(data);
                sendSignaling("webrtc_answer", answer);
            } else if (type === "webrtc_answer") {
                await webrtcRef.current.handleAnswer(data);
            } else if (type === "webrtc_ice") {
                await webrtcRef.current.addCandidate(data);
            }
        };

        handleSignal();
    }, [signalingMessage, sendSignaling]);

    const initWebRTC = async () => {
        webrtcRef.current = new WebRTCService(
            (stream) => {
                remoteAudioRef.current.srcObject = stream;
                remoteAudioRef.current.play();
                toast.success("Voice connection established");
            },
            (candidate) => sendSignaling("webrtc_ice", candidate)
        );

        try {
            await webrtcRef.current.startLocalStream();
            webrtcRef.current.initPeerConnection();

            // If I am the second person (Navigator usually joined second), 
            // I'll be the one starting the offer for simplicity.
            if (participants.length === 2) {
                const offer = await webrtcRef.current.createOffer();
                sendSignaling("webrtc_offer", offer);
            }
        } catch (err) {
            toast.error("Could not start voice: " + err.message);
        }
    };

    const toggleMute = () => {
        if (webrtcRef.current?.localStream) {
            const enabled = webrtcRef.current.localStream.getAudioTracks()[0].enabled;
            webrtcRef.current.localStream.getAudioTracks()[0].enabled = !enabled;
            setIsMuted(!enabled);
        } else {
            toast.error("Mic not initialized");
        }
    };

    const handleLeave = () => {
        webrtcRef.current?.close();
        toast.info("Left the session");
        navigate("/pair");
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-white p-4">
                <Card className="max-w-md p-8 bg-[#0c0c0e] border-[#27272a] text-center space-y-4">
                    <h2 className="text-2xl font-bold text-red-500">Error</h2>
                    <p className="text-muted-foreground">{error}</p>
                    <Button onClick={() => navigate("/pair")}>Back to Landing</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#050505] overflow-hidden">
            {/* Room Header */}
            <div className="h-12 border-b border-[#27272a] bg-[#0c0c0e] px-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => navigate("/pair")}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-mono text-[10px]">
                            ROOM: {roomId}
                        </Badge>
                        <h2 className="text-sm font-bold text-foreground truncate max-w-[200px]">Collaborative Session</h2>
                    </div>
                    <div className="flex items-center gap-1 ml-4 bg-[#121215] border border-[#27272a] rounded-sm px-2 py-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${status === 'Connected' ? 'bg-primary' : 'bg-yellow-500'}`} />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">{status}</span>
                    </div>
                    {participants.length > 0 && (
                        <span className="text-[10px] text-muted-foreground font-mono ml-2 border-l border-[#27272a] pl-2">
                            {participants.length}/2 USERS
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 mr-4">
                        {participants.map((u, i) => (
                            <div key={i} title={`${u.username} (${u.role})`} className={`w-7 h-7 rounded-full border-2 border-[#0c0c0e] flex items-center justify-center text-[10px] font-bold ${u.role === 'Driver' ? 'bg-primary text-primary-foreground' : 'bg-[#27272a] text-foreground'} relative`}>
                                {u.username ? u.username[0].toUpperCase() : "?"}
                                {u.role === 'Driver' && <div className="absolute -bottom-0.5 -right-0.5 bg-primary rounded-full p-0.5 border border-[#0c0c0e]">
                                    <Zap className="w-2 h-2 fill-current text-[#050505]" />
                                </div>}
                            </div>
                        ))}
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 gap-2 text-muted-foreground hover:text-primary" onClick={requestRoleSwitch}>
                        <Layout className="w-4 h-4" />
                        Switch Role
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 gap-2 border-[#27272a] hidden md:flex">
                        <Share2 className="w-4 h-4" />
                        Share
                    </Button>
                    <Button size="sm" className="h-8 gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20" variant="outline" onClick={handleLeave}>
                        <PhoneOff className="w-4 h-4" />
                        Leave
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Problem Description */}
                <div className={`${isPanelOpen ? 'w-80 lg:w-96' : 'w-0'} border-r border-[#27272a] bg-[#09090b] transition-all duration-300 flex flex-col relative`}>
                    <div className="p-5 overflow-y-auto flex-1 space-y-6">
                        <div>
                            <h1 className="text-xl font-bold mb-2">1. Two Sum</h1>
                            <div className="flex gap-2">
                                <Badge className="bg-green-500/10 text-green-500 border-none">Easy</Badge>
                                <Badge variant="outline" className="border-[#27272a] text-muted-foreground">Arrays</Badge>
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground leading-relaxed space-y-4 font-inter">
                            <p>Given an array of integers <code className="bg-[#1d1d21] px-1 rounded">nums</code> and an integer <code className="bg-[#1d1d21] px-1 rounded">target</code>, return <em>indices</em> of the two numbers such that they add up to <code className="bg-[#1d1d21] px-1 rounded">target</code>.</p>
                            <p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsPanelOpen(!isPanelOpen)}
                        className="absolute top-1/2 -right-3 h-12 w-6 bg-[#27272a] rounded-sm flex items-center justify-center hover:bg-primary/50 transition-colors z-10"
                    >
                        {isPanelOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>

                {/* Middle Section: Editor */}
                <div className="flex-1 flex flex-col bg-[#050505]">
                    <div className="h-10 border-b border-[#27272a] flex items-center justify-between px-4 text-xs font-mono text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <span className="text-primary border-b-2 border-primary h-10 flex items-center px-2">Solution.py</span>
                        </div>
                        <div className="flex items-center gap-4 italic text-[10px]">
                            {role === "Driver" ?
                                <span className="text-primary flex items-center gap-1"><Zap className="w-3 h-3" /> You are the Driver</span> :
                                <span className="text-muted-foreground">You are the Navigator (Read-Only)</span>
                            }
                        </div>
                    </div>
                    <div className="flex-1 relative">
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
                            }}
                        />
                    </div>

                    {/* Editor Footer */}
                    <div className="h-12 border-t border-[#27272a] bg-[#0c0c0e] px-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button size="sm" variant="ghost" className="h-8 gap-2 text-muted-foreground">
                                <Terminal className="w-4 h-4" />
                                Console
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="secondary" className="h-8 gap-2" disabled={role !== "Driver"}>
                                Run Code
                            </Button>
                            <Button size="sm" className="h-8 gap-2 bg-primary" disabled={role !== "Driver"}>
                                <ShieldCheck className="w-4 h-4" />
                                Submit
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Call & Chat */}
                <div className="w-16 border-l border-[#27272a] bg-[#0c0c0e] flex flex-col items-center py-4 gap-6">
                    <div className="flex flex-col gap-4">
                        <Button
                            size="icon"
                            variant={isMuted ? "destructive" : "secondary"}
                            className={`w-10 h-10 rounded-full transition-all ${!isMuted && 'bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20'}`}
                            onClick={toggleMute}
                        >
                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className={`w-10 h-10 transition-colors ${chatOpen && 'text-primary bg-primary/10'}`}
                            onClick={() => setChatOpen(!chatOpen)}
                        >
                            <MessageSquare className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="mt-auto pb-4 flex flex-col gap-4">
                        <Button size="icon" variant="ghost" className="w-10 h-10 text-muted-foreground">
                            <Settings className="w-5 h-5" />
                        </Button>
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                            <div className="text-[10px] font-bold text-primary">{user?.username[0].toUpperCase()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
