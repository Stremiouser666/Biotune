
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Biotune Magic Music',
    short_name: 'Biotune',
    description: 'Magical Biometric Music Generator',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ff4dff',
    icons: [
      {
        src: 'https://i.postimg.cc/CxDqyny4/Mascot_Body.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://i.postimg.cc/CxDqyny4/Mascot_Body.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
