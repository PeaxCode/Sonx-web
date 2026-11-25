# Sonx Web — Test bulguları uygulama planı (23 Kasım 2026)

Kaynak: `Sonx Web_ Test Bulguları ve Yapılacaklar.xlsx` (57 madde, 6 karar, 3 açık soru).
Çalışma dalı: `dev` (dev.getsonx.com). **main'e / canlıya çıkılmıyor.**

## Ortam gerçeği (önemli)

- dev.getsonx.com ve canlı site **aynı Supabase projesini** (`dfsxnkfdnyubcigcrycn`) kullanıyor; mobil uygulama da aynı.
  Backend (Edge Functions, migration, secrets) için ayrı bir "dev" yok: deploy = canlı.
  → Backend işleri kodlanır ve test edilir, **deploy öncesi onay alınır**.
- Paddle sandbox hesabı Sonx, Roasy, VoxScan, Bluewex ile ortak. Hesap geneli ayarlar (indirim alanı, ödeme yöntemleri)
  diğer ürünleri de etkiler → mümkünse checkout çağrısında ürün bazlı çözülür.

## Adım 1 — Ödeme ve kredi: durum tespiti

| Kod | Durum | Not |
|---|---|---|
| O2 kredi yazılmıyor | Düzeltme 22 Kas 12:50 UTC'de canlıda (paddle-webhook v4, `PADDLE_ALLOW_SANDBOX_GRANTS`) | Testteki tek Sonx sandbox kredi alımları 09:31 ve 09:57 UTC, yani düzeltmeden **önce**. Webhook ayarı (ntfset_01m81m…) da sonradan kuruldu. **Yeniden test gerekli.** |
| O3 çift kredi | Düzeltme canlıda (migration 20261122 + provider-proxy) | Yeniden test gerekli. |
| O1 pencere kapanmıyor | Web'de düzeltildi (55cf40c) | dev'e deploy durumu teyit edilmeli. |
| O7 sessiz zaman aşımı | Web'de düzeltildi (55cf40c) | "Ekibe uyarı" şu an sadece GA event'i (purchase_not_received). |
| G7 adet seçici | Paddle fiyatlarında adet max=1 yapılmış | İndirim alanı: checkout'ta `showAddDiscounts: false`. |
| O4 Apple/Google Pay | Apple Pay açık ama getsonx.com alan adı doğrulanmamış; Google Pay kapalı | Paddle panel ayarı + alan adı doğrulaması → onay gerekli. |

## Uygulama sırası

### Parti 1 — Sadece web, karar gerektirmeyen (şimdi)
- [x] G7 indirim alanını gizle (`showAddDiscounts: false`)
- [x] G3 ana sayfadan tek tıkla üretim (taslak geri yüklemede eski state ile submit hatası)
- [x] G2 uzun başlık Create'i taşırıyor (grid `minmax(0,1fr)`)
- [x] T1 MP3 indirme: aynı origin üzerinden `Content-Disposition` ile, dosya adı = başlık
- [x] A1 GA4 huni event'leri (create_click, signin_modal_open, signin_complete, paywall_view, plan_click, checkout_start, checkout_closed, purchase, credit_pack_purchase)
- [x] M5 + U2 mobil üst bar (logo + Pricing/Upgrade), mobil "Save" rozeti
- [x] M2 canlıda Explore gizli (env bayrağı), S1 yayın kontrol listesi
- [x] F1 stil kartı / Surprise me türü de seçsin
- [x] G5 şarkı hazır bildirimi, süre ifadesi "1 to 3 minutes"
- [x] G1/K3 App Store abonesine gerçek planı + açıklama
- [x] M4 rozet oranı plan bazlı, M6 güven satırı plan kartlarının altına, M7 Pricing footer + CTA, M8 kredi bölümünde yükseltme satırı
- [x] S2 blog CTA'ları /create, blog menüsüne Pricing; S3 Create başlığı; S5 meta/alt/og:url; F5 QR metni
- [x] F3 markalı 404, L4 /signup /signin → /login + geri linki, L3 tek ifade, L5 Follow girişe bağlı
- [x] T2 hesap silme: DELETE yazarak onay (web); T3 şarkı silme tasarımlı onay
- [x] G10 hesap sayfasında yenilenme tarihi, sade ifade; G12 Voice pasif; G14 küçükler

