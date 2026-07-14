import React, { useMemo, useRef, useState } from "react";
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
  all: "all"
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
  arret: "stop"
};

const helpLines = [
  "Commandes disponibles :",
  "  arrosage start | arro on | pompe marche",
  "  ventilation stop | vent off | air arret",
  "  luminosite start | lum on | lampe eteindre",
  "  tout start batch | tous stop batch",
  "  clear",
  "  help | commande | com"
];

const starterLogs = [];

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function formatResponse(data) {
  if (!data) return "Commande executee.";
  if (typeof data === "string") return data;
  return JSON.stringify(data);
}

export function TerminalPage() {
  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState(starterLogs);
  const [isRunning, setIsRunning] = useState(false);
  const terminalInputRef = useRef(null);

  const prompt = useMemo(() => (isRunning ? "execution..." : "agro-iot>"), [isRunning]);

  function appendLogs(entries) {
    setLogs((current) => [...current, ...entries]);
  }

  async function sendActuatorCommand(target, action, source) {
    const response = await api.post(`/api/actuators/${target}`, {
      command: action,
      source
    });

    return response.data;
  }

  async function executeCommand(rawCommand) {
    const input = rawCommand.trim();
    if (!input) return;

    if (normalize(input) === "clear") {
      setLogs(starterLogs);
      return;
    }

    if (["help", "--help", "-h", "commande", "commandes", "com"].includes(normalize(input))) {
      appendLogs([
        { type: "input", text: `$ ${input}` },
        ...helpLines.map((line) => ({ type: "system", text: line }))
      ]);
      return;
    }

    const [targetInput, actionInput = "start", sourceInput = "web-terminal"] = input.split(/\s+/);
    const target = actuatorAliases[normalize(targetInput)];
    const action = commandAliases[normalize(actionInput)];
    const source = sourceInput || "web-terminal";

    if (!target || !action) {
      appendLogs([
        { type: "input", text: `$ ${input}` },
        { type: "error", text: "Commande inconnue. Tapez commande, com ou help pour voir les commandes disponibles." }
      ]);
      return;
    }

    setIsRunning(true);
    appendLogs([{ type: "input", text: `$ ${input}` }]);

    try {
      const targets = target === "all" ? ["irrigation", "ventilation", "light"] : [target];
      const results = [];

      for (const item of targets) {
        const data = await sendActuatorCommand(item, action, source);
        results.push({ type: "success", text: `${item}: ${formatResponse(data)}` });
      }

      appendLogs(results);
      logAudit({
        page: "Terminal",
        action: "Commande terminal actionneur",
        details: `${targetInput} ${actionInput} (${source})`
      });
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Echec de la commande";
      appendLogs([{ type: "error", text: message }]);
      logAudit({
        page: "Terminal",
        action: "Echec commande terminal",
        details: `${input} - ${message}`,
        status: "failed"
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

  function focusTerminalInput() {
    terminalInputRef.current?.focus();
  }

  return (
    <section className="page-grid terminal-page">
      <div className="terminal-panel">
        <form className="terminal-window" onClick={focusTerminalInput} onSubmit={submit}>
          <div className="terminal-log" aria-live="polite">
            {logs.map((log, index) => (
              <div className={`terminal-line ${log.type}`} key={`${log.type}-${index}-${log.text}`}>
                {log.text}
              </div>
            ))}
          </div>

          <label className="terminal-input-line">
            <span>{prompt}</span>
            <input
              ref={terminalInputRef}
              type="text"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder="ex: arrosage start"
              disabled={isRunning}
              autoComplete="off"
              aria-label="Commande terminal"
            />
          </label>
        </form>
      </div>
    </section>
  );
}

