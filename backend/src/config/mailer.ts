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
    const roleTitle = (user.role || 'Student').toUpperCase();
    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const loginUrl = `${portalUrl}/login`;
    const coursesUrl = `${portalUrl}/courses`;
    const attachments = getLogoAttachment();

    const mailOptions = {
      from: `"Binary Vidya" <${fromAddress}>`,
      to: user.email,
      replyTo: fromAddress,
      subject: `Welcome to Binary Vidya, ${displayName}! 🎉`,
      text: `Hello ${displayName},\n\nWelcome to Binary Vidya! Your registered account is fully active and ready to use.\n\nAccount Details:\n- Account ID: ${user.id}\n- Registered Email: ${user.email}\n- Role: ${roleTitle}\n${user.phone ? `- Mobile: ${user.phone}\n` : ''}\nSign in to your dashboard: ${loginUrl}\nExplore courses: ${coursesUrl}\n\nBest regards,\nBinary Vidya Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Binary Vidya</title>
        </head>
        <body style="margin: 0; padding: 24px 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.07); border: 1px solid #e2e8f0;">
            <!-- Header Banner with Logo -->
            <tr>
              <td style="background: linear-gradient(135deg, #0b192c 0%, #1e3a8a 55%, #2563eb 100%); padding: 36px 32px 30px; text-align: center;">
                <!-- White Logo Card -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 20px auto;">
                  <tr>
                    <td align="center" style="background: #ffffff; border-radius: 14px; padding: 14px 26px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);">
                      <img src="cid:binaryvidyalogo" alt="Binary Vidya" width="220" style="display: block; width: 220px; max-width: 100%; height: auto; margin: 0 auto;" />
                    </td>
                  </tr>
                </table>
                <div style="display: inline-block; background: rgba(255, 255, 255, 0.16); border: 1px solid rgba(255, 255, 255, 0.35); border-radius: 20px; padding: 6px 16px; margin-bottom: 12px;">
                  <span style="font-size: 12px; font-weight: 700; letter-spacing: 1.2px; color: #ffffff; text-transform: uppercase;">Official Learning Platform</span>
                </div>
                <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Welcome Aboard, ${displayName}! 🎉</h1>
                <p style="margin: 0; font-size: 14px; color: #dbeafe; max-width: 460px; margin-left: auto; margin-right: auto; line-height: 1.5;">
                  Your journey towards masterclass tech education, hands-on skills, and verified industry certificates starts right here.
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 36px 36px 28px;">
                <p style="font-size: 16px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
                  Hello <strong style="color: #0f172a;">${displayName}</strong>,
                </p>
                <p style="font-size: 14px; line-height: 1.65; color: #475569; margin: 0 0 24px 0;">
                  Thank you for creating an account with <strong>Binary Vidya</strong>! Your student account is fully activated. Below are your official account details and unique <strong>Account ID</strong> for your records:
                </p>

                <!-- Credentials Card -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; margin: 0 0 28px 0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 11px 20px; color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase;">
                      Official Account Credentials
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 22px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; width: 140px;">
                            Account ID:
                          </td>
                          <td style="padding: 8px 0;">
                            <span style="font-family: 'Courier New', Courier, monospace; font-size: 14px; font-weight: 700; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 4px 10px; border-radius: 6px; display: inline-block;">
                              ${user.id}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">
                            Full Name:
                          </td>
                          <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #0f172a;">
                            ${displayName}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">
                            Registered Email:
                          </td>
                          <td style="padding: 8px 0; font-size: 14px; color: #1e293b; font-weight: 500;">
                            ${user.email}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">
                            Account Role:
                          </td>
                          <td style="padding: 8px 0;">
                            <span style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase;">
                              ${roleTitle}
                            </span>
                          </td>
                        </tr>
                        ${user.phone ? `
                        <tr>
                          <td style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">
                            Mobile Number:
                          </td>
                          <td style="padding: 8px 0; font-size: 14px; color: #334155;">
                            ${user.phone}
                          </td>
                        </tr>` : ''}
                        <tr>
                          <td style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">
                            Account Status:
                          </td>
                          <td style="padding: 8px 0;">
                            <span style="background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase;">
                              Active & Verified
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Primary Action CTA -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 28px 0; text-align: center;">
                  <tr>
                    <td align="center">
                      <a href="${coursesUrl}" target="_blank" style="background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 34px; border-radius: 10px; display: inline-block; box-shadow: 0 6px 18px rgba(37, 99, 235, 0.35);">
                        Explore Courses & Start Learning &rarr;
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Platform Highlights -->
                <div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
                  <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">
                    What You Can Explore with Binary Vidya:
                  </h4>
                  <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #15803d; line-height: 1.7;">
                    <li><strong>Industry Curriculums:</strong> Practical courses in Full Stack, System Design, and Modern Web.</li>
                    <li><strong>In-Website Video Player:</strong> Seamless playback with speed, volume, and quality control.</li>
                    <li><strong>Verified Certificates:</strong> Official course completion certificates with unique QR verification codes.</li>
                    <li><strong>Personal Profile:</strong> Customize your name, avatar, and learning credentials anytime.</li>
                  </ul>
                </div>

                <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0 0 8px 0;">
                  If you have any questions or need assistance, reply directly to this email or write to <a href="mailto:${fromAddress}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${fromAddress}</a>.
                </p>
                <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin: 0;">
                  Security Note: Binary Vidya will never ask you for your account password or payment PIN.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.6;">
                This welcome notification was sent to <strong>${user.email}</strong> by Binary Vidya Support.<br />
                &copy; ${new Date().getFullYear()} Binary Vidya. All rights reserved.
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      attachments,
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`[Welcome Email Sent] To: ${user.email} | Id: ${user.id} | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Welcome Email Error] To: ${user.email}:`, error?.message || error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
};
