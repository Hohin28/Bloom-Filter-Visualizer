const API = "http://localhost:5000";

/* neon per word */
const wordColorMap = new Map();
const highlightMap = new Map();

const COLOR_POOL = [
  "#38bdf8", "#a855f7", "#22c55e", "#f97316", "#e11d48",
  "#06b6d4", "#facc15", "#84cc16", "#fb7185", "#60a5fa"
];
let colorIndex = 0;

function $(id){ return document.getElementById(id); }

/* ====== Hash logic same as backend bloom.exe ======
   we generate hashes using list of bases.
*/
const BASES = [31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83];

function hashBaseStep(word, base, M){
  let h = 0;
  const steps = [];
  for(const ch of word){
    const code = ch.charCodeAt(0);
    const before = h;
    h = (h * base + code) % M;
    steps.push({ ch, code, before, after: h });
  }
  return { base, result: h, steps };
}

function computeHashes(word, M, K){
  const hashes = [];
  for(let i=0;i<K;i++){
    hashes.push(hashBaseStep(word, BASES[i % BASES.length], M));
  }
  return hashes;
}

/* ====== Legend ====== */
function getColorForWord(word){
  if(wordColorMap.has(word)) return wordColorMap.get(word);
  const c = COLOR_POOL[colorIndex++ % COLOR_POOL.length];
  wordColorMap.set(word, c);
  updateLegend();
  return c;
}

function updateLegend(){
  const legend = $("legend");
  legend.innerHTML = "";
  for(const [word, color] of wordColorMap.entries()){
    const item = document.createElement("div");
    item.className = "legend-item";

    const box = document.createElement("div");
    box.className = "legend-color";
    box.style.background = color;

    const txt = document.createElement("div");
    txt.textContent = word;

    item.appendChild(box);
    item.appendChild(txt);
    legend.appendChild(item);
  }
}

/* ====== badge + stats ====== */
function setBadge(type, text){
  const badge = $("resultBadge");
  badge.className = `pill ${type}`;
  badge.textContent = text;
}
function clearBadge(){
  const badge = $("resultBadge");
  badge.className = "pill hidden";
  badge.textContent = "";
}

function updateStats(data){
  if(data.M !== undefined) $("statM").textContent = data.M;
  if(data.K !== undefined) $("statK").textContent = data.K;
  if(data.n !== undefined) $("statN").textContent = data.n;
  if(data.falsePositiveProb !== undefined){
    const percent = (data.falsePositiveProb * 100).toFixed(4);
    $("statFP").textContent = `${percent}%`;
  }
}

/* ====== show K calculation ======
   Optimal k ≈ (m/n) ln(2)
*/
function showKCalculation(M, n, chosenK){
  const box = $("kCalcBox");
  if(!box) return;

  if(!M || !n || n === 0){
    box.innerText = "Recommended K (optimal) will appear here after insert/search.";
    return;
  }

  const optimal = (M / n) * Math.log(2);
  const rounded = Math.max(1, Math.round(optimal));

  box.innerText =
    `Optimal K ≈ (M/n) ln(2) = (${M}/${n})×0.693 = ${optimal.toFixed(2)} → suggested K = ${rounded}.  (Chosen K = ${chosenK})`;
}

/* ====== action effects ====== */
function playInsertEffects(){
  universeBoost(1.9, 450);

  const wave = $("gridWave");
  wave.classList.remove("hidden");
  wave.classList.remove("play");
  void wave.offsetWidth;
  wave.classList.add("play");
  setTimeout(() => wave.classList.add("hidden"), 950);
}

function playSearchEffects(){
  universeScanWave();

  const scan = $("scanLine");
  scan.classList.remove("hidden");
  scan.classList.remove("play");
  void scan.offsetWidth;
  scan.classList.add("play");
  setTimeout(() => scan.classList.add("hidden"), 1150);
}

/* ====== highlights ====== */
function resetHighlights(){ highlightMap.clear(); }

