/* Top Charts App Store ID — Apple's legacy RSS feeds for the Indonesian
   storefront (CORS-open). Tabs: free / grossing / games. */
(function () {
  'use strict';
  var S = window.P, c = S.card('mod-apps');
  var FEEDS = {
    free: ['Gratis Teratas', 'https://itunes.apple.com/id/rss/topfreeapplications/limit=15/json'],
    grossing: ['Terlaris (Pendapatan)', 'https://itunes.apple.com/id/rss/topgrossingapplications/limit=15/json'],
    games: ['Game Gratis Teratas', 'https://itunes.apple.com/id/rss/topfreeapplications/limit=15/genre=6014/json']
  };
  c.body.innerHTML = '<div class="tabrow" id="appsTabs">' +
    Object.keys(FEEDS).map(function (k, i) { return '<button type="button" data-k="' + k + '"' + (i === 0 ? ' class="on"' : '') + '>' + FEEDS[k][0] + '</button>'; }).join('') +
    '</div><div id="appsOut"><p class="empty">Memuat chart&hellip;</p></div>';
  var out = document.getElementById('appsOut');
  function load(k) {
    out.innerHTML = '<p class="empty">Memuat chart&hellip;</p>';
    S.fetchJson(FEEDS[k][1], 25000).then(function (r) {
      var entries = (r.ok && r.data && r.data.feed && r.data.feed.entry) || [];
      if (!entries.length) {
        c.set('error', 'GAGAL'); out.innerHTML = '<p class="errtext">Feed App Store tidak terambil.</p>';
        return;
      }
      c.set('ok', 'CHART HARI INI');
      out.innerHTML = '<ul class="list">' + entries.map(function (e, i) {
        var img = (e['im:image'] || []).slice(-1)[0];
        var cat = e.category && e.category.attributes && e.category.attributes.label;
        return '<li><span style="display:flex;gap:10px;align-items:center;min-width:0">' +
          '<b>' + (i + 1) + '.</b>' + (img ? '<img src="' + S.esc(img.label) + '" alt="" width="34" height="34" style="border-radius:8px">' : '') +
          '<span style="min-width:0"><a href="' + S.esc(e.link.attributes.href) + '" target="_blank" rel="noopener noreferrer"><b>' + S.esc(e['im:name'].label) + '</b></a>' +
          (cat ? '<br><span class="r" style="text-align:left">' + S.esc(cat) + '</span>' : '') + '</span></span></li>';
      }).join('') + '</ul><p class="empty" style="margin-top:6px">Sumber: RSS resmi App Store Indonesia (Apple).</p>';
    });
  }
  document.getElementById('appsTabs').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    this.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
    b.classList.add('on'); load(b.getAttribute('data-k'));
  });
  load('free');
})();
