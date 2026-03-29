import { ConversationTone } from "@/types";

const CASUAL_MARKERS = [
  "gotta", "gonna", "wanna", "kinda", "sorta", "lol", "haha",
  "yeah", "yep", "nah", "nope", "tbh", "imo", "idk", "omg",
  "btw", "rn", "tho", "u ", "ur ", "thx", "ty", "np",
  "cool", "dope", "chill", "sick", "bro", "dude", "yo ",
  "ain't", "y'all", "tryna", "finna",
];

const FORMAL_MARKERS = [
  "would like", "could you", "please", "regarding", "concerning",
  "appreciate", "furthermore", "however", "therefore", "additionally",
  "professional", "colleagues", "schedule", "meeting", "presentation",
  "proposal", "documentation", "requirements", "deliverables",
];

export function analyzeTone(messages: string[]): ConversationTone {
  const combined = messages.join(" ").toLowerCase();
  const words = combined.split(/\s+/);
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / Math.max(words.length, 1);
  const avgMessageLength = messages.reduce((sum, m) => sum + m.length, 0) / Math.max(messages.length, 1);

  const casualCount = CASUAL_MARKERS.filter((m) => combined.includes(m)).length;
  const formalCount = FORMAL_MARKERS.filter((m) => combined.includes(m)).length;

  let formality: ConversationTone["formality"] = "neutral";
  if (casualCount > formalCount + 1) formality = "casual";
  else if (formalCount > casualCount + 1) formality = "formal";
  else if (casualCount > 0 && avgWordLength < 4.5) formality = "casual";
  else if (formalCount > 0 && avgWordLength > 5) formality = "formal";

  let energy: ConversationTone["energy"] = "medium";
  const hasExclamation = messages.some((m) => m.includes("!"));
  const hasAllCaps = messages.some((m) => /[A-Z]{3,}/.test(m));
  if (hasExclamation || hasAllCaps) energy = "high";
  else if (avgMessageLength < 20) energy = "low";

  let brevity: ConversationTone["brevity"] = "normal";
  if (avgMessageLength < 30) brevity = "terse";
  else if (avgMessageLength > 100) brevity = "verbose";

  return { formality, energy, brevity };
}

export function getTonePrefix(tone: ConversationTone): string {
  if (tone.formality === "casual") {
    const prefixes = ["oh nice", "cool", "gotcha", "ah ok", "right on", "sweet"];
    return prefixes[Math.floor(Math.random() * prefixes.length)];
  }
  if (tone.formality === "formal") {
    const prefixes = ["That sounds important", "I see", "Understood", "Great"];
    return prefixes[Math.floor(Math.random() * prefixes.length)];
  }
  const prefixes = ["Got it", "Nice", "Ok", "Makes sense", "Interesting"];
  return prefixes[Math.floor(Math.random() * prefixes.length)];
}
