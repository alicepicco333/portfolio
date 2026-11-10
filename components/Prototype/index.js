import React, { useState } from "react";
import { withBase } from "../../utils";

// A working prototype to try in the page: a still with a start button, so nothing heavy loads until
// the visitor asks for it; then the prototype in a frame (camera and microphone only if it asks).
export const TryIt = ({ data, title }) => {
  const [on, setOn] = useState(false);
  const src = withBase(data.src);

  return (
    <section aria-labelledby="try-title" className="flex flex-col gap-6 px-4 py-16 tablet:px-10 laptop:py-[88px]">
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

// A short recording with its transcript, for anyone who cannot play the sound.
export const Clip = ({ data, title }) => (
  <section aria-labelledby="clip-title" className="grid gap-x-4 gap-y-6 px-4 pb-16 tablet:px-10 laptop:grid-cols-4 laptop:pb-[88px]">
    <h2 id="clip-title" className="fu-title text-phi1">
      {data.title || "Recording"}
    </h2>
    <figure className="flex flex-col gap-3 laptop:col-span-3">
      <video
        controls
        playsInline
        preload="none"
        poster={data.poster ? withBase(data.poster) : undefined}
        className="block h-auto max-h-[78vh] w-auto max-w-full self-start border border-ink bg-ink"
        style={data.width && data.height ? { aspectRatio: `${data.width} / ${data.height}` } : undefined}
        aria-label={`${title}: ${data.title || "recording"}`}
      >
        <source src={withBase(data.src)} type="video/mp4" />
      </video>
      {data.caption && <figcaption className="max-w-[720px] text-[16px] leading-snug text-graphite">{data.caption}</figcaption>}
      {data.transcript?.length > 0 && (
        <details className="max-w-[720px] text-[16px] leading-snug">
          <summary className="w-max cursor-pointer font-mono text-[14px] uppercase tracking-[0.12em] text-graphite hover:text-ink">Transcript</summary>
          <ol className="mt-3 flex flex-col gap-1">
            {data.transcript.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </details>
      )}
    </figure>
  </section>
);
