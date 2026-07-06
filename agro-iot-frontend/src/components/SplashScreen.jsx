import React from "react";
import logo from "../assets/logos/agri_logo-transparante.png";

export function SplashScreen() {
  return (
    <main className="splash-screen" aria-label="Chargement Agro IoT">
      <img className="splash-logo" src={logo} alt="Agro IoT" />
    </main>
  );
}

