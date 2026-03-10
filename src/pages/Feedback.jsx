import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, AlertTriangle, Lightbulb, Zap, Filter } from 'lucide-react';

export default function Feedback() {
  const [feedback, setFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({ type: 'all', status: 'all', priority: 'all' });
  const [searchText, setSearchText] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadFeedback();
  }, [filter]);

  async function loadFeedback() {
    try {
      setIsLoading(true);
      const query = {};
      if (filter.type !== 'all') query.type = filter.type;
      if (filter.status !== 'all') query.status = filter.status;
      if (filter.priority !== 'all') query.priority = filter.priority;
      
      const items = await base44.entities.FeedbackItem.filter(query);
      setFeedback(items.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredFeedback = feedback.filter(item =>
    item.title.toLowerCase().includes(searchText.toLowerCase()) ||
    item.description.toLowerCase().includes(searchText.toLowerCase()) ||
    item.feedbackId.toLowerCase().includes(searchText.toLowerCase())
  );

  const typeIcon = {
    bug: <AlertTriangle className="w-4 h-4 text-red-500" />,
    feature_request: <Lightbulb className="w-4 h-4 text-amber-500" />,
    improvement: <Zap className="w-4 h-4 text-blue-500" />,
  };

  const priorityBg = {
    critical: 'bg-red-50 border-red-200',
    high: 'bg-amber-50 border-amber-200',
    medium: 'bg-blue-50 border-blue-200',
    low: 'bg-slate-50 border-slate-200',
  };

  const statusColor = {
    new: 'text-slate-600',
    triaged: 'text-blue-600',
    accepted: 'text-green-600',
    in_progress: 'text-amber-600',
    blocked: 'text-red-600',
    resolved: 'text-emerald-600',
    closed: 'text-slate-400',
    wont_fix: 'text-slate-400',
  };

  if (selectedItem) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setSelectedItem(null)}
          className="text-sm text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-1"
        >
          ← Back to List
        </button>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {typeIcon[selectedItem.type]}
                  <span className="text-xs font-semibold uppercase text-slate-500">{selectedItem.feedbackId}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[selectedItem.status]}`}>
                    {selectedItem.status.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${priorityBg[selectedItem.priority]}`}>
                    {selectedItem.priority}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">{selectedItem.title}</h1>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedItem.description}</p>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Reporter</p>
                <p className="text-sm font-medium text-slate-900">{selectedItem.reporter || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Type</p>
                <p className="text-sm font-medium text-slate-900 capitalize">{selectedItem.type.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Module</p>
                <p className="text-sm font-medium text-slate-900">{selectedItem.module || 'General'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Page</p>
                <p className="text-sm font-medium text-slate-900">{selectedItem.pageContext || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Severity</p>
                <p className="text-sm font-medium text-slate-900 capitalize">{selectedItem.severity || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Created</p>
                <p className="text-sm font-medium text-slate-900">{new Date(selectedItem.created_date).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Bug details */}
            {selectedItem.type === 'bug' && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                {selectedItem.expectedBehavior && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Expected Behavior</h3>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedItem.expectedBehavior}</p>
                  </div>
                )}
                {selectedItem.actualBehavior && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Actual Behavior</h3>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedItem.actualBehavior}</p>
                  </div>
                )}
                {selectedItem.reproductionSteps && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Steps to Reproduce</h3>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedItem.reproductionSteps}</p>
                  </div>
                )}
              </div>
            )}

            {/* Triage notes */}
            {selectedItem.triageNotes && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Triage Notes</h3>
                <p className="text-sm text-slate-600">{selectedItem.triageNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Feedback & Bug Reports"
        subtitle="Track bugs, feature requests, and improvement suggestions"
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search feedback..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="flex-1"
        />
        <select
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
        >
          <option value="all">All Types</option>
          <option value="bug">Bugs</option>
          <option value="feature_request">Features</option>
          <option value="improvement">Improvements</option>
        </select>
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="triaged">Triaged</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
        >
          <option value="all">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Feedback list */}
      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : filteredFeedback.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>No feedback items found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFeedback.map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`w-full p-4 rounded-lg border text-left transition-all hover:shadow-md ${priorityBg[item.priority] || 'bg-slate-50 border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {typeIcon[item.type]}
                    <span className="text-xs font-semibold uppercase text-slate-500">{item.feedbackId}</span>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${statusColor[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-1">{item.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}