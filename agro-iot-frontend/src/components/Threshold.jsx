import React from "https://esm.sh/react@19.1.1";
export function Threshold({ name, value }) {
  return (
    <label className="threshold">
      <span>{name}</span>
      <input defaultValue={value} />
    </label>
  );
}

