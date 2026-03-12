import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, Link2, MessageSquare } from 'lucide-react';

export default function EvidenceCard({ evidence }) {
  const typeIcons = {
    File: FileText,
    URL: Link2,
    Text: MessageSquare
  };

  const TypeIcon = typeIcons[evidence.evidence_type] || FileText;

  const statusColors = {
    Pending: 'bg-slate-100 text-slate-700',
    Reviewed: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700'
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const shortHash = evidence.file_hash ? evidence.file_hash.substring(0, 8) + '...' + evidence.file_hash.substring(-4) : null;

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div className="flex items-start gap-3 mb-3">
        <TypeIcon className="w-4 h-4 text-slate-600 mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-slate-900 text-sm truncate">
            {evidence.description || evidence.text_description || `${evidence.evidence_type} Evidence`}
          </div>
          <div className="text-xs text-slate-500 mt-1 space-y-0.5">
            {evidence.uploaded_at && (
              <div>Uploaded: {formatDate(evidence.uploaded_at)}</div>
            )}
            {evidence.uploaded_by && (
              <div>By: {evidence.uploaded_by}</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <Badge className="text-xs">
          {evidence.evidence_type}
        </Badge>
        <Badge className={`text-xs ${statusColors[evidence.review_status] || statusColors.Pending}`}>
          {evidence.review_status || 'Pending'}
        </Badge>
        {shortHash && (
          <Badge variant="outline" className="text-xs font-mono">
            {shortHash}
          </Badge>
        )}
      </div>

      {evidence.text_description && (
        <p className="text-xs text-slate-700 mb-2">{evidence.text_description}</p>
      )}

      {evidence.notes && (
        <p className="text-xs text-slate-600 italic">{evidence.notes}</p>
      )}
    </div>
  );
}