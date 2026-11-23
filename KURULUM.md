# Profil README — Apple soft tema

README.md ve `assets/` içindeki tüm kartlar `scripts/generate.py` ile üretilir.
GitHub Actions (`readme-kareleri`) her gün 06:17'de (TR) çalışır, sayıları ve katkı ızgarasını yeniler.

## Düzenleme
- Yazılar, etiketler, bağlantılar, projeler, başarımlar: `scripts/generate.py` → `CONFIG`.
- README.md'yi elle düzenleme; ertesi gün üretici üzerine yazar.
- Yerelde denemek için: `python scripts/generate.py` (token yoksa örnek veriyle üretir).

## Kartlar (her biri `-light` ve `-dark` olarak, GitHub temasına göre otomatik seçilir)
| dosya | ne |
|---|---|
| `hero` | ad, unvan, etiketler; arkada yavaşça kayan pastel renkler |
| `btn-*` | bağlantı düğmeleri |
| `h-*` | bölüm başlıkları |
| `p0`–`p5` | proje kartları (dil ve yıldız canlı) |
| `activity` | son 26 hafta katkı ızgarası + katkı/repo/yıldız/takipçi |
| `awards` | başarımlar listesi |
