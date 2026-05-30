import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = window.MEDIMATE_FIREBASE_CONFIG;
const householdId = "demo-household-david-rose";
const davidId = "demo-david";
const roseId = "demo-rose";
const fallbackCaregiverId = "demo-browser-caregiver";

if (!firebaseConfig || firebaseConfig.apiKey.includes("REPLACE_WITH")) {
  setStatus("Add your Firebase Web app config in FRONT_END/app/firebase-config.js before deploying Hosting.", true);
  throw new Error("Missing Firebase web config");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let medications = [];
let logs = [];
let notifications = [];
let selectedMedicationId = null;

const statusEl = document.getElementById("connection-status");
const eventTriggerEl = document.getElementById("event-trigger");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.warn("Anonymous Auth unavailable. Falling back to open demo mode.", error);
      currentUser = { uid: fallbackCaregiverId };
      setStatus("Connected in open demo mode. Anonymous Auth is not enabled.");
      await ensureCaregiverProfile(currentUser.uid);
      subscribeToFirestore();
    }
    return;
  }

  currentUser = user;
  setStatus(`Connected as demo caregiver ${user.uid.slice(0, 8)}`);
  await ensureCaregiverProfile(user.uid);
  subscribeToFirestore();
});

document.getElementById("seed-demo").addEventListener("click", seedDemoData);
document.getElementById("save-medication").addEventListener("click", saveMedication);
document.getElementById("record-response").addEventListener("click", recordResponse);
document.getElementById("complete-event").addEventListener("click", completeEvent);
document.getElementById("leaving-home").addEventListener("click", simulateLeavingHome);
document.getElementById("play-reminder").addEventListener("click", playReminder);
document.getElementById("listen-response").addEventListener("click", listenForResponse);
eventTriggerEl.addEventListener("change", render);

async function ensureCaregiverProfile(uid) {
  await setDoc(doc(db, "users", uid), {
    householdId,
    name: "Family caregiver",
    role: "caregiver",
    contact: "demo@example.com",
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  }, { merge: true });
}

async function seedDemoData() {
  requireUser();
  await setDoc(doc(db, "households", householdId), {
    name: "David and Rose",
    primarySeniorId: davidId,
    createdBy: currentUser.uid,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  }, { merge: true });

  await setDoc(doc(db, "users", davidId), {
    householdId,
    name: "David",
    age: 86,
    role: "senior",
    createdAt: serverTimestamp()
  }, { merge: true });

  await setDoc(doc(db, "users", roseId), {
    householdId,
    name: "Rose",
    age: 82,
    role: "spouse",
    createdAt: serverTimestamp()
  }, { merge: true });

  const existing = await getDocs(query(collection(db, "medications"), where("householdId", "==", householdId), limit(1)));
  if (existing.empty) {
    await addMedication({
      name: "Webster Pack morning medicines",
      dose: "1 pack",
      instructions: "Take the morning Webster Pack if it matches current pharmacy instructions.",
      source: "webster_pack",
      eventTriggers: ["breakfast"]
    });
    await addMedication({
      name: "Post-hospital antibiotic",
      dose: "1 tablet",
      instructions: "Temporary medicine outside the Webster Pack.",
      source: "antibiotic",
      eventTriggers: ["lunch", "dinner", "leaving_home"]
    });
  }

  setStatus("Demo data ready in Firestore.");
}

async function saveMedication() {
  requireUser();
  await addMedication({
    name: valueOf("med-name"),
    dose: valueOf("med-dose"),
    instructions: valueOf("med-instructions"),
    source: valueOf("med-source"),
    eventTriggers: [eventTriggerEl.value]
  });
  setStatus("Medication saved to Firestore.");
}

