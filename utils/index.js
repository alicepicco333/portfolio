import { useLayoutEffect, useEffect, useState } from "react";

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Category → short label + pastel tone (FIELD/UNIT colour key)
const CATEGORY_META = {
  Design: { short: "Design", tone: "rgb(var(--pink))" },
  Research: { short: "Research", tone: "rgb(var(--lilac))" },
  "Live Coding": { short: "Live coding", tone: "rgb(var(--mint))" },
  "Work in Progress": { short: "Work in progress", tone: "rgb(var(--signal))" },
  "Past Projects": { short: "Past projects", tone: "rgb(var(--khaki))" },
};

// Prefix local /public paths with the deploy base path (GitHub Pages serves from a sub-folder).
export function withBase(src) {
  return src && src.startsWith("/") ? `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${src}` : src;
}

export function categoryMeta(category) {
  return CATEGORY_META[category] || { short: category, tone: "rgb(var(--concrete))" };
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function ISOToDate(date) {
  if (date) {
    let convertDate = new Date(date);
    return (
      convertDate.getFullYear() +
      "-" +
      (convertDate.getMonth() + 1) +
      "-" +
      convertDate.getDate()
    );
  }
}

export function getRandomImage() {
  const randomImageUrl = [
    "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80",
    "https://images.unsplash.com/photo-1638742385167-96fc60e12f59?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1632&q=80",
    "https://images.unsplash.com/photo-1618367588411-d9a90fefa881?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80",
    "https://images.unsplash.com/photo-1657295791913-5074c912398e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=996&q=80",
  ];
  return randomImageUrl[Math.floor(Math.random() * randomImageUrl.length)];
}

// Newest first; `date` is an ISO date used only for ordering, `dateLabel` is what is shown.
export const byDateDesc = (a, b) => (b.date || "").localeCompare(a.date || "");

// Which of the given section ids is on screen (the last one whose top has passed 35% of the
// viewport), plus overall scroll progress 0–1. Used by the numbered nav and the left rail.
export function useActiveSection(ids) {
  const [state, setState] = useState({ active: null, progress: 0 });
  const key = ids.join(",");
  useEffect(() => {
    const els = key.split(",").map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return undefined;
    const update = () => {
      const line = window.innerHeight * 0.35;
      let active = null;
      els.forEach((el) => {
        if (el.getBoundingClientRect().top <= line) active = el.id;
      });
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY >= max - 2) active = els[els.length - 1].id;
      setState({ active, progress: max > 0 ? Math.min(1, window.scrollY / max) : 0 });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [key]);
  return state;
}

// A project's own colour, applied by overriding the house accent inside its page or tile.
// Accents are stored as hex in portfolio.json and already clear 4.5:1 against the paper.
export const hexToTriplet = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");

// WCAG contrast, and the accent mixed towards white in small steps until it passes a test.
const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const luminance = (rgb) =>
  rgb
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const lightenUntil = (hex, passes) => {
  const rgb = rgbOf(hex);
  for (let t = 0; t <= 1; t += 0.02) {
    const mixed = rgb.map((v) => Math.round(v + (255 - v) * t));
    if (passes(mixed)) return mixed.join(" ");
  }
  return "255 255 255";
};
// the dark theme's page and card surface (--bone and --paper in globals.css)
const DARK_PAGE = [14, 14, 16];
const DARK_PAPER = [28, 28, 33];
const HOUSE_FILL_ON_DARK = contrast([26, 26, 255], DARK_PAGE); // #1A1AFF on the dark page, 2.4:1

// Each project page carries its own colour, with a darker version for high-contrast mode and, for the
// dark theme, a lighter one for text and lines (4.5:1 on the dark cards) and a fill that stands off the
// dark page at least as clearly as the house blue (applied through .project-theme in globals.css).
export const projectStyle = (hex, hexHC) =>
  hex
    ? {
        "--project": hexToTriplet(hex),
        "--project-hc": hexToTriplet(hexHC || hex),
        "--project-dark": lightenUntil(hex, (c) => contrast(c, DARK_PAPER) >= 4.5),
        "--project-fill-dark": lightenUntil(hex, (c) => contrast(c, DARK_PAGE) >= HOUSE_FILL_ON_DARK),
      }
    : undefined;

// The visitor's own motion setting (see components/A11yControls), kept in step when it changes,
// so scroll scenes can tear down to the static page the moment motion is switched off.
export function useMotionOn() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    const el = document.documentElement;
    const read = () => setOn(el.dataset.motion !== "off");
    read();
    const observer = new MutationObserver(read);
    observer.observe(el, { attributes: true, attributeFilter: ["data-motion"] });
    return () => observer.disconnect();
  }, []);

  return on;
}
