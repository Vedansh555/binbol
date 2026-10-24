import type { Report } from "./store";
import { findStation } from "./stations";

export interface RouteStop {
  stationId: string;
  stationName: string;
  landmark: string;
  stream: string;
  status: string;
  score: number;
}

/**
 * Urgency score straight from the BinBol deck's "Morning Run" slide:
 *   score = 3*overflow + 2*full + 1*mixed + 0.1*hoursWaiting + 2 if wet
 */
export function scoreReport(report: Report): number {
  let score = 0;
  if (report.status === "overflowing") score += 3;
  if (report.status === "full") score += 2;
  if (report.status === "mixed") score += 1;

  const hoursWaiting =
    (Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60);
  score += 0.1 * hoursWaiting;

  if (report.stream === "wet") score += 2;

  return Math.round(score * 10) / 10;
}

export function buildTodaysRoute(reports: Report[]): RouteStop[] {
  const open = reports.filter((r) => !r.clearedAt && r.status !== "ok");

  const stops = open
    .map((r) => {
      const station = findStation(r.stationId);
      return {
        stationId: r.stationId,
        stationName: station?.name ?? r.stationId,
        landmark: station?.landmark ?? "",
        stream: r.stream,
        status: r.status,
        score: scoreReport(r),
      };
    })
    .sort((a, b) => b.score - a.score);

  return stops;
}

export function routeBriefScript(stops: RouteStop[], lang: "hi" | "en" = "hi"): string {
  if (stops.length === 0) {
    return lang === "hi"
      ? "Aaj koi urgent bin nahi hai. Saare bins theek hain."
      : "No urgent bins today. Everything looks fine.";
  }

  const count = stops.length;
  if (lang === "hi") {
    const lines = stops
      .slice(0, 6)
      .map(
        (s, i) =>
          `${i + 1}. ${s.landmark || s.stationName}, ${streamHindi(s.stream)}, ${statusHindi(s.status)}.`
      )
      .join(" ");
    return `Aaj ka route, ${count} stops. ${lines}`;
  }

  const lines = stops
    .slice(0, 6)
    .map((s, i) => `${i + 1}. ${s.landmark || s.stationName}, ${s.stream}, ${s.status}.`)
    .join(" ");
  return `Today's route, ${count} stops. ${lines}`;
}

function streamHindi(stream: string): string {
  switch (stream) {
    case "wet":
      return "geela kachra";
    case "dry":
      return "sukha kachra";
    case "hazardous":
      return "khatarnak kachra";
    case "sanitary":
      return "sanitary waste";
    default:
      return stream;
  }
}

function statusHindi(status: string): string {
  switch (status) {
    case "overflowing":
      return "poora bhar gaya hai";
    case "full":
      return "bhar gaya hai";
    case "mixed":
      return "mila hua hai";
    default:
      return status;
  }
}
