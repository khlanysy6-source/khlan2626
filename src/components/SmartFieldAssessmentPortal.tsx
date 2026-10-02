import React, { useState, useEffect } from 'react';
import { Initiative, UserRole, EngineerSubmissionReport, FieldReport } from '../types';
import { 
  إنشاء_الملف_التنفيذي_للمبادرة, 
  الملف_التنفيذي_للمبادرة 
} from '../utils/developmentDecisionEngine';
import { 
  HardHat, 
  Brain, 
  Ruler, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Layers, 
  Building2, 
  Image as ImageIcon, 
  Camera, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  CheckSquare, 
  Users, 
  MapPin, 
  HelpCircle, 
  RefreshCw, 
  Edit3, 
  Check, 
  X, 
  Plus, 
  Fuel, 
  Box, 
  Activity, 
  TrendingUp, 
  MessageSquare, 
  ChevronLeft, 
  Eye, 
  ListFilter 
} from 'lucide-react';

interface SmartFieldAssessmentPortalProps {
  initiatives: Initiative[];
  onUpdateInitiative: (updatedInitiative: Initiative) => void;
  userRole?: UserRole | 'admin' | 'visitor';
  targetInitiativeId?: string | null;
}

export interface FieldAssessmentLog {
  id: string;
  initiativeId: string;
  unifiedInitiativeNumber: string;
  initiativeName: string;
  visitDate: string;
  engineerName: string;
  participatingTeam: string;
  agency: string;
  location: string;
  generalNotes: string;
  photos: {
    beforeUrl?: string;
    afterUrl?: string;
    duringUrl?: string;
  };
  
  // Track 1: Executed Works (Raw Facts Only)
  executedWorks: {
    itemName: string;
    executedQuantity: number;
    unit: string;
    executionDescription: string;
    technicalNotes: string;
  }[];

  // Track 2: Materials Raw Facts
  materials: {
    cementApproved: number;
    cementDisbursed: number;
    cementUsed: number;
    dieselApproved: number;
    dieselDisbursed: number;
    dieselUsed: number;
  };

  // Track 3: Community Mobilization
  communityTrack: {
    cooperationLevel: 'ممتاز' | 'جيد' | 'متوسط' | 'ضعيف';
    communityContributionValue: number;
    localObstacles: string;
    communityNeeds: string;
  };

  // Track 4: Media & Documentation
  mediaTrack: {
    impactStory: string;
    beneficiaryQuotes: string;
    documentationNotes: string;
  };

  // Track 5: Follow-up
  followupTrack: {
    previousActionsReview: string;
    treatmentStatus: 'قيد المتابعة' | 'تمت المعالجة' | 'تحتاج تصعيد للقيادة';
    supervisorFollowupNotes: string;
  };

  status: 'pending_supervisor' | 'approved_by_engine' | 'rejected';
  submittedAt: string;
  approvedAt?: string;
}

// Helper to parse numbers safely without NaN
const parseSafeNumber = (val: any, fallback: number = 0): number => {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const str = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? fallback : parsed;
};

