/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Initiative, UserRole, ExecutiveDecisionData, FieldReport, Material } from '../types';
import { إنشاء_الملف_التنفيذي_للمبادرة } from '../utils/developmentDecisionEngine';
import { 
  AlertTriangle, CheckCircle2, Clock, MapPin, Trash2, ShieldAlert, 
  TrendingUp, Activity, FileText, Camera, Phone, PlusCircle, Scale,
  Building2, Users, HardHat, Fuel, Calendar, ExternalLink, MessageSquare,
  Sparkles, Layers, ChevronRight, X, ArrowUpRight, Check, Send
} from 'lucide-react';

interface ExecutiveInitiativeCardProps {
  initiative: Initiative;
  onSelect: (initiative: Initiative) => void;
  onDelete?: (id: string) => void;
  onNavigateTab?: (tab: string, initiativeId?: string) => void;
  onUpdateInitiative?: (updated: Initiative) => void;
  role?: UserRole | 'admin' | 'visitor';
  viewMode?: 'executive' | 'gallery';
  returnContextText?: string;
}

export default function ExecutiveInitiativeCard({
  initiative,
  onSelect,
  onDelete,
  onNavigateTab,
  onUpdateInitiative,
  role = 'admin',
  viewMode = 'executive',
  returnContextText
}: ExecutiveInitiativeCardProps) {
  // Modal states for Quick Actions
  const [activeModal, setActiveModal] = useState<
    'photo' | 'note' | 'visit' | 'report' | 'progress' | 'decision' | 'contact' | null
  >(null);

  // Quick Action Form Inputs
  const [quickProgress, setQuickProgress] = useState<number>(() => {
    const rate = Number(initiative.completionRate);
    return isNaN(rate) ? 0 : rate;
  });
  const [quickNote, setQuickNote] = useState<string>('');
  const [quickVisitDate, setQuickVisitDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quickVisitNotes, setQuickVisitNotes] = useState<string>('');
  const [quickVisitEngineer, setQuickVisitEngineer] = useState<string>('');
  const [quickDecisionTitle, setQuickDecisionTitle] = useState<string>('');
  const [quickDecisionReason, setQuickDecisionReason] = useState<string>('');
  const [quickDecisionEntity, setQuickDecisionEntity] = useState<string>('وحدة التدخلات والسلطة المحلية');
  const [quickContactPerson, setQuickContactPerson] = useState<string>('');
  const [quickContactSummary, setQuickContactSummary] = useState<string>('');
  const [quickPhotoUrl, setQuickPhotoUrl] = useState<string>('');
  const [quickPhotoCaption, setQuickPhotoCaption] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Calculate Health Score (0 - 100)
  const healthData = calculateHealthScore(initiative);

  // 2. Extract Days since last visit / report
  const lastVisitDateStr = (initiative.reports && initiative.reports.length > 0)
    ? initiative.reports[0].date
    : (initiative.startDate || initiative.createdAt || 'غير محدد');

  const daysSinceVisit = calculateDaysElapsed(lastVisitDateStr);

  // 3. Extract Materials & Fuels summary
  const materialsSummary = getMaterialsSummary(initiative);

  // 4. Determine Alert Reason ("سبب التنبيه")
  const alertReason = getAlertReason(initiative, daysSinceVisit, materialsSummary);

  // 5. Generate Dynamic Executive Summary ("ملخص القيادة")
  const execSummaryText = generateExecutiveSummaryText(initiative, daysSinceVisit, materialsSummary, healthData.score);

  // 6. Action Needed Statement
  const actionNeeded = getActionNeededText(initiative);

  // 7. Phase Description
  const phaseInfo = getPhaseInfo(initiative.completionRate || 0);

  // 8. Beneficiaries calculation
  const beneficiariesCount = initiative.beneficiaries || Math.round((initiative.cost || 5000000) / 2500);

  // ---------------- Quick Action Handlers ----------------

  const handleSaveProgress = () => {
    if (!onUpdateInitiative) {
      showToast('تم تحديث نسبة الإنجاز محلياً');
      setActiveModal(null);
      return;
    }
    const updated = {
      ...initiative,
      completionRate: quickProgress,
      updatedAt: new Date().toISOString()
    };
    onUpdateInitiative(updated);
    showToast(`🎉 تم تحديث نسبة الإنجاز بنجاح إلى ${quickProgress}%`);
    setActiveModal(null);
  };

  const handleSaveNote = () => {
    if (!quickNote.trim()) return;
    const noteText = `[ملاحظة قيادية - ${role === 'admin' ? 'مستشار القادة' : 'متابع ميداني'}]: ${quickNote}`;
    const updated = {
      ...initiative,
      notes: `${noteText}\n${initiative.notes || ''}`.trim(),
      updatedAt: new Date().toISOString()
    };
    if (onUpdateInitiative) onUpdateInitiative(updated);
    showToast('📝 تم تسجيل الملاحظة القيادية بنجاح');
    setQuickNote('');
    setActiveModal(null);
  };

  const handleSaveVisit = () => {
    const newReport: FieldReport = {
      id: `vr-${Date.now()}`,
      title: `زيارة تقييم ميداني (${quickVisitDate})`,
      date: quickVisitDate,
      description: quickVisitNotes || 'زيارة ميدانية سريعة لمتابعة موقع المبادرة',
      isMatchedWithDeskReview: true,
      status: 'approved',
      achievements: [quickVisitNotes || 'متابعة الأعمال الإنشائية'],
      challenges: []
    };
    const updatedReports = [newReport, ...(initiative.reports || [])];
    const updated = {
      ...initiative,
      reports: updatedReports,
      updatedAt: new Date().toISOString()
    };
    if (onUpdateInitiative) onUpdateInitiative(updated);
    showToast('📍 تم تسجيل الزيارة الميدانية وتحديث التاريخ بنجاح');
    setQuickVisitNotes('');
    setQuickVisitEngineer('');
    setActiveModal(null);
  };

  const handleSaveDecision = () => {
    if (!quickDecisionTitle.trim()) return;
    const newDecision: ExecutiveDecisionData = {
      requiredAction: quickDecisionTitle,
      interventionPriority: quickDecisionReason.includes('عاجل') ? 'urgent' : 'medium',
      responsibleEntity: quickDecisionEntity,
      nextFollowUpDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      decisionMaker: role === 'admin' ? 'مستشار القادة' : 'وحدة التدخلات',
      decisionDate: new Date().toISOString().split('T')[0],
      executionStatus: 'in_execution',
      actionNotes: quickDecisionReason
    };
    const updated = {
      ...initiative,
      executiveDecision: newDecision,
      status: initiative.status === 'stagnant' ? 'pending' : initiative.status,
      updatedAt: new Date().toISOString()
    };
    if (onUpdateInitiative) onUpdateInitiative(updated);
    showToast('⚖ تم إقرار واعتماد القرار التنفيذي بنجاح');
    setQuickDecisionTitle('');
    setQuickDecisionReason('');
    setActiveModal(null);
  };

  const handleSavePhoto = () => {
    const photoItem = quickPhotoUrl.trim() || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&q=80&w=800';
    const newReport: FieldReport = {
      id: `img-${Date.now()}`,
      title: quickPhotoCaption || 'توثيق مصور للمبادرة',
      date: new Date().toISOString().split('T')[0],
      description: quickPhotoCaption || 'صورة توثيق ميداني',
      isMatchedWithDeskReview: true,
      status: 'approved',
      achievements: ['توثيق مصور بالهاتف الميداني'],
      challenges: [],
      imagePlaceholder: photoItem
    };
    const updated = {
      ...initiative,
      reports: [newReport, ...(initiative.reports || [])],
      updatedAt: new Date().toISOString()
    };
    if (onUpdateInitiative) onUpdateInitiative(updated);
    showToast('📸 تم توثيق وإضافة الصورة الميدانية للمبادرة');
    setQuickPhotoUrl('');
    setQuickPhotoCaption('');
    setActiveModal(null);
  };

  const handleSaveContact = () => {
    if (!quickContactPerson.trim()) return;
    const contactNote = `[تواصل هاتف/ميداني مع: ${quickContactPerson}] - ${quickContactSummary}`;
    const updated = {
      ...initiative,
      notes: `${contactNote}\n${initiative.notes || ''}`.trim(),
      updatedAt: new Date().toISOString()
    };
    if (onUpdateInitiative) onUpdateInitiative(updated);
    showToast('📞 تم توثيق التواصل التنفيذي المباشر بنجاح');
    setQuickContactPerson('');
    setQuickContactSummary('');
    setActiveModal(null);
  };

  const handleQuickReport = () => {
    if (onNavigateTab) {
      onNavigateTab('periodic_reports', initiative.id);
    } else {
      onSelect(initiative);
    }
  };

  return (
    <div 
      className="bg-white border border-slate-200/90 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden text-slate-900 relative group"
      id={`executive-card-${initiative.id}`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-emerald-300 border border-emerald-500/40 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 🔴 Top Decorative Accent Bar */}
      <div 
        className={`h-1.5 w-full ${
          healthData.score >= 90 ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600' :
          healthData.score >= 70 ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-600' :
          healthData.score >= 50 ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-600' :
          'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700'
        }`}
      />

      {/* ========================================================================= */}
      {/* أولاً: رأس البطاقة التنفيذي (EXECUTIVE HEADER)                            */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white p-4 md:p-5 space-y-3 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 relative z-10">
          
          {/* Title & Geographic Metadata */}
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              {/* ID Badge */}
              <span className="font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-md">
                {initiative.initiativeNumber || `IMP-${initiative.id.substring(0, 5)}`}
              </span>

              {/* Sector Tag */}
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2.5 py-0.5 rounded-full font-bold">
                🏗 {initiative.sector || 'طرقات ورصف'}
              </span>

              {/* Status Badge */}
              <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] border ${
                initiative.status === 'stagnant' ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse' :
                initiative.status === 'stopped' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                initiative.status === 'completed' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                'bg-blue-950 text-blue-300 border-blue-800'
              }`}>
                {initiative.status === 'stagnant' ? '🔴 متعثرة ميدانياً' :
                 initiative.status === 'stopped' ? '🟠 متوقفة بقرار' :
                 initiative.status === 'completed' ? '🟢 مكتملة 100%' : '🔵 جارية وقيد التنفيذ'}
              </span>

              {/* Priority Tag */}
              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                initiative.status === 'stagnant' || initiative.completionRate < 25 ? 'bg-rose-900/60 text-rose-200 border border-rose-700' :
                initiative.completionRate < 60 ? 'bg-amber-900/60 text-amber-200 border border-amber-700' :
                'bg-slate-800 text-slate-300'
              }`}>
                {initiative.status === 'stagnant' ? '🔥 أولوية قصوى' : initiative.completionRate < 60 ? '⚡ أولوية متوسطة' : '🟢 أولوية اعتيادية'}
              </span>

              {/* Delete button for Admin */}
              {role !== 'visitor' && onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`هل أنت متأكد من حذف مبادرة "${initiative.name}" نهائياً؟`)) {
                      onDelete(initiative.id);
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-rose-950/50 transition-colors mr-auto cursor-pointer"
                  title="حذف المبادرة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Initiative Name */}
            <h3 
              onClick={() => onSelect(initiative)}
              className="font-black text-white text-base md:text-lg lg:text-xl hover:text-emerald-400 cursor-pointer transition-colors leading-snug tracking-wide flex items-center gap-2 group-hover:translate-x-1 transition-transform"
            >
              <span>{initiative.name}</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>

            {/* Location hierarchy */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium flex-wrap pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold text-white">{initiative.governorate}</span>
              <span>•</span>
              <span>مديرية {initiative.district}</span>
              {initiative.subDistrict && (
                <>
                  <span>•</span>
                  <span>عزلة {initiative.subDistrict}</span>
                </>
              )}
              {initiative.village && (
                <>
                  <span>•</span>
                  <span>قرية {initiative.village}</span>
                </>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ثالثاً: مؤشر صحة المبادرة (HEALTH SCORE BADGE)                             */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-3 bg-slate-950/90 border border-slate-800 p-2.5 rounded-2xl shrink-0 self-start lg:self-center">
            <div className={`relative flex items-center justify-center w-14 h-14 rounded-2xl border-2 font-black ${healthData.borderColor} bg-slate-900 shadow-inner`}>
              <div className="text-center">
                <span className={`text-lg font-black block font-mono leading-none ${healthData.textClass}`}>
                  {healthData.score}
                </span>
                <span className="text-[8px] text-slate-400 block mt-0.5">من 100</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">مؤشر صحة المبادرة</span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-md border inline-block ${healthData.badgeBg}`}>
                {healthData.label}
              </span>
              <span className="text-[9.5px] text-slate-400 block font-mono">
                {daysSinceVisit === 0 ? 'محدث اليوم' : `آخر متابعة: منذ ${daysSinceVisit} يوم`}
              </span>
            </div>
          </div>
        </div>

        {/* Executive Header Metadata Bar (المسؤول، القرار المطلوب، تاريخ التحديث) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-3 border-t border-slate-800/80 font-medium">
          <div className="flex items-center gap-1.5 text-slate-300">
            <HardHat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400">المسؤول الحالي:</span>
            <span className="font-bold text-white truncate">
              {initiative.executiveDecision?.responsibleEntity || initiative.committee?.find(c => c.role === 'leader' || c.role === 'knight')?.name || 'مهندس المنطقة واللجنة'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400">تاريخ التحديث:</span>
            <span className="font-bold text-white font-mono">
              {lastVisitDateStr} ({daysSinceVisit} يوم)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 sm:justify-end">
            <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-slate-400">ملاحظات وتقارير:</span>
            <span className="font-bold text-emerald-300">
              {(initiative.reports?.length || 0) + (initiative.notes ? 1 : 0)} مدونات
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* سادساً: سبب ظهور المبادرة / سبب التنبيه (ALERT CALLOUT)                     */}
      {/* ========================================================================= */}
      {alertReason && (
        <div className="bg-amber-50/90 border-y border-amber-200/90 px-4 py-2.5 flex items-center justify-between gap-3 text-amber-950">
          <div className="flex items-center gap-2 text-xs font-bold">
            <div className="p-1 bg-amber-500 text-white rounded-lg shrink-0 shadow-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-black text-amber-900 ml-1.5">⚡ سبب التنبيه القيادي:</span>
              <span className="text-amber-800 font-semibold">{alertReason}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveModal('decision')}
            className="text-[10.5px] font-black bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            معالجة سريعة ←
          </button>
        </div>
      )}

      <div className="p-4 md:p-5 space-y-4">

        {/* ========================================================================= */}
        {/* ثانياً: ملخص القيادة (EXECUTIVE SUMMARY CARD)                             */}
        {/* ========================================================================= */}
        <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>ملخص القيادة (تحليل القراءة التنموية):</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              تحديث تلقائي
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-semibold">
            {execSummaryText}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* رابعاً: تطوير قسم الإنجاز (ADVANCED PROGRESS & PHASE)                       */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="text-slate-700">📈 نسبة الإنجاز الميداني:</span>
              <span className={`text-sm font-black font-mono px-2 py-0.5 rounded-md ${
                initiative.completionRate >= 70 ? 'bg-emerald-100 text-emerald-800' :
                initiative.completionRate >= 35 ? 'bg-amber-100 text-amber-800' :
                'bg-rose-100 text-rose-800'
              }`}>
                {initiative.completionRate}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                {phaseInfo.label}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60 relative">
            <div
              className={`h-full rounded-full transition-all duration-500 shadow-xs ${phaseInfo.colorClass}`}
              style={{ width: `${Math.max(3, initiative.completionRate)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10.5px] text-slate-500 font-medium">
            <span>0% (بدء العمل)</span>
            <span>50% (نصف الإنجاز)</span>
            <span>100% (تسليم نهائي)</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* خامساً: بطاقة القرار التنفيذي (EXECUTIVE DECISION CARD)                    */}
        {/* ========================================================================= */}
        <div className="bg-slate-900/95 text-white border border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-amber-400">
              <Scale className="w-4 h-4" />
              <span>القرار التنفيذي الحالي:</span>
            </div>

            {initiative.executiveDecision ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                initiative.executiveDecision.executionStatus === 'executed' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                initiative.executiveDecision.executionStatus === 'pending_execution' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                'bg-blue-950 text-blue-300 border-blue-800'
              }`}>
                {initiative.executiveDecision.executionStatus === 'executed' ? 'مكتمل ومستلم' :
                 initiative.executiveDecision.executionStatus === 'pending_execution' ? 'قيد التنفيذ والمتابعة' : 'جارٍ التنفيذ بالمسار'}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setActiveModal('decision')}
                className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-md hover:bg-amber-900 transition-colors cursor-pointer"
              >
                + إصدار قرار جديد
              </button>
            )}
          </div>

          {initiative.executiveDecision && initiative.executiveDecision.requiredAction ? (
            <div className="space-y-2 text-xs border-t border-slate-800 pt-2 font-medium">
              <p className="text-white font-extrabold text-sm leading-snug">
                "{initiative.executiveDecision.requiredAction}"
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">سبب/مبرر القرار وملاحظاته:</span>
                  <span className="font-semibold text-slate-200">{initiative.executiveDecision.actionNotes || 'توجيه تنفيذي معتمد'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">الجهة المسؤولة والموعد:</span>
                  <span className="font-semibold text-amber-300">
                    {initiative.executiveDecision.responsibleEntity} (تاريخ: {initiative.executiveDecision.decisionDate || 'غير محدد'})
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-medium py-1 text-center bg-slate-950/50 rounded-lg border border-slate-800/80">
              لا يوجد قرار تنفيذي مسجل حتى الآن لهذه المبادرة.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* سابعاً: لوحة معلومات مختصرة (MICRO KPI DASHBOARD GRID - 8 TILES)          */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {/* Tile 1: Cost */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 block">💰 التكلفة الكلية</span>
            <span className="font-black text-slate-900 text-xs block font-mono">
              {((initiative.cost || (initiative.communityContribution + initiative.unitContribution)) || 0).toLocaleString()} <span className="text-[10px] text-slate-600 font-normal">ريال</span>
            </span>
          </div>

          {/* Tile 2: Beneficiaries */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 block">👥 المستفيدون</span>
            <span className="font-black text-emerald-800 text-xs block font-mono">
              {beneficiariesCount.toLocaleString()} <span className="text-[10px] text-slate-600 font-normal">نسمة</span>
            </span>
          </div>

          {/* Tile 3: Cement */}
          <div className={`border rounded-xl p-2.5 space-y-0.5 ${materialsSummary.cementOverDisbursed ? 'bg-amber-50/90 border-amber-300' : 'bg-slate-50 border-slate-200/80'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 block">🧱 الأسمنت (عهدة/منصرف)</span>
              {materialsSummary.cementOverDisbursed && (
                <span className="text-[9px] font-black bg-amber-200 text-amber-900 px-1 py-0.2 rounded" title="صرف إسمنت فوق المعتمد">
                  ⚠️ فوق المعتمد
                </span>
              )}
            </div>
            <span className="font-black text-amber-800 text-xs block font-mono truncate" title="المتبقي لدى المبادرة (العهدة الميدانية) / المصروف">
              {materialsSummary.cementRemaining} / {materialsSummary.cementDisbursed}
            </span>
          </div>

          {/* Tile 4: Diesel */}
          <div className={`border rounded-xl p-2.5 space-y-0.5 ${materialsSummary.dieselOverDisbursed ? 'bg-amber-50/90 border-amber-300' : 'bg-slate-50 border-slate-200/80'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 block">⛽ الديزل (عهدة/منصرف)</span>
              {materialsSummary.dieselOverDisbursed && (
                <span className="text-[9px] font-black bg-amber-200 text-amber-900 px-1 py-0.2 rounded" title="صرف ديزل فوق المعتمد">
                  ⚠️ فوق المعتمد
                </span>
              )}
            </div>
            <span className="font-black text-sky-800 text-xs block font-mono truncate" title="المتبقي لدى المبادرة (العهدة الميدانية) / المصروف">
              {materialsSummary.dieselRemaining} / {materialsSummary.dieselDisbursed}
            </span>
          </div>

          {/* Tile 5: Last Visit */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 block">📅 آخر زيارة</span>
            <span className="font-black text-slate-900 text-xs block font-mono">
              {daysSinceVisit === 0 ? 'اليوم' : `منذ ${daysSinceVisit} يوم`}
            </span>
          </div>

          {/* Tile 6: Location */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 block">📍 المديرية</span>
            <span className="font-black text-slate-900 text-xs block truncate">
              {initiative.district}
            </span>
          </div>

          {/* Tile 7: Sector */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 block">🏗 القطاع</span>
            <span className="font-black text-indigo-900 text-xs block truncate">
              {initiative.sector || 'طرقات ورصف'}
            </span>
          </div>

          {/* Tile 8: Completion Rate */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 block">📈 الإنجاز الميداني</span>
            <span className="font-black text-emerald-700 text-xs block font-mono">
              {initiative.completionRate}%
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* تاسعاً: الإجراءات السريعة (QUICK ACTIONS BAR)                             */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 text-white rounded-xl p-3 space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-300">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>الإجراءات السريعة المباشرة (Quick Actions):</span>
            </span>
            <span className="text-[9.5px] text-slate-400">تنفيذ دون مغادرة الصفحة</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setActiveModal('photo')}
              className="py-2 px-1.5 bg-slate-800 hover:bg-emerald-900 text-slate-200 hover:text-emerald-200 rounded-lg transition-all flex flex-col items-center justify-center gap-1 border border-slate-700 cursor-pointer"
              title="رفع توثيق مصور للمبادرة"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>📸 رفع صور</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('note')}
              className="py-2 px-1.5 bg-slate-800 hover:bg-sky-900 text-slate-200 hover:text-sky-200 rounded-lg transition-all flex flex-col items-center justify-center gap-1 border border-slate-700 cursor-pointer"
              title="إضافة مدونة أو ملاحظة قيادية"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>📝 ملاحظة</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('visit')}
              className="py-2 px-1.5 bg-slate-800 hover:bg-amber-900 text-slate-200 hover:text-amber-200 rounded-lg transition-all flex flex-col items-center justify-center gap-1 border border-slate-700 cursor-pointer"
              title="تسجيل زيارة وتاريخ النزول الميداني"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>📍 تسجيل زيارة</span>
            </button>

            <button
              type="button"
              onClick={handleQuickReport}
              className="py-2 px-1.5 bg-slate-800 hover:bg-purple-900 text-slate-200 hover:text-purple-200 rounded-lg transition-all flex flex-col items-center justify-center gap-1 border border-slate-700 cursor-pointer"
              title="إصدار تقرير متابعة قيادي"
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>📄 تقرير</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('progress')}
              className="py-2 px-1.5 bg-slate-800 hover:bg-emerald-900 text-slate-200 hover:text-emerald-200 rounded-lg transition-all flex flex-col items-center justify-center gap-1 border border-slate-700 cursor-pointer"
              title="تحديث نسبة الإنجاز الفني"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>📈 نسبة الإنجاز</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('decision')}
              className="py-2 px-1.5 bg-slate-800 hover:bg-indigo-900 text-slate-200 hover:text-indigo-200 rounded-lg transition-all flex flex-col items-center justify-center gap-1 border border-slate-700 cursor-pointer"
              title="إصدار وتوثيق قرار تنفيذي"
            >
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              <span>⚖ إصدار قرار</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('contact')}
              className="py-2 px-1.5 bg-slate-800 hover:bg-teal-900 text-slate-200 hover:text-teal-200 rounded-lg transition-all flex flex-col items-center justify-center gap-1 border border-slate-700 cursor-pointer"
              title="توثيق تواصل وتنسيق مباشر"
            >
              <Phone className="w-3.5 h-3.5 text-teal-400" />
              <span>📞 تواصل</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ثامناً: تطوير أزرار التنقل (NAVIGATION BUTTONS & PORTAL SWITCHERS)          */}
        {/* ========================================================================= */}
        <div className="pt-2 border-t border-slate-200/80 space-y-2">
          {returnContextText && (
            <div className="text-[10px] text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-lg flex items-center justify-between">
              <span>📍 جهة الوصول: {returnContextText}</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-bold">
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => onSelect(initiative)}
              className="col-span-2 sm:col-span-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer border border-slate-900"
              title="فتح الملف التنفيذي الشامل للمبادرة بكافة أجزائه"
            >
              <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>📁 الملف التنفيذي</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateTab) onNavigateTab('engineers_portal', initiative.id);
                else onSelect(initiative);
              }}
              className="py-2.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-emerald-200/90"
              title="انتقال إلى بوابة التقييم والنزول الميداني المهندسين"
            >
              <HardHat className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>👷‍♂️ التقييم</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateTab) onNavigateTab('decision_center', initiative.id);
                else onSelect(initiative);
              }}
              className="py-2.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-indigo-200/90"
              title="انتقال إلى مركز اتخاذ القرار وإقرار التوصيات"
            >
              <Scale className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
              <span>🧠 القرار</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateTab) onNavigateTab('periodic_reports', initiative.id);
                else onSelect(initiative);
              }}
              className="py-2.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-amber-200/90"
              title="انتقال إلى بوابة التقارير الدورية وسجل الزيارات"
            >
              <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>🔍 المتابعة</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateTab) onNavigateTab('sheets_knights', initiative.id);
                else onSelect(initiative);
              }}
              className="py-2.5 px-2 bg-sky-50 hover:bg-sky-100 text-sky-900 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-sky-200/90"
              title="انتقال إلى مطابقة الشيت الفني وفرسان المبادرات"
            >
              <Activity className="w-3.5 h-3.5 text-sky-700 shrink-0" />
              <span>📊 الكميات</span>
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* QUICK ACTION INLINE MODALS                                                 */}
      {/* ========================================================================= */}

      {/* 1. Progress Modal */}
      {activeModal === 'progress' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 text-slate-900 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>تحديث نسبة الإنجاز الفني</span>
              </h4>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-3xl font-black text-emerald-700 font-mono">{quickProgress}%</span>
                <span className="block text-xs font-bold text-slate-600 mt-1">
                  {getPhaseInfo(quickProgress).label}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={isNaN(quickProgress) ? 0 : quickProgress}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setQuickProgress(isNaN(val) ? 0 : val);
                }}
                className="w-full accent-emerald-600 cursor-pointer h-2"
              />

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveProgress}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold cursor-pointer shadow-md"
                >
                  حفظ التحديث
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Executive Note Modal */}
      {activeModal === 'note' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 text-slate-900 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <span>إضافة ملاحظة قيادية</span>
              </h4>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <textarea
                rows={4}
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder="أدخل الملاحظة أو التوجيه الميداني السريع..."
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-medium"
              />

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-extrabold cursor-pointer shadow-md"
                >
                  تسجيل الملاحظة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Decision Modal */}
      {activeModal === 'decision' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-slate-200 text-slate-900 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                <span>إصدار وتوثيق قرار تنفيذي</span>
              </h4>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">القرار التنفيذي المعتمد *</label>
                <input
                  type="text"
                  value={quickDecisionTitle}
                  onChange={(e) => setQuickDecisionTitle(e.target.value)}
                  placeholder="مثال: استكمال أعمال الرصف وصرف الدفعة الثانية خلال 10 أيام"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">المبرر / السبب التنفيذي</label>
                <input
                  type="text"
                  value={quickDecisionReason}
                  onChange={(e) => setQuickDecisionReason(e.target.value)}
                  placeholder="مثال: جاهزية الموقع واكتمال مطابقة المواد الميدانية"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الجهة المسؤولة والمتابعة</label>
                <input
                  type="text"
                  value={quickDecisionEntity}
                  onChange={(e) => setQuickDecisionEntity(e.target.value)}
                  placeholder="السلطة المحلية بـ مديرية + وحدة التدخلات"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveDecision}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold cursor-pointer shadow-md"
                >
                  إقرار واعتماد القرار
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Log Visit Modal */}
      {activeModal === 'visit' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 text-slate-900 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" />
                <span>تسجيل زيارة ميدانية</span>
              </h4>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">تاريخ النزول الميداني *</label>
                <input
                  type="date"
                  value={quickVisitDate}
                  onChange={(e) => setQuickVisitDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">المهندس / المتابع الميداني</label>
                <input
                  type="text"
                  value={quickVisitEngineer}
                  onChange={(e) => setQuickVisitEngineer(e.target.value)}
                  placeholder="اسم المهندس أو ضابط النزول"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ملاحظات ونتائج الزيارة</label>
                <textarea
                  rows={3}
                  value={quickVisitNotes}
                  onChange={(e) => setQuickVisitNotes(e.target.value)}
                  placeholder="ملخص حالة العمل والموقع أثناء النزول..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveVisit}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold cursor-pointer shadow-md"
                >
                  حفظ وتحديث تاريخ النزول
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Photo Upload Modal */}
      {activeModal === 'photo' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 text-slate-900 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                <span>توثيق ميداني صور المبادرة</span>
              </h4>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">رابط الصورة (URL) أو اختيار عينة</label>
                <input
                  type="text"
                  value={quickPhotoUrl}
                  onChange={(e) => setQuickPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
                />
              </div>

              <div className="flex gap-2 text-[10px] text-slate-500">
                <span>عينة سريعة:</span>
                <button 
                  type="button" 
                  onClick={() => setQuickPhotoUrl('https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&q=80&w=800')} 
                  className="text-emerald-700 font-bold hover:underline"
                >
                  صورة شق وطرقات
                </button>
                <span>•</span>
                <button 
                  type="button" 
                  onClick={() => setQuickPhotoUrl('https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=800')} 
                  className="text-emerald-700 font-bold hover:underline"
                >
                  صورة رصف خرساني
                </button>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold cursor-pointer shadow-md"
                >
                  إضافة الصورة للمبادرة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Contact Logger Modal */}
      {activeModal === 'contact' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 text-slate-900 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Phone className="w-5 h-5 text-teal-600" />
                <span>تسجيل تواصل وتنسيق تنفيذي</span>
              </h4>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">الطرف المتواصل معه *</label>
                <input
                  type="text"
                  value={quickContactPerson}
                  onChange={(e) => setQuickContactPerson(e.target.value)}
                  placeholder="رئيس اللجان / مدير المديرية / مقاول المعدات"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ملخص فحوى المكالمة أو الاتفاق</label>
                <textarea
                  rows={3}
                  value={quickContactSummary}
                  onChange={(e) => setQuickContactSummary(e.target.value)}
                  placeholder="تم الاتفاق على بدء الشق وإعادة تفريغ المعدات يوم السبت القادم..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveContact}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold cursor-pointer shadow-md"
                >
                  توثيق التواصل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// =========================================================================
// HELPER CALCULATORS & GENERATORS
// =========================================================================

function calculateHealthScore(init: Initiative) {
  const dossier = إنشاء_الملف_التنفيذي_للمبادرة(init);
  const score = dossier.المؤشرات.درجة_صحة_المبادرة;

  if (score >= 90) {
    return {
      score,
      label: 'ممتاز 🟢',
      badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      textClass: 'text-emerald-400',
      borderColor: 'border-emerald-500'
    };
  } else if (score >= 70) {
    return {
      score,
      label: 'جيد 🔵',
      badgeBg: 'bg-blue-950 text-blue-300 border-blue-800',
      textClass: 'text-blue-400',
      borderColor: 'border-blue-500'
    };
  } else if (score >= 50) {
    return {
      score,
      label: 'يحتاج متابعة 🟡',
      badgeBg: 'bg-amber-950 text-amber-300 border-amber-800',
      textClass: 'text-amber-400',
      borderColor: 'border-amber-500'
    };
  } else {
    return {
      score,
      label: 'تدخل عاجل 🔴',
      badgeBg: 'bg-rose-950 text-rose-300 border-rose-800',
      textClass: 'text-rose-400',
      borderColor: 'border-rose-500'
    };
  }
}

function calculateDaysElapsed(dateStr?: string): number {
  if (!dateStr || dateStr === 'غير محدد') return 45;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 30;
    const diff = new Date().getTime() - d.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 3600 * 24)));
  } catch {
    return 30;
  }
}

