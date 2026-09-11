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
  { text: "  arrosage start|stop   Activer/Arreter la pompe d'irrigation", type: "system" },
  { text: "  ventilation on|off    Activer/Arreter le ventilateur", type: "system" },
  { text: "  lumiere start|stop    Allumer/Eteindre l'eclairage", type: "system" },
  { text: "  tout start|stop       Tout activer/arreter (batch)", type: "system" },
  { text: "", type: "system" },
  { text: "  status                Etat reel des actionneurs", type: "system" },
  { text: "  mesures               Dernieres valeurs des capteurs", type: "system" },
  { text: "  alertes               Alertes actives", type: "system" },
  { text: "  scripts               Liste des scripts disponibles", type: "system" },
  { text: "  run <CODE>            Executer un script (ex: run START_IRRIGATION)", type: "system" },
  { text: "", type: "system" },
  { text: "  date                  Afficher la date/heure", type: "system" },
  { text: "  whoami                Infos utilisateur", type: "system" },
  { text: "  pwd                   Afficher le repertoire courant", type: "system" },
  { text: "  echo <texte>          Afficher un texte", type: "system" },
  { text: "  history               Historique des commandes", type: "system" },
  { text: "  clear                 Effacer le terminal", type: "system" },
  { text: "  help                  Afficher cette aide", type: "system" },
  { text: "", type: "system" },
  { text: "  Plusieurs commandes :", type: "system" },
  { text: "    ;   => en parallele    (ex: ventilation on ; lumiere on)", type: "system" },
  { text: "    &&  => en sequence     (ex: arrosage start && status)", type: "system" },
];

