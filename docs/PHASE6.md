# Blumbook Phase 6 — activation, safety and product boundaries

This release adds **UI and code for Blum Clips, Stories, Polls, a unified creation menu, Live sessions, Blum AI, scheduled text posts, verification requests and creator earnings interest**.

## What works without external services

- The mobile Create (+) menu and navigation are available to try. Bottom tabs stay at five: Home, Explore, Clips, Notifications and Messages. Profile remains reachable through the avatar / main menu.
- The Clips player browses uploaded videos. Without connected accounts there are no real member clips. Sample posts do not pretend to be real new members.
- Stories, poll creation/voting and the Live session directory support local-session demos. Nothing in a demo is delivered to other users.
- The Creator Earnings page **does not** show invented payments or income. Verification requests **do not** grant checkmarks.
- Existing Posts, Messages, Notifications and Bloom Opportunities from Phase 5 remain, subject to their backend requirements.

## Activate real user data (in order)

1. Create a Supabase project and set the publicly safe `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as Vercel environment variables.
2. In the Supabase SQL Editor, run **one time each** `supabase/schema.sql`, `supabase/phase2.sql`, `supabase/phase3.sql`, `supabase/phase4.sql`, `supabase/phase5.sql` and then **`supabase/phase6.sql`**. On an existing database, only apply migrations not previously installed; Phase 5 has a non-idempotent CHECK constraint and is intended to be run once.
3. Redeploy Vercel after environment variables change.
4. Test with three independent accounts. Ensure one member cannot read another's DMs, interests, story views, verification request, AI quota, or scheduled posts. Ensure nobody can grant themselves verified status, alter poll results, or change another user's broadcast.
5. Enable Supabase Auth email confirmation and review moderation/reporting, block enforcement, retention, terms and privacy policy before any public invitation. Rotate secrets if they were ever exposed.

## Enable Blum AI

- Configure `OPENAI_API_KEY` **only on the server** in Vercel; never use a `NEXT_PUBLIC_` prefix. The app uses `POST /api/ai`, validates a signed-in Supabase session, enforces a database allowance of ten generation attempts per member per UTC day, and never stores output by default.
- Optional `OPENAI_MODEL` is a server environment variable; the default is `gpt-4.1-mini`. You must provision billing/limits at the AI provider. Text/translation may contain errors and must be reviewed.
- Apply Phase 6 SQL first so the `claim_ai_daily_quota` RPC exists; otherwise generation stays unavailable.
- Server quota reduces abuse but does not replace IP-based throttling, spending caps, and monitoring in a public service.

## Activate scheduled publishing

- Supabase database table `scheduled_posts` stores scheduled **text-only** content. Merely saving a date **does not** publish the post.
- Deploy the Supabase Edge Function from `supabase/functions/publish-due-posts/index.ts` with appropriate Supabase CLI commands. Configure its secret environment variable `CRON_SECRET`; the service-role key must remain exclusively server-side.
- Set up a trusted cron job that POSTs to the Edge Function URL with header `x-cron-secret`. Test interval, authorization, duplicate retry behavior, errors and rollback. **No automatic publishing exists until this external worker and scheduler are deployed and tested.**
- The SQL function `publish_due_blumbook_posts` is restricted to service_role. It claims at most 50 pending posts per execution, and associates the published post with its original schedule for duplicate prevention. Review operational limits and failure retries.

## Stories, Polls and Live

- Stories are filtered by a 24-hour expiry. The storage objects might remain after expiry: configure a server-side deletion/retention job and media cost controls.
- Polls use one vote per authenticated member, an immutable poll duration and aggregate count RPC. Inspect RLS with real users before enabling globally.
- Live scheduling and RSVP use public session metadata. "Go Live" publishes an **external HTTPS broadcast URL** supplied by the host; **no in-app microphone, camera, transcoding, chat or live-stream transport** is built yet. Do not allow unknown URLs without abuse checks.
- Videos are direct MP4/WebM uploads below 30 MB, not an adaptive short-video streaming pipeline.

## Monetization and verification

- The verification request database accepts only pending applications from the real account holder. Staff must manually validate evidence in a privileged admin workflow that is not implemented here.
- Creator Earnings is an opt-in interest list only. There is **no wallet, transaction, payout, payment provider, subscriptions, or monetization accrual**. Financial services, KYC, account eligibility, chargebacks and fraud prevention need separate work.

## Practical release checks

- [ ] GitHub Typecheck and Next.js production build PASS; Vercel preview READY
- [ ] Android light/dark layout, drawer, keyboard accessibility and modal closing
- [ ] Create menu routes to Post, Photo, Video, Poll, Story, Opportunity, Live and Schedule
- [ ] Stories respect their privacy/expiry; photos and video can be opened and uploaded
- [ ] Votes are accepted only once; SQL poll counting cannot expose who voted
- [ ] User signup and private messages work across two distinct accounts
- [ ] Verification cannot self-approve and creator earnings remain disabled
- [ ] AI secret never appears in browser and server enforces quota
- [ ] Schedule worker is configured, tested, monitored and guarded against repeated posts
- [ ] Abuse prevention, RLS threat tests, data rights, storage lifecycle and financial/compliance review

## Product decision

**Ship the UI only as a beta** until the external services and safety work have been finished. Preserve the minimal monochrome look, small bottom navigation, and clear demo vs. real functionality distinctions.
