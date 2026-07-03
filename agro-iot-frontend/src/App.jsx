import React, { useEffect, useMemo, useState } from "react";
import { navItems } from "./data/mockData.js";
import { Sidebar } from "./layout/Sidebar.jsx";
import { Header } from "./layout/Header.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { HistoryPage } from "./pages/HistoryPage.jsx";
import { AlertsPage } from "./pages/AlertsPage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import api from "./api/axios";
import { logAudit, setCurrentAuditUser } from "./api/audit";

const pagesByRole = {
  Admin: ["Dashboard", "Historique", "Alertes", "Administration"],
  Agriculteur: ["Dashboard", "Historique", "Alertes"],
  Technicien: ["Dashboard", "Historique", "Alertes"]
};

const AUTH_STORAGE_KEY = "agro-iot-auth";

function getPagesForRole(role) {
  return pagesByRole[role] || pagesByRole.Agriculteur;
}

function readStoredAuth() {
  try {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    return storedAuth ? JSON.parse(storedAuth) : null;
  } catch (error) {
    console.error("Session locale invalide :", error);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

const storedAuth = readStoredAuth();

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(storedAuth?.user));
  const [currentUser, setCurrentUser] = useState(storedAuth?.user || null);
  const [activePage, setActivePage] = useState(storedAuth?.activePage || "Dashboard");

  const allowedNavItems = useMemo(() => {
    const allowedPages = getPagesForRole(currentUser?.role);
    return navItems.filter((item) => allowedPages.includes(item));
  }, [currentUser?.role]);

  // Test temporaire ajoute pour verifier la communication avec Laravel.
  useEffect(() => {
    api.get("/api/test-connection")
      .then((response) => {
        console.log("Connexion au backend reussie :", response.data);
      })
      .catch((error) => {
        console.error("Erreur de connexion au backend :", error);
      });
  }, []);

  useEffect(() => {
    setCurrentAuditUser(currentUser);

    if (currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: currentUser, activePage }));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [activePage, currentUser]);

  useEffect(() => {
    if (isLoggedIn && !allowedNavItems.includes(activePage)) {
      setActivePage(allowedNavItems[0]);
    }
  }, [activePage, allowedNavItems, isLoggedIn]);

  function login(user) {
    const userPages = getPagesForRole(user?.role);
    setCurrentAuditUser(user);
    setCurrentUser(user);
    setActivePage(userPages[0]);
    setIsLoggedIn(true);
  }

  async function logout() {
    try {
      await api.post("/api/auth/logout", {
        session_id: currentUser?.audit_session_id,
        user_id: currentUser?.id,
        user_name: currentUser?.name || currentUser?.nom,
        user_email: currentUser?.email,
        user_role: currentUser?.role
      });
    } catch (error) {
      console.error("Erreur lors de la deconnexion :", error);
    } finally {
      setCurrentAuditUser(null);
      setCurrentUser(null);
      setActivePage("Dashboard");
      setIsLoggedIn(false);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  useEffect(() => {
    if (isLoggedIn && activePage) {
      logAudit({
        page: activePage,
        action: `Consultation page ${activePage}`,
        details: `Ouverture de la page ${activePage}`
      });
    }
  }, [activePage, isLoggedIn]);

  if (!isLoggedIn) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        navItems={allowedNavItems}
        setActivePage={setActivePage}
        onLogout={logout}
      />
      <main className="main-panel">
        <Header activePage={activePage} currentUser={currentUser} onLogout={logout} />
        {activePage === "Dashboard" && <DashboardPage />}
        {activePage === "Historique" && <HistoryPage />}
        {activePage === "Alertes" && <AlertsPage />}
        {currentUser?.role === "Admin" && activePage === "Administration" && <AdminPage />}
      </main>
    </div>
  );
}

export default App;
