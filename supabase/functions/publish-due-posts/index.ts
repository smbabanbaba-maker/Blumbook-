// Supabase Edge Function: publish-due-posts
// Deploy separately and invoke from a secure hourly/minutely scheduler.
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.57.0";
Deno.serve(async(req)=>{
  if(req.method!=="POST")return new Response("Method not allowed",{status:405});
  const incoming=req.headers.get("x-cron-secret")||"";
  const expected=Deno.env.get("CRON_SECRET")||"";
  if(!expected||incoming.length!==expected.length){
    return new Response("Unauthorized",{status:401});
  }
  // Constant-time comparison avoids trivial timing disclosure.
  const a=new TextEncoder().encode(incoming),b=new TextEncoder().encode(expected);
  let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
  if(diff!==0)return new Response("Unauthorized",{status:401});
  const url=Deno.env.get("SUPABASE_URL");
  const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!key)return new Response("Not configured",{status:503});
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.rpc("publish_due_blumbook_posts");
  if(error)return Response.json({ok:false,error:"Publishing worker could not run."},{status:500});
  return Response.json({ok:true,published:Number(data)||0});
});
