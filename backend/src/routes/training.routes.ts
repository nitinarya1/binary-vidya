import { Router } from 'express';
import { getTrainingInternshipProgram } from '../controllers/training.controller';

const router = Router();

// GET /api/training-internship
router.get('/', getTrainingInternshipProgram);

export default router;
