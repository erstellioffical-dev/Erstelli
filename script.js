// code background — Mobile-Fix: kein Neustart beim Scrollen / Safari-Adressleiste
const c=document.getElementById('codeRain'),ctx=c.getContext('2d',{alpha:true});

let W=0,H=0,tracks=[],rafId=0,lastFrame=0,paused=false,frameCounter=0;

const lowPower=(navigator.hardwareConcurrency||8)<=4;
const mobileCodeBg=matchMedia('(max-width:700px), (pointer:coarse)').matches;

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

function setupCode(force=false){
  const nextW=innerWidth;

  // Auf iPhone/Safari verändert sich innerHeight beim Ein-/Ausblenden
  // der Browserleiste. Deshalb bekommt der Hintergrund auf Mobilgeräten
  // eine stabile Höhe und wird beim normalen Scrollen NICHT neu aufgebaut.
  const stableMobileH=Math.max(
    innerHeight,
    screen.height || innerHeight
  );

  const nextH=mobileCodeBg
    ? stableMobileH
    : innerHeight;

  // Auf Mobilgeräten nur neu aufbauen, wenn sich die BREITE
  // wirklich deutlich verändert hat.
  if(
    !force &&
    mobileCodeBg &&
    tracks.length &&
    Math.abs(nextW-W)<24
  ){
    return;
  }

  W=nextW;
  H=nextH;

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

// Normale Safari-Höhenänderungen beim Scrollen werden ignoriert.
// Ein echtes Resize der Breite wird weiterhin berücksichtigt.
addEventListener('resize',()=>{
  clearTimeout(window.__codeResize);

  window.__codeResize=setTimeout(()=>{
    setupCode(false);
  },180);
},{
  passive:true
});

// Beim Drehen des Handys darf der Hintergrund einmal korrekt neu aufgebaut werden.
addEventListener('orientationchange',()=>{
  clearTimeout(window.__codeOrientation);

  window.__codeOrientation=setTimeout(()=>{
    setupCode(true);
  },260);
},{
  passive:true
});

document.addEventListener('visibilitychange',()=>{
  paused=document.hidden;

  if(!paused){
    lastFrame=0;
    rafId=requestAnimationFrame(drawCode);
  }
});

function makeCodeGradient(t,phase){
  const drift=(Math.sin(t*.00018+phase)+1)/2;

  const g=ctx.createLinearGradient(0,0,W,0);

  g.addColorStop(
    0,
    `rgba(${18+Math.round(drift*20)},156,255,.52)`
  );

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

  const dt=Math.min(
    2.2,
    (t-lastFrame)/frameMS || 1
  );

  lastFrame=t;
  frameCounter++;

  ctx.clearRect(0,0,W,H);

  ctx.font=
    (lowPower?'11.5px':'12.5px')+
    ' ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

  ctx.textBaseline='middle';

  tracks.forEach((tr,i)=>{
    ctx.fillStyle=makeCodeGradient(t,tr.phase);

    ctx.shadowColor=
      i%2===0
        ? 'rgba(62,207,255,.34)'
        : 'rgba(118,114,255,.27)';

    ctx.shadowBlur=lowPower?4:6;

    const width=ctx.measureText(tr.text).width;

    tr.x+=tr.dir*tr.speed*dt;

    if(tr.dir<0 && tr.x<-width/2){
      tr.x=0;
    }

    if(tr.dir>0 && tr.x>0){
      tr.x=-width/2;
    }

    ctx.fillText(tr.text,tr.x,tr.y);
    ctx.fillText(tr.text,tr.x+width/2,tr.y);
  });

  ctx.shadowBlur=0;
}

requestAnimationFrame(drawCode);
