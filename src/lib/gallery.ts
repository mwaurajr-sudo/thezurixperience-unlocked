// Photo volumes shown on /gallery. Each volume's photos live in public/gallery/<slug>/.
// To add a volume: drop its photos in a new folder there and add an entry below.

export type GalleryPhoto = {
  src: string;
  width: number;
  height: number;
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

export const volumes: GalleryVolume[] = [
  {
    slug: "volume-1",
    vol: "01",
    title: "RnB Nights",
    date: "6th November",
    photos: [
      photo("volume-1", 1),
      photo("volume-1", 2),
      photo("volume-1", 3),
      photo("volume-1", 4),
      photo("volume-1", 5),
      photo("volume-1", 6),
      photo("volume-1", 7, 720, 1280),
      photo("volume-1", 8, 720, 1280),
      photo("volume-1", 9),
      photo("volume-1", 10),
      photo("volume-1", 11),
    ],
  },
];

export const findVolume = (slug: string) => volumes.find((v) => v.slug === slug);

/**
 * Where each photo lands on the wall, in percent of the wall's width (x, w) and height (y),
 * plus a tilt in degrees. Hand-placed so the pile looks tossed rather than gridded;
 * volumes with more photos than slots repeat the pattern further down.
 */
const SLOTS = [
  { x: 2, y: 1, r: -7, w: 27 },
  { x: 35, y: 5, r: 4, w: 24 },
  { x: 68, y: 0, r: -3, w: 28 },
  { x: 15, y: 21, r: 6, w: 25 },
  { x: 49, y: 24, r: -5, w: 27 },
  { x: 77, y: 29, r: 8, w: 21 },
  { x: 0, y: 43, r: 3, w: 25 },
  { x: 29, y: 46, r: -8, w: 22 },
  { x: 58, y: 49, r: 5, w: 27 },
  { x: 9, y: 66, r: -4, w: 25 },
  { x: 43, y: 69, r: 7, w: 26 },
  { x: 72, y: 71, r: -6, w: 24 },
];

const ROWS_PER_PATTERN = 100;

export const scatterLayout = (count: number) => {
  const patterns = Math.max(1, Math.ceil(count / SLOTS.length));
  // Taller wall for more photos; y is then rescaled so every pattern gets its own band.
  const aspect = 1.5 * patterns;
  const slots = Array.from({ length: count }, (_, i) => {
    const s = SLOTS[i % SLOTS.length];
    const band = Math.floor(i / SLOTS.length);
    return { ...s, y: (s.y + band * ROWS_PER_PATTERN) / patterns };
  });
  return { aspect, slots };
};
