"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  loadKokoro,
  getKokoroStatus,
  getKokoroProgress,
  getKokoroInstance,
  subscribeKokoro,
  getBestBrowserVoice,
  registerSpeaker,
  stopAllAudio,
  setCurrentAudio,
  type KokoroStatus,
} from "@/lib/tts";

export function useTTS(messageId: string) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [kokoroStatus, setKokoroStatus] = useState<KokoroStatus>(getKokoroStatus);
  const [kokoroProgress, setKokoroProgress] = useState<number>(getKokoroProgress);
  const isSpeakingRef = useRef(false);

  // Stay in sync with Kokoro load progress
  useEffect(() => {
    return subscribeKokoro(() => {
      setKokoroStatus(getKokoroStatus());
      setKokoroProgress(getKokoroProgress());
    });
  }, []);

  // Let the global coordinator force-stop this message when another starts
  useEffect(() => {
    return registerSpeaker(messageId, () => {
      setIsSpeaking(false);
      setIsGenerating(false);
      isSpeakingRef.current = false;
    });
  }, [messageId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isSpeakingRef.current) stopAllAudio();
    };
  }, []);

  const stop = useCallback(() => {
    stopAllAudio();
    setIsSpeaking(false);
    setIsGenerating(false);
    isSpeakingRef.current = false;
  }, []);

  const speakWithBrowser = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getBestBrowserVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.onstart = () => {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(async (text: string) => {
    // Toggle off if already active
    if (isSpeakingRef.current || isGenerating) {
      stop();
      return;
    }

    // Stop anything else that's playing
    stopAllAudio(messageId);

    if (kokoroStatus === "ready") {
      // Kokoro is loaded — generate high-quality audio
      const instance = getKokoroInstance();
      if (!instance) { speakWithBrowser(text); return; }

      setIsGenerating(true);
      try {
        const result = await instance.generate(text, { voice: "af_heart" });
        const blob = result.toBlob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        setCurrentAudio(audio);

        audio.onplay = () => {
          setIsSpeaking(true);
          isSpeakingRef.current = true;
        };
        audio.onended = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          setCurrentAudio(null);
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          setCurrentAudio(null);
          URL.revokeObjectURL(url);
        };

        setIsGenerating(false);
        await audio.play();
      } catch {
        setIsGenerating(false);
        setIsSpeaking(false);
        speakWithBrowser(text); // graceful fallback
      }
      return;
    }

    // Kokoro not ready — play browser voice immediately, load Kokoro in background
    speakWithBrowser(text);
    if (kokoroStatus === "idle") {
      loadKokoro(); // fire-and-forget; future clicks will use it
    }
  }, [messageId, isGenerating, kokoroStatus, stop, speakWithBrowser]);

  return {
    speak,
    stop,
    isSpeaking,
    isGenerating,
    kokoroLoading: kokoroStatus === "loading",
    kokoroProgress,
    kokoroReady: kokoroStatus === "ready",
  };
}
