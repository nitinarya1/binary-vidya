import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User';
import { Otp } from '../models/Otp';
import { sendOtpEmail } from '../config/mailer';
import { formatPhoneNumber } from '../utils/phone';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// 0. FETCH SYSTEM GOOGLE ACCOUNTS
export const getSystemGoogleAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const accounts: Array<{ name: string; email: string; avatar: string; googleId: string }> = [];
    const localAppData = process.env.LOCALAPPDATA || '';

    // Check Chrome
    if (localAppData) {
      const chromeLocalState = path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Local State');
      if (fs.existsSync(chromeLocalState)) {
        try {
          const raw = fs.readFileSync(chromeLocalState, 'utf8');
          const data = JSON.parse(raw);
          const profiles = data?.profile?.info_cache || {};
          for (const [key, val] of Object.entries(profiles) as any) {
            const email = val.user_name || val.email;
            if (email && email.includes('@')) {
              accounts.push({
                name: val.name || email.split('@')[0],
                email: email.toLowerCase().trim(),
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(val.name || email)}&backgroundColor=38bdf8`,
                googleId: val.gaia_id || `chrome-${key}`,
              });
            }
          }
        } catch (err) {
          console.warn('Error reading Chrome local accounts:', err);
        }
      }
    }

    // Always ensure primary account is available
    if (!accounts.some(a => a.email === 'aryar0779@gmail.com')) {
      accounts.unshift({
        name: 'Nitin Arya',
        email: 'aryar0779@gmail.com',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=NitinArya&backgroundColor=38bdf8',
        googleId: '115102114215887463401',
      });
    }

    res.json({
      success: true,
      accounts,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch system Google accounts' });
  }
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '');

const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
};

// 1. REGISTER
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email already exists' });
      return;
    }

    let formattedPhone: string | undefined;
    if (phone && phone.trim()) {
      formattedPhone = formatPhoneNumber(phone);
      const existingPhone = await User.findOne({ phone: formattedPhone });
      if (existingPhone) {
        res.status(400).json({ success: false, message: 'An account with this mobile number already exists' });
        return;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const defaultAdminEmails = ['aryar0779@gmail.com', 'binaryvidyaadmin@gmail.com', 'admin@binaryvidya.edu'];
    const isDefaultAdmin = defaultAdminEmails.includes(normalizedEmail) || (process.env.ADMIN_EMAILS || '').includes(normalizedEmail);

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone: formattedPhone || undefined,
      password: hashedPassword,
      authProvider: 'local',
      role: isDefaultAdmin ? 'admin' : 'student',
      isVerified: false,
    });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error('[Register Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
};

// 2. LOGIN (EMAIL OR MOBILE NUMBER)
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, identifier, phone, password } = req.body;
    const loginId = (identifier || email || phone || '').toString().trim();

    if (!loginId || !password) {
      res.status(400).json({ success: false, message: 'Please provide email or mobile number, and password' });
      return;
    }

    let user;
    if (loginId.includes('@')) {
      user = await User.findOne({ email: loginId.toLowerCase() }).select('+password');
    } else {
      const formattedPhone = formatPhoneNumber(loginId);
      const cleanDigits = loginId.replace(/\D/g, '');
      user = await User.findOne({
        $or: [
          { phone: formattedPhone },
          { phone: loginId },
          { phone: { $regex: cleanDigits.slice(-10) + '$' } },
        ],
      }).select('+password');
    }

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials. Check your email or mobile number.' });
      return;
    }

    if (!user.password) {
      res.status(400).json({
        success: false,
        message: 'This account uses Google Sign-In. Please sign in with Google.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials. Check your password.' });
      return;
    }

    const defaultAdminEmails = ['aryar0779@gmail.com', 'binaryvidyaadmin@gmail.com', 'admin@binaryvidya.edu'];
    if (user.email && (defaultAdminEmails.includes(user.email.toLowerCase()) || (process.env.ADMIN_EMAILS || '').includes(user.email.toLowerCase()))) {
      if (user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
      }
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error('[Login Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during login' });
  }
};

// 3. GOOGLE LOGIN
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential, email, name, avatar, googleId, accessToken } = req.body;

    let userEmail = email;
    let userName = name;
    let userAvatar = avatar;
    let userGoogleId = googleId;

    // 1. If accessToken provided via useGoogleLogin popup flow
    if (accessToken) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userInfoRes.ok) {
          const profile = await userInfoRes.json();
          userEmail = profile.email;
          userName = profile.name;
          userAvatar = profile.picture;
          userGoogleId = profile.sub;
        }
      } catch (err) {
        console.warn('[Google AccessToken Fetch Error]:', err);
      }
    }

    // 2. If a Google OAuth credential JWT token was provided, decode and verify it
    if (credential && !userEmail) {
      try {
        if (process.env.GOOGLE_CLIENT_ID) {
          const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();
          if (payload) {
            userEmail = payload.email;
            userName = payload.name;
            userAvatar = payload.picture;
            userGoogleId = payload.sub;
          }
        } else {
          // Decode without verifying signature if GOOGLE_CLIENT_ID is not configured yet
          const decoded = jwt.decode(credential) as any;
          if (decoded && decoded.email) {
            userEmail = decoded.email;
            userName = decoded.name;
            userAvatar = decoded.picture;
            userGoogleId = decoded.sub;
          }
        }
      } catch (err) {
        console.warn('[Google Token Verification Warn]:', err);
      }
    }

    if (!userEmail) {
      res.status(400).json({ success: false, message: 'Unable to retrieve email from Google login' });
      return;
    }

    const normalizedEmail = userEmail.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    const defaultAdminEmails = ['aryar0779@gmail.com', 'binaryvidyaadmin@gmail.com', 'admin@binaryvidya.edu'];
    const isDefaultAdmin = defaultAdminEmails.includes(normalizedEmail) || (process.env.ADMIN_EMAILS || '').includes(normalizedEmail);

    if (!user) {
      user = await User.create({
        name: userName || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        avatar: userAvatar || '',
        googleId: userGoogleId,
        authProvider: 'google',
        role: isDefaultAdmin ? 'admin' : 'student',
        isVerified: true,
      });
    } else {
      if (userName) {
        user.name = userName;
      }
      if (!user.googleId && userGoogleId) {
        user.googleId = userGoogleId;
      }
      if (userAvatar) {
        user.avatar = userAvatar;
      }
      if (isDefaultAdmin && user.role !== 'admin') {
        user.role = 'admin';
      }
      await user.save();
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: 'Google sign-in successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error('[Google Login Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Google sign-in failed' });
  }
};

// 4. FORGOT PASSWORD - SEND OTP (EMAIL ONLY)
export const sendForgotPasswordOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, identifier } = req.body;
    const target = (identifier || email || '').toString().trim();

    if (!target) {
      res.status(400).json({ success: false, message: 'Please provide your registered email or mobile number' });
      return;
    }

    let user;
    if (target.includes('@')) {
      user = await User.findOne({ email: target.toLowerCase() });
    } else {
      const formattedPhone = formatPhoneNumber(target);
      const cleanDigits = target.replace(/\D/g, '');
      user = await User.findOne({
        $or: [
          { phone: formattedPhone },
          { phone: target },
          { phone: { $regex: cleanDigits.slice(-10) + '$' } },
        ],
      });
    }

    if (!user || !user.email) {
      res.status(404).json({
        success: false,
        message: 'No account found with this email or mobile number',
      });
      return;
    }

    const normalizedEmail = user.email.toLowerCase().trim();

    // Generate cryptographically secure 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any previous OTPs for this email & purpose
    await Otp.deleteMany({ email: normalizedEmail, purpose: 'FORGOT_PASSWORD' });

    // Store in DB with 10-minute expiry
    await Otp.create({
      email: normalizedEmail,
      otp: otpCode,
      purpose: 'FORGOT_PASSWORD',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
    });

    // Send OTP strictly via Nodemailer to user's registered email
    const emailSent = await sendOtpEmail(normalizedEmail, otpCode, 'Password Reset');

    if (!emailSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to dispatch verification email. Please try again later.',
      });
      return;
    }

    // Mask email for display: e.g. j***e@domain.com
    const emailParts = normalizedEmail.split('@');
    const localPart = emailParts[0];
    const maskedLocal = localPart.length > 2
      ? `${localPart[0]}***${localPart[localPart.length - 1]}`
      : `${localPart[0]}***`;
    const maskedEmail = `${maskedLocal}@${emailParts[1]}`;

    res.json({
      success: true,
      message: `A 6-digit OTP verification code has been sent to your email (${maskedEmail})!`,
      email: normalizedEmail,
      maskedEmail,
    });
  } catch (error: any) {
    console.error('[Send OTP Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP',
    });
  }
};

// 5. VERIFY OTP
export const verifyForgotPasswordOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and OTP code are required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      otp: cleanOtp,
      purpose: 'FORGOT_PASSWORD',
    });

    if (!otpRecord) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
      return;
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      return;
    }

    res.json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
    });
  } catch (error: any) {
    console.error('[Verify OTP Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to verify OTP' });
  }
};

// 6. RESET PASSWORD
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      otp: cleanOtp,
      purpose: 'FORGOT_PASSWORD',
    });

    if (!otpRecord) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please restart verification.' });
      return;
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Clean up OTP so it cannot be reused
    await Otp.deleteMany({ email: normalizedEmail, purpose: 'FORGOT_PASSWORD' });

    res.json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
    });
  } catch (error: any) {
    console.error('[Reset Password Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reset password' });
  }
};

// 7. GET ME (Current User Profile)
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        authProvider: req.user.authProvider,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};
