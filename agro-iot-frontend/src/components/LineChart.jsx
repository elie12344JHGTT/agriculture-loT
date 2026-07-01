import React from "https://esm.sh/react@19.1.1";

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

export function LineChart({ labels = [], series = [], unit = "" }) {
  const numericSeries = series.map(Number).filter((value) => !Number.isNaN(value));
  const points = buildPoints(numericSeries);

  return (
    <div className="chart-widget chart-empty-state">
      <svg className="line-chart" viewBox="0 0 650 210" role="img" aria-label="Graphe des mesures">
        <g className="grid-lines">
          <line x1="36" y1="34" x2="626" y2="34" />
          <line x1="36" y1="103" x2="626" y2="103" />
          <line x1="36" y1="172" x2="626" y2="172" />
        </g>

        {points ? (
          <>
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
            <text className="chart-empty-title" x="325" y="92" textAnchor="middle">Aucune donnee recue</text>
            <text className="chart-empty-text" x="325" y="118" textAnchor="middle">Le graphique sera affiche apres reception des mesures Laravel.</text>
          </>
        )}
      </svg>
    </div>
  );
}
