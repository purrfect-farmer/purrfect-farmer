import { convertIndexedToRgb, decode } from "fast-png";

/** Piece pixels at or above this alpha count as part of the piece */
const ALPHA_THRESHOLD = 128;

/** How far outside the piece outline the ring used for shading is sampled */
const RING_DISTANCE = 2;

/** Decode a base64 PNG data URL to 8-bit RGBA pixels */
export function decodeDataImage(dataUrl) {
  const base64 = String(dataUrl).replace(/^data:[^,]*,/, "");
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const png = decode(bytes);

  const data = png.palette ? convertIndexedToRgb(png) : png.data;
  const channels = png.palette ? png.palette[0].length : png.channels;
  const shift = png.depth === 16 ? 8 : 0;
  const pixels = png.width * png.height;
  const rgba = new Uint8ClampedArray(pixels * 4);

  for (let i = 0; i < pixels; i++) {
    const read = (c) => data[i * channels + c] >> shift;
    const gray = channels < 3;

    rgba[i * 4] = read(0);
    rgba[i * 4 + 1] = gray ? read(0) : read(1);
    rgba[i * 4 + 2] = gray ? read(0) : read(2);
    rgba[i * 4 + 3] =
      channels === 2 ? read(1) : channels === 4 ? read(3) : 255;
  }

  return { width: png.width, height: png.height, rgba };
}

/** Luminance of every pixel */
function toGray({ width, height, rgba }) {
  const gray = new Float32Array(width * height);

  for (let i = 0; i < gray.length; i++) {
    gray[i] =
      0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
  }

  return gray;
}

/** Sobel gradient magnitude of a grayscale image */
function toGradient(gray, width, height) {
  const out = new Float32Array(width * height);
  const at = (x, y) =>
    gray[
      Math.min(height - 1, Math.max(0, y)) * width +
        Math.min(width - 1, Math.max(0, x))
    ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const gx =
        at(x + 1, y - 1) +
        2 * at(x + 1, y) +
        at(x + 1, y + 1) -
        at(x - 1, y - 1) -
        2 * at(x - 1, y) -
        at(x - 1, y + 1);
      const gy =
        at(x - 1, y + 1) +
        2 * at(x, y + 1) +
        at(x + 1, y + 1) -
        at(x - 1, y - 1) -
        2 * at(x, y - 1) -
        at(x + 1, y - 1);

      out[y * width + x] = Math.hypot(gx, gy);
    }
  }

  return out;
}

/** Split the piece into its outline, its inside and a ring just outside it */
function buildPieceMasks(piece) {
  const { width, height, rgba } = piece;
  const inside = (x, y) =>
    x >= 0 &&
    y >= 0 &&
    x < width &&
    y < height &&
    rgba[(y * width + x) * 4 + 3] >= ALPHA_THRESHOLD;

  const edge = [];
  const body = [];
  const ring = [];

  for (let y = -RING_DISTANCE; y < height + RING_DISTANCE; y++) {
    for (let x = -RING_DISTANCE; x < width + RING_DISTANCE; x++) {
      if (inside(x, y)) {
        const onEdge =
          !inside(x - 1, y) ||
          !inside(x + 1, y) ||
          !inside(x, y - 1) ||
          !inside(x, y + 1);

        (onEdge ? edge : body).push([x, y]);
        continue;
      }

      let near = false;

      for (let dy = -RING_DISTANCE; dy <= RING_DISTANCE && !near; dy++) {
        for (let dx = -RING_DISTANCE; dx <= RING_DISTANCE && !near; dx++) {
          near = inside(x + dx, y + dy);
        }
      }

      if (near) ring.push([x, y]);
    }
  }

  return { edge, body, ring };
}

/** Mean of an image over a set of offsets placed at (ox, oy), ignoring pixels outside it */
function meanAt(values, width, height, points, ox, oy) {
  let sum = 0;
  let count = 0;

  for (const [px, py] of points) {
    const x = ox + px;
    const y = oy + py;

    if (x < 0 || y < 0 || x >= width || y >= height) continue;

    sum += values[y * width + x];
    count++;
  }

  return count ? sum / count : 0;
}

/** Scale scores to zero mean and unit spread, so different signals can be added */
function zScore(scores) {
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const spread =
    Math.sqrt(scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length) ||
    1;

  return scores.map((score) => (score - mean) / spread);
}

/** Score every slider position, highest first */
export function scoreSliderCandidates({
  bgImage,
  pieceImage,
  pieceTop = 0,
  pieceOffsetX = 0,
  pieceWidth = 42,
  trackPadding = 15,
}) {
  const bg = decodeDataImage(bgImage);
  const piece = decodeDataImage(pieceImage);
  const gray = toGray(bg);
  const gradient = toGradient(gray, bg.width, bg.height);
  const { edge, body, ring } = buildPieceMasks(piece);
  const maxSliderX = bg.width - pieceWidth - trackPadding;

  const sliderXs = [];
  const edgeScores = [];
  const shadeScores = [];

  for (let sliderX = 0; sliderX <= maxSliderX; sliderX++) {
    const ox = sliderX - pieceOffsetX;

    sliderXs.push(sliderX);

    /* The cut-out's outline shows up as strong edges along the piece's outline */
    edgeScores.push(meanAt(gradient, bg.width, bg.height, edge, ox, pieceTop));

    /* The cut-out is shaded, so its inside differs from the ring around it */
    shadeScores.push(
      Math.abs(
        meanAt(gray, bg.width, bg.height, body, ox, pieceTop) -
          meanAt(gray, bg.width, bg.height, ring, ox, pieceTop),
      ),
    );
  }

  const edgeZ = zScore(edgeScores);
  const shadeZ = zScore(shadeScores);

  return sliderXs
    .map((sliderX, i) => ({
      sliderX,
      score: edgeZ[i] + shadeZ[i],
      edge: edgeScores[i],
      shade: shadeScores[i],
    }))
    .sort((a, b) => b.score - a.score);
}

/** Where the piece fits, as the `sliderX` the captcha verify expects */
export function findSliderX(challenge) {
  return scoreSliderCandidates(challenge)[0].sliderX;
}
