// "Use your hand": your own webcam and MediaPipe Hand Landmarker in the browser, as the prototype did on the laptop.
// Nothing loads until you turn it on: then the browser asks for the camera, and the tracker (about 20 MB, once) comes
// from jsDelivr and Google's model store. The picture stays in this page.
import { classify, pointing } from './brain.js';

const VERSION = '1.2.2';  // @mediapipe/tasks-vision, pinned
const BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}`;
const MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]];
const LOST_GRACE = 0.16;  // s: junior_09 keeps the last command this long when the tracker blinks

let video = null, stream = null, landmarker = null, lastVideoTime = -1, lastRun = 0, on = false;
let state = { mode: null, angle: 0, deg: null, seen: false, at: 0 };

export const handState = () => state;
export const handOn = () => on;

// given: a camera stream already allowed at the start (one prompt for camera and microphone)
export async function startHand(videoEl, onStatus, given) {
  video = videoEl;
  if (!given) onStatus('Asking for your camera…');
  stream = given || await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: false });
  video.srcObject = stream;
  await video.play();
  if (!landmarker) {
    onStatus('Loading the hand tracker (about 20 MB, once)…');
    const { FilesetResolver, HandLandmarker } = await import(`${BASE}/vision_bundle.mjs`);
    const files = await FilesetResolver.forVisionTasks(`${BASE}/wasm`);
    const opts = delegate => ({ baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'VIDEO', numHands: 1 });
    try { landmarker = await HandLandmarker.createFromOptions(files, opts('GPU')); }
    catch { landmarker = await HandLandmarker.createFromOptions(files, opts('CPU')); }
  }
  on = true;
  onStatus('');
}

export function stopHand() {
  on = false;
  stream?.getTracks().forEach(t => t.stop());
  stream = null;
  if (video) video.srcObject = null;
  state = { mode: null, angle: 0, deg: null, seen: false, at: 0 };
}

/** Run the tracker on the newest camera frame (about 20 times a second) and draw the mirrored preview. */
export function updateHand(now, canvas) {
  if (!on || !landmarker || !video || video.readyState < 2) return state;
  if (now - lastRun < 48 || video.currentTime === lastVideoTime) return state;
  lastRun = now; lastVideoTime = video.currentTime;
  let res;
  try { res = landmarker.detectForVideo(video, now); } catch { return state; }
  // mirror it, like the prototype (MIRROR = True): your right is the picture's right
  const h = res.landmarks?.[0]?.map(p => ({ x: 1 - p.x, y: p.y }));
  if (h) {
    const deg = pointing(h);
    const [mode, angle] = deg == null ? classify(h) : [null, 0];
    state = { mode, angle, deg, seen: true, at: now, h };
  } else if (now - state.at > LOST_GRACE * 1000) {
    state = { mode: null, angle: 0, deg: null, seen: false, at: state.at };
  }
  draw(canvas);
  return state;
}

function draw(canvas) {
  const g = canvas.getContext('2d'), w = canvas.width, hgt = canvas.height;
  g.save(); g.translate(w, 0); g.scale(-1, 1);
  const vw = video.videoWidth || 4, vh = video.videoHeight || 3, s = Math.max(w / vw, hgt / vh);
  g.drawImage(video, (w - vw * s) / 2, (hgt - vh * s) / 2, vw * s, vh * s);
  g.restore();
  const h = state.seen ? state.h : null;
  if (!h) return;
  // landmarks are relative to the full video frame: map them through the same cover crop
  const vx = p => (w - vw * s) / 2 + p.x * vw * s, vy = p => (hgt - vh * s) / 2 + p.y * vh * s;
  g.strokeStyle = '#8FD9A4'; g.lineWidth = 2;
  g.beginPath();
  for (const [a, b] of LINKS) { g.moveTo(vx(h[a]), vy(h[a])); g.lineTo(vx(h[b]), vy(h[b])); }
  g.stroke();
  if (state.deg != null) { g.beginPath(); g.arc(vx(h[8]), vy(h[8]), 7, 0, 7); g.stroke(); }
}
