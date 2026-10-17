"use client";

import {useEffect,useRef,useState} from "react";
import {ArrowLeft,Bookmark,Heart,MessageCircle,Pause,Play,Share2,Volume2,VolumeX} from "lucide-react";
import type {Post,Profile} from "@/lib/demo";
import {shortCount} from "@/lib/demo";

type Props={
  post:Post;
  author:Profile;
  onClose:()=>void;
  onProfile:()=>void;
  onReply:()=>void;
  onLike:()=>void;
  onBookmark:()=>void;
  onShare:()=>void;
  onNext?:()=>void;
  onPrevious?:()=>void;
};
const clock=(seconds:number)=>{
  if(!Number.isFinite(seconds)||seconds<0)return "0:00";
  const total=Math.floor(seconds);
  return Math.floor(total/60)+":"+String(total%60).padStart(2,"0");
};

export default function ImmersiveVideoViewer({post,author,onClose,onProfile,onReply,onLike,onBookmark,onShare,onNext,onPrevious}:Props){
  const video=useRef<HTMLVideoElement>(null);
  const startTouchY=useRef<number|null>(null);
  const [playing,setPlaying]=useState(false);
  const [muted,setMuted]=useState(false);
  const [duration,setDuration]=useState(0);
  const [position,setPosition]=useState(0);
  const [speed,setSpeed]=useState(1);
  const [showChrome,setShowChrome]=useState(true);
  useEffect(()=>{setPosition(0);setDuration(0);setPlaying(false);setShowChrome(true);},[post.id]);
  const toggle=()=>{
    const player=video.current;
    if(!player)return;
    if(player.paused){void player.play().catch(()=>setPlaying(false));}
    else player.pause();
  };
  useEffect(()=>{
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const handler=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();onClose();}
      if(event.key===" " && !(event.target instanceof HTMLInputElement)){
        event.preventDefault();
        const player=video.current;
        if(player){if(player.paused){void player.play().catch(()=>setPlaying(false));}else player.pause();}
      }
      if(event.key==="ArrowRight"&&video.current){video.current.currentTime=Math.min(video.current.duration||0,video.current.currentTime+5);}
      if(event.key==="ArrowLeft"&&video.current){video.current.currentTime=Math.max(0,video.current.currentTime-5);}
    };
    const onVisibility=()=>{if(document.hidden)video.current?.pause();};
    window.addEventListener("keydown",handler);
    document.addEventListener("visibilitychange",onVisibility);
    return ()=>{
      window.removeEventListener("keydown",handler);
      document.removeEventListener("visibilitychange",onVisibility);
      video.current?.pause();
      document.body.style.overflow=previousOverflow;
    };
  },[onClose]);
  const changeSpeed=()=>{
    const value=speed===1?1.5:speed===1.5?2:1;
    setSpeed(value);
    if(video.current)video.current.playbackRate=value;
  };
  return <div className="immersive-video" role="dialog" aria-modal="true" aria-label={"Video from "+author.display_name}>
    <div className="immersive-video-stage" onTouchStart={e=>{startTouchY.current=e.touches[0]?.clientY??null;}} onTouchEnd={e=>{const start=startTouchY.current;startTouchY.current=null;if(start===null)return;const end=e.changedTouches[0]?.clientY??start;const distance=end-start;if(Math.abs(distance)>75){if(distance<0)onNext?.();else onPrevious?.();}}}>
      <video
        ref={video}
        key={post.id}
        src={post.video_url||""}
        autoPlay
        playsInline
        preload="metadata"
        onClick={()=>setShowChrome(s=>!s)}
        onPlay={()=>setPlaying(true)}
        onPause={()=>setPlaying(false)}
        onTimeUpdate={e=>setPosition(e.currentTarget.currentTime)}
        onLoadedMetadata={e=>setDuration(e.currentTarget.duration)}
        onEnded={()=>setPlaying(false)}
        onError={()=>setPlaying(false)}
      />
    </div>
    <div className={"immersive-video-chrome"+(showChrome?"":" chrome-hidden")}>
      <header className="immersive-video-top">
        <button autoFocus onClick={onClose} aria-label="Back to feed"><ArrowLeft size={24}/></button>
        <span>Blumbook</span>
      </header>
      <footer className="immersive-video-bottom">
        <div className="immersive-video-author">
          <button onClick={onProfile} className="immersive-video-name">@{author.username}</button>
          {post.body&&<p>{post.body}</p>}
        </div>
        <div className="immersive-video-social">
          <button onClick={onReply} aria-label="Comments"><MessageCircle size={19}/><span>{shortCount(post.replies)}</span></button>
          <button onClick={onLike} aria-label={post.liked?"Unlike":"Like"} className={post.liked?"is-active":""}><Heart size={19} fill={post.liked?"currentColor":"none"}/><span>{shortCount(post.likes)}</span></button>
          <button onClick={onBookmark} aria-label={post.bookmarked?"Remove bookmark":"Bookmark"}><Bookmark size={19} fill={post.bookmarked?"currentColor":"none"}/></button>
          <button onClick={onShare} aria-label="Share video"><Share2 size={19}/></button>
        </div>
        <div className="immersive-video-seek">
          <span>{clock(position)}</span>
          <input type="range" aria-label="Seek video" min={0} max={Math.max(duration,.01)} step={.1} value={Math.min(position,duration||0)} onChange={e=>{const player=video.current;if(player)player.currentTime=Number(e.target.value);setPosition(Number(e.target.value));}} />
          <span>{clock(duration)}</span>
        </div>
        <div className="immersive-video-transport">
          <button onClick={toggle} aria-label={playing?"Pause video":"Play video"}>{playing?<Pause size={20} fill="currentColor"/>:<Play size={20} fill="currentColor"/>}</button>
          <div>
            <button onClick={changeSpeed} aria-label="Change playback speed">{speed}x</button>
            <button onClick={()=>{const player=video.current;if(!player)return;player.muted=!player.muted;setMuted(player.muted);}} aria-label={muted?"Unmute video":"Mute video"}>{muted?<VolumeX size={19}/>:<Volume2 size={19}/>}</button>
          </div>
        </div>
      </footer>
    </div>
    {!showChrome&&<button className="immersive-video-show-controls" onClick={()=>setShowChrome(true)} aria-label="Show video controls"/>}
  </div>;
}
