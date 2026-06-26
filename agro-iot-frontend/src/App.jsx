import React, { useState } from "https://esm.sh/react@19.1.1";
import { navItems } from "./data/mockData.js";
import { Sidebar } from "./layout/Sidebar.jsx";
import { Header } from "./layout/Header.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { HistoryPage } from "./pages/HistoryPage.jsx";
import { AlertsPage } from "./pages/AlertsPage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard");

  function login(user) {
    setCurrentUser(user);
    setIsLoggedIn(true);
  }

  function logout() {
    setCurrentUser(null);
    setIsLoggedIn(false);
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        navItems={navItems}
        setActivePage={setActivePage}
        onLogout={logout}
      />
      <main className="main-panel">
        <Header activePage={activePage} currentUser={currentUser} onLogout={logout} />
        {activePage === "Dashboard" && <DashboardPage />}
        {activePage === "Historique" && <HistoryPage />}
        {activePage === "Alertes" && <AlertsPage />}
        {activePage === "Administration" && <AdminPage />}
      </main>
    </div>
  );
}
