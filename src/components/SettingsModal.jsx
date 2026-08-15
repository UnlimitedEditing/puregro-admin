import React, { useState, useEffect } from 'react';
import { Settings, X, Save, Check, AlertCircle, Mail, Building, Key, ShieldCheck, Send } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    admin_email: 'admin@puregro.com',
    admin_notify_enabled: 'true',
    company_name: 'PureGro Farm & Organics',
    company_phone: '+1 (800) 555-PURE',
    company_address: '742 Evergreen Orchard Way, Green Valley',
    membership_prefix: 'PG',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    smtp_secure: 'false',
    smtp_from: 'PureGro Club <welcome@puregro.com>',
  });
  const [loading, setLoading] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
      setMessage(null);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 'true' : 'false') : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: '✓ Settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: '✓ SMTP connection verified successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'SMTP test failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'SMTP test error: ' + err.message });
    } finally {
      setTestingSmtp(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950/90 to-slate-900 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Admin & Email Notification Settings
              </h2>
              <p className="text-xs text-slate-400">
                Configure notifications, store details, and live SMTP mail delivery
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
              }`}
            >
              {message.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Section 1: Administrator Alerts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Mail className="w-4 h-4" />
              <span>Administrator Audit & Alerts</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Administrator Notification Email
                </label>
                <input
                  type="email"
                  name="admin_email"
                  value={settings.admin_email}
                  onChange={handleChange}
                  placeholder="admin@puregro.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-white"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Receives an audit copy whenever a new member is registered.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Membership Code Prefix
                </label>
                <input
                  type="text"
                  name="membership_prefix"
                  value={settings.membership_prefix}
                  onChange={handleChange}
                  placeholder="PG"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-white"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Format: {settings.membership_prefix || 'PG'}-2026-XXXXX
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Store / Company Info */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Building className="w-4 h-4" />
              <span>Company & Branding Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={settings.company_name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Support Phone
                </label>
                <input
                  type="text"
                  name="company_phone"
                  value={settings.company_phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Live SMTP Credentials */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Key className="w-4 h-4" />
                <span>Live SMTP Mail Server (Optional)</span>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                Leave blank to use In-App Mail Simulator
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  SMTP Host
                </label>
                <input
                  type="text"
                  name="smtp_host"
                  value={settings.smtp_host}
                  onChange={handleChange}
                  placeholder="smtp.gmail.com / smtp.sendgrid.net"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Port
                </label>
                <input
                  type="text"
                  name="smtp_port"
                  value={settings.smtp_port}
                  onChange={handleChange}
                  placeholder="587"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  SMTP Username / Email
                </label>
                <input
                  type="text"
                  name="smtp_user"
                  value={settings.smtp_user}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSettings((prev) => ({
                      ...prev,
                      smtp_user: val,
                      smtp_host: !prev.smtp_host && val.endsWith('@gmail.com') ? 'smtp.gmail.com' : prev.smtp_host,
                    }));
                  }}
                  placeholder="username@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  SMTP Password / App Password
                </label>
                <input
                  type="password"
                  name="smtp_pass"
                  value={settings.smtp_pass}
                  onChange={handleChange}
                  placeholder="16-char App Password"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  From Address
                </label>
                <input
                  type="text"
                  name="smtp_from"
                  value={settings.smtp_from}
                  onChange={handleChange}
                  placeholder="PureGro <welcome@puregro.com>"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-white"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300/90 leading-relaxed">
              💡 <strong>Using Gmail?</strong> Google requires a <strong>16-character App Password</strong> (not your standard Google account login password). You can generate one at: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline font-bold text-white hover:text-emerald-200">myaccount.google.com/apppasswords</a>.
            </div>

            {settings.smtp_host && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={testingSmtp}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  {testingSmtp ? 'Testing connection...' : 'Test SMTP Connection'}
                </button>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
