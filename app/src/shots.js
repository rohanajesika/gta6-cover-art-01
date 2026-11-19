// Screenshot scenes for the entry's screenshots/ folder, driven by ?shot=.
//   ?shot=cover    a 1920 x 1080 cover, full frame (the entry's first screenshot)
//   ?shot=portrait a 1080 x 1350 cover, full frame
//   ?shot=square   a 1080 x 1080 cover, full frame
//   ?shot=editor   the editor with the sample photos loaded
// Each scene loads the bundled sample photos, draws, then sets
// window.__shotReady so the screenshot driver knows the frame is done.

import { drawCover } from './cover.js';

const SAMPLES = ['./samples/boulevard.jpg', './samples/pier.jpg'];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function sampleState() {
  const [boulevard, pier] = await Promise.all(SAMPLES.map(loadImage));
  return {
    photos: [boulevard, pier, pier],
    panelPhoto: [0, 1, 0],
    adjust: [
      { zoom: 1, fx: 0, fy: 0 },
      { zoom: 1, fx: 0, fy: 0 },
      { zoom: 1.15, fx: 0, fy: 0 },
    ],
    layout: 'hero',
    grade: 'sunset',
    title: 'Sunset Heist',
    subtitle: 'Vice Sunset  -  One Last Score',
  };
}

/** Runs a ?shot= scene on `canvas` and resolves when it is ready to shoot. */
export async function runShotScene(canvas, shot, loadFonts) {
  document.body.classList.add('shot');
  await loadFonts();
  const state = await sampleState();
  if (shot === 'portrait') {
    canvas.width = 1080;
    canvas.height = 1350;
  } else if (shot === 'square') {
    canvas.width = 1080;
    canvas.height = 1080;
  } else {
    canvas.width = 1920;
    canvas.height = 1080;
  }
  drawCover(canvas, state);
  window.__shotReady = true;
  window.__shotState = state;
  return state;
}

/** The editor scene: hands the sample state to the editor to load. */
export async function samplePhotosForEditor() {
  const [boulevard, pier] = await Promise.all(SAMPLES.map(loadImage));
  return [boulevard, pier];
}
