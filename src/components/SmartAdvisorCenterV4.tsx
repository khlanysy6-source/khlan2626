import React, { useState, useMemo, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  Search,
  Printer,
  Download,
  Building,
  ShieldAlert,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  Activity,
  FileCheck,
  FileSpreadsheet,
  Award,
  ChevronLeft,
  ChevronRight,
  Info,
  Sliders,
  Target,
  RefreshCw,
  Zap,
  Check,
  AlertCircle,
  MapPin,
  Coins,
  Fuel,
  PackageCheck,
  Wallet,
  FileText,
  Presentation,
  Send,
  HardHat,
  Shield,
  Building2,
  Users,
  Clock,
  Package,
  BookOpen,
  ArrowLeft,
  Bell,
  Scale,
  Eye,
  Edit,
  Save,
  Share2,
  ListOrdered
} from 'lucide-react';
import PptxGenJS from 'pptxgenjs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Initiative, UserRole, Knight } from '../types';
import { exportInitiativesToExcel } from '../utils/excelExporter';
import {
  analyzeInitiative,
  summarizePortfolio,
  getAIDevelopmentDecision,
  getEngineeringPavingSpecs,
  getProblemDecisionMatrix,
  AIDevelopmentDecision,
  InitiativeAnalysis,
  PortfolioExecutiveSummary,
  FiveTierCategoryKey
} from '../utils/healthAndGapAnalysis';
import { parseNum, CANONICAL_DISTRICTS, matchDistrictStrict } from '../utils/numberAndDistrictUtils';
import SmartDevelopmentAdvisorV5 from './SmartDevelopmentAdvisorV5';
import { إنشاء_الملف_التنفيذي_للمبادرة } from '../utils/developmentDecisionEngine';

interface SmartAdvisorCenterV4Props {
  initiatives: Initiative[];
  onUpdateInitiative?: (initiative: Initiative) => void;
  onNavigateTab?: (tab: string) => void;
  onSelectInitiative?: (initiative: Initiative, targetTrackOrTab?: string) => void;
  userRole?: UserRole;
  targetInitiativeId?: string | null;
}