Parti 1 notları: G14'ten Library tarihleri, görünür favori ve "Write lyrics" geri alması yapıldı; aboneye ana sayfada pazarlama içeriği ve G11 gerçek ilerleme ekranı K1 ile birlikte ele alınacak.

### Parti 2 — Backend gerektiren (kod + test, deploy onayla)
- [ ] G13 prompt 500 karakter sınırı sunucuda
- [ ] F2/G9 başlığı model üretsin
- [ ] G6 sanatçı adı uyarısı/filtresi
- [ ] T2 hesap silinirken Paddle aboneliği iptali (delete-account)
- [ ] O7 ekibe uyarı (sunucu tarafı)

### Parti 3 — Karar/kapsam bekleyen (açık sorular)
- [ ] K1/M1 ücretsiz aylık 1 şarkı — Açık soru 1 (ay başı mı kayıt tarihi mi?)
- [ ] K2/M3 tek şarkı sayısı, tek kredi fiyatı — Açık soru 2 (her şarkı 10 kredi mi?) + mobil uygulama
- [ ] K4 e-posta ile kayıt (magic link) — Supabase Auth ayarı
- [ ] T4 auth.getsonx.com — Supabase Custom Domain (ücretli eklenti)
- [ ] O4 Apple/Google Pay — Paddle panel
- [ ] A2 Meta/TikTok piksel — piksel ID'leri, A3 çerez onayı
- [ ] G4/S4 paylaşım ve herkese açık şarkı sayfası (faz 2)
- [ ] M9 gerçek örnek şarkılar (içerik), M10 Terms kredi maddesi (metin onayı)
- [ ] S6 SSR fiyat, S7 Product/Offer şeması, S8 Blog/Journal isim birliği

### Yeniden test edilecekler (kod değişikliği olmadan)
O1, O2, O3, O7, G7 (adet), M11 (giriş sonrası checkout'un otomatik açılması — kod var: use-checkout resume).

## 23 Kasım — Parti 2 (backend deploy edildi) ve akış iyileştirmeleri

Kararlar: K2 tek kredi fiyatı = her şarkı 10 kredi (sadece text-to-song var). Açık soru 3: web abonesi planını
uygulamada görür, aboneliği web'den yönetir. Açık soru 1 (Excel'deki "ay sonunda yanar"): ücretsiz şarkı takvim ayı (UTC).

