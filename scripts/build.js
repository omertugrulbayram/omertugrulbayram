// Profil README'sini ve assets/*.svg dosyalarını üretir. Sayılar GitHub'dan gelir, bağımlılık yok.
// Çalıştırma: GH_TOKEN=<token> node scripts/build.js
// Yazılar kendi 5x7 pixel yazı tipimizle yol olarak çizilir; <img> içindeki SVG dışarıdan yazı tipi yükleyemez.
const fs = require('fs');
const path = require('path');

const USER = 'omertugrulbayram';
const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const G = { bg: '#070b08', panel: '#0c120d', bar: '#132016', hi: '#7dffa0', mid: '#33ff66', dim: '#1f9a42', low: '#0f4a22', amber: '#ffb347' };

// ---- Pixel yazı tipi ----
const F = {
  A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110',
  C: '01110 10001 10000 10000 10000 10001 01110', D: '11110 10001 10001 10001 10001 10001 11110',
  E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01110 10001 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001',
  I: '01110 00100 00100 00100 00100 00100 01110', J: '00111 00010 00010 00010 00010 10010 01100',
  K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 10001 11001 10101 10011 10001 10001',
  O: '01110 10001 10001 10001 10001 10001 01110', P: '11110 10001 10001 11110 10000 10000 10000',
  Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100',
  U: '10001 10001 10001 10001 10001 10001 01110', V: '10001 10001 10001 10001 10001 01010 00100',
  W: '10001 10001 10001 10101 10101 11011 10001', X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
  0: '01110 10001 10011 10101 11001 10001 01110', 1: '00100 01100 00100 00100 00100 00100 01110',
  2: '01110 10001 00001 00010 00100 01000 11111', 3: '11110 00001 00001 01110 00001 00001 11110',
  4: '00010 00110 01010 10010 11111 00010 00010', 5: '11111 10000 11110 00001 00001 10001 01110',
  6: '00110 01000 10000 11110 10001 10001 01110', 7: '11111 00001 00010 00100 01000 01000 01000',
  8: '01110 10001 10001 01110 10001 10001 01110', 9: '01110 10001 10001 01111 00001 00010 01100',
  '.': '00000 00000 00000 00000 00000 01100 01100', ',': '00000 00000 00000 00000 01100 00100 01000',
  ':': '00000 01100 01100 00000 01100 01100 00000', '-': '00000 00000 00000 11111 00000 00000 00000',
  _: '00000 00000 00000 00000 00000 00000 11111', '/': '00001 00001 00010 00100 01000 10000 10000',
  '>': '10000 01000 00100 00010 00100 01000 10000', '<': '00001 00010 00100 01000 00100 00010 00001',
  $: '00100 01111 10100 01110 00101 11110 00100', '#': '01010 01010 11111 01010 11111 01010 01010',
  '!': '00100 00100 00100 00100 00100 00000 00100', '?': '01110 10001 00001 00010 00100 00000 00100',
  '[': '01110 01000 01000 01000 01000 01000 01110', ']': '01110 00010 00010 00010 00010 00010 01110',
  '+': '00000 00100 00100 11111 00100 00100 00000', '~': '00000 00000 01000 10101 00010 00000 00000', '@': '01110 10001 10111 10101 10111 10000 01111',
};
const MARK = { dots: [[1, -2], [3, -2]], dot: [[2, -2]], breve: [[1, -2], [2, -2], [3, -2]], ced: [[2, 7], [1, 8]] };
const COMPOSED = { Ö: ['O', 'dots'], Ü: ['U', 'dots'], İ: ['I', 'dot'], Ğ: ['G', 'breve'], Ç: ['C', 'ced'], Ş: ['S', 'ced'] };

function cells(ch) {
  const [base, mark] = COMPOSED[ch] || [ch];
  const rows = F[base];
  if (!rows) return [];
  const out = [];
  rows.split(' ').forEach((row, y) => [...row].forEach((v, x) => { if (v === '1') out.push([x, y]); }));
  return mark ? [...out, ...MARK[mark]] : out;
}

