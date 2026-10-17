# Blumbook — Product & Launch Roadmap
October 2026 · Product direction: "Where Conversations Become Opportunities"

## Identity
Blumbook is not a clone of X or Facebook. The original value is **Bloom Circles**: make a post, express an Idea, Question or Opportunity, find people and collaborate. The community journey should transform discovery into useful action.

## Phase 1 — Foundation (code added; activation needed)
- Next.js 15 / React 19 / Supabase-ready stack
- Black/white premium responsive design, persistent dark/light switching
- Feed, posts, reply, likes, repost, follow, bookmarks and profiles
- Email authentication scaffolding with Supabase RLS
- Image uploads with dedicated storage and ownership policies
- Operational requirement: add Supabase PUBLIC project URL and publishable key to Vercel (never a service key)
- Run SQL files in order: supabase/schema.sql then supabase/phase2.sql
- Test multiuser access and account security before public opening

## Phase 2 — Distinctiveness (first implementation)
- Bloom Circles: browse, create, join/leave, post Idea/Opportunity/Question. In demo this is local, and with Supabase it uses separate RLS-protected tables.
- Professional profile: headline, skills, public portfolio HTTPS link.
- Hausa/English starter localization; not all text translated yet.
- First visit onboarding, 7-day creator posting activity based only on loaded feed data.
- UI refinements: premium monochrome tokens, mobile-friendly drawer, animated micro-interactions with reduced-motion support.

## Phase 3 — Trust & reliability (REQUIRED before public launch)
- Report intake database created, but **human review/moderation dashboard is not yet staffed or implemented**.
- Complete blocking/muting across devices, safety escalation, appeal process, community guidelines.
- Rate limiting, spam checks, abuse monitoring, email service, password resets, backups, cross-device browser tests.
- Complete data rights: download account information, account deletion, retention policy, Nigeria Data Protection Act review.
- Review and test row-level security with two independent accounts.
- Accessibility WCAG audit.

## Phase 4 — Creator ecosystem (NOT complete)
- Creator Studio v2: server-side analytics, post scheduling, rich media tools, video hosting & transcoding.
- Communities v2: mentorship, referrals, project boards, collaboration requests.
- Translation expansion (full Hausa + more languages), assistive captioning and optional AI translation: requires providers, testing and policy.
- Private messaging: real backend & participant-scoped policies and abuse controls.
- Premium subscriptions and monetization: require payment integration, KYC/eligibility, antifraud, disbursement and tax workflows.

## Phase 5 — Real beta & go-to-market
- Invite first 30–100 testers who care about one niche (for example creators, builders, students).
- Track user activation, weekly active users, circle joins, first useful collaboration, day-7 retention and unresolved content reports.
- Pilot one or two vertical communities. Iterate on usefulness and safety before broad marketing.
- Set product rules, clear support channels, domain, app store policy review and formal trademark check.

## Success metrics
- Activation: % new users who follow or join a Circle within a day.
- Value creation: useful replies and introductions per active Circle.
- Engagement: meaningful content created / user / week, retention at day 7 and day 30.
- Safety: reported items awaiting review and median resolution time.
- Reliability: errors, failed uploads, average feed load time, app availability.

## Current preview status
**Demo mode:** browser-local posts, circles and messages in preview; cannot be considered a shared community.
**Connected Supabase (once owner configures):** real accounts, text posts, reactions, basic circles and professional profile extras, if SQL has been applied and policies verified.
**Not included yet:** actual paid features, staffed moderation, verified analytics, AI translation, video processing, or fully real-time direct messaging.

Do not publicly launch or advertise paid services while required dependencies are incomplete.

## Profile actions (Phase 3)

Run `supabase/phase3.sql` after Phase 2 to enable `open_to_collab`, persistent collaboration requests and account-report intake. The recipient must opt in before the database accepts requests. There is no delivered-message inbox yet. Message button, profile alerts and local hide actions are explicitly previews; not live services or complete safety protections.