function getMaterialsSummary(init: Initiative) {
  let cementApproved = init.materialsApproved;
  let cementDisbursed = init.materialsDisbursed;
  let cementRemaining = init.materialsRemaining;

  let dieselApproved = init.dieselApproved;
  let dieselDisbursed = init.dieselDisbursed;
  let dieselRemaining = init.dieselRemaining;

  const cementMat = init.materials?.find(m => 
    m.name.includes('أسمنت') || m.name.toLowerCase().includes('cement')
  );
  if (cementMat) {
    if (!cementApproved) cementApproved = `${cementMat.quantity} كيس`;
    if (cementMat.notes) {
      const notes = cementMat.notes;
      if (!cementDisbursed) cementDisbursed = notes.match(/منصرف:\s*([^|.]+)/)?.[1]?.trim();
      if (!cementRemaining) cementRemaining = notes.match(/متبقي:\s*([^|.]+)/)?.[1]?.trim();
    }
  }

  const dieselMat = init.materials?.find(m => 
    m.name.includes('ديزل') || m.name.toLowerCase().includes('diesel')
  );
  if (dieselMat) {
    if (!dieselApproved) dieselApproved = `${dieselMat.quantity} لتر`;
    if (dieselMat.notes) {
      const notes = dieselMat.notes;
      if (!dieselDisbursed) dieselDisbursed = notes.match(/منصرف:\s*([^|.]+)/)?.[1]?.trim();
      if (!dieselRemaining) dieselRemaining = notes.match(/متبقي:\s*([^|.]+)/)?.[1]?.trim();
    }
  }

  const parseNum = (val?: string | number): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const cleaned = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const cAppr = parseNum(cementApproved);
  const cDisb = parseNum(cementDisbursed);
  const cementOverDisbursed = cDisb > cAppr && cAppr > 0;
  const cementOverDisbursedQty = cementOverDisbursed ? (cDisb - cAppr) : 0;
  const cementOverDisbursedSignal = cementOverDisbursed ? 'صرف إسمنت فوق المعتمد' : null;

  const dAppr = parseNum(dieselApproved);
  const dDisb = parseNum(dieselDisbursed);
  const dieselOverDisbursed = dDisb > dAppr && dAppr > 0;
  const dieselOverDisbursedQty = dieselOverDisbursed ? (dDisb - dAppr) : 0;
  const dieselOverDisbursedSignal = dieselOverDisbursed ? 'صرف ديزل فوق المعتمد' : null;

  return {
    cementApproved: cementApproved || 'غير محدد',
    cementDisbursed: cementDisbursed || 'غير محدد',
    cementRemaining: cementRemaining || '0 كيس',
    cementOverDisbursed,
    cementOverDisbursedQty,
    cementOverDisbursedSignal,
    dieselApproved: dieselApproved || 'غير محدد',
    dieselDisbursed: dieselDisbursed || 'غير محدد',
    dieselRemaining: dieselRemaining || '0 لتر',
    dieselOverDisbursed,
    dieselOverDisbursedQty,
    dieselOverDisbursedSignal,
  };
}

