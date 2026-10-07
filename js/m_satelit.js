/* Satelit di Atas Rumahmu — TLE (CelesTrak via ivanstanojevic.me) + satellite.js
   propagation in the browser. Overhead = elevation > 0 from the chosen location.
   Also predicts the next ISS pass (elevation peak > 10°) with a live countdown. */
(function () {
  'use strict';
  var S = window.P, c = S.card('mod-satelit');
  var SATS = [
    [25544, 'ISS (Stasiun Luar Angkasa)'], [48274, 'Tiangong (Stasiun Tiongkok)'], [20580, 'Teleskop Hubble'],
    [25994, 'Terra (NASA)'], [27424, 'Aqua (NASA)'], [37849, 'Suomi NPP (cuaca)'],
    [33591, 'NOAA 19 (cuaca)'], [28654, 'NOAA 18 (cuaca)'], [25338, 'NOAA 15 (cuaca)'],
    [39084, 'Landsat 8'], [40697, 'Sentinel-2A'], [38771, 'MetOp-B (cuaca)']
  ];
  var loc = S.getLoc();
  var loaded = [];
  var nextPass = null; /* {start:Date, peak:Number} */
  c.body.innerHTML = '<p class="empty">Menarik data orbit (TLE) ' + SATS.length + ' satelit&hellip;</p>';

  function lookAngles(satrec, date) {
    var pv = satellite.propagate(satrec, date);
    if (!pv.position) return null;
    var gmst = satellite.gstime(date);
    var geo = satellite.eciToGeodetic(pv.position, gmst);
    var obs = { longitude: satellite.degreesToRad(loc.lon), latitude: satellite.degreesToRad(loc.lat), height: 0.01 };
    var ecf = satellite.eciToEcf(pv.position, gmst);
    var la = satellite.ecfToLookAngles(obs, ecf);
    return {
      lat: satellite.degreesLat(geo.latitude), lon: satellite.degreesLong(geo.longitude),
      altKm: geo.height, elev: satellite.radiansToDegrees(la.elevation),
      azim: (satellite.radiansToDegrees(la.azimuth) + 360) % 360, rangeKm: la.rangeSat
    };
  }
  function predictIss() {
    var iss = loaded.filter(function (s) { return s.id === 25544; })[0];
    if (!iss) return;
    var stepMs = 20000, horizon = 48 * 3600 * 1000, t = Date.now();
    var inPass = false, start = 0, peak = 0;
    for (var i = 0; i < horizon / stepMs; i++) {
      var d = new Date(t + i * stepMs);
      var la = lookAngles(iss.satrec, d);
      if (!la) continue;
      if (!inPass && la.elev > 10) { inPass = true; start = d.getTime(); peak = la.elev; }
      else if (inPass) {
        if (la.elev > peak) peak = la.elev;
        if (la.elev <= 10) { nextPass = { start: start, peak: peak }; return; }
      }
    }
  }
  function fmtCountdown(ms) {
    if (ms < 0) ms = 0;
    var s = Math.floor(ms / 1000), hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    return (hh > 0 ? hh + ' jam ' : '') + mm + ' menit ' + ss + ' detik';
  }
  function render() {
    var now = new Date();
    var rows = loaded.map(function (s) {
      var la = lookAngles(s.satrec, now);
      return la ? { name: s.name, la: la } : null;
    }).filter(Boolean);
    var above = rows.filter(function (r) { return r.la.elev > 0; })
      .sort(function (a, b) { return b.la.elev - a.la.elev; });
    var html = '';
    if (nextPass) {
      var left = nextPass.start - Date.now();
      html += '<p>🛰️ <b>ISS lewat lagi di atas ' + S.esc(loc.label) + '</b> dalam</p>' +
        '<p class="big">' + fmtCountdown(left) + '</p>' +
        '<p class="empty">Mulai terlihat ' + new Date(nextPass.start).toLocaleString('id-ID') +
        ', puncak ketinggian ' + Math.round(nextPass.peak) + '° di atas horizon. Kalau langit cerah &amp; gelap, ISS tampak seperti bintang terang meluncur.</p>';
    }
    if (above.length) {
      html += '<p style="margin-top:8px"><b>Sedang di atasmu detik ini (' + above.length + '):</b></p><ul class="list">' +
        above.map(function (r) {
          return '<li><span><b>' + S.esc(r.name) + '</b></span><span class="r">elevasi ' + r.la.elev.toFixed(0) + '° · azimuth ' + r.la.azim.toFixed(0) + '° · jarak ' + Math.round(r.la.rangeKm).toLocaleString('id-ID') + ' km</span></li>';
        }).join('') + '</ul>';
    } else {
      html += '<p class="empty" style="margin-top:8px">Tidak ada satelit pantau yang sedang di atas horizon lokasimu detik ini — mereka mengelilingi Bumi ±90 menit sekali, jadi cepat berubah.</p>';
    }
    html += '<p class="empty" style="margin-top:6px">Posisi dihitung langsung di browser dari data orbit TLE terbaru (' + loaded.length + ' satelit dipantau). Diperbarui tiap detik.</p>';
    c.body.innerHTML = html;
    c.set('ok', above.length + ' DI ATASMU');
  }
  if (typeof satellite === 'undefined') {
    c.set('error', 'GAGAL');
    c.body.innerHTML = '<p class="errtext">Pustaka propagasi orbit gagal dimuat. Coba muat ulang halaman.</p>';
    return;
  }
  var fetches = SATS.map(function (s) {
    return S.fetchJson('https://tle.ivanstanojevic.me/api/tle/' + s[0], 20000).then(function (r) {
      if (r.ok && r.data && r.data.line1 && r.data.line2) {
        try {
          loaded.push({ id: s[0], name: s[1], satrec: satellite.twoline2satrec(r.data.line1, r.data.line2) });
        } catch (e) { /* skip malformed TLE */ }
      }
    }).catch(function () { /* one bad fetch must not stall the module */ });
  });
  Promise.all(fetches).then(function () {
    if (!loaded.length) {
      c.set('error', 'GAGAL');
      c.body.innerHTML = '<p class="errtext">Data TLE tidak terambil. Coba muat ulang halaman.</p>';
      return;
    }
    predictIss(); render();
    setInterval(render, 1000);
    setInterval(predictIss, 600000);
  });
})();
