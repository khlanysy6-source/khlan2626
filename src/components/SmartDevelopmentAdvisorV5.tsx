import React, { useState, useMemo, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  Search,
  Building,
  ShieldAlert,
  Layers,
  ArrowUpRight,
  Gauge,
  Activity,
  FileCheck,
  Award,
  ChevronLeft,
  ChevronRight,
  Info,
  Sliders,
  Zap,
  AlertCircle,
  MapPin,
  Coins,
  Fuel,
  PackageCheck,
  FileText,
  Send,
  HardHat,
  Shield,
  Building2,
  Users,
  Clock,
  Package,
  BookOpen,
  GraduationCap,
  ArrowLeft,
  Scale,
  MessageSquare,
  Compass,
  Check,
  ListFilter,
  ExternalLink,
  Target
} from 'lucide-react';
import { Initiative, UserRole } from '../types';
import {
  إنشاء_الملف_التنفيذي_للمبادرة,
  الملف_التنفيذي_للمبادرة,
  مؤشرات_القرار,
  إجراء_مطلوب
} from '../utils/developmentDecisionEngine';
import { تحليل_التنبؤ_التنموي } from '../utils/predictiveDevelopmentAnalysis';
import { تحليل_قاعدة_المعرفة_التنموية } from '../utils/developmentKnowledgeBase';
import { تحليل_منظومة_التخطيط_التنموي, تقييم_احتياج_تخطيطي } from '../utils/developmentPlanningEngine';
import { CANONICAL_DISTRICTS, matchDistrictStrict } from '../utils/numberAndDistrictUtils';

export const SAMPLE_PROPOSED_NEEDS = [
  {
    معرف_الاحتياج: 'REQ-01',
    اسم_الاحتياج: 'رصف وخرسانة طريق وادي جبلة - العزلة الغربية',
    المديرية: 'جبلة',
    العزلة: 'العزلة الغربية',
    القطاع: 'الطرق والرصف',
    المشكلة: 'طريق ترابي واعرة تنقطع كلياً في موسم الأمطار وتمنع إسعاف المرضى',
    المستفيدون: 4500,
    شدة_الحاجة: 'حاجة ملحة جداً' as const,
    نسبة_المساهمة_المجتمعية_المتوقعة: 55,
    توفر_حرم_الطريق_أو_الأرض: true
  },
  {
    معرف_الاحتياج: 'REQ-02',
    اسم_الاحتياج: 'مشروع صبة وساقية سيل قرية كتاب',
    المديرية: 'يريم',
    العزلة: 'كتاب',
    القطاع: 'المياه والمبادرات المائية',
    المشكلة: 'جرف الأراضي الزراعية وتضرر الطريق الرئيسي عند هطول الأمطار',
    المستفيدون: 3200,
    شدة_الحاجة: 'حاجة مرتفعة' as const,
    نسبة_المساهمة_المجتمعية_المتوقعة: 40,
    توفر_حرم_الطريق_أو_الأرض: true
  },
  {
    معرف_الاحتياج: 'REQ-03',
    اسم_الاحتياج: 'رصف عقبة بني الشراعي',
    المديرية: 'المخادر',
    العزلة: 'الشراعي',
    القطاع: 'الطرق والرصف',
    المشكلة: 'انزلاق السيارات وحوادث متكررة لعدم وجود صبة خرسانية C30',
    المستفيدون: 2800,
    شدة_الحاجة: 'حاجة ملحة جداً' as const,
    نسبة_المساهمة_المجتمعية_المتوقعة: 60,
    توفر_حرم_الطريق_أو_الأرض: true
  },
  {
    معرف_الاحتياج: 'REQ-04',
    اسم_الاحتياج: 'حاجز مائي ومحطة تجميع قرية التنعام',
    المديرية: 'السدة',
    العزلة: 'التنعام',
    القطاع: 'المياه والمبادرات المائية',
    المشكلة: 'شحة شديدة في مياه الشرب والري للمساحات الزراعية',
    المستفيدون: 1900,
    شدة_الحاجة: 'حاجة مرتفعة' as const,
    نسبة_المساهمة_المجتمعية_المتوقعة: 25,
    توفر_حرم_الطريق_أو_الأرض: false
  },
  {
    معرف_الاحتياج: 'REQ-05',
    اسم_الاحتياج: 'تأهيل وتعبيد عقبة الربادي',
    المديرية: 'حبيش',
    العزلة: 'الربادي',
    القطاع: 'الطرق والرصف',
    المشكلة: 'صعوبة وصول الشاحنات والمستلزمات التنموية للقرية',
    المستفيدون: 3800,
    شدة_الحاجة: 'حاجة ملحة جداً' as const,
    نسبة_المساهمة_المجتمعية_المتوقعة: 50,
    توفر_حرم_الطريق_أو_الأرض: true
  }
];

interface SmartDevelopmentAdvisorV5Props {
  initiatives: Initiative[];
  targetInitiativeId?: string | null;
  onSelectInitiative?: (initiative: Initiative, trackOrTab?: string) => void;
  onNavigateTab?: (tab: string) => void;
  onUpdateInitiative?: (initiative: Initiative) => void;
  userRole?: UserRole;
}

