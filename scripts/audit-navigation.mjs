import assert from "node:assert/strict";
import fs from "node:fs";
const app=fs.readFileSync(new URL("../components/BlumbookApp.tsx",import.meta.url),"utf8");
const studio=fs.readFileSync(new URL("../components/CreatorStudioPlus.tsx",import.meta.url),"utf8");
const viewer=fs.readFileSync(new URL("../components/ImmersiveVideoViewer.tsx",import.meta.url),"utf8");
const clips=fs.readFileSync(new URL("../components/BlumClips.tsx",import.meta.url),"utf8");
const showcase=fs.readFileSync(new URL("../lib/demo-showcase.ts",import.meta.url),"utf8");
const stories=fs.readFileSync(new URL("../components/StoriesRail.tsx",import.meta.url),"utf8");
const demoRoute=fs.readFileSync(new URL("../app/demo/page.tsx",import.meta.url),"utf8");
const count=(text,regex)=>Array.from(text.matchAll(regex)).length;
const tests={
 "Showroom has at least 30 fictional posts":count(showcase,/\{id:"showcase-[0-9]+",author_id:/g)>=30,
 "Showroom has at least 120 seeded comments":count(showcase,/id:"showcase-[0-9]+-reply-[0-9]+"/g)>=120,
 "Showroom has 8 sample 24h stories":count(showcase,/id:"demo-story-[0-9]+"/g)===8,
 "Showroom has playable video and photo content":showcase.split('video_url:"https://').length-1>=3&&showcase.split('image_url:"https://images.unsplash.com').length-1>=12,
 "Showroom route is noindex and replaces live backend":demoRoute.includes('robots:{index:false,follow:false}')&&demoRoute.includes('<BlumbookApp forceDemo/>')&&app.includes('const supabase=forceDemo?null:configuredSupabase')&&stories.includes('if(!supabase||forceDemo)return'),
 "Showroom initializes posts, profiles and comments together":app.includes('useState<Post[]>(SHOWCASE_POSTS)')&&app.includes('useState<Profile[]>(SHOWCASE_PEOPLE)')&&app.includes('useState<Record<string, Comment[]>>(SHOWCASE_COMMENTS_BY_POST)'),

 "Scroll-aware nav hides on down-scroll and returns on idle":app.includes('setNavHidden(true)')&&app.includes('setNavHidden(false),1100')&&app.includes('auto-hide-nav')&&app.includes('auto-hide-compose'),
 "Video viewer uses dedicated full-screen player":count(app,/<ImmersiveVideoViewer\b/g)===1&&viewer.includes('className="immersive-video"')&&viewer.includes('object-fit')===false,
 "Player supports seek and sound with media action buttons":viewer.includes('aria-label="Seek video"')&&viewer.includes('Mute video')&&viewer.includes('onReply')&&viewer.includes('onBookmark'),
 "Video player supports swipe navigation":viewer.includes('onTouchStart')&&viewer.includes('onTouchEnd')&&app.includes('const nextVideo='),
 "Clips provides a minimal exit and audio toggle":clips.includes('className="clips-back"')&&clips.includes('className="clip-audio"')&&app.includes('mobile-bottom-hidden'),
 "Post opens its own clean conversation page":app.includes('className="thread-detail"')&&app.includes('className="thread-detail-header"')&&app.includes('className="thread-original"')&&!app.includes('<PanelTitle onBack={()=>navigate("home")}>Post</PanelTitle>'),
 "Tapping post text opens conversation without hijacking action controls":app.includes('className="post-body post-body-open"')&&app.includes('onOpen:openThread')&&app.includes('el.closest("button,a,input,textarea,select")'),
 "Conversation returns to its source view":app.includes('setThreadReturnView(view)')&&app.includes('navigate(threadReturnView)'),
 "Post screen keeps native actions":app.includes('className="thread-actions"')&&app.includes('void toggleRepost(selectedPost)')&&app.includes('void toggleLike(selectedPost)')&&app.includes('void toggleBookmark(selectedPost)'),
 "Replies sort and submit through existing backend":app.includes('className="thread-discussion-bar"')&&app.includes('replyOrder==="recent"')&&app.includes('className="thread-composer" onSubmit={sendReply}'),
 "Thread hides duplicated mobile top and bottom navigation":app.includes('mobile-topbar-thread')&&app.includes('(view==="settings"||view==="clips"||view==="thread")?"mobile-bottom-hidden"'),
 "Blum Clips has one canonical destination":count(app,/<BlumClips\b/g)===1&&!app.includes('navigate("videos")'),
 "Live Sessions has one canonical destination":count(app,/<LiveSessions\b/g)===1&&!app.includes('navigate("spaces")'),
 "Bloom Circles mounted once":count(app,/<BloomCircles\b/g)===1,
 "Home has no decorative banners or duplicated composer":!["premium-home-intro","premium-publisher","premium-feed-heading","premium-home-onboarding"].some(x=>app.includes(x)),
 "Home contains only feed tabs, demo disclosure and posts":app.includes('className="clean-home"')&&app.includes('className="feed-tabs clean-home-tabs"')&&!app.includes('YOUR TIMELINE'),
 "Stories has dedicated destination":app.includes('view === "stories"')&&app.includes('navigate("stories");setStoryLaunch')&&app.includes('onClick={()=>navigate("stories")}'),
 "Home status rail appears before the feed tabs":app.includes('view === "home" ? "home-status-strip" : "stories-destination"')&&app.indexOf('className={view === "home" ? "home-status-strip"')<app.indexOf('className="feed-tabs clean-home-tabs"'),
 "Home status rail uses compact mode":app.includes('<StoriesRail compact={view === "home"}'),
 "Stories rail mounted once":count(app,/<StoriesRail\b/g)===1,
 "Create menu mounted once":count(app,/<CreateMenu\b/g)===1,
 "Bottom navigation mounted once":count(app,/<nav className=\{"mobile-bottom/g)===1,
 "Avatar opens own profile rather than duplicated menu":app.includes('aria-label="Your profile"'),
 "Feed has no duplicated Community tab":!app.includes('tab === "communities"'),
 "Home has one primary Create flow":!app.includes('className="compose-inline"'),
 "No repeated Home or Explore shortcut rows":!/(className="home-mini-links"|className="home-opportunity-link"|className="explore-mini-tools"|className="explore-feature-links")/.test(app),
 "Mobile drawer keeps four named groups":count(app,/className="simple-drawer-section"/g)===4&&["YOUR SPACE","COMMUNITY & DISCOVERY","CREATOR TOOLS","ACCOUNT & SUPPORT"].every(x=>app.includes(x)),
 "Planner and earnings have their own views":app.includes('view==="planner"')&&app.includes('view==="earnings"'),
 "Privacy opens its real settings panel":app.includes('navigate("settings");setSettingsPanel("privacy");'),
 "Invite friends opens native sharing or copies a URL":app.includes('const inviteFriends=async()=>')&&app.includes('navigator.share')&&app.includes('navigator.clipboard.writeText(url)'),
 "Language chooser is accessible from the drawer":app.includes('className="simple-drawer-language"')&&app.includes('aria-label="Language"'),
 "Creator Studio drafts do not falsely schedule posts":!studio.includes('<input type="date"'),
 "Own profile Edit and Share are not repeated in More":!app.includes('Share profile</button>\n                  {activeProfile.id===me.id'),
};
let failures=0;
for(const [name,ok] of Object.entries(tests)){console.log((ok?"PASS":"FAIL")+" "+name);if(!ok)failures++;}
assert.equal(failures,0,failures+" navigation regression checks failed");
console.log("Navigation regression audit passed ("+Object.keys(tests).length+" checks).");
