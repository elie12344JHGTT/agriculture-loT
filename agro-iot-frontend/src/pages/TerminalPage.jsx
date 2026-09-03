import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import { logAudit } from "../api/audit";

const actuatorAliases = {
  arrosage: "irrigation",
  arro: "irrigation",
  arrose: "irrigation",
  irrigation: "irrigation",
  irrig: "irrigation",
  pompe: "irrigation",
  eau: "irrigation",
  ventilation: "ventilation",
  vent: "ventilation",
  ventilateur: "ventilation",
  air: "ventilation",
  luminosite: "light",
  lum: "light",
  lumiere: "light",
  eclairage: "light",
  eclair: "light",
  light: "light",
  lampe: "light",
  tout: "all",
  tous: "all",
  all: "all",
};

const commandAliases = {
  start: "start",
  on: "start",
  go: "start",
  lancer: "start",
  demarrer: "start",
  demarre: "start",
  activer: "start",
  active: "start",
  allumer: "start",
  allume: "start",
  ouvrir: "start",
  marche: "start",
  stop: "stop",
  off: "stop",
  couper: "stop",
  coupe: "stop",
  arreter: "stop",
  arrete: "stop",
  eteindre: "stop",
  eteint: "stop",
  fermer: "stop",
  arret: "stop",
};

const helpLines = [
  { text: "Commandes disponibles :", type: "system" },
  { text: "", type: "system" },
  { text: "  arrosage start    Activer la pompe d'irrigation", type: "system" },
  { text: "  arrosage stop     Arreter la pompe d'irrigation", type: "system" },
  { text: "  ventilation on    Activer le ventilateur", type: "system" },
  { text: "  ventilation off   Arreter le ventilateur", type: "system" },
  { text: "  lumiere start     Allumer l'eclairage", type: "system" },
  { text: "  lumiere stop      Eteindre l'eclairage", type: "system" },
  { text: "  tout start        Tout activer (batch)", type: "system" },
  { text: "  tout stop         Tout arreter (batch)", type: "system" },
  { text: "", type: "system" },
  { text: "  date              Afficher la date/heure", type: "system" },
  { text: "  status            Etat des actionneurs", type: "system" },
  { text: "  whoami            Infos utilisateur", type: "system" },
  { text: "  clear             Effacer le terminal", type: "system" },
  { text: "  history           Historique des commandes", type: "system" },
  { text: "  help              Afficher cette aide", type: "system" },
];

const allCommandWords = [
  ...Object.keys(actuatorAliases),
  ...Object.keys(commandAliases),
  "clear", "help", "commande", "commandes", "com",
  "date", "status", "whoami", "history", "h", "--help", "-h",
];

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getActuatorSuccessMessage(target, action) {
  const actuatorNames = {
    irrigation: "Arrosage",
    ventilation: "Ventilation",
    light: "Eclairage",
  };
  const actuatorName = actuatorNames[target] || target;

  if (action === "start") {
    return target === "light"
      ? `  [OK] ${actuatorName} allume avec succes.`
      : `  [OK] ${actuatorName} activee avec succes.`;
  }

  return target === "light"
    ? `  [OK] ${actuatorName} eteint avec succes.`
    : `  [OK] ${actuatorName} arretee avec succes.`;
}

