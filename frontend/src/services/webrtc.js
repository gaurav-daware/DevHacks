export class WebRTCService {
    constructor(onTrack, onSignal, onStateChange) {
        this.pc = null;
        this.localStream = null;
        this.onTrack = onTrack;
        this.onSignal = onSignal;
        this.onStateChange = onStateChange;
        this.config = {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        };
    }

    async init() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.pc = new RTCPeerConnection(this.config);

            this.pc.onicecandidate = (event) => {
                if (event.candidate) {
                    this.onSignal({ type: "candidate", candidate: event.candidate });
                }
            };

            this.pc.ontrack = (event) => {
                this.onTrack(event.streams[0]);
            };

            this.pc.onconnectionstatechange = () => {
                this.onStateChange?.(this.pc.connectionState);
            };

            this.localStream.getTracks().forEach(track => {
                this.pc.addTrack(track, this.localStream);
            });

            return this.localStream;
        } catch (err) {
            console.error("WebRTC Init Error:", err);
            throw err;
        }
    }

    async createOffer() {
        if (!this.pc) return;
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this.onSignal({ type: "offer", offer });
    }

    async handleSignal(signal) {
        if (!this.pc) return;

        try {
            if (signal.type === "offer") {
                await this.pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
                const answer = await this.pc.createAnswer();
                await this.pc.setLocalDescription(answer);
                this.onSignal({ type: "answer", answer });
            } else if (signal.type === "answer") {
                await this.pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
            } else if (signal.type === "candidate") {
                await this.pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
        } catch (err) {
            console.error("WebRTC Signal handling error:", err);
        }
    }

    setMute(isMuted) {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(t => t.enabled = !isMuted);
        }
    }

    close() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(t => t.stop());
            this.localStream = null;
        }
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
    }
}
