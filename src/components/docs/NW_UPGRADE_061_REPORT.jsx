import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Target, Link2, Database } from 'lucide-react';

export default function NW_UPGRADE_061_REPORT() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">NW-UPGRADE-061</h1>
        <p className="text-lg text-slate-600">Sampling + Evidence Collection</p>
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
            <Target className="w-5 h-5" />
            Objective
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-slate-700">
            Add statistical sampling capability and link sampled items to audit procedures and evidence collection. 
            Integrates with existing audit execution graph while maintaining backward compatibility with legacy engagement-scoped sampling.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="font-medium text-blue-900 mb-1">Architecture Rule:</p>
            <p className="text-xs text-blue-700 font-mono">
              AuditProcedure → SampleSet → SampleItem → EvidenceItem
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Entity Extensions */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Database className="w-5 h-5" />
            Entity Extensions (2)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">SampleSet (Extended)</p>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3 text-xs space-y-1">
                <div><strong>Added Fields:</strong></div>
                <div>• audit_procedure_id (relation → AuditProcedure) — links sampling to audit procedures</div>
                <div>• sampling_method (enum: random, judgmental, stratified, full_population) — standardized method</div>
                <div>• sampling_rationale (text) — rationale for sample selection</div>
                <div><strong>Legacy Fields Preserved:</strong></div>
                <div>• engagement_id, control_test_id, sample_method, rationale (backward compatible)</div>
              </CardContent>
            </Card>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">SampleItem (Extended)</p>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3 text-xs space-y-1">
                <div><strong>Added Fields:</strong></div>
                <div>• evidence_item_id (relation → EvidenceItem) — links sample to existing evidence</div>
                <div>• test_result (extended enum: supports both legacy "Pass/Fail" and new "pass/fail")</div>
                <div><strong>Legacy Fields Preserved:</strong></div>
                <div>• item_identifier, item_description, exception_details, evidence_reference, notes</div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="font-medium text-green-900 mb-1">Backward Compatibility:</p>
            <ul className="list-disc list-inside text-green-700 ml-2 space-y-1 text-xs">
              <li>✓ All new fields are optional (no breaking changes)</li>
              <li>✓ Legacy engagement-scoped sampling still works</li>
              <li>✓ Dual-path support: engagement_id OR audit_procedure_id</li>
              <li>✓ No data migration required</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Sampling Workflow */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Target className="w-5 h-5" />
            Sampling Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">Execution Flow:</p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs space-y-1">
              <div>1. Auditor opens AuditProcedure (execution_status = running)</div>
              <div>2. Creates SampleSet (defines population, method, rationale)</div>
              <div>3. Adds SampleItems (item identifiers + descriptions)</div>
              <div>4. Attaches EvidenceItem to each sample (reuses existing evidence)</div>
              <div>5. Records test_result (pass/fail/exception/not_tested)</div>
            </div>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">Sampling Methods Supported:</p>
            <ul className="list-disc list-inside text-slate-600 ml-2 space-y-1">
              <li><strong>Random:</strong> Statistical random selection</li>
              <li><strong>Judgmental:</strong> Auditor-selected based on risk criteria</li>
              <li><strong>Stratified:</strong> Population divided into strata before sampling</li>
              <li><strong>Full Population:</strong> Census testing of entire population</li>
            </ul>
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
            <p className="font-medium text-slate-900 mb-2">Sampling Graph (NW-UPGRADE-061):</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
              <p className="font-mono text-blue-900 mb-2">
                AuditProcedure → SampleSet → SampleItem → EvidenceItem
              </p>
              <p className="text-blue-700">
                Sampling integrates directly with audit procedures and reuses existing EvidenceItem for evidence attachment.
              </p>
            </div>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">Dual-Path Support:</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
              <p className="text-amber-900 mb-1"><strong>Legacy Path:</strong></p>
              <p className="font-mono text-amber-700 mb-2">
                Engagement → EngagementControlTest → SampleSet → SampleItem
              </p>
              <p className="text-amber-900 mb-1"><strong>Audit Path:</strong></p>
              <p className="font-mono text-amber-700">
                Audit → AuditProcedure → SampleSet → SampleItem → EvidenceItem
              </p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="font-medium text-green-900 mb-1">NO Parallel Evidence Systems:</p>
            <ul className="list-disc list-inside text-green-700 ml-2 space-y-1 text-xs">
              <li>✓ Reuses existing EvidenceItem entity</li>
              <li>✓ No new sampling-specific evidence entities</li>
              <li>✓ SampleItem→EvidenceItem link maintains graph integrity</li>
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
            UI: Sampling Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">Added to AuditProcedureExecution Page:</p>
            <ul className="list-disc list-inside text-slate-600 ml-2 space-y-1">
              <li>Sampling section with sample set count</li>
              <li>Create Sample Set button (only when procedure is running)</li>
              <li>Sample set cards showing population/sample sizes and method</li>
              <li>Add Sample Item button for each sample set</li>
              <li>Sample item list with test results and evidence links</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">Sample Set Dialog:</p>
            <ul className="list-disc list-inside text-slate-600 ml-2 space-y-1">
              <li>Population description (required)</li>
              <li>Sampling method selector (4 options)</li>
              <li>Population size and sample size inputs</li>
              <li>Sampling rationale text area</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">Sample Item Dialog:</p>
            <ul className="list-disc list-inside text-slate-600 ml-2 space-y-1">
              <li>Item identifier (required)</li>
              <li>Item description</li>
              <li>Test result selector (pass/fail/exception/not_tested)</li>
              <li>Notes field</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">Sample Item Display:</p>
            <ul className="list-disc list-inside text-slate-600 ml-2 space-y-1">
              <li>Color-coded test result badges (green=pass, red=fail, amber=exception)</li>
              <li>Linked evidence items shown with blue badges</li>
              <li>Item identifier and description visible</li>
              <li>Notes displayed below each item</li>
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
            <span>SampleSet entity contract added</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>SampleItem entity contract added</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>SampleSet→AuditProcedure relation verified</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>SampleItem→SampleSet relation verified</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>SampleItem→EvidenceItem relation verified</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>Audit module graph contract extended (includes sampling path)</span>
          </div>
        </CardContent>
      </Card>

      {/* Files Changed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files Changed (5)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="text-xs text-slate-500 mb-2">Entities (2):</div>
            <div className="ml-2 space-y-1 text-xs">
              <div>• entities/SampleSet.json (added audit_procedure_id, sampling_method, sampling_rationale)</div>
              <div>• entities/SampleItem.json (added evidence_item_id, extended test_result enum)</div>
            </div>
            
            <div className="text-xs text-slate-500 mt-3 mb-2">Pages (1):</div>
            <div className="ml-2 space-y-1 text-xs">
              <div>• pages/AuditProcedureExecution.jsx (added sampling panel, dialogs, and display logic)</div>
            </div>
            
            <div className="text-xs text-slate-500 mt-3 mb-2">Infrastructure (1):</div>
            <div className="ml-2 space-y-1 text-xs">
              <div>• functions/verifyLatestBuild.js (added SampleSet/SampleItem contracts + graph verification)</div>
            </div>
            
            <div className="text-xs text-slate-500 mt-3 mb-2">Documentation (1):</div>
            <div className="ml-2 space-y-1 text-xs">
              <div>• components/docs/NW_UPGRADE_061_REPORT.jsx</div>
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
              <p className="text-2xl font-bold text-slate-900">2</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Sampling Methods</p>
              <p className="text-2xl font-bold text-slate-900">4</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Graph Links</p>
              <p className="text-2xl font-bold text-slate-900">3</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Files Changed</p>
              <p className="text-2xl font-bold text-slate-900">5</p>
            </div>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-1">Sampling Capabilities Added:</p>
            <ul className="list-disc list-inside text-slate-600 space-y-1 ml-2">
              <li>Create sample sets linked to audit procedures</li>
              <li>Define population and sample sizes</li>
              <li>Select sampling method (random, judgmental, stratified, full population)</li>
              <li>Add individual sample items with identifiers and descriptions</li>
              <li>Attach existing EvidenceItem records to sample items</li>
              <li>Record test results (pass/fail/exception/not_tested)</li>
              <li>Document sampling rationale and notes</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-1">Graph Contracts Verified:</p>
            <ul className="list-disc list-inside text-slate-600 space-y-1 ml-2">
              <li>AuditProcedure → SampleSet (NW-UPGRADE-061)</li>
              <li>SampleSet → SampleItem (existing + extended)</li>
              <li>SampleItem → EvidenceItem (NW-UPGRADE-061)</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="font-medium text-green-900 mb-1">Architecture Integrity:</p>
            <ul className="list-disc list-inside text-green-700 space-y-1 ml-2 text-xs">
              <li>✓ No new evidence entities (reuses EvidenceItem)</li>
              <li>✓ Backward compatible with legacy engagement-scoped sampling</li>
              <li>✓ Dual-path support (engagement OR audit procedure)</li>
              <li>✓ Full engagement-scoped graph maintained</li>
              <li>✓ All graph contracts verified in build system</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-medium text-blue-900 mb-1">Next Steps (Future Upgrades):</p>
            <ul className="list-disc list-inside text-blue-700 space-y-1 ml-2 text-xs">
              <li>Add evidence selector dialog for sample items</li>
              <li>Build sample result analytics (pass rate, exception rate)</li>
              <li>Create sampling report generation</li>
              <li>Add bulk sample item import</li>
              <li>Implement sample stratification calculator</li>
              <li>Build sampling methodology guidance</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}