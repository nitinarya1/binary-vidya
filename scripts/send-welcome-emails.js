const path = require('path');
const mongoose = require(path.resolve(__dirname, '../frontend/node_modules/mongoose'));
const nodemailer = require(path.resolve(__dirname, '../frontend/node_modules/nodemailer'));
const dns = require('dns');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI environment variable is required.');
  process.exit(1);
}

const EMAIL_USER = process.env.EMAIL_USER || 'binaryvidyaadmin@gmail.com';
const EMAIL_PASS = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
const PORTAL_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${PORTAL_URL}/login`;

// Initialize Nodemailer transporter with connection pooling
const transporter = nodemailer.createTransport({
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

// Helper to check domain MX records to prevent hard-bounces on non-existent domains
function checkDomainMX(domain) {
  return new Promise((resolve) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// Generate the beautiful HTML welcome email
function generateWelcomeEmailHtml(user) {
  const displayName = (user.name || 'Learner').trim();
  const roleTitle = (user.role || 'Student').toUpperCase();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Binary Vidya</title>
    </head>
    <body style="margin: 0; padding: 24px 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
        <!-- Header Banner -->
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

        <!-- Main Content -->
        <tr>
          <td style="padding: 32px 32px 24px;">
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
              Hello <strong style="color: #0f172a;">${displayName}</strong>,
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
              Thank you for being part of <strong>Binary Vidya</strong>! Your registered account is fully active and ready to use. Please find your official account credentials and unique <strong>Account ID</strong> below:
            </p>

            <!-- Account Details Card -->
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
                      <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; width: 140px;">
                        Account ID:
                      </td>
                      <td style="padding: 7px 0;">
                        <span style="font-family: 'Courier New', Courier, monospace; font-size: 14px; font-weight: 700; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 4px 10px; border-radius: 6px; display: inline-block;">
                          ${user._id.toString()}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">
                        Full Name:
                      </td>
                      <td style="padding: 7px 0; font-size: 14px; font-weight: 600; color: #0f172a;">
                        ${displayName}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">
                        Registered Email:
                      </td>
                      <td style="padding: 7px 0; font-size: 14px; color: #334155;">
                        <strong>${user.email}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">
                        Account Role:
                      </td>
                      <td style="padding: 7px 0;">
                        <span style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase;">
                          ${roleTitle}
                        </span>
                      </td>
                    </tr>
                    ${
                      user.phone
                        ? `
                    <tr>
                      <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">
                        Mobile Number:
                      </td>
                      <td style="padding: 7px 0; font-size: 14px; color: #334155;">
                        ${user.phone}
                      </td>
                    </tr>`
                        : ''
                    }
                  </table>
                </td>
              </tr>
            </table>

            <!-- Sign In CTA Button -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 28px 0; text-align: center;">
              <tr>
                <td align="center">
                  <a href="${LOGIN_URL}" target="_blank" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                    Sign In to Binary Vidya &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <!-- Feature Highlights -->
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 18px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #166534;">
                Platform Highlights:
              </h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #15803d; line-height: 1.6;">
                <li>Interactive tech courses, assignments, and real-world projects.</li>
                <li>Live sessions with industry mentors and peer group discussions.</li>
                <li>Track your skill progress and earn verified certificates.</li>
              </ul>
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0;">
              Need help? Feel free to reply directly to this email or reach us anytime at <a href="mailto:${EMAIL_USER}" style="color: #2563eb; text-decoration: none;">${EMAIL_USER}</a>.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background: #f8fafc; padding: 22px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.5;">
            Sent by Binary Vidya Security & Notifications.<br />
            &copy; ${new Date().getFullYear()} Binary Vidya. All rights reserved.
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

async function run() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB successfully.');

  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log(`Found ${users.length} total registered users in database.\n`);

  const results = {
    total: users.length,
    sent: 0,
    skippedNoEmail: 0,
    skippedInvalidDomain: 0,
    failed: 0,
    details: [],
  };

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const userId = user._id.toString();
    const email = (user.email || '').trim().toLowerCase();
    const name = user.name || 'Learner';

    console.log(`[${i + 1}/${users.length}] Processing: ${name} (ID: ${userId})`);

    if (!email) {
      console.log(`  -> SKIPPED: No email address found (Phone: ${user.phone || 'N/A'})`);
      results.skippedNoEmail++;
      results.details.push({ id: userId, name, email: 'None', status: 'SKIPPED_NO_EMAIL' });
      continue;
    }

    const domain = email.split('@')[1];
    const hasMx = await checkDomainMX(domain);

    if (!hasMx) {
      console.log(`  -> SKIPPED: Domain '@${domain}' has no valid mail exchanger (MX) record (test dummy domain)`);
      results.skippedInvalidDomain++;
      results.details.push({ id: userId, name, email, domain, status: 'SKIPPED_DUMMY_DOMAIN' });
      continue;
    }

    try {
      console.log(`  -> Sending welcome email to: ${email}...`);
      const mailOptions = {
        from: `"Binary Vidya" <${EMAIL_USER}>`,
        to: email,
        subject: `Welcome to Binary Vidya, ${name}! Your Account ID: ${userId}`,
        text: `Hello ${name},\n\nWelcome to Binary Vidya! Your registered account is ready.\n\nAccount Details:\n- Account ID: ${userId}\n- Registered Email: ${email}\n- Role: ${user.role || 'student'}\n\nYou can sign in at: ${LOGIN_URL}\n\nBest regards,\nBinary Vidya Team`,
        html: generateWelcomeEmailHtml(user),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`  -> SUCCESS! MessageId: ${info.messageId}`);
      results.sent++;
      results.details.push({ id: userId, name, email, status: 'SENT', messageId: info.messageId });
    } catch (err) {
      console.error(`  -> FAILED to send to ${email}:`, err.message);
      results.failed++;
      results.details.push({ id: userId, name, email, status: 'FAILED', error: err.message });
    }

    // Small delay between emails to avoid hitting burst rate limits
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log('\n========================================');
  console.log('      WELCOME EMAIL DISPATCH REPORT     ');
  console.log('========================================');
  console.log(`Total Users in DB:        ${results.total}`);
  console.log(`Emails Sent Successfully: ${results.sent}`);
  console.log(`Skipped (No Email):       ${results.skippedNoEmail}`);
  console.log(`Skipped (Dummy Domains):  ${results.skippedInvalidDomain}`);
  console.log(`Failed Deliveries:        ${results.failed}`);
  console.log('========================================\n');

  console.log('Sent Recipients:');
  results.details
    .filter((d) => d.status === 'SENT')
    .forEach((d) => {
      console.log(`- ${d.name} <${d.email}> (ID: ${d.id}) -> MessageId: ${d.messageId}`);
    });

  if (results.skippedInvalidDomain > 0) {
    console.log('\nSkipped Dummy Domains (prevented bounce-back penalty):');
    results.details
      .filter((d) => d.status === 'SKIPPED_DUMMY_DOMAIN')
      .forEach((d) => {
        console.log(`- ${d.name} <${d.email}> (ID: ${d.id}) [${d.domain}]`);
      });
  }

  transporter.close();
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
