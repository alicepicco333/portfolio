import React, { useEffect, useRef, useState } from "react";
import { withBase } from "../../utils";
import portfolioData from "../../data/portfolio.json";
import { clusterOf } from "../Graph/data";
import { PATCHES, STILLS } from "./patches";

// The skill card: a small Hydra screen beside the picked skill, live-coding a still from a project that
// used it. One patch per step of the method, so the five steps each have their own loop. The code over the
// screen is the code that runs. One hydra-synth instance for the whole map, created the first time a card
// opens with motion on; it renders only while a card is open, on screen, in a visible tab. With motion off,
// reduced motion or no WebGL the card shows the still itself.

export const SCREEN = { w: 264, h: 198 }; // stage units (the stage is drawn at 16/18 of a pixel per unit)
export const CODE_FONT = 10;
export const CODE_LINE = 12.6;
const VERB = { listening: "listen", ordering: "order", counting: "count", shaping: "shape", playing: "play" };
const titleOf = (pid) => {
  const p = portfolioData.projects.find((x) => x.id === pid);
  return p ? p.short || p.title.split(" - ")[0] : "";
};
const stepOf = (skill) => clusterOf(skill).id;
// the code on the screen: which still it plays on, then the patch itself
export const codeOf = (skill) => `// ${VERB[stepOf(skill)]} · ${titleOf(STILLS[skill][0])}\n${PATCHES[stepOf(skill)]}`;

function hasWebGL() {
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch (e) {
    return false;
  }
}

// run hydra code against a non-global synth: every synth function and buffer becomes a parameter
function run(synth, code) {
  const names = Object.keys(synth).filter((n) => /^[A-Za-z_$][\w$]*$/.test(n));
  // eslint-disable-next-line no-new-func
  new Function(...names, code)(...names.map((n) => synth[n]));
}

// tint the code like an editor: function names, numbers, the comment
const tokens = (line) => {
  const at = line.indexOf("//");
  if (at === 0) return [["dim", line]];
  if (at > 0) return [...tokens(line.slice(0, at)), ["dim", line.slice(at)]];
  const out = [];
  const re = /([A-Za-z_]\w*)(?=\()|(-?\d*\.?\d+)|([^A-Za-z_\d.-]+|[.-]|[A-Za-z_]\w*)/g;
  let m;
  while ((m = re.exec(line))) {
    if (m[1]) out.push(["fn", m[1]]);
    else if (m[2]) out.push(["num", m[2]]);
    else out.push(["fg", m[0]]);
  }
  return out;
};
const TONE = { fn: "rgb(var(--hy-fn))", num: "rgb(var(--hy-num))", dim: "rgb(var(--hy-dim))", fg: "rgb(var(--hy-fg))" };

const HydraCard = ({ skill, box, animate }) => {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const hydraRef = useRef(null);
  const loaded = useRef({ step: null, src: null });
  // "idle" until first needed, then "live" (WebGL running) or "still" (the image)
  const [mode, setMode] = useState("idle");
  const [visible, setVisible] = useState(true);
  // the last skill shown stays on the card while it closes
  const [shown, setShown] = useState(skill);
  useEffect(() => {
    if (skill) setShown(skill);
  }, [skill]);
  const on = !!skill && !!box;

  // load hydra-synth the first time a card opens with motion on
  useEffect(() => {
    if (!on || mode !== "idle" || !animate) return undefined;
    if (!hasWebGL()) {
      setMode("still");
      return undefined;
    }
    let cancelled = false;
    import("hydra-synth")
      .then(({ default: Hydra }) => {
        if (cancelled || !canvasRef.current) return;
        try {
          const c = canvasRef.current;
          const dpr = Math.min(1.5, window.devicePixelRatio || 1);
          c.width = Math.round(SCREEN.w * dpr);
          c.height = Math.round(SCREEN.h * dpr);
          hydraRef.current = new Hydra({ canvas: c, makeGlobal: false, detectAudio: false, autoLoop: false, enableStreamCapture: false, precision: "mediump" });
          setMode("live");
        } catch (e) {
          setMode("still");
        }
      })
      .catch(() => setMode("still"));
    return () => {
      cancelled = true;
    };
  }, [on, mode, animate]);

  // a new skill: its still into s0 and, when the step changes, its step's patch
  useEffect(() => {
    const h = hydraRef.current;
    if (mode !== "live" || !h || !shown) return;
    const src = withBase(STILLS[shown][1]);
    const step = stepOf(shown);
    try {
      if (loaded.current.src !== src) {
        h.synth.s0.initImage(src);
        loaded.current.src = src;
      }
      if (loaded.current.step !== step) {
        run(h.synth, PATCHES[step]);
        loaded.current.step = step;
      }
    } catch (e) {
      setMode("still");
    }
  }, [mode, shown]);

  // pause whenever the hero is off screen
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // the loop runs only while a card is open, on screen, the tab is visible and motion is on
  useEffect(() => {
    const h = hydraRef.current;
    if (mode !== "live" || !h || !on || !visible || !animate) return undefined;
    let raf;
    let last = performance.now();
    const frame = (now) => {
      if (!document.hidden) h.tick(Math.min(64, now - last));
      last = now;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [mode, on, visible, animate]);

  // a card opening on another skill: the screen wipes in from the top
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !skill || !animate || !el.animate) return;
    el.animate([{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(-12px -12px -12px -12px)" }], { duration: 320, easing: "cubic-bezier(0.77, 0, 0.175, 1)" });
  }, [skill, animate]);

  // one WebGL context, released with the map
  useEffect(
    () => () => {
      const h = hydraRef.current;
      if (!h) return;
      try {
        h.regl.destroy();
        h.regl._gl?.getExtension("WEBGL_lose_context")?.loseContext();
      } catch (e) {}
      hydraRef.current = null;
    },
    []
  );

  const still = mode !== "live" || !animate;
  const lines = shown ? codeOf(shown).split("\n") : [];
  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="hy-panel pointer-events-none absolute z-[2] overflow-hidden border border-ink bg-ink shadow-[6px_6px_0_rgb(var(--olive-fill))]"
      data-on={on && (mode !== "idle" || !animate) ? "true" : "false"}
      style={box ? { left: box.x, top: box.y, width: SCREEN.w, height: SCREEN.h } : { left: 0, top: 0, width: SCREEN.w, height: SCREEN.h }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" style={{ visibility: still ? "hidden" : "visible" }} />
      {still && shown && <img src={withBase(STILLS[shown][1])} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: "grayscale(1) contrast(1.1)" }} draggable={false} />}
      {/* the patch, over its own output, as in a Hydra editor */}
      <pre className="hy-code absolute bottom-0 left-0 m-0 whitespace-pre p-2 font-mono" style={{ fontSize: CODE_FONT, lineHeight: `${CODE_LINE}px` }}>
        <code>
          {lines.map((line, i) => (
            <span key={i} className="ln block w-max" style={{ background: "rgb(var(--hy-bg) / 0.78)" }}>
              {tokens(line).map(([t, s], j) => (
                <span key={j} style={{ color: TONE[t], fontWeight: t === "fn" ? 600 : 400 }}>
                  {s}
                </span>
              ))}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
};

export default HydraCard;
