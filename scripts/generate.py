#!/usr/bin/env python3
"""
omertugrulbayram // profil README üreticisi (Apple soft tema)
-------------------------------------------------------------
README.md'yi ve assets/ içindeki tüm kartları (açık + koyu tema SVG) üretir.

  python scripts/generate.py      # GITHUB_TOKEN varsa canlı veri, yoksa örnek veri

Sadece Python standart kütüphanesi. GitHub Actions her gün çalıştırır.
Yazıları, projeleri, başarımları değiştirmek için aşağıdaki CONFIG'i düzenle
(README.md de buradan üretilir; elle düzenleme ertesi gün silinir).
"""
import html
import json
import os
import random
import urllib.request
from pathlib import Path

USER = os.environ.get("GH_USER", "omertugrulbayram")
TOKEN = os.environ.get("GITHUB_TOKEN", "")
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets"

# ════════════════════════════════════════════════════════════════════════
#  CONFIG — burayı düzenle
# ════════════════════════════════════════════════════════════════════════
CONFIG = {
    "eyebrow": "Güvenlik Araştırmacısı",
    "name": "Ömer Bayram",
    "tagline": "Web, bulut ve yapay zekâ sistemlerinde açık arıyorum.",
    "tags": ["Web Güvenliği", "LLM Red Team", "Bug Bounty", "CTF", "MCP"],
    "place": "Sakarya, Türkiye  ·  SUBÜ Bilişim Güvenliği",
    "links": [  # (yazı, adres) — ilki mavi ana düğme olur
        ("Blog", "https://omertugrulbayram.com"),
        ("LinkedIn", "https://www.linkedin.com/in/omertugrulbayram"),
        ("X", "https://twitter.com/0m3rb4yr4m"),
        ("Kaggle", "https://kaggle.com/merturulbayram"),
    ],
    "projects": [  # (görünen ad, repo adı, kısa açıklama ≤ 46 karakter, renk)
        ("SCQL", "SCQL", "Hedef bilgisi, port ve sürüm tarama aracı", "blue"),
        ("ctf-writeups", "ctf-writeups", "TryHackMe ve Hack The Box çözüm notları", "indigo"),
        ("BugBountyTool", "BugBountyTool", "Temel bug bounty tarama aracı", "orange"),
        ("Mühür", "muhur", "TEKNOFEST 2026 · sosyal ağ güven katmanı", "green"),
        ("Astrovia", "nasa-space-app-project-astrovia", "NASA Space Apps 2025 · asteroit tespiti", "purple"),
        ("deprem-radar", "deprem-radar", "Türkiye canlı deprem haritası", "red"),
    ],
    "awards": [  # (ikon, başlık, alt yazı, renk)
        ("bug", "Bug Bounty", "HackerOne · Bugcrowd · BugBounter", "red"),
        ("rocket", "NASA Space Apps", "Global aday", "indigo"),
        ("trophy", "BiP Night", "1. sıra", "orange"),
        ("star", "Voyager Challenge", "1. sıra", "yellow"),
        ("medal", "Çözüm Sende", "2. sıra", "teal"),
        ("doc", "SEAL", "ISAS 2026 bildirisi", "blue"),
        ("flag", "Bayrak Sende", "4. sıra", "pink"),
        ("shield", "MCP güvenlik araştırması", "Devam ediyor", "green"),
    ],
    "heat_weeks": 26,
}

# ── tema ────────────────────────────────────────────────────────────────
FONT = ("-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text',"
        "'Segoe UI Variable Display','Segoe UI','Helvetica Neue',Inter,Roboto,Arial,sans-serif")

THEMES = {
    "light": dict(card="#f5f5f7", text="#1d1d1f", sub="#6e6e73", ter="#86868b", line="#dcdce1",
                  accent="#0071e3", pill="#ffffff", pill_line="#e3e3e8", btn2="#e8e8ed",
                  heat=["#e6e6eb", "#c6dbf7", "#8fbdf3", "#4194ec", "#0071e3"],
                  blobs=["#a9d2ff", "#d9c6ff", "#ffd3de"], blob_op=0.95),
    "dark": dict(card="#1c1c1e", text="#f5f5f7", sub="#a1a1a6", ter="#8e8e93", line="#353538",
                 accent="#2997ff", pill="#2c2c2e", pill_line="#3a3a3c", btn2="#2c2c2e",
                 heat=["#2c2c2e", "#15375f", "#1d5aa0", "#2f80e0", "#5aa9ff"],
                 blobs=["#1d4f91", "#47307d", "#6a2c48"], blob_op=0.6),
}

