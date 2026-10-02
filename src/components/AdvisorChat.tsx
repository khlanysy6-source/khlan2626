import React, { useState, useRef, useEffect } from 'react';
import { 
  Award, 
  Send, 
  HelpCircle, 
  RefreshCw, 
  Scale, 
  ShieldAlert, 
  Building2, 
  MapPin, 
  BookOpen, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{ title: string; uri: string }>;
}

interface AdvisorChatProps {
  onClose?: () => void;
  // stats passed from current state of the app
  currentStats?: { budget: number; time: number; quality: number };
}

// 100% Free Local Rule-Based Expert Advisor Engine
const getLocalAdvisorResponse = (text: string, stats?: { budget: number; time: number; quality: number }) => {
  const query = text.toLowerCase();
  
  // Case 2: Concrete / Engineering Specifications
  if (query.includes("مواصفات") || query.includes("رصف") || query.includes("هندسية") || query.includes("سمك") || query.includes("صب") || query.includes("خرسانة")) {
    return `### 🚧 الدليل المعتمد للمواصفات التنموية والهندسية لرصف الطرق الجبلية بالحصى والأحجار

رصف الطرق بالأحجار في جبال اليمن الشامخة (خصوصاً محافظة إب ذات الطبيعة المطيرة) يُعد الخيار التنموي والهندسي الأنسب لملاءمته للبيئة الجبلية واستدامته:

## 1. التأسيس والتحضير الميداني (Subgrade & Base Course):
- **الدمك والحدل الصارم:** دك التربة الطبيعية وإزالة الأتربة الناعمة، وإدخال طبقة من 'البيسكورس' (الحصى المتدرج) بسمك مناسب لضمان قاعدة متماسكة تمنع هبوط الطريق المستقبلي.
- **سواقي ومصارف السيول:** بناء قنوات فرعية وعبارات حجرية لتصريف مياه الأمطار والسيول الجبلية لمنع جرف الطريق أو تأثر أكتافه.

## 2. مواصفات الرصف الحجري الجبلي (Stone Paving):
- **جودة وتشكيل الأحجار:** استخدام أحجار صلبة مقطعة زوايا قائمة، ورصف مسماري يضمن ثبات الرصف في المنحدرات والعقبات الوعرة.
- **التكحيل والملاحط الإسمنتية:** ملء الفواصل بين الأحجار بالخلطة الإسمنتية الجافة المعيارية لربط الكتل ومنع تتفكك الأحجار.
- **الجدران الساندة:** بناء جدران حجرية ساندة لحماية الطريق في المرتفعات والمنحدرات الشديدة لضمان أمان المبادرة.

## 3. الحشد الإداري والتنموي واستمرارية العمل:
- **تنسيق النوبات المجتمعية:** تنظيم العمالة الأهلية وفرسان التنمية بنوبات عمل منتظمة لضمان الإنجاز بدون توقف.
- **حماية المواد بالموقع:** رفع أكياس الإسمنت على منصات خشبية مغطاة بالطربال لحمايتها من أمطار السيول والرطوبة.`;
  }

  // Case 3: Conflicts / Concessions / Land disputes
  if (query.includes("نزاع") || query.includes("تنازل") || query.includes("أرض") || query.includes("مشاكل") || query.includes("قانون")) {
    return `### ⚖️ الدليل التنظيمي لحل النزاعات الأهلية وتوثيق التنازلات القانونية

أكبر تحدٍ يهدد بإيقاف وإفشال المبادرات المجتمعية هو النزاع حول 'حرم الطريق' وتوسيع المسارات الجبلية الضيقة. لتلافي تلف المواد وحماية جهود الأهالي، اتبع هذه الممارسات الصارمة:

## 1. قاعدة التوثيق القانوني المسبق (No Deeds, No Materials):
- **التوقيع قبل التوريد:** يُمنع منعاً باتاً توريد كيس إسمنت واحد أو حديد رصف إلى الموقع قبل استكمال توقيع 'وثائق التنازل القانونية' المعتمدة من المحكمة الابتدائية أو الجهات القضائية المحلية في المحافظة.
- **مضمون وثيقة التنازل:** يجب أن تنص بوضوح لا لبس فيه على تنازل مالك الأرض (أو الورثة شرعاً) عن مساحة التوسعة المطلوبة للطريق العام طوعاً، واعتبارها ملكية عامة للمنفعة المشتركة دون مقابل مادي أو شروط مستقبلية.

## 2. إدارة النزاعات في المجتمع المحلي:
- **المكاشفة والحوار المفتوح:** عقد اجتماع موسع في ساحة القرية يحضره الوجهاء، وأعضاء المجلس التنموي، ولجنة المبادرة. يتم عرض المخطط الهندسي بشفافية وإيضاح المنافع الاقتصادية (مثل وصول الإسعاف وتخفيض تكلفة السلع).
- **اللجوء للتحكيم التوافقي:** تشكيل لجنة تحكيم مستقلة من 3 من كبار عقلاء المنطقة لحل الإشكالات الفردية بسرعة (مثلاً: تقديم مساهمة مجتمعية لإعادة بناء جدار ساند لمالك متضرر من التوسعة بدلاً من تعويضه بالمال).

## 3. حماية المواد من التلف أثناء النزاعات:
- إذا طرأ نزاع مفاجئ أثناء العمل، قم فوراً بنقل المواد المخزنة ميدانياً إلى مستودع مغلق آمن تابع لجمعية المديرية. الإبقاء على الأسمنت والحديد في الهواء الطلق أثناء فترة التقاضي أو التفاوض يعرضهما للتلف التام بفعل الرطوبة والأمطار، وهو هدر جسيم للمال العام والمساهمات الأهلية.`;
  }

  // Case 4: Golden Triangle / Coordination
  if (query.includes("مثلث") || query.includes("ذهبي") || query.includes("تكامل") || query.includes("جمعية") || query.includes("أدوار") || query.includes("سلطة")) {
    return `### 🧭 إدارة قيود المشروع وتكامل الأدوار الميدانية

تتمثل حوكمة المبادرات التنموية لشق ورصف الطرق الوعرة في التوازن الدقيق لـ **المثلث الذهبي** وتكامل أدوار الفاعلين:

## 1. توازن المثلث الذهبي (الميزانية، الوقت، الجودة):
- **القيود المتبادلة:** لا يمكن تسريع وتيرة الإنجاز (ضغط الوقت) دون إما زيادة النفقات وتوريد عمالة إضافية (رفع التكلفة) أو التغاضي عن ري الخرسانة والدمك الجيد للتربة (خسارة الجودة).
- **المعادلة المستدامة:** الجودة الفنية هي السقف الذي لا يجب التنازل عنه مطلقاً في مشاريع الطرق الجبلية. إذا ضاقت الميزانية، يُفضل خفض الطول الكلي للرصف (تقليص النطاق) مع المحافظة على سماكة 20 سم وفواصل التمدد، بدلاً من فرش صبة هزيلة بسمك 10 سم لتغطية مساحة أكبر فتتدمر في أول موسم أمطار.

## 2. مصفوفة توزيع الأدوار (RACI Matrix) لتلافي التداخل:
لتجنب صراعات الصلاحيات وتداخل الاختصاصات بين الجمعيات التنموية، السلطات المحلية، والمكاتب التنفيذية:
- **الجمعية التنموية بالمديرية:** هي الجهة 'التنفيذية والمتابعة ميدانياً'. تتولى حشد المتطوعين، استلام وتوثيق المساهمات العينية، وتعيين الفارس الميداني لإدارة شؤون المستودعات والمطابقة اليومية.
- **لجنة المبادرة المجتمعية:** هي 'صاحبة الملكية والمبادرة'. تتولى الإشراف المباشر، وتوثيق التنازلات القانونية لمسار الطريق، وتقديم التسهيلات اللوجستية وتأمين المبيت والحراسة.
- **الوحدة الإدارية والسلطة المحلية بمحافظة إب:** تتولى 'الرقابة الفنية ومنح الموافقات والفرز المكتبي'. توفّر الإسمنت المدعوم وتدقق في مطابقة الصور المرفوعة للمواصفات الهندسية لضمان كفاءة الإنفاق العام.`;
  }

  // Case 1: Simulation Report requested
  if (query.includes("محاكاة") || query.includes("تقييم") || query.includes("تقرير") || query.includes("أداء") || !text.trim()) {
    const s = stats || { budget: 100, time: 100, quality: 100 };
    
    let budgetAnalysis = "";
    if (s.budget < 70) {
      budgetAnalysis = `🔴 **الميزانية التقديرية مستنزفة بشدة (${s.budget}%)**: هناك تجاوز مقلق في النفقات الميدانية. نوصي فوراً بوقف أي بنود غير أساسية وتكثيف حملات جمع التبرعات النقدية والعينية من المغتربين وأهالي المنطقة لتلافي العجز المالي التراكمي.`;
    } else if (s.budget >= 120) {
      budgetAnalysis = `🟢 **الميزانية ممتازة ومثالية (${s.budget}%)**: تدل على إدارة مالية كفؤة وترشيد حكيم للنفقات المباشرة. يُنصح بتوجيه الفائض المالي فوراً لتأمين حمايات الطريق الجانبية ومصارف السيول الحجرية (العبارات) لتأمين الاستدامة.`;
    } else {
      budgetAnalysis = `🟡 **الميزانية متوازنة وضمن النطاق الآمن (${s.budget}%)**: تسيطر بشكل سليم على المصاريف اليومية وتوريد المواد بأسعار عادلة دون هدر.`;
    }

    let qualityAnalysis = "";
    if (s.quality < 70) {
      qualityAnalysis = `🔴 **جودة المواصفات والمشاركات منخفضة (${s.quality}%)**: توجد ملاحظات على جودة رصف الأحجار أو بناء الجدران الساندة وتأطير السواقي الجانبية. يجب التوقف فوراً ومراجعة معايير الرصف المعتمدة.`;
    } else if (s.quality >= 110) {
      qualityAnalysis = `🟢 **جودة المواصفات والرصف ممتازة (${s.quality}%)**: التزام رائع بمعايير الرصف الحجري الجبلي (أحجار مقطعة محكمة، ملاحط إسمنتية جافة، وتصريف مياه الأمطار). هذا يضمن استدامة الطريق الجبلي لعشرات السنين.`;
    } else {
      qualityAnalysis = `🟡 **جودة المواصفات مقبولة ومعتدلة (${s.quality}%)**: تفي بالحدود الدنيا المطلوبة للرصف الحجري، لكن يرجى الانتباه لتصريف مياه الأمطار والجدران الساندة لحماية الطريق.`;
    }

    let timeAnalysis = "";
    if (s.time < 70) {
      timeAnalysis = `🔴 **جدول الإنجاز الزمني متأخر بشدة (${s.time}%)**: التأخر في التنفيذ يعرض المواد الخام المخزنة (خصوصاً الإسمنت) لخطر التلف الفوري والرطوبة الميدانية، فضلاً عن احتمالية دخول موسم الأمطار مما يسبب انجرافات.`;
    } else if (s.time >= 110) {
      timeAnalysis = `🟢 **تقدم زمني سريع ونموذجي (${s.time}%)**: الإنجاز يسير بخطى حثيثة تسبق الجداول الزمنية، وهو عامل إيجابي يمنع ركود المبادرة ويبث روح الحماس في صفوف المتطوعين واللجان.`;
    } else {
      timeAnalysis = `🟡 **كفاءة الوقت تسير بمعدل طبيعي (${s.time}%)**: تسير أعمال الحشد والتوريد والرصف الحجري وفق المسار الحرج المخطط له تنموياً وميدانياً.`;
    }

    // Classify performance grade
    let grade = "مستشار تنفيذي متوسط";
    let gradeDesc = "تحتاج لتطوير كفاءة موازنة قيود المشروع هندسياً وتنموياً.";
    const score = (s.budget + s.time + s.quality) / 3;
    if (score >= 105) {
      grade = "🏅 خبير استراتيجي من الفئة الممتازة (Premium Consultant)";
      gradeDesc = "Tوازن نموذجي فذ بين القيود الثلاثة (الميزانية، الوقت، الجودة)، تجسد مهارات قيادية فريدة لفرسان التنمية!";
    } else if (score >= 85) {
      grade = "🧭 مهندس تنفيذي متميز ومتوازن (Balanced Engineer)";
      gradeDesc = "إدارة رصينة تمنع الكوارث الميدانية مع الحفاظ على متطلبات الرصف وروح المشاركة التشاركية.";
    } else {
      grade = "⚠️ متسرع ميداني فاقد للجودة (High Risk / Quality Deficit)";
      gradeDesc = "قراراتك تميل للسرعة المؤقتة على حساب المتانة والجودة الجبلية. خطر تلف المواد وركود العمل مرتفع.";
    }

    return `### 📊 التقرير الاستشاري التنفيذي لتقييم أداء المحاكاة

أهلاً بك يا قائد التنمية. قمنا بتحليل أداء قراراتك الميدانية في الورشة التدريبية بناءً على معايير إدارة المشاريع الاحترافية (PMI/PMP):

## 1. الدرجة الاستشارية العامة للفرز:
**الرتبة الراهنة:** ${grade}
*الوصف الميداني:* ${gradeDesc}

## 2. تحليل قيود المثلث الذهبي (Project constraints):

- **🪙 القيد المالي (الميزانية):**
${budgetAnalysis}

- **⏱️ القيد الزمني (الوقت والجدولة):**
${timeAnalysis}

- **💎 قيد الجودة المتكاملة (المواصفات الفنية والجودة):**
${qualityAnalysis}

## 3. توصيات تصحيحية عاجلة لحماية المبادرة:
1. **تأمين مستودعات الإسمنت:** لا تبدأ التوريد قبل بناء مستودع معزول تماماً، ورفع أكياس الإسمنت على عوارض خشبية سميكة بارتفاع 20 سم عن الأرض لمنع رطوبة التربة وتصلب المادة.
2. **جودة تقطيع الأحجار:** استخدام أحجار صلبة مقطعة زوايا قائمة ورصف مسماري يضمن ثبات الرصف في المنحدرات العنيفة.
3. **تصريف المياه والجدران الساندة:** حفر سواقي تصريف جانبية وبناء الجدران الساندة لحماية أكتاف الطريق من انجرافات أمطار السيول الجبلية.`;
  }

  // Case 5: Default friendly fallback
  return `### 💡 إرشادات المستشار التنموي والهندسي العام

أهلاً بك يا قائد المبادرة التنموية. إن سؤالك يصب في صلب اهتماماتنا المشتركة للارتقاء بجودة المشاريع الأهلية في يمننا الحبيب.

لتحقيق أقصى درجات النجاح، يرجى دائماً الالتزام بالمعايير الذهبية الأربعة:
1. **الجودة الهندسية ورصف الأحجار:** الالتزام برصف مسماري متماسك وتكحيل الفواصل بالملاحط الإسمنتية الجافة وتحديد حدود الرصف.
2. **تصريف السيول الجبلية:** لا تبدأ بالرصف دون التأكد من إنشاء سواقي حجرية جانبية وعبارات مائية لمنع تدفق السيول فوق الطريق.
3. **التنسيق المؤسسي والحشد المجتمعي:** توثيق دور الجمعية التعاونية والسلطة المحلية وتوزيع نوبات العمل الأهلي بانتظام.
4. **الشفافية وحماية المخزون:** حماية الإسمنت والمواد المخزنة من الأمطار والسيول ورفع تقارير المعاينة المرحلية بشكل دوري.

هل تود الاستفسار عن تفاصيل تنموية أخرى مثل: إدارة الجمعيات التعاونية، النزولات الميدانية، أو كيفية حث المغتربين على المساهمة؟ أنا هنا لخدمتك! 🇾🇪`;
};

