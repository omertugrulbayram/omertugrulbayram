#!/usr/bin/env python3
"""
omertugrulbayram // profil README üreticisi
-------------------------------------------
Tüm kareleri (animasyonlu SVG) assets/ klasörüne üretir.

  python scripts/generate.py            # GITHUB_TOKEN varsa canlı veri, yoksa örnek veri

Sadece Python standart kütüphanesi kullanır. GitHub Actions her gün çalıştırır.
Metinleri / seviyeleri / başarımları değiştirmek için aşağıdaki CONFIG'i düzenle.
"""
import datetime as dt
import html
import json
import os
import random
import re
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

USER = os.environ.get("GH_USER", "omertugrulbayram")
TOKEN = os.environ.get("GITHUB_TOKEN", "")
OUT = Path(__file__).resolve().parent.parent / "assets"

# ════════════════════════════════════════════════════════════════════════
#  CONFIG — burayı düzenle
# ════════════════════════════════════════════════════════════════════════
CONFIG = {
    "chapter": "BÖLÜM 01 — AÇIĞIN PEŞİNDE",
    "name": "ÖMER BAYRAM",
    "terminal": [  # (tür, metin)  tür: "cmd" ya da "out"
        ("cmd", "$ whoami"),
        ("out", "omer_bayram :: security researcher"),
        ("cmd", "$ cat focus.txt"),
        ("out", "web · cloud · llm · mcp security"),
        ("cmd", "$ ./hunt --scope '*' --until found"),
    ],
    "bubble": ["Her sistemde bir açık vardır.", "Bulana kadar durmam."],
    "taglines": [
        "> bug bounty · ctf · llm red team · mcp security",
        "> [ sakarya, tr ]  [ subü // bilişim güvenliği ]",
    ],
    "level": 19,
    "class": "Security Researcher",
    "skills": [  # (ad, seviye/10)
        ("WEB APP SECURITY", 9),
        ("LLM / AI RED TEAM", 8),
        ("CTF", 8),
        ("CLOUD SECURITY", 6),
        ("MCP SECURITY", 6),
    ],
    "inventory": [  # (ikon, satır1, satır2)
        ("bug", "BUG BOUNTY", "H1·BC·BugBounter"),
        ("rocket", "NASA SPACE APPS", "global nominee"),
        ("trophy", "BiP NIGHT", "1. sıra"),
        ("star", "VOYAGER CHLG.", "1. sıra"),
        ("medal", "ÇÖZÜM SENDE", "2. sıra"),
        ("scroll", "SEAL", "ISAS 2026"),
        ("flag", "BAYRAK SENDE", "4. sıra"),
        ("shield", "MCP RESEARCH", "devam ediyor"),
    ],
    "toolbelt": ["burp", "python", "semgrep", "garak", "pyrit", "ollama", "flutter", "supabase"],
    "blog_url": "https://omertugrulbayram.com",
    # Blogunun RSS/Atom adresi. Sırayla denenir; hiçbiri yoksa sadece link gösterilir.
    "blog_feeds": ["/rss.xml", "/feed.xml", "/atom.xml", "/feed", "/rss", "/index.xml"],
    "buttons": [  # (dosya, yazı)  — README'de linkleri ayarla
        ("btn-blog", "BLOG"),
        ("btn-linkedin", "LINKEDIN"),
        ("btn-github", "REPOLAR"),
    ],
}

# ── renkler ─────────────────────────────────────────────────────────────
PAPER, INK, RED, GREEN = "#f4f1ea", "#111111", "#e63946", "#39ff7a"
TERM, DIMG, CYAN = "#0b0f0b", "#1f6b3a", "#4cc9f0"
MONO = "'DejaVu Sans Mono','Cascadia Mono',Consolas,'Courier New',Menlo,monospace"
CW = 0.6  # monospace karakter genişliği / font-size

BASE_CSS = (
    f".m{{font-family:{MONO}}}"
    "@media (prefers-reduced-motion:reduce){*{animation:none!important}}"
)


# ── yardımcılar ─────────────────────────────────────────────────────────
def esc(s):
    return html.escape(str(s), quote=True)


def svg(w, h, title, css, body):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}" xml:space="preserve" role="img" aria-label="{esc(title)}">\n'
        f"<title>{esc(title)}</title>\n<style>{BASE_CSS}{css}</style>\n"
        + "\n".join(body)
        + "\n</svg>\n"
    )


def rect(x, y, w, h, fill, extra=""):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" {extra}/>'


def text(x, y, s, size, fill, cls="", anchor="start", fixed=True, weight=None, extra=""):
    """Monospace metin. fixed=True → textLength ile her fontta aynı genişlik."""
    tl = f' textLength="{len(s) * size * CW:.1f}" lengthAdjust="spacingAndGlyphs"' if fixed else ""
    wt = f' font-weight="{weight}"' if weight else ""
    return (
        f'<text class="m {cls}" x="{x}" y="{y}" font-size="{size}" fill="{fill}" '
        f'text-anchor="{anchor}"{tl}{wt} {extra}>{esc(s)}</text>'
    )


def fit(s, width, size):
    """metni verilen genişliğe sığacak font boyutu"""
    return round(min(size, width / (len(s) * CW)), 1)


