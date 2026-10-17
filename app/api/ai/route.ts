import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const languages=new Set(["Hausa","English","Arabic","French","Yoruba","Igbo"]);
const actions=new Set(["caption","rewrite","ideas","translate"]);
export async function POST(req:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,key=process.env.OPENAI_API_KEY;
 if(!url||!anon||!key)return NextResponse.json({error:"Blum AI is not activated yet. Contact the app administrator."},{status:503});
 if(Number(req.headers.get("content-length")||0)>12000)return NextResponse.json({error:"Request too large."},{status:413});
 const bearer=req.headers.get("authorization")||"";
 const token=bearer.startsWith("Bearer ")?bearer.slice(7):"";
 if(token.length<20)return NextResponse.json({error:"Sign in to use Blum AI."},{status:401});
 try {
   const client=createClient(url,anon,{auth:{autoRefreshToken:false,persistSession:false}});
   const {data,error}=await client.auth.getUser(token);
   if(error||!data.user)return NextResponse.json({error:"Your session expired. Sign in again."},{status:401});
   const payload=await req.json();
   const text=typeof payload.text==="string"?payload.text.trim():"";
   const task=typeof payload.task==="string"?payload.task:"";
   const language=typeof payload.language==="string"?payload.language:"English";
   if(text.length<3||text.length>1500||!actions.has(task)||(task==="translate"&&!languages.has(language)))return NextResponse.json({error:"Invalid request."},{status:400});
   const userClient=createClient(url,anon,{global:{headers:{Authorization:"Bearer "+token}},auth:{autoRefreshToken:false,persistSession:false}});
   const quota=await userClient.rpc("claim_ai_daily_quota");
   if(quota.error)return NextResponse.json({error:"AI usage limits are not configured. Apply the Phase 6 migration."},{status:503});
   if(quota.data!==true)return NextResponse.json({error:"You have reached today's AI limit (10 requests). Try again tomorrow."},{status:429});
   const instructions:Record<string,string>={
    caption:"Write one short, engaging social media caption based on the user's draft. Be accurate, do not invent facts or engagement metrics. Max 400 characters.",
    rewrite:"Polish the user's draft for clarity, spelling, and natural confident tone while preserving its claims and original language. Do not invent facts. Max 500 characters.",
    ideas:"Provide five practical original content ideas about the user's topic as a concise numbered list. Do not claim results or statistics.",
    translate:"Translate the text faithfully into "+language+". Preserve names, facts, formatting, and uncertainty. Output only the translation, with no extra commentary."
   };
   const response=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",
    headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
    body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-4.1-mini",instructions:"You are Blum AI for an African social platform. "+instructions[task],input:text,max_output_tokens:500,store:false}),
    signal:AbortSignal.timeout(20000)
   });
   if(!response.ok)return NextResponse.json({error:response.status===429?"AI service is temporarily busy. Try again later.":"AI provider could not complete this request."},{status:503});
   const json=await response.json();
   const output=(json.output||[]).flatMap((m:{content?:{type:string;text?:string}[]})=>m.content||[]).filter((c:{type:string})=>c.type==="output_text").map((c:{text?:string})=>c.text||"").join("\n").trim();
   if(!output)return NextResponse.json({error:"No response from AI provider."},{status:503});
   return NextResponse.json({output:output.slice(0,3500)},{headers:{"Cache-Control":"no-store"}});
 }catch{
   return NextResponse.json({error:"AI service is temporarily unavailable."},{status:503});
 }
}
