import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';

export default function FeedbackModal({ onClose, currentPage, currentRoute }) {
  const { user } = useAuth();
  const [step, setStep] = useState('type'); // type, form, submitting, success
  const [feedbackType, setFeedbackType] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'major',
    expectedBehavior: '',
    actualBehavior: '',
    reproductionSteps: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    gatherContext();
  }, []);

  async function gatherContext() {
    try {
      const contextData = {
        page: currentPage || 'Unknown',
        route: currentRoute || window.location.pathname,
        reporter: user?.email,
        userAction: 'feedback_submission',
        timestamp: new Date().toISOString(),
      };
      setContext(contextData);
    } catch (e) {
      console.error('Failed to gather context:', e);
    }
  }

  async function handleSubmit() {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Title and description are required');
      return;
    }

    setIsSubmitting(true);
    try {
      
      // Create feedback item
      const feedbackData = {
        feedbackId: `FB-${Date.now()}`,
        type: feedbackType,
        title: formData.title,
        description: formData.description,
        status: 'new',
        priority: 'medium',
        severity: formData.severity || undefined,
        expectedBehavior: formData.expectedBehavior || undefined,
        actualBehavior: formData.actualBehavior || undefined,
        reproductionSteps: formData.reproductionSteps || undefined,
        reporter: user?.email,
        pageContext: currentPage,
        routeContext: currentRoute,
        source: 'user',
      };

      const created = await base44.entities.FeedbackItem.create(feedbackData);

      // Create context snapshot
      if (context) {
        await base44.entities.FeedbackContextSnapshot.create({
          feedbackId: feedbackData.feedbackId,
          currentPage: currentPage,
          route: currentRoute,
          browserContext: `User: ${user?.email}, Time: ${new Date().toISOString()}`,
        });
      }

      // Trigger triage
      try {
        await base44.functions.invoke('feedbackTriageEngine', {
          feedbackId: feedbackData.feedbackId,
        });
      } catch (e) {
        console.error('Triage failed (non-blocking):', e);
      }

      setStep('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
      setIsSubmitting(false);
    }
  }

  const typeOptions = [
    {
      id: 'bug',
      label: 'Report a Bug',
      desc: 'Something is broken or not working as expected',
      icon: '🐛',
    },
    {
      id: 'feature_request',
      label: 'Request a Feature',
      desc: 'Suggest a new capability or improvement',
      icon: '✨',
    },
    {
      id: 'improvement',
      label: 'Suggest an Improvement',
      desc: 'Make workflows faster or easier',
      icon: '⚡',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {step === 'type' && 'Send Feedback'}
            {step === 'form' && `${feedbackType === 'bug' ? 'Report Bug' : feedbackType === 'feature_request' ? 'Request Feature' : 'Suggest Improvement'}`}
            {step === 'success' && '✓ Thank you!'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {step === 'type' && (
            <div className="space-y-3">
              {typeOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setFeedbackType(opt.id);
                    setStep('form');
                  }}
                  className="w-full p-4 rounded-lg border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-900">{opt.label}</p>
                      <p className="text-xs text-slate-500">{opt.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 'form' && (
            <div className="space-y-4">
              {/* Context summary */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                <p className="font-semibold mb-1">Context captured:</p>
                <p>Page: {currentPage || 'Unknown'}</p>
                <p>Reporter: {context?.reporter || 'Loading...'}</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1.5">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell us more..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
                />
              </div>

              {/* Bug-specific fields */}
              {feedbackType === 'bug' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1.5">
                      Severity
                    </label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
                    >
                      <option value="cosmetic">Cosmetic</option>
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1.5">
                      Expected Behavior
                    </label>
                    <textarea
                      value={formData.expectedBehavior}
                      onChange={(e) => setFormData({ ...formData, expectedBehavior: e.target.value })}
                      placeholder="What should happen"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1.5">
                      Actual Behavior
                    </label>
                    <textarea
                      value={formData.actualBehavior}
                      onChange={(e) => setFormData({ ...formData, actualBehavior: e.target.value })}
                      placeholder="What actually happens"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1.5">
                      Steps to Reproduce
                    </label>
                    <textarea
                      value={formData.reproductionSteps}
                      onChange={(e) => setFormData({ ...formData, reproductionSteps: e.target.value })}
                      placeholder="1. Click...\n2. Then..."
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">✓</div>
              <p className="text-slate-900 font-semibold mb-1">Thank you!</p>
              <p className="text-sm text-slate-600">Your feedback has been submitted and will be reviewed shortly.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'success' && (
          <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            {step === 'form' && (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Feedback
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}