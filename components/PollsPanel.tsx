"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {ArrowRight,BarChart3,Plus,Vote,X} from "lucide-react";
import {supabase,isCloudEnabled} from "@/lib/supabase";
import type {Profile} from "@/lib/demo";
type Poll={id:string;author_id:string;question:string;options:string[];created_at:string;expires_at:string};
type Tally={poll_id:string;option_index:number;votes:number};
export default function PollsPanel({userId,profiles,onSignIn,onProfile,preview=false,launchCreate=0}:{userId:string|null;profiles:Profile[];onSignIn:()=>void;onProfile:(id:string)=>void;preview?:boolean;launchCreate?:number}){
 const [polls,setPolls]=useState<Poll[]>([]),[tallies,setTallies]=useState<Tally[]>([]),[votes,setVotes]=useState<Record<string,number>>({});
 const [open,setOpen]=useState(false),[question,setQuestion]=useState(""),[options,setOptions]=useState(["",""]),[days,setDays]=useState(1);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const user=userId||"demo-me";
 const load=useCallback(async()=>{
  if(!supabase)return;
  const [pollData,countData,myData]=await Promise.all([
   supabase.from("polls").select("id,author_id,question,options,created_at,expires_at").order("created_at",{ascending:false}).limit(60),
   supabase.rpc("poll_results"),
   userId?supabase.from("poll_votes").select("poll_id,option_index").eq("voter_id",userId):Promise.resolve({data:[] as {poll_id:string;option_index:number}[]})
  ]);
  if(pollData.error){setNotice("Polls need the Phase 6 migration.");return;}
  setPolls((pollData.data||[]) as Poll[]);
  if(!countData.error)setTallies((countData.data||[]) as Tally[]);
  setVotes(Object.fromEntries((myData.data||[]).map(v=>[v.poll_id,v.option_index])));
 },[userId]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{if(launchCreate>0){if(isCloudEnabled&&!userId)onSignIn();else setOpen(true);}},[launchCreate,userId]);
 async function create(e:FormEvent){
  e.preventDefault();if(busy)return;
  const clean=options.map(x=>x.trim()).filter(Boolean);
  if(question.trim().length<5||clean.length<2||new Set(clean.map(x=>x.toLowerCase())).size!==clean.length){setNotice("Enter a question and 2–4 different options.");return;}
  if(isCloudEnabled&&!userId){onSignIn();return;}
  setBusy(true);
  try{
    if(supabase&&userId){
      const {error}=await supabase.rpc("create_blumbook_poll",{p_question:question.trim(),p_options:clean,p_days:days});
      if(error)throw new Error(error.message);await load();
    }else setPolls(p=>[{id:"demo-poll-"+Date.now(),author_id:user,question:question.trim(),options:clean,created_at:new Date().toISOString(),expires_at:new Date(Date.now()+days*86400000).toISOString()},...p]);
    setQuestion("");setOptions(["",""]);setOpen(false);setNotice(isCloudEnabled?"Poll published.":"Demo poll: not shared with other users.");
  }catch(err){setNotice(err instanceof Error?err.message:"Could not create poll");}
  finally{setBusy(false);}
 }
 async function vote(poll:Poll,index:number){
  if(isCloudEnabled&&!userId){onSignIn();return;}
  if(Date.now()>=new Date(poll.expires_at).getTime())return;
  if(votes[poll.id]!==undefined)return;
  if(supabase&&userId){
    const {error}=await supabase.from("poll_votes").insert({poll_id:poll.id,voter_id:userId,option_index:index});
    if(error){setNotice(error.message);return;}
    await load();
  }else{
    setVotes(p=>({...p,[poll.id]:index}));
    setTallies(p=>[...p,{poll_id:poll.id,option_index:index,votes:1}]);
  }
 }
 const visible=preview?polls.slice(0,1):polls;
 return <section className={"blum-polls "+(preview?"polls-preview":"")}>
  <header className="polls-head"><div><small>COMMUNITY VOICES</small><h2>{preview?"Community polls":"Polls"}</h2></div><button onClick={()=>{if(isCloudEnabled&&!userId)onSignIn();else setOpen(!open);}}><Plus size={17}/> New poll</button></header>
  {notice&&<p role="status" className="feature-disclaimer">{notice}<button onClick={()=>setNotice("")} aria-label="Dismiss"><X size={14}/></button></p>}
  {open&&<form className="poll-create" onSubmit={create}><h3>Ask the community</h3><input required maxLength={180} minLength={5} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Your question"/>{options.map((x,i)=><label key={i}>Option {i+1}<input required maxLength={90} value={x} onChange={e=>setOptions(p=>p.map((v,j)=>j===i?e.target.value:v))} placeholder={"Answer "+(i+1)}/></label>)}{options.length<4&&<button type="button" className="poll-add-option" onClick={()=>setOptions(p=>[...p,""])}><Plus size={16}/> Add option</button>}<label>Poll duration<select value={days} onChange={e=>setDays(Number(e.target.value))}><option value={1}>1 day</option><option value={3}>3 days</option><option value={7}>7 days</option></select></label><button className="primary-btn" disabled={busy}>Publish poll</button></form>}
  {visible.length?visible.map(poll=>{
    const expired=Date.now()>=new Date(poll.expires_at).getTime();
    const voted=votes[poll.id]!==undefined;
    const voteCounts=poll.options.map((_,i)=>tallies.filter(t=>t.poll_id===poll.id&&t.option_index===i).reduce((a,v)=>a+Number(v.votes),0));
    const total=voteCounts.reduce((a,n)=>a+n,0);
    return <article key={poll.id} className="poll-card">
      <button className="poll-owner" onClick={()=>onProfile(poll.author_id)}>{profiles.find(p=>p.id===poll.author_id)?.display_name||"Member"}</button>
      <h3>{poll.question}</h3>
      <div className="poll-options">{poll.options.map((opt,i)=>{
       const pct=total?Math.round(voteCounts[i]/total*100):0;
       return voted||expired?<div className={"poll-result "+(votes[poll.id]===i?"chosen":"")} key={i}><div style={{width:pct+"%"}}/><span>{opt}</span><strong>{pct}%</strong></div>:
        <button key={i} onClick={()=>void vote(poll,i)}>{opt}</button>;
      })}</div>
      <p>{total} {total===1?"vote":"votes"} · {expired?"Closed":"Ends "+new Date(poll.expires_at).toLocaleDateString()}</p>
    </article>;
  }):<div className="polls-empty"><Vote size={29}/><p>No polls yet. Start a conversation with a question.</p></div>}
  {preview&&<p className="polls-preview-foot">Find all polls from Explore or the More menu <ArrowRight size={14}/></p>}
 </section>;
}
