import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Binary Vidya',
    short_name: 'Binary Vidya',
    description: 'Premier modern technical academy providing industry-grade software engineering training, 2-month verified industrial internships, production project mentorship, and verifiable ISO-compliant credentials.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/images/binary-vidya-icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/images/binary-vidya-icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
