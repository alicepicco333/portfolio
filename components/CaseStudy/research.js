import { useState } from "react";
import Head from "next/head";
import { usePrefersReducedMotion, withBase } from "../../utils";

// Interactive research blocks for the long-form case study: interviews, cast with
// personality radars, the urgency curve explorer and a native design-system specimen.

const PERSONA_COLORS = {
  luca: "rgb(var(--olive))",
  giulia: "#1d4ed8",
  alessandro: "#047857",
  sara: "#7e22ce",
  chiara: "#b45309",
  marco: "#0e0e10",
  antonio: "#0e7490",
  paola: "#be185d",
};
const colorOf = (id) => PERSONA_COLORS[id] || "rgb(var(--ink))";

function SubHead({ children, meta }) {
  return (
    <div className="flex flex-col gap-1">
      {meta && <span className="fu-meta text-fieldgrey">{meta}</span>}
      <h3 className="fu-title text-2xl">{children}</h3>
    </div>
  );
}

/* ───────────────────────── Interviews ───────────────────────── */

export function Interviews({ data }) {
  const { lead, segments = [], quotes = [], quotesNote, themes = [] } = data;
  const [quote, setQuote] = useState(0);
  const q = quotes[quote];
  return (
    <>
      {lead && <p className="max-w-[68ch] text-lg leading-relaxed">{lead}</p>}

      <div className="grid gap-4 laptop:grid-cols-3">
        {segments.map((s) => (
          <article key={s.segment} className="flex flex-col gap-4 bg-paper p-5">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="fu-meta text-fieldgrey">{s.stage}</span>
                <h3 className="fu-title text-xl">{s.segment}</h3>
              </div>
              <span className="fu-display text-[40px] leading-none" aria-label={`${s.count} interviews`}>
                {s.count}
              </span>
            </div>
            <ul className="flex flex-col gap-2 text-[14px] leading-snug text-graphite">
              {s.people.map((p) => (
                <li key={p} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[7px] h-[6px] w-[6px] shrink-0 rounded-full bg-concrete" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-auto flex flex-col gap-2 pt-3 text-[16px] leading-snug">
              {s.findings.map((f) => (
                <li key={f} className="flex gap-2">
                  <span aria-hidden="true" className="text-olive">→</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {q && (
        <figure className="flex flex-col gap-4">
          <blockquote aria-live="polite" className="max-w-[760px] -indent-[0.42em] text-2xl leading-snug tablet:text-[28px]">
            “{q.text}”
          </blockquote>
          <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <span className="fu-meta text-fieldgrey">
              {q.who}
              {quotesNote ? ` · ${quotesNote}` : ""}
            </span>
            <span className="flex gap-2" role="group" aria-label="Choose a quote">
              {quotes.map((item, i) => (
                <button
                  key={item.text}
                  type="button"
                  onClick={() => setQuote(i)}
                  aria-pressed={i === quote}
                  aria-label={`Quote ${i + 1} of ${quotes.length}, ${item.who}`}
                  className={`h-8 w-8 border border-ink text-[14px] font-medium ${
                    i === quote ? "bg-ink text-bone" : "hover:bg-paper"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </span>
          </figcaption>
        </figure>
      )}

      {themes.length > 0 && (
        <div className="flex flex-col gap-4">
          <SubHead meta="Across all eight interviews">What we heard, and what it changed</SubHead>
          <ol className="grid gap-x-6 gap-y-6 tablet:grid-cols-2 laptop:grid-cols-3">
            {themes.map((t, i) => (
              <li key={t.title} className="flex flex-col gap-2">
                <span className="fu-meta text-fieldgrey">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-lg font-semibold leading-snug">{t.title}</span>
                <span className="text-[16px] leading-relaxed text-graphite">{t.text}</span>
                <span className="mt-1 pt-2 text-[14px] leading-snug">
                  <span className="font-semibold text-olive">Design → </span>
                  {t.design}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}

/* ───────────────────────── Radar ───────────────────────── */

const polar = (cx, cy, r, i, n) => {
  const a = (-90 + (360 / n) * i) * (Math.PI / 180);
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

function Radar({ traits, series, size = 320, labels = true, max = 5, title, className = "" }) {
  const n = traits.length;
  const pad = labels ? 78 : 10;
  const R = size / 2 - pad;
  const c = size / 2;
  const ring = (v) => traits.map((_, i) => polar(c, c, (R * v) / max, i, n).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={`h-auto w-full overflow-visible ${className}`} role="img" aria-label={title}>
      {[1, 2, 3, 4, 5].map((v) => (
        <polygon key={v} points={ring(v)} fill="none" stroke="rgb(var(--concrete))" strokeWidth={v === 5 ? 1.2 : 0.8} />
      ))}
      {traits.map((t, i) => {
        const [x, y] = polar(c, c, R, i, n);
        return <line key={t} x1={c} y1={c} x2={x} y2={y} stroke="rgb(var(--concrete))" strokeWidth="0.8" />;
      })}
      {series.map((s) => (
        <polygon
          key={s.id}
          points={s.scores.map((v, i) => polar(c, c, (R * v) / max, i, n).join(",")).join(" ")}
          fill={s.fill ? s.color : "none"}
          fillOpacity={s.fill ? 0.16 : 0}
          stroke={s.color}
          strokeWidth={s.width || 2}
          strokeDasharray={s.dashed ? "4 4" : undefined}
          strokeLinejoin="round"
          opacity={s.dim ? 0.12 : 1}
          style={{ transition: "opacity 200ms ease" }}
        />
      ))}
      {series
        .filter((s) => s.dots)
        .map((s) =>
          s.scores.map((v, i) => {
            const [x, y] = polar(c, c, (R * v) / max, i, n);
            return <circle key={`${s.id}-${i}`} cx={x} cy={y} r="3.5" fill={s.color} />;
          })
        )}
      {labels &&
        traits.map((t, i) => {
          const [x, y] = polar(c, c, R + 14, i, n);
          const anchor = Math.abs(x - c) < 4 ? "middle" : x > c ? "start" : "end";
          return (
            <text key={t} x={x} y={y} dy={y < c - 4 ? -2 : y > c + 4 ? 12 : 4} textAnchor={anchor} fontSize="12" fill="rgb(var(--graphite))">
              {t}
            </text>
          );
        })}
    </svg>
  );
}

const scoreText = (traits, scores) => traits.map((t, i) => `${t} ${scores[i]}`).join(", ");

/* ───────────────────────── Cast ───────────────────────── */

function Portrait({ src, name, className = "" }) {
  return <img src={withBase(src)} alt={`Portrait of ${name}`} loading="lazy" className={`aspect-square w-full object-cover ${className}`} />;
}

function Protagonist({ m, traits }) {
  return (
    <article className="grid gap-6 bg-paper p-5 tablet:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] tablet:p-8">
      <div className="flex flex-col gap-4">
        <Portrait src={m.photo} name={m.name} />
        <div className="flex flex-col gap-1">
          <span className="fu-meta text-olive">Protagonist · “{m.scenario}”</span>
          <h3 className="fu-display text-[40px] leading-none">{m.name}</h3>
          <span className="text-[16px] text-graphite">
            {m.age}, {m.job}, {m.segment}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <blockquote className="-indent-[0.42em] text-xl leading-snug">“{m.quote}”</blockquote>
        <p className="text-[16px] leading-relaxed">{m.summary}</p>
        {m.useCase && (
          <p className="text-[16px] leading-relaxed text-graphite">
            <span className="font-semibold text-ink">Use case. </span>
            {m.useCase}
          </p>
        )}
        <div className="grid items-center gap-5 pt-4 laptop:grid-cols-[minmax(0,1fr)_240px]">
          <ul className="flex flex-col gap-2 text-[16px]">
            {m.needs.map((need) => (
              <li key={need} className="flex gap-2">
                <span aria-hidden="true" className="text-olive">→</span>
                <span>{need}</span>
              </li>
            ))}
          </ul>
          <Radar
            traits={traits}
            size={300}
            title={`${m.name}'s personality traits: ${scoreText(traits, m.scores)}`}
            series={[{ id: m.id, color: colorOf(m.id), scores: m.scores, fill: true, dots: true, width: 2.5 }]}
            className="mx-auto max-w-[260px]"
          />
        </div>
      </div>
    </article>
  );
}

function CastCard({ m, traits, protagonist, wide = false }) {
  return (
    <article className={`bg-paper p-5 ${wide ? "grid gap-6 tablet:grid-cols-2 tablet:p-8" : "flex flex-col gap-4"}`}>
      <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative w-[88px] shrink-0">
          <Portrait src={m.photo} name={m.name} />
          <span aria-hidden="true" className="absolute bottom-0 left-0 h-1 w-full" style={{ background: colorOf(m.id) }} />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="fu-meta text-fieldgrey">“{m.scenario}”</span>
          <h4 className="text-xl font-semibold leading-tight">
            {m.name.split(" ")[0]}, {m.age}
          </h4>
          <span className="text-[14px] leading-snug text-graphite">{m.job}</span>
        </div>
      </div>
      <span className="fu-meta self-start border border-ink px-2 py-1">{m.segment}</span>
      <blockquote className="text-[18px] leading-snug">“{m.quote}”</blockquote>
      <p className="text-[14px] leading-relaxed text-graphite">{m.summary}</p>
      </div>
      <div
        className={`mt-auto grid items-center gap-3 pt-3 ${
          wide ? "grid-cols-[minmax(0,1fr)_200px] tablet:mt-0 tablet:self-stretch" : "grid-cols-[minmax(0,1fr)_128px]"
        }`}
      >
        <ul className="flex flex-col gap-1 text-[14px] leading-snug">
          {m.needs.map((need) => (
            <li key={need} className="flex gap-2">
              <span aria-hidden="true" className="text-olive">→</span>
              <span>{need}</span>
            </li>
          ))}
        </ul>
        <Radar
          traits={traits}
          size={160}
          labels={false}
          title={`${m.name.split(" ")[0]}'s traits: ${scoreText(traits, m.scores)}. Dashed outline: ${protagonist.name.split(" ")[0]}.`}
          series={[
            { id: protagonist.id, color: "rgb(var(--graphite))", scores: protagonist.scores, dashed: true, width: 1.2 },
            { id: m.id, color: colorOf(m.id), scores: m.scores, fill: true, width: 2 },
          ]}
        />
      </div>
    </article>
  );
}

function CastChart({ members, traits, notes, clusters }) {
  const [hidden, setHidden] = useState([]);
  const [hover, setHover] = useState(null);
  const [cluster, setCluster] = useState(null);
  const inCluster = cluster ? clusters.find((c) => c.label === cluster).ids : null;
  const visible = (id) => !hidden.includes(id) && (!inCluster || inCluster.includes(id));
  const toggle = (id) => {
    setCluster(null);
    setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));
  };
  const series = members
    .filter((m) => visible(m.id))
    .map((m) => ({
      id: m.id,
      color: colorOf(m.id),
      scores: m.scores,
      width: hover === m.id ? 3.5 : 2,
      dim: hover && hover !== m.id,
      fill: hover === m.id,
    }));
  return (
    <div className="grid gap-6 bg-paper p-5 tablet:p-8 laptop:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        <Radar
          traits={traits}
          size={420}
          title="Cumulative chart of personality traits for the whole cast. The same values are listed in the table below."
          series={series}
          className="mx-auto max-w-[460px]"
        />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[14px] text-graphite">
          {traits.map((t) => (
            <div key={t} className="flex gap-1">
              <dt className="font-semibold text-ink">{t}:</dt>
              <dd>{notes[t]}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="fu-meta text-fieldgrey">Show or hide a persona</span>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const on = visible(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(m.id)}
                  onMouseEnter={() => setHover(m.id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(m.id)}
                  onBlur={() => setHover(null)}
                  className={`flex items-center gap-2 border px-3 py-2 text-[14px] ${on ? "border-ink" : "border-concrete text-fieldgrey line-through"}`}
                >
                  <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: on ? colorOf(m.id) : "transparent", border: `2px solid ${colorOf(m.id)}` }} />
                  {m.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="fu-meta text-fieldgrey">Or show a cluster from the cast card</span>
          <div className="flex flex-wrap gap-2">
            {clusters.map((c) => (
              <button
                key={c.label}
                type="button"
                aria-pressed={cluster === c.label}
                onClick={() => {
                  setHidden([]);
                  setCluster(cluster === c.label ? null : c.label);
                }}
                className={`px-3 py-2 text-[14px] ${cluster === c.label ? "bg-ink text-bone" : "bg-bone hover:bg-khaki"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="min-h-[44px] text-[14px] leading-snug text-graphite" aria-live="polite">
            {inCluster
              ? `${cluster}: ${inCluster.map((id) => members.find((m) => m.id === id).name.split(" ")[0]).join(", ")}.`
              : "Hover a name to isolate its shape. The protagonist, Luca, is the outer edge the others fall inside."}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <caption className="sr-only">Personality traits per persona, 1 to 5</caption>
            <thead>
              <tr className="border-b border-ink">
                <th className="py-1 pr-2 font-medium text-fieldgrey">Persona</th>
                {traits.map((t) => (
                  <th key={t} className="px-1 py-1 text-center font-medium text-fieldgrey">
                    <abbr title={t} className="no-underline">
                      {t.slice(0, 4)}
                    </abbr>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr
                  key={m.id}
                  className={`border-b border-ink/10 ${visible(m.id) ? "" : "text-fieldgrey"}`}
                  onMouseEnter={() => setHover(m.id)}
                  onMouseLeave={() => setHover(null)}
                >
                  <th scope="row" className="py-1 pr-2 font-medium">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: colorOf(m.id) }} />
                      {m.name.split(" ")[0]}
                    </span>
                  </th>
                  {m.scores.map((v, i) => (
                    <td key={traits[i]} className="px-1 py-1 text-center tabular-nums">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const ROLE_GROUPS = [
  { role: "Primary", title: "Primary supporting cast", meta: "Close to the target, with a sharper need" },
  { role: "Secondary", title: "Secondary cast", meta: "Further from the target; they test the edges" },
  { role: "Edge case", title: "Edge case", meta: "Acute crisis: the design must not get in the way" },
];

export function Cast({ data }) {
  const { lead, traits, traitNotes = {}, members = [], clusters = [], requirements = [], photoNote } = data;
  const protagonist = members.find((m) => m.role === "Protagonist");
  return (
    <>
      {lead && <p className="max-w-[68ch] text-lg leading-relaxed">{lead}</p>}
      {protagonist && <Protagonist m={protagonist} traits={traits} />}

      {ROLE_GROUPS.map((g) => {
        const group = members.filter((m) => m.role === g.role);
        if (!group.length) return null;
        return (
          <div key={g.role} className="flex flex-col gap-4">
            <SubHead meta={g.meta}>{g.title}</SubHead>
            <div className={`grid gap-4 ${group.length > 1 ? "tablet:grid-cols-2" : ""} ${group.length >= 3 ? "laptop:grid-cols-3" : ""}`}>
              {group.map((m) => (
                <CastCard key={m.id} m={m} traits={traits} protagonist={protagonist} wide={group.length === 1} />
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex flex-col gap-4">
        <SubHead meta="Six traits, rated 1-5">Cumulative chart of personality traits</SubHead>
        <CastChart members={members} traits={traits} notes={traitNotes} clusters={clusters} />
      </div>

      {requirements.length > 0 && (
        <div className="flex flex-col gap-4">
          <SubHead meta="From the cast card">Requirements the cast adds up to</SubHead>
          <ol className="grid gap-x-6 tablet:grid-cols-2">
            {requirements.map((r) => (
              <li key={r.id} className="grid grid-cols-[64px_1fr] gap-2 border-b border-ink/10 py-2 text-[16px]">
                <span className="fu-meta pt-[3px] text-fieldgrey">{r.id}</span>
                <span>{r.title}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {photoNote && <p className="fu-meta text-fieldgrey">{photoNote}</p>}
    </>
  );
}

/* ───────────────────────── Urgency curve ───────────────────────── */

const severity = (i) => {
  const s = i.impact * i.persistence;
  if (i.impact >= 5 && i.persistence >= 4) return "critical";
  if (s >= 12) return "high";
  return "medium";
};
const SEVERITY_LABEL = { critical: "Critical", high: "High", medium: "Medium or low" };

// Points sharing the same score are fanned out horizontally so every one stays clickable.
function layoutPoints(issues) {
  const groups = {};
  issues.forEach((i) => {
    const k = `${i.persistence}|${i.impact}`;
    (groups[k] = groups[k] || []).push(i.id);
  });
  return issues.map((i) => {
    const g = groups[`${i.persistence}|${i.impact}`];
    const k = g.indexOf(i.id);
    const offset = (k - (g.length - 1) / 2) * 0.5;
    return { ...i, x: i.persistence + offset, y: i.impact };
  });
}

export function UrgencyExplorer({ data }) {
  const { lead, versions = [] } = data;
  const reduced = usePrefersReducedMotion();
  const [vKey, setVKey] = useState(versions[0]?.key);
  const [active, setActive] = useState(null);
  const version = versions.find((v) => v.key === vKey) || versions[0];
  if (!version) return null;
  const points = layoutPoints(version.issues);
  // 0–5 is drawn inside a 7% margin so points scored 5 stay inside the frame
  const PAD = 7;
  const u = (v) => PAD + (v / 5) * (100 - 2 * PAD);
  const pct = (v) => `${u(v)}%`;

  const choose = (key) => {
    setVKey(key);
    setActive(null);
  };
  const onTabKey = (e, idx) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = versions[(idx + (e.key === "ArrowRight" ? 1 : versions.length - 1)) % versions.length];
    choose(next.key);
    document.getElementById(`urgency-tab-${next.key}`)?.focus();
  };

  return (
    <div className="flex flex-col gap-5">
      {lead && <p className="max-w-[68ch] text-lg leading-relaxed">{lead}</p>}
      <div role="tablist" aria-label="Design version" className="flex flex-wrap gap-2">
        {versions.map((v, idx) => (
          <button
            key={v.key}
            id={`urgency-tab-${v.key}`}
            role="tab"
            type="button"
            aria-selected={v.key === version.key}
            aria-controls="urgency-panel"
            tabIndex={v.key === version.key ? 0 : -1}
            onClick={() => choose(v.key)}
            onKeyDown={(e) => onTabKey(e, idx)}
            className={`fu-btn ${v.key === version.key ? "fu-btn-primary" : "fu-btn-secondary"}`}
          >
            {v.label} · {v.count} issues
          </button>
        ))}
      </div>

      <div id="urgency-panel" role="tabpanel" aria-labelledby={`urgency-tab-${version.key}`} className="grid gap-6 bg-paper p-5 tablet:p-8 laptop:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-[28px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_28px] gap-1">
            <span className="fu-meta flex items-center justify-center text-fieldgrey [writing-mode:vertical-rl] rotate-180">Impact →</span>
            <div className="relative aspect-square w-full border border-ink bg-bone">
              {/* grid, critical zone and diagonal */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
                <rect x={u(3.5)} y={100 - u(5)} width={u(5) - u(3.5)} height={u(5) - u(3.5)} fill="rgb(var(--olive))" fillOpacity="0.14" />
                {[0, 1, 2, 3, 4, 5].map((v) => (
                  <g key={v}>
                    <line x1={u(v)} y1={100 - u(0)} x2={u(v)} y2={100 - u(5)} stroke="rgb(var(--concrete))" strokeWidth={v === 0 ? 0.6 : 0.3} />
                    <line x1={u(0)} y1={100 - u(v)} x2={u(5)} y2={100 - u(v)} stroke="rgb(var(--concrete))" strokeWidth={v === 0 ? 0.6 : 0.3} />
                  </g>
                ))}
                <line x1={u(0)} y1={100 - u(0)} x2={u(5)} y2={100 - u(5)} stroke="rgb(var(--graphite))" strokeWidth="0.3" strokeDasharray="1.5 1.5" />
              </svg>
              {[1, 2, 3, 4, 5].map((v) => (
                <span key={`y${v}`} aria-hidden="true" className="absolute left-[1.5%] text-[11px] text-fieldgrey" style={{ bottom: pct(v), transform: "translateY(50%)" }}>
                  {v}
                </span>
              ))}
              {[1, 2, 3, 4, 5].map((v) => (
                <span key={`x${v}`} aria-hidden="true" className="absolute bottom-[1%] text-[11px] text-fieldgrey" style={{ left: pct(v), transform: "translateX(-50%)" }}>
                  {v}
                </span>
              ))}
              {points.map((p, i) => {
                const sev = severity(p);
                const on = active === p.id;
                return (
                  <button
                    key={`${version.key}-${p.id}`}
                    type="button"
                    onClick={() => setActive(on ? null : p.id)}
                    onMouseEnter={() => setActive(p.id)}
                    onFocus={() => setActive(p.id)}
                    aria-pressed={on}
                    aria-label={`${p.id}: ${p.title}. Impact ${p.impact}, persistence ${p.persistence}. ${SEVERITY_LABEL[sev]}.`}
                    className={`urgency-point absolute flex h-7 w-7 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full text-[10px] font-semibold tablet:h-8 tablet:w-8 tablet:text-[11px] transition-transform ${
                      sev === "critical" ? "bg-olive text-bone" : sev === "high" ? "bg-ink text-bone" : "border-2 border-ink bg-bone text-ink"
                    } ${on ? "z-10 scale-125 ring-2 ring-ink ring-offset-2 ring-offset-bone" : ""}`}
                    style={{ left: pct(p.x), bottom: pct(p.y), animationDelay: reduced ? "0ms" : `${i * 60}ms` }}
                  >
                    {p.id.replace("I0", "")}
                  </button>
                );
              })}
            </div>
            <span />
            <span className="fu-meta flex items-center justify-center text-fieldgrey">Persistence →</span>
          </div>
          <div className="flex flex-wrap gap-4 text-[14px] text-graphite">
            <span className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 rounded-full bg-olive" /> Critical</span>
            <span className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 rounded-full bg-ink" /> High</span>
            <span className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 rounded-full border-2 border-ink" /> Medium or low</span>
            <span className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-4 bg-olive/20" /> Top-priority zone (both ≥ 3.5)</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-[16px] leading-relaxed">{version.note}</p>
          <ol className="flex flex-col border-t border-ink/15">
            {version.issues.map((i) => {
              const on = active === i.id;
              return (
                <li key={i.id} className="border-b border-ink/10">
                  <button
                    type="button"
                    onClick={() => setActive(on ? null : i.id)}
                    onMouseEnter={() => setActive(i.id)}
                    aria-expanded={on}
                    className={`grid w-full grid-cols-[40px_1fr_auto] items-baseline gap-2 py-2 text-left text-[14px] ${on ? "font-semibold" : ""}`}
                  >
                    <span className={`fu-meta ${severity(i) === "critical" ? "text-olive" : "text-fieldgrey"}`}>{i.id}</span>
                    <span className="leading-snug">{i.title}</span>
                    <span className="fu-meta whitespace-nowrap tabular-nums text-fieldgrey">
                      {i.impact} / {i.persistence}
                    </span>
                  </button>
                  {on && (
                    <p className="pb-3 pl-[48px] text-[14px] leading-relaxed text-graphite">
                      Impact {i.impact} / 5 · persistence {i.persistence} / 5 · {SEVERITY_LABEL[severity(i)]}
                      {i.evidence ? <><br />{i.evidence}</> : null}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
          <span className="fu-meta text-fieldgrey">Scores: impact / persistence, 1-5. Select an issue for details.</span>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Before & after ───────────────────────── */

function Phone({ src, alt }) {
  return (
    <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-[30px] border-[7px] border-ink bg-ink">
      <img src={withBase(src)} alt={alt} loading="lazy" className="block aspect-[393/852] h-auto w-full rounded-[23px] object-cover object-top" />
    </div>
  );
}

export function BeforeAfterPairs({ data }) {
  const { lead, pairs = [], path = "" } = data;
  const [i, setI] = useState(0);
  if (!pairs.length) return null;
  const p = pairs[i];
  const go = (n) => setI((n + pairs.length) % pairs.length);
  const onKey = (e, idx) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const n = (idx + (e.key === "ArrowRight" ? 1 : pairs.length - 1)) % pairs.length;
    go(n);
    document.getElementById(`ba-tab-${pairs[n].key}`)?.focus();
  };
  return (
    <div className="flex flex-col gap-5">
      {lead && <p className="max-w-[68ch] text-lg leading-relaxed">{lead}</p>}
      <div role="tablist" aria-label="Screen" className="flex flex-wrap gap-2">
        {pairs.map((pair, idx) => (
          <button
            key={pair.key}
            id={`ba-tab-${pair.key}`}
            role="tab"
            type="button"
            aria-selected={idx === i}
            aria-controls="ba-panel"
            tabIndex={idx === i ? 0 : -1}
            onClick={() => go(idx)}
            onKeyDown={(e) => onKey(e, idx)}
            className={`px-3 py-2 text-[14px] ${idx === i ? "bg-ink text-bone" : "bg-paper hover:bg-khaki"}`}
          >
            {pair.label}
          </button>
        ))}
      </div>
      <div id="ba-panel" role="tabpanel" aria-labelledby={`ba-tab-${p.key}`} className="bg-paper p-4 tablet:p-8">
        <div className="grid grid-cols-2 gap-4 tablet:gap-10">
          {[
            ["before", "Before · original app", p.before],
            ["after", "After · redesign", p.after],
          ].map(([kind, label, note]) => (
            <figure key={kind} className="flex flex-col gap-3">
              <span className={`fu-meta ${kind === "after" ? "text-olive" : "text-fieldgrey"}`}>{label}</span>
              <Phone src={`${path}${kind}-${p.key}.jpg`} alt={`${p.label}, ${kind === "before" ? "original app" : "redesign"}`} />
              <figcaption className="text-[14px] leading-snug text-graphite tablet:text-[16px]">{note}</figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4">
          <span className="fu-meta text-fieldgrey">
            {i + 1} / {pairs.length} · answers {p.issues}
          </span>
          <span className="flex gap-2">
            <button type="button" onClick={() => go(i - 1)} className="fu-btn fu-btn-secondary" aria-label="Previous screen">
              ← Previous
            </button>
            <button type="button" onClick={() => go(i + 1)} className="fu-btn fu-btn-primary" aria-label="Next screen">
              Next →
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Design system ───────────────────────── */

const hexOf = (primitives, name) => primitives.find((p) => p.name === name)?.hex;

export function DesignSystem({ data }) {
  const { text, stats = [], primitives = [], semantic = [], pairs = [], type = [], spacing = [], radius = [], tiles = [], illustrations } = data;
  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap" rel="stylesheet" />
      </Head>
      {text && <p className="max-w-[68ch] text-lg leading-relaxed">{text}</p>}
      {stats.length > 0 && (
        <dl className="grid grid-cols-2 gap-4 tablet:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse gap-1">
              <dt className="text-[16px] text-graphite">{s.label}</dt>
              <dd className="fu-display text-[48px] leading-none">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {primitives.length > 0 && (
        <div className="flex flex-col gap-4">
          <SubHead meta={`${primitives.length} primitives → ${semantic.reduce((n, g) => n + g.tokens.length, 0)} semantic tokens`}>Colour</SubHead>
          <ul className="grid grid-cols-5 gap-2 laptop:grid-cols-10">
            {primitives.map((p) => (
              <li key={p.name} className="flex flex-col gap-1">
                <span className="block aspect-[4/3] w-full border border-ink/10" style={{ background: p.hex }} />
                <span className="text-[12px] font-medium leading-tight">{p.name}</span>
                <span className="font-mono text-[12px] text-fieldgrey">{p.hex}</span>
              </li>
            ))}
          </ul>
          <div className="grid gap-4 bg-paper p-5 tablet:grid-cols-3">
            {semantic.map((g) => (
              <div key={g.group} className="flex flex-col gap-2">
                <span className="fu-meta text-fieldgrey">{g.group}</span>
                <ul className="flex flex-col gap-2">
                  {g.tokens.map(([name, ref]) => (
                    <li key={name} className="flex items-center gap-3">
                      <span className="h-7 w-7 shrink-0 border border-ink/10" style={{ background: hexOf(primitives, ref) }} aria-hidden="true" />
                      <span className="flex flex-col leading-tight">
                        <span className="text-[14px] font-medium">{name}</span>
                        <span className="text-[12px] text-fieldgrey">→ {ref}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {pairs.length > 0 && (
            <ul className="grid grid-cols-2 gap-2 tablet:grid-cols-3 laptop:grid-cols-6" aria-label="Contrast of text and background pairs">
              {pairs.map((p) => (
                <li key={p.label} className="flex flex-col gap-2 p-3" style={{ background: p.bg, color: p.fg, fontFamily: "'DM Sans', sans-serif" }}>
                  <span className="text-[28px] font-medium leading-none">Aa</span>
                  <span className="text-[12px] leading-tight">{p.label}</span>
                  <span className="text-[14px] font-medium">
                    {p.ratio} : 1 · {p.ratio >= 7 ? "AAA" : "AA"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {type.length > 0 && (
        <div className="flex flex-col gap-4">
          <SubHead meta={data.typeMeta || "Type scale"}>Type</SubHead>
          <ul className="flex flex-col bg-paper px-5">
            {type.map((t) => (
              <li key={t.name} className="grid items-baseline gap-2 border-b border-ink/10 py-4 last:border-b-0 tablet:grid-cols-[180px_1fr]">
                <span className="flex flex-col">
                  <span className="text-[14px] font-medium">{t.name}</span>
                  <span className="fu-meta text-fieldgrey">
                    {t.family} {t.weight} · {t.size}/{t.line}
                  </span>
                </span>
                <span
                  className="min-w-0 truncate text-[#1A1B1F]"
                  style={{ fontFamily: `'${t.family}', ${t.family === "Fraunces" ? "serif" : "sans-serif"}`, fontWeight: t.weight, fontSize: t.size, lineHeight: `${t.line}px` }}
                >
                  {t.sample}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(spacing.length > 0 || radius.length > 0) && (
        <div className="grid gap-4 tablet:grid-cols-2">
          <div className="flex flex-col gap-4">
            <SubHead meta="4-point scale">Spacing</SubHead>
            <ul className="flex flex-col gap-2">
              {spacing.map((s) => (
                <li key={s} className="grid grid-cols-[40px_1fr] items-center gap-3">
                  <span className="font-mono text-[12px] text-fieldgrey">{s}</span>
                  <span className="h-3 bg-olive" style={{ width: s * 4 || 2 }} aria-hidden="true" />
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <SubHead meta="Four radii">Radius</SubHead>
            <ul className="flex flex-wrap gap-4">
              {radius.map(([name, r]) => (
                <li key={name} className="flex flex-col items-center gap-2">
                  <span className="block h-16 w-16 border-2 border-olive bg-paper" style={{ borderRadius: Math.min(r, 32) }} aria-hidden="true" />
                  <span className="font-mono text-[12px] text-fieldgrey">
                    {r === 999 ? "full · pill" : `${name} · ${r}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {illustrations?.items?.length > 0 && (
        <div className="flex flex-col gap-4">
          <SubHead meta={illustrations.meta}>Illustrations</SubHead>
          {illustrations.lead && <p className="max-w-[720px] text-[16px] leading-relaxed text-graphite">{illustrations.lead}</p>}
          <ul className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3">
            {illustrations.items.map((it) => (
              <li key={it.name} className="flex flex-col gap-3 bg-paper p-3">
                <div className="rounded-[20px] bg-[#FAF6F2] px-4 py-5">
                  <img
                    src={withBase(it.src)}
                    alt={`${it.name} illustration`}
                    loading="lazy"
                    width={320}
                    height={160}
                    className="block aspect-[2/1] h-auto w-full object-contain"
                  />
                </div>
                <span className="flex items-baseline justify-between gap-3 px-1 pb-1">
                  <span className="text-[16px] font-semibold">{it.name}</span>
                  <span className="text-right text-[14px] text-graphite">{it.use}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tiles.length > 0 && (
        <div className="flex flex-col gap-4">
          <SubHead meta="Every screen is assembled from these">Components</SubHead>
          <div className="columns-1 gap-4 tablet:columns-2 laptop:columns-3">
            {tiles.map((t) => (
              <figure key={t.src} className="mb-4 flex break-inside-avoid flex-col gap-3 bg-paper p-5">
                <div className="flex justify-center rounded-[16px] bg-[#FFFFFF] p-4">
                  <img src={withBase(t.src)} alt={`${t.title}: ${t.caption}`} loading="lazy" width={t.w / 2} height={t.h / 2} className="h-auto w-full max-w-full" style={{ maxWidth: t.w / 2 }} />
                </div>
                <figcaption className="flex flex-col">
                  <span className="text-[16px] font-semibold">{t.title}</span>
                  <span className="text-[14px] text-graphite">{t.caption}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
