/* ===== البحث في الأرشيف ===== */
(function () {

  /* الصفحات داخل المجلدات الفرعية تحتاج بادئة للرجوع إلى الجذر */
  var BASE = /\/(interviews|works)\//.test(window.location.pathname) ? '../' : '';

  /* ── مصادر البيانات وكيفية الوصول إلى كل مادة ── */
  var SOURCES = [
    {
      file: 'works.json', label: 'أعماله',
      title: function (e) { return e.title; },
      sub:   function (e) { return e.subtitle || ''; },
      body:  function (e) { return [e.note, e.volume, e.issue, e.date, e.kind].join(' '); },
      link:  function (e) { return e.id ? 'works.html#work-' + e.id : 'works.html'; }
    },
    {
      file: 'library.json', label: 'كُتب عنه',
      title: function (e) { return e.title; },
      sub:   function (e) { return e.author || ''; },
      body:  function (e) { return [e.note, e.source, e.date, e.type].join(' '); },
      link:  function (e) { return e.id ? 'library.html#lib-' + e.id : 'library.html'; }
    },
    {
      file: 'baatha.json', label: 'فهرس البعثة',
      title: function (e) { return e.title; },
      sub:   function (e) { return [e.month, 'ص ' + e.page].join(' · '); },
      body:  function (e) { return [e.desc, e.note, e.type, e.year, e.vol].join(' '); },
      link:  function (e) { return e.link || 'baatha.html'; }
    },
    {
      file: 'documents.json', label: 'وثائق',
      title: function (e) { return e.title; },
      sub:   function (e) { return e.issuer || e.date || ''; },
      body:  function (e) { return [e.text, e.note, e.gazette, e.date, e.hijri, e.ref].join(' '); },
      link:  function () { return 'documents.html'; }
    },
    {
      file: 'music.json', label: 'الألحان',
      title: function (e) { return e.title; },
      sub:   function (e) { return e.performer ? 'أداء: ' + e.performer : ''; },
      body:  function (e) { return [e.note, e.lyricist, e.source, e.channel, e.year].join(' '); },
      link:  function () { return 'music.html'; }
    },
    {
      file: 'photos.json', label: 'الصور',
      title: function (e) { return e.caption || 'صورة'; },
      sub:   function (e) { return e.people || ''; },
      body:  function (e) { return [e.year, e.era, e.people].join(' '); },
      link:  function () { return 'gallery.html'; }
    }
  ];

  /* الأسماء الأكثر وروداً — مدخل لمن لا يعرف بمَ يبدأ */
  var SUGGEST = [
    'أحمد العدواني', 'نادي المعلمين', 'المسرح', 'البعثة',
    'فهد الدويري', 'القاهرة', 'الشؤون الاجتماعية', 'شادي الخليج'
  ];

  /* ── تطبيع عربي: بدونه يفشل البحث على فروق لا يقصدها الباحث ── */
  function norm(s) {
    return String(s || '')
      .replace(/[ً-ْـٰ]/g, '')   /* تشكيل وتطويل */
      .replace(/[آأإٱ]/g, 'ا') /* آ أ إ ← ا */
      .replace(/ة/g, 'ه')                   /* ة ← ه */
      .replace(/ى/g, 'ي')                   /* ى ← ي */
      .replace(/ؤ/g, 'و')                   /* ؤ ← و */
      .replace(/ئ/g, 'ي')                   /* ئ ← ي */
      .replace(/[‏‎]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  var index = null, loading = null;

  function load() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    loading = Promise.all(SOURCES.map(function (s) {
      return fetch(BASE + 'data/' + s.file)
        .then(function (r) { return r.ok ? r.json() : []; })
        .catch(function () { return []; });
    })).then(function (sets) {
      index = [];
      sets.forEach(function (rows, i) {
        var s = SOURCES[i];
        rows.forEach(function (e) {
          var title = s.title(e) || '';
          var sub   = s.sub(e) || '';
          var body  = s.body(e) || '';
          index.push({
            label: s.label,
            title: title,
            sub: sub,
            body: body,
            link: BASE + s.link(e),
            nTitle: norm(title),
            nAll: norm(title + ' ' + sub + ' ' + body)
          });
        });
      });
      return index;
    });
    return loading;
  }

  function search(q) {
    var nq = norm(q);
    if (nq.length < 2) return [];
    var out = [];
    index.forEach(function (r) {
      if (r.nAll.indexOf(nq) === -1) return;
      /* ترتيب: تطابق العنوان أولاً، ثم بدايته، ثم المتن */
      var rank = r.nTitle === nq ? 0 : (r.nTitle.indexOf(nq) === 0 ? 1 :
                 (r.nTitle.indexOf(nq) > -1 ? 2 : 3));
      out.push({ r: r, rank: rank });
    });
    out.sort(function (a, b) { return a.rank - b.rank; });
    return out.map(function (x) { return x.r; });
  }

  /* مقتطف حول موضع التطابق، مع تظليل الكلمة */
  function snippet(rec, q) {
    var nq = norm(q);
    var hay = rec.sub ? rec.sub + ' — ' + rec.body : rec.body;
    var pos = norm(hay).indexOf(nq);
    var frag = document.createDocumentFragment();
    /* التطابق في العنوان وحده: يُعرض وصف المادة كما هو */
    if (pos === -1) {
      frag.appendChild(document.createTextNode(rec.sub || ''));
      return frag;
    }
    var start = Math.max(0, pos - 45);
    var piece = hay.slice(start, start + 150).trim();
    if (start > 0) frag.appendChild(document.createTextNode('… '));
    var at = norm(piece).indexOf(nq);
    if (at === -1) { frag.appendChild(document.createTextNode(piece)); return frag; }
    frag.appendChild(document.createTextNode(piece.slice(0, at)));
    var mk = document.createElement('mark');
    mk.textContent = piece.slice(at, at + q.length);
    frag.appendChild(mk);
    frag.appendChild(document.createTextNode(piece.slice(at + q.length) + ' …'));
    return frag;
  }

  function countLabel(n) {
    var ar = function (x) { return String(x).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); };
    if (n === 0) return 'لا نتائج';
    if (n === 1) return 'نتيجة واحدة';
    if (n === 2) return 'نتيجتان';
    if (n <= 10) return ar(n) + ' نتائج';
    return ar(n) + ' نتيجة';
  }

  /* ── بناء النتائج في أي حاوية ── */
  function renderInto(listEl, countEl, q) {
    var rows = search(q);
    countEl.textContent = norm(q).length < 2 ? '' : countLabel(rows.length);
    listEl.innerHTML = '';

    if (norm(q).length < 2) return 0;

    if (!rows.length) {
      var none = document.createElement('p');
      none.className = 'sr-empty';
      none.textContent = 'لا توجد مادة بهذا الاسم في الأرشيف.';
      listEl.appendChild(none);
      return 0;
    }

    var groups = {}, order = [];
    rows.forEach(function (r) {
      if (!groups[r.label]) { groups[r.label] = []; order.push(r.label); }
      groups[r.label].push(r);
    });

    order.forEach(function (label) {
      var h = document.createElement('p');
      h.className = 'sr-group';
      h.textContent = label + ' · ' + countLabel(groups[label].length);
      listEl.appendChild(h);

      groups[label].forEach(function (r) {
        var a = document.createElement('a');
        a.className = 'sr-hit';
        a.href = r.link;

        var t = document.createElement('span');
        t.className = 'sr-hit-title';
        t.textContent = r.title || '—';
        a.appendChild(t);

        var s = document.createElement('span');
        s.className = 'sr-hit-snip';
        s.appendChild(snippet(r, q));
        a.appendChild(s);

        listEl.appendChild(a);
      });
    });

    return rows.length;
  }

  /* ── اللوحة المنبثقة ── */
  var ov, ovInput, ovList, ovCount, ovChips, hits = [], at = -1;

  function buildOverlay() {
    ov = document.createElement('div');
    ov.className = 'sr-ov';
    ov.hidden = true;
    ov.innerHTML =
      '<div class="sr-panel" role="dialog" aria-modal="true" aria-label="البحث في الأرشيف">' +
      '<div class="sr-bar">' +
      '<svg class="sr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="13.5" cy="10.5" r="6.75"/><path d="M8.7 15.3L3.6 20.4"/></svg>' +
      '<input class="sr-input" type="search" autocomplete="off" spellcheck="false" ' +
      'placeholder="ابحث عن اسم أو عمل أو مؤسسة…" aria-label="كلمة البحث">' +
      '<button class="sr-esc" type="button" aria-label="إغلاق">×</button>' +
      '</div>' +
      '<p class="sr-count" aria-live="polite"></p>' +
      '<div class="sr-chips"></div>' +
      '<div class="sr-list"></div>' +
      '</div>';
    document.body.appendChild(ov);

    ovInput = ov.querySelector('.sr-input');
    ovList  = ov.querySelector('.sr-list');
    ovCount = ov.querySelector('.sr-count');
    ovChips = ov.querySelector('.sr-chips');

    SUGGEST.forEach(function (name) {
      var b = document.createElement('button');
      b.className = 'sr-chip';
      b.type = 'button';
      b.textContent = name;
      b.addEventListener('click', function () {
        ovInput.value = name;
        run();
        ovInput.focus();
      });
      ovChips.appendChild(b);
    });

    ov.querySelector('.sr-esc').addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ovInput.addEventListener('input', run);
    ovInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); move(-1); }
      if (e.key === 'Enter' && at > -1 && hits[at]) { e.preventDefault(); hits[at].click(); }
    });
  }

  function move(d) {
    hits = Array.prototype.slice.call(ovList.querySelectorAll('.sr-hit'));
    if (!hits.length) return;
    if (at > -1 && hits[at]) hits[at].classList.remove('is-on');
    at = (at + d + hits.length) % hits.length;
    hits[at].classList.add('is-on');
    hits[at].scrollIntoView({ block: 'nearest' });
  }

  function run() {
    at = -1;
    if (!index) { ovCount.textContent = 'جارٍ تحضير الفهرس…'; return; }
    renderInto(ovList, ovCount, ovInput.value);
    ovChips.hidden = norm(ovInput.value).length >= 2;
  }

  function open() {
    if (!ov) buildOverlay();
    ov.hidden = false;
    document.body.style.overflow = 'hidden';
    ovInput.focus();
    load().then(function () { run(); });
  }

  function close() {
    if (!ov) return;
    ov.hidden = true;
    document.body.style.overflow = '';
  }

  /* ── الزرّ في الرأس ومفاتيح الاختصار ── */
  function mountTrigger() {
    var host = document.querySelector('.header-inner');
    if (!host || host.querySelector('.sr-open')) return;
    var btn = document.createElement('button');
    btn.className = 'sr-open';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'البحث في الأرشيف');
    btn.innerHTML = '<svg class="sr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="13.5" cy="10.5" r="6.75"/><path d="M8.7 15.3L3.6 20.4"/></svg>';
    btn.addEventListener('click', open);
    var toggle = host.querySelector('.nav-toggle');
    if (toggle) host.insertBefore(btn, toggle);
    else host.appendChild(btn);
  }

  document.addEventListener('keydown', function (e) {
    if (ov && !ov.hidden && e.key === 'Escape') { close(); return; }
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.key === '/' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); open(); }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); open(); }
  });

  /* ── صفحة البحث المستقلّة، إن وُجدت ── */
  function mountPage() {
    var page = document.getElementById('search-page');
    if (!page) return;
    var input = page.querySelector('.sp-input');
    var list  = page.querySelector('.sp-list');
    var count = page.querySelector('.sp-count');
    var chips = page.querySelector('.sp-chips');

    SUGGEST.forEach(function (name) {
      var b = document.createElement('button');
      b.className = 'sr-chip';
      b.type = 'button';
      b.textContent = name;
      b.addEventListener('click', function () {
        input.value = name;
        go();
        input.focus();
      });
      chips.appendChild(b);
    });

    function go() {
      if (!index) return;
      renderInto(list, count, input.value);
      chips.hidden = norm(input.value).length >= 2;
      var q = input.value.trim();
      var url = q ? 'search.html?q=' + encodeURIComponent(q) : 'search.html';
      window.history.replaceState(null, '', url);
    }

    input.addEventListener('input', go);
    count.textContent = 'جارٍ تحضير الفهرس…';

    load().then(function () {
      var m = /[?&]q=([^&]+)/.exec(window.location.search);
      if (m) { try { input.value = decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (err) {} }
      count.textContent = '';
      go();
      input.focus();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { mountTrigger(); mountPage(); });
  } else {
    mountTrigger();
    mountPage();
  }
})();