Backend (provider-proxy v28, delete-account v8, eachlabs-webhook v9 — canlıda):
- [x] K2 tek şarkı havuzu (PROMPT+LYRICS → LYRICS_MUSIC sayacı): Haftalık 10, Pro 60, Yıllık 350, Studio 200
- [x] Kredi: her şarkı 10
- [x] K1 ücretsiz hesaba ayda 1 şarkı, doğrulanmış e-posta şartı (anonim hesaplar hariç)
- [x] G13 typed prompt 500 karakter, lyrics konusu 600
- [x] G6 sanatçı taklidi isteyen prompt'lar reddediliyor (artist_reference)
- [x] T2 hesap silinirken Paddle aboneliği iptal (PADDLE_API_KEY / PADDLE_SANDBOX_API_KEY secret'ı gerekiyor)

Web (rakip araştırması: Suno, Udio, Mozart AI, Mureka):
- [x] Girişsiz Create → doğrudan kayıt penceresi, taslak korunur, kayıt sonrası şarkı otomatik başlar (sahte ilerleme kaldırıldı)
- [x] Paywall'dan ödeme → şarkı aynı sayfada, plan/kredi hesaba düşünce otomatik başlar
- [x] Ücretsiz hesapta indirme kilitli → paywall ("MP3 downloads come with a plan")
- [x] Tek şarkı sayısı her yerde (kartlar, hesap çubuğu, kredi paketleri); Free kartı "1 song a month"
- [x] Sidebar'da kalan şarkı + her zaman görünen Upgrade; rozetler "Most popular" / "Best value"
- [x] K4 e-posta ile şifresiz giriş (Supabase SMTP ve Redirect URL ayarları kontrol edilmeli)

Mobil uygulamada yapılması gerekenler (uygulama sürümü gerektirir):
- constants/BillingConfig.ts: tek şarkı sayısı (5+5 → 10 vb.), PROMPT_MUSIC 13 → 10 kredi
- Ücretsiz hesap için aylık 1 şarkı (sunucu artık izin veriyor; uygulama yerel olarak engelliyor olabilir)
- Web aboneliği olan kullanıcıda "Manage subscription" Paddle portalına gitmeli (RevenueCat management_url)

## 23 Kasım — Parti 3

Kararlar: Apple Pay / Google Pay ve Meta / TikTok pikselleri şimdilik yok. auth.getsonx.com ve
Supabase SMTP / Redirect URL ayarları Supabase Pro'ya kadar varsayılan kalıyor.

Web (dev'de):
- [x] Next.js 16.4.3 → 16.4.6 güvenlik yükseltmesi (npm audit: 0 production açığı)
- [x] Sonx checkout sayfası (/checkout?price=…): bizim özetimiz + Paddle inline one-page formu, canlı vergi/toplam,
      aylık/yıllık geçişi, sayfada kayıt, engelli durumlar için net yönlendirme
- [x] Paylaşım butonu + herkese açık şarkı sayfası /song/<id> (G4, S4) — migration bekliyor
- [x] Fiyatlar sunucu HTML'inde (USD liste fiyatı) + Product/Offer şeması (S6, S7)
- [x] Çerez onayı: Consent Mode v2, AB/UK/CH/TR'de onaysız analitik kapalı (A3)
- [x] Terms: kredi paketleri, aylık ücretsiz şarkı, paylaşılan linkler (M10)

Backend (24 Kasım'da teyit edildi: canlıda):
- [x] supabase/migrations/20261123000000_free_song_claims_and_sharing.sql uzak veritabanında uygulanmış
- [x] provider-proxy v33 (23 Kas 13:07 UTC, son commit d0e5fe8'den sonra): aynı e-postaya ayda tek ücretsiz şarkı
- [x] PADDLE_SANDBOX_API_KEY secret'ı var (sandbox'ta hesap silinince web aboneliği iptali)
- [ ] PADDLE_API_KEY (canlı) secret'ı yok → canlı Paddle'a geçmeden önce eklenmeli

Excel'le karşılaştırma notları (24 Kasım):
- F2/G9: model değil, sezgisel başlık (src/lib/titles.ts) + söz yazarının başlığı; "Pop track" artık sadece son çare.
- S8: menü ve footer ikisi de "Blog"; statik blog sayfalarının `<title>`'ı hâlâ "Sonx Journal" ve tasarımları uygulamadan farklı.
- U3 (Create sağ kolon/alt kısım boş) ve G11 birlikte ele alınabilir: sağ kolonun başında gerçek üretim kartı.

Hâlâ açık: M9 gerçek örnek şarkılar (içerik), F4 Explore gerçek veriyle,
ücretsiz şarkı dosyasının tam kilitlenmesi (imzalı URL), mobil uygulama güncellemesi.

## 24 Kasım

- [x] Yeniden testler: O1, O2, O3, O7, G7, M11 test edildi, çalışıyor (Google Sheet'te "Bitti").
- [x] G11 + U3 (PR #3, dev'e birleşti): Create'te gerçek aşamalı "Now making" kartı ve listenin altında fikir kartları.
      Tasarım: docs/superpowers/specs/2026-11-24-create-progress-design.md
- Takip tablosu: Google Sheet "Sonx Web: Test Bulguları ve Yapılacaklar" (Durum/Not sütunları güncel).
- Açık: M9, F4, S8 (blog sayfası başlıkları "Sonx Journal"), G14 (aboneye ana sayfada pazarlama içeriği).
- Ertelenen küçükler: şarkı başlarken seçilen fikir form sıfırlanınca siliniyor; "Made in" süresi söz yazma saniyelerini içermiyor.
