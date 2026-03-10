import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Filter } from 'lucide-react';

export default function ControlTestList({ controlId, assessmentId }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    loadTests();
  }, [controlId, assessmentId, filter]);

  async function loadTests() {
    setLoading(true);
    try {
      const query = { controlId, assessmentId };
      if (filter !== 'all') {
        query.testResult = filter;
      }
      const data = await base44.entities.ControlTest.filter(query);
      setTests(data || []);
    } catch (error) {
      console.error('Failed to load tests:', error);
    } finally {
      setLoading(false);
    }
  }

  const resultColors = {
    effective: 'bg-emerald-100 text-emerald-700',
    partially_effective: 'bg-yellow-100 text-yellow-700',
    ineffective: 'bg-red-100 text-red-700',
    not_tested: 'bg-slate-100 text-slate-700'
  };

  const filters = ['all', 'effective', 'partially_effective', 'ineffective', 'not_tested'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle2 className="w-5 h-5 text-slate-600" />
        <h3 className="text-lg font-bold text-slate-900">Control Testing</h3>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-500" />
        {filters.map(f => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className="text-xs"
          >
            {f === 'all' ? 'All Tests' :
             f === 'effective' ? 'Effective' :
             f === 'partially_effective' ? 'Partially Effective' :
             f === 'ineffective' ? 'Ineffective' :
             'Not Tested'}
          </Button>
        ))}
      </div>

      {/* Test List */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading tests...</p>
      ) : tests.length === 0 ? (
        <p className="text-sm text-slate-500">No tests found</p>
      ) : (
        <div className="space-y-2">
          {tests.map(test => {
            const today = new Date();
            const nextReviewDate = test.nextReviewDate ? new Date(test.nextReviewDate) : null;
            const isOverdue = nextReviewDate && nextReviewDate < today;

            return (
              <div
                key={test.id}
                onClick={() => setSelectedTest(test)}
                className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{test.testMethod}</p>
                    <p className="text-xs text-slate-600 mt-1">{test.notes}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded ${resultColors[test.testResult]}`}>
                        {test.testResult.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-700">
                        {test.testFrequency}
                      </span>
                      {isOverdue && (
                        <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 font-semibold">
                          🔴 OVERDUE
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-slate-700">Tested {new Date(test.testDate).toLocaleDateString()}</p>
                    {test.nextReviewDate && (
                      <p className="text-slate-500 mt-1">Next: {new Date(test.nextReviewDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail View */}
      {selectedTest && (
        <ControlTestDetailView test={selectedTest} onClose={() => setSelectedTest(null)} />
      )}
    </div>
  );
}

function ControlTestDetailView({ test, onClose }) {
  const resultColors = {
    effective: 'bg-emerald-100 text-emerald-700',
    partially_effective: 'bg-yellow-100 text-yellow-700',
    ineffective: 'bg-red-100 text-red-700',
    not_tested: 'bg-slate-100 text-slate-700'
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-96 overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{test.testMethod}</h3>
            <span className={`inline-block text-xs px-2 py-1 rounded mt-2 ${resultColors[test.testResult]}`}>
              {test.testResult.replace(/_/g, ' ')}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Test Date</p>
            <p className="text-slate-700">{new Date(test.testDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Tester</p>
            <p className="text-slate-700">{test.tester}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Sample Size</p>
            <p className="text-slate-700">{test.sampleSize || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Exceptions</p>
            <p className="text-slate-700">{test.exceptionCount || 0}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Frequency</p>
            <p className="text-slate-700">{test.testFrequency}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Next Review</p>
            <p className="text-slate-700">{test.nextReviewDate ? new Date(test.nextReviewDate).toLocaleDateString() : 'Not scheduled'}</p>
          </div>
        </div>

        {test.notes && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">Test Notes</p>
            <p className="text-sm text-slate-700">{test.notes}</p>
          </div>
        )}

        {test.sampleMethod && (
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Sample Method</p>
            <p className="text-sm text-slate-700">{test.sampleMethod}</p>
          </div>
        )}

        <button onClick={onClose} className="w-full px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}