const STORAGE_KEY = "achavelli.personal.assistant.v1";
const LEGACY_STORAGE_KEY = "astra.personal.assistant.v1";
const APP_NAME = "Achavelli";

const defaultState = {
  profile: {
    name: "Achavelli",
    school: "Belhaven University",
    goal: "Finish the doctorate, build a cybersecurity career path, and protect F-1 status while creating authorized income."
  },
  permissions: {
    email: false,
    calendar: false,
    drive: false,
    files: false,
    browser: false,
    github: false,
    cards: false,
    wallets: false
  },
  tasks: [
    { id: createId("task"), text: "Confirm any CPT work in writing with Belhaven DSO before starting.", done: false },
    { id: createId("task"), text: "Apply to 5 cybersecurity CPT internship roles this week.", done: false },
    { id: createId("task"), text: "Draft one doctorate research question and save it in Research Desk.", done: false },
    { id: createId("task"), text: "Pick one authorized bug bounty program and read the scope carefully.", done: false }
  ],
  memories: [
    {
      id: createId("mem"),
      text: "Payment cards and wallets stay blocked unless explicitly redesigned with legal and security review.",
      createdAt: new Date().toISOString()
    }
  ],
  projects: [],
  reports: [],
  career: {
    resumeText:
      "Master's in Cybersecurity from Webster University. Pursuing doctorate at Belhaven University. Cybersecurity interests include SOC analysis, vulnerability management, GRC, application security, cloud security, bug bounty research, and AI-assisted security operations.",
    targetRoles: "Cybersecurity intern, SOC analyst intern, GRC intern, vulnerability management intern, application security intern, cloud security intern",
    workAuthNotes:
      "F-1 student. CPT authorization must be approved on I-20 before any off-campus work starts. Role should be directly related to cybersecurity studies.",
    applications: []
  },
  chat: [
    {
      role: "assistant",
      text: "Achavelli is ready. I can help organize your day, shape doctorate research, keep bug bounty work inside authorized scope, and remember the important details you save here."
    }
  ],
  voiceLock: {
    enabled: true,
    phrase: "achavelli unlock",
    voiceprint: null,
    lastScore: null,
    unlockedUntil: 0
  },
  latestResearch: "",
  latestSecurity: "",
  latestJobPacket: ""
};

let state = loadState();
const elements = {};
const viewTitles = {
  today: "Good morning, Achavelli",
  ask: "Ask Achavelli",
  research: "Research Desk",
  jobs: "Job Command Center",
  security: "Bug Bounty Analyzer",
  memory: "Memory and Permissions"
};

const permissionMeta = [
  ["email", "Email", "Drafts and inbox context"],
  ["calendar", "Calendar", "Deadlines and appointments"],
  ["drive", "Drive", "Documents and PDFs"],
  ["files", "Mac files", "Local research folders"],
  ["browser", "Browser", "Approved web actions"],
  ["github", "GitHub", "Code and security reports"],
  ["cards", "Cards", "Locked"],
  ["wallets", "Wallets", "Locked"]
];

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  renderAll();
  registerServiceWorker();
  refreshIcons();
});

function cacheElements() {
  [
    "dateLine",
    "viewTitle",
    "voiceButton",
    "exportButton",
    "focusCount",
    "projectCount",
    "jobCount",
    "jobsTotalCount",
    "jobsAppliedCount",
    "jobsPendingCount",
    "jobsRejectedCount",
    "jobsAssessmentCount",
    "jobsInterviewCount",
    "resumeText",
    "targetRoles",
    "workAuthNotes",
    "saveCareerProfile",
    "jobCompany",
    "jobRole",
    "jobLink",
    "jobStatus",
    "jobDate",
    "jobNextStep",
    "jobDescription",
    "analyzeJob",
    "saveApplication",
    "jobOutput",
    "applicationList",
    "exportJobs",
    "taskList",
    "taskForm",
    "taskInput",
    "quickCapture",
    "saveCapture",
    "nextMoves",
    "nextMoveStamp",
    "chatLog",
    "chatForm",
    "chatInput",
    "researchTopic",
    "researchQuestion",
    "researchNotes",
    "buildResearch",
    "saveResearch",
    "researchOutput",
    "researchSavedCount",
    "programName",
    "targetAsset",
    "scopeNotes",
    "bountyFile",
    "scopeApproved",
    "assessSecurity",
    "saveSecurity",
    "securityOutput",
    "securitySavedCount",
    "profileName",
    "profileSchool",
    "profileGoal",
    "saveProfile",
    "voiceLockEnabled",
    "unlockPhrase",
    "voiceLockStatus",
    "saveVoiceLock",
    "enrollVoice",
    "permissionList",
    "memoryList",
    "memoryCount",
    "toast"
  ].forEach((id) => {
    elements[id] = document.getElementById(id);
  });
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  document.querySelectorAll(".command-chip").forEach((button) => {
    button.addEventListener("click", () => handleCommand(button.dataset.command));
  });

  elements.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addTask(elements.taskInput.value.trim());
    elements.taskInput.value = "";
  });

  elements.saveCapture.addEventListener("click", () => {
    const text = elements.quickCapture.value.trim();
    if (!text) return;
    addMemory(text);
    if (/^(task|todo|priority):/i.test(text)) {
      addTask(text.replace(/^(task|todo|priority):/i, "").trim());
    }
    elements.quickCapture.value = "";
    showToast("Saved to memory");
  });

  elements.chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(elements.chatInput.value.trim());
    elements.chatInput.value = "";
  });

  elements.buildResearch.addEventListener("click", () => {
    const blueprint = buildResearchBlueprint();
    state.latestResearch = blueprint;
    saveState();
    renderResearchOutput();
    showToast("Blueprint built");
  });

  elements.saveResearch.addEventListener("click", saveResearchProject);

  elements.saveCareerProfile.addEventListener("click", saveCareerProfile);
  elements.analyzeJob.addEventListener("click", () => {
    state.latestJobPacket = buildJobPacket();
    saveState();
    renderJobOutput();
    showToast("Application packet ready");
  });
  elements.saveApplication.addEventListener("click", saveApplication);
  elements.exportJobs.addEventListener("click", exportJobsCsv);

  elements.assessSecurity.addEventListener("click", () => {
    const assessment = buildSecurityAssessment();
    state.latestSecurity = assessment;
    saveState();
    renderSecurityOutput();
    showToast("Bug findings ready");
  });

  elements.bountyFile.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    elements.scopeNotes.value = await file.text();
    showToast("Document imported");
  });

  elements.saveSecurity.addEventListener("click", saveSecurityReport);

  elements.saveProfile.addEventListener("click", () => {
    state.profile.name = elements.profileName.value.trim() || APP_NAME;
    state.profile.school = elements.profileSchool.value.trim() || "Belhaven University";
    state.profile.goal = elements.profileGoal.value.trim() || state.profile.goal;
    saveState();
    renderHeader();
    renderProfile();
    showToast("Profile saved");
  });

  elements.saveVoiceLock.addEventListener("click", () => {
    const phrase = normalizePhrase(elements.unlockPhrase.value);
    state.voiceLock.enabled = elements.voiceLockEnabled.checked;
    state.voiceLock.phrase = phrase || "achavelli unlock";
    state.voiceLock.unlockedUntil = 0;
    saveState();
    renderVoiceLock();
    showToast("Voice lock saved");
  });

  elements.enrollVoice.addEventListener("click", enrollVoiceprint);

  elements.exportButton.addEventListener("click", exportData);
  elements.voiceButton.addEventListener("click", startVoiceInput);
}

