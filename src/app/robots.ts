import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://fanaralbhar.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/account/',
          '/api/',
          '/checkout',
          '/order/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
