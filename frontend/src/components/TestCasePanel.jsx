import { useState } from "react";
import {
    CheckCircle2, XCircle, Loader2, Clock, ChevronUp, ChevronDown
} from "lucide-react";

const STATUS_STYLES = {
    passed: "text-green-400 bg-green-400/10 border-green-400/30",
    failed: "text-red-400 bg-red-400/10 border-red-400/30",
    error: "text-orange-400 bg-orange-400/10 border-orange-400/30",
};

export default function TestCasePanel({
    testCases = [],
    runResults = [],
    running = false,
    collapsed = false,
    onToggle,
    onTestCaseInputChange,
}) {
    const [activeTab, setActiveTab] = useState(0);

    if (!testCases.length) return null;

    const activeTC = testCases[activeTab];
    const activeResult = runResults[activeTab];

    const getTabStatus = (idx) => {
        if (running) return "running";
        const r = runResults[idx];
        if (!r) return "idle";
        if (r.passed) return "passed";
        return "failed";
    };

    const getStatusIcon = (status) => {
        if (status === "running") return <Loader2 className="w-3 h-3 animate-spin text-primary" />;
        if (status === "passed") return <CheckCircle2 className="w-3 h-3 text-green-400" />;
        if (status === "failed") return <XCircle className="w-3 h-3 text-red-400" />;
        return null;
    };

    return (
        <div className="border-t border-[#27272a] bg-[#09090b] flex flex-col" data-testid="test-case-panel">
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-[#121215] transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                        Test Cases
                    </span>
                    {runResults.length > 0 && !running && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${runResults.every(r => r?.passed)
                                ? STATUS_STYLES.passed
                                : STATUS_STYLES.failed
                            }`}>
                            {runResults.filter(r => r?.passed).length}/{runResults.length} Passed
                        </span>
                    )}
                    {running && (
                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Running...
                        </span>
                    )}
                </div>
                {collapsed ? (
                    <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                )}
            </div>

            {!collapsed && (
                <div className="px-3 pb-3">
                    {/* Tabs */}
                    <div className="flex gap-1 mb-3">
                        {testCases.map((_, idx) => {
                            const status = getTabStatus(idx);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setActiveTab(idx)}
                                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm border transition-all ${activeTab === idx
                                            ? "border-primary/50 bg-primary/10 text-primary"
                                            : "border-[#27272a] text-muted-foreground hover:border-[#3f3f46] hover:text-foreground"
                                        }`}
                                    data-testid={`test-tab-${idx}`}
                                >
                                    {getStatusIcon(status)}
                                    Case {idx + 1}
                                </button>
                            );
                        })}
                    </div>

                    {/* Active test case content */}
                    {activeTC && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Input */}
                            <div>
                                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">
                                    Input
                                </label>
                                <textarea
                                    className="w-full bg-[#121215] border border-[#27272a] rounded-sm px-2.5 py-2 text-xs font-mono text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 min-h-[72px]"
                                    value={activeTC.input}
                                    onChange={(e) =>
                                        onTestCaseInputChange?.(activeTab, e.target.value)
                                    }
                                    rows={3}
                                    data-testid={`test-input-${activeTab}`}
                                />
                            </div>

                            {/* Expected Output */}
                            <div>
                                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">
                                    Expected Output
                                </label>
                                <div
                                    className="w-full bg-[#121215] border border-[#27272a] rounded-sm px-2.5 py-2 text-xs font-mono text-foreground min-h-[72px] whitespace-pre-wrap"
                                    data-testid={`test-expected-${activeTab}`}
                                >
                                    {activeTC.output}
                                </div>
                            </div>

                            {/* Actual Output */}
                            <div>
                                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    Actual Output
                                    {activeResult && (
                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${activeResult.passed ? STATUS_STYLES.passed : STATUS_STYLES.failed
                                            }`}>
                                            {activeResult.passed ? "Passed" : activeResult.verdict || "Failed"}
                                        </span>
                                    )}
                                </label>
                                <div
                                    className={`w-full border rounded-sm px-2.5 py-2 text-xs font-mono min-h-[72px] whitespace-pre-wrap ${activeResult
                                            ? activeResult.passed
                                                ? "bg-green-400/5 border-green-400/20 text-green-300"
                                                : "bg-red-400/5 border-red-400/20 text-red-300"
                                            : "bg-[#121215] border-[#27272a] text-muted-foreground"
                                        }`}
                                    data-testid={`test-actual-${activeTab}`}
                                >
                                    {running ? (
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Executing...
                                        </span>
                                    ) : activeResult ? (
                                        activeResult.output || <span className="text-muted-foreground italic">No output</span>
                                    ) : (
                                        <span className="text-muted-foreground italic">Click "Run Code" to see output</span>
                                    )}
                                </div>
                                {activeResult?.time > 0 && (
                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground font-mono">
                                        <Clock className="w-3 h-3" />
                                        {activeResult.time.toFixed(3)}s
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
