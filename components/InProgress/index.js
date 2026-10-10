import React from "react";
import Link from "next/link";
import { labelOf, skillsOfProject } from "../Graph/data";

const skillIds = (id) => skillsOfProject(id).map((n) => n.id);

// Work that is still happening, in the same index as Selected work: the title between ink rules,
// when it started, and that the write-up is still to come.
const InProgress = ({ projects }) => {
  if (!projects.length) return null;

  return (
    <section id="in-progress" aria-labelledby="wip-title" className="scroll-mt-16 border-t border-ink px-4 py-16 fu-gutter tablet:py-24">
      <div className="flex flex-col gap-12">
        <h2 id="wip-title" className="fu-section-title">
          In progress
        </h2>
        <ol className="border-b border-ink/15 laptop:w-7/12">
          {projects.map((p) => (
            <li key={p.id} className="border-t border-ink/15 first:border-ink">
              <Link href={`/projects/${p.id}`} className="group grid gap-x-6 gap-y-2 py-5 laptop:grid-cols-[1fr_auto] laptop:py-6">
                <h3 className="fu-display text-[34px] leading-[1.04] transition-colors duration-150 group-hover:text-olive tablet:text-phi2">{p.title.split(" - ")[0]}</h3>
                <span className="font-mono text-[14px] leading-relaxed text-graphite laptop:row-span-2 laptop:pt-2 laptop:text-right">
                  Started {(p.date || "").slice(0, 4)}
                  <span className="block">write-up to come</span>
                </span>
                <p className="max-w-[60ch] text-[18px] leading-snug text-ink/80">{p.description}</p>
                <p className="font-mono text-[14px] leading-relaxed text-graphite">{skillIds(p.id).map(labelOf).join(", ")}</p>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default InProgress;
