"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, Bell, Bookmark, Check, CheckCircle2, ChevronDown, Compass, Ellipsis,
  Feather, Heart, Home, ImagePlus, LogIn, LogOut, Mail, Menu, MessageCircle, MoreHorizontal,
  Plus, Repeat2, Search, Send, Settings, Share2, ShieldCheck, Smile, Sparkles, Sun, Moon, Crown, List, Radio, ChartNoAxesCombined, CircleHelp, CalendarDays, Wallet, Vote, FilePenLine, MapPin, Pin, UserRound,
  UserRoundPlus, UsersRound, Accessibility, Link2, LockKeyhole, Languages, Download, Type, Handshake, Ban, Flag, Copy, Video, Play, type LucideIcon, X
} from "lucide-react";
import {supabase as configuredSupabase,isCloudEnabled as configuredCloudEnabled} from "@/lib/supabase";
import {SHOWCASE_POSTS,SHOWCASE_PEOPLE,SHOWCASE_COMMENTS_BY_POST,SHOWCASE_COMMENT_METRICS} from "@/lib/demo-showcase";
import BloomCircles from "@/components/BloomCircles";
import OpportunityHub from "@/components/OpportunityHub";
import DirectInbox from "@/components/DirectInbox";
import NotificationsPanel from "@/components/NotificationsPanel";
import CreatorStudioPlus from "@/components/CreatorStudioPlus";
import BlumClips from "@/components/BlumClips";
import ImmersiveVideoViewer from "@/components/ImmersiveVideoViewer";
import CommentCard from "@/components/CommentCard";
import LikeBurst from "@/components/LikeBurst";
import StoriesRail from "@/components/StoriesRail";
import PollsPanel from "@/components/PollsPanel";
import LiveSessions from "@/components/LiveSessions";
import CreateMenu from "@/components/CreateMenu";
import CreatorAccess from "@/components/CreatorAccess";
import BlumAI from "@/components/BlumAI";
import ScheduledPosts from "@/components/ScheduledPosts";
import {translate,type AppLanguage} from "@/lib/locale";
import {
  COMMUNITIES, DEMO_ME, DEMO_NOTICES, TRENDS,
  shortCount, timeAgo, type Post, type Profile, type Notice,
} from "@/lib/demo";

