import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-6xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-lg text-slate-600 mb-1">Page not found</p>
        <p className="text-sm text-slate-500 mb-8">The page you're looking for doesn't exist in Nightwatch.</p>
        <Link to={createPageUrl('Dashboard')}>
          <Button className="bg-slate-900 hover:bg-slate-800 gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}