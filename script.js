const menuBtn=document.querySelector('.menu-btn');
const nav=document.querySelector('.nav');
menuBtn?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuBtn.setAttribute('aria-expanded',open?'true':'false')});
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

let selectedIdea='';
let finderSnapshot={};
let finderCompleted=false;

const modal=document.getElementById('orderModal');
const modalPlan=document.getElementById('modalPlan');
const planInput=document.getElementById('planInput');
const selectedIdeaBox=document.getElementById('selectedIdeaBox');
const checkoutGoal=document.getElementById('checkoutGoal');
const checkoutFormView=document.getElementById('checkoutFormView');
const generatorView=document.getElementById('generatorView');
const PURCHASE_STORAGE_KEY='erstelliActivePurchaseV48';
const PAYMENT_DRAFT_KEY='erstelliPaymentDraftV48';
let currentPrintPayload=null;

function saveActivePurchase(data){
  try{localStorage.setItem(PURCHASE_STORAGE_KEY,JSON.stringify({...data,savedAt:Date.now()}));}catch{}
}
function loadActivePurchase(){
  try{const raw=localStorage.getItem(PURCHASE_STORAGE_KEY);if(!raw)return null;const d=JSON.parse(raw);if(!d||Date.now()-Number(d.savedAt||0)>7*24*60*60*1000){localStorage.removeItem(PURCHASE_STORAGE_KEY);return null;}return d;}catch{return null}
}
function restoreGeneratedPurchase(purchase){
  if(!purchase?.html)return false;
  currentPrintPayload=purchase.printPayload||null;
  checkoutFormView.hidden=true;generatorView.hidden=false;
  document.getElementById('generatorBar').style.width='100%';
  document.querySelectorAll('#generatorSteps [data-gen]').forEach(s=>s.classList.add('done'));
  document.getElementById('generatorDone').hidden=false;
  document.getElementById('generatedPlanOutput').innerHTML=purchase.html;
  document.getElementById('generatorDoneTitle').textContent='Dein Businessplan ist bereits fertig.';
  document.getElementById('generatorDoneText').textContent='Du hast für diesen Plan bereits Zugriff. Du kannst ihn hier erneut öffnen oder als PDF speichern.';
  document.getElementById('generatorSubtitle').textContent='Bereits erstellt – keine erneute Zahlung erforderlich.';
  return true;
}

function requireCompletedFinder(){
  if(finderCompleted && finderSnapshot && finderSnapshot.vision) return true;
  const finder=document.getElementById('business-finder');
  const notice=document.getElementById('finderGateNotice');
  if(notice){notice.hidden=false;notice.textContent='Bitte beantworte zuerst den Business Finder vollständig. Erst danach kannst du einen Businessplan erstellen.';}
  finder?.scrollIntoView({behavior:'smooth',block:'start'});
  return false;
}
function openOrder(plan){
  if(!requireCompletedFinder()) return;
  modalPlan.textContent=plan;
  planInput.value=plan;
  if(selectedIdea){selectedIdeaBox.hidden=false;const extra=[finderSnapshot.status&&('Status: '+finderSnapshot.status),finderSnapshot.occupation&&('Beruf: '+finderSnapshot.occupation),finderSnapshot.budget&&('Investition: '+finderSnapshot.budget),finderSnapshot.planUse&&('Verwendung: '+finderSnapshot.planUse)].filter(Boolean).join(' · ');selectedIdeaBox.textContent='Vorhaben: '+selectedIdea+(extra?' | '+extra:'')}else{selectedIdeaBox.hidden=true}
  checkoutGoal.value=finderSnapshot.vision||'';
  const priceMatch=String(plan).replace(',','.').match(/(?:14\.99|9\.99|4\.99)/);
  const payButton=document.getElementById('checkoutPayButton');
  if(payButton) payButton.textContent=`Zahlungspflichtig bestellen${priceMatch?` – ${priceMatch[0].replace('.',',')} €`:''}`;
  const existing=loadActivePurchase();
  const samePlan=existing&&existing.plan===plan&&existing.goal===(finderSnapshot.vision||'');
  if(samePlan&&existing.html){restoreGeneratedPurchase(existing);}else{checkoutFormView.hidden=false;generatorView.hidden=true;}
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
}
document.querySelectorAll('.order-btn').forEach(btn=>btn.addEventListener('click',()=>openOrder(btn.dataset.plan)));
document.querySelectorAll('[data-close-modal]').forEach(el=>el.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeErstelli()}});
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow=''}

