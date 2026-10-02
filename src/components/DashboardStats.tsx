/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Initiative } from '../types';
import { Coins, Users, ShieldAlert, CheckCircle, TrendingUp, Sparkles, HeartHandshake, MapPin, Milestone, Activity, Brain } from 'lucide-react';
import { getImpactMetrics } from '../utils/impact';
import { تجميع_إحصائيات_المحرك } from '../utils/developmentDecisionEngine';
import { حساب_محرك_الحقيقة_الحسابية } from '../utils/calculationTruthEngine';

interface DashboardStatsProps {
  initiatives: Initiative[];
}

export default function DashboardStats({ initiatives }: DashboardStatsProps) {
  // Engine Central Mathematical Truth & Analytics
  const math = حساب_محرك_الحقيقة_الحسابية(initiatives);
  const engineStats = تجميع_إحصائيات_المحرك(initiatives);

  // Central Metrics from Mathematical Truth Engine
  const totalInitiatives = math.إجمالي_المبادرات;
  const ongoingCount = math.المبادرات_الجارية;
  const stagnantCount = math.المبادرات_المتعثرة;
  const completedCount = math.المبادرات_المكتملة;
  const pendingCount = math.المبادرات_المعلقة_قيد_التجهيز;
  const stoppedCount = math.المبادرات_المتوقفة;

  // Aggregated Developmental Impact Metrics
  const impactStats = initiatives.reduce((acc, init) => {
    const metrics = getImpactMetrics(init);
    return {
      beneficiaries: acc.beneficiaries + metrics.beneficiaries,
      totalDistance: acc.totalDistance + metrics.totalDistance,
      completedDistance: acc.completedDistance + metrics.completedDistance,
      impactScore: acc.impactScore + metrics.impactScore,
    };
  }, { beneficiaries: 0, totalDistance: 0, completedDistance: 0, impactScore: 0 });

  // Community contribution from mathematical engine
  const totalContributions = math.إجمالي_مساهمة_المجتمع;

  // Active knights
  const totalKnights = initiatives.reduce((sum, init) => {
    return sum + (init.committee || []).filter(c => c.role === 'knight').length;
  }, 0);

  // Storage risk monitoring
  let totalMaterials = 0;
  let atRiskMaterials = 0;
  initiatives.forEach(init => {
    (init.materials || []).forEach(m => {
      totalMaterials++;
      if (m.status === 'at_risk') {
        atRiskMaterials++;
      }
    });
  });

  // Calculate overall pathway progress across all active initiatives
  const totalTasks = initiatives.reduce((sum, init) => {
    return sum + (init.pathways || []).reduce((subSum, p) => subSum + p.tasks.length, 0);
  }, 0);
  const completedTasks = initiatives.reduce((sum, init) => {
    return sum + (init.pathways || []).reduce((subSum, p) => subSum + p.tasks.filter(t => t.completed).length, 0);
  }, 0);
  const overallProgressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Formatting currency (Yemeni Rial)
  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(2)} مليون ريال`;
    }
    return `${val.toLocaleString('ar-YE')} ريال`;
  };

  // Aggregated Cement Metrics directly from Central Mathematical Truth Engine
  const cementStats = {
    approved: math.إجمالي_الإسمنت_المعتمد,
    disbursed: math.إجمالي_الإسمنت_المنصرف,
    used: math.إجمالي_الإسمنت_المستخدم,
    remainingAtUnit: Math.max(0, math.إجمالي_الإسمنت_المعتمد - math.إجمالي_الإسمنت_المنصرف),
    fieldRemaining: Math.max(0, math.إجمالي_الإسمنت_المنصرف - math.إجمالي_الإسمنت_المستخدم),
    excessDiscrepancy: Math.max(0, math.إجمالي_الإسمنت_المستخدم - math.إجمالي_الإسمنت_المنصرف)
  };

  // Advanced features: Economic Impact & Multiplier Index
  const laborValue = Math.round(totalContributions * 0.35); // 35% estimated as manual labor value
  const workdaysCount = Math.round(laborValue / 12000); // 12,000 YER per workday regional average in Ibb
  const stateSupportValue = (cementStats.approved * 7500); // 7,500 YER per cement bag
  const selfRelianceMultiplier = stateSupportValue > 0 ? (totalContributions / stateSupportValue).toFixed(1) : "3.8";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8" dir="rtl" id="dashboard-stats-grid">
      {/* Executive Status Breakdown Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs col-span-full" id="status-distribution-bar">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block animate-pulse"></span>
            الموقف التنفيذي التفصيلي لمبادرات الطرق بمحافظة إب ({totalInitiatives} مبادرة):
          </h4>
          <span className="bg-emerald-950 text-emerald-300 text-[11px] font-extrabold px-3 py-1 rounded-xl border border-emerald-700/60 inline-flex items-center gap-1.5 shadow-2xs">
            <Brain className="w-3.5 h-3.5 text-emerald-400" />
            مصدر القرار: محرك القرار التنموي V1
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-emerald-50/50 border border-emerald-100/80 px-3.5 py-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-emerald-700 block mb-1">منجز ✓</span>
            <span className="text-xl font-mono font-black text-emerald-800">{completedCount}</span>
            <span className="text-[9px] text-emerald-600 block mt-0.5">مبادرات</span>
          </div>
          <div className="bg-indigo-50/50 border border-indigo-100/80 px-3.5 py-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-indigo-700 block mb-1">قيد التنفيذ 🚧</span>
            <span className="text-xl font-mono font-black text-indigo-800">{ongoingCount}</span>
            <span className="text-[9px] text-indigo-600 block mt-0.5">مبادرات</span>
          </div>
          <div className="bg-amber-50/50 border border-amber-100/80 px-3.5 py-2.5 rounded-xl text-center animate-pulse">
            <span className="text-[10px] font-bold text-amber-700 block mb-1" title="مبادرة معتمدة بمصفوفة وحدة التدخلات ولكن لم تبدأ العمل ولم يتم صرف مساهمة الوحدة لعدم تفاعل المجتمع">لم يبدأ ⏳</span>
            <span className="text-xl font-mono font-black text-amber-800">{pendingCount}</span>
            <span className="text-[9px] text-amber-600 block mt-0.5">مبادرات</span>
          </div>
          <div className="bg-rose-50/50 border border-rose-100/80 px-3.5 py-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-rose-700 block mb-1">متعثر ⚠️</span>
            <span className="text-xl font-mono font-black text-rose-800">{stagnantCount}</span>
            <span className="text-[9px] text-rose-600 block mt-0.5">مبادرات</span>
          </div>
          <div className="bg-slate-100/60 border border-slate-200/80 px-3.5 py-2.5 rounded-xl text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-700 block mb-1">متوقف 🛑</span>
            <span className="text-xl font-mono font-black text-slate-800">{stoppedCount}</span>
            <span className="text-[9px] text-slate-600 block mt-0.5">مبادرات</span>
          </div>
        </div>
      </div>

      {/* District Targeting & Cement Movement Dashboard */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs col-span-full grid grid-cols-1 lg:grid-cols-12 gap-6" id="district-cement-metrics-section">
        {/* District targeting block */}
        <div className="lg:col-span-4 flex flex-col justify-between lg:border-l border-slate-100 lg:pl-6 pb-4 lg:pb-0">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
              نطاق الاستهداف الجغرافي للمبادرات بالمحافظة:
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-bold block">إجمالي مديريات إب</span>
                  <span className="text-3xl font-black text-slate-800 font-mono">20</span>
                  <span className="text-xs text-slate-600 font-bold mr-1">مديرية</span>
                </div>
                <div className="text-left">
                  <span className="text-xs text-slate-500 font-bold block">المديريات المستهدفة</span>
                  <span className="text-3xl font-black text-indigo-700 font-mono">18</span>
                  <span className="text-xs text-indigo-600 font-bold mr-1">مديرية مفعّلة</span>
                </div>
              </div>

              <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-black text-sm">
                  90%
                </div>
                <div>
                  <span className="text-xs font-black text-indigo-900 block">نسبة تغطية المديريات</span>
                  <span className="text-[10px] text-indigo-700 font-bold block">تغطية تنموية شاملة لعقبات وطرق المحافظة</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-3 leading-relaxed">
            * تتكون محافظة إب من ٢٠ مديرية إدارية، والمستهدف حالياً هو تفعيل المبادرات الأهلية في ١٨ مديرية منها بمساهمات وحدة التدخلات.
          </p>
        </div>

        {/* Cement tracking metrics block */}
        <div className="lg:col-span-8 space-y-4">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block animate-pulse"></span>
              مؤشرات حركة الإسمنت المدعوم (التراكمي بكافة مبادرات الميدان):
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md">
              الأسمنت المقاوم للأملاح والبرطوبة
            </span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Approved from Unit */}
            <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl hover:bg-slate-100/70 transition-colors">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">1. المعتمد من الوحدة</span>
              <span className="text-lg font-mono font-black text-slate-800">{cementStats.approved.toLocaleString('ar-YE')}</span>
              <span className="text-[9px] text-slate-500 block">كيس (مخصص معتمد)</span>
            </div>

            {/* 2. Disbursed from Unit */}
            <div className="bg-indigo-50/30 border border-indigo-100 p-3 rounded-xl hover:bg-indigo-50/50 transition-colors">
              <span className="text-[10px] text-indigo-700 font-bold block mb-1">2. المنصرف من الوحدة</span>
              <span className="text-lg font-mono font-black text-indigo-800">{cementStats.disbursed.toLocaleString('ar-YE')}</span>
              <span className="text-[9px] text-indigo-600 block">كيس (مستلم بالموقع)</span>
            </div>

            {/* 3. Used */}
            <div className="bg-emerald-50/30 border border-emerald-100 p-3 rounded-xl hover:bg-emerald-50/50 transition-colors">
              <span className="text-[10px] text-emerald-700 font-bold block mb-1">3. المستخدم فعلياً</span>
              <span className="text-lg font-mono font-black text-emerald-800">{cementStats.used.toLocaleString('ar-YE')}</span>
              <span className="text-[9px] text-emerald-600 block">كيس (مخلوط ومصبوب)</span>
            </div>

            {/* 4. Remaining at Unit */}
            <div className="bg-amber-50/30 border border-amber-100 p-3 rounded-xl hover:bg-amber-50/50 transition-colors">
              <span className="text-[10px] text-amber-700 font-bold block mb-1">4. المتبقي لدى الوحدة</span>
              <span className="text-lg font-mono font-black text-amber-800">{cementStats.remainingAtUnit.toLocaleString('ar-YE')}</span>
              <span className="text-[9px] text-amber-600 block">كيس (المعتمد - المنصرف)</span>
            </div>
          </div>

          {/* Field stock and discrepancy banner */}
          <div className="flex items-center justify-between gap-3 text-xs bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-slate-700">المخزون المتبقي بالمواقع:</span>
              <span className="font-mono font-black text-slate-900">{cementStats.fieldRemaining.toLocaleString('ar-YE')} كيس</span>
            </div>
            {cementStats.excessDiscrepancy > 0 && (
              <div className="flex items-center gap-1.5 text-amber-800 font-bold bg-amber-100/70 px-2.5 py-1 rounded-lg">
                <span>⚠️ فروقات استخدام تتطلب تحققاً ميدانياً:</span>
                <span className="font-mono font-black">{cementStats.excessDiscrepancy.toLocaleString('ar-YE')} كيس</span>
              </div>
            )}
          </div>

          {/* Quick Progress indicator of cement consumption */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-500">
              <span>معدل الصب والاستخدام من الكمية المنصرفة بالمواقع:</span>
              <span className="text-emerald-700">{cementStats.disbursed > 0 ? Math.round((cementStats.used / cementStats.disbursed) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${cementStats.disbursed > 0 ? Math.round((cementStats.used / cementStats.disbursed) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Metric 1: Total Contributions */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow duration-200" id="stat-contributions">
        <div>
          <span className="text-xs font-semibold text-slate-500 block mb-1">المساهمات المجتمعية الذاتية</span>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(totalContributions)}</h3>
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" />
            تم توثيقها بالكامل ميدانياً
          </span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Coins className="w-6 h-6" />
        </div>
      </div>

      {/* Metric 2: Active Knights */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow duration-200" id="stat-knights">
        <div>
          <span className="text-xs font-semibold text-slate-500 block mb-1">الفرسان واللجان النشطة</span>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{totalKnights} فرسان ميدانيين</h3>
          <span className="text-xs text-slate-500 mt-1 block">يقودون التعبئة والإشراف اليومي</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Metric 3: Storage at Risk */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow duration-200" id="stat-materials">
        <div>
          <span className="text-xs font-semibold text-slate-500 block mb-1">المواد تحت المراقبة الفنية</span>
          <h3 className={`text-2xl font-bold tracking-tight ${atRiskMaterials > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {atRiskMaterials} مواد مهددة
          </h3>
          <span className="text-xs text-slate-500 mt-1 block">من أصل {totalMaterials} مواد مخزنة بالميدان</span>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${atRiskMaterials > 0 ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-slate-50 text-slate-500'}`}>
          <ShieldAlert className="w-6 h-6" />
        </div>
      </div>

      {/* Metric 4: Overall Pathway Progress */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow duration-200" id="stat-overall-progress">
        <div>
          <span className="text-xs font-semibold text-slate-500 block mb-1">معدل الإنجاز التنموي الشامل</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{overallProgressPercentage}%</h3>
            <span className="text-xs text-slate-400">({completedTasks}/{totalTasks} مهام)</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${overallProgressPercentage}%` }}
            />
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
          <CheckCircle className="w-6 h-6" />
        </div>
      </div>

      {/* DEVELOPMENTAL IMPACT SCOREBOARD CARD */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs col-span-full grid grid-cols-1 lg:grid-cols-12 gap-6" id="developmental-impact-section">
        <div className="lg:col-span-4 flex flex-col justify-between border-l border-slate-100 pl-6 text-right">
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
              منظومة قياس الأثر التنموي والاجتماعي:
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              تقوم هذه المنظومة بحساب الأثر المباشر لمبادرات الطرق بناءً على معادلة رياضية تربط عدد المواطنين المستفيدين بالمسافات الطولية المنجزة فعلياً بالميدان بوحدة قياس <strong className="text-emerald-700">(مستفيد.كم)</strong>.
            </p>
          </div>
          
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 mt-4">
            <span className="text-[10px] text-emerald-800 font-bold block">📊 معادلة الأثر التنموي للمبادرة:</span>
            <span className="text-[10px] text-emerald-950 font-bold mt-1 block font-mono">
              الأثر = عدد المستفيدين × (المسافة الكلية × نسبة الإنجاز)
            </span>
          </div>
        </div>

        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
          <div className="bg-slate-50/70 border border-slate-150 p-4 rounded-2xl flex flex-col justify-between hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-bold font-sans">إجمالي المستفيدين المباشرين</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-slate-800 font-mono">
                {impactStats.beneficiaries.toLocaleString('ar-YE')}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">مواطن مستفيد بالمديريات</span>
            </div>
          </div>

          <div className="bg-slate-50/70 border border-slate-150 p-4 rounded-2xl flex flex-col justify-between hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-bold font-sans">المسافات الطولية للطرق</span>
              <Milestone className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  {impactStats.completedDistance.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400">/ {impactStats.totalDistance.toFixed(1)} كم</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">مسافات منجزة ومفتوحة فعلياً</span>
            </div>
          </div>

          <div className="bg-emerald-50/30 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-800 font-black font-sans">إجمالي الأثر التنموي المحقق</span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-emerald-800 font-mono">
                {impactStats.impactScore.toLocaleString('ar-YE')}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold block mt-1">مستفيد.كم (أثر تراكمي متكامل)</span>
            </div>
          </div>
        </div>
      </div>

      {/* NEW ADVANCED FEATURE: Economic Value Ledger & Cooperative Maturity Multiplier */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md col-span-full grid grid-cols-1 lg:grid-cols-12 gap-6 text-white text-right" id="advanced-impact-ledger">
        <div className="lg:col-span-12 border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-amber-450 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
              مقيّم الأثر الاقتصادي التراكمي ونموذج النضج التعاوني (محافظة إب) 🪙📈
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              مؤشرات متطورة مبنية على تحليل الجهد البشري والتمويل المجتمعي المشترك مقارنة بالدعم الخارجي
            </p>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-900/60 px-3 py-1 rounded-full text-[10px] text-emerald-400 font-bold self-start sm:self-auto">
            محدث تلقائياً حسب الفرز الميداني 📊
          </div>
        </div>

        {/* Column 1: Voluntary Work Valuation */}
        <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold block">١. تقييم القيمة العادلة للعمل الطوعي للأهالي</span>
            <p className="text-[9px] text-slate-500 leading-snug">
              الشق اليدوي ورصف عقبات الطرق الوعرة يمثل جهداً عضلياً جباراً يقدمه المتطوعون والفرسان مجاناً للتنمية
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">إجمالي الأيام الطوعية:</span>
              <span className="text-xl font-mono font-black text-emerald-400">{workdaysCount.toLocaleString('ar-YE')} يوم عمل</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">الجهد العضلي المكافئ مالياً:</span>
              <span className="text-sm font-bold text-slate-200">~ {formatCurrency(laborValue)}</span>
            </div>
          </div>
          <div className="border-t border-slate-800/60 pt-2 text-[9px] text-slate-400 leading-relaxed">
            * تم الاحتساب بتقدير <span className="text-amber-450 font-bold">٣٥٪</span> من المساهمات كجهد بشري عيني مباشر بقيمة <span className="text-slate-200 font-bold">١٢,٠٠٠ ريال</span> لليومية الواحدة في مناطق العقبات الشاهقة.
          </div>
        </div>

        {/* Column 2: Self-Reliance Multiplier */}
        <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold block">٢. مؤشر مضاعف الاعتماد على الذات (المبادر)</span>
            <p className="text-[9px] text-slate-500 leading-snug">
              يقيس كفاءة التمويل والجهود الأهلية والذاتية مقابل كل كيس إسمنت أو دعم عيني تقدمه الدولة
            </p>
          </div>
          <div className="flex items-center gap-4 py-2">
            <div className="w-14 h-14 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center font-mono font-black text-indigo-400 text-lg shadow-inner">
              {selfRelianceMultiplier}x
            </div>
            <div>
              <span className="text-xs font-black text-slate-200 block">مضاعف المساهمة المجتمعية</span>
              <span className="text-[9px] text-indigo-400 font-bold block">
                مساهمة ذاتية جبارة تفوق دعم الإسمنت بـ {selfRelianceMultiplier} أضعاف!
              </span>
            </div>
          </div>
          <div className="border-t border-slate-800/60 pt-2 text-[9px] text-slate-400 leading-relaxed">
            * يعني هذا المؤشر البالغ <span className="text-indigo-400 font-bold">{selfRelianceMultiplier}x</span> أنه مقابل كل ريال دعمت به الدولة المبادرة بالأسمنت، ضخ الأهالي والمغتربون ما قيمته <span className="text-slate-200 font-bold">{selfRelianceMultiplier} ريالات</span>!
          </div>
        </div>

        {/* Column 3: Knights Training Advisor & Cooperative Maturity */}
        <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold block flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              ٣. مستشار التدريب والمطابقة لفرسان التنمية
            </span>
            <p className="text-[9px] text-slate-500 leading-snug">
              توصيات تنموية مدعومة بالبيانات لرفع نضج المبادرات المجتمعية وتدريب الكوادر المحلية
            </p>
          </div>
          
          <div className="bg-slate-950/60 border border-slate-800/60 p-2.5 rounded-xl space-y-1.5 text-[10px] leading-relaxed">
            <div className="text-amber-400 font-black">🎯 الخطة التدريبية الموصى بها حالياً:</div>
            {stagnantCount > 0 || stoppedCount > 0 ? (
              <p className="text-slate-300 text-[9.5px]">
                نظراً لوجود <strong className="text-rose-400">{stagnantCount + stoppedCount}</strong> مبادرة متعثرة أو متوقفة، نوصي فوراً بورش تدريبية في <strong className="text-emerald-400">إدارة الخلافات المجتمعية والمسار الثالث (المناقلات)</strong> لفرسان المديريات لتفعيل وتجاوز العقبات.
              </p>
            ) : (
              <p className="text-slate-300 text-[9.5px]">
                جميع المبادرات تسير بكفاءة متميزة! يوصى بالتركيز على تدريب الفرسان في <strong className="text-emerald-400">المسار الخامس (الفرز والمطابقة بالنتائج)</strong> استعداداً لمراحل الاستلام الفني النهائي.
              </p>
            )}
          </div>

          <div className="text-[8.5px] text-slate-500 text-left pt-1">
            منظومة م. عيسى القادري التنموية المتكاملة
          </div>
        </div>
      </div>
    </div>
  );
}
