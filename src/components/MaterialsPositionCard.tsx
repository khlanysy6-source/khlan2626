import React, { useState } from 'react';
import { Initiative } from '../types';
import { analyzeInitiativeMaterials, SingleMaterialAnalysis } from '../utils/materialAnalysis';
import { 
  Package, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  FileText, 
  Layers, 
  TrendingUp, 
  ArrowLeftRight,
  ChevronLeft,
  Building2,
  Users
} from 'lucide-react';

interface MaterialsPositionCardProps {
  initiative: Initiative;
  onUpdateInitiative?: (updated: Initiative) => void;
  role?: string;
  className?: string;
}

export const MaterialsPositionCard: React.FC<MaterialsPositionCardProps> = ({
  initiative,
  onUpdateInitiative,
  role,
  className = ''
}) => {
  const [selectedMaterialTab, setSelectedMaterialTab] = useState<'cement' | 'diesel'>('cement');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const analysis = analyzeInitiativeMaterials(initiative);
  const currentMaterialAnalysis: SingleMaterialAnalysis = analysis[selectedMaterialTab];

  const getBadgeStyle = (variant?: 'danger' | 'warning' | 'info' | 'success') => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'warning':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'info':
        return 'bg-sky-950/80 text-sky-300 border-sky-800';
      case 'success':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-right text-slate-100 ${className}`}>
      {/* Header with Title & Overall Alert */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>بطاقة موقف المواد والعهد الميدانية</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-normal border border-slate-700">
                مفهوم العهدة الميدانية
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              فصل مخزون الوحدة (غير المصروف) عن العهدة الميدانية لدى المبادرة (مصروف، مستهلك، متبقي)
            </p>
          </div>
        </div>

        {analysis.primaryAlertBadge && (
          <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${getBadgeStyle(analysis.primaryAlertBadge.variant)}`}>
            {analysis.primaryAlertBadge.text}
          </span>
        )}
      </div>

      {/* Material Selector Switcher */}
      <div className="flex items-center justify-between gap-2 mt-4 mb-3">
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedMaterialTab('cement')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedMaterialTab === 'cement'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🏗️ الأسمنت والمواد الإنشائية</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedMaterialTab('diesel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedMaterialTab === 'diesel'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⛽ الديزل والمحروقات</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 hidden sm:block">
          نسبة الاستهلاك الفعلي: <span className="font-extrabold text-amber-400">{currentMaterialAnalysis.consumptionRate.toFixed(1)}%</span>
        </div>
      </div>

      {/* ⚠️ إشارة تشخيصية: الصرف فوق المعتمد */}
      {currentMaterialAnalysis.isOverDisbursed && (
        <div className="my-3 p-3 rounded-xl bg-amber-950/80 border border-amber-500/80 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg shrink-0 font-black">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-amber-100 block">
                ⚠️ إشارة تشخيصية: {currentMaterialAnalysis.overDisbursedSignal}
              </span>
              <span className="text-[11px] text-amber-300/90 font-medium">
                المنصرف من الوحدة ({currentMaterialAnalysis.disbursedByUnit.toLocaleString()} {currentMaterialAnalysis.unitLabel}) يتجاوز المعتمد بالدراسة ({currentMaterialAnalysis.approvedByStudy.toLocaleString()} {currentMaterialAnalysis.unitLabel}) بفارق (+{currentMaterialAnalysis.overDisbursedAmount.toLocaleString()} {currentMaterialAnalysis.unitLabel}).
              </span>
            </div>
          </div>
          <span className="text-[10px] font-black bg-amber-900/90 border border-amber-600/80 text-amber-200 px-2.5 py-1 rounded-lg shrink-0">
            صرف فوق المعتمد
          </span>
        </div>
      )}

      {/* Main Position Table (جدول موقف المواد) */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 my-3">
        <table className="w-full text-xs text-right border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px]">
              <th className="py-2.5 px-3 font-bold">البيان والتصنيف</th>
              <th className="py-2.5 px-3 font-bold text-center">الكمية المسجلة</th>
              <th className="py-2.5 px-3 font-bold text-center">نوع التصنيف التنفيذي</th>
              <th className="py-2.5 px-3 font-bold text-left">ملاحظات التحليل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {/* 1. الكمية المعتمدة بالدراسة */}
            <tr className="hover:bg-slate-900/40">
              <td className="py-2.5 px-3 text-slate-300 font-bold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>الكمية المعتمدة بالدراسة الفنية:</span>
              </td>
              <td className="py-2.5 px-3 text-center font-black text-white">
                {currentMaterialAnalysis.approvedByStudy.toLocaleString()} {currentMaterialAnalysis.unitLabel}
              </td>
              <td className="py-2.5 px-3 text-center text-[10px] text-slate-400">
                دعم الوحدة المعتمد
              </td>
              <td className="py-2.5 px-3 text-left text-[11px] text-slate-400">
                بحسب شيت (3) المعتمد
              </td>
            </tr>

            {/* 2. الكمية المصروفة من الوحدة */}
            <tr className="bg-blue-950/20 hover:bg-blue-950/30">
              <td className="py-2.5 px-3 text-blue-300 font-bold flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>الكمية المصروفة من الوحدة (العهدة الميدانية):</span>
              </td>
              <td className="py-2.5 px-3 text-center font-black text-blue-300">
                {currentMaterialAnalysis.disbursedByUnit.toLocaleString()} {currentMaterialAnalysis.unitLabel}
              </td>
              <td className="py-2.5 px-3 text-center text-[10px] text-blue-400 font-bold">
                عهدة المبادرة المصروفة
              </td>
              <td className="py-2.5 px-3 text-left text-[11px] text-blue-300">
                خرجت من مستودع الوحدة وتعتبر عهدة
              </td>
            </tr>

            {/* 3. مخزون الوحدة (غير المصروف) */}
            <tr className="hover:bg-slate-900/40">
              <td className="py-2.5 px-3 text-slate-400 font-bold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>مخزون الوحدة (غير المصروف):</span>
              </td>
              <td className="py-2.5 px-3 text-center font-black text-slate-300">
                {currentMaterialAnalysis.unitInventory.toLocaleString()} {currentMaterialAnalysis.unitLabel}
              </td>
              <td className="py-2.5 px-3 text-center text-[10px] text-slate-400">
                مخزون الوحدة المركزي
              </td>
              <td className="py-2.5 px-3 text-left text-[11px] text-slate-400">
                المتبقي بالمستودع الرئيسي ولم يصرف
              </td>
            </tr>

            {/* 4. الكمية المستهلكة فعلياً */}
            <tr className="bg-emerald-950/20 hover:bg-emerald-950/30">
              <td className="py-2.5 px-3 text-emerald-300 font-bold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>الكمية المستهلكة فعلياً بالميدان:</span>
              </td>
              <td className="py-2.5 px-3 text-center font-black text-emerald-300">
                {currentMaterialAnalysis.actuallyConsumed.toLocaleString()} {currentMaterialAnalysis.unitLabel}
              </td>
              <td className="py-2.5 px-3 text-center text-[10px] text-emerald-400 font-bold">
                منجز مدمج بالمنشآت
              </td>
              <td className="py-2.5 px-3 text-left text-[11px] text-emerald-300">
                استهلكت فعلياً في أعمال الرصف/البناء
              </td>
            </tr>

            {/* 5. المخزون المتبقي بالموقع (العهدة الميدانية) */}
            <tr className="bg-amber-950/30 border-y border-amber-900/50">
              <td className="py-2.5 px-3 text-amber-300 font-black flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>المخزون المتبقي بالموقع (عهدة ميدانية):</span>
              </td>
              <td className="py-2.5 px-3 text-center font-black text-amber-300 text-sm">
                {currentMaterialAnalysis.remainingCustody.toLocaleString()} {currentMaterialAnalysis.unitLabel}
              </td>
              <td className="py-2.5 px-3 text-center text-[10px] font-bold text-amber-400">
                مخزون متاح بالموقع
              </td>
              <td className="py-2.5 px-3 text-left text-[11px] text-amber-200">
                موجود بمخزن الموقع لاستكمال أعمال المشروع
              </td>
            </tr>

            {/* 6. المستخدم أكبر من المنصرف = فرق يحتاج تحققاً ميدانياً */}
            {currentMaterialAnalysis.excessConsumed > 0 && (
              <tr className="bg-rose-950/30 border-b border-rose-800/60">
                <td className="py-2.5 px-3 text-rose-300 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>الزيادة عن المنصرف (المستخدم {'>'} المنصرف):</span>
                </td>
                <td className="py-2.5 px-3 text-center font-black text-rose-300">
                  +{currentMaterialAnalysis.excessConsumed.toLocaleString()} {currentMaterialAnalysis.unitLabel}
                </td>
                <td className="py-2.5 px-3 text-center text-[10px] font-bold text-rose-400">
                  فرق يحتاج تحققاً ميدانياً
                </td>
                <td className="py-2.5 px-3 text-left text-[11px] text-rose-200">
                  يتطلب مراجعة هندسية وفحصاً ميدانياً لمصدر وفواتير الكميات الإضافية
                </td>
              </tr>
            )}

            {/* 7. الاحتياج الفعلي المقدر للاستكمال */}
            <tr className="hover:bg-slate-900/40">
              <td className="py-2.5 px-3 text-slate-300 font-bold flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>الاحتياج الفعلي المقدر للاستكمال:</span>
              </td>
              <td className="py-2.5 px-3 text-center font-black text-slate-200">
                {currentMaterialAnalysis.estimatedRemainingToComplete > 0 
                  ? `${currentMaterialAnalysis.estimatedRemainingToComplete.toLocaleString()} ${currentMaterialAnalysis.unitLabel}`
                  : 'لا يوجد احتياج إضافي'}
              </td>
              <td className="py-2.5 px-3 text-center text-[10px] text-slate-400">
                تقدير هندسي
              </td>
              <td className="py-2.5 px-3 text-left text-[11px] text-slate-400">
                بناءً على نسبة الإنجاز والإنفاق الحالي
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Smart Executive Decision Box (القرار الذكي للمبادرة) */}
      <div className="mt-4 p-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-black text-amber-200">
              القرار الذكي والتوصيات التنموية للمبادرة
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
            تحليل الانحرافات التنموية
          </span>
        </div>

        <p className="text-xs text-slate-200 font-medium leading-relaxed">
          {currentMaterialAnalysis.caseOutputText}
        </p>

        {/* Technical Deviations Notice */}
        {currentMaterialAnalysis.hasTechnicalDeviation && (
          <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/80 text-[11px] space-y-1 text-rose-200">
            <span className="font-bold block flex items-center gap-1 text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              انحرافات بين الدراسة والتنفيذ الميداني:
            </span>
            <ul className="list-disc list-inside space-y-0.5 pr-2">
              {currentMaterialAnalysis.deviationReasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Executive Action Required */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">القرار الموصى به:</span>
            <span className="font-black text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/60">
              "{currentMaterialAnalysis.recommendedDecision}"
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>الإجراء المطلوب: <strong className="text-white">{currentMaterialAnalysis.actionRequired}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
