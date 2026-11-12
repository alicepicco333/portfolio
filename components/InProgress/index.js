import React from "react";
import Link from "next/link";
import { labelOf, skillsOfProject } from "../Graph/data";

const skillIds = (id) => skillsOfProject(id).map((n) => n.id);

// Work that is still happening, quieter than Selected work and laid out like the Archive: the heading in its
// own column, then one ruled row per project with the title, one line, its skills, and when it started.
const InProgress = ({ projects }) => {
  if (!projects.length) return null;

  return (
    <section id="in-progress" aria-labelledby="wip-title" className="scroll-mt-16 px-4 py-16 fu-gutter tablet:py-24">
      <div className="grid gap-x-8 gap-y-8 laptop:grid-cols-4">
        <h2 id="wip-title" className="fu-section-title">
          In progress
        </h2>
        <ol className="laptop:col-span-3 laptop:pt-3">
          {projects.map((p) => (
            <li key={p.id} className="border-t border-ink/15 first:border-t-0">
              <Link href={`/projects/${p.id}`} className="group grid gap-x-6 gap-y-2 py-5 tablet:grid-cols-[minmax(0,1fr)_auto]">
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] transition-colors duration-150 group-hover:text-olive">{p.title.split(" - ")[0]}</h3>
                  <p className="max-w-[62ch] text-[16px] leading-snug text-ink/75">{p.description}</p>
                  <p className="font-mono text-[14px] leading-relaxed text-graphite">{skillIds(p.id).map(labelOf).join(", ")}</p>
                </div>
                <span className="font-mono text-[14px] leading-relaxed text-graphite tablet:pt-2 tablet:text-right">Started {(p.date || "").slice(0, 4)}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default InProgress;
