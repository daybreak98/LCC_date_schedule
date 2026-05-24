import React from "react";
import { Clock3, TrendingUp, BarChart3 } from "lucide-react";
import { CATEGORY_COLORS, WEEKDAYS } from "../utils/constants.js";

export default function WeeklyCategoryPanel({ weeklyStats, weekdayDist, trendData }) {
  if (!weeklyStats || weeklyStats.length === 0) {
    return (
      <section className="weekly-panel">
        <div className="panel-title">
          <span><Clock3 size={17} /> 时间分析</span>
          <small>添加日程后显示</small>
        </div>
        <p className="weekly-empty">本月还没有记录时间数据。</p>
      </section>
    );
  }

  return (
    <section className="weekly-panel">
      <div className="panel-title">
        <span><Clock3 size={17} /> 每周时间类目分类</span>
        <small>按当前月份统计</small>
      </div>

      <div className="weekly-list">
        {weeklyStats.map((week, weekIndex) => (
          <article className="weekly-card" key={week.label}>
            <div className="weekly-card-head">
              <div>
                <strong>{week.label}</strong>
                <span>{(week.totalMinutes / 60).toFixed(1)} 小时</span>
              </div>
            </div>
            {week.categoryList.length === 0 && <p className="weekly-empty">这一周还没有记录时间类目。</p>}
            {week.categoryList.length > 0 && (
              <div className="weekly-bars">
                {week.categoryList.map((category, categoryIndex) => {
                  const width = week.totalMinutes ? (category.minutes / week.totalMinutes) * 100 : 0;
                  return (
                    <div className="weekly-row" key={`${week.label}-${category.name}`}>
                      <div className="weekly-label">
                        <i style={{ background: CATEGORY_COLORS[(weekIndex + categoryIndex) % CATEGORY_COLORS.length] }} />
                        <span>{category.name}</span>
                      </div>
                      <div className="weekly-track">
                        <span
                          className="weekly-fill"
                          style={{
                            width: `${Math.max(width, 10)}%`,
                            background: CATEGORY_COLORS[(weekIndex + categoryIndex) % CATEGORY_COLORS.length],
                          }}
                        />
                      </div>
                      <strong>{category.hours}h</strong>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        ))}
      </div>

      {weekdayDist && (
        <div className="weekday-dist-section">
          <div className="panel-title" style={{ marginTop: 14 }}>
            <span><BarChart3 size={17} /> 星期时间分布</span>
            <small>分钟</small>
          </div>
          <div className="weekday-dist">
            {weekdayDist.map((mins, i) => {
              const max = Math.max(1, ...weekdayDist);
              const pct = (mins / max) * 100;
              return (
                <div className="wd-bar" key={i}>
                  <div className="wd-fill" style={{ height: `${Math.max(pct, 4)}%` }} />
                  <span>{WEEKDAYS[i]}</span>
                  <small>{Math.round(mins / 60 * 10) / 10}h</small>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
