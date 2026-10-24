import { notFound } from "next/navigation";
import { findStation, binsFor } from "@/lib/stations";
import StationDetail from "./StationDetail";

export default async function StationPage({ params }: PageProps<"/stations/[id]">) {
  const { id } = await params;
  const station = findStation(id);
  if (!station) notFound();
  return <StationDetail station={station} bins={binsFor(station)} />;
}
