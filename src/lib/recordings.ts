// DJ sets hosted with the site, shown on /recordings with a built-in player.
// To add one: put the audio file in public/recordings/ and add an entry below.
// Sets hosted elsewhere (Mixcloud, SoundCloud) can still be added as links from the admin panel.

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
    src: "/recordings/apartment-zuri-pt1.m4a",
    duration: 3323,
  },
  {
    vol: "01",
    title: "Apartment Zuri Pt. 2",
    src: "/recordings/apartment-zuri-pt2.m4a",
    duration: 3816,
  },
];

/** The file name a set is saved under when downloaded, e.g. "Apartment Zuri - TheZuriXperience.m4a". */
export const downloadName = (r: HostedRecording) =>
  `${r.title.replace(/[\\/:*?"<>|]/g, "")} - TheZuriXperience${r.src.slice(r.src.lastIndexOf("."))}`;

/** Where the download button points: the file itself, which the site serves directly. */
export const downloadUrl = (r: HostedRecording) => r.src;
