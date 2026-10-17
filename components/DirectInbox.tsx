"use client";
import {useCallback,useEffect,useMemo,useState,type FormEvent} from "react";
import {ArrowLeft,Check,CheckCheck,Mail,MessageCircle,Search,Send} from "lucide-react";
import {supabase,isCloudEnabled} from "@/lib/supabase";
import type {Profile} from "@/lib/demo";
type DM={id:string;sender_id:string;recipient_id:string;body:string;created_at:string;read_at:string|null};
export default function DirectInbox({userId,profiles,initialRecipient,onRecipientChange,onSignIn}:{userId:string|null;profiles:Profile[];initialRecipient:string|null;onRecipientChange:(id:string|null)=>void;onSignIn:()=>void}){
 const [messages,setMessages]=useState<DM[]>([]);
 const [active,setActive]=useState<string|null>(initialRecipient),[query,setQuery]=useState(""),[draft,setDraft]=useState(""),[browse,setBrowse]=useState(false),[info,setInfo]=useState(""),[busy,setBusy]=useState(false);
 const me=userId||"demo-me";
 const load=useCallback(async()=>{
   if(!supabase||!userId){setMessages([]);return;}
   const {data,error}=await supabase.from("direct_messages").select("id,sender_id,recipient_id,body,created_at,read_at").or("sender_id.eq."+userId+",recipient_id.eq."+userId).order("created_at",{ascending:false}).limit(250);
   if(error)setInfo("Messages need the Phase 5 database migration.");else setMessages((data||[]) as DM[]);
 },[userId]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{setActive(initialRecipient);},[initialRecipient]);
 useEffect(()=>{if(!supabase||!userId)return;const db=supabase;const sub=db.channel("blumbook-dms-"+userId).on("postgres_changes",{event:"INSERT",schema:"public",table:"direct_messages"},()=>void load()).subscribe();return()=>{void db.removeChannel(sub);};},[userId,load]);
 useEffect(()=>{if(!supabase||!userId||!active)return;void supabase.from("direct_messages").update({read_at:new Date().toISOString()}).eq("recipient_id",userId).eq("sender_id",active).is("read_at",null);},[active,userId,messages.length]);
 const demo:DM[]=isCloudEnabled?[]:[{id:"sample",sender_id:"amina",recipient_id:me,body:"This is a demo conversation. No one sent this message.",created_at:new Date().toISOString(),read_at:null}];
 const all=[...messages,...demo];
 const threads=useMemo(()=>{const m=new Map<string,DM>();all.forEach(x=>{const id=x.sender_id===me?x.recipient_id:x.sender_id;const last=m.get(id);if(!last||new Date(x.created_at)>new Date(last.created_at))m.set(id,x);});return [...m].sort((a,b)=>b[1].created_at.localeCompare(a[1].created_at));},[messages,me]);
 const current=profiles.find(p=>p.id===active);
 const conversation=all.filter(x=>(x.sender_id===active&&x.recipient_id===me)||(x.sender_id===me&&x.recipient_id===active)).sort((a,b)=>a.created_at.localeCompare(b.created_at));
 function choose(id:string|null){setActive(id);onRecipientChange(id);setBrowse(false);}
 async function send(e:FormEvent){e.preventDefault();if(!active||!draft.trim()||busy)return;if(isCloudEnabled&&!userId){onSignIn();return;}
  setBusy(true);
  if(supabase&&userId){const {data,error}=await supabase.from("direct_messages").insert({sender_id:userId,recipient_id:active,body:draft.trim()}).select().single();if(error)setInfo(error.message);else{setMessages(p=>[data,...p]);setDraft("");}}
  else{setMessages(p=>[{id:"demo-"+Date.now(),sender_id:me,recipient_id:active,body:draft.trim(),created_at:new Date().toISOString(),read_at:null},...p]);setDraft("");setInfo("Demo only: your message was not delivered.");}
  setBusy(false);
 }
 return <section className="dm-app">
  <header className="dm-top"><div><h2>{current?.display_name||"Messages"}</h2><small>{current?"@"+current.username:"Private conversations"}</small></div>{active?<button onClick={()=>choose(null)}><ArrowLeft size={18}/> Back</button>:<button onClick={()=>setBrowse(!browse)}><Mail size={17}/> New</button>}</header>
  {!isCloudEnabled&&<p className="feature-disclaimer">Demo messages are not sent or saved to a server.</p>}
  {info&&<p className="feature-disclaimer" role="status">{info}</p>}
  {isCloudEnabled&&!userId?<div className="dm-empty"><MessageCircle size={30}/><h3>Welcome to Messages</h3><p>Sign in to send private messages.</p><button className="primary-btn" onClick={onSignIn}>Log in</button></div>:
  active?<div className="dm-chat"><div className="dm-history">{conversation.length?conversation.map(m=><div key={m.id} className={"dm-bubble "+(m.sender_id===me?"outgoing":"incoming")}><p>{m.body}</p><small>{new Date(m.created_at).toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit"})} {m.sender_id===me&&(m.read_at?<CheckCheck size={13}/>:<Check size={13}/>)}</small></div>):<p className="dm-empty">Introduce yourself and start a conversation.</p>}</div><form className="dm-send" onSubmit={send}><input aria-label="Message" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Write a message" maxLength={1500}/><button disabled={!draft.trim()||busy} aria-label="Send"><Send size={20}/></button></form></div>:
  <><div className="dm-search"><Search size={17}/><input placeholder="Search people" value={query} onChange={e=>{setQuery(e.target.value);setBrowse(true);}}/></div>
   {browse?profiles.filter(p=>p.id!==me&&(p.display_name+" "+p.username).toLowerCase().includes(query.toLowerCase())).slice(0,30).map(p=><button className="dm-thread" key={p.id} onClick={()=>choose(p.id)}><span className="dm-circle">{p.display_name[0]}</span><span><strong>{p.display_name}</strong><small>@{p.username}</small></span></button>):
    threads.length?threads.map(([id,m])=><button className="dm-thread" onClick={()=>choose(id)} key={id}><span className="dm-circle">{profiles.find(p=>p.id===id)?.display_name[0]||"B"}</span><span><strong>{profiles.find(p=>p.id===id)?.display_name||"Member"}</strong><small>{m.body}</small></span></button>):<div className="dm-empty"><MessageCircle size={30}/><h3>No conversations yet</h3><p>Find someone and start talking.</p><button onClick={()=>setBrowse(true)} className="primary-btn">New message</button></div>}
  </>}
 </section>;
}