export default function SmartDevelopmentAdvisorV5({
  initiatives,
  targetInitiativeId,
  onSelectInitiative,
  onNavigateTab,
  onUpdateInitiative,
  userRole = 'central_unit'
}: SmartDevelopmentAdvisorV5Props) {
  // Main V5 Sub-Tab Navigation
  const [activeSubTab, setActiveSubTab] = useState<
    'diagnosis' | 'dialogue' | 'scenarios' | 'five_tracks' | 'critical_center'
  >('diagnosis');

  // District & Search Filtering State
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  // Selected Initiative State
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);

  // Sync targetInitiativeId or default first initiative
  useEffect(() => {
    if (targetInitiativeId && initiatives.length > 0) {
      const found = initiatives.find(i => i.id === targetInitiativeId);
      if (found) setSelectedInitiative(found);
    } else if (!selectedInitiative && initiatives.length > 0) {
      setSelectedInitiative(initiatives[0]);
    }
  }, [targetInitiativeId, initiatives]);

  // Filter initiatives by selected district and search
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

  // Build Dossiers for all filtered initiatives strictly using decision engine
  const allDossiers: الملف_التنفيذي_للمبادرة[] = useMemo(() => {
    return filteredInitiatives.map(init => إنشاء_الملف_التنفيذي_للمبادرة(init));
  }, [filteredInitiatives]);

  // Dossier for the single currently selected initiative
  const selectedDossier: الملف_التنفيذي_للمبادرة | null = useMemo(() => {
    if (!selectedInitiative) return null;
    return إنشاء_الملف_التنفيذي_للمبادرة(selectedInitiative);
  }, [selectedInitiative]);

  // Interactive Dialogue State
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    questionKey?: string;
  }>>([]);

  // Initialize Welcome Message in Dialogue
  useEffect(() => {
    if (selectedDossier && chatMessages.length === 0) {
      setChatMessages([
        {
          id: 'welcome_v5',
          role: 'assistant',
          content: `أهلاً بك يا سيادة القائد التنموي في **المستشار التنموي الذكي (الإصدار V5)**. 🧠🇾🇪

أنا طبقة التفسير والقيادة التفاعلية المباشرة فوق **محرك القرار التنموي المركزي V1**.
أنا أقرأ الآن رسمياً **الملف التنفيذي الموحد** للمبادرة المختارة:
📍 **${selectedDossier.هوية_المبادرة.اسم_المبادرة}** (${selectedDossier.هوية_المبادرة.المديرية})

يمكنك استخدام الأسئلة الاستراتيجية الجاهزة أدناه أو كتابة أي سؤال للحصول على تفسير دقيق ومستند إلى بيانات المحرك المعتمدة.`,
          timestamp: new Date()
        }
      ]);
    }
  }, [selectedDossier]);

  const [chatInput, setChatInput] = useState('');

  // Generate Leadership Answer based strictly on selectedDossier
  const answerQuestion = (questionText: string, questionKey?: string) => {
    if (!selectedDossier) return "يرجى تحديد مبادرة من القائمة أولاً.";

    const d = selectedDossier;
    let reply = "";

    if (questionKey === 'pred_stagnation' || questionText.includes('متوقع تعثرها') || questionText.includes('التعثر القادم')) {
      const stagnantList = allDossiers
        .map(dos => ({ dossier: dos, pred: تحليل_التنبؤ_التنموي(dos) }))
        .filter(item => item.pred.احتمالية_التعثر === 'حرجة' || item.pred.احتمالية_التعثر === 'مرتفع');

      reply = `### 🔮 المبادرات المتوقع تعثرها مستقبلياً (التحليل التنبؤي التنموي):

${stagnantList.length > 0 ? stagnantList.map((item, idx) => `
**${idx + 1}. ${item.dossier.هوية_المبادرة.اسم_المبادرة}** (${item.dossier.هوية_المبادرة.المديرية})
   • **احتمالية التعثر:** [${item.pred.احتمالية_التعثر}]
   • **الأسباب التنبؤية:** ${item.pred.أسباب_احتمالية_التعثر.join(' ، ')}
   • **تقييم المسار الزمني:** ${item.pred.شرح_المسار_الزمني}
   • **التوجيه الوقائي:** ${item.pred.توصية_التدخل_الاستباقي} (${item.pred.الجهة_المكلفة_بالتدخل})
`).join('\n') : '✅ لا توجد مبادرات بظروف تعثر حادة حالياً بناءً على تحليل مسار الإنجاز والمواد.'}`;
    } else if (questionKey === 'pred_intervention' || questionText.includes('فرق المتابعة') || questionText.includes('توجيه المتابعة')) {
      const urgentInterventions = allDossiers
        .map(dos => ({ dossier: dos, pred: تحليل_التنبؤ_التنموي(dos) }))
        .filter(item => item.pred.أولوية_التدخل_المبكر === 'تدخل عاجل' || item.pred.أولوية_التدخل_المبكر === 'تدخل قريب');

      reply = `### 🎯 خريطة توجيه فرق المتابعة الميدانية للتدخل المبكر:

${urgentInterventions.length > 0 ? urgentInterventions.map((item, idx) => `
**${idx + 1}. ${item.dossier.هوية_المبادرة.اسم_المبادرة}** - ${item.dossier.هوية_المبادرة.المديرية}
   • **أولوية التدخل:** [${item.pred.أولوية_التدخل_المبكر}]
   • **الجهة المكلفة بالتدخل:** ${item.pred.الجهة_المكلفة_بالتدخل}
   • **التوصية الميدانية:** ${item.pred.توصية_التدخل_الاستباقي}
`).join('\n') : '🟢 جميع المبادرات تسير ضمن معدلات المتابعة الاعتيادية.'}`;
    } else if (questionKey === 'pred_fast_closure' || questionText.includes('الأسرع للإغلاق') || questionText.includes('إغلاق سريع')) {
      const fastClosures = allDossiers
        .map(dos => ({ dossier: dos, pred: تحليل_التنبؤ_التنموي(dos) }))
        .filter(item => item.pred.مؤشر_فرصة_الإغلاق_السريع);

      reply = `### 🚀 المبادرات المرشحة للإغلاق السريع وحصد الإنجاز:

${fastClosures.length > 0 ? fastClosures.map((item, idx) => `
**${idx + 1}. ${item.dossier.هوية_المبادرة.اسم_المبادرة}** (${item.dossier.هوية_المبادرة.المديرية})
   • **نسبة الإنجاز الفعلي:** ${item.dossier.التحليل.نسبة_الإنجاز}%
   • **زمن الإغلاق المتوقع:** ${item.pred.زمن_الإغلاق_المتوقع}
   • **الإجراء المطلوب:** إصدار محضر الاستلام النهائي وتوثيق ألبوم الصور.
`).join('\n') : 'ℹ️ لا توجد مبادرات يتجاوز إنجازها 80% وجاهزة للإغلاق المباشر في هذا القطاع.'}`;
    } else if (questionKey === 'pred_material_waste' || questionText.includes('هدر المواد') || questionText.includes('تلف الأسمنت')) {
      const wasteRisks = allDossiers
        .map(dos => ({ dossier: dos, pred: تحليل_التنبؤ_التنموي(dos) }))
        .filter(item => item.pred.كفاءة_توزيع_الموارد.includes('راكد') || item.pred.كفاءة_توزيع_الموارد.includes('هدر'));

      reply = `### ⚠️ مواقع خطر هدر أو راكد الأسمنت والمواد بالميدان:

${wasteRisks.length > 0 ? wasteRisks.map((item, idx) => `
**${idx + 1}. ${item.dossier.هوية_المبادرة.اسم_المبادرة}**
   • **تقييم الموارد:** ${item.pred.تفاصيل_الموارد_التنبؤية}
   • **كمية الأسمنت الراكد:** ${item.dossier.المواد.الإسمنت.المتبقي_لدى_المبادرة} كيس
   • **نسبة الإنجاز الفعلي:** ${item.dossier.التحليل.نسبة_الإنجاز}%
   • **التوجيه القيادي:** الإسراع بتوجيه المقاول أو لجنة المبادرة لتفريغ الكميات وتجنب التلف.
`).join('\n') : '✨ جميع المبادرات تشير إلى كفاءة ممتازة في صب واستغلال الكميات المسلّمة.'}`;
    } else if (questionKey === 'knowledge_successful' || questionText.includes('المشاريع المشابهة التي نجحت') || questionText.includes('نجحت سابقاً')) {
      const kb = تحليل_قاعدة_المعرفة_التنموية(allDossiers);
      const similarSector = kb.المبادرات_النموذجية_القابلة_للمحاكاة
        .filter(s => s.القطاع === d.هوية_المبادرة.القطاع || s.المديرية === d.هوية_المبادرة.المديرية);
      const listToUse = similarSector.length > 0 ? similarSector : kb.المبادرات_النموذجية_القابلة_للمحاكاة;

      reply = `### 📚 المشاريع المماثلة الناجحة والدروس القابلة للمحاكاة:

${listToUse.length > 0 ? listToUse.map((item, idx) => `
**${idx + 1}. ${item.اسم_المبادرة}** - ${item.المديرية} (${item.القطاع})
   • **نسبة الإنجاز:** ${item.نسبة_الإنجاز}%
   • **عوامل النجاح الرئيسية:** ${item.أسباب_النجاح_أو_التعثر.join(' ، ')}
   • **الممارسات الفضلى المطبقة:** ${item.الممارسات_الفضلى.join(' | ')}
`).join('\n') : '✨ يتم تجميع المبادرات النموذجية بالقطاع حالياً.'}`;
    } else if (questionKey === 'knowledge_causes' || questionText.includes('أسباب تعثر') || questionText.includes('الخبرات السابقة')) {
      const kb = تحليل_قاعدة_المعرفة_التنموية(allDossiers);
      reply = `### 🔍 التحليل المؤسسي لأسباب التعثر السائدة بالمديريات (قاعدة المعرفة):

${kb.أبرز_أسباب_التعثر.map((item, idx) => `
**${idx + 1}. ${item.السبب}**
   • **عدد الحالات المرصودة:** ${item.عدد_الحالات} مبادرة (${item.نسبة_التكرار}% من الإجمالي)
   • **المديريات الأكثر تأثراً:** ${item.المديريات_الأكثر_تأثراً.join(' ، ') || 'عامة'}
   • **التوصية الوقائية المؤسسية:** ${item.التوصية_المؤسسية}
`).join('\n')}

💡 **توصيات التخطيط المستقبلي:**
${kb.توصيات_التخطيط_المستقبلي.map(t => `• ${t}`).join('\n')}`;
    } else if (questionKey === 'knowledge_lessons' || questionText.includes('أفضل إجراء لمعالجة') || questionText.includes('الدروس المستفادة')) {
      const lessons = d.الدروس_المستفادة || [];
      reply = `### 🎓 بطاقة الدروس المستفادة والتعلم المؤسسي للمبادرة: (${d.هوية_المبادرة.اسم_المبادرة})

${lessons.length > 0 ? lessons.map((l, idx) => `
**درس رقم ${idx + 1}: ${l.المشكلة}**
   • **السبب الجذري:** ${l.سببها}
   • **الإجراء المتخذ:** ${l.الإجراء_المتخذ}
   • **النتيجة:** ${l.النتيجة}
   • **التوصية المستقبلية:** ${l.التوصية_المستقبلية}
`).join('\n') : 'لا توجد ملاحظات تعثر حادة مرصودة في هذه المبادرة.'}`;
    } else if (questionKey === 'plan_highest_needs' || questionText.includes('أين توجد أعلى الاحتياجات') || questionText.includes('أعلى الاحتياجات بالمديريات')) {
      const planSummary = تحليل_منظومة_التخطيط_التنموي(SAMPLE_PROPOSED_NEEDS, allDossiers);
      reply = `### 📍 تحليل توزيع أعلى الاحتياجات التنموية بالمديريات:

تتوزع الاحتياجات التنموية المرصودة بالمحافظة عبر المديريات كالتالي:

${planSummary.التوزيع_الجغرافي_للأولويات.map((d, idx) => `
**${idx + 1}. مديرية ${d.المديرية}**
   • **عدد الاحتياجات المرصودة:** ${d.عدد_الاحتياجات} احتیاج
   • **القطاع ذو الأولوية الأولى:** ${d.أولوية_القطاع}
`).join('\n')}

📊 **القطاعات الأكثر احتياجاً بالمحافظة:**
${planSummary.القطاعات_الأكثر_احتياجاً.map(s => `• **${s.القطاع}:** ${s.عدد_الاحتياجات} احتياج (${s.نسبة_الحاجة}% من إجمالي الطلبات)`).join('\n')}

⚠️ **تنبيه قيادي:** هذه أولوية تخطيطية مقترحة وليست قرار اعتماد رسمياً.`;
    } else if (questionKey === 'plan_proposed_priorities' || questionText.includes('أولوية تخطيطية') || questionText.includes('ينبغي إعطاؤها أولوية')) {
      const planSummary = تحليل_منظومة_التخطيط_التنموي(SAMPLE_PROPOSED_NEEDS, allDossiers);
      reply = `### 🎯 المبادرات والاحتياجات المقترحة ذات الأولوية التخطيطية القصوى:

استناداً إلى **محرك التخطيط التنموي** المربوط بـ **قاعدة المعرفة والمسارات الخمسة**، تم ترشيح الأولويات التالية:

${planSummary.الأولويات_القصوى_المقترحة.map((card, idx) => `
**${idx + 1}. ${card.اسم_الاحتياج_أو_المبادرة_المقترحة}** - مديرية ${card.المديرية} (${card.العزلة_أو_القرية})
   • **القطاع:** ${card.القطاع} | **عدد المستفيدين:** ${card.عدد_المستفيدين.toLocaleString('ar-YE')} نسمة
   • **درجة الأولوية التخطيطية:** ${card.درجة_الأولوية_التخطيطية}/100 [${card.الأولوية_التخطيطية_المقترحة}]
   • **أسباب الأولوية:** ${card.أسباب_الأولوية_التخطيطية.join(' ، ')}
   • **التوصية التخطيطية:** ${card.التوصية_التخطيطية}
`).join('\n')}

⚠️ **تنبيه قيادي:** هذه أولوية تخطيطية مقترحة وليست قرار اعتماد رسمياً.`;
    } else if (questionKey === 'plan_why_top_priority' || questionText.includes('لماذا تم اقتراح هذه المبادرة كـ أعلى أولوية') || questionText.includes('لماذا هذه المبادرة أعلى أولوية')) {
      const topCandidate = تقييم_احتياج_تخطيطي(SAMPLE_PROPOSED_NEEDS[0], allDossiers);
      reply = `### 🔍 تحليل أسباب تصنيف الاحتياج كـ "أعلى أولوية تخطيطية مقترحة":
**المشروع:** ${topCandidate.اسم_الاحتياج_أو_المبادرة_المقترحة} (مديرية ${topCandidate.المديرية})

1. **حجم الأثر وعدد المستفيدين:** يخدم **${topCandidate.عدد_المستفيدين.toLocaleString('ar-YE')} نسمة** بشرورة ملحة جداً (${topCandidate.طبيعة_المشكلة}).
2. **جاهزية التحشيد المجتمعي:** جاهزية مرتفعة بجمع مساهمات متوقعة **${topCandidate.المسارات_الخمسة.مسار_التحشيد_المجتمعي.مستوى_المساهمة_المتوقع}%**.
3. **توفّر الأرض وحرم الطريق:** توفّر وثائق التنازل الرسمية يمنع حدوث نزاعات أهليّة.
4. **تكامل المسارات الخمسة:**
   • **الهندسي:** ${topCandidate.المسارات_الخمسة.المسار_الهندسي.قابلية_التنفيذ}
   • **المواد:** ${topCandidate.المسارات_الخمسة.مسار_المواد.توفر_الأسمنت_والديزل}
   • **المتابعة:** ${topCandidate.المسارات_الخمسة.مسار_المتابعة_والاستدامة.إمكانية_المتابعة_الميدانية}
5. **الخبرات المشابهة الناجحة:** ${topCandidate.المشاريع_المشابهة_الناجحة.join(' ، ') || 'توجد نماذج متوافقة من نفس القطاع.'}

⚠️ **تنبيه قيادي:** هذه أولوية تخطيطية مقترحة وليست قرار اعتماد رسمياً.`;
    } else if (questionKey === 'plan_quick_execution' || questionText.includes('يمكن تنفيذها سريعاً') || questionText.includes('القابلة للتنفيذ السريع')) {
      const planSummary = تحليل_منظومة_التخطيط_التنموي(SAMPLE_PROPOSED_NEEDS, allDossiers);
      reply = `### ⚡ الاحتياجات التنموية المشجعة للتدخل السريع وحصد الإنجاز:

${planSummary.الفرص_المشجعة_للتدخل_السريع.map((card, idx) => `
**${idx + 1}. ${card.اسم_الاحتياج_أو_المبادرة_المقترحة}** - مديرية ${card.المديرية}
   • **قابليتها الميدانية:** ${card.قابلية_التنفيذ_الميداني}
   • **نسبة التحشيد المجتمعي:** ${card.المسارات_الخمسة.مسار_التحشيد_المجتمعي.مستوى_المساهمة_المتوقع}%
   • **التوصية:** جاهزية عالية لصدور الدفعة الأولى فور موافقة السلطة المحلية.
`).join('\n')}

⚠️ **تنبيه قيادي:** هذه أولوية تخطيطية مقترحة وليست قرار اعتماد رسمياً.`;
    } else if (questionKey === 'plan_expected_risks' || questionText.includes('المخاطر المتوقعة قبل اتخاذ قرار اعتماد') || questionText.includes('المخاطر المتوقعة قبل اعتماد')) {
      const needsWithRisks = SAMPLE_PROPOSED_NEEDS.map(n => تقييم_احتياج_تخطيطي(n, allDossiers));
      reply = `### ⚠️ تحليل المخاطر التكرارية المتوقعة قبل اتخاذ قرار الاعتماد:

استناداً إلى **قاعدة المعرفة والخبرات السابقة**، يوصى بالتحقق من المخاطر التالية قبل اعتماد أي مشروع جديد:

${needsWithRisks.map((card, idx) => `
**${idx + 1}. مشروع: ${card.اسم_الاحتياج_أو_المبادرة_المقترحة}** (${card.المديرية})
   • **المخاطر التخطيطية المرصودة:** ${card.المخاطر_التخطيطية_المتوقعة.length > 0 ? card.المخاطر_التخطيطية_المتوقعة.join(' | ') : 'مخاطر منخفضة جداً'}
   • **تحذير الخبرات السابقة:** ${card.تحذيرات_المخاطر_التكرارية.join(' ، ') || 'لا توجد تحذيرات حرجة'}
   • **الإجراء الوقائي المطلوب:** ${card.المسارات_الخمسة.المسار_الهندسي.قابلية_التنفيذ}
`).join('\n')}

⚠️ **تنبيه قيادي:** هذه أولوية تخطيطية مقترحة وليست قرار اعتماد رسمياً.`;
    } else if (questionKey === 'plan_sector_gaps' || questionText.includes('فجوات تنموية') || questionText.includes('الفجوات التنموية بالقطاعات')) {
      const planSummary = تحليل_منظومة_التخطيط_التنموي(SAMPLE_PROPOSED_NEEDS, allDossiers);
      reply = `### 🧩 الفجوات التنموية المرصودة بقطاعات المحافظة:

${planSummary.الفجوات_التنموية_المرصودة.map((g, idx) => `**${idx + 1}.** ${g}`).join('\n\n')}

💡 **توجيه التخطيط المستقبلي للقيادة:**
${planSummary.توجيه_التخطيط_المستقبلي.map(t => `• ${t}`).join('\n')}

⚠️ **تنبيه قيادي:** هذه أولوية تخطيطية مقترحة وليست قرار اعتماد رسمياً.`;
      reply = `### 🚨 تحليل أسباب درجة الخطورة: (${d.المؤشرات.درجة_الخطورة})

المبادرة **"${d.هوية_المبادرة.اسم_المبادرة}"** تصنف حالياً ضمن مستوى خطورة **[${d.المؤشرات.درجة_الخطورة}]** بـ **محرك القرار التنموي** للأسباب الترجيعية التالية:

1. **الحالة التشغيلية:** ${d.التحليل.الحالة_التشغيلية}
2. **نسبة الإنجاز الفعلي:** ${d.التحليل.نسبة_الإنجاز}% (مقابل خطة الإنجاز المعتمدة).
3. **ميزان المواد المخزنية:** ${d.المواد.حالة_المواد_العامة}.
4. **الانحرافات والفجوات المرصودة:**
${d.التحليل.الانحرافات.length > 0 ? d.التحليل.الانحرافات.map(i => `   • ${i}`).join('\n') : '   • لا توجد انحرافات هندسية حادة، ولكن يوجد تباطؤ ميداني.'}
5. **نواقص الوثائق والأرشيف:** ${d.الوثائق.النواقص.length > 0 ? d.الوثائق.النواقص.join(' ، ') : 'جميع الوثائق الرسمية مكتملة.'}

💡 **التوجيه القيادي المباشر:** ${d.التوصيات[0] || 'النزول الميداني وتوجيه لجنة المتابعة للتدخل العاجل.'}`;
    } else if (questionKey === 'why_health' || questionText.includes('صحة') || questionText.includes('درجة الصحة')) {
      reply = `### 🏥 تفسير درجة صحة المبادرة: (${d.المؤشرات.درجة_صحة_المبادرة} / 100)

درجة الصحة محسوبة تلقائياً في **محرك القرار** كالتالي:

• **الحالة التشغيلية وفجوة الإنجاز:** الإنجاز الفعلي **${d.التحليل.نسبة_الإنجاز}%**.
• **الالتزام والمساهمة المجتمعية:** نسبة مساهمة المجتمع **${d.المجتمع.نسبة_المساهمة}%** (${d.المجتمع.نسبة_الالتزام}%).
• **مطابقة المواصفات الهندسية:** ${d.الهندسة.هل_التنفيذ_مطابق_للدراسة === 'مطابق' ? 'مطابق بالكامل للدراسة الهندسية C30' : 'يوجد ملاحظات أو انحرافات هندسية قيد التصحيح'}.
• **جاهزية الأرشيف:** ${d.الوثائق.هل_جميع_الوثائق_مكتملة === 'نعم' ? 'الأرشيف والوثائق مكتملة 100%' : `ينقصها: ${d.الوثائق.النواقص.join(' ، ')}`}.

💡 **كيف نرفع درجة الصحة إلى +85%؟**
1. إرسال التقارير الميدانية المصورة دورياً.
2. استكمال حشد باقي المساهمة المجتمعية (${d.المجتمع.فرق_المساهمة.toLocaleString('ar-YE')} ريال).
3. تسوية أي انحرافات في أعمال الرصف الجبلي والجدران الساندة.`;
    } else if (questionKey === 'first_action' || questionText.includes('الإجراء الأول') || questionText.includes('المطلوب') || questionText.includes('ماذا نفعل')) {
      const topAction = d.الإجراءات[0];
      reply = `### ⚡ الإجراء الأول المطلوب فوراً من محرك القرار:

🎯 **${topAction?.العنوان || 'تفعيل المتابعة الميدانية وحل العوائق'}**
• **الجهة المكلفة بالتنفيذ:** ${topAction?.الجهة_المسؤولة || 'وحدة التدخلات'}
• **مستوى الأولوية:** ${topAction?.الأولوية || d.المؤشرات.درجة_الأولوية}
• **الزمن المقترح للمعالجة:** ${d.المؤشرات.درجة_الخطورة === 'حرج' ? '3 أيام' : d.المؤشرات.درجة_الخطورة === 'مرتفع' ? '7 أيام' : '14 يوماً'}

📋 **خطوات التنفيذ الموصى بها:**
1. التواصل فوراً مع مسؤول المبادرة الميداني.
2. التحقق من توفر المواد ونظافة المستودع.
3. رفع تقرير المراجعة لوحدة التدخلات.`;
    } else if (questionKey === 'closure_ready' || questionText.includes('إغلاق') || questionText.includes('جاهزة للإغلاق')) {
      const isReady = d.المؤشرات.جاهزية_الإغلاق === 'جاهزة';
      reply = `### 🏁 موقف جاهزية الإغلاق الرسمي: [${d.المؤشرات.جاهزية_الإغلاق}]

${isReady 
  ? `✅ **المبادرة جاهزة للإغلاق النهائي!**
تجاوزت نسبة الإنجاز الفعلي 95%، والمساهمات المجتمعية مسددة، وجميع تقارير المهندس الميداني وأرشيف الصور مكتملة. يوصى بإصدار محضر الاستلام النهائي وإغلاق الملف.`
  : `⚠️ **المبادرة غير جاهزة للإغلاق النهائي حالياً.**
المتطلبات المتبقية للإغلاق وفق محرك القرار:
• الإنجاز الحالي: ${d.التحليل.نسبة_الإنجاز}% (المطلوب > 95%).
• النواقص بالوثائق: ${d.الوثائق.النواقص.length > 0 ? d.الوثائق.النواقص.join(' ، ') : 'لا يوجد نواقص وثائقية'}.
• التوصية الرسمية: ${d.التوصيات[0] || 'استكمال باقي الأعمال والرصف قبل رفع طلب الإغلاق.'}`}`;
    } else if (questionKey === 'priority_projects' || questionText.includes('أولوية') || questionText.includes('الأكثر أولوية')) {
      const topPriorityInDistrict = allDossiers
        .filter(dos => matchDistrictStrict(dos.هوية_المبادرة.المديرية, d.هوية_المبادرة.المديرية))
        .sort((a, b) => (b.المؤشرات.درجة_صحة_المبادرة) - (a.المؤشرات.درجة_صحة_المبادرة))
        .slice(0, 3);

      reply = `### 🔝 قائمة المبادرات الأعلى أولوية في (${d.هوية_المبادرة.المديرية}):

${topPriorityInDistrict.map((item, idx) => `
**${idx + 1}. ${item.هوية_المبادرة.اسم_المبادرة}**
   • درجة الصحة: ${item.المؤشرات.درجة_صحة_المبادرة}/100 | الإنجاز: ${item.التحليل.نسبة_الإنجاز}%
   • التوصية القيادية: ${item.التوصيات[0] || 'استمرار صرف الدفعات وفق الخطة.'}
`).join('')}`;
    } else {
      reply = `### 🧠 إجابة المستشار القيادي الذكي V5 على الاستفسار:

بناءً على قراءة **الملف التنفيذي الموحد** للمبادرة **"${d.هوية_المبادرة.اسم_المبادرة}"**:

• **الحالة التشغيلية:** ${d.التحليل.الحالة_التشغيلية}
• **نسبة الإنجاز الفعلي:** ${d.التحليل.نسبة_الإنجاز}%
• **ميزان الأسمنت بالموقع:** المتبقي بموقع المبادرة ${d.المواد.الإسمنت.المتبقي_لدى_المبادرة} كيس | الرصيد لدى الوحدة ${d.المواد.الإسمنت.المتبقي_لدى_الوحدة} كيس.
• **التوجيه المباشر:** ${d.التوصيات[0] || 'الالتزام بمتابعة خطة العمل وتفريغ الصور في شيت المتابعة.'}`;
    }

    setChatMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role: 'user', content: questionText, timestamp: new Date() },
      { id: (Date.now() + 1).toString(), role: 'assistant', content: reply, timestamp: new Date(), questionKey }
    ]);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    answerQuestion(chatInput.trim());
    setChatInput('');
  };

  // Determine Required Intervention Level Badge for selectedDossier
  const getInterventionLevel = (dossier: الملف_التنفيذي_للمبادرة) => {
    const risk = dossier.المؤشرات.درجة_الخطورة;
    const tech = dossier.التحليل.الحالة_الفنية;

    if (risk === 'حرج') {
      return {
        label: 'تدخل قيادي عاجل 🚨',
        colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
        bgBox: 'bg-rose-950/40 border-rose-800/80',
        timeframe: 'خلال 3 أيام عمل كحد أقصى'
      };
    }
    if (tech.includes('انحراف') || tech.includes('مراجعة')) {
      return {
        label: 'تدخل هندسي ميداني 👷‍♂️',
        colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
        bgBox: 'bg-amber-950/40 border-amber-800/80',
        timeframe: 'خلال 5 أيام عمل'
      };
    }
    if (risk === 'مرتفع' || risk === 'متوسط') {
      return {
        label: 'تدخل إداري وتنسيقي 🏛️',
        colorClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50',
        bgBox: 'bg-indigo-950/40 border-indigo-800/80',
        timeframe: 'خلال 7 أيام عمل'
      };
    }
    return {
      label: 'متابعة عادية إشرافية 🟢',
      colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
      bgBox: 'bg-emerald-950/40 border-emerald-800/80',
      timeframe: 'ضمن الخطة الشهرية الاعتيادية'
    };
  };

  return (
    <div className="space-y-6 pb-16 font-sans text-right" dir="rtl">
      {/* ========================================================================= */}
      {/* V5 ADVISOR HEADER & BRANDING */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-950 via-emerald-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/40 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-3 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-black px-3.5 py-1.5 rounded-full animate-pulse">
                <Brain className="w-4 h-4 text-emerald-400" />
                المستشار التنموي الذكي (الإصدار V5) 🧠
              </span>
              <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-black px-3 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                طبقة التفسير والقيادة المربوطة بمحرك القرار المركزي V1
              </span>
              <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs font-bold px-3 py-1.5 rounded-full">
                <Shield className="w-3.5 h-3.5 text-amber-300" />
                مصدر البيانات الوحيد: الملف التنفيذي الموحد للمبادرة
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-snug">
              المستشار التنموي والقيادي الذكي V5
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium text-justify">
              المبدأ الذهبي للحوكمة التنموية: <strong className="text-emerald-300">"المحرك يحسب. الملف التنفيذي يوحد. المستشار يفسر. القيادة تقرر."</strong>
              يقوم هذا المستشار بقراءة الملف التنفيذي التجميعي لكل مبادرة وتفسير النتائج، أسباب القرارات، وتحليل السيناريوهات القيادية دون إجراء أي حسابات مستقلة خارج المحرك.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('decision_center')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer border border-emerald-400/30 active:scale-95"
              >
                <Activity className="w-4 h-4 text-emerald-200" />
                <span>مركز تحليل النتائج والقرار ↗</span>
              </button>
            )}
          </div>
        </div>

        {/* INITIATIVE PICKER & FILTERS BAR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10 text-xs">
          {/* District Filter */}
          <div>
            <label className="text-slate-400 font-bold block mb-1">المديرية:</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 font-bold focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">جميع مديريات المحافظة ({initiatives.length} مبادرة)</option>
              {CANONICAL_DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="text-slate-400 font-bold block mb-1">بحث برمز أو اسم المبادرة:</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث عن المبادرة..."
                className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl pr-9 pl-3 py-2 font-bold focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Direct Initiative Selector */}
          <div>
            <label className="text-slate-400 font-bold block mb-1">المبادرة المحددة للتحليل:</label>
            <select
              value={selectedInitiative?.id || ''}
              onChange={(e) => {
                const found = initiatives.find(i => i.id === e.target.value);
                if (found) setSelectedInitiative(found);
              }}
              className="w-full bg-emerald-950 text-emerald-200 border border-emerald-500/50 rounded-xl px-3 py-2 font-black focus:outline-hidden focus:border-emerald-400"
            >
              {filteredInitiatives.map(init => (
                <option key={init.id} value={init.id}>
                  {init.initiativeNumber ? `[${init.initiativeNumber}] ` : ''}{init.name} - ({init.district})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SUB-TAB NAVIGATION BAR */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-800 no-scrollbar relative z-10 text-xs sm:text-sm">
          <button
            onClick={() => setActiveSubTab('diagnosis')}
            className={`px-4 py-2.5 rounded-2xl font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'diagnosis'
                ? 'bg-emerald-600 text-white shadow-lg border border-emerald-400/40 ring-2 ring-emerald-400/30'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Brain className="w-4 h-4 text-emerald-300" />
            <span>التشخيص القيادي والملخص V5 🧠</span>
          </button>

          <button
            onClick={() => setActiveSubTab('dialogue')}
            className={`px-4 py-2.5 rounded-2xl font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'dialogue'
                ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400/40 ring-2 ring-indigo-400/30'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-indigo-300" />
            <span>الحوار القيادي والأسئلة 💬</span>
          </button>

          <button
            onClick={() => setActiveSubTab('scenarios')}
            className={`px-4 py-2.5 rounded-2xl font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'scenarios'
                ? 'bg-amber-600 text-white shadow-lg border border-amber-400/40 ring-2 ring-amber-400/30'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-300" />
            <span>تحليل السيناريوهات الاستراتيجية 📊</span>
          </button>

          <button
            onClick={() => setActiveSubTab('five_tracks')}
            className={`px-4 py-2.5 rounded-2xl font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'five_tracks'
                ? 'bg-blue-600 text-white shadow-lg border border-blue-400/40 ring-2 ring-blue-400/30'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4 text-blue-300" />
            <span>تفسير المسارات الخمسة 🗺️</span>
          </button>

          <button
            onClick={() => setActiveSubTab('critical_center')}
            className={`px-4 py-2.5 rounded-2xl font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'critical_center'
                ? 'bg-rose-600 text-white shadow-lg border border-rose-400/40 ring-2 ring-rose-400/30'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-300" />
            <span>المبادرات الحرجة والأولويات 🚨</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: DIAGNOSIS & EXECUTIVE LEADERSHIP SUMMARY */}
      {/* ========================================================================= */}
      {activeSubTab === 'diagnosis' && selectedDossier && (
        <div className="space-y-6 animate-fadeIn">
          {/* DOSSIER HEADER STAMP CARD */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                    رقم المبادرة: {selectedDossier.هوية_المبادرة.رقم_المبادرة}
                  </span>
                  <span className="text-xs bg-slate-800 text-slate-300 font-bold px-2.5 py-0.5 rounded-full">
                    المديرية: {selectedDossier.هوية_المبادرة.المديرية} - {selectedDossier.هوية_المبادرة.العزلة}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {selectedDossier.هوية_المبادرة.اسم_المبادرة}
                </h2>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-bold">مصدر التشخيص:</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">محرك القرار المركزي V1</span>
                </div>
              </div>
            </div>

            {/* ENGINE GAUGES (4 CORE INDICATORS FROM DOSSIER) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" /> درجة صحة المبادرة
                </span>
                <span className="text-lg font-black text-emerald-400">{selectedDossier.المؤشرات.درجة_صحة_المبادرة} <span className="text-xs font-bold text-slate-400">/ 100</span></span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> درجة الخطورة
                </span>
                <span className={`text-base font-black px-2.5 py-0.5 rounded-lg inline-block ${
                  selectedDossier.المؤشرات.درجة_الخطورة === 'حرج' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                  selectedDossier.المؤشرات.درجة_الخطورة === 'مرتفع' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {selectedDossier.المؤشرات.درجة_الخطورة}
                </span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-indigo-400" /> درجة الأولوية
                </span>
                <span className="text-base font-black text-indigo-300">{selectedDossier.المؤشرات.درجة_الأولوية}</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-blue-400" /> جاهزية الإغلاق
                </span>
                <span className="text-xs font-black text-blue-200 block truncate">{selectedDossier.المؤشرات.جاهزية_الإغلاق}</span>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN DIAGNOSIS & LEADERSHIP SUMMARY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COLUMN 1: SMART DIAGNOSIS & CAUSES */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-slate-900">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">التشخيص الفني والتنموي للمبادرة</h3>
                  <p className="text-xs text-slate-500">تفسير تلقائي ناتج من قراءة بيانات الملف التنفيذي</p>
                </div>
              </div>

              {/* 1. CURRENT STATUS SUMMARY */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <span className="text-xs font-black text-slate-700 block flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600" /> ملخص الحالة الحالية للمبادرة:
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  المبادرة حالياً في وضع <strong className="text-emerald-800">[{selectedDossier.التحليل.الحالة_التشغيلية}]</strong> بنسبة إنجاز فعلي قدرها <strong className="text-slate-900 font-black">{selectedDossier.التحليل.نسبة_الإنجاز}%</strong>. 
                  حالة المواد العامة: <span className="font-bold text-slate-800">{selectedDossier.المواد.حالة_المواد_العامة}</span>. 
                  المساهمة المجتمعية المحشودة بلغت <span className="font-bold text-emerald-700">{selectedDossier.المجتمع.نسبة_المساهمة}%</span> ({selectedDossier.المجتمع.نسبة_الالتزام}%).
                </p>
              </div>

              {/* 2. REASONS FOR DECISION */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" /> أسباب القرار والحالة التحليلية:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                  {selectedDossier.التحليل.الانحرافات.length > 0 ? (
                    selectedDossier.التحليل.الانحرافات.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-xl">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{reason}</span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      لا يوجد انحرافات جوهرية مرصودة بالدراسة الهندسية أو المواد.
                    </li>
                  )}
                  {selectedDossier.الوثائق.النواقص.length > 0 && (
                    <li className="flex items-start gap-2 bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-rose-800 font-bold">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>نواقص الأرشيف والوثائق: {selectedDossier.الوثائق.النواقص.join(' ، ')}</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* 3. REQUIRED INTERVENTION LEVEL */}
              {(() => {
                const levelInfo = getInterventionLevel(selectedDossier);
                return (
                  <div className={`border rounded-2xl p-4 space-y-2 ${levelInfo.bgBox}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-200">مستوى التدخل المطلوب:</span>
                      <span className={`px-3 py-1 rounded-xl text-xs font-black border ${levelInfo.colorClass}`}>
                        {levelInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      الزمن القيادي المقترح للمعالجة: <strong className="text-white font-bold">{levelInfo.timeframe}</strong>
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* COLUMN 2: EXECUTIVE LEADERSHIP SUMMARY CARD */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <h3 className="font-black text-base text-white">ملخص القيادة التنفيذية (Executive Summary)</h3>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                    موجه لقيادة المحافظة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">حالة المبادرة:</span>
                    <span className="font-black text-white text-sm">{selectedDossier.التحليل.الحالة_التشغيلية}</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">مستوى الخطورة:</span>
                    <span className="font-black text-rose-300 text-sm">{selectedDossier.المؤشرات.درجة_الخطورة}</span>
                  </div>
                </div>

                {/* CURRENT EXECUTIVE DECISION FROM ENGINE */}
                <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-2xl space-y-2">
                  <span className="text-emerald-400 font-black text-xs block flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    القرار المعتمد حالياً في محرك القرار:
                  </span>
                  <p className="text-white font-black text-sm leading-relaxed">
                    {selectedDossier.التوصيات[0] || 'الالتزام بجدول الصرف والمتابعة الميدانية.'}
                  </p>
                </div>

                {/* URGENT TOP ACTION */}
                {selectedDossier.الإجراءات[0] && (
                  <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-black flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" /> الإجراء الأول المطلوب:
                      </span>
                      <span className="text-indigo-300 font-bold">الجهة المسؤولة: {selectedDossier.الإجراءات[0].الجهة_المسؤولة}</span>
                    </div>
                    <p className="text-white font-bold text-sm">
                      {selectedDossier.الإجراءات[0].العنوان}
                    </p>
                  </div>
                )}
              </div>

              {/* ACTION FOOTER BUTTONS */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <button
                  onClick={() => setActiveSubTab('dialogue')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-4 py-2.5 rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-200" />
                  <span>بدء الحوار القيادي مع المستشار 💬</span>
                </button>

                {onSelectInitiative && (
                  <button
                    onClick={() => onSelectInitiative(selectedInitiative, 'track_1')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2.5 rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>فتح بطاقة المبادرة الميدانية ↗</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: LEADERSHIP DIALOGUE & STRATEGIC Q&A */}
      {/* ========================================================================= */}
      {activeSubTab === 'dialogue' && selectedDossier && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-slate-900">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-2xl">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">الحوار القيادي التفاعلي مع المستشار V5</h3>
                  <p className="text-xs text-slate-500">إجابات مباشرة ومستندة 100% إلى قراءة الملف التنفيذي للمبادرة المختارة</p>
                </div>
              </div>

              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">
                المبادرة الحالية: {selectedDossier.هوية_المبادرة.اسم_المبادرة}
              </span>
            </div>

            {/* PRESET LEADERSHIP QUESTION BUTTONS */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-700 block flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" /> اختر سؤائلاً استراتيجياً سريعاً للتحليل الفوري:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                <button
                  onClick={() => answerQuestion("ما المبادرات المتوقع تعثرها خلال الفترة القادمة؟", "pred_stagnation")}
                  className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold rounded-2xl text-right transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <Brain className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>🔮 ما المبادرات المتوقع تعثرها مستقبلياً؟</span>
                </button>

                <button
                  onClick={() => answerQuestion("أين يجب توجيه فرق المتابعة فوراً للتدخل المبكر؟", "pred_intervention")}
                  className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 font-bold rounded-2xl text-right transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>🎯 أين يجب توجيه فرق المتابعة للتدخل؟</span>
                </button>

                <button
                  onClick={() => answerQuestion("ما المبادرات الأسرع والأجهزة للإغلاق النهائي؟", "pred_fast_closure")}
                  className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold rounded-2xl text-right transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>🚀 ما المبادرات الأسرع للإغلاق وحصد النجاح؟</span>
                </button>

                <button
                  onClick={() => answerQuestion("أين يوجد خطر هدر أو تلف المواد والأسمنت بالموقع؟", "pred_material_waste")}
                  className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold rounded-2xl text-right transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <Activity className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>⚠️ أين يوجد خطر هدر وتلف الأسمنت والمواد؟</span>
                </button>

                <button
                  onClick={() => answerQuestion("لماذا تصنف المبادرة كـ عالية الخطورة؟", "why_risk")}
                  className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold rounded-2xl text-right transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>⚡ ما الإجراء الأول وأسباب درجة الخطورة؟</span>
                </button>

                <button
                  onClick={() => answerQuestion("ما المشاريع المشابهة التي نجحت سابقاً وكيف نحاكي نجاحها؟", "knowledge_successful")}
                  className="p-3 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 font-bold rounded-2xl text-right transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <BookOpen className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>📚 ما المشاريع المشابهة التي نجحت سابقاً؟</span>
                </button>

                <button
                  onClick={() => answerQuestion("ما أكثر أسباب التعثر السائدة بناءً على سجل الخبرة المؤسسية؟", "knowledge_causes")}
                  className="p-3 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-900 font-bold rounded-2xl text-right transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <Search className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>🔍 ما أسباب التعثر السائدة بالمديريات؟</span>
                </button>

                <button
                  onClick={() => answerQuestion("ما الدروس المستفادة والحل الموصى به لهذه الحالة؟", "knowledge_lessons")}
                  className="p-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 font-bold rounded-2xl text-right transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <GraduationCap className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>🎓 ما الدروس المستفادة وأفضل إجراء هنا؟</span>
                </button>

                <button
                  onClick={() => answerQuestion("ما المشاريع الأكثر أولوية بالمديرية؟", "priority_projects")}
                  className="p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-bold rounded-2xl text-right transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <Target className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>🔝 ما المشاريع الأكثر أولوية بالمديرية؟</span>
                </button>

                <button
                  onClick={() => answerQuestion("أين توجد أعلى الاحتياجات التنموية بالمديريات؟", "plan_highest_needs")}
                  className="p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-950 font-bold rounded-2xl text-right transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <MapPin className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span>📍 أين توجد أعلى الاحتياجات بالمديريات؟</span>
                </button>

                <button
                  onClick={() => answerQuestion("ما المبادرات والاحتياجات المقترحة التي ينبغي إعطاؤها أولوية تخطيطية؟", "plan_proposed_priorities")}
                  className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-950 font-bold rounded-2xl text-right transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>🎯 ما الاحتياجات ذات الأولوية التخطيطية القصوى؟</span>
                </button>

                <button
                  onClick={() => answerQuestion("لماذا تم اقتراح هذه المبادرة كـ أعلى أولوية تخطيطية؟", "plan_why_top_priority")}
                  className="p-3 bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 text-cyan-950 font-bold rounded-2xl text-right transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <Zap className="w-4 h-4 text-cyan-700 shrink-0" />
                  <span>🔍 لماذا تم ترشيح الاحتياج كـ أولوية أولى؟</span>
                </button>

                <button
                  onClick={() => answerQuestion("ما المشاريع والاحتياجات المقترحة القابلة للتنفيذ السريع؟", "plan_quick_execution")}
                  className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold rounded-2xl text-right transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <Zap className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>⚡ ما الاحتياجات القابلة للتنفيذ السريع؟</span>
                </button>

                <button
                  onClick={() => answerQuestion("ما المخاطر المتوقعة قبل اتخاذ قرار اعتماد المشروع؟", "plan_expected_risks")}
                  className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-950 font-bold rounded-2xl text-right transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>⚠️ ما المخاطر المتوقعة قبل اعتماد المشروعات؟</span>
                </button>

                <button
                  onClick={() => answerQuestion("أين توجد الفجوات التنموية بالقطاعات؟", "plan_sector_gaps")}
                  className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold rounded-2xl text-right transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  <Layers className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>🧩 أين توجد الفجوات التنموية بالقطاعات؟</span>
                </button>
              </div>
            </div>

            {/* CHAT MESSAGES DISPLAY BOX */}
            <div className="bg-slate-950 text-white rounded-3xl p-5 border border-slate-800 space-y-4 max-h-[500px] overflow-y-auto font-sans">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-2xl space-y-2 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-900/60 border border-indigo-700/80 text-indigo-100 self-end mr-8'
                      : 'bg-slate-900 border border-slate-800 text-slate-100 ml-8 shadow-inner'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] opacity-75 border-b border-slate-800 pb-1.5 mb-2">
                    <span className="font-bold flex items-center gap-1.5">
                      {msg.role === 'user' ? '👤 استفسار القيادة' : '🧠 المستشار القيادي الذكي V5'}
                    </span>
                    <span>{msg.timestamp.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="whitespace-pre-line font-medium leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* CUSTOM CHAT INPUT FORM */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="اكتب أي استفسار قيادي آخر عن هذه المبادرة..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>إرسال</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: STRATEGIC SCENARIO ANALYSIS */}
      {/* ========================================================================= */}
      {activeSubTab === 'scenarios' && selectedDossier && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 text-slate-900">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">تحليل السيناريوهات الاستراتيجية (Scenario Analysis)</h3>
                  <p className="text-xs text-slate-500">محاكاة قيادية لفحص نتائج القرارات المستقبلية دون تعديل القرار المعتمد بالمنظومة</p>
                </div>
              </div>
            </div>

            {/* IMPORTANT DISCLAIMER NOTICE */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-amber-950 text-xs font-bold flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              <p>
                <strong>تنبيه قيادي هائل:</strong> هذه السيناريوهات مخصصة للمحاكاة والتخطيط الاستراتيجي المستقبلي فقط، ولا تغير القرار الأساسي المعتمد حالياً في محرك القرار التنموي المركزي.
              </p>
            </div>

            {/* THREE SCENARIOS CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              {/* SCENARIO 1 */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3 hover:border-emerald-400 transition-all">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="font-black text-emerald-800 text-sm flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-emerald-600" /> السيناريو الأول
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">صرف المواد</span>
                </div>
                <h4 className="font-black text-slate-900 text-xs">إذا تم صرف المواد المتبقية لدى الوحدة:</h4>
                <div className="space-y-1.5 text-slate-700">
                  <p>• رصيد الإسمنت المتاح بالوحدة: <strong className="text-emerald-700">{selectedDossier.المواد.الإسمنت.المتبقي_لدى_الوحدة.toLocaleString('ar-YE')} كيس</strong>.</p>
                  <p>• الأثر المتوقع على الإنجاز: ارتفاع النسبة الحالية من <strong className="text-slate-900 font-bold">{selectedDossier.التحليل.نسبة_الإنجاز}%</strong> إلى <strong className="text-emerald-700 font-bold">{Math.min(100, selectedDossier.التحليل.نسبة_الإنجاز + 25)}%</strong>.</p>
                  <p>• جاهزية الإغلاق: تتغير المبادرة فوراً نحو <strong className="text-blue-700">جاهزة للإغلاق النهائي</strong> بعد توثيق الخرسانة.</p>
                </div>
              </div>

              {/* SCENARIO 2 */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3 hover:border-rose-400 transition-all">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="font-black text-rose-800 text-sm flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" /> السيناريو الثاني
                  </span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">استمرار التوقف</span>
                </div>
                <h4 className="font-black text-slate-900 text-xs">إذا استمر التوقف الحالي دون تدخل قيادي:</h4>
                <div className="space-y-1.5 text-slate-700">
                  <p>• الأثر على الخطورة: تصعيد مستوى الخطورة إلى <strong className="text-rose-700 font-bold">حرج للغاية 🚨</strong>.</p>
                  <p>• مخاطر المواد: تعرض الأسمنت المخزّن بالموقع ({selectedDossier.المواد.الإسمنت.المتبقي_لدى_المبادرة} كيس) للتصلب والتلف بسبب الرطوبة.</p>
                  <p>• مخاطر المجتمع: انخفاض ثقة اللجنة المجتمعية وتراجع المساهمة بنسبة 40%.</p>
                </div>
              </div>

              {/* SCENARIO 3 */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3 hover:border-indigo-400 transition-all">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="font-black text-indigo-800 text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" /> السيناريو الثالث
                  </span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">حشد المجتمع</span>
                </div>
                <h4 className="font-black text-slate-900 text-xs">إذا اكتمل حشد باقي المساهمة المجتمعية:</h4>
                <div className="space-y-1.5 text-slate-700">
                  <p>• المبلغ المطلوب حشده: <strong className="text-indigo-700 font-bold">{selectedDossier.المجتمع.فرق_المساهمة.toLocaleString('ar-YE')} ريال</strong>.</p>
                  <p>• الالتزام المجتمعي: يرتفع التقييم إلى <strong className="text-emerald-700 font-bold">التزام ممتاز (100%)</strong>.</p>
                  <p>• درجة صحة المبادرة: ترتفع تلقائياً في محرك القرار بمقدار +15 نقطة.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: 5 TRACKS INTEGRATION */}
      {/* ========================================================================= */}
      {activeSubTab === 'five_tracks' && selectedDossier && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-100 text-blue-800 rounded-2xl">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">تفسير المسارات التنموية الخمسة للمبادرة</h3>
                  <p className="text-xs text-slate-500">مصفوفة الربط المباشر بين نتائج المحرك والمسارات التشغيلية الخمسة</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* TRACK 1: COMMUNITY MOBILIZATION */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <span className="font-black text-indigo-900 text-xs block flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" /> المسار 1: التحشيد واللجان المجتمعية
                </span>
                <p className="text-slate-700">نسبة المساهمة المحشودة: <strong className="text-indigo-700">{selectedDossier.المجتمع.نسبة_المساهمة}%</strong></p>
                <p className="text-slate-700">فرق المساهمة: <strong>{selectedDossier.المجتمع.فرق_المساهمة.toLocaleString('ar-YE')} ريال</strong></p>
                <p className="text-slate-700">حالة المجتمع: <span className="font-bold">{selectedDossier.المجتمع.الحاجة_للتحشيد}</span></p>
              </div>

              {/* TRACK 2: ENGINEERING STUDY */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <span className="font-black text-emerald-900 text-xs block flex items-center gap-1.5">
                  <HardHat className="w-4 h-4 text-emerald-600" /> المسار 2: الفحص والدراسة الهندسية
                </span>
                <p className="text-slate-700">مطابقة الدراسة: <strong className={selectedDossier.الهندسة.هل_التنفيذ_مطابق_للدراسة === 'مطابق' ? 'text-emerald-700' : 'text-amber-700'}>
                  {selectedDossier.الهندسة.هل_التنفيذ_مطابق_للدراسة === 'مطابق' ? 'مطابق بالكامل C30' : 'يوجد انحرافات قيد المعالجة'}
                </strong></p>
                <p className="text-slate-700">تفاصيل الانحرافات: {selectedDossier.الهندسة.تفاصيل_الانحرافات.length > 0 ? selectedDossier.الهندسة.تفاصيل_الانحرافات.join(' ، ') : 'لا يوجد'}</p>
              </div>

              {/* TRACK 3: MATERIALS MANAGEMENT */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <span className="font-black text-amber-900 text-xs block flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-600" /> المسار 3: حماية وإدارة المواد والمخازن
                </span>
                <p className="text-slate-700">المتبقي لدى المبادرة: <strong className="text-amber-700">{selectedDossier.المواد.الإسمنت.المتبقي_لدى_المبادرة} كيس</strong></p>
                <p className="text-slate-700">الرصيد لدى الوحدة: <strong className="text-blue-700">{selectedDossier.المواد.الإسمنت.المتبقي_لدى_الوحدة} كيس</strong></p>
                <p className="text-slate-700">حالة المواد: <span className="font-bold">{selectedDossier.المواد.حالة_المواد_العامة}</span></p>
              </div>

              {/* TRACK 4: MEDIA & DOCUMENTATION */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <span className="font-black text-blue-900 text-xs block flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" /> المسار 4: الإعلام والتوثيق والأرشيف
                </span>
                <p className="text-slate-700">اكتمال الوثائق: <strong className={selectedDossier.الوثائق.هل_جميع_الوثائق_مكتملة === 'نعم' ? 'text-emerald-700' : 'text-rose-700'}>
                  {selectedDossier.الوثائق.هل_جميع_الوثائق_مكتملة === 'نعم' ? 'مكتملة 100%' : 'ناقصة'}
                </strong></p>
                <p className="text-slate-700">النواقص: {selectedDossier.الوثائق.النواقص.length > 0 ? selectedDossier.الوثائق.النواقص.join(' ، ') : 'لا يوجد نواقص'}</p>
              </div>

              {/* TRACK 5: MONITORING & FIELD FOLLOWUP */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
                <span className="font-black text-purple-900 text-xs block flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-600" /> المسار 5: المتابعة والرقابة الميدانية
                </span>
                <p className="text-slate-700">آخر زيارة ميدانية: <strong>{selectedDossier.المتابعة.آخر_زيارة || 'لا يوجد زيارة حديثة'}</strong></p>
                <p className="text-slate-700">عدد التقارير المرفوعة: <strong>{selectedDossier.المتابعة.عدد_التقارير} تقارير</strong></p>
                <p className="text-slate-700">الإجراء السطحي الأخير: <span className="font-bold">{selectedDossier.المتابعة.آخر_تقرير || 'قيد المتابعة'}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: CRITICAL INITIATIVES & DECISION CENTER LIST */}
      {/* ========================================================================= */}
      {activeSubTab === 'critical_center' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-rose-100 text-rose-800 rounded-2xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">مركز المبادرات الحرجة وقائمة الأولويات القيادية V5</h3>
                  <p className="text-xs text-slate-500">حصر تلقائي للمبادرات التي تتطلب تدخلاً عاجلاً بناءً على قراءات محرك القرار</p>
                </div>
              </div>

              {/* Filter By Risk */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-600">تصفية بحسب الخطورة:</span>
                <select
                  value={riskFilter}
                  onChange={(e: any) => setRiskFilter(e.target.value)}
                  className="bg-slate-100 text-slate-900 border border-slate-300 rounded-xl px-3 py-1.5 font-bold focus:outline-hidden"
                >
                  <option value="all">جميع مستويات الخطورة</option>
                  <option value="critical">حرج فقط 🚨</option>
                  <option value="high">مرتفع فقط ⚠️</option>
                  <option value="medium">متوسط 🟡</option>
                  <option value="low">منخفض 🟢</option>
                </select>
              </div>
            </div>

            {/* CRITICAL INITIATIVES TABLE */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-white font-black">
                  <tr>
                    <th className="p-3">رقم المبادرة واسمها</th>
                    <th className="p-3">المديرية</th>
                    <th className="p-3">درجة الصحة</th>
                    <th className="p-3">درجة الخطورة</th>
                    <th className="p-3">الحالة التشغيلية</th>
                    <th className="p-3">الإجراء الأول المطلوب</th>
                    <th className="p-3">الجهة المكلفة</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {allDossiers
                    .filter(d => {
                      if (riskFilter === 'critical') return d.المؤشرات.درجة_الخطورة === 'حرج';
                      if (riskFilter === 'high') return d.المؤشرات.درجة_الخطورة === 'مرتفع';
                      if (riskFilter === 'medium') return d.المؤشرات.درجة_الخطورة === 'متوسط';
                      if (riskFilter === 'low') return d.المؤشرات.درجة_الخطورة === 'منخفض';
                      return true;
                    })
                    .map((d) => {
                      const topAct = d.الإجراءات[0];
                      return (
                        <tr key={d.هوية_المبادرة.معرف_المبادرة || d.هوية_المبادرة.رقم_المبادرة} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-900">
                            <div>{d.هوية_المبادرة.اسم_المبادرة}</div>
                            <div className="text-[10px] text-slate-400 font-mono">[{d.هوية_المبادرة.رقم_المبادرة}]</div>
                          </td>
                          <td className="p-3 font-bold">{d.هوية_المبادرة.المديرية}</td>
                          <td className="p-3 font-black text-emerald-700">{d.المؤشرات.درجة_صحة_المبادرة}/100</td>
                          <td className="p-3 font-bold">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] ${
                              d.المؤشرات.درجة_الخطورة === 'حرج' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                              d.المؤشرات.درجة_الخطورة === 'مرتفع' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {d.المؤشرات.درجة_الخطورة}
                            </span>
                          </td>
                          <td className="p-3 font-bold">{d.التحليل.الحالة_التشغيلية} ({d.التحليل.نسبة_الإنجاز}%)</td>
                          <td className="p-3 text-slate-900 font-bold max-w-[200px] truncate">
                            {topAct?.العنوان || 'تفعيل المتابعة الميدانية'}
                          </td>
                          <td className="p-3 text-indigo-700 font-bold">
                            {topAct?.الجهة_المسؤولة || 'وحدة التدخلات'}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                const found = initiatives.find(i => i.id === d.هوية_المبادرة.معرف_المبادرة || i.initiativeNumber === d.هوية_المبادرة.رقم_المبادرة || i.name === d.هوية_المبادرة.اسم_المبادرة);
                                if (found) {
                                  setSelectedInitiative(found);
                                  setActiveSubTab('diagnosis');
                                }
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] shadow-xs cursor-pointer active:scale-95"
                            >
                              تشخيص V5 🧠
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper icon component
function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