def pixels(grid, x0, y0, p, colors, cls=None):
    """grid: satır listesi; aynı renkteki yatay pikselleri tek rect'e birleştirir."""
    out, cls = [], cls or {}
    for r, row in enumerate(grid):
        c = 0
        while c < len(row):
            ch = row[c]
            if ch == ".":
                c += 1
                continue
            s = c
            while c < len(row) and row[c] == ch:
                c += 1
            k = f' class="{cls[ch]}"' if ch in cls else ""
            out.append(f'<rect{k} x="{x0 + s * p}" y="{y0 + r * p}" width="{(c - s) * p}" height="{p}" fill="{colors[ch]}"/>')
    return "\n".join(out)


def frame(x, y, w, h, sw=3):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{INK}" stroke-width="{sw}"/>'


# ════════════════════════════════════════════════════════════════════════
#  KARE 1 — kapak (pixel karakter + terminal + balon)
# ════════════════════════════════════════════════════════════════════════
HERO_GRID = [
    "................",
    ".....HHHHHH.....",
    "....HHhHHHHH....",
    "...HHhHHHHHHH...",
    "...HHFFFFFFHH...",
    "..HHFFFFFFFFHH..",
    "..HHFEEFFEEFHH..",
    "..HHFFFFFFFFHH..",
    "..HHHFFFFFFHHH..",
    "...HHHHHHHHHH...",
    "..BBBBBdBBBBBB..",
    ".BBBBBBdBBBBBBB.",
    ".BBBLLLLLLLLBBB.",
    "BBBLLLLLLLLLLBBB",
    "BBBLLLLRRLLLLBBB",
    "BBLLLLLLLLLLLLBB",
    "KKKKKKKKKKKKKKKK",
]
HERO_COLORS = {
    "H": "#1c1c24", "h": "#3a3a48", "F": "#07070a", "E": GREEN, "B": "#26262f",
    "d": "#5a5a68", "L": "#c9c9d1", "R": RED, "K": "#8d8d97",
}


def hero():
    W, H = 840, 384
    rnd = random.Random(7)
    T = 12  # terminal döngüsü (sn)
    css = [
        ".spd{transform-origin:196px 210px;animation:pulse 1.4s ease-in-out infinite}",
        "@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.05);opacity:.55}}",
        ".eye{animation:blink 4s infinite}@keyframes blink{0%,90%,100%{opacity:1}93%{opacity:0}}",
        ".logo{animation:fl 2.2s infinite}@keyframes fl{0%,100%{opacity:1}48%{opacity:.4}52%{opacity:1}}",
        ".sfx{animation:wob .45s ease-in-out infinite alternate}@keyframes wob{to{transform:translateY(-4px)}}",
        ".gr{animation:gr 3s infinite}@keyframes gr{0%,85%,100%{transform:translate(0,0)}88%{transform:translate(-3px,1px)}92%{transform:translate(3px,-1px)}}",
        ".gc{animation:gc 3s infinite}@keyframes gc{0%,85%,100%{transform:translate(0,0)}88%{transform:translate(3px,-1px)}92%{transform:translate(-2px,1px)}}",
        ".pt{animation:rise 3.6s linear infinite}@keyframes rise{0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(-70px);opacity:0}}",
        f".scan{{animation:scan 3s linear infinite}}@keyframes scan{{to{{transform:translateY(150px)}}}}",
        f".cb{{animation:cb 1s steps(1) infinite}}@keyframes cb{{50%{{opacity:0}}}}",
    ]
    b = [rect(0, 0, W, H, PAPER)]
    # üst bant
    b.append(rect(0, 0, W, 40, INK))
    b.append(text(16, 27, "第01話", 16, RED, fixed=False, weight="bold"))
    b.append(text(86, 26, CONFIG["chapter"], 13, PAPER))
    b.append(text(W - 16, 26, f"github.com/{USER}", 12, "#8d8d97", anchor="end"))

    # ── sol kare: hız çizgileri + karakter
    b.append('<defs><clipPath id="lp"><rect x="16" y="52" width="360" height="316"/></clipPath>'
             f'<pattern id="tone" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.4" fill="{INK}" opacity=".3"/></pattern></defs>')
    b.append('<g clip-path="url(#lp)">')
    b.append('<g class="spd">')
    for i in range(48):
        a = i * 7.5 + rnd.uniform(-2, 2)
        sw = rnd.choice([1, 1.5, 2, 3, 4, 5])
        b.append(f'<line x1="196" y1="{210 - 112}" x2="196" y2="{210 - 380}" stroke="{INK}" stroke-width="{sw}" transform="rotate({a:.1f} 196 210)"/>')
    b.append("</g>")
    b.append(pixels(HERO_GRID, 100, 92, 12, HERO_COLORS, {"E": "eye", "R": "logo"}))
    for i in range(10):
        x = rnd.choice([rnd.randint(40, 88), rnd.randint(300, 350)])
        y = rnd.randint(140, 290)
        b.append(f'<rect class="pt" x="{x}" y="{y}" width="6" height="6" fill="{GREEN if i % 3 else RED}" style="animation-delay:-{rnd.uniform(0, 3.6):.2f}s"/>')
    b.append(f'<g class="sfx">{text(30, 98, "ドドド", 30, RED, fixed=False, weight="bold")}</g>')
    b.append(rect(28, 314, 336, 40, INK))
    name = CONFIG["name"]
    cyan_copy = text(196, 342, name, 20, CYAN, anchor="middle", weight="bold", extra='opacity=".8"')
    red_copy = text(196, 342, name, 20, RED, anchor="middle", weight="bold", extra='opacity=".9"')
    b.append(f'<g class="gc">{cyan_copy}</g>')
    b.append(f'<g class="gr">{red_copy}</g>')
    b.append(text(196, 342, name, 20, "#ffffff", anchor="middle", weight="bold"))
    b.append("</g>")

    # ── sağ üst: terminal
    tx, ty, tw, th = 388, 52, 436, 176
    b.append(rect(tx, ty, tw, th, TERM))
    b.append(rect(tx, ty, tw, 22, "#1a1f1a"))
    for i, c in enumerate([RED, "#ffd166", GREEN]):
        b.append(rect(tx + 10 + i * 14, ty + 7, 8, 8, c))
    b.append(text(tx + tw - 12, ty + 15, f"tty0 — {USER}@sakarya", 11, "#6b776b", anchor="end"))
    b.append(f'<clipPath id="tc"><rect x="{tx}" y="{ty}" width="{tw}" height="{th}"/></clipPath><g clip-path="url(#tc)">')
    lines = CONFIG["terminal"]
    total = sum(len(s) for _, s in lines)
    t, gap = 3.0, 3.0
    for i, (kind, s) in enumerate(lines):
        y = ty + 46 + i * 24
        col = "#d0d0d8" if kind == "cmd" else GREEN
        b.append(text(tx + 14, y, s, 14, col))
        dur = 58.0 * len(s) / total
        s0, e0 = t, t + dur
        t = e0 + gap
        css.append(f"@keyframes ty{i}{{0%,{s0:.1f}%{{transform:translateX(0)}}{e0:.1f}%,93%{{transform:translateX({tw}px)}}94%,100%{{transform:translateX(0)}}}}")
        css.append(f".ty{i}{{animation:ty{i} {T}s steps({len(s)}) infinite}}")
        b.append(f'<rect class="ty{i}" x="{tx + 10}" y="{y - 15}" width="{tw - 12}" height="20" fill="{TERM}"/>')
        last_y, last_len, last_end = y, len(s), e0
    cx = tx + 14 + last_len * 14 * CW + 4
    css.append(f"@keyframes cur{{0%,{last_end:.1f}%{{opacity:0}}{last_end + .1:.1f}%,93%{{opacity:1}}94%,100%{{opacity:0}}}}.cur{{animation:cur {T}s infinite}}")
    b.append(f'<g class="cur"><rect class="cb" x="{cx:.1f}" y="{last_y - 13}" width="9" height="16" fill="{GREEN}"/></g>')
    b.append(f'<rect class="scan" x="{tx}" y="{ty + 22}" width="{tw}" height="5" fill="{GREEN}" opacity=".07"/>')
    b.append("</g>")

    # ── sağ alt: tram + konuşma balonu
    bx, by, bw, bh = 388, 240, 436, 128
    b.append(rect(bx, by, bw, bh, PAPER))
    b.append(rect(bx, by, bw, bh, "url(#tone)"))
    b.append(f'<polygon points="470,326 440,358 505,334" fill="#fff" stroke="{INK}" stroke-width="2.5"/>')
    b.append(f'<ellipse cx="580" cy="300" rx="158" ry="42" fill="#fff" stroke="{INK}" stroke-width="2.5"/>')
    b.append(rect(470, 320, 40, 12, "#fff"))  # kuyruk birleşimini temizle
    l1, l2 = CONFIG["bubble"]
    b.append(text(580, 296, l1, 14, INK, anchor="middle"))
    b.append(text(580, 318, l2, 14, RED, anchor="middle", weight="bold"))
    b.append(f'<g class="sfx" style="animation-delay:-.2s">{text(752, 286, "ゴゴ", 26, RED, fixed=False, weight="bold")}</g>')

    for f in [(16, 52, 360, 316), (tx, ty, tw, th), (bx, by, bw, bh)]:
        b.append(frame(*f))
    return svg(W, H, "Ömer Bayram — manga kapak karesi", "".join(css), b)


