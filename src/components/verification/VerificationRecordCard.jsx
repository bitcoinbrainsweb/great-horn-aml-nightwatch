import React, { useState } from 'react';
import { ChevronDown, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function VerificationRecordCard({ record }) {
  const [expanded, setExpanded] = useState(false);

  if (!record) return null;

  let content = {};
  try {
    content = typeof record.content === 'string' ? JSON.parse(record.content) : record.content;
  } catch (e) {
    content = {};
  }

  const gateResults = content.delivery_gate_results || {};
  const passedTests = Object.values(gateResults).filter(t => t.status === 'pass').length;
  const totalTests = Object.keys(gateResults).length;
  const isPassed = passedTests === totalTests && totalTests > 0;

  const downloadRecord = async () => {
    const markdown = generateMarkdown(record, content, passedTests, totalTests);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.upgrade_id || 'verification'}-record.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Collapsed Card Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors"
      >
        {/* Status Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isPassed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 text-left min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm">{content.title || record.outputName}</h3>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
            <span className="font-mono">{record.upgrade_id}</span>
            <span className="font-mono">{record.product_version}</span>
            <span>
              {record.published_at ? format(new Date(record.published_at), 'MMM d, yyyy') : '—'}
            </span>
            {totalTests > 0 && (
              <span className={isPassed ? 'text-emerald-700 font-semibold' : 'text-red-700 font-semibold'}>
                {passedTests}/{totalTests} tests passed
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              downloadRecord();
            }}
            className="text-slate-500 hover:text-slate-700"
            title="Download as Markdown"
          >
            <Download className="w-4 h-4" />
          </Button>
          <div className="text-slate-400">
            <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50 space-y-4 text-sm text-slate-700">
          {/* Executive Summary */}
          {content.title && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Title</h4>
              <p>{content.title}</p>
            </div>
          )}

          {content.description && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Description</h4>
              <p className="text-xs">{content.description}</p>
            </div>
          )}

          {/* Delivery Gate Results */}
          {totalTests > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Delivery Gate Results ({passedTests}/{totalTests} passed)</h4>
              <div className="space-y-1">
                {Object.entries(gateResults).map(([testKey, test]) => (
                  <div key={testKey} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5">
                      {test.status === 'pass' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-600" />
                      )}
                    </span>
                    <div>
                      <p className="font-mono">{testKey.replace(/_/g, ' ')}</p>
                      {test.evidence && <p className="text-slate-500">{test.evidence}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Change Summary */}
          {content.change_summary && Object.keys(content.change_summary).length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Changes Summary</h4>
              <div className="text-xs space-y-1 text-slate-600">
                {Object.entries(content.change_summary).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-mono">{key}:</span> {String(value)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
            <p><strong>Source Module:</strong> {record.source_module}</p>
            <p><strong>Classification:</strong> {record.classification}</p>
            <p><strong>Status:</strong> {record.status}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function generateMarkdown(record, content, passedTests, totalTests) {
  const lines = [
    `# ${content.title || record.outputName}`,
    '',
    `**Upgrade ID:** ${record.upgrade_id}`,
    `**Product Version:** ${record.product_version}`,
    `**Published:** ${record.published_at ? format(new Date(record.published_at), 'MMM d, yyyy HH:mm') : 'N/A'}`,
    '',
    `## Status`,
    '',
    `**Delivery Gates:** ${passedTests}/${totalTests} passed`,
    '',
  ];

  if (content.description) {
    lines.push('## Description', '', content.description, '');
  }

  const gateResults = content.delivery_gate_results || {};
  if (Object.keys(gateResults).length > 0) {
    lines.push('## Delivery Gate Results', '');
    Object.entries(gateResults).forEach(([testKey, test]) => {
      const status = test.status === 'pass' ? '✓' : '✗';
      lines.push(`- **${status} ${testKey.replace(/_/g, ' ')}**: ${test.evidence || 'N/A'}`);
    });
    lines.push('');
  }

  if (content.change_summary && Object.keys(content.change_summary).length > 0) {
    lines.push('## Changes Summary', '');
    Object.entries(content.change_summary).forEach(([key, value]) => {
      lines.push(`- **${key}:** ${value}`);
    });
    lines.push('');
  }

  lines.push('---', `*Generated: ${new Date().toISOString()}*`);

  return lines.join('\n');
}