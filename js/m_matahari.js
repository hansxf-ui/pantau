/* Detak Jantung Matahari — NOAA SWPC live: solar wind, Kp index, X-ray flares, alerts. */
(function () {
  'use strict';
  var S = window.P, c = S.card('mod-matahari');
  function flareClass(flux) {
    if (!flux || flux <= 0) return '—';
    var exp = Math.floor(Math.log10(flux));
    var mant = flux / Math.pow(10, exp);
    var letter = { '-8': 'A', '-7': 'B', '-6': 'C', '-5': 'M', '-4': 'X' }[String(exp)] || (exp < -8 ? 'A' : 'X');
    return letter + mant.toFixed(1);
  }
  function load() {
    var got = { wind: null, kp: null, xr: null, alerts: null }, done = 0;
    function finish() {
      if (++done < 4) return;
      var html = '<dl class="kv">';
      if (got.wind) html += '<dt>Angin matahari</dt><dd><b>' + Math.round(got.wind.speed) + ' km/detik</b> · kepadatan ' + got.wind.density.toFixed(1) + ' p/cm³ · ' + Math.round(got.wind.temp).toLocaleString('id-ID') + ' K</dd>';
      if (got.kp != null) {
        var kpTag = got.kp >= 5 ? '<span class="tag red">BADAI GEOMAGNETIK</span>' : (got.kp >= 4 ? '<span class="tag yellow">AKTIF</span>' : '<span class="tag green">TENANG</span>');
        html += '<dt>Indeks Kp (geomagnetik)</dt><dd><b>' + got.kp.toFixed(1) + '</b> / 9 ' + kpTag + '</dd>';
      }
      if (got.xr) html += '<dt>Flare sinar-X terakhir</dt><dd>kelas <b>' + flareClass(got.xr) + '</b> (A &lt; B &lt; C &lt; M &lt; X — X paling kuat)</dd>';
      html += '</dl>';
      if (got.alerts && got.alerts.length) {
        html += '<ul class="list">' + got.alerts.slice(0, 3).map(function (a) {
          return '<li><span>⚠️ ' + S.esc(String(a.message || '').split('\n')[0].slice(0, 130)) + '</span></li>';
        }).join('') + '</ul>';
      } else if (got.alerts) {
        html += '<p class="empty" style="margin-top:6px">Tidak ada alert cuaca antariksa aktif dari NOAA.</p>';
      }
      html += '<p class="empty" style="margin-top:6px">Sumber: NOAA Space Weather Prediction Center, diperbarui tiap 5 menit. Kp ≥ 5 = badai — aurora bisa tampak jauh dari kutub &amp; GPS/radio terganggu.</p>';
      c.body.innerHTML = html;
      c.set(got.kp != null && got.kp >= 5 ? 'warn' : 'ok', 'LIVE · NOAA SWPC');
    }
    S.fetchJson('https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json', 20000).then(function (r) {
      if (r.ok && Array.isArray(r.data)) {
        var rows = r.data.filter(function (x) { return x.proton_speed; });
        var last = rows[rows.length - 1];
        if (last) got.wind = { speed: last.proton_speed, density: last.proton_density || 0, temp: last.proton_temperature || 0 };
      }
      finish();
    });
    S.fetchJson('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json', 20000).then(function (r) {
      if (r.ok && Array.isArray(r.data) && r.data.length) got.kp = r.data[r.data.length - 1].Kp;
      finish();
    });
    S.fetchJson('https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json', 20000).then(function (r) {
      if (r.ok && Array.isArray(r.data) && r.data.length) {
        got.xr = Math.max.apply(null, r.data.slice(-1440).map(function (x) { return x.observed_flux || 0; }));
      }
      finish();
    });
    S.fetchJson('https://services.swpc.noaa.gov/products/alerts.json', 20000).then(function (r) {
      if (r.ok && Array.isArray(r.data)) got.alerts = r.data;
      finish();
    });
  }
  load(); setInterval(load, 300000);
})();
