/* ===== كُتب عنه ===== */
(function () {
  var listEl  = document.getElementById('lib');
  var countEl = document.getElementById('lib-count');
  var filters = document.querySelectorAll('.filter');
  var items   = [];
  var current = 'all';

  var CAT_ORDER = ['book', 'thesis', 'article', 'interview', 'video'];
  var CAT_LABEL = {
    book: 'كتب',
    thesis: 'رسائل جامعية',
    article: 'مقالات عنه',
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

    var meta = [];
    if (x.author) meta.push(x.author);
    if (x.source) meta.push(x.source);
    if (x.date)   meta.push(x.date);
    if (x.type)   meta.push(x.type);

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
