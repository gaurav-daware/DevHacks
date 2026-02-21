import { useState, useEffect } from "react";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Calendar, Target, TrendingUp } from "lucide-react";

export default function ActivityHeatmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHeatmap();
  }, []);

  const loadHeatmap = async () => {
    try {
      const res = await api.get("/api/users/activity-heatmap");
      setData(res.data);
    } catch (error) {
      console.error("Failed to load activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensity = (count) => {
    if (!count) return "bg-zinc-800/50";
    if (count >= 5) return "bg-primary";
    if (count >= 3) return "bg-primary/70";
    if (count >= 1) return "bg-primary/40";
    return "bg-zinc-800/50";
  };

  const generateCalendar = () => {
    const days = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364); // Go back ~1 year
    
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const weeks = [];
    let currentWeek = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const activity = data?.activity?.[dateStr];
      
      currentWeek.push({
        date: dateStr,
        count: activity?.total || 0,
        accepted: activity?.accepted || 0
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  if (loading) {
    return (
      <Card className="bg-[#0a0a0b] border-zinc-800">
        <CardContent className="p-6">
          <div className="h-32 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const weeks = generateCalendar();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <Card className="bg-[#0a0a0b] border-zinc-800" data-testid="activity-heatmap">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Activity Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-orange-400 mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-2xl font-bold">{data?.current_streak || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-2xl font-bold">{data?.max_streak || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Max Streak</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-white mb-1">
              <Target className="w-4 h-4" />
              <span className="text-2xl font-bold">{data?.total_active_days || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Active Days</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400 mb-1">{data?.total_accepted || 0}</div>
            <p className="text-xs text-muted-foreground">Accepted</p>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="inline-block">
            {/* Month labels */}
            <div className="flex mb-2 ml-8">
              {(() => {
                const monthLabels = [];
                let lastMonth = -1;
                weeks.forEach((week, i) => {
                  if (week[0]) {
                    const month = new Date(week[0].date).getMonth();
                    if (month !== lastMonth) {
                      monthLabels.push(
                        <span 
                          key={i} 
                          className="text-xs text-muted-foreground"
                          style={{ marginLeft: i === 0 ? 0 : `${(i - monthLabels.length * 4) * 14}px` }}
                        >
                          {months[month]}
                        </span>
                      );
                      lastMonth = month;
                    }
                  }
                });
                return monthLabels;
              })()}
            </div>

            <div className="flex gap-0.5">
              {/* Day labels */}
              <div className="flex flex-col gap-0.5 mr-2">
                <span className="text-xs text-muted-foreground h-3"></span>
                <span className="text-xs text-muted-foreground h-3">Mon</span>
                <span className="text-xs text-muted-foreground h-3"></span>
                <span className="text-xs text-muted-foreground h-3">Wed</span>
                <span className="text-xs text-muted-foreground h-3"></span>
                <span className="text-xs text-muted-foreground h-3">Fri</span>
                <span className="text-xs text-muted-foreground h-3"></span>
              </div>

              {/* Calendar grid */}
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-0.5">
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`w-3 h-3 rounded-sm ${getIntensity(day.count)} cursor-pointer transition-all hover:ring-1 hover:ring-white/30`}
                      title={`${day.date}: ${day.count} submissions (${day.accepted} accepted)`}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 justify-end">
              <span className="text-xs text-muted-foreground">Less</span>
              <div className="w-3 h-3 rounded-sm bg-zinc-800/50" />
              <div className="w-3 h-3 rounded-sm bg-primary/40" />
              <div className="w-3 h-3 rounded-sm bg-primary/70" />
              <div className="w-3 h-3 rounded-sm bg-primary" />
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