# ════════════════════════════════════════════════════════════════════════
#  KARE 2 — ASCII (yağmur + banner + ascii hacker)
# ════════════════════════════════════════════════════════════════════════
OMER = [
    "  ▄▄  ▄▄                            ",
    " ██████╗ ███╗   ███╗███████╗██████╗ ",
    "██╔═══██╗████╗ ████║██╔════╝██╔══██╗",
    "██║   ██║██╔████╔██║█████╗  ██████╔╝",
    "██║   ██║██║╚██╔╝██║██╔══╝  ██╔══██╗",
    "╚██████╔╝██║ ╚═╝ ██║███████╗██║  ██║",
    " ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝",
]
BAYRAM = [
    "██████╗  █████╗ ██╗   ██╗██████╗  █████╗ ███╗   ███╗",
    "██╔══██╗██╔══██╗╚██╗ ██╔╝██╔══██╗██╔══██╗████╗ ████║",
    "██████╔╝███████║ ╚████╔╝ ██████╔╝███████║██╔████╔██║",
    "██╔══██╗██╔══██║  ╚██╔╝  ██╔══██╗██╔══██║██║╚██╔╝██║",
    "██████╔╝██║  ██║   ██║   ██║  ██║██║  ██║██║ ╚═╝ ██║",
    "╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝",
]
_FIG = [
    "▄▄▄▄▄▄▄▄",
    "▄▓▓▓▓▓▓▓▓▓▓▓▓▄",
    "▄▓▓▓▒▒▒▒▒▒▒▒▒▒▓▓▓▄",
    "▓▓▓▒░" + " " * 10 + "░▒▓▓▓",
    "▓▓▓▒░  ██    ██  ░▒▓▓▓",
    "▓▓▓▒░" + " " * 12 + "░▒▓▓▓",
    "▓▓▓▓▒░" + " " * 10 + "░▒▓▓▓▓",
    "▓▓▓▓▒▒" + "░" * 8 + "▒▒▓▓▓▓",
    "▄" + "▓" * 24 + "▄",
    "▓" * 28,
    "▓" * 6 + "╔" + "═" * 14 + "╗" + "▓" * 6,
    "▓" * 6 + "║ >_ hunt.sh ▌ ║" + "▓" * 6,
    "▓" * 6 + "║ [░░░░░░░░]   ║" + "▓" * 6,
    "▀" * 6 + "╚" + "═" * 14 + "╝" + "▀" * 6,
]
FIGURE = [r.center(30) for r in _FIG]
FIG_COLORS = {"▓": "#1f9a4f", "▒": "#146b36", "░": "#0d4424", "▄": "#1f9a4f", "▀": "#1f9a4f",
              "█": "#b6ffcf", "▌": GREEN, "═": GREEN, "║": GREEN, "╔": GREEN, "╗": GREEN, "╚": GREEN, "╝": GREEN}


