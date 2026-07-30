/* ===== في مجلة البعثة ===== */
(function () {
  'use strict';

  var listEl  = document.getElementById('bth');
  var countEl = document.getElementById('bth-count');
  if (!listEl) return;

  var DATA = [];
  var volFilter  = 'all';
  var typeFilter = 'all';

  var VOL_ORDER = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع'];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function itemHTML(it) {
    var h = '';
    h += '<article class="bth-item">';
    h +=   '<div class="bth-ref">';
    h +=     '<span class="bth-issue">العدد ' + esc(it.issue) + ' · ' + esc(it.month) + '</span>';
    h +=     '<span class="bth-page">ص ' + esc(it.page) + '</span>';
    h +=   '</div>';
    h +=   '<div class="bth-body">';
    h +=     '<h3 class="bth-title">';
    h +=       it.link
                 ? '<a class="bth-link" href="' + esc(it.link) + '">' + esc(it.title) + '</a>'
                 : esc(it.title);
    h +=       '<span class="bth-type">' + esc(it.type) + '</span>';
    h +=     '</h3>';
    if (it.desc) h += '<p class="bth-desc">' + esc(it.desc) + '</p>';
    if (it.note) h += '<p class="bth-note">' + esc(it.note) + '</p>';
    h +=   '</div>';
    h += '</article>';
    return h;
  }

  function render() {
    var rows = DATA.filter(function (it) {
      if (volFilter  !== 'all' && it.vol  !== volFilter)  return false;
      if (typeFilter !== 'all' && it.type !== typeFilter) return false;
      return true;
    });

    if (!rows.length) {
      listEl.innerHTML = '<p class="grid-status">لا توجد مواد مطابقة لهذا التصفية.</p>';
      if (countEl) countEl.textContent = '';
      return;
    }

    var groups = {};
    rows.forEach(function (it) {
      (groups[it.vol] = groups[it.vol] || []).push(it);
    });

    var html = '';
    VOL_ORDER.forEach(function (vol) {
      var g = groups[vol];
      if (!g || !g.length) return;
      html += '<section class="bth-group">';
      html +=   '<div class="bth-group-head">';
      html +=     '<h2 class="bth-group-title">المجلد ' + esc(vol) + '</h2>';
      html +=     '<span class="bth-group-year">' + esc(g[0].year) + '</span>';
      html +=     '<span class="bth-group-count">' + g.length + ' مادة</span>';
      html +=   '</div>';
      html +=   g.map(itemHTML).join('');
      html += '</section>';
    });

    listEl.innerHTML = html;
    if (countEl) countEl.textContent = rows.length + ' مادة · ديسمبر ١٩٤٦ – يونيو ١٩٥٣';
  }

  function wire(selector, attr, setter) {
    var group = document.querySelector(selector);
    if (!group) return;
    group.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn || !group.contains(btn)) return;
      group.querySelectorAll('.filter').forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
      });
      setter(btn.getAttribute(attr));
      render();
    });
  }

  fetch('data/baatha.json')
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(function (data) {
      DATA = Array.isArray(data) ? data : [];
      render();
    })
    .catch(function () {
      listEl.innerHTML = '<p class="grid-status">تعذّر تحميل المواد.</p>';
    });

  wire('[aria-label="تصفية حسب المجلد"]',      'data-vol',  function (v) { volFilter  = v; });
  wire('[aria-label="تصفية حسب نوع المادة"]',  'data-type', function (v) { typeFilter = v; });
})();
