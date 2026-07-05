import React, { useState } from "react";
import userIcon from "../assets/icons/user-solid.png";
import logoutIcon from "../assets/icons/power-off-solid.png";
import terminalIcon from "../assets/icons/terminal-solid.png";

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
            {hasTerminalAccess && activePage !== "Terminal" && (
              <button type="button" onClick={openTerminal}>
                <img className="profile-dropdown-icon" src={terminalIcon} alt="" />
                <span>Terminal</span>
              </button>
            )}
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
