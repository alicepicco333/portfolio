import React from "react";
import { withBase } from "../../utils";

// Plates grouped into numbered sections (worldbuilding, persona, ...): each section a number and a
// title, then its plates at full width with their captions. Consecutive images with the same
// `section` form one section; space, not rules, sets the sections apart. Below laptop width a plate's
// type is too small to read in the page, so a line under it says it opens full size.
const PlateSections = ({ images, title }) => {
  const sections = [];
  images.forEach((im) => {
    const last = sections[sections.length - 1];
    if (last && last.title === im.section) last.items.push(im);
    else sections.push({ title: im.section || "", items: [im] });
  });

  return (
    <div className="flex flex-col gap-20 px-4 py-16 tablet:px-10 laptop:gap-28 laptop:py-[88px]">
      {sections.map((s, k) => {
        const id = `part-${k + 1}`;
        return (
          <section key={id} id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-24 flex-col gap-6">
            <h2 id={`${id}-title`} className="flex items-baseline gap-4">
              <span className="fu-meta text-fieldgrey">{String(k + 1).padStart(2, "0")}</span>
              <span className="fu-title text-phi1">{s.title}</span>
            </h2>
            <div className="flex flex-col gap-12">
              {s.items.map((im, j) => (
                <figure key={im.src} className="flex max-w-[1400px] flex-col gap-3">
                  <a
                    href={withBase(im.src)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open full size: ${s.title}${s.items.length > 1 ? `, ${j + 1} of ${s.items.length}` : ""} (opens in a new tab)`}
                    className="group block"
                  >
                    <img src={withBase(im.src)} alt={im.caption ? "" : `${title}, ${s.title}`} loading="lazy" className="block h-auto w-full border border-ink" />
                    <span className="mt-2 inline-block font-mono text-[13px] uppercase tracking-[0.1em] text-graphite underline decoration-olive underline-offset-4 group-hover:text-ink laptop:hidden">
                      Open full size ↗
                    </span>
                  </a>
                  {im.caption && <figcaption className="max-w-[720px] text-[16px] leading-snug text-graphite">{im.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default PlateSections;
