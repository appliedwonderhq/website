import './style.css'

/**
 * Applied Wonder — soft dots engraving (design 4a)
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
      // "Applied" — fast sequential jump, plays ONCE per hover, completes on leave
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
      off = () => {
        // Don't interrupt animation - let it complete naturally
      };
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
  initNewsletterForms();
});
