import assert from "node:assert/strict";
import fs from "node:fs";
const app=fs.readFileSync(new URL("../components/BlumbookApp.tsx",import.meta.url),"utf8");
const studio=fs.readFileSync(new URL("../components/CreatorStudioPlus.tsx",import.meta.url),"utf8");
const viewer=fs.readFileSync(new URL("../components/ImmersiveVideoViewer.tsx",import.meta.url),"utf8");
const clips=fs.readFileSync(new URL("../components/BlumClips.tsx",import.meta.url),"utf8");
const showcase=fs.readFileSync(new URL("../lib/demo-showcase.ts",import.meta.url),"utf8");
const stories=fs.readFileSync(new URL("../components/StoriesRail.tsx",import.meta.url),"utf8");
const styles=fs.readFileSync(new URL("../app/globals.css",import.meta.url),"utf8");
const demoRoute=fs.readFileSync(new URL("../app/demo/page.tsx",import.meta.url),"utf8");
const commentCard=fs.readFileSync(new URL("../components/CommentCard.tsx",import.meta.url),"utf8");
const count=(text,regex)=>Array.from(text.matchAll(regex)).length;
const tests={
 "Status circles sized for the mobile reference":styles.includes('width:84px;height:84px')&&styles.includes('story-tile{flex:0 0 91px'),
 "Unviewed statuses have colorful gradient and viewed statuses soften":styles.includes('.story-gradient-ring{background:conic-gradient')&&styles.includes('story-ring-seen'),
 "Your Story has profile photo and independent add button":stories.includes('className="story-own-avatar"')&&stories.includes('className="story-plus-badge"')&&stories.includes('displayAvatar(mine'),
 "Status shows one circle per author and readable usernames":stories.includes('firstStoryIndexes.map')&&stories.includes('seenAuthors.has(story.author_id)')&&stories.includes('person?.username'),
 "Stories keep a scrollable carousel above the clean Home feed":styles.includes('scroll-snap-type:x proximity')&&app.includes('home-status-strip')&&app.indexOf('home-status-strip')<app.indexOf('clean-home-tabs'),

 "Cinematic player has black screen, floating back and More controls":viewer.includes('className="immersive-video cinematic-video"')&&viewer.includes('className="cinematic-video-header"')&&viewer.includes('aria-label="More video options"'),
 "Cinematic video has author identity and connected Follow":viewer.includes('className="cinematic-video-author"')&&viewer.includes('isFollowing')&&viewer.includes('onFollow')&&app.includes('onFollow={()=>void toggleFollow(mediaViewer.author_id)}'),
 "Video interactions display real post counters and repost":viewer.includes('className="cinematic-video-reactions"')&&viewer.includes('shortCount(post.reposts)')&&viewer.includes('onRepost')&&app.includes('onRepost={()=>void toggleRepost('),
 "Video keeps functioning media controls":viewer.includes('aria-label="Seek video"')&&viewer.includes('className="cinematic-video-remaining"')&&viewer.includes('aria-label="Change playback speed"')&&viewer.includes('Mute video')&&viewer.includes('Fill screen'),
 "Video retains swipe navigation and posts only":viewer.includes('onTouchStart')&&viewer.includes('onTouchEnd')&&app.includes('const nextVideo=')&&app.includes('mediaViewer?.video_url&&<ImmersiveVideoViewer'),

 "Feed photos open post detail directly":app.includes('className="post-image-wrap" aria-label="Open post details" onClick={()=>onOpen(post)}'),
 "Post detail displays photos inline without another modal":app.includes('<div className="thread-main-image"><img')&&!app.includes('onClick={()=>openMedia(selectedPost)}'),
 "Profile photo grid opens post conversations":app.includes('p.image_url?void openThread(p):openVideo(p)'),
 "Old photo gallery and previous/next controls are removed":!["media-dialog","nextMedia(","mediaPosts","Open image viewer"].some(x=>app.includes(x)),
 "Immersive viewer remains video-only":app.includes('const openVideo=(post:Post)=>{if(post.video_url)setMediaViewer(post);}')&&app.includes('mediaViewer?.video_url&&<ImmersiveVideoViewer')&&app.includes('className="thread-main-video" onClick={()=>openVideo(selectedPost)}'),

 "Comment actions are present per reply":commentCard.includes('className="comment-card-actions"')&&["onReply(comment)","onLike(comment)","onRepost(comment)","onBookmark(comment)","onShare(comment)"].every(x=>commentCard.includes(x)),
 "Comment likes and repost counts never pretend to be live views":commentCard.includes('viewCount!==undefined')&&commentCard.includes('Fictional demo views')&&app.includes('const sampleViews=!isCloudEnabled'),
 "Threaded responses have real parent IDs":app.includes('parent_comment_id:parent')&&app.includes('replyingTo.parent_comment_id||replyingTo.id'),
 "Nested reply controls are expanded and collapsed":app.includes('comment-nested-list')&&app.includes('comment-show-replies')&&app.includes('expandedCommentThreads'),
 "Reactions and bookmarks use real tables if provisioned":app.includes('"comment_likes"')&&app.includes('"comment_reposts"')&&app.includes('"comment_bookmarks"')&&app.includes('commentFeaturesReady'),
 "Demo replies have sample interaction metrics":showcase.includes('SHOWCASE_COMMENT_METRICS')&&showcase.includes('parent_comment_id:'),
 "Sharing comments creates a link to the matching post":app.includes('const shareComment=async(comment:Comment)=>')&&app.includes('encodeURIComponent(comment.id)'),

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
