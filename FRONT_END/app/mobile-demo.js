import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js";
import {
  collection,
  getFirestore,
  limit,
  onSnapshot,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const config = window.PILLY_FIREBASE_CONFIG;
const householdId = "demo-household-eleanor";

let app;
let auth;
let db;
let functions;
let currentUser = null;
let medications = [];
let logs = [];
let notifications = [];

if (config && !String(config.apiKey || "").includes("REPLACE_WITH")) {
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      currentUser = null;
      setDemoDisabled("Sign-in is required before patient, medication, or voice data can be loaded.");
      return;
    }

    currentUser = user;
    await bootDemo();
  });
} else {
  console.warn("Missing Firebase config for mobile demo.");
}

document.addEventListener("DOMContentLoaded", () => {
  wireScreenActions();
});

async function bootDemo() {
  subscribeToFirestore();
  updateScreen();
}

async function ensureCaregiverProfile(uid) {
  throw new Error(`Client-side profile creation is disabled for ${uid}.`);
}

async function ensureDemoData() {
  throw new Error("Client-side demo seeding is disabled. Seed data must be provisioned by a trusted backend/admin path.");
}

function subscribeToFirestore() {
  onSnapshot(query(collection(db, "medications"), where("householdId", "==", householdId)), (snapshot) => {
    medications = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    updateScreen();
  }, handleSnapshotError);

  onSnapshot(query(collection(db, "medicationLogs"), where("householdId", "==", householdId), limit(30)), (snapshot) => {
    logs = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort(sortCreatedDesc);
    updateScreen();
  }, handleSnapshotError);

  onSnapshot(query(collection(db, "notifications"), where("householdId", "==", householdId), limit(20)), (snapshot) => {
    notifications = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort(sortCreatedDesc);
    updateScreen();
  }, handleSnapshotError);
}

function wireScreenActions() {
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setDemoDisabled("This hosted prototype requires a real authenticated household membership before sign-in can continue.");
    });
  });

  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      setDemoDisabled("Medication creation is disabled until caregiver authorization is implemented for this hosted prototype.");
      buttonState(saveBtn, "Save Disabled");
    }, true);
  }

  const takeBtn = document.getElementById("main-take-btn");
  if (takeBtn) {
    takeBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      await recordTakenWithConfirmation(takeBtn);
    }, true);
  }

  const recordBtn = document.getElementById("record-btn");
  if (recordBtn) {
    recordBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      await handleMedicationVoice(recordBtn);
    }, true);
  }

  if (location.pathname.includes("home")) {
    document.querySelectorAll("button").forEach((button) => {
      const icon = button.querySelector(".material-symbols-outlined")?.textContent?.trim();
      if (icon !== "mic" || button.closest("[data-customer-bottom-nav]")) return;
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        await handleHomeMic(button);
      }, true);
    });
  }

  document.querySelectorAll("button").forEach((button) => {
    if (!/Listen to Instructions/i.test(button.innerText || "")) return;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const medication = medicationForEvent("breakfast") || medications[0];
      speak(medication ? reminderCopy(medication, "breakfast") : "Please check your medication instructions.");
    }, true);
  });

  const createCloneButton = document.getElementById("create-voice-clone");
  if (createCloneButton) {
    createCloneButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      await createVoiceCloneFromDashboard(createCloneButton);
    }, true);
  }

  window.simulateMissedDose = async () => {
    const actionButton = findButtonByText("Voice Reminder Then Missed Dose") || findButtonByText("Simulate Missed Dose");
    try {
      await ensureReady();
      buttonState(actionButton, "Playing voice reminder");
      await playReminderForEvent("lunch");
      buttonState(actionButton, "Checking missed dose");
      const result = await callFunctionOrFallback(
        "completeRoutineEvent",
        {
          householdId,
          trigger: "lunch",
          status: "completed"
        },
        () => completeEventInDemoFirestore("lunch")
      );
      showDashboardAlert(Number(result?.missedCount || 0));
    } catch (error) {
      console.warn("Missed-dose simulation failed.", error);
      showDashboardAlert(0, "Missed-dose simulation requires authenticated household access.");
    } finally {
      buttonState(actionButton, "Voice Reminder Then Missed Dose");
    }
  };
}