function showView(view) {
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === view);
  });
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  elements.viewTitle.textContent = viewTitles[view] || APP_NAME;
  refreshIcons();
}

function renderAll() {
  renderHeader();
  renderTasks();
  renderNextMoves();
  renderChat();
  renderResearchOutput();
  renderCareer();
  renderJobMetrics();
  renderJobOutput();
  renderApplicationList();
  renderSecurityOutput();
  renderProfile();
  renderVoiceLock();
  renderPermissions();
  renderMemory();
  refreshIcons();
}

function renderHeader() {
  const now = new Date();
  elements.dateLine.textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(now);
  const activeView = document.querySelector(".view.active")?.id || "today";
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  viewTitles.today = `${greeting}, ${state.profile.name || APP_NAME}`;
  elements.viewTitle.textContent = viewTitles[activeView] || viewTitles.today;
  elements.focusCount.textContent = state.tasks.filter((task) => !task.done).length;
  elements.projectCount.textContent = state.projects.length;
  elements.jobCount.textContent = state.career.applications.length;
  elements.researchSavedCount.textContent = `${state.projects.length} saved`;
  elements.securitySavedCount.textContent = `${state.reports.length} saved`;
}

function renderTasks() {
  if (!state.tasks.length) {
    elements.taskList.innerHTML = `<div class="empty-state">No priorities yet.</div>`;
    return;
  }

  elements.taskList.innerHTML = state.tasks
    .map(
      (task) => `
        <label class="task-item ${task.done ? "completed" : ""}">
          <input type="checkbox" data-task-toggle="${task.id}" ${task.done ? "checked" : ""} />
          <span>${escapeHtml(task.text)}</span>
          <button class="icon-button list-action" data-task-delete="${task.id}" type="button" aria-label="Delete priority">
            <i data-lucide="x"></i>
          </button>
        </label>
      `
    )
    .join("");

  elements.taskList.querySelectorAll("[data-task-toggle]").forEach((input) => {
    input.addEventListener("change", () => {
      const task = state.tasks.find((item) => item.id === input.dataset.taskToggle);
      if (task) task.done = input.checked;
      saveState();
      renderTasks();
      renderHeader();
      renderNextMoves();
    });
  });

  elements.taskList.querySelectorAll("[data-task-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tasks = state.tasks.filter((task) => task.id !== button.dataset.taskDelete);
      saveState();
      renderTasks();
      renderHeader();
      renderNextMoves();
    });
  });
  refreshIcons();
}

function renderNextMoves() {
  const openTasks = state.tasks.filter((task) => !task.done).slice(0, 3);
  const moves = openTasks.length
    ? openTasks.map((task, index) => ({
        title: index === 0 ? "Start here" : index === 1 ? "Then" : "After that",
        body: task.text
      }))
    : [
        { title: "Research", body: "Save a doctorate topic and build the first blueprint." },
        { title: "Career", body: "Find a CPT-eligible cybersecurity role and keep the DSO approval path clean." },
        { title: "Security", body: "Choose one authorized bounty program and document the scope." }
      ];

  elements.nextMoves.innerHTML = moves
    .map(
      (move) => `
        <article class="move-card">
          <strong>${escapeHtml(move.title)}</strong>
          <p>${escapeHtml(move.body)}</p>
        </article>
      `
    )
    .join("");
  elements.nextMoveStamp.textContent = `Updated ${new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date())}`;
}

function renderChat() {
  elements.chatLog.innerHTML = state.chat
    .map(
      (message) => `
        <div class="chat-message ${message.role}">
          <div class="chat-avatar">
            <i data-lucide="${message.role === "assistant" ? "sparkles" : "user"}"></i>
          </div>
          <div class="chat-bubble">${formatAssistantText(message.text)}</div>
        </div>
      `
    )
    .join("");
  elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
  refreshIcons();
}

function renderResearchOutput() {
  const hasOutput = Boolean(state.latestResearch);
  elements.researchOutput.classList.toggle("empty-state", !hasOutput);
  elements.researchOutput.innerHTML = hasOutput ? state.latestResearch : "No blueprint yet.";
  elements.researchSavedCount.textContent = `${state.projects.length} saved`;
}

function renderCareer() {
  elements.resumeText.value = state.career.resumeText || "";
  elements.targetRoles.value = state.career.targetRoles || "";
  elements.workAuthNotes.value = state.career.workAuthNotes || "";
  if (!elements.jobDate.value) {
    elements.jobDate.value = new Date().toISOString().slice(0, 10);
  }
}

function renderJobMetrics() {
  const counts = countApplications();
  elements.jobsTotalCount.textContent = counts.total;
  elements.jobsAppliedCount.textContent = counts.applied;
  elements.jobsPendingCount.textContent = counts.pending;
  elements.jobsRejectedCount.textContent = counts.rejected;
  elements.jobsAssessmentCount.textContent = counts.assessment;
  elements.jobsInterviewCount.textContent = counts.interview;
}

function renderJobOutput() {
  const hasOutput = Boolean(state.latestJobPacket);
  elements.jobOutput.classList.toggle("empty-state", !hasOutput);
  elements.jobOutput.innerHTML = hasOutput ? state.latestJobPacket : "No job analyzed yet.";
}

function renderApplicationList() {
  const applications = state.career.applications || [];
  if (!applications.length) {
    elements.applicationList.innerHTML = `<div class="empty-state">No applications tracked yet.</div>`;
    return;
  }

  elements.applicationList.innerHTML = applications
    .map(
      (application) => `
        <article class="application-card">
          <header>
            <div>
              <strong>${escapeHtml(application.role || "Untitled role")}</strong>
              <span>${escapeHtml(application.company || "Unknown company")}</span>
            </div>
            <span class="status-badge ${application.status}">${formatStatus(application.status)}</span>
          </header>
          <div class="application-meta">
            <span>${escapeHtml(application.date || "No date")}</span>
            <span>Fit ${application.fitScore ?? 0}%</span>
          </div>
          <p>${escapeHtml(application.nextStep || "No next step saved.")}</p>
          <div class="application-actions">
            ${application.link ? `<a href="${escapeHtml(application.link)}" target="_blank" rel="noreferrer">Open job</a>` : ""}
            <button class="quiet-button small-button" data-application-copy="${application.id}" type="button">
              <i data-lucide="copy"></i>
              Packet
            </button>
            <button class="icon-button list-action" data-application-delete="${application.id}" type="button" aria-label="Delete application">
              <i data-lucide="x"></i>
            </button>
          </div>
        </article>
      `
    )
    .join("");

  elements.applicationList.querySelectorAll("[data-application-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.career.applications = state.career.applications.filter((item) => item.id !== button.dataset.applicationDelete);
      saveState();
      renderHeader();
      renderJobMetrics();
      renderApplicationList();
    });
  });

  elements.applicationList.querySelectorAll("[data-application-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const application = state.career.applications.find((item) => item.id === button.dataset.applicationCopy);
      if (!application) return;
      await navigator.clipboard?.writeText(stripHtml(application.packet || ""));
      showToast("Application packet copied");
    });
  });
  refreshIcons();
}

