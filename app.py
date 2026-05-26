from __future__ import annotations

import json
import re
import sqlite3
from datetime import date, datetime, timedelta
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse
from xml.etree import ElementTree
import os


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DIST_DIR = BASE_DIR / "dist"
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "schedule.db"

HOST = os.environ.get("SCHEDULE_HOST", "127.0.0.1")
PORT = int(os.environ.get("SCHEDULE_PORT", "8000"))
ALLOWED_ORIGIN = os.environ.get("SCHEDULE_ALLOWED_ORIGIN", "*")


def init_db() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                event_date TEXT NOT NULL,
                start_time TEXT NOT NULL DEFAULT '',
                end_time TEXT NOT NULL DEFAULT '',
                category TEXT NOT NULL DEFAULT 'General',
                location TEXT NOT NULL DEFAULT '',
                description TEXT NOT NULL DEFAULT '',
                source TEXT NOT NULL DEFAULT 'manual',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date)")
        conn.commit()


def web_root() -> Path:
    return DIST_DIR if (DIST_DIR / "index.html").exists() else STATIC_DIR


def db_rows(query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(query, params).fetchall()
    return [dict(row) for row in rows]


def db_execute(query: str, params: tuple[Any, ...] = ()) -> int:
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute(query, params)
        conn.commit()
        return int(cursor.lastrowid)


def normalize_date(value: Any) -> str | None:
    if not value:
        return None
    text = str(value).strip()
    if not text:
        return None
    for pattern in ("%Y-%m-%d", "%Y/%m/%d", "%Y.%m.%d", "%Y%m%d"):
        try:
            return datetime.strptime(text[:10] if pattern != "%Y%m%d" else text[:8], pattern).date().isoformat()
        except ValueError:
            pass
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).date().isoformat()
    except ValueError:
        return None


def normalize_time(value: Any) -> str:
    if not value:
        return ""
    text = str(value).strip()
    match = re.search(r"(\d{1,2}):(\d{2})", text)
    if not match:
        return ""
    hour = max(0, min(23, int(match.group(1))))
    minute = max(0, min(59, int(match.group(2))))
    return f"{hour:02d}:{minute:02d}"


