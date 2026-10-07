/* Musik Baru Minggu Ini — MusicBrainz release search over the last 7 days
   (official albums), covers from the Cover Art Archive. */
(function () {
  'use strict';
  var S = window.P, c = S.card('mod-musik');
  function dstr(d) { return d.toISOString().slice(0, 10); }
  var to = new Date(), from = new Date(Date.now() - 6 * 86400000);
  var q = 'date:[' + dstr(from) + ' TO ' + dstr(to) + '] AND status:official AND type:album';
  var url = 'https://musicbrainz.org/ws/2/release/?query=' + encodeURIComponent(q) + '&fmt=json&limit=60';
  S.fetchJson(url, 30000, { 'Accept': 'application/json' }).then(function (r) {
    var rels = (r.ok && r.data && r.data.releases) || [];
    rels = rels.filter(function (x) { return x.date && x.title; })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 12);
    if (!rels.length) {
      c.set('error', 'GAGAL'); c.body.innerHTML = '<p class="errtext">Data rilis MusicBrainz tidak terambil.</p>';
      return;
    }
    c.set('ok', rels.length + ' ALBUM BARU');
    c.body.innerHTML = '<div class="gridimg">' + rels.map(function (x) {
      var artist = (x['artist-credit'] && x['artist-credit'][0] && x['artist-credit'][0].name) || '—';
      return '<figure><img loading="lazy" src="https://coverartarchive.org/release/' + x.id + '/front-250" alt="Cover ' + S.esc(x.title) + '" onerror="this.style.visibility=\'hidden\'">' +
        '<figcaption><b>' + S.esc(x.title) + '</b><br>' + S.esc(artist) + '<br>' + S.esc(x.date) + (x.country ? ' · ' + S.esc(x.country) : '') + '</figcaption></figure>';
    }).join('') + '</div>' +
    '<p class="empty" style="margin-top:6px">Album resmi terbit ' + dstr(from) + ' s/d ' + dstr(to) + ' menurut MusicBrainz (basis data musik terbuka). Cover: Cover Art Archive — sebagian rilis indie belum punya cover.</p>';
  });
})();
