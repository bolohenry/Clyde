/**
 * TTS singleton — manages Kokoro model loading and global audio coordination.
 * Only ever runs in the browser (never imported server-side).
 */

// ── Kokoro loader ─────────────────────────────────────────────────────────────
// We use a local interface instead of `import type { KokoroTTS }` to avoid
// webpack trying to resolve onnxruntime-node at build time.

interface KokoroInstance {
  generate(text: string, opts?: { voice?: string; speed?: number }): Promise<{ toBlob(): Blob }>;
}

export type KokoroStatus = "idle" | "loading" | "ready" | "failed";

let _status: KokoroStatus = "idle";
let _instance: KokoroInstance | null = null;
let _loadPromise: Promise<KokoroInstance | null> | null = null;
let _progress = 0;

const _statusListeners = new Set<() => void>();

export function subscribeKokoro(fn: () => void): () => void {
  _statusListeners.add(fn);
  return () => { _statusListeners.delete(fn); };
}

function _notify() {
  _statusListeners.forEach((fn) => fn());
}

export const getKokoroStatus = () => _status;
export const getKokoroProgress = () => _progress;
export const getKokoroInstance = (): KokoroInstance | null => _instance;

export async function loadKokoro(): Promise<KokoroInstance | null> {
  if (_status === "ready") return _instance;
  if (_status === "failed") return null;
  if (_status === "loading" && _loadPromise) return _loadPromise;

  _status = "loading";
  _progress = 0;
  _notify();

  _loadPromise = (async () => {
    try {
      // Dynamic import keeps kokoro-js out of the initial bundle
      const { KokoroTTS } = await import("kokoro-js");
      const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-ONNX", {
        dtype: "q8", // ~20 MB quantized — good balance of size and quality
        progress_callback: (info: Record<string, unknown>) => {
          const pct = typeof info.progress === "number" ? Math.round(info.progress) : 0;
          if (pct !== _progress) {
            _progress = pct;
            _notify();
          }
        },
      });
      _instance = tts;
      _status = "ready";
      _notify();
      return tts;
    } catch (err) {
      console.warn("[Clyde TTS] Kokoro failed to load — falling back to browser voice.", err);
      _status = "failed";
      _notify();
      return null;
    }
  })();

  return _loadPromise;
}

// ── Smart browser voice picker ────────────────────────────────────────────────
// Dramatically better quality on Apple devices where neural/premium voices exist.

export function getBestBrowserVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const priorities: Array<(v: SpeechSynthesisVoice) => boolean> = [
    // macOS / iOS premium neural voices
    (v) => /(Ava|Zoe).*(Premium)/i.test(v.name),
    (v) => /(Samantha|Karen|Moira).*(Enhanced)/i.test(v.name),
    (v) => /Siri/i.test(v.name),
    // Windows / Edge neural voices
    (v) => /(Aria|Jenny|Davis|Guy).*(Online|Neural)/i.test(v.name),
    // Any enhanced / premium / neural English voice
    (v) => v.lang.startsWith("en") && /(Premium|Enhanced|Neural|Online)/i.test(v.name),
    // en-US fallback
    (v) => v.lang === "en-US",
    // Any English
    (v) => v.lang.startsWith("en"),
  ];

  for (const pred of priorities) {
    const match = voices.find(pred);
    if (match) return match;
  }
  return voices[0] ?? null;
}

// ── Global audio coordination — only one thing playing at a time ──────────────

let _currentAudio: HTMLAudioElement | null = null;
const _stopHandlers = new Map<string, () => void>();

export function registerSpeaker(id: string, onForcedStop: () => void): () => void {
  _stopHandlers.set(id, onForcedStop);
  return () => { _stopHandlers.delete(id); };
}

export function stopAllAudio(exceptId?: string) {
  // Stop Web Speech API
  if (typeof window !== "undefined") {
    window.speechSynthesis?.cancel();
  }
  // Stop any playing HTMLAudioElement
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio = null;
  }
  // Tell every other registered speaker to reset their state
  _stopHandlers.forEach((stop, id) => {
    if (id !== exceptId) stop();
  });
}

export function setCurrentAudio(el: HTMLAudioElement | null) {
  _currentAudio = el;
}
