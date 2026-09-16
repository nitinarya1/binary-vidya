import { Router } from 'express';
import { getAllCourses, getCourseBySlug } from '../controllers/course.controller';

const router = Router();

// Public routes for courses
router.get('/', getAllCourses);
router.get('/:slugOrId', getCourseBySlug);

export default router;
