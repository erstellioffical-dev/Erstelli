import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"apikey, authorization, content-type, x-erstelli-admin-secret",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
};

function json(body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  try{
    if(req.method!=="POST") return json({error:"Method not allowed"},405);
    const adminSecret=req.headers.get("x-erstelli-admin-secret");
    if(!adminSecret || adminSecret!==Deno.env.get("ERSTELLI_ADMIN_SECRET")) return json({error:"Unauthorized"},401);

    const {requestId,invoiceNumber,finalPrice}=await req.json();
    if(!requestId) throw new Error("requestId fehlt.");

    const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let {data:order,error}=await sb.from("orders").select("*").eq("request_id",requestId).maybeSingle();
    if(error) throw error;

    if(!order){
      const ins=await sb.from("orders").insert({request_id:requestId,invoice_number:invoiceNumber||null,final_price:finalPrice||null,status:"completed",completed_at:new Date().toISOString()}).select("*").single();
      if(ins.error) throw ins.error;order=ins.data;
    }else{
      const upd=await sb.from("orders").update({invoice_number:invoiceNumber ?? order.invoice_number,final_price:finalPrice ?? order.final_price,status:"completed",completed_at:new Date().toISOString()}).eq("id",order.id).select("*").single();
      if(upd.error) throw upd.error;order=upd.data;
    }

    const base=Deno.env.get("ERSTELLI_SITE_URL")||"";
    return json({ok:true,requestId,reviewCode:order.review_token,reviewUrl:`${base.replace(/\/$/,"")}/review.html?token=${order.review_token}`});
  }catch(e){
    return json({error:e instanceof Error?e.message:"Fehler"},400);
  }
});
