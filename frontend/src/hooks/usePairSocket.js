import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:8000";

export const usePairSocket = (roomId, username) => {
    const [socket, setSocket] = useState(null);
    const [status, setStatus] = useState("Connecting...");
    const [participants, setParticipants] = useState([]);
    const [mySid, setMySid] = useState(null);
    const [role, setRole] = useState("Navigator");
    const [code, setCode] = useState("");
    const [error, setError] = useState(null);
    const [signalingMessage, setSignalingMessage] = useState(null);

    const isRemoteChange = useRef(false);

    useEffect(() => {
        if (!roomId || !username) return;

        const ws = new WebSocket(`${WS_URL}/ws/pair/${roomId}?username=${encodeURIComponent(username)}`);

        ws.onopen = () => {
            setStatus("Connected");
            setError(null);
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const { type, data } = message;

            switch (type) {
                case "room_state":
                    setCode(data.code);
                    setRole(data.role);
                    setMySid(data.mySid);
                    setParticipants(data.participants);
                    break;

                case "presence_update":
                    setParticipants(data.participants);
                    break;

                case "role_update":
                    setParticipants(data.participants);
                    const me = data.participants.find(p => p.sid === mySid);
                    if (me) setRole(me.role);
                    break;

                case "edit":
                    isRemoteChange.current = true;
                    setCode(data.code);
                    break;

                case "webrtc_offer":
                case "webrtc_answer":
                case "webrtc_ice":
                    setSignalingMessage({ type, data, from: message.from });
                    break;

                case "error":
                    setError(data.message);
                    setStatus("Error");
                    break;

                default:
                    console.warn("Unknown message type:", type);
            }
        };

        ws.onclose = () => {
            setStatus("Disconnected");
        };

        ws.onerror = () => {
            setStatus("Error");
            setError("Connection failed");
        };

        setSocket(ws);

        return () => ws.close();
    }, [roomId, username, mySid]);

    const sendEdit = useCallback((newCode) => {
        if (isRemoteChange.current) {
            isRemoteChange.current = false;
            return;
        }
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "edit", data: { code: newCode } }));
        }
    }, [socket]);

    const requestRoleSwitch = useCallback(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "request_role_switch" }));
        }
    }, [socket]);

    const sendSignaling = useCallback((type, data) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type, data }));
        }
    }, [socket]);

    return {
        status,
        participants,
        role,
        code,
        error,
        signalingMessage,
        sendEdit,
        requestRoleSwitch,
        sendSignaling
    };
};
