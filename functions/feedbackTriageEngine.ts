import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { feedbackId } = await req.json();

    if (!feedbackId) {
      return Response.json({ error: 'feedbackId required' }, { status: 400 });
    }

    const feedback = await base44.entities.FeedbackItem.filter({ feedbackId });
    if (!feedback || feedback.length === 0) {
      return Response.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const item = feedback[0];

    // Triage scoring logic
    let priorityScore = 0;
    let recommendedPriority = 'low';
    let recommendedOwner = 'unassigned';
    let triageSummary = [];

    // Severity-based scoring
    const severityMap = { cosmetic: 1, minor: 2, major: 4, critical: 5 };
    priorityScore += severityMap[item.severity] || 0;
    if (item.severity === 'critical') triageSummary.push('Critical severity detected');

    // Impact scoring
    const impactMap = { none: 0, limited: 1, moderate: 3, widespread: 5 };
    priorityScore += impactMap[item.impactLevel] || 0;
    if (item.impactLevel === 'widespread') triageSummary.push('Wide customer impact');

    // Regulatory risk
    if (item.regulatoryRisk) {
      priorityScore += 3;
      triageSummary.push('Regulatory risk flagged');
    }

    // Customer visibility
    if (item.customerVisible && item.type === 'bug') {
      priorityScore += 2;
      triageSummary.push('Visible to customers');
    }

    // No workaround
    if (!item.workaroundExists && item.type === 'bug') {
      priorityScore += 1;
      triageSummary.push('No workaround available');
    }

    // Frequency scoring
    const frequencyMap = { once: 0, intermittent: 1, frequent: 3, always: 4 };
    priorityScore += frequencyMap[item.frequency] || 0;

    // Type-based owner assignment
    if (item.module) {
      const moduleMap = {
        'engagement_workflow': 'assessment_engine',
        'reporting': 'reporting',
        'admin': 'admin',
        'ui': 'ux',
        'integration': 'integrations',
      };
      recommendedOwner = moduleMap[item.module] || 'platform';
    }

    // Determine priority
    if (priorityScore >= 12) {
      recommendedPriority = 'critical';
    } else if (priorityScore >= 8) {
      recommendedPriority = 'high';
    } else if (priorityScore >= 4) {
      recommendedPriority = 'medium';
    } else {
      recommendedPriority = 'low';
    }

    // Check for duplicates
    let duplicateSuspicion = null;
    if (item.type === 'bug') {
      const similar = await base44.entities.FeedbackItem.filter({
        type: 'bug',
        module: item.module,
        status: { $ne: 'wont_fix' },
      });
      
      for (const s of similar) {
        if (s.id !== item.id && s.title.toLowerCase().includes(item.title.toLowerCase().substring(0, 10))) {
          duplicateSuspicion = {
            suspectedDuplicateId: s.feedbackId,
            suspectedDuplicateTitle: s.title,
            similarity: 'title_match',
          };
          triageSummary.push(`Possible duplicate of ${s.feedbackId}`);
          break;
        }
      }
    }

    // Update feedback item with triage results
    await base44.entities.FeedbackItem.update(item.id, {
      status: 'triaged',
      priority: recommendedPriority,
      recommendedOwner,
      triageNotes: triageSummary.join(' | '),
    });

    // Add triage comment
    await base44.entities.FeedbackComment.create({
      feedbackId: item.feedbackId,
      author: 'system',
      commentType: 'triage_note',
      body: `Auto-triage: Priority ${recommendedPriority}, Owner ${recommendedOwner}. ${triageSummary.join(' ')}`,
    });

    return Response.json({
      success: true,
      recommendedPriority,
      recommendedOwner,
      triageSummary: triageSummary.join(' '),
      duplicateSuspicion,
      priorityScore,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});