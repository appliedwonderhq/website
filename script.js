/**
 * Color Palette
 * 6-color array used for TOC elements and selection highlight
 */
const colorPalette = ['#f6871f', '#f0483e', '#f6977b', '#fdb515', '#a68d62', '#4e65af'];

/**
 * Random Selection Color
 * Changes the text selection highlight color to a random color from the brand palette
 * each time the user starts a selection. Ensures colors aren't repeated until all are used.
 */
(function() {
  const usedColors = new Set();

  function getRandomColor() {
    const availableColors = colorPalette.filter(color => !usedColors.has(color));
    if (availableColors.length === 0) {
      usedColors.clear();
      return colorPalette[Math.floor(Math.random() * colorPalette.length)];
    }
    const color = availableColors[Math.floor(Math.random() * availableColors.length)];
    usedColors.add(color);
    return color;
  }

  function updateSelectionColor() {
    const randomColor = getRandomColor();
    document.documentElement.style.setProperty('--selection-color', randomColor);
  }

  document.addEventListener('selectstart', updateSelectionColor);
})();

/**
 * Page Initialization
 * Runs when DOM is fully loaded to initialize interactive components
 */
document.addEventListener('DOMContentLoaded', function() {
  /**
   * Draggable Footer Images
   * Allows users to drag footer collage images around the page
   */
  const draggableImages = document.querySelectorAll('.footer-field, .footer-window, .footer-text, .footer-small');
  let activeDrag = null;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  draggableImages.forEach(img => {
    img.addEventListener('mousedown', function(e) {
      activeDrag = img;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = img.offsetLeft;
      initialTop = img.offsetTop;
      e.preventDefault();
    });
  });

  document.addEventListener('mousemove', function(e) {
    if (!activeDrag) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    activeDrag.style.left = `${initialLeft + dx}px`;
    activeDrag.style.top = `${initialTop + dy}px`;
  });

  document.addEventListener('mouseup', function() {
    activeDrag = null;
  });

  /**
   * Scroll Spy for Table of Contents
   * Highlights the current section in the navigation based on scroll position
   * and positions a dot indicator next to the active link
   */
  const sections = document.querySelectorAll('section[id], div[id]');
  const navLinks = Array.from(document.querySelectorAll('.toc a')).filter(link => {
    const href = link.getAttribute('href');
    return href && href.startsWith('#');
  });

  function sectionIdFromLink(link) {
    const href = link.getAttribute('href') || '';
    return href.slice(1);
  }

  const toc = document.querySelector('.toc');
  const tocDot = document.querySelector('.toc-dot');

  /**
   * Sets the active navigation link based on the current section ID
   */
  function setActiveLink(sectionId) {
    navLinks.forEach(link => {
      link.classList.toggle('active', sectionIdFromLink(link) === sectionId);
    });
    
    // Update TOC color based on active link index
    const activeLinkIndex = navLinks.findIndex(link => sectionIdFromLink(link) === sectionId);
    const newColor = activeLinkIndex !== -1 ? colorPalette[activeLinkIndex] : colorPalette[0];
    document.documentElement.style.setProperty('--toc-color', newColor);
  }

  /**
   * Positions the dot indicator next to the active link
   * @param {boolean} animate - Whether to animate the transition (default: true)
   */
  function positionDot(animate = true) {
    const activeLink = toc.querySelector('a.active');
    if (activeLink) {
      toc.classList.add('has-active');
      const center = activeLink.offsetTop + activeLink.offsetHeight / 2;
      if (!animate) {
        tocDot.style.transition = 'none';
      }
      tocDot.style.top = `${center}px`;
      if (!animate) {
        setTimeout(() => {
          tocDot.style.transition = '';
        }, 0);
      }
    } else {
      toc.classList.remove('has-active');
    }
  }

  /**
   * Updates the active section based on current scroll position
   */
  function updateActive() {
    let current = '';
    const scrollPosition = window.scrollY + 150;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    if (current) {
      setActiveLink(current);
    }
    positionDot();
  }

  // Update on scroll
  window.addEventListener('scroll', updateActive);

  // Trigger once on load
  updateActive();
  positionDot(false);

  // Keep the dot aligned if the layout changes
  window.addEventListener('resize', positionDot);
});

/**
 * Cycling App Hints
 * Rotates through different hint text descriptions for each app every 3.8 seconds
 * to showcase various features and benefits
 */
const hints = {
    'hint-text': [
      "Next up: the thing you do every morning, minus the friction.",
      "It has something to do with your inbox — and a lot less of it.",
      "We're counting the taps you'll never make again.",
      "A small tool for an annoyance you've stopped noticing."
    ],
    'mnemo-hint': [
      "The conversation you had last month, still there when you need it.",
      "Your memories, safe and searchable.",
      "Never lose track of what matters.",
      "The context you wish you could recall."
    ],
    'hop-hint': [
      "The routine that actually sticks.",
      "Self-care without the second-guessing.",
      "Building habits that survive Monday morning.",
      "Less thinking, more doing."
    ]
  };
  
  const hintIndices = {
    'hint-text': 0,
    'mnemo-hint': 0,
    'hop-hint': 0
  };
  
  for (const hintId in hints) {
    const hintText = document.getElementById(hintId);
    if (hintText) {
      setInterval(() => {
        hintIndices[hintId] = (hintIndices[hintId] + 1) % hints[hintId].length;
        hintText.textContent = hints[hintId][hintIndices[hintId]];
      }, 3800);
    }
  }

  /**
 * Newsletter Form Handlers
 * Manages form submission, validation, rate limiting, and UI state transitions
 * for the Loops newsletter signup form
 */

