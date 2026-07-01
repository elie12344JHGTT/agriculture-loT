import React, { useEffect, useMemo, useState } from "https://esm.sh/react@19.1.1";
import { navItems } from "./data/mockData.js";
import { Sidebar } from "./layout/Sidebar.jsx";
import { Header } from "./layout/Header.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { HistoryPage } from "./pages/HistoryPage.jsx";
import { AlertsPage } from "./pages/AlertsPage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import api from "./api/axios";

const pagesByRole = {
  Admin: ["Dashboard", "Historique", "Alertes", "Administration"],
  Agriculteur: ["Dashboard", "Historique", "Alertes"],
  Technicien: ["Dashboard", "Historique", "Alertes"]
};

function getPagesForRole(role) {
  return pagesByRole[role] || pagesByRole.Agriculteur;
}

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard");

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
    if (isLoggedIn && !allowedNavItems.includes(activePage)) {
      setActivePage(allowedNavItems[0]);
    }
  }, [activePage, allowedNavItems, isLoggedIn]);

  // Remplacer cet etat local par la reponse de l API Laravel /auth/login.
  function login(user) {
    const userPages = getPagesForRole(user?.role);
    setCurrentUser(user);
    setActivePage(userPages[0]);
    setIsLoggedIn(true);
  }

  // Appeler l API /auth/logout avant de vider la session cote frontend.
  function logout() {
    setCurrentUser(null);
    setActivePage("Dashboard");
    setIsLoggedIn(false);
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
