import ScanClient from "./[stationId]/ScanClient";

// Plain product scan: point the camera at any item, no bin QR needed.
export default function ScanPage() {
  return <ScanClient />;
}
