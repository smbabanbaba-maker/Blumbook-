"use client";
import {useEffect,useState,type FormEvent} from "react";
import {ArrowRight,BriefcaseBusiness,Plus,Search,Send,X} from "lucide-react";
import {supabase,isCloudEnabled} from "@/lib/supabase";
import type {Profile} from "@/lib/demo";
type Op={id:string;author_id:string;title:string;description:string;category:string;location_type:string;status:string;created_at:string};
const categories=["All","Collaboration","Mentorship","Project","Freelance","Learning"];
const demo:Op[]=[
{id:"demo-o1",author_id:"amina",title:"Let's build a creative collaboration",description:"I'm looking to connect with a designer or editor to work on a community-first storytelling project.",category:"Collaboration",location_type:"Remote",status:"open",created_at:new Date().toISOString()},
{id:"demo-o2",author_id:"ibrahim",title:"Help build a community learning app",description:"I'm exploring a learning project and would like to meet developers and educators interested in contributing.",category:"Project",location_type:"Hybrid",status:"open",created_at:new Date().toISOString()}];
export default function OpportunityHub({userId,profiles,onSignIn,onProfile}:{userId:string|null;profiles:Profile[];onSignIn:()=>void;onProfile:(id:string)=>void}){
 const [items,setItems]=useState<Op[]>(isCloudEnabled?[]:demo);
 const [filter,setFilter]=useState("All"),[query,setQuery]=useState("");
 const [creating,setCreating]=useState(false),[title,setTitle]=useState(""),[body,setBody]=useState(""),[category,setCategory]=useState("Collaboration"),[place,setPlace]=useState("Remote");
 const [selected,setSelected]=useState<Op|null>(null),[interest,setInterest]=useState(""),[sent,setSent]=useState<string[]>([]),[busy,setBusy]=useState(false),[info,setInfo]=useState("");
 const auth=()=>{if(isCloudEnabled&&!userId){onSignIn();return false;}return true;};
 async function load(){if(!supabase)return;const [op,my]=await Promise.all([supabase.from("opportunities").select("*").order("created_at",{ascending:false}).limit(100),userId?supabase.from("opportunity_interests").select("opportunity_id").eq("sender_id",userId):Promise.resolve({data:[] as {opportunity_id:string}[]})]);if(op.error){setInfo("Database pending: apply Phase 5 migration.");return;}setItems(op.data||[]);setSent((my.data||[]).map(v=>v.opportunity_id));}
 useEffect(()=>{void load();},[userId]);
 async function create(e:FormEvent){e.preventDefault();if(!auth()||busy||title.trim().length<5||body.trim().length<20)return;setBusy(true);
 if(supabase&&userId){const {error}=await supabase.from("opportunities").insert({author_id:userId,title:title.trim(),description:body.trim(),category,location_type:place});if(error){setInfo(error.message);setBusy(false);return;}await load();}
 else setItems(p=>[{id:"d-"+Date.now(),author_id:"demo-me",title:title.trim(),description:body.trim(),category,location_type:place,status:"open",created_at:new Date().toISOString()},...p]);
 setCreating(false);setTitle("");setBody("");setBusy(false);setInfo(isCloudEnabled?"Opportunity published.":"Demo entry: not saved or shared.");}
 async function apply(e:FormEvent){e.preventDefault();if(!selected||!auth()||interest.trim().length<10||busy)return;setBusy(true);
 if(supabase&&userId){const {error}=await supabase.from("opportunity_interests").insert({opportunity_id:selected.id,sender_id:userId,message:interest.trim()});if(error){setInfo(error.message);setBusy(false);return;}}
 setSent(p=>[...p,selected.id]);setSelected(null);setInterest("");setBusy(false);setInfo(isCloudEnabled?"Interest sent privately to the listing owner.":"Demo only: no actual message was sent.");}
 async function close(item:Op){if(!supabase||!userId)return;const next=item.status==="open"?"closed":"open";const {error}=await supabase.from("opportunities").update({status:next}).eq("id",item.id).eq("author_id",userId);if(error){setInfo(error.message);return;}setItems(p=>p.map(o=>o.id===item.id?{...o,status:next}:o));}
 const shown=items.filter(o=>(filter==="All"||o.category===filter)&&(o.title+" "+o.description).toLowerCase().includes(query.toLowerCase()));
 return <section className="opp-root"><div className="opp-head"><small>BLUMBOOK ORIGINAL</small><h2>Bloom Opportunities</h2><p>Find collaborators, mentors, projects and chances to grow.</p><button onClick={()=>auth()&&setCreating(!creating)}><Plus size={19}/> Share an opportunity</button></div>
 {!isCloudEnabled&&<p className="feature-disclaimer">Interactive preview. Messages here are not delivered to real people.</p>}
 {info&&<p className="feature-disclaimer" role="status">{info} <button onClick={()=>setInfo("")} aria-label="Dismiss"><X size={15}/></button></p>}
 {creating&&<form className="opp-form" onSubmit={create}><h3>New opportunity</h3><input required minLength={5} maxLength={110} placeholder="Opportunity title" value={title} onChange={e=>setTitle(e.target.value)}/><textarea required minLength={20} maxLength={2000} rows={5} placeholder="Who are you hoping to meet and why?" value={body} onChange={e=>setBody(e.target.value)}/><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select><select value={place} onChange={e=>setPlace(e.target.value)}>{["Remote","Hybrid","In-person"].map(x=><option key={x}>{x}</option>)}</select><button className="primary-btn" disabled={busy}>Publish opportunity</button></form>}
 <label className="opp-search"><Search size={19}/><input aria-label="Search opportunities" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search opportunities"/></label>
 <div className="opp-filters">{categories.map(c=><button key={c} className={filter===c?"active":""} onClick={()=>setFilter(c)}>{c}</button>)}</div>
 {shown.length?shown.map(o=><article className="opp-card" key={o.id}><div><small>{o.category} · {o.location_type}</small><small>{o.status}</small></div><h3>{o.title}</h3><p>{o.description}</p><div className="opp-card-bottom"><button onClick={()=>onProfile(o.author_id)}>By {profiles.find(p=>p.id===o.author_id)?.display_name||"Member"} <ArrowRight size={15}/></button>{o.author_id===userId?<button onClick={()=>void close(o)}>{o.status==="open"?"Close":"Reopen"}</button>:<button disabled={sent.includes(o.id)||o.status==="closed"} onClick={()=>auth()&&setSelected(o)}>{sent.includes(o.id)?"Interest sent":"I'm interested"}</button>}</div></article>):<p className="opp-empty"><BriefcaseBusiness size={22}/> No matches. You can create the first opportunity.</p>}
 {selected&&<div className="modal-shade" onMouseDown={e=>e.target===e.currentTarget&&setSelected(null)}><div className="dialog" role="dialog" aria-modal="true"><div className="dialog-head"><strong>Express interest</strong><button onClick={()=>setSelected(null)}><X size={20}/></button></div><form className="opp-form" onSubmit={apply}><h3>{selected.title}</h3><p>Tell the listing owner how you could contribute.</p><textarea required minLength={10} maxLength={600} rows={5} value={interest} onChange={e=>setInterest(e.target.value)} placeholder="Hi, I'd love to collaborate because..."/><button className="primary-btn" disabled={busy||interest.trim().length<10}><Send size={17}/> Send privately</button></form></div></div>}
 </section>;
}
