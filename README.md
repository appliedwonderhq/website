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
