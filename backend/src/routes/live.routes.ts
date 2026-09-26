import { Router } from 'express';
import {
  getLiveSessions,
  createLiveSession,
  getSessionDetails,
  endLiveSession,
} from '../controllers/live.controller';

const router = Router();

router.get('/sessions', getLiveSessions);
router.post('/sessions', createLiveSession);
router.get('/sessions/:id', getSessionDetails);
router.post('/sessions/:id/end', endLiveSession);

export default router;
