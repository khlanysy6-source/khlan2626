import React, { useMemo } from 'react';
import { ArrowLeft, BarChart3, CheckCircle2, ClipboardList, Database, FileCheck2, FileText, Fuel, GitBranch, MapPinned, PackageCheck, ShieldCheck, Target, Truck, XCircle, AlertTriangle } from 'lucide-react';
import { Initiative } from '../types';
import { materialLedgerTransactions } from '../data/materialLedgers';
import { SECOND_EXECUTIVE_PATHWAY, ANALYTICS_AFTER_PATHWAY } from '../pathway/secondPathModel';

type Props = { initiatives: Initiative[]; selectedInitiative?: Initiative | null; activeTab: string; onNavigate: (tab: string) => void };

const TAB_BY_NODE: Record<string,string> = {
  'initiative-registry':'initiatives','studies':'matrix','material-ledger':'matrix','evaluation-matrix':'matching_results','sorting-matrix':'matching_results',
  diagnosis:'forms_portal',readiness:'forms_portal',decision:'decision_center',execution:'field_staging',completion:'forms_portal',archive:'periodic_reports'
};

function num(v:any){ const n=Number(v); return Number.isFinite(n)?n:0; }

export default function SecondPathWorkspace({ initiatives, selectedInitiative, activeTab, onNavigate }: Props){
  const totals = useMemo(()=>{
    const status = initiatives.reduce((a,i)=>{a[i.status]=(a[i.status]||0)+1;return a},{} as Record<string,number>);
    const avg = initiatives.length ? initiatives.reduce((s,i)=>s+num(i.completionRate),0)/initiatives.length : 0;
    const cost = initiatives.reduce((s,i)=>s+num(i.cost),0);
    const cement = materialLedgerTransactions.filter(x=>x.kind==='cement' && x.initiativeId).reduce((s,x)=>s+num(x.outgoingQty),0);
    const diesel = materialLedgerTransactions.filter(x=>x.kind==='diesel' && x.initiativeId).reduce((s,x)=>s+num(x.outgoingQty),0);
    return {status,avg,cost,cement,diesel};
  },[initiatives]);

  const selectedLedger = useMemo(()=>selectedInitiative ? materialLedgerTransactions.filter(x=>x.initiativeId===selectedInitiative.id) : [],[selectedInitiative]);
  const selected = selectedInitiative ? {
    cement:selectedLedger.filter(x=>x.kind==='cement').reduce((s,x)=>s+num(x.outgoingQty),0),
    diesel:selectedLedger.filter(x=>x.kind==='diesel').reduce((s,x)=>s+num(x.outgoingQty),0),
    tx:selectedLedger.length,
  } : null;
  const currentNode = SECOND_EXECUTIVE_PATHWAY.find(n=>TAB_BY_NODE[n.id]===activeTab) || SECOND_EXECUTIVE_PATHWAY[0];

  const cards=[
    ['المبادرات',initiatives.length,Database],['متوسط الإنجاز',`${totals.avg.toFixed(1)}%`,BarChart3],['التكلفة التقديرية',`${Math.round(totals.cost).toLocaleString('ar-YE')} ر.ي`,Target],['صرف الإسمنت',`${Math.round(totals.cement).toLocaleString('ar-YE')} كيس`,PackageCheck],['صرف الديزل',`${Math.round(totals.diesel).toLocaleString('ar-YE')} لتر`,Fuel]
  ] as const;

  return <section className="second-workspace" dir="rtl">
    <div className="second-workspace-command">
      <div><div className="second-workspace-kicker"><ShieldCheck size={14}/> مصدر الحقيقة + سلسلة القرار</div><h1>مركز تشغيل المسار التنفيذي الثاني</h1><p>كل مرحلة تستهلك مخرجات المرحلة السابقة وتنتج سجلاً قابلاً للتدقيق. لا توجد بوابات معزولة عن سجل المبادرة.</p></div>
      <div className="second-workspace-current"><span>المرحلة الحالية</span><b>{currentNode.title}</b><small>المخرج: {currentNode.produces[0]}</small></div>
    </div>

    <div className="second-kpi-grid">{cards.map(([label,value,Icon])=><div className="second-kpi" key={label}><Icon size={18}/><span>{label}</span><strong>{value}</strong></div>)}</div>

    <div className="second-flow-grid">
      {SECOND_EXECUTIVE_PATHWAY.map((node,i)=>{ const active=node.id===currentNode.id; return <React.Fragment key={node.id}>
        <button className={`second-flow-card ${active?'active':''}`} onClick={()=>onNavigate(TAB_BY_NODE[node.id])}>
          <span className="second-flow-no">{node.order}</span><div className="second-flow-icon">{node.kind==='source'?<Database size={18}/>:node.kind==='matrix'?<GitBranch size={18}/>:node.kind==='action'?<ClipboardList size={18}/>:node.kind==='closure'?<FileCheck2 size={18}/>:<FileText size={18}/>}</div>
          <div><b>{node.title}</b><small>{node.sheets[0]}</small></div><ArrowLeft size={15}/>
        </button>
        {i<SECOND_EXECUTIVE_PATHWAY.length-1 && <div className="second-flow-connector">←</div>}
      </React.Fragment>})}
    </div>

    {selectedInitiative ? <div className="initiative-dossier">
      <div className="dossier-head"><div><span>ملف المبادرة التنفيذي</span><h2>{selectedInitiative.name}</h2><p>{selectedInitiative.initiativeNumber} · {selectedInitiative.district} · {selectedInitiative.subDistrict}</p></div><div className="dossier-status">{selectedInitiative.status}</div></div>
      <div className="dossier-grid">
        <div><label>الإنجاز</label><strong>{num(selectedInitiative.completionRate).toFixed(1)}%</strong><div className="progress"><i style={{width:`${Math.min(100,Math.max(0,num(selectedInitiative.completionRate)))}%`}}/></div></div>
        <div><label>التكلفة</label><strong>{num(selectedInitiative.cost).toLocaleString('ar-YE')} ر.ي</strong></div>
        <div><label>الإسمنت المرتبط</label><strong>{selected?.cement.toLocaleString('ar-YE')} كيس</strong><small>{selected?.tx} حركة أصلية مرتبطة</small></div>
        <div><label>الديزل المرتبط</label><strong>{selected?.diesel.toLocaleString('ar-YE')} لتر</strong><small>من سجل الشطب الرسمي</small></div>
      </div>
      <div className="lineage"><b>سلسلة مصدر البيانات</b><span>سجل المبادرات</span><ArrowLeft size={14}/><span>الدراسات</span><ArrowLeft size={14}/><span>الإسمنت/الديزل</span><ArrowLeft size={14}/><span>التقييم والفرز</span><ArrowLeft size={14}/><span>النماذج والقرار</span><ArrowLeft size={14}/><span>التنفيذ والإغلاق</span></div>
      <div className="dossier-actions"><button onClick={()=>onNavigate('initiatives')}>فتح سجل المبادرة</button><button onClick={()=>onNavigate('matrix')}>الدراسات والكميات</button><button onClick={()=>onNavigate('matching_results')}>التقييم والفرز</button><button onClick={()=>onNavigate('forms_portal')}>النماذج الرسمية</button><button onClick={()=>onNavigate('decision_center')}>القرار التنفيذي</button></div>
    </div> : <div className="second-empty"><MapPinned size={22}/><b>اختر مبادرة لفتح ملفها التنفيذي الموحد</b><span>ستظهر هنا الدراسة والمواد والتقييم والفرز والقرار والمتابعة والإغلاق في سياق واحد.</span></div>}

    <div className="second-analytics">
      <div className="second-section-title"><div><BarChart3 size={18}/><h2>طبقة الذكاء بعد المسار</h2></div><span>لا تُنتج التحليلات قراراً إلا من بيانات المسار الموثقة</span></div>
      <div className="analytics-grid">{ANALYTICS_AFTER_PATHWAY.map((item,i)=><button key={item} onClick={()=>onNavigate(['interactive_charts','interactive_map','district_portal','interactive_charts','advisor','decision_center'][i])}><b>{i+1}</b><span>{item}</span><ArrowLeft size={14}/></button>)}</div>
      <div className="status-strip"><span><CheckCircle2/> مكتمل: {totals.status.completed||0}</span><span><Truck/> قيد التنفيذ: {totals.status.ongoing||0}</span><span><AlertTriangle/> متعثر: {totals.status.stagnant||0}</span><span><XCircle/> متوقف: {totals.status.stopped||0}</span><span><ClipboardList/> لم يبدأ: {totals.status.pending||0}</span></div>
    </div>
  </section>;
}
