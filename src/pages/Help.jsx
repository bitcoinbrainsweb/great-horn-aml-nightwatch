import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, BookOpen, Shield, Users, FileStack, BarChart2, Settings, FileText, Cog, ClipboardList, HelpCircle, Zap, ChevronRight, FlaskConical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PageHeader from '../components/ui/PageHeader';

const TOPICS = [
  {
    id: 'overview',
    title: 'Nightwatch Overview',
    icon: Shield,
    content: (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">What is Nightwatch?</h2>
        <p className="text-sm text-slate-700 leading-relaxed">Great Horn AML Nightwatch is an internal compliance and risk intelligence operating system designed for AML (Anti-Money Laundering) professionals conducting risk assessments, compliance audits, and policy package engagements for regulated entities.</p>
        <p className="text-sm text-slate-700 leading-relaxed">Nightwatch standardizes the assessment workflow from client intake through risk identification, control evaluation, residual risk scoring, report generation, and final delivery.</p>
        <h3 className="text-base font-semibold text-slate-900 mt-6">High-Level Workflow</h3>
        <div className="space-y-2">
          {['Create or select a Client', 'Open a new Engagement (Risk Assessment, Compliance Audit, or Policy Package)', 'Complete the Intake Questionnaire', 'Review Suggested Risks from the risk engine', 'Accept or add risks to the Engagement Risk register', 'Evaluate Controls for each accepted risk', 'Review the Risk Summary and calculated residual risk ratings', 'Generate a Draft Report using the AI report engine', 'Submit for Review → Approve → Finalize → Export (PDF or Word)', 'Mark the Engagement as Completed'].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
              <p className="text-sm text-slate-700">{step}</p>
            </div>
          ))}
        </div>
        <h3 className="text-base font-semibold text-slate-900 mt-6">Engagement Types</h3>
        <div className="space-y-2">
          <div className="p-3 bg-slate-50 rounded-lg"><p className="text-sm font-medium text-slate-900">Risk Assessment</p><p className="text-xs text-slate-500 mt-0.5">Enterprise-wide AML risk assessment (EWRA) covering all risk domains. The standard engagement type.</p></div>
          <div className="p-3 bg-slate-50 rounded-lg"><p className="text-sm font-medium text-slate-900">Compliance Audit</p><p className="text-xs text-slate-500 mt-0.5">Structured review of an entity's AML compliance program against regulatory requirements.</p></div>
          <div className="p-3 bg-slate-50 rounded-lg"><p className="text-sm font-medium text-slate-900">Policy Package</p><p className="text-xs text-slate-500 mt-0.5">Development of AML policies, procedures, and governance documentation for a regulated entity.</p></div>
        </div>
      </div>
    )
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Zap,
    content: (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Getting Started with Nightwatch</h2>
        <h3 className="text-base font-semibold text-slate-900">Step 1: Create a Client</h3>
        <p className="text-sm text-slate-700 leading-relaxed">Navigate to <strong>Clients</strong> in the sidebar and click <strong>New Client</strong>. Enter the client's legal name, industry, jurisdiction, client type, and compliance contact. Assign an analyst and reviewer from your team.</p>
        <h3 className="text-base font-semibold text-slate-900 mt-4">Step 2: Create an Engagement</h3>
        <p className="text-sm text-slate-700 leading-relaxed">Navigate to <strong>Engagements</strong> and click <strong>New Engagement</strong>. Select the client, engagement type, and methodology. Assign the analyst and reviewer, and set a target delivery date. Default tasks will be created automatically.</p>
        <h3 className="text-base font-semibold text-slate-900 mt-4">Step 3: Begin Intake</h3>
        <p className="text-sm text-slate-700 leading-relaxed">Open the engagement and navigate to the <strong>Intake</strong> tab. Work through each intake section, saving as you go. The more complete the intake, the more accurate the risk suggestions will be.</p>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
          <p className="text-xs font-semibold text-blue-800 mb-1">Tip: Use the Test Scenario Generator</p>
          <p className="text-xs text-blue-700">Super Admin and Compliance Admin users can use the Test Scenario Generator under Admin → Internal Tools to instantly create fully populated test scenarios without manual intake.</p>
        </div>
      </div>
    )
  },
  {
    id: 'clients',
    title: 'Client Management',
    icon: Users,
    content: (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Client Management</h2>
        <h3 className="text-base font-semibold text-slate-900">Creating Clients</h3>
        <p className="text-sm text-slate-700 leading-relaxed">Clients represent regulated entities that are the subject of an assessment or audit. A client record stores the legal name, industry, client type, primary jurisdiction, compliance contact, and team assignments.</p>
        <h3 className="text-base font-semibold text-slate-900 mt-4">Client Statuses</h3>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">Active</span><span className="text-sm text-slate-600">Current client with ongoing or potential engagement activity.</span></div>
          <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">Inactive</span><span className="text-sm text-slate-600">Client no longer requiring active work.</span></div>
          <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">Prospect</span><span className="text-sm text-slate-600">Prospective client not yet engaged.</span></div>
        </div>
        <h3 className="text-base font-semibold text-slate-900 mt-4">Deletion Rules</h3>
        <p className="text-sm text-slate-700 leading-relaxed">Only <strong>Super Admin</strong> and <strong>Compliance Admin</strong> users may delete clients. A client <strong>cannot be deleted</strong> if it has any active engagements (engagements with status other than Completed or Archived). Archive or complete all engagements first.</p>
        <h3 className="text-base font-semibold text-slate-900 mt-4">Client Detail View</h3>
        <p className="text-sm text-slate-700 leading-relaxed">Each client has a detail view showing all linked engagements, uploaded documents, associated tasks, and activity history.</p>
      </div>
    )
  },
  {
    id: 'engagement-workflow',
    title: 'Engagement Workflow',
    icon: FileStack,
    content: (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Engagement Workflow</h2>
        <h3 className="text-base font-semibold text-slate-900">Engagement Statuses</h3>
        <div className="space-y-1.5">
          {[
            ['Not Started', 'Engagement created but work has not begun.'],
            ['Intake In Progress', 'Intake questionnaire is being completed.'],
            ['Risk Analysis', 'Risk identification and scoring in progress.'],
            ['Draft Report', 'Report has been generated and is being reviewed.'],
            ['Under Review', 'Report submitted for reviewer approval.'],
            ['Completed', 'Engagement finalized and report delivered. Requires an Approved or Finalized report.'],
            ['Archived', 'Engagement archived for record-keeping. No longer active.'],
          ].map(([status, desc]) => (
            <div key={status} className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 flex-shrink-0">{status}</span>
              <span className="text-sm text-slate-600">{desc}</span>
            </div>
          ))}
        </div>
        <h3 className="text-base font-semibold text-slate-900 mt-4">Tab-by-Tab Workflow</h3>
        <div className="space-y-3">
          {[
            ['Intake', 'Complete all intake sections. The risk engine uses this data to generate suggested risks.'],
            ['Risks', 'Review suggested risks from the intake engine. Accept relevant risks, add custom risks from the library, and score each risk for likelihood and impact.'],
            ['Controls', 'For each accepted risk, assess whether controls are present, and rate their design, operational, and consistency effectiveness.'],
            ['Summary', 'Review the risk distribution chart and residual risk ratings by category.'],
            ['Report', 'Generate a draft report using AI. Edit each section, then move through the review lifecycle: Draft → Under Review → Approved → Finalized → Exported.'],
            ['Review', 'Reviewers submit approval decisions and comments. Approving the report enables Finalization.'],
          ].map(([tab, desc]) => (
            <div key={tab} className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-semibold text-slate-900">{tab}</p>
              <p className="text-xs text-slate-600 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
        <h3 className="text-base font-semibold text-slate-900 mt-4">Completion Requirements</h3>
        <p className="text-sm text-slate-700">An engagement cannot be marked <strong>Completed</strong> unless a report exists and its status is Approved, Finalized, or Exported.</p>
      </div>
    )
  },
  {
    id: 'risk-methodology',
    title: 'Risk Assessment Methodology',
    icon: BarChart2,
    content: (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Risk Assessment Methodology</h2>
        <p className="text-sm text-slate-700 leading-relaxed">Nightwatch supports three methodologies, each tailored to a specific client risk profile. The selected methodology controls which intake sections appear and which risks are suggested by the engine.</p>
        <div className="space-y-3">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-900">Standard AML EWRA</p>
            <p className="text-xs text-slate-600 mt-0.5">For general reporting entities under PCMLTFA. Covers all standard risk domains: products, delivery channels, clients, geography, third parties, and operational.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-900">Virtual Asset EWRA</p>
            <p className="text-xs text-slate-600 mt-0.5">For VASPs and cryptocurrency businesses. Includes an extended virtual asset module covering on-chain screening, travel rule, custody, and privacy asset considerations.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-900">Cash Business EWRA</p>
            <p className="text-xs text-slate-600 mt-0.5">For cash-intensive businesses including cheque cashing, currency exchange, and cash handling services. Includes a cash business module.</p>
          </div>
        </div>
        <h3 className="text-base font-semibold text-slate-900 mt-4">Risk Categories</h3>
        <div className="grid grid-cols-2 gap-2">
          {['Products', 'Delivery Channels', 'Clients', 'Geography', 'Technology', 'Sanctions', 'Third Parties', 'Operational'].map(cat => (
            <span key={cat} className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-700">{cat}</span>
          ))}
        </div>
        <h3 className="text-base font-semibold text-slate-900 mt-4">Risk Suggestion Engine</h3>
        <p className="text-sm text-slate-700 leading-relaxed">When intake sections are saved, the risk engine evaluates the responses against a set of rules to generate a list of suggested risks. Each suggestion includes a reason explaining which intake data triggered it. Analysts review suggestions and accept or reject them.</p>
      </div>
    )
  },
  {
    id: 'risk-scoring',
    title: 'Risk Scoring Model',
    icon: BarChart2,
    content: (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Risk Scoring Model</h2>
        <h3 className="text-base font-semibold text-slate-900">Likelihood</h3>
        <p className="text-sm text-slate-700 leading-relaxed">Likelihood reflects how probable it is that the risk could occur based on the business model, products, delivery channels, and client profile.</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-semibold">1 — Low</span><span className="text-sm text-slate-600">Unlikely to occur given the business context.</span></div>
          <div className="flex items-center gap-2"><span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-semibold">2 — Moderate</span><span className="text-sm text-slate-600">Reasonably possible given the business model.</span></div>
          <div className="flex items-center gap-2"><span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-semibold">3 — High</span><span className="text-sm text-slate-600">Highly probable based on the business profile.</span></div>
        </div>
        <h3 className="text-base font-semibold text-slate-900 mt-4">Impact</h3>
        <p className="text-sm text-slate-700 leading-relaxed">Impact reflects the potential regulatory, financial, operational, or reputational consequences if the risk materializes.</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-semibold">1 — Low</span><span className="text-sm text-slate-600">Minimal regulatory or financial exposure.</span></div>
          <div className="flex items-center gap-2"><span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-semibold">2 — Moderate</span><span className="text-sm text-slate-600">Significant exposure requiring management attention.</span></div>
          <div className="flex items-center gap-2"><span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-semibold">3 — High</span><span className="text-sm text-slate-600">Material exposure with potential for significant regulatory action.</span></div>
        </div>
        <h3 className="text-base font-semibold text-slate-900 mt-4">Inherent Risk</h3>
        <p className="text-sm text-slate-700 leading-relaxed">Inherent risk is calculated as <strong>Likelihood × Impact</strong>. Scores of 1–2 = Low, 3–4 = Moderate, 6–9 = High.</p>
        <div className="overflow-x-auto mt-2">
          <table className="text-xs w-full border border-slate-200 rounded-lg overflow-hidden">
            <thead><tr className="bg-slate-50"><th className="px-3 py-2 border-r border-slate-200">Likelihood \ Impact</th><th className="px-3 py-2 border-r border-slate-200">1 (Low)</th><th className="px-3 py-2 border-r border-slate-200">2 (Moderate)</th><th className="px-3 py-2">3 (High)</th></tr></thead>
            <tbody>
              <tr className="border-t border-slate-200"><td className="px-3 py-2 font-medium border-r border-slate-200">1 (Low)</td><td className="px-3 py-2 border-r border-slate-200 text-emerald-700 font-semibold text-center">Low (1)</td><td className="px-3 py-2 border-r border-slate-200 text-emerald-700 font-semibold text-center">Low (2)</td><td className="px-3 py-2 text-amber-700 font-semibold text-center">Moderate (3)</td></tr>
              <tr className="border-t border-slate-200"><td className="px-3 py-2 font-medium border-r border-slate-200">2 (Moderate)</td><td className="px-3 py-2 border-r border-slate-200 text-emerald-700 font-semibold text-center">Low (2)</td><td className="px-3 py-2 border-r border-slate-200 text-amber-700 font-semibold text-center">Moderate (4)</td><td className="px-3 py-2 text-red-700 font-semibold text-center">High (6)</td></tr>
              <tr className="border-t border-slate-200"><td className="px-3 py-2 font-medium border-r border-slate-200">3 (High)</td><td className="px-3 py-2 border-r border-slate-200 text-amber-700 font-semibold text-center">Moderate (3)</td><td className="px-3 py-2 border-r border-slate-200 text-red-700 font-semibold text-center">High (6)</td><td className="px-3 py-2 text-red-700 font-semibold text-center">High (9)</td></tr>
            </tbody>
          </table>
        </div>
        <h3 className="text-base font-semibold text-slate-900 mt-4">Residual Risk</h3>
        <p className="text-sm text-slate-700 leading-relaxed">Residual risk is the level of risk remaining after considering the effectiveness of applicable controls. It is derived from a matrix of Inherent Risk rating vs. Overall Control Effectiveness.</p>
        <div className="overflow-x-auto mt-2">
          <table className="text-xs w-full border border-slate-200 rounded-lg overflow-hidden">
            <thead><tr className="bg-slate-50"><th className="px-3 py-2 border-r border-slate-200">Inherent \ Controls</th><th className="px-3 py-2 border-r border-slate-200">Strong</th><th className="px-3 py-2 border-r border-slate-200">Partially Effective</th><th className="px-3 py-2">Weak</th></tr></thead>
            <tbody>
              {[['Low', 'Low', 'Low', 'Moderate'], ['Moderate', 'Low', 'Moderate', 'High'], ['High', 'Moderate', 'High', 'High']].map(([inherent, ...residuals]) => (
                <tr key={inherent} className="border-t border-slate-200">
                  <td className="px-3 py-2 font-medium border-r border-slate-200">{inherent}</td>
                  {residuals.map((r, i) => <td key={i} className={`px-3 py-2 text-center font-semibold border-r border-slate-200 last:border-r-0 ${r === 'High' ? 'text-red-700' : r === 'Moderate' ? 'text-amber-700' : 'text-emerald-700'}`}>{r}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  },
  {
    id: 'controls',
    title: 'Control Evaluation Guide',
    icon: Shield,
    content: (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Control Evaluation Guide</h2>
        <p className="text-sm text-slate-700 leading-relaxed">Controls are evaluated across three dimensions. The overall control rating is derived from these three assessments.</p>
        <div className="space-y-3">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-900">Design Adequacy</p>
            <p className="text-xs text-slate-600 mt-1">Is the control appropriately designed to mitigate the risk? Does it address the right threat vectors? Is the scope of the control adequate for the risk level?</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-900">Consistency of Application</p>
            <p className="text-xs text-slate-600 mt-1">Is the control applied consistently across the organization? Are there exceptions or gaps in application? Is the control applied uniformly across business units, channels, or staff?</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-900">Operational Performance</p>
            <p className="text-xs text-slate-600 mt-1">Is the control functioning in practice? Is there evidence of effective operation? Are there system failures, manual errors, or breakdowns in the control environment?</p>
          </div>
        </div>
        <h3 className="text-base font-semibold text-slate-900 mt-4">Effectiveness Ratings</h3>
        <div className="space-y-2">
          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50"><p className="text-sm font-semibold text-emerald-800">Strong</p><p className="text-xs text-emerald-700 mt-0.5">All three dimensions rated Strong. Control is well-designed and consistently operating effectively.</p></div>
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50"><p className="text-sm font-semibold text-amber-800">Partially Effective</p><p className="text-xs text-amber-700 mt-0.5">At least one dimension is Partially Effective but none are Weak. Control is operational but requires improvement.</p></div>
          <div className="p-3 rounded-lg border border-red-200 bg-red-50"><p className="text-sm font-semibold text-red-800">Weak</p><p className="text-xs text-red-700 mt-0.5">At least one dimension is Weak. Control has significant gaps and may not adequately mitigate the risk.</p></div>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
          <p className="text-xs font-semibold text-blue-800 mb-1">Calculating Residual Risk</p>
          <p className="text-xs text-blue-700">After rating all controls for a given risk, click "Calculate Residual" in the Controls tab. The system will determine the overall control effectiveness and derive the residual risk rating automatically.</p>
        </div>
      </div>
    )
  },
  {
    id: 'reports',
    title: 'Report Generation',
    icon: FileText,
    content: (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Report Generation</h2>
        <h3 className="text-base font-semibold text-slate-900">Generating a Draft</h3>
        <p className="text-sm text-slate-700 leading-relaxed">Navigate to the <strong>Report</strong> tab on any engagement and click <strong>Generate Draft Report</strong>. Nightwatch will use the engagement's risk data, control assessments, and residual risk ratings to generate a professionally written compliance report using AI.</p>
        <h3 className="text-base font-semibold text-slate-900 mt-4">Report Sections</h3>
        <div className="space-y-1">
          {['Executive Summary', 'Methodology', 'Risk Analysis', 'Control Assessment', 'Residual Risk Summary', 'Recommendations'].map(s => (
            <div key={s} className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-sm text-slate-700">{s}</span>
            </div>
          ))}
        </div>
        <h3 className="text-base font-semibold text-slate-900 mt-4">Report Lifecycle</h3>
        <div className="space-y-2">
          {[
            ['Draft', 'Initial generated report. Can be freely edited.'],
            ['Under Review', 'Report submitted for reviewer approval. Triggered by "Submit for Review" (requires reviewer assigned).'],
            ['Approved', 'Reviewer has approved the report. Finalization is now available.'],
            ['Finalized', 'Report locked. Export to PDF or Word is available.'],
            ['Exported', 'Report has been exported. Record retained in Nightwatch.'],
          ].map(([status, desc]) => (
            <div key={status} className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 flex-shrink-0 mt-0.5">{status}</span>
              <span className="text-sm text-slate-600">{desc}</span>
            </div>
          ))}
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mt-2">
          <p className="text-xs font-semibold text-amber-800 mb-1">Note: Methodology Document Generator</p>
          <p className="text-xs text-amber-700">A future version of Nightwatch will include a <strong>Methodology Document Generator</strong> that automatically produces a standardized methodology section in reports based on the selected methodology, scoring model, and control framework. This feature is planned for a future release.</p>
        </div>
      </div>
    )
  },
  {
    id: 'admin-guide',
    title: 'Admin Guide',
    icon: Settings,
    content: (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Admin Guide</h2>
        <p className="text-sm text-slate-700">The Admin section is accessible from the sidebar. It contains reference data and system configuration.</p>
        <div className="space-y-3">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-900">Methodologies</p>
            <p className="text-xs text-slate-600 mt-0.5">Create and manage assessment methodology profiles. Each methodology defines which risk categories, control framework, and scoring model apply to an engagement.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-900">Risk Library</p>
            <p className="text-xs text-slate-600 mt-0.5">The master list of AML risks. Each risk has a category, description, default scoring, and linked controls. The risk engine uses this library when generating suggestions from intake data.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-900">Control Library</p>
            <p className="text-xs text-slate-600 mt-0.5">The master list of AML controls. Controls are linked to risks and suggested during the control assessment phase of an engagement.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-900">Narrative Templates</p>
            <p className="text-xs text-slate-600 mt-0.5">Store standard compliance narrative text that can be referenced or reused in report sections. Organized by report section and methodology.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-900">Users</p>
            <p className="text-xs text-slate-600 mt-0.5">Manage team member roles. Available roles: Super Admin, Compliance Admin, Analyst, Reviewer. Role controls access to delete actions and admin features.</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
            <p className="text-sm font-semibold text-rose-900 flex items-center gap-1.5"><FlaskConical className="w-3.5 h-3.5" /> Test Scenario Generator</p>
            <p className="text-xs text-rose-700 mt-0.5">Internal tool for Super Admin and Compliance Admin. Generates complete fictional test scenarios (client, engagement, intake, risks, controls, tasks) in seconds. All test data is labeled and can be deleted cleanly.</p>
          </div>
        </div>
        <h3 className="text-base font-semibold text-slate-900 mt-4">Suggestions Queue</h3>
        <p className="text-sm text-slate-700">Analysts can submit new risk or control suggestions. Admins review submissions in the Suggestions Queue. Approved suggestions are automatically added to the respective library.</p>
        <h3 className="text-base font-semibold text-slate-900 mt-4">Audit Log</h3>
        <p className="text-sm text-slate-700">The Audit Log records system changes for accountability and compliance. Review it to track who created, modified, or deleted records.</p>
      </div>
    )
  },
];

export default function Help() {
  const [selectedTopic, setSelectedTopic] = useState('overview');
  const [search, setSearch] = useState('');

  const filteredTopics = TOPICS.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase())
  );

  const activeTopic = TOPICS.find(t => t.id === selectedTopic);

  return (
    <div>
      <PageHeader title="Help & Documentation" subtitle="Internal user guide for Great Horn AML Nightwatch" />

      <div className="flex gap-6">
        {/* Left nav */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-xl border border-slate-200/60 p-3 sticky top-20">
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input placeholder="Search topics..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
            </div>
            <div className="space-y-0.5">
              {filteredTopics.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTopic(t.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors ${selectedTopic === t.id ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <t.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{t.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile topic selector */}
        <div className="lg:hidden w-full">
          <div className="grid grid-cols-2 gap-2 mb-6">
            {TOPICS.map(t => (
              <button key={t.id} onClick={() => setSelectedTopic(t.id)}
                className={`p-3 rounded-lg border text-left text-xs font-medium transition-colors ${selectedTopic === t.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                {t.title}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-slate-200/60 p-6 lg:p-8">
            {activeTopic ? activeTopic.content : (
              <p className="text-sm text-slate-500">Select a topic from the left to read documentation.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}