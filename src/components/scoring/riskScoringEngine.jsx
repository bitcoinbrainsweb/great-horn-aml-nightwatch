// Great Horn AML Risk Scoring Engine

export const LIKELIHOOD_SCALE = {
  1: 'Low',
  2: 'Moderate',
  3: 'High'
};

export const IMPACT_SCALE = {
  1: 'Low',
  2: 'Moderate',
  3: 'High'
};

export function calculateInherentRisk(likelihood, impact) {
  const score = likelihood * impact;
  let rating;
  if (score <= 2) rating = 'Low';
  else if (score <= 4) rating = 'Moderate';
  else rating = 'High';
  return { score, rating };
}

export function calculateControlEffectiveness(design, consistency, operational) {
  const factors = [design, consistency, operational];
  if (factors.some(f => f === 'Weak')) return 'Weak';
  if (factors.every(f => f === 'Strong')) return 'Strong';
  return 'Partially Effective';
}

const RESIDUAL_MATRIX = {
  'Low-Strong': 'Low',
  'Low-Partially Effective': 'Low',
  'Low-Weak': 'Moderate',
  'Moderate-Strong': 'Low',
  'Moderate-Partially Effective': 'Moderate',
  'Moderate-Weak': 'High',
  'High-Strong': 'Moderate',
  'High-Partially Effective': 'High',
  'High-Weak': 'High'
};

export function calculateResidualRisk(inherentRating, controlEffectiveness) {
  const key = `${inherentRating}-${controlEffectiveness}`;
  return RESIDUAL_MATRIX[key] || 'Not Rated';
}

export function getRiskColor(rating) {
  switch (rating) {
    case 'Low': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    case 'Moderate': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    case 'High': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
    default: return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' };
  }
}

export function getStatusColor(status) {
  const colors = {
    'Not Started': 'bg-slate-100 text-slate-600',
    'Intake In Progress': 'bg-blue-50 text-blue-700',
    'Risk Analysis': 'bg-purple-50 text-purple-700',
    'Draft Report': 'bg-amber-50 text-amber-700',
    'Under Review': 'bg-orange-50 text-orange-700',
    'Completed': 'bg-emerald-50 text-emerald-700',
    'In Progress': 'bg-blue-50 text-blue-700',
    'Waiting Review': 'bg-orange-50 text-orange-700',
    'Overdue': 'bg-red-50 text-red-700',
    'Active': 'bg-emerald-50 text-emerald-700',
    'Inactive': 'bg-slate-100 text-slate-600',
    'Prospect': 'bg-blue-50 text-blue-700',
    'Draft': 'bg-slate-100 text-slate-600',
    'Final': 'bg-emerald-50 text-emerald-700',
    'Delivered': 'bg-emerald-50 text-emerald-700',
    'Approved': 'bg-emerald-50 text-emerald-700',
    'Changes Requested': 'bg-amber-50 text-amber-700',
    'Rejected': 'bg-red-50 text-red-700',
    'Pending': 'bg-amber-50 text-amber-700',
  };
  return colors[status] || 'bg-slate-100 text-slate-600';
}

export function getPriorityColor(priority) {
  const colors = {
    'Low': 'bg-slate-100 text-slate-600',
    'Medium': 'bg-blue-50 text-blue-700',
    'High': 'bg-orange-50 text-orange-700',
    'Critical': 'bg-red-50 text-red-700',
  };
  return colors[priority] || 'bg-slate-100 text-slate-600';
}

// Default tasks by engagement type
export const DEFAULT_TASKS = {
  'Risk Assessment': [
    { task_name: 'Complete Intake', task_type: 'Intake', sort_order: 1 },
    { task_name: 'Risk Analysis', task_type: 'Analysis', sort_order: 2 },
    { task_name: 'Draft Report', task_type: 'Drafting', sort_order: 3 },
    { task_name: 'Internal Review', task_type: 'Review', sort_order: 4 },
    { task_name: 'Final Delivery', task_type: 'Delivery', sort_order: 5 },
  ],
  'Compliance Audit': [
    { task_name: 'Gather Inputs', task_type: 'Intake', sort_order: 1 },
    { task_name: 'Complete Audit Review', task_type: 'Analysis', sort_order: 2 },
    { task_name: 'Draft Audit Report', task_type: 'Drafting', sort_order: 3 },
    { task_name: 'Internal Review', task_type: 'Review', sort_order: 4 },
    { task_name: 'Final Delivery', task_type: 'Delivery', sort_order: 5 },
  ],
  'Policy Package': [
    { task_name: 'Gather Business Information', task_type: 'Intake', sort_order: 1 },
    { task_name: 'Draft Policy Package', task_type: 'Drafting', sort_order: 2 },
    { task_name: 'Internal Review', task_type: 'Review', sort_order: 3 },
    { task_name: 'Revise Package', task_type: 'Drafting', sort_order: 4 },
    { task_name: 'Final Delivery', task_type: 'Delivery', sort_order: 5 },
  ],
};

