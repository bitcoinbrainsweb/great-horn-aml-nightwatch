import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Shield, Lock, Link2, Database } from 'lucide-react';

export default function NW_UPGRADE_064_REPORT() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">NW-UPGRADE-064</h1>
        <p className="text-lg text-slate-600">Audit Evidence Controls</p>
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
            <Shield className="w-5 h-5" />
            Objective
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-slate-700">
            Harden audit evidence handling so evidence is reviewable, tamper-aware, and properly tied to procedure completion. 
            Adds review workflow, locking mechanism, and completion rules without introducing new evidence systems.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="font-medium text-blue-900 mb-1">Architecture Rule:</p>
            <p className="text-xs text-blue-700 font-mono">
              AuditProcedure → AuditWorkpaper → EvidenceItem → Observation
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Entity Extensions */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Database className="w-5 h-5" />
            Entity Extensions (3)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">EvidenceItem (Extended)</p>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3 text-xs space-y-1">
                <div><strong>Added Fields:</strong></div>
                <div>• review_status (enum: pending, reviewed, rejected, default pending)</div>
                <div>• reviewed_by (string) — email of reviewer</div>
                <div>• reviewed_at (datetime) — review timestamp</div>
                <div>• hash_value (string) — evidence integrity hash</div>
                <div>• hash_algorithm (string) — hash algorithm used</div>
                <div>• locked_for_audit (boolean, default false) — tamper protection</div>
              </CardContent>
            </Card>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">AuditProcedure (Extended)</p>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3 text-xs space-y-1">
                <div><strong>Added Fields:</strong></div>
                <div>• evidence_sufficiency (enum: pending, sufficient, insufficient, default pending)</div>
                <div>• required_evidence_count (number) — minimum evidence requirement</div>
                <div>• completion_rule (enum: none, minimum_evidence_required, reviewed_evidence_required, default none)</div>
              </CardContent>
            </Card>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">AuditWorkpaper (Extended)</p>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-3 text-xs space-y-1">
                <div><strong>Added Fields:</strong></div>
                <div>• review_status (enum: pending, reviewed, rejected, default pending)</div>
                <div>• reviewed_by (string) — email of reviewer</div>
                <div>• reviewed_at (datetime) — review timestamp</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Control Rules */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Lock className="w-5 h-5" />
            Evidence Control Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">1. Evidence Review Workflow:</p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs">
              <p className="font-mono text-purple-900 mb-2">pending → reviewed</p>
              <p className="font-mono text-purple-900">pending → rejected</p>
              <p className="text-purple-700 mt-2">Evidence must be reviewed before procedures can complete (if reviewed_evidence_required)</p>
            </div>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">2. Evidence Locking:</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
              <p className="text-amber-900 mb-1">
                When Audit enters <strong>review</strong> phase, all linked EvidenceItem records: 
                locked_for_audit = true
              </p>
              <p className="text-amber-700">
                Locked evidence cannot be edited through audit workflows (tamper protection)
              </p>
            </div>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">3. Procedure Completion Rules:</p>
            <ul className="list-disc list-inside text-slate-600 ml-2 space-y-1">
              <li><strong>none:</strong> No evidence requirements (default)</li>
              <li><strong>minimum_evidence_required:</strong> Procedure cannot complete unless required_evidence_count is met</li>
              <li><strong>reviewed_evidence_required:</strong> Procedure cannot complete unless required evidence exists and review_status = reviewed</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">4. Evidence Integrity:</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
              <p className="text-blue-900">
                Store hash_value + hash_algorithm for evidence records to detect tampering
              </p>
              <p className="text-blue-700 mt-1">
                Simple durable implementation compatible with current platform
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graph Integration */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Link2 className="w-5 h-5" />
            Engagement-Scoped Graph Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">Evidence Control Graph (NW-UPGRADE-064):</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
              <p className="font-mono text-blue-900 mb-2">
                AuditProcedure → AuditWorkpaper → EvidenceItem → Observation
              </p>
              <p className="text-blue-700">
                Evidence controls apply to existing EvidenceItem entity. No new evidence systems introduced.
              </p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="font-medium text-green-900 mb-1">NO New Evidence Entities:</p>
            <ul className="list-disc list-inside text-green-700 ml-2 space-y-1 text-xs">
              <li>✓ Review controls added to existing EvidenceItem</li>
              <li>✓ Locking mechanism added to existing EvidenceItem</li>
              <li>✓ Hash tracking added to existing EvidenceItem</li>
              <li>✓ Full engagement-scoped architecture preserved</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* UI Updates */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle className="w-5 h-5" />
            UI: Evidence Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">Enhanced AuditProcedureExecution Page:</p>
            <ul className="list-disc list-inside text-slate-600 ml-2 space-y-1">
              <li>Display completion rule and required evidence count</li>
              <li>Show evidence sufficiency badge (pending/sufficient/insufficient)</li>
              <li>Display evidence review status badges in workpaper cards</li>
              <li>Show locked status for evidence items</li>
              <li>Display reviewer and review timestamp</li>
              <li>Enforce completion rules before allowing procedure completion</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">Enhanced AuditReview Page:</p>
            <ul className="list-disc list-inside text-slate-600 ml-2 space-y-1">
              <li>Lock linked evidence when audit enters review phase</li>
              <li>Show evidence review state in findings</li>
              <li>Block completion if procedure completion rules not satisfied</li>
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
            <span>EvidenceItem review_status field verified</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>EvidenceItem locked_for_audit field verified</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>AuditProcedure evidence_sufficiency field verified</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>AuditProcedure completion_rule field verified</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>AuditWorkpaper review_status field verified</span>
          </div>
        </CardContent>
      </Card>

      {/* Files Changed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files Changed (6)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="text-xs text-slate-500 mb-2">Entities (3):</div>
            <div className="ml-2 space-y-1 text-xs">
              <div>• entities/EvidenceItem.json (added review + locking fields)</div>
              <div>• entities/AuditProcedure.json (added evidence controls)</div>
              <div>• entities/AuditWorkpaper.json (added review fields)</div>
            </div>
            
            <div className="text-xs text-slate-500 mt-3 mb-2">Pages (2):</div>
            <div className="ml-2 space-y-1 text-xs">
              <div>• pages/AuditProcedureExecution.jsx (added evidence control display + enforcement)</div>
              <div>• pages/AuditReview.jsx (added evidence locking on review phase)</div>
            </div>
            
            <div className="text-xs text-slate-500 mt-3 mb-2">Infrastructure (1):</div>
            <div className="ml-2 space-y-1 text-xs">
              <div>• functions/verifyLatestBuild.js (updated entity contracts)</div>
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
              <p className="text-xs text-slate-500">Entities Extended</p>
              <p className="text-2xl font-bold text-slate-900">3</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">New Fields</p>
              <p className="text-2xl font-bold text-slate-900">12</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Control Rules</p>
              <p className="text-2xl font-bold text-slate-900">4</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Files Changed</p>
              <p className="text-2xl font-bold text-slate-900">6</p>
            </div>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-1">Evidence Control Capabilities:</p>
            <ul className="list-disc list-inside text-slate-600 space-y-1 ml-2">
              <li>Evidence review workflow (pending → reviewed/rejected)</li>
              <li>Workpaper review workflow (pending → reviewed/rejected)</li>
              <li>Evidence locking when audit enters review phase</li>
              <li>Hash tracking for evidence integrity (hash_value + hash_algorithm)</li>
              <li>Procedure completion rules (none/minimum_evidence/reviewed_evidence)</li>
              <li>Evidence sufficiency assessment (pending/sufficient/insufficient)</li>
              <li>Required evidence count enforcement</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-1">Completion Rule Enforcement:</p>
            <ul className="list-disc list-inside text-slate-600 space-y-1 ml-2">
              <li><strong>none:</strong> No evidence requirements (default)</li>
              <li><strong>minimum_evidence_required:</strong> Blocks completion if evidence count &lt; required_evidence_count</li>
              <li><strong>reviewed_evidence_required:</strong> Blocks completion if evidence not reviewed</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="font-medium text-green-900 mb-1">Architecture Integrity:</p>
            <ul className="list-disc list-inside text-green-700 space-y-1 ml-2 text-xs">
              <li>✓ No new evidence entities (extends existing EvidenceItem)</li>
              <li>✓ Review controls integrated with existing graph</li>
              <li>✓ Locking mechanism preserves engagement-scoped architecture</li>
              <li>✓ Completion rules enforce evidence quality</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-medium text-blue-900 mb-1">Audit Module Complete (v0.6.0):</p>
            <ul className="list-disc list-inside text-blue-700 space-y-1 ml-2 text-xs">
              <li>✓ NW-UPGRADE-059: Foundation</li>
              <li>✓ NW-UPGRADE-060: Execution</li>
              <li>✓ NW-UPGRADE-061: Sampling</li>
              <li>✓ NW-UPGRADE-062: Reporting</li>
              <li>✓ NW-UPGRADE-063: Program Management</li>
              <li>✓ NW-UPGRADE-064: Evidence Controls (tamper protection + review workflow)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}