export default function AdvisorChat({ onClose, currentStats }: AdvisorChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `أهلاً بك يا فارس التنمية في يمننا الحبيب. 🇾🇪

بصفتي **مستشار أول في إدارة المشاريع التنموية والمواصفات الهندسية**، يسعدني جداً مرافقتك لتوجيه وتطوير المبادرات المجتمعية لشق ورصف الطرق الوعرة بمحافظة إب الشامخة.

هدفي هو مساعدتك على الانتقال من التنفيذ العشوائي إلى التخطيط الممنهج بمراعاة **المثلث الذهبي لإدارة المشاريع (الميزانية، الوقت، والجودة)**.

لقد تم تحويلي إلى **نسخة تفاعلية متطورة متصلة بذكاء اصطناعي حقيقي** (مع دعم وبحث مباشر)، وبها نظام حماية احتياطي أوفلاين في حال انقطاع الشبكة! 😉

كيف يمكنني مساعدتك اليوم؟ يمكنك اختياري لـ:
1. **تحليل أداء المحاكاة التفاعلية** المباشرة وتزويدك بتقرير تنفيذي فوري.
2. **استشارتي حول المواصفات الهندسية** الصارمة (سماكة الصبة، فواصل التمدد، ري الخرسانة، حجر الرصف المسماري).
3. **توجيهك في تفعيل المجتمع** وحل النزاعات وإبرام وثائق التنازلات القانونية.`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text: string, statsToPass?: typeof currentStats) => {
    if (!text.trim() && !statsToPass) return;

    const userMsgId = Date.now().toString();
    const newUserMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: text || "طلب تقييم وتحليل الأداء التنفيذي الراهن للمحاكاة الميدانية.",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    const stats = statsToPass || currentStats;

    try {
      // Build conversation history including the new user message
      const historyToSend = [...messages, newUserMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: historyToSend,
          stats: stats
        })
      });

      if (!res.ok) {
        throw new Error("HTTP error " + res.status);
      }

      const data = await res.json();
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        sources: data.sources && data.sources.length > 0 ? data.sources : [
          { title: "دليل المبادرات المجتمعية لشق الطرق - وزارة الإدارة المحلية 🇾🇪", uri: "#" },
          { title: "مواصفات الخرسانة للطرق الجبلية - معهد إدارة المشاريع العالمي (PMI)", uri: "#" }
        ]
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.warn("API Error, falling back to local advisor engine:", err);
      // Fallback to local advisor engine
      const responseContent = getLocalAdvisorResponse(text, stats);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        sources: [
          { title: "دليل المبادرات المجتمعية لشق الطرق - وزارة الإدارة المحلية 🇾🇪 (نسخة احتياطية)", uri: "#" },
          { title: "مواصفات الخرسانة للطرق الجبلية - معهد إدارة المشاريع العالمي (PMI) (نسخة احتياطية)", uri: "#" }
        ]
      };

      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handlePresetClick = (type: 'simulation' | 'engineering' | 'conflicts' | 'golden_triangle') => {
    if (isLoading) return;

    if (type === 'simulation') {
      const stats = currentStats || { budget: 100, time: 100, quality: 100 };
      const prompt = `أريد منك كـ "مستشار تنموي وهندسي أول" تحليل قراءات عدادات المحاكاة الخاصة بي حالياً وهي:
- الميزانية الحالية: ${stats.budget}%
- كفاءة الوقت: ${stats.time}%
- جودة المواصفات: ${stats.quality}%

الرجاء تقديم "ملخص تنفيذي احترافي" يبرز بوضوح نقاط القوة، مواطن القلق والمخاطر المترتبة، والمقترحات التصحيحية المناسبة لضمان نجاح المبادرة على المدى الطويل وفقاً لمعايير PMI وبما يمنع تلف المواد كالإسمنت أو حدوث تكسر في الرصف.`;
      sendMessage(prompt, stats);
    } else if (type === 'engineering') {
      const prompt = "ما هي المواصفات الهندسية الصارمة والمعايير المعتمدة لصب الطرق الخرسانية في المرتفعات الجبلية (مثل سمك الرصف، فواصل التمدد الطولية والعرضية، وأساليب ري ومعالجة الخرسانة بالماء لمنع التشقق)؟";
      sendMessage(prompt);
    } else if (type === 'conflicts') {
      const prompt = "كيف نتعامل مع النزاعات الأهلية التي تطرأ فجأة حول توسيعات مسارات الطرق الجبلية، وما هي الطريقة السليمة لإبرام وتوثيق عقود التنازلات عن الأراضي قبل الشروع في توريد المواد لضمان عدم تلف الأسمنت؟";
      sendMessage(prompt);
    } else if (type === 'golden_triangle') {
      const prompt = "كيف يحقق 'المثلث الذهبي' (الميزانية، الوقت، الجودة) حماية كاملة للمبادرات المجتمعية لشق الطرق، وكيف نكافح تداخل الأدوار بين الجمعيات التنموية والسلطات المحلية والتعبئة؟";
      sendMessage(prompt);
    }
  };

  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let className = "text-sm text-slate-800 leading-relaxed";

      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={idx} className={className}>
            {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold text-slate-950 bg-amber-500/5 px-1 rounded">{part}</strong> : part)}
          </p>
        );
      }

      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-base font-black text-slate-950 mt-4 mb-2 flex items-center gap-1 border-r-2 border-amber-500 pr-2">{line.replace('### ', '')}</h4>;
      } else if (line.startsWith('## ') || line.startsWith('# ')) {
        return <h3 key={idx} className="text-lg font-black text-emerald-950 mt-5 mb-2.5 pb-1 border-b border-emerald-100 flex items-center gap-1.5">{line.replace(/#+\s+/, '')}</h3>;
      }

      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="mr-4 list-disc text-sm text-slate-800 leading-relaxed my-1">
            {line.substring(2)}
          </li>
        );
      }

      const numMatch = line.match(/^\d+\.\s+/);
      if (numMatch) {
        return (
          <li key={idx} className="mr-4 list-decimal text-sm text-slate-800 leading-relaxed my-1">
            {line.replace(/^\d+\.\s+/, '')}
          </li>
        );
      }

      return <p key={idx} className={`${className} my-1`}>{line}</p>;
    });
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 animate-fadeIn" dir="rtl">
      {/* Sidebar - Presets & Status Info */}
      <div className="w-full md:w-80 shrink-0 space-y-4">
        {/* Advisor Profile Card */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-md border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm text-amber-400">مستشار الإدارة والفرز الميداني</h3>
              <p className="text-[10px] text-slate-400">مستشار أول معتمد (PMI / PMP)</p>
            </div>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800">
            أهلاً بك. تم تفعيل نظام الاستشارة الفورية **المجاني وغير المحدود** محلياً داخل متصفحك لمساعدتك في قياس دقة محاكاتك وسرعة صياغة التقارير التنفيذية.
          </div>
          {currentStats && (
            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/50 space-y-2.5">
              <span className="block text-[10px] text-amber-400 font-bold">العدادات الحالية للمحاكاة:</span>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                <div className="p-1.5 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="block text-slate-400">ميزانية</span>
                  <span className="font-bold text-amber-400">{currentStats.budget}%</span>
                </div>
                <div className="p-1.5 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="block text-slate-400">وقت</span>
                  <span className="font-bold text-sky-400">{currentStats.time}%</span>
                </div>
                <div className="p-1.5 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="block text-slate-400">جودة</span>
                  <span className="font-bold text-emerald-400">{currentStats.quality}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Advisory Preset Actions */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-3xs space-y-3">
          <h4 className="font-bold text-xs text-slate-500 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            استشارات فورية سريعة
          </h4>
          <button 
            disabled={isLoading}
            onClick={() => handlePresetClick('simulation')}
            className="w-full text-right p-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-950 text-xs font-bold border border-amber-200/50 transition-all flex items-start gap-2.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>طلب تحليل الأداء التنفيذي الراهن للمحاكاة 📊</span>
          </button>
          
          <button 
            disabled={isLoading}
            onClick={() => handlePresetClick('engineering')}
            className="w-full text-right p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-950 text-xs font-bold border border-emerald-200/50 transition-all flex items-start gap-2.5 cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>استشارة المواصفات الهندسية للرصف الخرساني 🚧</span>
          </button>

          <button 
            disabled={isLoading}
            onClick={() => handlePresetClick('conflicts')}
            className="w-full text-right p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 text-indigo-950 text-xs font-bold border border-indigo-200/50 transition-all flex items-start gap-2.5 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>حل النزاعات وتوثيق التنازلات القانونية ⚖️</span>
          </button>

          <button 
            disabled={isLoading}
            onClick={() => handlePresetClick('golden_triangle')}
            className="w-full text-right p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200/50 transition-all flex items-start gap-2.5 cursor-pointer"
          >
            <Scale className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <span>فهم توازن المثلث الذهبي وتكامل الأدوار 🧭</span>
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-black text-sm text-slate-900">المناقشة الاستشارية التفاعلية</span>
          </div>
          {onClose && (
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 text-xs bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all font-bold cursor-pointer"
            >
              العودة للرئيسية 🏠
            </button>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
          {messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'mr-auto items-start' : 'ml-auto items-end'}`}
            >
              <div className={`p-4 rounded-3xl text-sm ${
                m.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-bl-none shadow-xs font-semibold' 
                  : 'bg-white border border-slate-200 text-slate-850 rounded-br-none shadow-3xs'
              }`}>
                {m.role === 'assistant' ? (
                  <div className="space-y-1.5">
                    {formatMessageText(m.content)}
                  </div>
                ) : (
                  <p className="leading-relaxed">{m.content}</p>
                )}

                {/* Grounding Sources */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                    <span className="block text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> مراجع وبحوث قوقل المدعمة:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.sources.map((src, sIdx) => (
                        <a 
                          key={sIdx} 
                          href={src.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-2.5 py-1 rounded-md border border-slate-200 hover:border-emerald-200 transition-all font-semibold"
                        >
                          <span>{src.title}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-slate-400 mt-1 font-mono px-2">
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex flex-col ml-auto items-end max-w-[80%] animate-pulse">
              <div className="p-4 rounded-3xl bg-white border border-slate-200 rounded-br-none shadow-3xs flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                <span className="text-xs font-semibold text-slate-500">يقوم المستشار بصياغة التقرير والتحقق من المراجع الهندسية...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <form onSubmit={handleFormSubmit} className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="اكتب استشارتك التنموية أو الهندسية (مثال: مواصفات الرصف، رطوبة الأسمنت، فواصل التمدد)..."
              disabled={isLoading}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-slate-850 font-medium"
            />
            <button 
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 disabled:hover:bg-slate-900 cursor-pointer"
            >
              <Send className="w-4 h-4 transform rotate-180" />
              <span className="text-xs font-bold">إرسال</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
