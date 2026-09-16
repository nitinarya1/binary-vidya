import { Router } from 'express';
import {
  issueCertificate,
  getCertificateById,
  getMyCertificates,
} from '../controllers/certificate.controller';

const router = Router();

// POST /api/certificates/issue
router.post('/issue', issueCertificate);

// GET /api/certificates/my-certificates
router.get('/my-certificates', getMyCertificates);

// GET /api/certificates/:certificateId
router.get('/:certificateId', getCertificateById);

export default router;
