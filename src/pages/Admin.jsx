import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  BookOpen, ShieldCheck, FileText, Users, History,
  Globe, Factory, Lightbulb, FlaskConical, Mail
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

const ADMIN_SECTIONS = [
  { name: 'Methodologies', description: 'Assessment methodology profiles', icon: BookOpen, page: 'AdminMethodologies', color: 'bg-blue-50 text-blue-600' },
  { name: 'Risk Library', description: 'Manage risk definitions and categories', icon: ShieldCheck, page: 'AdminRiskLibrary', color: 'bg-red-50 text-red-600' },
  { name: 'Control Library', description: 'Manage control definitions', icon: ShieldCheck, page: 'AdminControlLibrary', color: 'bg-emerald-50 text-emerald-600' },
  { name: 'Narrative Templates', description: 'Report narrative templates', icon: FileText, page: 'AdminNarratives', color: 'bg-purple-50 text-purple-600' },
  { name: 'Suggestions Queue', description: 'Review analyst-submitted risks and controls', icon: Lightbulb, page: 'AdminSuggestions', color: 'bg-amber-50 text-amber-600' },
  { name: 'Industries', description: 'Industry classification table', icon: Factory, page: 'AdminIndustries', color: 'bg-slate-50 text-slate-600' },
  { name: 'Jurisdictions', description: 'Jurisdiction risk ratings', icon: Globe, page: 'AdminJurisdictions', color: 'bg-cyan-50 text-cyan-600' },
  { name: 'Users', description: 'Manage team members and roles', icon: Users, page: 'AdminUsers', color: 'bg-indigo-50 text-indigo-600' },
  { name: 'Invitations', description: 'Manage workspace access invitations', icon: Users, page: 'AdminInvitations', color: 'bg-violet-50 text-violet-600' },
  { name: 'Library Review Dashboard', description: 'Review and approve proposed risks and controls', icon: ShieldCheck, page: 'LibraryReviewDashboard', color: 'bg-indigo-50 text-indigo-600' },
  { name: 'Risk Proposals', description: 'Review analyst risk change proposals', icon: ShieldCheck, page: 'AdminRiskProposals', color: 'bg-rose-50 text-rose-600' },
  { name: 'Audit Log', description: 'Track system changes', icon: History, page: 'AdminAuditLog', color: 'bg-orange-50 text-orange-600' },
];

const SUPERADMIN_SECTIONS = [
  { name: 'Test Scenario Generator', description: 'Generate fictional test data for internal QA', icon: FlaskConical, page: 'AdminTestScenarios', color: 'bg-rose-50 text-rose-600' },
];

export default function Admin() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const isSuperAdmin = ['admin', 'super_admin', 'compliance_admin'].includes(user?.role);

  return (
    <div>
      <PageHeader title="Administration" subtitle="Manage system configuration and reference data" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ADMIN_SECTIONS.map(section => (
          <Link
            key={section.page}
            to={createPageUrl(section.page)}
            className="bg-white rounded-xl border border-slate-200/60 p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
          >
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-lg ${section.color}`}>
                <section.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{section.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{section.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {isSuperAdmin && (
        <>
          <div className="mt-8 mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Internal Tools</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUPERADMIN_SECTIONS.map(section => (
              <Link
                key={section.page}
                to={createPageUrl(section.page)}
                className="bg-white rounded-xl border border-rose-200/60 p-5 hover:shadow-md hover:border-rose-300 transition-all duration-200 group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${section.color}`}>
                    <section.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-rose-600 transition-colors">{section.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{section.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}