// Entry point for "One Little Seed" (exposes window.DUR, window.EV, window.render, window.TEXTS, window.READY).
import { makeComp, W, H } from './gl.js';
import { DUR, buildEvents } from './timeline.js';
import { renderFilm, getVisibleTexts } from './film.js';
import { renderModelSheet } from './sheet.js';

const canvas = document.getElementById('gl');
canvas.width = W; canvas.height = H;
const comp = makeComp(canvas, W, H);
const params = new URLSearchParams(location.search);

window.DUR = DUR;
window.EV = buildEvents();
window.TEXTS = (t) => getVisibleTexts(t);

window.render = (t) => {
  if (params.get('test') === 'model') {
    renderModelSheet(comp, params.get('page') || 'leo');
    return;
  }
  renderFilm(comp, canvas, t);
};

// Wait for self-hosted OFL fonts (Patrick Hand + Mali SemiBold/Bold) before setting READY
Promise.all([
  document.fonts.load('400 50px "Patrick Hand"'),
  document.fonts.load('600 42px "Mali"'),
  document.fonts.load('700 76px "Mali"'),
  document.fonts.ready
]).then(() => {
  window.render(0);
  window.READY = true;
});
