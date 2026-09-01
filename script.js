
// reveal
const revealItems=[...document.querySelectorAll('.reveal')];
if('IntersectionObserver' in window){
  const revealObs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.1});
  revealItems.forEach(el=>revealObs.observe(el));
  // Safety fallback: foreground content must never remain invisible.
  setTimeout(()=>revealItems.forEach(el=>el.classList.add('visible')),900);
}else{
  revealItems.forEach(el=>el.classList.add('visible'));
}

// code background — V7 balanced neon code, slower + clearer
const c=document.getElementById('codeRain'),ctx=c.getContext('2d',{alpha:true});
let W=0,H=0,tracks=[],rafId=0,lastFrame=0,paused=false,frameCounter=0;
const lowPower=(navigator.hardwareConcurrency||8)<=4;
const targetFPS=lowPower?20:28;
const frameMS=1000/targetFPS;
const codeStrings=[
  "const site = build();  await launch();  responsive:true;  convert();  deploy();  ",
  "<section class=\"hero\">  design · code · mobile · seo · api  </section>  ",
  "AI.chat();  payment.connect();  booking.init();  lead.capture();  ",
  "npm run build  ✓ optimized  ✓ responsive  ✓ accessible  ✓ ready  ",
  "grid-template-columns:1fr 1fr;  async function assistant(){ return AI.respond(); }  ",
  "const website={design:'premium',speed:'fast',mobile:true};  domain.connect();  ",
  "hover:translateY(-4px);  glow:true;  UX.first();  details.matter();  "
];
const isMobileCodeBg=window.matchMedia('(max-width:700px), (pointer:coarse)').matches;
let mobileCanvasWidth=0;

function setupCode(force=false){
  const nextW=window.innerWidth;
  const nextH=isMobileCodeBg
    ? Math.max(window.screen?.height||0, window.innerHeight)
    : window.innerHeight;

  // Mobile Safari changes only the viewport height while the address bar
  // collapses/expands. Ignore those height-only changes completely.
  if(isMobileCodeBg && !force && tracks.length && Math.abs(nextW-mobileCanvasWidth)<20){
    return;
  }

  W=nextW;
  H=nextH;
  mobileCanvasWidth=nextW;
  c.width=Math.max(1,Math.floor(W));
  c.height=Math.max(1,Math.floor(H));
  c.style.width=W+'px';
  c.style.height=H+'px';
  ctx.setTransform(1,0,0,1,0,0);
  const count=lowPower?5:6;
  tracks=Array.from({length:count},(_,i)=>({
    text:codeStrings[i%codeStrings.length].repeat(4),
    y:(i+.7)*(H/count),
    x:Math.random()*-700,
    dir:i%2===0?-1:1,
    speed:(lowPower?.14:.18)+Math.random()*(lowPower?.06:.09),
    phase:i*0.9
  }));
}

setupCode(true);

if(!isMobileCodeBg){
  addEventListener('resize',()=>{
    clearTimeout(window.__codeResize);
    window.__codeResize=setTimeout(()=>setupCode(true),180);
  },{passive:true});
}else{
  addEventListener('orientationchange',()=>{
    clearTimeout(window.__codeOrientation);
    window.__codeOrientation=setTimeout(()=>setupCode(true),350);
  },{passive:true});
}
document.addEventListener('visibilitychange',()=>{paused=document.hidden;if(!paused){lastFrame=0;rafId=requestAnimationFrame(drawCode)}});
function makeCodeGradient(t,phase){
  const drift=(Math.sin(t*.00018+phase)+1)/2;
  const g=ctx.createLinearGradient(0,0,W,0);
  g.addColorStop(0,`rgba(${18+Math.round(drift*20)},156,255,.52)`);
  g.addColorStop(.32,'rgba(61,220,255,.58)');
  g.addColorStop(.62,'rgba(126,132,255,.52)');
  g.addColorStop(.84,'rgba(86,210,255,.56)');
  g.addColorStop(1,'rgba(28,133,255,.48)');
  return g;
}
function drawCode(t){
  if(paused)return;
  rafId=requestAnimationFrame(drawCode);
  if(t-lastFrame<frameMS)return;
  const dt=Math.min(2.2,(t-lastFrame)/frameMS || 1);
  lastFrame=t;
  frameCounter++;
  ctx.clearRect(0,0,W,H);
  ctx.font=(lowPower?'11.5px':'12.5px')+' ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  ctx.textBaseline='middle';
  tracks.forEach((tr,i)=>{
    ctx.fillStyle=makeCodeGradient(t,tr.phase);
    ctx.shadowColor=i%2===0?'rgba(62,207,255,.34)':'rgba(118,114,255,.27)';
    ctx.shadowBlur=lowPower?4:6;
    const width=ctx.measureText(tr.text).width;
    tr.x+=tr.dir*tr.speed*dt;
    if(tr.dir<0 && tr.x<-width/2)tr.x=0;
    if(tr.dir>0 && tr.x>0)tr.x=-width/2;
    ctx.fillText(tr.text,tr.x,tr.y);
    ctx.fillText(tr.text,tr.x+width/2,tr.y);
  });
  ctx.shadowBlur=0;
}
requestAnimationFrame(drawCode);

// configurator
let base={name:'Onepager',price:299,pages:1};let revisions=0;const selected=new Map();const totalEl=document.getElementById('totalPrice'),summary=document.getElementById('summary'),configText=document.getElementById('configText');
function euro(v){return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v)}
function updatePrice(){let total=base.price+revisions*39;selected.forEach(v=>total+=v.price);totalEl.textContent=euro(total);const rows=[{name:base.name+' · bis '+base.pages+(base.pages===1?' Seite':' Seiten'),price:base.price},...Array.from(selected.values())];if(revisions>0)rows.push({name:revisions+' zusätzliche Korrekturrunde'+(revisions>1?'n':''),price:revisions*39});summary.innerHTML=rows.map(r=>`<div class="summary-row"><span>${r.name}</span><b>${r.price===0?'inkl.':euro(r.price)}</b></div>`).join('');configText.value='Gewählte Konfiguration:\n'+rows.map(r=>'• '+r.name+' — '+euro(r.price)).join('\n')+'\n\nGesamt: '+euro(total)}
document.querySelectorAll('[data-type="base"]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-type="base"]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');base={name:btn.dataset.name,price:+btn.dataset.price,pages:+btn.dataset.pages};updatePrice()}));
document.querySelectorAll('.choice.toggle').forEach(btn=>btn.addEventListener('click',()=>{const name=btn.dataset.name;if(selected.has(name)){selected.delete(name);btn.classList.remove('active')}else{selected.set(name,{name,price:+btn.dataset.price});btn.classList.add('active')}updatePrice()}));
document.getElementById('revMinus').onclick=()=>{revisions=Math.max(0,revisions-1);document.getElementById('revCount').textContent=revisions;updatePrice()};document.getElementById('revPlus').onclick=()=>{revisions=Math.min(10,revisions+1);document.getElementById('revCount').textContent=revisions;updatePrice()};document.getElementById('useConfig').addEventListener('click',()=>setTimeout(()=>document.getElementById('name').focus(),450));updatePrice();

// V4 — real hero CTA + premium deselect sparkle dust
const miniAsk=document.getElementById('miniAsk');
if(miniAsk){
  miniAsk.addEventListener('click',()=>{
    const target=document.getElementById('kontakt');
    if(target) target.scrollIntoView({behavior:'smooth',block:'start'});
  });
}

function sparkleDust(el, amount=10){
  if(!el) return;
  const r=el.getBoundingClientRect();
  const cx=r.left+r.width*.5;
  const cy=r.top+r.height*.5;
  for(let i=0;i<amount;i++){
    const p=document.createElement('i');
    p.className='sparkle-particle'+(i%4===0?' star':'');
    const angle=(Math.PI*2*i/amount)+(Math.random()-.5)*.55;
    const distance=30+Math.random()*75;
    p.style.left=(cx+(Math.random()-.5)*r.width*.55)+'px';
    p.style.top=(cy+(Math.random()-.5)*r.height*.35)+'px';
    p.style.setProperty('--dx',(Math.cos(angle)*distance)+'px');
    p.style.setProperty('--dy',(Math.sin(angle)*distance-15)+'px');
    p.style.setProperty('--rot',(Math.random()*220-110)+'deg');
    p.style.animationDelay=(Math.random()*80)+'ms';
    document.body.appendChild(p);
    setTimeout(()=>p.remove(),1000);
  }
}

// Add sparkle specifically when an addon is turned OFF.
document.querySelectorAll('.choice.toggle').forEach(btn=>{
  btn.addEventListener('click',()=>{
    // original click handler runs before this one because it was registered earlier.
    if(!btn.classList.contains('active')) sparkleDust(btn,10);
  });
});

// When changing the base package, sparkle from the package that is being left.
document.querySelectorAll('[data-type="base"]').forEach(btn=>{
  btn.addEventListener('pointerdown',()=>{
    const old=document.querySelector('[data-type="base"].active');
    if(old && old!==btn) sparkleDust(old,8);
  });
});


// V6 — Codey reactions without image assets
const codey=document.getElementById('codey');
document.querySelectorAll('.choice').forEach(el=>{
  el.addEventListener('click',()=>{
    if(!codey)return;
    codey.classList.remove('codey-react');
    void codey.offsetWidth;
    codey.classList.add('codey-react');
    setTimeout(()=>codey.classList.remove('codey-react'),420);
  });
});



// Formularzustand bleibt erhalten, weil Rechtstexte in einem neuen Tab geöffnet werden.
// Es wird dafür bewusst kein LocalStorage eingesetzt.

// V18 — business workflow: WhatsApp, uploads, project IDs, real backend calls, public reviews.
(function(){
  const cfg=window.ERSTELLI_CONFIG||{};

  // WhatsApp button is statically visible in V20 so it also works on GitHub Pages.

  // File list preview
  const filesInput=document.getElementById('projectFiles');
  const fileList=document.getElementById('fileList');
  if(filesInput&&fileList){
    filesInput.addEventListener('change',()=>{
      const files=[...filesInput.files];
      fileList.textContent=files.length
        ? files.map(f=>`${f.name} (${Math.max(1,Math.round(f.size/1024))} KB)`).join(' · ')
        : 'Noch keine Dateien ausgewählt.';
    });
  }

  function newRequestId(){
    const d=new Date();
    const day=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('');
    const rnd=Math.random().toString(36).slice(2,6).toUpperCase();
    return `ER-${day}-${rnd}`;
  }

  // Real request submission through the configured Supabase Edge Function.
  const form=document.getElementById('projectForm');
  if(form){
    form.addEventListener('submit',async(e)=>{
      e.preventDefault();
      const status=document.getElementById('requestStatus');
      const button=document.getElementById('submitRequest');
      const requestId=newRequestId();
      document.getElementById('requestId').value=requestId;

      if(!cfg.supabaseUrl||!cfg.supabasePublishableKey){
        status.className='request-status error';
        status.textContent=`${requestId}: Die Anfrage konnte aktuell nicht gesendet werden. Bitte nutze E-Mail oder WhatsApp.`;
        return;
      }

      const fd=new FormData(form);
      fd.set('requestId',requestId);

      button.disabled=true;
      status.className='request-status';
      status.textContent=`${requestId}: Anfrage und Anhänge werden sicher übertragen …`;

      try{
        const res=await fetch(`${cfg.supabaseUrl}/functions/v1/${cfg.requestFunction||'submit-request'}`,{
          method:'POST',
          headers:{'apikey':cfg.supabasePublishableKey},
          body:fd
        });
        const data=await res.json();
        if(!res.ok) throw new Error(data.error||'Übertragung fehlgeschlagen');

        status.className='request-status success';
        status.textContent=`Anfrage ${data.requestId||requestId} wurde erfolgreich übermittelt. Eine Bestätigung folgt per E-Mail.`;
        document.dispatchEvent(new CustomEvent('erstelli:request-success'));
        // Keep customer details, but clear message + files after confirmed transfer.
        document.getElementById('message').value='';
        filesInput && (filesInput.value='');
        fileList && (fileList.textContent='Noch keine Dateien ausgewählt.');
      }catch(err){
        status.className='request-status error';
        status.textContent=`${requestId}: ${err.message}`;
        document.dispatchEvent(new CustomEvent('erstelli:request-error'));
      }finally{
        button.disabled=false;
      }
    });
  }

  // Public approved reviews
  const reviewsGrid=document.getElementById('reviewsGrid');
  if(reviewsGrid&&cfg.supabaseUrl&&cfg.supabasePublishableKey){
    fetch(`${cfg.supabaseUrl}/functions/v1/${cfg.reviewsFunction||'public-reviews'}`,{
      headers:{'apikey':cfg.supabasePublishableKey}
    }).then(r=>r.json()).then(data=>{
      if(!Array.isArray(data.reviews)||!data.reviews.length)return;
      reviewsGrid.innerHTML='';
      data.reviews.slice(0,6).forEach(review=>{
        const article=document.createElement('article');
        article.className='review-card-public';
        const stars='★'.repeat(Math.max(1,Math.min(5,review.rating)))+'☆'.repeat(5-Math.max(1,Math.min(5,review.rating)));
        article.innerHTML=`<div class="review-stars">${stars}</div><p></p><strong></strong><footer></footer>`;
        article.querySelector('p').textContent=review.text;
        article.querySelector('strong').textContent=review.display_name||'Verifizierter Kunde';
        article.querySelector('footer').textContent='Verifizierter ERSTELLI-Auftrag';
        reviewsGrid.appendChild(article);
      });
    }).catch(()=>{});
  }
})();

// V22 — add design answers to the request summary sent to ERSTELLI.
(function(){
  const form=document.getElementById('projectForm');
  const config=document.getElementById('configText');
  if(!form||!config) return;

  const questionNames=['siteColor','siteStyle','siteGoal','contentStatus'];

  function selected(name){
    return form.querySelector(`input[name="${name}"]:checked`)?.value || 'Keine Angabe';
  }

  function designAnswers(){
    const custom=document.getElementById('customColors')?.value.trim();
    return [
      '',
      'Design-Wünsche',
      `Farbrichtung: ${selected('siteColor')}${selected('siteColor')==='Eigene Farben' && custom ? ` – ${custom}` : ''}`,
      `Stil: ${selected('siteStyle')}`,
      `Hauptziel der Website: ${selected('siteGoal')}`,
      `Vorhandene Inhalte: ${selected('contentStatus')}`
    ].join('\n');
  }

  let baseSummary=config.value;
  function refresh(){
    // Strip an older generated Design-Wünsche block if present.
    const marker='\nDesign-Wünsche\n';
    const current=config.value;
    const pos=current.indexOf(marker);
    if(pos>=0) baseSummary=current.slice(0,pos);
    else if(!current.includes('Design-Wünsche')) baseSummary=current;
    config.value=baseSummary.replace(/\s+$/,'')+designAnswers();
    config.dispatchEvent(new Event('change',{bubbles:true}));
  }

  form.querySelectorAll('input[name="siteColor"],input[name="siteStyle"],input[name="siteGoal"],input[name="contentStatus"],#customColors')
    .forEach(el=>{
      el.addEventListener('change',refresh);
      el.addEventListener('input',refresh);
    });

  // Re-append answers after package/add-on changes update the configuration field.
  const observer=new MutationObserver(()=>{});
  form.addEventListener('change',e=>{
    if(e.target.closest('.project-questions')) return;
    setTimeout(()=>{
      const pos=config.value.indexOf('\nDesign-Wünsche\n');
      if(pos>=0) baseSummary=config.value.slice(0,pos);
      else baseSummary=config.value;
      refresh();
    },0);
  });
  refresh();
})();


// V33 — exact one-character glow for every editable text field, desktop + mobile.
// Mobile Safari/Chrome can pan the visual viewport when the keyboard opens. The
// glow is therefore anchored in document coordinates instead of fixed viewport
// coordinates, and visualViewport offsets are included when present.
(function(){
  const selector = [
    'input:not([readonly]):not([disabled]):not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([type="hidden"])',
    'textarea:not([readonly]):not([disabled])'
  ].join(',');

  const copied = [
    'fontFamily','fontSize','fontWeight','fontStyle','fontVariant',
    'fontStretch','fontKerning','fontFeatureSettings','fontVariationSettings',
    'letterSpacing','lineHeight','textTransform','textIndent','wordSpacing',
    'textAlign','textRendering',
    'paddingTop','paddingRight','paddingBottom','paddingLeft',
    'borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth',
    'boxSizing'
  ];

  function copyComputed(cs, target){
    copied.forEach(prop => target.style[prop] = cs[prop]);
  }

  function documentPoint(rect){
    const vv = window.visualViewport;
    return {
      left: rect.left + window.scrollX + (vv ? vv.offsetLeft : 0),
      top: rect.top + window.scrollY + (vv ? vv.offsetTop : 0)
    };
  }

  function showExactGlow(field, ch){
    if(!ch || ch === '\n' || ch === '\r') return;

    const cs = getComputedStyle(field);
    const rect = field.getBoundingClientRect();
    const fieldPoint = documentPoint(rect);
    const selection = typeof field.selectionStart === 'number' ? field.selectionStart : field.value.length;
    const caret = Math.max(0, selection - 1);

    // Mirror is anchored to the document so it follows the real field exactly
    // even while iOS moves the visual viewport for the on-screen keyboard.
    const mirror = document.createElement('div');
    mirror.setAttribute('aria-hidden','true');
    mirror.style.position = 'absolute';
    mirror.style.left = fieldPoint.left + 'px';
    mirror.style.top = fieldPoint.top + 'px';
    mirror.style.width = rect.width + 'px';
    mirror.style.height = rect.height + 'px';
    mirror.style.visibility = 'hidden';
    mirror.style.pointerEvents = 'none';
    mirror.style.overflow = 'hidden';
    mirror.style.zIndex = '-1';
    mirror.style.margin = '0';
    mirror.style.background = 'transparent';
    copyComputed(cs, mirror);

    const inner = document.createElement('div');
    inner.style.position = 'relative';
    inner.style.left = (-field.scrollLeft) + 'px';
    inner.style.top = (-field.scrollTop) + 'px';
    inner.style.margin = '0';
    inner.style.padding = '0';
    inner.style.border = '0';
    inner.style.font = 'inherit';
    inner.style.fontFamily = cs.fontFamily;
    inner.style.fontSize = cs.fontSize;
    inner.style.fontWeight = cs.fontWeight;
    inner.style.fontStyle = cs.fontStyle;
    inner.style.fontVariant = cs.fontVariant;
    inner.style.fontStretch = cs.fontStretch;
    inner.style.letterSpacing = cs.letterSpacing;
    inner.style.lineHeight = cs.lineHeight;
    inner.style.wordSpacing = cs.wordSpacing;
    inner.style.textTransform = cs.textTransform;
    inner.style.textIndent = cs.textIndent;
    inner.style.textAlign = cs.textAlign;

    if(field.tagName === 'TEXTAREA'){
      mirror.style.whiteSpace = 'pre-wrap';
      mirror.style.overflowWrap = 'break-word';
      mirror.style.wordBreak = 'break-word';
      inner.style.whiteSpace = 'pre-wrap';
      inner.style.overflowWrap = 'break-word';
      inner.style.wordBreak = 'break-word';
      inner.style.width = '100%';
    } else {
      mirror.style.whiteSpace = 'pre';
      inner.style.whiteSpace = 'pre';
      inner.style.width = 'max-content';
      inner.style.minWidth = '100%';
    }

    const before = document.createTextNode(field.value.slice(0, caret));
    const probe = document.createElement('span');
    probe.textContent = ch;
    probe.style.fontFamily = cs.fontFamily;
    probe.style.fontSize = cs.fontSize;
    probe.style.fontWeight = cs.fontWeight;
    probe.style.fontStyle = cs.fontStyle;
    probe.style.fontVariant = cs.fontVariant;
    probe.style.fontStretch = cs.fontStretch;
    probe.style.letterSpacing = cs.letterSpacing;
    probe.style.lineHeight = cs.lineHeight;
    probe.style.wordSpacing = cs.wordSpacing;
    probe.style.textTransform = cs.textTransform;

    inner.appendChild(before);
    inner.appendChild(probe);
    mirror.appendChild(inner);
    document.body.appendChild(mirror);

    const probeRect = probe.getBoundingClientRect();
    const probePoint = documentPoint(probeRect);

    const pop = document.createElement('span');
    pop.className = 'typing-glow-char';
    pop.textContent = ch;
    pop.style.position = 'absolute';
    pop.style.fontFamily = cs.fontFamily;
    pop.style.fontSize = cs.fontSize;
    pop.style.fontWeight = cs.fontWeight;
    pop.style.fontStyle = cs.fontStyle;
    pop.style.fontVariant = cs.fontVariant;
    pop.style.fontStretch = cs.fontStretch;
    pop.style.letterSpacing = cs.letterSpacing;
    pop.style.lineHeight = cs.lineHeight;
    pop.style.wordSpacing = cs.wordSpacing;
    pop.style.textTransform = cs.textTransform;
    pop.style.left = probePoint.left + 'px';
    pop.style.top = probePoint.top + 'px';

    document.body.appendChild(pop);
    mirror.remove();
    setTimeout(() => pop.remove(), 1000);
  }

  // Delegated listener also covers fields that are inserted later by scripts.
  document.addEventListener('input', e => {
    const field = e.target;
    if(!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
    if(!field.matches(selector)) return;
    if(e.inputType?.startsWith('delete')) return;

    let ch = '';
    if(typeof e.data === 'string' && e.data.length){
      ch = Array.from(e.data).slice(-1)[0] || '';
    } else {
      const pos = typeof field.selectionStart === 'number' ? field.selectionStart : field.value.length;
      if(pos > 0) ch = field.value.charAt(pos - 1);
    }
    showExactGlow(field, ch);
  }, true);
})();


// V31 — datensparsame ERSTELLI-Analytics ohne Cookies, LocalStorage oder Fingerprinting.
(function(){
  const cfg=window.ERSTELLI_CONFIG||{};
  if(!cfg.analyticsEnabled||!cfg.supabaseUrl||!cfg.supabasePublishableKey) return;
  const endpoint=`${cfg.supabaseUrl}/functions/v1/${cfg.analyticsFunction||'track-event'}`;
  const sessionId=(crypto.randomUUID?crypto.randomUUID():`${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`);
  const qp=new URLSearchParams(location.search);
  const ref=(()=>{try{return document.referrer?new URL(document.referrer).hostname:''}catch(_){return''}})();
  const source=(qp.get('utm_source')||ref||'direct').slice(0,120);
  const medium=(qp.get('utm_medium')||'').slice(0,120);
  const campaign=(qp.get('utm_campaign')||'').slice(0,120);
  const w=innerWidth;
  const deviceGroup=w<700?'mobile':w<1100?'tablet':'desktop';
  const base={sessionId,page:location.pathname||'/',source,medium,campaign,deviceGroup};
  const sent=new Set();
  function track(eventName,extra={}){
    const body=JSON.stringify({...base,eventName,...extra});
    fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.supabasePublishableKey,'Authorization':`Bearer ${cfg.supabasePublishableKey}`},body,keepalive:true}).catch(()=>{});
  }
  track('page_view');

  const sectionObs=new IntersectionObserver(entries=>entries.forEach(e=>{
    if(!e.isIntersecting||e.intersectionRatio<.45) return;
    const id=e.target.id||''; if(!id||sent.has(`section:${id}`))return;
    sent.add(`section:${id}`); track('section_view',{section:id});
  }),{threshold:[.45]});
  document.querySelectorAll('section[id]').forEach(s=>sectionObs.observe(s));

  const depths=[25,50,75,100];
  addEventListener('scroll',()=>{
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    const pct=Math.min(100,Math.round(scrollY/max*100));
    depths.forEach(d=>{if(pct>=d&&!sent.has(`scroll:${d}`)){sent.add(`scroll:${d}`);track('scroll_depth',{value:String(d)})}});
  },{passive:true});

  document.querySelectorAll('[data-type="base"]').forEach(el=>el.addEventListener('click',()=>track('package_select',{element:'Grundpaket',value:el.dataset.name||el.textContent.trim().slice(0,80)})));
  document.querySelectorAll('.choice.toggle').forEach(el=>el.addEventListener('click',()=>track('addon_toggle',{element:el.dataset.name||'Zusatzfunktion',value:el.classList.contains('active')?'on':'off'})));
  document.getElementById('useConfig')?.addEventListener('click',()=>track('configurator_use',{element:'Konfiguration übernehmen'}));
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach(el=>el.addEventListener('click',()=>track('whatsapp_click',{element:el.id||'WhatsApp'})));
  document.querySelectorAll('a[href^="mailto:"]').forEach(el=>el.addEventListener('click',()=>track('email_click',{element:el.id||'E-Mail'})));
  document.querySelector('.review-submit-btn')?.addEventListener('click',()=>track('review_click',{element:'Bewertung abgeben'}));

  const form=document.getElementById('projectForm');
  if(form){
    let started=false;
    form.addEventListener('input',()=>{if(!started){started=true;track('form_start',{section:'kontakt'})}},{once:false});
    document.getElementById('projectFiles')?.addEventListener('change',e=>track('file_add',{element:'Dateiupload',value:String(e.target.files?.length||0)}));
    form.addEventListener('submit',()=>track('request_submit_attempt',{section:'kontakt'}));
    document.addEventListener('erstelli:request-success',()=>track('request_submit_success',{section:'kontakt'}));
    document.addEventListener('erstelli:request-error',()=>track('request_submit_error',{section:'kontakt'}));
  }
})();

