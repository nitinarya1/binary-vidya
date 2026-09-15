import nodemailer from 'nodemailer';

// Clean the app password (remove spaces if user copied with spaces)
const getEmailPass = () => (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

export const getTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: getEmailPass(),
    },
  });
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
    });

    console.log(`[Nodemailer] Inbox-optimized OTP email sent to ${to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error('[Nodemailer Send Error]:', error?.message || error);
    return false;
  }
};
