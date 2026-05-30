# 日程管理系统 - 部署与使用指南

> 基于 Supabase + GitHub Pages 方案，单人使用，无需用户认证。

---

## 一、前置准备

| 需要什么 | 说明 |
|----------|------|
| GitHub 账号 | 托管代码和静态页面 |
| Supabase 账号 | 免费的云端 PostgreSQL 数据库 |
| 5 分钟时间 | 完成首次配置 |

---

## 二、Supabase 配置（数据库端）

### 2.1 注册并创建项目

1. 打开 [supabase.com](https://supabase.com)，点击 **Start your project**
2. 用 GitHub 账号登录
3. 点击 **New project**
4. 填写：
   - **Name**: `schedule-manager`（任意名称）
   - **Database Password**: 设置一个强密码（**记下来**，后续管理用）
   - **Region**: 选择 `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)` 对国内延迟较低
5. 点击 **Create project**，等待 1-2 分钟数据库启动

### 2.2 创建数据表

1. 进入项目 Dashboard，左侧点击 **SQL Editor**
2. 点击 **New query**
3. 粘贴以下 SQL 并点击 **Run**：

```sql
-- 日程事件表
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

-- 日期索引（查询加速）
CREATE INDEX idx_events_date ON events(event_date);

-- 分类索引
CREATE INDEX idx_events_category ON events(category);
```

4. 执行成功后在左侧 **Table Editor** 可以看到 `events` 表

### 2.3 关闭行级安全（单人使用）

由于是单人使用，关闭 RLS 最简单：

1. 左侧点击 **Authentication** → **Settings**
2. 找到 **Enable Row Level Security (RLS)** 
3. 或者直接在 SQL Editor 执行：

```sql
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
```

### 2.4 获取连接信息

1. 左侧点击 **Settings** → **API**
2. 记录以下两个值（**下一步要用**）：
   - **Project URL**: 形如 `https://xxxxx.supabase.co`
   - **anon public key**: 形如 `eyJhbGciOi...`（很长一串）

> **安全说明**：`anon key` 是公开的 key，会出现在前端代码中。只要关闭了 RLS 或正确配置策略，这是安全的。

---

## 三、GitHub 配置（前端部署端）

### 3.1 Fork 或推送代码

将项目代码推送到你的 GitHub 仓库：

```bash
git remote add origin https://github.com/你的用户名/schedule-manager.git
git branch -M main
git add .
git commit -m "Ready for Supabase deployment"
git push -u origin main
```

### 3.2 配置 GitHub Secrets

GitHub Actions 构建需要 Supabase 的环境变量：

1. 在 GitHub 仓库页面，点击 **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**，分别添加两个 secret：

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | 你在 2.4 中记录的 Project URL |
| `VITE_SUPABASE_ANON_KEY` | 你在 2.4 中记录的 anon key |

3. 保存

### 3.3 启用 GitHub Pages

1. **Settings** → **Pages**
2. **Build and deployment** → **Source**: 选择 **GitHub Actions**
3. 推送代码后，GitHub Actions 会自动构建并部署

### 3.4 检查部署状态

1. 点击仓库的 **Actions** 标签
2. 看到 `Deploy to GitHub Pages` workflow 运行
3. 成功后访问：`https://你的用户名.github.io/schedule-manager/`

---

## 四、本地开发

### 4.1 配置本地环境变量

```bash
# 复制环境变量模板
copy .env.example .env
```

编辑 `.env` 文件，填入 Supabase 连接信息：

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4.2 启动开发服务器

```bash
npm install
npm run dev
```

打开 `http://127.0.0.1:5173`

> 注意：本地开发模式不再需要 `python app.py`，所有数据直接读写 Supabase 云端数据库。

### 4.3 本地构建

```bash
npm run build
```

构建产物在 `dist/` 目录。

---

## 五、外部用户如何使用

### 5.1 作为使用者

直接浏览器访问部署好的 URL：

```
https://你的用户名.github.io/schedule-manager/
```

- 无需安装任何软件
- 无需注册账号
- 所有数据存储在 Supabase 云端数据库
- 在手机/平板/电脑上打开同一个 URL，数据自动同步

### 5.2 添加日程

1. 点击日历上的日期 → 右侧展开详情面板
2. 在底部表单填写：
   - **事件标题**（必填）
   - **开始时间 / 结束时间**（可选，30 分钟步长）
   - **分类**（可选，如：工作、学习、健康）
   - **地点、备注**（可选）
3. 点击 **保存日程**

### 5.3 导入日程文件

支持批量导入（通过 GPT 生成的格式化文件）：

1. 左侧 **文件导入** 区域拖入文件，或点击选择
2. 支持格式：`JSON`、`Markdown`（推荐）、`XML`
3. 导入成功后会显示导入条数

**GPT 生成示例**：参考 `docs/IMPORT_FORMAT.md`

### 5.4 时间分析

- **日视图**：双击日历格，查看当日事件按上午/下午/晚上分组
- **环形图**：点击某天后，下方显示当日各类目时间占比
- **趋势图**：月度每日总时长柱状图
- **每周类目分类**：按周统计各类时间分布和星期分布
- **空闲检测**：自动计算相邻事件间的时间间隙

### 5.5 导出数据

- 左侧 **快捷操作** → **导出 JSON** / **导出 MD**，将当前数据导出为文件

### 5.6 暗色模式

- 点击左侧月亮/太阳图标切换

### 5.7 键盘快捷键

| 按键 | 功能 |
|------|------|
| `← → ↑ ↓` | 在日历格间移动 |
| `N` | 聚焦新建日程表单 |
| `T` | 回到今天的日期 |

---

## 六、现有数据迁移

如果你之前在本地使用 `python app.py` 有数据，可以迁移到 Supabase：

### 6.1 导出 SQLite

```powershell
# 方法1：用 sqlite3 命令行工具
sqlite3 data\schedule.db ".dump events" > backup.sql

# 方法2：如果没有 sqlite3，直接在原有界面导出 JSON（推荐）
```

### 6.2 导入到 Supabase

方案一：**导出 JSON 再导入**

1. 在本地旧版本中，点击 **导出 JSON** 下载文件
2. 在新部署的版本中，通过 **文件导入** 上传该 JSON 文件

方案二：**SQL 直接导入**（仅当你有 sqlite3 命令行工具）

1. 导出的 SQL 需要做格式转换（SQLite → PostgreSQL）
2. 去除非 PostgreSQL 语法（`AUTOINCREMENT` → `GENERATED ALWAYS AS IDENTITY`）
3. 在 Supabase SQL Editor 中执行

---

## 七、故障排查

### 网页打开显示空白

1. 打开浏览器开发者工具（F12）→ Console
2. 查看是否有红色错误信息
3. 常见原因：
   - GitHub Secrets 未配置 → 检查 Settings → Secrets → Actions
   - Supabase 项目暂停 → 登录 supabase.com 点击 Resume

### 数据无法保存

1. 检查 Supabase Dashboard → Table Editor → 确认 `events` 表存在
2. 检查 RLS 是否已关闭（SQL Editor 执行 `ALTER TABLE events DISABLE ROW LEVEL SECURITY;`）

### Supabase 免费项目暂停

- 连续 7 天无 API 请求会自动暂停
- 数据保留，打开网页访问一次即可自动恢复
- 如需保持活跃，可设置每 6 天访问一次

---

## 八、架构说明

```
用户浏览器 ──HTTPS──▶ GitHub Pages (React 静态文件)
                          │
                          │ @supabase/supabase-js (客户端直连)
                          ▼
                  Supabase PostgreSQL
                  (自动 REST API + 数据存储)
```

- **无需后端服务器**：Supabase 提供自动生成的 REST API
- **直连数据库**：前端通过 Supabase JS SDK 直接读写
- **GitHub Actions**：每次推送 `main` 分支时自动构建并部署到 Pages

---

## 九、相关文件

| 文件 | 说明 |
|------|------|
| `.env.example` | 环境变量模板，填入 Supabase 凭据后改名为 `.env` |
| `.github/workflows/deploy.yml` | GitHub Actions 自动部署脚本 |
| `src/lib/supabase.js` | Supabase 客户端初始化 |
| `src/utils/importParser.js` | 前端文件导入解析器（替代原 Python 解析） |
| `src/hooks/useEvents.js` | 基于 Supabase SDK 的事件 CRUD |
| `src/hooks/useStats.js` | 客户端计算统计数据 |
| `docs/IMPORT_FORMAT.md` | GPT 生成导入文件格式规范 |
