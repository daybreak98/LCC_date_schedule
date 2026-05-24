# 日程管理系统

一个本地运行的日程管理系统：React 前端负责可视化日历、交互详情、文件导入和统计图表，Python 后端负责 API、解析导入文件和 SQLite 数据存储。

## 功能

- 月历视图：点击日期查看当天事件详情。
- 悬浮摘要：鼠标悬浮日期时显示当天事件数量和时间安排。
- 日程管理：支持新增、删除事件，数据写入本地 SQLite。
- 文件导入：支持 `.md`、`.json`、`.xml` 导入日程。
- 统计看板：展示总日程、本月安排、计划小时、每日安排量、分类占比和星期分布。

## 启动

```powershell
npm install
npm run build
python app.py
```

如果当前终端还没有刷新 Python 环境变量，也可以直接运行：

```powershell
& "$env:LocalAppData\Programs\Python\Python314\python.exe" app.py
```

打开：

```text
http://127.0.0.1:8000
```

## 开发模式

后端：

```powershell
python app.py
```

前端：

```powershell
npm run dev
```

开发模式打开：

```text
http://127.0.0.1:5173
```

## 导入格式示例

JSON：

```json
[
  {
    "title": "项目评审",
    "date": "2026-05-26",
    "start": "10:00",
    "end": "11:30",
    "category": "工作",
    "location": "会议室 A",
    "description": "确认里程碑和风险"
  }
]
```

XML：

```xml
<events>
  <event>
    <title>复盘会议</title>
    <date>2026-05-27</date>
    <start>15:00</start>
    <end>16:00</end>
    <category>团队</category>
  </event>
</events>
```

Markdown：

```markdown
# 2026-05-28
- 09:00-10:00 晨会 | 工作 | 同步今日重点
- 19:30 跑步 | 健康
```
