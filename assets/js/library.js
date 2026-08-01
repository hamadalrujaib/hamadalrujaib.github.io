/* ===== كُتب عنه ===== */
(function () {
  var listEl  = document.getElementById('lib');
  var countEl = document.getElementById('lib-count');
  var filters = document.querySelectorAll('.filter');
  var items   = [];
  var current = 'all';

  var CAT_ORDER = ['book', 'thesis', 'article', 'eulogy', 'interview', 'video'];
  var CAT_LABEL = {
    book: 'كتب',
    thesis: 'رسائل جامعية',
    article: 'مقالات عنه',
    eulogy: 'رثاء',
    interview: 'حوارات معه',
    video: 'وثائقيات ومرئيات'
  };

  fetch('data/library.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      items = data;
      render();
      goToHash();
    })
    .catch(function () {
      listEl.innerHTML = '<p class="grid-status">تعذّر تحميل القائمة.</p>';
    });

  function render() {
    var shown = items.filter(function (x) {
      return current === 'all' ? true : x.cat === current;
    });

    countEl.textContent = shown.length ? countLabel(shown.length) : '';
    listEl.innerHTML = '';

    if (!shown.length) {
      listEl.innerHTML = '<p class="grid-status">لا توجد مواد في هذا القسم بعد.</p>';
      return;
    }

    if (current === 'all') {
      CAT_ORDER.forEach(function (cat) {
        var group = shown.filter(function (x) { return x.cat === cat; });
        if (!group.length) return;
        var h = document.createElement('h2');
        h.className = 'lib-group';
        h.textContent = CAT_LABEL[cat];
        listEl.appendChild(h);
        group.forEach(function (x) { listEl.appendChild(buildItem(x)); });
      });
    } else {
      shown.forEach(function (x) { listEl.appendChild(buildItem(x)); });
    }
  }

  function buildItem(x) {
    var el = document.createElement('article');
    el.className = 'lib-item';
    if (x.id) el.id = 'lib-' + x.id;

    var h = document.createElement('h3');
    h.className = 'lib-title';
    if (x.url) {
      var a = document.createElement('a');
      a.href = x.url;
      if (/^https?:/i.test(x.url)) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
      a.textContent = x.title;
      h.appendChild(a);
    } else {
      h.textContent = x.title;
    }
    el.appendChild(h);

    /* كل جزء في عنصر <bdi> مستقل، ليمنع دمج الأرقام المتجاورة عبر الفاصل */
    var meta = [];
    if (x.author) meta.push(x.author);
    if (x.source) meta.push(x.source);
    if (x.date)   meta.push(x.date);
    if (x.type)   meta.push(x.type);

    if (meta.length) {
      var m = document.createElement('p');
      m.className = 'lib-meta';
      meta.forEach(function (part) {
        var b = document.createElement('bdi');
        b.className = 'meta-part';
        b.textContent = part;
        m.appendChild(b);
      });
      el.appendChild(m);
    }

    if (x.note) {
      var n = document.createElement('p');
      n.className = 'lib-note';
      n.textContent = x.note;
      el.appendChild(n);
    }

    /* ── صور المادة، إن وُجدت ── */
    if (x.images && x.images.length) {
      var box = document.createElement('div');
      box.className = 'lib-docs';
      x.images.forEach(function (img) {
        var fig = document.createElement('figure');
        fig.className = 'lib-doc';
        fig.tabIndex = 0;
        fig.setAttribute('role', 'button');
        fig.setAttribute('aria-label', 'تكبير الصفحة');
        var i = document.createElement('img');
        i.src = 'assets/img/thumb-' + img.file;
        i.alt = img.caption || 'صفحة';
        i.loading = 'lazy';
        i.decoding = 'async';
        i.addEventListener('error', function onErr() {
          i.removeEventListener('error', onErr);
          i.src = 'assets/img/' + img.file;
        });
        fig.appendChild(i);
        fig.addEventListener('click', function () { openDoc(img); });
        fig.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDoc(img); }
        });
        box.appendChild(fig);
      });
      el.appendChild(box);
    }

    return el;
  }

  Array.prototype.forEach.call(filters, function (btn) {
    btn.addEventListener('click', function () {
      Array.prototype.forEach.call(filters, function (b) {
        b.classList.remove('is-active');
      });
      btn.classList.add('is-active');
      current = btn.dataset.cat;
      render();
    });
  });

  /* ── الوصول المباشر إلى مادة بعينها عبر #lib-xxx ── */
  function goToHash() {
    var hash = window.location.hash;
    if (!hash || hash.indexOf('#lib-') !== 0) return;

    if (current !== 'all') {
      current = 'all';
      Array.prototype.forEach.call(filters, function (b) {
        b.classList.toggle('is-active', b.dataset.cat === 'all');
      });
      render();
    }

    var target = document.getElementById(hash.slice(1));
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.classList.add('is-targeted');
    window.setTimeout(function () { target.classList.remove('is-targeted'); }, 2600);
  }

  window.addEventListener('hashchange', goToHash);

  /* ── عارض الصفحات ── */
  var lb, lbImg, lbCap;
  function buildLightbox() {
    lb = document.createElement('div');
    lb.className = 'doc-lb';
    lb.hidden = true;
    lb.innerHTML = '<button class="doc-lb-close" type="button" aria-label="إغلاق">\u00d7</button>' +
                   '<div class="doc-lb-inner"><img alt=""><p class="doc-lb-cap"></p></div>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector('img');
    lbCap = lb.querySelector('.doc-lb-cap');
    lb.querySelector('.doc-lb-close').addEventListener('click', closeDoc);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeDoc(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.hidden && e.key === 'Escape') closeDoc();
    });
  }
  function openDoc(img) {
    if (!lb) buildLightbox();
    lbImg.src = 'assets/img/' + img.file;
    lbImg.alt = img.caption || 'صفحة';
    lbCap.textContent = img.caption || '';
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeDoc() {
    lb.hidden = true;
    lbImg.src = '';
    document.body.style.overflow = '';
  }

  function arabicNum(n) {
    return String(n).replace(/\d/g, function (d) {
      return '٠١٢٣٤٥٦٧٨٩'[d];
    });
  }
  function countLabel(n) {
    if (n === 1) return 'مادة واحدة';
    if (n === 2) return 'مادتان';
    if (n <= 10) return arabicNum(n) + ' مواد';
    return arabicNum(n) + ' مادة';
  }
})();
