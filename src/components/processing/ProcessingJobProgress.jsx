import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Clock } from 'lucide-react';

export default function ProcessingJobProgress({ jobId }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    const loadJob = async () => {
      try {
        const jobs = await base44.entities.ProcessingJob.filter({ job_id: jobId });
        if (jobs && jobs.length > 0) {
          setJob(jobs[0]);
        }
      } catch (error) {
        console.error('Failed to load job:', error);
      }
    };

    loadJob();
    const interval = setInterval(loadJob, 1000);
    return () => clearInterval(interval);
  }, [jobId]);

  if (!job) return null;

  const stages = ['loading libraries', 'computing findings', 'generating narratives', 'assembling report', 'complete'];
  const currentStageIdx = Math.min(Math.floor(job.progress_percent / 20), stages.length - 1);

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">{job.progress_percent}% Complete</span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
            job.status === 'failed' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {job.status.toUpperCase()}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-full rounded-full transition-all ${
              job.status === 'completed' ? 'bg-emerald-500' :
              job.status === 'failed' ? 'bg-red-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${job.progress_percent}%` }}
          />
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-2">
        {stages.map((stage, idx) => (
          <div key={idx} className="flex items-center gap-3">
            {idx < currentStageIdx ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : idx === currentStageIdx ? (
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
            )}
            <span className={`text-sm ${idx <= currentStageIdx ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
              {stage}
            </span>
          </div>
        ))}
      </div>

      {/* Current Step */}
      {job.current_step && (
        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-600">
            <span className="font-semibold">Current:</span> {job.current_step}
          </p>
        </div>
      )}
    </div>
  );
}