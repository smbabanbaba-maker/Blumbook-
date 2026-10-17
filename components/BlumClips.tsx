"use client";
import {useEffect,useRef,useState} from "react";
import {ArrowLeft,Bookmark,MessageCircle,Play,Plus,Share2,UserPlus,Video,Volume2,VolumeX} from "lucide-react";
import LikeBurst from "@/components/LikeBurst";
import type {Post,Profile} from "@/lib/demo";

type Props={posts:Post[];profiles:Profile[];following:string[];onProfile:(id:string)=>void;onLike:(post:Post)=>void;onBookmark:(post:Post)=>void;onComment:(post:Post)=>void;onShare:(post:Post)=>void;onFollow:(id:string)=>void;onCreate:()=>void;onBack:()=>void};
function ClipCard({post,author,following,onProfile,onLike,onBookmark,onComment,onShare,onFollow}:{post:Post;author:Profile;following:boolean;onProfile:Props["onProfile"];onLike:Props["onLike"];onBookmark:Props["onBookmark"];onComment:Props["onComment"];onShare:Props["onShare"];onFollow:Props["onFollow"]}){
 const video=useRef<HTMLVideoElement>(null);
 const frame=useRef<HTMLElement>(null);
 const [paused,setPaused]=useState(true);
 const [muted,setMuted]=useState(true);
 useEffect(()=>{
   const node=frame.current,player=video.current;
   if(!node||!player)return;
   const observer=new IntersectionObserver(entries=>{
     const visible=entries[0]?.isIntersecting && entries[0].intersectionRatio>=0.65 && !document.hidden;
     if(visible){void player.play().then(()=>setPaused(false)).catch(()=>setPaused(true));}
     else{player.pause();setPaused(true);}
   },{threshold:[0,0.65,1]});
   observer.observe(node);
   const visibility=()=>{if(document.hidden){player.pause();setPaused(true);}};
   document.addEventListener("visibilitychange",visibility);
   return()=>{observer.disconnect();document.removeEventListener("visibilitychange",visibility);player.pause();};
 },[post.id]);
 const toggle=()=>{const player=video.current;if(!player)return;if(player.paused){void player.play().then(()=>setPaused(false)).catch(()=>{});}else{player.pause();setPaused(true);}};
 return <article ref={frame} className="blum-clip" aria-label={"Video from "+author.display_name}>
    <video ref={video} src={post.video_url||""} playsInline loop muted={muted} preload="metadata" onClick={toggle} onPause={()=>setPaused(true)} onPlay={()=>setPaused(false)} aria-label="Video" />
    <button className="clip-audio" onClick={()=>setMuted(v=>!v)} aria-label={muted?"Unmute clip":"Mute clip"}>{muted?<VolumeX size={19}/>:<Volume2 size={19}/>}</button>
    {paused&&<button type="button" className="clip-play" onClick={toggle} aria-label="Play video"><Play size={30} fill="currentColor"/></button>}
    <div className="clip-overlay">
      <div className="clip-details">
        <button onClick={()=>onProfile(author.id)} className="clip-author">@{author.username}</button>
        {post.body&&<p>{post.body}</p>}
        {author.id!=="demo-me" && <button className="clip-follow" onClick={()=>onFollow(author.id)}><UserPlus size={14}/>{following?"Following":"Follow"}</button>}
      </div>
      <aside className="clip-actions" aria-label="Video actions">
        <button aria-label={post.liked?"Unlike clip":"Like clip"} className={post.liked?"clip-selected clip-like-action":"clip-like-action"} onClick={()=>onLike(post)}><LikeBurst liked={post.liked} size={25}/><small>{post.likes}</small></button>
        <button aria-label="View comments" onClick={()=>onComment(post)}><MessageCircle size={25}/><small>{post.replies}</small></button>
        <button aria-label="Save clip" className={post.bookmarked?"clip-selected":""} onClick={()=>onBookmark(post)}><Bookmark size={24} fill={post.bookmarked?"currentColor":"none"}/></button>
        <button aria-label="Share clip" onClick={()=>onShare(post)}><Share2 size={24}/></button>
      </aside>
    </div>
 </article>;
}
export default function BlumClips({posts,profiles,following,onProfile,onLike,onBookmark,onComment,onShare,onFollow,onCreate,onBack}:Props){
 const clips=posts.filter(p=>Boolean(p.video_url));
 return <section className="blum-clips-page">
  <header className="clips-head"><button className="clips-back" onClick={onBack} aria-label="Back to Home"><ArrowLeft size={23}/></button><h2>Clips</h2><button className="clips-new" onClick={onCreate} aria-label="Create clip"><Plus size={21}/></button></header>
  {clips.length?<div className="clip-stack">{clips.map(p=><ClipCard key={p.id} post={p} author={profiles.find(x=>x.id===p.author_id)||{id:p.author_id,username:"member",display_name:"Blumbook member",bio:""}} following={following.includes(p.author_id)} onProfile={onProfile} onLike={onLike} onBookmark={onBookmark} onComment={onComment} onShare={onShare} onFollow={onFollow}/>)}</div>:<div className="clip-empty"><Video size={38}/><h3>Make the first clip</h3><p>Short videos uploaded by members will appear here. You can upload an MP4 or WebM from your phone.</p><button onClick={onCreate}><Plus size={18}/> Upload a clip</button></div>}
 </section>;
}
