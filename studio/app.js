// Crayon Book Web Studio — Main interactive frontend controller (ES module, zero dependencies).
import { makeComp } from '/engine/gl.js';
import { VIEW, setView, wx, wy, CAM } from '/engine/crayon.js';
import { ENTITY_CATALOG, HUMAN_POSES, HUMAN_EXPRS, HUMAN_VIEWS } from '/engine/library.js';
import { renderProject, evalCamera } from '/engine/scene.js';
import { DEFAULT_CRAYONS, VOICE_CATALOG, WASH_PRESETS, aspectDimensions } from '/engine/schema.js';

const $ = id => document.getElementById(id);

const glCanvas = $('gl');
const ovCanvas = $('overlay');
const ovCtx = ovCanvas.getContext('2d');
const mixAudio = $('mixAudio');

const comp = makeComp(glCanvas, 1920, 1080);

const STATE = {
  projects: [],
  slug: null,
  project: null,
  media: { hasMix: false, mixUrl: null, hasMp4: false, mp4Url: null, voices: [] },
  asr: {},
  t: 0.0,
  playing: false,
  lastTick: 0,
  dirty: false,
  tab: 'subs',
  dragMode: true,
  showGuides: false,
  camOverride: null,
  selected: null,        // { kind: 'entity'|'tag'|'title'|'sub', id }
  hitTargets: [],
  tlZoom: 1,
  newMode: 'blank',      // 'blank' | 'duplicate'
  lineAudio: null,
};

// ——— Utilities ———
function fmtTime(s) {
  const v = Math.max(0, Number(s) || 0);
  const m = Math.floor(v / 60);
  const sc = (v % 60).toFixed(2).padStart(5, '0');
  return `${String(m).padStart(2, '0')}:${sc}`;
}
function markDirty(d = true) {
  STATE.dirty = d;
  const b = $('saveStatus');
  b.textContent = d ? '● Chưa lưu' : '✓ Đã lưu';
  b.classList.toggle('dirty', d);
}
function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'my-story';
}
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ——— Viewport sizing (16:9 / 9:16 responsive fit inside center stage) ———
function applyAspect() {
  if (!STATE.project) return;
  const aspect = STATE.project.meta?.aspect || '16:9';
  const { w, h } = aspectDimensions(aspect);
  setView(w, h);
  comp.resize(w, h);
  ovCanvas.width = w; ovCanvas.height = h;
  $('btnAspect169').classList.toggle('active', aspect === '16:9');
  $('btnAspect916').classList.toggle('active', aspect === '9:16');
  fitCanvasShell();
}

function fitCanvasShell() {
  const wrap = $('stageWrap');
  const shell = $('canvasShell');
  const pad = 28;
  const aw = Math.max(200, wrap.clientWidth - pad);
  const ah = Math.max(160, wrap.clientHeight - pad);
  const ar = VIEW.w / VIEW.h;
  let dw = aw, dh = aw / ar;
  if (dh > ah) { dh = ah; dw = ah * ar; }
  shell.style.width = `${Math.floor(dw)}px`;
  shell.style.height = `${Math.floor(dh)}px`;
}
window.addEventListener('resize', fitCanvasShell);

// ——— Render single frame + interactive overlay ———
function drawFrame() {
  if (!STATE.project) return;
  const res = renderProject(comp, glCanvas, STATE.project, STATE.t, { camOverride: STATE.camOverride });
  STATE.hitTargets = res.hitTargets;
  drawOverlay();
  updateReadouts();
}

function drawOverlay() {
  const W = VIEW.w, H = VIEW.h;
  ovCtx.clearRect(0, 0, W, H);

  // Optional safe margins & subtitle zone guides
  if (STATE.showGuides) {
    ovCtx.save();
    ovCtx.strokeStyle = 'rgba(229, 154, 56, 0.5)';
    ovCtx.lineWidth = 2;
    ovCtx.setLineDash([12, 8]);
    ovCtx.strokeRect(W * 0.05, H * 0.05, W * 0.9, H * 0.9);
    // Rule of thirds
    ovCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ovCtx.beginPath();
    ovCtx.moveTo(W / 3, 0); ovCtx.lineTo(W / 3, H);
    ovCtx.moveTo(W * 2 / 3, 0); ovCtx.lineTo(W * 2 / 3, H);
    ovCtx.moveTo(0, H / 3); ovCtx.lineTo(W, H / 3);
    ovCtx.moveTo(0, H * 2 / 3); ovCtx.lineTo(W, H * 2 / 3);
    ovCtx.stroke();
    // Subtitle safe box
    const subY = H > W ? H - 275 : H - 150;
    ovCtx.fillStyle = 'rgba(229, 154, 56, 0.14)';
    ovCtx.fillRect(W * 0.12, subY, W * 0.76, H > W ? 150 : 122);
    ovCtx.strokeStyle = 'rgba(229, 154, 56, 0.8)';
    ovCtx.strokeRect(W * 0.12, subY, W * 0.76, H > W ? 150 : 122);
    ovCtx.restore();
  }

  // Interactive drag bounding boxes
  if (STATE.dragMode) {
    ovCtx.save();
    for (const ht of STATE.hitTargets) {
      const isSel = STATE.selected && STATE.selected.kind === ht.kind && STATE.selected.id === ht.id;
      ovCtx.strokeStyle = isSel ? '#ff9f1c' : 'rgba(71, 46, 30, 0.30)';
      ovCtx.lineWidth = isSel ? 4 : 2;
      ovCtx.setLineDash(isSel ? [] : [8, 6]);
      ovCtx.strokeRect(ht.x0, ht.y0, ht.x1 - ht.x0, ht.y1 - ht.y0);
      if (isSel) {
        ovCtx.fillStyle = '#ff9f1c';
        const r = 7;
        [[ht.x0, ht.y0], [ht.x1, ht.y0], [ht.x0, ht.y1], [ht.x1, ht.y1]].forEach(([cx, cy]) => {
          ovCtx.fillRect(cx - r, cy - r, r * 2, r * 2);
        });
      }
    }
    ovCtx.restore();
  }
}

function updateReadouts() {
  const dur = STATE.project?.meta?.duration || 30;
  $('timecode').textContent = `${fmtTime(STATE.t)} / ${fmtTime(dur)}`;
  const cam = STATE.camOverride || evalCamera(STATE.project, STATE.t);
  $('camReadout').textContent = `Camera: x=${Math.round(cam.x)} y=${Math.round(cam.y)} · ${cam.s.toFixed(2)}×${STATE.camOverride ? ' (Tự do)' : ''}`;
  $('btnCamReset').classList.toggle('hidden', !STATE.camOverride);

  // Move vertical playhead in timeline
  const lane = $('rulerBar');
  const pct = Math.max(0, Math.min(1, STATE.t / Math.max(0.1, dur)));
  $('playhead').style.left = `${134 + pct * lane.clientWidth}px`;
}

// ——— Playback Loop (24/60fps synced with mix.wav if available!) ———
function setPlaying(on) {
  if (!STATE.project) return;
  const dur = STATE.project.meta?.duration || 30;
  STATE.playing = on;
  $('btnPlay').textContent = on ? '⏸' : '▶';
  if (on) {
    if (STATE.t >= dur - 0.05) STATE.t = 0;
    STATE.lastTick = performance.now();
    if (STATE.media.hasMix && mixAudio.src) {
      try {
        mixAudio.currentTime = STATE.t;
        mixAudio.play().catch(() => {});
      } catch {}
    }
    requestAnimationFrame(tickPlay);
  } else {
    try { mixAudio.pause(); } catch {}
  }
}

