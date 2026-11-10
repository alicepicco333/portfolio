// Junior's brain, browser version: the fixed rules of junior_brain.py, the autopilot of autopilot.py and
// Alexis's gesture classifier of junior_09.py, ported from Python. The prototype also asked a local language
// model (Gemma 3 4B) which glow Marvin meant; here the rules work alone, as they could in the prototype.

// Same numbers as autopilot.py, junior_09.py and junior_car_093.ino, so Junior moves as the car would.
export const CM_PER_S_PER_PWM = 0.12, WHEEL_BASE_CM = 14, STOP_CM = 20, CLEAR_CM = 27;
export const DRIVE_PWM = 200, SPIN_PWM = 150, APPROACH_PWM = 170;
const FORWARD_PWM = 200, REVERSE_PWM = 200, MAX_STEER = 95, STEER_DEADZONE_DEG = 12, STEER_FULL_DEG = 50;

const TAU = Math.PI * 2, DEG = 180 / Math.PI;
const wrap = a => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------- autopilot (autopilot.py)
/** One step home, re-planned every frame from the pose: turn on the spot if home is behind, else drive and steer.
 *  odo = {x, y, heading} in cm and radians (x = away from home). Returns [left, right], or null when home. */
export function homeStep(odo) {
  const dist = Math.hypot(odo.x, odo.y);
  if (dist < 4) return null;
  const turn = wrap(Math.atan2(-odo.y, -odo.x) - odo.heading) * DEG;  // > 0: home is to the left
  if (Math.abs(turn) > 60) return turn > 0 ? [-SPIN_PWM, SPIN_PWM] : [SPIN_PWM, -SPIN_PWM];
  const pwm = dist > 25 ? DRIVE_PWM : 120;  // slow down near home
  const d = Math.trunc(clamp(2.5 * turn, -55, 55));
  return [pwm - d, pwm + d];
}

// A rock in the way on the way home: back up, turn away, drive sideways, turn back, drive past it. [seconds, left, right]
export const DODGE = [[0.9, -150, -150], [1.2, -75, 75], [2.4, 200, 200], [1.2, 75, -75], [3.0, 200, 200]];
// "Go left" etc.: a 90-degree turn and a short drive; no map needed.
export const MOVES = {
  left: [[0.6, -150, 150], [1.5, 200, 200]], right: [[0.6, 150, -150], [1.5, 200, 200]],
  ahead: [[2.0, 200, 200]], reverse: [[1.5, -200, -200]],
};

export class Autopilot {
  constructor() {
    this.name = null; this.why = ''; this.odo = null; this.t0 = 0; this.lost = null; this.steps = null;
    this.blockedAt = null; this.stuck = false; this.detour = null;
    this.aim = null; this.targetId = null; this.blob = null;
    this.dodges = 0; this.look = 0; this.side = -1; this.cleared = null; this.flipped = false; this.near = false;
    this.dodgeSide = 1; this.tries = 0; this.dodged = -99; this.lean = 0;
  }
  get active() { return this.name !== null; }
  startHome(odo, now) {
    this.odo = odo; this.t0 = now; this.detour = null; this.blockedAt = null;
    this.name = homeStep(odo) ? 'going home' : null;
    this.why = this.name ? '' : 'home';
  }
  startMoves(steps, now) { this.t0 = now; this.steps = steps; this.detour = null; this.blockedAt = null; this.name = 'moving'; }
  /** targetId: the glow Marvin chose (a patch id); null = the strongest one Junior sees. */
  startGlow(targetId, now) {
    Object.assign(this, { aim: null, targetId, blob: null, lost: null, detour: null, dodges: 0, look: 0, near: false, t0: now, blockedAt: null });
    this.name = 'to the glow';
  }
  cancel(why = '') { if (this.name) this.why = why; this.name = null; this.blockedAt = null; this.detour = null; }

  /** g with the glow he drives to as the one the visor names, so the amber box and the ticks follow it. */
  show(g) {
    const b = this.blob;
    if (!b || this.name !== 'to the glow' || !g.glow_blobs.includes(b)) return g;
    return { ...g, glow: b.strength, glow_at: b.at, glow_box: b.box, glow_id: b.id };
  }

