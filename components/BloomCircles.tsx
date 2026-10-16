"use client";
import {useEffect,useState,type FormEvent} from "react";
import {ArrowLeft,ArrowRight,Check,Plus,Search,Send,UsersRound} from "lucide-react";
import {supabase,isCloudEnabled} from "@/lib/supabase";

type Circle={id:string;title:string;description:string;topic:string;icon:string;created_by:string};
type Discussion={id:string;circle_id:string;author_id:string;kind:string;body:string;created_at:string};
const demoCircles:Circle[]=[
{id:"d1",title:"Builders & Founders",description:"Turn ideas into products and meet collaborators.",topic:"Startups",icon:"✳",created_by:"demo"},
{id:"d2",title:"Creative Minds",description:"Create, share knowledge, and collaborate on original work.",topic:"Creators",icon:"◈",created_by:"demo"},
{id:"d3",title:"Learn Together",description:"Find study partners, mentors, and helpful resources.",topic:"Learning",icon:"◎",created_by:"demo"},
{id:"d4",title:"Future Tech",description:"AI, robotics and emerging technology that helps people.",topic:"Technology",icon:"⌘",created_by:"demo"}];
const demoThreads:Discussion[]=[
{id:"t1",circle_id:"d1",author_id:"demo",kind:"Opportunity",body:"Looking for a designer to collaborate on a community-focused startup. Let's connect.",created_at:new Date().toISOString()},
{id:"t2",circle_id:"d3",author_id:"demo",kind:"Question",body:"Which new skill are you learning? Share a useful resource.",created_at:new Date().toISOString()},
{id:"t3",circle_id:"d4",author_id:"demo",kind:"Idea",body:"How could AI support more local businesses?",created_at:new Date().toISOString()}];
export default function BloomCircles({userId,requestAuth,language}:{userId:string|null;requestAuth:()=>void;language:"en"|"ha"}){
 const [circles,setCircles]=useState<Circle[]>(isCloudEnabled?[]:demoCircles);
 const [joined,setJoined]=useState<string[]>([]);
 const [threads,setThreads]=useState<Discussion[]>(isCloudEnabled?[]:demoThreads);
 const [active,setActive]=useState<string|null>(null);
 const [search,setSearch]=useState("");
 const [creating,setCreating]=useState(false);
 const [name,setName]=useState("");
 const [description,setDescription]=useState("");
 const [topic,setTopic]=useState("Learning");
 const [kind,setKind]=useState("Idea");
 const [body,setBody]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const ha=language==="ha";
 const needUser=()=>{if(isCloudEnabled&&!userId){requestAuth();return false;}return true;};
 async function load(){
  if(!supabase)return;
  const [c,m]=await Promise.all([
    supabase.from("bloom_circles").select("*").order("created_at",{ascending:false}).limit(80),
    userId?supabase.from("bloom_circle_members").select("circle_id").eq("user_id",userId):Promise.resolve({data:[] as {circle_id:string}[]})
  ]);
  if(c.error){setError("Bloom Circles database needs the Phase 2 migration.");return;}
  setCircles((c.data||[]) as Circle[]);
  setJoined((m.data||[]).map(x=>x.circle_id));
 }
 useEffect(()=>{if(supabase)void load();},[userId]);
 async function open(id:string){
  setActive(id);setError("");
  if(!supabase)return;
  const {data,error}=await supabase.from("bloom_circle_posts").select("*").eq("circle_id",id).order("created_at",{ascending:false}).limit(80);
  if(error){setError(error.message);return;}
  setThreads(p=>[...p.filter(t=>t.circle_id!==id),...(data||[])]);
 }
 async function join(id:string){
  if(!needUser())return;
  const already=joined.includes(id);
  if(supabase&&userId){
   const q=supabase.from("bloom_circle_members");
   const {error}=already?await q.delete().eq("circle_id",id).eq("user_id",userId):await q.insert({circle_id:id,user_id:userId});
   if(error){setError(error.message);return;}
  }
  setJoined(p=>already?p.filter(x=>x!==id):[...p,id]);
 }
 async function addCircle(e:FormEvent){
  e.preventDefault();if(!needUser()||busy)return;
  if(name.trim().length<3||description.trim().length<10){setError("Enter a longer name and description.");return;}
  setBusy(true);
  const value={title:name.trim(),description:description.trim(),topic,icon:"◎"};
  if(supabase&&userId){
   const {data,error}=await supabase.from("bloom_circles").insert({...value,created_by:userId}).select().single();
   if(error){setError(error.message);setBusy(false);return;}
   const {error:joinError}=await supabase.from("bloom_circle_members").insert({circle_id:data.id,user_id:userId});
   if(joinError)setError("Circle created, but you need to join it: "+joinError.message);
   await load();setActive(data.id);
  }else{
   const id="local-"+Date.now();setCircles(p=>[{...value,id,created_by:"demo-me"},...p]);setJoined(p=>[...p,id]);setActive(id);
  }
  setCreating(false);setName("");setDescription("");setBusy(false);
 }
 async function addDiscussion(e:FormEvent){
  e.preventDefault();if(!active||!joined.includes(active)||!body.trim()||!needUser()||busy)return;
  setBusy(true);
  if(supabase&&userId){
   const {data,error}=await supabase.from("bloom_circle_posts").insert({circle_id:active,author_id:userId,kind,body:body.trim()}).select().single();
   if(error){setError(error.message);setBusy(false);return;}
   setThreads(p=>[data,...p]);
  }else setThreads(p=>[{id:"local-"+Date.now(),circle_id:active,author_id:"demo-me",kind,body:body.trim(),created_at:new Date().toISOString()},...p]);
  setBody("");setBusy(false);
 }
 const chosen=circles.find(c=>c.id===active);
 return <section className="bloom-root">
  <header className="bloom-heading"><small>BLUMBOOK ORIGINAL</small><h2>Bloom Circles <span>✳</span></h2><p>{ha?"Inda tattaunawa take zama dama.":"Where conversations become opportunities."}</p></header>
  {error&&<p className="bloom-error" role="status">{error}</p>}
  {!chosen?<div>
    <label className="bloom-search"><Search size={19}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={ha?"Nemo ƙungiya":"Find a circle"}/></label>
    <div className="bloom-tools"><strong>{ha?"Nemo ƙungiyoyi":"Find your people"}</strong><button onClick={()=>needUser()&&setCreating(!creating)}><Plus size={17}/>{ha?"Ƙirƙira":"Create circle"}</button></div>
    {creating&&<form onSubmit={addCircle} className="bloom-form"><h3>Start a circle</h3><input required maxLength={55} minLength={3} placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/><textarea required minLength={10} maxLength={280} rows={3} placeholder="What connects your community?" value={description} onChange={e=>setDescription(e.target.value)}/><select value={topic} onChange={e=>setTopic(e.target.value)}>{["Learning","Startups","Creators","Technology","Career","Community"].map(x=><option key={x}>{x}</option>)}</select><button className="primary-btn" disabled={busy}>Create</button></form>}
    <div className="bloom-list">{circles.filter(c=>(c.title+" "+c.topic+" "+c.description).toLowerCase().includes(search.toLowerCase())).map(c=><article className="bloom-card" key={c.id}>
     <button className="bloom-card-open" onClick={()=>void open(c.id)}><span className="bloom-symbol">{c.icon}</span><span><small>{c.topic}</small><strong>{c.title}</strong><span>{c.description}</span></span><ArrowRight size={18}/></button>
     <button className="bloom-join" onClick={()=>void join(c.id)}>{joined.includes(c.id)?<><Check size={15}/>{ha?"Ka shiga":"Joined"}</>:ha?"Shiga":"Join"}</button>
    </article>)}</div>
    {!circles.length&&<p className="bloom-empty">No circles yet. Create the first one.</p>}
  </div>:<div>
   <button className="bloom-back" onClick={()=>setActive(null)}><ArrowLeft size={18}/>{ha?"Komawa":"Back to circles"}</button>
   <div className="bloom-detail"><span className="bloom-symbol">{chosen.icon}</span><small>{chosen.topic}</small><h3>{chosen.title}</h3><p>{chosen.description}</p><button className="bloom-join" onClick={()=>void join(chosen.id)}>{joined.includes(chosen.id)?ha?"Ka shiga":"Joined":ha?"Shiga":"Join"}</button></div>
   {joined.includes(chosen.id)&&<form className="bloom-form" onSubmit={addDiscussion}><strong>{ha?"Ka wallafa ra'ayinka":"Start a conversation"}</strong><div className="bloom-kinds">{["Idea","Opportunity","Question"].map(k=><button type="button" aria-pressed={kind===k} key={k} onClick={()=>setKind(k)}>{k}</button>)}</div><textarea aria-label="Your discussion" required rows={3} maxLength={500} value={body} onChange={e=>setBody(e.target.value)} placeholder="Share an idea, question or opportunity..."/><button className="primary-btn" disabled={busy||!body.trim()}><Send size={16}/> Publish</button></form>}
   <div className="bloom-conversations"><h3>Conversations</h3>{threads.filter(t=>t.circle_id===chosen.id).map(t=><article key={t.id}><small>{t.kind} · {t.author_id===userId||t.author_id==="demo-me"?"You":"Member"}</small><p>{t.body}</p></article>)}{!threads.some(t=>t.circle_id===chosen.id)&&<p className="bloom-empty">Be the first to share a discussion.</p>}</div>
  </div>}
  {!isCloudEnabled&&<p className="bloom-footnote">Demo preview only. Connect Supabase and run the Phase 2 SQL migration for shared communities.</p>}
 </section>;
}
