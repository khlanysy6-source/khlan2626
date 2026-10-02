import React, { useMemo, useState } from 'react';
import {
  Activity, Archive, ArrowLeft, BarChart3, CheckCircle2, ClipboardCheck, ClipboardList,
  Database, FileCheck2, FileText, Flag, GitBranch, Gavel, MapPinned, PackageCheck,
  Route, Search, ShieldCheck, Target, Truck, Users, ArrowRightLeft
} from 'lucide-react';
import { Initiative, UserRole } from '../types';
import { SECOND_EXECUTIVE_PATHWAY } from '../pathway/secondPathModel';
import DecisionSourcePanel from './DecisionSourcePanel';
import { getStoredDecisions, DecisionRecord } from '../data/decisionsStore';

type Props = {
  initiatives: Initiative[];
  selectedInitiative?: Initiative | null;
  userRole: UserRole;
  onNavigate: (tab: string, initiativeId?: string | null, pathwayId?: number) => void;
};

type PortalItem = {
  id: string;
  title: string;
  subtitle: string;
  tab: string;
  pathway?: number;
  icon: React.ComponentType<{size?: number}>;
  group: string;
};

const ITEMS: PortalItem[] = [
  {id:'overview',title:'نظرة عامة',subtitle:'لوحة قيادة المسار',tab:'second_path',icon:Activity,group:'الرئيسية'},
  {id:'initiatives',title:'سجل المبادرات',subtitle:'البحث وملف المبادرة',tab:'initiatives',pathway:1,icon:Database,group:'البيانات'},
  {id:'map',title:'الخريطة الميدانية',subtitle:'المواقع والمسارات',tab:'interactive_map',icon:MapPinned,group:'البيانات'},
  {id:'impact',title:'الأثر التنموي',subtitle:'المستفيدون والنتائج',tab:'district_portal',icon:Target,group:'البيانات'},
  {id:'matrices',title:'المصفوفات والتقييم',subtitle:'الدراسة والكميات والفرز',tab:'matching_results',pathway:4,icon:GitBranch,group:'التحقق'},
  {id:'diagnosis',title:'التشخيص',subtitle:'الوضع الراهن والتوصيف',tab:'forms_portal',pathway:6,icon:ClipboardList,group:'التحقق'},
  {id:'readiness',title:'الجاهزية',subtitle:'التحقق قبل الإجراء',tab:'forms_portal',pathway:7,icon:ClipboardCheck,group:'التحقق'},
  {id:'decision',title:'القرار التنفيذي',subtitle:'الإجراء ومصدر القرار',tab:'decision_center',pathway:8,icon:Gavel,group:'التنفيذ'},
  {id:'execution',title:'التنفيذ والمتابعة',subtitle:'النزول والرفع الميداني',tab:'field_staging',pathway:9,icon:Truck,group:'التنفيذ'},
  {id:'transfer',title:'المناقلة والاستلام',subtitle:'تدوير العهدة وتوثيقها',tab:'forms_portal',pathway:10,icon:ArrowRightLeft,group:'التنفيذ'},
  {id:'completion',title:'الإنجاز والإغلاق',subtitle:'التقرير النهائي والاستلام',tab:'forms_portal',pathway:10,icon:FileCheck2,group:'الإغلاق'},
  {id:'archive',title:'الأرشيف والتقارير',subtitle:'السجل والتقارير الدورية',tab:'periodic_reports',pathway:11,icon:Archive,group:'الإغلاق'},
  {id:'charts',title:'المؤشرات والمخططات',subtitle:'قراءة النتائج والاتجاهات',tab:'interactive_charts',icon:BarChart3,group:'التحليل'},
];

const statusLabels: Record<string,string> = {
  completed:'منجزة', ongoing:'قيد التنفيذ', stagnant:'متعثرة', stopped:'متوقفة', pending:'لم تبدأ'
};

function n(v: unknown) { const x = Number(v); return Number.isFinite(x) ? x : 0; }

