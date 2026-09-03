import React from "react";

function buildPoints(series) {
  if (!series.length) return "";

  const width = 590;
  const height = 138;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;

  return series.map((value, index) => {
    const x = 36 + (index * width) / Math.max(1, series.length - 1);
    const y = 172 - ((value - min) * height) / range;
    return `${x},${y}`;
  }).join(" ");
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : "--";
}

export function LineChart({ labels = [], series = [], unit = "" }) {
  const numericSeries = series.map(Number).filter((value) => !Number.isNaN(value));
  const points = buildPoints(numericSeries);
  const latest = numericSeries.at(-1);
  const previous = numericSeries.at(-2);
  const min = numericSeries.length ? Math.min(...numericSeries) : null;
  const max = numericSeries.length ? Math.max(...numericSeries) : null;
  const delta = Number.isFinite(latest) && Number.isFinite(previous) ? latest - previous : null;
  const deltaClass = delta === null ? "waiting" : delta >= 0 ? "up" : "down";
  const areaPoints = points ? `36,172 ${points} 626,172` : "";

  return (
    <div className={`chart-widget ${points ? "has-data" : "chart-empty-state"}`}>
      {points && (
        <div className="chart-summary-strip">
          <span><strong>{formatNumber(latest)}</strong>{unit}</span>
          <span>Min {formatNumber(min)}{unit}</span>
          <span>Max {formatNumber(max)}{unit}</span>
          <em className={`chart-delta ${deltaClass}`}>{delta === null ? "Stable" : `${delta >= 0 ? "+" : ""}${formatNumber(delta)}${unit}`}</em>
        </div>
      )}

      <svg className="line-chart" viewBox="0 0 650 210" role="img" aria-label="Graphe des mesures">
        <defs>
          <linearGradient id="measureArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#485329" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#485329" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <g className="grid-lines">
          <line x1="36" y1="34" x2="626" y2="34" />
          <line x1="36" y1="103" x2="626" y2="103" />
          <line x1="36" y1="172" x2="626" y2="172" />
        </g>

        {points ? (
          <>
            <polygon className="line-chart-area" points={areaPoints} />
            <polyline points={points} />
            {numericSeries.map((value, index) => {
              const [x, y] = points.split(" ")[index].split(",");
              return <circle key={`${value}-${index}`} cx={x} cy={y} r="5" />;
            })}
            {labels.map((label, index) => (
              <text key={`${label}-${index}`} className="chart-label" x={36 + (index * 590) / Math.max(1, labels.length - 1)} y="198" textAnchor="middle">
                {label}
              </text>
            ))}
            {unit && <text className="chart-label" x="626" y="24" textAnchor="end">{unit}</text>}
          </>
        ) : (
          <>
            <text className="chart-empty-icon" x="325" y="67" textAnchor="middle">▥</text>
            <text className="chart-empty-title" x="325" y="92" textAnchor="middle">Aucune donnee recue</text>
            <text className="chart-empty-text" x="325" y="118" textAnchor="middle">Le graphique apparaitra des que Laravel envoie les mesures.</text>
          </>
        )}
      </svg>
    </div>
  );
}
