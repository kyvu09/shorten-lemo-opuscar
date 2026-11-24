#!/usr/bin/env node
// Local Web Studio server for Crayon Book Studio (127.0.0.1 only, zero external npm dependencies).
// Serves /studio/, /engine/, /core/, /films/, /styles/ + REST APIs + SSE streaming jobs (TTS, Audio, Readcheck, MP4 Export).
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { VOICE_CATALOG, aspectDimensions, createBlankProject, projectToLines, projectToSrt } from '../engine/schema.js';
import { ENTITY_CATALOG } from '../engine/library.js';
import { buildAutoDirectedProject } from '../engine/autodirector.js';
import { testGeminiConnection, generateCustomPropWithGemini, directScriptWithGemini } from '../engine/gemini_director.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILMS_DIR = path.join(ROOT, 'films');
const CONFIG_PATH = path.join(ROOT, '.studio-config.json');
const CUSTOM_PROPS_PATH = path.join(ROOT, 'engine', 'custom_props.json');
const PORT = Number(process.env.PORT || 4173);

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {}
  return {};
}
function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}
function getGeminiKey(cfg = loadConfig()) {
  return String(cfg.geminiApiKey || process.env.GEMINI_API_KEY || '').trim();
}
function loadCustomProps() {
  try {
    if (fs.existsSync(CUSTOM_PROPS_PATH)) {
      const arr = JSON.parse(fs.readFileSync(CUSTOM_PROPS_PATH, 'utf-8'));
      return Array.isArray(arr) ? arr : [];
    }
  } catch {}
  return [];
}
function saveCustomProps(arr) {
  fs.writeFileSync(CUSTOM_PROPS_PATH, JSON.stringify(arr, null, 2), 'utf-8');
}
function upsertCustomProps(newProps) {
  if (!Array.isArray(newProps) || !newProps.length) return loadCustomProps();
  const list = loadCustomProps();
  for (const np of newProps) {
    const idx = list.findIndex(x => x.type === np.type);
    if (idx >= 0) list[idx] = np; else list.push(np);
  }
  saveCustomProps(list);
  return list;
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.srt': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8'
};

function findPython() {
  const win = path.join(ROOT, '.venv', 'Scripts', 'python.exe');
  if (fs.existsSync(win)) return win;
  const nix = path.join(ROOT, '.venv', 'bin', 'python');
  if (fs.existsSync(nix)) return nix;
  return 'python';
}

function findSh() {
  if (process.platform === 'win32') {
    for (const p of ['C:\\Program Files\\Git\\bin\\sh.exe', 'C:\\Program Files\\Git\\usr\\bin\\sh.exe', 'C:\\Program Files (x86)\\Git\\bin\\sh.exe']) {
      if (fs.existsSync(p)) return p;
    }
  }
  return 'sh';
}

const PY = findPython();
const SH = findSh();

