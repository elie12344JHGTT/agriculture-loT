import React from "https://esm.sh/react@19.1.1";

export function Rule({ condition, action, enabled, status, disabled = false, onToggle }) {
  return (
    <button className="rule-row" type="button" onClick={onToggle} disabled={disabled}>
      <div>
        <span>{condition}</span>
        <strong>{action}</strong>
      </div>
      <em className={enabled ? "enabled" : ""}>{status || (enabled ? "Active" : "Pause")}</em>
    </button>
  );
}