def block_line(x, y, s, size, solid, shade, cls="", style=""):
    """█▄▀ parlak, kutu karakterleri gölge rengi — 3D ascii hissi."""
    parts, cur, curk = [], "", None
    for ch in s:
        k = "s" if ch in "█▄▀" else "h"
        if k != curk and cur:
            parts.append((curk, cur))
            cur = ""
        cur, curk = cur + ch, k
    if cur:
        parts.append((curk, cur))
    spans = "".join(f'<tspan fill="{solid if k == "s" else shade}">{esc(t)}</tspan>' for k, t in parts)
    st = f' style="{style}"' if style else ""
    return (f'<text class="m {cls}" x="{x}" y="{y}" font-size="{size}" '
            f'textLength="{len(s) * size * CW:.1f}" lengthAdjust="spacingAndGlyphs"{st}>{spans}</text>')


def color_line(x, y, s, size, cmap, default, cls_map=None):
    """karakter bazlı renk — aynı renkteki ardışık karakterler tek tspan."""
    cls_map = cls_map or {}
    parts, cur, curk = [], "", None
    for ch in s:
        k = ch if ch in cmap else None
        if k != curk and cur:
            parts.append((curk, cur))
            cur = ""
        cur, curk = cur + ch, k
    if cur:
        parts.append((curk, cur))
    spans = "".join(
        f'<tspan fill="{cmap.get(k, default)}"' + (f' class="{cls_map[k]}"' if k in cls_map else "") + f">{esc(t)}</tspan>"
        for k, t in parts)
    return (f'<text class="m" x="{x}" y="{y}" font-size="{size}" '
            f'textLength="{len(s) * size * CW:.1f}" lengthAdjust="spacingAndGlyphs">{spans}</text>')


def ascii_panel():
    W, H = 840, 340
    rnd = random.Random(11)
    T = 9
    css = [
        ".rn{animation:rain linear infinite}@keyframes rain{from{transform:translateY(-320px)}to{transform:translateY(360px)}}",
        f"@keyframes rev{{0%{{opacity:0;transform:translateX(-12px)}}5%{{opacity:1;transform:translateX(0)}}93%{{opacity:1}}100%{{opacity:0}}}}",
        f".rv{{animation:rev {T}s steps(6) infinite backwards}}",
        ".gx{animation:gx 2.7s infinite}@keyframes gx{0%,80%,100%{transform:translateX(0)}82%{transform:translateX(7px)}84%{transform:translateX(-4px)}86%{transform:translateX(0)}}",
        ".ey{animation:ey 3.2s infinite}@keyframes ey{0%,88%,100%{fill:#b6ffcf}91%{fill:#07120a}}",
        ".cb{animation:cb 1s steps(1) infinite}@keyframes cb{50%{opacity:0}}",
    ]
    b = [rect(0, 0, W, H, TERM)]
    b.append(f'<defs><clipPath id="ap"><rect x="0" y="0" width="{W}" height="{H}"/></clipPath>'
             f'<pattern id="sl" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".35"/></pattern></defs>')
    b.append('<g clip-path="url(#ap)">')
    glyphs = "01アイウエオカキクケコサシスセソ<>/{}#$%=+"
    for i in range(42):
        x = 8 + i * 20
        chars = "".join(rnd.choice(glyphs) for _ in range(16))
        tsp = "".join(f'<tspan x="{x}" dy="18">{esc(c)}</tspan>' for c in chars)
        dur = rnd.uniform(5, 12)
        b.append(f'<text class="m rn" y="0" font-size="13" fill="{GREEN}" opacity="{rnd.uniform(.08, .22):.2f}" '
                 f'style="animation-duration:{dur:.1f}s;animation-delay:-{rnd.uniform(0, dur):.1f}s">{tsp}</text>')
    # banner
    for i, s in enumerate(OMER):
        cls = "rv gx" if i == 3 else "rv"
        b.append(block_line(36, (56 if i == 0 else 60) + i * 14, s, 12, GREEN, DIMG, cls, f"animation-delay:{i * .12:.2f}s"))
    for i, s in enumerate(BAYRAM):
        cls = "rv gx" if i == 2 else "rv"
        b.append(block_line(36, 174 + i * 14, s, 12, RED, "#6b1a21", cls, f"animation-delay:{.9 + i * .12:.2f}s"))
    for i, s in enumerate(CONFIG["taglines"]):
        b.append(f'<g class="rv" style="animation-delay:{1.8 + i * .3:.1f}s">{text(36, 282 + i * 22, s, 13, "#d0d0d8" if i == 0 else "#7d8a7d")}</g>')
    # ascii hacker (blok karakterlerle)
    fx, fy, fs, lh = 552, 70, 14, 16.3
    for i, s in enumerate(FIGURE):
        b.append(color_line(fx, fy + i * lh, s, fs, FIG_COLORS, "#d0ffe0", {"█": "ey", "▌": "cb"}))
    # ekrandaki ilerleme çubuğu dolsun
    col = FIGURE[12].index("[") + 1
    px, py = fx + col * fs * CW, fy + 12 * lh - fs * .78
    css.append(f"@keyframes pb{{0%{{width:0}}80%,100%{{width:{8 * fs * CW:.1f}px}}}}.pb{{animation:pb 4s steps(8) infinite}}")
    b.append(f'<rect class="pb" x="{px:.1f}" y="{py:.1f}" width="{8 * fs * CW:.1f}" height="{fs * .8:.1f}" fill="{GREEN}"/>')
    b.append(rect(0, 0, W, H, "url(#sl)"))
    b.append("</g>")
    b.append(text(W - 14, H - 12, "第02話 · ASCII", 11, "#4d5a4d", anchor="end", fixed=False))
    b.append(frame(1.5, 1.5, W - 3, H - 3))
    return svg(W, H, "ÖMER BAYRAM — ASCII karesi", "".join(css), b)


