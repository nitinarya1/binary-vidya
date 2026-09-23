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
      pool: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: getEmailPass(),
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 45000,
    } as any);
    if (sharedTransporter && typeof sharedTransporter.on === 'function') {
      sharedTransporter.on('error', (err: any) => {
        console.error('[Backend Nodemailer Error Handled]:', err?.message || err);
      });
    }
  }
  return sharedTransporter;
};

export const sendOtpEmail = async (to: string, otp: string, purpose: string = 'Password Reset'): Promise<boolean> => {
  try {
    const fromAddress = process.env.EMAIL_USER || 'binaryvidyaadmin@gmail.com';

    // 1. Plain Text Version (No Links)
    const textContent = `Your Binary Vidya verification code is: ${otp}

This code was requested for: ${purpose}.
It will expire in 10 minutes.

Enter this code on your verification screen to proceed.

If you did not make this request, you can safely ignore this message. Do not share this code with anyone.

Best regards,
Binary Vidya Security Team
${fromAddress}`;

    // 2. Modern White & Royal Blue Deliverability-Optimized HTML Template (Zero Links)
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${otp} is your Binary Vidya verification code</title>
      </head>
      <body style="margin: 0; padding: 28px 12px; background-color: #f0f7ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1.5px solid #bfdbfe; overflow: hidden; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.08);">
          
          <!-- Clean White Logo Header (No Links) -->
          <tr>
            <td align="center" style="background-color: #ffffff; padding: 28px 24px 22px; text-align: center; border-bottom: 2px solid #eff6ff;">
              <img 
                src="https://binaryvidya.vercel.app/images/binary-vidya-logo.png" 
                alt="Binary Vidya" 
                width="195" 
                style="display: block; width: 195px; max-width: 100%; height: auto; margin: 0 auto; border: 0; outline: none; text-decoration: none;" 
              />
            </td>
          </tr>

          <!-- Royal Blue Accent Sub-Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); padding: 11px 24px; text-align: center;">
              <div style="font-size: 11px; font-weight: 800; color: #ffffff; letter-spacing: 1.2px; text-transform: uppercase;">
                🔒 Official Security Verification
              </div>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 34px 30px 28px; text-align: center;">
              <div style="display: inline-block; padding: 4px 14px; background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; border-radius: 99px; font-size: 12px; font-weight: 700; margin-bottom: 16px;">
                🔒 One-Time Passcode
              </div>
              
              <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">
                Authorization Code
              </h1>
              
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                Use the verification code below to authorize your sign-in for <strong>${purpose}</strong>:
              </p>

              <!-- Copyable OTP Box with White & Blue Theme (Zero Links) -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 22px 0;">
                <tr>
                  <td align="center" style="background-color: #f8fbff; border: 2px dashed #2563eb; border-radius: 14px; padding: 24px 20px;">
                    
                    <!-- OTP Digits with user-select -->
                    <div style="font-family: 'SF Mono', Consolas, 'Courier New', monospace; font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #1e40af; text-align: center; user-select: all; -webkit-user-select: all; padding-left: 10px;">
                      ${otp}
                    </div>

                    <!-- Copy Hint Button/Badge -->
                    <div style="margin-top: 14px; display: inline-block; background-color: #ffffff; border: 1px solid #93c5fd; padding: 6px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; color: #2563eb; box-shadow: 0 2px 4px rgba(37,99,235,0.06);">
                      📋 Double-click code to copy
                    </div>

                    <div style="font-size: 12px; color: #64748b; margin-top: 10px;">
                      ⏱️ Valid for <strong>10 minutes</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 14px 0; font-weight: 500;">
                Enter this 6-digit code on the sign-in screen to proceed.
              </p>

              <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin: 0;">
                If you did not initiate this request, you can safely disregard this email. Never share your authorization code with anyone.
              </p>
            </td>
          </tr>

          <!-- Clean Blue/White Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; line-height: 1.5;">
              Sent securely by <strong>Binary Vidya</strong> &bull; Bengaluru, India<br />
              &copy; ${new Date().getFullYear()} Binary Vidya. All rights reserved.
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;

    const transport = getTransporter();
    const attachments = getLogoAttachment();
    const subject = `${otp} is your Binary Vidya verification code`;

    const info = await transport.sendMail({
      from: `"Binary Vidya Security" <${fromAddress}>`,
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
      attachments,
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
    const portalUrl = (process.env.FRONTEND_URL || 'https://binaryvidya.vercel.app').replace(/\/+$/, '');
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
    <!-- Clean White Logo Header -->
    <tr>
      <td align="center" style="background-color: #ffffff; padding: 28px 24px 22px; text-align: center; border-bottom: 2px solid #eff6ff;">
        <a href="${portalUrl}" target="_blank" style="display: inline-block; text-decoration: none;">
          <img 
            src="https://binaryvidya.vercel.app/images/binary-vidya-logo.png" 
            alt="Binary Vidya" 
            width="200" 
            style="display: block; width: 200px; max-width: 100%; height: auto; margin: 0 auto; border: 0; outline: none; text-decoration: none;" 
          />
        </a>
      </td>
    </tr>

    <!-- Royal Blue Accent Sub-Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); padding: 11px 24px; text-align: center;">
        <div style="font-size: 11px; font-weight: 800; color: #ffffff; letter-spacing: 1.2px; text-transform: uppercase;">
          Student Learning &amp; Tech Community Portal
        </div>
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

export interface TeamCredentialsData {
  name: string;
  email: string;
  temporaryPassword: string;
  department: string;
  permissions?: Record<string, boolean>;
  loginUrl?: string;
}

export const sendTeamCredentialsEmail = async (
  data: TeamCredentialsData
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const transport = getTransporter();
    const fromAddress = process.env.EMAIL_USER || 'binaryvidyaadmin@gmail.com';
    const displayName = data.name?.trim() || 'Team Member';
    const deptLower = (data.department || '').toLowerCase();
    const isSales = ['csm', 'bda', 'lead generation', 'sales'].some((role) => deptLower.includes(role));

    const portalBase = (process.env.FRONTEND_URL || 'https://binaryvidya.vercel.app').replace(/\/+$/, '');
    const defaultUrl = isSales ? `${portalBase}/sales/login` : `${portalBase}/login`;
    const portalUrl = data.loginUrl || defaultUrl;
    const attachments = getLogoAttachment();

    const subject = isSales
      ? `Welcome to Binary Vidya Sales & CRM Team (${data.department})`
      : `Your Binary Vidya Administrative Staff Credentials (${data.department})`;

    const subBannerText = isSales
      ? 'Sales & Counselling Operations • Staff Credentials'
      : 'Main Platform • Staff Administrative Access';

    const roleBadge = isSales
      ? `🎉 Sales & CRM Team • ${data.department}`
      : `🛡️ Platform Administration • ${data.department}`;

    const welcomeHeading = isSales
      ? `Welcome to the Sales Team, ${displayName}!`
      : `Welcome to the Staff Team, ${displayName}!`;

    const description = isSales
      ? `You have been granted access to the Binary Vidya Sales & CRM Console as a member of the <strong>${data.department}</strong> team. You can now access your assigned student leads, track call dispositions, and manage admissions.`
      : `You have been granted administrative access to the Binary Vidya platform in the <strong>${data.department}</strong> department. You can now access the administrative portal to manage platform curriculums, courses, certificates, and student operations.`;

    const ctaButtonText = isSales
      ? 'Access Sales & CRM Console &rarr;'
      : 'Sign In to Staff Console &rarr;';

    const tipNotice = isSales
      ? '<strong>💡 Quick Tip:</strong> You can sign in using your Temporary Password or by entering your registered email for instant 6-digit OTP verification.'
      : '<strong>🔒 Security Advisory:</strong> For platform security, you will be required to verify a 4-digit code (2FA OTP) and choose a new, secure password upon your first sign in.';

    const plainText = `Hello ${displayName},

You have been added to the Binary Vidya team as a member of the ${data.department} department.

Here are your administrative login credentials:
- Login Portal: ${portalUrl}
- Email / Username: ${data.email}
- Temporary Password: ${data.temporaryPassword}
- Assigned Role: ${data.department}

SECURITY ADVISORY:
For security purposes, you will be required to change this temporary password upon your first login. You can also log in via 2FA OTP verification code sent to this email address.

If you have any questions, please contact your Super Administrator.

Warm regards,
Binary Vidya Administration Team`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 28px 12px; background-color: #f0f7ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1.5px solid #bfdbfe; overflow: hidden; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.08);">
    
    <!-- Clean White Logo Header -->
    <tr>
      <td align="center" style="background-color: #ffffff; padding: 28px 24px 22px; text-align: center; border-bottom: 2px solid #eff6ff;">
        <a href="${portalUrl}" target="_blank" style="display: inline-block; text-decoration: none;">
          <img 
            src="https://binaryvidya.vercel.app/images/binary-vidya-logo.png" 
            alt="Binary Vidya" 
            width="200" 
            style="display: block; width: 200px; max-width: 100%; height: auto; margin: 0 auto; border: 0; outline: none; text-decoration: none;" 
          />
        </a>
      </td>
    </tr>

    <!-- Royal Blue Accent Sub-Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); padding: 11px 24px; text-align: center;">
        <div style="font-size: 11px; font-weight: 800; color: #ffffff; letter-spacing: 1.2px; text-transform: uppercase;">
          ${subBannerText}
        </div>
      </td>
    </tr>

    <!-- Main Content -->
    <tr>
      <td style="padding: 34px 32px 28px;">
        <div style="display: inline-block; padding: 5px 14px; background-color: #eff6ff; border: 1.5px solid #93c5fd; color: #1d4ed8; border-radius: 99px; font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 0.5px;">
          ${roleBadge}
        </div>

        <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; line-height: 1.3;">
          ${welcomeHeading}
        </h1>

        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">
          ${description}
        </p>

        <!-- Credentials Card -->
        <div style="background-color: #f8fbff; border: 1.5px solid #bfdbfe; border-radius: 12px; padding: 22px; margin-bottom: 24px;">
          <div style="font-size: 12px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px;">
            🔐 Your Login Credentials
          </div>
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #64748b; width: 140px; border-bottom: 1px solid #e2e8f0;">Login Portal:</td>
              <td style="padding: 8px 0; font-size: 14px; color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">
                <a href="${portalUrl}" style="color: #2563eb; text-decoration: underline;">${portalUrl}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Email / Username:</td>
              <td style="padding: 8px 0; font-size: 14px; color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">
                ${data.email}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Temporary Password:</td>
              <td style="padding: 8px 0; font-size: 15px; color: #1e40af; font-weight: 800; font-family: monospace; border-bottom: 1px solid #e2e8f0;">
                <span style="background: #e0e7ff; padding: 4px 10px; border-radius: 6px; letter-spacing: 1px; border: 1px solid #c7d2fe;">${data.temporaryPassword}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0 0 0; font-size: 14px; color: #64748b;">Assigned Department:</td>
              <td style="padding: 8px 0 0 0; font-size: 14px; color: #059669; font-weight: 800;">
                ${data.department}
              </td>
            </tr>
          </table>
        </div>

        <!-- 1-Click Login CTA Button -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <a href="${portalUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 14px rgba(37,99,235,0.25);">
                ${ctaButtonText}
              </a>
            </td>
          </tr>
        </table>

        <!-- Security Notice -->
        <div style="background-color: #fefce8; border: 1px solid #fef08a; padding: 14px 16px; border-radius: 10px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 13px; color: #854d0e; line-height: 1.5;">
            ${tipNotice}
          </p>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 0;">
          If you have any questions or need access assistance, please reach out to your Super Administrator at <a href="mailto:aryar0779@gmail.com" style="color: #2563eb; text-decoration: underline;">aryar0779@gmail.com</a>.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 18px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; line-height: 1.5;">
        Sent securely by <strong>Binary Vidya</strong> &bull; Bengaluru, India<br />
        &copy; ${new Date().getFullYear()} Binary Vidya. All rights reserved. Confidential Staff Communications.
      </td>
    </tr>
  </table>
</body>
</html>`;

    const mailOptions = {
      from: `"Binary Vidya Administration" <${fromAddress}>`,
      to: data.email,
      replyTo: fromAddress,
      subject,
      text: plainText,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        Importance: 'high',
        'Auto-Submitted': 'auto-generated',
      },
      attachments,
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`[Team Credentials Email Sent] To: ${data.email} | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Team Credentials Email Error] To: ${data.email}:`, error?.message || error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
};
