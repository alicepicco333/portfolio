// Pieces shared by the hero map and its variants (?hero=orbit, field, flow): the statement, the
// skill card, the phone hero, and the small hooks that decide whether anything may move.
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import portfolioData from "../../data/portfolio.json";
import { NODES, CLUSTERS, nodeOf, labelOf, clusterOf, SKILL_NOTES } from "../Graph/data";
import { useMotionOn, usePrefersReducedMotion, withBase } from "../../utils";
import { motionOn } from "../../utils/motion";

// the statement, in pieces: plain text, and [phrase, skill] pairs that open the part of the map they name
export const STATEMENT = [
  "I’m an ",
  ["HCI researcher and designer", "hci"],
  ". I ",
  ["design interactions, devices and interfaces", "ixd"],
  ", from first interview to working prototype, and ",
  ["test them with people", "ur"],
  ".",
];
export const STATEMENT_TEXT = STATEMENT.map((part) => (typeof part === "string" ? part : part[0])).join("");
export const AVAILABLE = "Available for freelance · Amsterdam";

// the method, in reading order, with its short verb (as in components/Method) and its methods (About)
export const STEPS = [
  ["listening", "listen"],
  ["ordering", "order"],
  ["counting", "count"],
  ["shaping", "shape"],
  ["playing", "play"],
].map(([id, verb]) => {
  const c = CLUSTERS.find((x) => x.id === id);
  const practice = (portfolioData.about.practice || []).find((p) => p.title.toLowerCase() === c.label.toLowerCase());
  return { id, verb, label: c.label, skills: c.skills, items: practice ? practice.items : "" };
});
export const STEP_KEYS = STEPS.map((s) => s.id);
export const stepOf = (skillId) => STEPS.find((s) => s.skills.includes(skillId));
export const weightOf = (id) => nodeOf(id).work.length;

export const shortTitle = (title) => title.split(" - ")[0];
export const mapTitle = (p) => p.short || shortTitle(p.title);
export const byRank = (a, b) => (a.rank ?? 99) - (b.rank ?? 99);

// a plain key press inside this section, not typing in a field and not a browser shortcut
export const plainKey = (e) => !(e.metaKey || e.ctrlKey || e.altKey) && !/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName);

// may things move right now: the visitor's motion switch and the system setting, read at call time
export const canAnimate = () =>
  typeof window !== "undefined" && motionOn() && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// the same, kept in step for rendering
export function useAnimate() {
  const motion = useMotionOn();
  const reduced = usePrefersReducedMotion();
  return motion && !reduced;
}

// true while the element is on screen (loops pause when it is not)
export function useInView(ref) {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

// the width a label takes once the fonts are in (an estimate before that, or on the server)
let ctx2d = null;
export function measure(text, size, { weight = 500, mono = false, tracking = 0 } = {}) {
  const fallback = text.length * size * (mono ? 0.6 : 0.55);
  if (typeof document === "undefined") return fallback;
  ctx2d = ctx2d || document.createElement("canvas").getContext("2d");
  if (!ctx2d) return fallback;
  ctx2d.font = `${weight} ${size}px ${mono ? '"JetBrains Mono", monospace' : '"Inter Tight", sans-serif'}`;
  return ctx2d.measureText(text).width + tracking * size * Math.max(0, text.length - 1);
}
// re-render once the web fonts have loaded, so measured widths are the real ones
export function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    if (document.fonts?.ready) document.fonts.ready.then(() => live && setReady(true));
    else setReady(true);
    return () => {
      live = false;
    };
  }, []);
  return ready;
}
// the size of an element, kept in step
export function useSize(ref) {
  const [size, setSize] = useState(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => setSize((s) => (s && s.w === el.clientWidth && s.h === el.clientHeight ? s : { w: el.clientWidth, h: el.clientHeight }));
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

// Which skill the hero shows. Hover and focus preview a skill and stay on it until another one is
// previewed or the pointer leaves the hero; moving between skills waits a moment, so crossing one on
// the way to a link does not switch the card. Click or Enter pins a skill; Escape lets go.
export function useSkillState() {
  const [hover, setHoverState] = useState(null);
  const [pinned, setPinned] = useState(null);
  const hoverRef = useRef(null);
  const timer = useRef(null);
  const setHover = (id) => {
    hoverRef.current = id;
    setHoverState(id);
  };
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("skill");
    if (id && nodeOf(id)) setPinned(id);
    return () => clearTimeout(timer.current);
  }, []);
  return {
    hover,
    pinned,
    active: hover || pinned,
    // pointer: switch at once from nothing, after a short rest from another skill
    enter(id) {
      clearTimeout(timer.current);
      if (!hoverRef.current || hoverRef.current === id) setHover(id);
      else timer.current = setTimeout(() => setHover(id), 110);
    },
    cancel() {
      clearTimeout(timer.current);
    },
    // focus and the statement's phrases: at once
    show(id) {
      clearTimeout(timer.current);
      setHover(id);
    },
    toggle(id) {
      clearTimeout(timer.current);
      setPinned((p) => (p === id ? null : id));
      setHover(id);
    },
    pin(id) {
      clearTimeout(timer.current);
      setPinned(id);
      setHover(id);
    },
    leave() {
      clearTimeout(timer.current);
      setHover(null);
    },
    clear() {
      clearTimeout(timer.current);
      setHover(null);
      setPinned(null);
    },
  };
}

// keys inside the hero: 1 to 5 pick the first skill of each step, Escape lets go
export function heroKeys(state) {
  return (e) => {
    if (!plainKey(e)) return;
    if (e.key === "Escape") {
      state.clear();
      return;
    }
    const i = "12345".indexOf(e.key);
    if (i >= 0) state.pin(STEPS[i].skills[0]);
  };
}

