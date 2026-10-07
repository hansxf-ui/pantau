/* Udara Indonesia — US AQI for major cities from Open-Meteo's air-quality API
   (CAMS atmosphere data). One batched request for all cities. */
(function () {
  'use strict';
  var S = window.P, c = S.card('mod-udara');
  var CITIES = [
    ['Jakarta', -6.21, 106.85], ['Surabaya', -7.25, 112.75], ['Bandung', -6.91, 107.61],
    ['Medan', 3.59, 98.67], ['Semarang', -6.97, 110.42], ['Makassar', -5.14, 119.43],
    ['Palembang', -2.98, 104.76], ['Yogyakarta', -7.80, 110.36], ['Denpasar', -8.65, 115.22],
    ['Balikpapan', -1.27, 116.90], ['Pontianak', -0.03, 109.32], ['Manado', 1.47, 124.84]
  ];
  function cat(aqi) {
    if (aqi == null) return ['—', ''];
    if (aqi <= 50) return ['Baik', 'green'];
    if (aqi <= 100) return ['Sedang', 'yellow'];
    if (aqi <= 150) return ['Tidak sehat (kelompok sensitif)', 'orange'];
    if (aqi <= 200) return ['TIDAK SEHAT', 'red'];
    if (aqi <= 300) return ['Sangat tidak sehat', 'red'];
    return ['BERBAHAYA', 'red'];
  }
  var lats = CITIES.map(function (x) { return x[1]; }).join(',');
  var lons = CITIES.map(function (x) { return x[2]; }).join(',');
  var url = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + lats + '&longitude=' + lons +
    '&hourly=us_aqi&forecast_days=1&timezone=UTC';
  S.fetchJson(url, 25000).then(function (r) {
    if (!r.ok || !r.data) {
      c.set('error', 'GAGAL'); c.body.innerHTML = '<p class="errtext">Data kualitas udara tidak terambil.</p>';
      return;
    }
    var arr = Array.isArray(r.data) ? r.data : [r.data];
    var nowUtc = new Date();
    var hourIdx = nowUtc.getUTCHours();
    var rows = CITIES.map(function (ct, i) {
      var d = arr[i] || {};
      var aqi = (d.hourly && d.hourly.us_aqi) ? d.hourly.us_aqi[hourIdx] : null;
      return { name: ct[0], aqi: aqi };
    }).sort(function (a, b) { return (b.aqi || 0) - (a.aqi || 0); });
    var worst = rows[0];
    var html = '';
    if (worst && worst.aqi >= 151) {
      html += '<div class="warnbanner">⚠️ ' + S.esc(worst.name) + ' sedang MERAH — AQI ' + Math.round(worst.aqi) + ' (tidak sehat). Kurangi aktivitas luar &amp; pakai masker.</div>';
    }
    html += '<ul class="list">' + rows.map(function (x) {
      var cc = cat(x.aqi);
      return '<li><span><b>' + S.esc(x.name) + '</b></span><span><span class="tag ' + cc[1] + '">AQI ' +
        (x.aqi == null ? '—' : Math.round(x.aqi)) + '</span> <span class="r">' + cc[0] + '</span></span></li>';
    }).join('') + '</ul>' +
    '<p class="empty" style="margin-top:6px">Indeks AQI Amerika dari Open-Meteo (data atmosfer CAMS Eropa), jam berjalan. Diurutkan dari yang paling kotor.</p>';
    c.set(worst && worst.aqi >= 151 ? 'warn' : 'ok', 'TERBURUK: ' + (worst ? worst.name.toUpperCase() : '—'));
    c.body.innerHTML = html;
  });
})();
