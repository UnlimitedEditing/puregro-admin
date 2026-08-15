import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import multer from 'multer';
import { initDB, getDB } from './db.js';
import { sendMemberWelcomeEmails, createTransporter, getMailerConfig } from './services/mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB
initDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer storage for uploaded files if multipart form is used
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `member-${Date.now()}-${Math.round(Math.random() * 1e5)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Helper: Generate unique membership number
function generateMembershipNumber() {
  const db = getDB();
  const year = new Date().getFullYear();
  const settings = getMailerConfig();
  const prefix = settings.membership_prefix || 'PG';
  
  // Find highest existing number or random sequential
  let uniqueFound = false;
  let code = '';
  let attempts = 0;

  while (!uniqueFound && attempts < 100) {
    attempts++;
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    code = `${prefix}-${year}-${randomSuffix}`;
    const existing = db.prepare('SELECT id FROM members WHERE membership_no = ?').get(code);
    if (!existing) {
      uniqueFound = true;
    }
  }

  return code;
}

// Helper: Save Base64 image to disk
function saveBase64Image(base64Data) {
  if (!base64Data) return null;
  if (base64Data.startsWith('http://') || base64Data.startsWith('https://') || base64Data.startsWith('/uploads/')) {
    return base64Data;
  }

  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }
    const extension = matches[1].split('/')[1] || 'jpg';
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `photo-${Date.now()}-${Math.round(Math.random() * 1e5)}.${extension}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Error saving base64 photo:', err);
    return null;
  }
}

// ==========================================
// ROUTES: MEMBERS
// ==========================================

// Quick Lookup & Search API
app.get('/api/members/search', (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) {
    return res.json({ results: [] });
  }

  const db = getDB();
  // Exact match gets highest priority, followed by partial matches
  const exactMatch = db.prepare(`
    SELECT * FROM members 
    WHERE UPPER(membership_no) = UPPER(?) 
       OR UPPER(id_number) = UPPER(?) 
       OR UPPER(email) = UPPER(?)
    LIMIT 1
  `).get(query, query, query);

  const partialMatches = db.prepare(`
    SELECT * FROM members 
    WHERE (membership_no LIKE ? OR id_number LIKE ? OR email LIKE ? OR full_name LIKE ?)
    ORDER BY created_at DESC 
    LIMIT 20
  `).all(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);

  // Merge results without duplicates
  const results = [];
  const seenIds = new Set();

  if (exactMatch) {
    results.push({ ...exactMatch, isExactMatch: true });
    seenIds.add(exactMatch.id);
  }

  partialMatches.forEach(m => {
    if (!seenIds.has(m.id)) {
      results.push({ ...m, isExactMatch: false });
      seenIds.add(m.id);
    }
  });

  res.json({ results, query });
});

