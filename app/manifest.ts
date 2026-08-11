import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CoopX',
    short_name: 'CoopX',
    description: 'Role-aware cooperative commerce for members, wholesale buyers and sellers.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f7f3',
    theme_color: '#052e24',
    orientation: 'portrait-primary',
    categories: ['shopping', 'business', 'finance'],
    icons: [
      {
        src: '/images/logo/coopx-mark.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/images/logo/coopx-mark.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
