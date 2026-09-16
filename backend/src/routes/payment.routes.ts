import { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/payment.controller';

const router = Router();

// Order creation & payment verification endpoints
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

export default router;