async function handleHomeMic(button) {
  const label = button.querySelector("span:last-child");
  const originalText = label?.textContent || "";
  await handleMedicationVoice(button, {
    onStart: () => setTemporaryHomePrompt("Listening..."),
    onTranscript: (transcript) => setTemporaryHomePrompt(`Heard: ${transcript}`),
    onUnavailable: () => setTemporaryHomePrompt("Voice input is not supported in this browser. Use the confirmation button instead."),
    onError: () => setTemporaryHomePrompt("Voice input failed. Nothing was recorded as taken."),
    onEnd: () => {
      if (label) label.textContent = originalText;
    },
  });
}

async function handleMedicationVoice(button, hooks = {}) {
  const label = button.querySelector("span:last-child") || button;
  const originalText = label?.textContent || "";
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    hooks.onUnavailable?.();
    if (label) label.textContent = originalText || "Record";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-AU";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  if (label) label.textContent = "Listening...";
  hooks.onStart?.();

  recognition.onresult = async (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    if (!transcript.trim()) {
      hooks.onError?.();
      return;
    }
    hooks.onTranscript?.(transcript);
    await recordTranscriptWithConfirmation(transcript, "voice");
  };
  recognition.onerror = async () => {
    hooks.onError?.();
  };
  recognition.onend = () => {
    if (label) label.textContent = originalText;
    hooks.onEnd?.();
  };
  recognition.start();
}

async function createVoiceCloneFromDashboard(button) {
  buttonState(button, "Voice Clone Disabled");
  setVoiceCloneStatus("Voice cloning is disabled until production-grade consent, retention, deletion, and audit controls are implemented.", true);
}

function setTemporaryHomePrompt(message) {
  const prompt = document.querySelector(".bg-surface-container-low.px-6.py-3.rounded-full");
  if (prompt) prompt.textContent = message;
  const statusText = document.getElementById("status-text");
  if (statusText) statusText.textContent = message;
  setVoiceCloneStatus(message, true);
}

function setDemoDisabled(message) {
  setTemporaryHomePrompt(message);
  document.querySelectorAll("button").forEach((button) => {
    if (button.id === "create-voice-clone" || button.id === "saveBtn" || button.id === "main-take-btn" || button.id === "record-btn") {
      buttonState(button, "Disabled");
    }
  });
}

function handleSnapshotError(error) {
  console.warn("Firestore subscription blocked.", error);
  setDemoDisabled("Authenticated household membership is required before demo data can be loaded.");
}

async function addMedication(data) {
  throw new Error(`Client-side medication creation is disabled for ${data?.name || "this medication"}.`);
}

async function recordTakenWithConfirmation(button) {
  const confirmed = window.confirm("Confirm that you took the visible medication. If you are not sure, choose Cancel so it is not recorded as taken.");
  await recordCurrentMedication(
    confirmed ? "I confirm I took it" : "Medication response needs confirmation",
    { confirmed, responseMethod: "button" }
  );
  buttonState(button, confirmed ? "Taken Confirmed" : "Needs Confirmation");
}

async function recordTranscriptWithConfirmation(transcript, responseMethod) {
  const status = classifyStatus(transcript);
  if (status === "help_requested") {
    await recordCurrentMedication(transcript, { confirmed: false, responseMethod });
    return;
  }

  if (status === "taken") {
    const confirmed = window.confirm(`Heard: "${transcript}". Confirm this medication was taken?`);
    await recordCurrentMedication(transcript, { confirmed, responseMethod });
    return;
  }

  if (status === "refused") {
    const confirmed = window.confirm(`Heard: "${transcript}". Confirm this means the medication was skipped/refused?`);
    await recordCurrentMedication(transcript, { confirmed, responseMethod });
    return;
  }

  await recordCurrentMedication(transcript, { confirmed: false, responseMethod });
}

