import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowLeft, BarChart3, BrainCircuit, CheckCircle2, ChevronLeft, Clock3, Compass, FileCheck2, Gauge, Globe2, Layers3, Map as MapIcon, PlayCircle, Radar, ShieldCheck, Sparkles, Target, Users, X, Zap } from 'lucide-react';
import { Initiative, UserRole } from '../types';
import { PriorityEngine } from '../features/executive-experience/services/priorityEngine';
import OfficialRoadNetwork from './OfficialRoadNetwork';

function n(v: unknown){ const x=Number(v); return Number.isFinite(x)?x:0; }
function coords(v?: string){
  if(!v) return null;
  const a=v.match(/-?\d+(?:\.\d+)?/g)?.map(Number)||[];
  if(a.length<2) return null;
  let [lat,lng]=a;
  if(Math.abs(lat)>90 && Math.abs(lng)<=90) [lat,lng]=[lng,lat];
  if(Math.abs(lat)>90 || Math.abs(lng)>180) return null;
  return {lat,lng};
}
function stale(i:Initiative){ if(!i.updatedAt) return true; const t=new Date(i.updatedAt).getTime(); return !Number.isFinite(t)||Date.now()-t>30*864e5; }
function health(i:Initiative){
  let score=70;
  if(i.status==='completed') score+=20;
  if(i.status==='ongoing') score+=5;
  if(i.status==='stagnant') score-=25;
  if(i.status==='stopped') score-=30;
  if(i.status==='pending') score-=12;
  score += Math.min(12, n(i.completionRate)/10);
  if(stale(i)) score-=8;
  if(!coords(i.coordinates)) score-=5;
  if(!i.ownerConfirmed) score-=5;
  return Math.max(0,Math.min(100,Math.round(score)));
}
function reason(i:Initiative){
  if(i.stagnationReason?.trim()) return i.stagnationReason.trim();
  if(i.status==='stopped') return 'المبادرة متوقفة وتحتاج حسم سبب التوقف والإجراء التالي.';
  if(i.status==='stagnant') return 'التقدم متعثر ويحتاج تشخيصًا ميدانيًا قبل اعتماد المعالجة.';
  if(stale(i)) return 'بيانات المتابعة قديمة وتحتاج تحديثًا للتحقق من الوضع الحالي.';
  if(!coords(i.coordinates)) return 'الموقع الجغرافي يحتاج تحققًا قبل الاعتماد المكاني.';
  return `التقدم الحالي ${Math.round(n(i.completionRate))}% ويحتاج متابعة للحفاظ على المسار.`;
}

