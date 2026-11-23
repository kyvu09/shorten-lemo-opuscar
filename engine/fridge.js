// Shared Fridge Pull-Out Ending supporting dynamic 16:9 (1920x1080) & 9:16 (1080x1920) viewports and customizable fridge color!
import { clamp, lerp, hash } from '/core/lib.js';
import { VIEW } from './crayon.js';

let fridgeCanvas = null;
let pageSnap = null;

function ensureCanvases() {
  const W = VIEW.w, H = VIEW.h;
  if (!fridgeCanvas) fridgeCanvas = document.createElement('canvas');
  if (fridgeCanvas.width !== W || fridgeCanvas.height !== H) { fridgeCanvas.width = W; fridgeCanvas.height = H; }
  if (!pageSnap) pageSnap = document.createElement('canvas');
  if (pageSnap.width !== W || pageSnap.height !== H) { pageSnap.width = W; pageSnap.height = H; }
}

export function capturePage(glCanvas) {
  ensureCanvases();
  const g = pageSnap.getContext('2d');
  g.clearRect(0, 0, VIEW.w, VIEW.h);
  g.drawImage(glCanvas, 0, 0, VIEW.w, VIEW.h);
}

function shadeHex(hex, factor) {
  const s = String(hex || '#cbe3d7').replace('#', '');
  const n = parseInt(s, 16);
  const r = clamp(Math.round(((n >> 16) & 255) * factor), 0, 255);
  const g = clamp(Math.round(((n >> 8) & 255) * factor), 0, 255);
  const b = clamp(Math.round((n & 255) * factor), 0, 255);
  return `rgb(${r},${g},${b})`;
}