# Apple sistem renkleri (açık ton, koyu ton) — kart ikonlarında degrade
COLORS = {
    "blue": ("#5ac8fa", "#007aff"), "indigo": ("#8e8cf0", "#5856d6"),
    "purple": ("#d68cf2", "#af52de"), "pink": ("#ff7aa0", "#ff2d55"),
    "red": ("#ff8a80", "#ff3b30"), "orange": ("#ffc061", "#ff9500"),
    "yellow": ("#ffe066", "#ffb800"), "green": ("#7ee08f", "#34c759"),
    "teal": ("#7ad7e6", "#30b0c7"),
}

# 24x24 çizgi ikonlar (SF Symbols havasında)
ICONS = {
    "bug": "M8 10a4 4 0 0 1 8 0v4a4 4 0 0 1-8 0z M12 10v8 M8 13H4 M20 13h-4 M8 17l-3 2 M16 17l3 2 "
           "M8 10L5 8 M16 10l3-2 M10 6.5L9 4 M14 6.5L15 4",
    "rocket": "M12 3c3 2.5 4.5 6.5 3.6 11H8.4C7.5 9.5 9 5.5 12 3z M8.4 14L5.5 17l3 .8 M15.6 14l2.9 3-3 .8 "
              "M10.5 18l1.5 3 1.5-3 M12 9.5h.01",
    "trophy": "M7 4h10v5a5 5 0 0 1-10 0z M7 6H4.5v1a3 3 0 0 0 3 3 M17 6h2.5v1a3 3 0 0 1-3 3 M12 14v4 M8 21h8 M9.5 18h5",
    "star": "M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z",
    "medal": "M7 15a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M8 3l3 7 M16 3l-3 7 M12 13v4",
    "doc": "M7 3h7l4 4v14H7z M14 3v4h4 M10 12h5 M10 16h5",
    "flag": "M6 21V4 M6 4h11l-2.2 4 2.2 4H6",
    "shield": "M12 3l7 3v5c0 5-3 8.2-7 10-4-1.8-7-5-7-10V6z M9 12l2.2 2.2L15.5 10",
}

BASE_CSS = (
    ".t{font-family:%s}"
    "@media (prefers-reduced-motion:reduce){*{animation:none!important}}" % FONT
)


# ── yardımcılar ─────────────────────────────────────────────────────────
def esc(s):
    return html.escape(str(s), quote=True)


def svg(w, h, title, body, css=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" '
            f'role="img" aria-label="{esc(title)}" fill="none">\n<title>{esc(title)}</title>\n'
            f"<style>{BASE_CSS}{css}</style>\n" + "\n".join(body) + "\n</svg>\n")


def text(x, y, s, size, fill, weight=400, anchor="start", ls=0, cls="", delay=None):
    st = f' style="animation-delay:{delay}s"' if delay is not None else ""
    c = f"t {cls}".strip()
    return (f'<text class="{c}" x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" '
            f'text-anchor="{anchor}" letter-spacing="{ls}"{st}>{esc(s)}</text>')


def tw(s, size, weight=400):
    """yaklaşık metin genişliği (orantılı font)"""
    k = 0.56 if weight >= 600 else 0.53
    return len(s) * size * k


def trunc(s, n):
    return s if len(s) <= n else s[: n - 1].rstrip() + "…"


def num(n):
    return f"{n:,}".replace(",", ".")


def tile(x, y, size, color, gid, inner):
    a, b = COLORS[color]
    r = size * 0.24
    return (f'<defs><linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient></defs>'
            f'<rect x="{x}" y="{y}" width="{size}" height="{size}" rx="{r}" fill="url(#{gid})"/>' + inner)


def icon(name, cx, cy, scale):
    o = 12 * scale
    return (f'<path d="{ICONS[name]}" transform="translate({cx - o:.1f} {cy - o:.1f}) scale({scale})" '
            f'stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>')