export default function LeadershipOperatingSystem({initiatives,userRole,onNavigateTab,onSelectInitiative}:{initiatives:Initiative[];userRole:UserRole;onNavigateTab:(tab:string)=>void;onSelectInitiative:(id:string)=>void}){
  const [mode,setMode]=useState<'command'|'public'|'demo'>('command');
  const [scenario,setScenario]=useState(0);
  const [showLedger,setShowLedger]=useState(false);
  const [district,setDistrict]=useState('all');
  const districts=useMemo(()=>Array.from(new Set(initiatives.map(i=>i.district).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'ar')),[initiatives]);
  const scoped=useMemo(()=>district==='all'?initiatives:initiatives.filter(i=>i.district===district),[initiatives,district]);
  const summary=useMemo(()=>{
    const total=scoped.length||1;
    const completed=scoped.filter(i=>i.status==='completed'||n(i.completionRate)>=95).length;
    const ongoing=scoped.filter(i=>i.status==='ongoing').length;
    const critical=scoped.filter(i=>PriorityEngine.calculateCriticalityScore(i, i.status==='stagnant'?60:30, i.status==='stagnant'||i.status==='stopped'?25:10)>=70).length;
    const staleCount=scoped.filter(stale).length;
    const mapped=scoped.filter(i=>!!coords(i.coordinates)).length;
    const avg=Math.round(scoped.reduce((s,i)=>s+n(i.completionRate),0)/total);
    const trust=Math.round((scoped.filter(i=>!stale(i)&&!!coords(i.coordinates)&&i.ownerConfirmed).length/total)*100);
    const healthAvg=Math.round(scoped.reduce((s,i)=>s+health(i),0)/total);
    return {total,completed,ongoing,critical,staleCount,mapped,avg,trust,healthAvg};
  },[scoped]);
  const priorities=useMemo(()=>scoped.map(i=>({i,s:PriorityEngine.calculateCriticalityScore(i,i.status==='stagnant'||i.status==='stopped'?60:30,i.status==='stagnant'||i.status==='stopped'?25:10)})).sort((a,b)=>b.s-a.s).slice(0,6),[scoped]);
  const clusters=useMemo(()=>{
    const m=new Map<string,{district:string;count:number;critical:number;avg:number}>();
    scoped.forEach(i=>{const d=i.district||'غير محدد'; const x=m.get(d)||{district:d,count:0,critical:0,avg:0}; x.count++; x.avg+=n(i.completionRate); if(health(i)<45)x.critical++; m.set(d,x);});
    return [...m.values()].map(x=>({...x,avg:Math.round(x.avg/x.count)})).sort((a,b)=>b.critical-a.critical||a.avg-b.avg).slice(0,8);
  },[scoped]);
  const mapped=useMemo(()=>scoped.map(i=>({i,p:coords(i.coordinates)})).filter(x=>x.p).slice(0,180),[scoped]);
  const minLat=Math.min(...mapped.map(x=>x.p!.lat),13.55),maxLat=Math.max(...mapped.map(x=>x.p!.lat),14.55),minLng=Math.min(...mapped.map(x=>x.p!.lng),43.65),maxLng=Math.max(...mapped.map(x=>x.p!.lng),44.75);
  const project=(lat:number,lng:number)=>({x:7+((lng-minLng)/(maxLng-minLng||1))*86,y:91-((lat-minLat)/(maxLat-minLat||1))*82});
  const scenarioAvg=Math.min(100,summary.avg+scenario);
  const lead=priorities[0]?.i;
  const publicMode=mode==='public';
  return <section className={`los ${publicMode?'los--public':''}`} aria-label="منظومة قيادة طرق إب">
    <header className="los__topbar">
      <div className="los__brand"><div className="los__mark"><Compass size={20}/></div><div><b>منظومة قيادة طرق إب</b><span>من الواقع إلى القرار إلى الأثر</span></div></div>
      <div className="los__mode"><button className={mode==='command'?'active':''} onClick={()=>setMode('command')}><Gauge size={15}/> القيادة</button><button className={mode==='public'?'active':''} onClick={()=>setMode('public')}><Globe2 size={15}/> الأثر العام</button><button className={mode==='demo'?'active':''} onClick={()=>setMode('demo')}><PlayCircle size={15}/> العرض القيادي</button></div>
    </header>

    {mode==='demo' && <div className="los__demo"><div><PlayCircle size={18}/><b>وضع العرض القيادي</b><span>رحلة قصيرة: الوضع ← الأولويات ← القرار ← الأثر</span></div><button onClick={()=>setMode('command')}><X size={15}/> إنهاء العرض</button></div>}

    <div className="los__hero">
      <div className="los__heroCopy"><span className="los__eyebrow"><Sparkles size={14}/> {publicMode?'بوابة الأثر والشفافية':'مركز القيادة التنفيذي'}</span><h1>{publicMode?'كيف تتغير طرق إب؟':'ما الذي يحتاج انتباه القيادة الآن؟'}</h1><p>{publicMode?'صورة عامة مبسطة للمبادرات والإنجاز والتوزيع المكاني دون كشف البيانات التشغيلية الحساسة.':'المنصة تختصر المحفظة إلى استثناءات وقرارات قابلة للتتبع، وتوضح جودة البيانات قبل استخدامها في التوجيه.'}</p><div className="los__heroActions"><button onClick={()=>onNavigateTab('decision_center')}><BrainCircuit size={17}/> مركز القرار</button><button onClick={()=>document.getElementById('official-road-network')?.scrollIntoView({behavior:'smooth',block:'start'})} className="ghost"><MapIcon size={17}/> الخريطة</button><button onClick={()=>onNavigateTab('periodic_reports')} className="ghost"><FileCheck2 size={17}/> التقرير التنفيذي</button></div></div>
      <div className="los__heroScore"><div className="los__scoreRing"><strong>{summary.healthAvg}</strong><span>صحة المحفظة</span></div><div><b>{summary.trust}%</b><small>ثقة أولية في البيانات</small><em>ليست بديلًا عن التدقيق</em></div></div>
    </div>

    <div className="los__filters"><div><span>النطاق</span><select value={district} onChange={e=>setDistrict(e.target.value)}><option value="all">كل المديريات</option>{districts.map(d=><option key={d} value={d}>{d}</option>)}</select></div><div className="los__last"><ShieldCheck size={15}/> الأرقام مشتقة من السجلات الحالية وقابلة للتتبع</div></div>

    <div className="los__metrics">
      <button onClick={()=>onNavigateTab('decision_center')}><AlertTriangle/><small>أولوية عالية</small><strong>{summary.critical}</strong><span>تحتاج تدخلًا أو قرارًا</span></button>
      <button onClick={()=>onNavigateTab('initiatives')}><Activity/><small>قيد التنفيذ</small><strong>{summary.ongoing}</strong><span>مبادرات جارية</span></button>
      <button onClick={()=>onNavigateTab('initiatives')}><CheckCircle2/><small>منجز</small><strong>{summary.completed}</strong><span>جاهزة للإغلاق وقياس الأثر</span></button>
      <button onClick={()=>onNavigateTab('matching_results')}><Clock3/><small>بيانات قديمة</small><strong>{summary.staleCount}</strong><span>تحتاج تحديثًا</span></button>
      <button onClick={()=>onNavigateTab('interactive_map')}><MapIcon/><small>مواقع قابلة للرسم</small><strong>{summary.mapped}</strong><span>من {summary.total} سجلًا</span></button>
      <button onClick={()=>onNavigateTab('interactive_charts')}><BarChart3/><small>متوسط الإنجاز</small><strong>{summary.avg}%</strong><span>للنطاق المحدد</span></button>
    </div>

    <div className="los__grid">
      <section className="los__card los__decisionCard"><div className="los__cardHead"><div><span>01 · القرار أولًا</span><h2>صندوق القرار</h2></div><button onClick={()=>onNavigateTab('decision_center')}>المركز الكامل <ArrowLeft size={14}/></button></div>{priorities.length===0?<div className="los__empty">لا توجد قضايا في النطاق المحدد.</div>:priorities.map(({i,s})=><button key={i.id} className="los__decision" onClick={()=>onSelectInitiative(i.id)}><div className="los__priority">{s}<small>أولوية</small></div><div><b>{i.name||i.title||'مبادرة طرق'}</b><span>{i.district} · {Math.round(n(i.completionRate))}% إنجاز</span><p>{reason(i)}</p><div className="los__decisionMeta"><em>{i.status==='stagnant'||i.status==='stopped'?'تحتاج معالجة':'متابعة'}</em><small>صحة {health(i)}/100</small></div></div><ChevronLeft/></button>)}</section>

      <section id="official-road-network" className="los__card los__card--network">
        <OfficialRoadNetwork 
          initiatives={scoped}
          publicMode={publicMode} 
          onSelectInitiative={onSelectInitiative}
        />
      </section>
    </div>

    <div className="los__grid los__grid--three">
      <section className="los__card"><div className="los__cardHead"><div><span>03 · تفسير</span><h2>لماذا هذه الأولوية؟</h2></div><BrainCircuit size={18}/></div>{lead?<div className="los__why"><b>{lead.name}</b><p>{reason(lead)}</p><ul><li>الحالة: {lead.status}</li><li>الإنجاز: {Math.round(n(lead.completionRate))}%</li><li>المستفيدون: {n(lead.beneficiaries).toLocaleString('ar-YE')}</li><li>صحة المبادرة: {health(lead)}/100</li></ul><button onClick={()=>onSelectInitiative(lead.id)}>فتح بطاقة المبادرة <ArrowLeft size={14}/></button></div>:<div className="los__empty">لا توجد أولوية.</div>}</section>
      <section className="los__card"><div className="los__cardHead"><div><span>04 · ماذا لو؟</span><h2>محاكاة التدخل</h2></div><Zap size={18}/></div><p className="los__muted">محاكاة توضيحية فقط، لا تمثل توقعًا ماليًا أو زمنيًا معتمدًا.</p><div className="los__scenario"><button className={scenario===0?'active':''} onClick={()=>setScenario(0)}>الحالي</button><button className={scenario===8?'active':''} onClick={()=>setScenario(8)}>تدخل +15%</button><button className={scenario===16?'active':''} onClick={()=>setScenario(16)}>تدخل +30%</button></div><div className="los__scenarioValue"><strong>{scenarioAvg}%</strong><span>إنجاز محاكى</span></div></section>
      <section className="los__card"><div className="los__cardHead"><div><span>05 · جودة المعرفة</span><h2>ما الذي لا نعرفه؟</h2></div><Radar size={18}/></div><div className="los__quality"><div><b>{summary.staleCount}</b><span>سجلات قديمة</span></div><div><b>{summary.total-summary.mapped}</b><span>مواقع تحتاج تحققًا</span></div><div><b>{scoped.filter(i=>!i.ownerConfirmed).length}</b><span>ملكية غير مؤكدة</span></div><div><b>{scoped.filter(i=>n(i.completionRate)>100).length}</b><span>نسب إنجاز غير اعتيادية</span></div></div><button className="los__textButton" onClick={()=>onNavigateTab('matching_results')}>فتح مركز جودة البيانات <ArrowLeft size={14}/></button></section>
    </div>

    <div className="los__grid los__grid--two">
      <section className="los__card"><div className="los__cardHead"><div><span>06 · جغرافيا القرار</span><h2>أين يتركز الضغط؟</h2></div><Target size={18}/></div><div className="los__districts">{clusters.map(c=><button key={c.district} onClick={()=>setDistrict(c.district)}><div><b>{c.district}</b><span>{c.count} مبادرة · متوسط {c.avg}%</span></div><strong>{c.critical}<small>حرج</small></strong></button>)}</div></section>
      <section className="los__card"><div className="los__cardHead"><div><span>07 · سجل القرار</span><h2>من المشكلة إلى الأثر</h2></div><Layers3 size={18}/></div><div className="los__timeline"><span><i>1</i> مشكلة</span><span><i>2</i> دليل</span><span><i>3</i> تحليل</span><span><i>4</i> قرار</span><span><i>5</i> تنفيذ</span><span><i>6</i> أثر</span></div><p className="los__muted">كل قرار قيادي يجب أن يحمل سببًا وأدلة ومسؤولًا وموعد متابعة ونتيجة قابلة للقياس.</p><button className="los__primaryWide" onClick={()=>setShowLedger(true)}><FileCheck2 size={16}/> فتح سجل القرار المؤسسي</button></section>
    </div>

    <footer className="los__footer"><div><ShieldCheck size={17}/><b>مبدأ المنصة: لا رقم بلا مصدر، ولا توصية بلا تفسير، ولا قرار بلا أثر قابل للمتابعة.</b></div><span>النطاق الحالي: {summary.total.toLocaleString('ar-YE')} مبادرة · {userRole}</span></footer>

    {showLedger&&<div className="los__modalBackdrop" onClick={()=>setShowLedger(false)}><div className="los__modal" onClick={e=>e.stopPropagation()}><header><div><span>سجل القرار المؤسسي</span><h2>مسار القرار</h2></div><button onClick={()=>setShowLedger(false)}><X/></button></header><div className="los__ledger"><div><b>المشكلة</b><p>{lead?reason(lead):'تُحدد من قائمة الاستثناءات.'}</p></div><div><b>الأدلة</b><p>سجل المبادرة · الحالة · الإنجاز · الموقع · تاريخ التحديث.</p></div><div><b>التحليل</b><p>الأولوية مشتقة بصورة حتمية من الحالة والتأخر والأثر والجاهزية.</p></div><div><b>التوصية</b><p>{lead?'إجراء ميداني/إداري يحدد سبب التعثر ثم اعتماد الخطوة التالية.':'لا توجد توصية قبل وجود استثناء.'}</p></div><div><b>المتابعة</b><p>تسجيل القرار وتحديد المسؤول وموعد المراجعة وقياس النتيجة.</p></div></div><button className="los__primaryWide" onClick={()=>{setShowLedger(false);onNavigateTab('decision_center')}}>الانتقال إلى مركز القرار <ArrowLeft size={15}/></button></div></div>}
  </section>
}
