// The browser Junior: the world of sim.html, the brain of junior_brain.py and the visor of visor.html in one static page.
// Every input is a stand-in for one of the prototype's modalities: V or the Squeeze button for the palm sensor, the
// arrow keys, the pad or your own webcam for the glove gestures, the browser's speech recognition or the phrase buttons
// for Marvin's voice, and a click on a glow for pointing.
import * as THREE from 'three';
import { buildWorld, detectGlows, NO_GLOW, LENGTH, MARVIN } from './world.js';
import { Autopilot, MOVES, CM_PER_S_PER_PWM, WHEEL_BASE_CM, STOP_CM, CLEAR_CM, wheels, interpret } from './brain.js';
import * as audio from './audio.js';
import * as voice from './voice.js';

const $ = id => document.getElementById(id);
const DEG = 180 / Math.PI;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pct = v => `${Math.round(v * 100)}%`;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const stage = $('stage'), intro = $('intro'), insetEl = $('inset'), overlay = $('overlay'), octx = overlay.getContext('2d');

// ---------------------------------------------------------------- start screen and loading
if (!intro.open) intro.showModal();  // (index.html opens it while the scripts load)
let started = false;
const mb = b => (b / 1e6).toFixed(1);

let W;
try {
  W = buildWorld($('world'), (done, total) => {
    $('progressbar').style.width = pct(done / total);
    $('progress').setAttribute('aria-valuenow', Math.round(done / total * 100));
    $('progresstext').textContent = `${mb(done)} of ${mb(total)} MB`;
    if (!started) $('startbtn').textContent = `Loading ${Math.round(done / total * 100)}%`;
  });
} catch (err) {
  $('startbtn').textContent = 'Not available';
  $('loaderror').hidden = false;
  $('loaderror').textContent = 'This simulation needs WebGL, which this browser or device has turned off.';
  throw err;
}
const { renderer, scene, junior, eye, eyeDetect, patches, blockers } = W;
W.ready.then(() => {
  $('startbtn').disabled = false;
  // ask only for what this browser can use: without speech recognition (Firefox) the microphone would sit unused
  const what = voice.voiceSupported() ? 'camera and microphone' : 'camera';
  $('startbtn').textContent = `Start with ${what}`;
  $('startplain').textContent = `Start without ${what}`;
  $('startplain').hidden = false;
  $('progress').closest('.startrow').classList.add('done');
  render(0);  // one frame behind the start screen, so the first real frame has its shaders ready
}).catch(err => {
  $('startbtn').textContent = 'Could not load';
  $('loaderror').hidden = false;
  $('loaderror').textContent = 'The 3D world did not load. Check the connection and reload the page.';
  console.error(err);
});
// two ways in: with your camera and microphone (the browser asks once, for both), or with keys and buttons only
function begin(sensors) {
  audio.startAudio();
  const first = !started;
  if (first) { started = true; intro.dataset.started = '1'; S.hazardSaidAt = performance.now(); }
  $('startplain').hidden = true;
  intro.close();
  if (first && sensors) askSensors();
}
$('startbtn').addEventListener('click', () => begin(true));
$('startplain').addEventListener('click', () => begin(false));

// One prompt for the camera and the microphone. The camera goes to your hand; the microphone is let go at once:
// now that it is allowed, speech recognition opens it only while you hold Talk.
async function askSensors() {
  if (!navigator.mediaDevices?.getUserMedia) { heard('This browser gives no camera or microphone here. The keys and buttons drive Junior.'); return; }
  const video = { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' };
  const audioToo = voice.voiceSupported();
  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video, audio: audioToo });
  } catch (err) {
    console.warn(err);
    // only a missing device is worth a second try (a laptop with a camera and no microphone, or the other way round);
    // a refusal, a dismissed prompt or a busy camera is left alone
    if (err?.name !== 'NotFoundError' && err?.name !== 'OverconstrainedError') {
      const devices = audioToo ? 'camera or microphone is' : 'camera is';
      const retry = audioToo ? 'Your hand and Hold to talk' : 'Your hand';
      heard(err?.name === 'NotReadableError'
        ? `The ${devices} busy in another app. The keys and buttons drive Junior; ${retry} try again.`
        : `${audioToo ? 'Camera and microphone are' : 'The camera is'} off. The keys and buttons drive Junior; ${retry} ${audioToo ? 'ask' : 'asks'} again.`);
      return;
    }
    let mic = false;
    if (audioToo) { try { const m = await navigator.mediaDevices.getUserMedia({ audio: true }); m.getTracks().forEach(t => t.stop()); mic = true; } catch { /* no microphone */ } }
    try { stream = await navigator.mediaDevices.getUserMedia({ video }); } catch { /* no camera */ }
    if (!stream) {
      heard(mic ? 'No camera found. The keys and buttons drive Junior; hold Space or Hold to talk to speak.'
        : audioToo ? 'No camera or microphone found. The keys and buttons drive Junior.' : 'No camera found. The keys and buttons drive Junior.');
      return;
    }
  }
  stream.getAudioTracks().forEach(t => t.stop());
  handOn(stream);
}
intro.addEventListener('close', () => { $('startbtn').textContent = 'Back to Junior'; wake(); });
$('helpbtn').addEventListener('click', () => { releaseAll(); intro.showModal(); });

