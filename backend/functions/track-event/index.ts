import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"apikey, authorization, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
};

const allowedEvents=new Set([
  "page_view","section_view","scroll_depth","package_select","addon_toggle",
  "configurator_use","form_start","file_add","request_submit_attempt","request_submit_success",
  "request_submit_error","whatsapp_click","email_click","review_click"
]);
const clean=(v:unknown,n=120)=>String(v??"").trim().slice(0,n);

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="POST") return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:{...cors,"Content-Type":"application/json"}});
  try{
    const body=await req.json();
    const eventName=clean(body.eventName,60);
    if(!allowedEvents.has(eventName)) throw new Error("Ungültiges Ereignis.");
    const sessionId=clean(body.sessionId,64);
    if(!/^[a-f0-9-]{16,64}$/i.test(sessionId)) throw new Error("Ungültige Sitzung.");
    const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const row={
      event_name:eventName,
      session_id:sessionId,
      page:clean(body.page,120)||"/",
      section:clean(body.section,80)||null,
      element:clean(body.element,120)||null,
      value:clean(body.value,120)||null,
      source:clean(body.source,120)||null,
      medium:clean(body.medium,120)||null,
      campaign:clean(body.campaign,120)||null,
      device_group:["mobile","tablet","desktop"].includes(body.deviceGroup)?body.deviceGroup:null
    };
    const {error}=await sb.from("analytics_events").insert(row);
    if(error) throw error;

    // Datensparsame Aufbewahrung: bei Seitenaufrufen alte Analytics-Daten (>90 Tage) entfernen.
    if(eventName==="page_view"){
      const cutoff=new Date(Date.now()-90*24*60*60*1000).toISOString();
      await sb.from("analytics_events").delete().lt("created_at",cutoff);
    }
    return new Response(JSON.stringify({ok:true}),{headers:{...cors,"Content-Type":"application/json"}});
  }catch(e){
    return new Response(JSON.stringify({error:e instanceof Error?e.message:"Fehler"}),{status:400,headers:{...cors,"Content-Type":"application/json"}});
  }
});