function safeSlug(raw) {
  const s = String(raw || '').trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '');
  if (!s || s.length > 64 || s.includes('..')) return null;
  return s;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 10 * 1024 * 1024) { reject(new Error('Body too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function serveStatic(req, res, absPath) {
  if (absPath !== ROOT && !absPath.startsWith(ROOT + path.sep)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.stat(absPath, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    const ct = MIME[path.extname(absPath).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (m) {
        const start = m[1] ? parseInt(m[1], 10) : 0;
        const end = m[2] ? Math.min(parseInt(m[2], 10), st.size - 1) : st.size - 1;
        res.writeHead(206, {
          'Content-Type': ct,
          'Content-Range': `bytes ${start}-${end}/${st.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': (end - start) + 1,
          'Cache-Control': 'no-store'
        });
        fs.createReadStream(absPath, { start, end }).pipe(res);
        return;
      }
    }
    res.writeHead(200, { 'Content-Type': ct, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
    fs.createReadStream(absPath).pipe(res);
  });
}

function playerHtml(title) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${String(title || 'Crayon Book Film').replace(/</g, '&lt;')}</title>
  <link rel="stylesheet" href="fonts/fonts.css">
  <style>
    html, body { margin: 0; background: #f4efe3; overflow: hidden; }
    canvas { position: absolute; left: 0; top: 0; display: block; }
  </style>
</head>
<body>
  <canvas id="gl"></canvas>
  <script type="module" src="/engine/player.js"></script>
</body>
</html>
`;
}

function defaultFontsCss() {
  return `@font-face { font-family: 'Patrick Hand'; font-weight: 400; src: url(PatrickHand-Regular.ttf) format('truetype'); font-display: block; }
@font-face { font-family: 'Mali'; font-weight: 600; src: url(Mali-SemiBold.ttf) format('truetype'); font-display: block; }
@font-face { font-family: 'Mali'; font-weight: 700; src: url(Mali-Bold.ttf) format('truetype'); font-display: block; }
`;
}

function ensureProjectFonts(projDir) {
  const dstFonts = path.join(projDir, 'fonts');
  fs.mkdirSync(dstFonts, { recursive: true });
  const cssPath = path.join(dstFonts, 'fonts.css');
  if (!fs.existsSync(cssPath)) fs.writeFileSync(cssPath, defaultFontsCss(), 'utf-8');
  const srcFonts = path.join(FILMS_DIR, 'one-little-seed', 'fonts');
  if (fs.existsSync(srcFonts)) {
    for (const f of ['PatrickHand-Regular.ttf', 'Mali-SemiBold.ttf', 'Mali-Bold.ttf']) {
      const sp = path.join(srcFonts, f), dp = path.join(dstFonts, f);
      if (fs.existsSync(sp) && !fs.existsSync(dp)) fs.copyFileSync(sp, dp);
    }
  }
}

function writeProjectFiles(projDir, project) {
  fs.mkdirSync(projDir, { recursive: true });
  fs.writeFileSync(path.join(projDir, 'project.json'), JSON.stringify(project, null, 2), 'utf-8');
  fs.writeFileSync(path.join(projDir, 'lines.json'), JSON.stringify(projectToLines(project), null, 2), 'utf-8');
  fs.writeFileSync(path.join(projDir, 'subtitles_en_vi.srt'), projectToSrt(project), 'utf-8');
  ensureProjectFonts(projDir);
  if (!fs.existsSync(path.join(projDir, 'index.html'))) {
    fs.writeFileSync(path.join(projDir, 'index.html'), playerHtml(project.meta?.title), 'utf-8');
  }
  const creditsPath = path.join(projDir, 'CREDITS');
  if (!fs.existsSync(creditsPath)) {
    fs.writeFileSync(creditsPath, `CREDITS — ${project.meta?.title || 'Crayon Book Film'}

Fonts (SIL Open Font License 1.1, Google Fonts): Patrick Hand, Mali
Audio Samples (CC0 1.0): FreePats project, VS Chamber Orchestra: Community Edition (Versilian Studios), Versilian Community Sample Library (Versilian Studios)
Voice Engine: Kokoro-82M (Apache 2.0) / Microsoft Edge-TTS
Engine: Crayon Book Studio (MIT License)
`, 'utf-8');
  }
  const buildPath = path.join(projDir, 'build.sh');
  if (!fs.existsSync(buildPath)) {
    const slug = project.meta?.slug || path.basename(projDir);
    const { w, h } = aspectDimensions(project.meta?.aspect);
    fs.writeFileSync(buildPath, `#!/bin/sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=\${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
cd "$LIB"
node core/render/events.mjs "$HERE" --size ${w}x${h}
"$LIB/.venv/bin/python" engine/score_gen.py "$HERE"
"$LIB/.venv/bin/python" engine/mix_gen.py "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size ${w}x${h} --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/master_crf19.mp4" 24 0
ffmpeg -y -loglevel error -i "$HERE/out/master_crf19.mp4" -c:v libx264 -preset slow -crf 25 -c:a copy -movflags +faststart "$HERE/${slug}.mp4"
rm -f "$HERE/out/master_crf19.mp4"
`, 'utf-8');
  }
}

function listProjects() {
  if (!fs.existsSync(FILMS_DIR)) return [];
  const out = [];
  for (const name of fs.readdirSync(FILMS_DIR)) {
    const dir = path.join(FILMS_DIR, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    const pFile = path.join(dir, 'project.json');
    if (!fs.existsSync(pFile)) continue;
    try {
      const p = JSON.parse(fs.readFileSync(pFile, 'utf-8'));
      const mp4 = `${name}.mp4`;
      out.push({
        slug: name,
        title: p.meta?.title || name,
        titleVi: p.meta?.titleVi || '',
        duration: p.meta?.duration || 30,
        aspect: p.meta?.aspect || '16:9',
        hasMix: fs.existsSync(path.join(dir, 'out', 'mix.wav')),
        hasMp4: fs.existsSync(path.join(dir, mp4)),
        mp4Url: fs.existsSync(path.join(dir, mp4)) ? `/films/${name}/${mp4}` : null,
        posterUrl: fs.existsSync(path.join(dir, 'poster.jpg')) ? `/films/${name}/poster.jpg` : null,
      });
    } catch {}
  }
  return out;
}

function projectMediaState(slug) {
  const dir = path.join(FILMS_DIR, slug);
  const voicesDir = path.join(dir, 'voices');
  const voices = fs.existsSync(voicesDir)
    ? fs.readdirSync(voicesDir).filter(f => f.endsWith('.wav')).map(f => f.replace(/\.wav$/, ''))
    : [];
  const mp4Name = `${slug}.mp4`;
  return {
    hasMix: fs.existsSync(path.join(dir, 'out', 'mix.wav')),
    mixUrl: fs.existsSync(path.join(dir, 'out', 'mix.wav')) ? `/films/${slug}/out/mix.wav` : null,
    hasMp4: fs.existsSync(path.join(dir, mp4Name)),
    mp4Url: fs.existsSync(path.join(dir, mp4Name)) ? `/films/${slug}/${mp4Name}` : null,
    posterUrl: fs.existsSync(path.join(dir, 'poster.jpg')) ? `/films/${slug}/poster.jpg` : null,
    voices,
  };
}

// Spawn a child command and stream stdout/stderr lines to SSE client!
function runStep(cmd, args, { env = {}, onLine }) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: ROOT,
      env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', LEMO_FETCH: '0', ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let allOut = '';
    const feed = chunk => {
      const txt = chunk.toString('utf8');
      allOut += txt;
      for (const line of txt.split(/\r?\n/)) {
        if (line.trim()) onLine(line);
      }
    };
    child.stdout.on('data', feed);
    child.stderr.on('data', feed);
    child.on('error', err => reject(err));
    child.on('close', code => {
      if (code === 0) resolve(allOut);
      else reject(new Error(`${path.basename(cmd)} exited with code ${code}`));
    });
  });
}

function beginSSE(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  return obj => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };
}

// ——— Job Handlers ———
async function handleTTS(slug, res) {
  const send = beginSSE(res);
  const dir = path.join(FILMS_DIR, slug);
  const pFile = path.join(dir, 'project.json');
  try {
    const project = JSON.parse(fs.readFileSync(pFile, 'utf-8'));
    const voicesDir = path.join(dir, 'voices');
    fs.mkdirSync(voicesDir, { recursive: true });
    if (project.meta?.narrationMode === 'bilingual') {
      send({ type: 'progress', pct: 20, label: 'Đang tạo giọng song ngữ EN → VI (Kokoro + Edge-TTS)...' });
      await runStep(PY, ['engine/bilingual_tts.py', dir, '--mode', 'bilingual'], { onLine: l => send({ type: 'log', text: l }) });
      const biDurs = JSON.parse(fs.readFileSync(path.join(voicesDir, 'bilingual_durs.json'), 'utf-8'));
      const durs = {};
      for (const s of project.subtitles || []) {
        if (biDurs[s.id]) {
          s.dur = biDurs[s.id].totalDur;
          s.enDur = biDurs[s.id].enDur;
          durs[s.id] = biDurs[s.id].totalDur;
        }
      }
      writeProjectFiles(dir, project);
      send({ type: 'progress', pct: 100, label: 'Hoàn tất tạo giọng song ngữ EN → VI!' });
      send({ type: 'done', project, durs, asr: {}, media: projectMediaState(slug) });
      return;
    }
    const lines = projectToLines(project);

    const kokoroLines = lines.filter(l => l.engine !== 'edge-tts');
    const edgeLines   = lines.filter(l => l.engine === 'edge-tts');
    const durs = {};

    if (kokoroLines.length) {
      const tmpK = path.join(voicesDir, '_lines_kokoro.json');
      fs.writeFileSync(tmpK, JSON.stringify(kokoroLines, null, 2), 'utf-8');
      send({ type: 'progress', pct: 15, label: `Đang tạo ${kokoroLines.length} câu Kokoro (Offline)...` });
      await runStep(PY, ['core/tts/tts.py', tmpK, voicesDir], { onLine: l => send({ type: 'log', text: l }) });
      Object.assign(durs, JSON.parse(fs.readFileSync(path.join(voicesDir, 'dur.json'), 'utf-8')));
      fs.rmSync(tmpK, { force: true });
    }
    if (edgeLines.length) {
      const tmpE = path.join(voicesDir, '_lines_edge.json');
      fs.writeFileSync(tmpE, JSON.stringify(edgeLines, null, 2), 'utf-8');
      send({ type: 'progress', pct: 50, label: `Đang tạo ${edgeLines.length} câu Edge-TTS (Online)...` });
      await runStep(PY, ['core/tts/tts_zh.py', tmpE, voicesDir], { onLine: l => send({ type: 'log', text: l }) });
      Object.assign(durs, JSON.parse(fs.readFileSync(path.join(voicesDir, 'dur.json'), 'utf-8')));
      fs.rmSync(tmpE, { force: true });
    }
    fs.writeFileSync(path.join(voicesDir, 'dur.json'), JSON.stringify(durs, null, 2), 'utf-8');

    // Update measured durations back into project.json
    for (const s of project.subtitles || []) {
      if (durs[s.id]) {
        s.dur = durs[s.id];
        if (s.t1 - s.vt < s.dur + 0.65) s.t1 = Number((s.vt + s.dur + 0.85).toFixed(2));
      }
    }
    writeProjectFiles(dir, project);

    // Whisper ASR check on English Kokoro lines
    const asrResults = {};
    if (kokoroLines.length) {
      const tmpA = path.join(voicesDir, '_lines_asr.json');
      fs.writeFileSync(tmpA, JSON.stringify(kokoroLines, null, 2), 'utf-8');
      send({ type: 'progress', pct: 75, label: 'Đang kiểm tra phát âm bằng Whisper ASR...' });
      try {
        const out = await runStep(PY, ['core/tts/asr_check.py', tmpA, voicesDir, '--lang', 'en'], {
          onLine: l => send({ type: 'log', text: l })
        });
        for (const line of out.split(/\r?\n/)) {
          const m = /^(OK|DIFF)\s+(\S+)\s+\|/.exec(line.trim());
          if (m) asrResults[m[2]] = m[1];
        }
      } catch (e) {
        send({ type: 'log', text: `[ASR note] ${e.message}` });
      }
      fs.rmSync(tmpA, { force: true });
    }

    send({ type: 'progress', pct: 100, label: 'Hoàn tất tạo giọng đọc!' });
    send({ type: 'done', project, durs, asr: asrResults, media: projectMediaState(slug) });
  } catch (e) {
    send({ type: 'error', message: e.message });
  } finally {
    res.end();
  }
}

async function handleAudio(slug, res) {
  const send = beginSSE(res);
  const dir = path.join(FILMS_DIR, slug);
  try {
    const project = JSON.parse(fs.readFileSync(path.join(dir, 'project.json'), 'utf-8'));
    const { w, h } = aspectDimensions(project.meta?.aspect);
    send({ type: 'progress', pct: 15, label: 'Xuất timeline events.json...' });
    await runStep('node', ['core/render/events.mjs', dir, '--size', `${w}x${h}`], { onLine: l => send({ type: 'log', text: l }) });

    send({ type: 'progress', pct: 45, label: 'Đang soạn nhạc gốc CC0 (18 nhạc cụ sách tranh)...' });
    await runStep(PY, ['engine/score_gen.py', dir], { onLine: l => send({ type: 'log', text: l }) });

    send({ type: 'progress', pct: 80, label: 'Đang trộn Foley, Ambience & Giọng kể...' });
    await runStep(PY, ['engine/mix_gen.py', dir], { onLine: l => send({ type: 'log', text: l }) });

    send({ type: 'progress', pct: 100, label: 'Đã tạo xong bản trộn âm thanh out/mix.wav!' });
    send({ type: 'done', media: projectMediaState(slug) });
  } catch (e) {
    send({ type: 'error', message: e.message });
  } finally {
    res.end();
  }
}

async function handleReadcheck(slug, res) {
  const send = beginSSE(res);
  const dir = path.join(FILMS_DIR, slug);
  try {
    const project = JSON.parse(fs.readFileSync(path.join(dir, 'project.json'), 'utf-8'));
    const { w, h } = aspectDimensions(project.meta?.aspect);
    send({ type: 'progress', pct: 30, label: `Kiểm tra thời lượng đọc chữ (${w}×${h})...` });
    let ok = true;
    try {
      await runStep('node', ['core/render/readcheck.mjs', dir, '--size', `${w}x${h}`], { onLine: l => send({ type: 'log', text: l }) });
    } catch (e) {
      ok = false;
      send({ type: 'log', text: `⚠ Một số nhãn chưa đủ thời lượng đọc (${e.message})` });
    }
    send({ type: 'progress', pct: 100, label: ok ? 'Tất cả nhãn chữ đều đạt chuẩn!' : 'Có nhãn chữ cần kéo dài thời lượng.' });
    send({ type: 'done', ok });
  } catch (e) {
    send({ type: 'error', message: e.message });
  } finally {
    res.end();
  }
}

async function handleExport(slug, res) {
  const send = beginSSE(res);
  const dir = path.join(FILMS_DIR, slug);
  try {
    const project = JSON.parse(fs.readFileSync(path.join(dir, 'project.json'), 'utf-8'));
    const { w, h } = aspectDimensions(project.meta?.aspect);
    const fps = Number(project.meta?.fps || 24);
    const dur = Number(project.meta?.duration || 30);
    const totalFrames = Math.round(dur * fps);

    // 1. Events & Audio mix
    send({ type: 'progress', pct: 5, label: '1/5 · Xuất timeline & kiểm tra âm thanh...' });
    await runStep('node', ['core/render/events.mjs', dir, '--size', `${w}x${h}`], { onLine: l => send({ type: 'log', text: l }) });
    await runStep(PY, ['engine/score_gen.py', dir], { onLine: l => send({ type: 'log', text: l }) });
    await runStep(PY, ['engine/mix_gen.py', dir], { onLine: l => send({ type: 'log', text: l }) });

    // 2. Render 24fps frames
    send({ type: 'progress', pct: 18, label: `2/5 · Đang render ${totalFrames} khung hình (${w}×${h} @ ${fps}fps)...` });
    const rawVid = path.join(dir, 'out', 'video.mp4');
    const workerDone = {};
    await runStep('node', ['core/render/video.mjs', dir, '--fps', String(fps), '--workers', '4', '--size', `${w}x${h}`, '--out', rawVid], {
      onLine: l => {
        send({ type: 'log', text: l });
        const m = /^w(\d+)\s+(\d+)\/(\d+)/.exec(l.trim());
        if (m) {
          workerDone[m[1]] = Number(m[2]) / Math.max(1, Number(m[3]));
          const vals = Object.values(workerDone);
          const avg = vals.reduce((a, b) => a + b, 0) / Math.max(4, vals.length);
          send({ type: 'progress', pct: Math.round(18 + avg * 56), label: `2/5 · Đang render khung hình (${Math.round(avg * 100)}%)...` });
        }
      }
    });

    // 3. Mux two-pass -14 LUFS + CRF 25 optimize
    send({ type: 'progress', pct: 76, label: '3/5 · Ghép âm thanh chuẩn −14 LUFS (two-pass loudnorm)...' });
    const mixWav = path.join(dir, 'out', 'mix.wav');
    const crf19 = path.join(dir, 'out', 'master_crf19.mp4');
    const finalMp4 = path.join(dir, `${slug}.mp4`);
    const toPosix = p => p.replace(/\\/g, '/');
    let loudness = '';
    await runStep(SH, ['core/render/mux.sh', toPosix(rawVid), toPosix(mixWav), toPosix(crf19), String(fps), '0'], {
      onLine: l => {
        send({ type: 'log', text: l });
        if (/^\s*(I|LRA|Peak):/.test(l)) loudness += l.trim() + '  ';
      }
    });

    send({ type: 'progress', pct: 88, label: '4/5 · Tối ưu dung lượng H.264 (CRF 25 + faststart)...' });
    await runStep('ffmpeg', ['-y', '-loglevel', 'error', '-i', crf19, '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-c:a', 'copy', '-movflags', '+faststart', finalMp4], {
      onLine: l => send({ type: 'log', text: l })
    });
    fs.rmSync(crf19, { force: true });

    // 4. Poster still
    send({ type: 'progress', pct: 95, label: '5/5 · Xuất poster.jpg...' });
    const posterT = Math.max(0.5, Math.min(dur - 1.0, (project.ending?.tStart ?? (dur * 0.78)) - 0.5)).toFixed(2);
    await runStep('node', ['core/render/still.mjs', dir, posterT, '--size', `${w}x${h}`, '--prefix', 'poster_', '--out', path.join(dir, 'out')], {
      onLine: l => send({ type: 'log', text: l })
    });
    const pSrc = path.join(dir, 'out', `poster_${posterT}.jpg`);
    if (fs.existsSync(pSrc)) {
      fs.copyFileSync(pSrc, path.join(dir, 'poster.jpg'));
      fs.rmSync(pSrc, { force: true });
    }
    fs.rmSync(rawVid, { force: true });

    const sizeMb = (fs.statSync(finalMp4).size / 1024 / 1024).toFixed(1);
    send({ type: 'progress', pct: 100, label: `Xuất phim hoàn tất (${sizeMb} MB)!` });
    send({ type: 'done', loudness: loudness.trim(), sizeMb, media: projectMediaState(slug) });
  } catch (e) {
    send({ type: 'error', message: e.message });
  } finally {
    res.end();
  }
}

async function handleAutoDirectProduce(body, res) {
  const send = beginSSE(res);
  try {
    const rawSlug = body.slug || body.title || 'my-crayon-story';
    let slug = safeSlug(rawSlug) || 'my-crayon-story';
    if (!body.overwrite && fs.existsSync(path.join(FILMS_DIR, slug))) {
      let n = 2;
      while (fs.existsSync(path.join(FILMS_DIR, `${slug}-${n}`))) n++;
      slug = `${slug}-${n}`;
    }
    const dir = path.join(FILMS_DIR, slug);
    const opts = {
      slug,
      title: String(body.title || 'My Crayon Story').trim(),
      titleVi: String(body.titleVi || 'Câu Chuyện Sáp Màu').trim(),
      aspect: body.aspect === '9:16' ? '9:16' : '16:9',
      narrationMode: ['bilingual', 'en', 'vi'].includes(body.narrationMode) ? body.narrationMode : 'bilingual',
      worldPreset: body.worldPreset || 'auto',
      washPreset: body.washPreset || 'auto',
      scriptText: String(body.scriptText || ''),
    };
    const renderMp4 = body.renderMp4 !== false;

    // 1. Parse script + optional Gemini AI Director & missing-prop auto-generator!
    const cfg = loadConfig();
    const apiKey = getGeminiKey(cfg);
    const useGemini = Boolean(body.useGemini) && Boolean(apiKey);
    let customProps = loadCustomProps();
    let geminiPlan = null;

    if (useGemini) {
      send({ type: 'progress', pct: 4, label: '1/5 · Gemini AI đang phân tích kịch bản & tự vẽ đạo cụ còn thiếu...' });
      const existingTypes = [...ENTITY_CATALOG.map(c => c.type), ...customProps.map(c => c.type), ...customProps.map(c => c.id)];
      try {
        geminiPlan = await directScriptWithGemini(apiKey, {
          scriptText: opts.scriptText,
          existingTypes,
          model: cfg.geminiModel || 'gemini-2.5-flash',
          onLog: txt => send({ type: 'log', text: txt }),
        });
        if (geminiPlan.generatedProps?.length) {
          customProps = upsertCustomProps(geminiPlan.generatedProps);
        }
      } catch (ge) {
        send({ type: 'log', text: `[Gemini fallback -> Offline] ${ge.message}` });
      }
    }

    send({ type: 'progress', pct: 10, label: '1/5 · Phân tích kịch bản, nhân vật & phân vai...' });
    const draft = buildAutoDirectedProject({ ...opts, customProps, geminiPlan });
    if (!draft.project.subtitles.length) {
      throw new Error('Không tìm thấy câu thoại nào trong kịch bản. Hãy dán ít nhất 1 câu chuyện!');
    }
    writeProjectFiles(dir, draft.project);
    fs.writeFileSync(path.join(dir, 'script_raw.txt'), opts.scriptText, 'utf-8');
    send({ type: 'log', text: `Chủ đề: ${draft.summary.theme} (${draft.summary.world}) | Nhân vật: ${draft.summary.cast.map(c => c.icon + ' ' + c.name).join(', ')} | ${draft.summary.lineCount} câu thoại` });

    // 2. Synthesize role-played voices (EN->VI bilingual, EN-only, or VI-only)
    const modeLabel = opts.narrationMode === 'bilingual' ? 'song ngữ EN → VI' : (opts.narrationMode === 'vi' ? 'tiếng Việt' : 'tiếng Anh offline');
    send({ type: 'progress', pct: 16, label: `2/5 · Đang thu giọng phân vai (${modeLabel})...` });
    await runStep(PY, ['engine/bilingual_tts.py', dir, '--mode', opts.narrationMode], {
      onLine: l => send({ type: 'log', text: l })
    });

    // 3. Re-lock choreography, camera, silence beats & tags to EXACT measured voice durations!
    send({ type: 'progress', pct: 40, label: '3/5 · Khóa mốc thời gian, camera & diễn xuất theo giọng thật...' });
    const biPath = path.join(dir, 'voices', 'bilingual_durs.json');
    const measuredDurs = fs.existsSync(biPath) ? JSON.parse(fs.readFileSync(biPath, 'utf-8')) : null;
    const finalBuild = buildAutoDirectedProject({ ...opts, measuredDurs, customProps, geminiPlan });
    const project = finalBuild.project;
    writeProjectFiles(dir, project);
    const { w, h } = aspectDimensions(project.meta.aspect);
    const fps = Number(project.meta.fps || 24);
    const dur = Number(project.meta.duration || 30);

    // 4. Events, CC0 Score & Foley Mix
    send({ type: 'progress', pct: 48, label: '4/5 · Soạn nhạc nền CC0, trộn Foley & giọng đọc...' });
    await runStep('node', ['core/render/events.mjs', dir, '--size', `${w}x${h}`], { onLine: l => send({ type: 'log', text: l }) });
    await runStep(PY, ['engine/score_gen.py', dir], { onLine: l => send({ type: 'log', text: l }) });
    await runStep(PY, ['engine/mix_gen.py', dir], { onLine: l => send({ type: 'log', text: l }) });

    try {
      await runStep('node', ['core/render/readcheck.mjs', dir, '--size', `${w}x${h}`], { onLine: l => send({ type: 'log', text: l }) });
    } catch (e) {
      send({ type: 'log', text: `[readcheck note] ${e.message}` });
    }

    if (!renderMp4) {
      send({ type: 'progress', pct: 100, label: `Đã dựng xong dự án "${slug}" (${dur}s) — sẵn sàng chỉnh sửa!` });
      send({ type: 'done', slug, project, summary: finalBuild.summary, media: projectMediaState(slug) });
      return;
    }

    // 5. Full 24fps render + -14 LUFS master MP4 + poster.jpg!
    const totalFrames = Math.round(dur * fps);
    send({ type: 'progress', pct: 58, label: `5/5 · Đang render ${totalFrames} khung hình (${w}×${h} @ ${fps}fps)...` });
    const rawVid = path.join(dir, 'out', 'video.mp4');
    const workerDone = {};
    await runStep('node', ['core/render/video.mjs', dir, '--fps', String(fps), '--workers', '4', '--size', `${w}x${h}`, '--out', rawVid], {
      onLine: l => {
        send({ type: 'log', text: l });
        const m = /^w(\d+)\s+(\d+)\/(\d+)/.exec(l.trim());
        if (m) {
          workerDone[m[1]] = Number(m[2]) / Math.max(1, Number(m[3]));
          const vals = Object.values(workerDone);
          const avg = vals.reduce((a, b) => a + b, 0) / Math.max(4, vals.length);
          send({ type: 'progress', pct: Math.round(58 + avg * 28), label: `5/5 · Đang render video (${Math.round(avg * 100)}%)...` });
        }
      }
    });

    send({ type: 'progress', pct: 88, label: 'Đang ghép âm thanh chuẩn −14 LUFS & tối ưu MP4...' });
    const mixWav = path.join(dir, 'out', 'mix.wav');
    const crf19 = path.join(dir, 'out', 'master_crf19.mp4');
    const finalMp4 = path.join(dir, `${slug}.mp4`);
    const toPosix = s => s.replace(/\\/g, '/');
    let loudness = '';
    await runStep(SH, ['core/render/mux.sh', toPosix(rawVid), toPosix(mixWav), toPosix(crf19), String(fps), '0'], {
      onLine: l => {
        send({ type: 'log', text: l });
        if (/^\s*(I|LRA|Peak):/.test(l)) loudness += l.trim() + '  ';
      }
    });
    await runStep('ffmpeg', ['-y', '-loglevel', 'error', '-i', crf19, '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-c:a', 'copy', '-movflags', '+faststart', finalMp4], {
      onLine: l => send({ type: 'log', text: l })
    });
    fs.rmSync(crf19, { force: true });
    fs.rmSync(rawVid, { force: true });

    const posterT = Math.max(0.5, Math.min(dur - 1.0, (project.ending?.tStart ?? (dur * 0.78)) - 0.5)).toFixed(2);
    await runStep('node', ['core/render/still.mjs', dir, posterT, '--size', `${w}x${h}`, '--prefix', 'poster_', '--out', path.join(dir, 'out')], {
      onLine: l => send({ type: 'log', text: l })
    });
    const pSrc = path.join(dir, 'out', `poster_${posterT}.jpg`);
    if (fs.existsSync(pSrc)) {
      fs.copyFileSync(pSrc, path.join(dir, 'poster.jpg'));
      fs.rmSync(pSrc, { force: true });
    }

    const sizeMb = (fs.statSync(finalMp4).size / 1024 / 1024).toFixed(1);
    send({ type: 'progress', pct: 100, label: `Tạo video tự động hoàn tất (${sizeMb} MB)!` });
    send({ type: 'done', slug, project, summary: finalBuild.summary, loudness: loudness.trim(), sizeMb, media: projectMediaState(slug) });
  } catch (e) {
    send({ type: 'error', message: e.message });
  } finally {
    res.end();
  }
}

// ——— HTTP Router ———
const server = http.createServer(async (req, res) => {
  try {
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || '')) {
      res.writeHead(403); res.end('Forbidden host'); return;
    }
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const p = decodeURIComponent(urlObj.pathname);

    if (p === '/' || p === '/studio') {
      res.writeHead(302, { Location: '/studio/' }); res.end(); return;
    }

    // REST APIs
    if (p === '/api/voices' && req.method === 'GET') {
      return sendJson(res, 200, { voices: VOICE_CATALOG });
    }
    if (p === '/api/settings' && req.method === 'GET') {
      const cfg = loadConfig();
      const key = getGeminiKey(cfg);
      return sendJson(res, 200, {
        hasGeminiKey: Boolean(key),
        geminiKeyMasked: key ? `••••${key.slice(-4)}` : '',
        geminiModel: cfg.geminiModel || 'gemini-2.5-flash',
      });
    }
    if (p === '/api/settings' && req.method === 'PUT') {
      const body = await readJsonBody(req);
      const cfg = loadConfig();
      if (typeof body.geminiApiKey === 'string') cfg.geminiApiKey = body.geminiApiKey.trim();
      if (typeof body.geminiModel === 'string' && body.geminiModel.trim()) cfg.geminiModel = body.geminiModel.trim();
      saveConfig(cfg);
      const key = getGeminiKey(cfg);
      return sendJson(res, 200, { ok: true, hasGeminiKey: Boolean(key), geminiKeyMasked: key ? `••••${key.slice(-4)}` : '', geminiModel: cfg.geminiModel || 'gemini-2.5-flash' });
    }
    if (p === '/api/settings/test-gemini' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const cfg = loadConfig();
      const key = (typeof body.geminiApiKey === 'string' && body.geminiApiKey.trim()) ? body.geminiApiKey.trim() : getGeminiKey(cfg);
      const model = body.geminiModel || cfg.geminiModel || 'gemini-2.5-flash';
      const out = await testGeminiConnection(key, model);
      return sendJson(res, 200, out);
    }
    if (p === '/api/custom-props' && req.method === 'GET') {
      return sendJson(res, 200, { customProps: loadCustomProps() });
    }
    if (p === '/api/custom-props/generate' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const cfg = loadConfig();
      const key = getGeminiKey(cfg);
      if (!key) return sendJson(res, 400, { error: 'Vui lòng nhập và lưu Gemini API Key trước khi tạo đạo cụ AI!' });
      const query = String(body.query || '').trim();
      if (!query) return sendJson(res, 400, { error: 'Hãy nhập tên hoặc mô tả đạo cụ cần vẽ (vd: khủng long, xe đạp đỏ...)' });
      const prop = await generateCustomPropWithGemini(key, { query, idHint: body.idHint || '', model: cfg.geminiModel || 'gemini-2.5-flash' });
      const customProps = upsertCustomProps([prop]);
      return sendJson(res, 201, { prop, customProps });
    }
    const mDelProp = /^\/api\/custom-props\/([^/]+)$/.exec(p);
    if (mDelProp && req.method === 'DELETE') {
      const t = decodeURIComponent(mDelProp[1]);
      const list = loadCustomProps().filter(x => x.type !== t);
      saveCustomProps(list);
      return sendJson(res, 200, { ok: true, customProps: list });
    }
    if (p === '/api/autodirect/preview' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const out = buildAutoDirectedProject({ ...body, customProps: loadCustomProps() });
      return sendJson(res, 200, { summary: out.summary, project: out.project });
    }
    if (p === '/api/autodirect/produce' && req.method === 'POST') {
      const body = await readJsonBody(req);
      return handleAutoDirectProduce(body, res);
    }
    if (p === '/api/projects' && req.method === 'GET') {
      return sendJson(res, 200, { projects: listProjects() });
    }
    if (p === '/api/projects' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const slug = safeSlug(body.slug || body.title || 'new-story');
      if (!slug) return sendJson(res, 400, { error: 'Tên slug không hợp lệ (chỉ dùng a-z, 0-9, -)' });
      const dir = path.join(FILMS_DIR, slug);
      if (fs.existsSync(dir)) return sendJson(res, 409, { error: `Dự án "${slug}" đã tồn tại` });
      let project;
      if (body.fromSlug) {
        const src = safeSlug(body.fromSlug);
        const srcPath = path.join(FILMS_DIR, src || '', 'project.json');
        if (!fs.existsSync(srcPath)) return sendJson(res, 404, { error: 'Không tìm thấy dự án mẫu để nhân bản' });
        project = JSON.parse(fs.readFileSync(srcPath, 'utf-8'));
        project.meta.slug = slug;
        if (body.title) project.meta.title = body.title;
        if (body.titleVi) project.meta.titleVi = body.titleVi;
        if (body.aspect) project.meta.aspect = body.aspect;
      } else {
        project = createBlankProject(slug, {
          title: body.title || 'My Story',
          titleVi: body.titleVi || 'Câu Chuyện Của Bé',
          aspect: body.aspect || '16:9',
          duration: Number(body.duration) || 20.0,
        });
      }
      writeProjectFiles(dir, project);
      return sendJson(res, 201, { slug, project, media: projectMediaState(slug) });
    }

    const mProj = /^\/api\/projects\/([^/]+)$/.exec(p);
    if (mProj) {
      const slug = safeSlug(mProj[1]);
      if (!slug) return sendJson(res, 400, { error: 'Invalid slug' });
      const dir = path.join(FILMS_DIR, slug);
      const pFile = path.join(dir, 'project.json');
      if (req.method === 'GET') {
        if (!fs.existsSync(pFile)) return sendJson(res, 404, { error: 'Project not found' });
        const project = JSON.parse(fs.readFileSync(pFile, 'utf-8'));
        return sendJson(res, 200, { project, media: projectMediaState(slug) });
      }
      if (req.method === 'PUT') {
        const project = await readJsonBody(req);
        project.meta = { ...(project.meta || {}), slug };
        writeProjectFiles(dir, project);
        return sendJson(res, 200, { ok: true, media: projectMediaState(slug) });
      }
    }

    const mAct = /^\/api\/projects\/([^/]+)\/(tts|audio|readcheck|export)$/.exec(p);
    if (mAct && req.method === 'POST') {
      const slug = safeSlug(mAct[1]);
      if (!slug || !fs.existsSync(path.join(FILMS_DIR, slug, 'project.json'))) {
        return sendJson(res, 404, { error: 'Project not found' });
      }
      if (mAct[2] === 'tts')       return handleTTS(slug, res);
      if (mAct[2] === 'audio')     return handleAudio(slug, res);
      if (mAct[2] === 'readcheck') return handleReadcheck(slug, res);
      if (mAct[2] === 'export')    return handleExport(slug, res);
    }

    // Static files
    let rel = p.replace(/^\/+/, '');
    if (rel.endsWith('/') || rel === '') rel += 'index.html';
    const abs = path.resolve(ROOT, rel);
    serveStatic(req, res, abs);
  } catch (e) {
    console.error('[studio]', e);
    if (!res.headersSent) sendJson(res, 500, { error: e.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  🖍️  Crayon Book Studio đang chạy tại: http://127.0.0.1:${PORT}/studio/\n`);
});