  // The geometry knows which patch is which, so he keeps to his glow by its id (the camera-only prototype kept to it by its place in the row).
  _glow(g) {
    const blobs = g?.glow_blobs || [];
    let blob = null;
    if (this.targetId != null) blob = blobs.find(b => b.id === this.targetId) || null;
    else {
      blob = blobs.find(b => b.id === g.glow_id) || null;
      if (blob) this.targetId = blob.id;
    }
    if (blob) this.aim = blob.x;
    this.blob = blob;
    return blob;
  }

  /** Wheel command for this moment. A rock ahead for over a second ends a fixed drive (stuck = say so); on a trip he goes round it. */
  command(now, g, blocked = false) {
    const name = this.name;
    this.blockedAt = blocked ? (this.blockedAt ?? now) : null;
    if (this.blockedAt !== null && now - this.blockedAt > 1.0 && name === 'moving') {
      this.cancel('blocked'); this.stuck = true; return [0, 0];
    }
    if (name === 'to the glow') return this._toGlow(now, g, blocked);
    if (name === 'going home') {
      let step = homeStep(this.odo), detour = this.detour;
      const blockedAt = this.blockedAt;
      this.lean = (step ? step[1] - step[0] : 0) || this.lean;  // which way home pulls: > 0 = to the left
      if (detour === null && blockedAt !== null && now - blockedAt > 0.5) {  // a rock in the way and he cannot drive on
        this.tries = now - this.dodged < 5 ? this.tries + 1 : 1;  // blocked again soon after a dodge: same rock, same side
        if (this.tries > 4) { this.cancel('blocked'); this.tries = 0; this.stuck = true; return [0, 0]; }
        if (this.tries === 1) this.dodgeSide = this.lean < 0 ? -1 : 1;  // first try: on home's side
        this.detour = detour = now;
      }
      if (detour !== null) {
        let t = now - detour;
        for (let i = 0; i < DODGE.length; i++) {
          const [secs, l, r] = DODGE[i];
          if (t < secs) {
            if ((i === 2 || i === 4) && blocked) break;  // stopped again on a straight leg: this try is over
            return this.dodgeSide > 0 ? [l, r] : [r, l];
          }
          t -= secs;
        }
        this.t0 += now - detour;  // a dodge does not use up the trip's time
        this.detour = null; this.dodged = now;
      }
      step = homeStep(this.odo);
      if (step === null || now - this.t0 > 30) { this.cancel('home'); return [0, 0]; }
      return step;
    }
    if (name === 'moving') {
      let t = now - this.t0;
      for (const [secs, l, r] of this.steps) {
        if (t < secs) return [l, r];
        t -= secs;
      }
      this.cancel('done');
      return [0, 0];
    }
    return [0, 0];
  }

  /** Steer at the glow, stop when it fills his picture, sidestep a rock, look for the glow when it slips away.
   *  look = the side (-1 left, +1 right) the glow was last clearly on; side = the way a sidestep turns. */
  _toGlow(now, g, blocked) {
    const blob = this._glow(g);
    if (blob) {
      const err = blob.x - 0.5;  // glow left of centre < 0 < right
      this.near = blob.area > 0.4;
      if (Math.abs(err) > 0.04) this.look = err > 0 ? 1 : -1;
    }
    if (blocked && this.detour === null) {  // a rock in the way
      this.dodges += 1;
      if (this.dodges > 4) { this.cancel('blocked'); this.stuck = true; return [0, 0]; }
      Object.assign(this, { detour: now, side: this.look || -1, cleared: null, flipped: false, near: false });  // turn towards the glow's side first
    }
    if (this.detour !== null) {
      const t = now - this.detour;
      if (this.cleared === null && !blocked && t > 0.1) this.cleared = now;  // the flag dropped: this way is free
      if (this.cleared === null && t > 0.8 && !this.flipped) { this.side = -this.side; this.flipped = true; }  // no luck: the other way
      this.look = -this.side;
      if ((this.cleared === null && t < 2.4) || (this.cleared !== null && now - this.cleared < 0.2)) return [100 * this.side, -100 * this.side];
      if (this.cleared !== null && now - this.cleared < 1.45) return [200, 200];
      this.detour = null; this.lost = now - 1;  // the glow is on the other side now: look for it at once
    }
    if (!blob) {  // gone: if it was big he is on top of it, else roll on a second, look where it was last seen, then give up
      this.lost = this.lost ?? now;
      if (now - this.lost > (this.near ? 0.5 : 4)) { this.cancel(this.near ? 'arrived' : 'glow lost'); return [0, 0]; }
      if (this.near || g?.flare) return [0, 0];  // a flare dazzles him: no rolling on
      return now - this.lost < 1 ? [100, 100] : [70 * this.look, -70 * this.look];
    }
    this.lost = null;
    if (blob.area > 0.55 || now - this.t0 > 40) { this.cancel('arrived'); return [0, 0]; }  // the glow fills his picture: about 30 cm away
    const turn = Math.trunc(clamp(100 * (blob.x - 0.5), -45, 45));  // steer gently while driving
    return [APPROACH_PWM + turn, APPROACH_PWM - turn];
  }
}

