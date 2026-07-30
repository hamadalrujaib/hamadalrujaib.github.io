/* ===== الوثائق الرسمية ===== */
(function () {
  var listEl  = document.getElementById('docs');
  var countEl = document.getElementById('docs-count');
  var filters = document.querySelectorAll('.filter');
  var items   = [];
  var current = 'all';

  var KIND_LABEL = {
    decree: 'مرسوم',
    decision: 'قرار',
    circular: 'تعميم'
  };

  fetch('data/documents.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      items = data;
      render();
      initLightbox();
    })
    .catch(function () {
      listEl.innerHTML = '<p class="grid-status">تعذّر تحميل الوثائق.</p>';
    });

  function render() {
    var shown = items.filter(function (x) {
      return current === 'all' ? true : x.kind === current;
    });
    countEl.textContent = shown.length ? countLabel(shown.length) : '';
    listEl.innerHTML = '';
    if (!shown.length) {
      listEl.innerHTML = '<p class="grid-status">لا توجد وثائق في هذا القسم بعد.</p>';
      return;
    }
    shown.forEach(function (x) { listEl.appendChild(buildItem(x)); });
  }

  function buildItem(x) {
    var el = document.createElement('article');
    el.className = 'doc-item';

    var badge = document.createElement('p');
    badge.className = 'doc-kind';
    badge.textContent = KIND_LABEL[x.kind] || '';
    el.appendChild(badge);

    var h = document.createElement('h3');
    h.className = 'doc-title';
    h.textContent = x.title;
    el.appendChild(h);

    var meta = [];
    if (x.date)   meta.push(x.date);
    if (x.hijri)  meta.push(x.hijri);
    if (x.issuer) meta.push(x.issuer);
    if (meta.length) {
      var m = document.createElement('p');
      m.className = 'doc-meta';
      m.textContent = meta.join(' · ');
      el.appendChild(m);
    }

    if (x.text) {
      var q = document.createElement('blockquote');
      q.className = 'doc-text';
      q.textContent = x.text;
      el.appendChild(q);
    }

    if (x.note) {
      var n = document.createElement('p');
      n.className = 'doc-note';
      n.textContent = x.note;
      el.appendChild(n);
    }

    if (x.gazette) {
      var g = document.createElement('p');
      g.className = 'doc-gazette';
      g.textContent = x.gazette;
      el.appendChild(g);
    }

    if (x.images && x.images.length) {
      var grid = document.createElement('div');
      grid.className = 'doc-scans';
      x.images.forEach(function (img) {
        var fig = document.createElement('figure');
        fig.className = 'doc-scan';
        fig.tabIndex = 0;
        fig.setAttribute('role', 'button');
        fig.setAttribute('aria-label', 'تكبير صورة الوثيقة');
        fig.dataset.full = 'assets/img/' + img.file;
        fig.dataset.cap  = img.caption || '';
        var im = document.createElement('img');
        im.src = 'assets/img/thumb-' + img.file;
        im.alt = img.caption || x.title;
        im.loading = 'lazy';
        im.decoding = 'async';
        fig.appendChild(im);
        var cap = document.createElement('figcaption');
        cap.textContent = 'اضغط للتكبير';
        fig.appendChild(cap);
        grid.appendChild(fig);
      });
      el.appendChild(grid);
    }

    return el;
  }

  function initLightbox() {
    var lb = document.getElementById('doc-lb');
    if (!lb) return;
    var img = lb.querySelector('img');
    var cap = lb.querySelector('.doc-lb-cap');
    var close = function () {
      lb.hidden = true;
      img.src = '';
      document.body.style.overflow = '';
    };
    listEl.addEventListener('click', function (e) {
      var fig = e.target.closest ? e.target.closest('.doc-scan') : null;
      if (!fig) return;
      img.src = fig.dataset.full;
      img.alt = fig.querySelector('img').alt;
      cap.textContent = fig.dataset.cap;
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
    });
    listEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var fig = e.target.closest ? e.target.closest('.doc-scan') : null;
      if (!fig) return;
      e.preventDefault();
      fig.click();
    });
    lb.querySelector('.doc-lb-close').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.hidden && e.key === 'Escape') close();
    });
  }

  Array.prototype.forEach.call(filters, function (btn) {
    btn.addEventListener('click', function () {
      Array.prototype.forEach.call(filters, function (b) {
        b.classList.remove('is-active');
      });
      btn.classList.add('is-active');
      current = btn.dataset.kind;
      render();
    });
  });

  function arabicNum(n) {
    return String(n).replace(/\d/g, function (d) {
      return '٠١٢٣٤٥٦٧٨٩'[d];
    });
  }
  function countLabel(n) {
    if (n === 1) return 'وثيقة واحدة';
    if (n === 2) return 'وثيقتان';
    if (n <= 10) return arabicNum(n) + ' وثائق';
    return arabicNum(n) + ' وثيقة';
  }
})();
