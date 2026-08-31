import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function esc(v: unknown) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]!));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({error:"Method not allowed"}), {status:405,headers:{...cors,"Content-Type":"application/json"}});

  try {
    const form = await req.formData();
    const requestId = String(form.get("requestId") || "").trim();
    const name = String(form.get("name") || "").trim();
    const company = String(form.get("company") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const configuration = String(form.get("config") || "").trim();
    const message = String(form.get("message") || "").trim();

    if (!requestId || !name || !email || !configuration) throw new Error("Pflichtangaben fehlen.");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: insertError } = await supabase.from("project_requests").insert({
      request_id: requestId, name, company, email, phone, configuration, message
    });
    if (insertError) throw insertError;

    const uploaded: {name:string,path:string}[] = [];
    const files = form.getAll("files").filter(v => v instanceof File) as File[];
    for (const file of files.slice(0,10)) {
      if (file.size === 0) continue;
      if (file.size > 15 * 1024 * 1024) throw new Error(`Datei zu groß: ${file.name}`);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
      const path = `${requestId}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("project-files").upload(path, file, { contentType:file.type, upsert:false });
      if (uploadError) throw uploadError;
      await supabase.from("project_files").insert({
        request_id:requestId, original_name:file.name, storage_path:path, mime_type:file.type, size_bytes:file.size
      });
      uploaded.push({name:file.name,path});
    }

    // Signed links for the private attachments, valid for 7 days.
    const fileLinks:string[] = [];
    for (const f of uploaded) {
      const { data } = await supabase.storage.from("project-files").createSignedUrl(f.path, 60*60*24*7);
      if (data?.signedUrl) fileLinks.push(`<li><a href="${data.signedUrl}">${esc(f.name)}</a></li>`);
    }

    // Optional email sending with Resend. Set RESEND_API_KEY + ERSTELLI_FROM_EMAIL in Supabase secrets.
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("ERSTELLI_FROM_EMAIL");
    const owner = Deno.env.get("ERSTELLI_OWNER_EMAIL") || "erstelliyourwebsite@gmail.com";

    if (resendKey && from) {
      const subject = `[ERSTELLI] Neue Anfrage ${requestId} – ${company || name}`;
      const html = `
      <div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;color:#17344b">
        <div style="padding:22px;border-radius:18px;background:linear-gradient(135deg,#eef9ff,#f5f1ff)">
          <div style="font-size:12px;font-weight:800;color:#367fdc;letter-spacing:.12em">NEUE PROJEKTANFRAGE</div>
          <h1 style="margin:7px 0 0">${esc(requestId)}</h1>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-top:18px">
          <tr><td style="padding:9px;border-bottom:1px solid #e4edf4"><b>Name</b></td><td>${esc(name)}</td></tr>
          <tr><td style="padding:9px;border-bottom:1px solid #e4edf4"><b>Firma</b></td><td>${esc(company || "–")}</td></tr>
          <tr><td style="padding:9px;border-bottom:1px solid #e4edf4"><b>E-Mail</b></td><td>${esc(email)}</td></tr>
          <tr><td style="padding:9px;border-bottom:1px solid #e4edf4"><b>Telefon / WhatsApp</b></td><td>${esc(phone || "–")}</td></tr>
        </table>
        <h3>Konfiguration</h3><pre style="white-space:pre-wrap;background:#f7fbfe;padding:14px;border-radius:12px">${esc(configuration)}</pre>
        <h3>Zusätzliche Wünsche</h3><p>${esc(message || "Keine zusätzlichen Angaben.")}</p>
        ${fileLinks.length ? `<h3>Anhänge</h3><ul>${fileLinks.join("")}</ul>` : ""}
        <p style="font-size:12px;color:#71889a">Die Anfrage ist noch kein angenommener Auftrag. Nach Prüfung kannst du Preis und Leistungsumfang bestätigen und anschließend die Rechnung stellen.</p>
      </div>`;

      const mailRes = await fetch("https://api.resend.com/emails", {
        method:"POST",
        headers:{ "Authorization":`Bearer ${resendKey}`, "Content-Type":"application/json" },
        body:JSON.stringify({
          from,
          to:[owner],
          reply_to:email,
          subject,
          html
        })
      });
      if (!mailRes.ok) console.error("Resend failed", await mailRes.text());

      // Confirmation to customer
      await fetch("https://api.resend.com/emails", {
        method:"POST",
        headers:{ "Authorization":`Bearer ${resendKey}`, "Content-Type":"application/json" },
        body:JSON.stringify({
          from,
          to:[email],
          subject:`ERSTELLI – Anfrage ${requestId} eingegangen`,
          html:`<div style="font-family:Arial,sans-serif;color:#17344b"><h2>Danke für deine Anfrage.</h2><p>Wir haben deine Projektanfrage <b>${esc(requestId)}</b> erhalten und prüfen sie. Mit dem Absenden ist noch kein Auftrag zustande gekommen.</p></div>`
        })
      });
    }

    return new Response(JSON.stringify({ok:true,requestId}), {headers:{...cors,"Content-Type":"application/json"}});
  } catch (e) {
    return new Response(JSON.stringify({error:e instanceof Error?e.message:"Unbekannter Fehler"}), {status:400,headers:{...cors,"Content-Type":"application/json"}});
  }
});
