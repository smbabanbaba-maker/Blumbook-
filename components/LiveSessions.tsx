"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {CalendarClock,ExternalLink,Headphones,Plus,Radio,Users,Video,X} from "lucide-react";
import {supabase,isCloudEnabled} from "@/lib/supabase";
import type {Profile} from "@/lib/demo";
type Session={id:string;host_id:string;title:string;description:string;mode:"audio"|"video";starts_at:string;status:"scheduled"|"live"|"ended";broadcast_url:string|null;created_at:string};
export default function LiveSessions({userId,profiles,onSignIn,launchCreate=0}:{userId:string|null;profiles:Profile[];onSignIn:()=>void;launchCreate?:number}){
 const [items,setItems]=useState<Session[]>([]),[mine,setMine]=useState<string[]>([]);
 const [creating,setCreating]=useState(false),[title,setTitle]=useState(""),[description,setDescription]=useState(""),[mode,setMode]=useState<"audio"|"video">("audio"),[starts,setStarts]=useState(""),[url,setUrl]=useState(""),[editUrl,setEditUrl]=useState(""),[editing,setEditing]=useState<string|null>(null),[busy,setBusy]=useState(false),[status,setStatus]=useState("");
 const me=userId||"demo-me";
 const load=useCallback(async()=>{
  if(!supabase)return;
  const [sessions,joined]=await Promise.all([
    supabase.from("live_sessions").select("*").neq("status","ended").order("starts_at",{ascending:true}).limit(50),
    userId?supabase.from("live_attendees").select("session_id").eq("user_id",userId):Promise.resolve({data:[] as {session_id:string}[]})
  ]);
  if(sessions.error){setStatus("Live directory requires the Phase 6 migration.");return;}
  setItems((sessions.data||[]) as Session[]);setMine((joined.data||[]).map(x=>x.session_id));
 },[userId]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{if(launchCreate>0){if(isCloudEnabled&&!userId)onSignIn();else setCreating(true);}},[launchCreate,userId]);
 const validUrl=(text:string)=>{try{return new URL(text).protocol==="https:";}catch{return false;}};
 async function create(e:FormEvent){
  e.preventDefault();if(busy||title.trim().length<5)return;
  if(isCloudEnabled&&!userId){onSignIn();return;}
  if(url&&!validUrl(url)){setStatus("Broadcast link must begin with https://");return;}
  if(!starts||new Date(starts).getTime()<Date.now()-60000){setStatus("Choose a future start time.");return;}
  setBusy(true);
  const input={host_id:me,title:title.trim(),description:description.trim(),mode,starts_at:new Date(starts).toISOString(),broadcast_url:url.trim()||null,status:"scheduled" as const};
  if(supabase&&userId){const {error}=await supabase.from("live_sessions").insert(input);if(error){setStatus(error.message);setBusy(false);return;}await load();}
  else setItems(p=>[{...input,id:"demo-"+Date.now(),created_at:new Date().toISOString()},...p]);
  setCreating(false);setBusy(false);setTitle("");setDescription("");setUrl("");setStarts("");
  setStatus(isCloudEnabled?"Session scheduled.":"Demo session created only for this browser session.");
 }
 async function rsvp(session:Session){
  if(isCloudEnabled&&!userId){onSignIn();return;}
  if(supabase&&userId){
   if(mine.includes(session.id)){const {error}=await supabase.from("live_attendees").delete().eq("session_id",session.id).eq("user_id",userId);if(error){setStatus(error.message);return;}}
   else {const {error}=await supabase.from("live_attendees").insert({session_id:session.id,user_id:userId});if(error){setStatus(error.message);return;}}
  }
  setMine(p=>p.includes(session.id)?p.filter(x=>x!==session.id):[...p,session.id]);
 }
 async function update(session:Session,next:"live"|"ended"){
  if(!userId&&isCloudEnabled){onSignIn();return;}
  if(next==="live"&&!validUrl(editUrl||session.broadcast_url||"")){setStatus("Add an HTTPS broadcast link from your streaming provider before going live.");setEditing(session.id);return;}
  if(supabase&&userId){const {error}=await supabase.from("live_sessions").update({status:next,broadcast_url:next==="live"?(editUrl||session.broadcast_url):session.broadcast_url}).eq("id",session.id).eq("host_id",userId);if(error){setStatus(error.message);return;}}
  setItems(p=>p.map(x=>x.id===session.id?{...x,status:next,broadcast_url:next==="live"?(editUrl||session.broadcast_url):session.broadcast_url}:x));
  setEditing(null);setEditUrl("");
  setStatus(next==="live"?"Live link is now available to attendees.":"Session ended.");
 }
 return <section className="blum-live-page">
 <header className="live-hero"><span><Radio size={16}/> BLUM LIVE</span><h2>Bring people together.</h2><p>Schedule a community conversation and invite people to join your live audio or video broadcast.</p><button onClick={()=>isCloudEnabled&&!userId?onSignIn():setCreating(!creating)}><Plus size={17}/> Host a session</button></header>
 <p className="feature-disclaimer">Live hosting currently uses an external HTTPS broadcast link (such as your streaming provider). Native in-app broadcasting is not yet available.</p>
 {status&&<p className="feature-disclaimer" role="status">{status}<button aria-label="Dismiss" onClick={()=>setStatus("")}><X size={15}/></button></p>}
 {creating&&<form className="live-create" onSubmit={create}><h3>Plan a live session</h3><input required minLength={5} maxLength={100} placeholder="Topic of your conversation" value={title} onChange={e=>setTitle(e.target.value)}/><textarea maxLength={600} rows={3} placeholder="What will people learn or discuss?" value={description} onChange={e=>setDescription(e.target.value)}/><label>Format<select value={mode} onChange={e=>setMode(e.target.value as "audio"|"video")}><option value="audio">Audio discussion</option><option value="video">Video broadcast</option></select></label><label>Starts at<input type="datetime-local" required value={starts} onChange={e=>setStarts(e.target.value)}/></label><label>Broadcast link (HTTPS, optional until starting)<input type="url" placeholder="https://..." value={url} onChange={e=>setUrl(e.target.value)}/></label><button className="primary-btn" disabled={busy}>Schedule session</button></form>}
 <div className="live-list-head"><h3>Upcoming & live sessions</h3><small>{items.length} listed</small></div>
 {items.length?items.map(item=><article key={item.id} className="live-card"><div className="live-card-top"><span className={item.status==="live"?"is-live":"is-scheduled"}>{item.status==="live"?<Radio size={16}/>:<CalendarClock size={16}/>} {item.status==="live"?"LIVE NOW":"SCHEDULED"}</span>{item.mode==="audio"?<Headphones size={20}/>:<Video size={20}/>}</div><h3>{item.title}</h3><p>{item.description||"Join a meaningful community conversation."}</p><div className="live-details"><span>By {profiles.find(p=>p.id===item.host_id)?.display_name||"Member"}</span><time>{new Date(item.starts_at).toLocaleString()}</time></div><div className="live-card-actions">
  {item.host_id===me?<><button onClick={()=>setEditing(item.id)}>{item.status==="live"?"Update broadcast":"Start live"}</button><button onClick={()=>void update(item,"ended")}>End session</button></>:<button onClick={()=>void rsvp(item)}><Users size={16}/>{mine.includes(item.id)?"Going ✓":"RSVP"}</button>}
  {item.status==="live"&&item.broadcast_url&&<a href={item.broadcast_url} target="_blank" rel="noopener noreferrer">Join broadcast <ExternalLink size={15}/></a>}
 </div>
 {editing===item.id&&<div className="live-start-box"><input type="url" placeholder="HTTPS streaming link" value={editUrl||item.broadcast_url||""} onChange={e=>setEditUrl(e.target.value)}/><button onClick={()=>void update(item,"live")}>Publish live link</button><button onClick={()=>{setEditing(null);setEditUrl("");}}>Cancel</button></div>}
 </article>):<div className="live-empty"><Radio size={34}/><h3>Nothing scheduled yet</h3><p>Host the first conversation on Blumbook.</p></div>}
 </section>;
}