# ════════════════════════════════════════════════════════════════════════
#  KARE 3 — karakter kartı (yetenekler + envanter)
# ════════════════════════════════════════════════════════════════════════
ICONS = {
    "bug": ["..k..k..", "...kk...", ".kRRRRk.", "k.RRRR.k", ".kRRRRk.", "k.RRRR.k", "..RRRR..", ".k....k."],
    "rocket": ["...WW...", "..WRRW..", "..WWWW..", "..WBBW..", "..WWWW..", ".RWWWWR.", "R.W..W.R", "...YY..."],
    "trophy": ["YYYYYYYY", "YYYYYYYY", "Y.YYYY.Y", ".YYYYYY.", "..YYYY..", "...YY...", "..YYYY..", ".kkkkkk."],
    "star": ["...YY...", "...YY...", "YYYYYYYY", ".YYYYYY.", "..YYYY..", ".YY..YY.", "YY....YY", "........"],
    "medal": [".RR..RR.", "..RRRR..", "...RR...", "..SSSS..", ".SSkSSS.", ".SSkSSS.", ".SSSSSS.", "..SSSS.."],
    "scroll": [".PPPPPP.", "PPPPPPPP", ".PkkkkP.", ".PPPPPP.", ".PkkkPP.", ".PPPPPP.", "PPPPPPPP", ".PPPPPP."],
    "flag": ["k.......", "kRRRRR..", "kRRWRRR.", "kRRRRR..", "kRRRRRR.", "k.......", "k.......", "k......."],
    "shield": [".GGGGGG.", "GGGGGGGG", "GGkGGkGG", "GGGkkGGG", ".GGGGGG.", "..GGGG..", "...GG...", "........"],
}
ICOL = {"k": INK, "R": RED, "W": "#ffffff", "B": CYAN, "Y": "#ffd166", "S": "#c0c0c8", "P": "#e9d8a6", "G": "#2fd36b"}


