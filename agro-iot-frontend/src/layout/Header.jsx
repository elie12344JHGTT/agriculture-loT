import React, { useState } from "react";
import userIcon from "../assets/icons/user-solid.png";
import logoutIcon from "../assets/icons/power-off-solid.png";
import terminalIcon from "../assets/icons/terminal-solid.png";
import bellIcon from "../assets/icons/bell-solid.png";

export function Header({ activePage, currentUser, navItems, setActivePage, onLogout }) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountLabel = currentUser?.role || currentUser?.name || "Utilisateur";
  const hasTerminalAccess = navItems.includes("Terminal");

  function logout() {
    setIsAccountOpen(false);
    onLogout();
  }

  function openTerminal() {
    setIsAccountOpen(false);
    setActivePage("Terminal");
  }

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>{activePage === "Historique" ? "Historique des mesures" : activePage === "Terminal" ? "Terminal de l'appareil" : activePage}</h1>
        <div className="topbar-status">
          <span className="status-dot" aria-hidden="true" />
          <span>{activePage === "Dashboard" ? "Système en ligne" : activePage === "Historique" ? "System Online" : activePage === "Terminal" ? "Connexion en direct" : "Agro IoT"}</span>
        </div>
      </div>

      <div className="topbar-actions">
        <button className="topbar-icon-button" type="button" title="Connexion réseau" aria-label="Connexion réseau">
          <span className="wifi-symbol" aria-hidden="true"><i /><i /><i /><b /></span>
        </button>
        <button className="topbar-icon-button notification-button" type="button" title="Notifications" aria-label="Notifications">
          <img src={bellIcon} alt="" />
          <span className="notification-dot" aria-hidden="true" />
        </button>
        <span className="topbar-divider" aria-hidden="true" />

        <div className="profile-menu">
          <button
            className="profile-chip"
            type="button"
            onClick={() => setIsAccountOpen((open) => !open)}
            aria-label="Ouvrir le menu utilisateur"
            aria-expanded={isAccountOpen}
          >
            <span className="profile-avatar">
              <img className="profile-icon" src={userIcon} alt="" />
            </span>
            <span className="profile-label">{accountLabel}</span>
            <span className={`profile-chevron ${isAccountOpen ? "open" : ""}`} aria-hidden="true">⌄</span>
          </button>
          {isAccountOpen && (
            <div className="profile-dropdown">
              {hasTerminalAccess && activePage !== "Terminal" && (
                <button type="button" onClick={openTerminal}>
                  <img className="profile-dropdown-icon" src={terminalIcon} alt="" />
                  <span>Terminal</span>
                </button>
              )}
              <button type="button" onClick={logout}>
                <img className="profile-dropdown-icon" src={logoutIcon} alt="" />
                <span>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
