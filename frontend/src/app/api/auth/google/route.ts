import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
import { User } from '../../../../lib/models';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { credential, email, name, avatar, googleId, accessToken } = body;

    let userEmail = email;
    let userName = name;
    let userAvatar = avatar;
    let userGoogleId = googleId;

    if (credential) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          userEmail = payload.email || userEmail;
          userName = payload.name || userName;
          userAvatar = payload.picture || userAvatar;
          userGoogleId = payload.sub || userGoogleId;
        }
      } catch (err) {
        console.warn('Could not decode credential JWT payload:', err);
      }
    }

    if (accessToken && !userEmail) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userInfoRes.ok) {
          const profile = await userInfoRes.json();
          userEmail = profile.email || userEmail;
          userName = profile.name || userName;
          userAvatar = profile.picture || userAvatar;
          userGoogleId = profile.sub || userGoogleId;
        }
      } catch (err) {
        console.warn('Error fetching Google profile via accessToken:', err);
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: 'Google authentication failed to provide email' },
        { status: 400 }
      );
    }

    const normalizedEmail = userEmail.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    const { isSuperAdminEmail } = await import('../../../../lib/auth-helpers');
    const roleToSet = isSuperAdminEmail(normalizedEmail) ? 'admin' : 'student';

    if (!user) {
      user = await User.create({
        name: userName || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        avatar: userAvatar || '',
        googleId: userGoogleId,
        authProvider: 'google',
        role: roleToSet,
        isVerified: true,
      });

      // Send welcome email with official logo to newly created Google user
      const { sendWelcomeEmail } = await import('../../../../lib/serverMailer');
      sendWelcomeEmail({
        id: user._id.toString(),
        name: user.name,
        email: user.email || normalizedEmail,
        role: user.role,
      }).catch((mailErr) => {
        console.error('[Background Send Google Welcome Email Error]:', mailErr);
      });
    } else {
      if (userName) user.name = userName;
      if (!user.googleId && userGoogleId) user.googleId = userGoogleId;
      if (userAvatar) user.avatar = userAvatar;
      if (isSuperAdminEmail(normalizedEmail) && user.role !== 'admin') {
        user.role = 'admin';
      } else if (!isSuperAdminEmail(normalizedEmail) && user.role === 'admin') {
        user.role = 'student';
      }
      await user.save();
    }

    if (isSuperAdminEmail(normalizedEmail)) {
      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
      const superAdminEmail = 'aryar0779@gmail.com';

      const { Otp } = await import('../../../../lib/models');
      await Otp.findOneAndUpdate(
        { email: normalizedEmail, purpose: 'SUPER_ADMIN_LOGIN' },
        {
          email: normalizedEmail,
          otp: otpCode,
          purpose: 'SUPER_ADMIN_LOGIN',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
        { upsert: true, new: true }
      );

      const { sendOtpEmail } = await import('../../../../lib/serverMailer');
      sendOtpEmail(superAdminEmail, otpCode, 'Super Admin Google Sign-In Verification').catch((err) => {
        console.error('[Background Send Google Super Admin Login OTP Error]:', err);
      });

      const emailParts = normalizedEmail.split('@');
      const localPart = emailParts[0];
      const maskedEmail = `${localPart[0]}***${localPart[localPart.length - 1]}@${emailParts[1]}`;

      return NextResponse.json({
        success: true,
        requireOtp: true,
        email: normalizedEmail,
        maskedEmail: maskedEmail || 'a***9@gmail.com',
        isSuperAdmin: true,
        message: `Super Admin Verification: A 4-digit OTP has been sent to ${superAdminEmail}!`,
      });
    }

    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json({
      success: true,
      message: 'Google sign-in successful',
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
    console.error('[API Google Login Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Google sign-in failed' },
      { status: 500 }
    );
  }
}
