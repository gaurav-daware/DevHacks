import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect(roomId, username) {
        if (this.socket) this.disconnect();

        this.socket = io(SOCKET_URL, {
            path: "/socket.io",
            transports: ["websocket"],
            reconnectionAttempts: 5,
        });

        this.socket.on("connect", () => {
            console.log("Connected to collab server");
            this.socket.emit("join-room", { roomId, username });
        });

        this.socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    on(event, cb) {
        if (this.socket) {
            this.socket.on(event, cb);
        }
    }

    off(event) {
        if (this.socket) {
            this.socket.off(event);
        }
    }
}

export const socketService = new SocketService();
