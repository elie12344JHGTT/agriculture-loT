import React, { useEffect, useMemo, useState } from "react";
import { navItems } from "./data/mockData.js";
import { Sidebar } from "./layout/Sidebar.jsx";
import { Header } from "./layout/Header.jsx";
import { SplashScreen } from "./components/SplashScreen.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { HistoryPage } from "./pages/HistoryPage.jsx";
import { AlertsPage } from "./pages/AlertsPage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import { TerminalPage } from "./pages/TerminalPage.jsx";
import api from "./api/axios";
import { logAudit, setCurrentAuditUser } from "./api/audit";

const pagesByRole = {
  Admin: ["Dashboard", "Historique", "Alertes", "Administration", "Terminal"],
  Agriculteur: ["Dashboard", "Historique", "Alertes"],
  Technicien: ["Dashboard", "Historique", "Alertes", "Terminal"]
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
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(storedAuth?.user && storedAuth?.token));
  const [currentUser, setCurrentUser] = useState(storedAuth?.token ? storedAuth?.user : null);
  const [activePage, setActivePage] = useState(storedAuth?.activePage || "Dashboard");
  const [authToken, setAuthToken] = useState(storedAuth?.token || "");
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsSplashVisible(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, []);

  const allowedNavItems = useMemo(() => {
    const allowedPages = getPagesForRole(currentUser?.role);
    return navItems.filter((item) => allowedPages.includes(item));
  }, [currentUser?.role]);


  useEffect(() => {
    setCurrentAuditUser(currentUser);

    if (currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: currentUser, activePage, token: authToken }));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [activePage, authToken, currentUser]);
  useEffect(() => {
    if (!authToken) {
      return;
    }

    let isMounted = true;

    api.get("/api/auth/me")
      .then((response) => {
        if (!isMounted) return;
        setCurrentAuditUser(response.data.user);
        setCurrentUser(response.data.user);
        setIsLoggedIn(true);
      })
      .catch(() => {
        if (!isMounted) return;
        setCurrentAuditUser(null);
        setCurrentUser(null);
        setAuthToken("");
        setIsLoggedIn(false);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      });

    return () => {
      isMounted = false;
    };
  }, [authToken]);


  useEffect(() => {
    if (isLoggedIn && !allowedNavItems.includes(activePage)) {
      setActivePage(allowedNavItems[0]);
    }
  }, [activePage, allowedNavItems, isLoggedIn]);

  function login(user, token) {
    const userPages = getPagesForRole(user?.role);
    setCurrentAuditUser(user);
    setCurrentUser(user);
    setAuthToken(token || "");
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
      setAuthToken("");
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

  if (isSplashVisible) {
    return <SplashScreen />;
  }

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
        <Header activePage={activePage} currentUser={currentUser} navItems={allowedNavItems} setActivePage={setActivePage} onLogout={logout} />
        {activePage === "Dashboard" && <DashboardPage />}
        {activePage === "Historique" && <HistoryPage />}
        {activePage === "Alertes" && <AlertsPage />}
        {currentUser?.role === "Admin" && activePage === "Administration" && <AdminPage />}
        {activePage === "Terminal" && <TerminalPage />}
      </main>
    </div>
  );
}

export default App;

