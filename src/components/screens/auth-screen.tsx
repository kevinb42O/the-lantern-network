import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { EnvelopeSimple, Key, Eye, EyeSlash, Sparkle, ArrowRight, MagicWand, BookOpen } from '@phosphor-icons/react';
import { PhilosophyView } from './philosophy-view';
import { LanternBackground } from '@/components/ui/lantern-background';

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
  const [showPhilosophy, setShowPhilosophy] = useState(false);

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

  // Show philosophy page if requested
  if (showPhilosophy) {
    return <PhilosophyView onBack={() => setShowPhilosophy(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-amber-950/30 via-background to-background overflow-hidden relative">
      {/* Lantern mascot background - base layer */}
      <LanternBackground />
      
      {/* Ambient background effects - layered on top */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-500/8 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-amber-400/8 blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Logo with enhanced glow */}
      <div className="mb-10 text-center relative z-10">
        {/* Glow layers */}
        <div className="absolute inset-0 flex items-center justify-center -top-12">
          <div className="w-56 h-56 rounded-full bg-amber-500/15 blur-3xl animate-pulse" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center -top-12">
          <div className="w-40 h-40 rounded-full bg-amber-400/20 blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center -top-12">
          <div className="w-28 h-28 rounded-full bg-yellow-200/20 blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <img
          src="/lantern-logo.png"
          alt="The Lantern Network"
          className="w-36 h-36 mx-auto mb-6 relative z-10 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]"
        />
        <h1 className="text-4xl font-bold gradient-text relative z-10">The Lantern Network</h1>
        <p className="text-muted-foreground mt-3 relative z-10 text-lg">Light the way for your neighbors</p>
      </div>

      <Card className="w-full max-w-md relative z-10 bg-card/90 backdrop-blur-sm border-border/50 shadow-2xl rounded-2xl overflow-hidden">
        {/* Card top accent */}
        <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <CardHeader className="space-y-2 pb-4">
          <CardTitle className="text-2xl flex items-center gap-2">
            {mode === 'sign-in' && (
              <>
                Welcome Back
                <span className="text-primary">👋</span>
              </>
            )}
            {mode === 'sign-up' && (
              <>
                Join the Network
                <Sparkle size={24} weight="duotone" className="text-primary" />
              </>
            )}
            {mode === 'magic-link' && (
              <>
                Magic Link
                <MagicWand size={24} weight="duotone" className="text-primary" />
              </>
            )}
          </CardTitle>
          <CardDescription className="text-base">
            {mode === 'sign-in' && 'Sign in to continue helping your neighbors'}
            {mode === 'sign-up' && 'Create your account and start making a difference'}
            {mode === 'magic-link' && "We'll send you a secure link to sign in"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 rounded bg-muted/50">
                  <EnvelopeSimple className="text-muted-foreground" size={16} />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            {mode !== 'magic-link' && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 rounded bg-muted/50">
                    <Key className="text-muted-foreground" size={16} />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 rounded-xl"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                <span className="shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm flex items-start gap-2">
                <span className="shrink-0">✅</span>
                <span>{message}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-12 rounded-xl btn-glow gap-2 text-base font-medium" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Loading...
                </span>
              ) : (
                <>
                  {mode === 'sign-in' && 'Sign In'}
                  {mode === 'sign-up' && 'Create Account'}
                  {mode === 'magic-link' && 'Send Magic Link'}
                  <ArrowRight size={18} weight="bold" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            {mode === 'sign-in' && (
              <>
                <Button
                  variant="ghost"
                  className="w-full text-sm gap-2 rounded-xl h-11"
                  onClick={() => setMode('magic-link')}
                >
                  <MagicWand size={16} />
                  Sign in with magic link instead
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('sign-up')}
                    className="text-primary hover:underline font-medium"
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
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </div>
            )}

            {mode === 'magic-link' && (
              <Button
                variant="ghost"
                className="w-full text-sm gap-2 rounded-xl h-11"
                onClick={() => setMode('sign-in')}
              >
                <Key size={16} />
                Sign in with password instead
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Philosophy Link */}
      <button
        onClick={() => setShowPhilosophy(true)}
        className="mt-8 flex items-center gap-2 text-sm text-muted-foreground/80 hover:text-primary transition-colors relative z-10"
      >
        <BookOpen size={16} />
        <span>Learn about our philosophy</span>
      </button>

      {/* Footer text */}
      <p className="mt-4 text-sm text-muted-foreground/60 text-center relative z-10">
        Join thousands of neighbors helping each other
      </p>
    </div>
  );
}
