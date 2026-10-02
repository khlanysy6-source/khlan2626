import React from 'react';
import { Initiative, TabId, UserRole } from '../types';
import { 
  Compass, 
  MapPin, 
  ChevronLeft, 
  HardHat, 
  Search, 
  Brain, 
  BarChart3, 
  FileText, 
  X, 
  ArrowRight,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Scale,
  Sparkles,
  Layers,
  FileCheck2
} from 'lucide-react';

interface InitiativeContextBannerProps {
  initiative: Initiative;
  activeMainTab: TabId;
  previousTab: TabId | null;
  onNavigateTab: (tab: TabId, initiativeId?: string | null, pathwayId?: number) => void;
  onClearInitiative: () => void;
  onBack?: () => void;
  currentPathway?: number;
  userRole?: UserRole | 'admin' | 'visitor' | string;
}

export default function InitiativeContextBanner({
  initiative,
  activeMainTab,
  previousTab,
  onNavigateTab,
  onClearInitiative,
  onBack,
  currentPathway,
  userRole
}: InitiativeContextBannerProps) {
  // Get active tab label for breadcrumb
  const getTabLabel = (tab: TabId) => {
    switch (tab) {
      case 'engineers_portal':
        return '👷 استمارة وتقارير المهندسين';
      case 'periodic_reports':
        return '🔍 تقارير الرقابة والمتابعة';
      case 'decision_center':
        return '🧠 مركز اتخاذ القرار التنموي';
      case 'matrix':
        return '📊 مصفوفة الكميات ومقارنة الأسمنت';
      case 'matching_results':
        return '🎯 الفرز والمطابقة والنتائج';
      case 'initiatives':
        return '📁 ملف المبادرة والمسارات الخمسة';
      case 'interactive_map':
        return '📍 الخريطة الجغرافية التفاعلية';
      case 'advisor':
        return '💡 المستشار التنموي الذكي';
      case 'field_staging':
        return '🏗️ الرفع الميداني والفرز';
      case 'tracking_sheet':
        return '📊 شيت المتابعة ودليل الفرسان';
      case 'activation_plan':
        return '📘 خطة التفعيل التنموي';
      case 'workshop':
        return '👥 ورشة العمل والمحاكاة';
      default:
        return 'المبادرة النشطة';
    }
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full">منجزة 🏆</span>;
      case 'stagnant':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse">متعثرة (تدخل قرار) 🚨</span>;
      case 'stopped':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full">متوقفة مؤقتاً ⚠️</span>;
      default:
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full">قيد التنفيذ ⚡</span>;
    }
  };

  const currentTabLabel = getTabLabel(activeMainTab);

  return (
    <div className="bg-slate-950 border-2 border-emerald-500/40 text-white rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden mb-6 animate-fadeIn" id="initiative-context-banner">
      {/* Background glow effects */}
      <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-3">
        {/* Top Line: Breadcrumb Trail & Quick Context Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          {/* Breadcrumb Navigation Trail */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-300 flex-wrap font-medium">
            <button
              onClick={() => onNavigateTab('home')}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 font-bold cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>مركز القيادة</span>
            </button>

            <ChevronLeft className="w-3.5 h-3.5 text-slate-500 shrink-0" />

            <button
              onClick={() => onNavigateTab('initiatives')}
              className="hover:text-emerald-400 transition-colors font-bold cursor-pointer"
            >
              محفظة المبادرات
            </button>

            <ChevronLeft className="w-3.5 h-3.5 text-slate-500 shrink-0" />

            <span className="text-slate-400 font-bold">
              مديرية {initiative.district}
            </span>

            <ChevronLeft className="w-3.5 h-3.5 text-slate-500 shrink-0" />

            <button
              onClick={() => onNavigateTab('initiatives', initiative.id)}
              className="text-emerald-300 hover:text-emerald-200 font-black truncate max-w-[220px] transition-colors cursor-pointer"
              title="العودة لصفحة تفاصيل هذه المبادرة"
            >
              {initiative.name}
            </button>

            {currentPathway && (
              <>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="bg-indigo-950 text-indigo-300 border border-indigo-700/80 px-2 py-0.5 rounded-md font-black text-[10px] flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-400" />
                  المسار {currentPathway}
                </span>
              </>
            )}

            <ChevronLeft className="w-3.5 h-3.5 text-slate-500 shrink-0" />

            <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-md font-black text-[11px]">
              {currentTabLabel}
            </span>
          </nav>

          {/* Context Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
            {/* 1. Smart Back Button */}
            <button
              onClick={() => {
                if (onBack) {
                  onBack();
                } else if (previousTab && previousTab !== activeMainTab) {
                  onNavigateTab(previousTab, initiative.id);
                } else {
                  onNavigateTab('initiatives', initiative.id);
                }
              }}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-black px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="الرجوع للخطوة السابقة"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة ↩️</span>
            </button>

            {/* 2. Return directly to Initiative Detail if in another tab */}
            {activeMainTab !== 'initiatives' && (
              <button
                onClick={() => onNavigateTab('initiatives', initiative.id)}
                className="bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/80 text-xs font-black px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                title="الرجوع لملف المبادرة والمسارات"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>ملف المبادرة 📁</span>
              </button>
            )}

            {/* 3. Open Decision Center for this initiative */}
            {activeMainTab !== 'decision_center' && (
              <button
                onClick={() => onNavigateTab('decision_center', initiative.id)}
                className="bg-indigo-950/90 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/80 text-xs font-black px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                title="فتح مركز القرار التنموي لهذه المبادرة"
              >
                <Scale className="w-3.5 h-3.5 text-indigo-400" />
                <span>مركز القرار ⚖️</span>
              </button>
            )}

            {/* 4. Open the original forms transaction workspace */}
            <button
              onClick={() => onNavigateTab('forms_portal', initiative.id)}
              className="bg-cyan-950/90 hover:bg-cyan-900 text-cyan-200 border border-cyan-700/80 text-xs font-black px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              title="فتح النماذج الأصلية المرتبطة بهذه المبادرة"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>النماذج والمعاملات 📑</span>
            </button>

            {/* 4. Open Advisor for this initiative */}
            {activeMainTab !== 'advisor' && (
              <button
                onClick={() => onNavigateTab('advisor', initiative.id)}
                className="bg-amber-950/90 hover:bg-amber-900 text-amber-200 border border-amber-700/80 text-xs font-black px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                title="فتح المستشار الذكي لهذه المبادرة"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>المستشار 💡</span>
              </button>
            )}

            {/* 5. Clear Context / Switch Initiative */}
            <button
              onClick={onClearInitiative}
              className="bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/80 text-xs font-extrabold px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              title="إغلاق سياق المبادرة الحالية للرجوع للمحفظة الكاملة"
            >
              <X className="w-3.5 h-3.5 text-rose-400" />
              <span>إغلاق السياق ✖</span>
            </button>
          </div>
        </div>

        {/* Middle Main Header: Active Initiative Overview */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-emerald-500/30 p-3.5 sm:p-4 rounded-2xl">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-black px-2 py-0.5 rounded-md">
                📌 المبادرة الحالية في السياق التشغيلي
              </span>
              <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono">
                كود: {initiative.initiativeNumber || `IMP-${initiative.id.substring(0, 6)}`}
              </span>
              {getStatusBadge(initiative.status)}
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                القطاع: {initiative.sector || 'طرقات ورصف'}
              </span>
            </div>

            <h2 className="text-base sm:text-lg md:text-xl font-black text-white leading-snug">
              {initiative.name}
            </h2>

            <div className="flex items-center gap-3 text-xs text-slate-300 font-bold flex-wrap pt-0.5">
              <span className="flex items-center gap-1 text-emerald-400">
                <MapPin className="w-3.5 h-3.5" />
                محافظة {initiative.governorate || 'إب'} • مديرية {initiative.district}
              </span>
              {initiative.subDistrict && <span>• عزلة {initiative.subDistrict}</span>}
              {initiative.village && <span>• قرية {initiative.village}</span>}
              <span className="text-amber-300 font-black font-mono">
                • التكلفة: {((initiative.cost || (initiative.communityContribution + initiative.unitContribution)) || 0).toLocaleString()} ريال
              </span>
            </div>
          </div>

          {/* Field Completion Progress Counter */}
          <div className="w-full lg:w-60 bg-slate-950/80 border border-slate-800 rounded-xl p-3 shrink-0 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>نسبة الإنجاز الميداني:</span>
              <span className="text-emerald-400 font-extrabold text-sm font-mono">{initiative.completionRate || 0}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${initiative.completionRate || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>الإثبات: {initiative.ownerConfirmed ? 'مثبت ✓' : 'بانتظار الإثبات ⏳'}</span>
              <span>المستفيدون: {((initiative.cost || 5000000) / 2500).toFixed(0)} نسمة</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Contextual Operational Portals Switcher */}
        <div className="pt-2">
          <div className="text-[11px] text-slate-400 font-bold mb-1.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>البوابات والأدوات التشغيلية المرتبطة بالمبادرة:</span>
            </div>
            <span className="text-[10px] text-slate-500">التنقل يحتفظ تلقائياً بسياق المبادرة الحالية وسجل العودة</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* 1. Evaluation & Engineering Portal */}
            <button
              onClick={() => onNavigateTab('engineers_portal', initiative.id)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                activeMainTab === 'engineers_portal'
                  ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-md scale-[1.02]'
                  : 'bg-slate-900 hover:bg-slate-800 text-emerald-300 border-emerald-500/30'
              }`}
            >
              <HardHat className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">👷 تقارير المهندسين</span>
            </button>

            {/* 2. Follow-up / Monitoring Portal */}
            <button
              onClick={() => onNavigateTab('periodic_reports', initiative.id)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                activeMainTab === 'periodic_reports'
                  ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-md scale-[1.02]'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/30'
              }`}
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">🔍 الرقابة والمتابعة</span>
            </button>

            {/* 3. Decision Center */}
            <button
              onClick={() => onNavigateTab('decision_center', initiative.id)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                activeMainTab === 'decision_center'
                  ? 'bg-indigo-500 text-white font-black border-indigo-400 shadow-md scale-[1.02]'
                  : 'bg-slate-900 hover:bg-slate-800 text-indigo-300 border-indigo-500/30'
              }`}
            >
              <Brain className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">🧠 مركز القرار</span>
            </button>

            {/* 4. Quantities Matrix */}
            <button
              onClick={() => onNavigateTab('matrix', initiative.id)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                activeMainTab === 'matrix'
                  ? 'bg-sky-500 text-slate-950 font-black border-sky-400 shadow-md scale-[1.02]'
                  : 'bg-slate-900 hover:bg-slate-800 text-sky-300 border-sky-500/30'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">📊 مصفوفة الكميات</span>
            </button>

            {/* 5. Desk Review & Matching */}
            <button
              onClick={() => onNavigateTab('matching_results', initiative.id)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                activeMainTab === 'matching_results'
                  ? 'bg-rose-500 text-white font-black border-rose-400 shadow-md scale-[1.02]'
                  : 'bg-slate-900 hover:bg-slate-800 text-rose-300 border-rose-500/30'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">🎯 الفرز والمطابقة</span>
            </button>

            {/* 6. Full Initiative File */}
            <button
              onClick={() => onNavigateTab('initiatives', initiative.id)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                activeMainTab === 'initiatives'
                  ? 'bg-slate-100 text-slate-950 font-black border-white shadow-md scale-[1.02]'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">📁 الملف الكامل</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
