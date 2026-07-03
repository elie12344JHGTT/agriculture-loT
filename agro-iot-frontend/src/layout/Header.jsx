import React, { useState } from "react";
import userIcon from "../assets/icons/user-solid.png";
import logoutIcon from "../assets/icons/power-off-solid.png";

export function Header({ activePage, currentUser, onLogout }) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountLabel = currentUser?.role || currentUser?.name || "Utilisateur";

  function logout() {
    setIsAccountOpen(false);
    onLogout();
  }

  return (
    <header className="topbar">
      <h1>{activePage}</h1>
      <div className="profile-menu">
        <button
          className="profile-chip"
          type="button"
          onClick={() => setIsAccountOpen((open) => !open)}
          aria-label="Ouvrir le menu utilisateur"
          aria-expanded={isAccountOpen}
        >
          <img className="profile-icon" src={userIcon} alt="" />
          <span>{accountLabel}</span>
        </button>
        {isAccountOpen && (
          <div className="profile-dropdown">
            <button type="button" onClick={logout}>
              <img className="profile-dropdown-icon" src={logoutIcon} alt="" />
              <span>Deconnexion</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
