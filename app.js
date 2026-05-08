const state = {
  rawEvents: [],
  events: [],
  incidents: [],
  selectedIncidentId: null,
  topSignals: [],
  confidence: 0,
  coverage: [],
  sensitivity: 72,
  correlationHours: 6,
  modes: {
    identity: true,
    endpoint: true,
    network: true,
    cloud: true
  }
};

const severityBase = {
  low: 10,
  medium: 28,
  high: 52,
  critical: 74
};

const modeMap = {
  identity: ["identity", "auth.failure", "auth.success", "privilege.change"],
  endpoint: ["endpoint", "process.start", "credential.access"],
  network: ["network", "dns.query", "egress.spike"],
  cloud: ["cloud", "data.access", "config.change", "privilege.change"]
};

const signalLibrary = [
  {
    id: "brute_force_success",
    label: "Failed logins followed by success",
    tactic: "Credential Access",
    technique: "Valid Accounts",
    mode: "identity",
    weight: 22,
    test: (event, ctx) =>
      event.event_type === "auth.success" && ctx.failuresByUser.get(event.user || "") >= 3
  },
  {
    id: "unfamiliar_geo",
    label: "Unfamiliar country or ASN",
    tactic: "Initial Access",
    technique: "External Remote Services",
    mode: "identity",
    weight: 16,
    test: (event) => Boolean(event.country && event.country !== "US")
  },
  {
    id: "privilege_escalation",
    label: "Privilege or group escalation",
    tactic: "Privilege Escalation",
    technique: "Account Manipulation",
    mode: "cloud",
    weight: 25,
    test: (event) =>
      /privilege|admin|group|role|policy|break-glass/i.test(
        `${event.event_type || ""} ${event.message || ""}`
      )
  },
  {
    id: "encoded_shell",
    label: "Encoded shell execution",
    tactic: "Execution",
    technique: "Command and Scripting Interpreter",
    mode: "endpoint",
    weight: 25,
    test: (event) => /powershell|pwsh|cmd|bash|zsh/i.test(event.process || event.command || "") &&
      /-enc|-encodedcommand|base64|frombase64/i.test(`${event.command || ""} ${event.message || ""}`)
  },
  {
    id: "credential_dump",
    label: "Credential dump behavior",
    tactic: "Credential Access",
    technique: "OS Credential Dumping",
    mode: "endpoint",
    weight: 28,
    test: (event) => /lsass|sam|ntds|credential|dump|comsvcs/i.test(
      `${event.event_type || ""} ${event.command || ""} ${event.message || ""}`
    )
  },
  {
    id: "beaconing",
    label: "Repeated beacon-like network cadence",
    tactic: "Command and Control",
    technique: "Application Layer Protocol",
    mode: "network",
    weight: 20,
    test: (event, ctx) => ctx.destCounts.get(event.dest || "") >= 3
  },
  {
    id: "new_domain",
    label: "New or suspicious external domain",
    tactic: "Command and Control",
    technique: "Dynamic Resolution",
    mode: "network",
    weight: 13,
    test: (event) => /newly observed|entropy|cdn|sync|update|cloud/i.test(
      `${event.dest || ""} ${event.message || ""}`
    )
  },
  {
    id: "data_exfiltration",
    label: "Large data access or egress spike",
    tactic: "Exfiltration",
    technique: "Exfiltration Over Web Service",
    mode: "cloud",
    weight: 30,
    test: (event) => Number(event.bytes_out || 0) > 100_000_000 ||
      /large download|egress|exfil|transfer volume|restricted/i.test(`${event.event_type || ""} ${event.message || ""}`)
  },
  {
    id: "risky_exposure",
    label: "Risky public exposure change",
    tactic: "Defense Evasion",
    technique: "Impair Defenses",
    mode: "cloud",
    weight: 18,
    test: (event) => /0\.0\.0\.0\/0|public|firewall|port 22|security group/i.test(
      `${event.message || ""} ${event.object || ""}`
    )
  }
];

