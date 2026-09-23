import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { RegistrationData } from '@/types';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  // Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  MailCheck,
  MapPin,
  // Sparkles,
  UserRoundPlus,
  // Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Link, useLocation } from 'react-router-dom';

const initialFormData: RegistrationData = {
  username: '',
  email: '',
  password: '',
  city: '',
  date_of_birth: '',
  full_name: '',
};

const SignUp = () => {
  const location = useLocation();
  const referralInfo = useAuthStore(state => state.referralInfo);
  const [formData, setFormData] = useState<RegistrationData>(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');

  const normalize = (value: string): string => value.trim();
  const loginPath = referralInfo
    ? `/login?ref=${referralInfo.referredById}${referralInfo.aravtId ? `&aravtId=${referralInfo.aravtId}` : ''}`
    : '/login';

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const parseOptionalId = (value: string | null) => {
      if (!value) return undefined;
      const parsedValue = Number(value);
      return Number.isInteger(parsedValue) ? parsedValue : undefined;
    };

    const referredById = parseOptionalId(searchParams.get('ref'));
    const aravtId = parseOptionalId(searchParams.get('aravtId'));

    if (referredById === undefined && aravtId === undefined) return;

    const current = useAuthStore.getState().referralInfo;
    const isSame = current?.referredById === referredById && current?.aravtId === aravtId;

    if (!isSame) {
      useAuthStore.getState().setReferralInfo({ referredById, aravtId });
    }
  }, [location.search]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(previous => ({ ...previous, [name]: value }));
  };

  const handleDateChange = (date: Date | null) => {
    if (!date) {
      setFormData(previous => ({ ...previous, date_of_birth: '' }));
      return;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setFormData(previous => ({ ...previous, date_of_birth: `${year}-${month}-${day}` }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const registrationData = {
        ...formData,
        username: normalize(formData.username),
        email: normalize(formData.email),
        city: normalize(formData.city),
        full_name: normalize(formData.full_name),
        refered_by_id: referralInfo?.referredById,
      };

      await api.register(registrationData);
      setIsComplete(true);
    } catch (registrationError: unknown) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : 'We could not create your account. Please review your details and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 text-left shadow-sm">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-emerald-100/70 blur-3xl" />

      <main className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[0.9fr_1.1fr]">
        {/* <section className="order-2 flex flex-col justify-between gap-12 px-6 py-10 sm:px-10 lg:order-1 lg:px-14 lg:py-12 xl:px-16">
          <div>
            <div className="mb-16 hidden items-center gap-3 lg:flex">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-bold tracking-[0.16em] text-slate-950">ARAVT.IO</p>
                <p className="text-xs text-slate-500">Collaborate. Contribute. Grow.</p>
              </div>
            </div>

            <div className="max-w-lg">
              <div className="mb-5 inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                <UserRoundPlus className="mr-1.5 h-3.5 w-3.5" />
                Your next collaboration starts here
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Build more, together.
              </h1>
              <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
                Create your profile, find an Aravt that shares your vision, and turn your contribution into real momentum.
              </p>
            </div>

            <div className="mt-10 max-w-lg space-y-3">
              {[
                'Join mission-driven communities',
                'Contribute to meaningful projects',
                'Track tasks, progress, and rewards',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-medium text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-lg rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-950">A workspace shaped by its community</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Aravt gives every member a clear way to participate, contribute, and grow with the team.
                </p>
              </div>
            </div>
          </div>
        </section> */}

        <section className="order-1 flex items-start justify-center border-b border-slate-200 bg-white/80 px-5 py-8 backdrop-blur-xl sm:px-10 sm:py-12 lg:order-2 lg:items-center lg:border-b-0 lg:border-l xl:px-14">
          <div className="w-full max-w-xl">
            <div className="mb-10 flex items-center justify-between lg:hidden">
              <Link to="/login" className="flex items-center gap-3 !text-slate-950 hover:!text-slate-950">
                {/* <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Sparkles className="h-5 w-5" />
                </span> */}
                <span className="font-bold tracking-[0.16em]">ARAVT.IO</span>
              </Link>
              <LanguageSelect />
            </div>

            <div className="hidden justify-end lg:flex">
              <LanguageSelect />
            </div>

            {isComplete ? (
              <RegistrationComplete email={formData.email} loginPath={loginPath} />
            ) : (
              <div className="mt-8">
                <div className="mb-7">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <UserRoundPlus className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Create your account</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Tell us a little about yourself to get started.</p>
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-6 rounded-2xl" aria-live="polite">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label="Full name" htmlFor="full_name">
                      <Input
                        id="full_name"
                        name="full_name"
                        type="text"
                        placeholder="Your full name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        onBlur={() => setFormData(previous => ({ ...previous, full_name: normalize(previous.full_name) }))}
                        autoComplete="name"
                        required
                        className="h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-950 placeholder:text-slate-400 focus-visible:ring-violet-500"
                      />
                    </FormField>

                    <FormField label="Username" htmlFor="username">
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="Choose a username"
                        value={formData.username}
                        onChange={handleInputChange}
                        onBlur={() => setFormData(previous => ({ ...previous, username: normalize(previous.username) }))}
                        autoComplete="username"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        required
                        className="h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-950 placeholder:text-slate-400 focus-visible:ring-violet-500"
                      />
                    </FormField>
                  </div>

                  <FormField label="Email address" htmlFor="email">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={() => setFormData(previous => ({ ...previous, email: normalize(previous.email) }))}
                      autoComplete="email"
                      required
                      className="h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-950 placeholder:text-slate-400 focus-visible:ring-violet-500"
                    />
                  </FormField>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label="City" htmlFor="city">
                      <div className="relative">
                        <Input
                          id="city"
                          name="city"
                          type="text"
                          placeholder="Where do you live?"
                          value={formData.city}
                          onChange={handleInputChange}
                          onBlur={() => setFormData(previous => ({ ...previous, city: normalize(previous.city) }))}
                          autoComplete="address-level2"
                          required
                          className="h-12 rounded-xl border-slate-200 bg-white px-4 pr-11 text-slate-950 placeholder:text-slate-400 focus-visible:ring-violet-500"
                        />
                        <MapPin className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </FormField>

                    <FormField label="Date of birth" htmlFor="date_of_birth">
                      <div className="relative">
                        <DatePicker
                          id="date_of_birth"
                          name="date_of_birth"
                          selected={formData.date_of_birth ? new Date(`${formData.date_of_birth}T00:00:00`) : null}
                          onChange={handleDateChange}
                          dateFormat="yyyy-MM-dd"
                          placeholderText="YYYY-MM-DD"
                          maxDate={new Date()}
                          required
                          showYearDropdown
                          yearDropdownItemNumber={100}
                          scrollableYearDropdown
                          showMonthDropdown
                          popperClassName="datepicker-popover"
                          wrapperClassName="w-full"
                          className="block h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-11 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                        />
                        <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </FormField>
                  </div>

                  <FormField label="Password" htmlFor="password">
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a secure password"
                        value={formData.password}
                        onChange={handleInputChange}
                        autoComplete="new-password"
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
                    <p className="text-xs text-slate-400">Use a unique password you do not use elsewhere.</p>
                  </FormField>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-700/20"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create account
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <p className="mt-5 text-center text-xs leading-5 text-slate-400">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="!font-medium !text-slate-600 hover:!text-violet-700 hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="!font-medium !text-slate-600 hover:!text-violet-700 hover:underline">Privacy Policy</a>.
                </p>

                <div className="mt-6 border-t border-slate-100 pt-6 text-center">
                  <p className="text-sm text-slate-500">
                    Already have an account?{' '}
                    <Link to={loginPath} className="!font-semibold !text-violet-700 hover:!text-violet-900 hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

const FormField = ({
  children,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  htmlFor: string;
  label: string;
}) => (
  <div className="space-y-2">
    <Label htmlFor={htmlFor} className="text-sm font-semibold text-slate-700">{label}</Label>
    {children}
  </div>
);

const RegistrationComplete = ({ email, loginPath }: { email: string; loginPath: string }) => (
  <div className="mt-12 rounded-3xl border border-emerald-100 bg-white p-7 shadow-lg shadow-slate-900/5 sm:p-9">
    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
      <MailCheck className="h-7 w-7" />
    </span>
    <div className="mt-6">
      <div className="mb-3 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
        Account created
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-slate-950">Check your inbox</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        We sent a confirmation link to <span className="font-semibold text-slate-900">{email}</span>. Open it to finish activating your account.
      </p>
    </div>
    <Button asChild className="mt-7 h-12 w-full rounded-xl bg-slate-950 text-white hover:bg-violet-700">
      <Link to={loginPath} className="!text-white hover:!text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </Button>
  </div>
);

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

export default SignUp;