// ---------------------------------------------------------------- gestures (junior_09.py, Alexis's classifier)
function fourExtended(h) {
  const w = h[0], d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  return [[8, 6], [12, 10], [16, 14], [20, 18]].map(([t, p]) => d(h[t], w) > d(h[p], w) * 1.12);
}
/** One hand pose (21 landmarks, mirrored like a mirror) -> [mode, steering angle in degrees]. */
export function classify(h) {
  const count = fourExtended(h).filter(Boolean).length;
  const tip = h[4], base = h[2];
  if (count === 0 && tip.y > base.y + 0.10 && Math.abs(tip.x - base.x) < 0.17) return ['REVERSE', 0];
  if (count < 3) return ['STOP', 0];
  const w = h[0], m = h[9];
  return ['FORWARD', Math.atan2(m.x - w.x, w.y - m.y) * DEG];
}
/** A gesture -> left and right wheel PWM. An open hand tilted left slows the left wheel: it curves, it never spins. */
export function wheels(mode, angle) {
  if (mode === 'REVERSE') return [-REVERSE_PWM, -REVERSE_PWM];
  if (mode !== 'FORWARD') return [0, 0];
  const magnitude = clamp((Math.abs(angle) - STEER_DEADZONE_DEG) / (STEER_FULL_DEG - STEER_DEADZONE_DEG), 0, 1);
  const adj = Math.round(MAX_STEER * magnitude);
  if (angle < -STEER_DEADZONE_DEG) return [FORWARD_PWM - adj, FORWARD_PWM];
  if (angle > STEER_DEADZONE_DEG) return [FORWARD_PWM, FORWARD_PWM - adj];
  return [FORWARD_PWM, FORWARD_PWM];
}
/** Degrees left (-) / right (+) of straight ahead, or null if the index finger is not pointing (junior_brain.pointing). */
export function pointing(h) {
  const w = h[0];
  const far = (tip, pip) => Math.hypot(h[tip].x - w.x, h[tip].y - w.y) > Math.hypot(h[pip].x - w.x, h[pip].y - w.y) * 1.1;
  if (!far(8, 6) || far(12, 10) || far(16, 14)) return null;  // index out, middle and ring curled = pointing
  const dx = h[8].x - h[5].x, dy = h[5].y - h[8].y;
  return Math.atan2(dx, Math.max(dy, 1e-3)) * DEG;
}

// ---------------------------------------------------------------- the rules (junior_brain.fuse, fast loop)
const STOP = /\b(stop|halt|freeze|whoa|hold on)\b/;  // these never wait
const HOME = /^(?!.*\bvoice\b)(?=.*(\b(come|go|get|drive|head|move)( \w+)? back\b|\bcome-?back\b|\breturn\b|\bhome\b|\bback to me\b|\bcome (here|to me)\b))/;
const NEG = /\bdon.t\b|\bnot\b|\bnever\b/;  // "don't go there", "not that one": not an order
const GOTO = /\b(go|drive|head|move|steer|check|inspect|investigate|approach)\b.*\b(that|this|those|there|it|point\w*|glow\w*|fungus|patch|hazard|light)\b/;
const ONE = /\b(the|that|this|next|other|another) (\w+ )?one\b/;
const QUESTION = /\b(what|which|who|where|why|how|is|are|do|does|can|could|did)\b/;  // a question is not an order
const MOVE = /\b(go|turn|drive|move|head)\b.*?\b(left|right|forwards?|ahead|straight|reverse|backwards?)\b|\b(reverse|back up|backwards?)\b/;
const TRACE = /\b(log|mark|trace)\b|hazard here/;
const ANSWER = /^(?:the |on the |to the )?(left|right)(?: one| glow| patch| side)?(?:,? please)?$/;
const THAT = /\b(that|this|it|there|those)\b/;
const LOOK = /\bwhat (do you|can you|is that|are those)\b|\bsee\b|\blook\b|\bdescribe\b/;
const NAMED = /\b(?:the|on the|to the) (left|right)\b|\b(left|right) (?:one|glow|patch)\b/;

