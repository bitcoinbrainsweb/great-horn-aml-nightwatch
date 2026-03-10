import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Lightbulb } from 'lucide-react';

export default function PageHelpPanel({ pageName, onClose }) {
  const [help, setHelp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHelp();
  }, [pageName]);

  async function loadHelp() {
    setLoading(true);
    try {
      // Check if help exists
      const existing = await base44.entities.PageHelp.filter({ pageName });
      
      if (existing && existing.length > 0) {
        setHelp(existing[0]);
      } else {
        // Generate new help
        const response = await base44.functions.invoke('pageExplanationGenerator', { pageName });
        if (response.data) {
          setHelp(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to load help:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!help) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50">
      <div className="bg-white w-full max-h-[80vh] overflow-y-auto rounded-t-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">About This Page</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <div className="space-y-4 text-sm">
            {help.description && (
              <div>
                <p className="font-semibold text-slate-900 mb-1">What This Page Does</p>
                <p className="text-slate-700">{help.description}</p>
              </div>
            )}

            {help.purpose && (
              <div>
                <p className="font-semibold text-slate-900 mb-1">Purpose</p>
                <p className="text-slate-700">{help.purpose}</p>
              </div>
            )}

            {help.dataSources && help.dataSources.length > 0 && (
              <div>
                <p className="font-semibold text-slate-900 mb-1">Data Sources</p>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  {help.dataSources.map((source, i) => (
                    <li key={i}>{source}</li>
                  ))}
                </ul>
              </div>
            )}

            {help.keyActions && help.keyActions.length > 0 && (
              <div>
                <p className="font-semibold text-slate-900 mb-1">Key Actions</p>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  {help.keyActions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            )}

            {help.commonMistakes && help.commonMistakes.length > 0 && (
              <div>
                <p className="font-semibold text-slate-900 mb-1">Common Mistakes</p>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  {help.commonMistakes.map((mistake, i) => (
                    <li key={i}>{mistake}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}