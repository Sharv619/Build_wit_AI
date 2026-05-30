import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js";
import {
  addDoc,
  collection,
  deleteDoc,
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
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

const firebaseConfig = window.PILLY_FIREBASE_CONFIG;
const householdId = "demo-household-eleanor";
const eleanorId = "demo-eleanor";
const fallbackCaregiverId = "demo-browser-caregiver";

if (!firebaseConfig || firebaseConfig.apiKey.includes("REPLACE_WITH")) {
  setStatus("Add your Firebase Web app config in FRONT_END/app/firebase-config.js before deploying Hosting.", true);
  throw new Error("Missing Firebase web config");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);
const recordMedicationResponseFn = httpsCallable(functions, "recordMedicationResponse");
const completeRoutineEventFn = httpsCallable(functions, "completeRoutineEvent");
const simulateLeavingHomeFn = httpsCallable(functions, "simulateLeavingHome");

let currentUser = null;
let medications = [];
let logs = [];
let notifications = [];
let voiceReminders = [];
let selectedMedicationId = null;
let familyRecorder = null;
let familyRecordingChunks = [];
let familyRecordingBlob = null;
let familyRecordingUrl = "";

const statusEl = document.getElementById("connection-status");
const eventTriggerEl = document.getElementById("event-trigger");
const voiceStatusEl = document.getElementById("voice-reminder-status");

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
document.getElementById("save-voice-reminder").addEventListener("click", saveVoiceReminder);
document.getElementById("delete-voice-reminder").addEventListener("click", deleteVoiceReminder);
document.getElementById("start-family-recording").addEventListener("click", startFamilyRecording);
document.getElementById("stop-family-recording").addEventListener("click", stopFamilyRecording);
eventTriggerEl.addEventListener("change", render);

async function ensureCaregiverProfile(uid) {
  // Demo-only bootstrap so anonymous browser sessions can read/write the Eleanor household.
  // Production should provision household membership server-side.
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
  // Demo-only Firestore seeding. Core medication workflows below go through Cloud Functions.
  await setDoc(doc(db, "households", householdId), {
    name: "Eleanor",
    primarySeniorId: eleanorId,
    createdBy: currentUser.uid,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  }, { merge: true });

  await setDoc(doc(db, "users", eleanorId), {
    householdId,
    name: "Eleanor",
    age: 86,
    role: "senior",
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
  const medication = {
    name: valueOf("med-name"),
    dose: valueOf("med-dose"),
    instructions: valueOf("med-instructions"),
    source: valueOf("med-source"),
    eventTriggers: [eventTriggerEl.value]
  };
  const docRef = await addMedication(medication);

  // Demo UX guard: render the new medication immediately even if the Firestore
  // listener is delayed or the hosted demo is running in open fallback mode.
  const savedMedication = {
    id: docRef.id,
    householdId,
    userId: eleanorId,
    ...medication,
    active: true,
    createdBy: currentUser.uid
  };
  medications = [
    savedMedication,
    ...medications.filter((item) => item.id !== docRef.id)
  ];
  selectedMedicationId = docRef.id;
  render();
  setStatus("Medication saved to Firestore.");
}

async function addMedication(data) {
  // Demo-only medication creation for the hackathon UI. Production should move this behind
  // a caregiver-authorized Cloud Function before real patient data is used.
  return addDoc(collection(db, "medications"), {
    householdId,
    userId: eleanorId,
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
  const result = await callFunctionOrFallback(
    () => recordMedicationResponseFn({
      householdId,
      medicationId,
      userId: eleanorId,
      responseMethod: "typed",
      responseText,
      refusalNote: responseText
    }),
    () => recordResponseInDemoFirestore(medicationId, responseText)
  );

  const data = result.data || {};
  setStatus(data.message || `Recorded ${labelFor(data.status)}.`);
  document.getElementById("response-text").value = "";
}

async function playReminder() {
  const selectedMedication = selectedMedicationId
    ? medications.find((med) => med.id === selectedMedicationId)
    : null;
  const medication = selectedMedication?.eventTriggers?.includes(eventTriggerEl.value)
    ? selectedMedication
    : medicationForCurrentEvent();

  if (!medication) {
    setStatus("No medication found for this event. Seed or add a medication first.", true);
    return;
  }

  const familyReminder = voiceReminderFor(medication.id, eventTriggerEl.value);
  if (familyReminder) {
    try {
      const url = await getDownloadURL(ref(storage, familyReminder.storagePath));
      const audio = new Audio(url);
      await audio.play();
      setStatus(`Playing ${familyReminder.speakerName}'s family voice reminder.`);
      return;
    } catch (error) {
      console.warn("Family voice reminder playback failed. Falling back to speech synthesis.", error);
      setStatus("Family voice reminder could not play. Using default reminder voice.", true);
    }
  }

  const message = `Eleanor, it is ${formatTrigger(eventTriggerEl.value)}. Please take ${medication.dose} of ${medication.name} if this matches your doctor's or pharmacist's instructions.`;
  speak(message);
  setStatus("Playing voice reminder.");
}

async function saveVoiceReminder() {
  requireUser();
  const medicationId = selectedMedicationId || medicationForCurrentEvent()?.id;
  const fileInput = document.getElementById("voice-file");
  const file = fileInput.files?.[0];
  const audioBlob = familyRecordingBlob || file;
  const speakerName = valueOf("voice-speaker");
  const relationship = valueOf("voice-relationship");
  const consentConfirmed = document.getElementById("voice-consent").checked;

  if (!medicationId) {
    setStatus("Select or seed a medication before saving a family voice reminder.", true);
    return;
  }
  if (!speakerName) {
    setStatus("Add the speaker name before saving a family voice reminder.", true);
    return;
  }
  if (!audioBlob) {
    setStatus("Record or choose an audio file before saving a family voice reminder.", true);
    return;
  }
  if (!consentConfirmed) {
    setStatus("Confirm voice permission before uploading the family reminder.", true);
    return;
  }

  const trigger = eventTriggerEl.value;
  const existing = voiceReminderFor(medicationId, trigger);
  if (existing?.id) {
    // Demo replacement behavior: remove old metadata so the latest recording is authoritative.
    // Production should also delete the old Storage object and keep an audit trail.
    await deleteDoc(doc(db, "voiceReminders", existing.id));
  }

  const voiceReminderRef = doc(collection(db, "voiceReminders"));
  const extension = file?.name.split(".").pop()?.toLowerCase() || "webm";
  const storagePath = `households/${householdId}/voiceReminders/${voiceReminderRef.id}.${extension}`;

  await uploadBytes(ref(storage, storagePath), audioBlob, {
    contentType: audioBlob.type || "audio/webm",
    customMetadata: {
      householdId,
      medicationId,
      routineEventTrigger: trigger,
      messageType: "recorded"
    }
  });

  // Demo/MVP metadata for a recorded familiar voice reminder. This stores consent
  // confirmation and linkage only; it does not synthesize or clone any voice.
  await setDoc(voiceReminderRef, {
    userId: eleanorId,
    householdId,
    medicationId,
    routineEventId: trigger,
    routineEventTrigger: trigger,
    speakerName,
    relationship,
    storagePath,
    consentConfirmed: true,
    messageType: "recorded",
    createdBy: currentUser.uid,
    createdAt: serverTimestamp()
  });

  fileInput.value = "";
  clearFamilyRecordingPreview();
  setStatus(`Family voice reminder saved for ${formatTrigger(trigger)}.`);
}

async function startFamilyRecording() {
  requireUser();
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    setStatus("Recording is not supported in this browser. Upload an audio file instead.", true);
    return;
  }

  try {
    clearFamilyRecordingPreview();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    familyRecordingChunks = [];
    const mimeType = supportedAudioMimeType();
    familyRecorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    familyRecorder.ondataavailable = (event) => {
      if (event.data?.size) familyRecordingChunks.push(event.data);
    };
    familyRecorder.onstop = () => {
      familyRecordingBlob = new Blob(familyRecordingChunks, { type: familyRecorder.mimeType || "audio/webm" });
      familyRecorder.stream.getTracks().forEach((track) => track.stop());
      familyRecordingUrl = URL.createObjectURL(familyRecordingBlob);
      const preview = document.getElementById("family-recording-preview");
      preview.src = familyRecordingUrl;
      preview.classList.remove("hidden");
      setFamilyRecordingButtons(false);
      setStatus("Family voice recording ready. Confirm consent and save it.");
    };

    familyRecorder.start();
    setFamilyRecordingButtons(true);
    setStatus("Recording family voice reminder...");
  } catch (error) {
    console.warn("Family voice recording failed.", error);
    setFamilyRecordingButtons(false);
    setStatus("Could not access the microphone. Upload an audio file instead.", true);
  }
}

function stopFamilyRecording() {
  if (familyRecorder?.state === "recording") {
    familyRecorder.stop();
  }
}

function supportedAudioMimeType() {
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "";
}

function setFamilyRecordingButtons(isRecording) {
  document.getElementById("start-family-recording").disabled = isRecording;
  document.getElementById("stop-family-recording").disabled = !isRecording;
}

function clearFamilyRecordingPreview() {
  if (familyRecordingUrl) URL.revokeObjectURL(familyRecordingUrl);
  familyRecordingBlob = null;
  familyRecordingUrl = "";
  familyRecordingChunks = [];
  const preview = document.getElementById("family-recording-preview");
  preview.removeAttribute("src");
  preview.classList.add("hidden");
}

async function deleteVoiceReminder() {
  requireUser();
  const medicationId = selectedMedicationId || medicationForCurrentEvent()?.id;
  const existing = medicationId ? voiceReminderFor(medicationId, eventTriggerEl.value) : null;

  if (!existing) {
    setStatus("No family voice reminder is saved for the selected medication/event.", true);
    return;
  }

  try {
    await deleteObject(ref(storage, existing.storagePath));
  } catch (error) {
    console.warn("Could not delete voice reminder audio. Removing metadata for demo cleanup.", error);
  }

  await deleteDoc(doc(db, "voiceReminders", existing.id));
  setStatus("Family voice reminder deleted for this medication/event.");
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
  const result = await callFunctionOrFallback(
    () => completeRoutineEventFn({
      householdId,
      userId: eleanorId,
      trigger,
      status: "completed"
    }),
    () => completeEventInDemoFirestore(trigger)
  );

  const data = result.data || {};
  const missedCount = Number(data.missedCount || 0);

  setStatus(missedCount ? "Event completed. Missed-dose alert created." : "Event completed. No missed dose.");
}

async function simulateLeavingHome() {
  requireUser();
  eventTriggerEl.value = "leaving_home";
  const result = await callFunctionOrFallback(
    () => simulateLeavingHomeFn({
      householdId,
      userId: eleanorId
    }),
    simulateLeavingHomeInDemoFirestore
  );

  setStatus(result.data?.message || "Leaving-home reminder created.");
  render();
}

async function callFunctionOrFallback(functionCall, fallbackCall) {
  try {
    return await functionCall();
  } catch (error) {
    console.warn("Cloud Function unavailable. Using Spark-plan demo fallback.", error);
    return { data: await fallbackCall() };
  }
}

async function recordResponseInDemoFirestore(medicationId, responseText) {
  // Spark-plan demo fallback only. Production should use Cloud Functions for
  // authoritative classification, validation, and audit controls.
  const classified = classifyDemoResponse(responseText);
  await addDoc(collection(db, "medicationLogs"), {
    householdId,
    medicationId,
    userId: eleanorId,
    status: classified.status,
    responseMethod: "typed",
    responseText,
    refusalReason: classified.refusalReason || null,
    refusalNote: classified.status === "refused" ? responseText : null,
    createdAt: serverTimestamp()
  });

  return {
    status: classified.status,
    intent: classified.intent,
    refusalReason: classified.refusalReason,
    message: classified.message
  };
}

async function completeEventInDemoFirestore(trigger) {
  // Spark-plan demo fallback only. Keeps the hosted demo working without
  // billable Cloud Functions.
  const eventRef = await addDoc(collection(db, "routineEvents"), {
    householdId,
    userId: eleanorId,
    trigger,
    status: "completed",
    occurredAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  const medsForEvent = medications.filter((med) => med.eventTriggers?.includes(trigger));
  const createdAlerts = [];
  for (const med of medsForEvent) {
    const hasFinal = logs.some((log) =>
      log.medicationId === med.id &&
      (log.routineEventId === eventRef.id || !log.routineEventId) &&
      isFinalStatus(log.status)
    );
    if (hasFinal) continue;

    await addDoc(collection(db, "medicationLogs"), {
      householdId,
      medicationId: med.id,
      routineEventId: eventRef.id,
      userId: eleanorId,
      status: "missed",
      responseMethod: "system",
      createdAt: serverTimestamp()
    });

    const alert = await addDoc(collection(db, "notifications"), {
      householdId,
      userId: eleanorId,
      medicationId: med.id,
      routineEventId: eventRef.id,
      type: "missed_dose_alert",
      message: `Eleanor did not record ${med.name} for ${formatTrigger(trigger)}. Please check in when you can.`,
      status: "sent",
      createdAt: serverTimestamp()
    });
    createdAlerts.push(alert.id);
  }

  return {
    routineEventId: eventRef.id,
    trigger,
    status: "completed",
    missedCount: createdAlerts.length,
    notifications: createdAlerts
  };
}

async function simulateLeavingHomeInDemoFirestore() {
  // Spark-plan demo fallback only. This does not provide medical advice; it only
  // reminds the senior to check existing event-linked medicines.
  const medsForEvent = medications.filter((med) => med.eventTriggers?.includes("leaving_home"));
  const names = medsForEvent.map((med) => `${med.name} (${med.dose})`);
  const message = names.length
    ? `Before leaving home, please take these medicines with you: ${names.join(", ")}.`
    : "Before leaving home, please check whether you need to take any medicine with you.";

  const eventRef = await addDoc(collection(db, "routineEvents"), {
    householdId,
    userId: eleanorId,
    trigger: "leaving_home",
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  const notification = await addDoc(collection(db, "notifications"), {
    householdId,
    userId: eleanorId,
    routineEventId: eventRef.id,
    type: "leaving_home_reminder",
    message,
    status: "sent",
    createdAt: serverTimestamp()
  });

  return {
    routineEventId: eventRef.id,
    notificationId: notification.id,
    medications: medsForEvent,
    message
  };
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

  onSnapshot(query(collection(db, "voiceReminders"), where("householdId", "==", householdId), limit(30)), (snapshot) => {
    voiceReminders = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort(sortCreatedDesc);
    render();
  }, handleSnapshotError("family voice reminders"));
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
  renderVoiceReminderStatus();
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

function renderVoiceReminderStatus() {
  const medicationId = selectedMedicationId || medicationForCurrentEvent()?.id;
  const reminder = medicationId ? voiceReminderFor(medicationId, eventTriggerEl.value) : null;

  if (!voiceStatusEl) return;
  voiceStatusEl.textContent = reminder
    ? `Family voice reminder saved: ${reminder.speakerName} (${formatTrigger(reminder.relationship)}) for ${formatTrigger(eventTriggerEl.value)}.`
    : "No family voice reminder saved for the selected medication/event.";
}

function voiceReminderFor(medicationId, trigger) {
  return voiceReminders.find((reminder) =>
    reminder.medicationId === medicationId &&
    (reminder.routineEventTrigger === trigger || reminder.routineEventId === trigger) &&
    reminder.consentConfirmed === true &&
    reminder.messageType === "recorded"
  );
}

function classifyDemoResponse(text) {
  const normalized = text.toLowerCase();
  if (["chest pain", "cannot breathe", "can't breathe", "fell", "dizzy", "emergency"].some((term) => normalized.includes(term))) {
    return {
      status: "help_requested",
      intent: "urgent",
      message: "This may be urgent. Call emergency services now if Eleanor is in immediate danger. Pilly does not provide medical advice."
    };
  }
  if (["later", "remind", "snooze", "wait"].some((term) => normalized.includes(term))) {
    return { status: "snoozed", intent: "snoozed", message: "Response recorded." };
  }
  if (["do not want", "don't want", "refuse", "side effect", "not taking", "no"].some((term) => normalized.includes(term))) {
    return {
      status: "refused",
      intent: "refused",
      refusalReason: refusalReasonForDemo(normalized),
      message: "I have recorded that Eleanor does not want to take this medicine. Please contact a caregiver, doctor, or pharmacist for guidance."
    };
  }
  if (["help", "call", "caregiver", "need someone"].some((term) => normalized.includes(term))) {
    return {
      status: "help_requested",
      intent: "help_requested",
      message: "I have recorded that Eleanor needs help and the caregiver dashboard should show this."
    };
  }
  return { status: "taken", intent: "taken", message: "Response recorded." };
}

function refusalReasonForDemo(text) {
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
