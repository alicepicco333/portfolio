// Sound: the Geiger ticks of ticks.py (in the design they are a vibration in the glove; the laptop clicked instead),
// the short "got it" when you let go of the talk key, and, if you turn it on, Junior's lines in the browser's own voice.
// The prototype answered in cloned crew voices; those stay out of this public page.

const RATE = 48000;
let ctx = null, out = null, click = null, tink = null, timer = 0;
let rate = 0, next = Infinity, enabled = true;

export function startAudio() {
  if (ctx) return ctx.resume();
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC({ sampleRate: RATE });
  out = ctx.createGain(); out.gain.value = 0.6; out.connect(ctx.destination);
  // a Geiger tick: a dry crack, a 3 kHz ring gone in 1 ms, always the same (ticks.py)
  const n = RATE / 1000;
  click = ctx.createBuffer(1, n, RATE);
  const d = click.getChannelData(0);
  for (let k = 0; k < n; k++) d[k] = 0.55 * Math.cos(2 * Math.PI * 3000 * k / RATE) * Math.exp(-k / (RATE * 0.00015));
  // "got it": a short soft tone
  const m = Math.round(RATE * 0.07);
  tink = ctx.createBuffer(1, m, RATE);
  const e = tink.getChannelData(0);
  for (let k = 0; k < m; k++) e[k] = 0.18 * Math.sin(2 * Math.PI * 1760 * k / RATE) * Math.exp(-k / (RATE * 0.018));
  timer = setInterval(schedule, 25);
}

// Random (Poisson) arrivals, each the same crack, like a real counter: scheduled a little ahead on the audio clock.
function schedule() {
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime, until = now + 0.12;
  if (!(rate > 0) || !enabled) { next = Infinity; return; }
  if (!isFinite(next) || next < now) next = now + gap();
  while (next < until) {
    const s = ctx.createBufferSource(); s.buffer = click; s.connect(out); s.start(next);
    next += gap();
  }
}
const gap = () => -Math.log(1 - Math.random()) / rate;

/** ticks per second; 0 = silent */
export function setTickRate(r) { rate = r; }
export function setSound(on) { enabled = on; if (out) out.gain.value = on ? 0.6 : 0; }
export function suspendAudio(yes) { if (ctx) (yes ? ctx.suspend() : ctx.resume()).catch(() => {}); }
export function playTink() {
  if (!ctx || !enabled) return;
  const s = ctx.createBufferSource(); s.buffer = tink; s.connect(out); s.start();
}

// ---------------------------------------------------------------- Junior's voice (off by default)
let voiceOn = false, speakingUntil = 0;
export function setVoice(on) { voiceOn = on; if (!on && window.speechSynthesis) speechSynthesis.cancel(); }
export const voiceAvailable = () => 'speechSynthesis' in window;
export const isSpeaking = () => performance.now() < speakingUntil;
export function speakLine(text, unsure) {
  if (!voiceOn || !voiceAvailable() || !enabled) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB'; u.rate = unsure ? 0.86 : 1.02; u.pitch = 1.05;
  const v = speechSynthesis.getVoices().find(x => /^en(-|_)/i.test(x.lang) && /Daniel|Google UK English Male|Microsoft (Ryan|George)/i.test(x.name))
    || speechSynthesis.getVoices().find(x => /^en(-|_)/i.test(x.lang));
  if (v) u.voice = v;
  speakingUntil = performance.now() + 600 + text.length * 70;  // no ticks over his voice
  u.onend = () => { speakingUntil = performance.now() + 300; };
  speechSynthesis.speak(u);
}
