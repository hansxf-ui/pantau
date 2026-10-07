/* Asteroid Watch — NASA NeoWs feed for the coming week (DEMO_KEY, cached 6h). */
(function () {
  'use strict';
  var S = window.P, c = S.card('mod-asteroid');
  var KEY = 'pantau_neo_cache';
  function fmtDate(d) { return d.toISOString().slice(0, 10); }
  function render(data) {
    var items = [];
    Object.keys(data.near_earth_objects || {}).forEach(function (day) {
      (data.near_earth_objects[day] || []).forEach(function (n) {
        var ca = (n.close_approach_data || [])[0] || {};
        var dia = n.estimated_diameter && n.estimated_diameter.meters;
        items.push({
          name: n.name, pha: !!n.is_potentially_hazardous_asteroid,
          dia: dia ? (dia.estimated_diameter_min + dia.estimated_diameter_max) / 2 : 0,
          vel: ca.relative_velocity ? parseFloat(ca.relative_velocity.kilometers_per_hour) : 0,
          missKm: ca.miss_distance ? parseFloat(ca.miss_distance.kilometers) : 0,
          missLd: ca.miss_distance ? parseFloat(ca.miss_distance.lunar) : 0,
          date: ca.close_approach_date_full || day
        });
      });
    });
    items.sort(function (a, b) { return a.missKm - b.missKm; });
    var phaCount = items.filter(function (i) { return i.pha; }).length;
    c.set(phaCount ? 'warn' : 'ok', items.length + ' OBJEK MINGGU INI');
    c.body.innerHTML =
      '<p class="empty">' + items.length + ' asteroid melintas dekat Bumi dalam 7 hari ke depan · ' +
      phaCount + ' berlabel potensi berbahaya (klasifikasi NASA = orbit &amp; ukuran memenuhi ambang pantau). Yang terdekat:</p>' +
      '<ul class="list">' + items.slice(0, 8).map(function (i) {
        return '<li><span><b>' + S.esc(i.name) + '</b> ' + (i.pha ? '<span class="tag red">POTENSI BERBAHAYA</span>' : '') +
          '<br><span class="r" style="text-align:left">Ø ±' + Math.round(i.dia) + ' m · ' + Math.round(i.vel).toLocaleString('id-ID') + ' km/jam · ' + S.esc(i.date) + '</span></span>' +
          '<span class="r">jarak ' + i.missLd.toFixed(1) + '× Bumi–Bulan<br>(' + Math.round(i.missKm).toLocaleString('id-ID') + ' km)</span></li>';
      }).join('') + '</ul>' +
      '<p class="empty" style="margin-top:6px">Sumber: NASA NeoWs. "Dekat" di sini skala antariksa — yang terdekat pun masih jutaan km.</p>';
  }
  try {
    var cache = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (cache && (Date.now() - cache.at) < 6 * 3600 * 1000 && cache.data) { render(cache.data); return; }
  } catch (e) { /* ignore */ }
  var now = new Date(), end = new Date(Date.now() + 6 * 86400000);
  var url = 'https://api.nasa.gov/neo/rest/v1/feed?start_date=' + fmtDate(now) + '&end_date=' + fmtDate(end) + '&api_key=DEMO_KEY';
  S.fetchJson(url, 25000).then(function (r) {
    if (r.ok && r.data && r.data.near_earth_objects) {
      try { localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), data: r.data })); } catch (e) { /* ignore */ }
      render(r.data);
    } else {
      c.set('error', 'GAGAL');
      c.body.innerHTML = '<p class="errtext">NASA NeoWs tidak merespons (kuota kunci demo bersama sedang habis — coba lagi nanti).</p>';
    }
  });
})();
