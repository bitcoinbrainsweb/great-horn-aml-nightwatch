import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { pageName } = payload;

    if (!pageName) {
      return Response.json({ error: 'pageName required' }, { status: 400 });
    }

    // Map pages to descriptions
    const pageDescriptions = {
      Dashboard: {
        description: 'System-wide status and analytics dashboard',
        purpose: 'Monitor active engagements, pending tasks, system health',
        dataSources: ['Engagement', 'ExecutionMetric', 'SystemEvent', 'ProcessingJob'],
        keyActions: ['View analytics', 'Start new engagement', 'Check processing jobs'],
        commonMistakes: [
          'Misreading risk ratings (Low/Moderate/High/Critical)',
          'Not checking job status before viewing incomplete results',
          'Expecting real-time updates without refresh'
        ]
      },
      EngagementDetail: {
        description: 'Detailed engagement workflow and assessment management',
        purpose: 'Execute risk assessments, generate reports, track tasks',
        dataSources: ['Engagement', 'EngagementRisk', 'AssessmentState', 'Report', 'Task', 'Document'],
        keyActions: [
          'Run risk assessment',
          'View and edit risks',
          'Generate narratives',
          'Create tasks',
          'Manage documents',
          'Generate final report'
        ],
        commonMistakes: [
          'Not saving risk scores before generating narratives',
          'Trying to edit locked engagement',
          'Misunderstanding gap severity levels'
        ]
      },
      Clients: {
        description: 'Client management and directory',
        purpose: 'Create clients, manage details, track engagements',
        dataSources: ['Client', 'Engagement', 'UserInvitation'],
        keyActions: ['Create client', 'View client details', 'Invite team members'],
        commonMistakes: [
          'Creating duplicate clients',
          'Not updating client domain when email changes',
          'Missing required jurisdiction info'
        ]
      },
      Reports: {
        description: 'Report generation and management',
        purpose: 'View, draft, review, finalize, and export reports',
        dataSources: ['Report', 'Engagement', 'AssessmentState'],
        keyActions: ['Generate draft', 'Review content', 'Approve', 'Finalize', 'Export to PDF/Word'],
        commonMistakes: [
          'Finalizing without review',
          'Editing after finalization (requires new version)',
          'Not checking integrity seal on export'
        ]
      },
      Admin: {
        description: 'System administration and configuration',
        purpose: 'Manage libraries, methodologies, users, audit logs',
        dataSources: ['RiskLibrary', 'ControlLibrary', 'Methodology', 'UserInvitation', 'AuditLog'],
        keyActions: [
          'Manage risk library',
          'Manage control library',
          'Configure methodologies',
          'Invite users',
          'View audit logs'
        ],
        commonMistakes: [
          'Editing core library items (should create custom)',
          'Not understanding role restrictions',
          'Missing audit log filters'
        ]
      }
    };

    const pageInfo = pageDescriptions[pageName] || {
      description: `Page: ${pageName}`,
      purpose: 'Help system does not have specific documentation',
      dataSources: [],
      keyActions: []
    };

    const pageHelpId = `PH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check if already exists
    const existing = await base44.asServiceRole.entities.PageHelp.filter({ pageName });
    let result;

    if (existing && existing.length > 0) {
      // Update existing
      result = await base44.asServiceRole.entities.PageHelp.update(existing[0].id, {
        description: pageInfo.description,
        purpose: pageInfo.purpose,
        dataSources: pageInfo.dataSources,
        keyActions: pageInfo.keyActions,
        commonMistakes: pageInfo.commonMistakes,
        relatedDocs: [],
        lastGenerated: new Date().toISOString(),
        version: (existing[0].version || 1) + 1
      });
    } else {
      // Create new
      result = await base44.asServiceRole.entities.PageHelp.create({
        pageHelpId,
        pageName,
        description: pageInfo.description,
        purpose: pageInfo.purpose,
        dataSources: pageInfo.dataSources,
        keyActions: pageInfo.keyActions,
        commonMistakes: pageInfo.commonMistakes || [],
        relatedDocs: [],
        lastGenerated: new Date().toISOString(),
        version: 1
      });
    }

    return Response.json({
      success: true,
      pageName,
      description: pageInfo.description,
      purpose: pageInfo.purpose,
      dataSources: pageInfo.dataSources,
      keyActions: pageInfo.keyActions,
      commonMistakes: pageInfo.commonMistakes || []
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});