# Blumbook Premium UI Design System
Version: 1.1 — October 2026

## Brand promise
**Talk. Share. Bloom.** A social platform built around expression, connection, and thoughtful discovery. Keep an original Blumbook identity rather than copying logos or visual assets from other products. Familiar navigation conventions are acceptable; proprietary presentation is not.

## Visual principles
1. **Calm over clutter:** One primary action at a time. Keep dense feeds readable.
2. **Monochrome:** Chrome, navigation, actions, icons, cards, and typography use only black, white and neutral grays. User-shared photos and videos may retain their natural colors.
3. **Legibility:** Use text hierarchy, white space and weight, not bright color, to signal importance.
4. **Touch-first:** All main mobile touch targets at least 44×44 px, with tactile pressed states.
5. **Product truth:** Do not depict future services as launched. Use Preview/Coming Soon labels where appropriate.
6. **Choice:** Both Dark and Light modes must work across the entire application and persist on the device.

## Core color tokens
| Role | Dark | Light |
| --- | --- | --- |
| Background | \`#000000\` | \`#FFFFFF\` |
| Surface | \`#070707\` | \`#FFFFFF\` |
| Raised surface / search | \`#121212\` | \`#F5F5F5\` |
| Border | \`#272727\` | \`#E5E5E5\` |
| Primary text | \`#FAFAFA\` | \`#111111\` |
| Secondary text | \`#929292\` | \`#686868\` |
| Primary button | \`#FAFAFA\` | \`#111111\` |
| Button label | \`#050505\` | \`#FFFFFF\` |

**Note:** Text/background combinations should be contrast-tested to WCAG 2.2 AA for normal text, including disabled and interactive states. Desaturated imagery is only for avatar placeholders; uploaded media remain faithful to the original.

## Typography
- Font stack: Inter (when available), system UI, Segoe UI, sans-serif.
- Mobile primary screen title: 20 px / 800 weight.
- Section display headline: 28–42 px / 800 weight, short copy only.
- List title: 15–17 px / 700 weight.
- Body: 14–16 px / 400–500 weight.
- Caption and metadata: 12–13 px / 400 weight, subdued neutral gray.
- Keep comfortable 1.45–1.65 line height for secondary descriptions.

## Spacing and shape
- Base spacing unit 4 px; common increments 8 / 12 / 16 / 20 / 24 / 32 px.
- Post row 16–18 px inset; clear 1 px neutral separators.
- Settings directory rows: around 115 px minimum on mobile for title plus descriptions.
- Search field: pill, 55–58 px tall, gray raised surface, 16 px inset.
- Rounded features: pill buttons and search, 12–18 px for modals/cards, circular avatars.
- Avoid gratuitous gradients, shadows, bright status dots and decorative strokes.

## Screen rules
| Screen | Structure | Main behaviors |
| --- | --- | --- |
| Home | Header, For You/Following tabs, chronological post cards, bottom nav | Compose, react, reply, follow |
| Explore | Pill search, trend rows, suggested profiles | Search people/posts; discover profiles |
| Notifications | Text hierarchy and neutral icons | Filter categories; local preferences |
| Messages | Clear list and separate thread | Preview conversations only until backend |
| Profile | Banner, strong avatar, name/handle, statistics, posts | Edit own profile, follow others |
| Side drawer | Avatar, name/handle, following/followers, 7 core links, help/settings and theme | Works one-handed; dismiss by overlay/Escape |
| Settings | Back, heading and handle, search, six categories, subdued footer | Search; details; theme; simple local preferences |
| Communities | Editorial heading, accessible join cards | Preview interaction until real communities backend |
| Creator Studio | Neutral metric tiles, shortcut to compose | No invented monetary figures |
| Premium/Spaces | Editorial teaser with explicit future-release status | Do not imply paid/live service is available |

## Settings information architecture (reference-screenshot inspired)
1. Your account: edit/view profile; explain when export/deactivation is unavailable.
2. Security and account access: explain real authentication status; offer sign-in/out.
3. Privacy and safety: transparent disclosure of public posts and pending block/report.
4. Notifications: local likes/follow/reply filter preferences, labeled not live push.
5. Accessibility, display and languages: accessible Dark/Light choices and larger menu text.
6. Additional resources: Help Center, version and platform status.

Search filters these six entries in the main Settings overview. The mobile bottom navigation and floating post button are hidden inside Settings for distraction-free focus. Theme choice survives refresh in localStorage and is used throughout. Nested categories have working back navigation.

## Responsiveness & accessibility
- Mobile (<701px): fixed bottom 5-item navigation, overlay side drawer, touch-first controls.
- Tablet: narrow desktop nav rail where space permits.
- Desktop: left navigation, main content, right discovery rail.
- Logical labels for navigation and icon-only controls, keyboard focus outlines, Escape to close dialogs and reduced-motion preference.
- Use aria-pressed for appearance selections and native checkbox semantics for preferences.
- Do not place meaningful information solely in an image.

## Release quality gates
- Run \`npm run typecheck\` and \`npm run build\`.
- Verify dark and light contrast for every screen on Android and desktop, including Settings detail pages.
- Check drawer scroll, viewport safe areas, keyboard and 320px layouts.
- Confirm that a theme choice survives refresh and new navigation.
- Verify Supabase policies, authentication and storage before declaring social interactions production-ready.
- Complete account safety tools, data rights, reporting, spam controls, moderation, privacy policies and content management before public launch.