function renderSecurityOutput() {
  const hasOutput = Boolean(state.latestSecurity);
  elements.securityOutput.classList.toggle("empty-state", !hasOutput);
  elements.securityOutput.innerHTML = hasOutput ? state.latestSecurity : "No assessment yet.";
  elements.securitySavedCount.textContent = `${state.reports.length} saved`;
}

function renderProfile() {
  elements.profileName.value = state.profile.name || "";
  elements.profileSchool.value = state.profile.school || "";
  elements.profileGoal.value = state.profile.goal || "";
}

function renderVoiceLock() {
  elements.voiceLockEnabled.checked = Boolean(state.voiceLock.enabled);
  elements.unlockPhrase.value = state.voiceLock.phrase || "achavelli unlock";
  const isUnlocked = voiceIsUnlocked();
  const status = state.voiceLock.enabled
    ? isUnlocked
      ? "Voice commands are unlocked for this device for a few minutes."
      : state.voiceLock.voiceprint
        ? `Say the exact unlock phrase. Voiceprint match is active${state.voiceLock.lastScore ? `, last match ${Math.round(state.voiceLock.lastScore * 100)}%` : ""}.`
        : "Say the exact unlock phrase. Enroll your voice to add a local voiceprint check."
    : "Voice commands are not gated by the unlock phrase.";
  elements.voiceLockStatus.textContent = status;
}

function renderPermissions() {
  elements.permissionList.innerHTML = permissionMeta
    .map(([key, label, description]) => {
      const locked = key === "cards" || key === "wallets";
      const checked = locked ? false : Boolean(state.permissions[key]);
      return `
        <label class="permission-row ${locked ? "locked" : ""}">
          <div>
            <strong>${label}</strong>
            <span>${description}</span>
          </div>
          <input type="checkbox" data-permission="${key}" ${checked ? "checked" : ""} ${locked ? "disabled" : ""} />
        </label>
      `;
    })
    .join("");

  elements.permissionList.querySelectorAll("[data-permission]").forEach((input) => {
    input.addEventListener("change", () => {
      const key = input.dataset.permission;
      if (key === "cards" || key === "wallets") {
        input.checked = false;
        return;
      }
      state.permissions[key] = input.checked;
      saveState();
      showToast(`${permissionLabel(key)} ${input.checked ? "enabled" : "disabled"}`);
    });
  });
}

function renderMemory() {
  elements.memoryCount.textContent = `${state.memories.length} notes`;
  if (!state.memories.length) {
    elements.memoryList.innerHTML = `<div class="empty-state">No saved memory yet.</div>`;
    return;
  }

  elements.memoryList.innerHTML = state.memories
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(
      (memory) => `
        <article class="memory-item">
          <header>
            <strong>Saved note</strong>
            <time>${formatShortDate(memory.createdAt)}</time>
          </header>
          <p>${escapeHtml(memory.text)}</p>
        </article>
      `
    )
    .join("");
}

function addTask(text) {
  if (!text) return;
  state.tasks.unshift({ id: createId("task"), text, done: false });
  saveState();
  renderTasks();
  renderHeader();
  renderNextMoves();
  showToast("Priority added");
}

function addMemory(text) {
  state.memories.push({ id: createId("mem"), text, createdAt: new Date().toISOString() });
  saveState();
  renderMemory();
}

function sendMessage(text) {
  if (!text) return;
  state.chat.push({ role: "user", text });
  state.chat.push({ role: "assistant", text: composeReply(text) });
  saveState();
  renderChat();
}

function composeReply(rawText) {
  const text = rawText.toLowerCase();
  const name = state.profile.name || APP_NAME;

  if (/(cpt|opt|stem|h-?1b|visa|f-1|international)/i.test(rawText)) {
    return [
      `${name}, keep this clean: do not start paid work until the DSO authorization is on your I-20 for CPT, or the right OPT/STEM/H-1B path is approved.`,
      "Best next action: get the company offer letter, confirm the role is related to your degree, send it to Belhaven DSO, and save the written approval."
    ].join("\n\n");
  }

  if (/(research|paper|doctorate|citation|thesis|literature|belhaven)/i.test(rawText)) {
    return [
      "For the paper, we should reduce the topic to one research question first.",
      "Use this frame: problem, population/system, cybersecurity control or risk, method, expected contribution.",
      "Open Research Desk and I will turn the topic into an outline, source matrix, search queries, and first-week writing plan."
    ].join("\n\n");
  }

  if (/(bug|bounty|vulnerability|hackerone|bugcrowd|intigriti|yeswehack|scan|xss|idor|ssrf|sqli)/i.test(rawText)) {
    return [
      "I can help with bug bounty work only inside authorized scope.",
      "The highest-value path is usually broken access control, IDOR, auth/session logic, exposed secrets, SSRF surfaces, unsafe file upload, cloud storage exposure, and business logic flaws.",
      "Use Security Lab with the program name, target asset, and notes. I will give you a safe report plan and evidence checklist."
    ].join("\n\n");
  }

  if (/(apply|application|resume|assessment|interview|rejected|pending|job|internship|linkedin|indeed|money|debt|fee|income|company)/i.test(rawText)) {
    const counts = countApplications();
    return [
      `Your pipeline has ${counts.total} tracked applications: ${counts.applied} applied, ${counts.pending} pending, ${counts.rejected} rejected, ${counts.assessment} assessments, and ${counts.interview} interviews.`,
      "Use Jobs to paste a job description. I will score the fit against your resume, prepare a resume-tailoring checklist, draft a cover message, and save the status.",
      "For submissions, Achavelli should prepare and review with you before anything is sent."
    ].join("\n\n");
  }

  if (/(today|plan|schedule|priority|next)/i.test(rawText)) {
    const open = state.tasks.filter((task) => !task.done).slice(0, 3);
    if (!open.length) return "Your command stack is clear. Add one research priority, one CPT career priority, and one health/admin priority.";
    return `Your next three moves:\n\n${open.map((task, index) => `${index + 1}. ${task.text}`).join("\n")}`;
  }

  return [
    "I can help turn that into a concrete next action.",
    "Tell me whether this is for school, career, bug bounty, immigration-safe planning, or personal organization, and I will shape it into steps."
  ].join("\n\n");
}

function handleCommand(command) {
  const prompts = {
    "daily-plan": "Plan my day based on my current priorities.",
    "research-paper": "Help me create a research paper plan for my doctorate.",
    "bug-bounty": "Give me a safe bug bounty checklist for an authorized program.",
    "career-money": "Help me track job applications, prepare application packets, and choose CPT-safe cybersecurity roles.",
    "visa-safe": "What guardrails should I follow as an F-1 international student?"
  };
  showView("ask");
  sendMessage(prompts[command] || "Help me decide the next best action.");
}

function saveCareerProfile() {
  state.career.resumeText = elements.resumeText.value.trim();
  state.career.targetRoles = elements.targetRoles.value.trim();
  state.career.workAuthNotes = elements.workAuthNotes.value.trim();
  saveState();
  showToast("Career profile saved");
}

