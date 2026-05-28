import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";

export default function CategoryPicker({
  categoryTree,
  onUpdate,
  defaultCategory = "",
  defaultSubcategory = "",
}) {
  const categories = useMemo(() => {
    const names = Object.keys(categoryTree || {});
    return defaultCategory && !names.includes(defaultCategory) ? [defaultCategory, ...names] : names;
  }, [categoryTree, defaultCategory]);
  const firstCategory = categories[0] || "General";
  const [category, setCategory] = useState(defaultCategory || firstCategory);
  const [subcategory, setSubcategory] = useState(defaultSubcategory || "");
  const [newSubcategory, setNewSubcategory] = useState("");

  const subcategories = categoryTree?.[category] || [];

  function selectCategory(nextCategory) {
    setCategory(nextCategory);
    setSubcategory("");
  }

  function addSubcategory() {
    const name = newSubcategory.trim();
    if (!name) return;
    const current = categoryTree?.[category] || [];
    const nextTree = {
      ...categoryTree,
      [category]: current.includes(name) ? current : [...current, name],
    };
    onUpdate(nextTree);
    setSubcategory(name);
    setNewSubcategory("");
  }

  return (
    <div className="category-picker">
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="subcategory" value={subcategory} />

      <div className="category-picker-head">
        <span>大类</span>
        <strong>{category}</strong>
      </div>
      <div className="choice-grid">
        {categories.map((item) => (
          <button
            className={item === category ? "choice-chip is-active" : "choice-chip"}
            key={item}
            type="button"
            onClick={() => selectCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="category-picker-head">
        <span>小类</span>
        <strong>{subcategory || "未选择"}</strong>
      </div>
      <div className="choice-grid sub-choice-grid">
        {subcategories.map((item) => (
          <button
            className={item === subcategory ? "choice-chip is-active" : "choice-chip"}
            key={item}
            type="button"
            onClick={() => setSubcategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="subcategory-add">
        <input
          value={newSubcategory}
          placeholder="没有想要的小类？输入后新增"
          onChange={(event) => setNewSubcategory(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addSubcategory();
            }
          }}
        />
        <button type="button" onClick={addSubcategory}>
          <Plus size={15} /> 新增小类
        </button>
      </div>
    </div>
  );
}
