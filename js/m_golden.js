/* Golden Hour Countdown + moon phase — pure local solar math (NOAA approximation),
   computed for the chosen location. No API involved. */
(function () {
  'use strict';
  var S = window.P, c = S.card('mod-golden');
  var loc = S.getLoc();
  var RAD = Math.PI / 180;
  function sunTimes(date, lat, lon) {
    /* NOAA solar calculator approximation */
    var start = Date.UTC(date.getUTCFullYear(), 0, 0);
    var doy = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86400000);
    var lngHour = lon / 15;
    function calc(isRise) {
      var t = doy + ((isRise ? 6 : 18) - lngHour) / 24;
      var M = (0.9856 * t) - 3.289;
      var L = (M + 1.916 * Math.sin(M * RAD) + 0.020 * Math.sin(2 * M * RAD) + 282.634) % 360;
      var RA = Math.atan(0.91764 * Math.tan(L * RAD)) / RAD;
      RA = (RA + 360) % 360;
      RA += (Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90);
      RA /= 15;
      var sinDec = 0.39782 * Math.sin(L * RAD);
      var cosDec = Math.cos(Math.asin(sinDec));
      var cosH = (Math.cos(90.833 * RAD) - sinDec * Math.sin(lat * RAD)) / (cosDec * Math.cos(lat * RAD));
      if (cosH > 1 || cosH < -1) return null;
      var H = isRise ? (360 - Math.acos(cosH) / RAD) : (Math.acos(cosH) / RAD);
      H /= 15;
      var T = H + RA - 0.06571 * t - 6.622;
      var UT = ((T - lngHour) % 24 + 24) % 24;
      return UT; /* hours UTC */
    }
    return { rise: calc(true), set: calc(false) };
  }
  function toLocal(utcHours, date) {
    var d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    d.setUTCMinutes(Math.round(utcHours * 60));
    return d;
  }
  function moonPhase(date) {
    var synodic = 29.530588853;
    var known = Date.UTC(2000, 0, 6, 18, 14) / 86400000;
    var age = ((date.getTime() / 86400000 - known) % synodic + synodic) % synodic;
    var illum = (1 - Math.cos(2 * Math.PI * age / synodic)) / 2;
    var names = ['Bulan Mati', 'Sabit Awal', 'Kuartal Pertama', 'Cembung Awal', 'Purnama', 'Cembung Akhir', 'Kuartal Terakhir', 'Sabit Akhir'];
    var idx = Math.floor(((age / synodic) * 8 + 0.5)) % 8;
    var icons = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
    return { age: age, illum: illum, name: names[idx], icon: icons[idx] };
  }
  function fmtT(d) { return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); }
  function render() {
    var now = new Date();
    var st = sunTimes(now, loc.lat, loc.lon);
    if (!st || st.rise == null || st.set == null) {
      c.set('error', '—'); c.body.innerHTML = '<p class="empty">Matahari tidak terbit/terbenam normal di lokasi ini hari ini (wilayah kutub).</p>';
      return;
    }
    var rise = toLocal(st.rise, now), set = toLocal(st.set, now);
    var ghMorning = { from: rise, to: new Date(rise.getTime() + 60 * 60000) };
    var ghEvening = { from: new Date(set.getTime() - 60 * 60000), to: set };
    var state, target, label;
    if (now >= ghMorning.from && now <= ghMorning.to) { state = 'SEKARANG'; target = ghMorning.to; label = 'Golden hour PAGI sedang berlangsung — berakhir'; }
    else if (now >= ghEvening.from && now <= ghEvening.to) { state = 'SEKARANG'; target = ghEvening.to; label = 'Golden hour SORE sedang berlangsung — berakhir'; }
    else if (now < ghMorning.from) { state = 'HITUNG MUNDUR'; target = ghMorning.from; label = 'Golden hour pagi mulai'; }
    else if (now < ghEvening.from) { state = 'HITUNG MUNDUR'; target = ghEvening.from; label = 'Golden hour sore mulai'; }
    else {
      var tm = new Date(now.getTime() + 86400000), st2 = sunTimes(tm, loc.lat, loc.lon);
      target = toLocal(st2.rise, tm); state = 'BESOK'; label = 'Golden hour berikutnya (pagi besok) mulai';
    }
    var diff = Math.max(0, target - now), s = Math.floor(diff / 1000);
    var hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    var mp = moonPhase(now);
    c.set(state === 'SEKARANG' ? 'warn' : 'ok', state);
    c.body.innerHTML =
      '<p class="empty">' + label + ' pukul <b>' + fmtT(target) + '</b> · ' + S.esc(loc.label) + '</p>' +
      '<p class="big">' + (hh > 0 ? hh + 'j ' : '') + mm + 'm ' + ss + 'd</p>' +
      '<dl class="kv"><dt>Terbit</dt><dd>' + fmtT(rise) + '</dd>' +
      '<dt>Golden hour pagi</dt><dd>' + fmtT(ghMorning.from) + ' – ' + fmtT(ghMorning.to) + '</dd>' +
      '<dt>Golden hour sore</dt><dd>' + fmtT(ghEvening.from) + ' – ' + fmtT(ghEvening.to) + '</dd>' +
      '<dt>Terbenam</dt><dd>' + fmtT(set) + '</dd>' +
      '<dt>Bulan malam ini</dt><dd>' + mp.icon + ' ' + mp.name + ' · terang ' + Math.round(mp.illum * 100) + '% · umur ' + mp.age.toFixed(1) + ' hari</dd></dl>' +
      '<p class="empty" style="margin-top:6px">Dihitung lokal dari posisi matahari (aproksimasi NOAA) — tanpa server, tanpa API.</p>';
  }
  render(); setInterval(render, 1000);
})();