// The statement with its three phrases: each one shows its skill in the map.
export const Statement = ({ active, state, className = "", style }) => (
  <p className={className} style={style}>
    {STATEMENT.map((part, i) => {
      if (typeof part === "string") return <React.Fragment key={i}>{part}</React.Fragment>;
      const [text, id] = part;
      return (
        /* a span, not a <button>: buttons cannot wrap mid-phrase, and the sentence must read as one */
        <span
          key={id}
          role="button"
          tabIndex={0}
          aria-pressed={state.pinned === id}
          aria-label={`${text}: show ${labelOf(id)} in the map`}
          onMouseEnter={() => state.show(id)}
          onFocus={() => state.show(id)}
          onClick={() => state.pin(id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              state.pin(id);
            }
          }}
          className={`cursor-pointer underline decoration-2 underline-offset-[6px] transition-[text-decoration-color,color] duration-150 hover:text-olive ${active === id ? "text-olive decoration-olive" : "decoration-ink/25"}`}
        >
          {text}
        </span>
      );
    })}
  </p>
);

// one skill: its step, what it is, the tools behind it and, where asked, the projects that use it
export const SkillCard = ({ id, projects, showWork = true, compact = false, align = "left", onLinkKeyDown, firstLinkRef }) => {
  const n = nodeOf(id);
  const work = n.work.map((pid) => projects.find((p) => p.id === pid)).filter(Boolean);
  const step = stepOf(id);
  return (
    <div className={`flex flex-col ${compact ? "gap-2" : "gap-3"} ${align === "center" ? "items-center text-center" : ""}`}>
      <p className="font-mono text-[13px] leading-none text-olive">{step.verb}</p>
      <p className={`${compact ? "text-[22px]" : "text-[26px]"} font-semibold leading-[1.05] tracking-[-0.015em]`}>{n.label}</p>
      <p className={`${compact ? "text-[15px]" : "text-[16px]"} leading-snug`}>{SKILL_NOTES[id]}</p>
      <p className="font-mono text-[13px] leading-snug text-graphite">{n.tools.join(", ")}</p>
      {showWork && work.length > 0 && (
        <ul className={`mt-1 flex flex-col gap-1 ${align === "center" ? "items-center" : ""}`} aria-label={`Projects with ${n.label}`}>
          {work.map((p, i) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                ref={i === 0 ? firstLinkRef : undefined}
                onKeyDown={onLinkKeyDown}
                className="group inline-flex min-h-[28px] items-center gap-2 text-[16px] font-semibold"
              >
                <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full" style={{ background: "rgb(var(--olive))" }} />
                <span className="underline decoration-olive/0 decoration-2 underline-offset-4 transition-[text-decoration-color] duration-150 group-hover:decoration-olive">{mapTitle(p)}</span>
                <span aria-hidden="true" className="text-olive">↗</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// one step of the method: its verb, its methods, its skills
export const StepNote = ({ step, align = "left", compact = false }) => (
  <div className={`flex flex-col ${compact ? "gap-2" : "gap-3"} ${align === "center" ? "items-center text-center" : ""}`}>
    <p className="font-mono text-[13px] leading-none text-olive">{step.verb}</p>
    <p className={`${compact ? "text-[22px]" : "text-[26px]"} font-semibold leading-[1.05] tracking-[-0.015em]`}>{step.skills.map(labelOf).join(", ")}</p>
    <p className={`${compact ? "text-[15px]" : "text-[16px]"} leading-snug`}>{step.items}</p>
  </div>
);

// the screen-reader line for the active skill
export const liveLine = (id) => {
  if (!id) return "";
  const n = nodeOf(id);
  return `${n.label}, ${clusterOf(id).label}. ${SKILL_NOTES[id]} Tools: ${n.tools.join(", ")}.`;
};
export const skillAria = (id, projects) => {
  const n = nodeOf(id);
  const count = n.work.filter((pid) => projects.find((p) => p.id === pid)).length;
  return `${n.label}, ${stepOf(id).verb}: ${n.tools.join(", ")}; ${count} ${count === 1 ? "project" : "projects"}`;
};

// Phones and tablets: the statement and the three projects that lead Selected work (as on the default hero).
export const PhoneHero = ({ projects }) => (
  <div className="relative overflow-hidden px-4 pb-16 pt-14 fu-gutter tablet:pb-24 tablet:pt-20 map:hidden">
    <div className="relative flex max-w-[720px] flex-col gap-6">
      <p className="text-[34px] font-medium leading-[1.12] tracking-[-0.02em] tablet:text-[52px]">{STATEMENT_TEXT}</p>
      <ul className="grid grid-cols-3 gap-3">
        {[...projects]
          .sort(byRank)
          .slice(0, 3)
          .map((w) => (
            <li key={w.id}>
              <Link href={`/projects/${w.id}`} className="flex flex-col gap-1.5 text-[14px] font-semibold leading-tight">
                <img src={withBase(w.cardWebp || w.cardImage)} alt="" className="aspect-[4/3] w-full border border-ink object-cover" loading="eager" draggable={false} />
                <span>{mapTitle(w)}</span>
              </Link>
            </li>
          ))}
      </ul>
      <a href="#work" className="inline-flex min-h-[44px] w-max items-center border-b-2 border-olive font-mono text-[14px] text-olive">
        All work
      </a>
    </div>
  </div>
);

export { NODES, CLUSTERS, nodeOf, labelOf, clusterOf };
