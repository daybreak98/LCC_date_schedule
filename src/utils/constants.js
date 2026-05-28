export const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minute}`;
});

export const DAILY_QUOTES = [
  "Keep your face always toward the sunshine.",
  "Small steps still shape a meaningful day.",
  "把今天过好，明天自然会来。",
  "Calm plans make brave lives.",
  "生活自有节奏，不必事事追赶。",
  "A gentle routine can carry bold dreams.",
  "认真生活的人，连平凡都闪光。",
  "Make room for work, wonder, and rest.",
  "今日宜专注，也宜热爱。",
  "Discipline turns hope into something visible.",
  "慢一点，反而更接近自己。",
  "A clear hour is worth a hurried day.",
];

export const CATEGORY_COLORS = [
  "#0f766e",
  "#b45309",
  "#2563eb",
  "#be123c",
  "#6d28d9",
  "#4d7c0f",
  "#0369a1",
];

export const CATEGORY_PRESETS = [
  "工作", "学习", "健康", "社交", "娱乐", "休息", "家务", "通勤", "个人", "会议",
];

export const DEFAULT_CATEGORY_TREE = {
  "健身": ["羽毛球", "游泳", "跑步", "力量训练", "瑜伽"],
  "工作": ["会议", "深度工作", "项目推进", "复盘"],
  "学习": ["英语", "阅读", "课程", "练习"],
  "生活": ["家务", "采购", "通勤", "整理"],
  "休闲": ["朋友聚会", "电影", "旅行", "散步"],
};

export const IMPORT_FORMAT_SPEC = {
  title: { type: "string", required: true, maxLength: 160, description: "事件标题" },
  date: { type: "string", required: true, pattern: "YYYY-MM-DD", description: "日期" },
  start: { type: "string", required: false, pattern: "HH:MM", description: "开始时间(24小时制)" },
  end: { type: "string", required: false, pattern: "HH:MM", description: "结束时间(24小时制)" },
  category: { type: "string", required: false, maxLength: 80, description: "分类" },
  location: { type: "string", required: false, maxLength: 160, description: "地点" },
  description: { type: "string", required: false, maxLength: 2000, description: "备注" },
};
