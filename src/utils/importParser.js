/**
 * 前端文件导入解析器
 * 从 app.py 的解析逻辑迁移而来，支持 JSON / XML / Markdown
 */

export function parseImportFile(filename, content) {
  const suffix = filename.toLowerCase().split(".").pop();
  if (suffix === "json") return parseJSON(content);
  if (suffix === "xml") return parseXML(content);
  if (suffix === "md" || suffix === "markdown") return parseMarkdown(content);
  throw new Error("仅支持 .md、.json、.xml 文件");
}

function normalizeDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;

  const patterns = [
    { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})/, get: (m) => `${m[1]}-${pad(m[2])}-${pad(m[3])}` },
    { regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})/, get: (m) => `${m[1]}-${pad(m[2])}-${pad(m[3])}` },
    { regex: /^(\d{4})\.(\d{1,2})\.(\d{1,2})/, get: (m) => `${m[1]}-${pad(m[2])}-${pad(m[3])}` },
    { regex: /^(\d{4})(\d{2})(\d{2})$/, get: (m) => `${m[1]}-${m[2]}-${m[3]}` },
  ];

  for (const p of patterns) {
    const m = text.match(p.regex);
    if (m) return p.get(m);
  }

  try {
    const d = new Date(text.replace("Z", "+00:00"));
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
  } catch {}

  return null;
}

function normalizeTime(value) {
  if (!value) return "";
  const text = String(value).trim();
  const match = text.match(/(\d{1,2}):(\d{2})/);
  if (!match) return "";
  const hour = Math.max(0, Math.min(23, parseInt(match[1])));
  const minute = Math.max(0, Math.min(59, parseInt(match[2])));
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function pad(v) {
  return String(v).padStart(2, "0");
}

function cleanEvent(raw, source = "manual") {
  const dateValue = raw.event_date || raw.date || raw.day;
  const eventDate = normalizeDate(dateValue);
  if (!eventDate) return null;

  const title = (raw.title || raw.name || raw.event || "Untitled event").trim().slice(0, 160) || "Untitled event";
  const startTime = normalizeTime(raw.start_time || raw.start || raw.from || raw.time);
  const endTime = normalizeTime(raw.end_time || raw.end || raw.to);

  return {
    title,
    event_date: eventDate,
    start_time: startTime,
    end_time: endTime,
    category: (raw.category || raw.type || "General").trim().slice(0, 80) || "General",
    location: (raw.location || raw.place || "").trim().slice(0, 160),
    description: (raw.description || raw.notes || raw.detail || "").trim().slice(0, 2000),
    source,
  };
}

function parseJSON(content) {
  let payload;
  try {
    payload = JSON.parse(content);
  } catch {
    throw new Error("无效的 JSON 格式");
  }
  if (!Array.isArray(payload)) {
    payload = payload?.events || payload?.schedule || [payload];
  }
  if (!Array.isArray(payload)) {
    throw new Error("JSON 必须是数组或包含 events/schedule 字段的对象");
  }
  return payload.map((item) => cleanEvent(item, "json")).filter(Boolean);
}

function parseXML(content) {
  let doc;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(content, "application/xml");
    if (doc.querySelector("parsererror")) {
      throw new Error("XML 解析错误");
    }
  } catch {
    throw new Error("无效的 XML 格式");
  }

  let nodes = Array.from(doc.querySelectorAll("event"));
  if (nodes.length === 0 && doc.documentElement?.tagName?.toLowerCase() === "event") {
    nodes = [doc.documentElement];
  }

  return nodes
    .map((node) => {
      const raw = {};
      for (const attr of node.attributes || []) {
        raw[attr.name.toLowerCase().replace(/-/g, "_")] = attr.value;
      }
      for (const child of node.children || []) {
        raw[child.tagName.toLowerCase().replace(/-/g, "_")] = child.textContent?.trim() || "";
      }
      return cleanEvent(raw, "xml");
    })
    .filter(Boolean);
}

const DATE_HEADING_RE = /^\s{0,3}#{1,6}\s*(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\s*$/;
const INLINE_DATE_RE = /(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/;

function parseMarkdown(content) {
  const events = [];
  let currentDate = null;
  for (const line of content.split("\n")) {
    const heading = line.match(DATE_HEADING_RE);
    if (heading) {
      currentDate = normalizeDate(heading[1]);
      continue;
    }

    const stripped = line.trim();
    if (!stripped || !/^[-*+]\s+|\d+\.\s+/.test(stripped)) continue;

    const dateMatch = stripped.match(INLINE_DATE_RE);
    const eventDate = dateMatch ? normalizeDate(dateMatch[1]) : currentDate;
    if (!eventDate) continue;

    let text = stripped.replace(/^[-*+]\s+|\d+\.\s+/, "").trim();
    text = text.replace(INLINE_DATE_RE, "").trim().replace(/^[-| ]+/, "");

    let startTime = "";
    let endTime = "";
    const timeMatch = text.match(/(\d{1,2}:\d{2})(?:\s*(?:-|~|to|至|到)\s*(\d{1,2}:\d{2}))?/);
    if (timeMatch) {
      startTime = normalizeTime(timeMatch[1]);
      endTime = normalizeTime(timeMatch[2]);
      text = text.replace(timeMatch[0], "").trim().replace(/^[-| ]+/, "");
    }

    const parts = text.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
    const raw = {
      date: eventDate,
      title: parts[0] || "Markdown event",
      start: startTime,
      end: endTime,
      category: parts[1] || "Imported",
      description: parts[2] || "",
    };
    const event = cleanEvent(raw, "markdown");
    if (event) events.push(event);
  }
  return events;
}
