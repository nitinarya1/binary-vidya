import { Router } from 'express';
import {
  getMyEnrolledCourses,
  enrollFreeCourse,
  updateLessonProgress,
} from '../controllers/enrollment.controller';

const router = Router();

// Student Enrolled Learning Dashboard endpoints
router.get('/my-learning', getMyEnrolledCourses);
router.post('/free-enroll', enrollFreeCourse);
router.post('/update-progress', updateLessonProgress);

export default router;
