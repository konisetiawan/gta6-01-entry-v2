import { Input } from './input.js';
import { World } from './world.js';
import { Renderer } from './render.js';
import { setShotScene } from './shots.js';

const canvas = document.getElementById('game');
if (!(canvas instanceof HTMLCanvasElement)) throw new Error('The game canvas is missing.');
const input = new Input(canvas);
const query = new URLSearchParams(location.search);
const parsedSeed = Number(query.get('seed') || 1);
const world = new World(Number.isFinite(parsedSeed) && parsedSeed !== 0 ? parsedSeed : 1);
const renderer = new Renderer(canvas);
setShotScene(world);

const status = document.getElementById('status');
let lastScene = '';
let audio = null;
let sirenOscillator = null;
let sirenGain = null;

function audioContext() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    if (!audio) audio = new Audio();
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    return audio;
  } catch {
    return null;
  }
}

function pickupBlip() {
  try {
    const context = audioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(740, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1120, context.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.09, context.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.17);
  } catch { /* Audio is optional. */ }
}

function syncSiren() {
  try {
    if (world.siren > 0) {
      const context = audioContext();
      if (!context) return;
      if (!sirenOscillator) {
        sirenOscillator = context.createOscillator();
        sirenGain = context.createGain();
        sirenOscillator.type = 'triangle';
        sirenGain.gain.setValueAtTime(0.0001, context.currentTime);
        sirenGain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.12);
        sirenOscillator.connect(sirenGain);
        sirenGain.connect(context.destination);
        sirenOscillator.start();
      }
      const sweep = 92 + (Math.sin(world.siren * 3.2) + 1) * 32;
      sirenOscillator.frequency.setTargetAtTime(sweep, context.currentTime, 0.08);
    } else if (sirenOscillator) {
      const oscillator = sirenOscillator;
      const gain = sirenGain;
      sirenOscillator = null;
      sirenGain = null;
      const context = audio;
      if (context && gain) {
        gain.gain.cancelScheduledValues(context.currentTime);
        gain.gain.setTargetAtTime(0.0001, context.currentTime, 0.035);
        oscillator.stop(context.currentTime + 0.18);
        oscillator.onended = () => { try { oscillator.disconnect(); gain.disconnect(); } catch { /* already disconnected */ } };
      }
    }
  } catch {
    sirenOscillator = null;
    sirenGain = null;
  }
}

world.pickupSound = pickupBlip;

function updateStatus() {
  if (world.scene === lastScene) return;
  lastScene = world.scene;
  const descriptions = {
    title: 'Solmar is ready. Click Start or press Enter.',
    play: 'The story is underway.',
    busted: 'The run ended. Click Play Again or press Enter.',
    complete: 'Story complete. Click Play Again or press Enter.',
  };
  if (status) status.textContent = descriptions[world.scene] || 'Solmar scene changed.';
}

function handleClick() {
  if (!input.consumeClick()) return;
  const rect = canvas.getBoundingClientRect();
  const screenX = rect.left + input.mouse.x * rect.width / 1280;
  const screenY = rect.top + input.mouse.y * rect.height / 720;
  const point = renderer.pointer(screenX, screenY);
  if (world.scene === 'title' && point.x >= 150 && point.x <= 445 && point.y >= 292 && point.y <= 377) {
    world.start();
  } else if ((world.scene === 'busted' || world.scene === 'complete') && point.x >= 305 && point.x <= 575 && point.y >= 450 && point.y <= 535) {
    world.reset();
    world.start();
  }
}

const step = 1 / 60;
let previous = 0;
let accumulated = 0;
function frame(now) {
  if (!previous) previous = now;
  accumulated += Math.min(0.25, Math.max(0, (now - previous) / 1000));
  previous = now;
  let drew = false;
  while (accumulated >= step) {
    handleClick();
    world.update(step, input);
    syncSiren();
    updateStatus();
    renderer.draw(world);
    drew = true;
    accumulated -= step;
  }
  if (!drew) renderer.draw(world);
  requestAnimationFrame(frame);
}
updateStatus();
renderer.draw(world);
requestAnimationFrame(frame);
