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
      <body style="margin: 0; padding: 28px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #0f172a;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);">
          
          <!-- Clean Header -->
          <tr>
            <td align="center" style="background-color: #ffffff; padding: 26px 24px 18px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <div style="font-size: 20px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.4px; text-transform: uppercase;">
                Binary Vidya
              </div>
              <div style="font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.8px; margin-top: 3px; text-transform: uppercase;">
                Verification Service
              </div>
            </td>
          </tr>

          <!-- Sub-Header -->
          <tr>
            <td style="background-color: #1e3a8a; padding: 10px 24px; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 1px; text-transform: uppercase;">
                Official Security Verification
              </div>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px 28px 24px; text-align: center;">
              <div style="display: inline-block; padding: 4px 12px; background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; border-radius: 99px; font-size: 11px; font-weight: 700; margin-bottom: 14px;">
                One-Time Passcode
              </div>
              
              <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0;">
                Authorization Code
              </h1>
              
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
                Use the verification code below to authorize your sign-in for <strong>${purpose}</strong>:
              </p>

              <!-- Copyable OTP Box -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 20px 0;">
                <tr>
                  <td align="center" style="background-color: #f8fafc; border: 2px dashed #2563eb; border-radius: 10px; padding: 20px 16px;">
                    
                    <div style="font-family: 'SF Mono', Consolas, 'Courier New', monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #1e40af; text-align: center; user-select: all; -webkit-user-select: all; padding-left: 8px;">
                      ${otp}
                    </div>

                    <div style="font-size: 11px; color: #64748b; margin-top: 10px;">
                      Valid for 10 minutes
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 12px 0;">
                Enter this 6-digit code on the sign-in screen to proceed.
              </p>

              <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin: 0;">
                If you did not initiate this request, you can safely disregard this email. Never share your authorization code with anyone.
              </p>
            </td>
          </tr>

          <!-- Clean Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; line-height: 1.5;">
              Sent securely by <strong>Binary Vidya</strong> &bull; Bengaluru, Karnataka, India - 560001<br />
              &copy; ${new Date().getFullYear()} Binary Vidya. All rights reserved.
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;

    const transport = getTransporter();
    const subject = `${otp} is your Binary Vidya verification code`;

    const info = await transport.sendMail({
      from: `"Binary Vidya" <${fromAddress}>`,
      to,
      replyTo: fromAddress,
      subject,
      text: textContent,
      html: htmlContent,
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
          Have questions or need guidance getting started? Feel free to reply directly to this email or reach out to our team at <a href="mailto:${fromAddress}" style="color: #2563eb; text-decoration: underline;">${fromAddress}</a>.
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
              width="65" 
              style="display: block; width: 65px; max-width: 65px; height: auto; margin: 0 auto; opacity: 0.85; border: 0; outline: none; text-decoration: none;" 
            />
          </a>
        </div>
        You received this email because an account was registered for <strong>${user.email}</strong> on <a href="${portalUrl}" style="color: #2563eb; text-decoration: underline;">Binary Vidya</a>.<br />
        Sent from Binary Vidya &bull; Bengaluru, Karnataka, India - 560001<br />
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
  team?: string;
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

    // Extract exact team selected by admin (BDA, Lead Generation, or CSM)
    const rawTeam = (data.team || data.department || '').trim();
    const lower = rawTeam.toLowerCase();
    const isBDA = rawTeam.toUpperCase() === 'BDA' || lower.includes('bda');
    const isLeadGen = lower.includes('lead');
    const isCSM = rawTeam.toUpperCase() === 'CSM' || lower.includes('csm');
    const isSales = isBDA || isLeadGen || isCSM || lower.includes('sales');

    let teamName = rawTeam;
    let teamRoleTitle = rawTeam;
    let teamBadge = `${rawTeam} Team`;
    let roleExplanation = '';

    if (isBDA) {
      teamName = 'BDA';
      teamRoleTitle = 'Business Development Associate (BDA)';
      teamBadge = 'BDA Sales Team';
      roleExplanation = 'You have been selected and added to the Binary Vidya Business Development Associate (BDA) team. You are authorized to access the Sales Console to manage learner inquiries, counseling calls, admissions, and course enrollments.';
    } else if (isLeadGen) {
      teamName = 'Lead Generation';
      teamRoleTitle = 'Lead Generation Specialist';
      teamBadge = 'Lead Generation Team';
      roleExplanation = 'You have been selected and added to the Binary Vidya Lead Generation team. You are authorized to access the Sales Console to prospect, conduct outbound outreach, and source prospective learners.';
    } else if (isCSM) {
      teamName = 'CSM';
      teamRoleTitle = 'Customer Success Manager (CSM) - Senior Sales';
      teamBadge = 'CSM Team (Senior Sales)';
      roleExplanation = 'You have been selected and added to the Binary Vidya Customer Success Manager (CSM) senior sales team. You are authorized to manage senior counseling, high-ticket closures, and learner relationship management.';
    } else if (isSales) {
      teamName = rawTeam || 'Sales';
      teamRoleTitle = `${teamName} Sales Specialist`;
      teamBadge = `${teamName} Team`;
      roleExplanation = `You have been selected and added to the Binary Vidya ${teamName} sales team. You are authorized to access the Sales Console to manage learner admissions and enrollments.`;
    } else {
      teamName = rawTeam || 'Staff';
      teamRoleTitle = `${teamName} Department`;
      teamBadge = `${teamName} Team`;
      roleExplanation = `You have been granted administrative staff access to the Binary Vidya platform in the ${teamName} department.`;
    }

    const portalBase = (process.env.FRONTEND_URL || 'https://binaryvidya.vercel.app').replace(/\/+$/, '');
    const defaultUrl = isSales ? `${portalBase}/sales/login` : `${portalBase}/login`;
    const portalUrl = data.loginUrl || defaultUrl;

    // Spam-proof subject line: No emojis, no special symbols, includes company and exact selected team
    const subject = isSales
      ? `Welcome to Binary Vidya - ${teamName} Team Access Details`
      : `Binary Vidya Staff Account - ${teamName} Login Credentials`;

    const welcomeHeading = `Welcome to the ${teamName} Team, ${displayName}`;

    const plainText = `Hello ${displayName},

Welcome to the ${teamName} Team at Binary Vidya!

${roleExplanation}

Here are your team login credentials:
- Assigned Team: ${teamRoleTitle}
- Login Portal: ${portalUrl}
- Login Email: ${data.email}
- Temporary Password: ${data.temporaryPassword}

Direct Login Link:
${portalUrl}

Sign-in options:
You can log in using your temporary password, or enter your registered email address on the login screen to receive an instant 6-digit one-time verification code.

If you have any questions or require assistance, please contact your Super Administrator at aryar0779@gmail.com.

Warm regards,
Binary Vidya Team
Bengaluru, Karnataka, India - 560001
${portalBase}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 28px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #0f172a;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);">
    
    <!-- Clean Minimalist Header -->
    <tr>
      <td style="padding: 24px 28px 20px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <div style="font-size: 20px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.4px; text-transform: uppercase;">
                Binary Vidya
              </div>
            </td>
            <td align="right">
              <span style="display: inline-block; background-color: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px; border: 1px solid #bfdbfe;">
                ${teamBadge}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Main Content Area -->
    <tr>
      <td style="padding: 30px 28px 24px;">
        <h1 style="font-size: 21px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; line-height: 1.35;">
          ${welcomeHeading}
        </h1>

        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 22px 0;">
          ${roleExplanation}
        </p>

        <!-- Credentials Box -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 22px;">
          <tr>
            <td style="padding: 20px 22px;">
              <div style="font-size: 12px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 14px;">
                Your Login Credentials
              </div>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
                <tr>
                  <td style="padding: 7px 0; color: #64748b; width: 130px;">Assigned Team:</td>
                  <td style="padding: 7px 0; font-weight: 700; color: #059669;">
                    ${teamRoleTitle}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Login Portal:</td>
                  <td style="padding: 7px 0; font-weight: 600; border-top: 1px solid #f1f5f9;">
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
                    <span style="font-family: 'SF Mono', Consolas, 'Courier New', monospace; font-size: 14px; font-weight: 700; color: #1e40af; background: #e0e7ff; padding: 3px 8px; border-radius: 5px; border: 1px solid #c7d2fe;">
                      ${data.temporaryPassword}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Direct Login Button CTA -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 22px;">
          <tr>
            <td align="center">
              <a href="${portalUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none; box-shadow: 0 2px 6px rgba(37,99,235,0.2);">
                Log In to Sales Console &rarr;
              </a>
            </td>
          </tr>
        </table>

        <!-- Sign-in Options Note -->
        <div style="background-color: #f8fafc; border-left: 3px solid #2563eb; padding: 12px 14px; border-radius: 4px; margin-bottom: 18px;">
          <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.5;">
            <strong>Sign-in options:</strong> You can log in using this temporary password, or enter your registered email address on the login screen to receive an instant 6-digit one-time verification code.
          </p>
        </div>

        <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0;">
          If you have questions or need assistance, please contact your Super Administrator at <a href="mailto:aryar0779@gmail.com" style="color: #2563eb; text-decoration: underline;">aryar0779@gmail.com</a>.
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
        Sent securely by <strong>Binary Vidya</strong> &bull; Bengaluru, Karnataka, India - 560001<br />
        You received this email because an authorized team account was registered for <strong>${data.email}</strong> on Binary Vidya.<br />
        &copy; ${new Date().getFullYear()} Binary Vidya. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>`;

    const mailOptions = {
      from: `"Binary Vidya" <${fromAddress}>`,
      to: data.email,
      replyTo: fromAddress,
      subject,
      text: plainText,
      html: htmlContent,
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`[Team Credentials Email Sent] To: ${data.email} | Team: ${teamName} | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Team Credentials Email Error] To: ${data.email}:`, error?.message || error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
};
