"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {BadgeCheck,Check,Clock,ExternalLink,ShieldCheck,Wallet,X} from "lucide-react";
import {supabase,isCloudEnabled} from "@/lib/supabase";
import type {Profile} from "@/lib/demo";
type Request={id:string;status:string;created_at:string;category:string};
export default function CreatorAccess({userId,profile,onSignIn,mode="all"}:{userId:string|null;profile:Profile;onSignIn:()=>void;mode?:"all"|"verification"|"earnings"}){
 const [category,setCategory]=useState("creator"),[reason,setReason]=useState(""),[reference,setReference]=useState(""),[request,setRequest]=useState<Request|null>(null),[joined,setJoined]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const load=useCallback(async()=>{
  if(!supabase||!userId)return;
  const [a,b]=await Promise.all([
   supabase.from("verification_requests").select("id,status,category,created_at").eq("user_id",userId).order("created_at",{ascending:false}).limit(1),
   supabase.from("creator_earnings_waitlist").select("user_id").eq("user_id",userId).maybeSingle()
  ]);
  if(a.error||b.error){setNotice("Verification and earnings waitlist require Phase 6 setup.");return;}
  setRequest(a.data?.[0]||null);setJoined(Boolean(b.data));
 },[userId]);
 useEffect(()=>{void load();},[load]);
 const validUrl=(text:string)=>{try{return new URL(text).protocol==="https:";}catch{return false;}};
 async function submit(e:FormEvent){
  e.preventDefault();if(!userId){onSignIn();return;}if(!validUrl(reference)||reason.trim().length<30){setNotice("Explain your public work in at least 30 characters and provide an HTTPS reference.");return;}
  if(!supabase){setNotice("Verification requests are available only for connected real accounts.");return;}
  setBusy(true);
  const {error}=await supabase.from("verification_requests").insert({user_id:userId,category,reason:reason.trim(),reference_url:reference.trim()});
  if(error)setNotice(error.message);else{setNotice("Request submitted. Verification requires manual human review.");setReason("");await load();}
  setBusy(false);
 }
 async function waitlist(){
  if(!userId){onSignIn();return;}
  if(!supabase){setNotice("Connect Supabase to register real interest.");return;}
  setBusy(true);
  const {error}=await supabase.from("creator_earnings_waitlist").upsert({user_id:userId},{onConflict:"user_id",ignoreDuplicates:true});
  if(error)setNotice(error.message);else {setJoined(true);setNotice("You're on the interest list. No payments or earnings are active.");}
  setBusy(false);
 }
 return <section className="creator-access">
   <div className="creator-access-hero"><ShieldCheck size={28}/><h2>Creator identity & growth</h2><p>Build a credible presence, request verification and follow the future Creator Earnings program.</p></div>
   {notice&&<p className="feature-disclaimer" role="status">{notice}<button onClick={()=>setNotice("")}><X size={16}/></button></p>}
   {mode!=="earnings"&&<article className="access-card"><div className="access-card-heading"><BadgeCheck size={27}/><div><h3>Verification Center</h3><p>Authenticity, not paid badges.</p></div></div>
    {profile.verified?<div className="access-success"><Check size={17}/> This account is verified.</div>:<>
     {request&&<p className="access-state"><Clock size={17}/> Latest request: <strong>{request.status}</strong> · {new Date(request.created_at).toLocaleDateString()}</p>}
     <p>Verification requires supporting public evidence and a manual review. Submitting does not guarantee approval or display a checkmark.</p>
     {!request&&<form className="access-form" onSubmit={submit}><label>Profile type<select value={category} onChange={e=>setCategory(e.target.value)}><option value="creator">Creator</option><option value="organization">Organization</option><option value="public_figure">Public figure</option></select></label><label>Why should this account be verified?<textarea required maxLength={900} minLength={30} rows={4} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Explain your public work, audience and authenticity."/></label><label>Public evidence URL (HTTPS)<input type="url" required placeholder="https://..." value={reference} onChange={e=>setReference(e.target.value)}/></label><button className="primary-btn" disabled={busy}>Request review</button></form>}
    </>}
   </article>}
   {mode!=="verification"&&<article className="access-card"><div className="access-card-heading"><Wallet size={27}/><div><h3>Creator Earnings</h3><p>Monetization roadmap</p></div></div><div className="earnings-zero"><small>Available balance</small><strong>Not enabled</strong><span>No earnings, payouts, or payment accounts have been activated.</span></div><h4>Planned eligibility</h4><ul><li>Authentic account and compliant content</li><li>Verified payout identity when payments launch</li><li>Eligible region, age and payment partner</li><li>Engagement and originality checks</li></ul><button onClick={()=>void waitlist()} disabled={joined||busy}>{joined?"Interest registered":"Join interest list"} <ExternalLink size={16}/></button></article>}
 </section>;
}
