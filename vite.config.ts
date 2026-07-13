import { imageToWebpPlugin } from 'vite-plugin-image-to-webp'

export default {
  plugins: [
    imageToWebpPlugin({
      enableDev: true,
      enableDevConvert: true
    }),
  ]
}