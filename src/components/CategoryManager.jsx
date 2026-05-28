import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function CategoryManager({ categoryTree, onUpdate }) {
  const [newCategory, setNewCategory] = useState("");

  function addCategory() {
    const name = newCategory.trim();
    if (!name || categoryTree[name]) return;
    onUpdate({ ...categoryTree, [name]: [] });
    setNewCategory("");
  }

  function removeCategory(name) {
    const next = { ...categoryTree };
    delete next[name];
    onUpdate(Object.keys(next).length ? next : { General: [] });
  }

  function removeSubcategory(category, subcategory) {
    onUpdate({
      ...categoryTree,
      [category]: categoryTree[category].filter((item) => item !== subcategory),
    });
  }

  return (
    <div className="category-manager">
      <div className="category-tree-list">
        {Object.entries(categoryTree).map(([category, subcategories]) => (
          <section className="category-tree-card" key={category}>
            <div className="category-tree-head">
              <strong>{category}</strong>
              <button type="button" onClick={() => removeCategory(category)} title="删除大类">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="category-tree-tags">
              {subcategories.length === 0 && <span className="muted-chip">暂无小类</span>}
              {subcategories.map((subcategory) => (
                <button
                  className="small-tag"
                  key={`${category}-${subcategory}`}
                  type="button"
                  onClick={() => removeSubcategory(category, subcategory)}
                  title="点击删除小类"
                >
                  {subcategory} ×
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="cat-add">
        <input
          placeholder="新增大类，例如：健身"
          value={newCategory}
          onChange={(event) => setNewCategory(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCategory();
            }
          }}
        />
        <button type="button" onClick={addCategory}><Plus size={16} /></button>
      </div>
    </div>
  );
}
