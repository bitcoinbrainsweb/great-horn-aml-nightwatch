import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function PublishNW013() {
  const [status, setStatus] = useState('publishing');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    publishRecord();
  }, []);

  async function publishRecord() {
    try {
      const response = await base44.functions.invoke('publishNW013VerificationRecord', {});
      setStatus('success');
      setResult(response.data);
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.error || err.message);
    }
  }

  if (status === 'publishing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-slate-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Publishing NW-UPGRADE-013 verification record...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-lg border border-red-200 p-6 max-w-sm">
          <h2 className="text-lg font-bold text-red-900 mb-2">Publication Failed</h2>
          <p className="text-sm text-red-800 mb-4">{error}</p>
          <p className="text-xs text-red-700">Admin access is required to publish verification records.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-lg border border-green-200 p-6 max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h2 className="text-lg font-bold text-green-900">Published Successfully</h2>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <p><strong>Record ID:</strong> <code className="bg-slate-100 px-2 py-1 rounded text-xs">{result?.recordId}</code></p>
          <p><strong>Name:</strong> {result?.recordName}</p>
          <p><strong>Location:</strong> {result?.location}</p>
        </div>
        <p className="text-xs text-slate-500 mt-4">The verification record is now visible in Admin → Change Management</p>
      </div>
    </div>
  );
}