function getAlertReason(init: Initiative, daysSinceVisit: number, materials: ReturnType<typeof getMaterialsSummary>): string | null {
  if (materials.cementOverDisbursed && materials.dieselOverDisbursed) {
    return `إشارة تشخيصية: صرف إسمنت وديزل فوق المعتمد من الوحدة (زيادة إسمنت: +${materials.cementOverDisbursedQty} كيس | زيادة ديزل: +${materials.dieselOverDisbursedQty} لتر).`;
  }
  if (materials.cementOverDisbursed) {
    return `إشارة تشخيصية: صرف إسمنت فوق المعتمد من الوحدة بمقدار (+${materials.cementOverDisbursedQty} كيس).`;
  }
  if (materials.dieselOverDisbursed) {
    return `إشارة تشخيصية: صرف ديزل فوق المعتمد من الوحدة بمقدار (+${materials.dieselOverDisbursedQty} لتر).`;
  }
  if (init.status === 'stagnant') {
    return 'المبادرة مصنفة كـ "متعثرة" ميدانياً، وتتطلب حسم مبررات التوقف وإصدار قرار استكمال أو معالجة فورية.';
  }
  if (init.status === 'stopped') {
    return 'العمل متوقف بالموقع بقرار أو معوقات أهليّة. يلزم التدخل للتنسيق وإزالة المعوقات.';
  }
  if (init.completionRate === 0) {
    return 'المبادرة متوقفة عند نسبة إنجاز (0%)، ولم يبدأ الشق أو الأعمال الإنشائية بعد.';
  }
  if (daysSinceVisit > 30) {
    return `لم يسجل أي نزول ميداني أو تحديث تقرير منذ ${daysSinceVisit} يوماً. يتطلب إيفاد مهندس المنطقة.`;
  }
  if (materials.cementRemaining && materials.cementRemaining !== '0' && materials.cementRemaining !== '0 كيس' && !materials.cementRemaining.includes('غير محدد')) {
    return `يوجد رصيد مواد عهدة متبقي لدى المبادرة بالموقع (${materials.cementRemaining}). يلزم التحقق من الاستخدام ومعالجة أسباب التوقف قبل أي صرف جديد.`;
  }
  if (init.executiveDecision?.executionStatus === 'pending_execution') {
    return 'ينتظر بدء تنفيذ القرار التنفيذي المعتمد. يرجى توجيه جهة المتابعة بالميدان.';
  }
  return null;
}

