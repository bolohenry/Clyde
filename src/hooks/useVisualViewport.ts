"use client";

import { useEffect } from "react";

/**
 * Sets --app-height CSS variable to window.visualViewport.height whenever it
 * changes. This keeps the main app container sized to the VISIBLE area so the
 * chat input is never hidden behind the soft keyboard on iOS Safari or Android.
 *
 * Falls back to window.innerHeight (and listens to resize) when the
 * visualViewport API isn't supported.
 */
export function useVisualViewport() {
  useEffect(() => {
    const update = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${h}px`);
    };

    update(); // set immediately on mount

    const vv = window.visualViewport;
    if (vv) {
      // visualViewport fires both resize (keyboard open/close) and scroll
      // (iOS sometimes scrolls the visual viewport when the keyboard opens)
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
    } else {
      window.addEventListener("resize", update);
    }

    return () => {
      const vv2 = window.visualViewport;
      if (vv2) {
        vv2.removeEventListener("resize", update);
        vv2.removeEventListener("scroll", update);
      } else {
        window.removeEventListener("resize", update);
      }
    };
  }, []);
}
