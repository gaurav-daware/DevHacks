import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, FastForward } from "lucide-react";

export default function CodePlayback({ submission }) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCode, setCurrentCode] = useState("");
  const timerRef = useRef(null);

  const keystrokes = submission?.keystrokes || [];

  useEffect(() => {
    if (keystrokes.length === 0) return;
    setCurrentCode("");
    setCurrentIndex(0);
  }, [submission]);

  useEffect(() => {
    if (!playing || currentIndex >= keystrokes.length) {
      if (currentIndex >= keystrokes.length) setPlaying(false);
      return;
    }

    const current = keystrokes[currentIndex];
    const next = keystrokes[currentIndex + 1];

    const delay = next
      ? Math.min((next.timestamp - current.timestamp) / speed, 200)
      : 100;

    timerRef.current = setTimeout(() => {
      setCurrentCode(current.value);
      setCurrentIndex(i => i + 1);
    }, Math.max(delay, 16));

    return () => clearTimeout(timerRef.current);
  }, [playing, currentIndex, keystrokes, speed]);

  const handlePlay = () => {
    if (currentIndex >= keystrokes.length) {
      setCurrentIndex(0);
      setCurrentCode("");
    }
    setPlaying(true);
  };

  const handlePause = () => {
    setPlaying(false);
    clearTimeout(timerRef.current);
  };

  const handleReset = () => {
    handlePause();
    setCurrentIndex(0);
    setCurrentCode("");
  };

  const handleSeek = (val) => {
    handlePause();
    const idx = Math.floor((val[0] / 100) * keystrokes.length);
    setCurrentIndex(idx);
    setCurrentCode(keystrokes[idx]?.value || "");
  };

  const progress = keystrokes.length > 0
    ? Math.round((currentIndex / keystrokes.length) * 100)
    : 0;

  if (!keystrokes || keystrokes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No keystroke data available for this submission.
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="code-playback">
      {/* Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">
          {submission.language} · {keystrokes.length} keystrokes recorded
        </span>
        <span className="font-mono">
          {currentIndex}/{keystrokes.length}
        </span>
      </div>

      {/* Editor */}
      <div className="h-64 border border-[#27272a] rounded-sm overflow-hidden">
        <Editor
          height="100%"
          language={submission.language === "cpp" ? "cpp" : submission.language}
          value={currentCode || "// Playback will appear here..."}
          theme="vs-dark"
          options={{
            readOnly: true,
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            padding: { top: 8 },
            automaticLayout: true,
          }}
        />
      </div>

      {/* Progress bar */}
      <div className="px-1">
        <Slider
          value={[progress]}
          onValueChange={handleSeek}
          max={100}
          step={1}
          className="w-full"
          data-testid="playback-slider"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 w-8 p-0"
          data-testid="playback-reset"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        {playing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePause}
            className="h-8 w-8 p-0"
            data-testid="playback-pause"
          >
            <Pause className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handlePlay}
            className="h-8 px-3 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="playback-play"
          >
            <Play className="w-3.5 h-3.5" />
            {currentIndex === 0 ? "Play" : "Resume"}
          </Button>
        )}

        {/* Speed selector */}
        <div className="flex items-center gap-1 ml-2">
          <FastForward className="w-3.5 h-3.5 text-muted-foreground" />
          {[1, 2, 4, 8].map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`text-xs px-2 py-0.5 rounded-sm transition-colors ${
                speed === s
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`speed-${s}x`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
