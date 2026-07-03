import React from "react";
export function Threshold({ name, value }) {
  return (
    <label className="threshold">
      <span>{name}</span>
      <input defaultValue={value} />
    </label>
  );
}
