/*
 * Quantum Compass — companion site
 * --------------------------------
 * Renders every screen from window.CONTENT and handles navigation, language
 * and the kiosk-specific browser behaviour.
 *
 * Deliberately dependency-free and written as a classic script (no ES modules,
 * no fetch) so the page runs straight from file:// on the Raspberry Pi with no
 * web server. Keep it that way — introducing `import` or `fetch` here silently
 * breaks the offline file:// deployment.
 */
(function () {
  'use strict';

  var CANVAS_W = 2227.5;
  var CANVAS_H = 3960;
  var STORAGE_KEY = 'qc.lang';
  var DEFAULT_LANG = 'es';
  // Inactivity before the attract loop takes over. Override without touching
  // this file by setting window.QC_IDLE_MS in index.html before app.js loads —
  // handy for tuning on site, or for testing without waiting two minutes.
  var IDLE_MS = window.QC_IDLE_MS || 2 * 60 * 1000;

  var stage = document.getElementById('stage');

  var state = {
    lang: DEFAULT_LANG,
    view: 'home', // 'home' | 'slides' | 'about'
    slide: 0,
  };

  /* ---------------------------------------------------------------- */
  /* Layout mode                                                      */
  /* ---------------------------------------------------------------- */

  /*
   * Two layouts share one set of files:
   *
   *   kiosk — the 2228 x 3960 design canvas, scaled to fit. Pixel-faithful to
   *           Figma, no reflow. What the touchscreen at the installation runs.
   *   fluid — reflows for phones, tablets and landscape desktop. What the
   *           public website will use.
   *
   * The kiosk panel is the only display that is both portrait and enormous, so
   * that combination selects it. Everything else gets the fluid layout. Append
   * ?layout=kiosk or ?layout=fluid to force one — useful for checking the
   * kiosk rendering on a laptop.
   */
  var KIOSK_MIN_WIDTH = 1500;

  function detectLayout() {
    var forced = /[?&]layout=(kiosk|fluid)/.exec(window.location.search);
    if (forced) return forced[1];
    var portrait = window.innerHeight > window.innerWidth;
    return portrait && window.innerWidth >= KIOSK_MIN_WIDTH ? 'kiosk' : 'fluid';
  }

  function isKiosk() {
    return document.documentElement.classList.contains('layout-kiosk');
  }

  /*
   * The class goes on <html> as well as <body>. The kiosk pins both to
   * `height: 100%; overflow: hidden`, and a rule scoped under a class on <body>
   * cannot reach <html> to undo it — so the fluid layout could not scroll.
   */
  function applyLayout() {
    var mode = detectLayout();
    if (document.documentElement.classList.contains('layout-' + mode)) return false;
    [document.documentElement, document.body].forEach(function (node) {
      node.classList.remove('layout-kiosk', 'layout-fluid');
      node.classList.add('layout-' + mode);
    });
    return true; // changed
  }

  /* ---------------------------------------------------------------- */
  /* Small DOM helpers                                                */
  /* ---------------------------------------------------------------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function paragraphs(parent, list) {
    (list || []).forEach(function (line) {
      parent.appendChild(el('p', null, line));
    });
  }

  function img(src, alt) {
    var node = document.createElement('img');
    node.src = src;
    node.alt = alt || '';
    return node;
  }

  function t() {
    return window.CONTENT[state.lang] || window.CONTENT[DEFAULT_LANG];
  }

  /* ---------------------------------------------------------------- */
  /* Shared chrome                                                    */
  /* ---------------------------------------------------------------- */

  /*
   * Wrapper elements (header, slide text, home groups) exist for the fluid
   * layout, which needs real containers to lay out. They are inert on the
   * kiosk: its children are absolutely positioned against the screen, and a
   * static wrapper does not become their containing block.
   */
  function buildHeader(screen) {
    var header = el('header', 'screen__header');

    // The logo doubles as the home button on every screen — it is the one
    // control a visitor can rely on being in the same place throughout.
    var home = el('button', 'logo');
    home.type = 'button';
    home.setAttribute('aria-label', 'Quantum Compass — home');
    home.appendChild(img('assets/logo.svg', 'Quantum Compass'));
    home.addEventListener('click', function () {
      go('home');
    });
    header.appendChild(home);

    var bar = el('div', 'langbar');
    window.CONTENT.languages.forEach(function (lang) {
      var btn = el('button', 'lang' + (lang.code === state.lang ? ' is-active' : ''), lang.label);
      btn.type = 'button';
      btn.lang = lang.code;
      btn.setAttribute('aria-pressed', String(lang.code === state.lang));
      btn.addEventListener('click', function () {
        setLanguage(lang.code);
      });
      bar.appendChild(btn);
    });
    header.appendChild(bar);
    screen.appendChild(header);
  }

  function buildArrow(direction, onClick) {
    var btn = el('button', 'nav-arrow nav-arrow--' + direction);
    btn.type = 'button';
    btn.setAttribute('aria-label', direction === 'next' ? 'Next' : 'Previous');
    btn.appendChild(img('assets/chevron.svg'));
    btn.addEventListener('click', onClick);
    return btn;
  }

  /* ---------------------------------------------------------------- */
  /* Screens                                                          */
  /* ---------------------------------------------------------------- */

  function buildHome() {
    var copy = t().home;
    var screen = el('section', 'screen screen--home');
    buildHeader(screen);

    var blocks = el('div', 'home__blocks');
    copy.blocks.forEach(function (block, i) {
      var wrap = el('div', 'home__block home__block--' + (i === 0 ? 'one' : 'two'));
      wrap.appendChild(el('h2', null, block.title));
      paragraphs(wrap, block.body);
      blocks.appendChild(wrap);
    });
    screen.appendChild(blocks);

    var videos = el('div', 'home__videos');
    copy.videos.forEach(function (video, i) {
      var box = el('div', 'home__video home__video--' + (i === 0 ? 'left' : 'right'));
      // Real files are dropped in as assets/video/<id>.mp4 — see README. Until
      // then the box shows its label so the layout is reviewable.
      var node = document.createElement('video');
      node.src = 'assets/video/' + video.id + '.mp4';
      node.muted = true;
      node.loop = true;
      node.autoplay = true;
      node.playsInline = true;
      node.setAttribute('aria-label', video.label);
      node.addEventListener('error', function () {
        box.replaceChildren(el('span', 'home__video-placeholder', video.label));
      });
      box.appendChild(node);
      videos.appendChild(box);
    });
    screen.appendChild(videos);

    screen.appendChild(el('p', 'home__prompt', copy.prompt));

    var actions = el('div', 'home__actions');
    var toSlides = el('button', 'btn btn--solid', copy.ctaExperiment);
    toSlides.type = 'button';
    toSlides.addEventListener('click', function () {
      go('slides', 0);
    });
    var toAbout = el('button', 'btn btn--outline', copy.ctaAbout);
    toAbout.type = 'button';
    toAbout.addEventListener('click', function () {
      go('about');
    });
    actions.append(toSlides, toAbout);
    screen.appendChild(actions);

    return screen;
  }

  /*
   * The annotated scene — illustration, callout labels and the cat.
   *
   * Labels are positioned as percentages of the illustration box rather than
   * in canvas pixels. On the kiosk that renders identically (the percentages
   * were derived from the design coordinates), but it also makes the scene a
   * self-contained unit that stays correct at any size — which is what lets
   * the same markup serve the phone and desktop layouts.
   *
   * Slides 1 and 5 carry labels in the design. Their positions differ by up to
   * 0.4% of the scene — about one rendered pixel on the kiosk — so both use one
   * shared set rather than each carrying its own.
   */
  var SCENE_LABELS = [
    { key: 'source', label: 'source', left: -7.19, top: 101.51 },
    { key: 'barrier', label: 'barrier', left: 21.76, top: 80.17 },
    { key: 'slit-1', label: 'slit', left: 33.99, top: 44.94 },
    { key: 'slit-2', label: 'slit', left: 45.58, top: 51.93 },
    { key: 'screen', label: 'screen', left: 57.31, top: 38.5 },
  ];

  // Where the cat stands on the slides that carry it, as a percentage of the
  // illustration box (slide index -> position).
  var CAT_SPOTS = { 0: { left: 15.58, top: 40.14 }, 1: { left: -5.42, top: 95.2 } };

  function buildScene(screen, figure, index) {
    var spot = CAT_SPOTS[index];
    if (spot) {
      var cat = el('div', 'slide__cat');
      cat.style.left = spot.left + '%';
      cat.style.top = spot.top + '%';
      var catImg = img('assets/cat.svg');
      // Hidden rather than shown broken while the asset is missing.
      catImg.addEventListener('error', function () {
        cat.remove();
      });
      cat.appendChild(catImg);
      figure.appendChild(cat);
    }

    // Callout labels only appear on the two slides that carry them in the
    // design: the bare apparatus (1) and the word-mask version (5).
    if (index !== 0 && index !== 4) return;

    var names = t().sceneLabels;
    var legend = el('ol', 'scene-legend');

    SCENE_LABELS.forEach(function (spec, i) {
      var text = names[spec.label];

      var node = el('span', 'scene-label scene-label--' + spec.key);
      node.style.left = spec.left + '%';
      node.style.top = spec.top + '%';
      // The marker carries the number for small screens, where the words
      // themselves would be far too small to read; the legend below decodes it.
      node.appendChild(el('span', 'scene-label__marker', String(i + 1)));
      node.appendChild(el('span', 'scene-label__text', text));
      figure.appendChild(node);

      legend.appendChild(el('li', null, text));
    });

    screen.appendChild(legend);
  }

  function buildSlide(index) {
    var copy = t();
    var slide = copy.slides[index];
    var screen = el('section', 'screen screen--slide slide--' + (index + 1));
    // Slide 5 re-draws the apparatus with word masks; its scene sits a few
    // pixels off the others, so it carries its own positioning hook.
    if (index === 4) screen.classList.add('slide--words');
    buildHeader(screen);

    var text = el('div', 'slide__text');
    text.appendChild(el('h1', 'slide__title', slide.title));

    var body = el('div', 'slide__body');
    paragraphs(body, slide.body);
    text.appendChild(body);
    screen.appendChild(text);

    var figure = el('div', 'slide__figure');
    figure.appendChild(img('assets/illustrations/slide' + (index + 1) + '.svg'));
    screen.appendChild(figure);
    buildScene(screen, figure, index);

    // First slide steps back to the home screen rather than dead-ending.
    screen.appendChild(
      buildArrow('prev', function () {
        if (index === 0) go('home');
        else go('slides', index - 1);
      })
    );

    if (index < copy.slides.length - 1) {
      screen.appendChild(
        buildArrow('next', function () {
          go('slides', index + 1);
        })
      );
    }

    return screen;
  }

  function buildAbout() {
    var copy = t().about;
    var screen = el('section', 'screen screen--about');
    buildHeader(screen);

    copy.sections.forEach(function (section) {
      var block = el('section', 'about__section');
      block.appendChild(el('h2', null, section.title));
      paragraphs(block, section.body);
      screen.appendChild(block);
    });

    var credits = el('section', 'about__section about__credits');
    credits.appendChild(el('h2', null, copy.creditsTitle));
    credits.appendChild(el('p', null, copy.credits));
    screen.appendChild(credits);

    // Small drawn mark that sits between the credits and the footer. Not yet
    // exported from Figma (node 983:989) — hidden until the file exists so it
    // never shows a broken image on the kiosk.
    var mark = img('assets/about-mark.svg');
    mark.className = 'about__mark';
    mark.addEventListener('error', function () {
      mark.remove();
    });
    screen.appendChild(mark);

    // Institutional lockup, exported from Figma as a single asset.
    var footer = img('assets/logos-lockup.svg', 'Creative Intelligence Lab · Barcelona Supercomputing Center');
    footer.className = 'about__footer';
    screen.appendChild(footer);

    // No back arrow here: the logo in the header already returns home, and a
    // second control doing the same thing just adds noise.
    return screen;
  }

  /* ---------------------------------------------------------------- */
  /* Screensaver                                                      */
  /* ---------------------------------------------------------------- */

  /*
   * After IDLE_MS with nobody touching the panel, an attract loop takes over:
   * the diffraction video full-bleed with the two institutional logos at the
   * bottom (Figma "Group 81"). Any touch dismisses it and returns to the home
   * screen, so each visitor starts from the same place rather than halfway
   * through whatever the last person was reading.
   *
   * It lives outside the normal screen stack as an overlay, so showing it does
   * not disturb `state.view` — there is nothing to restore when it closes.
   */
  var idleTimer = null;
  var screensaver = null;

  function buildScreensaver() {
    var node = el('div', 'screensaver');
    node.setAttribute('aria-hidden', 'true');

    var video = document.createElement('video');
    video.className = 'screensaver__video';
    video.src = 'assets/video/screensaver.mp4';
    video.poster = 'assets/screensaver-poster.png';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    // If the file is missing the poster still shows, so the attract screen is
    // never blank while the video is being produced.
    video.addEventListener('error', function () {
      node.classList.add('screensaver--poster-only');
    });
    node.appendChild(video);

    var lockup = img('assets/logos-lockup.svg');
    lockup.className = 'screensaver__logos';
    node.appendChild(lockup);

    return node;
  }

  function showScreensaver() {
    if (screensaver) return;
    screensaver = buildScreensaver();
    document.body.appendChild(screensaver);
    requestAnimationFrame(function () {
      screensaver.classList.add('is-active');
    });
    var v = screensaver.querySelector('video');
    if (v) {
      var play = v.play();
      if (play && play.catch) play.catch(function () {});
    }
  }

  function hideScreensaver() {
    if (!screensaver) return;
    screensaver.remove();
    screensaver = null;
  }

  function resetIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    if (!isKiosk()) return; // the attract loop is an installation behaviour
    idleTimer = setTimeout(showScreensaver, IDLE_MS);
  }

  function bindIdle() {
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (evt) {
      window.addEventListener(
        evt,
        function () {
          if (screensaver) {
            // The gesture that wakes the panel only dismisses the attract
            // loop; it must not also land on whatever is underneath.
            hideScreensaver();
            go('home');
          }
          resetIdle();
        },
        { capture: true, passive: true }
      );
    });
    resetIdle();
  }

  /* ---------------------------------------------------------------- */
  /* Rendering + navigation                                           */
  /* ---------------------------------------------------------------- */

  function render() {
    var screen;
    if (state.view === 'home') screen = buildHome();
    else if (state.view === 'about') screen = buildAbout();
    else screen = buildSlide(state.slide);

    stage.replaceChildren(screen);
    /*
     * Applied synchronously, not inside requestAnimationFrame. `is-active`
     * controls whether the screen is displayed at all, and rAF does not fire in
     * a background tab — so deferring it could leave the page blank until the
     * tab was focused. The fade is a CSS animation, which runs on insertion and
     * needs no second frame to start from.
     */
    screen.classList.add('is-active');

    document.documentElement.lang = t().htmlLang;
  }

  function go(view, slide) {
    state.view = view;
    if (typeof slide === 'number') state.slide = slide;
    render();
  }

  function setLanguage(code) {
    if (code === state.lang) return;
    state.lang = code;
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {
      /* Private mode or a locked-down profile — language just won't persist. */
    }
    render();
  }

  /* ---------------------------------------------------------------- */
  /* Scale the fixed canvas to the display                            */
  /* ---------------------------------------------------------------- */

  function fit() {
    // Only the kiosk layout uses the scaled canvas; the fluid layout lays out
    // in real CSS pixels and ignores --scale entirely.
    var changed = applyLayout();
    var scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
    document.documentElement.style.setProperty('--scale', String(scale));
    if (changed) {
      // Switching layout changes which behaviours apply (idle attract loop,
      // hidden cursor), so re-run the parts that depend on it.
      syncLayoutBehaviour();
    }
  }

  /* ---------------------------------------------------------------- */
  /* Kiosk behaviour                                                  */
  /* ---------------------------------------------------------------- */

  /*
   * Behaviours that belong to the installation but not to a website: the
   * attract loop after two minutes of idling, and the hidden mouse cursor.
   * Both would be baffling on the public site, so they follow the layout.
   */
  function syncLayoutBehaviour() {
    if (isKiosk()) {
      resetIdle();
      document.body.classList.add('kiosk-cursor-hidden');
    } else {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = null;
      hideScreensaver();
      document.body.classList.remove('kiosk-cursor-hidden');
    }
  }

  function hardenForKiosk() {
    // Block pinch-zoom and double-tap zoom, which otherwise leave the kiosk
    // stuck at the wrong scale with no way for a visitor to recover. Only on
    // the kiosk: on a website, pinch-zoom is an accessibility requirement.
    document.addEventListener(
      'gesturestart',
      function (e) {
        if (isKiosk()) e.preventDefault();
      },
      { passive: false }
    );

    document.addEventListener('contextmenu', function (e) {
      if (isKiosk()) e.preventDefault();
    });

    // Hide the pointer until a real mouse shows up, so the kiosk has no cursor
    // but a laptop used for review still does. syncLayoutBehaviour() adds the
    // class; this only takes it away again.
    window.addEventListener(
      'mousemove',
      function () {
        document.body.classList.remove('kiosk-cursor-hidden');
      },
      { once: true }
    );
  }

  /* Keyboard navigation — for reviewing on a laptop, and handy if the venue
     ever wires a presenter remote to the Pi. */
  function bindKeys() {
    window.addEventListener('keydown', function (e) {
      if (state.view !== 'slides') {
        if (e.key === 'Escape') go('home');
        return;
      }
      if (e.key === 'ArrowRight' && state.slide < t().slides.length - 1) {
        go('slides', state.slide + 1);
      } else if (e.key === 'ArrowLeft') {
        if (state.slide === 0) go('home');
        else go('slides', state.slide - 1);
      } else if (e.key === 'Escape') {
        go('home');
      }
    });
  }

  /*
   * Horizontal swipe between slides. Expected on a phone, and harmless on the
   * kiosk where the chevrons remain the obvious control.
   */
  function bindSwipe() {
    var startX = 0;
    var startY = 0;
    var tracking = false;

    window.addEventListener(
      'touchstart',
      function (e) {
        if (e.touches.length !== 1) return;
        tracking = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      },
      { passive: true }
    );

    window.addEventListener(
      'touchend',
      function (e) {
        if (!tracking) return;
        tracking = false;
        if (state.view !== 'slides' || screensaver) return;

        var touch = e.changedTouches[0];
        var dx = touch.clientX - startX;
        var dy = touch.clientY - startY;
        // Ignore anything that is mostly vertical — that is the reader
        // scrolling the page, not asking for the next slide.
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

        var last = t().slides.length - 1;
        if (dx < 0) {
          if (state.slide < last) go('slides', state.slide + 1);
        } else if (state.slide === 0) {
          go('home');
        } else {
          go('slides', state.slide - 1);
        }
      },
      { passive: true }
    );
  }

  /* ---------------------------------------------------------------- */
  /* Boot                                                             */
  /* ---------------------------------------------------------------- */

  /*
   * Warm the browser cache with every illustration up front. Screens are
   * rebuilt from scratch on each navigation, so without this the first visit
   * to a slide waits on its SVG — and slide 6 carries an embedded bitmap of
   * the diffraction pattern that is far heavier than the rest. Decoding that
   * on demand is visible on a Raspberry Pi; decoding it during the idle moment
   * after boot is not.
   */
  function preloadArtwork() {
    var count = window.CONTENT[DEFAULT_LANG].slides.length;
    for (var i = 1; i <= count; i++) {
      new Image().src = 'assets/illustrations/slide' + i + '.svg';
    }
    new Image().src = 'assets/about-mark.svg';
  }

  function init() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && window.CONTENT[saved]) state.lang = saved;
    } catch (e) {
      /* Storage unavailable — fall back to the default language. */
    }

    applyLayout();
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);

    hardenForKiosk();
    bindKeys();
    bindIdle();
    bindSwipe();
    syncLayoutBehaviour();
    render();

    // After the first screen is on the glass, not before.
    if (window.requestIdleCallback) window.requestIdleCallback(preloadArtwork);
    else setTimeout(preloadArtwork, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
