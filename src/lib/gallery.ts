// Photo volumes shown on /gallery. Each volume's photos live in public/gallery/<slug>/.
// To add a volume: drop its photos in a new folder there and add an entry below.

export type GalleryPhoto = {
  /** The photo, or for a clip the still frame shown while it loads. */
  src: string;
  width: number;
  height: number;
  /** Set for a short clip: the video file, played silently on the wall and with sound when opened. */
  video?: string;
};

export type GalleryVolume = {
  slug: string;
  vol: string;
  title: string;
  date: string;
  photos: GalleryPhoto[];
};

const photo = (slug: string, n: number, width = 960, height = 1280): GalleryPhoto => ({
  src: `/gallery/${slug}/${String(n).padStart(2, "0")}.jpg`,
  width,
  height,
});

// A clip saved as NN.mp4 with its still frame as NN-poster.jpg.
const clip = (slug: string, n: number, width = 720, height = 1280): GalleryPhoto => ({
  src: `/gallery/${slug}/${String(n).padStart(2, "0")}-poster.jpg`,
  video: `/gallery/${slug}/${String(n).padStart(2, "0")}.mp4`,
  width,
  height,
});

export const volumes: GalleryVolume[] = [
  {
    slug: "volume-1",
    vol: "01",
    title: "RnB Nights",
    date: "6th November",
    photos: [
      photo("volume-1", 16, 720, 1280),
      photo("volume-1", 17, 1280, 720),
      clip("volume-1", 14),
      photo("volume-1", 3),
      photo("volume-1", 4),
      photo("volume-1", 5),
      clip("volume-1", 21, 464, 832),
      clip("volume-1", 15, 576, 1024),
      photo("volume-1", 18, 1280, 1280),
      photo("volume-1", 8, 720, 1280),
      photo("volume-1", 19, 1280, 720),
      clip("volume-1", 22, 464, 832),
      photo("volume-1", 20, 960, 1280),
      photo("volume-1", 12, 720, 1280),
      photo("volume-1", 13, 720, 1280),
    ],
  },
];

export const findVolume = (slug: string) => volumes.find((v) => v.slug === slug);

/**
 * Where each photo lands on the wall. x and w are percent of the wall's width; y is measured
 * in the same units (percent of the width), so the wall can grow taller for bigger volumes.
 * r is a tilt in degrees. Hand-placed so the pile looks tossed rather than gridded;
 * volumes with more photos than slots repeat the pattern further down.
 */
const SLOTS = [
  { x: 2, y: 2, r: -7, w: 27 },
  { x: 35, y: 8, r: 4, w: 24 },
  { x: 68, y: 0, r: -3, w: 28 },
  { x: 15, y: 32, r: 6, w: 25 },
  { x: 49, y: 36, r: -5, w: 27 },
  { x: 77, y: 44, r: 8, w: 21 },
  { x: 0, y: 65, r: 3, w: 25 },
  { x: 29, y: 69, r: -8, w: 22 },
  { x: 58, y: 74, r: 5, w: 27 },
  { x: 9, y: 99, r: -4, w: 25 },
  { x: 43, y: 104, r: 7, w: 26 },
  { x: 74, y: 108, r: -6, w: 23 },
  { x: 20, y: 134, r: 5, w: 24 },
  { x: 55, y: 139, r: -4, w: 25 },
  { x: 1, y: 160, r: -9, w: 22 },
];

// How far down each repeat of the pattern starts, in percent of the wall's width.
const PATTERN_HEIGHT = 190;
// Border and caption around each print, in percent of the wall's width.
const FRAME = 6;

export const scatterLayout = (photos: GalleryPhoto[]) => {
  const placed = photos.map((p, i) => {
    const s = SLOTS[i % SLOTS.length];
    const y = s.y + Math.floor(i / SLOTS.length) * PATTERN_HEIGHT;
    return { ...s, y, bottom: y + (s.w * p.height) / p.width + FRAME };
  });
  // Wall height as a multiple of its width: just enough to hold the lowest print.
  const aspect = Math.max(...placed.map((s) => s.bottom), 100) / 100 + 0.04;
  const slots = placed.map(({ bottom: _bottom, ...s }) => ({ ...s, y: s.y / aspect }));
  return { aspect, slots };
};
