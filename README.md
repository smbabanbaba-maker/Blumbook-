# Blumbook

**Talk. Share. Bloom.** A responsive, dark-mode social platform inspired by familiar microblogging navigation, with an original Blumbook identity.

![Blumbook logo](public/logo.svg)

## What works in this first build

- Mobile-first home feed with For you, Following, and Communities.
- Create a post (up to 500 characters), attach an image, like, repost, bookmark and reply.
- Explore/search, trending topics, profiles, follow/unfollow, saved posts, and profile editing.
- Notification, direct-message, and community UI previews (see limitations below).
- Sign up, login, shared posts, follows, likes, reposts, comments, bookmarks, profile updates, and image uploads **when Supabase is configured**.
- Without Supabase credentials it runs as a **clearly identified interactive demo** with sample content. Demo edits are browser-session-only.

## Run locally

Requires Node.js 20 or later.

1. Run 'npm install'.
2. Run 'npm run dev'.
3. Open http://localhost:3000.

To enable a real backend:

1. Create a Supabase project.
2. Paste 'supabase/schema.sql' into the Supabase SQL Editor and execute.
3. In Supabase Authentication, configure email sign-up and confirmation settings.
4. Copy '.env.example' to '.env.local', fill in the Supabase **project URL** and **public/anon/publishable key**.
5. Run 'npm run dev' again. Create a user through Blumbook and publish your first post.

**Never put a Supabase service-role or secret key into a NEXT_PUBLIC variable or into Git.**

For deployment and safety notes, see [docs/SETUP.md](docs/SETUP.md).

## Status & limitations

This is an **MVP, not a production-ready social network**. Sample notifications, message conversations, communities, trending rankings, and sample stats are mock content. Messaging and joining communities are presently demo interactions only. There's no recommendation algorithm, verification workflow, account recovery interface, moderation team, content reporting, block/mute feature, notification infrastructure, production email service, video infrastructure, or abuse/rate-limit system yet.

A domain and marketing launch should wait until moderation, operational security, accessibility, privacy policy, Nigerian data protection compliance, and load testing are ready.

## Tech

Next.js 15 · React 19 · TypeScript · Tailwind CSS · Lucide icons · Supabase (optional backend) · Vercel-ready.

## Branding

The vector app icon is derived from the user-approved **Blumbook logo direction #4**: white letter B, rising orbit and sparkle on a midnight-blue rounded square. It is an original SVG approximation intended for further refinement into production-ready design files.