type View = "home" | "explore" | "notifications" | "messages" | "profile" | "communities" | "bookmarks" | "settings" | "thread" | "premium" | "lists" | "creator" | "help" | "opportunities" | "clips" | "polls" | "live" | "ai" | "verification" | "schedule" | "planner" | "earnings" | "stories";
type Theme = "dark" | "light";
type SettingsPanel = "account" | "security" | "privacy" | "notifications" | "accessibility" | "resources";
type ProfileTab = "posts" | "replies" | "media" | "likes";
type Comment = { id: string; post_id: string; author_id: string; body: string; created_at: string; parent_comment_id?:string|null };
type CommentMetric = {likes:number;reposts:number;liked:boolean;reposted:boolean;bookmarked:boolean};
type ChatMessage = { id: string; sender: "me" | "them"; text: string; time: string };
const NAV: { id: View; label: string; Icon: LucideIcon }[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "explore", label: "Explore", Icon: Search },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "messages", label: "Messages", Icon: Mail },
  { id: "communities", label: "Communities", Icon: UsersRound },
  { id: "opportunities", label: "Opportunities", Icon: Handshake },
  { id: "clips", label: "Blum Clips", Icon: Play },
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
  post, author, onLike, onRepost, onBookmark, onReply, onOpen, onProfile, onShare, onMute, onReport, onViewVideo, onTranslate, isDemo,
}: {
  post: Post; author: Profile; onLike: (post: Post) => void; onRepost: (post: Post) => void;
  onBookmark: (post: Post) => void; onReply: (post: Post) => void; onOpen:(post:Post)=>void; isDemo:boolean;
  onProfile: (id: string) => void; onShare: (post: Post) => void;
  onMute:(id:string)=>void;onReport:(post:Post,reason:string)=>void;onViewVideo:(post:Post)=>void;onTranslate:(post:Post)=>void;
}) {
  const [options,setOptions]=useState(false);
  return <article className="post-card" onClick={e=>{const el=e.target;if(el instanceof Element&&!el.closest("button,a,input,textarea,select"))onOpen(post);}}>
    <button className="post-avatar" aria-label={"View profile of "+author.display_name} onClick={()=>onProfile(author.id)}><Avatar profile={author}/></button>
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
      <button className="post-body post-body-open" aria-label="Open post conversation" onClick={()=>onOpen(post)}>{post.body}</button><button className="post-translate-link" onClick={()=>onTranslate(post)}><Languages size={14}/> Translate / Blum AI</button>
      {post.image_url&&<button className="post-image-wrap" aria-label="Open post details" onClick={()=>onOpen(post)}><img className="post-image" src={post.image_url} alt="Image in this post" loading="lazy"/></button>}{post.video_url&&<button className="post-video-preview" aria-label="Watch video" onClick={()=>onViewVideo(post)}><video src={post.video_url} preload="metadata" muted playsInline/><span><Play size={21}/> Watch video</span></button>}
      <div className="post-actions">
        <button aria-label="Reply" onClick={() => onReply(post)}><MessageCircle size={18}/><span>{shortCount(post.replies)}</span></button>
        <button className={post.reposted ? "reposted" : ""} aria-label="Repost" onClick={() => onRepost(post)}><Repeat2 size={18}/><span>{shortCount(post.reposts)}</span></button>
        <button className={post.liked ? "liked" : ""} aria-label={post.liked?"Unlike post":"Like post"} onClick={() => onLike(post)}><LikeBurst liked={Boolean(post.liked)} size={18}/><span>{shortCount(post.likes)}</span></button>
        {isDemo&&<button aria-label="Sample views (demo only)" onClick={() => onReply(post)}><span className="view-icon">▥</span><span>{shortCount(post.views)}</span></button>}
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

export default function BlumbookApp({forceDemo=false}:{forceDemo?:boolean}={}) {
  // Sandbox mode replaces the cloud client for the entire app. No demo action writes to production tables.
  const supabase=forceDemo?null:configuredSupabase;
  const isCloudEnabled=forceDemo?false:configuredCloudEnabled;
  const [view, setView] = useState<View>("home");
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
  const menuLabel=(en:string,ha:string)=>language==="ha"?ha:en;
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
  const [threadReturnView,setThreadReturnView]=useState<View>("home");
  const [replyOrder,setReplyOrder]=useState<"recent"|"oldest">("recent");
  const [threadLoading,setThreadLoading]=useState(false);
  const [threadError,setThreadError]=useState("");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>(forceDemo?SHOWCASE_POSTS:[]);
  const [people, setPeople] = useState<Profile[]>(forceDemo?SHOWCASE_PEOPLE:[]);
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
  const [comments, setComments] = useState<Record<string, Comment[]>>(forceDemo?SHOWCASE_COMMENTS_BY_POST:{});
  const [commentMetrics,setCommentMetrics]=useState<Record<string,CommentMetric>>(forceDemo?SHOWCASE_COMMENT_METRICS:{});
  const [commentFeaturesReady,setCommentFeaturesReady]=useState(!configuredCloudEnabled||forceDemo);
  const [replyingTo,setReplyingTo]=useState<Comment|null>(null);
  const handledCommentLink=useRef<string|null>(null);
  const [expandedCommentThreads,setExpandedCommentThreads]=useState<Record<string,boolean>>({});
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
  const [navHidden,setNavHidden] = useState(false);
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
  useEffect(()=>{
    const scrollingPages=["home","explore","profile","thread","bookmarks","opportunities"].includes(view);
    if(!scrollingPages||menuOpen||createMenuOpen||compose||mediaViewer){
      setNavHidden(false);
      return;
    }
    let previousY=window.scrollY;
    let travel=0;
    let idleTimer:ReturnType<typeof setTimeout>|undefined;
    const onScroll=()=>{
      const y=Math.max(0,window.scrollY);
      const delta=y-previousY;previousY=y;
      if(y<85){travel=0;setNavHidden(false);}
      else if(Math.abs(delta)>1){
        if((delta>0&&travel<0)||(delta<0&&travel>0))travel=0;
        travel+=delta;
        if(travel>25){setNavHidden(true);travel=0;}
        if(travel< -17){setNavHidden(false);travel=0;}
      }
      if(idleTimer)clearTimeout(idleTimer);
      idleTimer=setTimeout(()=>setNavHidden(false),1100);
    };
    window.addEventListener("scroll",onScroll,{passive:true});
    return()=>{
      window.removeEventListener("scroll",onScroll);
      if(idleTimer)clearTimeout(idleTimer);
    };
  },[view,menuOpen,createMenuOpen,compose,mediaViewer]);

  const navigate = (target: View) => { setNavHidden(false); setProfileMore(false); if(target!=="profile" && typeof window!=="undefined" && new URLSearchParams(window.location.search).has("profile")){const url=new URL(window.location.href);url.searchParams.delete("profile");window.history.replaceState({},"",url.pathname+url.search);} setView(target); if (target === "settings") { setSettingsPanel(null); setSettingsSearch(""); } setMenuOpen(false); setChatWith(null); window.scrollTo({ top: 0, behavior:"smooth" }); };
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
    if(action==="story"){navigate("stories");setStoryLaunch(k=>k+1);return;}
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
  const loadCommentConversation = async (postId:string)=>{
    if(!supabase)return;
    setThreadError("");
    setThreadLoading(true);
    try{
      const enhanced=await supabase.from("comments").select("id,post_id,author_id,body,created_at,parent_comment_id").eq("post_id",postId).order("created_at");
      const canNest=!enhanced.error;
      const fallback=canNest?null:await supabase.from("comments").select("id,post_id,author_id,body,created_at").eq("post_id",postId).order("created_at");
      const rows=((canNest?enhanced.data:fallback?.data)||[]) as Comment[];
      if(!canNest&&fallback?.error){setThreadError("Replies could not be loaded. Try again.");return;}
      setComments(old=>({...old,[postId]:rows}));
      const ids=rows.map(row=>row.id);
      if(!canNest||ids.length===0){setCommentFeaturesReady(canNest);return;}
      const results=await Promise.all([
        supabase.from("comment_likes").select("comment_id,user_id").in("comment_id",ids).limit(5000),
        supabase.from("comment_reposts").select("comment_id,user_id").in("comment_id",ids).limit(5000),
        supabase.from("comment_bookmarks").select("comment_id,user_id").in("comment_id",ids).limit(5000),
      ]);
      if(results.some(result=>result.error)){setCommentFeaturesReady(false);return;}
      const next:Record<string,CommentMetric>={};
      ids.forEach(id=>{next[id]={likes:0,reposts:0,liked:false,reposted:false,bookmarked:false};});
      for(const row of results[0].data||[]){const item=next[row.comment_id];if(item){item.likes++;if(row.user_id===cloudUserId)item.liked=true;}}
      for(const row of results[1].data||[]){const item=next[row.comment_id];if(item){item.reposts++;if(row.user_id===cloudUserId)item.reposted=true;}}
      for(const row of results[2].data||[]){const item=next[row.comment_id];if(item&&row.user_id===cloudUserId)item.bookmarked=true;}
      setCommentMetrics(old=>({...old,...next}));
      setCommentFeaturesReady(true);
    }catch{setThreadError("Replies could not be loaded. Try again.");}
    finally{setThreadLoading(false);}
  };
  const openThread = async (post: Post) => {
    if(view!=="thread")setThreadReturnView(view);
    setThreadId(post.id);setReplyOrder("recent");setReplyText("");setReplyingTo(null);
    setExpandedCommentThreads({});
    navigate("thread");
    await loadCommentConversation(post.id);
  };
  const replyToComment=(comment:Comment)=>{
    setReplyingTo(comment);
    setReplyText("");
    window.requestAnimationFrame(()=>document.getElementById("thread-reply-input")?.focus());
  };
  const commentAction=async(comment:Comment,kind:"likes"|"reposts"|"bookmarks")=>{
    if(!requireAccount())return;
    if(supabase&&!commentFeaturesReady){notify("Comment reactions need the Supabase comment-interactions migration.");return;}
    const current=commentMetrics[comment.id]||{likes:0,reposts:0,liked:false,reposted:false,bookmarked:false};
    const flag=kind==="likes"?"liked":kind==="reposts"?"reposted":"bookmarked";
    const undo=current[flag];
    const next={...current,[flag]:!undo,...(kind==="likes"?{likes:Math.max(0,current.likes+(undo?-1:1))}:kind==="reposts"?{reposts:Math.max(0,current.reposts+(undo?-1:1))}:{})};
    setCommentMetrics(prev=>({...prev,[comment.id]:next}));
    if(supabase&&cloudUserId){
      const table=kind==="likes"?"comment_likes":kind==="reposts"?"comment_reposts":"comment_bookmarks";
      const request=undo?supabase.from(table).delete().eq("comment_id",comment.id).eq("user_id",cloudUserId):
       supabase.from(table).insert({comment_id:comment.id,user_id:cloudUserId});
      const {error}=await request;
      if(error){setCommentMetrics(prev=>({...prev,[comment.id]:current}));notify("Could not save comment action. Check the comment-interactions migration.");}
    }
  };
  const shareComment=async(comment:Comment)=>{
    const url=window.location.origin+(forceDemo?"/demo":"/")+"?post="+encodeURIComponent(comment.post_id)+"&comment="+encodeURIComponent(comment.id);
    try{
      if(navigator.share){await navigator.share({title:"Blumbook comment",url});return;}
      await navigator.clipboard.writeText(url);notify("Comment link copied.");
    }catch(error){
      if(error instanceof DOMException&&error.name==="AbortError")return;
      try{await navigator.clipboard.writeText(url);notify("Comment link copied.");}
      catch{window.prompt("Copy comment link",url);}
    }
  };
  const sendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!threadId || !replyText.trim() || !requireAccount() || busy) return;
    if (replyingTo&&supabase&&!commentFeaturesReady){notify("Nested replies need the Supabase comment-interactions migration.");return;}
    const body = replyText.trim();
    // MVP supports one nested level: replying to a nested comment attaches to its parent.
    const parent=replyingTo?(replyingTo.parent_comment_id||replyingTo.id):null;
    setBusy(true);
    if (supabase && cloudUserId) {
      const values={post_id:threadId,author_id:cloudUserId,body,...(parent?{parent_comment_id:parent}:{})};
      const {error}=await supabase.from("comments").insert(values);
      if(error)notify(error.message);
      else {
        await loadCommentConversation(threadId);
        setPosts(prev=>prev.map(p=>p.id===threadId?{...p,replies:p.replies+1}:p));
        setReplyText("");setReplyingTo(null);
        if(parent)setExpandedCommentThreads(prev=>({...prev,[parent]:true}));
      }
    }else{
      const item: Comment={id:"demo-reply-"+crypto.randomUUID(),post_id:threadId,author_id:me.id,body,created_at:new Date().toISOString(),parent_comment_id:parent};
      setComments(prev=>({...prev,[threadId]:[...(prev[threadId]||[]),item]}));
      setPosts(prev=>prev.map(p=>p.id===threadId?{...p,replies:p.replies+1}:p));
      setReplyText("");setReplyingTo(null);
      if(parent)setExpandedCommentThreads(prev=>({...prev,[parent]:true}));
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
    const url = window.location.origin + (forceDemo?"/demo":"/") + "?post=" + encodeURIComponent(post.id);
    try { await navigator.clipboard.writeText(url); notify("Link copied to clipboard"); }
    catch { notify("Share this post: " + url); }
  };
  const activeProfile = lookup(selectedProfile === "demo-me" ? me.id : selectedProfile);
  const selectedPost = posts.find((p) => p.id === threadId);
  const profilePosts=posts.filter(p=>p.author_id===activeProfile.id);
  const sortedProfilePosts=[...profilePosts].sort((a,b)=>Number(b.id===activeProfile.pinned_post_id)-Number(a.id===activeProfile.pinned_post_id));
  useEffect(()=>{
    if(view!=="thread"||!threadId||threadLoading)return;
    const commentId=new URLSearchParams(window.location.search).get("comment");
    if(!commentId||handledCommentLink.current===commentId)return;
    const target=(comments[threadId]||[]).find(c=>c.id===commentId);
    if(!target)return;
    if(target.parent_comment_id&&!expandedCommentThreads[target.parent_comment_id]){
      setExpandedCommentThreads(prev=>({...prev,[target.parent_comment_id!]:true}));
      return;
    }
    const handle=window.setTimeout(()=>{
      document.getElementById("comment-"+commentId)?.scrollIntoView({behavior:"smooth",block:"center"});
      handledCommentLink.current=commentId;
    },90);
    return()=>window.clearTimeout(handle);
  },[view,threadId,threadLoading,comments,expandedCommentThreads]);
  const profileReplies=Object.values(comments).flat().filter(c=>c.author_id===activeProfile.id).sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime());
  const profileMedia=profilePosts.filter(p=>Boolean(p.image_url||p.video_url));
  const profileLikes=activeProfile.id===me.id?posts.filter(p=>p.liked):[];
  useEffect(()=>{
    const slug=new URLSearchParams(window.location.search).get("profile");
    if(!slug)return;
    const person=allPeople.find(p=>p.username.toLowerCase()===slug.toLowerCase());
    if(person){setSelectedProfile(person.id);setView("profile");}
  },[allPeople]);
  const filteredPosts = posts.filter(p=>!blockedAuthors.includes(p.author_id)&&!mutedAuthors.includes(p.author_id));
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
  const renderComment=(c:Comment,depth=0,children?:ReactNode)=>{
    const author=lookup(c.author_id);
    const metric=commentMetrics[c.id]||{likes:0,reposts:0,liked:false,reposted:false,bookmarked:false};
    const childCount=(comments[c.post_id]||[]).filter(r=>r.parent_comment_id===c.id).length;
    const sampleViews=!isCloudEnabled&&c.id.startsWith("showcase-")
      ? 46+c.id.split("").reduce((n,ch)=>n+ch.charCodeAt(0),0)%930
      : undefined;
    return <CommentCard key={c.id} comment={c} author={author} depth={depth} childCount={childCount}
      liked={metric.liked} reposted={metric.reposted} bookmarked={metric.bookmarked}
      likeCount={metric.likes} repostCount={metric.reposts} viewCount={sampleViews}
      onProfile={openProfile} onReply={replyToComment}
      onLike={item=>void commentAction(item,"likes")}
      onRepost={item=>void commentAction(item,"reposts")}
      onBookmark={item=>void commentAction(item,"bookmarks")}
      onShare={item=>void shareComment(item)}
      onMute={mute}>{children}</CommentCard>;
  };
  const postProps = (p: Post) => ({ key:p.id, post:p, isDemo:!isCloudEnabled, author:lookup(p.author_id), onLike:toggleLike, onRepost:toggleRepost, onBookmark:toggleBookmark, onReply:openThread, onOpen:openThread, onProfile:openProfile, onShare:share,onMute:mute,onReport:report,onViewVideo:openVideo,onTranslate:(post:Post)=>{setAiSeed(post.body);setAiTask("translate");navigate("ai");} });
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
  // Photos remain in the post-detail conversation; only real video content opens the immersive player.
  const openVideo=(post:Post)=>{if(post.video_url)setMediaViewer(post);};
  const nextVideo=(offset:-1|1)=>{
    if(!mediaViewer)return;
    const videos=posts.filter(p=>Boolean(p.video_url)&&!blockedAuthors.includes(p.author_id));
    if(videos.length<2)return;
    const index=videos.findIndex(p=>p.id===mediaViewer.id);
    if(index>=0)setMediaViewer(videos[(index+offset+videos.length)%videos.length]);
  };
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
  const inviteFriends=async()=>{
    setMenuOpen(false);
    const url=window.location.origin;
    try{
      if(navigator.share){await navigator.share({title:"Join Blumbook",text:"Talk. Share. Bloom.",url});return;}
      await navigator.clipboard.writeText(url);notify("Invitation link copied.");
    }catch(error){
      if(error instanceof DOMException && error.name==="AbortError")return;
      try{await navigator.clipboard.writeText(url);notify("Blumbook link copied.");}
      catch{window.prompt("Copy your Blumbook invitation link:",url);}
    }
  };

  return <div className={"app-shell "+(compactText?"large-type":"")}>
    <aside className={"sidebar " + (menuOpen ? "sidebar-open" : "")} aria-label="Blumbook navigation">
      <div className="desktop-sidebar">
        <button className="brand-button" onClick={() => navigate("home")} aria-label="Blumbook home"><Brand /></button>
        <nav className="side-nav">{NAV.filter(({id})=>["home","explore","clips","notifications","messages","bookmarks","communities","opportunities","polls","creator"].includes(id)).map(({ id, label, Icon }) => <button key={id} className={"side-link " + (view === id ? "active" : "")} onClick={() => id==="profile"?openProfile(me.id):navigate(id)}><Icon size={24} strokeWidth={view === id ? 2.5 : 1.85}/><span>{label}</span>{id === "notifications" && <i className="notification-pip"/>}</button>)}</nav>
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
          <button className="simple-drawer-account" aria-label="View your profile" aria-current={view==="profile"&&activeProfile.id===me.id?"page":undefined} onClick={()=>openProfile(me.id)}>
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
            <section className="simple-drawer-section" aria-label="Your space">
              <h3 className="simple-drawer-section-title">{menuLabel("YOUR SPACE","NAKA")}</h3>
              <button aria-current={view==="profile"&&activeProfile.id===me.id?"page":undefined} onClick={()=>openProfile(me.id)}><UserRound size={21}/><span>{menuLabel("My Profile","Bayanan kaina")}</span></button>
              <button aria-current={view==="bookmarks"?"page":undefined} onClick={()=>navigate("bookmarks")}><Bookmark size={21}/><span>{tr("Bookmarks")}</span></button>
              <button aria-current={view==="planner"?"page":undefined} onClick={()=>navigate("planner")}><FilePenLine size={21}/><span>{menuLabel("Drafts & Scheduled Posts","Rubutun ajiya da jadawali")}</span></button>
              <button aria-current={view==="lists"?"page":undefined} onClick={()=>navigate("lists")}><List size={21}/><span>{menuLabel("My Lists","Jerin abubuwana")}</span></button>
            </section>
            <section className="simple-drawer-section" aria-label="Community and discovery">
              <h3 className="simple-drawer-section-title">{menuLabel("COMMUNITY & DISCOVERY","AL’UMMA DA BINCIKE")}</h3>
              <button aria-current={view==="communities"?"page":undefined} onClick={()=>navigate("communities")}><UsersRound size={21}/><span>Bloom Circles</span></button>
              <button aria-current={view==="opportunities"?"page":undefined} onClick={()=>navigate("opportunities")}><Handshake size={21}/><span>Bloom Opportunities</span></button>
              <button aria-current={view==="clips"?"page":undefined} onClick={()=>navigate("clips")}><Play size={21}/><span>Blum Clips</span></button>
              <button aria-current={view==="stories"?"page":undefined} onClick={()=>navigate("stories")}><ImagePlus size={21}/><span>{menuLabel("Stories","Labarai")}</span></button>
              <button aria-current={view==="live"?"page":undefined} onClick={()=>navigate("live")}><Radio size={21}/><span>Live Sessions</span></button>
              <button aria-current={view==="polls"?"page":undefined} onClick={()=>navigate("polls")}><Vote size={21}/><span>Polls</span></button>
            </section>
            <section className="simple-drawer-section" aria-label="Creator tools">
              <h3 className="simple-drawer-section-title">{menuLabel("CREATOR TOOLS","KAYAN MASU ƘIRƘIRA")}</h3>
              <button aria-current={view==="creator"?"page":undefined} onClick={()=>navigate("creator")}><ChartNoAxesCombined size={21}/><span>{tr("Creator Studio")}</span></button>
              <button aria-current={view==="ai"?"page":undefined} onClick={()=>navigate("ai")}><Sparkles size={21}/><span>Blum AI</span></button>
              <button aria-current={view==="verification"||view==="premium"?"page":undefined} onClick={()=>navigate("verification")}><ShieldCheck size={21}/><span>{menuLabel("Verification & Premium","Tabbatarwa da Premium")}</span></button>
              <button aria-current={view==="earnings"?"page":undefined} onClick={()=>navigate("earnings")}><Wallet size={21}/><span>{menuLabel("Creator Earnings","Kuɗin masu ƙirƙira")}</span><small className="simple-drawer-beta">{menuLabel("Planned","Ana shiryawa")}</small></button>
            </section>
            <section className="simple-drawer-section" aria-label="Account and support">
              <h3 className="simple-drawer-section-title">{menuLabel("ACCOUNT & SUPPORT","ASUSU DA TAIMAKO")}</h3>
              <button aria-current={view==="settings"&&!settingsPanel?"page":undefined} onClick={()=>navigate("settings")}><Settings size={21}/><span>{tr("Settings")}</span></button>
              <button aria-current={view==="settings"&&settingsPanel==="privacy"?"page":undefined} onClick={()=>{navigate("settings");setSettingsPanel("privacy");}}><ShieldCheck size={21}/><span>{menuLabel("Privacy & Safety","Sirri da tsaro")}</span></button>
              <button aria-current={view==="help"?"page":undefined} onClick={()=>navigate("help")}><CircleHelp size={21}/><span>{tr("Help Center")}</span></button>
              <button onClick={()=>void inviteFriends()}><UserRoundPlus size={21}/><span>{menuLabel("Invite Friends","Gayyaci abokai")}</span></button>
            </section>
          </nav>
          <section className="simple-drawer-preferences">
            <div className="simple-drawer-preference-title"><Moon size={19}/><span>{tr("Appearance")}</span></div>
            <div className="simple-drawer-themes" role="group" aria-label="Appearance">
              <button aria-pressed={theme==="dark"} className={theme==="dark"?"selected":""} onClick={()=>setTheme("dark")}><Moon size={16}/>{tr("Dark")}</button>
              <button aria-pressed={theme==="light"} className={theme==="light"?"selected":""} onClick={()=>setTheme("light")}><Sun size={16}/>{tr("Light")}</button>
            </div>
            <label className="simple-drawer-language"><span><Languages size={19}/>{tr("Language")}</span>
              <select aria-label="Language" value={language} onChange={e=>setLanguage(e.target.value as AppLanguage)}><option value="en">English</option><option value="ha">Hausa</option></select>
            </label>
          </section>
          <button className="simple-drawer-session" onClick={()=>((isCloudEnabled&&!cloudUserId)||(!isCloudEnabled&&!demoSignedIn))?(setMenuOpen(false),setSignUp(false),setAuthOpen(true)):void logOut()}>
            {((isCloudEnabled&&!cloudUserId)||(!isCloudEnabled&&!demoSignedIn))?<LogIn size={20}/>:<LogOut size={20}/>}
            <span>{((isCloudEnabled&&!cloudUserId)||(!isCloudEnabled&&!demoSignedIn))?tr("Log in"):tr("Log out")}</span>
          </button>
          <p className="simple-drawer-footer">Blumbook · Preview v0.1</p>
        </div>
      </div>
    </aside>

    <main className="main-column">
      <div className={"mobile-topbar " + (view === "settings" ? "mobile-topbar-settings" : "") + (view==="clips" ? " mobile-topbar-clips" : "") + (view==="thread" ? " mobile-topbar-thread" : "")}>
        {view === "settings" ? <>
          <button className="icon-button" onClick={() => settingsPanel ? setSettingsPanel(null) : navigate("home")} aria-label="Back"><ArrowLeft size={25}/></button>
          <div className="mobile-settings-heading"><strong>{settingsPanel ? settingsConfig.find(s => s.id === settingsPanel)?.title : "Settings"}</strong><small>@{me.username}</small></div>
        </> : <>
          <button className="avatar-action" onClick={() => isCloudEnabled && !cloudUserId ? setAuthOpen(true) : openProfile(me.id)} aria-label="Your profile"><Avatar profile={me} size="small"/></button>
          <button onClick={() => navigate("home")} className="mobile-brand"><img src="/logo.svg" alt="Blumbook"/><strong>Blumbook</strong>{forceDemo&&<small className="blum-demo-chip">DEMO</small>}</button>
          <button aria-label="Open more menu" aria-expanded={menuOpen} className="icon-button top-more-button" onClick={()=>setMenuOpen(true)}><MoreHorizontal size={25}/></button>
        </>}
      </div>

      {(view === "home" || view === "stories") && <section className={view === "home" ? "home-status-strip" : "stories-destination"} aria-label="Blumbook stories">
        <StoriesRail compact={view === "home"} forceDemo={forceDemo} showcaseWhenEmpty userId={cloudUserId} profiles={allPeople} onSignIn={()=>setAuthOpen(true)} launchCreate={storyLaunch}/>
      </section>}

      {view === "home" && <section className="clean-home" aria-label="Blumbook home">
        {loadingCloud&&<div className="feed-skeleton" role="status" aria-label="Loading posts">{[0,1,2].map(i=><div key={i} className="skeleton-post"><span className="skeleton-avatar"/><div><i/><i/><i/></div></div>)}</div>}
        {!loadingCloud&&filteredPosts.length===0&&<div className="empty-state clean-home-empty"><h3>No posts yet</h3><p>Start a conversation, or discover people in Explore.</p><button className="outline-btn" onClick={()=>navigate("explore")}>Explore people</button></div>}
        {!loadingCloud&&filteredPosts.map(post=><PostCard {...postProps(post)}/>)}
      </section>}

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

      {view === "notifications" && <NotificationsPanel userId={cloudUserId} profiles={allPeople} onSignIn={()=>setAuthOpen(true)} onProfile={openProfile} onPost={(id)=>{const p=posts.find(x=>x.id===id);if(p)void openThread(p);else notify("That post is outside the loaded feed.");}} onMessage={(id)=>{navigate("messages");setChatWith(id);}} prefs={notifyPrefs}/>}
      {view === "messages" && <DirectInbox userId={cloudUserId} profiles={allPeople} initialRecipient={chatWith} onRecipientChange={setChatWith} onSignIn={()=>setAuthOpen(true)}/>}
      {view === "opportunities" && <OpportunityHub userId={cloudUserId} profiles={allPeople} onSignIn={()=>setAuthOpen(true)} onProfile={openProfile} onMessage={(id)=>{navigate("messages");setChatWith(id);}}/>}
      {view==="clips" && <BlumClips posts={posts.filter(p=>!blockedAuthors.includes(p.author_id))} profiles={allPeople} following={followed} onProfile={openProfile} onLike={toggleLike} onBookmark={toggleBookmark} onComment={openThread} onShare={share} onFollow={toggleFollow} onCreate={()=>openComposer("video")} onBack={()=>navigate("home")}/>}
      {view==="polls"&&<PollsPanel userId={cloudUserId} profiles={allPeople} onSignIn={()=>setAuthOpen(true)} onProfile={openProfile} launchCreate={pollLaunch}/>}
      {view==="live"&&<LiveSessions userId={cloudUserId} profiles={allPeople} onSignIn={()=>setAuthOpen(true)} launchCreate={liveLaunch}/>}
      {view==="ai"&&<BlumAI userId={cloudUserId} onSignIn={()=>setAuthOpen(true)} seedText={aiSeed} seedTask={aiTask} onCompose={text=>openComposer("post",text)}/>}
      {view==="schedule"&&<ScheduledPosts userId={cloudUserId} onSignIn={()=>setAuthOpen(true)} launchCreate={scheduleLaunch} onCompose={text=>openComposer("post",text)}/>}
      {view==="verification"&&<><CreatorAccess mode="verification" userId={cloudUserId} profile={me} onSignIn={()=>setAuthOpen(true)}/><div className="drawer-verification-premium"><button onClick={()=>navigate("premium")}><Crown size={21}/><span>Explore Blumbook Premium <small>Coming in a future release</small></span><ArrowRight size={17}/></button></div></>}
      {view==="earnings"&&<CreatorAccess mode="earnings" userId={cloudUserId} profile={me} onSignIn={()=>setAuthOpen(true)}/>}
      {view==="planner"&&<section className="drawer-planner"><PanelTitle>Drafts & Scheduled Posts</PanelTitle><p className="drawer-planner-note">Drafts stay on this device. Scheduling requires account setup and an active publishing service.</p><CreatorStudioPlus draftsOnly posts={posts} me={me} onCompose={text=>openComposer("post",text||"")}/><ScheduledPosts userId={cloudUserId} onSignIn={()=>setAuthOpen(true)} onCompose={text=>openComposer("post",text)}/></section>}


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
              {activeProfile.id!==me.id&&<div className="profile-more-wrap">
                <button className="profile-action-icon" aria-label="More profile options" aria-expanded={profileMore} onClick={()=>setProfileMore(x=>!x)}><MoreHorizontal size={20}/></button>
                {profileMore&&<div className="profile-more-panel" role="group" aria-label="Profile options">
                  <button onClick={()=>void shareProfile(activeProfile)}><Share2 size={17}/> Share profile</button>
                  <button onClick={()=>openCollab(activeProfile)}><Handshake size={17}/> Collaborate</button>
                  <button onClick={()=>toggleProfileAlerts(activeProfile)}><Bell size={17}/> {profileAlerts.includes(activeProfile.id)?"Turn off alerts":"Post alerts (preview)"}</button>
                  <button onClick={()=>{mute(activeProfile.id);setProfileMore(false);}}><Bell size={17}/> Mute @{activeProfile.username}</button>
                  <button onClick={()=>{setBlockTarget(activeProfile);setProfileMore(false);}}><Ban size={17}/>{blockedAuthors.includes(activeProfile.id)?"Unhide account":"Hide account (preview)"}</button>
                  <button onClick={()=>{setReportReason("Spam");setProfileReport(activeProfile);setProfileMore(false);}}><Flag size={17}/> Report account (beta)</button>
                </div>}
              </div>}
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
          {profileMedia.length ? <div className="full-profile-media-grid">{profileMedia.map(p=><button key={p.id} onClick={()=>p.image_url?void openThread(p):openVideo(p)} aria-label={(p.image_url?"Open photo post":"Watch post video")+" by "+activeProfile.display_name}>{p.image_url?<img src={p.image_url} alt="Image in post" loading="lazy"/>:<span className="media-video-tile"><Video size={22}/> Video</span>}</button>)}</div>
          : <div className="empty-state"><ImagePlus size={30}/><h3>No photos yet</h3><p>Photos shared in posts will appear here.</p></div>}
        </>}
        {profileTab==="likes" && <>
          {activeProfile.id!==me.id
            ? <div className="empty-state"><Heart size={30}/><h3>Likes are private</h3><p>Only you can see posts you've liked on Blumbook.</p></div>
            :profileLikes.length?profileLikes.map(p=><PostCard {...postProps(p)}/>)
            :<div className="empty-state"><Heart size={30}/><h3>No liked posts yet</h3><p>Posts you like will be collected here.</p></div>}
        </>}
      </>}

      {view==="thread"&&selectedPost&&<section className="thread-detail" aria-label="Post conversation">
        <header className="thread-detail-header">
          <button aria-label="Back to previous screen" onClick={()=>navigate(threadReturnView)}><ArrowLeft size={23}/></button>
          <strong>Post</strong>
          <button aria-label="Share post" onClick={()=>void share(selectedPost)}><Share2 size={19}/></button>
        </header>
        <article className="thread-original">
          <div className="thread-author-line">
            <button className="thread-author-avatar" aria-label={"View "+lookup(selectedPost.author_id).display_name+" profile"} onClick={()=>openProfile(selectedPost.author_id)}><Avatar profile={lookup(selectedPost.author_id)}/></button>
            <button className="thread-author-info" onClick={()=>openProfile(selectedPost.author_id)}>
              <Name profile={lookup(selectedPost.author_id)}/>
              <small>@{lookup(selectedPost.author_id).username}</small>
            </button>
            {selectedPost.author_id!==me.id&&<button className="thread-follow" onClick={()=>void toggleFollow(selectedPost.author_id)}>{followed.includes(selectedPost.author_id)?"Following":"Follow"}</button>}
          </div>
          <p className="thread-original-text">{selectedPost.body}</p>
          {selectedPost.image_url&&<div className="thread-main-image"><img src={selectedPost.image_url} alt="Photo in post" loading="lazy"/></div>}
          {selectedPost.video_url&&<button className="thread-main-video" onClick={()=>openVideo(selectedPost)} aria-label="Play post video"><video src={selectedPost.video_url} preload="metadata" playsInline muted/><span><Play size={22} fill="currentColor"/></span></button>}
          <div className="thread-published">
            <time dateTime={selectedPost.created_at}>{new Date(selectedPost.created_at).toLocaleTimeString(language==="ha"?"ha-NG":"en-US",{hour:"numeric",minute:"2-digit"})} · {new Date(selectedPost.created_at).toLocaleDateString(language==="ha"?"ha-NG":"en-US",{month:"short",day:"numeric",year:"numeric"})}</time>
            {!isCloudEnabled&&<span> · <strong>{shortCount(selectedPost.views)}</strong> sample views</span>}
          </div>
          <div className="thread-engagement">
            <span><strong>{shortCount(selectedPost.reposts)}</strong> Reposts</span>
            <span><strong>{shortCount(selectedPost.likes)}</strong> Likes</span>
            <span><strong>{shortCount(selectedPost.replies)}</strong> Replies</span>
          </div>
          <div className="thread-actions" role="group" aria-label="Post actions">
            <button aria-label="Write a reply" onClick={()=>document.getElementById("thread-reply-input")?.focus()}><MessageCircle size={19}/></button>
            <button className={selectedPost.reposted?"is-active":""} aria-label="Repost" onClick={()=>void toggleRepost(selectedPost)}><Repeat2 size={19}/></button>
            <button className={selectedPost.liked?"is-active thread-like-action": "thread-like-action"} aria-label={selectedPost.liked?"Unlike post":"Like post"} onClick={()=>void toggleLike(selectedPost)}><LikeBurst liked={Boolean(selectedPost.liked)} size={19}/></button>
            <button className={selectedPost.bookmarked?"is-active":""} aria-label="Bookmark" onClick={()=>void toggleBookmark(selectedPost)}><Bookmark size={19} fill={selectedPost.bookmarked?"currentColor":"none"}/></button>
            <button aria-label="Share" onClick={()=>void share(selectedPost)}><Share2 size={19}/></button>
          </div>
        </article>
        <div className="thread-discussion-bar">
          <span>Replies</span>
          <label><span className="visually-hidden">Sort replies</span><select aria-label="Sort replies" value={replyOrder} onChange={e=>setReplyOrder(e.target.value as "recent"|"oldest")}><option value="recent">Latest</option><option value="oldest">Oldest</option></select><ChevronDown size={15}/></label>
        </div>
        <div className="thread-replies">
          {threadLoading&&<p className="thread-reply-notice" role="status">Loading replies…</p>}
          {threadError&&<div className="thread-reply-notice" role="alert"><span>{threadError}</span><button onClick={()=>void loadCommentConversation(selectedPost.id)}>Retry</button></div>}
          {!threadLoading&&!threadError&&(comments[selectedPost.id]||[]).length===0&&<p className="thread-reply-notice">No replies yet. Start the conversation.</p>}
          {!threadLoading&&!threadError&&(()=>{
            const visible=(comments[selectedPost.id]||[]).filter(c=>!blockedAuthors.includes(c.author_id)&&!mutedAuthors.includes(c.author_id));
            const byId=new Set(visible.map(c=>c.id));
            const roots=visible.filter(c=>!c.parent_comment_id||!byId.has(c.parent_comment_id)).sort((a,b)=>replyOrder==="recent"?new Date(b.created_at).getTime()-new Date(a.created_at).getTime():new Date(a.created_at).getTime()-new Date(b.created_at).getTime());
            return roots.map(root=>{
              const children=visible.filter(c=>c.parent_comment_id===root.id).sort((a,b)=>new Date(a.created_at).getTime()-new Date(b.created_at).getTime());
              const open=expandedCommentThreads[root.id]||false;
              return <div className="comment-thread-group" key={root.id}>
                {renderComment(root)}
                {children.length>0&&<>
                  <button className="comment-show-replies" aria-expanded={open} onClick={()=>setExpandedCommentThreads(prev=>({...prev,[root.id]:!open}))}>
                    {open?"Hide": "Show"} {children.length} {children.length===1?"reply":"replies"} <ChevronDown size={15}/>
                  </button>
                  {open&&<div className="comment-nested-list">{children.map(c=>renderComment(c,1))}</div>}
                </>}
              </div>;
            });
          })()}
        </div>
        <form className="thread-composer" onSubmit={sendReply}>
          {replyingTo&&<div className="thread-reply-target"><span>Replying to <strong>@{lookup(replyingTo.author_id).username}</strong></span><button type="button" aria-label="Cancel replying to comment" onClick={()=>setReplyingTo(null)}><X size={16}/></button></div>}
          <div className="thread-compose-row">
            <Avatar profile={me} size="small"/>
            <textarea id="thread-reply-input" rows={1} aria-label="Write your reply" placeholder={replyingTo?"Write a reply to this comment":"Post your reply"} maxLength={500} value={replyText} onChange={e=>setReplyText(e.target.value)}/>
            <button type="submit" aria-label="Send reply" disabled={busy||!replyText.trim()}><Send size={19}/></button>
          </div>
        </form>
      </section>}

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
              <div className="settings-detail-row settings-static-row"><ShieldCheck size={22}/><span><strong>Block and report</strong><small>Account hiding is device-only. Reporting requires a configured backend, and human moderation is not yet operational.</small></span></div>
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
      {isCloudEnabled && !cloudUserId && <section className="right-panel subscribe-panel"><h3>Welcome to Blumbook</h3><p>Meet new people, share your story and find your community.</p>{isCloudEnabled&&!cloudUserId?<button className="primary-btn" onClick={()=>{setSignUp(true);setAuthOpen(true);}}>Create your account</button>:<button className="primary-btn" onClick={()=>navigate("explore")}>Explore Blumbook</button>}</section>}
      <section className="right-panel"><h3>What&apos;s happening</h3>{TRENDS.slice(0,4).map((t)=><button key={t.tag} className="right-trend" onClick={()=>{setQuery(t.tag.slice(1));navigate("explore");}}><small>{t.category}</small><strong>{t.tag}</strong><small>{t.posts}</small></button>)}<button className="panel-link" onClick={()=>navigate("explore")}>Show more</button></section>
      <section className="right-panel"><h3>Who to follow</h3>{people.filter((p)=>p.id!==me.id).slice(0,3).map((p)=><div className="suggestion" key={p.id}><button onClick={()=>openProfile(p.id)}><Avatar profile={p} size="small"/><span><strong>{p.display_name}</strong><small>@{p.username}</small></span></button><button className="follow-btn" onClick={()=>toggleFollow(p.id)}>{followed.includes(p.id)?"Following":"Follow"}</button></div>)}<button className="panel-link" onClick={()=>navigate("explore")}>Show more</button></section>
      <footer className="right-footer">About · Privacy · Terms · Accessibility<br/>© {new Date().getFullYear()} Blumbook. Talk. Share. Bloom.</footer>
    </aside>

    <nav className={"mobile-bottom "+((view==="settings"||view==="clips"||view==="thread")?"mobile-bottom-hidden":"")+(navHidden?" auto-hide-nav":"")+(menuOpen?" bb-behind-menu":"")} aria-label="Main navigation">
      {NAV.filter((n)=>["home","explore","clips","notifications","messages"].includes(n.id)).map(({id,label,Icon})=><button aria-label={label} key={id} className={view===id?"active":""} onClick={()=>navigate(id)}><Icon size={25} strokeWidth={view===id?2.7:1.9}/>{id==="notifications"&&<span className="nav-dot"/>}</button>)}
    </nav>
    <button aria-label="Open creation menu" className={"floating-compose "+((view==="settings"||view==="clips"||view==="thread")?"floating-compose-hidden":"")+(navHidden?" auto-hide-compose":"")+(menuOpen?" bb-behind-menu":"")} onClick={()=>setCreateMenuOpen(true)}><Plus size={28}/></button>
    {menuOpen && <button aria-label="Close menu" className="menu-shade" onClick={()=>setMenuOpen(false)}/>}
    {createMenuOpen&&<CreateMenu onClose={()=>setCreateMenuOpen(false)} onSelect={selectCreate}/>}
    {toast && <div role="status" className="toast">{toast}</div>}

    {mediaViewer?.video_url&&<ImmersiveVideoViewer
      post={posts.find(p=>p.id===mediaViewer.id)||mediaViewer}
      author={lookup(mediaViewer.author_id)}
      isOwnPost={mediaViewer.author_id===me.id}
      isFollowing={followed.includes(mediaViewer.author_id)}
      onFollow={()=>void toggleFollow(mediaViewer.author_id)}
      onClose={()=>setMediaViewer(null)}
      onProfile={()=>{const id=mediaViewer.author_id;setMediaViewer(null);openProfile(id);}}
      onReply={()=>{const p=mediaViewer;setMediaViewer(null);void openThread(p);}}
      onRepost={()=>void toggleRepost(posts.find(p=>p.id===mediaViewer.id)||mediaViewer)}
      onLike={()=>void toggleLike(posts.find(p=>p.id===mediaViewer.id)||mediaViewer)}
      onBookmark={()=>void toggleBookmark(posts.find(p=>p.id===mediaViewer.id)||mediaViewer)}
      onShare={()=>void share(mediaViewer)}
      onNext={()=>nextVideo(1)}
      onPrevious={()=>nextVideo(-1)}
    />}
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
