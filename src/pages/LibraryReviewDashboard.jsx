import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  ArrowLeft, CheckCircle2, XCircle, Edit2, GitMerge, Eye, AlertCircle,
  Search, Filter, BookOpen, Shield, FileStack, ChevronDown, ChevronRight, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import { logAudit } from '../components/util/auditLog';
import LegacyRiskReviewDialog from '../components/library/LegacyRiskReviewDialog';
import LegacyControlReviewDialog from '../components/library/LegacyControlReviewDialog';
import { format } from 'date-fns';

const STATUS_COLORS = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  needs_review: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  merged: 'bg-purple-50 text-purple-700 border-purple-200',
};

const SOURCE_CONFIG = {
  analyst: { label: 'Analyst Proposal', icon: Sparkles, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  legacy_review: { label: 'Legacy Review', icon: AlertCircle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  system: { label: 'System', icon: FileStack, color: 'bg-slate-100 text-slate-700 border-slate-200' },
  workspace_override: { label: 'Workspace Override', icon: Shield, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  amanda_framework: { label: 'Amanda Framework', icon: BookOpen, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

function SourceBadge({ source }) {
  const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.system;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
      <Icon className="w-3 h-3" /> {config.label}
    </span>
  );
}

export default function LibraryReviewDashboard() {
  const [riskProposals, setRiskProposals] = useState([]);
  const [controlProposals, setControlProposals] = useState([]);
  const [riskLibrary, setRiskLibrary] = useState([]);
  const [controlLibrary, setControlLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [selectedControl, setSelectedControl] = useState(null);
  const [selectedLegacyRisk, setSelectedLegacyRisk] = useState(null);
  const [selectedLegacyControl, setSelectedLegacyControl] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeTarget, setMergeTarget] = useState('');
  const [mergeNotes, setMergeNotes] = useState('');
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [expandedRisk, setExpandedRisk] = useState(null);
  const [expandedControl, setExpandedControl] = useState(null);
  const [activeTab, setActiveTab] = useState('risk_proposals');

  useEffect(() => { load(); }, []);

  async function load() {
    const [rp, cp, rl, cl, me] = await Promise.all([
      base44.entities.RiskChangeProposal.list('-created_date', 200),
      base44.entities.ControlChangeProposal.list('-created_date', 200),
      base44.entities.RiskLibrary.list('-created_date', 500),
      base44.entities.ControlLibrary.list('-created_date', 500),
      base44.auth.me(),
    ]);
    setRiskProposals(rp);
    setControlProposals(cp);
    setRiskLibrary(rl);
    setControlLibrary(cl);
    setUser(me);
    setLoading(false);
  }

  const isAdmin = ['super_admin', 'compliance_admin'].includes(user?.role);
  const isAnalyst = user?.role === 'analyst';

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const pendingRisks = riskProposals.filter(p => p.status === 'pending' || p.status === 'needs_review');
  const pendingControls = controlProposals.filter(p => p.status === 'pending' || p.status === 'needs_review');
  const legacyRisks = riskLibrary.filter(r => r.status && (r.status.startsWith('legacy_') || r.status === 'deprecated'));
  const legacyControls = controlLibrary.filter(c => c.status && (c.status.startsWith('legacy_') || c.status === 'deprecated'));
  const approvedThisMonth = [...riskProposals, ...controlProposals].filter(p => p.status === 'approved' && p.updated_date && new Date(p.updated_date) >= monthStart);
  const rejectedThisMonth = [...riskProposals, ...controlProposals].filter(p => p.status === 'rejected' && p.updated_date && new Date(p.updated_date) >= monthStart);

  function filterProposals(proposals) {
    return proposals.filter(p => {
      if (isAnalyst && p.submitted_by !== user?.email) return false;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || p.source === sourceFilter;
      const matchesSearch = !searchTerm || 
        (p.proposed_risk_name || p.proposed_control_name || p.target_risk_name || p.target_control_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.rationale || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSource && matchesSearch;
    });
  }

  function filterLibraryItems(items, field = 'risk_name') {
    return items.filter(item => {
      const matchesSearch = !searchTerm || 
        (item[field] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }

  const filteredRisks = filterProposals(riskProposals);
  const filteredControls = filterProposals(controlProposals);
  const filteredLegacyRisks = filterLibraryItems(legacyRisks, 'risk_name');
  const filteredLegacyControls = filterLibraryItems(legacyControls, 'control_name');

  async function handleRiskDecision(status) {
    setSaving(true);
    const updates = {
      status,
      reviewed_by: user?.email,
      reviewer_notes: reviewNotes,
    };
    if (editMode && editForm) {
      Object.assign(updates, editForm);
    }
    await base44.entities.RiskChangeProposal.update(selectedRisk.id, updates);
    await logAudit({
      userEmail: user?.email,
      objectType: 'RiskChangeProposal',
      objectId: selectedRisk.id,
      action: `proposal_${status}`,
      fieldChanged: 'status',
      oldValue: selectedRisk.status,
      newValue: status,
      details: editMode 
        ? `Risk proposal edited and ${status}: ${selectedRisk.proposed_risk_name || selectedRisk.target_risk_name}. Notes: ${reviewNotes}`
        : `Risk proposal ${status}: ${selectedRisk.proposed_risk_name || selectedRisk.target_risk_name}. Notes: ${reviewNotes}`,
    });

    if (status === 'approved' && selectedRisk.change_type === 'New Risk') {
      await base44.entities.RiskLibrary.create({
        risk_name: editForm.proposed_risk_name || selectedRisk.proposed_risk_name,
        risk_category: editForm.proposed_category || selectedRisk.proposed_category,
        description: editForm.proposed_description || selectedRisk.proposed_description,
        default_likelihood: editForm.proposed_likelihood || selectedRisk.proposed_likelihood,
        default_impact: editForm.proposed_impact || selectedRisk.proposed_impact,
        status: 'Active',
        source: 'Workspace Custom',
        is_core: false,
      });
      await logAudit({
        userEmail: user?.email,
        objectType: 'RiskLibrary',
        action: 'created_from_proposal',
        details: `New risk created from approved proposal: ${editForm.proposed_risk_name || selectedRisk.proposed_risk_name}`,
      });
    }

    resetState();
    await load();
  }

  async function handleControlDecision(status) {
    setSaving(true);
    const updates = {
      status,
      reviewed_by: user?.email,
      reviewer_notes: reviewNotes,
    };
    if (editMode && editForm) {
      Object.assign(updates, editForm);
    }
    await base44.entities.ControlChangeProposal.update(selectedControl.id, updates);
    await logAudit({
      userEmail: user?.email,
      objectType: 'ControlChangeProposal',
      objectId: selectedControl.id,
      action: `proposal_${status}`,
      fieldChanged: 'status',
      oldValue: selectedControl.status,
      newValue: status,
      details: editMode
        ? `Control proposal edited and ${status}: ${selectedControl.proposed_control_name || selectedControl.target_control_name}. Notes: ${reviewNotes}`
        : `Control proposal ${status}: ${selectedControl.proposed_control_name || selectedControl.target_control_name}. Notes: ${reviewNotes}`,
    });

    if (status === 'approved' && selectedControl.change_type === 'New Control') {
      await base44.entities.ControlLibrary.create({
        control_name: editForm.proposed_control_name || selectedControl.proposed_control_name,
        control_category: editForm.proposed_category || selectedControl.proposed_category,
        description: editForm.proposed_description || selectedControl.proposed_description,
        evidence_expected: editForm.expected_evidence || selectedControl.expected_evidence,
        regulatory_reference: editForm.regulatory_reference || selectedControl.regulatory_reference,
        status: 'Active',
        is_core: false,
      });
      await logAudit({
        userEmail: user?.email,
        objectType: 'ControlLibrary',
        action: 'created_from_proposal',
        details: `New control created from approved proposal: ${editForm.proposed_control_name || selectedControl.proposed_control_name}`,
      });
    }

    resetState();
    await load();
  }

  async function handleRiskMerge() {
    if (!mergeTarget) return;
    setSaving(true);
    await base44.entities.RiskChangeProposal.update(selectedRisk.id, {
      status: 'merged',
      reviewed_by: user?.email,
      reviewer_notes: reviewNotes,
      merged_into_id: mergeTarget,
      merge_notes: mergeNotes,
    });
    await logAudit({
      userEmail: user?.email,
      objectType: 'RiskChangeProposal',
      objectId: selectedRisk.id,
      action: 'proposal_merged',
      fieldChanged: 'status',
      oldValue: selectedRisk.status,
      newValue: 'merged',
      details: `Risk proposal merged into library item ${mergeTarget}. Merge notes: ${mergeNotes}`,
    });
    resetState();
    await load();
  }

  async function handleControlMerge() {
    if (!mergeTarget) return;
    setSaving(true);
    await base44.entities.ControlChangeProposal.update(selectedControl.id, {
      status: 'merged',
      reviewed_by: user?.email,
      reviewer_notes: reviewNotes,
      merged_into_id: mergeTarget,
      merge_notes: mergeNotes,
    });
    await logAudit({
      userEmail: user?.email,
      objectType: 'ControlChangeProposal',
      objectId: selectedControl.id,
      action: 'proposal_merged',
      fieldChanged: 'status',
      oldValue: selectedControl.status,
      newValue: 'merged',
      details: `Control proposal merged into library item ${mergeTarget}. Merge notes: ${mergeNotes}`,
    });
    resetState();
    await load();
  }

  function resetState() {
    setSaving(false);
    setSelectedRisk(null);
    setSelectedControl(null);
    setReviewNotes('');
    setEditMode(false);
    setMergeMode(false);
    setMergeTarget('');
    setMergeNotes('');
    setEditForm({});
  }

  function openRiskReview(risk) {
    setSelectedRisk(risk);
    setReviewNotes('');
    setEditForm({
      proposed_risk_name: risk.proposed_risk_name,
      proposed_category: risk.proposed_category,
      proposed_description: risk.proposed_description,
      proposed_likelihood: risk.proposed_likelihood,
      proposed_impact: risk.proposed_impact,
      regulatory_reference: risk.regulatory_reference,
      evidence_examples: risk.evidence_examples,
    });
  }

  function openControlReview(control) {
    setSelectedControl(control);
    setReviewNotes('');
    setEditForm({
      proposed_control_name: control.proposed_control_name,
      proposed_category: control.proposed_category,
      proposed_description: control.proposed_description,
      expected_evidence: control.expected_evidence,
      regulatory_reference: control.regulatory_reference,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin && !isAnalyst) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-center">
        <p className="text-sm text-red-800 font-medium">Access Denied</p>
        <p className="text-xs text-red-600 mt-1">This page is restricted to Compliance Admins, Technical Admins, and Analysts.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Admin')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title="Library Review Dashboard"
          subtitle={isAnalyst ? 'View your submitted proposals' : 'Review and approve proposed risks and controls'}
        />
      </div>

      {/* Summary Cards - Clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <button
          onClick={() => { setActiveTab('risk_proposals'); setSearchTerm(''); setStatusFilter('pending'); }}
          className="group hover:scale-105 transition-transform"
        >
          <StatCard title="Pending Risks" value={pendingRisks.length} icon={AlertCircle} color="amber" />
        </button>
        <button
          onClick={() => { setActiveTab('control_proposals'); setSearchTerm(''); setStatusFilter('pending'); }}
          className="group hover:scale-105 transition-transform"
        >
          <StatCard title="Pending Controls" value={pendingControls.length} icon={Shield} color="blue" />
        </button>
        <button
          onClick={() => { setActiveTab('legacy_risks'); setSearchTerm(''); setStatusFilter('all'); }}
          className="group hover:scale-105 transition-transform"
        >
          <StatCard title="Legacy Risks" value={legacyRisks.length} icon={BookOpen} color="slate" />
        </button>
        <button
          onClick={() => { setActiveTab('legacy_controls'); setSearchTerm(''); setStatusFilter('all'); }}
          className="group hover:scale-105 transition-transform"
        >
          <StatCard title="Legacy Controls" value={legacyControls.length} icon={FileStack} color="slate" />
        </button>
        <StatCard title="Approved (MTD)" value={approvedThisMonth.length} icon={CheckCircle2} color="green" />
        <StatCard title="Rejected (MTD)" value={rejectedThisMonth.length} icon={XCircle} color="red" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search proposals..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="needs_review">Needs Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="merged">Merged</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="analyst">Analyst</SelectItem>
              <SelectItem value="legacy_review">Legacy Review</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="workspace_override">Workspace Override</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('all'); setSourceFilter('all'); }}>
            <Filter className="w-4 h-4 mr-1.5" /> Clear Filters
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="risk_proposals">Risk Proposals ({filteredRisks.length})</TabsTrigger>
          <TabsTrigger value="control_proposals">Control Proposals ({filteredControls.length})</TabsTrigger>
          <TabsTrigger value="legacy_risks">Legacy Risks ({filteredLegacyRisks.length})</TabsTrigger>
          <TabsTrigger value="legacy_controls">Legacy Controls ({filteredLegacyControls.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="risk_proposals" className="space-y-3">
          {filteredRisks.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/60 p-10 text-center text-sm text-slate-500">
              No risk proposals match your filters.
            </div>
          ) : (
            filteredRisks.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200/60">
                <button
                  onClick={() => setExpandedRisk(expandedRisk === p.id ? null : p.id)}
                  className="w-full px-5 py-4 flex items-start justify-between hover:bg-slate-50/50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[p.status] || ''}`}>
                        {p.status}
                      </span>
                      <SourceBadge source={p.source} />
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 font-medium">
                        {p.change_type}
                      </span>
                      {p.proposed_category && (
                        <span className="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700 font-medium">
                          {p.proposed_category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {p.proposed_risk_name || p.target_risk_name || '(Unnamed Risk)'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{p.rationale}</p>
                    <p className="text-[10px] text-slate-400 mt-2">
                      Submitted by {p.submitted_by || 'Unknown'} · {p.created_date ? format(new Date(p.created_date), 'MMM d, yyyy') : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {isAdmin && (p.status === 'pending' || p.status === 'needs_review') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); openRiskReview(p); }}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Review
                      </Button>
                    )}
                    {expandedRisk === p.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedRisk === p.id && (
                  <div className="px-5 pb-4 border-t border-slate-100 pt-3 space-y-2">
                    {p.proposed_description && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Proposed Description:</p>
                        <p className="text-xs text-slate-600 mt-0.5">{p.proposed_description}</p>
                      </div>
                    )}
                    {p.regulatory_reference && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Regulatory Reference:</p>
                        <p className="text-xs text-slate-600 mt-0.5">{p.regulatory_reference}</p>
                      </div>
                    )}
                    {p.supporting_reference && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Supporting Reference:</p>
                        <p className="text-xs text-slate-600 mt-0.5">{p.supporting_reference}</p>
                      </div>
                    )}
                    {p.reviewer_notes && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Reviewer Notes:</p>
                        <p className="text-xs text-slate-600 mt-0.5">{p.reviewer_notes}</p>
                      </div>
                    )}
                    {p.reviewed_by && (
                      <p className="text-[10px] text-slate-400">Reviewed by {p.reviewed_by}</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="control_proposals" className="space-y-3">
          {filteredControls.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/60 p-10 text-center text-sm text-slate-500">
              No control proposals match your filters.
            </div>
          ) : (
            filteredControls.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200/60">
                <button
                  onClick={() => setExpandedControl(expandedControl === p.id ? null : p.id)}
                  className="w-full px-5 py-4 flex items-start justify-between hover:bg-slate-50/50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[p.status] || ''}`}>
                        {p.status}
                      </span>
                      <SourceBadge source={p.source} />
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 font-medium">
                        {p.change_type}
                      </span>
                      {p.proposed_category && (
                        <span className="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700 font-medium">
                          {p.proposed_category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {p.proposed_control_name || p.target_control_name || '(Unnamed Control)'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{p.rationale}</p>
                    <p className="text-[10px] text-slate-400 mt-2">
                      Submitted by {p.submitted_by || 'Unknown'} · {p.created_date ? format(new Date(p.created_date), 'MMM d, yyyy') : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {isAdmin && (p.status === 'pending' || p.status === 'needs_review') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); openControlReview(p); }}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Review
                      </Button>
                    )}
                    {expandedControl === p.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedControl === p.id && (
                  <div className="px-5 pb-4 border-t border-slate-100 pt-3 space-y-2">
                    {p.proposed_description && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Proposed Description:</p>
                        <p className="text-xs text-slate-600 mt-0.5">{p.proposed_description}</p>
                      </div>
                    )}
                    {p.expected_evidence && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Expected Evidence:</p>
                        <p className="text-xs text-slate-600 mt-0.5">{p.expected_evidence}</p>
                      </div>
                    )}
                    {p.regulatory_reference && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Regulatory Reference:</p>
                        <p className="text-xs text-slate-600 mt-0.5">{p.regulatory_reference}</p>
                      </div>
                    )}
                    {p.reviewer_notes && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Reviewer Notes:</p>
                        <p className="text-xs text-slate-600 mt-0.5">{p.reviewer_notes}</p>
                      </div>
                    )}
                    {p.reviewed_by && (
                      <p className="text-[10px] text-slate-400">Reviewed by {p.reviewed_by}</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="legacy_risks" className="space-y-3">
          {filteredLegacyRisks.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/60 p-10 text-center text-sm text-slate-500">
              No legacy risks to review.
            </div>
          ) : (
            filteredLegacyRisks.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-amber-200/60 border-l-4 border-l-amber-500">
                <button
                  onClick={() => setSelectedLegacyRisk(r)}
                  className="w-full px-5 py-4 flex items-start justify-between hover:bg-amber-50/50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                        {r.status}
                      </span>
                      {r.risk_category && (
                        <span className="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700 font-medium">
                          {r.risk_category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{r.risk_name}</p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{r.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-3 flex-shrink-0" />
                </button>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="legacy_controls" className="space-y-3">
          {filteredLegacyControls.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/60 p-10 text-center text-sm text-slate-500">
              No legacy controls to review.
            </div>
          ) : (
            filteredLegacyControls.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-amber-200/60 border-l-4 border-l-amber-500">
                <button
                  onClick={() => setSelectedLegacyControl(c)}
                  className="w-full px-5 py-4 flex items-start justify-between hover:bg-amber-50/50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                        {c.status}
                      </span>
                      {c.control_category && (
                        <span className="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700 font-medium">
                          {c.control_category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{c.control_name}</p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{c.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-3 flex-shrink-0" />
                </button>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Risk Review Dialog */}
      <Dialog open={!!selectedRisk} onOpenChange={() => resetState()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mergeMode ? 'Merge Risk Proposal' : editMode ? 'Edit & Review Proposal' : 'Review Risk Proposal'}
            </DialogTitle>
          </DialogHeader>

          {mergeMode ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg text-xs">
                <p className="font-semibold text-slate-900 mb-1">{selectedRisk?.proposed_risk_name || selectedRisk?.target_risk_name}</p>
                <p className="text-slate-600">{selectedRisk?.rationale}</p>
              </div>
              <div>
                <Label>Merge Into Existing Risk</Label>
                <Select value={mergeTarget} onValueChange={setMergeTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk library item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {riskLibrary.filter(r => r.status === 'Active').map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.risk_name} ({r.risk_category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Merge Notes</Label>
                <Textarea
                  rows={3}
                  placeholder="Explain why this proposal is being merged..."
                  value={mergeNotes}
                  onChange={e => setMergeNotes(e.target.value)}
                />
              </div>
              <div>
                <Label>Reviewer Notes</Label>
                <Textarea
                  rows={2}
                  placeholder="Additional review notes..."
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setMergeMode(false)}>Back</Button>
                <Button onClick={handleRiskMerge} disabled={saving || !mergeTarget} className="bg-purple-600 hover:bg-purple-700">
                  <GitMerge className="w-3.5 h-3.5 mr-1" /> Confirm Merge
                </Button>
              </div>
            </div>
          ) : editMode ? (
            <div className="space-y-4">
              <div>
                <Label>Risk Name</Label>
                <Input value={editForm.proposed_risk_name || ''} onChange={e => setEditForm({...editForm, proposed_risk_name: e.target.value})} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={editForm.proposed_category || ''} onValueChange={v => setEditForm({...editForm, proposed_category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Products', 'Delivery Channels', 'Clients', 'Geography', 'Technology', 'Sanctions', 'Third Parties', 'Operational'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={3} value={editForm.proposed_description || ''} onChange={e => setEditForm({...editForm, proposed_description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Likelihood (1-5)</Label>
                  <Input type="number" min="1" max="5" value={editForm.proposed_likelihood || ''} onChange={e => setEditForm({...editForm, proposed_likelihood: Number(e.target.value)})} />
                </div>
                <div>
                  <Label>Impact (1-5)</Label>
                  <Input type="number" min="1" max="5" value={editForm.proposed_impact || ''} onChange={e => setEditForm({...editForm, proposed_impact: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <Label>Regulatory Reference</Label>
                <Input value={editForm.regulatory_reference || ''} onChange={e => setEditForm({...editForm, regulatory_reference: e.target.value})} />
              </div>
              <div>
                <Label>Reviewer Notes</Label>
                <Textarea rows={2} placeholder="Notes on your edits..." value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditMode(false)}>Back</Button>
                <Button onClick={() => handleRiskDecision('rejected')} disabled={saving} className="bg-red-600 hover:bg-red-700">
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>
                <Button onClick={() => handleRiskDecision('approved')} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[selectedRisk?.status] || ''}`}>
                    {selectedRisk?.status}
                  </span>
                  <SourceBadge source={selectedRisk?.source} />
                </div>
                <p><strong>Change Type:</strong> {selectedRisk?.change_type}</p>
                <p><strong>Risk Name:</strong> {selectedRisk?.proposed_risk_name || selectedRisk?.target_risk_name}</p>
                {selectedRisk?.proposed_category && <p><strong>Category:</strong> {selectedRisk.proposed_category}</p>}
                <p><strong>Rationale:</strong> {selectedRisk?.rationale}</p>
                {selectedRisk?.proposed_description && <p><strong>Description:</strong> {selectedRisk.proposed_description}</p>}
                {selectedRisk?.regulatory_reference && <p><strong>Regulatory Ref:</strong> {selectedRisk.regulatory_reference}</p>}
                {selectedRisk?.supporting_reference && <p><strong>Supporting Ref:</strong> {selectedRisk.supporting_reference}</p>}
                <p className="text-[10px] text-slate-400 pt-1">Submitted by {selectedRisk?.submitted_by} on {selectedRisk?.created_date ? format(new Date(selectedRisk.created_date), 'MMM d, yyyy') : ''}</p>
              </div>
              <div>
                <Label>Reviewer Notes</Label>
                <Textarea rows={3} placeholder="Add notes for this decision..." value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} />
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => resetState()}>Cancel</Button>
                <Button variant="outline" onClick={() => setMergeMode(true)} className="gap-1.5">
                  <GitMerge className="w-3.5 h-3.5" /> Merge
                </Button>
                <Button variant="outline" onClick={() => setEditMode(true)} className="gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" /> Edit Before Approval
                </Button>
                <Button onClick={() => handleRiskDecision('needs_review')} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  Needs Revision
                </Button>
                <Button onClick={() => handleRiskDecision('rejected')} disabled={saving} className="bg-red-600 hover:bg-red-700">
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>
                <Button onClick={() => handleRiskDecision('approved')} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Control Review Dialog */}
      <Dialog open={!!selectedControl} onOpenChange={() => resetState()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mergeMode ? 'Merge Control Proposal' : editMode ? 'Edit & Review Proposal' : 'Review Control Proposal'}
            </DialogTitle>
          </DialogHeader>

          {mergeMode ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg text-xs">
                <p className="font-semibold text-slate-900 mb-1">{selectedControl?.proposed_control_name || selectedControl?.target_control_name}</p>
                <p className="text-slate-600">{selectedControl?.rationale}</p>
              </div>
              <div>
                <Label>Merge Into Existing Control</Label>
                <Select value={mergeTarget} onValueChange={setMergeTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select control library item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {controlLibrary.filter(c => c.status === 'Active').map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.control_name} ({c.control_category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Merge Notes</Label>
                <Textarea rows={3} placeholder="Explain why this proposal is being merged..." value={mergeNotes} onChange={e => setMergeNotes(e.target.value)} />
              </div>
              <div>
                <Label>Reviewer Notes</Label>
                <Textarea rows={2} placeholder="Additional review notes..." value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setMergeMode(false)}>Back</Button>
                <Button onClick={handleControlMerge} disabled={saving || !mergeTarget} className="bg-purple-600 hover:bg-purple-700">
                  <GitMerge className="w-3.5 h-3.5 mr-1" /> Confirm Merge
                </Button>
              </div>
            </div>
          ) : editMode ? (
            <div className="space-y-4">
              <div>
                <Label>Control Name</Label>
                <Input value={editForm.proposed_control_name || ''} onChange={e => setEditForm({...editForm, proposed_control_name: e.target.value})} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={editForm.proposed_category || ''} onValueChange={v => setEditForm({...editForm, proposed_category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Governance', 'CDD', 'EDD', 'Sanctions', 'Transaction Monitoring', 'Reporting', 'Technology Security', 'Vendor Oversight', 'Training', 'Operations'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={3} value={editForm.proposed_description || ''} onChange={e => setEditForm({...editForm, proposed_description: e.target.value})} />
              </div>
              <div>
                <Label>Expected Evidence</Label>
                <Textarea rows={2} value={editForm.expected_evidence || ''} onChange={e => setEditForm({...editForm, expected_evidence: e.target.value})} />
              </div>
              <div>
                <Label>Regulatory Reference</Label>
                <Input value={editForm.regulatory_reference || ''} onChange={e => setEditForm({...editForm, regulatory_reference: e.target.value})} />
              </div>
              <div>
                <Label>Reviewer Notes</Label>
                <Textarea rows={2} placeholder="Notes on your edits..." value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditMode(false)}>Back</Button>
                <Button onClick={() => handleControlDecision('rejected')} disabled={saving} className="bg-red-600 hover:bg-red-700">
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>
                <Button onClick={() => handleControlDecision('approved')} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[selectedControl?.status] || ''}`}>
                    {selectedControl?.status}
                  </span>
                  <SourceBadge source={selectedControl?.source} />
                </div>
                <p><strong>Change Type:</strong> {selectedControl?.change_type}</p>
                <p><strong>Control Name:</strong> {selectedControl?.proposed_control_name || selectedControl?.target_control_name}</p>
                {selectedControl?.proposed_category && <p><strong>Category:</strong> {selectedControl.proposed_category}</p>}
                <p><strong>Rationale:</strong> {selectedControl?.rationale}</p>
                {selectedControl?.proposed_description && <p><strong>Description:</strong> {selectedControl.proposed_description}</p>}
                {selectedControl?.expected_evidence && <p><strong>Expected Evidence:</strong> {selectedControl.expected_evidence}</p>}
                {selectedControl?.regulatory_reference && <p><strong>Regulatory Ref:</strong> {selectedControl.regulatory_reference}</p>}
                <p className="text-[10px] text-slate-400 pt-1">Submitted by {selectedControl?.submitted_by} on {selectedControl?.created_date ? format(new Date(selectedControl.created_date), 'MMM d, yyyy') : ''}</p>
              </div>
              <div>
                <Label>Reviewer Notes</Label>
                <Textarea rows={3} placeholder="Add notes for this decision..." value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} />
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => resetState()}>Cancel</Button>
                <Button variant="outline" onClick={() => setMergeMode(true)} className="gap-1.5">
                  <GitMerge className="w-3.5 h-3.5" /> Merge
                </Button>
                <Button variant="outline" onClick={() => setEditMode(true)} className="gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" /> Edit Before Approval
                </Button>
                <Button onClick={() => handleControlDecision('needs_review')} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  Needs Revision
                </Button>
                <Button onClick={() => handleControlDecision('rejected')} disabled={saving} className="bg-red-600 hover:bg-red-700">
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>
                <Button onClick={() => handleControlDecision('approved')} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Legacy Risk Review Dialog */}
      <LegacyRiskReviewDialog
        open={!!selectedLegacyRisk}
        risk={selectedLegacyRisk}
        user={user}
        onClose={() => setSelectedLegacyRisk(null)}
        onRefresh={load}
      />

      {/* Legacy Control Review Dialog */}
      <LegacyControlReviewDialog
        open={!!selectedLegacyControl}
        control={selectedLegacyControl}
        user={user}
        onClose={() => setSelectedLegacyControl(null)}
        onRefresh={load}
      />
    </div>
  );
}