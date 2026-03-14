import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * NW-UPGRADE-075A: Create Test Automation User
 * 
 * Creates the dedicated automation test user: tester@nightwatch.internal
 * This user has read-only access for Browser Use smoke tests.
 * 
 * ADMIN-ONLY FUNCTION
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only check
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return Response.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const testEmail = 'tester@nightwatch.internal';

    // Check if user already exists
    const existingUsers = await base44.asServiceRole.entities.User.filter({ email: testEmail });
    
    if (existingUsers.length > 0) {
      return Response.json({
        success: true,
        message: 'Test automation user already exists',
        user: {
          email: existingUsers[0].email,
          role: existingUsers[0].role,
          account_label: existingUsers[0].account_label
        }
      });
    }

    // Create invitation for the test user
    // Note: Base44 requires users to be invited before they can be created
    const invitation = await base44.asServiceRole.entities.UserInvitation.create({
      email: testEmail,
      role: 'test_automation',
      status: 'Active',
      invited_by: user.email,
      notes: 'NW-UPGRADE-075A: Automated test user for Browser Use smoke tests. Read-only access.'
    });

    // Update user metadata once they complete registration
    // Since we can't create User records directly, we document the expected setup
    const setupInstructions = {
      email: testEmail,
      role: 'test_automation',
      account_label: 'AUTOMATION TEST ACCOUNT',
      full_name: 'Nightwatch Automation Tester',
      notes: 'This account is used exclusively for Browser Use smoke tests. Read-only access to all pages.'
    };

    return Response.json({
      success: true,
      message: 'Test automation user invitation created',
      invitation_id: invitation.id,
      setup_instructions: setupInstructions,
      next_steps: [
        'User must complete registration via invitation link',
        'Password will be set during registration',
        'User will be auto-assigned test_automation role',
        'Account label will be set on first login'
      ],
      env_variables: {
        NIGHTWATCH_EMAIL: testEmail,
        NIGHTWATCH_PASSWORD: '(set after user completes registration)'
      }
    });

  } catch (error) {
    console.error('Error creating test automation user:', error);
    return Response.json(
      { error: error.message, details: error.toString() },
      { status: 500 }
    );
  }
});