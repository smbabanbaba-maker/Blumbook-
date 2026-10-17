# Blumbook Phase 5 — Activation and testing

## New feature code
- Bloom Opportunities: create categorized opportunities, apply privately and close your listings.
- Direct Messages: genuine text DMs, recipient read acknowledgements and RLS ownership if Supabase is connected.
- Notifications: likes, follows, replies, and DMs are generated through protected database triggers.
- Media: share MP4/WebM videos smaller than 30 MB and browse full-screen photos/videos.
- Creator Studio: loaded-feed metrics, local drafts, seven-day chart, CSV export.

## Activate the backend
1. In your Supabase SQL Editor apply the files in order: schema.sql, phase2.sql, phase3.sql, phase4.sql, phase5.sql.
2. For an existing database only apply migrations you have not already applied. Phase5 is intended as a one-time migration.
3. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel using the public project URL and publishable/anon key. NEVER put service-role secrets into the frontend.
4. Redeploy. Check Email Auth and confirm new accounts can sign in.
5. Use three independent user accounts to verify direct-message RLS, private opportunity applications, posts, follows, media access and notifications.
6. Optionally turn on Supabase Realtime publication for the messages and notification tables to receive new events without refreshing.

## This is a beta, not a public-launch-ready service
- Without Supabase configuration, no real DM, application, notification or shared post is sent or saved. The UI explicitly shows demo mode.
- The Creator Studio drafts and planned dates only save on this device and do NOT auto-publish.
- Video files are uploaded directly, without transcoding, adaptive streaming or dedicated video CDN.
- Paid Premium, monetization, KYC, payout systems, advanced voice notes and AI translations are NOT yet implemented.
- Production rate limiting, moderation, appeals, report queue, data-deletion workflows, and database-level block enforcement are still required.
- Do not invite a wide public audience until the privacy/security/cost review, backups and mobile performance tests have been performed.

## Practical acceptance tests
- Home, Search, Profile, menu and Videos work in dark and light.
- New user creates a post with photo; another account likes and replies.
- DMs between two users cannot be read by a third account.
- Opportunity application only readable by sender and opportunity owner.
- Messages generate notifications and read receipts.
- MP4/WebM (up to 30 MB) video uploads and playback work.
- Keyboard navigation, 320 px mobile viewport and poor-network behavior tested.
- Verify Nigeria Data Protection Act and other market-specific obligations.
