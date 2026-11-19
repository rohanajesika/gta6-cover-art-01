// Panel layouts for the cover: each layout splits the photo area (the part
// above the title band) into rectangles the photos fill. A panel is a
// fraction of the canvas: x, y, w, h in 0..1 plus an optional tilt in degrees.
// The title band always takes the bottom 24% of the cover height.

export const LAYOUTS = {
  hero: 'Hero Split',
  triptych: 'Triptych',
  tilted: 'Tilted Snapshots',
};

/** Returns the panel rectangles for a layout, in draw order. */
export function layoutPanels(layout, width, height) {
  const band = 0.24; // title band height, as a fraction of the cover height
  const photoH = 1 - band;
  if (layout === 'triptych') {
    const third = 1 / 3;
    return [
      { x: 0, y: 0, w: third, h: photoH, rot: 0 },
      { x: third, y: 0, w: third, h: photoH, rot: 0 },
      { x: 2 * third, y: 0, w: third, h: photoH, rot: 0 },
    ];
  }
  if (layout === 'tilted') {
    return [
      { x: 0, y: 0, w: 0.6, h: photoH, rot: 0 },
      { x: 0.58, y: 0.02, w: 0.42, h: photoH * 0.52, rot: 3 },
      { x: 0.6, y: photoH * 0.5, w: 0.4, h: photoH * 0.5, rot: -3 },
    ];
  }
  // hero: one tall panel on the left, two stacked panels on the right.
  return [
    { x: 0, y: 0, w: 0.58, h: photoH, rot: 0 },
    { x: 0.58, y: 0, w: 0.42, h: photoH / 2, rot: 0 },
    { x: 0.58, y: photoH / 2, w: 0.42, h: photoH / 2, rot: 0 },
  ];
}

/** Panel rectangles in canvas pixels, for hit-testing a pointer position. */
export function layoutPanelsPx(layout, width, height) {
  return layoutPanels(layout, width, height).map((p) => ({
    x: p.x * width,
    y: p.y * height,
    w: p.w * width,
    h: p.h * height,
    rot: p.rot,
  }));
}

/** The title band rectangle in canvas pixels. */
export function titleBandPx(width, height) {
  return { x: 0, y: height * 0.76, w: width, h: height * 0.24 };
}