async function recordCurrentMedication(responseText, options = {}) {
  try {
    await ensureReady();
    const medication = medicationForEvent("breakfast") || medications[0];
    if (!medication) {
      setTemporaryHomePrompt("No medication is loaded for this authenticated household.");
      return;
    }

    await callFunctionOrFallback(
      "recordMedicationResponse",
      {
        householdId,
        medicationId: medication.id,
        responseMethod: options.responseMethod || "typed",
        responseText,
        confirmed: options.confirmed === true
      },
      () => {
        throw new Error("Client-side medication log fallback is disabled.");
      }
    );
  } catch (error) {
    console.warn("Medication response was not recorded.", error);
    setTemporaryHomePrompt("Medication response was not recorded. Authenticated household access is required.");
  }
}

function classifyStatus(text) {
  const normalized = text.toLowerCase().replace(/\u2018|\u2019/g, "'");
  if (["help", "call", "call someone", "caregiver", "chest pain", "cannot breathe", "can't breathe", "fell", "dizzy", "emergency", "need help"].some((term) => normalized.includes(term))) return "help_requested";
  if (["do not want", "don't want", "refuse", "side effect", "not taking", "no"].some((term) => normalized.includes(term))) return "refused";
  if (["took", "taken", "done", "yes", "completed", "had it"].some((term) => normalized.includes(term))) return "taken";
  if (["later", "remind", "snooze", "wait"].some((term) => normalized.includes(term))) return "snoozed";
  return "unknown";
}

async function callFunctionOrFallback(name, payload, fallback) {
  try {
    return (await httpsCallable(functions, name)(payload)).data;
  } catch (error) {
    console.warn(`${name} failed. Client-side Firestore fallback is disabled.`, error);
    return fallback();
  }
}

async function completeEventInDemoFirestore(trigger) {
  throw new Error(`Client-side routine event fallback is disabled for ${trigger}.`);
}

function updateScreen() {
  updateHome();
  updateLog();
  updateDashboard();
  updateVoiceCloneStatus();
}

function updateHome() {
  const medication = medicationForEvent("breakfast") || medications[0];
  if (!medication) return;
  const heading = document.querySelector("h3.font-display-lg");
  if (heading) heading.textContent = `${medication.name}, ${medication.dose}`;
  const instructions = document.querySelector("[data-icon='water_drop']")?.parentElement?.querySelector("p");
  if (instructions) instructions.textContent = medication.instructions || "Follow the current medication instructions.";
}

function updateLog() {
  if (!location.pathname.includes("log-medication")) return;
  const list = document.querySelector("section:nth-of-type(2) .flex.flex-col.gap-gutter");
  if (!list) return;

  list.innerHTML = logs.slice(0, 5).map((log) => {
    const med = medications.find((item) => item.id === log.medicationId);
    return `
      <div class="bg-surface-container-lowest p-stack-md rounded-xl border-2 border-[#E6E2D3] shadow-[0_4px_20px_0_rgba(74,101,73,0.08)] flex items-center justify-between">
        <div class="flex items-center gap-gutter">
          <div class="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
            <span class="material-symbols-outlined">pill</span>
          </div>
          <div>
            <h4 class="font-label-lg text-label-lg text-on-surface">${escapeHtml(med?.name || "Medication")}</h4>
            <p class="font-body-md text-body-md text-on-surface-variant">${escapeHtml(formatWhen(log.createdAt))}</p>
          </div>
        </div>
        <div class="flex flex-col items-center text-primary">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">${log.status === "missed" ? "error" : "check_circle"}</span>
          <span class="font-disclaimer text-disclaimer">${escapeHtml(labelFor(log.status))}</span>
        </div>
      </div>
    `;
  }).join("") || `<p class="font-label-lg text-label-lg text-on-surface-variant">No medication logs yet.</p>`;
}

