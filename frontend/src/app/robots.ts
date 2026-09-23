import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://binaryvidya.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/super-admin', '/admin', '/sales', '/api'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