/** What was heard, as the rules read it: lower case, one space, no "Junior," in front, digits as words. */
export function normalise(text) {
  return String(text).toLowerCase().replace(/[.!?]+$/g, '').replace(/\s+/g, ' ').trim()
    .replace(/^(?:hey |ok |okay )?junior\b[,.!?]?\s*/, '').replace(/\b1\b/g, 'one').trim();
}

/** Which glow Marvin means, as [why, blob] out of the glows Junior sees (left to right). Only one glow: that one.
 *  Else his words ("the left one"), then his pointing (a clicked patch, or a finger angle). */
export function pickGlow(blobs, said, pointedId = null, pt = null) {
  if (blobs.length < 2) return blobs.length ? ['it is the only glow:', blobs[0]] : [null, null];
  const word = said.match(NAMED);
  if (word) return ['you named', word[0].includes('left') ? blobs[0] : blobs[blobs.length - 1]];
  if (pointedId != null) {
    const b = blobs.find(x => x.id === pointedId);
    if (b) return ['you pointed at', b];
  }
  if (pt != null) {  // x = 0.5 + deg / 90: Junior's camera is about 90 degrees wide
    const off = b => Math.abs(b.x - 0.5 - pt / 90);
    return ['you pointed at', blobs.reduce((a, b) => (off(b) < off(a) ? b : a))];
  }
  return [null, null];
}

/** The fixed rules, in the prototype's order. ctx = { askedRecently, flare, blobs, pointedId, pt }.
 *  Returns { kind, ... }: stop, home, move, trace, flare, ask, look, chat, point-move or goto. */
export function interpret(text, ctx) {
  let said = normalise(text);
  const answer = ctx.askedRecently && said.match(ANSWER);
  if (answer) said = `the ${answer[1]} one`;  // the answer to Junior's own question: same as "the left one"
  else if (/^(?:go |turn )?(left|right)$/.test(said)) said = `go ${said.replace(/^(go|turn) /, '')}`;  // browser: a bare "left" is a turn
  const neg = NEG.test(said);
  const goto = !neg && (GOTO.test(said) || (said.split(' ').length < 9 && ONE.test(said) && !QUESTION.test(said)));
  const move = !(goto || neg || ctx.flare) && said.match(MOVE);
  if (STOP.test(said)) return { kind: 'stop', said };
  if (HOME.test(said) && !neg) return { kind: 'home', said };
  if (move) {
    const g2 = move[2];
    const key = { forward: 'ahead', forwards: 'ahead', straight: 'ahead', backward: 'reverse', backwards: 'reverse' }[g2] ?? (g2 || 'reverse');
    return { kind: 'move', key, said };
  }
  if (!goto && TRACE.test(said)) return { kind: 'trace', said };
  if (ctx.flare) return { kind: 'flare', said };
  const blobs = ctx.blobs || [];
  const [why, pick] = pickGlow(blobs, said, ctx.pointedId, ctx.pt);
  if (goto && THAT.test(said) && blobs.length >= 2 && !pick) return { kind: 'ask', said, n: blobs.length };
  if (!goto) return { kind: LOOK.test(said) ? 'look' : 'chat', said };
  if (!blobs.length) {  // Junior can only drive to a glow he sees: with none in view, "go there" drives where you point
    const pt = ctx.pt;
    return { kind: 'point-move', key: pt == null || Math.abs(pt) < 15 ? 'ahead' : pt > 0 ? 'right' : 'left', said };
  }
  if (!pick) return { kind: 'ask', said, n: blobs.length, refused: true };
  return { kind: 'goto', why, pick, said };
}
