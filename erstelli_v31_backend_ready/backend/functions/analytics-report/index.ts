import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"apikey, authorization, content-type, x-erstelli-admin-secret",
  "Access-Control-Allow-Methods":"GET, OPTIONS"
};

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="GET") return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:{...cors,"Content-Type":"application/json"}});
  try{
    const secret=req.headers.get("x-erstelli-admin-secret");
    if(!secret || secret!==Deno.env.get("ERSTELLI_ADMIN_SECRET")) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{...cors,"Content-Type":"application/json"}});
    const u=new URL(req.url);
    const days=Math.min(365,Math.max(1,Number(u.searchParams.get("days")||30)));
    const since=new Date(Date.now()-days*24*60*60*1000).toISOString();
    const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const {data,error}=await sb.from("analytics_events").select("event_name,session_id,section,element,value,source,medium,campaign,device_group,created_at").gte("created_at",since).order("created_at",{ascending:true}).limit(20000);
    if(error) throw error;
    const rows=data||[];
    const counts=(field:string, filter?:(r:any)=>boolean)=>{
      const m:Record<string,number>={};
      for(const r of rows){if(filter&&!filter(r))continue; const k=String(r[field]||"Unbekannt");m[k]=(m[k]||0)+1;}
      return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count}));
    };
    const sessions=new Set(rows.map((r:any)=>r.session_id)).size;
    const pageViews=rows.filter((r:any)=>r.event_name==="page_view").length;
    const formStarts=rows.filter((r:any)=>r.event_name==="form_start").length;
    const submissions=rows.filter((r:any)=>r.event_name==="request_submit_success").length;
    const whatsapp=rows.filter((r:any)=>r.event_name==="whatsapp_click").length;
    const email=rows.filter((r:any)=>r.event_name==="email_click").length;
    return new Response(JSON.stringify({
      ok:true,days,since,
      summary:{pageViews,sessions,formStarts,submissions,whatsapp,email,conversionRate:pageViews?Math.round(submissions/pageViews*1000)/10:0},
      sections:counts("section",r=>r.event_name==="section_view"&&r.section),
      clicks:counts("element",r=>["package_select","addon_toggle","configurator_use","whatsapp_click","email_click","review_click"].includes(r.event_name)&&r.element),
      scroll:counts("value",r=>r.event_name==="scroll_depth"),
      packages:counts("value",r=>r.event_name==="package_select"),
      sources:counts("source",r=>r.event_name==="page_view"),
      devices:counts("device_group",r=>r.event_name==="page_view")
    }),{headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
  }catch(e){
    return new Response(JSON.stringify({error:e instanceof Error?e.message:"Fehler"}),{status:400,headers:{...cors,"Content-Type":"application/json"}});
  }
});
