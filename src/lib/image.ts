// Phone camera photos are 3–8 MB, which blows past Vercel's ~4.5 MB request
// body limit once base64-encoded. Downscale to a max of 1024px on the long
// edge and re-encode as JPEG (~100–200 KB) — plenty for classification, and
// it also normalises HEIC/PNG uploads into a format the model accepts.
// Browser-only (uses Image + canvas).
const MAX_EDGE = 1024;

export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not process the photo."));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      // strip the "data:image/jpeg;base64," prefix
      resolve(canvas.toDataURL("image/jpeg", 0.82).split(",")[1]);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that photo — try taking it again."));
    };
    img.src = url;
  });
}

// Vercel's own errors (e.g. 413 payload too large) come back as plain text,
// so read text first instead of trusting res.json() — otherwise Safari
// surfaces a cryptic "string did not match the expected pattern".
export async function readJson<T>(res: Response): Promise<T> {
  const raw = await res.text();
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(
      res.status === 413
        ? "Photo too large — please try again."
        : `Server error (${res.status}). Please try again.`
    );
  }
}
