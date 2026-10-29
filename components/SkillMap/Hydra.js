import React, { useEffect, useRef, useState } from "react";
import { withBase } from "../../utils";

// Playing, live: a hydra-synth patch that runs behind the Playing cluster of the hero map while one of
// its skills is selected, with the patch itself under it as text. The code shown is the code that runs:
// PATCH is evaluated as is against the synth.
export const PATCH = `osc(8, 0.06, 1.4) // five verbs, one blue
  .kaleid(5)
  .modulate(noise(3, 0.1), 0.35)
  .diff(osc(60, -0.04).thresh(0.6).kaleid(5))
  .color(0.1, 0.1, 1)
  .modulateScale(osc(2, 0.05), 0.3)
  .blend(src(o0).scale(1.01), 0.4)
  .out(o0)`;
const LINES = PATCH.split("\n");
export const CODE_FONT = 14; // stage units (the stage is drawn at 16/18 of a pixel per unit)
export const CODE_LINE = 19;
export const CODE_PAD = 8;
export const codeSize = () => ({
  w: Math.max(...LINES.map((l) => l.length)) * CODE_FONT * 0.6 + CODE_PAD * 2 + 4,
  h: LINES.length * CODE_LINE + CODE_PAD * 2,
});
// a still of the same patch, for motion off, reduced motion and browsers without WebGL
const STILL = "/hydra/playing-still.jpg";

// ask for WebGL before downloading anything; the test context is released at once
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

const HydraPlaying = ({ on, box, code, motion }) => {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const hydraRef = useRef(null);
  // "idle" until first needed, then "live" (WebGL running) or "still" (the image)
  const [mode, setMode] = useState("idle");
  const [visible, setVisible] = useState(true);
  const wide = typeof window !== "undefined" && window.matchMedia("(min-width: 1152px)").matches;
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animate = motion && !reduced;

  // load hydra-synth the first time Playing opens with motion on, on a wide screen
  useEffect(() => {
    // motion off shows the still without loading anything; switching motion on later loads the patch
    if (!on || mode !== "idle" || !box || !animate) return undefined;
    if (!wide || !hasWebGL()) {
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
          c.width = Math.round(box.w * dpr);
          c.height = Math.round(box.h * dpr);
          const h = new Hydra({ canvas: c, makeGlobal: false, detectAudio: false, autoLoop: false, enableStreamCapture: false, precision: "mediump" });
          run(h.synth, PATCH);
          h.tick(16);
          hydraRef.current = h;
          setMode("live");
        } catch (e) {
          setMode("still"); // no WebGL: the still
        }
      })
      .catch(() => setMode("still"));
    return () => {
      cancelled = true;
    };
  }, [on, mode, box, animate, wide]);

  // pause whenever the hero is off screen
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // the loop runs only while Playing is open, on screen, the tab is visible and motion is on
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

  if (!box) return null;
  const still = mode === "still" || !animate;
  const shown = on && (mode !== "idle" || !animate) ? "true" : "false";
  return (
    <>
      {/* the screen: behind the map's lines and nodes, decorative */}
      <div
        ref={wrapRef}
        aria-hidden="true"
        className="hy-panel absolute border border-ink bg-ink shadow-[6px_6px_0_rgb(var(--olive-fill))]"
        data-on={shown}
        style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" style={{ visibility: still ? "hidden" : "visible" }} />
        {still && <img src={withBase(STILL)} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />}
      </div>
      {/* the patch, as text: real, selectable, read by screen readers when Playing is open */}
      {code && (
        <figure
          className="hy-panel hy-code absolute m-0"
          data-on={shown}
          aria-hidden={on ? undefined : "true"}
          style={{ left: code.x, top: code.y, width: code.w, zIndex: 2 }}
        >
          <figcaption className="sr-only">The Hydra patch running behind the Playing skills</figcaption>
          <pre
            className="m-0 whitespace-pre font-mono"
            style={{ fontSize: CODE_FONT, lineHeight: `${CODE_LINE}px`, padding: CODE_PAD, background: "rgb(var(--hy-bg) / 0.92)" }}
          >
            <code>
              {LINES.map((line, i) => (
                <span key={i} className="ln block">
                  {tokens(line).map(([t, s], j) => (
                    <span key={j} style={{ color: TONE[t], fontWeight: t === "fn" ? 600 : 400 }}>
                      {s}
                    </span>
                  ))}
                  {i === LINES.length - 1 && mode === "live" && animate && (
                    <span className="fu-blink ml-0.5 inline-block align-[-2px]" style={{ width: CODE_FONT * 0.6, height: CODE_FONT + 2, background: "rgb(var(--hy-fg))" }} />
                  )}
                </span>
              ))}
            </code>
          </pre>
        </figure>
      )}
    </>
  );
};

export default HydraPlaying;
