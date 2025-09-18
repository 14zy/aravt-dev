import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/auth';
import { User } from '@/types';
import { ArrowRight, Globe } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';


import { api } from '@/lib/api';

interface LoginProps {
  onLoginSuccess?: () => void;
}

const Login = ({ onLoginSuccess }: LoginProps) => {
  const normalizeUsername = (value: string): string => value.trim();
  const navigate = useNavigate();
  const setToken = useAuthStore(state => state.setToken);
  const login = useAuthStore(state => state.login);
  const referralInfo = useAuthStore(state => state.referralInfo);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');


  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const normalizedUsername = normalizeUsername(username);
      const { access_token, user } = await api.login(normalizedUsername, password);
      setToken(access_token)
      const current_user: User = await api.users_user(user.id);

      login(current_user, access_token);
      onLoginSuccess?.();

      if (referralInfo?.aravtId) {
        useAuthStore.getState().setReferralInfo(null);
        navigate(`/aravts/${referralInfo.aravtId}`);
      } else if (current_user.aravt) {
        navigate('/dashboard');
      } else {
        navigate('/browse');
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-gray-50 pt-4">
      <Card className="w-full max-w-md mx-4 pt-3">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between pb-2">
            <CardTitle className="text-2xl">Welcome to Aravt</CardTitle>

            <Select defaultValue="all">
              <SelectTrigger className="w-[64px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all"><Globe className="h-6 w-6 text-gray-500" /></SelectItem>
                <SelectItem value="mn">🇲🇳 Mongolian</SelectItem>
                <SelectItem value="ru">🇷🇺 Rusain</SelectItem>
                <SelectItem value="zh">🇨🇳 Chinese</SelectItem>
                <SelectItem value="jp">🇯🇵 Japanese</SelectItem>
                <SelectItem value="kp">🇰🇷 Korean</SelectItem>
              </SelectContent>
            </Select>

          </div>
          <CardDescription>
            Please login to your account or sign up for new one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="username" className="space-y-4">
            {/*<TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="username">Username</TabsTrigger>
              {<TabsTrigger value="wallet">TON Wallet</TabsTrigger> }
            </TabsList>
            */}

            {/* <TabsContent value="wallet">
              <div className="space-y-4">
                <div className="w-full flex justify-center">
                  <TonConnectButton />
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">
                      Secure and decentralized
                    </span>
                  </div>
                </div>
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open('https://db.aravt.io', '_blank')}
                  >
                    Don't have a TON wallet?
                  </Button>
                </CardFooter>
              </div>
            </TabsContent> */}

            <TabsContent value="username">
              <form onSubmit={handleUsernameLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="username"
                    placeholder="username"
                    value={username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                    onBlur={() => setUsername(prev => normalizeUsername(prev))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    'Signing in...'
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <div className="text-center text-sm">
                  Don't have an account?{" "}
                  <Link
                    to={`/signup${referralInfo ?
                      `?ref=${referralInfo.referredById}${referralInfo.aravtId ? `&aravtId=${referralInfo.aravtId}` : ''
                      }`
                      : ''
                      }`}
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </Link>
                  <br />
                  <Link
                    to="/forgot-password"
                    className="text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                  <br />
                  <Link
                    to="/resend-email"
                    className="text-primary hover:underline"
                  >
                    Resend confirmation E-mail
                  </Link>
                </div>
              </form>

              <div className="relative w-full mt-4 pt-4">
                <b>Video</b>

                <iframe
                  width="560"
                  height="315"
                  src="https://www.youtube.com/embed/80kMVEKaeaM?si=q7QAVa2Fv3nyRtxt"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="w-full h-64 pt-2"
                ></iframe>
              </div>

              <div className="relative w-full h-80 mt-4">

                <img
                  src="https://app.aravt.io/img/gerege/photo_2568-01-31 15.54.09.jpeg"
                  alt="Background"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <a
                    href="https://t.me/aravtforum"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-lg font-semibold bg-blue-500 px-4 py-2 rounded-md hover:bg-blue-600"
                  >
                    Join Community
                  </a>
                </div>



              </div>

            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;