/**
 * Handles form submission to the Loops API
 * Includes rate limiting, loading states, success/error handling
 * @param {Event} event - The form submit event
 */
function submitHandler(event) {
    event.preventDefault();
    var container = event.target.parentNode;
    var form = container.querySelector(".newsletter-form");
    var formInput = container.querySelector(".newsletter-form-input");
    var success = container.querySelector(".newsletter-success");
    var errorContainer = container.querySelector(".newsletter-error");
    var errorMessage = container.querySelector(".newsletter-error-message");
    var backButton = container.querySelector(".newsletter-back-button");
    var submitButton = container.querySelector(".newsletter-form-button");
    var loadingButton = container.querySelector(".newsletter-loading-button");

    /**
     * Shows rate limit error message and disables form
     */
    const rateLimit = () => {
      errorContainer.style.display = "flex";
      errorMessage.innerText = "Too many signups, please try again in a little while";
      submitButton.style.display = "none";
      formInput.style.display = "none";
      backButton.style.display = "block";
    }

    var time = new Date();
    var timestamp = time.valueOf();
    var previousTimestamp = localStorage.getItem("loops-form-timestamp");

    if (previousTimestamp && Number(previousTimestamp) + 60000 > timestamp) {
      rateLimit();
      return;
    }
    localStorage.setItem("loops-form-timestamp", timestamp);

    submitButton.style.display = "none";
    loadingButton.style.display = "flex";

    var formBody = "userGroup=landing-page&mailingLists=&email="
      + encodeURIComponent(formInput.value);

    fetch(event.target.action, {
      method: "POST",
      body: formBody,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then((res) => [res.ok, res.json(), res])
      .then(([ok, dataPromise, res]) => {
        if (ok) {
          success.style.display = "flex";
          form.reset();
        } else {
          dataPromise.then(data => {
            errorContainer.style.display = "flex";
            errorMessage.innerText = data.message
              ? data.message
              : res.statusText;
          });
        }
      })
      .catch(error => {
        if (error.message === "Failed to fetch") {
          rateLimit();
          return;
        }
        errorContainer.style.display = "flex";
        if (error.message) errorMessage.innerText = error.message;
        localStorage.setItem("loops-form-timestamp", '');
      })
      .finally(() => {
        formInput.style.display = "none";
        loadingButton.style.display = "none";
        backButton.style.display = "block";
      });
  }

  /**
   * Resets the form to its initial state after success or error
   * @param {Event} event - The button click event
   */
  function resetFormHandler(event) {
    var container = event.target.parentNode;
    var formInput = container.querySelector(".newsletter-form-input");
    var success = container.querySelector(".newsletter-success");
    var errorContainer = container.querySelector(".newsletter-error");
    var errorMessage = container.querySelector(".newsletter-error-message");
    var backButton = container.querySelector(".newsletter-back-button");
    var submitButton = container.querySelector(".newsletter-form-button");

    success.style.display = "none";
    errorContainer.style.display = "none";
    errorMessage.innerText = "Oops! Something went wrong, please try again";
    backButton.style.display = "none";
    formInput.style.display = "flex";
    submitButton.style.display = "flex";
  }

  /**
   * Initialize newsletter form handlers
   * Attaches event listeners to all newsletter form containers on the page
   */
  var formContainers = document.getElementsByClassName(
    "newsletter-form-container"
  );

  for (var i = 0; i < formContainers.length; i++) {
    var formContainer = formContainers[i];
    var handlersAdded = formContainer.classList.contains('newsletter-handlers-added');
    if (handlersAdded) continue;
    formContainer
      .querySelector(".newsletter-form")
      .addEventListener("submit", submitHandler);
    formContainer
      .querySelector(".newsletter-back-button")
      .addEventListener("click", resetFormHandler);

    /**
     * Email validation and button state
     * Toggles the submit button's active state based on valid email input
     */
    var formInput = formContainer.querySelector(".newsletter-form-input");
    var submitButton = formContainer.querySelector(".newsletter-form-button");
    var emailRegex = /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_+\-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i;

    /**
     * Updates button active state based on email validity
     * Adds 'active' class when email is valid, removes it otherwise
     */
    function updateButtonState() {
      if (emailRegex.test(formInput.value.trim())) {
        submitButton.classList.add("active");
      } else {
        submitButton.classList.remove("active");
      }
    }

    formInput.addEventListener("input", updateButtonState);
    updateButtonState();

    formContainer.classList.add("newsletter-handlers-added");
  }