function buildJobPacket() {
  const job = getJobFormValues();
  const fit = scoreJobFit(job.description, state.career.resumeText, job.role);
  const role = job.role || "Target role";
  const company = job.company || "Target company";

  return `
    <h3>${escapeHtml(role)} at ${escapeHtml(company)}</h3>
    <div class="match-hero">
      <div class="match-score">
        <strong>${fit.score}%</strong>
        <span>${escapeHtml(fit.label)}</span>
      </div>
      <p>${escapeHtml(fit.verdict)}</p>
    </div>
    <h3>Resume Match Breakdown</h3>
    <div class="component-list">
      ${fit.components
        .map(
          (component) => `
            <div class="component-row">
              <div>
                <strong>${escapeHtml(component.label)}</strong>
                <span>${component.score}%</span>
              </div>
              <div class="component-bar" aria-label="${escapeHtml(component.label)} ${component.score}%">
                <span style="width: ${component.score}%"></span>
              </div>
            </div>
          `
        )
        .join("")}
    </div>
    <h3>Matched Evidence</h3>
    <div class="keyword-pills">
      ${fit.matchedKeywords.length ? fit.matchedKeywords.map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("") : "<span>No strong keyword overlap yet</span>"}
    </div>
    <h3>Missing Or Weak Signals</h3>
    <ul>
      ${fit.gaps.map((gap) => `<li>${escapeHtml(gap)}</li>`).join("")}
    </ul>
    <h3>Resume Tailoring Checklist</h3>
    <ul>
      <li>Move the most relevant cybersecurity skills into the top third of the resume.</li>
      <li>Mirror truthful job keywords: ${fit.priorityKeywords.length ? fit.priorityKeywords.map(escapeHtml).join(", ") : "security, analysis, risk, cloud, monitoring"}.</li>
      <li>Add measurable outcomes for projects, labs, internships, or coursework.</li>
      <li>Keep work authorization language simple: CPT authorization available through school process before start date.</li>
      ${fit.missingKeywords.length ? `<li>Consider adding truthful evidence for: ${fit.missingKeywords.map(escapeHtml).join(", ")}.</li>` : ""}
    </ul>
    <h3>Apply Decision</h3>
    <p><strong>${escapeHtml(fit.decision.title)}:</strong> ${escapeHtml(fit.decision.body)}</p>
    <h3>Cover Message Draft</h3>
    <p>Hello ${escapeHtml(company)} team,</p>
    <p>I am pursuing my doctorate at Belhaven University after completing a master's in cybersecurity at Webster University. I am interested in the ${escapeHtml(role)} role because it aligns with my cybersecurity background, hands-on security research, and focus on practical risk reduction. I can bring strong learning speed, security analysis discipline, and careful documentation to the team.</p>
    <p>I would welcome the opportunity to discuss how my cybersecurity training and current doctoral work can support this role.</p>
    <h3>Submission Guardrail</h3>
    <ul>
      <li>Review every answer before submission.</li>
      <li>Do not claim experience, authorization, certifications, or skills you do not have.</li>
      <li>Save confirmation emails and update status after applying.</li>
    </ul>
    <h3>Next Step</h3>
    <p>${escapeHtml(job.nextStep || "Review the packet, tailor the resume, then apply manually or through an approved connector.")}</p>
  `;
}

function saveApplication() {
  const job = getJobFormValues();
  if (!job.company && !job.role) {
    showToast("Add company or role first");
    return;
  }

  const packet = state.latestJobPacket || buildJobPacket();
  const fit = scoreJobFit(job.description, state.career.resumeText, job.role);
  state.latestJobPacket = packet;
  state.career.applications.unshift({
    id: createId("app"),
    company: job.company || "Unknown company",
    role: job.role || "Untitled role",
    link: job.link,
    status: job.status,
    date: job.date || new Date().toISOString().slice(0, 10),
    nextStep: job.nextStep,
    description: job.description,
    fitScore: fit.score,
    packet,
    createdAt: new Date().toISOString()
  });
  saveState();
  renderHeader();
  renderJobMetrics();
  renderJobOutput();
  renderApplicationList();
  showToast("Application saved");
}

function getJobFormValues() {
  return {
    company: elements.jobCompany.value.trim(),
    role: elements.jobRole.value.trim(),
    link: elements.jobLink.value.trim(),
    status: elements.jobStatus.value,
    date: elements.jobDate.value,
    nextStep: elements.jobNextStep.value.trim(),
    description: elements.jobDescription.value.trim()
  };
}

