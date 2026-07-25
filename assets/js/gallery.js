// معرض الصور — أرشيف حمد عيسى جاسم الرجيب

(function () {
  var ERAS = {
    mission: 'البعثة',
    kuwait: 'الكويت',
    embassy: 'السفارة',
    ministry: 'الوزارة'
  };

  var grid = document.getElementById('grid');
  if (!grid) return;

  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lbCaption = document.getElementById('lb-caption');
  var countEl = document.getElementById('photo-count');

  var photos = [];
  var visible = [];
  var current = 0;

  fetch('data/photos.json')
    .then(function (r) {
      if (!r.ok) throw new Error('تعذّر تحميل البيانات');
      return r.json();
    })
    .then(function (data) {
      photos = data;
      countEl.textContent = photos.length.toLocaleString('ar-EG') + ' صورة';
      render('all');
    })
    .catch(function () {
      grid.innerHTML = '<p class="grid-status">تعذّر تحميل الصور. حدّث الصفحة للمحاولة مرة أخرى.</p>';
    });

  function altText(p) {
    var parts = [];
    if (p.caption) parts.push(p.caption);
    if (p.year) parts.push(p.year);
    return parts.join(' — ') || 'صورة من الأرشيف';
  }

  function render(era) {
    visible = photos.filter(function (p) {
      return era === 'all' || p.era === era;
    });

    if (!visible.length) {
      grid.innerHTML = '<p class="grid-status">لا توجد صور في هذه المرحلة بعد.</p>';
      return;
    }

    grid.innerHTML = '';
    visible.forEach(function (p, i) {
      var fig = document.createElement('figure');
      fig.className = 'photo';
      fig.tabIndex = 0;
      fig.setAttribute('role', 'button');

      var img = document.createElement('img');
      img.src = 'assets/img/' + p.file;
      img.alt = altText(p);
      img.loading = 'lazy';

      var cap = document.createElement('figcaption');
      var meta = '';
      if (p.year) meta += '<span class="photo-year">' + p.year + '</span>';
      if (p.era && ERAS[p.era]) meta += '<span class="photo-era">' + ERAS[p.era] + '</span>';
      cap.innerHTML = meta + '<span class="photo-caption">' + (p.caption || '') + '</span>';

      fig.appendChild(img);
      fig.appendChild(cap);

      fig.addEventListener('click', function () { open(i); });
      fig.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });

      grid.appendChild(fig);
    });
  }

  function open(i) {
    current = i;
    show();
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function show() {
    var p = visible[current];
    if (!p) return;
    lbImg.src = 'assets/img/' + p.file;
    lbImg.alt = altText(p);

    var html = '';
    if (p.caption) html += '<span class="lb-text">' + p.caption + '</span>';
    var meta = [];
    if (p.year) meta.push(p.year);
    if (p.era && ERAS[p.era]) meta.push(ERAS[p.era]);
    if (p.people) meta.push(p.people);
    if (meta.length) html += '<span class="lb-meta">' + meta.join(' · ') + '</span>';
    html += '<span class="lb-count">' + (current + 1) + ' من ' + visible.length + '</span>';
    lbCaption.innerHTML = html;
  }

  function close() {
    lightbox.hidden = true;
    lbImg.src = '';
    document.body.style.overflow = '';
  }

  function step(n) {
    current = (current + n + visible.length) % visible.length;
    show();
  }

  lightbox.querySelector('.lb-close').addEventListener('click', close);
  lightbox.querySelector('.lb-next').addEventListener('click', function () { step(1); });
  lightbox.querySelector('.lb-prev').addEventListener('click', function () { step(-1); });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', function (e) {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(1);
    if (e.key === 'ArrowRight') step(-1);
  });

  var filters = document.querySelectorAll('.filter');
  Array.prototype.forEach.call(filters, function (btn) {
    btn.addEventListener('click', function () {
      Array.prototype.forEach.call(filters, function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      render(btn.dataset.era);
    });
  });
})();
