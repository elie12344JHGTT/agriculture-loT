import React from "react";
export function DataTable({ rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Valeur</th>
            <th>Action</th>
            <th>Utilisateur</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.date}-${row.type}`}>
              <td>{row.date}</td>
              <td>{row.type}</td>
              <td>{row.value}</td>
              <td>{row.action}</td>
              <td>{row.user}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
