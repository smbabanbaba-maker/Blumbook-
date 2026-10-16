"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, Bell, Bookmark, Check, CheckCircle2, ChevronDown, Compass, Ellipsis,
  Feather, Heart, Home, ImagePlus, LogIn, LogOut, Mail, Menu, MessageCircle, MoreHorizontal,
  Plus, Repeat2, Search, Send, Settings, Share2, ShieldCheck, Smile, Sparkles, UserRound,
  UserRoundPlus, UsersRound, X, type LucideIcon
} from "lucide-react";
import { supabase, isCloudEnabled } from "@/lib/supabase";
import {
  COMMUNITIES, DEMO_ME, DEMO_NOTICES, DEMO_PEOPLE, DEMO_POSTS, TRENDS,
  shortCount, timeAgo, type Post, type Profile, type Notice,
} from "@/lib/demo";

type View = "home" | "explore" | "notifications" | "messages" | "profile" | "communities" | "bookmarks" | "settings" | "thread";
type Tab = "for-you" | "following" | "communities";
type Comment = { id: string; post_id: string; author_id: string; body: string; created_at: string };
type ChatMessage = { id: string; sender: "me" | "them"; text: string; time: string };
const NAV: { id: View; label: string; Icon: LucideIcon }[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "explore", label: "Explore", Icon: Search },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "messages", label: "Messages", Icon: Mail },
  { id: "communities", label: "Communities", Icon: UsersRound },
  { id: "bookmarks", label: "Bookmarks", Icon: Bookmark },
  { id: "profile", label: "Profile", Icon: UserRound },
  { id: "settings", label: "Settings", Icon: Settings },
];
const demoThreads = [
  { id: "amina", name: "Amina Yusuf", handle: "aminacreates", last: "That sounds amazing! 💙", time: "2m" },
  { id: "ibrahim", name: "Ibrahim Musa", handle: "ibrahimmusa", last: "Let's work on it together.", time: "1h" },
  { id: "zara", name: "Zara Lawal", handle: "zaralawal", last: "See you soon!", time: "1d" },
];
const initialChats: Record<string, ChatMessage[]> = {
  amina: [
    { id:"cm1", sender:"them", text:"Hey! Welcome to Blumbook 👋", time:"10:23" },
    { id:"cm2", sender:"me", text:"Thank you! Excited to be here.", time:"10:24" },
    { id:"cm3", sender:"them", text:"That sounds amazing! 💙", time:"10:25" },
  ],
  ibrahim: [{ id:"cm4", sender:"them", text:"Let's work on it together.", time:"09:30" }],
  zara: [{ id:"cm5", sender:"them", text:"See you soon!", time:"Yesterday" }],
};
function Avatar({ profile, size = "normal" }: { profile: Profile; size?: "normal" | "small" | "large" }) {
  const initials = profile.display_name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  return (
    <div className={"avatar avatar-" + size + " tone-" + (profile.username.charCodeAt(0) % 6)} title={profile.display_name}>
      {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{initials}</span>}
    </div>
  );
}
function Name({ profile }: { profile: Profile }) {
  return <span className="author-name">{profile.display_name}{profile.verified && <CheckCircle2 aria-label="Verified" className="verified" size={15} fill="currentColor" />}</span>;
}
function Brand({ compact = false }: { compact?: boolean }) {
  return <span className={"brand " + (compact ? "brand-compact" : "")}><img src="/logo.svg" alt="" /><strong>Blumbook</strong></span>;
}
function PostCard({
  post, author, onLike, onRepost, onBookmark, onReply, onProfile, onShare,
}: {
  post: Post; author: Profile; onLike: (post: Post) => void; onRepost: (post: Post) => void;
  onBookmark: (post: Post) => void; onReply: (post: Post) => void;
  onProfile: (id: string) => void; onShare: (post: Post) => void;
}) {
  return <article className="post-card">
    <div className="post-avatar"><Avatar profile={author} /></div>
    <div className="post-main">
      <div className="post-top">
        <button className="post-user" onClick={() => onProfile(author.id)}>
          <Name profile={author} /><span className="post-handle">@{author.username}</span><span className="post-handle">· {timeAgo(post.created_at)}</span>
        </button>
        <button className="icon-button icon-muted" aria-label="More post options" onClick={() => onShare(post)}><MoreHorizontal size={20}/></button>
      </div>
      <div className="post-body">{post.body}</div>
      {post.image_url && <button className="post-image-wrap" aria-label="View post" onClick={() => onReply(post)}><img className="post-image" src={post.image_url} alt="Image shared in post" loading="lazy" /></button>}
      <div className="post-actions">
        <button aria-label="Reply" onClick={() => onReply(post)}><MessageCircle size={18}/><span>{shortCount(post.replies)}</span></button>
        <button className={post.reposted ? "reposted" : ""} aria-label="Repost" onClick={() => onRepost(post)}><Repeat2 size={18}/><span>{shortCount(post.reposts)}</span></button>
        <button className={post.liked ? "liked" : ""} aria-label="Like" onClick={() => onLike(post)}><Heart size={18} fill={post.liked ? "currentColor" : "none"}/><span>{shortCount(post.likes)}</span></button>
        <button aria-label="Views" onClick={() => onReply(post)}><span className="view-icon">▥</span><span>{shortCount(post.views)}</span></button>
        <div className="post-end-actions">
          <button className={post.bookmarked ? "bookmarked" : ""} aria-label="Bookmark" onClick={() => onBookmark(post)}><Bookmark size={18} fill={post.bookmarked ? "currentColor" : "none"}/></button>
          <button aria-label="Share" onClick={() => onShare(post)}><Share2 size={18}/></button>
        </div>
      </div>
    </div>
  </article>;
}
function PanelTitle({ children, onBack, extra }: { children: ReactNode; onBack?: () => void; extra?: ReactNode }) {
  return <div className="panel-title">{onBack && <button className="icon-button" onClick={onBack} aria-label="Go back"><ArrowLeft size={21}/></button>}<h2>{children}</h2>{extra && <div className="panel-extra">{extra}</div>}</div>;
}
function Modal({ children, close }: { children: ReactNode; close: () => void }) {
  useEffect(() => { const f = (e: KeyboardEvent) => { if (e.key === "Escape") close(); }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [close]);
  return <div className="modal-shade" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}><div className="dialog" role="dialog" aria-modal="true">{children}</div></div>;
}

