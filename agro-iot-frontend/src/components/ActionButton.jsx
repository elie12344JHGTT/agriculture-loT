import React from "react";

export function ActionButton({ label, detail, active = false, disabled = false, onToggle }) {
  return (
    <button className={`action-button ${active ? "selected" : ""}`} onClick={onToggle} disabled={disabled}>
      <span>{label}</span>
      <small>{detail}</small>
    </button>
  );
}