async function addMedication(data) {
  return addDoc(collection(db, "medications"), {
    householdId,
    userId: davidId,
    ...data,
    active: true,
    createdBy: currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

async function recordResponse() {
  requireUser();
  const medicationId = selectedMedicationId || medicationForCurrentEvent()?.id;
  if (!medicationId) {
    setStatus("No medication found for this event. Seed or add a medication first.", true);
    return;
  }

  const responseText = valueOf("response-text") || "I took it";
  const classified = classifyResponse(responseText);
  await addDoc(collection(db, "medicationLogs"), {
    householdId,
    medicationId,
    userId: davidId,
    status: classified.status,
    responseMethod: "typed",
    responseText,
    refusalReason: classified.refusalReason || null,
    refusalNote: classified.status === "refused" ? responseText : null,
    createdAt: serverTimestamp()
  });

  setStatus(`Recorded ${labelFor(classified.status)}.`);
  document.getElementById("response-text").value = "";
}

function playReminder() {
  const medication = selectedMedicationId
    ? medications.find((med) => med.id === selectedMedicationId)
    : medicationForCurrentEvent();

  if (!medication) {
    setStatus("No medication found for this event. Seed or add a medication first.", true);
    return;
  }

  const message = `David, it is ${formatTrigger(eventTriggerEl.value)}. Please take ${medication.dose} of ${medication.name} if this matches your doctor's or pharmacist's instructions.`;
  speak(message);
  setStatus("Playing voice reminder.");
}

function listenForResponse() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const input = document.getElementById("response-text");
  const button = document.getElementById("listen-response");

  if (!SpeechRecognition) {
    input.focus();
    setStatus("Voice input is not supported in this browser. Type the response instead.", true);
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-AU";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  button.textContent = "Listening...";
  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    input.value = transcript;
    setStatus(`Heard: ${transcript}`);
  };
  recognition.onerror = (event) => {
    setStatus(`Voice input failed: ${event.error}. Type the response instead.`, true);
  };
  recognition.onend = () => {
    button.innerHTML = '<span class="material-symbols-outlined align-middle">mic</span> Speak Response';
  };
  recognition.start();
}

async function completeEvent() {
  requireUser();
  const trigger = eventTriggerEl.value;
  const eventRef = await addDoc(collection(db, "routineEvents"), {
    householdId,
    userId: davidId,
    trigger,
    status: "completed",
    occurredAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  const medsForEvent = medications.filter((med) => med.eventTriggers?.includes(trigger));
  const createdAlerts = [];
  for (const med of medsForEvent) {
    const hasFinal = logs.some((log) => log.medicationId === med.id && isFinalStatus(log.status));
    if (hasFinal) continue;

    await addDoc(collection(db, "medicationLogs"), {
      householdId,
      medicationId: med.id,
      routineEventId: eventRef.id,
      userId: davidId,
      status: "missed",
      responseMethod: "system",
      createdAt: serverTimestamp()
    });

    const alert = await addDoc(collection(db, "notifications"), {
      householdId,
      userId: davidId,
      medicationId: med.id,
      routineEventId: eventRef.id,
      type: "missed_dose_alert",
      message: `David did not record ${med.name} for ${formatTrigger(trigger)}. Please check in when you can.`,
      status: "sent",
      createdAt: serverTimestamp()
    });
    createdAlerts.push(alert.id);
  }

  setStatus(createdAlerts.length ? "Event completed. Missed-dose alert created." : "Event completed. No missed dose.");
}

async function simulateLeavingHome() {
  requireUser();
  eventTriggerEl.value = "leaving_home";
  const medsForEvent = medications.filter((med) => med.eventTriggers?.includes("leaving_home"));
  const names = medsForEvent.map((med) => `${med.name} (${med.dose})`);
  const message = names.length
    ? `Before leaving home, please take these medicines with you: ${names.join(", ")}.`
    : "Before leaving home, please check whether you need to take any medicine with you.";

  const eventRef = await addDoc(collection(db, "routineEvents"), {
    householdId,
    userId: davidId,
    trigger: "leaving_home",
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await addDoc(collection(db, "notifications"), {
    householdId,
    userId: davidId,
    routineEventId: eventRef.id,
    type: "leaving_home_reminder",
    message,
    status: "sent",
    createdAt: serverTimestamp()
  });

  setStatus(message);
  render();
}

function subscribeToFirestore() {
  onSnapshot(query(collection(db, "medications"), where("householdId", "==", householdId)), (snapshot) => {
    medications = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    if (!selectedMedicationId && medications[0]) selectedMedicationId = medications[0].id;
    render();
  }, handleSnapshotError("medications"));

  onSnapshot(query(collection(db, "medicationLogs"), where("householdId", "==", householdId), limit(30)), (snapshot) => {
    logs = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort(sortCreatedDesc);
    render();
  }, handleSnapshotError("medication logs"));

  onSnapshot(query(collection(db, "notifications"), where("householdId", "==", householdId), limit(20)), (snapshot) => {
    notifications = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort(sortCreatedDesc);
    render();
  }, handleSnapshotError("notifications"));
}

function render() {
  const trigger = eventTriggerEl.value;
  const medsForEvent = medications.filter((med) => med.eventTriggers?.includes(trigger));
  const seniorList = document.getElementById("senior-med-list");

  seniorList.innerHTML = medsForEvent.length ? medsForEvent.map((med) => `
    <button class="w-full rounded-3xl border-2 ${selectedMedicationId === med.id ? "border-primary" : "border-[#E6E2D3]"} bg-white p-5 text-left shadow-sm" data-med-id="${med.id}">
      <p class="text-2xl font-bold">${escapeHtml(med.name)}</p>
      <p class="mt-1 text-xl font-semibold text-on-surface-variant">${escapeHtml(med.dose)} • ${formatSource(med.source)}</p>
      <p class="mt-2 text-lg font-semibold">${escapeHtml(med.instructions || "")}</p>
      <p class="mt-3 rounded-full bg-primary-container px-4 py-2 text-center font-bold text-primary">Due at ${formatTrigger(trigger)}</p>
    </button>
  `).join("") : `
    <div class="rounded-3xl border-2 border-dashed border-outline-variant p-6 text-center">
      <p class="text-xl font-bold text-on-surface-variant">No medicines linked to ${formatTrigger(trigger)} yet.</p>
    </div>
  `;

  seniorList.querySelectorAll("[data-med-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedMedicationId = button.dataset.medId;
      render();
    });
  });

  renderDashboard();
}

function renderDashboard() {
  const dashboard = document.getElementById("caregiver-dashboard");
  const rows = medications.map((med) => {
    const latest = logs.find((log) => log.medicationId === med.id);
    const status = latest?.status || "pending";
    return `
      <div class="rounded-3xl border-2 border-[#E6E2D3] bg-white p-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-2xl font-bold">${escapeHtml(med.name)}</p>
            <p class="text-lg font-semibold text-on-surface-variant">${escapeHtml(med.dose)} • ${formatSource(med.source)}</p>
            <p class="mt-1 text-base font-bold text-primary">${(med.eventTriggers || []).map(formatTrigger).join(", ")}</p>
          </div>
          <span class="${statusClass(status)} rounded-full px-4 py-2 text-sm font-bold">${labelFor(status)}</span>
        </div>
        ${latest?.refusalReason ? `<p class="mt-3 rounded-2xl bg-secondary-container p-3 font-bold text-secondary">Refusal: ${formatTrigger(latest.refusalReason)}</p>` : ""}
      </div>
    `;
  }).join("");

  const alertRows = notifications.map((note) => `
    <div class="rounded-2xl ${note.type === "missed_dose_alert" ? "bg-error-container text-error" : "bg-primary-container text-primary"} p-4 font-bold">
      ${escapeHtml(note.message)}
    </div>
  `).join("");

  dashboard.innerHTML = `
    <div class="space-y-3">${rows || `<p class="text-lg font-bold text-on-surface-variant">Seed demo data to see medications.</p>`}</div>
    <div class="mt-5 space-y-3">${alertRows}</div>
  `;
}

function classifyResponse(text) {
  const normalized = text.toLowerCase();
  if (["chest pain", "cannot breathe", "can't breathe", "fell", "dizzy", "emergency"].some((term) => normalized.includes(term))) {
    return { status: "help_requested" };
  }
  if (["later", "remind", "snooze", "wait"].some((term) => normalized.includes(term))) {
    return { status: "snoozed" };
  }
  if (["do not want", "don't want", "refuse", "side effect", "not taking", "no"].some((term) => normalized.includes(term))) {
    return { status: "refused", refusalReason: refusalReasonFor(normalized) };
  }
  if (["help", "call", "caregiver", "need someone"].some((term) => normalized.includes(term))) {
    return { status: "help_requested" };
  }
  return { status: "taken" };
}

function refusalReasonFor(text) {
  if (text.includes("away") || text.includes("not home") || text.includes("left")) return "away_from_medicine";
  if (text.includes("side effect") || text.includes("sick")) return "side_effects";
  if (text.includes("unwell") || text.includes("nause") || text.includes("bad")) return "feeling_unwell";
  if (text.includes("confus") || text.includes("not sure")) return "confused";
  return "other";
}

function medicationForCurrentEvent() {
  return medications.find((med) => med.eventTriggers?.includes(eventTriggerEl.value));
}

function valueOf(id) {
  return document.getElementById(id).value.trim();
}

function requireUser() {
  if (!currentUser) throw new Error("Firebase Auth is not ready");
}

function isFinalStatus(status) {
  return ["taken", "snoozed", "missed", "refused", "help_requested"].includes(status);
}

function handleSnapshotError(label) {
  return (error) => {
    console.error(`Could not read ${label}`, error);
    setStatus(`Could not read ${label}: ${error.message}`, true);
  };
}

function sortCreatedDesc(a, b) {
  const aTime = a.createdAt?.toMillis?.() ?? 0;
  const bTime = b.createdAt?.toMillis?.() ?? 0;
  return bTime - aTime;
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.className = `text-sm font-semibold ${isError ? "text-error" : "text-on-surface-variant"}`;
}

function speak(message) {
  if (!("speechSynthesis" in window)) {
    setStatus("Voice playback is not supported in this browser.", true);
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = "en-AU";
  utterance.rate = 0.88;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function labelFor(status) {
  return String(status || "pending").split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}

function formatTrigger(trigger) {
  return String(trigger || "").replace(/_/g, " ");
}

function formatSource(source) {
  return labelFor(source || "other");
}

function statusClass(status) {
  if (status === "taken") return "bg-primary-container text-primary";
  if (status === "missed" || status === "help_requested") return "bg-error-container text-error";
  if (status === "refused" || status === "snoozed") return "bg-secondary-container text-secondary";
  return "bg-[#efeeea] text-on-surface-variant";
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
