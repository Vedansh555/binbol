export type Stream = "wet" | "dry" | "hazardous" | "sanitary";

export interface Station {
  id: string;
  name: string;
  landmark: string;
  lat: number;
  lng: number;
}

// Seed campus bin stations, covering more of an IIT-Roorkee-shaped campus
// (bhawans, mess blocks, academic buildings, sports/library commons) so the
// demo doesn't look like it only handles 6 spots. Names and coordinates are
// placeholders — swap in the real bhawan/building names and GPS once you've
// actually walked the stations you'll pilot with; keep the `id` format
// (ZONE-NN) if you do, since the voice agent's system prompt and
// matchStationByText() below both reference these ids and landmark strings.
export const STATIONS: Station[] = [
  { id: "RJB-01", name: "Rajendra Bhawan - Dry", landmark: "Rajendra Bhawan, main gate", lat: 29.8657, lng: 77.8964 },
  { id: "RJB-03", name: "Rajendra Bhawan - Wet", landmark: "Rajendra Bhawan, behind mess", lat: 29.8659, lng: 77.8961 },
  { id: "GB-04", name: "Govind Bhawan - Mixed", landmark: "Govind Bhawan, common room side", lat: 29.8663, lng: 77.8955 },
  { id: "KB-02", name: "Kasturba Bhawan - Dry", landmark: "Kasturba Bhawan, near parking", lat: 29.8647, lng: 77.8981 },
  { id: "RVB-01", name: "Ravindra Bhawan - Wet", landmark: "Ravindra Bhawan, mess back gate", lat: 29.8641, lng: 77.8958 },
  { id: "AZB-02", name: "Azad Bhawan - Mixed", landmark: "Azad Bhawan, common room side", lat: 29.8668, lng: 77.8939 },
  { id: "JWB-01", name: "Jawahar Bhawan - Dry", landmark: "Jawahar Bhawan, main entrance", lat: 29.8675, lng: 77.8970 },
  { id: "CTB-02", name: "Cautley Bhawan - Wet", landmark: "Cautley Bhawan, mess side", lat: 29.8639, lng: 77.8990 },
  { id: "KMB-01", name: "Kumaon Bhawan - Mixed", landmark: "Kumaon Bhawan, parking lot", lat: 29.8682, lng: 77.8957 },
  { id: "RJV-01", name: "Rajiv Bhawan - Dry", landmark: "Rajiv Bhawan, near gym", lat: 29.8630, lng: 77.8973 },
  { id: "MESS-2", name: "Mess 2 - Wet", landmark: "Mess block 2, back door", lat: 29.8651, lng: 77.8972 },
  { id: "LHC-01", name: "Lecture Hall Complex - Mixed", landmark: "LHC main entrance", lat: 29.8671, lng: 77.8948 },
  { id: "LIB-01", name: "Central Library - Dry", landmark: "Central Library, entrance plaza", lat: 29.8665, lng: 77.8930 },
  { id: "SPC-01", name: "Sports Complex - Mixed", landmark: "Sports Complex, gate near stadium", lat: 29.8614, lng: 77.8946 },
  { id: "MMM-01", name: "MMM Bhawan Canteen - Wet", landmark: "MMM Bhawan, canteen area", lat: 29.8692, lng: 77.8964 },
  { id: "MAIN-01", name: "Main Building - Dry", landmark: "Main Building, front lawn", lat: 29.8656, lng: 77.8942 },
];

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
