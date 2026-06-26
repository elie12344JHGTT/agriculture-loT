import React, { useMemo, useState } from "https://esm.sh/react@19.1.1";

const tabs = ["Mesures", "Alertes", "Actions"];
const measureHistoryRows = [];
const alertHistoryRows = [];
const actionHistoryRows = [];
const HISTORY_ROWS_PER_PAGE = 7;

function exportRowsAsCsv(filename, headers, rows) {
  const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const content = [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(","))].join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function rowKey(row, index) {
  return row.id_mesure || row.id_alerte || row.id_action || `${row.date_mesure || row.date_creation || row.date_action}-${index}`;
}

function EmptyRow({ colSpan, label }) {
  return (
    <tr className="empty-table-row">
      <td colSpan={colSpan}>{label}</td>
    </tr>
  );
}

function Pagination({ label, total, page, pageCount, startIndex, endIndex, onPageChange }) {
  if (total <= HISTORY_ROWS_PER_PAGE) {
    return null;
  }

  return (
    <div className="users-pagination" aria-label={label}>
      <span>{startIndex}-{endIndex} sur {total}</span>
      <div>
        <button
          className="toolbar-button"
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Precedent
        </button>
        <strong>Page {page} / {pageCount}</strong>
        <button
          className="toolbar-button"
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page === pageCount}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

function getPageMeta(rows, page) {
  const pageCount = Math.max(1, Math.ceil(rows.length / HISTORY_ROWS_PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const startIndex = rows.length === 0 ? 0 : (safePage - 1) * HISTORY_ROWS_PER_PAGE + 1;
  const endIndex = Math.min(safePage * HISTORY_ROWS_PER_PAGE, rows.length);
  const paginatedRows = rows.slice((safePage - 1) * HISTORY_ROWS_PER_PAGE, safePage * HISTORY_ROWS_PER_PAGE);

  return { safePage, pageCount, startIndex, endIndex, paginatedRows };
}

export function HistoryPage() {
  const [activeTab, setActiveTab] = useState("Mesures");
  const [filter, setFilter] = useState("Tous");
  const [dateFilter, setDateFilter] = useState("");
  const [measurePage, setMeasurePage] = useState(1);
  const [alertPage, setAlertPage] = useState(1);
  const [actionPage, setActionPage] = useState(1);
  const [selectedMeasures, setSelectedMeasures] = useState([]);
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [selectedActions, setSelectedActions] = useState([]);

  const filteredMeasures = useMemo(
    () => filter === "Tous" ? measureHistoryRows : measureHistoryRows.filter((row) => row.type_mesure === filter),
    [filter]
  );

  const measureRows = useMemo(
    () => filteredMeasures.map((row, index) => ({ ...row, key: rowKey(row, index) })),
    [filteredMeasures]
  );

  const alertRows = useMemo(
    () => alertHistoryRows.map((row, index) => ({ ...row, key: rowKey(row, index) })),
    []
  );

  const actionRows = useMemo(
    () => actionHistoryRows.map((row, index) => ({ ...row, key: rowKey(row, index) })),
    []
  );

  const measureMeta = getPageMeta(measureRows, measurePage);
  const alertMeta = getPageMeta(alertRows, alertPage);
  const actionMeta = getPageMeta(actionRows, actionPage);

  const selectedMeasureRows = measureRows.filter((row) => selectedMeasures.includes(row.key));
  const selectedAlertRows = alertRows.filter((row) => selectedAlerts.includes(row.key));
  const selectedActionRows = actionRows.filter((row) => selectedActions.includes(row.key));

  function toggleSelection(id, setter) {
    setter((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAll(ids, selectedIds, setter) {
    setter(selectedIds.length === ids.length ? [] : ids);
  }

  function exportSelectedMeasures() {
    exportRowsAsCsv("historique-mesures-selectionnees.csv", ["date_mesure", "parcelle", "capteur", "type_mesure", "valeur", "unite"], selectedMeasureRows);
  }

  function exportSelectedAlerts() {
    exportRowsAsCsv("historique-alertes-selectionnees.csv", ["date_creation", "parcelle", "type_alerte", "message", "niveau", "statut", "regle"], selectedAlertRows);
  }

  function exportSelectedActions() {
    exportRowsAsCsv("historique-actions-selectionnees.csv", ["date_action", "actionneur", "type_action", "source", "statut", "utilisateur"], selectedActionRows);
  }

  return (
    <section className="panel wide-panel history-page">
      <div className="history-header">
        <div>
          <h2>Historique</h2>
          <p>Mesures, alertes et commandes manuelles ou automatiques.</p>
        </div>
        <div className="history-tabs" role="tablist" aria-label="Types d'historique">
          {tabs.map((tab) => (
            <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)} type="button">
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Mesures" && (
        <>
          <div className="table-toolbar">
            <div className="filters">
              <input type="date" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setMeasurePage(1); }} />
              <select value={filter} onChange={(event) => { setFilter(event.target.value); setSelectedMeasures([]); setMeasurePage(1); }}>
                <option>Tous</option>
                <option>Humidite sol</option>
                <option>Temperature</option>
                <option>CO2</option>
                <option>Niveau eau</option>
                <option>Luminosite</option>
              </select>
            </div>
            <div className="toolbar-actions">
              <div className="selection-summary">
                <strong>{selectedMeasures.length}</strong>
                <span>mesure(s) selectionnee(s)</span>
              </div>
              <button className="primary-button small" onClick={exportSelectedMeasures} disabled={selectedMeasures.length === 0}>Export CSV</button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" checked={measureRows.length > 0 && selectedMeasures.length === measureRows.length} onChange={() => toggleAll(measureRows.map((row) => row.key), selectedMeasures, setSelectedMeasures)} /></th>
                  <th>Date mesure</th>
                  <th>Parcelle</th>
                  <th>Capteur</th>
                  <th>Type mesure</th>
                  <th>Valeur</th>
                  <th>Unite</th>
                </tr>
              </thead>
              <tbody>
                {measureMeta.paginatedRows.map((row) => (
                  <tr key={row.key} className={selectedMeasures.includes(row.key) ? "selected-row" : ""}>
                    <td><input type="checkbox" checked={selectedMeasures.includes(row.key)} onChange={() => toggleSelection(row.key, setSelectedMeasures)} /></td>
                    <td>{row.date_mesure}</td>
                    <td>{row.parcelle}</td>
                    <td>{row.capteur}</td>
                    <td>{row.type_mesure}</td>
                    <td>{row.valeur}</td>
                    <td>{row.unite}</td>
                  </tr>
                ))}
                {measureRows.length === 0 && <EmptyRow colSpan={7} label="Aucune mesure recue" />}
              </tbody>
            </table>
          </div>
          <Pagination label="Pagination des mesures" total={measureRows.length} page={measureMeta.safePage} pageCount={measureMeta.pageCount} startIndex={measureMeta.startIndex} endIndex={measureMeta.endIndex} onPageChange={setMeasurePage} />
        </>
      )}

      {activeTab === "Alertes" && (
        <>
          <div className="table-toolbar">
            <div className="selection-summary">
              <strong>{selectedAlerts.length}</strong>
              <span>alerte(s) selectionnee(s)</span>
            </div>
            <button className="primary-button small" onClick={exportSelectedAlerts} disabled={selectedAlerts.length === 0}>Export CSV</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" checked={alertRows.length > 0 && selectedAlerts.length === alertRows.length} onChange={() => toggleAll(alertRows.map((row) => row.key), selectedAlerts, setSelectedAlerts)} /></th>
                  <th>Date creation</th>
                  <th>Parcelle</th>
                  <th>Type alerte</th>
                  <th>Message</th>
                  <th>Niveau</th>
                  <th>Statut</th>
                  <th>Regle</th>
                </tr>
              </thead>
              <tbody>
                {alertMeta.paginatedRows.map((row) => (
                  <tr key={row.key} className={selectedAlerts.includes(row.key) ? "selected-row" : ""}>
                    <td><input type="checkbox" checked={selectedAlerts.includes(row.key)} onChange={() => toggleSelection(row.key, setSelectedAlerts)} /></td>
                    <td>{row.date_creation}</td>
                    <td>{row.parcelle}</td>
                    <td>{row.type_alerte}</td>
                    <td>{row.message}</td>
                    <td>{row.niveau}</td>
                    <td>{row.statut}</td>
                    <td>{row.regle}</td>
                  </tr>
                ))}
                {alertRows.length === 0 && <EmptyRow colSpan={8} label="Aucune alerte recue" />}
              </tbody>
            </table>
          </div>
          <Pagination label="Pagination des alertes" total={alertRows.length} page={alertMeta.safePage} pageCount={alertMeta.pageCount} startIndex={alertMeta.startIndex} endIndex={alertMeta.endIndex} onPageChange={setAlertPage} />
        </>
      )}

      {activeTab === "Actions" && (
        <>
          <div className="table-toolbar">
            <div className="selection-summary">
              <strong>{selectedActions.length}</strong>
              <span>action(s) selectionnee(s)</span>
            </div>
            <button className="primary-button small" onClick={exportSelectedActions} disabled={selectedActions.length === 0}>Export CSV</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" checked={actionRows.length > 0 && selectedActions.length === actionRows.length} onChange={() => toggleAll(actionRows.map((row) => row.key), selectedActions, setSelectedActions)} /></th>
                  <th>Date action</th>
                  <th>Actionneur</th>
                  <th>Type action</th>
                  <th>Source</th>
                  <th>Statut</th>
                  <th>Utilisateur</th>
                </tr>
              </thead>
              <tbody>
                {actionMeta.paginatedRows.map((row) => (
                  <tr key={row.key} className={selectedActions.includes(row.key) ? "selected-row" : ""}>
                    <td><input type="checkbox" checked={selectedActions.includes(row.key)} onChange={() => toggleSelection(row.key, setSelectedActions)} /></td>
                    <td>{row.date_action}</td>
                    <td>{row.actionneur}</td>
                    <td>{row.type_action}</td>
                    <td>{row.source}</td>
                    <td>{row.statut}</td>
                    <td>{row.utilisateur}</td>
                  </tr>
                ))}
                {actionRows.length === 0 && <EmptyRow colSpan={7} label="Aucune commande recue" />}
              </tbody>
            </table>
          </div>
          <Pagination label="Pagination des actions" total={actionRows.length} page={actionMeta.safePage} pageCount={actionMeta.pageCount} startIndex={actionMeta.startIndex} endIndex={actionMeta.endIndex} onPageChange={setActionPage} />
        </>
      )}
    </section>
  );
}
