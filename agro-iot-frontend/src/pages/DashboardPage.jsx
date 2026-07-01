import React, { useEffect, useMemo, useState } from "https://esm.sh/react@19.1.1";
import api from "../api/axios";
import { sensorCards } from "../data/mockData.js";
import { ActionButton } from "../components/ActionButton.jsx";
import { AlertItem } from "../components/AlertItem.jsx";
import { LineChart } from "../components/LineChart.jsx";
import { Panel } from "../components/Panel.jsx";
import { Rule } from "../components/Rule.jsx";
import { SensorCard } from "../components/SensorCard.jsx";

const sensorApiKeys = {
  Temperature: ["temperature", "temp"],
  "Humidite air": ["air_humidity", "humidite_air", "humidity"],
  "Humidite sol": ["soil_humidity", "humidite_sol"],
  CO2: ["co2", "CO2"],
  Luminosite: ["light", "luminosite"],
  "Niveau eau": ["water_level", "niveau_eau"]
};

const actionEndpoints = {
  irrigation: "/api/actuators/irrigation",
  ventilation: "/api/actuators/ventilation",
  light: "/api/actuators/light"
};

const apiWaitingAlert = {
  title: "Aucune alerte active",
  detail: "Les seuils seront controles apres reception des mesures",
  level: "OK",
  time: "--"
};

const initialActionStatus = {
  irrigation: "Pret",
  ventilation: "Pret",
  light: "Pret"
};

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("fr-FR");
}

function normalizeMeasurementValue(data, label) {
  const keys = sensorApiKeys[label] || [];
  const source = Array.isArray(data) ? data.find((item) => {
    const sensorName = `${item.type_mesure || item.type || item.capteur || item.capteur?.nom || item.capteur?.type || ""}`.toLowerCase();
    return keys.some((key) => sensorName.includes(key.toLowerCase())) || sensorName.includes(label.toLowerCase());
  }) : keys.map((key) => data?.[key]).find(Boolean);

  if (!source) return null;
  if (typeof source === "object") {
    return {
      value: source.value ?? source.valeur ?? 0,
      unit: source.unit ?? source.unite,
      status: source.status ?? source.statut ?? "Recu"
    };
  }

  return { value: source, status: "Recu" };
}

function normalizeAlerts(data) {
  const rows = Array.isArray(data) ? data : data?.rows || data?.data || [];
  return rows.map((alert) => ({
    title: alert.title || alert.type_alerte || "Alerte",
    detail: alert.detail || alert.message || "Alerte recue depuis le backend",
    level: alert.level || alert.niveau || alert.niveau_criticite || "Info",
    time: alert.time || formatDate(alert.date_creation || alert.date)
  }));
}

function normalizeChart(data) {
  const rows = Array.isArray(data) ? data : data?.rows || data?.data || [];

  if (Array.isArray(data?.labels) && Array.isArray(data?.series)) {
    return { labels: data.labels, series: data.series, unit: data.unit || "" };
  }

  return {
    labels: rows.map((row) => row.label || row.heure || formatDate(row.date_mesure || row.date)).slice(-8),
    series: rows.map((row) => Number(row.value ?? row.valeur ?? 0)).slice(-8),
    unit: rows[0]?.unit || rows[0]?.unite || ""
  };
}

export function DashboardPage() {
  const [latestMeasurements, setLatestMeasurements] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], series: [], unit: "" });
  const [actionStatus, setActionStatus] = useState(initialActionStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState("Connexion aux donnees Laravel...");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setIsLoading(true);
      setApiStatus("Connexion aux donnees Laravel...");

      const [measurementsResult, alertsResult, chartResult] = await Promise.allSettled([
        api.get("/api/measurements/latest"),
        api.get("/api/alerts/active"),
        api.get("/api/measurements/chart", { params: { type: "temperature", period: "day" } })
      ]);

      if (!isMounted) return;

      if (measurementsResult.status === "fulfilled") {
        setLatestMeasurements(measurementsResult.value.data);
      } else {
        setLatestMeasurements(null);
      }

      if (alertsResult.status === "fulfilled") {
        setAlerts(normalizeAlerts(alertsResult.value.data));
      } else {
        setAlerts([]);
      }

      if (chartResult.status === "fulfilled") {
        setChartData(normalizeChart(chartResult.value.data));
      } else {
        setChartData({ labels: [], series: [], unit: "" });
      }

      const hasAnyData = [measurementsResult, alertsResult, chartResult].some((result) => result.status === "fulfilled");
      setApiStatus(hasAnyData ? "Donnees synchronisees avec Laravel" : "En attente des routes API du dashboard");
      setIsLoading(false);
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = useMemo(() => sensorCards.map((card) => {
    const reading = normalizeMeasurementValue(latestMeasurements, card.label);
    return {
      ...card,
      value: String(reading?.value ?? 0),
      unit: reading?.unit || card.unit,
      status: isLoading ? "Chargement" : reading?.status || "--"
    };
  }), [isLoading, latestMeasurements]);

  async function sendAction(actionKey) {
    setActionStatus((current) => ({ ...current, [actionKey]: "Envoi..." }));

    try {
      const response = await api.post(actionEndpoints[actionKey], {
        command: "start",
        source: "manual"
      });

      const status = response.data?.status || response.data?.message || "Commande envoyee";
      setActionStatus((current) => ({ ...current, [actionKey]: status }));
    } catch (error) {
      const status = error.response?.status === 404 ? "Route API manquante" : "Echec envoi";
      setActionStatus((current) => ({ ...current, [actionKey]: status }));
    }
  }

  const visibleAlerts = alerts.length > 0 ? alerts : [apiWaitingAlert];

  return (
    <section className="page-grid">
      {!latestMeasurements && (
        <div className="dashboard-live-status waiting">
          <strong>Dashboard en attente</strong>
          <span>{apiStatus}</span>
        </div>
      )}
      <div className="sensor-grid">
        {cards.map((card) => <SensorCard key={card.label} card={card} />)}
      </div>
      <div className="content-grid">
        <Panel title="Evolution des mesures">
          <LineChart labels={chartData.labels} series={chartData.series} unit={chartData.unit} />
        </Panel>
        <Panel title="Controle des actionneurs">
          <div className="actions-stack">
            <ActionButton label="Demarrer irrigation" detail={actionStatus.irrigation} onToggle={() => sendAction("irrigation")} />
            <ActionButton label="Activer ventilation" detail={actionStatus.ventilation} onToggle={() => sendAction("ventilation")} />
            <ActionButton label="Allumer eclairage" detail={actionStatus.light} onToggle={() => sendAction("light")} />
          </div>
        </Panel>
        <Panel title="Alertes recentes">
          <div className="alert-list compact">
            {visibleAlerts.slice(0, 3).map((alert, index) => <AlertItem key={`${alert.title}-${index}`} alert={alert} />)}
          </div>
        </Panel>
        <Panel title="Regles automatiques">
          <div className="rules-list">
            <Rule condition="Humidite sol < 30%" action="Irrigation" enabled={false} status="Inactive" disabled />
            <Rule condition="CO2 > 600 ppm" action="Ventilation" enabled={false} status="Inactive" disabled />
            <Rule condition="Luminosite < 300 lux" action="Eclairage" enabled={false} status="Inactive" disabled />
          </div>
        </Panel>
      </div>
    </section>
  );
}




