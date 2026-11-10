// The prototype's own checks (autopilot._check, _check_dodge) and the rules, run against the browser port.
//   node design/junior-sim/check-brain.mjs
import assert from 'node:assert/strict';
import { Autopilot, DODGE, homeStep, interpret, APPROACH_PWM, CM_PER_S_PER_PWM, WHEEL_BASE_CM, classify, wheels } from '../../public/sim/junior/js/brain.js';

class Odo {
  constructor() { this.x = this.y = this.heading = 0; }
  update(l, r, dt) {
    const vl = l * CM_PER_S_PER_PWM, vr = r * CM_PER_S_PER_PWM, v = (vl + vr) / 2, w = (vr - vl) / WHEEL_BASE_CM;
    this.x += v * Math.cos(this.heading + w * dt / 2) * dt;
    this.y += v * Math.sin(this.heading + w * dt / 2) * dt;
    this.heading = ((this.heading + w * dt + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  }
}

// home by the direct path
const odo = new Odo();
for (const [l, r, s] of [[200, 200, 2], [-150, 150, 0.8], [200, 200, 1.5], [150, -150, 0.3], [200, 200, 1]])
  for (let i = 0; i < Math.trunc(s / 0.09); i++) odo.update(l, r, 0.09);
const away = Math.hypot(odo.x, odo.y);
let ap = new Autopilot(), t = 10;
ap.startHome(odo, t);
while (ap.active) { const [l, r] = ap.command(t, null); odo.update(l, r, 0.09); t += 0.09; }
assert.ok(away > 50 && Math.hypot(odo.x, odo.y) < 6, `home: ${away} -> ${Math.hypot(odo.x, odo.y)}`);

// to the glow
const blob = (x, area = 0.1, id = 'a') => ({ id, x, area, box: [x - 1 / 16, 0.4, 1 / 8, 1 / 6], at: 'ahead', strength: 0.7 });
const one = (x, area = 0.1) => { const b = blob(x, area); return { glow_id: b.id, glow_blobs: [b] }; };
t = 100;
ap = new Autopilot(); ap.startGlow(null, t);
assert.deepEqual(ap.command(t, one(0.0625)), [APPROACH_PWM - 43, APPROACH_PWM + 43]);
assert.deepEqual(ap.command(t, one(0.5)), [170, 170]);
assert.deepEqual(ap.command(t, { glow_blobs: [] }), [100, 100]);
assert.deepEqual(ap.command(t + 1.5, { glow_blobs: [] }), [-70, 70]);
assert.ok(ap.active);
assert.deepEqual(ap.command(t + 5, { glow_blobs: [] }), [0, 0]);
assert.ok(!ap.active && ap.why === 'glow lost');
ap.startGlow(null, t);
assert.deepEqual(ap.command(t, one(0.5, 0.6)), [0, 0]);
assert.ok(!ap.active && ap.why === 'arrived');
const two = { glow_id: 'l', glow_blobs: [blob(0.0625, 0.1, 'l'), blob(0.8125, 0.1, 'r')] };
ap.startGlow('r', t);  // Marvin chose the right one, though the left is the strongest
assert.deepEqual(ap.command(t, two), [APPROACH_PWM + 31, APPROACH_PWM - 31]);
assert.equal(ap.show(two).glow_id, 'r');
ap.startGlow(null, t);
assert.deepEqual(ap.command(t, one(0.9), true), [100, -100]);  // a rock: turn towards the glow's side
assert.deepEqual(ap.command(t + 0.9, one(0.9), true), [-100, 100]);  // no luck within 0.8 s: the other way
assert.deepEqual(ap.command(t + 1, one(0.9)), [-100, 100]);
assert.deepEqual(ap.command(t + 1.5, { glow_blobs: [] }), [200, 200]);

// a dodge to the left ends on the same heading, shifted left and ahead
const o2 = new Odo();
for (const [s, l, r] of DODGE) for (let i = 0; i < Math.trunc(s / 0.09); i++) o2.update(l, r, 0.09);
assert.ok(Math.abs(o2.heading) < 0.05 && o2.y > 40 && o2.y < 70 && o2.x > 50, JSON.stringify(o2));
ap = new Autopilot(); const o3 = Object.assign(new Odo(), { x: 100, heading: Math.PI });
ap.startHome(o3, 0);
const outs = Array.from({ length: 9 }, (_, i) => ap.command((i + 1) / 10, null, true));
assert.deepEqual(outs[0], [200, 200]); assert.deepEqual(outs[8], [-150, -150]);
assert.equal(homeStep({ x: 2, y: 1, heading: 0 }), null);

// the rules
const ctx = (extra = {}) => ({ askedRecently: false, flare: false, blobs: [], pointedId: null, pt: null, ...extra });
const L = blob(0.2, 0.1, 'l'), R = blob(0.8, 0.1, 'r');
assert.equal(interpret('Junior, stop!', ctx()).kind, 'stop');
assert.equal(interpret('hold on', ctx()).kind, 'stop');
assert.equal(interpret('Junior, come back', ctx()).kind, 'home');
assert.equal(interpret("don't come back", ctx()).kind, 'chat');
assert.equal(interpret('Junior, check that one', ctx({ blobs: [L, R] })).kind, 'ask');
assert.equal(interpret('Junior, check that one', ctx({ blobs: [L, R], pointedId: 'r' })).pick.id, 'r');
assert.equal(interpret('Junior, check that one', ctx({ blobs: [L, R], pt: -30 })).pick.id, 'l');
assert.equal(interpret('check the right one', ctx({ blobs: [L, R] })).pick.id, 'r');
assert.equal(interpret('check that one', ctx({ blobs: [L] })).pick.id, 'l');
assert.equal(interpret('left', ctx({ blobs: [L, R], askedRecently: true })).pick.id, 'l');
assert.equal(interpret('on the right', ctx({ blobs: [L, R], askedRecently: true })).pick.id, 'r');
assert.deepEqual([interpret('left', ctx()).kind, interpret('left', ctx()).key], ['move', 'left']);
assert.equal(interpret('go right', ctx()).key, 'right');
assert.equal(interpret('back up', ctx()).key, 'reverse');
assert.equal(interpret('check that one', ctx({ flare: true, blobs: [L] })).kind, 'flare');
assert.equal(interpret('stop', ctx({ flare: true })).kind, 'stop');
assert.equal(interpret('check that one', ctx()).kind, 'point-move');
assert.equal(interpret('mark this', ctx()).kind, 'trace');
assert.equal(interpret('what do you see', ctx()).kind, 'look');
assert.equal(interpret('hello there friend how are you', ctx()).kind, 'chat');

// gestures
const P = (x, y) => ({ x, y });
const open = [P(.5, .9), P(.4, .85), P(.35, .8), P(.3, .75), P(.25, .7), P(.45, .6), P(.45, .5), P(.45, .4), P(.45, .3),
  P(.5, .6), P(.5, .5), P(.5, .4), P(.5, .3), P(.55, .6), P(.55, .5), P(.55, .4), P(.55, .3), P(.6, .62), P(.6, .55), P(.6, .48), P(.6, .42)];
assert.equal(classify(open)[0], 'FORWARD');
assert.deepEqual(wheels('FORWARD', 0), [200, 200]);
assert.deepEqual(wheels('FORWARD', -50), [105, 200]);
assert.deepEqual(wheels('REVERSE', 0), [-200, -200]);
console.log('brain check ok: home from', away.toFixed(0), 'cm to', Math.hypot(odo.x, odo.y).toFixed(1), 'cm');
