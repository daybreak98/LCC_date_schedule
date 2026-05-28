import React, { useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";

function buildMeta({ search, category, dateFrom, dateTo }) {
  return {
    search: search.trim(),
    category,
    dateFrom,
    dateTo,
  };
}

function describeFilter(meta) {
  const parts = [];
  if (meta.search) parts.push(`关键词：${meta.search}`);
  if (meta.category) parts.push(`分类：${meta.category}`);
  if (meta.dateFrom || meta.dateTo) {
    parts.push(`日期：${meta.dateFrom || "开始"} 至 ${meta.dateTo || "结束"}`);
  }
  return parts.join(" · ");
}

export default function SearchFilter({ events, onFiltered, categoryTree = {} }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [appliedMeta, setAppliedMeta] = useState({});

  const hasDraftFilter = Boolean(search || category || dateFrom || dateTo);
  const hasAppliedFilter = Boolean(
    appliedMeta.search || appliedMeta.category || appliedMeta.dateFrom || appliedMeta.dateTo
  );
  const appliedSummary = useMemo(() => describeFilter(appliedMeta), [appliedMeta]);

  function filterWith(meta) {
    let filtered = [...events];
    if (meta.search) {
      const keyword = meta.search.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(keyword) ||
          (event.description || "").toLowerCase().includes(keyword) ||
          (event.subcategory || "").toLowerCase().includes(keyword) ||
          (event.location || "").toLowerCase().includes(keyword)
      );
    }
    if (meta.category) {
      filtered = filtered.filter((event) => event.category === meta.category);
    }
    if (meta.dateFrom) {
      filtered = filtered.filter((event) => event.event_date >= meta.dateFrom);
    }
    if (meta.dateTo) {
      filtered = filtered.filter((event) => event.event_date <= meta.dateTo);
    }
    setAppliedMeta(meta);
    onFiltered(filtered, meta);
  }

  function apply(nextValues = { search, category, dateFrom, dateTo }) {
    filterWith(buildMeta(nextValues));
  }

  function reset() {
    setSearch("");
    setCategory("");
    setDateFrom("");
    setDateTo("");
    setAppliedMeta({});
    onFiltered(null, {});
  }

  function clearSearch() {
    setSearch("");
    apply({ search: "", category, dateFrom, dateTo });
  }

  return (
    <div className="search-filter">
      <div className="search-row">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            aria-label="搜索日程"
            placeholder="搜索标题、备注、地点..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && apply()}
          />
          {search && (
            <button aria-label="清空搜索" type="button" onClick={clearSearch}>
              <X size={14} />
            </button>
          )}
        </div>
        <button
          aria-label="筛选"
          className={`filter-toggle ${showFilters ? "active" : ""}`}
          type="button"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
        </button>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-row">
            <select aria-label="分类筛选" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">全部分类</option>
              {Object.keys(categoryTree).map((preset) => (
                <option key={preset} value={preset}>{preset}</option>
              ))}
            </select>
            <input aria-label="开始日期" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            <input aria-label="结束日期" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </div>
          <div className="filter-actions">
            <button className="save-edit" type="button" onClick={() => apply()}>应用筛选</button>
            {(hasDraftFilter || hasAppliedFilter) && (
              <button className="cancel-edit" type="button" onClick={reset}>清除筛选</button>
            )}
          </div>
        </div>
      )}

      {hasAppliedFilter && (
        <div className="filter-status">
          <span>已筛选：{appliedSummary}</span>
          <button type="button" onClick={reset}>清除</button>
        </div>
      )}
    </div>
  );
}
