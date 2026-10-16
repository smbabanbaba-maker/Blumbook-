# Setup and launch checklist

## Development / review
- Install Node.js 20+ and npm.
- 'npm install'
- 'npm run typecheck'
- 'npm run build'
- 'npm run dev'

## Supabase backend
- Create your own Supabase project and open its SQL Editor.
- Run [supabase/schema.sql](../supabase/schema.sql) **once** to create all tables, row-level security policies, storage bucket and the sign-up profile trigger.
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
