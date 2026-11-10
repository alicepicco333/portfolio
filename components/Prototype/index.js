import React, { useEffect, useRef, useState } from "react";
import { withBase, useMotionOn, usePrefersReducedMotion } from "../../utils";

// A working prototype to try in the page: a still with a start button, so nothing heavy loads until
// the visitor asks for it; then the prototype in a frame (camera and microphone only if it asks).
export const TryIt = ({ data, title, first = false }) => {
  const [on, setOn] = useState(false);
  const src = withBase(data.src);

  return (
    <section aria-labelledby="try-title" className={`flex flex-col gap-6 px-4 tablet:px-10 ${first ? "pb-12 pt-2 laptop:pb-16" : "py-16 laptop:py-[88px]"}`}>
      <div className="grid gap-x-4 gap-y-4 laptop:grid-cols-4">
        <h2 id="try-title" className="fu-title text-phi1">
          {data.title || "Try it"}
        </h2>
        {data.intro && <p className="max-w-[720px] text-[19px] leading-relaxed laptop:col-span-3">{data.intro}</p>}
      </div>
      <div className="flex flex-col gap-4">
        {/* the prototype needs room: full width, most of the window's height; on phones a tall frame,
            as its controls stack under the view */}
        <div className="relative h-[780px] w-full max-w-[1440px] overflow-hidden border border-ink bg-ink tablet:h-[clamp(720px,88vh,960px)]">
          {on ? (
            <iframe src={src} title={`${title}: the prototype`} className="absolute inset-0 h-full w-full" allow="camera; microphone; fullscreen; autoplay" allowFullScreen />
          ) : (
            <button type="button" onClick={() => setOn(true)} className="group absolute inset-0 block h-full w-full text-left">
              {data.poster && <img src={withBase(data.poster)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-200 group-hover:opacity-100" />}
              <span className="absolute bottom-4 left-4 inline-flex min-h-[44px] items-center bg-olive px-5 font-mono text-[14px] uppercase tracking-[0.12em] text-white group-hover:bg-ink group-focus-visible:bg-ink tablet:bottom-6 tablet:left-6">
                {data.button || "Start"} →
              </span>
            </button>
          )}
        </div>
        <p className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[14px] leading-relaxed text-graphite">
          {data.note && <span>{data.note}</span>}
          <a href={src} target="_blank" rel="noreferrer" className="underline decoration-olive underline-offset-2 hover:text-ink">
            Open on its own page ↗
          </a>
        </p>
      </div>
    </section>
  );
};

// A short recording. With `loop` it plays like a GIF (silent, on a loop, no controls) inside a wide
// ink panel the size of the prototype's frame: the portrait recording on the left, its transcript
// on the right in large type, each line lit while it is spoken (timed by the captions file). With
// motion off (the site's toggle or the system setting) it waits, with its controls, until played.
export const Clip = ({ data, title }) => {
  const motion = useMotionOn();
  const reduced = usePrefersReducedMotion();
  const gif = Boolean(data.loop) && motion && !reduced;
  const ref = useRef(null);
  const trackRef = useRef(null);
  const [line, setLine] = useState(-1);
  const lines = data.transcript || [];

  // a GIF-like clip plays only while it is on screen
  useEffect(() => {
    const v = ref.current;
    if (!v || !gif) return undefined;
    v.muted = true; // React does not write `muted` into the server HTML, and browsers only autoplay muted video
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, [gif]);

  // light the line being spoken: the captions' cues, in order, are the transcript's lines
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    const t = el.track;
    t.mode = "hidden"; // timed, but drawn by the list beside the video, not over it
    const onCue = () => {
      const cue = t.activeCues && t.activeCues[0];
      setLine(cue && t.cues ? Array.prototype.indexOf.call(t.cues, cue) : -1);
    };
    t.addEventListener("cuechange", onCue);
    return () => t.removeEventListener("cuechange", onCue);
  }, [gif]);

  return (
    <section aria-labelledby="clip-title" className="flex flex-col gap-6 px-4 pb-16 tablet:px-10 laptop:pb-[88px]">
      <div className="grid gap-x-4 gap-y-4 laptop:grid-cols-4">
        <h2 id="clip-title" className="fu-title text-phi1">
          {data.title || "Recording"}
        </h2>
        {data.caption && <p className="max-w-[720px] text-[19px] leading-relaxed laptop:col-span-3">{data.caption}</p>}
      </div>
      <div className="grid w-full max-w-[1440px] overflow-hidden border border-ink bg-[#0E0E10] tablet:h-[clamp(620px,88vh,960px)] tablet:grid-cols-[auto_1fr] tablet:grid-rows-[minmax(0,1fr)]">
        <video
          key={gif ? "gif" : "player"}
          ref={ref}
          className="block h-auto w-full tablet:h-full tablet:w-auto"
          style={data.width && data.height ? { aspectRatio: `${data.width} / ${data.height}` } : undefined}
          aria-label={`${title}: ${data.title || "recording"}`}
          poster={data.poster ? withBase(data.poster) : undefined}
          playsInline
          {...(gif ? { muted: true, loop: true, autoPlay: true, preload: "auto" } : { controls: true, preload: "none", muted: Boolean(data.loop) })}
        >
          {data.webm && <source src={withBase(data.webm)} type="video/webm" />}
          <source src={withBase(data.src)} type="video/mp4" />
          {data.captions && <track ref={trackRef} kind="captions" src={withBase(data.captions)} srcLang="en" label="English" default />}
        </video>
        {lines.length > 0 && (
          <div className="flex flex-col justify-center gap-4 px-6 py-8 tablet:px-12">
            <p className="font-mono text-[14px] uppercase tracking-[0.12em] text-[rgba(213,214,219,0.7)]">Spoken to the car</p>
            <ol className="flex flex-col gap-1" aria-label="Transcript">
              {lines.map((l, k) => (
                <li
                  key={k}
                  aria-current={k === line ? "true" : undefined}
                  className={`fu-display text-[28px] leading-[1.15] transition-colors duration-200 tablet:text-[clamp(28px,4.2vh,46px)] ${k === line ? "text-[#8FD9A4]" : "text-[rgba(213,214,219,0.55)]"}`}
                >
                  {l}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
};
