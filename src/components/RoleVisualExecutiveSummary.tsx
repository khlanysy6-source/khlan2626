import React, { useState } from 'react';
import { Initiative, UserRole, ROLE_LABELS } from '../types';
import { TabId, TAB_LABELS } from '../permissions';
import { 
  Building2, 
  MapPin, 
  Users, 
  Briefcase, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Award, 
  Sparkles, 
  Compass, 
  ShieldAlert, 
  ArrowLeft, 
  Brain, 
  Coins, 
  ChevronRight,
  Flame,
  Scale,
  Zap,
  Target,
  FileCheck2,
  FileSpreadsheet,
  X,
  Send,
  HelpCircle,
  Layers,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { getImpactMetrics } from '../utils/impact';

import { ExecutiveDecisionModal, ExecutiveActionType } from './ExecutiveDecisionModal';

interface RoleVisualExecutiveSummaryProps {
  userRole: UserRole;
  initiatives: Initiative[];
  onNavigateTab: (tabId: TabId) => void;
  onSelectInitiative?: (id: string) => void;
  onUpdateInitiative?: (initiative: Initiative) => void;
}

export const RoleVisualExecutiveSummary: React.FC<RoleVisualExecutiveSummaryProps> = ({
  userRole,
  initiatives,
  onNavigateTab,
  onSelectInitiative,
  onUpdateInitiative
}) => {
  // Local state for interactive progressive disclosure
  const [selectedIssueModal, setSelectedIssueModal] = useState<Initiative | null>(null);
  const [executiveDecisionInput, setExecutiveDecisionInput] = useState<string>('');
  const [decisionSuccessMessage, setDecisionSuccessMessage] = useState<string | null>(null);
  const [showFullPresidentDetails, setShowFullPresidentDetails] = useState<boolean>(false);
  const [governorSelectedDirectorate, setGovernorSelectedDirectorate] = useState<string>('all');
  const [governorDrillLevel, setGovernorDrillLevel] = useState<'governorate' | 'district' | 'sector' | 'initiative'>('governorate');

  // Executive Decision Modal State
  const [activeDecisionInit, setActiveDecisionInit] = useState<Initiative | null>(null);
  const [activeDecisionAction, setActiveDecisionAction] = useState<ExecutiveActionType>('direct');

  // Compute live statistics from initiatives
  const totalCount = initiatives.length;
  const completedList = initiatives.filter(i => i.status === 'completed');
  const ongoingList = initiatives.filter(i => i.status === 'ongoing');
  const stagnantList = initiatives.filter(i => i.status === 'stagnant' || i.decisionCategory === 'stagnant_needs_decision');
  const treatmentNeededList = initiatives.filter(i => i.decisionCategory === 'needs_treatment' || i.executiveDecision?.interventionPriority === 'urgent');
  const criticalRisksList = initiatives.filter(i => i.evaluation?.readinessLevel === 'low' || i.evaluation?.readinessLevel === 'not_ready' || i.executiveDecision?.interventionPriority === 'urgent' || i.status === 'stagnant');

  // Community contributions total
  const totalCommunityContributionValue = initiatives.reduce((sum, init) => {
    return sum + (init.communityContribution || 0) + init.contributions.reduce((sub, c) => sub + (c.value || 0), 0);
  }, 0);

  // Central Unit contribution total
  const totalUnitContributionValue = initiatives.reduce((sum, init) => sum + (init.unitContribution || 0), 0);

  // Impact metrics
  const impactSummary = initiatives.reduce((acc, init) => {
    const metrics = getImpactMetrics(init);
    return {
      beneficiaries: acc.beneficiaries + metrics.beneficiaries,
      totalDistance: acc.totalDistance + metrics.totalDistance,
      completedDistance: acc.completedDistance + metrics.completedDistance,
    };
  }, { beneficiaries: 0, totalDistance: 0, completedDistance: 0 });

  // Cement totals
  const totalCementApproved = initiatives.reduce((acc, init) => {
    let app = 0;
    if (init.materialsApproved && parseInt(init.materialsApproved)) app = parseInt(init.materialsApproved);
    else app = Math.round((init.unitContribution || 2000000) / 7500) || 150;
    return acc + app;
  }, 0);

  const totalCementDisbursed = initiatives.reduce((acc, init) => {
    let disb = 0;
    if (init.materialsDisbursed && parseInt(init.materialsDisbursed)) disb = parseInt(init.materialsDisbursed);
    else disb = Math.round((init.materialsApproved ? parseInt(init.materialsApproved) : 150) * 0.85);
    return acc + disb;
  }, 0);

  const formatMillionRials = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)} مليون ريال`;
    }
    return `${val.toLocaleString('ar-YE')} ريال`;
  };

  // Quick Action Handler for Executive Decisions
  const handleApplyExecutiveAction = (initiative: Initiative, actionType: ExecutiveActionType) => {
    setActiveDecisionInit(initiative);
    setActiveDecisionAction(actionType);
  };

  const handleExecuteDecisionModal = (updatedInit: Initiative, message: string) => {
    if (onUpdateInitiative) {
      onUpdateInitiative(updatedInit);
    }
    setDecisionSuccessMessage(message);
    setTimeout(() => {
      setDecisionSuccessMessage(null);
    }, 5000);
  };

  // Top 5 Urgent Issues needing Executive Attention
  const top5Issues = treatmentNeededList.length >= 5 
    ? treatmentNeededList.slice(0, 5) 
    : [...treatmentNeededList, ...stagnantList, ...initiatives.filter(i => i.status === 'ongoing')].slice(0, 5);

  // ---------------------------------------------------------------------------
  // 1. EXECUTIVE DIRECTOR & CENTRAL UNIT (المدير التنفيذي للوحدة المركزية)
  // ---------------------------------------------------------------------------
  const renderExecutiveDirectorView = () => {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Customized Short Navigation Toolbar for Executive Director */}
        <div className="bg-slate-900 text-white rounded-2xl p-2 flex items-center justify-between overflow-x-auto gap-2 border border-slate-800 shadow-md">
          <div className="flex items-center gap-1.5 shrink-0 px-3">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-amber-300">مسار المدير التنفيذي:</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onNavigateTab('home')}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-slate-800 text-amber-300 border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer whitespace-nowrap"
            >
              الرئيسية 🏠
            </button>
            <button
              onClick={() => onNavigateTab('decision_center')}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-amber-500 text-slate-950 font-black hover:bg-amber-400 transition-all cursor-pointer whitespace-nowrap"
            >
              القضايا والقرارات ⚡
            </button>
            <button
              onClick={() => onNavigateTab('initiatives')}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap"
            >
              سجل المبادرات 🚧
            </button>
            <button
              onClick={() => onNavigateTab('periodic_reports')}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap"
            >
              التقارير القيادية 📋
            </button>
          </div>
        </div>

        {/* Status Notification Toast */}
        {decisionSuccessMessage && (
          <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-lg border border-emerald-400 flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-white" />
              <span className="text-xs font-black">{decisionSuccessMessage}</span>
            </div>
            <button onClick={() => setDecisionSuccessMessage(null)} className="text-white hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header Summary Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black rounded-xl inline-flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  المدير التنفيذي للوحدة المركزية 🛡️
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[11px] font-bold rounded-lg border border-emerald-500/30">
                  لوحة القرارات الفورية
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                منظومة القرارات التنفيذية وحسم الاختناقات الميدانية
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl font-medium leading-relaxed">
                لوحة تفاعلية متخصصة لحصر وإدارة القضايا الميدانية الحرجة بمحافظة إب، وتقييم مؤشرات الجودة والجدول الزمني لحسم القرارات فوراً.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('decision_center')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer border border-amber-300/40 shrink-0"
            >
              <Brain className="w-4 h-4" />
              <span>مركز اتخاذ القرار التنموي ⚡</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: "الوضع التنموي الآن" (4 Pillar Status Cards) */}
        <div>
          <h3 className="text-xs font-black text-slate-600 mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>الوضع التنموي الآن بالميدان:</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 🟢 Pillar 1: Stable & Progressing */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs hover:border-emerald-300 transition-all bg-emerald-50/20">
              <div className="flex items-center justify-between text-emerald-800 text-xs font-black mb-2">
                <span>🟢 ما يسير جيدًا</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-emerald-900">{completedList.length + ongoingList.length}</span>
                <span className="text-xs font-bold text-emerald-700">مبادرة مستقرة</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-600 font-medium">
                {completedList.length} منجزة بالكامل و {ongoingList.length} قيد التنفيذ الملتزم بالمواصفات.
              </p>
            </div>

            {/* 🟠 Pillar 2: Needs Field Intervention */}
            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs hover:border-amber-300 transition-all bg-amber-50/20">
              <div className="flex items-center justify-between text-amber-800 text-xs font-black mb-2">
                <span>🟠 ما يحتاج تدخلًا</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-amber-900">{treatmentNeededList.length}</span>
                <span className="text-xs font-bold text-amber-700">مبادرة ميدانية</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-600 font-medium">
                تتطلب توجيهات للمهندسين والسلطة المحلية بمديرية إب لحل العقبات.
              </p>
            </div>

            {/* 🔴 Pillar 3: Needs Executive Decision */}
            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs hover:border-rose-300 transition-all bg-rose-50/30">
              <div className="flex items-center justify-between text-rose-800 text-xs font-black mb-2">
                <span>🔴 ما يحتاج قرارًا</span>
                <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-rose-900">{stagnantList.length}</span>
                <span className="text-xs font-bold text-rose-700">مبادرة بانتظار الاعتماد</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-600 font-medium">
                تتطلب قرار مناقلة للأسمنت أو اعتماد مالي حاسم لحماية المواد.
              </p>
            </div>

            {/* ⚠️ Pillar 4: Critical Risks */}
            <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-xs hover:border-slate-400 transition-all bg-slate-100/50">
              <div className="flex items-center justify-between text-slate-800 text-xs font-black mb-2">
                <span>⚠️ المخاطر الحرجة</span>
                <ShieldAlert className="w-4 h-4 text-slate-700" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-slate-900">{criticalRisksList.length}</span>
                <span className="text-xs font-bold text-slate-700">نقاط مخاطر عالية</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-600 font-medium">
                مخاوف تلف الأسمنت في المخازن أو نزاعات أهليّة تستدعي الحسم.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: "أهم 5 قضايا تحتاج انتباهك" (Top 5 Issue Cards) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="text-base font-black text-slate-900">
                  أهم 5 قضايا تحتاج انتباه المدير التنفيذي واتخاذ قرار مباشر:
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  مصنفة حسب الأثر التنموي وخطورة التأخير، اضغط على القضية لاستعراض العمق التدريجي والتفاصيل.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 text-xs font-black rounded-xl">
              تصلح لاتخاذ القرارات الفورية ⚡
            </span>
          </div>

          <div className="space-y-3">
            {top5Issues.map((issue, idx) => (
              <div 
                key={issue.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all space-y-3"
              >
                {/* Top Title Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <h4 className="text-sm font-black text-slate-900">
                      {issue.name}
                    </h4>
                    <span className="text-xs text-slate-500 font-bold">
                      ({issue.subDistrict || issue.village || 'مديرية إب'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-[11px] font-black rounded-lg border border-rose-200">
                      {issue.decisionCategory === 'needs_treatment' ? 'تدخل عاجل' : 'حسم متعثر'}
                    </span>
                    <button
                      onClick={() => setSelectedIssueModal(issue)}
                      className="text-xs font-black text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1 cursor-pointer bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>عرض التفاصيل الميدانية ←</span>
                    </button>
                  </div>
                </div>

                {/* 6 Structured Issue Items requested by user */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {/* Item 1: Issue/Problem */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block mb-0.5">⚠️ الإشكالية الميدانية:</span>
                    <p className="font-bold text-slate-800 leading-snug">
                      {issue.evaluation?.delayReasons?.join('، ') || issue.executiveDecision?.actionNotes || 'توقف الأعمال مؤقتاً بسبب بطء توريد المواد أو نزاع أهلي بالمسار.'}
                    </p>
                  </div>

                  {/* Item 2: Impact */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block mb-0.5">💥 الأثر التنموي:</span>
                    <p className="font-bold text-amber-800 leading-snug">
                      تأخير استفادة أكثر من {(issue.beneficiaries || getImpactMetrics(issue).beneficiaries || 3500).toLocaleString('ar-YE')} مواطن وتعريض أسمنت الدعم لخطر التكتل.
                    </p>
                  </div>

                  {/* Item 3: Proposed Action */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block mb-0.5">💡 الإجراء المقترح من المستشار:</span>
                    <p className="font-bold text-emerald-800 leading-snug">
                      {issue.executiveDecision?.requiredAction || 'مناقلة كمية الأسمنت للمبادرة المجاورة أو تكليف مهندس المنطقة بالنزول وحسم المسار.'}
                    </p>
                  </div>

                  {/* Item 4: Responsible Entity */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block mb-0.5">🏛️ الجهة المعنية والتنفيذية:</span>
                    <p className="font-bold text-indigo-900 leading-snug">
                      {issue.executiveDecision?.responsibleEntity || 'الوحدة المركزية بالاشتراك مع السلطة المحلية بالمديرية'}
                    </p>
                  </div>

                  {/* Item 5 & 6: Executive Decision Action Triggers */}
                  <div className="md:col-span-2 lg:col-span-2 bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold block">⚡ القرار المطلوب منك الآن:</span>
                      <span className="text-xs font-extrabold text-slate-200">اختر الإجراء القيادي المناسب للتنفيذ الفوري:</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleApplyExecutiveAction(issue, 'approve')}
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-[11px] transition-all cursor-pointer shadow-xs"
                      >
                        اعتماد ✅
                      </button>
                      <button
                        onClick={() => handleApplyExecutiveAction(issue, 'direct')}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[11px] transition-all cursor-pointer shadow-xs"
                      >
                        توجيه 💬
                      </button>
                      <button
                        onClick={() => handleApplyExecutiveAction(issue, 'refer')}
                        className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-lg text-[11px] transition-all cursor-pointer shadow-xs"
                      >
                        إحالة ↗️
                      </button>
                      <button
                        onClick={() => handleApplyExecutiveAction(issue, 'followup')}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white font-black rounded-lg text-[11px] transition-all cursor-pointer shadow-xs"
                      >
                        متابعة 🔍
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // 2. UNIT PRESIDENT (رئيس الوحدة - Executive Brief)
  // ---------------------------------------------------------------------------
  const renderUnitPresidentView = () => {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Short Navigation Toolbar for Unit President */}
        <div className="bg-slate-900 text-white rounded-2xl p-2 flex items-center justify-between overflow-x-auto gap-2 border border-slate-800 shadow-md">
          <div className="flex items-center gap-1.5 shrink-0 px-3">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black text-emerald-300">مسار رئيس الوحدة:</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onNavigateTab('home')}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-slate-800 text-emerald-300 border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer whitespace-nowrap"
            >
              الرئيسية 🏠
            </button>
            <button
              onClick={() => setShowFullPresidentDetails(!showFullPresidentDetails)}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-500 transition-all cursor-pointer whitespace-nowrap"
            >
              الملخص القيادي ⚡
            </button>
            <button
              onClick={() => onNavigateTab('decision_center')}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap"
            >
              القرارات والتوجيهات ⚡
            </button>
            <button
              onClick={() => onNavigateTab('periodic_reports')}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap"
            >
              التقارير الشاملة 📋
            </button>
          </div>
        </div>

        {/* Executive Brief Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 border border-emerald-800/80 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-900/60 pb-3">
              <div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black rounded-xl inline-flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  رئيس الوحدة المركزية للتدخلات التنموية 🏛️
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  «ملخص الوحدة القيادي — هذا الأسبوع»
                </h2>
              </div>
              <button
                onClick={() => setShowFullPresidentDetails(!showFullPresidentDetails)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>{showFullPresidentDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل الكاملة'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFullPresidentDetails ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* 5 Core Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold block mb-1">إجمالي المبادرات</span>
                <span className="text-2xl font-black text-white font-mono">{totalCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-800">
                <span className="text-[11px] text-emerald-300 font-bold block mb-1">مستقرة ومقبلة</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{completedList.length + ongoingList.length}</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-800">
                <span className="text-[11px] text-amber-300 font-bold block mb-1">تحتاج متابعة</span>
                <span className="text-2xl font-black text-amber-400 font-mono">{treatmentNeededList.length}</span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-800">
                <span className="text-[11px] text-rose-300 font-bold block mb-1">متعثرة</span>
                <span className="text-2xl font-black text-rose-400 font-mono">{stagnantList.length}</span>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-950/80 border border-indigo-800 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-indigo-300 font-bold block mb-1">حرجة تحتاج توجيهك</span>
                <span className="text-2xl font-black text-indigo-300 font-mono">{criticalRisksList.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Executive Columns: Achievements, Issues, Required Directives */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column 1: Highlights & Accomplishments */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 border-b border-slate-100 pb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black">أبرز إنجازات الأسبوع:</h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-700 font-medium">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span>إنجاز <strong className="text-emerald-700">{impactSummary.completedDistance.toFixed(1)} كم</strong> من أطوال الطرق الجبلية بمحافظة إب.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span>تعبئة مجتمعية بقيمة <strong className="text-emerald-700">{formatMillionRials(totalCommunityContributionValue)}</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span>صرف <strong className="text-emerald-700">{totalCementDisbursed.toLocaleString('ar-YE')} كيس أسمنت</strong> للمبادرات الملتزمة بالرفع الهندسي.</span>
              </li>
            </ul>
          </div>

          {/* Column 2: Bottlenecks & Concerns */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-rose-800 border-b border-slate-100 pb-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-black">أبرز الإشكاليات الحالية:</h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-700 font-medium">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                <span>وجود <strong className="text-rose-700">{stagnantList.length} مبادرات متعثرة</strong> تحتاج قرار مناقلة المواد للمبادرات المجاورة.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                <span>بطء الرفوعات المساحية بعزلتين بمديرية إب تتطلب تعزيز فريق مهندسي المنطقة.</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Directives Required */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 border-b border-slate-100 pb-2">
              <Brain className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black">التوجيهات المطلوبة منك:</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-1">
                <span className="font-bold text-indigo-950 block">القرار 01: اعتماد خطة المناقلة للمواد</span>
                <p className="text-[11px] text-slate-600">الموافقة على تحويل الأسمنت من المبادرات المتوقفة إلى المبادرات المتقدمة.</p>
                <button 
                  onClick={() => onNavigateTab('decision_center')}
                  className="mt-1 px-3 py-1 bg-indigo-700 text-white font-black text-[10px] rounded-lg cursor-pointer hover:bg-indigo-800"
                >
                  اعتماد التوجيه ←
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Column 4: Trends Indicators Since Last Report */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>مؤشرات تغيرت منذ التقرير السابق:</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-800 font-bold block">نسبة صرف أسمنت الدعم</span>
                <span className="text-sm font-black text-emerald-900">85% (+14% تحسن)</span>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-rose-800 font-bold block">سرعة التوثيق بالصور</span>
                <span className="text-sm font-black text-rose-900">72% (-5% تراجع)</span>
              </div>
              <TrendingDown className="w-5 h-5 text-rose-600 shrink-0" />
            </div>

            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-700 font-bold block">جودة الرفوعات الهندسية</span>
                <span className="text-sm font-black text-slate-900">98% (مستقر)</span>
              </div>
              <Minus className="w-5 h-5 text-slate-500 shrink-0" />
            </div>
          </div>
        </div>

        {/* Progressive Drill-Down View for Unit President */}
        {showFullPresidentDetails && (
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 animate-fadeIn border border-slate-800">
            <h4 className="text-sm font-black text-amber-300">تفاصيل المبادرات الميدانية الكاملة بمركز القرارات</h4>
            <p className="text-xs text-slate-300">
              يمكنك التدرج للنزول إلى تفاصيل كل مبادرة على حدة، ومراجعة المحاضر والرفوعات المساحية الميدانية.
            </p>
            <button
              onClick={() => onNavigateTab('decision_center')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer"
            >
              الانتقال لمركز القرارات التفصيلي ←
            </button>
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // 3. GOVERNOR (قيادة المحافظة - المحافظ)
  // ---------------------------------------------------------------------------
  const renderGovernorView = () => {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Short Navigation Toolbar for Governor */}
        <div className="bg-slate-900 text-white rounded-2xl p-2 flex items-center justify-between overflow-x-auto gap-2 border border-slate-800 shadow-md">
          <div className="flex items-center gap-1.5 shrink-0 px-3">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-black text-indigo-300">مسار المحافظ:</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onNavigateTab('home')}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-slate-800 text-indigo-300 border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer whitespace-nowrap"
            >
              الرئيسية 🏠
            </button>
            <button
              onClick={() => onNavigateTab('district_portal')}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-indigo-600 text-white font-black hover:bg-indigo-500 transition-all cursor-pointer whitespace-nowrap"
            >
              صورة المحافظة والمديريات 🏛️
            </button>
            <button
              onClick={() => onNavigateTab('interactive_map')}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap"
            >
              الخريطة والمواقع 🗺️
            </button>
            <button
              onClick={() => onNavigateTab('periodic_reports')}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap"
            >
              تقارير المحافظة 📋
            </button>
          </div>
        </div>

        {/* Governor Header Banner */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 border border-indigo-900/60 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-3 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black rounded-xl inline-flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-400" />
                السلطة المحلية بمحافظة إب - الأخ المحافظ 🏛️
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                لوحة القيادة التنموية العليا لمحافظة إب — مؤشرات السلطة المحلية
              </h2>
              <p className="text-xs text-indigo-200 max-w-2xl font-medium leading-relaxed">
                رؤية قيادية مكثفة تبرز الأثر التنموي الإجمالي لمشروعات الطرق والمبادرات بالمديريات الـ ٢٠، وتقييم مؤشرات الأداء الحاكمة للسلطة المحلية.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('district_portal')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer shrink-0 border border-indigo-400/30"
            >
              <Compass className="w-4 h-4" />
              <span>استعراض بوابة مديريات إب ←</span>
            </button>
          </div>
        </div>

        {/* "المحافظة في دقيقة" Key Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-bold block mb-1">إجمالي المبادرات</span>
            <span className="text-2xl font-black text-slate-900 font-mono">{totalCount}</span>
            <div className="mt-1 text-[10px] text-slate-500">في قرى وعزل محافظة إب</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-bold block mb-1">نسبة الإنجاز العام</span>
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {Math.round((completedList.length / (totalCount || 1)) * 100)}%
            </span>
            <div className="mt-1 text-[10px] text-emerald-600 font-bold">{completedList.length} مبادرة مكتملة</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-bold block mb-1">المبادرات المتقدمة</span>
            <span className="text-2xl font-black text-indigo-700 font-mono">{ongoingList.length}</span>
            <div className="mt-1 text-[10px] text-slate-500">أعمال شق ورصف جارية</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-bold block mb-1">المتعثرة بالمديريات</span>
            <span className="text-2xl font-black text-amber-700 font-mono">{stagnantList.length}</span>
            <div className="mt-1 text-[10px] text-amber-600 font-bold">تتطلب دعم مدراء المديريات</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-bold block mb-1">الحرجة بمحافظة إب</span>
            <span className="text-2xl font-black text-rose-700 font-mono">{treatmentNeededList.length}</span>
            <div className="mt-1 text-[10px] text-rose-600 font-bold">تتطلب توجيه قيادة المحافظة</div>
          </div>
        </div>

        {/* 4 Core Questions for the Governor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>أين يوجد التحسن؟</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              تتقدم مديريات (إب، يريم، العدين) بمعدلات شق ورصف عالية واستجابة مجتمعية نموذجية بلغت نسبتها 3.8 ضعف الدعم الحكومي.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-black text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>أين توجد المشكلة؟</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              تتركز التعثرات في المسارات التي بها نزاعات أهليّة على حرم الطريق أو بطء توثيق الرفوعات الهندسية من المشرفين.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-black text-amber-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>ما الذي يحتاج تدخلًا؟</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              توجيه مدراء المديريات والمكاتب التنفيذية بحسم النزاعات المحلية وتسهيل مرور المعدات وحماية مخازن الأسمنت.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-indigo-600" />
              <span>ما القرارات المطلوبة؟</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              إصدار تعميم للسلطة المحلية بالمديريات بمنح أولوية الدعم الفني للمبادرات الأكثر استجابة وتعبئة مجتمعية.
            </p>
          </div>
        </div>

        {/* Progressive Disclosure Breadcrumb Drill-Down: المحافظة ← المديرية ← القطاع ← المبادرة */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 space-y-4 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black text-amber-400">التدرج القيادي بالمحافظة:</span>
            <div className="flex items-center gap-1 text-xs">
              <span className={`px-2 py-0.5 rounded-md ${governorDrillLevel === 'governorate' ? 'bg-indigo-600 font-black' : 'text-slate-400'}`}>المحافظة</span>
              <span>←</span>
              <span className={`px-2 py-0.5 rounded-md ${governorDrillLevel === 'district' ? 'bg-indigo-600 font-black' : 'text-slate-400'}`}>المديرية</span>
              <span>←</span>
              <span className={`px-2 py-0.5 rounded-md ${governorDrillLevel === 'sector' ? 'bg-indigo-600 font-black' : 'text-slate-400'}`}>القطاع</span>
              <span>←</span>
              <span className={`px-2 py-0.5 rounded-md ${governorDrillLevel === 'initiative' ? 'bg-indigo-600 font-black' : 'text-slate-400'}`}>المبادرة</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 font-medium">
            تتيح لك المنصة الاستعراض المتدرج من أعلى مستوى قيادي بالمحافظة وصولاً للعمق التفصيلي عند الرغبة.
          </p>

          <button
            onClick={() => onNavigateTab('district_portal')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition-all cursor-pointer"
          >
            الانتقال لبوابة المديريات ←
          </button>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // 4. VISITOR (الزائر والجمهور)
  // ---------------------------------------------------------------------------
  const renderVisitorView = () => {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Short Navigation Toolbar for Visitor */}
        <div className="bg-slate-900 text-white rounded-2xl p-2 flex items-center justify-between overflow-x-auto gap-2 border border-slate-800 shadow-md">
          <div className="flex items-center gap-1.5 shrink-0 px-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black text-emerald-300">مسار الزائر:</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onNavigateTab('home')}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-slate-800 text-emerald-300 border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer whitespace-nowrap"
            >
              الرئيسية 🏠
            </button>
            <button
              onClick={() => onNavigateTab('initiatives')}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-500 transition-all cursor-pointer whitespace-nowrap"
            >
              استكشف المبادرات 🚧
            </button>
            <button
              onClick={() => onNavigateTab('interactive_map')}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap"
            >
              خريطة الإنجاز 🗺️
            </button>
            <button
              onClick={() => onNavigateTab('about')}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap"
            >
              عن المنصة 📋
            </button>
          </div>
        </div>

        {/* Visitor Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-emerald-500/40 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-3 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black rounded-xl inline-flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                مرحبًا بك في منصة المبادرات التنموية 🌿
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                بوابة الشفافية ومؤشرات الشراكة والتنمية بالميدان
              </h2>
              <p className="text-xs text-emerald-200 max-w-2xl font-medium leading-relaxed">
                استعرض ثمار التلاحم المجتمعي والدعم الحكومي في شق ورصف الطرق وتسهيل وصول الخدمات للمواطنين بمحافظة إب.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('initiatives')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer shrink-0 border border-emerald-300/40"
            >
              <span>استكشف المبادرات الميدانية 🚧</span>
            </button>
          </div>
        </div>

        {/* "ماذا تحقق؟" Quick Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
            <span className="text-xs text-slate-500 font-bold block">المبادرات المعتمدة</span>
            <span className="text-3xl font-black text-slate-900 font-mono">{totalCount}</span>
            <span className="text-[10px] text-emerald-600 font-bold block">مبادرة شق ورصف</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
            <span className="text-xs text-slate-500 font-bold block">أطوال الطرق المعبدة</span>
            <span className="text-3xl font-black text-indigo-700 font-mono">{impactSummary.completedDistance.toFixed(1)} كم</span>
            <span className="text-[10px] text-indigo-600 font-bold block">طرق جبلية تم تسهيلها</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
            <span className="text-xs text-slate-500 font-bold block">عدد المستفيدين</span>
            <span className="text-3xl font-black text-amber-800 font-mono">{impactSummary.beneficiaries.toLocaleString('ar-YE')}</span>
            <span className="text-[10px] text-amber-600 font-bold block">مواطن في قرى إب</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
            <span className="text-xs text-slate-500 font-bold block">المساهمة المجتمعية</span>
            <span className="text-2xl font-black text-emerald-700 block">{formatMillionRials(totalCommunityContributionValue)}</span>
            <span className="text-[10px] text-emerald-600 font-bold block">جهد ومساهمات أهلية</span>
          </div>
        </div>

        {/* Success Stories Cards for Visitor */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>قصص نجاح ومبادرات نوعية بالميدان:</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {initiatives.slice(0, 3).map(init => (
              <div key={init.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[10px] rounded-md inline-block">
                  قصة إنجاز
                </span>
                <h4 className="text-xs font-black text-slate-900 line-clamp-1">{init.name}</h4>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  تضافرت جهود الأهالي مع دعم الوحدة المركزية لرصف المسار وتسهيل حركة المواطنين.
                </p>
                <button
                  onClick={() => onNavigateTab('initiatives')}
                  className="text-[11px] font-black text-indigo-700 hover:underline cursor-pointer pt-1 block"
                >
                  استعرض المبادرة ←
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Switch between views strictly based on role
  return (
    <>
      {userRole === 'admin' || userRole === 'central_unit' ? (
        renderExecutiveDirectorView()
      ) : userRole === 'governorate' ? (
        renderGovernorView()
      ) : userRole === 'visitor' ? (
        renderVisitorView()
      ) : (
        renderExecutiveDirectorView()
      )}

      {/* Interactive Modal for Deep Field Facts (Progressive Disclosure) */}
      {selectedIssueModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 space-y-4 p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 font-black text-xs rounded-lg">
                  ملف قضية عاجلة # {selectedIssueModal.id}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {selectedIssueModal.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedIssueModal.subDistrict || 'عزلة الميدان'} - {selectedIssueModal.village || 'قرية المبادرة'}
                </p>
              </div>

              <button
                onClick={() => setSelectedIssueModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Deep Facts & Field Data */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 font-medium">
                <strong>وصف الإشكالية الميدانية: </strong>
                {selectedIssueModal.evaluation?.delayReasons?.join('، ') || 'توقف مؤقت بانتظار معالجة وضع الأسمنت أو الرفع المساحي المعتمد.'}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">كمية الأسمنت المعتمدة:</span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    {selectedIssueModal.materialsApproved || '150'} كيس
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">حالة المخزن بالميدان:</span>
                  <span className="text-sm font-black text-emerald-700">
                    مستوفية لشروط التخزين الآمن ✓
                  </span>
                </div>
              </div>

              {/* Direct Executive Note Input */}
              <div className="space-y-1 pt-2">
                <label className="text-xs font-black text-slate-800 block">
                  إضافة توجيه أو قرار تنفيذي مخصص:
                </label>
                <textarea
                  value={executiveDecisionInput}
                  onChange={(e) => setExecutiveDecisionInput(e.target.value)}
                  placeholder="اكتب التوجيه الصادر للفرسان والمهندس المشرف..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedIssueModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  handleApplyExecutiveAction(selectedIssueModal, 'approve');
                  setSelectedIssueModal(null);
                  setExecutiveDecisionInput('');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl cursor-pointer shadow-md"
              >
                حفظ واعتمد القرار الآن ✅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Executive Decision Interactive Modal */}
      <ExecutiveDecisionModal
        isOpen={!!activeDecisionInit}
        onClose={() => setActiveDecisionInit(null)}
        initiative={activeDecisionInit}
        initialActionType={activeDecisionAction}
        onExecuteDecision={handleExecuteDecisionModal}
      />
    </>
  );
};

export default RoleVisualExecutiveSummary;
