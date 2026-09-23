import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { User } from '@/types';
import {
  ArrowRight,
  // BriefcaseBusiness,
  // CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  // Send,
  // Sparkles,
  // Users,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface LoginProps {
  onLoginSuccess?: () => void;
}

const Login = ({ onLoginSuccess }: LoginProps): JSX.Element => {
  const normalizeUsername = (value: string): string => value.trim();
  const navigate = useNavigate();
  const setToken = useAuthStore(state => state.setToken);
  const login = useAuthStore(state => state.login);
  const referralInfo = useAuthStore(state => state.referralInfo);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const signupPath = referralInfo
    ? `/signup?ref=${referralInfo.referredById}${referralInfo.aravtId ? `&aravtId=${referralInfo.aravtId}` : ''}`
    : '/signup';

  const handleUsernameLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const normalizedUsername = normalizeUsername(username);
      const { access_token, user } = await api.login(normalizedUsername, password);
      setToken(access_token);
      const currentUser: User = await api.users_user(user.id);

      login(currentUser, access_token);
      onLoginSuccess?.();

      if (referralInfo?.aravtId) {
        useAuthStore.getState().setReferralInfo(null);
        navigate(`/aravts/${referralInfo.aravtId}`);
      } else {
        navigate('/browse');
      }
    } catch (loginError: unknown) {
      setError(loginError instanceof Error ? loginError.message : 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 text-left shadow-sm">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-emerald-100/70 blur-3xl" />

      <main className="relative mx-auto px-8 grid min-h-[calc(100vh-4rem)] max-w-7xl lg:grid-cols-[1.08fr_0.92fr]">
        

        <section className="order-1 flex items-start justify-center border-b border-slate-200 bg-white/80 px-5 py-8 backdrop-blur-xl sm:px-10 sm:py-12 lg:order-2 lg:items-center lg:border-b-0 lg:border-l">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                {/* <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Sparkles className="h-5 w-5" />
                </span> */}
                <span className="font-bold tracking-[0.16em] text-slate-950">ARAVT.IO</span>
              </div>
              <LanguageSelect />
            </div>

            <div className="hidden justify-end lg:flex">
              <LanguageSelect />
            </div>

            <div className="mt-8">
              <div className="mb-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  🌀
                  {/* <CheckCircle2 className="h-6 w-6" /> */}
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Welcome back</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to continue to your Aravt workspace.</p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-6 rounded-2xl" role="alert" aria-live="polite">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleUsernameLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-semibold text-slate-700">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    onBlur={() => setUsername(previous => normalizeUsername(previous))}
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    className="h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-950 placeholder:text-slate-400 focus-visible:ring-violet-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                    <Link to="/forgot-password" className="!text-xs !font-semibold !text-violet-700 hover:!text-violet-900 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="   Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                      className="h-12 rounded-xl border-slate-200 bg-white px-4 pr-12 text-slate-950 placeholder:text-slate-400 focus-visible:ring-violet-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(previous => !previous)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-transparent p-0 text-slate-400 transition hover:border-transparent hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-700/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-500">
                  New to Aravt?{' '}
                  <Link to={signupPath} className="!font-semibold !text-violet-700 hover:!text-violet-900 hover:underline">
                    Create an account
                  </Link>
                </p>
                <Link
                  to="/resend-email"
                  className="mt-3 inline-block !text-xs !font-normal !text-slate-400 hover:!text-slate-700 hover:underline"
                >
                  Resend confirmation email
                </Link>
              </div>
            </div>
          </div>
        </section>
        
      </main>
    </div>
  );
};

const LanguageSelect = () => (
  <Select defaultValue="en">
    <SelectTrigger aria-label="Select language" className="h-10 w-[104px] rounded-xl border-slate-200 bg-white text-slate-600 shadow-none">
      <Globe className="mr-2 h-4 w-4 text-violet-600" />
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="en">English</SelectItem>
      <SelectItem value="mn">🇲🇳 Mongolian</SelectItem>
      <SelectItem value="ru">🇷🇺 Russian</SelectItem>
      <SelectItem value="zh">🇨🇳 Chinese</SelectItem>
      <SelectItem value="jp">🇯🇵 Japanese</SelectItem>
      <SelectItem value="kr">🇰🇷 Korean</SelectItem>
    </SelectContent>
  </Select>
);

export default Login;