const allCommandWords = [
  ...Object.keys(actuatorAliases),
  ...Object.keys(commandAliases),
  "clear", "help", "commande", "commandes", "com",
  "date", "horaire", "status",
  "mesures", "mesure", "sensors", "sensor", "capteurs", "capteur",
  "alertes", "alerts", "notifications", "notif",
  "scripts", "ls", "list", "liste",
  "run", "echo", "pwd", "cwd", "history", "h", "--help", "-h",
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

  function echoInput(input) {
    return { type: "input", text: `${prompt}$ ${input}` };
  }

  function apiErrorMessage(error) {
    return error?.response?.data?.message || error?.message || "Echec de la commande";
  }

  async function handleActuator(target, action, source, input) {
    const targets = target === "all" ? ["irrigation", "ventilation", "light"] : [target];
    const results = await Promise.allSettled(
      targets.map((item) => sendActuatorCommand(item, action, source))
    );
    const successAll = results.every((r) => r.status === "fulfilled");
    const failed = results.find((r) => r.status === "rejected");
    const lines = results.map((r, index) =>
      r.status === "fulfilled"
        ? { type: "success", text: getActuatorSuccessMessage(targets[index], action) }
        : { type: "error", text: `  [ERREUR] ${targets[index]} : ${apiErrorMessage(r.reason)}` }
    );
    logAudit({
      page: "Terminal",
      action: successAll ? "Commande terminal actionneur" : "Echec commande terminal",
      details: `${target} ${action} (${source})${successAll ? "" : ` - ${apiErrorMessage(failed?.reason)}`}`,
      status: successAll ? "success" : "failed",
    });
    return [echoInput(input), ...lines];
  }

  async function handleStatus(input) {
    try {
      const { data } = await api.get("/api/actuators/status");
      const entries = Object.entries(data || {});
      const lines = entries.length
        ? entries.map(([slug, state]) => ({
            type: state?.on ? "success" : "system",
            text: `  ${slug.padEnd(14)} : ${state?.on ? "ON" : "OFF"}${state?.status === "introuvable" ? " (introuvable)" : ""}`,
          }))
        : [{ type: "error", text: "  Impossible de recuperer l'etat des actionneurs." }];
      return [echoInput(input), ...lines];
    } catch (error) {
      return [echoInput(input), { type: "error", text: `  [ERREUR] ${apiErrorMessage(error)}` }];
    }
  }

  async function handleMesures(input) {
    try {
      const { data } = await api.get("/api/measurements/latest");
      const labels = {
        temperature: "Temperature",
        air_humidity: "Humidite air",
        soil_humidity: "Humidite sol",
        co2: "CO2",
        light: "Luminosite",
        water_level: "Niveau eau",
      };
      const lines = Object.entries(data || {}).map(([key, item]) => {
        const value = item?.value ?? item?.valeur ?? item;
        const unit = item?.unit ?? item?.unite ?? "";
        return { type: "success", text: `  ${(labels[key] || key).padEnd(16)} : ${value} ${unit}`.trimEnd() };
      });
      if (lines.length === 0) lines.push({ type: "system", text: "  Aucune mesure recente." });
      return [echoInput(input), ...lines];
    } catch (error) {
      return [echoInput(input), { type: "error", text: `  [ERREUR] ${apiErrorMessage(error)}` }];
    }
  }

  async function handleAlertes(input) {
    try {
      const { data } = await api.get("/api/alerts/active");
      const rows = Array.isArray(data) ? data : [];
      if (rows.length === 0) return [echoInput(input), { type: "success", text: "  Aucune alerte active." }];
      const lines = rows.map((alert) => ({
        type: String(alert?.niveau_criticite).toLowerCase() === "critique" ? "error" : "system",
        text: `  [${alert?.id_alerte || "--"}] ${alert?.type_alerte || "Alerte"} - ${alert?.message || ""} (${alert?.niveau_criticite || "Info"})`,
      }));
      return [echoInput(input), ...lines];
    } catch (error) {
      return [echoInput(input), { type: "error", text: `  [ERREUR] ${apiErrorMessage(error)}` }];
    }
  }

  async function handleScripts(input) {
    try {
      const { data } = await api.get("/api/automation-rules");
      const rows = Array.isArray(data) ? data : [];
      if (rows.length === 0) return [echoInput(input), { type: "system", text: "  Aucun script disponible." }];
      const lines = rows.map((script) => ({
        type: "system",
        text: `  ${String(script?.condition || "").padEnd(20)} : ${script?.action || ""}`,
      }));
      return [echoInput(input), ...lines];
    } catch (error) {
      return [echoInput(input), { type: "error", text: `  [ERREUR] ${apiErrorMessage(error)}` }];
    }
  }

  async function handleRun(input) {
    const code = input.slice(3).trim().toUpperCase();
    const scriptActions = {
      START_IRRIGATION: ["irrigation", "start"],
      STOP_IRRIGATION: ["irrigation", "stop"],
      LANCER_VENTILATION: ["ventilation", "start"],
      COUPER_VENTILATION: ["ventilation", "stop"],
      ALLUMER_LUMIERE: ["light", "start"],
      ETEINDRE_LUMIERE: ["light", "stop"],
    };
    if (!code) {
      return [echoInput(input), { type: "error", text: '  usage: run <CODE>   (ex: run START_IRRIGATION, voir "scripts")' }];
    }
    if (scriptActions[code]) {
      const [target, action] = scriptActions[code];
      return handleActuator(target, action, "script-run", input);
    }
    if (code === "READ_TEMP" || code === "READ_HUMIDITY" || code === "READ_ALL" || code === "SYNC_DATA") {
      return handleMesures(input);
    }
    return [echoInput(input), { type: "error", text: `  Script inconnu: ${code}. Tapez "scripts" pour la liste.` }];
  }

  async function executeOne(rawCommand) {
    const input = rawCommand.trim();
    const normalized = normalize(input);

    if (!input) return [];

    if (["help", "--help", "-h", "commande", "commandes", "com"].includes(normalized)) {
      return [echoInput(input), ...helpLines];
    }
    if (normalized === "date" || normalized === "horaire") {
      return [echoInput(input), { type: "success", text: getTimestamp() }];
    }
    if (normalized === "whoami") {
      return [
        echoInput(input),
        { type: "success", text: `${currentUser?.name || "inconnu"} (${currentUser?.email || "?"}) [${currentUser?.role || "Agriculteur"}]` },
      ];
    }
    if (normalized === "history" || normalized === "h") {
      const historyLogs = commandHistory.map((cmd, i) => ({
        type: "system",
        text: `  ${String(i + 1).padStart(4)}  ${cmd}`,
      }));
      return [echoInput(input), ...historyLogs];
    }
    if (normalized === "pwd" || normalized === "cwd") {
      return [echoInput(input), { type: "success", text: "  /parcelles/agro-iot" }];
    }
    if (normalized === "echo") {
      return [echoInput(input), { type: "success", text: "  " }];
    }
    if (normalized.startsWith("echo ")) {
      return [echoInput(input), { type: "success", text: `  ${input.slice(4).trimStart()}` }];
    }
    if (normalized === "status") return handleStatus(input);
    if (["mesures", "mesure", "sensors", "sensor", "capteurs", "capteur"].includes(normalized)) return handleMesures(input);
    if (["alertes", "alerts", "notifications", "notif"].includes(normalized)) return handleAlertes(input);
    if (["scripts", "ls", "list", "liste"].includes(normalized)) return handleScripts(input);
    if (normalized === "run" || normalized.startsWith("run ")) return handleRun(input);

    const [targetInput, actionInput = "start", sourceInput = "web-terminal"] = input.split(/\s+/);
    const target = actuatorAliases[normalize(targetInput)];
    const action = commandAliases[normalize(actionInput)];
    const source = sourceInput || "web-terminal";

    if (target && action) return handleActuator(target, action, source, input);

    return [
      echoInput(input),
      { type: "error", text: `bash: commande inconnue: "${targetInput}". Tapez "help" pour les commandes disponibles.` },
    ];
  }

  async function executeCommand(rawCommand) {
    const raw = rawCommand.trim();
    if (!raw) return;

    setCommandHistory((prev) => [...prev, raw]);
    setHistoryIndex(-1);

    if (normalize(raw) === "clear") {
      setLogs([]);
      return;
    }

    // && = chaines successives (sequentiel)
    // ;  = commandes lancees en meme temps (parallele, Promise.allSettled)
    const chains = raw.split("&&").map((c) => c.trim()).filter(Boolean);
    if (chains.length === 0) return;
    const batches = chains.map((chain) => chain.split(";").map((c) => c.trim()).filter(Boolean));

    setIsRunning(true);
    try {
      for (const batch of batches) {
        const settled = await Promise.allSettled(batch.map((cmd) => executeOne(cmd)));
        const logs = settled.flatMap((result) =>
          result.status === "fulfilled"
            ? result.value
            : [{ type: "error", text: `  [ERREUR] ${apiErrorMessage(result.reason)}` }]
        );
        appendLogs(logs);
      }
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
        <div className="terminal-titlebar">
          <div className="terminal-titlebar-dots">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
          </div>
          <span className="terminal-titlebar-title">
            agro-iot — terminal — bash
          </span>
          <span className="terminal-titlebar-spacer" />
        </div>

        <form
          className="terminal-window"
          onClick={focusTerminalInput}
          onSubmit={submit}
        >
          <div className="terminal-log" ref={terminalLogRef} aria-live="polite">
            {logs.map((log, index) => (
              <div
                className={`terminal-line ${log.type}`}
                key={`${log.type}-${index}-${log.text}`}
              >
                {log.text}
              </div>
            ))}
          </div>

          <label className="terminal-input-line">
            <span className="terminal-prompt-user">user@agro-iot</span>
            <span className="terminal-prompt-sep">:</span>
            <span className="terminal-prompt-path">~</span>
            <span className="terminal-prompt符号">$</span>
            <input
              ref={terminalInputRef}
              type="text"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRunning ? "" : "tapez une commande..."}
              disabled={isRunning}
              autoComplete="off"
              spellCheck={false}
              aria-label="Commande terminal"
              autoFocus
            />
          </label>
        </form>

        <div className="terminal-statusbar">
          <span>
            {currentUser?.role || "Agriculteur"} — {currentUser?.name || "invité"}
          </span>
          <span>{commandHistory.length} commandes</span>
          <span>{getTimestamp()}</span>
        </div>
      </div>
    </section>
  );
}
