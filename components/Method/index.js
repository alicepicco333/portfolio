import React from "react";
import { skillsOfProject, clusterOf } from "../Graph/data";

// The five verbs read as a method: the order work moves through, not only a set of skill groups.
export const METHOD = [
  ["listening", "listen"],
  ["ordering", "order"],
  ["counting", "count"],
  ["shaping", "shape"],
  ["playing", "play"],
];
export const verbOf = (id) => (METHOD.find(([k]) => k === id) || [])[1];

// the steps a project used, from the clusters of its skills
export const stepsOf = (projectId) => [...new Set(skillsOfProject(projectId).map((n) => clusterOf(n.id)?.id).filter(Boolean))];

// used: steps this work involved; current: the step being read now (case-study sections)
const MethodStrip = ({ used = [], current = null, arrows = true, className = "" }) => {
  const named = METHOD.filter(([k]) => used.includes(k) || k === current).map(([, v]) => v);
  const label = current ? `Method step: ${verbOf(current)}` : `Method: ${named.join(", ")}`;
  return (
    <p className={`flex flex-wrap items-center gap-y-1 font-mono text-[14px] ${arrows ? "gap-x-3" : "gap-x-2.5"} ${className}`} aria-label={label}>
      {METHOD.map(([k, verb], i) => {
        const here = current === k;
        const on = here || (!current && used.includes(k));
        return (
          <React.Fragment key={k}>
            {arrows && i > 0 && (
              <span aria-hidden="true" className="text-concrete">
                →
              </span>
            )}
            <span aria-hidden="true" className={`flex items-center gap-1.5 ${here ? "font-semibold text-olive" : on ? "text-ink" : "text-graphite/70"}`}>
              <span className={`inline-block h-2 w-2 ${on ? "bg-current" : "border border-current"}`} />
              {verb}
            </span>
          </React.Fragment>
        );
      })}
    </p>
  );
};

export default MethodStrip;
