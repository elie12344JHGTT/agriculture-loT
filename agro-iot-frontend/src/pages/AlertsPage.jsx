import React, { useMemo, useState } from "https://esm.sh/react@19.1.1";
import { Panel } from "../components/Panel.jsx";

// A alimenter avec GET /alerts/active.
const activeAlerts = [];

// Seuils par defaut affiches en attendant GET /thresholds.
const initialThresholds = [
  { key: "soil_humidity_min", label: "Humidite sol minimale", value: 30, unit: "%", rule: "Declencher irrigation" },
  { key: "temperature_max", label: "Temperature maximale", value: 35, unit: "C", rule: "Generer alerte temperature" },
  { key: "co2_max", label: "CO2 maximal", value: 600, unit: "ppm", rule: "Activer ventilation" },
  { key: "light_min", label: "Luminosite minimale", value: 300, unit: "lux", rule: "Allumer eclairage" },
  { key: "water_level_min", label: "Niveau eau minimal", value: 40, unit: "%", rule: "Generer alerte reservoir" }
];

const automationRules = [
  { condition: "Humidite sol < seuil", action: "Irrigation", status: "Inactive" },
  { condition: "CO2 > seuil", action: "Ventilation", status: "Inactive" },
  { condition: "Luminosite < seuil", action: "Eclairage", status: "Inactive" },
  { condition: "Niveau eau < seuil", action: "Alerte intervention", status: "Inactive" }
];

// A alimenter lorsque le backend expose les canaux de notification.
const notificationChannels = [];

function normalizeThresholds(thresholds) {
  return JSON.stringify(thresholds.map(({ key, value }) => ({ key, value: String(value) })));
}

export function AlertsPage() {
  const [thresholds, setThresholds] = useState(initialThresholds);
  const [savedThresholds, setSavedThresholds] = useState(initialThresholds);
  const [saveStatus, setSaveStatus] = useState("saved");

  const hasUnsavedChanges = useMemo(
    () => normalizeThresholds(thresholds) !== normalizeThresholds(savedThresholds),
    [thresholds, savedThresholds]
  );

  function updateThreshold(key, value) {
    setThresholds((current) => current.map((threshold) => (
      threshold.key === key ? { ...threshold, value } : threshold
    )));
    setSaveStatus("editing");
  }

  // A connecter a PUT /thresholds pour enregistrer les seuils dans Laravel.
  function saveThresholds() {
    setSavedThresholds(thresholds);
    setSaveStatus("saved");
  }

  return (
    <section className="alerts-workspace">
      <Panel title="Alertes actives">
        <div className="alerts-empty-state">
          <strong>Aucune alerte active</strong>
          <span>Les alertes seront affichees apres reception des mesures depuis l'API.</span>
        </div>
        {activeAlerts.length > 0 && (
          <div className="alert-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Parcelle</th>
                  <th>Type</th>
                  <th>Niveau</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeAlerts.map((alert) => (
                  <tr key={alert.id_alerte}>
                    <td>{alert.date_creation}</td>
                    <td>{alert.parcelle}</td>
                    <td>{alert.type_alerte}</td>
                    <td>{alert.niveau}</td>
                    <td>{alert.statut}</td>
                    <td>{alert.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Seuils critiques">
        <div className="threshold-save-bar">
          <span className={hasUnsavedChanges ? "status-warning" : "status-saved"}>
            {hasUnsavedChanges ? "Modifications non enregistrees" : "Seuils enregistres"}
          </span>
          <button className="primary-button small" type="button" onClick={saveThresholds} disabled={!hasUnsavedChanges}>
            Enregistrer
          </button>
        </div>

        <div className="threshold-grid detailed">
          {thresholds.map((threshold) => (
            <label className="threshold-card" key={threshold.key}>
              <span>{threshold.label}</span>
              <div className="threshold-input-group">
                <input value={threshold.value} onChange={(event) => updateThreshold(threshold.key, event.target.value)} />
                <em>{threshold.unit}</em>
              </div>
              <small>{threshold.rule}</small>
            </label>
          ))}
        </div>
      </Panel>

      <Panel title="Regles automatiques">
        <div className="automation-rule-list">
          {automationRules.map((rule) => (
            <article className="automation-rule" key={`${rule.condition}-${rule.action}`}>
              <div>
                <span>{rule.condition}</span>
                <strong>{rule.action}</strong>
              </div>
              <em>{rule.status}</em>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Notifications">
        {notificationChannels.length === 0 && (
          <div className="alerts-empty-state">
            <strong>Aucun canal configure</strong>
            <span>Les notifications seront affichees apres configuration depuis l'API.</span>
          </div>
        )}
        {notificationChannels.length > 0 && (
          <div className="notification-list">
            {notificationChannels.map((notification) => (
              <article className="notification-row" key={`${notification.channel}-${notification.recipient}`}>
                <div>
                  <strong>{notification.channel}</strong>
                  <span>{notification.recipient}</span>
                </div>
                <em>{notification.status}</em>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </section>
  );
}

