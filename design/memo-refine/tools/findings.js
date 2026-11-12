// Computes one candidate finding per visualization from the site's own data (the JSON files meme_viz.js loads),
// with the memes that show it, and writes ../findings.json. The "fact" lines are drafts for writer-alice:
// the numbers are exact, the wording is not final. Re-run after the data changes:  node tools/findings.js
const fs = require('fs');
const path = require('path');

const SITE = 'https://thememeontology.netlify.app/';
const UA = { 'User-Agent': 'memo-refine-findings' };   // a project name only, no contact details
const OUT = path.join(__dirname, '..', 'findings.json');

const get = async (f) => (await fetch(SITE + f, { headers: UA })).json();
const nf = (n) => Math.round(n).toLocaleString('en-GB');
const pct = (v) => Math.round(v * 100) + '%';
const nameOf = (slug) => String(slug || '').replace(/^_+/, '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const yearOf = (m) => { const y = parseInt(m.year, 10); return Number.isFinite(y) ? y : null; };
const byViews = (a, b) => (b.popularityViews || 0) - (a.popularityViews || 0);
const meme = (m) => ({ name: nameOf(m.slug), url: '/visualizations#meme/' + encodeURIComponent(m.slug), thumb: m.imageURL });
const variant = (a) => ({ name: a.variantTitle || a.memeName, url: '/visualizations#variant/' + encodeURIComponent(a.photoId), thumb: a.imageURL });
const d0 = (d) => {
  const slug = (d.meme_url || '').split('/').pop();
  return { name: nameOf(slug), url: '/visualizations#d0/' + encodeURIComponent(d.id), thumb: d.image_url };
};
const count = (list, fn) => {
  const c = new Map();
  list.forEach((x) => [].concat(fn(x)).forEach((k) => { if (k) c.set(k, (c.get(k) || 0) + 1); }));
  return [...c].sort((a, b) => b[1] - a[1]);
};

(async () => {
  const [data, sample, annotations, colours] = await Promise.all([
    get('meme_data.json'), get('sampled_dataset.json'), get('transformation_annotations.json'), get('color_data.json'),
  ]);
  const memes = Object.values(data.memes);
  const G = data.graphs;
  const out = [];

  // 1. Temporal distribution of format: the busiest year and the format that leads it
  {
    const years = count(memes, (m) => yearOf(m));
    const [year, total] = years[0];
    const inYear = G.time.links.filter((l) => +l.source === year).sort((a, b) => b.value - a.value);
    const lead = inYear[0];
    const examples = memes.filter((m) => yearOf(m) === year && (m.hasFormat || []).includes(lead.target)).sort(byViews).slice(0, 4);
    out.push({
      sectionId: 'sec-time',
      fact: `${year} is the busiest year: ${nf(total)} entries, led by ${lead.target} with ${nf(lead.value)}.`,
      numbers: { year, entries: total, leadingFormat: lead.target, leadingFormatEntries: lead.value },
      memes: examples.map(meme),
    });
  }

  // 2. Popularity x format: highest average views against the biggest format
  {
    const pts = [...G.popularity.points].sort((a, b) => b.avgViews - a.avgViews);
    const top = pts[0];
    const biggest = [...G.popularity.points].sort((a, b) => b.entries - a.entries)[0];
    const examples = memes.filter((m) => (m.hasFormat || []).includes(top.format)).sort(byViews).slice(0, 4);
    out.push({
      sectionId: 'sec-popularity',
      fact: `${top.format} draws the most views per entry, ${nf(top.avgViews)} on average, from only ${top.entries} entries.`,
      numbers: { format: top.format, avgViews: Math.round(top.avgViews), entries: top.entries, biggestFormat: biggest.format, biggestFormatEntries: biggest.entries, biggestFormatAvgViews: Math.round(biggest.avgViews) },
      memes: examples.map(meme),
    });
  }

  // 3. Platform origin x time period: the platform whose share grows most from the first to the last period
  {
    const periods = G.platformTime.periods;
    const first = periods[0], last = periods[periods.length - 1];
    const share = (p, k) => (p.segments.find((s) => s.platform === k) || { ratio: 0 }).ratio;
    const plats = [...new Set(periods.flatMap((p) => p.segments.map((s) => s.platform)))].filter((k) => k !== 'Other');
    const moves = plats.map((k) => ({ k, from: share(first, k), to: share(last, k) })).map((d) => ({ ...d, d: d.to - d.from }));
    const rise = moves.sort((a, b) => b.d - a.d)[0];
    const fall = [...moves].sort((a, b) => a.d - b.d)[0];
    const examples = memes.filter((m) => m.hasOriginPlatform === rise.k && yearOf(m) >= 2021).sort(byViews).slice(0, 4);
    out.push({
      sectionId: 'sec-platform-time',
      fact: `${rise.k} goes from ${pct(rise.from)} of attributed memes before 2010 to ${pct(rise.to)} since 2021; ${fall.k} falls from ${pct(fall.from)} to ${pct(fall.to)}.`,
      numbers: { rising: rise.k, risingFrom: +rise.from.toFixed(3), risingTo: +rise.to.toFixed(3), falling: fall.k, fallingFrom: +fall.from.toFixed(3), fallingTo: +fall.to.toFixed(3), firstPeriod: first.period, lastPeriod: last.period },
      memes: examples.map(meme),
    });
  }

  // 4. Creative productivity x cultural prominence (D0): most variants against most views
  {
    const most = [...sample].sort((a, b) => (b.photos || 0) - (a.photos || 0));
    const seen = [...sample].sort((a, b) => (b.views || 0) - (a.views || 0));
    const a = most[0], b = seen[0];
    const picks = [a, b, most[1], seen[1]].filter((x, i, arr) => arr.indexOf(x) === i).slice(0, 4);
    out.push({
      sectionId: 'sec-variant-bubble',
      fact: `${d0(a).name} has the most variant photos (${nf(a.photos)}); ${d0(b).name} has the most views (${nf(b.views)}) with ${nf(b.photos || 0)} photos.`,
      numbers: { mostVariants: d0(a).name, photos: a.photos, itsViews: a.views, mostViewed: d0(b).name, views: b.views, itsPhotos: b.photos || 0 },
      memes: picks.map(d0),
    });
  }

  // 5. Variant gallery: how far the 50 annotated variants move from their template
  {
    const ext = count(annotations, (a) => a.transformationExtent);
    const order = ['Minimal', 'Moderate', 'Substantial', 'Parody'];
    const byExt = Object.fromEntries(order.map((k) => [k, (ext.find((e) => e[0] === k) || [k, 0])[1]]));
    const [topExt, topN] = ext[0];
    const picks = order.map((k) => annotations.find((a) => a.transformationExtent === k)).filter(Boolean).slice(0, 4);
    const none = order.filter((k) => !byExt[k]);
    out.push({
      sectionId: 'sec-variant-gallery',
      fact: `${topN} of the 50 annotated variants are ${topExt.toLowerCase()} changes${none.length ? `; none is ${none.map((k) => k.toLowerCase()).join(' or ')}` : ''}.`,
      numbers: { annotated: annotations.length, ...byExt },
      memes: picks.map(variant),
    });
  }

  // 6. Variant family tree: the transformation dimension used most
  {
    const dims = count(annotations, (a) => a.transformationDimension || []);
    const [dim, n] = dims[0];
    const multi = annotations.filter((a) => (a.transformationDimension || []).length > 1).length;
    const picks = annotations.filter((a) => (a.transformationDimension || []).includes(dim)).slice(0, 4);
    out.push({
      sectionId: 'sec-family',
      fact: `${dim} is the most common change, in ${n} of the 50 variants; ${multi} variants change more than one thing.`,
      numbers: { dimension: dim, variants: n, multiDimension: multi, all: Object.fromEntries(dims) },
      memes: picks.map(variant),
    });
  }

  // 7. Colour spectrum: average saturation early and recent (the same split as the chart's own note)
  {
    const items = memes.map((m) => ({ m, y: yearOf(m), c: colours[m.slug] })).filter((d) => d.y && d.c);
    const mean = (a, b) => { const s = items.filter((d) => d.y >= a && d.y <= b); return s.reduce((t, d) => t + d.c.s, 0) / s.length; };
    const early = mean(1995, 2011), late = mean(2018, 2026);
    const bright = items.filter((d) => d.y <= 2011 && d.c.s >= 60).map((d) => d.m).sort(byViews).slice(0, 2);
    const grey = items.filter((d) => d.y >= 2018 && d.c.s <= 6).map((d) => d.m).sort(byViews).slice(0, 2);
    out.push({
      sectionId: 'sec-spectrum',
      fact: `Memes lose colour: average saturation falls from ${Math.round(early)}% up to 2011 to ${Math.round(late)}% from 2018.`,
      numbers: { saturationTo2011: +early.toFixed(1), saturationFrom2018: +late.toFixed(1) },
      memes: [...bright, ...grey].map(meme),
    });
  }

  // 8. Knowledge-graph walk: the property value that connects the most memes in one hop
  {
    const props = [
      ['format', (m) => m.hasFormat || []], ['platform', (m) => m.hasOriginPlatform], ['image type', (m) => m.hasImageType],
      ['subject', (m) => m.hasSubjectMatter], ['region', (m) => m.hasRegion],
    ];
    const tops = props.map(([p, fn]) => { const [v, n] = count(memes, (m) => [].concat(fn(m)).filter((x) => x && x !== 'Unknown'))[0]; return { p, v, n }; })
      .sort((a, b) => b.n - a.n);
    const t = tops[0];
    const fn = props.find((x) => x[0] === t.p)[1];
    const examples = memes.filter((m) => [].concat(fn(m)).includes(t.v)).sort(byViews).slice(0, 4);
    out.push({
      sectionId: 'sec-walk',
      fact: `${t.v} is the busiest crossing: one hop from it reaches ${nf(t.n)} of the 5,000 memes.`,
      numbers: { property: t.p, value: t.v, memes: t.n, nextBusiest: tops.slice(1, 3).map((x) => `${x.p} ${x.v} (${x.n})`) },
      memes: examples.map(meme),
    });
  }

  // 9. Platform story: attributed memes and the peak year (the chart's own filter)
  {
    const MODERN = new Set(['TikTok', 'Instagram', 'Snapchat', 'Twitch', 'Discord']);
    const rows = memes.filter((m) => {
      const y = yearOf(m), p = m.hasOriginPlatform;
      if (!p || !y || y < 2004 || y > 2025) return false;
      if (y < 2010 && MODERN.has(p)) return false;
      if (y < 2016 && p === 'TikTok') return false;
      return true;
    });
    const [peakYear, peakN] = count(rows, (m) => yearOf(m))[0];
    const examples = rows.filter((m) => yearOf(m) === peakYear).sort(byViews).slice(0, 4);
    out.push({
      sectionId: 'sec-story',
      fact: `${nf(rows.length)} of the 5,000 memes name the platform they came from; the count peaks in ${peakYear}, with ${nf(peakN)}.`,
      numbers: { attributed: rows.length, peakYear, peakCount: peakN },
      memes: examples.map(meme),
    });
  }

  // 10. Classifier confidence: labels below the default 0.5 threshold, and the least certain type
  {
    const items = memes.filter((m) => m.hasImageType && m.clipImageTypeScore != null);
    const below = items.filter((m) => +m.clipImageTypeScore < 0.5);
    const types = count(items, (m) => m.hasImageType).map(([t]) => t);
    const means = types.map((t) => { const s = items.filter((m) => m.hasImageType === t); return { t, mean: s.reduce((a, m) => a + +m.clipImageTypeScore, 0) / s.length, n: s.length }; })
      .filter((d) => d.n >= 20).sort((a, b) => a.mean - b.mean);
    const unsure = means[0];
    const examples = below.filter((m) => m.hasImageType === unsure.t).sort(byViews).slice(0, 4);
    out.push({
      sectionId: 'sec-confidence',
      fact: `At a 0.5 threshold, ${pct(below.length / items.length)} of the image-type labels would not survive; ${unsure.t} is the least certain type.`,
      numbers: { labelled: items.length, belowHalf: below.length, leastCertainType: unsure.t, itsMeanScore: +unsure.mean.toFixed(3) },
      memes: examples.map(meme),
    });
  }

  // 11. Property flow: the thickest strand from a named platform to a named format
  {
    const primary = (m) => (m.hasFormat || []).find((f) => f && f !== 'Unknown') || null;
    const links = count(memes.filter((m) => m.hasOriginPlatform && primary(m)), (m) => `${m.hasOriginPlatform}→${primary(m)}`);
    const [key, n] = links[0];
    const [plat, fmt] = key.split('→');
    const unattributed = memes.filter((m) => !m.hasOriginPlatform).length;
    const examples = memes.filter((m) => m.hasOriginPlatform === plat && primary(m) === fmt).sort(byViews).slice(0, 4);
    out.push({
      sectionId: 'sec-flow',
      fact: `The thickest strand runs from ${plat} to ${fmt}: ${nf(n)} memes. ${nf(unattributed)} memes have no platform at all.`,
      numbers: { platform: plat, format: fmt, memes: n, unattributed },
      memes: examples.map(meme),
    });
  }

  const doc = {
    note: 'Draft facts computed from the site data by tools/findings.js. Numbers are exact; the sentences are drafts for writer-alice. The page shows the "fact" text until it is replaced.',
    generated: new Date().toISOString().slice(0, 10),
    opener: {
      title: 'Visualizations',
      text: `Eleven ways into the corpus: ${nf(memes.length)} Know Your Meme entries, the ${sample.length}-meme D0 sample and ${annotations.length} annotated variants.`,
      draft: true,
    },
    findings: out,
  };
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2));
  out.forEach((f) => console.log(f.sectionId.padEnd(20), f.fact, '|', f.memes.length, 'memes'));
})();
