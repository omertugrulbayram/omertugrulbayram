// Oyun ekranı: büyük pixel sahne (oyuncu kartı + şehir) ve görev kartları. Sayılar build.js'ten gelir.
const fs = require('fs');
const path = require('path');

// Satır satır renkli sprite: aynı renkteki bitişik pikseller tek yola toplanır, dosya küçük kalır.
function paint(rows, pal, s = 1, ox = 0, oy = 0) {
  const by = {};
  rows.forEach((row, y) => {
    const cs = [...row];
    for (let x = 0; x < cs.length;) {
      let e = x;
      while (e + 1 < cs.length && cs[e + 1] === cs[x]) e++;
      if (pal[cs[x]]) by[cs[x]] = `${by[cs[x]] || ''}M${ox + x * s} ${oy + y * s}h${(e - x + 1) * s}v${s}h-${(e - x + 1) * s}z`;
      x = e + 1;
    }
  });
  return Object.entries(by).map(([c, d]) => `<path d="${d}" fill="${pal[c]}"/>`).join('');
}
const mirror = (half) => half.map((r) => r + [...r].reverse().join(''));
const box = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`;

function discRows(cx, cy, r, fn) {
  let out = '';
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    out += fn(cx - half, cy + y, half * 2 + 1, y);
  }
  return out;
}
function ring(cx, cy, r, fill) {
  let d = '';
  for (let a = 0; a < 360; a += 4) d += `M${Math.round(cx + Math.cos((a * Math.PI) / 180) * r)} ${Math.round(cy + Math.sin((a * Math.PI) / 180) * r)}h1v1h-1z`;
  return `<path d="${d}" fill="${fill}"/>`;
}

// Kapüşonlu karakter: önden, kucağında dizüstü. Yarısı çizilir, aynalanır.
const HOOD = mirror([
  '..........hhhhh', '........hhhHHHH', '.......hhHHHHHH', '......hhHHHhhhh', '......hHHhhffff',
  '.....hhHhhfffff', '.....hHHhffffff', '.....hHhfffffff', '.....hHhfffffff', '.....hHhfffffff',
  '.....hHHhffffff', '......hHhhfffff', '......hhHHhhfff', '.......hhHHHhhh', '........shhhhhh',
]);
const TORSO = mirror([
  '.....sshhhhhhhh', '...sshhHHHHHHHH', '..shhHHHHhhhhhh', '.shhHHHhhhhhhhh', '.shHHhhhhhhcchh',
  'shhHhhhhhhhhchh', 'shhHhhshhhhhchh', 'shhHhhshhhhhhhh', 'shHHhshhhhhhhhh',
]);
const LAP = mirror([
  'shHhhsLLLLLLLLL', 'shHhhLlllllllll', 'shHhhLlllllllll', 'sshHhLlllllllll', '.sHHHLlllllllll',
  '.sHHHLlllllllll', '..sSSLlllllllll', '.ppPPLlllllllll', 'ppPPPLlllllllll', 'ppPPPLlllllllll',
  'pppPPDDDDDDDDDD', '.pppPPPPPPPPPPP', '.bbppppPPPPPPPP', '..bbbbppppppppp',
]);
const PAL = { h: '#241a4f', H: '#3f2f85', s: '#120b2c', f: '#05040f', c: '#c8c0ff', S: '#120b2c', p: '#1d1640', P: '#2c2260', b: '#0b0820', L: '#e8e4ff', l: '#a79ee0', D: '#5c4fa8' };
const LOCK_ICON = ['..ggg..', '.g...g.', '.g...g.', 'ggggggg', 'ggg.ggg', 'ggg.ggg', 'ggggggg'];
const CAT_SIT = ['..k.....k..', '..kk...kk..', '..kkkkkkk..', '..kkkkkkk..', '..kkkkkkk..', '...kkkkk...', '..kkkkkkk..', '.kkkkkkkkk.', '.kkkkkkkkk.', 'kkkkkkkkkkk', 'kkkkkkkkkkk', '.kkkkkkkkk.'];
const ICONS = {
  heart: ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'],
  coin: ['..yyy..', '.yYYYy.', 'yYyyyYy', 'yYyyyYy', 'yYyyyYy', '.yYYYy.', '..yyy..'],
  disk: ['bbbbbb.', 'bwwwwbb', 'bwwwwbb', 'bbbbbbb', 'bbwwwbb', 'bbwbwbb', 'bbwwwbb'],
  ally: ['..ccc..', '..ccc..', '..ccc..', '.......', '.ccccc.', 'ccccccc', 'ccccccc'],
};
const ICON_PAL = { r: '#ff4f7b', y: '#ffc94a', Y: '#fff1a8', b: '#4f9dff', w: '#d8e9ff', c: '#5ffbf1' };

module.exports = (h) => {
  const { textPath, label, widthOf, rng, svg, CRT, CRT_TOP, CRT_CSS, STILL, ASSETS } = h;
  const save = (name, data) => fs.writeFileSync(path.join(ASSETS, `${name}.svg`), data);

  function scene(p) {
    const W = 1280, H = 660, U = 6, GW = 214, GH = 110, HZ = 72;
    const r = rng(2026);

    // Gökyüzü: dama titretmeli bantlar.
    const SKY = ['#0d0a2a', '#1a1050', '#341572', '#5e1a88', '#96207f', '#d2356f', '#f8625f', '#ffa558'];
    const BH = HZ / SKY.length;
    let sky = '';
    SKY.forEach((c, i) => {
      const y = Math.round(i * BH), e = Math.round((i + 1) * BH);
      sky += box(0, y, GW, e - y, c);
      if (i < SKY.length - 1) {
        let d = '';
        for (let x = 0; x < GW; x += 2) d += `M${x} ${e - 2}h1v1h-1zM${x + 1} ${e - 1}h1v1h-1z`;
        sky += `<path d="${d}" fill="${SKY[i + 1]}"/>`;
      }
    });
    let stars = '';
    for (let i = 0; i < 80; i++) stars += box(r(GW), r(36), 1, 1, '#fff', ` class="s${r(3)}"`);

    // Güneş: üstten aşağı renk, kesikler akar.
    const SX = 150, SY = 46, SR = 30;
    const SUN = ['#fff3a0', '#ffd96a', '#ffb44f', '#ff8a4f', '#ff5f6d', '#ff3f8f'];
    const sun = discRows(SX, SY, SR, (x, y, w, dy) => box(x, y, w, 1, SUN[Math.min(5, Math.floor(((dy + SR) / (SR * 2)) * 6))]));
    let sunPath = '';
    for (let y = -SR; y <= SR; y++) { const hw = Math.floor(Math.sqrt(SR * SR - y * y)); sunPath += `M${SX - hw} ${SY + y}h${hw * 2 + 1}v1h-${hw * 2 + 1}z`; }
    let slits = '';
    for (let i = 0; i < 9; i++) slits += box(SX - SR, SY + 2 + i * 7 - 7, SR * 2 + 1, 2 + Math.floor(i / 3), '#5a1a7c');

    // Şehir: iki kat, kesintisiz kayar.
    const skyline = (seed, top, color, lit) => {
      const q = rng(seed);
      let body = '', x = 0;
      while (x < GW) {
        const w = 7 + q(11), t = HZ - (top[0] + q(top[1]));
        body += box(x, t, w, HZ - t, color);
        if (q(3) === 0) { body += box(x + 3, t - 5, 1, 5, color); body += box(x + 3, t - 6, 1, 1, '#ff4f7b', ` class="s${q(3)}"`); }
        for (let wy = t + 2; wy < HZ - 2; wy += 3) for (let wx = x + 1; wx < x + w - 1; wx += 2) if (q(3) === 0) body += box(wx, wy, 1, 1, lit[q(lit.length)], q(4) === 0 ? ` class="w${q(2)}"` : '');
        x += w + q(2);
      }
      const clone = body.replace(/ x="(-?\d+)"/g, (m, v) => ` x="${Number(v) + GW}"`);
      return body + clone;
    };

    // Zemin ızgarası: ufka doğru kaçan dikeyler, seyirciye akan yataylar.
    let fan = '';
    for (let k = -14; k <= 14; k++) {
      const end = 107 + k * 24;
      for (let y = HZ; y < GH; y++) { const x = Math.round(107 + ((end - 107) * (y - HZ)) / (GH - HZ)); if (x >= 0 && x < GW) fan += `M${x} ${y}h1v1h-1z`; }
    }
    let flat = '';
    for (let i = 0; i < 8; i++) flat += box(0, HZ, GW, 1, '#ff4fa3', ` class="gl" style="animation-delay:${(-i * 0.5).toFixed(1)}s"`);
    let zips = '';
    for (let i = 0; i < 6; i++) zips += `<g class="zip" style="animation-duration:${(1.1 + r(16) / 10).toFixed(1)}s;animation-delay:-${r(30) / 10}s">${box(-14, HZ + 4 + i * 6, 12, 1, i % 2 ? '#5ffbf1' : '#fff3a0')}</g>`;

    // Dam ve eşyalar.
    const RX = 112, RY = 94;
    let roof = box(RX, RY, GW - RX, GH - RY, '#170b34') + box(RX, RY, GW - RX, 1, '#ff4fa3') + box(RX, RY + 1, GW - RX, 1, '#7a2a8e');
    for (let y = RY + 4; y < GH; y += 4) for (let x = RX + (y % 8 ? 0 : 4); x < GW; x += 8) roof += box(x, y, 6, 1, '#231250');

    // Neon tabela: bir harfi arızalı.
    const SIGN = 'SİBER';
    let sign = box(189, 40, 14, 54, '#10082a') + box(189, 40, 14, 1, '#ff4fa3') + box(189, 93, 14, 1, '#ff4fa3') + box(189, 40, 1, 54, '#ff4fa3') + box(202, 40, 1, 54, '#ff4fa3');
    [...SIGN].forEach((c, i) => { sign += `<path class="${i === 2 ? 'bad' : 'neon'}" d="${textPath(c, 193, 44 + i * 10, 1)}" fill="#5ffbf1"/>`; });

    // Karakter ve kedi.
    const CX0 = 135, CY0 = 58;
    const upper = paint([...HOOD, ...TORSO], PAL, 1, CX0, CY0);
    const lower = paint(LAP, PAL, 1, CX0, CY0 + 24);
    const eyes = `<g class="blink">${box(CX0 + 11, CY0 + 8, 2, 2, '#5ffbf1')}${box(CX0 + 17, CY0 + 8, 2, 2, '#5ffbf1')}</g>`;
    const lock = `<g class="pulse">${paint(LOCK_ICON, { g: '#5ffbf1' }, 2, CX0 + 8, CY0 + 26)}</g>`;
    const silhouette = (fill) => `<path d="${[...HOOD, ...TORSO, ...LAP].flatMap((row, y) => [...row].flatMap((v, x) => (v === '.' ? [] : [`M${CX0 + x} ${CY0 + y}h1v1h-1z`]))).join('')}" fill="${fill}"/>`;
    const cat = `<g class="tailA">${box(182, 93, 1, 1, '#120a28')}${box(183, 90, 1, 4, '#120a28')}</g><g class="tailB">${box(182, 93, 2, 1, '#120a28')}${box(184, 90, 1, 4, '#120a28')}</g>${paint(CAT_SIT, { k: '#120a28' }, 1, 171, 82)}<g class="blink">${box(174, 85, 1, 1, '#ffc94a')}${box(178, 85, 1, 1, '#ffc94a')}</g>`;

    let bits = '';
    for (let i = 0; i < 10; i++) {
      const x = i % 2 ? CX0 - 9 + r(7) : CX0 + 33 + r(7), c = i % 3 ? '#5ffbf1' : '#fff3a0';
      bits += `<g class="bit" style="animation-delay:-${(r(40) / 10).toFixed(1)}s;animation-duration:${(3 + r(20) / 10).toFixed(1)}s"><path d="${textPath(String(i % 2), x, CY0 + 22, 1)}" fill="${c}"/></g>`;
    }

    const blimp = paint(['......kkkkkkkkkkkkkkkkkk......', '...kkkmmmmmmmmmmmmmmmmmmkkk...', '.kkmmmmmmmmmmmmmmmmmmmmmmmmkk.', 'kkmmmmmmmmmmmmmmmmmmmmmmmmmmkk', 'kkmmmmmmmmmmmmmmmmmmmmmmmmmmkk', '.kkmmmmmmmmmmmmmmmmmmmmmmmmkk.', '...kkkmmmmmmmmmmmmmmmmmmkkk...', '......kkkkkkkkkkkkkkkkkk......', '...........kkkkkkkk...........'], { k: '#0d0a2a', m: '#2c1a68' }, 1, 0, 0)
      + `<path class="neon" d="${textPath('HACK', 3, 1, 1).replace(/M(\d+) (\d+)/g, (m, a, b) => `M${Number(a) + 2} ${b}`)}" fill="#ff4fa3"/>${box(11, 9, 1, 1, '#ff4f7b', ' class="s0"')}${box(18, 9, 1, 1, '#5ffbf1', ' class="s1"')}`;

    const world = `${sky}${stars}${sun}<clipPath id="sc"><path d="${sunPath}"/></clipPath><g clip-path="url(#sc)"><g class="slit">${slits}</g></g>
