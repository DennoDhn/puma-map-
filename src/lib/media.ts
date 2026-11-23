import sharp from 'sharp';
import { HttpError } from './security';
export const MAX_UPLOAD = 6 * 1024 * 1024;
// Bound per-process native decoder work; callers also have persisted rate limits.
let active = 0;
export async function normalizeImage(request: Request) {
  if (active >= 2)
    throw new HttpError(503, 'Bildverarbeitung ausgelastet. Bitte erneut versuchen.');
  active++;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new HttpError(400, 'Bild fehlt.');
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_UPLOAD) {
        await reader.cancel();
        throw new HttpError(413, 'Maximal 6 MiB pro Bild.');
      }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks);
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const webp =
      bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    if (!jpeg && !png && !webp) throw new HttpError(415, 'Nur echte JPEG-, PNG- oder WebP-Bilder.');
    try {
      const source = sharp(bytes, {
        limitInputPixels: 24000000,
        failOn: 'warning',
        animated: true,
      });
      const meta = await source.metadata();
      if (!['jpeg', 'png', 'webp'].includes(meta.format ?? '') || (meta.pages ?? 1) !== 1)
        throw new Error('Unsupported image');
      // Fresh WebP encoding strips EXIF/GPS/XMP/ICC and any appended payload. Never retain originals.
      const full = await source
        .rotate()
        .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      const thumbnail = await sharp(full.data)
        .resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 76 })
        .toBuffer();
      if (full.data.length + thumbnail.length > 2 * 1024 * 1024)
        throw new HttpError(413, 'Optimiertes Bild zu groß. Bitte ein kleineres Bild wählen.');
      return {
        image: new Uint8Array(full.data),
        thumbnail: new Uint8Array(thumbnail),
        width: full.info.width,
        height: full.info.height,
      };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(415, 'Bild beschädigt, animiert oder größer als 24 Megapixel.');
    }
  } finally {
    active--;
  }
}
