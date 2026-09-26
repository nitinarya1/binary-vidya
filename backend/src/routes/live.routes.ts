import { Router } from 'express';
import {
  getLiveSessions,
  createLiveSession,
  deleteLiveSession,
  getSessionDetails,
  endLiveSession,
} from '../controllers/live.controller';

const router = Router();

router.get('/sessions', getLiveSessions);
router.post('/sessions', createLiveSession);
router.delete('/sessions/:id', deleteLiveSession);
router.get('/sessions/:id', getSessionDetails);
router.post('/sessions/:id/end', endLiveSession);

export default router;
