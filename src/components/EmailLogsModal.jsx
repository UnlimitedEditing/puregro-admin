import React, { useState, useEffect } from 'react';
import { Mail, X, RefreshCw, Eye, CheckCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';

export default function EmailLogsModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPreviewHtml, setSelectedPreviewHtml] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/emails');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching email logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950/90 to-slate-900 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Email Dispatch & Notification Audit Log
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {logs.length} Sent
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Track Member Welcome Kits & Administrator Registration Notices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Mail className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm">No emails sent yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Register a new member to trigger welcome and admin emails!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const isDelivered = log.status === 'DELIVERED';
                const isSimulator = log.status === 'LOCAL_SIMULATOR';

                return (
                  <div
                    key={log.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            log.recipient_type === 'MEMBER'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          }`}
                        >
                          {log.recipient_type === 'MEMBER' ? 'Member Welcome' : 'Admin Audit Copy'}
                        </span>

                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                            isDelivered
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : isSimulator
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {isDelivered
                            ? 'Delivered (SMTP)'
                            : isSimulator
                            ? 'Dispatched (Mailbox Simulator)'
                            : 'Failed'}
                        </span>

                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.sent_at).toLocaleString()}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-white truncate">
                        {log.subject}
                      </h4>

                      <p className="text-xs text-slate-400 truncate">
                        To: <span className="text-slate-200 font-mono">{log.recipient}</span>
                        {log.member_name && (
                          <span> • Member: <strong className="text-emerald-400">{log.member_name}</strong> ({log.membership_no})</span>
                        )}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPreviewHtml(log.preview_html);
                        setSelectedSubject(log.subject);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-900/60 text-slate-200 hover:text-emerald-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 hover:border-emerald-500/40 transition shrink-0 self-start sm:self-center"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview HTML Email
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* HTML Email Preview Modal */}
      {selectedPreviewHtml && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="min-w-0 pr-4">
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Rendered Email Preview</span>
                <p className="text-xs font-semibold text-slate-200 truncate">{selectedSubject}</p>
              </div>
              <button
                onClick={() => setSelectedPreviewHtml(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe
              srcDoc={selectedPreviewHtml}
              title="Email Preview"
              className="w-full flex-1 border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
