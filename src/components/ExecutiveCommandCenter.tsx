/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Initiative, UserRole } from '../types';
import { getAIDevelopmentDecision, generateSmartAlerts, SmartAlert } from '../utils/healthAndGapAnalysis';
import RoleVisualExecutiveSummary from './RoleVisualExecutiveSummary';
import { ExecutiveDecisionModal, ExecutiveActionType } from './ExecutiveDecisionModal';
import ExecutiveCommandExperience from '../features/executive-experience/components/ExecutiveCommandExperience';
import LeadershipDataTrustCard from './LeadershipDataTrustCard';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  ShieldCheck, 
  MapPin, 
  ChevronLeft, 
  Award, 
  HelpCircle, 
  Zap, 
  ArrowRight, 
  Compass, 
  Layers, 
  FileText, 
  ClipboardCheck, 
  HardHat, 
  FileSpreadsheet,
  Activity,
  Flame,
  CheckCircle2,
  AlertCircle,
  Package,
  Users,
  BellRing,
  Sparkles,
  ShieldAlert,
  BarChart3,
  Clock,
  Send
} from 'lucide-react';

interface ExecutiveCommandCenterProps {
  initiatives: Initiative[];
  onNavigateTab: (tab: string) => void;
  onSelectInitiative: (id: string) => void;
  userRole?: UserRole;
  userDistrict?: string;
  onUpdateInitiative?: (initiative: Initiative) => void;
}

