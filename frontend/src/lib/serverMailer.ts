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
      pool: false,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 45000,
    });
    if (transporter && typeof transporter.on === 'function') {
      transporter.on('error', (err: any) => {
        console.error('[Nodemailer Transporter Error Handled]:', err?.message || err);
      });
    }
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
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
      },
      text: `Your Binary Vidya verification code is: ${otpCode}\n\nThis code was requested for: ${purpose}.\nThis code will expire in 10 minutes.\nEnter this code on your verification screen to proceed.\n\nIf you did not request this, please ignore this email. Do not share this code with anyone.\n\nBinary Vidya Security Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${otpCode} is your Binary Vidya verification code</title>
        </head>
        <body style="margin: 0; padding: 28px 12px; background-color: #f0f7ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1.5px solid #bfdbfe; overflow: hidden; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.08);">
            
            <!-- Clean Header (No Logo Image, Zero Delay) -->
            <tr>
              <td align="center" style="background-color: #ffffff; padding: 28px 24px 20px; text-align: center; border-bottom: 2px solid #eff6ff;">
                <div style="font-size: 22px; font-weight: 900; color: #1e40af; letter-spacing: -0.5px; text-transform: uppercase;">
                  Binary Vidya
                </div>
                <div style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 1.2px; margin-top: 3px; text-transform: uppercase;">
                  Security &bull; Verification Service
                </div>
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
                        ${otpCode}
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
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://binaryvidya.vercel.app';
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
    <!-- Clean White Brand Header (Zero Top Image) -->
    <tr>
      <td align="center" style="background-color: #ffffff; padding: 26px 24px 20px; text-align: center; border-bottom: 2px solid #eff6ff;">
        <a href="${portalUrl}" target="_blank" style="display: inline-block; text-decoration: none;">
          <div style="font-size: 22px; font-weight: 800; color: #1e40af; letter-spacing: -0.3px; text-transform: uppercase;">
            Binary Vidya
          </div>
        </a>
      </td>
    </tr>

    <!-- Royal Blue Accent Sub-Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); padding: 10px 24px; text-align: center;">
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
          Have questions or need guidance getting started? Feel free to reply directly to this email or reach out to our team at <a href="mailto:${EMAIL_USER}" style="color: #2563eb; text-decoration: underline;">${EMAIL_USER}</a>.
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 20px 0 0 0;">
          Warm regards,<br />
          <strong>The Binary Vidya Team</strong>
        </p>
      </td>
    </tr>

    <!-- CAN-SPAM Compliant Anti-Spam Footer with Smallest Logo -->
    <tr>
      <td align="center" style="background-color: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; line-height: 1.6;">
        <div style="margin-bottom: 12px;">
          <a href="${portalUrl}" target="_blank" style="display: inline-block; text-decoration: none;">
            <img 
              src="https://binaryvidya.vercel.app/images/binary-vidya-logo.png" 
              alt="Binary Vidya" 
              width="70" 
              style="display: block; width: 70px; max-width: 70px; height: auto; margin: 0 auto; opacity: 0.85; border: 0; outline: none; text-decoration: none;" 
            />
          </a>
        </div>
        You received this email because an account was registered for <strong>${user.email}</strong> on <a href="${portalUrl}" style="color: #2563eb; text-decoration: underline;">Binary Vidya</a>.<br />
        Sent from Binary Vidya &bull; Bengaluru, Karnataka, India<br />
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
    };

    const info = await mailClient.sendMail(mailOptions);
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
    const mailClient = getTransporter();
    const displayName = data.name?.trim() || 'Team Member';
    const deptLower = (data.department || '').toLowerCase();
    const isSales = ['csm', 'bda', 'lead generation', 'sales'].some((role) => deptLower.includes(role));

    const portalBase = (process.env.NEXT_PUBLIC_APP_URL || 'https://binaryvidya.vercel.app').replace(/\/+$/, '');
    const defaultUrl = isSales ? `${portalBase}/sales/login` : `${portalBase}/login`;
    const portalUrl = data.loginUrl || defaultUrl;

    const subject = isSales
      ? `Welcome to the Team, ${displayName} • Binary Vidya Sales Access`
      : `Your Binary Vidya Administrative Staff Credentials (${data.department})`;

    const welcomeHeading = isSales
      ? `Welcome to the Team, ${displayName}!`
      : `Welcome to the Staff Team, ${displayName}!`;

    const description = isSales
      ? `You have been registered as an authorized member of the Binary Vidya Sales &amp; Counseling team (<strong>${data.department}</strong>). You can now access your assigned learner leads, manage admissions, and record call dispositions.`
      : `You have been granted administrative access to the Binary Vidya platform in the <strong>${data.department}</strong> department. You can now access the administrative portal to manage platform curriculums, courses, certificates, and student operations.`;

    const ctaButtonText = isSales
      ? 'Log In to Sales Console &rarr;'
      : 'Sign In to Staff Console &rarr;';

    const tipNotice = isSales
      ? '<strong>💡 Quick Tip:</strong> You can sign in using your Temporary Password, or enter your registered email address on the login screen for instant 6-digit OTP verification.'
      : '<strong>🔒 Security Advisory:</strong> For platform security, you will be required to verify a 4-digit code (2FA OTP) and choose a new, secure password upon your first sign in.';

    const plainText = `Hello ${displayName},

