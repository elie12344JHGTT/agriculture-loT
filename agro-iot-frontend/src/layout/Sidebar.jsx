import React, { useState } from "react";
import logoCompact from "../assets/logos/logo_font_transparant.png";
import menuIcon from "../assets/icons/bars-solid.png";
import dashboardIcon from "../assets/icons/house-solid.png";
import historyIcon from "../assets/icons/clock-rotate-left-solid.png";
import alertsIcon from "../assets/icons/bell-solid.png";
import adminIcon from "../assets/icons/users-gear-solid.png";
import logoutIcon from "../assets/icons/power-off-solid.png";
import terminalIcon from "../assets/icons/terminal-solid.png";
import dropletIcon from "../assets/icons/droplet.png";

const navIcons = {
  Dashboard: dashboardIcon,
  Historique: historyIcon,
  Alertes: alertsIcon,
  Administration: adminIcon,
  Terminal: terminalIcon
};

export function Sidebar({ activePage, navItems, setActivePage, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function selectPage(page) {
    setActivePage(page);
    setIsMenuOpen(false);
  }

  function logout() {
    setIsMenuOpen(false);
    onLogout();
  }

  return (
    <aside className={`sidebar ${isMenuOpen ? "menu-open" : ""}`}>
      <div className="sidebar-topline">
        <div className="sidebar-brand">
          <div className="sidebar-logo-wrap">
            <img className="sidebar-logo" src={logoCompact} alt="Logo Agro IoT" />
          </div>
          <div className="sidebar-brand-copy">
            <strong>Agro IoT</strong>
            <span>Serre connectée</span>
          </div>
        </div>
        <button
          className="menu-toggle"
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label="Ouvrir le menu"
          aria-expanded={isMenuOpen}
          aria-controls="sidebar-menu"
        >
          <img className="menu-toggle-icon" src={menuIcon} alt="" />
        </button>
      </div>

      <div className="sidebar-menu" id="sidebar-menu">
        <nav className="sidebar-nav" aria-label="Navigation principale">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              data-page={item}
              className={`sidebar-nav-item ${activePage === item ? "active" : ""}`}
              onClick={() => selectPage(item)}
            >
              <span className="sidebar-nav-icon-wrap">
                <img className="nav-icon" src={navIcons[item]} alt="" />
              </span>
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {navItems.includes("Dashboard") && (
            <button className="sidebar-irrigation" type="button" onClick={() => selectPage("Dashboard")}>
              <span className="sidebar-irrigation-icon"><img src={dropletIcon} alt="" /></span>
              <span>Contrôle irrigation</span>
              <span className="sidebar-arrow" aria-hidden="true">→</span>
            </button>
          )}
          <button className="logout-button" type="button" onClick={logout}>
            <span className="sidebar-nav-icon-wrap"><img className="nav-icon" src={logoutIcon} alt="" /></span>
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
