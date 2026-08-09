# Strip the generated backend files

Goal: leave the repo backend-free so you can connect your own "RailVerse" Supabase project later, with zero changes to the frontend.

## What changes

- Delete the auto-generated integration folder `src/integrations/supabase/` (client, admin client, auth middleware, auth attacher, generated types).
- Remove the `attachSupabaseAuth` import and its entry in `functionMiddleware` in `src/start.ts`, leaving the error and CSRF middleware exactly as they are.
- Delete the local `supabase/` folder (config only, no migrations in use).

## What does NOT change

- No UI, routing, styling, or animation changes.
- No changes to the passenger/admin dashboards, booking, seat allocation, waiting list, priority queue, or admin features.
- The existing localStorage auth (`src/lib/railverse/auth.tsx`) stays exactly as it is — nothing in the app currently reads from the backend, so removing these files has no runtime effect.

## Notes for you

- Disconnecting Lovable Cloud itself is a workspace-admin action in Cloud → Advanced → Disconnect. It is irreversible and deletes the managed database, storage, and functions. Stripping the files does not do this for you.
- After you connect your own Supabase project through the connector, the integration files are regenerated pointing at RailVerse, and `src/start.ts` gets the auth attacher back if any protected server function needs it.

## Verification

Typecheck and build to confirm nothing else imported the removed modules.
