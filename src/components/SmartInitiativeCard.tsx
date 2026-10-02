import React, { useState, useRef } from 'react';
import {
  Brain,
  Sparkles,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  FileText,
  Layers,
  Shield,
  Users,
  Send,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  Building2,
  HardHat,
  PlusCircle,
  Copy,
  Printer,
  Sliders,
  HelpCircle,
  Award,
  Package,
  Calendar,
  Check,
  Save,
  MessageSquare,
  Compass,
  ArrowRight,
  ChevronLeft,
  ArrowLeft,
  BarChart3,
  Scale,
  Bell,
  CheckCircle,
  AlertCircle,
  Play,
  RotateCcw,
  Presentation,
  Download
} from 'lucide-react';
import { Initiative, UserRole, FieldReport, Task, InitiativeLifecycleStage } from '../types';
import {
  analyzeInitiative,
  getAIDevelopmentDecision,
  AIDevelopmentDecision,
  getEngineeringPavingSpecs,
  getProblemDecisionMatrix
} from '../utils/healthAndGapAnalysis';
import { getDecisionsForInitiative } from '../data/decisionsStore';
import { إنشاء_الملف_التنفيذي_للمبادرة } from '../utils/developmentDecisionEngine';

interface SmartInitiativeCardProps {
  initiative: Initiative;
  onUpdateInitiative?: (updated: Initiative) => void;
  onClose?: () => void;
  onBack?: () => void;
  onSelectInitiative?: (initiative: Initiative, tabId?: string) => void;
  onNavigateTab?: (tabId: string, initiativeId?: string | null, pathwayId?: number) => void;
  userRole?: UserRole | 'admin' | 'visitor' | string;
  compact?: boolean;
}

// 7 Sequential Lifecycle Stages (as shown in reference image 1)
export const WORKFLOW_STAGES = [
  {
    stageNum: 1,
    id: 'approved',
    title: 'معتمدة',
    subTitle: 'معتمدة',
    statusTag: 'مكتملة',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    iconColor: 'text-emerald-500',
    description: 'عرض بيانات الاعتماد الرسمي للمبادرة، الجهة المعتمدة، تاريخ الاعتماد، ونطاق المبادرة الفني والجغرافي.'
  },
  {
    stageNum: 2,
    id: 'current_monitoring',
    title: 'متابعة حالية',
    subTitle: 'متابعة حالية',
    statusTag: 'قيد التنفيذ',
    statusColor: 'bg-sky-100 text-sky-800 border-sky-300',
    iconColor: 'text-sky-500',
    description: 'متابعة نسب الإنجاز الميداني اليومي، توريدات المواد، وتوثيق المحاضر الميدانية دورياً.'
  },
  {
    stageNum: 3,
    id: 'field_evaluation',
    title: 'تقييم ميداني',
    subTitle: 'تقييم ميداني',
    statusTag: 'لم تبدأ',
    statusColor: 'bg-slate-100 text-slate-600 border-slate-300',
    iconColor: 'text-slate-400',
    description: 'نزول فريق الهندسة وفرسان التنمية لمطابقة المنفذ بالدراسة المعتمدة وفحص الجودة.'
  },
  {
    stageNum: 4,
    id: 'status_classification',
    title: 'تصنيف الحالة',
    subTitle: 'تصنيف الحالة',
    statusTag: 'تحتاج إجراء',
    statusColor: 'bg-amber-100 text-amber-800 border-amber-300',
    iconColor: 'text-amber-500',
    description: 'تحليل الفروقات والتعثرات وتصنيف المبادرة ضمن مصفوفة القواعد الخمس لاتخاذ القرار.'
  },
  {
    stageNum: 5,
    id: 'decision_determination',
    title: 'تحديد القرار',
    subTitle: 'تحديد القرار',
    statusTag: 'لم تبدأ',
    statusColor: 'bg-slate-100 text-slate-600 border-slate-300',
    iconColor: 'text-slate-400',
    description: 'صياغة التوجيه التنفيذي (استكمال الصرف، معالجة تمويل، مناقلة المواد، أو إغلاق وتوثيق).'
  },
  {
    stageNum: 6,
    id: 'action_execution',
    title: 'تنفيذ الإجراء',
    subTitle: 'تنفيذ الإجراء',
    statusTag: 'لم تبدأ',
    statusColor: 'bg-slate-100 text-slate-600 border-slate-300',
    iconColor: 'text-slate-400',
    description: 'إلزام الجهات المسؤولة (الجمعية، الفرسان، المهندس) ببدء الخطوات المعالجة فوراً.'
  },
  {
    stageNum: 7,
    id: 'impact_followup',
    title: 'قياس الأثر',
    subTitle: 'قياس النتائج والأثر',
    statusTag: 'لم تبدأ',
    statusColor: 'bg-slate-100 text-slate-600 border-slate-300',
    iconColor: 'text-slate-400',
    description: 'قياس الأثر الاجتماعي للمشروع، حصر المستفيدين، وتشكيل لجنة الصيانة المجتمعية المستدامة.'
  }
];

