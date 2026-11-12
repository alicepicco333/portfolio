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
            <button type="button" onClick={() => setOn(true)} className="group absolute inset-0 flex h-full w-full items-center justify-center">
              {/* a clean still of the world, dimmed, and one label in the middle: the whole picture is the button */}
              {data.poster && <img src={withBase(data.poster)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity duration-200 group-hover:opacity-90" />}
              <span className="relative inline-flex min-h-[52px] items-center bg-olive px-6 font-mono text-[15px] uppercase tracking-[0.12em] text-white group-hover:bg-[#0E0E10] group-focus-visible:bg-[#0E0E10]">
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

// A line speaker for the sound button, drawn like the site's other line marks: with two waves for
// "Sound on", crossed out for "Sound off", so the picture says what the button's words say.
const Speaker = ({ off }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M2.5 9h3.5l5-4.5v15L6 15H2.5z" />
    {off ? <path d="M15 9l6 6M21 9l-6 6" /> : <path d="M14.7 8.8a4.5 4.5 0 0 1 0 6.4M17.5 6a8.5 8.5 0 0 1 0 12" />}
  </svg>
);

// A short recording. With `loop` it plays like a GIF (silent, on a loop, no controls) inside a wide
// ink panel the size of the prototype's frame, split in two halves: the portrait recording in one,
// its transcript in the other in large type, each line lit while it is spoken (timed by the captions
// file). With motion off (the site's toggle or the system setting) it waits, with its controls,
// until played.
export const Clip = ({ data, title }) => {
  const motion = useMotionOn();
  const reduced = usePrefersReducedMotion();
  const gif = Boolean(data.loop) && motion && !reduced;
  const ref = useRef(null);
  const trackRef = useRef(null);
  const [line, setLine] = useState(-1);
  const [sound, setSound] = useState(false);
  const lines = data.transcript || [];

  // the loop starts silent (browsers only autoplay muted video); sound comes on with a click, and the
  // recording starts again from the first command so the words are heard in order
  const toggleSound = () => {
    const v = ref.current;
    if (!v) return;
    const on = !sound;
    v.muted = !on;
    if (on) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
    setSound(on);
  };

  // a GIF-like clip plays only while it is on screen
  useEffect(() => {
    const v = ref.current;
    if (!v || !gif) return undefined;
    v.muted = !sound; // React does not write `muted` into the server HTML, and browsers only autoplay muted video
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, [gif]); // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* two equal halves from tablet up, the recording and its transcript drawn to the line between them,
          so the lit line sits next to the car: the portrait recording keeps its shape at the panel's full
          height (or the half's width, if that is narrower), and the transcript's type grows with the
          window, so no half is left mostly empty */}
      <div className="grid w-full max-w-[1440px] overflow-hidden border border-ink bg-[#0E0E10] tablet:h-[clamp(620px,88vh,960px)] tablet:grid-cols-2 tablet:grid-rows-[minmax(0,1fr)]">
        <div className="flex min-w-0 items-center justify-center tablet:h-full tablet:justify-end">
        <div className="relative w-full tablet:h-full tablet:w-auto tablet:max-w-full" style={data.width && data.height ? { aspectRatio: `${data.width} / ${data.height}` } : undefined}>
        <video
          key={gif ? "gif" : "player"}
          ref={ref}
          className="block h-full w-full"
          aria-label={`${title}: ${data.title || "recording"}`}
          poster={data.poster ? withBase(data.poster) : undefined}
          playsInline
          {...(gif ? { muted: true, loop: true, autoPlay: true, preload: "auto" } : { controls: true, preload: "none" })}
        >
          {data.webm && <source src={withBase(data.webm)} type="video/webm" />}
          <source src={withBase(data.src)} type="video/mp4" />
          {data.captions && <track ref={trackRef} kind="captions" src={withBase(data.captions)} srcLang="en" label="English" default />}
        </video>
        {/* the name says what a press does ("Sound on" while silent), so no aria-pressed: "Sound off,
            pressed" would read as if the sound were off */}
        {gif && (
          <button
            type="button"
            onClick={toggleSound}
            className="absolute bottom-4 left-4 inline-flex min-h-[44px] items-center gap-2 border border-[rgba(213,214,219,0.6)] bg-[rgba(14,14,16,0.82)] pl-3 pr-4 font-mono text-[14px] uppercase tracking-[0.12em] text-[#D5D6DB] hover:bg-[#0E0E10] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FD9A4]"
          >
            <Speaker off={sound} />
            {sound ? "Sound off" : "Sound on"}
          </button>
        )}
        </div>
        </div>
        {lines.length > 0 && (
          <div className="flex min-w-0 flex-col justify-center gap-4 px-6 py-8 tablet:px-12">
            <p className="font-mono text-[14px] uppercase tracking-[0.12em] text-[rgba(213,214,219,0.7)]">Spoken to the car</p>
            <ol className="flex flex-col gap-1" aria-label="Transcript">
              {lines.map((l, k) => (
                <li
                  key={k}
                  aria-current={k === line ? "true" : undefined}
                  className={`fu-display text-[28px] leading-[1.15] transition-colors duration-200 tablet:text-[clamp(28px,min(6.4vh,3.9vw),60px)] ${k === line ? "text-[#8FD9A4]" : "text-[rgba(213,214,219,0.55)]"}`}
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
