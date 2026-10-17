/* ===== الألحان والتسجيلات ===== */
(function () {
  var listEl  = document.getElementById('tracks');
  var countEl = document.getElementById('track-count');
  var filters = document.querySelectorAll('.filter');
  var tracks  = [];
  var current = 'all';

  var TYPE_LABEL = {
    instrumental: 'قطعة موسيقية',
    song: 'لحن مُغنّى'
  };

  fetch('data/music.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      tracks = data;
      render();
    })
    .catch(function () {
      listEl.innerHTML = '<p class="grid-status">تعذّر تحميل التسجيلات.</p>';
    });

  function render() {
    var shown = tracks.filter(function (t) {
      return current === 'all' ? true : t.type === current;
    });

    countEl.textContent = shown.length ? countLabel(shown.length) : '';

    if (!shown.length) {
      listEl.innerHTML = '<p class="grid-status">لا توجد تسجيلات في هذا القسم بعد.</p>';
      return;
    }

    listEl.innerHTML = '';
    shown.forEach(function (t) {
      listEl.appendChild(buildCard(t));
    });
  }

  /* ── واجهة مؤجّلة ليوتيوب: صورة مصغّرة فقط، والمشغّل يُنشأ عند الضغط ── */
  function buildYouTube(t) {
    var facade = document.createElement('button');
    facade.className = 'yt-facade';
    facade.type = 'button';
    facade.setAttribute('aria-label', 'تشغيل: ' + (t.title || 'تسجيل'));
    facade.style.backgroundImage =
      'url(https://i.ytimg.com/vi/' + t.id + '/hqdefault.jpg)';
    facade.innerHTML = '<span class="yt-play" aria-hidden="true"></span>';

    facade.addEventListener('click', function () {
      var frame = document.createElement('iframe');
      frame.src =
        'https://www.youtube-nocookie.com/embed/' + t.id + '?autoplay=1&rel=0';
      frame.title = t.title || 'تسجيل';
      frame.loading = 'lazy';
      frame.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      frame.allowFullscreen = true;
      facade.replaceWith(frame);
    });

    return facade;
  }

  /* ── مصدر خارجي لا يقبل التضمين: لوحة انتقال إلى الجهة الحافظة ── */
  function buildExternal(t) {
    var link = document.createElement('a');
    link.className = 'ext-facade';
    link.href = t.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.setAttribute('aria-label', 'الاستماع في المصدر: ' + (t.title || 'تسجيل'));

    var play = document.createElement('span');
    play.className = 'yt-play';
    play.setAttribute('aria-hidden', 'true');
    link.appendChild(play);

    var cap = document.createElement('span');
    cap.className = 'ext-caption';
    cap.textContent = 'الاستماع في المصدر';
    link.appendChild(cap);

    return link;
  }

  function buildCard(t) {
    var card = document.createElement('article');
    card.className = 'track';

    card.appendChild(t.id ? buildYouTube(t) : buildExternal(t));

    var body = document.createElement('div');
    body.className = 'track-body';

    var h = document.createElement('h2');
    h.className = 'track-title';
    h.textContent = t.title || '—';
    body.appendChild(h);

    var meta = [];
    if (TYPE_LABEL[t.type]) meta.push(TYPE_LABEL[t.type]);
    if (t.role) meta.push(t.role + ': حمد عيسى الرجيب');
    if (t.year) meta.push(t.year);
    if (t.performer) meta.push('أداء: ' + t.performer);
    if (t.lyricist) meta.push('كلمات: ' + t.lyricist);

    if (meta.length) {
      var m = document.createElement('p');
      m.className = 'track-meta';
      m.textContent = meta.join(' · ');
      body.appendChild(m);
    }

    if (t.note) {
      var n = document.createElement('p');
      n.className = 'track-note';
      n.textContent = t.note;
      body.appendChild(n);
    }

    if (t.channel || t.source) {
      var s = document.createElement('p');
      s.className = 'track-source';
      s.textContent = t.channel
        ? 'المصدر: قناة ' + t.channel + ' على يوتيوب'
        : 'المصدر: ' + t.source;
      body.appendChild(s);
    }

    card.appendChild(body);
    return card;
  }

  Array.prototype.forEach.call(filters, function (btn) {
    btn.addEventListener('click', function () {
      Array.prototype.forEach.call(filters, function (b) {
        b.classList.remove('is-active');
      });
      btn.classList.add('is-active');
      current = btn.dataset.type;
      render();
    });
  });

  function arabicNum(n) {
    return String(n).replace(/\d/g, function (d) {
      return '٠١٢٣٤٥٦٧٨٩'[d];
    });
  }
  function countLabel(n) {
    if (n === 1) return 'تسجيل واحد';
    if (n === 2) return 'تسجيلان';
    if (n <= 10) return arabicNum(n) + ' تسجيلات';
    return arabicNum(n) + ' تسجيلاً';
  }
})();
