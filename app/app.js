"use strict";
const $ = (id) => document.getElementById(id);
const pad = (n, w = 2) => String(n).padStart(w, "0");

// ---- Stopwatch
let swStart = 0, swElapsed = 0, swRunning = false, laps = [], raf = 0;
const swNow = () => swElapsed + (swRunning ? performance.now() - swStart : 0);
function fmtSw(ms) {
  const cs = Math.floor(ms / 10) % 100, s = Math.floor(ms / 1000) % 60, m = Math.floor(ms / 60000);
  return `${pad(m)}:${pad(s)}<small>.${pad(cs)}</small>`;
}
function swTick() {
  $("sw-clock").innerHTML = fmtSw(swNow());
  if (swRunning) raf = requestAnimationFrame(swTick);
}
$("sw-go").addEventListener("click", () => {
  if (swRunning) { swElapsed = swNow(); swRunning = false; cancelAnimationFrame(raf); }
  else { swStart = performance.now(); swRunning = true; swTick(); }
  $("sw-go").textContent = swRunning ? "Stop" : "Start";
  $("sw-lap").disabled = !swRunning;
});
$("sw-lap").addEventListener("click", () => {
  const total = swNow();
  laps.push(total - laps.reduce((a, b) => a + b, 0));
  renderLaps();
});
$("sw-reset").addEventListener("click", () => {
  swRunning = false; swElapsed = 0; laps = [];
  cancelAnimationFrame(raf);
  $("sw-go").textContent = "Start";
  $("sw-lap").disabled = true;
  swTick();
  renderLaps();
});
function renderLaps() {
  const min = Math.min(...laps), max = Math.max(...laps);
  $("laps").innerHTML = laps.map((l, i) => `<li class="${laps.length > 2 && l === min ? "best" : laps.length > 2 && l === max ? "worst" : ""}"><span>Lap ${i + 1}</span><span>${fmtSw(l).replace(/<\/?small>/g, "")}</span></li>`).reverse().join("");
}

// ---- Countdown
let cdTotal = 300000, cdLeft = 300000, cdEnd = 0, cdTimer = 0;
function fmtCd(ms) {
  const s = Math.ceil(ms / 1000);
  return s >= 3600 ? `${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}` : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}
function cdRender() {
  const left = cdEnd ? Math.max(0, cdEnd - Date.now()) : cdLeft;
  $("cd-clock").textContent = fmtCd(left);
  document.title = cdEnd ? `${fmtCd(left)} · Countdown` : "Stopwatch & Countdown";
  if (cdEnd && left === 0) {
    clearInterval(cdTimer);
    cdEnd = 0;
    cdLeft = cdTotal;
    $("cd-go").textContent = "Start";
    $("cd-msg").textContent = "Time's up!";
    chime();
  }
}
function setCd(ms) {
  clearInterval(cdTimer);
  cdEnd = 0;
  cdTotal = cdLeft = ms;
  $("cd-go").textContent = "Start";
  $("cd-msg").textContent = "";
  cdRender();
}
$("cd-go").addEventListener("click", () => {
  if (cdEnd) { cdLeft = cdEnd - Date.now(); cdEnd = 0; clearInterval(cdTimer); $("cd-go").textContent = "Resume"; }
  else if (cdLeft > 0) { cdEnd = Date.now() + cdLeft; cdTimer = setInterval(cdRender, 200); $("cd-go").textContent = "Pause"; $("cd-msg").textContent = ""; }
  cdRender();
});
$("cd-reset").addEventListener("click", () => setCd(cdTotal));
$("cd-set").addEventListener("click", () => {
  const ms = (Math.max(0, Number($("cd-min").value) || 0) * 60 + Math.min(59, Math.max(0, Number($("cd-sec").value) || 0))) * 1000;
  if (ms > 0) setCd(ms);
});
for (const [label, ms] of [["1 min", 60000], ["3 min", 180000], ["5 min", 300000], ["10 min", 600000], ["15 min", 900000], ["30 min", 1800000], ["1 hour", 3600000]]) {
  const b = document.createElement("button");
  b.textContent = label;
  b.addEventListener("click", () => setCd(ms));
  $("presets").append(b);
}
function chime() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < 3; i++) {
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * 0.35;
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + 0.32);
    }
    setTimeout(() => ac.close(), 1500);
  } catch { /* no audio */ }
}

// ---- Tabs
document.querySelectorAll('[role="tab"]').forEach((t) => t.addEventListener("click", () => {
  document.querySelectorAll('[role="tab"]').forEach((x) => {
    x.setAttribute("aria-selected", String(x === t));
    $(x.getAttribute("aria-controls")).hidden = x !== t;
  });
}));
swTick();
cdRender();
