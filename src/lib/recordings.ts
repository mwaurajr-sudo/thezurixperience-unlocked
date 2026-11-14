// DJ sets shown on /recordings with a built-in player.
// The audio files are too big for the site itself (Cloudflare's limit is 25 MB a file), so they
// live in a Cloudflare R2 bucket. VITE_MEDIA_URL is that bucket's public address, set as a build
// variable in Cloudflare; without it the files are looked for in public/recordings/ (handy locally).
// To add a set: upload it to the bucket's recordings/ folder and add an entry below.
// Sets hosted elsewhere (Mixcloud, SoundCloud) can still be added as links from the admin panel.

const MEDIA_URL: string = (import.meta.env.VITE_MEDIA_URL || "").replace(/\/$/, "");

export type HostedRecording = {
  vol: string;
  title: string;
  src: string;
  /** Length in seconds, shown before the file has loaded. */
  duration: number;
};

export const hostedRecordings: HostedRecording[] = [
  {
    vol: "01",
    title: "Apartment Zuri",
    src: `${MEDIA_URL}/recordings/apartment-zuri-pt1.m4a`,
    duration: 3323,
  },
  {
    vol: "01",
    title: "Apartment Zuri Pt. 2",
    src: `${MEDIA_URL}/recordings/apartment-zuri-pt2.m4a`,
    duration: 3816,
  },
];

/** The file name a set is saved under when downloaded, e.g. "Apartment Zuri - TheZuriXperience.m4a". */
export const downloadName = (r: HostedRecording) =>
  `${r.title.replace(/[\\/:*?"<>|]/g, "")} - TheZuriXperience${r.src.slice(r.src.lastIndexOf("."))}`;

/** Where the download button points: the site's download route, which saves the file from R2 (see src/routes/api/recordings). */
export const downloadUrl = (r: HostedRecording) => `/api/recordings/download/${r.src.slice(r.src.lastIndexOf("/") + 1)}`;
