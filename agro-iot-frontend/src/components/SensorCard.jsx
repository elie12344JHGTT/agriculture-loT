import React from "react";
import thermometerIcon from "../assets/icons/thermometer.png";
import airConditionerIcon from "../assets/icons/air-conditioner.png";
import floodIcon from "../assets/icons/flood.png";
import carbonNeutralIcon from "../assets/icons/carbon-neutral.png";
import lightIcon from "../assets/icons/light-bulb.png";
import dropletIcon from "../assets/icons/droplet.png";

const sensorIcons = {
  Temperature: thermometerIcon,
  "Humidite air": airConditionerIcon,
  "Humidite sol": floodIcon,
  CO2: carbonNeutralIcon,
  Luminosite: lightIcon,
  "Niveau eau": dropletIcon
};

function getSensorState(card) {
  if (card.status === "Chargement" || card.status === "--") {
    return "waiting";
  }

  const value = Number(card.value);
  if (Number.isNaN(value)) {
    return "ok";
  }

  if (card.label === "Temperature") {
    if (value < 10 || value > 35) return "danger";
    if (value < 15 || value > 30) return "warning";
  }

  if (card.label === "Humidite air" || card.label === "Humidite sol" || card.label === "Niveau eau") {
    if (value < 20) return "danger";
    if (value < 35) return "warning";
  }

  if (card.label === "CO2") {
    if (value > 1000) return "danger";
    if (value > 700) return "warning";
  }

  if (card.label === "Luminosite" && value < 150) {
    return "warning";
  }

  return "ok";
}

export function SensorCard({ card }) {
  const icon = sensorIcons[card.label];
  const state = getSensorState(card);
  const stateLabel = state === "danger" ? "Critique" : state === "warning" ? "Attention" : state === "waiting" ? "Attente" : "OK";

  return (
    <article className={`sensor-card ${card.tone} sensor-${state}`}>
      <div className="sensor-card-header">
        <span>{card.label}</span>
        {icon && <img className="sensor-card-icon" src={icon} alt="" />}
      </div>
      <strong>{card.value}<small>{card.unit}</small></strong>
      <div className="sensor-card-footer">
        <em>{card.status}</em>
        <span className={`status-badge ${state}`}>{stateLabel}</span>
      </div>
    </article>
  );
}