const incidentPatterns = [
  {
    id: "account_takeover_exfil",
    title: "Probable account takeover with data exfiltration",
    requiredSignals: ["brute_force_success", "privilege_escalation", "data_exfiltration"],
    stage: "Identity compromise to cloud data theft",
    priority: 96,
    playbook: "Account takeover and exfiltration containment"
  },
  {
    id: "endpoint_credential_chain",
    title: "Endpoint execution with credential theft behavior",
    requiredSignals: ["encoded_shell", "credential_dump", "beaconing"],
    stage: "Execution to command and control",
    priority: 91,
    playbook: "Endpoint isolation and credential reset"
  },
  {
    id: "cloud_exposure",
    title: "Cloud control-plane exposure requiring validation",
    requiredSignals: ["risky_exposure"],
    stage: "Cloud misconfiguration",
    priority: 66,
    playbook: "Cloud exposure rollback and audit"
  }
];

const playbookTemplates = {
  "Account takeover and exfiltration containment": [
    "Disable or step-up challenge the affected identity while preserving sign-in logs.",
    "Revoke sessions, rotate refresh tokens, and reset privileged credentials.",
    "Freeze high-risk cloud access paths and snapshot relevant audit trails.",
    "Identify accessed objects, affected data classes, and external destinations.",
    "Notify legal, privacy, and incident leadership if regulated data is involved."
  ],
  "Endpoint isolation and credential reset": [
    "Isolate the endpoint using EDR network containment.",
    "Collect process tree, command line, memory artifacts, and DNS history.",
    "Reset credentials used on the host, prioritizing administrators and service accounts.",
    "Block observed command-and-control destinations at DNS and egress controls.",
    "Reimage only after evidence acquisition and scoping are complete."
  ],
  "Cloud exposure rollback and audit": [
    "Validate whether the exposure was approved and time-bound.",
    "Rollback broad ingress or privileged policy changes if approval is absent.",
    "Compare the changed resource against infrastructure-as-code state.",
    "Review access logs for connection attempts during the exposure window.",
    "Add preventive guardrails for public ingress and privilege drift."
  ],
  "General high-risk telemetry review": [
    "Assign an analyst and preserve original telemetry.",
    "Confirm asset ownership, user legitimacy, and change window context.",
    "Hunt for matching indicators across identity, endpoint, network, and cloud logs.",
    "Document decisions and downgrade only when benign context is proven."
  ]
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  seedChat();
  paintEmptyTimeline();
  refreshIcons();
});

function cacheElements() {
  [
    "eventInput",
    "fileInput",
    "dropZone",
    "loadSample",
    "clearInput",
    "runAnalysis",
    "sensitivity",
    "sensitivityValue",
    "correlation",
    "correlationValue",
    "modeIdentity",
    "modeEndpoint",
    "modeNetwork",
    "modeCloud",
    "criticalCount",
    "criticalDelta",
    "incidentCount",
    "confidenceScore",
    "coverageScore",
    "timelineCaption",
    "timelineCanvas",
    "aiVerdict",
    "signalList",
    "incidentList",
    "incidentSummary",
    "incidentInspector",
    "attackGraph",
    "graphCaption",
    "chatLog",
    "chatForm",
    "chatInput",
    "playbookList",
    "playbookCaption",
    "exportReport"
  ].forEach((id) => {
    elements[id] = document.getElementById(id);
  });
}

function bindEvents() {
  elements.loadSample.addEventListener("click", () => {
    elements.eventInput.value = JSON.stringify(window.SENTINEL_SAMPLE_EVENTS, null, 2);
    runAnalysis();
  });

  elements.clearInput.addEventListener("click", () => {
    elements.eventInput.value = "";
    resetState();
    renderAll();
  });

  elements.runAnalysis.addEventListener("click", runAnalysis);

  elements.sensitivity.addEventListener("input", (event) => {
    state.sensitivity = Number(event.target.value);
    elements.sensitivityValue.textContent = state.sensitivity;
  });

  elements.correlation.addEventListener("input", (event) => {
    state.correlationHours = Number(event.target.value);
    elements.correlationValue.textContent = `${state.correlationHours}h`;
  });

  [
    ["modeIdentity", "identity"],
    ["modeEndpoint", "endpoint"],
    ["modeNetwork", "network"],
    ["modeCloud", "cloud"]
  ].forEach(([id, mode]) => {
    elements[id].addEventListener("change", (event) => {
      state.modes[mode] = event.target.checked;
    });
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  elements.dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    elements.dropZone.classList.add("dragging");
  });

  elements.dropZone.addEventListener("dragleave", () => {
    elements.dropZone.classList.remove("dragging");
  });

  elements.dropZone.addEventListener("drop", async (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove("dragging");
    const file = event.dataTransfer.files?.[0];
    if (file) {
      elements.eventInput.value = await file.text();
      runAnalysis();
    }
  });

  elements.fileInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      elements.eventInput.value = await file.text();
      runAnalysis();
    }
  });

  elements.chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const prompt = elements.chatInput.value.trim();
    if (!prompt) return;
    addChat("user", prompt);
    elements.chatInput.value = "";
    addChat("ai", answerQuestion(prompt));
  });

  document.querySelectorAll(".prompt-chip").forEach((button) => {
    button.addEventListener("click", () => {
      const prompt = button.textContent.trim();
      addChat("user", prompt);
      addChat("ai", answerQuestion(prompt));
    });
  });

  elements.exportReport.addEventListener("click", exportReport);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function resetState() {
  state.rawEvents = [];
  state.events = [];
  state.incidents = [];
  state.selectedIncidentId = null;
  state.topSignals = [];
  state.confidence = 0;
  state.coverage = [];
}

