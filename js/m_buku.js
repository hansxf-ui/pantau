/* Buku Baru Minggu Ini — newest additions on Open Library (open book data),
   shown like a bookshop shelf with covers. */
(function () {
  'use strict';
  var S = window.P, c = S.card('mod-buku');
  var url = 'https://openlibrary.org/search.json?q=novel&sort=new&limit=40&fields=key,title,author_name,cover_i,first_publish_year';
  S.fetchJson(url, 25000).then(function (r) {
    var docs = (r.ok && r.data && r.data.docs) || [];
    docs = docs.filter(function (d) { return d.cover_i && d.title; }).slice(0, 12);
    if (!docs.length) {
      c.set('error', 'GAGAL'); c.body.innerHTML = '<p class="errtext">Data Open Library tidak terambil.</p>';
      return;
    }
    c.set('ok', docs.length + ' BUKU BARU');
    c.body.innerHTML = '<div class="gridimg">' + docs.map(function (d) {
      var author = (d.author_name || []).slice(0, 2).join(', ') || '—';
      return '<figure><a href="https://openlibrary.org' + S.esc(d.key) + '" target="_blank" rel="noopener noreferrer">' +
        '<img loading="lazy" src="https://covers.openlibrary.org/b/id/' + d.cover_i + '-M.jpg" alt="Cover ' + S.esc(d.title) + '"></a>' +
        '<figcaption><b>' + S.esc(d.title) + '</b><br>' + S.esc(author) +
        (d.first_publish_year ? '<br>edisi pertama ' + d.first_publish_year : '') + '</figcaption></figure>';
    }).join('') + '</div>' +
    '<p class="empty" style="margin-top:6px">Penambahan terbaru ke katalog Open Library (perpustakaan terbuka Internet Archive) — campuran buku baru &amp; digitalisasi baru. Klik cover untuk detailnya.</p>';
  });
})();
