import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Sprout, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type AuthMode = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email to confirm your account!');
      setMode('login');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset link sent to your email!');
      setMode('login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-2">
            <Sprout className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {mode === 'forgot' ? t('resetPassword') : mode === 'signup' ? t('signup') : t('login')}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {mode === 'forgot' ? t('resetSubtitle') : mode === 'signup' ? t('signupSubtitle') : t('loginSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleForgotPassword} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('fullName')}</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
            )}

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-sm text-primary hover:underline"
              >
                {t('forgotPassword')}
              </button>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'forgot' ? t('sendResetLink') : mode === 'signup' ? t('signup') : t('login')}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === 'forgot' ? (
              <button onClick={() => setMode('login')} className="text-primary hover:underline">
                {t('backToLogin')}
              </button>
            ) : mode === 'login' ? (
              <p>
                {t('noAccount')}{' '}
                <button onClick={() => setMode('signup')} className="text-primary hover:underline font-medium">
                  {t('signup')}
                </button>
              </p>
            ) : (
              <p>
                {t('haveAccount')}{' '}
                <button onClick={() => setMode('login')} className="text-primary hover:underline font-medium">
                  {t('login')}
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