export default function SmartAdvisorCenterV4({
  initiatives,
  onUpdateInitiative,
  onNavigateTab,
  onSelectInitiative,
  userRole = 'central_unit',
  targetInitiativeId
}: SmartAdvisorCenterV4Props) {
  // Main Sub-Tab State inside Smart Advisor V4
  const [activeSubTab, setActiveSubTab] = useState<
    | 'diagnosis'
    | 'operational'
    | 'comparison'
    | 'simulator'
    | 'reports_and_minutes'
    | 'technical_engineering'
  >('diagnosis');

  // Filters & Search State
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [governanceRoleFilter, setGovernanceRoleFilter] = useState<'all' | 'association' | 'knights' | 'engineer' | 'authority' | 'unit'>('all');
  const [selectedRuleFilter, setSelectedRuleFilter] = useState<'all' | 'rule1' | 'rule2' | 'rule3' | 'rule4'>('all');

  // Selected Initiative for Detailed Decision Drawer / Action Modal
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [showInstantDiagnosisModal, setShowInstantDiagnosisModal] = useState(false);

  // Active Track & Animation Transition State (المسارات الخمسة)
  const [activeTrackId, setActiveTrackId] = useState<string>('track_1');
  const [isTransitioningTrack, setIsTransitioningTrack] = useState<boolean>(false);
  const [transitioningTrackName, setTransitioningTrackName] = useState<string>('المسار 1: التوعية واللجان المجتمعية');

  // Enhanced onSelectInitiative handler with smooth transition animation (Slate/Indigo/Emerald visual identity)
  const handleSelectInitiativeWithTransition = (
    init: Initiative | null,
    targetTrackOrTab: string = 'track_1',
    trackName?: string
  ) => {
    const targetInit = init || (initiatives.length > 0 ? initiatives[0] : null);
    if (!targetInit) return;

    setSelectedInitiative(targetInit);
    setActiveTrackId(targetTrackOrTab);
    if (trackName) setTransitioningTrackName(trackName);

    // Trigger smooth transition animation
    setIsTransitioningTrack(true);
    setTimeout(() => {
      setIsTransitioningTrack(false);
    }, 450);

    // Call external parent handler if available
    if (onSelectInitiative) {
      onSelectInitiative(targetInit, targetTrackOrTab);
    } else if (onNavigateTab) {
      onNavigateTab('initiatives');
    }
  };

  // Sync targetInitiativeId or default selectedInitiative
  useEffect(() => {
    if (targetInitiativeId && initiatives.length > 0) {
      const found = initiatives.find(i => i.id === targetInitiativeId);
      if (found) setSelectedInitiative(found);
    } else if (!selectedInitiative && initiatives.length > 0) {
      setSelectedInitiative(initiatives[0]);
    }
  }, [targetInitiativeId, initiatives]);

  // Direct Notifications Dispatcher State
  const [dispatchedNotifications, setDispatchedNotifications] = useState<Array<{
    id: string;
    initiativeName: string;
    targetEntity: string;
    message: string;
    timestamp: string;
    status: 'مرسل' | 'تم الاستلام';
  }>>([
    {
      id: 'notif_1',
      initiativeName: 'عقبة ريمة - خربة الصباري',
      targetEntity: 'الجمعية التعاونية بمديرية النادرة',
      message: 'توجيه عاجل: صرف دفعة أسمنت جديدة (200 كيس) لمتبقي أعمال الصب الرأسي.',
      timestamp: '2026-08-03 10:15',
      status: 'تم الاستلام'
    },
    {
      id: 'notif_2',
      initiativeName: 'طريق ذي سار - عزلة حراس',
      targetEntity: 'فرسان التنمية + المهندس الميداني',
      message: 'تنبيه جودة: فحص رطوبة الأسمنت في المخزن الميداني وتوثيق فواصل التمدد.',
      timestamp: '2026-08-03 11:30',
      status: 'مرسل'
    }
  ]);
  const [newNotificationText, setNewNotificationText] = useState('');
  const [newNotificationEntity, setNewNotificationEntity] = useState('الجمعية التعاونية بالمديرية');

  // Official Meeting Minutes Generator State
  const [minutesTitle, setMinutesTitle] = useState('محضر اجتماع وتوجيهات لجنة القرارات التنموية بمحافظة إب');
  const [minutesLocation, setMinutesLocation] = useState('ديوان عام محافظة إب - وحدة التدخلات المركزية');
  const [minutesAttendees, setMinutesAttendees] = useState('محافظ المحافظة، مدير وحدة التدخلات، رئيس الجمعية التعاونية، المهندس المشرف، فارس التنمية');
  const [minutesAgenda, setMinutesAgenda] = useState('معالجة تعثر المبادرات الحرجة، اعتماد صرف الدفعات الجديدة، وتفعيل المساهمة المجتمعية.');
  const [minutesDecisions, setMinutesDecisions] = useState([
    'صرف دفعة جديدة من الإسمنت المعتمد للمبادرات التي تجاوزت إنجاز 80% ورصيد أكياسها بالموقع أقل من 10%.',
    'إلزام الجمعيات التعاونية بنقل أكياس الأسمنت المعرضة للرطوبة إلى مستودعات جافة ومرفوعة 15 سم.',
    'تشكيل لجنة نزول ميداني لحل النزاعات الأهلية في مسارات الطرق المتبقية بالتنسيق مع السلطة المحلية.'
  ]);
  const [newDecisionInput, setNewDecisionInput] = useState('');
  const [showMinutesPreview, setShowMinutesPreview] = useState(false);

  // Interactive What-If Scenario Simulator State
  const [simExtraSupportPct, setSimExtraSupportPct] = useState<number>(20); // Extra unit support %
  const [simCommunityBoostPct, setSimCommunityBoostPct] = useState<number>(30); // Community mobilization boost %
  const [simLandDisputeResolution, setSimLandDisputeResolution] = useState<boolean>(true); // Solve disputes
  const [simEngineerEfficiency, setSimEngineerEfficiency] = useState<number>(85); // % Quality compliance

  // Technical Chat State
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([
    {
      id: 'welcome_advisor',
      role: 'assistant',
      content: `أهلاً بك في **المستشار التنموي والهندسي الذكي (الإصدار V4)**. 🇾🇪
أنا المحرك التحليلي المركزي لمنصة إدارة المبادرات بمحافظة إب. يمكنني الإجابة على جميع الاستفسارات الفنية والتنموية، وتحليل انحرافات الكميات، وصياغة محاضر الاجتماعات والقرارات التنفيذية فوراً.

كيف يمكنني مساعدتك اليوم؟`,
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Comparison State
  const [compareDistrict1, setCompareDistrict1] = useState<string>('مديرية يريم');
  const [compareDistrict2, setCompareDistrict2] = useState<string>('مديرية القفر');

  // Filter initiatives by selected district
  const filteredInitiatives = useMemo(() => {
    return initiatives.filter((init) => {
      const matchesDistrict = selectedDistrict === 'all' || matchDistrictStrict(init.district, selectedDistrict);
      const matchesSearch =
        searchTerm === '' ||
        init.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        init.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        init.subDistrict?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDistrict && matchesSearch;
    });
  }, [initiatives, selectedDistrict, searchTerm]);

  // Analyze filtered initiatives with full AI decision engine
  const analyzedInitiatives = useMemo(() => {
    return filteredInitiatives.map((init) => {
      const analysis = analyzeInitiative(init);
      const decision: AIDevelopmentDecision = getAIDevelopmentDecision(init);
      const engineeringSpecs = getEngineeringPavingSpecs(init);
      const problemMatrix = getProblemDecisionMatrix(init);

      // Smart Rules Logic Evaluation
      const completionRate = parseNum(init.completionRate);
      const disbursed = parseNum(init.materialsDisbursed);
      const used = parseNum(init.materialsUsed);
      const remaining = Math.max(0, disbursed - used);
      const approved = parseNum(init.materialsApproved);
      const unitCredit = Math.max(0, approved - disbursed);

      const remainingRatio = disbursed > 0 ? (remaining / disbursed) * 100 : 100;
      
      // Rule 1: Ongoing + Remaining <= 10% + Unit Credit > 0
      const isRule1Triggered = (init.status === 'stagnant' || init.status === 'pending' || init.completionRate > 0) && remainingRatio <= 10 && unitCredit > 0;

      // Rule 2: Remaining <= 10% + Unit Credit == 0
      const isRule2Triggered = remainingRatio <= 10 && unitCredit === 0;

      // Rule 3: Disbursed full or used >= approved + completion < 70%
      const isRule3Triggered = (used >= approved || disbursed >= approved) && completionRate < 70;

      // Rule 4: Used > Approved
      const isRule4Triggered = used > approved;

      return {
        init,
        analysis,
        decision,
        engineeringSpecs,
        problemMatrix,
        isRule1Triggered,
        isRule2Triggered,
        isRule3Triggered,
        isRule4Triggered,
        remainingRatio
      };
    });
  }, [filteredInitiatives]);

  // Filter analyzed initiatives by rule or risk filter
  const finalFilteredList = useMemo(() => {
    return analyzedInitiatives.filter(item => {
      if (selectedRuleFilter === 'rule1' && !item.isRule1Triggered) return false;
      if (selectedRuleFilter === 'rule2' && !item.isRule2Triggered) return false;
      if (selectedRuleFilter === 'rule3' && !item.isRule3Triggered) return false;
      if (selectedRuleFilter === 'rule4' && !item.isRule4Triggered) return false;

      if (riskFilter === 'high' && item.decision.riskSeverity !== 'high' && item.decision.riskSeverity !== 'critical') return false;
      if (riskFilter === 'medium' && item.decision.riskSeverity !== 'medium') return false;
      if (riskFilter === 'low' && item.decision.riskSeverity !== 'low') return false;

      if (governanceRoleFilter === 'association' && !item.decision.responsibleEntity.includes('الجمعية')) return false;
      if (governanceRoleFilter === 'knights' && !item.decision.responsibleEntity.includes('فرسان')) return false;
      if (governanceRoleFilter === 'engineer' && !item.decision.responsibleEntity.includes('المهندس')) return false;
      if (governanceRoleFilter === 'authority' && !item.decision.responsibleEntity.includes('السلطة')) return false;
      if (governanceRoleFilter === 'unit' && !item.decision.responsibleEntity.includes('وحدة')) return false;

      return true;
    });
  }, [analyzedInitiatives, selectedRuleFilter, riskFilter, governanceRoleFilter]);

  // Portfolio Executive Summary
  const portfolioSummary: PortfolioExecutiveSummary = useMemo(() => {
    return summarizePortfolio(filteredInitiatives);
  }, [filteredInitiatives]);

  // Simulator Predictions
  const simulatedOutcome = useMemo(() => {
    const currentAvgComp = portfolioSummary.avgCompletionRate;
    const currentStagnantCount = analyzedInitiatives.filter(i => i.decision.riskSeverity === 'critical' || i.decision.riskSeverity === 'high').length;

    // Estimate impact of simulation parameters
    const extraComp = Math.min(100 - currentAvgComp, Math.round((simExtraSupportPct * 0.25) + (simCommunityBoostPct * 0.2) + (simLandDisputeResolution ? 12 : 0) + ((simEngineerEfficiency - 50) * 0.15)));
    const newPredictedAvgComp = Math.min(100, currentAvgComp + extraComp);
    
    const stagnantReduction = Math.round(currentStagnantCount * ((simExtraSupportPct + simCommunityBoostPct + (simLandDisputeResolution ? 40 : 0)) / 150));
    const newStagnantCount = Math.max(0, currentStagnantCount - stagnantReduction);

    const extraCementBagsDisbursed = Math.round(portfolioSummary.cement.unitCreditBalance * (simExtraSupportPct / 100));

    return {
      currentAvgComp,
      newPredictedAvgComp,
      stagnantReduction,
      newStagnantCount,
      extraCementBagsDisbursed,
      completedInitiativesEstimate: Math.round(filteredInitiatives.length * (newPredictedAvgComp / 100))
    };
  }, [portfolioSummary, analyzedInitiatives, simExtraSupportPct, simCommunityBoostPct, simLandDisputeResolution, simEngineerEfficiency, filteredInitiatives]);

  // Comparison Data between District 1 & District 2
  const comparisonData = useMemo(() => {
    const list1 = initiatives.filter(i => matchDistrictStrict(i.district, compareDistrict1));
    const list2 = initiatives.filter(i => matchDistrictStrict(i.district, compareDistrict2));

    const sum1 = summarizePortfolio(list1);
    const sum2 = summarizePortfolio(list2);

    return {
      d1: { name: compareDistrict1, sum: sum1, count: list1.length },
      d2: { name: compareDistrict2, sum: sum2, count: list2.length }
    };
  }, [initiatives, compareDistrict1, compareDistrict2]);

  // Send Notification Handler
  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotificationText.trim()) return;

    const newNotif = {
      id: 'notif_' + Date.now(),
      initiativeName: selectedInitiative ? selectedInitiative.name : 'تنبيه موجه عام',
      targetEntity: newNotificationEntity,
      message: newNotificationText,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'مرسل' as const
    };

    setDispatchedNotifications(prev => [newNotif, ...prev]);
    setNewNotificationText('');
    alert('تم إرسال التنبيه الرسمي بنجاح للجهة المسؤولة!');
  };

  // Chat Send Handler
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMsg]);
    const inputToProcess = chatInput;
    setChatInput('');
    setIsChatLoading(true);

    try {
      const historyToSend = [...chatMessages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyToSend })
      });

      if (!res.ok) throw new Error("HTTP error " + res.status);
      const data = await res.json();

      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content || 'تم تحليل طلبك الفني واستجابة المستشار جاهزة.',
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      // Fallback Engine
      let fallbackResponse = `### 💡 التوجيه الهندسي والتنموي للمستشار V4\n\nبناءً على طلبك المعني بـ "${inputToProcess}":\n\n1. **الجانب الهندسي:** يوصى بالالتزام بسماكة صبة الخرسانة **20 سم** في المنحدرات العالية، ورش المياه مرتين يومياً لمدة **14 يوماً متواصلة**.\n2. **الجانب التنموي:** يرجى التنسيق المباشر بين **الجمعية التعاونية بالمديرية** و**فرسان التنمية** لرفع وتوثيق نسبة الإنجاز أولاً بأول.`;
      
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fallbackResponse,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Add decision line to minutes
  const handleAddMinutesDecision = () => {
    if (!newDecisionInput.trim()) return;
    setMinutesDecisions(prev => [...prev, newDecisionInput.trim()]);
    setNewDecisionInput('');
  };

  // PowerPoint Presentation Generator (.pptx)
  const handleExportLeadershipPowerPoint = () => {
    try {
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';

      // Slide 1: Cover Slide
      const slide1 = pptx.addSlide();
      slide1.background = { color: '0F172A' };
      slide1.addText('جمهورية اليمن - قيادة محافظة إب', { x: 0.5, y: 0.8, w: 9.0, fontSize: 16, color: '10B981', align: 'right' });
      slide1.addText('العرض القيادي التنفيذي لإدارة وتحليل المبادرات التنموية', { x: 0.5, y: 1.8, w: 9.0, fontSize: 24, bold: true, color: 'FFFFFF', align: 'right' });
      slide1.addText('مركز القرار التنموي الذكي والمستشار القيادي V4 | 733 مبادرة', { x: 0.5, y: 2.8, w: 9.0, fontSize: 14, color: '94A3B8', align: 'right' });

      // Slide 2: Metrics Summary
      const slide2 = pptx.addSlide();
      slide2.background = { color: 'F8FAFC' };
      slide2.addText('أولاً: ملخص أداء المبادرات وميزان المواد', { x: 0.5, y: 0.5, w: 9.0, fontSize: 20, bold: true, color: '0F172A', align: 'right' });
      slide2.addText(`إجمالي المبادرات بالنطاق: ${filteredInitiatives.length} مبادرة`, { x: 0.5, y: 1.4, w: 8.5, fontSize: 14, color: '334155', align: 'right' });
      slide2.addText(`متوسط الإنجاز الفعلي: ${portfolioSummary.avgCompletionRate}%`, { x: 0.5, y: 2.0, w: 8.5, fontSize: 14, color: 'D97706', bold: true, align: 'right' });
      slide2.addText(`رصيد أسمنت الوحدة الاحتياطي: ${portfolioSummary.cement.unitCreditBalance.toLocaleString('ar-YE')} كيس`, { x: 0.5, y: 2.6, w: 8.5, fontSize: 14, color: '0284C7', bold: true, align: 'right' });
      slide2.addText(`المبادرات المتعثرة/الحرجة: ${analyzedInitiatives.filter(i => i.decision.riskSeverity === 'critical' || i.decision.riskSeverity === 'high').length} مبادرة`, { x: 0.5, y: 3.2, w: 8.5, fontSize: 14, color: 'E11D48', bold: true, align: 'right' });

      // Slide 3: Governance
      const slide3 = pptx.addSlide();
      slide3.background = { color: 'F8FAFC' };
      slide3.addText('ثانياً: مصفوفة اتخاذ القرار وحوكمة الصلاحيات', { x: 0.5, y: 0.5, w: 9.0, fontSize: 20, bold: true, color: '0F172A', align: 'right' });
      slide3.addText('• الجمعية التعاونية: التوريد والتنسيق المجتمعي وحشد التبرعات.', { x: 0.5, y: 1.4, w: 8.5, fontSize: 13, color: '059669', align: 'right' });
      slide3.addText('• فرسان التنمية: المتابعة الميدانية والتوثيق اليومي بالصور.', { x: 0.5, y: 2.0, w: 8.5, fontSize: 13, color: '0284C7', align: 'right' });
      slide3.addText('• المهندس المشرف: ضبط الجودة (20سم صبة + فواصل تمدد + رش 14 يوماً).', { x: 0.5, y: 2.6, w: 8.5, fontSize: 13, color: 'D97706', align: 'right' });
      slide3.addText('• السلطة المحلية: سحب وثائق التنازلات القانونية وحل النزاعات.', { x: 0.5, y: 3.2, w: 8.5, fontSize: 13, color: '7C3AED', align: 'right' });

      // Slide 4: Recommendations
      const slide4 = pptx.addSlide();
      slide4.background = { color: '0F172A' };
      slide4.addText('ثالثاً: التوصيات والقرارات التنفيذية الحاسمة', { x: 0.5, y: 0.5, w: 9.0, fontSize: 20, bold: true, color: '10B981', align: 'right' });
      slide4.addText('1. الاعتماد المباشر لصرف الدفعات الجديدة للمبادرات الموافقة للقاعدة الأولى.', { x: 0.5, y: 1.4, w: 8.5, fontSize: 13, color: 'FFFFFF', align: 'right' });
      slide4.addText('2. تشكيل لجنة نزول ميداني للمبادرات ذات الانحراف المرتفع (القاعدة الثالثة).', { x: 0.5, y: 2.1, w: 8.5, fontSize: 13, color: 'FCD34D', align: 'right' });
      slide4.addText('3. التوثيق القانوني المسبق للتنازلات قبل البدء بشراء وتوريد المواد.', { x: 0.5, y: 2.8, w: 8.5, fontSize: 13, color: 'FCA5A5', align: 'right' });

      pptx.writeFile({ fileName: `عرض_قيادة_المحافظة_مبادرات_إب_${new Date().toISOString().substring(0, 10)}.pptx` });
    } catch (err) {
      console.error('PowerPoint Export Error:', err);
      alert('تعذر تنزيل عرض PowerPoint، يرجى إعادة المحاولة.');
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans text-right" dir="rtl">
      {/* ========================================================================= */}
      {/* V4 ADVISOR HEADER & BRANDING */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/40 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-3 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-black px-3.5 py-1.5 rounded-full animate-pulse">
                <Brain className="w-4 h-4 text-emerald-400" />
                مصدر القرار: محرك القرار التنموي V1 (Smart Decision Engine V1)
              </span>
              <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-black px-3 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                ربط الدورة المغلقة للقرار التنموي (733 مبادرة)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-snug">
              مركز القرار التنموي الذكي والمستشار القيادي المتقدم V4
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium text-justify">
              المحرك التحليلي المركزي لمنصة محافظة إب: يحول البيانات الميدانية الحية تلقائياً وفق الدورة الكاملة: 
              <strong className="text-emerald-300"> البيانات ← التحليل ← التشخيص ← القرار المقترح ← المسؤول ← الإجراء ← المتابعة ← قياس الأثر</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExportLeadershipPowerPoint}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer border border-amber-300"
            >
              <Presentation className="w-4 h-4 text-slate-950" />
              <span>تصدير عرض القيادة (PowerPoint) 📊</span>
            </button>

            <button
              onClick={() => setActiveSubTab('reports_and_minutes')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer border border-emerald-400/30"
            >
              <Printer className="w-4 h-4 text-emerald-200" />
              <span>التقارير والمحاضر الرسمية 🖨️</span>
            </button>
            
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('decision_center')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-2xl border border-slate-700 transition-all cursor-pointer"
              >
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>مركز تحليل النتائج والقرار</span>
              </button>
            )}
          </div>
        </div>

        {/* STATS HIGHLIGHT BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs relative z-10">
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-emerald-400" /> إجمالي المبادرات بالنطاق
            </span>
            <span className="text-base font-black text-white">{filteredInitiatives.length} <span className="text-xs font-normal text-slate-400">مبادرة</span></span>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> متوسط الإنجاز الفعلي
            </span>
            <span className="text-base font-black text-amber-400">{portfolioSummary.avgCompletionRate}%</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> المبادرات الحرجة
            </span>
            <span className="text-base font-black text-rose-400">
              {analyzedInitiatives.filter(i => i.decision.riskSeverity === 'critical' || i.decision.riskSeverity === 'high').length} <span className="text-xs font-normal text-slate-400">مبادرة</span>
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-sky-400" /> رصيد الأسمنت لدى الوحدة
            </span>
            <span className="text-base font-black text-sky-300">
              {portfolioSummary.cement.unitCreditBalance.toLocaleString('ar-YE')} <span className="text-xs font-normal text-slate-400">كيس</span>
            </span>
          </div>
        </div>

        {/* SUB-TABS NAVIGATION BAR */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none relative z-10">
          <button
            onClick={() => setActiveSubTab('diagnosis')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'diagnosis'
                ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400/40'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Gauge className="w-4 h-4 text-emerald-300" />
            <span>1. التشخيص الشامل ومصفوفة القرارات 🧠</span>
          </button>

          <button
            onClick={() => setActiveSubTab('operational')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'operational'
                ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400/40'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-300" />
            <span>2. المتابعة التشغيلية والمسارات الخمسة 🚧</span>
          </button>

          <button
            onClick={() => setActiveSubTab('comparison')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'comparison'
                ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400/40'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Scale className="w-4 h-4 text-sky-300" />
            <span>3. المقارنة بين المديريات والمبادرات ⚖️</span>
          </button>

          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'simulator'
                ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400/40'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-4 h-4 text-indigo-300" />
            <span>4. محاكي "ماذا لو؟" للقرارات 🎯</span>
          </button>

          <button
            onClick={() => setActiveSubTab('reports_and_minutes')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'reports_and_minutes'
                ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400/40'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4 text-rose-300" />
            <span>5. التقارير القيادية والمحاضر والتنبيهات 📋</span>
          </button>

          <button
            onClick={() => setActiveSubTab('technical_engineering')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'technical_engineering'
                ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400/40'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <HardHat className="w-4 h-4 text-emerald-300" />
            <span>6. المستشار التقني والدروس المستفادة 💬</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GLOBAL DISTRICT SELECTOR & INITIATIVE SEARCH ENGINE (كما في الصورة 1) */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* District Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-black text-slate-900 shrink-0">نطاق المديرية:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
            >
              <option value="all">🏛️ كل المديريات (733 مبادرة)</option>
              {CANONICAL_DISTRICTS.map((d) => (
                <option key={d} value={d}>📍 {d}</option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث باسم المبادرة، الكود، العزلة أو الشارع..."
              className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            />
          </div>

          {/* Direct Initiative Dropdown Selector */}
          <div className="flex items-center gap-2 flex-1">
            <Target className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="text-xs font-black text-slate-900 shrink-0">اختر المبادرة لتحليلها:</span>
            <select
              value={selectedInitiative?.id || ''}
              onChange={(e) => {
                const found = initiatives.find(i => i.id === e.target.value);
                if (found) setSelectedInitiative(found);
              }}
              className="w-full bg-amber-50/80 border border-amber-300 rounded-xl py-2.5 px-3 text-xs font-black text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
            >
              {filteredInitiatives.length === 0 ? (
                <option value="">لا توجد مبادرات مطابقة للبحث</option>
              ) : (
                filteredInitiatives.map((init) => (
                  <option key={init.id} value={init.id}>
                    [{init.initiativeNumber || '1'}] {init.name} - ({init.district}) - إنجاز: {init.completionRate}%
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* ACTIVE SELECTED INITIATIVE ANALYSIS HEADER BANNER (كما في الصورة 1) */}
        {selectedInitiative && (() => {
          const selectedDecision = getAIDevelopmentDecision(selectedInitiative);
          const selectedAnalysis = analyzeInitiative(selectedInitiative);

          return (
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white rounded-2xl p-5 border border-slate-700/80 shadow-lg space-y-3 relative overflow-hidden animate-fadeIn">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-700/80 pb-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold">
                      كود: {selectedInitiative.initiativeNumber || '1'}
                    </span>
                    <span className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                      مديرية {selectedInitiative.district} • عزلة {selectedInitiative.subDistrict || 'حارث الحيدري'}
                    </span>
                    <span className="bg-amber-500/20 text-amber-200 border border-amber-400/30 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                      القطاع: {selectedInitiative.sector || 'طرق'}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      تاريخ التسجيل: {selectedInitiative.createdAt || '2026-08-03'}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
                    {selectedInitiative.name}
                  </h3>
                </div>

                {/* Prominent Action Buttons (كما في الصورة 1) */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {/* Button 1: Immediate Failure Diagnosis */}
                  <button
                    onClick={() => setShowInstantDiagnosisModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer border border-amber-300 animate-pulse hover:animate-none"
                  >
                    <AlertTriangle className="w-4 h-4 text-slate-950" />
                    <span>تشخيص أسباب التعثر فوراً ⚡</span>
                  </button>

                  {/* Button 2: Open Master Initiative Card */}
                  <button
                    onClick={() => handleSelectInitiativeWithTransition(selectedInitiative, 'track_1', 'بطاقة المبادرة والمسارات الخمسة')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer border border-emerald-400/30 active:scale-95"
                  >
                    <ArrowUpRight className="w-4 h-4 text-emerald-200" />
                    <span>فتح بطاقة المبادرة (المسارات الخمسة) ↗</span>
                  </button>
                </div>
              </div>

              {/* Status & Key Metrics Line */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-bold">
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">حالة الإنجاز:</span>
                  <span className="text-emerald-400 font-mono font-black">{selectedInitiative.completionRate}%</span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">التصنيف العملياتي:</span>
                  <span className={`text-[11px] font-black ${
                    selectedDecision.riskSeverity === 'critical' || selectedDecision.riskSeverity === 'high' ? 'text-rose-400' : 'text-amber-300'
                  }`}>
                    {selectedDecision.classificationLabel}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">الأسمنت المتبقي:</span>
                  <span className="text-sky-300 font-mono font-black">{selectedDecision.cementRemaining} كيس</span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">الجهة المسؤولة:</span>
                  <span className="text-indigo-300 text-[11px] font-black">{selectedDecision.responsibleEntity}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: DIAGNOSIS & CLOSED-LOOP DECISION MATRIX */}
      {/* ========================================================================= */}
      {activeSubTab === 'diagnosis' && (
        <div className="space-y-8 animate-fadeIn">
          {/* SMART DEVELOPMENT ADVISOR V5 INTEGRATION */}
          <SmartDevelopmentAdvisorV5
            initiatives={initiatives}
            targetInitiativeId={selectedInitiative?.id || targetInitiativeId}
            onSelectInitiative={handleSelectInitiativeWithTransition}
            onNavigateTab={onNavigateTab}
            onUpdateInitiative={onUpdateInitiative}
            userRole={userRole}
          />
          {/* SMART DECISION RULES HIGHLIGHT CARDS (قواعد القرار الذكي الأربع) */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-sm text-white">قواعد المحرك الذكي لاتخاذ القرار (Smart Decision Rules)</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">تصفية المبادرات بحسب القاعدة التلقائية المطبقة</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Rule 1 */}
              <button
                onClick={() => setSelectedRuleFilter(selectedRuleFilter === 'rule1' ? 'all' : 'rule1')}
                className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                  selectedRuleFilter === 'rule1'
                    ? 'bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-400/40'
                    : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    القاعدة 1: صرف دفعة
                  </span>
                  <span className="text-xs font-black text-emerald-400">
                    {analyzedInitiatives.filter(i => i.isRule1Triggered).length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 font-bold leading-normal">
                  مبادرة جارية والمتبقي ≤ 10% ويوجد رصيد لدى الوحدة 🟢
                </p>
                <p className="text-[10px] text-emerald-300 mt-1">توصية: إغلاق واستكمال الصرف المباشر</p>
              </button>

              {/* Rule 2 */}
              <button
                onClick={() => setSelectedRuleFilter(selectedRuleFilter === 'rule2' ? 'all' : 'rule2')}
                className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                  selectedRuleFilter === 'rule2'
                    ? 'bg-amber-950/90 border-amber-400 ring-2 ring-amber-400/40'
                    : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                    القاعدة 2: لا يوجد رصيد
                  </span>
                  <span className="text-xs font-black text-amber-400">
                    {analyzedInitiatives.filter(i => i.isRule2Triggered).length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 font-bold leading-normal">
                  المتبقي بالموقع ≤ 10% ولا يوجد رصيد معتمد لدى الوحدة 🟡
                </p>
                <p className="text-[10px] text-amber-300 mt-1">توصية: حشد مساهمة مجتمعية / معالجة تمويل</p>
              </button>

              {/* Rule 3 */}
              <button
                onClick={() => setSelectedRuleFilter(selectedRuleFilter === 'rule3' ? 'all' : 'rule3')}
                className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                  selectedRuleFilter === 'rule3'
                    ? 'bg-rose-950/90 border-rose-400 ring-2 ring-rose-400/40'
                    : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-black bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                    القاعدة 3: فتح تحليل انحراف
                  </span>
                  <span className="text-xs font-black text-rose-400">
                    {analyzedInitiatives.filter(i => i.isRule3Triggered).length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 font-bold leading-normal">
                  صرف كامل الإسمنت ونسبة الإنجاز منخفضة (&lt; 70%) 🔴
                </p>
                <p className="text-[10px] text-rose-300 mt-1">توصية: فحص نوع العمل، تغيير كميات، أو هدر</p>
              </button>

              {/* Rule 4 */}
              <button
                onClick={() => setSelectedRuleFilter(selectedRuleFilter === 'rule4' ? 'all' : 'rule4')}
                className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                  selectedRuleFilter === 'rule4'
                    ? 'bg-purple-950/90 border-purple-400 ring-2 ring-purple-400/40'
                    : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-black bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                    القاعدة 4: فائض الاستخدام
                  </span>
                  <span className="text-xs font-black text-purple-400">
                    {analyzedInitiatives.filter(i => i.isRule4Triggered).length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 font-bold leading-normal">
                  استخدام مواد أكثر من السقف المعتمد 🟣
                </p>
                <p className="text-[10px] text-purple-300 mt-1">توصية: عدم التعويض وإضافة الفائض لمساهمة المجتمع</p>
              </button>
            </div>
          </div>

          {/* TABLE OF DIAGNOSED INITIATIVES & CLOSED-LOOP ACTIONS */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-3xs overflow-hidden space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">سجل التشخيص التنموي ومخرجات القرارات الموجهة</h3>
                <p className="text-xs text-slate-500">يعرض النتيجة المباشرة للدورة الكاملة لكل مبادرة مع تحديد الجهة المسؤولة والإجراء المطلوب</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-bold">النتائج المعروضة: ({finalFilteredList.length})</span>
                {selectedRuleFilter !== 'all' && (
                  <button
                    onClick={() => setSelectedRuleFilter('all')}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-xl font-bold cursor-pointer"
                  >
                    إلغاء التصفية ✖
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-black">
                    <th className="p-3 rounded-r-xl">المبادرة والمديرية</th>
                    <th className="p-3">الإنجاز والأسمنت</th>
                    <th className="p-3">التشخيص الذكي</th>
                    <th className="p-3">القرار المقترح</th>
                    <th className="p-3">الجهة المسؤولة</th>
                    <th className="p-3">الإجراء المطلوب</th>
                    <th className="p-3 rounded-l-xl text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {finalFilteredList.slice(0, 15).map(({ init, decision, remainingRatio, isRule1Triggered, isRule2Triggered, isRule3Triggered, isRule4Triggered }) => (
                    <tr key={init.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block text-xs">{init.name}</span>
                        <span className="text-[10px] text-slate-500">{init.district} - {init.subDistrict || 'عزلة عامة'}</span>
                        {isRule1Triggered && <span className="inline-block mt-1 text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">صرف دفعة جديدة</span>}
                        {isRule2Triggered && <span className="inline-block mt-1 text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">لا يوجد رصيد</span>}
                        {isRule3Triggered && <span className="inline-block mt-1 text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">تحليل انحراف</span>}
                        {isRule4Triggered && <span className="inline-block mt-1 text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">فائض استخدام</span>}
                      </td>

                      <td className="p-3">
                        <div className="space-y-1">
                          <span className="font-black text-emerald-700 block">{init.completionRate}% إنجاز</span>
                          <span className="text-[10px] text-slate-600 block">
                            متبقي بالموقع: <strong className="text-amber-600">{decision.cementRemaining} كيس</strong> ({remainingRatio.toFixed(0)}%)
                          </span>
                        </div>
                      </td>

                      <td className="p-3 max-w-xs">
                        <p className="text-[11px] text-slate-700 line-clamp-2 leading-relaxed">{decision.diagnosticSummary}</p>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-md border border-amber-200/60 block text-[11px]">
                          {decision.proposedExecutiveDecision}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-sky-800 bg-sky-50 px-2 py-1 rounded-md border border-sky-200/60 block text-[11px]">
                          {decision.responsibleEntity}
                        </span>
                      </td>

                      <td className="p-3 max-w-xs">
                        <p className="text-[11px] text-emerald-800 font-semibold leading-relaxed">{decision.nextProposedAction}</p>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedInitiative(init);
                            setIsDecisionModalOpen(true);
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> التفاصيل
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
      {/* SUB-TAB 2: OPERATIONAL TRACKING & 5 PATHWAYS */}
      {/* ========================================================================= */}
      {activeSubTab === 'operational' && (
        <div className="space-y-6 animate-fadeIn">
          {/* GOVERNANCE MODEL FRAMEWORK (الحوكمة المعتمدة لمبادرات محافظة إب) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-3xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-base text-slate-900">نموذج حوكمة المبادرات وتوزيع الصلاحيات بالمنصة</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 font-black text-emerald-900">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  <span>الجمعية التعاونية</span>
                </div>
                <span className="text-[10px] text-emerald-800 font-bold block">الشريك التنفيذي الرئيسي</span>
                <p className="text-[11px] text-slate-700 leading-relaxed pt-1">إدارة التحشيد، المتابعة الميدانية، واستلام وتوزيع المواد بالمديرية.</p>
              </div>

              <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 font-black text-sky-900">
                  <Shield className="w-4 h-4 text-sky-700" />
                  <span>فرسان التنمية</span>
                </div>
                <span className="text-[10px] text-sky-800 font-bold block">الذراع الميداني التوثيقي</span>
                <p className="text-[11px] text-slate-700 leading-relaxed pt-1">الرفع اليومي بالصور، توثيق نسبة الإنجاز، ومتابعة المستودعات.</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 font-black text-amber-900">
                  <HardHat className="w-4 h-4 text-amber-700" />
                  <span>المهندس المباشر</span>
                </div>
                <span className="text-[10px] text-amber-800 font-bold block">مسؤول التقييم الفني</span>
                <p className="text-[11px] text-slate-700 leading-relaxed pt-1">فحص المواصفات الهندسية (20سم صبة)، فواصل التمدد، ورش المياه.</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 font-black text-purple-900">
                  <Building className="w-4 h-4 text-purple-700" />
                  <span>السلطة المحلية</span>
                </div>
                <span className="text-[10px] text-purple-800 font-bold block">داعم التنسيق والحل</span>
                <p className="text-[11px] text-slate-700 leading-relaxed pt-1">حل النزاعات الأهلية، سحب التنازلات القانونية، وحماية المبادرة.</p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 font-black text-indigo-900">
                  <Award className="w-4 h-4 text-indigo-700" />
                  <span>وحدة التدخلات المركزية</span>
                </div>
                <span className="text-[10px] text-indigo-800 font-bold block">الاعتماد والمتابعة</span>
                <p className="text-[11px] text-slate-700 leading-relaxed pt-1">اعتماد الدفعات، الفرز المكتبي، وتقييم مؤشرات الأداء الكلي.</p>
              </div>
            </div>
          </div>

          {/* 5 ACTIVATION PATHWAYS BREAKDOWN (المسارات الخمسة لإدارة المبادرات بالنتائج) */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
            {/* Transition Animation Banner Overlay */}
            {isTransitioningTrack && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs z-20 flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-slate-900 border border-emerald-500/50 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 space-x-reverse space-x-3">
                  <Sparkles className="w-6 h-6 text-emerald-400 animate-spin" />
                  <div>
                    <h4 className="font-black text-sm text-emerald-300">جاري الانتقال السلس بين المسارات الخمسة...</h4>
                    <p className="text-xs text-slate-300 font-bold">{transitioningTrackName} • الهوية البصرية (Slate / Indigo / Emerald)</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-base text-white">المسارات التنموية الخمسة لإدارة المبادرات بالنتائج</h3>
              </div>
              <span className="text-xs text-emerald-300 font-bold">اضغط على أي مسار للانتقال والتوجيه المباشر</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              {[
                {
                  id: 'track_1',
                  stageNum: 1,
                  badge: 'المسار 1: التوعية واللجان',
                  fullName: 'مسار التوعية واللجان المجتمعية',
                  summary: 'تشكيل اللجان المجتمعية والربط المباشر بالفرسان',
                  responsible: 'الجمعية + الفرسان',
                  badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                },
                {
                  id: 'track_2',
                  stageNum: 2,
                  badge: 'المسار 2: الحشد والمساهمة',
                  fullName: 'مسار الحشد والمساهمات النقدية والعينية',
                  summary: 'جمع التبرعات العينية والنقدية وإشراك المغتربين',
                  responsible: 'لجنة المبادرة + الجمعية',
                  badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
                },
                {
                  id: 'track_3',
                  stageNum: 3,
                  badge: 'المسار 3: التنازلات والأرض',
                  fullName: 'مسار التنازلات وحرم الطريق والمساحة',
                  summary: 'توثيق وثائق التنازل القانونية عن حرم الطريق',
                  responsible: 'السلطة المحلية + الجمعية',
                  badgeColor: 'bg-slate-700/80 text-slate-200 border-slate-600'
                },
                {
                  id: 'track_4',
                  stageNum: 4,
                  badge: 'المسار 4: الإشراف الهندسي',
                  fullName: 'مسار الإشراف الجودة والمواصفات الهندسية',
                  summary: 'تطبيق مواصفات الرصف (20سم) والرش بالماء',
                  responsible: 'المهندس المباشر',
                  badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
                },
                {
                  id: 'track_5',
                  stageNum: 5,
                  badge: 'المسار 5: الفرز والاعتماد',
                  fullName: 'مسار المطابقة وصرف دفعات الأسمنت',
                  summary: 'المطابقة المكتبية وصرف الدفعات المستحقة',
                  responsible: 'وحدة التدخلات المركزية',
                  badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                }
              ].map((trk) => {
                const isActive = activeTrackId === trk.id;
                return (
                  <button
                    key={trk.id}
                    onClick={() => handleSelectInitiativeWithTransition(selectedInitiative, trk.id, trk.fullName)}
                    className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between min-h-[120px] ${
                      isActive
                        ? 'bg-slate-800 border-emerald-400 ring-2 ring-emerald-400/50 scale-[1.03] shadow-lg'
                        : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 hover:scale-[1.01]'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border block w-fit ${trk.badgeColor}`}>
                        {trk.badge}
                      </span>
                      <p className="font-bold text-slate-100 text-[11px] leading-snug">
                        {trk.summary}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">مسؤولية: {trk.responsible}</span>
                      {isActive && <span className="text-emerald-400 font-black">نشط ✔</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Active Track Detail Card */}
            {activeTrackId && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl">
                    <Zap className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">
                      المسار النشط: {
                        activeTrackId === 'track_1' ? 'المسار 1: التوعية واللجان المجتمعية' :
                        activeTrackId === 'track_2' ? 'المسار 2: الحشد والمساهمة المجتمعية' :
                        activeTrackId === 'track_3' ? 'المسار 3: التنازلات والأرض وحرم الطريق' :
                        activeTrackId === 'track_4' ? 'المسار 4: الإشراف الهندسي والجودة' :
                        'المسار 5: الفرز والاعتماد وصرف الدفعات'
                      }
                    </h4>
                    <p className="text-slate-400 text-[11px]">
                      تنسيق الإجراءات التشغيلية وفق الهوية البصرية الرسمية (Slate / Indigo / Emerald) لدعم سرعة التنفيذ.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectInitiativeWithTransition(selectedInitiative, activeTrackId, 'بطاقة المبادرة المباشرة')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl text-xs cursor-pointer shadow-md transition-all shrink-0 border border-emerald-400/30"
                >
                  انتقال إلى بطاقة المبادرة ↗
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: DISTRICT & INITIATIVE COMPARISON ENGINE */}
      {/* ========================================================================= */}
      {activeSubTab === 'comparison' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-3xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-base text-slate-900">محرك المقارنة التفاعلي بين مديريات محافظة إب</h3>
                <p className="text-xs text-slate-500">اختر مديريتين لمقارنة أداء المبادرات، ميزان الأسمنت، والقدرة التشغيلية</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* District 1 Selector */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <label className="block text-xs font-black text-emerald-900">المديرية الأولى للمقارنة:</label>
                <select
                  value={compareDistrict1}
                  onChange={(e) => setCompareDistrict1(e.target.value)}
                  className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                >
                  {CANONICAL_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* District 2 Selector */}
              <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-4 space-y-2">
                <label className="block text-xs font-black text-sky-900">المديرية الثانية للمقارنة:</label>
                <select
                  value={compareDistrict2}
                  onChange={(e) => setCompareDistrict2(e.target.value)}
                  className="w-full bg-white border border-sky-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                >
                  {CANONICAL_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* COMPARISON METRICS TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-black">
                    <th className="p-3.5 rounded-r-xl">مؤشر الأداء القيادي</th>
                    <th className="p-3.5 text-emerald-400 text-center">{comparisonData.d1.name}</th>
                    <th className="p-3.5 text-sky-400 text-center">{comparisonData.d2.name}</th>
                    <th className="p-3.5 rounded-l-xl text-center">الفارق / التفوق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                  <tr>
                    <td className="p-3.5 text-slate-900">عدد المبادرات المسجلة</td>
                    <td className="p-3.5 text-center font-black text-emerald-700">{comparisonData.d1.count} مبادرة</td>
                    <td className="p-3.5 text-center font-black text-sky-700">{comparisonData.d2.count} مبادرة</td>
                    <td className="p-3.5 text-center text-slate-600">{Math.abs(comparisonData.d1.count - comparisonData.d2.count)} مبادرة</td>
                  </tr>

                  <tr>
                    <td className="p-3.5 text-slate-900">متوسط نسبة الإنجاز الفعلي</td>
                    <td className="p-3.5 text-center font-black text-emerald-700">{comparisonData.d1.sum.avgCompletionRate}%</td>
                    <td className="p-3.5 text-center font-black text-sky-700">{comparisonData.d2.sum.avgCompletionRate}%</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded font-black ${
                        comparisonData.d1.sum.avgCompletionRate >= comparisonData.d2.sum.avgCompletionRate
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {Math.abs(comparisonData.d1.sum.avgCompletionRate - comparisonData.d2.sum.avgCompletionRate).toFixed(1)}%
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3.5 text-slate-900">إجمالي الأسمنت المنصرف للميدان</td>
                    <td className="p-3.5 text-center text-emerald-700">{comparisonData.d1.sum.cement.disbursed.toLocaleString('ar-YE')} كيس</td>
                    <td className="p-3.5 text-center text-sky-700">{comparisonData.d2.sum.cement.disbursed.toLocaleString('ar-YE')} كيس</td>
                    <td className="p-3.5 text-center text-slate-600">{Math.abs(comparisonData.d1.sum.cement.disbursed - comparisonData.d2.sum.cement.disbursed).toLocaleString('ar-YE')} كيس</td>
                  </tr>

                  <tr>
                    <td className="p-3.5 text-slate-900">رصيد الأسمنت المتبقي لدى الوحدة</td>
                    <td className="p-3.5 text-center font-black text-amber-700">{comparisonData.d1.sum.cement.unitCreditBalance.toLocaleString('ar-YE')} كيس</td>
                    <td className="p-3.5 text-center font-black text-amber-700">{comparisonData.d2.sum.cement.unitCreditBalance.toLocaleString('ar-YE')} كيس</td>
                    <td className="p-3.5 text-center text-slate-600">{Math.abs(comparisonData.d1.sum.cement.unitCreditBalance - comparisonData.d2.sum.cement.unitCreditBalance).toLocaleString('ar-YE')} كيس</td>
                  </tr>

                  <tr>
                    <td className="p-3.5 text-slate-900">المساهمة المجتمعية الأهلية</td>
                    <td className="p-3.5 text-center text-emerald-700">{(comparisonData.d1.sum.totalCommunityContribution / 1000000).toFixed(1)}M YER</td>
                    <td className="p-3.5 text-center text-sky-700">{(comparisonData.d2.sum.totalCommunityContribution / 1000000).toFixed(1)}M YER</td>
                    <td className="p-3.5 text-center text-slate-600">{Math.abs((comparisonData.d1.sum.totalCommunityContribution - comparisonData.d2.sum.totalCommunityContribution) / 1000000).toFixed(1)}M YER</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: WHAT-IF SCENARIO SIMULATOR */}
      {/* ========================================================================= */}
      {activeSubTab === 'simulator' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-indigo-900/50 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-indigo-900 pb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="font-black text-base text-white">محاكي التنبؤ بالسيناريوهات والقرارات "ماذا لو؟"</h3>
                  <p className="text-xs text-indigo-200">قم بتغيير متغيّرات الدعم والمساهمات لرؤية تأثيرها التنبؤي المباشر على المحافظة</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
              {/* Slider 1 */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                <label className="font-bold text-emerald-400 block">زيادة صرف الأسمنت المعتمد (+{simExtraSupportPct}%):</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={simExtraSupportPct}
                  onChange={(e) => setSimExtraSupportPct(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-300 block">سيتم صرف {simExtraSupportPct}% من الرصيد المحتجـز</span>
              </div>

              {/* Slider 2 */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                <label className="font-bold text-sky-400 block">تنشيط المساهمة المجتمعية (+{simCommunityBoostPct}%):</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={simCommunityBoostPct}
                  onChange={(e) => setSimCommunityBoostPct(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-300 block">تعبئة المبادرات وتوفير العمالة الأهلية</span>
              </div>

              {/* Toggle 3 */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                <label className="font-bold text-amber-400 block">حل النزاعات الأهلية وتوقيع التنازلات:</label>
                <button
                  onClick={() => setSimLandDisputeResolution(!simLandDisputeResolution)}
                  className={`w-full py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    simLandDisputeResolution
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {simLandDisputeResolution ? 'مفعل (تم حل النزاعات) ✔' : 'غير مفعل ✖'}
                </button>
                <span className="text-[10px] text-slate-300 block">فتح الطرقات المتعثرة بسبب حرم الطريق</span>
              </div>

              {/* Slider 4 */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                <label className="font-bold text-purple-400 block">كفاءة الإشراف الهندسي ({simEngineerEfficiency}%):</label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={simEngineerEfficiency}
                  onChange={(e) => setSimEngineerEfficiency(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-300 block">الالتزام بمعايير الرصف والرش بالماء</span>
              </div>
            </div>

            {/* PREDICTED OUTCOME PANEL */}
            <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-2xl p-5 space-y-3">
              <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                نتائج التنبؤ التفاعلي بناءً على السيناريو المفترض:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px]">متوسط الإنجاز المتوقع</span>
                  <span className="text-base font-black text-emerald-400">{simulatedOutcome.newPredictedAvgComp}% <span className="text-[10px] text-emerald-300">(+{simulatedOutcome.newPredictedAvgComp - simulatedOutcome.currentAvgComp}%)</span></span>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px]">تقليص المبادرات الحرجة</span>
                  <span className="text-base font-black text-amber-400">انخفاض بـ {simulatedOutcome.stagnantReduction} مبادرة</span>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px]">أكياس الأسمنت التي سيتم تحريكها</span>
                  <span className="text-base font-black text-sky-400">{simulatedOutcome.extraCementBagsDisbursed.toLocaleString('ar-YE')} كيس</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: REPORTS, OFFICIAL MINUTES & DISPATCH NOTIFICATIONS */}
      {/* ========================================================================= */}
      {activeSubTab === 'reports_and_minutes' && (
        <div className="space-y-6 animate-fadeIn">
          {/* SECTION A: OFFICIAL MEETING MINUTES GENERATOR (منشئ محاضر الاجتماعات الرسمية) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-3xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900">منشئ محاضر الاجتماعات والقرارات الرسمية</h3>
              </div>
              <button
                onClick={() => setShowMinutesPreview(!showMinutesPreview)}
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                {showMinutesPreview ? 'تعديل المحضر' : 'معاينة وطباعة المحضر 🖨️'}
              </button>
            </div>

            {!showMinutesPreview ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">عنوان المحضر الرسمي:</label>
                    <input
                      type="text"
                      value={minutesTitle}
                      onChange={(e) => setMinutesTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">مكان الاجتماع:</label>
                    <input
                      type="text"
                      value={minutesLocation}
                      onChange={(e) => setMinutesLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">الحاضرون والجهات الممثلة:</label>
                  <input
                    type="text"
                    value={minutesAttendees}
                    onChange={(e) => setMinutesAttendees(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">جدول الأعمال والموضوعات:</label>
                  <textarea
                    value={minutesAgenda}
                    onChange={(e) => setMinutesAgenda(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                {/* Decisions List Inputs */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">القرارات والتوصيات المعتمدة بالمحضر:</label>
                  <div className="space-y-1.5">
                    {minutesDecisions.map((dec, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <span className="font-black text-emerald-700">{idx + 1}.</span>
                        <span className="flex-1 font-medium">{dec}</span>
                        <button
                          onClick={() => setMinutesDecisions(prev => prev.filter((_, i) => i !== idx))}
                          className="text-rose-500 font-bold px-2 hover:bg-rose-50 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={newDecisionInput}
                      onChange={(e) => setNewDecisionInput(e.target.value)}
                      placeholder="إضافة قرار أو توجيه جديد للمحضر..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    />
                    <button
                      onClick={handleAddMinutesDecision}
                      className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl cursor-pointer"
                    >
                      إضافة قرار
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* PRINT-READY OFFICIAL MINUTES PREVIEW */
              <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-300 space-y-6 text-slate-900 text-xs font-sans" id="official-minutes-print-area">
                <div className="text-center space-y-1 border-b border-slate-300 pb-4">
                  <p className="font-bold text-slate-600 text-[11px]">جمهورية اليمن - قيادة محافظة إب - وحدة التدخلات المركزية</p>
                  <h2 className="text-base font-black text-slate-950">{minutesTitle}</h2>
                  <p className="text-[10px] text-slate-500">تاريخ الصدور: {new Date().toLocaleDateString('ar-YE')}م | المكان: {minutesLocation}</p>
                </div>

                <div className="space-y-2">
                  <p><strong>الحاضرون:</strong> {minutesAttendees}</p>
                  <p><strong>جدول الأعمال:</strong> {minutesAgenda}</p>
                </div>

                <div className="space-y-2">
                  <p className="font-black text-sm text-emerald-900 border-b border-emerald-200 pb-1">القرارات والتوصيات النافذة:</p>
                  <ol className="list-decimal pr-5 space-y-2 font-bold text-slate-800">
                    {minutesDecisions.map((dec, idx) => (
                      <li key={idx} className="leading-relaxed">{dec}</li>
                    ))}
                  </ol>
                </div>

                {/* Signature Boxes */}
                <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-300 text-center font-bold text-[11px]">
                  <div>
                    <p className="text-slate-600">محافظ المحافظة</p>
                    <p className="mt-8 text-slate-400">التوقيع والختم: ...................</p>
                  </div>
                  <div>
                    <p className="text-slate-600">مدير وحدة التدخلات المركزية</p>
                    <p className="mt-8 text-slate-400">التوقيع والختم: ...................</p>
                  </div>
                  <div>
                    <p className="text-slate-600">مسؤول الإشراف والمتابعة</p>
                    <p className="mt-8 text-slate-400">م. عيسى القادري</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => window.print()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2.5 rounded-xl cursor-pointer inline-flex items-center gap-2 shadow-md"
                  >
                    <Printer className="w-4 h-4" /> طباعة المحضر الرسمي 🖨️
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION B: DISPATCH DIRECT NOTIFICATIONS TO ENTITIES */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-3xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bell className="w-5 h-5 text-amber-500" />
              <h3 className="font-black text-base text-slate-900">نظام إرسال التنبيهات والإشعارات المباشرة للجهات</h3>
            </div>

            <form onSubmit={handleSendNotification} className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
              <div className="md:col-span-4">
                <label className="font-bold text-slate-700 block mb-1">الجهة المستقبلة للتنبيه:</label>
                <select
                  value={newNotificationEntity}
                  onChange={(e) => setNewNotificationEntity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                >
                  <option value="الجمعية التعاونية بالمديرية">الجمعية التعاونية بالمديرية (الشريك التنفيذي)</option>
                  <option value="فرسان التنمية بالمديرية">فرسان التنمية (المتابعة الميدانية)</option>
                  <option value="المهندس المباشر والمشرف">المهندس المباشر (الإشراف الفني)</option>
                  <option value="السلطة المحلية والمجلس المحلي">السلطة المحلية (دعم الحل والتنسيق)</option>
                  <option value="وحدة التدخلات المركزية">وحدة التدخلات المركزية (الاعتماد والفرز)</option>
                </select>
              </div>

              <div className="md:col-span-6">
                <label className="font-bold text-slate-700 block mb-1">نص التنبيه أو التوجيه الرسمي:</label>
                <input
                  type="text"
                  value={newNotificationText}
                  onChange={(e) => setNewNotificationText(e.target.value)}
                  placeholder="اكتب التوجيه الصادر للجهة المعنية..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="md:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> إرسال التنبيه
                </button>
              </div>
            </form>

            {/* Notifications Log Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold">
                    <th className="p-2.5 rounded-r-lg">المبادرة</th>
                    <th className="p-2.5">الجهة المستقبلة</th>
                    <th className="p-2.5">نص التوجيه الصادر</th>
                    <th className="p-2.5">التاريخ والوقت</th>
                    <th className="p-2.5 rounded-l-lg text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {dispatchedNotifications.map(n => (
                    <tr key={n.id}>
                      <td className="p-2.5 font-bold text-slate-900">{n.initiativeName}</td>
                      <td className="p-2.5 text-sky-800 font-bold">{n.targetEntity}</td>
                      <td className="p-2.5 text-slate-700">{n.message}</td>
                      <td className="p-2.5 text-slate-500 font-mono text-[10px]">{n.timestamp}</td>
                      <td className="p-2.5 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {n.status} ✔
                        </span>
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
      {/* SUB-TAB 6: TECHNICAL & ENGINEERING PAVING ADVISOR + AI CHAT */}
      {/* ========================================================================= */}
      {activeSubTab === 'technical_engineering' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* TECHNICAL PAVING SPECS QUICK REFERENCE */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-3xs space-y-4 text-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <HardHat className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-base text-slate-900">المواصفات الهندسية لرصف الطرق الجبلية</h3>
              </div>

              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl space-y-1">
                  <span className="font-black text-amber-900 block">📐 مواصفات الأحجار والرصف:</span>
                  <p className="text-slate-800 font-bold">أحجار صلبة مقطعة زوايا قائمة، ورصف مسماري محكم يضمن ثبات الطريق في المنحدرات.</p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl space-y-1">
                  <span className="font-black text-emerald-900 block">🧪 التكحيل والملاحط الإسمنتية:</span>
                  <p className="text-slate-800 font-bold">ملء الفواصل بالملاحط الإسمنتية الجافة وتأمين الجدران الساندة لحماية أكتاف الطريق.</p>
                </div>

                <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-2xl space-y-1">
                  <span className="font-black text-sky-900 block">📏 سواقي ومصارف مياه الأمطار:</span>
                  <p className="text-slate-800 font-bold">إنشاء عبارات وسواقي جانبية لتصريف السيول ومنع الانجراف الجانبي للطريق.</p>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-2xl space-y-1">
                  <span className="font-black text-purple-900 block">💧 معالجة بالرش بالماء:</span>
                  <p className="text-slate-800 font-bold">رش المياه مرتين يومياً (صباحاً ومساءً) لمدة 14 يوماً متواصلة بعد الصب.</p>
                </div>
              </div>
            </div>

            {/* INTERACTIVE AI CHAT ASSISTANT */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-3xs flex flex-col h-[600px] overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <span className="font-black text-sm">المستشار التفاعلي المباشر (AI Core V4)</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                  متصل ببيانات المحافظة
                </span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 text-xs">
                {chatMessages.map(m => (
                  <div key={m.id} className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'mr-auto items-start' : 'ml-auto items-end'}`}>
                    <div className={`p-3.5 rounded-2xl ${
                      m.role === 'user'
                        ? 'bg-slate-900 text-white font-bold rounded-bl-none'
                        : 'bg-white border border-slate-200 text-slate-850 rounded-br-none shadow-2xs font-medium'
                    }`}>
                      <p className="leading-relaxed whitespace-pre-line">{m.content}</p>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="ml-auto text-xs text-slate-500 font-bold animate-pulse p-2">
                    جاري صياغة التقرير والهندسة...
                  </div>
                )}
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSendChat} className="p-3 bg-slate-100 border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="اسأل المستشار عن المواصفات، تحليل انحراف، أو صياغة توجيه..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-800 cursor-pointer"
                >
                  إرسال
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED INITIATIVE DECISION DRAWER / MODAL */}
      {/* ========================================================================= */}
      {isDecisionModalOpen && selectedInitiative && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">{selectedInitiative.name}</h3>
                <p className="text-xs text-slate-500">{selectedInitiative.district} - {selectedInitiative.subDistrict}</p>
              </div>
              <button
                onClick={() => setIsDecisionModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold block">⚖️ القرار والتوصية التنفيذية الحكيمة:</span>
                <p className="text-sm font-black leading-relaxed">
                  {getAIDevelopmentDecision(selectedInitiative).smartRecommendation}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl">
                  <span className="font-bold text-sky-900 block">الجهة المسؤولة:</span>
                  <span className="font-black text-sky-900">{getAIDevelopmentDecision(selectedInitiative).responsibleEntity}</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <span className="font-bold text-emerald-900 block">الإجراء المطلوب:</span>
                  <span className="font-black text-emerald-900">{getAIDevelopmentDecision(selectedInitiative).nextProposedAction}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">🚧 الضوابط الهندسية للمشروع:</span>
                <p className="text-slate-700">{getEngineeringPavingSpecs(selectedInitiative).thicknessLabel}</p>
                <p className="text-slate-700">فواصل التمدد: {getEngineeringPavingSpecs(selectedInitiative).expansionJoints}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setIsDecisionModalOpen(false)}
                className="bg-slate-900 text-white font-bold px-5 py-2 rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INSTANT FAILURE DIAGNOSIS MODAL (تشخيص أسباب التعثر فوراً) */}
      {/* ========================================================================= */}
      {showInstantDiagnosisModal && selectedInitiative && (() => {
        const diagDecision = getAIDevelopmentDecision(selectedInitiative);
        const diagSpecs = getEngineeringPavingSpecs(selectedInitiative);
        const diagMatrix = getProblemDecisionMatrix(selectedInitiative);

        return (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-amber-300 space-y-5 max-h-[90vh] overflow-y-auto font-sans text-right" dir="rtl">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-900 border border-amber-400/40 text-xs font-black px-3 py-1 rounded-full">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    تقرير التشخيص الذكي العاجل لأسباب التعثر ⚡
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
                    {selectedInitiative.name}
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    كود: {selectedInitiative.initiativeNumber || '1'} • مديرية {selectedInitiative.district} • عزلة {selectedInitiative.subDistrict || 'عامة'}
                  </p>
                </div>
                <button
                  onClick={() => setShowInstantDiagnosisModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl bg-slate-100 font-black cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Diagnosis Content */}
              <div className="space-y-4 text-xs">
                {/* Cause Card */}
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-1.5">
                  <span className="font-black text-rose-900 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    سبب التعثر الرئيسي المشخص آلياً:
                  </span>
                  <p className="text-slate-800 font-black text-sm leading-relaxed">
                    {diagMatrix.cause}
                  </p>
                </div>

                {/* PMI Golden Triangle Breakdown */}
                <div className="space-y-2">
                  <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-indigo-600" />
                    تحليل قيود المثلث الذهبي (PMI Constraints):
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1">
                      <span className="font-black text-slate-900 text-xs block">💰 الميزانية والتمويل:</span>
                      <p className="text-slate-700 font-bold">الأسمنت المنصرف: {selectedInitiative.materialsDisbursed || 0} كيس</p>
                      <p className="text-slate-700 font-bold">المستخدم: {selectedInitiative.materialsUsed || 0} كيس</p>
                      <p className="text-amber-700 font-black">المتبقي بالموقع: {diagDecision.cementRemaining} كيس</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1">
                      <span className="font-black text-slate-900 text-xs block">⏱️ الوقت والإنجاز:</span>
                      <p className="text-slate-700 font-bold">نسبة الإنجاز: {selectedInitiative.completionRate}%</p>
                      <p className="text-slate-700 font-bold">الحالة الحالية: {selectedInitiative.status === 'stagnant' ? 'متعثرة' : 'قيد التنفيذ'}</p>
                      <p className="text-slate-700 font-bold font-mono">السرعة التشغيلية: منخفضة</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1">
                      <span className="font-black text-slate-900 text-xs block">🏗️ الجودة والمواصفات:</span>
                      <p className="text-slate-700 font-bold">السماكة المطلوبة: {diagSpecs.thicknessLabel}</p>
                      <p className="text-slate-700 font-bold">الجهد: خرسانة C30</p>
                      <p className="text-slate-700 font-bold">فواصل التمدد: {diagSpecs.expansionJoints}</p>
                    </div>
                  </div>
                </div>

                {/* AI Decision & Action */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
                  <span className="text-emerald-400 font-black text-xs block flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    التوجيه والقرار التنفيذي المقترح من المستشار:
                  </span>
                  <p className="text-white font-black text-sm leading-relaxed">
                    {diagDecision.smartRecommendation}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
                    <span className="text-indigo-300 font-bold">الجهة المكلفة: {diagDecision.responsibleEntity}</span>
                    <span className="text-amber-300 font-bold">الإجراء العاجل: {diagDecision.nextProposedAction}</span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setShowInstantDiagnosisModal(false);
                    handleSelectInitiativeWithTransition(selectedInitiative, 'track_1', 'بطاقة المبادرة والتنقل بين المسارات الخمسة');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2.5 rounded-xl cursor-pointer shadow-md text-xs flex items-center gap-2 active:scale-95"
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-200" />
                  <span>فتح بطاقة المبادرة والتنقل بين المسارات الخمسة ↗</span>
                </button>

                <button
                  onClick={() => setShowInstantDiagnosisModal(false)}
                  className="bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer text-xs"
                >
                  إغلاق التقرير
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