// ---------------------------------------------------------------- state
const pilot = new Autopilot();
const odo = { get x() { return junior.position.z * 100; }, get y() { return junior.position.x * 100; }, get heading() { return junior.rotation.y; } };
const S = {
  view: 'outside',          // which camera fills the visor: 'outside' or 'junior' (the squeeze swaps them)
  now: 1,                   // simulation clock, s (stops while the page is hidden or the help is open)
  pauseUntil: 0,            // every squeeze stops Junior first; so does a flare
  flareAt: -99, flareUntil: 0,
  blocked: false, drive: [0, 0],
  gate: false,              // talk key held: Junior listens
  pointed: null,            // { id, t } a patch you clicked
  finger: null,             // { deg, t } your finger, from the camera
  askedAt: -1e9,            // when Junior asked "the left one or the right one?" (wall clock, ms)
  hazardSaidAt: 0, wasGlowing: false,
  handSince: null, traces: 0,
};
let g = { ...NO_GLOW }, tickNear = 0, tickRate = 0;
const later = [];  // [time, fn] on the simulation clock
const after = (s, fn) => later.push([S.now + s, fn]);
window.sim = { S, pilot, W, get g() { return g; }, command: (t, c) => command(t, c ?? 1, 'test'), squeeze: () => squeeze(), flare: () => flare(),
  holdResolution() { holdPr = true; pr = Math.min(window.devicePixelRatio || 1, 1.5); resize(); } };  // for tests, stills and the console
let holdPr = false;

// ---------------------------------------------------------------- what Junior says, and what the rules decided
let saidAt = 0;
function say(text, certainty = 1) {
  const unsure = certainty < 0.6;  // unsure: a hesitation first (prosody carries certainty)
  const line = (unsure ? 'Hm... ' : '') + text;
  $('said').textContent = line;
  saidAt = performance.now();
  $('caption').classList.add('fresh');
  audio.speakLine(line, unsure);
}
function verdict(kind, text) {
  const el = $('verdict');
  el.className = 'verdict' + (kind === 'ALLOWED' ? ' ok' : kind === 'REFUSED' ? ' no' : '');
  el.replaceChildren(...(kind ? [Object.assign(document.createElement('b'), { textContent: kind }), ' '] : []), text);
}
function intent(means, wants) { $('means').textContent = means; $('wants').textContent = wants; }
function heard(text) { $('heard').textContent = text; }

// ---------------------------------------------------------------- the fast loop: fixed rules (junior_brain.fuse)
function command(text, conf, how) {
  text = String(text || '').trim();
  heard(text ? `"${text}"` + (how === 'voice' ? ` · ${pct(conf)} sure` : how === 'button' ? ' · button' : '') : '(nothing heard)');
  if (!text) return;
  const wall = performance.now();
  const point = S.pointed && wall - S.pointed.t < 12000 ? S.pointed : null;
  const finger = S.finger && wall - S.finger.t < 2500 ? S.finger : null;
  const pt = point ? bearing(patches.find(p => p.id === point.id)) : finger ? finger.deg : null;
  const flaring = S.now < S.flareUntil;
  const r = interpret(text, { askedRecently: wall - S.askedAt < 20000, flare: flaring, blobs: g.glow_blobs, pointedId: point?.id ?? null, pt });
  if (r.kind !== 'ask') S.askedAt = -1e9;  // Junior's question is answered (or dropped) by the next command
  switch (r.kind) {
    case 'stop':
      pilot.cancel('stop');
      intent('stop', 'stop');
      verdict('RULE', "'Stop' never waits. Stopped.");
      return say('Stopping.');
    case 'home':
      pilot.startHome(odo, S.now);
      intent('home', 'come back');
      verdict('RULE', "'Come back' never waits: he turns towards home and drives straight there.");
      return say(pilot.active ? 'Coming back to you.' : 'Okay.');
    case 'move':
    case 'point-move':
      if (r.kind === 'point-move') { S.pointed = null; S.finger = null; markPointed(); }  // a point goes with one command
      pilot.startMoves(MOVES[r.key], S.now);
      intent(r.key, `go ${r.key}`);
      verdict(r.kind === 'move' ? 'RULE' : 'ALLOWED', r.kind === 'move' ? `'Go ${r.key}' never waits.` : `No glow in his view, so Junior drives where you point (${r.key}).`);
      return say('On my way.');
    case 'trace': {
      S.traces += 1;
      W.addTrace(junior.position.x, junior.position.z);
      $('traces').textContent = S.traces;
      const cm = Math.round(Math.hypot(junior.position.x, junior.position.z) * 100);
      intent('this spot', 'mark a hazard');
      verdict('RULE', 'Logging a hazard never waits. A marker stays here for the next crew.');
      return say(`Hazard logged, ${cm} cm from home, ${g.glow ? pct(g.glow) + ' sure' : 'no glow seen'}.`);
    }
    case 'flare':
      intent('nothing', 'wait');
      verdict('REFUSED', "Flare: voice can't be trusted now. Use your hands and the squeeze.");
      return say('Flare. Use your hands.');
    case 'ask':
      S.askedAt = wall;
      intent('left or right?', 'ask');
      verdict(r.refused ? 'REFUSED' : 'RULE', r.refused ? "Can't tell which glow you mean. Asking instead." : `'That' could be ${r.n} glows and you did not point. Asking.`);
      return say('The left one or the right one?', 0.5);
    case 'look':
      intent('nothing', 'describe');
      verdict('', 'Nothing to move.');
      return say(describe(g));
    case 'chat':
      intent('nothing', 'nothing');
      verdict('', 'No rule matched. In the prototype a local language model answered here; this version has the rules only.');
      return say('Say that again, Marvin?', 0.5);
    case 'goto': {
      S.pointed = null; S.finger = null; markPointed();
      pilot.startGlow(r.pick.id, S.now);
      intent(`${r.pick.at} · 80% sure`, `drive to ${r.pick.at}`);
      verdict('ALLOWED', `${r.why[0].toUpperCase() + r.why.slice(1)} ${r.pick.at}.`);
      after(0.8, () => {  // never "On my way" without moving: already there, glow out of sight, or a hand took over
        if (!pilot.active || !(S.drive[0] || S.drive[1])) {
          verdict('ALLOWED', "But Junior isn't moving: the glow is out of sight or right in front of him, or your hand took over.");
          say('Okay.');
        } else say('On my way.');
      });
      return;
    }
  }
}
function describe(gl) {
  const b = gl.glow_blobs;
  if (gl.flare) return 'Too bright to see anything.';
  if (!b.length) return 'Nothing stands out.';
  if (b.length === 1) return `A glowing patch ${b[0].at}, ${pct(b[0].strength)} sure. Possible hazard.`;
  return `${['', 'One', 'Two', 'Three'][b.length]} glowing patches: ${b.map(x => x.at).join(', ')}. Possible hazards.`;
}
/** degrees from Junior's heading to a patch, + = right */
function bearing(p) {
  if (!p) return null;
  const dx = p.x - junior.position.x, dz = p.z - junior.position.z, h = junior.rotation.y;
  return Math.atan2(-(dx * Math.cos(h) - dz * Math.sin(h)), dx * Math.sin(h) + dz * Math.cos(h)) * DEG;
}

