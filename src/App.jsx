import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Mail, Settings, QrCode, 
  ShieldCheck, ArrowUpRight, Filter, ChevronRight, 
  Sparkles, RefreshCw, Eye, CheckCircle2, Clock, 
  Building2, Phone, AlertTriangle, Layers
} from 'lucide-react';

import RegisterMemberModal from './components/RegisterMemberModal';
import QuickLookup from './components/QuickLookup';
import MemberCardModal from './components/MemberCardModal';
import EmailLogsModal from './components/EmailLogsModal';
import SettingsModal from './components/SettingsModal';

export default function App() {
  // Navigation tabs: 'directory' | 'lookup'
  const [activeTab, setActiveTab] = useState('directory');

  // Stats
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    todayMembers: 0,
    totalEmails: 0,
  });

  // Members list
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEmailLogsOpen, setIsEmailLogsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Fetch Members List
  const fetchMembers = async (p = page, search = searchQuery, status = statusFilter) => {
    setLoadingMembers(true);
    try {
      const url = `/api/members?page=${p}&limit=12&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`;
      const res = await fetch(url);
      const data = await res.json();
      setMembers(data.members || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchMembers(1, searchQuery, statusFilter);
  }, []);

  // Handle Search Input
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    setPage(1);
    fetchMembers(1, q, statusFilter);
  };

  // Handle Status Filter Change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
    fetchMembers(1, searchQuery, status);
  };

  // Callback when a new member is created
  const handleMemberCreated = (newMember) => {
    fetchStats();
    fetchMembers(1, '', 'ALL');
    setSearchQuery('');
    setStatusFilter('ALL');
  };

  // Callback when member is updated
  const handleMemberUpdated = (updatedMember) => {
    fetchStats();
    setMembers((prev) =>
      prev.map((m) => (m.id === updatedMember.id ? updatedMember : m))
    );
    if (selectedMember?.id === updatedMember.id) {
      setSelectedMember(updatedMember);
    }
  };

  // Callback when member is deleted
  const handleMemberDeleted = (deletedId) => {
    fetchStats();
    setMembers((prev) => prev.filter((m) => m.id !== deletedId));
    setSelectedMember(null);
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-10 selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-base sm:text-lg text-white font-display">
                  PUREGRO
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Membership Management & ID Verification Portal
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'directory'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Directory & Roster
            </button>
            <button
              onClick={() => setActiveTab('lookup')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'lookup'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Quick Lookup & QR Scanner
            </button>
          </nav>

          {/* Action CTA Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEmailLogsOpen(true)}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition relative"
              title="Dispatched Email Logs"
            >
              <Mail className="w-4 h-4" />
              {stats.totalEmails > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 font-bold text-[9px] rounded-full flex items-center justify-center">
                  {stats.totalEmails > 99 ? '99+' : stats.totalEmails}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition"
              title="Admin Settings & SMTP"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsRegisterOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Register Member</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* KPI Stats Overview */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Total Members */}
          <div className="p-4 rounded-3xl glass-card relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Total Members</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              {stats.totalMembers}
            </p>
            <p className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Registered in system
            </p>
          </div>

          {/* Registered Today */}
          <div className="p-4 rounded-3xl glass-card relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Joined Today</span>
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              +{stats.todayMembers}
            </p>
            <p className="text-[11px] text-teal-400/90 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Today's registrations
            </p>
          </div>

          {/* Active Members */}
          <div className="p-4 rounded-3xl glass-card relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Active Cards</span>
              <div className="p-2 rounded-xl bg-green-500/10 text-green-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              {stats.activeMembers}
            </p>
            <p className="text-[11px] text-green-400/90 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Valid credentials
            </p>
          </div>

          {/* Emails Dispatched */}
          <div 
            onClick={() => setIsEmailLogsOpen(true)}
            className="p-4 rounded-3xl glass-card cursor-pointer hover:border-emerald-400/50 transition relative overflow-hidden group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Emails Sent</span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition">
                <Mail className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              {stats.totalEmails}
            </p>
            <p className="text-[11px] text-cyan-400/90 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Member + Admin copies
            </p>
          </div>

        </section>

        {/* View Switcher Container */}
        {activeTab === 'lookup' ? (
          <QuickLookup
            onSelectMember={(m) => setSelectedMember(m)}
            onRequestNewMember={() => setIsRegisterOpen(true)}
          />
        ) : (
          /* Directory View */
          <div className="space-y-4">
            
            {/* Search & Filter Header Bar */}
            <div className="p-4 rounded-3xl glass-panel flex flex-col md:flex-row items-center justify-between gap-3">
              
              {/* Search Bar */}
              <div className="relative w-full md:max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by name, ID number, email, or member #..."
                  className="w-full px-3.5 py-2.5 pl-10 rounded-2xl bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 text-xs sm:text-sm text-white placeholder:text-slate-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                {['ALL', 'ACTIVE', 'SUSPENDED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusFilterChange(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition shrink-0 ${
                      statusFilter === st
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {st === 'ALL' ? 'All Status' : st}
                  </button>
                ))}

                <button
                  onClick={() => fetchMembers(page, searchQuery, statusFilter)}
                  className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition"
                  title="Refresh table"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingMembers ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Member Cards / Table */}
            {loadingMembers ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-3" />
                <p className="text-xs">Loading member roster...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="py-16 text-center rounded-3xl glass-panel p-6">
                <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">No Members Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  {searchQuery
                    ? `No registered members match "${searchQuery}".`
                    : 'Start registering members to build your PureGro membership directory.'}
                </p>
                <button
                  onClick={() => setIsRegisterOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition"
                >
                  + Register New Member
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMember(m)}
                    className="p-4 rounded-3xl glass-card cursor-pointer border border-emerald-500/15 hover:border-emerald-400/40 flex flex-col justify-between group transition relative"
                  >
                    <div className="flex items-start gap-3.5">
                      {m.photo_url ? (
                        <img
                          src={m.photo_url}
                          alt={m.full_name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/30 shrink-0 group-hover:border-emerald-400 transition"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0">
                          👤
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition">
                            {m.full_name}
                          </h4>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              m.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>

                        <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                          {m.membership_no}
                        </p>

                        <p className="text-[11px] text-slate-400 mt-1 truncate">
                          ID: <strong className="text-slate-300">{m.id_number}</strong>
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {m.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-medium text-emerald-400/80">
                        {m.tier || 'Green Member'}
                      </span>
                      <span className="flex items-center gap-1 group-hover:text-emerald-300 transition text-[10px]">
                        View Card & QR <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => fetchMembers(page - 1, searchQuery, statusFilter)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-400 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => fetchMembers(page + 1, searchQuery, statusFilter)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-emerald-500/20 px-6 py-2 flex items-center justify-between">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            activeTab === 'directory' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Directory</span>
        </button>

        {/* Center Register Floating Button */}
        <button
          onClick={() => setIsRegisterOpen(true)}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold flex items-center justify-center -mt-6 shadow-xl shadow-emerald-500/30 border-4 border-slate-950 active:scale-95 transition"
          title="Register New Member"
        >
          <UserPlus className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('lookup')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            activeTab === 'lookup' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Lookup</span>
        </button>
      </div>

      {/* MODALS */}
      <RegisterMemberModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onMemberCreated={handleMemberCreated}
        onViewMember={(m) => setSelectedMember(m)}
      />

      <MemberCardModal
        member={selectedMember}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        onMemberUpdated={handleMemberUpdated}
        onMemberDeleted={handleMemberDeleted}
      />

      <EmailLogsModal
        isOpen={isEmailLogsOpen}
        onClose={() => setIsEmailLogsOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
