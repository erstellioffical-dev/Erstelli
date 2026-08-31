import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"apikey, authorization, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  try{
    const {token,displayName,rating,text}=await req.json();
    if(!token||!text||!Number.isInteger(rating)||rating<1||rating>5) throw new Error("Ungültige Bewertung.");
    const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const {data:order,error}=await sb.from("orders").select("id,status,completed_at").eq("review_token",token).maybeSingle();
    if(error) throw error;
    if(!order||order.status!=="completed"||!order.completed_at) throw new Error("Auftragscode ist nicht für eine Bewertung freigeschaltet.");
    const {error:insert}=await sb.from("reviews").insert({order_id:order.id,display_name:String(displayName||"").slice(0,120),rating,text:String(text).trim()});
    if(insert) throw insert;
    return new Response(JSON.stringify({ok:true}),{headers:{...cors,"Content-Type":"application/json"}});
  }catch(e){
    return new Response(JSON.stringify({error:e instanceof Error?e.message:"Fehler"}),{status:400,headers:{...cors,"Content-Type":"application/json"}});
  }
});
