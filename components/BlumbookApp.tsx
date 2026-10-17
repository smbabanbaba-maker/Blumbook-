"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, Bell, Bookmark, Check, CheckCircle2, ChevronDown, Compass, Ellipsis,
  Feather, Heart, Home, ImagePlus, LogIn, LogOut, Mail, Menu, MessageCircle, MoreHorizontal,
  Plus, Repeat2, Search, Send, Settings, Share2, ShieldCheck, Smile, Sparkles, Sun, Moon, Crown, List, Radio, ChartNoAxesCombined, CircleHelp, CalendarDays, MapPin, Pin, UserRound,
  UserRoundPlus, UsersRound, Accessibility, Link2, LockKeyhole, Languages, Download, Type, Handshake, Ban, Flag, Copy, Video, Play, type LucideIcon, X
} from "lucide-react";
import { supabase, isCloudEnabled } from "@/lib/supabase";
import BloomCircles from "@/components/BloomCircles";
import OpportunityHub from "@/components/OpportunityHub";
import DirectInbox from "@/components/DirectInbox";
import NotificationsPanel from "@/components/NotificationsPanel";
import CreatorStudioPlus from "@/components/CreatorStudioPlus";
import BlumClips from "@/components/BlumClips";
import StoriesRail from "@/components/StoriesRail";
import PollsPanel from "@/components/PollsPanel";
import LiveSessions from "@/components/LiveSessions";
import CreateMenu from "@/components/CreateMenu";
import CreatorAccess from "@/components/CreatorAccess";
import BlumAI from "@/components/BlumAI";
import ScheduledPosts from "@/components/ScheduledPosts";
import {translate,type AppLanguage} from "@/lib/locale";
import {
  COMMUNITIES, DEMO_ME, DEMO_NOTICES, DEMO_PEOPLE, DEMO_POSTS, TRENDS,
  shortCount, timeAgo, type Post, type Profile, type Notice,
} from "@/lib/demo";