const upper = (s) => s.toLocaleUpperCase('tr');
const ADVANCE = 6;

// Bitişik pikseller tek dikdörtgene birleşir; dosya küçük kalır.
function textPath(str, x, y, s) {
  let d = '';
  [...upper(str)].forEach((ch, i) => {
    const byRow = new Map();
    cells(ch).forEach(([cx, cy]) => byRow.set(cy, [...(byRow.get(cy) || []), cx]));
    for (const [cy, xs] of byRow) {
      xs.sort((a, b) => a - b);
      let start = xs[0], prev = xs[0];
      const flush = () => { const w = (prev - start + 1) * s; d += `M${x + i * ADVANCE * s + start * s} ${y + cy * s}h${w}v${s}h-${w}z`; };
      xs.slice(1).forEach((v) => { if (v !== prev + 1) { flush(); start = v; } prev = v; });
      flush();
    }
  });
  return d;
}
const widthOf = (str, s) => [...str].length * ADVANCE * s - s;
const label = (str, x, y, s, fill, extra = '') => `<path d="${textPath(str, x, y, s)}" fill="${fill}"${extra}/>`;

function rng(seed) {
  let v = seed;
  return (n) => { v = (v * 1664525 + 1013904223) % 4294967296; return Math.floor((v / 4294967296) * n); };
}

// Masa'nın kedisi.
const SIT = ['..k.....k..', '..kk...kk..', '..kkkkkkk..', '..kkkkkkk..', '..kkkkkkk..', '...kkkkk...', '..kkkkkkk..', '.kkkkkkkkk.', '.kkkkkkkkk.', 'kkkkkkkkkkk', 'kkkkkkkkkkk', '.kkkkkkkkk.'];
const WALK = ['k..........k.k..', 'k..........kkkk.', 'kk.........kkkkk', '.kkkkkkkkkkkkkk.', '..kkkkkkkkkkkk..', '..kkkkkkkkkkk...'];
const LEGS = [['..kk.kk...kk.kk.', '..k...k...k...k.'], ['...kk.k...kk.k..', '...k..k....k.k..']];
const sprite = (rows, s, ox = 0, oy = 0) => rows.flatMap((row, y) => [...row].flatMap((c, x) => (c === 'k' ? [`M${ox + x * s} ${oy + y * s}h${s}v${s}h-${s}z`] : []))).join('');

