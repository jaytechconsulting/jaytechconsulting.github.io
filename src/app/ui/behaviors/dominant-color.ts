const SAMPLE_SIZE = 40;
const HUE_BINS = 24;

/** Most present vivid colour of an image, as `rgb(r, g, b)`: what the eye reads as "the colour of
 * this logo". Background (transparent, white, near-black, grey) is ignored; a logo with no vivid
 * colour falls back to its average dark tone. Resolves to null when the image cannot be read
 * (load error, or a cross-origin image served without CORS headers). Browser only. */
export function dominantColor(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onerror = () => resolve(null);
    image.onload = () => {
      try {
        resolve(pick(image));
      } catch {
        resolve(null);
      }
    };
    image.src = src;
  });
}

function pick(image: HTMLImageElement): string | null {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SAMPLE_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

  // Vivid pixels vote for their hue, weighted by saturation, so a small bright mark outweighs a
  // large dull area. Muted pixels are kept apart as the fallback.
  const bins = Array.from({ length: HUE_BINS }, () => ({ weight: 0, r: 0, g: 0, b: 0 }));
  const muted = { weight: 0, r: 0, g: 0, b: 0 };
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, alpha] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (alpha < 128) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 510;
    if (lightness > 0.93) continue;
    const chroma = max - min;
    const saturation = chroma === 0 ? 0 : chroma / (255 - Math.abs(max + min - 255));
    const target =
      // Pastels are saturated in HSL terms but read as background, so they do not vote.
      lightness > 0.78
        ? null
        : saturation < 0.25 || lightness < 0.08
          ? lightness < 0.6
            ? muted
            : null
          : bins[Math.floor((hue(r, g, b, max, chroma) / 360) * HUE_BINS) % HUE_BINS];
    if (!target) continue;
    const weight = target === muted ? 1 : saturation;
    target.weight += weight;
    target.r += r * weight;
    target.g += g * weight;
    target.b += b * weight;
  }

  const vivid = bins.reduce((best, bin) => (bin.weight > best.weight ? bin : best));
  const winner = vivid.weight > 0 ? vivid : muted;
  if (winner.weight === 0) return null;
  const channel = (sum: number) => Math.round(sum / winner.weight);
  return `rgb(${channel(winner.r)}, ${channel(winner.g)}, ${channel(winner.b)})`;
}

function hue(r: number, g: number, b: number, max: number, chroma: number): number {
  const sector =
    max === r ? ((g - b) / chroma) % 6 : max === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4;
  return (sector * 60 + 360) % 360;
}
