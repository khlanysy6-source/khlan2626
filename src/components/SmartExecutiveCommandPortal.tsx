import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  FileCheck,
  Target,
  Zap,
  Users,
  Building2,
  Clock,
  ChevronRight,
  Filter,
  Search,
  Plus,
  Edit3,
  Trash2,
  Check,
  Calendar,
  Phone,
  FileText,
  Printer,
  Download,
  AlertCircle,
  Package,
  Compass,
  ArrowUpRight,
  Send,
  Layers,
  Award,
  Shield,
  HelpCircle,
  Brain,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { Initiative, UserRole, ExecutiveAction, ExecutiveActionStatus, ExecutiveActionPriority } from '../types';
import {
  إنشاء_الملف_التنفيذي_للمبادرة,
  الملف_التنفيذي_للمبادرة
} from '../utils/developmentDecisionEngine';
import { تحليل_التنبؤ_التنموي, التحليل_التنبؤي_للمبادرة } from '../utils/predictiveDevelopmentAnalysis';
import { تحليل_قاعدة_المعرفة_التنموية, بناء_سجل_معرفة_المبادرة } from '../utils/developmentKnowledgeBase';
import { تحليل_منظومة_التخطيط_التنموي, تقييم_احتياج_تخطيطي, بطاقة_التخطيط_التنموي } from '../utils/developmentPlanningEngine';
import { SAMPLE_PROPOSED_NEEDS } from './SmartDevelopmentAdvisorV5';
import { CANONICAL_DISTRICTS, matchDistrictStrict } from '../utils/numberAndDistrictUtils';
import { exportInitiativesToExcel } from '../utils/excelExporter';

import { ExecutiveDecisionModal, ExecutiveActionType } from './ExecutiveDecisionModal';

interface SmartExecutiveCommandPortalProps {
  initiatives: Initiative[];
  onSelectInitiative?: (initiative: Initiative) => void;
  targetInitiativeId?: string | null;
  userRole?: UserRole;
  onUpdateInitiative?: (initiative: Initiative) => void;
}

