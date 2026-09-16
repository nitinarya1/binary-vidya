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
    const attachments = getLogoAttachment();

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
      text: `Your Binary Vidya verification code is: ${otpCode}\n\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #dbeafe; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
            <div style="background: #ffffff; border-radius: 12px; padding: 12px 20px; display: inline-block; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <img src="cid:binaryvidyalogo" alt="Binary Vidya" width="180" style="display: block; width: 180px; max-width: 100%; height: auto; margin: 0 auto;" />
            </div>
            <h1 style="margin: 0; font-size: 20px; font-weight: 800;">Account Verification</h1>
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
      attachments,
    };

    const info = await mailClient.sendMail(mailOptions);
    console.log('[Nodemailer Sent]:', info.messageId);
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
    const roleTitle = (user.role || 'Student').toUpperCase();
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = `${portalUrl}/login`;
    const coursesUrl = `${portalUrl}/courses`;
    const attachments = getLogoAttachment();

    const mailOptions = {
      from: `"Binary Vidya" <${EMAIL_USER}>`,
      to: user.email,
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
                  If you have any questions or need assistance, reply directly to this email or write to <a href="mailto:${EMAIL_USER}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${EMAIL_USER}</a>.
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

    const info = await mailClient.sendMail(mailOptions);
    console.log(`[Welcome Email Sent] To: ${user.email} | Id: ${user.id} | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Welcome Email Error] To: ${user.email}:`, error?.message || error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
};

