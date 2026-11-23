// Fridge Pull-Out Ending (Shot 8, t = 50.8–56.0 s):
// Pulls smoothly past the torn/deckled edge of Leo's finished picture-book drawing to reveal it
// taped with warm masking tape and held by cute round magnets onto a sunlit pale-mint kitchen fridge,
// with a sunny yellow crayon box peeking along the wooden counter edge below!
import { clamp, lerp, hash } from '/core/lib.js';
import { W, H } from './crayon.js';
import { C } from './pal.js';

let fridgeCanvas = null;
let pageSnap = null;

function ensureCanvases() {
  if (!fridgeCanvas) {
    fridgeCanvas = document.createElement('canvas');
    fridgeCanvas.width = W; fridgeCanvas.height = H;
  }
  if (!pageSnap) {
    pageSnap = document.createElement('canvas');
    pageSnap.width = W; pageSnap.height = H;
  }
}

// Snapshot the WebGL canvas (the finished full-page drawing rendered with vignette=0)
export function capturePage(glCanvas) {
  ensureCanvases();
  const g = pageSnap.getContext('2d');
  g.clearRect(0, 0, W, H);
  g.drawImage(glCanvas, 0, 0, W, H);
}

// Render the sunlit mint kitchen fridge scene with the captured drawing smoothly shrinking from full-bleed (p=0)
// to a framed taped picture on the fridge door (p=1).
export function renderFridgeFrame(comp, p) {
  ensureCanvases();
  const g = fridgeCanvas.getContext('2d');
  g.clearRect(0, 0, W, H);

  // 1. Sunlit pale-mint enamel fridge door background with subtle vertical metallic sheen & warm window light
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#d9ece2');
  bg.addColorStop(0.45, '#cbe3d7');
  bg.addColorStop(1, '#b6d4c6');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // Soft diagonal warm morning window-sunlight shaft across the fridge door
  g.save();
  const sunG = g.createLinearGradient(0, 0, W * 0.85, H * 0.85);
  sunG.addColorStop(0, 'rgba(255,250,232,0.34)');
  sunG.addColorStop(0.55, 'rgba(255,248,225,0.12)');
  sunG.addColorStop(1, 'rgba(255,245,210,0)');
  g.fillStyle = sunG;
  g.fillRect(0, 0, W, H);

  // Subtle vertical fridge door seam & brushed chrome handle on the right side
  g.strokeStyle = 'rgba(71,46,30,0.13)';
  g.lineWidth = 4;
  g.beginPath(); g.moveTo(1760, 0); g.lineTo(1760, H); g.stroke();

  // Retro rounded chrome handle on right edge (slides into view as p grows)
  const hx = lerp(2060, 1806, p);
  g.fillStyle = 'rgba(71,46,30,0.12)';
  g.beginPath(); g.roundRect(hx + 10, 230, 34, 340, 17); g.fill();
  const hg = g.createLinearGradient(hx, 0, hx + 32, 0);
  hg.addColorStop(0, '#f7f7f4'); hg.addColorStop(0.5, '#d5dcd8'); hg.addColorStop(1, '#aeb8b2');
  g.fillStyle = hg;
  g.beginPath(); g.roundRect(hx, 224, 32, 340, 16); g.fill();

  // Warm wooden kitchen counter strip peeking softly at the very bottom (only when pulled back!)
  const cy = lerp(H + 140, H - 84, p);
  g.fillStyle = '#d7ad7a';
  g.fillRect(0, cy, W, 160);
  g.fillStyle = '#c1905a';
  g.fillRect(0, cy, W, 8);

  // Cute chunky crayons resting along the wooden counter edge (echoing our garden crayon box!)
  const crayons = [
    { x: 1450, col: C.red, ang: -0.04 },
    { x: 1555, col: C.yellow, ang: 0.05 },
    { x: 1650, col: C.green, ang: -0.03 },
    { x: 1735, col: C.sky, ang: 0.08 },
  ];
  for (const cr of crayons) {
    g.save();
    g.translate(cr.x, cy + 44);
    g.rotate(cr.ang);
    g.fillStyle = 'rgba(71,46,30,0.18)';
    g.beginPath(); g.roundRect(-42, 6, 86, 18, 5); g.fill();
    g.fillStyle = cr.col;
    g.beginPath();
    g.moveTo(-42, -9); g.lineTo(30, -9); g.lineTo(48, 0); g.lineTo(30, 9); g.lineTo(-42, 9);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,250,235,0.45)';
    g.fillRect(-16, -9, 28, 18);
    g.strokeStyle = C.ink; g.lineWidth = 2.5;
    g.strokeRect(-16, -9, 28, 18);
    g.restore();
  }

  // 2. The Finished Crayon Drawing Sheet — smoothly zooms from scale 1.0 → 0.72, slight playful tilt (-1.3°)
  const scale = lerp(1.0, 0.715, p);
  const tilt = lerp(0, -0.022, p);
  const dx = lerp(W / 2, W * 0.475, p);
  const dy = lerp(H / 2, H * 0.465, p);
  const pw = W * scale, ph = H * scale;

  g.save();
  g.translate(dx, dy);
  g.rotate(tilt);

  // Soft realistic drop shadow behind the paper sheet on the fridge
  if (p > 0.02) {
    g.shadowColor = `rgba(42,32,24,${0.26 * p})`;
    g.shadowBlur = 34 * p;
    g.shadowOffsetX = 12 * p;
    g.shadowOffsetY = 18 * p;
  }

  // Slight warm paper border around the captured picture
  const pad = 16 * p;
  g.fillStyle = '#f4efe3';
  g.beginPath();
  // Subtle deckled/hand-cut paper edge
  const x0 = -pw / 2 - pad, y0 = -ph / 2 - pad, rw = pw + pad * 2, rh = ph + pad * 2;
  g.moveTo(x0, y0);
  for (let i = 1; i <= 24; i++) g.lineTo(x0 + (rw * i) / 24, y0 + (hash(i * 3.1) - 0.5) * 4 * p);
  for (let i = 1; i <= 14; i++) g.lineTo(x0 + rw + (hash(i * 5.7) - 0.5) * 4 * p, y0 + (rh * i) / 14);
  for (let i = 23; i >= 0; i--) g.lineTo(x0 + (rw * i) / 24, y0 + rh + (hash(i * 7.3) - 0.5) * 4 * p);
  for (let i = 13; i >= 0; i--) g.lineTo(x0 + (hash(i * 2.9) - 0.5) * 4 * p, y0 + (rh * i) / 14);
  g.closePath();
  g.fill();

  // Clear shadow before drawing image & tape
  g.shadowColor = 'transparent';
  g.drawImage(pageSnap, -pw / 2, -ph / 2, pw, ph);

  // Warm semi-translucent masking tape strips holding top-left and bottom-right corners
  if (p > 0.08) {
    const drawTape = (tx, ty, ang) => {
      g.save();
      g.translate(tx, ty); g.rotate(ang);
      g.fillStyle = `rgba(245,228,176,${0.86 * p})`;
      g.strokeStyle = `rgba(180,152,96,${0.45 * p})`;
      g.lineWidth = 2;
      g.beginPath(); g.rect(-62, -20, 124, 40); g.fill(); g.stroke();
      g.restore();
    };
    drawTape(-pw / 2 + 12, -ph / 2 + 12, -0.68);
    drawTape(pw / 2 - 12, ph / 2 - 12, -0.65);

    // Cute chunky round fridge magnets on top-right (yellow star!) and bottom-left (red dot!)
    const drawMagnet = (mx, my, col, hasStar) => {
      g.save();
      g.translate(mx, my);
      g.globalAlpha = clamp((p - 0.1) / 0.45);
      g.fillStyle = 'rgba(42,32,24,0.22)';
      g.beginPath(); g.arc(5, 7, 30, 0, Math.PI * 2); g.fill();
      g.fillStyle = col;
      g.beginPath(); g.arc(0, 0, 29, 0, Math.PI * 2); g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 3.5; g.stroke();
      // specular shine
      g.fillStyle = 'rgba(255,255,255,0.42)';
      g.beginPath(); g.ellipse(-9, -10, 9, 5, -0.6, 0, Math.PI * 2); g.fill();
      if (hasStar) {
        g.fillStyle = '#fbfaf4';
        g.beginPath();
        for (let k = 0; k < 10; k++) {
          const a = -Math.PI / 2 + (k * Math.PI) / 5;
          const r = k % 2 === 0 ? 14 : 6;
          k ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        g.closePath(); g.fill();
      }
      g.restore();
    };
    drawMagnet(pw / 2 - 22, -ph / 2 + 24, C.yellow, true);
    drawMagnet(-pw / 2 + 28, ph / 2 - 26, C.red, false);
  }

  g.restore();
  g.restore();

  // Composite fridge scene cleanly into WebGL target (film.js calls comp.finish once after subtitles!)
  comp.begin([0.85, 0.92, 0.88]);
  comp.image(fridgeCanvas);
}
