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
    '<p id="radarNear" style="margin:8px 0 0"></p>' +
    '<p class="empty" id="radarNote">Menghubungi jaringan VATSIM&hellip;</p><ul class="list" id="radarList"></ul>' +
    '<p class="empty" style="margin-top:8px">Ini lalu lintas <b>penerbangan virtual</b> (pilot sungguhan menerbangkan pesawat simulasi di jaringan VATSIM) — ' +
    'API ADS-B pesawat asli tidak mengizinkan dibaca langsung dari browser. Radar asli: ' +
    '<a href="https://globe.adsb.lol/?lat=-2.5&lon=118&zoom=5" target="_blank" rel="noopener noreferrer">globe.adsb.lol</a></p>';
  function distKm(p) {
    var loc = S.getLoc();
    var dLat = (p.latitude - loc.lat) * Math.PI / 180, dLon = (p.longitude - loc.lon) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(loc.lat * Math.PI / 180) * Math.cos(p.latitude * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  var cv = document.getElementById('radarCv'), ctx = cv.getContext('2d');
  function xy(lat, lon, w, h) { return [(lon - LON0) / (LON1 - LON0) * w, (LAT0 - lat) / (LAT0 - LAT1) * h]; }
  function draw(now) {
    var w = cv.width, h = cv.height;
    var loc = S.getLoc(), o = xy(loc.lat, loc.lon, w, h);
    ctx.fillStyle = '#081120'; ctx.fillRect(0, 0, w, h);
    /* rotating sweep with fading trail, centered on the observer */
    var ang = (now / 2400) % (Math.PI * 2);
    var R = Math.max(w, h);
    for (var i = 0; i < 28; i++) {
      var a0 = ang - i * 0.022, alpha = 0.055 * (1 - i / 28);
      ctx.fillStyle = 'rgba(56,224,138,' + alpha.toFixed(3) + ')';
      ctx.beginPath(); ctx.moveTo(o[0], o[1]);
      ctx.arc(o[0], o[1], R, a0 - 0.024, a0);
      ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(56,224,138,.75)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(o[0], o[1]);
    ctx.lineTo(o[0] + R * Math.cos(ang), o[1] + R * Math.sin(ang)); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#12233d';
    for (var lon = 95; lon <= 140; lon += 5) { var a = xy(0, lon, w, h); ctx.beginPath(); ctx.moveTo(a[0], 0); ctx.lineTo(a[0], h); ctx.stroke(); }
    for (var lat = 5; lat >= -10; lat -= 5) { var b = xy(lat, 0, w, h); ctx.beginPath(); ctx.moveTo(0, b[1]); ctx.lineTo(w, b[1]); ctx.stroke(); }
    /* range rings + expanding pulse around observer */
    ctx.strokeStyle = '#1d3a5f';
    [60, 120].forEach(function (r) { ctx.beginPath(); ctx.arc(o[0], o[1], r, 0, Math.PI * 2); ctx.stroke(); });
    var pr = (now / 18) % 130;
    ctx.strokeStyle = 'rgba(57,182,255,' + (0.5 * (1 - pr / 130)).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(o[0], o[1], pr, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#39b6ff';
    CITIES.forEach(function (ct) {
      var p = xy(ct[1], ct[2], w, h);
      ctx.fillRect(p[0] - 2, p[1] - 2, 4, 4);
      ctx.font = '10px sans-serif'; ctx.fillStyle = '#5f7ca3'; ctx.fillText(ct[0], p[0] + 5, p[1] + 3); ctx.fillStyle = '#39b6ff';
    });
    ctx.fillStyle = '#38e08a';
    ctx.beginPath(); ctx.arc(o[0], o[1], 3.5, 0, Math.PI * 2); ctx.fill();
    var pulse = 0.75 + 0.25 * Math.sin(now / 280);
    /* On narrow screens, label only the 6 nearest flights — labels over Java
       otherwise pile up unreadably. Desktop labels everything. */
    var narrow = window.innerWidth <= 760;
    var labelSet = null;
    if (narrow) {
      labelSet = {};
      pilots.slice().sort(function (a, b) { return distKm(a) - distKm(b); })
        .slice(0, 6).forEach(function (p) { labelSet[p.callsign + '|' + p.latitude] = true; });
    }
    pilots.forEach(function (p) {
      var q = xy(p.latitude, p.longitude, w, h);
      ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate((p.heading || 0) * Math.PI / 180);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4.5, 5); ctx.lineTo(0, 2.4); ctx.lineTo(-4.5, 5); ctx.closePath(); ctx.fill();
      ctx.restore(); ctx.globalAlpha = 1;
      if (!labelSet || labelSet[p.callsign + '|' + p.latitude]) {
        ctx.font = '9px monospace'; ctx.fillStyle = '#c8d6ea';
        ctx.fillText(p.callsign, q[0] + 7, q[1] - 4);
      }
    });
    requestAnimationFrame(draw);
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
      if (pilots.length) {
        var near = pilots.slice().sort(function (a, b) { return distKm(a) - distKm(b); })[0];
        var nfp = near.flight_plan || {};
        document.getElementById('radarNear').innerHTML = '✈️ Pesawat terdekat dari ' + S.esc(S.getLoc().label) +
          ': <b>' + S.esc(near.callsign) + '</b> (' + S.esc((nfp.departure || '?') + ' → ' + (nfp.arrival || '?')) +
          ') — ±' + Math.round(distKm(near)).toLocaleString('id-ID') + ' km, di ketinggian ' +
          Math.round(near.altitude || 0).toLocaleString('id-ID') + ' ft';
      }
      c.set('ok', 'LIVE · ' + pilots.length + ' PENERBANGAN');
      document.getElementById('radarNote').innerHTML = '<b>' + pilots.length + '</b> penerbangan virtual sedang di atas wilayah Indonesia. Diperbarui tiap 20 detik.';
      pilots.sort(function (a, b2) { return (b2.altitude || 0) - (a.altitude || 0); });
      document.getElementById('radarList').innerHTML = pilots.slice(0, 8).map(function (p) { /* list refresh */
        var fp = p.flight_plan || {};
        var route = (fp.departure || '?') + ' → ' + (fp.arrival || '?');
        return '<li><span><b>' + S.esc(p.callsign) + '</b> <span class="tag">' + S.esc(route) + '</span></span>' +
          '<span class="r">' + Math.round(p.altitude || 0).toLocaleString('id-ID') + ' ft · ' + Math.round(p.groundspeed || 0) + ' kt</span></li>';
      }).join('');
    });
  }
  requestAnimationFrame(draw); load(); setInterval(load, 15000);
})();
