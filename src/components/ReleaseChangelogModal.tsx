import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Brain,
  Upload,
  BarChart3,
  CheckCircle2,
  X,
  Layers,
  Building,
  MapPin,
  FileSpreadsheet,
  Zap,
  Users,
  HardHat,
  ChevronLeft
} from 'lucide-react';

interface ReleaseChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function ReleaseChangelogModal({
  isOpen,
  onClose,
  onNavigateTab
}: ReleaseChangelogModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-white text-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 flex items-center justify-between border-b border-emerald-500/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">منصة إدارة المبادرات التنموية الذكية - Platform Core v3</h2>
                <span className="bg-emerald-500 text-slate-950 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  الإصدار V3
                </span>
              </div>
              <p className="text-xs text-slate-300">وثيقة إطلاق المحرك الرئيسي والتطوير الشامل ومدمج التقنيات المتقدمة</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Changelog Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* Summary Quote */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 space-y-1">
            <h3 className="font-black text-sm text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>فلسفة الإصدار الثالث: "طور ولا تهدم.. نظم ولا تعيد البناء"</span>
            </h3>
            <p className="text-xs text-emerald-800">
              تمت عملية الدمج والتطوير المعماري بنجاح مع الحفاظ الكامل على الهوية البصرية، التصميم، الألوان، بنية الصفحات، بيانات الـ 733 مبادرة بمحافظة إب، ونظام الصلاحيات RBAC.
            </p>
          </div>

          {/* Phase 1: Core Architectural Stability */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-black text-xs">المرحلة 1</span>
              <h4 className="font-black text-sm text-slate-900">تثبيت النواة المعمارية (Platform Core v3)</h4>
            </div>
            <p className="text-slate-600">
              تثبيت النظام كاملاً باسم <strong className="text-slate-900">Platform Core v3</strong> واستمرار جميع البوابات الأساسية: الرئيسية، سجل المبادرات والمسارات، بوابات المديريات، الخرائط الميدانية التفاعلية GPS، ورشة محاكاة القيود، تقارير المتابعة الأسبوعية، وبوابة الفرسان وشيتات جوجل.
            </p>
          </div>

          {/* Phase 2: AI Advisor & Development Decision Engine */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-100 text-amber-800 rounded-xl font-black text-xs">المرحلة 2</span>
              <h4 className="font-black text-sm text-slate-900">دمج الذكاء الاصطناعي ونظام اتخاذ القرار (AI Decision Engine)</h4>
            </div>
            <p className="text-slate-600">
              ربط واجهات التطبيق بمحرك المساعد التنموي الذكي المتقدم في <code className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono">server.ts</code> و <code className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono">healthAndGapAnalysis.ts</code>:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-700 font-medium pl-2">
              <li>القراءة التلقائية الفورية لحالة المبادرة (نسبة الإنجاز، الأسمنت المنصرف والمستحق، المساهمة المجتمعية، الأشهر المتعثرة، التنازلات).</li>
              <li>التصنيف الخماسي العملياتي التلقائي (مستمر | متوقف | متعثر قابل للاستكمال | متعثر يحتاج قرار قيادي | مكتمل).</li>
              <li>صياغة التوصيات التنفيذية الحكيمة والتوجيهات الموجهة لكل دور (المهندس الفني، فرسان التنمية، المشرف القيادي).</li>
            </ul>
          </div>

          {/* Phase 3: Field Direct Upload Workspace */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-sky-100 text-sky-800 rounded-xl font-black text-xs">المرحلة 3</span>
              <h4 className="font-black text-sm text-slate-900">نظام العمل الميداني والرفع المباشر (Field Workspace & Staging)</h4>
            </div>
            <p className="text-slate-600">
              تطوير بوابة الفرسان والمهندسين بدعم الرفع المباشر لملفات Excel/CSV و PDF والصور الميدانية:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-700 font-medium pl-2">
              <li>محرك المطابقة التلقائية وكشف التعارضات وتكرار الأسماء بالاعتماد على خوارزميات التسوية اللفظية.</li>
              <li>إنشاء قائمة مسودات العرض لقيد مراجعة المشرف (Staging Queue).</li>
              <li>حماية قاعدة البيانات الرئيسية ومنع التعديل المباشر إلا بعد موافقة المشرف الرسمية.</li>
            </ul>
          </div>

          {/* Phase 4: Executive Command & Decision Center */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-100 text-indigo-800 rounded-xl font-black text-xs">المرحلة 4</span>
              <h4 className="font-black text-sm text-slate-900">مركز التقارير القيادية الشامل (Executive Command Center)</h4>
            </div>
            <p className="text-slate-600">
              لوحة القيادة الموحدة للربط مع جميع مديريات إب العشرين، وتتبع حساب مخزون الأسمنت والديزل (المصروف vs المستهلك vs المتبقي بالمستودعات)، وحساب المساهمة الأهلية الكلية، وتوفير خيارات التصدير المباشر لتقارير PDF و Excel والملخصات التنفيذية.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500 font-bold">
            المنصة جاهزة ومستقرة بنسبة 100% • Platform Core v3
          </span>

          <div className="flex items-center gap-2">
            {onNavigateTab && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateTab('field_staging');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>تجربة الرفع الميداني</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              إغلاق النافذة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