# ════════════════════════════════════════════════════════════════════════
#  kartlar
# ════════════════════════════════════════════════════════════════════════
def hero(T):
    W, H = 840, 340
    b = T["blobs"]
    body = [
        "<defs>",
        f'<clipPath id="c"><rect width="{W}" height="{H}" rx="28"/></clipPath>',
        *[f'<radialGradient id="g{i}"><stop offset="0" stop-color="{c}" stop-opacity="{T["blob_op"]}"/>'
          f'<stop offset="1" stop-color="{c}" stop-opacity="0"/></radialGradient>' for i, c in enumerate(b)],
        "</defs>",
        f'<rect width="{W}" height="{H}" rx="28" fill="{T["card"]}"/>',
        '<g clip-path="url(#c)">',
        '<circle class="b1" cx="690" cy="96" r="250" fill="url(#g0)"/>',
        '<circle class="b2" cx="560" cy="320" r="220" fill="url(#g1)"/>',
        '<circle class="b3" cx="830" cy="300" r="200" fill="url(#g2)"/>',
        "</g>",
        text(56, 98, CONFIG["eyebrow"], 17, T["accent"], 600),
        text(54, 166, CONFIG["name"], 64, T["text"], 700, ls=-1.8),
        text(56, 210, CONFIG["tagline"], 21, T["sub"], 400, ls=-0.2),
    ]
    x, y = 56, 238
    pills = []
    for t in CONFIG["tags"]:
        w = tw(t, 14, 600) + 30
        pills.append(f'<rect x="{x:.0f}" y="{y}" width="{w:.0f}" height="34" rx="17" fill="{T["pill"]}" '
                     f'fill-opacity="0.78" stroke="{T["pill_line"]}"/>')
        pills.append(text(round(x + w / 2), y + 22, t, 14, T["text"], 600, anchor="middle"))
        x += w + 8
    body += pills
    body.append(text(56, 306, CONFIG["place"], 14, T["ter"], 400))
    css = (
        "@keyframes d1{50%{transform:translate(-40px,26px)}}"
        "@keyframes d2{50%{transform:translate(36px,-22px)}}"
        "@keyframes d3{50%{transform:translate(-26px,-30px)}}"
        ".b1{animation:d1 16s ease-in-out infinite}.b2{animation:d2 19s ease-in-out infinite}"
        ".b3{animation:d3 22s ease-in-out infinite}"
    )
    return svg(W, H, f'{CONFIG["name"]} — {CONFIG["eyebrow"]}', body, css)


