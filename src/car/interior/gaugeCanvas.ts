/**
 * Gösterge kümesi dokusu: solda hız, sağda devir kadranı, ortada yakıt/sıcaklık çubukları.
 * Doku `NoColorSpace` yüklenir (canvas sRGB dönüşümü her karede pahalı); bu yüzden renkler
 * ekranda istenen görünsün diye doğrusal uzaya çevrilerek çizilir (`lin`).
 */

export const GAUGE_CANVAS = { width: 384, height: 160 };

/** sRGB (0–255) değeri doğrusal uzaya çevirir (≈ γ 2.2): çıkış dönüşümü geri alır. */
export const lin = (c: number): number => Math.round(255 * Math.pow(c / 255, 2.2));
const rgb = (r: number, g: number, b: number, a = 1) => `rgba(${lin(r)},${lin(g)},${lin(b)},${a})`;

const COLORS = {
  face: rgb(14, 15, 18),
  tick: rgb(220, 218, 210),
  text: rgb(235, 232, 224),
  accent: rgb(255, 122, 24),
  red: rgb(255, 60, 40),
  bar: rgb(70, 72, 78),
};

/** Kadran açıları (rad): başlangıç sol-alt, süpürme 270° */
const START = (135 * Math.PI) / 180;
const SWEEP = (270 * Math.PI) / 180;

type Ctx = CanvasRenderingContext2D;

function dial(
  ctx: Ctx,
  cx: number,
  cy: number,
  r: number,
  fraction: number,
  max: number,
  step: number,
  labelDiv: number,
  redFrom: number | null,
): void {
  ctx.lineCap = 'round';
  for (let v = 0; v <= max; v += step) {
    const a = START + (v / max) * SWEEP;
    const major = v % (step * 2) === 0;
    const r0 = r - (major ? 14 : 8);
    ctx.strokeStyle = redFrom !== null && v >= redFrom ? COLORS.red : COLORS.tick;
    ctx.lineWidth = major ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3));
    ctx.stroke();
    if (major) {
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        String(Math.round(v / labelDiv)),
        cx + Math.cos(a) * (r - 28),
        cy + Math.sin(a) * (r - 28),
      );
    }
  }
  // İbre
  const a = START + Math.min(1, Math.max(0, fraction)) * SWEEP;
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(cx - Math.cos(a) * 10, cy - Math.sin(a) * 10);
  ctx.lineTo(cx + Math.cos(a) * (r - 12), cy + Math.sin(a) * (r - 12));
  ctx.stroke();
  ctx.fillStyle = COLORS.tick;
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();
}

/** Çubuk gösterge (yakıt / sıcaklık) */
function bar(ctx: Ctx, x: number, y: number, w: number, fraction: number, label: string): void {
  ctx.fillStyle = COLORS.bar;
  ctx.fillRect(x, y, w, 8);
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(x, y, w * Math.min(1, Math.max(0, fraction)), 8);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, x + w / 2, y + 22);
}

/** Kümeyi çizer. Hız km/s, devir rpm; yakıt/sıcaklık süsleme (sabit değerler). */
export function drawCluster(ctx: Ctx, speedKmh: number, rpm: number, redlineRpm: number): void {
  const { width: w, height: h } = GAUGE_CANVAS;
  ctx.fillStyle = COLORS.face;
  ctx.fillRect(0, 0, w, h);
  const maxSpeed = 240;
  dial(ctx, 96, 82, 72, speedKmh / maxSpeed, maxSpeed, 20, 20, null);
  const maxRpm = Math.ceil(redlineRpm / 1000) * 1000 + 1000;
  dial(ctx, w - 96, 82, 72, rpm / maxRpm, maxRpm, 500, 1000, redlineRpm);
  bar(ctx, w / 2 - 34, 56, 68, 0.72, 'FUEL');
  bar(ctx, w / 2 - 34, 100, 68, 0.5, 'TEMP');
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('km/h', 96, 146);
  ctx.fillText('x1000 rpm', w - 96, 146);
}
