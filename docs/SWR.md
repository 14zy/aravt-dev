# Stale-While-Revalidate (SWR) in the Project

Goals:
- Return cached data to the UI immediately
- Refresh data in the background without flickering
- Prevent duplicate concurrent requests
- Use a consistent approach across all stores

## How It Works

`src/lib/swrCache.ts` contains two utilities:
- `shouldRevalidate(fetchedAt, ttlMs)` — determines whether a background refresh is due. The check runs **only when the store method is called**, so another call is required, either manually or through a timer.
- `dedupe(key, fetcher)` — deduplicates concurrent requests by key so that repeated calls do not create identical HTTP requests.

Store algorithm (`useUserStore` is used as an example):
1. Keep `data`, `fetchedAt`, and loading indicators in the store.
2. When `fetchX({ force, ttlMs })` is called:
   - If `data` is already available, return it to the component immediately without displaying a spinner.
   - If `force === true` or `shouldRevalidate(...)` returns `true`, start a background `fetch` through `dedupe`.
   - If no data is available, use the standard flow with `isLoading = true`.

By default, `ttlMs = 0`. Therefore, **every** subsequent method call made while cached data is available returns the stale data immediately and starts a background request. To refresh less frequently, pass `ttlMs` explicitly.

Environment variables:
- `VITE_DISABLE_CACHE=true` — disables the SWR flow entirely and always calls the API while displaying a loading indicator.
- There are no other environment variables for SWR. Background refreshes are triggered only by subsequent calls to store methods.

## Examples

### User Profile
```ts
const { fetchUserProfile } = useUserStore.getState();
await fetchUserProfile(); // Returns cached data and starts a background refresh
await fetchUserProfile({ force: true }); // Ignores the cache
```

### User Skills
```ts
const { fetchAvailableSkills } = useUserStore.getState();
await fetchAvailableSkills({ ttlMs: 60_000 }); // Refreshes in the background after a one-minute TTL
```

### Aravt Details
```ts
const { fetchAravtDetails } = useAravtsStore.getState();
await fetchAravtDetails(aravtId); // Returns cached data or refreshes it in the background
```

### Auth Store
```ts
const { fetchUser } = useAuthStore.getState();
await fetchUser(); // Returns the cached user and starts an SWR refresh
await fetchUser({ force: true }); // Forces a profile request
```

## How to Verify That Background Refreshing Works

1. Check `.env`: `VITE_DISABLE_CACHE` must not be set to `true`.
2. Open `/dashboard/:id` and wait for the first response (a cold request).
3. Reload the page or switch to another Aravt. `useSelectedAravt` will call `fetchAravtDetails` again, which immediately returns cached data and then starts a background request to `/aravt/:id`.
4. For the auth store, any visit with a valid token is sufficient: `App` calls `fetchUser()`, and the Network panel shows one request to `/users/user/:id`, while the UI continues to display cached data. To force a test, run `useAuthStore.getState().fetchUser({ force: true })` in DevTools.
5. To observe SWR manually in other stores, call `fetchX()` again. For example, visit `/profile` twice or run `fetchUserProfile({ force: true })` in DevTools. The second call returns cached data and sends a request concurrently.

If there are no background requests:
- Make sure caching is not disabled (`VITE_DISABLE_CACHE`).
- Verify that the component actually calls the store method again, such as through a timer, a user action, or navigation between pages.
- Check the console logs. All SWR branches log errors in the form `SWR refresh ... failed`.
