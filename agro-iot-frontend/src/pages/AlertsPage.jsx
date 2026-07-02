import React, { useEffect, useMemo, useState } from "https://esm.sh/react@19.1.1";
import api from "../api/axios";
import { logAudit } from "../api/audit";
import { Panel } from "../components/Panel.jsx";


function normalizeThresholds(thresholds) {
  return JSON.stringify(thresholds.map(({ id, key, value }) => ({ id, key, value: String(value) })));
}

function getAlertId(alert) {
  return String(alert.id_alerte ?? "").replace("ALT-", "");
}

export function AlertsPage() {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [thresholds, setThresholds] = useState([]);
  const [savedThresholds, setSavedThresholds] = useState([]);
  const [notificationChannels, setNotificationChannels] = useState([]);
  const [automationRules, setAutomationRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState("saved");

  const hasUnsavedChanges = useMemo(
    () => normalizeThresholds(thresholds) !== normalizeThresholds(savedThresholds),
    [thresholds, savedThresholds]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadAlertsData() {
      setIsLoading(true);
      setLoadError("");

      try {
        const [alertsResponse, thresholdsResponse, notificationsResponse, rulesResponse] = await Promise.all([
          api.get("/api/alerts/active", { params: { limit: 100 } }),
          api.get("/api/thresholds"),
          api.get("/api/notifications/channels"),
          api.get("/api/automation-rules")
        ]);

        if (!isMounted) {
          return;
        }

        const thresholdsRows = thresholdsResponse.data ?? [];
        setActiveAlerts(alertsResponse.data ?? []);
        setThresholds(thresholdsRows);
        setSavedThresholds(thresholdsRows);
        setNotificationChannels(notificationsResponse.data ?? []);
        setAutomationRules(rulesResponse.data ?? []);
        setSaveStatus("saved");
      } catch (error) {
        if (isMounted) {
          setLoadError("Impossible de charger les alertes depuis Laravel");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAlertsData();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateThreshold(key, value) {
    setThresholds((current) => current.map((threshold) => (
      threshold.key === key ? { ...threshold, value } : threshold
    )));
    setSaveStatus("editing");
  }

  async function saveThresholds() {
    setSaveStatus("saving");

    try {
      const response = await api.put("/api/thresholds", thresholds.map(({ id, key, value }) => ({ id, key, value })));
      const updatedThresholds = response.data ?? thresholds;
      setThresholds(updatedThresholds);
      setSavedThresholds(updatedThresholds);
      setSaveStatus("saved");
      logAudit({ page: "Alertes", action: "Modification seuils critiques", details: `${thresholds.length} seuil(s) enregistre(s)` });
    } catch (error) {
      setSaveStatus("error");
    }
  }

  async function resolveAlert(alert) {
    const alertId = getAlertId(alert);

    if (!alertId) {
      return;
    }

    try {
      await api.put(`/api/alerts/${alertId}/resolve`);
      setActiveAlerts((current) => current.filter((item) => item.id_alerte !== alert.id_alerte));
      logAudit({ page: "Alertes", action: "Alerte active resolue", details: `${alert.id_alerte} - ${alert.type_alerte || "Alerte"}` });
    } catch (error) {
      setLoadError("Impossible de traiter cette alerte");
    }
  }

  const thresholdStatusLabel = saveStatus === "saving"
    ? "Enregistrement..."
    : saveStatus === "error"
      ? "Erreur lors de l'enregistrement"
      : hasUnsavedChanges
        ? "Modifications non enregistrees"
        : "Seuils enregistres";

  return (
    <section className="alerts-workspace">
      <Panel title="Alertes actives">
        {activeAlerts.length === 0 && (
          <div className="alerts-empty-state">
            <strong>{loadError || (isLoading ? "Chargement des alertes..." : "Aucune alerte active")}</strong>
            <span>Les alertes seront affichees apres reception des mesures depuis l'API.</span>
          </div>
        )}
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
                    <td>{alert.date_creation || alert.date}</td>
                    <td>{alert.parcelle}</td>
                    <td>{alert.type_alerte}</td>
                    <td>{alert.niveau || alert.niveau_criticite}</td>
                    <td>{alert.statut}</td>
                    <td>
                      <button className="toolbar-button" type="button" onClick={() => resolveAlert(alert)}>
                        Traiter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Seuils critiques">
        <div className="threshold-save-bar">
          <span className={hasUnsavedChanges || saveStatus === "error" ? "status-warning" : "status-saved"}>
            {thresholdStatusLabel}
          </span>
          <button className="primary-button small" type="button" onClick={saveThresholds} disabled={!hasUnsavedChanges || saveStatus === "saving"}>
            Enregistrer
          </button>
        </div>

        {thresholds.length === 0 && (
          <div className="alerts-empty-state">
            <strong>{isLoading ? "Chargement des seuils..." : "Aucun seuil configure"}</strong>
            <span>Les seuils seront affiches lorsque Laravel les fournira.</span>
          </div>
        )}

        {thresholds.length > 0 && (
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
        )}
      </Panel>

      <Panel title="Regles automatiques">
        {automationRules.length === 0 && (
          <div className="alerts-empty-state">
            <strong>{isLoading ? "Chargement des regles..." : "Aucune regle configuree"}</strong>
            <span>Les regles automatiques seront affichees lorsque Laravel les fournira.</span>
          </div>
        )}
        {automationRules.length > 0 && (
          <div className="automation-rule-list">
            {automationRules.map((rule) => (
              <article className="automation-rule" key={rule.id || `${rule.condition}-${rule.action}`}>
                <div>
                  <span>{rule.condition}</span>
                  <strong>{rule.action}</strong>
                </div>
                <em>{rule.status}</em>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Notifications">
        {notificationChannels.length === 0 && (
          <div className="alerts-empty-state">
            <strong>{isLoading ? "Chargement des notifications..." : "Aucun canal configure"}</strong>
            <span>Les notifications seront affichees apres configuration depuis l'API.</span>
          </div>
        )}
        {notificationChannels.length > 0 && (
          <div className="notification-list">
            {notificationChannels.map((notification) => (
              <article className="notification-row" key={notification.id || `${notification.channel}-${notification.recipient}`}>
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




