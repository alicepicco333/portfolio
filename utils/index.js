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
// Each project page carries its own colour, with a darker version for high-contrast mode
// (applied through the .project-theme class in globals.css).
export const projectStyle = (hex, hexHC) =>
  hex ? { "--project": hexToTriplet(hex), "--project-hc": hexToTriplet(hexHC || hex) } : undefined;
