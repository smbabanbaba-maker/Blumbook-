"use client";

import {useEffect,useRef,useState,type ChangeEvent,type FormEvent} from "react";
import {
  ArrowLeft,BookmarkPlus,Camera,CheckCircle2,ChevronDown,Clapperboard,
  FileText,Globe2,ImagePlus,MapPin,MoreHorizontal,Plus,Send,
  Smile,Sparkles,Trash2,Video,X
} from "lucide-react";
import type {Profile} from "@/lib/demo";

const DRAFT_KEY="blumbook-composer-drafts-v1";
type Draft={id:string;text:string;savedAt:number};
type Props={
  author:Profile;
  text:string;
  setText:(text:string)=>void;
  imagePreview:string;
  videoPreview:string;
  imageFile:File|null;
  videoFile:File|null;
  busy:boolean;
  mode:"post"|"photo"|"video";
  onImage:(event:ChangeEvent<HTMLInputElement>)=>void;
  onVideo:(event:ChangeEvent<HTMLInputElement>)=>void;
  onRemoveImage:()=>void;
  onRemoveVideo:()=>void;
  onSubmit:(event:FormEvent<HTMLFormElement>)=>void;
  onClose:()=>void;
  onPoll:()=>void;
  onAI:()=>void;
};

function readDrafts():Draft[]{
  if(typeof window==="undefined")return [];
  try{
    const value=JSON.parse(localStorage.getItem(DRAFT_KEY)||"[]");
    if(!Array.isArray(value))return [];
    return value.filter((d):d is Draft=>typeof d?.id==="string"&&typeof d?.text==="string"&&typeof d?.savedAt==="number").slice(0,25);
  }catch{return [];}
}
const emojiChoices=["💙","❤️","🔥","😂","✨","👏","🥰","🎉"];

