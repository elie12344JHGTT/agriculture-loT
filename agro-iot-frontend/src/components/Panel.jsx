import React from "react";
export function Panel({ title, children }) {
  return (
    <section className="panel glass">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