export function renderFridgeFrame(comp, p, C, fridgeColor = '#cbe3d7') {
  ensureCanvases();
  const W = VIEW.w, H = VIEW.h;
  const vertical = H > W;
  const g = fridgeCanvas.getContext('2d');
  g.clearRect(0, 0, W, H);

  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, shadeHex(fridgeColor, 1.07));
  bg.addColorStop(0.48, fridgeColor);
  bg.addColorStop(1, shadeHex(fridgeColor, 0.90));
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // Diagonal morning window-sunlight glow
  const sunG = g.createLinearGradient(0, 0, W * 0.85, H * 0.85);
  sunG.addColorStop(0, 'rgba(255,250,232,0.34)');
  sunG.addColorStop(0.55, 'rgba(255,248,225,0.12)');
  sunG.addColorStop(1, 'rgba(255,245,210,0)');
  g.fillStyle = sunG;
  g.fillRect(0, 0, W, H);

  // Subtle fridge seam & chrome handle
  const seamX = W * 0.916;
  g.strokeStyle = 'rgba(71,46,30,0.13)';
  g.lineWidth = 4;
  g.beginPath(); g.moveTo(seamX, 0); g.lineTo(seamX, H); g.stroke();

  const hx = lerp(W + 140, W * 0.94, p);
  const hy = H * 0.21;
  g.fillStyle = 'rgba(71,46,30,0.12)';
  g.beginPath(); g.roundRect(hx + 8, hy + 6, 28, 300, 14); g.fill();
  const hg = g.createLinearGradient(hx, 0, hx + 28, 0);
  hg.addColorStop(0, '#f7f7f4'); hg.addColorStop(0.5, '#d5dcd8'); hg.addColorStop(1, '#aeb8b2');
  g.fillStyle = hg;
  g.beginPath(); g.roundRect(hx, hy, 28, 300, 14); g.fill();

  // Warm wooden kitchen counter strip at bottom
  const counterH = vertical ? 140 : 84;
  const cy = lerp(H + 140, H - counterH, p);
  g.fillStyle = '#d7ad7a';
  g.fillRect(0, cy, W, counterH + 80);
  g.fillStyle = '#c1905a';
  g.fillRect(0, cy, W, 8);

  const crayons = vertical ? [
    { fx: 0.57, col: C.red, ang: -0.04 },
    { fx: 0.68, col: C.yellow, ang: 0.05 },
    { fx: 0.79, col: C.green, ang: -0.03 },
    { fx: 0.90, col: C.sky, ang: 0.08 },
  ] : [
    { fx: 0.74, col: C.red, ang: -0.04 },
    { fx: 0.80, col: C.yellow, ang: 0.05 },
    { fx: 0.85, col: C.green, ang: -0.03 },
    { fx: 0.90, col: C.sky, ang: 0.08 },
  ];
  for (const cr of crayons) {
    g.save();
    g.translate(W * cr.fx, cy + 44);
    g.rotate(cr.ang);
    g.fillStyle = 'rgba(71,46,30,0.18)';
    g.beginPath(); g.roundRect(-38, 6, 78, 16, 4); g.fill();
    g.fillStyle = cr.col;
    g.beginPath();
    g.moveTo(-38, -8); g.lineTo(26, -8); g.lineTo(42, 0); g.lineTo(26, 8); g.lineTo(-38, 8);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,250,235,0.45)';
    g.fillRect(-14, -8, 24, 16);
    g.strokeStyle = C.ink; g.lineWidth = 2.2;
    g.strokeRect(-14, -8, 24, 16);
    g.restore();
  }

  // Framed crayon drawing shrinking from 1.0 → 0.72
  const scale = lerp(1.0, vertical ? 0.76 : 0.715, p);
  const tilt = lerp(0, -0.022, p);
  const dx = lerp(W / 2, W * (vertical ? 0.48 : 0.475), p);
  const dy = lerp(H / 2, H * (vertical ? 0.45 : 0.465), p);
  const pw = W * scale, ph = H * scale;

  g.save();
  g.translate(dx, dy);
  g.rotate(tilt);

  if (p > 0.02) {
    g.shadowColor = `rgba(42,32,24,${0.26 * p})`;
    g.shadowBlur = 34 * p;
    g.shadowOffsetX = 12 * p;
    g.shadowOffsetY = 18 * p;
  }

  const pad = 16 * p;
  g.fillStyle = '#f4efe3';
  const x0 = -pw / 2 - pad, y0 = -ph / 2 - pad, rw = pw + pad * 2, rh = ph + pad * 2;
  g.beginPath();
  g.moveTo(x0, y0);
  for (let i = 1; i <= 24; i++) g.lineTo(x0 + (rw * i) / 24, y0 + (hash(i * 3.1) - 0.5) * 4 * p);
  for (let i = 1; i <= 14; i++) g.lineTo(x0 + rw + (hash(i * 5.7) - 0.5) * 4 * p, y0 + (rh * i) / 14);
  for (let i = 23; i >= 0; i--) g.lineTo(x0 + (rw * i) / 24, y0 + rh + (hash(i * 7.3) - 0.5) * 4 * p);
  for (let i = 13; i >= 0; i--) g.lineTo(x0 + (hash(i * 2.9) - 0.5) * 4 * p, y0 + (rh * i) / 14);
  g.closePath();
  g.fill();

  g.shadowColor = 'transparent';
  g.drawImage(pageSnap, -pw / 2, -ph / 2, pw, ph);

  if (p > 0.08) {
    const drawTape = (tx, ty, ang) => {
      g.save();
      g.translate(tx, ty); g.rotate(ang);
      g.fillStyle = `rgba(245,228,176,${0.86 * p})`;
      g.strokeStyle = `rgba(180,152,96,${0.45 * p})`;
      g.lineWidth = 2;
      g.beginPath(); g.rect(-58, -19, 116, 38); g.fill(); g.stroke();
      g.restore();
    };
    drawTape(-pw / 2 + 12, -ph / 2 + 12, -0.68);
    drawTape(pw / 2 - 12, ph / 2 - 12, -0.65);

    const drawMagnet = (mx, my, col, hasStar) => {
      g.save();
      g.translate(mx, my);
      g.globalAlpha = clamp((p - 0.1) / 0.45);
      g.fillStyle = 'rgba(42,32,24,0.22)';
      g.beginPath(); g.arc(5, 7, 28, 0, Math.PI * 2); g.fill();
      g.fillStyle = col;
      g.beginPath(); g.arc(0, 0, 27, 0, Math.PI * 2); g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 3.5; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.42)';
      g.beginPath(); g.ellipse(-8, -9, 8, 4.5, -0.6, 0, Math.PI * 2); g.fill();
      if (hasStar) {
        g.fillStyle = '#fbfaf4';
        g.beginPath();
        for (let k = 0; k < 10; k++) {
          const a = -Math.PI / 2 + (k * Math.PI) / 5;
          const r = k % 2 === 0 ? 13 : 5.5;
          k ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        g.closePath(); g.fill();
      }
      g.restore();
    };
    drawMagnet(pw / 2 - 20, -ph / 2 + 22, C.yellow, true);
    drawMagnet(-pw / 2 + 26, ph / 2 - 24, C.red, false);
  }
  g.restore();

  comp.begin([0.85, 0.92, 0.88]);
  comp.image(fridgeCanvas);
}
