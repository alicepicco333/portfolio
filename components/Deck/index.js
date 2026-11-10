import React, { useEffect, useRef, useState } from "react";
import { withBase } from "../../utils";

// Plates full of text, shown one at a time at full width so they can be read: previous and next,
// arrow keys while the deck has focus, a counter, and a strip of thumbnails to jump.
const Deck = ({ images, title, heading = "Slides" }) => {
  const [i, setI] = useState(0);
  const strip = useRef(null);
  const n = images.length;
  const go = (to) => setI(((to % n) + n) % n);
  const plate = images[i];

  // keep the current thumbnail in view, and fetch the next plate before it is asked for
  useEffect(() => {
    strip.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    if (images[i + 1]) new Image().src = withBase(images[i + 1].src);
  }, [i, images]);

  return (
    <section
      aria-labelledby="deck-title"
      className="flex flex-col gap-4 px-4 py-10 tablet:px-10"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="deck-title" className="fu-title text-phi1">{heading}</h2>
        <p className="font-mono text-[14px] text-graphite" aria-live="polite">
          {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
        </p>
      </div>

      <figure className="flex w-full max-w-[1400px] flex-col gap-3">
        <a href={withBase(plate.src)} target="_blank" rel="noreferrer" aria-label={`Slide ${i + 1} full size (opens in a new tab)`} className="block">
          <img src={withBase(plate.src)} alt={plate.caption || `${title}, slide ${i + 1}`} className="block aspect-[16/9] w-full border border-ink bg-bone object-contain" />
        </a>
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between tablet:gap-8">
          {plate.caption && <figcaption className="max-w-[720px] text-[16px] leading-snug text-graphite" aria-live="polite">{plate.caption}</figcaption>}
          <div className="flex shrink-0">
            <button type="button" onClick={() => go(i - 1)} className="-mr-px min-h-[44px] border border-ink bg-paper px-4 font-mono text-[14px] text-ink hover:bg-bone" aria-label="Previous slide">
              ← Previous
            </button>
            <button type="button" onClick={() => go(i + 1)} className="min-h-[44px] border border-ink bg-olive px-4 font-mono text-[14px] text-white hover:bg-ink" aria-label="Next slide">
              Next →
            </button>
          </div>
        </div>
      </figure>

      <ol ref={strip} className="flex max-w-[1400px] gap-2 overflow-x-auto pb-2" aria-label="All slides">
        {images.map((im, k) => (
          <li key={im.src} className="shrink-0">
            <button
              type="button"
              data-i={k}
              onClick={() => setI(k)}
              aria-current={k === i ? "true" : undefined}
              aria-label={`Slide ${k + 1}${im.caption ? `: ${im.caption}` : ""}`}
              className={`block w-[112px] border-2 ${k === i ? "border-olive" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              <img src={withBase(im.src)} alt="" loading="lazy" className="block aspect-[16/9] w-full object-cover" />
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default Deck;
