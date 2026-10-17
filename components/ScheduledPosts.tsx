"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {ArrowRight,CalendarClock,Check,Clock3,Plus,Send,Trash2,X} from "lucide-react";
import {supabase,isCloudEnabled} from "@/lib/supabase";
type Entry={id:string;author_id:string;body:string;publish_at:string;status:"pending"|"published"|"failed";created_at:string};
export default function ScheduledPosts({userId,onSignIn,onCompose,launchCreate=0}:{userId:string|null;onSignIn:()=>void;onCompose:(text:string)=>void;launchCreate?:number}){
 const [entries,setEntries]=useState<Entry[]>([]),[open,setOpen]=useState(false),[body,setBody]=useState(""),[date,setDate]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const load=useCallback(async()=>{if(!supabase||!userId)return;const {data,error}=await supabase.from("scheduled_posts").select("id,author_id,body,publish_at,status,created_at").eq("author_id",userId).order("publish_at",{ascending:true}).limit(100);if(error){setMessage("Scheduled publishing needs Phase 6 database setup.");return;}setEntries((data||[]) as Entry[]);},[userId]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{if(launchCreate>0){if(isCloudEnabled&&!userId)onSignIn();else setOpen(true);}},[launchCreate,userId]);
 async function save(e:FormEvent){
  e.preventDefault();if(busy||!body.trim()||body.length>500)return;
  if(isCloudEnabled&&!userId){onSignIn();return;}
  const when=new Date(date).getTime();
  if(!Number.isFinite(when)||when<Date.now()+5*60000||when>Date.now()+90*86400000){setMessage("Choose a date between 5 minutes and 90 days from now.");return;}
  setBusy(true);
  if(supabase&&userId){
    const {error}=await supabase.from("scheduled_posts").insert({author_id:userId,body:body.trim(),publish_at:new Date(when).toISOString()});
    if(error){setBusy(false);setMessage(error.message);return;}await load();
  }else setEntries(p=>[...p,{id:"demo-"+Date.now(),author_id:"demo-me",body:body.trim(),publish_at:new Date(when).toISOString(),status:"pending" as const,created_at:new Date().toISOString()}].sort((a,b)=>a.publish_at.localeCompare(b.publish_at)));
  setBusy(false);setOpen(false);setBody("");setDate("");
  setMessage(supabase?"Saved. Automatic publishing requires the server scheduler to be activated.":"Demo reminder only — no automatic publishing.");
 }
 async function remove(entry:Entry){
  if(supabase&&userId){const {error}=await supabase.from("scheduled_posts").delete().eq("id",entry.id).eq("author_id",userId).eq("status","pending");if(error){setMessage(error.message);return;}}
  setEntries(p=>p.filter(x=>x.id!==entry.id));
 }
 return <section className="blum-scheduler"><header className="scheduler-top"><CalendarClock size={30}/><h2>Scheduled posts</h2><p>Plan ahead and create consistently. Posts scheduled on the server require the publishing worker to be activated.</p><button onClick={()=>isCloudEnabled&&!userId?onSignIn():setOpen(!open)}><Plus size={18}/> Schedule a post</button></header>
  {message&&<p className="feature-disclaimer" role="status">{message}<button onClick={()=>setMessage("")} aria-label="Dismiss"><X size={15}/></button></p>}
  {open&&<form className="schedule-form" onSubmit={save}><label>Post text<textarea required minLength={1} maxLength={500} rows={5} value={body} onChange={e=>setBody(e.target.value)} placeholder="Write what you'd like to share..."/></label><label>Publish date & time<input required type="datetime-local" value={date} onChange={e=>setDate(e.target.value)}/></label><button className="primary-btn" disabled={busy||!body.trim()}>Save schedule</button></form>}
  <div className="schedule-list"><h3>Content calendar</h3>{entries.length?entries.map(e=><article key={e.id}><div className="schedule-date"><Clock3 size={18}/><span>{new Date(e.publish_at).toLocaleString()}</span><small>{e.status}</small></div><p>{e.body}</p><div className="schedule-entry-actions">{e.status==="pending"&&<button onClick={()=>void remove(e)}><Trash2 size={16}/> Cancel</button>}{!isCloudEnabled&&<button onClick={()=>onCompose(e.body)}><Send size={16}/> Post manually</button>}{e.status==="published"&&<span><Check size={16}/> Published</span>}</div></article>):<div className="schedule-empty"><CalendarClock size={28}/><p>No posts scheduled yet.</p></div>}</div>
  <p className="scheduler-warning">A scheduled post does not automatically publish in demo mode. For live publishing, set up the Supabase Edge Function and cron secret described in the Phase 6 guide. Text posts only in this version.</p>
 </section>;
}
