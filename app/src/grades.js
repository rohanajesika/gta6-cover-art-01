// Colour grades for the cover: each grade is a set of translucent overlays
// painted over the photos, plus the colours of the title band. All of them
// are drawn with canvas gradients, so the grade is part of the picture and
// travels with the exported PNG.

export const GRADES = {
  sunset: 'Vice Sunset',
  neon: 'Neon Nights',
  noir: 'Palm Noir',
};

function sunsetGrade() {
  return {
    sky: ['#ff9a3c', '#ff5e7a', '#b537f2'],
    wash: 'rgba(255, 94, 122, 0.22)',
    deep: 'rgba(43, 16, 66, 0.38)',
    bandTop: '#2b1042',
    bandBottom: '#ff5e3a',
    sun: '#ffd166',
    accent: '#ffd166',
  };
}

function neonGrade() {
  return {
    sky: ['#00e5ff', '#ff2fb3', '#7b2fff'],
    wash: 'rgba(255, 47, 179, 0.20)',
    deep: 'rgba(10, 8, 46, 0.42)',
    bandTop: '#0a082e',
    bandBottom: '#ff2fb3',
    sun: '#00e5ff',
    accent: '#00e5ff',
  };
}

function noirGrade() {
  return {
    sky: ['#f5e6c8', '#e08e6d', '#3d2b4f'],
    wash: 'rgba(20, 20, 30, 0.18)',
    deep: 'rgba(8, 8, 16, 0.55)',
    bandTop: '#0d0d14',
    bandBottom: '#3d2b4f',
    sun: '#f5e6c8',
    accent: '#f5e6c8',
  };
}

/** Returns the colour set for a grade id, falling back to Vice Sunset. */
export function gradeColours(grade) {
  if (grade === 'neon') return neonGrade();
  if (grade === 'noir') return noirGrade();
  return sunsetGrade();
}