def heading(T, title, subtitle):
    W, H = 840, 104
    return svg(W, H, title, [
        text(W // 2, 52, title, 34, T["text"], 700, anchor="middle", ls=-0.8),
        text(W // 2, 84, subtitle, 17, T["sub"], 400, anchor="middle"),
    ])


def button(T, label, primary):
    w = round(tw(label, 15, 600) + 48)
    fill, fg = (T["accent"], "#ffffff") if primary else (T["btn2"], T["text"])
    return svg(w, 44, label, [
        f'<rect width="{w}" height="44" rx="22" fill="{fill}"/>',
        text(w / 2, 28, label, 15, fg, 600, anchor="middle"),
    ])


def project(T, i, p, meta):
    W, H = 410, 132
    name, _repo, desc, color = p
    lang, stars = meta.get("lang"), meta.get("stars", 0)
    info = " · ".join(x for x in [lang, f"★ {stars}" if stars else None] if x) or "GitHub"
    body = [
        f'<rect width="{W}" height="{H}" rx="22" fill="{T["card"]}"/>',
        tile(24, 24, 44, color, f"p{i}", text(46, 54, name[0].upper(), 21, "#fff", 700, anchor="middle")),
        text(84, 43, trunc(name, 24), 18, T["text"], 600, ls=-0.2),
        text(84, 63, info, 13, T["ter"]),
        text(386, 42, "↗", 17, T["ter"], 500, anchor="end"),
        text(24, 104, trunc(desc, 46), 14, T["sub"]),
    ]
    return svg(W, H, f"{name} — {desc}", body)


def activity(T, g):
    W, H = 840, 224
    weeks = g["weeks"][-CONFIG["heat_weeks"]:]
    LW = 540
    pitch, cell = 18, 14
    gx = 28 + (LW - 56 - (len(weeks) * pitch - (pitch - cell))) / 2
    body = [
        f'<rect width="{LW}" height="{H}" rx="24" fill="{T["card"]}"/>',
        text(28, 44, "Katkılar", 17, T["text"], 600),
        text(LW - 28, 44, f'son {len(weeks)} hafta', 13, T["ter"], anchor="end"),
    ]
    for wi, week in enumerate(weeks):
        for di, lv in enumerate(week):
            body.append(f'<rect x="{gx + wi * pitch:.1f}" y="{70 + di * pitch}" width="{cell}" height="{cell}" '
                        f'rx="4" fill="{T["heat"][lv]}"/>')
    RX = LW + 16
    body.append(f'<rect x="{RX}" width="{W - RX}" height="{H}" rx="24" fill="{T["card"]}"/>')
    stats = [(g["contrib"], "katkı · son 1 yıl"), (g["repo_count"], "açık repo"),
             (g["stars"], "yıldız"), (g["followers"], "takipçi")]
    for k, (v, lab) in enumerate(stats):
        x = RX + 28 + (k % 2) * 136
        y = 88 + (k // 2) * 84
        body.append(text(x, y, num(v), 32, T["accent"] if k == 0 else T["text"], 700, ls=-0.8))
        body.append(text(x, y + 24, lab, 13, T["sub"]))
    return svg(W, H, "GitHub katkıları ve sayılar", body)


def awards(T):
    items = CONFIG["awards"]
    rows = (len(items) + 1) // 2
    W, RH, PAD = 840, 76, 10
    H = PAD * 2 + rows * RH
    body = [f'<rect width="{W}" height="{H}" rx="24" fill="{T["card"]}"/>',
            f'<line x1="420" y1="{PAD + 18}" x2="420" y2="{H - PAD - 18}" stroke="{T["line"]}"/>']
    for k, (ic, title, sub, color) in enumerate(items):
        col, row = k % 2, k // 2
        x, y = col * 420, PAD + row * RH
        if row > 0:
            body.append(f'<line x1="{x + 84}" y1="{y}" x2="{x + 420 - 24}" y2="{y}" stroke="{T["line"]}"/>')
        body.append(tile(x + 28, y + 18, 40, color, f"a{k}", icon(ic, x + 48, y + 38, 0.95)))
        body.append(text(x + 84, y + 36, trunc(title, 30), 16, T["text"], 600, ls=-0.1))
        body.append(text(x + 84, y + 57, trunc(sub, 38), 13, T["sub"]))
    return svg(W, H, "Başarımlar", body)


# ════════════════════════════════════════════════════════════════════════
#  veri
# ════════════════════════════════════════════════════════════════════════
def http(url, data=None, headers=None):
    h = {"User-Agent": "profile-readme-generator", **(headers or {})}
    if TOKEN and "api.github.com" in url:
        h["Authorization"] = f"bearer {TOKEN}"
    req = urllib.request.Request(url, data=data, headers=h)
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def fetch_github():
    aliases = "\n".join(
        f'r{i}: repository(owner:$login, name:"{p[1]}"){{stargazerCount primaryLanguage{{name}}}}'
        for i, p in enumerate(CONFIG["projects"]))
    q = f"""query($login:String!){{
      user(login:$login){{
        followers{{totalCount}}
        repositories(first:100,ownerAffiliations:OWNER,isFork:false,privacy:PUBLIC){{
          totalCount nodes{{stargazerCount}}}}
        contributionsCollection{{contributionCalendar{{totalContributions
          weeks{{contributionDays{{contributionLevel}}}}}}}}}}
      {aliases}
    }}"""
    body = json.dumps({"query": q, "variables": {"login": USER}}).encode()
    d = json.loads(http("https://api.github.com/graphql", body, {"Content-Type": "application/json"}))["data"]
    u = d["user"]
    lv = {"NONE": 0, "FIRST_QUARTILE": 1, "SECOND_QUARTILE": 2, "THIRD_QUARTILE": 3, "FOURTH_QUARTILE": 4}
    cal = u["contributionsCollection"]["contributionCalendar"]
    weeks = [[lv[x["contributionLevel"]] for x in w["contributionDays"]] for w in cal["weeks"]]
    meta = []
    for i in range(len(CONFIG["projects"])):
        r = d.get(f"r{i}") or {}
        meta.append({"stars": r.get("stargazerCount", 0), "lang": (r.get("primaryLanguage") or {}).get("name")})
    return {
        "repo_count": u["repositories"]["totalCount"],
        "stars": sum(r["stargazerCount"] for r in u["repositories"]["nodes"]),
        "followers": u["followers"]["totalCount"],
        "contrib": cal["totalContributions"],
        "weeks": weeks,
        "meta": meta,
    }


def sample_github():
    rnd = random.Random(23)
    weeks = [[min(4, max(0, int(rnd.gauss(1.2, 1.4)))) for _ in range(7)] for _ in range(53)]
    return {"repo_count": 0, "stars": 0, "followers": 0, "contrib": 0, "weeks": weeks,
            "meta": [{"stars": 0, "lang": None} for _ in CONFIG["projects"]]}


# ════════════════════════════════════════════════════════════════════════
#  README
# ════════════════════════════════════════════════════════════════════════
def pic(name, alt, width=None):
    w = f' width="{width}"' if width else ""
    return (f'<picture><source media="(prefers-color-scheme: dark)" srcset="assets/{name}-dark.svg">'
            f'<img src="assets/{name}-light.svg"{w} alt="{esc(alt)}"></picture>')


def readme():
    L = ['<!--',
         '  omertugrulbayram // profil README',
         "  Bu dosya scripts/generate.py ile üretilir — elle düzenleme, CONFIG'i değiştir.",
         '-->',
         '<div align="center">', '',
         pic("hero", f'{CONFIG["name"]} — {CONFIG["eyebrow"]}. {CONFIG["tagline"]}', "100%"), '',
         "&nbsp;".join(f'<a href="{esc(u)}">{pic(f"btn-{i}", lab)}</a>'
                       for i, (lab, u) in enumerate(CONFIG["links"])), '',
         '<br>', '',
         pic("h-projeler", "Projeler", "100%"), '']
    projs = CONFIG["projects"]
    for i in range(0, len(projs), 2):
        L.append("&nbsp;".join(
            f'<a href="https://github.com/{USER}/{projs[j][1]}">'
            f'{pic(f"p{j}", f"{projs[j][0]} — {projs[j][2]}", "49%")}</a>'
            for j in range(i, min(i + 2, len(projs)))))
        L.append('')
    L += ['<br>', '',
          pic("h-aktivite", "Bu yıl", "100%"), '',
          pic("activity", "GitHub katkıları ve sayılar", "100%"), '',
          '<br>', '',
          pic("h-basarimlar", "Başarımlar", "100%"), '',
          pic("awards", "Başarımlar: " + ", ".join(f"{a[1]} ({a[2]})" for a in CONFIG["awards"]), "100%"), '',
          '</div>', '']
    return "\n".join(L)


def main():
    try:
        g = fetch_github() if TOKEN else sample_github()
    except Exception as e:  # ağ/token sorunu → örnek veri
        print("GitHub verisi alınamadı, örnek veri:", e)
        g = sample_github()
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob("*.svg"):
        old.unlink()
    for mode, T in THEMES.items():
        files = {
            "hero": hero(T),
            "h-projeler": heading(T, "Projeler", "Üzerinde çalıştığım ve yayımladığım işler."),
            "h-aktivite": heading(T, "Bu yıl", "GitHub'daki hareketim, her gün kendiliğinden yenilenir."),
            "h-basarimlar": heading(T, "Başarımlar", "Yarışmalar, programlar ve araştırmalar."),
            "activity": activity(T, g),
            "awards": awards(T),
        }
        for i, (lab, _u) in enumerate(CONFIG["links"]):
            files[f"btn-{i}"] = button(T, lab, i == 0)
        for i, p in enumerate(CONFIG["projects"]):
            files[f"p{i}"] = project(T, i, p, g["meta"][i])
        for name, content in files.items():
            (OUT / f"{name}-{mode}.svg").write_text(content, encoding="utf-8")
    (ROOT / "README.md").write_text(readme(), encoding="utf-8")
    print(f"{len(list(OUT.glob('*.svg')))} kart + README.md üretildi.")


if __name__ == "__main__":
    main()