export default function SmartInitiativeCard({
  initiative,
  onUpdateInitiative,
  onClose,
  onBack,
  onSelectInitiative,
  onNavigateTab,
  userRole = 'visitor',
  compact = false
}: SmartInitiativeCardProps) {
  // Analytical decision engine calculations
  const dossier = إنشاء_الملف_التنفيذي_للمبادرة(initiative);
  const analysis = analyzeInitiative(initiative);
  const aiDecision: AIDevelopmentDecision = getAIDevelopmentDecision(initiative);
  const engSpecs = getEngineeringPavingSpecs(initiative);
  const problemMatrix = getProblemDecisionMatrix(initiative);

  // References
  const advisorRef = useRef<HTMLDivElement>(null);

  // States
  const [activeWorkflowIndex, setActiveWorkflowIndex] = useState<number>(() => {
    if (initiative.completionRate >= 95) return 6; // Stage 7
    if (initiative.status === 'stagnant' || initiative.status === 'stopped') return 3; // Stage 4
    if (initiative.completionRate > 0) return 1; // Stage 2
    return 0; // Stage 1
  });

  const [activeStageStatus, setActiveStageStatus] = useState<'مكتملة' | 'قيد التنفيذ' | 'تحتاج إجراء' | 'لم تبدأ'>('مكتملة');

  // 11 Sub-tabs inside Smart Advisor Section (Image 2)
  const [activeAdvisorTab, setActiveAdvisorTab] = useState<
    'diagnosis' | 'decision' | 'followup' | 'compare' | 'reports' | 'presentations' | 'forms' | 'whatif' | 'alerts' | 'intervention' | 'cumulative'
  >('diagnosis');

  // State for status dropdown edit
  const [execStatus, setExecStatus] = useState<string>(initiative.status || 'stagnant');
  const [priority, setPriority] = useState<string>('medium');
  const [ownershipConfirmed, setOwnershipConfirmed] = useState<boolean>(initiative.ownerConfirmed ?? true);

  // Interactive AI Advisor Chat
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string; chips?: Array<{ label: string; action: string }> }>>([
    {
      sender: 'ai',
      text: `أهلاً بك يا قائد التنمية. أنا المستشار التنموي الذكي لمبادرة [${initiative.name}].\nيمكنك سؤالي فوراً عن أسباب التعثر، موقف توريدات الأسمنت والديزل، مواصفات صبة الرصف الجبلي، أو طلب صياغة محضر اجتماع قيادي.`,
      time: 'الآن',
      chips: [
        { label: '⚡ فتح مسار الحلول والتدخلات', action: 'go_decision' },
        { label: '🤝 مراجعة مسار المساهمات المجتمعية', action: 'go_followup' },
        { label: '📐 مواصفات الرصف الجبلي الهندسية', action: 'show_specs' },
        { label: '📑 صياغة محضر اجتماع للقيادة', action: 'go_reports' }
      ]
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Minutes Drafter State
  const [minuteAttendees, setMinuteAttendees] = useState('فرسان التنمية، المهندس الفني المشرف، رئيس الجمعية التعاونية');
  const [minuteNotes, setMinuteNotes] = useState(
    `تمت المعاينة الميدانية ومراجعة موقف المبادرة (${initiative.name}) بمديرية (${initiative.district}).\nنسبة الإنجاز الميداني: ${initiative.completionRate}%.\nالمخزون المتبقي بالموقع: ${aiDecision.cementRemaining} كيس أسمنت.\nالتوصية المعتمدة: ${aiDecision.proposedExecutiveDecision}`
  );
  const [minuteSavedStatus, setMinuteSavedStatus] = useState(false);

  // Executive Decision Drafter State
  const [decisionText, setDecisionText] = useState(() => {
    return `بناءً على التقرير الفني والتشخيص الذكي لمبادرة (${initiative.name}) بمديرية (${initiative.district})، وبناءً على وجود تعثر بنسبة إنجاز (${initiative.completionRate}%)، يقرر الاتي:
    
أولاً: ${aiDecision.proposedExecutiveDecision}
ثانياً: تكليف (${aiDecision.responsibleEntity}) ببدء الإجراءات والتنسيق المباشر خلال 7 أيام.
ثالثاً: متابعة الالتزام بالمواصفات الهندسية (سماكة 20 سم وفواصل التمدد كل 4 أمتار) والرفع بمحضر إنجاز.`;
  });
  const [decisionSaved, setDecisionSaved] = useState(false);

  // What-If Simulator State
  const [simExtraCement, setSimExtraCement] = useState<number>(150);
  const [simExtraDays, setSimExtraDays] = useState<number>(14);

  // Handle status update
  const handleUpdateStatus = (newStatus: string) => {
    setExecStatus(newStatus);
    if (onUpdateInitiative) {
      onUpdateInitiative({
        ...initiative,
        status: newStatus as any,
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Scroll to Smart Advisor section
  const handleScrollToAdvisor = (tabTarget?: typeof activeAdvisorTab) => {
    if (tabTarget) setActiveAdvisorTab(tabTarget);
    if (advisorRef.current) {
      advisorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Send Chat message with intelligent context grounding
  const handleSendChatMessage = (textToSend?: string) => {
    const q = textToSend || chatInput.trim();
    if (!q) return;

    const userMsg = {
      sender: 'user' as const,
      text: q,
      time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);
    if (!textToSend) setChatInput('');

    // Instant data-grounded AI reply generator
    setTimeout(() => {
      let aiResponse = '';
      let actionChips: Array<{ label: string; action: string }> = [];
      const queryLower = q.toLowerCase();

      if (queryLower.includes('سبب') || queryLower.includes('تعثر') || queryLower.includes('توقف')) {
        aiResponse = `🔍 **تشخيص أسباب التعثر لهذه المبادرة:**\n• السبب الرئيسي: (${aiDecision.primaryStagnationCause})\n• مدة التوقف التقديرية: ${aiDecision.stagnationMonths > 0 ? `${aiDecision.stagnationMonths} أشهر` : 'مستمر'}\n• التوصية القيادية: ${aiDecision.smartRecommendation}`;
        actionChips = [
          { label: '⚖️ اتخاذ قرار الحل والتدخل', action: 'go_decision' },
          { label: '🚨 توجيه تنبيه عاجل للمسؤول', action: 'send_alert' }
        ];
      } else if (queryLower.includes('أسمنت') || queryLower.includes('مواد') || queryLower.includes('ديزل') || queryLower.includes('مخزون')) {
        aiResponse = `🧱 **موقف المخزون والمواد بالموقع:**\n• الأسمنت المنصرف للموقع: ${aiDecision.cementDisbursed} كيس\n• الأسمنت المستهلك بالفعل: ${aiDecision.cementUsed} كيس\n• الأسمنت المتبقي بالموقع حالياً: ${aiDecision.cementRemaining} كيس\n• رصيد أسمنت لدى الوحدة: ${aiDecision.cementUnitCreditBalance} كيس\n• التوجيه: ${aiDecision.batchDisbursementRecommendation || 'الالتزام بمتابعة التخزين الجاف وتفادي الرطوبة'}`;
        actionChips = [
          { label: '📊 فتح التقرير التراكمي للمواد', action: 'go_cumulative' },
          { label: '📐 فحص المواصفات الهندسية', action: 'show_specs' }
        ];
      } else if (queryLower.includes('هندس') || queryLower.includes('مواصفات') || queryLower.includes('رصف') || queryLower.includes('سمك')) {
        aiResponse = `📐 **دليل المواصفات الهندسية للرصف الجبلي (طريق ${initiative.name}):**\n• سماكة صبة الخرسانة المطلوب: ${aiDecision.engineeringSpecs?.thicknessLabel || '20 سم خرسانة مسلحة'}\n• نسبة الخلط المعتمدة: ${aiDecision.engineeringSpecs?.mixRatio || '1 أسمنت : 2 رمل : 4 كريس'}\n• فواصل التمدد: فصل الفواصل كل 4-5 أمتار بسُمك 2 سم وملؤها بالزفت\n• رش المياه والمعالجة: الرش مرتين يومياً لمدة ${aiDecision.engineeringSpecs?.curingDays || '14 يوماً'}`;
        actionChips = [
          { label: '👷 التوجيه الميداني للمهندس', action: 'engineer_directive' },
          { label: '📑 إعداد محضر معاينة هندسية', action: 'go_reports' }
        ];
      } else if (queryLower.includes('قرار') || queryLower.includes('توصية') || queryLower.includes('حل')) {
        aiResponse = `⚖️ **القرار القيادي المقترح من المستشار الذكي:**\n"${aiDecision.proposedExecutiveDecision}"\n• الجهة المسؤولة عن التنفيذ: **${aiDecision.responsibleEntity}**\n• الإجراء التالي المطلوب: **${aiDecision.nextProposedAction}**`;
        actionChips = [
          { label: '✍️ اعتماد وصياغة القرار رسمياً', action: 'go_decision' },
          { label: '🎯 محاكي سيناريوهات ماذا لو؟', action: 'go_whatif' }
        ];
      } else {
        aiResponse = `📊 **بيانات ومؤشرات المبادرة الحالية (${initiative.name}):**\n• نسبة الإنجاز: ${initiative.completionRate}%\n• مؤشر صحة المبادرة: ${analysis.healthScore}/100 [${analysis.healthLabel}]\n• التصنيف العملياتي: [${aiDecision.classificationLabel}]\n• التوصية: ${aiDecision.smartRecommendation}`;
        actionChips = [
          { label: '🔍 وضع التشخيص الشامل', action: 'go_diagnosis' },
          { label: '⚖️ اتخاذ القرار القيادي', action: 'go_decision' }
        ];
      }

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: aiResponse,
          time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
          chips: actionChips
        }
      ]);
    }, 350);
  };

  // Handle action chip click
  const handleChipAction = (action: string) => {
    if (action === 'go_decision') {
      setActiveAdvisorTab('decision');
      if (onSelectInitiative) onSelectInitiative(initiative, 'decision');
    } else if (action === 'go_followup') {
      setActiveAdvisorTab('followup');
      if (onSelectInitiative) onSelectInitiative(initiative, 'followup');
    } else if (action === 'go_reports') {
      setActiveAdvisorTab('reports');
    } else if (action === 'go_whatif') {
      setActiveAdvisorTab('whatif');
    } else if (action === 'go_diagnosis') {
      setActiveAdvisorTab('diagnosis');
    } else if (action === 'go_cumulative') {
      setActiveAdvisorTab('cumulative');
    } else if (action === 'send_alert') {
      setActiveAdvisorTab('alerts');
    } else if (action === 'show_specs') {
      alert(`📐 المواصفات الهندسية للرصف الجبلي:\n- السماكة: 20 سم خرسانة\n- الخلطة: 1:2:4 (أسمنت:رمل:كريس)\n- الفواصل: كل 4 أمتار\n- الرش: 14 يوماً متواصلة`);
    }
  };

  // Save minute to initiative
  const handleSaveMinute = () => {
    if (!onUpdateInitiative) return;
    const newReport: FieldReport = {
      id: `report_min_${Date.now()}`,
      title: `محضر معاينة ومتابعة ميدانية`,
      date: new Date().toISOString().split('T')[0],
      description: minuteNotes,
      isMatchedWithDeskReview: true,
      status: 'submitted',
      achievements: [`حضور: ${minuteAttendees}`],
      challenges: [aiDecision.primaryStagnationCause]
    };
    onUpdateInitiative({
      ...initiative,
      reports: [newReport, ...(initiative.reports || [])]
    });
    setMinuteSavedStatus(true);
    setTimeout(() => setMinuteSavedStatus(false), 3000);
  };

  // Save executive decision
  const handleSaveDecision = () => {
    if (!onUpdateInitiative) return;
    onUpdateInitiative({
      ...initiative,
      executiveDecision: {
        requiredAction: decisionText,
        interventionPriority: 'urgent',
        responsibleEntity: aiDecision.responsibleEntity,
        nextFollowUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        decisionMaker: 'مستشار القرار التنموي الذكي V4',
        decisionDate: new Date().toISOString().split('T')[0],
        executionStatus: 'in_execution',
        actionNotes: decisionText
      }
    });
    setDecisionSaved(true);
    setTimeout(() => setDecisionSaved(false), 3000);
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* =========================================================================
          0. TOP ACTION & NAVIGATION BAR (فوق البطاقة كما في الصورة 1)
         ========================================================================= */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
        {/* Right side back button */}
        <button
          onClick={() => {
            if (onBack) onBack();
            else if (onClose) onClose();
            else if (onNavigateTab) onNavigateTab('initiatives');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black transition-colors cursor-pointer shadow-2xs"
        >
          <span>← العودة إلى قائمة المبادرات بالمديريات</span>
        </button>

        {/* Left side prominent smart consultation button */}
        <button
          onClick={() => handleScrollToAdvisor('diagnosis')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer border border-amber-300 animate-pulse hover:animate-none"
        >
          <Brain className="w-4 h-4 text-slate-950" />
          <span>استشارة قرار تنموي ذكي للمبادرة ({initiative.name})</span>
          <span className="bg-slate-950 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-400">
            تشخيص / قرار / متابعة
          </span>
        </button>
      </div>

      {/* =========================================================================
          1. INITIATIVE HEADER CARD (رأسية المبادرة كما في الصورة 1)
         ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-5 sm:p-7 space-y-4">
        {/* Top Breadcrumb & Metadata Line */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 flex-wrap text-xs font-bold text-slate-600">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-emerald-950 text-emerald-300 font-extrabold px-3 py-1 rounded-xl border border-emerald-700/60 flex items-center gap-1.5 shadow-2xs text-[11px]">
              <Brain className="w-3.5 h-3.5 text-emerald-400" />
              <span>مصدر القرار: محرك القرار التنموي V1</span>
            </span>
            <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              مديرية {initiative.district || 'غير محددة'} • محافظة {initiative.governorate || 'إب'}
            </span>
            <span>|</span>
            <span>عزلة: <strong className="text-slate-900">{initiative.subDistrict || 'غير موثقة بالبيانات'}</strong></span>
            <span>|</span>
            <span>قرية: <strong className="text-slate-900">{initiative.village || 'غير موثقة بالبيانات'}</strong></span>
            <span>|</span>
            <span className="bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200">
              القطاع: <strong className="font-black">{initiative.sector || 'طرق'}</strong>
            </span>
            <span>|</span>
            <span className="bg-blue-50 text-blue-900 font-mono px-2 py-0.5 rounded border border-blue-200 text-[11px]">
              كود: {initiative.initiativeNumber || initiative.id}
            </span>
          </div>

          <ChevronLeft className="w-5 h-5 text-slate-400 shrink-0" />
        </div>

        {/* Data Badges & Controls Row */}
        <div className="flex items-center gap-2.5 flex-wrap text-xs font-bold pt-1">
          {/* Registration Date */}
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 font-mono text-[11px]">
            تاريخ التسجيل: {initiative.createdAt || 'غير مسجل'}
          </span>

          {/* Start Date */}
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-mono text-[11px]">
            📅 تاريخ بداية المشروع: {initiative.startDate || 'غير مسجل'}
          </span>

          {/* End Date */}
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 font-mono text-[11px]">
            🏁 تاريخ الانتهاء: {initiative.endDate || 'غير مسجل'}
          </span>

          {/* Owner Confirmed Badge */}
          <button
            onClick={() => {
              const val = !ownershipConfirmed;
              setOwnershipConfirmed(val);
              if (onUpdateInitiative) onUpdateInitiative({ ...initiative, ownerConfirmed: val });
            }}
            className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1 transition-colors cursor-pointer text-xs ${
              ownershipConfirmed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>{ownershipConfirmed ? '📄 تم إثبات ملكية المجتمع وحمايته' : '⚠️ ملكية المجتمع قيد التوثيق'}</span>
          </button>

          {/* Execution Status Dropdown */}
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 px-3 py-1 rounded-xl">
            <span className="text-slate-700 font-bold text-[11px]">حالة التنفيذ:</span>
            <select
              value={execStatus}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              className="bg-transparent font-black text-amber-900 outline-none cursor-pointer text-xs"
            >
              <option value="stagnant">متعثرة</option>
              <option value="ongoing">جارية (مستمرة)</option>
              <option value="stopped">متوقفة</option>
              <option value="completed">منجزة</option>
              <option value="pending">لم تبدأ</option>
            </select>
          </div>

          {/* Coordinates */}
          <span className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 font-mono text-[11px] flex items-center gap-1">
            📍 {initiative.coordinates || '14.170247, 44.633669'}
          </span>

          {/* Sector Classification */}
          <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 font-extrabold flex items-center gap-1 text-xs">
            🗺️ تصنيف المبادرة: رصف وتوسعة
          </span>

          {/* Priority */}
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
            <span className="text-slate-700 text-[11px]">الأولوية:</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="bg-transparent font-black text-amber-900 outline-none cursor-pointer text-xs"
            >
              <option value="medium">متوسطة (Medium)</option>
              <option value="high">عالية (High)</option>
              <option value="urgent">طارئة (Urgent)</option>
            </select>
          </div>

          {/* Type */}
          <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 font-bold flex items-center gap-1 text-xs">
            🧱 نوع المبادرة: رصف
          </span>
        </div>

        {/* Big Main Title */}
        <div className="pt-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            {initiative.name}
          </h1>
        </div>
      </div>

      {/* =========================================================================
          2. WORKFLOW ENGINE SECTION (مسار دورة حياة المبادرة التشغيلية - 7 مراحل)
         ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-5 sm:p-6 space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-1.5">
                <span>مسار دورة حياة المبادرة التشغيلية (Workflow Engine)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                ملف حي ينتقل بين مراحل الإدارة التشغيلية، مع ربط كل مرحلة بوظائفها الفنية وقراراتها وسجلاتها.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const nextIdx = (activeWorkflowIndex + 1) % WORKFLOW_STAGES.length;
              setActiveWorkflowIndex(nextIdx);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-2xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تسجيل انتقال مرحلي</span>
          </button>
        </div>

        {/* 7 Stepper Stage Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {WORKFLOW_STAGES.map((stg, idx) => {
            const isActive = idx === activeWorkflowIndex;
            const isPassed = idx < activeWorkflowIndex;

            return (
              <button
                key={stg.id}
                onClick={() => setActiveWorkflowIndex(idx)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col justify-between min-h-[96px] relative ${
                  isActive
                    ? 'bg-emerald-50/90 border-emerald-500 shadow-md ring-2 ring-emerald-400/50 scale-[1.02]'
                    : isPassed
                    ? 'bg-slate-50 border-emerald-200 text-slate-800 hover:bg-slate-100'
                    : 'bg-slate-50/60 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {/* Stage Badge & Number */}
                <div className="flex items-center justify-between text-[11px] font-bold w-full mb-1">
                  <span className={`w-6 h-6 rounded-full font-black flex items-center justify-center text-[10px] ${
                    isActive ? 'bg-emerald-600 text-white' : isPassed ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {stg.stageNum}
                  </span>
                  
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${stg.statusColor}`}>
                    {stg.statusTag}
                  </span>
                </div>

                {/* Stage Title */}
                <span className="text-xs font-black text-slate-900 block my-1">
                  {stg.title}
                </span>

                {/* Stage Subtitle */}
                <span className="text-[10px] text-slate-500 font-medium block">
                  {stg.subTitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Stage Details Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="font-black text-sm text-slate-900">
                  المرحلة {WORKFLOW_STAGES[activeWorkflowIndex].stageNum}: {WORKFLOW_STAGES[activeWorkflowIndex].title}
                </h4>
                <p className="text-xs text-slate-600">
                  {WORKFLOW_STAGES[activeWorkflowIndex].description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-600 font-bold">حالة المرحلة:</span>
                <select
                  value={activeStageStatus}
                  onChange={(e) => setActiveStageStatus(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-black text-emerald-800 outline-none cursor-pointer"
                >
                  <option value="مكتملة">مكتملة 🟢</option>
                  <option value="قيد التنفيذ">قيد التنفيذ 🔵</option>
                  <option value="تحتاج إجراء">تحتاج إجراء 🟡</option>
                  <option value="لم تبدأ">لم تبدأ ⚪</option>
                </select>
              </div>

              {activeWorkflowIndex < WORKFLOW_STAGES.length - 1 && (
                <button
                  onClick={() => setActiveWorkflowIndex(prev => prev + 1)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>انتقال للمرحلة التالية</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 4 Detail Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-500 font-bold block">الجهة المعتمدة:</span>
              <strong className="text-slate-900 font-black text-xs block">
                وحدة التدخلات المركزية التنموية + السلطة المحلية
              </strong>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-500 font-bold block">تاريخ الاعتماد والتسجيل:</span>
              <strong className="text-emerald-700 font-black text-xs block">
                {initiative.createdAt || '2026-08-03'}
              </strong>
              <span className="text-[10px] text-slate-500 block">بدء المشروع: {initiative.startDate || '12-يونيو-24'}</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-500 font-bold block">نطاق المبادرة الجغرافي:</span>
              <strong className="text-slate-900 font-bold text-xs block">
                محافظة إب • مديرية {initiative.district || 'الرضمة'}
              </strong>
              <span className="text-[10px] text-slate-500 block">عزلة: {initiative.subDistrict} | قرية: {initiative.village}</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-500 font-bold block">قطاع المشروع المعتمد:</span>
              <strong className="text-amber-800 font-black text-xs block">
                {initiative.sector || 'رصف وتوسعة'}
              </strong>
              <span className="text-[10px] text-slate-500 font-mono block">كود المبادرة: {initiative.initiativeNumber || '1'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. SMART ADVISOR DECISION ENGINE & GOVERNANCE MATRIX (كما في الصورة 2)
         ========================================================================= */}
      <div
        ref={advisorRef}
        className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/40 space-y-6"
      >
        {/* Top Dark Header Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-400/40 animate-pulse">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-400/40">
                  محرك قرار تنموي ذكي متصل ببيانات المنصة
                </span>
                <span className="text-[11px] bg-indigo-500/20 text-indigo-300 font-bold px-3 py-1 rounded-full border border-indigo-400/40">
                  👥 مصفوفة ورشة الحوكمة
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                مستشار القرار التنموي ومصفوفة حوكمة مبادرات الطرق
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              if (onBack) onBack();
              else if (onNavigateTab) onNavigateTab('initiatives');
              else if (onClose) onClose();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>↩️ العودة</span>
          </button>
        </div>

        {/* 11 Sub-Tabs Navigation Bar (Exact replica of Image 2) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {[
            { id: 'diagnosis', label: '1- التشخيص', icon: '🔍' },
            { id: 'decision', label: '2- القرار', icon: '⚖️' },
            { id: 'followup', label: '3- المتابعة', icon: '📝' },
            { id: 'compare', label: '4- مقارنة', icon: '📊' },
            { id: 'reports', label: '5- تقارير', icon: '📑' },
            { id: 'presentations', label: '6- عروض', icon: '🖥️' },
            { id: 'forms', label: '7- نماذج', icon: '📋' },
            { id: 'whatif', label: '8- ماذا لو؟', icon: '⚙️' },
            { id: 'alerts', label: '9- إنذار', icon: '⚠️' },
            { id: 'intervention', label: '10- خطة تدخل', icon: '🛠️' },
            { id: 'cumulative', label: '11- تراكمي', icon: '📈' }
          ].map(tab => {
            const isActive = activeAdvisorTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAdvisorTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg font-black scale-105'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Initiative Selector & Quick Action Bar (Exact replica of Image 2) */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-3 flex-1 min-w-[300px]">
            <span className="font-extrabold text-slate-300 whitespace-nowrap">اختر المبادرة لتحليلها:</span>
            <div className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-bold text-white flex items-center justify-between gap-2">
              <span className="text-emerald-400 truncate font-black">
                {initiative.name} - (مديرية {initiative.district}) | نسبة الإنجاز: {initiative.completionRate}% | {initiative.sector} | {initiative.status === 'stagnant' ? 'متعثرة تتطلب معالجة' : 'جارية تحت المتابعة'}
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 shrink-0">
                متعثرة تتطلب معالجة
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleScrollToAdvisor('diagnosis')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer transition-colors flex items-center gap-1"
            >
              <span>🧠 فتح بطاقة المبادرة ↗</span>
            </button>
            <button
              onClick={() => handleScrollToAdvisor('decision')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold cursor-pointer transition-colors flex items-center gap-1 border border-slate-700"
            >
              <span>✨ تحليل نتائج المرحلة السابقة</span>
            </button>
          </div>
        </div>

        {/* Mode Banner */}
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black rounded-full flex items-center gap-1.5">
              <span>🔍</span>
              <span>
                {activeAdvisorTab === 'diagnosis' ? 'وضع التشخيص التنموي' :
                 activeAdvisorTab === 'decision' ? 'وضع تحديد القرار والحلول' :
                 activeAdvisorTab === 'followup' ? 'وضع المتابعة والمهام' :
                 activeAdvisorTab === 'compare' ? 'وضع المقارنة بين المديريات' :
                 activeAdvisorTab === 'reports' ? 'وضع التقارير والمحاضر القيادية' :
                 activeAdvisorTab === 'whatif' ? 'محاكي سيناريوهات ماذا لو؟' : 'وضع التحليل القيادي المتقدم'}
              </span>
            </span>

            <span className="text-xs text-slate-400 font-mono">تحديث النظام: {new Date().toLocaleDateString('ar-YE')}</span>
          </div>

          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <span>🎯</span>
            <span>مستشار القرار التنموي الذكي المرتبط ببيانات المنصة وورشة الحوكمة YE</span>
          </h3>

          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed font-medium">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span>
                <strong>أهلاً بك يا قائد التنمية.</strong> لقد تم تحويلي من مجيب أسئلة عام إلى 
                <strong className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30"> مستشار قرار تنموي وتحليلي متكامل</strong> 
                متصل مباشرة ببيانات المبادرات الحقيقية المسجلة في النظام ومصفوفة حوكمة الأدوار.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span>
                <strong>لماذا هذا التطوير؟</strong> لمنع الإجابات العامة المتكررة غير المرتبطة بالسياق، وضمان أن كل تحليل أو تشخيص يعتمد على الأرقام الفعليّة (نسبة الإنجاز: <strong>{initiative.completionRate}%</strong>، المخزون المتبقي: <strong>{aiDecision.cementRemaining} كيس</strong>، مساهمة المجتمع، والتوريدات المصروفة).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-400 font-bold">•</span>
              <span>
                <strong>أوضاع العمل المتاحة الآن بالأعلى:</strong>
                <br />
                🔍 <strong>وضع التشخيص:</strong> تشخيص أسباب التعثر (مالي، توريدي، مجتمعي، فني، جهات).
                <br />
                ⚖️ <strong>وضع القرار:</strong> تحديد القرار الأنسب للمبادرة (استكمال / إعادة تقييم / إعادة توزيع / إغلاق) مع المبررات.
                <br />
                📝 <strong>وضع المتابعة:</strong> تحديد المهام الفورية والمسؤولين والمهل المحجوزة ومحاضر المتابعة.
                <br />
                📊 <strong>وضع المقارنة:</strong> مقارنة الأداء التنموي وكفاءة التدخل بين مديريتين.
              </span>
            </li>
          </ul>
        </div>

        {/* =========================================================================
            3A. INTERACTIVE ADVISOR CHAT PANEL WITH ACTION CHIPS (بوابة الدردشة الذكية)
           ========================================================================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="font-extrabold text-sm text-white">دردشة واستشارة المستشار التنموي الذكي (Interactive Advisor Chat)</h4>
                <p className="text-slate-400 text-[11px]">طرح أي سؤال يتعلق ببيانات المبادرة وتلقي رد دقيق واقتراحات قرارات فورية</p>
              </div>
            </div>

            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
              متصل بـ Gemini AI Engine
            </span>
          </div>

          {/* Chat Thread */}
          <div className="bg-slate-950 rounded-2xl p-4 h-[280px] overflow-y-auto space-y-3.5 scrollbar-thin border border-slate-800/80">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-none whitespace-pre-line'
                  }`}
                >
                  {msg.text}

                  {/* Action Chips inside Chat Reply */}
                  {msg.chips && msg.chips.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-amber-300 font-bold block w-full">⚡ مقترحات الإجراءات السريعة:</span>
                      {msg.chips.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => handleChipAction(chip.action)}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/50 rounded-lg text-[10px] font-black cursor-pointer transition-all hover:scale-105"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 px-1 pt-0.5 font-mono">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Sample Prompt Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {[
              'ما هو السبب الدقيق لتعثر هذه المبادرة؟',
              'ما وضع مخزون الأسمنت والديزل بالموقع؟',
              'اعطني التوصية المناسبة للمشرف واللجنة.',
              'ما هي التوجيهات الهندسية الفنية للصب؟'
            ].map((pText, idx) => (
              <button
                key={idx}
                onClick={() => handleSendChatMessage(pText)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-xl font-bold whitespace-nowrap cursor-pointer border border-slate-700 transition-colors"
              >
                💡 {pText}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
              placeholder="اكتب استفسارك التنموي أو الفني للمستشار الذكي هنا..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={() => handleSendChatMessage()}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            3B. ACTIVE SUB-TAB SPECIFIC VIEWS (التبويبات الـ 11)
           ========================================================================= */}

        {/* SUB-TAB 1: DIAGNOSIS (التشخيص) */}
        {activeAdvisorTab === 'diagnosis' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <span className="text-amber-400 font-bold block flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> تشخيص سبب التعثر والعائق الميداني:
                </span>
                <p className="text-white font-black text-sm">{aiDecision.primaryStagnationCause}</p>
                <p className="text-slate-300 text-[11px] leading-relaxed">{aiDecision.diagnosticSummary}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <span className="text-emerald-400 font-bold block flex items-center gap-1">
                  <Sparkles className="w-4 h-4" /> التوصية التنفيذية للحسم:
                </span>
                <p className="text-emerald-200 font-extrabold leading-relaxed">{aiDecision.smartRecommendation}</p>
              </div>
            </div>

            {/* Directives by Role */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="text-emerald-400 font-black block flex items-center gap-1">
                  <Building2 className="w-4 h-4" /> المشرف والقيادة:
                </span>
                <p className="text-slate-300 leading-relaxed">{aiDecision.supervisorDirective.replace('🏛️ **للمشرف والقيادة:** ', '')}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="text-amber-400 font-black block flex items-center gap-1">
                  <HardHat className="w-4 h-4" /> المهندس الفني:
                </span>
                <p className="text-slate-300 leading-relaxed">{aiDecision.engineerDirective.replace('👷 **للمهندس الفني:** ', '')}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="text-sky-400 font-black block flex items-center gap-1">
                  <Shield className="w-4 h-4" /> الفرسان واللجنة:
                </span>
                <p className="text-slate-300 leading-relaxed">{aiDecision.knightsDirective.replace('🛡️ **لفرسان التنمية:** ', '')}</p>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 2: DECISION (القرار) */}
        {activeAdvisorTab === 'decision' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6 text-xs">
            
            {/* LINKED OFFICIAL DECISIONS LIST FROM COLLECTION */}
            <div className="space-y-3 border-b border-slate-800 pb-5">
              <div className="flex items-center justify-between">
                <h5 className="font-extrabold text-sm text-amber-300 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <span>القرارات القيادية الرسمية المسجلة بالمنظومة ({getDecisionsForInitiative(initiative.id).length})</span>
                </h5>
                <span className="text-[10px] bg-amber-950 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-800">
                  سجل القرارات المعتمدة
                </span>
              </div>

              {getDecisionsForInitiative(initiative.id).length === 0 ? (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-center text-[11px]">
                  لا يوجد قرار صريح مسجل برقم المبادرة حالياً. يمكنك اعتماد الصيغة أدناه لإصدار أول قرار رسمي.
                </div>
              ) : (
                <div className="space-y-2">
                  {getDecisionsForInitiative(initiative.id).map(dec => (
                    <div key={dec.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-black text-amber-400">{dec.decisionNumber}</span>
                        <span className="bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          {dec.executionStatus === 'executed' ? 'منفذ بالكامل 🟢' : 'قيد التنفيذ الميداني 🔵'}
                        </span>
                      </div>
                      <h6 className="font-black text-white text-xs">{dec.title}</h6>
                      <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                        <strong>القرار:</strong> {dec.recommendation}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>الجهة الصادر عنها: {dec.owner}</span>
                        <span>المعتمد: {dec.approvedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>صياغة القرار القيادي والتنفيذي المعتمد</span>
              </h4>
              <span className="text-slate-400 text-[11px]">الجهة المسؤولة: {aiDecision.responsibleEntity}</span>
            </div>

            <div className="space-y-2">
              <label className="text-slate-300 font-bold block">مسودة نص القرار الملزم للجهات:</label>
              <textarea
                rows={5}
                value={decisionText}
                onChange={(e) => setDecisionText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-white font-mono text-xs leading-relaxed outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">تاريخ صدور القرار: {new Date().toLocaleDateString('ar-YE')}</span>
              <button
                onClick={handleSaveDecision}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>{decisionSaved ? 'تم توثيق القرار في المبادرة! ✅' : 'اعتماد وتوثيق القرار في سجل المبادرة ✍️'}</span>
              </button>
            </div>
          </div>
        )}

        {/* SUB-TAB 3: FOLLOWUP (المتابعة والمهام) */}
        {activeAdvisorTab === 'followup' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
            <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>جدول متابعة المهام والمسؤولين والمهل المحجوزة</span>
            </h4>

            <div className="space-y-2">
              {[
                { task: 'توقيع محاضر التنازلات وتثبيت الملكية', entity: 'السلطة المحلية + فرسان التنمية', deadline: 'خلال 5 أيام', status: 'جارية' },
                { task: 'فحص جودة الأسمنت والتخزين بالموقع', entity: 'المهندس الفني المشرف', deadline: 'خلال 48 ساعة', status: 'مكتملة' },
                { task: 'رفع التقرير الميداني والتسجيل بالسجل', entity: 'الجمعية التعاونية بالمديرية', deadline: 'خلال 7 أيام', status: 'تحتاج متابعة' }
              ].map((row, i) => (
                <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <strong className="text-white block text-xs">{row.task}</strong>
                    <span className="text-slate-400 text-[11px]">المسؤول: {row.entity}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-amber-400 font-mono text-[11px] block">{row.deadline}</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-bold">{row.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUB-TAB 5: REPORTS & MINUTES (التقارير والمحاضر) */}
        {activeAdvisorTab === 'reports' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>إعداد ومولد المحاضر الميدانية والقيادية الذكي</span>
              </h4>

              <button
                onClick={handleSaveMinute}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black cursor-pointer flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{minuteSavedStatus ? 'تم الحفظ!' : 'حفظ المحضر في السجلات 💾'}</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-300 font-bold block mb-1">الحضور واللجنة المشاركة:</label>
                <input
                  type="text"
                  value={minuteAttendees}
                  onChange={(e) => setMinuteAttendees(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">نص ومخرجات المحضر الميداني الرسمي:</label>
                <textarea
                  rows={4}
                  value={minuteNotes}
                  onChange={(e) => setMinuteNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-medium outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 8: WHAT-IF (ماذا لو؟) */}
        {activeAdvisorTab === 'whatif' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
            <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <span>محاكي سيناريوهات التنمية وتحليل "ماذا لو؟"</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h5 className="font-black text-emerald-400">ماذا لو تم ضخ {simExtraCement} كيس أسمنت إضافية؟</h5>
                <input
                  type="range"
                  min={50}
                  max={500}
                  step={50}
                  value={simExtraCement}
                  onChange={(e) => setSimExtraCement(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-slate-300 leading-relaxed">
                  • زيادة الإنجاز المتوقعة: +{Math.min(50, Math.round(simExtraCement / 8))}%.
                  <br />
                  • تقليص فترة التعثر بـ {Math.round(simExtraCement / 40)} أسابيع.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h5 className="font-black text-amber-400">ماذا لو تأخر تدخل الجمعية {simExtraDays} يوماً؟</h5>
                <input
                  type="range"
                  min={7}
                  max={60}
                  step={7}
                  value={simExtraDays}
                  onChange={(e) => setSimExtraDays(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-slate-300 leading-relaxed">
                  • احتمالية تضرر مواد الأسمنت بالموقع: {simExtraDays > 20 ? 'مرتفعة (تلف بالرطوبة) 🚨' : 'متوسطة ⚠️'}.
                  <br />
                  • انخفاض معنويات التحشيد المجتمعي.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Default View for other tabs */}
        {(activeAdvisorTab === 'compare' || activeAdvisorTab === 'presentations' || activeAdvisorTab === 'forms' || activeAdvisorTab === 'alerts' || activeAdvisorTab === 'intervention' || activeAdvisorTab === 'cumulative') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
            <h4 className="font-extrabold text-sm text-emerald-400 flex items-center gap-2">
              <span>📊</span>
              <span>لوحة {activeAdvisorTab === 'compare' ? 'المقارنات' : activeAdvisorTab === 'presentations' ? 'العروض القيادية' : activeAdvisorTab === 'forms' ? 'النماذج الرسمية' : activeAdvisorTab === 'alerts' ? 'الإنذارات والتنبيهات' : activeAdvisorTab === 'intervention' ? 'خطة التدخل' : 'السجل التراكمي'}</span>
            </h4>
            <p className="text-slate-300 leading-relaxed font-medium">
              البيانات والمخرجات القيادية متزامنة ومطابقة مباشرة مع قاعدة بيانات محافظة إب ومعايير الدورة المغلقة للقرار.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