type View = "home" | "explore" | "notifications" | "messages" | "profile" | "communities" | "bookmarks" | "settings" | "thread" | "premium" | "lists" | "spaces" | "creator" | "help" | "opportunities" | "videos" | "clips" | "polls" | "live" | "ai" | "verification" | "schedule";
type Theme = "dark" | "light";
type SettingsPanel = "account" | "security" | "privacy" | "notifications" | "accessibility" | "resources";
type Tab = "for-you" | "following" | "communities";
type ProfileTab = "posts" | "replies" | "media" | "likes";
type Comment = { id: string; post_id: string; author_id: string; body: string; created_at: string };
type ChatMessage = { id: string; sender: "me" | "them"; text: string; time: string };
const NAV: { id: View; label: string; Icon: LucideIcon }[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "explore", label: "Explore", Icon: Search },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "messages", label: "Messages", Icon: Mail },
  { id: "communities", label: "Communities", Icon: UsersRound },
  { id: "opportunities", label: "Opportunities", Icon: Handshake },
  { id: "videos", label: "Videos", Icon: Video },
  { id: "clips", label: "Clips", Icon: Play },
  { id: "polls", label: "Polls", Icon: ChartNoAxesCombined },
  { id: "live", label: "Live", Icon: Radio },
  { id: "ai", label: "Blum AI", Icon: Sparkles },
  { id: "schedule", label: "Scheduled", Icon: CalendarDays },
  { id: "verification", label: "Creator Access", Icon: ShieldCheck },
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
  post, author, onLike, onRepost, onBookmark, onReply, onProfile, onShare, onMute, onReport, onViewMedia, onTranslate,
}: {
  post: Post; author: Profile; onLike: (post: Post) => void; onRepost: (post: Post) => void;
  onBookmark: (post: Post) => void; onReply: (post: Post) => void;
  onProfile: (id: string) => void; onShare: (post: Post) => void;
  onMute:(id:string)=>void;onReport:(post:Post,reason:string)=>void;onViewMedia:(post:Post)=>void;onTranslate:(post:Post)=>void;
}) {
  const [options,setOptions]=useState(false);
  return <article className="post-card">
    <div className="post-avatar"><Avatar profile={author} /></div>
    <div className="post-main">
      <div className="post-top">
        <button className="post-user" onClick={() => onProfile(author.id)}>
          <Name profile={author} /><span className="post-handle">@{author.username}</span><span className="post-handle">· {timeAgo(post.created_at)}</span>
        </button>
        <div className="post-option-wrap"><button className="icon-button icon-muted" aria-expanded={options} aria-label="More post options" onClick={() => setOptions(x=>!x)}><MoreHorizontal size={20}/></button>
          {options&&<div className="post-popover" role="group" aria-label="Post actions">
            <button onClick={()=>{onShare(post);setOptions(false);}}>Copy post link</button>
            <button onClick={()=>{onMute(author.id);setOptions(false);}}>Mute @{author.username}</button>
            <button onClick={()=>{onReport(post,"Spam");setOptions(false);}}>Report spam (beta)</button>
            <button onClick={()=>{onReport(post,"Harassment");setOptions(false);}}>Report harassment (beta)</button>
          </div>}</div>
      </div>
      <div className="post-body">{post.body}</div><button className="post-translate-link" onClick={()=>onTranslate(post)}><Languages size={14}/> Translate / Blum AI</button>
      {post.image_url&&<button className="post-image-wrap" aria-label="Open image viewer" onClick={()=>onViewMedia(post)}><img className="post-image" src={post.image_url} alt="Shared image" loading="lazy"/></button>}{post.video_url&&<button className="post-video-preview" aria-label="Watch video" onClick={()=>onViewMedia(post)}><video src={post.video_url} preload="metadata" muted playsInline/><span><Play size={21}/> Watch video</span></button>}
      <div className="post-actions">
        <button aria-label="Reply" onClick={() => onReply(post)}><MessageCircle size={18}/><span>{shortCount(post.replies)}</span></button>
        <button className={post.reposted ? "reposted" : ""} aria-label="Repost" onClick={() => onRepost(post)}><Repeat2 size={18}/><span>{shortCount(post.reposts)}</span></button>
        <button className={post.liked ? "liked" : ""} aria-label="Like" onClick={() => onLike(post)}><Heart size={18} fill={post.liked ? "currentColor" : "none"}/><span>{shortCount(post.likes)}</span></button>
        {!isCloudEnabled&&<button aria-label="Sample views (demo only)" onClick={() => onReply(post)}><span className="view-icon">▥</span><span>{shortCount(post.views)}</span></button>}
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
  const [welcomeHidden,setWelcomeHidden]=useState(true);
  const [mutedAuthors,setMutedAuthors]=useState<string[]>([]);
  const [blockedAuthors,setBlockedAuthors]=useState<string[]>([]);
  const [profileAlerts,setProfileAlerts]=useState<string[]>([]);
  const [profileMore,setProfileMore]=useState(false);
  const [collabTarget,setCollabTarget]=useState<Profile|null>(null);
  const [collabKind,setCollabKind]=useState("Project");
  const [collabMessage,setCollabMessage]=useState("");
  const [profileReport,setProfileReport]=useState<Profile|null>(null);
  const [reportReason,setReportReason]=useState("Spam");
  const [blockTarget,setBlockTarget]=useState<Profile|null>(null);
  const [followCounts,setFollowCounts]=useState<Record<string,{following:number;followers:number}>>({});
  const [language,setLanguage] = useState<AppLanguage>("en");
  const tr=(key:Parameters<typeof translate>[0])=>translate(key,language);
  const [theme, setTheme] = useState<Theme>("dark");
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [settingsPanel, setSettingsPanel] = useState<SettingsPanel | null>(null);
  const [settingsSearch, setSettingsSearch] = useState("");
  const [compactText, setCompactText] = useState(false);
  const [notifyPrefs, setNotifyPrefs] = useState({ likes: true, follows: true, replies: true });
  const [lists, setLists] = useState<string[]>([]);
  const [listName, setListName] = useState("");
  useEffect(() => {
    if(window.localStorage.getItem("blumbook-language")==="ha")setLanguage("ha");
    setWelcomeHidden(window.localStorage.getItem("blumbook-onboarded")==="yes");
    try{const m=JSON.parse(window.localStorage.getItem("blumbook-muted")||"[]");if(Array.isArray(m))setMutedAuthors(m.filter(x=>typeof x==="string"));}catch{}
    try{const b=JSON.parse(window.localStorage.getItem("blumbook-hidden-accounts")||"[]");if(Array.isArray(b))setBlockedAuthors(b.filter(x=>typeof x==="string"));}catch{}
    try{const a=JSON.parse(window.localStorage.getItem("blumbook-profile-alerts")||"[]");if(Array.isArray(a))setProfileAlerts(a.filter(x=>typeof x==="string"));}catch{}
    const saved = window.localStorage.getItem("blumbook-theme");
    if (saved === "light") setTheme("light");
    const savedPrefs = window.localStorage.getItem("blumbook-notification-prefs");
    if (savedPrefs) { try { const p = JSON.parse(savedPrefs); setNotifyPrefs({likes:p.likes!==false,follows:p.follows!==false,replies:p.replies!==false}); } catch {} }
    setCompactText(window.localStorage.getItem("blumbook-compact-text") === "true");
    setThemeLoaded(true);
    const savedLists = window.localStorage.getItem("blumbook-lists");
    if (savedLists) { try { const values = JSON.parse(savedLists); if (Array.isArray(values)) setLists(values.filter((v): v is string => typeof v === "string")); } catch {} }
  }, []);
  useEffect(() => {
    if (!themeLoaded) return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang=language;
    window.localStorage.setItem("blumbook-language",language);
    window.localStorage.setItem("blumbook-theme", theme);
  }, [theme, themeLoaded, language]);
  useEffect(() => {
    if (!themeLoaded) return;
    window.localStorage.setItem("blumbook-notification-prefs", JSON.stringify(notifyPrefs));
    window.localStorage.setItem("blumbook-compact-text", String(compactText));
  }, [notifyPrefs, compactText, themeLoaded]);
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
  const [videoFile,setVideoFile]=useState<File|null>(null);
  const [videoPreview,setVideoPreview]=useState("");
  const [mediaViewer,setMediaViewer]=useState<Post|null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [signUp, setSignUp] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("demo-me");
  const [profileTab,setProfileTab] = useState<ProfileTab>("posts");
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
  const [editHeadline,setEditHeadline]=useState("");
  const [editSkills,setEditSkills]=useState("");
  const [editPortfolio,setEditPortfolio]=useState("");
  const [editAvailable,setEditAvailable]=useState(false);
  const [editLocation,setEditLocation]=useState("");
  const [editAvatarFile,setEditAvatarFile]=useState<File|null>(null);
  const [editBannerFile,setEditBannerFile]=useState<File|null>(null);
  const [editAvatarPreview,setEditAvatarPreview]=useState("");
  const [editBannerPreview,setEditBannerPreview]=useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [extraToolsOpen,setExtraToolsOpen]=useState(false);
  const [createMenuOpen,setCreateMenuOpen]=useState(false);
  const [composeMode,setComposeMode]=useState<"post"|"photo"|"video">("post");
  const [storyLaunch,setStoryLaunch]=useState(0);
  const [pollLaunch,setPollLaunch]=useState(0);
  const [liveLaunch,setLiveLaunch]=useState(0);
  const [scheduleLaunch,setScheduleLaunch]=useState(0);
  const [aiSeed,setAiSeed]=useState("");
  const [aiTask,setAiTask]=useState<"caption"|"translate"|"rewrite"|"ideas">("caption");
  const [noticeFilter, setNoticeFilter] = useState("All");
  const [loadingCloud, setLoadingCloud] = useState(isCloudEnabled);
  const me = member || DEMO_ME;
  const allPeople = useMemo(() => [me, ...people.filter((p) => p.id !== me.id)], [me, people]);
  const lookup = useCallback((id: string) => allPeople.find((p) => p.id === id) || { id, display_name:"Blumbook member", username:"member", bio:"" }, [allPeople]);
  const isMember = !isCloudEnabled || Boolean(cloudUserId);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3400); };
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const onKeyDown=(event: KeyboardEvent) => { if (event.key==="Escape") setMenuOpen(false); };
    document.addEventListener("keydown",onKeyDown);
    return () => {document.body.style.overflow=previousOverflow;document.removeEventListener("keydown",onKeyDown);};
  },[menuOpen]);
  const navigate = (target: View) => { setProfileMore(false); if(target!=="profile" && typeof window!=="undefined" && new URLSearchParams(window.location.search).has("profile")){const url=new URL(window.location.href);url.searchParams.delete("profile");window.history.replaceState({},"",url.pathname+url.search);} setView(target); if (target === "settings") { setSettingsPanel(null); setSettingsSearch(""); } setMenuOpen(false); setChatWith(null); window.scrollTo({ top: 0, behavior:"smooth" }); };
  const requireAccount = () => {
    if (!isMember) { setAuthOpen(true); notify("Sign in to interact with the community."); return false; }
    return true;
  };

  const openComposer=(mode:"post"|"photo"|"video"="post",draft?:string)=>{
    if(!requireAccount())return;
    setComposeMode(mode);setPostText(draft||"");setCompose(true);
  };
  const selectCreate=(action:"post"|"photo"|"video"|"poll"|"story"|"live"|"opportunity"|"schedule")=>{
    setCreateMenuOpen(false);
    if(["post","photo","video"].includes(action)){openComposer(action as "post"|"photo"|"video");return;}
    if(action==="story"){navigate("home");setTab("for-you");setStoryLaunch(k=>k+1);return;}
    if(action==="poll"){navigate("polls");setPollLaunch(k=>k+1);return;}
    if(action==="live"){navigate("live");setLiveLaunch(k=>k+1);return;}
    if(action==="schedule"){navigate("schedule");setScheduleLaunch(k=>k+1);return;}
    if(action==="opportunity"){navigate("opportunities");return;}
  };
  const loadCloud = useCallback(async () => {
    if (!supabase) return;
    const client = supabase;
    setLoadingCloud(true);
    try {
      const [{ data: { user } }, { data: profilesData }, { data: postsData }, { data: likesData }, { data: bookmarksData }, { data: followsData }, { data: repostsData }, { data: commentsData }] = await Promise.all([
        client.auth.getUser(),
        client.from("profiles").select("id, username, display_name, bio, avatar_url, verified, location, created_at").limit(100),
        client.from("posts").select("id, author_id, body, image_url, video_url, created_at").order("created_at", { ascending:false }).limit(60),
        client.from("likes").select("post_id, user_id").limit(1000),
        client.from("bookmarks").select("post_id, user_id").limit(1000),
        client.from("follows").select("follower_id, following_id").limit(1000),
        client.from("reposts").select("post_id, user_id").limit(1000),
        client.from("comments").select("id,post_id,author_id,body,created_at").limit(2000),
      ]);
      let availablePosts=postsData;
      if(postsData==null){const old=await client.from("posts").select("id,author_id,body,image_url,created_at").order("created_at",{ascending:false}).limit(60);availablePosts=(old.data||[]).map(p=>({...p,video_url:null}));}
      setCloudUserId(user?.id || null);
      const extraResult=await client.from("profile_extras").select("user_id,headline,skills,portfolio_url,open_to_collab").limit(100);
      const extrasData=extraResult.error
        ? ((await client.from("profile_extras").select("user_id,headline,skills,portfolio_url").limit(100)).data||[]).map(x=>({...x,open_to_collab:false}))
        : extraResult.data;
      const extras=new Map((extrasData||[]).map(x=>[x.user_id,x]));
      const extraColumns=await client.from("profiles").select("id,banner_url,pinned_post_id").limit(100);
      const profileMeta=new Map((extraColumns.data||[]).map(x=>[x.id,x]));
      const cleanProfiles: Profile[] = (profilesData || []).map((p) => ({ id:p.id, username:p.username, display_name:p.display_name, bio:p.bio || "", avatar_url:p.avatar_url, verified:p.verified, location:p.location,created_at:p.created_at,banner_url:profileMeta.get(p.id)?.banner_url||null,pinned_post_id:profileMeta.get(p.id)?.pinned_post_id||null,headline:extras.get(p.id)?.headline||"",skills:extras.get(p.id)?.skills||[],portfolio_url:extras.get(p.id)?.portfolio_url||"",open_to_collab:extras.get(p.id)?.open_to_collab===true }));
      setPeople(cleanProfiles);
      const mine = cleanProfiles.find((p) => p.id === user?.id);
      setMember(user ? (mine || { id:user.id, username:(user.email || "member").split("@")[0], display_name:user.user_metadata?.full_name || "Blumbook member", bio:"" }) : null);
      setFollowed((followsData || []).filter((f) => f.follower_id === user?.id).map((f) => f.following_id));
      const tally:Record<string,{following:number;followers:number}>={};
      for(const f of (followsData||[])){
        const following=tally[f.follower_id]||{following:0,followers:0};following.following++;tally[f.follower_id]=following;
        const followers=tally[f.following_id]||{following:0,followers:0};followers.followers++;tally[f.following_id]=followers;
      }
      setFollowCounts(tally);
      const counts = (rows: { post_id: string }[] | null) => {
        const out: Record<string, number> = {};
        (rows || []).forEach((r) => { out[r.post_id] = (out[r.post_id] || 0) + 1; }); return out;
      };
      const likesCount = counts(likesData), repostsCount = counts(repostsData), repliesCount = counts(commentsData);
      const commentIndex:Record<string,Comment[]>={};
      for(const c of commentsData||[])commentIndex[c.post_id]=[...(commentIndex[c.post_id]||[]),c];
      setComments(commentIndex);
      setPosts((availablePosts || []).map((p) => ({
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
  const submitPost=async(e:FormEvent)=>{
    e.preventDefault();if(!postText.trim()||postText.length>500||!requireAccount()||busy)return;
    setBusy(true);let imageUrl:string|null=imageFile?imagePreview:null;let videoUrl:string|null=videoFile?videoPreview:null;
    try {
      if(supabase&&cloudUserId){
        if(imageFile){
          const ext=(imageFile.name.split(".").pop()||"jpg").replace(/[^a-z0-9]/gi,"").toLowerCase();
          const path=cloudUserId+"/"+crypto.randomUUID()+"."+ext;
          const {error}=await supabase.storage.from("post-media").upload(path,imageFile,{upsert:false,contentType:imageFile.type});
          if(error)throw new Error("Image upload failed: "+error.message);
          imageUrl=supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
        }
        if(videoFile){
          const ext=videoFile.type==="video/webm"?"webm":"mp4";
          const path=cloudUserId+"/"+crypto.randomUUID()+"."+ext;
          const {error}=await supabase.storage.from("post-videos").upload(path,videoFile,{upsert:false,contentType:videoFile.type});
          if(error)throw new Error("Video upload failed. Apply the Phase 5 migration: "+error.message);
          videoUrl=supabase.storage.from("post-videos").getPublicUrl(path).data.publicUrl;
        }
        const values:Record<string,string|null>={author_id:cloudUserId,body:postText.trim(),image_url:imageUrl};
        if(videoUrl)values.video_url=videoUrl;
        const {error}=await supabase.from("posts").insert(values);
        if(error)throw new Error("Post was not saved: "+error.message);
        await loadCloud();
      }else {
        setPosts(p=>[{id:"demo-"+Date.now(),author_id:me.id,body:postText.trim(),image_url:imageUrl,video_url:videoUrl,created_at:new Date().toISOString(),likes:0,reposts:0,replies:0,views:0},...p]);
      }
      setPostText("");setImageFile(null);setImagePreview("");setVideoFile(null);setVideoPreview("");
      setCompose(false);navigate("home");notify(isCloudEnabled?"Post published.":"Demo post added to this session.");
    }catch(err){notify(err instanceof Error?err.message:"Post failed");}
    finally{setBusy(false);}
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
  const openEdit = () => {
    setMenuOpen(false);setEditName(me.display_name);setEditBio(me.bio);
    setEditHeadline(me.headline||"");setEditSkills((me.skills||[]).join(", "));
    setEditPortfolio(me.portfolio_url||"");setEditAvailable(Boolean(me.open_to_collab));
    setEditLocation(me.location||"");setEditAvatarFile(null);setEditBannerFile(null);
    setEditAvatarPreview(me.avatar_url||"");setEditBannerPreview(me.banner_url||"");
    setEditProfile(true);
  };
  const pickProfileImage=(e:React.ChangeEvent<HTMLInputElement>,kind:"avatar"|"banner")=>{
    const file=e.target.files?.[0];if(!file)return;
    if(!["image/jpeg","image/png","image/webp","image/gif"].includes(file.type)||file.size>5*1024*1024){
      notify("Choose a JPG, PNG, WebP or GIF image under 5 MB.");return;
    }
    const preview=URL.createObjectURL(file);
    if(kind==="avatar"){setEditAvatarFile(file);setEditAvatarPreview(preview);}
    else {setEditBannerFile(file);setEditBannerPreview(preview);}
  };
  const uploadProfileImage=async(file:File,kind:"avatar"|"banner",userId:string)=>{
    if(!supabase)return null;
    const extension=file.type==="image/png"?"png":file.type==="image/webp"?"webp":file.type==="image/gif"?"gif":"jpg";
    const path=userId+"/profiles/"+kind+"-"+crypto.randomUUID()+"."+extension;
    const {error}=await supabase.storage.from("post-media").upload(path,file,{contentType:file.type,upsert:false});
    if(error)throw new Error("Image upload failed: "+error.message);
    return supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
  };
  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!requireAccount()||busy) return;
    const skills=editSkills.split(",").map(s=>s.trim()).filter(Boolean).slice(0,12);
    const portfolio=editPortfolio.trim();
    if(portfolio && !/^https:\/\/[a-z0-9.-]+(?::\d+)?(?:[/?#]|$)/i.test(portfolio)){notify("Use a valid https:// portfolio URL.");return;}
    setBusy(true);
    try {
      if(supabase&&cloudUserId){
        const avatarUrl=editAvatarFile?await uploadProfileImage(editAvatarFile,"avatar",cloudUserId):me.avatar_url||null;
        const bannerUrl=editBannerFile?await uploadProfileImage(editBannerFile,"banner",cloudUserId):me.banner_url||null;
        const values:Record<string,string|null>={display_name:editName.trim(),bio:editBio.trim(),location:editLocation.trim(),avatar_url:avatarUrl};
        if(editBannerFile)values.banner_url=bannerUrl;
        const {error}=await supabase.from("profiles").update(values).eq("id",cloudUserId);
        if(error)throw new Error(error.message+(editBannerFile?" — apply the Profile migration first.":""));
        const {error:extrasError}=await supabase.from("profile_extras").upsert({user_id:cloudUserId,headline:editHeadline.trim(),skills,portfolio_url:portfolio,open_to_collab:editAvailable});
        if(extrasError)notify("Profile saved, but some professional fields need the Phase 3 SQL migration.");
        await loadCloud();
      } else {
        setMember({...me,display_name:editName.trim(),bio:editBio.trim(),location:editLocation.trim(),headline:editHeadline.trim(),skills,
          portfolio_url:portfolio,open_to_collab:editAvailable,
          avatar_url:editAvatarPreview||me.avatar_url,banner_url:editBannerPreview||me.banner_url});
      }
      setEditProfile(false);notify(isCloudEnabled?"Profile saved.":"Profile updated in preview mode.");
    }catch(err){notify(err instanceof Error?err.message:"Could not save profile.");}
    finally{setBusy(false);}
  };
  const pinPost=async(post:Post)=>{
    if(post.author_id!==me.id||!requireAccount())return;
    const next=me.pinned_post_id===post.id?null:post.id;
    if(supabase&&cloudUserId){
      const {error}=await supabase.from("profiles").update({pinned_post_id:next}).eq("id",cloudUserId);
      if(error){notify("Could not save pin. Apply the profile SQL migration.");return;}
      await loadCloud();
    }else setMember({...me,pinned_post_id:next});
    notify(next?"Post pinned to your profile.":"Post unpinned.");
  };
  const openProfile = (id: string) => {
    const p=lookup(id);setSelectedProfile(id);setProfileTab("posts");navigate("profile");
    const url=new URL(window.location.href);url.searchParams.set("profile",p.username);url.searchParams.delete("post");
    window.history.replaceState({},"",url.pathname+url.search);
  };
  const share = async (post: Post) => {
    const url = window.location.origin + "/?post=" + encodeURIComponent(post.id);
    try { await navigator.clipboard.writeText(url); notify("Link copied to clipboard"); }
    catch { notify("Share this post: " + url); }
  };
  const activeProfile = lookup(selectedProfile === "demo-me" ? me.id : selectedProfile);
  const selectedPost = posts.find((p) => p.id === threadId);
  const profilePosts=posts.filter(p=>p.author_id===activeProfile.id);
  const sortedProfilePosts=[...profilePosts].sort((a,b)=>Number(b.id===activeProfile.pinned_post_id)-Number(a.id===activeProfile.pinned_post_id));
  const profileReplies=Object.values(comments).flat().filter(c=>c.author_id===activeProfile.id).sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime());
  const profileMedia=profilePosts.filter(p=>Boolean(p.image_url||p.video_url));
  const profileLikes=activeProfile.id===me.id?posts.filter(p=>p.liked):[];
  useEffect(()=>{
    const slug=new URLSearchParams(window.location.search).get("profile");
    if(!slug)return;
    const person=allPeople.find(p=>p.username.toLowerCase()===slug.toLowerCase());
    if(person){setSelectedProfile(person.id);setView("profile");}
  },[allPeople]);
  const filteredPosts = posts.filter((p) => !blockedAuthors.includes(p.author_id) && !mutedAuthors.includes(p.author_id) && (tab !== "following" || p.author_id === me.id || followed.includes(p.author_id)));
  const searchPosts = posts.filter((p) => !blockedAuthors.includes(p.author_id) && !mutedAuthors.includes(p.author_id) && (p.body.toLowerCase().includes(query.toLowerCase()) || lookup(p.author_id).display_name.toLowerCase().includes(query.toLowerCase())));
  const searchProfiles = people.filter((p) => p.display_name.toLowerCase().includes(query.toLowerCase()) || p.username.toLowerCase().includes(query.toLowerCase()));
  const mute=(id:string)=>{if(id===me.id){notify("Cannot mute yourself.");return;}const next=[...new Set([...mutedAuthors,id])];setMutedAuthors(next);window.localStorage.setItem("blumbook-muted",JSON.stringify(next));notify("Muted in this browser. You can undo in Settings.");};
  const report=async(p:Post,reason:string)=>{
    if(!supabase || !cloudUserId){notify("Reporting is not enabled in the public demo.");return;}
    const {error}=await supabase.from("content_reports").insert({reporter_id:cloudUserId,post_id:p.id,reason});
    if(error)notify(error.code==="23505"?"Already reported.":error.message);
    else notify("Report stored. Staff review is not operational yet.");
  };

  const profileUrl=(p:Profile)=>{
    const address=new URL(window.location.href);
    address.searchParams.delete("post");
    address.searchParams.set("profile",p.username);
    return address.toString();
  };
  const shareProfile=async(p:Profile)=>{
    setProfileMore(false);
    const link=profileUrl(p);
    try {
      if(navigator.share){await navigator.share({title:p.display_name+" on Blumbook",url:link});return;}
      await navigator.clipboard.writeText(link);
      notify("Profile link copied.");
    }catch(error){
      if(error instanceof DOMException && error.name==="AbortError")return;
      try{await navigator.clipboard.writeText(link);notify("Profile link copied.");}
      catch{window.prompt("Copy profile link:",link);}
    }
  };
  const openMessagePreview=(p:Profile)=>{
    setProfileMore(false);
    if(!requireAccount())return;
    navigate("messages");setChatWith(p.id);
    if(!isCloudEnabled)notify("Demo only — messages are not sent to other people.");
  };
  const openCollab=(p:Profile)=>{
    setProfileMore(false);
    if(!requireAccount())return;
    setCollabTarget(p);setCollabKind("Project");setCollabMessage("");
  };
  const sendCollab=async(e:FormEvent)=>{
    e.preventDefault();
    if(!collabTarget||!collabMessage.trim()||!requireAccount()||busy)return;
    if(!supabase||!cloudUserId){
      notify("Preview only — no collaboration request was sent.");
      setCollabTarget(null);return;
    }
    if(!collabTarget.open_to_collab){notify("This member isn't accepting collaboration requests.");return;}
    setBusy(true);
    const {error}=await supabase.from("collaboration_requests").insert({
      sender_id:cloudUserId,recipient_id:collabTarget.id,kind:collabKind,message:collabMessage.trim()
    });
    setBusy(false);
    if(error){notify("Could not deliver request. Check the Phase 3 migration.");return;}
    notify("Collaboration request saved. Inbox notifications are still in development.");
    setCollabTarget(null);setCollabMessage("");
  };
  const toggleProfileAlerts=(p:Profile)=>{
    if(!requireAccount())return;
    const next=profileAlerts.includes(p.id)?profileAlerts.filter(x=>x!==p.id):[...profileAlerts,p.id];
    setProfileAlerts(next);window.localStorage.setItem("blumbook-profile-alerts",JSON.stringify(next));
    setProfileMore(false);notify("Alert preference saved on this device. Push alerts aren't active yet.");
  };
  const toggleHidden=(p:Profile)=>{
    if(p.id===me.id)return;
    const already=blockedAuthors.includes(p.id);
    const next=already?blockedAuthors.filter(x=>x!==p.id):[...blockedAuthors,p.id];
    setBlockedAuthors(next);window.localStorage.setItem("blumbook-hidden-accounts",JSON.stringify(next));
    setBlockTarget(null);setProfileMore(false);
    notify(already?"Account unhidden on this device.":"Account hidden on this device only. This does not block contact or protect your posts.");
  };
  const submitProfileReport=async(e:FormEvent)=>{
    e.preventDefault();if(!profileReport)return;
    if(!supabase||!cloudUserId){notify("Profile reporting is unavailable in demo mode.");return;}
    setBusy(true);
    const {error}=await supabase.from("profile_reports").insert({
      reporter_id:cloudUserId,reported_id:profileReport.id,reason:reportReason
    });
    setBusy(false);
    if(error){notify(error.code==="23505"?"You have already reported this account.":"Could not submit report. Check the Phase 3 migration.");return;}
    setProfileReport(null);notify("Report saved for future moderation. A human review queue is not active yet.");
  };
  const postProps = (p: Post) => ({ key:p.id, post:p, author:lookup(p.author_id), onLike:toggleLike, onRepost:toggleRepost, onBookmark:toggleBookmark, onReply:openThread, onProfile:openProfile, onShare:share,onMute:mute,onReport:report,onViewMedia:openMedia,onTranslate:(post:Post)=>{setAiSeed(post.body);setAiTask("translate");navigate("ai");} });
  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/") || f.size > 5 * 1024 * 1024) { notify("Choose an image under 5 MB"); return; }
    setVideoFile(null);setVideoPreview("");setImageFile(f);setImagePreview(URL.createObjectURL(f));
  };
  const pickVideo=(e:React.ChangeEvent<HTMLInputElement>)=>{
   const f=e.target.files?.[0];if(!f)return;
   if(!["video/mp4","video/webm"].includes(f.type)||f.size>30*1024*1024){notify("Choose MP4 or WebM under 30 MB.");return;}
   setImageFile(null);setImagePreview("");setVideoFile(f);setVideoPreview(URL.createObjectURL(f));
  };
  const openMedia=(p:Post)=>{if(p.image_url||p.video_url)setMediaViewer(p);};
  const mediaPosts=posts.filter(p=>Boolean(p.image_url||p.video_url)&&!blockedAuthors.includes(p.author_id));
  const nextMedia=(offset:-1|1)=>{if(!mediaViewer||mediaPosts.length<2)return;const i=mediaPosts.findIndex(p=>p.id===mediaViewer.id);if(i>=0)setMediaViewer(mediaPosts[(i+offset+mediaPosts.length)%mediaPosts.length]);};
  const settingsConfig: {id:SettingsPanel;title:string;description:string;Icon:LucideIcon}[] = [
    {id:"account",title:"Your account",description:"See your account information, manage your profile, and learn about data controls.",Icon:UserRound},
    {id:"security",title:"Security and account access",description:"Manage your sign-in, account protection, and connected devices.",Icon:LockKeyhole},
    {id:"privacy",title:"Privacy and safety",description:"Choose how you share, interact, and control your experience.",Icon:ShieldCheck},
    {id:"notifications",title:"Notifications",description:"Choose which updates you want to receive about your activity.",Icon:Bell},
    {id:"accessibility",title:"Accessibility, display, and languages",description:"Customize the way Blumbook looks and feels.",Icon:Accessibility},
    {id:"resources",title:"Additional resources",description:"Find help, product information, and useful resources.",Icon:Link2}
  ];
  const filteredSettings = settingsConfig.filter(item => (item.title + " " + item.description).toLowerCase().includes(settingsSearch.toLowerCase()));
  const backFromSettings = () => { setSettingsPanel(null); window.scrollTo({top:0,behavior:"smooth"}); };
  const logOut = async () => {
    if (supabase) { await supabase.auth.signOut(); await loadCloud(); }
    else { setDemoSignedIn(false); setMember(null); }
    navigate("home"); notify("Signed out");
  };

  return <div className={"app-shell "+(compactText?"large-type":"")}>
    <aside className={"sidebar " + (menuOpen ? "sidebar-open" : "")} aria-label="Blumbook navigation">
      <div className="desktop-sidebar">
        <button className="brand-button" onClick={() => navigate("home")} aria-label="Blumbook home"><Brand /></button>
        <nav className="side-nav">{NAV.filter(({id})=>["home","explore","clips","notifications","messages","profile","communities","opportunities","polls","creator"].includes(id)).map(({ id, label, Icon }) => <button key={id} className={"side-link " + (view === id ? "active" : "")} onClick={() => id==="profile"?openProfile(me.id):navigate(id)}><Icon size={24} strokeWidth={view === id ? 2.5 : 1.85}/><span>{label}</span>{id === "notifications" && <i className="notification-pip"/>}</button>)}</nav>
        <button className="primary-btn side-post" onClick={()=>setCreateMenuOpen(true)}><Plus size={19}/><span>Create</span></button>
        <button className="side-account" onClick={() => isCloudEnabled && !cloudUserId ? setAuthOpen(true) : openProfile(me.id)}>
          <Avatar profile={me}/><span><strong>{me.display_name}</strong><small>@{me.username}</small></span><Ellipsis size={20}/>
        </button>
      </div>
      <div className="mobile-drawer-content simple-drawer-shell">
        <header className="simple-drawer-header">
          <div className="simple-drawer-brand"><img src="/logo.svg" alt=""/><strong>Blumbook</strong></div>
          <button aria-label="Close menu" className="simple-drawer-close" onClick={()=>setMenuOpen(false)}><X size={23}/></button>
        </header>
        <div className="simple-drawer-body">
          <button className="simple-drawer-account" onClick={()=>openProfile(me.id)}>
            <Avatar profile={me}/>
            <span><strong>{me.display_name}</strong><small>@{me.username}</small></span>
            <ArrowRight size={18}/>
          </button>
          <div className="simple-drawer-stats">
            <span><b>{followCounts[me.id]?.following??followed.length}</b> Following</span>
            <span><b>{followCounts[me.id]?.followers??(isCloudEnabled&&cloudUserId?"—":0)}</b> Followers</span>
          </div>
          <div className="simple-drawer-divider"/>
          <nav className="simple-drawer-links" aria-label="More places">
            <button onClick={()=>openProfile(me.id)}><UserRound size={23}/><span>{tr("Profile")}</span></button>
            <button onClick={()=>navigate("bookmarks")}><Bookmark size={23}/><span>{tr("Bookmarks")}</span></button>
            <button onClick={()=>navigate("communities")}><UsersRound size={23}/><span>Bloom Circles</span></button>
            <button onClick={()=>navigate("opportunities")}><Handshake size={23}/><span>Bloom Opportunities</span></button>
            <button onClick={()=>navigate("clips")}><Play size={23}/><span>Blum Clips</span></button>
            <button onClick={()=>navigate("creator")}><ChartNoAxesCombined size={23}/><span>{tr("Creator Studio")}</span></button>
            <button className="menu-extra-trigger" aria-expanded={extraToolsOpen} onClick={()=>setExtraToolsOpen(v=>!v)}><Plus size={23}/><span>More tools</span><ChevronDown className={extraToolsOpen?"rotated":""} size={18}/></button>
            {extraToolsOpen&&<div className="menu-extra-items">
              <button onClick={()=>navigate("polls")}><ChartNoAxesCombined size={20}/><span>Polls</span></button>
              <button onClick={()=>{navigate("home");setTab("for-you");setStoryLaunch(x=>x+1);}}><ImagePlus size={20}/><span>Stories</span></button>
              <button onClick={()=>navigate("live")}><Radio size={20}/><span>Live sessions</span></button>
              <button onClick={()=>navigate("ai")}><Sparkles size={20}/><span>Blum AI</span></button>
              <button onClick={()=>navigate("schedule")}><CalendarDays size={20}/><span>Scheduled posts</span></button>
              <button onClick={()=>navigate("verification")}><ShieldCheck size={20}/><span>Verification & Earnings</span></button>
              <button onClick={()=>navigate("premium")}><Crown size={20}/><span>Premium</span><small>Coming soon</small></button>
              <button onClick={()=>navigate("spaces")}><Radio size={20}/><span>Spaces</span><small>Coming soon</small></button>
              <button onClick={()=>navigate("lists")}><List size={20}/><span>My Lists</span><small>Device only</small></button>
            </div>}
            <button onClick={()=>navigate("settings")}><Settings size={23}/><span>{tr("Settings")}</span></button>
            <button onClick={()=>navigate("help")}><CircleHelp size={23}/><span>{tr("Help Center")}</span></button>
          </nav>
          <section className="simple-drawer-preferences">
            <div className="simple-drawer-preference-title"><Moon size={19}/><span>{tr("Appearance")}</span></div>
            <div className="simple-drawer-themes" role="group" aria-label="Appearance">
              <button aria-pressed={theme==="dark"} className={theme==="dark"?"selected":""} onClick={()=>setTheme("dark")}><Moon size={16}/>{tr("Dark")}</button>
              <button aria-pressed={theme==="light"} className={theme==="light"?"selected":""} onClick={()=>setTheme("light")}><Sun size={16}/>{tr("Light")}</button>
            </div>
          </section>
          <p className="simple-drawer-footer">Blumbook · Preview v0.1</p>
        </div>
      </div>
    </aside>

    <main className="main-column">
      <div className={"mobile-topbar " + (view === "settings" ? "mobile-topbar-settings" : "")}>
        {view === "settings" ? <>
          <button className="icon-button" onClick={() => settingsPanel ? setSettingsPanel(null) : navigate("home")} aria-label="Back"><ArrowLeft size={25}/></button>
          <div className="mobile-settings-heading"><strong>{settingsPanel ? settingsConfig.find(s => s.id === settingsPanel)?.title : "Settings"}</strong><small>@{me.username}</small></div>
        </> : <>
          <button className="avatar-action" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu"><Avatar profile={me} size="small"/></button>
          <button onClick={() => navigate("home")} className="mobile-brand"><img src="/logo.svg" alt="Blumbook"/><strong>Blumbook</strong></button>
          <button aria-label="Open more menu" aria-expanded={menuOpen} className="icon-button top-more-button" onClick={()=>setMenuOpen(true)}><MoreHorizontal size={25}/></button>
        </>}
      </div>

      {view === "home" && <>
        <div className="feed-tabs">
          {([["for-you","For you"],["following","Following"],["communities","Communities"]] as const).map(([id,label])=><button key={id} className={tab === id ? "selected" : ""} onClick={()=>setTab(id)}>{label==="For you"?tr("For you"):label==="Following"?tr("Following"):tr("Communities")}</button>)}
        </div>
        {tab === "communities" ? <BloomCircles userId={cloudUserId} requestAuth={()=>setAuthOpen(true)} language={language}/> :
        <>
          {!welcomeHidden&&<section className="onboard-card"><div><span className="feature-overline">WELCOME TO BLUMBOOK</span><h2>Ideas grow better together.</h2><p>Explore stories, discover a Bloom Circle, and introduce yourself. This is an early interactive preview.</p><div><button onClick={()=>navigate("communities")}>Explore Bloom Circles <ArrowRight size={16}/></button><button onClick={()=>{setWelcomeHidden(true);window.localStorage.setItem("blumbook-onboarded","yes");}}>Got it</button></div></div><button className="icon-button" aria-label="Dismiss welcome" onClick={()=>{setWelcomeHidden(true);window.localStorage.setItem("blumbook-onboarded","yes");}}><X size={20}/></button></section>}
          <StoriesRail userId={cloudUserId} profiles={allPeople} onSignIn={()=>setAuthOpen(true)} launchCreate={storyLaunch}/>
          <div className="home-opportunity-link"><button onClick={()=>navigate("opportunities")}><Handshake size={18}/><span><strong>Bloom Opportunities</strong><small>Discover projects, mentors and collaborators</small></span><ArrowRight size={18}/></button></div>
          <div className="home-mini-links">
            <button onClick={()=>navigate("polls")}><ChartNoAxesCombined size={17}/> Community Polls</button>
            <button onClick={()=>navigate("ai")}><Sparkles size={17}/> Blum AI</button>
          </div>
          <div className="compose-inline"><Avatar profile={me}/><button onClick={() => { if (requireAccount()) setCompose(true); }}>What&apos;s happening?</button><button className="primary-btn" onClick={() => { if (requireAccount()) setCompose(true); }}>Post</button></div>
          {!isCloudEnabled&&<p className="feed-demo-indicator"><ShieldCheck size={16}/> Demo preview · Sample content and numbers, not real members</p>}
          <div className="feed-status-actions"><button onClick={()=>isCloudEnabled?void loadCloud():notify("Demo content is already up to date.")}><Repeat2 size={15}/> Refresh feed</button></div>
          {loadingCloud&&<div className="feed-skeleton" role="status" aria-label="Loading posts">{[0,1,2].map(i=><div key={i} className="skeleton-post"><span className="skeleton-avatar"/><div><i/><i/><i/></div></div>)}</div>}
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
          <div className="explore-feature-links">
            <button onClick={()=>navigate("opportunities")}><Handshake size={21}/><span>Bloom Opportunities<small>Find useful connections</small></span><ArrowRight size={17}/></button>
            <button onClick={()=>navigate("videos")}><Video size={21}/><span>Videos<small>Watch shared clips</small></span><ArrowRight size={17}/></button>
          </div>
          <div className="explore-mini-tools"><button onClick={()=>navigate("polls")}>Polls <ArrowRight size={16}/></button><button onClick={()=>navigate("live")}>Live <ArrowRight size={16}/></button><button onClick={()=>navigate("ai")}>Blum AI <ArrowRight size={16}/></button></div>
          <div className="section-label">Who to follow</div>
          {people.slice(0,5).map((p)=>personRow(p))}
        </>}
      </>}

      {view === "notifications" && <NotificationsPanel userId={cloudUserId} profiles={allPeople} onSignIn={()=>setAuthOpen(true)} onProfile={openProfile} onPost={(id)=>{const p=posts.find(x=>x.id===id);if(p)void openThread(p);else notify("That post is outside the loaded feed.");}} onMessage={(id)=>{navigate("messages");setChatWith(id);}} prefs={notifyPrefs}/>}
      {view === "messages" && <DirectInbox userId={cloudUserId} profiles={allPeople} initialRecipient={chatWith} onRecipientChange={setChatWith} onSignIn={()=>setAuthOpen(true)}/>}
      {view === "opportunities" && <OpportunityHub userId={cloudUserId} profiles={allPeople} onSignIn={()=>setAuthOpen(true)} onProfile={openProfile} onMessage={(id)=>{navigate("messages");setChatWith(id);}}/>}
      {(view==="clips"||view==="videos") && <BlumClips posts={posts.filter(p=>!blockedAuthors.includes(p.author_id))} profiles={allPeople} following={followed} onProfile={openProfile} onLike={toggleLike} onBookmark={toggleBookmark} onComment={openThread} onShare={share} onFollow={toggleFollow} onCreate={()=>openComposer("video")}/>}
      {view==="polls"&&<PollsPanel userId={cloudUserId} profiles={allPeople} onSignIn={()=>setAuthOpen(true)} onProfile={openProfile} launchCreate={pollLaunch}/>}
      {view==="live"&&<LiveSessions userId={cloudUserId} profiles={allPeople} onSignIn={()=>setAuthOpen(true)} launchCreate={liveLaunch}/>}
      {view==="ai"&&<BlumAI userId={cloudUserId} onSignIn={()=>setAuthOpen(true)} seedText={aiSeed} seedTask={aiTask} onCompose={text=>openComposer("post",text)}/>}
      {view==="schedule"&&<ScheduledPosts userId={cloudUserId} onSignIn={()=>setAuthOpen(true)} launchCreate={scheduleLaunch} onCompose={text=>openComposer("post",text)}/>}
      {view==="verification"&&<CreatorAccess userId={cloudUserId} profile={me} onSignIn={()=>setAuthOpen(true)}/>}


      {view === "communities" && <BloomCircles userId={cloudUserId} requestAuth={()=>setAuthOpen(true)} language={language}/>}

      {view === "bookmarks" && <><PanelTitle>Bookmarks</PanelTitle><p className="muted-intro">@{me.username} · Your saved posts</p>{posts.filter((p)=>p.bookmarked).length===0?<div className="empty-state"><Bookmark size={34}/><h3>Save posts for later</h3><p>Tap the bookmark icon on any post to keep it here.</p></div>:posts.filter((p)=>p.bookmarked).map((p)=><PostCard {...postProps(p)}/>)}</>}

      {view === "profile" && <>
        <PanelTitle onBack={()=>navigate("home")} extra={<span className="mini-post-count">{profilePosts.length} {profilePosts.length===1?"post":"posts"}</span>}>{activeProfile.display_name}</PanelTitle>
        <div className="full-profile-cover">
          {activeProfile.banner_url ? <img src={activeProfile.banner_url} alt={activeProfile.display_name+"'s cover photo"}/> : <div className="full-profile-default-cover" aria-hidden="true"><span/><span/><span/></div>}
          {activeProfile.id===me.id&&<button className="cover-edit-shortcut" aria-label="Edit cover photo" onClick={openEdit}><ImagePlus size={19}/></button>}
        </div>
        <section className="full-profile-content">
          <div className="full-profile-avatar-line">
            <Avatar profile={activeProfile} size="large"/>
            <div className="full-profile-top-actions">
              {activeProfile.id===me.id
                ? <><button onClick={()=>void shareProfile(activeProfile)}><Share2 size={17}/> Share</button><button onClick={openEdit}>Edit profile</button></>
                : <><button onClick={()=>toggleFollow(activeProfile.id)} className="profile-follow-primary">{followed.includes(activeProfile.id)?"Following":"Follow"}</button><button onClick={()=>openMessagePreview(activeProfile)}><Mail size={17}/> Message</button></>}
              <div className="profile-more-wrap">
                <button className="profile-action-icon" aria-label="More profile options" aria-expanded={profileMore} onClick={()=>setProfileMore(x=>!x)}><MoreHorizontal size={20}/></button>
                {profileMore&&<div className="profile-more-panel" role="group" aria-label="Profile options">
                  <button onClick={()=>void shareProfile(activeProfile)}><Share2 size={17}/> Share profile</button>
                  {activeProfile.id===me.id
                  ? <><button onClick={()=>{setProfileMore(false);openEdit();}}><Feather size={17}/> Edit profile</button><button onClick={()=>navigate("settings")}><Settings size={17}/> Settings & privacy</button></>
                  : <><button onClick={()=>openCollab(activeProfile)}><Handshake size={17}/> Collaborate</button>
                    <button onClick={()=>toggleProfileAlerts(activeProfile)}><Bell size={17}/> {profileAlerts.includes(activeProfile.id)?"Turn off alerts":"Post alerts (preview)"}</button>
                    <button onClick={()=>{mute(activeProfile.id);setProfileMore(false);}}><Bell size={17}/> Mute @{activeProfile.username}</button>
                    <button onClick={()=>{setBlockTarget(activeProfile);setProfileMore(false);}}><Ban size={17}/>{blockedAuthors.includes(activeProfile.id)?"Unhide account":"Hide account (preview)"}</button>
                    <button onClick={()=>{setReportReason("Spam");setProfileReport(activeProfile);setProfileMore(false);}}><Flag size={17}/> Report account (beta)</button></>}
                </div>}
              </div>
            </div>
          </div>
          <div className="full-profile-name">
            <h2><Name profile={activeProfile}/></h2>
            <span>@{activeProfile.username}</span>
          </div>
          {activeProfile.headline&&<p className="full-profile-headline">{activeProfile.headline}</p>}
          <p className="full-profile-bio">{activeProfile.bio || (activeProfile.id===me.id?"Add a bio to introduce yourself.":"No bio yet.")}</p>
          <div className="full-profile-meta">
            {activeProfile.location&&<span><MapPin size={16}/>{activeProfile.location}</span>}
            {activeProfile.portfolio_url?.startsWith("https://")&&<a href={activeProfile.portfolio_url} target="_blank" rel="noopener noreferrer"><Link2 size={16}/><span>{(()=>{try{return new URL(activeProfile.portfolio_url as string).hostname}catch{return "Website"}})()}</span></a>}
            {activeProfile.created_at&&<span><CalendarDays size={16}/>Joined {new Date(activeProfile.created_at).toLocaleDateString("en",{month:"long",year:"numeric"})}</span>}
          </div>
          <div className="full-profile-stats">
            <span><strong>{followCounts[activeProfile.id]?.following ?? (activeProfile.id===me.id?followed.length:0)}</strong> Following</span>
            <span><strong>{followCounts[activeProfile.id]?.followers ?? 0}</strong> Followers</span>
          </div>
          {activeProfile.open_to_collab&&<button className="full-profile-collaboration" onClick={()=>activeProfile.id===me.id?openEdit():openCollab(activeProfile)}><Handshake size={16}/> Open to collaboration <ArrowRight size={15}/></button>}
          {blockedAuthors.includes(activeProfile.id)&&activeProfile.id!==me.id&&<div className="profile-info-note"><Ban size={17}/><span>Hidden on this device only.</span><button onClick={()=>toggleHidden(activeProfile)}>Unhide</button></div>}
        </section>
        <div className="full-profile-tabs" role="tablist" aria-label="Profile content">
          {(["posts","replies","media","likes"] as ProfileTab[]).map(t=><button key={t} role="tab" aria-selected={profileTab===t} className={profileTab===t?"selected":""} onClick={()=>setProfileTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>)}
        </div>
        {profileTab==="posts" && <>
          {sortedProfilePosts.length===0?<div className="empty-state"><Feather size={31}/><h3>No posts yet</h3><p>{activeProfile.id===me.id?"Create your first post to start sharing your story.":"Posts from this member will appear here."}</p></div>
          :sortedProfilePosts.map(p=><div key={p.id}>
            {activeProfile.pinned_post_id===p.id&&<div className="full-profile-pin-heading"><Pin size={14}/> Pinned</div>}
            {activeProfile.id===me.id&&<div className="full-profile-pin-actions"><button onClick={()=>void pinPost(p)}><Pin size={13}/>{activeProfile.pinned_post_id===p.id?"Unpin":"Pin to profile"}</button></div>}
            <PostCard {...postProps(p)}/>
          </div>)}
        </>}
        {profileTab==="replies" && <>
          {profileReplies.length ? profileReplies.map(reply=><button key={reply.id} className="full-profile-reply" onClick={()=>{const original=posts.find(p=>p.id===reply.post_id);if(original)void openThread(original);else notify("Original post isn't in the loaded feed.");}}>
              <Avatar profile={activeProfile} size="small"/>
              <span><strong>{activeProfile.display_name}</strong><small> · {timeAgo(reply.created_at)}</small><p>{reply.body}</p><em>View conversation <ArrowRight size={14}/></em></span>
            </button>) : <div className="empty-state"><MessageCircle size={30}/><h3>No replies yet</h3><p>Replies to posts will appear here.</p></div>}
        </>}
        {profileTab==="media" && <>
          {profileMedia.length ? <div className="full-profile-media-grid">{profileMedia.map(p=><button key={p.id} onClick={()=>openMedia(p)} aria-label={"View media in post by "+activeProfile.display_name}>{p.image_url?<img src={p.image_url} alt="Shared media" loading="lazy"/>:<span className="media-video-tile"><Video size={22}/> Video</span>}</button>)}</div>
          : <div className="empty-state"><ImagePlus size={30}/><h3>No photos yet</h3><p>Photos shared in posts will appear here.</p></div>}
        </>}
        {profileTab==="likes" && <>
          {activeProfile.id!==me.id
            ? <div className="empty-state"><Heart size={30}/><h3>Likes are private</h3><p>Only you can see posts you've liked on Blumbook.</p></div>
            :profileLikes.length?profileLikes.map(p=><PostCard {...postProps(p)}/>)
            :<div className="empty-state"><Heart size={30}/><h3>No liked posts yet</h3><p>Posts you like will be collected here.</p></div>}
        </>}
      </>}

      {view === "thread" && selectedPost && <>
        <PanelTitle onBack={()=>navigate("home")}>Post</PanelTitle><PostCard {...postProps(selectedPost)}/>
        <form className="reply-form" onSubmit={sendReply}><Avatar profile={me} size="small"/><input aria-label="Post a reply" value={replyText} onChange={(e)=>setReplyText(e.target.value)} placeholder="Post your reply" maxLength={500}/><button className="primary-btn" disabled={busy || !replyText.trim()}>Reply</button></form>
        {(comments[selectedPost.id]||[]).map((c)=><div className="reply-row" key={c.id}><Avatar profile={lookup(c.author_id)} size="small"/><div><strong>{lookup(c.author_id).display_name}</strong><small>@{lookup(c.author_id).username} · {timeAgo(c.created_at)}</small><p>{c.body}</p></div></div>)}
      </>}

      {view === "settings" && <section className={"settings-page "+(compactText?"settings-compact":"")}>
        <div className="settings-desktop-heading"><button className="settings-back" onClick={() => settingsPanel ? backFromSettings() : navigate("home")} aria-label="Go back"><ArrowLeft size={23}/></button><div><h1>{settingsPanel ? settingsConfig.find(s=>s.id===settingsPanel)?.title : "Settings"}</h1><span>@{me.username}</span></div></div>
        {!settingsPanel ? <>
          <div className="settings-search-wrap"><Search size={24}/><input aria-label="Search settings" value={settingsSearch} onChange={e=>setSettingsSearch(e.target.value)} placeholder="Search settings"/>{settingsSearch&&<button aria-label="Clear search" onClick={()=>setSettingsSearch("")}><X size={18}/></button>}</div>
          <div className="settings-menu-list">
            {filteredSettings.map(({id,title,description,Icon})=><button className="settings-directory-row" key={id} onClick={()=>{setSettingsPanel(id);window.scrollTo({top:0,behavior:"smooth"});}}><span className="settings-directory-icon"><Icon size={25} strokeWidth={1.85}/></span><span className="settings-directory-copy"><strong>{title}</strong><small>{description}</small></span><ArrowRight className="settings-chevron" size={17}/></button>)}
            {filteredSettings.length===0&&<div className="settings-search-empty"><Search size={26}/><strong>No matching settings</strong><small>Try searching for account, display, privacy or notifications.</small></div>}
          </div>
          <div className="settings-bottom"><span>Blumbook Preview · Version 0.1.0</span><small>Talk. Share. Bloom.</small></div>
        </> : <>
          <div className="settings-detail">
            {settingsPanel==="account"&&<>
              <h2>Account information</h2><p className="settings-description">Keep your Blumbook identity the way you want it.</p>
              <button className="settings-detail-row" onClick={openEdit}><UserRound size={22}/><span><strong>Edit your profile</strong><small>Change your name and bio</small></span><ArrowRight size={18}/></button>
              <button className="settings-detail-row" onClick={()=>openProfile(me.id)}><UsersRound size={22}/><span><strong>View your profile</strong><small>See your posts and public identity</small></span><ArrowRight size={18}/></button>
              <div className="settings-info-card"><strong>More data controls are being developed.</strong><p>Account archive downloads and deactivation require a secure account backend, so these actions are not available in this preview.</p></div>
            </>}
            {settingsPanel==="security"&&<>
              <h2>Security and account access</h2><p className="settings-description">Your account safety comes first.</p>
              <div className="settings-detail-row settings-static-row"><LockKeyhole size={22}/><span><strong>Authentication</strong><small>{isCloudEnabled?"Supabase authentication is connected.":"Real login is not enabled in demo mode."}</small></span></div>
              <div className="settings-detail-row settings-static-row"><ShieldCheck size={22}/><span><strong>Account protection</strong><small>Multi-factor authentication and active sessions will be managed when the security backend is ready.</small></span></div>
              <button className="settings-detail-row" onClick={()=>isCloudEnabled&&!cloudUserId?setAuthOpen(true):logOut()}><LogOut size={22}/><span><strong>{isCloudEnabled&&!cloudUserId?"Log in":"Log out"}</strong><small>Manage your current session</small></span><ArrowRight size={18}/></button>
            </>}
            {settingsPanel==="privacy"&&<>
              <h2>Privacy and safety</h2><p className="settings-description">Decide what you share and how you participate.</p>
              <div className="settings-detail-row settings-static-row"><UserRound size={22}/><span><strong>Post visibility</strong><small>Posts are public in this preview. Private accounts are planned.</small></span></div>
              <div className="settings-detail-row settings-static-row"><ShieldCheck size={22}/><span><strong>Block and report</strong><small>User blocking and content reporting are not available yet. These are required before public launch.</small></span></div>
              {mutedAuthors.length>0&&<div className="muted-accounts"><strong>Muted on this device</strong>{mutedAuthors.map(id=><div key={id}><span>{lookup(id).display_name}</span><button onClick={()=>{const v=mutedAuthors.filter(x=>x!==id);setMutedAuthors(v);window.localStorage.setItem("blumbook-muted",JSON.stringify(v));}}>Unmute</button></div>)}</div>}
              <div className="settings-info-card"><strong>Your privacy matters.</strong><p>Do not publish sensitive information while Blumbook is being tested. Privacy policies and moderation controls must be in place before public registration.</p></div>
            </>}
            {settingsPanel==="notifications"&&<>
              <h2>Notification preferences</h2><p className="settings-description">Personalize your in-app activity feed. These preferences are saved on this device.</p>
              {([["likes","Likes","When someone likes your post"],["follows","New followers","When someone starts following you"],["replies","Replies","When someone replies to your post"]] as [keyof typeof notifyPrefs,string,string][]).map(([key,title,description])=>
                <label className="settings-switch-row" key={key}><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" checked={notifyPrefs[key]} onChange={e=>setNotifyPrefs(p=>({...p,[key]:e.target.checked}))}/><span className="settings-switch-track" aria-hidden="true"/></label>
              )}
              <div className="settings-info-card"><strong>Preview mode</strong><p>These switches control sample notification categories only. Push notifications and email alerts are not enabled yet.</p></div>
            </>}
            {settingsPanel==="accessibility"&&<>
              <h2>Display</h2><p className="settings-description">Choose the appearance that feels right to you.</p>
              <div className="theme-choice-grid settings-theme-grid">
                <button aria-pressed={theme==="dark"} className={"theme-choice "+(theme==="dark"?"selected":"")} onClick={()=>setTheme("dark")}><div className="mini-theme-preview mini-dark"><i/><i/><i/><i/></div><span><Moon size={18}/> Dark {theme==="dark"&&<Check size={18}/>}</span></button>
                <button aria-pressed={theme==="light"} className={"theme-choice "+(theme==="light"?"selected":"")} onClick={()=>setTheme("light")}><div className="mini-theme-preview mini-light"><i/><i/><i/><i/></div><span><Sun size={18}/> Light {theme==="light"&&<Check size={18}/>}</span></button>
              </div>
              <p className="theme-helper">Your choice is remembered on this device.</p>
              <h2 className="settings-section-heading">Accessibility</h2>
              <label className="settings-switch-row"><span><strong>Larger interface text</strong><small>Increase readability in menus and settings</small></span><input type="checkbox" checked={compactText} onChange={e=>setCompactText(e.target.checked)}/><span className="settings-switch-track" aria-hidden="true"/></label>
              <label className="settings-language-row"><Languages size={22}/><span><strong>{tr("Language")}</strong><small>English / Hausa (beta; some screens still use English)</small></span><select aria-label="Language" value={language} onChange={e=>setLanguage(e.target.value as AppLanguage)}><option value="en">English</option><option value="ha">Hausa</option></select></label>
            </>}
            {settingsPanel==="resources"&&<>
              <h2>Additional resources</h2><p className="settings-description">Helpful information about Blumbook.</p>
              <button className="settings-detail-row" onClick={()=>navigate("help")}><CircleHelp size={22}/><span><strong>Help Center</strong><small>Frequently asked questions and guidance</small></span><ArrowRight size={18}/></button>
              <div className="settings-detail-row settings-static-row"><Link2 size={22}/><span><strong>About Blumbook</strong><small>Talk. Share. Bloom. · Preview 0.1.0</small></span></div>
              <div className="settings-info-card"><strong>Building with care</strong><p>This is an early-stage platform. Terms, privacy documentation and support processes will be published before public launch.</p></div>
            </>}
          </div>
          <div className="settings-bottom"><span>Blumbook Preview · Version 0.1.0</span><button onClick={backFromSettings}>Back to all settings</button></div>
        </>}
      </section>}

      {view === "premium" && <div className="feature-page">
        <PanelTitle>Blumbook Premium</PanelTitle>
        <div className="feature-hero"><Crown size={33}/><span className="feature-overline">SOMETHING EXCEPTIONAL</span><h2>More room for your<br/>best ideas.</h2><p>Premium is being designed for people who want to create, connect and grow with more possibilities.</p><span className="feature-status">Coming in a future release</span></div>
        <div className="feature-rows"><div><Sparkles size={22}/><span><strong>A refined creator experience</strong><small>More ways to publish and manage content</small></span></div><div><UsersRound size={22}/><span><strong>Stronger communities</strong><small>Build meaningful connections</small></span></div><div><ChartNoAxesCombined size={22}/><span><strong>Deeper insights</strong><small>Understand how your stories perform</small></span></div></div>
      </div>}

      {view === "lists" && <div className="feature-page">
        <PanelTitle>Lists</PanelTitle><div className="feature-intro"><div className="feature-icon"><List size={28}/></div><h2>Make space for what matters.</h2><p>Organize the people and conversations you care about. Your lists are private on this device for now.</p></div>
        <form className="simple-create" onSubmit={(e)=>{e.preventDefault();const name=listName.trim();if(!name||lists.includes(name))return;const next=[name,...lists];setLists(next);window.localStorage.setItem("blumbook-lists",JSON.stringify(next));setListName("");notify("List created on this device.");}}>
          <input aria-label="New list name" placeholder="Name your new list" maxLength={36} value={listName} onChange={(e)=>setListName(e.target.value)}/><button className="primary-btn" disabled={!listName.trim()}>Create</button>
        </form>
        {lists.length ? lists.map((item)=><div className="list-preview-row" key={item}><List size={22}/><div><strong>{item}</strong><small>Private list · Saved on this device</small></div><button className="icon-button" aria-label={"Delete "+item} onClick={()=>{const next=lists.filter(x=>x!==item);setLists(next);window.localStorage.setItem("blumbook-lists",JSON.stringify(next));}}><X size={17}/></button></div>) : <div className="feature-empty">Your lists will appear here when you create one.</div>}
      </div>}

      {view === "spaces" && <LiveSessions userId={cloudUserId} profiles={allPeople} onSignIn={()=>setAuthOpen(true)} launchCreate={liveLaunch}/>}

      {view === "creator" && <><CreatorStudioPlus posts={posts} me={me} onCompose={text=>openComposer("post",text||"")}/>
       <div className="studio-next-tools"><button onClick={()=>navigate("ai")}><Sparkles size={19}/> Blum AI <ArrowRight size={17}/></button><button onClick={()=>navigate("schedule")}><CalendarDays size={19}/> Scheduled posts <ArrowRight size={17}/></button><button onClick={()=>navigate("verification")}><ShieldCheck size={19}/> Verification & Earnings <ArrowRight size={17}/></button></div></>}

      {view === "help" && <div className="feature-page">
        <PanelTitle>Help Center</PanelTitle><div className="feature-intro"><div className="feature-icon"><CircleHelp size={28}/></div><h2>How can we help?</h2><p>Everything you need to get comfortable on Blumbook.</p></div>
        <div className="faq-list">
          <details><summary>How do I switch between Dark and Light Mode?</summary><p>Open your profile menu, find Appearance, and tap Dark or Light. Your choice is saved on this device.</p></details>
          <details><summary>How do I create a post?</summary><p>Tap the plus button or the Post button. Write your thought and add an image if you wish.</p></details>
          <details><summary>Are my posts saved?</summary><p>In demo mode, posts are temporary. When a Supabase project is connected, signed-in members can save posts to a shared database.</p></details>
          <details><summary>Are messages, AI and live broadcasting available?</summary><p>Real messages and AI need Supabase and API configuration. Live sessions use an external streaming link; native in-app broadcasting is not active.</p></details>
        </div>
      </div>}

    </main>

    <aside className="right-column">
      <div className="right-search"><Search size={19}/><input aria-label="Search" placeholder="Search Blumbook" value={query} onChange={(e)=>{setQuery(e.target.value);setView("explore");}}/></div>
      <section className="right-panel subscribe-panel"><h3>Welcome to Blumbook</h3><p>Meet new people, share your story and find your community.</p>{isCloudEnabled&&!cloudUserId?<button className="primary-btn" onClick={()=>{setSignUp(true);setAuthOpen(true);}}>Create your account</button>:<button className="primary-btn" onClick={()=>navigate("explore")}>Explore Blumbook</button>}</section>
      <section className="right-panel"><h3>What&apos;s happening</h3>{TRENDS.slice(0,4).map((t)=><button key={t.tag} className="right-trend" onClick={()=>{setQuery(t.tag.slice(1));navigate("explore");}}><small>{t.category}</small><strong>{t.tag}</strong><small>{t.posts}</small></button>)}<button className="panel-link" onClick={()=>navigate("explore")}>Show more</button></section>
      <section className="right-panel"><h3>Who to follow</h3>{people.filter((p)=>p.id!==me.id).slice(0,3).map((p)=><div className="suggestion" key={p.id}><button onClick={()=>openProfile(p.id)}><Avatar profile={p} size="small"/><span><strong>{p.display_name}</strong><small>@{p.username}</small></span></button><button className="follow-btn" onClick={()=>toggleFollow(p.id)}>{followed.includes(p.id)?"Following":"Follow"}</button></div>)}<button className="panel-link" onClick={()=>navigate("explore")}>Show more</button></section>
      <footer className="right-footer">About · Privacy · Terms · Accessibility<br/>© {new Date().getFullYear()} Blumbook. Talk. Share. Bloom.</footer>
    </aside>

    <nav className={"mobile-bottom "+(view==="settings"?"mobile-bottom-hidden":"")+(menuOpen?" bb-behind-menu":"")} aria-label="Main navigation">
      {NAV.filter((n)=>["home","explore","clips","notifications","messages"].includes(n.id)).map(({id,label,Icon})=><button aria-label={label} key={id} className={view===id?"active":""} onClick={()=>navigate(id)}><Icon size={25} strokeWidth={view===id?2.7:1.9}/>{id==="notifications"&&<span className="nav-dot"/>}</button>)}
    </nav>
    <button aria-label="Open creation menu" className={"floating-compose "+(view==="settings"?"floating-compose-hidden":"")+(menuOpen?" bb-behind-menu":"")} onClick={()=>setCreateMenuOpen(true)}><Plus size={28}/></button>
    {menuOpen && <button aria-label="Close menu" className="menu-shade" onClick={()=>setMenuOpen(false)}/>}
    {createMenuOpen&&<CreateMenu onClose={()=>setCreateMenuOpen(false)} onSelect={selectCreate}/>}
    {toast && <div role="status" className="toast">{toast}</div>}

    {mediaViewer&&<Modal close={()=>setMediaViewer(null)}><div className="media-dialog">
      <div className="media-dialog-head"><button onClick={()=>setMediaViewer(null)} aria-label="Close"><X size={21}/></button><strong>Blumbook Media</strong><button onClick={()=>{const p=mediaViewer;setMediaViewer(null);void openThread(p);}}><MessageCircle size={17}/> Conversation</button></div>
      <div className="media-dialog-main">{mediaViewer.video_url?<video key={mediaViewer.id} src={mediaViewer.video_url} controls autoPlay playsInline preload="metadata"/>:<img src={mediaViewer.image_url||""} alt="Shared media"/>}</div>
      <div className="media-dialog-foot"><button onClick={()=>nextMedia(-1)} disabled={mediaPosts.length<2}><ArrowLeft size={17}/> Previous</button><span>{lookup(mediaViewer.author_id).display_name}</span><button onClick={()=>nextMedia(1)} disabled={mediaPosts.length<2}>Next <ArrowRight size={17}/></button></div>
    </div></Modal>}
    {compose && <Modal close={()=>setCompose(false)}>
      <div className="dialog-head"><button className="icon-button" onClick={()=>setCompose(false)} aria-label="Close"><X size={22}/></button><strong>{composeMode==="video"?"Create video / clip":composeMode==="photo"?"Share a photo":"Create post"}</strong><button form="compose-form" className="primary-btn" disabled={busy||!postText.trim()||postText.length>500}>{busy?"Posting...":"Post"}</button></div>
      <form id="compose-form" onSubmit={submitPost}><div className="compose-body"><Avatar profile={me}/><div className="compose-fields"><span className="audience">🌐 Everyone</span><textarea autoFocus aria-label="Write a post" placeholder={composeMode==="video"?"Add a caption to your clip...":composeMode==="photo"?"Describe your photo...":"What\u0027s happening?"} rows={5} maxLength={500} value={postText} onChange={(e)=>setPostText(e.target.value)}/>{imagePreview&&<div className="preview-wrap"><img src={imagePreview} alt="Image preview"/><button type="button" onClick={()=>{setImageFile(null);setImagePreview("");}} aria-label="Remove image"><X size={19}/></button></div>}
      {videoPreview&&<div className="preview-wrap"><video src={videoPreview} controls playsInline/><button type="button" onClick={()=>{setVideoFile(null);setVideoPreview("");}} aria-label="Remove video"><X size={19}/></button></div>}</div></div><div className="compose-bottom"><button type="button" className="upload-action" title="Get AI writing help" onClick={()=>{setAiSeed(postText);setAiTask("caption");setCompose(false);navigate("ai");}}><Sparkles size={22}/></button><label className="upload-action" title="Attach photo"><ImagePlus size={22}/><input type="file" accept="image/*" onChange={pickImage} hidden/></label><label className="upload-action" title="Attach video"><Video size={22}/><input type="file" accept="video/mp4,video/webm" onChange={pickVideo} hidden/></label><span>500 chars · Images 5MB / Videos 30MB</span><strong className={postText.length>460?"warn-count":""}>{500-postText.length}</strong></div></form>
    </Modal>}

    {authOpen&&<Modal close={()=>setAuthOpen(false)}>
      <div className="auth-dialog"><button className="auth-close icon-button" aria-label="Close" onClick={()=>setAuthOpen(false)}><X size={22}/></button><img src="/logo.svg" alt="Blumbook"/><h2>{signUp?"Join Blumbook":"Welcome back"}</h2><p>{signUp?"Every story belongs here.":"Your community is waiting for you."}</p>
      {!isCloudEnabled&&<div className="demo-alert">Demo mode: account details are not sent to a server. Connect Supabase for real sign-in.</div>}
      <form onSubmit={authSubmit}>{signUp&&<label>Full name<input required value={authName} onChange={(e)=>setAuthName(e.target.value)} placeholder="Your name" /></label>}<label>Email<input type="email" required value={authEmail} onChange={(e)=>setAuthEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" minLength={6} required value={authPassword} onChange={(e)=>setAuthPassword(e.target.value)} placeholder="At least 6 characters"/></label><button disabled={busy} className="primary-btn full-btn">{busy?"Please wait...":signUp?"Create account":"Log in"}</button></form>
      <button className="auth-switch" onClick={()=>setSignUp(!signUp)}>{signUp?"Already have an account? Log in":"New to Blumbook? Sign up"}</button></div>
    </Modal>}


    {collabTarget&&<Modal close={()=>setCollabTarget(null)}>
      <div className="dialog-head"><button className="icon-button" onClick={()=>setCollabTarget(null)} aria-label="Close"><X size={20}/></button><strong>Collaborate with {collabTarget.display_name}</strong></div>
      <form className="profile-dialog-body" onSubmit={sendCollab}>
        <div className="profile-dialog-emblem"><Handshake size={26}/></div>
        <h3>Start something meaningful.</h3>
        <p>Invite this member to work on an idea, project, or mentorship opportunity.</p>
        {!collabTarget.open_to_collab&&<div className="profile-info-note">This member has not enabled collaboration requests. You can preview the form, but cannot deliver a request.</div>}
        {!isCloudEnabled&&<div className="profile-info-note">Demo only: this request will not be delivered to anyone.</div>}
        <label>I'm interested in<select value={collabKind} onChange={e=>setCollabKind(e.target.value)}>{["Project","Mentorship","Business","Creative work"].map(k=><option key={k}>{k}</option>)}</select></label>
        <label>Message<textarea required rows={5} minLength={10} maxLength={500} placeholder="Introduce yourself and describe how you'd like to collaborate..." value={collabMessage} onChange={e=>setCollabMessage(e.target.value)}/></label>
        <button disabled={busy||collabMessage.trim().length<10||(isCloudEnabled&&!collabTarget.open_to_collab)} className="primary-btn">{!isCloudEnabled?"Preview request":"Send collaboration request"}</button>
      </form>
    </Modal>}
    {profileReport&&<Modal close={()=>setProfileReport(null)}>
      <div className="dialog-head"><button className="icon-button" onClick={()=>setProfileReport(null)} aria-label="Close"><X size={21}/></button><strong>Report @{profileReport.username}</strong></div>
      <form className="profile-dialog-body" onSubmit={submitProfileReport}>
        <div className="profile-dialog-emblem"><Flag size={25}/></div>
        <h3>Help keep Blumbook safe.</h3>
        <p>Choose the main reason. Reports are private, but a staffed review team is not operational yet.</p>
        <label>Reason<select value={reportReason} onChange={e=>setReportReason(e.target.value)}>{["Spam","Harassment","Hate","Violence","Impersonation","Other"].map(x=><option key={x}>{x}</option>)}</select></label>
        {(!isCloudEnabled||!cloudUserId)&&<div className="profile-info-note">Reporting requires a signed-in account and the Phase 3 database migration.</div>}
        <button className="primary-btn" disabled={busy||!isCloudEnabled||!cloudUserId}>Submit report</button>
      </form>
    </Modal>}
    {blockTarget&&<Modal close={()=>setBlockTarget(null)}>
      <div className="dialog-head"><button className="icon-button" onClick={()=>setBlockTarget(null)} aria-label="Close"><X size={21}/></button><strong>{blockedAuthors.includes(blockTarget.id)?"Unhide account":"Hide account"}</strong></div>
      <div className="profile-dialog-body"><div className="profile-dialog-emblem"><Ban size={25}/></div><h3>{blockedAuthors.includes(blockTarget.id)?"Show this account?":"Hide this account from your feed?"}</h3>
        <p>This is a <strong>device-only preview</strong>. It does not prevent this person from seeing your public posts or contacting you. Account-level blocking will require additional backend safeguards.</p>
        <div className="profile-dialog-controls"><button className="profile-action-secondary" onClick={()=>setBlockTarget(null)}>Cancel</button><button className="primary-btn" onClick={()=>toggleHidden(blockTarget)}>{blockedAuthors.includes(blockTarget.id)?"Unhide":"Hide locally"}</button></div>
      </div>
    </Modal>}
    {editProfile&&<Modal close={()=>setEditProfile(false)}>
      <div className="dialog-head"><button className="icon-button" onClick={()=>setEditProfile(false)} aria-label="Close"><X size={22}/></button><strong>Edit profile</strong><button form="edit-profile-form" className="primary-btn" disabled={busy}>{busy?"Saving...":"Save"}</button></div>
      <form id="edit-profile-form" onSubmit={saveProfile} className="edit-form full-profile-edit">
        <div className="edit-banner edit-cover-preview">
          {editBannerPreview&&<img src={editBannerPreview} alt="Cover preview"/>}
          <label className="edit-cover-upload"><ImagePlus size={18}/><span>Change cover</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>pickProfileImage(e,"banner")} hidden/></label>
        </div>
        <div className="edit-avatar-options">
          <Avatar profile={{...me,avatar_url:editAvatarPreview||me.avatar_url}} size="large"/>
          <label><ImagePlus size={17}/> Change profile photo<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>pickProfileImage(e,"avatar")} hidden/></label>
        </div>
        <label>Name<input required maxLength={50} value={editName} onChange={e=>setEditName(e.target.value)}/></label>
        <label>Bio<textarea maxLength={160} rows={3} value={editBio} onChange={e=>setEditBio(e.target.value)}/></label>
        <label>Location (optional)<input maxLength={90} placeholder="City, country" value={editLocation} onChange={e=>setEditLocation(e.target.value)}/></label>
        <label>Professional headline<input maxLength={90} placeholder="Creator · Builder · Entrepreneur" value={editHeadline} onChange={e=>setEditHeadline(e.target.value)}/></label>
        <label>Skills (comma-separated)<input maxLength={230} value={editSkills} onChange={e=>setEditSkills(e.target.value)}/></label>
        <label>Website / portfolio (https://)<input maxLength={300} inputMode="url" value={editPortfolio} onChange={e=>setEditPortfolio(e.target.value)}/></label>
        <label className="profile-collab-edit"><input type="checkbox" checked={editAvailable} onChange={e=>setEditAvailable(e.target.checked)}/><span><strong>Open to collaboration</strong><small>Let other members contact you about opportunities.</small></span></label>
        <p className="edit-photo-note">Images: JPG, PNG, WebP or GIF, up to 5 MB. Changes in demo mode are temporary.</p>
      </form>
    </Modal>}
  </div>;

  function personRow(p: Profile) {
    return <div className="person-row" key={p.id}><button onClick={()=>openProfile(p.id)}><Avatar profile={p}/><span><Name profile={p}/><small>@{p.username}</small><p>{p.bio}</p></span></button><button className="follow-btn" onClick={()=>toggleFollow(p.id)}>{followed.includes(p.id)?"Following":"Follow"}</button></div>;
  }
  function communityCards() {
    return <div className="community-list">{COMMUNITIES.map((c)=><div key={c.title} className="community-card"><div className="community-icon">{c.icon}</div><div><strong>{c.title}</strong><small>{c.members}</small><p>{c.description}</p></div><button className={joined.includes(c.title)?"outline-btn":"follow-btn"} onClick={()=>setJoined((prev)=>prev.includes(c.title)?prev.filter((x)=>x!==c.title):[...prev,c.title])}>{joined.includes(c.title)?"Joined":"Join"}</button></div>)}</div>;
  }
}
