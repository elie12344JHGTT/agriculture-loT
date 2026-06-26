import React, { useMemo } from "https://esm.sh/react@19.1.1";
import { sensorCards } from "../data/mockData.js";
import { ActionButton } from "../components/ActionButton.jsx";
import { AlertItem } from "../components/AlertItem.jsx";
import { LineChart } from "../components/LineChart.jsx";
import { Panel } from "../components/Panel.jsx";
import { Rule } from "../components/Rule.jsx";
import { SensorCard } from "../components/SensorCard.jsx";

// Valeurs d attente avant reception des dernieres mesures depuis GET /measurements/latest.
const waitingReadings = {
  Temperature: 0,
  "Humidite air": 0,
  "Humidite sol": 0,
  CO2: 0,
  Luminosite: 0,
  "Niveau eau": 0
};

// A remplacer par les alertes recues depuis GET /alerts/active.
const apiWaitingAlert = {
  title: "Aucune alerte active",
  detail: "Les seuils seront controles apres reception des mesures",
  level: "OK",
  time: "--"
};

export function DashboardPage() {
  // Prepare les cartes capteurs avec un format stable pour le futur branchement API.
  const waitingCards = useMemo(() => sensorCards.map((card) => ({
    ...card,
    value: String(waitingReadings[card.label]),
    status: "--"
  })), []);

  return (
    <section className="page-grid">
      <div className="sensor-grid">
        {waitingCards.map((card) => <SensorCard key={card.label} card={card} />)}
      </div>
      <div className="content-grid">
        <Panel title="Evolution des mesures">
          <LineChart />
        </Panel>
        <Panel title="Controle des actionneurs">
          <div className="actions-stack">
            <ActionButton label="Demarrer irrigation" detail="Inactif" disabled />
            <ActionButton label="Activer ventilation" detail="Inactif" disabled />
            <ActionButton label="Allumer eclairage" detail="Inactif" disabled />
          </div>
        </Panel>
        <Panel title="Alertes recentes">
          <div className="alert-list compact">
            <AlertItem alert={apiWaitingAlert} />
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

