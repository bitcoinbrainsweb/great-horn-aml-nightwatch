import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LiveReportPanel({ engagementId }) {
  const [reportSections, setReportSections] = useState({
    risk_summary: { label: 'Risk Assessment', count: 0, complete: 0 },
    control_environment: { label: 'Control Environment', count: 0, complete: 0 },
    key_issues: { label: 'Key Issues', count: 0, complete: 0 },
    remediation_plan: { label: 'Remediation Plan', count: 0, complete: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    updateReportSections();
    const interval = setInterval(updateReportSections, 5000);
    return () => clearInterval(interval);
  }, [engagementId]);

  async function updateReportSections() {
    try {
      const [risks, controls, findings, remediations] = await Promise.all([
        base44.entities.EngagementRisk?.filter({ engagement_id: engagementId }) || [],
        base44.entities.ControlTest?.list() || [],
        base44.entities.Finding?.list() || [],
        base44.entities.RemediationAction?.list() || []
      ]);

      setReportSections(prev => ({
        risk_summary: {
          ...prev.risk_summary,
          count: risks.length,
          complete: risks.filter(r => r.status === 'Final').length
        },
        control_environment: {
          ...prev.control_environment,
          count: controls.length,
          complete: controls.filter(c => c.status === 'Completed').length
        },
        key_issues: {
          ...prev.key_issues,
          count: findings.length,
          complete: findings.filter(f => f.status === 'Closed').length
        },
        remediation_plan: {
          ...prev.remediation_plan,
          count: remediations.length,
          complete: remediations.filter(r => r.status === 'Verified').length
        }
      }));
      setLoading(false);
    } catch (error) {
      console.error('Error updating report:', error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Live Report Assembly</CardTitle>
        <p className="text-xs text-slate-500 mt-1">Report sections update automatically as work progresses</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(reportSections).map(([key, section]) => {
          const progress = section.count > 0 ? Math.round((section.complete / section.count) * 100) : 0;
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{section.label}</span>
                <Badge variant="outline" className="text-xs">
                  {section.complete}/{section.count}
                </Badge>
              </div>
              <div className="w-full bg-slate-200 rounded h-1.5">
                <div 
                  className="bg-slate-900 h-full rounded transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}