import { connectDB } from './db';
import { TrainingInternship, Course } from './models';

export async function getHomepageData() {
  try {
    await connectDB();
    const rawPrograms = await TrainingInternship.find({ status: { $ne: 'closed' } })
      .sort({ createdAt: -1 })
      .lean();

    const formattedPrograms = rawPrograms.map((p: any) => {
      const trainingPrice = p.trainingPrice !== undefined ? Number(p.trainingPrice) : 2400;
      const originalPrice = p.originalPrice !== undefined ? Number(p.originalPrice) : 7999;
      const internshipPrice = p.internshipPrice !== undefined ? Number(p.internshipPrice) : 0;
      return {
        id: p._id?.toString() || p.slug,
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle,
        thumbnail: p.thumbnail || '',
        track: p.track || p.domain || 'Engineering',
        domain: p.domain || p.track || 'Engineering',
        type: p.type || 'internship',
        mode: p.mode || 'Live Online • Weekend Classes',
        schedule: p.schedule || { badge: 'Weekend Live Batches' },
        pricing: {
          trainingPrice,
          originalPrice,
          discountPercentage: Math.round((1 - (trainingPrice / (originalPrice || 7999))) * 100) || 70,
          internshipPrice,
          internshipStatusText: '100% Free of Cost (Bundled with Training)',
          currency: 'INR',
          currencySymbol: '₹',
        },
        sections: p.sections || [],
        credentials: p.credentials || [],
        highlights: p.perks || [],
        status: p.status || 'open',
      };
    });

    const rawCourses = await Course.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .lean();

    const formattedCourses = rawCourses.map((c: any) => ({
      id: c._id?.toString() || c.slug,
      slug: c.slug,
      title: c.title,
      description: c.description || '',
      category: c.category || 'Development',
      level: c.level || 'All Levels',
      duration: c.duration || '6 Weeks',
      price: c.price || 0,
      instructor: c.instructor || 'Binary Vidya Faculty',
      thumbnail: c.thumbnail || '',
      tags: c.tags || [],
      chapters: c.chapters || [],
      chaptersCount: c.chapters?.length || 0,
      totalLessons: c.chapters?.reduce((acc: number, ch: any) => acc + (ch.lessons?.length || 0), 0) || 0,
      rating: c.rating || 4.9,
      enrolledCount: c.enrolledCount || 120,
    }));

    return {
      programs: JSON.parse(JSON.stringify(formattedPrograms)),
      courses: JSON.parse(JSON.stringify(formattedCourses)),
    };
  } catch (err) {
    console.error('getHomepageData error:', err);
    return { programs: [], courses: [] };
  }
}
