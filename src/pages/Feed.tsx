import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { getInitials } from "@/lib/avatarUtils";
import { useAuthStore } from "@/store/auth";
import { User } from "@/types";
import { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

const Feed = () => {
  const authUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const normalizeUsers = (value: unknown): User[] => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const candidate = (value as Record<string, unknown>).users;
      if (Array.isArray(candidate)) return candidate as User[];
      const fallback = (value as Record<string, unknown>).results;
      if (Array.isArray(fallback)) return fallback as User[];
    }
    return [];
  };

  const loadSubscriptions = async () => {
    const subscribed = normalizeUsers(await api.users_subscriptions());
    setSubscriptions(subscribed);
    return subscribed;
  };

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
            setError(
              "You do not have permission to browse the full user directory, so recommendations are hidden.",
            );
          } else {
            throw err;
          }
        }

        const subscribedData = await loadSubscriptions();

        const filtered = allUsersResponse.filter(
          (user) => user.id !== authUser.id && !user.is_deleted,
        );

        setUsers(filtered);
        setSubscriptions(subscribedData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to load feed data";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [authUser]);

  const safeSubscriptions = Array.isArray(subscriptions) ? subscriptions : [];

  const subscribedIds = useMemo(
    () => new Set(safeSubscriptions.map((user) => user.id)),
    [safeSubscriptions],
  );

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return users
      .filter(
        (user) =>
          !term ||
          user.username?.toLowerCase().includes(term) ||
          user.full_name?.toLowerCase().includes(term),
      )
      .slice(0, 25);
  }, [users, searchTerm]);

  const feedEntries = useMemo(
    () =>
      safeSubscriptions.map((user, index) => ({
        user,
        activity: `Shared a new update ${index + 1} hours ago`,
      })),
    [safeSubscriptions],
  );

  const handleSubscribe = async (userId: number) => {
    setActionInProgress(userId);
    setError(null);
    try {
      await api.users_user_subscribe(userId);
      await loadSubscriptions();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to subscribe to user";
      setError(message);
    } finally {
      setActionInProgress((current) => (current === userId ? null : current));
    }
  };

  const handleUnsubscribe = async (userId: number) => {
    setActionInProgress(userId);
    setError(null);
    try {
      await api.users_user_unsubscribe(userId);
      await loadSubscriptions();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to unsubscribe from user";
      setError(message);
    } finally {
      setActionInProgress((current) => (current === userId ? null : current));
    }
  };

  if (!authUser) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <Alert>
          <AlertDescription>
            Please sign in to see your feed and manage subscriptions.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-3xl font-bold">Feed</h1>
          <p className="text-sm text-muted-foreground">
            Stay up to date with the people you follow.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold">Following:</span>
            <span>{subscriptions.length} creators</span>
          </div>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <section>
          <Card>
            <CardHeader>
              <CardTitle>You Following</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <LoadingSpinner />
                </div>
              ) : feedEntries.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Follow people to populate your feed with new updates and
                  achievements.
                </div>
              ) : (
                feedEntries.map((entry) => (
                  <Card
                    key={entry.user.id}
                    className="border border-border bg-background/50 shadow-none"
                  >
                    <CardHeader className="pb-3 pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {entry.user.avatar_url ? (
                              <AvatarImage
                                src={entry.user.avatar_url}
                                alt={
                                  entry.user.full_name || entry.user.username
                                }
                              />
                            ) : (
                              <AvatarFallback>
                                {getInitials(
                                  entry.user.full_name || entry.user.username,
                                )}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">
                              {entry.user.full_name || entry.user.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.user.city ?? "Global community"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">Following</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <p className="text-sm text-muted-foreground">
                        {entry.activity}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary">
                          Rating {entry.user.rating ?? "—"}
                        </Badge>
                        {entry.user.wallet_address && (
                          <Badge variant="outline">Wallet linked</Badge>
                        )}
                        <Badge variant="outline">
                          {entry.user.skills?.length ?? 0} skills
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <Card>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search people"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
            </div>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredUsers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No other creators found right now.
                </p>
              )}
              {filteredUsers.map((user) => {
                const isSubscribed = subscribedIds.has(user.id);
                const isBusy = actionInProgress === user.id;
                return (
                  <div
                    key={user.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2",
                      {
                        "bg-muted/30": isSubscribed,
                      },
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {user.avatar_url ? (
                          <AvatarImage
                            src={user.avatar_url}
                            alt={user.full_name || user.username}
                          />
                        ) : (
                          <AvatarFallback>
                            {getInitials(user.full_name || user.username)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">
                          {user.full_name || user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.city ?? "No city provided"}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isSubscribed ? "secondary" : "default"}
                      onClick={() =>
                        isSubscribed
                          ? handleUnsubscribe(user.id)
                          : handleSubscribe(user.id)
                      }
                      disabled={isBusy}
                    >
                      {isBusy
                        ? "Working..."
                        : isSubscribed
                          ? "Unfollow"
                          : "Follow"}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Feed;
