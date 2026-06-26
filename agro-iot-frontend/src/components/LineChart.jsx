import React from "https://esm.sh/react@19.1.1";

export function LineChart() {
  return (
    <div className="chart-widget chart-empty-state">
      <svg className="line-chart" viewBox="0 0 650 210" role="img" aria-label="Graphe des mesures">
        <g className="grid-lines">
          <line x1="36" y1="34" x2="626" y2="34" />
          <line x1="36" y1="103" x2="626" y2="103" />
          <line x1="36" y1="172" x2="626" y2="172" />
        </g>
      </svg>
    </div>
  );
}
