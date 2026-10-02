import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowLeft, BarChart3, Brain, CheckCircle2, ChevronLeft, CircleGauge, Clock3, Layers3, Map, ShieldCheck, Sparkles, Target, TrendingUp, Users, X, Zap } from 'lucide-react';
import { Initiative } from '../types';

const statusMeta: Record<string,{label:string; tone:string}> = {
  completed:{label:'منجز',tone:'emerald'}, ongoing:{label:'قيد التنفيذ',tone:'blue'}, stagnant:{label:'متعثر',tone:'rose'}, stopped:{label:'متوقف',tone:'amber'}, pending:{label:'لم يبدأ',tone:'slate'}
};

function parseCoords(value?: string){
  if(!value) return null;
  const nums = value.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
  if(nums.length<2) return null;
  let [a,b] = nums;
  if(Math.abs(a)>90 && Math.abs(b)<=90) [a,b]=[b,a];
  if(Math.abs(a)>90 || Math.abs(b)>180) return null;
  return {lat:a,lng:b};
}

function score(i: Initiative){
  let s = 45;
  if(i.status==='stagnant') s+=28;
  if(i.status==='stopped') s+=24;
  if(i.status==='pending') s+=12;
  if((i.completionRate||0)<25) s+=12;
  if((i.completionRate||0)>=75) s-=10;
  if(!i.ownerConfirmed) s+=8;
  if(!parseCoords(i.coordinates)) s+=5;
  return Math.max(0,Math.min(100,s));
}

