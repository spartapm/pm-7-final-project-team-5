"use client";

import { useEffect } from "react";

export function KeyboardFit() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const apply = () => {
      const keyboard = window.innerHeight - vv.height > 80;
      document.documentElement.classList.toggle("kb-open", keyboard);
      document.documentElement.style.setProperty("--vvh", `${Math.round(vv.height)}px`);
      if (!keyboard) return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.scrollIntoView({ block: "center" });
      }
    };
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
      document.documentElement.classList.remove("kb-open");
    };
  }, []);
  return null;
}
