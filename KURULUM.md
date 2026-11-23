# Kurulum (2 dakika)

1. GitHub'da **`omertugrulbayram`** adında **public** bir repo aç (kullanıcı adınla aynı isim → profilinde görünür).
2. Bu klasördeki her şeyi (gizli `.github` klasörü dahil) repoya yükle ve `main` dalına pushla.
3. Repo → **Settings → Actions → General → Workflow permissions** → "Read and write permissions" seç.
4. **Actions** sekmesi → `readme-kareleri` → **Run workflow**. Görev günlüğü ve İHA karesi gerçek verilerinle dolar.
   Sonra her gün 06:17'de kendiliğinden yenilenir.

## Düzenleme
- Tüm yazılar, yetenek seviyeleri, başarımlar, alet kemeri: `scripts/generate.py` → `CONFIG`.
- Yerelde denemek için: `python scripts/generate.py` (token yoksa örnek veriyle üretir).
- LinkedIn linkini `README.md` içinde kendi profil adresine göre kontrol et.
- Blog yazıları için blogunun RSS/Atom adresi `CONFIG["blog_feeds"]` içinde olmalı
  (yoksa sadece site linki görünür).

## Kareler
| dosya | ne yapar |
|---|---|
| `hero.svg` | manga kapak: hız çizgileri, pixel hacker, kendi kendine yazan terminal |
| `ascii.svg` | katakana yağmuru, ASCII ÖMER BAYRAM, blok karakterli hacker |
| `character.svg` | RPG karakter kartı: yetenek barları + başarım envanteri |
| `quest-log.svg` | canlı: son repolar, yıldız/takipçi/katkı, son blog yazıları |
| `drone.svg` | canlı: katkı grafiğini tarayan pixel İHA |
