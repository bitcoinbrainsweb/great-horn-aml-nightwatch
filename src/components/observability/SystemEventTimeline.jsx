import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export default function SystemEventTimeline({ assessmentId, limit = 20 }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadEvents();
  }, [assessmentId, filter]);

  async function loadEvents() {
    setLoading(true);
    try {
      const query = assessmentId ? { linkedAssessment: assessmentId } : {};
      const allEvents = await base44.entities.SystemEvent.filter(query);
      
      let filtered = allEvents || [];
      if (filter !== 'all') {
        filtered = filtered.filter(e => e.eventType === filter);
      }
      
      setEvents(filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit));
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  }

  const severityIcon = {
    info: <Info className="w-4 h-4 text-blue-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    error: <AlertCircle className="w-4 h-4 text-red-600" />,
    critical: <AlertCircle className="w-4 h-4 text-red-700" />
  };

  const eventTypeColors = {
    assessment_created: 'bg-blue-50 border-blue-200',
    risk_engine_run: 'bg-purple-50 border-purple-200',
    gap_detected: 'bg-amber-50 border-amber-200',
    narrative_generated: 'bg-green-50 border-green-200',
    cache_hit: 'bg-emerald-50 border-emerald-200',
    cache_miss: 'bg-slate-50 border-slate-200',
    verification_failed: 'bg-red-50 border-red-200',
    system_error: 'bg-red-50 border-red-200'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900">System Events</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-2 py-1 text-xs border border-slate-300 rounded"
        >
          <option value="all">All Events</option>
          <option value="assessment_created">Assessment Created</option>
          <option value="risk_engine_run">Engine Run</option>
          <option value="narrative_generated">Narrative Generated</option>
          <option value="cache_hit">Cache Hit</option>
          <option value="system_error">Error</option>
        </select>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="text-xs text-slate-500">No events recorded</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {events.map((event, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${eventTypeColors[event.eventType] || 'bg-slate-50 border-slate-200'}`}
            >
              <div className="flex items-start gap-2">
                {severityIcon[event.severity] || <Info className="w-4 h-4" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900">{event.eventType}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{event.description}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}