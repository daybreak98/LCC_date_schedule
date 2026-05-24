import React from "react";

export default function TimeSelect({ name, label, value = "" }) {
  return (
    <input
      aria-label={label}
      defaultValue={value || ""}
      name={name}
      step="1800"
      type="time"
    />
  );
}
