import { Router } from 'express';
import {
  getAvailableCoupons,
  validateCoupon,
  getAllCouponsAdmin,
  createCouponAdmin,
  updateCouponAdmin,
  deleteCouponAdmin,
} from '../controllers/coupon.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Public / Student endpoints
router.get('/available', getAvailableCoupons);
router.post('/validate', validateCoupon);

// Super Admin endpoints
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role === 'admin' || req.user?.isSuperAdmin || req.user?.email === 'aryar0779@gmail.com') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Super Admin access required' });
};

router.get('/admin', protect, requireAdmin, getAllCouponsAdmin);
router.post('/admin', protect, requireAdmin, createCouponAdmin);
router.put('/admin/:id', protect, requireAdmin, updateCouponAdmin);
router.delete('/admin/:id', protect, requireAdmin, deleteCouponAdmin);

export default router;


