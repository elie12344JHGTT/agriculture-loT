import React, { useState } from "react";
import api from "../api/axios";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setLoginError("");

    try {
      const response = await api.post("/api/auth/login", { email, password });
      onLogin(response.data.user, response.data.token);
    } catch (error) {
      setLoginError(error.response?.data?.message || "Impossible de se connecter. Vérifiez vos identifiants.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-screen">
      {/* Visual banner: Visible on PC & Tablet, hidden on Mobile */}
      <section className="login-visual" aria-label="Présentation Agro IoT">
        <div className="login-brand">
          <div className="login-brand-mark">
            <img src={logoAvecNom} alt="Logo Agro IoT" />
          </div>
          <div className="login-brand-copy">
            <strong>Agro IoT</strong>
            <span>Agriculture intelligente</span>
          </div>
        </div>

        <div className="login-copy">
          <p className="login-kicker">Plateforme de supervision agricole</p>
          <h1>Une agriculture plus <span>intelligente.</span></h1>
          <p>
            Suivez vos cultures, surveillez les conditions de vos parcelles et
            pilotez vos équipements depuis un seul espace.
          </p>
        </div>

        <div className="login-features" aria-label="Données surveillées">
          {[
            [thermometerIcon, "Température"],
            [humidityIcon, "Humidité"],
            [carbonIcon, "CO₂"],
            [lightIcon, "Luminosité"],
          ].map(([icon, label]) => (
            <div className="login-feature" key={label}>
              <div className="login-feature-icon">
                <img src={icon} alt="" />
              </div>
              <strong>{label}</strong>
            </div>
          ))}
        </div>

        <p className="login-visual-footer">
          Supervision en temps réel <span>•</span> Données connectées <span>•</span> Décisions éclairées
        </p>
      </section>

      {/* Form panel: Centered and responsive everywhere */}
      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-brand">
            <div className="login-brand-mark-card">
              <img src={logoAvecNom} alt="Logo Agro IoT" />
            </div>
            <div className="login-brand-text">
              <strong>Agro IoT</strong>
              <span>Serre connectée & supervision</span>
            </div>
          </div>

          <header className="login-card-header">
            <span className="login-card-eyebrow">Espace sécurisé</span>
            <h2>Bienvenue</h2>
            <p className="login-card-subtitle">
              Connectez-vous pour accéder à votre tableau de bord Agro IoT.
            </p>
          </header>

          <form className="login-form" onSubmit={submit}>
            <label className="login-field-label" htmlFor="email">
              Adresse e-mail
            </label>
            <div className="login-field">
              <img src={emailIcon} alt="" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="exemple@agro-iot.com"
                autoComplete="email"
                required
              />
            </div>

            <label className="login-field-label" htmlFor="password">
              Mot de passe
            </label>
            <div className="login-field password-field">
              <img src={passwordIcon} alt="" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                required
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

            {loginError && <div className="login-error" role="alert">{loginError}</div>}

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <div className="login-account-help">
            <div className="login-account-help-icon" aria-hidden="true">i</div>
            <div>
              <strong>Besoin d'aide avec votre compte ?</strong>
              <p>
                Pour créer un compte ou réinitialiser votre mot de passe,
                veuillez contacter votre administrateur système.
              </p>
            </div>
          </div>

          <p className="login-card-footer">
            Accès réservé aux utilisateurs autorisés. <strong>Agro IoT</strong>
          </p>
        </div>
      </section>
    </main>
  );
}
