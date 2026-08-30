const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const crypto = require('crypto');

const ROOT = __dirname;

// Robust .env loader for Windows/Notepad files (including UTF-8 BOM).
// This intentionally runs before reading any config from process.env.
function loadLocalEnv(){
  const envPath = path.join(ROOT, '.env');
  if(!fs.existsSync(envPath)) return;
  let raw = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
  for(const line of raw.split(/\r?\n/)){
    const trimmed = line.trim();
    if(!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if(i < 1) continue;
    const key = trimmed.slice(0,i).trim().replace(/^\uFEFF/, '');
    let value = trimmed.slice(i+1).trim();
    if((value.startsWith('\"') && value.endsWith('\"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1,-1);
    if(key) process.env[key] = value;
  }
}
loadLocalEnv();

const PORT = Number(process.env.PORT || 8787);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const DEMO_PAYMENT_BYPASS=String(process.env.DEMO_PAYMENT_BYPASS||'false').toLowerCase()==='true';
const IS_RAILWAY=Boolean(process.env.RAILWAY_ENVIRONMENT||process.env.RAILWAY_PROJECT_ID||process.env.RAILWAY_SERVICE_ID);
const ALLOW_DEMO_BYPASS=DEMO_PAYMENT_BYPASS && !IS_RAILWAY;
const ERSTELLI_MODEL = process.env.ERSTELLI_MODEL || process.env.BLUPI_MODEL || 'gpt-5.6-luna';
const PLAN_MODEL = process.env.PLAN_MODEL || 'gpt-5.6-terra';
const REVIEW_MODEL = process.env.REVIEW_MODEL || 'gpt-5.6-luna';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || '';
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'gpt-image-2';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PRICE_START = process.env.STRIPE_PRICE_START || '';
const STRIPE_PRICE_PLUS = process.env.STRIPE_PRICE_PLUS || '';
const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO || '';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_ENV = process.env.PAYPAL_ENV || 'sandbox';
const PAYMENT_SIGNING_SECRET = process.env.PAYMENT_SIGNING_SECRET || (STRIPE_SECRET_KEY ? crypto.createHash('sha256').update(STRIPE_SECRET_KEY+'|erstelli-v48-payment-signing').digest('hex') : 'local-development-only');

function json(res, status, data){
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(data));
}
function readBody(req){
  return new Promise((resolve,reject)=>{
    let raw=''; req.on('data',c=>{raw+=c;if(raw.length>1_000_000){reject(new Error('Request too large'));req.destroy();}});
    req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch(e){reject(new Error('Ungültige JSON-Daten'))}});req.on('error',reject);
  });
}
function extractText(data){
  if(typeof data.output_text==='string') return data.output_text;
  for(const item of (data.output||[])) for(const c of (item.content||[])) if(c.type==='output_text' && typeof c.text==='string') return c.text;
  return '';
}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function openai(payload, retries=2){
  if(!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY fehlt. Bitte in .env eintragen.');
  let lastError;
  for(let attempt=0;attempt<=retries;attempt++){
    try{
      const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data=await r.json().catch(()=>({}));
      if(r.ok) return data;
      const msg=data?.error?.message || `OpenAI API Fehler (${r.status})`;
      const retryable=r.status===408||r.status===409||r.status===429||r.status>=500;
      if(!retryable || attempt===retries) throw new Error(msg);
      lastError=new Error(msg);
    }catch(e){
      lastError=e;
      if(attempt===retries) throw e;
    }
    await sleep(900*(attempt+1));
  }
  throw lastError||new Error('Die Erstellung konnte technisch nicht abgeschlossen werden.');
}
function budgetFromProfile(p={}){
  const map={'0-350':350,'0-250':250,'351-1000':1000,'251-1000':1000,'1001-2000':2000,'2001-5000':5000,'5000+':10000};
  return map[p.budget] || (Number(p.budget)||0);
}
function complexityScore(profile={}, contextText=''){
  const txt=String(contextText||profile.vision||profile.rawIdea||profile.idea||'').toLowerCase();
  let score=0;
  const time=String(profile.time||'').toLowerCase();
  const goal=String(profile.goal||profile.income||'').toLowerCase();
  if(time==='full'||time.includes('voll')) score+=2; else if(time==='20'||time.includes('20')) score+=1;
  if(goal.includes('5000+')||Number(profile.goal)>=5000) score+=2; else if(goal.includes('5000')||Number(profile.goal)>=3000) score+=1;
  const heavy=['mitarbeiter','personal','team','standort','laden','kiosk','lager','maschinen','fuhrpark','mehrere standorte','franchise','investor','produktion','gastronomie','onlineshop','e-commerce','import','export','leasing','miete'];
  score += heavy.filter(t=>txt.includes(t)).length;
  if(txt.length>500) score+=1;
  return score;
}
function recommendPlan(profile={}, contextText=''){
  const b=budgetFromProfile(profile), score=complexityScore(profile,contextText);
  if(b && b<=350) return {price:4.99,name:'Start',reason:'Für ein überschaubares Vorhaben reicht die kompakte Start-Stufe für 4,99 €.'};
  if(b && b<=2000) return score>=4?{price:9.99,name:'Plus',reason:'Mehrere Bausteine sprechen für die ausführlichere Plus-Stufe für 9,99 €.'}:{price:4.99,name:'Start',reason:'Für den beschriebenen Umfang reicht Start für 4,99 €.'};
  if(b>2000) return score>=4?{price:14.99,name:'Pro',reason:'Das komplexere Vorhaben profitiert von der maximalen Pro-Tiefe für 14,99 €.'}:{price:9.99,name:'Plus',reason:'Für den beschriebenen Umfang passt Plus für 9,99 €.'};
  return score>=5?{price:14.99,name:'Pro',reason:'Für das komplexere Vorhaben passt Pro für 14,99 €.'}:score>=2?{price:9.99,name:'Plus',reason:'Für die erkennbaren Anforderungen passt Plus für 9,99 €.'}:{price:4.99,name:'Start',reason:'Für den bisherigen Umfang reicht Start für 4,99 €.'};
}
function deterministicPlanCap(profile={}, contextText=''){ return recommendPlan(profile,contextText).price; }

function isSocialOnlyMessage(message=''){
  const s=String(message||'').trim().toLowerCase();
  if(!s) return true;
  return /^(hi|hallo|hey|moin|servus|guten\s+(morgen|tag|abend)|na|hello|yo|danke|dankesch[oö]n|danke dir|tsch[uü]ss|ciao|bye)[!.?\s]*$/i.test(s);
}
function hasConcreteBusinessIdea(profile={}, message=''){
  const idea=String(profile.rawIdea||profile.idea||'').trim();
  if(idea && !/^(eigene gesch[aä]ftsidee|businessidee|idee)$/i.test(idea)) return true;
  const s=String(message||'').toLowerCase();
  return /(kiosk|garten|pflege|service|shop|laden|verkauf|handel|agentur|reparatur|restaurant|imbiss|cafe|caf[eé]|online.?shop|e-?commerce|software|app|beratung|coaching|fotograf|video|reinigung|auto|fahrzeug|handwerk|montage|liefer|transport|event|friseur|beauty|fitness|produkt|marke|selbstst[aä]ndig.*(?:mit|als|im|in)|ich (?:will|möchte|moechte|plane).*(?:aufbauen|eröffnen|eroeffnen|verkaufen|anbieten|gründen|gruenden))/i.test(s);
}
function hasEnoughForRecommendation(profile={}, message='', history=[]){
  if(isSocialOnlyMessage(message)) return false;
  if(!hasConcreteBusinessIdea(profile,message)) return false;
  const detailFields=['budget','savings','currentIncome','status','occupation','financeNeed','planUse','mode','contact','time','skill','goal','location','experience','audience'];
  const detailCount=detailFields.reduce((n,k)=>{const v=profile[k]; return n + (v!==null && v!==undefined && String(v).trim()!=='' ? 1:0)},0);
  const current=String(message||'').trim();
  const explicitlyAsksPlan=/(welchen|welcher|was f[uü]r).*(plan|businessplan|paket)|plan.*(?:nehmen|w[aä]hlen|passt|empfehl)/i.test(current);
  const substantive=current.length>=70 || (Array.isArray(history) && history.join(' ').length>=180);
  return explicitlyAsksPlan || detailCount>=1 || substantive;
}
function safe(s){return String(s??'').slice(0,6000)}


async function handlePolishSummary(req,res){
  const body=await readBody(req);
  const schema={type:'object',additionalProperties:false,properties:{summary:{type:'string'}},required:['summary']};
  const instructions=`Formuliere aus dem Gespräch und den bekannten Profildaten eine kurze, grammatikalisch saubere Beschreibung des Gründungsvorhabens für ein Formularfeld. Schreibe in der Ich-Perspektive des Kunden. Bewahre konkrete Fakten wie Tätigkeit, Idee, Budget, Einkommen, Ziel, Erfahrung und Finanzierungswunsch. Erfinde nichts. Keine Stichpunkt-Metadaten wie "Status:" oder "Gespräch:" und keine Erwähnung von KI oder Chat. 3 bis 7 natürliche Sätze, maximal etwa 900 Zeichen.`;
  const input={conversation:(body.conversation||[]).slice(-16),profile:body.profile||{},finderProfile:body.finderProfile||{}};
  const data=await openai({model:ERSTELLI_MODEL,instructions,input:JSON.stringify(input),reasoning:{effort:'low'},text:{format:{type:'json_schema',name:'finder_summary',strict:true,schema}},store:false,max_output_tokens:500});
  let parsed;try{parsed=JSON.parse(extractText(data))}catch{throw new Error('Zusammenfassung konnte nicht erstellt werden.')}
  return json(res,200,{summary:safe(parsed.summary).slice(0,1950)});
}
async function handleErstelli(req,res){
  const body=await readBody(req);
  const baseProfile=body.finderProfile&&Object.keys(body.finderProfile).length?body.finderProfile:(body.profile||{});
  const unifiedRec=recommendPlan(baseProfile,[body.message,...(body.history||[])].join(' '));
  const cap=unifiedRec.price;
  const schema={
    type:'object',
    additionalProperties:false,
    properties:{
      reply:{type:'string'},
      recommendedPlan:{anyOf:[{type:'number',enum:[4.99,9.99,14.99]},{type:'null'}]},
      planReason:{type:'string'},
      profile:{
        type:'object',
        additionalProperties:false,
        properties:{
          budget:{anyOf:[{type:'number'},{type:'string'},{type:'null'}]},
          savings:{anyOf:[{type:'number'},{type:'string'},{type:'null'}]},
          currentIncome:{anyOf:[{type:'number'},{type:'string'},{type:'null'}]},
          status:{anyOf:[{type:'string'},{type:'null'}]},
          occupation:{anyOf:[{type:'string'},{type:'null'}]},
          financeNeed:{anyOf:[{type:'string'},{type:'null'}]},
          planUse:{anyOf:[{type:'string'},{type:'null'}]},
          idea:{anyOf:[{type:'string'},{type:'null'}]},
          rawIdea:{anyOf:[{type:'string'},{type:'null'}]},
          mode:{anyOf:[{type:'string'},{type:'null'}]},
          contact:{anyOf:[{type:'string'},{type:'null'}]},
          time:{anyOf:[{type:'string'},{type:'null'}]},
          skill:{anyOf:[{type:'string'},{type:'null'}]},
          uncertain:{type:'boolean'},
          wantsBig:{type:'boolean'},
          goal:{anyOf:[{type:'number'},{type:'string'},{type:'null'}]},
          location:{anyOf:[{type:'string'},{type:'null'}]},
          risk:{anyOf:[{type:'string'},{type:'null'}]},
          experience:{anyOf:[{type:'string'},{type:'null'}]},
          audience:{anyOf:[{type:'string'},{type:'null'}]},
          topics:{type:'array',items:{type:'string'}},
          lastIntent:{anyOf:[{type:'string'},{type:'null'}]},
          lastQuestion:{anyOf:[{type:'string'},{type:'null'}]}
        },
        required:['budget','savings','currentIncome','status','occupation','financeNeed','planUse','idea','rawIdea','mode','contact','time','skill','uncertain','wantsBig','goal','location','risk','experience','audience','topics','lastIntent','lastQuestion']
      }
    },
    required:['reply','recommendedPlan','planReason','profile']
  };
  const instructions=`Du bist "Erstelli", ein freundlicher deutschsprachiger Business-Berater auf einer Demo-Webseite. Verstehe auch Tippfehler, Umgangssprache und kurze Nachrichten. Antworte natürlich, konkret und knapp. Merke Gesprächskontext.

WICHTIG ZUR PAKETEMPFEHLUNG:
- Es gibt nur 4,99 €, 9,99 € und 14,99 €. 14,99 € ist die absolute Obergrenze.
- Die endgültige Preisstufe wird serverseitig mit exakt derselben Regel berechnet wie im Business Finder. Du darfst ihr nicht widersprechen.
- Bank-, Förderungs- oder Finanzierungsabschnitte sind KEIN automatischer Aufpreis. Sie können in jeder passenden Stufe enthalten sein.
- Niedriges Investitionsbudget soll möglichst viel Kapital für die eigentliche Gründung übrig lassen.
- Begrüßungen und Smalltalk wie "Hi", "Hallo", "Hey", "Danke" bekommen NIEMALS eine Paket- oder Preisempfehlung. Antworte einfach menschlich, z. B. "Hallo 👋 Wie kann ich dir helfen? Hast du schon eine Geschäftsidee?"
- Nenne Preise oder Pakete erst, wenn eine konkrete Geschäftsidee UND mindestens etwas Kontext zur Ausgangslage erkennbar ist (z. B. Budget, Ziel, Status, Erfahrung, Zeit, Standort oder ein ausreichend ausführlich beschriebenes Vorhaben).
- Wenn erst nur eine Idee genannt wurde, aber noch praktisch kein Rahmen bekannt ist, stelle zuerst höchstens EINE sinnvolle Rückfrage statt sofort einen Preis zu zeigen.
- Du darfst im gesamten Erstelli-Gespräch höchstens 15 echte Rückfragen stellen. Der Wert questionCount im Input zeigt, wie viele Fragen du bereits gestellt hast. Sobald questionCount >= 15 ist, stellst du KEINE weitere Frage mehr, verwendest kein Fragezeichen und arbeitest ausschließlich mit den vorhandenen Angaben weiter. Fasse dann lieber zusammen, gib konkrete Empfehlungen oder verweise auf den Finder.
- Versuche außerdem, nicht unnötig zu fragen: Wenn eine Information bereits aus Gespräch oder Finder hervorgeht, frage sie nie erneut ab.
- Wenn genügend Kontext vorhanden ist, darfst du direkt eine Paketempfehlung geben; der Nutzer muss nicht ausdrücklich danach fragen.
- Bei "danke", "danke für deine Hilfe" o.ä. verabschiede dich freundlich und starte kein neues Thema.
- Unterscheide Branchen sauber: "Autos verkaufen" = Autohandel/Fahrzeughandel, nicht Automotive-Service. Gartenbau/Gartenpflege = Gartenservice/Gartenpflege.
- Erfinde keine Fakten über den Nutzer.

Gib zusätzlich bekannte Profildaten im Feld profile zurück. Nur Informationen übernehmen, die wirklich aus dem Gespräch/Finder hervorgehen.`;
  const input={message:safe(body.message),history:(body.history||[]).slice(-12),knownProfile:body.profile||{},finderProfile:body.finderProfile||{},hardPriceCap:cap,questionCount:Math.max(0,Math.min(15,Number(body.questionCount)||0)),maxQuestions:15};
  const data=await openai({model:ERSTELLI_MODEL,instructions,input:JSON.stringify(input),reasoning:{effort:'low'},text:{format:{type:'json_schema',name:'blupi_reply',strict:true,schema}},store:false,max_output_tokens:1100});
  let parsed; try{parsed=JSON.parse(extractText(data))}catch{throw new Error('Erstelli-Antwort konnte nicht gelesen werden.')}
  const mergedProfile={...baseProfile,...(parsed.profile||{})};
  const questionCount=Math.max(0,Math.min(15,Number(body.questionCount)||0));
  if(questionCount>=15 && /\?/.test(String(parsed.reply||''))){
    parsed.reply=String(parsed.reply||'').replace(/[^.!?]*\?+/g,'').replace(/\s{2,}/g,' ').trim();
    if(!parsed.reply) parsed.reply='Ich habe jetzt genug von dir erfahren. Ich arbeite mit deinen bisherigen Angaben weiter und gebe dir daraus die sinnvollsten nächsten Schritte, ohne dich weiter auszufragen.';
  }
  const history=Array.isArray(body.history)?body.history:[];
  if(hasEnoughForRecommendation(mergedProfile, body.message, history)){
    const finalRec=recommendPlan(mergedProfile,[body.message,...history].join(' '));
    parsed.recommendedPlan=finalRec.price;
    parsed.planReason=finalRec.reason;
  }else{
    parsed.recommendedPlan=null;
    parsed.planReason='';
  }
  return json(res,200,parsed);
}

function parsePlanPrice(pkg=''){
  const raw=String(pkg||'').replace(',', '.').trim();
  // Exakte aktuelle Pakete. Manuelle Kundenauswahl hat immer Vorrang vor Finder-Empfehlungen.
  if(/(?:^|\D)14\.99(?:\D|$)/.test(raw)) return 14.99;
  if(/(?:^|\D)9\.99(?:\D|$)/.test(raw)) return 9.99;
  if(/(?:^|\D)4\.99(?:\D|$)/.test(raw)) return 4.99;
  // Nur für alte lokal gespeicherte Teststände.
  if(/(?:^|\D)5\.99(?:\D|$)/.test(raw)) return 9.99;
  if(/(?:^|\D)2\.99(?:\D|$)/.test(raw)) return 4.99;
  return 4.99;
}

function planPrompt(pkg, planUse='self'){
  const price=parsePlanPrice(pkg);
  const financeMode=['bank','funding','both'].includes(String(planUse||''));
  const financeLabel=planUse==='bank'?'Bank-/Kreditfassung':planUse==='funding'?'Förder-/Gründungsfinanzierungsfassung':planUse==='both'?'Gründer- und Finanzierungsdossier':'interner Gründerplan';
  const specs=price===14.99
    ? {name:'Pro',pageTarget:'16–25 Seiten',depth:'sehr ausführlich, analytisch und entscheidungsorientiert',wordTarget:'ca. 5.000–7.400 Wörter Haupttext',minWords:4800,maxWords:7400,imageCount:3,tableCount:4,days:'90-Tage-Umsetzung'}
    : price===9.99
      ? {name:'Plus',pageTarget:'11–15 Seiten',depth:'deutlich ausführlicher und zahlenorientierter Standard-Businessplan',wordTarget:'ca. 3.000–4.200 Wörter Haupttext',minWords:2850,maxWords:4200,imageCount:2,tableCount:2,days:'60-Tage-Umsetzung'}
      : {name:'Start',pageTarget:'6–10 Seiten',depth:'kompakt, präzise und dennoch substanziell',wordTarget:'ca. 1.350–2.100 Wörter Haupttext',minWords:1300,maxWords:2100,imageCount:1,tableCount:1,days:'30-Tage-Umsetzung'};
  if(financeMode) specs.depth += '; zusätzlich mit vertieftem Finanzierungsdossier';
  return {price,financeMode,financeLabel,...specs};
}

function humanProfile(profile={}){
  const maps={
    status:{angestellt:'angestellt',selbststaendig:'bereits selbstständig',arbeitssuchend:'arbeitssuchend','ausbildung-studium':'in Ausbildung/Studium'},
    currentIncome:{'0-1000':'bis 1.000 € monatlich','1001-2000':'1.001–2.000 € monatlich','2001-3000':'2.001–3.000 € monatlich','3001-5000':'3.001–5.000 € monatlich','5000+':'über 5.000 € monatlich'},
    budget:{'0-350':'0–350 €','351-1000':'351–1.000 €','1001-2000':'1.001–2.000 €','2001-5000':'2.001–5.000 €','5000+':'über 5.000 €'},
    time:{'0-5':'bis 5 Stunden/Woche','6-10':'6–10 Stunden/Woche','11-20':'11–20 Stunden/Woche','21-40':'21–40 Stunden/Woche','40+':'über 40 Stunden/Woche'},
    income:{'500':'bis 500 € monatlich','1000':'500–1.000 € monatlich','2000':'1.000–2.000 € monatlich','3000':'2.000–3.000 € monatlich','5000':'3.000–5.000 € monatlich','5000+':'über 5.000 € monatlich'},
    mode:{online:'online',local:'lokal',hybrid:'hybrid',open:'noch offen'},
    planUse:{self:'für die eigene Umsetzung',bank:'für Bank/Kreditgespräch',funding:'für Förderung/Gründungsfinanzierung',both:'für eigene Umsetzung und Finanzierung'},
    experience:{none:'keine praktische Erfahrung',little:'erste Erfahrung',some:'solide Erfahrung',much:'umfangreiche Erfahrung'}
  };
  const out={
    'Aktuelle Situation':maps.status[profile.status]||safe(profile.status),
    'Beruflicher Hintergrund':safe(profile.occupation),
    'Aktuelles Einkommen':maps.currentIncome[profile.currentIncome]||safe(profile.currentIncome),
    'Verfügbares Startbudget':maps.budget[profile.budget]||safe(profile.budget),
    'Verfügbare Zeit':maps.time[profile.time]||safe(profile.time),
    'Gewünschtes monatliches Geschäftseinkommen':maps.income[profile.income]||safe(profile.income),
    'Arbeitsmodell':maps.mode[profile.mode]||safe(profile.mode),
    'Verwendungszweck des Plans':maps.planUse[profile.planUse]||safe(profile.planUse),
    'Erfahrung':maps.experience[profile.experience]||safe(profile.experience),
    'Beschreibung des Vorhabens':safe(profile.vision)
  };
  return Object.fromEntries(Object.entries(out).filter(([,v])=>String(v||'').trim()));
}

function countWords(text=''){
  return String(text).replace(/[#*_>|`\-]+/g,' ').trim().split(/\s+/).filter(Boolean).length;
}

async function generateImage(prompt, quality='medium'){
  if(!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY fehlt.');
  const r=await fetch('https://api.openai.com/v1/images/generations',{
    method:'POST',
    headers:{'Authorization':`Bearer ${OPENAI_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:IMAGE_MODEL,prompt,size:'1536x1024',quality,n:1})
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data?.error?.message || `Bildgenerierung fehlgeschlagen (${r.status})`);
  const item=data?.data?.[0]||{};
  if(item.b64_json) return `data:image/png;base64,${item.b64_json}`;
  if(item.url) return item.url;
  throw new Error('Bildmodell hat kein Bild zurückgegeben.');
}

function markdownToEmail(md){
  const e=safe(md).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return e.split(/\n{2,}/).map(b=>{b=b.trim();if(/^###\s+/.test(b))return `<h3>${b.replace(/^###\s+/,'')}</h3>`;if(/^##\s+/.test(b))return `<h2>${b.replace(/^##\s+/,'')}</h2>`;if(/^#\s+/.test(b))return `<h1>${b.replace(/^#\s+/,'')}</h1>`;if(b.split('\n').every(x=>/^[-*]\s+/.test(x)))return `<ul>${b.split('\n').map(x=>`<li>${x.replace(/^[-*]\s+/,'')}</li>`).join('')}</ul>`;return `<p>${b.replace(/\n/g,'<br>')}</p>`}).join('');
}
async function sendEmail(to,subject,plan){
  if(!to || !RESEND_API_KEY || !FROM_EMAIL) return false;
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':`Bearer ${RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:FROM_EMAIL,to:[to],subject,html:`<div style="font-family:Arial,sans-serif;max-width:760px;margin:auto;color:#24202c"><p>Hier ist dein individuell erzeugter Businessplan aus der Demo.</p>${markdownToEmail(plan)}<hr><p style="color:#777;font-size:12px">Automatisch erzeugte Demo. Finanzielle Annahmen bitte vor Verwendung prüfen.</p></div>`})});
  return r.ok;
}
async function handleGenerate(req,res){
  const body=await readBody(req);
  const profile=body.profile||{};
  const paymentCheck=verifyPaymentToken(body.paymentToken);
  const demoBypass=ALLOW_DEMO_BYPASS && body.paymentToken==='DEMO_BYPASS';
  if(!demoBypass && !paymentCheck.ok) return json(res,402,{error:'Zahlung wurde nicht bestätigt. Bitte zuerst den Checkout abschließen.'});
  const {price,name,pageTarget,depth,imageCount,tableCount,financeMode,financeLabel,wordTarget,minWords,maxWords,days}=planPrompt(body.plan,profile.planUse);
  const customerName=safe(body.customer?.name).trim();
  const customerEmail=safe(body.customer?.email).trim();
  const goal=safe(body.goal).trim();
  const requiredProfile=['status','currentIncome','budget','time','income','vision','mode','planUse','experience'];
  const missing=requiredProfile.filter(k=>!String(profile[k]??'').trim());
  if(profile.status!=='arbeitssuchend' && !String(profile.occupation||'').trim()) missing.push('occupation');
  if(missing.length) return json(res,400,{error:'Bitte den Business Finder zuerst vollständig ausfüllen.'});
  if(customerName.split(/\s+/).filter(Boolean).length < 2) return json(res,400,{error:'Bitte Vor- und Nachname eingeben.'});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) return json(res,400,{error:'Bitte eine gültige E-Mail-Adresse eingeben.'});
  if(goal.length<8) return json(res,400,{error:'Bitte das Vorhaben vollständig aus dem Finder übernehmen.'});
  const actualPrice=[4.99,9.99,14.99].includes(price)?price:4.99;
  if(!demoBypass){
    const paidPrice=Number(paymentCheck.data?.price);
    const expectedHash=paymentDraftHash(body);
    if(Math.abs(paidPrice-actualPrice)>0.001) return json(res,402,{error:'Die bestätigte Zahlung gehört zu einem anderen Erstelli-Paket.'});
    if(!paymentCheck.data?.draftHash || paymentCheck.data.draftHash!==expectedHash) return json(res,402,{error:'Die Zahlungsbestätigung passt nicht zu dieser Bestellung. Bitte starte den Checkout erneut.'});
  }
  const schema={
    type:'object',additionalProperties:false,
    properties:{
      title:{type:'string'},subtitle:{type:'string'},executiveSummary:{type:'string'},markdown:{type:'string'},
      imagePrompts:{type:'array',items:{type:'string'},minItems:imageCount,maxItems:imageCount},
      successFactors:{type:'array',items:{type:'string'},minItems:4,maxItems:4},
      weeklyPlan:{type:'array',items:{type:'object',additionalProperties:false,properties:{week:{type:'string'},tasks:{type:'array',items:{type:'string'},minItems:3,maxItems:6}},required:['week','tasks']},minItems:4,maxItems:4},
      lenderSummary:{type:'string'},
      financeChecklist:{type:'array',items:{type:'string'},maxItems:10},
      planningAssumptions:{type:'array',items:{type:'string'},minItems:3,maxItems:10},
      financialTables:{type:'array',items:{type:'object',additionalProperties:false,properties:{title:{type:'string'},columns:{type:'array',items:{type:'string'},minItems:2,maxItems:5},rows:{type:'array',items:{type:'array',items:{type:'string'},minItems:2,maxItems:5},minItems:2,maxItems:14},note:{type:'string'}},required:['title','columns','rows','note']},minItems:tableCount,maxItems:tableCount},
      disclaimer:{type:'string'}
    },required:['title','subtitle','executiveSummary','markdown','imagePrompts','successFactors','weeklyPlan','lenderSummary','financeChecklist','planningAssumptions','financialTables','disclaimer']
  };
  const instructions=`Du erstellst einen deutschsprachigen, hochwertig gestaltbaren Businessplan für eine Gründer-Demo. Nutze ausschließlich gelieferte Nutzerdaten. Erfinde keine persönlichen Fakten. Fehlende Zahlen klar als Annahmen kennzeichnen und Validierungsschritte nennen.

Paket: ${name} (${actualPrice} €). VERBINDLICHES Seitenfenster: ${pageTarget}. Verwendungszweck: ${financeLabel}. Inhaltliche Tiefe: ${depth}. Verbindlicher Textzielumfang: ${wordTarget}. Umsetzungsrahmen: ${days}. Das Paket darf wegen Bank-/Förderzweck NICHT in die nächsthöhere Plantiefe wachsen. Die gewählte Preisstufe bestimmt strikt Umfang und Detailtiefe.
Der Businessplan wird persönlich für ${customerName} erstellt. Verwende den Namen sparsam und professionell; keine erfundenen persönlichen Angaben.

QUALITÄTSSTANDARD FÜR JEDES PAKET:
- Der Inhalt soll professionell, klar, motivierend und praktisch nutzbar wirken, nicht wie ein Rohentwurf.
- Erstelle eine starke Executive Summary, ein nachvollziehbares Geschäftsmodell, Zielkunden, Angebot/Leistungen, Positionierung, Startbudget/Mittelverwendung, Preislogik, Umsatz-/Kostenannahmen, Kundengewinnung, Vertrieb, operative Umsetzung, Risiken und konkrete nächste Schritte.
- Schreibe KEINEN Fragebogen und KEINE bloße Liste dessen, was der Kunde noch recherchieren soll. Der Plan muss bereits eine belastbare Arbeitsgrundlage sein. Fehlende externe Fakten werden als klar bezeichnete Planungsannahme oder Validierungsbedarf behandelt, aber der Abschnitt muss trotzdem konkret ausgearbeitet sein.
- Verwende NIEMALS interne Formularwerte oder Feldnamen wie "income: 5000+", "budget: 2001-5000", "planUse", "currentIncome" oder ähnliche Rohdaten. Alle Angaben müssen natürlich auf Deutsch formuliert werden.
- Vermeide Formulierungen wie "nach bisheriger Angabe umfasst der Verwendungszweck...". Schreibe wie ein professioneller Businessplan, nicht wie eine Formularzusammenfassung.
- Erzeuge genau ${tableCount} strukturierte Kalkulationstabellen im Feld financialTables. Sie müssen zum Paket passen und echte Rechen-/Planungslogik liefern. Start: mindestens Startkosten/Mittelverwendung. Plus zusätzlich Preis-/Deckungsbeitragslogik und monatliches Umsatz-/Kostenmodell. Pro zusätzlich 12-Monats-Liquiditäts-/Rentabilitätslogik, Break-even bzw. Tragfähigkeit und mindestens ein Szenariovergleich. Wenn konkrete Zahlen fehlen, nutze ausdrücklich als "Planungsannahme" bezeichnete plausible Beispielwerte oder Bandbreiten und sage in der Tabellen-Notiz, welche Werte der Kunde vor externer Verwendung ersetzen/prüfen muss.
- planningAssumptions enthält die wichtigsten numerischen oder sachlichen Annahmen in verständlicher Sprache. Keine Rohfelder.
- Wenn Verwendungszweck Bank, Förderung oder Finanzierung ist, behandle den Plan als ernsthaftes Finanzierungsdossier und arbeite deutlich tiefer: Gründerprofil, Vorhaben, Marktbegründung, Wettbewerb, Angebot, Vertriebsweg, Kapitalbedarf, vorhandene Eigenmittel, exakter Finanzierungsbedarf, Mittelverwendung, Umsatz-/Kostenmodell, Rentabilität, mindestens 12-Monats-Liquiditätslogik, Break-even, Schuldendienst/Tragfähigkeit soweit aus den Angaben ableitbar, Chancen/Risiken, Meilensteine und benötigte Nachweise. Zahlen niemals erfinden: fehlende Werte als Annahme markieren und eine konkrete Beschaffungs-/Validierungsaufgabe nennen. Keine Zusage einer Bank/Förderstelle suggerieren.
- Das Feld lenderSummary enthält NUR bei Finanzierungsmodus eine kompakte, professionell formulierte Finanzierungszusammenfassung (Zweck, Kapitalbedarf, Eigenmittel, Bedarf, Rückzahlungs-/Tragfähigkeitslogik soweit ableitbar, zentrale offene Nachweise). Bei rein interner Nutzung einen leeren String zurückgeben.
- Das Feld financeChecklist enthält NUR bei Finanzierungsmodus eine konkrete Unterlagen-/Nachweis-Checkliste (z. B. Angebote, Lebenslauf/Qualifikationen, Eigenmittelnachweis, Miet-/Standortunterlagen, Genehmigungen, Kalkulationsbelege – nur was zum Vorhaben passt). Bei rein interner Nutzung ein leeres Array zurückgeben.
- Am Ende immer vier kurze "Erfolgsfaktoren" liefern.
- Am Ende immer einen 4-Wochen-Motivations-/Umsetzungsplan mit ankreuzbaren Aufgaben liefern.
- Formuliere ${imageCount} eigenständige Bildprompts für fotorealistische, hochwertige Business-Fotografie passend genau zu diesem Vorhaben. Keine Logos, keine erfundenen Marken, kein Text im Bild, keine prominenten Personen. Die Bilder sollen wie echte Editorial-/Unternehmensfotografie für ein Premium-PDF wirken.
- Das Feld markdown enthält den Hauptplan als sauberes Markdown mit aussagekräftigen H2/H3-Überschriften. Erfolgsfaktoren und Wochenplan NICHT im Markdown doppeln.
- KEINE Markdown-Tabellen mit |, --- oder ähnlicher Rohsyntax im Feld markdown erzeugen. Kalkulationen gehören in financialTables und werden später als echte Tabellen gesetzt.
- Keine Trennlinien aus Bindestrichen, keine ASCII-Tabellen und keine technischen Rohformatierungen.
- Schreibe kompakt: kurze Absätze, klare Zwischenüberschriften, möglichst wenig Wiederholungen und keine unnötigen Füllsätze.
- Keine Meta-Erklärung über KI oder interne Anweisungen.`;
  const input={selectedPackage:`${name} – ${actualPrice} €`,promisedPages:pageTarget,goal,customer:{name:customerName},profile:humanProfile(profile),conversationContext:(body.conversation||[]).slice(-12)};
  const effort=actualPrice===14.99?'high':actualPrice===9.99?'medium':'low';
  const maxTokens=actualPrice===14.99?24000:actualPrice===9.99?14000:7000;
  const generationPayload={model:PLAN_MODEL,instructions,input:JSON.stringify(input),reasoning:{effort},text:{verbosity:'high',format:{type:'json_schema',name:'business_blueprint',strict:true,schema}},store:false,max_output_tokens:maxTokens};
  let doc=null, parseError=null;
  for(let attempt=0;attempt<2 && !doc;attempt++){
    const data=await openai(generationPayload,2);
    try{doc=JSON.parse(extractText(data));}
    catch(e){parseError=e; if(attempt===0) await sleep(700);}
  }
  if(!doc) throw new Error('Der Businessplan war technisch unvollständig. Bitte erneut starten – es wurde nichts berechnet.');

  // Qualitätskontrolle: Ein bezahltes Paket darf nicht mit deutlich zu wenig Inhalt ausgeliefert werden.
  // Falls das Modell den Zielumfang unterschreitet, wird der Haupttext automatisch vertieft und vollständig neu gesetzt.
  let mainWords=countWords(doc.markdown||'');
  for(let expandAttempt=0; mainWords<minWords && expandAttempt<2; expandAttempt++){
    const expandSchema={type:'object',additionalProperties:false,properties:{markdown:{type:'string'}},required:['markdown']};
    const expandInstructions=`Überarbeite den folgenden Businessplan-Haupttext vollständig. Paket: ${name} (${actualPrice} €), versprochener Umfang ${pageTarget}. Der Haupttext hat aktuell nur ${mainWords} Wörter und muss mindestens ${minWords} Wörter erreichen. Vertiefe Substanz statt Fülltext: Marktlogik, Zielkunden, Angebot, Preisbegründung, Vertrieb, operative Abläufe, Kosten-/Umsatzlogik, Risiken, Validierung, Meilensteine und konkrete Umsetzung. Wiederhole nichts unnötig. Keine internen Formularfeldnamen oder Rohwerte wie income:, budget:, planUse:. Keine ASCII- oder Markdown-Tabellen. Keine KI-Metaerklärungen. Fehlende Zahlen als klar benannte Planungsannahmen behandeln. Gib den vollständigen neu geschriebenen Haupttext zurück, nicht nur Ergänzungen.`;
    const expandInput={profile:humanProfile(profile),goal,currentMarkdown:doc.markdown,planningAssumptions:doc.planningAssumptions,financialTables:doc.financialTables};
    const expanded=await openai({model:PLAN_MODEL,instructions:expandInstructions,input:JSON.stringify(expandInput),reasoning:{effort:actualPrice===14.99?'high':'medium'},text:{verbosity:'high',format:{type:'json_schema',name:'expanded_business_plan',strict:true,schema:expandSchema}},store:false,max_output_tokens:maxTokens},2);
    try{const x=JSON.parse(extractText(expanded)); if(x.markdown)doc.markdown=x.markdown;}catch{}
    mainWords=countWords(doc.markdown||'');
  }
  if(mainWords>maxWords){
    const compactSchema={type:'object',additionalProperties:false,properties:{markdown:{type:'string'}},required:['markdown']};
    const compactInstructions=`Verdichte den folgenden Businessplan-Haupttext vollständig auf höchstens ${maxWords} Wörter und mindestens ${minWords} Wörter. Paket: ${name} (${actualPrice} €), verbindliches Seitenfenster ${pageTarget}. Entferne Wiederholungen, Nebenwege und Fülltext, ohne Zahlen, Kernargumente, Risiken, Marktlogik, Umsetzung oder wichtige Annahmen zu verlieren. Keine neuen Inhalte erfinden. Keine Tabellen im Markdown. Gib den vollständigen verdichteten Haupttext zurück.`;
    const compacted=await openai({model:PLAN_MODEL,instructions:compactInstructions,input:JSON.stringify({profile:humanProfile(profile),goal,currentMarkdown:doc.markdown}),reasoning:{effort:'medium'},text:{verbosity:'medium',format:{type:'json_schema',name:'compacted_business_plan',strict:true,schema:compactSchema}},store:false,max_output_tokens:maxTokens},2);
    try{const x=JSON.parse(extractText(compacted));if(x.markdown)doc.markdown=x.markdown;}catch{}
    mainWords=countWords(doc.markdown||'');
  }
  if(mainWords<minWords || mainWords>maxWords){
    throw new Error(`${name}-Plan liegt mit ${mainWords} Wörtern außerhalb des verbindlichen Umfangs ${pageTarget}. Bitte erneut erstellen – ein Plan außerhalb der gebuchten Stufe wird nicht ausgeliefert.`);
  }

  // Zweite, unabhängige Qualitätsprüfung. Sie darf den bereits korrekt erzeugten Plan nicht
  // wegen eines kurzzeitigen API-/Rate-Limit-Fehlers vernichten. Daher: eigenes Review-Modell,
  // danach ein zweites Modell als Fallback; erst wenn eine gültige Revision vorliegt, wird ersetzt.
  const reviewSchema={type:'object',additionalProperties:false,properties:{approved:{type:'boolean'},issues:{type:'array',items:{type:'string'},maxItems:12},revisionInstructions:{type:'string'}},required:['approved','issues','revisionInstructions']};
  const reviewInstructions=`Du bist die unabhängige Qualitätskontrolle für einen deutschsprachigen Businessplan. Prüfe streng, aber fair. Vergleiche den Plan mit den gelieferten Nutzerdaten und dem gebuchten Paket ${name} (${actualPrice} €, ${pageTarget}). Prüfe insbesondere: Widersprüche zu Nutzerdaten, erfundene persönliche Fakten, unmarkierte Annahmen, mathematische/logische Fehler in Finanzangaben, doppelte oder unnötige Inhalte, rohe Formularfelder, fehlende Kernbereiche, zu oberflächliche Passagen, ungeeignete Aussagen für Bank/Förderung, sowie ob der Umfang und die Tiefe zum Paket passen. Externe Marktwerte dürfen nicht als verifiziert dargestellt werden, wenn keine Quelle vorliegt. Gib approved=true nur zurück, wenn keine relevante Änderung nötig ist. revisionInstructions soll bei Bedarf präzise beschreiben, was geändert werden muss.`;
  let qualityReview={approved:true,issues:[],revisionInstructions:''};
  let qualityReviewed=false;
  let reviewModelUsed='';
  const reviewModels=[...new Set([REVIEW_MODEL,ERSTELLI_MODEL,PLAN_MODEL].filter(Boolean))];
  for(const model of reviewModels){
    try{
      const reviewData=await openai({model,instructions:reviewInstructions,input:JSON.stringify({customerName,goal,profile:humanProfile(profile),package:{name,price:actualPrice,pageTarget,financeLabel},document:doc}),reasoning:{effort:actualPrice===14.99?'medium':'low'},text:{verbosity:'low',format:{type:'json_schema',name:'business_plan_review',strict:true,schema:reviewSchema}},store:false,max_output_tokens:1800},2);
      qualityReview=JSON.parse(extractText(reviewData));
      qualityReviewed=true; reviewModelUsed=model; break;
    }catch(e){ console.error(`Qualitätsprüfung mit ${model} fehlgeschlagen:`,e.message); }
  }

  if(qualityReviewed && !qualityReview.approved){
    const reviseInstructions=`Du bist die zweite Qualitäts-KI und überarbeitest den bereits erstellten Businessplan vollständig anhand der Prüfpunkte. Bewahre alle korrekten Nutzerdaten und die Paketstruktur. Paket: ${name} (${actualPrice} €), Zielumfang ${pageTarget}, zwischen ${minWords} und ${maxWords} Wörtern Haupttext. Korrigiere Widersprüche, Rechen-/Logikfehler, Wiederholungen, unprofessionelle Formulierungen und rohe Formularwerte. Erfinde keine persönlichen Fakten und stelle nicht verifizierte externe Werte nur als Planungsannahmen dar. Behalte exakt ${tableCount} Kalkulationstabellen, ${imageCount} Bildprompts, vier Erfolgsfaktoren und vier Wochen im Umsetzungsplan. Gib das vollständige korrigierte Dokument im vorgegebenen Schema zurück.`;
    let revised=null;
    const revisionModels=[...new Set([reviewModelUsed,PLAN_MODEL].filter(Boolean))];
    for(const model of revisionModels){
      try{
        const revisedData=await openai({model,instructions:reviseInstructions,input:JSON.stringify({customerName,goal,profile:humanProfile(profile),review:qualityReview,document:doc}),reasoning:{effort:actualPrice===14.99?'high':'medium'},text:{verbosity:'high',format:{type:'json_schema',name:'reviewed_business_blueprint',strict:true,schema}},store:false,max_output_tokens:maxTokens},2);
        const candidate=JSON.parse(extractText(revisedData));
        if(candidate && candidate.markdown && countWords(candidate.markdown)>=minWords && countWords(candidate.markdown)<=maxWords){ revised=candidate; break; }
      }catch(e){ console.error(`Überarbeitung mit ${model} fehlgeschlagen:`,e.message); }
    }
    if(revised) doc=revised;
    // Wenn die Revision technisch scheitert, bleibt der zuvor erzeugte und umfanggeprüfte Plan erhalten.
    // So sieht der Kunde keinen Abbruch wegen eines zweiten, optionalen Review-Calls.
    mainWords=countWords(doc.markdown||'');
  }

  // Sicherheits-/Qualitätsfilter gegen sichtbare Formular-Rohdaten.
  doc.markdown=String(doc.markdown||'')
    .replace(/\b(currentIncome|income|budget|planUse|mode|status|experience)\s*:\s*/gi,'')
    .replace(/\b5000\+\b/g,'über 5.000 €');

  // Bilder parallel erzeugen. Fällt ein einzelnes Bild aus, bleibt der Businessplan trotzdem nutzbar.
  const quality=actualPrice===14.99?'high':'medium';
  const imageResults=await Promise.all((doc.imagePrompts||[]).slice(0,imageCount).map(async prompt=>{
    try{return {prompt,url:await generateImage(prompt,quality)}}catch(e){console.error('Bildfehler:',e.message);return {prompt,url:null,error:e.message}}
  }));
  const images=imageResults.filter(x=>x.url);
  const email=customerEmail;
  const emailPlan=`# ${doc.title}\n\n${doc.subtitle}\n\n${doc.executiveSummary}\n\n${doc.markdown}\n\n## Vier Erfolgsfaktoren\n${doc.successFactors.map(x=>'- '+x).join('\n')}\n\n## 4-Wochen-Plan\n${doc.weeklyPlan.map(w=>`### ${w.week}\n${w.tasks.map(t=>'- [ ] '+t).join('\n')}`).join('\n\n')}\n\n${doc.disclaimer}`;
  const emailed=await sendEmail(email,`Dein ${String(actualPrice).replace('.',',')} € Businessplan – Demo`,emailPlan).catch(()=>false);
  json(res,200,{document:doc,plan:doc.markdown,images,emailed,package:actualPrice,packageName:name,pageTarget,mainWords,model:PLAN_MODEL,reviewModel:reviewModelUsed||REVIEW_MODEL,qualityReviewed,qualityIssues:qualityReviewed?(qualityReview.issues||[]):[],imageModel:IMAGE_MODEL,customerName});
}


function stableObject(value){
  if(Array.isArray(value)) return value.map(stableObject);
  if(value && typeof value==='object') return Object.keys(value).sort().reduce((o,k)=>{o[k]=stableObject(value[k]);return o;},{});
  return value;
}
function paymentDraftHash(body={}){
  const payload={
    plan:String(body.plan||''),
    customer:{name:String(body.customer?.name||'').trim(),email:String(body.customer?.email||'').trim().toLowerCase()},
    goal:String(body.goal||'').trim(),
    profile:body.profile||{}
  };
  return crypto.createHash('sha256').update(JSON.stringify(stableObject(payload))).digest('hex');
}
function stripePackage(plan=''){
  const price=priceFromPlan(plan);
  if(price===14.99)return {key:'pro',name:'Pro',price,priceId:STRIPE_PRICE_PRO};
  if(price===9.99)return {key:'plus',name:'Plus',price,priceId:STRIPE_PRICE_PLUS};
  return {key:'start',name:'Start',price:4.99,priceId:STRIPE_PRICE_START};
}
function publicBaseUrlFor(req){
  if(PUBLIC_BASE_URL && !/^http:\/\/localhost(?::\d+)?$/i.test(PUBLIC_BASE_URL)) return PUBLIC_BASE_URL.replace(/\/$/,'');
  const proto=String(req.headers['x-forwarded-proto']||'').split(',')[0].trim() || (IS_RAILWAY?'https':'http');
  const host=String(req.headers['x-forwarded-host']||req.headers.host||`localhost:${PORT}`).split(',')[0].trim();
  return `${proto}://${host}`.replace(/\/$/,'');
}

function signPayment(payload){
  const raw=Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig=crypto.createHmac('sha256',PAYMENT_SIGNING_SECRET).update(raw).digest('base64url');
  return `${raw}.${sig}`;
}
function verifyPaymentToken(token=''){
  try{
    const [raw,sig]=String(token).split('.'); if(!raw||!sig)return {ok:false};
    const expected=crypto.createHmac('sha256',PAYMENT_SIGNING_SECRET).update(raw).digest('base64url');
    if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return {ok:false};
    const data=JSON.parse(Buffer.from(raw,'base64url').toString('utf8'));
    if(!data.paid || Date.now()-data.ts>7*24*60*60*1000)return {ok:false};
    return {ok:true,data};
  }catch{return {ok:false}}
}
function priceFromPlan(plan=''){ return parsePlanPrice(plan); }
function baseUrl(){return PUBLIC_BASE_URL.replace(/\/$/,'');}
async function stripeCreate(req,body){
  if(!STRIPE_SECRET_KEY) throw new Error('Stripe ist noch nicht konfiguriert.');
  const pkg=stripePackage(body.plan);
  if(!pkg.priceId) throw new Error(`Stripe-Preis für ${pkg.name} fehlt in der Server-Konfiguration.`);
  const draftHash=paymentDraftHash(body);
  const base=publicBaseUrlFor(req);
  const params=new URLSearchParams();
  params.set('mode','payment');
  params.set('success_url',`${base}/?payment_provider=stripe&session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url',`${base}/?payment_cancelled=1`);
  params.set('customer_email',String(body.customer?.email||''));
  params.set('line_items[0][quantity]','1');
  params.set('line_items[0][price]',pkg.priceId);
  params.set('metadata[source]','erstelli');
  params.set('metadata[package_key]',pkg.key);
  params.set('metadata[package_price]',pkg.price.toFixed(2));
  params.set('metadata[draft_hash]',draftHash);
  params.set('payment_intent_data[metadata][source]','erstelli');
  params.set('payment_intent_data[metadata][package_key]',pkg.key);
  const r=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${STRIPE_SECRET_KEY}`,'Content-Type':'application/x-www-form-urlencoded'},body:params});
  const data=await r.json();
  if(!r.ok)throw new Error(data?.error?.message||'Stripe-Checkout konnte nicht erstellt werden.');
  return data;
}
async function stripeVerify(sessionId){
  if(!STRIPE_SECRET_KEY)throw new Error('Stripe ist nicht konfiguriert.');
  if(!/^cs_(?:live|test)_/.test(String(sessionId||'')))throw new Error('Ungültige Stripe-Checkout-ID.');
  const r=await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,{headers:{Authorization:`Bearer ${STRIPE_SECRET_KEY}`}});
  const d=await r.json();
  if(!r.ok)throw new Error(d?.error?.message||'Stripe-Zahlung konnte nicht geprüft werden.');
  const source=d?.metadata?.source;
  const packageKey=d?.metadata?.package_key;
  const packagePrice=Number(d?.metadata?.package_price);
  const draftHash=String(d?.metadata?.draft_hash||'');
  const expected=packageKey==='pro'?14.99:packageKey==='plus'?9.99:packageKey==='start'?4.99:0;
  const amountMatches=expected>0 && Number(d.amount_total)===Math.round(expected*100) && d.currency==='eur';
  const paid=d.payment_status==='paid' && d.status==='complete' && d.mode==='payment' && source==='erstelli' && amountMatches && Math.abs(packagePrice-expected)<0.001 && /^[a-f0-9]{64}$/.test(draftHash);
  return {paid,id:d.id,packageKey,price:expected,draftHash};
}
async function paypalToken(){
  if(!PAYPAL_CLIENT_ID||!PAYPAL_CLIENT_SECRET)throw new Error('PayPal ist noch nicht konfiguriert. PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET fehlen in .env.');
  const host=PAYPAL_ENV==='live'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';
  const auth=Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const r=await fetch(`${host}/v1/oauth2/token`,{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials'}); const d=await r.json(); if(!r.ok)throw new Error('PayPal-Authentifizierung fehlgeschlagen.'); return {token:d.access_token,host};
}
async function paypalCreate(body){
  const {token,host}=await paypalToken(), price=priceFromPlan(body.plan);
  const r=await fetch(`${host}/v2/checkout/orders`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({intent:'CAPTURE',purchase_units:[{amount:{currency_code:'EUR',value:price.toFixed(2)},description:'Erstelli Businessplan'}],payment_source:{paypal:{experience_context:{return_url:`${baseUrl()}/?payment_provider=paypal`,cancel_url:`${baseUrl()}/?payment_cancelled=1`,user_action:'PAY_NOW'}}}})}); const d=await r.json(); if(!r.ok)throw new Error(d?.message||'PayPal-Checkout konnte nicht erstellt werden.'); return d;
}
async function paypalCapture(orderId){
  const {token,host}=await paypalToken();
  const r=await fetch(`${host}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:'{}'}); const d=await r.json();
  if(!r.ok && d.name!=='ORDER_ALREADY_CAPTURED')throw new Error(d?.message||'PayPal-Zahlung konnte nicht bestätigt werden.');
  if(d.name==='ORDER_ALREADY_CAPTURED')return {paid:true,id:orderId}; return {paid:d.status==='COMPLETED',id:d.id};
}
async function handleCreatePayment(req,res){
  const body=await readBody(req); const email=String(body.customer?.email||'').trim(); const customerName=String(body.customer?.name||'').trim();
  if(customerName.split(/\s+/).filter(Boolean).length<2)return json(res,400,{error:'Bitte Vor- und Nachname eingeben.'});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json(res,400,{error:'Bitte eine gültige E-Mail-Adresse eingeben.'});
  if(!body.profile?.vision)return json(res,400,{error:'Bitte zuerst den Business Finder vollständig ausfüllen.'});
  if(body.provider==='paypal'){const d=await paypalCreate(body);const approve=(d.links||[]).find(x=>x.rel==='payer-action'||x.rel==='approve');return json(res,200,{url:approve?.href});}
  const d=await stripeCreate(req,body); return json(res,200,{url:d.url});
}
async function handleVerifyPayment(req,res){
  const b=await readBody(req); let result;
  if(b.provider==='paypal')result=await paypalCapture(b.orderId); else result=await stripeVerify(b.sessionId);
  if(!result.paid)return json(res,402,{paid:false,error:'Zahlung ist noch nicht abgeschlossen.'});
  const paymentToken=signPayment({paid:true,provider:b.provider,id:result.id,price:result.price||null,packageKey:result.packageKey||null,draftHash:result.draftHash||null,ts:Date.now()}); return json(res,200,{paid:true,paymentToken});
}

const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.pdf':'application/pdf','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
function serve(req,res){
  const u=new URL(req.url,`http://${req.headers.host||'localhost'}`);let rel=decodeURIComponent(u.pathname);if(rel==='/')rel='/index.html';
  const file=path.normalize(path.join(ROOT,rel)); if(!file.startsWith(ROOT)){res.writeHead(403);return res.end('Forbidden')}
  fs.stat(file,(err,st)=>{if(err||!st.isFile()){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res)});
}
const server=http.createServer(async(req,res)=>{
  try{
    if(req.method==='POST'&&req.url==='/api/recommend'){const b=await readBody(req);const rec=recommendPlan(b.profile||{},b.context||'');return json(res,200,rec);}
    if(req.method==='POST'&&req.url==='/api/blupi')return await handleErstelli(req,res);
    if(req.method==='POST'&&req.url==='/api/polish-summary')return await handlePolishSummary(req,res);
    if(req.method==='POST'&&req.url==='/api/create-payment')return await handleCreatePayment(req,res);
    if(req.method==='POST'&&req.url==='/api/verify-payment')return await handleVerifyPayment(req,res);
    if(req.method==='POST'&&req.url==='/api/generate-plan')return await handleGenerate(req,res);
    if(req.method==='GET'&&req.url==='/api/status')return json(res,200,{openai:Boolean(OPENAI_API_KEY),email:Boolean(RESEND_API_KEY&&FROM_EMAIL),stripe:Boolean(STRIPE_SECRET_KEY&&STRIPE_PRICE_START&&STRIPE_PRICE_PLUS&&STRIPE_PRICE_PRO),stripePrices:Boolean(STRIPE_PRICE_START&&STRIPE_PRICE_PLUS&&STRIPE_PRICE_PRO),paypal:Boolean(PAYPAL_CLIENT_ID&&PAYPAL_CLIENT_SECRET),erstelliModel:ERSTELLI_MODEL,planModel:PLAN_MODEL,reviewModel:REVIEW_MODEL,imageModel:IMAGE_MODEL});
    return serve(req,res);
  }catch(e){console.error(e);return json(res,500,{error:e.message||'Serverfehler'});}
});
server.listen(PORT,()=>console.log(`Erstelli V48 läuft auf Port ${PORT}`));
