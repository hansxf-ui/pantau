/* Mesin Waktu Internet — pick a year per snapshot from Arquivo.pt's public
   web archive (their API is CORS-open; Wayback's is not). Screenshots come
   straight from the archive items (linkToScreenshot). */
(function () {
  'use strict';
  var S = window.P, c = S.card('mod-mesinwaktu');
  c.body.innerHTML =
    '<div class="searchrow"><input type="text" id="mwInput" placeholder="Masukkan URL — mis. google.com, detik.com, facebook.com" autocomplete="off">' +
    '<button class="go" id="mwBtn" type="button">Lihat ke Masa Lalu</button></div>' +
    '<div id="mwOut"><p class="empty" style="margin-top:8px">Arsip ditarik dari Arquivo.pt (arsip web publik). Hasilnya: satu screenshot per tahun sejak situs pertama kali diarsipkan.</p></div>';
  var out = document.getElementById('mwOut');
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  function fmtTs(ts) {
    return ts.slice(6, 8) + ' ' + MONTHS[parseInt(ts.slice(4, 6), 10) - 1] + ' ' + ts.slice(0, 4);
  }
  function run() {
    var raw = document.getElementById('mwInput').value.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!raw) return;
    var target = 'https://' + raw + '/';
    c.set('loading', 'MENCARI ARSIP');
    out.innerHTML = '<p class="empty" style="margin-top:8px">Menarik riwayat arsip ' + S.esc(raw) + '&hellip;</p>';
    var base = 'https://arquivo.pt/textsearch?versionHistory=' + encodeURIComponent(target);
    S.fetchJson(base + '&maxItems=500', 30000).then(function (r) {
      var items = (r.ok && r.data && r.data.response_items) || [];
      var total = (r.ok && r.data && r.data.estimated_nr_results) || items.length;
      if (!items.length) {
        c.set('error', 'TANPA ARSIP');
        out.innerHTML = '<p class="errtext" style="margin-top:8px">Tidak ada arsip untuk URL ini di Arquivo.pt. Coba variasi lain (dengan/tanpa www), atau cek kalender Wayback Machine secara manual.</p>';
        return;
      }
      /* one snapshot per year: earliest in each year */
      var byYear = {};
      items.slice().sort(function (a, b) { return a.tstamp < b.tstamp ? -1 : 1; }).forEach(function (it) {
        var y = it.tstamp.slice(0, 4);
        if (!byYear[y]) byYear[y] = it;
      });
      var years = Object.keys(byYear).sort();
      c.set('ok', total.toLocaleString('id-ID') + ' SNAPSHOT');
      out.innerHTML = '<p class="empty" style="margin-top:8px">' + S.esc(raw) + ' — ' + total.toLocaleString('id-ID') +
        ' snapshot tersimpan, ' + years[0] + '–' + years[years.length - 1] + '. Satu tampang per tahun:</p>' +
        '<div class="timeline">' + years.map(function (y) {
          var it = byYear[y];
          var img = it.linkToScreenshot
            ? '<a href="' + S.esc(it.linkToArchive || '#') + '" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="' + S.esc(it.linkToScreenshot) + '" alt="Arsip ' + S.esc(raw) + ' tahun ' + y + '" onerror="this.parentNode.parentNode.style.display=\'none\'"></a>'
            : '';
          return '<figure>' + img + '<figcaption><b>' + y + '</b> · ' + fmtTs(it.tstamp) + '</figcaption></figure>';
        }).join('') + '</div>' +
        '<p class="empty" style="margin-top:6px">Klik gambar untuk membuka arsip lengkap tanggal itu. Sumber: Arquivo.pt.</p>';
    });
  }
  document.getElementById('mwBtn').addEventListener('click', run);
  document.getElementById('mwInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
})();