export default function PremiumPostComposer({
  author,text,setText,imagePreview,videoPreview,imageFile,videoFile,busy,mode,
  onImage,onVideo,onRemoveImage,onRemoveVideo,onSubmit,onClose,onPoll,onAI
}:Props){
  const [drafts,setDrafts]=useState<Draft[]>([]);
  const [draftOpen,setDraftOpen]=useState(false);
  const [exitOpen,setExitOpen]=useState(false);
  const [audienceOpen,setAudienceOpen]=useState(false);
  const [emojiOpen,setEmojiOpen]=useState(false);
  const [placeOpen,setPlaceOpen]=useState(false);
  const [moreOpen,setMoreOpen]=useState(false);
  const [place,setPlace]=useState("");
  const textArea=useRef<HTMLTextAreaElement>(null);
  const hasAttachment=Boolean(imagePreview||videoPreview);
  const hasContent=Boolean(text.trim()||imageFile||videoFile);
  const initials=author.display_name.split(" ").slice(0,2).map(p=>p[0]||"").join("").toUpperCase();

  useEffect(()=>{
    setDrafts(readDrafts());
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=previous;};
  },[]);

  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if(event.key!=="Escape")return;
      if(exitOpen){setExitOpen(false);return;}
      if(draftOpen){setDraftOpen(false);return;}
      if(audienceOpen||emojiOpen||placeOpen||moreOpen){
        setAudienceOpen(false);setEmojiOpen(false);setPlaceOpen(false);setMoreOpen(false);return;
      }
      if(hasContent)setExitOpen(true);
      else onClose();
    };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[exitOpen,draftOpen,audienceOpen,emojiOpen,placeOpen,moreOpen,hasContent,onClose]);

  const persist=(next:Draft[])=>{
    setDrafts(next);
    try{localStorage.setItem(DRAFT_KEY,JSON.stringify(next));}catch{}
  };
  const saveDraft=()=>{
    if(!text.trim()){onClose();return;}
    persist([{id:crypto.randomUUID(),text,savedAt:Date.now()},...drafts].slice(0,25));
    onClose();
  };
  const restoreDraft=(draft:Draft)=>{
    setText(draft.text);
    persist(drafts.filter(d=>d.id!==draft.id));
    setDraftOpen(false);
    window.requestAnimationFrame(()=>textArea.current?.focus());
  };
  const insert=(piece:string)=>{
    const next=text+piece;
    if(next.length>500)return;
    setText(next);
    window.requestAnimationFrame(()=>textArea.current?.focus());
  };
  const addPlace=()=>{
    const location=place.trim().slice(0,80);
    if(location)insert((text.endsWith("\n")||!text?"":"\n")+"📍 "+location);
    setPlace("");setPlaceOpen(false);
  };
  const requestExit=()=>{
    if(hasContent)setExitOpen(true);
    else onClose();
  };
  const openPanel=(panel:"emoji"|"place"|"more")=>{
    setEmojiOpen(panel==="emoji"?!emojiOpen:false);
    setPlaceOpen(panel==="place"?!placeOpen:false);
    setMoreOpen(panel==="more"?!moreOpen:false);
    setAudienceOpen(false);
  };

  return <div className="premium-composer-overlay" role="dialog" aria-modal="true" aria-label="Create a post on Blumbook">
    <form id="premium-compose-form" className="premium-composer-shell" onSubmit={onSubmit}>
      <header className="premium-composer-header">
        <button type="button" className="premium-compose-close" aria-label="Close composer" onClick={requestExit}><X size={24}/></button>
        <div className="premium-composer-header-actions">
          <button type="button" className="premium-compose-drafts-btn" onClick={()=>setDraftOpen(true)}><FileText size={17}/> Drafts{drafts.length>0&&<span>{drafts.length}</span>}</button>
          <button type="submit" className="premium-compose-post-btn" disabled={busy||!hasContent||text.length>500}><Send size={17}/>{busy?"Posting...":"Post"}</button>
        </div>
      </header>

      <main className="premium-composer-main">
        <div className="premium-compose-identity">
          <div className="premium-compose-avatar">
            {author.avatar_url?<img src={author.avatar_url} alt=""/>:<span>{initials}</span>}
          </div>
          <div className="premium-compose-user">
            <div className="premium-compose-author"><strong>{author.display_name}</strong>{author.verified&&<CheckCircle2 size={17} fill="currentColor" aria-label="Verified"/>}</div>
            <button type="button" className="premium-compose-audience" onClick={()=>setAudienceOpen(open=>!open)} aria-expanded={audienceOpen}><Globe2 size={15}/> Everyone can reply <ChevronDown size={14}/></button>
          </div>
        </div>
        {audienceOpen&&<div className="premium-compose-reply-notice" role="status"><Globe2 size={17}/><span>Replies are currently open to everyone. More audience controls are coming later.</span></div>}
        <label className="premium-compose-editor-label" htmlFor="premium-compose-text">Your post</label>
        <textarea
          id="premium-compose-text"
          ref={textArea}
          className="premium-compose-editor"
          autoFocus
          value={text}
          onChange={event=>setText(event.target.value)}
          maxLength={500}
          rows={7}
          placeholder={mode==="video"?"Tell us about your video…":mode==="photo"?"What’s happening in this photo?":"What’s happening?"}
          aria-label="Write your post"
        />
        {hasAttachment&&<div className="premium-compose-preview">
          {imagePreview?<img src={imagePreview} alt="Selected photo preview"/>:<video src={videoPreview} controls playsInline preload="metadata" aria-label="Selected video preview"/>}
          <button type="button" onClick={imagePreview?onRemoveImage:onRemoveVideo} aria-label="Remove attached media"><X size={17}/></button>
          <span className="premium-compose-preview-caption">{imagePreview?"Photo ready to share":"Video ready to share"}</span>
        </div>}
      </main>

      <div className="premium-compose-lower">
        <div className="premium-compose-media-rail" aria-label="Add media to this post">
          <label className="premium-compose-media-card premium-compose-photo">
            <ImagePlus size={23}/><span>Add photo</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onImage} aria-label="Select a photo" hidden/>
          </label>
          <label className="premium-compose-media-card premium-compose-camera">
            <Camera size={23}/><span>Camera</span>
            <input type="file" accept="image/*" capture="environment" onChange={onImage} aria-label="Take a photo" hidden/>
          </label>
          <label className="premium-compose-media-card premium-compose-record">
            <Video size={23}/><span>Record</span>
            <input type="file" accept="video/mp4,video/webm" capture="environment" onChange={onVideo} aria-label="Record a video" hidden/>
          </label>
          <div className="premium-compose-media-note">
            {imagePreview?<img src={imagePreview} alt="Your selected attachment"/>:videoPreview?<Clapperboard size={28}/>:<Plus size={23}/>}
            <span>{hasAttachment?"Attached":"Bring your ideas to life"}</span>
          </div>
        </div>

        <div className="premium-compose-visibility"><Globe2 size={16}/><span>Everyone can reply</span><small>{500-text.length} characters left</small></div>

        {(emojiOpen||placeOpen||moreOpen)&&<div className="premium-compose-tool-panel">
          {emojiOpen&&<div className="premium-compose-emoji-picker">{emojiChoices.map(emoji=><button type="button" key={emoji} onClick={()=>{insert(emoji);setEmojiOpen(false);}}>{emoji}</button>)}</div>}
          {placeOpen&&<div className="premium-compose-place-picker"><MapPin size={18}/><input aria-label="Enter a location" placeholder="Enter a city or place" maxLength={80} value={place} onChange={event=>setPlace(event.target.value)}/><button type="button" onClick={addPlace} disabled={!place.trim()}>Add</button></div>}
          {moreOpen&&<div className="premium-compose-more-picker">
            <button type="button" onClick={onAI}><Sparkles size={17}/> Write with Blum AI</button>
            <button type="button" onClick={onPoll}><BookmarkPlus size={17}/> Create a poll</button>
          </div>}
        </div>}
        <div className="premium-compose-bottom-toolbar">
          <label className="premium-compose-tool-button tool-blue" title="Add photo" aria-label="Attach an image"><ImagePlus size={23}/><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onImage} hidden/></label>
          <label className="premium-compose-tool-button tool-blue" title="Camera" aria-label="Take a photo"><Camera size={23}/><input type="file" accept="image/*" capture="environment" onChange={onImage} hidden/></label>
          <label className="premium-compose-tool-button tool-violet" title="Add video" aria-label="Attach a video"><Clapperboard size={23}/><input type="file" accept="video/mp4,video/webm" onChange={onVideo} hidden/></label>
          <label className="premium-compose-tool-button tool-pink" title="Attach GIF" aria-label="Attach a GIF"><span className="premium-compose-gif-icon">GIF</span><input type="file" accept="image/gif" onChange={onImage} hidden/></label>
          <button type="button" className="premium-compose-tool-button tool-green" aria-label="Create a poll" onClick={onPoll}><span className="premium-compose-poll-icon">≡</span></button>
          <button type="button" className="premium-compose-tool-button tool-blue" aria-label="Add location" aria-expanded={placeOpen} onClick={()=>openPanel("place")}><MapPin size={23}/></button>
          <button type="button" className="premium-compose-tool-button tool-gold" aria-label="Add emoji" aria-expanded={emojiOpen} onClick={()=>openPanel("emoji")}><Smile size={23}/></button>
          <button type="button" className="premium-compose-tool-button tool-blue premium-compose-more-btn" aria-label="More post tools" aria-expanded={moreOpen} onClick={()=>openPanel("more")}><MoreHorizontal size={23}/></button>
        </div>
      </div>

      {draftOpen&&<div className="premium-compose-draft-sheet" role="dialog" aria-label="Your saved drafts">
        <div className="premium-compose-draft-header"><button type="button" onClick={()=>setDraftOpen(false)} aria-label="Back to composer"><ArrowLeft size={22}/></button><h2>Your drafts</h2><button type="button" className="premium-compose-save-draft" onClick={saveDraft} disabled={!text.trim()}>Save current</button></div>
        <p>Drafts are saved as text on this device. Photos and videos must be reattached.</p>
        {drafts.length===0?<div className="premium-compose-empty-drafts"><FileText size={28}/><strong>No drafts yet</strong><span>Start writing, then save it for later.</span></div>:
        <div className="premium-compose-draft-list">{drafts.map(d=><div className="premium-compose-draft-row" key={d.id}>
          <button type="button" className="premium-compose-draft-text" onClick={()=>restoreDraft(d)}><strong>{d.text.slice(0,100)}</strong><small>{new Date(d.savedAt).toLocaleDateString()}</small></button>
          <button type="button" className="premium-compose-draft-delete" aria-label="Delete draft" onClick={()=>persist(drafts.filter(row=>row.id!==d.id))}><Trash2 size={18}/></button>
        </div>)}</div>}
      </div>}

      {exitOpen&&<div className="premium-compose-exit-shade" role="dialog" aria-label="Save or discard your post draft">
        <div className="premium-compose-exit-dialog">
          <h2>Keep your idea?</h2>
          <p>Save your writing as a draft, or discard this post. Attached media is not saved with drafts.</p>
          <button type="button" onClick={saveDraft} disabled={!text.trim()} className="premium-compose-exit-save"><FileText size={17}/> Save draft</button>
          <button type="button" onClick={onClose} className="premium-compose-exit-discard">Discard post</button>
          <button type="button" onClick={()=>setExitOpen(false)} className="premium-compose-exit-continue">Continue editing</button>
        </div>
      </div>}
    </form>
  </div>;
}
