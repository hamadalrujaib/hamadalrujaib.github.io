/* ===== أعماله ===== */
(function () {
  var listEl  = document.getElementById('works');
  var countEl = document.getElementById('works-count');
  var filters = document.querySelectorAll('.filter');
  var items   = [];
  var current = 'all';

  var ORDER = ['play', 'story', 'article'];
  var LABEL = {
    play: 'مسرحيات',
    story: 'قصص',
    article: 'مقالات'
  };
  var TYPE = {
    play: 'مسرحية',
    story: 'قصة',
    article: 'مقال'
  };

  fetch('data/works.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) { items = data; render(); })
    .catch(function () {
      listEl.innerHTML = '<p class="grid-status">تعذّر تحميل القائمة.</p>';
    });

  function render() {
    var shown = items.filter(function (x) {
      return current === 'all' ? true : x.kind === current;
    });

    countEl.textContent = shown.length ? countLabel(shown.length) : '';
    listEl.innerHTML = '';

    if (!shown.length) {
      listEl.innerHTML = '<p class="grid-status">لا توجد مواد في هذا القسم بعد.</p>';
      return;
    }

    if (current === 'all') {
      ORDER.forEach(function (k) {
        var group = shown.filter(function (x) { return x.kind === k; });
        if (!group.length) return;
        var h = document.createElement('h2');
        h.className = 'lib-group';
        h.textContent = LABEL[k];
        listEl.appendChild(h);
        group.forEach(function (x) { listEl.appendChild(build(x)); });
      });
    } else {
      shown.forEach(function (x) { listEl.appendChild(build(x)); });
    }
  }

  function build(x) {
    var el = document.createElement('article');
    el.className = 'lib-item work-item';

    var h = document.createElement('h3');
    h.className = 'lib-title';
    h.textContent = x.title;
    el.appendChild(h);

    if (x.subtitle) {
      var s = document.createElement('p');
      s.className = 'work-sub';
      s.textContent = x.subtitle;
      el.appendChild(s);
    }

    var meta = [];
    if (TYPE[x.kind]) meta.push(TYPE[x.kind]);
    if (x.issue)  meta.push('العدد ' + x.issue);
    if (x.date)   meta.push(x.date);
    if (x.pages)  meta.push('ص ' + x.pages);
    if (meta.length) {
      var m = document.createElement('p');
      m.className = 'lib-meta';
      m.textContent = meta.join(' · ');
      el.appendChild(m);
    }

    if (x.note) {
      var n = document.createElement('p');
      n.className = 'lib-note';
      n.textContent = x.note;
      el.appendChild(n);
    }

    if (x.images && x.images.length) {
      var box = document.createElement('div');
      box.className = 'work-docs';
      x.images.forEach(function (img) {
        var fig = document.createElement('figure');
        fig.className = 'work-doc';
        fig.tabIndex = 0;
        fig.setAttribute('role', 'button');
        var i = document.createElement('img');
        i.src = 'assets/img/thumb-' + img.file;
        i.alt = img.caption || 'وثيقة';
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

    var src = document.createElement('p');
    src.className = 'work-src';
    src.textContent = 'مجلة البعثة — ' + (x.volume || '');
    el.appendChild(src);

    return el;
  }

  Array.prototype.forEach.call(filters, function (btn) {
    btn.addEventListener('click', function () {
      Array.prototype.forEach.call(filters, function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      current = btn.dataset.kind;
      render();
    });
  });


  /* ── عارض الوثائق ── */
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
    lbImg.alt = img.caption || 'وثيقة';
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
    return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; });
  }
  function countLabel(n) {
    if (n === 1) return 'عمل واحد';
    if (n === 2) return 'عملان';
    if (n <= 10) return arabicNum(n) + ' أعمال';
    return arabicNum(n) + ' عملاً';
  }
})();
