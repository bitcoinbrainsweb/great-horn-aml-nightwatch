/**
 * NW-UPGRADE-076F-PHASE2: Nightwatch-only login. Base44 login removed.
 */
import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import * as nightwatchAuth from '@/auth/nightwatchAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const { checkAppState } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await nightwatchAuth.login(email, password);
      await checkAppState();
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center mx-auto mb-4">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69afb09f3cf8f93f857eb1/aff189096_GreatHornAMLLogo.png"
              alt="Great Horn AML"
              className="w-10 h-10 object-contain"
            />
          </div>
          <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-widest">Great Horn AML</p>
          <h1 className="text-xl font-bold text-white mt-1">Nightwatch</h1>
          <p className="text-slate-400 text-sm mt-2">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-400" role="alert">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
