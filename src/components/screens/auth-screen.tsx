import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { EnvelopeSimple, Key, Eye, EyeSlash } from '@phosphor-icons/react';

type AuthMode = 'sign-in' | 'sign-up' | 'magic-link';

export function AuthScreen() {
  const { signIn, signUp, signInWithOtp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'magic-link') {
        const { error } = await signInWithOtp(email);
        if (error) {
          setError(error.message);
        } else {
          setMessage('Check your email for the magic link!');
        }
      } else if (mode === 'sign-up') {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setMessage('Check your email to confirm your account!');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-amber-950 via-background to-background">
      {/* Logo */}
      <div className="mb-8 text-center">
        <img
          src="/lantern-logo.png"
          alt="The Lantern Network"
          className="w-24 h-24 mx-auto mb-4"
        />
        <h1 className="text-3xl font-bold text-amber-400">The Lantern Network</h1>
        <p className="text-muted-foreground mt-2">Light the way for your neighbors</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {mode === 'sign-in' && 'Welcome Back'}
            {mode === 'sign-up' && 'Join the Network'}
            {mode === 'magic-link' && 'Sign In with Email'}
          </CardTitle>
          <CardDescription>
            {mode === 'sign-in' && 'Sign in to your account'}
            {mode === 'sign-up' && 'Create your account to get started'}
            {mode === 'magic-link' && "We'll send you a magic link to sign in"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {mode !== 'magic-link' && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 rounded-lg bg-green-500/10 text-green-500 text-sm">
                {message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : (
                <>
                  {mode === 'sign-in' && 'Sign In'}
                  {mode === 'sign-up' && 'Create Account'}
                  {mode === 'magic-link' && 'Send Magic Link'}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-2">
            {mode === 'sign-in' && (
              <>
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => setMode('magic-link')}
                >
                  Sign in with magic link instead
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('sign-up')}
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </div>
              </>
            )}

            {mode === 'sign-up' && (
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('sign-in')}
                  className="text-primary hover:underline"
                >
                  Sign in
                </button>
              </div>
            )}

            {mode === 'magic-link' && (
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => setMode('sign-in')}
              >
                Sign in with password instead
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
