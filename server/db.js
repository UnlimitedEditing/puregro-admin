import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'puregro.db');
const db = new Database(dbPath);

// Enable WAL mode for concurrency and speed
db.pragma('journal_mode = WAL');

// Initialize schema
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membership_no TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      id_number TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      photo_url TEXT,
      qr_code TEXT,
      status TEXT DEFAULT 'ACTIVE',
      tier TEXT DEFAULT 'Green Member',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_members_membership_no ON members(membership_no);
    CREATE INDEX IF NOT EXISTS idx_members_id_number ON members(id_number);
    CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER,
      recipient TEXT NOT NULL,
      recipient_type TEXT NOT NULL, -- 'MEMBER' or 'ADMIN'
      subject TEXT NOT NULL,
      status TEXT NOT NULL, -- 'DELIVERED', 'LOCAL_SIMULATOR', 'FAILED'
      preview_html TEXT,
      error_message TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
    );
  `);

  // Default settings
  const defaultSettings = [
    { key: 'admin_email', value: 'admin@puregro.com' },
    { key: 'admin_notify_enabled', value: 'true' },
    { key: 'company_name', value: 'PureGro Farm & Organics' },
    { key: 'company_phone', value: '+1 (800) 555-PURE' },
    { key: 'company_address', value: '742 Evergreen Orchard Way, Green Valley' },
    { key: 'membership_prefix', value: 'PG' },
    { key: 'smtp_host', value: '' },
    { key: 'smtp_port', value: '587' },
    { key: 'smtp_user', value: '' },
    { key: 'smtp_pass', value: '' },
    { key: 'smtp_secure', value: 'false' },
    { key: 'smtp_from', value: 'PureGro Club <welcome@puregro.com>' },
  ];

  const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');

  defaultSettings.forEach(({ key, value }) => {
    insertSetting.run(key, value);
  });

  // Check if we need seed data
  const count = db.prepare('SELECT COUNT(*) as count FROM members').get().count;
  if (count === 0) {
    const insertMember = db.prepare(`
      INSERT INTO members (membership_no, full_name, id_number, email, phone, photo_url, qr_code, status, tier, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleMembers = [
      {
        membership_no: 'PG-2026-00841',
        full_name: 'Elena Vance-Rodriguez',
        id_number: 'ID-98420148',
        email: 'elena.vance@example.com',
        phone: '+1 (555) 234-8901',
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        qr_code: '',
        status: 'ACTIVE',
        tier: 'Platinum Green',
        notes: 'Co-op pioneer member & organic farm subscriber'
      },
      {
        membership_no: 'PG-2026-00912',
        full_name: 'Marcus Chen',
        id_number: 'ID-87291034',
        email: 'marcus.chen@example.com',
        phone: '+1 (555) 489-1029',
        photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        qr_code: '',
        status: 'ACTIVE',
        tier: 'Gold Green',
        notes: 'Enrolled via in-store registration'
      },
      {
        membership_no: 'PG-2026-01045',
        full_name: 'Amara Okafor',
        id_number: 'ID-66381920',
        email: 'amara.okafor@example.com',
        phone: '+1 (555) 901-3847',
        photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
        qr_code: '',
        status: 'ACTIVE',
        tier: 'Green Member',
        notes: 'Eco loyalty points active'
      }
    ];

    sampleMembers.forEach(m => {
      insertMember.run(
        m.membership_no,
        m.full_name,
        m.id_number,
        m.email,
        m.phone,
        m.photo_url,
        m.qr_code,
        m.status,
        m.tier,
        m.notes
      );
    });
  }

  console.log('✅ SQLite Database initialized at:', dbPath);
}

export function getDB() {
  return db;
}
