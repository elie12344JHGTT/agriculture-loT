import React from "react";
import logoCompact from "../assets/logos/logo_font_transparant.png";
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

export function Sidebar({
  activePage,
  navItems,
  setActivePage,
  onLogout,
  isMobileOpen = false,
  onCloseMobile = () => {}
}) {
  function selectPage(page) {
    setActivePage(page);
    onCloseMobile();
  }

  function logout() {
    onCloseMobile();
    onLogout();
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-backdrop ${isMobileOpen ? "open" : ""}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isMobileOpen ? "mobile-open" : ""}`}>
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
            className="sidebar-close-btn"
            type="button"
            onClick={onCloseMobile}
            aria-label="Fermer le menu"
          >
            ✕
          </button>
        </div>

        <div className="sidebar-menu" id="sidebar-menu">
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item}
                data-page={item}
                className={`sidebar-nav-item ${activePage === item ? "active" : ""}`}
                onClick={() => selectPage(item)}
              >
                <div className="sidebar-nav-icon-wrap">
                  <img className="nav-icon" src={navIcons[item]} alt="" />
                </div>
                <span>{item}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <div className="sidebar-irrigation">
              <span className="sidebar-irrigation-icon">
                <img src={dropletIcon} alt="" />
              </span>
              <span>Contrôle irrigation</span>
              <span className="sidebar-arrow" aria-hidden="true">→</span>
            </div>
            <button className="sidebar-nav-item logout-button" onClick={logout}>
              <div className="sidebar-nav-icon-wrap">
                <img className="nav-icon" src={logoutIcon} alt="" />
              </div>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
