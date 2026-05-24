import React from "react";
import { CalendarDays, Sparkles, BarChart3, Clock3 } from "lucide-react";

export default function MetricPanel({ stats }) {
  const metrics = [
    { label: "总日程", value: stats?.total ?? 0, icon: CalendarDays },
    { label: "本月安排", value: stats?.month_total ?? 0, icon: Sparkles },
    { label: "有安排天数", value: stats?.scheduled_days ?? 0, icon: BarChart3 },
    { label: "历史总小时", value: stats?.all_time_hours ?? stats?.total_hours ?? 0, icon: Clock3 },
  ];

  return (
    <section className="control-panel">
      <div className="panel-title">
        <span><BarChart3 size={17} /> 指标</span>
        <small>实时统计</small>
      </div>
      <div className="metric-list">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div className="metric" key={metric.label}>
              <Icon size={18} />
              <div>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="insight-note">
        <strong>{stats?.top_category?.name || "General"}</strong>
        <span>当前最高频分类</span>
      </div>
      {stats?.busiest_day?.count > 0 && (
        <div className="insight-note">
          <strong>{stats.busiest_day.date}</strong>
          <span>最忙一天 ({stats.busiest_day.count} 项)</span>
        </div>
      )}
    </section>
  );
}
