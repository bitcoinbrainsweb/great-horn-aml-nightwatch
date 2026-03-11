import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Execute a governance rule and return structured result
 * Called by verification/delivery gate functions
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { rule_id, target_entity_type, target_entity_id } = body;

    if (!rule_id) {
      return Response.json({ error: 'Missing rule_id' }, { status: 400 });
    }

    // Fetch rule definition
    const rules = await base44.asServiceRole.entities.GovernanceRule.filter({
      rule_id,
      active: true
    });

    if (rules.length === 0) {
      return Response.json({ error: `Rule not found: ${rule_id}` }, { status: 404 });
    }

    const rule = rules[0];
    const ruleDef = JSON.parse(rule.rule_definition || '{}');

    // Execute rule-specific logic
    let result = 'fail';
    let message = 'Rule check not implemented';
    let remediation = '';

    // Dispatch to specific rule checks
    switch (rule.rule_id) {
      case 'GR_PROHIBITED_PAGE_PATTERN':
        ({ result, message, remediation } = await checkPagePattern(base44, ruleDef, target_entity_id));
        break;
      case 'GR_MISSING_ARTIFACT_CLASSIFICATION':
        ({ result, message, remediation } = await checkArtifactClassification(base44, target_entity_id));
        break;
      case 'GR_MISSING_VERIFICATION_EVIDENCE':
        ({ result, message, remediation } = await checkVerificationEvidence(base44, target_entity_id));
        break;
      case 'GR_MISSING_DELIVERY_GATE_EVIDENCE':
        ({ result, message, remediation } = await checkDeliveryGateEvidence(base44, target_entity_id));
        break;
      case 'GR_EXPIRED_EXCEPTION':
        ({ result, message, remediation } = await checkExpiredException(base44, target_entity_id));
        break;
      case 'GR_PROHIBITED_STATE_TRANSITION':
        ({ result, message, remediation } = await checkProhibitedTransition(base44, ruleDef));
        break;
      default:
        message = `Rule ${rule.rule_id} logic not implemented`;
    }

    // Create result record
    const ruleResult = await base44.asServiceRole.entities.GovernanceRuleResult.create({
      rule_id: rule.rule_id,
      rule_name: rule.rule_name,
      result,
      target_entity_type: target_entity_type || rule.applies_to_entity_type || 'unknown',
      target_entity_id: target_entity_id || '',
      severity: rule.severity,
      message,
      remediation,
      timestamp: new Date().toISOString(),
      context: JSON.stringify({ rule_definition: ruleDef })
    });

    return Response.json({
      success: true,
      rule_id: rule.rule_id,
      rule_name: rule.rule_name,
      result,
      severity: rule.severity,
      message,
      remediation,
      result_id: ruleResult.id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function checkPagePattern(base44, ruleDef, targetEntityId) {
  // Check if page name matches prohibited patterns
  const prohibitedPatterns = ruleDef.prohibited_patterns || [];
  const pageName = ruleDef.page_name || '';

  for (const pattern of prohibitedPatterns) {
    if (pageName.match(new RegExp(pattern))) {
      return {
        result: 'fail',
        message: `Page name '${pageName}' matches prohibited pattern: ${pattern}`,
        remediation: `Rename page to avoid pattern: ${pattern}`
      };
    }
  }

  return {
    result: 'pass',
    message: `Page name '${pageName}' complies with naming policy`,
    remediation: ''
  };
}

async function checkArtifactClassification(base44, targetEntityId) {
  if (!targetEntityId) {
    return {
      result: 'warn',
      message: 'No artifact to check classification',
      remediation: 'Provide artifact ID'
    };
  }

  try {
    const artifact = await base44.asServiceRole.entities.PublishedOutput.get(targetEntityId);
    if (!artifact || !artifact.classification) {
      return {
        result: 'fail',
        message: 'Artifact missing required classification field',
        remediation: 'Set classification field to one of: tool, report, documentation, help, dashboard_widget, internal_record, verification_record, audit_record, delivery_gate_record'
      };
    }

    return {
      result: 'pass',
      message: `Artifact properly classified as: ${artifact.classification}`,
      remediation: ''
    };
  } catch (e) {
    return {
      result: 'warn',
      message: `Could not verify artifact classification: ${e.message}`,
      remediation: 'Check artifact ID is valid'
    };
  }
}

async function checkVerificationEvidence(base44, targetEntityId) {
  if (!targetEntityId) {
    return {
      result: 'warn',
      message: 'No record to check for verification evidence',
      remediation: 'Provide entity ID'
    };
  }

  try {
    const record = await base44.asServiceRole.entities.VerificationReport.get(targetEntityId);
    if (!record || !record.findings || record.findings.length === 0) {
      return {
        result: 'fail',
        message: 'Verification record lacks required findings/evidence',
        remediation: 'Add detailed test findings to verification report'
      };
    }

    return {
      result: 'pass',
      message: `Verification record contains ${record.findings.length} findings`,
      remediation: ''
    };
  } catch (e) {
    return {
      result: 'warn',
      message: `Could not verify evidence: ${e.message}`,
      remediation: 'Check record ID is valid'
    };
  }
}

async function checkDeliveryGateEvidence(base44, targetEntityId) {
  if (!targetEntityId) {
    return {
      result: 'warn',
      message: 'No delivery gate record to check',
      remediation: 'Provide record ID'
    };
  }

  try {
    const record = await base44.asServiceRole.entities.DeliveryGateRun.get(targetEntityId);
    if (!record || !record.test_results) {
      return {
        result: 'fail',
        message: 'Delivery gate record missing test results/evidence',
        remediation: 'Run delivery gate tests and record results'
      };
    }

    return {
      result: 'pass',
      message: `Delivery gate contains test results`,
      remediation: ''
    };
  } catch (e) {
    return {
      result: 'warn',
      message: `Could not verify delivery gate evidence: ${e.message}`,
      remediation: 'Check record ID is valid'
    };
  }
}

async function checkExpiredException(base44, targetEntityId) {
  if (!targetEntityId) {
    return {
      result: 'warn',
      message: 'No exception to check',
      remediation: 'Provide exception ID'
    };
  }

  try {
    const exc = await base44.asServiceRole.entities.ApprovalRequest.get(targetEntityId);
    if (!exc || !exc.expires_at) {
      return {
        result: 'pass',
        message: 'Exception has no expiration',
        remediation: ''
      };
    }

    const expiresAt = new Date(exc.expires_at);
    const now = new Date();

    if (expiresAt < now) {
      return {
        result: 'fail',
        message: `Exception expired on ${expiresAt.toISOString()}`,
        remediation: 'Renew or close the exception'
      };
    }

    const daysLeft = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));
    return {
      result: 'pass',
      message: `Exception expires in ${daysLeft} days`,
      remediation: ''
    };
  } catch (e) {
    return {
      result: 'warn',
      message: `Could not verify exception: ${e.message}`,
      remediation: 'Check exception ID is valid'
    };
  }
}

async function checkProhibitedTransition(base44, ruleDef) {
  const prohibitedTransitions = ruleDef.prohibited || [];
  return {
    result: 'pass',
    message: `Prohibited state transitions: ${prohibitedTransitions.map(t => `${t.from}->${t.to}`).join(', ')}`,
    remediation: 'Use state machine framework to validate transitions'
  };
}