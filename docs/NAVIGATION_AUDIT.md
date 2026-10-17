# Blumbook — duplicate navigation and UX audit

Review completed on October 17, 2026. Checked the main app's Home, Explore, Profile, Create, mobile/desktop navigation, menus and Creator Studio, and cross-checked Clips, Bloom Circles, Stories, Polls, Live and Scheduled Posts modules.

## Duplications corrected
1. **Blum Clips / Videos:** both route strings mounted the same component; retain **Blum Clips** with one bottom tab.
2. **Live / Spaces:** both mounted LiveSessions; retain **Live Sessions**.
3. **Mobile Profile:** the drawer repeated Profile beneath an existing account/profile button; retain the account card. Avatar now opens the profile, while ••• opens the menu.
4. **Desktop Profile:** the avatar/account switch and left navigation both linked to your own profile; keep the account button and give the nav position to Bookmarks.
5. **Home community duplication:** dedicated Bloom Circles existed as its own screen and as a Home feed tab; Home now uses **For you / Following**.
6. **Home creation duplication:** inline compose box, Post button and the global + all opened creation; retain the **Create (+)** menu.
7. **Home/Explore clutter:** Opportunities, Polls, AI, Live and Clips shortcuts repeated destinations in bottom nav/menu/Creator Studio; remove redundant feature rows.
8. **Profile Edit/Share duplication:** own profile had the two buttons at the top and inside •••; only top-row actions remain. Other-profile safety/report menu remains.
9. **Drawer clutter:** remove the nested More tools accordion, extra Clips, duplicate Stories, fake Premium link, Spaces alias and device-only Lists entry. Keep useful Bookmarks, Bloom Circles, Bloom Opportunities, Creator Studio, Polls, Live Sessions, Settings and Help.
10. **Draft vs scheduled post confusion:** Creator Studio drafts no longer ask for a scheduled date. The Scheduled Posts tool remains the only scheduling workflow. Old local drafts remain accessible; old stored dates explicitly say “not scheduled”.
11. **Repeated welcome messages:** desktop sign-up sidebar only appears for signed-out cloud visitors, rather than alongside the signed-in welcome card.

## Navigation after cleanup
- **Mobile bottom:** Home · Explore · Blum Clips · Notifications · Messages
- **Mobile avatar:** Your profile
- **Mobile •••:** Bookmarks, Bloom Circles, Bloom Opportunities, Creator Studio, Polls, Live Sessions, Settings, Help, Theme
- **Floating +:** Create menu for Post, Photo, Clip, Poll, Story, Opportunity, Live and Schedule
- **Creator Studio:** saved drafts, analytics and links to Blum AI, Scheduled Posts and Creator Verification/Earnings
- **Profile:** Posts, Replies, Media, Likes, Edit/Share for owner and Follow/Message/More for other accounts

## Retained on purpose
Create menu actions and their browsing destinations are contextually different (e.g. “create a Poll” versus “browse Polls”). Other contextual controls such as comment, save, follow, and editing posts are not duplicates to be removed.

No Supabase data/tables were deleted. Old device-only lists remain in local storage, although their unfinished UI is no longer promoted in the drawer. Preview-only features remain subject to Phase 5/6 activation.

## Important next steps
- Integrate Supabase and validate real multi-account persistence, RLS and notifications.
- Mobile manual UI testing and accessibility: low bandwidth, text zoom, screen readers, contrast and keyboard.
- Full video service/moderation/abuse protection before public launch.
- Human verification review, legally compliant monetization and financial reporting before implementing payments.