export default function BlumbookApp() {
  const [view, setView] = useState<View>("home");
  const [tab, setTab] = useState<Tab>("for-you");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>(DEMO_POSTS);
  const [people, setPeople] = useState<Profile[]>(DEMO_PEOPLE);
  const [member, setMember] = useState<Profile | null>(null);
  const [cloudUserId, setCloudUserId] = useState<string | null>(null);
  const [demoSignedIn, setDemoSignedIn] = useState(false);
  const [followed, setFollowed] = useState<string[]>([]);
  const [compose, setCompose] = useState(false);
  const [postText, setPostText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [signUp, setSignUp] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("demo-me");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [replyText, setReplyText] = useState("");
  const [chatWith, setChatWith] = useState<string | null>(null);
  const [chatText, setChatText] = useState("");
  const [chats, setChats] = useState(initialChats);
  const [joined, setJoined] = useState<string[]>([]);
  const [editProfile, setEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [noticeFilter, setNoticeFilter] = useState("All");
  const [loadingCloud, setLoadingCloud] = useState(isCloudEnabled);
  const me = member || DEMO_ME;
  const allPeople = useMemo(() => [me, ...people.filter((p) => p.id !== me.id)], [me, people]);
  const lookup = useCallback((id: string) => allPeople.find((p) => p.id === id) || { id, display_name:"Blumbook member", username:"member", bio:"" }, [allPeople]);
  const isMember = !isCloudEnabled || Boolean(cloudUserId);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3400); };
  const navigate = (target: View) => { setView(target); setMenuOpen(false); setChatWith(null); window.scrollTo({ top: 0, behavior:"smooth" }); };
  const requireAccount = () => {
    if (!isMember) { setAuthOpen(true); notify("Sign in to interact with the community."); return false; }
    return true;
  };

  const loadCloud = useCallback(async () => {
    if (!supabase) return;
    const client = supabase;
    setLoadingCloud(true);
    try {
      const [{ data: { user } }, { data: profilesData }, { data: postsData }, { data: likesData }, { data: bookmarksData }, { data: followsData }, { data: repostsData }, { data: commentsData }] = await Promise.all([
        client.auth.getUser(),
        client.from("profiles").select("id, username, display_name, bio, avatar_url, verified, location").limit(100),
        client.from("posts").select("id, author_id, body, image_url, created_at").order("created_at", { ascending:false }).limit(60),
        client.from("likes").select("post_id, user_id").limit(1000),
        client.from("bookmarks").select("post_id, user_id").limit(1000),
        client.from("follows").select("follower_id, following_id").limit(1000),
        client.from("reposts").select("post_id, user_id").limit(1000),
        client.from("comments").select("post_id").limit(2000),
      ]);
      setCloudUserId(user?.id || null);
      const cleanProfiles: Profile[] = (profilesData || []).map((p) => ({ id:p.id, username:p.username, display_name:p.display_name, bio:p.bio || "", avatar_url:p.avatar_url, verified:p.verified, location:p.location }));
      setPeople(cleanProfiles);
      const mine = cleanProfiles.find((p) => p.id === user?.id);
      setMember(user ? (mine || { id:user.id, username:(user.email || "member").split("@")[0], display_name:user.user_metadata?.full_name || "Blumbook member", bio:"" }) : null);
      setFollowed((followsData || []).filter((f) => f.follower_id === user?.id).map((f) => f.following_id));
      const counts = (rows: { post_id: string }[] | null) => {
        const out: Record<string, number> = {};
        (rows || []).forEach((r) => { out[r.post_id] = (out[r.post_id] || 0) + 1; }); return out;
      };
      const likesCount = counts(likesData), repostsCount = counts(repostsData), repliesCount = counts(commentsData);
      setPosts((postsData || []).map((p) => ({
        ...p, likes:likesCount[p.id] || 0, reposts:repostsCount[p.id] || 0, replies:repliesCount[p.id] || 0, views:0,
        liked:(likesData || []).some((l) => l.post_id === p.id && l.user_id === user?.id),
        bookmarked:(bookmarksData || []).some((b) => b.post_id === p.id && b.user_id === user?.id),
        reposted:(repostsData || []).some((r) => r.post_id === p.id && r.user_id === user?.id),
      })));
    } catch { notify("Could not load the feed. Check your Supabase setup."); }
    finally { setLoadingCloud(false); }
  }, []);
  useEffect(() => {
    const linkedId = new URLSearchParams(window.location.search).get("post");
    if (linkedId && posts.some((post) => post.id === linkedId)) {
      setThreadId(linkedId);
      setView("thread");
    }
  }, [posts]);
  useEffect(() => {
    if (!supabase) return;
    void loadCloud();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { window.setTimeout(() => void loadCloud(), 0); });
    return () => subscription.unsubscribe();
  }, [loadCloud]);

  const toggleLike = async (post: Post) => {
    if (!requireAccount()) return;
    setPosts((old) => old.map((p) => p.id === post.id ? { ...p, liked:!p.liked, likes:p.likes + (p.liked ? -1 : 1) } : p));
    if (supabase && cloudUserId) {
      const q = supabase.from("likes");
      const { error } = post.liked
        ? await q.delete().eq("post_id", post.id).eq("user_id", cloudUserId)
        : await q.insert({ post_id:post.id, user_id:cloudUserId });
      if (error) { notify(error.message); void loadCloud(); }
    }
  };
  const toggleRepost = async (post: Post) => {
    if (!requireAccount()) return;
    setPosts((old) => old.map((p) => p.id === post.id ? { ...p, reposted:!p.reposted, reposts:p.reposts + (p.reposted ? -1 : 1) } : p));
    if (supabase && cloudUserId) {
      const q = supabase.from("reposts");
      const { error } = post.reposted
        ? await q.delete().eq("post_id", post.id).eq("user_id", cloudUserId)
        : await q.insert({ post_id:post.id, user_id:cloudUserId });
      if (error) { notify(error.message); void loadCloud(); }
    }
  };
  const toggleBookmark = async (post: Post) => {
    if (!requireAccount()) return;
    setPosts((old) => old.map((p) => p.id === post.id ? { ...p, bookmarked:!p.bookmarked } : p));
    if (supabase && cloudUserId) {
      const q = supabase.from("bookmarks");
      const { error } = post.bookmarked
        ? await q.delete().eq("post_id", post.id).eq("user_id", cloudUserId)
        : await q.insert({ post_id:post.id, user_id:cloudUserId });
      if (error) { notify(error.message); void loadCloud(); }
    }
    notify(post.bookmarked ? "Removed from bookmarks" : "Saved to bookmarks");
  };
  const toggleFollow = async (id: string) => {
    if (!requireAccount() || id === me.id) return;
    const exists = followed.includes(id);
    setFollowed((old) => exists ? old.filter((i) => i !== id) : [...old, id]);
    if (supabase && cloudUserId) {
      const q = supabase.from("follows");
      const { error } = exists
        ? await q.delete().eq("follower_id", cloudUserId).eq("following_id", id)
        : await q.insert({ follower_id:cloudUserId, following_id:id });
      if (error) { notify(error.message); void loadCloud(); }
    }
  };
  const openThread = async (post: Post) => {
    setThreadId(post.id); navigate("thread");
    if (supabase) {
      const { data } = await supabase.from("comments").select("id, post_id, author_id, body, created_at").eq("post_id", post.id).order("created_at");
      if (data) setComments((old) => ({ ...old, [post.id]:data }));
    }
  };
  const sendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!threadId || !replyText.trim() || !requireAccount()) return;
    const body = replyText.trim();
    setBusy(true);
    if (supabase && cloudUserId) {
      const { error } = await supabase.from("comments").insert({ post_id:threadId, author_id:cloudUserId, body });
      if (error) notify(error.message);
      else {
        const { data } = await supabase.from("comments").select("id, post_id, author_id, body, created_at").eq("post_id", threadId).order("created_at");
        setComments((prev) => ({...prev, [threadId]:data || []}));
        setPosts((prev) => prev.map((p) => p.id === threadId ? {...p, replies:p.replies + 1} : p));
        setReplyText("");
      }
    } else {
      const item: Comment = { id:"demo-reply-" + Date.now(), post_id:threadId, author_id:me.id, body, created_at:new Date().toISOString() };
      setComments((prev) => ({ ...prev, [threadId]:[...(prev[threadId] || []), item] }));
      setPosts((prev) => prev.map((p) => p.id === threadId ? {...p, replies:p.replies + 1} : p));
      setReplyText("");
    }
    setBusy(false);
  };
  const submitPost = async (e: FormEvent) => {
    e.preventDefault();
    if (!postText.trim() || postText.length > 500 || !requireAccount()) return;
    setBusy(true);
    let imageUrl: string | null = imagePreview || null;
    if (supabase && cloudUserId) {
      if (imageFile) {
        const ext = (imageFile.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = cloudUserId + "/" + crypto.randomUUID() + "." + ext;
        const { error: uploadError } = await supabase.storage.from("post-media").upload(path, imageFile, { upsert:false });
        if (uploadError) { notify("Media upload failed: " + uploadError.message); setBusy(false); return; }
        imageUrl = supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("posts").insert({ author_id:cloudUserId, body:postText.trim(), image_url:imageUrl });
      if (error) { notify(error.message); setBusy(false); return; }
      await loadCloud();
    } else {
      const fresh: Post = { id:"demo-" + Date.now(), author_id:me.id, body:postText.trim(), image_url:imageUrl, created_at:new Date().toISOString(), likes:0, reposts:0, replies:0, views:0 };
      setPosts((old) => [fresh, ...old]);
    }
    setPostText(""); setImageFile(null); setImagePreview(""); setCompose(false); setBusy(false); navigate("home");
    notify("Your post is live! ✨");
  };
  const authSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) { setDemoSignedIn(true); setAuthOpen(false); notify("You're exploring Blumbook demo mode."); return; }
    setBusy(true);
    const action = signUp
      ? await supabase.auth.signUp({ email:authEmail.trim(), password:authPassword, options:{ data:{ full_name:authName.trim() } } })
      : await supabase.auth.signInWithPassword({ email:authEmail.trim(), password:authPassword });
    setBusy(false);
    if (action.error) notify(action.error.message);
    else { setAuthOpen(false); notify(signUp ? "Account created. Check your email if confirmation is enabled." : "Welcome back!"); void loadCloud(); }
  };
  const openEdit = () => { setEditName(me.display_name); setEditBio(me.bio); setEditProfile(true); };
  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!requireAccount()) return;
    setBusy(true);
    if (supabase && cloudUserId) {
      const { error } = await supabase.from("profiles").update({ display_name:editName.trim(), bio:editBio.trim() }).eq("id", cloudUserId);
      if (error) { notify(error.message); setBusy(false); return; }
      await loadCloud();
    } else setMember({ ...me, display_name:editName.trim(), bio:editBio.trim() });
    setBusy(false); setEditProfile(false); notify("Profile updated");
  };
  const openProfile = (id: string) => { setSelectedProfile(id); navigate("profile"); };
  const share = async (post: Post) => {
    const url = window.location.origin + "/?post=" + encodeURIComponent(post.id);
    try { await navigator.clipboard.writeText(url); notify("Link copied to clipboard"); }
    catch { notify("Share this post: " + url); }
  };
  const activeProfile = lookup(selectedProfile === "demo-me" ? me.id : selectedProfile);
  const selectedPost = posts.find((p) => p.id === threadId);
  const filteredPosts = posts.filter((p) => tab !== "following" || p.author_id === me.id || followed.includes(p.author_id));
  const searchPosts = posts.filter((p) => p.body.toLowerCase().includes(query.toLowerCase()) || lookup(p.author_id).display_name.toLowerCase().includes(query.toLowerCase()));
  const searchProfiles = people.filter((p) => p.display_name.toLowerCase().includes(query.toLowerCase()) || p.username.toLowerCase().includes(query.toLowerCase()));
  const postProps = (p: Post) => ({ key:p.id, post:p, author:lookup(p.author_id), onLike:toggleLike, onRepost:toggleRepost, onBookmark:toggleBookmark, onReply:openThread, onProfile:openProfile, onShare:share });
  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/") || f.size > 5 * 1024 * 1024) { notify("Choose an image under 5 MB"); return; }
    setImageFile(f); setImagePreview(URL.createObjectURL(f));
  };
  const logOut = async () => {
    if (supabase) { await supabase.auth.signOut(); await loadCloud(); }
    else { setDemoSignedIn(false); setMember(null); }
    navigate("home"); notify("Signed out");
  };

  return <div className="app-shell">
    <aside className={"sidebar " + (menuOpen ? "sidebar-open" : "")}>
      <button className="brand-button" onClick={() => navigate("home")} aria-label="Blumbook home"><Brand /></button>
      <nav className="side-nav">{NAV.map(({ id, label, Icon }) => <button key={id} className={"side-link " + (view === id ? "active" : "")} onClick={() => navigate(id)}><Icon size={25} strokeWidth={view === id ? 2.6 : 1.9}/><span>{label}</span>{id === "notifications" && <i className="notification-pip"/>}</button>)}</nav>
      <button className="primary-btn side-post" onClick={() => { if (requireAccount()) setCompose(true); }}><Feather size={19}/><span>Post</span></button>
      <button className="side-account" onClick={() => isCloudEnabled && !cloudUserId ? setAuthOpen(true) : openProfile(me.id)}>
        <Avatar profile={me}/><span><strong>{me.display_name}</strong><small>@{me.username}</small></span><Ellipsis size={20}/>
      </button>
    </aside>

    <main className="main-column">
      <div className="mobile-topbar">
        <button className="avatar-action" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu"><Avatar profile={me} size="small"/></button>
        <button onClick={() => navigate("home")} className="mobile-brand"><img src="/logo.svg" alt="Blumbook"/><strong>Blumbook</strong></button>
        <button aria-label="New post" className="icon-button" onClick={() => { if (requireAccount()) setCompose(true); }}><Plus size={25}/></button>
      </div>

      {view === "home" && <>
        <div className="feed-tabs">
          {([["for-you","For you"],["following","Following"],["communities","Communities"]] as const).map(([id,label])=><button key={id} className={tab === id ? "selected" : ""} onClick={()=>setTab(id)}>{label}</button>)}
        </div>
        {tab === "communities" ? <section className="tab-communities"><PanelTitle>Communities</PanelTitle>{communityCards()}</section> :
        <>
          <div className="compose-inline"><Avatar profile={me}/><button onClick={() => { if (requireAccount()) setCompose(true); }}>What&apos;s happening?</button><button className="primary-btn" onClick={() => { if (requireAccount()) setCompose(true); }}>Post</button></div>
          {loadingCloud && <div className="center-message">Loading your feed...</div>}
          {!loadingCloud && filteredPosts.length === 0 && <div className="empty-state"><Sparkles size={34}/><h3>{tab === "following" ? "Your feed starts here" : "Be the first to post"}</h3><p>{tab === "following" ? "Follow people in Explore to see what they share." : "Share a thought and start a conversation."}</p><button className="outline-btn" onClick={()=>navigate("explore")}>Discover people</button></div>}
          {filteredPosts.map((post) => <PostCard {...postProps(post)} />)}
        </>}
      </>}

      {view === "explore" && <>
        <div className="search-header"><Search size={19}/><input aria-label="Search Blumbook" placeholder="Search Blumbook" value={query} onChange={(e)=>setQuery(e.target.value)}/>{query && <button aria-label="Clear search" onClick={()=>setQuery("")}><X size={18}/></button>}</div>
        <div className="feed-tabs"><button className="selected">For you</button><button onClick={()=>setQuery("technology")}>Technology</button><button onClick={()=>setQuery("community")}>Community</button><button onClick={()=>setQuery("creators")}>Creators</button></div>
        {query ? <>
          <div className="section-label">People</div>
          {searchProfiles.length ? searchProfiles.map((p)=>personRow(p)) : <div className="center-message">No matching people.</div>}
          <div className="section-label">Posts</div>
          {searchPosts.length ? searchPosts.map((post)=><PostCard {...postProps(post)}/>) : <div className="center-message">No matching posts.</div>}
        </> : <>
          <div className="explore-hero"><span className="eyebrow">DISCOVER YOUR WORLD</span><h2>What&apos;s happening<br/>around you?</h2><p>Explore conversations, ideas and people who inspire.</p></div>
          <div className="section-label">Trending now <span>See what people are talking about</span></div>
          {TRENDS.map((trend,i)=><button className="trend-row" key={trend.tag} onClick={()=>setQuery(trend.tag.replace("#",""))}><span><small>{i+1} · {trend.category}</small><strong>{trend.tag}</strong><small>{trend.posts}</small></span><MoreHorizontal size={18}/></button>)}
          <div className="section-label">Who to follow</div>
          {people.slice(0,5).map((p)=>personRow(p))}
        </>}
      </>}

      {view === "notifications" && <>
        <PanelTitle extra={<button className="icon-button" onClick={()=>navigate("settings")} aria-label="Notification settings"><Settings size={19}/></button>}>Notifications</PanelTitle>
        <div className="feed-tabs">{["All","Mentions","Likes","Follows"].map((name)=><button key={name} className={noticeFilter===name?"selected":""} onClick={()=>setNoticeFilter(name)}>{name}</button>)}</div>
        {(DEMO_NOTICES.filter((n)=>noticeFilter==="All" || (noticeFilter==="Likes"&&n.kind==="like") || (noticeFilter==="Follows"&&n.kind==="follow") || (noticeFilter==="Mentions"&&n.kind==="reply"))).map((n: Notice)=>
          <div className="notice-row" key={n.id}><span className={"notice-mark notice-"+n.kind}>{n.kind==="like"?<Heart size={21} fill="currentColor"/>:n.kind==="follow"?<UserRoundPlus size={21}/>:n.kind==="repost"?<Repeat2 size={21}/>:<MessageCircle size={21}/>}</span><div><strong>{n.person}</strong> {n.text}<small>{n.time} ago</small></div></div>
        )}
        {isCloudEnabled && <div className="hint-strip">Live notifications will appear here in the next release; the items above are sample activity.</div>}
      </>}

      {view === "messages" && <>
        <PanelTitle extra={<button className="icon-button" onClick={()=>notify("Select a conversation below.")} aria-label="New conversation"><Mail size={20}/></button>}>Messages</PanelTitle>
        {chatWith ? <div className="chat-page">
          <button className="chat-heading" onClick={()=>setChatWith(null)}><ArrowLeft size={20}/><Avatar profile={lookup(chatWith)} size="small"/><strong>{lookup(chatWith).display_name}</strong></button>
          <div className="chat-bubbles">{(chats[chatWith] || []).map((m)=><div key={m.id} className={"chat-bubble " + (m.sender==="me"?"mine":"theirs")}><p>{m.text}</p><small>{m.time}</small></div>)}</div>
          <form className="chat-send" onSubmit={(e)=>{ e.preventDefault(); if(!chatText.trim())return; setChats((prev)=>({...prev,[chatWith]:[...(prev[chatWith]||[]),{id:String(Date.now()),sender:"me",text:chatText.trim(),time:"Now"}]}));setChatText(""); }}><input aria-label="Write a message" placeholder="Start a message" value={chatText} onChange={(e)=>setChatText(e.target.value)}/><button aria-label="Send" disabled={!chatText.trim()}><Send size={19}/></button></form>
        </div> :
        <><div className="hint-strip">Message previews are currently a demo. Private messaging backend is planned for the next phase.</div>
          {demoThreads.map((chat)=><button className="message-row" key={chat.id} onClick={()=>setChatWith(chat.id)}><Avatar profile={lookup(chat.id)}/><span><strong>{chat.name}</strong><small>@{chat.handle} · {chat.time}</small><p>{chats[chat.id]?.at(-1)?.text || chat.last}</p></span></button>)}
        </>}
      </>}

      {view === "communities" && <><PanelTitle>Communities</PanelTitle><div className="explore-hero community-hero"><span className="eyebrow">FIND YOUR PEOPLE</span><h2>Belong somewhere<br/>amazing.</h2><p>Discover communities that share your passions.</p></div>{communityCards()}</>}

      {view === "bookmarks" && <><PanelTitle>Bookmarks</PanelTitle><p className="muted-intro">@{me.username} · Your saved posts</p>{posts.filter((p)=>p.bookmarked).length===0?<div className="empty-state"><Bookmark size={34}/><h3>Save posts for later</h3><p>Tap the bookmark icon on any post to keep it here.</p></div>:posts.filter((p)=>p.bookmarked).map((p)=><PostCard {...postProps(p)}/>)}</>}

      {view === "profile" && <>
        <PanelTitle onBack={()=>navigate("home")} extra={<span className="mini-post-count">{posts.filter((p)=>p.author_id===activeProfile.id).length} posts</span>}>{activeProfile.display_name}</PanelTitle>
        <div className="profile-banner"><span className="banner-glow"/></div>
        <div className="profile-summary">
          <div className="profile-top"><Avatar profile={activeProfile} size="large"/>{activeProfile.id===me.id?<button className="outline-btn" onClick={openEdit}>Edit profile</button>:<button className={"outline-btn "+(followed.includes(activeProfile.id)?"outline-active":"")} onClick={()=>toggleFollow(activeProfile.id)}>{followed.includes(activeProfile.id)?"Following":"Follow"}</button>}</div>
          <h2><Name profile={activeProfile}/></h2><span className="profile-handle">@{activeProfile.username}</span>
          <p className="profile-bio">{activeProfile.bio || "Here to share, learn, and connect."}</p>
          <div className="profile-extra"><Compass size={15}/>{activeProfile.location || "Blumbook community"}</div>
          <div className="follow-stats"><span><b>{activeProfile.id===me.id?followed.length:156}</b> Following</span><span><b>{activeProfile.id===me.id?0:shortCount(2840)}</b> Followers</span></div>
        </div>
        <div className="feed-tabs"><button className="selected">Posts</button><button onClick={()=>notify("Replies tab is coming soon")}>Replies</button><button onClick={()=>notify("Media tab is coming soon")}>Media</button><button onClick={()=>notify("Likes are private")}>Likes</button></div>
        {posts.filter((p)=>p.author_id===activeProfile.id).length===0?<div className="empty-state"><Feather size={30}/><h3>No posts yet</h3><p>When this person posts, it will appear here.</p></div>:posts.filter((p)=>p.author_id===activeProfile.id).map((p)=><PostCard {...postProps(p)}/>)}
      </>}

      {view === "thread" && selectedPost && <>
        <PanelTitle onBack={()=>navigate("home")}>Post</PanelTitle><PostCard {...postProps(selectedPost)}/>
        <form className="reply-form" onSubmit={sendReply}><Avatar profile={me} size="small"/><input aria-label="Post a reply" value={replyText} onChange={(e)=>setReplyText(e.target.value)} placeholder="Post your reply" maxLength={500}/><button className="primary-btn" disabled={busy || !replyText.trim()}>Reply</button></form>
        {(comments[selectedPost.id]||[]).map((c)=><div className="reply-row" key={c.id}><Avatar profile={lookup(c.author_id)} size="small"/><div><strong>{lookup(c.author_id).display_name}</strong><small>@{lookup(c.author_id).username} · {timeAgo(c.created_at)}</small><p>{c.body}</p></div></div>)}
      </>}

      {view === "settings" && <>
        <PanelTitle>Settings & privacy</PanelTitle><div className="settings-group">
          {[
            ["Your account","Manage your profile and account details",UserRound],
            ["Security and account access","Passwords, login and account safety",ShieldCheck],
            ["Privacy and safety","Manage who can see your content",Bookmark],
            ["Notifications","Choose what you want to hear about",Bell],
            ["Appearance","Dark mode is enabled",Sparkles],
          ].map(([name,desc,Icon],i)=>{const ItemIcon=Icon as LucideIcon;return <button key={i} className="settings-item" onClick={()=>i===0?openEdit():notify("Additional settings are planned for the next release.")}><ItemIcon size={22}/><span><strong>{name as string}</strong><small>{desc as string}</small></span><ArrowRight size={18}/></button>;})}
          <button className="settings-item" onClick={()=>isCloudEnabled&&!cloudUserId?setAuthOpen(true):logOut()}><LogOut size={22}/><span><strong>{isCloudEnabled&&!cloudUserId?"Log in":"Log out"}</strong><small>Manage your session</small></span><ArrowRight size={18}/></button>
        </div>
        {!isCloudEnabled && <div className="hint-strip">Demo mode is active. Configure Supabase to enable real accounts and shared posts.</div>}
      </>}
    </main>

    <aside className="right-column">
      <div className="right-search"><Search size={19}/><input aria-label="Search" placeholder="Search Blumbook" value={query} onChange={(e)=>{setQuery(e.target.value);setView("explore");}}/></div>
      <section className="right-panel subscribe-panel"><h3>Welcome to Blumbook</h3><p>Meet new people, share your story and find your community.</p>{isCloudEnabled&&!cloudUserId?<button className="primary-btn" onClick={()=>{setSignUp(true);setAuthOpen(true);}}>Create your account</button>:<button className="primary-btn" onClick={()=>navigate("explore")}>Explore Blumbook</button>}</section>
      <section className="right-panel"><h3>What&apos;s happening</h3>{TRENDS.slice(0,4).map((t)=><button key={t.tag} className="right-trend" onClick={()=>{setQuery(t.tag.slice(1));navigate("explore");}}><small>{t.category}</small><strong>{t.tag}</strong><small>{t.posts}</small></button>)}<button className="panel-link" onClick={()=>navigate("explore")}>Show more</button></section>
      <section className="right-panel"><h3>Who to follow</h3>{people.filter((p)=>p.id!==me.id).slice(0,3).map((p)=><div className="suggestion" key={p.id}><button onClick={()=>openProfile(p.id)}><Avatar profile={p} size="small"/><span><strong>{p.display_name}</strong><small>@{p.username}</small></span></button><button className="follow-btn" onClick={()=>toggleFollow(p.id)}>{followed.includes(p.id)?"Following":"Follow"}</button></div>)}<button className="panel-link" onClick={()=>navigate("explore")}>Show more</button></section>
      <footer className="right-footer">About · Privacy · Terms · Accessibility<br/>© {new Date().getFullYear()} Blumbook. Talk. Share. Bloom.</footer>
    </aside>

    <nav className="mobile-bottom" aria-label="Main navigation">
      {NAV.filter((n)=>["home","explore","communities","notifications","messages"].includes(n.id)).map(({id,label,Icon})=><button aria-label={label} key={id} className={view===id?"active":""} onClick={()=>navigate(id)}><Icon size={25} strokeWidth={view===id?2.7:1.9}/>{id==="notifications"&&<span className="nav-dot"/>}</button>)}
    </nav>
    <button aria-label="Create post" className="floating-compose" onClick={()=>{if(requireAccount())setCompose(true);}}><Plus size={28}/></button>
    {menuOpen && <button aria-label="Close menu" className="menu-shade" onClick={()=>setMenuOpen(false)}/>}
    {toast && <div role="status" className="toast">{toast}</div>}

    {compose && <Modal close={()=>setCompose(false)}>
      <div className="dialog-head"><button className="icon-button" onClick={()=>setCompose(false)} aria-label="Close"><X size={22}/></button><strong>Create post</strong><button form="compose-form" className="primary-btn" disabled={busy||!postText.trim()||postText.length>500}>{busy?"Posting...":"Post"}</button></div>
      <form id="compose-form" onSubmit={submitPost}><div className="compose-body"><Avatar profile={me}/><div className="compose-fields"><span className="audience">🌐 Everyone</span><textarea autoFocus aria-label="Write a post" placeholder="What's happening?" rows={5} maxLength={500} value={postText} onChange={(e)=>setPostText(e.target.value)}/>{imagePreview&&<div className="preview-wrap"><img src={imagePreview} alt="Image preview"/><button type="button" onClick={()=>{setImageFile(null);setImagePreview("");}} aria-label="Remove image"><X size={19}/></button></div>}</div></div><div className="compose-bottom"><label className="upload-action" title="Attach photo"><ImagePlus size={22}/><input type="file" accept="image/*" onChange={pickImage} hidden/></label><span>Up to 500 characters · Images up to 5 MB</span><strong className={postText.length>460?"warn-count":""}>{500-postText.length}</strong></div></form>
    </Modal>}

    {authOpen&&<Modal close={()=>setAuthOpen(false)}>
      <div className="auth-dialog"><button className="auth-close icon-button" aria-label="Close" onClick={()=>setAuthOpen(false)}><X size={22}/></button><img src="/logo.svg" alt="Blumbook"/><h2>{signUp?"Join Blumbook":"Welcome back"}</h2><p>{signUp?"Every story belongs here.":"Your community is waiting for you."}</p>
      {!isCloudEnabled&&<div className="demo-alert">Demo mode: account details are not sent to a server. Connect Supabase for real sign-in.</div>}
      <form onSubmit={authSubmit}>{signUp&&<label>Full name<input required value={authName} onChange={(e)=>setAuthName(e.target.value)} placeholder="Your name" /></label>}<label>Email<input type="email" required value={authEmail} onChange={(e)=>setAuthEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" minLength={6} required value={authPassword} onChange={(e)=>setAuthPassword(e.target.value)} placeholder="At least 6 characters"/></label><button disabled={busy} className="primary-btn full-btn">{busy?"Please wait...":signUp?"Create account":"Log in"}</button></form>
      <button className="auth-switch" onClick={()=>setSignUp(!signUp)}>{signUp?"Already have an account? Log in":"New to Blumbook? Sign up"}</button></div>
    </Modal>}

    {editProfile&&<Modal close={()=>setEditProfile(false)}><div className="dialog-head"><button className="icon-button" onClick={()=>setEditProfile(false)}><X size={22}/></button><strong>Edit profile</strong><button form="edit-profile-form" className="primary-btn" disabled={busy}>Save</button></div><form id="edit-profile-form" onSubmit={saveProfile} className="edit-form"><div className="edit-banner"/><Avatar profile={me} size="large"/><label>Name<input required maxLength={50} value={editName} onChange={(e)=>setEditName(e.target.value)}/></label><label>Bio<textarea maxLength={160} rows={3} value={editBio} onChange={(e)=>setEditBio(e.target.value)}/></label></form></Modal>}
  </div>;

  function personRow(p: Profile) {
    return <div className="person-row" key={p.id}><button onClick={()=>openProfile(p.id)}><Avatar profile={p}/><span><Name profile={p}/><small>@{p.username}</small><p>{p.bio}</p></span></button><button className="follow-btn" onClick={()=>toggleFollow(p.id)}>{followed.includes(p.id)?"Following":"Follow"}</button></div>;
  }
  function communityCards() {
    return <div className="community-list">{COMMUNITIES.map((c)=><div key={c.title} className="community-card"><div className="community-icon">{c.icon}</div><div><strong>{c.title}</strong><small>{c.members}</small><p>{c.description}</p></div><button className={joined.includes(c.title)?"outline-btn":"follow-btn"} onClick={()=>setJoined((prev)=>prev.includes(c.title)?prev.filter((x)=>x!==c.title):[...prev,c.title])}>{joined.includes(c.title)?"Joined":"Join"}</button></div>)}</div>;
  }
}
