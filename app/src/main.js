// Vice Sunset Cover Studio — editor wiring: photo slots, panel crop, layout,
// grade, caption and export. Photos are read on the machine with FileReader
// and never leave it; the preview redraws live on every change.

import { drawCover } from './cover.js';
import { layoutPanelsPx, LAYOUTS } from './panels.js';
import { GRADES } from './grades.js';
import { EXPORT_SIZES, exportCoverPng, renderExportPng } from './export.js';
import { runShotScene, samplePhotosForEditor } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const statusEl = $('status');

const state = {
  photos: [null, null, null],
  panelPhoto: [0, 1, 0],
  adjust: [
    { zoom: 1, fx: 0, fy: 0 },
    { zoom: 1, fx: 0, fy: 0 },
    { zoom: 1, fx: 0, fy: 0 },
  ],
  layout: 'hero',
  grade: 'sunset',
  title: 'Sunset Heist',
  subtitle: 'Vice Sunset  -  One Last Score',
};
let selectedPanel = 0;
let exportSize = 'wide';

const fontsReady = (async () => {
  try {
    await Promise.all([
      document.fonts.load('400 100px Anton'),
      document.fonts.load('400 100px "Bebas Neue"'),
    ]);
    await document.fonts.ready;
  } catch {
    // The cover still draws with its fallback fonts.
  }
})();

function setStatus(text) {
  statusEl.textContent = text;
}

function previewSize() {
  return EXPORT_SIZES[exportSize];
}

function redraw() {
  const size = previewSize();
  if (canvas.width !== size.width || canvas.height !== size.height) {
    canvas.width = size.width;
    canvas.height = size.height;
  }
  drawCover(canvas, state);
  $('sizeNote').textContent = `Preview ${size.width} x ${size.height} — what you see is the PNG.`;
}

function refreshPanelButtons() {
  document.querySelectorAll('[data-panel]').forEach((button) => {
    button.classList.toggle('active', Number(button.dataset.panel) === selectedPanel);
  });
  const adjust = state.adjust[selectedPanel];
  $('zoom').value = String(adjust.zoom);
  $('zoomValue').textContent = `${Math.round(adjust.zoom * 100)}%`;
  $('photoSource').value = String(state.panelPhoto[selectedPanel]);
}

function refreshSlotButtons() {
  state.photos.forEach((photo, i) => {
    const button = $(`slot${i + 1}`);
    button.classList.toggle('loaded', Boolean(photo));
    button.querySelector('.slot-label').textContent = photo ? `Photo ${i + 1} loaded` : `Photo ${i + 1} — choose a file`;
  });
}

function readPhotoFile(file, slot) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state.photos[slot] = img;
        refreshSlotButtons();
        redraw();
        setStatus(`Photo ${slot + 1} loaded — drag it in its panel to position it.`);
        resolve();
      };
      img.onerror = () => reject(new Error('that file is not a readable image'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('the file could not be read'));
    reader.readAsDataURL(file);
  });
}

function buildRadioGroup(container, options, name, current, onPick) {
  Object.entries(options).forEach(([value, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.textContent = label;
    button.setAttribute('aria-pressed', String(value === current));
    button.addEventListener('click', () => {
      container.querySelectorAll('.choice').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
      onPick(value);
    });
    container.appendChild(button);
  });
}

async function loadSamplePhotos() {
  try {
    const [boulevard, pier] = await samplePhotosForEditor();
    state.photos[0] = boulevard;
    state.photos[1] = pier;
    state.panelPhoto = [0, 1, 0];
    refreshSlotButtons();
    refreshPanelButtons();
    redraw();
    setStatus('Sample photos loaded — try a layout, a grade, then export.');
  } catch {
    setStatus('The sample photos could not be loaded. Choose your own files instead.');
  }
}

function panelAtPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  const panels = layoutPanelsPx(state.layout, canvas.width, canvas.height);
  for (let i = panels.length - 1; i >= 0; i -= 1) {
    const p = panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return { index: i, x, y, panel: p };
  }
  return null;
}

