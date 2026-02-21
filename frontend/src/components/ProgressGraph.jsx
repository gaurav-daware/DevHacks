import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/services/api";

export default function ProgressGraph() {
    const [data, setData] = useState(null);

    useEffect(() => {
        async function loadProgress() {
            try {
                const res = await api.get("/users/progress");
                setData(res.data);
            } catch (e) {
                // Silent fail or toast
            }
        }
        loadProgress();
    }, []);

    if (!data) return <div className="h-64 flex items-center justify-center animate-pulse bg-zinc-900/50 rounded-lg mb-6" />;

    return (
        <Card className="bg-[#0a0a0b] border-zinc-800 p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-zinc-800/50 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Track Your Progress</h2>
                    <p className="text-sm text-zinc-400">Showing Daily Rank/Score for the last 30 days</p>
                </div>
                <div className="flex items-center gap-8 bg-zinc-900/50 px-6 py-4 rounded-xl border border-zinc-800/50">
                    <div className="text-center md:text-left border-zinc-800 pr-8 relative after:bg-zinc-800 after:w-px after:h-full after:absolute after:right-0 after:top-0">
                        <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1 font-medium">Overall Rank <span className="text-[10px] w-3 h-3 rounded-full border border-zinc-600 inline-flex items-center justify-center">i</span></p>
                        <p className="text-3xl font-bold text-white">{data.overall_rank.toLocaleString()}</p>
                    </div>
                    <div className="text-center md:text-left pl-2">
                        <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1 font-medium">Overall Score <span className="text-[10px] w-3 h-3 rounded-full border border-zinc-600 inline-flex items-center justify-center">i</span></p>
                        <p className="text-3xl font-bold text-white">{data.overall_score.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="h-[250px] w-full pl-0 ml-[-15px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.history} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#71717a", fontSize: 11 }}
                            dy={15}
                            minTickGap={30}
                        />
                        <YAxis
                            yAxisId="left"
                            dataKey="rank"
                            reversed={true} // Let smaller ranks be vertically higher
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#71717a", fontSize: 11 }}
                            dx={-15}
                            domain={['auto', 'auto']}
                            tickCount={5}
                        />
                        <Tooltip
                            cursor={{ stroke: '#27272a', strokeWidth: 1 }}
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                            labelStyle={{ color: '#a1a1aa', marginBottom: '8px', fontSize: '12px' }}
                            itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                            formatter={(value, name) => {
                                if (name === 'rank') return [<span className="text-rose-500">{value}</span>, 'Rank'];
                                return [value, 'Score'];
                            }}
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="rank"
                            stroke="#f43f5e"
                            strokeWidth={3}
                            dot={{ fill: "#f43f5e", stroke: "#0a0a0b", strokeWidth: 2, r: 5 }}
                            activeDot={{ r: 7, fill: "#f43f5e", stroke: '#fff', strokeWidth: 2 }}
                            isAnimationActive={true}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
