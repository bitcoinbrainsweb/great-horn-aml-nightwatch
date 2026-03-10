import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const TEMPLATES = [
  {
    template_name: 'Executive Summary',
    section: 'Executive Summary',
    template_text: `This document presents the Enterprise-Wide Money Laundering, Terrorist Financing, and Sanctions Risk Assessment for {{client_name}}.

The purpose of this assessment is to evaluate the inherent risks associated with the organization's products, services, delivery channels, clients, geographic exposure, technologies, and third-party relationships. The assessment also evaluates the effectiveness of the controls and mitigation measures implemented to manage these risks.

This risk assessment follows a structured risk-based approach consistent with FINTRAC guidance and Canadian regulatory expectations. The methodology evaluates inherent risk before the application of controls and then assesses the effectiveness of the organization's mitigating measures to determine residual risk levels.

The results of this assessment inform the design and calibration of the organization's compliance program, including policies, procedures, transaction monitoring, sanctions screening, and reporting processes. The assessment also supports senior management oversight and ensures that controls remain proportionate to the organization's risk exposure.`,
    status: 'Active'
  },
  {
    template_name: 'Purpose and Scope',
    section: 'Methodology',
    template_text: `This Enterprise-Wide Risk Assessment evaluates the exposure of {{client_name}} to money laundering (ML), terrorist financing (TF), and sanctions risks across all aspects of its operations.

The assessment considers risks associated with:
• Products and services offered to clients
• Delivery channels used to access services
• Client types and business relationships
• Geographic exposure and jurisdictional risk
• Technologies and new developments
• Third-party service providers and operational partners

The assessment covers all operational activities, systems, and processes that support the organization's financial and virtual asset services. It includes both domestic and international activity and considers the potential exposure introduced by client behavior, transaction patterns, and technological systems.

The results of this assessment form the foundation of the organization's risk-based compliance program and support the development of policies, procedures, monitoring systems, and reporting controls.`,
    status: 'Active'
  },
  {
    template_name: 'Governance and Oversight',
    section: 'Methodology',
    template_text: `The Enterprise-Wide Risk Assessment is governed through {{client_name}}'s compliance framework and is subject to oversight by senior management.

Senior management is responsible for approving this assessment and ensuring that adequate resources, systems, and personnel are available to implement the controls and mitigation measures identified within this document.

The Compliance Officer is responsible for:
• Developing and maintaining the Enterprise-Wide Risk Assessment
• Evaluating inherent and residual risks across all operational areas
• Assessing the effectiveness of compliance controls
• Escalating material risk issues or control deficiencies to senior management
• Ensuring that risk assessment outcomes are reflected in policies, procedures, and training

Employees are responsible for understanding and complying with the controls and mitigation measures applicable to their roles and for escalating any unusual activity, operational risks, or control failures identified in the course of their duties.`,
    status: 'Active'
  },
  {
    template_name: 'Risk Assessment Methodology',
    section: 'Methodology',
    template_text: `{{client_name}} applies a structured risk-based methodology to identify, assess, and manage money laundering, terrorist financing, and sanctions risks across its operations.

The methodology follows a multi-step process:

1. Risk Identification
Potential risks are identified across products, services, delivery channels, client types, geographic exposure, technologies, and third-party relationships.

2. Inherent Risk Assessment
Each identified risk factor is evaluated to determine its inherent level of exposure before considering controls.

3. Control Evaluation
Existing controls and mitigation measures are evaluated to determine their effectiveness in managing the identified risks.

4. Residual Risk Determination
Residual risk is determined by combining inherent risk ratings with the assessed effectiveness of the organization's controls.

5. Documentation and Review
All risk ratings and supporting rationales are documented and reviewed to ensure accuracy and consistency.

This methodology ensures that {{client_name}} maintains a comprehensive understanding of its risk exposure and applies proportionate controls consistent with regulatory expectations.`,
    status: 'Active'
  },
  {
    template_name: 'Risk Scoring Framework',
    section: 'Methodology',
    template_text: `Risk ratings are determined using a structured scoring framework that evaluates both likelihood and impact.

Likelihood reflects the probability that a risk event may occur based on the organization's operational activities, client exposure, and transaction patterns.

Impact reflects the potential regulatory, operational, financial, or reputational consequences that may arise if the risk materializes.

Inherent Risk Score = Likelihood × Impact

The resulting score determines the inherent risk rating:

Low Risk – limited likelihood or minimal potential impact
Moderate Risk – plausible likelihood with meaningful operational consequences
High Risk – significant exposure with potential regulatory or financial consequences

Control effectiveness is assessed separately to determine whether the organization's controls are sufficient to mitigate identified risks.`,
    status: 'Active'
  },
  {
    template_name: 'Control Effectiveness Assessment',
    section: 'Control Assessment',
    template_text: `Controls and mitigation measures are evaluated to determine their effectiveness in managing identified risks.

Control effectiveness is assessed based on three key factors:

• Design Adequacy – whether the control is appropriately designed to address the identified risk
• Consistency of Application – whether the control is applied consistently across relevant operations
• Operational Performance – whether the control operates effectively in practice

Each control is assigned an effectiveness rating of:

Strong – controls are well designed, consistently applied, and operating effectively
Moderate – controls address the risk but may contain minor weaknesses
Weak – controls are insufficient, inconsistently applied, or not operating effectively

These ratings inform the determination of residual risk.`,
    status: 'Active'
  },
  {
    template_name: 'Products and Services Risk',
    section: 'Risk Analysis',
    template_text: `This section evaluates the inherent risks associated with the products and services offered by {{client_name}}.

Certain financial and virtual asset products may present elevated exposure to money laundering or terrorist financing due to transaction speed, global reach, or reduced transparency.

The assessment considers the structure and functionality of each product and evaluates how the organization's controls mitigate the associated risks.`,
    status: 'Active'
  },
  {
    template_name: 'Delivery Channel Risk',
    section: 'Risk Analysis',
    template_text: `Delivery channels refer to the methods through which clients access services and initiate transactions.

Channels such as online platforms, APIs, or third-party integrations may introduce additional risks where services are delivered without face-to-face interaction or where operational processes rely on external systems.

This section evaluates the inherent risks associated with each delivery channel and the controls used to manage those risks.`,
    status: 'Active'
  },
  {
    template_name: 'Client Risk',
    section: 'Risk Analysis',
    template_text: `Client risk evaluates the characteristics of individuals and entities that use the services of {{client_name}}.

Certain client profiles may present elevated risk due to their business activities, geographic connections, or ownership structures.

This section evaluates the nature of client relationships and assesses the effectiveness of due diligence controls used to manage potential risks.`,
    status: 'Active'
  },
  {
    template_name: 'Geographic Risk',
    section: 'Risk Analysis',
    template_text: `Geographic exposure may introduce additional risk where clients, counterparties, or transactions involve jurisdictions with higher levels of financial crime or weaker regulatory controls.

This section evaluates the geographic footprint of {{client_name}} and assesses the potential risks associated with domestic and international operations.`,
    status: 'Active'
  },
  {
    template_name: 'Technology Risk',
    section: 'Risk Analysis',
    template_text: `Technology systems support critical compliance functions including client onboarding, transaction monitoring, sanctions screening, and reporting.

This section evaluates the risks associated with system integrity, automation, third-party integrations, and technological changes that may affect the effectiveness of AML controls.`,
    status: 'Active'
  },
  {
    template_name: 'Residual Risk Summary',
    section: 'Residual Risk Summary',
    template_text: `Residual risk represents the level of risk that remains after the application of the organization's controls and mitigation measures.

The residual risk ratings identified in this assessment reflect the combined evaluation of inherent risks and the effectiveness of the organization's compliance controls.

Where residual risks remain elevated, additional monitoring, enhanced due diligence, or strengthened controls may be implemented to ensure risks remain within the organization's defined risk tolerance.`,
    status: 'Active'
  },
  {
    template_name: 'Conclusion',
    section: 'Recommendations',
    template_text: `This Enterprise-Wide Risk Assessment provides a comprehensive evaluation of the money laundering, terrorist financing, and sanctions risks associated with the operations of {{client_name}}.

The results demonstrate that the organization has implemented a structured risk-based approach that identifies inherent risks, evaluates control effectiveness, and applies appropriate mitigation measures.

The assessment will be reviewed periodically and updated where material changes occur in the organization's operations, products, client base, geographic exposure, or regulatory environment.`,
    status: 'Active'
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || !['admin', 'super_admin', 'compliance_admin'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const existing = await base44.asServiceRole.entities.NarrativeTemplate.list();
    const existingMap = new Map(existing.map(t => [t.template_name, t]));
    
    const created = [];
    const skipped = [];
    const updated = [];

    for (const template of TEMPLATES) {
      const existingTemplate = existingMap.get(template.template_name);
      
      if (!existingTemplate) {
        // Create new template
        const newTemplate = await base44.asServiceRole.entities.NarrativeTemplate.create(template);
        created.push(template.template_name);
      } else if (!existingTemplate.template_text || existingTemplate.template_text.length < 50) {
        // Update empty/placeholder templates
        await base44.asServiceRole.entities.NarrativeTemplate.update(existingTemplate.id, {
          template_text: template.template_text,
          section: template.section
        });
        updated.push(template.template_name);
      } else {
        // Skip existing strong templates
        skipped.push(template.template_name);
      }
    }

    return Response.json({
      success: true,
      created: created.length,
      updated: updated.length,
      skipped: skipped.length,
      details: { created, updated, skipped }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});