# PANTAU — Dashboard Pantauan Langsung

Satu halaman, sebelas pantauan langsung dari sumber publik (semua sumber dipilih
karena API-nya mengizinkan dibaca dari browser — terbukti dengan header CORS):

- **Sky Radar Indonesia** — lalu lintas jaringan penerbangan virtual VATSIM di atas Indonesia, peta canvas live (API ADS-B pesawat asli tidak mengirim header CORS, jadi radar asli ditautkan ke globe.adsb.lol)
- **Asteroid Watch** — NASA NeoWs: lintasan dekat Bumi 7 hari, label potensi berbahaya
- **Satelit di Atas Rumahmu** — TLE CelesTrak (via ivanstanojevic.me) + propagasi satellite.js di browser; satelit di atas horizon + countdown lintasan ISS berikutnya
- **Detak Jantung Matahari** — NOAA SWPC: angin matahari, indeks Kp, flare sinar-X, alert
- **Mesin Waktu Internet** — arsip web Arquivo.pt: satu screenshot per tahun untuk URL apa pun
- **Udara Indonesia** — AQI 12 kota dari Open-Meteo (CAMS), warning kota merah
- **Golden Hour Countdown** — hitungan lokal posisi matahari (NOAA) + fase bulan
- **Musik Baru Minggu Ini** — rilis album resmi 7 hari terakhir dari MusicBrainz + Cover Art Archive
- **Top Charts App Store ID** — RSS resmi Apple storefront Indonesia (gratis/terlaris/game)
- **Buku Baru Minggu Ini** — penambahan terbaru Open Library dengan cover
- **Jendela Mars** — citra permukaan Mars terbaru dari NASA Image Library

Live: https://hansxf-ui.github.io/pantau/
