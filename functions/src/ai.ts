import { Intent, RefusalReason } from "./types";

const urgentTerms = ["chest pain", "cannot breathe", "can't breathe", "fell", "dizzy", "emergency", "severe pain", "passed out"];
const takenTerms = ["took", "taken", "done", "yes", "completed", "had it"];
const snoozeTerms = ["later", "remind", "snooze", "wait"];
const refusedTerms = ["do not want", "don't want", "refuse", "side effect", "not taking", "no", "do not understand", "don't understand"];
const helpTerms = ["help", "call", "caregiver", "need someone"];

export interface ClassifiedResponse {
  intent: Intent;
  refusalReason?: RefusalReason;
  safeMessage: string;
  source: "gemini" | "fallback";
}

export function classifyFallback(text: string): ClassifiedResponse {
  const normalized = text.toLowerCase();
  const intent = termMatch(normalized, urgentTerms)
    ? "urgent"
    : termMatch(normalized, takenTerms)
      ? "taken"
      : termMatch(normalized, snoozeTerms)
        ? "snoozed"
        : termMatch(normalized, refusedTerms)
          ? "refused"
          : termMatch(normalized, helpTerms)
            ? "help_requested"
            : "unknown";

  return {
    intent,
    refusalReason: intent === "refused" ? refusalReasonFallback(normalized) : undefined,
    safeMessage: safeMessageForIntent(intent),
    source: "fallback",
  };
}

export async function classifyWithGemini(text: string): Promise<ClassifiedResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return classifyFallback(text);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: [
                    "Classify this senior medication response.",
                    "Return only compact JSON with intent and optional refusalReason.",
                    "Allowed intent values: taken, snoozed, refused, help_requested, unknown, urgent.",
                    "Allowed refusalReason values: away_from_medicine, side_effects, feeling_unwell, confused, does_not_understand, other, unknown.",
                    "Do not give medical advice.",
                    `Response: ${text}`,
                  ].join("\n"),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!response.ok) {
      return classifyFallback(text);
    }

    const body = await response.json() as GeminiResponse;
    const raw = body.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      return classifyFallback(text);
    }

    const parsed = JSON.parse(raw) as { intent?: Intent; refusalReason?: RefusalReason };
    const fallback = classifyFallback(text);
    const intent = isIntent(parsed.intent) ? parsed.intent : fallback.intent;
    return {
      intent,
      refusalReason: intent === "refused" ? parsed.refusalReason ?? fallback.refusalReason ?? "other" : undefined,
      safeMessage: safeMessageForIntent(intent),
      source: "gemini",
    };
  } catch {
    return classifyFallback(text);
  }
}

export function reminderCopy(name: string, dose: string, trigger: string): string {
  return `It is ${formatTrigger(trigger)}. Please take ${dose} of ${name} if this matches your doctor's or pharmacist's instructions.`;
}

export function missedDoseCopy(name: string, trigger: string): string {
  return `Eleanor did not record ${name} for ${formatTrigger(trigger)}. Please check in when you can.`;
}

function termMatch(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function formatTrigger(trigger: string): string {
  return trigger.replace(/_/g, " ");
}

function refusalReasonFallback(text: string): RefusalReason {
  if (text.includes("away") || text.includes("not home") || text.includes("left")) return "away_from_medicine";
  if (text.includes("side effect")) return "side_effects";
  if (text.includes("sick") || text.includes("unwell") || text.includes("nause") || text.includes("bad")) return "feeling_unwell";
  if (text.includes("do not understand") || text.includes("don't understand")) return "does_not_understand";
  if (text.includes("confus") || text.includes("not sure")) return "confused";
  return "other";
}

function safeMessageForIntent(intent: Intent): string {
  if (intent === "urgent") {
    return "This may be urgent. Call emergency services now if Eleanor is in immediate danger. Pilly does not provide medical advice.";
  }
  if (intent === "refused") {
    return "I have recorded that Eleanor does not want to take this medicine. Please contact a caregiver, doctor, or pharmacist for guidance.";
  }
  if (intent === "help_requested") {
    return "I have recorded that Eleanor needs help and the caregiver dashboard should show this.";
  }
  if (intent === "unknown") {
    return "I am not sure how to classify that response. Please check with a caregiver.";
  }
  return "Response recorded.";
}

function isIntent(value: unknown): value is Intent {
  return typeof value === "string" &&
    ["taken", "snoozed", "refused", "help_requested", "unknown", "urgent"].includes(value);
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}