Welcome to the Binary Vidya ${isSales ? 'Sales & Counseling' : 'Administrative'} Team!

You have been added as an authorized team member in the ${data.department} department.

Here are your login credentials:
- Login Portal: ${portalUrl}
- Login Email: ${data.email}
- Temporary Password: ${data.temporaryPassword}
- Assigned Role: ${data.department}

Direct Access Link: ${portalUrl}

${isSales ? 'Tip: You can sign in using this password, or enter your email address for instant 6-digit OTP verification.' : 'Security: You will be required to set a new password upon first login.'}

If you have any questions or require assistance, please contact your Super Administrator at aryar0779@gmail.com.

Warm regards,
Binary Vidya Administration
${portalBase}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 32px 14px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);">
    
    <!-- Header: Minimalist & Professional -->
    <tr>
      <td style="padding: 24px 30px 20px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <div style="font-size: 20px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.4px; text-transform: uppercase;">
                Binary Vidya
              </div>
            </td>
            <td align="right">
              <span style="display: inline-block; background-color: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px; border: 1px solid #bfdbfe;">
                ${isSales ? 'Sales &amp; Counseling' : 'Platform Staff'}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Main Content Area -->
    <tr>
      <td style="padding: 32px 30px 24px;">
        <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; line-height: 1.35;">
          ${welcomeHeading}
        </h1>

        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
          ${description}
        </p>

        <!-- Credentials Box: Clean Card -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 20px 22px;">
              <div style="font-size: 12px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 14px;">
                Your Login Credentials
              </div>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
                <tr>
                  <td style="padding: 7px 0; color: #64748b; width: 130px;">Login Portal:</td>
                  <td style="padding: 7px 0; font-weight: 600;">
                    <a href="${portalUrl}" target="_blank" style="color: #2563eb; text-decoration: underline;">
                      ${portalUrl}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Login Email:</td>
                  <td style="padding: 7px 0; font-weight: 700; color: #0f172a; border-top: 1px solid #f1f5f9;">
                    ${data.email}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Password:</td>
                  <td style="padding: 7px 0; border-top: 1px solid #f1f5f9;">
                    <span style="font-family: 'SF Mono', Consolas, monospace; font-size: 14px; font-weight: 700; color: #1e40af; background: #e0e7ff; padding: 3px 8px; border-radius: 5px; border: 1px solid #c7d2fe;">
                      ${data.temporaryPassword}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Assigned Role:</td>
                  <td style="padding: 7px 0; font-weight: 700; color: #059669; border-top: 1px solid #f1f5f9;">
                    ${data.department}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Direct Login Button CTA -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <a href="${portalUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none; box-shadow: 0 2px 6px rgba(37,99,235,0.2);">
                ${ctaButtonText}
              </a>
            </td>
          </tr>
        </table>

        <!-- Security / Quick Tip Note -->
        <div style="background-color: #f8fafc; border-left: 3px solid #2563eb; padding: 12px 14px; border-radius: 4px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.5;">
            ${tipNotice}
          </p>
        </div>

        <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0;">
          If you have questions or need access assistance, please contact your Super Administrator at <a href="mailto:aryar0779@gmail.com" style="color: #2563eb; text-decoration: underline;">aryar0779@gmail.com</a>.
        </p>
      </td>
    </tr>

    <!-- Footer with Smallest Logo -->
    <tr>
      <td align="center" style="background-color: #f8fafc; padding: 18px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; line-height: 1.6;">
        <div style="margin-bottom: 10px;">
          <a href="${portalUrl}" target="_blank" style="display: inline-block; text-decoration: none;">
            <img 
              src="https://binaryvidya.vercel.app/images/binary-vidya-logo.png" 
              alt="Binary Vidya" 
              width="65" 
              style="display: block; width: 65px; max-width: 65px; height: auto; margin: 0 auto; opacity: 0.85; border: 0; outline: none;" 
            />
          </a>
        </div>
        Sent securely by <strong>Binary Vidya</strong> &bull; Bengaluru, Karnataka, India<br />
        &copy; ${new Date().getFullYear()} Binary Vidya. All rights reserved. Confidential Team Communication.
      </td>
    </tr>
  </table>
</body>
</html>`;

    const mailOptions = {
      from: `"Binary Vidya Administration" <${EMAIL_USER}>`,
      to: data.email,
      replyTo: EMAIL_USER,
      subject,
      text: plainText,
      html: htmlContent,
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
      },
    };

    const info = await mailClient.sendMail(mailOptions);
    console.log(`[Team Credentials Email Sent] To: ${data.email} | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Team Credentials Email Error] To: ${data.email}:`, error?.message || error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
};