def duration_minutes(event: dict[str, Any]) -> int:
    start = normalize_time(event.get("start_time"))
    end = normalize_time(event.get("end_time"))
    if not start or not end:
        return 0
    start_dt = datetime.strptime(start, "%H:%M")
    end_dt = datetime.strptime(end, "%H:%M")
    if end_dt <= start_dt:
        return 0
    return int((end_dt - start_dt).total_seconds() // 60)


def clean_event(raw: dict[str, Any], source: str = "manual") -> dict[str, Any] | None:
    date_value = raw.get("event_date") or raw.get("date") or raw.get("day")
    event_date = normalize_date(date_value)
    if not event_date:
        return None

    title = str(raw.get("title") or raw.get("name") or raw.get("event") or "Untitled event").strip()
    if not title:
        title = "Untitled event"

    start_time = normalize_time(raw.get("start_time") or raw.get("start") or raw.get("from") or raw.get("time"))
    end_time = normalize_time(raw.get("end_time") or raw.get("end") or raw.get("to"))

    return {
        "title": title[:160],
        "event_date": event_date,
        "start_time": start_time,
        "end_time": end_time,
        "category": str(raw.get("category") or raw.get("type") or "General").strip()[:80] or "General",
        "location": str(raw.get("location") or raw.get("place") or "").strip()[:160],
        "description": str(raw.get("description") or raw.get("notes") or raw.get("detail") or "").strip()[:2000],
        "source": source,
    }


def insert_event(event: dict[str, Any]) -> dict[str, Any]:
    event_id = db_execute(
        """
        INSERT INTO events
            (title, event_date, start_time, end_time, category, location, description, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            event["title"],
            event["event_date"],
            event["start_time"],
            event["end_time"],
            event["category"],
            event["location"],
            event["description"],
            event["source"],
        ),
    )
    event["id"] = event_id
    return event


def parse_json_events(content: str) -> list[dict[str, Any]]:
    payload = json.loads(content)
    if isinstance(payload, dict):
        payload = payload.get("events") or payload.get("schedule") or [payload]
    if not isinstance(payload, list):
        raise ValueError("JSON must be an event object, an array, or contain an events array.")
    return [event for item in payload if isinstance(item, dict) for event in [clean_event(item, "json")] if event]


def parse_xml_events(content: str) -> list[dict[str, Any]]:
    root = ElementTree.fromstring(content)
    nodes = root.findall(".//event")
    if root.tag.lower() == "event":
        nodes = [root]
    events = []
    for node in nodes:
        raw = {child.tag.lower().replace("-", "_"): (child.text or "").strip() for child in node}
        raw.update(node.attrib)
        event = clean_event(raw, "xml")
        if event:
            events.append(event)
    return events


DATE_HEADING_RE = re.compile(r"^\s{0,3}#{1,6}\s*(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\s*$")
INLINE_DATE_RE = re.compile(r"(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})")
TIME_RANGE_RE = re.compile(r"(?:(\d{1,2}:\d{2})\s*(?:-|~|to|至|到)\s*)?(\d{1,2}:\d{2})?")


def parse_markdown_events(content: str) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    current_date: str | None = None
    for line in content.splitlines():
        heading = DATE_HEADING_RE.match(line)
        if heading:
            current_date = normalize_date(heading.group(1))
            continue

        stripped = line.strip()
        if not stripped or not re.match(r"^[-*+]\s+|\d+\.\s+", stripped):
            continue

        date_match = INLINE_DATE_RE.search(stripped)
        event_date = normalize_date(date_match.group(1)) if date_match else current_date
        if not event_date:
            continue

        text = re.sub(r"^[-*+]\s+|\d+\.\s+", "", stripped).strip()
        text = INLINE_DATE_RE.sub("", text, count=1).strip(" -|")

        start_time = ""
        end_time = ""
        time_match = re.search(r"(\d{1,2}:\d{2})(?:\s*(?:-|~|to|至|到)\s*(\d{1,2}:\d{2}))?", text)
        if time_match:
            start_time = normalize_time(time_match.group(1))
            end_time = normalize_time(time_match.group(2))
            text = text.replace(time_match.group(0), "", 1).strip(" -|")

        parts = [part.strip() for part in re.split(r"\s*\|\s*", text) if part.strip()]
        raw = {
            "date": event_date,
            "title": parts[0] if parts else "Markdown event",
            "start": start_time,
            "end": end_time,
            "category": parts[1] if len(parts) > 1 else "Imported",
            "description": parts[2] if len(parts) > 2 else "",
        }
        event = clean_event(raw, "markdown")
        if event:
            events.append(event)
    return events


def parse_import(filename: str, content: str) -> list[dict[str, Any]]:
    suffix = Path(filename).suffix.lower()
    if suffix == ".json":
        return parse_json_events(content)
    if suffix == ".xml":
        return parse_xml_events(content)
    if suffix in {".md", ".markdown"}:
        return parse_markdown_events(content)
    raise ValueError("Only .md, .json, and .xml files are supported.")


def compute_stats() -> dict[str, Any]:
    events = db_rows("SELECT * FROM events ORDER BY event_date, start_time")
    today = date.today()
    month_start = today.replace(day=1)
    next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
    month_events = [event for event in events if month_start.isoformat() <= event["event_date"] < next_month.isoformat()]

    by_day: dict[str, int] = {}
    by_category: dict[str, int] = {}
    by_weekday = {str(index): 0 for index in range(7)}
    total_minutes = 0
    all_time_minutes = 0
    for event in month_events:
        by_day[event["event_date"]] = by_day.get(event["event_date"], 0) + 1
        by_category[event["category"]] = by_category.get(event["category"], 0) + 1
        weekday = datetime.strptime(event["event_date"], "%Y-%m-%d").weekday()
        by_weekday[str(weekday)] += 1
        total_minutes += duration_minutes(event)

    for event in events:
        all_time_minutes += duration_minutes(event)

    busiest_day = max(by_day.items(), key=lambda item: item[1], default=("", 0))
    top_category = max(by_category.items(), key=lambda item: item[1], default=("General", 0))
    return {
        "total": len(events),
        "month_total": len(month_events),
        "scheduled_days": len(by_day),
        "busiest_day": {"date": busiest_day[0], "count": busiest_day[1]},
        "top_category": {"name": top_category[0], "count": top_category[1]},
        "total_hours": round(total_minutes / 60, 1),
        "all_time_hours": round(all_time_minutes / 60, 1),
        "by_day": by_day,
        "by_category": by_category,
        "by_weekday": by_weekday,
    }


class ScheduleHandler(BaseHTTPRequestHandler):
    server_version = "ScheduleHTTP/1.0"

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/":
            self.serve_file(web_root() / "index.html", web_root())
        elif parsed.path.startswith("/static/"):
            self.serve_file(STATIC_DIR / parsed.path.removeprefix("/static/"), STATIC_DIR)
        elif parsed.path.startswith("/assets/"):
            self.serve_file(web_root() / parsed.path.removeprefix("/"), web_root())
        elif parsed.path == "/api/events":
            self.handle_list_events(parsed.query)
        elif parsed.path == "/api/stats":
            self.send_json(compute_stats())
        else:
            self.send_error(HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/events":
            self.handle_create_event()
        elif parsed.path == "/api/import":
            self.handle_import()
        else:
            self.send_error(HTTPStatus.NOT_FOUND)

    def do_PUT(self) -> None:
        match = re.match(r"^/api/events/(\d+)$", urlparse(self.path).path)
        if not match:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        self.handle_update_event(int(match.group(1)))

    def do_DELETE(self) -> None:
        match = re.match(r"^/api/events/(\d+)$", urlparse(self.path).path)
        if not match:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.execute("DELETE FROM events WHERE id = ?", (int(match.group(1)),))
            conn.commit()
        self.send_json({"deleted": cursor.rowcount})

    def handle_list_events(self, query: str) -> None:
        params = parse_qs(query)
        start = normalize_date(params.get("start", [""])[0]) or "0001-01-01"
        end = normalize_date(params.get("end", [""])[0]) or "9999-12-31"
        limit = int(params.get("limit", [0])[0]) or 0
        offset = int(params.get("offset", [0])[0]) or 0

        query_sql = """
            SELECT *, COUNT(*) OVER() AS total_count
            FROM events
            WHERE event_date BETWEEN ? AND ?
            ORDER BY event_date, start_time, title
        """
        if limit > 0:
            query_sql += " LIMIT ? OFFSET ?"
            rows = db_rows(query_sql, (start, end, limit, offset))
        else:
            rows = db_rows(query_sql, (start, end))

        total = rows[0]["total_count"] if rows else 0
        for row in rows:
            row.pop("total_count", None)

        self.send_json({"events": rows, "total": total})

    def handle_create_event(self) -> None:
        try:
            payload = json.loads(self.read_body().decode("utf-8"))
            event = clean_event(payload, "manual")
            if not event:
                self.send_json({"error": "A valid date is required."}, HTTPStatus.BAD_REQUEST)
                return
            self.send_json({"event": insert_event(event)}, HTTPStatus.CREATED)
        except json.JSONDecodeError:
            self.send_json({"error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)

    def handle_update_event(self, event_id: int) -> None:
        try:
            payload = json.loads(self.read_body().decode("utf-8"))
            event = clean_event(payload, "manual")
            if not event:
                self.send_json({"error": "A valid date is required."}, HTTPStatus.BAD_REQUEST)
                return
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.execute(
                    """
                    UPDATE events
                    SET title = ?,
                        event_date = ?,
                        start_time = ?,
                        end_time = ?,
                        category = ?,
                        location = ?,
                        description = ?
                    WHERE id = ?
                    """,
                    (
                        event["title"],
                        event["event_date"],
                        event["start_time"],
                        event["end_time"],
                        event["category"],
                        event["location"],
                        event["description"],
                        event_id,
                    ),
                )
                conn.commit()
            if cursor.rowcount == 0:
                self.send_json({"error": "Event not found."}, HTTPStatus.NOT_FOUND)
                return
            event["id"] = event_id
            self.send_json({"event": event})
        except json.JSONDecodeError:
            self.send_json({"error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)

    def handle_import(self) -> None:
        try:
            payload = json.loads(self.read_body().decode("utf-8"))
            filename = str(payload.get("filename") or "")
            content = str(payload.get("content") or "")
            parsed_events = parse_import(filename, content)
            inserted = [insert_event(event) for event in parsed_events]
            self.send_json({"imported": len(inserted), "events": inserted}, HTTPStatus.CREATED)
        except (ValueError, ElementTree.ParseError, json.JSONDecodeError) as exc:
            self.send_json({"error": str(exc)}, HTTPStatus.BAD_REQUEST)

    def serve_file(self, path: Path, root: Path) -> None:
        try:
            resolved = path.resolve()
            resolved.relative_to(root.resolve())
        except ValueError:
            self.send_error(HTTPStatus.FORBIDDEN)
            return
        if not resolved.exists() or not resolved.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        content_type = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".svg": "image/svg+xml",
        }.get(resolved.suffix.lower(), "application/octet-stream")
        data = resolved.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def read_body(self) -> bytes:
        length = int(self.headers.get("Content-Length", "0"))
        return self.rfile.read(length)

    def send_json(self, payload: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt: str, *args: Any) -> None:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {fmt % args}")


def main() -> None:
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), ScheduleHandler)
    print(f"Schedule manager running at http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