function scoreJobFit(description, resume, role = "") {
  const jobText = normalizeText(`${role} ${description}`);
  const resumeText = normalizeText(`${resume} ${state.career.targetRoles}`);
  const authText = normalizeText(state.career.workAuthNotes);
  const jobKeywords = extractKeywords(description).slice(0, 28);
  const resumeKeywords = extractKeywords(resumeText);
  const matchedKeywords = jobKeywords.filter((keyword) => resumeKeywords.includes(keyword));
  const missingKeywords = jobKeywords.filter((keyword) => !resumeKeywords.includes(keyword)).slice(0, 10);
  const priorityKeywords = unique([...matchedKeywords, ...jobKeywords]).slice(0, 12);

  const skillGroups = [
    { label: "SOC/SIEM", terms: ["soc", "siem", "splunk", "sentinel", "elastic", "alert", "monitoring", "triage"] },
    { label: "Vulnerability Management", terms: ["vulnerability", "nessus", "qualys", "tenable", "remediation", "patch", "cve"] },
    { label: "GRC/Risk", terms: ["grc", "risk", "compliance", "audit", "policy", "nist", "iso", "control"] },
    { label: "Cloud Security", terms: ["cloud", "aws", "azure", "gcp", "iam", "s3", "security group"] },
    { label: "Application Security", terms: ["application", "appsec", "owasp", "api", "xss", "sqli", "idor", "burp"] },
    { label: "Incident Response", terms: ["incident", "response", "forensic", "containment", "edr", "playbook"] },
    { label: "Scripting", terms: ["python", "bash", "powershell", "automation", "script"] },
    { label: "Systems/Network", terms: ["linux", "windows", "network", "tcp", "dns", "firewall"] }
  ];

  const requiredGroups = skillGroups.filter((group) => hasAnyTerm(jobText, group.terms));
  const matchedGroups = requiredGroups.filter((group) => hasAnyTerm(resumeText, group.terms));
  const missingGroups = requiredGroups.filter((group) => !hasAnyTerm(resumeText, group.terms));
  const targetRoleWords = state.career.targetRoles
    .toLowerCase()
    .split(/[,/]/)
    .flatMap((targetRole) => targetRole.trim().split(/\s+/))
    .filter((word) => word.length > 3);
  const roleHits = unique(targetRoleWords).filter((word) => jobText.includes(word));

  const keywordScore = ratioScore(matchedKeywords.length, Math.min(jobKeywords.length || 1, 18));
  const skillScore = requiredGroups.length ? ratioScore(matchedGroups.length, requiredGroups.length) : 62;
  const roleScore = roleHits.length ? Math.min(96, 55 + roleHits.length * 10) : 42;
  const experienceSignals = ["master", "doctorate", "cyber", "project", "intern", "analyst", "research", "bug bounty", "cloud", "soc"].filter((term) =>
    resumeText.includes(term)
  );
  const experienceScore = Math.min(95, 35 + experienceSignals.length * 7);
  const authScore = authText.includes("cpt") || authText.includes("f 1") || authText.includes("f-1") ? 86 : 45;

  const score = Math.round(keywordScore * 0.34 + skillScore * 0.28 + roleScore * 0.18 + experienceScore * 0.14 + authScore * 0.06);
  const label = score >= 82 ? "Strong resume match" : score >= 68 ? "Good resume match" : score >= 52 ? "Possible match after tailoring" : "Weak match right now";
  const verdict =
    score >= 82
      ? "Apply after a quick review. The resume already reflects most of this job profile."
      : score >= 68
        ? "Apply after tailoring the top section and adding the missing keywords you can truthfully support."
        : score >= 52
          ? "Tailor first. The role is possible, but the resume needs stronger evidence before submitting."
          : "Do not rush this one. Either improve the resume evidence or target a closer role.";
  const gaps = [
    missingGroups.length
      ? `Add truthful evidence for these skill areas: ${missingGroups.map((group) => group.label).join(", ")}.`
      : "No major required skill family is missing from the resume profile.",
    missingKeywords.length
      ? `Missing ATS/job keywords: ${missingKeywords.slice(0, 8).join(", ")}.`
      : "Keyword coverage is strong for this job description.",
    authScore < 70
      ? "Add a concise CPT/F-1 work authorization note so you do not lose track of legal start-date requirements."
      : "CPT/F-1 work authorization note is present for review before applying."
  ];
  const decision =
    score >= 75
      ? { title: "Apply", body: "The profile is strong enough to submit after you review the resume and application answers." }
      : score >= 52
        ? { title: "Tailor First", body: "Update the resume summary, skills, and project bullets before submitting." }
        : { title: "Hold", body: "Save it if useful, but prioritize closer cybersecurity internship roles first." };

  return {
    score,
    label,
    verdict,
    components: [
      { label: "Keyword match", score: keywordScore },
      { label: "Skill family match", score: skillScore },
      { label: "Role alignment", score: roleScore },
      { label: "Experience evidence", score: experienceScore },
      { label: "CPT readiness note", score: authScore }
    ],
    matchedKeywords: matchedKeywords.slice(0, 14),
    missingKeywords,
    priorityKeywords,
    matchedSkillGroups: matchedGroups.map((group) => group.label),
    missingSkillGroups: missingGroups.map((group) => group.label),
    gaps,
    decision
  };
}

function countApplications() {
  const applications = state.career.applications || [];
  return {
    total: applications.length,
    applied: applications.filter((item) => item.status === "applied").length,
    pending: applications.filter((item) => item.status === "pending" || item.status === "drafted").length,
    rejected: applications.filter((item) => item.status === "rejected").length,
    assessment: applications.filter((item) => item.status === "assessment").length,
    interview: applications.filter((item) => item.status === "interview").length
  };
}

