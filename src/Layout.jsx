import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  LayoutDashboard, Building2, FileStack, ListTodo, FileBarChart, Settings,
  ChevronLeft, ChevronRight, LogOut, Shield, Menu, Bell, HelpCircle
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Clients', icon: Building2, page: 'Clients' },
  { name: 'Engagements', icon: FileStack, page: 'Engagements' },
  { name: 'Tasks', icon: ListTodo, page: 'Tasks' },
  { name: 'Reports', icon: FileBarChart, page: 'Reports' },
  { name: 'Admin', icon: Settings, page: 'Admin' },
  { name: 'Help', icon: HelpCircle, page: 'Help' },
];

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      base44.auth.redirectToLogin();
      return;
    }
    const me = await base44.auth.me();
    const domain = me.email?.split('@')[1];
    const allowed = ['greathornaml.com', 'libertylabs.ca', 'bitcoinbrains.com'];
    if (!allowed.includes(domain)) {
      base44.auth.logout();
      return;
    }
    setUser(me);
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Authenticating...</p>
        </div>
      </div>
    );
  }

  const roleName = {
    super_admin: 'Super Admin',
    compliance_admin: 'Compliance Admin',
    analyst: 'Analyst',
    reviewer: 'Reviewer',
    admin: 'Super Admin',
    user: 'Analyst'
  }[user.role] || 'Analyst';

  return (
    <div className="min-h-screen bg-slate-50 flex">
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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate leading-tight">Nightwatch</p>
              <p className="text-[10px] text-amber-400/80 truncate leading-tight">Risk Intelligence Engine</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = currentPageName === item.page || 
              (item.page === 'Clients' && currentPageName === 'ClientDetail') ||
              (item.page === 'Engagements' && currentPageName === 'EngagementDetail') ||
              (item.page === 'Admin' && ['AdminRiskLibrary', 'AdminControlLibrary', 'AdminMethodologies', 'AdminNarratives', 'AdminUsers', 'AdminAuditLog', 'AdminJurisdictions', 'AdminIndustries', 'AdminSuggestions', 'AdminTestScenarios'].includes(currentPageName));
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
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <Bell className="w-4.5 h-4.5" />
            </button>
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