// ---------------------------------------------------------------- squeeze and flare
function squeeze() {
  S.view = S.view === 'outside' ? 'junior' : 'outside';
  S.pauseUntil = S.now + 0.5;  // every switch stops Junior first
  pilot.cancel('squeeze');
  if (S.view === 'junior') { S.wasGlowing = false; S.hazardSaidAt = -1e9; }  // his view takes over: he says again what he sees
  verdict('RULE', S.view === 'junior' ? "Squeeze: Junior's camera fills your visor. He stopped first." : 'Squeeze: your outside view is back. Junior stopped first.');
  const b = $('squeezebtn'); b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 160);
  updateView();
}
function updateView() {
  const j = S.view === 'junior';
  $('viewpill').textContent = j ? "Junior's camera" : 'Outside view';
  $('viewpill').classList.toggle('junior', j);
  $('insettag').textContent = j ? 'Outside view' : "Junior's camera";
  insetEl.classList.toggle('junior', !j);
}
function flare() {
  if (S.now < S.flareUntil) return;
  S.flareAt = S.now; S.flareUntil = S.now + 2.4;
  S.pauseUntil = Math.max(S.pauseUntil, S.now + 0.6);
  pilot.cancel('flare');
  verdict('RULE', 'Flare: Junior stopped and ignores what his camera sees until it fades. Hands and the squeeze still work.');
  say("Flare. Don't trust your eyes. Use your hands.");
}

// ---------------------------------------------------------------- inputs: keys, pad, buttons
const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowDown: 'down', KeyS: 'down', KeyX: 'fist' };
const keysHeld = new Set(), padHeld = new Set();
const playing = () => started && !intro.open;
addEventListener('keydown', e => {
  if (!playing() || e.ctrlKey || e.metaKey || e.altKey) return;
  const onButton = e.target instanceof Element && e.target.closest('button');
  if (e.code === 'Space') {
    if (onButton) return;  // a focused button keeps its own Space
    e.preventDefault();
    if (!e.repeat) gateOn();
    return;
  }
  if (KEYS[e.code]) { e.preventDefault(); keysHeld.add(KEYS[e.code]); return; }
  if (e.repeat) return;
  if (e.code === 'KeyV') squeeze();
  else if (e.code === 'KeyF') flare();
});
addEventListener('keyup', e => {
  if (e.code === 'Space' && S.gate) { e.preventDefault(); gateOff(); }
  if (KEYS[e.code]) keysHeld.delete(KEYS[e.code]);
});
function releaseAll() {
  keysHeld.clear(); padHeld.clear();
  document.querySelectorAll('.dock .down').forEach(b => b.classList.remove('down'));
  if (S.gate) gateOff();
}
addEventListener('blur', releaseAll);

