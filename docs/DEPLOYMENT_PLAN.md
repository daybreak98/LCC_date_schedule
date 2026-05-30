# 日程管理系统 - 上线部署方案

> 仅提供方案文档，不包含具体代码实现。

---

## 一、现状分析

当前项目架构：

| 层 | 技术 | 运行方式 |
|---|------|----------|
| 前端 | React + Vite | 纯静态文件 (`dist/`) |
| 后端 | Python + SQLite | 本地 ThreadingHTTPServer |
| 通信 | REST API (`/api/*`) | Vite proxy / 同源部署 |

**核心矛盾**：Python 后端依赖本地进程和 SQLite 文件，无法在 GitHub Pages 这样的纯静态托管上运行。需要将后端替换为可在线访问的服务。

---

## 二、方案总览

| 方案 | 前端托管 | 后端 / API | 数据库 | 难度 | 月费 |
|------|---------|-----------|--------|------|------|
| A: Supabase | GitHub Pages | Supabase REST API (自动生成) | Supabase PostgreSQL | **低** | **$0** |
| B: Cloudflare | Cloudflare Pages | Workers + D1 | D1 (SQLite 兼容) | 中 | **$0** |
| C: 传统部署 | Vercel | 改用 Next.js API Routes | Vercel Postgres / Turso | 中 | $0~$5 |
| D: 混合 | GitHub Pages | Python 部署到 Railway/Render | PostgreSQL / Turso | 中 | $0~$5 |
| E: 纯前端 | GitHub Pages | 无后端 (localStorage / IndexedDB) | 浏览器本地存储 | **极低** | **$0** |

---

## 三、推荐方案详解

### 方案 A：Supabase + GitHub Pages（首选推荐）

#### 3.1 架构图

```
┌──────────────────┐     HTTPS      ┌──────────────────┐
│   GitHub Pages   │ ──────────────▶ │     Supabase     │
│  (React 静态文件) │                 │  (BaaS 平台)      │
│                  │                 │                  │
│  用户浏览器访问    │                 │  ┌─ REST API     │
│  username.io/app │                 │  ├─ PostgreSQL  │
│                  │                 │  ├─ 实时订阅     │
│                  │                 │  └─ 行级安全     │
└──────────────────┘                 └──────────────────┘
```

#### 3.2 什么是 Supabase

Supabase 是 Firebase 的开源替代品，基于 PostgreSQL。免费套餐含：
- **500MB 数据库**（约 50 万条日程足够用数年）
- **50,000 月活用户**
- **自动生成的 REST API**（无需写后端代码）
- **实时订阅**（数据变更自动推送前端）
- **行级安全策略（RLS）**

#### 3.3 需要改动的部分

**前端改动（`src/`）：**

1. **安装 Supabase JS 客户端**
   ```
   npm install @supabase/supabase-js
   ```

2. **替换 `src/utils/api.js`**：不再调用 `fetch("/api/events")`，改为调用 Supabase SDK
   ```js
   // 原来
   const resp = await fetch("/api/events?start=...&end=...");

   // 改为
   const { data } = await supabase
     .from("events")
     .select("*")
     .gte("event_date", start)
     .lte("event_date", end);
   ```

3. **移除 Python 后端**：`app.py` 不再需要，删除或归档

4. **无需修改组件**：`useEvents.js`、`useStats.js` 等 hook 的接口保持不变，只改内部实现

**数据库改动：**

4. **建表 SQL**（在 Supabase 控制台执行一次）：
   ```sql
   CREATE TABLE events (
     id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     title TEXT NOT NULL,
     event_date DATE NOT NULL,
     start_time TEXT DEFAULT '',
     end_time TEXT DEFAULT '',
     category TEXT DEFAULT 'General',
     location TEXT DEFAULT '',
     description TEXT DEFAULT '',
     source TEXT DEFAULT 'manual',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   CREATE INDEX idx_events_date ON events(event_date);
   ```

5. **行级安全策略**（可选，建议开启以实现多用户）：
   ```sql
   ALTER TABLE events ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "user_own_events" ON events
     USING (auth.uid() = user_id);
   ```

**部署：**

6. **GitHub Pages 部署**：在 GitHub 仓库 Settings → Pages 中，选择 `gh-pages` 分支或 GitHub Actions 自动部署 `dist/` 目录

7. **环境变量**：在 `.env` 中配置 Supabase URL 和 anon key（Vite 的 `VITE_` 前缀变量会自动注入）

#### 3.4 优势

- 后端代码量几乎为零（自动 REST API）
- 免费额度完全够个人使用
- 有 webhook、实时订阅等高级功能
- 管理后台可以直接查看/编辑数据
- 自带认证系统（如需多用户）

#### 3.5 劣势

