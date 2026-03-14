import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  FileStack, ClipboardCheck, TestTube, ShieldCheck,
  AlertTriangle, CheckCircle2, Clock, ArrowRight
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

export default function ComplianceOperations() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    try {
      const [engagements, controlTests, testCycles, findings, remediations] = await Promise.all([
        base44.entities.Engagement.list('-created_date', 100),
        base44.entities.ControlTest.list('-created_date', 200),
        base44.entities.TestCycle.list('-created_date', 50),
        base44.entities.Finding.list('-created_date', 100),
        base44.entities.RemediationAction.list('-created_date', 100)
      ]);

      setStats({
        engagements_active: engagements.filter(e => !['Completed', 'Archived'].includes(e.status)).length,
        engagements_total: engagements.length,
        tests_completed: controlTests.filter(t => t.status === 'Completed').length,
        tests_total: controlTests.length,
        cycles_active: testCycles.filter(c => c.status === 'Active').length,
        cycles_total: testCycles.length,
        findings_open: findings.filter(f => f.status === 'Open').length,
        findings_total: findings.length,
        remediations_pending: remediations.filter(r => !['Completed', 'Verified'].includes(r.status)).length,
        remediations_total: remediations.length,
      });
    } catch (err) {
      console.error('Failed to load compliance ops stats:', err);
      setStats({});
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const sections = [
    {
      title: 'Engagement Management',
      icon: FileStack,
      page: 'Engagements',
      metric: `${stats?.engagements_active || 0} active`,
      detail: `${stats?.engagements_total || 0} total engagements`,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Control Testing',
      icon: TestTube,
      page: 'ControlTests',
      metric: `${stats?.tests_completed || 0} completed`,
      detail: `${stats?.tests_total || 0} total tests`,
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      title: 'Test Cycles',
      icon: ClipboardCheck,
      page: 'TestCycles',
      metric: `${stats?.cycles_active || 0} active`,
      detail: `${stats?.cycles_total || 0} total cycles`,
      color: 'bg-amber-50 text-amber-600'
    },
    {
      title: 'Findings',
      icon: AlertTriangle,
      page: 'Findings',
      metric: `${stats?.findings_open || 0} open`,
      detail: `${stats?.findings_total || 0} total findings`,
      color: 'bg-red-50 text-red-600'
    },
    {
      title: 'Remediation Actions',
      icon: ShieldCheck,
      page: 'RemediationActions',
      metric: `${stats?.remediations_pending || 0} pending`,
      detail: `${stats?.remediations_total || 0} total actions`,
      color: 'bg-purple-50 text-purple-600'
    }
  ];

  return (
    <div>
      <PageHeader
        title="Compliance Operations"
        subtitle="Operational overview of compliance testing and remediation"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {sections.map(section => (
          <Link
            key={section.page}
            to={createPageUrl(section.page)}
            className="bg-white rounded-xl border border-slate-200/60 p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${section.color}`}>
                <section.icon className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">{section.title}</h3>
            <p className="text-lg font-bold text-slate-900">{section.metric}</p>
            <p className="text-xs text-slate-500 mt-1">{section.detail}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
