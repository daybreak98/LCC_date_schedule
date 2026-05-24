import React, { useState, useRef } from "react";
import { FileUp, UploadCloud } from "lucide-react";

export default function ImportPanel({ status, onImport }) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  function handleFile(file) {
    if (!file) return;
    onImport(file).catch(() => {});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <section className="control-panel import-card">
      <div className="panel-title">
        <span><FileUp size={17} /> 文件导入</span>
        <small>MD / JSON / XML</small>
      </div>
      <button
        className={`drop-area ${dragging ? "is-dragging" : ""}`}
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const files = event.dataTransfer.files;
          if (files.length > 1) {
            Array.from(files).forEach((f) => handleFile(f));
          } else {
            handleFile(files[0]);
          }
        }}
      >
        <UploadCloud size={28} />
        <strong>拖入或选择文件</strong>
        <span>JSON 对象数组、XML event 节点、Markdown 日期清单都可识别</span>
      </button>
      <input
        ref={fileInputRef}
        className="hidden-input"
        type="file"
        accept=".md,.markdown,.json,.xml,.csv"
        onChange={(event) => handleFile(event.target.files[0])}
      />
      <p className="status-text">{status}</p>
    </section>
  );
}