<g class="far">${skyline(5, [8, 20], '#27125e', ['#5ffbf1', '#ff4fa3'])}</g><g class="near">${skyline(9, [2, 12], '#150a38', ['#ffc94a', '#5ffbf1', '#ff4fa3'])}</g>
${box(0, HZ, GW, GH - HZ, '#0e0626')}<path d="${fan}" fill="#7a2a8e"/>${flat}${zips}
<g class="star1">${box(0, 0, 8, 1, '#fff')}${box(8, 0, 2, 1, '#fff3a0')}</g>
<g transform="translate(0 6)"><g class="blimp">${blimp}</g></g>
${roof}${sign}${cat}
<g class="chr r">${silhouette('#ff2d55')}</g><g class="chr c">${silhouette('#2dfff0')}</g>
<g class="bob">${upper}${eyes}</g>${lower}${lock}${bits}`;

    // Oyuncu kartı.
    const PX = 28, PY = 28, PW = 468, PH = 604;
    const frame = (x, y, w, hh, c1, c2) => `<path d="M${x + 8} ${y}h${w - 16}v4h-${w - 16}zM${x + 8} ${y + hh - 4}h${w - 16}v4h-${w - 16}zM${x} ${y + 8}h4v${hh - 16}h-4zM${x + w - 4} ${y + 8}h4v${hh - 16}h-4zM${x + 4} ${y + 4}h4v4h-4zM${x + w - 8} ${y + 4}h4v4h-4zM${x + 4} ${y + hh - 8}h4v4h-4zM${x + w - 8} ${y + hh - 8}h4v4h-4z" fill="${c1}"/><path d="M${x + 12} ${y + 8}h${w - 24}v2h-${w - 24}zM${x + 12} ${y + hh - 10}h${w - 24}v2h-${w - 24}z" fill="${c2}"/>`;
    const tx = PX + 26;
    let panel = box(PX + 4, PY + 4, PW - 8, PH - 8, '#0a0620', ' fill-opacity=".93"') + frame(PX, PY, PW, PH, '#5ffbf1', '#ff4fa3');
    panel += `<g class="blinkFast">${label('1. OYUNCU', tx, PY + 26, 2, '#ffc94a')}</g>`;
    panel += label('ÖMER BAYRAM', tx, PY + 62, 6, '#ff2d55', ' class="ghostR"') + label('ÖMER BAYRAM', tx, PY + 62, 6, '#2dfff0', ' class="ghostC"');
    panel += label('ÖMER BAYRAM', tx, PY + 58, 6, '#ffffff');
    const rowY = PY + 126;
    panel += label('SINIF', tx, rowY, 2, '#9b8fd8') + label('SİBER GÜVENLİK', tx + 84, rowY, 2, '#ffffff');
    panel += label('GÖREV', tx, rowY + 26, 2, '#9b8fd8') + label('PENTEST + RED TEAM', tx + 84, rowY + 26, 2, '#ffffff');
    panel += label('OKUL', tx, rowY + 52, 2, '#9b8fd8') + label('SUBÜ BİLİŞİM GÜVENLİĞİ', tx + 84, rowY + 52, 2, '#ffffff');
    panel += label('ARAÇ', tx, rowY + 78, 2, '#9b8fd8') + label('PYTHON C# LINUX AWS UNITY', tx + 84, rowY + 78, 2, '#ffffff');
    panel += box(tx, rowY + 110, PW - 52, 2, '#3a2a78');

    const stat = (x, y, icon, value, name, delay) => `<g class="pop" style="animation-delay:${delay}s">${paint(ICONS[icon], ICON_PAL, 4, x, y)}${label(String(value), x + 42, y - 1, 4, '#ffffff')}${label(name, x + 42, y + 34, 2, '#9b8fd8')}</g>`;
    const sy = rowY + 128;
    panel += stat(tx, sy, 'heart', p.contributions, 'KATKI', 0.2) + stat(tx + 214, sy, 'disk', p.repos, 'DEPO', 0.4);
    panel += stat(tx, sy + 66, 'coin', p.stars, 'YILDIZ', 0.6) + stat(tx + 214, sy + 66, 'ally', p.followers, 'TAKİPÇİ', 0.8);
    panel += box(tx, sy + 124, PW - 52, 2, '#3a2a78');

    const COLORS = ['#ffc94a', '#ff7a4f', '#ff4fa3', '#5ffbf1', '#9b7bff'];
    let barCss = '', clips = '';
    const by0 = sy + 138;
    p.langs.slice(0, 4).forEach((l, i) => {
      const y = by0 + i * 28, BX = tx + 150, SEG = 10, N = 17, on = Math.max(1, Math.round((l.pct / 100) * N)), full = on * SEG;
      let seg = '', back = '';
      for (let k = 0; k < N; k++) { back += `M${BX + k * SEG} ${y}h${SEG - 2}v14h-${SEG - 2}z`; if (k < on) seg += `M${BX + k * SEG} ${y}h${SEG - 2}v14h-${SEG - 2}z`; }
      barCss += `.f${i}{width:0;animation:f${i} 12s ${(i * 0.2).toFixed(1)}s steps(${on},end) infinite}@keyframes f${i}{0%{width:0}14%,92%{width:${full}px}96%,100%{width:0}}`;
      clips += `<clipPath id="b${i}"><rect class="f${i}" x="${BX}" y="${y}" height="14"/></clipPath>`;
      const pct = `${l.pct.toFixed(1)}%`;
      panel += label(l.name.slice(0, 11), tx, y, 2, '#d8d2ff') + `<path d="${back}" fill="#21174d"/><g clip-path="url(#b${i})"><path d="${seg}" fill="${COLORS[i]}"/></g>` + label(pct, PX + PW - 22 - widthOf(pct, 2), y, 2, COLORS[i]);
    });

    const alt = `Oyuncu: Ömer Bayram. Sınıf: siber güvenlik. Katkı ${p.contributions}, depo ${p.repos}, yıldız ${p.stars}, takipçi ${p.followers}.`;
    save('sahne', svg(W, H, alt, `${CRT(W, H)}<defs>${clips}</defs>
