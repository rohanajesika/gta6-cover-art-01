// PNG export: draws the same cover at an exact post size and downloads it.
// The sizes are the three common post sizes the bounty asks for.

import { drawCover } from './cover.js';

export const EXPORT_SIZES = {
  square: { label: 'Square 1080 x 1080', width: 1080, height: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', width: 1080, height: 1350 },
  wide: { label: 'Wide 1920 x 1080', width: 1920, height: 1080 },
};

/** Renders the cover at a size and returns a PNG blob. */
export function renderExportPng(state, sizeId) {
  const size = EXPORT_SIZES[sizeId];
  if (!size) throw new Error(`unknown export size: ${sizeId}`);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  drawCover(canvas, state);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('the browser could not make the PNG'));
    }, 'image/png');
  });
}

/** Renders and downloads the cover PNG, named after the title. */
export async function exportCoverPng(state, sizeId) {
  const blob = await renderExportPng(state, sizeId);
  const size = EXPORT_SIZES[sizeId];
  const slug = (state.title || 'cover').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'cover';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vice-sunset-${slug}-${size.width}x${size.height}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return { width: size.width, height: size.height, bytes: blob.size };
}
