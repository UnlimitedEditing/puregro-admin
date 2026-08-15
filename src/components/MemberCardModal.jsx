import React, { useState } from 'react';
import { 
  X, Printer, Mail, QrCode, ShieldCheck, Phone, 
  Calendar, UserCheck, AlertTriangle, RefreshCw, Trash2, Check 
} from 'lucide-react';

export default function MemberCardModal({ member, isOpen, onClose, onMemberUpdated, onMemberDeleted }) {
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  if (!isOpen || !member) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleResend = async () => {
    setResending(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/members/${member.id}/resend-email`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setNotice({ type: 'success', msg: '✓ Welcome email and admin copy resent successfully!' });
      } else {
        setNotice({ type: 'error', msg: data.error || 'Failed to resend' });
      }
    } catch (err) {
      setNotice({ type: 'error', msg: err.message });
    } finally {
      setResending(false);
    }
  };

  const toggleStatus = async () => {
    setStatusLoading(true);
    const newStatus = member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && onMemberUpdated) {
        onMemberUpdated(data.member);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete member profile for "${member.full_name}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/members/${member.id}`, { method: 'DELETE' });
      if (res.ok) {
        if (onMemberDeleted) onMemberDeleted(member.id);
        onClose();
      }
    } catch (err) {
      console.error('Error deleting member:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950/90 to-slate-900 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
              Member Profile
            </span>
            <span className="text-xs text-slate-400 font-mono">
              #{member.membership_no}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {notice && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                notice.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
              }`}
            >
              {notice.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{notice.msg}</span>
            </div>
          )}

          {/* Printable Member Card */}
          <div
            id="printable-member-card"
            className="p-6 rounded-3xl membership-card-gradient border border-emerald-400/40 shadow-2xl text-white relative overflow-hidden"
          >
            {/* Watermark Logo */}
            <div className="absolute right-4 bottom-2 text-7xl font-black text-emerald-500/5 select-none pointer-events-none">
              PUREGRO
            </div>

            <div className="flex items-start justify-between border-b border-emerald-500/20 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-widest text-emerald-300">
                    PUREGRO CLUB
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 uppercase">
                    {member.tier || 'Standard'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/70 mt-0.5">
                  Official Membership & Verification Credential
                </p>
              </div>

              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  member.status === 'ACTIVE'
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                    : 'bg-rose-500/30 text-rose-300 border border-rose-400/40'
                }`}
              >
                {member.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              {/* Photo */}
              <div className="sm:col-span-4 flex flex-col items-center">
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt={member.full_name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-emerald-400/60 shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-4xl shadow-inner">
                    👤
                  </div>
                )}
                <span className="text-[10px] text-emerald-300/80 mt-1.5 font-mono">
                  VERIFIED PHOTO
                </span>
              </div>

              {/* Details */}
              <div className="sm:col-span-5 space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-emerald-300/80 uppercase font-semibold">Member Name</span>
                  <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                    {member.full_name}
                  </h3>
                </div>

                <div>
                  <span className="text-[10px] text-emerald-300/80 uppercase font-semibold">Membership Number</span>
                  <p className="font-mono text-sm font-bold text-emerald-300 tracking-wider">
                    💳 {member.membership_no}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-emerald-300/80 uppercase font-semibold">National ID Number</span>
                  <p className="font-semibold text-white">
                    {member.id_number}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-emerald-300/80 uppercase font-semibold">Registered Email</span>
                  <p className="text-slate-200 truncate">
                    {member.email}
                  </p>
                </div>
              </div>

              {/* QR Code */}
              <div className="sm:col-span-3 flex flex-col items-center justify-center">
                {member.qr_code ? (
                  <img
                    src={member.qr_code}
                    alt="Member QR"
                    className="w-20 h-20 bg-white p-1 rounded-xl shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-slate-900/60 rounded-xl border border-dashed border-emerald-500/40 flex items-center justify-center text-slate-500 text-xs">
                    No QR
                  </div>
                )}
                <span className="text-[9px] text-emerald-300/70 mt-1 font-mono">
                  Scan to Verify
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-[10px] text-emerald-200/70">
              <span>Member Since: {new Date(member.created_at).toLocaleDateString()}</span>
              <span>PureGro Farm & Organics Security Pass</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition"
              >
                <Printer className="w-4 h-4" /> Print Digital Card
              </button>

              <button
                onClick={handleResend}
                disabled={resending}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-medium text-xs flex items-center gap-1.5 border border-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'Sending...' : 'Resend Email'}
              </button>

              <button
                onClick={toggleStatus}
                disabled={statusLoading}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                  member.status === 'ACTIVE'
                    ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-800/40'
                    : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/40'
                }`}
              >
                {member.status === 'ACTIVE' ? 'Suspend Member' : 'Activate Member'}
              </button>
            </div>

            <button
              onClick={handleDelete}
              className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium border border-rose-800/40 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
