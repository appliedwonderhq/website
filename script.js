/**
 * Applied Wonder — soft dots engraving (design 4a)
 * - Dot-grid hero rendered from the landscape engraving
 * - Wordmark hover play: "Applied" jumps, "wonder" scatters
 * - Loops newsletter signup handling
 */

/* ============================================================
 * Wordmark hover
 * "Applied" — fast sequential jump, plays once per hover.
 * "wonder" — scatter (arc lift + rotation).
 * ============================================================ */
const WORDMARK_SETTINGS = {
  appliedJump: 20,    // px
  appliedStep: 60,    // ms between letters
  appliedSpeed: 325,  // ms per-letter hop duration
  wonderLift: 13,     // px
  wonderRotate: 10,   // degrees
  wonderStagger: 15   // ms between letters
};

function initWordmark() {
  const wm = document.querySelector('[data-wordmark]');
  if (!wm) return;

  const groups = {};
  wm.querySelectorAll('[data-l]').forEach((el) => {
    const g = el.getAttribute('data-g');
    (groups[g] = groups[g] || []).push(el);
  });

  Object.entries(groups).forEach(([g, letters]) => {
    const n = letters.length;
    let on, off;

    if (g === 'ap') {
      // "Applied" — fast sequential jump, plays ONCE per hover, resets on leave
      on = () => {
        const { appliedJump, appliedStep, appliedSpeed } = WORDMARK_SETTINGS;
        letters.forEach((el, i) => {
          el.style.setProperty('--jh', appliedJump + 'px');
          el.style.animation = 'none';
          // force reflow so a re-hover restarts the animation cleanly
          void el.offsetWidth;
          el.style.animation = `aw-jump ${appliedSpeed}ms ease ${i * appliedStep}ms 1`;
        });
      };
      off = () => letters.forEach((el) => { el.style.animation = 'none'; });
    } else {
      // "wonder" — scatter (arc lift + rotation)
      on = () => {
        const { wonderLift, wonderRotate, wonderStagger } = WORDMARK_SETTINGS;
        letters.forEach((el, i) => {
          const arc = Math.sin((i + 0.5) / n * Math.PI);
          const dy = -(4 + arc * wonderLift);
          const rot = (i % 2 ? 1 : -1) * (wonderRotate * 0.6 + (i % 3) * (wonderRotate * 0.4)) + (arc - 0.5) * (wonderRotate * 0.6);
          el.style.transitionDelay = (i * wonderStagger) + 'ms';
          el.style.transform = `translateY(${dy.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`;
          el.style.zIndex = '5';
        });
      };
      off = () => letters.forEach((el) => {
        el.style.transitionDelay = '0ms';
        el.style.transform = '';
        el.style.zIndex = '';
      });
    }

    // hover zone covers the whole word area (not just the letter cut-outs)
    const zone = wm.querySelector(`[data-zone="${g}"]`);
    if (zone) {
      zone.addEventListener('pointerenter', on);
      zone.addEventListener('pointerleave', off);
    }
  });
}

/* ============================================================
 * Dot-grid hero
 * Downsamples the engraving to a micro-stipple grid and renders
 * the finished plate statically (animation disabled).
 * ============================================================ */
