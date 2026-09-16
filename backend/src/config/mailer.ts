import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Clean the app password (remove spaces if user copied with spaces)
const getEmailPass = () => (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

let sharedTransporter: any = null;

export const getTransporter = () => {
  if (!sharedTransporter) {
    sharedTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: process.env.EMAIL_USER,
        pass: getEmailPass(),
      },
    });
  }
  return sharedTransporter;
};

export const sendOtpEmail = async (to: string, otp: string, purpose: string = 'Password Reset'): Promise<boolean> => {
  try {
    const fromAddress = process.env.EMAIL_USER || 'binaryvidyaadmin@gmail.com';

    // 1. Plain Text Version (Essential for spam filter compliance)
    const textContent = `Your Binary Vidya verification code is: ${otp}

This code was requested for: ${purpose}.
It will expire in 10 minutes.

If you did not make this request, you can safely ignore this message. Do not share this code with anyone.

Best regards,
Binary Vidya Team
${fromAddress}`;

    // 2. High-Deliverability, Clean Light HTML Template
    const htmlContent = `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${otp} is your Binary Vidya verification code</title>
      </head>
      <body style="margin: 0; padding: 20px 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px auto; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 20px; text-align: left; border-bottom: 1px solid #f1f5f9;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #2563eb; width: 36px; height: 36px; border-radius: 8px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: bold; font-size: 16px;">
                    BV
                  </td>
                  <td style="padding-left: 12px; font-size: 20px; font-weight: 700; color: #1e3a8a;">
                    Binary Vidya
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 14px 0;">
                Verification Code
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                We received a request to verify your email for <strong>${purpose}</strong>. Please enter the following code to continue:
              </p>

              <!-- OTP Block with anti-spam clean styling -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0 24px;">
                <tr>
                  <td align="center" style="background-color: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 10px; padding: 18px 24px;">
                    <div style="font-family: 'Courier New', Courier, monospace, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; text-align: center;">
                      ${otp}
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 8px; text-align: center;">
                      Valid for <strong>10 minutes</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 0 0 8px 0;">
                If you did not initiate this request, you can safely ignore this email. Someone may have entered your email address by mistake.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
              This is an automated security notification sent by Binary Vidya Support.<br/>
              &copy; ${new Date().getFullYear()} Binary Vidya. All rights reserved.
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;

    const transport = getTransporter();

    // Natural transactional subject line without spam trigger punctuation
    const subject = `${otp} is your Binary Vidya verification code`;

    const info = await transport.sendMail({
      from: `"Binary Vidya" <${fromAddress}>`,
      to,
      replyTo: fromAddress,
      subject,
      text: textContent,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
      },
      attachments: getLogoAttachment(),
    });

    console.log(`[Nodemailer] Inbox-optimized OTP email sent to ${to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error('[Nodemailer Send Error]:', error?.message || error);
    return false;
  }
};

export function getLogoAttachment() {
  const candidatePaths = [
    path.join(process.cwd(), 'src', 'assets', 'binary-vidya-logo.png'),
    path.resolve(__dirname, '../assets/binary-vidya-logo.png'),
    path.join(process.cwd(), 'backend', 'src', 'assets', 'binary-vidya-logo.png'),
    path.join(process.cwd(), 'frontend', 'public', 'images', 'binary-vidya-logo.png'),
    path.resolve(__dirname, '../../../frontend/public/images/binary-vidya-logo.png'),
    path.resolve(__dirname, '../../frontend/public/images/binary-vidya-logo.png'),
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

export interface WelcomeUserData {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
}

export const sendWelcomeEmail = async (
  user: WelcomeUserData
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const transport = getTransporter();
    const fromAddress = process.env.EMAIL_USER || 'binaryvidyaadmin@gmail.com';
    const displayName = user.name?.trim() || 'Learner';
    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
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

If you have any questions or need any assistance, reply directly to this email or contact us at ${fromAddress}.

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
          Have questions or need guidance getting started? Feel free to reply directly to this email or reach out to our team at <a href="mailto:${fromAddress}" style="color: #2563eb; text-decoration: underline;">${fromAddress}</a>.
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
      from: `"Binary Vidya" <${fromAddress}>`,
      to: user.email,
      replyTo: fromAddress,
      subject: `Welcome to Binary Vidya, ${displayName}`,
      text: plainText,
      html: htmlContent,
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
      },
      attachments,
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`[Welcome Email Sent] To: ${user.email} | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Welcome Email Error] To: ${user.email}:`, error?.message || error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
};
