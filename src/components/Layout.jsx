import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import FeedbackButton from '@/components/feedback/FeedbackButton';
import GlobalSearch from '@/components/search/GlobalSearch';
import {
  LayoutDashboard, Building2, FileStack, ListTodo, FileBarChart, Settings,
  ChevronLeft, ChevronRight, LogOut, Shield, Menu, Bell, HelpCircle, GitBranch, ShieldCheck
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  // WORK section
  { label: 'WORK' },
  { name: 'Clients', icon: Building2, page: 'Clients' },
  { name: 'Engagements', icon: FileStack, page: 'Engagements' },
  { name: 'Tasks', icon: ListTodo, page: 'Tasks' },
  { name: 'Reports', icon: FileBarChart, page: 'Reports' },
  // TESTING section
  { label: 'TESTING' },
  { name: 'Test Cycles', icon: Shield, page: 'TestCycles' },
  { name: 'Control Tests', icon: Shield, page: 'ControlTests' },
  { name: 'Reviewer', icon: Shield, page: 'ReviewerDashboard' },
  // ISSUES section
  { label: 'ISSUES' },
  { name: 'Findings', icon: Shield, page: 'Findings' },
  { name: 'Remediation Actions', icon: Shield, page: 'RemediationActions' },
  // GOVERNANCE section
  { label: 'GOVERNANCE' },
  { name: 'Admin', icon: Settings, page: 'Admin' },
  { name: 'ChangeLog', icon: GitBranch, page: 'ChangeLog', adminOnly: true },
  { name: 'Build Verification', icon: ShieldCheck, page: 'BuildVerificationDashboard', adminOnly: true },
  { name: 'Feedback', icon: HelpCircle, page: 'Feedback' },
];

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [needsInvite, setNeedsInvite] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      const me = await base44.auth.me();
      // Platform admin (app builder/owner) always gets through as Technical Admin
      if (me.role === 'admin') {
        setUser(me);
        loadNotifications(me.email);
        return;
      }

      const domain = me.email?.split('@')[1];
      const allowed = ['greathornaml.com', 'libertylabs.ca', 'bitcoinbrains.com'];
      if (!allowed.includes(domain)) {
        setAccessDenied(true);
        return;
      }
      // Check invitation
      const invitations = await base44.entities.UserInvitation.filter({ email: me.email });
      const validInvite = invitations.find(i => ['Pending', 'Active'].includes(i.status));
      if (!validInvite) {
        setAccessDenied(true);
        setNeedsInvite(true);
        return;
      }
      // Activate invite if pending
      if (validInvite.status === 'Pending') {
        await base44.entities.UserInvitation.update(validInvite.id, { status: 'Active' });
      }
      // Auto-assign role on first login
      if (!me.role || me.role === 'user') {
        let newRole = validInvite.role || 'reviewer';
        // Amanda auto-maps to compliance_admin
        if (me.email === 'amanda@greathornaml.com') newRole = 'compliance_admin';
        await base44.auth.updateMe({ role: newRole });
        const updated = await base44.auth.me();
        setUser(updated);
        loadNotifications(updated.email);
        return;
      }
      setUser(me);
      loadNotifications(me.email);
    } catch (error) {
      console.error('Auth error:', error);
      setAccessDenied(true);
    }
  }

  async function loadNotifications(email) {
    if (!email) return;
    const all = await base44.entities.Notification.filter({ user_email: email, status: 'unread' });
    setNotifs(all.slice(0, 10));
    setUnreadCount(all.length);
  }

  async function reloadReports() {
    if (user?.role === 'admin') {
      window.location.href = createPageUrl('ChangeLog');
    }
  }

  async function markRead(notif) {
    await base44.entities.Notification.update(notif.id, { status: 'read' });
    setNotifs(n => n.filter(x => x.id !== notif.id));
    setUnreadCount(c => Math.max(0, c - 1));
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center mx-auto">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69afb09f3cf8f7f93f857eb1/aff189096_GreatHornAMLLogo.png" alt="Great Horn AML" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-widest mb-2">Great Horn AML</p>
            <h1 className="text-xl font-bold text-white">Nightwatch</h1>
            {needsInvite ? (
              <p className="text-slate-300 text-sm mt-3 leading-relaxed">
                Your account has not been invited to this Nightwatch workspace.<br />
                <span className="text-slate-400">Please contact an administrator.</span>
              </p>
            ) : (
              <p className="text-slate-400 text-sm mt-2">This Nightwatch workspace is restricted to approved company domains.</p>
            )}
          </div>
          <button onClick={() => base44.auth.logout()} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors w-full">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center mb-2">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69afb09f3cf8f7f93f857eb1/aff189096_GreatHornAMLLogo.png" alt="Great Horn AML" className="w-8 h-8 object-contain" />
          </div>
          <div className="w-6 h-6 border-2 border-slate-600 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Authenticating...</p>
        </div>
      </div>
    );
  }

  const roleName = {
    super_admin: 'Technical Admin',
    compliance_admin: 'Compliance Admin',
    analyst: 'Analyst',
    reviewer: 'Reviewer',
    admin: 'Technical Admin',
    user: 'Analyst'
  }[user.role] || 'Analyst';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <FeedbackButton currentPage={currentPageName} currentRoute={window.location.pathname} />
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen z-50
        bg-[#0A0F1C] text-white flex flex-col
        sidebar-transition
        ${collapsed ? 'w-[68px]' : 'w-[260px]'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/10">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69afb09f3cf8f7f93f857eb1/aff189096_GreatHornAMLLogo.png" alt="Great Horn AML" className="w-6 h-6 object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate leading-tight">Nightwatch</p>
              <p className="text-[10px] text-amber-400/80 truncate leading-tight">Great Horn AML</p>
            </div>
          )}
        </div>

        {/* Search */}
         {!collapsed && (
           <div className="px-2 py-3 border-t border-white/10">
             <GlobalSearch />
           </div>
         )}

        {/* Nav */}
         <nav className="flex-1 py-4 px-2 overflow-y-auto">
           {NAV_ITEMS.filter(item => !item.adminOnly || ['admin', 'super_admin'].includes(user?.role)).map((item, idx) => {
             // Section label
             if (item.label) {
               return (
                 <div key={`label-${idx}`} className={`mt-3 first:mt-0 px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider ${idx > 0 ? 'border-t border-white/10 pt-3' : ''}`}>
                   {!collapsed && item.label}
                 </div>
               );
             }

             const isActive = currentPageName === item.page || 
               (item.page === 'Clients' && currentPageName === 'ClientDetail') ||
               (item.page === 'Engagements' && currentPageName === 'EngagementDetail') ||
               (item.page === 'Feedback' && ['Feedback'].includes(currentPageName)) ||
               (item.page === 'ChangeLog' && ['ChangeLog', 'ArtifactDiagnostics'].includes(currentPageName)) ||
               (item.page === 'BuildVerificationDashboard' && currentPageName === 'BuildVerificationDashboard') ||
               (item.page === 'Admin' && ['AdminRiskLibrary', 'AdminControlLibrary', 'AdminMethodologies', 'AdminNarratives', 'AdminUsers', 'AdminAuditLog', 'AdminJurisdictions', 'AdminIndustries', 'AdminTestScenarios', 'AdminInvitations', 'AdminRiskProposals', 'LibraryReviewDashboard', 'AdminGovernance'].includes(currentPageName));
             return (
               <Link
                 key={item.page}
                 to={createPageUrl(item.page)}
                 onClick={() => setMobileOpen(false)}
                 className={`
                   flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                   ${isActive
                     ? 'bg-white/10 text-amber-400'
                     : 'text-slate-400 hover:text-white hover:bg-white/5'}
                   ${collapsed ? 'justify-center' : ''}
                 `}
               >
                 <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                 {!collapsed && <span>{item.name}</span>}
               </Link>
             );
           })}
         </nav>

        {/* User */}
        <div className={`border-t border-white/10 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-amber-400">
                {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{user.full_name || user.email}</p>
                <p className="text-[10px] text-slate-500 truncate">{roleName}</p>
              </div>
              <button onClick={() => base44.auth.logout()} className="text-slate-500 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => base44.auth.logout()} className="text-slate-500 hover:text-white transition-colors p-1">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60 h-14 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate-600">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{currentPageName === 'Dashboard' ? 'Great Horn AML Nightwatch' : currentPageName?.replace(/([A-Z])/g, ' $1').trim()}</h2>
              {currentPageName === 'Dashboard' && <p className="text-[10px] text-slate-500">Risk Intelligence and Compliance Engine</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
            {user?.role === 'admin' && (
              <button
                onClick={reloadReports}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                title="Reload verification reports"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setShowNotifs(o => !o)}
              className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  <button onClick={() => setShowNotifs(false)} className="text-slate-400 hover:text-slate-600 text-xs">Close</button>
                </div>
                {notifs.length === 0 ? (
                  <p className="px-4 py-6 text-xs text-slate-400 text-center">No unread notifications.</p>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {notifs.map(n => (
                      <div key={n.id} className="px-4 py-3 hover:bg-slate-50 cursor-pointer" onClick={() => markRead(n)}>
                        <p className="text-xs font-medium text-slate-800">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{n.notification_type?.replace(/_/g, ' ')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}