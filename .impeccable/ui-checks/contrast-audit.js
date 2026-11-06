(() => {
const cv=document.createElement("canvas"),cx=cv.getContext("2d",{willReadFrequently:true});
const rgba=c=>{cx.clearRect(0,0,1,1);cx.fillStyle=c;cx.fillRect(0,0,1,1);return Array.from(cx.getImageData(0,0,1,1).data).map((x,i)=>i===3?x/255:x)};
const mix=(a,b)=>[0,1,2].map(i=>a[i]*a[3]+b[i]*(1-a[3])).concat(1);
const lum=c=>c.slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
if(Math.abs(ratio([0,0,0],[255,255,255])-21)>.0001||ratio([255,255,255],[255,255,255])!==1)throw Error("Contrast self-check failed");
const out=[],manual=[];let checked=0;
const scope=document.querySelector("[role=dialog][aria-modal=true]")||document.body;for(const el of scope.querySelectorAll("*")){
const cs=getComputedStyle(el),rect=el.getBoundingClientRect();
if(!rect.width||!rect.height||cs.visibility!=="visible"||el.closest("[aria-hidden=true], [inert], [disabled]"))continue;
const text=Array.from(el.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent).join("").trim();
const input=el.matches("input,textarea");const value=input?(el.value||el.getAttribute("placeholder")||""):"";
if(!text&&!value)continue;
let chain=[],n=el,opacity=1,gradient=false;
while(n&&n.nodeType===1){const s=getComputedStyle(n);opacity*=Number(s.opacity);if(s.backgroundImage!=="none")gradient=true;chain.push(rgba(s.backgroundColor));n=n.parentElement;}
if(opacity===0)continue;
let bg=[255,255,255,1];for(const c of chain.reverse())bg=mix(c,bg);
let fcs=input&&!el.value?getComputedStyle(el,"::placeholder"):cs;
let fg=rgba(el instanceof SVGElement?cs.fill:fcs.color);
fg[3]*=opacity*Number(fcs===cs?1:fcs.opacity);
const effective=mix(fg,bg),actual=ratio(effective,bg);
const size=parseFloat(cs.fontSize),bold=parseFloat(cs.fontWeight)>=700,required=size>=24||(bold&&size>=18.6667)?3:4.5;
const row={tag:el.tagName,text:(text||value).slice(0,100),ratio:+actual.toFixed(3),required,foreground:fg,background:bg,fontSize:size,class:el.getAttribute("class")||"",placeholder:input&&!el.value};
if(gradient||el.matches("[role=tab][aria-selected=true]")){manual.push(row);continue;}
checked++;if(actual<required)out.push(row);
}
return JSON.stringify({url:location.href,viewport:[innerWidth,innerHeight],checked,failures:out,manualGradientCount:manual.length,manual:manual.slice(0,12)});
})()
