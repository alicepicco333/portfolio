import { Fragment, useEffect, useState } from "react";
import { usePrefersReducedMotion, withBase } from "../../utils";
import { BeforeAfterPairs, Cast, DesignSystem, Interviews, UrgencyExplorer } from "./research";
import MethodStrip, { verbOf } from "../Method";

// Long-form case study, rendered when a project in portfolio.json has a `caseStudy` block.
// Every block is optional so the data can grow or shrink without touching this file.

// On wide screens the left column follows the reader: this section's title, then every section,
// with the current one marked. Each section carries its own copy, so no scroll tracking is needed.
function Section({ id, index, title, verb, toc = [], children }) {
  return (
    <section id={id} className="scroll-mt-[132px] grid gap-x-4 gap-y-6 border-t border-ink/15 px-4 py-14 tablet:px-10 laptop:grid-cols-4 laptop:py-[88px]">
      <div className="flex flex-col gap-1 laptop:sticky laptop:top-[140px] laptop:self-start">
        {verb && <MethodStrip current={verb} arrows={false} className="mb-3 hidden text-[12px] laptop:flex" />}
        <span className="fu-meta text-fieldgrey">{index}</span>
        <h2 className="fu-title text-phi1">{title}</h2>
        {toc.length > 4 && (
          // every section repeats the list so it stays beside the reader; only the first copy is a landmark and in the tab order
          <nav aria-label="Case study sections" aria-hidden={id === toc[0].id ? undefined : true} className="mt-6 hidden laptop:block">
            <ol className="flex flex-col border-l border-concrete">
              {toc.map((t) => {
                const here = t.id === id;
                return (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      tabIndex={id === toc[0].id ? undefined : -1}
                      aria-current={here ? "location" : undefined}
                      className={`-ml-px flex gap-2 border-l-2 py-1 pl-3 text-[14px] leading-snug ${here ? "border-olive font-semibold text-ink" : "border-transparent text-graphite hover:text-ink"}`}
                    >
                      <span className="font-mono text-[12px] tabular-nums text-fieldgrey">{t.index}</span>
                      <span className="flex-1">{t.title}</span>
                      {t.verb && <span className={`font-mono text-[12px] ${here ? "text-olive" : "text-fieldgrey"}`}>{verbOf(t.verb)}</span>}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-8 laptop:col-span-3">{children}</div>
    </section>
  );
}

// Long, optional detail stays one click away instead of in the reading path.
function Fold({ label, children }) {
  return (
    <details className="cs-fold group">
      <summary className="fu-btn fu-btn-secondary w-max cursor-pointer list-none">
        <span className="group-open:hidden">Show {label}</span>
        <span className="hidden group-open:inline">Hide {label}</span>
      </summary>
      <div className="mt-8 flex flex-col gap-8">{children}</div>
    </details>
  );
}
const FOLDED = { interviews: "the interviews", cast: "the personas", persona: "the persona", system: "the design system" };
// which step of the method each built block belongs to (reflection and links stand outside it)
const BLOCK_VERB = {
  context: "listening", methods: "listening", interviews: "listening", cast: "listening", persona: "listening",
  findings: "counting", results: "counting", recommendations: "ordering", system: "ordering",
  flows: "shaping", pairs: "shaping", motion: "shaping", beforeAfter: "shaping", prototype: "playing", iterations: "playing",
};

function Lead({ children }) {
  return <p className="max-w-[68ch] text-lg leading-relaxed">{children}</p>;
}

function Figure({ src, alt, caption, className = "" }) {
  return (
    <figure className={`flex flex-col gap-2 ${className}`}>
      <a href={withBase(src)} target="_blank" rel="noreferrer" className="block overflow-hidden bg-paper">
        <img src={withBase(src)} alt={alt} loading="lazy" className="h-auto w-full" />
      </a>
      {caption && <figcaption className="fu-meta text-fieldgrey">{caption}</figcaption>}
    </figure>
  );
}

function Scale({ value, label }) {
  return (
    <span className="flex items-center gap-2" role="img" aria-label={`${label} ${value} out of 5`}>
      <span className="fu-meta w-[72px] text-fieldgrey">{label}</span>
      <span className="flex gap-[3px]" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`h-3 w-3 ${n <= value ? "bg-ink" : "bg-concrete"}`} />
        ))}
      </span>
    </span>
  );
}

function PhoneVideo({ src, poster, caption }) {
  const reduced = usePrefersReducedMotion();
  return (
    <figure className="flex flex-col items-center gap-3">
      <div className="w-full max-w-[260px] overflow-hidden rounded-[40px] border-[10px] border-ink bg-ink">
        <video
          key={reduced ? "static" : "motion"}
          src={withBase(src)}
          poster={withBase(poster)}
          className="block h-auto w-full rounded-[30px]"
          muted
          loop
          playsInline
          autoPlay={!reduced}
          controls={reduced}
          preload="metadata"
        />
      </div>
      <figcaption className="fu-meta max-w-[260px] text-center text-fieldgrey">{caption}</figcaption>
    </figure>
  );
}

// The Figma embed is heavy, so it only loads after an explicit click.
function PrototypeEmbed({ src, poster }) {
  const [active, setActive] = useState(false);
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden border border-ink bg-paper tablet:aspect-[16/10]">
      {active ? (
        <iframe title="Unobravo interactive prototype" src={src} className="h-full w-full" allowFullScreen />
      ) : (
        <button type="button" onClick={() => setActive(true)} className="group block h-full w-full">
          {poster && <img src={withBase(poster)} alt="" className="h-full w-full object-cover" loading="lazy" />}
          <span className="fu-btn fu-btn-primary absolute bottom-6 left-6 group-hover:bg-olive">
            Load the interactive prototype ▶
          </span>
        </button>
      )}
    </div>
  );
}

// Generic, data-driven section used by research case studies (e.g. The Meme Ontology).
// kind: "cards" (numbered text cards) · "figures" (screens with captions) · "phones" · "list" · "text"
function FlexibleSection({ id, index, toc, section }) {
  const { title, lead, kind = "text", items = [], columns = 2, note, verb } = section;
  return (
    <Section id={id} index={index} title={title} verb={verb} toc={toc}>
      {lead && <Lead>{lead}</Lead>}
      {kind === "cards" && (
        <div className={`grid gap-4 tablet:grid-cols-2 ${columns === 3 ? "laptop:grid-cols-3" : ""}`}>
          {items.map((c) => (
            <div key={c.title} className="flex flex-col gap-2 bg-paper p-5">
              {c.meta && <span className="fu-meta text-fieldgrey">{c.meta}</span>}
              <h3 className="fu-title text-xl">{c.title}</h3>
              <p className="text-[16px] leading-relaxed text-graphite">{c.text}</p>
            </div>
          ))}
        </div>
      )}
      {kind === "figures" && (
        <div className="grid gap-x-4 gap-y-8 tablet:grid-cols-2">
          {items.map((f) => (
            <Figure key={f.src} {...f} className={f.wide ? "tablet:col-span-2" : ""} />
          ))}
        </div>
      )}
      {kind === "phones" && (
        <div className="grid grid-cols-2 gap-4 tablet:grid-cols-4">
          {items.map((f) => (
            <figure key={f.src} className="flex flex-col gap-2">
              <div className="overflow-hidden rounded-[28px] border-[8px] border-ink bg-ink">
                <img src={withBase(f.src)} alt={f.alt} loading="lazy" className="block h-auto w-full rounded-[20px]" />
              </div>
              {f.caption && <figcaption className="fu-meta text-fieldgrey">{f.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
      {kind === "list" && (
        <ol className="flex max-w-[820px] flex-col">
          {items.map((it, i) => (
            <li key={it.title} className="grid gap-2 py-4 tablet:grid-cols-[56px_1fr] tablet:gap-4">
              <span className="fu-meta pt-1 text-fieldgrey">{it.id || String(i + 1).padStart(2, "0")}</span>
              <div className="flex flex-col gap-1">
                <span className="text-lg font-semibold leading-snug">{it.title}</span>
                <span className="text-[16px] leading-relaxed text-graphite">{it.text}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
      {kind === "text" && (
        <div className="flex max-w-[68ch] flex-col gap-4 text-lg leading-relaxed">
          {items.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      )}
      {note && <p className="max-w-[720px] border-l-2 border-olive pl-4 text-[16px] leading-snug text-graphite">{note}</p>}
    </Section>
  );
}

// With `views` in the data, design comes first and a switcher lets readers show only design or research.
const VIEW_LABELS = { all: "Everything", design: "Design", research: "Research" };

function ViewSwitcher({ view, setView, views }) {
  return (
    <div className="sticky top-[65px] z-20 border-b border-ink/15 bg-bone/95 px-4 py-3 backdrop-blur tablet:px-10">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="fu-meta text-fieldgrey" id="cs-view-label">
          Show
        </span>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="cs-view-label">
          {["all", "design", "research"].map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`fu-btn ${view === v ? "fu-btn-primary" : "fu-btn-secondary"}`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
        {views?.[view] && <span className="text-[14px] text-graphite">{views[view]}</span>}
      </div>
    </div>
  );
}

function PartHeader({ part, title, text }) {
  return (
    <div className="bg-ink px-4 py-10 text-bone tablet:px-10">
      <span className="fu-meta text-bone/70">{part}</span>
      <h2 className="fu-display mt-1 text-[40px] leading-none tablet:text-phi2">{title}</h2>
      {text && <p className="mt-3 max-w-[640px] text-[18px] leading-relaxed text-bone/80">{text}</p>}
    </div>
  );
}

export default function CaseStudy({ data, showStats = true }) {
  const {
    stats = [],
    overview = [],
    context,
    methods = [],
    interviews,
    cast,
    persona,
    issues = [],
    urgency = [],
    recommendations = [],
    iterations = [],
    beforeAfter = [],
    flows = [],
    motion = [],
    prototype,
    system,
    results,
    reflection = [],
    sections = [],
    links = [],
    views,
    beforeAfterPairs,
  } = data;

  const [view, setViewState] = useState("all");
  useEffect(() => {
    if (!views) return undefined;
    const read = () => {
      const h = window.location.hash.replace("#", "");
      setViewState(h === "design" || h === "research" ? h : "all");
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [views]);
  const setView = (v) => {
    setViewState(v);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", v === "all" ? window.location.pathname : `#${v}`);
    }
  };

  // Each block: [group, show?, title, render]. group is "design", "research" or "always".
  const blocks = {
    context: ["always", overview.length > 0 || context, "Context", () => (
      <>
        {context?.text && <Lead>{context.text}</Lead>}
        {overview.length > 0 && (
          <dl className="grid max-w-[720px] gap-x-4 gap-y-2 pt-2 text-[16px] tablet:grid-cols-[160px_1fr]">
            {overview.map((row) => (
              <div key={row.label} className="contents">
                <dt className="text-fieldgrey">{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {context?.goals && (
          <div className="grid gap-4 tablet:grid-cols-2">
            {context.goals.map((g) => (
              <div key={g.title} className="bg-paper p-5">
                <h3 className="fu-title mb-2 text-xl">{g.title}</h3>
                <p className="text-[16px] leading-relaxed text-graphite">{g.text}</p>
              </div>
            ))}
          </div>
        )}
      </>
    )],
    methods: ["research", methods.length > 0, "Research", () => (
      <div className="grid gap-4 tablet:grid-cols-2">
        {methods.map((m) => (
          <div key={m.title} className="flex flex-col gap-2">
            <span className="fu-meta text-fieldgrey">{m.meta}</span>
            <h3 className="fu-title text-xl">{m.title}</h3>
            <p className="text-[16px] leading-relaxed text-graphite">{m.text}</p>
          </div>
        ))}
      </div>
    )],
    interviews: ["research", interviews, "Interviews", () => <Interviews data={interviews} />],
    cast: ["research", cast, "Cast and personas", () => <Cast data={cast} />],
    persona: ["research", persona && !cast, "Persona", () => (
      <div className="grid gap-6 bg-paper p-6 tablet:grid-cols-[1fr_1.4fr] tablet:p-8">
        <div className="flex flex-col gap-3">
          <span className="fu-meta text-fieldgrey">{persona.segment}</span>
          <h3 className="fu-display text-[40px]">{persona.name}</h3>
          <p className="text-[16px] text-graphite">{persona.facts}</p>
          <blockquote className="-indent-[0.42em] text-xl leading-snug">“{persona.quote}”</blockquote>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-[16px] leading-relaxed">{persona.story}</p>
          <ul className="flex flex-col gap-2 text-[16px]">
            {persona.needs.map((need) => (
              <li key={need} className="flex gap-2">
                <span aria-hidden="true">→</span>
                <span>{need}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )],
    findings: ["research", (!Array.isArray(urgency) && urgency.versions) || (Array.isArray(urgency) && issues.length > 0), "Findings", () =>
      !Array.isArray(urgency) ? (
        <UrgencyExplorer data={urgency} />
      ) : (
        <>
          <Lead>
            Assessment, expert review and preliminary testing surfaced nine usability issues, each scored for impact
            and persistence (1-5).
          </Lead>
          <ol className="flex flex-col">
            {issues.map((issue) => (
              <li key={issue.id} className="grid gap-2 py-4 tablet:grid-cols-[56px_1fr_auto] tablet:gap-4">
                <span className="fu-meta pt-1 text-fieldgrey">{issue.id}</span>
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-semibold leading-snug">{issue.title}</span>
                  <span className="text-[16px] leading-relaxed text-graphite">{issue.evidence}</span>
                </div>
                <div className="flex flex-col gap-1 pt-1">
                  <Scale value={issue.impact} label="Impact" />
                  <Scale value={issue.persistence} label="Persistence" />
                </div>
              </li>
            ))}
          </ol>
          {urgency.length > 0 && (
            <div className="grid gap-4 tablet:grid-cols-2">
              {urgency.map((u) => (
                <Figure key={u.src} {...u} />
              ))}
            </div>
          )}
        </>
      ),
    ],
    recommendations: ["research", recommendations.length > 0, "Design principles", () => (
      <div className="grid gap-4 tablet:grid-cols-2">
        {recommendations.map((r) => (
          <div key={r.id} className="flex flex-col gap-2 bg-paper p-5">
            <span className="fu-meta text-fieldgrey">
              {r.id} · addresses {r.addresses}
            </span>
            <h3 className="fu-title text-xl">{r.title}</h3>
            <p className="text-[16px] leading-relaxed text-graphite">{r.text}</p>
          </div>
        ))}
      </div>
    )],
    iterations: ["research", iterations.length > 0, "Iterations", () => (
      <ol className="grid gap-4 tablet:grid-cols-3">
        {iterations.map((it) => (
          <li key={it.name} className="flex flex-col gap-2">
            <span className="fu-meta text-fieldgrey">{it.date}</span>
            <h3 className="fu-title text-xl">{it.name}</h3>
            <span className="text-[16px] font-medium">{it.evaluation}</span>
            <p className="text-[16px] leading-relaxed text-graphite">{it.text}</p>
          </li>
        ))}
      </ol>
    )],
    beforeAfter: ["research", beforeAfter.length > 0, "Before & after", () => (
      <>
        <Lead>Each board traces one screen from the original product through ver0, ver1 and the final version.</Lead>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 tablet:mx-0 tablet:px-0">
          {beforeAfter.map((b) => (
            <Figure key={b.src} {...b} className="w-[82%] shrink-0 snap-start tablet:w-[46%]" />
          ))}
        </div>
      </>
    )],
    flows: ["design", flows.length > 0, "Final design", () => (
      <>
        <Lead>{data.flowsLead || "86 screens across seven flows, built from 34 components and 34 design tokens."}</Lead>
        {flows.map((f) => (
          <Figure key={f.src} {...f} />
        ))}
      </>
    )],
    pairs: ["design", beforeAfterPairs, "Before & after", () => <BeforeAfterPairs data={beforeAfterPairs} />],
    motion: ["design", motion.length > 0, "Motion", () => (
      <>
        <Lead>
          Motion makes the app feel alive without raising the pulse. The figures in every illustration sway on a slow
          loop, every screen rises in with a short stagger, and moments that ask something of the user are acknowledged:
          booking the first session ends with a check that springs in, and each finished questionnaire section blooms
          one more petal until the Unobravo mark is whole. In the prototype, screens
          morph into each other with gentle springs, the tab bar pill slides between tabs and answers pop when chosen.
        </Lead>
        <div className={`grid gap-8 tablet:grid-cols-2 ${motion.length === 4 ? "laptop:grid-cols-4" : "laptop:grid-cols-3"}`}>
          {motion.map((m) => (
            <PhoneVideo key={m.src} {...m} />
          ))}
        </div>
      </>
    )],
    prototype: ["design", prototype, "Prototype", () => (
      <>
        <Lead>{prototype.text}</Lead>
        {prototype.embed && <PrototypeEmbed src={prototype.embed} poster={prototype.poster} />}
        {prototype.url && (
          <a href={prototype.url} target="_blank" rel="noreferrer" className="fu-btn fu-btn-primary self-start">
            Open the prototype in Figma ↗
          </a>
        )}
      </>
    )],
    system: ["design", system, "Design system", () =>
      system.images ? (
        <>
          <Lead>{system.text}</Lead>
          <div className="grid gap-4 tablet:grid-cols-2">
            {system.images.map((img, i) => (
              <Figure key={img.src} {...img} className={i === 0 ? "tablet:col-span-2" : ""} />
            ))}
          </div>
        </>
      ) : (
        <DesignSystem data={system} />
      ),
    ],
    results: ["research", results, "Results", () => (
      <>
        <Lead>{results.text}</Lead>
        <div className="flex max-w-[720px] flex-col gap-3">
          {results.sus.map((s) => (
            <div key={s.label} className="grid grid-cols-[140px_1fr_56px] items-center gap-3 text-[16px]">
              <span className="text-fieldgrey">{s.label}</span>
              <span className="h-4 bg-concrete">
                <span className="block h-full bg-ink" style={{ width: `${s.value}%` }} />
              </span>
              <span className="text-right font-semibold">{s.value}</span>
            </div>
          ))}
          <span className="fu-meta text-fieldgrey">System Usability Scale, 0-100</span>
        </div>
        <div className="max-w-[720px] overflow-x-auto">
          <table className="w-full text-left text-[16px]">
            <thead>
              <tr className="border-b border-ink">
                <th className="py-2 pr-4 font-medium text-fieldgrey">Task (final version)</th>
                <th className="py-2 pr-4 font-medium text-fieldgrey">Avg time</th>
                <th className="py-2 pr-4 font-medium text-fieldgrey">Success</th>
                <th className="py-2 font-medium text-fieldgrey">Errors</th>
              </tr>
            </thead>
            <tbody>
              {results.tasks.map((t) => (
                <tr key={t.task} className="border-b border-ink/10">
                  <td className="py-2 pr-4">{t.task}</td>
                  <td className="py-2 pr-4">{t.time}</td>
                  <td className="py-2 pr-4">{t.success}</td>
                  <td className="py-2">{t.errors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )],
    reflection: ["always", reflection.length > 0, "Reflection", () => (
      <div className="flex max-w-[68ch] flex-col gap-4 text-lg leading-relaxed">
        {reflection.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    )],
    links: ["always", links.length > 0, "Explore", () => (
      <div className="flex flex-wrap gap-3">
        {links.map((l, i) => (
          <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className={`fu-btn ${i === 0 ? "fu-btn-primary" : ""}`}>
            {l.label} ↗
          </a>
        ))}
      </div>
    )],
  };

  const DEFAULT_ORDER = ["context", "methods", "interviews", "cast", "persona", "findings", "recommendations", "iterations",
    "beforeAfter", "flows", "pairs", "motion", "prototype", "system", "results", "reflection", "links"];
  const DESIGN_FIRST = ["context", "flows", "pairs", "motion", "prototype", "system", "methods", "interviews", "cast", "persona",
    "findings", "recommendations", "iterations", "beforeAfter", "results", "reflection", "links"];
  const order = (views ? DESIGN_FIRST : DEFAULT_ORDER).filter((k) => blocks[k][1]);
  const visible = order.filter((k) => view === "all" || blocks[k][0] === "always" || blocks[k][0] === view);
  const firstOf = (group) => visible.find((k) => blocks[k][0] === group);

  let n = 0;
  const next = () => String(++n).padStart(2, "0");
  // the contents list, in reading order: built blocks, with the free-form sections after "context"
  const slug = (t) => `cs-${t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  const toc = [];
  const tocAdd = (title, verb) => toc.push({ id: slug(title), index: String(toc.length + 1).padStart(2, "0"), title, verb });
  if (!visible.includes("context")) sections.forEach((sec) => tocAdd(sec.title, sec.verb));
  visible.forEach((k) => {
    tocAdd(blocks[k][2], BLOCK_VERB[k]);
    if (k === "context") sections.forEach((sec) => tocAdd(sec.title, sec.verb));
  });
  const renderBlock = (k) => (
    <Section key={k} id={slug(blocks[k][2])} index={next()} title={blocks[k][2]} verb={BLOCK_VERB[k]} toc={FOLDED[k] ? [] : toc}>
      {FOLDED[k] ? <Fold label={FOLDED[k]}>{blocks[k][3]()}</Fold> : blocks[k][3]()}
    </Section>
  );

  const flexible = () => sections.map((section) => <FlexibleSection key={section.title} id={slug(section.title)} toc={toc} index={next()} section={section} />);

  return (
    <div>
      {showStats && stats.length > 0 && (
        <section className="grid grid-cols-2 gap-x-4 gap-y-8 px-4 py-14 tablet:px-10 laptop:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-2">
              <span className="fu-display text-[48px] tabular-nums tablet:text-phi3">{s.value}</span>
              <span className="max-w-[240px] text-[16px] leading-snug text-graphite">{s.label}</span>
            </div>
          ))}
        </section>
      )}

      {views && <ViewSwitcher view={view} setView={setView} views={views} />}

      {!visible.includes("context") && flexible()}

      {visible.map((k) => {
        const group = blocks[k][0];
        const header =
          views && view === "all" && group !== "always" && firstOf(group) === k ? (
            <PartHeader key={`part-${group}`} {...views.parts[group]} />
          ) : null;
        return (
          <Fragment key={k}>
            {header}
            {renderBlock(k)}
            {k === "context" && flexible()}
          </Fragment>
        );
      })}
    </div>
  );
}
