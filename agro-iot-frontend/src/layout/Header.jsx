import React, { useState } from "react";
import userIcon from "../assets/icons/user-solid.png";
import logoutIcon from "../assets/icons/power-off-solid.png";
import terminalIcon from "../assets/icons/terminal-solid.png";
import bellIcon from "../assets/icons/bell-solid.png";
import menuIcon from "../assets/icons/bars-solid.png";

export function Header({
  activePage,
  currentUser,
  navItems,
  setActivePage,
  onLogout,
  onToggleMobileMenu
}) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountLabel = currentUser?.role || currentUser?.name || "Admin";
  const hasTerminalAccess = navItems.includes("Terminal");

  function logout() {
    setIsAccountOpen(false);
    onLogout();
  }

  function openTerminal() {
    setIsAccountOpen(false);
    setActivePage("Terminal");
  }

  const pageTitles = {
    Dashboard: "Dashboard",
    Historique: "Historique des mesures",
    Alertes: "Gestion des alertes",
    Administration: "Administration",
    Terminal: "Terminal de l'appareil"
  };

  const statusLabels = {
    Dashboard: "Système en ligne",
    Historique: "Historique actif",
    Alertes: "Surveillance active",
    Administration: "Panneau sécurisé",
    Terminal: "Connexion en direct"
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {onToggleMobileMenu && (
          <button
            className="mobile-hamburger-btn"
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Ouvrir le menu de navigation"
          >
            <img src={menuIcon} alt="" className="hamburger-icon" />
          </button>
        )}

        <div className="topbar-title">
          <h1>{pageTitles[activePage] || activePage}</h1>
          <div className="topbar-status">
            <span className="status-dot" aria-hidden="true" />
            <span>{statusLabels[activePage] || "Agro IoT"}</span>
          </div>
        </div>
      </div>

      <div className="topbar-actions">
        <button className="topbar-icon-button" type="button" title="Connexion réseau" aria-label="Connexion réseau">
          <span className="wifi-symbol" aria-hidden="true"><i /><i /><i /><b /></span>
        </button>
        <button
          className="topbar-icon-button notification-button"
          type="button"
          title="Notifications"
          aria-label="Notifications"
          onClick={() => setActivePage("Alertes")}
        >
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
