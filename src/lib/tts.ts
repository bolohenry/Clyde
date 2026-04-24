/**
 * TTS singleton — OpenAI TTS (primary), Kokoro WASM (fallback),
 * browser speechSynthesis (last resort).
 *
 * Call speakText(text, id) from anywhere.
 * Subscribe to subscribeCurrentSpeaking() to know which message is active.
 */

// ── Markdown stripper ─────────────────────────────────────────────────────────
// Removes formatting chars that sound bad when read aloud ("asterisk asterisk…")

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")   // **bold**
    .replace(/\*(.+?)\*/g, "$1")        // *italic*
    .replace(/`{1,3}[^`]*`{1,3}/g, "") // `code` / ```blocks```
    .replace(/#+\s/g, "")               // ## headings
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [links](url)
    .replace(/^\s*[-*+]\s/gm, "")       // - list items
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── OpenAI TTS ────────────────────────────────────────────────────────────────

let _openaiAvailable: boolean | null = null; // null=unknown, true=works, false=not configured

async function _speakWithOpenAI(text: string, messageId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: stripMarkdown(text) }),
    });

    if (res.status === 503) {
      _openaiAvailable = false;
      return false;
    }
    if (!res.ok) return false;

    _openaiAvailable = true;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    _currentAudio = audio;

    // May have been cancelled while we waited for the API
    if (!_speaker || _speaker.id !== messageId) {
      URL.revokeObjectURL(url);
      return false;
    }

    audio.onplay  = () => _setSpeaker({ id: messageId, phase: "playing" });
    audio.onended = () => { _setSpeaker(null); URL.revokeObjectURL(url); _currentAudio = null; };
    audio.onerror = () => { _setSpeaker(null); URL.revokeObjectURL(url); _currentAudio = null; };

    await audio.play();
    return true;
  } catch {
    return false;
  }
}

// ── Kokoro loader (fallback) ──────────────────────────────────────────────────
// Local type avoids static import of kokoro-js which pulls onnxruntime-node

interface KokoroInstance {
  generate(text: string, opts?: { voice?: string; speed?: number }): Promise<{ toBlob(): Blob }>;
}

export type KokoroStatus = "idle" | "loading" | "ready" | "failed";

let _kokoroStatus: KokoroStatus = "idle";
let _kokoroInstance: KokoroInstance | null = null;
let _kokoroPromise: Promise<KokoroInstance | null> | null = null;
let _kokoroProgress = 0;

const _kokoroListeners = new Set<() => void>();
export function subscribeKokoro(fn: () => void): () => void {
  _kokoroListeners.add(fn);
  return () => { _kokoroListeners.delete(fn); };
}
function _notifyKokoro() { _kokoroListeners.forEach((fn) => fn()); }

export const getKokoroStatus = () => _kokoroStatus;
export const getKokoroProgress = () => _kokoroProgress;

export async function loadKokoro(): Promise<KokoroInstance | null> {
  if (_kokoroStatus === "ready") return _kokoroInstance;
  if (_kokoroStatus === "failed") return null;
  if (_kokoroStatus === "loading" && _kokoroPromise) return _kokoroPromise;

  _kokoroStatus = "loading";
  _kokoroProgress = 0;
  _notifyKokoro();

  _kokoroPromise = (async () => {
    try {
      const { KokoroTTS } = await import("kokoro-js");
      const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-ONNX", {
        dtype: "q8",
        progress_callback: (info: Record<string, unknown>) => {
          const pct = typeof info.progress === "number" ? Math.round(info.progress) : 0;
          if (pct !== _kokoroProgress) { _kokoroProgress = pct; _notifyKokoro(); }
        },
      });
      _kokoroInstance = tts as unknown as KokoroInstance;
      _kokoroStatus = "ready";
      _notifyKokoro();
      return _kokoroInstance;
    } catch (err) {
      console.warn("[Clyde TTS] Kokoro unavailable.", err);
      _kokoroStatus = "failed";
      _notifyKokoro();
      return null;
    }
  })();

  return _kokoroPromise;
}

async function _speakWithKokoro(text: string, messageId: string): Promise<boolean> {
  if (!_kokoroInstance) return false;
  try {
    const result = await _kokoroInstance.generate(stripMarkdown(text), { voice: "af_nova" });
    const blob = result.toBlob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    _currentAudio = audio;
    audio.onplay  = () => _setSpeaker({ id: messageId, phase: "playing" });
    audio.onended = () => { _setSpeaker(null); URL.revokeObjectURL(url); _currentAudio = null; };
    audio.onerror = () => { _setSpeaker(null); URL.revokeObjectURL(url); _currentAudio = null; };
    await audio.play();
    return true;
  } catch {
    _setSpeaker(null);
    return false;
  }
}

// ── Smart browser voice picker ────────────────────────────────────────────────

export function getBestBrowserVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const priorities: Array<(v: SpeechSynthesisVoice) => boolean> = [
    (v) => /(Ava|Zoe).*(Premium)/i.test(v.name),
    (v) => /(Samantha|Karen|Moira).*(Enhanced)/i.test(v.name),
    (v) => /Siri/i.test(v.name),
    (v) => /(Aria|Jenny|Davis|Guy).*(Online|Neural)/i.test(v.name),
    (v) => v.lang.startsWith("en") && /(Premium|Enhanced|Neural|Online)/i.test(v.name),
    (v) => v.lang === "en-US",
    (v) => v.lang.startsWith("en"),
  ];
  for (const pred of priorities) {
    const match = voices.find(pred);
    if (match) return match;
  }
  return voices[0] ?? null;
}

// ── Current-speaker tracking ──────────────────────────────────────────────────

export type SpeakerState = { id: string; phase: "generating" | "playing" } | null;

let _speaker: SpeakerState = null;
const _speakerListeners = new Set<() => void>();

export function getCurrentSpeaker(): SpeakerState { return _speaker; }
export function subscribeCurrentSpeaking(fn: () => void): () => void {
  _speakerListeners.add(fn);
  return () => { _speakerListeners.delete(fn); };
}
function _setSpeaker(s: SpeakerState) {
  if (_speaker?.id === s?.id && _speaker?.phase === s?.phase) return;
  _speaker = s;
  _speakerListeners.forEach((fn) => fn());
}

// ── Global audio reference ────────────────────────────────────────────────────

let _currentAudio: HTMLAudioElement | null = null;

export function stopAllAudio() {
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
  _setSpeaker(null);
}

// ── Main speak API ────────────────────────────────────────────────────────────

export async function speakText(text: string, messageId: string): Promise<void> {
  if (!text.trim()) return;

  // Toggle off if already playing this message
  if (_speaker?.id === messageId) { stopAllAudio(); return; }

  stopAllAudio();
  _setSpeaker({ id: messageId, phase: "generating" });

  // 1. OpenAI TTS — best quality, server-side
  if (_openaiAvailable !== false) {
    const ok = await _speakWithOpenAI(text, messageId);
    if (ok) return;
    // If _openaiAvailable is now false, key not configured — fall through
  }

  // 2. Kokoro — local WASM, good quality
  if (_kokoroStatus === "ready" && _kokoroInstance) {
    const ok = await _speakWithKokoro(text, messageId);
    if (ok) return;
  }

  // Kokoro loading — wait for it
  if (_kokoroStatus === "loading" && _kokoroPromise) {
    const kokoro = await _kokoroPromise;
    if (!_speaker || _speaker.id !== messageId) return;
    if (kokoro) {
      const ok = await _speakWithKokoro(text, messageId);
      if (ok) return;
    }
  }

  // 3. Browser speech synthesis — last resort
  _setSpeaker(null);
  _speakWithBrowser(text, messageId);
  if (_kokoroStatus === "idle") loadKokoro();
}

function _speakWithBrowser(text: string, messageId: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(stripMarkdown(text));
  const voice = getBestBrowserVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.95;
  utterance.onstart = () => _setSpeaker({ id: messageId, phase: "playing" });
  utterance.onend   = () => _setSpeaker(null);
  utterance.onerror = () => _setSpeaker(null);
  window.speechSynthesis.speak(utterance);
}