export default function SecondPathPortal({ initiatives, selectedInitiative, userRole, onNavigate }: Props) {
  const [active, setActive] = useState('overview');
  const [query, setQuery] = useState('');
  const [showDecisionSource, setShowDecisionSource] = useState(false);

  const totals = useMemo(() => {
    const counts = initiatives.reduce((a, i) => { a[i.status] = (a[i.status] || 0) + 1; return a; }, {} as Record<string, number>);
    const completion = initiatives.length ? initiatives.reduce((s, i) => s + n(i.completionRate), 0) / initiatives.length : 0;
    return { counts, completion };
  }, [initiatives]);

  const current = ITEMS.find(x => x.id === active) || ITEMS[0];
  const selectedNumber = selectedInitiative?.initiativeNumber || '';
  const decisions = useMemo(() => getStoredDecisions(), []);
  const decisionQueue = useMemo(() => decisions.filter(d => d.status === 'pending' || d.executionStatus === 'delayed' || d.type === 'transfer' || d.type === 'stagnation_treatment').slice(0, 6), [decisions]);

  const go = (item: PortalItem) => {
    setActive(item.id);
    if (item.tab !== 'second_path') onNavigate(item.tab, selectedInitiative?.id || null, item.pathway);
  };

  const filtered = useMemo(() => initiatives.filter(i => {
    const q = query.trim().toLowerCase();
    return !q || `${i.name} ${i.initiativeNumber} ${i.district} ${i.subDistrict}`.toLowerCase().includes(q);
  }).slice(0, 8), [initiatives, query]);

  const groups = ['الرئيسية','البيانات','التحقق','التنفيذ','الإغلاق','التحليل'];

  return <div className="second-portal" dir="rtl">
    <aside className="second-portal-sidebar">
      <div className="second-portal-brand">
        <div className="second-portal-logo"><ShieldCheck size={21}/></div>
        <div><span>غرفة عمليات إب</span><strong>المسار التنفيذي الثاني</strong></div>
      </div>
      <div className="second-portal-side-note">مسار موحد لإدارة المبادرة من التشخيص حتى الإغلاق، مع بقاء مصدر كل معلومة واضحاً.</div>
      <nav className="second-portal-nav" aria-label="قائمة المسار التنفيذي الثاني">
        {groups.map(group => <div key={group} className="second-portal-group">
          <div className="second-portal-group-title">{group}</div>
          {ITEMS.filter(x => x.group === group).map(item => {
            const Icon = item.icon;
            return <button key={item.id} className={`second-portal-nav-item ${active === item.id ? 'is-active' : ''}`} onClick={() => go(item)}>
              <Icon size={17}/><span><b>{item.title}</b><small>{item.subtitle}</small></span><ArrowLeft size={13}/>
            </button>;
          })}
        </div>)}
      </nav>
      <div className="second-portal-trust"><ShieldCheck size={15}/><span>مصدر الحقيقة محفوظ<br/><b>RBAC · Firebase · سجل المبادرة</b></span></div>
    </aside>

    <main className="second-portal-main">
      <header className="second-portal-topbar">
        <div><div className="second-portal-eyebrow">بوابة تشغيلية مستقلة داخل المنصة</div><h1>{current.title}</h1><p>{current.subtitle}</p></div>
        <div className="second-portal-top-actions">
          {selectedInitiative && <div className="second-portal-current"><span>المبادرة الحالية</span><b>{selectedNumber}</b><small>{selectedInitiative.name}</small></div>}
          <div className="second-portal-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث برقم المبادرة أو اسمها..."/><kbd>بحث</kbd></div>
          {selectedInitiative && <button className="source-margin-btn" onClick={() => setShowDecisionSource(v => !v)}><ShieldCheck size={14}/> مصدر القرار</button>}
          <button onClick={() => onNavigate('initiatives', selectedInitiative?.id || null)}><Search size={15}/> ملف المبادرة</button>
        </div>
      </header>

      {showDecisionSource && selectedInitiative && <DecisionSourcePanel initiative={selectedInitiative} onNavigate={onNavigate} />}

      {query.trim() && <section className="second-global-search-results">
        <div className="second-section-heading"><div><Search size={18}/><h2>نتائج البحث</h2></div><span>رقم المبادرة أو اسمها أو المديرية</span></div>
        <div className="second-mini-results">{filtered.map(i => <button key={i.id} onClick={() => { setQuery(''); onNavigate('initiatives', i.id, 1); }}>
          <span>{i.initiativeNumber}</span><b>{i.name}</b><small>{i.district} · {statusLabels[i.status] || i.status} · {n(i.completionRate)}%</small><ArrowLeft size={14}/>
        </button>)}{filtered.length === 0 && <div className="second-decision-empty">لا توجد مبادرة مطابقة للبحث.</div>}</div>
      </section>}

      {active === 'overview' ? <>
        <section className="second-hero">
          <div className="second-hero-copy"><div className="second-hero-kicker">EXECUTIVE PATHWAY · 02</div><h2>من التشخيص إلى الأثر<br/><em>في مسار واحد واضح</em></h2><p>بوابة القيادة التي تجمع البيانات، النماذج، القرارات، المتابعة، المناقلة، الإنجاز والأثر دون تكرار أو تنقل عشوائي بين الشاشات.</p><div className="second-hero-actions"><button onClick={() => go(ITEMS.find(x=>x.id==='initiatives')!)}>فتح سجل المبادرات <ArrowLeft size={15}/></button><button className="ghost" onClick={() => go(ITEMS.find(x=>x.id==='map')!)}>عرض الخريطة <MapPinned size={15}/></button></div></div>
          <div className="second-hero-seal"><div><Route size={26}/><b>مسار 02</b><span>تشغيل · قرار · أثر</span></div></div>
        </section>

        <section className="second-kpi-grid second-kpi-grid-portal">
          <div className="second-kpi"><Database size={18}/><span>إجمالي المبادرات</span><strong>{initiatives.length.toLocaleString('ar-YE')}</strong></div>
          <div className="second-kpi"><Activity size={18}/><span>متوسط الإنجاز</span><strong>{totals.completion.toFixed(1)}%</strong></div>
          <div className="second-kpi"><CheckCircle2 size={18}/><span>منجزة</span><strong>{(totals.counts.completed||0).toLocaleString('ar-YE')}</strong></div>
          <div className="second-kpi"><Truck size={18}/><span>قيد التنفيذ</span><strong>{(totals.counts.ongoing||0).toLocaleString('ar-YE')}</strong></div>
          <div className="second-kpi"><Flag size={18}/><span>تحتاج إجراء</span><strong>{((totals.counts.stagnant||0)+(totals.counts.stopped||0)).toLocaleString('ar-YE')}</strong></div>
        </section>

        <section className="second-decision-command">
          <div className="second-section-heading"><div><Gavel size={18}/><h2>ماذا يحتاج القرار الآن؟</h2></div><span>قائمة تشغيلية مرتبطة بالمبادرات الفعلية</span></div>
          <div className="second-decision-grid">
            {decisionQueue.map((d: DecisionRecord) => {
              const init = initiatives.find(i => i.id === d.initiativeId);
              return <article className="second-decision-card" key={d.id}>
                <div className="second-decision-card-top"><span>{d.decisionNumber}</span><b>{d.status === 'pending' ? 'بانتظار الاعتماد' : d.executionStatus === 'delayed' ? 'متأخر التنفيذ' : 'يتطلب متابعة'}</b></div>
                <h3>{d.title}</h3>
                <p>{d.problem}</p>
                <div className="second-decision-actions">
                  <button className="primary" onClick={() => onNavigate('decision_center', d.initiativeId, 8)}><Gavel size={14}/> فتح القرار</button>
                  {init && <button onClick={() => onNavigate('initiatives', init.id, 1)}><FileText size={14}/> ملف المبادرة</button>}
                </div>
                <div className="second-decision-source"><ShieldCheck size={12}/><span>مصدر القرار: بيانات المبادرة وسجل القرار</span>{init && <button onClick={() => onNavigate('initiatives', init.id, 1)}>فتح المبادرة ↗</button>}</div>
              </article>;
            })}
          </div>
          {decisionQueue.length === 0 && <div className="second-decision-empty">لا توجد قرارات معلقة ظاهرة في السجل الحالي.</div>}
        </section>

        <section className="second-command-map">
          <div className="second-section-heading"><div><GitBranch size={18}/><h2>الخريطة التشغيلية للمسار</h2></div><span>لا تنتقل المرحلة إلا بمخرج المرحلة السابقة</span></div>
          <div className="second-command-flow">{SECOND_EXECUTIVE_PATHWAY.map((node,i) => <React.Fragment key={node.id}><button onClick={() => {
            const item = ITEMS.find(x => x.id === ({'initiative-registry':'initiatives','studies':'matrices','material-ledger':'matrices','evaluation-matrix':'matrices','sorting-matrix':'matrices','diagnosis':'diagnosis','readiness':'readiness','decision':'decision','execution':'execution','completion':'completion','archive':'archive'} as Record<string,string>)[node.id]);
            if (item) go(item);
          }} className="second-command-node"><span>{node.order}</span><b>{node.title}</b><small>{node.produces[0]}</small></button>{i < SECOND_EXECUTIVE_PATHWAY.length-1 && <ArrowLeft size={14} className="second-command-arrow"/>}</React.Fragment>)}</div>
        </section>

        <section className="second-quick-grid">
          <button onClick={() => go(ITEMS.find(x=>x.id==='diagnosis')!)}><ClipboardList/><b>التشخيص</b><span>تحديد الحالة والتوصيف الفني</span></button>
          <button onClick={() => go(ITEMS.find(x=>x.id==='readiness')!)}><ClipboardCheck/><b>الجاهزية</b><span>هل المبادرة جاهزة للإجراء؟</span></button>
          <button onClick={() => go(ITEMS.find(x=>x.id==='decision')!)}><Gavel/><b>القرار</b><span>ما الإجراء التنفيذي المطلوب؟</span></button>
          <button onClick={() => go(ITEMS.find(x=>x.id==='execution')!)}><Truck/><b>التنفيذ</b><span>متابعة ميدانية ورفع موثق</span></button>
          <button onClick={() => go(ITEMS.find(x=>x.id==='transfer')!)}><ArrowRightLeft/><b>المناقلة</b><span>تدوير المواد وتوثيق الاستلام</span></button>
          <button onClick={() => go(ITEMS.find(x=>x.id==='completion')!)}><FileCheck2/><b>الإغلاق</b><span>إنجاز واستلام وأرشفة</span></button>
        </section>
      </> : <section className="second-module-panel">
        <div className="second-module-head"><div><span>وحدة المسار التنفيذي الثاني</span><h2>{current.title}</h2><p>{current.subtitle} — يتم فتح الوظيفة الأصلية في المنصة مع الاحتفاظ بسياق المبادرة.</p></div><div className="second-module-badge"><ShieldCheck size={15}/> صلاحية: {String(userRole)}</div></div>
        {active === 'initiatives' && <div className="second-search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث برقم المبادرة أو الاسم أو المديرية..."/>{query && <span>{filtered.length} نتائج ظاهرة</span>}</div>}
        <div className="second-module-explain"><div className="second-module-icon"><current.icon size={25}/></div><div><b>{current.title}</b><p>هذه البوابة هي نقطة الدخول المختصرة. عند الضغط على الوظيفة، تنتقل المنصة إلى المكون التشغيلي الأصلي بدلاً من إنشاء شاشة مكررة.</p></div></div>
        {active === 'initiatives' && filtered.length > 0 && <div className="second-mini-results">{filtered.map(i=><button key={i.id} onClick={()=>onNavigate('initiatives',i.id,1)}><span>{i.initiativeNumber}</span><b>{i.name}</b><small>{i.district} · {statusLabels[i.status] || i.status} · {n(i.completionRate)}%</small><ArrowLeft size={14}/></button>)}</div>}
        <div className="second-module-actions"><button className="primary" onClick={()=>onNavigate(current.tab,selectedInitiative?.id||null,current.pathway)}><current.icon size={16}/> فتح {current.title}</button>{selectedInitiative && <button onClick={()=>onNavigate('initiatives',selectedInitiative.id,1)}><FileText size={16}/> فتح ملف المبادرة</button>}<button onClick={()=>setActive('overview')}><ArrowLeft size={16}/> العودة إلى بوابة المسار</button></div>
      </section>}
    </main>
  </div>;
}