function tickPlay(now) {
  if (!STATE.playing) return;
  const dur = STATE.project?.meta?.duration || 30;
  if (STATE.media.hasMix && !mixAudio.paused && Number.isFinite(mixAudio.currentTime)) {
    STATE.t = mixAudio.currentTime;
  } else {
    STATE.t += (now - STATE.lastTick) / 1000;
  }
  STATE.lastTick = now;
  if (STATE.t >= dur) {
    STATE.t = dur;
    setPlaying(false);
    drawFrame();
    return;
  }
  drawFrame();
  requestAnimationFrame(tickPlay);
}

function seekTo(nt) {
  const dur = STATE.project?.meta?.duration || 30;
  STATE.t = Math.max(0, Math.min(dur, nt));
  if (STATE.media.hasMix && mixAudio.src) {
    try { mixAudio.currentTime = STATE.t; } catch {}
  }
  drawFrame();
}

// ——— Direct Canvas Drag & Drop + Wheel Zoom ———
let dragOp = null;

function canvasCoords(ev) {
  const r = ovCanvas.getBoundingClientRect();
  return {
    px: (ev.clientX - r.left) * (VIEW.w / r.width),
    py: (ev.clientY - r.top) * (VIEW.h / r.height),
    localX: ev.clientX - r.left,
    localY: ev.clientY - r.top,
  };
}

function hitTest(px, py) {
  // Check top-most items first (reverse order: tags/title above entities!)
  for (let i = STATE.hitTargets.length - 1; i >= 0; i--) {
    const h = STATE.hitTargets[i];
    if (px >= h.x0 && px <= h.x1 && py >= h.y0 && py <= h.y1) return h;
  }
  return null;
}

ovCanvas.addEventListener('pointerdown', ev => {
  if (!STATE.project) return;
  const { px, py } = canvasCoords(ev);
  const hit = STATE.dragMode ? hitTest(px, py) : null;

  if (hit && !ev.altKey) {
    STATE.selected = { kind: hit.kind, id: hit.id };
    const startW = { x: wx(px), y: wy(py) };
    dragOp = { type: 'item', hit, startW, origX: hit.wx, origY: hit.wy };
    ovCanvas.classList.add('dragging');
    ovCanvas.setPointerCapture(ev.pointerId);
    // Auto-switch right inspector tab to the clicked item!
    if (hit.kind === 'tag' || hit.kind === 'title') switchTab('tags');
    else if (hit.kind === 'entity') switchTab('cast');
    drawOverlay();
  } else {
    // Pan camera freely to frame a new camera keyframe!
    const cur = STATE.camOverride || evalCamera(STATE.project, STATE.t);
    STATE.camOverride = { ...cur };
    dragOp = { type: 'pan', startPx: px, startPy: py, origCam: { ...cur } };
    ovCanvas.classList.add('dragging');
    ovCanvas.setPointerCapture(ev.pointerId);
  }
});

ovCanvas.addEventListener('pointermove', ev => {
  if (!STATE.project) return;
  const { px, py, localX, localY } = canvasCoords(ev);

  if (!dragOp) {
    const hit = STATE.dragMode ? hitTest(px, py) : null;
    const tip = $('stageTooltip');
    if (hit) {
      tip.textContent = `${hit.label} · kéo để di chuyển`;
      tip.style.left = `${localX + 12}px`;
      tip.style.top = `${Math.max(6, localY - 26)}px`;
      tip.classList.remove('hidden');
      ovCanvas.style.cursor = 'move';
    } else {
      tip.classList.add('hidden');
      ovCanvas.style.cursor = 'grab';
    }
    return;
  }

  if (dragOp.type === 'item') {
    const nx = Math.round(dragOp.origX + (wx(px) - dragOp.startW.x));
    const ny = Math.round(dragOp.origY + (wy(py) - dragOp.startW.y));
    const { kind, id } = dragOp.hit;
    if (kind === 'title') {
      STATE.project.meta.titlePos.x = nx;
      STATE.project.meta.titlePos.y = ny;
    } else if (kind === 'tag') {
      const tg = STATE.project.tags.find(x => x.id === id);
      if (tg) { tg.x = nx; tg.y = ny; }
    } else if (kind === 'entity') {
      const ent = STATE.project.entities.find(x => x.id === id);
      if (ent) { ent.x = nx; ent.y = ny; }
    }
    markDirty(true);
    drawFrame();
  } else if (dragOp.type === 'pan') {
    const s = dragOp.origCam.s;
    STATE.camOverride.x = Math.round(dragOp.origCam.x - (px - dragOp.startPx) / s);
    STATE.camOverride.y = Math.round(dragOp.origCam.y - (py - dragOp.startPy) / s);
    drawFrame();
  }
});

ovCanvas.addEventListener('pointerup', () => {
  if (dragOp?.type === 'item') renderInspector();
  dragOp = null;
  ovCanvas.classList.remove('dragging');
});

ovCanvas.addEventListener('wheel', ev => {
  if (!STATE.project) return;
  ev.preventDefault();
  const cur = STATE.camOverride || evalCamera(STATE.project, STATE.t);
  const factor = ev.deltaY < 0 ? 1.07 : 0.93;
  STATE.camOverride = { x: cur.x, y: cur.y, s: Number(Math.max(0.35, Math.min(2.6, cur.s * factor)).toFixed(2)) };
  drawFrame();
}, { passive: false });

