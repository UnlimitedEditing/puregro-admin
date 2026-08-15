import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, QrCode, CheckCircle, XCircle, AlertCircle, 
  CreditCard, Mail, User, Phone, Sparkles, Printer, RefreshCw, Eye, X, Camera
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QuickLookup({ onSelectMember, onRequestNewMember }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState(null);

  // QR Scanner State
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [qrScannerError, setQrScannerError] = useState(null);
  const html5QrCodeRef = useRef(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery.trim());
      } else if (searchQuery.trim().length === 0) {
        setSearchResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/members/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
      
      // If there's an exact match, auto-select it
      const exact = data.results?.find((m) => m.isExactMatch);
      if (exact) {
        setSelectedMember(exact);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (member) => {
    setSelectedMember(member);
    if (onSelectMember) {
      onSelectMember(member);
    }
  };

  // Resend email
  const handleResendEmail = async (memberId) => {
    setResendingEmail(true);
    setEmailNotice(null);
    try {
      const res = await fetch(`/api/members/${memberId}/resend-email`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setEmailNotice('✓ Welcome email and admin copy resent successfully!');
      } else {
        setEmailNotice('Failed to resend: ' + (data.error || 'Server error'));
      }
    } catch (err) {
      setEmailNotice('Failed to resend email: ' + err.message);
    } finally {
      setResendingEmail(false);
    }
  };

  // Toggle QR Scanner
  const startQrScanner = async () => {
    setIsScanningQR(true);
    setQrScannerError(null);

    // Give DOM time to mount #qr-reader element
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader-container');
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          },
          (decodedText) => {
            handleQrDecoded(decodedText);
          },
          (error) => {
            // Ignore frame-by-frame read failures
          }
        );
      } catch (err) {
        console.error('QR Scanner init error:', err);
        setQrScannerError('Could not access camera for QR scanning. Ensure camera permissions are granted.');
      }
    }, 200);
  };

  const stopQrScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping QR scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanningQR(false);
  };

  const handleQrDecoded = (decodedText) => {
    stopQrScanner();
    try {
      // Check if it's JSON from PureGro QR payload
      const parsed = JSON.parse(decodedText);
      if (parsed.member_no) {
        setSearchQuery(parsed.member_no);
        performSearch(parsed.member_no);
        return;
      }
      if (parsed.id_no) {
        setSearchQuery(parsed.id_no);
        performSearch(parsed.id_no);
        return;
      }
    } catch (e) {
      // Raw string query
      setSearchQuery(decodedText);
      performSearch(decodedText);
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* Search Header Bar */}
      <div className="p-4 sm:p-6 rounded-3xl glass-panel border border-emerald-500/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-400" />
              Quick Member Lookup & Verification
            </h2>
            <p className="text-xs text-slate-400">
              Instantly verify profile by <strong>Membership #</strong>, <strong>ID #</strong>, <strong>Email</strong>, or <strong>Name</strong>.
            </p>
          </div>

          <button
            onClick={() => (isScanningQR ? stopQrScanner() : startQrScanner())}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition ${
              isScanningQR
                ? 'bg-rose-900/60 border-rose-700 text-rose-200'
                : 'bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-500/40 text-emerald-300 shadow-md'
            }`}
          >
            <QrCode className="w-4 h-4" />
            {isScanningQR ? 'Close QR Scanner' : 'Scan Member QR'}
          </button>
        </div>

        {/* QR Scanner Container */}
        {isScanningQR && (
          <div className="mb-4 p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 flex flex-col items-center">
            <div className="w-full max-w-sm overflow-hidden rounded-xl bg-black relative">
              <div id="qr-reader-container" className="w-full" />
            </div>
            {qrScannerError && (
              <p className="text-xs text-rose-400 mt-2">{qrScannerError}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-2">
              Point camera at member badge or email QR code to verify
            </p>
          </div>
        )}

        {/* Input Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type Membership # (e.g. PG-2026-...), National ID #, or Email..."
            className="w-full px-4 py-3.5 pl-11 pr-10 rounded-2xl bg-slate-950/90 border border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 text-sm sm:text-base text-white placeholder:text-slate-500 transition shadow-inner"
          />
          <Search className="w-5 h-5 text-emerald-400 absolute left-3.5 top-3.5" />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setSelectedMember(null);
              }}
              className="absolute right-3.5 top-3.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] text-slate-500 font-medium">Quick search examples:</span>
          {['PG-2026-00841', 'ID-98420148', 'elena.vance@example.com'].map((sample) => (
            <button
              key={sample}
              onClick={() => {
                setSearchQuery(sample);
                performSearch(sample);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-950 text-slate-400 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/30 text-[11px] font-mono transition"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH RESULTS & ACTIVE MEMBER CARD */}
      {isSearching ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-3" />
          <p className="text-xs">Searching member records across database...</p>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* List of matches */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Matching Profiles ({searchResults.length})
              </span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {searchResults.map((m) => {
                const isSelected = selectedMember?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelect(m)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition border ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-400/60 shadow-lg shadow-emerald-950/40'
                        : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {m.photo_url ? (
                        <img
                          src={m.photo_url}
                          alt={m.full_name}
                          className="w-12 h-12 rounded-xl object-cover border border-emerald-500/40 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl text-slate-400 shrink-0">
                          👤
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white truncate">{m.full_name}</h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                              m.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>
                        <p className="text-xs font-mono font-semibold text-emerald-400 mt-0.5">
                          {m.membership_no}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          ID: {m.id_number} • {m.email}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Verification Card */}
          <div className="lg:col-span-7">
            {selectedMember ? (
              <div className="p-6 rounded-3xl glass-panel border border-emerald-500/30 shadow-2xl space-y-5">
                
                {/* Verification Badge Header */}
                <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                        Verified Profile
                      </span>
                      <h3 className="text-lg font-extrabold text-white">
                        {selectedMember.full_name}
                      </h3>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {selectedMember.tier || 'Green Member'}
                  </span>
                </div>

                {/* Digital Card Preview */}
                <div className="p-5 rounded-2xl membership-card-gradient border border-emerald-400/30 shadow-xl text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-300 tracking-wider">
                        PUREGRO OFFICIAL MEMBER
                      </span>
                      <p className="text-lg font-mono font-extrabold text-white mt-1">
                        {selectedMember.membership_no}
                      </p>
                    </div>
                    {selectedMember.qr_code && (
                      <img
                        src={selectedMember.qr_code}
                        alt="QR"
                        className="w-16 h-16 bg-white p-1 rounded-xl shadow-md shrink-0"
                      />
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    {selectedMember.photo_url ? (
                      <img
                        src={selectedMember.photo_url}
                        alt={selectedMember.full_name}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-400/60 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-2xl">
                        👤
                      </div>
                    )}
                    <div className="space-y-0.5 text-xs text-slate-200">
                      <p><span className="text-emerald-300 font-medium">National ID:</span> <strong>{selectedMember.id_number}</strong></p>
                      <p><span className="text-emerald-300 font-medium">Email:</span> {selectedMember.email}</p>
                      <p><span className="text-emerald-300 font-medium">Phone:</span> {selectedMember.phone || 'None'}</p>
                      <p><span className="text-emerald-300 font-medium">Enrolled:</span> {new Date(selectedMember.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {emailNotice && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{emailNotice}</span>
                  </div>
                )}

                {/* Profile Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() => handleResendEmail(selectedMember.id)}
                    disabled={resendingEmail}
                    className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resendingEmail ? 'animate-spin' : ''}`} />
                    {resendingEmail ? 'Resending...' : 'Resend Welcome Email'}
                  </button>

                  <button
                    onClick={() => {
                      if (onSelectMember) onSelectMember(selectedMember);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> Full Member Card / Print
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : searchQuery.trim().length >= 2 ? (
        <div className="p-8 rounded-3xl glass-panel border border-slate-800 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <XCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Member Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            No profile matches "{searchQuery}". You can register them as a new member with ID number.
          </p>
          {onRequestNewMember && (
            <button
              onClick={onRequestNewMember}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
            >
              + Register New Member
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
