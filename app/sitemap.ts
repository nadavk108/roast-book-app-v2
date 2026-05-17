import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://theroastbook.com',
      lastModified: new Date('2026-04-14'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://theroastbook.com/how-it-works',
      lastModified: new Date('2026-04-14'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://theroastbook.com/fathers-day',
      lastModified: new Date('2026-05-08'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://theroastbook.com/funny-gift-for-best-friend',
      lastModified: new Date('2026-05-17'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://theroastbook.com/gift-for-boyfriend-who-has-everything',
      lastModified: new Date('2026-05-17'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://theroastbook.com/funny-gift-for-dad',
      lastModified: new Date('2026-05-17'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://theroastbook.com/llms.txt',
      lastModified: new Date('2026-04-14'),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];
}
