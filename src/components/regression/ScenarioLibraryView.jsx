import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Play, Filter } from 'lucide-react';

export default function ScenarioLibraryView() {
  const [scenarios, setScenarios] = useState([]);
  const [filteredScenarios, setFilteredScenarios] = useState([]);
  const [filter, setFilter] = useState({ category: 'all', jurisdiction: 'all' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadScenarios();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [scenarios, filter]);

  async function loadScenarios() {
    try {
      setLoading(true);
      const data = await base44.entities.TestScenario.filter({ active: true });
      setScenarios(data || []);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = scenarios;
    if (filter.category !== 'all') {
      filtered = filtered.filter(s => s.scenarioCategory === filter.category);
    }
    if (filter.jurisdiction !== 'all') {
      filtered = filtered.filter(s => s.jurisdiction === filter.jurisdiction);
    }
    setFilteredScenarios(filtered);
  }

  async function runScenario(scenarioId) {
    try {
      const result = await base44.functions.invoke('runRegressionScenario', { scenarioId });
      alert(`Scenario executed: ${result.data?.summary}`);
      loadScenarios();
    } catch (error) {
      alert(`Error running scenario: ${error.message}`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="px-2 py-1 rounded border border-slate-200 text-xs"
          >
            <option value="all">All Categories</option>
            <option value="basic">Basic</option>
            <option value="medium">Medium</option>
            <option value="complex">Complex</option>
            <option value="edge_case">Edge Case</option>
            <option value="negative_case">Negative Case</option>
          </select>
        </div>
        <select
          value={filter.jurisdiction}
          onChange={(e) => setFilter({ ...filter, jurisdiction: e.target.value })}
          className="px-2 py-1 rounded border border-slate-200 text-xs"
        >
          <option value="all">All Jurisdictions</option>
          <option value="CAN">Canada</option>
          <option value="USA">USA</option>
          <option value="EU">EU</option>
          <option value="GBR">UK</option>
        </select>
      </div>

      <div className="grid gap-3">
        {loading ? (
          <p className="text-xs text-slate-500">Loading scenarios...</p>
        ) : filteredScenarios.length === 0 ? (
          <p className="text-xs text-slate-400">No scenarios match filters</p>
        ) : (
          filteredScenarios.map(scenario => (
            <div key={scenario.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-slate-900">{scenario.scenarioName}</h3>
                  <p className="text-xs text-slate-500 mt-1">{scenario.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {scenario.scenarioCategory.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {scenario.jurisdiction}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => runScenario(scenario.id)}
                  className="gap-2 flex-shrink-0"
                >
                  <Play className="w-3 h-3" /> Run
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}