function exportJobsCsv() {
  const rows = [
    ["Company", "Role", "Status", "Date", "Fit Score", "Next Step", "Link"],
    ...state.career.applications.map((item) => [
      item.company,
      item.role,
      formatStatus(item.status),
      item.date,
      item.fitScore,
      item.nextStep,
      item.link
    ])
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `achavelli-jobs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Jobs export started");
}

function buildResearchBlueprint() {
  const topic = elements.researchTopic.value.trim() || "Cybersecurity risk management";
  const question =
    elements.researchQuestion.value.trim() ||
    "How can organizations reduce high-impact cybersecurity risk with practical controls?";
  const notes = elements.researchNotes.value.trim();
  const keywords = extractKeywords(`${topic} ${question} ${notes}`).slice(0, 8);
  const sourceIdeas = keywords.length
    ? keywords.map((word) => `${word} cybersecurity empirical study`)
    : ["zero trust adoption study", "security awareness effectiveness", "cloud misconfiguration risk"];

  return `
    <h3>${escapeHtml(topic)}</h3>
    <p><strong>Research question:</strong> ${escapeHtml(question)}</p>
    <h3>Working Outline</h3>
    <ol>
      <li>Introduction: define the cybersecurity problem, affected population, and why it matters now.</li>
      <li>Literature review: compare the strongest theories, frameworks, and recent empirical findings.</li>
      <li>Method: explain data sources, inclusion criteria, and how evidence will be evaluated.</li>
      <li>Analysis: connect findings to security practice, organizational constraints, and measurable outcomes.</li>
      <li>Conclusion: state the contribution, limitations, and future research direction.</li>
    </ol>
    <h3>Source Matrix</h3>
    <ul>
      <li>Peer-reviewed studies: methods, sample size, limits, and findings.</li>
      <li>Standards: NIST, CIS, ISO, and sector-specific guidance where relevant.</li>
      <li>Recent threat reports: use for context, not as the main evidence base.</li>
      <li>Case studies: only include when they directly support the research question.</li>
    </ul>
    <h3>Search Queries</h3>
    <ul>
      ${sourceIdeas.map((idea) => `<li><code>${escapeHtml(idea)}</code></li>`).join("")}
    </ul>
    <h3>Next Writing Block</h3>
    <ul>
      <li>Write a 150-word problem statement.</li>
      <li>Collect 8 scholarly sources and mark each as theory, method, or evidence.</li>
      <li>Create an annotated bibliography entry for the 3 strongest sources.</li>
    </ul>
  `;
}

function saveResearchProject() {
  const topic = elements.researchTopic.value.trim() || "Untitled research project";
  const question = elements.researchQuestion.value.trim();
  const notes = elements.researchNotes.value.trim();
  const blueprint = state.latestResearch || buildResearchBlueprint();
  state.projects.unshift({
    id: createId("project"),
    topic,
    question,
    notes,
    blueprint,
    createdAt: new Date().toISOString()
  });
  state.latestResearch = blueprint;
  saveState();
  renderHeader();
  renderResearchOutput();
  showToast("Research project saved");
}

function buildSecurityAssessment() {
  const program = elements.programName.value.trim() || "Unspecified program";
  const target = elements.targetAsset.value.trim() || "Unspecified target";
  const notes = elements.scopeNotes.value.trim();
  const authorized = elements.scopeApproved.checked;
  const review = analyzeBountyDocument(`${target}\n${notes}`);

  if (!authorized) {
    return `
      <h3>Scope Gate</h3>
      <p><strong>${escapeHtml(program)}</strong> is not marked as authorized yet. I can organize the document, but I will not label findings as actionable bounty submissions until authorized scope is confirmed.</p>
      <h3>Document Signals Found</h3>
      <ul>
        <li>Assets/endpoints detected: ${review.assets.length || 0}</li>
        <li>Potential vulnerability areas: ${review.findings.length || 0}</li>
        <li>Document length: ${notes.length.toLocaleString()} characters</li>
      </ul>
      <h3>Required Before Real Testing</h3>
      <ul>
        <li>Confirm this target is listed in a bug bounty or VDP scope.</li>
        <li>Confirm allowed test methods, prohibited actions, rate limits, and report rules.</li>
        <li>Use test accounts only where the program allows them.</li>
      </ul>
    `;
  }

  const findings = review.findings;
  return `
    <h3>${escapeHtml(program)}</h3>
    <p><strong>Target:</strong> ${escapeHtml(target)}</p>
    <div class="finding-summary">
      <span>${findings.length} likely findings</span>
      <span>${review.assets.length} assets/endpoints</span>
      <span>${review.highCount} high priority</span>
    </div>
    <h3>Likely Bugs From The Document</h3>
    <div class="finding-list">
      ${findings.map(renderFinding).join("")}
    </div>
    <h3>Detected Assets And Endpoints</h3>
    <div class="keyword-pills">
      ${review.assets.length ? review.assets.slice(0, 18).map((asset) => `<span>${escapeHtml(asset)}</span>`).join("") : "<span>No concrete asset was detected. Add URLs, API paths, or endpoint names for stronger analysis.</span>"}
    </div>
    <h3>Documentation Needed Before Submission</h3>
    <ul>
      <li>Exact in-scope asset and program policy link.</li>
      <li>Minimum safe reproduction steps using allowed test accounts.</li>
      <li>Request and response evidence with tokens, cookies, and private data redacted.</li>
      <li>Clear impact: account takeover, cross-tenant data access, privilege escalation, data modification, or sensitive disclosure.</li>
      <li>Remediation tied to the root cause, not just the symptom.</li>
    </ul>
  `;
}

function saveSecurityReport() {
  const program = elements.programName.value.trim() || "Untitled program";
  const target = elements.targetAsset.value.trim();
  const notes = elements.scopeNotes.value.trim();
  const assessment = state.latestSecurity || buildSecurityAssessment();
  state.reports.unshift({
    id: createId("report"),
    program,
    target,
    notes,
    authorized: elements.scopeApproved.checked,
    assessment,
    createdAt: new Date().toISOString()
  });
  state.latestSecurity = assessment;
  saveState();
  renderHeader();
  renderSecurityOutput();
  showToast("Security assessment saved");
}

function analyzeBountyDocument(input) {
  const raw = String(input || "");
  const lower = raw.toLowerCase();
  const assets = extractBountyAssets(raw);
  const signatures = [
    {
      title: "Broken access control / IDOR",
      severity: "High",
      terms: ["user_id", "userid", "account", "tenant", "org", "invoice", "order", "profile", "uuid", "object id"],
      patterns: [/user[_-]?id|account|tenant|org|invoice|order|profile|uuid|object id/i, /\/api\/(?:v\d+\/)?(?:users|accounts|orders|invoices|profiles|tenants)/i],
      impact: "A user may access or modify another user, tenant, order, invoice, or profile object.",
      validation: "Use two allowed test accounts and verify whether changing only the object identifier crosses an authorization boundary.",
      remediation: "Enforce server-side object ownership and role checks on every read and write."
    },
    {
      title: "Privilege escalation / role bypass",
      severity: "High",
      terms: ["admin", "role", "permission", "privilege", "team", "invite", "owner", "member"],
      patterns: [/admin|role|permission|privilege|owner|member|team|invite/i, /\/(?:admin|roles|permissions|teams|invites)/i],
      impact: "A lower-privileged user may gain administrator or higher-role actions.",
      validation: "Compare the same action with low-privilege and admin test accounts, preserving request and response evidence.",
      remediation: "Centralize authorization checks and deny privileged actions by default."
    },
    {
      title: "Authentication or session weakness",
      severity: "High",
      terms: ["login", "jwt", "session", "cookie", "oauth", "refresh token", "reset", "mfa", "otp"],
      patterns: [/login|jwt|session|cookie|oauth|refresh token|password reset|mfa|otp/i, /\/(?:auth|login|oauth|session|reset|mfa|otp)/i],
      impact: "Session, token, reset, or MFA logic may allow account takeover or unauthorized access.",
      validation: "Document token lifetime, reset flow behavior, session invalidation, and role changes without bypassing rate limits.",
      remediation: "Harden token expiry, reset validation, MFA enforcement, and session revocation."
    },
    {
      title: "Sensitive data exposure",
      severity: "High",
      terms: ["pii", "email", "phone", "address", "ssn", "token", "secret", "api key", "private"],
      patterns: [/pii|email|phone|address|ssn|token|secret|api[_-]?key|private|confidential/i, /authorization:|set-cookie:|access_token|refresh_token/i],
      impact: "The application may expose private user data, credentials, tokens, or secrets.",
      validation: "Capture minimal redacted evidence showing the data type, affected role, and in-scope endpoint.",
      remediation: "Reduce response data, enforce authorization, redact secrets, and rotate exposed credentials."
    },
    {
      title: "Unsafe file upload or import",
      severity: "Medium",
      terms: ["upload", "file", "avatar", "image", "pdf", "csv", "import", "attachment"],
      patterns: [/upload|file|avatar|image|pdf|csv|import|attachment/i, /\/(?:upload|files|attachments|imports|avatars)/i],
      impact: "File handling may allow unsafe content, unauthorized file access, stored XSS, or parser abuse.",
      validation: "Check allowed file types, storage location, access permissions, and whether uploaded content executes or leaks.",
      remediation: "Validate content server-side, store files outside executable paths, scan content, and enforce object access."
    },
    {
      title: "SSRF, unsafe URL fetch, or open redirect",
      severity: "High",
      terms: ["webhook", "callback", "url", "redirect", "next", "return_url", "fetch", "import from url"],
      patterns: [/webhook|callback|return_url|redirect|next=|url=|fetch|import from url|metadata/i, /\/(?:webhook|callback|redirect|fetch|import)/i],
      impact: "User-controlled URLs may trigger server-side requests, credential leakage, or unsafe redirects.",
      validation: "Stay within the program rules and verify URL allowlisting, redirect handling, and internal-host blocking.",
      remediation: "Use strict allowlists, block private networks and metadata hosts, and validate redirects."
    },
    {
      title: "Stored or reflected XSS",
      severity: "Medium",
      terms: ["html", "script", "markdown", "comment", "template", "rich text", "search", "q"],
      patterns: [/html|script|markdown|comment|template|rich text|search|xss/i, /[?&](?:q|search|query|return)=/i],
      impact: "User-controlled content may execute JavaScript in another user's browser.",
      validation: "Identify the input, rendering context, affected role, and whether the behavior is stored or reflected.",
      remediation: "Contextually encode output, sanitize rich text, and enforce a restrictive content security policy."
    },
    {
      title: "Injection in search, filters, or GraphQL/API queries",
      severity: "Medium",
      terms: ["search", "filter", "sort", "query", "graphql", "sql", "where", "cursor"],
      patterns: [/search|filter|sort|query|graphql|sql|where|cursor/i, /\/(?:graphql|search|query|filter)/i],
      impact: "Query parameters may expose unauthorized data, cause injection, or bypass backend filters.",
      validation: "Document safe input/output differences, error behavior, and authorization impact without destructive payloads.",
      remediation: "Parameterize queries, enforce schema validation, and apply authorization after filtering."
    },
    {
      title: "Business logic or rate-limit weakness",
      severity: "Medium",
      terms: ["rate limit", "otp", "coupon", "invite", "trial", "payment", "reset", "verification"],
      patterns: [/rate limit|otp|coupon|invite|trial|payment|reset|verification|one-time/i],
      impact: "Repeated or reordered workflow actions may bypass intended limits or business rules.",
      validation: "Track exact sequence, account state, limits, and business impact using non-destructive allowed tests.",
      remediation: "Add server-side state checks, idempotency, abuse limits, and workflow integrity validation."
    },
    {
      title: "Cloud storage or public asset exposure",
      severity: "High",
      terms: ["s3", "bucket", "blob", "firebase", "storage", "cloudfront", "cdn", "signed url"],
      patterns: [/s3|bucket|blob|firebase|storage|cloudfront|cdn|signed url/i, /https?:\/\/[^\s]+(?:s3|blob|storage|firebase|cloudfront)[^\s]*/i],
      impact: "Cloud objects may be public, listable, writable, or accessible after signed URL expiry expectations.",
      validation: "Document public readability/listing/write behavior and avoid accessing data outside program rules.",
      remediation: "Disable public access, scope signed URLs, enforce object authorization, and audit bucket policies."
    }
  ];

  const findings = signatures
    .map((signature) => buildBountyFinding(signature, lower, raw, assets))
    .filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence);

  const fallbackFindings = findings.length
    ? findings
    : [
        {
          title: "Insufficient evidence for a concrete bug",
          severity: "Info",
          confidence: 35,
          impact: "The pasted document does not contain enough endpoint, role, parameter, or response evidence to identify a likely vulnerability.",
          evidence: ["Paste scope, endpoint paths, parameters, roles, request/response notes, and observed behavior for stronger results."],
          validation: "Collect the affected asset, role, endpoint, expected behavior, actual behavior, and safe reproduction steps.",
          remediation: "Not applicable until a concrete issue is identified.",
          report: "This is a documentation gap, not a bounty submission yet."
        }
      ];

  return {
    assets,
    findings: fallbackFindings.slice(0, 8),
    highCount: fallbackFindings.filter((finding) => finding.severity === "High" || finding.severity === "Critical").length
  };
}

function buildBountyFinding(signature, lower, raw, assets) {
  const termHits = signature.terms.filter((term) => lower.includes(term));
  const evidence = extractEvidence(raw, signature.patterns);
  const assetBoost = assets.some((asset) => signature.patterns.some((pattern) => pattern.test(asset))) ? 1 : 0;
  const hitScore = termHits.length + evidence.length + assetBoost;
  if (!hitScore) return null;

  const confidence = Math.min(96, 42 + termHits.length * 8 + evidence.length * 10 + assetBoost * 8);
  return {
    title: signature.title,
    severity: confidence >= 78 && signature.severity === "High" ? "High" : signature.severity,
    confidence,
    impact: signature.impact,
    evidence: evidence.length ? evidence : [`Document mentions: ${termHits.slice(0, 6).join(", ")}`],
    validation: signature.validation,
    remediation: signature.remediation,
    report: `Potential ${signature.title.toLowerCase()} in the authorized target. Evidence should prove affected endpoint, role, expected behavior, actual behavior, and impact.`
  };
}

function renderFinding(finding) {
  return `
    <article class="finding-card">
      <header>
        <div>
          <strong>${escapeHtml(finding.title)}</strong>
          <span>${finding.confidence}% confidence</span>
        </div>
        <span class="severity-badge ${finding.severity.toLowerCase()}">${escapeHtml(finding.severity)}</span>
      </header>
      <h4>Evidence pulled from document</h4>
      <ul>
        ${finding.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
      <h4>Impact</h4>
      <p>${escapeHtml(finding.impact)}</p>
      <h4>Safe validation checklist</h4>
      <p>${escapeHtml(finding.validation)}</p>
      <h4>Report draft</h4>
      <p>${escapeHtml(finding.report)}</p>
      <h4>Remediation</h4>
      <p>${escapeHtml(finding.remediation)}</p>
    </article>
  `;
}

function extractBountyAssets(input) {
  const urls = input.match(/https?:\/\/[^\s"'<>`]+/gi) || [];
  const paths = input.match(/\/(?:api|v\d+|graphql|oauth|auth|admin|user|users|account|accounts|profile|profiles|order|orders|invoice|invoices|upload|uploads|file|files|webhook|callback|redirect|search|export|import|tenant|tenants|org|organizations)[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]*/gi) || [];
  return unique([...urls, ...paths]).slice(0, 40);
}

