import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Settings, Filter } from 'lucide-react';

export default function SystemConfigDashboard() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedConfig, setSelectedConfig] = useState(null);

  useEffect(() => {
    loadConfigs();
  }, [filter]);

  async function loadConfigs() {
    setLoading(true);
    try {
      const query = filter === 'all' ? {} : { category: filter };
      const data = await base44.entities.SystemConfig.filter(query);
      setConfigs(data || []);
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setLoading(false);
    }
  }

  const categories = ['all', 'scoring', 'performance', 'generation', 'security', 'ui', 'audit', 'workflow', 'delivery_gate'];
  const grouped = {};

  configs.forEach(c => {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category].push(c);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-5 h-5 text-slate-600" />
        <h2 className="text-2xl font-bold text-slate-900">System Configuration Registry</h2>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-500" />
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={filter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(cat)}
              className="capitalize"
            >
              {cat.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Config Groups */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading configs...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-slate-500">No configs found</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900 capitalize">{category.replace(/_/g, ' ')}</h3>
              
              <div className="space-y-2">
                {items.map(config => (
                  <div
                    key={config.id}
                    onClick={() => setSelectedConfig(config)}
                    className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{config.configKey}</p>
                        <p className="text-xs text-slate-600 mt-1">{config.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-700">
                            {config.configType}
                          </span>
                          {config.editable && (
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                              Editable
                            </span>
                          )}
                          {!config.active && (
                            <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-slate-700">{config.configValue}</p>
                        {config.defaultValue && (
                          <p className="text-xs text-slate-500 mt-1">Default: {config.defaultValue}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail View */}
      {selectedConfig && (
        <SystemConfigDetailView config={selectedConfig} onClose={() => setSelectedConfig(null)} onSave={() => {
          loadConfigs();
          setSelectedConfig(null);
        }} />
      )}
    </div>
  );
}

function SystemConfigDetailView({ config, onClose, onSave }) {
  const [value, setValue] = useState(config.configValue);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!config.editable) return;
    
    setSaving(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.SystemConfig.update(config.id, {
        configValue: value,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email
      });
      onSave();
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{config.configKey}</h3>
          <p className="text-sm text-slate-600 mt-2">{config.description}</p>
        </div>

        <div className="space-y-2 pt-4 border-t border-slate-200">
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Type</p>
            <p className="text-sm text-slate-600">{config.configType}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Default Value</p>
            <p className="text-sm font-mono text-slate-600">{config.defaultValue}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Current Value</p>
            {config.editable ? (
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            ) : (
              <p className="text-sm font-mono text-slate-600">{config.configValue}</p>
            )}
          </div>

          {config.updatedAt && (
            <div className="text-xs text-slate-500">
              Updated: {new Date(config.updatedAt).toLocaleString()} by {config.updatedBy}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
          {config.editable && (
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}