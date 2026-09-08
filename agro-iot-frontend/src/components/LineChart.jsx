import React from "react";

function buildPoints(series) {
  if (!series || !series.length) return "";

  const width = 590;
  const height = 138;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min;

  return series.map((value, index) => {
    const x = 36 + (index * width) / Math.max(1, series.length - 1);
    // If all values are the same, center the line at y = 103
    const y = range === 0 ? 103 : 172 - ((value - min) * height) / range;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : "--";
}

export function LineChart({ labels = [], series = [], unit = "" }) {
  const numericSeries = series.map(Number).filter((value) => !Number.isNaN(value));
  const points = buildPoints(numericSeries);
  const latest = numericSeries.length ? numericSeries[numericSeries.length - 1] : null;
  const previous = numericSeries.length > 1 ? numericSeries[numericSeries.length - 2] : null;
  const min = numericSeries.length ? Math.min(...numericSeries) : null;
  const max = numericSeries.length ? Math.max(...numericSeries) : null;
  const delta = Number.isFinite(latest) && Number.isFinite(previous) ? latest - previous : null;
  const deltaClass = delta === null ? "waiting" : delta >= 0 ? "up" : "down";
  const areaPoints = points ? `36,172 ${points} 626,172` : "";

  // Filter labels so at most 5-6 evenly spaced labels are displayed to prevent overlapping
  const maxLabels = 5;
  const totalLabels = labels.length;
  let visibleLabels = [];
  if (totalLabels > 0) {
    if (totalLabels <= maxLabels) {
      visibleLabels = labels.map((label, index) => ({
        label,
        x: 36 + (index * 590) / Math.max(1, totalLabels - 1)
      }));
    } else {
      const step = (totalLabels - 1) / (maxLabels - 1);
      for (let i = 0; i < maxLabels; i++) {
        const idx = Math.min(Math.round(i * step), totalLabels - 1);
        visibleLabels.push({
          label: labels[idx],
          x: 36 + (idx * 590) / (totalLabels - 1)
        });
      }
    }
  }

  // Sample points for circles if series has many data points (avoids solid black line of dots)
  const shouldRenderCircle = (index, total) => {
    if (total <= 12) return true;
    if (index === 0 || index === total - 1) return true;
    const circleStep = Math.ceil(total / 8);
    return index % circleStep === 0;
  };

  return (
    <div className={`chart-widget ${points ? "has-data" : "chart-empty-state"}`}>
      {points && (
        <div className="chart-summary-strip">
          <div className="summary-col current">
            <span className="summary-label">Actuel</span>
            <span className="summary-value"><strong>{formatNumber(latest)}</strong> {unit}</span>
          </div>
          <div className="summary-col">
            <span className="summary-label">Min</span>
            <span className="summary-value"><strong>{formatNumber(min)}</strong> {unit}</span>
          </div>
          <div className="summary-col">
            <span className="summary-label">Max</span>
            <span className="summary-value"><strong>{formatNumber(max)}</strong> {unit}</span>
          </div>
          <div className="summary-col delta">
            <span className="summary-label">Évolution</span>
            <em className={`chart-delta ${deltaClass}`}>
              {delta === null ? "Stable" : `${delta >= 0 ? "+" : ""}${formatNumber(delta)} ${unit}`}
            </em>
          </div>
        </div>
      )}

      <svg className="line-chart" viewBox="0 0 650 210" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Graphe des mesures">
        <defs>
          <linearGradient id="measureAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#006b1b" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#006b1b" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <g className="grid-lines" stroke="#e0e6e2" strokeDasharray="4 4" strokeWidth="1">
          <line x1="36" y1="34" x2="626" y2="34" />
          <line x1="36" y1="103" x2="626" y2="103" />
          <line x1="36" y1="172" x2="626" y2="172" />
        </g>

        {points ? (
          <>
            <polygon className="line-chart-area" points={areaPoints} fill="url(#measureAreaGradient)" stroke="none" />
            <polyline
              className="line-chart-line"
              points={points}
              fill="none"
              stroke="#006b1b"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {numericSeries.map((value, index) => {
              if (!shouldRenderCircle(index, numericSeries.length)) return null;
              const pointsArr = points.split(" ");
              if (!pointsArr[index]) return null;
              const [x, y] = pointsArr[index].split(",");
              return (
                <circle
                  key={`pt-${index}`}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#ffffff"
                  stroke="#006b1b"
                  strokeWidth="2.5"
                />
              );
            })}
            {visibleLabels.map((item, index) => (
              <text
                key={`lbl-${index}`}
                className="chart-label"
                x={item.x}
                y="198"
                textAnchor="middle"
                fill="#66736b"
                fontSize="11"
                fontFamily="Inter, system-ui, sans-serif"
              >
                {item.label}
              </text>
            ))}
            {unit && (
              <text className="chart-unit-badge" x="626" y="24" textAnchor="end" fill="#88958d" fontSize="11" fontWeight="600">
                {unit}
              </text>
            )}
          </>
        ) : (
          <>
            <text className="chart-empty-title" x="325" y="95" textAnchor="middle" fill="#2d3748" fontSize="14" fontWeight="600">
              Aucune donnée reçue
            </text>
            <text className="chart-empty-text" x="325" y="122" textAnchor="middle" fill="#718096" fontSize="12">
              Le graphique apparaîtra dès que les mesures seront transmises.
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
