# Applied Wonder

A collective of makers releasing curious apps into the world, whenever the work is ready, and never a day before.

## Development

This project uses Vite for development and building.

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The development server runs on `http://localhost:5173/`

### Build for Production

```bash
npm run build
```

The production build is output to the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment

This project is configured for Vercel deployment with optimal settings:

- **Framework**: Vite (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Caching**: Optimized headers for static assets (1-year cache for images)
- **Security**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection headers
- **Routing**: SPA rewrite for client-side routing

To deploy:
1. Push code to GitHub/GitLab
2. Import project in Vercel
3. Vercel will automatically detect and deploy using `vercel.json` configuration

## Performance Optimizations

The site includes several performance optimizations:

- **Lazy Loading**: Images below the fold use `loading="lazy"` to defer loading
- **Resource Prioritization**: Critical above-the-fold images use `fetchpriority="high"`
- **CSS Preloading**: Critical CSS is preloaded for faster render start
- **Font Loading**: Optimized font loading with `font-display: swap`
- **Image Optimization**: Automatic WebP conversion via `vite-plugin-image-to-webp` (74% size reduction)
- **Fade-in Animations**: Smooth CSS fade-in animations for page sections

## Features

- **Automatic Letter Animations**: Wordmark letters animate 3 seconds after page load and repeat every 20-30 seconds
- **Hover Interactions**: "Applied" letters jump on hover, "wonder" letters scatter
- **Dark Mode**: Automatic dark mode support via `prefers-color-scheme`
- **Responsive Design**: Mobile-optimized layout
- **Newsletter Signup**: Integrated Loops newsletter form with rate limiting

## WebP Image Generation

This project uses WebP images for better performance. To generate WebP files from PNG assets:

```bash
cd assets
for file in *.png; do magick "$file" "${file%.png}.webp"; done
```

This requires ImageMagick to be installed:
```bash
brew install imagemagick
```

The HTML uses `<picture>` elements to prefer WebP with PNG fallback for browsers that don't support WebP.

## Favicon Generation

The favicon files are generated from `assets/Icon.png` using ImageMagick. To regenerate all favicon files after updating the icon:

```bash
convert assets/Icon.png -resize 16x16 assets/favicon-16x16.png
convert assets/Icon.png -resize 32x32 assets/favicon-32x32.png
convert assets/Icon.png -resize 180x180 assets/apple-touch-icon.png
convert assets/Icon.png -resize 192x192 assets/android-chrome-192x192.png
convert assets/Icon.png -resize 512x512 assets/android-chrome-512x512.png
convert assets/Icon.png -define icon:auto-resize=256,128,96,64,48,32,16 assets/favicon.ico
```

This generates:
- `favicon.ico` (with embedded sizes: 16, 32, 48, 64, 96, 128, 256)
- `favicon-16x16.png` (for legacy browsers)
- `favicon-32x32.png` (for modern browsers)
- `apple-touch-icon.png` (180x180 for iOS devices)
- `android-chrome-192x192.png` (for Android devices)
- `android-chrome-512x512.png` (for Android devices)
