"use client";
import {useEffect,useState,type FormEvent} from "react";
import {ArrowRight,Check,Copy,Languages,Lightbulb,PenLine,Send,Sparkles,TriangleAlert} from "lucide-react";
import {supabase,isCloudEnabled} from "@/lib/supabase";
type Task="caption"|"rewrite"|"ideas"|"translate";
const templates=[
  "Share one useful lesson you learned today, and ask a thoughtful question.",
  "Describe a project you are building and invite collaborators to connect.",
  "Tell a short behind-the-scenes story about your creative process.",
  "Explain a practical tip that could help someone in your community."
];
export default function BlumAI({userId,onSignIn,onCompose,seedText="",seedTask="caption"}:{userId:string|null;onSignIn:()=>void;onCompose:(text:string)=>void;seedText?:string;seedTask?:Task}){
 const [task,setTask]=useState<Task>(seedTask),[text,setText]=useState(seedText),[language,setLanguage]=useState("Hausa"),[result,setResult]=useState(""),[status,setStatus]=useState(""),[busy,setBusy]=useState(false),[copied,setCopied]=useState(false);
 useEffect(()=>{setText(seedText);setTask(seedTask);setResult("");},[seedText,seedTask]);
 async function generate(e:FormEvent){
  e.preventDefault();if(!text.trim()||busy)return;
  if(!isCloudEnabled||!userId){if(isCloudEnabled)onSignIn();else setStatus("AI is not connected. Use the writing prompts below, or connect Supabase and an AI provider.");return;}
  const session=await supabase?.auth.getSession();
  const token=session?.data?.session?.access_token;
  if(!token){onSignIn();return;}
  setBusy(true);setStatus("");setResult("");
  try {
    const response=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({task,text:text.trim(),language})});
    const json=await response.json();
    if(!response.ok)throw new Error(typeof json.error==="string"?json.error:"AI service unavailable.");
    setResult(typeof json.output==="string"?json.output:"");
  }catch(err){setStatus(err instanceof Error?err.message:"AI is unavailable right now.");}
  finally{setBusy(false);}
 }
 const tasks:{id:Task;name:string;Icon:typeof Sparkles}[]=[
  {id:"caption",name:"Caption",Icon:PenLine},{id:"rewrite",name:"Polish text",Icon:Sparkles},{id:"ideas",name:"Ideas",Icon:Lightbulb},{id:"translate",name:"Translate",Icon:Languages}
 ];
 return <section className="blum-ai"><header className="ai-hero"><span><Sparkles size={16}/> BLUM AI</span><h2>More possibilities for every voice.</h2><p>A writing and translation assistant for creators. Always review output before publishing.</p></header>
 <div className="ai-tabs">{tasks.map(({id,name,Icon})=><button key={id} className={task===id?"active":""} onClick={()=>{setTask(id);setResult("");}}><Icon size={17}/>{name}</button>)}</div>
 <form className="ai-form" onSubmit={generate}><label>{task==="translate"?"Text to translate":task==="ideas"?"Your topic":"Your draft"}<textarea minLength={3} maxLength={1500} required rows={5} value={text} onChange={e=>setText(e.target.value)} placeholder={task==="ideas"?"e.g. Tips for new digital creators":task==="translate"?"Paste a post to translate...":"Start writing your post..."}/></label>{task==="translate"&&<label>Target language<select value={language} onChange={e=>setLanguage(e.target.value)}>{["Hausa","English","Arabic","French","Yoruba","Igbo"].map(x=><option key={x}>{x}</option>)}</select></label>}<button disabled={busy||text.trim().length<3} className="ai-generate"><Sparkles size={18}/>{busy?"Working...":task==="translate"?"Translate with AI":"Generate with AI"}</button></form>
 {status&&<p className="ai-notice" role="status"><TriangleAlert size={18}/>{status}</p>}
 {result&&<article className="ai-output"><span>AI DRAFT · REVIEW BEFORE USING</span><p>{result}</p><div><button onClick={()=>{void navigator.clipboard?.writeText(result);setCopied(true);}}>{copied?<Check size={17}/>:<Copy size={17}/>} {copied?"Copied":"Copy"}</button><button onClick={()=>onCompose(result)}><ArrowRight size={17}/> Use in post</button></div></article>}
 <section className="ai-starters"><h3>Writing prompts you can use now</h3><p>These are pre-written templates, not AI-generated suggestions.</p>{templates.map((t,i)=><button key={i} onClick={()=>{setText(t);setTask("rewrite");}}><Lightbulb size={16}/><span>{t}</span><ArrowRight size={15}/></button>)}</section>
 <p className="ai-footnote">AI requests are available only after Supabase, the server API key and daily usage limits are configured. Translations may contain errors; never publish sensitive personal information without checking.</p>
 </section>;
}
