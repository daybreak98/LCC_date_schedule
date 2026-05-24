import React from "react";
import { X, Check } from "lucide-react";

export default function ConfirmDialog({ data, onConfirm, onCancel }) {
  if (!data) return null;
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-head">
          <strong>{data.title}</strong>
          <button type="button" className="round-button" onClick={onCancel}><X size={18} /></button>
        </div>
        <p>{data.message}</p>
        <div className="confirm-actions">
          <button className="cancel-edit" type="button" onClick={onCancel}>取消</button>
          <button className="save-edit" type="button" onClick={() => onConfirm(true)}>
            <Check size={16} /> 确认
          </button>
        </div>
      </div>
    </div>
  );
}
