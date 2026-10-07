/* Buku Baru Minggu Ini — newest additions on Open Library (open book data),
   shown like a bookshop shelf with covers. Tabs act as shelf filters
   (search-based): Semua / Novel / Nonfiksi / Komik. */
(function () {
  'use strict';
  var S = window.P, c = S.card('mod-buku');
  var SHELVES = {
    semua: ['Semua', 'novel'],
    novel: ['Novel & Fiksi', 'fiction'],
    nonfiksi: ['Nonfiksi', 'biography'],
    komik: ['Komik & Novel Grafis', 'graphic novel']
  };
  c.body.innerHTML = '<div class="tabrow" id="bukuTabs">' +
    Object.keys(SHELVES).map(function (k, i) { return '<button type="button" data-k="' + k + '"' + (i === 0 ? ' class="on"' : '') + '>' + SHELVES[k][0] + '</button>'; }).join('') +
    '</div><div id="bukuOut"><p class="empty">Memuat rak&hellip;</p></div>';
  var out = document.getElementById('bukuOut');
  function load(k) {
    out.innerHTML = '<p class="empty">Memuat rak&hellip;</p>';
    var url = 'https://openlibrary.org/search.json?q=' + encodeURIComponent(SHELVES[k][1]) +
      '&sort=new&limit=40&fields=key,title,author_name,cover_i,first_publish_year';
    S.fetchJson(url, 25000).then(function (r) {
      var docs = (r.ok && r.data && r.data.docs) || [];
      docs = docs.filter(function (d) { return d.cover_i && d.title; }).slice(0, 12);
      if (!docs.length) {
        c.set('error', 'GAGAL'); out.innerHTML = '<p class="errtext">Data Open Library tidak terambil.</p>';
        return;
      }
      c.set('ok', docs.length + ' BUKU BARU');
      out.innerHTML = '<div class="gridimg">' + docs.map(function (d) {
        var author = (d.author_name || []).slice(0, 2).join(', ') || '—';
        var yr = d.first_publish_year;
        var yrTxt = (yr && yr >= 1950 && yr <= 2026) ? '<br>edisi pertama ' + yr : '';
        return '<figure><a href="https://openlibrary.org' + S.esc(d.key) + '" target="_blank" rel="noopener noreferrer">' +
          '<img loading="lazy" src="https://covers.openlibrary.org/b/id/' + d.cover_i + '-M.jpg" alt="Cover ' + S.esc(d.title) + '"></a>' +
          '<figcaption><b>' + S.esc(d.title) + '</b><br>' + S.esc(author) + yrTxt + '</figcaption></figure>';
      }).join('') + '</div>' +
      '<p class="empty" style="margin-top:6px">Penambahan terbaru ke katalog Open Library (perpustakaan terbuka Internet Archive) — campuran buku baru &amp; digitalisasi baru. Klik cover untuk detailnya.</p>';
    });
  }
  document.getElementById('bukuTabs').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    this.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
    b.classList.add('on'); load(b.getAttribute('data-k'));
  });
  load('semua');
})();