function wireDrag() {
  let drag = null;
  canvas.addEventListener('pointerdown', (event) => {
    const hit = panelAtPoint(event.clientX, event.clientY);
    if (!hit) return;
    selectedPanel = hit.index;
    refreshPanelButtons();
    drag = { panel: hit.index, lastX: hit.x, lastY: hit.y, rect: hit.panel };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const hit = panelAtPoint(event.clientX, event.clientY);
    if (!hit) return;
    const adjust = state.adjust[drag.panel];
    adjust.fx += (hit.x - drag.lastX) / drag.rect.w;
    adjust.fy += (hit.y - drag.lastY) / drag.rect.h;
    drag.lastX = hit.x;
    drag.lastY = hit.y;
    redraw();
  });
  const endDrag = () => {
    if (drag) setStatus(`Panel ${drag.panel + 1} positioned — zoom or export when ready.`);
    drag = null;
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
}

function wireControls() {
  state.photos.forEach((_, i) => {
    const input = $(`file${i + 1}`);
    $(`slot${i + 1}`).addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (file) readPhotoFile(file, i).catch((error) => setStatus(error.message));
      input.value = '';
    });
  });
  $('samples').addEventListener('click', loadSamplePhotos);

  document.querySelectorAll('[data-panel]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedPanel = Number(button.dataset.panel);
      refreshPanelButtons();
    });
  });
  $('photoSource').addEventListener('change', (event) => {
    state.panelPhoto[selectedPanel] = Number(event.target.value);
    redraw();
  });
  $('zoom').addEventListener('input', (event) => {
    state.adjust[selectedPanel].zoom = Number(event.target.value);
    $('zoomValue').textContent = `${Math.round(state.adjust[selectedPanel].zoom * 100)}%`;
    redraw();
  });
  $('fit').addEventListener('click', () => {
    state.adjust[selectedPanel] = { zoom: 1, fx: 0, fy: 0 };
    refreshPanelButtons();
    redraw();
    setStatus(`Panel ${selectedPanel + 1} fit to its frame.`);
  });
  $('fill').addEventListener('click', () => {
    state.adjust[selectedPanel] = { zoom: 1.35, fx: 0, fy: 0 };
    refreshPanelButtons();
    redraw();
    setStatus(`Panel ${selectedPanel + 1} filled — drag to reposition.`);
  });

  buildRadioGroup($('layouts'), LAYOUTS, 'layout', state.layout, (value) => {
    state.layout = value;
    redraw();
  });
  buildRadioGroup($('grades'), GRADES, 'grade', state.grade, (value) => {
    state.grade = value;
    redraw();
  });
  buildRadioGroup($('sizes'), Object.fromEntries(Object.entries(EXPORT_SIZES).map(([k, v]) => [k, v.label])), 'size', exportSize, (value) => {
    exportSize = value;
    redraw();
  });

  $('title').addEventListener('input', (event) => {
    state.title = event.target.value;
    redraw();
  });
  $('subtitle').addEventListener('input', (event) => {
    state.subtitle = event.target.value;
    redraw();
  });
  $('exportBtn').addEventListener('click', async () => {
    $('exportBtn').disabled = true;
    setStatus('Rendering your PNG…');
    try {
      const result = await exportCoverPng(state, exportSize);
      setStatus(`Exported ${result.width} x ${result.height} PNG (${Math.round(result.bytes / 1024)} KiB) — check your downloads.`);
    } catch (error) {
      setStatus(`Export failed: ${error.message}`);
    } finally {
      $('exportBtn').disabled = false;
    }
  });
  wireDrag();
}

// Test hook for the maker's own checks: renders an export in-page and
// returns its PNG data URL, so sizes can be verified without a download.
window.__viceStudio = {
  state,
  renderExportPng: (sizeId) => renderExportPng(state, sizeId).then((blob) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  })),
};

async function start() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  wireControls();
  refreshSlotButtons();
  refreshPanelButtons();
  if (shot && shot !== 'editor') {
    const sceneState = await runShotScene(canvas, shot, () => fontsReady);
    Object.assign(state, sceneState);
    return;
  }
  await fontsReady;
  redraw();
  if (shot === 'editor') {
    await loadSamplePhotos();
    window.__shotReady = true;
  } else {
    window.__shotReady = true;
  }
}

start().catch((error) => setStatus(`Could not start: ${error.message}`));