function runAnalysis() {
  const input = elements.eventInput.value.trim();
  if (!input) {
    elements.eventInput.value = JSON.stringify(window.SENTINEL_SAMPLE_EVENTS, null, 2);
  }

  const parsed = parseEvents(elements.eventInput.value);
  state.rawEvents = parsed;
  const enabledEvents = parsed.filter(isEventEnabled);
  const context = buildContext(enabledEvents);
  state.events = enabledEvents
    .map((event, index) => scoreEvent(normalizeEvent(event, index), context))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  state.incidents = correlateIncidents(state.events);
  state.topSignals = summarizeSignals(state.events);
  state.coverage = [...new Set(state.events.flatMap((event) => event.signals.map((signal) => signal.tactic)))];
  state.confidence = calculateConfidence(state.events, state.incidents);
  state.selectedIncidentId = state.incidents[0]?.id || null;
  renderAll();
  switchTab("overview");
}

function parseEvents(input) {
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return input
      .split(/\n+/)
      .map((line, index) => line.trim())
      .filter(Boolean)
      .map((line, index) => parseRawLine(line, index));
  }
}

function parseRawLine(line, index) {
  const ipMatch = line.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  const userMatch = line.match(/user[=: ]+([a-z0-9._-]+)/i);
  const hostMatch = line.match(/host[=: ]+([a-z0-9._-]+)/i);
  const type = inferEventType(line);
  return {
    timestamp: new Date(Date.now() - (20 - index) * 60000).toISOString(),
    source: inferSource(type, line),
    event_type: type,
    user: userMatch?.[1] || "unknown.user",
    host: hostMatch?.[1] || "unknown-host",
    src_ip: ipMatch?.[0] || "",
    country: /ru|cn|ir|kp|foreign|unfamiliar/i.test(line) ? "Unknown external" : "US",
    message: line,
    severity: /critical|dump|exfil|admin|encoded|lsass/i.test(line)
      ? "critical"
      : /fail|suspicious|beacon|firewall|large/i.test(line)
        ? "high"
        : "medium"
  };
}

function inferEventType(line) {
  if (/fail|denied|invalid password/i.test(line)) return "auth.failure";
  if (/success|logged in|sso/i.test(line)) return "auth.success";
  if (/admin|privilege|role|group|policy/i.test(line)) return "privilege.change";
  if (/powershell|process|cmd|bash|zsh/i.test(line)) return "process.start";
  if (/lsass|credential|dump/i.test(line)) return "credential.access";
  if (/dns|domain|beacon/i.test(line)) return "dns.query";
  if (/download|egress|transfer|exfil/i.test(line)) return "egress.spike";
  if (/firewall|security group|port/i.test(line)) return "config.change";
  return "security.event";
}

function inferSource(type, line) {
  if (/auth|privilege/i.test(type)) return "identity";
  if (/process|credential/i.test(type)) return "endpoint";
  if (/dns|egress/i.test(type)) return "network";
  if (/cloud|iam|s3|firewall|config|privilege/i.test(`${type} ${line}`)) return "cloud";
  return "security";
}

