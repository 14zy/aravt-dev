import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { getInitials } from '@/lib/avatarUtils';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import type { User } from '@/types';
import { AxiosError } from 'axios';
import { ArrowRight, BookOpen, Globe2, Newspaper, Search, Sparkles, UserPlus, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const normalizeUsers = (value: unknown): User[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const candidate = (value as Record<string, unknown>).users;
    if (Array.isArray(candidate)) return candidate as User[];
    const fallback = (value as Record<string, unknown>).results;
    if (Array.isArray(fallback)) return fallback as User[];
  }
  return [];
};

const Feed = () => {
  const authUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!authUser) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        let allUsersResponse: User[] = [];
        try {
          allUsersResponse = normalizeUsers(await api.users());
        } catch (err) {
          const axiosErr = err as AxiosError;
          if (axiosErr.response?.status === 401) {
            setError('You do not have permission to browse the full user directory, so recommendations are hidden.');
          } else {
            throw err;
          }
        }
        const subscribedData = normalizeUsers(await api.users_subscriptions());
        setUsers(allUsersResponse.filter((user) => user.id !== authUser.id && !user.is_deleted));
        setSubscriptions(subscribedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load feed data');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [authUser]);

  const subscribedIds = useMemo(() => new Set(subscriptions.map((user) => user.id)), [subscriptions]);
  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return users.filter((user) =>
      !term ||
      user.username?.toLowerCase().includes(term) ||
      user.full_name?.toLowerCase().includes(term) ||
      user.city?.toLowerCase().includes(term),
    ).slice(0, 25);
  }, [users, searchTerm]);
  const feedEntries = useMemo(() => subscriptions.map((user, index) => ({
    user,
    activity: `Shared a new update ${index + 1} hours ago`,
  })), [subscriptions]);
  const publications = useMemo(() => [
    { title: 'Aravt members releases the new ecosystem brief', source: 'Aravt #2', time: '11.05.2026 11:00' },
    { title: 'Community members are onboarding new builders this week', source: 'Aravt #1', time: '12.05.2026 14:30' },
    { title: 'Funding and collaboration opportunities are opening across regions', source: 'Aravt #51', time: '14.05.2026 16:20' },
  ], []);

  const handleSubscription = async (userId: number, isSubscribed: boolean) => {
    setActionInProgress(userId);
    setError(null);
    try {
      if (isSubscribed) await api.users_user_unsubscribe(userId);
      else await api.users_user_subscribe(userId);
      setSubscriptions(normalizeUsers(await api.users_subscriptions()));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isSubscribed ? 'unfollow' : 'follow'} user`);
    } finally {
      setActionInProgress((current) => current === userId ? null : current);
    }
  };

  if (!authUser) {
    return <div className="mx-auto max-w-4xl py-12"><Alert><AlertDescription>Please sign in to see your feed and manage subscriptions.</AlertDescription></Alert></div>;
  }

  return (
    <div className="relative space-y-6 overflow-hidden px-0 py-0">
      <div className="pointer-events-none absolute -right-32 -top-32 -z-10 h-80 w-80 rounded-full bg-violet-100/70 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 top-96 -z-10 h-72 w-72 rounded-full bg-emerald-50 blur-3xl" />

      <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-bl from-violet-100/80 via-transparent to-transparent" />
        <div className="relative max-w-2xl">
          <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1 text-xs font-medium">
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-violet-600" />Community
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Your network</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">Keep up with people you follow and discover more builders across the Aravt community.</p>
        </div>
        <div className="relative mt-7 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5 sm:max-w-xl sm:gap-4">
          {[
            { label: 'Following', value: subscriptions.length, icon: Users },
            { label: 'Discover', value: users.length, icon: UserPlus },
            { label: 'Updates', value: feedEntries.length + publications.length, icon: Newspaper },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-slate-50 px-3 py-3 sm:px-4">
              <Icon className="mb-2 h-4 w-4 text-violet-600" />
              <p className="truncate text-lg font-bold text-slate-950">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </header>

      {error && <Alert variant="destructive" className="rounded-2xl"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
        <main className="space-y-6">
          <section aria-labelledby="friends-heading" className="space-y-4">
            <div>
              <h2 id="friends-heading" className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">From people you follow</h2>
              <p className="mt-1 text-sm text-slate-500">Recent activity from your community.</p>
            </div>
            <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                {isLoading ? <div className="flex justify-center py-12"><LoadingSpinner /></div> : feedEntries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600"><Users className="h-5 w-5" /></div>
                    <p className="mt-4 font-semibold text-slate-900">Your feed is ready for new voices</p>
                    <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">Follow people from the suggestions to see their updates and achievements here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {feedEntries.map((entry) => (
                      <article key={entry.user.id} className="group rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-11 w-11 shrink-0 ring-2 ring-slate-100">
                              {entry.user.avatar_url && <AvatarImage src={entry.user.avatar_url} alt={entry.user.full_name || entry.user.username} />}
                              <AvatarFallback className="bg-violet-100 text-sm font-semibold text-violet-700">{getInitials(entry.user.full_name || entry.user.username)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-950">{entry.user.full_name || entry.user.username}</p>
                              <p className="truncate text-xs text-slate-500">@{entry.user.username} · {entry.user.city ?? 'Global community'}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="shrink-0 rounded-full text-[11px]">Following</Badge>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-600">{entry.activity}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge variant="outline" className="rounded-full font-normal">Rating {entry.user.rating ?? '—'}</Badge>
                          {entry.user.wallet_address && <Badge variant="outline" className="rounded-full font-normal">Wallet linked</Badge>}
                          <Badge variant="outline" className="rounded-full font-normal">{entry.user.skills?.length ?? 0} skills</Badge>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="news-heading" className="space-y-4">
            <div>
              <h2 id="news-heading" className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">News from Aravts</h2>
              <p className="mt-1 text-sm text-slate-500">Highlights from teams across the network.</p>
            </div>
            <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="divide-y divide-slate-100 p-0">
                {publications.map((item, index) => (
                  <article key={item.title} className="group flex gap-4 p-5 transition-colors hover:bg-slate-50/80">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', index % 2 === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700')}>
                      {index % 2 === 0 ? <Globe2 className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <p className="text-sm font-semibold leading-6 text-slate-900">{item.title}</p>
                        <Badge variant="secondary" className="w-fit shrink-0 rounded-full">{item.source}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{item.time}</p>
                    </div>
                    <ArrowRight className="mt-2 hidden h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 sm:block" />
                  </article>
                ))}
              </CardContent>
            </Card>
          </section>
        </main>

        <aside className="xl:sticky xl:top-6">
          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-5">
              <CardTitle className="flex items-center gap-2 text-base text-slate-950"><UserPlus className="h-5 w-5 text-violet-600" />Who to follow</CardTitle>
              <CardDescription>Find people by name, username, or city.</CardDescription>
              <div className="relative pt-2">
                <Search className="absolute bottom-3 left-3 h-4 w-4 text-slate-400" />
                <Input aria-label="Search people" placeholder="Search people..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="rounded-xl bg-slate-50 pl-9" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              {isLoading ? <div className="flex justify-center py-10"><LoadingSpinner /></div> : filteredUsers.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-slate-500">No creators match your search.</p>
              ) : filteredUsers.map((user) => {
                const isSubscribed = subscribedIds.has(user.id);
                const isBusy = actionInProgress === user.id;
                return (
                  <div key={user.id} className={cn('flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-slate-50', isSubscribed && 'bg-violet-50/60')}>
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name || user.username} />}
                        <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">{getInitials(user.full_name || user.username)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{user.full_name || user.username}</p>
                        <p className="truncate text-xs text-slate-500">{user.city ?? `@${user.username}`}</p>
                      </div>
                    </div>
                    <Button size="sm" variant={isSubscribed ? 'outline' : 'default'} className="shrink-0 rounded-xl" onClick={() => void handleSubscription(user.id, isSubscribed)} disabled={isBusy}>
                      {isBusy ? 'Saving...' : isSubscribed ? 'Following' : 'Follow'}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default Feed;