// hold-to-drive pad (and Space/Enter on a focused pad button)
for (const b of document.querySelectorAll('[data-pad]')) {
  const k = b.dataset.pad;
  const down = () => { padHeld.add(k); b.classList.add('down'); };
  const up = () => { padHeld.delete(k); b.classList.remove('down'); };
  b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); down(); });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture', 'blur']) b.addEventListener(ev, up);
  b.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); e.stopPropagation(); down(); } });
  b.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); up(); } });
  b.addEventListener('contextmenu', e => e.preventDefault());
}
function gesture() {  // keys and pad as a hand: up = open hand, left/right = tilted, down = thumb down, X = fist
  const has = k => keysHeld.has(k) || padHeld.has(k);
  if (has('down')) return ['REVERSE', 0];
  if (has('fist')) return ['STOP', 0];
  if (has('up') || has('left') || has('right')) return ['FORWARD', (has('right') ? 45 : 0) - (has('left') ? 45 : 0)];
  return [null, 0];
}

// a mouse click on a button gives the focus back to the page, so Space talks again
const blurAfterPointer = el => el.addEventListener('pointerup', e => { if (e.pointerType) setTimeout(() => el.blur(), 0); });
$('squeezebtn').addEventListener('click', squeeze);
$('flarebtn').addEventListener('click', flare);
for (const c of document.querySelectorAll('[data-say]')) c.addEventListener('click', () => command(c.dataset.say, 1, 'button'));
document.querySelectorAll('.dock button, .tbtn').forEach(blurAfterPointer);
$('soundbtn').addEventListener('click', e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); audio.setSound(on); });
$('voicebtn').hidden = !audio.voiceAvailable();
$('voicebtn').addEventListener('click', e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); audio.setVoice(on); });

// talk: hold Space or the button (the gate)
const talk = $('talkbtn');
if (!voice.voiceSupported()) { talk.classList.add('off'); talk.querySelector('span').textContent = 'No voice here'; $('voicehint').textContent = 'Voice needs Chrome, Edge or Safari. The buttons say it for you.'; }
talk.addEventListener('pointerdown', e => { e.preventDefault(); talk.setPointerCapture?.(e.pointerId); gateOn(); });
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) talk.addEventListener(ev, () => gateOff());
talk.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); e.stopPropagation(); gateOn(); } });
talk.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); gateOff(); } });
talk.addEventListener('contextmenu', e => e.preventDefault());
function gateOn() {
  if (S.gate) return;
  if (!voice.voiceSupported()) { heard('Voice needs Chrome, Edge or Safari. Use the phrase buttons.'); return; }
  S.gate = true;
  talk.classList.add('down');
  $('listenpill').hidden = false;
  heard('Listening…');
  voice.listen({
    onInterim: t => { if (t) heard(`"${t}"`); },
    onFinish: ({ text, conf, error }) => {
      if (error === 'blocked' || error === 'not-allowed' || error === 'service-not-allowed') {
        heard('The microphone is blocked here. The phrase buttons say it for you.');
        talk.classList.add('off');
      } else if (error === 'network') heard('Speech recognition needs a connection. Use the phrase buttons.');
      else command(text, conf, 'voice');
    },
  });
}
function gateOff() {
  if (!S.gate) return;
  S.gate = false;
  talk.classList.remove('down');
  $('listenpill').hidden = true;
  audio.playTink();  // "got it"
  voice.stop();
}

// pointing: a 48 px target over each glow (click, tap or keyboard), and a click on a glow in the small view
const pointBtns = patches.map(p => {
  const b = Object.assign(document.createElement('button'), { type: 'button', className: 'pt' });
  b.setAttribute('aria-pressed', 'false');
  b.append(Object.assign(document.createElement('span'), { textContent: 'Point' }));
  b.addEventListener('click', () => pointAt(p.id));
  blurAfterPointer(b);
  $('points').append(b);
  return b;
});
function pointAt(id) {
  S.pointed = { id, t: performance.now() };
  markPointed();
  const p = patches.find(q => q.id === id), d = bearing(p);
  const where = Math.abs(d) < 15 ? 'ahead' : d > 0 ? `${Math.round(d)}° right` : `${Math.round(-d)}° left`;
  heard(`You point at the glow ${where}. Now say or press "Check that one".`);
}
function markPointed() {
  const id = S.pointed?.id;
  pointBtns.forEach((b, i) => { const on = patches[i].id === id; b.setAttribute('aria-pressed', on); b.querySelector('span').textContent = on ? 'Pointed' : 'Point'; });
  W.pointRing.visible = !!id;
  if (id) { const p = patches.find(q => q.id === id); W.pointRing.position.set(p.x, 0.004, p.z); }
}
stage.addEventListener('pointerdown', e => {
  if (!playing() || e.target.closest('button')) return;
  const r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  const ins = insetRect;
  if (x < ins.x || x > ins.x + ins.w || y < ins.y || y > ins.y + ins.h) return;
  const cam = S.view === 'junior' ? chase : eyeDetect;
  let best = null, bd = 36;
  for (const p of patches) {
    const v = p.centre.clone().project(cam);
    if (v.z > 1) continue;
    const d = Math.hypot(ins.x + (v.x + 1) / 2 * ins.w - x, ins.y + (1 - v.y) / 2 * ins.h - y);
    if (d < bd) { bd = d; best = p; }
  }
  if (best) pointAt(best.id);
});

