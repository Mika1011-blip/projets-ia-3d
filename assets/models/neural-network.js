const width = 720;
const height = 450;
const layers = [[[-2.2, -1.05, 0], [-2.2, 0, 0], [-2.2, 1.05, 0]],
  [[0, -1.02, -.67], [0, 1.02, -.67], [0, -1.02, .67], [0, 1.02, .67]],
  [[2.2, -.57, 0], [2.2, .57, 0]]];
const steps = [
  ["Entrées", "Les valeurs entrent dans le réseau."],
  ["Couche cachée", "Chaque neurone combine les entrées pondérées."],
  ["Sorties", "Les dernières activations constituent la sortie."]
];
const honey = "#f6bc63";
const teal = "#70dbca";
const mix = (a,b,t) => a + (b-a)*t;

// Render the same frame in both the interactive diagram and its animated preview.
export function drawNetwork(canvas, {angle=-.34, elevation=.25, phase=0} = {}) {
  const ctx = canvas.getContext("2d");
  const stage = Math.min(2, Math.floor(phase*3));
  const progress = (phase*3)%1;
  ctx.setTransform(canvas.width/width, 0, 0, canvas.height/height, 0, 0);
  ctx.fillStyle = "#101c2a";
  ctx.fillRect(0,0,width,height);
  const project = ([x,y,z]) => {
    const x1 = x*Math.cos(angle) + z*Math.sin(angle);
    const z1 = z*Math.cos(angle) - x*Math.sin(angle);
    const y1 = y*Math.cos(elevation) - z1*Math.sin(elevation);
    const depth = y*Math.sin(elevation) + z1*Math.cos(elevation);
    const scale = 1 + depth*.047;
    return {x: 360 + x1*102*scale, y: 231 - y1*93*scale, depth, scale};
  };
  const line = (a,b,color,weight=1) => {
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
    ctx.strokeStyle=color; ctx.lineWidth=weight; ctx.stroke();
  };
  const circle = (x,y,r,color) => {
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
  };
  ctx.save();
  ctx.beginPath(); ctx.rect(0,76,width,325); ctx.clip();
  for(let n=-8;n<=8;n++){
    line(project([n*.55,-1.52,-3]),project([n*.55,-1.52,3]),"#1c3040",.75);
    line(project([-5,-1.52,n*.55]),project([5,-1.52,n*.55]),"#1c3040",.75);
  }
  ctx.restore();

  const points = layers.map(layer=>layer.map(project));
  // Connections are drawn behind the nodes, with moving dots following forward edges.
  for(let layer=0;layer<2;layer++){
    for(const origin of points[layer]){
      for(const destination of points[layer+1]){
        const flowing = stage === layer;
        line(origin,destination,flowing?"#528e91":"#376072",flowing?1.35:.9);
        if(flowing && progress>.08 && progress<.94){
          const t = (progress-.08)/.86;
          circle(mix(origin.x,destination.x,t), mix(origin.y,destination.y,t), 2.4, "#ffe2a5");
        }
      }
    }
  }
  const nodes = points.flatMap((layer,index)=>layer.map(point=>({...point,layer:index})));
  nodes.sort((a,b)=>a.depth-b.depth);
  for(const n of nodes){
    const active = n.layer === stage;
    const r = 12.3*n.scale;
    if(active){
      ctx.beginPath(); ctx.arc(n.x,n.y,r+5,0,Math.PI*2);
      ctx.lineWidth=1; ctx.strokeStyle="#977b52"; ctx.stroke();
    }
    const light = ctx.createRadialGradient(n.x-r*.38,n.y-r*.42,r*.05,n.x+r*.06,n.y+r*.04,r*1.08);
    const shades = active ? ["#fff5d2", "#f4c478", "#b78349", "#513e39"] : ["#bdffef", "#68d0c1", "#338e91", "#174657"];
    [0,.32,.76,1].forEach((v,i)=>light.addColorStop(v,shades[i]));
    circle(n.x,n.y,r,light); ctx.lineWidth=.9; ctx.strokeStyle=active?honey:teal; ctx.stroke();
  }
  ctx.fillStyle = "#a8bbcc"; ctx.font = "600 14px monospace";
  ctx.fillText("SIGNAL  /  " + (stage+1) + " SUR 3",28,31);
  ctx.fillStyle="#f0f3ee"; ctx.font="600 26px 'Segoe UI',sans-serif";
  ctx.fillText(steps[stage][0],28,64);
  ctx.strokeStyle="#304350"; ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(28,398);ctx.lineTo(692,398);ctx.stroke();
  ctx.textAlign="center";ctx.font="600 17px 'Segoe UI',sans-serif";
  ["Entrées","Couche cachée","Sorties"].forEach((label,i)=>{
    const x = project([layers[i][0][0],0,0]).x;
    ctx.fillStyle=stage===i?honey:"#a7bac5";
    ctx.fillText(label,x,429);
  });
  ctx.textAlign="left";
}

