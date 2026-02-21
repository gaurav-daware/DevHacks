"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, Sparkles, Lightbulb, AlertCircle, CornerDownRight } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatProps {
  problemDescription: string;
  code: string;
  errorOutput: string;
  language: string;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  { icon: Lightbulb, label: "Give me a hint" },
  { icon: AlertCircle, label: "What's wrong?" },
  { icon: CornerDownRight, label: "Edge cases?" },
];

export function AIChat({ problemDescription, code, errorOutput, language, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 I'm your Socratic Mentor. I guide you to the answer — I won't just hand it over.\n\nI can see your code and any errors. What would you like help with?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (userMsg?: string) => {
    const text = userMsg || input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code, errorOutput, problemDescription, language,
          conversation: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.hint || data.message || "Let me think about that..." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection issue. Try tracing through your code manually with the first example input." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div
      className="flex flex-col animate-fade-in"
      style={{
        height: 300,
        background: "var(--bg-void)",
        borderTop: "1px solid var(--border-default)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-raised)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "var(--accent-blue-dim)" }}
          >
            <Bot className="w-3.5 h-3.5" style={{ color: "var(--accent-blue)" }} />
          </div>
          <span className="text-[12px] font-semibold" style={{ color: "var(--accent-blue)" }}>
            AI Socratic Mentor
          </span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-bold"
            style={{ background: "var(--accent-purple-dim)", color: "var(--accent-purple)" }}
          >
            No spoilers
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded transition-colors hover:bg-[var(--bg-overlay)]"
          style={{ color: "var(--text-muted)" }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-[12.5px] leading-relaxed rounded-lg p-3 animate-fade-in ${
              m.role === "assistant" ? "" : "ml-4"
            }`}
            style={{
              background: m.role === "assistant" ? "var(--bg-raised)" : "var(--bg-overlay)",
              border: `1px solid ${m.role === "assistant" ? "var(--border-subtle)" : "var(--border-default)"}`,
              borderLeft: m.role === "assistant"
                ? "3px solid var(--accent-blue)"
                : "3px solid var(--accent-green)",
            }}
          >
            <span
              className="text-[10px] font-bold block mb-1.5 uppercase tracking-wider"
              style={{ color: m.role === "assistant" ? "var(--accent-blue)" : "var(--accent-green)" }}
            >
              {m.role === "assistant" ? "🤖 Mentor" : "You"}
            </span>
            <span className="whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{m.content}</span>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-[12px] py-1 px-3" style={{ color: "var(--text-muted)" }}>
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--accent-blue)" }} />
            <span>Thinking...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length === 1 && (
        <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.label}
              onClick={() => sendMessage(p.label)}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg transition-all"
              style={{
                background: "var(--accent-blue-dim)",
                color: "var(--accent-blue)",
                border: "1px solid rgba(79,142,247,0.25)",
              }}
            >
              <p.icon className="w-3 h-3" />
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className="flex gap-2 p-2.5 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask a question..."
          className="flex-1 rounded-lg px-3 py-2 text-[12px] transition-all outline-none"
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent-blue)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border-default)")}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="p-2 rounded-lg transition-all disabled:opacity-40"
          style={{ background: "var(--accent-blue)", color: "#fff" }}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
