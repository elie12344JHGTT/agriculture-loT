import React, { useState } from "https://esm.sh/react@19.1.1";
import logoAvecNom from "../assets/logos/agri_logo-transparante.png";
import thermometerIcon from "../assets/icons/thermometer.png";
import humidityIcon from "../assets/icons/humidity.png";
import carbonIcon from "../assets/icons/carbon-dioxide.png";
import lightIcon from "../assets/icons/light-bulb.png";
import emailIcon from "../assets/icons/email.png";
import passwordIcon from "../assets/icons/locked-computer.png";
import showIcon from "../assets/icons/show.png";
import hideIcon from "../assets/icons/hide.png";




export function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("admin@agroiot.cd");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);

  // A connecter a POST /auth/login lorsque le backend Laravel sera disponible.
  function submit(event) {
    event.preventDefault();
    // Role temporaire pour la maquette; le backend renverra le vrai role utilisateur.
    const role = email.toLowerCase().includes("admin") ? "Admin" : "Agriculteur";
    onLogin({ email, role });
  }

  return (
    <main className="login-screen">
      <section className="login-visual">
        <img className="login-logo" src={logoAvecNom} alt="Logo Agriculture Intelligente IoT" />
        <h1>Agriculture Intelligente IoT</h1>
        <p>Suivi des cultures, alertes et controle des actionneurs en temps reel.</p>
        <div className="field-preview">
          <div className="field-icon-card">
            <img src={thermometerIcon} alt="Temperature" />
          </div>
          <div className="field-icon-card">
            <img src={humidityIcon} alt="Humidite" />
          </div>
          <div className="field-icon-card">
            <img src={carbonIcon} alt="CO2" />
          </div>
          <div className="field-icon-card">
            <img src={lightIcon} alt="Luminosite" />
          </div>
        </div>
      </section>
      <section className="login-card">
        <h2>Connexion</h2>
        <form onSubmit={submit}>
          <label htmlFor="email">Email</label>
          <div className="input-with-icon">
            <img src={emailIcon} alt="" />
            <input id="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <label htmlFor="password">Mot de passe</label>
          <div className="input-with-icon password-field">
            <img src={passwordIcon} alt="" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              <img src={showPassword ? hideIcon : showIcon} alt="" />
            </button>
          </div>
          <button className="primary-button" type="submit">Se connecter</button>
        </form>
        <div className="account-help">
          <strong>Gestion des comptes et mots de passe</strong>
          <p>Pour toute creation de compte ou reinitialisation de mot de passe, veuillez contacter votre Administrateur systeme.</p>
        </div>
      </section>
    </main>
  );
}

