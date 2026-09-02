import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"apikey, authorization, content-type, x-erstelli-admin-secret",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
};

const allowedSlots=new Set(["floristik","handwerk","shop"]);
const allowedTypes=new Set(["image/jpeg","image/png","image/webp"]);
const bucket="site-assets";

function json(body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="POST") return json({error:"Method not allowed"},405);

  try{
    const secret=req.headers.get("x-erstelli-admin-secret");
    if(!secret || secret!==Deno.env.get("ERSTELLI_ADMIN_SECRET")) return json({error:"Unauthorized"},401);

    const form=await req.formData();
    const slot=String(form.get("slot")||"").trim();
    const file=form.get("file");

    if(!allowedSlots.has(slot)) throw new Error("Ungültiger Referenz-Platz.");
    if(!(file instanceof File) || file.size===0) throw new Error("Bitte ein Bild auswählen.");
    if(file.size>8*1024*1024) throw new Error("Das Bild darf maximal 8 MB groß sein.");
    if(!allowedTypes.has(file.type)) throw new Error("Erlaubt sind JPG, PNG und WebP.");

    const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const imagePath=`references/${slot}`;
    const updatedAt=new Date().toISOString();

    const upload=await sb.storage.from(bucket).upload(imagePath,file,{
      upsert:true,
      contentType:file.type,
      cacheControl:"3600"
    });
    if(upload.error) throw upload.error;

    const manifestPath="references/manifest.json";
    let manifest:Record<string,{updatedAt:string}>={};
    const existing=await sb.storage.from(bucket).download(manifestPath);
    if(!existing.error && existing.data){
      try{
        const parsed=JSON.parse(await existing.data.text());
        if(parsed && typeof parsed==="object") manifest=parsed;
      }catch(_){ }
    }
    manifest[slot]={updatedAt};

    const manifestBlob=new Blob([JSON.stringify(manifest,null,2)],{type:"application/json"});
    const manifestUpload=await sb.storage.from(bucket).upload(manifestPath,manifestBlob,{
      upsert:true,
      contentType:"application/json",
      cacheControl:"60"
    });
    if(manifestUpload.error) throw manifestUpload.error;

    const {data}=sb.storage.from(bucket).getPublicUrl(imagePath);
    return json({ok:true,slot,url:data.publicUrl,updatedAt});
  }catch(e){
    return json({error:e instanceof Error?e.message:"Upload fehlgeschlagen"},400);
  }
});
