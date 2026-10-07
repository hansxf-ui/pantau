/* Radar Aurora — NOAA SWPC OVATION model (probability grid, ~30-min forecast).
   Rendered as a polar "porthole" view from above the pole: the auroral oval
   glows over a dark graticule. Toggle switches hemisphere. */
(function () {
  'use strict';
  var S = window.P, c = S.card('mod-aurora');
  c.body.innerHTML =
    '<div class="locrow"><span style="font-size:28px;font-weight:800" id="aurLoc">—</span>' +
    '<span class="empty" id="aurLocTxt">peluang aurora di lokasimu malam ini</span></div>' +
    '<div class="tabrow" id="aurTabs"><button type="button" data-h="N" class="on">Belahan Utara</button>' +
    '<button type="button" data-h="S">Belahan Selatan</button></div>' +
    '<canvas class="track" id="aurCv" width="720" height="460"></canvas>' +
    '<p class="empty" id="aurNote">Memuat model OVATION dari NOAA&hellip;</p>';

  var grid = null, hemi = 'N';
  var sprites = [];
  (function makeSprites() {
    for (var i = 0; i < 16; i++) {
      var t = i / 15; /* 0..1 intensity */
      var cv = document.createElement('canvas'); cv.width = cv.height = 64;
      var g = cv.getContext('2d');
      var grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
      var col = t < 0.5 ? '64,255,170' : (t < 0.8 ? '140,255,120' : '200,255,110');
      grad.addColorStop(0, 'rgba(' + col + ',' + (0.16 + 0.5 * t).toFixed(2) + ')');
      grad.addColorStop(1, 'rgba(' + col + ',0)');
      g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
      sprites.push(cv);
    }
  })();

  function polar(lat, lon, w, h) {
    var cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 14;
    var phi = (hemi === 'N' ? (90 - lat) : (90 + lat)) * Math.PI / 180; /* polar angle from pole */
    var lam = lon * Math.PI / 180;
    var r = phi / (Math.PI / 2) * R;
    return [cx + r * Math.sin(lam) * (hemi === 'N' ? 1 : -1), cy + r * Math.cos(lam) * (hemi === 'N' ? 1 : -1)];
  }
  function draw() {
    var cv = document.getElementById('aurCv'); if (!cv) return;
    var g = cv.getContext('2d'), w = cv.width, h = cv.height;
    g.fillStyle = '#030710'; g.fillRect(0, 0, w, h);
    /* starfield specks */
    g.fillStyle = 'rgba(200,220,255,.5)';
    for (var i = 0; i < 90; i++) {
      var sx = ((i * 73.7) % w), sy = ((i * 41.3) % h);
      g.fillRect(sx, sy, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
    }
    var cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 14;
    /* graticule rings: every 20 degrees of latitude from the pole */
    g.strokeStyle = '#14263f'; g.fillStyle = '#41618c'; g.font = '10px ui-monospace,monospace';
    for (var d = 0; d <= 90; d += 20) {
      g.beginPath(); g.arc(cx, cy, d / 90 * R, 0, Math.PI * 2); g.stroke();
      if (d > 0) g.fillText((hemi === 'N' ? (90 - d) : -(90 - d)) + '°', cx + 4, cy - d / 90 * R + 11);
    }
    for (var m = 0; m < 360; m += 30) {
      var p = polar(hemi === 'N' ? 0 : 0, m, w, h);
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(p[0], p[1]); g.stroke();
    }
    g.fillStyle = '#7dd3fc'; g.beginPath(); g.arc(cx, cy, 3, 0, Math.PI * 2); g.fill();
    g.fillText(hemi === 'N' ? 'KUTUB UTARA' : 'KUTUB SELATAN', cx + 8, cy - 6);
    if (!grid) return;
    var stamp = (R / 90) * 4.4;
    grid.forEach(function (pt) {
      var v = pt[2]; if (!v) return;
      var lat = pt[1]; if (hemi === 'N' ? lat < 0 : lat > 0) return;
      var lon = pt[0] > 180 ? pt[0] - 360 : pt[0];
      var xy = polar(lat, lon, w, h);
      var idx = Math.min(15, Math.floor(v / 60 * 16));
      g.drawImage(sprites[idx], xy[0] - stamp / 2, xy[1] - stamp / 2, stamp, stamp);
    });
    /* user marker */
    var loc = S.getLoc();
    if (hemi === 'N' ? loc.lat >= 0 : loc.lat < 0) {
      var u = polar(loc.lat, loc.lon, w, h);
      g.strokeStyle = '#38e08a'; g.lineWidth = 1.6;
      g.beginPath(); g.arc(u[0], u[1], 5, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1;
      g.fillStyle = '#38e08a'; g.font = '10px ui-monospace,monospace'; g.fillText('KAMU', u[0] + 8, u[1] + 3);
    }
  }
  function probAt(loc) {
    if (!grid) return null;
    var best = null, bd = 1e9;
    grid.forEach(function (pt) {
      var lon = pt[0] > 180 ? pt[0] - 360 : pt[0];
      var d = (pt[1] - loc.lat) * (pt[1] - loc.lat) + (lon - loc.lon) * (lon - loc.lon);
      if (d < bd) { bd = d; best = pt[2]; }
    });
    return best;
  }
  function load() {
    S.fetchJson('https://services.swpc.noaa.gov/json/ovation_aurora_latest.json', 30000).then(function (r) {
      if (!r.ok || !r.data || !r.data.coordinates) {
        c.set('error', 'GAGAL');
        document.getElementById('aurNote').textContent = 'Model aurora NOAA tidak terambil.';
        return;
      }
      grid = r.data.coordinates;
      var mx = 0; grid.forEach(function (p) { if (p[2] > mx) mx = p[2]; });
      c.set('ok', 'PUNCAK GLOBAL ' + mx + '%');
      var loc = S.getLoc(), p = probAt(loc);
      var el = document.getElementById('aurLoc'), tx = document.getElementById('aurLocTxt');
      el.textContent = (p == null ? '—' : p + '%');
      tx.textContent = p >= 30 ? 'peluang aurora di lokasimu — LANGKA, keluar dan lihat ke langit!'
        : p >= 5 ? 'peluang aurora di lokasimu malam ini — kecil tapi ada'
        : 'peluang aurora di ' + loc.label + ' — aurora hampir tidak pernah sampai khatulistiwa; peta ini buat memantau ovalnya di kutub';
      document.getElementById('aurNote').innerHTML = 'Model <b>OVATION</b> NOAA SWPC — probabilitas aurora terlihat, ramalan ±30 menit dari waktu observasi ' +
        S.esc((r.data['Forecast Time'] || '').replace('T', ' ').slice(0, 16)) + ' UTC. Makin terang kehijauannya, makin besar peluangnya. Oval aurora menari di sekitar kutub magnetik — jauh dari Indonesia, tapi peta ini cara paling jujur melihatnya "langsung".';
      draw();
    });
  }
  document.getElementById('aurTabs').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    this.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
    b.classList.add('on'); hemi = b.getAttribute('data-h'); draw();
  });
  draw(); load(); setInterval(load, 900000);
})();