function updateDashboard() {
  if (!location.pathname.includes("caregiver-dashboard")) return;
  const schedule = document.querySelector(".space-y-gutter");
  if (!schedule) return;
  schedule.innerHTML = medications.map((med) => {
    const latest = logs.find((log) => log.medicationId === med.id);
    const status = latest?.status || "pending";
    const triggerText = (med.eventTriggers || []).map(formatTrigger).join(", ");
    return `
      <div class="bg-white p-stack-md rounded-[2rem] border-2 border-[#E6E2D3] flex items-center justify-between shadow-[0_8px_30px_0_rgba(74,101,73,0.1)]">
        <div class="flex items-center space-x-gutter">
          <div class="bg-primary/10 p-4 rounded-full">
            <span class="material-symbols-outlined text-primary text-4xl">pill</span>
          </div>
          <div>
            <p class="font-label-lg text-on-surface">${escapeHtml(med.name)}</p>
            <p class="font-body-md text-on-surface-variant">${escapeHtml(med.dose)} · ${escapeHtml(triggerText)}</p>
          </div>
        </div>
        <div class="flex flex-col items-center">
          <span class="material-symbols-outlined ${status === "missed" ? "text-error" : "text-primary"} text-4xl" style="font-variation-settings: 'FILL' 1;">${status === "missed" ? "error" : "check_circle"}</span>
          <span class="font-label-lg ${status === "missed" ? "text-error" : "text-primary"} text-sm mt-1">${escapeHtml(labelFor(status))}</span>
        </div>
      </div>
    `;
  }).join("");

  const latestAlert = notifications.find((note) => note.type === "missed_dose_alert");
  if (latestAlert) showDashboardAlert(1, latestAlert.message);
}

function showDashboardAlert(count, message) {
  const alertBox = document.getElementById("alert-container");
  if (!alertBox) return;
  alertBox.classList.remove("hidden");
  const text = alertBox.querySelector("p");
  if (text) text.textContent = message || (count ? "A missed-dose alert was created for Eleanor. Please check in with him." : "Event completed. No missed dose was created.");
}

function updateVoiceCloneStatus() {
  setVoiceCloneStatus("Voice cloning is disabled for this hosted prototype.", true);
}

async function ensureReady() {
  if (currentUser && db) return;
  if (!auth?.currentUser) {
    throw new Error("Authenticated Firebase user is required.");
  }
  await new Promise((resolve) => {
    const check = () => currentUser && db ? resolve() : setTimeout(check, 100);
    check();
  });
}

function medicationForEvent(trigger) {
  return medications.find((med) => med.eventTriggers?.includes(trigger));
}

function eventFromTime(value) {
  const hour = Number(String(value || "08:00").split(":")[0]);
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 20) return "dinner";
  return "bedtime";
}

function reminderCopy(medication, trigger) {
  return `Eleanor, it is ${formatTrigger(trigger)}. Please take ${medication.dose} of ${medication.name} if this matches your doctor's or pharmacist's instructions.`;
}

async function playReminderForEvent(trigger) {
  const medication = medicationForEvent(trigger) || medications[0];
  const message = medication
    ? reminderCopy(medication, trigger)
    : `Eleanor, it is ${formatTrigger(trigger)}. Please check whether you have any medicine due.`;

  showDashboardAlert(0, `Voice reminder playing: ${message}`);
  await speak(message);
  await sleep(600);
}

function playAudioUrl(url) {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    audio.onended = finish;
    audio.onerror = finish;
    window.setTimeout(finish, 7000);
    audio.play().catch(finish);
  });
}

function speak(message) {
  if (!("speechSynthesis" in window)) return Promise.resolve();
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = "en-AU";
  utterance.rate = 0.88;
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    window.setTimeout(finish, 4500);
    window.speechSynthesis.speak(utterance);
  });
}

function valueOf(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function buttonState(button, label) {
  if (!button) return;
  const text = button.querySelector("span:last-child") || button;
  text.textContent = label;
}

function findButtonByText(text) {
  return [...document.querySelectorAll("button")].find((button) => (button.innerText || "").includes(text));
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function setVoiceCloneStatus(message, isError = false) {
  const status = document.getElementById("voice-clone-status");
  if (!status) return;
  status.textContent = message;
  status.className = `font-disclaimer text-disclaimer ${isError ? "text-error" : "text-primary"}`;
}

function sortCreatedDesc(a, b) {
  return (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0);
}

function formatWhen(timestamp) {
  const date = timestamp?.toDate?.();
  return date ? date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Just now";
}

function labelFor(status) {
  return String(status || "pending").split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}

function formatTrigger(trigger) {
  return String(trigger || "").replace(/_/g, " ");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}