// Risk suggestion rules
export function suggestRisksFromIntake(intakeResponses) {
  const suggestions = [];
  const r = {};
  
  // Flatten all intake responses into a single object
  if (Array.isArray(intakeResponses)) {
    intakeResponses.forEach(section => {
      if (section.responses) {
        Object.assign(r, section.responses);
      }
    });
  } else if (intakeResponses && typeof intakeResponses === 'object') {
    Object.assign(r, intakeResponses);
  }

  // Products & Services
  if (r.handles_virtual_assets === true || r.handles_virtual_assets === 'yes') {
    suggestions.push({ risk_name: 'Virtual Asset Trading Services', reason: 'Business handles virtual assets' });
    suggestions.push({ risk_name: 'Virtual Asset Custody', reason: 'Business handles virtual assets' });
  }
  if (r.accepts_cash === true || r.accepts_cash === 'yes') {
    suggestions.push({ risk_name: 'Cash Handling Services', reason: 'Business accepts cash' });
  }
  if (r.offers_cheque_cashing === true || r.offers_cheque_cashing === 'yes') {
    suggestions.push({ risk_name: 'Cheque Cashing', reason: 'Business offers cheque cashing' });
  }
  if (r.offers_cross_border_services === true || r.offers_cross_border_services === 'yes') {
    suggestions.push({ risk_name: 'Cross-Border Payments', reason: 'Business offers cross-border services' });
    suggestions.push({ risk_name: 'Cross-Border Transaction Activity', reason: 'Cross-border services offered' });
    suggestions.push({ risk_name: 'Customers Located in High-Risk Jurisdictions', reason: 'Cross-border activity may involve high-risk jurisdictions' });
  }
  if (r.offers_remittances === true || r.offers_remittances === 'yes') {
    suggestions.push({ risk_name: 'Remittance Services', reason: 'Business offers remittances' });
  }
  if (r.offers_payment_processing === true || r.offers_payment_processing === 'yes') {
    suggestions.push({ risk_name: 'Payment Processing Services', reason: 'Business offers payment processing' });
  }

  // Delivery Channels
  if (r.onboarding_fully_remote === true || r.onboarding_fully_remote === 'yes') {
    suggestions.push({ risk_name: 'Non-Face-to-Face Onboarding', reason: 'Onboarding is fully remote' });
  }
  if (r.transactions_through_api === true || r.transactions_through_api === 'yes') {
    suggestions.push({ risk_name: 'API Transaction Access', reason: 'Transactions initiated through API' });
  }
  if (r.services_through_agents === true || r.services_through_agents === 'yes') {
    suggestions.push({ risk_name: 'Third-Party Onboarding Agents', reason: 'Services offered through agents/intermediaries' });
    suggestions.push({ risk_name: 'Agent Networks', reason: 'Agent or intermediary network used' });
  }
  if (r.services_offered_online === true || r.services_offered_online === 'yes') {
    suggestions.push({ risk_name: 'Fully Online Service Delivery', reason: 'Services offered online' });
  }
  if (r.white_label_channels === true || r.white_label_channels === 'yes') {
    suggestions.push({ risk_name: 'White-Label Services', reason: 'White-label or embedded channels used' });
    suggestions.push({ risk_name: 'Embedded Financial Services', reason: 'Embedded channels present' });
  }

  // Clients
  if (r.client_base === 'both' || r.client_base === 'businesses') {
    suggestions.push({ risk_name: 'Corporate Customers', reason: 'Business serves corporate/entity customers' });
  }
  if (r.customers_msbs === true || r.customers_msbs === 'yes') {
    suggestions.push({ risk_name: 'Money Service Business Clients', reason: 'Customers include MSBs' });
    suggestions.push({ risk_name: 'Financial Institution Clients', reason: 'Customers include financial institutions' });
  }
  if (r.customers_virtual_asset === true || r.customers_virtual_asset === 'yes') {
    suggestions.push({ risk_name: 'Virtual Asset Business Clients', reason: 'Customers include virtual asset businesses' });
  }
  if (r.peps_permitted === true || r.peps_permitted === 'yes') {
    suggestions.push({ risk_name: 'Politically Exposed Persons', reason: 'PEPs are permitted as customers' });
    suggestions.push({ risk_name: 'Foreign Politically Exposed Persons', reason: 'PEPs permitted' });
  }
  if (r.customers_charities === true || r.customers_charities === 'yes') {
    suggestions.push({ risk_name: 'Charities or NPO Clients', reason: 'Customers include charities/NPOs' });
  }
  if (r.customers_cash_intensive === true || r.customers_cash_intensive === 'yes') {
    suggestions.push({ risk_name: 'Cash-Intensive Businesses', reason: 'Customers include cash-intensive businesses' });
  }
  if (r.entity_foreign_bos === true || r.entity_foreign_bos === 'yes') {
    suggestions.push({ risk_name: 'Foreign Beneficial Owners', reason: 'Entity clients may have foreign beneficial owners' });
    suggestions.push({ risk_name: 'Complex Ownership Structures', reason: 'Foreign beneficial owners suggest complex structures' });
  }

  // Geography
  if (r.high_risk_jurisdictions === true || r.high_risk_jurisdictions === 'yes') {
    suggestions.push({ risk_name: 'Customers Located in High-Risk Jurisdictions', reason: 'High-risk/sanctioned jurisdictions are relevant' });
    suggestions.push({ risk_name: 'Customers Located in Sanctioned Jurisdictions', reason: 'Sanctioned jurisdictions identified as relevant' });
    suggestions.push({ risk_name: 'High Corruption Jurisdictions', reason: 'High-risk jurisdictions may include high corruption areas' });
  }

  // AML Program weaknesses
  if (r.sanctions_screening === false || r.sanctions_screening === 'no') {
    suggestions.push({ risk_name: 'Sanctions Screening System Failure', reason: 'Sanctions screening is not performed' });
    suggestions.push({ risk_name: 'Manual Sanctions Review Errors', reason: 'No automated sanctions screening' });
  }
  if (r.compliance_officer === false || r.compliance_officer === 'no') {
    suggestions.push({ risk_name: 'Lack of Dedicated Compliance Officer', reason: 'No designated compliance officer' });
  }
  if (r.aml_policies === false || r.aml_policies === 'no') {
    suggestions.push({ risk_name: 'Inadequate AML Policies', reason: 'AML policies not documented' });
  }
  if (r.recordkeeping === false || r.recordkeeping === 'no') {
    suggestions.push({ risk_name: 'Inadequate Recordkeeping', reason: 'Recordkeeping not documented/standardized' });
  }
  if (r.staff_training === false || r.staff_training === 'no') {
    suggestions.push({ risk_name: 'Insufficient Employee Training', reason: 'Staff AML training not conducted' });
  }

  // Third parties
  if (r.third_party_kyc === true || r.third_party_kyc === 'yes') {
    suggestions.push({ risk_name: 'Third-Party KYC Provider Dependence', reason: 'Third-party KYC provider used' });
  }
  if (r.third_party_tm === true || r.third_party_tm === 'yes') {
    suggestions.push({ risk_name: 'Third-Party Transaction Monitoring Tools', reason: 'Third-party TM tools used' });
  }
  if (r.liquidity_providers === true || r.liquidity_providers === 'yes') {
    suggestions.push({ risk_name: 'Reliance on Liquidity Providers', reason: 'Liquidity providers used' });
  }
  if (r.banking_partners === true || r.banking_partners === 'yes') {
    suggestions.push({ risk_name: 'Reliance on Banking Partners', reason: 'Banking partners relied on' });
  }

  // Technology
  if (r.internally_developed_software === true || r.internally_developed_software === 'yes') {
    suggestions.push({ risk_name: 'Reliance on Automated Systems', reason: 'Relies on internally developed software' });
  }
  if (r.mfa === false || r.mfa === 'no') {
    suggestions.push({ risk_name: 'Cybersecurity Vulnerabilities', reason: 'Multi-factor authentication not used' });
    suggestions.push({ risk_name: 'Unauthorized System Access', reason: 'No MFA in place' });
  }

  // Deduplicate by risk_name
  const seen = new Set();
  return suggestions.filter(s => {
    if (seen.has(s.risk_name)) return false;
    seen.add(s.risk_name);
    return true;
  });
}