<style>${CRT_CSS(H)}${barCss}
.boot{transform-origin:640px 330px;animation:boot 1.1s steps(9) both}@keyframes boot{0%{transform:scale(1,.004);filter:brightness(5)}45%{transform:scale(1,.02);filter:brightness(4)}100%{transform:none;filter:none}}
.s0{animation:tw 2.4s steps(2) infinite}.s1{animation:tw 3.7s steps(2) -1s infinite}.s2{animation:tw 5.1s steps(2) -2s infinite}@keyframes tw{50%{opacity:.15}}
.w0{animation:lit 6s steps(1) infinite}.w1{animation:lit 9s steps(1) -3s infinite}@keyframes lit{60%{opacity:.2}}
.slit{animation:slit 1.6s linear infinite}@keyframes slit{to{transform:translateY(7px)}}
.far{animation:scroll 120s linear infinite}.near{animation:scroll 55s linear infinite}@keyframes scroll{to{transform:translateX(-${GW}px)}}
.gl{animation:gl 4s cubic-bezier(.75,0,1,.7) infinite}@keyframes gl{0%{transform:translateY(0);opacity:.2}100%{transform:translateY(${GH - HZ}px);opacity:1}}
.zip{animation:zip linear infinite}@keyframes zip{to{transform:translateX(${GW + 30}px)}}
.star1{transform:translate(220px,10px);animation:shoot 9s linear infinite}@keyframes shoot{0%,70%{transform:translate(220px,6px);opacity:0}71%{opacity:1}82%{transform:translate(90px,44px);opacity:1}83%,100%{transform:translate(90px,44px);opacity:0}}
.blimp{animation:blimp 46s linear infinite}@keyframes blimp{from{transform:translateX(${GW + 10}px)}to{transform:translateX(-40px)}}
.neon{animation:neon 3s steps(1) infinite}.bad{animation:bad 1.7s steps(1) infinite}@keyframes neon{0%,100%{opacity:1}47%{opacity:.5}49%{opacity:1}}@keyframes bad{0%,34%,52%,100%{opacity:1}35%,44%{opacity:.12}48%{opacity:.5}}
.bob{animation:bob 1s steps(1) infinite}@keyframes bob{50%{transform:translateY(1px)}}
.blink{animation:bk 4.2s steps(1) infinite}@keyframes bk{93%{opacity:0}}
.pulse{animation:pu 1.4s steps(3) infinite alternate}@keyframes pu{from{opacity:.35}to{opacity:1}}
.tailA{animation:tg 1.5s steps(1) infinite}.tailB{animation:tg 1.5s steps(1) -.75s infinite}@keyframes tg{50%{opacity:0}}
.bit{opacity:0;animation:bit 4s linear infinite}@keyframes bit{0%{opacity:0;transform:translateY(0)}12%{opacity:1}80%{opacity:.8}100%{opacity:0;transform:translateY(-54px)}}
.blinkFast{animation:bl 1s steps(2) infinite}@keyframes bl{50%{opacity:.15}}
.pop{transform-box:fill-box;transform-origin:center;animation:pop 12s steps(4) infinite}@keyframes pop{0%{transform:scale(.3);opacity:0}5%,100%{transform:none;opacity:1}}
.glitch{animation:sh 11s steps(1) infinite}@keyframes sh{0%,88%,92.5%,100%{transform:none}88.5%{transform:translate(-14px,3px)}89%{transform:translate(18px,-4px)}89.7%{transform:translate(-8px,0)}90.4%{transform:translate(26px,5px)}91%{transform:translate(-20px,-3px)}91.8%{transform:translate(9px,2px)}}
.chr{opacity:0}.r{animation:ch 11s steps(1) infinite;transform:translateX(-3px)}.c{animation:ch 11s steps(1) -.08s infinite;transform:translateX(3px)}@keyframes ch{0%,87.9%,92.6%,100%{opacity:0}88%,92.5%{opacity:.85}}
.ghostR{opacity:0;transform:translate(-4px,-4px);animation:ch 11s steps(1) infinite}.ghostC{opacity:0;transform:translate(4px,-4px);animation:ch 11s steps(1) -.05s infinite}
.bar{opacity:0;animation:ch 11s steps(1) infinite}
${STILL('.chr,.ghostR,.ghostC,.bar,.bit{opacity:0}.boot{transform:none;filter:none}.f0,.f1,.f2,.f3{width:400px}')}</style>
<g clip-path="url(#tube)"><g class="boot"><rect width="${W}" height="${H}" fill="#070414"/><g class="glitch"><g transform="scale(${U})">${world}</g>${panel}</g>
<g class="bar">${box(0, 96, W, 16, '#ff2d55', ' fill-opacity=".55"')}${box(0, 300, W, 8, '#2dfff0', ' fill-opacity=".6"')}${box(0, 442, W, 26, '#fff', ' fill-opacity=".18"')}${box(0, 560, W, 6, '#ff4fa3', ' fill-opacity=".7"')}</g></g>${CRT_TOP(W, H)}</g>`));
  }

  // ---- Görev kartları ----
  const ART = {
    scql: () => {
      let a = box(0, 0, 70, 29, '#03150c') + [5, 9, 13].map((v) => ring(35, 15, v, '#0f5a30')).join('') + box(21, 15, 29, 1, '#0f5a30') + box(35, 1, 1, 28, '#0f5a30');
      a += `<g class="sw">${box(35, 15, 13, 1, '#7dffa0')}${box(35, 14, 11, 1, '#33ff66', ' fill-opacity=".5"')}${box(35, 13, 8, 1, '#33ff66', ' fill-opacity=".25"')}</g>`;
      [[41, 8, 0], [28, 21, 1.1], [44, 20, 2.1], [29, 9, 0.6]].forEach(([x, y, d]) => { a += box(x, y, 2, 2, '#ffb347', ` class="blip" style="animation-delay:${d}s"`); });
      a += `<path class="nb" d="${textPath('443', 3, 3, 1)}" fill="#7dffa0"/><path class="nb2" d="${textPath('OPEN', 45, 21, 1)}" fill="#ffb347"/>`;
      return [a, '.sw{transform-origin:35.5px 15.5px;animation:sw 3s steps(36) infinite}@keyframes sw{to{transform:rotate(360deg)}}.blip{animation:bp 3s steps(1) infinite}@keyframes bp{0%,30%{opacity:1}31%,100%{opacity:.08}}.nb{animation:bp 2s steps(1) infinite}.nb2{animation:bp2 2.4s steps(1) infinite}@keyframes bp2{50%{opacity:0}}'];
    },
    ctf: () => {
      const q = rng(3);
      let a = box(0, 0, 70, 29, '#16103f') + box(0, 18, 70, 11, '#2a1a68');
      for (let i = 0; i < 26; i++) a += box(q(70), q(16), 1, 1, '#fff', ` class="t${q(2)}"`);
      for (let x = 0; x < 70; x++) { const yy = 29 - Math.max(2, 13 - Math.floor(Math.abs(x - 35) / 2.2)); a += box(x, yy, 1, 29 - yy, '#0c0826'); }
      a += box(35, 3, 1, 15, '#d8d2ff');
      const flag = (rows) => paint(rows, { r: '#ff2d55', w: '#ffffff' }, 1, 36, 3);
      a += `<g class="fa">${flag(['rrrrrrrrrrrr', 'rrrrwwrrrrrrr', 'rrrwwwwrrrrrr', 'rrrrwwrrrrrrr', 'rrrrrrrrrrrr', '.rrrrrrrrr'])}</g><g class="fb">${flag(['.rrrrrrrrrrrr', 'rrrrwwrrrrrr', 'rrrwwwwrrrrr', 'rrrrwwrrrrrr', '.rrrrrrrrrrrr', 'rrrrrrrrrr'])}</g>`;
      a += ring(35, 17, 3, '#ffc94a');
      return [a, '.fa{animation:f .5s steps(1) infinite}.fb{animation:f .5s steps(1) -.25s infinite}@keyframes f{50%{opacity:0}}.t0{animation:t 2s steps(2) infinite}.t1{animation:t 3s steps(2) -1s infinite}@keyframes t{50%{opacity:.2}}'];
    },
    bug: () => {
      let a = box(0, 0, 70, 29, '#06281d');
      [[0, 6, 26], [20, 6, 1, 12], [20, 18, 30], [50, 8, 1, 10], [50, 8, 20], [8, 24, 44], [8, 12, 1, 12]].forEach(([x, y, w, hh]) => { a += box(x, y, w, hh || 1, '#0f6a48'); });
      [[20, 6], [20, 18], [50, 18], [50, 8], [8, 12]].forEach(([x, y]) => { a += box(x - 1, y - 1, 3, 3, '#ffc94a'); });
      const body = ['..a...a..', '...aaa...', '.rrrrrrr.', 'rrkrrrkrr', '.rrrkrrr.', '..rrkrr..'];
      const L = { r: '#ff2d55', k: '#3a0a18', a: '#ffffff', l: '#ffb1c0' };
      const legsA = ['l.l...l.l', '.l..l..l.'], legsB = ['.l.l.l.l.', 'l.......l'];
      a += `<g class="bug">${paint(body, L)}<g class="la">${paint(legsA, L, 1, 0, 6)}</g><g class="lb">${paint(legsB, L, 1, 0, 6)}</g></g>`;
      a += `<g class="glass">${ring(0, 0, 7, '#d8e9ff')}</g>`;
      return [a, '.bug{animation:bg 5s steps(40) infinite alternate}@keyframes bg{from{transform:translate(4px,14px)}to{transform:translate(56px,14px)}}.la{animation:f .24s steps(1) infinite}.lb{animation:f .24s steps(1) -.12s infinite}@keyframes f{50%{opacity:0}}.glass{animation:gs 5s steps(40) infinite alternate}@keyframes gs{from{transform:translate(20px,14px)}to{transform:translate(42px,16px)}}'];
    },
    muhur: () => {
      let a = box(0, 0, 70, 29, '#efe3c4');
      for (let y = 3; y < 28; y += 3) a += box(6, y, 22, 1, '#cdbf9b') + box(46, y, 18, 1, '#cdbf9b');
      a += `<g class="seal">${ring(36, 16, 8, '#c8102e')}${ring(36, 16, 7, '#c8102e')}<path d="M32 16h2v2h-2zM34 18h2v2h-2zM36 16h2v2h-2zM38 14h2v2h-2zM40 12h2v2h-2z" fill="#c8102e"/></g>`;
      a += `<g class="stamp">${paint(['...nnnnnn...', '..nNNNNNNn..', '..nNNNNNNn..', '...nNNNNn...', '....nNNn....', '....nNNn....', '..nnnNNnnn..', '.nNNNNNNNNn.', 'nNNNNNNNNNNn', 'dddddddddddd'], { n: '#3a2a78', N: '#6a55c8', d: '#c8102e' }, 1, 30, 0)}</g>`;
      return [a, '.stamp{animation:st 3s infinite}@keyframes st{0%,25%{transform:translateY(-4px)}38%{transform:translateY(8px)}48%{transform:translateY(8px)}70%,100%{transform:translateY(-4px)}}.seal{opacity:0;animation:se 3s steps(1) infinite}@keyframes se{0%,37%{opacity:0}38%,92%{opacity:1}93%,100%{opacity:0}}'];
    },
    astro: () => {
      const q = rng(13);
      let a = box(0, 0, 70, 29, '#05061c');
      for (let i = 0; i < 38; i++) a += box(q(70), q(29), 1, 1, '#d8e9ff', ` class="t${q(2)}"`);
      a += discRows(60, 32, 18, (x, y, w, dy) => box(x, y, w, 1, dy < -15 ? '#7ad7ff' : dy < -11 ? '#2f7fd6' : '#1b4f9c'));
      a += `<g class="rock">${box(-12, 3, 9, 1, '#ff8a4f')}${box(-8, 5, 7, 1, '#ffc94a')}${box(-10, 7, 8, 1, '#ff5f6d')}${paint(['..gggg..', '.gGGGGg.', 'gGGkGGGg', 'gGGGGkGg', 'gGkGGGGg', '.gGGGGg.', '..gggg..'], { g: '#6a5f70', G: '#a89aa8', k: '#3f3748' })}</g>`;
      a += `<g class="ret"><path d="M25 7h6v1h-6zM25 7h1v6h-1zM43 7h6v1h-6zM48 7h1v6h-1zM25 19h1v6h-1zM25 24h6v1h-6zM48 19h1v6h-1zM43 24h6v1h-6z" fill="#7dffa0"/></g>`;
      return [a, '.rock{animation:rk 4s linear infinite}@keyframes rk{from{transform:translate(-14px,2px)}to{transform:translate(84px,20px)}}.ret{animation:f 4s steps(1) infinite}@keyframes f{0%,30%{opacity:0}31%,70%{opacity:1}71%,100%{opacity:0}}.t0{animation:t 2s steps(2) infinite}.t1{animation:t 3s steps(2) -1s infinite}@keyframes t{50%{opacity:.2}}'];
    },
    deprem: () => {
      const q = rng(21);
      let a = box(0, 0, 70, 29, '#14100c');
      for (let x = 0; x < 70; x += 10) a += box(x, 0, 1, 20, '#2b241b');
      for (let y = 4; y < 20; y += 5) a += box(0, y, 70, 1, '#2b241b');
      let d = '', prev = 10;
      for (let x = 0; x < 70; x++) {
        const quake = x > 26 && x < 44, amp = quake ? 8.5 - Math.abs(x - 35) / 1.6 : 1;
        const wave = [0, 1, 0, -1][x % 4];
        const y = Math.max(1, Math.min(19, Math.round(10 + wave * amp * (0.6 + q(40) / 100))));
        const top = Math.min(y, prev), hh = Math.abs(y - prev) + 1;
        d += `M${x} ${top}h1v${hh}h-1zM${x + 70} ${top}h1v${hh}h-1z`;
        prev = y;
      }
      a += `<g class="line"><path d="${d}" fill="#ff4f4f"/></g>`;
      let city = box(0, 27, 70, 2, '#0a0806');
      [[4, 8], [13, 6], [21, 9], [33, 7], [42, 9], [52, 6], [61, 8]].forEach(([x, hh]) => { city += box(x, 27 - hh, 7, hh, '#3f362a'); for (let wy = 28 - hh; wy < 26; wy += 3) city += box(x + 1, wy, 1, 1, '#ffc94a') + box(x + 4, wy, 1, 1, '#ffc94a'); });
      a += `<g class="city">${city}</g>`;
      return [a, '.line{animation:ln 4s steps(70) infinite}@keyframes ln{to{transform:translateX(-70px)}}.city{animation:qk 4s steps(1) infinite}@keyframes qk{0%,44%,66%,100%{transform:none}46%{transform:translate(-1px,0)}49%{transform:translate(1px,-1px)}52%{transform:translate(-1px,1px)}56%{transform:translate(1px,0)}60%{transform:translate(-1px,0)}}'];
    },
    vakit: () => {
      const q = rng(33);
      let a = '';
      ['#0a0f2e', '#111a45', '#1a2a5e', '#2a3f78'].forEach((c, i) => { a += box(0, i * 6, 70, 6, c); });
      a += box(0, 24, 70, 5, '#2a3f78');
      for (let i = 0; i < 34; i++) a += box(q(70), q(19), 1, 1, '#fff', ` class="t${q(2)}"`);
      a += discRows(56, 7, 5, (x, y, w) => box(x, y, w, 1, '#ffe9a8')) + discRows(58, 6, 5, (x, y, w) => box(x, y, w, 1, '#0f1740'));
      const m = '#080c22';
      a += discRows(34, 19, 8, (x, y, w, dy) => (dy <= 0 ? box(x, y, w, 1, m) : '')) + box(33, 8, 2, 3, m) + box(34, 6, 1, 2, '#ffe9a8');
      a += box(23, 19, 23, 10, m) + box(15, 10, 3, 19, m) + box(51, 10, 3, 19, m) + box(14, 13, 5, 1, m) + box(50, 13, 5, 1, m) + box(16, 7, 1, 3, m) + box(52, 7, 1, 3, m) + box(0, 27, 70, 2, m);
      [27, 33, 39].forEach((x) => { a += box(x, 21, 3, 5, '#ffc94a', ' class="gw"'); });
      a += box(16, 15, 1, 2, '#ffc94a', ' class="gw"') + box(52, 15, 1, 2, '#ffc94a', ' class="gw"');
      return [a, '.gw{animation:gw 3s steps(3) infinite alternate}@keyframes gw{from{opacity:.55}to{opacity:1}}.t0{animation:t 2.2s steps(2) infinite}.t1{animation:t 3.4s steps(2) -1s infinite}@keyframes t{50%{opacity:.2}}'];
    },
    piscine: () => {
      let a = box(0, 0, 70, 29, '#0a4f9c');
      const wave = (y, c, step) => { let d = ''; for (let x = 0; x < 140; x++) if ((x + y) % step < step / 2) d += `M${x} ${y + (x % step < step / 4 ? 1 : 0)}h1v2h-1z`; return `<path d="${d}" fill="${c}"/>`; };
      a += `<g class="w1">${wave(4, '#1f7fd6', 12)}${wave(23, '#1f7fd6', 12)}</g><g class="w2">${wave(10, '#5ab8f0', 16)}${wave(19, '#5ab8f0', 16)}</g>`;
      a += `<g class="num"><path d="${textPath('42', 23, 8, 2)}" fill="#04254c" transform="translate(1 1)"/><path d="${textPath('42', 23, 8, 2)}" fill="#ffffff"/></g>`;
      return [a, '.w1{animation:wv 3s linear infinite}.w2{animation:wv 5s linear infinite reverse}@keyframes wv{to{transform:translateX(-48px)}}.num{animation:nm 1.8s steps(2) infinite alternate}@keyframes nm{from{transform:translateY(-1px)}to{transform:translateY(1px)}}'];
    },
    masa: () => {
      let a = box(0, 0, 70, 29, '#2a1e52') + box(0, 24, 70, 5, '#170f33') + box(44, 3, 20, 13, '#0d0a2a') + box(53, 3, 1, 13, '#3a2a78') + box(44, 9, 20, 1, '#3a2a78');
      const q = rng(7);
      for (let i = 0; i < 12; i++) a += box(44 + q(20), 3 + q(13), 1, 1, '#fff', ` class="t${q(2)}"`);
      a += box(6, 21, 38, 2, '#5c4fa8') + box(10, 23, 2, 6, '#3a2a78') + box(38, 23, 2, 6, '#3a2a78') + box(13, 9, 20, 11, '#0e0a24') + box(14, 10, 18, 9, '#8b87ff', ' class="gw"') + box(21, 20, 6, 1, '#0e0a24');
      a += paint(['.k.k.........', '.kkkk........', 'kkkkkkkkkk...', 'kkkkkkkkkkkk.', 'kkkkkkkkkkkkk'], { k: '#0e0a24' }, 1, 30, 16);
      a += `<g class="soon">${box(49, 18, 15, 9, '#ffc94a')}<path d="M54 18v-3h5v3h-1v-2h-3v2z" fill="#ffc94a"/>${box(56, 21, 1, 3, '#2a1e52')}</g>`;
      return [a, '.gw{animation:gw 2.4s steps(3) infinite alternate}@keyframes gw{from{opacity:.7}to{opacity:1}}.soon{animation:sn 1.2s steps(2) infinite}@keyframes sn{50%{opacity:.35}}.t0{animation:t 2.2s steps(2) infinite}.t1{animation:t 3.4s steps(2) -1s infinite}@keyframes t{50%{opacity:.2}}'];
    },
  };

  function card(c, stars) {
    const W = 420, H = 300, U = 6, AH = 29 * U;
    const [art, css] = ART[c.art]();
    const acc = c.color;
    const coin = stars ? `${paint(ICONS.coin, ICON_PAL, 3, W - 44 - widthOf(String(stars), 3), AH + 18)}${label(String(stars), W - 18 - widthOf(String(stars), 3), AH + 19, 3, '#ffc94a')}` : '';
    save(`p-${c.id}`, svg(W, H, `${c.title}: ${c.desc}`, `<style>${css}.flash{animation:fl 6s ${c.delay}s steps(1) infinite}@keyframes fl{0%,88%,100%{opacity:1}90%{opacity:.4}93%{opacity:1}95%{opacity:.6}}${STILL('')}</style>
