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

  var stage = document.getElementById('stage');

  var state = {
    lang: DEFAULT_LANG,
    view: 'home', // 'home' | 'slides' | 'about'
    slide: 0,
  };

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

  function buildHeader(screen) {
    screen.appendChild(img('assets/logo.svg', 'Quantum Compass')).className = 'logo';

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
    screen.appendChild(bar);
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
    var screen = el('section', 'screen');
    buildHeader(screen);

    copy.blocks.forEach(function (block, i) {
      var wrap = el('div', 'home__block home__block--' + (i === 0 ? 'one' : 'two'));
      wrap.appendChild(el('h2', null, block.title));
      paragraphs(wrap, block.body);
      screen.appendChild(wrap);
    });

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
      screen.appendChild(box);
    });

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

  function buildSlide(index) {
    var copy = t();
    var slide = copy.slides[index];
    var screen = el('section', 'screen');
    buildHeader(screen);

    screen.appendChild(el('h1', 'slide__title', slide.title));

    var body = el('div', 'slide__body');
    paragraphs(body, slide.body);
    screen.appendChild(body);

    var figure = el('div', 'slide__figure');
    figure.appendChild(img('assets/illustrations/slide' + (index + 1) + '.svg'));
    screen.appendChild(figure);

    // Callout labels only appear on the two slides that carry them in the
    // design: the bare apparatus (1) and the word-mask version (5).
    if (index === 0 || index === 4) {
      var labels = copy.sceneLabels;
      [
        ['source', labels.source],
        ['barrier', labels.barrier],
        ['slit-1', labels.slit],
        ['slit-2', labels.slit],
        ['screen', labels.screen],
      ].forEach(function (pair) {
        screen.appendChild(el('span', 'scene-label scene-label--' + pair[0], pair[1]));
      });
    }

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
    var screen = el('section', 'screen');
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

    // Institutional lockup. Replace the spans with the supplied logo files.
    var footer = el('div', 'about__footer');
    var left = el('div', 'about__footer-logo');
    left.appendChild(el('span', null, 'Creative Intelligence Lab'));
    var right = el('div', 'about__footer-logo');
    right.appendChild(el('span', null, 'Barcelona Supercomputing Center'));
    footer.append(left, right);
    screen.appendChild(footer);

    var back = buildArrow('prev', function () {
      go('home');
    });
    back.classList.add('about__back');
    screen.appendChild(back);

    return screen;
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
    // Next frame, so the opacity transition actually runs.
    requestAnimationFrame(function () {
      screen.classList.add('is-active');
    });

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
    var scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
    document.documentElement.style.setProperty('--scale', String(scale));
  }

  /* ---------------------------------------------------------------- */
  /* Kiosk behaviour                                                  */
  /* ---------------------------------------------------------------- */

  function hardenForKiosk() {
    // Block pinch-zoom and double-tap zoom, which otherwise leave the kiosk
    // stuck at the wrong scale with no way for a visitor to recover.
    document.addEventListener(
      'gesturestart',
      function (e) {
        e.preventDefault();
      },
      { passive: false }
    );

    document.addEventListener('contextmenu', function (e) {
      e.preventDefault();
    });

    // Hide the pointer until a real mouse shows up, so the kiosk has no cursor
    // but a laptop used for review still does.
    document.body.classList.add('kiosk-cursor-hidden');
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

    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);

    hardenForKiosk();
    bindKeys();
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
