import { findStation } from "@/lib/stations";
import { notFound } from "next/navigation";
import ScanClient from "./ScanClient";

export default async function ScanPage({
  params,
}: PageProps<"/scan/[stationId]">) {
  const { stationId } = await params;
  const station = findStation(stationId);
  if (!station) notFound();

  return <ScanClient station={station} />;
}
