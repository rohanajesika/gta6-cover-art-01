// Draws the whole cover onto a canvas: multi-panel photos, a sunset or
// neon grade, palm silhouettes, and the bold title block. Every drawing
// primitive here is the app's own; no outside artwork is used anywhere.
//
// state: {
//   photos: [Image|null, ...]        photos loaded from the machine
//   panelPhoto: [0, 1, 2]            which photo fills each panel
//   adjust: [{zoom, dx, dy}, ...]    per-panel crop: zoom >= 1, offsets in px
//   layout: 'hero' | 'triptych' | 'tilted'
//   grade: 'sunset' | 'neon' | 'noir'
//   title: string, subtitle: string
// }

import { layoutPanels, titleBandPx } from './panels.js';
import { gradeColours } from './grades.js';

const GUTTER = 10; // white gutter between panels, in cover pixels at 1080 wide

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draws one image cover-fitting a rectangle, with zoom and pan offsets.
 *  adjust.fx / adjust.fy pan the photo as fractions of the panel size, so
 *  the same crop holds at every export size. */
export function drawPhotoInto(ctx, img, rect, adjust) {
  if (!img) return;
  const zoom = Math.max(1, adjust.zoom || 1);
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const maxDx = Math.max(0, (pw - rect.w) / 2);
  const maxDy = Math.max(0, (ph - rect.h) / 2);
  const dx = Math.max(-maxDx, Math.min(maxDx, (adjust.fx || 0) * rect.w));
  const dy = Math.max(-maxDy, Math.min(maxDy, (adjust.fy || 0) * rect.h));
  ctx.drawImage(img, rect.x + (rect.w - pw) / 2 + dx, rect.y + (rect.h - ph) / 2 + dy, pw, ph);
}

/** A palm silhouette: a leaning trunk and seven drooping fronds. The crown
 *  sits at the top of the trunk; each frond arcs out and droops down. */