<clipPath id="clip"><path d="M12 0h${W - 24}v6h6v6h6v${H - 24}h-6v6h-6v6h-${W - 24}v-6h-6v-6h-6v-${H - 24}h6v-6h6z"/></clipPath>
<g clip-path="url(#clip)"><rect width="${W}" height="${H}" fill="#0a0620"/><g class="flash"><svg width="${W}" height="${AH}" viewBox="0 0 70 29" preserveAspectRatio="xMidYMid slice">${art}</svg></g>
<rect y="${AH}" width="${W}" height="6" fill="${acc}"/>
${label(c.title, 20, AH + 22, 3, '#ffffff')}${coin}
${label(c.desc, 20, AH + 66, 2, '#b8aef0')}
<g class="flash">${label(c.cta, 20, AH + 92, 2, acc)}</g></g>
<path d="M12 0h${W - 24}v4h-${W - 24}zM12 ${H - 4}h${W - 24}v4h-${W - 24}zM0 12h4v${H - 24}h-4zM${W - 4} 12h4v${H - 24}h-4zM6 6h6v6h-6zM${W - 12} 6h6v6h-6zM6 ${H - 12}h6v6h-6zM${W - 12} ${H - 12}h6v6h-6z" fill="${acc}"/>`));
  }

  function header(count) {
    const W = 1280, H = 88;
    save('gorevler', svg(W, H, `${count} görev`, `<style>.ar{animation:ar .8s steps(2) infinite alternate}@keyframes ar{from{transform:translateX(0)}to{transform:translateX(10px)}}.b{animation:b 1.1s steps(2) infinite}@keyframes b{50%{opacity:.2}}${STILL('')}</style>
<rect width="${W}" height="${H}" fill="#0a0620"/><path d="M0 0h${W}v4h-${W}zM0 ${H - 4}h${W}v4h-${W}z" fill="#ff4fa3"/>
<g class="ar">${label('>', 34, 26, 5, '#ffc94a')}</g>${label('GÖREVLER', 90, 26, 5, '#ffffff')}<g class="b">${label(`${count} KAYIT YÜKLENDİ`, W - 34 - widthOf(`${count} KAYIT YÜKLENDİ`, 3), 32, 3, '#5ffbf1')}</g>`));
  }

  return { scene, card, header };
};
