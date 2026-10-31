/* 刘思雨 · 个人作品集 — 交互脚本
   1) 粘性导航 + 滚动高亮   2) 移动端菜单   3) 图片/视频灯箱   4) 入场动画
*/
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 1. 顶栏状态 + 导航高亮 ---------- */
  var topbar = $('#topbar');
  var navLinks = $$('.nav__a');
  var sections = navLinks
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);

  var prog = $('#prog');
  var onScroll = function () {
    topbar.classList.toggle('is-stuck', window.scrollY > 8);

    /* 顶部阅读进度条 */
    if (prog) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      prog.style.width = (pct * 100) + '%';
    }

    var pos = window.scrollY + window.innerHeight * 0.32;
    var current = null;
    sections.forEach(function (sec) {
      if (sec.offsetTop <= pos) current = sec.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + current);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 2. 移动端菜单 ---------- */
  var nav = $('#nav'), navToggle = $('#navToggle');
  navToggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    navToggle.textContent = open ? '关闭' : '菜单';
  });
  navLinks.forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('is-open');
      navToggle.textContent = '菜单';
    });
  });

  /* ---------- 3. 灯箱 ---------- */
  var lb = $('#lb'), stage = $('#lbStage'), cap = $('#lbCap'), idx = $('#lbIdx');
  var prevBtn = $('#lbPrev'), nextBtn = $('#lbNext');
  var group = [], cursor = -1;

  function render(i) {
    var item = group[i];
    if (!item) return;
    cursor = i;
    stage.innerHTML = '';

    if (item.type === 'video') {
      var v = document.createElement('video');
      v.src = item.src;
      v.poster = item.poster;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.preload = 'metadata';
      v.setAttribute('controlsList', 'nodownload');
      v.setAttribute('disablepictureinpicture', '');
      v.draggable = false;
      v.style.pointerEvents = 'auto';
      stage.appendChild(v);
      cap.innerHTML =
        '<h4>' + item.title + '</h4>' +
        '<p>' + (item.desc || '') + '</p>' +
        '<p style="color:#8A8A8F">正在播放 15″ 预览片段 · 完整片长 ' + (item.dur || '') + '</p>' +
        (item.full ? '<a class="link" href="watch.html?k=' + item.full.split('/').pop().replace('.mp4', '') + '" target="_blank" rel="noopener">在新窗口观看完整版 <span class="arrow">→</span></a>' : '');
    } else {
      var img = document.createElement('img');
      img.src = item.src;
      img.alt = item.title || '';
      img.draggable = false;
      stage.appendChild(img);
      cap.innerHTML =
        '<h4>' + item.title + '</h4>' +
        (item.note ? '<p>' + item.note + '</p>' : '');
    }
    idx.textContent = group.length > 1
      ? String(i + 1).padStart(2, '0') + ' / ' + String(group.length).padStart(2, '0')
      : '';
    var multi = group.length > 1;
    prevBtn.style.display = multi ? '' : 'none';
    nextBtn.style.display = multi ? '' : 'none';
  }

  function open(list, i) {
    group = list;
    lb.classList.add('is-open');
    document.body.classList.add('lb-open');
    render(i);
  }
  function close() {
    lb.classList.remove('is-open');
    document.body.classList.remove('lb-open');
    stage.innerHTML = '';      // 停掉视频
    group = []; cursor = -1;
  }
  function step(d) {
    if (group.length < 2) return;
    render((cursor + d + group.length) % group.length);
  }

  $('#lbClose').addEventListener('click', close);
  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target === stage) close();
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  /* 图片灯箱：同一 data-gallery 为一组 */
  $$('.gal').forEach(function (gal) {
    var items = $$('.gal__item', gal).map(function (el) {
      return {
        type: 'image',
        src: el.dataset.src,
        title: el.dataset.title || '',
        note: el.dataset.note || ''
      };
    });
    $$('.gal__item', gal).forEach(function (el, i) {
      el.addEventListener('click', function () { open(items, i); });
    });
  });

  /* 视频灯箱：一张卡片一片 */
  $$('.vrow').forEach(function (card) {
    card.addEventListener('click', function () {
      open([{
        type: 'video',
        src: card.dataset.clip,
        poster: card.dataset.poster,
        full: card.dataset.full || '',
        dur: card.dataset.dur || '',
        title: card.dataset.title || '',
        desc: card.dataset.desc || ''
      }], 0);
    });
  });

  /* ---------- 4. 入场动画 ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    $$('.rv').forEach(function (el) { io.observe(el); });
  } else {
    $$('.rv').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 5. 光标跟随高光 ---------- */
  $$('.vrow, .gal__item, .doccard, .feature, .contact__cell, .stat').forEach(function (el) {
    el.classList.add('spot');
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  });

  /* ---------- 6. 头像：存在则显示，占位符常驻在下方不影响 ---------- */
  var pImg = $('#portraitImg');
  if (pImg && pImg.complete && pImg.naturalWidth > 0) {
    $('.portrait__ph').style.display = 'none';
  } else if (pImg) {
    pImg.addEventListener('load', function () {
      if (pImg.naturalWidth > 0) $('.portrait__ph').style.display = 'none';
    });
  }

  /* ---------- 7. 仅观看保护 ---------- */
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  });
  document.addEventListener('dragstart', function (e) {
    e.preventDefault();
    return false;
  });
  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); }
  });

})();
