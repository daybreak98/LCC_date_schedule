import React from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

export default function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div className={`toast toast-${t.type}`} key={t.id}>
            <Icon size={18} />
            <span>{t.message}</span>
            <button type="button" onClick={() => onRemove(t.id)}><X size={14} /></button>
          </div>
        );
      })}
    </div>
  );
}
