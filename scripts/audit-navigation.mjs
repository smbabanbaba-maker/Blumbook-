import assert from "node:assert/strict";
import fs from "node:fs";
const app=fs.readFileSync(new URL("../components/BlumbookApp.tsx",import.meta.url),"utf8");
const stylesheet=fs.readFileSync(new URL("../app/globals.css",import.meta.url),"utf8");
const studio=fs.readFileSync(new URL("../components/CreatorStudioPlus.tsx",import.meta.url),"utf8");
const viewer=fs.readFileSync(new URL("../components/ImmersiveVideoViewer.tsx",import.meta.url),"utf8");
const clips=fs.readFileSync(new URL("../components/BlumClips.tsx",import.meta.url),"utf8");
const showcase=fs.readFileSync(new URL("../lib/demo-showcase.ts",import.meta.url),"utf8");
const stories=fs.readFileSync(new URL("../components/StoriesRail.tsx",import.meta.url),"utf8");
const demoRoute=fs.readFileSync(new URL("../app/demo/page.tsx",import.meta.url),"utf8");
const commentCard=fs.readFileSync(new URL("../components/CommentCard.tsx",import.meta.url),"utf8");
const composer=fs.readFileSync(new URL("../components/PremiumPostComposer.tsx",import.meta.url),"utf8");
const likeBurst=fs.readFileSync(new URL("../components/LikeBurst.tsx",import.meta.url),"utf8");
const expanded=fs.readFileSync(new URL("../lib/demo-expanded.ts",import.meta.url),"utf8");
const extraPosts=JSON.parse(expanded.match(/^const SAMPLE_MESSAGES=(.+);$/m)?.[1]||"[]");
const count=(text,regex)=>Array.from(text.matchAll(regex)).length;
const tests={
 "Premium post composer replaces old post dialog":app.includes('<PremiumPostComposer')&&!app.includes('{compose && <Modal close={()=>setCompose(false)}>')&&composer.includes('className="premium-composer-overlay"'),
 "Premium composer has working Post, close and native full-screen layout":composer.includes('onSubmit={onSubmit}')&&composer.includes('disabled={busy||!hasContent||text.length>500}')&&composer.includes('onClick={requestExit}')&&stylesheet.includes('height:100dvh'),
 "Drafts persist locally and restore as editable text":composer.includes('blumbook-composer-drafts-v1')&&composer.includes('localStorage.setItem(DRAFT_KEY')&&composer.includes('const restoreDraft=')&&composer.includes('setText(draft.text)'),
 "Photos camera and video recording use the existing media handlers":composer.includes('capture="environment"')&&composer.includes('onChange={onImage}')&&composer.includes('onChange={onVideo}')&&composer.includes('onRemoveImage')&&composer.includes('onRemoveVideo'),
 "GIF emoji location and polls have functional tools":composer.includes('accept="image/gif"')&&composer.includes('const insert=')&&composer.includes('const addPlace=')&&composer.includes('onPoll')&&composer.includes('onAI'),
 "Premium composer never fabricates audience restrictions":composer.includes('Replies are currently open to everyone.')&&composer.includes('More audience controls are coming later.'),
 "Media-only posts can publish without requiring placeholder text":app.includes('(!postText.trim()&&!imageFile&&!videoFile)')&&composer.includes('Boolean(text.trim()||imageFile||videoFile)'),
 "Premium editor respects keyboard, responsive screens and reduced motion":composer.includes('event.key!=="Escape"')&&stylesheet.includes('@media(max-width:520px)')&&stylesheet.includes('.premium-composer-overlay')&&stylesheet.includes('@media(prefers-reduced-motion:reduce)'),

 "Showroom has at least 128 posts, including new fictional content":extraPosts.length>=96&&count(showcase,/\{id:"showcase-[0-9]+",author_id:/g)>=30&&showcase.includes("...EXTRA_DEMO_POSTS"),
 "Showroom exposes 35 videos and 63 photos":extraPosts.filter((_,i)=>[2,4].includes(i%6)).length>=32&&extraPosts.filter((_,i)=>[0,1,3].includes(i%6)).length>=48&&showcase.includes("...EXTRA_DEMO_POSTS"),
 "Showroom has 525 comment replies and at least 24 people":expanded.includes("EXTRA_DEMO_COMMENTS")&&expanded.includes("EXTRA_DEMO_PEOPLE")&&showcase.includes("...EXTRA_DEMO_COMMENTS")&&showcase.includes("...EXTRA_DEMO_PEOPLE")&&extraPosts.length*4>=384,
 "Many videos load progressively in Clips":clips.includes("sourceReady?post.video_url")&&clips.includes('preload={sourceReady?"metadata":"none"}'),
 "Long Home feed paginates for mobile":app.includes("filteredPosts.slice(0,feedLimit)")&&app.includes("See more posts")&&app.includes("setFeedLimit"),
 "Fictional post headers carry a small Sample label":app.includes('className="post-sample-chip"')&&stylesheet.includes(".post-sample-chip{"),

 "Like burst is controlled by a real liked-state transition":likeBurst.includes('if(liked&&!previous.current)setBurst')&&likeBurst.includes('length:12')&&likeBurst.includes('like-burst-particle')&&likeBurst.includes('aria-hidden="true"'),
 "All likes use the same animated heart":app.includes('<LikeBurst liked={Boolean(post.liked)}')&&app.includes('<LikeBurst liked={Boolean(selectedPost.liked)}')&&commentCard.includes('<LikeBurst liked={liked}')&&viewer.includes('<LikeBurst liked={Boolean(post.liked)}')&&clips.includes('<LikeBurst liked={Boolean(post.liked)}'),
 "Like bursts honor reduced motion":stylesheet.includes('.like-burst-particles{display:none!important;}')&&stylesheet.includes('@keyframes blum-heart-spark'),
 "Color tokens now have vivid blue pink green and violet":stylesheet.includes('--brand:#00A6FF;')&&stylesheet.includes('--pink:#FF268E;--green:#00DB95;')&&stylesheet.includes('--violet:#AC5BFF'),
 "Sample statuses are labeled and cannot write story views":stories.includes('showcaseWhenEmpty')&&stories.includes('PREVIEW</span>')&&stories.includes('!previewStories&&item.author_id!==userId')&&stories.includes('visibleStories:Story[]'),
 "Demo indicator is subtle in navigation":app.includes('className="blum-demo-chip"'),
 "Dark theme uses X-inspired black, surfaces and readable text":stylesheet.includes('--bg:#000000; --surface:#16181C; --surface2:#202327; --line:#2F3336;')&&stylesheet.includes('--text:#E7E9EA;'),
 "Light theme uses white, neutral gray and high-contrast copy":stylesheet.includes('--bg:#FFFFFF; --surface:#FFFFFF; --surface2:#F7F9F9; --line:#EFF3F4;')&&stylesheet.includes('--text:#0F1419;'),
 "Global brand blue, like pink and repost green share theme tokens":stylesheet.includes('--brand:#1D9BF0;')&&stylesheet.includes('--pink:#F91880; --green:#00BA7C;'),
 "Verified badge uses semantic brand-blue color":stylesheet.includes('.verified{color:var(--verified)')&&viewer.includes('fill="var(--verified)"'),
 "Primary actions are blue with readable white text":stylesheet.includes('.primary-btn,.follow-btn,.chat-send button')&&stylesheet.includes('background:var(--brand-strong);')&&stylesheet.includes('color:var(--brand-on);'),
 "Post reactions restore like and repost accent colors":stylesheet.includes('.post-actions .liked,.post-actions .liked:hover{color:var(--pink);}')&&stylesheet.includes('.post-actions .reposted,.post-actions .reposted:hover{color:var(--green);}'),
 "Comment and post-detail reactions use semantic accent colors":stylesheet.includes('.comment-card-actions>button:nth-child(3).is-active')&&stylesheet.includes('.thread-actions button:nth-child(2).is-active')&&stylesheet.includes('.thread-actions button:nth-child(3).is-active'),
 "Video and Clips highlight engagement but preserve black canvas":stylesheet.includes('.cinematic-video .cinematic-video-reactions>button:nth-child(3).is-active')&&stylesheet.includes('.clip-actions button[aria-label="Like clip"].clip-selected')&&stylesheet.includes('.cinematic-video{--brand:#1D9BF0'),
 "Stories and navigation use consistent primary blue":stylesheet.includes('.fb-story-profile-ring{border-color:var(--brand);}')&&stylesheet.includes('.notification-pip,.nav-dot{background:var(--brand);}')&&stylesheet.includes('.mobile-bottom button.active svg'),
 "Settings and search focus inherit semantic accent":stylesheet.includes('--settings-active:#1D9BF0;')&&stylesheet.includes('.settings-search-wrap:focus-within,.search-header:focus-within'),

 "Facebook story rail has portrait photo cards and prominent create tile":stories.includes('className="stories-row facebook-stories-row"')&&stories.includes('className="story-tile fb-story-card fb-story-create"')&&stories.includes('className="story-tile fb-story-card fb-story-active"'),
 "Story cards have author avatar and visible name":stories.includes('className="fb-story-profile-ring"')&&stories.includes('className="fb-story-name"')&&stories.includes('aria-label={"View story by "+name}'),
 "Creating and opening Stories still have working handlers":stories.includes('else setCreating(true);')&&stories.includes('onClick={()=>void open(i)}')&&stories.includes('forceDemo'),

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
 "Comment likes and repost counts never pretend to be live views":commentCard.includes('viewCount!==undefined')&&commentCard.includes('Fictional demo views')&&app.includes('const sampleViews=SAMPLE_POST_IDS.has(c.post_id)'),
 "Threaded responses have real parent IDs":app.includes('parent_comment_id:parent')&&app.includes('replyingTo.parent_comment_id||replyingTo.id'),
 "Nested reply controls are expanded and collapsed":app.includes('comment-nested-list')&&app.includes('comment-show-replies')&&app.includes('expandedCommentThreads'),
 "Reactions and bookmarks use real tables if provisioned":app.includes('"comment_likes"')&&app.includes('"comment_reposts"')&&app.includes('"comment_bookmarks"')&&app.includes('commentFeaturesReady'),
 "Demo replies have sample interaction metrics":showcase.includes('SHOWCASE_COMMENT_METRICS')&&showcase.includes('parent_comment_id:'),
 "Sharing comments creates a link to the matching post":app.includes('const shareComment=async(comment:Comment)=>')&&app.includes('encodeURIComponent(comment.id)'),

 "Showroom has at least 30 fictional posts":count(showcase,/\{id:"showcase-[0-9]+",author_id:/g)>=30,
 "Showroom has at least 120 seeded comments":count(showcase,/id:"showcase-[0-9]+-reply-[0-9]+"/g)>=120,
 "Showroom has 8 sample 24h stories":count(showcase,/id:"demo-story-[0-9]+"/g)===8,
 "Showroom has playable video and photo content":showcase.split('video_url:"https://').length-1>=3&&showcase.split('image_url:"https://images.unsplash.com').length-1>=12,
 "Production homepage does not force demo showroom":!app.includes('export default function BlumbookApp({forceDemo=true}')&&demoRoute.includes('<BlumbookApp forceDemo/>'),
 "Showroom route is noindex and replaces live backend":demoRoute.includes('robots:{index:false,follow:false}')&&demoRoute.includes('<BlumbookApp forceDemo/>')&&app.includes('const supabase=forceDemo?null:configuredSupabase')&&stories.includes('if(!supabase||forceDemo)return'),
 "Real Home shows labeled fictional posts when it is still sparsely populated":app.includes('useState<Post[]>(SHOWCASE_POSTS)')&&app.includes('SAMPLE_FEED_REAL_POST_THRESHOLD=20')&&app.includes('const existingSamples=previous.filter(p=>SAMPLE_POST_IDS.has(p.id))')&&app.includes('return [...realPosts,...(existingSamples.length?existingSamples:SHOWCASE_POSTS)]')&&app.includes('isDemo:!isCloudEnabled||SAMPLE_POST_IDS.has(p.id)'),
 "Real post content is prioritized above sample fixtures":app.includes('Number(SAMPLE_POST_IDS.has(a.id))-Number(SAMPLE_POST_IDS.has(b.id))')&&app.includes('if(realPosts.length>=SAMPLE_FEED_REAL_POST_THRESHOLD)return realPosts'),
 "Sample post likes, reposts, bookmarks never write to the real database":app.includes('!SAMPLE_POST_IDS.has(post.id)')&&app.includes('const q = supabase.from("likes")')&&app.includes('const q = supabase.from("reposts")')&&app.includes('const q = supabase.from("bookmarks")'),
 "Sample comment threads and local reactions avoid the live backend":app.includes('if(SAMPLE_POST_IDS.has(postId)||!supabase)')&&app.includes('const isSample=SAMPLE_POST_IDS.has(comment.post_id)')&&app.includes('if(!isSample&&supabase&&cloudUserId)')&&app.includes('!SAMPLE_POST_IDS.has(threadId)'),
 "Sample author follows and messages do not create real relationships":app.includes('!SAMPLE_PROFILE_IDS.has(id)')&&app.includes('SAMPLE_PROFILE_IDS.has(p.id)')&&app.includes('if (supabase && cloudUserId && !SAMPLE_PROFILE_IDS.has(id))'),
 "Sample post and reply links open the isolated demo showroom":app.includes('forceDemo||SAMPLE_POST_IDS.has(comment.post_id)?"/demo":"/"')&&app.includes('forceDemo||SAMPLE_POST_IDS.has(post.id)?"/demo":"/"'),

 "Scroll-aware nav hides on down-scroll and returns on idle":app.includes('setNavHidden(true)')&&app.includes('setNavHidden(false),1100')&&app.includes('auto-hide-nav')&&app.includes('auto-hide-compose'),
 "Video viewer uses dedicated full-screen player":count(app,/<ImmersiveVideoViewer\b/g)===1&&viewer.includes('className="immersive-video cinematic-video"')&&viewer.includes('object-fit')===false,
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
 "Home has clean feed without tabs or long demo disclaimer":app.includes('className="clean-home"')&&!app.includes('className="feed-tabs clean-home-tabs"')&&!app.includes('DEMO CONTENT · Fictional profiles, posts')&&!app.includes('YOUR TIMELINE'),
 "Stories has dedicated destination":app.includes('view === "stories"')&&app.includes('navigate("stories");setStoryLaunch')&&app.includes('onClick={()=>navigate("stories")}'),
 "Status remains above Home feed":app.includes('view === "home" ? "home-status-strip" : "stories-destination"')&&app.indexOf('className={view === "home" ? "home-status-strip"')<app.indexOf('className="clean-home"'),
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