function addHighlightsForWord(word, hashes){
  const color = getColorForWord(word);
  hashes.forEach((idx) => {
    if(!highlightMap.has(idx)) highlightMap.set(idx, []);
    highlightMap.get(idx).push({word, color});
  });
}

/* ====== render bits ====== */
function renderBits(bits, pulseIndices = []){
  const container = $("bitArray");
  container.innerHTML = "";

  const M = bits.length;
  let cols = 10;
  if(M <= 50) cols = 10;
  else if(M <= 100) cols = 20;
  else cols = 25;

  container.style.gridTemplateColumns = `repeat(${cols}, minmax(48px, 1fr))`;

  bits.forEach((b, i) => {
    const cell = document.createElement("div");
    cell.className = `bit ${b === 1 ? "one" : "zero"}`;

    if(highlightMap.has(i)){
      const arr = highlightMap.get(i);
      const top = arr[arr.length - 1];
      cell.classList.add("highlight");
      cell.style.outlineColor = top.color;
    }

    if(pulseIndices.includes(i)){
      cell.classList.add("pulse");
      setTimeout(() => cell.classList.remove("pulse"), 700);
    }

    cell.innerHTML = `
      <div class="index">${i}</div>
      <div class="value">${b}</div>
    `;

    attachMagnetic(cell);
    container.appendChild(cell);
  });
}

function attachMagnetic(el){
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const mx = e.clientX - r.left - r.width/2;
    const my = e.clientY - r.top - r.height/2;
    const tx = (mx / r.width) * 10;
    const ty = (my / r.height) * 10;
    el.style.transform = `translate(${tx}px, ${ty}px) translateY(-6px) scale(1.02)`;
  });
  el.addEventListener("mouseleave", () => { el.style.transform = ""; });
}

/* ====== Hash explanation panel ====== */
function renderHashExplain(word, M, K, mode, indices){
  const wrap = $("hashExplain");
  const hashes = computeHashes(word, M, K);

  const cards = hashes.map((h, idx) => {
    const stepPreview = h.steps.slice(0, Math.min(6, h.steps.length))
      .map(s => `${s.before}*${h.base}+${s.code} % ${M} = ${s.after}`)
      .join(" → ");

    return `
      <div class="hash-card">
        <div><b>Hash ${idx+1}</b> <span class="small">(base = ${h.base})</span></div>
        <div class="small">Formula: h = (h * ${h.base} + charCode) % M</div>
        <div class="hash-row">
          <div class="hash-tag">Result index: ${h.result}</div>
          <div class="hash-tag">Bit[${h.result}]</div>
        </div>
        <div class="small" style="margin-top:8px;">
          Steps: ${stepPreview}${h.steps.length > 6 ? " ..." : ""}
        </div>
      </div>
    `;
  }).join("");

  wrap.innerHTML = `
    <div class="hash-card">
      <div><b>Word:</b> ${word}</div>
      <div class="small">
        Mode: ${mode} • Bloom Filter chooses K indices using hash functions.
      </div>
      <div class="hash-row" style="margin-top:10px;">
        <div class="hash-tag">M = ${M}</div>
        <div class="hash-tag">K = ${K}</div>
        <div class="hash-tag">Indices = [${indices.join(", ")}]</div>
      </div>
    </div>
    ${cards}
  `;
}

/* ====== API calls ====== */
async function loadStatus(){
  clearBadge();
  const res = await fetch(`${API}/status`);
  const data = await res.json();
  $("resultBox").innerText = JSON.stringify(data);
  updateStats(data);

  showKCalculation(data.M, data.n, data.K);

  if(data.bitArray) renderBits(data.bitArray);
}

