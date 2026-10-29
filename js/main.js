/* ==================================================================
 * Rounds — main.js
 * Hospital management system template by uiCookies.
 * Vanilla JavaScript only (Bootstrap 5 bundle for offcanvas, modals and
 * dropdowns). One function per feature, each guarded against missing
 * elements, so the same file serves every page.
 * ================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------------
   * Chart data. Edit these arrays to change the demo charts.
   * ---------------------------------------------------------------- */
  var DATA = {
    /* Bed occupancy by ward (index.html) — beds = staffed capacity */
    wards: [
      { code: "ICU", name: "Intensive Care", short: "Intensive", beds: 12, occupied: 11 },
      { code: "CCU", name: "Coronary Care", short: "Coronary", beds: 8, occupied: 7 },
      { code: "3A", name: "Cardiology", short: "Cardio", beds: 24, occupied: 20 },
      { code: "4B", name: "General Medicine", short: "Gen Med", beds: 40, occupied: 38 },
      { code: "4C", name: "Respiratory", short: "Resp", beds: 28, occupied: 25 },
      { code: "5A", name: "General Surgery", short: "Surgery", beds: 36, occupied: 30 },
      { code: "5C", name: "Orthopaedics", short: "Ortho", beds: 28, occupied: 21 },
      { code: "6A", name: "Oncology", short: "Oncology", beds: 22, occupied: 19 },
      { code: "6B", name: "Neurology & Stroke", short: "Neuro", beds: 20, occupied: 17 },
      { code: "7A", name: "Paediatrics", short: "Paeds", beds: 30, occupied: 18 },
      { code: "2M", name: "Maternity", short: "Maternity", beds: 26, occupied: 20 },
      { code: "2B", name: "Elder Care", short: "Elder", beds: 34, occupied: 32 },
      { code: "AMU", name: "Acute Medical Unit", short: "Acute Med", beds: 32, occupied: 28 }
    ],
    /* Daily admissions and discharges, last 14 days (index.html) */
    flow: {
      days: ["Thu 10", "Fri 11", "Sat 12", "Sun 13", "Mon 14", "Tue 15", "Wed 16", "Thu 17", "Fri 18", "Sat 19", "Sun 20", "Mon 21", "Tue 22", "Wed 23"],
      admissions: [58, 61, 49, 47, 63, 66, 59, 57, 62, 51, 48, 64, 68, 60],
      discharges: [60, 66, 41, 38, 55, 61, 63, 60, 67, 43, 39, 58, 62, 57]
    },
    /* Observations every 4 hours, last 72 hours (patient.html) */
    vitals: {
      times: ["Mon 08:00", "Mon 12:00", "Mon 16:00", "Mon 20:00", "Tue 00:00", "Tue 04:00", "Tue 08:00", "Tue 12:00", "Tue 16:00", "Tue 20:00", "Wed 00:00", "Wed 04:00", "Wed 08:00", "Wed 12:00", "Wed 16:00", "Wed 20:00", "Thu 00:00", "Thu 04:00", "Thu 08:00"],
      hr: [104, 102, 99, 101, 97, 95, 96, 94, 98, 93, 91, 94, 90, 92, 89, 91, 88, 90, 88],
      sys: [146, 142, 139, 141, 136, 134, 131, 133, 130, 128, 127, 129, 125, 126, 123, 125, 122, 126, 124],
      dia: [88, 86, 84, 85, 82, 81, 80, 80, 78, 77, 76, 78, 75, 76, 74, 75, 73, 75, 74],
      spo2: [91, 91, 92, 92, 92, 93, 93, 92, 93, 94, 94, 93, 94, 95, 94, 95, 95, 94, 94],
      rr: [24, 24, 23, 23, 22, 22, 22, 21, 22, 21, 20, 21, 20, 20, 19, 20, 19, 20, 21],
      temp: [37.6, 37.4, 37.2, 37.5, 37.1, 36.9, 37.0, 37.2, 36.9, 36.8, 37.0, 37.1, 36.8, 36.9, 37.0, 37.2, 36.9, 37.0, 37.3]
    }
  };

  var NS = "http://www.w3.org/2000/svg";
  var DEMO_DAY = new Date(2026, 8, 24); /* the dataset's "today": Thursday 24 September */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------------
   * Small helpers
   * ---------------------------------------------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function svg(tag, attrs, parent) {
    var el = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(el);
    return el;
  }

  function svgText(parent, x, y, text, attrs) {
    var a = attrs || {};
    a.x = x; a.y = y;
    var t = svg("text", a, parent);
    t.textContent = text;
    return t;
  }

  /* Re-render a chart whenever its container changes width. */
  function onWidth(el, fn) {
    var last = 0;
    function run() {
      var w = Math.round(el.clientWidth);
      if (w && w !== last) { last = w; fn(w); }
    }
    if ("ResizeObserver" in window) new ResizeObserver(run).observe(el);
    else window.addEventListener("resize", run);
    run();
  }

  function clockNow() {
    var d = new Date();
    return pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  }

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  var TINTS = ["navy", "teal", "coral", "amber", "sky", "slate"];
  function tintOf(name) {
    var sum = 0;
    for (var i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return TINTS[sum % TINTS.length];
  }
  function initialsOf(name) {
    var parts = name.replace(/^Dr\.\s+/, "").trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  function avatar(name, size) {
    return '<span class="av av--' + tintOf(name) + (size ? " av--" + size : "") + '" aria-hidden="true">' + esc(initialsOf(name)) + "</span>";
  }
  function shortName(name) {
    var dr = /^Dr\.\s+/.test(name);
    var parts = name.replace(/^Dr\.\s+/, "").trim().split(/\s+/);
    var s = parts[0][0] + ". " + parts[parts.length - 1];
    return dr ? "Dr. " + s : s;
  }

  /* Seeded random numbers so generated demo days stay the same. */
  function seeded(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  /* Polite status messages: visible toast + screen reader announcement. */
  var liveTimer;
  function announce(msg) {
    var live = document.getElementById("live");
    if (!live) return;
    live.textContent = msg;
    live.classList.add("is-on");
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () { live.classList.remove("is-on"); }, 3600);
  }

  function bsModal(el) { return window.bootstrap && el ? window.bootstrap.Modal.getOrCreateInstance(el) : null; }

  /* ----------------------------------------------------------------
   * Light / dark theme toggle (stored per browser)
   * ---------------------------------------------------------------- */
  function initTheme() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var root = document.documentElement;
    function sync() {
      var dark = root.getAttribute("data-bs-theme") === "dark";
      btn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
      btn.setAttribute("title", dark ? "Light theme" : "Dark theme");
    }
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
      // Switch instantly: no colour transitions while the palette flips.
      root.classList.add("theme-switching");
      root.setAttribute("data-bs-theme", next);
      void root.offsetWidth;
      requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove("theme-switching"); }); });
      try { localStorage.setItem("rounds-theme", next); } catch (e) { /* storage unavailable */ }
      sync();
    });
    sync();
  }

  /* ----------------------------------------------------------------
   * Sidebar: collapse to an icon rail on desktop (offcanvas on mobile
   * is handled by Bootstrap's offcanvas-lg).
   * ---------------------------------------------------------------- */
  function initSidebar() {
    var btn = document.getElementById("sidebar-collapse");
    if (!btn) return;
    var root = document.documentElement;
    function sync() {
      var collapsed = root.classList.contains("sidebar-collapsed");
      btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      btn.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
    }
    btn.addEventListener("click", function () {
      root.classList.toggle("sidebar-collapsed");
      try { localStorage.setItem("rounds-sidebar", root.classList.contains("sidebar-collapsed") ? "collapsed" : "open"); } catch (e) { /* ignore */ }
      sync();
    });
    sync();

    // Close the mobile drawer after choosing a link.
    var drawer = document.getElementById("sidebar");
    if (!drawer) return;
    $$(".side-link", drawer).forEach(function (link) {
      link.addEventListener("click", function () {
        var inst = window.bootstrap && window.bootstrap.Offcanvas.getInstance(drawer);
        if (inst && drawer.classList.contains("show")) inst.hide();
      });
    });
  }

  /* ----------------------------------------------------------------
   * "/" focuses the global patient search
   * ---------------------------------------------------------------- */
  function initSearchShortcut() {
    var input = document.getElementById("global-search");
    if (!input) return;
    document.addEventListener("keydown", function (e) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      input.focus();
    });
  }

  /* ----------------------------------------------------------------
   * Notifications menu: mark all read
   * ---------------------------------------------------------------- */
  function initNotifications() {
    var btn = document.getElementById("notif-read");
    if (!btn) return;
    btn.addEventListener("click", function () {
      $$(".notif-item.is-unread").forEach(function (n) { n.classList.remove("is-unread"); });
      var badge = document.getElementById("notif-count");
      if (badge) badge.hidden = true;
      var trigger = document.getElementById("notif-btn");
      if (trigger) trigger.setAttribute("aria-label", "Notifications, none unread");
      btn.disabled = true;
      announce("All notifications marked as read");
    });
  }

  /* ----------------------------------------------------------------
   * Critical alerts: acknowledge
   * ---------------------------------------------------------------- */
  function initAlerts() {
    var list = $(".alert-list");
    if (!list) return;
    var count = document.getElementById("alert-count");
    list.addEventListener("click", function (e) {
      var btn = e.target.closest(".alert-ack");
      if (!btn) return;
      var item = btn.closest(".alert-item");
      item.classList.add("is-ack");
      var title = $(".alert-title", item).textContent.replace(/^(Critical|Warning|Notice): /, "");
      var tag = document.createElement("span");
      tag.className = "alert-acked";
      tag.textContent = "Acknowledged " + clockNow();
      btn.replaceWith(tag);
      var open = $$(".alert-item:not(.is-ack)", list).length;
      if (count) {
        count.textContent = open;
        count.classList.toggle("count-badge--coral", open > 0);
      }
      announce("Acknowledged: " + title + ". " + open + " alerts open.");
      var next = $(".alert-item:not(.is-ack) .alert-ack", list);
      if (next) next.focus();
    });
  }

  /* ----------------------------------------------------------------
   * KPI sparklines from data-values
   * ---------------------------------------------------------------- */
  function initSparklines() {
    $$("svg.spark[data-values]").forEach(function (s) {
      var v = s.getAttribute("data-values").split(",").map(Number);
      if (v.length < 2) return;
      var w = 92, h = 34;
      var min = Math.min.apply(null, v), max = Math.max.apply(null, v), span = max - min || 1;
      var pts = v.map(function (y, i) {
        return [2 + i * (w - 6) / (v.length - 1), h - 4 - (y - min) / span * (h - 10)];
      });
      var line = pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
      s.setAttribute("viewBox", "0 0 " + w + " " + h);
      svg("path", { d: "M" + line.replace(/ /g, "L") + "L" + pts[pts.length - 1][0].toFixed(1) + "," + h + "L2," + h + "Z", class: "sp-area" }, s);
      svg("polyline", { points: line, class: "sp-line" }, s);
      var last = pts[pts.length - 1];
      svg("circle", { cx: last[0], cy: last[1], r: 2.8, class: "sp-dot" }, s);
    });
  }

  /* ----------------------------------------------------------------
   * Bed occupancy by ward — horizontal SVG bars
   * ---------------------------------------------------------------- */
  function initWardChart() {
    var fig = document.getElementById("ward-chart");
    if (!fig || !DATA.wards) return;
    var rows = DATA.wards.slice().sort(function (a, b) { return b.occupied / b.beds - a.occupied / a.beds; });
    var host = document.createElement("div");
    fig.insertBefore(host, fig.firstChild);
    fig.classList.add("is-drawn");

    onWidth(host, function (w) {
      var narrow = w < 520;
      var labelW = narrow ? 104 : 196, valueW = narrow ? 42 : 96;
      var top = 22, rowH = narrow ? 28 : 30, barH = 12, bottom = 22;
      var plotW = Math.max(60, w - labelW - valueW - 10);
      var h = top + rows.length * rowH + bottom;
      host.innerHTML = "";
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, width: w, height: h, "aria-hidden": "true", focusable: "false" }, host);

      (narrow ? [0, 50, 100] : [0, 25, 50, 75, 100]).forEach(function (p) {
        var x = labelW + plotW * p / 100;
        svg("line", { x1: x, x2: x, y1: top - 4, y2: h - bottom + 2, class: "c-grid" + (p ? " c-grid--dash" : "") }, s);
        svgText(s, x, 11, p + "%", { "text-anchor": p === 0 ? "start" : p === 100 ? "end" : "middle" });
      });

      rows.forEach(function (r, i) {
        var pct = r.occupied / r.beds * 100;
        var cy = top + i * rowH + rowH / 2;
        var cls = pct >= 95 ? "crit" : pct >= 85 ? "warn" : "ok";
        var g = svg("g", {}, s);
        svg("title", {}, g).textContent = r.code + " " + r.name + ": " + r.occupied + " of " + r.beds + " beds occupied (" + Math.round(pct) + "%)";
        svgText(g, 0, cy + 4, r.code, { class: "c-code" });
        svgText(g, narrow ? 34 : 40, cy + 4, narrow ? r.short : r.name, { class: "c-label" });
        svg("rect", { x: labelW, y: cy - barH / 2, width: plotW, height: barH, rx: 3, class: "c-track" }, g);
        var bar = svg("rect", { x: labelW, y: cy - barH / 2, width: plotW * pct / 100, height: barH, rx: 3, class: "c-bar c-bar--" + cls }, g);
        if (!reduceMotion && !fig.dataset.animated) {
          bar.style.transformOrigin = labelW + "px 0";
          bar.style.transform = "scaleX(0)";
          bar.style.transition = "transform .7s cubic-bezier(.2,.7,.2,1) " + (i * 35) + "ms";
          requestAnimationFrame(function () { requestAnimationFrame(function () { bar.style.transform = "scaleX(1)"; }); });
        }
        svgText(g, w, cy + 4, Math.round(pct) + "%", { "text-anchor": "end", class: "c-value" });
        if (!narrow) svgText(g, w - 42, cy + 4, r.occupied + "/" + r.beds, { "text-anchor": "end", class: "c-value-sub" });
      });

      var tx = labelW + plotW * 0.85;
      svg("line", { x1: tx, x2: tx, y1: top - 4, y2: h - bottom + 4, class: "c-target" }, s);
      svgText(s, tx, h - 4, "85% limit", { "text-anchor": "middle", class: "c-target-label" });
      fig.dataset.animated = "1";
    });
  }

  /* ----------------------------------------------------------------
   * Shared line-chart renderer (patient flow, vitals)
   * ---------------------------------------------------------------- */
  function makeInteractive(fig, host, opts) {
    var tip = document.createElement("div");
    tip.className = "chart-tip";
    tip.setAttribute("aria-hidden", "true");
    var sr = document.createElement("p");
    sr.className = "visually-hidden";
    sr.setAttribute("aria-live", "polite");
    fig.appendChild(tip);
    fig.appendChild(sr);
    host.tabIndex = 0;
    host.classList.add("chart-focus");
    host.setAttribute("role", "group");
    host.setAttribute("aria-label", opts.label + ". Use the left and right arrow keys to read each point.");

    var api = { index: -1, geom: null };
    api.show = function (i, speak) {
      var g = api.geom;
      if (!g) return;
      i = Math.max(0, Math.min(g.n - 1, i));
      api.index = i;
      var x = g.X(i);
      g.cross.setAttribute("x1", x);
      g.cross.setAttribute("x2", x);
      g.cross.style.display = "";
      g.marks.forEach(function (m) {
        var v = m.values[i];
        if (v == null || m.off) { m.el.style.display = "none"; return; }
        m.el.setAttribute("cx", x);
        m.el.setAttribute("cy", g.Y(v));
        m.el.style.display = "";
      });
      tip.innerHTML = opts.tip(i);
      tip.classList.add("is-on");
      var fw = fig.clientWidth, tw = tip.offsetWidth;
      var left = host.offsetLeft + x + 14;
      if (left + tw > fw) left = host.offsetLeft + x - tw - 14;
      tip.style.transform = "translate(" + Math.max(0, left) + "px," + (host.offsetTop + g.pad.t) + "px)";
      if (speak) sr.textContent = opts.speak(i);
    };
    api.hide = function () {
      tip.classList.remove("is-on");
      if (api.geom) {
        api.geom.cross.style.display = "none";
        api.geom.marks.forEach(function (m) { m.el.style.display = "none"; });
      }
    };
    host.addEventListener("keydown", function (e) {
      if (!api.geom) return;
      var i = api.index < 0 ? api.geom.n - 1 : api.index;
      if (e.key === "ArrowRight") i++;
      else if (e.key === "ArrowLeft") i--;
      else if (e.key === "Home") i = 0;
      else if (e.key === "End") i = api.geom.n - 1;
      else return;
      e.preventDefault();
      api.show(i, true);
    });
    host.addEventListener("focus", function () { if (api.geom) api.show(api.index < 0 ? api.geom.n - 1 : api.index, true); });
    host.addEventListener("blur", api.hide);
    return api;
  }

  function attachHit(s, api, pad, pw, ph, step) {
    var hit = svg("rect", { x: pad.l, y: pad.t, width: pw, height: ph, class: "c-hit" }, s);
    hit.addEventListener("pointermove", function (e) {
      var r = s.getBoundingClientRect();
      api.show(Math.floor((e.clientX - r.left - pad.l) / step));
    });
    hit.addEventListener("pointerleave", api.hide);
  }

  /* ----------------------------------------------------------------
   * Patient flow — admissions vs discharges line chart
   * ---------------------------------------------------------------- */
  function initFlowChart() {
    var fig = document.getElementById("flow-chart");
    if (!fig || !DATA.flow) return;
    var F = DATA.flow;
    var state = { range: 14, show: { admissions: true, discharges: true } };
    var host = document.createElement("div");
    fig.insertBefore(host, fig.firstChild);
    fig.classList.add("is-drawn");
    var width = 0;

    function view() {
      var start = F.days.length - state.range;
      return { days: F.days.slice(start), admissions: F.admissions.slice(start), discharges: F.discharges.slice(start) };
    }

    var api = makeInteractive(fig, host, {
      label: "Admissions and discharges per day",
      tip: function (i) {
        var d = view();
        var net = d.admissions[i] - d.discharges[i];
        return "<b>" + esc(d.days[i]) + " Sep</b>" +
          '<div class="tip-row"><span><i style="--k:var(--c-primary)"></i>Admissions</span><span>' + d.admissions[i] + "</span></div>" +
          '<div class="tip-row"><span><i style="--k:var(--c-secondary)"></i>Discharges</span><span>' + d.discharges[i] + "</span></div>" +
          '<div class="tip-row"><span>Net</span><span>' + (net > 0 ? "+" : "") + net + "</span></div>";
      },
      speak: function (i) {
        var d = view();
        return d.days[i] + " September: " + d.admissions[i] + " admissions, " + d.discharges[i] + " discharges.";
      }
    });

    function totals() {
      var d = view();
      var a = d.admissions.reduce(function (x, y) { return x + y; }, 0);
      var b = d.discharges.reduce(function (x, y) { return x + y; }, 0);
      var sa = document.getElementById("flow-sum-admissions"), sd = document.getElementById("flow-sum-discharges"), net = document.getElementById("flow-net");
      if (sa) sa.textContent = a;
      if (sd) sd.textContent = b;
      if (net) net.textContent = "Net " + (a - b > 0 ? "+" : "") + (a - b) + " beds over " + state.range + " days";
    }

    function render() {
      var w = width;
      if (!w) return;
      var d = view(), n = d.days.length;
      var h = w < 520 ? 220 : 262;
      var pad = { l: 34, r: 8, t: 12, b: 28 };
      var pw = w - pad.l - pad.r, ph = h - pad.t - pad.b, step = pw / n;
      var pool = [];
      if (state.show.admissions) pool = pool.concat(d.admissions);
      if (state.show.discharges) pool = pool.concat(d.discharges);
      if (!pool.length) pool = d.admissions.concat(d.discharges);
      var lo = Math.floor((Math.min.apply(null, pool) - 3) / 10) * 10;
      var hi = Math.ceil((Math.max.apply(null, pool) + 3) / 10) * 10;
      function X(i) { return pad.l + step * (i + 0.5); }
      function Y(v) { return pad.t + ph - (v - lo) / (hi - lo) * ph; }

      host.innerHTML = "";
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, width: w, height: h, "aria-hidden": "true", focusable: "false" }, host);
      var defs = svg("defs", {}, s);
      var grad = svg("linearGradient", { id: "flow-fill", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      svg("stop", { offset: "0%", class: "c-area-stop", "stop-opacity": 0.16 }, grad);
      svg("stop", { offset: "100%", class: "c-area-stop", "stop-opacity": 0 }, grad);

      d.days.forEach(function (day, i) {
        if (/^(Sat|Sun)/.test(day)) svg("rect", { x: pad.l + step * i, y: pad.t, width: step, height: ph, class: "c-weekend" }, s);
      });
      for (var v = lo; v <= hi; v += 10) {
        svg("line", { x1: pad.l, x2: w - pad.r, y1: Y(v), y2: Y(v), class: "c-grid" + (v === lo ? "" : " c-grid--dash") }, s);
        svgText(s, pad.l - 8, Y(v) + 4, v, { "text-anchor": "end" });
      }
      var every = step < 26 ? 2 : 1;
      d.days.forEach(function (day, i) {
        if ((n - 1 - i) % every) return;
        var parts = day.split(" ");
        svgText(s, X(i), h - 8, step < 46 ? parts[1] : day, { "text-anchor": "middle" });
      });

      var series = [
        { key: "admissions", cls: "a", values: d.admissions },
        { key: "discharges", cls: "b", values: d.discharges }
      ];
      if (state.show.admissions) {
        var area = "M" + X(0) + "," + Y(d.admissions[0]);
        d.admissions.forEach(function (val, i) { area += "L" + X(i) + "," + Y(val); });
        area += "L" + X(n - 1) + "," + (pad.t + ph) + "L" + X(0) + "," + (pad.t + ph) + "Z";
        svg("path", { d: area, fill: "url(#flow-fill)" }, s);
      }
      series.forEach(function (ser) {
        if (!state.show[ser.key]) return;
        var p = ser.values.map(function (val, i) { return X(i).toFixed(1) + "," + Y(val).toFixed(1); }).join("L");
        svg("path", { d: "M" + p, class: "c-line c-line--" + ser.cls }, s);
        if (step >= 22) ser.values.forEach(function (val, i) { svg("circle", { cx: X(i), cy: Y(val), r: 2.6, class: "c-dot c-dot--" + ser.cls }, s); });
      });

      var cross = svg("line", { y1: pad.t, y2: pad.t + ph, x1: 0, x2: 0, class: "c-cross" }, s);
      cross.style.display = "none";
      var marks = series.map(function (ser) {
        var el = svg("circle", { r: 5, class: "c-dot c-dot--" + ser.cls, "stroke-width": 3 }, s);
        el.style.display = "none";
        return { el: el, values: ser.values, off: !state.show[ser.key] };
      });
      attachHit(s, api, pad, pw, ph, step);
      api.geom = { X: X, Y: Y, n: n, cross: cross, marks: marks, pad: pad };
      api.index = Math.min(api.index, n - 1);
      totals();
    }

    $$("[data-range]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.range = +b.getAttribute("data-range");
        $$("[data-range]").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        api.index = -1;
        api.hide();
        render();
      });
    });
    $$(".legend-btn[data-series]").forEach(function (b) {
      b.addEventListener("click", function () {
        var key = b.getAttribute("data-series");
        state.show[key] = !state.show[key];
        b.setAttribute("aria-pressed", state.show[key] ? "true" : "false");
        render();
      });
    });
    onWidth(host, function (w) { width = w; render(); });
  }

  /* ----------------------------------------------------------------
   * Vitals trend — bedside-monitor style chart with normal band
   * ---------------------------------------------------------------- */
  function initVitalsChart() {
    var fig = document.getElementById("vitals-chart");
    if (!fig || !DATA.vitals) return;
    var V = DATA.vitals;
    var M = {
      hr: { label: "Heart rate", unit: "bpm", lo: 51, hi: 90, min: 40, max: 130, ticks: [40, 60, 80, 100, 120], keys: ["hr"] },
      bp: { label: "Blood pressure", unit: "mmHg", lo: 111, hi: 140, min: 50, max: 170, ticks: [60, 90, 120, 150], keys: ["sys", "dia"] },
      spo2: { label: "SpO2", unit: "%", lo: 96, hi: 100, min: 86, max: 100, ticks: [88, 92, 96, 100], keys: ["spo2"] },
      rr: { label: "Respiratory rate", unit: "per min", lo: 12, hi: 20, min: 8, max: 30, ticks: [10, 15, 20, 25, 30], keys: ["rr"] },
      temp: { label: "Temperature", unit: "°C", lo: 36.1, hi: 38, min: 35.5, max: 39, ticks: [36, 37, 38, 39], keys: ["temp"] }
    };
    var metric = "hr", width = 0;
    var host = document.createElement("div");
    fig.insertBefore(host, fig.firstChild);
    fig.classList.add("is-drawn");
    fig.setAttribute("data-metric", metric);

    function fmt(key, i) {
      if (key === "bp") return V.sys[i] + "/" + V.dia[i];
      return key === "temp" ? V.temp[i].toFixed(1) : V[key][i];
    }

    var api = makeInteractive(fig, host, {
      label: "Vital signs over 72 hours",
      tip: function (i) {
        var m = M[metric];
        return "<b>" + esc(V.times[i]) + "</b>" + '<div class="tip-row"><span>' + m.label + "</span><span>" + fmt(metric, i) + " " + esc(m.unit) + "</span></div>";
      },
      speak: function (i) { var m = M[metric]; return V.times[i] + ": " + m.label + " " + fmt(metric, i) + " " + m.unit; }
    });

    function render() {
      var w = width;
      if (!w) return;
      var m = M[metric], n = V.times.length;
      // Fill the panel when it is stretched beside the side column.
      host.innerHTML = "";
      var avail = fig.clientHeight - 20;
      var h = Math.max(w < 520 ? 210 : 260, Math.min(avail, 440));
      var pad = { l: 34, r: 10, t: 14, b: 26 };
      var pw = w - pad.l - pad.r, ph = h - pad.t - pad.b, step = pw / (n - 1);
      function X(i) { return pad.l + step * i; }
      function Y(v) { return pad.t + ph - (v - m.min) / (m.max - m.min) * ph; }

      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, width: w, height: h, "aria-hidden": "true", focusable: "false" }, host);
      svg("rect", { x: pad.l, y: Y(m.hi), width: pw, height: Y(m.lo) - Y(m.hi), class: "c-band" }, s);
      [m.lo, m.hi].forEach(function (v) { svg("line", { x1: pad.l, x2: w - pad.r, y1: Y(v), y2: Y(v), class: "c-band-edge" }, s); });
      svgText(s, w - pad.r - 6, Y(m.lo) - 6, (metric === "bp" ? "systolic " : "normal ") + m.lo + "–" + m.hi, { "text-anchor": "end", class: "c-band-label" });
      m.ticks.forEach(function (v) {
        svg("line", { x1: pad.l, x2: w - pad.r, y1: Y(v), y2: Y(v), class: "c-grid" }, s);
        svgText(s, pad.l - 8, Y(v) + 4, v, { "text-anchor": "end" });
      });
      V.times.forEach(function (t, i) {
        if (i % 6) return;
        var label = w < 520 ? t.split(" ")[0] : t;
        svgText(s, X(i), h - 7, label, { "text-anchor": i === 0 ? "start" : i === n - 1 ? "end" : "middle" });
      });

      var marks = [];
      if (metric === "bp") {
        V.sys.forEach(function (sys, i) {
          var x = X(i);
          svg("line", { x1: x, x2: x, y1: Y(sys), y2: Y(V.dia[i]), class: "c-bp-tick" }, s);
          svg("line", { x1: x - 4, x2: x + 4, y1: Y(sys), y2: Y(sys), class: "c-bp-tick" }, s);
          svg("line", { x1: x - 4, x2: x + 4, y1: Y(V.dia[i]), y2: Y(V.dia[i]), class: "c-bp-tick" }, s);
        });
        ["sys", "dia"].forEach(function (k) {
          svg("path", { d: "M" + V[k].map(function (v, i) { return X(i).toFixed(1) + "," + Y(v).toFixed(1); }).join("L"), class: "c-mon", "stroke-width": 1.25, opacity: 0.55 }, s);
          var el = svg("circle", { r: 5, class: "c-mon-dot" }, s);
          el.style.display = "none";
          marks.push({ el: el, values: V[k] });
        });
      } else {
        var vals = V[metric];
        svg("path", { d: "M" + vals.map(function (v, i) { return X(i).toFixed(1) + "," + Y(v).toFixed(1); }).join("L"), class: "c-mon" }, s);
        vals.forEach(function (v, i) {
          var out = v < m.lo || v > m.hi;
          svg("circle", { cx: X(i), cy: Y(v), r: out ? 3.4 : 2.6, class: "c-mon-dot" + (out ? " is-out" : "") }, s);
        });
        var mk = svg("circle", { r: 6, class: "c-mon-dot" }, s);
        mk.style.display = "none";
        marks.push({ el: mk, values: vals });
      }
      var cross = svg("line", { y1: pad.t, y2: pad.t + ph, x1: 0, x2: 0, class: "c-cross" }, s);
      cross.style.display = "none";
      // hit areas centred on each reading
      var hit = svg("rect", { x: pad.l - step / 2, y: pad.t, width: pw + step, height: ph, class: "c-hit" }, s);
      hit.addEventListener("pointermove", function (e) {
        var r = s.getBoundingClientRect();
        api.show(Math.round((e.clientX - r.left - pad.l) / step));
      });
      hit.addEventListener("pointerleave", api.hide);
      api.geom = { X: X, Y: Y, n: n, cross: cross, marks: marks, pad: pad };
    }

    $$("[data-metric]", fig.closest(".panel")).forEach(function (b) {
      if (b === fig) return;
      b.addEventListener("click", function () {
        metric = b.getAttribute("data-metric");
        fig.setAttribute("data-metric", metric);
        $$(".seg-btn[data-metric]").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        api.hide();
        render();
      });
    });
    onWidth(host, function (w) { width = w; render(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
  }

  /* ----------------------------------------------------------------
   * Inpatient list: search, filters, sorting, pagination
   * ---------------------------------------------------------------- */
  function initPatientTable() {
    var table = document.getElementById("pt-table");
    if (!table) return;
    var tbody = table.tBodies[0];
    var rows = Array.prototype.slice.call(tbody.rows);
    var q = document.getElementById("pt-q"), fw = document.getElementById("f-ward"),
        fs = document.getElementById("f-status"), fd = document.getElementById("f-doctor"),
        form = document.getElementById("pt-filters"), count = document.getElementById("pt-count"),
        pager = document.getElementById("pt-pager"), empty = document.getElementById("pt-empty");
    var state = { page: 1, per: 10, col: -1, dir: 1 };

    var params = new URLSearchParams(window.location.search);
    if (params.get("q") && q) q.value = params.get("q");
    var global = document.getElementById("global-search");
    if (global && params.get("q")) global.value = params.get("q");

    function matches(r) {
      var term = q ? q.value.trim().toLowerCase() : "";
      if (term && r.getAttribute("data-search").indexOf(term) === -1) return false;
      if (fw && fw.value && r.getAttribute("data-ward") !== fw.value) return false;
      if (fs && fs.value && r.getAttribute("data-status") !== fs.value) return false;
      if (fd && fd.value && r.getAttribute("data-doctor") !== fd.value) return false;
      return true;
    }

    function sortRows() {
      if (state.col < 0) return;
      rows.sort(function (a, b) {
        var x = a.cells[state.col].getAttribute("data-v") || a.cells[state.col].textContent;
        var y = b.cells[state.col].getAttribute("data-v") || b.cells[state.col].textContent;
        var nx = parseFloat(x), ny = parseFloat(y);
        var c = !isNaN(nx) && !isNaN(ny) && /^[\d.]+$/.test(x) && /^[\d.]+$/.test(y) ? nx - ny : x.localeCompare(y);
        return c * state.dir;
      });
      rows.forEach(function (r) { tbody.appendChild(r); });
    }

    function apply(resetPage) {
      if (resetPage) state.page = 1;
      var list = rows.filter(matches);
      rows.forEach(function (r) { r.setAttribute("data-match", "0"); });
      list.forEach(function (r) { r.setAttribute("data-match", "1"); });
      var pages = Math.max(1, Math.ceil(list.length / state.per));
      state.page = Math.min(state.page, pages);
      var start = (state.page - 1) * state.per, end = start + state.per;
      rows.forEach(function (r) { r.hidden = true; });
      list.slice(start, end).forEach(function (r) { r.hidden = false; });
      if (empty) empty.hidden = list.length > 0;
      if (count) {
        count.textContent = list.length
          ? "Showing " + (start + 1) + "–" + Math.min(end, list.length) + " of " + list.length + " patients" + (list.length < rows.length ? " (filtered)" : "")
          : "No matching patients";
      }
      renderPager(pages);
    }

    function renderPager(pages) {
      if (!pager) return;
      pager.innerHTML = "";
      if (pages < 2) return;
      function btn(label, page, opts) {
        var b = document.createElement("button");
        b.type = "button";
        b.innerHTML = label;
        if (opts && opts.aria) b.setAttribute("aria-label", opts.aria);
        if (page === state.page && !(opts && opts.nav)) b.setAttribute("aria-current", "page");
        if (opts && opts.disabled) b.disabled = true;
        b.addEventListener("click", function () { state.page = page; apply(false); table.closest(".panel").scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" }); });
        pager.appendChild(b);
      }
      btn("&lsaquo;", state.page - 1, { aria: "Previous page", nav: true, disabled: state.page === 1 });
      for (var p = 1; p <= pages; p++) btn(String(p), p, { aria: "Page " + p });
      btn("&rsaquo;", state.page + 1, { aria: "Next page", nav: true, disabled: state.page === pages });
    }

    $$(".th-sort", table).forEach(function (b) {
      b.addEventListener("click", function () {
        var th = b.closest("th");
        var col = th.cellIndex;
        state.dir = state.col === col ? -state.dir : 1;
        state.col = col;
        $$("th[aria-sort]", table).forEach(function (h) { h.setAttribute("aria-sort", "none"); });
        th.setAttribute("aria-sort", state.dir === 1 ? "ascending" : "descending");
        sortRows();
        apply(true);
      });
    });

    [fw, fs, fd].forEach(function (el) { if (el) el.addEventListener("change", function () { apply(true); }); });
    if (q) q.addEventListener("input", function () { apply(true); });
    if (form) {
      form.addEventListener("submit", function (e) { e.preventDefault(); });
      form.addEventListener("reset", function () { setTimeout(function () { apply(true); }, 0); });
    }

    // New admissions from the offcanvas form join the list.
    table.addEventListener("rounds:admitted", function (e) {
      rows.unshift(e.detail.row);
      if (form) form.reset();
      state.col = -1;
      $$("th[aria-sort]", table).forEach(function (h) { h.setAttribute("aria-sort", "none"); });
      setTimeout(function () { apply(true); }, 0);
    });

    apply(true);
  }

  /* ----------------------------------------------------------------
   * Export the filtered patient list as CSV
   * ---------------------------------------------------------------- */
  function initExport() {
    var btn = document.getElementById("export-btn");
    var table = document.getElementById("pt-table");
    if (!btn || !table) return;
    btn.addEventListener("click", function () {
      var lines = [["Patient", "MRN", "Age and sex", "Bed", "Ward", "Attending", "Admitted", "Diagnosis", "NEWS2", "Status"]];
      $$("tbody tr", table).forEach(function (r) {
        if (r.getAttribute("data-match") === "0") return;
        var c = r.cells;
        lines.push([
          $(".pt-name", r).textContent, $(".pt-sub", r).textContent, c[1].textContent.trim(),
          $(".loc-bed", r).textContent, $(".loc .cell-sub", r).textContent, c[3].textContent.trim(),
          $(".mono", c[4]).textContent, c[5].textContent.trim(), c[6].textContent.trim(), c[7].textContent.trim()
        ]);
      });
      var csv = lines.map(function (l) {
        return l.map(function (v) { return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(",");
      }).join("\n");
      var url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      var a = document.createElement("a");
      a.href = url;
      a.download = "inpatients-24-sep.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      announce("Exported " + (lines.length - 1) + " patients as CSV");
    });
  }

  /* ----------------------------------------------------------------
   * Admit-patient offcanvas form
   * ---------------------------------------------------------------- */
  function initAdmitForm() {
    var form = document.getElementById("admit-form");
    var panel = document.getElementById("admit");
    if (!form || !panel) return;
    var done = document.getElementById("admit-done");
    var table = document.getElementById("pt-table");

    if (window.location.hash === "#admit" && window.bootstrap) {
      window.bootstrap.Offcanvas.getOrCreateInstance(panel).show();
    }

    function val(id) { return document.getElementById(id).value.trim(); }

    function reset() {
      form.reset();
      form.classList.remove("was-validated");
      form.hidden = false;
      if (done) done.hidden = true;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.classList.add("was-validated");
      var dob = document.getElementById("a-dob");
      dob.setCustomValidity(dob.value && new Date(dob.value) > DEMO_DAY ? "future" : "");
      if (!form.checkValidity()) {
        var bad = form.querySelector(":invalid");
        if (bad) bad.focus();
        return;
      }
      var name = val("a-first") + " " + val("a-last");
      var wardSel = document.getElementById("a-ward");
      var ward = wardSel.value;
      var wardName = wardSel.options[wardSel.selectedIndex].text.replace(/^\S+\s/, "");
      var bed = pad2(parseInt(val("a-bed"), 10));
      var docSel = document.getElementById("a-doc");
      var docKey = docSel.value;
      var docLabel = docSel.options[docSel.selectedIndex].text.split(" · ")[0];
      var born = new Date(dob.value);
      var age = DEMO_DAY.getFullYear() - born.getFullYear() - (DEMO_DAY < new Date(DEMO_DAY.getFullYear(), born.getMonth(), born.getDate()) ? 1 : 0);
      var sex = document.getElementById("a-sex").value;
      var news = parseInt(val("a-news"), 10) || 0;
      var status = news >= 7 ? "critical" : news >= 5 ? "observation" : "stable";
      var statusLabel = { critical: "Critical", observation: "Observation", stable: "Stable" }[status];
      var mrn = String(400000 + Math.floor(Math.random() * 99999));
      var dx = val("a-dx");

      if (table) {
        var tr = document.createElement("tr");
        tr.className = "is-new" + (status === "critical" ? " is-critical" : "");
        tr.setAttribute("data-ward", ward);
        tr.setAttribute("data-status", status);
        tr.setAttribute("data-doctor", docKey);
        tr.setAttribute("data-search", [name, "SAG-" + mrn, ward + "-" + bed, dx, docLabel].join(" ").toLowerCase());
        tr.innerHTML =
          '<td data-v="' + esc(val("a-last") + " " + val("a-first")) + '"><div class="pt">' + avatar(name) + '<div><a class="pt-name" href="patient.html">' + esc(name) + '</a><span class="pt-sub mono">SAG-' + mrn + "</span></div></div></td>" +
          '<td data-v="' + age + '" class="mono">' + age + " " + esc(sex) + "</td>" +
          '<td data-v="' + esc(ward + "-" + bed) + '"><span class="loc"><span class="loc-bed mono">' + esc(ward + "-" + bed) + '</span><span class="cell-sub">' + esc(wardName) + "</span></span></td>" +
          '<td data-v="' + esc(docLabel.split(" ").pop()) + '" class="d-none d-lg-table-cell">' + esc(docLabel) + "</td>" +
          '<td data-v="24" class="d-none d-md-table-cell"><span class="mono">24 Sep</span><span class="cell-sub">Day 1 <span class="chip chip--new">New</span></span></td>' +
          '<td class="d-none d-xl-table-cell dx-cell">' + esc(dx) + "</td>" +
          '<td data-v="' + pad2(news) + '"><span class="news news--' + (news >= 7 ? "high" : news >= 5 ? "med" : "low") + '" title="NEWS2 score">' + news + "</span></td>" +
          '<td data-v="' + { critical: 0, observation: 1, stable: 3 }[status] + '"><span class="chip chip--' + status + '">' + statusLabel + "</span></td>";
        table.tBodies[0].insertBefore(tr, table.tBodies[0].firstChild);
        table.dispatchEvent(new CustomEvent("rounds:admitted", { detail: { row: tr } }));
      }

      var summary = document.getElementById("admit-summary");
      if (summary) summary.textContent = name + " (MRN SAG-" + mrn + ") admitted to Ward " + ward + ", bed " + bed + ", under " + docLabel + ".";
      form.hidden = true;
      if (done) { done.hidden = false; done.focus(); }
      announce(name + " admitted to Ward " + ward);
    });

    var again = document.getElementById("admit-again");
    if (again) again.addEventListener("click", function () { reset(); document.getElementById("a-first").focus(); });
    panel.addEventListener("hidden.bs.offcanvas", function () { if (form.hidden) reset(); });
  }

  /* ----------------------------------------------------------------
   * Patient record: abnormal-only lab filter
   * ---------------------------------------------------------------- */
  function initLabFilter() {
    var sw = document.getElementById("abnormal-only");
    if (!sw) return;
    sw.addEventListener("change", function () {
      $$(".table-labs tbody tr").forEach(function (r) {
        r.classList.toggle("is-filtered", sw.checked && r.getAttribute("data-abnormal") !== "1");
      });
      announce(sw.checked ? "Showing abnormal results only" : "Showing all results");
    });
  }

  /* ----------------------------------------------------------------
   * Patient record: highlight the section in view
   * ---------------------------------------------------------------- */
  function initRecordNav() {
    var nav = $(".record-nav");
    if (!nav || !("IntersectionObserver" in window)) return;
    var links = $$("a[href^='#']", nav);
    var map = {};
    links.forEach(function (a) { var t = document.getElementById(a.getAttribute("href").slice(1)); if (t) map[t.id] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
        var a = map[en.target.id];
        if (a) { a.classList.add("is-active"); a.setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* ----------------------------------------------------------------
   * Patient record: add a clinical note
   * ---------------------------------------------------------------- */
  function initNoteForm() {
    var form = document.getElementById("note-form");
    var list = document.getElementById("timeline");
    if (!form || !list) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.classList.add("was-validated");
      var text = document.getElementById("n-text");
      if (!form.checkValidity()) { text.focus(); return; }
      var type = document.getElementById("n-type").value;
      var li = document.createElement("li");
      li.className = "tl-item tl-item--doctor is-new";
      li.innerHTML =
        '<span class="tl-dot" aria-hidden="true"></span><article class="tl-card"><header class="tl-head">' + avatar("Adaeze Okafor", "sm") +
        '<div class="tl-who"><strong>Dr. Adaeze Okafor</strong><span>Attending, Cardiology</span></div>' +
        '<span class="tl-type"></span><time class="tl-time mono"></time></header><p></p></article>';
      $(".tl-type", li).textContent = type;
      $(".tl-time", li).textContent = "Today, " + clockNow();
      $("p", li).textContent = text.value.trim();
      list.insertBefore(li, list.firstChild);
      form.reset();
      form.classList.remove("was-validated");
      var count = document.getElementById("notes-count");
      if (count) count.textContent = list.children.length + " entries";
      announce(type + " note added to the record");
      li.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ----------------------------------------------------------------
   * Print buttons
   * ---------------------------------------------------------------- */
  function initPrint() {
    $$("#print-btn, #print-rota").forEach(function (b) {
      b.addEventListener("click", function () { window.print(); });
    });
  }

  /* ----------------------------------------------------------------
   * OPD appointment board: day navigation, clinic filter, booking
   * ---------------------------------------------------------------- */
  function initAppointments() {
    var board = document.getElementById("board");
    if (!board) return;
    var body = document.getElementById("board-body");
    var label = document.getElementById("day-label");
    var empty = document.getElementById("board-empty");
    var filter = document.getElementById("clinic-filter");
    var todayBtn = document.getElementById("day-today");
    var docs = $$("thead th[data-doc]", board).map(function (th) {
      return { name: $("strong", th).textContent, clinic: $(".doc-head div span", th).textContent.split(" · ")[0] };
    });
    var breakRow = $(".board-break", body);
    var breakHTML = breakRow ? breakRow.outerHTML : "";
    var times = [], days = {}, offset = 0, today = {}, typesByDoc = {};

    // Read today's board from the HTML so the markup stays the source of truth.
    $$("tr[data-time]", body).forEach(function (tr) {
      var t = tr.getAttribute("data-time");
      times.push(t);
      $$("td[data-doc]", tr).forEach(function (td) {
        var di = td.getAttribute("data-doc"), a = $(".appt", td), key = di + "|" + t;
        if (a) {
          today[key] = { kind: "appt", name: a.getAttribute("data-name"), mrn: a.getAttribute("data-mrn"), type: a.getAttribute("data-type"), status: a.getAttribute("data-status") };
          (typesByDoc[di] = typesByDoc[di] || []).indexOf(today[key].type) < 0 && typesByDoc[di].push(today[key].type);
        } else if (td.classList.contains("slot-blocked")) today[key] = { kind: "blocked", label: td.textContent.trim() };
        else if ($(".slot-free", td)) today[key] = { kind: "free" };
        else today[key] = { kind: "past" };
      });
    });
    days[0] = today;
    var pool = Object.keys(today).filter(function (k) { return today[k].kind === "appt"; }).map(function (k) { return today[k].name; });

    function dateFor(off) { var d = new Date(DEMO_DAY); d.setDate(d.getDate() + off); return d; }
    function isWeekend(d) { return d.getDay() === 0 || d.getDay() === 6; }

    function generate(off) {
      if (isWeekend(dateFor(off))) return null;
      var rnd = seeded(off * 7919 + 101), data = {}, names = pool.slice();
      for (var i = names.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var tmp = names[i]; names[i] = names[j]; names[j] = tmp; }
      var n = 0;
      docs.forEach(function (d, di) {
        times.forEach(function (t) {
          var key = di + "|" + t;
          if (today[key].kind === "blocked") { data[key] = today[key]; return; }
          if (rnd() > (off > 0 ? 0.62 - off * 0.04 : 0.8)) { data[key] = { kind: off < 0 ? "past" : "free" }; return; }
          var types = typesByDoc[di] || ["Follow-up"];
          data[key] = {
            kind: "appt",
            name: names[n++ % names.length],
            mrn: String(100000 + Math.floor(rnd() * 299999)),
            type: types[Math.floor(rnd() * types.length)],
            status: off < 0 ? (rnd() < 0.1 ? "noshow" : "seen") : "booked"
          };
        });
      });
      return data;
    }
    function dayData(off) { if (!(off in days)) days[off] = generate(off); return days[off]; }

    var LABEL = { seen: "Seen", noshow: "No-show", consult: "In consult", arrived: "Arrived", booked: "Booked" };
    function cellHTML(c, di, t) {
      if (c.kind === "appt") {
        return '<div class="appt appt--' + c.status + (c.isNew ? " is-new" : "") + '" data-name="' + esc(c.name) + '" data-mrn="' + esc(c.mrn) + '" data-type="' + esc(c.type) + '" data-status="' + c.status + '">' +
          '<span class="appt-name">' + esc(c.name) + (c.type === "New" ? '<span class="appt-new">New</span>' : "") + "</span>" +
          '<span class="appt-meta"><span class="mono">' + esc(c.mrn) + "</span> · " + esc(c.type) + "</span>" +
          '<span class="appt-status">' + LABEL[c.status] + "</span></div>";
      }
      if (c.kind === "free") {
        return '<button type="button" class="slot-free" data-doc="' + di + '" data-time="' + t + '"><svg class="ic ic-xs" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"/></svg> Free<span class="visually-hidden"> slot: book ' + esc(shortName(docs[di].name)) + " at " + t + "</span></button>";
      }
      if (c.kind === "blocked") return "<span>" + esc(c.label) + "</span>";
      return '<span class="slot-past">Unbooked</span>';
    }

    function summary(data) {
      var s = { total: 0, seen: 0, consult: 0, arrived: 0, noshow: 0, booked: 0, free: 0 };
      if (data) Object.keys(data).forEach(function (k) {
        var c = data[k];
        if (c.kind === "appt") { s.total++; s[c.status]++; }
        else if (c.kind === "free") s.free++;
      });
      $$("[data-k]", document.getElementById("opd-summary")).forEach(function (el) { el.textContent = s[el.getAttribute("data-k")]; });
    }

    function applyFilter() {
      var sel = filter ? filter.value : "";
      $$("[data-doc]", board).forEach(function (cell) {
        if (cell.tagName === "BUTTON") return;
        cell.classList.toggle("is-hidden", sel !== "" && cell.getAttribute("data-doc") !== sel);
      });
      var br = $(".board-break td", body);
      if (br) br.colSpan = sel ? 1 : docs.length;
      board.classList.toggle("is-filtered", !!sel);
    }

    var narrowMq = window.matchMedia("(max-width: 575.98px)");
    function setLabel() {
      var date = dateFor(offset), day = DAYS[date.getDay()];
      label.textContent = (narrowMq.matches ? day.slice(0, 3) : day) + " " + date.getDate() + " " + MONTHS[date.getMonth()];
    }
    if (narrowMq.addEventListener) narrowMq.addEventListener("change", setLabel);
    setLabel();

    function render() {
      setLabel();
      if (todayBtn) todayBtn.disabled = offset === 0;
      var data = dayData(offset);
      summary(data);
      if (!data) { board.hidden = true; empty.hidden = false; return; }
      board.hidden = false;
      empty.hidden = true;
      var html = "";
      times.forEach(function (t) {
        if (t === "13:00") html += breakHTML;
        var now = offset === 0 && t === "09:30";
        html += '<tr data-time="' + t + '"' + (now ? ' class="is-now"' : "") + '><th scope="row" class="board-time mono">' + t + (now ? '<span class="now-tag">now</span>' : "") + "</th>";
        docs.forEach(function (d, di) {
          var c = data[di + "|" + t];
          html += '<td data-doc="' + di + '"' + (c.kind === "blocked" ? ' class="slot-blocked"' : "") + ">" + cellHTML(c, di, t) + "</td>";
        });
        html += "</tr>";
      });
      body.innerHTML = html;
      applyFilter();
    }

    function go(off) { offset = off; render(); }
    var prev = document.getElementById("day-prev"), next = document.getElementById("day-next");
    if (prev) prev.addEventListener("click", function () { go(offset - 1); });
    if (next) next.addEventListener("click", function () { go(offset + 1); });
    if (todayBtn) todayBtn.addEventListener("click", function () { go(0); });
    if (filter) filter.addEventListener("change", applyFilter);

    // ---- booking dialog
    var modalEl = document.getElementById("book");
    var form = document.getElementById("book-form");
    var done = document.getElementById("book-done");
    if (!modalEl || !form) return;
    var fDoc = document.getElementById("b-doc"), fDate = document.getElementById("b-date"), fTime = document.getElementById("b-time");

    function iso(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
    function offFromInput() {
      if (!fDate.value) return null;
      var p = fDate.value.split("-");
      var d = new Date(+p[0], +p[1] - 1, +p[2]);
      return Math.round((d - DEMO_DAY) / 86400000);
    }
    function refreshSlots() {
      var off = offFromInput(), di = fDoc.value;
      var data = off === null ? null : dayData(off);
      $$("option", fTime).forEach(function (o) {
        if (!o.value) return;
        var c = data && di !== "" ? data[di + "|" + o.value] : null;
        var free = !data || di === "" || (c && c.kind === "free");
        o.disabled = !free;
        o.textContent = o.value + (free ? "" : c && c.kind === "blocked" ? " (unavailable)" : " (taken)");
      });
      if (fTime.selectedOptions[0] && fTime.selectedOptions[0].disabled) fTime.value = "";
    }
    fDoc.addEventListener("change", refreshSlots);
    fDate.addEventListener("change", refreshSlots);

    function resetForm() {
      form.reset();
      form.classList.remove("was-validated");
      form.hidden = false;
      done.hidden = true;
      fDate.value = iso(dateFor(Math.max(0, offset)));
      refreshSlots();
    }

    body.addEventListener("click", function (e) {
      var b = e.target.closest(".slot-free");
      if (!b) return;
      resetForm();
      fDoc.value = b.getAttribute("data-doc");
      refreshSlots();
      fTime.value = b.getAttribute("data-time");
      bsModal(modalEl).show();
    });
    var opener = document.getElementById("book-open");
    if (opener) opener.addEventListener("click", resetForm);
    modalEl.addEventListener("shown.bs.modal", function () { var f = document.getElementById("b-name"); if (f && !form.hidden) f.focus(); });
    modalEl.addEventListener("hidden.bs.modal", function () { if (form.hidden) resetForm(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var off = offFromInput();
      fDate.setCustomValidity(off === null || off < 0 || isWeekend(dateFor(off)) ? "Choose a weekday from today on." : "");
      form.classList.add("was-validated");
      if (!form.checkValidity()) { var bad = form.querySelector(":invalid"); if (bad) bad.focus(); return; }
      var di = fDoc.value, t = fTime.value, data = dayData(off);
      var name = document.getElementById("b-name").value.trim();
      var mrn = document.getElementById("b-mrn").value.trim().replace(/^SAG-/, "") || String(400000 + Math.floor(Math.random() * 99999));
      var type = (form.querySelector("input[name='b-type']:checked") || {}).value || "New";
      data[di + "|" + t] = { kind: "appt", name: name, mrn: mrn, type: type, status: "booked", isNew: true };
      go(off);
      if (filter && filter.value && filter.value !== di) { filter.value = ""; applyFilter(); }
      var d = dateFor(off);
      document.getElementById("book-summary").textContent = name + " with " + docs[di].name + " (" + docs[di].clinic + ") on " + DAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()] + " at " + t + ".";
      form.hidden = true;
      done.hidden = false;
      done.focus();
      announce("Appointment booked at " + t + " with " + docs[di].name);
    });
    var again = document.getElementById("book-again");
    if (again) again.addEventListener("click", function () { resetForm(); document.getElementById("b-name").focus(); });
  }

  /* ----------------------------------------------------------------
   * Beds: ward tabs, mark clean, assign-bed dialog, bed queue
   * ---------------------------------------------------------------- */
  function initBedMap() {
    var panels = $$(".ward-panel");
    if (!panels.length) return;
    var tabs = $$(".ward-tab");

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute("aria-controls"));
        if (p) p.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t); });
      t.addEventListener("keydown", function (e) {
        var j = i;
        if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") j = 0;
        else if (e.key === "End") j = tabs.length - 1;
        else return;
        e.preventDefault();
        select(tabs[j], true);
      });
    });
    if (tabs.length) select(tabs[0]);

    // Keep every counter on the page in step when a bed changes state.
    function bump(ward, from, to) {
      var panel = $('.ward-panel[data-ward="' + ward + '"]');
      [[from, -1], [to, 1]].forEach(function (pair) {
        var st = pair[0], d = pair[1];
        var els = [];
        if (panel) els.push($('[data-count="' + st + '"]', panel));
        els.push($('#ward-summary [data-ward-row="' + ward + '"] [data-col="' + st + '"]'));
        els.push($(".bt--" + st + " strong"));
        if (st === "free") els.push($('[data-census="free"]'));
        els.forEach(function (el) { if (el) el.textContent = (parseInt(el.textContent, 10) || 0) + d; });
      });
    }

    function freeTile(bid) {
      return '<button type="button" class="bed-hit" data-assign="' + bid + '"><span class="bed-top"><span class="bed-no">' + bid + '</span></span><span class="bed-state">Free</span><span class="bed-meta">Ready to assign</span></button>';
    }

    // ---- assign dialog
    var modalEl = document.getElementById("assign");
    var form = document.getElementById("assign-form");
    var done = document.getElementById("assign-done");
    var fPatient = document.getElementById("as-patient"), fWard = document.getElementById("as-ward"), fBed = document.getElementById("as-bed");

    function fillBeds(preferred) {
      if (!fBed) return;
      var panel = $('.ward-panel[data-ward="' + fWard.value + '"]');
      var free = panel ? $$(".bed--free", panel).map(function (li) { return li.getAttribute("data-bed"); }) : [];
      fBed.innerHTML = free.length
        ? free.map(function (b) { return '<option value="' + b + '">' + b + "</option>"; }).join("")
        : '<option value="">No free bed</option>';
      if (preferred && free.indexOf(preferred) > -1) fBed.value = preferred;
    }
    function resetForm() {
      if (!form) return;
      form.reset();
      form.classList.remove("was-validated");
      form.hidden = false;
      if (done) done.hidden = true;
    }
    function open(opts) {
      if (!modalEl || !form) return;
      resetForm();
      if (opts.ward && $('option[value="' + opts.ward + '"]', fWard)) fWard.value = opts.ward;
      if (opts.patient) fPatient.value = opts.patient;
      fillBeds(opts.bed);
      bsModal(modalEl).show();
    }
    if (fWard) fWard.addEventListener("change", function () { fillBeds(); });
    if (modalEl) {
      modalEl.addEventListener("shown.bs.modal", function () { if (!form.hidden) (fPatient.value ? fBed : fPatient).focus(); });
      modalEl.addEventListener("hidden.bs.modal", function () { if (form.hidden) resetForm(); });
    }

    document.addEventListener("click", function (e) {
      var clean = e.target.closest("[data-clean]");
      if (clean) {
        var li = clean.closest(".bed"), bid = clean.getAttribute("data-clean");
        var ward = li.closest(".ward-panel").getAttribute("data-ward");
        li.className = "bed bed--free is-updated";
        li.innerHTML = freeTile(bid);
        bump(ward, "cleaning", "free");
        $("button", li).focus();
        announce("Bed " + bid + " marked clean and ready");
        return;
      }
      var a = e.target.closest("[data-assign]");
      if (a) {
        var p = a.closest(".ward-panel");
        open({ ward: p && p.getAttribute("data-ward"), bed: a.getAttribute("data-assign") });
        return;
      }
      var q = e.target.closest("[data-queue-assign]");
      if (q) {
        var item = q.closest(".queue-item");
        open({ patient: q.getAttribute("data-queue-assign"), ward: item.getAttribute("data-ward") });
      }
    });

    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.classList.add("was-validated");
      if (!form.checkValidity()) { var bad = form.querySelector(":invalid"); if (bad) bad.focus(); return; }
      var bid = fBed.value, ward = fWard.value, who = fPatient.value;
      var eta = document.getElementById("as-eta").value;
      var iso = document.getElementById("as-iso").checked;
      var porter = document.getElementById("as-porter").checked;
      var li = $('.bed[data-bed="' + bid + '"]');
      var item = $('.queue-item[data-patient="' + who.replace(/"/g, '\\"') + '"]');
      var src = item ? $(".queue-src", item).textContent : "ED";
      if (li) {
        li.className = "bed bed--reserved is-updated";
        li.innerHTML = '<div class="bed-hit"><span class="bed-top"><span class="bed-no">' + esc(bid) + "</span>" +
          (iso ? '<span class="bed-flag bed-flag--iso" title="Isolation"><svg class="ic ic-xs" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg><span class="visually-hidden">Isolation</span></span>' : "") +
          '</span><span class="bed-state">Reserved</span><span class="bed-pt">' + esc(shortName(who)) + '</span><span class="bed-meta">from ' + esc(src) + " · ETA " + esc(eta) + "</span></div>";
        bump(ward, "free", "reserved");
      }
      if (item) item.remove();
      var opt = $('option[value="' + who.replace(/"/g, '\\"') + '"]', fPatient);
      if (opt) opt.remove();
      var queue = document.getElementById("queue");
      var left = $$(".queue-item", queue).length;
      var qc = document.getElementById("queue-count");
      if (qc) qc.textContent = left;
      if (!left && queue) queue.innerHTML = '<li class="queue-empty">No patients waiting for a bed.</li>';
      var tab = document.getElementById("tab-" + ward.toLowerCase());
      if (tab) select(tab);
      document.getElementById("assign-summary").textContent = "Bed " + bid + " is reserved for " + who + ", arriving " + eta + (porter ? ", porter requested" : "") + (iso ? ", isolation needed" : "") + ".";
      form.hidden = true;
      done.hidden = false;
      done.focus();
      announce("Bed " + bid + " reserved for " + who);
    });
  }

  /* ----------------------------------------------------------------
   * Staff roster: role/department/name filters, week navigation,
   * offering open shifts
   * ---------------------------------------------------------------- */
  function initRoster() {
    var table = document.getElementById("roster");
    if (!table) return;
    var rows = $$("#roster-body tr");
    var form = document.getElementById("rota-filters");
    var dept = document.getElementById("r-dept"), q = document.getElementById("r-q");
    var sub = document.getElementById("rota-sub"), empty = document.getElementById("rota-empty");
    var roleBtns = $$("[data-role]", form);
    var state = { role: "", week: 0 };

    function apply() {
      var n = 0, term = q ? q.value.trim().toLowerCase() : "";
      rows.forEach(function (r) {
        var ok = (!state.role || r.getAttribute("data-role") === state.role) &&
          (!dept || !dept.value || r.getAttribute("data-dept") === dept.value) &&
          (!term || r.getAttribute("data-name").indexOf(term) > -1);
        r.classList.toggle("is-filtered", !ok);
        if (ok) n++;
      });
      if (sub) sub.textContent = "Showing " + n + " of 205 rostered staff";
      if (empty) empty.hidden = n > 0;
    }
    roleBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        state.role = b.getAttribute("data-role");
        roleBtns.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        apply();
      });
    });
    if (dept) dept.addEventListener("change", apply);
    if (q) q.addEventListener("input", apply);
    if (form) form.addEventListener("submit", function (e) { e.preventDefault(); });

    // ---- week navigation (other weeks are generated from each person's pattern)
    var SHIFT = {
      D: ["Day", "07:00–19:00", 12], E: ["Early", "07:00–15:00", 8], L: ["Late", "15:00–23:00", 8],
      N: ["Night", "19:00–07:00", 12], OC: ["On call", "", 0], AL: ["Annual leave", "", 0], "-": ["Off", "", 0]
    };
    function cell(code) {
      if (code === "-") return '<span class="shift shift--off" title="Off">·<span class="visually-hidden">Off</span></span>';
      var s = SHIFT[code];
      return '<span class="shift shift--' + code.toLowerCase() + '" title="' + s[0] + (s[1] ? " " + s[1] : "") + '">' + code + '<span class="visually-hidden"> ' + s[0] + "</span></span>";
    }
    var base = rows.map(function (r) { return r.getAttribute("data-pattern").split(","); });
    var heads = $$("thead th.day-col", table);
    var foot = $$("#roster-foot .cov");
    var footBase = foot.map(function (c) { return c.innerHTML; });
    var label = document.getElementById("week-label");
    var SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function renderWeek() {
      var start = new Date(2026, 8, 21 + state.week * 7);
      var end = new Date(start); end.setDate(end.getDate() + 6);
      if (label) label.textContent = start.getDate() + (start.getMonth() !== end.getMonth() ? " " + SHORT[start.getMonth()] : "") + "–" + end.getDate() + " " + SHORT[end.getMonth()];
      heads.forEach(function (th, i) {
        var d = new Date(start); d.setDate(d.getDate() + i);
        $("strong", th).textContent = d.getDate();
      });
      $$(".day-col", table).forEach(function (c) {
        var idx = Array.prototype.indexOf.call(c.parentNode.children, c) - 1;
        c.classList.toggle("is-today", state.week === 0 && idx === 3);
      });
      rows.forEach(function (r, ri) {
        var pat = base[ri];
        if (state.week !== 0) {
          var k = ((state.week * 3) % 7 + 7) % 7;
          pat = pat.map(function (_, i) { var c = base[ri][(i + k) % 7]; return c === "AL" ? "-" : c; });
        }
        var cells = $$(".day-col", r);
        var hours = 0;
        pat.forEach(function (c, i) { cells[i].innerHTML = cell(c); hours += SHIFT[c][2]; });
        $(".hours-col", r).textContent = hours;
      });
      var rnd = seeded(state.week * 31 + 7);
      foot.forEach(function (c, i) {
        if (state.week === 0) { c.innerHTML = footBase[i]; c.classList.toggle("cov--short", /cov--short/.test(c.className) || false); return; }
        var req = parseInt($("small", c).textContent.replace("/", ""), 10);
        var act = req + Math.floor(rnd() * 7) - 2;
        c.innerHTML = act + "<small>/" + req + "</small>";
        c.classList.toggle("cov--short", act < req);
      });
      if (state.week === 0) foot.forEach(function (c) {
        var a = parseInt(c.textContent, 10), req = parseInt($("small", c).textContent.replace("/", ""), 10);
        c.classList.toggle("cov--short", a < req);
      });
    }
    var prev = document.getElementById("week-prev"), next = document.getElementById("week-next");
    if (prev) prev.addEventListener("click", function () { state.week--; renderWeek(); });
    if (next) next.addEventListener("click", function () { state.week++; renderWeek(); });

    // ---- open shifts
    $$("[data-offer]").forEach(function (b) {
      b.addEventListener("click", function () {
        var tag = document.createElement("span");
        tag.className = "open-status";
        tag.textContent = "Offered " + clockNow();
        var what = $(".open-body strong", b.closest(".open-shift")).textContent;
        b.replaceWith(tag);
        announce(what + " shift offered to bank staff");
      });
    });

    apply();
  }

  /* ----------------------------------------------------------------
   * Sign-in form
   * ---------------------------------------------------------------- */
  function initLogin() {
    var form = document.getElementById("login-form");
    if (!form) return;
    var pass = document.getElementById("l-pass");
    var toggle = document.getElementById("pw-toggle");
    if (toggle && pass) {
      toggle.addEventListener("click", function () {
        var show = pass.type === "password";
        pass.type = show ? "text" : "password";
        toggle.setAttribute("aria-pressed", show ? "true" : "false");
        toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
      });
    }
    var forgot = document.getElementById("forgot-btn"), panel = document.getElementById("forgot-panel");
    if (forgot && panel) {
      forgot.addEventListener("click", function () {
        panel.hidden = !panel.hidden;
        forgot.setAttribute("aria-expanded", panel.hidden ? "false" : "true");
      });
    }
    var done = document.getElementById("login-done");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.classList.add("was-validated");
      if (!form.checkValidity()) { var bad = form.querySelector(":invalid"); if (bad) bad.focus(); return; }
      if (done) { done.hidden = false; done.focus(); }
    });
  }

  /* ----------------------------------------------------------------
   * Boot
   * ---------------------------------------------------------------- */
  function init() {
    initTheme();
    initSidebar();
    initSearchShortcut();
    initNotifications();
    initAlerts();
    initSparklines();
    initWardChart();
    initFlowChart();
    initVitalsChart();
    initPatientTable();
    initExport();
    initAdmitForm();
    initLabFilter();
    initRecordNav();
    initNoteForm();
    initPrint();
    initAppointments();
    initBedMap();
    initRoster();
    initLogin();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