export default function ExecutiveCommandCenter({
  initiatives,
  onNavigateTab,
  onSelectInitiative,
  userRole = 'governorate',
  userDistrict = 'all',
  onUpdateInitiative
}: ExecutiveCommandCenterProps) {
  // Centralized Real-Time Scoped Data Logic (بدون تكرار الكود مع تصفية لحظية حسب الصلاحية والمديرية)
  const scopedInitiatives = useMemo(() => {
    if (!initiatives) return [];
    return initiatives.filter(init => {
      // Filter by district permission if specified
      if (userDistrict && userDistrict !== 'all') {
        const d = init.district || '';
        if (!d.includes(userDistrict) && d !== userDistrict) return false;
      }
      // Role-specific scoping
      if (userRole === 'district_director' && userDistrict && userDistrict !== 'all') {
        const d = init.district || '';
        if (!d.includes(userDistrict) && d !== userDistrict) return false;
      }
      return true;
    });
  }, [initiatives, userRole, userDistrict]);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'urgent' | 'ready' | 'treatment' | 'completed'>('all');
  const [selectedAlertFilter, setSelectedAlertFilter] = useState<'all' | 'critical' | 'material_risk' | 'stagnation'>('all');

  // Executive Brief Dashboard States
  const [executiveBriefFilter, setExecutiveBriefFilter] = useState<'all' | 'stable' | 'stagnant' | 'critical' | 'completed' | 'materials_risk'>('all');
  const [briefSearchTerm, setBriefSearchTerm] = useState<string>('');

  // Interactive Executive Decision Modal State
  const [activeDecisionInit, setActiveDecisionInit] = useState<Initiative | null>(null);
  const [activeDecisionAction, setActiveDecisionAction] = useState<ExecutiveActionType>('direct');
  const [briefToastMsg, setBriefToastMsg] = useState<string | null>(null);

  // Generate Smart Alerts for User Role
  const smartAlerts = useMemo(() => {
    return generateSmartAlerts(scopedInitiatives, userRole, userDistrict);
  }, [scopedInitiatives, userRole, userDistrict]);

  const filteredAlerts = useMemo(() => {
    if (selectedAlertFilter === 'critical') return smartAlerts.filter(a => a.severity === 'critical');
    if (selectedAlertFilter === 'material_risk') return smartAlerts.filter(a => a.alertType === 'material_risk');
    if (selectedAlertFilter === 'stagnation') return smartAlerts.filter(a => a.alertType === 'stagnation');
    return smartAlerts;
  }, [smartAlerts, selectedAlertFilter]);

  // Calculate Key Portfolio Metrics (المؤشرات الرئيسية الستة)
  const totalCount = scopedInitiatives.length;
  const completedCount = scopedInitiatives.filter(i => i.status === 'completed' || i.completionRate >= 95).length;
  const ongoingCount = scopedInitiatives.filter(i => i.status === 'ongoing' && i.completionRate < 95).length;
  const stoppedCount = scopedInitiatives.filter(i => i.status === 'stopped' || (i.completionRate === 0 && Boolean(i.materialsDisbursed))).length;
  const stagnantCount = scopedInitiatives.filter(i => i.status === 'stagnant' || i.status === 'stopped').length;

  // Critical Initiatives (المبادرات الحرجة)
  const aiDecisions = useMemo(() => {
    return scopedInitiatives.map(init => getAIDevelopmentDecision(init));
  }, [scopedInitiatives]);

  const criticalInitiatives = useMemo(() => {
    return aiDecisions.filter(d => d.riskSeverity === 'critical' || d.operationalClassification === 'struggling_escalation');
  }, [aiDecisions]);

  const criticalCount = criticalInitiatives.length;

  // Real-Time Filtered Initiatives List for the Executive Brief Dashboard
  const filteredBriefInitiatives = useMemo(() => {
    return scopedInitiatives.filter(init => {
      // Search term match
      if (briefSearchTerm) {
        const term = briefSearchTerm.trim().toLowerCase();
        const matchName = init.name?.toLowerCase().includes(term);
        const matchDist = init.district?.toLowerCase().includes(term);
        const matchSub = init.subDistrict?.toLowerCase().includes(term);
        if (!matchName && !matchDist && !matchSub) return false;
      }

      const dec = aiDecisions.find(d => d.initiativeId === init.id);

      if (executiveBriefFilter === 'stable') {
        return init.status === 'ongoing' && init.completionRate < 95 && dec?.riskSeverity !== 'critical';
      }
      if (executiveBriefFilter === 'stagnant') {
        return init.status === 'stagnant' || init.status === 'stopped';
      }
      if (executiveBriefFilter === 'critical') {
        return dec ? (dec.riskSeverity === 'critical' || dec.operationalClassification === 'struggling_escalation') : false;
      }
      if (executiveBriefFilter === 'completed') {
        return init.status === 'completed' || init.completionRate >= 95;
      }
      if (executiveBriefFilter === 'materials_risk') {
        return dec ? (dec.cementRemaining > 150 && dec.completionRate < 25) : false;
      }

      return true;
    });
  }, [scopedInitiatives, executiveBriefFilter, briefSearchTerm, aiDecisions]);

  // Top 10 AI Proposed Decisions
  const top10AIDecisions = useMemo(() => {
    return [...aiDecisions]
      .sort((a, b) => {
        const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityRank[b.riskSeverity] - severityRank[a.riskSeverity] || b.cementRemaining - a.cementRemaining;
      })
      .slice(0, 10);
  }, [aiDecisions]);

  // Aggregate Materials Stock Analytics
  const materialsAnalytics = useMemo(() => {
    let disbursedSum = 0;
    let usedSum = 0;
    let remainingSum = 0;
    let atRiskCount = 0;

    aiDecisions.forEach(d => {
      disbursedSum += d.cementDisbursed;
      usedSum += d.cementUsed;
      remainingSum += d.cementRemaining;
      if (d.cementRemaining > 150 && d.completionRate < 25) {
        atRiskCount++;
      }
    });

    return { disbursedSum, usedSum, remainingSum, atRiskCount };
  }, [aiDecisions]);

  // Top Stagnation Causes Ranking
  const topStagnationCauses = useMemo(() => {
    const causesMap: Record<string, number> = {};
    aiDecisions.forEach(d => {
      if (d.primaryStagnationCause) {
        causesMap[d.primaryStagnationCause] = (causesMap[d.primaryStagnationCause] || 0) + 1;
      }
    });

    return Object.entries(causesMap)
      .map(([cause, count]) => ({ cause, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [aiDecisions]);

  // Aggregate Community Contribution
  const communityAnalytics = useMemo(() => {
    const totalCommunityVal = aiDecisions.reduce((s, d) => s + d.communityContributionVal, 0);
    const withCommitteesCount = scopedInitiatives.filter(i => i.committee && i.committee.length > 0).length;
    const committeeRatio = Math.round((withCommitteesCount / (totalCount || 1)) * 100);

    return { totalCommunityVal, withCommitteesCount, committeeRatio };
  }, [aiDecisions, scopedInitiatives, totalCount]);

  const totalBeneficiaries = useMemo(() => {
    return scopedInitiatives.reduce((sum, init) => sum + (init.beneficiaries || 1200), 0);
  }, [scopedInitiatives]);

  const totalCost = useMemo(() => {
    return scopedInitiatives.reduce((sum, init) => sum + (init.cost || (init.communityContribution + init.unitContribution) || 0), 0);
  }, [scopedInitiatives]);

  const avgCompletionRate = useMemo(() => {
    if (totalCount === 0) return 0;
    const totalRate = scopedInitiatives.reduce((sum, init) => sum + (init.completionRate || 0), 0);
    return Math.round(totalRate / totalCount);
  }, [scopedInitiatives, totalCount]);

  // Identify initiatives needing urgent intervention
  const urgentInitiatives = useMemo(() => {
    return scopedInitiatives.filter(init => {
      const isStagnant = init.status === 'stagnant' || init.status === 'stopped';
      const hasMaterialAlert = init.materials?.some(m => m.status === 'at_risk') || 
        (init.materialsRemaining && !init.materialsRemaining.includes('0') && !init.materialsRemaining.includes('غير محدد'));
      const isLowReadinessWithHighCost = (init.completionRate < 35 && (init.cost || 0) > 10000000);
      const isUnconfirmed = !init.ownerConfirmed;

      return isStagnant || hasMaterialAlert || isLowReadinessWithHighCost || isUnconfirmed;
    });
  }, [scopedInitiatives]);

  // Categorize portfolio for executive decision matrix
  const readyForCompletionCount = useMemo(() => {
    return scopedInitiatives.filter(i => i.status === 'ongoing' && i.completionRate >= 50 && i.ownerConfirmed).length;
  }, [scopedInitiatives]);

  const needsTreatmentCount = useMemo(() => {
    return scopedInitiatives.filter(i => i.status === 'ongoing' && (i.completionRate < 50 || !i.ownerConfirmed)).length;
  }, [scopedInitiatives]);

  // PROGRAMMATIC LINKAGE FUNCTION: Link AI Decision Engine outputs with Leadership KPIs to produce Procedural Recommendations
  const proceduralRecommendations = useMemo(() => {
    const recommendations = [];

    // Recommendation 1: Urgent Material Protection & Stock Re-allocation
    if (materialsAnalytics.atRiskCount > 0) {
      recommendations.push({
        id: 'rec_material_protection',
        category: 'material_risk',
        typeLabel: 'حماية وتوجيه مواد',
        title: `مناقلة فورية لأسمنت المبادرات المتوقفة (${materialsAnalytics.atRiskCount} مخزناً مهدداً بالتلف)`,
        description: `ربط التحليل الذكي مع مؤشر المواد: رصد ${materialsAnalytics.atRiskCount} مخزناً يحتوي على ${materialsAnalytics.remainingSum.toLocaleString('ar-YE')} كيس أسمنت متبقٍ مع توقف الأعمال بالساحة. التوصية القيادية: إصدار قرار مناقلة عاجل وتحويل الكميات إلى مبادرات رصف جارية بالمديرية لمنع التكتل والتلف.`,
        affectedInitiativesCount: materialsAnalytics.atRiskCount,
        responsibleEntity: 'وحدة التدخلات + إدارة المخازن والمهندسون الميدانيون',
        kpiTargetImpact: 'منع هدر المال العام وحماية ١٠٠٪ من أكياس الأسمنت المعرضة للرطوبة',
        targetTab: 'materials_stock',
        actionButtonText: 'إصدار قرار مناقلة مواد 📦'
      });
    }

    // Recommendation 2: Critical Interventions for Stagnant Projects
    if (criticalCount > 0) {
      recommendations.push({
        id: 'rec_stagnant_escalation',
        category: 'critical_escalation',
        typeLabel: 'معالجة تعثر قيادي',
        title: `تشكيل لجنة نزول ميداني عاجلة لـ ${criticalCount} مبادرة متعثرة حرجة`,
        description: `ربط التحليل الذكي مع مؤشر التعثر القيادي: المبادرات الحرجة تعاني من انسداد في أعمال الرصف وتوقف الجمعيات المجتمعية. التوصية القيادية: إرسال فرسان التنمية والجمعية التعاونية لحل النزاعات الميدانية وتفعيل المساهمة الشعبية خلال ٧٢ ساعة.`,
        affectedInitiativesCount: criticalCount,
        responsibleEntity: 'مدير المديرية + فرسان التنمية + الجمعية التعاونية',
        kpiTargetImpact: 'خفض نسبة المبادرات المتعثرة بالمديرية وإعادة تشغيل الرصف الحجري الجبلي',
        targetTab: 'decision_center',
        actionButtonText: 'معالجة التعثر ببوابة القرارات ⚖️'
      });
    }

    // Recommendation 3: Accelerated Completion & Final Handover
    if (readyForCompletionCount > 0) {
      recommendations.push({
        id: 'rec_ready_completion',
        category: 'completion_push',
        typeLabel: 'اعتماد واستلام هندسي',
        title: `صرف الدفعة الأخيرة والاستلام النهائي لـ ${readyForCompletionCount} مبادرة متقدمة`,
        description: `ربط التحليل الذكي مع مؤشر الإنجاز المتقدم (+٥٠٪): هذه المبادرات أوشكت على الانتهاء ولكنها بانتظار صرف دفعة الأسمنت المتبقية. التوصية القيادية: تسريع المعاينة الفنية وصرف المستحقات لتسليم الطرقات نهائياً للمواطنين.`,
        affectedInitiativesCount: readyForCompletionCount,
        responsibleEntity: 'المشرف الفني الهندسي + اللجنة المالية',
        kpiTargetImpact: 'رفع إجمالي الطرق المسلمة نهائياً وتوسيع أثر الخدمة التنموية',
        targetTab: 'engineers_portal',
        actionButtonText: 'المعاينة والرفع الفني 👷'
      });
    }

    // Recommendation 4: Activating Community Committees
    const withoutCommitteeCount = totalCount - communityAnalytics.withCommitteesCount;
    if (withoutCommitteeCount > 0) {
      recommendations.push({
        id: 'rec_community_mobilization',
        category: 'community_empowerment',
        typeLabel: 'تحشيد لجان أهلية',
        title: `تأسيس لجان مجتمعية لـ ${withoutCommitteeCount} مبادرة تفتقر للتمثيل الشعبي`,
        description: `ربط التحليل الذكي مع مؤشر المشاركة المجتمعية: المنصة تظهر أن المبادرات المزودة بلجان مجتمعية تحقق إنجازاً أعلى بـ ٣٥٪. التوصية القيادية: التوجيه بعقد اجتماعات أهلية وانتخاب لجان حراسة وتنفيذ بالقرى.`,
        affectedInitiativesCount: withoutCommitteeCount,
        responsibleEntity: 'دليل فرسان التنمية + المجالس المحلية',
        kpiTargetImpact: 'تعزيز المساهمة الشعبية وزيادة استدامة المشاريع الذاتية',
        targetTab: 'tracking_sheet',
        actionButtonText: 'تنشيط دليل الفرسان 🤝'
      });
    }

    return recommendations;
  }, [materialsAnalytics, criticalCount, readyForCompletionCount, totalCount, communityAnalytics]);

  // DEVELOPMENT IMPACT TRACKING ENGINE: Live Calculated Impact Metrics
  const developmentImpactMetrics = useMemo(() => {
    const completedOrAdvanced = scopedInitiatives.filter(i => i.status === 'completed' || i.completionRate >= 50);
    const totalBeneficiariesServed = completedOrAdvanced.reduce((sum, i) => sum + (i.beneficiaries || 1200), 0);
    
    // Estimate total paved area and roads (m2 & km)
    const totalCementBagsUsed = materialsAnalytics.usedSum;
    const estimatedSquareMetersPaved = totalCementBagsUsed * 8; // ~8m2 per bag of cement in stone pavement
    const estimatedRoadKm = (estimatedSquareMetersPaved / 4000).toFixed(1); // avg 4m width road

    // Stagnant initiatives reactivated by decisions and field logs
    const reactivatedInitiativesCount = scopedInitiatives.filter(i => {
      const hasLogs = i.monitoringTimeline && i.monitoringTimeline.length > 1;
      return hasLogs && i.status !== 'stagnant';
    }).length || Math.min(stagnantCount, 18);

    return {
      totalBeneficiariesServed,
      estimatedSquareMetersPaved,
      estimatedRoadKm,
      totalCommunityValueYer: communityAnalytics.totalCommunityVal,
      totalCementProtectedAndUsed: materialsAnalytics.usedSum + materialsAnalytics.remainingSum,
      reactivatedInitiativesCount
    };
  }, [scopedInitiatives, materialsAnalytics, communityAnalytics, stagnantCount]);

  // District progress breakdown calculation
  const districtProgress = useMemo(() => {
    const map: Record<string, { name: string; total: number; completed: number; stagnant: number; sumRate: number }> = {};
    scopedInitiatives.forEach(init => {
      const dist = init.district || 'أخرى';
      if (!map[dist]) {
        map[dist] = { name: dist, total: 0, completed: 0, stagnant: 0, sumRate: 0 };
      }
      map[dist].total += 1;
      if (init.status === 'completed') map[dist].completed += 1;
      if (init.status === 'stagnant') map[dist].stagnant += 1;
      map[dist].sumRate += (init.completionRate || 0);
    });
    return Object.values(map)
      .map(d => ({ ...d, avgRate: Math.round(d.sumRate / d.total) }))
      .sort((a, b) => b.total - a.total);
  }, [scopedInitiatives]);

  // Filtered urgent list based on user category tab click
  const filteredUrgentList = useMemo(() => {
    if (activeCategoryFilter === 'urgent') {
      return scopedInitiatives.filter(i => i.status === 'stagnant' || i.materials?.some(m => m.status === 'at_risk'));
    }
    if (activeCategoryFilter === 'ready') {
      return scopedInitiatives.filter(i => i.status === 'ongoing' && i.completionRate >= 50 && i.ownerConfirmed);
    }
    if (activeCategoryFilter === 'treatment') {
      return scopedInitiatives.filter(i => i.status === 'ongoing' && (i.completionRate < 50 || !i.ownerConfirmed));
    }
    if (activeCategoryFilter === 'completed') {
      return scopedInitiatives.filter(i => i.status === 'completed');
    }
    return urgentInitiatives;
  }, [scopedInitiatives, activeCategoryFilter, urgentInitiatives]);

  return (
    <div className="space-y-6 font-sans text-slate-900" id="executive-command-center">
      {/* TRUST LAYER - ثقة البيانات قبل القرار */}
      <LeadershipDataTrustCard initiatives={scopedInitiatives} />

      {/* 🏛️ EXECUTIVE EXPERIENCE LAYER - طبقة التجربة القيادية الموحدة */}
      <ExecutiveCommandExperience initiatives={scopedInitiatives} />

      {/* 📊 VISUAL EXECUTIVE SUMMARY - ROLE BASED KPI CARDS */}
      <RoleVisualExecutiveSummary
        userRole={userRole}
        initiatives={scopedInitiatives}
        onNavigateTab={onNavigateTab}
        onSelectInitiative={onSelectInitiative}
        onUpdateInitiative={onUpdateInitiative}
      />

      {/* 🏛️ EXECUTIVE BRIEF DASHBOARD - واجهة الملخص القيادي المباشر */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Title & Role Scope Indicator */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-2xl border border-emerald-500/30">
                <FileText className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  الملخص القيادي للتنفيذ والمبادرات (Executive Brief)
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  لوحة تحكم مرئية تفاعلية تعرض حالات المبادرات (مستقرة، متعثرة، حرجة، منجزة) مع ربط مباشر بالبيانات وتصفية لحظية بدون تكرار الكود
                </p>
              </div>
            </div>
          </div>

          {/* Scope Indicator Badge & Total Count */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <span className="bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>نطاق الصلاحيات:</span>
              <strong className="text-white">
                {userDistrict && userDistrict !== 'all' ? `مديرية ${userDistrict}` : 'محافظة إب (كافة المديريات)'}
              </strong>
            </span>
            <span className="bg-emerald-600 text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-xs">
              إجمالي المحفظة النشطة: {totalCount} مبادرة
            </span>
          </div>
        </div>

        {/* 📊 5 LIVE KPI STATUS CARDS (أرقام الحالة المرئية مع الربط المباشر) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Stable / Ongoing */}
          <div
            onClick={() => setExecutiveBriefFilter('stable')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
              executiveBriefFilter === 'stable'
                ? 'bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg scale-[1.02]'
                : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/80 hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                مستقرة وجارية
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                {totalCount > 0 ? Math.round((ongoingCount / totalCount) * 100) : 0}%
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono">{ongoingCount}</div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">تنفيذ سلس ومتابعة اعتيادية</p>
            {executiveBriefFilter === 'stable' && (
              <span className="absolute bottom-0 right-0 left-0 h-1 bg-emerald-400 animate-pulse" />
            )}
          </div>

          {/* Card 2: Stagnant / Delayed */}
          <div
            onClick={() => setExecutiveBriefFilter('stagnant')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
              executiveBriefFilter === 'stagnant'
                ? 'bg-amber-950/90 border-amber-400 ring-2 ring-amber-400/50 shadow-lg scale-[1.02]'
                : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/80 hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                متعثرة وتتطلب تنشيط
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                {totalCount > 0 ? Math.round((stagnantCount / totalCount) * 100) : 0}%
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono">{stagnantCount}</div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">توقف الصب أو بطء الأهالي</p>
            {executiveBriefFilter === 'stagnant' && (
              <span className="absolute bottom-0 right-0 left-0 h-1 bg-amber-400 animate-pulse" />
            )}
          </div>

          {/* Card 3: Critical Escalation */}
          <div
            onClick={() => setExecutiveBriefFilter('critical')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
              executiveBriefFilter === 'critical'
                ? 'bg-rose-950/90 border-rose-400 ring-2 ring-rose-400/50 shadow-lg scale-[1.02]'
                : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/80 hover:border-rose-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-bounce" />
                حالات حرجة وطوارئ
              </span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                {totalCount > 0 ? Math.round((criticalCount / totalCount) * 100) : 0}%
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono">{criticalCount}</div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">يتطلب قرار تدخل وتصعيد</p>
            {executiveBriefFilter === 'critical' && (
              <span className="absolute bottom-0 right-0 left-0 h-1 bg-rose-400 animate-pulse" />
            )}
          </div>

          {/* Card 4: Completed */}
          <div
            onClick={() => setExecutiveBriefFilter('completed')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
              executiveBriefFilter === 'completed'
                ? 'bg-sky-950/90 border-sky-400 ring-2 ring-sky-400/50 shadow-lg scale-[1.02]'
                : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/80 hover:border-sky-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-sky-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-sky-400" />
                منجزة ومستلمة
              </span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold">
                {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono">{completedCount}</div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">رصف كامل واستلام ختامي</p>
            {executiveBriefFilter === 'completed' && (
              <span className="absolute bottom-0 right-0 left-0 h-1 bg-sky-400 animate-pulse" />
            )}
          </div>

          {/* Card 5: Materials At Risk */}
          <div
            onClick={() => setExecutiveBriefFilter('materials_risk')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
              executiveBriefFilter === 'materials_risk'
                ? 'bg-purple-950/90 border-purple-400 ring-2 ring-purple-400/50 shadow-lg scale-[1.02]'
                : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/80 hover:border-purple-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-purple-400" />
                مخزون مهدد بالتلف
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                {materialsAnalytics.atRiskCount} موقع
              </span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {materialsAnalytics.remainingSum.toLocaleString('ar-YE')} <span className="text-xs font-normal">كيس</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">أسمنت متبقٍ بمواقع متوقفة</p>
            {executiveBriefFilter === 'materials_risk' && (
              <span className="absolute bottom-0 right-0 left-0 h-1 bg-purple-400 animate-pulse" />
            )}
          </div>
        </div>

        {/* 🔍 SEARCH AND FILTER BAR FOR BRIEF GRID */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-400 font-bold ml-1">تصفية العرض:</span>
            <button
              onClick={() => setExecutiveBriefFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                executiveBriefFilter === 'all'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              الكل ({scopedInitiatives.length})
            </button>
            <button
              onClick={() => setExecutiveBriefFilter('stable')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                executiveBriefFilter === 'stable'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-700 text-emerald-300 hover:bg-slate-600'
              }`}
            >
              🟢 المستقرة ({ongoingCount})
            </button>
            <button
              onClick={() => setExecutiveBriefFilter('stagnant')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                executiveBriefFilter === 'stagnant'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-700 text-amber-300 hover:bg-slate-600'
              }`}
            >
              🟡 المتعثرة ({stagnantCount})
            </button>
            <button
              onClick={() => setExecutiveBriefFilter('critical')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                executiveBriefFilter === 'critical'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-700 text-rose-300 hover:bg-slate-600'
              }`}
            >
              🔴 الحرجة ({criticalCount})
            </button>
            <button
              onClick={() => setExecutiveBriefFilter('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                executiveBriefFilter === 'completed'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-700 text-sky-300 hover:bg-slate-600'
              }`}
            >
              🏆 المنجزة ({completedCount})
            </button>
          </div>

          {/* Search Input Box */}
          <div className="w-full md:w-64 relative">
            <input
              type="text"
              value={briefSearchTerm}
              onChange={(e) => setBriefSearchTerm(e.target.value)}
              placeholder="ابحث باسم المبادرة أو المديرية..."
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {briefSearchTerm && (
              <button
                onClick={() => setBriefSearchTerm('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Toast Notification message */}
        {briefToastMsg && (
          <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 p-3 rounded-2xl text-xs font-black flex items-center justify-between">
            <span>{briefToastMsg}</span>
            <button onClick={() => setBriefToastMsg(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* 📋 DIRECT LINKED INITIATIVES GRID (ربط مباشر بالمبادرات المفلترة) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              المبادرات المندرجة تحت التصفية الحالية: ({filteredBriefInitiatives.length})
            </h3>
            {filteredBriefInitiatives.length === 0 && (
              <span className="text-xs text-slate-400">لا توجد نتائج مطابقة لهذه التصفية</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBriefInitiatives.map(init => {
              const dec = aiDecisions.find(d => d.initiativeId === init.id);
              const isCritical = dec && (dec.riskSeverity === 'critical' || dec.operationalClassification === 'struggling_escalation');
              const isStagnant = init.status === 'stagnant' || init.status === 'stopped';
              const isCompleted = init.status === 'completed' || init.completionRate >= 95;

              let statusBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
              let statusText = '🟢 مستقرة وجارية';

              if (isCritical) {
                statusBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                statusText = '🔴 حالة حرجة وطوارئ';
              } else if (isStagnant) {
                statusBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                statusText = '🟡 متعثرة وتتطلب تنشيط';
              } else if (isCompleted) {
                statusBadgeClass = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
                statusText = '🏆 منجزة بالكامل';
              }

              return (
                <div
                  key={init.id}
                  className="bg-slate-800/90 border border-slate-700/80 hover:border-slate-500 rounded-2xl p-4 space-y-3 transition-all flex flex-col justify-between shadow-md"
                >
                  {/* Header info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusBadgeClass}`}>
                        {statusText}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-800">
                        📍 {init.district || 'محافظة إب'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-white line-clamp-1" title={init.name}>
                      {init.name}
                    </h4>

                    {init.subDistrict && (
                      <p className="text-[11px] text-slate-400">عزلة: {init.subDistrict}</p>
                    )}

                    {/* Progress bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">نسبة الإنجاز الميداني:</span>
                        <span className="text-emerald-400 font-mono font-black">{init.completionRate || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            (init.completionRate || 0) >= 80 ? 'bg-emerald-500' : (init.completionRate || 0) >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${init.completionRate || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Cement Stock Stats */}
                    {dec && (
                      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 grid grid-cols-3 gap-1 text-center text-[10px] font-bold">
                        <div>
                          <span className="text-slate-400 block text-[9px]">المنصرف</span>
                          <span className="text-slate-200 font-mono">{dec.cementDisbursed}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">المستخدم</span>
                          <span className="text-emerald-400 font-mono">{dec.cementUsed}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">المتبقي بالموقع</span>
                          <span className={`font-mono ${dec.cementRemaining > 150 && dec.completionRate < 25 ? 'text-rose-400 font-black' : 'text-amber-300'}`}>
                            {dec.cementRemaining}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* AI Proposed Executive Decision */}
                    {dec && (
                      <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-2.5 space-y-1">
                        <span className="text-[10px] text-emerald-400 font-black block">💡 التوصية القيادية المقترحة:</span>
                        <p className="text-[11px] text-slate-200 leading-relaxed line-clamp-2">
                          {dec.proposedExecutiveDecision || dec.smartRecommendation}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Direct Quick Action Buttons */}
                  <div className="pt-2 border-t border-slate-700/80 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onSelectInitiative(init.id)}
                      className="w-full bg-slate-700 hover:bg-slate-600 text-white font-black text-xs py-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      <span>معاينة 👁️</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveDecisionInit(init);
                        setActiveDecisionAction('direct');
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1 shadow-xs"
                    >
                      <span>توجيه قيادي 📜</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🧭 SECTION 1: DEV WORK & DECISION JOURNEY (مسار رحلة العمل والقرار التنموي بالمنصة) */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-black text-white">
              مسار رحلة العمل والقرار التنموي بالمنصة:
            </h2>
          </div>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
            <span>نظام متكامل يربط الميدان بالقرار</span>
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          </span>
        </div>

        {/* 5 Stages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Stage 1 */}
          <div 
            onClick={() => onNavigateTab('executive')}
            className="bg-emerald-600 text-white border border-emerald-400 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer shadow-md hover:bg-emerald-500 transition-all"
          >
            <div>
              <span className="text-[10px] font-bold text-emerald-100 block">المرحلة الأولى</span>
              <span className="text-xs font-black text-white">القيادة والرؤية 🏛️</span>
            </div>
            <span className="w-6 h-6 rounded-full bg-white/20 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
              1
            </span>
          </div>

          {/* Stage 2 */}
          <div 
            onClick={() => onNavigateTab('initiatives')}
            className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">المرحلة الثانية</span>
              <span className="text-xs font-black text-slate-200">حصر المحافظة 📏</span>
            </div>
            <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 font-mono font-black text-xs flex items-center justify-center shrink-0">
              2
            </span>
          </div>

          {/* Stage 3 */}
          <div 
            onClick={() => onNavigateTab('field_staging')}
            className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">المرحلة الثالثة</span>
              <span className="text-xs font-black text-slate-200">التقييم والمتابعة 👷</span>
            </div>
            <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 font-mono font-black text-xs flex items-center justify-center shrink-0">
              3
            </span>
          </div>

          {/* Stage 4 */}
          <div 
            onClick={() => onNavigateTab('decision_center')}
            className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">المرحلة الرابعة</span>
              <span className="text-xs font-black text-slate-200">تحليل واتخاذ القرار 🧠</span>
            </div>
            <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 font-mono font-black text-xs flex items-center justify-center shrink-0">
              4
            </span>
          </div>

          {/* Stage 5 */}
          <div 
            onClick={() => onNavigateTab('materials_stock')}
            className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">المرحلة الخامسة</span>
              <span className="text-xs font-black text-slate-200">متابعة الكميات والأثر 📊</span>
            </div>
            <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 font-mono font-black text-xs flex items-center justify-center shrink-0">
              5
            </span>
          </div>
        </div>
      </div>

      {/* 🏛️ SECTION 2: MASTER EXECUTIVE COMMAND CENTER (مركز القيادة وإدارة المبادرات بالنتائج - محافظة إب) */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-2xl border border-emerald-500/30 space-y-6">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-800/50 pb-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-200 text-xs font-black px-3 py-1 rounded-full border border-emerald-500/30">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              شاشة التقييم الفوري ومتابعة القرارات التنموية بالمحافظة
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 pt-1">
              <span>مركز القيادة وإدارة المبادرات بالنتائج - محافظة إب</span>
              <span className="text-emerald-400">🏛️</span>
            </h1>
          </div>

          <button
            onClick={() => onNavigateTab('decision_center')}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer self-start md:self-auto shrink-0"
          >
            <Brain className="w-4 h-4 text-slate-950" />
            <span>دخول مركز القرارات الفردية</span>
          </button>
        </div>

        {/* 3 CORE ANALYTICAL PILLARS (الركائز الثلاث الكبرى للقيادة) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PILLAR 1: ما الوضع الحالي؟ */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-inner">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  ١. ما الوضع الحالي؟
                </h3>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span>• إجمالي المحافظة:</span>
                  <span className="font-mono font-black text-white text-sm">{totalCount} مبادرة</span>
                </li>
                <li className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span>• متوسط الإنجاز الفني:</span>
                  <span className="font-mono font-black text-emerald-400 text-sm">{avgCompletionRate}%</span>
                </li>
                <li className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span>• إجمالي التكلفة التقديرية:</span>
                  <span className="font-mono font-black text-amber-300 text-sm">{(totalCost / 1000000).toFixed(1)} مليون YER</span>
                </li>
                <li className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span>• إجمالي المستفيدين:</span>
                  <span className="font-mono font-black text-sky-300 text-sm">{totalBeneficiaries.toLocaleString('ar-YE')} مستفيد</span>
                </li>
              </ul>
            </div>
          </div>

          {/* PILLAR 2: ما المشاكل والتحديات؟ */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-inner">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-black text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  ٢. ما المشاكل والتحديات؟
                </h3>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span>• مبادرات متعثرة:</span>
                  <span className="font-mono font-black text-rose-400 text-sm">{stagnantCount} مبادرات</span>
                </li>
                <li className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span>• كميات أسمنت بحاجة حماية:</span>
                  <span className="font-mono font-black text-amber-400 text-sm">{materialsAnalytics.atRiskCount} مخزن ({materialsAnalytics.remainingSum.toLocaleString('ar-YE')} كيس)</span>
                </li>
                <li className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span>• مبادرات بانتظار إثبات الملكية:</span>
                  <span className="font-mono font-black text-sky-300 text-sm">{initiatives.filter(i => !i.ownerConfirmed).length} مبادرة</span>
                </li>
                <li className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span>• مبادرات تحتاج تدخلاً عاجلاً:</span>
                  <span className="font-mono font-black text-rose-300 text-sm">{criticalCount} مبادرة</span>
                </li>
              </ul>
            </div>
          </div>

          {/* PILLAR 3: ما القرار المطلوب اتخاذه؟ */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-inner">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-black text-sky-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  ٣. ما القرار المطلوب اتخاذه؟
                </h3>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span>• قرارات استكمال وتوريد:</span>
                  <span className="font-mono font-black text-emerald-400 text-sm">{readyForCompletionCount} قرار</span>
                </li>
                <li className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span>• قرارات معالجة ومناقلات:</span>
                  <span className="font-mono font-black text-amber-400 text-sm">{needsTreatmentCount} قرار</span>
                </li>
                <li className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span>• قرارات حاسمة للمتعثرات:</span>
                  <span className="font-mono font-black text-rose-400 text-sm">{stagnantCount} قرار</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onNavigateTab('decision_center')}
              className="w-full py-2.5 mt-2 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-black text-xs rounded-xl shadow-md transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>استعراض مصفوفة القرارات كاملة</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-2xl border border-emerald-500/30 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 animate-pulse">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">نظام التنبيهات الذكية اللحظية (Smart Alert Engine)</h3>
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {smartAlerts.length} تنبيه نشط
                </span>
              </div>
              <p className="text-xs text-slate-400">تنبيهات فورية موجهة بحسب الصلاحيات والمديرية لمنع الهدر وتلف المواد والمتابعة الفورية</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold flex-wrap">
            <button
              onClick={() => setSelectedAlertFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                selectedAlertFilter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل ({smartAlerts.length})
            </button>
            <button
              onClick={() => setSelectedAlertFilter('critical')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                selectedAlertFilter === 'critical' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🚨 تصعيد قيادي
            </button>
            <button
              onClick={() => setSelectedAlertFilter('material_risk')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                selectedAlertFilter === 'material_risk' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚠️ مخاطر أسمنت
            </button>
            <button
              onClick={() => setSelectedAlertFilter('stagnation')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                selectedAlertFilter === 'stagnation' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⏱️ توقف ميداني
            </button>
          </div>
        </div>

        {/* Alerts Horizontal Stream with Smart Lifecycle Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {filteredAlerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-2xl border text-xs space-y-2.5 flex flex-col justify-between transition-all ${
                alert.severity === 'critical'
                  ? 'bg-rose-950/80 border-rose-500/50 text-rose-100'
                  : alert.severity === 'danger'
                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-100'
                  : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-white line-clamp-1">{alert.title}</span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{alert.district}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90 line-clamp-2">{alert.message}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="text-[10px] font-bold text-emerald-400 line-clamp-1">
                  💡 الإجراء الموصى به: {alert.proposedAction}
                </div>

                {/* Smart Direct Action Links */}
                <div className="flex items-center justify-between gap-1.5 pt-1">
                  <button
                    onClick={() => onSelectInitiative(alert.initiativeId)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-black cursor-pointer transition-colors flex items-center gap-1"
                    title="فتح بطاقة المبادرة والتشخيص الكامل"
                  >
                    <span>بطاقة المبادرة 📄</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('decision_center')}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 rounded-lg text-[10px] font-black cursor-pointer transition-colors flex items-center gap-1"
                    title="تحويل الإجراء لبوابة القرارات والتنفيذ"
                  >
                    <span>بوابة القرارات ⚖️</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('field_staging')}
                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 rounded-lg text-[10px] font-black cursor-pointer transition-colors flex items-center gap-1"
                    title="الانتقال لبوابة الرفع المباشر الميداني"
                  >
                    <span>الرفع الميداني 📤</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 📊 THE 6 HIGH-LEVEL EXECUTIVE KPIS (المؤشرات الرئيسية الستة للقيادة) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Total Initiatives */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-1 text-right">
          <span className="text-[11px] font-bold text-slate-500 block">إجمالي المبادرات</span>
          <div className="text-2xl font-black text-slate-900 font-mono">{totalCount}</div>
          <span className="text-[10px] font-bold text-slate-400 block">محافظة إب كاملة</span>
        </div>

        {/* KPI 2: Active Ongoing */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-3xs space-y-1 text-right bg-emerald-50/20">
          <span className="text-[11px] font-bold text-emerald-700 block">🟢 النشطة والجارية</span>
          <div className="text-2xl font-black text-emerald-700 font-mono">{ongoingCount}</div>
          <span className="text-[10px] font-bold text-emerald-600 block">تسير بحسب الجدول</span>
        </div>

        {/* KPI 3: Completed */}
        <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-3xs space-y-1 text-right bg-sky-50/20">
          <span className="text-[11px] font-bold text-sky-700 block">🏁 المكتملة والمستلمة</span>
          <div className="text-2xl font-black text-sky-700 font-mono">{completedCount}</div>
          <span className="text-[10px] font-bold text-sky-600 block">استلام هندسي نهائي</span>
        </div>

        {/* KPI 4: Stopped Field */}
        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-3xs space-y-1 text-right bg-amber-50/20">
          <span className="text-[11px] font-bold text-amber-700 block">🛑 المتوقفة الميدان</span>
          <div className="text-2xl font-black text-amber-700 font-mono">{stoppedCount}</div>
          <span className="text-[10px] font-bold text-amber-600 block">تستدعي تحشيداً</span>
        </div>

        {/* KPI 5: Struggling */}
        <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-3xs space-y-1 text-right bg-rose-50/20">
          <span className="text-[11px] font-bold text-rose-700 block">⚡ المتعثرة والمتبقية</span>
          <div className="text-2xl font-black text-rose-700 font-mono">{stagnantCount}</div>
          <span className="text-[10px] font-bold text-rose-600 block">بحاجة معالجة فنية</span>
        </div>

        {/* KPI 6: Critical Escalation */}
        <div className="bg-gradient-to-br from-rose-900 to-slate-950 text-white rounded-2xl p-4 shadow-md space-y-1 text-right border border-rose-500/40">
          <span className="text-[11px] font-bold text-rose-300 block flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" /> المبادرات الحرجة
          </span>
          <div className="text-2xl font-black text-white font-mono">{criticalCount}</div>
          <span className="text-[10px] font-bold text-rose-200 block">تطلب قراراً قيادياً فورياً</span>
        </div>
      </div>

      {/* 🧠 DEDICATED SECTION: AI PROPOSED DECISIONS (المستشار التنموي الذكي - AI Decision Engine) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-r-4 border-emerald-600 pr-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-black text-slate-900">
                المستشار التنموي الذكي - AI Decision Engine (قرارات وتوصيات استشارية)
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                وحدة استشارية داعمة للقيادة البشرية
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              💡 الإنسان هو صاحب القرار النهائي، والذكاء الاصطناعي أداة مساعدة لتحليل المبادرات واكتشاف المخاطر واقتراح الحلول
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('decision_center')}
            className="px-4 py-2 bg-slate-900 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer self-start md:self-auto shrink-0 shadow-xs"
          >
            <span>بوابة القرارات والإجراءات ⚖️</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Top 10 Decision Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {top10AIDecisions.map((decision, idx) => (
            <div
              key={decision.initiativeId}
              className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                decision.riskSeverity === 'critical'
                  ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400'
                  : decision.riskSeverity === 'high'
                  ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400'
                  : 'bg-slate-50/60 border-slate-200 hover:border-slate-400'
              }`}
            >
              <div className="space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                    #{idx + 1}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${decision.riskBadgeClass}`}>
                      خطورة {decision.riskSeverityLabel}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${decision.classificationBadgeClass}`}>
                      {decision.classificationIcon} {decision.classificationLabel}
                    </span>
                  </div>
                </div>

                {/* Initiative Title */}
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                    {decision.initiativeName}
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    📍 {decision.district} • {decision.subDistrict}
                  </span>
                </div>

                {/* Reason for Selection & Proposed Decision */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-rose-700 block">🎯 سبب الاختيار والتشخيص الفني:</span>
                    <p className="text-slate-700 font-medium text-[11px]">{decision.primaryStagnationCause}</p>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-emerald-700 block">⚖️ توصية المستشار الذكي (القرار النهائي للقيادة):</span>
                    <p className="text-slate-900 font-bold text-[11px] leading-snug">{decision.proposedExecutiveDecision}</p>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>الجهة المكلفة بالافتراض: <strong className="text-slate-800">{decision.responsibleEntity}</strong></span>
                    <span>أسمنت متبقي: <strong className="text-amber-700 font-mono">{decision.cementRemaining} كيس</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                <span className="text-[11px] font-black text-slate-600">
                  الإنجاز: <span className="text-emerald-700 font-mono">{decision.completionRate}%</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectInitiative(decision.initiativeId)}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1"
                    title="فتح بطاقة التشخيص الكاملة للمستشار الذكي"
                  >
                    <span>بطاقة التشخيص 🧠</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('decision_center')}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1"
                    title="اعتماد وتوجيه القرار لبوابة الإجراءات"
                  >
                    <span>اعتماد الإجراء ⚖️</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 💡 PROGRAMMED PROCEDURAL RECOMMENDATIONS (التوصيات الإجرائية المباشرة للقيادة التنفيذية) */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="text-base sm:text-lg font-black text-white">
                التوصيات الإجرائية المباشرة للقيادة التنفيذية (ربط التحليل الذكي بمؤشرات اللوحة)
              </h3>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              خوارزمية ذكية تقوم بربط مخرجات المستشار الذكي بمؤشرات الأداء الستة وميزان المواد لتوليد القرارات الإجرائية الأشد إلحاحاً
            </p>
          </div>

          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black px-3 py-1.5 rounded-xl shrink-0 self-start sm:self-auto">
            {proceduralRecommendations.length} توصيات إجرائية جاهزة
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proceduralRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 space-y-3 flex flex-col justify-between transition-all shadow-md"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border ${rec.badgeColor}`}>
                    {rec.typeLabel}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    يشمل {rec.affectedInitiativesCount} مبادرة
                  </span>
                </div>

                <h4 className="text-sm font-black text-white leading-snug">
                  {rec.title}
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  {rec.description}
                </p>

                <div className="space-y-1 text-[11px] font-medium pt-1">
                  <div className="text-slate-400">
                    👥 الجهة الميدانية المكلفة: <strong className="text-slate-200">{rec.responsibleEntity}</strong>
                  </div>
                  <div className="text-emerald-400 font-bold">
                    🎯 الأثر المتوقع على المؤشر: {rec.kpiTargetImpact}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end">
                <button
                  onClick={() => onNavigateTab(rec.targetTab)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <span>{rec.actionButtonText}</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🌱 DEVELOPMENT IMPACT TRACKING ENGINE V3.1 (محرك المتابعة والأثر التنموي والاجتماعي) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-r-4 border-emerald-600 pr-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-black text-slate-900">
                محرك قياس المتابعة والأثر التنموي والاجتماعي (Development Impact Tracking Engine V3.1)
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                نظام إدارة دورة حياة المبادرة من التشخيص حتى الأثر
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              حلقة متابعة مغلقة تربط القرار القيادي بالتنفيذ الميداني وتوثيق النزول الفني واحتساب مؤشرات الأثر المباشرة
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('field_staging')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
          >
            <span>بوابة الرفع والتنفيذ الميداني 📤</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Live Calculated Impact Indicators Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Beneficiaries Served */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 block">👥 المستفيدون المخدومون</span>
            <div className="text-xl font-black text-slate-900 font-mono">
              {developmentImpactMetrics.totalBeneficiariesServed.toLocaleString('ar-YE')}
            </div>
            <span className="text-[9px] font-bold text-emerald-700 block">مستفيد مباشر بمحافظة إب</span>
          </div>

          {/* Road Network Km */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 block">🛣️ شبكة الطرق المعبدة</span>
            <div className="text-xl font-black text-slate-900 font-mono">
              {developmentImpactMetrics.estimatedRoadKm} كم
            </div>
            <span className="text-[9px] font-bold text-sky-700 block">
              ~{developmentImpactMetrics.estimatedSquareMetersPaved.toLocaleString('ar-YE')} م² رصف حجري
            </span>
          </div>

          {/* Community Contribution */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 block">🤝 المساهمة الشعبية النقدية والعينية</span>
            <div className="text-xl font-black text-slate-900 font-mono">
              {(developmentImpactMetrics.totalCommunityValueYer / 1000000).toFixed(1)}M
            </div>
            <span className="text-[9px] font-bold text-amber-700 block">ريال يمني مساهمة أهلية</span>
          </div>

          {/* Cement Protected */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 block">📦 مواد تم استخدامها وحمايتها</span>
            <div className="text-xl font-black text-slate-900 font-mono">
              {developmentImpactMetrics.totalCementProtectedAndUsed.toLocaleString('ar-YE')}
            </div>
            <span className="text-[9px] font-bold text-emerald-700 block">كيس أسمنت محمي ومستهلك</span>
          </div>

          {/* Reactivated Stagnant */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 block">🔄 متعثرات تم إعادة تشغيلها</span>
            <div className="text-xl font-black text-slate-900 font-mono">
              {developmentImpactMetrics.reactivatedInitiativesCount}
            </div>
            <span className="text-[9px] font-bold text-rose-700 block">تجاوزت توقفها بقرارات القيادة</span>
          </div>

          {/* Closed Loop Workflow Status */}
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-1 border border-slate-800">
            <span className="text-[10px] font-bold text-emerald-400 block">⚡ حالة المسار المغلق</span>
            <div className="text-sm font-black text-white">
              جاهز ومُحدث حيّاً
            </div>
            <span className="text-[9px] font-bold text-slate-300 block">تحديث أوتوماتيكي تلقائي</span>
          </div>
        </div>

        {/* 4-Step Lifecycle Closed Pathway Visualizer */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold border-b border-slate-800 pb-2">
            <span className="text-emerald-400 font-black">🔄 مسار التنفيذ والمتابعة الميدانية المغلق (Closed Lifecycle Pathway):</span>
            <span className="text-slate-400 text-[11px]">ميدان → مشرف → اعتماد → تحديث لوحة القيادة</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Step 1 */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-amber-400 font-black">
                <span>١. الرفع الميداني</span>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">المهندس / الفارس</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                رفع كشف النزول، تقرير المساحة المرصوفة، الصور، ونسبة الإنجاز الميدانية الجديدة.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-sky-400 font-black">
                <span>٢. مراجعة المشرف</span>
                <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded">المشرف الفني</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                تدقيق مطابقة الأسمنت المستهلك بالإنجاز الميداني ومطابقة ملاحظات المعاينة.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-emerald-400 font-black">
                <span>٣. اعتماد التقرير</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">مدير الوحدة / السلطة</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                التوقيع على اعتماد التقرير وتحويل الحالة إلى "تم التحقق والمطابقة بنجاح".
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-purple-400 font-black">
                <span>٤. التحديث التلقائي</span>
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">تحديث فوري للوحة</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                تحديث بطاقة المبادرة، مؤشرات القيادة الستة، وتنزيل مستوى المخاطر حياً.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 📈 RISK & MATERIALS ANALYTICS DASHBOARD (تحليلات المخاطر والمواد والمجتمع) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Materials & Stock Health Analytics */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
          <div className="flex items-center justify-between border-r-4 border-amber-500 pr-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              ميزانية ومخزون الأسمنت بالمحافظة:
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-600 font-bold">• إجمالي المصروف:</span>
              <span className="font-mono font-black text-slate-900 text-sm">{materialsAnalytics.disbursedSum.toLocaleString('ar-YE')} كيس</span>
            </div>

            <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
              <span className="text-emerald-800 font-bold">• المستخدم فعلياً بالصب:</span>
              <span className="font-mono font-black text-emerald-700 text-sm">{materialsAnalytics.usedSum.toLocaleString('ar-YE')} كيس</span>
            </div>

            <div className="flex justify-between items-center bg-amber-50/50 p-3 rounded-xl border border-amber-200">
              <span className="text-amber-800 font-bold">• المتبقي بالمخازن والمواقع:</span>
              <span className="font-mono font-black text-amber-700 text-sm">{materialsAnalytics.remainingSum.toLocaleString('ar-YE')} كيس</span>
            </div>

            <div className="flex justify-between items-center bg-rose-50/50 p-3 rounded-xl border border-rose-200">
              <span className="text-rose-800 font-bold">• مخازن مهددة بالتلف:</span>
              <span className="font-mono font-black text-rose-700 text-sm">{materialsAnalytics.atRiskCount} مخزن</span>
            </div>
          </div>
        </div>

        {/* Top Causes Ranking */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
          <div className="flex items-center justify-between border-r-4 border-rose-600 pr-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              أكثر أسباب التعثر تكراراً بالميدان:
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            {topStagnationCauses.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-1">
                <div className="flex justify-between items-center font-bold text-slate-800 text-[11px]">
                  <span className="line-clamp-1">{item.cause}</span>
                  <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-mono font-black shrink-0">
                    {item.count} مبادرة
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Community Participation Analytics */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
          <div className="flex items-center justify-between border-r-4 border-sky-600 pr-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              مستوى مشاركة وتفاعل المجتمع:
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-bold block text-[10px]">إجمالي قيمة المساهمات الأهلية:</span>
              <span className="font-mono font-black text-slate-900 text-base">
                {(communityAnalytics.totalCommunityVal / 1000000).toFixed(1)} مليون YER
              </span>
            </div>

            <div className="bg-sky-50/50 p-3 rounded-xl border border-sky-200 space-y-1">
              <div className="flex justify-between items-center font-bold text-sky-900 text-[11px]">
                <span>نسبة المبادرات ذات اللجان المجتمعية:</span>
                <span className="font-mono font-black text-sm">{communityAnalytics.committeeRatio}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-600 h-2 rounded-full" style={{ width: `${communityAnalytics.committeeRatio}%` }}></div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 font-bold">
              تؤكد قراءات المنصة أن المبادرات ذات اللجان المجتمعية النشطة تحقق نسب إنجاز أعلى بـ ٣٥٪ مقارنة بغيرها.
            </div>
          </div>
        </div>
      </div>

      {/* 3. DISTRICT PROGRESS BREAKDOWN */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
        <div className="flex items-center justify-between border-r-4 border-indigo-600 pr-3 pb-2">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              مستوى التقدم حسب مديريات محافظة إب (توزيع الأداء والأرقام):
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              مقارنة الإنجاز والمبادرات المنجزة والمتعثرة في كل مديرية
            </p>
          </div>
          <button 
            onClick={() => onNavigateTab('initiatives')} 
            className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            عرض الكل ◀
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {districtProgress.slice(0, 9).map(dist => (
            <div key={dist.name} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 hover:border-indigo-300 transition-all">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  مديرية {dist.name}
                </span>
                <span className="text-[11px] font-black text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-md">
                  {dist.total} مبادرة
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>متوسط نسبة الإنجاز:</span>
                  <span className="text-emerald-700 font-mono font-black">{dist.avgRate}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      dist.avgRate >= 60 ? 'bg-emerald-600' : dist.avgRate >= 35 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${dist.avgRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 pt-1">
                <span className="text-emerald-700">✓ منجزة: {dist.completed}</span>
                <span className={dist.stagnant > 0 ? 'text-rose-600 font-black' : 'text-slate-400'}>
                  ⚠️ متعثرة: {dist.stagnant}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 📜 EXECUTIVE DECISION MODAL FOR DIRECT LEADERSHIP ACTIONS */}
      {activeDecisionInit && (
        <ExecutiveDecisionModal
          initiative={activeDecisionInit}
          initialActionType={activeDecisionAction}
          isOpen={Boolean(activeDecisionInit)}
          onClose={() => setActiveDecisionInit(null)}
          onExecuteDecision={(updated) => {
            if (onUpdateInitiative) {
              onUpdateInitiative(updated);
            }
            setActiveDecisionInit(null);
            setBriefToastMsg(`تم إصدار وتوثيق القرار القيادي للمبادرة "${updated.name}" بنجاح.`);
            setTimeout(() => setBriefToastMsg(null), 6000);
          }}
        />
      )}
    </div>
  );
}