function generateExecutiveSummaryText(init: Initiative, daysSinceVisit: number, materials: ReturnType<typeof getMaterialsSummary>, healthScore: number): string {
  const comp = init.completionRate || 0;
  const name = init.name;
  const dist = init.district;

  if (comp === 0 && init.status === 'stagnant') {
    return `المبادرة متوقفة عند نسبة إنجاز (0%)، ولم يبدأ التنفيذ الميداني حتى الآن بمديرية ${dist}، ولا توجد تحديثات ميدانية حديثة منذ ${daysSinceVisit} يوماً. ويقترح إجراء زيارة تفقدية عاجلة للتحقق من جاهزية الموقع قبل إصدار قرار الاستكمال.`;
  }

  if (comp === 0) {
    return `المبادرة معتمدة بمديرية ${dist}، ونسبة الإنجاز الحالية (0%). تم تخصيص الدعم بانتظار بدء الشق والقطع. يوصى بمتابعة المقاول والجمعية لتأمين المعدات والتنفيذ.`;
  }

  if (init.status === 'stagnant' || init.status === 'stopped') {
    return `المبادرة تظهر تعثراً ميدانياً عند نسبة إنجاز (${comp}%) في مديرية ${dist}. توجد عهدة مواد متبقية لدى المبادرة (${materials.cementRemaining} أسمنت / ${materials.dieselRemaining} ديزل)، ولا يتم صرف أي كميات جديدة قبل معالجة سبب التوقف والتحقق من العهدة.`;
  }

  if (comp >= 70) {
    return `المبادرة تشهد أدائاً ممتازاً بنسبة إنجاز بلغ (${comp}%) بمديرية ${dist}. تم تنفيذ معظم الشق والرصف الإنشائي. يوصى باستكمال الاستلام الفني وإعداد التقرير التنموي النهائي.`;
  }

  return `المبادرة قيد التنفيذ والعمل الميداني بنسبة إنجاز (${comp}%) بمديرية ${dist}. مؤشر صحة العمل ينال (${healthScore}/100) وتجري المتابعة الدورية بانتظام لمطابقة الأعمال مع الشيت الفني.`;
}