async function initBloom(){
  const size = Number($("sizeInput").value);
  const k = Number($("kInput").value);

  if(!size || size <= 0){ alert("Enter valid M!"); return; }
  if(!k || k <= 0){ alert("Enter valid K!"); return; }

  const res = await fetch(`${API}/init`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ size, k })
  });

  const data = await res.json();
  $("resultBox").innerText = JSON.stringify(data);

  resetHighlights();
  wordColorMap.clear();
  colorIndex = 0;
  updateLegend();

  $("hashExplain").innerHTML = `<div class="hint">Insert/Search a word to see hashing steps.</div>`;

  updateStats(data);
  showKCalculation(data.M, data.n, data.K);

  if(data.bitArray) renderBits(data.bitArray);
  setBadge("ok", `Initialized M=${size}, K=${k}`);
}

async function insertWord(){
  const word = $("wordInput").value.trim();
  if(!word){ alert("Enter a word!"); return; }

  const res = await fetch(`${API}/insert`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ word })
  });

  const data = await res.json();
  $("resultBox").innerText = JSON.stringify(data);
  updateStats(data);
  showKCalculation(data.M, data.n, data.K);

  if(data.hashes) addHighlightsForWord(word, data.hashes);
  if(data.bitArray) renderBits(data.bitArray, data.hashes);

  if(data.M !== undefined && data.hashes){
    renderHashExplain(word, data.M, data.K, "INSERT", data.hashes);
  }

  setBadge("ok", `Inserted "${word}"`);
  playInsertEffects();
}

async function searchWord(){
  const word = $("wordInput").value.trim();
  if(!word){ alert("Enter a word!"); return; }

  const res = await fetch(`${API}/search`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ word })
  });

  const data = await res.json();
  $("resultBox").innerText = JSON.stringify(data);
  updateStats(data);
  showKCalculation(data.M, data.n, data.K);

  if(data.hashes) addHighlightsForWord(word, data.hashes);
  if(data.bitArray) renderBits(data.bitArray, data.hashes);

  if(data.M !== undefined && data.hashes){
    renderHashExplain(word, data.M, data.K, "SEARCH", data.hashes);
  }

  if(data.result === "definitely_not_present"){
    setBadge("bad", "Definitely NOT present ❌");
  } else if(data.result === "probably_present"){
    setBadge("warn", "Probably present ✅ (false + possible)");
  } else clearBadge();

  playSearchEffects();
}

/* ===== Universe background (same as your code) ===== */
const canvas = $("universe");
const ctx = canvas.getContext("2d");
let W = 0, H = 0;
let particles = [];
let speedBoost = 1;
let boostUntil = 0;

function resize(){
  W = canvas.width = window.innerWidth * devicePixelRatio;
  H = canvas.height = window.innerHeight * devicePixelRatio;
}
window.addEventListener("resize", resize);
resize();

function rand(min,max){ return Math.random()*(max-min)+min; }

function initParticles(){
  const count = Math.floor((window.innerWidth * window.innerHeight) / 12000);
  particles = new Array(Math.min(140, Math.max(60, count))).fill(0).map(() => ({
    x: rand(0, W),
    y: rand(0, H),
    z: rand(0.2, 1.0),
    vx: rand(-0.20, 0.20),
    vy: rand(-0.12, 0.12),
    r: rand(1.0, 2.4)
  }));
}
initParticles();

function universeBoost(mult = 2.0, ms = 500){
  speedBoost = mult;
  boostUntil = performance.now() + ms;
}
let scanWaveT = 0;
function universeScanWave(){ scanWaveT = performance.now(); }

function drawBackground(t){
  const g = ctx.createLinearGradient(0,0,W,H);
  const shift = (Math.sin(t*0.0002)+1)/2;
  g.addColorStop(0, `rgba(56,189,248,${0.07+shift*0.05})`);
  g.addColorStop(0.5, `rgba(168,85,247,${0.04+(1-shift)*0.04})`);
  g.addColorStop(1, `rgba(34,197,94,0.02)`);

  ctx.fillStyle = "rgba(2,3,11,0.6)";
  ctx.fillRect(0,0,W,H);
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);
}

function tick(t){
  const now = performance.now();
  if(now > boostUntil) speedBoost = 1;
  drawBackground(t);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

loadStatus();