def character():
    W, H = 840, 420
    T = 8
    css = [
        f"@keyframes seg{{0%{{opacity:0}}3%,92%{{opacity:1}}100%{{opacity:0}}}}.sg{{animation:seg {T}s steps(1) infinite backwards}}",
        f"@keyframes sel{{0%,11%{{opacity:1}}12.5%,100%{{opacity:0}}}}.sl{{animation:sel {T}s steps(1) infinite;opacity:0}}",
        ".hp{animation:hp 1.2s steps(2) infinite}@keyframes hp{50%{opacity:.35}}",
        ".bob{animation:bob 1s steps(2) infinite}@keyframes bob{50%{transform:translateY(-3px)}}",
    ]
    b = [rect(0, 0, W, H, PAPER)]
    b.append(f'<defs><pattern id="tn" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1" fill="{INK}" opacity=".18"/></pattern></defs>')
    b.append(rect(0, 0, W, H, "url(#tn)"))
    # başlık
    b.append(rect(16, 16, W - 32, 34, INK))
    b.append(text(30, 39, "[ KARAKTER KARTI ]", 14, PAPER, weight="bold"))
    b.append(text(W - 30, 39, f"LVL {CONFIG['level']} · class: {CONFIG['class']}", 13, GREEN, anchor="end"))
    # can / mana barları
    b.append(text(30, 74, "HP", 12, INK, weight="bold"))
    for i in range(20):
        b.append(rect(56 + i * 9, 64, 7, 12, RED, 'class="hp"' if i == 19 else ""))
    b.append(text(250, 74, "MANA (çay)", 12, INK, weight="bold"))
    for i in range(20):
        b.append(rect(338 + i * 9, 64, 7, 12, CYAN if i < 14 else "#c9c9d1"))
    b.append(text(W - 30, 74, "STATUS: hunting", 12, RED, anchor="end", weight="bold"))

    # yetenekler (sol)
    lx, ly = 16, 92
    b.append(rect(lx, ly, 392, 250, "#fffdf7"))
    b.append(text(lx + 14, ly + 26, "YETENEKLER", 14, INK, weight="bold"))
    b.append(rect(lx + 14, ly + 32, 96, 2, RED))
    for i, (nm, lv) in enumerate(CONFIG["skills"]):
        y = ly + 62 + i * 38
        b.append(text(lx + 14, y, nm, 12, INK, weight="bold"))
        b.append(text(lx + 378, y, f"{lv}/10", 12, RED, anchor="end", weight="bold"))
        for s in range(10):
            sx = lx + 14 + s * 30
            b.append(f'<rect x="{sx}" y="{y + 6}" width="26" height="12" fill="none" stroke="{INK}" stroke-width="1.5"/>')
            if s < lv:
                d = 0.25 + i * 0.35 + s * 0.08
                b.append(f'<rect class="sg" x="{sx + 3}" y="{y + 9}" width="20" height="6" fill="{RED if s >= 7 else INK}" style="animation-delay:{d:.2f}s"/>')
    # envanter (sağ)
    rx, ry = 420, 92
    b.append(rect(rx, ry, 404, 250, "#fffdf7"))
    b.append(text(rx + 14, ry + 26, "ENVANTER // BAŞARIMLAR", 14, INK, weight="bold"))
    b.append(rect(rx + 14, ry + 32, 196, 2, RED))
    sw, sh = 92, 96
    for i, (ic, a, c) in enumerate(CONFIG["inventory"][:8]):
        col, row = i % 4, i // 4
        sx, sy = rx + 14 + col * (sw + 4), ry + 46 + row * (sh + 4)
        b.append(rect(sx, sy, sw, sh, "#ece7da"))
        b.append(f'<rect x="{sx}" y="{sy}" width="{sw}" height="{sh}" fill="none" stroke="{INK}" stroke-width="2"/>')
        b.append(f'<rect class="sl" x="{sx - 3}" y="{sy - 3}" width="{sw + 6}" height="{sh + 6}" fill="none" stroke="{RED}" stroke-width="3" style="animation-delay:{i * T / 8:.2f}s"/>')
        b.append(f'<g class="bob" style="animation-delay:-{i * .13:.2f}s">' + pixels(ICONS[ic], sx + 26, sy + 10, 5, ICOL) + "</g>")
        b.append(text(sx + sw / 2, sy + 66, a, fit(a, sw - 10, 11), INK, anchor="middle", weight="bold"))
        b.append(text(sx + sw / 2, sy + 82, c, fit(c, sw - 10, 10), "#6b6b78", anchor="middle"))
    # alet kemeri
    b.append(rect(16, 354, W - 32, 50, INK))
    b.append(text(30, 384, "ALET KEMERİ >", 13, RED, weight="bold"))
    x = 160
    for t in CONFIG["toolbelt"]:
        w = len(t) * 12 * CW + 18
        b.append(f'<rect x="{x}" y="366" width="{w:.0f}" height="26" fill="none" stroke="{GREEN}" stroke-width="1.5"/>')
        b.append(text(x + 9, 384, t, 12, GREEN))
        x += w + 8
    for f in [(lx, ly, 392, 250), (rx, ry, 404, 250)]:
        b.append(frame(*f))
    b.append(frame(1.5, 1.5, W - 3, H - 3))
    return svg(W, H, "Karakter kartı — yetenekler ve envanter", "".join(css), b)


# ════════════════════════════════════════════════════════════════════════
#  VERİ — GitHub + blog
# ════════════════════════════════════════════════════════════════════════
def http(url, data=None, headers=None):
    h = {"User-Agent": f"{USER}-readme", "Accept": "application/vnd.github+json"}
    if TOKEN and "api.github.com" in url:
        h["Authorization"] = f"Bearer {TOKEN}"
    h.update(headers or {})
    req = urllib.request.Request(url, data=data, headers=h)
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def fetch_github():
    q = """query($login:String!){user(login:$login){
      followers{totalCount}
      repositories(first:100,ownerAffiliations:OWNER,isFork:false,privacy:PUBLIC,orderBy:{field:PUSHED_AT,direction:DESC}){
        totalCount nodes{name description stargazerCount pushedAt primaryLanguage{name}}}
      contributionsCollection{contributionCalendar{totalContributions
        weeks{contributionDays{contributionCount contributionLevel}}}}}}"""
    body = json.dumps({"query": q, "variables": {"login": USER}}).encode()
    d = json.loads(http("https://api.github.com/graphql", body, {"Content-Type": "application/json"}))
    u = d["data"]["user"]
    repos = [r for r in u["repositories"]["nodes"] if r["name"].lower() != USER.lower()]
    lv = {"NONE": 0, "FIRST_QUARTILE": 1, "SECOND_QUARTILE": 2, "THIRD_QUARTILE": 3, "FOURTH_QUARTILE": 4}
    cal = u["contributionsCollection"]["contributionCalendar"]
    weeks = [[lv[x["contributionLevel"]] for x in w["contributionDays"]] for w in cal["weeks"]]
    return {
        "repos": [{"name": r["name"], "desc": r["description"] or "", "stars": r["stargazerCount"],
                   "lang": (r["primaryLanguage"] or {}).get("name", "—")} for r in repos[:4]],
        "repo_count": u["repositories"]["totalCount"],
        "stars": sum(r["stargazerCount"] for r in u["repositories"]["nodes"]),
        "followers": u["followers"]["totalCount"],
        "contrib": cal["totalContributions"],
        "weeks": weeks[-53:],
        "live": True,
    }


