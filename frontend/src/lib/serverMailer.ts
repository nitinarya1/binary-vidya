import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const EMAIL_USER = process.env.EMAIL_USER || 'binaryvidyaadmin@gmail.com';
const EMAIL_PASS = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

let transporter: any = (global as any).bvTransporter || null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
    (global as any).bvTransporter = transporter;
  }
  return transporter;
}

export function getLogoAttachment() {
  const candidatePaths = [
    path.join(process.cwd(), 'public', 'images', 'binary-vidya-logo.png'),
    path.join(process.cwd(), 'frontend', 'public', 'images', 'binary-vidya-logo.png'),
    path.resolve(__dirname, '../../public/images/binary-vidya-logo.png'),
    path.resolve(__dirname, '../../../public/images/binary-vidya-logo.png'),
    path.resolve(__dirname, '../assets/binary-vidya-logo.png'),
    path.join(process.cwd(), 'backend', 'src', 'assets', 'binary-vidya-logo.png'),
    path.join(process.cwd(), 'src', 'assets', 'binary-vidya-logo.png'),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return [
        {
          filename: 'binary-vidya-logo.png',
          path: candidate,
          cid: 'binaryvidyalogo',
        },
      ];
    }
  }
  return [];
}

export const sendOtpEmail = async (
  recipientEmail: string,
  otpCode: string,
  purpose: string = 'Password Reset'
): Promise<boolean> => {
  try {
    const mailClient = getTransporter();

    const mailOptions = {
      from: `"Binary Vidya Security" <${EMAIL_USER}>`,
      to: recipientEmail,
      subject: `${otpCode} is your Binary Vidya verification code`,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        Importance: 'high',
        'Auto-Submitted': 'auto-generated',
      },
      text: `Your Binary Vidya verification code is: ${otpCode}\n\nThis code was requested for: ${purpose}.\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #dbeafe; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%); padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">Binary Vidya</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #dbeafe; font-weight: 500;">Security Verification</p>
          </div>
          <div style="padding: 32px 24px; text-align: center;">
            <p style="font-size: 15px; color: #334155; margin-bottom: 20px;">
              Use the 4-digit verification code below for <strong>${purpose}</strong>:
            </p>
            <div style="background: #eff6ff; border: 2px dashed #2563eb; border-radius: 12px; padding: 18px; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #1e3a8a; margin-bottom: 20px;">
              ${otpCode}
            </div>
            <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
              This code will expire in <strong>10 minutes</strong>.<br />
              Do not share this code with anyone.
            </p>
          </div>
          <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            &copy; ${new Date().getFullYear()} Binary Vidya. All rights reserved.
          </div>
        </div>
      `,
    };

    const info = await mailClient.sendMail(mailOptions);
    console.log('[Nodemailer Sent OTP]:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Nodemailer Error]:', error);
    return false;
  }
};

export interface WelcomeUserData {
  id: string;
  name?: string;
  email: string;
  role?: string;
  phone?: string;
}

