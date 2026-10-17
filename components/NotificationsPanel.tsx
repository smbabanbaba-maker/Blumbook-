"use client";
import {useCallback,useEffect,useState} from "react";
import {Bell,Check,Heart,Mail,MessageCircle,UserRoundPlus} from "lucide-react";
import {supabase,isCloudEnabled} from "@/lib/supabase";
import {DEMO_NOTICES,type Profile} from "@/lib/demo";
type Notice={id:string;recipient_id:string;actor_id:string;type:"like"|"follow"|"reply"|"message";post_id:string|null;created_at:string;read_at:string|null};
const types=["All","Mentions","Likes","Follows","Messages"];
export default function NotificationsPanel({userId,profiles,onSignIn,onProfile,onPost,onMessage,prefs}:{userId:string|null;profiles:Profile[];onSignIn:()=>void;onProfile:(id:string)=>void;onPost:(id:string)=>void;onMessage:(id:string)=>void;prefs:{likes:boolean;follows:boolean;replies:boolean}}){
 const [rows,setRows]=useState<Notice[]>([]),[filter,setFilter]=useState("All"),[info,setInfo]=useState("");
 const load=useCallback(async()=>{if(!supabase||!userId){setRows([]);return;}const {data,error}=await supabase.from("user_notifications").select("id,recipient_id,actor_id,type,post_id,created_at,read_at").eq("recipient_id",userId).order("created_at",{ascending:false}).limit(100);if(error)setInfo("Notifications need the Phase 5 SQL migration.");else setRows(data||[]);},[userId]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{if(!supabase||!userId)return;const db=supabase;const ch=db.channel("blumbook-alerts-"+userId).on("postgres_changes",{event:"INSERT",schema:"public",table:"user_notifications"},()=>void load()).subscribe();return()=>{void db.removeChannel(ch);};},[userId,load]);
 const visible=rows.filter(x=>(x.type==="like"?prefs.likes:x.type==="follow"?prefs.follows:x.type==="reply"?prefs.replies:true)&&(filter==="All"||(filter==="Mentions"&&x.type==="reply")||(filter==="Likes"&&x.type==="like")||(filter==="Follows"&&x.type==="follow")||(filter==="Messages"&&x.type==="message")));
 async function open(x:Notice){
   if(supabase&&!x.read_at){await supabase.from("user_notifications").update({read_at:new Date().toISOString()}).eq("id",x.id);setRows(p=>p.map(t=>t.id===x.id?{...t,read_at:new Date().toISOString()}:t));}
   if(x.type==="follow")onProfile(x.actor_id);else if(x.type==="message")onMessage(x.actor_id);else if(x.post_id)onPost(x.post_id);
 }
 async function readAll(){if(!supabase||!userId)return;const {error}=await supabase.from("user_notifications").update({read_at:new Date().toISOString()}).eq("recipient_id",userId).is("read_at",null);if(error)setInfo(error.message);else setRows(p=>p.map(t=>({...t,read_at:t.read_at||new Date().toISOString()})));}
 const title=(x:Notice)=>x.type==="follow"?"followed you":x.type==="like"?"liked your post":x.type==="message"?"messaged you":"replied to your post";
 return <section className="notify-app"><header className="notify-head"><div><h2>Notifications</h2><p>Updates from your community</p></div>{rows.some(x=>!x.read_at)&&<button onClick={()=>void readAll()}><Check size={17}/> Read all</button>}</header>
 <div className="notify-filters">{types.map(t=><button key={t} className={filter===t?"selected":""} onClick={()=>setFilter(t)}>{t}</button>)}</div>
 {!isCloudEnabled&&<p className="feature-disclaimer">Sample notifications — no real activity is being tracked.</p>}
 {info&&<p className="feature-disclaimer" role="status">{info}</p>}
 {isCloudEnabled&&!userId?<div className="dm-empty"><Bell size={31}/><h3>You're not signed in</h3><button className="primary-btn" onClick={onSignIn}>Log in</button></div>:isCloudEnabled?
 visible.length?visible.map(x=>{const Icon=x.type==="like"?Heart:x.type==="follow"?UserRoundPlus:x.type==="message"?Mail:MessageCircle;return <button onClick={()=>void open(x)} key={x.id} className={"notify-row "+(!x.read_at?"unread":"")}><Icon size={21}/><span><strong>{profiles.find(p=>p.id===x.actor_id)?.display_name||"A member"}</strong> {title(x)}<small>{new Date(x.created_at).toLocaleString()}</small></span>{!x.read_at&&<i/>}</button>;}):<div className="dm-empty"><Bell size={31}/><h3>All caught up</h3><p>New interactions will appear here.</p></div>:
 DEMO_NOTICES.filter(n=>filter==="All"||(filter==="Mentions"&&n.kind==="reply")||(filter==="Likes"&&n.kind==="like")||(filter==="Follows"&&n.kind==="follow")).map(n=><div className="notify-row" key={n.id}><Bell size={20}/><span><strong>{n.person}</strong> {n.text}<small>Sample · {n.time}</small></span></div>)}
 </section>;
}
