import React from "react";
import Link from "next/link";

// Earlier projects, kept but out of the work views and the map: one quiet ruled row each,
// the title and one line, the years and the live site (or the recording) on the right.
const linkLabel = (url) => (/vimeo\.com|youtube\.com|youtu\.be/.test(url) ? "Recording" : "Site");

const Archive = ({ projects }) => {
  if (!projects.length) return null;

  return (
    <section id="archive" aria-labelledby="archive-title" className="scroll-mt-16 px-4 py-16 fu-gutter tablet:py-24">
      <div className="grid gap-x-8 gap-y-8 laptop:grid-cols-4">
        <div className="flex flex-col gap-3">
          <h2 id="archive-title" className="fu-section-title">
            Archive
          </h2>
          <p className="max-w-[32ch] font-mono text-[14px] leading-relaxed text-graphite">
            Earlier projects, 2023 to 2024; some rebuilt in 2026.
          </p>
        </div>
        <ol className="laptop:col-span-3 laptop:pt-3">
          {projects.map((p) => (
            <li key={p.id} className="grid gap-x-6 gap-y-2 border-t border-ink/15 py-5 first:border-t-0 tablet:grid-cols-[minmax(0,1fr)_auto]">
              <Link href={`/projects/${p.id}`} className="group flex flex-col gap-1.5">
                <h3 className="text-[24px] font-semibold leading-tight tracking-[-0.01em] transition-colors duration-150 group-hover:text-olive">{p.title}</h3>
                <p className="max-w-[62ch] text-[16px] leading-snug text-ink/75">{p.description}</p>
              </Link>
              <p className="flex gap-4 font-mono text-[14px] leading-relaxed text-graphite tablet:flex-col tablet:items-end tablet:gap-1 tablet:pt-1.5 tablet:text-right">
                <span>{p.dateLabel}</span>
                {p.url && (
                  <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center underline decoration-olive underline-offset-2 hover:text-ink" aria-label={`${p.title} ${linkLabel(p.url).toLowerCase()} (opens in a new tab)`}>
                    {linkLabel(p.url)} ↗
                  </a>
                )}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default Archive;
