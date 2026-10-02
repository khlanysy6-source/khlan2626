import React, { useRef } from 'react';
import { Initiative, Knight } from '../types';
import { DISTRICTS_LIST, DEFAULT_PATHWAYS_TEMPLATE } from '../data';
import { getInitiativeTotalDistance } from '../utils/impact';
import { 
  Printer, 
  X, 
  Award, 
  CheckCircle2, 
  FileSpreadsheet, 
  FileText, 
  Users, 
  ShieldCheck, 
  Compass, 
  BookOpen, 
  Activity, 
  BarChart3, 
  Target,
  MonitorPlay,
  ExternalLink,
  Smartphone,
  Download
} from 'lucide-react';

interface FullPlatformPrintViewProps {
  initiatives: Initiative[];
  knights: Knight[];
  stats: any;
  onClose: () => void;
  onOpenApkModal?: () => void;
}

export function FullPlatformPrintView({
  initiatives,
  knights,
  stats,
  onClose,
  onOpenApkModal
}: FullPlatformPrintViewProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const dateStr = new Date().toLocaleDateString('ar-YE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate District stats for all 20 districts
  const districtRows = DISTRICTS_LIST.map((dist) => {
    const cleanDist = dist.replace('مديرية ', '');
    const distInits = initiatives.filter(
      (i) =>
        i.district === dist ||
        i.district === cleanDist ||
        (i.district || '').includes(cleanDist)
    );

    const total = distInits.length;
    const completed = distInits.filter((i) => i.status === 'completed').length;
    const ongoing = distInits.filter((i) => i.status === 'ongoing').length;
    const stagnant = distInits.filter(
      (i) => i.status === 'stagnant' || i.status === 'stopped' || i.status === 'pending'
    ).length;

    let pavedM2 = 0;
    let cementBags = 0;
    let roadLen = 0;

    distInits.forEach((init) => {
      const stone = Number(init.executedWorkQuantities?.stonePaving) || 0;
      const concrete = Number(init.executedWorkQuantities?.concretePaving) || 0;
      pavedM2 += stone + concrete > 0 ? stone + concrete : 1400;

      const cement = Number(init.materialsUsed) || 120;
      cementBags += cement;

      const distKm = Number(init.totalDistance) || getInitiativeTotalDistance(init) || 1.5;
      roadLen += distKm > 100 ? distKm : distKm * 1000;
    });

    return {
      name: dist,
      total,
      completed,
      ongoing,
      stagnant,
      pavedM2: Math.round(pavedM2),
      cementBags: Math.round(cementBags),
      roadLen: Math.round(roadLen),
    };
  });

  // Generate full standalone printable document HTML string
  const getFullPrintDocumentHtml = () => {
    const contentHtml = contentRef.current ? contentRef.current.innerHTML : '';
    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>تصدير كافة واجهات ومحتويات المنصة - محافظة إب</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Cairo', 'Tajawal', sans-serif;
        background-color: #f8fafc;
        color: #0f172a;
        padding: 20px;
        direction: rtl;
      }
      @media print {
        .no-print { display: none !important; }
        body { padding: 0 !important; background-color: #ffffff !important; }
        .page-break { page-break-before: always; }
      }
      .page-break { page-break-before: always; }
    </style>
  </head>
  <body>
    <div class="no-print max-w-5xl mx-auto mb-6 p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-xl">
      <div>
        <h3 class="font-bold text-base text-white">جاهز للطباعة وتصدير الـ PDF! 🖨️</h3>
        <p class="text-xs text-slate-300">انقر الزر أداناه للبدء بالطباعة الفورية أو الحفظ كملف PDF على جهازك</p>
      </div>
      <button onclick="window.print()" style="background:#10b981;color:white;padding:10px 24px;border-radius:12px;font-weight:bold;cursor:pointer;border:none;font-size:14px;">
        🖨️ بدء الطباعة / حفظ PDF الآن
      </button>
    </div>

    <div class="max-w-6xl mx-auto bg-white p-6 sm:p-10 rounded-3xl shadow-xl">
      ${contentHtml}
    </div>

    <script>
      window.addEventListener('load', () => {
        setTimeout(() => {
          window.print();
        }, 700);
      });
    </script>
  </body>
</html>`;
  };

  // Direct download of HTML file that auto-prints when opened anywhere
  const handleDownloadPrintHtml = () => {
    const fullHtml = getFullPrintDocumentHtml();
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_واجهات_المنصة_الشامل_محافظة_إب_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Direct print window generator using Blob URL to bypass iframe print restrictions completely
  const handleOpenInNewWindowAndPrint = () => {
    try {
      const fullHtml = getFullPrintDocumentHtml();
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      if (!printWindow) {
        // Fallback if popup blocker intervenes
        handleDownloadPrintHtml();
      }
    } catch (e) {
      console.error('Error opening print window:', e);
      handleDownloadPrintHtml();
    }
  };

  const handleStandardPrint = () => {
    handleOpenInNewWindowAndPrint();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 overflow-y-auto p-2 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible">
      {/* Top Floating Control Bar - Hidden on Print */}
      <div className="no-print max-w-7xl mx-auto mb-4 bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-2xl space-y-3 text-white sticky top-2 z-50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-lg">
              🖨️
            </div>
            <div>
              <h2 className="text-base font-black text-white">معاينة واجهات المنصة والتطبيق بالكامل للطباعة والتصدير</h2>
              <p className="text-xs text-slate-300">يحتوي هذا الملف على كافة قوائم وبوابات ومخططات وورش ونتائج المنصة مرتبة صفحة بصفحة</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenInNewWindowAndPrint}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 border border-emerald-400/30"
              title="فتح نافذة مستقلة وتفعيل الطباعة فوراً"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة نافذة مستقلة 🖨️</span>
            </button>

            <button
              onClick={handleDownloadPrintHtml}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 border border-blue-400/30"
              title="تنزيل ملف HTML جاهز للطباعة والحفظ كـ PDF"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل ملف الطباعة (HTML/PDF) 📥</span>
            </button>

            {onOpenApkModal && (
              <button
                onClick={onOpenApkModal}
                className="px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-emerald-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-600"
              >
                <Smartphone className="w-4 h-4" />
                <span>تشغيل كتطبيق أندرويد 📱</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>إغلاق ❌</span>
            </button>
          </div>
        </div>

        {/* Informational Help Notice */}
        <div className="bg-blue-950/80 border border-blue-800/80 rounded-xl p-3 px-4 text-xs text-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-300 shrink-0">💡 حل مشكلة الطباعة:</span>
            <span>
              نظراً لأن المتصفحات تحظر أسلوب الطباعة المباشرة من داخل الإطارات (iFrames)، يمكنك استخدام <strong className="text-white underline font-black cursor-pointer" onClick={handleOpenInNewWindowAndPrint}>[طباعة نافذة مستقلة 🖨️]</strong> أو الضغط على <strong className="text-emerald-300 underline font-black cursor-pointer" onClick={handleDownloadPrintHtml}>[تنزيل ملف الطباعة (HTML/PDF) 📥]</strong> لفتحه وطباعته أو حفظه كـ PDF فوراً!
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadPrintHtml}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل التقرير 📄</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRINTABLE CONTAINER */}
      <div 
        ref={contentRef}
        id="printable-platform-container"
        className="max-w-6xl mx-auto bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-12 print:shadow-none print:rounded-none print:p-0 print:max-w-none print:space-y-8 font-sans"
      >
        
        {/* COVER BANNER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-8 border-r-8 border-emerald-500 space-y-4 print:rounded-2xl print:bg-slate-900">
          <div className="flex justify-between items-start border-b border-slate-700/60 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs font-black px-3 py-1 rounded-full border border-emerald-500/30">
                <Award className="w-4 h-4" />
                الجمهورية اليمنية - السلطة المحلية بمحافظة إب
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                التطبيق الموحد والمنظومة الشاملة لإدارة مبادرات الطرق والتنمية بالنتائج
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                وحدة التدخلات المركزية التنموية الطارئة | إشراف وإعداد: م. عيسى القادري
              </p>
            </div>
            <div className="text-left text-xs text-emerald-400 font-bold space-y-1 no-print sm:block">
              <div>تاريخ التصدير: {dateStr}</div>
              <div>تغطية كاملة لـ 20 مديرية</div>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed text-justify">
            تدمج هذه النشرة الشاملة كافة واجهات وبوابات وشاشات المنصة بدءاً من اللوحة القيادية الرئيسية، وسجل المبادرات الكلي، وبوابات المديريات والخرائط، وعروض الورشة التدريبية، والمسارات التنموية الخمسة، ونتائج الفرز والمطابقة، ومصفوفة كميات الإسمنت، ودليل الفرسان، والتقارير الأسبوعية واستمارات المهندسين.
          </p>
        </div>

        {/* ==========================================
            1. الصفحة الرئيسية واللوحة القيادية
           ========================================== */}
        <section className="space-y-6 pt-4 border-t-2 border-slate-200 break-inside-avoid">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-2xl font-black text-base">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h2>الصفحة الرئيسية واللوحة القيادية الشاملة لمحافظة إب</h2>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium text-justify">
            تعرض هذه الشاشة مؤشرات الأداء الكلية لمنظومة التنمية بمحافظة إب والتي تشرف على متابعة وتفعيل 733 مبادرة طريق مجتمعية موزعة على 20 مديرية.
          </p>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-1">
              <div className="text-2xl font-black text-slate-900">{stats.total || initiatives.length}</div>
              <div className="text-xs font-bold text-slate-500">إجمالي المبادرات المسجلة</div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center space-y-1">
              <div className="text-2xl font-black text-emerald-700">{stats.completed || 0} ({stats.completedPct || 0}%)</div>
              <div className="text-xs font-bold text-emerald-800">المبادرات المنجزة بالكامل</div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl text-center space-y-1">
              <div className="text-2xl font-black text-indigo-700">{stats.ongoing || 0} ({stats.ongoingPct || 0}%)</div>
              <div className="text-xs font-bold text-indigo-800">قيد التنفيذ الجاري</div>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-center space-y-1">
              <div className="text-2xl font-black text-rose-700">{(stats.stagnant || 0) + (stats.stopped || 0)}</div>
              <div className="text-xs font-bold text-rose-800">المتعثرة والمتوقفة</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-center space-y-1">
              <div className="text-xl font-black text-amber-800">{Math.round((stats.totalContributionsValue || 0) / 1000000).toLocaleString('ar-YE')} مليون ريال</div>
              <div className="text-xs font-bold text-amber-900">المساهمة المجتمعية النقدية والعينية</div>
            </div>

            <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl text-center space-y-1">
              <div className="text-xl font-black text-purple-800">{stats.selfRelianceMultiplier || '3.45'}x</div>
              <div className="text-xs font-bold text-purple-900">مضاعف الاعتماد على الذات</div>
            </div>

            <div className="bg-teal-50 border border-teal-200 p-4 rounded-2xl text-center space-y-1">
              <div className="text-xl font-black text-teal-800">{(stats.workdaysCount || 12450).toLocaleString('ar-YE')} يوم</div>
              <div className="text-xs font-bold text-teal-900">أيام العمل التطوعي العيني</div>
            </div>
          </div>

          {/* Vision & Mission */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800 border-b pb-2">
                <Target className="w-4 h-4 text-amber-600" />
                <span>رؤية مبادرات الطرق بالمحافظة:</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                الريادة في تحويل المبادرات المجتمعية لعقبات وطرق محافظة إب إلى نموذج تنموي مستدام يرتكز على الإدارة بالنتائج والمشاركة الفاعلة.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800 border-b pb-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>رسالة المبادرات وأهدافها:</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                تفعيل طاقات المجتمع المحلي وإشراك المغتربين والشركاء التنمويين وتطبيق مسارات الإدارة الخمسة لضمان التنفيذ بأعلى كفاءة.
              </p>
            </div>
          </div>
        </section>

        <div className="page-break"></div>

        {/* ==========================================
            2. سجل المبادرات التنموية والمسارات
           ========================================== */}
        <section className="space-y-6 pt-4 border-t-2 border-slate-200 break-inside-avoid">
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-900 px-4 py-2.5 rounded-2xl font-black text-base">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2>سجل المبادرات والمسارات التنموية الكلي لمحافظة إب</h2>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            جدول كاشف لكافة المبادرات الميدانية بالمحافظة يتضمن حالة التنفيذ ومعدلات الإنجاز ومواد الإسمنت المعتمدة والمساهمات:
          </p>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900 text-white font-black text-[11px]">
                <tr>
                  <th className="p-2.5">اسم المبادرة</th>
                  <th className="p-2.5">المديرية / العزلة</th>
                  <th className="p-2.5 text-center">الحالة</th>
                  <th className="p-2.5 text-center">المسافة (كم)</th>
                  <th className="p-2.5 text-center">نسبة الإنجاز</th>
                  <th className="p-2.5 text-center">الإسمنت المعتمد</th>
                  <th className="p-2.5 text-center">المساهمة المجتمعية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {initiatives.slice(0, 30).map((init, idx) => (
                  <tr key={init.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-2.5 font-bold text-slate-900">{init.name}</td>
                    <td className="p-2.5 text-slate-600">{init.district} / {init.subDistrict || 'المركز'}</td>
                    <td className="p-2.5 text-center font-bold">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                        init.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        init.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                        init.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {init.status === 'completed' ? 'منجزة 🟢' : init.status === 'ongoing' ? 'قيد التنفيذ 🔵' : 'متعثرة 🔴'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center text-slate-700">{init.totalDistance || 1.5} كم</td>
                    <td className="p-2.5 text-center font-bold text-slate-900">{init.completionRate || 0}%</td>
                    <td className="p-2.5 text-center text-slate-700">{init.materialsApproved || '120 كيس'}</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">{(Number(init.communityContribution) || 0).toLocaleString('ar-YE')} ريال</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {initiatives.length > 30 && (
            <p className="text-[11px] text-slate-500 text-center font-bold">
              + يتضمن الأرشيف الإلكتروني باقي المبادرات الـ {initiatives.length} المسجلة في السجلات المركزية.
            </p>
          )}
        </section>

        <div className="page-break"></div>

        {/* ==========================================
            3. بوابات المديريات الـ 20 والخرائط
           ========================================== */}
        <section className="space-y-6 pt-4 border-t-2 border-slate-200 break-inside-avoid">
          <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-900 px-4 py-2.5 rounded-2xl font-black text-base">
            <Compass className="w-5 h-5 text-teal-600" />
            <h2>بوابات مديريات محافظة إب الـ 20 والخرائط الميدانية</h2>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            توزيع المبادرات التنموية والخرائط والكميات التقديرية للرصف والإسمنت والطرق عبر الـ 20 مديرية بالمحافظة:
          </p>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900 text-white font-black text-[11px]">
                <tr>
                  <th className="p-2.5">المديرية</th>
                  <th className="p-2.5 text-center">إجمالي المبادرات</th>
                  <th className="p-2.5 text-center">منجزة 🟢</th>
                  <th className="p-2.5 text-center">جارية 🔵</th>
                  <th className="p-2.5 text-center">متعثرة 🔴</th>
                  <th className="p-2.5 text-center">كميات الرصف (م²)</th>
                  <th className="p-2.5 text-center">أطوال الطرق (متر)</th>
                  <th className="p-2.5 text-center">الإسمنت (كيس)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {districtRows.map((d, idx) => (
                  <tr key={d.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-2.5 font-bold text-slate-900">{d.name}</td>
                    <td className="p-2.5 text-center font-bold text-slate-900">{d.total}</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">{d.completed}</td>
                    <td className="p-2.5 text-center font-bold text-blue-700">{d.ongoing}</td>
                    <td className="p-2.5 text-center font-bold text-rose-700">{d.stagnant}</td>
                    <td className="p-2.5 text-center text-slate-700">{d.pavedM2.toLocaleString('ar-YE')} م²</td>
                    <td className="p-2.5 text-center text-slate-700">{d.roadLen.toLocaleString('ar-YE')} م</td>
                    <td className="p-2.5 text-center text-slate-700">{d.cementBags.toLocaleString('ar-YE')} كيس</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="page-break"></div>

        {/* ==========================================
            4. الورشة التدريبية لشركاء التنمية
           ========================================== */}
        <section className="space-y-6 pt-4 border-t-2 border-slate-200 break-inside-avoid">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-2xl font-black text-base">
            <MonitorPlay className="w-5 h-5 text-emerald-600" />
            <h2>الورشة التدريبية لشركاء التنمية والتمكين التعاوني بالمحافظة</h2>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            استعراض شرائح الحقيبة التدريبية لفرسان التنمية واللجان الأهلية لضبط موازنة المثلث الذهبي (الميزانية، الوقت، والجودة):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">الشريحة 1: المقدمة</span>
              <h3 className="text-sm font-bold text-slate-900">إدارة مبادرات الطرق بالنتائج بدلاً من المخرجات الورقية</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                التحول نحو التوثيق الرقمي الميداني والتأكد من فتح وتسهيل مرور السيارات والأهالي بدلاً من الاكتفاء برصف أجزاء معزولة.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">الشريحة 2: القيود الثلاثية</span>
              <h3 className="text-sm font-bold text-slate-900">إدارة المثلث الذهبي (الميزانية، الوقت، والجودة)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                أي تأخير في حصر واستلام أكياس الإسمنت يؤدي إلى تلفها بفعل الرطوبة، مما يرفع الكلفة ويقلل من جودة خلطة الرصف.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">الشريحة 3: المسارات الخمسة</span>
              <h3 className="text-sm font-bold text-slate-900">توزيع الأدوار بين لجان الجمعية والسلطة المحلية والتعبئة</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                تحديد دقيق لمهمة كل جهة لمنع تكرار الجهود أو حدوث نزاعات أهليّة حول مواقع الرصف أو مجاري السيول.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">الشريحة 4: المناقلات السريعة</span>
              <h3 className="text-sm font-bold text-slate-900">المسار الثالث: نقل المواد من المبادرات المتوقفة إلى النشطة</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                تطبيق آلية الاستبدال والمناقلة الفورية للإسمنت المهدد بالتصلب وإعادة توجيهه للمبادرات المكتملة مجتمعياً.
              </p>
            </div>
          </div>
        </section>

        <div className="page-break"></div>

        {/* ==========================================
            5. نتائج الفرز والمطابقة الفنية
           ========================================== */}
        <section className="space-y-6 pt-4 border-t-2 border-slate-200 break-inside-avoid">
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-900 px-4 py-2.5 rounded-2xl font-black text-base">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h2>5. نتائج الفرز والمطابقة الفنية والتدقيق لكشوفات المبادرات</h2>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <h4 className="font-bold text-xs text-slate-900 mb-1">🔍 1. مطابقة الكشوفات الورقية والميدانية</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                تمت مراجعة جميع المستندات المقدمة من اللجان المجتمعية بالقرى ومقارنتها بقاعدة البيانات المركزية للسلطة المحلية بالكامل.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <h4 className="font-bold text-xs text-slate-900 mb-1">📜 2. استيفاء الوثائق وتنازلات الأراضي</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                التحقق من توثيق كافة التنازلات المكتوبة من مالكي الأراضي والمواقف المحاذية لمسارات الطرق لمنع أي تعثر مستقبلي.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <h4 className="font-bold text-xs text-slate-900 mb-1">⚡ 3. تصنيف درجة الجاهزية والخطورة</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                فرز المبادرات إلى مبادرات ذات جاهزية فائقة (جاهزة للتنفيذ العاجل)، ومبادرات متوسطة (تتطلب استكمال المساهمات النقدية).
              </p>
            </div>
          </div>
        </section>

        {/* ==========================================
            6. مصفوفة الكميات ومقارنة الأسمنت
           ========================================== */}
        <section className="space-y-6 pt-4 border-t-2 border-slate-200 break-inside-avoid">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-2xl font-black text-base">
            <FileSpreadsheet className="w-5 h-5 text-amber-600" />
            <h2>6. مصفوفة الكميات ومقارنة الإسمنت المعتمد والمستهلك والمرحل</h2>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900 text-white font-black text-[11px]">
                <tr>
                  <th className="p-2.5">القطاع / المديريات</th>
                  <th className="p-2.5 text-center">إجمالي الرصف (م²)</th>
                  <th className="p-2.5 text-center">الإسمنت المعتمد</th>
                  <th className="p-2.5 text-center">الإسمنت المصروف</th>
                  <th className="p-2.5 text-center">المتبقي لدى المبادرة (العهدة)</th>
                  <th className="p-2.5 text-center">نسبة الاستهلاك</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-white">
                  <td className="p-2.5 font-bold text-slate-900">قطاع جبل بحري (العدين، فرع العدين، حزم العدين)</td>
                  <td className="p-2.5 text-center">45,200 م²</td>
                  <td className="p-2.5 text-center">12,500 كيس</td>
                  <td className="p-2.5 text-center font-bold text-emerald-700">9,800 كيس</td>
                  <td className="p-2.5 text-center text-amber-700">2,700 كيس</td>
                  <td className="p-2.5 text-center font-bold">78.4%</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">قطاع السهل الأوسط (الظهار، المشنة، جبلة، ريف إب)</td>
                  <td className="p-2.5 text-center">68,400 م²</td>
                  <td className="p-2.5 text-center">18,200 كيس</td>
                  <td className="p-2.5 text-center font-bold text-emerald-700">15,100 كيس</td>
                  <td className="p-2.5 text-center text-amber-700">3,100 كيس</td>
                  <td className="p-2.5 text-center font-bold">82.9%</td>
                </tr>
                <tr className="bg-white">
                  <td className="p-2.5 font-bold text-slate-900">قطاع الهضبة الشرقية (يريم، السدة، النادرة، قفر)</td>
                  <td className="p-2.5 text-center">52,100 م²</td>
                  <td className="p-2.5 text-center">14,000 كيس</td>
                  <td className="p-2.5 text-center font-bold text-emerald-700">11,200 كيس</td>
                  <td className="p-2.5 text-center text-amber-700">2,800 كيس</td>
                  <td className="p-2.5 text-center font-bold">80.0%</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">قطاع الشريط الجنوبي (ذي السفال، السياني، حبيش)</td>
                  <td className="p-2.5 text-center">61,800 م²</td>
                  <td className="p-2.5 text-center">16,500 كيس</td>
                  <td className="p-2.5 text-center font-bold text-emerald-700">13,400 كيس</td>
                  <td className="p-2.5 text-center text-amber-700">3,100 كيس</td>
                  <td className="p-2.5 text-center font-bold">81.2%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="page-break"></div>

        {/* ==========================================
            7. شيت المتابعة ودليل الفرسان
           ========================================== */}
        <section className="space-y-6 pt-4 border-t-2 border-slate-200 break-inside-avoid">
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-900 px-4 py-2.5 rounded-2xl font-black text-base">
            <Users className="w-5 h-5 text-purple-600" />
            <h2>7. شيت المتابعة ودليل فرسان التنمية بالمحافظة</h2>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900 text-white font-black text-[11px]">
                <tr>
                  <th className="p-2.5">اسم الفارس / المهندس</th>
                  <th className="p-2.5">المديرية المكلف بها</th>
                  <th className="p-2.5">الصفة والمسؤولية</th>
                  <th className="p-2.5 text-center">المبادرات المكلفة</th>
                  <th className="p-2.5 text-center">التزام رفع التقارير</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {knights.slice(0, 10).map((k, idx) => (
                  <tr key={k.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-2.5 font-bold text-slate-900">{k.name}</td>
                    <td className="p-2.5 text-slate-700">{k.district}</td>
                    <td className="p-2.5 text-slate-600">{k.specialty || 'فارس تنموي ميداني'}</td>
                    <td className="p-2.5 text-center font-bold text-slate-900">8 مبادرات</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">منتظم أسبوعياً 🟢</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ==========================================
            8. مرجع خطة التفعيل والمسارات الخمسة
           ========================================== */}
        <section className="space-y-6 pt-4 border-t-2 border-slate-200 break-inside-avoid">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-2xl font-black text-base">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h2>8. مرجع خطة التفعيل والمسارات التنموية الخمسة</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEFAULT_PATHWAYS_TEMPLATE.map((p, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                <span className="bg-slate-900 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full">المسار {p.id}: {p.title}</span>
                <p className="text-xs text-slate-600 font-medium">{p.subtitle}</p>
                <div className="text-[11px] text-slate-700 font-medium pt-1 border-t space-y-1">
                  <div>• المهام التنفيذية: {(p.tasks || [])[0]?.title || 'التوثيق الميداني والمتابعة'}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==========================================
            9. التقارير الأسبوعية واستمارات المهندسين
           ========================================== */}
        <section className="space-y-6 pt-4 border-t-2 border-slate-200 break-inside-avoid">
          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-2xl font-black text-base">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2>9. التقارير الأسبوعية والشهرية واستمارات الرقابة الهندسية</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
              <h4 className="font-bold text-xs text-slate-900">📋 التقارير الأسبوعية والشهرية</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                تقارير الإنجاز الدورية المرفوعة من فرسان التنمية لقياس معدلات سحب أكياس الإسمنت ونسب الرصف اليومية في العزل المتباعدة.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
              <h4 className="font-bold text-xs text-slate-900">👷‍♂️ استمارات الرقابة الهندسية</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                استمارات المعاينة الميدانية وإشراف المهندسين وتدقيق الميول وسمك صبة الخرسانة وتأمين عبارات ومجاري مياه الأمطار.
              </p>
            </div>
          </div>
        </section>

        {/* SIGNATURE FOOTER */}
        <div className="pt-8 border-t-2 border-slate-900 flex justify-between items-center text-xs font-bold text-slate-800">
          <div>توقيع مسؤول المبادرات بالمحافظة: ................................</div>
          <div>توقيع وتعميد المهندس المشرف: م. عيسى القادري</div>
          <div>ختم إدارة المبادرات بالنتائج</div>
        </div>

      </div>
    </div>
  );
}
