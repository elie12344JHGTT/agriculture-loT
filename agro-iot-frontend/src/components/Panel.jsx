import React from "react";
export function Panel({ title, actionLabel, children }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        {actionLabel && <span className="panel-action">{actionLabel}</span>}
      </div>
      {children}
    </section>
  );
}