const CRT = (W, H) => `<defs><pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="#000" fill-opacity=".26"/></pattern>
<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>
<linearGradient id="roll" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${G.mid}" stop-opacity="0"/><stop offset=".5" stop-color="${G.mid}" stop-opacity=".09"/><stop offset="1" stop-color="${G.mid}" stop-opacity="0"/></linearGradient>
<clipPath id="tube"><rect width="${W}" height="${H}" rx="18"/></clipPath></defs>`;
const CRT_TOP = (W, H) => `<rect class="roll" y="-140" width="${W}" height="140" fill="url(#roll)"/><rect width="${W}" height="${H}" fill="url(#scan)"/><rect width="${W}" height="${H}" fill="url(#vig)"/>`;
const CRT_CSS = (H) => `.roll{animation:roll 7s linear infinite}@keyframes roll{to{transform:translateY(${H + 140}px)}}.tube{animation:fl 5s steps(1) infinite}@keyframes fl{0%,91%,95%,100%{opacity:1}93%{opacity:.88}}`;
const STILL = (css) => `@media (prefers-reduced-motion:reduce){*{animation:none!important}${css}}`;
const svg = (W, H, alt, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${alt}" shape-rendering="crispEdges">${body}</svg>\n`;

// ---- Giriş ekranı ----
function hero() {
  const W = 1280, H = 520;
  const r = rng(41);

  // Ad: her büyük piksel küçük bir 0 ya da 1. İki katman birbirinin yerine geçince rakamlar kaynar.
  const NAME = 'ÖMER BAYRAM', CX = 13, CY = 17, NX = 48, NY = 96;
  const layer = () => {
    const d = { 0: '', 1: '' };
    [...NAME].forEach((ch, i) => cells(ch).forEach(([x, y]) => { const b = r(2); d[b] += textPath(String(b), NX + (i * ADVANCE + x) * CX, NY + y * CY, 2); }));
    return d;
  };
  const a = layer(), b = layer();
  // Her pikselin arkası dolu: harflerin şekli okunur, rakamlar üstünde kaynar.
  let plate = '';
  [...NAME].forEach((ch, i) => cells(ch).forEach(([x, y]) => { plate += `M${NX - 2 + (i * ADVANCE + x) * CX} ${NY - 2 + y * CY}h${CX}v${CY}h-${CX}z`; }));
  const name = `<path d="${plate}" fill="#157a35"/><g class="la"><path d="${a[0]}" fill="${G.mid}"/><path d="${a[1]}" fill="${G.hi}"/></g><g class="lb"><path d="${b[0]}" fill="${G.hi}"/><path d="${b[1]}" fill="${G.mid}"/></g>`;

  // Yazılan satırlar.
  const LINES = [
    ['$ WHOAMI', G.amber], ['BİLİŞİM GÜVENLİĞİ ÖĞRENCİSİ / SAKARYA', G.mid],
    ['$ CAT ODAK.TXT', G.amber], ['PENTEST - RED TEAM - BULUT GÜVENLİĞİ', G.mid],
  ];
  const TOTAL = 14, S = 3, LX = 48, LY0 = 316, LH = 44;
  const p = (t) => ((t / TOTAL) * 100).toFixed(2);
  let t = 0.5, css = '', clips = '', lines = '';
  LINES.forEach(([text, fill], i) => {
    const n = [...text].length, w = n * ADVANCE * S, d = n * 0.05, y = LY0 + i * LH;
    css += `@keyframes w${i}{0%,${p(t)}%{width:0}${p(t + d)}%,93%{width:${w}px}94%,100%{width:0}}.c${i}{width:0;animation:w${i} ${TOTAL}s infinite;animation-timing-function:steps(${n},end)}`;
    clips += `<clipPath id="k${i}"><rect class="c${i}" x="${LX}" y="${y - 8}" height="40"/></clipPath>`;
    lines += `<g clip-path="url(#k${i})">${label(text, LX, y, S, fill)}</g>`;
    t += d + (i % 2 ? 1.1 : 0.45);
  });
  const lastN = [...LINES[3][0]].length, cursorX = LX + lastN * ADVANCE * S, cursorY = LY0 + 3 * LH;
  css += `.cur{opacity:0;animation:cur ${TOTAL}s steps(1) infinite}@keyframes cur{0%,${p(t - 1.1)}%{opacity:0}${p(t - 1.1)}%,93%{opacity:1}94%,100%{opacity:0}}.bl{animation:bl 1s steps(2) infinite}@keyframes bl{50%{opacity:0}}`;

  // Sağda akan rakamlar.
  let rain = '';
  const CH = 'ABCDEF0123456789';
  for (let c = 0; c < 12; c++) {
    let tile = '';
    for (let j = 0; j < 22; j++) if (r(4)) tile += textPath(CH[r(16)], 956 + c * 26, 44 + j * 22, 2);
    const shifted = tile.replace(/M(\d+) (\d+)/g, (m, x, y) => `M${x} ${Number(y) - 484}`);
    rain += `<g class="fall" style="animation-duration:${6 + r(9)}s"><path d="${tile}${shifted}" fill="${c % 3 ? G.low : G.dim}"/></g>`;
  }

  const CX0 = 1050, CY0 = 400, CS = 8;
  const cat = `<rect x="${CX0 - 32}" y="${CY0 - 24}" width="${11 * CS + 64}" height="${12 * CS + 48}" fill="${G.panel}" fill-opacity=".86"/>
<path d="${sprite(SIT, CS, CX0, CY0)}" fill="${G.mid}"/>
<g class="eye"><rect x="${CX0 + 3 * CS}" y="${CY0 + 3 * CS}" width="${CS}" height="${CS}" fill="${G.bg}"/><rect x="${CX0 + 7 * CS}" y="${CY0 + 3 * CS}" width="${CS}" height="${CS}" fill="${G.bg}"/></g>
<g class="ta"><path d="M${CX0 + 11 * CS} ${CY0 + 11 * CS}h${CS * 2}v${CS}h-${CS * 2}zM${CX0 + 13 * CS} ${CY0 + 8 * CS}h${CS}v${CS * 3}h-${CS}z" fill="${G.mid}"/></g>
<g class="tb"><path d="M${CX0 + 11 * CS} ${CY0 + 11 * CS}h${CS * 3}v${CS}h-${CS * 3}zM${CX0 + 14 * CS} ${CY0 + 8 * CS}h${CS}v${CS * 3}h-${CS}z" fill="${G.mid}"/></g>`;

  const title = `<rect width="${W}" height="48" fill="${G.bar}"/>
<rect x="24" y="17" width="14" height="14" fill="#ff5f56"/><rect x="48" y="17" width="14" height="14" fill="${G.amber}"/><rect x="72" y="17" width="14" height="14" fill="${G.mid}"/>
${label('GUEST@OMERBAYRAM: ~', 480, 17, 2, G.dim)}`;

  fs.writeFileSync(path.join(ASSETS, 'hero.svg'), svg(W, H, 'Ömer Bayram: Bilişim Güvenliği öğrencisi. Pentest, Red Team, bulut güvenliği.', `${CRT(W, H)}<defs>${clips}</defs>
<style>${CRT_CSS(H)}${css}
.la{animation:sw 1.5s steps(1) infinite}.lb{animation:sw 1.5s steps(1) -.75s infinite}@keyframes sw{50%{opacity:0}}
.fall{animation:fall linear infinite}@keyframes fall{to{transform:translateY(484px)}}
.eye{animation:eye 4.6s steps(1) infinite}@keyframes eye{94%{opacity:0}}
.ta{animation:tg 1.6s steps(1) infinite}.tb{animation:tg 1.6s steps(1) -.8s infinite}@keyframes tg{50%{opacity:0}}
${STILL('.lb,.tb{opacity:0}.c0,.c1,.c2,.c3{width:1000px}.cur{opacity:1}')}</style>
<g clip-path="url(#tube)"><g class="tube"><rect width="${W}" height="${H}" fill="${G.bg}"/>${rain}${title}${name}${lines}
<g class="cur"><rect class="bl" x="${cursorX}" y="${cursorY}" width="15" height="21" fill="${G.hi}"/></g>${cat}</g>${CRT_TOP(W, H)}</g>`));
}

// ---- Katkı ızgarası: gerçek veri, üstünde tarama çizgisi ve yürüyen kedi. ----
function contributions(cal) {
  const weeks = cal.weeks.slice(-52);
  const STEP = 23, SIZE = 19, X0 = 44, Y0 = 118, W = 1280, H = 318;
  const counts = weeks.flatMap((w) => w.contributionDays.map((d) => d.contributionCount)).filter(Boolean).sort((a, b) => a - b);
  const at = (q) => counts[Math.floor((counts.length - 1) * q)] || 1;
  const cuts = [at(0.25), at(0.5), at(0.8)];
  const level = (n) => (!n ? 0 : n <= cuts[0] ? 1 : n <= cuts[1] ? 2 : n <= cuts[2] ? 3 : 4);
  const PAL = ['#121a14', G.low, G.dim, G.mid, G.hi];
  const SWEEP = 11;

  let grid = '';
  weeks.forEach((w, i) => {
    const rects = w.contributionDays.map((d) => `<rect x="${X0 + i * STEP}" y="${Y0 + new Date(`${d.date}T00:00:00Z`).getUTCDay() * STEP}" width="${SIZE}" height="${SIZE}" fill="${PAL[level(d.contributionCount)]}"/>`).join('');
    grid += `<g class="col" style="animation-delay:${((i / 52) * SWEEP).toFixed(2)}s">${rects}</g>`;
  });

  const span = 52 * STEP;
  const CS = 3;
  const walker = `<g transform="translate(${X0} ${Y0 - 8 * CS - 5})"><g class="walk"><path d="${sprite(WALK, CS)}" fill="${G.hi}"/><g class="a"><path d="${sprite(LEGS[0], CS, 0, 6 * CS)}" fill="${G.hi}"/></g><g class="b"><path d="${sprite(LEGS[1], CS, 0, 6 * CS)}" fill="${G.hi}"/></g></g></g>`;
  const beam = `<g class="beam"><rect x="${X0 - 6}" y="${Y0 - 6}" width="3" height="${7 * STEP + 8}" fill="${G.hi}" fill-opacity=".85"/></g>`;
  const total = cal.totalContributions;

  fs.writeFileSync(path.join(ASSETS, 'katki.svg'), svg(W, H, `Son bir yılda ${total} katkı`, `${CRT(W, H)}
<style>${CRT_CSS(H)}
.col{animation:col ${SWEEP}s linear infinite}@keyframes col{0%{filter:brightness(2.4)}7%,100%{filter:brightness(1)}}
.walk{animation:mv ${SWEEP}s linear infinite}.beam{animation:mv ${SWEEP}s linear infinite}@keyframes mv{from{transform:translateX(0)}to{transform:translateX(${span}px)}}
.a{animation:t .36s steps(1) infinite}.b{animation:t .36s steps(1) -.18s infinite}@keyframes t{50%{opacity:0}}
${STILL('.b,.beam{opacity:0}')}</style>
<g clip-path="url(#tube)"><g class="tube"><rect width="${W}" height="${H}" fill="${G.bg}"/>
${label('$ GIT LOG --SON-1-YIL', X0, 24, 3, G.amber)}${label(`${total} KATKI`, W - X0 - widthOf(`${total} KATKI`, 3), 24, 3, G.hi)}
${grid}${beam}${walker}</g>${CRT_TOP(W, H)}</g>`));
}

// ---- Bağlantı düğmeleri ----
const LINKS = [
  ['blog', 'BLOG', 'https://omertugrulbayram.com'],
  ['x', 'X', 'https://twitter.com/0m3rb4yr4m'],
  ['linkedin', 'LINKEDIN', 'https://linkedin.com/in/omertugrulbayram'],
  ['kaggle', 'KAGGLE', 'https://kaggle.com/merturulbayram'],
  ['instagram', 'INSTAGRAM', 'https://instagram.com/omerbayramm41'],
  ['topcoder', 'TOPCODER', 'https://www.topcoder.com/members/41200'],
  ['eposta', 'E-POSTA', `mailto:${USER}@gmail.com`],
];
function buttons() {
  LINKS.forEach(([id, text], i) => {
    const s = 2, inner = `[ ${text} ]`.replace(/ /g, '  ');
    const tw = widthOf(inner, s), W = tw + 32, H = 44;
    const d = textPath(inner.replace(/[^[\]]/g, ' '), 16, 15, s), body = textPath(`   ${text}`.padEnd([...inner].length, ' '), 16, 15, s);
    const delay = (i * 0.5).toFixed(1);
    fs.writeFileSync(path.join(ASSETS, `l-${id}.svg`), svg(W, H, text, `<style>.h{animation:h 3.5s steps(1) ${delay}s infinite}@keyframes h{0%,20%,100%{fill-opacity:0}8%{fill-opacity:1}14%{fill-opacity:.5}}.br{animation:br 3.5s steps(1) ${delay}s infinite}@keyframes br{8%{fill:${G.bg}}20%{fill:${G.amber}}}${STILL('.h{fill-opacity:0}')}</style>
<rect width="${W}" height="${H}" fill="${G.bg}"/><rect class="h" width="${W}" height="${H}" fill="${G.mid}" fill-opacity="0"/>
<path d="M0 0h${W}v2h-${W}zM0 ${H - 2}h${W}v2h-${W}zM0 0h2v${H}h-2zM${W - 2} 0h2v${H}h-2z" fill="${G.dim}"/>
<path class="br" d="${d}" fill="${G.amber}"/><path d="${body}" fill="${G.hi}" style="mix-blend-mode:difference"/>`));
  });
}

// ---- Son satır ----
function footer() {
  const W = 1280, H = 96, CS = 4, clean = 'OTURUM AÇIK. ÇIKMAK İÇİN CTRL+C';
  const tw = widthOf(clean, 3);
  fs.writeFileSync(path.join(ASSETS, 'son.svg'), svg(W, H, 'Yürüyen pixel kedi', `${CRT(W, H)}
<style>${CRT_CSS(H)}.walk{animation:mv 20s linear infinite}@keyframes mv{from{transform:translateX(-80px)}to{transform:translateX(${W + 20}px)}}
.a{animation:t .36s steps(1) infinite}.b{animation:t .36s steps(1) -.18s infinite}@keyframes t{50%{opacity:0}}.bl{animation:bl 1s steps(2) infinite}@keyframes bl{50%{opacity:0}}
${STILL('.b{opacity:0}')}</style>
<g clip-path="url(#tube)"><g class="tube"><rect width="${W}" height="${H}" fill="${G.bg}"/>
${label(clean, (W - tw) / 2, 24, 3, G.dim)}<rect class="bl" x="${(W - tw) / 2 + tw + 12}" y="24" width="15" height="21" fill="${G.mid}"/>
<rect y="${H - 8}" width="${W}" height="8" fill="${G.low}"/>
<g transform="translate(0 ${H - 8 - 8 * CS})"><g class="walk"><path d="${sprite(WALK, CS)}" fill="${G.mid}"/><g class="a"><path d="${sprite(LEGS[0], CS, 0, 6 * CS)}" fill="${G.mid}"/></g><g class="b"><path d="${sprite(LEGS[1], CS, 0, 6 * CS)}" fill="${G.mid}"/></g></g></g></g>${CRT_TOP(W, H)}</g>`));
}

// ---- Gerçek ASCII bölümler: <pre> içinde seçilebilir, bağlantılar tıklanır. ----
const PROJECTS = [
  ['SCQL', 'hedef bilgisi, port ve sürüm tarama aracı'],
  ['ctf-writeups', 'TryHackMe, Hack The Box çözüm notları'],
  ['BugBountyTool', 'temel bug bounty tarama aracı'],
  ['muhur', 'TEKNOFEST 2026, sosyal ağ güven katmanı'],
  ['nasa-space-app-project-astrovia', 'NASA Space Apps 2025, asteroit tespiti', 'astrovia'],
  ['deprem-radar', 'Türkiye canlı deprem haritası'],
  ['namaz-vakit', 'arkadaş grubu için namaz takibi'],
  ['42_discovery_piscine', '42 Discovery Piscine çalışmaları'],
];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const link = (url, text) => `<a href="${url}">${esc(text)}</a>`;
const LOCK = [
  '     /\\_/\\            ',
  '    ( o.o )           ',
  '     > ^ <            ',
  '    .-------.         ',
  '   /  .---.  \\        ',
  '   |  |   |  |        ',
  '   |  |   |  |        ',
  ' .-\'--\'---\'--\'-.      ',
  ' |  .-------.  |      ',
  ' |  | 1 0 1 |  |      ',
  ' |  \'-------\'  |      ',
  ' |      O      |      ',
  ' \'-------------\'      ',
];

function bars(langs) {
  const total = langs.reduce((n, l) => n + l.size, 0);
  return langs.slice(0, 5).map((l) => {
    const pct = (l.size / total) * 100, on = Math.max(1, Math.round(pct / 5));
    return `${l.name.padEnd(12).slice(0, 12)} [${'#'.repeat(on)}${'.'.repeat(20 - on)}] ${pct.toFixed(1).padStart(4)}%`;
  });
}

function readme(u, langs, stars) {
  const info = [
    `<b>omer@github</b>`,
    '-----------',
    'ad      : Ömer Bayram',
    'okul    : SUBÜ, Bilişim Güvenliği',
    'öğrenme : CyberSec, Pentest, Red Team',
    'araçlar : Python, C#, Linux, AWS, Unity',
    `blog    : ${link('https://omertugrulbayram.com', 'omertugrulbayram.com')}`,
    '',
    `repo    : ${u.repositories.totalCount} açık`,
    `yıldız  : ${stars}`,
    `takipçi : ${u.followers.totalCount}`,
    `katkı   : ${u.contributionsCollection.contributionCalendar.totalContributions} (son 1 yıl)`,
    '',
  ];
  const fetch = LOCK.map((l, i) => `${esc(l)}${info[i] || ''}`).join('\n');

  const nameW = 22;
  const starOf = (n) => u.repositories.nodes.find((r) => r.name === n)?.stargazerCount || 0;
  const rows = PROJECTS.map(([n, d, shown]) => {
    const short = shown || n;
    const s = starOf(n);
    return `${link(`https://github.com/${USER}/${n}`, short)}${' '.repeat(nameW - short.length)}${(s ? `*${s}` : '').padEnd(4)}${esc(d)}`;
  }).join('\n');

  const buttons_ = LINKS.map(([id, text, url]) => `<a href="${url}"><img src="assets/l-${id}.svg" alt="${text}" height="34"></a>`).join('\n  ');

  return `<p align="center">
  <img src="assets/hero.svg" alt="Ömer Bayram: Bilişim Güvenliği öğrencisi. Pentest, Red Team, bulut güvenliği." width="100%">
</p>

<p align="center">
  ${buttons_}
</p>

<pre>
<b>guest@omerbayram:~$</b> neofetch

${fetch}
<b>guest@omerbayram:~$</b> diller --en-cok

${bars(langs).map(esc).join('\n')}

<b>guest@omerbayram:~$</b> ls ~/projeler

${rows}
masa                      yakında: Windows masaüstü araç takımı
</pre>

<p align="center">
  <img src="assets/katki.svg" alt="Son bir yılda ${u.contributionsCollection.contributionCalendar.totalContributions} katkı" width="100%">
</p>

<p align="center">
  <img src="assets/son.svg" alt="" width="100%">
</p>
`;
}

(async () => {
  const query = `query($u:String!){user(login:$u){followers{totalCount}
    repositories(first:100,ownerAffiliations:OWNER,privacy:PUBLIC,isFork:false){totalCount nodes{name stargazerCount languages(first:10,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}}}
    contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{contributionCount date}}}}}}`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `bearer ${process.env.GH_TOKEN}`, 'content-type': 'application/json', 'user-agent': 'profil-readme' },
    body: JSON.stringify({ query, variables: { u: USER } }),
  });
  const json = await res.json();
  if (!json.data?.user) throw new Error(`GitHub yanıtı: ${JSON.stringify(json).slice(0, 300)}`);
  const u = json.data.user;

  const sum = new Map();
  // Jupyter defterleri çıktılarıyla birlikte sayılır, yazılan kodu yansıtmaz.
  u.repositories.nodes.forEach((r) => r.languages.edges.filter((e) => e.node.name !== 'Jupyter Notebook').forEach((e) => sum.set(e.node.name, (sum.get(e.node.name) || 0) + e.size)));
  const langs = [...sum].map(([name, size]) => ({ name, size })).sort((a, b) => b.size - a.size);
  const stars = u.repositories.nodes.reduce((n, r) => n + r.stargazerCount, 0);

  fs.mkdirSync(ASSETS, { recursive: true });
  hero();
  contributions(u.contributionsCollection.contributionCalendar);
  buttons();
  footer();
  fs.writeFileSync(path.join(ROOT, 'README.md'), readme(u, langs, stars));
  for (const f of fs.readdirSync(ASSETS)) console.log(f, Math.round(fs.statSync(path.join(ASSETS, f)).size / 1024), 'KB');
  console.log('repo', u.repositories.totalCount, 'yildiz', stars, 'takipci', u.followers.totalCount, 'diller', langs.slice(0, 5).map((l) => l.name).join(','));
})().catch((e) => { console.error(e); process.exit(1); });
