/**
 * NW-UPGRADE-026: Workflow State Validation
 * 
 * Enforces deterministic lifecycle rules across governance entities.
 * Validates state transitions and business rule compliance.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity_type, entity_id, current_state, new_state, action_type } = await req.json();

    const validationResult = await validateTransition(
      base44,
      entity_type,
      entity_id,
      current_state,
      new_state,
      action_type
    );

    return Response.json(validationResult);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function validateTransition(base44, entityType, entityId, currentState, newState, actionType) {
  const rules = WORKFLOW_RULES[entityType];
  if (!rules) {
    return { valid: true, message: 'No workflow rules defined' };
  }

  // TestCycle validation
  if (entityType === 'TestCycle') {
    if (currentState === 'Complete' || currentState === 'Archived') {
      return {
        valid: false,
        message: `Cannot modify ${currentState} test cycles`
      };
    }

    if (newState === 'Complete') {
      // Check if all tests are completed
      const tests = await base44.entities.ControlTest.filter({ test_cycle_id: entityId });
      const incompleteTests = tests.filter(t => t.status !== 'Completed' && t.status !== 'Reviewed');
      if (incompleteTests.length > 0) {
        return {
          valid: false,
          message: `Cannot complete cycle: ${incompleteTests.length} tests are not completed`
        };
      }
    }
  }

  // ControlTest validation
  if (entityType === 'ControlTest') {
    if (actionType === 'create' || actionType === 'update') {
      const cycle = await base44.entities.TestCycle.get(entityId);
      if (cycle && cycle.status !== 'Active' && cycle.status !== 'Draft') {
        return {
          valid: false,
          message: `Cannot create or edit tests in ${cycle.status} test cycle`
        };
      }
    }

    if (actionType === 'attach_evidence' && currentState !== 'In Progress' && currentState !== 'Completed') {
      return {
        valid: false,
        message: 'Evidence can only be attached when test is In Progress or Completed'
      };
    }

    if (newState === 'Completed' && currentState !== 'In Progress') {
      return {
        valid: false,
        message: 'Test must be In Progress before marking as Completed'
      };
    }
  }

  // Finding validation
  if (entityType === 'Finding') {
    if (currentState === 'Closed') {
      return {
        valid: false,
        message: 'Cannot modify closed findings'
      };
    }

    if (newState === 'Resolved') {
      const remediations = await base44.entities.RemediationAction.filter({ finding_id: entityId });
      if (remediations.length === 0) {
        return {
          valid: false,
          message: 'Cannot resolve finding without remediation actions'
        };
      }
      const incompleteRemediations = remediations.filter(r => r.status !== 'Completed' && r.status !== 'Verified');
      if (incompleteRemediations.length > 0) {
        return {
          valid: false,
          message: 'All remediation actions must be completed before resolving finding'
        };
      }
    }
  }

  // RemediationAction validation
  if (entityType === 'RemediationAction') {
    if (currentState === 'Verified') {
      return {
        valid: false,
        message: 'Cannot modify verified remediation actions'
      };
    }

    if (newState === 'Verified' && currentState !== 'Completed') {
      return {
        valid: false,
        message: 'Remediation must be Completed before Verified'
      };
    }
  }

  // EngagementRisk validation
  if (entityType === 'EngagementRisk') {
    if (actionType === 'delete' && currentState === 'Active') {
      // Check if risk has linked controls or tests
      const engagementId = entityId; // simplified - in production would get from entity
      const controlTests = await base44.asServiceRole.entities.ControlTest.filter({});
      const linkedTests = controlTests.filter(t => {
        try {
          const snapshot = JSON.parse(t.control_snapshot || '{}');
          return snapshot.linked_risk_ids?.includes(entityId);
        } catch {
          return false;
        }
      });
      
      if (linkedTests.length > 0) {
        return {
          valid: false,
          message: 'Cannot delete risk with linked controls or tests. Set to Retired instead.'
        };
      }
    }
  }

  return { valid: true, message: 'Transition valid' };
}

const WORKFLOW_RULES = {
  TestCycle: {
    states: ['Draft', 'Active', 'Complete', 'Archived'],
    transitions: {
      Draft: ['Active', 'Archived'],
      Active: ['Complete', 'Archived'],
      Complete: ['Archived'],
      Archived: []
    },
    immutable_states: ['Complete', 'Archived']
  },
  ControlTest: {
    states: ['Planned', 'In Progress', 'Completed'],
    transitions: {
      Planned: ['In Progress', 'Completed'],
      'In Progress': ['Completed'],
      Completed: []
    },
    immutable_states: ['Completed']
  },
  Finding: {
    states: ['Open', 'Under Review', 'Resolved', 'Closed'],
    transitions: {
      Open: ['Under Review', 'Resolved', 'Closed'],
      'Under Review': ['Resolved', 'Closed'],
      Resolved: ['Closed'],
      Closed: []
    },
    immutable_states: ['Closed']
  },
  RemediationAction: {
    states: ['Planned', 'In Progress', 'Completed', 'Verified'],
    transitions: {
      Planned: ['In Progress', 'Completed'],
      'In Progress': ['Completed'],
      Completed: ['Verified'],
      Verified: []
    },
    immutable_states: ['Verified']
  },
  EngagementRisk: {
    states: ['Active', 'Retired'],
    transitions: {
      Active: ['Retired'],
      Retired: []
    },
    immutable_states: ['Retired']
  }
};