export default function SmartFieldAssessmentPortal({
  initiatives,
  onUpdateInitiative,
  userRole = 'admin',
  targetInitiativeId
}: SmartFieldAssessmentPortalProps) {
  // Selected Initiative
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string>(
    targetInitiativeId || initiatives[0]?.id || ''
  );

  useEffect(() => {
    if (targetInitiativeId) {
      setSelectedInitiativeId(targetInitiativeId);
    }
  }, [targetInitiativeId]);

  const selectedInitiative = initiatives.find(i => i.id === selectedInitiativeId) || initiatives[0];

  // Single Source of Truth: Central Decision Engine Dossier
  const currentDossier: الملف_التنفيذي_للمبادرة | null = selectedInitiative 
    ? إنشاء_الملف_التنفيذي_للمبادرة(selectedInitiative) 
    : null;

  // Track State inside the 5-Track Evaluation Form
  const [activeTrack, setActiveTrack] = useState<'engineering' | 'materials' | 'community' | 'media' | 'followup'>('engineering');
  const [activePortalTab, setActivePortalTab] = useState<'form' | 'logs' | 'simulator'>('form');

  // Record Form Fields (Raw Facts Entry)
  const [visitDate, setVisitDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [engineerName, setEngineerName] = useState<string>('م. عيسى ناجي القادري');
  const [participatingTeam, setParticipatingTeam] = useState<string>('فريق فرسان التنمية واللجنة المجتمعية');
  const [executingAgency, setExecutingAgency] = useState<string>(
    selectedInitiative ? (selectedInitiative as any).executingAgency || `الجمعية التعاونية - ${selectedInitiative.district}` : 'الجمعية التعاونية'
  );
  const [locationText, setLocationText] = useState<string>(
    selectedInitiative ? `${selectedInitiative.village || 'القرية'} - ${selectedInitiative.subDistrict || 'العزلة'} (${selectedInitiative.coordinates || 'إحداثيات GPS'})` : ''
  );
  const [generalNotes, setGeneralNotes] = useState<string>('');

  // Track 1: Executed Works (Raw Facts Only)
  const [itemName, setItemName] = useState<string>('رصف حجري بالمونة الخرسانية');
  const [executedQuantity, setExecutedQuantity] = useState<number>(120);
  const [measurementUnit, setMeasurementUnit] = useState<string>('متر مربع');
  const [executionDescription, setExecutionDescription] = useState<string>('تم استكمال رصف المقطع الأشد انحداراً وتجهيز فواصل التمدد الحراري والرش بالماء.');
  const [technicalNotes, setTechnicalNotes] = useState<string>('التنفيذ مطابق تماماً للمواصفات الهندسية المعتمدة برصف الأحجار البازلتية.');

  // Photos
  const [photoBefore, setPhotoBefore] = useState<string>('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80');
  const [photoAfter, setPhotoAfter] = useState<string>('https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80');

  // Track 2: Materials Raw Facts Entry (Only Approved, Disbursed, Used)
  const [cementApprovedInput, setCementApprovedInput] = useState<number>(() =>
    selectedInitiative ? parseSafeNumber(selectedInitiative.materialsApproved, 400) : 400
  );
  const [cementDisbursedInput, setCementDisbursedInput] = useState<number>(() =>
    selectedInitiative ? parseSafeNumber(selectedInitiative.materialsDisbursed, 250) : 250
  );
  const [cementUsedInput, setCementUsedInput] = useState<number>(() =>
    selectedInitiative ? parseSafeNumber(selectedInitiative.materialsUsed, 180) : 180
  );

  const [dieselApprovedInput, setDieselApprovedInput] = useState<number>(() =>
    selectedInitiative ? parseSafeNumber(selectedInitiative.dieselApproved, 1000) : 1000
  );
  const [dieselDisbursedInput, setDieselDisbursedInput] = useState<number>(() =>
    selectedInitiative ? parseSafeNumber(selectedInitiative.dieselDisbursed, 600) : 600
  );
  const [dieselUsedInput, setDieselUsedInput] = useState<number>(() =>
    selectedInitiative ? parseSafeNumber(selectedInitiative.dieselUsed, 450) : 450
  );

  // Sync material inputs when selected initiative changes
  useEffect(() => {
    if (selectedInitiative) {
      setCementApprovedInput(parseSafeNumber(selectedInitiative.materialsApproved, 400));
      setCementDisbursedInput(parseSafeNumber(selectedInitiative.materialsDisbursed, 250));
      setCementUsedInput(parseSafeNumber(selectedInitiative.materialsUsed, 180));
      setDieselApprovedInput(parseSafeNumber(selectedInitiative.dieselApproved, 1000));
      setDieselDisbursedInput(parseSafeNumber(selectedInitiative.dieselDisbursed, 600));
      setDieselUsedInput(parseSafeNumber(selectedInitiative.dieselUsed, 450));
      setCommunityContribVal(parseSafeNumber(selectedInitiative.communityContribution, 5000000));
      setExecutingAgency((selectedInitiative as any).executingAgency || `الجمعية التعاونية - ${selectedInitiative.district}`);
      setLocationText(`${selectedInitiative.village || 'القرية'} - ${selectedInitiative.subDistrict || 'العزلة'}`);
    }
  }, [selectedInitiativeId, selectedInitiative]);

  // Track 3: Community Mobilization
  const [cooperationLevel, setCooperationLevel] = useState<'ممتاز' | 'جيد' | 'متوسط' | 'ضعيف'>('ممتاز');
  const [communityContribVal, setCommunityContribVal] = useState<number>(() =>
    selectedInitiative ? parseSafeNumber(selectedInitiative.communityContribution, 5000000) : 5000000
  );
  const [localObstacles, setLocalObstacles] = useState<string>('لا توجد نزاعات أهلية، تفاعل كبير من الأهالي في وجبات العمال وتجهيز الكري.');
  const [communityNeeds, setCommunityNeeds] = useState<string>('توفير دفعة ديزل إضافية للمعدة لدك المقطع المتبقي قبل موسم الأمطار.');

  // Track 4: Media & Documentation
  const [impactStory, setImpactStory] = useState<string>('تسهيل وصول المرضى وسيارات الإسعاف إلى المركز الصحي بعزلة ريدة بدلاً من مشقة الحمير.');
  const [beneficiaryQuotes, setBeneficiaryQuotes] = useState<string>('قال أهالي القرية: هذا الطريق اختصر علينا ساعتين من المعاناة ووفر تكاليف نقل البضائع.');
  const [documentationNotes, setDocumentationNotes] = useState<string>('تم التوثيق بالفيديو والصور عالية الدقة وتجهيز تقرير إعلامي للنشر.');

  // Track 5: Follow-up
  const [previousActionsReview, setPreviousActionsReview] = useState<string>('تم تنفيذ توجيهات الزيارة السابقة بتركيب جدران حماية سندية على حافة الهاوية.');
  const [treatmentStatus, setTreatmentStatus] = useState<'قيد المتابعة' | 'تمت المعالجة' | 'تحتاج تصعيد للقيادة'>('تمت المعالجة');
  const [supervisorFollowupNotes, setSupervisorFollowupNotes] = useState<string>('المبادرة تسير بخطى ثابته والجودة مطابقة لمعايير وزارة الإدارة المحلية.');

  // Saved Logs History (Local Persistence)
  const [assessmentLogs, setAssessmentLogs] = useState<FieldAssessmentLog[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smart_field_assessment_logs_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to load field assessment logs', e);
        }
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('smart_field_assessment_logs_v1', JSON.stringify(assessmentLogs));
      } catch (e) {
        console.warn('Failed to save assessment logs', e);
      }
    }
  }, [assessmentLogs]);

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Submit Field Assessment & Route through Central Decision Engine
  const handleSubmitAndSyncToEngine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInitiative) return;

    // 1. Build Field Assessment Record
    const rawUnifiedNumber = selectedInitiative.initiativeNumber || selectedInitiative.id;
    const unifiedNumber = rawUnifiedNumber.startsWith('IN-') ? rawUnifiedNumber : `IN-${rawUnifiedNumber}`;

    const newLog: FieldAssessmentLog = {
      id: `assessment_log_${Date.now()}`,
      initiativeId: selectedInitiative.id,
      unifiedInitiativeNumber: unifiedNumber,
      initiativeName: selectedInitiative.name,
      visitDate,
      engineerName,
      participatingTeam,
      agency: executingAgency,
      location: locationText,
      generalNotes,
      photos: {
        beforeUrl: photoBefore,
        afterUrl: photoAfter,
      },
      executedWorks: [
        {
          itemName,
          executedQuantity: Number(executedQuantity),
          unit: measurementUnit,
          executionDescription,
          technicalNotes
        }
      ],
      materials: {
        cementApproved: Number(cementApprovedInput),
        cementDisbursed: Number(cementDisbursedInput),
        cementUsed: Number(cementUsedInput),
        dieselApproved: Number(dieselApprovedInput),
        dieselDisbursed: Number(dieselDisbursedInput),
        dieselUsed: Number(dieselUsedInput),
      },
      communityTrack: {
        cooperationLevel,
        communityContributionValue: Number(communityContribVal),
        localObstacles,
        communityNeeds
      },
      mediaTrack: {
        impactStory,
        beneficiaryQuotes,
        documentationNotes
      },
      followupTrack: {
        previousActionsReview,
        treatmentStatus,
        supervisorFollowupNotes
      },
      status: 'approved_by_engine',
      submittedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString()
    };

    // 2. Compute updated initiative properties
    const currentPaved = Number(executedQuantity) || 50;
    const totalDistMeters = (selectedInitiative.totalDistance || 1.5) * 1000;
    const calculatedRateAdd = Math.min(100, Math.round((currentPaved / totalDistMeters) * 100));
    const newCompletionRate = Math.min(100, (selectedInitiative.completionRate || 0) + calculatedRateAdd);

    // Build new FieldReport entry
    const newFieldReport: FieldReport = {
      id: `field_rep_${Date.now()}`,
      title: `تقييم ميداني معتمد للمهندس: ${engineerName}`,
      date: visitDate,
      description: `أعمال منفذة: ${itemName} بمقدار ${executedQuantity} ${measurementUnit}. الوصف: ${executionDescription}`,
      isMatchedWithDeskReview: true,
      status: 'approved',
      achievements: [
        `تأكيد تنفيذ ${executedQuantity} ${measurementUnit} من ${itemName}.`,
        `استهلاك ${cementUsedInput} كيس إسمنت و ${dieselUsedInput} لتر ديزل.`,
        `توثيق المسار الميداني بالصور وقصص الأثر الاجتماعي.`
      ],
      challenges: localObstacles ? [localObstacles] : ['لا توجد عوائق ملحوظة.']
    };

    // 3. Construct updated initiative object
    const updatedInitiative: Initiative = {
      ...selectedInitiative,
      completionRate: newCompletionRate,
      status: newCompletionRate >= 100 ? 'completed' : 'ongoing',
      materialsApproved: String(cementApprovedInput),
      materialsDisbursed: String(cementDisbursedInput),
      materialsUsed: String(cementUsedInput),
      dieselApproved: String(dieselApprovedInput),
      dieselDisbursed: String(dieselDisbursedInput),
      dieselUsed: String(dieselUsedInput),
      communityContribution: Number(communityContribVal),
      reports: [newFieldReport, ...(selectedInitiative.reports || [])],
      updatedAt: new Date().toISOString()
    };

    // 4. Pass updated initiative directly into محرك_القرار_التنموي.ts
    const updatedDossier = إنشاء_الملف_التنفيذي_للمبادرة(updatedInitiative);

    // 5. Save locally & Update global application state
    setAssessmentLogs([newLog, ...assessmentLogs]);
    onUpdateInitiative(updatedInitiative);

    setNotificationMsg(
      `✅ تم إرسال البيانات الميدانية لمسارات التقييم وإعادة تشغيل [محرك القرار التنموي V1] بنجاح!\n` +
      `• درجة صحة المبادرة المحسوبة: ${updatedDossier.المؤشرات.درجة_صحة_المبادرة}%\n` +
      `• درجة الخطورة آلياً: ${updatedDossier.المؤشرات.درجة_الخطورة}\n` +
      `• درجة الأولوية: ${updatedDossier.المؤشرات.درجة_الأولوية}\n` +
      `• تم تحديث الملف التنفيذي الموحد لجميع بوابات المنصة.`
    );

    setTimeout(() => {
      setNotificationMsg(null);
    }, 6000);
  };

  // Image Upload Handlers
  const handlePhotoBeforeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') setPhotoBefore(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoAfterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') setPhotoAfter(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-16" dir="rtl">
      {/* Top Main Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-emerald-950 text-emerald-300 font-extrabold text-xs px-3.5 py-1 rounded-full border border-emerald-700/60 flex items-center gap-1.5 shadow-xs">
                <Brain className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>مصدر القرار: محرك القرار التنموي V1</span>
              </span>
              <span className="bg-indigo-950 text-indigo-300 font-bold text-xs px-3 py-1 rounded-full border border-indigo-800">
                بوابة التغذية الميدانية والمطابقة الذكية 🛠️
              </span>
              <span className="bg-amber-950 text-amber-300 font-bold text-xs px-3 py-1 rounded-full border border-amber-800">
                محافظة إب 🇾🇪
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              بوابة التقييم الميداني الذكية
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
              بوابة تشغيلية ميدانية تتيح للمهندسين والمشرفين إدخال الحقائق الميدانية والأدلة الواقعية فقط (الأعمال المنفذة والكميات والمواد). تقوم المنصة بمطابقة الأعمال آلياً مع دراسة المبادرة وإرسالها إلى <strong className="text-emerald-400">محرك القرار التنموي المركزي</strong> لاستخراج نسبة الإنجاز ودرجة الصحة والتوصيات دون تكرار الحسابات.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/90 p-2 rounded-2xl border border-slate-700 shrink-0">
            <button
              onClick={() => setActivePortalTab('form')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activePortalTab === 'form'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <HardHat className="w-4 h-4" />
              <span>استمارة المسارات الخمسة 📝</span>
            </button>

            <button
              onClick={() => setActivePortalTab('logs')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activePortalTab === 'logs'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>سجلات التقييم المعتمدة ({assessmentLogs.length})</span>
            </button>

            <button
              onClick={() => setActivePortalTab('simulator')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activePortalTab === 'simulator'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>محاكي المطابقة الفورية ⚡</span>
            </button>
          </div>
        </div>

        {/* Global Pipeline Principle Rule Box */}
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <span>مبدأ العمل الموحد:</span>
            <span className="text-white font-normal">المهندس يوثق الواقع ➔ المنصة تطابق وتحدد الفجوة ➔ محرك القرار يصدر الحكم.</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-emerald-900">
            <span>البيانات الميدانية ➔ بوابة التقييم ➔ محرك القرار ➔ الملف التنفيذي ➔ بوابات المنصة</span>
          </div>
        </div>
      </div>

      {/* Notification Success Toast */}
      {notificationMsg && (
        <div className="p-4 bg-emerald-950 text-emerald-200 rounded-2xl shadow-xl border border-emerald-700 flex items-start gap-3 animate-fadeIn whitespace-pre-line text-xs font-bold">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{notificationMsg}</div>
        </div>
      )}

      {/* ==================== SECTION 1: 5-TRACK EVALUATION FORM ==================== */}
      {activePortalTab === 'form' && (
        <div className="space-y-6">
          {/* Initiative Selection Header Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 uppercase">
                  ربط السجل برقم المبادرة الموحد
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                  <span>سجل التقييم الميداني للمبادرة</span>
                  {selectedInitiative && (
                    <span className="text-xs bg-slate-900 text-amber-300 px-3 py-0.5 rounded-lg font-mono">
                      {selectedInitiative.initiativeNumber || selectedInitiative.id}
                    </span>
                  )}
                </h2>
              </div>

              {/* Selector */}
              <div className="w-full md:w-96">
                <label className="text-xs font-bold text-slate-700 block mb-1">اختر المبادرة للزيارة الميدانية:</label>
                <select
                  value={selectedInitiativeId}
                  onChange={(e) => setSelectedInitiativeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  {initiatives.map((init) => (
                    <option key={init.id} value={init.id}>
                      [{init.initiativeNumber || init.id}] - {init.name} ({init.district})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Initiative Baseline Summary Ribbon */}
            {selectedInitiative && currentDossier && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 font-bold block">رقم المبادرة الموحد</span>
                  <strong className="text-slate-900 font-mono font-bold">{currentDossier.هوية_المبادرة.رقم_المبادرة_الموحد}</strong>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 font-bold block">المديرية والقرية</span>
                  <strong className="text-slate-900 font-bold">{currentDossier.هوية_المبادرة.المديرية} - {currentDossier.هوية_المبادرة.القرية}</strong>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 font-bold block">الجهة المنفذة</span>
                  <strong className="text-slate-900 font-bold">{currentDossier.هوية_المبادرة.الجهة_المنفذة}</strong>
                </div>

                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/60">
                  <span className="text-[10px] text-amber-800 font-bold block">الإسمنت (معتمد / منصرف)</span>
                  <strong className="text-amber-950 font-bold">{currentDossier.المواد.الإسمنت.المعتمد} / {currentDossier.المواد.الإسمنت.المنصرف} كيس</strong>
                </div>

                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200/60">
                  <span className="text-[10px] text-indigo-800 font-bold block">الديزل (معتمد / منصرف)</span>
                  <strong className="text-indigo-950 font-bold">{currentDossier.المواد.الديزل.المعتمد} / {currentDossier.المواد.الديزل.المنصرف} لتر</strong>
                </div>

                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200/60">
                  <span className="text-[10px] text-emerald-800 font-bold block">درجة الصحة آلياً</span>
                  <strong className="text-emerald-950 font-black">{currentDossier.المؤشرات.درجة_صحة_المبادرة}% ({currentDossier.المؤشرات.درجة_الخطورة})</strong>
                </div>
              </div>
            )}
          </div>

          {/* Form Header Log Info */}
          <form onSubmit={handleSubmitAndSyncToEngine} className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>بيانات سجل الزيارة الميدانية العامة</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">تاريخ الزيارة:</label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">اسم المهندس والمقيم:</label>
                  <input
                    type="text"
                    value={engineerName}
                    onChange={(e) => setEngineerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">الفريق المشارك:</label>
                  <input
                    type="text"
                    value={participatingTeam}
                    onChange={(e) => setParticipatingTeam(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">الجهة المعاينة:</label>
                  <input
                    type="text"
                    value={executingAgency}
                    onChange={(e) => setExecutingAgency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* ==================== THE 5 TRACKS WORKFLOW NAVIGATION ==================== */}
            <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTrack('engineering')}
                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeTrack === 'engineering'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-lg scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Ruler className="w-4 h-4 text-slate-900" />
                <span>1. المسار الهندسي والأعمال 🛠️</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTrack('materials')}
                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeTrack === 'materials'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-lg scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Box className="w-4 h-4 text-slate-900" />
                <span>2. مسار المواد (الإسمنت والديزل) 🧱</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTrack('community')}
                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeTrack === 'community'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-lg scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4 text-slate-900" />
                <span>3. مسار التحشيد المجتمعي 👥</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTrack('media')}
                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeTrack === 'media'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-lg scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Camera className="w-4 h-4 text-slate-900" />
                <span>4. مسار الإعلام والتوثيق 📸</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTrack('followup')}
                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeTrack === 'followup'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-lg scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Clock className="w-4 h-4 text-slate-900" />
                <span>5. مسار المتابعة والحلول 📋</span>
              </button>
            </div>

            {/* ==================== TRACK 1: ENGINEERING TRACK ==================== */}
            {activeTrack === 'engineering' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-emerald-600" />
                      <span>1. المسار الهندسي: إدخال الأعمال المنفذة والأدلة الواقعية</span>
                    </h3>
                    <p className="text-xs text-slate-500">يدخل المهندس الكميات والبنود المنفذة واقعياً بدون التعديل على نسبة الإنجاز أو درجة الصحة.</p>
                  </div>

                  <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-xl border border-emerald-200">
                    حقائق ميدانية مجردة
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">اسم البند المنفذ:</label>
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="مثل: رصف حجري، صبة خرسانية، توسعة مسار"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">الكمية المنفذة الواقعية:</label>
                    <input
                      type="number"
                      value={isNaN(executedQuantity) ? 0 : executedQuantity}
                      onChange={(e) => setExecutedQuantity(parseSafeNumber(e.target.value, 0))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">وحدة القياس:</label>
                    <select
                      value={measurementUnit}
                      onChange={(e) => setMeasurementUnit(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800"
                    >
                      <option value="متر مربع">متر مربع (م٢)</option>
                      <option value="متر مكعب">متر مكعب (م٣)</option>
                      <option value="متر طولي">متر طولي (م)</option>
                      <option value="شاحنة">شاحنة كري/حجارة</option>
                      <option value="جدار سندي">جدار سندي</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">وصف التنفيذ الفني والمستجدات:</label>
                    <textarea
                      rows={3}
                      value={executionDescription}
                      onChange={(e) => setExecutionDescription(e.target.value)}
                      placeholder="اذكر حالة الشق، التوسعة، دك التربة، وسماكة الرصف..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">الملاحظات الفنية للمهندس:</label>
                    <textarea
                      rows={3}
                      value={technicalNotes}
                      onChange={(e) => setTechnicalNotes(e.target.value)}
                      placeholder="أي ملاحظات حول جودة الأحجار، الخلطة الخرسانية، أو الميول..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* STRICTLY LOCKED / PROHIBITED FIELDS PANEL */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>حقول المخرجات المحظور إدخالها يدويّاً (محسوبة آلياً بواسطة محرك القرار التنموي V1):</span>
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded-md border border-emerald-800 font-mono">
                      Single Source of Truth
                    </span>
                  </div>

                  {currentDossier && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700/80">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">نسبة الإنجاز آلياً</span>
                        <span className="text-base font-black text-emerald-400">{currentDossier.التحليل.نسبة_الإنجاز || 0}%</span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">🔒 غير قابلة للتعديل</span>
                      </div>

                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700/80">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">درجة الصحة آلياً</span>
                        <span className="text-base font-black text-emerald-400">{currentDossier.المؤشرات.درجة_صحة_المبادرة}/100</span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">🔒 صادرة من المحرك</span>
                      </div>

                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700/80">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">درجة الخطورة آلياً</span>
                        <span className="text-sm font-black text-amber-300">{currentDossier.المؤشرات.درجة_الخطورة}</span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">🔒 تصنيف المحرك</span>
                      </div>

                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700/80">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">حالة المبادرة آلياً</span>
                        <span className="text-sm font-bold text-white">{currentDossier.التحليل.الحالة_التشغيلية}</span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">🔒 محسوبة آلياً</span>
                      </div>

                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700/80 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">الأعمال المتبقية آلياً</span>
                        <span className="text-[11px] font-bold text-indigo-300 block truncate">
                          {currentDossier.التحليل.الأعمال_المتبقية[0] || 'مطابقة للدراسة'}
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">🔒 استخراج بالمطابقة</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== TRACK 2: MATERIALS TRACK ==================== */}
            {activeTrack === 'materials' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Box className="w-5 h-5 text-amber-600" />
                      <span>2. مسار المواد: إدخال كميات الإسمنت والديزل الواقعية</span>
                    </h3>
                    <p className="text-xs text-slate-500">يدخل المستخدم الكميات المعتمدة والمنصرفة والمستخدمة فقط. ويقوم المحرك بحساب المتبقي ونسبة الاستخدام وحالة التوريد آلياً.</p>
                  </div>

                  <span className="text-xs bg-amber-50 text-amber-800 font-bold px-3 py-1 rounded-xl border border-amber-200">
                    بوابة المواد الميدانية
                  </span>
                </div>

                {/* Cement Raw Fact Inputs */}
                <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200/80 space-y-4">
                  <h4 className="text-xs font-black text-amber-950 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>
                    <span>مادة الإسمنت (بالأكياس):</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">المعتمد بالدراسة (كيس):</label>
                      <input
                        type="number"
                        value={isNaN(cementApprovedInput) ? 0 : cementApprovedInput}
                        onChange={(e) => setCementApprovedInput(parseSafeNumber(e.target.value, 0))}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">المنصرف من الوحدة (كيس):</label>
                      <input
                        type="number"
                        value={isNaN(cementDisbursedInput) ? 0 : cementDisbursedInput}
                        onChange={(e) => setCementDisbursedInput(parseSafeNumber(e.target.value, 0))}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">المستخدم الميداني الفعلي (كيس):</label>
                      <input
                        type="number"
                        value={isNaN(cementUsedInput) ? 0 : cementUsedInput}
                        onChange={(e) => setCementUsedInput(parseSafeNumber(e.target.value, 0))}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Diesel Raw Fact Inputs */}
                <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-200/80 space-y-4">
                  <h4 className="text-xs font-black text-indigo-950 flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-indigo-600" />
                    <span>مادة الديزل (باللترات):</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">المعتمد بالدراسة (لتر):</label>
                      <input
                        type="number"
                        value={isNaN(dieselApprovedInput) ? 0 : dieselApprovedInput}
                        onChange={(e) => setDieselApprovedInput(parseSafeNumber(e.target.value, 0))}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">المنصرف من الوحدة (لتر):</label>
                      <input
                        type="number"
                        value={isNaN(dieselDisbursedInput) ? 0 : dieselDisbursedInput}
                        onChange={(e) => setDieselDisbursedInput(parseSafeNumber(e.target.value, 0))}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">المستخدم الميداني الفعلي (لتر):</label>
                      <input
                        type="number"
                        value={isNaN(dieselUsedInput) ? 0 : dieselUsedInput}
                        onChange={(e) => setDieselUsedInput(parseSafeNumber(e.target.value, 0))}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Materials Engine Live Auto-Calculations Display */}
                {currentDossier && (
                  <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-emerald-400" />
                        <span>نتائج تحليل المواد المستخرجة فورياً من محرك القرار التنموي V1:</span>
                      </span>
                      <span className="text-[10px] text-slate-400">🔒 يمنع إدخال المتبقي أو نسبة الاستخدام يدويّاً</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-center">
                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <span className="text-[10px] text-slate-400 font-bold block">متبقي الإسمنت لدى الوحدة</span>
                        <strong className="text-emerald-400 text-sm">{currentDossier.المواد.الإسمنت.المتبقي_لدى_الوحدة} كيس</strong>
                      </div>

                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <span className="text-[10px] text-slate-400 font-bold block">نسبة استهلاك الإسمنت</span>
                        <strong className="text-amber-300 text-sm">{currentDossier.المواد.الإسمنت.نسبة_الاستخدام}%</strong>
                      </div>

                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <span className="text-[10px] text-slate-400 font-bold block">حالة الإسمنت بالمحرك</span>
                        <strong className="text-white text-xs">{currentDossier.المواد.الإسمنت.حالة_المادة}</strong>
                      </div>

                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <span className="text-[10px] text-slate-400 font-bold block">حالة الديزل بالمحرك</span>
                        <strong className="text-white text-xs">{currentDossier.المواد.الديزل.حالة_المادة}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================== TRACK 3: COMMUNITY MOBILIZATION TRACK ==================== */}
            {activeTrack === 'community' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      <span>3. مسار التحشيد والمساهمة المجتمعية</span>
                    </h3>
                    <p className="text-xs text-slate-500">توثيق مستوى تعاون المجتمع، المساهمات العينية والنقدية، والمعوقات الأهلية.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">مستوى تعاون المجتمع والأهالي:</label>
                    <select
                      value={cooperationLevel}
                      onChange={(e) => setCooperationLevel(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                    >
                      <option value="ممتاز">ممتاز 🌟 (تفاعل وتحشيد عالي)</option>
                      <option value="جيد">جيد 👍 (تفاعل مناسب)</option>
                      <option value="متوسط">متوسط ⚠️ (يحتاج تحشيد)</option>
                      <option value="ضعيف">ضعيف 🔴 (يوجد عزوف أو نزاعات)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">قيمة المساهمة المجتمعية المحققة (ريال يمني):</label>
                    <input
                      type="number"
                      value={isNaN(communityContribVal) ? 0 : communityContribVal}
                      onChange={(e) => setCommunityContribVal(parseSafeNumber(e.target.value, 0))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">المعوقات والنزاعات الأهلية (إن وجدت):</label>
                    <textarea
                      rows={3}
                      value={localObstacles}
                      onChange={(e) => setLocalObstacles(e.target.value)}
                      placeholder="اذكر أي نزاعات حول مسار الطريق أو اعتراض أراضٍ..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">الاحتياجات المجتمعية العاجلة:</label>
                    <textarea
                      rows={3}
                      value={communityNeeds}
                      onChange={(e) => setCommunityNeeds(e.target.value)}
                      placeholder="الاحتياجات المطلوبة لاستدامة العمل..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TRACK 4: MEDIA & DOCUMENTATION TRACK ==================== */}
            {activeTrack === 'media' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-rose-600" />
                      <span>4. مسار الإعلام والتوثيق والأثر الميداني</span>
                    </h3>
                    <p className="text-xs text-slate-500">رفع صور المسار قبل وبعد التدخل، وتوثيق قصص التغيير وملاحظات المستفيدين.</p>
                  </div>
                </div>

                {/* Photo Uploads Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Photo Before */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-3">
                    <span className="text-xs font-bold text-slate-700 block">صورة المسار قبل التدخل التنموي:</span>
                    {photoBefore ? (
                      <div className="relative rounded-xl overflow-hidden h-40 border border-slate-300">
                        <img src={photoBefore} alt="Before" className="w-full h-full object-cover" />
                        <span className="absolute top-2 right-2 bg-rose-900 text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          قبل التدخل
                        </span>
                      </div>
                    ) : (
                      <div className="h-40 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                        لا توجد صورة
                      </div>
                    )}
                    <label className="inline-flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-700 transition-all">
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span>رفع صورة قبل التدخل</span>
                      <input type="file" accept="image/*" onChange={handlePhotoBeforeUpload} className="hidden" />
                    </label>
                  </div>

                  {/* Photo After */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-3">
                    <span className="text-xs font-bold text-slate-700 block">صورة المسار أثناء / بعد الرصف:</span>
                    {photoAfter ? (
                      <div className="relative rounded-xl overflow-hidden h-40 border border-slate-300">
                        <img src={photoAfter} alt="After" className="w-full h-full object-cover" />
                        <span className="absolute top-2 right-2 bg-emerald-900 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          بعد التدخل
                        </span>
                      </div>
                    ) : (
                      <div className="h-40 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                        لا توجد صورة
                      </div>
                    )}
                    <label className="inline-flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-emerald-600 transition-all">
                      <Camera className="w-4 h-4 text-emerald-300" />
                      <span>رفع صورة التوثيق الحالية</span>
                      <input type="file" accept="image/*" onChange={handlePhotoAfterUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">قصة الأثر والتغيير الاجتماعي:</label>
                    <textarea
                      rows={3}
                      value={impactStory}
                      onChange={(e) => setImpactStory(e.target.value)}
                      placeholder="كيف أثر هذا المشروع على حياة الأهالي؟"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">شهادات وملاحظات المستفيدين:</label>
                    <textarea
                      rows={3}
                      value={beneficiaryQuotes}
                      onChange={(e) => setBeneficiaryQuotes(e.target.value)}
                      placeholder="اقوال وشهادات من أهالي القرية والمستفيدين..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TRACK 5: FOLLOW-UP TRACK ==================== */}
            {activeTrack === 'followup' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-600" />
                      <span>5. مسار المتابعة وحالة المعالجة والتصعيد</span>
                    </h3>
                    <p className="text-xs text-slate-500">مراجعة تنفيذ التوصيات السابقة وتحديد حالة المعالجة الحالية.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">مراجعة الإجراءات والتوجيهات السابقة:</label>
                    <textarea
                      rows={3}
                      value={previousActionsReview}
                      onChange={(e) => setPreviousActionsReview(e.target.value)}
                      placeholder="ما تم إنجازه بناءً على توجيهات الزيارة الماضية..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">حالة المعالجة والمتابعة:</label>
                    <select
                      value={treatmentStatus}
                      onChange={(e) => setTreatmentStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 mb-3"
                    >
                      <option value="تمت المعالجة">تمت المعالجة بالكامل 🟢</option>
                      <option value="قيد المتابعة">قيد المتابعة الميدانية 🟡</option>
                      <option value="تحتاج تصعيد للقيادة">تحتاج تصعيد لوحدة التدخلات المركزية 🔴</option>
                    </select>

                    <label className="font-bold text-slate-700 block mb-1">ملاحظات المشرف التنموي:</label>
                    <textarea
                      rows={2}
                      value={supervisorFollowupNotes}
                      onChange={(e) => setSupervisorFollowupNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* General Visit Notes */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <label className="font-bold text-xs text-slate-800 block">ملاحظات عامة وملخص التقييم الميداني الشامل:</label>
              <textarea
                rows={2}
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="أي ملاحظات ختامية يرغب المهندس في إرفاقها بالمستند الموحد..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900"
              />
            </div>

            {/* Submission Action Button */}
            <div className="flex items-center justify-between gap-4 bg-slate-900 p-5 rounded-3xl text-white shadow-xl flex-wrap">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-emerald-400 shrink-0 animate-pulse" />
                <div>
                  <h4 className="text-sm font-black text-white">إرسال التقييم الميداني وإعادة تشغيل المحرك المركزي</h4>
                  <p className="text-xs text-slate-300">يتم إرسال الحقائق مجردة، حيث يقوم المحرك بتحديث الملف التنفيذي للمبادرة فوراً.</p>
                </div>
              </div>

              <button
                type="submit"
                className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all cursor-pointer flex items-center gap-2 transform active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>اعتمد التقييم وحدث الملف التنفيذي للمبادرة 🚀</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== SECTION 2: SAVED ASSESSMENT LOGS ARCHIVE ==================== */}
      {activePortalTab === 'logs' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 uppercase">
                سجلات التقييم الميداني المعتمدة
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                أرشيف زيارات المعاينة والمطابقة للمبادرات
              </h2>
            </div>

            <div className="text-xs bg-slate-900 text-amber-300 font-bold px-4 py-2 rounded-2xl border border-slate-800">
              عدد السجلات: {assessmentLogs.length} سجل
            </div>
          </div>

          {assessmentLogs.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">لا يوجد سجلات تقييم ميداني سابقة</h3>
              <p className="text-xs text-slate-500">قم بملء استمارة التقييم الميداني الذكية وإرسال النتائج لمحرك القرار.</p>
              <button
                onClick={() => setActivePortalTab('form')}
                className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                إنشاء تقييم ميداني جديد
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {assessmentLogs.map((log) => (
                <div key={log.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-emerald-300 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center font-black shrink-0">
                        <HardHat className="w-5 h-5 text-emerald-700" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-black text-slate-900">{log.initiativeName}</h3>
                          <span className="text-[10px] bg-slate-900 text-amber-300 font-mono px-2.5 py-0.5 rounded-md font-bold">
                            {log.unifiedInitiativeNumber}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            مطابق ومحدث بالملف التنفيذي ✓
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          المهندس: {log.engineerName} • تاريخ الزيارة: {log.visitDate} • الجهة: {log.agency}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 font-mono">
                      تاريخ الرفع: {new Date(log.submittedAt).toLocaleDateString('ar-YE')}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                      <span className="text-[10px] text-slate-500 font-bold block">الأعمال المنفذة</span>
                      <strong className="text-slate-900 font-bold">
                        {log.executedWorks[0]?.itemName}: {log.executedWorks[0]?.executedQuantity} {log.executedWorks[0]?.unit}
                      </strong>
                    </div>

                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/70">
                      <span className="text-[10px] text-amber-800 font-bold block">الإسمنت (المعتمد/المستخدم)</span>
                      <strong className="text-amber-950 font-bold">
                        {log.materials.cementApproved} / {log.materials.cementUsed} كيس
                      </strong>
                    </div>

                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200/70">
                      <span className="text-[10px] text-indigo-800 font-bold block">الديزل (المعتمد/المستخدم)</span>
                      <strong className="text-indigo-950 font-bold">
                        {log.materials.dieselApproved} / {log.materials.dieselUsed} لتر
                      </strong>
                    </div>

                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200/70">
                      <span className="text-[10px] text-emerald-800 font-bold block">تعاون المجتمع</span>
                      <strong className="text-emerald-950 font-bold">
                        {log.communityTrack.cooperationLevel} ({log.communityTrack.communityContributionValue.toLocaleString()} ريال)
                      </strong>
                    </div>
                  </div>

                  {log.generalNotes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60 font-medium">
                      <strong className="text-slate-800">ملاحظات الزيارة: </strong>
                      {log.generalNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== SECTION 3: DECISION ENGINE LIVE MATCHING SIMULATOR ==================== */}
      {activePortalTab === 'simulator' && selectedInitiative && currentDossier && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 uppercase flex items-center gap-1 w-fit">
                <Brain className="w-3.5 h-3.5 text-emerald-600" />
                محاكي مطابقة نتائج الزيارة الفورية مع محرك القرار التنموي V1
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                تقرير المطابقة والتحليل التلقائي للمبادرة: {selectedInitiative.name}
              </h2>
            </div>

            <span className="bg-slate-900 text-amber-300 font-mono text-xs font-black px-4 py-2 rounded-2xl">
              رقم المبادرة الموحد: {currentDossier.هوية_المبادرة.رقم_المبادرة_الموحد}
            </span>
          </div>

          {/* Dossier Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Health & Risk Indicators */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>مؤشرات صحة وخطورة المبادرة</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-slate-300">درجة صحة المبادرة:</span>
                  <strong className="text-emerald-400 text-base font-black">{currentDossier.المؤشرات.درجة_صحة_المبادرة}/100</strong>
                </div>

                <div className="flex justify-between items-center bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-slate-300">مستوى الخطورة آلياً:</span>
                  <strong className="text-amber-300 font-bold">{currentDossier.المؤشرات.درجة_الخطورة}</strong>
                </div>

                <div className="flex justify-between items-center bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-slate-300">درجة الأولوية:</span>
                  <strong className="text-indigo-300 font-bold">{currentDossier.المؤشرات.درجة_الأولوية}</strong>
                </div>
              </div>
            </div>

            {/* 2. Executed vs Baseline Gaps */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>مطابقة الأعمال والانحرافات عن الدراسة</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-slate-300">الحالة التشغيلية:</span>
                  <strong className="text-white font-bold">{currentDossier.التحليل.الحالة_التشغيلية}</strong>
                </div>

                <div className="flex justify-between items-center bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-slate-300">الحالة الفنية والهندسية:</span>
                  <strong className="text-emerald-300 font-bold">{currentDossier.التحليل.الحالة_الفنية}</strong>
                </div>

                <div className="flex justify-between items-center bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-slate-300">الأعمال المتبقية:</span>
                  <strong className="text-slate-200 text-[11px] truncate">{currentDossier.التحليل.الأعمال_المتبقية[0] || 'مطابق'}</strong>
                </div>
              </div>
            </div>

            {/* 3. Materials Balances */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Box className="w-4 h-4 text-indigo-400" />
                <span>تحليل المواد التفصيلي (محسوب آلياً)</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-slate-300">إسمنت (معتمد / مستخدم):</span>
                  <strong className="text-amber-300 font-bold">{currentDossier.المواد.الإسمنت.المعتمد} / {currentDossier.المواد.الإسمنت.المستخدم} كيس</strong>
                </div>

                <div className="flex justify-between items-center bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-slate-300">ديزل (معتمد / مستخدم):</span>
                  <strong className="text-indigo-300 font-bold">{currentDossier.المواد.الديزل.المعتمد} / {currentDossier.المواد.الديزل.المستخدم} لتر</strong>
                </div>

                <div className="flex justify-between items-center bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-slate-300">حالة التوريدات:</span>
                  <strong className="text-emerald-300 font-bold text-[11px] truncate">{currentDossier.المواد.الإسمنت.حالة_المادة}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Automated Recommendations & Required Actions */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>التوصيات والإجراءات التنموية الملزمة الصادرة عن محرك القرار:</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recommendations */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">التوصيات الآلية:</span>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside font-medium">
                  {currentDossier.التوصيات.map((rec, idx) => (
                    <li key={idx} className="leading-relaxed">{rec}</li>
                  ))}
                </ul>
              </div>

              {/* Required Actions */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">الإجراءات والمسؤوليات الملزمة:</span>
                <div className="space-y-2 text-xs">
                  {currentDossier.الإجراءات.map((act) => (
                    <div key={act.الرقم} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800">{act.الرقم}. {act.العنوان}</span>
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                        {act.الجهة_المسؤولة}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