export const sendWelcomeEmail = async (user: WelcomeUserData): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const mailClient = getTransporter();
    const displayName = user.name?.trim() || 'Learner';
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const coursesUrl = `${portalUrl}/courses`;
    const attachments = getLogoAttachment();

    // Spam-proof plain text alternative matching HTML
    const plainText = `Hello ${displayName},

Welcome to Binary Vidya! We are delighted to have you join our learning community.

At Binary Vidya, our mission is to provide practical, high-quality tech education designed to build real-world skills. Whether you are stepping into web development, exploring advanced system architecture, or building hands-on projects, we are here to support your growth.

Here is what you can look forward to:
- Curated, industry-aligned course curriculums.
- Seamless video learning with our interactive in-website video player.
- Official course completion certificates with unique verification codes.
- Progress tracking and dedicated student dashboard.

Ready to begin?
Visit our course catalog: ${coursesUrl}

If you have any questions or need any assistance, reply directly to this email or contact us at ${EMAIL_USER}.

Wishing you a rewarding and inspiring learning journey ahead!

Warm regards,
The Binary Vidya Team
${portalUrl}

---
You received this email because an account was created on Binary Vidya for ${user.email}.
© ${new Date().getFullYear()} Binary Vidya. All rights reserved.`;

    // Deliverability-optimized HTML with high text-to-image ratio and clean inline styling
    const htmlContent = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Binary Vidya</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased; line-height: 1.6;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);">
    <!-- Clean Logo Header -->
    <tr>
      <td align="center" style="padding: 32px 32px 20px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
        <img src="cid:binaryvidyalogo" alt="Binary Vidya" width="200" style="display: block; width: 200px; max-width: 100%; height: auto; margin: 0 auto;" />
      </td>
    </tr>

    <!-- Main Welcome Message -->
    <tr>
      <td style="padding: 36px 36px 28px;">
        <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; letter-spacing: -0.3px;">
          Welcome to Binary Vidya, ${displayName}
        </h1>
        
        <p style="font-size: 15px; line-height: 1.65; color: #334155; margin: 0 0 16px 0;">
          We are delighted to welcome you to our learning community. Whether you are embarking on your programming journey, sharpening your full-stack engineering skills, or aiming for verified tech credentials, you have taken a meaningful step forward.
        </p>

        <p style="font-size: 15px; line-height: 1.65; color: #334155; margin: 0 0 24px 0;">
          Our platform is designed to provide hands-on, practical education with interactive curriculums, seamless video learning, and recognized certificates that validate your dedication.
        </p>

        <!-- Highlights Card -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin: 0 0 28px 0;">
          <tr>
            <td style="padding: 20px 22px;">
              <div style="font-size: 13px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                What You Can Explore
              </div>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 5px 0; font-size: 14px; color: #334155; line-height: 1.5;">
                    <span style="color: #2563eb; font-weight: bold; margin-right: 6px;">&#8226;</span>
                    <strong>Industry-Ready Curriculums:</strong> Master modern development frameworks and core concepts.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-size: 14px; color: #334155; line-height: 1.5;">
                    <span style="color: #2563eb; font-weight: bold; margin-right: 6px;">&#8226;</span>
                    <strong>Interactive Video Player:</strong> Full-featured in-browser player with playback speed and quality controls.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-size: 14px; color: #334155; line-height: 1.5;">
                    <span style="color: #2563eb; font-weight: bold; margin-right: 6px;">&#8226;</span>
                    <strong>Verified Certificates:</strong> Earn authentic completion certificates upon completing course video lectures.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-size: 14px; color: #334155; line-height: 1.5;">
                    <span style="color: #2563eb; font-weight: bold; margin-right: 6px;">&#8226;</span>
                    <strong>Personalized Dashboard:</strong> Track your enrollments and learning progress anytime.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Primary Action CTA Button -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 28px 0;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color: #2563eb; border-radius: 8px;">
                    <a href="${coursesUrl}" target="_blank" style="display: inline-block; padding: 13px 30px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Start Learning Now &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 12px 0;">
          Have questions or need guidance getting started? Feel free to reply directly to this email or reach out to our team at <a href="mailto:${EMAIL_USER}" style="color: #2563eb; text-decoration: underline;">${EMAIL_USER}</a>.
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 20px 0 0 0;">
          Warm regards,<br />
          <strong>The Binary Vidya Team</strong>
        </p>
      </td>
    </tr>

    <!-- CAN-SPAM Compliant Anti-Spam Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 22px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;">
        You received this email because an account was registered for <strong>${user.email}</strong> on <a href="${portalUrl}" style="color: #64748b; text-decoration: underline;">Binary Vidya</a>.<br />
        &copy; ${new Date().getFullYear()} Binary Vidya. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const mailOptions = {
      from: `"Binary Vidya" <${EMAIL_USER}>`,
      to: user.email,
      replyTo: EMAIL_USER,
      subject: `Welcome to Binary Vidya, ${displayName}`,
      text: plainText,
      html: htmlContent,
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
      },
      attachments,
    };

    const info = await mailClient.sendMail(mailOptions);
    console.log(`[Welcome Email Sent] To: ${user.email} | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Welcome Email Error] To: ${user.email}:`, error?.message || error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
};

