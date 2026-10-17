"use client";

import {useEffect,useRef,useState} from "react";
import {
  ArrowLeft,Bookmark,CheckCircle2,Heart,Maximize2,MessageCircle,Minimize2,
  MoreVertical,Pause,PictureInPicture2,Play,Repeat2,Share2,Volume2,VolumeX
} from "lucide-react";
import type {Post,Profile} from "@/lib/demo";
import {shortCount} from "@/lib/demo";

type Props={
  post:Post;
  author:Profile;
  isOwnPost:boolean;
  isFollowing:boolean;
  onFollow:()=>void;
  onClose:()=>void;
  onProfile:()=>void;
  onReply:()=>void;
  onRepost:()=>void;
  onLike:()=>void;
  onBookmark:()=>void;
  onShare:()=>void;
  onNext?:()=>void;
  onPrevious?:()=>void;
};

function clock(seconds:number){
  if(!Number.isFinite(seconds)||seconds<0)return "0:00";
  const whole=Math.floor(seconds);
  return Math.floor(whole/60)+":"+String(whole%60).padStart(2,"0");
}

export default function ImmersiveVideoViewer({
  post,author,isOwnPost,isFollowing,onFollow,onClose,onProfile,onReply,onRepost,
  onLike,onBookmark,onShare,onNext,onPrevious
}:Props){
  const video=useRef<HTMLVideoElement>(null);
  const touchStart=useRef<{x:number;y:number}|null>(null);
  const [playing,setPlaying]=useState(false);
  const [muted,setMuted]=useState(false);
  const [duration,setDuration]=useState(0);
  const [position,setPosition]=useState(0);
  const [speed,setSpeed]=useState(1);
  const [showChrome,setShowChrome]=useState(true);
  const [moreOpen,setMoreOpen]=useState(false);
  const [showCaption,setShowCaption]=useState(false);
  const [fillScreen,setFillScreen]=useState(false);
  const [canPictureInPicture,setCanPictureInPicture]=useState(false);
  const [playbackError,setPlaybackError]=useState(false);

  useEffect(()=>{
    setPosition(0);setDuration(0);setPlaying(false);setShowChrome(true);
    setShowCaption(false);setMoreOpen(false);setPlaybackError(false);
    setFillScreen(false);
  },[post.id]);
  useEffect(()=>{
    setCanPictureInPicture(Boolean(document.pictureInPictureEnabled&&
      typeof document.createElement("video").requestPictureInPicture==="function"));
  },[]);

  const toggle=()=>{
    const player=video.current;
    if(!player)return;
    if(player.paused)void player.play().catch(()=>setPlaying(false));
    else player.pause();
  };
  const changeSpeed=()=>{
    const options=[1,1.25,1.5,2];
    const next=options[(options.indexOf(speed)+1)%options.length];
    setSpeed(next);
    if(video.current)video.current.playbackRate=next;
  };
  const togglePip=async()=>{
    const player=video.current;
    if(!player||!document.pictureInPictureEnabled)return;
    try{
      if(document.pictureInPictureElement)await document.exitPictureInPicture();
      else if(player.requestPictureInPicture)await player.requestPictureInPicture();
    }catch{
      // Browser/device policy may not allow picture-in-picture.
    }
  };

  useEffect(()=>{
    const oldOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const handler=(e:KeyboardEvent)=>{
      if(e.key==="Escape"){e.preventDefault();onClose();}
      if(e.key===" "&&!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLTextAreaElement)){
        e.preventDefault();
        const player=video.current;
        if(player){if(player.paused)void player.play().catch(()=>setPlaying(false));else player.pause();}
      }
      if(e.key==="ArrowRight"&&video.current&&Number.isFinite(video.current.duration)){
        video.current.currentTime=Math.min(video.current.duration,video.current.currentTime+5);
      }
      if(e.key==="ArrowLeft"&&video.current){
        video.current.currentTime=Math.max(0,video.current.currentTime-5);
      }
    };
    const onVisibility=()=>{if(document.hidden)video.current?.pause();};
    window.addEventListener("keydown",handler);
    document.addEventListener("visibilitychange",onVisibility);
    return()=>{
      window.removeEventListener("keydown",handler);
      document.removeEventListener("visibilitychange",onVisibility);
      video.current?.pause();
      document.body.style.overflow=oldOverflow;
    };
  },[onClose]);

  const clipCaption=post.body.length>145&&!showCaption;
  const remaining=duration>0?Math.max(0,duration-position):0;
  return <div className="immersive-video cinematic-video" role="dialog" aria-modal="true" aria-label={"Video by "+author.display_name}>
    <div className="immersive-video-stage cinematic-video-stage"
      onTouchStart={e=>{const finger=e.touches[0];touchStart.current=finger?{x:finger.clientX,y:finger.clientY}:null;}}
      onTouchEnd={e=>{
        const start=touchStart.current;touchStart.current=null;
        const end=e.changedTouches[0];
        if(!start||!end)return;
        const dy=end.clientY-start.y;
        const dx=end.clientX-start.x;
        if(Math.abs(dy)>90&&Math.abs(dy)>Math.abs(dx)*1.25){
          if(dy<0)onNext?.();else onPrevious?.();
        }
      }}>
      <video ref={video} key={post.id} src={post.video_url||""}
        className={fillScreen?"cinematic-video-fill":""}
        autoPlay playsInline preload="metadata" muted={muted}
        onClick={()=>setShowChrome(v=>!v)}
        onPlay={()=>{setPlaying(true);setPlaybackError(false);}}
        onPause={()=>setPlaying(false)}
        onTimeUpdate={e=>setPosition(e.currentTarget.currentTime)}
        onLoadedMetadata={e=>{
          const player=e.currentTarget;
          setDuration(Number.isFinite(player.duration)?player.duration:0);
          player.playbackRate=speed;
          if(player.paused)void player.play().catch(()=>{
            player.muted=true;setMuted(true);
            void player.play().catch(()=>setPlaying(false));
          });
        }}
        onEnded={()=>setPlaying(false)}
        onError={()=>{setPlaying(false);setPlaybackError(true);}}
        aria-label="Video content"/>
      {playbackError&&<div className="cinematic-video-error" role="alert">Video could not be loaded.</div>}
    </div>

    <div className={"immersive-video-chrome cinematic-video-chrome"+(showChrome?"":" chrome-hidden")}>
      <header className="cinematic-video-header">
        <button className="cinematic-video-round" autoFocus onClick={onClose} aria-label="Back to feed"><ArrowLeft size={25}/></button>
        <div className="cinematic-video-more">
          <button className="cinematic-video-round" aria-label="More video options"
            aria-expanded={moreOpen} onClick={()=>setMoreOpen(v=>!v)}><MoreVertical size={23}/></button>
          {moreOpen&&<div className="cinematic-video-menu" role="group" aria-label="Video options">
            <button onClick={()=>{setMoreOpen(false);onReply();}}>View conversation</button>
            <button onClick={()=>{setMoreOpen(false);onShare();}}>Share video link</button>
            <button onClick={()=>{setMoreOpen(false);setShowChrome(false);}}>Hide controls</button>
          </div>}
        </div>
      </header>

      <footer className="cinematic-video-footer">
        <section className="cinematic-video-post" aria-label="Video post information">
          <div className="cinematic-video-author">
            <button className="cinematic-video-avatar" onClick={onProfile} aria-label={"View "+author.display_name+" profile"}>
              {author.avatar_url?<img src={author.avatar_url} alt=""/>:
                <span>{author.display_name.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase()}</span>}
            </button>
            <button className="cinematic-video-identity" onClick={onProfile}>
              <span className="cinematic-video-displayname">{author.display_name}{author.verified&&<CheckCircle2 size={16} fill="var(--verified)" color="#fff" aria-label="Verified"/>}</span>
              <small>@{author.username}</small>
            </button>
            {!isOwnPost&&<button className="cinematic-video-follow" onClick={onFollow} aria-label={isFollowing?"Unfollow user":"Follow user"}>{isFollowing?"Following":"Follow"}</button>}
          </div>
          {post.body&&<div className="cinematic-video-caption">
            <p className={clipCaption?"cinematic-video-caption-clipped":""}>{post.body}</p>
            {post.body.length>145&&<button onClick={()=>setShowCaption(v=>!v)}>{showCaption?"Show less":"Show more"}</button>}
          </div>}
          <div className="cinematic-video-reactions" role="group" aria-label="Video reactions">
            <button onClick={onReply} aria-label={"Comments "+shortCount(post.replies)}><MessageCircle size={20}/><span>{shortCount(post.replies)}</span></button>
            <button onClick={onRepost} className={post.reposted?"is-active":""} aria-label={post.reposted?"Undo repost":"Repost video"}><Repeat2 size={20}/><span>{shortCount(post.reposts)}</span></button>
            <button onClick={onLike} className={post.liked?"is-active":""} aria-label={post.liked?"Unlike video":"Like video"}><Heart size={20} fill={post.liked?"currentColor":"none"}/><span>{shortCount(post.likes)}</span></button>
            <button onClick={onBookmark} className={post.bookmarked?"is-active":""} aria-label={post.bookmarked?"Remove bookmark":"Bookmark video"}><Bookmark size={20} fill={post.bookmarked?"currentColor":"none"}/></button>
            <button onClick={onShare} aria-label="Share video"><Share2 size={20}/></button>
          </div>
        </section>
        <div className="cinematic-video-progress">
          <input type="range" aria-label="Seek video" min={0} max={Math.max(duration,.01)} step={.1} value={Math.min(position,duration||0)}
            onChange={e=>{const next=Number(e.target.value);if(video.current)video.current.currentTime=next;setPosition(next);}}
            style={{background:`linear-gradient(to right,#fff ${duration>0?Math.min(position/duration*100,100):0}%,#6a6a6a ${duration>0?Math.min(position/duration*100,100):0}%)`}}/>
        </div>
        <div className="cinematic-video-transport">
          <button className="cinematic-video-play" aria-label={playing?"Pause video":"Play video"} onClick={toggle}>{playing?<Pause fill="currentColor" size={24}/>:<Play fill="currentColor" size={24}/>}</button>
          <span className="cinematic-video-remaining">-{clock(remaining)}</span>
          <div className="cinematic-video-transport-actions">
            <button onClick={changeSpeed} aria-label="Change playback speed">{speed}x</button>
            <button onClick={()=>{
              const player=video.current;if(!player)return;
              player.muted=!player.muted;setMuted(player.muted);
            }} aria-label={muted?"Unmute video":"Mute video"}>{muted?<VolumeX size={22}/>:<Volume2 size={22}/>}</button>
            <button onClick={()=>setFillScreen(v=>!v)} aria-label={fillScreen?"Fit whole video":"Fill screen"}>{fillScreen?<Minimize2 size={21}/>:<Maximize2 size={21}/>}</button>
            {canPictureInPicture&&<button onClick={()=>void togglePip()} aria-label="Picture in picture"><PictureInPicture2 size={21}/></button>}
          </div>
        </div>
      </footer>
    </div>
    {!showChrome&&<button className="immersive-video-show-controls" onClick={()=>setShowChrome(true)} aria-label="Show video controls"/>}
  </div>;
}
