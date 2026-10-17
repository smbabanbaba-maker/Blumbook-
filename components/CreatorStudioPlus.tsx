"use client";
import {useEffect,useState,type FormEvent} from "react";
import {ArrowRight,BarChart3,CalendarClock,Download,Feather,Plus,Trash2} from "lucide-react";
import type {Post,Profile} from "@/lib/demo";
import {shortCount} from "@/lib/demo";
type Draft={id:string;body:string;planned_date:string};
export default function CreatorStudioPlus({posts,me,onCompose}:{posts:Post[];me:Profile;onCompose:(text?:string)=>void}){
 const mine=posts.filter(p=>p.author_id===me.id);
 const [drafts,setDrafts]=useState<Draft[]>([]),[text,setText]=useState(""),[date,setDate]=useState(""),[writing,setWriting]=useState(false);
 useEffect(()=>{try{const arr=JSON.parse(localStorage.getItem("blumbook-drafts-"+me.id)||"[]");if(Array.isArray(arr))setDrafts(arr);}catch{}},[me.id]);
 const store=(items:Draft[])=>{setDrafts(items);try{localStorage.setItem("blumbook-drafts-"+me.id,JSON.stringify(items));}catch{}};
 const metrics=[["Posts",mine.length],["Likes",mine.reduce((n,p)=>n+p.likes,0)],["Replies",mine.reduce((n,p)=>n+p.replies,0)],["Reposts",mine.reduce((n,p)=>n+p.reposts,0)]] as const;
 const days=Array.from({length:7},(_,i)=>{const start=new Date();start.setHours(0,0,0,0);start.setDate(start.getDate()-(6-i));return{label:start.toLocaleDateString("en",{weekday:"short"}),count:mine.filter(p=>new Date(p.created_at).getTime()>=start.getTime()&&new Date(p.created_at).getTime()<start.getTime()+86400000).length};});
 function save(e:FormEvent){e.preventDefault();if(!text.trim())return;store([{id:"d-"+Date.now(),body:text.trim(),planned_date:date},...drafts]);setText("");setDate("");setWriting(false);}
 function exportCsv(){const rows=[["Metric","Value"],...metrics].map(row=>row.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(",")).join("\n");const url=URL.createObjectURL(new Blob([rows],{type:"text/csv"}));const link=document.createElement("a");link.href=url;link.download="blumbook-studio.csv";link.click();setTimeout(()=>URL.revokeObjectURL(url),300);}
 return <section className="studio-plus"><header className="studio-top"><div><small>YOUR CREATOR SPACE</small><h2>Creator Studio</h2><p>Make ideas. Build your audience. Measure what matters.</p></div><button className="primary-btn" onClick={()=>onCompose()}><Plus size={18}/> New post</button></header>
 <p className="feature-disclaimer">Analytics use posts loaded in the current feed, not a complete server report. Planned dates do not automatically publish content.</p>
 <div className="studio-metrics">{metrics.map(([name,count])=><div key={name}><small>{name}</small><strong>{shortCount(count)}</strong></div>)}</div>
 <div className="studio-panel"><h3><BarChart3 size={20}/> Publishing this week</h3><div className="studio-chart">{days.map((d,i)=><div key={i}><span style={{height:Math.max(5,d.count/Math.max(...days.map(x=>x.count),1)*96)+"%"}} title={d.count+" posts"}/><small>{d.label}</small></div>)}</div></div>
 <div className="studio-panel"><div className="studio-panel-head"><h3><Feather size={20}/> Draft planner</h3><button onClick={()=>setWriting(v=>!v)}><Plus size={17}/> New draft</button></div>
 {writing&&<form onSubmit={save} className="studio-form"><textarea required maxLength={500} rows={4} placeholder="Write your next idea..." value={text} onChange={e=>setText(e.target.value)}/><label><CalendarClock size={16}/> Planned date (optional)<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><button className="primary-btn">Save draft</button></form>}
 {drafts.length?drafts.map(d=><div className="studio-draft" key={d.id}><div><p>{d.body}</p><small>{d.planned_date?"Planned "+d.planned_date:"Unscheduled"} · Saved locally</small></div><button title="Open composer" onClick={()=>onCompose(d.body)}><ArrowRight size={19}/></button><button aria-label="Delete draft" onClick={()=>store(drafts.filter(x=>x.id!==d.id))}><Trash2 size={18}/></button></div>):<p className="studio-no-drafts">No saved drafts yet. Start with a new idea.</p>}</div>
 <button onClick={exportCsv} className="studio-download"><Download size={17}/> Export current metrics (CSV)</button></section>;
}
