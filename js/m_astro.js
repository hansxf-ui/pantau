/* Siapa di Luar Angkasa — crew manifest from The Space Devs (LL2) + ISS live
   telemetry propagated locally with satellite.js from the station's TLE,
   drawn as a classic ground-track plot with night shading. */
(function () {
  'use strict';
  var S = window.P, c = S.card('mod-astro');
  var FLAGS = { American: '🇺🇸', Russian: '🇷🇺', Chinese: '🇨🇳', Canadian: '🇨🇦', French: '🇫🇷', German: '🇩🇪', Japanese: '🇯🇵', Italian: '🇮🇹', British: '🇬🇧', Indian: '🇮🇳', Israeli: '🇮🇱', 'South Korean': '🇰🇷', Spanish: '🇪🇸', Danish: '🇩🇰', Swedish: '🇸🇪', Dutch: '🇳🇱', Brazilian: '🇧🇷', Australian: '🇦🇺', Emirati: '🇦🇪', Polish: '🇵🇱', Hungarian: '🇭🇺', Turkish: '🇹🇷' };
  c.body.innerHTML =
    '<div id="astroCrew"><p class="empty">Memuat daftar awak&hellip;</p></div>' +
    '<h3 style="margin:16px 0 6px;font-size:14px">📡 ISS — posisi &amp; telemetri langsung</h3>' +
    '<canvas class="track" id="issCv" width="860" height="330"></canvas>' +
    '<div class="tele" id="issTele" style="margin-top:10px">' +
    '<div><span>LINTANG</span><b>—</b></div><div><span>BUJUR</span><b>—</b></div>' +
    '<div><span>KETINGGIAN</span><b>—</b></div><div><span>KECEPATAN</span><b>—</b></div></div>' +
    '<p class="empty" id="issNote">Mengambil elemen orbit (TLE) ISS&hellip;</p>';

  /* ---------- crew ---------- */
  S.fetchJson('https://ll.thespacedevs.com/2.2.0/astronaut/?in_space=true&limit=60', 25000).then(function (r) {
    var list = (r.ok && r.data && r.data.results) || [];
    var starman = list.filter(function (a) { return a.name === 'Starman'; }).length > 0;
    list = list.filter(function (a) { return a.name !== 'Starman'; });
    if (!list.length) {
      c.set('error', 'GAGAL');
      document.getElementById('astroCrew').innerHTML = '<p class="errtext">Data awak The Space Devs tidak terambil.</p>';
      return;
    }
    c.set('ok', list.length + ' MANUSIA DI ORBIT');
    var now = Date.now();
    function days(a) { var t = Date.parse(a.last_flight || ''); return isNaN(t) ? null : Math.max(0, Math.floor((now - t) / 86400000)); }
    function row(a) {
      var d = days(a);
      var ag = (a.agency && a.agency.abbrev) || '';
      return '<li><span>' + (FLAGS[a.nationality] || '🧑‍🚀') + ' <b>' + S.esc(a.name) + '</b> <span style="color:var(--dim)">' +
        S.esc(a.nationality || '') + (ag ? ' · ' + S.esc(ag) : '') + '</span></span><span class="r">' +
        (d == null ? '' : 'hari ke-' + (d + 1) + ' di luar angkasa') + '</span></li>';
    }
    var iss = list.filter(function (a) { return !(a.agency && a.agency.abbrev === 'CNSA'); })
      .sort(function (a, b) { return (days(b) || 0) - (days(a) || 0); });
    var css = list.filter(function (a) { return a.agency && a.agency.abbrev === 'CNSA'; })
      .sort(function (a, b) { return (days(b) || 0) - (days(a) || 0); });
    var html = '';
    if (iss.length) html += '<h3 style="margin:2px 0 6px;font-size:14px">🛰️ Stasiun Luar Angkasa Internasional (ISS) — ' + iss.length + ' orang</h3><ul class="list">' + iss.map(row).join('') + '</ul>';
    if (css.length) html += '<h3 style="margin:14px 0 6px;font-size:14px">🛰️ Stasiun Tiangong (Tiongkok) — ' + css.length + ' orang</h3><ul class="list">' + css.map(row).join('') + '</ul>';
    if (starman) html += '<p class="empty" style="margin-top:8px">Bonus: manekin Tesla "Starman" juga masih melayang mengelilingi Matahari sejak 2018 — tidak dihitung sebagai awak. 😄</p>';
    html += '<p class="empty" style="margin-top:4px">Sumber daftar awak: The Space Devs. "Hari ke-" dihitung dari tanggal peluncuran misi yang sedang berjalan.</p>';
    document.getElementById('astroCrew').innerHTML = html;
  });

  /* ---------- ISS tracking ---------- */
  if (typeof satellite === 'undefined') {
    document.getElementById('issNote').textContent = 'Pustaka orbit gagal dimuat — telemetri ISS dilewati.';
    return;
  }
  var satrec = null, trackPts = [];
  function propagate(date) {
    var pv = satellite.propagate(satrec, date);
    if (!pv || !pv.position) return null;
    var gmst = satellite.gstime(date);
    var geo = satellite.eciToGeodetic(pv.position, gmst);
    var vel = Math.sqrt(pv.velocity.x * pv.velocity.x + pv.velocity.y * pv.velocity.y + pv.velocity.z * pv.velocity.z);
    return { lat: satellite.degreesLat(geo.latitude), lon: satellite.degreesLong(geo.longitude), alt: geo.height, vel: vel };
  }
  function buildTrack() {
    trackPts = [];
    var t0 = Date.now();
    for (var m = -50; m <= 55; m += 2) {
      var p = propagate(new Date(t0 + m * 60000));
      if (p) trackPts.push(p);
    }
  }
  function sunPoint(date) {
    var start = Date.UTC(date.getUTCFullYear(), 0, 0);
    var doy = Math.floor((date.getTime() - start) / 86400000);
    var decl = -23.44 * Math.cos((doy + 10) / 365 * 2 * Math.PI);
    var utcH = date.getUTCHours() + date.getUTCMinutes() / 60;
    var lon = 180 - utcH * 15; if (lon > 180) lon -= 360;
    return { lat: decl, lon: lon };
  }
  function drawISS(now) {
    var cv = document.getElementById('issCv'); if (!cv || !satrec) return;
    var g = cv.getContext('2d'), w = cv.width, h = cv.height;
    function X(lon) { return (lon + 180) / 360 * w; }
    function Y(lat) { return (90 - lat) / 180 * h; }
    g.fillStyle = '#0a1424'; g.fillRect(0, 0, w, h);
    /* night shading */
    var sun = sunPoint(now), decl = sun.lat * Math.PI / 180;
    g.fillStyle = 'rgba(2,6,18,.5)';
    g.beginPath();
    var started = false;
    for (var lon = -180; lon <= 180; lon += 3) {
      var H = (lon - sun.lon) * Math.PI / 180;
      var latT;
      if (Math.abs(Math.tan(decl)) < 0.02) latT = (Math.cos(H) > 0 ? -90 : 90);
      else latT = Math.atan(-Math.cos(H) / Math.tan(decl)) * 180 / Math.PI;
      /* night is on the opposite side of the subsolar latitude */
      var yTop = decl >= 0 ? Y(latT) : Y(latT);
      if (!started) { g.moveTo(X(lon), yTop); started = true; } else g.lineTo(X(lon), yTop);
    }
    if (decl >= 0) { g.lineTo(w, h); g.lineTo(0, h); } else { g.lineTo(w, 0); g.lineTo(0, 0); }
    g.closePath(); g.fill();
    /* graticule */
    g.strokeStyle = '#16283f'; g.fillStyle = '#41618c'; g.font = '10px ui-monospace,monospace';
    for (var gl = -150; gl <= 150; gl += 30) { g.beginPath(); g.moveTo(X(gl), 0); g.lineTo(X(gl), h); g.stroke(); }
    for (var gt = -60; gt <= 60; gt += 30) { g.beginPath(); g.moveTo(0, Y(gt)); g.lineTo(w, Y(gt)); g.stroke(); }
    g.strokeStyle = '#1e3a5c'; g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(w, Y(0)); g.stroke();
    g.fillText('wilayah malam tergelap', X(sun.lon > 0 ? sun.lon - 178 : sun.lon + 92), 16);
    /* ground track */
    g.strokeStyle = 'rgba(255,211,77,.65)'; g.lineWidth = 1.6; g.beginPath();
    var pen = false, prevLon = null;
    trackPts.forEach(function (p) {
      if (prevLon !== null && Math.abs(p.lon - prevLon) > 180) pen = false;
      if (!pen) { g.moveTo(X(p.lon), Y(p.lat)); pen = true; } else g.lineTo(X(p.lon), Y(p.lat));
      prevLon = p.lon;
    });
    g.stroke(); g.lineWidth = 1;
    /* user */
    var loc = S.getLoc();
    g.strokeStyle = '#38e08a'; g.beginPath(); g.arc(X(loc.lon), Y(loc.lat), 5, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#38e08a'; g.fillText('KAMU', X(loc.lon) + 8, Y(loc.lat) + 3);
    /* ISS now */
    var p = propagate(now);
    if (p) {
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(X(p.lon), Y(p.lat), 4.5, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(X(p.lon), Y(p.lat), 9 + 2 * Math.sin(Date.now() / 300), 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#e8eef7'; g.font = '11px ui-monospace,monospace'; g.fillText('ISS', X(p.lon) + 12, Y(p.lat) - 6);
      var cells = document.querySelectorAll('#issTele b');
      if (cells.length === 4) {
        cells[0].textContent = Math.abs(p.lat).toFixed(2) + '° ' + (p.lat >= 0 ? 'LU' : 'LS');
        cells[1].textContent = Math.abs(p.lon).toFixed(2) + '° ' + (p.lon >= 0 ? 'BT' : 'BB');
        cells[2].textContent = p.alt.toFixed(0) + ' km';
        cells[3].textContent = Math.round(p.vel * 3600).toLocaleString('id-ID') + ' km/jam';
      }
    }
  }
  S.fetchJson('https://tle.ivanstanojevic.me/api/tle/25544', 20000).then(function (r) {
    if (!r.ok || !r.data || !r.data.line1) {
      document.getElementById('issNote').textContent = 'TLE ISS tidak terambil — telemetri dilewati.';
      return;
    }
    try {
      satrec = satellite.twoline2satrec(r.data.line1, r.data.line2);
    } catch (e) { return; }
    buildTrack();
    document.getElementById('issNote').innerHTML = 'Posisi dihitung langsung di browsermu dari elemen orbit (TLE) ISS memakai satellite.js — diperbarui tiap detik. Garis kuning = lintasan ±50 menit; area gelap = separuh Bumi yang sedang malam.';
    drawISS(new Date());
    setInterval(function () { drawISS(new Date()); }, 1000);
    setInterval(buildTrack, 300000);
  });
})();