def sample_github():
    rnd = random.Random(23)
    weeks = [[min(4, max(0, int(rnd.gauss(1.4, 1.5)))) for _ in range(7)] for _ in range(53)]
    return {
        "repos": [
            {"name": "webrecon", "desc": "hafif web keşif + CVE eşleştirme aracı", "stars": 0, "lang": "Python"},
            {"name": "kement", "desc": "MCP client güven-sınırı test aracı", "stars": 0, "lang": "Python"},
            {"name": "deprem-radar", "desc": "gerçek zamanlı deprem haritası", "stars": 0, "lang": "JavaScript"},
            {"name": "kesen", "desc": "günlük sihirli kare bulmacası", "stars": 0, "lang": "JavaScript"},
        ],
        "repo_count": 0, "stars": 0, "followers": 0,
        "contrib": sum(map(sum, weeks)) * 3,
        "weeks": weeks, "live": False,
    }


def fetch_blog():
    base = CONFIG["blog_url"].rstrip("/")
    for path in CONFIG["blog_feeds"]:
        try:
            raw = http(base + path, headers={"Accept": "application/rss+xml, application/atom+xml, */*"})
            root = ET.fromstring(raw)
        except Exception:
            continue
        posts = []
        for it in root.iter():
            tag = it.tag.split("}")[-1]
            if tag in ("item", "entry"):
                t = next((c.text for c in it if c.tag.split("}")[-1] == "title"), None)
                if t:
                    posts.append(t.strip())
        if posts:
            return posts[:3]
    return []


def trunc(s, n):
    return s if len(s) <= n else s[: n - 1] + "…"


# ════════════════════════════════════════════════════════════════════════
#  KARE 4 — görev günlüğü (canlı veri)
# ════════════════════════════════════════════════════════════════════════
def quest_log(g, posts):
    W, H = 840, 360
    css = [
        "@keyframes in{0%{opacity:0;transform:translateX(-14px)}100%{opacity:1;transform:translateX(0)}}",
        ".in{animation:in .5s steps(5) both}",
        ".fk{animation:fk 2.6s infinite}@keyframes fk{0%,94%,100%{opacity:1}96%{opacity:.3}}",
        ".cb{animation:cb 1s steps(1) infinite}@keyframes cb{50%{opacity:0}}",
    ]
    b = [rect(0, 0, W, H, TERM)]
    b.append(f'<defs><pattern id="sl" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".3"/></pattern></defs>')
    b.append(rect(0, 0, W, 34, RED))
    b.append(text(16, 23, "第03話 · GÖREV GÜNLÜĞÜ", 14, "#ffffff", fixed=False, weight="bold"))
    now = dt.datetime.now(dt.timezone(dt.timedelta(hours=3)))
    stamp = f"son güncelleme {now:%Y-%m-%d %H:%M} TR" + ("" if g["live"] else " · örnek veri")
    b.append(text(W - 16, 23, stamp, 11, "#ffe5e7", anchor="end"))

    # son görevler
    b.append(text(20, 62, "SON GÖREVLER //", 13, GREEN, weight="bold"))
    for i, r in enumerate(g["repos"][:4]):
        y = 90 + i * 44
        d = f"animation-delay:{.2 + i * .15:.2f}s"
        nm = trunc(r["name"], 26)
        b.append(f'<g class="in" style="{d}">')
        b.append(text(20, y, "▸", 14, RED, fixed=False))
        b.append(text(38, y, nm, 14, "#e8e8ee", weight="bold"))
        meta = f"{r['lang']}  ★{r['stars']}"
        b.append(text(510, y, meta, 12, "#8fd9a8", anchor="end"))
        b.append(text(38, y + 18, trunc(r["desc"] or "—", 58), 11, "#6b776b"))
        b.append("</g>")
    # istatistik kutuları
    stats = [("REPO", g["repo_count"]), ("YILDIZ", g["stars"]), ("TAKİPÇİ", g["followers"]), ("KATKI/YIL", g["contrib"])]
    for i, (k, v) in enumerate(stats):
        c, r_ = i % 2, i // 2
        sx, sy = 540 + c * 144, 48 + r_ * 92
        b.append(f'<rect x="{sx}" y="{sy}" width="134" height="82" fill="#101710" stroke="{GREEN}" stroke-width="1.5"/>')
        for cx, cy in [(sx, sy), (sx + 128, sy), (sx, sy + 76), (sx + 128, sy + 76)]:
            b.append(rect(cx, cy, 6, 6, GREEN))
        b.append(text(sx + 67, sy + 50, str(v) if g["live"] else "—", 26, GREEN, anchor="middle", fixed=False, weight="bold", cls="fk"))
        b.append(text(sx + 67, sy + 70, k, 11, "#8fd9a8", anchor="middle"))
    # blog
    b.append(rect(16, 270, W - 32, 1, "#2a3a2a"))
    b.append(text(20, 294, "SON YAZILAR //", 13, GREEN, weight="bold"))
    host = CONFIG["blog_url"].split("//")[-1]
    if posts:
        x = 160
        for i, p in enumerate(posts[:3]):
            s = trunc(p, 30)
            b.append(f'<g class="in" style="animation-delay:{.9 + i * .15:.2f}s">{text(x, 294, "✎ " + s, 12, "#e8e8ee", fixed=False)}</g>')
            x += 225
        b.append(text(20, 330, f"> devamı: {host}", 12, "#6b776b"))
    else:
        b.append(text(160, 294, f"writeup'lar ve notlar → {host}", 12, "#e8e8ee"))
        b.append(text(20, 330, "> cat ./blog/latest.md", 12, "#6b776b"))
    b.append(f'<rect class="cb" x="{20 + 23 * 12 * CW + 4:.1f}" y="319" width="8" height="14" fill="{GREEN}"/>')
    b.append(rect(0, 0, W, H, "url(#sl)"))
    b.append(frame(1.5, 1.5, W - 3, H - 3))
    return svg(W, H, "Görev günlüğü — son repolar, istatistikler, blog", "".join(css), b)


