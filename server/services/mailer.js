import nodemailer from 'nodemailer';
import { getDB } from '../db.js';

export function getMailerConfig() {
  const db = getDB();
  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  settingsRows.forEach(r => {
    settings[r.key] = r.value;
  });
  return settings;
}

export function createTransporter(settings) {
  if (!settings.smtp_host || !settings.smtp_user) {
    return null;
  }
  return nodemailer.createTransport({
    host: settings.smtp_host,
    port: parseInt(settings.smtp_port, 10) || 587,
    secure: settings.smtp_secure === 'true',
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Builds standard HTML email template for new member welcome kit
 */
export function buildMemberWelcomeEmail(member, settings) {
  const companyName = settings.company_name || 'PureGro';
  const companyPhone = settings.company_phone || '+1 (800) 555-PURE';
  const formattedDate = new Date(member.created_at || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to PureGro Membership</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c1511; margin: 0; padding: 20px; color: #1e293b; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.25); }
      .header { background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%); padding: 40px 30px; text-align: center; color: #ffffff; }
      .header h1 { margin: 0 0 8px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
      .header p { margin: 0; color: #a7f3d0; font-size: 15px; }
      .card-box { margin: -30px 25px 25px 25px; background: linear-gradient(135deg, #062c1d 0%, #0f4c3a 100%); border-radius: 18px; padding: 24px; color: white; box-shadow: 0 10px 25px rgba(6, 78, 59, 0.4); border: 1px solid rgba(52, 211, 153, 0.3); }
      .card-top { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 15px; margin-bottom: 18px; }
      .brand-badge { font-weight: 800; letter-spacing: 1px; font-size: 18px; color: #34d399; }
      .tier-badge { background: rgba(52, 211, 153, 0.2); border: 1px solid #34d399; color: #34d399; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
      .card-body { display: flex; gap: 18px; align-items: center; }
      .member-avatar { width: 80px; height: 80px; border-radius: 14px; object-fit: cover; border: 2px solid #10b981; background: #064e3b; }
      .member-details { flex: 1; }
      .member-name { font-size: 20px; font-weight: 700; margin: 0 0 6px 0; color: #ffffff; }
      .member-num { font-size: 15px; font-family: monospace; font-weight: 600; color: #6ee7b7; margin: 0 0 4px 0; letter-spacing: 0.5px; }
      .id-num { font-size: 13px; color: #94a3b8; margin: 0; }
      .card-qr { text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px dashed rgba(255,255,255,0.15); }
      .qr-img { width: 110px; height: 110px; background: white; padding: 6px; border-radius: 8px; }
      .content { padding: 0 30px 30px 30px; }
      .content h2 { color: #064e3b; font-size: 19px; margin-top: 0; }
      .perks { background: #f0fdf4; border-radius: 12px; padding: 18px; margin: 20px 0; border: 1px solid #bbf7d0; }
      .perks-list { margin: 10px 0 0 0; padding-left: 20px; color: #166534; font-size: 14px; line-height: 1.6; }
      .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 25px; text-align: center; font-size: 13px; color: #64748b; }
      .btn { display: inline-block; background: #059669; color: white; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; margin-top: 15px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🌱 Welcome to PureGro!</h1>
        <p>Your official member registration is confirmed and active</p>
      </div>

      <!-- Digital Member Pass -->
      <div class="card-box">
        <div class="card-top">
          <div class="brand-badge">PUREGRO CLUB</div>
          <div class="tier-badge">${member.tier || 'Active Member'}</div>
        </div>
        <div class="card-body">
          ${member.photo_url ? `<img src="${member.photo_url}" class="member-avatar" alt="Member Photo" />` : `<div class="member-avatar" style="display:flex;align-items:center;justify-content:center;font-size:26px;color:#34d399;">👤</div>`}
          <div class="member-details">
            <h3 class="member-name">${member.full_name}</h3>
            <p class="member-num">💳 ${member.membership_no}</p>
            <p class="id-num">ID No: <strong>${member.id_number}</strong></p>
            <p class="id-num">Issued: ${formattedDate}</p>
          </div>
        </div>
        ${member.qr_code ? `
          <div class="card-qr">
            <img src="${member.qr_code}" class="qr-img" alt="Membership QR Code" />
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Scan at checkout or PureGro checkpoints</div>
          </div>
        ` : ''}
      </div>

      <div class="content">
        <h2>Dear ${member.full_name},</h2>
        <p style="color: #475569; line-height: 1.6; font-size: 15px;">
          Thank you for joining the <strong>${companyName}</strong> community! Your digital membership card is ready. You can present your membership number (<strong>${member.membership_no}</strong>) or QR code whenever visiting our facilities, markets, or member events.
        </p>

        <div class="perks">
          <strong style="color: #065f46; font-size: 15px;">🌟 Your Member Privileges:</strong>
          <ul class="perks-list">
            <li>Exclusive member pricing on all organic and sustainable produce</li>
            <li>Priority access to fresh harvests and seasonal farm collections</li>
            <li>Instant check-in with your digital card & QR code</li>
            <li>Loyalty reward points on every transaction</li>
          </ul>
        </div>

        <p style="color: #64748b; font-size: 14px;">
          Keep this email saved on your phone for easy access to your membership credentials at any time.
        </p>
      </div>

      <div class="footer">
        <p><strong>${companyName}</strong></p>
        <p>Assistance & Inquiries: ${companyPhone}</p>
        <p style="margin-top: 10px; font-size: 11px; color: #94a3b8;">This email was sent to ${member.email} regarding your PureGro Membership.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Builds standard HTML email template for Administrator audit notice
 */
export function buildAdminNotificationEmail(member, settings) {
  const companyName = settings.company_name || 'PureGro';
  const nowStr = new Date().toLocaleString();

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>New Member Registration Notification</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #334155; }
      .box { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
      .header { background: #0f766e; color: #ffffff; padding: 24px 28px; }
      .header h2 { margin: 0 0 6px 0; font-size: 22px; }
      .header span { background: #14b8a6; color: #042f2e; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; }
      .body { padding: 24px 28px; }
      .table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      .table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
      .table td.lbl { color: #64748b; font-weight: 600; width: 38%; }
      .table td.val { color: #0f172a; font-weight: 500; }
      .highlight { color: #0f766e; font-weight: 700; font-family: monospace; font-size: 15px; }
      .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 28px; font-size: 12px; color: #94a3b8; }
    </style>
  </head>
  <body>
    <div class="box">
      <div class="header">
        <span>Admin Audit Alert</span>
        <h2 style="margin-top: 8px;">🌱 New Member Registered</h2>
        <p style="margin: 0; font-size: 13px; color: #ccfbf1;">A new membership profile was successfully created.</p>
      </div>
      <div class="body">
        <p style="font-size: 14px; color: #475569; margin: 0 0 16px 0;">
          The PureGro Admin System recorded a new member registration on <strong>${nowStr}</strong>.
        </p>

        <table class="table">
          <tr>
            <td class="lbl">Membership Number</td>
            <td class="val"><span class="highlight">${member.membership_no}</span></td>
          </tr>
          <tr>
            <td class="lbl">Full Name</td>
            <td class="val">${member.full_name}</td>
          </tr>
          <tr>
            <td class="lbl">National ID Number</td>
            <td class="val"><strong>${member.id_number}</strong></td>
          </tr>
          <tr>
            <td class="lbl">Email Address</td>
            <td class="val">${member.email}</td>
          </tr>
          <tr>
            <td class="lbl">Phone Number</td>
            <td class="val">${member.phone || 'N/A'}</td>
          </tr>
          <tr>
            <td class="lbl">Membership Tier</td>
            <td class="val">${member.tier || 'Green Member'}</td>
          </tr>
          <tr>
            <td class="lbl">Photo Provided</td>
            <td class="val">${member.photo_url ? '✅ Captured & Saved' : '⚠️ No photo'}</td>
          </tr>
        </table>
      </div>
      <div class="footer">
        <p style="margin: 0;">Automated notification from ${companyName} Admin Gateway.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Send notification emails to both member and administrator
 */
export async function sendMemberWelcomeEmails(member) {
  const db = getDB();
  const settings = getMailerConfig();
  const transporter = createTransporter(settings);

  const results = {
    memberEmailSent: false,
    adminEmailSent: false,
    errors: [],
  };

  const insertEmailLog = db.prepare(`
    INSERT INTO email_logs (member_id, recipient, recipient_type, subject, status, preview_html, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // 1. Prepare Member Welcome Email
  const memberSubject = `Welcome to PureGro, ${member.full_name}! Your Membership Card (${member.membership_no})`;
  const memberHtml = buildMemberWelcomeEmail(member, settings);

  if (transporter && member.email) {
    try {
      await transporter.sendMail({
        from: settings.smtp_from || 'PureGro <noreply@puregro.com>',
        to: member.email,
        subject: memberSubject,
        html: memberHtml,
      });
      insertEmailLog.run(member.id, member.email, 'MEMBER', memberSubject, 'DELIVERED', memberHtml, null);
      results.memberEmailSent = true;
    } catch (err) {
      console.error('Failed to send member email via SMTP:', err.message);
      insertEmailLog.run(member.id, member.email, 'MEMBER', memberSubject, 'FAILED', memberHtml, err.message);
      results.errors.push(`Member email failed: ${err.message}`);
    }
  } else {
    // Simulator mode (active out-of-the-box)
    insertEmailLog.run(member.id, member.email, 'MEMBER', memberSubject, 'LOCAL_SIMULATOR', memberHtml, null);
    results.memberEmailSent = true;
  }

  // 2. Prepare Administrator Copy
  const adminEmail = settings.admin_email || 'admin@puregro.com';
  const shouldNotifyAdmin = settings.admin_notify_enabled !== 'false';

  if (shouldNotifyAdmin && adminEmail) {
    const adminSubject = `[PureGro Admin Alert] New Member Registered: ${member.full_name} (${member.membership_no})`;
    const adminHtml = buildAdminNotificationEmail(member, settings);

    if (transporter) {
      try {
        await transporter.sendMail({
          from: settings.smtp_from || 'PureGro System <noreply@puregro.com>',
          to: adminEmail,
          subject: adminSubject,
          html: adminHtml,
        });
        insertEmailLog.run(member.id, adminEmail, 'ADMIN', adminSubject, 'DELIVERED', adminHtml, null);
        results.adminEmailSent = true;
      } catch (err) {
        console.error('Failed to send admin email via SMTP:', err.message);
        insertEmailLog.run(member.id, adminEmail, 'ADMIN', adminSubject, 'FAILED', adminHtml, err.message);
        results.errors.push(`Admin email failed: ${err.message}`);
      }
    } else {
      insertEmailLog.run(member.id, adminEmail, 'ADMIN', adminSubject, 'LOCAL_SIMULATOR', adminHtml, null);
      results.adminEmailSent = true;
    }
  }

  return results;
}
