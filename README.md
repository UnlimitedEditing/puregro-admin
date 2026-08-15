# 🌱 PureGro - Membership Management Admin Portal

A modern, mobile-friendly web application designed for **PureGro** administrators to register new members, take live photos on-site, automatically generate unique membership credentials with QR codes, trigger dual email notifications (to both Member and Administrator), and perform instant member lookups and status verifications.

---

## 🚀 Key Features

1. **Mobile-First Admin Experience**:
   - Designed for in-store staff using mobile phones, tablets, or desktop stations.
   - Quick floating registration button and responsive navigation.

2. **On-Site Member Registration & Photo Capture**:
   - Live WebRTC camera viewfinder with Front/Back lens toggle (ideal for phone cameras).
   - Snapshot crop, retake, and local file upload fallback.
   - Required fields: Full Name, National / Official ID Number, Email Address.

3. **Automated Membership Number & QR Generation**:
   - Automatically generates standardized membership numbers: `PG-2026-XXXXX`.
   - Generates high-resolution digital QR codes embedded directly into the pass.

4. **Dual Email Notification Engine**:
   - **Member Welcome Kit**: Sends rich branded PureGro HTML email with digital membership card, perks, and QR code.
   - **Administrator Audit Copy**: Dispatches an instant security & registration audit notice to the admin's email.
   - **Built-in Mailbox Simulator & Live SMTP**: Works out-of-the-box with an in-app email previewer, with full support for live SMTP (Gmail, SendGrid, Brevo, Resend, etc.).

5. **Instant Quick Lookup & Verification**:
   - Search across all fields in real-time: **Membership #**, **National ID #**, **Email Address**, or **Full Name**.
   - Built-in **Camera QR Scanner** to scan physical cards or email passes directly.
   - Shows live validity status (`ACTIVE` / `SUSPENDED`), profile details, and quick resend buttons.

6. **Full Member Management & Audit Logs**:
   - Overview KPI metrics: Total members, registrations today, active passes, and emails dispatched.
   - Member profile modal with **Print Digital Card** capability.
   - Full email audit log with live rendered HTML previewer.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Lucide Icons, Canvas Confetti, HTML5-QRCode
- **Backend**: Node.js, Express, SQLite (`better-sqlite3`), Multer, Nodemailer, QRCode
- **Database**: Local SQLite database with automated indexing and schema migrations.

---

## 🏃 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
Run both backend server (port 3001) and Vite dev server (port 5173):
```bash
npm run dev
```

### 3. Production Build & Start
```bash
npm run build
npm start
```
Then visit: `http://localhost:3001`

---

## 🧪 Testing

Run the automated test suite verifying member creation, duplicate ID protection, lookups, and email logs:
```bash
node test_api.js
```
