// Small layout helpers for the maps: text width estimates and a rectangle relaxation that
// pushes labelled points apart until nothing overlaps.

// Rough advance width of a label; Inter Tight averages ~0.55em, JetBrains Mono is 0.6em.
export const textWidth = (text, px, mono = false) => text.length * px * (mono ? 0.6 : 0.55);

export const overlapArea = (a, b) => {
  const x = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
  const y = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
  return x > 0 && y > 0 ? x * y : 0;
};

// items: { id: [x, y, left, top, right, bottom] } with the box given relative to (x, y).
// fixed: absolute boxes nothing may cover. box: [x0, y0, x1, y1] every item stays inside.
export function relaxRects(items, { fixed = [], box = null, iters = 3000, pad = 6 } = {}) {
  const it = Object.fromEntries(Object.entries(items).map(([k, v]) => [k, [...v]]));
  const ks = Object.keys(it);
  const rect = (k) => {
    const [x, y, l, t, r, b] = it[k];
    return [x + l - pad, y + t - pad, x + r + pad, y + b + pad];
  };
  for (let n = 0; n < iters; n += 1) {
    let moved = false;
    ks.forEach((a, i) => {
      ks.slice(i + 1).forEach((b) => {
        const A = rect(a);
        const B = rect(b);
        const ox = Math.min(A[2], B[2]) - Math.max(A[0], B[0]);
        const oy = Math.min(A[3], B[3]) - Math.max(A[1], B[1]);
        if (ox > 0 && oy > 0) {
          moved = true;
          if (ox < oy * 1.5) {
            const d = (ox / 2) * (A[0] + A[2] < B[0] + B[2] ? 1 : -1);
            it[a][0] -= d;
            it[b][0] += d;
          } else {
            const d = (oy / 2) * (A[1] + A[3] < B[1] + B[3] ? 1 : -1);
            it[a][1] -= d;
            it[b][1] += d;
          }
        }
      });
      fixed.forEach((F) => {
        const A = rect(a);
        const ox = Math.min(A[2], F[2]) - Math.max(A[0], F[0]);
        const oy = Math.min(A[3], F[3]) - Math.max(A[1], F[1]);
        if (ox > 0 && oy > 0) {
          moved = true;
          if (ox < oy) it[a][0] += ox * (A[0] + A[2] > F[0] + F[2] ? 1 : -1);
          else it[a][1] += oy * (A[1] + A[3] > F[1] + F[3] ? 1 : -1);
        }
      });
    });
    if (box) {
      ks.forEach((k) => {
        const [x, y, l, t, r, b] = it[k];
        it[k][0] = Math.min(Math.max(x, box[0] - l), box[2] - r);
        it[k][1] = Math.min(Math.max(y, box[1] - t), box[3] - b);
      });
    }
    if (!moved) break;
  }
  return Object.fromEntries(Object.entries(it).map(([k, v]) => [k, [v[0], v[1]]]));
}
