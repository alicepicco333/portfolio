import React, { useEffect, useState } from "react";
import { gsap } from "gsap";

// Visitor controls for motion, contrast and the dark theme. The choice is stored on this device and applied
// as data-motion / data-contrast / data-theme on <html> (read before paint in _document.js, which also
// follows the device's light or dark setting until a theme is chosen here).
const read = (key) => (typeof document === "undefined" ? null : document.documentElement.dataset[key]);
const THEME_COLOR = { dark: "#0E0E10", light: "#D5D6DB" };

const A11yControls = ({ className = "", compact = false }) => {
  const [motion, setMotion] = useState("on");
  const [contrast, setContrast] = useState("standard");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const sync = () => {
      setMotion(read("motion") || "on");
      setContrast(read("contrast") || "standard");
      setTheme(read("theme") || "light");
    };
    sync();
    // the header and the accessibility page each have a copy, and the device can switch the theme
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion", "data-contrast", "data-theme"] });
    return () => observer.disconnect();
  }, []);

  const toggleMotion = () => {
    const next = motion === "on" ? "off" : "on";
    document.documentElement.dataset.motion = next;
    try {
      localStorage.setItem("ap-motion", next);
    } catch (e) {}
    if (next === "off") {
      // finish every running animation where it would end, and stop the loops
      gsap.globalTimeline.getChildren(true, true, true).forEach((t) => {
        t.progress(1);
        t.kill();
      });
    }
    setMotion(next);
  };

  const toggleContrast = () => {
    const next = contrast === "standard" ? "high" : "standard";
    document.documentElement.dataset.contrast = next;
    try {
      localStorage.setItem("ap-contrast", next);
    } catch (e) {}
    setContrast(next);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[next]);
    try {
      localStorage.setItem("ap-theme", next);
    } catch (e) {}
    setTheme(next);
  };

  const btn = compact
    ? "flex min-h-[44px] items-center gap-2 px-2 font-mono text-[14px] aria-pressed:text-olive"
    : "min-h-[44px] border border-current px-3 font-mono text-[14px]";
  const dot = (on) => (compact ? <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 border border-current ${on ? "bg-current" : ""}`} /> : null);
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} role="group" aria-label="Display settings">
      <button type="button" className={btn} aria-pressed={motion === "on"} onClick={toggleMotion}>
        {dot(motion === "on")}
        {compact ? "motion" : `Motion: ${motion === "on" ? "on" : "off"}`}
      </button>
      <button type="button" className={btn} aria-pressed={contrast === "high"} onClick={toggleContrast}>
        {dot(contrast === "high")}
        {compact ? "high contrast" : `High contrast: ${contrast === "high" ? "on" : "off"}`}
      </button>
      <button type="button" className={btn} aria-pressed={theme === "dark"} onClick={toggleTheme}>
        {dot(theme === "dark")}
        {compact ? "dark" : `Dark mode: ${theme === "dark" ? "on" : "off"}`}
      </button>
    </div>
  );
};

export default A11yControls;
