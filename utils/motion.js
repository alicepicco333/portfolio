// Shared GSAP helpers. Callers wrap these in gsap.matchMedia("(prefers-reduced-motion: no-preference)")
// and also check motionOn(), the visitor's own setting (see components/A11yControls).
export const motionOn = () => typeof document === "undefined" || document.documentElement.dataset.motion !== "off";

const GLYPHS = "#/|_-=+*<>:01";

// Decode a label from random glyphs to its text, left to right. Only for static text.
export function scramble(gsap, el, delay = 0, duration = 0.9) {
  const final = el.dataset.final ?? el.textContent;
  el.dataset.final = final;
  const o = { p: 0 };
  return gsap.to(o, {
    p: 1,
    duration,
    delay,
    ease: "none",
    onUpdate() {
      const n = Math.floor(o.p * final.length);
      el.textContent =
        final.slice(0, n) +
        final
          .slice(n)
          .split("")
          .map((c) => (c === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join("");
    },
    onComplete() {
      el.textContent = final;
    },
  });
}

// Trace solid SVG strokes in, one after another.
export function drawIn(gsap, els, { at = 0, step = 0, duration = 0.8, ease = "power2.out" } = {}) {
  els.forEach((el, i) => {
    const length = el.getTotalLength ? el.getTotalLength() : 0;
    if (!length) return;
    gsap.fromTo(
      el,
      { strokeDasharray: length, strokeDashoffset: length },
      {
        strokeDashoffset: 0,
        duration,
        delay: at + i * step,
        ease,
        onComplete() {
          el.style.strokeDasharray = "";
          el.style.strokeDashoffset = "";
        },
      }
    );
  });
}
