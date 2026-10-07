/* PANTAU — shared helpers: cards, fetch, location, clock. */
(function () {
  'use strict';
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fetchJson(url, timeoutMs, headers) {
    timeoutMs = timeoutMs || 15000;
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs) : null;
    var opts = { headers: headers || {} };
    if (ctrl) opts.signal = ctrl.signal;
    return fetch(url, opts).then(function (res) {
      return res.text().then(function (t) {
        var data = null;
        try { data = JSON.parse(t); } catch (e) { data = null; }
        if (timer) clearTimeout(timer);
        return { ok: res.ok, status: res.status, data: data };
      });
    }).catch(function (err) {
      if (timer) clearTimeout(timer);
      return { ok: false, status: 0, error: String(err && err.message || err) };
    });
  }
  function card(id) {
    var root = document.getElementById(id);
    return {
      root: root,
      body: root.querySelector('[data-body]'),
      pill: root.querySelector('[data-pill]'),
      set: function (kind, text) {
        this.pill.className = 'pill ' + kind;
        this.pill.textContent = text;
      }
    };
  }
  /* Location: stored choice or Makassar default. {lat, lon, label} */
  var LOC_KEY = 'pantau_loc';
  function getLoc() {
    try {
      var s = JSON.parse(localStorage.getItem(LOC_KEY) || 'null');
      if (s && typeof s.lat === 'number') return s;
    } catch (e) { /* ignore */ }
    return { lat: -5.1476, lon: 119.4327, label: 'Makassar (bawaan)' };
  }
  function setLoc(loc) {
    try { localStorage.setItem(LOC_KEY, JSON.stringify(loc)); } catch (e) { /* ignore */ }
    renderLocLabel();
  }
  function renderLocLabel() {
    var l = getLoc();
    var el = document.getElementById('locLabel');
    if (el) el.textContent = '📍 Lokasi pantau: ' + l.label + ' (' + l.lat.toFixed(3) + ', ' + l.lon.toFixed(3) + ')';
  }
  document.getElementById('locBtn').addEventListener('click', function () {
    if (!navigator.geolocation) { alert('Browser ini tidak mendukung geolokasi.'); return; }
    navigator.geolocation.getCurrentPosition(function (p) {
      setLoc({ lat: p.coords.latitude, lon: p.coords.longitude, label: 'Lokasimu' });
      location.reload();
    }, function () { alert('Izin lokasi ditolak — tetap memakai Makassar.'); });
  });
  /* Category filter chips: show only the chosen group of cards. */
  var nav = document.getElementById('filterNav');
  if (nav) {
    nav.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      nav.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      var f = b.getAttribute('data-f');
      document.querySelectorAll('.card[data-cat]').forEach(function (cardEl) {
        cardEl.style.display = (f === 'semua' || cardEl.getAttribute('data-cat') === f) ? '' : 'none';
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  renderLocLabel();
  var clockEl = document.getElementById('clock');
  function tickClock() {
    var d = new Date();
    clockEl.textContent = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('id-ID') + ' waktu setempat';
  }
  tickClock(); setInterval(tickClock, 1000);

  window.P = { esc: esc, fetchJson: fetchJson, card: card, getLoc: getLoc };
})();
