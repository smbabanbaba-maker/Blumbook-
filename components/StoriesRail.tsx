"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {Camera,ChevronLeft,ChevronRight,Clock3,Plus,Trash2,X} from "lucide-react";
import {supabase,isCloudEnabled} from "@/lib/supabase";
import type {Profile} from "@/lib/demo";
import {SHOWCASE_STORIES,SHOWCASE_PEOPLE} from "@/lib/demo-showcase";
type Story={id:string;author_id:string;media_url:string;media_type:"image"|"video";caption:string;created_at:string;expires_at:string};
const valid=(f:File)=>{const image=["image/jpeg","image/png","image/webp","image/gif"].includes(f.type);const video=["video/mp4","video/webm"].includes(f.type);return (image&&f.size<=5*1024*1024)||(video&&f.size<=30*1024*1024);};
export default function StoriesRail({userId,profiles,onSignIn,launchCreate=0,compact=false,forceDemo=false,showcaseWhenEmpty=false}:{userId:string|null;profiles:Profile[];onSignIn:()=>void;launchCreate?:number;compact?:boolean;forceDemo?:boolean;showcaseWhenEmpty?:boolean}){
 const [stories,setStories]=useState<Story[]>(forceDemo?SHOWCASE_STORIES:[]),[selected,setSelected]=useState<number|null>(null),[creating,setCreating]=useState(false);
 const [storiesLoading,setStoriesLoading]=useState(Boolean(supabase&&!forceDemo));
 const [file,setFile]=useState<File|null>(null),[preview,setPreview]=useState(""),[caption,setCaption]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const me=userId||"demo-me";
 const load=useCallback(async()=>{
  if(!supabase||forceDemo)return;
  try{
    const {data,error}=await supabase.from("stories").select("id,author_id,media_url,media_type,caption,created_at,expires_at").gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false}).limit(80);
    if(error){setMessage("Stories need the Phase 6 migration.");return;}
    setStories((data||[]) as Story[]);
  }finally{setStoriesLoading(false);}
 },[forceDemo]);
 useEffect(()=>{void load();},[load,userId]);
 useEffect(()=>{if(launchCreate>0){if(isCloudEnabled&&!forceDemo&&!userId)onSignIn();else setCreating(true);}},[launchCreate,userId,forceDemo]);
 const live=stories.filter(s=>new Date(s.expires_at).getTime()>Date.now());
 // Show fictional *labeled* Story previews only when the real feed is empty.
 // Never seed live database tables or count sample story views.
 const previewStories=!forceDemo&&showcaseWhenEmpty&&!storiesLoading&&live.length===0;
 const visibleStories:Story[]=previewStories?SHOWCASE_STORIES.slice(0,8):live;
 const current=selected===null?null:visibleStories[selected]||null;
 const owner=(id:string)=>profiles.find(p=>p.id===id)||(previewStories?SHOWCASE_PEOPLE.find(p=>p.id===id):undefined);
 function pick(f:File|undefined){if(!f)return;if(!valid(f)){setMessage("Use an image under 5 MB or an MP4/WebM under 30 MB.");return;}if(preview.startsWith("blob:"))URL.revokeObjectURL(preview);setFile(f);setPreview(URL.createObjectURL(f));setMessage("");}
 function closeForm(){setCreating(false);setFile(null);setCaption("");if(preview.startsWith("blob:"))URL.revokeObjectURL(preview);setPreview("");}
 async function publish(e:FormEvent){
  e.preventDefault();if(!file||busy)return;if(isCloudEnabled&&!forceDemo&&!userId){onSignIn();return;}
  setBusy(true);
  try{
   const media_type:Story["media_type"]=file.type.startsWith("image/")?"image":"video";
   let url=preview;
   if(supabase&&userId&&!forceDemo){
    const ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":file.type==="image/gif"?"gif":file.type==="video/webm"?"webm":file.type==="video/mp4"?"mp4":"jpg";
    const path=userId+"/stories/"+crypto.randomUUID()+"."+ext;
    const bucket=media_type==="video"?"post-videos":"post-media";
    const {error}=await supabase.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type});
    if(error)throw new Error("Upload failed: "+error.message);
    url=supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    const {error:dbError}=await supabase.from("stories").insert({author_id:userId,media_url:url,media_type,caption:caption.trim()});
    if(dbError)throw new Error(dbError.message);
    closeForm();await load();setMessage("Story published for 24 hours.");
   } else {
    const time=new Date();
    setStories(p=>[{id:"demo-"+Date.now(),author_id:me,media_url:url,media_type,caption:caption.trim(),created_at:time.toISOString(),expires_at:new Date(time.getTime()+86400000).toISOString()},...p]);
    setCreating(false);setFile(null);setCaption("");setPreview("");
    setMessage("Demo story: visible only during this visit.");
   }
  }catch(err){setMessage(err instanceof Error?err.message:"Could not publish story.");}
  finally{setBusy(false);}
 }
 async function open(i:number){
  const item=visibleStories[i];if(!item)return;setSelected(i);
  if(supabase&&userId&&!forceDemo&&!previewStories&&item.author_id!==userId){
   await supabase.from("story_views").upsert({story_id:item.id,viewer_id:userId},{onConflict:"story_id,viewer_id",ignoreDuplicates:true});
  }
 }
 async function remove(item:Story){
  if(item.author_id!==me)return;
  if(supabase&&userId&&!forceDemo){const {error}=await supabase.from("stories").delete().eq("id",item.id).eq("author_id",userId);if(error){setMessage(error.message);return;}}
  setStories(p=>p.filter(s=>s.id!==item.id));setSelected(null);
 }
 return <section className="blum-stories" aria-label="Stories">
  {!compact&&<div className="stories-head"><h2>Stories <span>24-hour moments</span></h2><button onClick={()=>{if(isCloudEnabled&&!forceDemo&&!userId)onSignIn();else setCreating(true);}}><Plus size={17}/> Add</button></div>}
  {message&&!compact&&<p className="feature-disclaimer" role="status">{message} <button onClick={()=>setMessage("")} aria-label="Dismiss"><X size={14}/></button></p>}
  <div className="stories-row facebook-stories-row" aria-label="Browse stories">
   <button className="story-tile fb-story-card fb-story-create" aria-label="Create your story" onClick={()=>{if(isCloudEnabled&&!forceDemo&&!userId)onSignIn();else setCreating(true);}}>
     <span className="fb-story-create-cover">
       {profiles.find(p=>p.id===me)?.avatar_url?
        <img src={profiles.find(p=>p.id===me)?.avatar_url||""} loading="lazy" alt=""/>:
        <span className="fb-story-create-initial">{(profiles.find(p=>p.id===me)?.display_name||"You").slice(0,1).toUpperCase()}</span>}
     </span>
     <span className="fb-story-create-footer">
       <span className="fb-story-create-badge"><Plus size={18} strokeWidth={3}/></span>
       <span>Create story</span>
     </span>
   </button>
   {visibleStories.map((item,i)=>{
     const person=owner(item.author_id);
     const name=item.author_id===me?"Your story":person?.display_name||"Member";
     return <button className="story-tile fb-story-card fb-story-active" key={item.id} aria-label={"View story by "+name} onClick={()=>void open(i)}>
       <span className="fb-story-media">
         {item.media_type==="image"?<img src={item.media_url} loading="lazy" alt=""/>:
           <span className="fb-story-video-cover"><Camera size={27}/></span>}
       </span>
       <span className="fb-story-shade" aria-hidden="true"/>
       {previewStories&&<span className="fb-story-preview-chip">PREVIEW</span>}
       <span className="fb-story-profile-ring">
         {person?.avatar_url?<img src={person.avatar_url} loading="lazy" alt=""/>:
           <span>{name.slice(0,1).toUpperCase()}</span>}
       </span>
       <span className="fb-story-name">{name}</span>
     </button>;
   })}
   {!compact&&!visibleStories.length&&<span className="stories-empty">Be the first to share a moment.</span>}
  </div>
  {creating&&<div className="stories-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)closeForm();}}><form className="stories-dialog" onSubmit={publish} aria-label="Create story"><header><strong>New story</strong><button type="button" aria-label="Close" onClick={closeForm}><X size={22}/></button></header><p>Share a moment that disappears from the story feed after 24 hours.</p><label className="story-file-pick"><Camera size={19}/> Choose photo or video<input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={e=>pick(e.target.files?.[0])}/></label>{preview&&(file?.type.startsWith("video/")?<video src={preview} controls playsInline/>:<img src={preview} alt="Story preview"/>)}<textarea value={caption} maxLength={180} onChange={e=>setCaption(e.target.value)} placeholder="Add a caption (optional)"/><button className="primary-btn" disabled={!file||busy}>{busy?"Sharing...":"Share story"}</button></form></div>}
  {current&&<div className="stories-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}><section className="stories-viewer" aria-label="Story viewer"><header><strong>{owner(current.author_id)?.display_name||"Member"}</strong><small>{previewStories?<>Preview · Sample story</>:<><Clock3 size={14}/> Expires in {Math.max(1,Math.ceil((new Date(current.expires_at).getTime()-Date.now())/3600000))}h</>}</small><button onClick={()=>setSelected(null)} aria-label="Close story"><X size={22}/></button></header>{current.media_type==="video"?<video key={current.id} src={current.media_url} controls autoPlay playsInline/>:<img src={current.media_url} alt={current.caption||"Story media"}/>}<p>{current.caption}</p><footer><button onClick={()=>setSelected(Math.max(0,(selected||0)-1))} disabled={selected===0}><ChevronLeft/> Previous</button>{!previewStories&&current.author_id===me&&<button onClick={()=>void remove(current)}><Trash2 size={16}/> Delete</button>}<button onClick={()=>setSelected(Math.min(visibleStories.length-1,(selected||0)+1))} disabled={selected===visibleStories.length-1}>Next <ChevronRight/></button></footer></section></div>}
 </section>;
}