function extractEvidence(raw, patterns) {
  const lines = raw
    .split(/\n+/)
    .flatMap((line) => (line.length > 500 ? line.split(/(?<=[.!?])\s+/) : [line]))
    .map((line) => line.trim())
    .filter(Boolean);
  return lines
    .filter((line) => patterns.some((pattern) => pattern.test(line)))
    .map((line) => line.replace(/\s+/g, " ").slice(0, 260))
    .slice(0, 4);
}

function startVoiceInput(options = {}) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    speak("Voice input is not available in this browser.");
    showToast("Voice input unavailable");
    return;
  }

  const locked = state.voiceLock.enabled && !voiceIsUnlocked() && !options.forceCommand;
  const voiceSamplePromise = locked && state.voiceLock.voiceprint ? captureVoiceSample(3200).catch(() => null) : Promise.resolve(null);
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  elements.voiceButton.classList.add("listening");
  showToast(locked ? "Say unlock phrase" : "Listening");
  recognition.start();

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    if (locked) {
      const voiceSample = await voiceSamplePromise;
      handleVoiceUnlock(transcript, voiceSample);
      return;
    }
    showView("ask");
    sendMessage(transcript);
    speak("Achavelli added that to the conversation.");
  };

  recognition.onerror = () => {
    showToast("Voice input stopped");
  };

  recognition.onend = () => {
    elements.voiceButton.classList.remove("listening");
  };
}

async function enrollVoiceprint() {
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast("Microphone capture unavailable");
    return;
  }

  const phrase = normalizePhrase(elements.unlockPhrase.value || state.voiceLock.phrase);
  state.voiceLock.phrase = phrase || "achavelli unlock";
  state.voiceLock.enabled = true;
  elements.voiceLockEnabled.checked = true;
  showToast(`Say "${state.voiceLock.phrase}"`);
  speak(`Say ${state.voiceLock.phrase} now.`);

  try {
    const sample = await captureVoiceSample(3600);
    state.voiceLock.voiceprint = sample;
    state.voiceLock.lastScore = null;
    state.voiceLock.unlockedUntil = 0;
    saveState();
    renderVoiceLock();
    showToast("Voice enrolled");
    speak("Voice enrolled on this device.");
  } catch {
    showToast("Voice enrollment failed");
  }
}