# ════════════════════════════════════════════════════════════════════════
#  KARE 5 — İHA katkı grafiğini tarıyor
# ════════════════════════════════════════════════════════════════════════
DRONE = [
    ".......WW.......",
    "......WWWW......",
    "KKKKKKWWWWKKKKKK",
    ".KKKKKWRRWKKKKK.",
    "......WWWW......",
    ".......WW.......",
    "......KKKK......",
]


def drone(g):
    W, H = 840, 250
    T = 14.0
    cell, gap = 12, 3
    weeks = g["weeks"]
    n = len(weeks)
    x0 = (W - (n * (cell + gap) - gap)) // 2
    gy = 104
    span_from, span_to = -60, W + 20
    fly = 0.85
    css = [
        f"@keyframes fly{{0%{{transform:translateX({span_from}px)}}{fly * 100:.0f}%,100%{{transform:translateX({span_to}px)}}}}",
        f".dr{{animation:fly {T}s linear infinite}}",
        ".bm{animation:bm .15s steps(2) infinite}@keyframes bm{50%{opacity:.2}}",
        "@keyframes hit{4%{fill:#ffffff}7%{fill:#e63946}12%,90%{fill:#1b1b22}}",
        f".h{{animation:hit {T}s linear infinite backwards}}",
        ".sfx{animation:wob .4s steps(2) infinite}@keyframes wob{50%{transform:translateY(-3px)}}",
    ]
    for c in range(n):
        cx = x0 + c * (cell + gap) + cell / 2
        t_pass = (cx - 32 - span_from) / (span_to - span_from) * fly * T
        css.append(f".c{c}{{animation-delay:{t_pass - 0.04 * T:.2f}s}}")
    levels = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"]
    b = [rect(0, 0, W, H, "#0d1117")]
    b.append(text(20, 32, "第04話 · OPERASYON: KATKI GRAFİĞİ", 13, "#e8e8ee", fixed=False, weight="bold"))
    hits = sum(1 for w in weeks for v in w if v)
    b.append(text(W - 20, 32, f"{g['contrib']} katkı · {hits} hedef gün", 12, "#8fd9a8", anchor="end", fixed=False))
    for c, w in enumerate(weeks):
        for r, v in enumerate(w):
            x, y = x0 + c * (cell + gap), gy + r * (cell + gap)
            cls = f' class="h c{c}"' if v else ""
            b.append(f'<rect{cls} x="{x}" y="{y}" width="{cell}" height="{cell}" rx="2" fill="{levels[v]}"/>')
    # İHA
    b.append('<g class="dr">')
    b.append(f'<rect class="bm" x="29" y="68" width="6" height="{gy + 7 * (cell + gap) - 68}" fill="{RED}" opacity=".55"/>')
    b.append(pixels(DRONE, 0, 40, 4, {"W": "#d0d0d8", "K": "#8d8d97", "R": RED}))
    b.append("</g>")
    b.append(f'<g class="sfx">{text(W - 22, H - 16, "ズドン!", 14, RED, anchor="end", fixed=False, weight="bold")}</g>')
    b.append(text(20, H - 16, "devamı haftaya...  // her gün github actions ile yenilenir", 11, "#5c6670"))
    b.append(f'<rect x="1.5" y="1.5" width="{W - 3}" height="{H - 3}" fill="none" stroke="#30363d" stroke-width="3"/>')
    return svg(W, H, "İHA katkı grafiğini tarıyor", "".join(css), b)


# ════════════════════════════════════════════════════════════════════════
#  pixel butonlar
# ════════════════════════════════════════════════════════════════════════
def button(label):
    W = int(len(label) * 14 * CW + 70)
    H = 44
    css = ".ar{animation:ar .8s steps(2) infinite}@keyframes ar{50%{transform:translateX(4px)}}"
    b = [rect(4, 4, W - 4, H - 4, INK), rect(0, 0, W - 4, H - 4, PAPER),
         f'<rect x="1" y="1" width="{W - 6}" height="{H - 6}" fill="none" stroke="{INK}" stroke-width="2"/>',
         f'<g class="ar">{pixels(["R...", "RR..", "RRR.", "RR..", "R..."], 16, 10, 4, {"R": RED})}</g>',
         text(40, 26, label, 14, INK, weight="bold")]
    return svg(W, H, label, css, b)


# ════════════════════════════════════════════════════════════════════════
def main():
    OUT.mkdir(parents=True, exist_ok=True)
    try:
        g = fetch_github() if TOKEN else sample_github()
    except Exception as e:  # ağ / token sorunu → örnek veriyle devam
        print("github verisi alınamadı:", e)
        g = sample_github()
    try:
        posts = fetch_blog()
    except Exception as e:
        print("blog akışı alınamadı:", e)
        posts = []
    files = {
        "hero.svg": hero(),
        "ascii.svg": ascii_panel(),
        "character.svg": character(),
        "quest-log.svg": quest_log(g, posts),
        "drone.svg": drone(g),
    }
    for fn, lbl in CONFIG["buttons"]:
        files[f"{fn}.svg"] = button(lbl)
    for name, content in files.items():
        (OUT / name).write_text(content, encoding="utf-8")
        print(f"✓ assets/{name}  ({len(content) / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
