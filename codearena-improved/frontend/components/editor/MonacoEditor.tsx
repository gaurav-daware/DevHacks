"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const LANGUAGE_MAP: Record<string, string> = {
  python: "python",
  cpp: "cpp",
  java: "java",
  javascript: "javascript",
};

interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language: string;
  readOnly?: boolean;
  height?: string;
}

export function MonacoEditor({ value, onChange, language, readOnly = false, height = "100%" }: MonacoEditorProps) {
  const editorRef = useRef<any>(null);

  return (
    <div className="flex-1 overflow-hidden min-h-0" style={{ height: height === "100%" ? undefined : height }}>
      <Editor
        height={height}
        language={LANGUAGE_MAP[language] || language}
        value={value}
        onChange={onChange}
        theme="vs-dark"
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontLigatures: true,
          lineHeight: 1.6,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          readOnly,
          padding: { top: 16, bottom: 16 },
          cursorBlinking: "blink",
          wordWrap: "on",
          bracketPairColorization: { enabled: true },
          smoothScrolling: true,
          contextmenu: true,
          suggestOnTriggerCharacters: true,
          tabSize: 2,
          automaticLayout: true,
          renderLineHighlight: "line",
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
        }}
        onMount={(editor) => {
          editorRef.current = editor;
          editor.getModel()?.updateOptions({ tabSize: 2 });
        }}
      />
    </div>
  );
}
