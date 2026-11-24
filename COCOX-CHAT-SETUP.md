# CocoX Chat setup

## Supabase settings

1. In Supabase, open **Authentication → Sign In / Providers** and enable **Anonymous Sign-Ins**.
2. The project URL and publishable key are set in `.env` for this project. They are public frontend values; never add a `service_role` or secret key to the browser app.
3. In **SQL Editor**, run `supabase/chat-reports.sql` once. The `messages` table and its basic read/insert policies should already exist from the first setup step.
4. Confirm `public.messages` is enabled in the `supabase_realtime` publication (the original setup SQL added it).

## Deploying

The app reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` at build time. If you remove `.env` from the repository, add those exact names and values under Render → Environment before deploying.

## Chat behavior

- One shared community room; no direct messages.
- Display names are nicknames saved in the current browser.
- Incoming messages create a right-side notification and unread count, including while the in-app browser is open.
- Users can locally block another sender and submit a report for review.
- The supplied SQL adds basic link/contact-detail checks and a server-side send-rate limit.