export function drawPalm(ctx, x, y, size, colour) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineCap = 'round';
  // Trunk: a gentle lean from the base up to the crown.
  ctx.lineWidth = 0.11;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(0.1, -0.55, 0.3, -1.0);
  ctx.stroke();
  // Fronds: angles spread from left-up, over the top, to right-up; each
  // frond bends down toward its tip, like a real palm leaf.
  ctx.lineWidth = 0.075;
  const crownX = 0.3;
  const crownY = -1.0;
  for (let i = 0; i < 7; i += 1) {
    const angle = (-165 + i * 25) * (Math.PI / 180);
    const len = 0.66 - Math.abs(i - 3) * 0.04;
    const tipX = crownX + Math.cos(angle) * len;
    const tipY = crownY + Math.sin(angle) * len * 0.55 + len * 0.42;
    const ctrlX = crownX + Math.cos(angle) * len * 0.55;
    const ctrlY = crownY + Math.sin(angle) * len * 0.55 - len * 0.18;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
    ctx.stroke();
  }
  // Two coconuts under the crown.
  ctx.beginPath();
  ctx.arc(crownX - 0.06, crownY + 0.08, 0.06, 0, Math.PI * 2);
  ctx.arc(crownX + 0.07, crownY + 0.09, 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Halftone dots fading out from a corner, in the title band. */
function drawHalftone(ctx, x, y, w, h, colour) {
  const step = Math.max(14, w / 46);
  ctx.fillStyle = colour;
  for (let row = 0; row * step < h; row += 1) {
    for (let col = 0; col * step < w; col += 1) {
      const fade = 1 - (col * step) / w - (row * step) / h;
      if (fade <= 0) continue;
      const r = Math.max(1, step * 0.16 * fade);
      ctx.beginPath();
      ctx.arc(x + col * step + step / 2, y + row * step + step / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Specks of film grain, seeded so every export of the same cover matches. */
function drawGrain(ctx, w, h, seed) {
  const rand = mulberry32(seed);
  const count = Math.floor((w * h) / 2600);
  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const light = rand() > 0.5;
    ctx.fillStyle = light ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rand() * w, rand() * h, 2, 2);
  }
  ctx.restore();
}

/** Fits a line of text to a width by shrinking the font, never below a floor. */
function fitFont(ctx, text, fontFamily, startSize, maxWidth, weight) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${fontFamily}`;
  while (size > 16 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${fontFamily}`;
  }
  return size;
}

function drawTitleBlock(ctx, w, h, state, colours) {
  const band = titleBandPx(w, h);
  const sky = ctx.createLinearGradient(0, band.y, w, band.y + band.h);
  sky.addColorStop(0, colours.bandTop);
  sky.addColorStop(0.55, colours.sky[1]);
  sky.addColorStop(1, colours.bandBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(band.x, band.y, band.w, band.h);

  // Low sun sinking behind the title, high and to the right so it never
  // covers the subtitle line below.
  const sunR = band.h * 0.32;
  const sunX = w * 0.85;
  const sunY = band.y + band.h * 0.3;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.2);
  sunGlow.addColorStop(0, colours.sun);
  sunGlow.addColorStop(0.35, colours.sun + '55');
  sunGlow.addColorStop(1, colours.sun + '00');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(sunX - sunR * 2.2, sunY - sunR * 2.2, sunR * 4.4, sunR * 4.4);
  ctx.fillStyle = colours.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Palm silhouettes framing the band, left and right.
  drawPalm(ctx, w * 0.045, band.y + band.h * 0.98, band.h * 0.9, 'rgba(20, 8, 32, 0.85)');
  drawPalm(ctx, w * 0.94, band.y + band.h * 0.98, band.h * 0.72, 'rgba(20, 8, 32, 0.7)');

  // Halftone corner, top left of the band.
  ctx.save();
  ctx.globalAlpha = 0.5;
  drawHalftone(ctx, band.x + w * 0.02, band.y + band.h * 0.06, w * 0.2, band.h * 0.4, '#ffffff');
  ctx.restore();

  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  const pad = w * 0.055;
  const textW = w - pad * 2;

  if (title) {
    const size = fitFont(ctx, title, 'Anton, "Arial Black", sans-serif', band.h * 0.52, textW, '400');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(20, 8, 32, 0.9)';
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeText(title, w / 2, band.y + band.h * 0.38);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = colours.accent;
    ctx.shadowBlur = size * 0.22;
    ctx.fillText(title, w / 2, band.y + band.h * 0.38);
    ctx.shadowBlur = 0;
  }
  if (subtitle) {
    // The subtitle is letter-spaced, so its true width includes the gaps:
    // shrink the font until the spaced line fits the band.
    const gapFor = (size) => size * 0.22;
    const spacedWidth = (size) => {
      ctx.font = `400 ${size}px "Bebas Neue", "Arial Narrow", sans-serif`;
      const total = [...subtitle].reduce((sum, ch) => sum + ctx.measureText(ch).width, 0);
      return total + gapFor(size) * (subtitle.length - 1);
    };
    let size = band.h * 0.2;
    while (size > 14 && spacedWidth(size) > textW) size -= 2;
    const gap = gapFor(size);
    ctx.font = `400 ${size}px "Bebas Neue", "Arial Narrow", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colours.accent;
    const widths = [...subtitle].map((ch) => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (subtitle.length - 1);
    let cx = w / 2 - total / 2;
    [...subtitle].forEach((ch, i) => {
      ctx.fillText(ch, cx + widths[i] / 2, band.y + band.h * 0.82);
      cx += widths[i] + gap;
    });
  }
}

/** Draws the full cover for `state` onto `canvas` at its own pixel size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const colours = gradeColours(state.grade);
  const gutter = (GUTTER * w) / 1080;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const panels = layoutPanels(state.layout, w, h);
  panels.forEach((panel, i) => {
    const rect = {
      x: panel.x * w + gutter / 2,
      y: panel.y * h + gutter / 2,
      w: panel.w * w - gutter,
      h: panel.h * h - gutter,
    };
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    if (panel.rot) ctx.rotate((panel.rot * Math.PI) / 180);
    ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
    // White snapshot frame around the panel.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rect.x - gutter / 2, rect.y - gutter / 2, rect.w + gutter, rect.h + gutter);
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const photo = state.photos[state.panelPhoto[i]] || null;
    if (photo) {
      drawPhotoInto(ctx, photo, rect, state.adjust[i] || { zoom: 1, dx: 0, dy: 0 });
    } else {
      const sky = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      colours.sky.forEach((c, j) => sky.addColorStop(j / (colours.sky.length - 1), c));
      ctx.fillStyle = sky;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `400 ${Math.round(rect.h * 0.07)}px "Bebas Neue", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
    // Grade wash over the photo.
    ctx.fillStyle = colours.wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    const shade = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, colours.deep);
    ctx.fillStyle = shade;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    // Thin dark ink line around the panel, poster style.
    ctx.strokeStyle = 'rgba(20, 8, 32, 0.85)';
    ctx.lineWidth = Math.max(2, gutter * 0.35);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  drawTitleBlock(ctx, w, h, state, colours);

  // Vignette and grain over the whole cover.
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10, 4, 24, 0.28)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  drawGrain(ctx, w, h, 20261119);
}
