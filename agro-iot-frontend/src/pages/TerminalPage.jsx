import React, { useMemo, useState } from "react";
import api from "../api/axios";
import { logAudit } from "../api/audit";

const actuatorAliases = {
  arrosage: "irrigation",
  irrigation: "irrigation",
  pompe: "irrigation",
  ventilation: "ventilation",
  ventilateur: "ventilation",
  luminosite: "light",
  eclairage: "light",
  light: "light",
  lampe: "light",
  tout: "all",
  all: "all"
};

const commandAliases = {
  start: "start",
  on: "start",
  demarrer: "start",
  activer: "start",
  allumer: "start",
  stop: "stop",
  off: "stop",
  arreter: "stop",
  eteindre: "stop"
};

const helpLines = [
  "Commandes disponibles :",
  "  arrosage start | arrosage stop",
  "  ventilation start | ventilation stop",
  "  luminosite start | luminosite stop",
  "  tout start batch | tout stop batch",
  "  clear",
  "  help"
];

const starterLogs = [
  { type: "system", text: "Terminal Agro IoT pret. Tapez help pour afficher les commandes." }
];

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

    if (["help", "--help", "-h"].includes(normalize(input))) {
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
        { type: "error", text: "Commande inconnue. Tapez help pour voir les commandes disponibles." }
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

  return (
    <section className="page-grid">
      <div className="terminal-panel">
        <div className="terminal-header">
          <div>
            <h2>Terminal actionneurs</h2>
            <p>Execution controlee des commandes arrosage, ventilation et luminosite.</p>
          </div>
          <span>{isRunning ? "Execution" : "Pret"}</span>
        </div>

        <div className="terminal-window" aria-live="polite">
          {logs.map((log, index) => (
            <div className={`terminal-line ${log.type}`} key={`${log.type}-${index}-${log.text}`}>
              {log.text}
            </div>
          ))}
        </div>

        <form className="terminal-command-row" onSubmit={submit}>
          <span>{prompt}</span>
          <input
            type="text"
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="ex: arrosage start"
            disabled={isRunning}
            autoComplete="off"
          />
          <button className="primary-button small" type="submit" disabled={isRunning || !command.trim()}>
            Executer
          </button>
        </form>
      </div>
    </section>
  );
}
