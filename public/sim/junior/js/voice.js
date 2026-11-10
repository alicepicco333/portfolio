// Push-to-talk with the browser's speech recognition (Web Speech API: Chrome, Edge, Safari). The prototype ran
// Whisper on the laptop; a browser has no Whisper, so the browser's recogniser stands in. Junior only listens while
// the talk key or button is held (the gate), as in the prototype.

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const voiceSupported = () => !!SR;

let rec = null, finals = [], interim = '', confs = [], onDone = null, blocked = false;

/** Start listening. onInterim(text) while speaking; onDone({ text, conf, error }) after stop(). */
export function listen({ onInterim, onFinish }) {
  if (!SR || blocked) { onFinish?.({ text: '', conf: 0, error: blocked ? 'blocked' : 'unsupported' }); return false; }
  stopNow();
  finals = []; interim = ''; confs = []; onDone = onFinish;
  rec = new SR();
  rec.lang = 'en-US';
  rec.interimResults = true;
  rec.continuous = true;
  rec.maxAlternatives = 1;
  let error = null;
  rec.onresult = e => {
    interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) { finals.push(r[0].transcript); if (r[0].confidence > 0) confs.push(r[0].confidence); }
      else interim += r[0].transcript;
    }
    onInterim?.((finals.join(' ') + ' ' + interim).trim());
  };
  rec.onerror = e => {
    error = e.error;
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') blocked = true;
  };
  rec.onend = () => {
    const text = (finals.join(' ') + ' ' + interim).replace(/\s+/g, ' ').trim();
    const conf = confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : text ? 0.7 : 0;
    const done = onDone; onDone = null; rec = null;
    done?.({ text, conf, error });
  };
  try { rec.start(); } catch (err) { rec = null; onFinish?.({ text: '', conf: 0, error: 'start' }); return false; }
  return true;
}

/** Let go of the gate: the recogniser hands in what it heard, then onFinish runs. */
export function stop() { try { rec?.stop(); } catch { /* already stopped */ } }
export function stopNow() { if (rec) { onDone = null; try { rec.abort(); } catch { /* gone */ } rec = null; } }