function getActionNeededText(init: Initiative): string {
  if (init.status === 'stagnant') return 'نزول فريق التقييم الفني وحسم أسباب التوقف وإصدار قرار استكمال ملزم.';
  if (init.completionRate === 0) return 'تحديد موعد بدء الأعمال وتأمين المعدات والوقود مع اللجان المجتمعية.';
  if (init.completionRate < 35) return 'تسريع أعمال الشق ومتابعة صرف الدفعة المخصصة للأسمنت والديزل.';
  if (init.completionRate < 70) return 'متابعة أعمال الرصف الخرساني وجدران الحماية المطابقة للمواصفات.';
  if (init.completionRate < 100) return 'استكمال الأمتار المتبقية وإعداد محضر الاستلام الميداني النهائي.';
  return 'المبادرة منجزة ومكتملة كلياً ومستلمة رسمياً.';
}

function getPhaseInfo(comp: number) {
  if (comp === 0) {
    return { label: 'لم يبدأ التنفيذ بعد (0%)', colorClass: 'bg-slate-400' };
  }
  if (comp < 35) {
    return { label: 'مرحلة الشق والقطع والتوسعة', colorClass: 'bg-rose-500' };
  }
  if (comp < 70) {
    return { label: 'مرحلة الأعمال الإنشائية والرصف', colorClass: 'bg-amber-500' };
  }
  if (comp < 100) {
    return { label: 'شارفت على الإنجاز والإنهاء النهائي', colorClass: 'bg-sky-500' };
  }
  return { label: 'منجز ومكتمل كلياً (100%)', colorClass: 'bg-emerald-600' };
}
