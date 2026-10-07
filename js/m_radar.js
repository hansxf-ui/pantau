/* Sky Radar Indonesia — live traffic from VATSIM (virtual aviation network:
   real people flying simulated aircraft; real ADS-B APIs send no CORS headers,
   so genuine ADS-B is linked out). Canvas map over the Indonesian bbox. */
(function () {
  'use strict';
  var S = window.P, c = S.card('mod-radar');
  var LON0 = 94, LON1 = 142, LAT0 = 7.5, LAT1 = -11.5;
  var CITIES = [['Jakarta', -6.2, 106.8], ['Surabaya', -7.25, 112.75], ['Makassar', -5.14, 119.43],
    ['Medan', 3.59, 98.67], ['Denpasar', -8.65, 115.22], ['Jayapura', -2.55, 140.7], ['Balikpapan', -1.27, 116.9]];
  var pilots = [];
  c.body.innerHTML = '<canvas class="radar" id="radarCv" width="860" height="340"></canvas>' +
    '<p class="empty" id="radarNote">Menghubungi jaringan VATSIM&hellip;</p><ul class="list" id="radarList"></ul>' +
    '<p class="empty" style="margin-top:8px">Ini lalu lintas <b>penerbangan virtual</b> (pilot sungguhan menerbangkan pesawat simulasi di jaringan VATSIM) — ' +
    'API ADS-B pesawat asli tidak mengizinkan dibaca langsung dari browser. Radar asli: ' +
    '<a href="https://globe.adsb.lol/?lat=-2.5&lon=118&zoom=5" target="_blank" rel="noopener noreferrer">globe.adsb.lol</a></p>';
  var cv = document.getElementById('radarCv'), ctx = cv.getContext('2d');
  function xy(lat, lon, w, h) { return [(lon - LON0) / (LON1 - LON0) * w, (LAT0 - lat) / (LAT0 - LAT1) * h]; }
  function draw() {
    var w = cv.width, h = cv.height;
    ctx.fillStyle = '#081120'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#12233d'; ctx.lineWidth = 1;
    for (var lon = 95; lon <= 140; lon += 5) { var a = xy(0, lon, w, h); ctx.beginPath(); ctx.moveTo(a[0], 0); ctx.lineTo(a[0], h); ctx.stroke(); }
    for (var lat = 5; lat >= -10; lat -= 5) { var b = xy(lat, 0, w, h); ctx.beginPath(); ctx.moveTo(0, b[1]); ctx.lineTo(w, b[1]); ctx.stroke(); }
    /* range rings around observer */
    var loc = S.getLoc(), o = xy(loc.lat, loc.lon, w, h);
    ctx.strokeStyle = '#1d3a5f';
    [60, 120].forEach(function (r) { ctx.beginPath(); ctx.arc(o[0], o[1], r, 0, Math.PI * 2); ctx.stroke(); });
    ctx.fillStyle = '#39b6ff';
    CITIES.forEach(function (ct) {
      var p = xy(ct[1], ct[2], w, h);
      ctx.fillRect(p[0] - 2, p[1] - 2, 4, 4);
      ctx.font = '10px sans-serif'; ctx.fillStyle = '#5f7ca3'; ctx.fillText(ct[0], p[0] + 5, p[1] + 3); ctx.fillStyle = '#39b6ff';
    });
    ctx.fillStyle = '#38e08a';
    ctx.beginPath(); ctx.arc(o[0], o[1], 3.5, 0, Math.PI * 2); ctx.fill();
    pilots.forEach(function (p) {
      var q = xy(p.latitude, p.longitude, w, h);
      ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate((p.heading || 0) * Math.PI / 180);
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4.5, 5); ctx.lineTo(0, 2.4); ctx.lineTo(-4.5, 5); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.font = '9px monospace'; ctx.fillStyle = '#c8d6ea';
      ctx.fillText(p.callsign, q[0] + 7, q[1] - 4);
    });
  }
  function load() {
    S.fetchJson('https://data.vatsim.net/v3/vatsim-data.json', 25000).then(function (r) {
      if (!r.ok || !r.data || !Array.isArray(r.data.pilots)) {
        c.set('error', 'GAGAL'); document.getElementById('radarNote').innerHTML = '<span class="errtext">Gagal menarik data VATSIM.</span>';
        return;
      }
      pilots = r.data.pilots.filter(function (p) {
        return p.latitude >= LAT1 && p.latitude <= LAT0 && p.longitude >= LON0 && p.longitude <= LON1;
      });
      c.set('ok', 'LIVE · ' + pilots.length + ' PENERBANGAN');
      document.getElementById('radarNote').innerHTML = '<b>' + pilots.length + '</b> penerbangan virtual sedang di atas wilayah Indonesia. Diperbarui tiap 20 detik.';
      pilots.sort(function (a, b2) { return (b2.altitude || 0) - (a.altitude || 0); });
      document.getElementById('radarList').innerHTML = pilots.slice(0, 8).map(function (p) {
        var fp = p.flight_plan || {};
        var route = (fp.departure || '?') + ' → ' + (fp.arrival || '?');
        return '<li><span><b>' + S.esc(p.callsign) + '</b> <span class="tag">' + S.esc(route) + '</span></span>' +
          '<span class="r">' + Math.round(p.altitude || 0).toLocaleString('id-ID') + ' ft · ' + Math.round(p.groundspeed || 0) + ' kt</span></li>';
      }).join('');
      draw();
    });
  }
  draw(); load(); setInterval(load, 20000);
})();
