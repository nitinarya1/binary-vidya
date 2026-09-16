import nodemailer from 'nodemailer';

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
      text: `Your Binary Vidya verification code is: ${otpCode}\n\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #dbeafe; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Binary Vidya</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #dbeafe;">Account Verification</p>
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
    console.log('[Nodemailer Sent]:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Nodemailer Error]:', error);
    return false;
  }
};

export interface WelcomeUserData {
  id: string;
  name: string;
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

    const mailOptions = {
      from: `"Binary Vidya" <${EMAIL_USER}>`,
      to: user.email,
      subject: `Welcome to Binary Vidya, ${displayName}! Your Account ID: ${user.id}`,
      text: `Hello ${displayName},\n\nWelcome to Binary Vidya! Your registered account is ready.\n\nAccount Details:\n- Account ID: ${user.id}\n- Registered Email: ${user.email}\n- Role: ${roleTitle}\n${user.phone ? `- Phone: ${user.phone}\n` : ''}\nYou can sign in anytime at: ${loginUrl}\n\nBest regards,\nBinary Vidya Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Binary Vidya</title>
        </head>
        <body style="margin: 0; padding: 24px 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%); padding: 36px 32px; text-align: center; color: #ffffff;">
                <div style="display: inline-block; background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 12px; padding: 8px 16px; margin-bottom: 12px;">
                  <span style="font-size: 14px; font-weight: 700; letter-spacing: 1px; color: #ffffff; text-transform: uppercase;">Binary Vidya Platform</span>
                </div>
                <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Welcome Aboard! 🎉</h1>
                <p style="margin: 0; font-size: 14px; color: #dbeafe; max-width: 420px; margin-left: auto; margin-right: auto; line-height: 1.5;">
                  Your learning journey starts here. Explore cutting-edge courses, expert guidance, and tech masterclasses.
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 32px 32px 24px;">
                <p style="font-size: 16px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
                  Hello <strong style="color: #0f172a;">${displayName}</strong>,
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                  Thank you for registering with <strong>Binary Vidya</strong>. Your account has been provisioned and is active. Keep your unique <strong>Account ID</strong> safe for future course enrollments, identity verification, and support inquiries.
                </p>

                <!-- ID Card Box -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; margin: 0 0 28px 0; overflow: hidden;">
                  <tr>
                    <td style="background: #2563eb; padding: 10px 18px; color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                      Official Account Credentials
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 18px 20px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="padding: 6px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; width: 140px;">
                            Account ID:
                          </td>
                          <td style="padding: 6px 0;">
                            <span style="font-family: 'Courier New', Courier, monospace; font-size: 14px; font-weight: 700; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 3px 8px; border-radius: 6px; display: inline-block;">
                              ${user.id}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">
                            Full Name:
                          </td>
                          <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #0f172a;">
                            ${displayName}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">
                            Registered Email:
                          </td>
                          <td style="padding: 6px 0; font-size: 14px; color: #334155;">
                            ${user.email}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">
                            Role:
                          </td>
                          <td style="padding: 6px 0;">
                            <span style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase;">
                              ${roleTitle}
                            </span>
                          </td>
                        </tr>
                        ${user.phone ? `
                        <tr>
                          <td style="padding: 6px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">
                            Mobile:
                          </td>
                          <td style="padding: 6px 0; font-size: 14px; color: #334155;">
                            ${user.phone}
                          </td>
                        </tr>` : ''}
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Call to Action Button -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 28px 0; text-align: center;">
                  <tr>
                    <td align="center">
                      <a href="${loginUrl}" target="_blank" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                        Sign In to Your Dashboard &rarr;
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Helpful Tips -->
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;">
                  <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #166534;">
                    What You Can Do Next:
                  </h4>
                  <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #15803d; line-height: 1.6;">
                    <li>Access your courses, materials, and certificates.</li>
                    <li>Update your profile details anytime in account settings.</li>
                    <li>Reach out to mentors and join community discussions.</li>
                  </ul>
                </div>

                <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 0;">
                  If you have any questions or need help accessing your account, reply directly to this email or write to <a href="mailto:${EMAIL_USER}" style="color: #2563eb; text-decoration: none;">${EMAIL_USER}</a>.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background: #f8fafc; padding: 22px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.5;">
                This welcome email was sent to <strong>${user.email}</strong> by Binary Vidya.<br />
                &copy; ${new Date().getFullYear()} Binary Vidya Inc. All rights reserved.
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const info = await mailClient.sendMail(mailOptions);
    console.log(`[Welcome Email Sent] To: ${user.email} | Id: ${user.id} | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Welcome Email Error] To: ${user.email}:`, error?.message || error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
};

