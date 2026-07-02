# State Management

All server state goes through **Redux Toolkit Query (RTK Query)** — every domain has its own `createApi()` "slice" under `src/api/`. There is no separate use of `@tanstack/react-query` or `swr` found in the actual API layer despite both being listed in `package.json` dependencies — worth pruning those if truly unused, or checking for usage elsewhere (e.g. inside individual page components) before removing.

## Store setup (`src/store/index.js`)

```js
const apiReducers = { [authApi.reducerPath]: authApi.reducer, ... }; // one per API slice
const apiMiddlewares = [authApi.middleware, ...];

export const store = configureStore({
  reducer: apiReducers,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(...apiMiddlewares),
  devTools: process.env.NODE_ENV !== "production",
});
```

12 API slices are registered: `auth`, `rbac`, `quotation`, `user`, `vendors`, `notifications`, `activityLogs`, `projects`, `settings`, `reports`, `userSignature`, `unit`. There is **no separate "app state" slice** (no `createSlice` for UI/local state visible at the store level) — local/UI state is handled with component-level `useState` or context, not Redux.

## Auth state specifically (`src/store/use-auth.js`)

`useAuth()` is a thin wrapper around the `authApi`, not a separate auth slice:

```js
const { data, isLoading, isError, refetch } = useMeQuery();
const user = data?.user ?? null;
```

- `login(email, password)` calls the login mutation, stores the returned JWT in `localStorage.token`, then `refetch()`s `/auth/me`.
- `logout()` calls the logout mutation, clears `localStorage.token`, invalidates the `AuthUser` tag, and does a **hard redirect** (`window.location.href = "/login"`) rather than a client-side navigation — this fully resets all RTK Query cache/state on logout.

## Cache invalidation pattern

Standard RTK Query tag-based invalidation throughout — e.g. in `quotation.api.js`, every mutation (`createQuotation`, `approveQuotation`, etc.) declares `invalidatesTags: ["Quotations"]`, and `getQuotations`/`getQuotationById` declare `providesTags: ["Quotations"]`, so any mutation automatically refetches affected list/detail queries. Quotation versions use per-item tags (`{ type: "QuotationVersions", id }`) for finer-grained cache updates on that sub-resource.

## Realtime (outside Redux)

WebSocket-driven notifications aren't a live data subscription — `lib/socket.js` manages a plain Socket.IO client instance, and `hooks/useNotificationSocket.js` listens for a `"notification"` socket event and, on receipt, simply dispatches `notificationsApi.util.invalidateTags(["Notifications"])`. That triggers RTK Query to refetch the notification list/bell through its normal cache mechanism — the socket is only a trigger, not a data source. The hook also fully disconnects the socket when `userId` becomes falsy (e.g. on logout).
