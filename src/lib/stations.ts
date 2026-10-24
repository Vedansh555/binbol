export type Stream = "wet" | "dry" | "hazardous" | "sanitary";

export interface Station {
  id: string;
  name: string;
  landmark: string;
  lat: number;
  lng: number;
  // bins at this spot per stream; placeholder layout until surveyed
  bins: Record<Stream, number>;
}

// Seed campus bin stations, covering more of an IIT-Roorkee-shaped campus
// (bhawans, mess blocks, academic buildings, sports/library commons) so the
// demo doesn't look like it only handles 6 spots. Names and coordinates are
// placeholders — swap in the real bhawan/building names and GPS once you've
// actually walked the stations you'll pilot with; keep the `id` format
// (ZONE-NN) if you do, since the voice agent's system prompt and
// matchStationByText() below both reference these ids and landmark strings.
export const STATIONS: Station[] = [
  { id: "RJB-01", name: "Rajendra Bhawan - Dry", landmark: "Rajendra Bhawan, main gate", lat: 29.8657, lng: 77.8964, bins: { wet: 2, dry: 4, hazardous: 0, sanitary: 1 } },
  { id: "RJB-03", name: "Rajendra Bhawan - Wet", landmark: "Rajendra Bhawan, behind mess", lat: 29.8659, lng: 77.8961, bins: { wet: 3, dry: 3, hazardous: 0, sanitary: 0 } },
  { id: "GB-04", name: "Govind Bhawan - Mixed", landmark: "Govind Bhawan, common room side", lat: 29.8663, lng: 77.8955, bins: { wet: 2, dry: 3, hazardous: 1, sanitary: 1 } },
  { id: "KB-02", name: "Kasturba Bhawan - Dry", landmark: "Kasturba Bhawan, near parking", lat: 29.8647, lng: 77.8981, bins: { wet: 2, dry: 4, hazardous: 0, sanitary: 1 } },
  { id: "RVB-01", name: "Ravindra Bhawan - Wet", landmark: "Ravindra Bhawan, mess back gate", lat: 29.8641, lng: 77.8958, bins: { wet: 3, dry: 3, hazardous: 0, sanitary: 0 } },
  { id: "AZB-02", name: "Azad Bhawan - Mixed", landmark: "Azad Bhawan, common room side", lat: 29.8668, lng: 77.8939, bins: { wet: 2, dry: 3, hazardous: 0, sanitary: 1 } },
  { id: "JWB-01", name: "Jawahar Bhawan - Dry", landmark: "Jawahar Bhawan, main entrance", lat: 29.8675, lng: 77.8970, bins: { wet: 2, dry: 4, hazardous: 0, sanitary: 1 } },
  { id: "CTB-02", name: "Cautley Bhawan - Wet", landmark: "Cautley Bhawan, mess side", lat: 29.8639, lng: 77.8990, bins: { wet: 3, dry: 3, hazardous: 0, sanitary: 0 } },
  { id: "KMB-01", name: "Kumaon Bhawan - Mixed", landmark: "Kumaon Bhawan, parking lot", lat: 29.8682, lng: 77.8957, bins: { wet: 2, dry: 3, hazardous: 1, sanitary: 1 } },
  { id: "RJV-01", name: "Rajiv Bhawan - Dry", landmark: "Rajiv Bhawan, near gym", lat: 29.8630, lng: 77.8973, bins: { wet: 2, dry: 4, hazardous: 0, sanitary: 1 } },
  { id: "MESS-2", name: "Mess 2 - Wet", landmark: "Mess block 2, back door", lat: 29.8651, lng: 77.8972, bins: { wet: 4, dry: 3, hazardous: 0, sanitary: 0 } },
  { id: "LHC-01", name: "Lecture Hall Complex - Mixed", landmark: "LHC main entrance", lat: 29.8671, lng: 77.8948, bins: { wet: 2, dry: 4, hazardous: 1, sanitary: 0 } },
  { id: "LIB-01", name: "Central Library - Dry", landmark: "Central Library, entrance plaza", lat: 29.8665, lng: 77.8930, bins: { wet: 1, dry: 4, hazardous: 1, sanitary: 0 } },
  { id: "SPC-01", name: "Sports Complex - Mixed", landmark: "Sports Complex, gate near stadium", lat: 29.8614, lng: 77.8946, bins: { wet: 2, dry: 4, hazardous: 0, sanitary: 0 } },
  { id: "MMM-01", name: "MMM Bhawan Canteen - Wet", landmark: "MMM Bhawan, canteen area", lat: 29.8692, lng: 77.8964, bins: { wet: 3, dry: 3, hazardous: 0, sanitary: 0 } },
  { id: "MAIN-01", name: "Main Building - Dry", landmark: "Main Building, front lawn", lat: 29.8656, lng: 77.8942, bins: { wet: 2, dry: 4, hazardous: 1, sanitary: 0 } },
];

export interface Bin {
  id: string;
  stream: Stream;
  spot: string; // exact place within the station
  fill: number; // estimated %, 0-100
}

// Where bins typically sit inside a bhawan/building. Placeholder until the
// pilot walk-through records the real spots.
const SPOTS = [
  "Ground floor, near main stairs",
  "Outside main gate",
  "First floor corridor, east wing",
  "Mess entrance",
  "Common room, beside water cooler",
  "Back courtyard",
  "Second floor landing",
  "Parking side wall",
  "Reception / warden office",
  "Near cycle stand",
];

// Small deterministic hash so a bin's placeholder spot/fill stays stable
// between renders and deploys.
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return Math.abs(h);
}

const STREAM_CODE: Record<Stream, string> = { wet: "W", dry: "D", hazardous: "H", sanitary: "S" };

// Individual bins at a station. Fill is an estimate (time since last
// pickup); live staff reports override it on the station page.
export function binsFor(station: Station): Bin[] {
  const out: Bin[] = [];
  const offset = hash(station.id) % SPOTS.length;
  let n = 0;
  for (const stream of ["wet", "dry", "hazardous", "sanitary"] as Stream[]) {
    for (let i = 0; i < station.bins[stream]; i++) {
      const id = `${station.id}-${STREAM_CODE[stream]}${i + 1}`;
      out.push({
        id,
        stream,
        spot: SPOTS[(offset + n * 3) % SPOTS.length],
        fill: 12 + (hash(id) % 80),
      });
      n++;
    }
  }
  return out;
}

export function findStation(id: string): Station | undefined {
  return STATIONS.find((s) => s.id === id);
}

// Very rough free-text landmark matcher for the voice agent ("peeche wala
// hara bin"-style phrases won't match this directly — the ElevenLabs agent
// should pass a station id once it has disambiguated with the caller).
export function matchStationByText(text: string): Station | undefined {
  const t = text.toLowerCase();
  return STATIONS.find(
    (s) =>
      t.includes(s.id.toLowerCase()) ||
      t.includes(s.landmark.toLowerCase()) ||
      s.name
        .toLowerCase()
        .split(" ")
        .some((word) => word.length > 3 && t.includes(word))
  );
}
