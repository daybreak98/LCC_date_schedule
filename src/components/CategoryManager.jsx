import React, { useState } from "react";
import { Plus, Trash2, Palette } from "lucide-react";
import { CATEGORY_COLORS } from "../utils/constants.js";

export default function CategoryManager({ categories, onUpdate }) {
  const [newCat, setNewCat] = useState("");
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");

  const allCats = { ...categories };
  const catNames = Object.keys(allCats);
  if (catNames.length === 0) {
    allCats["General"] = CATEGORY_COLORS[0];
  }

  function addCategory() {
    const name = newCat.trim();
    if (!name || allCats[name]) return;
    const color = CATEGORY_COLORS[Object.keys(allCats).length % CATEGORY_COLORS.length];
    onUpdate({ ...allCats, [name]: color });
    setNewCat("");
  }

  function removeCategory(name) {
    const next = { ...allCats };
    delete next[name];
    if (Object.keys(next).length === 0) {
      next["General"] = CATEGORY_COLORS[0];
    }
    onUpdate(next);
  }

  function startEdit(name) {
    setEditing(name);
    setEditName(name);
  }

  function saveEdit(oldName) {
    const newName = editName.trim();
    if (!newName || newName === oldName) {
      setEditing(null);
      return;
    }
    const next = {};
    for (const [k, v] of Object.entries(allCats)) {
      next[k === oldName ? newName : k] = v;
    }
    onUpdate(next);
    setEditing(null);
  }

  return (
    <div className="category-manager">
      <div className="cat-list">
        {Object.entries(allCats).map(([name, color]) => (
          <div className="cat-row" key={name}>
            <i style={{ background: color }} />
            {editing === name ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => saveEdit(name)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit(name)}
                autoFocus
              />
            ) : (
              <span onDoubleClick={() => startEdit(name)}>{name}</span>
            )}
            <div className="cat-actions">
              <button type="button" onClick={() => startEdit(name)} title="重命名"><Palette size={14} /></button>
              <button type="button" onClick={() => removeCategory(name)} title="删除"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="cat-add">
        <input
          placeholder="新分类名称"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
        />
        <button type="button" onClick={addCategory}><Plus size={16} /></button>
      </div>
    </div>
  );
}
