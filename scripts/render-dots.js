#!/usr/bin/env node
/**
 * Render the dot-grid stipple effect to a static PNG
 * Usage: node scripts/render-dots.js [output-path]
 * Default output: assets/hero-dots.png
 */

const fs = require('fs');
const path = require('path');

// Simple Canvas implementation using node-canvas
const { createCanvas, loadImage } = require('canvas');

async function renderDots() {
  const args = process.argv.slice(2);
  const darkMode = args.includes('--dark');
  const outputPath = args.find(arg => !arg.startsWith('--')) || path.join(__dirname, darkMode ? '../assets/hero-dots-dark.png' : '../assets/hero-dots.png');
  const srcPath = path.join(__dirname, '../assets/landscape-engraving.png');

  console.log('Loading source image:', srcPath);
  const image = await loadImage(srcPath);

  // Settings from the CSS/JS
  const style = 'dots';
  const INK = darkMode ? '231,227,218' : '42,36,24'; // dark: #e7e3da, light: #2a2418
  const CELL = 1.5; // css px
  const INTRO = 7.0;
  const reduce = true; // static render

  // Canvas size - use a reasonable width for the static output
  const cssW = 1920; // Full HD width
  const cssH = 1080; // Full HD height

  // Breathing-room scale: widen the plate
  const ar = image.naturalWidth / image.naturalHeight;
  let iw = cssW * 1.18;
  let ih = iw / ar;
  if (ih < cssH) { ih = cssH; iw = ih * ar; }
  const ix = (cssW - iw) / 2;
  const iy = (cssH - ih) / 2;

  const canvas = createCanvas(cssW, cssH);
  const ctx = canvas.getContext('2d');

  const cols = Math.max(2, Math.round(iw / CELL));
  const rows = Math.max(2, Math.round(ih / CELL));
  const N = cols * rows;

  // Downsample the plate to grid resolution
  const tmp = createCanvas(cols, rows);
  const tc = tmp.getContext('2d');
  tc.drawImage(image, 0, 0, cols, rows);
  const data = tc.getImageData(0, 0, cols, rows).data;

  const ink = new Float32Array(N);
  const birth = new Float32Array(N);
  const phase = new Float32Array(N);

  // Value noise functions
  const hash = (x, y) => {
    let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };

  const vnoise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = c + r * cols, p = i * 4;
      const lum = (data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114) / 255;
      let k = (0.93 - lum) / 0.52;
      k = k < 0 ? 0 : k > 1 ? 1 : k;
      ink[i] = k;
      birth[i] = Math.min(1, Math.max(0, 0.16 + 0.30 * (r / rows) + 0.66 * (vnoise(c * 0.08, r * 0.08) - 0.42)));
      phase[i] = hash(c, r) * 6.283;
    }
  }

  // Precompute lit cells
  const lit = new Int32Array(N);
  let litN = 0;
  for (let k2 = 0; k2 < N; k2++) {
    if (ink[k2] >= 0.06) lit[litN++] = k2;
  }

  const draw = (t) => {
    ctx.clearRect(0, 0, cssW, cssH);
    const intro = Math.min(t / INTRO, 1);
    const dxw = iw / cols, dyh = ih / rows;
    const half = CELL * 0.5;
    const dots = style === 'dots';

    if (dots) {
      ctx.fillStyle = `rgba(${INK},1)`;
    } else {
      ctx.strokeStyle = `rgba(${INK},1)`;
      ctx.lineCap = 'round';
    }

    const tf = t * (dots ? 2.4 : 2.2);
    const bf = t * (dots ? 0.9 : 0.8);
    const fq = (t * (dots ? 9 : 8)) | 0;

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
        const hx = Math.cos(phase[i]) * len * 0.5;
        const hy = Math.sin(phase[i]) * len * 0.5;
        ctx.beginPath();
        ctx.moveTo(x - hx, y - hy);
        ctx.lineTo(x + hx, y + hy);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };

  const smooth = (e0, e1, x) => {
    let t = (x - e0) / (e1 - e0);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return t * t * (3 - 2 * t);
  };

  // Render the finished plate statically
  if (reduce) {
    draw(INTRO + 4);
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);

  console.log(`Rendered to: ${outputPath}`);
  console.log(`Size: ${cssW}x${cssH}px`);
  console.log(`Dots: ${litN} lit cells`);
}

renderDots().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