// List all members with filtering & pagination
app.get('/api/members', (req, res) => {
  const db = getDB();
  const search = (req.query.search || '').trim();
  const status = (req.query.status || '').trim();
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const offset = (page - 1) * limit;

  let queryStr = 'SELECT * FROM members WHERE 1=1';
  let countStr = 'SELECT COUNT(*) as count FROM members WHERE 1=1';
  const params = [];
  const countParams = [];

  if (search) {
    queryStr += ' AND (full_name LIKE ? OR id_number LIKE ? OR email LIKE ? OR membership_no LIKE ?)';
    countStr += ' AND (full_name LIKE ? OR id_number LIKE ? OR email LIKE ? OR membership_no LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status && status !== 'ALL') {
    queryStr += ' AND status = ?';
    countStr += ' AND status = ?';
    params.push(status);
    countParams.push(status);
  }

  queryStr += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const members = db.prepare(queryStr).all(...params);
  const total = db.prepare(countStr).get(...countParams).count;

  res.json({
    members,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

// Get single member profile
app.get('/api/members/:id', (req, res) => {
  const db = getDB();
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const emails = db.prepare('SELECT * FROM email_logs WHERE member_id = ? ORDER BY sent_at DESC').all(req.params.id);
  res.json({ member, emails });
});

// Register new member
app.post('/api/members', upload.single('photoFile'), async (req, res) => {
  const db = getDB();
  const { full_name, id_number, email, phone, photo, tier, notes } = req.body;

  // Validation
  if (!full_name || !full_name.trim()) {
    return res.status(400).json({ error: 'Member full name is required' });
  }
  if (!id_number || !id_number.trim()) {
    return res.status(400).json({ error: 'ID number is required' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  // Check for duplicate ID Number
  const existingId = db.prepare('SELECT id, full_name, membership_no FROM members WHERE UPPER(id_number) = UPPER(?)').get(id_number.trim());
  if (existingId) {
    return res.status(409).json({
      error: `ID Number "${id_number}" is already registered to ${existingId.full_name} (${existingId.membership_no}).`,
      existingMember: existingId,
    });
  }

  // Handle Photo
  let photoUrl = null;
  if (req.file) {
    photoUrl = `/uploads/${req.file.filename}`;
  } else if (photo) {
    photoUrl = saveBase64Image(photo);
  }

  // Generate Unique Membership Number
  const membershipNo = generateMembershipNumber();

  // Generate QR Code data URL
  let qrCodeDataUrl = '';
  try {
    const qrPayload = JSON.stringify({
      org: 'PureGro',
      member_no: membershipNo,
      id_no: id_number.trim(),
      name: full_name.trim(),
      verified_url: `https://puregro.com/verify?m=${encodeURIComponent(membershipNo)}`
    });
    qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 250,
      margin: 2,
      color: {
        dark: '#064e3b',
        light: '#ffffff'
      }
    });
  } catch (qrErr) {
    console.error('QR generation error:', qrErr);
  }

  try {
    const insert = db.prepare(`
      INSERT INTO members (membership_no, full_name, id_number, email, phone, photo_url, qr_code, status, tier, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
    `);

    const result = insert.run(
      membershipNo,
      full_name.trim(),
      id_number.trim(),
      email.trim(),
      phone ? phone.trim() : null,
      photoUrl,
      qrCodeDataUrl,
      tier || 'Green Member',
      notes ? notes.trim() : null
    );

    const newMember = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);

    // Send emails asynchronously
    sendMemberWelcomeEmails(newMember).catch(err => console.error('Error dispatching emails:', err));

    res.status(201).json({
      success: true,
      message: 'Member registered successfully!',
      member: newMember,
    });
  } catch (err) {
    console.error('Error creating member:', err);
    res.status(500).json({ error: 'Failed to create member record: ' + err.message });
  }
});

// Update member
app.put('/api/members/:id', (req, res) => {
  const db = getDB();
  const { full_name, email, phone, status, tier, notes } = req.body;
  const memberId = req.params.id;

  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
  if (!existing) {
    return res.status(404).json({ error: 'Member not found' });
  }

  try {
    db.prepare(`
      UPDATE members 
      SET full_name = COALESCE(?, full_name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          status = COALESCE(?, status),
          tier = COALESCE(?, tier),
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(full_name, email, phone, status, tier, notes, memberId);

    const updated = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    res.json({ success: true, member: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update member: ' + err.message });
  }
});

// Delete member
app.delete('/api/members/:id', (req, res) => {
  const db = getDB();
  const result = db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Member not found' });
  }
  res.json({ success: true, message: 'Member deleted' });
});

// Resend emails for a member
app.post('/api/members/:id/resend-email', async (req, res) => {
  const db = getDB();
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  try {
    const result = await sendMemberWelcomeEmails(member);
    res.json({ success: true, message: 'Emails resent successfully', result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend email: ' + err.message });
  }
});

// ==========================================
// ROUTES: STATS & DASHBOARD
// ==========================================
app.get('/api/stats', (req, res) => {
  const db = getDB();
  const totalMembers = db.prepare('SELECT COUNT(*) as count FROM members').get().count;
  const activeMembers = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'ACTIVE'").get().count;
  const todayMembers = db.prepare(`
    SELECT COUNT(*) as count FROM members 
    WHERE date(created_at) = date('now')
  `).get().count;
  const totalEmails = db.prepare('SELECT COUNT(*) as count FROM email_logs').get().count;
  const recentMembers = db.prepare('SELECT * FROM members ORDER BY created_at DESC LIMIT 5').all();

  res.json({
    totalMembers,
    activeMembers,
    todayMembers,
    totalEmails,
    recentMembers,
  });
});

// ==========================================
// ROUTES: EMAILS AUDIT LOG
// ==========================================
app.get('/api/emails', (req, res) => {
  const db = getDB();
  const logs = db.prepare(`
    SELECT e.*, m.full_name as member_name, m.membership_no
    FROM email_logs e
    LEFT JOIN members m ON e.member_id = m.id
    ORDER BY e.sent_at DESC
    LIMIT 50
  `).all();
  res.json({ logs });
});

app.get('/api/emails/:id/preview', (req, res) => {
  const db = getDB();
  const log = db.prepare('SELECT * FROM email_logs WHERE id = ?').get(req.params.id);
  if (!log || !log.preview_html) {
    return res.status(404).send('<h3>No preview found</h3>');
  }
  res.setHeader('Content-Type', 'text/html');
  res.send(log.preview_html);
});

// ==========================================
// ROUTES: SETTINGS & SMTP TEST
// ==========================================
app.get('/api/settings', (req, res) => {
  const db = getDB();
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(r => settings[r.key] = r.value);
  res.json({ settings });
});

app.post('/api/settings', (req, res) => {
  const db = getDB();
  const settings = req.body;
  const update = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

  const transaction = db.transaction((data) => {
    for (const [key, value] of Object.entries(data)) {
      update.run(key, String(value ?? ''));
    }
  });

  try {
    transaction(settings);
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings: ' + err.message });
  }
});

app.post('/api/settings/test-smtp', async (req, res) => {
  const settings = req.body;
  const transporter = createTransporter(settings);

  if (!transporter) {
    return res.status(400).json({ error: 'Please provide valid SMTP Host, User, and Password.' });
  }

  try {
    await transporter.verify();
    res.json({ success: true, message: 'SMTP connection verified successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'SMTP verification failed: ' + err.message });
  }
});

// Serve frontend if built
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🌿 PureGro Server running on http://localhost:${PORT}`);
});
