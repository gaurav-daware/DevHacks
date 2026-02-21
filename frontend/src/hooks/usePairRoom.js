import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:8000";

export const usePairRoom = (roomId, username) => {
    const [socket, setSocket] = useState(null);
    const [status, setStatus] = useState("Connecting...");
    const [participants, setParticipants] = useState([]);
    const [myClientId, setMyClientId] = useState(null);
    const [role, setRole] = useState("Navigator");
    const [code, setCode] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [error, setError] = useState(null);
    const [signalingMessage, setSignalingMessage] = useState(null);

    const isRemoteChange = useRef(false);
    const reconnectAttempts = useRef(0);
    const heartbeatTimer = useRef(null);
    const socketRef = useRef(null);
    const clientIdRef = useRef(null);

    // Initialize consistent clientId per session
    if (!clientIdRef.current) {
        clientIdRef.current = "client_" + Math.random().toString(36).substring(2, 11);
    }

    const connect = useCallback(() => {
        if (!roomId || !username) return;

        // Cleanup previous if exists
        if (socketRef.current) {
            socketRef.current.close();
        }

        const ws = new WebSocket(`${WS_URL}/ws/pair/${roomId}?username=${encodeURIComponent(username)}&clientId=${clientIdRef.current}`);
        socketRef.current = ws;
        setSocket(ws);

        ws.onopen = () => {
            console.log("WS Connected");
            setStatus("Connected");
            setError(null);
            reconnectAttempts.current = 0;

            // Start Heartbeat
            heartbeatTimer.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "heartbeat" }));
                }
            }, 30000);
        };

        ws.onmessage = (event) => {
            try {
                const { type, data, from } = JSON.parse(event.data);

                switch (type) {
                    case "room_state":
                        setCode(data.code);
                        setRole(data.role);
                        setMyClientId(data.myClientId);
                        setParticipants(data.participants);
                        setChatHistory(data.chat_history || []);
                        break;

                    case "presence_update":
                        setParticipants(data.participants);
                        break;

                    case "role_updated":
                        setParticipants(data.participants);
                        const me = data.participants.find(p => p.clientId === clientIdRef.current);
                        if (me) setRole(me.role);
                        break;

                    case "editor_sync":
                        isRemoteChange.current = true;
                        setCode(data.code);
                        break;

                    case "chat_message":
                        setChatHistory(prev => [...prev.slice(-49), data]);
                        break;

                    case "webrtc_signal":
                        setSignalingMessage({ ...data, from });
                        break;

                    case "error":
                        setError(data.message);
                        setStatus("Error");
                        ws.close();
                        break;
                }
            } catch (err) {
                console.error("Failed to parse message:", err);
            }
        };

        ws.onclose = (e) => {
            clearInterval(heartbeatTimer.current);
            socketRef.current = null;
            setSocket(null);

            if (status !== "Error" && reconnectAttempts.current < 5) {
                setStatus("Reconnecting...");
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
                setTimeout(() => {
                    reconnectAttempts.current++;
                    connect();
                }, delay);
            } else if (reconnectAttempts.current >= 5) {
                setStatus("Disconnected");
                setError("Connection lost. Please refresh.");
            }
        };

        ws.onerror = () => {
            setStatus("Disconnected");
        };

        setSocket(ws);
    }, [roomId, username, status]);

    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) socketRef.current.close();
            clearInterval(heartbeatTimer.current);
        };
    }, [roomId, username]); // Removed connect and socket

    const sendMessage = useCallback((text) => {
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "chat_message", data: { text } }));
        }
    }, [socket]);

    const sendEdit = useCallback((newCode) => {
        if (isRemoteChange.current) {
            isRemoteChange.current = false;
            return;
        }
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "editor_sync", data: { code: newCode } }));
        }
    }, [socket]);

    const requestRoleSwitch = useCallback(() => {
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "request_role_switch" }));
        }
    }, [socket]);

    const sendSignaling = useCallback((signalData) => {
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: "webrtc_signal",
                data: signalData
            }));
        }
    }, [socket]);

    return {
        status,
        participants,
        role,
        code,
        chatHistory,
        error,
        signalingMessage,
        myClientId: clientIdRef.current,
        sendMessage,
        sendEdit,
        requestRoleSwitch,
        sendSignaling
    };
};
