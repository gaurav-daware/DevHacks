export class WebRTCService {
    constructor(onTrack, onIceCandidate) {
        this.pc = null;
        this.localStream = null;
        this.onTrack = onTrack;
        this.onIceCandidate = onIceCandidate;
        this.config = {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        };
    }

    async startLocalStream() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            return this.localStream;
        } catch (err) {
            console.error("Error accessing microphone:", err);
            throw err;
        }
    }

    initPeerConnection() {
        this.pc = new RTCPeerConnection(this.config);

        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.onIceCandidate(event.candidate);
            }
        };

        this.pc.ontrack = (event) => {
            this.onTrack(event.streams[0]);
        };

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.pc.addTrack(track, this.localStream);
            });
        }

        return this.pc;
    }

    async createOffer() {
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        return offer;
    }

    async handleOffer(offer) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        return answer;
    }

    async handleAnswer(answer) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
    }

    async addCandidate(candidate) {
        if (this.pc) {
            await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }

    close() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
    }
}
