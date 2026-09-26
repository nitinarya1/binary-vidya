import { getHomepageData } from '../lib/getHomepageData';
import HomePageClient from '../components/home/HomePageClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { programs, courses } = await getHomepageData();
  return <HomePageClient initialPrograms={programs} initialCourses={courses} />;
}
