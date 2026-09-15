import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  getSystemGoogleAccounts,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
  getMe,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// System Google accounts discovery
router.get('/system-google-accounts', getSystemGoogleAccounts);

// Standard & OAuth authentication
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);

// Forgot password OTP flow
router.post('/forgot-password/send-otp', sendForgotPasswordOtp);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp);
router.post('/forgot-password/reset', resetPassword);

// Profile
router.get('/me', protect, getMe);

export default router;