- Supabase 服务器在海外，国内访问延迟约 200-500ms（可接受）
- 从国内访问 Supabase 控制台偶尔不稳定
- SQLite 语法需略微适配 PostgreSQL

---

### 方案 B：Cloudflare Pages + Workers + D1

#### 优势

- Cloudflare 在国内有节点，访问速度较快
- Workers 边缘函数，无冷启动
- D1 是 SQLite 兼容，迁移成本最低
- 全栈免费

#### 劣势

- Workers 有代码复杂度（需写 Worker 脚本处理 API）
- D1 目前仅支持 HTTP API 或 Worker 绑定，不支持直连
- 调试体验不如 Supabase

---

### 方案 C：Next.js 迁移 + Vercel 部署

#### 优势

- 前端后端统一框架，全栈项目
- Vercel 自动部署，与 GitHub 深度集成
- Vercel Postgres 或 Turso 免费额度充足

#### 劣势

- **需要将整个 React 项目迁移到 Next.js**（改动极大）
- Vercel 在国内有时被墙，需绑定自定义域名
- 学习成本最高

---

### 方案 E：纯前端（无后端）

如果只是个人单机使用，可完全去掉后端：

- 使用 `localStorage` + JSON 存储
- 或使用 IndexedDB（Dexie.js 封装）
- 数据完全在本地浏览器
- **缺点**：换设备/浏览器数据丢失，无法多端同步

---

## 四、方案对比矩阵

| 维度 | Supabase | Cloudflare | Next.js+Vercel | 纯前端 |
|------|----------|-----------|---------------|--------|
| 改造成本 | 低（换 API 层） | 中（写 Worker） | 极高（迁移框架） | 低 |
| 数据库 | PostgreSQL | D1(SQLite) | 任选 | 无 |
| 多端同步 | 原生支持 | 需开发 | 需开发 | 不支持 |
| 国内访问 | 一般 | **较好** | 较差 | 无关 |
| 免费额度 | ✅ 充足 | ✅ 充足 | ✅ 充足 | ✅ 无限 |
| 认证/多用户 | 内置 | 需开发 | 需开发 | 不支持 |
| 实时推送 | **内置** | 需开发 | 需开发 | 不支持 |

---

## 五、推荐路径

### 个人使用，轻量优先 → 方案 A（Supabase + GitHub Pages）

**改造量估算（约 4-6 小时）：**

```
1. 注册 Supabase，创建项目，执行建表 SQL          (30min)
2. npm install @supabase/supabase-js             (2min)
3. 重写 src/utils/api.js 为 supabase client      (1h)
4. 重写 useEvents.js / useStats.js hooks         (1h)
5. 移除 app.py 及相关引用                         (10min)
6. 添加 .env 环境变量 (VITE_SUPABASE_URL 等)      (5min)
7. 配置 GitHub Pages 部署                        (30min)
8. 测试 + 修复边界情况                            (1h)
```

### 多人协作，需要更快国内访问 → 方案 B（Cloudflare）

### 未来考虑扩展成完整 SaaS → 方案 C（Next.js）

---

## 六、数据迁移

现有 SQLite 数据可导出导入到 Supabase：

1. **导出 SQLite 数据**：
   ```bash
   sqlite3 data/schedule.db .dump > backup.sql
   ```

2. **格式转换**（SQLite → PostgreSQL 差异）：
   - `AUTOINCREMENT` → `GENERATED ALWAYS AS IDENTITY`
   - `TEXT` 日期 → `DATE` 类型
   - 移除 SQLite 特有的 `PRAGMA` 语句

3. **导入 Supabase**：在 SQL Editor 中执行转换后的 SQL

---

## 七、费用预估

| 项目 | 免费额度 | 超出后 |
|------|---------|--------|
| GitHub Pages | 100GB 带宽/月 | 极少超出 |
| Supabase | 500MB DB, 50K MAU, 2GB 带宽 | $25/月起 |
| 自定义域名 | 需购买 (约 ¥50/年) | - |

**结论：个人使用完全免费。**

---

## 八、注意事项

1. **前端 API key 是公开的**：Supabase 的 `anon` key 会暴露在前端代码中，这是设计如此。数据安全依赖 RLS（行级安全策略），务必配置。
2. **Vite 环境变量**：`VITE_` 前缀的变量才会暴露给前端，不要放 `service_role` key。
3. **国内访问 GitHub Pages**：有时较慢，可考虑用 Vercel 或 Cloudflare Pages 托管前端，或绑定自定义域名并开启 CDN。
4. **Supabase 暂停策略**：免费项目连续 7 天无活动会暂停，但数据保留，访问时自动恢复。
5. **保持现有本地版本**：建议保留 `app.py` 作为离线备用，前端通过环境变量切换 API 端点。
