import React, { useState } from "react";
import logoCompact from "../assets/logos/logo_font_transparant.png";
import menuIcon from "../assets/icons/bars-solid.png";
import dashboardIcon from "../assets/icons/house-solid.png";
import historyIcon from "../assets/icons/clock-rotate-left-solid.png";
import alertsIcon from "../assets/icons/bell-solid.png";
import adminIcon from "../assets/icons/users-gear-solid.png";
import logoutIcon from "../assets/icons/power-off-solid.png";

const navIcons = {
  Dashboard: dashboardIcon,
  Historique: historyIcon,
  Alertes: alertsIcon,
  Administration: adminIcon
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
          <img className="sidebar-logo" src={logoCompact} alt="Logo Agro IoT" />
          <div>
            <strong>Agro IoT</strong>
            <span>Serre connectee</span>
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
        <nav>
          {navItems.map((item) => (
            <button key={item} className={activePage === item ? "active" : ""} onClick={() => selectPage(item)}>
              <img className="nav-icon" src={navIcons[item]} alt="" />
              <span>{item}</span>
            </button>
          ))}
        </nav>
        <button className="logout-button" onClick={logout}>
          <img className="nav-icon" src={logoutIcon} alt="" />
          <span>Deconnexion</span>
        </button>
      </div>
    </aside>
  );
}