// your own hand on camera (loaded only when you turn it on)
let hand = null;
$('handbtn').addEventListener('click', () => {
  if (hand?.handOn()) { hand.stopHand(); $('handbtn').setAttribute('aria-pressed', 'false'); $('handcam').hidden = true; return; }
  handOn();
});
// stream: the camera already opened by the start prompt, if any
async function handOn(stream) {
  const btn = $('handbtn');
  btn.setAttribute('aria-busy', 'true');
  $('handcam').hidden = false;
  try {
    hand = hand || await import('./hand.js');
    await hand.startHand($('handvideo'), s => { $('handlabel').textContent = s || 'No hand'; }, stream);
    btn.setAttribute('aria-pressed', 'true');
    heard('Your hand drives now: open hand to go, tilt to steer, fist to stop, thumb down to reverse. Point with your index finger.' +
      (voice.voiceSupported() ? ' Hold Space or Hold to talk to speak.' : ''));
  } catch (err) {
    hand?.stopHand?.();
    $('handcam').hidden = true;
    btn.setAttribute('aria-pressed', 'false');
    heard(err?.name === 'NotAllowedError' ? 'The camera is blocked here. The arrow keys and the pad still drive.'
      : err?.name === 'NotFoundError' ? 'No camera found. The arrow keys and the pad still drive.'
      : 'The hand tracker did not load. The arrow keys and the pad still drive.');
    console.warn(err);
  } finally { btn.removeAttribute('aria-busy'); }
}

// ---------------------------------------------------------------- cameras, sizes
const chase = new THREE.PerspectiveCamera(50, 16 / 9, 0.02, 60);
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
let placed = false;
let pr = Math.min(window.devicePixelRatio || 1, 1.5), sw = 0, sh = 0, insetRect = { x: 0, y: 0, w: 0, h: 0 }, crop = { W0: 1, H0: 1, ox: 0, oy: 0 };
function resize() {
  sw = stage.clientWidth; sh = stage.clientHeight;
  if (!sw || !sh) return;
  renderer.setPixelRatio(pr);
  renderer.setSize(sw, sh, false);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  overlay.width = Math.round(sw * dpr); overlay.height = Math.round(sh * dpr);
  octx.setTransform(dpr, 0, 0, dpr, 0, 0);
  insetRect = { x: insetEl.offsetLeft + 1, y: insetEl.offsetTop + 1, w: insetEl.clientWidth, h: insetEl.clientHeight };
  // Junior's camera fills the visor like a photo set to "cover": the 16:9 picture, cropped to the stage
  const a = 16 / 9;
  crop = sw / sh > a ? { W0: sw, H0: sw / a, ox: 0, oy: (sw / a - sh) / 2 } : { W0: sh * a, H0: sh, ox: (sh * a - sw) / 2, oy: 0 };
  eye.aspect = a;
  eye.setViewOffset(crop.W0, crop.H0, crop.ox, crop.oy, sw, sh);
  eye.updateProjectionMatrix();
  if (!running) render(0);
}
new ResizeObserver(resize).observe(stage);

