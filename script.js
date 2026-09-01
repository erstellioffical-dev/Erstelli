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

// code background — V40: desktop animated, mobile completely disabled
const c=document.getElementById('codeRain');
const ctx=c?.getContext('2d',{alpha:true});
let W=0,H=0,tracks=[],rafId=0,lastFrame=0,paused=false;
const lowPower=(navigator.hardwareConcurrency||8)<=4;
const isMobileCodeBg=window.matchMedia('(max-width:700px), (pointer:coarse)').matches;
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

function setupCode(){
  if(!c||!ctx)return;
  W=Math.max(1,Math.floor(window.innerWidth));
  H=Math.max(1,Math.floor(window.innerHeight));
  c.width=W;
  c.height=H;
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
    phase:i*.9
  }));
}

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

function paintCodeFrame(t){
  if(!c||!ctx)return;
  ctx.clearRect(0,0,W,H);
  ctx.font=(lowPower?'11.5px':'12.5px')+' ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  ctx.textBaseline='middle';
  tracks.forEach((tr,i)=>{
    ctx.fillStyle=makeCodeGradient(t,tr.phase);
    ctx.shadowColor=i%2===0?'rgba(62,207,255,.34)':'rgba(118,114,255,.27)';
    ctx.shadowBlur=lowPower?4:6;
    const width=ctx.measureText(tr.text).width;
    tr.x+=tr.dir*tr.speed;
    if(tr.dir<0&&tr.x<-width/2)tr.x=0;
    if(tr.dir>0&&tr.x>0)tr.x=-width/2;
    ctx.fillText(tr.text,tr.x,tr.y);
    ctx.fillText(tr.text,tr.x+width/2,tr.y);
  });
  ctx.shadowBlur=0;
}

function drawCode(t){
  if(paused||isMobileCodeBg)return;
  rafId=requestAnimationFrame(drawCode);
  if(t-lastFrame<frameMS)return;
  lastFrame=t;
  paintCodeFrame(t);
}

if(isMobileCodeBg){
  // Safari/iPhone: no canvas/pattern at all. A uniform background cannot drift visually.
  document.documentElement.classList.add('mobile-no-code-bg');
  if(c){
    c.width=1;
    c.height=1;
    c.style.display='none';
  }
}else{
  setupCode();
  requestAnimationFrame(drawCode);
  addEventListener('resize',()=>{
    clearTimeout(window.__codeResize);
    window.__codeResize=setTimeout(()=>setupCode(),180);
  },{passive:true});
  document.addEventListener('visibilitychange',()=>{
    paused=document.hidden;
    if(!paused){
      lastFrame=0;
      requestAnimationFrame(drawCode);
    }
  });
}

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
