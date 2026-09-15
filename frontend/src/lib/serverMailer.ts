import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER || 'binaryvidyaadmin@gmail.com';
const EMAIL_PASS = (process.env.EMAIL_PASS || 'tvix uigh iulr fhfk').replace(/\s+/g, '');

let transporter: any = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
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
              Use the 6-digit verification code below for <strong>${purpose}</strong>:
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