// ---------------------------------------------------------------- the loop
let running = false, raf = 0, last = 0, visible = true, inView = true;
const shouldRun = () => started && !intro.open && visible && inView;
function wake() {
  if (shouldRun() && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
}
function sleep() {
  if (running) { cancelAnimationFrame(raf); running = false; }
  releaseAll();
  audio.setTickRate(0);
}
document.addEventListener('visibilitychange', () => {
  visible = document.visibilityState === 'visible';
  audio.suspendAudio(!visible);
  visible ? wake() : sleep();
});
new IntersectionObserver(([e]) => { inView = e.isIntersecting; inView ? wake() : sleep(); }).observe(stage);  // scrolled out of the page: pause
const _showModal = intro.showModal.bind(intro);
intro.showModal = () => { sleep(); _showModal(); };

let perfT = 0, perfN = 0, perfSum = 0, pilotWas = null;
function frame(t) {
  if (!shouldRun()) { running = false; return; }
  raf = requestAnimationFrame(frame);
  const dt = clamp((t - last) / 1000, 0, 0.25);
  last = t;
  step(dt, t);
  render(dt);
  // keep 60 fps on a modest laptop: lower the resolution once if frames run long
  perfSum += dt; perfN++;
  if (t - perfT > 2500) {
    const avg = perfSum / perfN;
    if (holdPr) { /* a still: keep the resolution */ } else if (avg > 1 / 45 && pr > 1) { pr = 1; resize(); } else if (avg > 1 / 32 && pr > 0.75) { pr = 0.75; resize(); }
    perfT = t; perfSum = 0; perfN = 0;
  }
}

function rockAhead() {  // the firmware's distance sensor: within 20 cm of a rock ahead nothing drives forward (27 cm to clear)
  const h = junior.rotation.y, fx = Math.sin(h), fz = Math.cos(h);
  const nx = junior.position.x + fx * LENGTH / 2, nz = junior.position.z + fz * LENGTH / 2;
  let ahead = Infinity;
  for (const r of blockers) {
    const dx = r.x - nx, dz = r.z - nz, along = dx * fx + dz * fz;
    if (along > 0 && Math.abs(dx * fz - dz * fx) < r.r + LENGTH * 0.4) ahead = Math.min(ahead, (Math.hypot(dx, dz) - r.r) * 100);
  }
  if (ahead <= STOP_CM) S.blocked = true;
  else if (ahead >= CLEAR_CM) S.blocked = false;
}

const nose = { x: 0, z: 0 };
function step(dt, wallNow) {
  S.now += dt;
  for (let i = later.length - 1; i >= 0; i--) if (later[i][0] <= S.now) { const [, fn] = later.splice(i, 1)[0]; fn(); }
  const flaring = S.now < S.flareUntil;
  const h = junior.rotation.y;
  nose.x = junior.position.x + Math.sin(h) * LENGTH * 0.45; nose.z = junior.position.z + Math.cos(h) * LENGTH * 0.45;
  g = pilot.show(detectGlows(eyeDetect, patches, blockers, nose, flaring));
  rockAhead();

  // the hand: keys and pad first, then your own hand on camera
  let [mode, angle] = gesture(), src = mode ? 'keys' : null, deg = null;
  if (!mode && hand?.handOn()) {
    const hs = hand.updateHand(wallNow, $('handcanvas'));
    deg = hs.deg;
    if (deg != null) { S.finger = { deg, t: performance.now() }; }
    if (hs.mode) {
      // a hand must stay 0.6 s to take over from the autopilot (counted from the start of the trip)
      S.handSince = pilot.active ? (S.handSince ?? S.now) : null;
      if (pilot.active && S.now - S.handSince < 0.6) src = 'waiting';
      else { mode = hs.mode; angle = hs.angle; src = 'camera'; }
    } else S.handSince = null;
    $('handlabel').textContent = deg != null ? `Pointing ${Math.abs(Math.round(deg))}° ${deg > 0 ? 'right' : 'left'}` : hs.seen ? label(hs.mode, hs.angle).join(' · ') : 'No hand';
  }
  let drive;
  if (S.now < S.pauseUntil) drive = [0, 0];
  else if (mode) {
    if (pilot.active) pilot.cancel('hand');  // a driving hand always wins
    drive = wheels(mode, angle);
  } else if (pilot.active) {
    drive = pilot.command(S.now, g, S.blocked);
    if (pilot.stuck) { pilot.stuck = false; say("Path blocked. I can't go there."); verdict('', 'Blocked: he tried to get round the rock and gave up.'); }
  } else drive = [0, 0];
  if (pilotWas && !pilot.active) pilotEnded(pilot.why);
  pilotWas = pilot.name;
  S.drive = drive;

  // what the firmware lets through, then differential drive (autopilot.Odometry)
  let [l, r] = drive;
  if (S.blocked) { l = Math.min(l, 0); r = Math.min(r, 0); }
  const vl = l * CM_PER_S_PER_PWM / 100, vr = r * CM_PER_S_PER_PWM / 100, v = (vl + vr) / 2, w = (vr - vl) / (WHEEL_BASE_CM / 100);
  junior.rotation.y += w * dt;
  junior.position.x += Math.sin(junior.rotation.y) * v * dt;
  junior.position.z += Math.cos(junior.rotation.y) * v * dt;
  for (const k of blockers) {  // never through a rock sideways or backwards
    const dx = junior.position.x - k.x, dz = junior.position.z - k.z, d = Math.hypot(dx, dz), min = k.r + LENGTH * 0.4;
    if (d < min && d > 0) { junior.position.x = k.x + dx / d * min; junior.position.z = k.z + dz / d * min; }
  }
  for (const [pivot, side, radius] of W.wheelPivots) pivot.rotation.x += (side < 0 ? vl : vr) * dt / radius;

  // Junior speaks up when a glow comes into his view (once, not on every flicker, never over a trip)
  const wall = performance.now();
  if (g.glow && !S.wasGlowing && !S.gate && !pilot.active && wall - S.hazardSaidAt > 30000) {
    say(`Possible hazard, ${g.glow_at}.`, 0.5);
    S.hazardSaidAt = wall;
  }
  S.wasGlowing = !!g.glow;
  if (S.pointed && wall - S.pointed.t > 12000) { S.pointed = null; markPointed(); }

  // Geiger ticks: silent until about a metre from the glow, faster the closer; never in a flare or over a voice
  const tb = g.glow_blobs.find(b => b.id === g.glow_id);
  if (tb) {
    const near = clamp((1.1 - tb.dist) / 0.75, 0, 1);
    tickNear += (near - tickNear) * (1 - Math.exp(-dt * (near > tickNear ? 9 : 1)));  // up fast, down slowly
  } else tickNear = 0;
  tickRate = tb && !g.flare && !S.gate && !audio.isSpeaking() && tickNear > 0.01 ? 3 + 27 * tickNear * tickNear : 0;
  audio.setTickRate(tickRate);

  hud(src, mode, angle, deg);
}

function pilotEnded(why) {
  const say_ = {
    arrived: () => verdict('', 'Arrived: about 30 cm in front of the glow. Listen to the ticks.'),
    home: () => verdict('', 'Home: back on the ring.'),
    'glow lost': () => verdict('', 'He lost sight of the glow and stopped.'),
    hand: () => verdict('RULE', 'Your hand took over from the autopilot.'),
  }[why];
  say_?.();
}

// ---------------------------------------------------------------- the visor HUD
const label = (mode, angle) => mode === 'FORWARD' ? ['Open hand', Math.abs(angle) > 12 ? `tilt ${Math.round(Math.abs(angle))}° ${angle > 0 ? 'right' : 'left'}` : 'straight']
  : mode === 'STOP' ? ['Fist', 'stop'] : mode === 'REVERSE' ? ['Thumb down', 'reverse'] : ['No hand', ''];
const memo = new Map();
const put = (id, v, prop = 'textContent') => { const k = id + prop; if (memo.get(k) !== v) { memo.set(k, v); $(id)[prop] = v; } };
function hud(src, mode, angle, deg) {
  let main, sub, icon = 'fist', tilt = 0, auto = false;
  if (S.now < S.pauseUntil) { main = 'Stopped'; sub = S.now < S.flareUntil ? 'flare' : 'squeeze: every switch stops him first'; }
  else if (mode) { [main, sub] = label(mode, angle); icon = { FORWARD: 'palm', REVERSE: 'thumbdown' }[mode] || 'fist'; tilt = mode === 'FORWARD' ? clamp(angle, -50, 50) : 0; sub = `${sub}${src === 'camera' ? ' · your hand' : ''}`; }
  else if (src === 'waiting') { main = 'Hand seen'; sub = 'hold it 0.6 s to take over'; icon = 'palm'; }
  else if (deg != null) { main = 'Pointing'; sub = `${Math.abs(Math.round(deg))}° ${deg > 0 ? 'right' : 'left'}`; icon = 'point'; }
  else if (pilot.active) { main = 'Auto'; sub = pilot.name; icon = 'auto'; auto = true; }
  else { main = 'No hand'; sub = 'Junior waits'; }
  put('gesture', main); put('gesturesub', sub);
  const gi = $('gesticon');
  if (memo.get('icon') !== icon) { memo.set('icon', icon); gi.firstElementChild.setAttribute('href', '#i-' + icon); }
  const tf = `rotate(${Math.round(tilt)}deg)`;
  if (memo.get('tilt') !== tf) { memo.set('tilt', tf); gi.style.transform = tf; }
  const nowEl = gi.parentElement; if (memo.get('auto') !== auto) { memo.set('auto', auto); nowEl.classList.toggle('auto', auto); }
  const gk = mode || '';
  if (memo.get('legend') !== gk) { memo.set('legend', gk); for (const li of $('legend').children) li.classList.toggle('on', li.dataset.g === gk); }
  put('wheels', `${S.drive[0]}, ${S.drive[1]}`);
  put('autopill', pilot.active ? `Auto: ${pilot.name}` : '');
  put('autopill', !pilot.active, 'hidden');
  put('obstaclepill', !S.blocked, 'hidden');
  const glow = g.glow && !g.flare;
  put('hazard', glow ? `Hazard ${g.glow_at} · ${pct(g.glow)} sure` : '');
  put('hazard', !glow, 'hidden');
  put('flarebanner', !g.flare, 'hidden');
  put('glowat', g.flare ? 'flare: ignored' : glow ? `${g.glow_at} · ${pct(g.glow)}` : 'none seen');
  const gw = pct(glow ? g.glow : 0);
  if (memo.get('gw') !== gw) { memo.set('gw', gw); $('glowbar').style.width = gw; $('glowmeter').setAttribute('aria-valuenow', Math.round((glow ? g.glow : 0) * 100)); }
  put('tickrate', tickRate ? `${Math.round(tickRate)} a second` : 'silent');
  const p = S.pointed && patches.find(q => q.id === S.pointed.id);
  put('pointat', p ? `glow ${(d => Math.abs(d) < 15 ? 'ahead' : d > 0 ? 'to the right' : 'to the left')(bearing(p))}` : deg != null ? `${Math.abs(Math.round(deg))}° ${deg > 0 ? 'right' : 'left'} (finger)` : 'nothing');
  const fresh = performance.now() - saidAt < 8000;
  if (memo.get('fresh') !== fresh) { memo.set('fresh', fresh); $('caption').classList.toggle('fresh', fresh); }
}

// ---------------------------------------------------------------- drawing
function render(dt) {
  if (!sw || !sh) return;
  const flaring = S.now < S.flareUntil, ft = S.now - S.flareAt;
  // a flare: everything glows for a moment, then fades (a steady, softer brightening with reduced motion)
  const boost = !flaring ? 0 : reduced.matches ? 0.35 : Math.min(1, ft / 0.08) * Math.exp(-Math.max(0, ft - 0.08) / 0.7);
  renderer.toneMappingExposure = 1.25 * (1 + 3.2 * boost);
  W.hemi.intensity = 1.1 * (1 + 2 * boost);
  const fo = (reduced.matches ? 0.5 : 0.75) * boost;
  if (memo.get('flash') !== fo.toFixed(2)) { memo.set('flash', fo.toFixed(2)); $('flash').style.opacity = fo.toFixed(2); }

  // the outside view: behind Junior, a little above, looking ahead (rigid with reduced motion: no sway)
  const h = junior.rotation.y, fwd = _a.set(Math.sin(h), 0, Math.cos(h));
  const wantPos = _b.copy(junior.position).addScaledVector(fwd, -1.05).setY(0.62);
  const wantLook = _c.copy(junior.position).addScaledVector(fwd, 0.9).setY(0.1);
  if (!placed || reduced.matches || !dt) { camPos.copy(wantPos); camLook.copy(wantLook); placed = true; }
  else { const k = 1 - Math.exp(-dt * 3); camPos.lerp(wantPos, k); camLook.lerp(wantLook, k); }
  chase.position.copy(camPos); chase.lookAt(camLook);
  // Marvin turns to keep Junior in sight
  const to = _a.copy(junior.position).sub(MARVIN).setY(0);
  if (W.marvin.children.length) W.marvin.rotation.y = Math.atan2(to.z, -to.x);  // the suit model faces -x
  W.sky.position.set(junior.position.x, 0, junior.position.z);
  W.sun.position.set(junior.position.x + 3, 4, junior.position.z - 2); W.sun.target.position.copy(junior.position);

  const jMain = S.view === 'junior';
  renderer.shadowMap.needsUpdate = true;
  chase.aspect = sw / sh; chase.updateProjectionMatrix();
  renderer.setViewport(0, 0, sw, sh); renderer.setScissor(0, 0, sw, sh);
  renderer.render(scene, jMain ? eye : chase);
  const ir = insetRect, y = sh - ir.y - ir.h;
  if (ir.w > 0) {
    chase.aspect = ir.w / ir.h; chase.updateProjectionMatrix();
    renderer.setViewport(ir.x, y, ir.w, ir.h); renderer.setScissor(ir.x, y, ir.w, ir.h);
    renderer.render(scene, jMain ? chase : eyeDetect);
    chase.aspect = sw / sh; chase.updateProjectionMatrix();
  }
  drawOverlay(jMain);
  placePoints(jMain ? eye : chase);
}

function drawOverlay(jMain) {
  octx.clearRect(0, 0, sw, sh);
  // the visor's faint crosshair
  octx.strokeStyle = 'rgba(236,237,240,.45)'; octx.lineWidth = 1;
  octx.beginPath(); octx.moveTo(sw / 2 - 7, sh / 2); octx.lineTo(sw / 2 + 7, sh / 2); octx.moveTo(sw / 2, sh / 2 - 7); octx.lineTo(sw / 2, sh / 2 + 7); octx.stroke();
  const b = g.glow_blobs.find(x => x.id === g.glow_id);
  if (!b || g.flare) return;
  // the amber box of glow.py: the cells of Junior's picture the glow lights, with how sure he is
  const [u, v, bw, bh] = b.cells;
  let x, y, w, h;
  if (jMain) { x = u * crop.W0 - crop.ox; y = v * crop.H0 - crop.oy; w = bw * crop.W0; h = bh * crop.H0; }
  else { const r = insetRect; x = r.x + u * r.w; y = r.y + v * r.h; w = bw * r.w; h = bh * r.h; }
  octx.save();
  if (!jMain) { octx.beginPath(); octx.rect(insetRect.x, insetRect.y, insetRect.w, insetRect.h); octx.clip(); }
  octx.strokeStyle = '#FFB547'; octx.lineWidth = jMain ? 2 : 1.5;
  octx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w), Math.round(h));
  const text = `GLOW ${pct(b.strength)}`;
  octx.font = `500 ${jMain ? 12 : 10}px "JetBrains Mono", ui-monospace, monospace`;
  const tw = octx.measureText(text).width + 8, th = jMain ? 18 : 15, ty = y - th >= (jMain ? 0 : insetRect.y) ? y - th : y;
  const tx = Math.round(clamp(x, jMain ? 0 : insetRect.x, (jMain ? sw : insetRect.x + insetRect.w) - tw));  // keep the label in the picture
  octx.fillStyle = 'rgba(30,18,0,.8)'; octx.fillRect(tx, Math.round(ty), tw, th);
  octx.fillStyle = '#FFB547'; octx.fillText(text, tx + 4, Math.round(ty) + th - (jMain ? 5 : 4));
  octx.restore();
}

const _p = new THREE.Vector3();
let ariaAt = 0;
function placePoints(cam) {
  const now = performance.now(), aria = now - ariaAt > 250;
  if (aria) ariaAt = now;
  patches.forEach((p, i) => {
    const b = pointBtns[i];
    _p.copy(p.centre).project(cam);
    const x = (_p.x + 1) / 2 * sw, y = (1 - _p.y) / 2 * sh;
    const off = _p.z > 1 || x < 8 || x > sw - 8 || y < 40 || y > sh - 8 || (S.now < S.flareUntil);
    if (memo.get('pt' + i) !== off) { memo.set('pt' + i, off); b.hidden = off; }
    if (!off) b.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    if (aria && !off) {
      const d = bearing(p), m = Math.hypot(p.x - junior.position.x, p.z - junior.position.z);
      b.setAttribute('aria-label', `Point at the glow ${m.toFixed(1)} m ${Math.abs(d) < 15 ? 'ahead' : d > 0 ? 'to the right' : 'to the left'}`);
      b.style.zIndex = String(100 - Math.round(m * 10));  // where two glows overlap on screen, the nearer one takes the tap
    }
  });
}

updateView();
