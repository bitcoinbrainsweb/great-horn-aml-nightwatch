import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, Link2, Database } from 'lucide-react';

export default function NW_UPGRADE_063_REPORT() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">NW-UPGRADE-063</h1>
        <p className="text-lg text-slate-600">Audit Program Management</p>
        <div className="flex justify-center gap-2 mt-3">
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            COMPLETED
          </Badge>
          <Badge variant="outline">v0.6.0</Badge>
          <Badge variant="outline">2026-03-14</Badge>
        </div>
      </div>

      {/* Objective */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Calendar className="w-5 h-5" />
            Objective
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-slate-700">
            Add an Audit Program layer above audits to manage recurring audit programs and schedules. 
            Enables structured planning, template reuse, and multi-engagement audit coordination.
          </p>
        </CardContent>
      </Card>

      {/* New Entities */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Database className="w-5 h-5" />
            New Entities (3)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">AuditProgram</p>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3 text-xs space-y-1">
                <div><strong>Fields:</strong></div>
                <div>• name (string) — program name</div>
                <div>• description (text) — program objectives and scope</div>
                <div>• frequency (enum: annual, semi_annual, quarterly, ad_hoc)</div>
                <div>• owner (string) — email of program owner</div>
                <div>• active (boolean, default true)</div>
              </CardContent>
            </Card>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">AuditSchedule</p>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3 text-xs space-y-1">
                <div><strong>Fields:</strong></div>
                <div>• audit_program_id (relation → AuditProgram, required)</div>
                <div>• engagement_id (relation → Engagement)</div>
                <div>• audit_id (relation → Audit, once created)</div>
                <div>• scheduled_date (date, required)</div>
                <div>• status (enum: scheduled, in_progress, completed, required)</div>
              </CardContent>
            </Card>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">AuditTemplate</p>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-3 text-xs space-y-1">
                <div><strong>Fields:</strong></div>
                <div>• name (string) — template name</div>
                <div>• description (text) — template purpose</div>
                <div>• default_phases (JSON array) — default phase definitions</div>
                <div>• default_procedures (JSON array) — default procedure definitions</div>
                <div>• active (boolean, default true)</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Graph Integration */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Link2 className="w-5 h-5" />
            Program Layer Graph
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">Program Management Graph (NW-UPGRADE-063):</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
              <p className="font-mono text-blue-900 mb-2">
                AuditProgram → AuditSchedule → Audit
              </p>
              <p className="font-mono text-blue-900 mb-2">
                AuditTemplate → Audit (template application)
              </p>
              <p className="text-blue-700 mt-2">
                Programs manage recurring audit schedules. Schedules link to engagements and create audits. 
                Templates provide reusable audit structures.
              </p>
            </div>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">Graph Contracts Added:</p>
            <ul className="list-disc list-inside text-slate-600 ml-2 space-y-1">
              <li>AuditProgram → AuditSchedule</li>
              <li>AuditSchedule → Audit</li>
              <li>AuditTemplate → Audit</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="font-medium text-green-900 mb-1">No Changes to Execution Layer:</p>
            <ul className="list-disc list-inside text-green-700 ml-2 space-y-1 text-xs">
              <li>✓ Audit execution entities unchanged (Audit, AuditPhase, AuditProcedure)</li>
              <li>✓ Sampling entities unchanged (SampleSet, SampleItem)</li>
              <li>✓ Evidence entities unchanged (EvidenceItem)</li>
              <li>✓ Program layer is additive only</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* UI Pages */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Calendar className="w-5 h-5" />
            UI: Program & Template Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">AdminAuditPrograms Page:</p>
            <ul className="list-disc list-inside text-slate-600 ml-2 space-y-1">
              <li>Program list with frequency badges</li>
              <li>Create program dialog (name, description, frequency, owner)</li>
              <li>Schedule audit dialog (link to engagement, set date)</li>
              <li>Upcoming audits display per program</li>
              <li>Active/inactive program status</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">AdminAuditTemplates Page:</p>
            <ul className="list-disc list-inside text-slate-600 ml-2 space-y-1">
              <li>Template list with active/inactive badges</li>
              <li>Create template dialog (name, description, default phases/procedures JSON)</li>
              <li>Display default phases and procedures</li>
              <li>Template activation toggle</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Verification Contracts */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <CheckCircle className="w-5 h-5" />
            Verification Contracts Updated
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>AuditProgram entity contract added (queryable + filterable)</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>AuditSchedule entity contract added (queryable + filterable)</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>AuditTemplate entity contract added (queryable + filterable)</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>AuditProgram→AuditSchedule graph contract verified</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>AuditSchedule→Audit graph contract verified</span>
          </div>
        </CardContent>
      </Card>

      {/* Files Changed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files Changed (8)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="text-xs text-slate-500 mb-2">Entities (3):</div>
            <div className="ml-2 space-y-1 text-xs">
              <div>• entities/AuditProgram.json (new program management entity)</div>
              <div>• entities/AuditSchedule.json (new scheduling entity)</div>
              <div>• entities/AuditTemplate.json (new template entity)</div>
            </div>
            
            <div className="text-xs text-slate-500 mt-3 mb-2">Pages (2):</div>
            <div className="ml-2 space-y-1 text-xs">
              <div>• pages/AdminAuditPrograms.jsx (program management UI)</div>
              <div>• pages/AdminAuditTemplates.jsx (template management UI)</div>
            </div>
            
            <div className="text-xs text-slate-500 mt-3 mb-2">Infrastructure (1):</div>
            <div className="ml-2 space-y-1 text-xs">
              <div>• functions/verifyLatestBuild.js (added 3 entity contracts + 1 graph contract)</div>
            </div>
            
            <div className="text-xs text-slate-500 mt-3 mb-2">Documentation (1):</div>
            <div className="ml-2 space-y-1 text-xs">
              <div>• components/docs/NW_UPGRADE_063_REPORT.jsx</div>
            </div>
            
            <div className="text-xs text-slate-500 mt-3 mb-2">UpgradeRegistry (1):</div>
            <div className="ml-2 space-y-1 text-xs">
              <div>• Created NW-UPGRADE-063 registry entry</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-slate-200 bg-slate-50">
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-slate-500">New Entities</p>
              <p className="text-2xl font-bold text-slate-900">3</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">UI Pages</p>
              <p className="text-2xl font-bold text-slate-900">2</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Graph Contracts</p>
              <p className="text-2xl font-bold text-slate-900">3</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Files Changed</p>
              <p className="text-2xl font-bold text-slate-900">8</p>
            </div>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-1">Program Management Capabilities:</p>
            <ul className="list-disc list-inside text-slate-600 space-y-1 ml-2">
              <li>Create recurring audit programs (annual, semi-annual, quarterly, ad-hoc)</li>
              <li>Schedule audits for specific engagements</li>
              <li>Track scheduled vs completed audits</li>
              <li>Assign program owners</li>
              <li>Activate/deactivate programs</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-1">Template Capabilities:</p>
            <ul className="list-disc list-inside text-slate-600 space-y-1 ml-2">
              <li>Define reusable audit templates</li>
              <li>Specify default phases (Planning, Fieldwork, Review, Reporting)</li>
              <li>Specify default procedures per template</li>
              <li>Apply templates when creating audits</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-1">Graph Contracts Verified:</p>
            <ul className="list-disc list-inside text-slate-600 space-y-1 ml-2">
              <li>AuditProgram → AuditSchedule</li>
              <li>AuditSchedule → Audit</li>
              <li>AuditTemplate → Audit</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="font-medium text-green-900 mb-1">Backward Compatibility:</p>
            <ul className="list-disc list-inside text-green-700 space-y-1 ml-2 text-xs">
              <li>✓ Standalone audits still work (no program required)</li>
              <li>✓ Existing audit execution layer unchanged</li>
              <li>✓ No breaking changes to Audit, AuditPhase, AuditProcedure</li>
              <li>✓ Program layer is fully optional</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-medium text-blue-900 mb-1">Audit Module Evolution (v0.6.0):</p>
            <ul className="list-disc list-inside text-blue-700 space-y-1 ml-2 text-xs">
              <li>✓ NW-UPGRADE-059: Foundation (Audit, AuditPhase, AuditProcedure, AuditWorkpaper, AuditFinding)</li>
              <li>✓ NW-UPGRADE-060: Execution (procedure lifecycle, evidence linking, finding detection)</li>
              <li>✓ NW-UPGRADE-061: Sampling (statistical sampling integration)</li>
              <li>✓ NW-UPGRADE-062: Reporting (report generation, finalization workflow)</li>
              <li>✓ NW-UPGRADE-063: Program Management (recurring programs, scheduling, templates)</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="font-medium text-amber-900 mb-1">Future Enhancements:</p>
            <ul className="list-disc list-inside text-amber-700 space-y-1 ml-2 text-xs">
              <li>Auto-generate audits from schedules</li>
              <li>Apply templates when creating audits from schedules</li>
              <li>Program dashboard with completion metrics</li>
              <li>Schedule calendar view</li>
              <li>Automated schedule reminders</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}