function handleVoiceUnlock(transcript, voiceSample) {
  const heard = normalizePhrase(transcript);
  const phrase = normalizePhrase(state.voiceLock.phrase);
  const phraseMatches = heard === phrase || heard.includes(phrase);
  const voiceResult = checkVoiceprint(voiceSample);
  state.voiceLock.lastScore = voiceResult.score;

  if (phraseMatches && voiceResult.allowed) {
    state.voiceLock.unlockedUntil = Date.now() + 5 * 60 * 1000;
    saveState();
    renderVoiceLock();
    showToast("Voice unlocked");
    speak("Achavelli unlocked. Press the microphone again and say your command.");
    return;
  }
  state.voiceLock.unlockedUntil = 0;
  saveState();
  renderVoiceLock();
  showToast(phraseMatches ? "Voiceprint denied" : "Phrase denied");
  speak("Voice lock denied.");
}

function voiceIsUnlocked() {
  return Number(state.voiceLock.unlockedUntil || 0) > Date.now();
}

function checkVoiceprint(sample) {
  const enrolled = state.voiceLock.voiceprint;
  if (!enrolled) return { allowed: true, score: null };
  if (!sample) return { allowed: false, score: 0 };
  const score = compareVoiceprints(enrolled, sample);
  return { allowed: score >= 0.62, score };
}

async function captureVoiceSample(durationMs = 3000) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) throw new Error("AudioContext unavailable");

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const frequencyData = new Uint8Array(analyser.frequencyBinCount);
  const timeData = new Uint8Array(analyser.fftSize);
  const frames = [];
  const startedAt = performance.now();

  return new Promise((resolve, reject) => {
    const finish = async () => {
      stream.getTracks().forEach((track) => track.stop());
      await audioContext.close().catch(() => {});
      const voiceprint = averageVoiceFrames(frames);
      voiceprint ? resolve(voiceprint) : reject(new Error("No usable voice frames"));
    };

    const sample = () => {
      analyser.getByteFrequencyData(frequencyData);
      analyser.getByteTimeDomainData(timeData);
      const frame = analyzeVoiceFrame(frequencyData, timeData, audioContext.sampleRate, analyser.fftSize);
      if (frame.rms > 0.01) frames.push(frame);
      if (performance.now() - startedAt >= durationMs) {
        finish();
        return;
      }
      requestAnimationFrame(sample);
    };

    sample();
  });
}

function analyzeVoiceFrame(frequencyData, timeData, sampleRate, fftSize) {
  let total = 0;
  let weighted = 0;
  let low = 0;
  let mid = 0;
  let high = 0;

  frequencyData.forEach((value, index) => {
    const magnitude = value / 255;
    const hz = (index * sampleRate) / fftSize;
    total += magnitude;
    weighted += magnitude * hz;
    if (hz < 500) low += magnitude;
    else if (hz < 2200) mid += magnitude;
    else high += magnitude;
  });

  let rms = 0;
  let crossings = 0;
  let previous = timeData[0] - 128;
  timeData.forEach((value) => {
    const centered = (value - 128) / 128;
    rms += centered * centered;
    if ((value - 128 > 0 && previous < 0) || (value - 128 < 0 && previous > 0)) crossings += 1;
    previous = value - 128;
  });

  rms = Math.sqrt(rms / timeData.length);
  const centroid = total ? weighted / total : 0;
  const energy = total || 1;
  return {
    rms,
    centroid,
    lowRatio: low / energy,
    midRatio: mid / energy,
    highRatio: high / energy,
    zeroCrossing: crossings / timeData.length
  };
}

function averageVoiceFrames(frames) {
  if (!frames.length) return null;
  const keys = Object.keys(frames[0]);
  return keys.reduce((voiceprint, key) => {
    voiceprint[key] = frames.reduce((sum, frame) => sum + frame[key], 0) / frames.length;
    return voiceprint;
  }, {});
}

function compareVoiceprints(enrolled, sample) {
  const distance =
    Math.abs(enrolled.rms - sample.rms) / 0.22 +
    Math.abs(enrolled.centroid - sample.centroid) / 2600 +
    Math.abs(enrolled.lowRatio - sample.lowRatio) / 0.55 +
    Math.abs(enrolled.midRatio - sample.midRatio) / 0.55 +
    Math.abs(enrolled.highRatio - sample.highRatio) / 0.55 +
    Math.abs(enrolled.zeroCrossing - sample.zeroCrossing) / 0.18;
  return Math.max(0, Math.min(1, 1 - distance / 6));
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.96;
  utterance.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function exportData() {
  const payload = JSON.stringify(state, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `achavelli-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Export started");
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY));
    return mergeState(clone(defaultState), saved || {});
  } catch {
    return clone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function mergeState(base, saved) {
  const savedName = saved.profile?.name;
  const profile = { ...base.profile, ...(saved.profile || {}) };
  if (!savedName || savedName === "Rishi") {
    profile.name = APP_NAME;
  }
  const chat = Array.isArray(saved.chat) && saved.chat.length ? saved.chat.map(migrateChatMessage) : base.chat;
  return {
    ...base,
    ...saved,
    profile,
    permissions: {
      ...base.permissions,
      ...(saved.permissions || {}),
      cards: false,
      wallets: false
    },
    tasks: Array.isArray(saved.tasks) ? saved.tasks : base.tasks,
    memories: Array.isArray(saved.memories) ? saved.memories : base.memories,
    projects: Array.isArray(saved.projects) ? saved.projects : base.projects,
    reports: Array.isArray(saved.reports) ? saved.reports : base.reports,
    career: {
      ...base.career,
      ...(saved.career || {}),
      applications: Array.isArray(saved.career?.applications) ? saved.career.applications : base.career.applications
    },
    chat,
    latestJobPacket: saved.latestJobPacket || base.latestJobPacket,
    voiceLock: {
      ...base.voiceLock,
      ...(saved.voiceLock || {}),
      phrase: normalizePhrase(saved.voiceLock?.phrase || base.voiceLock.phrase),
      voiceprint: saved.voiceLock?.voiceprint || base.voiceLock.voiceprint,
      lastScore: saved.voiceLock?.lastScore || base.voiceLock.lastScore
    }
  };
}

function migrateChatMessage(message) {
  return {
    ...message,
    text: String(message.text || "")
      .replaceAll("Astra", APP_NAME)
      .replaceAll("Rishi", APP_NAME)
  };
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 1800);
}

function extractKeywords(text) {
  const stop = new Set([
    "about",
    "after",
    "also",
    "because",
    "between",
    "could",
    "from",
    "have",
    "into",
    "should",
    "that",
    "their",
    "there",
    "this",
    "with",
    "what",
    "when",
    "where",
    "will",
    "cybersecurity"
  ]);
  return [...new Set((text.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) || []).filter((word) => !stop.has(word)))];
}

function formatAssistantText(text) {
  return escapeHtml(text).replace(/\n/g, "<br />");
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function permissionLabel(key) {
  return permissionMeta.find((item) => item[0] === key)?.[1] || key;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAnyTerm(text, terms) {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function ratioScore(matches, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((matches / total) * 100)));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function formatStatus(status) {
  const labels = {
    drafted: "Drafted",
    applied: "Applied",
    pending: "Pending",
    assessment: "Assessment",
    interview: "Interview",
    rejected: "Rejected",
    offer: "Offer"
  };
  return labels[status] || "Pending";
}

function stripHtml(value) {
  const template = document.createElement("template");
  template.innerHTML = value || "";
  return template.content.textContent || "";
}

function escapeCsv(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function normalizePhrase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}
