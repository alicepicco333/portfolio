import React, { useEffect, useState } from "react";
import { gsap } from "gsap";

// Visitor controls for motion and contrast. The choice is stored on this device and applied as
// data-motion / data-contrast on <html> (read before paint in _document.js).
const read = (key) => (typeof document === "undefined" ? null : document.documentElement.dataset[key]);

const A11yControls = ({ className = "", compact = false }) => {
  const [motion, setMotion] = useState("on");
  const [contrast, setContrast] = useState("standard");

  useEffect(() => {
    setMotion(read("motion") || "on");
    setContrast(read("contrast") || "standard");
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
    </div>
  );
};

export default A11yControls;
