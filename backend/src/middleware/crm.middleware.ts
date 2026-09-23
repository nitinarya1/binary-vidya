import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'binaryvidya_crm_secret_2024';

/**
 * CRM JWT middleware — reads from cookie or Bearer header
 */
export const crmProtect = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Try HttpOnly cookie first
    if (req.cookies && req.cookies.crm_token) {
      token = req.cookies.crm_token;
    }

    // Fallback to Bearer header
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const payload = jwt.verify(token, JWT_SECRET) as any;
    (req as any).crmUser = payload;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
  }
};

/**
 * Require super_admin role
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).crmUser;
  if (!user || user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Super Admin access required.' });
  }
  return next();
};
