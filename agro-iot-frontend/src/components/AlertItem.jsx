import React from "react";
import bellIcon from "../assets/icons/bell-solid.png";

export function AlertItem({ alert }) {
  return (
    <article className="alert-item">
      <img className="alert-icon" src={bellIcon} alt="" />
      <div>
        <strong>{alert.title}</strong>
        <span>{alert.detail}</span>
      </div>
      <em>{alert.level}</em>
      <small>{alert.time}</small>
    </article>
  );
}
