# Applied Wonder

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
