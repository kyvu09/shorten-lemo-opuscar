// Universal standalone player for any Studio project (films/<slug>/index.html imports this).
// Guarantees 100% WYSIWYG parity between Web Studio GUI preview and headless video.mjs / still.mjs / readcheck.mjs!
import { makeComp } from './gl.js';
import { setView } from './crayon.js';
import { renderProject, buildEventsFromProject, getVisibleTexts, getFrameLayout } from './scene.js';
import { renderModelSheet } from './sheet.js';

const canvas = document.getElementById('gl');
const W = innerWidth || 1920;
const H = innerHeight || 1080;
setView(W, H);
const comp = makeComp(canvas, W, H);
const params = new URLSearchParams(location.search);
const testMode = params.get('test');
const sheetPage = params.get('page') || 'forest_cast';

let project = null;
let lastTexts = [];

window.TEXTS = (t) => {
  if (!project || testMode === 'model') return [];
  return getVisibleTexts(project, t);
};

window.LAYOUT = (t) => {
  if (!project || testMode === 'model') return { w: W, h: H, fridgeP: 0, texts: [], actors: [] };
  return getFrameLayout(project, t);
};

window.render = (t) => {
  if (!project) return true;
  if (testMode === 'model') {
    renderModelSheet(comp, project, sheetPage);
    return true;
  }
  const res = renderProject(comp, canvas, project, t, { allowSkip: true });
  lastTexts = res.visibleTexts;
  return !res.skipped;
};

async function boot() {
  const res = await fetch('project.json?cb=' + Date.now());
  if (!res.ok) throw new Error('project.json not found');
  project = await res.json();

  window.DUR = Number(project.meta?.duration) || 30.0;
  window.EV = buildEventsFromProject(project);

  await Promise.all([
    document.fonts.load('400 50px "Patrick Hand"'),
    document.fonts.load('600 42px "Mali"'),
    document.fonts.load('700 74px "Mali"'),
    document.fonts.ready,
  ]);
  window.render(0);
  window.READY = true;
}

boot();