function normalizeEvent(event, index) {
  return {
    id: event.id || `evt-${index + 1}`,
    timestamp: event.timestamp || new Date(Date.now() - index * 60000).toISOString(),
    source: event.source || inferSource(event.event_type || "", event.message || ""),
    event_type: event.event_type || inferEventType(event.message || ""),
    user: event.user || "unknown.user",
    host: event.host || "unknown-host",
    src_ip: event.src_ip || event.ip || "",
    country: event.country || "Unknown",
    dest: event.dest || event.destination || "",
    process: event.process || "",
    command: event.command || "",
    object: event.object || "",
    bytes_out: Number(event.bytes_out || event.bytes || 0),
    message: event.message || JSON.stringify(event),
    severity: String(event.severity || "medium").toLowerCase()
  };
}

function isEventEnabled(event) {
  const type = event.event_type || "";
  const source = event.source || "";
  return Object.entries(state.modes).some(([mode, enabled]) => {
    if (!enabled) return false;
    return modeMap[mode].includes(source) || modeMap[mode].includes(type);
  });
}

function buildContext(events) {
  const failuresByUser = new Map();
  const destCounts = new Map();
  const hostsByUser = new Map();
  const countriesByUser = new Map();

  events.forEach((event) => {
    const user = event.user || "";
    if (event.event_type === "auth.failure") {
      failuresByUser.set(user, (failuresByUser.get(user) || 0) + 1);
    }
    if (event.dest) {
      destCounts.set(event.dest, (destCounts.get(event.dest) || 0) + 1);
    }
    if (user && event.host) {
      if (!hostsByUser.has(user)) hostsByUser.set(user, new Set());
      hostsByUser.get(user).add(event.host);
    }
    if (user && event.country) {
      if (!countriesByUser.has(user)) countriesByUser.set(user, new Set());
      countriesByUser.get(user).add(event.country);
    }
  });

  return { failuresByUser, destCounts, hostsByUser, countriesByUser };
}

function scoreEvent(event, context) {
  const signals = signalLibrary
    .filter((signal) => state.modes[signal.mode])
    .filter((signal) => signal.test(event, context));

  const rawScore =
    (severityBase[event.severity] || 28) +
    signals.reduce((sum, signal) => sum + signal.weight, 0) +
    (Number(event.bytes_out) > 500_000_000 ? 8 : 0);
  const sensitivityBoost = (state.sensitivity - 70) * 0.35;
  const risk = clamp(Math.round(rawScore + sensitivityBoost), 0, 100);
  const severity = risk >= 88 ? "critical" : risk >= 68 ? "high" : risk >= 42 ? "medium" : "low";
  return { ...event, signals, risk, modelSeverity: severity };
}

function correlateIncidents(events) {
  if (!events.length) return [];

  const groups = new Map();
  events.forEach((event) => {
    const key = event.user !== "unknown.user" ? event.user : event.host;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  });

  const incidents = [];
  groups.forEach((groupEvents, entity) => {
    const sorted = groupEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const signalIds = new Set(sorted.flatMap((event) => event.signals.map((signal) => signal.id)));
    const matched = incidentPatterns.filter((pattern) =>
      pattern.requiredSignals.every((signal) => signalIds.has(signal))
    );

    matched.forEach((pattern) => {
      const evidence = sorted.filter((event) =>
        event.signals.some((signal) => pattern.requiredSignals.includes(signal.id))
      );
      incidents.push(buildIncident(pattern, entity, evidence));
    });

    if (!matched.length) {
      const highRisk = sorted.filter((event) => event.risk >= 68);
      if (highRisk.length) {
        incidents.push(
          buildIncident(
            {
              id: "general_high_risk",
              title: "High-risk security activity requiring analyst review",
              stage: "Unclassified high-risk behavior",
              priority: Math.max(...highRisk.map((event) => event.risk)),
              playbook: "General high-risk telemetry review"
            },
            entity,
            highRisk
          )
        );
      }
    }
  });

  return incidents
    .map((incident, index) => ({ ...incident, id: `inc-${index + 1}` }))
    .sort((a, b) => b.risk - a.risk);
}

function buildIncident(pattern, entity, evidence) {
  const first = evidence[0];
  const last = evidence[evidence.length - 1];
  const tactics = [...new Set(evidence.flatMap((event) => event.signals.map((signal) => signal.tactic)))];
  const techniques = [...new Set(evidence.flatMap((event) => event.signals.map((signal) => signal.technique)))];
  const risk = clamp(
    Math.round(
      Math.max(pattern.priority || 50, ...evidence.map((event) => event.risk)) +
        Math.min(10, evidence.length * 1.5)
    ),
    0,
    100
  );
  return {
    pattern: pattern.id,
    title: pattern.title,
    entity,
    stage: pattern.stage,
    risk,
    severity: risk >= 88 ? "critical" : risk >= 68 ? "high" : risk >= 42 ? "medium" : "low",
    firstSeen: first.timestamp,
    lastSeen: last.timestamp,
    evidence,
    tactics,
    techniques,
    playbook: pattern.playbook,
    summary: createIncidentSummary(pattern, entity, evidence, tactics)
  };
}

