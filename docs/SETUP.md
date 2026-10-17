# Setup and launch checklist

## Development / review
- Install Node.js 20+ and npm.
- 'npm install'
- 'npm run typecheck'
- 'npm run build'
- 'npm run dev'

## Supabase backend
- Create your own Supabase project and open its SQL Editor.
- Run [supabase/schema.sql](../supabase/schema.sql) first on a fresh database. Then apply `supabase/phase2.sql`, `supabase/phase3.sql`, and [supabase/phase4.sql](../supabase/phase4.sql) in order. Existing databases should apply only the migrations they have not yet applied.
- Under Authentication → Providers, enable email sign-up. You may require email confirmation; if so, users must confirm before interacting.
- Copy [.env.example](../.env.example) to '.env.local':
  - NEXT_PUBLIC_SUPABASE_URL=your-project-url
  - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-project-public-key
- Restart Next.js after changing variables.

The browser only uses public Supabase credentials. RLS enforces ownership for writes. Do not disable RLS and **never expose a service role key**.

## Vercel deploy
- Import GitHub repository 'smbabanbaba-maker/Blumbook-' into Vercel.
- Framework preset: Next.js, root directory: '.'
- For a real backend, add the same NEXT_PUBLIC variables in Project Settings → Environment Variables.
- Deploy the chosen branch and check the live site on mobile.

You can preview with **no variables**, but that is sample/demo mode. Do not advertise it as a real shared social platform.

## Before opening public registrations
- Decide and publish Terms, Privacy Policy, community guidelines, copyright reporting and data-retention policy.
- Implement reporting, blocking, moderation tools and human review process.
- Add anti-bot protections, sign-up throttling, posting rate limits, and spam detection.
- Set up transactional email, login recovery, auth redirects, backups and monitoring.
- Implement production direct messages with end-to-end access policies.
- Add tests (unit, integration, end-to-end), accessibility audits, security review and load testing.
- Review Nigerian Data Protection Act 2023 obligations and any other jurisdictions served.
- Verify trademark rights for the Blumbook name and final logo; buy the selected domain.

## Profile image and pin feature

- The new profile supports avatar, cover image, optional location, website, registration date, and one pinned post.
- Before connecting live user data, run `supabase/phase4.sql` to add `banner_url`, `pinned_post_id` and constrained update privileges.
- Image uploads use the existing public `post-media` bucket (5 MB max; supported JPEG, PNG, WebP, GIF).
- The `Posts`, `Replies`, `Media`, and `Likes` tabs work on posts/replies currently loaded into the feed. Pagination and private likes remain future work.
- In demo mode, profile photo edits and pinned posts are temporary and not synchronized across devices.