// ——— Timeline Rendering & Scrubbing ———
function renderTimeline() {
  if (!STATE.project) return;
  const dur = Math.max(1, Number(STATE.project.meta?.duration || 30));
  $('inpDuration').value = dur;
  $('tracksCanvas').style.width = `${Math.round(STATE.tlZoom * 100)}%`;

  // Time ruler ticks
  const ruler = $('rulerBar');
  ruler.innerHTML = '';
  const step = dur <= 20 ? 2 : (dur <= 60 ? 5 : 10);
  for (let s = 0; s <= dur; s += step) {
    const d = document.createElement('div');
    d.className = 'tick';
    d.style.left = `${(s / dur) * 100}%`;
    d.textContent = `${s}s`;
    ruler.appendChild(d);
  }

  // Track 1: Camera keyframes (diamonds, horizontally draggable!)
  const laneCam = $('laneCamera');
  laneCam.innerHTML = '';
  (STATE.project.camera || []).forEach((kf, idx) => {
    const el = document.createElement('div');
    el.className = 'kf-diamond';
    el.style.left = `${(kf.t / dur) * 100}%`;
    el.title = `Camera @ ${kf.t.toFixed(2)}s (x=${kf.x}, y=${kf.y}, ${kf.s}×)`;
    el.addEventListener('pointerdown', ev => {
      ev.stopPropagation();
      STATE.camOverride = null;
      seekTo(kf.t);
      const startX = ev.clientX, origT = kf.t, laneW = laneCam.clientWidth;
      const onMove = mv => {
        kf.t = Number(Math.max(0, Math.min(dur, origT + ((mv.clientX - startX) / laneW) * dur)).toFixed(2));
        el.style.left = `${(kf.t / dur) * 100}%`;
        markDirty(true);
        drawFrame();
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        if (STATE.tab === 'scene') renderInspector();
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
    laneCam.appendChild(el);
  });

  // Track 2: Wash, Silences & Ending
  const laneFx = $('laneFx');
  laneFx.innerHTML = '';
  if (STATE.project.palette?.washEnabled) {
    const ws = STATE.project.palette.washStart ?? 30;
    const p = document.createElement('div');
    p.className = 'tl-pill wash';
    p.style.left = `${(ws / dur) * 100}%`;
    p.style.width = `${(Math.min(dur - ws, 6.4) / dur) * 100}%`;
    p.textContent = '💧 Wash & Wax Resist';
    laneFx.appendChild(p);
  }
  for (const sil of STATE.project.silences || []) {
    const p = document.createElement('div');
    p.className = 'tl-pill sil';
    p.style.left = `${(sil.t0 / dur) * 100}%`;
    p.style.width = `${Math.max(1.5, ((sil.t1 - sil.t0) / dur) * 100)}%`;
    p.textContent = '🔇';
    laneFx.appendChild(p);
  }
  if (STATE.project.ending?.type === 'fridge') {
    const es = STATE.project.ending.tStart ?? (dur - 5);
    const p = document.createElement('div');
    p.className = 'tl-pill fridge';
    p.style.left = `${(es / dur) * 100}%`;
    p.style.width = `${(Math.max(1, dur - es) / dur) * 100}%`;
    p.textContent = '🧲 Kết tủ lạnh';
    laneFx.appendChild(p);
  }

  // Track 3: Vocabulary tags (click to select/jump, drag to retime!)
  const laneTags = $('laneTags');
  laneTags.innerHTML = '';
  (STATE.project.tags || []).forEach(tg => {
    const el = document.createElement('div');
    el.className = 'tl-pill tag';
    el.style.left = `${(tg.t / dur) * 100}%`;
    el.style.width = `${Math.max(4.5, (2.2 / dur) * 100)}%`;
    el.textContent = tg.en;
    el.title = `${tg.en} (${tg.vi}) @ ${tg.t.toFixed(2)}s — kéo để đổi mốc xuất hiện`;
    el.addEventListener('pointerdown', ev => {
      ev.stopPropagation();
      STATE.selected = { kind: 'tag', id: tg.id };
      switchTab('tags');
      seekTo(tg.t + 0.5);
      const startX = ev.clientX, origT = tg.t, laneW = laneTags.clientWidth;
      const onMove = mv => {
        tg.t = Number(Math.max(0, Math.min(dur - 0.5, origT + ((mv.clientX - startX) / laneW) * dur)).toFixed(2));
        el.style.left = `${(tg.t / dur) * 100}%`;
        markDirty(true); drawFrame();
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        renderInspector();
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
    laneTags.appendChild(el);
  });

  // Track 4: Subtitles & Voice (drag horizontally to shift timing!)
  const laneSubs = $('laneSubs');
  laneSubs.innerHTML = '';
  (STATE.project.subtitles || []).forEach(sub => {
    const el = document.createElement('div');
    el.className = 'tl-pill sub';
    el.style.left = `${(sub.t0 / dur) * 100}%`;
    el.style.width = `${Math.max(2, ((sub.t1 - sub.t0) / dur) * 100)}%`;
    el.textContent = sub.en;
    el.title = `${sub.en}\n${sub.vi}\n(${sub.t0}s – ${sub.t1}s) — kéo ngang để dịch mốc`;
    el.addEventListener('pointerdown', ev => {
      ev.stopPropagation();
      STATE.selected = { kind: 'sub', id: sub.id };
      switchTab('subs');
      seekTo(sub.vt);
      const startX = ev.clientX, origVt = sub.vt, origT0 = sub.t0, origT1 = sub.t1, laneW = laneSubs.clientWidth;
      const onMove = mv => {
        const dt = ((mv.clientX - startX) / laneW) * dur;
        const clampedDt = Math.max(-origT0, Math.min(dur - origT1, dt));
        sub.vt = Number((origVt + clampedDt).toFixed(2));
        sub.t0 = Number((origT0 + clampedDt).toFixed(2));
        sub.t1 = Number((origT1 + clampedDt).toFixed(2));
        el.style.left = `${(sub.t0 / dur) * 100}%`;
        markDirty(true); drawFrame();
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        renderInspector();
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
    laneSubs.appendChild(el);
  });

  updateReadouts();
}

// Scrubbing on ruler or empty track area
function bindScrub(el) {
  el.addEventListener('pointerdown', ev => {
    if (!STATE.project) return;
    if (ev.target.classList.contains('kf-diamond') || ev.target.classList.contains('tl-pill')) return;
    setPlaying(false);
    const update = e => {
      const r = $('rulerBar').getBoundingClientRect();
      const f = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
      seekTo(f * (STATE.project.meta?.duration || 30));
    };
    update(ev);
    const onMove = e => update(e);
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
}
['rulerBar', 'laneCamera', 'laneFx', 'laneTags', 'laneSubs'].forEach(id => bindScrub($(id)));

// ——— Right Inspector Rendering (5 Tabs) ———
function switchTab(tab) {
  STATE.tab = tab;
  document.querySelectorAll('#inspectorTabs .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  renderInspector();
}
document.querySelectorAll('#inspectorTabs .tab').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));

function crayonSwatchesHtml(activeCol, dataAttr) {
  const cols = Object.values(STATE.project?.palette?.crayons || DEFAULT_CRAYONS).slice(0, 9);
  return `<div class="swatches">${cols.map(c =>
    `<button type="button" class="swatch ${c.toLowerCase() === String(activeCol || '').toLowerCase() ? 'active' : ''}" style="background:${c}" ${dataAttr}="${c}"></button>`
  ).join('')}</div>`;
}

function renderInspector() {
  const body = $('tabBody');
  if (!STATE.project) { body.innerHTML = '<p style="color:var(--muted)">Chưa tải dự án nào.</p>'; return; }
  const P = STATE.project;

  if (STATE.tab === 'subs') {
    body.innerHTML = `
      <div class="sec-head">
        <span>Kịch bản &amp; Phụ đề (${(P.subtitles || []).length} câu)</span>
        <button id="btnAddSub" class="btn-mini">+ Thêm câu</button>
      </div>
      ${(P.subtitles || []).map((s, idx) => {
        const hasWav = STATE.media.voices.includes(s.id);
        const asr = STATE.asr[s.id];
        const isSel = STATE.selected?.kind === 'sub' && STATE.selected.id === s.id;
        return `
        <div class="card ${isSel ? 'selected' : ''}" data-sub-idx="${idx}">
          <div class="card-head">
            <span class="card-title">#${idx + 1} · <code>${esc(s.id)}</code>
              ${asr ? `<span class="asr-badge ${asr === 'OK' ? 'asr-ok' : 'asr-diff'}">ASR ${asr}</span>` : ''}
            </span>
            <div style="display:flex;gap:4px">
              <button class="btn-mini" data-jump="${s.vt}" title="Nhảy tới câu này">▶</button>
              ${hasWav ? `<button class="btn-mini" data-play-wav="${esc(s.id)}" title="Nghe giọng câu này">🔊</button>` : ''}
              <button class="btn-mini btn-danger" data-del-sub="${idx}" title="Xóa câu">×</button>
            </div>
          </div>
          <label class="field">Tiếng Anh (EN)
            <input type="text" data-sub="${idx}" data-k="en" value="${esc(s.en)}">
          </label>
          <label class="field">Tiếng Việt (VI)
            <input type="text" data-sub="${idx}" data-k="vi" value="${esc(s.vi)}">
          </label>
          <div class="field-row">
            <label class="field">Từ nhấn mạnh
              <input type="text" data-sub="${idx}" data-k="key" value="${esc(s.key || '')}" placeholder="seed">
            </label>
            <label class="field" style="flex:0 0 60px">Màu nhấn
              <input type="color" data-sub="${idx}" data-k="hiCol" value="${esc(s.hiCol || '#d94436')}" style="height:29px;padding:2px">
            </label>
          </div>
          <div class="field-row">
            <label class="field">Giọng đọc
              <select data-sub="${idx}" data-k="voice">
                ${VOICE_CATALOG.map(v => `<option value="${v.id}" ${v.id === s.voice ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}
              </select>
            </label>
            <label class="field" style="flex:0 0 68px">Tốc độ
              <input type="number" step="0.02" min="0.6" max="1.3" data-sub="${idx}" data-k="speed" value="${s.speed ?? 0.86}">
            </label>
          </div>
          <div class="field-row">
            <label class="field">Đọc lúc (s) <input type="number" step="0.05" data-sub="${idx}" data-k="vt" value="${s.vt}"></label>
            <label class="field">Hiện chữ từ <input type="number" step="0.05" data-sub="${idx}" data-k="t0" value="${s.t0}"></label>
            <label class="field">Tới (s) <input type="number" step="0.05" data-sub="${idx}" data-k="t1" value="${s.t1}"></label>
          </div>
        </div>`;
      }).join('')}
    `;
    $('btnAddSub').onclick = () => {
      const n = (P.subtitles.length + 1);
      const id = `l${String(n).padStart(2, '0')}`;
      const vt = Number(STATE.t.toFixed(2));
      P.subtitles.push({ id, vt, dur: 1.5, t0: Math.max(0, Number((vt - 0.15).toFixed(2))), t1: Number((vt + 2.8).toFixed(2)), en: 'New English line.', vi: 'Câu tiếng Việt mới.', key: '', hiCol: '#d94436', engine: 'kokoro', voice: 'af_heart', speed: 0.86 });
      markDirty(true); renderInspector(); renderTimeline(); drawFrame();
    };
    body.querySelectorAll('[data-sub]').forEach(inp => {
      inp.addEventListener('input', () => {
        const s = P.subtitles[Number(inp.dataset.sub)];
        const k = inp.dataset.k;
        s[k] = (inp.type === 'number') ? Number(inp.value) : inp.value;
        if (k === 'voice') {
          const v = VOICE_CATALOG.find(x => x.id === inp.value);
          if (v) s.engine = v.engine;
        }
        markDirty(true); drawFrame(); renderTimeline();
      });
    });
    body.querySelectorAll('[data-del-sub]').forEach(btn => btn.onclick = () => {
      P.subtitles.splice(Number(btn.dataset.delSub), 1);
      markDirty(true); renderInspector(); renderTimeline(); drawFrame();
    });
    body.querySelectorAll('[data-play-wav]').forEach(btn => btn.onclick = () => {
      if (STATE.lineAudio) STATE.lineAudio.pause();
      STATE.lineAudio = new Audio(`/films/${STATE.slug}/voices/${btn.dataset.playWav}.wav?cb=${Date.now()}`);
      STATE.lineAudio.play().catch(() => {});
    });
    bindJumpButtons(body);
  }

  else if (STATE.tab === 'tags') {
    const tp = P.meta.titlePos || (P.meta.titlePos = { x: 2500, y: 800, t: 1.8 });
    body.innerHTML = `
      <div class="sec-head"><span>Tiêu đề trang sách</span></div>
      <div class="card ${STATE.selected?.kind === 'title' ? 'selected' : ''}">
        <label class="field">Tiêu đề tiếng Anh <input id="inpTitleEn" type="text" value="${esc(P.meta.title || '')}"></label>
        <label class="field">Tiêu đề tiếng Việt <input id="inpTitleVi" type="text" value="${esc(P.meta.titleVi || '')}"></label>
        <div class="field-row">
          <label class="field">Hiện lúc (s) <input id="inpTitleT" type="number" step="0.1" value="${tp.t ?? 1.8}"></label>
          <label class="field">X <input id="inpTitleX" type="number" step="10" value="${tp.x}"></label>
          <label class="field">Y <input id="inpTitleY" type="number" step="10" value="${tp.y}"></label>
        </div>
      </div>

      <div class="sec-head">
        <span>Thẻ từ vựng trên trang (${(P.tags || []).length})</span>
        <button id="btnAddTag" class="btn-mini">+ Thêm từ vựng</button>
      </div>
      ${(P.tags || []).map((tg, idx) => {
        const isSel = STATE.selected?.kind === 'tag' && STATE.selected.id === tg.id;
        return `
        <div class="card ${isSel ? 'selected' : ''}">
          <div class="card-head">
            <span class="card-title" style="color:${esc(tg.col)}">🏷️ ${esc(tg.en)} · <span style="color:var(--muted);font-weight:400">${esc(tg.vi)}</span></span>
            <div style="display:flex;gap:4px">
              <button class="btn-mini" data-jump="${tg.t + 0.5}">▶</button>
              <button class="btn-mini btn-danger" data-del-tag="${idx}">×</button>
            </div>
          </div>
          <div class="field-row">
            <label class="field">Từ EN <input type="text" data-tg="${idx}" data-k="en" value="${esc(tg.en)}"></label>
            <label class="field">Nghĩa VI <input type="text" data-tg="${idx}" data-k="vi" value="${esc(tg.vi)}"></label>
          </div>
          <div class="field-row">
            <label class="field">Hiện lúc (s) <input type="number" step="0.1" data-tg="${idx}" data-k="t" value="${tg.t}"></label>
            <label class="field">X <input type="number" step="10" data-tg="${idx}" data-k="x" value="${tg.x}"></label>
            <label class="field">Y <input type="number" step="10" data-tg="${idx}" data-k="y" value="${tg.y}"></label>
          </div>
          ${crayonSwatchesHtml(tg.col, `data-tg-col="${idx}" data-val`)}
        </div>`;
      }).join('')}
    `;
    const wireTitle = (id, fn) => $(id).addEventListener('input', e => { fn(e.target.value); markDirty(true); drawFrame(); });
    wireTitle('inpTitleEn', v => P.meta.title = v);
    wireTitle('inpTitleVi', v => P.meta.titleVi = v);
    wireTitle('inpTitleT', v => tp.t = Number(v));
    wireTitle('inpTitleX', v => tp.x = Number(v));
    wireTitle('inpTitleY', v => tp.y = Number(v));

    $('btnAddTag').onclick = () => {
      const cam = STATE.camOverride || evalCamera(P, STATE.t);
      P.tags.push({ id: `tag_${Date.now().toString(36)}`, t: Number(STATE.t.toFixed(2)), x: Math.round(cam.x), y: Math.round(cam.y), en: 'WORD', vi: 'từ mới', col: '#d94436' });
      markDirty(true); renderInspector(); renderTimeline(); drawFrame();
    };
    body.querySelectorAll('[data-tg]').forEach(inp => inp.addEventListener('input', () => {
      const tg = P.tags[Number(inp.dataset.tg)];
      tg[inp.dataset.k] = inp.type === 'number' ? Number(inp.value) : inp.value;
      markDirty(true); drawFrame(); renderTimeline();
    }));
    body.querySelectorAll('[data-tg-col]').forEach(btn => btn.onclick = () => {
      P.tags[Number(btn.dataset.tgCol)].col = btn.dataset.val;
      markDirty(true); renderInspector(); drawFrame();
    });
    body.querySelectorAll('[data-del-tag]').forEach(btn => btn.onclick = () => {
      P.tags.splice(Number(btn.dataset.delTag), 1);
      markDirty(true); renderInspector(); renderTimeline(); drawFrame();
    });
    bindJumpButtons(body);
  }

  else if (STATE.tab === 'cast') {
    body.innerHTML = `
      <div class="sec-head"><span>Thêm từ kho Sáp Màu (15 mẫu)</span></div>
      <div class="lib-grid">
        ${ENTITY_CATALOG.map(c => `<button type="button" class="lib-btn" data-add-ent="${c.type}"><span class="ico">${c.icon}</span><span>${esc(c.label.split(' ')[0] + ' ' + (c.label.split(' ')[1] || ''))}</span></button>`).join('')}
      </div>

      <div class="sec-head"><span>Đang có trên trang (${(P.entities || []).length})</span></div>
      ${(P.entities || []).map((ent, idx) => {
        const cat = ENTITY_CATALOG.find(c => c.type === ent.type) || { icon: '🎨', label: ent.type, kind: 'mood', moods: ['idle'] };
        const isSel = STATE.selected?.kind === 'entity' && STATE.selected.id === ent.id;
        return `
        <div class="card ${isSel ? 'selected' : ''}">
          <div class="card-head">
            <span class="card-title">${cat.icon} ${esc(cat.label)}</span>
            <button class="btn-mini btn-danger" data-del-ent="${idx}">Xóa</button>
          </div>
          <div class="field-row">
            <label class="field">X <input type="number" step="10" data-ent="${idx}" data-k="x" value="${ent.x}"></label>
            <label class="field">Y <input type="number" step="10" data-ent="${idx}" data-k="y" value="${ent.y}"></label>
            <label class="field">Tỉ lệ <input type="number" step="0.05" min="0.3" max="2.5" data-ent="${idx}" data-k="scale" value="${ent.scale ?? 1}"></label>
          </div>
          <div class="field-row">
            <label class="field">Xuất hiện (s) <input type="number" step="0.1" data-ent="${idx}" data-k="tStart" value="${ent.tStart ?? 0}"></label>
            <label class="field">Vẽ nét (s) <input type="number" step="0.1" min="0" data-ent="${idx}" data-k="drawDur" value="${ent.drawDur ?? 0}"></label>
          </div>
          <div class="sec-head" style="margin-top:2px">
            <span>Trạng thái theo thời gian</span>
            <button class="btn-mini" data-add-st="${idx}">+ Mốc @ ${STATE.t.toFixed(1)}s</button>
          </div>
          ${(ent.states || []).map((st, si) => `
            <div class="field-row" style="align-items:center">
              <input type="number" step="0.1" style="width:54px;background:#141312;color:var(--text);border:1px solid var(--border);border-radius:4px;padding:3px" data-st="${idx}:${si}" data-k="t" value="${st.t}">
              ${(cat.kind === 'human' || cat.kind === 'animal') ? `
                <select style="flex:1;background:#141312;color:var(--text);border:1px solid var(--border);border-radius:4px;padding:3px" data-st="${idx}:${si}" data-k="pose">
                  ${(cat.poses || HUMAN_POSES).map(p => `<option value="${p}" ${p === st.pose ? 'selected' : ''}>${p}</option>`).join('')}
                </select>
                <select style="width:74px;background:#141312;color:var(--text);border:1px solid var(--border);border-radius:4px;padding:3px" data-st="${idx}:${si}" data-k="expr">
                  ${(cat.exprs || HUMAN_EXPRS).map(e => `<option value="${e}" ${e === st.expr ? 'selected' : ''}>${e}</option>`).join('')}
                </select>
                <select style="width:56px;background:#141312;color:var(--text);border:1px solid var(--border);border-radius:4px;padding:3px" data-st="${idx}:${si}" data-k="view">
                  ${HUMAN_VIEWS.map(v => `<option value="${v}" ${v === st.view ? 'selected' : ''}>${v}</option>`).join('')}
                </select>
              ` : `
                <select style="flex:1;background:#141312;color:var(--text);border:1px solid var(--border);border-radius:4px;padding:3px" data-st="${idx}:${si}" data-k="mood">
                  ${(cat.moods || ['idle']).map(m => `<option value="${m}" ${m === st.mood ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
              `}
              <button class="btn-mini" data-jump="${st.t}">▶</button>
              ${ent.states.length > 1 ? `<button class="btn-mini btn-danger" data-del-st="${idx}:${si}">×</button>` : ''}
            </div>
          `).join('')}
        </div>`;
      }).join('')}
    `;

    body.querySelectorAll('[data-add-ent]').forEach(btn => btn.onclick = () => {
      const cat = ENTITY_CATALOG.find(c => c.type === btn.dataset.addEnt);
      const cam = STATE.camOverride || evalCamera(P, STATE.t);
      const id = `${cat.type}_${Date.now().toString(36)}`;
      const initState = (cat.kind === 'human' || cat.kind === 'animal')
        ? { t: 0, view: cat.type === 'gray_wolf' ? 'l34' : 'r34', expr: (cat.exprs && cat.exprs[0]) || 'happy', pose: (cat.poses && cat.poses[0]) || 'stand' }
        : { t: 0, mood: (cat.moods && cat.moods[0]) || 'idle' };
      P.entities.push({ id, type: cat.type, x: Math.round(cam.x), y: Math.round(cam.y + 80), scale: cat.defaultScale, tStart: Number(STATE.t.toFixed(1)), drawDur: 0.8, states: [initState] });
      STATE.selected = { kind: 'entity', id };
      markDirty(true); renderInspector(); drawFrame();
    });
    body.querySelectorAll('[data-ent]').forEach(inp => inp.addEventListener('input', () => {
      P.entities[Number(inp.dataset.ent)][inp.dataset.k] = Number(inp.value);
      markDirty(true); drawFrame();
    }));
    body.querySelectorAll('[data-del-ent]').forEach(btn => btn.onclick = () => {
      P.entities.splice(Number(btn.dataset.delEnt), 1);
      markDirty(true); renderInspector(); drawFrame();
    });
    body.querySelectorAll('[data-add-st]').forEach(btn => btn.onclick = () => {
      const ent = P.entities[Number(btn.dataset.addSt)];
      const last = ent.states[ent.states.length - 1] || {};
      ent.states.push({ ...last, t: Number(STATE.t.toFixed(2)) });
      ent.states.sort((a, b) => a.t - b.t);
      markDirty(true); renderInspector(); drawFrame();
    });
    body.querySelectorAll('[data-st]').forEach(inp => inp.addEventListener('input', () => {
      const [ei, si] = inp.dataset.st.split(':').map(Number);
      P.entities[ei].states[si][inp.dataset.k] = inp.type === 'number' ? Number(inp.value) : inp.value;
      markDirty(true); drawFrame();
    }));
    body.querySelectorAll('[data-del-st]').forEach(btn => btn.onclick = () => {
      const [ei, si] = btn.dataset.delSt.split(':').map(Number);
      P.entities[ei].states.splice(si, 1);
      markDirty(true); renderInspector(); drawFrame();
    });
    bindJumpButtons(body);
  }

  else if (STATE.tab === 'scene') {
    const pal = P.palette;
    const end = P.ending || (P.ending = { type: 'none', tStart: P.meta.duration - 5, tEnd: P.meta.duration - 1.5, fridgeColor: '#cbe3d7' });
    body.innerHTML = `
      <div class="sec-head"><span>Bối cảnh &amp; Lớp màu nước (Wash)</span></div>
      <div class="card">
        <label class="field">Kiểu nền trang sách
          <select id="selWorld">
            <option value="garden-cross-section" ${P.world?.preset === 'garden-cross-section' ? 'selected' : ''}>Mặt cắt khu vườn &amp; lòng đất</option>
            <option value="forest-clearing" ${P.world?.preset === 'forest-clearing' ? 'selected' : ''}>Khu rừng nắng &amp; Dòng sông xanh</option>
            <option value="sunny-meadow" ${P.world?.preset === 'sunny-meadow' ? 'selected' : ''}>Đồng cỏ nắng rộng</option>
            <option value="blank-page" ${P.world?.preset === 'blank-page' ? 'selected' : ''}>Trang giấy trắng tối giản</option>
          </select>
        </label>
        <div class="field-row" style="align-items:center">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;flex:1">
            <input id="chkWash" type="checkbox" ${pal.washEnabled ? 'checked' : ''}> Bật lớp màu nước (1 màu/phim)
          </label>
          <label class="field" style="flex:0 0 90px">Quét từ (s)
            <input id="inpWashT" type="number" step="0.5" value="${pal.washStart ?? 30}">
          </label>
        </div>
        <div class="field-row">
          <label class="field">Màu nước (Preset)
            <select id="selWashPre">
              ${WASH_PRESETS.map(w => `<option value="${w.color}" ${w.color.toLowerCase() === String(pal.washColor).toLowerCase() ? 'selected' : ''}>${esc(w.label)}</option>`).join('')}
            </select>
          </label>
          <label class="field" style="flex:0 0 56px">Tùy chọn
            <input id="inpWashCol" type="color" value="${esc(pal.washColor || '#70b58f')}" style="height:29px;padding:2px">
          </label>
        </div>
        <label class="field">Hiệu ứng sáp trắng ẩn (Wax Resist)
          <select id="selWax">
            <option value="rain-and-roots" ${pal.waxPreset === 'rain-and-roots' ? 'selected' : ''}>Giọt mưa &amp; Rễ cây ẩn dưới đất</option>
            <option value="friendship-hearts" ${pal.waxPreset === 'friendship-hearts' ? 'selected' : ''}>Trái tim ❤️ &amp; Tia sáng tình bạn (Wax Hearts)</option>
            <option value="rain-and-stars" ${pal.waxPreset === 'rain-and-stars' ? 'selected' : ''}>Giọt mưa &amp; Tia sáng lấp lánh</option>
            <option value="starry-night" ${pal.waxPreset === 'starry-night' ? 'selected' : ''}>Bầu trời sao ẩn (Wax Stars)</option>
            <option value="none" ${pal.waxPreset === 'none' ? 'selected' : ''}>Không dùng sáp ẩn</option>
          </select>
        </label>
      </div>

      <div class="sec-head"><span>Cảnh kết (Ending)</span></div>
      <div class="card">
        <div class="field-row">
          <label class="field">Kiểu kết phim
            <select id="selEnding">
              <option value="fridge" ${end.type === 'fridge' ? 'selected' : ''}>Kéo lùi dán tranh lên tủ lạnh</option>
              <option value="none" ${end.type !== 'fridge' ? 'selected' : ''}>Giữ nguyên trên trang sách</option>
            </select>
          </label>
          <label class="field" style="flex:0 0 56px">Màu tủ
            <input id="inpFridgeCol" type="color" value="${esc(end.fridgeColor || '#cbe3d7')}" style="height:29px;padding:2px">
          </label>
        </div>
        <div class="field-row">
          <label class="field">Bắt đầu kéo (s) <input id="inpEndA" type="number" step="0.2" value="${end.tStart ?? 50.8}"></label>
          <label class="field">Xong lúc (s) <input id="inpEndB" type="number" step="0.2" value="${end.tEnd ?? 54.4}"></label>
        </div>
      </div>

      <div class="sec-head">
        <span>Hộp 10 bút sáp màu (≤12, không dùng đen)</span>
        <button id="btnResetPal" class="btn-mini">↺ Mặc định</button>
      </div>
      <div class="palette-grid">
        ${Object.entries(pal.crayons).map(([k, v]) => `
          <label class="pal-item"><input type="color" data-cray="${k}" value="${esc(v)}"><span>${k}</span></label>
        `).join('')}
      </div>

      <div class="sec-head">
        <span>Camera Keyframes (${(P.camera || []).length})</span>
        <button id="btnAddCamKf" class="btn-mini">+ Lưu góc hiện tại</button>
      </div>
      <div class="card">
        ${(P.camera || []).map((kf, idx) => `
          <div class="field-row" style="align-items:center">
            <input type="number" step="0.1" style="width:56px;background:#141312;color:var(--text);border:1px solid var(--border);border-radius:4px;padding:3px" data-cam="${idx}" data-k="t" value="${kf.t}">
            <input type="number" step="10" style="width:62px;background:#141312;color:var(--text);border:1px solid var(--border);border-radius:4px;padding:3px" data-cam="${idx}" data-k="x" value="${kf.x}">
            <input type="number" step="10" style="width:62px;background:#141312;color:var(--text);border:1px solid var(--border);border-radius:4px;padding:3px" data-cam="${idx}" data-k="y" value="${kf.y}">
            <input type="number" step="0.02" style="width:54px;background:#141312;color:var(--text);border:1px solid var(--border);border-radius:4px;padding:3px" data-cam="${idx}" data-k="s" value="${kf.s}">
            <button class="btn-mini" data-jump="${kf.t}">▶</button>
            ${P.camera.length > 1 ? `<button class="btn-mini btn-danger" data-del-cam="${idx}">×</button>` : ''}
          </div>
        `).join('')}
      </div>
    `;
    $('selWorld').onchange = e => { P.world.preset = e.target.value; markDirty(true); drawFrame(); };
    $('chkWash').onchange = e => { pal.washEnabled = e.target.checked; markDirty(true); drawFrame(); renderTimeline(); };
    $('inpWashT').oninput = e => { pal.washStart = Number(e.target.value); markDirty(true); drawFrame(); renderTimeline(); };
    $('selWashPre').onchange = e => { pal.washColor = e.target.value; $('inpWashCol').value = e.target.value; markDirty(true); drawFrame(); };
    $('inpWashCol').oninput = e => { pal.washColor = e.target.value; markDirty(true); drawFrame(); };
    $('selWax').onchange = e => { pal.waxPreset = e.target.value; markDirty(true); drawFrame(); };
    $('selEnding').onchange = e => { end.type = e.target.value; markDirty(true); drawFrame(); renderTimeline(); };
    $('inpFridgeCol').oninput = e => { end.fridgeColor = e.target.value; markDirty(true); drawFrame(); };
    $('inpEndA').oninput = e => { end.tStart = Number(e.target.value); markDirty(true); drawFrame(); renderTimeline(); };
    $('inpEndB').oninput = e => { end.tEnd = Number(e.target.value); markDirty(true); drawFrame(); };
    $('btnResetPal').onclick = () => { pal.crayons = { ...DEFAULT_CRAYONS }; markDirty(true); renderInspector(); drawFrame(); };
    body.querySelectorAll('[data-cray]').forEach(inp => inp.oninput = () => {
      pal.crayons[inp.dataset.cray] = inp.value; markDirty(true); drawFrame();
    });
    $('btnAddCamKf').onclick = () => snapshotCameraKeyframe();
    body.querySelectorAll('[data-cam]').forEach(inp => inp.oninput = () => {
      P.camera[Number(inp.dataset.cam)][inp.dataset.k] = Number(inp.value);
      markDirty(true); drawFrame(); renderTimeline();
    });
    body.querySelectorAll('[data-del-cam]').forEach(btn => btn.onclick = () => {
      P.camera.splice(Number(btn.dataset.delCam), 1);
      markDirty(true); renderInspector(); renderTimeline(); drawFrame();
    });
    bindJumpButtons(body);
  }

  else if (STATE.tab === 'audio') {
    const M = P.music || (P.music = { preset: 'morning-garden', key: 'F', bpm: 108, gains: {} });
    const G = M.gains || (M.gains = {});
    const sliders = [
      ['ukulele', '🎸 Ukulele/Gảy', 0.92],
      ['marimba', '🪵 Marimba', 0.85],
      ['recorder', '🪈 Sáo/Hơi', 0.95],
      ['bassoon', '🎷 Bassoon trầm', 0.78],
      ['glock', '🔔 Glock/Chuông', 1.25],
      ['perc', '🥁 Bộ gõ gỗ', 0.72],
      ['foley', '🖍️ Foley sáp/cọ', 0.76],
      ['voice', '🎙️ Giọng kể', 1.00],
    ];
    body.innerHTML = `
      <div class="sec-head"><span>Nhạc nền gốc CC0 (18 nhạc cụ)</span></div>
      <div class="card">
        <label class="field">Không khí bản nhạc
          <select id="selMusPre">
            <option value="morning-garden" ${M.preset === 'morning-garden' ? 'selected' : ''}>Khu vườn buổi sáng (Ukulele + Sáo + Bassoon)</option>
            <option value="gentle-lullaby" ${M.preset === 'gentle-lullaby' ? 'selected' : ''}>Hát ru dịu dàng (Kalimba + Ocarina + Chuông)</option>
            <option value="playful-adventure" ${M.preset === 'playful-adventure' ? 'selected' : ''}>Phiêu lưu vui nhộn (Guitar + Xylophone + Clarinet)</option>
          </select>
        </label>
        <div class="field-row">
          <label class="field">Tông nhạc
            <select id="selMusKey">
              ${['F', 'C', 'G', 'D', 'Eb'].map(k => `<option value="${k}" ${k === M.key ? 'selected' : ''}>${k} Major</option>`).join('')}
            </select>
          </label>
          <label class="field">Nhịp độ (BPM)
            <input id="inpBpm" type="number" min="60" max="150" value="${M.bpm || 108}">
          </label>
        </div>
      </div>

      <div class="sec-head"><span>Bàn trộn âm lượng (Mixer)</span></div>
      <div class="card">
        ${sliders.map(([k, lbl, def]) => {
          const val = G[k] ?? def;
          return `<div class="slider-row">
            <span class="s-lbl">${lbl}</span>
            <input type="range" min="0" max="1.6" step="0.05" data-gain="${k}" value="${val}">
            <span class="s-val" id="gv_${k}">${Math.round(val * 100)}%</span>
          </div>`;
        }).join('')}
      </div>

      <div class="sec-head">
        <span>Khoảng lặng chủ đích (${(P.silences || []).length})</span>
        <button id="btnAddSil" class="btn-mini">+ Thêm lặng</button>
      </div>
      <div class="card">
        ${(P.silences || []).map((s, idx) => `
          <div class="field-row" style="align-items:center">
            <label class="field">Từ (s) <input type="number" step="0.05" data-sil="${idx}" data-k="t0" value="${s.t0}"></label>
            <label class="field">Tới (s) <input type="number" step="0.05" data-sil="${idx}" data-k="t1" value="${s.t1}"></label>
            <button class="btn-mini btn-danger" data-del-sil="${idx}">×</button>
          </div>
        `).join('') || '<span style="color:var(--muted);font-size:11.5px">Chưa có khoảng lặng (khuyến nghị 1–2 nhịp lặng trước cao trào).</span>'}
      </div>

      <div class="sec-head"><span>Kiểm tra &amp; Xuất bản</span></div>
      <div class="card">
        <button id="btnRunReadcheck" class="btn btn-secondary" style="justify-content:center">🔍 Kiểm tra thời lượng đọc chữ (readcheck)</button>
        ${STATE.media.hasMp4 ? `<button id="btnOpenMp4" class="btn btn-accent-soft" style="justify-content:center">▶ Xem video ${esc(STATE.slug)}.mp4 đã xuất</button>` : ''}
      </div>
    `;
    $('selMusPre').onchange = e => { M.preset = e.target.value; markDirty(true); };
    $('selMusKey').onchange = e => { M.key = e.target.value; markDirty(true); };
    $('inpBpm').oninput = e => { M.bpm = Number(e.target.value); markDirty(true); };
    body.querySelectorAll('[data-gain]').forEach(r => r.oninput = () => {
      const k = r.dataset.gain; G[k] = Number(r.value);
      $(`gv_${k}`).textContent = `${Math.round(G[k] * 100)}%`;
      markDirty(true);
    });
    $('btnAddSil').onclick = () => {
      P.silences.push({ id: `sil_${Date.now().toString(36)}`, t0: Number(STATE.t.toFixed(2)), t1: Number((STATE.t + 1.2).toFixed(2)) });
      markDirty(true); renderInspector(); renderTimeline();
    };
    body.querySelectorAll('[data-sil]').forEach(inp => inp.oninput = () => {
      P.silences[Number(inp.dataset.sil)][inp.dataset.k] = Number(inp.value);
      markDirty(true); renderTimeline();
    });
    body.querySelectorAll('[data-del-sil]').forEach(btn => btn.onclick = () => {
      P.silences.splice(Number(btn.dataset.delSil), 1);
      markDirty(true); renderInspector(); renderTimeline();
    });
    $('btnRunReadcheck').onclick = () => runSSEJob('readcheck', 'Kiểm tra thời lượng đọc chữ (readcheck.mjs)');
    if ($('btnOpenMp4')) $('btnOpenMp4').onclick = () => openVideoModal(STATE.media.mp4Url);
  }
}

function bindJumpButtons(container) {
  container.querySelectorAll('[data-jump]').forEach(btn => btn.onclick = () => {
    STATE.camOverride = null;
    seekTo(Number(btn.dataset.jump));
  });
}

function snapshotCameraKeyframe() {
  if (!STATE.project) return;
  const cur = STATE.camOverride || evalCamera(STATE.project, STATE.t);
  const t = Number(STATE.t.toFixed(2));
  const list = STATE.project.camera;
  const existing = list.find(k => Math.abs(k.t - t) < 0.08);
  if (existing) { existing.x = Math.round(cur.x); existing.y = Math.round(cur.y); existing.s = Number(cur.s.toFixed(2)); }
  else { list.push({ t, x: Math.round(cur.x), y: Math.round(cur.y), s: Number(cur.s.toFixed(2)) }); list.sort((a, b) => a.t - b.t); }
  STATE.camOverride = null;
  markDirty(true); renderTimeline(); if (STATE.tab === 'scene') renderInspector(); drawFrame();
}

// ——— API Calls & SSE Streaming Jobs ———
async function refreshProjects(selectSlug = null) {
  const res = await fetch('/api/projects');
  const data = await res.json();
  STATE.projects = data.projects || [];
  const sel = $('projSelect');
  sel.innerHTML = STATE.projects.map(p => `<option value="${esc(p.slug)}">${esc(p.title)} (${esc(p.aspect)})</option>`).join('');
  const target = selectSlug || STATE.slug || (STATE.projects[0]?.slug);
  if (target) {
    sel.value = target;
    await loadProject(target);
  }
}

async function loadProject(slug) {
  setPlaying(false);
  const res = await fetch(`/api/projects/${encodeURIComponent(slug)}`);
  if (!res.ok) return;
  const data = await res.json();
  STATE.slug = slug;
  STATE.project = data.project;
  STATE.media = data.media;
  STATE.t = 0;
  STATE.camOverride = null;
  STATE.selected = null;
  markDirty(false);
  syncMediaUI();
  applyAspect();
  renderTimeline();
  renderInspector();
  drawFrame();
}

function syncMediaUI() {
  const badge = $('audioBadge');
  if (STATE.media.hasMix && STATE.media.mixUrl) {
    mixAudio.src = `${STATE.media.mixUrl}?cb=${Date.now()}`;
    badge.textContent = '🔊 Bản trộn mix.wav (đồng bộ)';
    badge.classList.add('ready');
  } else {
    mixAudio.removeAttribute('src');
    badge.textContent = STATE.media.voices?.length ? `🎙️ ${STATE.media.voices.length} câu thoại (bấm Trộn Nhạc)` : '🔇 Chưa có âm thanh';
    badge.classList.remove('ready');
  }
  $('btnPreviewMp4').classList.toggle('hidden', !STATE.media.hasMp4);
}

async function saveProject() {
  if (!STATE.project || !STATE.slug) return true;
  const res = await fetch(`/api/projects/${encodeURIComponent(STATE.slug)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(STATE.project),
  });
  if (res.ok) {
    const d = await res.json();
    STATE.media = d.media;
    markDirty(false);
    syncMediaUI();
    return true;
  }
  return false;
}

async function runSSEJob(action, title) {
  setPlaying(false);
  await saveProject();
  $('jobTitle').textContent = title;
  $('jobBar').style.width = '4%';
  $('jobLabel').textContent = 'Đang kết nối pipeline...';
  $('jobLog').textContent = '';
  $('jobResult').innerHTML = '';
  $('jobResult').classList.add('hidden');
  $('btnCloseJob').disabled = true;
  $('btnDoneJob').disabled = true;
  $('modalJob').classList.remove('hidden');

  try {
    const res = await fetch(`/api/projects/${encodeURIComponent(STATE.slug)}/${action}`, { method: 'POST' });
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 2);
        if (!chunk.startsWith('data:')) continue;
        const msg = JSON.parse(chunk.slice(5).trim());
        if (msg.type === 'log') {
          const logEl = $('jobLog');
          logEl.textContent += msg.text + '\n';
          logEl.scrollTop = logEl.scrollHeight;
        } else if (msg.type === 'progress') {
          $('jobBar').style.width = `${msg.pct}%`;
          $('jobLabel').textContent = msg.label;
        } else if (msg.type === 'error') {
          $('jobLabel').textContent = `❌ Lỗi: ${msg.message}`;
          $('jobBar').style.background = '#d9534f';
        } else if (msg.type === 'done') {
          if (msg.project) STATE.project = msg.project;
          if (msg.asr) STATE.asr = msg.asr;
          if (msg.media) STATE.media = msg.media;
          syncMediaUI();
          renderInspector();
          renderTimeline();
          drawFrame();
          if (action === 'export' && msg.media?.mp4Url) {
            const box = $('jobResult');
            box.innerHTML = `
              <div style="margin-bottom:8px;color:#8af0b9;font-weight:600">✓ Xuất thành công: ${esc(STATE.slug)}.mp4 (${esc(msg.sizeMb)} MB) · ${esc(msg.loudness || '-14 LUFS')}</div>
              <video controls autoplay src="${esc(msg.media.mp4Url)}?cb=${Date.now()}"></video>
              <div style="margin-top:8px;display:flex;gap:8px">
                <a class="btn btn-primary" href="${esc(msg.media.mp4Url)}" download="${esc(STATE.slug)}.mp4">⬇ Tải xuống MP4</a>
                <a class="btn btn-secondary" href="/films/${esc(STATE.slug)}/subtitles_en_vi.srt" download>📄 Tải phụ đề .SRT</a>
              </div>`;
            box.classList.remove('hidden');
          }
        }
      }
    }
  } catch (e) {
    $('jobLabel').textContent = `❌ Lỗi kết nối: ${e.message}`;
  } finally {
    $('btnCloseJob').disabled = false;
    $('btnDoneJob').disabled = false;
  }
}

function openVideoModal(url) {
  $('jobTitle').textContent = `Video đã xuất — ${STATE.slug}.mp4`;
  $('jobBar').style.width = '100%';
  $('jobLabel').textContent = 'Đang phát bản MP4 hoàn chỉnh';
  $('jobLog').classList.add('hidden');
  const box = $('jobResult');
  box.innerHTML = `<video controls autoplay src="${esc(url)}?cb=${Date.now()}"></video>
    <div style="margin-top:8px"><a class="btn btn-primary" href="${esc(url)}" download="${esc(STATE.slug)}.mp4">⬇ Tải xuống MP4</a></div>`;
  box.classList.remove('hidden');
  $('modalJob').classList.remove('hidden');
}

// ——— Toolbar & Keyboard Wiring ———
$('projSelect').onchange = e => loadProject(e.target.value);

document.querySelectorAll('.seg-btn').forEach(btn => btn.onclick = () => {
  if (!STATE.project) return;
  STATE.project.meta.aspect = btn.dataset.aspect;
  markDirty(true);
  applyAspect();
  drawFrame();
});
$('btnDragMode').onclick = () => {
  STATE.dragMode = !STATE.dragMode;
  $('btnDragMode').classList.toggle('active', STATE.dragMode);
  drawOverlay();
};
$('btnGuides').onclick = () => {
  STATE.showGuides = !STATE.showGuides;
  $('btnGuides').classList.toggle('active', STATE.showGuides);
  drawOverlay();
};
$('btnCamReset').onclick = () => { STATE.camOverride = null; drawFrame(); };
$('btnCamSnap').onclick = () => snapshotCameraKeyframe();
$('btnSave').onclick = () => saveProject();
$('btnTTS').onclick = () => runSSEJob('tts', 'Tạo giọng đọc TTS & Kiểm tra Whisper ASR');
$('btnAudio').onclick = () => runSSEJob('audio', 'Soạn nhạc gốc CC0 & Trộn Foley + Giọng kể');
$('btnExport').onclick = () => runSSEJob('export', `Xuất video MP4 — ${STATE.slug} (${STATE.project?.meta?.aspect})`);
$('btnPreviewMp4').onclick = () => openVideoModal(STATE.media.mp4Url);

$('btnStart').onclick = () => { setPlaying(false); seekTo(0); };
$('btnPrevF').onclick = () => { setPlaying(false); seekTo(STATE.t - 1 / 24); };
$('btnNextF').onclick = () => { setPlaying(false); seekTo(STATE.t + 1 / 24); };
$('btnPlay').onclick = () => setPlaying(!STATE.playing);
$('inpDuration').onchange = e => {
  if (!STATE.project) return;
  STATE.project.meta.duration = Math.max(4, Number(e.target.value) || 20);
  markDirty(true); renderTimeline(); drawFrame();
};
$('inpTlZoom').oninput = e => { STATE.tlZoom = Number(e.target.value); renderTimeline(); };

// Modals
function openNewModal(mode) {
  STATE.newMode = mode;
  $('modalNewTitle').textContent = mode === 'duplicate' ? `Nhân bản "${STATE.project?.meta?.title}"` : 'Tạo tập phim Crayon mới';
  $('newTitle').value = mode === 'duplicate' ? `${STATE.project?.meta?.title} Copy` : 'Five Red Apples';
  $('newTitleVi').value = mode === 'duplicate' ? `${STATE.project?.meta?.titleVi} (Bản sao)` : 'Năm Quả Táo Đỏ';
  $('newSlug').value = slugify($('newTitle').value);
  $('newAspect').value = STATE.project?.meta?.aspect || '16:9';
  $('newDurWrap').classList.toggle('hidden', mode === 'duplicate');
  $('newErr').classList.add('hidden');
  $('modalNew').classList.remove('hidden');
}
$('btnNew').onclick = () => openNewModal('blank');
$('btnDup').onclick = () => openNewModal('duplicate');
$('newTitle').oninput = e => { $('newSlug').value = slugify(e.target.value); };

$('btnConfirmNew').onclick = async () => {
  const payload = {
    slug: $('newSlug').value.trim(),
    title: $('newTitle').value.trim(),
    titleVi: $('newTitleVi').value.trim(),
    aspect: $('newAspect').value,
    duration: Number($('newDur').value) || 20,
    fromSlug: STATE.newMode === 'duplicate' ? STATE.slug : undefined,
  };
  const res = await fetch('/api/projects', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    $('newErr').textContent = data.error || 'Không tạo được dự án';
    $('newErr').classList.remove('hidden');
    return;
  }
  $('modalNew').classList.add('hidden');
  await refreshProjects(data.slug);
};

document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => {
  $(b.dataset.close).classList.add('hidden');
  $('jobLog').classList.remove('hidden');
});

window.addEventListener('keydown', ev => {
  const tag = (ev.target?.tagName || '').toLowerCase();
  const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') {
    ev.preventDefault(); saveProject(); return;
  }
  if (typing) return;
  if (ev.code === 'Space') { ev.preventDefault(); setPlaying(!STATE.playing); }
  else if (ev.key === ',') { setPlaying(false); seekTo(STATE.t - 1 / 24); }
  else if (ev.key === '.') { setPlaying(false); seekTo(STATE.t + 1 / 24); }
  else if (ev.key === 'Home') { setPlaying(false); seekTo(0); }
});

// Boot Studio after loading fonts!
Promise.all([
  document.fonts.load('400 50px "Patrick Hand"'),
  document.fonts.load('600 42px "Mali"'),
  document.fonts.load('700 74px "Mali"'),
  document.fonts.ready,
]).then(() => refreshProjects());
