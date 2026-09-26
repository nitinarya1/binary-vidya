import { MetadataRoute } from 'next';
import { connectDB } from '../lib/db';
import { Course } from '../lib/models';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://binaryvidya.vercel.app';
  const currentDate = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/training-and-internship`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/verify-certificate`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/get-counselling`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/my-learning`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
  ];

  try {
    await connectDB();
    const courses = await Course.find({ status: { $ne: 'draft' } }).select('slug updatedAt').lean();
    const courseRoutes: MetadataRoute.Sitemap = courses.map((course: any) => ({
      url: `${baseUrl}/courses/${course.slug}`,
      lastModified: course.updatedAt ? new Date(course.updatedAt) : currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

    return [...staticRoutes, ...courseRoutes];
  } catch (err) {
    console.error('[Sitemap generation error]:', err);
    return staticRoutes;
  }
}
