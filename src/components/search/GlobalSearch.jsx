import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({});
      return;
    }
    searchRecords();
  }, [query]);

  async function searchRecords() {
    setLoading(true);
    const q = query.toLowerCase();
    const grouped = {
      risks: [],
      controls: [],
      findings: [],
      tests: [],
      remediation: [],
      engagements: [],
      clients: []
    };

    try {
      const [risks, controls, findings, tests, remediation, engagements, clients] = await Promise.all([
        base44.entities.RiskLibrary?.list() || [],
        base44.entities.ControlLibrary?.list() || [],
        base44.entities.Finding?.list() || [],
        base44.entities.ControlTest?.list() || [],
        base44.entities.RemediationAction?.list() || [],
        base44.entities.Engagement?.list() || [],
        base44.entities.Client?.list() || []
      ]);

      if (risks) grouped.risks = risks.filter(r => r.risk_name?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)).slice(0, 5);
      if (controls) grouped.controls = controls.filter(c => c.control_name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)).slice(0, 5);
      if (findings) grouped.findings = findings.filter(f => f.title?.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q)).slice(0, 5);
      if (tests) grouped.tests = tests.filter(t => t.id).slice(0, 5);
      if (remediation) grouped.remediation = remediation.filter(r => r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)).slice(0, 5);
      if (engagements) grouped.engagements = engagements.filter(e => e.client_name?.toLowerCase().includes(q) || e.engagement_type?.toLowerCase().includes(q)).slice(0, 5);
      if (clients) grouped.clients = clients.filter(c => c.client_name?.toLowerCase().includes(q)).slice(0, 5);

      setResults(grouped);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(type, item) {
    setOpen(false);
    setQuery('');
    // Navigation logic based on type
    if (type === 'engagement') {
      navigate(`/EngagementDetail?id=${item.id}`);
    } else if (type === 'client') {
      navigate(`/ClientDetail?id=${item.id}`);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
        title="Search (Cmd+K)"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline ml-auto text-[9px] px-1.5 py-0.5 bg-white/10 rounded font-mono">⌘K</kbd>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md bg-white rounded-lg shadow-xl border border-slate-200">
            <div className="p-3 border-b border-slate-200">
              <Input 
                placeholder="Search risks, controls, findings..." 
                value={query} 
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="border-0 focus-visible:ring-0 text-sm"
              />
            </div>

            {query && (
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-sm text-slate-500">Searching...</div>
                ) : Object.values(results).every(r => r.length === 0) ? (
                  <div className="p-4 text-center text-sm text-slate-500">No results found</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {results.risks?.length > 0 && (
                      <div>
                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase bg-slate-50">Risks</div>
                        {results.risks.map(r => (
                          <div key={r.id} className="px-3 py-2 hover:bg-slate-50 text-sm text-slate-700 cursor-pointer">{r.risk_name}</div>
                        ))}
                      </div>
                    )}
                    {results.controls?.length > 0 && (
                      <div>
                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase bg-slate-50">Controls</div>
                        {results.controls.map(c => (
                          <div key={c.id} className="px-3 py-2 hover:bg-slate-50 text-sm text-slate-700">{c.control_name}</div>
                        ))}
                      </div>
                    )}
                    {results.findings?.length > 0 && (
                      <div>
                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase bg-slate-50">Findings</div>
                        {results.findings.map(f => (
                          <div key={f.id} className="px-3 py-2 hover:bg-slate-50 text-sm text-slate-700">{f.title}</div>
                        ))}
                      </div>
                    )}
                    {results.engagements?.length > 0 && (
                      <div>
                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase bg-slate-50">Engagements</div>
                        {results.engagements.map(e => (
                          <div key={e.id} className="px-3 py-2 hover:bg-slate-50 text-sm text-slate-700 cursor-pointer" onClick={() => handleSelect('engagement', e)}>
                            {e.client_name} - {e.engagement_type}
                          </div>
                        ))}
                      </div>
                    )}
                    {results.clients?.length > 0 && (
                      <div>
                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase bg-slate-50">Clients</div>
                        {results.clients.map(c => (
                          <div key={c.id} className="px-3 py-2 hover:bg-slate-50 text-sm text-slate-700 cursor-pointer" onClick={() => handleSelect('client', c)}>
                            {c.client_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}