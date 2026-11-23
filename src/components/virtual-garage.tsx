'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import { ArrowLeft, Download, RotateCcw, Save, Trash2, Check, LockKeyhole } from 'lucide-react';

type Finish = 'gloss' | 'metallic' | 'matte';
type Config = { paint: string; finish: Finish; wheel: string; wheelSize: number; lower: number; glass: number; name: string };
const PRESET: Config = { paint:'#247b66', finish:'metallic', wheel:'#b6a2ff', wheelSize:16, lower:20, glass:20, name:'Mein Puma' };
const PAINTS = [
  { label:'Pacific Green',value:'#247b66' },
  { label:'Panther Black',value:'#141b23' },
  { label:'Moondust Silver',value:'#96a7b7' },
  { label:'Colorado Red',value:'#bb293a' },
  { label:'Imperial Blue',value:'#263b83' },
  { label:'Sunburst Yellow',value:'#eac02c' },
] as const;
const STORAGE_KEY = 'pumamap:virtual-garage:v1';
const validHex = (s:unknown):s is string => typeof s==='string' && /^#[0-9a-f]{6}$/i.test(s);
const clamp=(n:unknown,min:number,max:number)=>Math.min(max,Math.max(min,Number.isFinite(Number(n))?Number(n):min));
function sanitize(raw:unknown):Config {
  if (!raw || typeof raw!=='object') return PRESET;
  const obj=raw as Partial<Config>;
  return {
    paint:validHex(obj.paint)?obj.paint:PRESET.paint,
    finish:obj.finish==='gloss'||obj.finish==='metallic'||obj.finish==='matte'?obj.finish:PRESET.finish,
    wheel:validHex(obj.wheel)?obj.wheel:PRESET.wheel,
    wheelSize:clamp(obj.wheelSize,14,19),
    lower:clamp(obj.lower,0,60),
    glass:clamp(obj.glass,0,80),
    name:typeof obj.name==='string'?obj.name.slice(0,50):PRESET.name,
  };
}
function CoupePreview({config}:{config:Config}){
  const rimRadius=27 + (config.wheelSize-14)*1.4;
  const groundOffset=config.lower*.42;
  return <svg viewBox="0 0 860 460" role="img" aria-label={`Stilisierte Ford-Puma-Coupé-Konzeptillustration in ${config.paint}, Felgen ${config.wheelSize} Zoll, Tieferlegung ${config.lower} Millimeter. Kein echtes 3D-Modell.`}>
    <defs>
      <linearGradient id="studio-paint" x1="0" x2=".18" y1="0" y2="1">
        <stop stopColor={config.finish==='matte'?config.paint:'#f0ffff'} stopOpacity={config.finish==='matte'?'1':'.78'}/>
        <stop offset=".13" stopColor={config.paint}/>
        <stop offset=".57" stopColor={config.paint}/>
        <stop offset="1" stopColor="#0b101a"/>
      </linearGradient>
      <linearGradient id="studio-glass" x1="0" x2="1">
        <stop stopColor="#93b5c9" stopOpacity={1-config.glass/125}/>
        <stop offset=".48" stopColor="#263e58"/>
        <stop offset="1" stopColor="#0a111e"/>
      </linearGradient>
      <radialGradient id="studio-floor"><stop stopColor="#ac96f8" stopOpacity=".26"/><stop offset="1" stopColor="#ac96f8" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse cx="430" cy="368" rx="345" ry="56" fill="url(#studio-floor)"/>
    <g transform={`translate(0 ${groundOffset})`}>
      <ellipse cx="431" cy="347" rx="342" ry="22" fill="#000" opacity=".78"/>
      <path d="M83 286 Q92 263 130 250 L229 224 Q300 137 397 134 Q491 133 568 212 L655 231 Q753 243 783 275 L785 308 L762 321 L704 325 Q701 268 644 266 Q581 263 580 326 L281 328 Q274 268 209 268 Q149 268 144 322 L99 318Z" fill="url(#studio-paint)" stroke="#a1b7c0" strokeWidth="1.7"/>
      <path d="M249 220 Q321 151 398 151 Q485 151 543 216Z" fill="url(#studio-glass)" stroke="#a2b9ca" strokeWidth="2"/>
      <path d="M416 153 L430 215 M243 226 L543 225 L560 287 M274 279 Q456 290 580 276" stroke="#d3edf1" strokeOpacity=".37" strokeWidth="2" fill="none"/>
      {config.finish!=='matte'&&<path d="M108 268 Q266 235 410 229 Q619 224 742 269" stroke="#fff" strokeOpacity={config.finish==='gloss'?'.64':'.33'} strokeWidth={config.finish==='gloss'?5:2} fill="none"/>}
      <path d="M107 277 L147 269 L163 287 L105 301Z" fill="#eeffff" stroke="#bfd8e3"/>
      <path d="M748 279 L776 285 L779 303 L750 298Z" fill="#f24e79"/>
      <path d="M300 320 L566 319" stroke="#c8ff28" strokeOpacity=".58" strokeWidth="3"/>
      {[210,645].map(x=><g key={x}>
        <circle cx={x} cy="319" r={rimRadius+14} fill="#08090e" stroke="#252e39" strokeWidth="4"/>
        <circle cx={x} cy="319" r={rimRadius} fill="#101520" stroke="#9ca9c0" strokeWidth="3"/>
        <circle cx={x} cy="319" r={rimRadius-4} fill="#090e16" stroke={config.wheel} strokeWidth="2"/>
        {Array.from({length:10},(_,i)=> <path key={i} d={`M ${x} 319 L ${x+Math.cos(i*Math.PI/5)*(rimRadius-5)} ${319+Math.sin(i*Math.PI/5)*(rimRadius-5)}`} stroke={config.wheel} strokeWidth="5" strokeLinecap="round"/>)}
        <circle cx={x} cy="319" r="7" fill="#dce6ef" stroke="#121822" strokeWidth="3"/>
      </g>)}
    </g>
    <path d="M80 410 H780" stroke="#a991fc" strokeOpacity=".28" strokeWidth="1"/>
  </svg>;
}
export function VirtualGarage({onBack}:{onBack:()=>void}){
  const [config,setConfig]=useState<Config>(PRESET);
  const [drafts,setDrafts]=useState<Config[]>([]);
  const [ready,setReady]=useState(false);
  const [message,setMessage]=useState('');
  useEffect(()=>{
    try {
      const value=localStorage.getItem(STORAGE_KEY);
      if(value){
        const data:unknown=JSON.parse(value);
        if(data && typeof data==='object'){
          const state=data as {current?:unknown;drafts?:unknown};
          setConfig(sanitize(state.current));
          if(Array.isArray(state.drafts)) setDrafts(state.drafts.slice(0,12).map(sanitize));
        }
      }
    }catch { /* Storage blocked or invalid; remain functional in memory. */ }
    setReady(true);
  },[]);
  useEffect(()=>{
    if(!ready)return;
    try {localStorage.setItem(STORAGE_KEY,JSON.stringify({current:config,drafts}));}catch { /* private-mode quota */ }
  },[ready,config,drafts]);
  const patch=(change:Partial<Config>)=>{setConfig(prev=>sanitize({...prev,...change}));setMessage('');};
  const save=()=>{
    if(drafts.length>=12){setMessage('Maximal 12 lokale Entwürfe. Bitte einen löschen.');return;}
    setDrafts(prev=>[...prev,{...config,name:config.name.trim()||'Mein Puma'}]);
    setMessage('Entwurf lokal auf diesem Gerät gespeichert.');
  };
  const exportJson=()=>{
    const blob=new Blob([JSON.stringify({format:'pumamap-garage-v1',savedAt:new Date().toISOString(),configuration:config},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='pumamap-konfiguration.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <section className="vg" aria-label="Virtual Garage Konfigurator">
    <div className="vg-head"><button className="button secondary" type="button" onClick={onBack}><ArrowLeft size={16}/> Garage</button><span className="vg-brand">PUMAMAP <strong>VIRTUAL GARAGE</strong> / CONCEPT STUDIO</span></div>
    <div className="vg-intro"><span className="eyebrow">NOIR SIGNATURE / PERSONAL STUDIO</span><h2>Dein Puma. <em>Deine Vision.</em></h2><p>Konfiguriere eine persönliche Designstudie für deinen Puma Mk1. Die Fahrzeugansicht ist eine stilisierte Illustration – noch kein maßstabsgetreues 3D-Modell.</p></div>
    <div className="vg-grid">
      <div className="vg-stage">
        <div className="vg-stage-top"><span><span className="vg-pulse"/> LIVE DESIGN PREVIEW</span><span>MK1 / 1997—2002</span></div>
        <CoupePreview config={config}/>
        <div className="vg-stage-bottom"><span>STUDIO / ILLUSTRATION</span><span>NOIR SIGNATURE <span aria-hidden="true">◆</span></span></div>
      </div>
      <div className="vg-controls">
        <div className="vg-control-head"><span>01 — CUSTOMIZATION</span><button type="button" className="vg-reset" onClick={()=>patch(PRESET)}><RotateCcw size={14}/> Zurücksetzen</button></div>
        <label className="vg-label" htmlFor="vg-name">Name des Entwurfs</label><input id="vg-name" maxLength={50} value={config.name} onChange={e=>patch({name:e.target.value})}/>
        <fieldset className="vg-fieldset"><legend>Fahrzeuglack</legend><div className="vg-paints">{PAINTS.map(p=><button key={p.value} type="button" className={config.paint===p.value?'selected':''} style={{'--swatch':p.value} as CSSProperties} onClick={()=>patch({paint:p.value})} title={p.label} aria-label={p.label} aria-pressed={config.paint===p.value}>{config.paint===p.value&&<Check size={17}/>}</button>)}</div><div className="vg-inline"><label htmlFor="vg-color">Individueller HEX-Lack</label><input id="vg-color" type="color" value={config.paint} onChange={e=>patch({paint:e.target.value})}/></div></fieldset>
        <fieldset className="vg-fieldset"><legend>Lackoberfläche</legend><div className="vg-segments">{([['gloss','Glanz'],['metallic','Metallic'],['matte','Matt']] as const).map(([key,label])=><button key={key} type="button" aria-pressed={config.finish===key} className={config.finish===key?'active':''} onClick={()=>patch({finish:key})}>{label}</button>)}</div></fieldset>
        <fieldset className="vg-fieldset"><legend>Felgen und Fahrwerk</legend><div className="vg-inline"><label htmlFor="vg-rimcolor">Felgenfarbe</label><input id="vg-rimcolor" type="color" value={config.wheel} onChange={e=>patch({wheel:e.target.value})}/></div><label className="vg-range-label" htmlFor="vg-wheelsize">Felgengröße <strong>{config.wheelSize}&Prime;</strong></label><input id="vg-wheelsize" type="range" min="14" max="19" step="1" value={config.wheelSize} onChange={e=>patch({wheelSize:Number(e.target.value)})}/><label className="vg-range-label" htmlFor="vg-lower">Tieferlegung (Illustration) <strong>{config.lower} mm</strong></label><input id="vg-lower" type="range" min="0" max="60" step="5" value={config.lower} onChange={e=>patch({lower:Number(e.target.value)})}/><label className="vg-range-label" htmlFor="vg-glass">Scheibentönung <strong>{config.glass}%</strong></label><input id="vg-glass" type="range" min="0" max="80" step="10" value={config.glass} onChange={e=>patch({glass:Number(e.target.value)})}/></fieldset>
        <div className="vg-actions"><button type="button" className="button" onClick={save}><Save size={17}/> Entwurf speichern</button><button type="button" className="button secondary" onClick={exportJson}><Download size={17}/> Export</button></div>
        {message&&<p role="status" className="vg-status">{message}</p>}
      </div>
    </div>
    <section className="vg-drafts"><div><span className="eyebrow">02 / PERSONAL COLLECTION</span><h3>Deine lokalen Entwürfe <span>({drafts.length}/12)</span></h3></div><p><LockKeyhole size={14}/> Nur auf diesem Gerät gespeichert, nicht im PumaMap-Konto synchronisiert.</p>{drafts.length?<div className="vg-draft-grid">{drafts.map((draft,i)=><article className="vg-draft" key={i}><div className="vg-draft-color" style={{background:draft.paint}}/><strong>{draft.name}</strong><small>{draft.wheelSize}&Prime; · {draft.finish} · {draft.lower} mm</small><div><button type="button" onClick={()=>{setConfig(draft);setMessage('Entwurf geladen.');window.scrollTo({top:0,behavior:'smooth'});}}>Laden</button><button type="button" aria-label={`Entwurf ${draft.name} löschen`} onClick={()=>setDrafts(prev=>prev.filter((_,index)=>index!==i))}><Trash2 size={16}/></button></div></article>)}</div>:<div className="vg-empty">Noch keine Entwürfe gespeichert. Konfiguriere dein Fahrzeug und wähle „Entwurf speichern“.</div>}</section>
    <p className="vg-disclaimer">Prototyp einer digitalen Fahrzeugkonfiguration. Optische Änderungen sind illustrativ und keine technische Bau- oder TÜV-Freigabe. Für fotorealistische 360°-Ansichten wird ein gesondert geprüftes 3D-Modell benötigt.</p>
  </section>;
}
