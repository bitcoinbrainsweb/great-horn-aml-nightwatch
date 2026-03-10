import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Package } from 'lucide-react';

export default function VersionDashboard() {
  const [versions, setVersions] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [versionsData, mappingsData] = await Promise.all([
        base44.entities.ProductVersion.filter({}),
        base44.entities.UpgradeVersionMapping.filter({})
      ]);
      setVersions(versionsData || []);
      setMappings(mappingsData || []);
    } catch (error) {
      console.error('Failed to load version data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading versions...</p>;
  }

  const getStatusBadge = (status) => {
    if (status === 'active') return 'bg-emerald-100 text-emerald-700';
    if (status === 'deprecated') return 'bg-gray-100 text-gray-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-5 h-5 text-slate-600" />
        <h2 className="text-2xl font-bold text-slate-900">Nightwatch Version History</h2>
      </div>

      {/* Product Versions */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Product Releases</h3>
        
        <div className="space-y-3">
          {versions.map(version => {
            const upgradesInVersion = mappings.filter(m => m.productVersion === version.versionNumber);
            
            return (
              <div key={version.id} className="p-6 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{version.versionNumber}</h4>
                    <p className="text-sm text-slate-600 mt-1">{version.releaseName}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusBadge(version.status)} capitalize`}>
                    {version.status}
                  </span>
                </div>

                {version.releaseDescription && (
                  <p className="text-sm text-slate-700 mb-3">{version.releaseDescription}</p>
                )}

                {version.releaseDate && (
                  <p className="text-xs text-slate-500 mb-3">Released: {new Date(version.releaseDate).toLocaleDateString()}</p>
                )}

                {/* Associated Upgrades */}
                {upgradesInVersion.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Engineering Upgrades ({upgradesInVersion.length})</p>
                    <div className="space-y-1">
                      {upgradesInVersion.map(upgrade => (
                        <div key={upgrade.id} className="text-xs text-slate-700 flex items-center gap-2">
                          <span className="font-mono text-blue-600 font-bold">{upgrade.upgradeId}</span>
                          <span>{upgrade.upgradeName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {version.notes && (
                  <div className="mt-3 p-2 bg-white/50 rounded border border-slate-200">
                    <p className="text-xs text-slate-600">{version.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline View */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Upgrade Timeline</h3>
        
        <div className="space-y-2">
          {mappings.sort((a, b) => {
            const aNum = parseInt(a.upgradeId.split('-')[1]);
            const bNum = parseInt(b.upgradeId.split('-')[1]);
            return aNum - bNum;
          }).map(mapping => (
            <div key={mapping.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-blue-600 font-bold">{mapping.upgradeId}</span>
                <span className="text-slate-600">→</span>
                <span className="font-mono text-purple-600">{mapping.productVersion}</span>
                <span className="text-slate-500 flex-1">{mapping.upgradeName}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}