function getTimestamp() {
  return new Date().toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getWelcomeLines(userName) {
  return [
    { text: "", type: "system" },
    { text: "  ╔══════════════════════════════════════════════╗", type: "system" },
    { text: "  ║        AgroIoT Terminal  v1.0                ║", type: "system" },
    { text: "  ║        Système de Controle Agricole           ║", type: "system" },
    { text: "  ╚══════════════════════════════════════════════╝", type: "system" },
    { text: "", type: "system" },
    { text: `  Bienvenue, ${userName || " utilisateur"}.`, type: "system" },
    { text: `  Session demarree le ${getTimestamp()}`, type: "system" },
    { text: '  Tapez "help" pour voir les commandes disponibles.', type: "system" },
    { text: "", type: "system" },
  ];
}

function tabComplete(input) {
  const parts = input.split(/\s+/);
  if (parts.length <= 1) {
    const matches = allCommandWords.filter((w) => w.startsWith(normalize(parts[0])));
    return matches.length === 1 ? matches[0] + " " : null;
  }
  return null;
}

export function TerminalPage() {
  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [commandHistory, setCommandHistory] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("agro-iot-terminal-history") || "[]");
      return Array.isArray(stored) ? stored.filter((item) => typeof item === "string") : [];
    } catch {
      return [];
    }
  });
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("agro-iot-auth") || "null");
      return stored?.user;
    } catch {
      return null;
    }
  });

  const terminalInputRef = useRef(null);
  const terminalLogRef = useRef(null);
  const initializedRef = useRef(false);

  const prompt = useMemo(
    () => (isRunning ? "executing..." : "agro-iot"),
    [isRunning]
  );

  const scrollToBottom = useCallback(() => {
    if (terminalLogRef.current) {
      requestAnimationFrame(() => {
        terminalLogRef.current.scrollTop = terminalLogRef.current.scrollHeight;
      });
    }
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      setLogs(getWelcomeLines(currentUser?.name));
    }
  }, [currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [logs, scrollToBottom]);

  useEffect(() => {
    localStorage.setItem("agro-iot-terminal-history", JSON.stringify(commandHistory));
  }, [commandHistory]);

  function focusTerminalInput() {
    terminalInputRef.current?.focus();
  }

  function appendLogs(entries) {
    setLogs((current) => [...current, ...entries]);
  }

  async function sendActuatorCommand(target, action, source) {
    const response = await api.post(`/api/actuators/${target}`, {
      command: action,
      source,
    });
    return response.data;
  }

  async function executeCommand(rawCommand) {
    const input = rawCommand.trim();
    if (!input) return;

    setCommandHistory((prev) => [...prev, input]);
    setHistoryIndex(-1);

    if (normalize(input) === "clear") {
      setLogs([]);
      return;
    }

    if (
      ["help", "--help", "-h", "commande", "commandes", "com"].includes(
        normalize(input)
      )
    ) {
      appendLogs([{ type: "input", text: `${prompt}$ ${input}` }, ...helpLines]);
      return;
    }

    if (normalize(input) === "date" || normalize(input) === "horaire") {
      appendLogs([
        { type: "input", text: `${prompt}$ ${input}` },
        { type: "success", text: getTimestamp() },
      ]);
      return;
    }

    if (normalize(input) === "whoami") {
      appendLogs([
        { type: "input", text: `${prompt}$ ${input}` },
        {
          type: "success",
          text: `${currentUser?.name || "inconnu"} (${currentUser?.email || "?"}) [${currentUser?.role || "Agriculteur"}]`,
        },
      ]);
      return;
    }

    if (normalize(input) === "history" || normalize(input) === "h") {
      const historyLogs = commandHistory.map((cmd, i) => ({
        type: "system",
        text: `  ${String(i + 1).padStart(4)}  ${cmd}`,
      }));
      appendLogs([
        { type: "input", text: `${prompt}$ ${input}` },
        ...historyLogs,
      ]);
      return;
    }

    if (normalize(input) === "status") {
      appendLogs([
        { type: "input", text: `${prompt}$ ${input}` },
        { type: "system", text: "  Verification des actionneurs..." },
      ]);
      setIsRunning(true);
      try {
        const targets = ["irrigation", "ventilation", "light"];
        const results = [];
        for (const item of targets) {
          try {
            const data = await api.get(`/api/measurements/latest`);
            results.push({
              type: "success",
              text: `  ${item.padEnd(14)} : connecte`,
            });
          } catch {
            results.push({
              type: "error",
              text: `  ${item.padEnd(14)} : indisponible`,
            });
          }
        }
        appendLogs(results);
      } catch {
        appendLogs([{ type: "error", text: "  Impossible de verifier le statut." }]);
      } finally {
        setIsRunning(false);
      }
      return;
    }

    const [targetInput, actionInput = "start", sourceInput = "web-terminal"] =
      input.split(/\s+/);
    const target = actuatorAliases[normalize(targetInput)];
    const action = commandAliases[normalize(actionInput)];
    const source = sourceInput || "web-terminal";

    if (!target || !action) {
      appendLogs([
        { type: "input", text: `${prompt}$ ${input}` },
        {
          type: "error",
          text: `bash: commande inconnue: "${targetInput}". Tapez "help" pour les commandes disponibles.`,
        },
      ]);
      return;
    }

    setIsRunning(true);
    appendLogs([{ type: "input", text: `${prompt}$ ${input}` }]);

    try {
      const targets =
        target === "all" ? ["irrigation", "ventilation", "light"] : [target];
      const results = [];

      for (const item of targets) {
        await sendActuatorCommand(item, action, source);
        results.push({
          type: "success",
          text: getActuatorSuccessMessage(item, action),
        });
      }

      appendLogs(results);
      logAudit({
        page: "Terminal",
        action: "Commande terminal actionneur",
        details: `${targetInput} ${actionInput} (${source})`,
      });
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Echec de la commande";
      appendLogs([{ type: "error", text: `  [ERREUR] ${message}` }]);
      logAudit({
        page: "Terminal",
        action: "Echec commande terminal",
        details: `${input} - ${message}`,
        status: "failed",
      });
    } finally {
      setIsRunning(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    const currentCommand = command;
    setCommand("");
    executeCommand(currentCommand);
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (commandHistory.length === 0) return;
      const newIndex =
        historyIndex === -1
          ? commandHistory.length - 1
          : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setCommand(commandHistory[newIndex]);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex === -1) return;
      const newIndex = historyIndex + 1;
      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setCommand("");
      } else {
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (event.key === "Tab") {
      event.preventDefault();
      const completed = tabComplete(command);
      if (completed) setCommand(completed);
    } else if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      setLogs([]);
    }
  }

  return (
    <section className="page-grid terminal-page">
      <div className="terminal-panel">
        <form
          className="terminal-window"
          onClick={focusTerminalInput}
          onSubmit={submit}
        >
          <div className="terminal-log" ref={terminalLogRef} aria-live="polite">
            {logs.map((log, index) => {
              // Parse out simple prefixes for styling if present
              let logText = log.text;
              let prefixClass = "";
              if (logText.includes("[INFO]") || logText.includes("[HEARTBEAT]") || logText.includes("[SOLAR]")) prefixClass = "text-green";
              else if (logText.includes("[MQTT]") || logText.includes("[SENSOR]")) prefixClass = "text-cyan";
              else if (logText.includes("[WARNING]")) prefixClass = "text-orange";
              else if (logText.includes("[RELAY]")) prefixClass = "text-lightgreen";

              return (
                <div
                  className={`terminal-line ${log.type} ${prefixClass}`}
                  key={`${log.type}-${index}-${log.text}`}
                >
                  {logText}
                </div>
              );
            })}
          </div>

          <label className="terminal-input-line">
            <span className="terminal-prompt-underscore">_</span>
            <input
              ref={terminalInputRef}
              type="text"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRunning ? "" : "En attente de nouvelles données..."}
              disabled={isRunning}
              autoComplete="off"
              spellCheck={false}
              aria-label="Commande terminal"
              autoFocus
            />
          </label>
        </form>
      </div>
    </section>
}
