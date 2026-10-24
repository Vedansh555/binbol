export type Stream = "wet" | "dry" | "hazardous" | "sanitary";

export interface Station {
  id: string;
  name: string;
  landmark: string;
  lat: number;
  lng: number;
}

// Seed campus bin stations — matches the names used in the BinBol deck demo.
// Swap lat/lng for real IIT Roorkee coordinates before the live demo if you
// want the route map to look right; they're placeholder offsets for now.
export const STATIONS: Station[] = [
  { id: "RJB-01", name: "Rajendra Bhawan - Dry", landmark: "Rajendra Bhawan, main gate", lat: 29.8657, lng: 77.8964 },
  { id: "RJB-03", name: "Rajendra Bhawan - Wet", landmark: "Rajendra Bhawan, behind mess", lat: 29.8659, lng: 77.8961 },
  { id: "MESS-2", name: "Mess 2 - Wet", landmark: "Mess block 2, back door", lat: 29.8651, lng: 77.8972 },
  { id: "GB-04", name: "Govind Bhawan - Mixed", landmark: "Govind Bhawan, common room side", lat: 29.8663, lng: 77.8955 },
  { id: "KB-02", name: "Kasturba Bhawan - Dry", landmark: "Kasturba Bhawan, near parking", lat: 29.8647, lng: 77.8981 },
  { id: "LHC-01", name: "Lecture Hall Complex - Mixed", landmark: "LHC main entrance", lat: 29.8671, lng: 77.8948 },
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
