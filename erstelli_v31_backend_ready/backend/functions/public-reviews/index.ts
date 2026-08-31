import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"apikey, authorization, content-type","Access-Control-Allow-Methods":"GET, OPTIONS"};
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const {data,error}=await sb.from("reviews").select("display_name,rating,text,created_at").eq("approved",true).order("created_at",{ascending:false}).limit(12);
  if(error) return new Response(JSON.stringify({error:error.message}),{status:500,headers:{...cors,"Content-Type":"application/json"}});
  return new Response(JSON.stringify({reviews:data||[]}),{headers:{...cors,"Content-Type":"application/json"}});
});