export default function SmartExecutiveCommandPortal({
  initiatives,
  onSelectInitiative,
  targetInitiativeId,
  userRole = 'central_unit',
  onUpdateInitiative
}: SmartExecutiveCommandPortalProps) {
  // Main Navigation Sub-Tab inside Command Center
  const [commandTab, setCommandTab] = useState<
    'critical_command' | 'actions_register' | 'smart_alerts' | 'priority_matrix' | 'entity_responsibility' | 'knowledge_learning' | 'developmental_planning' | 'executive_reports'
  >('critical_command');

  // Executive Decision Modal State
  const [activeDecisionInit, setActiveDecisionInit] = useState<Initiative | null>(null);
  const [activeDecisionAction, setActiveDecisionAction] = useState<ExecutiveActionType>('direct');
  const [executiveSuccessMsg, setExecutiveSuccessMsg] = useState<string | null>(null);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  // Load Executive Dossiers for All Initiatives strictly via Engine
  const allDossiers: الملف_التنفيذي_للمبادرة[] = useMemo(() => {
    return initiatives.map(init => إنشاء_الملف_التنفيذي_للمبادرة(init));
  }, [initiatives]);

  // Filtered Dossiers
  const filteredDossiers = useMemo(() => {
    return allDossiers.filter((d) => {
      const matchesDistrict = selectedDistrict === 'all' || matchDistrictStrict(d.هوية_المبادرة.المديرية, selectedDistrict);
      const matchesSearch =
        searchTerm === '' ||
        d.هوية_المبادرة.اسم_المبادرة.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.هوية_المبادرة.رقم_المبادرة.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.هوية_المبادرة.المديرية.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesRisk = true;
      if (riskFilter === 'critical') matchesRisk = d.المؤشرات.درجة_الخطورة === 'حرج';
      else if (riskFilter === 'high') matchesRisk = d.المؤشرات.درجة_الخطورة === 'مرتفع';
      else if (riskFilter === 'medium') matchesRisk = d.المؤشرات.درجة_الخطورة === 'متوسط';
      else if (riskFilter === 'low') matchesRisk = d.المؤشرات.درجة_الخطورة === 'منخفض';

      return matchesDistrict && matchesSearch && matchesRisk;
    });
  }, [allDossiers, selectedDistrict, searchTerm, riskFilter]);

  // Selected Card Filter in Critical Command
  const [cardFilter, setCardFilter] = useState<'all' | 'critical' | 'high_risk' | 'stagnant' | 'ready_closure' | 'urgent_intervention'>('all');

  const cardFilteredDossiers = useMemo(() => {
    if (cardFilter === 'critical') return filteredDossiers.filter(d => d.المؤشرات.درجة_الخطورة === 'حرج');
    if (cardFilter === 'high_risk') return filteredDossiers.filter(d => d.المؤشرات.درجة_الخطورة === 'مرتفع' || d.المؤشرات.درجة_الخطورة === 'حرج');
    if (cardFilter === 'stagnant') return filteredDossiers.filter(d => d.التحليل.الحالة_التشغيلية.includes('متوقفة') || d.التحليل.الحالة_التشغيلية.includes('متعثرة'));
    if (cardFilter === 'ready_closure') return filteredDossiers.filter(d => d.المؤشرات.جاهزية_الإغلاق === 'جاهزة');
    if (cardFilter === 'urgent_intervention') return filteredDossiers.filter(d => d.المؤشرات.درجة_الأولوية === 'عالية');
    return filteredDossiers;
  }, [filteredDossiers, cardFilter]);

  // =========================================================================
  // ACTIONS REGISTER STATE & LOCALSTORAGE PERSISTENCE
  // =========================================================================
  const [actionsList, setActionsList] = useState<ExecutiveAction[]>(() => {
    const saved = localStorage.getItem('cooperative_executive_actions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Failed to parse saved executive actions:', e);
      }
    }
    // Seed initial actions from critical dossiers if empty
    const initialActions: ExecutiveAction[] = [];
    allDossiers.forEach((d) => {
      if (d.المؤشرات.درجة_الخطورة === 'حرج' || d.المؤشرات.درجة_الخطورة === 'مرتفع') {
        const topAction = d.الإجراءات[0];
        const isCritical = d.المؤشرات.درجة_الخطورة === 'حرج';
        initialActions.push({
          id: `ACT-${d.هوية_المبادرة.معرف_المبادرة}`,
          initiativeId: d.هوية_المبادرة.معرف_المبادرة,
          initiativeNumber: d.هوية_المبادرة.رقم_المبادرة,
          initiativeName: d.هوية_المبادرة.اسم_المبادرة,
          district: d.هوية_المبادرة.المديرية,
          districtNumber: d.هوية_المبادرة.رقم_المديرية,
          associationNumber: d.هوية_المبادرة.رقم_الجمعية,
          issuedDecision: d.التوصيات[0] || 'النزول الميداني وحل المعوقات',
          requiredAction: topAction?.العنوان || 'عقد اجتماع طارئ وحل النزاع الميداني وتأمين مستودع الأسمنت',
          responsibleEntity: topAction?.الجهة_المسؤولة || 'مدير المديرية ورئيس الجمعية',
          responsibleRole: isCritical ? 'district_director' : 'cooperative_association',
          priority: isCritical ? 'critical' : 'high',
          assignedDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + (isCritical ? 3 : 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: isCritical ? 'in_progress' : 'new',
          notes: 'تم توليد التكليف تلقائياً بناءً على مخرجات الملف التنفيذي لمجلس محرك القرار.'
        });
      }
    });
    return initialActions;
  });

  // Persist Actions to LocalStorage
  useEffect(() => {
    localStorage.setItem('cooperative_executive_actions', JSON.stringify(actionsList));
  }, [actionsList]);

  // Modal State for New/Edit Action
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [editingAction, setEditingAction] = useState<ExecutiveAction | null>(null);

  // Form State
  const [formInitiativeId, setFormInitiativeId] = useState<string>('');
  const [formRequiredAction, setFormRequiredAction] = useState<string>('');
  const [formResponsibleEntity, setFormResponsibleEntity] = useState<string>('مدير المديرية والسلطة المحلية');
  const [formResponsibleRole, setFormResponsibleRole] = useState<'district_director' | 'cooperative_association' | 'development_knight' | 'engineer_inspector' | 'central_unit'>('district_director');
  const [formPriority, setFormPriority] = useState<ExecutiveActionPriority>('high');
  const [formDueDate, setFormDueDate] = useState<string>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState<string>('');

  const handleOpenNewAction = (defaultInitId?: string) => {
    const targetInit = defaultInitId 
      ? initiatives.find(i => i.id === defaultInitId) 
      : (initiatives[0] || null);
    
    if (targetInit) {
      const dossier = إنشاء_الملف_التنفيذي_للمبادرة(targetInit);
      setFormInitiativeId(targetInit.id);
      setFormRequiredAction(dossier.الإجراءات[0]?.العنوان || 'متابعة الصرف والتأكد من سلامة الرصف الحجري');
      setFormResponsibleEntity(dossier.الإجراءات[0]?.الجهة_المسؤولة || 'مدير المديرية والجمعية التعاونية');
    }
    setEditingAction(null);
    setShowActionModal(true);
  };

  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();
    const init = initiatives.find(i => i.id === formInitiativeId);
    if (!init) return;

    const dossier = إنشاء_الملف_التنفيذي_للمبادرة(init);

    if (editingAction) {
      setActionsList(prev => prev.map(act => act.id === editingAction.id ? {
        ...act,
        initiativeId: init.id,
        initiativeNumber: init.initiativeNumber || dossier.هوية_المبادرة.رقم_المبادرة,
        initiativeName: init.name,
        district: init.district,
        districtNumber: dossier.هوية_المبادرة.رقم_المديرية,
        associationNumber: dossier.هوية_المبادرة.رقم_الجمعية,
        issuedDecision: dossier.التوصيات[0] || 'الالتزام بخطة المتابعة',
        requiredAction: formRequiredAction,
        responsibleEntity: formResponsibleEntity,
        responsibleRole: formResponsibleRole,
        priority: formPriority,
        dueDate: formDueDate,
        notes: formNotes,
        updatedAt: new Date().toISOString()
      } : act));
    } else {
      const newAct: ExecutiveAction = {
        id: `ACT-${Date.now().toString().slice(-4)}`,
        initiativeId: init.id,
        initiativeNumber: init.initiativeNumber || dossier.هوية_المبادرة.رقم_المبادرة,
        initiativeName: init.name,
        district: init.district,
        districtNumber: dossier.هوية_المبادرة.رقم_المديرية,
        associationNumber: dossier.هوية_المبادرة.رقم_الجمعية,
        issuedDecision: dossier.التوصيات[0] || 'الالتزام بجدول المتابعة الفنية',
        requiredAction: formRequiredAction,
        responsibleEntity: formResponsibleEntity,
        responsibleRole: formResponsibleRole,
        priority: formPriority,
        assignedDate: new Date().toISOString().split('T')[0],
        dueDate: formDueDate,
        status: 'new',
        notes: formNotes,
        createdAt: new Date().toISOString()
      };
      setActionsList(prev => [newAct, ...prev]);
    }

    setShowActionModal(false);
  };

  const handleUpdateStatus = (actionId: string, newStatus: ExecutiveActionStatus) => {
    setActionsList(prev => prev.map(a => a.id === actionId ? { ...a, status: newStatus, updatedAt: new Date().toISOString() } : a));
  };

  // =========================================================================
  // SMART ALERTS GENERATED STRICTLY FROM EXECUTIVE DOSSIERS
  // =========================================================================
  const smartAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      type: 'stagnant_long' | 'disbursed_no_progress' | 'docs_missing' | 'tech_deviation' | 'action_overdue';
      title: string;
      reason: string;
      initiativeName: string;
      initiativeNumber: string;
      district: string;
      responsibleEntity: string;
      requiredAction: string;
      severity: 'critical' | 'high' | 'medium';
      initiativeId: string;
    }> = [];

    // 1. Scan Dossiers for alerts
    allDossiers.forEach((d) => {
      // Alert 1: Stagnant for long time
      if (d.التحليل.الحالة_التشغيلية.includes('متوقفة') || d.التحليل.الحالة_التشغيلية.includes('متعثرة')) {
        alerts.push({
          id: `ALT-STAG-${d.هوية_المبادرة.رقم_المبادرة}`,
          type: 'stagnant_long',
          title: '🚨 تنبيه: مبادرة متوقفة تحوم حولها مخاطر الركود',
          reason: `توقف الأعمال الميدانية وبقاء نسبة الإنجاز عند ${d.التحليل.نسبة_الإنجاز}% مع تعليق المساهمة المجتمعية.`,
          initiativeName: d.هوية_المبادرة.اسم_المبادرة,
          initiativeNumber: d.هوية_المبادرة.رقم_المبادرة,
          district: d.هوية_المبادرة.المديرية,
          responsibleEntity: 'السلطة المحلية بالمديرية والجمعية التعاونية',
          requiredAction: d.الإجراءات[0]?.العنوان || 'إرسال لجنة تحكيم مجتمعي وحل العوائق وإعادة التشغيل',
          severity: 'critical',
          initiativeId: d.هوية_المبادرة.معرف_المبادرة
        });
      }

      // Alert 2: Disbursed materials without sufficient progress
      const cementDisbursed = d.المواد.الإسمنت.المنصرف;
      if (cementDisbursed > 200 && d.التحليل.نسبة_الإنجاز < 35) {
        alerts.push({
          id: `ALT-MAT-${d.هوية_المبادرة.رقم_المبادرة}`,
          type: 'disbursed_no_progress',
          title: '⚠️ تنبيه: كمية أسمنت مصروفة دون تقدم مناسب بالإنجاز',
          reason: `تم صرف ${cementDisbursed} كيس أسمنت بينما نسبة الإنجاز الفعلي ${d.التحليل.نسبة_الإنجاز}% فقط، مما يعرض الأسمنت للتلف.`,
          initiativeName: d.هوية_المبادرة.اسم_المبادرة,
          initiativeNumber: d.هوية_المبادرة.رقم_المبادرة,
          district: d.هوية_المبادرة.المديرية,
          responsibleEntity: 'فارس التنمية والمهندس الميداني',
          requiredAction: 'فحص جودة التخزين وإجبار اللجنة الميدانية على تسريع الرصف الحجري',
          severity: 'high',
          initiativeId: d.هوية_المبادرة.معرف_المبادرة
        });
      }

      // Alert 3: Missing documents preventing closure
      if (d.التحليل.نسبة_الإنجاز >= 80 && d.الوثائق.النواقص.length > 0) {
        alerts.push({
          id: `ALT-DOC-${d.هوية_المبادرة.رقم_المبادرة}`,
          type: 'docs_missing',
          title: '📑 تنبيه: نقص وثائق رسمية يمنع الإغلاق المالي والفني النهائي',
          reason: `نسبة الإنجاز مرتفعة (${d.التحليل.نسبة_الإنجاز}%) لكن ينقصها: ${d.الوثائق.النواقص.join(' ، ')}.`,
          initiativeName: d.هوية_المبادرة.اسم_المبادرة,
          initiativeNumber: d.هوية_المبادرة.رقم_المبادرة,
          district: d.هوية_المبادرة.المديرية,
          responsibleEntity: 'المهندس الميداني ورئيس الجمعية',
          requiredAction: 'استكمال رفع ألبوم الصور ومحضر الفرز الفني لإصدار الاستلام',
          severity: 'medium',
          initiativeId: d.هوية_المبادرة.معرف_المبادرة
        });
      }

      // Alert 4: Technical deviation
      if (d.التحليل.الحالة_الفنية.includes('انحراف') || d.الهندسة.هل_التنفيذ_مطابق_للدراسة !== 'مطابق') {
        alerts.push({
          id: `ALT-ENG-${d.هوية_المبادرة.رقم_المبادرة}`,
          type: 'tech_deviation',
          title: '🛠️ تنبيه: انحراف فني عن معايير الرصف والجدران الساندة',
          reason: `رصد انحراف بالرصف أو الجدران الساندة يتطلب معاينة فنية مستعجلة من مشرف المحافظة.`,
          initiativeName: d.هوية_المبادرة.اسم_المبادرة,
          initiativeNumber: d.هوية_المبادرة.رقم_المبادرة,
          district: d.هوية_المبادرة.المديرية,
          responsibleEntity: 'وحدة التدخلات والمشرف الفني للمحافظة',
          requiredAction: 'مراجعة معايير الرصف الحجري والجدران الساندة وتحديد الملاحظات',
          severity: 'high',
          initiativeId: d.هوية_المبادرة.معرف_المبادرة
        });
      }
    });

    // Alert 5: Overdue actions from register
    actionsList.filter(a => a.status === 'overdue' || a.status === 'escalated').forEach(act => {
      alerts.push({
        id: `ALT-ACT-${act.id}`,
        type: 'action_overdue',
        title: '⏳ تنبيه: تأخر تكليف تنفيذي هام تجاوز تاريخ الاستحقاق',
        reason: `التكليف [${act.requiredAction}] تاريخ استحقاقه كان (${act.dueDate}) ولم يكتمل بعد.`,
        initiativeName: act.initiativeName,
        initiativeNumber: act.initiativeNumber,
        district: act.district,
        responsibleEntity: act.responsibleEntity,
        requiredAction: 'التواصل المباشر مع المكلف وتصعيد الأمر لقيادة المحافظة',
        severity: 'critical',
        initiativeId: act.initiativeId
      });
    });

    return alerts;
  }, [allDossiers, actionsList]);

  // Selected Report State
  const [selectedReportType, setSelectedReportType] = useState<
    'simplified_executive' | 'future_risk_report' | 'stagnation_report' | 'resource_efficiency_report' | 'fast_closure_report' | 'preventive_interventions_report' | 'lessons_learned_report' | 'stagnation_causes_report' | 'success_factors_report' | 'future_planning_report' | 'developmental_planning_report'
  >('simplified_executive');

  return (
    <div className="space-y-6 pb-12 font-sans text-right" dir="rtl">
      {/* ========================================================================= */}
      {/* TOP HEADER & COMMAND DASHBOARD BRANDING */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/30 space-y-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-3 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-black px-3.5 py-1.5 rounded-full shadow-inner">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                مركز القيادة التنموية والتحكم بالقرارات (المرحلة الخامسة) 🏛️
              </span>
              <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs font-bold px-3 py-1.5 rounded-full">
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                ربط القرار بالإجراءات والمتابعة والمسؤولية المباشرة
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-snug">
              مركز القيادة التشغيلية وسجل الإجراءات التنموية
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium text-justify">
              تطبيق الدورة التنموية المكتملة: <strong className="text-emerald-300">"بيانات المبادرات + التقييم الميداني → محرك القرار → الملف التنفيذي → المستشار V5 → مركز القيادة → إجراء + مسؤول + متابعة + نتيجة"</strong>.
            </p>
          </div>

          <button
            onClick={() => handleOpenNewAction()}
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl transition-all cursor-pointer border border-emerald-400/30 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إصدار تكليف / إجراء تنفيذي جديد ✍️</span>
          </button>
        </div>

        {/* 5 CORE EXECUTIVE COUNTERS (DIRECT FROM ENGINE DOSSIERS) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 text-xs relative z-10">
          {/* Critical Initiatives Counter */}
          <button
            onClick={() => {
              setCommandTab('critical_command');
              setCardFilter('critical');
            }}
            className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
              cardFilter === 'critical' && commandTab === 'critical_command'
                ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/50'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] text-slate-400 block font-bold mb-1 flex items-center justify-between">
              المبادرات الحرجة 🚨
              <span className="text-xs font-mono font-black text-rose-400">
                {allDossiers.filter(d => d.المؤشرات.درجة_الخطورة === 'حرج').length}
              </span>
            </span>
            <span className="text-lg font-black text-rose-400">
              {allDossiers.filter(d => d.المؤشرات.درجة_الخطورة === 'حرج').length} <span className="text-xs font-bold text-slate-400">مبادرة</span>
            </span>
            <span className="text-[9px] text-slate-400 block mt-1 font-medium">تحتاج تدخل قيادي طارئ</span>
          </button>

          {/* High Risk Counter */}
          <button
            onClick={() => {
              setCommandTab('critical_command');
              setCardFilter('high_risk');
            }}
            className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
              cardFilter === 'high_risk' && commandTab === 'critical_command'
                ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-2 ring-amber-500/50'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] text-slate-400 block font-bold mb-1 flex items-center justify-between">
              عالية الخطورة ⚠️
              <span className="text-xs font-mono font-black text-amber-400">
                {allDossiers.filter(d => d.المؤشرات.درجة_الخطورة === 'مرتفع' || d.المؤشرات.درجة_الخطورة === 'حرج').length}
              </span>
            </span>
            <span className="text-lg font-black text-amber-400">
              {allDossiers.filter(d => d.المؤشرات.درجة_الخطورة === 'مرتفع' || d.المؤشرات.درجة_الخطورة === 'حرج').length} <span className="text-xs font-bold text-slate-400">مبادرة</span>
            </span>
            <span className="text-[9px] text-slate-400 block mt-1 font-medium">متابعة هندسية دقيقة</span>
          </button>

          {/* Stagnant Counter */}
          <button
            onClick={() => {
              setCommandTab('critical_command');
              setCardFilter('stagnant');
            }}
            className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
              cardFilter === 'stagnant' && commandTab === 'critical_command'
                ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/50'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] text-slate-400 block font-bold mb-1 flex items-center justify-between">
              المبادرات المتوقفة 🛑
              <span className="text-xs font-mono font-black text-indigo-400">
                {allDossiers.filter(d => d.التحليل.الحالة_التشغيلية.includes('متوقفة') || d.التحليل.الحالة_التشغيلية.includes('متعثرة')).length}
              </span>
            </span>
            <span className="text-lg font-black text-indigo-300">
              {allDossiers.filter(d => d.التحليل.الحالة_التشغيلية.includes('متوقفة') || d.التحليل.الحالة_التشغيلية.includes('متعثرة')).length} <span className="text-xs font-bold text-slate-400">مبادرة</span>
            </span>
            <span className="text-[9px] text-slate-400 block mt-1 font-medium">تحتاج حل نزاع أو دعم</span>
          </button>

          {/* Ready for Closure Counter */}
          <button
            onClick={() => {
              setCommandTab('critical_command');
              setCardFilter('ready_closure');
            }}
            className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
              cardFilter === 'ready_closure' && commandTab === 'critical_command'
                ? 'bg-blue-950/80 border-blue-500 text-blue-200 ring-2 ring-blue-500/50'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] text-slate-400 block font-bold mb-1 flex items-center justify-between">
              جاهزة للإغلاق 🏁
              <span className="text-xs font-mono font-black text-blue-400">
                {allDossiers.filter(d => d.المؤشرات.جاهزية_الإغلاق === 'جاهزة').length}
              </span>
            </span>
            <span className="text-lg font-black text-blue-300">
              {allDossiers.filter(d => d.المؤشرات.جاهزية_الإغلاق === 'جاهزة').length} <span className="text-xs font-bold text-slate-400">مبادرة</span>
            </span>
            <span className="text-[9px] text-slate-400 block mt-1 font-medium">استكمال محضر الاستلام</span>
          </button>

          {/* Urgent Intervention Counter */}
          <button
            onClick={() => {
              setCommandTab('critical_command');
              setCardFilter('urgent_intervention');
            }}
            className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
              cardFilter === 'urgent_intervention' && commandTab === 'critical_command'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] text-slate-400 block font-bold mb-1 flex items-center justify-between">
              تدخل عاجل ⚡
              <span className="text-xs font-mono font-black text-emerald-400">
                {allDossiers.filter(d => d.المؤشرات.درجة_الأولوية === 'عالية').length}
              </span>
            </span>
            <span className="text-lg font-black text-emerald-300">
              {allDossiers.filter(d => d.المؤشرات.درجة_الأولوية === 'عالية').length} <span className="text-xs font-bold text-slate-400">مبادرة</span>
            </span>
            <span className="text-[9px] text-slate-400 block mt-1 font-medium">أولوية أولى للقيادة</span>
          </button>
        </div>

        {/* SUB-TAB NAVIGATION BAR */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-800 no-scrollbar relative z-10 text-xs sm:text-sm">
          <button
            onClick={() => { setCommandTab('critical_command'); setCardFilter('all'); }}
            className={`px-4 py-2.5 rounded-2xl font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              commandTab === 'critical_command'
                ? 'bg-emerald-600 text-white shadow-lg border border-emerald-400/40 ring-2 ring-emerald-400/30'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-emerald-300" />
            <span>عرض المبادرات والقرارات الحرجة 🚨</span>
          </button>

          <button
            onClick={() => setCommandTab('actions_register')}
            className={`px-4 py-2.5 rounded-2xl font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap relative ${
              commandTab === 'actions_register'
                ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400/40 ring-2 ring-indigo-400/30'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-indigo-300" />
            <span>سجل الإجراءات والتكليفات ({actionsList.length}) 📋</span>
            {actionsList.filter(a => a.status === 'new' || a.status === 'overdue').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-1.5 left-1.5"></span>
            )}
          </button>

          <button
            onClick={() => setCommandTab('smart_alerts')}
            className={`px-4 py-2.5 rounded-2xl font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap relative ${
              commandTab === 'smart_alerts'
                ? 'bg-rose-600 text-white shadow-lg border border-rose-400/40 ring-2 ring-rose-400/30'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-300" />
            <span>التنبيهات القيادية الذكية ({smartAlerts.length}) 🔔</span>
          </button>

          <button
            onClick={() => setCommandTab('priority_matrix')}
            className={`px-4 py-2.5 rounded-2xl font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              commandTab === 'priority_matrix'
                ? 'bg-amber-600 text-white shadow-lg border border-amber-400/40 ring-2 ring-amber-400/30'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Target className="w-4 h-4 text-amber-300" />
            <span>لوحة الأولويات القيادية 📊</span>
          </button>

          <button
            onClick={() => setCommandTab('entity_responsibility')}
            className={`px-4 py-2.5 rounded-2xl font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              commandTab === 'entity_responsibility'
                ? 'bg-blue-600 text-white shadow-lg border border-blue-400/40 ring-2 ring-blue-400/30'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-blue-300" />
            <span>ربط القرار بالمسؤولية 🤝</span>
          </button>

          <button
            onClick={() => setCommandTab('knowledge_learning')}
            className={`px-4 py-2.5 rounded-2xl font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              commandTab === 'knowledge_learning'
                ? 'bg-purple-600 text-white shadow-lg border border-purple-400/40 ring-2 ring-purple-400/30'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Brain className="w-4 h-4 text-purple-300" />
            <span>منظومة المعرفة والتعلم المؤسسي 🧠</span>
          </button>

          <button
            onClick={() => setCommandTab('developmental_planning')}
            className={`px-4 py-2.5 rounded-2xl font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              commandTab === 'developmental_planning'
                ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400/40 ring-2 ring-indigo-400/30'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4 text-indigo-300" />
            <span>مركز التخطيط التنموي الذكي 🧭</span>
          </button>

          <button
            onClick={() => setCommandTab('executive_reports')}
            className={`px-4 py-2.5 rounded-2xl font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              commandTab === 'executive_reports'
                ? 'bg-teal-600 text-white shadow-lg border border-teal-400/40 ring-2 ring-teal-400/30'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-teal-300" />
            <span>التقارير القيادية الموحدة 📄</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR FOR DISTRICT AND SEARCH */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs shadow-xs">
        <div>
          <label className="text-slate-500 font-bold block mb-1">المديرية:</label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">جميع مديريات المحافظة ({initiatives.length} مبادرة)</option>
            {CANONICAL_DISTRICTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-slate-500 font-bold block mb-1">تصفية درجة الخطورة:</label>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as any)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">جميع مستويات الخطورة</option>
            <option value="critical">حرج 🚨</option>
            <option value="high">مرتفع ⚠️</option>
            <option value="medium">متوسط 🟡</option>
            <option value="low">منخفض 🟢</option>
          </select>
        </div>

        <div>
          <label className="text-slate-500 font-bold block mb-1">بحث برمز أو اسم المبادرة:</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: CRITICAL COMMAND & EXECUTIVE DOSSIERS VIEW */}
      {/* ========================================================================= */}
      {commandTab === 'critical_command' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="font-black text-lg text-slate-900">
                قائمة المبادرات والملفات التنفيذية ({cardFilteredDossiers.length})
              </h3>
            </div>

            {cardFilter !== 'all' && (
              <button
                onClick={() => setCardFilter('all')}
                className="text-xs font-bold text-indigo-600 hover:underline bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl"
              >
                إلغاء تصفية البطاقات السريعة (عرض الكل)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cardFilteredDossiers.map((dos) => {
              const initObj = initiatives.find(i => i.id === dos.هوية_المبادرة.معرف_المبادرة);
              return (
                <div
                  key={dos.هوية_المبادرة.رقم_المبادرة}
                  className={`bg-white border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between ${
                    dos.المؤشرات.درجة_الخطورة === 'حرج' ? 'border-rose-300/80 bg-gradient-to-b from-rose-50/30 to-white' :
                    dos.المؤشرات.درجة_الخطورة === 'مرتفع' ? 'border-amber-300/80 bg-gradient-to-b from-amber-50/30 to-white' :
                    'border-slate-200/80'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-mono font-black bg-slate-900 text-white px-2.5 py-0.5 rounded-lg">
                        {dos.هوية_المبادرة.رقم_المبادرة}
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        dos.المؤشرات.درجة_الخطورة === 'حرج' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                        dos.المؤشرات.درجة_الخطورة === 'مرتفع' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        الخطورة: {dos.المؤشرات.درجة_الخطورة}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2">
                      {dos.هوية_المبادرة.اسم_المبادرة}
                    </h4>

                    <div className="text-xs text-slate-500 font-bold flex items-center justify-between">
                      <span>المديرية: {dos.هوية_المبادرة.المديرية}</span>
                      <span className="text-emerald-700">صحة المبادرة: {dos.المؤشرات.درجة_صحة_المبادرة}/100</span>
                    </div>

                    {/* Gauges mini */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-0.5">
                        <span className="text-[9px] text-slate-400 block font-bold">الحالة التشغيلية:</span>
                        <span className="font-bold text-slate-800 truncate block">{dos.التحليل.الحالة_التشغيلية}</span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-0.5">
                        <span className="text-[9px] text-slate-400 block font-bold">الإنجاز الفعلي:</span>
                        <span className="font-black text-emerald-700 block">{dos.التحليل.نسبة_الإنجاز}%</span>
                      </div>
                    </div>

                    {/* Decision from engine */}
                    <div className="bg-slate-900 text-white p-3 rounded-2xl text-xs space-y-1">
                      <span className="text-[10px] text-emerald-400 font-bold block flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" /> القرار المعتمد بالملف التنفيذي:
                      </span>
                      <p className="font-bold text-[11px] leading-relaxed line-clamp-2">
                        {dos.التوصيات[0] || 'الالتزام بمتابعة خطة العمل وتفريغ الصور.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => handleOpenNewAction(dos.هوية_المبادرة.معرف_المبادرة)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-xl transition-all cursor-pointer border border-indigo-200 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إصدار تكليف</span>
                    </button>

                    {onSelectInitiative && initObj && (
                      <button
                        onClick={() => onSelectInitiative(initObj)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <span>فتح البطاقة ↗</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: ACTIONS REGISTER & TASK MANAGEMENT */}
      {/* ========================================================================= */}
      {commandTab === 'actions_register' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-2xl">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">سجل الإجراءات والتكليفات التنفيذية (الإجراء_التنموي)</h3>
                  <p className="text-xs text-slate-500">متابعة التكليفات المسندة للجهات وتتبع حالات التنفيذ والمسؤوليات</p>
                </div>
              </div>

              <button
                onClick={() => handleOpenNewAction()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة تكليف جديد ✍️</span>
              </button>
            </div>

            {/* TABLE OF ACTIONS */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-white font-black">
                  <tr>
                    <th className="p-3">رقم التكليف والمبادرة</th>
                    <th className="p-3">القرار الصادر والإجراء المطلوب</th>
                    <th className="p-3">الجهة المسؤولة والمكلف</th>
                    <th className="p-3">الأولوية</th>
                    <th className="p-3">التاريخ والاستحقاق</th>
                    <th className="p-3">حالة الإجراء</th>
                    <th className="p-3 text-center">التحكم والعمليات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {actionsList.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 align-top space-y-1">
                        <span className="text-[10px] font-mono font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 block w-fit">
                          {act.id}
                        </span>
                        <span className="font-black text-slate-900 block text-xs">
                          {act.initiativeName}
                        </span>
                        <span className="text-[10px] text-slate-500 block font-bold">
                          [{act.initiativeNumber}] - {act.district}
                        </span>
                      </td>

                      <td className="p-3 align-top space-y-1 max-w-xs">
                        <span className="text-[10px] text-emerald-800 font-bold block bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
                          القرار: {act.issuedDecision}
                        </span>
                        <p className="font-bold text-slate-800 text-xs leading-relaxed">
                          الإجراء: {act.requiredAction}
                        </p>
                      </td>

                      <td className="p-3 align-top space-y-1">
                        <span className="font-black text-indigo-900 block text-xs">
                          {act.responsibleEntity}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold block">
                          الدور: {act.responsibleRole === 'district_director' ? 'مدير المديرية' : act.responsibleRole === 'cooperative_association' ? 'رئيس الجمعية' : act.responsibleRole === 'development_knight' ? 'فارس التنمية' : act.responsibleRole === 'engineer_inspector' ? 'المهندس' : 'وحدة التدخلات'}
                        </span>
                      </td>

                      <td className="p-3 align-top">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border inline-block ${
                          act.priority === 'critical' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                          act.priority === 'high' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {act.priority === 'critical' ? 'حرج للغاية' : act.priority === 'high' ? 'أولوية عالية' : 'عادي'}
                        </span>
                      </td>

                      <td className="p-3 align-top space-y-1 text-[11px]">
                        <span className="text-slate-500 block">التكليف: {act.assignedDate}</span>
                        <span className="font-black text-slate-800 block">الاستحقاق: {act.dueDate}</span>
                      </td>

                      <td className="p-3 align-top">
                        <select
                          value={act.status}
                          onChange={(e) => handleUpdateStatus(act.id, e.target.value as ExecutiveActionStatus)}
                          className={`text-xs font-black px-2.5 py-1 rounded-xl border focus:outline-hidden ${
                            act.status === 'completed' ? 'bg-emerald-100 text-emerald-900 border-emerald-400' :
                            act.status === 'in_progress' ? 'bg-blue-100 text-blue-900 border-blue-400' :
                            act.status === 'overdue' ? 'bg-rose-100 text-rose-900 border-rose-400' :
                            act.status === 'escalated' ? 'bg-purple-100 text-purple-900 border-purple-400' :
                            'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          <option value="new">جديد 🆕</option>
                          <option value="in_progress">جاري التنفيذ ⏳</option>
                          <option value="completed">مكتمل ✓</option>
                          <option value="overdue">متأخر 🚨</option>
                          <option value="escalated">تصعيد لقيادة المحافظة ⚠️</option>
                        </select>
                      </td>

                      <td className="p-3 align-top text-center space-x-1 space-x-reverse">
                        <button
                          onClick={() => {
                            setEditingAction(act);
                            setFormInitiativeId(act.initiativeId);
                            setFormRequiredAction(act.requiredAction);
                            setFormResponsibleEntity(act.responsibleEntity);
                            setFormPriority(act.priority);
                            setFormDueDate(act.dueDate);
                            setFormNotes(act.notes || '');
                            setShowActionModal(true);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="تعديل"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActionsList(prev => prev.filter(a => a.id !== act.id))}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: SMART LEADERSHIP ALERTS VIEW */}
      {/* ========================================================================= */}
      {commandTab === 'smart_alerts' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-rose-100 text-rose-800 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">نظام التنبيهات القيادية الذكية ({smartAlerts.length})</h3>
                  <p className="text-xs text-slate-500">تنبيهات فورية مستخرجة تلقائياً من قراءة أصل الملف التنفيذ للمبادرات</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {smartAlerts.map((alt) => (
                <div
                  key={alt.id}
                  className={`p-4 rounded-2xl border space-y-2 text-xs transition-all ${
                    alt.severity === 'critical' ? 'bg-rose-50/80 border-rose-300 text-rose-950' :
                    alt.severity === 'high' ? 'bg-amber-50/80 border-amber-300 text-amber-950' :
                    'bg-blue-50/80 border-blue-300 text-blue-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-black text-sm">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      {alt.title}
                    </span>
                    <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-md font-mono">
                      [{alt.initiativeNumber}] {alt.district}
                    </span>
                  </div>

                  <p className="font-medium text-slate-800 leading-relaxed">
                    <strong>السبب المباشر:</strong> {alt.reason}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-bold">
                    <span className="text-indigo-900">الجهة المعنية: {alt.responsibleEntity}</span>
                    <span className="text-emerald-900">الإجراء المطلوب: {alt.requiredAction}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                    <button
                      onClick={() => handleOpenNewAction(alt.initiativeId)}
                      className="px-3 py-1.5 bg-slate-900 text-white hover:bg-emerald-700 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-1"
                    >
                      <span>تحويل التنبيه لتكليف تنفيذي ✍️</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: PRIORITY MATRIX & RANKING */}
      {/* ========================================================================= */}
      {commandTab === 'priority_matrix' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">لوحة الأولويات القيادية الخمس</h3>
                  <p className="text-xs text-slate-500">ترتيب المبادرات حسب الخطورة والأثر والإنجاز الفعلي والموارد دون أرقام جديدة خارج المحرك</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-white font-black">
                  <tr>
                    <th className="p-3">الترتيب</th>
                    <th className="p-3">المبادرة والمديرية</th>
                    <th className="p-3">درجة الخطورة</th>
                    <th className="p-3">درجة الأولوية</th>
                    <th className="p-3">درجة الصحة</th>
                    <th className="p-3">الإنجاز الفعلي</th>
                    <th className="p-3">قيمة الأسمنت بالموقع</th>
                    <th className="p-3">القرار المعتمد بالملف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredDossiers
                    .slice()
                    .sort((a, b) => (a.المؤشرات.درجة_الخطورة === 'حرج' ? -1 : 1))
                    .map((d, idx) => (
                      <tr key={d.هوية_المبادرة.رقم_المبادرة} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-black text-slate-700">#{idx + 1}</td>
                        <td className="p-3">
                          <span className="font-black text-slate-900 block">{d.هوية_المبادرة.اسم_المبادرة}</span>
                          <span className="text-[10px] text-slate-500 block">[{d.هوية_المبادرة.رقم_المبادرة}] - {d.هوية_المبادرة.المديرية}</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            d.المؤشرات.درجة_الخطورة === 'حرج' ? 'bg-rose-100 text-rose-800' :
                            d.المؤشرات.درجة_الخطورة === 'مرتفع' ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {d.المؤشرات.درجة_الخطورة}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-indigo-900">{d.المؤشرات.درجة_الأولوية}</td>
                        <td className="p-3 font-bold text-emerald-800">{d.المؤشرات.درجة_صحة_المبادرة}/100</td>
                        <td className="p-3 font-black text-slate-900">{d.التحليل.نسبة_الإنجاز}%</td>
                        <td className="p-3 font-mono font-bold text-slate-700">{d.المواد.الإسمنت.المتبقي_لدى_المبادرة} كيس</td>
                        <td className="p-3 font-bold text-slate-800 text-[11px] max-w-xs">{d.التوصيات[0]}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: ENTITY RESPONSIBILITY LINKAGE */}
      {/* ========================================================================= */}
      {commandTab === 'entity_responsibility' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-100 text-blue-800 rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">ربط القرار بالمسؤولية والشيت الثلاثي (Triple Key Authority)</h3>
                  <p className="text-xs text-slate-500">ربط المبادرة بالإصدار المعتمد بناءً على: رقم المبادرة + رقم المديرية + رقم الجمعية</p>
                </div>
              </div>
            </div>

            {/* 5 ENTITY RESPONSIBILITY CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <span className="font-black text-indigo-900 text-sm block">1. مدير المديرية (السلطة المحلية) 🏛️</span>
                <p className="text-slate-600 leading-relaxed font-medium">
                  مسؤول عن حل النزاعات الاجتماعية وتوقيع التنازلات وتسهيل حركة المعدات وتذليل صعوبات الشق بالمديرية.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <span className="font-black text-emerald-900 text-sm block">2. رئيس الجمعية التعاونية 🤝</span>
                <p className="text-slate-600 leading-relaxed font-medium">
                  مسؤول عن حشد وتحصيل المساهمات المجتمعية النقدية والعينية وتأمين مستودع تخزين الأسمنت بالموقع.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <span className="font-black text-amber-900 text-sm block">3. فارس التنمية التنموي 🛡️</span>
                <p className="text-slate-600 leading-relaxed font-medium">
                  مسؤول عن المتابعة اليومية وإدخال البيانات بالشيت الميداني والرفع المباشر لنسب الإنجاز بدقة.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <span className="font-black text-blue-900 text-sm block">4. المهندس والمراقب الفني 👷‍♂️</span>
                <p className="text-slate-600 leading-relaxed font-medium">
                  مسؤول عن فحص واستلام أعمال الرصف الحجري والجدران الساندة وتصريف السيول.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <span className="font-black text-rose-900 text-sm block">5. وحدة التدخلات والمشرف المركز 🎯</span>
                <p className="text-slate-600 leading-relaxed font-medium">
                  مسؤول عن المراجعة والتدقيق والاعتماد النهائي لصرف الدفعات المتبقية وإصدار محاضر الإغلاق.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 6: KNOWLEDGE & INSTITUTIONAL LEARNING SYSTEM */}
      {/* ========================================================================= */}
      {commandTab === 'knowledge_learning' && (
        <div className="space-y-6 animate-fadeIn">
          {(() => {
            const kb = تحليل_قاعدة_المعرفة_التنموية(filteredDossiers);
            return (
              <div className="space-y-6">
                {/* KNOWLEDGE ENGINE KPI BANNER */}
                <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-lg border border-purple-800/40 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-500/20 border border-purple-400/30 rounded-2xl text-purple-300">
                        <Brain className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">منظومة المعرفة التنموية والتعلم المؤسسي</h3>
                        <p className="text-xs text-purple-200/80 font-bold">
                          تحليل الخبرات المتراكمة واستخراج الدروس المستفادة وعوامل النجاح لربطها بقرارات التخطيط المستقبلي
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-black rounded-full">
                      تغذية راجعة من {kb.إجمالي_المبادرات_المحللة} مبادرة تنفيذية
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
                      <span className="text-xs text-slate-400 block font-bold mb-1">المبادرات المحللة</span>
                      <span className="text-2xl font-black font-mono text-purple-300">{kb.إجمالي_المبادرات_المحللة}</span>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
                      <span className="text-xs text-slate-400 block font-bold mb-1">نسبة المبادرات الناجحة</span>
                      <span className="text-2xl font-black font-mono text-emerald-400">{kb.نسبة_المبادرات_الناجحة}%</span>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
                      <span className="text-xs text-slate-400 block font-bold mb-1">نسبة التعثر المرصودة</span>
                      <span className="text-2xl font-black font-mono text-rose-400">{kb.نسبة_المبادرات_المتعثرة}%</span>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
                      <span className="text-xs text-slate-400 block font-bold mb-1">النماذج القياسية المكررة</span>
                      <span className="text-2xl font-black font-mono text-cyan-300">{kb.المبادرات_النموذجية_القابلة_للمحاكاة.length}</span>
                    </div>
                  </div>
                </div>

                {/* 1. RECURRENT STAGNATION CAUSES */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-slate-900">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <h4 className="font-black text-slate-900 text-base">أكثر أسباب التعثر انتشاراً بمديريات المحافظة</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {kb.أبرز_أسباب_التعثر.map((item, idx) => (
                      <div key={idx} className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-black">
                          <span className="text-rose-950 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            {item.السبب}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 font-mono">
                            {item.عدد_الحالات} مبادرة ({item.نسبة_التكرار}%)
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium">
                          <strong className="text-slate-900">المديريات الأكثر تأثراً:</strong> {item.المديريات_الأكثر_تأثراً.join(' ، ') || 'عامة على مستوى القطاع'}
                        </p>
                        <div className="bg-white border border-rose-200 rounded-xl p-2.5 text-xs text-rose-900 font-bold">
                          💡 التوصية الوقائية المؤسسية: {item.التوصية_المؤسسية}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. SUCCESS FACTORS & BEST PRACTICES */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-slate-900">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Award className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-black text-slate-900 text-base">أبرز عوامل النجاح والممارسات الميدانية الفضلى</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {kb.أبرز_عوامل_النجاح.map((factor, idx) => (
                      <div key={idx} className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-black text-emerald-950">
                          <span>{factor.العامل}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-mono">
                            أثر {factor.نسبة_الأثر}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium">
                          استفاد منه {factor.عدد_المبادرات_المستفيدة} مبادرة ناجحة بالمديريات.
                        </p>
                        {factor.أمثلة_ميدانية.length > 0 && (
                          <div className="text-[11px] text-emerald-900 font-bold">
                            أمثلة: {factor.أمثلة_ميدانية.join(' ، ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. INITIATIVE LESSONS LEARNED CARDS */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-black text-slate-900 text-base">سجل بطاقات الدروس المستفادة لكل مبادرة</h4>
                    </div>
                    <span className="text-xs text-slate-500 font-bold">مربوطة مباشرة بالملف التنفيذي</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDossiers.slice(0, 6).map((dos) => {
                      const lessons = dos.الدروس_المستفادة || [];
                      return (
                        <div key={dos.هوية_المبادرة.رقم_المبادرة} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs font-black">
                            <span className="text-slate-900 font-mono">{dos.هوية_المبادرة.رقم_المبادرة} - {dos.هوية_المبادرة.اسم_المبادرة}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">{dos.هوية_المبادرة.المديرية}</span>
                          </div>

                          {lessons.length > 0 ? (
                            lessons.map((les, lIdx) => (
                              <div key={lIdx} className="bg-white border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                                <div className="font-black text-rose-900">⚠️ المشكلة: {les.المشكلة}</div>
                                <div className="text-slate-700">🔍 **السبب الجذري:** {les.سببها}</div>
                                <div className="text-indigo-900 font-bold">⚡ **الإجراء المتخذ:** {les.الإجراء_المتخذ}</div>
                                <div className="text-emerald-900 font-bold">🎯 **النتيجة:** {les.النتيجة}</div>
                                <div className="text-purple-900 bg-purple-50 p-2 rounded-lg font-bold border border-purple-100">
                                  💡 **التوصية المستقبلية:** {les.التوصية_المستقبلية}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-500 font-medium">المبادرة ملتزمة بالكامل بالمسار الميداني المحدد.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. FUTURE PLANNING RECOMMENDATIONS */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-sm space-y-3">
                  <h4 className="font-black text-amber-400 text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    توصيات القيادة للتخطيط التنموي المستقبلي
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-200">
                    {kb.توصيات_التخطيط_المستقبلي.map((rec, idx) => (
                      <div key={idx} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex items-start gap-2">
                        <span className="text-amber-400 font-bold shrink-0">{idx + 1}.</span>
                        <span className="font-medium leading-relaxed">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 7: SMART DEVELOPMENTAL PLANNING CENTER */}
      {/* ========================================================================= */}
      {commandTab === 'developmental_planning' && (
        <div className="space-y-6 animate-fadeIn">
          {(() => {
            const planSummary = تحليل_منظومة_التخطيط_التنموي(SAMPLE_PROPOSED_NEEDS, filteredDossiers);
            return (
              <div className="space-y-6">
                {/* PLANNING CENTER HEADER BANNER */}
                <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white rounded-3xl p-6 shadow-lg border border-indigo-800/40 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-300">
                        <Compass className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">مركز التخطيط التنموي الذكي وتحديد أولويات التدخل</h3>
                        <p className="text-xs text-indigo-200/80 font-bold">
                          ترتيب الاحتياجات والمبادرات المقترحة وفق مصفوفة المعايير التنموية الشاملة والمسارات الخمسة وقاعدة المعرفة
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-black rounded-full flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      تنبيه: أولوية تخطيطية مقترحة وليست قرار اعتماد رسمياً
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
                      <span className="text-xs text-slate-400 block font-bold mb-1">الاحتياجات المحللة</span>
                      <span className="text-2xl font-black font-mono text-indigo-300">{planSummary.إجمالي_الاحتياجات_المحللة}</span>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
                      <span className="text-xs text-slate-400 block font-bold mb-1">أولوية تخطيطية قصوى</span>
                      <span className="text-2xl font-black font-mono text-amber-400">{planSummary.الأولويات_القصوى_المقترحة.length}</span>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
                      <span className="text-xs text-slate-400 block font-bold mb-1">فرص التدخل السريع</span>
                      <span className="text-2xl font-black font-mono text-emerald-400">{planSummary.الفرص_المشجعة_للتدخل_السريع.length}</span>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
                      <span className="text-xs text-slate-400 block font-bold mb-1">تتطلب دراسة إضافية</span>
                      <span className="text-2xl font-black font-mono text-rose-400">{planSummary.مشاريع_تحتاج_دراسة_إضافية.length}</span>
                    </div>
                  </div>
                </div>

                {/* 1. SECTOR NEEDS & GEOGRAPHIC DISTRIBUTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* MOST NEEDY SECTORS */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-slate-900">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Layers className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-black text-slate-900 text-base">القطاعات الأكثر احتياجاً بالمديريات</h4>
                    </div>

                    <div className="space-y-3">
                      {planSummary.القطاعات_الأكثر_احتياجاً.map((sec, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-xs font-black">
                            <span className="text-slate-900">{sec.القطاع}</span>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-mono">
                              {sec.عدد_الاحتياجات} طلبات ({sec.نسبة_الحاجة}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${sec.نسبة_الحاجة}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GEOGRAPHIC DISTRIBUTION OF NEEDS */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-slate-900">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Compass className="w-5 h-5 text-purple-600" />
                      <h4 className="font-black text-slate-900 text-base">التوزيع الجغرافي للاحتياجات المقترحة</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {planSummary.التوزيع_الجغرافي_للأولويات.map((dis, idx) => (
                        <div key={idx} className="bg-purple-50/60 border border-purple-200 rounded-2xl p-3.5 space-y-1">
                          <div className="flex items-center justify-between text-xs font-black text-purple-950">
                            <span>مديرية {dis.المديرية}</span>
                            <span className="px-2 py-0.5 bg-purple-200 rounded text-purple-900 font-mono">{dis.عدد_الاحتياجات} احتياج</span>
                          </div>
                          <p className="text-[11px] text-slate-700 font-medium">القطاع ذو الأولوية: <strong className="text-purple-900">{dis.أولوية_القطاع}</strong></p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. CANDIDATE DEVELOPMENTAL PLANNING CARDS */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-black text-slate-900 text-base">بطاقات التخطيط التنموي للاحتياجات المقترحة</h4>
                    </div>
                    <span className="text-xs text-slate-500 font-bold">تقييم شامل بالمسارات الخمسة وقاعدة المعرفة</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {SAMPLE_PROPOSED_NEEDS.map((needItem) => {
                      const card = تقييم_احتياج_تخطيطي(needItem, filteredDossiers);
                      return (
                        <div key={card.معرف_الاحتياج} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 relative overflow-hidden">
                          {/* Priority Badge */}
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-black text-slate-500">{card.معرف_الاحتياج}</span>
                              <h5 className="font-black text-slate-900 text-sm">{card.اسم_الاحتياج_أو_المبادرة_المقترحة}</h5>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black shadow-xs ${
                              card.الأولوية_التخطيطية_المقترحة === 'أولوية تخطيطية قصوى' ? 'bg-amber-500 text-slate-950' :
                              card.الأولوية_التخطيطية_المقترحة === 'أولوية مرتفعة' ? 'bg-indigo-600 text-white' :
                              card.الأولوية_التخطيطية_المقترحة === 'دراسة إضافية مطلوبة' ? 'bg-rose-600 text-white' :
                              'bg-slate-300 text-slate-800'
                            }`}>
                              {card.الأولوية_التخطيطية_المقترحة} ({card.درجة_الأولوية_التخطيطية}/100)
                            </span>
                          </div>

                          {/* Location & Beneficiaries */}
                          <div className="grid grid-cols-3 gap-2 text-xs text-slate-700 bg-white border border-slate-200 p-2.5 rounded-xl font-bold">
                            <div>📍 **الموقع:** {card.المديرية} ({card.العزلة_أو_القرية})</div>
                            <div>🏗️ **القطاع:** {card.القطاع}</div>
                            <div>👥 **المستفيدون:** {card.عدد_المستفيدين.toLocaleString('ar-YE')} نسمة</div>
                          </div>

                          {/* Reasons & Needs */}
                          <div className="text-xs space-y-1">
                            <span className="font-black text-slate-900 block">أسباب الأولوية التخطيطية:</span>
                            <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                              {card.أسباب_الأولوية_التخطيطية.map((reason, rIdx) => (
                                <li key={rIdx}>{reason}</li>
                              ))}
                            </ul>
                          </div>

                          {/* 5 Paths Summary */}
                          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-[11px] space-y-1.5 text-indigo-950">
                            <span className="font-black block text-indigo-900 text-xs">🌐 التقييم الشامل بالمسارات الخمسة:</span>
                            <div className="grid grid-cols-2 gap-1.5 font-bold">
                              <div>📐 **الهندسي:** {card.المسارات_الخمسة.المسار_الهندسي.قابلية_التنفيذ}</div>
                              <div>📦 **المواد:** {card.المسارات_الخمسة.مسار_المواد.توفر_الأسمنت_والديزل}</div>
                              <div>🤝 **التحشيد:** مساهمة متوقعة {card.المسارات_الخمسة.مسار_التحشيد_المجتمعي.مستوى_المساهمة_المتوقع}%</div>
                              <div>📡 **المتابعة:** {card.المسارات_الخمسة.مسار_المتابعة_والاستدامة.إمكانية_المتابعة_الميدانية}</div>
                            </div>
                          </div>

                          {/* Past Knowledge & Warnings */}
                          {card.تحذيرات_المخاطر_التكرارية.length > 0 && (
                            <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-900 font-bold space-y-1">
                              <span>⚠️ تحذيرات من الخبرات السابقة:</span>
                              <div className="text-[11px] font-medium text-rose-800">{card.تحذيرات_المخاطر_التكرارية.join(' | ')}</div>
                            </div>
                          )}

                          {/* Planning Recommendation */}
                          <div className="bg-purple-900 text-white rounded-xl p-3 text-xs space-y-1">
                            <span className="font-black text-amber-300 block">💡 التوصية التخطيطية للقيادة:</span>
                            <p className="font-medium text-slate-100 leading-relaxed">{card.التوصية_التخطيطية}</p>
                          </div>

                          {/* Mandatory Disclaimer */}
                          <div className="text-[10px] text-slate-500 font-bold text-center border-t border-slate-200 pt-1.5">
                            {card.تنويه_الاعتماد}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. FUTURE PLANNING DIRECTIVES */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-3">
                  <h4 className="font-black text-amber-400 text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    توجيهات التخطيط التنموي المستقبلي للمحافظة
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-200">
                    {planSummary.توجيه_التخطيط_المستقبلي.map((dir, idx) => (
                      <div key={idx} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-1">
                        <span className="text-amber-400 font-black text-sm block">توجيه #{idx + 1}</span>
                        <p className="font-medium text-slate-200 leading-relaxed">{dir}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 8: EXECUTIVE REPORTS GENERATOR */}
      {/* ========================================================================= */}
      {commandTab === 'executive_reports' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-teal-100 text-teal-800 rounded-2xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">مركز التقارير القيادية الموحدة</h3>
                  <p className="text-xs text-slate-500">تقارير رسمية متكاملة ناتجة مباشرة من أصل قراءة الملف التنفيذي للمبادرات</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportInitiativesToExcel(initiatives)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير لـ Excel 📊</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة التقرير 🖨️</span>
                </button>
              </div>
            </div>

            {/* REPORT TYPE SELECTOR */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-bold">
              <button
                onClick={() => setSelectedReportType('simplified_executive')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedReportType === 'simplified_executive' ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/30' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                1. تقرير القيادة المبسط ⭐
              </button>

              <button
                onClick={() => setSelectedReportType('future_risk_report')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedReportType === 'future_risk_report' ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/30' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                2. تقرير المخاطر المستقبلية
              </button>

              <button
                onClick={() => setSelectedReportType('stagnation_report')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedReportType === 'stagnation_report' ? 'bg-purple-600 text-white border-purple-500 shadow-md ring-2 ring-purple-400/30' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                3. تقرير المبادرات المعرضة للتعثر
              </button>

              <button
                onClick={() => setSelectedReportType('resource_efficiency_report')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedReportType === 'resource_efficiency_report' ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-2 ring-amber-400/30' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                4. تقرير كفاءة استخدام الموارد
              </button>

              <button
                onClick={() => setSelectedReportType('fast_closure_report')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedReportType === 'fast_closure_report' ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/30' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                5. تقرير فرص الإغلاق السريع
              </button>

              <button
                onClick={() => setSelectedReportType('preventive_interventions_report')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedReportType === 'preventive_interventions_report' ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400/30' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                6. تقرير التدخلات الوقائية
              </button>

              <button
                onClick={() => setSelectedReportType('lessons_learned_report')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedReportType === 'lessons_learned_report' ? 'bg-purple-600 text-white border-purple-500 shadow-md ring-2 ring-purple-400/30' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                7. تقرير الدروس المستفادة 🎓
              </button>

              <button
                onClick={() => setSelectedReportType('stagnation_causes_report')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedReportType === 'stagnation_causes_report' ? 'bg-rose-700 text-white border-rose-600 shadow-md ring-2 ring-rose-400/30' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                8. تقرير أسباب التعثر 🔍
              </button>

              <button
                onClick={() => setSelectedReportType('success_factors_report')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedReportType === 'success_factors_report' ? 'bg-emerald-700 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/30' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                9. تقرير عوامل النجاح 🏆
              </button>

              <button
                onClick={() => setSelectedReportType('future_planning_report')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedReportType === 'future_planning_report' ? 'bg-cyan-700 text-white border-cyan-600 shadow-md ring-2 ring-cyan-400/30' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                10. تقرير تحسين التخطيط 🔮
              </button>

              <button
                onClick={() => setSelectedReportType('developmental_planning_report')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedReportType === 'developmental_planning_report' ? 'bg-indigo-800 text-white border-indigo-700 shadow-md ring-2 ring-indigo-500/30' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                11. تقرير التخطيط والاحتياجات 🧭
              </button>
            </div>

            {/* PRINTABLE REPORT PREVIEW CONTAINER */}
            <div className="bg-slate-50 border border-slate-300 rounded-3xl p-6 space-y-4 print:p-0 print:border-none">
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <h2 className="text-xl font-black text-slate-900">
                  {selectedReportType === 'simplified_executive' ? 'تقرير القيادة التنفيذية المبسط (الحالة + الإجراء الأول + الجهة المعنية)' :
                   selectedReportType === 'future_risk_report' ? 'تقرير المخاطر المستقبلية والتحليل التنبؤي' :
                   selectedReportType === 'stagnation_report' ? 'تقرير المبادرات المعرضة للتعثر والتوقف الميداني' :
                   selectedReportType === 'resource_efficiency_report' ? 'تقرير كفاءة استخدام الموارد والأسمنت الراكد بالموقع' :
                   selectedReportType === 'fast_closure_report' ? 'تقرير فرص الإغلاق السريع وحصد الإنجاز المكتمل' :
                   selectedReportType === 'preventive_interventions_report' ? 'تقرير التدخلات الوقائية الاستباقية للقيادة' :
                   selectedReportType === 'lessons_learned_report' ? 'تقرير الدروس المستفادة والتعلم المؤسسي' :
                   selectedReportType === 'stagnation_causes_report' ? 'تقرير تحليل أسباب التعثر السائدة بالمديريات' :
                   selectedReportType === 'success_factors_report' ? 'تقرير عوامل النجاح والممارسات الفضلى' :
                   'تقرير تحسين التخطيط المستقبلي والمبادرات القابلة للتكرار'}
                </h2>
                <p className="text-xs text-slate-600 font-bold">
                  محافظة إب - وحدة التدخلات المركزية التنموية الطارئة - تاريخ التقرير: {new Date().toLocaleDateString('ar-YE')}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-white font-black">
                    {selectedReportType === 'simplified_executive' ? (
                      <tr>
                        <th className="p-2.5">رقم المبادرة</th>
                        <th className="p-2.5">اسم المبادرة والمديرية</th>
                        <th className="p-2.5">الحالة التشغيلية</th>
                        <th className="p-2.5">الإجراء الأول المطلوب</th>
                        <th className="p-2.5">الجهة المعنية بالمعالجة</th>
                        <th className="p-2.5">أولوية التدخل التنبؤية</th>
                      </tr>
                    ) : selectedReportType === 'future_risk_report' ? (
                      <tr>
                        <th className="p-2.5">رقم المبادرة</th>
                        <th className="p-2.5">اسم المبادرة</th>
                        <th className="p-2.5">احتمالية التعثر</th>
                        <th className="p-2.5">أسباب المخاطر المستقلة</th>
                        <th className="p-2.5">التوجيه القيادي التنبؤي</th>
                        <th className="p-2.5">الجهة المكلفة</th>
                      </tr>
                    ) : selectedReportType === 'resource_efficiency_report' ? (
                      <tr>
                        <th className="p-2.5">رقم المبادرة</th>
                        <th className="p-2.5">اسم المبادرة</th>
                        <th className="p-2.5">نسبة الإنجاز</th>
                        <th className="p-2.5">الأسمنت الراكد</th>
                        <th className="p-2.5">تقييم الموارد التنبؤي</th>
                        <th className="p-2.5">الإجراء الوقائي</th>
                      </tr>
                    ) : selectedReportType === 'fast_closure_report' ? (
                      <tr>
                        <th className="p-2.5">رقم المبادرة</th>
                        <th className="p-2.5">اسم المبادرة</th>
                        <th className="p-2.5">نسبة الإنجاز</th>
                        <th className="p-2.5">زمن الإغلاق المتوقع</th>
                        <th className="p-2.5">الإجراء النهائي</th>
                        <th className="p-2.5">جاهزية الأرشيف</th>
                      </tr>
                    ) : selectedReportType === 'lessons_learned_report' ? (
                      <tr>
                        <th className="p-2.5">رقم المبادرة</th>
                        <th className="p-2.5">اسم المبادرة والمديرية</th>
                        <th className="p-2.5">المشكلة المرصودة</th>
                        <th className="p-2.5">السبب الجذري</th>
                        <th className="p-2.5">الإجراء والنتيجة</th>
                        <th className="p-2.5">التوصية المستقبلية للقيادة</th>
                      </tr>
                    ) : selectedReportType === 'stagnation_causes_report' ? (
                      <tr>
                        <th className="p-2.5">رقم المبادرة</th>
                        <th className="p-2.5">اسم المبادرة والمديرية</th>
                        <th className="p-2.5">حالة التعثر المرصودة</th>
                        <th className="p-2.5">المساهمات والأسمنت الراكد</th>
                        <th className="p-2.5">السبب الرئيسي للتعثر</th>
                        <th className="p-2.5">التوصية المؤسسية الوقائية</th>
                      </tr>
                    ) : selectedReportType === 'success_factors_report' ? (
                      <tr>
                        <th className="p-2.5">رقم المبادرة</th>
                        <th className="p-2.5">اسم المبادرة والمديرية</th>
                        <th className="p-2.5">نسبة الإنجاز</th>
                        <th className="p-2.5">المساهمة المجتمعية</th>
                        <th className="p-2.5">عامل النجاح الرئيسي</th>
                        <th className="p-2.5">الممارسة الفضلى المطبقة</th>
                      </tr>
                    ) : selectedReportType === 'future_planning_report' ? (
                      <tr>
                        <th className="p-2.5">رقم المبادرة</th>
                        <th className="p-2.5">اسم المبادرة والمديرية</th>
                        <th className="p-2.5">درجة صحة المبادرة</th>
                        <th className="p-2.5">الملكية والتنازلات</th>
                        <th className="p-2.5">قابليتها للتكرار النموذجي</th>
                        <th className="p-2.5">توصية التخطيط المستقبلي</th>
                      </tr>
                    ) : selectedReportType === 'developmental_planning_report' ? (
                      <tr>
                        <th className="p-2.5">معرف الاحتياج</th>
                        <th className="p-2.5">المشروع / الاحتياج والمديرية</th>
                        <th className="p-2.5">القطاع والقرية</th>
                        <th className="p-2.5">المستفيدون والجاهزية</th>
                        <th className="p-2.5">الأولوية التخطيطية المقترحة</th>
                        <th className="p-2.5">توصية التخطيط والتنويه</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="p-2.5">رقم المبادرة</th>
                        <th className="p-2.5">اسم المبادرة والمديرية</th>
                        <th className="p-2.5">الحالة</th>
                        <th className="p-2.5">الإجراء المطلوب</th>
                        <th className="p-2.5">الجهة المعنية</th>
                        <th className="p-2.5">الأولوية</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-medium">
                    {filteredDossiers.map((dos) => {
                      const pred = تحليل_التنبؤ_التنموي(dos);
                      const topAction = dos.الإجراءات[0];

                      if (selectedReportType === 'simplified_executive') {
                        return (
                          <tr key={dos.هوية_المبادرة.رقم_المبادرة} className="hover:bg-slate-100/80">
                            <td className="p-2.5 font-mono font-bold text-slate-900">{dos.هوية_المبادرة.رقم_المبادرة}</td>
                            <td className="p-2.5 font-bold text-slate-900">{dos.هوية_المبادرة.اسم_المبادرة} ({dos.هوية_المبادرة.المديرية})</td>
                            <td className="p-2.5 font-bold">
                              <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                                {dos.التحليل.الحالة_التشغيلية} ({dos.التحليل.نسبة_الإنجاز}%)
                              </span>
                            </td>
                            <td className="p-2.5 font-bold text-emerald-900 max-w-xs">{topAction?.العنوان || 'متابعة الرصف الحجري والالتزام بجدول العمل'}</td>
                            <td className="p-2.5 font-bold text-indigo-900">{topAction?.الجهة_المسؤولة || 'مدير المديرية ورئيس الجمعية'}</td>
                            <td className="p-2.5 font-black">
                              <span className={`px-2 py-0.5 rounded-md ${
                                pred.أولوية_التدخل_المبكر === 'تدخل عاجل' ? 'bg-rose-100 text-rose-800' :
                                pred.أولوية_التدخل_المبكر === 'تدخل قريب' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {pred.أولوية_التدخل_المبكر}
                              </span>
                            </td>
                          </tr>
                        );
                      }

                      if (selectedReportType === 'future_risk_report') {
                        return (
                          <tr key={dos.هوية_المبادرة.رقم_المبادرة} className="hover:bg-slate-100/80">
                            <td className="p-2.5 font-mono font-bold">{dos.هوية_المبادرة.رقم_المبادرة}</td>
                            <td className="p-2.5 font-bold">{dos.هوية_المبادرة.اسم_المبادرة}</td>
                            <td className="p-2.5 font-black">
                              <span className={`px-2 py-0.5 rounded-md ${
                                pred.احتمالية_التعثر === 'حرجة' ? 'bg-rose-600 text-white' :
                                pred.احتمالية_التعثر === 'مرتفع' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-800'
                              }`}>
                                {pred.احتمالية_التعثر}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-700 max-w-xs">{pred.أسباب_احتمالية_التعثر.join(' ، ')}</td>
                            <td className="p-2.5 font-bold text-indigo-900">{pred.توصية_التدخل_الاستباقي}</td>
                            <td className="p-2.5 font-bold">{pred.الجهة_المكلفة_بالتدخل}</td>
                          </tr>
                        );
                      }

                      if (selectedReportType === 'resource_efficiency_report') {
                        return (
                          <tr key={dos.هوية_المبادرة.رقم_المبادرة} className="hover:bg-slate-100/80">
                            <td className="p-2.5 font-mono font-bold">{dos.هوية_المبادرة.رقم_المبادرة}</td>
                            <td className="p-2.5 font-bold">{dos.هوية_المبادرة.اسم_المبادرة}</td>
                            <td className="p-2.5 font-bold">{dos.التحليل.نسبة_الإنجاز}%</td>
                            <td className="p-2.5 font-mono font-bold text-amber-900">{dos.المواد.الإسمنت.المتبقي_لدى_المبادرة} كيس</td>
                            <td className="p-2.5 font-bold">{pred.كفاءة_توزيع_الموارد}</td>
                            <td className="p-2.5 text-slate-800">{pred.تفاصيل_الموارد_التنبؤية}</td>
                          </tr>
                        );
                      }

                      if (selectedReportType === 'fast_closure_report') {
                        return (
                          <tr key={dos.هوية_المبادرة.رقم_المبادرة} className="hover:bg-slate-100/80">
                            <td className="p-2.5 font-mono font-bold">{dos.هوية_المبادرة.رقم_المبادرة}</td>
                            <td className="p-2.5 font-bold">{dos.هوية_المبادرة.اسم_المبادرة}</td>
                            <td className="p-2.5 font-bold text-emerald-800">{dos.التحليل.نسبة_الإنجاز}%</td>
                            <td className="p-2.5 font-bold">{pred.زمن_الإغلاق_المتوقع}</td>
                            <td className="p-2.5">إصدار محضر الاستلام النهائي وتوثيق الصور</td>
                            <td className="p-2.5">{dos.الوثائق.هل_جميع_الوثائق_مكتملة === 'نعم' ? 'مكتملة 100%' : 'ينقصها بعض الوثائق'}</td>
                          </tr>
                        );
                      }

                      if (selectedReportType === 'lessons_learned_report') {
                        const lesson = dos.الدروس_المستفادة?.[0];
                        return (
                          <tr key={dos.هوية_المبادرة.رقم_المبادرة} className="hover:bg-slate-100/80">
                            <td className="p-2.5 font-mono font-bold">{dos.هوية_المبادرة.رقم_المبادرة}</td>
                            <td className="p-2.5 font-bold">{dos.هوية_المبادرة.اسم_المبادرة} ({dos.هوية_المبادرة.المديرية})</td>
                            <td className="p-2.5 font-bold text-rose-900">{lesson?.المشكلة || 'مبادرة مستقرة'}</td>
                            <td className="p-2.5 text-slate-700">{lesson?.سببها || 'التنسيق جاري'}</td>
                            <td className="p-2.5 font-bold text-indigo-900">{lesson?.الإجراء_المتخذ || dos.الإجراءات[0]?.العنوان}</td>
                            <td className="p-2.5 text-purple-900 font-bold">{lesson?.التوصية_المستقبلية || dos.التوصيات[0]}</td>
                          </tr>
                        );
                      }

                      if (selectedReportType === 'stagnation_causes_report') {
                        const isStagnant = dos.التحليل.الحالة_التشغيلية.includes('متوقفة') || dos.التحليل.الحالة_التشغيلية.includes('متعثرة');
                        return (
                          <tr key={dos.هوية_المبادرة.رقم_المبادرة} className="hover:bg-slate-100/80">
                            <td className="p-2.5 font-mono font-bold">{dos.هوية_المبادرة.رقم_المبادرة}</td>
                            <td className="p-2.5 font-bold">{dos.هوية_المبادرة.اسم_المبادرة} ({dos.هوية_المبادرة.المديرية})</td>
                            <td className="p-2.5 font-black">
                              <span className={`px-2 py-0.5 rounded-md ${isStagnant ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-800'}`}>
                                {dos.التحليل.الحالة_التشغيلية}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-800">مساهمة {dos.المجتمع.نسبة_المساهمة}% | راكد {dos.المواد.الإسمنت.المتبقي_لدى_المبادرة} كيس</td>
                            <td className="p-2.5 font-bold text-rose-950">{isStagnant ? 'توقف الحشد المجتمعي أو فتور الهمة' : 'لا يوجد تعثر حاد'}</td>
                            <td className="p-2.5 font-bold text-indigo-900">{isStagnant ? 'تفعيل لجنة المبادرة وتكثيف نوبات الصب (التنازلات مكتملة مسبقاً)' : 'متابعة جدول التنفيذ المعتمد'}</td>
                          </tr>
                        );
                      }

                      if (selectedReportType === 'success_factors_report') {
                        const isSuccess = dos.التحليل.نسبة_الإنجاز >= 75;
                        return (
                          <tr key={dos.هوية_المبادرة.رقم_المبادرة} className="hover:bg-slate-100/80">
                            <td className="p-2.5 font-mono font-bold">{dos.هوية_المبادرة.رقم_المبادرة}</td>
                            <td className="p-2.5 font-bold">{dos.هوية_المبادرة.اسم_المبادرة} ({dos.هوية_المبادرة.المديرية})</td>
                            <td className="p-2.5 font-black text-emerald-800">{dos.التحليل.نسبة_الإنجاز}%</td>
                            <td className="p-2.5 font-bold text-indigo-900">{dos.المجتمع.نسبة_المساهمة}% ({dos.المجتمع.المساهمة_المجتمعية.toLocaleString('ar-YE')} ريال)</td>
                            <td className="p-2.5 font-bold text-emerald-950">{isSuccess ? 'تلاحم مجتمعي مبكر وسرعة الصب الخرساني' : 'تقدم إنجاز معقول'}</td>
                            <td className="p-2.5 text-slate-800">التوثيق المباشر بالصور واستغلال الدفعات أولاً بأول</td>
                          </tr>
                        );
                      }

                      if (selectedReportType === 'future_planning_report') {
                        const kbItem = بناء_سجل_معرفة_المبادرة(dos);
                        return (
                          <tr key={dos.هوية_المبادرة.رقم_المبادرة} className="hover:bg-slate-100/80">
                            <td className="p-2.5 font-mono font-bold">{dos.هوية_المبادرة.رقم_المبادرة}</td>
                            <td className="p-2.5 font-bold">{dos.هوية_المبادرة.اسم_المبادرة} ({dos.هوية_المبادرة.المديرية})</td>
                            <td className="p-2.5 font-mono font-black text-indigo-900">{dos.المؤشرات.درجة_صحة_المبادرة}/100</td>
                            <td className="p-2.5 font-bold">{dos.هوية_المبادرة.حالة_الملكية_المجتمعية ? 'موثقة رسمياً' : 'قيد الاستكمال'}</td>
                            <td className="p-2.5 font-bold text-emerald-800">{kbItem.قابليتها_للنماذج_المكررة ? 'نعم - نموذج قابل للمحاكاة' : 'تحتاج معالجة مسار'}</td>
                            <td className="p-2.5 font-bold text-purple-900">{dos.التوصيات[0] || 'تضمين المبادرة بالدورة الخمسية القادمة'}</td>
                          </tr>
                        );
                      }

                      if (selectedReportType === 'developmental_planning_report') {
                        const needIdx = filteredDossiers.indexOf(dos);
                        const sampleNeed = SAMPLE_PROPOSED_NEEDS[needIdx % SAMPLE_PROPOSED_NEEDS.length];
                        const card = تقييم_احتياج_تخطيطي(sampleNeed, filteredDossiers);

                        return (
                          <tr key={dos.هوية_المبادرة.رقم_المبادرة} className="hover:bg-slate-100/80">
                            <td className="p-2.5 font-mono font-bold">{card.معرف_الاحتياج}</td>
                            <td className="p-2.5 font-bold">{card.اسم_الاحتياج_أو_المبادرة_المقترحة} ({card.المديرية})</td>
                            <td className="p-2.5 font-bold">{card.القطاع} | {card.العزلة_أو_القرية}</td>
                            <td className="p-2.5 font-bold text-indigo-900">{card.عدد_المستفيدين.toLocaleString('ar-YE')} نسمة ({card.المسارات_الخمسة.المسار_الهندسي.قابلية_التنفيذ})</td>
                            <td className="p-2.5 font-black text-amber-900">{card.الأولوية_التخطيطية_المقترحة} ({card.درجة_الأولوية_التخطيطية}/100)</td>
                            <td className="p-2.5 text-xs text-slate-800">{card.التوصية_التخطيطية}</td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={dos.هوية_المبادرة.رقم_المبادرة} className="hover:bg-slate-100/80">
                          <td className="p-2.5 font-mono font-bold">{dos.هوية_المبادرة.رقم_المبادرة}</td>
                          <td className="p-2.5 font-bold">{dos.هوية_المبادرة.اسم_المبادرة} ({dos.هوية_المبادرة.المديرية})</td>
                          <td className="p-2.5">{dos.التحليل.الحالة_التشغيلية}</td>
                          <td className="p-2.5 font-bold">{topAction?.العنوان || dos.التوصيات[0]}</td>
                          <td className="p-2.5">{topAction?.الجهة_المسؤولة || 'وحدة التدخلات'}</td>
                          <td className="p-2.5 font-bold">{pred.أولوية_التدخل_المبكر}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW / EDIT ACTION MODAL */}
      {/* ========================================================================= */}
      {showActionModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn text-right" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">
                {editingAction ? 'تعديل التكليف والإجراء التنفيذي' : 'إصدار تكليف وإجراء تنفيذي جديد (الإجراء_التنموي)'}
              </h3>
              <button
                onClick={() => setShowActionModal(false)}
                className="text-slate-400 hover:text-slate-600 font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAction} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">المبادرة التنموية المعنية:</label>
                <select
                  value={formInitiativeId}
                  onChange={(e) => {
                    setFormInitiativeId(e.target.value);
                    const found = initiatives.find(i => i.id === e.target.value);
                    if (found) {
                      const dossier = إنشاء_الملف_التنفيذي_للمبادرة(found);
                      setFormRequiredAction(dossier.الإجراءات[0]?.العنوان || 'متابعة تنفيذ الرصف وتأمين المستودع');
                      setFormResponsibleEntity(dossier.الإجراءات[0]?.الجهة_المسؤولة || 'مدير المديرية ورئيس الجمعية');
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-900"
                >
                  {initiatives.map(i => (
                    <option key={i.id} value={i.id}>
                      [{i.initiativeNumber || i.id}] {i.name} - ({i.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الإجراء المطلوب تنفيذه بالتفصيل:</label>
                <textarea
                  required
                  rows={3}
                  value={formRequiredAction}
                  onChange={(e) => setFormRequiredAction(e.target.value)}
                  placeholder="اكتب تفاصيل الإجراء المطلوب المباشر..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الجهة المسؤولة المباشرة:</label>
                  <input
                    type="text"
                    required
                    value={formResponsibleEntity}
                    onChange={(e) => setFormResponsibleEntity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">دور الجهة بالمشروع:</label>
                  <select
                    value={formResponsibleRole}
                    onChange={(e) => setFormResponsibleRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  >
                    <option value="district_director">مدير المديرية (السلطة المحلية)</option>
                    <option value="cooperative_association">رئيس الجمعية التعاونية</option>
                    <option value="development_knight">فارس التنمية التنموي</option>
                    <option value="engineer_inspector">المهندس والمراقب الفني</option>
                    <option value="central_unit">وحدة التدخلات والمشرف</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الأولوية القيادية:</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  >
                    <option value="critical">حرج للغاية 🚨</option>
                    <option value="high">أولوية عالية ⚠️</option>
                    <option value="medium">متوسط 🟡</option>
                    <option value="low">عادي 🟢</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">تاريخ الاستحقاق والإنجاز:</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ملاحظات والتوجيهات الإضافية:</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="ملاحظات توجيهية..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl cursor-pointer shadow-md"
                >
                  حفظ التكليف التنفيذي ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Executive Decision Modal */}
      <ExecutiveDecisionModal
        isOpen={!!activeDecisionInit}
        onClose={() => setActiveDecisionInit(null)}
        initiative={activeDecisionInit}
        initialActionType={activeDecisionAction}
        onExecuteDecision={(updatedInit, msg) => {
          if (onUpdateInitiative) onUpdateInitiative(updatedInit);
          setExecutiveSuccessMsg(msg);
          setTimeout(() => setExecutiveSuccessMsg(null), 5000);
        }}
      />
    </div>
  );
}
