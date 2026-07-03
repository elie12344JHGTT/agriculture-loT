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

export function SensorCard({ card }) {
  const icon = sensorIcons[card.label];

  return (
    <article className={`sensor-card ${card.tone}`}>
      <div className="sensor-card-header">
        <span>{card.label}</span>
        {icon && <img className="sensor-card-icon" src={icon} alt="" />}
      </div>
      <strong>{card.value}<small>{card.unit}</small></strong>
      <em>{card.status}</em>
    </article>
  );
}
