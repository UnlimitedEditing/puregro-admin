import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, UserPlus, Mail, CreditCard, ShieldCheck, Phone, 
  Sparkles, CheckCircle2, AlertCircle, ArrowRight, Printer, Eye 
} from 'lucide-react';
import CameraCapture from './CameraCapture';

export default function RegisterMemberModal({ isOpen, onClose, onMemberCreated, onViewMember }) {
  const [formData, setFormData] = useState({
    full_name: '',
    id_number: '',
    email: '',
    phone: '',
    tier: 'Green Member',
    notes: '',
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registeredMember, setRegisteredMember] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoCaptured = (dataUrl) => {
    setPhoto(dataUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Form validation
    if (!formData.full_name.trim()) {
      setError('Please provide the member\'s full name.');
      return;
    }
    if (!formData.id_number.trim()) {
      setError('Please enter the national/official ID number.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        photo: photo,
      };

      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register member');
      }

      // Success
      setRegisteredMember(data.member);
      if (onMemberCreated) {
        onMemberCreated(data.member);
      }

      // Trigger Confetti Effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#059669', '#a7f3d0']
        });
      } catch (err) {
        // Confetti is decorative
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      id_number: '',
      email: '',
      phone: '',
      tier: 'Green Member',
      notes: '',
    });
    setPhoto(null);
    setRegisteredMember(null);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/20 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-slate-900 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                New Member Registration
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  PureGro Club
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate membership number, capture ID photo & trigger welcome emails
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {registeredMember ? (
            /* SUCCESS STATE */
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <h3 className="text-xl font-bold text-white">Membership Generated Successfully!</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-md">
                A welcome packet with digital card was emailed to <span className="text-emerald-400 font-medium">{registeredMember.email}</span>, and an audit copy was sent to the administrator.
              </p>

              {/* Digital Card Preview Box */}
              <div className="w-full max-w-md mt-6 p-5 rounded-2xl membership-card-gradient border border-emerald-400/30 shadow-xl text-left">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3 mb-3">
                  <span className="font-extrabold text-emerald-300 tracking-wider text-sm">PUREGRO CLUB PASS</span>
                  <span className="text-[11px] font-bold bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                    {registeredMember.tier}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {registeredMember.photo_url ? (
                    <img
                      src={registeredMember.photo_url}
                      alt={registeredMember.full_name}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-400/50 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center text-2xl text-emerald-300">
                      👤
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-bold text-white truncate">{registeredMember.full_name}</h4>
                    <p className="text-sm font-mono font-bold text-emerald-400 tracking-wide mt-0.5">
                      💳 {registeredMember.membership_no}
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      National ID: <strong className="text-white">{registeredMember.id_number}</strong>
                    </p>
                  </div>

                  {registeredMember.qr_code && (
                    <img
                      src={registeredMember.qr_code}
                      alt="QR Code"
                      className="w-14 h-14 bg-white p-1 rounded-lg shrink-0 hidden sm:block"
                    />
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-200/80">
                  <span>Status: <strong className="text-emerald-400">ACTIVE</strong></span>
                  <span>Issued: {new Date(registeredMember.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6 w-full max-w-md">
                <button
                  onClick={() => {
                    if (onViewMember) onViewMember(registeredMember);
                    handleClose();
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30 transition"
                >
                  <Eye className="w-4 h-4" /> View Full Profile
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
                >
                  <UserPlus className="w-4 h-4" /> Register Another
                </button>
              </div>
            </div>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                
                {/* Left Column: Photo capture */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-300 mb-2.5">Member Portrait Photo</span>
                  <CameraCapture onPhotoCaptured={handlePhotoCaptured} />
                </div>

                {/* Right Column: Member Details */}
                <div className="md:col-span-7 space-y-3.5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Full Name <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="e.g. Maya Lin-Harrison"
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder:text-slate-500 transition"
                    />
                  </div>

                  {/* ID Number */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      National / Official ID Number <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="id_number"
                        value={formData.id_number}
                        onChange={handleChange}
                        placeholder="e.g. ID-89420194 or 9208155029"
                        required
                        className="w-full px-3.5 py-2 pl-9 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder:text-slate-500 transition"
                      />
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Unique ID required. System will automatically generate a PureGro Membership Number.
                    </p>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="member@example.com"
                        required
                        className="w-full px-3.5 py-2 pl-9 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder:text-slate-500 transition"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                    <p className="text-[10px] text-emerald-400/80 mt-0.5">
                      ✓ Welcome email & digital card will be sent to this address
                    </p>
                  </div>

                  {/* Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-3 py-2 pl-8 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-emerald-500 text-xs text-white placeholder:text-slate-500"
                        />
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Membership Tier
                      </label>
                      <select
                        name="tier"
                        value={formData.tier}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-emerald-500 text-xs text-white"
                      >
                        <option value="Green Member">Green Member</option>
                        <option value="Gold Green">Gold Green (VIP)</option>
                        <option value="Platinum Green">Platinum Green (Executive)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition transform active:scale-95"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing & Sending Emails...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      Register Member & Generate ID
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