function basicMarkdownToHtml(md=''){
  const escape=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const lines=String(md||'').replace(/\r/g,'').split('\n');
  const out=[];
  let i=0;
  const inline=t=>escape(t).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
  while(i<lines.length){
    const line=lines[i].trim();
    if(!line){i++;continue}
    if(/^###\s+/.test(line)){out.push(`<h3>${inline(line.replace(/^###\s+/,''))}</h3>`);i++;continue}
    if(/^##\s+/.test(line)){out.push(`<h2>${inline(line.replace(/^##\s+/,''))}</h2>`);i++;continue}
    if(/^#\s+/.test(line)){out.push(`<h1>${inline(line.replace(/^#\s+/,''))}</h1>`);i++;continue}

    // Markdown-Tabellen sauber als HTML-Tabelle rendern, falls das Modell doch eine liefert.
    if(line.includes('|') && i+1<lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i+1])){
      const splitRow=r=>r.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());
      const headers=splitRow(lines[i]);
      i+=2;
      const rows=[];
      while(i<lines.length && lines[i].includes('|') && lines[i].trim()) { rows.push(splitRow(lines[i])); i++; }
      out.push(`<div class="blueprint-table-wrap"><table class="blueprint-table"><thead><tr>${headers.map(h=>`<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${headers.map((_,j)=>`<td>${inline(r[j]||'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }

    if(/^[-*]\s+/.test(line)){
      const items=[];
      while(i<lines.length && /^[-*]\s+/.test(lines[i].trim())){items.push(lines[i].trim().replace(/^[-*]\s+/,''));i++}
      out.push(`<ul class="blueprint-list">${items.map(x=>`<li>${inline(x)}</li>`).join('')}</ul>`);continue;
    }

    // Einzelne Roh-Trennlinien niemals anzeigen.
    if(/^[-_|\s]{3,}$/.test(line)){i++;continue}

    const para=[line];i++;
    while(i<lines.length && lines[i].trim() && !/^#{1,3}\s+/.test(lines[i].trim()) && !/^[-*]\s+/.test(lines[i].trim())){
      if(/^[-_|\s]{3,}$/.test(lines[i].trim())){i++;continue}
      para.push(lines[i].trim());i++;
    }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('');
}

async function startPaidGeneration(formData,paymentToken){
  const plan=planInput.value;const bar=document.getElementById('generatorBar');const steps=[...document.querySelectorAll('#generatorSteps [data-gen]')];const done=document.getElementById('generatorDone');
  const output=document.getElementById('generatedPlanOutput'), subtitle=document.getElementById('generatorSubtitle');
  done.hidden=true;output.innerHTML='';bar.style.width='8%';steps.forEach(s=>s.classList.remove('done'));
  const normalizedPlan=String(plan).replace(',','.');const tier=/14\.99\s*€/.test(normalizedPlan)?14.99:/9\.99\s*€/.test(normalizedPlan)?9.99:/4\.99\s*€/.test(normalizedPlan)?4.99:4.99;
  const use=finderSnapshot?.planUse||'self';
  const financeMode=['bank','funding','both'].includes(use);
  const useLabel=use==='bank'?'Bank-/Kreditfassung':use==='funding'?'Förder-/Gründungsfinanzierungsfassung':use==='both'?'Gründer- + Finanzierungsdossier':'Gründerplan für die eigene Umsetzung';
  const qualityLabel=tier===14.99?'Pro · 16–25 Seiten':tier===9.99?'Plus · 11–15 Seiten':'Start · 6–10 Seiten';
  const depthLabel=financeMode?'Erweiterte Finanzprüfung + Dossier':'Strategie + Umsetzung';
  document.getElementById('generatorQuality').textContent=qualityLabel;
  document.getElementById('generatorUse').textContent=useLabel;
  document.getElementById('generatorDepth').textContent=depthLabel;
  const eta=financeMode?'ca. 4–6 Minuten':'ca. 3–5 Minuten';
  subtitle.textContent=`Profil wird übergeben · geplante Ausarbeitung ${eta} …`;
  let phase=0;
  const phaseText=[
    'Gründerprofil und Antworten werden zusammengeführt …',
    'Geschäftsidee, Zielgruppe und Angebot werden geschärft …',
    'Markt, Wettbewerb und Positionierung werden ausgearbeitet …',
    'Preise, Kosten und Umsatzlogik werden modelliert …',
    'Marketing, Vertrieb und Kundengewinnung werden geplant …',
    financeMode?'Finanzierungsfähigkeit, Liquidität und Nachweise werden geprüft …':'Finanzlogik, Liquidität und Risiken werden geprüft …',
    'Umsetzungsplan und Erfolgs-Checklisten werden erstellt …',
    'Passende Visuals werden vorbereitet …',
    'Zweite Qualitäts-KI prüft Inhalt, Zahlen und Konsistenz …',
    'Premium-Dokument wird finalisiert …'
  ];
  const widths=[12,22,32,43,54,65,75,84,92];
  function advancePhase(forceIndex=null){
    if(forceIndex!==null)phase=forceIndex;
    if(phase<steps.length){steps[phase]?.classList.add('done');bar.style.width=`${widths[Math.min(phase,widths.length-1)]}%`;subtitle.textContent=phaseText[phase]||subtitle.textContent;phase++;}
  }
  advancePhase();
  const phaseTimer=setInterval(()=>{if(phase<7)advancePhase()},12000);
  try{
    const r=await fetch('/api/generate-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan,customer:{name:formData.name||'',email:formData.email||''},goal:formData.goal||selectedIdea||'',profile:finderSnapshot,conversation:window.__blupiTranscript||[],paymentToken})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.error||'KI-Demo konnte nicht gestartet werden.');
    clearInterval(phaseTimer);
    while(phase<8)advancePhase();
    const doc=data.document||{};
    const imgs=(data.images||[]).filter(x=>x&&x.url);
    const hero=imgs[0]?.url?`<figure class="blueprint-hero"><img src="${imgs[0].url}" alt="Passendes Business-Motiv"></figure>`:'';
    const bodyVisuals=imgs.slice(1).map((x,i)=>`<figure class="blueprint-inline-image"><img src="${x.url}" alt="Business-Motiv ${i+2}"><figcaption>Visualisierung passend zum Vorhaben</figcaption></figure>`);
    function weaveVisualsIntoBody(html, visuals){
      if(!visuals.length)return html;
      const sections=html.split(/(?=<h2\b)/i);
      if(sections.length<2){
        const paras=html.split(/(?<=<\/p>)/i);
        visuals.forEach((v,i)=>{const at=Math.min(paras.length,Math.max(1,Math.round((i+1)*paras.length/(visuals.length+1))));paras.splice(at+i,0,`<div class="blueprint-visual-block">${v}</div>`)});
        return paras.join('');
      }
      visuals.forEach((v,i)=>{
        const target=Math.min(sections.length-1,Math.max(1,Math.round((i+1)*(sections.length-1)/(visuals.length+1))));
        sections[target]=sections[target].replace(/(<\/p>|<\/ul>|<\/div>)/i,`$1<div class="blueprint-visual-block">${v}</div>`);
      });
      return sections.join('');
    }
    const bodyHtml=weaveVisualsIntoBody(basicMarkdownToHtml(doc.markdown||data.plan||''),bodyVisuals);
    const factors=(doc.successFactors||[]).map((x,i)=>`<div class="success-factor"><span>0${i+1}</span><strong>${String(x).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</strong></div>`).join('');
    const weeks=(doc.weeklyPlan||[]).map(w=>`<section class="week-card"><h3>${String(w.week||'Woche').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</h3>${(w.tasks||[]).map(t=>`<label class="check-task"><span class="check-box">☐</span><span>${String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</span></label>`).join('')}</section>`).join('');
    const safeTitle=String(doc.title||'Dein Businessplan').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    const safeSubtitle=String(doc.subtitle||'Individuell auf dein Vorhaben zugeschnitten').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    const safeSummary=String(doc.executiveSummary||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    const safeCustomerName=String(data.customerName||formData.name||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    currentPrintPayload={document:doc,images:imgs,package:data.package,customerName:String(data.customerName||formData.name||''),financeMode,generatedAt:new Date().toISOString()};
    const esc=v=>String(v??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    const assumptions=(doc.planningAssumptions||[]).length?`<div class="planning-assumptions"><h3>Planungsannahmen</h3><ul class="blueprint-list">${(doc.planningAssumptions||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'';
    const financialTables=(doc.financialTables||[]).map((t,idx)=>{
      const cols=(t.columns||[]);
      const rows=(t.rows||[]);
      return `<div class="financial-table-block"><div class="financial-table-kicker">KALKULATION ${String(idx+1).padStart(2,'0')}</div><h3>${esc(t.title||'Kalkulation')}</h3><div class="blueprint-table-wrap"><table class="blueprint-table"><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map((_,j)=>`<td>${esc((r||[])[j]||'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${t.note?`<p class="financial-table-note">${esc(t.note)}</p>`:''}</div>`;
    }).join('');
    const financeNumbers=(financialTables||assumptions)?`<section class="blueprint-financials"><div class="section-number">02</div><div class="section-copy"><span class="section-kicker">ZAHLEN & PLANUNGSLOGIK</span><h2>Konkrete Kalkulation des Vorhabens</h2>${assumptions}${financialTables}</div></section>`:'';
    output.innerHTML=`<article class="print-blueprint blueprint-v28 blueprint-v32">
      <section class="blueprint-cover">
        <div class="cover-topline"><span class="cover-brand">ERSTELLI</span><span class="cover-doc-type">BUSINESS PLAN</span></div>
        <div class="cover-accent-rule"></div>
        <div class="cover-kicker">DEIN PERSÖNLICHER BUSINESSPLAN</div>
        <h1>${safeTitle}</h1><p>${safeSubtitle}</p>
        <div class="cover-meta"><span>${String(data.package).replace('.',',')} € Plantiefe</span><span>Maßgeschneidert für ${safeCustomerName}</span><span>${new Date().toLocaleDateString('de-DE')}</span></div>
        ${hero}
        <div class="cover-bottom-note"><span>Strategie</span><span>Finanzen</span><span>Umsetzung</span></div>
      </section>
      <section class="blueprint-summary"><div class="section-number">01</div><div class="section-copy"><span class="section-kicker">EXECUTIVE SUMMARY</span><h2>Das Vorhaben auf einen Blick</h2><p>${safeSummary}</p></div></section>
      ${financeNumbers}
      <section class="blueprint-body"><div class="body-rail"><span>ERSTELLI</span></div><div class="body-content">${bodyHtml}</div></section>
      ${financeMode&&doc.lenderSummary?`<section class="finance-dossier"><div class="section-number">F</div><div class="finance-inner"><span class="section-kicker">FINANZIERUNGSDOSSIER</span><h2>Für Bank, Kredit oder Förderung vorbereitet</h2><p>${String(doc.lenderSummary).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</p><div class="finance-checklist">${(doc.financeChecklist||[]).map(x=>`<label class="check-task"><span class="check-box">☐</span><span>${String(x).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</span></label>`).join('')}</div></div></section>`:''}
      <section class="success-section"><div class="section-number">02</div><div class="section-copy"><span class="section-kicker">VIER ERFOLGSFAKTOREN</span><h2>Worauf es jetzt wirklich ankommt</h2><div class="success-grid">${factors}</div></div></section>
      <section class="weekly-section"><div class="section-number">03</div><div class="section-copy"><span class="section-kicker">DEIN 4-WOCHEN-START</span><h2>Schritt für Schritt ins Machen</h2><p class="weekly-intro">Hake jeden Punkt ab. Kleine, konsequente Schritte sind wichtiger als alles sofort perfekt zu machen.</p><div class="weeks-grid">${weeks}</div></div></section>
      <section class="blueprint-disclaimer"><div class="disclaimer-mark">!</div><div><strong>Hinweis</strong><p>${String(doc.disclaimer||'Zahlen und Annahmen vor verbindlicher Nutzung prüfen.').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</p></div></section>
      <section class="blueprint-thanks"><div class="thanks-mark">E</div><span class="section-kicker">PERSÖNLICH FÜR DICH ERSTELLT</span><h2>Businessplan maßgeschneidert für ${safeCustomerName}</h2><p>Danke für dein Vertrauen. Wir wünschen dir viel Erfolg bei deinem Vorhaben.</p><strong>Bis bald!</strong></section>
    </article>`;
    while(phase<steps.length)advancePhase();bar.style.width='100%';done.hidden=false;
    document.getElementById('generatorDoneTitle').textContent='Dein individueller Businessplan ist fertig.';
    document.getElementById('generatorDoneText').textContent=data.emailed?`Zusätzlich wurde er an ${formData.email} gesendet.`:(formData.email?'Der Plan wurde erstellt. Der E-Mail-Versand ist im Demo-Server noch nicht konfiguriert.':'Du hast keine E-Mail angegeben – deshalb wird er nur hier angezeigt.');
    subtitle.textContent='Fertig – erstellt, unabhängig geprüft und bei Bedarf automatisch verbessert.';
    saveActivePurchase({plan,goal:finderSnapshot?.vision||formData.goal||'',email:formData.email||'',paymentToken:paymentToken||'',html:output.innerHTML,package:data.package,printPayload:{document:doc,images:[],package:data.package,customerName:String(data.customerName||formData.name||''),financeMode,generatedAt:new Date().toISOString()}});
  }catch(err){
    clearInterval(phaseTimer);
    bar.style.width='0%';subtitle.textContent='Kurzer technischer Fehler – deine Angaben bleiben gespeichert.';done.hidden=false;
    document.getElementById('generatorDoneTitle').textContent='Erstellung unterbrochen';
    document.getElementById('generatorDoneText').textContent='Deine Eingaben sind nicht verloren. Du kannst die Erstellung direkt erneut starten.';
    const safeErr=String(err.message||err).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    output.innerHTML=`<div class="generation-retry"><p><strong>Technischer Hinweis:</strong> ${safeErr}</p><button type="button" class="btn btn-primary" id="retryGenerationBtn">Erstellung erneut versuchen</button></div>`;
    document.getElementById('retryGenerationBtn')?.addEventListener('click',()=>startPaidGeneration(formData,paymentToken));
  }

}

document.getElementById('leadForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.currentTarget, errorBox=document.getElementById('checkoutError');
  if(errorBox){errorBox.hidden=true;errorBox.textContent='';}
  if(!requireCompletedFinder()){closeModal();return;}
  if(!form.reportValidity()){if(errorBox){errorBox.hidden=false;errorBox.textContent='Bitte fülle zuerst alle Pflichtfelder korrekt aus.';}return;}
  const fd=Object.fromEntries(new FormData(form).entries());
  if(String(fd.name||'').trim().split(/\s+/).filter(Boolean).length<2){if(errorBox){errorBox.hidden=false;errorBox.textContent='Bitte gib deinen Vor- und Nachnamen ein.';}form.elements.name?.focus();return;}
  const draft={plan:planInput.value,customer:{name:fd.name,email:fd.email},goal:fd.goal||selectedIdea||'',profile:finderSnapshot,conversation:window.__blupiTranscript||[]};
  const submitBtn=form.querySelector('button[type="submit"]');
  const originalLabel=submitBtn?.textContent||'Zahlungspflichtig bestellen';
  if(submitBtn){submitBtn.disabled=true;submitBtn.textContent='Stripe Checkout wird geöffnet …';}
  try{
    localStorage.setItem(PAYMENT_DRAFT_KEY,JSON.stringify({...draft,savedAt:Date.now()}));
    const r=await fetch('/api/create-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...draft,provider:'stripe'})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.url)throw new Error(data.error||'Stripe Checkout konnte nicht gestartet werden.');
    location.assign(data.url);
  }catch(err){
    if(submitBtn){submitBtn.disabled=false;submitBtn.textContent=originalLabel;}
    if(errorBox){errorBox.hidden=false;errorBox.textContent=err.message||'Zahlung konnte nicht gestartet werden.';}else alert(err.message);
  }
});

async function resumePaidCheckout(){
  const q=new URLSearchParams(location.search), provider=q.get('payment_provider');
  if(q.get('payment_cancelled')==='1'){
    const raw=localStorage.getItem(PAYMENT_DRAFT_KEY);
    if(raw){
      try{
        const draft=JSON.parse(raw); finderSnapshot=draft.profile||{}; finderCompleted=true; selectedIdea=draft.goal||'';
        openOrder(draft.plan);
        const box=document.getElementById('checkoutError'); if(box){box.hidden=false;box.textContent='Die Zahlung wurde abgebrochen. Es wurde nichts berechnet.';}
      }catch{}
    }
    history.replaceState({},'',location.pathname+location.hash); return;
  }
  if(!provider)return;
  const raw=localStorage.getItem(PAYMENT_DRAFT_KEY); if(!raw)return;
  let draft; try{draft=JSON.parse(raw)}catch{return}
  try{
    const payload=provider==='stripe'?{provider,sessionId:q.get('session_id')}:{provider,orderId:q.get('token')};
    const r=await fetch('/api/verify-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.paid)throw new Error(data.error||'Zahlung wurde nicht bestätigt.');
    finderSnapshot=draft.profile||{};finderCompleted=true;selectedIdea=draft.goal||'';
    modalPlan.textContent=draft.plan;planInput.value=draft.plan;checkoutGoal.value=draft.goal||'';checkoutFormView.hidden=true;generatorView.hidden=false;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
    saveActivePurchase({plan:draft.plan,goal:draft.goal||'',email:draft.customer?.email||'',paymentToken:data.paymentToken||'',html:''});
    await startPaidGeneration({name:draft.customer?.name||'',email:draft.customer?.email||'',goal:draft.goal||''},data.paymentToken);
    localStorage.removeItem(PAYMENT_DRAFT_KEY);history.replaceState({},'',location.pathname+location.hash);
  }catch(err){alert(err.message);}
}
// Live: nach erfolgreicher Stripe-Zahlung Checkout verifizieren und Erstellung fortsetzen.
resumePaidCheckout();

// V42: PDF wird aus den strukturierten Plandaten NEU aufgebaut.
// Es wird bewusst NICHT mehr der Website-DOM geklont. Dadurch können weder
// Grid/Flex-Regeln noch unsichtbare Website-Container schmale Textspalten erzeugen.
function printEsc(v=''){
  return String(v??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
}
function printInline(v=''){
  return printEsc(v).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
}
function markdownToLinearPrint(md=''){
  const lines=String(md||'').replace(/\r/g,'').split('\n');
  const out=[]; let i=0;
  while(i<lines.length){
    const line=lines[i].trim();
    if(!line){i++;continue;}
    if(/^###\s+/.test(line)){out.push(`<h3>${printInline(line.replace(/^###\s+/,''))}</h3>`);i++;continue;}
    if(/^##\s+/.test(line)){out.push(`<h2>${printInline(line.replace(/^##\s+/,''))}</h2>`);i++;continue;}
    if(/^#\s+/.test(line)){out.push(`<h2>${printInline(line.replace(/^#\s+/,''))}</h2>`);i++;continue;}
    if(/^[-*]\s+/.test(line)){
      const items=[];
      while(i<lines.length && /^[-*]\s+/.test(lines[i].trim())){items.push(lines[i].trim().replace(/^[-*]\s+/,''));i++;}
      out.push(`<div class="print-bullets">${items.map(x=>`<p><span>•</span>${printInline(x)}</p>`).join('')}</div>`);
      continue;
    }
    if(/^[-_|\s]{3,}$/.test(line)){i++;continue;}
    const para=[line]; i++;
    while(i<lines.length){
      const n=lines[i].trim();
      if(!n || /^#{1,3}\s+/.test(n) || /^[-*]\s+/.test(n) || /^[-_|\s]{3,}$/.test(n)) break;
      // Roh-Markdown-Tabellen nicht in den Fließtext übernehmen; strukturierte Tabellen kommen separat.
      if(n.includes('|')) break;
      para.push(n); i++;
    }
    out.push(`<p>${printInline(para.join(' '))}</p>`);
    if(i<lines.length && /^[-_|\s]{3,}$/.test(lines[i].trim())) i++;
  }
  return out.join('');
}
function financialTablesToPrint(tables=[]){
  return (tables||[]).map((t,idx)=>{
    const cols=(t.columns||[]).slice(0,5), rows=(t.rows||[]);
    return `<div class="calc-block"><div class="calc-kicker">KALKULATION ${String(idx+1).padStart(2,'0')}</div><h3>${printEsc(t.title||'Kalkulation')}</h3><table><thead><tr>${cols.map(c=>`<th>${printEsc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map((_,j)=>`<td>${printEsc((r||[])[j]||'')}</td>`).join('')}</tr>`).join('')}</tbody></table>${t.note?`<p class="table-note">${printEsc(t.note)}</p>`:''}</div>`;
  }).join('');
}
function buildStructuredPrintDocument(payload){
  const doc=payload?.document||{};
  const images=(payload?.images||[]).filter(x=>x&&x.url);
  const customer=printEsc(payload?.customerName||'');
  const pkg=Number(payload?.package||4.99);
  const hero=images[0]?.url?`<img class="hero" src="${images[0].url}" alt="Business-Motiv">`:'';
  const inlineImages=images.slice(1,3).map((x,i)=>`<figure><img src="${x.url}" alt="Business-Motiv ${i+2}"><figcaption>Visualisierung passend zum Vorhaben</figcaption></figure>`);
  let body=markdownToLinearPrint(doc.markdown||'');
  if(inlineImages.length){
    const parts=body.split(/(?=<h2>)/i);
    inlineImages.forEach((img,i)=>{const at=Math.min(parts.length-1,Math.max(1,Math.round((i+1)*(parts.length-1)/(inlineImages.length+1))));parts[at]=img+parts[at];});
    body=parts.join('');
  }
  const assumptions=(doc.planningAssumptions||[]).length?`<div class="assumptions"><h3>Planungsannahmen</h3>${doc.planningAssumptions.map(x=>`<p><span>•</span>${printEsc(x)}</p>`).join('')}</div>`:'';
  const tables=financialTablesToPrint(doc.financialTables||[]);
  const lender=payload?.financeMode&&doc.lenderSummary?`<section><div class="kicker">FINANZIERUNGSDOSSIER</div><h2>Für Bank, Kredit oder Förderung vorbereitet</h2><p>${printEsc(doc.lenderSummary)}</p>${(doc.financeChecklist||[]).map(x=>`<p class="check">☐ ${printEsc(x)}</p>`).join('')}</section>`:'';
  const factors=(doc.successFactors||[]).map((x,i)=>`<div class="factor"><b>0${i+1}</b><span>${printEsc(x)}</span></div>`).join('');
  const weeks=(doc.weeklyPlan||[]).map(w=>`<div class="week"><h3>${printEsc(w.week||'Woche')}</h3>${(w.tasks||[]).map(t=>`<p class="check">☐ ${printEsc(t)}</p>`).join('')}</div>`).join('');
  const date=new Date(payload?.generatedAt||Date.now()).toLocaleDateString('de-DE');
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Erstelli Businessplan</title><style>
    @page{size:A4;margin:12mm 13mm 14mm}
    *{box-sizing:border-box} html,body{margin:0;padding:0;background:#fff;color:#1d1921;font-family:Arial,Helvetica,sans-serif}
    body{font-size:9.4pt;line-height:1.43} main{width:100%;margin:0;padding:0} section{width:100%;margin:0;padding:4mm 0;border-top:1px solid #eeeaf3}
    .cover{border:0;break-after:page;page-break-after:always;padding-top:2mm}.top{font-size:8pt;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid #e7e2ec;padding-bottom:3mm;margin-bottom:5mm}.top b{color:#6f5cff}
    .rule{height:1.2mm;background:linear-gradient(90deg,#17151d 0 22%,#6f5cff 22% 74%,#eeeaf5 74%);margin-bottom:6mm}.kicker{color:#6f5cff;font-size:7.4pt;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
    h1{font-size:27pt;line-height:1.05;margin:3mm 0 2mm}h2{font-size:16pt;line-height:1.18;margin:4.5mm 0 2mm;padding-left:3mm;border-left:1.2mm solid #6f5cff;break-after:avoid;page-break-after:avoid}h3{font-size:11.5pt;line-height:1.25;margin:3mm 0 1.5mm;break-after:avoid;page-break-after:avoid}
    p{display:block;width:100%;margin:0 0 2.3mm;orphans:3;widows:3;word-break:normal;overflow-wrap:normal;white-space:normal}.subtitle{font-size:11pt;color:#615b67}.meta{display:flex;gap:2mm;flex-wrap:wrap;margin:3mm 0 4mm}.meta span{font-size:7.8pt;background:#f7f5fa;border:1px solid #e9e5ee;border-radius:99px;padding:1.3mm 2.2mm}
    .hero,figure img{display:block;width:100%;height:auto;max-height:52mm;object-fit:cover;border-radius:3mm}figure{display:block;width:100%;margin:4mm 0;break-inside:avoid;page-break-inside:avoid;border:1px solid #e4dfeb;border-radius:3mm;overflow:hidden}figcaption{padding:1.3mm 2mm;background:#faf9fc;color:#756f7c;font-size:7.2pt}
    .summary{font-size:10pt;line-height:1.5}.print-bullets,.assumptions{display:block;width:100%;margin:2.5mm 0 3mm;padding:2.5mm 3.5mm;background:#faf9ff;border-left:1mm solid #d8d0ff}.print-bullets p,.assumptions p{display:block;width:100%;margin:0 0 1.4mm;padding:0;line-height:1.42}.print-bullets p span,.assumptions p span{display:inline-block;width:4mm;color:#6f5cff;font-weight:700}
    .calc-block{display:block;width:100%;margin:4mm 0 5mm;break-inside:auto;page-break-inside:auto}.calc-kicker{font-size:7.5pt;font-weight:800;color:#6f5cff;letter-spacing:.12em}.calc-block h3{margin-top:1mm}
    table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:7.4pt;margin:2mm 0}thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}th,td{padding:1.5mm 1.6mm;text-align:left;vertical-align:top;border-bottom:1px solid #e7e3eb;word-break:normal;overflow-wrap:anywhere;white-space:normal}th{background:#17151d;color:#fff}.table-note{font-size:7.7pt;color:#6f6878;margin-top:1.5mm}
    .check{padding:1.5mm 2mm;margin:0 0 1.3mm;background:#fbfaff;border:1px solid #e6e0ee;border-radius:2mm}.factor,.week{display:block;width:100%;padding:2.5mm 3mm;margin:0 0 2mm;border:1px solid #e2ddea;border-radius:2mm;break-inside:auto;page-break-inside:auto}.factor b{color:#6f5cff;margin-right:2mm}.thanks{text-align:center;padding:8mm 0 4mm}.thanks .badge{width:11mm;height:11mm;margin:0 auto 3mm;border-radius:3mm;background:#6f5cff;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16pt;font-weight:800}.thanks h2{border:0;padding:0}.thanks strong{color:#6f5cff;font-size:12pt}
  </style></head><body><main>
    <section class="cover"><div class="top"><b>ERSTELLI</b> · BUSINESS PLAN</div><div class="rule"></div><div class="kicker">DEIN PERSÖNLICHER BUSINESSPLAN</div><h1>${printEsc(doc.title||'Dein Businessplan')}</h1><p class="subtitle">${printEsc(doc.subtitle||'Individuell auf dein Vorhaben zugeschnitten')}</p><div class="meta"><span>${String(pkg).replace('.',',')} € Plantiefe</span>${customer?`<span>Maßgeschneidert für ${customer}</span>`:''}<span>${date}</span></div>${hero}</section>
    <section><div class="kicker">EXECUTIVE SUMMARY</div><h2>Das Vorhaben auf einen Blick</h2><p class="summary">${printEsc(doc.executiveSummary||'')}</p></section>
    ${(assumptions||tables)?`<section><div class="kicker">ZAHLEN & PLANUNGSLOGIK</div><h2>Konkrete Kalkulation des Vorhabens</h2>${assumptions}${tables}</section>`:''}
    <section><div class="kicker">BUSINESSPLAN</div>${body}</section>
    ${lender}
    <section><div class="kicker">VIER ERFOLGSFAKTOREN</div><h2>Worauf es jetzt wirklich ankommt</h2>${factors}</section>
    <section><div class="kicker">DEIN 4-WOCHEN-START</div><h2>Schritt für Schritt ins Machen</h2>${weeks}</section>
    <section><div class="kicker">HINWEIS</div><p>${printEsc(doc.disclaimer||'Zahlen und Annahmen vor verbindlicher Nutzung prüfen.')}</p></section>
    <section class="thanks"><div class="badge">E</div><div class="kicker">PERSÖNLICH FÜR DICH ERSTELLT</div><h2>Businessplan maßgeschneidert für ${customer||'dich'}</h2><p>Danke für dein Vertrauen. Wir wünschen dir viel Erfolg bei deinem Vorhaben.</p><strong>Bis bald!</strong></section>
  </main></body></html>`;
}
function buildFallbackPrintPayload(article){
  // Nur als Rückfall für alte lokal gespeicherte Pläne. Keine Layout-Klassen übernehmen.
  return {document:{title:article.querySelector('.blueprint-cover h1')?.textContent||'Dein Businessplan',subtitle:article.querySelector('.blueprint-cover>p')?.textContent||'',executiveSummary:article.querySelector('.blueprint-summary p')?.textContent||'',markdown:article.querySelector('.body-content')?.innerText||'',planningAssumptions:[],financialTables:[],successFactors:[],weeklyPlan:[],disclaimer:article.querySelector('.blueprint-disclaimer p')?.textContent||''},images:[...article.querySelectorAll('img')].map((img,i)=>({url:img.src,prompt:'Gespeichertes Visual '+(i+1)})).filter(x=>x.url),package:Number((article.querySelector('.cover-meta span')?.textContent||'4,99').replace(',','.').match(/\d+(?:\.\d+)?/)?.[0]||4.99),customerName:(article.querySelector('.blueprint-thanks h2')?.textContent||'').replace(/^Businessplan maßgeschneidert für\s*/i,''),financeMode:!!article.querySelector('.finance-dossier'),generatedAt:new Date().toISOString()};
}

function canvasPdfDecodeDataUrl(dataUrl){
  const b64=String(dataUrl||'').split(',')[1]||'';const bin=atob(b64);const out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;
}
function canvasPdfAscii(s){return new TextEncoder().encode(String(s));}
function canvasPdfConcat(parts){let len=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(len),o=0;for(const p of parts){out.set(p,o);o+=p.length}return out;}
function canvasPagesToPdf(jpegs,width,height){
  const pageW=595.28,pageH=841.89,objects=[];let objNo=3;
  const pageRefs=[];
  for(let i=0;i<jpegs.length;i++){
    const pageObj=objNo++,imgObj=objNo++,contentObj=objNo++;pageRefs.push(pageObj);
    const jpg=jpegs[i];
    objects.push([imgObj,[canvasPdfAscii(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`),jpg,canvasPdfAscii('\nendstream')]]);
    const content=canvasPdfAscii(`q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im${i+1} Do\nQ\n`);
    objects.push([contentObj,[canvasPdfAscii(`<< /Length ${content.length} >>\nstream\n`),content,canvasPdfAscii('endstream')]]);
    objects.push([pageObj,[canvasPdfAscii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im${i+1} ${imgObj} 0 R >> >> /Contents ${contentObj} 0 R >>`)]]);
  }
  objects.push([1,[canvasPdfAscii('<< /Type /Catalog /Pages 2 0 R >>')]]);
  objects.push([2,[canvasPdfAscii(`<< /Type /Pages /Kids [${pageRefs.map(n=>`${n} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`)]]);
  objects.sort((a,b)=>a[0]-b[0]);
  const parts=[canvasPdfAscii('%PDF-1.4\n%ERSTELLI\n')],offsets=[0];let pos=parts[0].length;
  for(const [n,chunks] of objects){offsets[n]=pos;const head=canvasPdfAscii(`${n} 0 obj\n`),tail=canvasPdfAscii('\nendobj\n');parts.push(head,...chunks,tail);pos+=head.length+chunks.reduce((a,c)=>a+c.length,0)+tail.length;}
  const xrefPos=pos,maxObj=Math.max(...objects.map(o=>o[0]));let xref=`xref\n0 ${maxObj+1}\n0000000000 65535 f \n`;
  for(let i=1;i<=maxObj;i++)xref+=(String(offsets[i]||0).padStart(10,'0')+' 00000 n \n');
  const trailer=`trailer\n<< /Size ${maxObj+1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  parts.push(canvasPdfAscii(xref+trailer));return new Blob(parts,{type:'application/pdf'});
}
async function canvasPdfLoadImage(src){
  if(!src)return null;return await new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;});
}
async function generateStableErstelliPdf(payload){
  const W=1000,H=1414,M=78,CONTENT=W-2*M;const pages=[];let canvas=null,ctx=null,y=0,pageNo=0;
  const PURPLE='#6f5cff',BLACK='#19171f',TEXT='#35303a',MUTED='#6b6570',LILAC='#f6f3ff',LINE='#e5e0ea';
  const doc=payload?.document||{};const pkg=Number(payload?.package||4.99);const customer=String(payload?.customerName||'').trim();
  const pageRange=pkg===14.99?{min:16,max:25}:pkg===9.99?{min:11,max:15}:{min:6,max:10};
  const attempt=Number(payload?._pdfAttempt||0), density=Math.max(0.72,Math.min(1.18,Number(payload?._pdfDensity||1)));
  const sc=n=>Math.max(1,Math.round(n*density));
  const baseSize=sc(pkg===4.99?18:pkg===9.99?19:20); const baseLine=sc(pkg===4.99?26:pkg===9.99?28:29);
  const imgs=[];for(const x of (payload?.images||[]).slice(0,4)){const im=await canvasPdfLoadImage(x?.url);if(im)imgs.push(im)}
  function setFont(size=23,weight='400'){ctx.font=`${weight} ${size}px Arial, Helvetica, sans-serif`;ctx.fillStyle=TEXT;ctx.textBaseline='top'}
  function wrap(text,maxWidth,fontSize=23,weight='400'){
    setFont(fontSize,weight);const words=String(text??'').replace(/\s+/g,' ').trim().split(' ').filter(Boolean),lines=[];let line='';
    for(const w of words){const test=line?line+' '+w:w;if(ctx.measureText(test).width<=maxWidth||!line)line=test;else{lines.push(line);line=w}}if(line)lines.push(line);return lines;
  }
  function footer(){setFont(14,'400');ctx.fillStyle='#77717d';ctx.fillText('Erstelli · Dein persönlicher Businessplan',M,H-42);ctx.textAlign='right';ctx.fillText(`Seite ${pageNo}`,W-M,H-42);ctx.textAlign='left'}
  function finalize(){if(!canvas)return;footer();pages.push(canvasPdfDecodeDataUrl(canvas.toDataURL('image/jpeg',0.90)));canvas=null;ctx=null}
  function newPage(blank=false){if(canvas)finalize();pageNo++;canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);y=M;if(!blank){setFont(14,'700');ctx.fillStyle=PURPLE;ctx.fillText('ERSTELLI',M,32);ctx.fillStyle='#aca6b1';ctx.fillText('BUSINESS PLAN',M+78,32);ctx.fillStyle=LINE;ctx.fillRect(M,58,CONTENT,2)}}
  function ensure(h){if(y+h>H-72)newPage()}
  function para(text,opt={}){const size=opt.size||baseSize,lineH=opt.lineH||baseLine,weight=opt.weight||'400',indent=opt.indent||0,color=opt.color||TEXT,max=CONTENT-indent;const lines=wrap(text,max,size,weight);for(const l of lines){ensure(lineH);setFont(size,weight);ctx.fillStyle=color;ctx.fillText(l,M+indent,y);y+=lineH}y+=opt.after??10}
  function heading(text,level=2){const size=sc(level===2?31:25),lineH=sc(level===2?40:33);ensure(Math.max(sc(250),lineH+sc(90)));y+=sc(level===2?15:8);ctx.fillStyle=PURPLE;ctx.fillRect(M,y+4,6,lineH-8);const lines=wrap(text,CONTENT-22,size,'700');for(const l of lines){ensure(lineH);setFont(size,'700');ctx.fillStyle=BLACK;ctx.fillText(l,M+20,y);y+=lineH}y+=10}
  function kicker(text){ensure(sc(60));setFont(sc(14),'700');ctx.fillStyle=PURPLE;ctx.fillText(String(text).toUpperCase(),M,y);y+=sc(26)}
  function bullet(text){const lines=wrap(text,CONTENT-34,baseSize,'400');ensure(Math.min(lines.length,2)*baseLine+8);setFont(baseSize+3,'700');ctx.fillStyle=PURPLE;ctx.fillText('•',M+5,y-1);for(const l of lines){ensure(baseLine);setFont(baseSize,'400');ctx.fillStyle=TEXT;ctx.fillText(l,M+32,y);y+=baseLine}y+=5}
  function checkItem(text){const clean=String(text||'').replace(/^[\s☐□✓✔•-]+/,'').trim();const lines=wrap(clean,CONTENT-42,baseSize,'400');ensure(Math.min(lines.length,2)*baseLine+8);ctx.strokeStyle=PURPLE;ctx.lineWidth=2;ctx.strokeRect(M+4,y+3,16,16);for(const l of lines){ensure(baseLine);setFont(baseSize,'400');ctx.fillStyle=TEXT;ctx.fillText(l,M+34,y);y+=baseLine}y+=6}
  function boxBullets(title,items){heading(title,3);for(const item of items||[])bullet(item);y+=7}
  function image(im,maxH=285){if(!im)return;maxH=sc(maxH);const ratio=im.width/im.height;let w=CONTENT,h=w/ratio;if(h>maxH){h=maxH;w=h*ratio}ensure(h+sc(28));const x=M+(CONTENT-w)/2;ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,18);ctx.clip();ctx.drawImage(im,x,y,w,h);ctx.restore();ctx.strokeStyle=LINE;ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);y+=h+22}
  function table(t,idx){const cols=(t.columns||[]).slice(0,5),rows=(t.rows||[]).slice(0,20);kicker(`Kalkulation ${String(idx+1).padStart(2,'0')}`);heading(t.title||'Kalkulation',3);const cw=CONTENT/Math.max(1,cols.length),pad=sc(8),fs=sc(15),lh=sc(21);
    function drawHeader(){const lineSets=cols.map(c=>wrap(c,cw-pad*2,fs,'700')),rh=Math.max(42,...lineSets.map(a=>a.length*lh+14));ensure(rh+6);ctx.fillStyle=BLACK;ctx.fillRect(M,y,CONTENT,rh);cols.forEach((c,j)=>{let yy=y+8;for(const line of lineSets[j]){setFont(fs,'700');ctx.fillStyle='#fff';ctx.fillText(line,M+j*cw+pad,yy);yy+=lh}});y+=rh;}
    drawHeader();
    rows.forEach(r=>{const lineSets=cols.map((_,j)=>wrap((r||[])[j]||'',cw-pad*2,fs,'400'));const rh=Math.max(36,...lineSets.map(a=>a.length*lh+14));if(y+rh>H-74){newPage();kicker(`Kalkulation ${String(idx+1).padStart(2,'0')} · Fortsetzung`);drawHeader()}ctx.fillStyle=(Math.round(y/10)%2)?'#fff':'#fbfaff';ctx.fillRect(M,y,CONTENT,rh);ctx.strokeStyle=LINE;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(M,y+rh);ctx.lineTo(M+CONTENT,y+rh);ctx.stroke();cols.forEach((_,j)=>{let yy=y+7;for(const line of lineSets[j]){setFont(fs,'400');ctx.fillStyle=TEXT;ctx.fillText(line,M+j*cw+pad,yy);yy+=lh}});y+=rh});y+=8;if(t.note)para(t.note,{size:17,lineH:25,color:MUTED,after:16});
  }
  function parseMarkdown(md){const lines=String(md||'').replace(/\r/g,'').split('\n');let i=0;while(i<lines.length){const line=lines[i].trim();if(!line){i++;continue}let m;if((m=line.match(/^##\s+(.*)$/))){heading(m[1],2);i++;continue}if((m=line.match(/^###\s+(.*)$/))){heading(m[1],3);i++;continue}if(/^[-*]\s+/.test(line)){while(i<lines.length&&/^[-*]\s+/.test(lines[i].trim())){bullet(lines[i].trim().replace(/^[-*]\s+/,''));i++}continue}const p=[line];i++;while(i<lines.length){const n=lines[i].trim();if(!n||/^#{2,3}\s+/.test(n)||/^[-*]\s+/.test(n))break;p.push(n);i++}para(p.join(' '));}}
  // Cover
  newPage(true);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);setFont(17,'700');ctx.fillStyle=PURPLE;ctx.fillText('ERSTELLI',M,72);ctx.fillStyle=BLACK;ctx.fillText('BUSINESS PLAN',M+95,72);ctx.fillStyle=BLACK;ctx.fillRect(M,112,180,6);ctx.fillStyle=PURPLE;ctx.fillRect(M+180,112,430,6);y=190;kicker('Dein persönlicher Businessplan');const titleLines=wrap(doc.title||'Dein Businessplan',CONTENT,49,'700');for(const l of titleLines){setFont(49,'700');ctx.fillStyle=BLACK;ctx.fillText(l,M,y);y+=58}y+=5;para(doc.subtitle||'Individuell auf dein Vorhaben zugeschnitten',{size:25,lineH:36,color:MUTED,after:24});setFont(17,'700');ctx.fillStyle=PURPLE;ctx.fillText(`${String(pkg).replace('.',',')} € Plantiefe`,M,y);if(customer){ctx.fillStyle=TEXT;ctx.fillText(`Maßgeschneidert für ${customer}`,M+190,y)}y+=42;if(imgs[0])image(imgs[0],360);else{ctx.fillStyle=LILAC;ctx.fillRect(M,y,CONTENT,220);setFont(23,'700');ctx.fillStyle=PURPLE;ctx.fillText('STRATEGIE  ·  FINANZEN  ·  UMSETZUNG',M+38,y+85)}
  // Content
  newPage();kicker('Executive Summary');heading('Das Vorhaben auf einen Blick',2);para(doc.executiveSummary||'',{size:22,lineH:32});
  if((doc.planningAssumptions||[]).length){kicker('Zahlen & Planungslogik');boxBullets('Planungsannahmen',doc.planningAssumptions)}
  (doc.financialTables||[]).forEach((t,i)=>table(t,i));
  if(imgs[1]){heading('Visualisierung des Vorhabens',3);image(imgs[1],255)}
  kicker('Businessplan');parseMarkdown(doc.markdown||'');
  if(imgs[2]){heading('Weitere Visualisierung',3);image(imgs[2],240)}
  if(payload?.financeMode&&doc.lenderSummary){kicker('Finanzierungsdossier');heading('Für Bank, Kredit oder Förderung vorbereitet',2);para(doc.lenderSummary);heading('Benötigte Nachweise',3);for(const x of (doc.financeChecklist||[]))checkItem(x)}
  kicker('Vier Erfolgsfaktoren');heading('Worauf es jetzt wirklich ankommt',2);(doc.successFactors||[]).forEach((x,i)=>{ensure(68);ctx.fillStyle=LILAC;ctx.fillRect(M,y,CONTENT,58);setFont(19,'700');ctx.fillStyle=PURPLE;ctx.fillText(`0${i+1}`,M+14,y+16);setFont(19,'700');ctx.fillStyle=BLACK;const ls=wrap(x,CONTENT-80,19,'700').slice(0,2);ls.forEach((l,k)=>ctx.fillText(l,M+65,y+10+k*24));y+=68});
  kicker('Dein 4-Wochen-Start');heading('Schritt für Schritt ins Machen',2);for(const w of (doc.weeklyPlan||[])){heading(w.week||'Woche',3);for(const t of (w.tasks||[]))checkItem(t)}
  kicker('Hinweis');para(doc.disclaimer||'Zahlen und Annahmen vor verbindlicher Nutzung prüfen.',{size:18,lineH:27,color:MUTED});
  ensure(250);y+=35;ctx.textAlign='center';setFont(16,'700');ctx.fillStyle=PURPLE;ctx.fillText('PERSÖNLICH FÜR DICH ERSTELLT',W/2,y);y+=42;setFont(31,'700');ctx.fillStyle=BLACK;ctx.fillText(`Businessplan maßgeschneidert für ${customer||'dich'}`,W/2,y);y+=58;setFont(22,'400');ctx.fillStyle=TEXT;ctx.fillText('Danke für dein Vertrauen. Wir wünschen dir viel Erfolg bei deinem Vorhaben.',W/2,y);y+=46;setFont(27,'700');ctx.fillStyle=PURPLE;ctx.fillText('Bis bald!',W/2,y);ctx.textAlign='left';
  finalize();
  const count=pages.length;
  if(attempt<4 && count>pageRange.max){
    const nextDensity=Math.max(0.72,density*Math.max(0.80,(pageRange.max/count)*0.97));
    return generateStableErstelliPdf({...payload,_pdfDensity:nextDensity,_pdfAttempt:attempt+1});
  }
  if(attempt<4 && count<pageRange.min){
    const nextDensity=Math.min(1.18,density*Math.min(1.12,(pageRange.min/Math.max(1,count))*1.03));
    return generateStableErstelliPdf({...payload,_pdfDensity:nextDensity,_pdfAttempt:attempt+1});
  }
  if(count<pageRange.min||count>pageRange.max)throw new Error(`PDF-Umfang ${count} Seiten liegt außerhalb der gebuchten ${pageRange.min}–${pageRange.max} Seiten. Bitte Erstellung erneut ausführen.`);
  return canvasPagesToPdf(pages,W,H);
}

document.getElementById('printGeneratedPlan')?.addEventListener('click',async()=>{
  const article=document.querySelector('#generatedPlanOutput .print-blueprint');
  if(!article){alert('Der Businessplan ist noch nicht fertig. Bitte warte, bis die Erstellung abgeschlossen ist.');return;}
  const btn=document.getElementById('printGeneratedPlan'),old=btn?.textContent||'PDF herunterladen';let payload=currentPrintPayload||buildFallbackPrintPayload(article);if(!payload.images?.length){payload={...payload,images:[...article.querySelectorAll('img')].map((img,i)=>({url:img.src,prompt:'Business-Visual '+(i+1)})).filter(x=>x.url)}}
  try{if(btn){btn.disabled=true;btn.textContent='Stabile PDF wird gebaut …'}const blob=await generateStableErstelliPdf(payload);const url=URL.createObjectURL(blob);const clean=(payload.customerName||'Kunde').replace(/[^a-zA-Z0-9äöüÄÖÜß_-]+/g,'_');const a=document.createElement('a');a.href=url;a.download=`Erstelli_Businessplan_${clean}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),8000);if(btn)btn.textContent='PDF heruntergeladen ✓';setTimeout(()=>{if(btn)btn.textContent=old},1800)}catch(e){console.error(e);alert('PDF konnte nicht erstellt werden: '+String(e.message||e))}finally{if(btn)btn.disabled=false}
});


// Business Finder V10 – vollständigeres Gründerprofil + Finanzierungsmodus
(()=>{
  const form=document.getElementById('businessFinder');if(!form)return;
  const allSteps=[...form.querySelectorAll('.finder-step')],bar=document.getElementById('finderBar'),progressWrap=document.querySelector('.finder-progress'),count=document.getElementById('finderCount'),next=document.getElementById('finderNext'),back=document.getElementById('finderBack'),result=document.getElementById('finderResult'),changeAnswers=document.getElementById('changeAnswers'),vision=document.getElementById('visionInput'),visionCount=document.getElementById('visionCount');
  const occupationInput=form.querySelector('[name="occupation"]'),occupationQuestion=document.getElementById('occupationQuestion'),occupationHelp=document.getElementById('occupationHelp'),experienceQuestion=document.getElementById('experienceQuestion'),experienceHelp=document.getElementById('experienceHelp');
  let current=0;
  function status(){return form.querySelector('input[name="status"]:checked')?.value||''}
  function occupation(){return String(occupationInput?.value||'').trim()}
  function visionText(){return String(vision?.value||'').trim()}
  function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9äöüß ]/g,' ')}
  function meaningfulWords(v){return norm(v).split(/\s+/).filter(w=>w.length>3&&!['möchte','mochte','machen','selbststandig','selbstständig','werden','einen','eine','mein','meine','dabei','aktuell','bereich','arbeit'].includes(w))}
  function occupationMatchesVision(){
    const o=meaningfulWords(occupation()),v=new Set(meaningfulWords(visionText()));
    if(!o.length||!v.size)return false;
    return o.some(w=>v.has(w)||[...v].some(x=>x.includes(w)||w.includes(x)));
  }
  function shouldSkip(step){
    const n=step.querySelector('input,textarea')?.name;
    if(n==='occupation')return status()==='arbeitssuchend';
    if(n==='experience')return occupationMatchesVision() && ['angestellt','selbstständig','ausbildung-studium'].includes(status());
    return false;
  }
  function visibleSteps(){return allSteps.filter(s=>!shouldSkip(s))}
  function tailor(){
    const st=status();
    if(occupationQuestion&&occupationHelp){
      if(st==='selbstständig'){occupationQuestion.textContent='In welchem Bereich arbeitest du aktuell selbstständig?';occupationHelp.textContent='Nur kurz den Bereich nennen – Details fragen wir nicht doppelt ab.'}
      else if(st==='ausbildung-studium'){occupationQuestion.textContent='Welche Ausbildung oder welches Studium machst du?';occupationHelp.textContent='Das hilft uns nur, vorhandenes Wissen passend einzuordnen.'}
      else {occupationQuestion.textContent='Was machst du aktuell beruflich?';occupationHelp.textContent='Eine kurze Berufsbezeichnung reicht. Wenn das zu deinem Vorhaben passt, fragen wir deine Erfahrung nicht noch einmal ab.'}
    }
    if(experienceQuestion){
      const idea=visionText();
      const short=idea.length>0?(idea.length>70?idea.slice(0,67)+'…':idea):'deinem geplanten Vorhaben';
      experienceQuestion.textContent=`Wie viel praktische Erfahrung hast du mit „${short}“?`;
      if(experienceHelp)experienceHelp.textContent='Nur wenn das aus deinem Beruf oder deinen bisherigen Angaben noch nicht klar hervorgeht.';
    }
  }
  function normalizeCurrent(){
    tailor(); let guard=0;
    while(allSteps[current]&&shouldSkip(allSteps[current])&&guard++<allSteps.length){current=Math.min(current+1,allSteps.length-1)}
  }
  function show(){
    normalizeCurrent();
    const vis=visibleSteps(),active=allSteps[current],pos=Math.max(0,vis.indexOf(active));
    allSteps.forEach(x=>x.classList.toggle('active',x===active));
    bar.style.width=((pos+1)/Math.max(1,vis.length)*100)+'%';count.textContent=`Frage ${pos+1} von ${vis.length}`;back.disabled=pos===0;next.textContent=pos===vis.length-1?'Plan berechnen':'Weiter';
  }
  function selected(){const step=allSteps[current];const req=[...step.querySelectorAll('[required]')];return req.every(el=>el.type==='radio'?[...step.querySelectorAll(`input[name="${el.name}"]`)].some(r=>r.checked):String(el.value||'').trim().length>=2)}
  function esc(v){return String(v||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function labelIncome(v){return ({'0':'kein aktuelles Einkommen','under1500':'unter 1.500 €','1500-3000':'1.500–3.000 €','3000+':'über 3.000 €'})[v]||v}
  function labelBudget(v){return ({'0-350':'0–350 €','351-1000':'351–1.000 €','1001-2000':'1.001–2.000 €','2001-5000':'2.001–5.000 €','5000+':'5.000 €+'})[v]||v}
  function labelGoal(v){return ({'1000':'bis 1.000 €','3000':'1.000–3.000 €','5000':'3.000–5.000 €','5000+':'5.000 €+'})[v]||v}
  function labelUse(v){return ({self:'eigener Start',bank:'Bank / Finanzierung',funding:'Förderung / Gründungsfinanzierung',both:'eigener Start + Finanzierung'})[v]||v}
  function inferDirection(d){const v=norm(d.vision);if(/shop|handel|verkauf|e commerce|produkt/.test(v))return 'Handel / Verkauf';if(/software|automation|automatis|app|ki |ai /.test(v))return 'Digital / Software';if(/firma|unternehmen|b2b|agentur/.test(v))return 'B2B / Dienstleistung';if(/garten|reinigung|montage|reparatur|pflege|service|handwerk/.test(v))return 'Lokale Dienstleistung';return 'Individuelles Vorhaben'}
  function localPlanFor(d){
    const v=(d.vision||'').toLowerCase(); let score=0;
    const budgetMax=({'0-350':350,'351-1000':1000,'1001-2000':2000,'2001-5000':5000,'5000+':999999})[d.budget]||0;
    if(d.time==='20')score+=1;if(d.time==='full')score+=2;if(d.income==='5000')score+=1;if(d.income==='5000+')score+=2;
    const terms=['mitarbeiter','personal','team','standort','laden','kiosk','lager','maschinen','fuhrpark','mehrere standorte','franchise','investor','produktion','gastronomie','onlineshop','e-commerce','import','export','leasing','miete'];score+=terms.filter(x=>v.includes(x)).length;if(v.length>500)score+=1;
    const bank=['bank','funding','both'].includes(d.planUse);
    if(budgetMax<=350)return {price:4.99,name:'Start',why:'Dein Investitionsrahmen ist klein. Deshalb bleibt der Plan bewusst bei 4,99 €, damit möglichst viel Geld für die Umsetzung übrig bleibt.',bank};
    if(budgetMax<=2000)return {price:score>=4?9.99:4.99,name:score>=4?'Plus':'Start',why:score>=4?'Dein Vorhaben hat mehrere Bausteine, bleibt finanziell aber überschaubar. Dafür reicht der 9,99-€-Plan.':'Für deinen überschaubaren Start reicht der 4,99-€-Plan.',bank};
    return {price:score>=4?14.99:9.99,name:score>=4?'Pro':'Plus',why:score>=4?'Größerer Investitionsrahmen plus mehrere komplexe Bausteine: dafür ist die tiefste 14,99-€-Stufe sinnvoll.':'Trotz des größeren Budgets reicht für den beschriebenen Umfang die 9,99-€-Stufe.',bank};
  }
  async function planFor(d){try{const r=await fetch('/api/recommend',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile:d,context:d.vision||''})});if(r.ok){const x=await r.json();return {price:Number(x.price),name:x.name,why:x.reason,bank:['bank','funding','both'].includes(d.planUse)}}}catch{}return localPlanFor(d)}
  function displayPrice(n){return Number(n).toFixed(2).replace('.',',')}
  async function finish(){
    const d=Object.fromEntries(new FormData(form).entries());if(status()==='arbeitssuchend')d.occupation='';if(occupationMatchesVision())d.experience=d.experience||'berufliche Erfahrung aus aktuellem Hintergrund';finderSnapshot=d;finderCompleted=true;const gateNotice=document.getElementById('finderGateNotice');if(gateNotice)gateNotice.hidden=true;const rec=await planFor(d),goal=(d.vision||'').trim();selectedIdea=goal||inferDirection(d);
    form.hidden=true;progressWrap.hidden=true;count.hidden=true;document.getElementById('resultText').innerHTML='Deine Angaben wurden ohne Doppelungen zu einem passenden Profil zusammengeführt.';
    const bank=rec.bank?`<div class="bank-mode"><strong>Finanzierungsbausteine werden mit aufgenommen</strong><p>Ohne automatischen Preisaufschlag kann die spätere Ausarbeitung zusätzlich Kapitalbedarf, Mittelverwendung, Gründerprofil, Annahmen, Rentabilität, Liquidität und Risiken strukturieren. Eine Annahme durch Bank oder Förderstelle ist damit nicht garantiert.</p></div>`:'';
    const savings=d.savings?`${Number(d.savings).toLocaleString('de-DE')} €`:'nicht angegeben';
    const profileItems=[['Status',d.status],d.occupation&&['Beruf / Hintergrund',d.occupation],['Aktuell',labelIncome(d.currentIncome)],['Investition',labelBudget(d.budget)],d.savings&&['Erspartes',savings],['Ziel',labelGoal(d.income)],d.experience&&['Erfahrung',d.experience],['Verwendung',labelUse(d.planUse)]].filter(Boolean).map(([a,b])=>`<div><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('');
    document.getElementById('planRecommendation').innerHTML=`<div class="plan-rec-top"><div><span class="plan-rec-label">PASSENDE PLANTIEFE</span><h4>${rec.name}</h4><p>${esc(rec.why)}</p></div><div class="plan-rec-price"><strong>${displayPrice(rec.price)} €</strong><span>einmalig</span></div></div><div class="profile-summary-grid">${profileItems}</div><div class="plan-rec-context"><span>Dein Vorhaben</span><strong>${esc(goal)}</strong><small>${esc(inferDirection(d))} · Die spätere Erstellung erhält nur relevante, nicht doppelte Angaben.</small></div>${bank}<div class="plan-rec-actions"><button type="button" class="btn btn-primary" id="takeRecommendedPlan">${displayPrice(rec.price)} € Plan wählen</button><a href="#preise" class="text-plan-link">Andere Plantiefe wählen</a></div>`;
    document.getElementById('takeRecommendedPlan').addEventListener('click',()=>openOrder(`${rec.name} – ${displayPrice(rec.price)} €`));result.hidden=false;
  }
  function nextVisibleIndex(from,dir){let i=from+dir;while(i>=0&&i<allSteps.length&&shouldSkip(allSteps[i]))i+=dir;return i}
  next.addEventListener('click',()=>{if(!selected()){allSteps[current].animate([{transform:'translateX(0)'},{transform:'translateX(-7px)'},{transform:'translateX(7px)'},{transform:'translateX(0)'}],{duration:260,easing:'ease-out'});return}tailor();const ni=nextVisibleIndex(current,1);if(ni<allSteps.length){current=ni;show()}else finish()});
  back.addEventListener('click',()=>{const ni=nextVisibleIndex(current,-1);if(ni>=0){current=ni;show()}});
  function restoreFinderSnapshot(){
    if(!finderSnapshot||typeof finderSnapshot!=='object')return;
    Object.entries(finderSnapshot).forEach(([name,value])=>{
      if(value===undefined||value===null)return;
      const fields=[...form.querySelectorAll(`[name="${CSS.escape(name)}"]`)];
      if(!fields.length)return;
      const str=String(value);
      fields.forEach(el=>{
        if(el.type==='radio'||el.type==='checkbox')el.checked=el.value===str;
        else el.value=str;
      });
    });
    if(visionCount&&vision)visionCount.textContent=`${vision.value.length} / 2000`;
    tailor();
  }
  changeAnswers?.addEventListener('click',()=>{
    // Bearbeiten bedeutet: vorhandene Antworten wieder öffnen – niemals leer neu starten.
    finderCompleted=false;
    restoreFinderSnapshot();
    result.hidden=true;form.hidden=false;progressWrap.hidden=false;count.hidden=false;
    current=0;
    while(current<allSteps.length-1&&shouldSkip(allSteps[current]))current++;
    show();
    document.getElementById('business-finder').scrollIntoView({behavior:'smooth',block:'start'});
  });
  form.addEventListener('change',e=>{tailor();if(e.target.matches('input[type=radio]'))e.target.nextElementSibling?.animate([{transform:'scale(.98)'},{transform:'scale(1.035)'},{transform:'scale(1)'}],{duration:260,easing:'cubic-bezier(.2,.9,.3,1.25)'})});
  vision.addEventListener('input',()=>{visionCount.textContent=`${vision.value.length} / 2000`;tailor()});show();
})();

// Frag Erstelli V48 – Backend-Verbindung für Produktion und lokale Entwicklung
(()=>{
  const launcher=document.getElementById('blupiLauncher'),panel=document.getElementById('blupiPanel'),close=document.getElementById('blupiClose'),form=document.getElementById('blupiForm'),input=document.getElementById('blupiInput'),messages=document.getElementById('blupiMessages'),toFinder=document.getElementById('blupiToFinder');
  const connectionLabel=document.getElementById('blupiConnection');
  let liveAIConnected=false;
  async function checkAIConnection(){
    if(location.protocol==='file:'){
      liveAIConnected=false;
      if(connectionLabel)connectionLabel.textContent='nicht verfügbar';
      return false;
    }
    try{
      const r=await fetch('/api/status',{cache:'no-store'});
      const data=await r.json();
      liveAIConnected=Boolean(r.ok&&data.openai);
      if(connectionLabel)connectionLabel.textContent=liveAIConnected?'bereit':'nicht verfügbar';
      return liveAIConnected;
    }catch{
      liveAIConnected=false;
      if(connectionLabel)connectionLabel.textContent='nicht verfügbar';
      return false;
    }
  }
  checkAIConnection();
  if(!launcher)return;

  const transcript=[];
  const profile={budget:null,savings:null,currentIncome:null,status:null,occupation:null,financeNeed:null,planUse:null,idea:null,rawIdea:null,mode:null,contact:null,time:null,skill:null,uncertain:false,wantsBig:false,goal:null,location:null,risk:null,experience:null,audience:null,topics:[],lastIntent:null,lastQuestion:null};
  const memory={lastTopic:null,lastAdviceType:null,turn:0};
  const MAX_ERSTELLI_QUESTIONS=15;
  let blupiQuestionCount=0;
  const countQuestions=text=>Math.max(0,(String(text||'').match(/\?/g)||[]).length);

  const topics=[
    {id:'influencer',label:'Influencer / Creator',aliases:['influencer','creator','tiktok','instagram','youtube','streamer','content','social media'],re:/influenc|creator|tiktok|instagram|youtube|social.?media|content.?creator|streamer|reichweite|follower/,model:'Eine klar erkennbare Nische aufbauen, wiederholbare Content-Formate testen und Reichweite später über Kooperationen, Affiliate, eigene Produkte oder Dienstleistungen monetarisieren.',first:'Eine Zielgruppe wählen, 10 konkrete Videoideen notieren und 3 davon mit vorhandener Technik veröffentlichen.',tips:['Eine klare Nische wählen, damit Besucher in Sekunden verstehen, wofür dein Account steht.','Mit 2–3 festen Formaten starten statt jeden Tag ein komplett neues Konzept zu bauen.','Nicht am Anfang Geld für Reichweite verbrennen – zuerst prüfen, welcher Content organisch funktioniert.','Schon früh ein Einnahmemodell mitdenken: Kooperation, Affiliate, Dienstleistung oder eigenes Produkt.'],costs:['Smartphone/ vorhandene Technik: 0 €','Licht/Mikro optional: 50–150 €','Testbudget für Tools/Design: 0–100 €'],revenue:['Affiliate oder kleine Kooperationen','UGC-Aufträge für Unternehmen','Eigene Dienstleistung oder digitales Produkt'],risks:['Reichweite ist nicht garantiert','Zu breite Themen verwässern den Account','Zu frühe Ausgaben bringen selten einen Vorteil']},
    {id:'phone',label:'Smartphone-Reparaturservice',aliases:['handy reparieren','smartphone reparieren','iphone reparieren','display wechseln','akku wechseln'],re:/handy|smartphone|iphone|display|akku|telefon.*repar|reparier.*handy|phone.?repair/,model:'Mit wenigen standardisierten Reparaturen lokal oder mobil starten, Ersatzteile möglichst auftragsbezogen einkaufen und über Bewertungen Vertrauen aufbauen.',first:'Eine Preisliste für 3–5 Reparaturen erstellen, die du wirklich sicher ausführen kannst.',tips:['Am Anfang nur Reparaturen anbieten, die du sicher beherrschst.','Teure Ersatzteile möglichst erst nach Auftrag bestellen.','Vorher/Nachher-Fotos, klare Festpreise und Diagnosebedingungen schaffen Vertrauen.','Abholung oder mobiler Service kann einen Laden am Anfang überflüssig machen.'],costs:['Werkzeug/Verbrauch: ca. 100–300 €','Erste Ersatzteile: 150–400 €','Lokale Werbung: 50–150 €'],revenue:['Festpreis je Reparatur','Express-Zuschlag','Datenübertragung / Einrichtung als Zusatzleistung'],risks:['Bauteilschäden und Reklamationen','Kapitalbindung in falschen Ersatzteilen','Datenschutz bei Kundengeräten']},
    {id:'cartrade',label:'Autohandel / Fahrzeugverkauf',aliases:['autos verkaufen','auto verkaufen','fahrzeuge verkaufen','autohandel','gebrauchtwagenhandel','fahrzeughandel','autos kaufen und verkaufen'],re:/autos? (?:ver)?kauf|fahrzeug(?:e)? (?:ver)?kauf|autohandel|gebrauchtwagen|fahrzeughandel|autos? handeln/,model:'Mit klarer Fahrzeugkategorie, sauberer Einkaufskalkulation, Dokumentation und realistischen Standzeiten planen. Kapitalbindung und Gewährleistungsrisiken von Anfang an berücksichtigen.',first:'Eine Fahrzeugklasse und ein maximales Einkaufsbudget festlegen und drei reale Beispielkalkulationen durchrechnen.',tips:['Nicht „alle Autos“ handeln – zuerst eine klare Preis- oder Fahrzeugklasse wählen.','Einkauf, Aufbereitung, Zulassung/Überführung, Standzeit und mögliche Nacharbeit je Fahrzeug kalkulieren.','Fahrzeughistorie und Dokumentation sind zentral für Vertrauen.','Kapital nicht komplett in ein einziges Fahrzeug binden, wenn dadurch keine Reserve bleibt.'],costs:['Fahrzeugeinkauf: abhängig vom Modell','Aufbereitung/Nacharbeit: individuell kalkulieren','Inserate/Überführung/Dokumente: je Fahrzeug einplanen'],revenue:['Marge aus Fahrzeugverkauf','Vermittlungsverkauf gegen Provision','Zusatzleistungen rund um Aufbereitung oder Beschaffung'],risks:['Kapitalbindung und lange Standzeiten','Mängel/Nacharbeit und Gewährleistung','Fehleinkauf reduziert die Marge']},
    {id:'cars',label:'Fahrzeugservice / Autopflege',aliases:['auto','kfz','fahrzeugpflege','detailing'],re:/auto|fahrzeug|wagen|kfz|car.?detailing|fahrzeugpflege|autopflege|reifen|felgen/,model:'Mit einer klaren mobilen oder lokalen Leistung starten, Material pro Auftrag kalkulieren und erst bei stabiler Nachfrage Ausstattung erweitern.',first:'Eine konkrete Leistung auswählen und einen Beispielauftrag komplett durchrechnen.',tips:['Eine Leistung wählen, die ohne teuren Standort testbar ist.','Vorher/Nachher-Bilder sind bei Fahrzeugservices besonders stark.','Material, Fahrtzeit und Nacharbeit im Preis berücksichtigen.','Erst zusätzliche Geräte kaufen, wenn die Leistung tatsächlich gebucht wird.'],costs:['Basisausrüstung: 150–700 €','Verbrauchsmaterial: 20–80 € je nach Leistung','Lokale Werbung: 50–200 €'],revenue:['Einzelaufträge','Premium-Pakete','Wiederkehrende Pflegepakete'],risks:['Schäden am Kundenfahrzeug','Fahrtzeit frisst Marge','Saisonale Nachfrage']},
    {id:'ai',label:'KI- & Automationsservice',aliases:['ki','ai','automation','chatbot','software'],re:/\bki\b|\bai\b|künstliche intelligenz|kuenstliche intelligenz|automati|chatbot|software|workflow|agent|bot bauen/,model:'Ein klar abgegrenztes Problem für eine Zielgruppe lösen und daraus eine wiederholbare Automationsleistung mit Einrichtung plus optionaler Betreuung machen.',first:'Ein einziges Kundenproblem auswählen und dafür eine kleine Demo bauen, die in zwei Minuten verständlich ist.',tips:['Nicht „KI für alles“ verkaufen – ein messbares Problem lösen.','Eine Demo ist überzeugender als lange Erklärungen.','Pilotkunden helfen, echte Anforderungen zu erkennen.','Wiederkehrende Betreuung kann planbarer sein als nur einmalige Einrichtung.'],costs:['Domain/Tools: 20–100 €','API/Testbudget: 20–100 €','Akquise: zunächst überwiegend Zeit'],revenue:['Einrichtungsgebühr','Monatliche Betreuung','Individuelle Erweiterungen'],risks:['Zu komplexes Angebot','Toolkosten ohne zahlende Kunden','Abhängigkeit von Drittanbietern']},
    {id:'ecom',label:'E-Commerce / Produktverkauf',aliases:['shop','ecommerce','dropshipping','etsy','amazon'],re:/e.?commerce|onlineshop|shop|produkt.*verkauf|dropship|amazon|etsy|waren|online.?handel/,model:'Mit wenigen Produkten oder einem Hero-Produkt starten, Marge vollständig kalkulieren und erst nach messbarer Nachfrage Bestand und Werbung erhöhen.',first:'Ein Produkt wählen und Einkauf, Verkaufspreis, Versand, Retouren und mögliche Werbekosten vollständig durchrechnen.',tips:['Nicht sofort viel Bestand einkaufen.','Eine enge Zielgruppe ist leichter zu vermarkten als ein allgemeiner Shop.','Retouren und Werbung gehören in die Kalkulation.','Gewinnerprodukte erst nach echten Verkäufen ausbauen.'],costs:['Shop/Domain: 20–100 €','Samples/Testbestand: 100–600 €','Werbetest: 50–300 €'],revenue:['Produktmarge','Bundles','Wiederkäufe'],risks:['Retouren','Werbekosten','Kapitalbindung im Lager']},
    {id:'clean',label:'Reinigungsservice',aliases:['reinigung','putzen','cleaning'],re:/reinig|putz|cleaning|haushaltshilfe|fenster.?reinigung/,model:'In einem kleinen Gebiet mit klaren Paketen, Mindestauftragswert und möglichst wiederkehrenden Kunden starten.',first:'Drei Pakete mit Dauer, Leistungsumfang und Mindestpreis formulieren.',tips:['Ein kleines Einsatzgebiet spart Fahrtzeit.','Mindestauftragswert verhindert unrentable Kleinstaufträge.','Wiederkehrende Kunden sind wertvoller als ständig neue Einzelaufträge.','Lokale Empfehlungen und Bewertungen sind oft stärker als teure Werbung.'],costs:['Ausrüstung: 100–400 €','Verbrauch: 10–30 € pro Auftrag','Lokale Werbung: 20–100 €'],revenue:['Einzelreinigung','Abo/regelmäßige Reinigung','Zusatzleistungen'],risks:['Fahrtzeit','Preisdruck','Haftung bei Schäden']},
    {id:'pets',label:'Haustier-Service',aliases:['hund','katze','gassi','tiersitter'],re:/hund|katze|tier|pet|gassi|dog.?walking|tiersitter|hundesitter/,model:'Vertrauensbasierten lokalen Service mit kleinem Einsatzgebiet und wiederkehrenden Buchungen aufbauen.',first:'Ein Gebiet, eine Tierart und 2–3 konkrete Leistungen festlegen.',tips:['Vertrauen ist wichtiger als ein komplizierter Markenauftritt.','Ein kleines Gebiet spart Zeit und Fahrtkosten.','Regelmäßige Pakete sorgen für planbarere Einnahmen.','Kennenlerntermin und Referenzen senken die Hemmschwelle.'],costs:['Grundausstattung: 20–100 €','Versicherung je nach Leistung','Lokale Sichtbarkeit: 0–100 €'],revenue:['Einzeltermine','Wochenpakete','Urlaubsbetreuung'],risks:['Haftung','Terminabhängigkeit','Vertrauensaufbau']},
    {id:'food',label:'Food / Gastronomie',aliases:['essen','catering','imbiss','cafe'],re:/essen|food|restaurant|café|cafe|imbiss|backen|kuchen|catering|koch|meal.?prep/,model:'Mit einem kleinen Angebot, Vorbestellung, Catering oder Pop-up testen, bevor hohe Standortkosten entstehen.',first:'Ein Kernprodukt wählen und vollständige Stückkosten inklusive Verpackung berechnen.',tips:['Ein Signature-Produkt ist leichter zu vermarkten als eine riesige Karte.','Wareneinsatz und Verderb pro Produkt mitrechnen.','Vorbestellung kann Kapitalbindung reduzieren.','Standortkosten erst eingehen, wenn Nachfrage nachgewiesen ist.'],costs:['Testproduktion: 100–500 €','Verpackung: 30–150 €','Genehmigungen/Hygiene je nach Modell'],revenue:['Direktverkauf','Catering','Vorbestellungen'],risks:['Verderb','Genehmigungen','Hohe Fixkosten bei Standort']},
    {id:'fashion',label:'Mode / Brand',aliases:['mode','fashion','kleidung','hoodie','shirt','schmuck'],re:/mode|fashion|kleidung|shirt|hoodie|schmuck|brand|marke|streetwear/,model:'Mit einem Hero-Produkt oder einer Mini-Kollektion über Content und Community validieren, bevor größere Mengen bestellt werden.',first:'Ein Hero-Produkt definieren und Zielkunde, Verkaufspreis und vollständige Herstellungskosten festhalten.',tips:['Mit wenigen Produkten starten.','Samples auf Qualität prüfen, bevor Menge bestellt wird.','Community und Content vor Lagerbestand aufbauen.','Retouren, Verpackung und Versand in die Marge rechnen.'],costs:['Samples: 100–500 €','Shop/Domain: 20–100 €','Kleine Content-/Werbetests: 50–250 €'],revenue:['Produktmarge','Drops','Bundles'],risks:['Lagerbestand','Retouren','Austauschbare Marke']},
    {id:'beauty',label:'Beauty / Pflege-Service',aliases:['beauty','nails','friseur','lashes'],re:/beauty|kosmetik|nägel|naegel|nails|friseur|haare|make.?up|lashes|wimpern|brows/,model:'Terminbasierten Service mit wenigen klaren Leistungen, guten Beispielen und hoher Wiederbuchungsquote aufbauen.',first:'Drei Leistungen auswählen und Preis pro benötigter Stunde inklusive Material berechnen.',tips:['Mit wenigen Leistungen starten.','Terminzeit und Material gehören vollständig in den Preis.','Wiederbuchung direkt beim Termin erhöht Kundenwert.','Lokale Sichtbarkeit und Bewertungen sind entscheidend.'],costs:['Material/Ausrüstung: 150–800 €','Arbeitsplatz je nach Modell','Lokale Werbung: 30–150 €'],revenue:['Einzeltermine','Pakete','Zusatzprodukte'],risks:['Termin-Ausfälle','Hygiene/Regeln','Preisdruck']},
    {id:'fitness',label:'Fitness / Coaching',aliases:['fitness','coach','training'],re:/fitness|training|personal.?trainer|coach|coaching|ernährung|ernaehrung|sport|workout/,model:'Ein konkretes Ergebnis für eine klar definierte Zielgruppe anbieten und zunächst mit Einzelkunden oder einer kleinen Gruppe validieren.',first:'Zielgruppe und ein konkretes 4- bis 8-Wochen-Ergebnis formulieren.',tips:['Ein klares Ergebnis verkauft sich besser als „Coaching für alle“.','Kleine Pilotgruppe vor großer Plattform.','Fortschritt strukturiert dokumentieren.','Pakete sind planbarer als Einzelstunden.'],costs:['Landingpage/Tools: 0–100 €','Content: vorhandene Technik','Werbetest: 50–200 €'],revenue:['1:1-Pakete','Gruppenprogramme','Digitale Produkte'],risks:['Starker Wettbewerb','Vertrauensaufbau','Rechtliche Grenzen bei Gesundheitsversprechen']},
    {id:'photo',label:'Foto / Video / Kreativservice',aliases:['foto','video','design','webdesign'],re:/foto|fotograf|video|filmer|design|grafik|logo|webdesign|kreativ|schnitt|editing/,model:'Spezialisierten Kreativservice mit klaren Paketen, sichtbaren Beispielen und direkter Akquise verkaufen.',first:'Ein Beispielpaket mit Ergebnis, Lieferzeit und Festpreis erstellen.',tips:['Nicht alles gleichzeitig anbieten.','Drei gute Beispielarbeiten reichen für einen ersten Test.','Pakete mit klarer Anzahl an Ergebnissen begrenzen Revisionen.','Direkte Akquise bei passenden Unternehmen kann schneller sein als breite Werbung.'],costs:['Vorhandene Technik nutzen','Portfolio/Domain: 20–100 €','Akquise: zunächst Zeit'],revenue:['Projektpauschalen','Retainer','Zusatzleistungen'],risks:['Endlose Revisionen','Unklare Leistungsgrenzen','Projektabhängige Einnahmen']},
    {id:'garden',label:'Gartenpflege / Gartenservice',aliases:['garten','gartenbau','gartenpflege','rasen','hecke','heckenschnitt','grünpflege','gruenpflege','laub','beetpflege'],re:/gartenbau|gartenpflege|gartenarbeit|gartenservice|rasen|hecke|heckenschnitt|grünpflege|gruenpflege|laub|beetpflege|garten/,model:'Als lokaler Gartenservice mit klaren, wiederholbaren Leistungen starten: zum Beispiel Rasenpflege, Heckenschnitt, Beetpflege und saisonale Arbeiten. Preise so kalkulieren, dass Anfahrt, Arbeitszeit, Entsorgung und Material mitverdient werden.',first:'Drei bis fünf Leistungen festlegen, dafür einfache Einstiegspreise oder Mindestauftragswerte definieren und im eigenen Umkreis erste Kunden ansprechen.',tips:['Mit 3–5 klaren Leistungen starten statt sofort „alles rund um Garten“ anzubieten.','Anfahrt, Entsorgung und Maschinenverschleiß müssen im Preis stecken.','Vorher/Nachher-Fotos und lokale Bewertungen sind für Vertrauen besonders wichtig.','Wiederkehrende Pflegeintervalle sind wertvoller als nur einzelne spontane Aufträge.','Für kleine Starts reichen Kleinanzeigen, lokale Gruppen, Flyer und Empfehlungen oft vor bezahlter Werbung.'],costs:['Vorhandenes Werkzeug zuerst nutzen','Verbrauchsmaterial und Entsorgung pro Auftrag kalkulieren','Kleine lokale Werbung: ca. 20–100 € zum Test'],revenue:['Einzelaufträge mit Mindestauftragswert','Regelmäßige Pflegepakete','Saisonleistungen wie Frühjahrs- oder Herbstpflege'],risks:['Fahrtzeit und Entsorgung können die Marge auffressen','Wetter und Saison beeinflussen die Auslastung','Nur Leistungen anbieten, die fachlich und rechtlich sauber erbracht werden können']},
    {id:'trades',label:'Handwerk / Montage-Service',aliases:['handwerk','montage','hausmeister'],re:/handwerk|montage|möbel|moebel|maler|garten|hausmeister|reparatur|installation|aufbau/,model:'Mit Leistungen starten, für die Werkzeug und Erfahrung vorhanden sind, und über Mindestauftragswerte wirtschaftliche Aufträge sichern.',first:'Fünf Leistungen festlegen, die du zuverlässig in einem klaren Zeitfenster erledigen kannst.',tips:['Nur Leistungen anbieten, die du sicher beherrschst.','Anfahrt und Materialbeschaffung einpreisen.','Fotos abgeschlossener Arbeiten schaffen Vertrauen.','Mindestauftragswert schützt deine Zeit.'],costs:['Vorhandenes Werkzeug nutzen','Verbrauch: auftragsbezogen','Lokale Werbung: 20–100 €'],revenue:['Festpreisaufträge','Stundenpakete','Wiederkehrende Objektbetreuung'],risks:['Haftung','Fahrtzeit','Materialfehler']},
    {id:'resell',label:'Reselling / Handel',aliases:['reselling','flipping','weiterverkauf'],re:/resell|weiterverkauf|flippen|flipping|gebraucht|ankauf|verkaufen.*ebay|kleinanzeigen|second.?hand/,model:'Mit einer bekannten Produktkategorie, striktem Einkaufslimit und schneller Kapitalrotation starten.',first:'Eine Produktkategorie wählen und 20 tatsächlich verkaufte Vergleichsangebote prüfen.',tips:['Nur Kategorien handeln, deren Preise du einschätzen kannst.','Vor jedem Einkauf ein Maximalgebot festlegen.','Gebühren, Versand und Defektrisiko in die Marge rechnen.','Am Anfang ist schneller Kapitalumschlag wichtiger als maximaler Gewinn pro Stück.'],costs:['Testbestand: 100–800 €','Verpackung: 20–80 €','Plattformgebühren je Verkauf'],revenue:['Handelsspanne','Bundles','Aufbereitung vor Wiederverkauf'],risks:['Defekte Ware','Langsame Verkäufe','Gebühren und Rückgaben']},
    {id:'agency',label:'Agentur / B2B-Dienstleistung',aliases:['agentur','b2b','marketingagentur'],re:/agentur|b2b|lead.?gen|marketing.?service|social.?media.?agentur|seo|ads|werbeagentur/,model:'Ein messbares Ergebnis für eine enge B2B-Zielgruppe als klares Paket verkaufen und mit wenigen Pilotkunden standardisieren.',first:'Eine Zielgruppe und ein einziges Ergebnis definieren, für das Unternehmen bereits Geld ausgeben.',tips:['Zielgruppe eng halten.','Ergebnis statt Stunden verkaufen.','Pilotkunden nutzen, um Prozess und Einwände zu lernen.','Monatliche Retainer erst anbieten, wenn Leistung wiederholbar ist.'],costs:['Tools: 0–150 €','Website: 20–100 €','Akquise: primär Zeit'],revenue:['Setup-Gebühr','Monatlicher Retainer','Performance-Bonus'],risks:['Zu breites Angebot','Kundenakquise','Lieferfähigkeit']},
    {id:'digital',label:'Digitales Produkt',aliases:['ebook','kurs','template','digitales produkt'],re:/ebook|e-book|onlinekurs|kurs|template|vorlage|digitales produkt|pdf verkaufen|notion/,model:'Ein kleines digitales Produkt zu einem konkreten Problem erstellen, mit einer echten Zielgruppe testen und erst danach Umfang und Werbung erhöhen.',first:'Ein Problem wählen, für das Menschen bereits aktiv nach Lösungen suchen, und eine Mini-Version erstellen.',tips:['Klein starten statt monatelang einen riesigen Kurs zu bauen.','Erst Nachfrage testen, dann Produktion ausweiten.','Ein konkretes Ergebnis ist besser als allgemeines Wissen.','Landingpage und Beispielauszug erhöhen Vertrauen.'],costs:['Erstellung: hauptsächlich Zeit','Domain/Checkout: 20–100 €','Testwerbung optional: 50–200 €'],revenue:['Einmalverkauf','Bundles','Upsells'],risks:['Keine Nachfrage','Zu allgemeines Thema','Starker Wettbewerb']},
    {id:'localservice',label:'Lokale Dienstleistung',aliases:['service','dienstleistung'],re:/dienstleistung|lokaler service|service anbieten|selbstständig.*service|selbststaendig.*service/,model:'Ein einfaches lokales Problem für eine klar definierte Zielgruppe lösen und mit wenigen Aufträgen Preis und Ablauf testen.',first:'Eine Leistung, ein Gebiet und einen Mindestpreis festlegen und 10 potenzielle Kunden direkt ansprechen.',tips:['Klein starten und schnell echte Kundenkontakte suchen.','Mindestpreis und Einsatzgebiet begrenzen.','Vorher/Nachher oder Referenzen zeigen.','Wiederkehrende Leistungen bevorzugen.'],costs:['Ausrüstung je nach Leistung','Lokale Sichtbarkeit: 0–100 €','Puffer für ersten Auftrag'],revenue:['Einzelaufträge','Pakete','Wiederkehrende Betreuung'],risks:['Fahrtzeit','Preisdruck','Unklare Leistungsgrenzen']}
  ];

  const generic={id:'generic',label:'Deine Geschäftsidee',model:'Die Idee auf Zielgruppe, Problem, Angebot und einen möglichst kleinen Markttest herunterbrechen. Erst nach echter Nachfrage mehr Kapital einsetzen.',first:'Schreibe die Idee in einem Satz: „Ich helfe [Zielgruppe], [Problem] durch [Angebot] zu lösen.“',tips:['Die Idee auf eine konkrete Zielgruppe und ein klares Problem reduzieren.','Die günstigste testbare Version bauen, bevor Geld gebunden wird.','Früh mit echten potenziellen Kunden sprechen.','Nur das ausbauen, was in der Praxis Nachfrage zeigt.'],costs:['Test zunächst möglichst günstig','Nur notwendige Werkzeuge/Materialien','Reserve nicht komplett ausgeben'],revenue:['Direktverkauf','Pakete oder wiederkehrende Leistung','Zusatzleistungen'],risks:['Unklare Zielgruppe','Zu frühe Investitionen','Angebot ohne echte Nachfrage']};

  const normalize=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').replace(/[“”„]/g,'"').replace(/\s+/g,' ').trim();
  const escapeHtml=v=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const euro=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
  const parseNumber=raw=>Number(String(raw).replace(/[.\s]/g,'').replace(',','.'));
  const has=(s,re)=>re.test(s);

  function openErstelli(){panel.hidden=false;launcher.setAttribute('aria-expanded','true');setTimeout(()=>input.focus(),60)}
  window.openErstelli=openErstelli;
  window.closeErstelli=()=>{panel.hidden=true;launcher.setAttribute('aria-expanded','false')};
  launcher.addEventListener('click',()=>panel.hidden?openErstelli():window.closeErstelli());
  close.addEventListener('click',window.closeErstelli);
  document.getElementById('openErstelliInline')?.addEventListener('click',openErstelli);
  document.getElementById('navErstelli')?.addEventListener('click',()=>setTimeout(openErstelli,250));

  function add(text,type){const d=document.createElement('div');d.className='blupi-msg '+type;d.textContent=text;messages.appendChild(d);messages.scrollTop=messages.scrollHeight;return d}
  function addHtml(html,type='bot'){const d=document.createElement('div');d.className='blupi-msg '+type+' rich';d.innerHTML=html;messages.appendChild(d);messages.scrollTop=messages.scrollHeight;return d}

  function scoreTopic(s,t){
    let score=0;
    if(t.re.test(s))score+=7;
    for(const a of t.aliases||[]) if(s.includes(normalize(a))) score+=3;
    return score;
  }
  function detectTopic(s){
    const ranked=topics.map(t=>[t,scoreTopic(s,t)]).sort((a,b)=>b[1]-a[1]);
    return ranked[0][1]>0?ranked[0][0]:null;
  }
  function inferIntent(s){
    if(has(s,/plan|fahrplan|schritte|roadmap|startplan|businessplan/))return 'plan';
    if(has(s,/bank|kredit|finanzierung|förder|foerder|darlehen|gründungsbank|gruendungsbank/))return 'finance';
    if(has(s,/preis|paket|welches paket|19|49|99/))return 'package';
    if(has(s,/idee.*vergleich|vergleich|oder lieber|welche.*besser|was ist besser/))return 'compare';
    if(has(s,/kosten|budget|wieviel geld|wie viel geld|investier|startkapital/))return 'budget';
    if(has(s,/verdien|umsatz|einnahm|gewinn|geld machen|monetaris/))return 'revenue';
    if(has(s,/kunde|kunden finden|akquise|marketing|werbung|verkaufen/))return 'marketing';
    if(has(s,/risiko|gefahr|problem|nachteil|scheitern/))return 'risk';
    if(has(s,/name|marke|branding|logo/))return 'brand';
    if(has(s,/unsicher|keine ahnung|weiss nicht|vielleicht|zweifel|traue|angst/))return 'uncertain';
    if(has(s,/wie starte|anfangen|erste schritt|erster schritt|loslegen/))return 'start';
    if(has(s,/lohnt|sinnvoll|gute idee|meinung|was haltst/))return 'evaluate';
    if(s.includes('?'))return 'question';
    return 'statement';
  }

  function learn(text){
    const s=normalize(text); memory.turn++;
    const oldIdea=profile.idea;
    profile.uncertain=has(s,/unsicher|keine ahnung|weiss nicht|vielleicht|noch offen|unentschlossen|zweifel|angst|traue/);
    profile.wantsBig=profile.wantsBig||has(s,/mega viel|richtig viel|gross investieren|skalieren|gross aufziehen|firma aufbauen|team aufbauen|sechsstellig|100000|100.000/);
    const money=[...s.matchAll(/(\d{1,3}(?:[.\s]\d{3})+|\d+)(?:[,.]\d+)?\s*(?:€|euro|eur)/g)].map(m=>parseNumber(m[1])).filter(Number.isFinite);
    const monthly=[...s.matchAll(/(\d{1,3}(?:[.\s]\d{3})+|\d+)\s*(?:€|euro|eur)?\s*(?:im|pro)\s*monat/g)].map(m=>parseNumber(m[1])).filter(Number.isFinite);
    if(monthly.length) profile.goal=Math.max(...monthly);
    if(money.length && !has(s,/paket|kostet|preis.*paket|19(?:[,.]99)?\s*€|49\s*€|99\s*€/)){
      const candidates=money.filter(n=>!profile.goal||n!==profile.goal); if(candidates.length)profile.budget=Math.max(...candidates);
    }
    const t=detectTopic(s);
    if(t){profile.idea=t.label;profile.rawIdea=text.trim();profile.topics.push(t.id);profile.topics=[...new Set(profile.topics)].slice(-6);memory.lastTopic=t.id;}
    else if(has(s,/ich (?:mochte|möchte|will|denke|uberlege|überlege|plane)|idee|business|machen|selbststandig|selbstständig/) && text.trim().length>8){profile.rawIdea=text.trim();if(!profile.idea)profile.idea='Eigene Geschäftsidee'}
    if(has(s,/online|von zuhause|homeoffice|laptop|remote/))profile.mode='online';
    if(has(s,/vor ort|lokal|mobil|beim kunden|in meiner stadt/))profile.mode='lokal / mobil';
    if(has(s,/wenig kunden|kein kunden|wenig kontakt|allein arbeiten|ohne menschen/))profile.contact='wenig Kundenkontakt';
    if(has(s,/viel kunden|gern.*menschen|kontakt.*kunden|mit menschen/))profile.contact='viel Kundenkontakt';
    const hours=s.match(/(\d{1,2})\s*(?:stunden|std)/);if(hours)profile.time=hours[1]+' Std./Woche';
    if(has(s,/technik|repar|schraub|computer|it/))profile.skill='Technik / Reparatur';
    else if(has(s,/verkauf|sales|vertrieb|uberzeugen|überzeugen/))profile.skill='Verkauf / Vertrieb';
    else if(has(s,/design|kreativ|video|foto|content|zeichnen/))profile.skill='Kreativ / Content';
    else if(has(s,/organis|planung|struktur/))profile.skill='Organisation';
    if(has(s,/berlin|hamburg|munchen|muenchen|koln|koeln|frankfurt|leipzig|dresden/)){const m=s.match(/berlin|hamburg|munchen|muenchen|koln|koeln|frankfurt|leipzig|dresden/);if(m)profile.location=m[0]}
    if(has(s,/keine erfahrung|anfanger|anfänger|noch nie/))profile.experience='Anfänger';
    if(has(s,/erfahrung|seit \d+ jahr|kenne mich aus|kann ich/))profile.experience='Vorerfahrung';
    profile.lastIntent=inferIntent(s);
    return {s,t,oldIdea,changed:!!(t&&oldIdea&&oldIdea!==t.label)};
  }

  function currentTopic(){return topics.find(t=>t.id===memory.lastTopic)||topics.find(t=>t.label===profile.idea)||generic}
  function complexityScore(){
    const all=(transcript.join(' ')+' '+(profile.rawIdea||'')).toLowerCase();
    let score=0;
    if(profile.budget>=1500) score+=1;
    if(profile.budget>=5000) score+=1;
    if(profile.goal>=4000) score+=1;
    if(profile.goal>=8000) score+=1;
    if(profile.time && /20|voll/.test(profile.time)) score+=1;
    const terms=['mehrere leistungen','mehrere kunden','mitarbeiter','team','standort','laden','onlineshop','shop','b2b','skalier','franchise','finanzierung','investor','abo','abonnement','automatisierung','werbung','marketing','website','fahrzeuge','maschinen','lager','mieten','personal'];
    score += terms.filter(x=>all.includes(x)).length;
    if(transcript.length>=5) score+=1;
    if(all.length>700) score+=1;
    return Math.min(score,10);
  }
  function recommendedPackage(){
    const b=Number(profile.budget)||0,c=complexityScore();
    if(b>0&&b<=350)return 4.99;
    if(b>350&&b<=2000)return c>=4?9.99:4.99;
    if(b>2000)return c>=4?14.99:9.99;
    return c>=5?14.99:c>=2?9.99:4.99;
  }
  function packageReason(pkg){
    const c=complexityScore();
    if(pkg===4.99)return 'Dein Vorhaben ist im Moment überschaubar. Dafür reicht ein kompakter Plan mit Angebot, Startkosten und klaren ersten Schritten.';
    if(pkg===14.99)return 'Du hast mehrere Bausteine, größere Ziele oder mehr Planungsbedarf genannt. Deshalb ist die zusätzliche Tiefe bei Markt, Zahlen und Kundengewinnung sinnvoll.';
    return 'Für eine normale Einzelgründung ist das meistens der beste Mittelweg: konkrete Preise, Kundengewinnung, Budget und ein 30-Tage-Plan, ohne unnötig groß einzusteigen.';
  }
  function renderPackageRecommendation(){
    const pkg=recommendedPackage(), c=complexityScore();
    const name=pkg===4.99?'Start':pkg===9.99?'Plus':'Pro';
    const dots=[0,1,2,3,4].map((_,i)=>`<i class="${i<Math.max(1,Math.ceil((c+1)/2))?'on':''}"></i>`).join('');
    addHtml(`<div class="blupi-plan"><div class="blupi-plan-kicker">Passender Businessplan</div><strong class="blupi-plan-title">${pkg} € · ${name}</strong><div class="blupi-plan-package"><span>So schätze ich die Komplexität deines Vorhabens ein:</span><div class="complexity-meter">${dots}</div><small class="package-reason">${escapeHtml(packageReason(pkg))}</small><button type="button" class="btn btn-primary blupi-plan-cta" data-blupi-plan="${pkg}">${pkg} € Plan auswählen</button><button type="button" class="blupi-finder-cta" data-blupi-finder="1">Angaben vervollständigen</button></div></div>`,'bot plan-wrap');
  }
  function budgetAdvice(t=currentTopic()){
    const b=profile.budget||0;
    if(!b)return 'Du hast noch kein fixes Budget genannt. Deshalb würde ich zuerst eine Version wählen, die du mit vorhandenen Mitteln testen kannst.';
    const reserve=Math.round(b*.35/10)*10, test=b-reserve;
    if(b<=300)return `Bei ${euro(b)} würde ich fast nichts fest binden: vorhandene Technik nutzen, maximal ${euro(Math.max(50,Math.round(b*.35)))} für einen echten Test einsetzen und den Rest als Puffer behalten.`;
    if(b<=1500)return `Bei ${euro(b)} würde ich ungefähr ${euro(test)} als maximalen Test-Rahmen sehen und etwa ${euro(reserve)} Reserve behalten. Nicht alles auf einmal ausgeben.`;
    if(b<=5000)return `Mit ${euro(b)} kannst du sauber starten. Ich würde trotzdem in Stufen investieren: zuerst Nachfrage testen, danach Ausstattung oder Werbung erhöhen.`;
    return `Bei ${euro(b)} würde ich das Kapital in Test, Ausbau und Reserve aufteilen. Größere Ausgaben erst freigeben, wenn der erste Kanal messbar funktioniert.`;
  }
  function contextLine(){
    return [profile.budget&&`Budget ${euro(profile.budget)}`,profile.mode,profile.contact,profile.skill,profile.time,profile.goal&&`Ziel ${euro(profile.goal)}/Monat`].filter(Boolean).join(' · ');
  }
  function renderTips(t=currentTopic(),count=4){
    addHtml(`<div class="blupi-tip-card"><div class="blupi-plan-kicker">Erstellis direkte Tipps</div><strong class="blupi-plan-title">${escapeHtml(t.label)}</strong>${contextLine()?`<div class="blupi-plan-known">${escapeHtml(contextLine())}</div>`:''}<ul>${t.tips.slice(0,count).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><div class="blupi-tip-first"><span>Mein nächster Schritt für dich</span><b>${escapeHtml(t.first)}</b></div></div>`,'bot plan-wrap');
  }
  function renderPlan(){
    const t=currentTopic(),pkg=recommendedPackage();
    addHtml(`<div class="blupi-plan"><div class="blupi-plan-kicker">Erstellis Startplan</div><strong class="blupi-plan-title">${escapeHtml(profile.idea||t.label)}</strong><div class="blupi-plan-known">${escapeHtml(contextLine()||'Auf Basis unseres bisherigen Gesprächs')}</div><div class="blupi-plan-row"><span>1 · Modell</span><p>${escapeHtml(t.model)}</p></div><div class="blupi-plan-row"><span>2 · Budget</span><p>${escapeHtml(budgetAdvice(t))}</p></div><div class="blupi-plan-row"><span>3 · Heute</span><p>${escapeHtml(t.first)}</p></div><div class="blupi-plan-row"><span>4 · Kunden</span><p>${escapeHtml(t.tips[1]||'Mit einem kleinen echten Markttest anfangen.')}</p></div><div class="blupi-plan-row"><span>5 · Einnahmen</span><p>${escapeHtml((t.revenue||generic.revenue).join(' · '))}</p></div><div class="blupi-plan-row"><span>6 · Risiken</span><p>${escapeHtml((t.risks||generic.risks).join(' · '))}</p></div><div class="blupi-plan-package"><span>Passende Plantiefe für dein Vorhaben:</span><strong>${pkg} € Paket</strong><small>${escapeHtml(packageReason(pkg))}</small></div></div>`,'bot plan-wrap');
  }
  function renderBudget(t=currentTopic()){
    const costs=t.costs||generic.costs;
    addHtml(`<div class="blupi-tip-card"><div class="blupi-plan-kicker">Budget-Idee</div><strong class="blupi-plan-title">${escapeHtml(t.label)}</strong><p>${escapeHtml(budgetAdvice(t))}</p><ul>${costs.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div>`,'bot plan-wrap');
  }
  function renderRevenue(t=currentTopic()){
    addHtml(`<div class="blupi-tip-card"><div class="blupi-plan-kicker">Mögliche Einnahmewege</div><strong class="blupi-plan-title">${escapeHtml(t.label)}</strong><ul>${(t.revenue||generic.revenue).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><div class="blupi-tip-first"><span>Wichtig</span><b>Das sind Modelle, keine garantierten Einnahmen. Erst mit echten Kunden testen.</b></div></div>`,'bot plan-wrap');
  }
  function renderRisk(t=currentTopic()){
    addHtml(`<div class="blupi-tip-card"><div class="blupi-plan-kicker">Darauf würde ich achten</div><strong class="blupi-plan-title">${escapeHtml(t.label)}</strong><ul>${(t.risks||generic.risks).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div>`,'bot plan-wrap');
  }
  function warmIntro(t,changed){
    if(changed)return `Okay 😊 Dann gehen wir jetzt auf ${t.label}. Kein Problem – ich halte dich nicht an der alten Idee fest. Ich nehme dein bisheriges Budget und deine Wünsche einfach mit.`;
    const b=profile.budget?` Dein Budget von ${euro(profile.budget)} habe ich dabei im Kopf.`:'';
    return `Okay 😊 ${t.label} ist konkret genug, damit ich dir direkt helfen kann.${b}`;
  }
  function reply(text){
    const {s,t,changed}=learn(text); const topic=currentTopic(); const intent=profile.lastIntent;

    if(/^(hallo|hi|hey|moin|guten tag|servus)\b/.test(s)){add('Hey 😊 Klar. Schreib einfach so, wie du denkst – auch unvollständig oder mit Tippfehlern. Ich merke mir den Zusammenhang und gebe dir lieber direkt etwas Brauchbares, statt dich mit zehn Fragen abzufragen.','bot');return}

    if(/\b(danke|dankeschön|danke dir|vielen dank|merci)\b/.test(s)){
      add('Sehr gern 😊 Dann wünsche ich dir erstmal viel Erfolg mit deinem Vorhaben. Wenn später noch etwas unklar ist, bin ich wieder da. 💜','bot');return;
    }
    if(/^(tschüss|tschuess|ciao|bis dann|bis bald|mach'?s gut)/.test(s)){add('Mach’s gut 😊 Viel Erfolg beim Start! Wenn du später wieder eine Frage hast, kannst du einfach hier weitermachen.','bot');return;}

    if(intent==='uncertain'){
      const b=profile.budget?`Mit ${euro(profile.budget)} musst du dich überhaupt nicht sofort festlegen.`:'Du musst dich überhaupt nicht sofort festlegen.';
      add(`${b} 😊 Wir behandeln die Idee erstmal nur als Test. Ich würde dir nichts Teures aufschwatzen, sondern schauen, was sich mit möglichst wenig Risiko ausprobieren lässt.`,'bot');
      renderTips(topic,3);return;
    }

    if(intent==='plan'){
      add('Klar 😊 Ich nehme alles, was du bisher genannt hast, und mache daraus direkt einen brauchbaren Startplan. Fehlende Angaben lasse ich offen, statt sie zu erfinden.','bot');renderPlan();return;
    }
    if(intent==='finance'){
      profile.planUse=/förder|foerder/.test(s)?'funding':'bank';
      add('Okay 😊 Dann nehme ich Bank-/Förderungsbausteine einfach mit in deinen Plan. Das macht den Plan nicht automatisch teurer – der Preis richtet sich weiter nach deinem Investitionsrahmen und der tatsächlichen Komplexität.','bot');
      addHtml('<div class="blupi-tip-card"><div class="blupi-plan-kicker">Finanzierungsfassung</div><ul><li>Gründerprofil und Ausgangssituation</li><li>Kapitalbedarf und Mittelverwendung</li><li>Umsatz-, Kosten- und Rentabilitätsannahmen</li><li>Liquiditätsplanung und Risiken</li><li>Begründung des Geschäftsmodells und Kundengewinnung</li></ul><div class="blupi-tip-first"><span>Wichtig</span><b>Das kann eine Finanzierungsvorlage unterstützen, ersetzt aber keine Zusage oder individuelle Anforderungen einer Bank/Förderstelle.</b></div></div>','bot plan-wrap');
      renderPackageRecommendation();return;
    }
    if(intent==='package'){
      const pkg=recommendedPackage();
      add(`Für das, was du mir bisher beschrieben hast, passt der ${pkg}-€-Plan am besten. 😊 Ich berücksichtige dabei zuerst deinen Investitionsrahmen und danach die tatsächliche Komplexität, damit der Plan nicht unverhältnismäßig teuer wird.`,'bot');
      renderPackageRecommendation();return;
    }
    if(intent==='budget'){
      if(t)add(warmIntro(t,changed),'bot');
      else add('Okay 😊 Beim Budget würde ich nicht einfach sagen „mehr ist besser“. Entscheidend ist, wie wenig Geld wir brauchen, um echte Nachfrage zu testen.','bot');
      renderBudget(topic);return;
    }
    if(intent==='revenue'){
      add(`Ja 😊 Bei ${topic.label} würde ich nicht nur an einen Einnahmeweg denken. So könntest du es aufbauen:`,'bot');renderRevenue(topic);return;
    }
    if(intent==='risk'){
      add(`Gute Frage. Bei ${topic.label} würde ich vor allem diese Punkte im Blick behalten:`,'bot');renderRisk(topic);return;
    }
    if(intent==='marketing'){
      add(`Okay 😊 Für ${topic.label} würde ich die Kundengewinnung erstmal simpel halten: eine klar definierte Zielgruppe, ein verständliches Angebot und direkte Sichtbarkeit dort, wo diese Leute sowieso sind. Teure Werbung wäre für mich nicht Schritt 1.`,'bot');
      addHtml(`<div class="blupi-tip-card"><div class="blupi-plan-kicker">Kunden finden</div><ul><li>Ein Angebot in einem Satz formulieren.</li><li>10–20 passende potenzielle Kunden oder Accounts sammeln.</li><li>Mit einer kleinen persönlichen Ansprache testen, worauf Reaktionen kommen.</li><li>Erst nach ersten Rückmeldungen Werbung oder größere Tools bezahlen.</li></ul></div>`,'bot plan-wrap');return;
    }
    if(intent==='start'){
      add(`Wenn du heute anfangen willst: ${topic.first} 😊 Danach würde ich nicht weiter theoretisieren, sondern schauen, was echte Leute darauf sagen.`,'bot');return;
    }
    if(intent==='evaluate'){
      add(`${topic.label} kann funktionieren, aber ich würde die Idee nicht danach bewerten, ob sie „cool“ klingt. Entscheidend sind Nachfrage, erreichbare Kunden, Marge und ob du den ersten Test mit deinem Budget hinbekommst. ${profile.budget?budgetAdvice(topic):'Den ersten Test würde ich möglichst günstig halten.'}`,'bot');
      renderTips(topic,3);return;
    }
    if(intent==='brand'){
      add(`Beim Namen oder Branding würde ich bei ${topic.label} nicht zu früh hängen bleiben 😊 Erst sollte das Angebot klar sein. Danach: kurzer Name, leicht aussprechbar, keine komplizierte Schreibweise und optisch so simpel, dass er auch als Profilbild funktioniert.`,'bot');return;
    }

    if(t){
      add(warmIntro(t,changed),'bot');
      renderTips(t,4);
      if(profile.budget)renderBudget(t);
      renderPackageRecommendation();
      return;
    }

    if(profile.budget && /\d/.test(s)){
      add(`Okay 😊 ${euro(profile.budget)} habe ich als verfügbares Startbudget gespeichert. Ich würde davon nicht automatisch alles einsetzen. Nenn mir einfach irgendeine Richtung – auch sowas wie „Influencer“, „Autos“, „Tiere“, „online etwas verkaufen“ oder etwas völlig anderes – und ich gebe dir direkt konkrete Tipps.`,'bot');return;
    }

    if(intent==='question'){
      add(`Ja 😊 Ich verstehe, worauf du hinauswillst. Für „${text.trim().slice(0,100)}“ würde ich zuerst das gewünschte Ergebnis und die günstigste testbare Variante betrachten. Ich brauche dafür nicht zwingend alle Angaben auf einmal.`,'bot');
      renderTips(topic,3);return;
    }

    add(`Okay 😊 Ich nehme „${text.trim().slice(0,100)}“ als neuen Kontext mit. Ich muss dich dafür nicht sofort ausfragen. Mein erster Gedanke wäre: klein testbar machen, echte Reaktion bekommen und erst danach mehr Geld oder Zeit hineinstecken.`,'bot');
    renderTips(topic,3);
  }

  async function send(text){
    text=text.trim();if(!text)return;
    add(text,'user');transcript.push(text);window.__blupiTranscript=[...transcript];input.value='';
    const connected=await checkAIConnection();
    if(!connected){
      add('Erstelli ist gerade vorübergehend nicht erreichbar. Bitte versuche es in einem Moment erneut. Deine bisherigen Angaben bleiben erhalten.','bot');
      return;
    }
    const typing=add('Erstelli denkt mit …','bot typing');
    try{
      const r=await fetch('/api/blupi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:transcript.slice(-12),profile,finderProfile:finderSnapshot,questionCount:blupiQuestionCount,maxQuestions:MAX_ERSTELLI_QUESTIONS})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(data.error||'offline');
      typing.remove();
      let reply=data.reply||'Erzähl mir kurz mehr über dein Vorhaben.';
      const remaining=Math.max(0,MAX_ERSTELLI_QUESTIONS-blupiQuestionCount);
      if(remaining<=0 && /\?/.test(reply)){
        reply=reply.replace(/[^.!?]*\?+/g,'').replace(/\s{2,}/g,' ').trim() || 'Ich habe jetzt genug Informationen von dir. Ich arbeite mit deinen bisherigen Angaben weiter und gebe dir konkrete Empfehlungen, ohne noch weitere Fragen zu stellen.';
      }
      const asked=Math.min(remaining,countQuestions(reply));
      blupiQuestionCount+=asked;
      add(reply,'bot');
      if(blupiQuestionCount>=MAX_ERSTELLI_QUESTIONS){
        input.placeholder='Max. 15 Rückfragen erreicht – du kannst weiter schreiben …';
      }
      if(data.profile&&typeof data.profile==='object')Object.assign(profile,data.profile);
      if(data.recommendedPlan){
        const price=Number(data.recommendedPlan);
        const wrap=document.createElement('div');wrap.className='blupi-msg bot plan-wrap';
        wrap.innerHTML=`<div class="blupi-ai-rec"><span class="blupi-live-badge">Erstellis Empfehlung</span><strong>${Number(price).toFixed(2).replace('.',',')} € Businessplan</strong><p>${escapeHtml(data.planReason||'Diese Plantiefe passt zu deinen bisherigen Angaben.')}</p><div class="blupi-ai-actions"><button class="primary" type="button" data-ai-plan="${price}">${Number(price).toFixed(2).replace('.',',')} € Plan auswählen</button><button class="secondary" type="button" data-ai-finder="1">Angaben vervollständigen</button></div></div>`;
        messages.appendChild(wrap);messages.scrollTop=messages.scrollHeight;
      }
    }catch(err){
      typing.remove();
      liveAIConnected=false;
      if(connectionLabel)connectionLabel.textContent='vorübergehend nicht verfügbar';
      add('Erstelli konnte die Anfrage gerade nicht verarbeiten. Bitte versuche es in einem Moment erneut. Deine bisherigen Angaben bleiben erhalten.','bot');
    }
  }
  messages.addEventListener('click',e=>{
    const p=e.target.closest('[data-ai-plan]');if(p){openOrder(`KI-Empfehlung – ${Number(p.dataset.aiPlan).toFixed(2).replace('.',',')} €`);return}
    if(e.target.closest('[data-ai-finder]'))toFinder.click();
  });
  form.addEventListener('submit',e=>{e.preventDefault();send(input.value)});
  document.querySelectorAll('[data-blupi]').forEach(b=>b.addEventListener('click',()=>send(b.dataset.blupi)));
  toFinder.addEventListener('click',async()=>{
    const vision=document.getElementById('visionInput');
    if(transcript.length){
      let summary='';
      try{
        const r=await fetch('/api/polish-summary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({conversation:transcript.slice(-16),profile,finderProfile:finderSnapshot})});
        const data=await r.json();
        if(r.ok)summary=String(data.summary||'').trim();
      }catch{}
      if(!summary)summary=[profile.rawIdea||profile.idea,profile.status&&`Aktueller Status: ${profile.status}`,profile.occupation&&`Beruflicher Hintergrund: ${profile.occupation}`,profile.budget&&`Geplantes Investitionsbudget: ${euro(profile.budget)}`,profile.goal&&`Einkommensziel: ${euro(profile.goal)} pro Monat`].filter(Boolean).join('. ');
      vision.value=summary.slice(0,1950);vision.dispatchEvent(new Event('input'));add('Hab ich sauber zusammengefasst und übernommen 😊 Im Finder kannst du den Text noch ändern.','bot');
    }
    setTimeout(()=>{window.closeErstelli();document.getElementById('business-finder').scrollIntoView({behavior:'smooth',block:'start'})},550);
  });
})();
