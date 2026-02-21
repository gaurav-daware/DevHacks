"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface ContestTimerProps {
  startTime: Date;
  endTime: Date;
  onEnd?: () => void;
}

export function ContestTimer({ startTime, endTime, onEnd }: ContestTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; status: "upcoming" | "active" | "ended" }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    status: "upcoming",
  });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (now < start) {
        const diff = start.getTime() - now.getTime();
        setTimeLeft({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
          status: "upcoming",
        });
      } else if (now >= start && now <= end) {
        const diff = end.getTime() - now.getTime();
        setTimeLeft({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
          status: "active",
        });
        if (diff <= 0) {
          onEnd?.();
        }
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, status: "ended" });
        onEnd?.();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime, onEnd]);

  const formatTime = (val: number) => String(val).padStart(2, "0");

  const color =
    timeLeft.status === "upcoming"
      ? "var(--accent-blue)"
      : timeLeft.status === "active"
      ? timeLeft.hours === 0 && timeLeft.minutes < 5
        ? "var(--accent-red)"
        : "var(--accent-green)"
      : "var(--text-muted)";

  return (
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4" style={{ color }} />
      <span className="font-mono text-[16px] font-bold" style={{ color }}>
        {timeLeft.status === "upcoming" ? "Starts in: " : timeLeft.status === "active" ? "Time left: " : "Contest ended"}
        {timeLeft.status !== "ended" && (
          <>
            {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
          </>
        )}
      </span>
    </div>
  );
}
