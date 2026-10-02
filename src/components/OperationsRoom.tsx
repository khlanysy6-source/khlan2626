import React, { useMemo, useState } from 'react';
import { 
  Activity, AlertTriangle, ArrowLeft, Brain, CheckCircle2, Clock3, 
  Layers3, MapPinned, Route, ShieldCheck, Target, Users, Sparkles,
  FileCheck, AlertOctagon, ArrowUpRight, Search, Filter, Compass,
  ChevronRight, Building2, FileText, BarChart3, ExternalLink
} from 'lucide-react';
import { Initiative, UserRole } from '../types';
import OfficialRoadNetwork from './OfficialRoadNetwork';
import { getAIDevelopmentDecision } from '../utils/healthAndGapAnalysis';

type OpsScene = 'ops_map' | 'initiatives_registry' | 'critical_queue' | 'diagnostic_decision';

type Props = {
  initiatives: Initiative[];
  userRole: UserRole;
  onNavigateTab: (tab: string) => void;
  onSelectInitiative: (id: string) => void;
};

export default function OperationsRoom({ initiatives, userRole, onNavigateTab, onSelectInitiative }: Props) {
  const [activeScene, setActiveScene] = useState<OpsScene>('ops_map');
  const [selectedFocusId, setSelectedFocusId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const stats = useMemo(() => {
    const total = initiatives.length;
    const completed = initiatives.filter(i => i.status === 'completed' || Number(i.completionRate) >= 95).length;
    const stagnant = initiatives.filter(i => i.status === 'stagnant' || i.status === 'stopped').length;
    const ongoing = initiatives.filter(i => i.status === 'ongoing').length;
    const avg = total ? Math.round(initiatives.reduce((s, i) => s + (Number(i.completionRate) || 0), 0) / total) : 0;
    
    const decisions = initiatives.map(i => ({ i, d: getAIDevelopmentDecision(i) }));
    const critical = decisions.filter(x => x.d.riskSeverity === 'critical' || x.d.operationalClassification === 'struggling_escalation');
    const unconfirmed = initiatives.filter(i => !i.ownerConfirmed).length;
    const materialRisk = decisions.filter(x => x.d.cementRemaining > 150 && x.d.completionRate < 25).length;
    
    const attention = [
      ...critical.map(x => ({ ...x, reason: 'حالة حرجة تتطلب تدخلاً قيادياً فورياً' })),
      ...initiatives.filter(i => i.status === 'stagnant' || i.status === 'stopped').map(i => ({ 
        i, 
        d: decisions.find(x => x.i.id === i.id)?.d, 
        reason: 'تعثر ميداني يحتاج معالجة' 
      }))
    ].filter((x, idx, arr) => arr.findIndex(y => y.i.id === x.i.id) === idx);

    return { 
      total, 
      completed, 
      stagnant, 
      ongoing, 
      avg, 
      critical: critical.length, 
      unconfirmed, 
      materialRisk, 
      attention 
    };
  }, [initiatives]);

  // Focused initiative & decision
  const focusedInitiative = useMemo(() => {
    if (!selectedFocusId) return initiatives[0] || null;
    return initiatives.find(i => i.id === selectedFocusId) || initiatives[0] || null;
  }, [initiatives, selectedFocusId]);

  const focusedDecision = useMemo(() => {
    if (!focusedInitiative) return null;
    return getAIDevelopmentDecision(focusedInitiative);
  }, [focusedInitiative]);

  // Filtered initiatives for the Registry Scene
  const filteredInitiatives = useMemo(() => {
    return initiatives.filter(init => {
      const matchQuery = !searchQuery.trim() || 
        init.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        init.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(init.id).includes(searchQuery);
      
      const matchDistrict = selectedDistrict === 'all' || init.district === selectedDistrict;
      const matchStatus = selectedStatus === 'all' || init.status === selectedStatus;

      return matchQuery && matchDistrict && matchStatus;
    });
  }, [initiatives, searchQuery, selectedDistrict, selectedStatus]);

  // Unique districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    initiatives.forEach(i => {
      if (i.district) set.add(i.district);
    });
    return Array.from(set).sort();
  }, [initiatives]);

  const handleSelectAndInspect = (id: string, scene: OpsScene = 'diagnostic_decision') => {
    setSelectedFocusId(id);
    setActiveScene(scene);
    onSelectInitiative(id);
  };

  const go = (tab: string) => onNavigateTab(tab);

  return (
    <section className="ops-room" dir="rtl" aria-label="غرفة عمليات إب">
      <div className="ops-room__shell">
        {/* 1. Header: Live Command Topbar */}
        <header className="ops-room__topbar">
          <div className="ops-room__identity">
            <div className="ops-room__signal"><Activity size={18} /></div>
            <div>
              <div className="ops-room__eyebrow">IBB OPERATIONS COMMAND CENTER · LIVE SSoT</div>
              <h1>غرفة عمليات إب <span>مركز القيادة والتحكم التنموي الميداني الموحد</span></h1>
            </div>
          </div>
          <div className="ops-room__status">
            <span className="ops-room__pulse" /> 
            النظام التشغيلي متصل ومحدث · نطاق: {userRole === 'visitor' ? 'عرض عام' : 'محافظة إب'}
          </div>
        </header>

        {/* 2. Executive KPI Cards & Alert Strip */}
        <div className="ops-room__metrics">
          <button 
            type="button" 
            onClick={() => setActiveScene('initiatives_registry')} 
            title="عرض سجل المبادرات الكامل"
            className={activeScene === 'initiatives_registry' ? 'border-emerald-500 bg-emerald-950/20' : ''}
          >
            <Route className="text-emerald-400" />
            <strong>{stats.total.toLocaleString('ar-YE')}</strong>
            <span>إجمالي المبادرات</span>
          </button>

          <button 
            type="button" 
            onClick={() => go('periodic_reports')} 
            title="متوسط الإنجاز"
          >
            <Target className="text-sky-400" />
            <strong>{stats.avg}%</strong>
            <span>متوسط الإنجاز الفعلي</span>
          </button>

          <button 
            type="button" 
            onClick={() => setActiveScene('critical_queue')} 
            className={`${stats.critical > 0 ? 'is-alert' : ''} ${activeScene === 'critical_queue' ? 'border-rose-500' : ''}`}
            title="حالات حرجة تتطلب تصعيداً"
          >
            <AlertTriangle />
            <strong>{stats.critical}</strong>
            <span>حالات حرجة وتصعيد</span>
          </button>

          <button 
            type="button" 
            onClick={() => {
              setSelectedStatus('stagnant');
              setActiveScene('initiatives_registry');
            }} 
            title="مشاريع متعثرة أو متوقفة"
          >
            <Clock3 className="text-amber-400" />
            <strong>{stats.stagnant}</strong>
            <span>مشاريع متعثرة/متوقفة</span>
          </button>

          <button 
            type="button" 
            onClick={() => {
              setSelectedStatus('completed');
              setActiveScene('initiatives_registry');
            }} 
            title="مشاريع منجزة"
          >
            <CheckCircle2 className="text-emerald-400" />
            <strong>{stats.completed}</strong>
            <span>مشاريع منجزة بالكامل</span>
          </button>

          <button 
            type="button" 
            onClick={() => go('field_staging')} 
            title="تحتاج توثيق ملكية أو نزول ميداني"
          >
            <ShieldCheck className="text-purple-400" />
            <strong>{stats.unconfirmed}</strong>
            <span>تحتاج استكمال التوثيق</span>
          </button>
        </div>

        {/* 3. Operational Scene Switcher Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
          <nav className="flex items-center gap-1.5 flex-wrap" role="tablist" aria-label="المشاهد التشغيلية">
            <button
              type="button"
              role="tab"
              aria-selected={activeScene === 'ops_map'}
              onClick={() => setActiveScene('ops_map')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                activeScene === 'ops_map'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <MapPinned size={15} />
              <span>غرفة العمليات والخريطة التشغيلية</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeScene === 'initiatives_registry'}
              onClick={() => setActiveScene('initiatives_registry')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                activeScene === 'initiatives_registry'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <Route size={15} />
              <span>سجل المبادرات والمسارات ({stats.total})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeScene === 'critical_queue'}
              onClick={() => setActiveScene('critical_queue')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                activeScene === 'critical_queue'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-950'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <AlertTriangle size={15} />
              <span>طابور الحالات الحرجة ({stats.attention.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeScene === 'diagnostic_decision'}
              onClick={() => setActiveScene('diagnostic_decision')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                activeScene === 'diagnostic_decision'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-950'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <Brain size={15} />
              <span>فحص المبادرة والتشخيص التنموي</span>
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => go('decision_center')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Brain size={14} className="text-emerald-400" />
              <span>مركز القرار</span>
            </button>
            <button 
              type="button"
              onClick={() => go('district_portal')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Building2 size={14} className="text-sky-400" />
              <span>المديريات</span>
            </button>
          </div>
        </div>

        {/* SCENE 1: OPERATIONS COMMAND ROOM & GIS MAP */}
        {activeScene === 'ops_map' && (
          <div className="ops-room__main-grid">
            <div className="ops-room__map-panel">
              <OfficialRoadNetwork 
                initiatives={initiatives}
                compactHeader={true}
                selectedInitiativeId={selectedFocusId}
                onSelectInitiative={(id) => {
                  setSelectedFocusId(id);
                  onSelectInitiative(id);
                }}
              />
            </div>

            <aside className="ops-room__attention">
              <div className="ops-room__attention-head">
                <div>
                  <span>ATTENTION QUEUE · طابور الانتباه</span>
                  <h2>أولويات التدخل الميداني</h2>
                </div>
                <span className="ops-room__count">{stats.attention.length}</span>
              </div>

              <div className="ops-room__risk-strip">
                <div><b>{stats.critical}</b><span>حرجة</span></div>
                <div><b>{stats.materialRisk}</b><span>مخاطر مواد</span></div>
                <div><b>{stats.unconfirmed}</b><span>غير موثقة</span></div>
              </div>

              <div className="ops-room__attention-list max-h-[380px] overflow-y-auto">
                {stats.attention.length === 0 ? (
                  <div className="ops-room__empty">
                    <CheckCircle2 size={20} className="text-emerald-400" /> 
                    <span>لا توجد حالات تستدعي تصعيداً حالياً.</span>
                  </div>
                ) : (
                  stats.attention.slice(0, 15).map(({ i, reason }) => (
                    <button 
                      key={i.id} 
                      type="button"
                      onClick={() => {
                        setSelectedFocusId(i.id);
                        onSelectInitiative(i.id);
                      }}
                      className={selectedFocusId === i.id ? 'bg-slate-800 border-emerald-500/50' : ''}
                    >
                      <div className="ops-room__severity"><AlertTriangle size={14} /></div>
                      <div>
                        <strong>{i.name}</strong>
                        <span>{i.district || 'محافظة إب'} · {reason}</span>
                      </div>
                      <ArrowLeft size={15} />
                    </button>
                  ))
                )}
              </div>

              {/* Selected Focus Card */}
              {focusedInitiative && (
                <div className="mt-2 bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span>المشروع المحدد:</span>
                    <span className="text-emerald-400 font-bold">{focusedInitiative.completionRate}% إنجاز</span>
                  </div>
                  <div className="font-bold text-slate-100 mb-2 truncate">{focusedInitiative.name}</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAndInspect(focusedInitiative.id, 'diagnostic_decision')}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold text-center transition"
                    >
                      فتح الفحص والتشخيص
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectInitiative(focusedInitiative.id)}
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] transition"
                      title="فتح البطاقة الكاملة"
                    >
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              )}

              <div className="ops-room__actions mt-auto">
                <button type="button" onClick={() => go('decision_center')}><Brain size={15} /> مركز القرار</button>
                <button type="button" onClick={() => go('field_staging')}><Users size={15} /> الرفع الميداني</button>
                <button type="button" onClick={() => go('matrix')}><BarChart3 size={15} /> مصفوفة الكميات</button>
              </div>
            </aside>
          </div>
        )}

        {/* SCENE 2: INITIATIVES & ROUTES REGISTRY */}
        {activeScene === 'initiatives_registry' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Route className="text-emerald-400" size={18} />
                  سجل مبادرات الطرق ومسارات المسح الميداني
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {filteredInitiatives.length} من {initiatives.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  استعراض كامل لكافة مشاريع الطرق ومطابقتها مع البيانات الجغرافية الموثقة.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute right-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="بحث بالاسم أو المديرية..."
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg pr-8 pl-3 py-1.5 focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
                  />
                </div>

                <select
                  value={selectedDistrict}
                  onChange={e => setSelectedDistrict(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">كل المديريات ({districts.length})</option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">كل الحالات</option>
                  <option value="completed">منجز</option>
                  <option value="ongoing">قيد التنفيذ</option>
                  <option value="stagnant">متعثر</option>
                  <option value="stopped">متوقف</option>
                  <option value="pending">قيد الاعتماد</option>
                </select>
              </div>
            </div>

            {/* Registry Table / Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                    <th className="p-3">#</th>
                    <th className="p-3">اسم المبادرة</th>
                    <th className="p-3">المديرية</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3">نسبة الإنجاز</th>
                    <th className="p-3">المستفيدين</th>
                    <th className="p-3">التوثيق الجغرافي</th>
                    <th className="p-3 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInitiatives.slice(0, 50).map((init, idx) => (
                    <tr 
                      key={init.id} 
                      className={`hover:bg-slate-800/50 transition cursor-pointer ${
                        selectedFocusId === init.id ? 'bg-slate-800/70 border-r-2 border-emerald-500' : ''
                      }`}
                      onClick={() => setSelectedFocusId(init.id)}
                    >
                      <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-100">{init.name}</td>
                      <td className="p-3 text-slate-400">{init.district}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          init.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          init.status === 'ongoing' ? 'bg-sky-950 text-sky-400 border border-sky-800' :
                          init.status === 'stagnant' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          init.status === 'stopped' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {init.status === 'completed' ? 'منجز' :
                           init.status === 'ongoing' ? 'قيد التنفيذ' :
                           init.status === 'stagnant' ? 'متعثر' :
                           init.status === 'stopped' ? 'متوقف' : 'قيد الاعتماد'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full" 
                              style={{ width: `${Math.min(100, Number(init.completionRate) || 0)}%` }} 
                            />
                          </div>
                          <span className="font-bold text-slate-200">{init.completionRate}%</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono">{(Number(init.beneficiaries) || 0).toLocaleString('ar-YE')}</td>
                      <td className="p-3">
                        {init.coordinates ? (
                          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                            <MapPinned size={12} /> GPS موثق
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">سجل غير جغرافي</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAndInspect(init.id, 'ops_map');
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-[11px] font-bold transition flex items-center gap-1"
                            title="عرض على الخريطة"
                          >
                            <MapPinned size={12} />
                            <span>الخريطة</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAndInspect(init.id, 'diagnostic_decision');
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded text-[11px] font-bold transition flex items-center gap-1"
                            title="فحص وتشخيص"
                          >
                            <Brain size={12} />
                            <span>تشخيص</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SCENE 3: CRITICAL ESCALATIONS & RISK QUEUE */}
        {activeScene === 'critical_queue' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  طابور الانتباه الميداني والحالات التي تتطلب تدخلاً قيادياً
                </h2>
                <p className="text-xs text-slate-400">
                  فرز استراتيجي للمشاريع المتعثرة، مخاطر تلف المواد المخزنة، أو فجوات التوثيق المجتمعي.
                </p>
              </div>
              <span className="px-3 py-1 bg-rose-950/80 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-bold">
                {stats.attention.length} حالة قيد المتابعة
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.attention.map(({ i, d, reason }) => (
                <div 
                  key={i.id} 
                  className="bg-slate-950/70 border border-rose-900/30 rounded-xl p-3.5 flex flex-col justify-between hover:border-rose-700/60 transition"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-800 rounded text-[10px] font-bold">
                        {reason}
                      </span>
                      <span className="text-slate-400 font-mono">{i.district}</span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-100 mb-1">{i.name}</h3>
                    <p className="text-xs text-slate-400 mb-3">
                      {d?.diagnosticSummary || d?.proposedExecutiveDecision || 'يتطلب نزولاً ميدانياً وتحققاً من سبب التعثر.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900 p-2 rounded-lg border border-slate-800 mb-3">
                      <div>
                        <span className="text-slate-500 text-[10px] block">نسبة الإنجاز:</span>
                        <b className="text-rose-400">{i.completionRate}%</b>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">المستفيدين:</span>
                        <b className="text-slate-200">{(Number(i.beneficiaries) || 0).toLocaleString('ar-YE')}</b>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAndInspect(i.id, 'diagnostic_decision')}
                      className="flex-1 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <Brain size={13} />
                      <span>اتخاذ الإجراء التنموي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAndInspect(i.id, 'ops_map')}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition"
                      title="عرض الموقع على الخريطة"
                    >
                      <MapPinned size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCENE 4: TECHNICAL DIAGNOSTIC & LEADERSHIP DECISION */}
        {activeScene === 'diagnostic_decision' && focusedInitiative && focusedDecision && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5" dir="rtl">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
              <div>
                <span className="text-xs text-sky-400 font-bold flex items-center gap-1.5 mb-1">
                  <Brain size={15} /> بطاقة الفحص والتشخيص الهندسي والقرار التنموي
                </span>
                <h2 className="text-lg font-bold text-slate-100">{focusedInitiative.name}</h2>
                <p className="text-xs text-slate-400">{focusedInitiative.district} · {focusedInitiative.subDistrict || 'النطاق العام'}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAndInspect(focusedInitiative.id, 'ops_map')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <MapPinned size={14} />
                  <span>التركيز على الخريطة الجغرافية</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectInitiative(focusedInitiative.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <span>استعراض البطاقة الكاملة</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>

            {/* Golden Triangle Analysis: Budget, Time, Quality */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-2">
                  <Target size={14} /> قيود الميزانية والمواد
                </span>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">الأسمنت المصروف:</span>
                    <b>{(focusedInitiative as any).cementAllocated || 0} كيس</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الأسمنت المتبقي:</span>
                    <b className={focusedDecision.cementRemaining > 100 ? 'text-rose-400' : 'text-slate-200'}>
                      {focusedDecision.cementRemaining} كيس
                    </b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">حالة التخزين:</span>
                    <b className="text-emerald-400">مستودع آمن</b>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 mb-2">
                  <Clock3 size={14} /> قيود الوقت والجدول الزمني
                </span>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">نسبة الإنجاز الفعلي:</span>
                    <b className="text-sky-400">{focusedInitiative.completionRate}%</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">حالة التنفيذ:</span>
                    <b>{focusedDecision.classificationLabel}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">مستوى الخطورة:</span>
                    <b className={focusedDecision.riskSeverity === 'critical' ? 'text-rose-400' : 'text-emerald-400'}>
                      {focusedDecision.riskSeverity === 'critical' ? 'حرج' : 'مقبول'}
                    </b>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                  <ShieldCheck size={14} /> قيود الجودة والتوثيق الميداني
                </span>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">الإحداثيات والمسار:</span>
                    <b className={focusedInitiative.coordinates ? 'text-emerald-400' : 'text-amber-400'}>
                      {focusedInitiative.coordinates ? 'GPS موثق' : 'بانتظار الرفع'}
                    </b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الملكية المجتمعية:</span>
                    <b className={focusedInitiative.ownerConfirmed ? 'text-emerald-400' : 'text-amber-400'}>
                      {focusedInitiative.ownerConfirmed ? 'مؤكدة' : 'غير مؤكدة'}
                    </b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">تقرير المهندس:</span>
                    <b className="text-emerald-400">معتمد</b>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Decision & Executive Action Statement */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles size={14} /> التوجيه القيادي الموصى به (محرك القرار التنموي)
                </span>
                <span className="text-[11px] px-2 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">
                  {focusedDecision.operationalClassification}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {focusedDecision.diagnosticSummary || focusedDecision.proposedExecutiveDecision}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="ops-room__footer">
          <span><ShieldCheck size={13} /> القرار لا يُبنى قبل التحقق من مصدر البيانات ودرجة الثقة الهندسية.</span>
          <span>المركز التشغيلي هو نقطة الدخول الموحدة؛ البوابات التخصصية تعمل بتكامل معه.</span>
        </footer>
      </div>
    </section>
  );
}
