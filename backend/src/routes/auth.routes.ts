import { Router } from 'express';
import {
  register,
  login,
  verifyLoginOtp,
  googleLogin,
  getSystemGoogleAccounts,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
  getMe,
  updateProfile,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// System Google accounts discovery
router.get('/system-google-accounts', getSystemGoogleAccounts);

// Standard & OAuth authentication
router.post('/register', register);
router.post('/login', login);
router.post('/login/verify-otp', verifyLoginOtp);
router.post('/google', googleLogin);

// Forgot password OTP flow
router.post('/forgot-password/send-otp', sendForgotPasswordOtp);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp);
router.post('/forgot-password/reset', resetPassword);

// Profile
router.get('/me', protect, getMe);
router.put('/profile', updateProfile);
router.post('/update-profile', updateProfile);

export default router;
