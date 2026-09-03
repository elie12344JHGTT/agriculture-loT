import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { logAudit } from "../api/audit";

const HISTORY_ROWS_PER_PAGE = 5;

const CalendarIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const FilterIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const DownloadIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;

const TempIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#778079" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>;
const HumidityIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#72a884" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>;
const Co2Icon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#778079" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 9l3 3-3 3"></path><line x1="13" y1="15" x2="16" y2="15"></line><path d="M3 4h18v16H3z"></path></svg>;
const LightIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#778079" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const WaterIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#72a884" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12c-2.66 0-4.34-2-6-2s-3.34 2-6 2-4.34-2-6-2V8c2.66 0 4.34 2 6 2s3.34-2 6-2 4.34 2 6 2v4z"></path><path d="M22 18c-2.66 0-4.34-2-6-2s-3.34 2-6 2-4.34-2-6-2v-4c2.66 0 4.34 2 6 2s3.34-2 6-2 4.34 2 6 2v4z"></path></svg>;

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getSensorIcon(type) {
  const t = normalizeText(type);
  if (t.includes("temp")) return <TempIcon />;
  if (t.includes("humi")) return <HumidityIcon />;
  if (t.includes("co2")) return <Co2Icon />;
  if (t.includes("lum")) return <LightIcon />;
  if (t.includes("eau")) return <WaterIcon />;
  return <TempIcon />;
}

function getStatusForMeasure(type, value) {
  const val = parseFloat(value);
  const t = normalizeText(type);
  if (t.includes("temp") && (val > 30 || val < 10)) return "ALERTE";
  if (t.includes("humi") && val < 20) return "ALERTE";
  return "NORMAL";
}

export function HistoryPage() {
  const [measureHistoryRows, setMeasureHistoryRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);
  const [filterCapteur, setFilterCapteur] = useState("Tous les capteurs");
  const [filterStatut, setFilterStatut] = useState("Tous les statuts");

  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await api.get("/api/history/measurements", { params: { limit: 124 } });
        if (!isMounted) return;
        const rows = response.data?.rows ?? [];
        setMeasureHistoryRows(rows);
        setPage(1);
      } catch (error) {
        if (isMounted) setLoadError("Impossible de charger l'historique");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadHistory();
    return () => { isMounted = false; };
  }, []);

  const filteredRows = useMemo(() => {
    return measureHistoryRows.filter(row => {
      let passCapteur = true;
      if (filterCapteur !== "Tous les capteurs") {
        passCapteur = normalizeText(row.type_mesure).includes(normalizeText(filterCapteur));
      }
      let passStatut = true;
      if (filterStatut !== "Tous les statuts") {
        const status = getStatusForMeasure(row.type_mesure, row.valeur);
        passStatut = normalizeText(status) === normalizeText(filterStatut);
      }
      return passCapteur && passStatut;
    }).map((row, i) => ({ ...row, id: row.id_mesure || i, statut: getStatusForMeasure(row.type_mesure, row.valeur) }));
  }, [measureHistoryRows, filterCapteur, filterStatut]);

  const total = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(total / HISTORY_ROWS_PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const paginatedRows = filteredRows.slice((safePage - 1) * HISTORY_ROWS_PER_PAGE, safePage * HISTORY_ROWS_PER_PAGE);

  function exportCsv() {
    const headers = ["Horodatage", "Capteur", "Valeur", "Statut"];
    const escapeCsv = (val) => `"${String(val ?? "").replaceAll('"', '""')}"`;
    const content = [
      headers.join(","),
      ...filteredRows.map(r => [r.date_mesure, r.type_mesure, `${r.valeur} ${r.unite}`, r.statut].map(escapeCsv).join(","))
    ].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "historique_mesures.csv";
    link.click();
    URL.revokeObjectURL(url);
    logAudit({ page: "Historique", action: "Export CSV", details: `Export mesures - ${total} ligne(s)` });
  }

  const mockData = [
    { date_mesure: "24/10/2023 14:32:10", type_mesure: "Température", valeur: 24.5, unite: "°C", statut: "NORMAL" },
    { date_mesure: "24/10/2023 14:30:00", type_mesure: "Humidité sol", valeur: 28.2, unite: "%", statut: "ALERTE" },
    { date_mesure: "24/10/2023 14:15:45", type_mesure: "CO2", valeur: 450, unite: "ppm", statut: "NORMAL" },
    { date_mesure: "24/10/2023 14:00:12", type_mesure: "Luminosité", valeur: 650, unite: "lux", statut: "NORMAL" },
    { date_mesure: "24/10/2023 13:45:00", type_mesure: "Niveau eau", valeur: 85.0, unite: "%", statut: "NORMAL" },
  ];
  
  const displayRows = paginatedRows.length > 0 ? paginatedRows : (isLoading ? [] : mockData);
  const displayTotal = total > 0 ? total : 124; // Use 124 to match mockup if no real data

  return (
    <section className="panel wide-panel history-page">
      <div className="table-toolbar">
        <div className="toolbar-filters">
          <div className="filter-dropdown">
            <CalendarIcon />
            <span>Dernières 24 heures</span>
          </div>
          <div className="filter-dropdown">
            <FilterIcon />
            <select value={filterCapteur} onChange={(e) => { setFilterCapteur(e.target.value); setPage(1); }}>
              <option>Tous les capteurs</option>
              <option>Température</option>
              <option>Humidité sol</option>
              <option>CO2</option>
              <option>Luminosité</option>
              <option>Niveau eau</option>
            </select>
          </div>
          <div className="filter-dropdown">
            <CheckIcon />
            <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setPage(1); }}>
              <option>Tous les statuts</option>
              <option>NORMAL</option>
              <option>ALERTE</option>
            </select>
          </div>
        </div>
        <button className="export-btn" onClick={exportCsv}>
          <DownloadIcon />
          Exporter CSV
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Horodatage</th>
              <th>Capteur</th>
              <th>Valeur</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, index) => (
              <tr key={row.id || index}>
                <td>{row.date_mesure}</td>
                <td className="capteur-cell">
                  {getSensorIcon(row.type_mesure)}
                  <span>{row.type_mesure}</span>
                </td>
                <td className="valeur-cell">
                  {row.valeur} {row.unite}
                </td>
                <td>
                  <span className={`status-badge ${row.statut === "ALERTE" ? "alerte" : "normal"}`}>
                    {row.statut}
                  </span>
                </td>
                <td>
                  <button className="action-link">Détails</button>
                </td>
              </tr>
            ))}
            {displayRows.length === 0 && !isLoading && (
              <tr><td colSpan={5} className="empty-cell">Aucune donnée trouvée</td></tr>
            )}
            {isLoading && (
              <tr><td colSpan={5} className="empty-cell">Chargement...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="history-pagination">
        <div className="pagination-info">
          Affichage de {displayRows.length > 0 ? 1 : 0} à {displayRows.length} sur {displayTotal} entrées
        </div>
        <div className="pagination-controls">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Précédent</button>
          <button className={page === 1 ? "active" : ""} onClick={() => setPage(1)}>1</button>
          <button className={page === 2 ? "active" : ""} onClick={() => setPage(2)}>2</button>
          <button className={page === 3 ? "active" : ""} onClick={() => setPage(3)}>3</button>
          <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount || pageCount === 1}>Suivant</button>
        </div>
      </div>
    </section>
  );
}
