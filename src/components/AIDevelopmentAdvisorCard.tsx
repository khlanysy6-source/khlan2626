import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HardHat,
  Shield,
  Building2,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  Clock,
  Package,
  Users,
  Send,
  Zap,
  RotateCcw,
  Scale,
  Gauge,
  TrendingUp,
  Sliders,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  FileCheck,
  BarChart3
} from 'lucide-react';
import { Initiative } from '../types';
import { getAIDevelopmentDecision, AIDevelopmentDecision } from '../utils/healthAndGapAnalysis';
import { إنشاء_الملف_التنفيذي_للمبادرة } from '../utils/developmentDecisionEngine';

interface AIDevelopmentAdvisorCardProps {
  initiative: Initiative;
  onOpenAdvisorChat?: () => void;
  onNavigateToPathway?: (pathwayId: number) => void;
  onOpenMasterCard?: () => void;
  compact?: boolean;
}

export default function AIDevelopmentAdvisorCard({
  initiative,
  onOpenAdvisorChat,
  onNavigateToPathway,
  onOpenMasterCard,
  compact = false
}: AIDevelopmentAdvisorCardProps) {
  const decision: AIDevelopmentDecision = getAIDevelopmentDecision(initiative);
  const [activeDirective, setActiveDirective] = useState<'engineer' | 'knights' | 'supervisor'>('supervisor');
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Golden Triangle (المثلث الذهبي) Scenario Simulator State
  const [activeScenario, setActiveScenario] = useState<'none' | 'delay_support' | 'damaged_cement' | 'community_dispute'>('none');

  // Dynamic Golden Triangle Gauges based on scenario
  const getTripleConstraints = () => {
    let budgetScore = Math.min(100, Math.max(30, Math.round((initiative.communityContribution + initiative.unitContribution) > 0 ? 85 : 60)));
    let timeScore = Math.min(100, Math.max(20, Math.round(initiative.completionRate > 60 ? 80 : initiative.completionRate > 20 ? 50 : 30)));
    let qualityScore = Math.min(100, Math.max(40, Math.round(initiative.ownerConfirmed ? 88 : 65)));

    let impactNotes = "المؤشرات متوازنة حالياً ضمن النطاق المقبول لخطة المبادرة.";
    let pmiAdvice = "يوصى بالمتابعة المستمرة وتوثيق محاضر الاستلام الميداني دورياً.";

    if (activeScenario === 'delay_support') {
      budgetScore = Math.max(20, budgetScore - 25);
      timeScore = Math.max(15, timeScore - 35);
      qualityScore = Math.max(30, qualityScore - 10);
      impactNotes = "تأخر وصول دعم الديزل/الأسمنت يؤدي لزيادة مخاطر توقف المباشرة الميدانية وانخفاض كفاءة الميزانية بنسبة 25%.";
      pmiAdvice = "وفق معايير PMI: يوصى بتفعيل خطة الطوارئ الاحتياطية وإعادة جدولة المسار الحرج (Critical Path) مع التواصل المباشر بوحدة التدخلات.";
    } else if (activeScenario === 'damaged_cement') {
      budgetScore = Math.max(15, budgetScore - 35);
      timeScore = Math.max(20, timeScore - 20);
      qualityScore = Math.max(25, qualityScore - 40);
      impactNotes = "تلف أكياس الأسمنت جراء الرطوبة يسبب خسارة ماليّة وتراجع جودة الخرسانة والرصف الجبلي بدرجة حادة.";
      pmiAdvice = "توصية هندسية عاجلة: نقل الأسمنت فوراً لمستودع مرفوع 15سم عن الأرض ومغطى بالطربال، مع منع استخدام الأكياس المتصلبة نهائياً.";
    } else if (activeScenario === 'community_dispute') {
      budgetScore = Math.max(30, budgetScore - 10);
      timeScore = Math.max(10, timeScore - 50);
      qualityScore = Math.max(40, qualityScore - 15);
      impactNotes = "النزاعات الأهلية تسبب تجميد العمل الميداني كلياً وارتفاع مخاطر الفشل التنموي والزمني بنسبة 50%.";
      pmiAdvice = "التوجيه الحكيم: عقد جلسة صلح بحضور فرسان التنمية والسلطة المحلية وتوثيق التنازلات القانونية عن الأراضي رسمياً قبل استئناف الضخ.";
    }

    return { budgetScore, timeScore, qualityScore, impactNotes, pmiAdvice };
  };

  const tripleConstraints = getTripleConstraints();

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-emerald-500/40 space-y-5 font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap pb-3.5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40 animate-pulse">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-base sm:text-lg text-white">مستشار المشاريع التنموية والمواصفات الهندسية (AI Advisor)</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" /> مصدر القرار: محرك القرار التنموي V1 | PMI / PMP Standard
              </span>
            </div>
            <p className="text-xs text-slate-300">محاكاة قيود المثلث الذهبي ورأي المستشار القيادي التراكمي للمبادرة</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Jump to Master Card Button */}
          {onOpenMasterCard && (
            <button
              onClick={onOpenMasterCard}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl border border-emerald-400/50 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>فتح بطاقة المبادرة التفصيلية 📇</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Classification Badge */}
          <span className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 shadow-xs ${decision.classificationBadgeClass}`}>
            <span>{decision.classificationIcon}</span>
            <span>{decision.classificationLabel}</span>
          </span>

          {compact && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <>
          {/* =========================================================================
              1. THE GOLDEN TRIANGLE (مثلث القيود التنموية: الميزانية، الوقت، الجودة)
             ========================================================================= */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-400" />
                <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                  <span>مثلث القيود التنموية (المثلث الذهبي - Golden Triangle)</span>
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">ميزان إدارة قيود المشروع وفق معايير PMI</span>
            </div>

            {/* Scenario Simulator Buttons */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-amber-300 block flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-amber-400" /> اختر سيناريو محاكاة فورية لفحص الأثر على المثلث الذهبي:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <button
                  onClick={() => setActiveScenario('none')}
                  className={`p-2.5 rounded-xl border text-right font-bold transition-all cursor-pointer ${
                    activeScenario === 'none'
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/30'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  🟢 الوضع الطبيعي المستقر
                </button>

                <button
                  onClick={() => setActiveScenario('delay_support')}
                  className={`p-2.5 rounded-xl border text-right font-bold transition-all cursor-pointer ${
                    activeScenario === 'delay_support'
                      ? 'bg-amber-950/80 border-amber-400 text-amber-200 ring-2 ring-amber-400/30'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  🚚 محاكاة تأخر الدعم/الديزل
                </button>

                <button
                  onClick={() => setActiveScenario('damaged_cement')}
                  className={`p-2.5 rounded-xl border text-right font-bold transition-all cursor-pointer ${
                    activeScenario === 'damaged_cement'
                      ? 'bg-rose-950/80 border-rose-400 text-rose-200 ring-2 ring-rose-400/30'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  🌧️ محاكاة تلف الأسمنت والتخزين
                </button>

                <button
                  onClick={() => setActiveScenario('community_dispute')}
                  className={`p-2.5 rounded-xl border text-right font-bold transition-all cursor-pointer ${
                    activeScenario === 'community_dispute'
                      ? 'bg-purple-950/80 border-purple-400 text-purple-200 ring-2 ring-purple-400/30'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  🤝 محاكاة نزاعات تنازلات الأراضي
                </button>
              </div>
            </div>

            {/* 3 Triple Constraint Gauges (Budget, Time, Quality) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. Budget Gauge */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-indigo-300 flex items-center gap-1.5">
                    💰 كفاءة الميزانية (Budget)
                  </span>
                  <span className="font-black text-indigo-400 font-mono text-sm">{tripleConstraints.budgetScore}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      tripleConstraints.budgetScore > 70 ? 'bg-indigo-500' : tripleConstraints.budgetScore > 40 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${tripleConstraints.budgetScore}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  توازن المساهمة الذاتية مع الدعم الحكومي وضبط تكاليف المواد.
                </p>
              </div>

              {/* 2. Time Gauge */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-violet-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-violet-300 flex items-center gap-1.5">
                    ⏱️ الانضباط الزمني (Time)
                  </span>
                  <span className="font-black text-violet-400 font-mono text-sm">{tripleConstraints.timeScore}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      tripleConstraints.timeScore > 70 ? 'bg-violet-500' : tripleConstraints.timeScore > 40 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${tripleConstraints.timeScore}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  الالتزام بالجدول الزمني ومعدل سرعة تنفيذ الرصف والمسح الميداني.
                </p>
              </div>

              {/* 3. Quality Gauge */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-emerald-300 flex items-center gap-1.5">
                    📐 الجودة والمواصفات (Quality)
                  </span>
                  <span className="font-black text-emerald-400 font-mono text-sm">{tripleConstraints.qualityScore}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      tripleConstraints.qualityScore > 70 ? 'bg-emerald-500' : tripleConstraints.qualityScore > 40 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${tripleConstraints.qualityScore}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  جودة تقطيع ورصف الأحجار، بناء الجدران الساندة، وتصريف مياه الأمطار.
                </p>
              </div>
            </div>

            {/* PMI Strategic Advisor Executive Impact Notes */}
            <div className="bg-slate-950/90 border border-indigo-500/30 p-3.5 rounded-2xl space-y-1 text-xs">
              <span className="font-bold text-indigo-300 block flex items-center gap-1">
                <Brain className="w-4 h-4 text-indigo-400" /> تحليل الأثر التراكمي وتوجيه المستشار القيادي:
              </span>
              <p className="text-slate-200 leading-relaxed font-medium text-[11px]">
                {tripleConstraints.impactNotes}
              </p>
              <p className="text-emerald-300 leading-relaxed font-bold text-[11px] pt-1">
                💡 {tripleConstraints.pmiAdvice}
              </p>
            </div>
          </div>

          {/* =========================================================================
              2. 1-CLICK JUMP TO 5 DEVELOPMENTAL PATHWAYS (أزرار القفز للمسارات الخمسة)
             ========================================================================= */}
          {onNavigateToPathway && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <span className="text-xs font-black text-slate-300 block flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" /> القفز المباشر لمراجعة وتحديث المسارات الخمسة للمبادرة:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <button
                  onClick={() => onNavigateToPathway(1)}
                  className="p-2.5 bg-slate-800 hover:bg-emerald-900/60 text-slate-200 hover:text-emerald-200 rounded-xl border border-slate-700 hover:border-emerald-500/50 font-bold transition-all cursor-pointer text-right flex flex-col justify-between space-y-1"
                >
                  <span className="text-emerald-400 font-black text-[11px]">📐 مسار 1</span>
                  <span className="text-[10px] line-clamp-1">المسح والتقديرات الفنية</span>
                </button>

                <button
                  onClick={() => onNavigateToPathway(2)}
                  className="p-2.5 bg-slate-800 hover:bg-amber-900/60 text-slate-200 hover:text-amber-200 rounded-xl border border-slate-700 hover:border-amber-500/50 font-bold transition-all cursor-pointer text-right flex flex-col justify-between space-y-1"
                >
                  <span className="text-amber-400 font-black text-[11px]">🧱 مسار 2</span>
                  <span className="text-[10px] line-clamp-1">المواد والدعم اللوجستي</span>
                </button>

                <button
                  onClick={() => onNavigateToPathway(3)}
                  className="p-2.5 bg-slate-800 hover:bg-sky-900/60 text-slate-200 hover:text-sky-200 rounded-xl border border-slate-700 hover:border-sky-500/50 font-bold transition-all cursor-pointer text-right flex flex-col justify-between space-y-1"
                >
                  <span className="text-sky-400 font-black text-[11px]">🤝 مسار 3</span>
                  <span className="text-[10px] line-clamp-1">المساهمة والحوكمة</span>
                </button>

                <button
                  onClick={() => onNavigateToPathway(4)}
                  className="p-2.5 bg-slate-800 hover:bg-purple-900/60 text-slate-200 hover:text-purple-200 rounded-xl border border-slate-700 hover:border-purple-500/50 font-bold transition-all cursor-pointer text-right flex flex-col justify-between space-y-1"
                >
                  <span className="text-purple-400 font-black text-[11px]">📋 مسار 4</span>
                  <span className="text-[10px] line-clamp-1">التوثيق واللجان</span>
                </button>

                <button
                  onClick={() => onNavigateToPathway(5)}
                  className="p-2.5 bg-slate-800 hover:bg-rose-900/60 text-slate-200 hover:text-rose-200 rounded-xl border border-slate-700 hover:border-rose-500/50 font-bold transition-all cursor-pointer text-right flex flex-col justify-between space-y-1"
                >
                  <span className="text-rose-400 font-black text-[11px]">📊 مسار 5</span>
                  <span className="text-[10px] line-clamp-1">الأثر والتقييم التنموي</span>
                </button>
              </div>
            </div>
          )}

          {/* Diagnostic & Risk Summary Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 text-xs">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-400" /> التشخيص الحالي الشامل:
              </span>
              <p className="text-slate-200 leading-relaxed font-medium">
                {decision.diagnosticSummary}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> درجة الخطورة والمخاطر:
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${decision.riskBadgeClass}`}>
                  خطورة {decision.riskSeverityLabel}
                </span>
              </div>
              <p className="text-slate-300 text-[11px]">
                <strong>سبب التعثر/العائق:</strong> {decision.primaryStagnationCause}
              </p>
            </div>
          </div>

          {/* Decision & Action Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-amber-400 font-bold block">⚖️ القرار المقترح:</span>
              <p className="text-slate-200 font-semibold leading-normal">{decision.proposedExecutiveDecision}</p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-sky-400 font-bold block">👤 الجهة المسؤولة عن الإجراء:</span>
              <p className="text-slate-200 font-semibold leading-normal">{decision.responsibleEntity}</p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold block">🚀 الإجراء التالي المقترح:</span>
              <p className="text-slate-200 font-semibold leading-normal">{decision.nextProposedAction}</p>
            </div>
          </div>

          {/* Quick Real-Time Metrics Reading */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" /> نسبة الإنجاز
              </span>
              <span className="text-sm font-black text-emerald-400">{decision.completionRate}%</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block flex items-center gap-1">
                <Package className="w-3 h-3 text-amber-400" /> الأسمنت المتبقي
              </span>
              <span className="text-sm font-black text-amber-300">
                {decision.cementRemaining.toLocaleString('ar-YE')} <span className="text-[10px]">كيس</span>
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block flex items-center gap-1">
                <Users className="w-3 h-3 text-sky-400" /> المساهمة المجتمعية
              </span>
              <span className="text-sm font-black text-sky-300">
                {decision.communityContributionVal > 0 ? `${(decision.communityContributionVal / 1000).toFixed(1)}k YER` : 'عينية/عمل'}
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block flex items-center gap-1">
                <Clock className="w-3 h-3 text-rose-400" /> مدة التوقف التقديرية
              </span>
              <span className="text-sm font-black text-rose-300">
                {decision.stagnationMonths > 0 ? `${decision.stagnationMonths} أشهر` : 'مستمر'}
              </span>
            </div>
          </div>

          {/* Smart Recommendation Banner */}
          <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>التوصية التنفيذية الحكيمة للمساعد الذكي:</span>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed font-medium">
              {decision.smartRecommendation}
            </p>
          </div>

          {/* Role Directives Tabs & Content */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-amber-400" />
                التوجيهات التلقائية بحسب دور المستخدم:
              </span>

              {onOpenAdvisorChat && (
                <button
                  onClick={onOpenAdvisorChat}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 flex items-center gap-1 cursor-pointer"
                >
                  استشارة المستشار الهندسي 💬
                </button>
              )}
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-700/80 gap-1 text-xs font-bold">
              <button
                onClick={() => setActiveDirective('supervisor')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeDirective === 'supervisor'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                المشرف والقيادة
              </button>

              <button
                onClick={() => setActiveDirective('engineer')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeDirective === 'engineer'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <HardHat className="w-3.5 h-3.5" />
                المهندس الفني
              </button>

              <button
                onClick={() => setActiveDirective('knights')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeDirective === 'knights'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                الفرسان واللجنة
              </button>
            </div>

            {/* Active Directive Display */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 text-xs leading-relaxed text-slate-200 font-medium">
              {activeDirective === 'supervisor' && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 block">🏛️ التوجيه القيادي والتنفيذي:</span>
                  <p>{decision.supervisorDirective.replace('🏛️ **للمشرف والقيادة:** ', '')}</p>
                </div>
              )}

              {activeDirective === 'engineer' && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-amber-400 block">👷 الضوابط الهندسية والمواصفات:</span>
                  <p>{decision.engineerDirective.replace('👷 **للمهندس الفني:** ', '')}</p>
                </div>
              )}

              {activeDirective === 'knights' && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-sky-400 block">🛡️ التوجيه الميداني والتحشيد:</span>
                  <p>{decision.knightsDirective.replace('🛡️ **لفرسان التنمية:** ', '')}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

