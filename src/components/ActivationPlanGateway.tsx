import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  ShieldAlert, 
  Target, 
  Compass, 
  Ruler, 
  Award, 
  Printer, 
  Download, 
  ArrowRight, 
  Layers, 
  FileText, 
  Users, 
  HardHat, 
  Clock, 
  Scale, 
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';

interface ActivationPlanGatewayProps {
  onNavigateToInitiatives?: () => void;
}

export default function ActivationPlanGateway({ onNavigateToInitiatives }: ActivationPlanGatewayProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'pathways' | 'matrix' | 'engineering' | 'governance'>('overview');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12" dir="rtl">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                المرجع الإستراتيجي والهندسي الموحد
              </span>
              <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[11px] font-bold px-3 py-1 rounded-full">
                محافظة إب 🇾🇪
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              بوابة خطة تفعيل المبادرات والتحول نحو الإدارة بالنتائج
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              المرجع الرسمي الشامل المعتمد لإشراف وتنفيذ المبادرات الأهلية لمشاريع رصف الطرق بالعقبات الجبلية، وإدارتها بآلية قيود "المثلث الذهبي" (الميزانية، الوقت، والجودة) لحماية المواد وتجاوز التعثر.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={handlePrint}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Printer className="w-4 h-4 text-emerald-300" />
              <span>طباعة الدليل المرجعي 🖨️</span>
            </button>

            {onNavigateToInitiatives && (
              <button
                onClick={onNavigateToInitiatives}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 shadow-md"
              >
                <span>الانتقال لسجل المبادرات 🚧</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Section Tabs */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-white/5 hover:bg-white/10 text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>الرؤية والهدف</span>
          </button>

          <button
            onClick={() => setActiveTab('pathways')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'pathways'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-white/5 hover:bg-white/10 text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>المسارات الخمسة</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'matrix'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-white/5 hover:bg-white/10 text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>مصفوفة التدخل والمعالجة</span>
          </button>

          <button
            onClick={() => setActiveTab('engineering')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'engineering'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-white/5 hover:bg-white/10 text-slate-200'
            }`}
          >
            <Ruler className="w-4 h-4" />
            <span>المواصفات الهندسية</span>
          </button>

          <button
            onClick={() => setActiveTab('governance')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'governance'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-white/5 hover:bg-white/10 text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>المثلث الذهبي والحوكمة</span>
          </button>
        </div>
      </div>

      {/* Tab Content 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">الهدف التنفيذي العام</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                الانتقال الفعلي من التوثيق المكتبي التقليدي إلى الفرز الميداني المباشر وإدارة المبادرات بالنتائج، لضمان استمرارية 725+ مبادرة تنموية بمختلف مديريات محافظة إب (قابلة للتوسع) وتحويل المبادرات المتعثرة إلى قمم منجزة.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">إشراك فرسان التنمية</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                تمكين لجان القرى والعزل وفرسان التنمية من تسجيل المساهمات الذاتية (نقدية، عينية، وبشرية) ومتابعة المخازن وحفظ الإسمنت من التلف في القرى والمناطق المنعزلة.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <HardHat className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">حراسة المواصفات الهندسية</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ضمان مطابقة رصف الطرقات الجبلية لأعلى معايير الرصف الحجري والخرساني، بما في ذلك التحكم بفواصل التمدد والرش بالماء وتجنب الهدر المادي والمكانيكي.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>المبادئ الميدانية الحاكمة للخطة التنفيذية</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
                <span className="text-emerald-400 font-extrabold text-sm block">١. الشفافية والمطابقة</span>
                <p className="text-slate-300 leading-relaxed">
                  طابق بين بيانات الرفع الميداني من المهندسين والسجلات الإدارية بانتظام لمنع الفروقات.
                </p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
                <span className="text-emerald-400 font-extrabold text-sm block">٢. الحماية المخزنية</span>
                <p className="text-slate-300 leading-relaxed">
                  حظر التخزين المكشوف للإسمنت والديزل؛ التخزين على منصات خشبية مرتفعة فوق الأرض بـ 15 سم.
                </p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
                <span className="text-emerald-400 font-extrabold text-sm block">٣. الضبط الأمني والأهلي</span>
                <p className="text-slate-300 leading-relaxed">
                  أخذ وثائق التنازلات القانونية الرسمية من ملاك الأراضي قبل بدء شق ورصف أي طريق جبالي.
                </p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
                <span className="text-emerald-400 font-extrabold text-sm block">٤. الاستجابة السريعة</span>
                <p className="text-slate-300 leading-relaxed">
                  الرفع الفوري بالتعثر الميداني فور حدوثه للاستجابة عبر وحدة التدخلات المركزية بالمديرية.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Pathways */}
      {activeTab === 'pathways' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>دليل المسارات الخمسة لتفعيل وتسيير المبادرات</span>
            </h3>

            <div className="space-y-4">
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-900 text-sm">المسار الأول: التشخيص الفني وتوثيق الأثر السكاني</h4>
                  <span className="text-xs bg-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full font-extrabold">المرحلة ١</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  يتضمن مسح المسار الجغرافي للطريق وتحديد نقاط الضعف الفنية وتأكيد جاهزية التنفيذ الأهلي، مع العلم بأن جميع وثائق التنازلات الرسمية لكل المبادرات السابقة مكتملة وموثقة مسبقاً، والتنفيذ يباشره الأهالي والمجتمع.
                </p>
              </div>

              <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-blue-900 text-sm">المسار الثاني: التفعيل الأمني والتحشيد المجتمعي</h4>
                  <span className="text-xs bg-blue-200 text-blue-800 px-2.5 py-0.5 rounded-full font-extrabold">المرحلة ٢</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  تنسيق الجهود مع فرسان التنمية واللجان الأهلية لجمع الاشتراكات النقدية والعينية، حث الأهالي والمغتربين، وتنظيم نوبات العمل العضلي بالقرية.
                </p>
              </div>

              <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-900 text-sm">المسار الثالث: الفرز والتحقق الجغرافي وحماية المواد</h4>
                  <span className="text-xs bg-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full font-extrabold">المرحلة ٣</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  فحص مخازن الإسمنت والديزل بالقرية، التأكد من عدم تعرض المواد للرطوبة والأمطار الموسمية، وجدولة تسليم دفعات الدعم بناءً على نسب الإنجاز.
                </p>
              </div>

              <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-indigo-900 text-sm">المسار الرابع: حراسة المواصفات الفنية والجودة</h4>
                  <span className="text-xs bg-indigo-200 text-indigo-800 px-2.5 py-0.5 rounded-full font-extrabold">المرحلة ٤</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  إشراف هندسي ميداني مباشر للتحقق من سمك الخرسانة والرصف، تركيب فواصل التمدد كل 3-4 أمتار، والالتزام بجدول الرش المستمر بالماء لمنع التشققات.
                </p>
              </div>

              <div className="p-5 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-purple-900 text-sm">المسار الخامس: التوثيق والفرز النهائي للأثر التنموي</h4>
                  <span className="text-xs bg-purple-200 text-purple-800 px-2.5 py-0.5 rounded-full font-extrabold">المرحلة ٥</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  إعداد الحساب الختامي للمبادرة، تصوير الطريق قبل وبعد التنفيذ، رفع التقرير الميداني النهائي للمشرف، وأرشفة أثر الطريق في تخفيض معانات المواطنين.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Intervention Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>مصفوفة التدخل والمعالجة السريعة للمبادرات</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-200">
                    <th className="p-3 font-black">حالة المبادرة</th>
                    <th className="p-3 font-black">سبب المشكلة/التعثر</th>
                    <th className="p-3 font-black">الإجراء الميداني الفوري</th>
                    <th className="p-3 font-black">المسؤول عن التنفيذ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-rose-700">متعثرة / متوقفة</td>
                    <td className="p-3 text-slate-600">نزاعات أهلية على حواشي الطريق</td>
                    <td className="p-3 text-slate-800">نزول لجنة الفرسان والسلطة المحلية لتوقيع وثيقة تنازل نافذة</td>
                    <td className="p-3 font-bold text-slate-700">فرسان التنمية + المجلس المحلي</td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-amber-700">بطء الإنجاز</td>
                    <td className="p-3 text-slate-600">نقص الإسمنت أو تأخر المساهمة الذاتية</td>
                    <td className="p-3 text-slate-800">تفعيل حملة جمع المساهمات وصرف دفعة طارئة من وحدة التدخلات</td>
                    <td className="p-3 font-bold text-slate-700">لجنة المبادرة + وحدة التدخلات</td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-indigo-700">مخاطر مخزنية</td>
                    <td className="p-3 text-slate-600">رطوبة بالقرية وتخزين مكشوف للأسمنت</td>
                    <td className="p-3 text-slate-800">نقل الكميات فوراً لمخزن جاف ومغلق ورفع الكياس على منصات خشبية</td>
                    <td className="p-3 font-bold text-slate-700">أميني المخزن + مهندس العزلة</td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-emerald-700">جارية ومستمرة</td>
                    <td className="p-3 text-slate-600">تنفيذ عادي للرصف الخرساني</td>
                    <td className="p-3 text-slate-800">متابعة فواصل التمدد والرش بالماء مرتين يومياً لمدة 14 يوماً</td>
                    <td className="p-3 font-bold text-slate-700">المهندس الميداني + المقاول الأكاديمى</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Engineering Specs */}
      {activeTab === 'engineering' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <Ruler className="w-5 h-5 text-indigo-600" />
              <span>دليل المواصفات الهندسية الميدانية للرصف الجبلي</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-900 text-sm block">📐 1. أبعاد وسمك الرصف الخرساني</span>
                <p className="text-slate-600 leading-relaxed">
                  يجب ألا يقل سمك الخرسانة عن 15 سم في الطرق العادية، و20 سم في العقبات شديدة الانحدار لضمان تحمل الشاحنات والمركبات الثقيلة.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-900 text-sm block">🧱 2. نسبة خلط الخرسانة (المكونات)</span>
                <p className="text-slate-600 leading-relaxed">
                  نسبة الخلط القياسية المعتمدة: 1 كيس إسمنت : 2 عربة رمل : 4 عربات كري/حصى، مع ضبط كمية الماء لتجنب انفصال المكونات.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-900 text-sm block">🔗 3. فواصل التمدد والانكماش</span>
                <p className="text-slate-600 leading-relaxed">
                  تركيب فواصل تمدد بسمك 1.5 سم كل 3 إلى 4 أمتار في الاتجاه الطولي للحرص على مرونة الخرسانة وتجنب العشوش والتشققات.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-900 text-sm block">💧 4. المعالجة بالرش والماء (Curing)</span>
                <p className="text-slate-600 leading-relaxed">
                  تغطية الرصف بالخيش والرش بالماء المباشر مرتين يومياً صباحاً ومساءً لمدة لا تقل عن 14 يوماً متواصلة من تاريخ صب الخرسانة.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 5: Governance & Triple Constraint */}
      {activeTab === 'governance' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-600" />
              <span>إدارة قيود المشاريع التنموية - قيود "المثلث الذهبي" (PMI Standards)</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              وفقاً لمعايير إدارة المشاريع الاحترافية، ترتبط جودة تنفيذ مبادرات الطرق بعلاقة متوازنة بين الميزانية، الوقت، والجودة. أي اختلال في إحدى الكفتين يؤثر بشكل تراكمي مباشر على نجاح المبادرة.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-black text-amber-900">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>عنصر الوقت (Time)</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  تأخير تنفيذ المبادرة أو تخزين الإسمنت لأكثر من 30 يوماً يتسبب في تصلب المادة بفعل الرطوبة، مما يؤدي للتعثر وارتفاع التكلفة الكلية.
                </p>
              </div>

              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-black text-emerald-900">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>عنصر الميزانية (Budget)</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  توفير المساهمات المجتمعية النقدية والعينية بموعدها يحمي قدرة الشركاء على شراء الكري واستئجار المعدات دون توقف العمل.
                </p>
              </div>

              <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-black text-indigo-900">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>عنصر الجودة (Quality)</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  التهاون في الرش بالماء أو عدم دك التربة الأساسية يتسبب في جرف الطريق بفرص السيول الموسمية وانهيار الجدران الساندة.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