export default function LeadershipCommandExperienceV5({initiatives,onNavigateTab,onSelectInitiative}:{initiatives:Initiative[];onNavigateTab:(tab:string)=>void;onSelectInitiative:(id:string)=>void}){
  const [showAll, setShowAll] = useState(false);
  const [scenario, setScenario] = useState<'none'|'15'|'30'>('none');
  const metrics = useMemo(()=>{
    const total=initiatives.length||1;
    const completed=initiatives.filter(i=>i.status==='completed'||i.completionRate>=95).length;
    const active=initiatives.filter(i=>i.status==='ongoing').length;
    const critical=initiatives.filter(i=>score(i)>=75).length;
    const stale=initiatives.filter(i=>!i.updatedAt || (Date.now()-new Date(i.updatedAt).getTime())>30*864e5).length;
    const beneficiaries=initiatives.reduce((s,i)=>s+(i.beneficiaries||0),0);
    const avg=Math.round(initiatives.reduce((s,i)=>s+(Number(i.completionRate)||0),0)/total);
    return {total,completed,active,critical,stale,beneficiaries,avg};
  },[initiatives]);
  const decisions=useMemo(()=>initiatives.map(i=>({i,s:score(i)})).sort((a,b)=>b.s-a.s).slice(0,showAll?8:4),[initiatives,showAll]);
  const geo=useMemo(()=>initiatives.map(i=>({i,p:parseCoords(i.coordinates)})).filter(x=>x.p),[initiatives]);
  const minLat=Math.min(...geo.map(x=>x.p!.lat),13.65), maxLat=Math.max(...geo.map(x=>x.p!.lat),14.45), minLng=Math.min(...geo.map(x=>x.p!.lng),43.75), maxLng=Math.max(...geo.map(x=>x.p!.lng),44.6);
  const projected=(lat:number,lng:number)=>({x:8+((lng-minLng)/(maxLng-minLng||1))*84,y:88-((lat-minLat)/(maxLat-minLat||1))*76});
  const scenarioGain=scenario==='15'?8:scenario==='30'?16:0;

  return <section className="leadership-v5" aria-label="مركز القيادة الذكي">
    <div className="leadership-v5__hero">
      <div className="leadership-v5__heroGlow" />
      <div className="leadership-v5__heroMain">
        <div className="leadership-v5__eyebrow"><Sparkles size={14}/> مركز قيادة طرق إب · النسخة التنفيذية</div>
        <h2>من البيانات إلى <span>القرار</span> ثم إلى الأثر</h2>
        <p>صورة تنفيذية مختصرة تجيب القيادة عن أربعة أسئلة: ماذا يحدث؟ أين؟ ما الذي يحتاج تدخلاً؟ وما الأثر المتوقع؟</p>
        <div className="leadership-v5__heroActions">
          <button onClick={()=>onNavigateTab('decision_center')}><Brain size={17}/> صندوق القرارات</button>
          <button className="ghost" onClick={()=>onNavigateTab('interactive_map')}><Map size={17}/> خريطة الشبكة</button>
          <button className="ghost" onClick={()=>onNavigateTab('periodic_reports')}><BarChart3 size={17}/> التقرير التنفيذي</button>
        </div>
      </div>
      <div className="leadership-v5__health">
        <div className="leadership-v5__ring"><CircleGauge size={28}/><strong>{metrics.avg}</strong><span>متوسط الإنجاز</span></div>
        <div className="leadership-v5__healthText"><b>نبض المحفظة</b><span>{metrics.critical>0?'تحتاج انتباهًا انتقائيًا':'مستقرة نسبيًا'}</span><small>{metrics.total.toLocaleString('ar-YE')} مبادرة في النطاق الحالي</small></div>
      </div>
    </div>

    <div className="leadership-v5__metrics">
      {[
        ['حرجة / تحتاج تدخلًا',metrics.critical,'rose',AlertTriangle],['قيد التنفيذ',metrics.active,'blue',Activity],['منجزة',metrics.completed,'emerald',CheckCircle2],['بيانات تحتاج تحديثًا',metrics.stale,'amber',Clock3],
      ].map(([label,value,tone,Icon]:any)=><button key={label as string} className={`leadership-v5__metric ${tone}`} onClick={()=>tone==='rose'?onNavigateTab('decision_center'):onNavigateTab('initiatives')}><Icon size={19}/><span><small>{label}</small><strong>{Number(value).toLocaleString('ar-YE')}</strong></span><ChevronLeft size={17}/></button>)}
    </div>

    <div className="leadership-v5__grid">
      <div className="leadership-v5__panel leadership-v5__decisions">
        <div className="leadership-v5__panelHead"><div><span className="miniTitle"><Zap size={14}/> القرار أولاً</span><h3>صندوق القرار القيادي</h3></div><button onClick={()=>onNavigateTab('decision_center')}>فتح المركز <ArrowLeft size={15}/></button></div>
        <div className="leadership-v5__decisionList">
          {decisions.map(({i,s})=>{const m=statusMeta[i.status]||statusMeta.pending; return <button key={i.id} className="leadership-v5__decision" onClick={()=>onSelectInitiative(i.id)}>
            <div className="leadership-v5__score">{s}<small>أولوية</small></div><div className="leadership-v5__decisionBody"><div><b>{i.name||i.title||'مبادرة طرق'}</b><span>{i.district} · {i.subDistrict}</span></div><div className="leadership-v5__tags"><em className={`tag-${m.tone}`}>{m.label}</em><em>{Math.round(i.completionRate||0)}% إنجاز</em></div><p>{i.status==='completed'?'مكتملة وتحتاج إغلاق الأثر والتوثيق':i.status==='stagnant'||i.status==='stopped'?'تحتاج تشخيص سبب التعثر وتحديد الإجراء التالي':'تحتاج متابعة الأداء والمحافظة على المسار'}</p></div><ChevronLeft size={19}/>
          </button>})}
        </div>
        <button className="leadership-v5__more" onClick={()=>setShowAll(v=>!v)}>{showAll?'عرض أقل':'عرض أهم 8 قضايا'} <ChevronLeft size={15}/></button>
      </div>

      <div className="leadership-v5__panel">
        <div className="leadership-v5__panelHead"><div><span className="miniTitle"><Map size={14}/> الرؤية المكانية</span><h3>شبكة مواقع مبادرات الطرق</h3></div><button onClick={()=>onNavigateTab('interactive_map')}>الخريطة الكاملة <ArrowLeft size={15}/></button></div>
        <div className="leadership-v5__map">
          <div className="leadership-v5__mapGrid" />
          <div className="leadership-v5__mapLegend"><span><i className="dot critical"/>حرج</span><span><i className="dot active"/>تنفيذ</span><span><i className="dot done"/>منجز</span></div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="مخطط مواقع المبادرات">{geo.slice(0,120).map(({i,p})=>{const q=projected(p!.lat,p!.lng); return <g key={i.id}><circle cx={q.x} cy={q.y} r={i.status==='stagnant'||i.status==='stopped'?1.5:.9} className={i.status==='stagnant'||i.status==='stopped'?'mapCritical':i.status==='completed'?'mapDone':'mapActive'}/></g>})}</svg>
          <div className="leadership-v5__mapCaption"><ShieldCheck size={16}/><span>تمثيل مكاني مبني على الإحداثيات المتاحة في السجلات. لا تُعرض هندسة طريق غير موثقة كحقيقة.</span></div>
        </div>
      </div>
    </div>

    <div className="leadership-v5__lowerGrid">
      <div className="leadership-v5__panel scenarioPanel"><div className="leadership-v5__panelHead"><div><span className="miniTitle"><TrendingUp size={14}/> ماذا لو؟</span><h3>محاكاة تدخل سريع</h3></div></div><p>جرّب سيناريو زيادة القدرة التنفيذية على المبادرات الجارية، مع إبقاء النتيجة تقديرية وليست وعدًا تنفيذيًا.</p><div className="scenarioBtns"><button className={scenario==='15'?'active':''} onClick={()=>setScenario('15')}>+15%</button><button className={scenario==='30'?'active':''} onClick={()=>setScenario('30')}>+30%</button><button className={scenario==='none'?'active':''} onClick={()=>setScenario('none')}>الوضع الحالي</button></div><div className="scenarioResult"><strong>{Math.min(99,metrics.avg+scenarioGain)}%</strong><span>إنجاز تقديري للمحفظة</span><small>{scenario==='none'?'لا يوجد افتراض إضافي':`تحسن افتراضي +${scenarioGain} نقاط، يحتاج اعتماد نموذج اقتصادي/زمني قبل اعتماده رسميًا`}</small></div></div>
      <div className="leadership-v5__panel quickPanel"><div className="leadership-v5__panelHead"><div><span className="miniTitle"><Layers3 size={14}/> مسارات العمل</span><h3>اختصارات القيادة</h3></div></div><div className="quickGrid"><button onClick={()=>onNavigateTab('district_portal')}><Target size={18}/><b>أين نحتاج التدخل؟</b><small>تحليل المديريات</small></button><button onClick={()=>onNavigateTab('interactive_charts')}><BarChart3 size={18}/><b>كيف يسير الأداء؟</b><small>المؤشرات والاتجاهات</small></button><button onClick={()=>onNavigateTab('officials_management')}><Users size={18}/><b>من المسؤول؟</b><small>الدليل المؤسسي</small></button><button onClick={()=>onNavigateTab('matching_results')}><ShieldCheck size={18}/><b>هل البيانات موثوقة؟</b><small>الفرز والمطابقة</small></button></div></div>
    </div>

    {scenario!=='none' && <div className="leadership-v5__notice"><Sparkles size={16}/><span><b>تنبيه منهجي:</b> محاكاة «ماذا لو؟» للاسترشاد وليست توقعًا معتمدًا؛ لا تُستخدم في قرار مالي أو تعاقدي دون اعتماد المنهج.</span><button onClick={()=>setScenario('none')}><X size={16}/></button></div>}
  </section>
}