function startGridHero(canvas) {
  const style = canvas.getAttribute('data-style') || 'dots';
  const src = canvas.getAttribute('data-src');
  const INK = '42,36,24';                 // #2a2418
  const CELL = parseFloat(canvas.getAttribute('data-cell')) || (style === 'ticks' ? 2.6 : 2.2); // css px
  const INTRO = 7.0;                       // seconds to fully compose
  const reduce = true; // animation disabled — render the finished plate statically

  const img = new Image();
  img.decoding = 'async';
  img.onload = () => build(img);
  img.src = src;

  // cheap value noise
  const hash = (x, y) => { let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
  const vnoise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  };

  let ctx, cols, rows, ix, iy, iw, ih, N;
  let ink, birth, phase, ax, ay, lit, litN; // typed arrays
  const build = (image) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const heroEl = canvas.parentElement;
    const cssW = canvas.clientWidth || 1180;

    // the hero is sized to the viewport; scale the plate to cover it
    const cssH = heroEl.clientHeight || 660;
    // breathing-room scale: widen the plate so the framing trees spread apart and
    // the wordmark sits in the clearing between them
    const ar = image.naturalWidth / image.naturalHeight;
    iw = cssW * 1.18; ih = iw / ar;
    if (ih < cssH) { ih = cssH; iw = ih * ar; }
    // center the plate so any overflow crops evenly on all sides
    ix = (cssW - iw) / 2; iy = (cssH - ih) / 2;

    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    cols = Math.max(2, Math.round(iw / CELL));
    rows = Math.max(2, Math.round(ih / CELL));
    N = cols * rows;

    // downsample the plate to grid resolution and read brightness
    const tmp = document.createElement('canvas');
    tmp.width = cols; tmp.height = rows;
    const tc = tmp.getContext('2d');
    tc.drawImage(image, 0, 0, cols, rows);
    const data = tc.getImageData(0, 0, cols, rows).data;

    ink = new Float32Array(N); birth = new Float32Array(N);
    phase = new Float32Array(N); ax = new Float32Array(N); ay = new Float32Array(N);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = c + r * cols, p = i * 4;
        const lum = (data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114) / 255;
        // engraving is pale ink on cream — lift contrast so line-work reads
        let k = (0.93 - lum) / 0.52; k = k < 0 ? 0 : k > 1 ? 1 : k;
        ink[i] = k;
        // reveal order: a slight top-to-bottom lean dominated by organic patchiness
        birth[i] = Math.min(1, Math.max(0, 0.16 + 0.30 * (r / rows) + 0.66 * (vnoise(c * 0.08, r * 0.08) - 0.42)));
        phase[i] = hash(c, r) * 6.283;
        const g = 0.55 + 0.9 * vnoise(c * 0.14 + 5, r * 0.14 + 9); // hatch angle field
        ax[i] = Math.cos(g); ay[i] = Math.sin(g);
      }
    }

    // engraving ink is sparse — precompute the lit cells so each frame only touches those
    lit = new Int32Array(N); litN = 0;
    for (let k2 = 0; k2 < N; k2++) { if (ink[k2] >= 0.06) lit[litN++] = k2; }

    if (reduce) { draw(INTRO + 4); return; }
    const FPS = CELL < 2.2 ? 22 : 30, FRAME = 1000 / FPS;
    const FREEZE = CELL < 2.2;               // stop redrawing micro grids once composed
    let raf = 0, t0 = 0, last = 0, running = false;
    const loop = (now) => {
      if (!running) return;
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      if (now - last >= FRAME) { last = now; draw(t); }
      if (FREEZE && t > INTRO + 2.5) { running = false; return; } // hold the finished plate
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (running) return; running = true; raf = requestAnimationFrame(loop); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    const io = new IntersectionObserver((es) => { es[0].isIntersecting ? start() : stop(); }, { threshold: 0.02 });
    io.observe(canvas);
  };

  const draw = (t) => {
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight;
    ctx.clearRect(0, 0, cssW, cssH);
    const intro = Math.min(t / INTRO, 1);
    const dxw = iw / cols, dyh = ih / rows;
    const half = CELL * 0.5;
    const dots = style === 'dots';
    if (dots) ctx.fillStyle = 'rgba(' + INK + ',1)';
    else { ctx.strokeStyle = 'rgba(' + INK + ',1)'; ctx.lineCap = 'round'; }
    const tf = t * (dots ? 2.4 : 2.2), bf = t * (dots ? 0.9 : 0.8), fq = (t * (dots ? 9 : 8)) | 0;

    for (let n = 0; n < litN; n++) {
      const i = lit[n], k = ink[i];
      const born = smooth(birth[i] - 0.09, birth[i] + 0.05, intro);
      if (born <= 0.001) continue;
      const settle = born, ph = phase[i];
      const tw = 0.5 + 0.5 * Math.sin(tf + ph);
      const flick = (1 - settle) * (0.45 + 0.55 * hash(i + fq, i));
      const breathe = 0.82 + 0.18 * Math.sin(bf + ph);
      let a = k * born * (settle > 0.98 ? breathe : (0.55 + 0.45 * tw) * (0.6 + flick));
      if (a <= 0.02) continue;
      if (a > 1) a = 1;
      const c = i % cols, r = (i / cols) | 0;
      const x = ix + (c + 0.5) * dxw, y = iy + (r + 0.5) * dyh;
      ctx.globalAlpha = a;
      if (dots) {
        const rad = half * (0.30 + 0.70 * k) * (0.5 + 0.5 * settle);
        if (rad <= 0.12) continue;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, 6.2832);
        ctx.fill();
      } else {
        const len = CELL * (0.55 + 0.85 * k) * (0.4 + 0.6 * settle);
        ctx.lineWidth = Math.max(0.5, CELL * (0.10 + 0.10 * k));
        const hx = ax[i] * len * 0.5, hy = ay[i] * len * 0.5;
        ctx.beginPath();
        ctx.moveTo(x - hx, y - hy);
        ctx.lineTo(x + hx, y + hy);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };

  const smooth = (e0, e1, x) => { let t = (x - e0) / (e1 - e0); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
}

function initGridHeroes() {
  document.querySelectorAll('canvas[data-grid-hero]').forEach((cv) => {
    if (!cv._ghInit) { cv._ghInit = true; startGridHero(cv); }
  });
}

/* ============================================================
 * Newsletter Form Handlers (Loops)
 * Manages form submission, validation, rate limiting, and UI
 * state transitions for the Loops newsletter signup form.
 * ============================================================ */
function submitHandler(event) {
  event.preventDefault();
  var container = event.target.closest('.newsletter-form-container');
  var form = container.querySelector('.newsletter-form');
  var formInput = container.querySelector('.newsletter-form-input');
  var success = container.querySelector('.newsletter-success');
  var errorContainer = container.querySelector('.newsletter-error');
  var errorMessage = container.querySelector('.newsletter-error-message');
  var backButton = container.querySelector('.newsletter-back-button');
  var submitButton = container.querySelector('.newsletter-form-button');
  var loadingButton = container.querySelector('.newsletter-loading-button');

  const rateLimit = () => {
    errorContainer.style.display = 'flex';
    errorMessage.innerText = 'Too many signups, please try again in a little while';
    submitButton.style.display = 'none';
    formInput.style.display = 'none';
    backButton.style.display = 'block';
  };

  var time = new Date();
  var timestamp = time.valueOf();
  var previousTimestamp = localStorage.getItem('loops-form-timestamp');

  if (previousTimestamp && Number(previousTimestamp) + 60000 > timestamp) {
    rateLimit();
    return;
  }
  localStorage.setItem('loops-form-timestamp', timestamp);

  submitButton.style.display = 'none';
  loadingButton.style.display = 'flex';

  var formBody = 'userGroup=landing-page&mailingLists=&email='
    + encodeURIComponent(formInput.value);

  fetch(event.target.action, {
    method: 'POST',
    body: formBody,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
    .then((res) => [res.ok, res.json(), res])
    .then(([ok, dataPromise, res]) => {
      if (ok) {
        success.style.display = 'flex';
        form.reset();
      } else {
        dataPromise.then(data => {
          errorContainer.style.display = 'flex';
          errorMessage.innerText = data.message
            ? data.message
            : res.statusText;
        });
      }
    })
    .catch(error => {
      if (error.message === 'Failed to fetch') {
        rateLimit();
        return;
      }
      errorContainer.style.display = 'flex';
      if (error.message) errorMessage.innerText = error.message;
      localStorage.setItem('loops-form-timestamp', '');
    })
    .finally(() => {
      formInput.style.display = 'none';
      loadingButton.style.display = 'none';
      backButton.style.display = 'block';
    });
}

function resetFormHandler(event) {
  var container = event.target.closest('.newsletter-form-container');
  var formInput = container.querySelector('.newsletter-form-input');
  var success = container.querySelector('.newsletter-success');
  var errorContainer = container.querySelector('.newsletter-error');
  var errorMessage = container.querySelector('.newsletter-error-message');
  var backButton = container.querySelector('.newsletter-back-button');
  var submitButton = container.querySelector('.newsletter-form-button');

  success.style.display = 'none';
  errorContainer.style.display = 'none';
  errorMessage.innerText = 'Oops! Something went wrong, please try again';
  backButton.style.display = 'none';
  formInput.style.display = 'block';
  submitButton.style.display = 'block';
}

function initNewsletterForms() {
  var formContainers = document.getElementsByClassName('newsletter-form-container');

  for (var i = 0; i < formContainers.length; i++) {
    var formContainer = formContainers[i];
    if (formContainer.classList.contains('newsletter-handlers-added')) continue;
    formContainer
      .querySelector('.newsletter-form')
      .addEventListener('submit', submitHandler);
    formContainer
      .querySelector('.newsletter-back-button')
      .addEventListener('click', resetFormHandler);
    formContainer.classList.add('newsletter-handlers-added');
  }
}

/* ============================================================
 * Init
 * ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  initWordmark();
  initGridHeroes();
  initNewsletterForms();

  // re-render the hero plate if the viewport width changes
  let resizeTimer = 0;
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      document.querySelectorAll('canvas[data-grid-hero]').forEach((cv) => {
        cv._ghInit = true;
        startGridHero(cv);
      });
    }, 200);
  });
});