function createIncidentSummary(pattern, entity, evidence, tactics) {
  const hosts = [...new Set(evidence.map((event) => event.host).filter(Boolean))];
  const destinations = [...new Set(evidence.map((event) => event.dest || event.src_ip).filter(Boolean))];
  return `${pattern.title} centered on ${entity}. The model linked ${evidence.length} events across ${hosts.length || 1} host context(s), with strongest evidence in ${tactics.slice(0, 3).join(", ") || "high-risk telemetry"}. Key external indicators: ${destinations.slice(0, 3).join(", ") || "none observed"}.`;
}

function summarizeSignals(events) {
  const counts = new Map();
  events.forEach((event) => {
    event.signals.forEach((signal) => {
      const current = counts.get(signal.id) || {
        id: signal.id,
        label: signal.label,
        tactic: signal.tactic,
        count: 0,
        maxRisk: 0
      };
      current.count += 1;
      current.maxRisk = Math.max(current.maxRisk, event.risk);
      counts.set(signal.id, current);
    });
  });

  return [...counts.values()]
    .map((signal) => ({
      ...signal,
      score: clamp(Math.round(signal.count * 16 + signal.maxRisk * 0.55), 0, 100)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function calculateConfidence(events, incidents) {
  if (!events.length) return 0;
  const signalDensity = events.filter((event) => event.signals.length).length / events.length;
  const incidentStrength = incidents.length ? Math.max(...incidents.map((incident) => incident.risk)) / 100 : 0;
  const sourceCoverage = new Set(events.map((event) => event.source)).size / 4;
  return clamp(Math.round((signalDensity * 44 + incidentStrength * 36 + sourceCoverage * 20)), 0, 99);
}

function renderAll() {
  renderMetrics();
  renderTimeline();
  renderVerdict();
  renderSignals();
  renderIncidents();
  renderInspector();
  renderGraph();
  renderPlaybooks();
  refreshIcons();
}

function renderMetrics() {
  const critical = state.events.filter((event) => event.risk >= 88).length;
  elements.criticalCount.textContent = critical;
  elements.criticalDelta.textContent = state.events.length
    ? `${state.events.length} events analyzed`
    : "No events analyzed";
  elements.incidentCount.textContent = state.incidents.length;
  elements.confidenceScore.textContent = `${state.confidence}%`;
  elements.coverageScore.textContent = state.coverage.length;
}

function renderTimeline() {
  if (!state.events.length) {
    paintEmptyTimeline();
    elements.timelineCaption.textContent = "Awaiting telemetry";
    return;
  }
  elements.timelineCaption.textContent = `${state.events.length} scored events`;
  const canvas = elements.timelineCanvas;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  drawChartFrame(ctx, width, height);

  const times = state.events.map((event) => new Date(event.timestamp).getTime());
  const min = Math.min(...times);
  const max = Math.max(...times);
  const pad = 42;
  const points = state.events.map((event) => {
    const time = new Date(event.timestamp).getTime();
    const x = min === max ? width / 2 : pad + ((time - min) / (max - min)) * (width - pad * 2);
    const y = height - pad - (event.risk / 100) * (height - pad * 2);
    return { x, y, event };
  });

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = "#007f73";
  ctx.lineWidth = 3;
  ctx.stroke();

  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.event.risk >= 88 ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fillStyle = point.event.risk >= 88 ? "#c24138" : point.event.risk >= 68 ? "#b97612" : "#007f73";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  ctx.fillStyle = "#66736f";
  ctx.font = "700 12px Inter, system-ui, sans-serif";
  ctx.fillText("0", 12, height - pad + 4);
  ctx.fillText("100", 12, pad + 4);
}

function paintEmptyTimeline() {
  const canvas = elements.timelineCanvas;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawChartFrame(ctx, canvas.width, canvas.height);
  ctx.fillStyle = "#66736f";
  ctx.font = "800 16px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Risk timeline will appear here", canvas.width / 2, canvas.height / 2);
  ctx.textAlign = "start";
}

function drawChartFrame(ctx, width, height) {
  ctx.fillStyle = "#fbfdfc";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#dfe8e2";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = 32 + i * ((height - 64) / 4);
    ctx.beginPath();
    ctx.moveTo(38, y);
    ctx.lineTo(width - 26, y);
    ctx.stroke();
  }
}

function renderVerdict() {
  if (!state.events.length) {
    elements.aiVerdict.textContent =
      "Load sample telemetry or paste your own events to generate a defensive triage verdict.";
    return;
  }
  const topIncident = state.incidents[0];
  if (!topIncident) {
    elements.aiVerdict.textContent =
      `The model found ${state.events.length} event(s), but no correlated incident exceeded the current sensitivity threshold. Continue monitoring and review any medium-risk single events.`;
    return;
  }
  elements.aiVerdict.textContent =
    `${topIncident.summary} Recommended priority is ${topIncident.severity.toUpperCase()} with ${state.confidence}% model confidence. Start with containment of ${topIncident.entity}, then preserve evidence from ${topIncident.evidence.map((event) => event.host).filter(Boolean).slice(0, 2).join(" and ") || "the affected assets"}.`;
}

function renderSignals() {
  if (!state.topSignals.length) {
    elements.signalList.className = "signal-list empty-state";
    elements.signalList.textContent = "No signals yet.";
    return;
  }
  elements.signalList.className = "signal-list";
  elements.signalList.innerHTML = state.topSignals
    .map(
      (signal) => `
      <article class="signal-item">
        <div class="signal-name">${escapeHtml(signal.label)}</div>
        <div class="incident-meta">
          <span>${escapeHtml(signal.tactic)}</span>
          <span>${signal.count} hit${signal.count === 1 ? "" : "s"}</span>
        </div>
        <div class="signal-bar" aria-hidden="true"><span style="width:${signal.score}%"></span></div>
      </article>
    `
    )
    .join("");
}

function renderIncidents() {
  elements.incidentSummary.textContent = `${state.incidents.length} open`;
  if (!state.incidents.length) {
    elements.incidentList.className = "incident-list empty-state";
    elements.incidentList.textContent = "No incidents detected yet.";
    return;
  }
  elements.incidentList.className = "incident-list";
  elements.incidentList.innerHTML = state.incidents.map(renderIncidentItem).join("");
  document.querySelectorAll(".incident-item").forEach((item) => {
    item.addEventListener("click", () => {
      state.selectedIncidentId = item.dataset.incidentId;
      renderIncidents();
      renderInspector();
      refreshIcons();
    });
  });
}

function renderIncidentItem(incident) {
  return `
    <article class="incident-item ${incident.id === state.selectedIncidentId ? "active" : ""}" data-incident-id="${incident.id}">
      <div class="incident-header">
        <h3>${escapeHtml(incident.title)}</h3>
        <span class="badge ${incident.severity}">${incident.severity}</span>
      </div>
      <p>${escapeHtml(incident.summary)}</p>
      <div class="incident-meta">
        <span>${escapeHtml(incident.entity)}</span>
        <span>${formatDate(incident.firstSeen)} - ${formatDate(incident.lastSeen)}</span>
        <span>${incident.evidence.length} evidence events</span>
      </div>
      <div class="risk-row">
        <div class="risk-track"><div class="risk-fill" style="width:${incident.risk}%"></div></div>
        <strong>${incident.risk}</strong>
      </div>
    </article>
  `;
}

function renderInspector() {
  const incident = state.incidents.find((item) => item.id === state.selectedIncidentId);
  if (!incident) {
    elements.incidentInspector.className = "inspector-body empty-state";
    elements.incidentInspector.textContent =
      "Select an incident to inspect evidence, MITRE mapping, and recommended containment steps.";
    return;
  }
  elements.incidentInspector.className = "inspector-body";
  elements.incidentInspector.innerHTML = `
    <section class="inspector-section">
      <h3>Executive Summary</h3>
      <p>${escapeHtml(incident.summary)}</p>
    </section>
    <section class="inspector-section">
      <h3>MITRE-Style Mapping</h3>
      <div class="pill-row">
        ${incident.tactics.map((item) => `<span class="mini-pill">${escapeHtml(item)}</span>`).join("")}
        ${incident.techniques.map((item) => `<span class="mini-pill">${escapeHtml(item)}</span>`).join("")}
      </div>
    </section>
    <section class="inspector-section">
      <h3>Evidence</h3>
      ${incident.evidence
        .slice(0, 6)
        .map(
          (event) => `
          <div class="evidence-line">
            <i data-lucide="circle-alert" aria-hidden="true"></i>
            <div>
              <strong>${event.risk}/100 ${escapeHtml(event.event_type)}</strong>
              <p>${escapeHtml(event.message)}</p>
              <small>${formatDate(event.timestamp)} | ${escapeHtml(event.user)} | ${escapeHtml(event.host)}</small>
            </div>
          </div>`
        )
        .join("")}
    </section>
    <section class="inspector-section">
      <h3>Containment Focus</h3>
      <p>${escapeHtml(getContainmentFocus(incident))}</p>
    </section>
  `;
}

function renderGraph() {
  if (!state.incidents.length) {
    elements.graphCaption.textContent = "No correlated path";
    elements.attackGraph.innerHTML = '<div class="empty-state">Run analysis to build a graph.</div>';
    return;
  }
  const incident = state.incidents[0];
  elements.graphCaption.textContent = `${incident.stage} | ${incident.risk}/100 risk`;
  const stages = buildGraphStages(incident);
  elements.attackGraph.innerHTML = `
    <div class="graph-grid">
      ${stages
        .map(
          (stage) => `
          <article class="graph-node">
            <span class="graph-stage">${escapeHtml(stage.stage)}</span>
            <strong>${escapeHtml(stage.title)}</strong>
            <p>${escapeHtml(stage.detail)}</p>
            <span class="badge ${stage.severity}">${stage.severity}</span>
          </article>
        `
        )
        .join("")}
    </div>
  `;
}

function buildGraphStages(incident) {
  const signals = new Set(incident.evidence.flatMap((event) => event.signals.map((signal) => signal.id)));
  const stages = [
    {
      stage: "Access",
      title: signals.has("brute_force_success") ? "Identity foothold" : "Initial signal",
      detail: signals.has("brute_force_success")
        ? "Repeated failures were followed by a successful login."
        : "Suspicious activity established the first observable signal.",
      severity: signals.has("brute_force_success") ? "high" : "medium"
    },
    {
      stage: "Privilege",
      title: signals.has("privilege_escalation") ? "Privilege expansion" : "Permission review",
      detail: signals.has("privilege_escalation")
        ? "Administrative or high-impact permissions changed after access."
        : "No confirmed privilege escalation was found.",
      severity: signals.has("privilege_escalation") ? "critical" : "low"
    },
    {
      stage: "Execution",
      title: signals.has("encoded_shell") ? "Suspicious execution" : "Execution unknown",
      detail: signals.has("encoded_shell")
        ? "Encoded command execution increased endpoint compromise likelihood."
        : "Endpoint execution evidence is limited in the current dataset.",
      severity: signals.has("encoded_shell") ? "critical" : "low"
    },
    {
      stage: "Control",
      title: signals.has("beaconing") ? "Beaconing cadence" : "C2 not confirmed",
      detail: signals.has("beaconing")
        ? "Repeated DNS or network calls suggest possible command-and-control."
        : "No repeated network cadence was detected.",
      severity: signals.has("beaconing") ? "high" : "low"
    },
    {
      stage: "Impact",
      title: signals.has("data_exfiltration") ? "Data movement" : "Impact pending",
      detail: signals.has("data_exfiltration")
        ? "Large data access or outbound transfer indicates possible exfiltration."
        : "No high-volume data movement was found.",
      severity: signals.has("data_exfiltration") ? "critical" : "low"
    }
  ];
  return stages;
}

function renderPlaybooks() {
  if (!state.incidents.length) {
    elements.playbookList.className = "playbook-list empty-state";
    elements.playbookList.textContent = "No playbooks generated yet.";
    return;
  }
  const playbooks = [...new Set(state.incidents.map((incident) => incident.playbook))];
  elements.playbookList.className = "playbook-list";
  elements.playbookCaption.textContent = `${playbooks.length} generated`;
  elements.playbookList.innerHTML = playbooks
    .map((name) => {
      const steps = playbookTemplates[name] || playbookTemplates["General high-risk telemetry review"];
      return `
      <article class="playbook-item">
        <h3>${escapeHtml(name)}</h3>
        ${steps
          .map(
            (step, index) => `
            <div class="playbook-step">
              <span>${index + 1}</span>
              <p>${escapeHtml(step)}</p>
            </div>`
          )
          .join("")}
      </article>
    `;
    })
    .join("");
}

function seedChat() {
  elements.chatLog.innerHTML = "";
  addChat(
    "ai",
    "I can summarize incidents, explain model evidence, suggest containment, and draft analyst notes after you run triage."
  );
}

function addChat(role, message) {
  const node = document.createElement("div");
  node.className = `chat-message ${role}`;
  node.innerHTML = `<span>${escapeHtml(message)}</span>`;
  elements.chatLog.appendChild(node);
  elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
}

function answerQuestion(prompt) {
  if (!state.events.length) {
    return "Load telemetry first and I can reason over the detected signals. The sample dataset is a good starting point.";
  }

  const incident = state.incidents[0];
  const lower = prompt.toLowerCase();
  if (!incident) {
    return "I do not see a correlated incident at the current threshold. Review medium-risk events, increase sensitivity if needed, and add identity or endpoint context to improve confidence.";
  }

  if (/leadership|executive|summary|summarize/.test(lower)) {
    return `${incident.severity.toUpperCase()} incident: ${incident.title}. ${incident.summary} Current recommendation is containment-first, with evidence preservation before broad remediation.`;
  }
  if (/contain|first|priority|do/.test(lower)) {
    return getContainmentFocus(incident);
  }
  if (/evidence|preserve|artifact|log/.test(lower)) {
    return `Preserve sign-in logs, privilege-change audit records, endpoint process trees, command lines, DNS history, and object access logs. Highest-value evidence event: "${incident.evidence[0]?.message || "not available"}".`;
  }
  if (/attack chain|chain|path|likely/.test(lower)) {
    return `Most likely path: ${buildGraphStages(incident)
      .filter((stage) => stage.severity !== "low")
      .map((stage) => stage.title)
      .join(" -> ")}. The model confidence is ${state.confidence}%.`;
  }
  if (/blast|scope|radius|affected/.test(lower)) {
    const hosts = [...new Set(incident.evidence.map((event) => event.host).filter(Boolean))];
    const users = [...new Set(incident.evidence.map((event) => event.user).filter(Boolean))];
    return `Current blast radius includes ${users.join(", ")} and ${hosts.join(", ")}. Hunt for the same source IPs, destinations, and signal patterns across the full environment before closing scope.`;
  }
  return `${incident.summary} The safest next analyst move is to validate the identity, isolate affected endpoints if endpoint execution is present, and preserve the telemetry that explains the decision.`;
}

function getContainmentFocus(incident) {
  const signals = new Set(incident.evidence.flatMap((event) => event.signals.map((signal) => signal.id)));
  if (signals.has("data_exfiltration") && signals.has("privilege_escalation")) {
    return `Contain ${incident.entity} immediately: revoke active sessions, remove newly granted privileges, freeze sensitive data access, and review large object downloads before restoring access.`;
  }
  if (signals.has("credential_dump") || signals.has("encoded_shell")) {
    return "Isolate the endpoint, preserve process and memory evidence, rotate credentials used on the host, and block observed external destinations.";
  }
  if (signals.has("risky_exposure")) {
    return "Rollback the public exposure if it lacks approval, then audit access attempts during the exposure window.";
  }
  return "Open an analyst case, preserve source telemetry, verify asset owner context, and hunt for related indicators.";
}

function exportReport() {
  const report = {
    generated_at: new Date().toISOString(),
    project: "Sentinel Forge AI",
    confidence: state.confidence,
    coverage: state.coverage,
    incidents: state.incidents.map((incident) => ({
      title: incident.title,
      severity: incident.severity,
      risk: incident.risk,
      entity: incident.entity,
      summary: incident.summary,
      tactics: incident.tactics,
      techniques: incident.techniques,
      playbook: incident.playbook,
      evidence: incident.evidence.map((event) => ({
        timestamp: event.timestamp,
        type: event.event_type,
        risk: event.risk,
        user: event.user,
        host: event.host,
        message: event.message
      }))
    }))
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sentinel-forge-report-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Report exported");
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "report-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1800);
}

function switchTab(tabName) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === tabName);
  });
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
