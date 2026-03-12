import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Download, Copy, CheckCircle } from 'lucide-react';

export default function ArchitectureExport() {
  const [exportData, setExportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const fetchArchitecture = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await base44.functions.invoke('architectureExporter', {});
      setExportData(result.data);
    } catch (err) {
      setError(`Failed to load architecture: ${err.message}`);
    }
    setLoading(false);
  };

  const downloadJSON = (data, filename) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    fetchArchitecture();
  }, []);

  if (!exportData && !loading && !error) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Architecture Export</h1>
          <p className="text-lg text-slate-600">Complete system architecture snapshot for external audit</p>
          <p className="text-sm text-slate-500 mt-2">NW-UPGRADE-031A: Architecture Export for External Code Audit</p>
        </div>

        {error && (
          <Card className="mb-6 p-4 border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Export Error</p>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {loading && (
          <Card className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600">Generating architecture export...</p>
          </Card>
        )}

        {exportData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="p-6">
                <div className="text-3xl font-bold text-slate-900">{exportData.phase8_summary?.summary_statistics?.total_entities || 0}</div>
                <p className="text-slate-600 text-sm mt-2">Entity Types</p>
              </Card>
              <Card className="p-6">
                <div className="text-3xl font-bold text-slate-900">{exportData.phase8_summary?.summary_statistics?.total_functions || 0}</div>
                <p className="text-slate-600 text-sm mt-2">Backend Functions</p>
              </Card>
              <Card className="p-6">
                <div className="text-3xl font-bold text-slate-900">{exportData.phase8_summary?.summary_statistics?.total_pages || 0}</div>
                <p className="text-slate-600 text-sm mt-2">Pages</p>
              </Card>
            </div>

            <Card className="p-8 mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Export Artifacts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => downloadJSON(exportData.phase1_entities, 'nightwatch_entities.json')}
                  className="justify-start h-auto py-4"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Entity Schemas</div>
                    <div className="text-xs text-slate-500">{exportData.phase1_entities?.length || 0} entities</div>
                  </div>
                </Button>

                <Button
                  onClick={() => downloadJSON(exportData.phase2_enums, 'nightwatch_enums.json')}
                  className="justify-start h-auto py-4"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Enum Definitions</div>
                    <div className="text-xs text-slate-500">{Object.keys(exportData.phase2_enums || {}).length} enums</div>
                  </div>
                </Button>

                <Button
                  onClick={() => downloadJSON(exportData.phase3_functions, 'nightwatch_functions.json')}
                  className="justify-start h-auto py-4"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Backend Functions</div>
                    <div className="text-xs text-slate-500">{exportData.phase3_functions?.length || 0} functions</div>
                  </div>
                </Button>

                <Button
                  onClick={() => downloadJSON(exportData.phase6_pages, 'nightwatch_pages.json')}
                  className="justify-start h-auto py-4"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Page Navigation</div>
                    <div className="text-xs text-slate-500">{exportData.phase6_pages?.length || 0} pages</div>
                  </div>
                </Button>

                <Button
                  onClick={() => downloadJSON(exportData.phase5_artifact_pipeline, 'nightwatch_artifact_pipeline.json')}
                  className="justify-start h-auto py-4"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Artifact Pipeline</div>
                    <div className="text-xs text-slate-500">Pipeline definitions</div>
                  </div>
                </Button>

                <Button
                  onClick={() => downloadJSON(exportData, 'nightwatch_complete_architecture.json')}
                  className="justify-start h-auto py-4 bg-slate-900 text-white"
                >
                  <Download className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Complete Export</div>
                    <div className="text-xs text-slate-300">All phases combined</div>
                  </div>
                </Button>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">JSON Export</h2>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto max-h-96 text-xs mb-4">
                {JSON.stringify(exportData.export_metadata, null, 2)}
              </pre>
              <Button
                onClick={handleCopyJSON}
                variant="outline"
                className="w-full"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copied to clipboard
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Full Export to Clipboard
                  </>
                )}
              </Button>
            </Card>

            <Card className="p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">System Architecture Summary</h2>
              <div className="space-y-4">
                {exportData.phase8_summary?.system_architecture?.key_features && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Key Features</h3>
                    <ul className="list-disc list-inside text-slate-700 space-y-1">
                      {exportData.phase8_summary.system_architecture.key_features.map((feature, idx) => (
                        <li key={idx} className="text-sm">{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}