@echo off
start "" "%~dp0index.html"

@echo off
start "" "%~dp0index.html"

:root{--blue:#075dd9;--cyan:#13b6ff;--ink:#071f3d;--muted:#5e748b;--line:rgba(5,91,180,.12);--card:rgba(255,255,255,.78)}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:Inter,Arial,sans-serif;color:var(--ink);background:linear-gradient(180deg,#e8f8ff,#f9fdff 53%,#e6f7ff);overflow-x:hidden}a{text-decoration:none;color:inherit}button,input,textarea{font:inherit}#codeRain{position:fixed;inset:0;width:100%;height:100%;z-index:-3;opacity:.20}.aurora{position:fixed;border-radius:50%;filter:blur(90px);z-index:-2;pointer-events:none}.a1{width:500px;height:500px;background:rgba(0,142,255,.15);top:7%;left:-190px}.a2{width:520px;height:520px;background:rgba(25,203,255,.13);right:-220px;top:48%}.shell{width:min(1180px,calc(100% - 40px));margin:auto}.nav{position:sticky;top:0;z-index:50;height:74px;padding:0 max(20px,calc((100vw - 1180px)/2));display:flex;align-items:center;justify-content:space-between;background:rgba(235,249,255,.78);backdrop-filter:blur(18px);border-bottom:1px solid rgba(5,91,180,.08)}.brand{display:flex;align-items:center;gap:10px;font-weight:800}.logo{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,var(--blue),var(--cyan));color:#fff;font:700 13px ui-monospace,monospace;box-shadow:0 12px 26px rgba(5,91,180,.22)}.nav nav{display:flex;gap:27px}.nav nav a{font-size:14px;font-weight:700;color:#355570}.cta,.ghost{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 20px;border-radius:13px;border:0;font-weight:800;cursor:pointer}.cta{background:linear-gradient(135deg,var(--blue),var(--cyan));color:white;box-shadow:0 16px 34px rgba(5,91,180,.21)}.ghost{background:rgba(255,255,255,.82);border:1px solid var(--line);color:#143451}.small{min-height:42px}.full{width:100%}.hero{min-height:calc(100vh - 74px);display:grid;grid-template-columns:1.02fr .98fr;gap:70px;align-items:center;padding:70px 0}.badge{display:inline-flex;align-items:center;gap:9px;padding:9px 12px;border-radius:99px;background:rgba(255,255,255,.72);border:1px solid var(--line);font-size:12px;font-weight:800;letter-spacing:.12em;color:#0b6fd0}.badge i{width:8px;height:8px;border-radius:50%;background:#20c989;box-shadow:0 0 0 5px rgba(32,201,137,.12)}.hero h1{font-size:clamp(54px,7vw,87px);line-height:.96;letter-spacing:-.06em;margin:21px 0}.hero h1 span{background:linear-gradient(90deg,var(--blue),var(--cyan));-webkit-background-clip:text;color:transparent}.hero-copy>p{max-width:660px;font-size:19px;line-height:1.72;color:var(--muted)}.actions{display:flex;gap:12px;margin-top:29px}.facts{display:flex;gap:34px;margin-top:35px}.facts div{display:flex;flex-direction:column;gap:3px}.facts strong{font-size:22px;color:#0865cd}.facts span{font-size:12px;color:#6a7f94}.hero-visual{position:relative;min-height:520px;display:grid;place-items:center}.browser{width:min(570px,100%);border-radius:25px;overflow:hidden;background:rgba(255,255,255,.84);border:1px solid var(--line);box-shadow:0 30px 90px rgba(21,86,150,.17);backdrop-filter:blur(16px)}.browser-top{height:48px;background:#f2f9fd;display:flex;align-items:center;padding:0 15px;position:relative}.dots{display:flex;gap:6px}.dots i{width:8px;height:8px;border-radius:50%;background:#aac3d4}.browser-top>span{position:absolute;left:50%;transform:translateX(-50%);font-size:11px;color:#7890a5;background:white;padding:7px 18px;border-radius:8px}.browser-body{padding:24px;background:linear-gradient(145deg,#fbfeff,#e8f6ff)}.mini-nav{display:flex;align-items:center;gap:8px}.mini-nav b{width:86px;height:14px;border-radius:5px;background:linear-gradient(90deg,#0964d8,#53c8ff);margin-right:auto}.mini-nav em{width:34px;height:5px;border-radius:5px;background:#a9c3d8}.mini-grid{display:grid;grid-template-columns:1fr .85fr;gap:22px;align-items:center;padding:54px 10px 28px}.mini-grid small{font-size:8px;font-weight:800;color:#1871ce;background:#dff3ff;padding:6px 8px;border-radius:99px}.mini-grid h3{font-size:30px;line-height:1.04;letter-spacing:-.05em}.mini-grid p{height:7px;background:#adc6d7;border-radius:8px}.mini-grid .short{width:65%}.mini-grid button{border:0;background:#0b67dc;color:#fff;padding:10px 14px;border-radius:9px;font-weight:800}.orb-wrap{position:relative;height:220px;display:grid;place-items:center}.orb{position:absolute;width:170px;height:170px;border-radius:50%;background:radial-gradient(circle at 35% 25%,#72e2ff,#1683e9 50%,#062d67);box-shadow:0 23px 65px rgba(0,118,225,.35)}pre{position:relative;color:#e9fbff;background:rgba(2,24,52,.78);padding:17px;border-radius:13px;font:11px/1.7 ui-monospace,monospace;transform:rotate(-4deg)}.floating{animation:float 5s ease-in-out infinite}@keyframes float{50%{transform:translateY(-10px)}}.float-chip{position:absolute;padding:11px 14px;border-radius:13px;background:rgba(255,255,255,.92);border:1px solid var(--line);box-shadow:0 16px 35px rgba(18,80,140,.13);font-size:12px;font-weight:800}.chip1{left:-5px;bottom:58px}.chip2{right:-10px;top:65px}.section{padding:100px 0}.head{text-align:center;max-width:760px;margin:0 auto 43px}.head>span,.eyebrow,.contact-copy>span{font-size:12px;font-weight:900;letter-spacing:.13em;color:#0a71d5}.head h2,.contact h2{font-size:clamp(37px,5vw,58px);line-height:1.05;letter-spacing:-.047em;margin:12px 0 15px}.head p{color:var(--muted);line-height:1.7}.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.card{padding:29px;border-radius:22px;background:var(--card);border:1px solid var(--line);box-shadow:0 20px 60px rgba(25,95,160,.08);backdrop-filter:blur(15px)}.card>b{display:grid;place-items:center;width:50px;height:50px;border-radius:15px;background:#dff4ff;color:#086bd1}.card h3{font-size:21px}.card p{line-height:1.65;color:var(--muted)}.configurator-section{padding-top:85px}.config-layout{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:22px;align-items:start}.config-options{display:grid;gap:16px}.config-block{padding:25px;border-radius:23px;background:rgba(255,255,255,.79);border:1px solid var(--line);box-shadow:0 18px 55px rgba(28,96,156,.07)}.config-title{display:flex;align-items:center;gap:13px;margin-bottom:19px}.config-title>span{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#dff4ff;color:#086bd1;font-weight:900}.config-title h3{margin:0 0 4px}.config-title p{margin:0;color:var(--muted);font-size:13px}.choice-grid{display:grid;gap:11px}.packages{grid-template-columns:repeat(3,1fr)}.addons{grid-template-columns:repeat(2,1fr)}.choice{text-align:left;position:relative;padding:16px;border-radius:16px;border:1px solid rgba(5,91,180,.12);background:#fafdff;color:var(--ink);cursor:pointer;transition:.2s}.choice:hover{transform:translateY(-2px);border-color:rgba(5,91,180,.28)}.choice.active{background:linear-gradient(145deg,#edf9ff,#dff3ff);border:1.5px solid #1789e8;box-shadow:0 12px 25px rgba(7,100,200,.10)}.choice strong,.choice span,.choice em{display:block}.choice strong{font-size:14px;margin-bottom:5px}.choice span{font-size:11px;color:var(--muted);min-height:26px}.choice em{margin-top:8px;font-style:normal;font-weight:900;color:#0969d3}.choice.active:after{content:'✓';position:absolute;right:11px;top:10px;width:23px;height:23px;border-radius:50%;display:grid;place-items:center;background:#0d77db;color:white;font-size:12px}.counter-row{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:15px;border-radius:16px;background:#fafdff;border:1px solid var(--line)}.counter-row strong,.counter-row small{display:block}.counter-row small{color:var(--muted);margin-top:4px}.counter{display:flex;align-items:center;gap:13px}.counter button{width:36px;height:36px;border-radius:11px;border:1px solid var(--line);background:white;color:#086bd1;font-size:22px;cursor:pointer}.counter>strong{min-width:18px;text-align:center}.price-panel{position:relative}.price-sticky{position:sticky;top:94px;padding:25px;border-radius:24px;background:linear-gradient(155deg,#061f3e,#0b4f92);color:white;box-shadow:0 27px 80px rgba(7,48,90,.23)}.price-sticky .eyebrow{color:#68cfff}.live-price{padding:20px 0;border-bottom:1px solid rgba(255,255,255,.13)}.live-price small{display:block;color:#acd1ed;margin-bottom:5px}.live-price strong{font-size:47px;letter-spacing:-.05em}.summary{display:grid;gap:10px;padding:18px 0}.summary-row{display:flex;justify-content:space-between;gap:12px;font-size:12px;color:#d9ebf8}.summary-row b{color:#fff}.price-note{font-size:11px;line-height:1.55;color:#a9c9e3;padding:14px;border-radius:13px;background:rgba(255,255,255,.07);margin-bottom:16px}.steps4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.step{padding:24px;border-radius:20px;background:rgba(255,255,255,.76);border:1px solid var(--line)}.step>span{display:grid;place-items:center;width:43px;height:43px;border-radius:13px;background:#dff4ff;color:#086bd1;font-weight:900}.step h3{margin:17px 0 8px}.step p{margin:0;color:var(--muted);line-height:1.6}.contact{display:grid;grid-template-columns:.85fr 1.15fr;gap:54px;padding:45px;border-radius:29px;background:linear-gradient(135deg,#061f3f,#0a4f92);color:white;box-shadow:0 35px 90px rgba(7,48,90,.23)}.contact-copy>span{color:#64cfff}.contact-copy p{color:#b9d5ea;line-height:1.7}.contact form{display:grid;gap:11px;padding:22px;border-radius:20px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.10)}.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}input,textarea{width:100%;border:0;outline:none;padding:13px 14px;border-radius:11px;background:#fff;color:#102a45}textarea{resize:vertical}.contact form small{text-align:center;color:#bcd6e9}.footer{display:flex;justify-content:space-between;align-items:center;padding:30px 0 40px;color:#71869a;font-size:13px}.chat-toggle{position:fixed;right:23px;bottom:23px;width:62px;height:62px;border-radius:50%;border:0;background:linear-gradient(135deg,var(--blue),var(--cyan));color:white;font-size:29px;box-shadow:0 18px 40px rgba(7,91,216,.34);cursor:pointer;z-index:80}.chat-panel{position:fixed;right:23px;bottom:97px;width:min(375px,calc(100vw - 28px));height:525px;background:rgba(250,254,255,.98);border:1px solid var(--line);border-radius:23px;box-shadow:0 30px 80px rgba(8,55,108,.25);z-index:79;display:flex;flex-direction:column;opacity:0;pointer-events:none;transform:translateY(15px) scale(.97);transition:.22s}.chat-panel.open{opacity:1;pointer-events:auto;transform:none}.chat-head{display:flex;align-items:center;gap:10px;padding:14px;border-bottom:1px solid var(--line)}.avatar{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--blue),var(--cyan));color:white;font-size:22px}.chat-head strong,.chat-head small{display:block}.chat-head small{font-size:10px;color:#688197;margin-top:3px}.chat-head small i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#21c784}.chat-head>button{margin-left:auto;border:0;background:none;font-size:28px;color:#687e91;cursor:pointer}.messages{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:9px}.bot,.user{max-width:85%;padding:11px 13px;border-radius:14px;font-size:13px;line-height:1.5}.bot{align-self:flex-start;background:#e2f4ff}.user{align-self:flex-end;background:#0b6bd9;color:white}.quick{display:flex;gap:7px;overflow:auto;padding:0 11px 9px}.quick button{white-space:nowrap;border:1px solid #cae5f6;background:#fff;color:#315f7f;border-radius:99px;padding:7px 9px;cursor:pointer}.chat-form{display:grid;grid-template-columns:1fr 44px;gap:7px;padding:11px;border-top:1px solid var(--line)}.chat-form button{border:0;border-radius:11px;background:#0a69d6;color:white}.reveal{opacity:0;transform:translateY(22px);transition:.65s}.reveal.visible{opacity:1;transform:none}.delay1{transition-delay:.07s}.delay2{transition-delay:.14s}.delay3{transition-delay:.21s}@media(max-width:980px){.nav nav{display:none}.hero{grid-template-columns:1fr;min-height:auto;gap:30px}.hero-visual{min-height:450px}.grid3,.steps4{grid-template-columns:1fr 1fr}.config-layout{grid-template-columns:1fr}.price-sticky{position:relative;top:auto}.contact{grid-template-columns:1fr}}@media(max-width:650px){.shell{width:calc(100% - 28px)}.nav{padding:0 14px}.nav>.small{display:none}.hero{padding:52px 0}.hero h1{font-size:47px}.hero-copy>p{font-size:16px}.actions{flex-direction:column}.facts{gap:14px;justify-content:space-between}.browser-body{padding:16px}.mini-grid{padding:38px 0 18px}.mini-grid h3{font-size:21px}.orb-wrap{height:160px}.orb{width:125px;height:125px}.float-chip{display:none}.section{padding:76px 0}.grid3,.steps4,.packages,.addons{grid-template-columns:1fr}.contact{padding:26px 18px}.two{grid-template-columns:1fr}.footer{flex-direction:column;gap:15px;text-align:center}.chat-toggle{right:15px;bottom:15px}.chat-panel{right:14px;bottom:88px}.live-price strong{font-size:42px}}

/* V3 — luminous horizontal code lanes */
body{position:relative;isolation:isolate}
#codeRain{opacity:.07}
.code-lanes{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;mask-image:linear-gradient(to bottom,transparent 0%,#000 7%,#000 93%,transparent 100%)}
.code-lane{position:absolute;left:-8vw;width:116vw;height:64px;display:flex;align-items:center;overflow:hidden;opacity:.58;filter:drop-shadow(0 0 14px rgba(46,203,255,.45))}
.code-lane::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(68,206,255,.08),rgba(114,225,255,.17),rgba(34,115,255,.08),transparent);border-top:1px solid rgba(84,205,255,.12);border-bottom:1px solid rgba(115,220,255,.10)}
.code-track{position:relative;z-index:1;display:block;width:max-content;white-space:nowrap;font:600 14px/1.1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.03em;background:linear-gradient(90deg,#159eff,#8cecff,#3cc8ff,#1c7cff,#a3f2ff);background-size:260% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 0 16px rgba(60,205,255,.25);animation:codeGlow 5s linear infinite}
.lane-a{top:13%}.lane-b{top:31%}.lane-c{top:49%}.lane-d{top:68%}.lane-e{top:86%}
.lane-a .code-track,.lane-c .code-track,.lane-e .code-track{animation:moveLeft 26s linear infinite,codeGlow 5s linear infinite}
.lane-b .code-track,.lane-d .code-track{animation:moveRight 29s linear infinite,codeGlow 6s linear infinite}
@keyframes moveLeft{from{transform:translateX(0)}to{transform:translateX(-42%)}}
@keyframes moveRight{from{transform:translateX(-42%)}to{transform:translateX(0)}}
@keyframes codeGlow{0%{background-position:0% 50%}100%{background-position:260% 50%}}

/* gradient typography across major headings */
.hero h1 span,.head h2,.contact-copy h2,.config-title h3,.price-panel .live-price strong{
  background:linear-gradient(90deg,#0877e8 0%,#29bfff 40%,#96ecff 68%,#318cff 100%);
  background-size:220% auto;-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:titleShift 7s linear infinite;
}
@keyframes titleShift{to{background-position:220% center}}
.head>span,.eyebrow,.contact-copy>span,.price small,.badge{background:linear-gradient(90deg,#0877e8,#4ad0ff,#9cecff);-webkit-background-clip:text;background-clip:text;color:transparent}

/* hero preview cleaner — no blocking code card / floating chips */
.orb-wrap pre,.float-chip{display:none!important}
.orb-wrap{overflow:visible}
.orb{box-shadow:0 0 36px rgba(45,197,255,.48),0 25px 70px rgba(10,101,219,.28);animation:orbPulse 4s ease-in-out infinite}
@keyframes orbPulse{50%{transform:scale(1.045);filter:saturate(1.2) brightness(1.07)}}
.browser{position:relative}
.browser::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(120deg,transparent 15%,rgba(126,230,255,.14) 42%,transparent 65%);transform:translateX(-120%);animation:sheen 7s ease-in-out infinite}
@keyframes sheen{55%,100%{transform:translateX(140%)}}

/* keep foreground cards readable while animation passes behind */
.card,.config-block,.price-sticky,.contact,.browser{backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px)}
@media (prefers-reduced-motion:reduce){.code-track,.hero h1 span,.head h2,.contact-copy h2,.config-title h3,.price-panel .live-price strong,.orb,.browser::after{animation:none!important}}

/* V4 — premium neon code, animated gradients, floating click cards, sparkle return */
:root{
  --ice:#dff8ff;
  --sky:#54d5ff;
  --electric:#168dff;
  --violet:#8a7dff;
  --aqua:#58ffd6;
}

/* Much denser full-page code field */
#codeRain{opacity:.10!important;filter:drop-shadow(0 0 8px rgba(60,211,255,.22))}
.code-lanes{
  z-index:-1!important;
  opacity:1;
  mix-blend-mode:multiply;
}
.code-lane{
  left:-12vw!important;
  width:124vw!important;
  height:48px!important;
  opacity:.78!important;
  overflow:visible!important;
  filter:drop-shadow(0 0 8px rgba(26,172,255,.45)) drop-shadow(0 0 22px rgba(84,222,255,.26))!important;
}
.code-lane::before{
  background:linear-gradient(90deg,transparent 2%,rgba(74,212,255,.03) 14%,rgba(112,236,255,.11) 48%,rgba(54,133,255,.05) 80%,transparent 98%)!important;
  border:0!important;
  box-shadow:0 0 30px rgba(70,214,255,.07);
}
.code-track{
  font-size:13px!important;
  font-weight:650!important;
  letter-spacing:.045em!important;
  background:linear-gradient(90deg,#1279ff 0%,#3fc6ff 16%,#b9f7ff 32%,#51ffe2 48%,#8f87ff 62%,#47cfff 78%,#197aff 100%)!important;
  background-size:420% 100%!important;
  -webkit-background-clip:text!important;
  background-clip:text!important;
  color:transparent!important;
  text-shadow:0 0 8px rgba(40,183,255,.22),0 0 22px rgba(90,224,255,.15)!important;
  will-change:transform,background-position,filter;
}
.lane-1{top:5%}.lane-2{top:14%}.lane-3{top:23%}.lane-4{top:32%}.lane-5{top:41%}.lane-6{top:50%}.lane-7{top:59%}.lane-8{top:68%}.lane-9{top:77%}.lane-10{top:86%}.lane-11{top:95%}
.lane-1 .code-track,.lane-3 .code-track,.lane-5 .code-track,.lane-7 .code-track,.lane-9 .code-track,.lane-11 .code-track{animation:premiumLeft 24s linear infinite,neonColor 7s linear infinite,neonBreathe 3.8s ease-in-out infinite}
.lane-2 .code-track,.lane-4 .code-track,.lane-6 .code-track,.lane-8 .code-track,.lane-10 .code-track{animation:premiumRight 27s linear infinite,neonColor 8s linear infinite reverse,neonBreathe 4.2s ease-in-out infinite}
@keyframes premiumLeft{from{transform:translateX(0)}to{transform:translateX(-46%)}}
@keyframes premiumRight{from{transform:translateX(-46%)}to{transform:translateX(0)}}
@keyframes neonColor{0%{background-position:0% 50%}100%{background-position:420% 50%}}
@keyframes neonBreathe{0%,100%{filter:brightness(.9) saturate(1)}50%{filter:brightness(1.28) saturate(1.35)}}

/* Premium blue mixed typography */
.hero h1,
.hero h1 span,
.head h2,
.contact-copy h2,
.config-title h3,
.choice strong,
.price-panel .live-price strong,
.step h3,
.card h3{
  background:linear-gradient(92deg,#0759d8 0%,#13a9ff 25%,#8deaff 46%,#5b8fff 67%,#35d8ff 84%,#0b70e9 100%)!important;
  background-size:300% auto!important;
  -webkit-background-clip:text!important;
  background-clip:text!important;
  color:transparent!important;
  animation:headingSpectrum 8s linear infinite!important;
}
@keyframes headingSpectrum{to{background-position:300% center}}

/* Clickable configuration windows: animated color skin + shimmer */
.choice{
  overflow:hidden;
  isolation:isolate;
  transform:translateY(0) scale(1);
  transition:transform .26s cubic-bezier(.2,.8,.2,1),box-shadow .26s ease,border-color .26s ease!important;
  background:linear-gradient(135deg,rgba(255,255,255,.93),rgba(233,249,255,.92))!important;
  box-shadow:0 10px 28px rgba(13,99,180,.06)!important;
}
.choice::before{
  content:"";
  position:absolute;
  inset:-1px;
  z-index:-2;
  border-radius:inherit;
  padding:1.5px;
  background:linear-gradient(110deg,#25baff,#a8f1ff,#78ffdf,#8f8cff,#2f8cff,#25baff);
  background-size:320% 320%;
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;
  mask-composite:exclude;
  opacity:.32;
  animation:cardHue 6s linear infinite;
}
.choice::after{
  content:"";
  position:absolute;
  z-index:-1;
  top:-70%;left:-60%;width:52%;height:240%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.72),rgba(116,232,255,.32),transparent);
  transform:rotate(18deg);
  animation:choiceSheen 5.4s ease-in-out infinite;
}
.choice:hover{
  transform:translateY(-7px) scale(1.012)!important;
  box-shadow:0 19px 42px rgba(7,118,218,.16),0 0 28px rgba(70,213,255,.12)!important;
}
.choice:active{transform:translateY(-3px) scale(.993)!important}
.choice.active{
  background:linear-gradient(135deg,rgba(232,249,255,.98),rgba(218,241,255,.95),rgba(240,238,255,.92))!important;
  box-shadow:0 18px 44px rgba(7,120,220,.17),0 0 34px rgba(61,207,255,.17)!important;
}
.choice.active::before{opacity:.9;filter:drop-shadow(0 0 8px rgba(70,214,255,.45))}
.choice.active:after{z-index:3!important;background:linear-gradient(135deg,#0f82eb,#4edfff)!important;box-shadow:0 0 18px rgba(55,207,255,.55)!important}
@keyframes cardHue{to{background-position:320% 320%}}
@keyframes choiceSheen{0%,55%{transform:translateX(-220%) rotate(18deg)}82%,100%{transform:translateX(520%) rotate(18deg)}}

/* Glowing animated containers around the configurator */
.config-block,.price-sticky,.card,.contact{
  position:relative;
  overflow:hidden;
}
.config-block::before,.price-sticky::before,.card::before,.contact::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  border-radius:inherit;
  background:linear-gradient(120deg,transparent 18%,rgba(101,229,255,.14) 38%,rgba(149,140,255,.10) 51%,transparent 70%);
  background-size:240% 100%;
  transform:translateX(-100%);
  animation:panelShimmer 8s ease-in-out infinite;
}
@keyframes panelShimmer{0%,38%{transform:translateX(-110%)}72%,100%{transform:translateX(110%)}}

/* Make CTAs feel alive */
.cta,.ghost,.mini-grid button,.counter button,.quick button,.chat-toggle{
  transition:transform .22s cubic-bezier(.2,.8,.2,1),box-shadow .22s ease,filter .22s ease!important;
}
.cta:hover,.ghost:hover,.mini-grid button:hover,.counter button:hover,.quick button:hover,.chat-toggle:hover{
  transform:translateY(-4px)!important;
  filter:brightness(1.04) saturate(1.08);
}
.cta:active,.ghost:active,.mini-grid button:active,.counter button:active,.quick button:active,.chat-toggle:active{transform:translateY(-1px) scale(.985)!important}
.mini-grid button{cursor:pointer;box-shadow:0 10px 24px rgba(10,105,220,.18)}

/* Sparkle dust emitted when a choice is deselected */
.sparkle-particle{
  position:fixed;
  z-index:9999;
  width:6px;height:6px;
  border-radius:50%;
  pointer-events:none;
  background:radial-gradient(circle,#fff 0 18%,#b7f7ff 25%,#51d6ff 58%,rgba(63,169,255,0) 72%);
  box-shadow:0 0 8px #9ff2ff,0 0 18px rgba(58,205,255,.85);
  animation:sparkleDust .78s cubic-bezier(.1,.7,.2,1) forwards;
}
.sparkle-particle.star{border-radius:2px;transform:rotate(45deg);background:linear-gradient(135deg,#fff,#9df0ff,#65bfff)}
@keyframes sparkleDust{
  0%{opacity:0;transform:translate(0,0) scale(.2) rotate(0)}
  18%{opacity:1}
  100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.15) rotate(var(--rot))}
}

/* Hero preview button is real and unobstructed */
.browser,.browser-body,.mini-grid{overflow:visible!important}
#miniAsk{position:relative;z-index:8}
.browser::after{pointer-events:none!important}

@media(max-width:650px){
  .code-lane{height:42px!important;opacity:.55!important}
  .code-track{font-size:11px!important}
}
@media (prefers-reduced-motion:reduce){
  .code-track,.choice::before,.choice::after,.config-block::before,.price-sticky::before,.card::before,.contact::before,.hero h1,.hero h1 span,.head h2,.contact-copy h2,.config-title h3,.choice strong,.price-panel .live-price strong,.step h3,.card h3{animation:none!important}
}


/* =========================================================
   V5 PERFORMANCE MODE — premium look with less GPU load
   ========================================================= */
.code-lanes{display:none!important}
#codeRain{opacity:.38!important;filter:none!important;will-change:auto!important}
.aurora{filter:blur(64px)!important;opacity:.72}

/* Static gradient typography: same premium look, no continuous repaint */
.hero h1,
.hero h1 span,
.head h2,
.contact-copy h2,
.config-title h3,
.choice strong,
.price-panel .live-price strong,
.step h3,
.card h3{
  background:linear-gradient(100deg,#075dd9 0%,#1aaeff 28%,#86eaff 52%,#5295ff 73%,#6e74ff 100%)!important;
  -webkit-background-clip:text!important;
  background-clip:text!important;
  -webkit-text-fill-color:transparent!important;
  color:transparent!important;
  animation:none!important;
  filter:none!important;
}

/* Step numbers glow too, but remain cheap */
.step>span,.config-title>span{
  color:#0b6fd4!important;
  background:linear-gradient(135deg,#edfbff,#c9efff 48%,#d9dcff)!important;
  border:1px solid rgba(74,181,255,.34)!important;
  box-shadow:0 0 0 1px rgba(255,255,255,.75) inset,0 8px 22px rgba(30,149,230,.14),0 0 18px rgba(65,205,255,.16)!important;
}

/* Color-mixed cards and choices without permanent gradient animation */
.choice,.step,.card,.config-block{
  border:1px solid transparent!important;
  background:
    linear-gradient(rgba(251,254,255,.93),rgba(246,252,255,.90)) padding-box,
    linear-gradient(120deg,rgba(68,207,255,.42),rgba(88,138,255,.30),rgba(157,125,255,.24),rgba(75,221,255,.38)) border-box!important;
  box-shadow:0 16px 44px rgba(22,102,171,.075)!important;
  backdrop-filter:blur(8px)!important;
}
.choice{overflow:hidden!important;transition:transform .22s cubic-bezier(.2,.8,.2,1),box-shadow .22s ease,filter .22s ease!important}
.choice:hover{transform:translateY(-5px)!important;box-shadow:0 20px 42px rgba(16,122,205,.14),0 0 22px rgba(81,210,255,.10)!important}
.choice.active{
  background:
    linear-gradient(145deg,rgba(239,251,255,.97),rgba(225,244,255,.95)) padding-box,
    linear-gradient(120deg,#2fd1ff,#578cff,#9c82ff,#48e1ff) border-box!important;
  box-shadow:0 17px 42px rgba(21,124,215,.16),0 0 22px rgba(68,211,255,.12)!important;
}

/* Shimmer only on hover/selected cards instead of every card all the time */
.choice::before,.choice::after,.config-block::before,.price-sticky::before,.card::before,.contact::before{animation:none!important}
.choice::before{
  content:""!important;position:absolute!important;inset:-30% auto -30% -45%!important;width:24%!important;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.78),rgba(123,228,255,.45),transparent)!important;
  transform:skewX(-18deg) translateX(-220%)!important;pointer-events:none!important;opacity:0!important;
}
.choice:hover::before,.choice.active:hover::before{opacity:.9!important;animation:v5ChoiceShine .85s ease-out 1!important}
@keyframes v5ChoiceShine{to{transform:skewX(-18deg) translateX(720%)}}

.price-sticky{
  background:linear-gradient(155deg,#061f3e,#0b4f92 58%,#0d6ea9)!important;
  box-shadow:0 25px 65px rgba(7,48,90,.20),0 0 28px rgba(58,201,255,.08)!important;
}

/* Keep the hero premium, but eliminate continuous floating/repaint work */
.floating,.orb{animation:none!important}
.browser{backdrop-filter:blur(8px)!important}
.orb{box-shadow:0 20px 48px rgba(0,118,225,.28),0 0 24px rgba(62,213,255,.16)!important}

/* A single subtle shine on important panels when hovered */
.step,.card,.config-block{transition:transform .22s ease,box-shadow .22s ease}
.step:hover,.card:hover{transform:translateY(-4px);box-shadow:0 20px 48px rgba(24,116,189,.12),0 0 18px rgba(72,210,255,.08)!important}

/* Fewer / smaller sparkle particles are enough visually */
.sparkle-particle{width:5px!important;height:5px!important;box-shadow:0 0 6px #9ff2ff,0 0 12px rgba(58,205,255,.55)!important}

/* Avoid expensive background filters on smaller / slower devices */
@media(max-width:900px){
  #codeRain{opacity:.28!important}
  .aurora{filter:blur(48px)!important;opacity:.55}
  .browser,.card,.config-block{backdrop-filter:none!important}
}
@media(prefers-reduced-motion:reduce){
  #codeRain{opacity:.18!important}
  .choice:hover,.step:hover,.card:hover{transform:none!important}
}


/* V6 — Codey is a real HTML/CSS mascot, not an image */
.codey-stage{
  position:relative;
  width:min(590px,100%);
  min-height:560px;
  display:grid;
  place-items:center;
  isolation:isolate;
}
.codey-halo{
  position:absolute;
  width:370px;height:370px;border-radius:50%;
  background:
    radial-gradient(circle at 50% 50%,rgba(106,234,255,.35),rgba(55,140,255,.16) 42%,rgba(139,101,255,.10) 62%,transparent 72%);
  filter:blur(14px);
  animation:codeyHalo 5.5s ease-in-out infinite;
  z-index:-2;
}
.codey-shadow{
  position:absolute;left:50%;bottom:56px;transform:translateX(-50%);
  width:310px;height:44px;border-radius:50%;
  background:radial-gradient(ellipse,rgba(22,108,199,.25),transparent 70%);
  filter:blur(10px);z-index:-1;
}
.codey{
  position:relative;
  width:370px;height:420px;
  animation:codeyFloat 4.8s ease-in-out infinite;
  transform-origin:50% 70%;
}
.codey-symbol{
  position:absolute;
  left:50%;top:55px;transform:translateX(-50%);
  width:330px;height:220px;
}
.code-piece{
  position:absolute;top:0;
  height:210px;
  display:flex;align-items:center;justify-content:center;
  font-family:Arial Black,Inter,sans-serif;
  font-weight:900;line-height:1;
  color:transparent;
  background:linear-gradient(135deg,#22d8ff 0%,#3e9cff 35%,#756eff 70%,#ec79ff 100%);
  background-size:220% 220%;
  -webkit-background-clip:text;background-clip:text;
  filter:
    drop-shadow(0 0 4px rgba(195,249,255,.95))
    drop-shadow(0 0 14px rgba(28,189,255,.58))
    drop-shadow(0 0 28px rgba(98,88,255,.34));
  -webkit-text-stroke:2px rgba(255,255,255,.42);
  animation:codeyGradient 5s linear infinite;
  user-select:none;
}
.code-left{left:6px;font-size:205px;transform:scaleX(.92)}
.code-slash{left:128px;top:-15px;font-size:228px;transform:rotate(6deg);z-index:3}
.code-right{right:4px;font-size:205px;transform:scaleX(.92)}
.eye{
  position:absolute;top:78px;width:42px;height:58px;border-radius:50%;
  background:radial-gradient(circle at 38% 28%,#fff 0 13%,#d8f5ff 14% 20%,#193d6b 21% 56%,#07172e 57%);
  box-shadow:inset 0 0 0 3px rgba(255,255,255,.55),0 0 11px rgba(120,226,255,.45);
  z-index:5;
  animation:blink 6.4s infinite;
  overflow:hidden;
}
.eye i{position:absolute;width:11px;height:15px;border-radius:50%;background:white;left:8px;top:8px;opacity:.9}
.eye-left{left:83px}.eye-right{right:77px}
.brow{position:absolute;top:63px;width:44px;height:10px;border-radius:20px;background:#0a2242;z-index:6;box-shadow:0 2px 0 rgba(255,255,255,.12)}
.brow-left{left:78px;transform:rotate(-7deg)}.brow-right{right:72px;transform:rotate(7deg)}
.mouth{
  position:absolute;left:50%;top:150px;transform:translateX(-50%);
  width:58px;height:28px;border-bottom:8px solid #071b35;border-radius:0 0 50px 50px;
  z-index:6;
}
.arm{
  position:absolute;top:240px;width:115px;height:22px;
  background:linear-gradient(180deg,#0b315f,#071d3c);
  border-radius:18px;
  box-shadow:0 0 14px rgba(36,168,255,.28);
  z-index:0;
}
.arm-left{left:28px;transform:rotate(-24deg);transform-origin:right center}
.arm-right{right:24px;transform:rotate(30deg);transform-origin:left center}
.hand{
  position:absolute;width:43px;height:43px;border-radius:50%;
  background:linear-gradient(145deg,#0d3c72,#061b38);
  box-shadow:inset 0 0 0 2px rgba(105,205,255,.18),0 0 14px rgba(43,169,255,.25);
}
.arm-left .hand{left:-23px;top:-10px}.arm-right .hand{right:-23px;top:-10px}
.thumb{display:grid;place-items:center;font-size:30px;background:none;box-shadow:none;filter:drop-shadow(0 0 7px rgba(59,195,255,.5))}
.leg{
  position:absolute;top:330px;width:25px;height:92px;
  background:linear-gradient(180deg,#0c315f,#061a37);
  border-radius:18px;
}
.leg-left{left:121px;transform:rotate(3deg)}.leg-right{right:121px;transform:rotate(-3deg)}
.shoe{
  position:absolute;bottom:-13px;width:86px;height:47px;border-radius:30px 34px 18px 18px;
  background:linear-gradient(160deg,#f7fbff 0 28%,#b8d7ee 29% 40%,#163b6b 41% 70%,#22d5ff 71% 78%,#08264a 79%);
  border:2px solid rgba(255,255,255,.78);
  box-shadow:0 0 10px rgba(71,210,255,.7),0 0 24px rgba(55,132,255,.38);
}
.leg-left .shoe{left:-47px;transform:rotate(-2deg)}.leg-right .shoe{right:-47px;transform:rotate(2deg)}

.codey-bubble{
  position:absolute;top:42px;right:-4px;
  width:205px;padding:13px 15px;border-radius:17px 17px 17px 5px;
  background:rgba(246,253,255,.88);border:1px solid rgba(51,161,255,.22);
  box-shadow:0 16px 36px rgba(27,96,164,.13);
  backdrop-filter:blur(12px);
  color:#163a60;
  transform:rotate(2deg);
}
.codey-bubble strong,.codey-bubble span{display:block}
.codey-bubble strong{
  font-size:13px;margin-bottom:5px;
  background:linear-gradient(90deg,#0a65dc,#2fd2ff,#7e68ff);
  -webkit-background-clip:text;background-clip:text;color:transparent;
}
.codey-bubble span{font-size:11px;line-height:1.45;color:#55728f}

.hero-code-card{
  position:absolute;right:-9px;bottom:55px;
  width:205px;padding:14px;border-radius:17px;
  background:linear-gradient(145deg,rgba(6,34,72,.94),rgba(9,70,130,.90));
  border:1px solid rgba(87,219,255,.34);
  box-shadow:0 18px 44px rgba(6,46,97,.24),0 0 22px rgba(63,190,255,.18);
  color:#c8f7ff;
  transform:rotate(-2deg);
}
.code-dots{display:flex;gap:5px;margin-bottom:10px}
.code-dots i{width:7px;height:7px;border-radius:50%;background:#5cdcff}
.code-dots i:nth-child(2){background:#7b86ff}.code-dots i:nth-child(3){background:#e47fff}
.hero-code-card code{font:10px/1.6 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.hero-code-card code span{color:#66e7ff}.hero-code-card code b{color:#dc9dff;font-weight:600}
.hero-code-card a{
  margin-top:12px;display:flex;justify-content:center;align-items:center;
  min-height:38px;border-radius:10px;
  background:linear-gradient(100deg,#1faaff,#55e7ff,#9a77ff);
  background-size:200% 100%;
  color:#fff;font-size:12px;font-weight:800;
  box-shadow:0 0 20px rgba(61,201,255,.35);
  animation:codeyGradient 4s linear infinite;
}

.config-hint{
  margin:16px auto 0;
  width:max-content;max-width:100%;
  padding:10px 14px;border-radius:999px;
  background:rgba(255,255,255,.72);
  border:1px solid rgba(12,117,223,.12);
  color:#587087;font-size:12px;
  box-shadow:0 8px 24px rgba(22,91,155,.07);
}
.config-hint span{color:#0b6fd0;font-weight:800}
.config-hint strong{
  background:linear-gradient(90deg,#0874e8,#22cfff,#8c72ff);
  -webkit-background-clip:text;background-clip:text;color:transparent;
}

/* Harmonized gradient labels */
.choice strong,.config-title h3,.step h3,.price-sticky h3,.summary-title,.card h3{
  background:linear-gradient(90deg,#0768df 0%,#20cfff 45%,#8270ff 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
}
.choice.active strong{
  filter:drop-shadow(0 0 6px rgba(42,194,255,.28));
}

@keyframes codeyFloat{
  0%,100%{transform:translateY(0) rotate(-1deg)}
  50%{transform:translateY(-10px) rotate(1deg)}
}
@keyframes codeyHalo{
  0%,100%{transform:scale(.94);opacity:.72}
  50%{transform:scale(1.05);opacity:1}
}
@keyframes codeyGradient{
  to{background-position:200% 100%}
}
@keyframes blink{
  0%,46%,49%,100%{transform:scaleY(1)}
  47%,48%{transform:scaleY(.08)}
}

@media(max-width:900px){
  .codey-stage{min-height:520px}
  .codey-bubble{right:3%}
  .hero-code-card{right:4%}
}
@media(max-width:600px){
  .codey-stage{min-height:445px;transform:scale(.86);transform-origin:top center;margin-bottom:-55px}
  .codey-bubble{top:20px;right:0;width:180px}
  .hero-code-card{display:none}
}
@media(prefers-reduced-motion:reduce){
  .codey,.codey-halo,.code-piece,.hero-code-card a,.eye{animation:none!important}
}

.codey-react{animation:codeyReact .42s cubic-bezier(.2,.9,.3,1)!important}
@keyframes codeyReact{
  0%{transform:translateY(0) scale(1)}
  45%{transform:translateY(-14px) scale(1.035) rotate(1deg)}
  100%{transform:translateY(0) scale(1)}
}


/* V7 polish — darker body copy */
.hero-copy>p,
.head>p,
.card>p,
.step>p,
.config-title p,
.choice span,
.counter-row small,
.contact-copy>p{
  color:#10283e !important;
}

/* slightly stronger section text contrast */
.hero-copy>p,.head>p{font-weight:500}

/* Code background visibility */
#codeRain{
  opacity:.46 !important;
  mix-blend-mode:multiply;
}

/* Codey: no emoji, real CSS hand */
.hand-thumbs{
  width:48px;height:48px;
  background:linear-gradient(145deg,#0f437c,#061b38);
  border:2px solid rgba(71,205,255,.28);
  box-shadow:
    inset 0 0 10px rgba(56,166,255,.12),
    0 0 11px rgba(42,180,255,.30),
    0 0 22px rgba(118,104,255,.14);
}
.hand-thumbs .finger{
  position:absolute;
  left:8px;
  width:27px;height:8px;
  border-radius:8px;
  background:linear-gradient(90deg,#154c84,#082a52);
  border:1px solid rgba(106,218,255,.18);
  transform-origin:left center;
}
.hand-thumbs .f1{top:11px;transform:rotate(5deg)}
.hand-thumbs .f2{top:20px;transform:rotate(0deg)}
.hand-thumbs .f3{top:29px;transform:rotate(-6deg)}
.hand-thumbs .thumb-up{
  position:absolute;
  left:7px;top:-26px;
  width:14px;height:36px;
  border-radius:9px 9px 5px 5px;
  background:linear-gradient(180deg,#18588f,#08284d);
  border:1px solid rgba(120,228,255,.28);
  transform:rotate(-8deg);
  box-shadow:0 0 10px rgba(56,190,255,.20);
}
.hand-thumbs .thumb-up:after{
  content:"";
  position:absolute;left:-2px;top:-3px;
  width:17px;height:14px;border-radius:55% 55% 42% 42%;
  background:linear-gradient(180deg,#1d649d,#0a2e57);
}

/* Better feet: compact futuristic boots rather than cartoon sneakers */
.leg{top:328px;height:88px;width:24px}
.shoe{
  bottom:-11px;
  width:72px;height:40px;
  border-radius:24px 30px 16px 18px;
  background:
    linear-gradient(180deg,rgba(255,255,255,.92) 0 15%,transparent 16%),
    linear-gradient(145deg,#173f73 0 42%,#0a274d 43% 63%,#22d8ff 64% 70%,#e6fbff 71% 80%,#16345f 81%);
  border:1.5px solid rgba(230,250,255,.9);
  box-shadow:
    inset 0 0 12px rgba(63,180,255,.16),
    0 0 9px rgba(67,211,255,.62),
    0 0 20px rgba(88,109,255,.25);
}
.shoe:before{
  content:"";
  position:absolute;left:17px;right:10px;top:9px;height:3px;border-radius:6px;
  background:linear-gradient(90deg,#58e6ff,#8e8cff);
  box-shadow:0 6px 0 rgba(180,236,255,.75);
}
.shoe:after{
  content:"";
  position:absolute;left:10px;right:7px;bottom:4px;height:4px;border-radius:8px;
  background:linear-gradient(90deg,#12cfff,#6e88ff,#25dfff);
  box-shadow:0 0 8px rgba(45,211,255,.55);
}
.leg-left .shoe{left:-38px;transform:rotate(-2deg)}
.leg-right .shoe{right:-38px;transform:rotate(2deg)}

/* Mini Codey face for chat button + chat header */
.chat-toggle{
  display:grid;place-items:center;
  overflow:visible;
}
.mini-codey-face{
  position:relative;
  display:block;
  width:48px;height:48px;
  border-radius:50%;
  background:
    radial-gradient(circle at 36% 24%,rgba(255,255,255,.9),rgba(255,255,255,.08) 17%,transparent 18%),
    linear-gradient(145deg,#0b2f5c,#071b37);
  box-shadow:
    inset 0 0 0 1px rgba(125,225,255,.28),
    inset 0 0 18px rgba(37,159,255,.22),
    0 0 14px rgba(67,205,255,.42);
}
.chat-toggle .mini-codey-face{width:49px;height:49px}
.avatar{
  background:linear-gradient(145deg,#e8fbff,#d4f0ff) !important;
  padding:3px;
}
.mini-codey-face-head{width:36px;height:36px}
.mini-bracket,.mini-slash{
  position:absolute;
  top:8px;
  font-style:normal;
  font-family:Arial Black,Inter,sans-serif;
  font-weight:900;
  line-height:1;
  color:transparent;
  background:linear-gradient(135deg,#30d7ff,#398dff,#a36dff);
  -webkit-background-clip:text;background-clip:text;
  filter:drop-shadow(0 0 3px rgba(81,214,255,.4));
}
.mini-bracket{font-size:24px}
.mini-left{left:5px}.mini-right{right:5px}.mini-slash{left:20px;top:6px;font-size:29px;transform:rotate(5deg)}
.mini-eye{
  position:absolute;top:18px;width:6px;height:8px;border-radius:50%;
  background:#eafcff;
  box-shadow:inset 0 -3px 0 #0b254a;
  z-index:3;
}
.mini-eye-l{left:14px}.mini-eye-r{right:14px}
.mini-mouth{
  position:absolute;left:50%;top:29px;transform:translateX(-50%);
  width:12px;height:6px;border-bottom:2px solid #d8f8ff;border-radius:0 0 10px 10px;
  z-index:4;
}
.mini-codey-face-head .mini-bracket{font-size:19px;top:6px}
.mini-codey-face-head .mini-left{left:4px}.mini-codey-face-head .mini-right{right:4px}
.mini-codey-face-head .mini-slash{left:15px;top:4px;font-size:23px}
.mini-codey-face-head .mini-eye{top:13px;width:5px;height:7px}
.mini-codey-face-head .mini-eye-l{left:10px}.mini-codey-face-head .mini-eye-r{right:10px}
.mini-codey-face-head .mini-mouth{top:22px;width:10px;height:5px}

/* Typing color pulse */
input,textarea{color:#10283e;transition:color .2s ease,text-shadow .2s ease,box-shadow .2s ease}
.typing-shimmer{
  animation:typingColorSweep .72s ease both;
}
@keyframes typingColorSweep{
  0%{color:#10283e;text-shadow:none}
  24%{color:#0a73e9;text-shadow:0 0 7px rgba(45,159,255,.22)}
  48%{color:#22bde9;text-shadow:0 0 8px rgba(62,218,255,.28)}
  68%{color:#766df0;text-shadow:0 0 8px rgba(123,104,255,.22)}
  100%{color:#10283e;text-shadow:none}
}

/* Harmonize important labels with the same cyan-blue-violet mix */
.steps4 .step h3,
.choice strong,
.config-title h3,
.price-sticky .eyebrow,
.contact-copy>span{
  background:linear-gradient(90deg,#0877e8 0%,#2ed9ff 46%,#8575ff 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent !important;
  filter:drop-shadow(0 0 5px rgba(58,187,255,.10));
}

@media(max-width:600px){
  #codeRain{opacity:.34 !important}
}


/* =========================================================
   V8 — Codey refinement + balanced neon background
   ========================================================= */

/* More visible code, still restrained for performance */
#codeRain{
  opacity:.56 !important;
  mix-blend-mode:multiply;
}

/* ---------- Codey 3D hands ---------- */
.hand3d{
  position:absolute;
  width:64px;height:66px;
  filter:drop-shadow(0 8px 7px rgba(6,37,77,.18))
         drop-shadow(0 0 8px rgba(47,190,255,.35));
  transform-style:preserve-3d;
}
.arm-left .hand3d{left:-43px;top:-27px}
.arm-right .hand3d{right:-43px;top:-25px}

.hand3d .palm{
  position:absolute;
  left:15px;top:21px;
  width:42px;height:38px;
  border-radius:18px 20px 17px 18px;
  background:
    radial-gradient(circle at 32% 22%,rgba(105,226,255,.34),transparent 24%),
    linear-gradient(145deg,#205d9b 0%,#0d3e77 42%,#061f43 100%);
  border:1px solid rgba(128,226,255,.35);
  box-shadow:
    inset 6px 7px 12px rgba(73,190,255,.16),
    inset -8px -9px 14px rgba(1,17,39,.34),
    0 0 10px rgba(41,183,255,.30);
  transform:perspective(80px) rotateX(8deg) rotateY(-8deg);
}
.hand3d .digit{
  position:absolute;
  width:28px;height:10px;
  border-radius:9px;
  background:
    linear-gradient(180deg,#2a6cac 0%,#0d437e 48%,#06264e 100%);
  border:1px solid rgba(127,226,255,.25);
  box-shadow:inset 0 2px 4px rgba(137,233,255,.15),0 2px 5px rgba(0,20,45,.22);
}
.hand3d .d1{left:3px;top:28px;transform:rotate(13deg)}
.hand3d .d2{left:2px;top:38px;transform:rotate(7deg)}
.hand3d .d3{left:5px;top:48px;transform:rotate(0deg)}
.hand3d .d4{left:11px;top:56px;width:23px;transform:rotate(-7deg)}
.hand3d .hand-glint{
  position:absolute;left:26px;top:26px;width:16px;height:7px;border-radius:50%;
  background:linear-gradient(90deg,rgba(188,248,255,.68),rgba(81,206,255,.08));
  filter:blur(.3px);
  transform:rotate(-18deg);
}

/* large 3D blue thumbs-up, fully CSS-built */
.hand3d-like{
  width:74px;height:92px;
  transform:rotate(-8deg);
  animation:thumbIdle 3.8s ease-in-out infinite;
}
.hand3d-like .palm{left:18px;top:43px;width:45px;height:41px}
.hand3d-like .digit{width:30px;height:10px}
.hand3d-like .d1{left:1px;top:50px}
.hand3d-like .d2{left:0;top:60px}
.hand3d-like .d3{left:3px;top:70px}
.hand3d-like .d4{left:10px;top:79px;width:25px}
.hand3d-like .big-thumb{
  position:absolute;
  left:23px;top:0;
  width:21px;height:54px;
  border-radius:13px 13px 8px 8px;
  background:
    radial-gradient(circle at 38% 15%,rgba(129,236,255,.30),transparent 23%),
    linear-gradient(155deg,#2d76b9 0%,#10508d 48%,#062a55 100%);
  border:1px solid rgba(135,231,255,.38);
  box-shadow:
    inset 4px 5px 8px rgba(117,229,255,.18),
    inset -5px -7px 10px rgba(0,21,48,.28),
    0 0 12px rgba(48,193,255,.34);
  transform:rotate(-8deg);
}
.hand3d-like .big-thumb:before{
  content:"";
  position:absolute;left:-1px;top:-5px;
  width:22px;height:18px;border-radius:55% 55% 45% 45%;
  background:linear-gradient(155deg,#3b83c4,#0b417a);
  border:1px solid rgba(164,240,255,.30);
}
@keyframes thumbIdle{
  0%,100%{transform:rotate(-8deg) translateY(0)}
  50%{transform:rotate(-5deg) translateY(-3px)}
}

/* right resting hand: slight inward curl */
.hand3d-rest{transform:rotate(12deg)}
.hand3d-rest .d1{transform:rotate(20deg)}
.hand3d-rest .d2{transform:rotate(12deg)}
.hand3d-rest .d3{transform:rotate(4deg)}
.hand3d-rest .d4{transform:rotate(-6deg)}

/* ---------- Codey black/blue 3D shoes ---------- */
.shoe3d{
  position:absolute;
  bottom:-18px;
  width:92px;height:55px;
  transform-style:preserve-3d;
  filter:drop-shadow(0 9px 8px rgba(3,31,70,.22));
}
.leg-left .shoe3d{left:-49px;transform:rotate(-3deg)}
.leg-right .shoe3d{right:-49px;transform:rotate(3deg)}
.shoe3d .shoe-upper{
  position:absolute;left:7px;right:5px;top:6px;height:39px;
  border-radius:30px 37px 15px 16px;
  background:
    radial-gradient(circle at 27% 18%,rgba(80,195,255,.22),transparent 24%),
    linear-gradient(145deg,#17283f 0%,#0b172a 47%,#07101e 100%);
  border:1px solid rgba(93,203,255,.28);
  box-shadow:
    inset 5px 5px 10px rgba(65,166,235,.10),
    inset -8px -8px 12px rgba(0,0,0,.28),
    0 0 10px rgba(47,187,255,.20);
}
.shoe3d .shoe-toe{
  position:absolute;right:4px;top:18px;width:39px;height:25px;border-radius:50% 58% 35% 40%;
  background:linear-gradient(145deg,#1c3048,#07101e);
  box-shadow:inset 6px 5px 10px rgba(105,214,255,.08);
}
.shoe3d .shoe-laces{
  position:absolute;left:29px;top:15px;width:30px;height:4px;border-radius:6px;
  background:#39dfff;
  box-shadow:0 7px 0 #657fff,0 14px 0 #35c8ff,0 0 7px rgba(48,209,255,.48);
  transform:rotate(-5deg);
}
.shoe3d .shoe-sole{
  position:absolute;left:2px;right:0;bottom:3px;height:12px;border-radius:6px 8px 13px 14px;
  background:linear-gradient(180deg,#e8fbff 0 30%,#83c8e7 31% 48%,#1d5d92 49% 63%,#081b32 64%);
  box-shadow:0 3px 0 rgba(6,18,34,.45),0 0 10px rgba(53,203,255,.34);
}
.shoe3d .shoe-glow{
  position:absolute;left:15px;right:7px;bottom:0;height:4px;border-radius:8px;
  background:linear-gradient(90deg,#1de6ff,#348aff,#9270ff,#25dbff);
  box-shadow:0 0 8px rgba(38,216,255,.70),0 0 14px rgba(90,110,255,.35);
}

/* ---------- Chat Codey face: white circle, closer to top mascot ---------- */
.chat-toggle{
  background:linear-gradient(135deg,#1caeff,#7b7dff) !important;
  padding:5px;
}
.mini-codey-face{
  width:50px;height:50px;
  border-radius:50%;
  background:#fff !important;
  box-shadow:
    inset 0 0 0 1px rgba(32,153,229,.14),
    0 0 0 2px rgba(255,255,255,.85),
    0 0 16px rgba(55,190,255,.40) !important;
}
.chat-toggle .mini-codey-face{width:50px;height:50px}
.mini-bracket,.mini-slash{
  background:linear-gradient(135deg,#21cfff 0%,#368eff 48%,#936fff 100%) !important;
  -webkit-background-clip:text !important;
  background-clip:text !important;
}
.mini-bracket{font-size:24px !important;top:9px !important}
.mini-left{left:4px !important}
.mini-right{right:4px !important}
.mini-slash{left:20px !important;top:5px !important;font-size:31px !important}
.mini-eye{
  top:18px !important;
  width:7px !important;height:10px !important;
  background:radial-gradient(circle at 38% 27%,#fff 0 22%,#1f4776 23% 58%,#07192f 59%) !important;
  box-shadow:0 0 0 1px rgba(26,70,110,.10) !important;
}
.mini-eye-l{left:11px !important}
.mini-eye-r{right:11px !important}
.mini-mouth{
  top:34px !important;
  width:15px !important;height:7px !important;
  border-bottom:3px solid #173451 !important;
  border-radius:0 0 14px 14px !important;
}

/* chat-header avatar follows same face design */
.avatar{
  background:#fff !important;
  border:1px solid rgba(26,152,230,.14);
  box-shadow:0 4px 12px rgba(22,100,165,.10);
}
.mini-codey-face-head{
  width:36px !important;height:36px !important;
  background:#fff !important;
}
.mini-codey-face-head .mini-bracket{font-size:18px !important;top:6px !important}
.mini-codey-face-head .mini-left{left:3px !important}
.mini-codey-face-head .mini-right{right:3px !important}
.mini-codey-face-head .mini-slash{left:14px !important;top:3px !important;font-size:24px !important}
.mini-codey-face-head .mini-eye{top:13px !important;width:5px !important;height:8px !important}
.mini-codey-face-head .mini-eye-l{left:8px !important}
.mini-codey-face-head .mini-eye-r{right:8px !important}
.mini-codey-face-head .mini-mouth{top:25px !important;width:11px !important;height:5px !important;border-bottom-width:2px !important}

/* ---------- Input text sweep like the brand gradient ---------- */
input:not([readonly]), textarea:not([readonly]){
  color:#10283e;
  -webkit-text-fill-color:#10283e;
  transition:box-shadow .22s ease, background-color .22s ease;
}
.typing-shimmer-v8{
  color:transparent !important;
  -webkit-text-fill-color:transparent !important;
  background-image:linear-gradient(90deg,#0878e8 0%,#29d9ff 30%,#8a75ff 62%,#24cfff 82%,#0b69de 100%) !important;
  background-size:240% 100% !important;
  -webkit-background-clip:text !important;
  background-clip:text !important;
  animation:typingSweepV8 .9s ease both !important;
  text-shadow:0 0 10px rgba(42,193,255,.12);
}
@keyframes typingSweepV8{
  0%{background-position:0% 50%;filter:brightness(1)}
  48%{background-position:100% 50%;filter:brightness(1.12)}
  100%{background-position:0% 50%;filter:brightness(1)}
}

@media(max-width:600px){
  #codeRain{opacity:.43 !important}
}
@media(prefers-reduced-motion:reduce){
  .hand3d-like,.typing-shimmer-v8{animation:none!important}
}


/* =========================================================
   V9 — typing fix + Codey clean-up
   ========================================================= */

/* Codey: arms only, no hands */
.arm .hand3d,
.arm .hand,
.hand3d,
.hand3d-like,
.hand3d-rest{
  display:none !important;
}

/* Slightly cleaner arm ends */
.arm{
  overflow:visible;
}
.arm:after{
  content:"";
  position:absolute;
  width:24px;height:24px;
  border-radius:50%;
  top:-1px;
  background:linear-gradient(145deg,#0c3a70,#061b37);
  box-shadow:
    inset 0 0 0 1px rgba(91,205,255,.18),
    0 0 10px rgba(48,180,255,.18);
}
.arm-left:after{left:-8px}
.arm-right:after{right:-8px}

/* Chat Codey face: brackets farther apart so they don't overlap the eyes */
.chat-toggle .mini-left{left:1px !important}
.chat-toggle .mini-right{right:1px !important}
.chat-toggle .mini-slash{left:20px !important}
.chat-toggle .mini-eye-l{left:13px !important}
.chat-toggle .mini-eye-r{right:13px !important}

/* Same proportions in chat header avatar */
.mini-codey-face-head .mini-left{left:0px !important}
.mini-codey-face-head .mini-right{right:0px !important}
.mini-codey-face-head .mini-eye-l{left:10px !important}
.mini-codey-face-head .mini-eye-r{right:10px !important}

/* Typing: keep the input box 100% stable.
   Only the text itself gets a short glow. */
input:not([readonly]),
textarea:not([readonly]){
  background-color:#fff !important;
  background-image:none !important;
  -webkit-background-clip:border-box !important;
  background-clip:border-box !important;
  color:#10283e !important;
  -webkit-text-fill-color:#10283e !important;
  text-shadow:none;
  opacity:1 !important;
  filter:none !important;
}

input.char-glow,
textarea.char-glow{
  animation:charGlowV9 .65s ease-out both !important;
}

@keyframes charGlowV9{
  0%{
    color:#1da7ff !important;
    -webkit-text-fill-color:#1da7ff !important;
    text-shadow:
      0 0 5px rgba(57,211,255,.62),
      0 0 10px rgba(92,117,255,.24);
  }
  45%{
    color:#6b7dff !important;
    -webkit-text-fill-color:#6b7dff !important;
    text-shadow:
      0 0 5px rgba(89,194,255,.40),
      0 0 8px rgba(125,105,255,.20);
  }
  100%{
    color:#10283e !important;
    -webkit-text-fill-color:#10283e !important;
    text-shadow:none;
  }
}


/* =========================================================
   V10 — clearer hero, trust, references, FAQ, no chatbot
   ========================================================= */

/* Hero: wider headline, fewer forced line breaks */
.hero{
  grid-template-columns:1.08fr .92fr;
  gap:52px;
}
.hero-copy{
  max-width:760px;
}
.hero h1{
  max-width:780px;
  font-size:clamp(54px,6.4vw,88px);
  line-height:.98;
  text-wrap:balance;
}
.hero-copy>p{
  max-width:720px;
}
.hero-support{
  margin-top:10px !important;
  font-size:16px !important;
  line-height:1.65 !important;
  color:#25445e !important;
}

/* Trust strip */
.trust-strip{
  margin-top:-30px;
  margin-bottom:28px;
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:10px;
  padding:12px;
  border-radius:22px;
  background:rgba(255,255,255,.70);
  border:1px solid rgba(16,107,201,.10);
  box-shadow:0 18px 50px rgba(20,88,155,.08);
  backdrop-filter:blur(14px);
}
.trust-item{
  display:flex;gap:11px;align-items:flex-start;
  padding:15px 14px;border-radius:16px;
  transition:.25s ease;
}
.trust-item:hover{
  transform:translateY(-3px);
  background:rgba(230,248,255,.72);
}
.trust-item>b{
  width:27px;height:27px;min-width:27px;border-radius:9px;
  display:grid;place-items:center;
  color:white;background:linear-gradient(135deg,#0d77e8,#30d4ff);
  box-shadow:0 0 12px rgba(45,193,255,.25);
}
.trust-item span{display:flex;flex-direction:column;gap:3px}
.trust-item strong{font-size:13px;color:#0d2943}
.trust-item small{font-size:11px;line-height:1.4;color:#536d84}

/* Reference examples */
.reference-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:18px;
}
.reference-card{
  border-radius:24px;
  background:rgba(255,255,255,.78);
  border:1px solid rgba(11,104,203,.10);
  box-shadow:0 22px 62px rgba(30,97,158,.09);
  overflow:hidden;
  transition:.28s ease;
}
.reference-card:hover{
  transform:translateY(-7px);
  box-shadow:0 30px 80px rgba(26,105,177,.15);
}
.ref-browser{padding:12px}
.ref-top{
  height:34px;display:flex;align-items:center;gap:5px;
  padding:0 10px;background:#f2f7fb;border-radius:12px 12px 0 0;
  position:relative;
}
.ref-top i{width:6px;height:6px;border-radius:50%;background:#b2c2cf}
.ref-top span{position:absolute;left:50%;transform:translateX(-50%);font-size:9px;color:#7a8fa2}
.ref-body{
  min-height:250px;border-radius:0 0 15px 15px;position:relative;overflow:hidden;padding:22px;
}
.ref-body.craft{background:linear-gradient(145deg,#f7fbff,#e2f3ff)}
.ref-body.studio{background:linear-gradient(145deg,#071b36,#0d4c85);color:white}
.ref-body.company{background:linear-gradient(145deg,#eefaff,#f8fbff)}
.ref-nav{width:82px;height:9px;border-radius:8px;background:linear-gradient(90deg,#0b6eda,#2fcfff);margin-bottom:36px}
.ref-copy{position:relative;z-index:2;max-width:70%}
.ref-copy small{font-size:8px;font-weight:900;letter-spacing:.12em;color:#0a70d0}
.studio .ref-copy small{color:#65dfff}
.ref-copy h3{font-size:25px;line-height:1.05;letter-spacing:-.04em;margin:9px 0 14px}
.ref-copy p{height:6px;border-radius:7px;background:rgba(70,109,137,.22);margin:7px 0}
.studio .ref-copy p{background:rgba(255,255,255,.22)}
.ref-copy p.short{width:68%}
.ref-copy button{border:0;border-radius:8px;padding:9px 12px;margin-top:10px;color:white;background:linear-gradient(135deg,#0b6fdc,#28c9ff);font-size:10px;font-weight:800}
.ref-shape{
  position:absolute;right:-28px;bottom:-22px;width:170px;height:170px;border-radius:48% 52% 44% 56%;
  background:linear-gradient(145deg,#25d6ff,#146ddd 55%,#7c71ff);
  box-shadow:0 15px 45px rgba(31,118,215,.25);
  transform:rotate(18deg);
}
.studio .ref-shape{background:linear-gradient(145deg,#21dfff,#5b6dff 58%,#dd70ff)}
.company .ref-shape{background:linear-gradient(145deg,#6ae6ff,#2f95ed 50%,#a4c8ff)}
.ref-meta{padding:4px 18px 20px;display:flex;flex-direction:column;gap:4px}
.ref-meta strong{
  font-size:15px;
  background:linear-gradient(90deg,#0872e5,#2dd2ff,#7b71ff);
  -webkit-background-clip:text;background-clip:text;color:transparent;
}
.ref-meta span{font-size:11px;color:#60788e}
.reference-note{text-align:center;margin:20px 0 0;color:#6c8397;font-size:11px}

/* Why us */
.reassurance .head{max-width:850px}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.benefit{
  padding:24px;border-radius:21px;
  background:rgba(255,255,255,.76);
  border:1px solid rgba(10,100,194,.09);
  box-shadow:0 18px 55px rgba(30,98,158,.07);
  transition:.25s ease;
}
.benefit:hover{transform:translateY(-5px)}
.benefit>span{
  display:inline-flex;margin-bottom:18px;
  font-weight:900;font-size:12px;
  color:#0c75df;background:#e4f5ff;padding:7px 10px;border-radius:10px;
}
.benefit h3{
  margin:0 0 9px;
  background:linear-gradient(90deg,#096ee0,#28d2ff,#8172ff);
  -webkit-background-clip:text;background-clip:text;color:transparent;
}
.benefit p{margin:0;color:#173149;line-height:1.65;font-size:13px}

/* What we need */
.handover-card{
  display:grid;grid-template-columns:1.15fr .85fr;gap:44px;
  padding:42px;border-radius:29px;
  background:linear-gradient(140deg,rgba(245,252,255,.92),rgba(220,244,255,.88));
  border:1px solid rgba(11,103,197,.11);
  box-shadow:0 28px 85px rgba(23,90,154,.11);
}
.handover-copy>span,.ownership-card>div>span{
  font-size:11px;letter-spacing:.14em;font-weight:900;color:#0873dd;
}
.handover-copy h2,.ownership-card h2{
  font-size:clamp(34px,4.5vw,52px);line-height:1.05;letter-spacing:-.04em;margin:12px 0 16px;
  background:linear-gradient(90deg,#086edf,#2bd0ff,#7c75ff);
  -webkit-background-clip:text;background-clip:text;color:transparent;
}
.handover-copy>p,.ownership-card p{color:#19344c;line-height:1.7}
.handover-copy ul{list-style:none;padding:0;margin:26px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.handover-copy li{
  display:flex;flex-direction:column;gap:2px;padding:13px 14px;border-radius:14px;
  background:rgba(255,255,255,.72);border:1px solid rgba(13,105,198,.08);
}
.handover-copy li b{font-size:13px;color:#123653}
.handover-copy li span{font-size:11px;color:#668096}
.handover-side{
  align-self:stretch;border-radius:24px;padding:24px;
  background:linear-gradient(145deg,#071f3d,#0b569b);
  color:white;box-shadow:0 22px 55px rgba(8,55,105,.18);
}
.handover-badge{
  display:inline-block;padding:8px 10px;border-radius:10px;
  background:rgba(69,216,255,.12);border:1px solid rgba(89,224,255,.16);
  color:#8feaff;font-size:11px;font-weight:800;
}
.handover-list{display:grid;gap:12px;margin-top:24px}
.handover-list div{display:flex;gap:10px;align-items:center;padding:12px;border-radius:13px;background:rgba(255,255,255,.07)}
.handover-list i{font-style:normal;width:25px;height:25px;border-radius:8px;display:grid;place-items:center;background:linear-gradient(135deg,#17a9ff,#34e0ff)}
.handover-list span{font-size:13px}

/* Ownership */
.ownership-card{
  display:grid;grid-template-columns:1.2fr .8fr;gap:40px;align-items:center;
  padding:36px 40px;border-radius:27px;
  background:rgba(255,255,255,.80);
  border:1px solid rgba(11,103,197,.10);
  box-shadow:0 22px 70px rgba(29,97,157,.09);
}
.ownership-points{display:grid;gap:10px}
.ownership-points div{
  display:flex;justify-content:space-between;gap:14px;align-items:center;
  padding:15px;border-radius:14px;background:#eef9ff;border:1px solid rgba(11,103,197,.08);
}
.ownership-points b{font-size:13px;color:#0c6fd3}
.ownership-points span{font-size:11px;color:#667f94;text-align:right}

/* FAQ */
.faq-section .head{margin-bottom:28px}
.faq-list{max-width:900px;margin:auto;display:grid;gap:10px}
.faq-item{
  border-radius:16px;background:rgba(255,255,255,.82);
  border:1px solid rgba(11,103,197,.10);
  box-shadow:0 12px 35px rgba(27,94,153,.06);
  overflow:hidden;
}
.faq-item summary{
  cursor:pointer;list-style:none;padding:18px 20px;font-weight:800;color:#123553;
  position:relative;
}
.faq-item summary::-webkit-details-marker{display:none}
.faq-item summary:after{
  content:"+";
  position:absolute;right:19px;top:50%;transform:translateY(-50%);
  width:26px;height:26px;border-radius:8px;display:grid;place-items:center;
  color:#0875df;background:#e7f6ff;
}
.faq-item[open] summary:after{content:"−"}
.faq-item p{margin:0;padding:0 20px 20px;color:#35516a;line-height:1.7;font-size:13px}

/* Contact: more reassuring */
.contact-copy p{max-width:560px}
.contact:before{
  content:"Deine Anfrage ist unverbindlich. Wir besprechen Details, bevor ein Auftrag entsteht.";
  position:absolute;left:45px;bottom:25px;
  max-width:430px;color:#9fc9e7;font-size:11px;
}
.contact{position:relative;padding-bottom:64px}

/* Footer */
.footer-links{display:flex;gap:16px;flex-wrap:wrap}
.footer-links a{color:#637b90;text-decoration:none;font-size:11px}
.footer-links a:hover{color:#0874dd}

/* chatbot removed */
.chat-toggle,.chat-panel{display:none!important}

@media(max-width:1000px){
  .trust-strip{grid-template-columns:1fr 1fr}
  .reference-grid{grid-template-columns:1fr 1fr}
  .grid4{grid-template-columns:1fr 1fr}
}
@media(max-width:900px){
  .hero{grid-template-columns:1fr}
  .hero-copy{max-width:none}
  .hero h1{max-width:850px}
  .handover-card,.ownership-card{grid-template-columns:1fr}
}
@media(max-width:650px){
  .trust-strip,.reference-grid,.grid4{grid-template-columns:1fr}
  .handover-card,.ownership-card{padding:25px 19px}
  .handover-copy ul{grid-template-columns:1fr}
  .contact:before{position:static;display:block;margin:16px 0 0}
  .contact{padding-bottom:28px}
}


/* =========================================================
   V11 — cleaner hero + fixed typing effect
   ========================================================= */

/* Grey code window in the hero is intentionally removed. */
.hero-code-card{
  display:none !important;
}

/* Center the mascot a bit better now that the extra grey card is gone. */
.hero-visual{
  min-height:520px;
}
.codey-stage{
  min-height:520px;
}
.codey{
  left:50%;
  transform:translateX(-50%);
}
.codey-bubble{
  right:4%;
  top:7%;
  max-width:230px;
}

/* Keep contact section visually clean */
.contact{
  overflow:hidden;
  isolation:isolate;
}
.contact > *{
  position:relative;
  z-index:2;
}
.contact::after{
  content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  background:linear-gradient(135deg,rgba(6,31,63,.96),rgba(10,79,146,.94));
  z-index:1;
}
.contact::before{
  z-index:2;
}

/* Stable fields: no full field flashing */
input.char-glow,
textarea.char-glow{
  animation:none !important;
}

/* Wrapper around inputs for single-character pop */
.input-wrap{
  position:relative;
  width:100%;
  display:block;
}
.input-wrap > input,
.input-wrap > textarea{
  position:relative;
  z-index:1;
}

/* The tiny colorful typed-letter effect */
.char-pop{
  position:absolute;
  z-index:3;
  pointer-events:none;
  transform:translateY(-50%);
  font-weight:800;
  font-size:1em;
  line-height:1;
  background:linear-gradient(90deg,#13c1ff,#69d9ff,#7e81ff,#45e2ff);
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
  text-shadow:
    0 0 8px rgba(68,211,255,.35),
    0 0 14px rgba(116,120,255,.18);
  animation:charPopV11 1s ease forwards;
}

@keyframes charPopV11{
  0%{
    opacity:0;
    transform:translateY(-58%) scale(.7);
    filter:blur(1px);
  }
  12%{
    opacity:1;
    transform:translateY(-50%) scale(1.18);
    filter:blur(0);
  }
  55%{
    opacity:1;
    transform:translateY(-50%) scale(1);
  }
  100%{
    opacity:0;
    transform:translateY(-42%) scale(.92);
  }
}

.brand-stack{display:flex;flex-direction:column;line-height:1}.brand-stack b{font-size:14px;letter-spacing:.07em}.brand-stack small{font-size:8px;color:#668197;margin-top:3px;letter-spacing:.06em}
.legal-status{padding:13px 14px;border-radius:13px;background:rgba(100,207,255,.10);border:1px solid rgba(100,207,255,.18);display:flex;flex-direction:column;gap:4px}
.legal-status b{font-size:12px;color:#8ee8ff}.legal-status span{font-size:10px;line-height:1.5;color:#c4ddec}
.legal-check{display:flex;gap:9px;align-items:flex-start;font-size:11px;line-height:1.5;color:#c4ddec}.legal-check input{width:16px;height:16px;min-width:16px;margin-top:1px;accent-color:#20bfff}.legal-check a{color:#7be2ff;font-weight:800}

/* V14 — stable hero / mascot positioning */
.hero{overflow:hidden}
.hero-grid{align-items:center}
.hero-visual{position:relative;min-width:0;overflow:visible}
.codey-stage{
  position:relative;
  width:100%;
  min-height:500px;
  contain:layout paint;
  overflow:visible;
}
.codey{
  left:50%!important;
  top:50%!important;
  right:auto!important;
  bottom:auto!important;
  transform:translate(-50%,-43%)!important;
  will-change:auto!important;
}
.codey-bubble{
  right:2%!important;
  top:8%!important;
  left:auto!important;
}
@media (max-width:900px){
  .codey-stage{min-height:420px}
  .codey{transform:translate(-50%,-45%) scale(.88)!important}
  .codey-bubble{right:4%!important;top:2%!important}
}
@media (max-width:700px){
  .hero-visual{min-height:390px}
  .codey-stage{min-height:390px;contain:layout paint}
  .codey{transform:translate(-50%,-46%) scale(.78)!important}
  .codey-bubble{right:50%!important;transform:translateX(50%);top:0!important;max-width:220px}
}

/* V14 — single-letter glow: exact glyph overlay, no field movement */
.input-wrap{position:relative!important}
.char-pop{
  position:absolute!important;
  margin:0!important;
  padding:0!important;
  transform:none!important;
  transform-origin:left top;
  font:inherit!important;
  font-weight:inherit!important;
  letter-spacing:inherit!important;
  line-height:inherit!important;
  background:none!important;
  -webkit-background-clip:initial!important;
  background-clip:initial!important;
  color:#31cfff!important;
  text-shadow:0 0 5px rgba(49,207,255,.95),0 0 10px rgba(108,125,255,.65)!important;
  filter:none!important;
  animation:charGlowExact 1s ease-out forwards!important;
}
@keyframes charGlowExact{
  0%{opacity:1}
  65%{opacity:1}
  100%{opacity:0}
}

/* V15 — blue/violet mixed glow on exactly the typed glyph */
.char-pop{
  color:#697cff!important;
  background:linear-gradient(90deg,#209dff 0%,#526dff 42%,#8b5cff 100%)!important;
  -webkit-background-clip:text!important;
  background-clip:text!important;
  -webkit-text-fill-color:transparent!important;
  text-shadow:
    0 0 4px rgba(32,157,255,.85),
    0 0 8px rgba(82,109,255,.62),
    0 0 12px rgba(139,92,255,.48)!important;
}


/* =========================================================
   V16 — final visual cleanup from desktop test
   ========================================================= */

/* 1) ERSTELLI mascot: always keep the complete body + shoes visible */
.hero{
  overflow:visible!important;
}
.hero-visual{
  min-height:590px!important;
  overflow:visible!important;
}
.codey-stage{
  min-height:590px!important;
  overflow:visible!important;
  contain:none!important;
}
.codey{
  top:50%!important;
  left:50%!important;
  transform:translate(-50%,-50%)!important;
}
.codey-shadow{
  bottom:34px!important;
}

@media (max-width:900px){
  .hero-visual{min-height:540px!important}
  .codey-stage{min-height:540px!important;contain:none!important;overflow:visible!important}
  .codey{transform:translate(-50%,-50%) scale(.88)!important}
}
@media (max-width:700px){
  .hero-visual{min-height:470px!important}
  .codey-stage{
    min-height:470px!important;
    transform:none!important;
    margin-bottom:0!important;
    contain:none!important;
    overflow:visible!important;
  }
  .codey{transform:translate(-50%,-48%) scale(.78)!important}
}

/* 2) Prevent descenders such as g from being clipped in gradient headings */
.head h2,
.contact-copy h2,
.handover-copy h2,
.ownership-card h2{
  line-height:1.13!important;
  padding-bottom:.12em!important;
  overflow:visible!important;
  -webkit-box-decoration-break:clone;
  box-decoration-break:clone;
}

/* Keep heading spacing visually balanced after adding descender room */
.head h2{margin-bottom:10px!important}
.contact-copy h2{margin-bottom:10px!important}

/* 3) Contact explanatory copy: clearly visible, same blue/cyan/violet family */
.contact-copy>p{
  max-width:590px!important;
  margin-top:4px!important;
  font-family:Inter,Arial,sans-serif!important;
  font-size:clamp(16px,1.55vw,20px)!important;
  line-height:1.55!important;
  font-weight:750!important;
  letter-spacing:-.015em!important;
  background:linear-gradient(90deg,#5abfff 0%,#7ce9ff 46%,#a492ff 100%)!important;
  -webkit-background-clip:text!important;
  background-clip:text!important;
  -webkit-text-fill-color:transparent!important;
  color:transparent!important;
  text-shadow:0 0 14px rgba(78,189,255,.08)!important;
}

/* 4) Remove the unwanted decorative mark/pseudo-element in the contact box */
.contact::before{
  content:none!important;
  display:none!important;
  background:none!important;
  animation:none!important;
  transform:none!important;
}
.contact{
  padding-bottom:38px!important;
}

/* V17 — WhatsApp contact as text/number only; no image/icon */
.contact-direct{
  margin-top:10px;
  padding:13px 14px;
  border:1px solid rgba(108,201,255,.16);
  border-radius:13px;
  background:rgba(255,255,255,.035);
  display:flex;
  flex-direction:column;
  gap:5px;
  font-size:11px;
  line-height:1.5;
}
.contact-direct>span:first-child{
  font-weight:850;
  color:#9beaff;
  letter-spacing:.03em;
}
.contact-direct a,
.contact-direct .whatsapp-line{
  color:#cfe8f6;
  text-decoration:none;
}
.contact-direct a:hover{text-decoration:underline}
.whatsapp-line b{
  color:#8c84ff;
  font-weight:850;
}

/* V18 — business workflow */
.upload-box{
  display:block;padding:16px;border:1px dashed rgba(94,203,255,.32);border-radius:15px;
  background:rgba(255,255,255,.035);cursor:pointer
}
.upload-box input{display:block;margin:10px 0 0!important;padding:8px!important;background:rgba(255,255,255,.04)!important}
.upload-title{display:block;font-weight:850;color:#a0edff;font-size:13px}
.upload-copy,.file-list{display:block;color:#c2d8e5;font-size:10px;line-height:1.5;margin-top:3px}
.file-list{color:#9f9aff;margin-top:8px;font-weight:750}
.request-status{min-height:18px;font-size:11px;line-height:1.5;font-weight:750;color:#9ceaff}
.request-status.error{color:#ffb5c1}
.request-status.success{color:#86f2c5}
.whatsapp-float{
  position:fixed;right:22px;bottom:22px;z-index:80;display:flex;align-items:center;gap:10px;
  min-width:190px;padding:11px 15px;border-radius:17px;text-decoration:none;
  background:rgba(13,36,53,.94);border:1px solid rgba(88,218,255,.22);
  box-shadow:0 16px 44px rgba(24,84,128,.2);backdrop-filter:blur(8px);color:white
}
.whatsapp-float[hidden]{display:none!important}
.wa-dot{width:11px;height:11px;border-radius:50%;background:linear-gradient(135deg,#21b6ff,#8b64ff);box-shadow:0 0 12px rgba(73,168,255,.75)}
.whatsapp-float span:last-child{display:flex;flex-direction:column;line-height:1.15}
.whatsapp-float b{font-size:12px}.whatsapp-float small{font-size:9px;color:#c6dce8;margin-top:3px}
.whatsapp-text-link[hidden]{display:none!important}
.reviews-section{padding-top:30px}
.reviews-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}
.review-card-public,.review-empty,.review-note{
  border:1px solid rgba(43,134,214,.12);background:rgba(255,255,255,.72);
  border-radius:22px;padding:22px;box-shadow:0 15px 45px rgba(32,91,140,.06)
}
.review-stars{font-size:18px;letter-spacing:2px;color:#6d76ff;margin-bottom:10px}
.review-card-public p,.review-empty p,.review-note p{font-size:12px;line-height:1.65;color:#5d7387}
.review-card-public strong,.review-empty strong{color:#1d3c55}
.review-card-public footer{margin-top:12px;font-size:10px;color:#7890a3}
.review-note{margin-top:15px;padding:17px 20px}
.review-note span{font-size:11px;font-weight:900;color:#198fd7;letter-spacing:.05em}
.review-note p{margin:4px 0 0}
@media(max-width:800px){.reviews-grid{grid-template-columns:1fr}.whatsapp-float{right:12px;bottom:12px;min-width:auto}}

/* V19 — premium upload component matching ERSTELLI */
.premium-upload{
  position:relative;
  display:block;
  padding:20px!important;
  border:1px solid rgba(111,215,255,.24)!important;
  border-radius:20px!important;
  background:
    linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.025)),
    radial-gradient(circle at 12% 8%,rgba(63,196,255,.13),transparent 34%),
    radial-gradient(circle at 88% 90%,rgba(133,91,255,.12),transparent 36%)!important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.06),
    0 18px 44px rgba(5,30,45,.08)!important;
  overflow:hidden;
}
.premium-upload::after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  border-radius:inherit;
  background:linear-gradient(110deg,transparent 0 35%,rgba(105,211,255,.05) 48%,transparent 62%);
}
.upload-head{
  display:flex;
  align-items:center;
  gap:13px;
  margin-bottom:15px;
}
.upload-symbol{
  width:42px;
  height:42px;
  min-width:42px;
  display:grid;
  place-items:center;
  border-radius:13px;
  background:linear-gradient(145deg,rgba(41,171,255,.18),rgba(126,93,255,.16));
  border:1px solid rgba(110,214,255,.2);
  box-shadow:0 8px 24px rgba(51,121,209,.10);
}
.upload-arrow{
  font-size:22px;
  line-height:1;
  font-weight:900;
  background:linear-gradient(180deg,#70dcff,#8a6dff);
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
}
.upload-title{
  display:block;
  font-size:14px!important;
  font-weight:900!important;
  letter-spacing:-.01em;
  background:linear-gradient(90deg,#87e8ff,#b7c7ff,#b390ff);
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent!important;
}
.upload-copy{
  display:block;
  margin-top:4px!important;
  font-size:10px!important;
  line-height:1.5!important;
  color:#cbdfe9!important;
}
.premium-upload input[type="file"]{
  position:absolute!important;
  opacity:0!important;
  width:1px!important;
  height:1px!important;
  overflow:hidden!important;
  pointer-events:none!important;
}
.upload-action{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  flex-wrap:wrap;
  padding:12px 13px;
  border-radius:14px;
  background:rgba(255,255,255,.045);
  border:1px solid rgba(135,214,255,.11);
}
.upload-button-look{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:38px;
  padding:0 15px;
  border-radius:11px;
  font-size:11px;
  font-weight:900;
  letter-spacing:.01em;
  color:white;
  background:linear-gradient(90deg,#219fff,#55cfff,#7b70ff);
  box-shadow:0 10px 24px rgba(63,138,255,.18);
}
.upload-limit{
  font-size:9px;
  color:#aac5d4;
  line-height:1.4;
}
.file-list{
  display:block!important;
  margin-top:12px!important;
  padding-top:10px;
  border-top:1px solid rgba(152,218,255,.10);
  font-size:10px!important;
  line-height:1.5!important;
  color:#aeb3ff!important;
  font-weight:800!important;
}
.premium-upload:hover .upload-button-look{
  filter:brightness(1.05);
  transform:translateY(-1px);
}
.whatsapp-number a{
  color:#0877e8;
  font-weight:850;
  text-decoration:none;
}
.whatsapp-number a:hover{text-decoration:underline}

/* V20 — WhatsApp always visible and review CTA */
.whatsapp-float{
  display:flex!important;
  visibility:visible!important;
  opacity:1!important;
}
.whatsapp-float[hidden]{display:flex!important}
.whatsapp-direct-btn{
  display:inline-flex!important;
  width:max-content;
  margin-top:5px;
  padding:10px 13px;
  border-radius:11px;
  font-weight:850;
  background:linear-gradient(90deg,rgba(33,159,255,.16),rgba(126,98,255,.16));
  border:1px solid rgba(108,204,255,.17);
  color:#a8eaff!important;
  text-decoration:none!important;
}
.whatsapp-direct-btn:hover{transform:translateY(-1px)}
.review-submit-btn{
  float:right;
  text-decoration:none;
  font-size:11px;
  font-weight:900;
  color:white;
  background:linear-gradient(90deg,#279cff,#796bff);
  padding:10px 14px;
  border-radius:11px;
  margin-left:15px;
}
@media(max-width:600px){
  .review-submit-btn{float:none;display:inline-flex;margin:0 0 12px}
}

/* V21 — final live copy cleanup */
.footer-claim{
  color:#7890a3;
  font-size:11px;
  font-weight:750;
  letter-spacing:.01em;
}

/* V22 — guided project questions */
.project-questions{
  margin:4px 0 2px;
  padding:20px;
  border-radius:20px;
  border:1px solid rgba(104,210,255,.19);
  background:
    radial-gradient(circle at 8% 0%,rgba(42,176,255,.11),transparent 34%),
    radial-gradient(circle at 94% 100%,rgba(125,91,255,.10),transparent 34%),
    rgba(255,255,255,.035);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.045);
}
.project-questions-head{margin-bottom:18px}
.project-questions-head>span{
  display:block;font-size:9px;font-weight:900;letter-spacing:.16em;color:#83e4ff;margin-bottom:5px
}
.project-questions-head h3{
  margin:0;
  font-size:clamp(22px,2.5vw,31px);
  line-height:1.12;
  padding-bottom:.08em;
  background:linear-gradient(90deg,#55bfff,#7ce8ff 48%,#9b7dff);
  -webkit-background-clip:text;background-clip:text;color:transparent
}
.project-questions-head p{margin:7px 0 0;color:#bdd3df;font-size:11px;line-height:1.55}
.project-question{
  padding:16px 0;
  border-top:1px solid rgba(145,215,255,.10)
}
.question-title{display:flex;align-items:center;gap:9px;margin-bottom:11px}
.question-title b{
  display:grid;place-items:center;width:30px;height:30px;border-radius:9px;
  background:linear-gradient(145deg,rgba(38,166,255,.17),rgba(128,93,255,.15));
  border:1px solid rgba(105,207,255,.15);color:#8be7ff;font-size:10px
}
.question-title span{font-size:12px;font-weight:850;color:#e5f5fb}
.color-choice-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.color-choice{
  position:relative;display:flex;align-items:center;gap:9px;padding:10px;
  border-radius:12px;border:1px solid rgba(141,207,240,.11);
  background:rgba(255,255,255,.035);cursor:pointer;color:#c9dce6;font-size:10px;font-weight:750
}
.color-choice input,.choice-chips input{position:absolute;opacity:0;pointer-events:none}
.color-choice:has(input:checked),.choice-chips label:has(input:checked){
  border-color:rgba(104,192,255,.45);
  background:linear-gradient(110deg,rgba(43,161,255,.13),rgba(124,94,255,.12));
  box-shadow:0 0 0 1px rgba(114,175,255,.08),0 8px 25px rgba(29,100,160,.08)
}
.color-preview{
  width:27px;height:27px;min-width:27px;border-radius:9px;
  border:1px solid rgba(255,255,255,.18);box-shadow:inset 0 1px 0 rgba(255,255,255,.15)
}
.color-blue{background:linear-gradient(135deg,#168dff,#55e3ff)}
.color-dark{background:linear-gradient(135deg,#111827,#44546a)}
.color-warm{background:linear-gradient(135deg,#d6b98d,#f4e8d4)}
.color-green{background:linear-gradient(135deg,#2b9a74,#8bcf9d)}
.color-violet{background:linear-gradient(135deg,#655cff,#b66eff)}
.color-custom{display:grid;place-items:center;background:linear-gradient(135deg,#2c91ff,#7fe3ff,#9866ff);color:white;font-weight:900}
.question-extra{
  margin-top:9px!important;
  min-height:42px!important;
  font-size:10px!important;
}
.choice-chips{display:flex;flex-wrap:wrap;gap:7px}
.choice-chips label{position:relative;cursor:pointer}
.choice-chips label span{
  display:inline-flex;align-items:center;min-height:36px;padding:0 12px;
  border-radius:11px;border:1px solid rgba(141,207,240,.11);
  background:rgba(255,255,255,.035);color:#c9dce6;font-size:10px;font-weight:750
}
.choice-chips label:has(input:checked) span{color:#eafaff}
.message-label{display:block;margin:8px 0 -3px}
.message-label>span{
  display:block;font-size:13px;font-weight:900;
  background:linear-gradient(90deg,#62c8ff,#8be8ff,#9b83ff);
  -webkit-background-clip:text;background-clip:text;color:transparent
}
.message-label small{display:block;margin-top:3px;color:#abc4d1;font-size:9px}
@media(max-width:720px){.color-choice-grid{grid-template-columns:1fr 1fr}}
@media(max-width:460px){.color-choice-grid{grid-template-columns:1fr}}

/* V23 — polished guided-question design */
.project-questions{
  padding:24px!important;
  border-radius:24px!important;
  border:1px solid rgba(110,207,255,.20)!important;
  background:
    radial-gradient(circle at 12% 0%,rgba(30,156,255,.14),transparent 31%),
    radial-gradient(circle at 92% 100%,rgba(130,91,255,.12),transparent 34%),
    linear-gradient(145deg,rgba(12,56,78,.96),rgba(13,49,71,.96))!important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.055),
    0 22px 60px rgba(5,27,42,.13)!important;
}

.project-question{
  padding:19px 0!important;
}

.question-title{
  gap:11px!important;
  margin-bottom:13px!important;
}
.question-title b{
  width:34px!important;
  height:34px!important;
  border-radius:11px!important;
  color:#a5ecff!important;
  background:linear-gradient(145deg,rgba(38,166,255,.17),rgba(128,93,255,.14))!important;
}
.question-title span{
  font-size:13px!important;
  line-height:1.4!important;
}

/* No radio dots: the entire card/chip is the selection indicator */
.color-choice input,
.choice-chips input{
  position:absolute!important;
  inline-size:1px!important;
  block-size:1px!important;
  opacity:0!important;
  appearance:none!important;
  -webkit-appearance:none!important;
  pointer-events:none!important;
}

.color-choice-grid{
  grid-template-columns:repeat(4,minmax(0,1fr))!important;
  gap:9px!important;
}
.color-choice{
  min-height:58px;
  padding:11px 12px!important;
  border-radius:14px!important;
  border:1px solid rgba(147,214,247,.12)!important;
  background:linear-gradient(145deg,rgba(255,255,255,.048),rgba(255,255,255,.026))!important;
  overflow:hidden;
  transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease,background .18s ease;
}
.color-choice:hover{
  transform:translateY(-1px);
  border-color:rgba(105,202,255,.25)!important;
}
.color-choice span:last-child{
  position:relative;
  z-index:2;
  font-size:10px;
  font-weight:820;
  color:#d5e6ee;
}
.color-choice:has(input:checked){
  transform:translateY(-1px);
  border-color:rgba(104,190,255,.48)!important;
  background:
    linear-gradient(120deg,rgba(32,154,255,.15),rgba(93,115,255,.13),rgba(139,86,255,.13))!important;
  box-shadow:
    0 0 0 1px rgba(93,171,255,.11),
    0 0 20px rgba(66,154,255,.10),
    inset 0 1px 0 rgba(255,255,255,.06)!important;
}
.color-choice:has(input:checked) span:last-child{
  background:linear-gradient(90deg,#63c9ff,#8fe7ff,#9b7eff);
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent!important;
  text-shadow:0 0 12px rgba(91,172,255,.12);
}

.color-preview{
  width:30px!important;
  height:30px!important;
  min-width:30px!important;
  border-radius:10px!important;
}
.color-red{background:linear-gradient(135deg,#a61f3a,#e55770)}
.color-orange{background:linear-gradient(135deg,#f07a26,#ffc15c)}

/* Chips become full shimmer buttons with no dots */
.choice-chips{
  gap:8px!important;
}
.choice-chips label span{
  min-height:40px!important;
  padding:0 14px!important;
  border-radius:12px!important;
  border:1px solid rgba(147,214,247,.12)!important;
  background:linear-gradient(145deg,rgba(255,255,255,.048),rgba(255,255,255,.026))!important;
  color:#d3e4ec!important;
  font-size:10px!important;
  font-weight:820!important;
  transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease,background .18s ease;
}
.choice-chips label:hover span{
  transform:translateY(-1px);
  border-color:rgba(105,202,255,.24)!important;
}
.choice-chips label:has(input:checked) span{
  transform:translateY(-1px);
  border-color:rgba(104,190,255,.46)!important;
  background:
    linear-gradient(100deg,rgba(35,154,255,.15),rgba(89,117,255,.13),rgba(139,88,255,.13))!important;
  box-shadow:
    0 0 0 1px rgba(93,171,255,.10),
    0 0 18px rgba(80,149,255,.09)!important;
  color:transparent!important;
  background-clip:padding-box!important;
  position:relative;
}
.choice-chips label:has(input:checked) span::after{
  content:attr(data-label);
}
.choice-chips label:has(input:checked) span{
  color:#dff7ff!important;
  text-shadow:
    0 0 5px rgba(91,194,255,.38),
    0 0 10px rgba(124,101,255,.24)!important;
}

/* Additional wishes should feel like part of the same visual system */
.message-label{
  margin:14px 0 7px!important;
}
.message-label>span{
  font-size:16px!important;
  line-height:1.3!important;
}
.message-label small{
  margin-top:5px!important;
  font-size:10px!important;
  color:#b8ced9!important;
}

/* Avoid cramped / confusing layout on smaller screens */
@media(max-width:980px){
  .color-choice-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
}
@media(max-width:720px){
  .project-questions{padding:18px!important}
  .color-choice-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
}
@media(max-width:460px){
  .color-choice-grid{grid-template-columns:1fr!important}
  .choice-chips{display:grid!important;grid-template-columns:1fr!important}
  .choice-chips label span{width:100%;justify-content:flex-start}
}

/* V24 — fix question cards overflow + exact typing glow in custom color field */

/* Keep questions 02–04 fully inside their own section width */
.project-questions{
  overflow:hidden!important;
}
.project-question{
  min-width:0!important;
  overflow:hidden!important;
}
.choice-chips{
  display:grid!important;
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:9px!important;
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
}
.choice-chips label{
  min-width:0!important;
  width:100%!important;
}
.choice-chips label span{
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  box-sizing:border-box!important;
  white-space:normal!important;
  line-height:1.3!important;
  justify-content:flex-start!important;
  overflow-wrap:anywhere!important;
}
@media(max-width:900px){
  .choice-chips{grid-template-columns:repeat(2,minmax(0,1fr))!important}
}
@media(max-width:560px){
  .choice-chips{grid-template-columns:1fr!important}
}

/* Custom color field gets a proper inner layout so text doesn't touch edges */
#customColors{
  width:100%!important;
  box-sizing:border-box!important;
  padding:13px 15px!important;
  line-height:1.45!important;
}

/* Override old character pop positioning with exact baseline alignment */
.input-wrap{
  position:relative!important;
  width:100%!important;
}
.input-wrap > input,
.input-wrap > textarea{
  width:100%!important;
  box-sizing:border-box!important;
}
.char-pop{
  position:absolute!important;
  transform:none!important;
  margin:0!important;
  padding:0!important;
  pointer-events:none!important;
  white-space:pre!important;
  z-index:6!important;
  line-height:normal!important;
  text-shadow:
    0 0 5px rgba(59,155,255,.78),
    0 0 10px rgba(118,93,255,.48)!important;
}

/* =========================================================
   V33 — exact typing glow, mobile-safe
   ========================================================= */

/* Do not force text-field typography. Each field keeps its own normal ERSTELLI size. */
.typing-glow-char{
  position:absolute;
  z-index:9999;
  pointer-events:none;
  margin:0;
  padding:0;
  white-space:pre;
  color:#6f80ff;
  background:linear-gradient(90deg,#2ea8ff 0%,#5f83ff 48%,#9a67ff 100%);
  -webkit-background-clip:text;
  background-clip:text;
  -webkit-text-fill-color:transparent;
  text-shadow:
    0 0 4px rgba(46,168,255,.82),
    0 0 8px rgba(95,131,255,.58),
    0 0 12px rgba(154,103,255,.38);
  animation:typingGlowExactV27 1s ease-out forwards;
  will-change:opacity;
}
@keyframes typingGlowExactV27{
  0%{opacity:1}
  72%{opacity:1}
  100%{opacity:0}
}

/* =========================================================
   V28 — final selection-button corner fix
   Only the rounded button itself can glow.
   ========================================================= */

.choice-chips{
  overflow:hidden!important;
}

.choice-chips label{
  overflow:hidden!important;
  border-radius:14px!important;
  background:transparent!important;
  box-shadow:none!important;
  outline:none!important;
}

.choice-chips label span{
  overflow:hidden!important;
  border-radius:14px!important;
  clip-path:inset(0 round 14px)!important;
  background-clip:padding-box!important;
  box-shadow:none!important;
}

.choice-chips label:has(input:checked){
  overflow:hidden!important;
  border-radius:14px!important;
  background:transparent!important;
  box-shadow:none!important;
  outline:none!important;
}

.choice-chips label:has(input:checked) span{
  overflow:hidden!important;
  border-radius:14px!important;
  clip-path:inset(0 round 14px)!important;
  background:
    linear-gradient(110deg,
      rgba(39,156,255,.20),
      rgba(88,120,255,.17),
      rgba(139,86,255,.17)
    )!important;
  border:1px solid rgba(100,192,255,.52)!important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.07),
    inset 0 0 18px rgba(80,149,255,.10),
    0 0 12px rgba(64,149,255,.08)!important;
}

/* hard-disable pseudo layers that could create square corners */
.choice-chips label::before,
.choice-chips label::after,
.choice-chips label span::before,
.choice-chips label span::after,
.choice-chips label:has(input:checked)::before,
.choice-chips label:has(input:checked)::after,
.choice-chips label:has(input:checked) span::before,
.choice-chips label:has(input:checked) span::after{
  content:none!important;
  display:none!important;
  background:none!important;
  box-shadow:none!important;
  border:0!important;
}

/* V29 legal price note */
.tax-note{display:block;max-width:340px;margin-top:7px;font-size:10.5px!important;line-height:1.35;color:rgba(211,228,244,.72)!important;font-weight:650;letter-spacing:.01em;text-transform:none!important}


/* V36 — stable mobile code background */
#codeRain{pointer-events:none;transform:translateZ(0);backface-visibility:hidden;-webkit-backface-visibility:hidden;}
@media (max-width:700px), (pointer:coarse){
  #codeRain{
    position:fixed!important;
    top:0!important;left:0!important;right:auto!important;bottom:auto!important;
    width:100vw!important;
    height:100lvh!important;
    min-height:100svh!important;
    z-index:-3!important;
    will-change:transform;
    contain:strict;
  }
}

ERSTELLI – vor dem Livegang ausfüllen/pruefen

1. Impressum: Name, Rechtsform und Anschrift sind eingetragen. Name, Rechtsform, Anschrift und geschäftliche E-Mail-Adresse sind eingetragen. Noch prüfen/ergänzen: ggf. Telefonnummer, Registerdaten und USt-ID/W-IdNr., falls vorhanden.
2. Datenschutz: tatsächlichen Hostinganbieter und jeden tatsächlich eingebundenen externen Dienst eintragen.
3. Formular: aktuell ist der Versand noch Demo. Beim Anschluss eines Backend-/Mail-Dienstes Datenschutzerklärung aktualisieren.
4. AGB: finalen Unternehmensstatus, Zahlungsmodell, Korrekturrunden und Verbraucher/B2B-Zielgruppe festlegen.
5. Wenn Verbraucher online verbindlich bestellen können: korrekte Widerrufsbelehrung, ggf. Online-Widerrufsfunktion und Button-/Informationspflichten implementieren.
6. Rechnung: Steuerstatus (z.B. Kleinunternehmer oder Regelbesteuerung) korrekt abbilden.
7. Rechtstexte vor kommerziellem Livegang durch einen deutschen Rechtsanwalt / spezialisierten Anbieter prüfen lassen.

8. WhatsApp: echte Nummer in script.js bei WHATSAPP_NUMBER im internationalen Format eintragen, z.B. 491701234567.

<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Widerruf | ERSTELLI</title>
<style>
:root{--ink:#10283e;--blue:#0877e8;--cyan:#38d6ff;--muted:#5e758a;--line:rgba(8,119,232,.12)}
*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:linear-gradient(145deg,#f9fdff,#eaf8ff 55%,#f6f4ff)}
.wrap{width:min(920px,calc(100% - 32px));margin:auto}.top{padding:24px 0}.brand{font-weight:950;letter-spacing:.08em;color:var(--blue);text-decoration:none}.brand small{display:block;letter-spacing:.03em;color:#688197;font-weight:700}
.card{background:rgba(255,255,255,.9);border:1px solid var(--line);box-shadow:0 24px 80px rgba(26,93,155,.1);border-radius:28px;padding:clamp(24px,5vw,54px);margin:18px 0 60px}
.eyebrow{font-size:12px;font-weight:900;letter-spacing:.14em;color:var(--blue)}h1{font-size:clamp(40px,7vw,68px);letter-spacing:-.05em;line-height:1;margin:10px 0 18px;background:linear-gradient(90deg,#0877e8,#35d5ff,#8175ff);-webkit-background-clip:text;background-clip:text;color:transparent}
h2{font-size:22px;margin:34px 0 10px}h3{font-size:16px;margin:22px 0 8px}p,li{line-height:1.72;color:#38536a;font-size:14px}a{color:#0877e8}.notice{padding:16px 18px;border-radius:15px;background:#eef9ff;border:1px solid var(--line);font-size:13px;line-height:1.6;color:#31526d}.back{display:inline-block;margin-top:20px;text-decoration:none;font-weight:800}
</style>
</head>
<body><div class="wrap"><div class="top"><a class="brand" href="index.html">ERSTELLI<small>Your Website.</small></a></div>
<main class="card"><div class="eyebrow">VERBRAUCHERINFORMATION</div><h1>Widerrufsbelehrung</h1>
<p>Die nachfolgende Belehrung gilt für Verbraucher, soweit für den konkret geschlossenen Fernabsatzvertrag ein gesetzliches Widerrufsrecht besteht.</p>
<h2>Widerrufsrecht</h2>
<p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.</p>
<p>Um Ihr Widerrufsrecht auszuüben, müssen Sie uns<br><br>Diamond Kluge – Einzelunternehmen<br>Stindestraße 3<br>12167 Berlin<br>Deutschland<br>E-Mail: <a href="mailto:erstelliyourwebsite@gmail.com">erstelliyourwebsite@gmail.com</a><br><br>mittels einer eindeutigen Erklärung (zum Beispiel ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das unten stehende Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.</p>
<p>Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.</p>
<h2>Folgen des Widerrufs</h2>
<p>Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf bei uns eingegangen ist. Für die Rückzahlung verwenden wir grundsätzlich dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, sofern nicht ausdrücklich etwas anderes vereinbart wurde. Wegen dieser Rückzahlung werden Ihnen keine Entgelte berechnet.</p>
<p>Haben Sie ausdrücklich verlangt, dass die vereinbarte Dienstleistung bereits während der Widerrufsfrist beginnen soll, haben Sie im gesetzlichen Umfang einen angemessenen Betrag für die bis zu Ihrem Widerruf bereits erbrachten Leistungen zu zahlen. Dieser Betrag entspricht dem Anteil der bis zum Widerruf erbrachten Leistungen im Verhältnis zum Gesamtumfang der vertraglich vorgesehenen Leistung.</p>
<h2>Muster-Widerrufsformular</h2>
<p>Wenn Sie den Vertrag widerrufen wollen, können Sie folgende Angaben verwenden und an uns übermitteln:</p>
<div class="notice">An Diamond Kluge – Einzelunternehmen, Stindestraße 3, 12167 Berlin, Deutschland, E-Mail: erstelliyourwebsite@gmail.com<br><br>Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung:<br><br>________________________________________<br><br>Bestellt am / Vertrag geschlossen am: ____________________<br><br>Name des/der Verbraucher(s): ____________________________<br><br>Anschrift des/der Verbraucher(s): _________________________<br><br>Datum: ____________________<br><br>Unterschrift (nur bei Mitteilung auf Papier): ____________________</div>
<p><b>Stand:</b> 31. August 2026</p>
<a class="back" href="index.html">← Zurück zu ERSTELLI</a></main></div></body></html>
<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ERSTELLI – Admin</title><link rel="stylesheet" href="style.css"><style>
body{min-height:100vh;background:linear-gradient(145deg,#f8fdff,#eef8ff 55%,#f7f3ff);color:#17344b}.admin-shell{width:min(1080px,calc(100% - 32px));margin:36px auto 80px}.admin-head{display:flex;justify-content:space-between;gap:18px;align-items:end;margin-bottom:24px}.admin-head h1{font-size:clamp(38px,7vw,64px);margin:0;background:linear-gradient(90deg,#1299ff,#55d8ff,#8e63ff);-webkit-background-clip:text;color:transparent}.admin-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:20px}.admin-card{background:#fff;border:1px solid rgba(41,135,220,.13);border-radius:24px;padding:24px;box-shadow:0 24px 70px rgba(25,91,150,.10)}.admin-card h2{margin-top:0}.admin-controls{display:flex;gap:10px;flex-wrap:wrap}.admin-card input,.admin-card select{padding:12px 14px;border:1px solid rgba(42,115,175,.18);border-radius:12px;font:inherit}.admin-card button{border:0;border-radius:12px;padding:12px 16px;font-weight:800;color:#fff;background:linear-gradient(90deg,#1498ff,#745fff);cursor:pointer}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}.kpi{padding:16px;border-radius:16px;background:#f5fbff}.kpi b{font-size:28px;display:block}.admin-table{width:100%;border-collapse:collapse;margin-top:14px}.admin-table td,.admin-table th{padding:9px;border-bottom:1px solid #e8f0f6;text-align:left}.admin-status{margin-top:12px;font-weight:700}@media(max-width:850px){.admin-grid{grid-template-columns:1fr}.kpis{grid-template-columns:1fr 1fr}}
</style></head><body><main class="admin-shell"><div class="admin-head"><div><small>ERSTELLI INTERN</small><h1>Admin.</h1><p>Analytics ansehen und abgeschlossene Aufträge für Bewertungen freischalten.</p></div><a href="index.html">Zur Website →</a></div>
<div class="admin-card" style="margin-bottom:20px"><h2>Zugang</h2><p>Das Admin-Passwort wird nicht in der Website gespeichert. Gib hier das in Supabase hinterlegte <b>ERSTELLI_ADMIN_SECRET</b> ein.</p><input id="secret" type="password" autocomplete="off" placeholder="Admin-Passwort" style="width:min(420px,100%)"></div>
<div class="admin-grid"><section class="admin-card"><h2>Analytics</h2><div class="admin-controls"><select id="days"><option value="7">7 Tage</option><option value="30" selected>30 Tage</option><option value="90">90 Tage</option><option value="365">365 Tage</option></select><button id="loadAnalytics">Auswertung laden</button></div><div id="analyticsStatus" class="admin-status"></div><div id="kpis" class="kpis"></div><div id="details"></div></section>
<section class="admin-card"><h2>Bewertung freischalten</h2><p>Wenn ein Auftrag abgeschlossen ist, erzeugt das Backend automatisch den einmaligen Bewertungscode.</p><label>Projekt-/Anfrage-ID<input id="requestId" placeholder="ER-20260831-ABCD" style="width:100%"></label><label>Rechnungsnummer (optional)<input id="invoice" placeholder="RE-2026-001" style="width:100%"></label><label>Endpreis (optional)<input id="finalPrice" type="number" step="0.01" placeholder="425" style="width:100%"></label><button id="complete" style="margin-top:12px">Auftrag abschließen</button><div id="orderStatus" class="admin-status"></div></section></div></main><script src="config.js"></script><script>
const cfg=window.ERSTELLI_CONFIG||{};const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function headers(){return {'apikey':cfg.supabasePublishableKey,'Authorization':`Bearer ${cfg.supabasePublishableKey}`,'x-erstelli-admin-secret':document.getElementById('secret').value.trim()}}
function table(title,rows){if(!rows?.length)return'';return `<h3>${esc(title)}</h3><table class="admin-table"><tbody>${rows.slice(0,12).map(r=>`<tr><td>${esc(r.name)}</td><td><b>${esc(r.count)}</b></td></tr>`).join('')}</tbody></table>`}
document.getElementById('loadAnalytics').onclick=async()=>{const st=document.getElementById('analyticsStatus');if(!cfg.supabaseUrl||!cfg.supabasePublishableKey){st.textContent='Supabase ist noch nicht verbunden.';return}st.textContent='Lade …';try{const r=await fetch(`${cfg.supabaseUrl}/functions/v1/${cfg.analyticsReportFunction||'analytics-report'}?days=${document.getElementById('days').value}`,{headers:headers()});const d=await r.json();if(!r.ok)throw new Error(d.error||'Fehler');const s=d.summary;document.getElementById('kpis').innerHTML=[['Seitenaufrufe',s.pageViews],['Besuche*',s.sessions],['Formularstarts',s.formStarts],['Anfragen',s.submissions],['WhatsApp',s.whatsapp],['Conversion',s.conversionRate+' %']].map(x=>`<div class="kpi"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');document.getElementById('details').innerHTML=table('Erreichte Bereiche',d.sections)+table('Scrolltiefe',d.scroll)+table('Pakete',d.packages)+table('Klicks',d.clicks)+table('Quellen',d.sources)+table('Geräte',d.devices);st.textContent='*Besuche = einzelne Seitenaufrufe/Sitzungen ohne dauerhaftes Nutzer-Tracking.'}catch(e){st.textContent=e.message}};
document.getElementById('complete').onclick=async()=>{const st=document.getElementById('orderStatus');if(!cfg.supabaseUrl||!cfg.supabasePublishableKey){st.textContent='Supabase ist noch nicht verbunden.';return}st.textContent='Verarbeite …';try{const r=await fetch(`${cfg.supabaseUrl}/functions/v1/${cfg.completeOrderFunction||'complete-order'}`,{method:'POST',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify({requestId:document.getElementById('requestId').value.trim(),invoiceNumber:document.getElementById('invoice').value.trim()||null,finalPrice:Number(document.getElementById('finalPrice').value)||null})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Fehler');st.innerHTML=`Bewertungscode: <b>${esc(d.reviewCode)}</b><br>Link: <a href="${esc(d.reviewUrl)}" target="_blank" rel="noopener">${esc(d.reviewUrl)}</a>`}catch(e){st.textContent=e.message}};
</script></body></html>

<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Allgemeine Geschäftsbedingungen | ERSTELLI</title>
<style>
:root{--ink:#10283e;--blue:#0877e8;--cyan:#38d6ff;--muted:#5e758a;--line:rgba(8,119,232,.12)}
*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:linear-gradient(145deg,#f9fdff,#eaf8ff 55%,#f6f4ff)}
.wrap{width:min(920px,calc(100% - 32px));margin:auto}.top{padding:24px 0}.brand{font-weight:950;letter-spacing:.08em;color:var(--blue);text-decoration:none}.brand small{display:block;letter-spacing:.03em;color:#688197;font-weight:700}
.card{background:rgba(255,255,255,.9);border:1px solid var(--line);box-shadow:0 24px 80px rgba(26,93,155,.1);border-radius:28px;padding:clamp(24px,5vw,54px);margin:18px 0 60px}
.eyebrow{font-size:12px;font-weight:900;letter-spacing:.14em;color:var(--blue)}h1{font-size:clamp(40px,7vw,68px);letter-spacing:-.05em;line-height:1;margin:10px 0 18px;background:linear-gradient(90deg,#0877e8,#35d5ff,#8175ff);-webkit-background-clip:text;background-clip:text;color:transparent}
h2{font-size:22px;margin:34px 0 10px}h3{font-size:16px;margin:22px 0 8px}p,li{line-height:1.72;color:#38536a;font-size:14px}a{color:#0877e8}.notice{padding:16px 18px;border-radius:15px;background:#eef9ff;border:1px solid var(--line);font-size:13px;line-height:1.6;color:#31526d}.back{display:inline-block;margin-top:20px;text-decoration:none;font-weight:800}
</style>
</head>
<body><div class="wrap"><div class="top"><a class="brand" href="index.html">ERSTELLI<small>Your Website.</small></a></div>
<main class="card"><div class="eyebrow">RECHTLICHES</div><h1>Allgemeine Geschäftsbedingungen</h1>
<h2>1. Geltungsbereich</h2>
<p>Diese Allgemeinen Geschäftsbedingungen gelten für Verträge über Konzeption, Gestaltung, Programmierung, Anpassung, Erweiterung und technische Bereitstellung von Websites sowie vereinbarte Zusatzleistungen durch ERSTELLI gegenüber Unternehmern und Verbrauchern. Abweichende Bedingungen des Kunden gelten nur, wenn ERSTELLI ihnen ausdrücklich in Textform zustimmt.</p>

<h2>2. Anfrage und Vertragsschluss</h2>
<p>Die auf der Website dargestellten Pakete, Preise und Konfigurationsmöglichkeiten stellen noch kein verbindliches Vertragsangebot von ERSTELLI dar. Das Absenden einer Konfiguration ist eine unverbindliche Projektanfrage. ERSTELLI ist nicht verpflichtet, eine Anfrage oder einen Auftrag anzunehmen.</p>
<p>Ein Vertrag kommt erst zustande, wenn ERSTELLI und der Kunde den konkreten Auftrag einschließlich Leistungsumfang und Preis eindeutig in Textform vereinbart haben oder ERSTELLI eine entsprechende Auftragsbestätigung in Textform übermittelt und der Kunde diese annimmt. Das bloße Absenden der Projektanfrage, eine automatische Eingangsbestätigung oder vorbereitende Kommunikation begründen noch keinen Vertrag. Vor Vertragsschluss können Umfang, Preis, Zeitplan und technische Machbarkeit angepasst werden.</p>

<h2>3. Leistungsumfang</h2>
<p>Maßgeblich ist die individuelle Auftragsbestätigung. Websites können insbesondere responsives Design, Seitenstruktur, Formulare, Animationen, Galerien, Terminbuchung, Zahlungsanbieter, SEO-Grundeinstellungen, Schnittstellen und – soweit vereinbart – KI-Funktionen enthalten.</p>
<p>Darstellungen, Designbeispiele, Mock-ups und Referenzlayouts auf der ERSTELLI-Website dienen der Veranschaulichung. Eine pixelgenaue Übernahme eines Beispiel- oder Referenzlayouts ist nur geschuldet, wenn dies ausdrücklich vereinbart wurde.</p>

<h2>4. Quellcode, Erweiterbarkeit und technische Umsetzung</h2>
<p>ERSTELLI erstellt Websites mit strukturiertem HTML, CSS, JavaScript und/oder weiteren für das jeweilige Projekt geeigneten Technologien. Soweit technisch und wirtschaftlich sinnvoll, wird der Code modular und erweiterbar aufgebaut. Eine uneingeschränkte Kompatibilität mit jeder zukünftigen Software, jedem Browser, jedem Drittanbieter oder jeder späteren Fremdänderung wird nicht zugesichert.</p>
<p>Zum Projekt können Quellcode, Stylesheets, Skripte, Konfigurationsdateien und weitere technische Dateien gehören. Wiederverwendbare allgemeine Werkzeuge, Bibliotheken, Komponenten, Routinen, Vorlagen und eigenes Know-how von ERSTELLI bleiben von einer projektbezogenen Rechteübertragung unberührt, soweit nichts anderes vereinbart ist.</p>

<h2>5. Mitwirkung des Kunden</h2>
<p>Der Kunde stellt erforderliche Inhalte, Logos, Bilder, Texte, Zugangsdaten und Freigaben rechtzeitig bereit und versichert, dass er die hierfür erforderlichen Rechte besitzt. Verzögerungen aufgrund fehlender Mitwirkung verlängern vereinbarte Fristen angemessen.</p>

<h2>6. Korrekturen und Änderungswünsche</h2>
<p>Im Paket enthaltene Korrekturrunden ergeben sich aus der Auftragsbestätigung. Eine Korrekturrunde umfasst gebündelte Änderungen innerhalb des vereinbarten Leistungsumfangs. Neue Funktionen, zusätzliche Seiten oder erhebliche Konzeptänderungen können gesondert berechnet werden; der Kunde wird darüber vor der Umsetzung informiert.</p>

<h2>7. Preise, Rechnung und Zahlung</h2>
<p>Es gelten die im individuell bestätigten Auftrag genannten Preise. Eine über den Konfigurator angezeigte Summe ist bis zur Auftragsbestätigung eine unverbindliche Preiseinschätzung auf Basis der gewählten Standardleistungen. Gegenüber Verbrauchern werden Endpreise angegeben. ERSTELLI wendet die Kleinunternehmerregelung nach § 19 UStG an. Die ausgewiesenen Preise sind Endpreise; Umsatzsteuer wird nicht gesondert ausgewiesen.</p>
<p>ERSTELLI kann je nach Auftrag Vorkasse, eine Anzahlung mit Schlusszahlung oder Zahlung nach Fertigstellung vereinbaren. Die konkrete Zahlungsweise und Fälligkeit wird vor Vertragsschluss mitgeteilt. Nach Zahlung bzw. Leistung erhält der Kunde eine Rechnung entsprechend den steuerrechtlichen Vorgaben.</p>

<h2>8. Ablehnung, Stornierung und Rückzahlung</h2>
<p>Solange ERSTELLI eine unverbindliche Anfrage noch nicht angenommen hat, besteht kein Anspruch des Interessenten auf Durchführung. Wurde vor endgültiger Annahme bereits eine Zahlung irrtümlich oder aufgrund einer gesonderten Zahlungsanforderung geleistet und ERSTELLI lehnt den Auftrag ab, wird der nicht geschuldete Betrag zurückgezahlt.</p>
<p>Nach wirksamem Vertragsschluss richten sich Stornierung, Kündigung, Rücktritt und Rückzahlung nach der individuellen Vereinbarung und den gesetzlichen Vorschriften. Gesetzliche Verbraucherrechte, insbesondere ein bestehendes Widerrufsrecht, werden durch diese AGB nicht eingeschränkt.</p>

<h2>9. Verbraucher und Widerrufsrecht</h2>
<p>Verbrauchern kann bei einem im Fernabsatz geschlossenen Dienstleistungsvertrag ein gesetzliches Widerrufsrecht zustehen. Die gesonderte Widerrufsbelehrung wird vor einem verbindlichen Fernabsatzvertrag bereitgestellt. Soll ERSTELLI auf ausdrücklichen Wunsch des Verbrauchers bereits vor Ablauf der Widerrufsfrist mit der Leistung beginnen, erfolgt dies nur unter Beachtung der hierfür geltenden gesetzlichen Voraussetzungen. Soweit gesetzlich vorgesehen, kann bei einem späteren Widerruf Wertersatz für bereits erbrachte Leistungen geschuldet sein.</p>

<h2>10. Domain, Hosting und Drittanbieter</h2>
<p>Domain, Hosting, Zahlungsdienste, Terminbuchungsdienste, KI/API-Konten und vergleichbare externe Konten sollen grundsätzlich auf den Kunden laufen, sofern nichts anderes vereinbart ist. Kosten und Bedingungen dieser Drittanbieter sind nicht Bestandteil des ERSTELLI-Preises, soweit sie nicht ausdrücklich einbezogen wurden.</p>
<p>ERSTELLI haftet nicht für Ausfälle, Preisänderungen, Sperrungen oder Änderungen externer Anbieter, soweit ERSTELLI diese nicht zu vertreten hat.</p>

<h2>11. Abnahme und Veröffentlichung</h2>
<p>Nach Fertigstellung erhält der Kunde Gelegenheit zur Prüfung. Erkannte Mängel sollen nachvollziehbar beschrieben werden. Nach Freigabe kann die Website veröffentlicht oder an den Kunden übergeben werden. Gesetzliche Mängelrechte bleiben unberührt.</p>

<h2>12. Nutzungsrechte</h2>
<p>Nach vollständiger Zahlung erhält der Kunde die für den vertraglich vorausgesetzten Betrieb seiner individuell erstellten Website erforderlichen Nutzungsrechte an den von ERSTELLI speziell für das Projekt erstellten Bestandteilen, soweit ERSTELLI diese Rechte übertragen darf. Rechte an vom Kunden gelieferten Inhalten sowie Rechte Dritter bleiben unberührt.</p>

<h2>13. SEO und wirtschaftlicher Erfolg</h2>
<p>SEO-Leistungen sind technische und inhaltliche Grundoptimierungen im vereinbarten Umfang. Eine bestimmte Platzierung bei Google oder anderen Suchmaschinen, eine bestimmte Anzahl an Besuchern, Anfragen, Verkäufen oder ein bestimmter wirtschaftlicher Erfolg werden nicht garantiert.</p>

<h2>14. Haftung</h2>
<p>ERSTELLI haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie nach den zwingenden gesetzlichen Vorschriften. Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt, soweit eine solche Begrenzung gesetzlich zulässig ist. Zwingende Haftung, insbesondere für Schäden aus Verletzung von Leben, Körper oder Gesundheit, bleibt unberührt.</p>

<h2>15. Fremdänderungen und Wartung</h2>
<p>Nach Übergabe vorgenommene Änderungen durch den Kunden oder Dritte können Funktionen beeinträchtigen. Wartung, laufende Aktualisierung, Sicherheitsüberwachung, Inhaltsänderungen oder Anpassungen an spätere Drittanbieter-Updates sind nur geschuldet, wenn sie ausdrücklich vereinbart wurden.</p>

<h2>16. Referenznennung</h2>
<p>Eine öffentliche Nutzung des Kundenprojekts als Referenz erfolgt nur im vereinbarten oder gesetzlich zulässigen Rahmen. Vertrauliche Inhalte werden nicht als Referenz veröffentlicht.</p>

<h2>17. Schlussbestimmungen</h2>
<p>Es gilt deutsches Recht unter Beachtung zwingender Verbraucherschutzvorschriften. Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, kann – soweit zulässig – ein Gerichtsstand am Sitz von ERSTELLI vereinbart werden. Sollten einzelne Bestimmungen unwirksam sein, bleiben die übrigen Bestimmungen im gesetzlichen Umfang unberührt.</p>

<p><b>Stand:</b> 31. August 2026</p>
<a class="back" href="index.html">← Zurück zu ERSTELLI</a></main></div></body></html>
erstelli.com

// ERSTELLI – Live-Konfiguration
// Die Supabase-Werte werden beim Live-Setup eingetragen.
window.ERSTELLI_CONFIG = {
  whatsappNumber: "491708990829",
  supabaseUrl: "https://jsbzjrxzgnpjwfrzfoxn.supabase.co",
  supabasePublishableKey: "sb_publishable_lDkFEBNXxU6nM6YTston1g_3XD31ZQr",
  requestFunction: "submit_request",
  reviewFunction: "submit_review",
  reviewsFunction: "public-reviews",
  analyticsFunction: "track-event",
  analyticsReportFunction: "analytics-report",
  completeOrderFunction: "complete-order",
  analyticsEnabled: true
};

<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Datenschutzerklärung | ERSTELLI</title>
<style>
:root{--ink:#10283e;--blue:#0877e8;--cyan:#38d6ff;--muted:#5e758a;--line:rgba(8,119,232,.12)}
*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:linear-gradient(145deg,#f9fdff,#eaf8ff 55%,#f6f4ff)}
.wrap{width:min(920px,calc(100% - 32px));margin:auto}.top{padding:24px 0}.brand{font-weight:950;letter-spacing:.08em;color:var(--blue);text-decoration:none}.brand small{display:block;letter-spacing:.03em;color:#688197;font-weight:700}
.card{background:rgba(255,255,255,.9);border:1px solid var(--line);box-shadow:0 24px 80px rgba(26,93,155,.1);border-radius:28px;padding:clamp(24px,5vw,54px);margin:18px 0 60px}
.eyebrow{font-size:12px;font-weight:900;letter-spacing:.14em;color:var(--blue)}h1{font-size:clamp(40px,7vw,68px);letter-spacing:-.05em;line-height:1;margin:10px 0 18px;background:linear-gradient(90deg,#0877e8,#35d5ff,#8175ff);-webkit-background-clip:text;background-clip:text;color:transparent}
h2{font-size:22px;margin:34px 0 10px}h3{font-size:16px;margin:22px 0 8px}p,li{line-height:1.72;color:#38536a;font-size:14px}a{color:#0877e8}.notice{padding:16px 18px;border-radius:15px;background:#eef9ff;border:1px solid var(--line);font-size:13px;line-height:1.6;color:#31526d}.back{display:inline-block;margin-top:20px;text-decoration:none;font-weight:800}
</style>
</head>
<body><div class="wrap"><div class="top"><a class="brand" href="index.html">ERSTELLI<small>Your Website.</small></a></div>
<main class="card"><div class="eyebrow">DATENSCHUTZ</div><h1>Datenschutzerklärung</h1>
<h2>1. Verantwortlicher</h2>
<p>Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:<br>Diamond Kluge – Einzelunternehmen<br>Stindestraße 3<br>12167 Berlin<br>Deutschland<br>E-Mail: <a href="mailto:erstelliyourwebsite@gmail.com">erstelliyourwebsite@gmail.com</a></p>

<h2>2. Hosting über GitHub Pages</h2>
<p>Diese Website wird über GitHub Pages, einen Dienst der GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA, bereitgestellt. Beim Aufruf der Website können technisch erforderliche Verbindungs- und Protokolldaten, insbesondere die IP-Adresse, verarbeitet werden. Die Verarbeitung erfolgt zur sicheren, stabilen und technisch fehlerfreien Bereitstellung der Website auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. GitHub kann Daten auch in den USA verarbeiten. Für internationale Datenübermittlungen gelten die vom Anbieter vorgesehenen datenschutzrechtlichen Garantien.</p>

<h2>3. Projektanfragen und Kontaktformular</h2>
<p>Wenn Sie eine Projektanfrage senden, verarbeiten wir die von Ihnen angegebenen Daten, insbesondere Name, Firma, E-Mail-Adresse, ausgewählte Leistungen, Designwünsche, Nachricht und sonstige freiwillige Angaben. Die Verarbeitung dient der Prüfung und Beantwortung Ihrer Anfrage sowie der Anbahnung eines möglichen Vertrags und erfolgt grundsätzlich auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO. Kommt kein Vertrag zustande, werden die Daten gelöscht, sobald sie für die Bearbeitung nicht mehr erforderlich sind und keine gesetzlichen oder berechtigten Gründe für eine weitere Speicherung bestehen.</p>

<h2>4. Datei-Uploads</h2>
<p>Sofern Sie im Rahmen einer Projektanfrage Logos, Bilder, PDF-Dateien oder andere Unterlagen hochladen, werden diese ausschließlich zur Bearbeitung Ihrer Anfrage und – bei späterem Vertragsschluss – zur Durchführung des Projekts verarbeitet. Bitte übermitteln Sie keine Daten Dritter, für deren Weitergabe Sie nicht berechtigt sind, und keine besonderen Kategorien personenbezogener Daten, soweit diese für das Projekt nicht erforderlich sind. Rechtsgrundlage ist grundsätzlich Art. 6 Abs. 1 lit. b DSGVO.</p>

<h2>5. Backend und Dateispeicherung über Supabase</h2>
<p>Für die technische Verarbeitung von Projektanfragen, Auftragscodes, Bewertungen und Datei-Uploads setzt ERSTELLI Supabase als Backend- und Speicherdienst ein. Anbieter ist Supabase, Inc., USA. Dabei werden die für die jeweilige Funktion erforderlichen personenbezogenen Daten verarbeitet. Für die produktive Datenbank wird eine EU-Region verwendet; die erforderlichen datenschutzrechtlichen Vereinbarungen mit dem Anbieter werden abgeschlossen. Rechtsgrundlage richtet sich nach dem jeweiligen Vorgang, insbesondere Art. 6 Abs. 1 lit. b DSGVO bei Projektanfragen und Vertragsabwicklung sowie Art. 6 Abs. 1 lit. f DSGVO bei technisch erforderlicher Sicherheit und Missbrauchsprävention.</p>

<h2>6. E-Mail-Versand über Resend</h2>
<p>Für den technischen Versand von Formular- und Transaktions-E-Mails wird der Dienst Resend der Resend, Inc., USA, eingesetzt. Dabei werden insbesondere Empfängeradresse, Absenderinformationen, Nachrichteninhalt und technische Versanddaten verarbeitet, soweit dies für die jeweilige E-Mail erforderlich ist. Rechtsgrundlage ist bei Projekt- und Vertragskommunikation grundsätzlich Art. 6 Abs. 1 lit. b DSGVO; für die zuverlässige und sichere technische Zustellung kann zusätzlich Art. 6 Abs. 1 lit. f DSGVO einschlägig sein. Soweit Daten in die USA übermittelt werden, erfolgt dies auf Grundlage der jeweils anwendbaren datenschutzrechtlichen Garantien des Anbieters.</p>

<h2>7. Kontakt per E-Mail</h2>
<p>Bei einer Kontaktaufnahme per E-Mail verarbeiten wir Ihre E-Mail-Adresse sowie die von Ihnen übermittelten Inhalte zur Bearbeitung Ihres Anliegens. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, soweit die Kommunikation der Vertragsanbahnung oder Vertragsdurchführung dient, im Übrigen Art. 6 Abs. 1 lit. f DSGVO aufgrund unseres berechtigten Interesses an der Bearbeitung geschäftlicher Anfragen.</p>

<h2>8. Kontakt über WhatsApp</h2>
<p>Auf der Website befindet sich ein Link zur Kontaktaufnahme über WhatsApp. Erst wenn Sie diesen Link nutzen, werden Sie zu WhatsApp weitergeleitet. Für WhatsApp gelten die Datenschutzbestimmungen des jeweiligen Anbieters. Bei einer anschließenden Kommunikation verarbeiten wir insbesondere Ihre Telefonnummer, Profilinformationen, soweit diese für uns sichtbar sind, sowie die von Ihnen übermittelten Nachrichten und Dateien. Die Verarbeitung erfolgt zur Bearbeitung Ihrer Anfrage auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO oder, soweit keine Vertragsanbahnung vorliegt, Art. 6 Abs. 1 lit. f DSGVO. Sie können ERSTELLI alternativ jederzeit per E-Mail kontaktieren.</p>

<h2>9. Kundenbewertungen</h2>
<p>Nach abgeschlossenen Aufträgen kann ERSTELLI Kunden die Möglichkeit geben, über einen Auftragscode eine Bewertung abzugeben. Verarbeitet werden dabei insbesondere Auftragscode, Bewertung, Bewertungstext sowie freiwillig angegebener Name oder Firmenname. Der Auftragscode dient der Prüfung, ob eine Bewertung einem tatsächlichen Auftrag zugeordnet werden kann. Eine Veröffentlichung personenbezogener Angaben erfolgt nur im dafür vorgesehenen Umfang. Rechtsgrundlage ist je nach Ausgestaltung Art. 6 Abs. 1 lit. a DSGVO bei einer Einwilligung oder Art. 6 Abs. 1 lit. f DSGVO für die Prüfung und Missbrauchsprävention. Eine erteilte Einwilligung kann mit Wirkung für die Zukunft widerrufen werden.</p>

<h2>10. Cookies, lokale Speicherung und Tracking</h2>
<p>ERSTELLI setzt derzeit keine Marketing- oder Analyse-Cookies und kein personenbezogenes Werbetracking ein. Technisch notwendige lokale Browser-Speicherungen können eingesetzt werden, um Eingaben oder die Konfiguration während der Nutzung der Website zu erhalten. Werden künftig Analyse-, Marketing-, Karten-, Video- oder vergleichbare Dienste eingebunden, wird diese Datenschutzerklärung vor deren Einsatz angepasst und – soweit erforderlich – zuvor eine Einwilligung eingeholt.</p>

<h2>11. Empfänger und Drittlandübermittlungen</h2>
<p>Personenbezogene Daten erhalten nur diejenigen Dienstleister und Empfänger, die für Hosting, technische Bereitstellung, Kommunikation, Vertragsabwicklung oder die Erfüllung gesetzlicher Pflichten erforderlich sind. Bei Anbietern außerhalb der EU bzw. des EWR werden die gesetzlichen Voraussetzungen für eine Drittlandübermittlung beachtet, insbesondere ein Angemessenheitsbeschluss oder geeignete Garantien wie Standardvertragsklauseln, soweit erforderlich.</p>

<h2>12. Speicherdauer</h2>
<p>Personenbezogene Daten werden nur so lange gespeichert, wie sie für den jeweiligen Zweck erforderlich sind. Kommt ein Vertrag zustande, können vertrags- und abrechnungsbezogene Daten aufgrund gesetzlicher handels- und steuerrechtlicher Aufbewahrungspflichten länger gespeichert werden. Daten ohne fortbestehenden Zweck oder gesetzliche Aufbewahrungspflicht werden gelöscht.</p>

<h2>13. Ihre Rechte</h2>
<p>Sie haben nach Maßgabe der DSGVO insbesondere das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Datenübertragbarkeit. Soweit eine Verarbeitung auf Art. 6 Abs. 1 lit. f DSGVO beruht, steht Ihnen bei Vorliegen der gesetzlichen Voraussetzungen ein Widerspruchsrecht zu. Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen.</p>

<h2>14. Beschwerderecht</h2>
<p>Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren. Für den Verantwortlichen in Berlin ist insbesondere die Berliner Beauftragte für Datenschutz und Informationsfreiheit zuständig.</p>

<h2>15. Sicherheit</h2>
<p>ERSTELLI trifft angemessene technische und organisatorische Maßnahmen zum Schutz personenbezogener Daten. Die produktive Website wird verschlüsselt über HTTPS bereitgestellt. Zugangsschlüssel und sonstige Geheimnisse für Backend- oder E-Mail-Dienste werden nicht im öffentlich ausgelieferten Frontend gespeichert.</p>

<p><b>Stand:</b> 31. August 2026</p>
<a class="back" href="index.html">← Zurück zu ERSTELLI</a>
<section class="legal-section"><h2>Reichweitenmessung und Nutzungsanalyse</h2><p>Zur Verbesserung unserer Website erfassen wir in eigener Verantwortung technische Nutzungsereignisse, beispielsweise Seitenaufrufe, erreichte Seitenbereiche, Scrolltiefe, Klicks auf Website-Pakete und Zusatzfunktionen sowie den Beginn und erfolgreichen Abschluss einer Projektanfrage. Die Auswertung erfolgt über unsere Supabase-Infrastruktur.</p><p>Für diese Reichweitenmessung setzen wir keine Analyse-Cookies, kein LocalStorage, kein geräteübergreifendes Profiling und kein Fingerprinting ein. Pro geladenem Seitenaufruf wird lediglich eine zufällige, nur im Arbeitsspeicher der geöffneten Seite vorhandene Sitzungskennung erzeugt. Eine Wiedererkennung bei einem späteren Besuch findet dadurch nicht statt. Gespeichert werden ausschließlich die für die Auswertung vorgesehenen Ereignisse sowie gegebenenfalls die Domain der verweisenden Website und ausdrücklich übergebene Kampagnenparameter. IP-Adressen werden von uns nicht in der Analytics-Tabelle gespeichert.</p><p>Die Verarbeitung dient unserem berechtigten Interesse, die Nutzung und Wirksamkeit unseres Internetauftritts zu verstehen und unser Angebot zu verbessern (Art. 6 Abs. 1 lit. f DSGVO). Analytics-Ereignisse werden grundsätzlich spätestens nach 90 Tagen gelöscht.</p></section>
</main></div></body></html>
<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Impressum | ERSTELLI</title>
<style>
:root{--ink:#10283e;--blue:#0877e8;--cyan:#38d6ff;--muted:#5e758a;--line:rgba(8,119,232,.12)}
*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:linear-gradient(145deg,#f9fdff,#eaf8ff 55%,#f6f4ff)}
.wrap{width:min(920px,calc(100% - 32px));margin:auto}.top{padding:24px 0}.brand{font-weight:950;letter-spacing:.08em;color:var(--blue);text-decoration:none}.brand small{display:block;letter-spacing:.03em;color:#688197;font-weight:700}
.card{background:rgba(255,255,255,.9);border:1px solid var(--line);box-shadow:0 24px 80px rgba(26,93,155,.1);border-radius:28px;padding:clamp(24px,5vw,54px);margin:18px 0 60px}
.eyebrow{font-size:12px;font-weight:900;letter-spacing:.14em;color:var(--blue)}h1{font-size:clamp(40px,7vw,68px);letter-spacing:-.05em;line-height:1;margin:10px 0 18px;background:linear-gradient(90deg,#0877e8,#35d5ff,#8175ff);-webkit-background-clip:text;background-clip:text;color:transparent}
h2{font-size:22px;margin:34px 0 10px}h3{font-size:16px;margin:22px 0 8px}p,li{line-height:1.72;color:#38536a;font-size:14px}a{color:#0877e8}.notice{padding:16px 18px;border-radius:15px;background:#eef9ff;border:1px solid var(--line);font-size:13px;line-height:1.6;color:#31526d}.back{display:inline-block;margin-top:20px;text-decoration:none;font-weight:800}

.whatsapp-number{font-weight:800;color:#0877e8}
.whatsapp-number a{font-weight:850;text-decoration:none;color:#0877e8}
.whatsapp-number a:hover{text-decoration:underline}
</style>
</head>
<body><div class="wrap"><div class="top"><a class="brand" href="index.html">ERSTELLI<small>Your Website.</small></a></div>
<main class="card"><div class="eyebrow">ANBIETERKENNZEICHNUNG</div><h1>Impressum</h1>
<h2>Angaben gemäß § 5 DDG</h2>
<p>Diamond Kluge<br>Einzelunternehmen<br>Stindestraße 3<br>12167 Berlin<br>Deutschland</p>

<h2>Umsatzsteuer</h2>
<p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:<br><strong>DE460445569</strong></p>
<p>Gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen.</p>

<h2>Kontakt</h2>
<p>E-Mail: <a href="mailto:erstelliyourwebsite@gmail.com">erstelliyourwebsite@gmail.com</a><br>
WhatsApp: <span class="whatsapp-number"><a href="https://wa.me/491708990829" target="_blank" rel="noopener">+49 170 8990829</a></span></p>

<a class="back" href="index.html">← Zurück zu ERSTELLI</a></main></div></body></html>
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ERSTELLI – Your Website</title>
<meta name="description" content="ERSTELLI – individuelle Websites mit transparentem Klick-Preisrechner.">
<link rel="stylesheet" href="style.css">
</head>
<body>
<canvas id="codeRain"></canvas>
<div class="aurora a1"></div><div class="aurora a2"></div>
<header class="nav">
  <a class="brand" href="#top"><span class="logo">&lt;/&gt;</span><span class="brand-stack"><b>ERSTELLI</b><small>Your Website.</small></span></a>
  <nav><a href="#leistungen">Leistungen</a><a href="#referenzen">Referenzen</a><a href="#bewertungen">Bewertungen</a><a href="#konfigurator">Konfigurator</a><a href="#ablauf">Ablauf</a><a href="#faq">FAQ</a><a href="#kontakt">Kontakt</a></nav>
  <a class="cta small" href="#konfigurator">Preis berechnen</a>
</header>
<main id="top">
<section class="hero shell">
  <div class="hero-copy reveal">
    <div class="badge"><i></i> MODERNE WEBSITES · KLARE FESTPREISE</div>
    <h1>Deine Website. <span>Dein digitaler Auftritt.</span></h1>
    <p>Für Handwerker, Selbstständige und Unternehmen, die professionell auftreten und online leichter Anfragen gewinnen möchten. Wir bauen deine Website modern, verständlich und passend zu deinem Betrieb – ohne unnötigen Agentur-Ballast.</p>
    <p class="hero-support">Du entscheidest selbst, was du brauchst. Wir erklären dir jeden Schritt, setzen die Technik um und begleiten dich bis zur fertigen Veröffentlichung.</p>
    <div class="actions"><a class="cta" href="#konfigurator">Website zusammenklicken →</a><a class="ghost" href="#leistungen">Leistungen ansehen</a></div>
    <div class="facts"><div><strong>ab 299 €</strong><span>Onepager</span></div><div><strong>ab 499 €</strong><span>Business</span></div><div><strong>Live-Preis</strong><span>beim Auswählen</span></div></div>
  </div>
  <div class="hero-visual reveal delay1">
    <div class="codey-stage" aria-label="Codey, das ERSTELLI-Maskottchen">
      <div class="codey-halo"></div>
      <div class="codey-shadow"></div>

      <div class="codey" id="codey">
        <div class="codey-symbol">
          <span class="code-piece code-left">&lt;</span>
          <span class="code-piece code-slash">/</span>
          <span class="code-piece code-right">&gt;</span>

          <span class="eye eye-left"><i></i></span>
          <span class="eye eye-right"><i></i></span>
          <span class="brow brow-left"></span>
          <span class="brow brow-right"></span>
          <span class="mouth"></span>
        </div>

        <div class="arm arm-left"></div>
        <div class="arm arm-right"></div>
        <div class="leg leg-left"><span class="shoe3d"><i class="shoe-upper"></i><i class="shoe-toe"></i><i class="shoe-laces"></i><i class="shoe-sole"></i><i class="shoe-glow"></i></span></div>
        <div class="leg leg-right"><span class="shoe3d"><i class="shoe-upper"></i><i class="shoe-toe"></i><i class="shoe-laces"></i><i class="shoe-sole"></i><i class="shoe-glow"></i></span></div>
      </div>

      <div class="codey-bubble">
        <strong>Hi, ich bin Erstelli.</strong>
        <span>Klick dir deine Website zusammen – der Preis rechnet sich live.</span>
      </div>
</div>
  </div>
</section>

<section class="trust-strip shell reveal" aria-label="Vertrauen">
  <div class="trust-item"><b>✓</b><span><strong>Klare Preise</strong><small>Du siehst vorab, was deine Auswahl kostet.</small></span></div>
  <div class="trust-item"><b>✓</b><span><strong>Persönliche Abstimmung</strong><small>Keine anonyme Baukasten-Abfertigung.</small></span></div>
  <div class="trust-item"><b>✓</b><span><strong>Deine Domain bleibt deine</strong><small>Konten und Zugänge bleiben beim Kunden.</small></span></div>
  <div class="trust-item"><b>✓</b><span><strong>Später erweiterbar</strong><small>Neue Seiten und Funktionen können ergänzt werden.</small></span></div>
</section>


<section id="leistungen" class="section shell">
  <div class="head reveal"><span>LEISTUNGEN</span><h2>Genau das auswählen, was du wirklich brauchst.</h2><p>Keine undurchsichtigen Pakete und keine Funktionen, die du später nie nutzt. Du startest mit einer klaren Grundseite und ergänzt nur das, was für deinen Betrieb wirklich sinnvoll ist.</p></div>
  <div class="grid3">
    <article class="card reveal"><b>&lt;/&gt;</b><h3>Individuelles Design</h3><p>Kein Baukasten-Look. Farben, Typografie, Animationen und Aufbau werden passend zum Betrieb gestaltet.</p></article>
    <article class="card reveal delay1"><b>◎</b><h3>Mobil & schnell</h3><p>Optimiert für Smartphone, Tablet und Desktop – mit sauberem, responsivem Aufbau.</p></article>
    <article class="card reveal delay2"><b>✦</b><h3>Funktionen nach Bedarf</h3><p>KI-Chat, Terminbuchung, Zahlungsanbieter, Multi-Step-Formulare, Galerien und mehr.</p></article>
  </div>
</section>


<section id="referenzen" class="section shell">
  <div class="head reveal">
    <span>BEISPIELE</span>
    <h2>So kann dein neuer Auftritt aussehen.</h2>
    <p>Jede Seite bekommt ihre eigene Optik. Die Beispiele zeigen unterschiedliche Richtungen – klar, hochwertig und auf Anfragen ausgelegt.</p>
  </div>

  <div class="reference-grid">
    <article class="reference-card reveal">
      <div class="ref-browser">
        <div class="ref-top"><i></i><i></i><i></i><span>handwerk-muster.de</span></div>
        <div class="ref-body craft">
          <div class="ref-nav"></div>
          <div class="ref-copy"><small>MEISTERBETRIEB</small><h3>Saubere Arbeit.<br>Klare Anfrage.</h3><p class="short"></p><button>Projekt anfragen</button></div>
          <div class="ref-shape"></div>
        </div>
      </div>
      <div class="ref-meta"><strong>Handwerksbetrieb</strong><span>Leistungen · Referenzen · Kontakt</span></div>
    </article>

    <article class="reference-card reveal delay1">
      <div class="ref-browser">
        <div class="ref-top"><i></i><i></i><i></i><span>studio-muster.de</span></div>
        <div class="ref-body studio">
          <div class="ref-nav"></div>
          <div class="ref-copy"><small>MODERNES STUDIO</small><h3>Weniger Ablenkung.<br>Mehr Wirkung.</h3><p class="short"></p><button>Termin ansehen</button></div>
          <div class="ref-shape"></div>
        </div>
      </div>
      <div class="ref-meta"><strong>Selbstständig / Studio</strong><span>Branding · Buchung · Mobil</span></div>
    </article>

    <article class="reference-card reveal delay2">
      <div class="ref-browser">
        <div class="ref-top"><i></i><i></i><i></i><span>firma-muster.de</span></div>
        <div class="ref-body company">
          <div class="ref-nav"></div>
          <div class="ref-copy"><small>UNTERNEHMEN</small><h3>Vertrauen auf den<br>ersten Blick.</h3><p class="short"></p><button>Mehr erfahren</button></div>
          <div class="ref-shape"></div>
        </div>
      </div>
      <div class="ref-meta"><strong>Firmenwebsite</strong><span>Mehrere Seiten · SEO · Anfrage</span></div>
    </article>
  </div>
  <p class="reference-note">Beispiel-Layouts zur Veranschaulichung – dein Projekt wird individuell angepasst.</p>
</section>
<section id="konfigurator" class="section shell configurator-section">
  <div class="head reveal"><span>KLICK-KONFIGURATOR</span><h2>Baue deine Website zusammen.</h2><p>Jede Auswahl verändert den Preis sofort. So weißt du direkt, womit du ungefähr rechnen kannst.</p><div class="config-hint"><span>Beispiel:</span> Onepager + KI-Chatbot + Terminbuchung = <strong>597 €</strong></div></div>
  <div class="config-layout reveal">
    <div class="config-options">
      <div class="config-block">
        <div class="config-title"><span>1</span><div><h3>Grundpaket</h3><p>Wähle die Größe deiner Website.</p></div></div>
        <div class="choice-grid packages">
          <button class="choice active" data-type="base" data-name="Onepager" data-price="299" data-pages="1"><strong>Onepager</strong><span>1 Seite</span><em>299 €</em></button>
          <button class="choice" data-type="base" data-name="Business" data-price="499" data-pages="5"><strong>Business</strong><span>bis 5 Seiten</span><em>499 €</em></button>
          <button class="choice" data-type="base" data-name="Pro" data-price="799" data-pages="10"><strong>Pro</strong><span>bis 10 Seiten</span><em>799 €</em></button>
        </div>
      </div>

      <div class="config-block">
        <div class="config-title"><span>2</span><div><h3>Zusatzfunktionen</h3><p>Nur anklicken, was eingebaut werden soll.</p></div></div>
        <div class="choice-grid addons">
          <button class="choice toggle" data-name="KI-Chatbot" data-price="199"><strong>KI-Chatbot</strong><span>Assistent im Hintergrund</span><em>+199 €</em></button>
          <button class="choice toggle" data-name="Zahlungsanbieter" data-price="149"><strong>Zahlungsanbieter</strong><span>z. B. Stripe / PayPal</span><em>+149 €</em></button>
          <button class="choice toggle" data-name="Terminbuchung" data-price="99"><strong>Terminbuchung</strong><span>Buchungsfunktion</span><em>+99 €</em></button>
          <button class="choice toggle" data-name="Multi-Step Anfrage" data-price="79"><strong>Multi-Step Anfrage</strong><span>mehrstufiges Formular</span><em>+79 €</em></button>
          <button class="choice toggle" data-name="Galerie / Referenzen" data-price="49"><strong>Galerie / Referenzen</strong><span>Arbeiten präsentieren</span><em>+49 €</em></button>
          <button class="choice toggle" data-name="SEO Basis" data-price="59"><strong>SEO Basis</strong><span>Meta, Struktur, Indexierung</span><em>+59 €</em></button>
        </div>
      </div>

      <div class="config-block">
        <div class="config-title"><span>3</span><div><h3>Überarbeitungen</h3><p>Eine Korrekturrunde ist inklusive.</p></div></div>
        <div class="counter-row"><div><strong>Zusätzliche Korrekturrunden</strong><small>+39 € pro Runde</small></div><div class="counter"><button id="revMinus" type="button">−</button><strong id="revCount">0</strong><button id="revPlus" type="button">+</button></div></div>
      </div>

      <div class="config-block">
        <div class="config-title"><span>4</span><div><h3>Optionale Einrichtung</h3><p>Für einen komplett fertigen Start.</p></div></div>
        <div class="choice-grid addons">
          <button class="choice toggle" data-name="Domain & Hosting Einrichtung" data-price="49"><strong>Domain & Hosting</strong><span>technische Einrichtung</span><em>+49 €</em></button>
          <button class="choice toggle" data-name="Business E-Mail Einrichtung" data-price="39"><strong>Business E-Mail</strong><span>z. B. info@firma.de</span><em>+39 €</em></button>
        </div>
      </div>
    </div>

    <aside class="price-panel">
      <div class="price-sticky">
        <span class="eyebrow">DEINE AUSWAHL</span>
        <div class="live-price"><small>voraussichtlich</small><strong id="totalPrice">299 €</strong><small class="tax-note">Endpreis · gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen</small></div>
        <div id="summary" class="summary"></div>
        <div class="price-note">Der Preis ist eine transparente Ersteinschätzung. Sehr individuelle Sonderfunktionen werden separat abgestimmt.</div>
        <a class="cta full" href="#kontakt" id="useConfig">Konfiguration anfragen →</a>
      </div>
    </aside>
  </div>
</section>


<section class="section shell reassurance">
  <div class="head reveal">
    <span>WARUM WEBSITE ERSTELLER?</span>
    <h2>Du sollst wissen, was passiert – und dich dabei gut aufgehoben fühlen.</h2>
    <p>Eine neue Website soll kein Technikprojekt für dich werden. Du lieferst die Informationen zu deinem Betrieb, wir kümmern uns um Aufbau, Design und technische Umsetzung.</p>
  </div>

  <div class="grid4">
    <article class="benefit reveal"><span>01</span><h3>Verständliche Beratung</h3><p>Wir erklären Funktionen ohne Fachbegriffe und sagen dir auch, wenn etwas für deinen Betrieb unnötig ist.</p></article>
    <article class="benefit reveal delay1"><span>02</span><h3>Individuell statt Baukasten</h3><p>Farben, Aufbau und Inhalte werden auf dein Unternehmen abgestimmt – nicht einfach nur ein Template umgefärbt.</p></article>
    <article class="benefit reveal delay2"><span>03</span><h3>Transparente Kosten</h3><p>Du siehst im Konfigurator eine klare Ersteinschätzung. Sonderwünsche werden vorher besprochen.</p></article>
    <article class="benefit reveal delay3"><span>04</span><h3>Auch danach erreichbar</h3><p>Bei späteren Änderungen oder Erweiterungen musst du nicht wieder bei null anfangen.</p></article>
  </div>
</section>

<section class="section shell handover-section">
  <div class="handover-card reveal">
    <div class="handover-copy">
      <span>WAS WIR VON DIR BRAUCHEN</span>
      <h2>Du kennst deinen Betrieb. Wir machen daraus die Website.</h2>
      <p>Für den Start reichen die wichtigsten Informationen. Wenn noch nicht alles perfekt vorbereitet ist, ist das kein Problem – wir gehen die fehlenden Punkte gemeinsam durch.</p>
      <ul>
        <li><b>Logo & Farben</b><span>falls vorhanden</span></li>
        <li><b>Leistungen</b><span>was du anbietest</span></li>
        <li><b>Bilder</b><span>eigene Fotos oder passende Bildrichtung</span></li>
        <li><b>Kontaktdaten</b><span>Telefon, E-Mail, Standort</span></li>
      </ul>
    </div>
    <div class="handover-side">
      <div class="handover-badge">Technik übernehmen wir.</div>
      <div class="handover-list">
        <div><i>✓</i><span>Responsive Design</span></div>
        <div><i>✓</i><span>Technische Einrichtung</span></div>
        <div><i>✓</i><span>Formulare & Funktionen</span></div>
        <div><i>✓</i><span>Veröffentlichung</span></div>
      </div>
    </div>
  </div>
</section>

<section class="section shell ownership-section">
  <div class="ownership-card reveal">
    <div>
      <span>DOMAIN & HOSTING</span>
      <h2>Deine Website bleibt auch technisch deine.</h2>
      <p>Domain, Hosting und externe Konten werden idealerweise auf deinen Namen angelegt. Wir helfen bei der Einrichtung und verbinden alles technisch. So behältst du die Kontrolle über deine Zugänge und bist nicht dauerhaft an uns gebunden.</p>
    </div>
    <div class="ownership-points">
      <div><b>Domain</b><span>bleibt beim Kunden</span></div>
      <div><b>Hosting</b><span>Einrichtung auf Wunsch</span></div>
      <div><b>Zahlung & APIs</b><span>über eigene Kundenkonten</span></div>
    </div>
  </div>
</section>
<section id="ablauf" class="section shell">
  <div class="head reveal"><span>ABLAUF</span><h2>Einfach statt Agentur-Theater.</h2></div>
  <div class="steps4">
    <article class="step reveal"><span>01</span><h3>Zusammenklicken</h3><p>Du stellst dir deine Website im Konfigurator zusammen.</p></article>
    <article class="step reveal delay1"><span>02</span><h3>Inhalte schicken</h3><p>Logo, Bilder, Texte und Wünsche kommen zu uns.</p></article>
    <article class="step reveal delay2"><span>03</span><h3>Wir bauen</h3><p>Design, Programmierung, Animation und Funktionen werden umgesetzt.</p></article>
    <article class="step reveal delay3"><span>04</span><h3>Online</h3><p>Nach deiner Freigabe wird die Website veröffentlicht.</p></article>
  </div>
</section>



<section id="bewertungen" class="section shell reviews-section">
  <div class="head reveal">
    <span>KUNDENSTIMMEN</span>
    <h2>Bewertungen von echten Projekten.</h2>
    <p>Bewertungen können erst nach einem abgeschlossenen Auftrag über einen persönlichen Bewertungslink abgegeben werden.</p>
  </div>

  <div id="reviewsGrid" class="reviews-grid reveal">
    <article class="review-empty" id="reviewEmpty">
      <div class="review-stars">☆☆☆☆☆</div>
      <strong>Kundenbewertungen</strong>
      <p>Bewertungen stammen von abgeschlossenen ERSTELLI-Projekten und werden vor der Veröffentlichung geprüft.</p>
    </article>
  </div>

  <div class="review-note reveal">
    <a class="review-submit-btn" href="review.html">Bewertung abgeben →</a>
    <span>Projekt abgeschlossen?</span>
    <p>Nach Abschluss erhält der Kunde einen persönlichen Bewertungslink mit Auftragscode. So kann nicht einfach jeder eine Bewertung veröffentlichen.</p>
  </div>
</section>

<section id="faq" class="section shell faq-section">
  <div class="head reveal">
    <span>HÄUFIGE FRAGEN</span>
    <h2>Das Wichtigste vor deiner Anfrage.</h2>
    <p>Damit du schon vorher weißt, wie die Zusammenarbeit abläuft.</p>
  </div>

  <div class="faq-list">
    <details class="faq-item reveal">
      <summary>Wie lange dauert eine Website?</summary>
      <p>Ein einfacher Onepager kann bei vollständigen Inhalten sehr schnell umgesetzt werden. Größere Projekte brauchen entsprechend länger. Vor dem Start bekommst du eine realistische Einschätzung.</p>
    </details>
    <details class="faq-item reveal delay1">
      <summary>Wem gehört die Website nach Fertigstellung?</summary>
      <p>Die für dein Projekt erstellten Website-Dateien und deine eigenen Konten bleiben bei dir. Domain und Hosting sollten ebenfalls auf deinen Namen laufen.</p>
    </details>
    <details class="faq-item reveal delay2">
      <summary>Kann ich später weitere Funktionen ergänzen?</summary>
      <p>Ja. Die Website wird so aufgebaut, dass später weitere Seiten, Formulare, Terminbuchung oder andere Funktionen ergänzt werden können.</p>
    </details>
    <details class="faq-item reveal">
      <summary>Was passiert, wenn ich noch keine Domain habe?</summary>
      <p>Kein Problem. Du kannst Domain und Hosting selbst buchen und wir helfen dir bei der technischen Einrichtung und Veröffentlichung.</p>
    </details>
    <details class="faq-item reveal delay1">
      <summary>Was ist bei SEO Basis enthalten?</summary>
      <p>Die technische Grundoptimierung umfasst unter anderem Seitentitel, Meta-Daten, saubere Überschriftenstruktur, Bildbeschreibungen und eine für Suchmaschinen verständliche Seitenstruktur.</p>
    </details>
    <details class="faq-item reveal delay2">
      <summary>Muss ich direkt bezahlen, wenn ich den Konfigurator nutze?</summary>
      <p>Nein. Der Konfigurator dient zunächst nur als transparente Preiseinschätzung. Erst nach deiner Anfrage und gemeinsamer Abstimmung entsteht ein Auftrag.</p>
    </details>
  </div>
</section>
<section id="kontakt" class="section shell">
  <div class="contact reveal">
    <div class="contact-copy"><span>PROJEKT STARTEN</span><h2>Schick uns deine Konfiguration.</h2><p>Die ausgewählten Funktionen werden automatisch übernommen. Du kannst zusätzlich kurz beschreiben, was du dir vorstellst.</p></div>
    <form id="projectForm">
      <div class="legal-status"><b>Unverbindliche Projektanfrage</b><span>Mit dem Absenden kommt noch kein Vertrag zustande. ERSTELLI kann Anfragen annehmen oder ablehnen.</span></div>
      <div class="two"><input id="name" name="name" required placeholder="Name"><input id="company" name="company" placeholder="Firma"></div>
      <div class="two"><input id="email" name="email" type="email" required placeholder="E-Mail"><input id="phone" name="phone" placeholder="Telefon / WhatsApp (optional)"></div>
      <textarea id="configText" name="config" rows="6" readonly></textarea>
      
      <section class="project-questions" aria-labelledby="projectQuestionsTitle">
        <div class="project-questions-head">
          <span>DEIN WUNSCHDESIGN</span>
          <h3 id="projectQuestionsTitle">Wie soll deine Website wirken?</h3>
          <p>Ein paar kurze Angaben helfen uns, deinen gewünschten Stil direkt besser einzuschätzen.</p>
        </div>

        <div class="project-question">
          <div class="question-title"><b>01</b><span>Welche Farbrichtung soll deine Website haben?</span></div>
          <div class="color-choice-grid" role="group" aria-label="Farbrichtung">
            <label class="color-choice">
              <input type="radio" name="siteColor" value="Blau / Cyan">
              <span class="color-preview color-blue"></span><span>Blau / Cyan</span>
            </label>
            <label class="color-choice">
              <input type="radio" name="siteColor" value="Schwarz / Dunkel">
              <span class="color-preview color-dark"></span><span>Schwarz / Dunkel</span>
            </label>
            <label class="color-choice">
              <input type="radio" name="siteColor" value="Warm / Beige">
              <span class="color-preview color-warm"></span><span>Warm / Beige</span>
            </label>
            <label class="color-choice">
              <input type="radio" name="siteColor" value="Grün / Natürlich">
              <span class="color-preview color-green"></span><span>Grün / Natürlich</span>
            </label>
            <label class="color-choice">
              <input type="radio" name="siteColor" value="Violett / Modern">
              <span class="color-preview color-violet"></span><span>Violett / Modern</span>
            </label>
            <label class="color-choice">
              <input type="radio" name="siteColor" value="Rot / Bordeaux">
              <span class="color-preview color-red"></span><span>Rot / Bordeaux</span>
            </label>
            <label class="color-choice">
              <input type="radio" name="siteColor" value="Orange / Energie">
              <span class="color-preview color-orange"></span><span>Orange / Energie</span>
            </label>
            <label class="color-choice">
              <input type="radio" name="siteColor" value="Eigene Farben">
              <span class="color-preview color-custom">+</span><span>Eigene Farben</span>
            </label>
          </div>
          <input id="customColors" name="customColors" class="question-extra" placeholder="Eigene Farben, z. B. Dunkelblau + Gold (optional)">
        </div>

        <div class="project-question">
          <div class="question-title"><b>02</b><span>Welcher Stil passt am besten zu deinem Unternehmen?</span></div>
          <div class="choice-chips">
            <label><input type="radio" name="siteStyle" value="Modern & klar"><span>Modern & klar</span></label>
            <label><input type="radio" name="siteStyle" value="Premium & elegant"><span>Premium & elegant</span></label>
            <label><input type="radio" name="siteStyle" value="Minimalistisch"><span>Minimalistisch</span></label>
            <label><input type="radio" name="siteStyle" value="Auffällig & kreativ"><span>Auffällig & kreativ</span></label>
            <label><input type="radio" name="siteStyle" value="Seriös & klassisch"><span>Seriös & klassisch</span></label>
          </div>
        </div>

        <div class="project-question">
          <div class="question-title"><b>03</b><span>Was soll ein Besucher auf deiner Website hauptsächlich tun?</span></div>
          <div class="choice-chips">
            <label><input type="radio" name="siteGoal" value="Kontakt aufnehmen"><span>Kontakt aufnehmen</span></label>
            <label><input type="radio" name="siteGoal" value="Termin buchen"><span>Termin buchen</span></label>
            <label><input type="radio" name="siteGoal" value="Leistungen ansehen"><span>Leistungen ansehen</span></label>
            <label><input type="radio" name="siteGoal" value="Angebot anfragen"><span>Angebot anfragen</span></label>
            <label><input type="radio" name="siteGoal" value="Produkte / Projekt zeigen"><span>Produkte / Referenzen ansehen</span></label>
          </div>
        </div>

        <div class="project-question">
          <div class="question-title"><b>04</b><span>Hast du bereits Inhalte für die Website?</span></div>
          <div class="choice-chips">
            <label><input type="radio" name="contentStatus" value="Ja, Texte und Bilder"><span>Ja, Texte & Bilder</span></label>
            <label><input type="radio" name="contentStatus" value="Teilweise vorhanden"><span>Teilweise vorhanden</span></label>
            <label><input type="radio" name="contentStatus" value="Noch nichts vorhanden"><span>Noch nichts vorhanden</span></label>
          </div>
        </div>
      </section>

      <label class="message-label" for="message">
        <span>Zusätzliche Wünsche</span>
        <small>Hier kannst du alles ergänzen, was dir besonders wichtig ist.</small>
      </label>

      <textarea id="message" name="message" rows="4" placeholder="Zum Beispiel bestimmte Bereiche, Funktionen, Vorbilder oder andere Wünsche …"></textarea>
      <label class="upload-box premium-upload" for="projectFiles">
        <div class="upload-head">
          <div class="upload-symbol" aria-hidden="true">
            <span class="upload-arrow">↑</span>
          </div>
          <div>
            <span class="upload-title">Dateien & Bilder hinzufügen</span>
            <span class="upload-copy">Logo, Fotos, PDF oder vorhandene Unterlagen</span>
          </div>
        </div>
        <input id="projectFiles" name="files" type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt">
        <div class="upload-action">
          <span class="upload-button-look">Dateien auswählen</span>
          <span class="upload-limit">Mehrere Dateien möglich · bis 15 MB je Datei</span>
        </div>
        <span id="fileList" class="file-list">Noch keine Dateien ausgewählt.</span>
      </label>
      <input type="hidden" id="requestId" name="requestId">
      <label class="legal-check"><input type="checkbox" required><span>Ich habe die <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutzhinweise</a> zur Verarbeitung meiner Projektanfrage zur Kenntnis genommen. Die <a href="agb.html" target="_blank" rel="noopener">AGB</a> sind hier einsehbar.</span></label>
      <button class="cta full" id="submitRequest" type="submit">Konfiguration unverbindlich senden →</button>
      <div id="requestStatus" class="request-status" role="status" aria-live="polite"></div>
      <small id="formNote">Deine Anfrage wird geprüft. Wir melden uns anschließend persönlich bei dir.</small>
      <div class="contact-direct">
        <span>Direkter Kontakt</span>
        <a href="mailto:erstelliyourwebsite@gmail.com">E-Mail: erstelliyourwebsite@gmail.com</a>
        <a id="contactWhatsapp" class="whatsapp-text-link whatsapp-direct-btn" href="https://wa.me/491708990829?text=Hallo%20ERSTELLI%2C%20ich%20interessiere%20mich%20f%C3%BCr%20eine%20Website%20und%20h%C3%A4tte%20eine%20kurze%20Frage." target="_blank" rel="noopener">WhatsApp-Chat öffnen →</a>
      </div>
    </form>
  </div>
</section>
</main>

<a id="whatsappFloat" class="whatsapp-float" href="https://wa.me/491708990829?text=Hallo%20ERSTELLI%2C%20ich%20interessiere%20mich%20f%C3%BCr%20eine%20Website%20und%20h%C3%A4tte%20eine%20kurze%20Frage." target="_blank" rel="noopener" aria-label="ERSTELLI über WhatsApp kontaktieren">
  <span class="wa-dot"></span>
  <span><b>WhatsApp</b><small>Kurze Frage? Schreib uns.</small></span>
</a>


<footer class="shell footer">
      <div class="brand"><span class="logo">&lt;/&gt;</span><span>ERSTELLI</span></div>
      <span class="footer-claim">Websites für Selbstständige & Unternehmen.</span>
      <div class="footer-links"><a href="#faq">FAQ</a><a href="#kontakt">Kontakt</a><a href="agb.html" target="_blank" rel="noopener">AGB</a><a href="impressum.html" target="_blank" rel="noopener">Impressum</a><a href="datenschutz.html" target="_blank" rel="noopener">Datenschutz</a><a href="widerruf.html" target="_blank" rel="noopener">Widerruf</a></div>
    </footer>

<script src="config.js"></script>
<script src="script.js"></script>
</body>
</html>

ERSTELLI – LIVE-SETUP V31

Die Website ist frontendseitig für den Livebetrieb vorbereitet. Für echte Anfragen, Uploads,
Bewertungen und Analytics muss ein Supabase-Projekt verbunden werden.

1. backend/supabase.sql im gewünschten ERSTELLI-Supabase-Projekt ausführen.
2. Edge Functions deployen:
   - submit-request
   - submit-review
   - public-reviews
   - complete-order
   - track-event
   - analytics-report
3. Supabase-Secrets setzen:
   - RESEND_API_KEY
   - ERSTELLI_FROM_EMAIL
   - ERSTELLI_OWNER_EMAIL=erstelliyourwebsite@gmail.com
   - ERSTELLI_ADMIN_SECRET=<langes zufälliges Admin-Passwort>
   - ERSTELLI_SITE_URL=<finale https:// Domain>
4. config.js eintragen:
   - supabaseUrl
   - supabasePublishableKey
5. Resend-Absenderdomain verifizieren und ERSTELLI_FROM_EMAIL auf eine freigegebene Absenderadresse setzen.
6. index.html, style.css, script.js, config.js und Rechtstexte auf GitHub Pages veröffentlichen.
7. Funktionstest:
   - Anfrage ohne Datei
   - Anfrage mit Datei
   - Bestätigungsmail
   - Admin-Analytics
   - Auftrag abschließen -> Bewertungscode
   - Bewertung absenden -> manuelle Freigabe in Supabase -> Anzeige auf Website

ANALYTICS
Die V31 misst datensparsam ohne Cookies/LocalStorage/Fingerprinting:
Seitenaufrufe, Seitenbereiche, Scrolltiefe, Paket-/Feature-Klicks, Formularstart,
Anfrageerfolg, WhatsApp-/E-Mail-Klicks, Quelle/UTM und Gerätegruppe.
admin.html zeigt die Auswertung nach Eingabe des serverseitigen ERSTELLI_ADMIN_SECRET.

WICHTIG
Das Admin-Passwort niemals in config.js oder anderen öffentlichen Dateien speichern.

Öffentliche Seiten: keine offensichtlichen Demo-, Platzhalter- oder Arbeitsentwurf-Hinweise mehr gefunden.
WEBSITE ERSTELLER V10

Neu:
- Hero-Überschrift breiter und klarer gesetzt.
- Mehr Erklärung und Vertrauenstext.
- Chatbot komplett entfernt.
- Vertrauensleiste unter dem Hero.
- Demo-Referenzbereich mit drei Beispielrichtungen.
- 'Warum wir?'-Bereich.
- Abschnitt 'Was wir von dir brauchen'.
- Domain-&-Hosting-Erklärung.
- FAQ statt Chatbot.
- Bestehender Klick-Konfigurator und Codey bleiben erhalten.
- Hintergrund-Code und Performance-Optimierungen aus V9 bleiben erhalten.

Start: ZIP entpacken und index.html doppelklicken.

V11 Änderungen:
- Graues Hero-Fenster neben dem Maskottchen entfernt.
- Fehler/Störungen im Kontaktbereich visuell bereinigt.
- Getippte Buchstaben bekommen jetzt einen kurzen bunten Effekt für ca. 1 Sekunde, ohne dass das gesamte Feld blinkt oder verschwindet.

<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Projekt bewerten | ERSTELLI</title>
<link rel="stylesheet" href="style.css">
<style>
.review-page{min-height:100vh;display:grid;place-items:center;padding:30px 16px;background:linear-gradient(145deg,#f8fdff,#eef8ff 55%,#f7f3ff)}
.review-card{width:min(680px,100%);background:#fff;border:1px solid rgba(41,135,220,.13);border-radius:28px;padding:clamp(24px,5vw,46px);box-shadow:0 28px 90px rgba(25,91,150,.12)}
.review-card h1{font-size:clamp(38px,7vw,62px);line-height:1.02;margin:10px 0 14px;background:linear-gradient(90deg,#1299ff,#55d8ff,#8e63ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.rating-input{display:flex;gap:6px;margin:18px 0}
.rating-input button{border:0;background:none;font-size:38px;cursor:pointer;color:#b9c8d7;padding:0}
.rating-input button.active{color:#6778ff;text-shadow:0 0 12px rgba(103,120,255,.28)}
.review-card input,.review-card textarea{width:100%;margin:7px 0;padding:14px 16px;border:1px solid rgba(42,115,175,.15);border-radius:14px;font:inherit}
.review-card textarea{min-height:130px;resize:vertical}.review-status{margin-top:12px;font-weight:700;font-size:13px}
</style>
</head>
<body class="review-page">
<main class="review-card">
  <div class="eyebrow">KUNDENBEWERTUNG</div>
  <h1>Wie war dein Projekt mit ERSTELLI?</h1>
  <p>Dieser Bewertungslink ist für abgeschlossene Aufträge vorgesehen. Deine Bewertung wird nach einer kurzen Prüfung veröffentlicht.</p>
  <form id="reviewForm">
    <input id="reviewToken" required placeholder="Auftragscode">
    <input id="reviewName" placeholder="Name / Firma (optional)">
    <div class="rating-input" id="ratingInput" aria-label="Bewertung von 1 bis 5 Sternen">
      <button type="button" data-rating="1">★</button><button type="button" data-rating="2">★</button><button type="button" data-rating="3">★</button><button type="button" data-rating="4">★</button><button type="button" data-rating="5">★</button>
    </div>
    <textarea id="reviewText" required maxlength="1200" placeholder="Wie hat dir die Zusammenarbeit gefallen?"></textarea>
    <button class="cta full" type="submit">Bewertung absenden →</button>
    <div id="reviewStatus" class="review-status"></div>
  </form>
  <a class="back" href="index.html">← Zurück zu ERSTELLI</a>
</main>
<script src="config.js"></script>
<script>
let rating=0;
const params=new URLSearchParams(location.search);
document.getElementById('reviewToken').value=params.get('token')||'';
document.querySelectorAll('#ratingInput button').forEach(btn=>btn.addEventListener('click',()=>{
  rating=Number(btn.dataset.rating);
  document.querySelectorAll('#ratingInput button').forEach(b=>b.classList.toggle('active',Number(b.dataset.rating)<=rating));
}));
document.getElementById('reviewForm').addEventListener('submit',async(e)=>{
  e.preventDefault();
  const status=document.getElementById('reviewStatus');
  if(!rating){status.textContent='Bitte 1 bis 5 Sterne auswählen.';return;}
  const cfg=window.ERSTELLI_CONFIG||{};
  if(!cfg.supabaseUrl||!cfg.supabasePublishableKey){
    status.textContent='Die Bewertung konnte aktuell nicht gesendet werden. Bitte versuche es später erneut.';
    return;
  }
  status.textContent='Bewertung wird gesendet …';
  try{
    const res=await fetch(`${cfg.supabaseUrl}/functions/v1/${cfg.reviewFunction||'submit-review'}`,{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':cfg.supabasePublishableKey},
      body:JSON.stringify({
        token:document.getElementById('reviewToken').value.trim(),
        displayName:document.getElementById('reviewName').value.trim(),
        rating,
        text:document.getElementById('reviewText').value.trim()
      })
    });
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||'Fehler beim Senden');
    status.textContent='Danke! Deine Bewertung wurde übermittelt und wird vor Veröffentlichung geprüft.';
    e.target.reset(); rating=0;
    document.querySelectorAll('#ratingInput button').forEach(b=>b.classList.remove('active'));
  }catch(err){status.textContent=err.message;}
});
</script>
</body></html>