class NeuralNetworkDemo extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode:"open"});
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;background:#101c2a;color:#edf3f2;font:15px/1.45 system-ui,sans-serif;color-scheme:dark}
        canvas{display:block;width:100%;height:auto;touch-action:pan-y;cursor:grab} canvas:active{cursor:grabbing}
        .tools{display:flex;gap:.65rem;flex-wrap:wrap;align-items:center;padding:.8rem 1rem;border-top:1px solid #344550}
        button{border:1px solid #667781;border-radius:.35rem;color:#edf3f2;background:#1a2a39;padding:.45rem .75rem;min-height:42px;font:inherit;cursor:pointer}
        button:hover{border-color:#f6bc63} :focus-visible{outline:3px solid #f6bc63;outline-offset:-3px}
        .help{margin:0;padding:0 1rem .9rem;color:#adc0ca;font-size:.85rem} output{margin:0;padding:.7rem 1rem 0;display:block}
      </style>
      <canvas width="720" height="450" tabindex="0" role="img" aria-label="Réseau de neurones en trois dimensions avec trois entrées, quatre neurones cachés et deux sorties." aria-describedby="help"></canvas>
      <output aria-live="off"></output>
      <div class="tools"><button type="button" class="play"></button><button type="button" class="step">Étape suivante</button><button type="button" class="reset">Centrer la vue</button></div>
      <p class="help" id="help">Faites glisser le modèle ou utilisez les flèches du clavier pour le faire pivoter.</p>
    `;
    this.canvas=this.shadowRoot.querySelector("canvas");
    this.play=this.shadowRoot.querySelector(".play");
    this.status=this.shadowRoot.querySelector("output");
    this.angle=-.34; this.elevation=.25; this.phase=0; this.frame=0;
    this.playing=!matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.intersecting=false;
    this.play.onclick=()=>{this.playing=!this.playing;this.sync()};
    this.shadowRoot.querySelector(".step").onclick=()=>{
      this.playing=false;this.phase=((Math.floor(this.phase*3)+1)%3+.01)/3;
      this.status.setAttribute("aria-live","polite");this.sync();
    };
    this.shadowRoot.querySelector(".reset").onclick=()=>{this.angle=-.34;this.elevation=.25;this.paint()};
    this.canvas.addEventListener("pointerdown",e=>{
      this.drag={x:e.clientX,y:e.clientY,angle:this.angle,elevation:this.elevation};
      this.canvas.setPointerCapture(e.pointerId);
    });
    this.canvas.addEventListener("pointermove",e=>{
      if(!this.drag)return;
      this.rotate(this.drag.angle + (e.clientX-this.drag.x)*.008,this.drag.elevation + (e.clientY-this.drag.y)*.006);
    });
    this.canvas.addEventListener("lostpointercapture",()=>{this.drag=null});
    this.canvas.addEventListener("keydown",e=>{
      const direction={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,.09],ArrowDown:[0,-.09]}[e.key];
      if(!direction)return;
      e.preventDefault();this.rotate(this.angle+direction[0],this.elevation+direction[1]);
    });
  }
  rotate(a,e){this.angle=Math.max(-1.08,Math.min(1.08,a));this.elevation=Math.max(-.15,Math.min(.68,e));this.paint()}
  paint(){
    drawNetwork(this.canvas,this);
    const label=steps[Math.floor(this.phase*3)][1];
    if(this.status.textContent!==label)this.status.textContent=label;
  }
  sync(){
    this.play.textContent=this.playing?"Pause":"Lecture";
    if(this.playing)this.status.setAttribute("aria-live","off");
    cancelAnimationFrame(this.frame);this.paint();
    if(!this.playing || !this.intersecting || !this.isConnected)return;
    let last=performance.now();
    const tick=(now)=>{
      this.phase=(this.phase+Math.max(0,Math.min(now-last,100))/7500)%1;last=now;
      this.paint();this.frame=requestAnimationFrame(tick);
    };
    this.frame=requestAnimationFrame(tick);
  }
  connectedCallback(){
    this.observer=new IntersectionObserver(([entry])=>{this.intersecting=entry.isIntersecting;this.sync()});
    this.observer.observe(this);this.sync();
  }
  disconnectedCallback(){this.observer?.disconnect();cancelAnimationFrame(this.frame)}
}
customElements.define("neural-network-demo", NeuralNetworkDemo);
