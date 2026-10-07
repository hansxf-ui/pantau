/* Jendela Mars — newest Mars surface imagery from NASA's Image Library
   (Perseverance & Curiosity), sorted by creation date, newest first. */
(function () {
  'use strict';
  var S = window.P, c = S.card('mod-mars');
  var url = 'https://images-api.nasa.gov/search?q=' + encodeURIComponent('perseverance rover mars') +
    '&media_type=image&page_size=100&year_start=2023';
  S.fetchJson(url, 30000).then(function (r) {
    var items = (r.ok && r.data && r.data.collection && r.data.collection.items) || [];
    var rows = items.map(function (it) {
      var d = (it.data || [])[0] || {};
      var img = (it.links || [])[0] || {};
      return { title: d.title || 'Mars', date: d.date_created || '', href: img.href || '', nasa: d.nasa_id || '' };
    }).filter(function (x) { return x.href && x.date && x.date <= new Date().toISOString(); })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 8);
    if (!rows.length) {
      c.set('error', 'GAGAL'); c.body.innerHTML = '<p class="errtext">Arsip citra NASA tidak terambil.</p>';
      return;
    }
    c.set('ok', 'CITRA TERBARU');
    c.body.innerHTML = '<div class="gridimg wide">' + rows.map(function (x) {
      return '<figure><img loading="lazy" src="' + S.esc(x.href) + '" alt="' + S.esc(x.title) + '">' +
        '<figcaption><b>' + S.esc(x.date.slice(0, 10)) + '</b> · ' + S.esc(x.title.slice(0, 90)) + '</figcaption></figure>';
    }).join('') + '</div>' +
    '<p class="empty" style="margin-top:6px">Citra permukaan Mars terbaru di arsip NASA Image Library (dari rover Perseverance/Curiosity). Catatan: foto rover sampai ke Bumi &amp; arsip publik dengan jeda — ini yang paling baru yang tersedia publik, bukan siaran langsung.</p>';
  });
})();
