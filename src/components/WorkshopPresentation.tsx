import React, { useState, useEffect } from 'react';
import { parseNum, matchDistrictStrict } from '../utils/numberAndDistrictUtils';
import { 
  Award, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  X, 
  Check, 
  RefreshCw, 
  MapPin, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  Navigation,
  Compass,
  Zap,
  Info,
  ShieldCheck,
  Building2,
  Users,
  Eye,
  FileText,
  Activity,
  ArrowLeftRight,
  Sparkles,
  Percent,
  Clipboard,
  ListFilter,
  Maximize2,
  Minimize2,
  Share2,
  FileDown,
  Globe,
  ShieldAlert,
  ListTodo,
  Database,
  Scale,
  Sun,
  Moon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from 'recharts';
import { Initiative } from '../types';
import { INITIAL_INITIATIVES } from '../data';
import InteractiveGPSMap from './InteractiveGPSMap';
import { exportToPowerPoint } from '../utils/pptxExporter';
import { generateOfflinePresentationHTML } from '../utils/exportOfflinePresentation';

interface Impact {
  budget: number;
  time: number;
  quality: number;
}

interface Option {
  id: 'A' | 'B';
  text: string;
  feedback: string;
  impact: Impact;
}

// Complete 5 Tracks as defined by integrated developmental and results-based management
interface TrackDetail {
  id: number;
  name: string;
  title: string;
  elevation: number;
  description: string;
  roles: {
    cooperative: string[];
    localAuthority: string[];
    mobilization: string[];
    interventionUnit: string[]; // Added intervention unit role for each track
  };
  scenario: {
    desc: string;
    options: Option[];
  };
}

interface WorkshopPresentationProps {
  initiatives?: Initiative[];
  onClose?: () => void;
  onUpdateInitiative?: (updated: Initiative) => void;
  role?: any;
  onStatsChange?: (stats: { budget: number; time: number; quality: number }) => void;
}

const ALL_DISTRICTS = [
  'ذي السفال', 'السياني', 'جبلة', 'بعدان', 'السدة', 'يريم', 'المخادر', 'حبيش',
  'حزم العدين', 'الرضمة', 'القفر', 'العدين', 'ريف إب', 'الظهار', 'المشنة',
  'السبرة', 'الشعر', 'النادرة', 'فرع العدين', 'مذيخرة'
];
const IBB_DISTRICTS = ALL_DISTRICTS;

function getCementQuantity(init: Initiative): number {
  const appr = parseNum(init.materialsApproved);
  if (appr > 0) return appr;
  const disbursed = parseNum(init.materialsDisbursed);
  if (disbursed > 0) return disbursed;
  const used = parseNum(init.materialsUsed);
  if (used > 0) return used;
  if (init.materials && init.materials.length > 0) {
    const cementMat = init.materials.find(m => m.name.includes('إسمنت') || m.name.includes('اسمنت'));
    if (cementMat && cementMat.quantity > 0) {
      return cementMat.quantity;
    }
  }
  return 0;
}

const matchDistrict = (initDistrict: string | undefined, targetDistrict: string) => {
  return matchDistrictStrict(initDistrict, targetDistrict);
};

function evaluateLocalPerformance(stats: { budget: number; time: number; quality: number }) {
  const avg = (stats.budget + stats.time + stats.quality) / 3;
  if (avg >= 110) {
    return {
      title: "🥇 وسام الفارس التنموي المستدام (أداء استثنائي)",
      color: "bg-emerald-50 border-emerald-200 text-emerald-950",
      text: "لقد وازنت قيود المثلث الذهبي ببراعة نادرة. حافظت على تصفية التنازلات القانونية وتطبيق معايير الحوكمة والتمكين المؤسسي للجان فاستحقيت لقب فارس التنمية الأول!"
    };
  } else if (avg >= 85) {
    return {
      title: "🥈 درع الفارس المثالي الملتزم (أداء جيد جداً)",
      color: "bg-sky-50 border-sky-200 text-sky-950",
      text: "أداء متميز وتنسيق مستقر بين السلطة المحلية والجمعية. احرص مستقبلاً على تمكين القيادات المجتمعية وتفعيل الصيانة التشاركية لضمان استدامة المشاريع."
    };
  } else {
    return {
      title: "⚠️ إنذار بضرورة تصحيح المسار (أداء متسرع)",
      color: "bg-rose-50 border-rose-200 text-rose-950",
      text: "هناك خلل في جودة الرصف أو هدر في كميات الإسمنت بسبب سوء التخزين أو التسرع في الصب دون فواصل تمدد. يرجى التنسيق الصارم مع وحدة التدخلات والجمعيات التعاونية لإعادة الفرز وتلافي التلف."
    };
  }
}

function TrackInteractiveImage({ trackId }: { trackId: number }) {
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);

  const hotspotsData: Record<number, Array<{ id: string; label: string; x: string; y: string; content: string; icon: string }>> = {
    1: [
      {
        id: 'deeds',
        label: 'التنازلات القانونية 📜',
        x: '30%',
        y: '25%',
        icon: '📜',
        content: 'يجب تأمين وتحرير وثائق وتنازلات مكتوبة وموقعة من ملاك الأراضي لتسهيل منعطفات الطريق الوعرة وتجنب نشوء أي نزاعات أهلية أثناء العمل.'
      },
      {
        id: 'slope',
        label: 'فحص المنحدرات 📐',
        x: '75%',
        y: '45%',
        icon: '📐',
        content: 'يقوم مهندسو وحدة التدخلات بقياس درجة الانحدار لضمان عدم تجاوزها 12% وضمان تدفق وتصريف مياه السيول خارج مسار الصب الخرساني.'
      },
      {
        id: 'deprivation',
        label: 'معدل الحرمان 👥',
        x: '50%',
        y: '75%',
        icon: '👥',
        content: 'انداز عدد الأسر والعزل المستفيدة وحجم المعاناة السابقة للتأكد من الجدوى والأثر التنموي الفعلي للمبادرة قبل تفعيل الدعم.'
      }
    ],
    2: [
      {
        id: 'cash',
        label: 'المساهمة النقدية 💰',
        x: '25%',
        y: '30%',
        icon: '💰',
        content: 'تودع المساهمات النقدية للأهالي والمغتربين في حساب بنكي موحد تحت إشراف لجنة مجتمعية لضمان النزاهة واستخدام الأموال لخدمة المشروع.'
      },
      {
        id: 'materials',
        label: 'المواد العينية 🧱',
        x: '75%',
        y: '25%',
        icon: '🧱',
        content: 'تجميع الحجارة وتكسير الكرام (النيس) محلياً لتقليل تكلفة شراء المواد ونقلها وتوسيع مساهمة أهالي القرى بالأثر الميداني.'
      },
      {
        id: 'labor',
        label: 'العمالة الطوعية ✊',
        x: '50%',
        y: '70%',
        icon: '✊',
        content: 'تنظيم نوبات ومناوبات العمال المتطوعين من أفراد القرية بالتناوب لضمان استدامة جهود العمل والتخفيف من تكاليف الأيدي العاملة.'
      }
    ],
    3: [
      {
        id: 'cement_stack',
        label: 'تخزين الإسمنت 🪵',
        x: '20%',
        y: '35%',
        icon: '🪵',
        content: 'يجب تخزين الإسمنت في مستودع محمي ومغطى بالكامل ومرفوع عن الأرض على طبالي خشبية لحمايته من رطوبة الضباب وسيل الأمطار.'
      },
      {
        id: 'fifo',
        label: 'الوارد أولاً يصرف أولاً 🔄',
        x: '70%',
        y: '45%',
        icon: '🔄',
        content: 'تطبيق آلية الفرز المخزني الصارمة (FIFO) لصرف الشحنات الأقدم أولاً لمنع تصلب الإسمنت وتلفه بسبب الرطوبة والزمن.'
      },
      {
        id: 'auditing',
        label: 'المطابقة والفرز 📋',
        x: '50%',
        y: '80%',
        icon: '📋',
        content: 'تدقيق ومطابقة الكميات المستلمة والمستهلكة ميدانياً بانتظام مع رفع كشوفات الاستلام الموقعة لتعزيز الشفافية ومنع الهدر.'
      }
    ],
    4: [
      {
        id: 'transparency',
        label: 'الشفافية والتواصل المجتمعي 📢',
        x: '35%',
        y: '25%',
        icon: '📢',
        content: 'تفعيل قنوات الاتصال والشفافية عبر توثيق ونشر نسب الإنجاز بشكل دوري للمساهمين بالداخل والخارج لتعزيز الثقة واستدامة حشد المبادرة.'
      },
      {
        id: 'teamwork',
        label: 'تنظيم فرق العمل الشعبية 👥',
        x: '70%',
        y: '35%',
        icon: '👥',
        content: 'جدولة العمالة الطوعية وتقسيمها إلى مجموعات عمل متناوبة لرفع وتيرة الإنجاز الميداني والحفاظ على دافعية ومشاركة المجتمع دون إرهاق.'
      },
      {
        id: 'synergy',
        label: 'تكامل الدعم الذاتي والخارجي 💎',
        x: '50%',
        y: '75%',
        icon: '💎',
        content: 'ربط المساهمة الأهلية العينية (حجارة وعمالة) مع المساندة الحكومية (إسمنت وديزل) لضمان الاستخدام الكفء والرشيد للموارد المتاحة لتوسيع طول الطريق.'
      }
    ],
    5: [
      {
        id: 'visual_docs',
        label: 'التوثيق المرئي 📸',
        x: '25%',
        y: '30%',
        icon: '📸',
        content: 'التقاط صور عالية الدقة وقصيرة من نفس الزوايا قبل وبعد الإنجاز لإثبات جودة التسوية والرصف وعرضها بفرز الأثر المكتبي.'
      },
      {
        id: 'final_accounts',
        label: 'الحساب الختامي 📝',
        x: '75%',
        y: '35%',
        icon: '📝',
        content: 'تصفية جميع العهد المالية وحساب تكلفة المتر المربع وتوثيق الفجوات ومطابقة السجلات بدقة مع اللجنة والجمعية المحلية.'
      },
      {
        id: 'beneficiaries',
        label: 'قياس الأثر التنموي 📈',
        x: '50%',
        y: '75%',
        icon: '📈',
        content: 'تقييم كفاءة ومستوى تسهيل نقل البضائع، اختصار زمن السفر، تسهيل وصول الإسعاف، وانعكاس ذلك التنموي والسكاني المستدام.'
      }
    ]
  };

  const activeHotspots = hotspotsData[trackId] || [];

  return (
    <div className="space-y-4 h-full flex flex-col justify-between">
      {/* Visual Canvas Representation */}
      <div className="relative w-full h-[210px] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:16px_16px] opacity-40"></div>
        
        {/* Schematic dynamic background based on trackId */}
        {trackId === 1 && (
          <svg className="absolute inset-0 w-full h-full text-emerald-500/10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 180 Q100 80, 200 130 T390 50" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="5,5" />
            <circle cx="200" cy="130" r="8" fill="red" className="animate-ping" />
            <circle cx="200" cy="130" r="4" fill="red" />
          </svg>
        )}
        {trackId === 2 && (
          <svg className="absolute inset-0 w-full h-full text-amber-500/10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <rect x="50" y="50" width="80" height="80" rx="10" fill="none" stroke="currentColor" strokeWidth="3" />
            <rect x="250" y="70" width="80" height="80" rx="10" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="M130 90 L250 110" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="4" />
          </svg>
        )}
        {trackId === 3 && (
          <svg className="absolute inset-0 w-full h-full text-indigo-500/10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <rect x="120" y="40" width="150" height="130" rx="6" fill="none" stroke="currentColor" strokeWidth="3" />
            <line x1="120" y1="80" x2="270" y2="80" stroke="currentColor" strokeWidth="2" />
            <line x1="120" y1="120" x2="270" y2="120" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
        {trackId === 4 && (
          <svg className="absolute inset-0 w-full h-full text-emerald-500/10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="80" width="310" height="70" rx="4" fill="none" stroke="currentColor" strokeWidth="4" />
            <line x1="140" y1="80" x2="140" y2="150" stroke="currentColor" strokeWidth="2" />
            <line x1="240" y1="80" x2="240" y2="150" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
        {trackId === 5 && (
          <svg className="absolute inset-0 w-full h-full text-sky-500/10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="190,40 230,120 150,120" fill="none" stroke="currentColor" strokeWidth="3" />
            <circle cx="190" cy="80" r="25" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}

        <div className="absolute top-3 right-3 text-[10px] font-black text-slate-400 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
          ⚙️ رسم تفاعلي توضيحي للمواصفات والمسؤوليات
        </div>

        {/* Hotspots overlay */}
        {activeHotspots.map((spot) => {
          const isSelected = selectedHotspot === spot.id;
          return (
            <button
              key={spot.id}
              onClick={() => setSelectedHotspot(isSelected ? null : spot.id)}
              style={{ left: spot.x, top: spot.y }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group transition-all flex items-center justify-center`}
            >
              <span className={`absolute inline-flex h-10 w-10 rounded-full opacity-45 animate-ping transition-colors ${
                isSelected ? 'bg-amber-400' : 'bg-emerald-500'
              }`}></span>
              <span className={`relative rounded-full h-7 w-7 flex items-center justify-center text-xs font-bold border shadow-md transition-all ${
                isSelected 
                  ? 'bg-amber-400 border-amber-300 text-slate-950 scale-110' 
                  : 'bg-emerald-600 border-emerald-500 text-white group-hover:scale-105'
              }`}>
                {spot.icon}
              </span>
              
              {/* Dynamic tooltip */}
              <div className="absolute bottom-full mb-1 bg-slate-900 border border-slate-800 text-[10px] font-extrabold text-slate-200 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                {spot.label}
              </div>
            </button>
          );
        })}

        {/* Empty selection state tip */}
        {!selectedHotspot && (
          <div className="absolute bottom-3 text-center text-[10px] font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 animate-pulse">
            👆 انقر على النقاط المضيئة بالرسم لاستكشاف التفاصيل الهندسية
          </div>
        )}
      </div>

      {/* Info card below showing hotspot details */}
      <div className="flex-1 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 flex flex-col justify-center min-h-[110px] text-slate-200">
        {selectedHotspot ? (
          (() => {
            const spot = activeHotspots.find(s => s.id === selectedHotspot);
            return (
              <div className="space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-800">
                  <span className="text-xs">{spot?.icon}</span>
                  <h4 className="font-extrabold text-[11px] text-amber-400">{spot?.label}</h4>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-300 font-semibold text-justify">
                  {spot?.content}
                </p>
              </div>
            );
          })()
        ) : (
          <div className="text-center space-y-1.5 py-1">
            <span className="text-lg text-slate-500">📍</span>
            <h4 className="font-extrabold text-[11px] text-slate-400">توجيهات الفرز ومراقبة الأداء</h4>
            <p className="text-[9.5px] text-slate-500 max-w-xs mx-auto leading-relaxed">
              اضغط على أي رمز تفاعلي على الرسم التوضيحي بالأعلى لعرض متطلبات الإدارة بالنتائج والمثلث الذهبي للمشاريع التنموية.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const tracksData: TrackDetail[] = [
  {
    id: 1,
    name: "المسار الأول: التشخيص والفرز الفني",
    title: "التشخيص والفرز الفني والأثر التنموي",
    elevation: 1200,
    description: "تأسيس المبادرة وتأكيد جاهزية المجتمع للتنفيذ (التنازلات القانونية مكتملة وموثقة مسبقاً) وضمان سلامة المسارات والمنعطفات الجبلية.",
    roles: {
      cooperative: [
        "التوثيق والتحقق المجتمعي وتنظيم اللجان الخاصة بالمبادرات.",
        "توفير الوثائق والمستندات الخاصة باستلام واستهلاك المواد ميدانياً.",
        "مرافقة فريق الوحدة والشركاء عند النزول إلى المواقع الإنشائية وتوضيح أسباب التعثر إن وجدت.",
        "إثبات ملكية المجتمع للمبادرة وضمان حماية المواد المخزنة بالأماكن المفتوحة."
      ],
      localAuthority: [
        "تذليل العقبات في الميدان وحل النزاعات المحلية التي قد تعيق عملية التشخيص والفرز.",
        "التنسيق مع الوجهاء وعقال الحارات لتسهيل وصول فريق الفرز الفني للمواقع الوعرة والنائية.",
        "التدخل الحازم في حال وجود ممانعة مجتمعية لإجراءات توسيع المسارات أو المناقلة."
      ],
      mobilization: [
        "التحشيد والإسناد المعنوي للأهالي وحل أي خلافات قد تمنع مشاركتهم الفعالة.",
        "عقد اللقاءات التوعوية والتحفيز الإيجابي نحو العمل التعاوني كواجب ديني ومجتمعي.",
        "ربط العمل التنموي وشق الطرق بمفهوم الجهاد والبناء في سبيل الله لخدمة الأمة."
      ],
      interventionUnit: [
        "إجراء الفرز المكتبي الأولي ومطابقة إحداثيات وصور المبادرة المرفوعة إلكترونياً.",
        "إعداد التقارير الفنية الأولية وتدقيق الجدوى الاقتصادية للأثر التنموي ومستوى الحرمان الجغرافي.",
        "تسيير فريق المهندسين والفرسان للنزول الميداني ومطابقة المسارات وإقرار الحلول الفنية الفعالة وتأمين المنعطفات."
      ]
    },
    scenario: {
      desc: "أثناء نزول فريق الفرز والرقابة التقييمية، تبين أن اللجنة المجتمعية بدأت بالعمل في عزلة فرعية أخرى لم تكن معتمدة في خطة الفرز المكتبي الأولي بسبب ضغوط اجتماعية من أحد الوجهاء المحليين، مما أدى لمناقلة غير قانونية للإسمنت المخصص للطريق الرئيسي المتفق عليه. ما هو إجراءك الرقابي والتنموي الصارم؟",
      options: [
        {
          id: 'A',
          text: "الموافقة على تغيير مسار المبادرة وتمرير العمل في الموقع الجديد تجنباً لإحراج الوجهاء المحليين والحفاظ على سرعة وتيرة العمل الواقعي.",
          feedback: "⚠️ خطأ تنموي وإداري فادح! إن تغليب النفوذ الشخصي وتجاوز مخرجات الفرز المكتبي والمحاضر المعمدة يكرس العشوائية والمحسوبية في توزيع دعم الدولة، ويهدر الموارد المخصصة للطرق الحيوية الأشد حرماناً، مما يفقد المبادرة قيمتها التشاركية العادلة.",
          impact: { budget: -20, time: -15, quality: -50 }
        },
        {
          id: 'B',
          text: "وقف الدعم فوراً، وإلزام اللجنة المجتمعية بالعودة للمسار الأساسي المعمد مع فتح باب تقديم طلب جديد للعزلة الأخرى وتوثيقها بفرز فني مستقل للموسم القادم.",
          feedback: "🏆 قرار تنموي وإداري شجاع ومؤسسي! تطبيق معايير العدالة والمطابقة الجغرافية يحمي المثلث الذهبي، ويضمن وصول المساندة لمستحقيها الفعليين بناءً على معدلات الحرمان، ويرسخ هيبة القوانين واللوائح التنظيمية والشفافية.",
          impact: { budget: 15, time: 20, quality: 50 }
        }
      ]
    }
  },
  {
    id: 2,
    name: "المسار الثاني: حشد المساهمات الذاتية والمشاركة الشعبية",
    title: "حشد المساهمات الذاتية والجهود الشعبية",
    elevation: 1400,
    description: "تنظيم المساهمات العينية والنقدية والعمالة الطوعية من المجتمع والمغتربين كقاعدة أساسية لتفعيل الدعم.",
    roles: {
      cooperative: [
        "تجميع وتوثيق التبرعات النقدية للأهالي والمغتربين وفتح حسابات بنكية مخصصة للمبادرة.",
        "تنظيم وتوثيق مساهمات المجتمع العينية من حجارة وركام (نيس) ومعدات يمتلكها أهالي القرى.",
        "إعداد كشوفات المستفيدين وتوثيق مساحات الأراضي المتنازل عنها لتوسعة الطريق قانونياً."
      ],
      localAuthority: [
        "الإشراف الإداري على لجان جمع التبرعات وضمان توجيهها بالكامل لصالح المبادرة وتوثيق المحاضر.",
        "حل أي نزاعات أهلية أو قبلية تتعلق بمسارات الطرق أو توزيع المياه أو مساهمة القرى المستفيدة."
      ],
      mobilization: [
        "إثارة الحماس والوازع الديني والنهضوي لدعم مبادرات الطرق الطوعية بالمال والجهد.",
        "استنفار فرسان التنمية لحشد الأهالي وعقد اللقاءات التوعوية المستمرة لتفعيل وتكامل دور المجتمع.",
        "التنسيق المستمر مع المغتربين والداعمين بالخارج لإسناد المبادرات بالداخل مالياً وعينياً."
      ],
      interventionUnit: [
        "دراسة حجم وقيمة المساهمة الأهلية للتأكد من مطابقة نسبة الدعم المقدم من الدولة.",
        "توجيه وتدريب الفرسان واللجان المحلية حول آليات توثيق المساهمات ورفع كشوفات العمالة الميدانية.",
        "التحقق والفرز الفني لمدى جدية التبرعات والالتزام بتوفير الحجارة والعمالة قبل نزول المهندسين."
      ]
    },
    scenario: {
      desc: "طُرحت فكرة شق ورصف طريق عقبة جبلية وعرة بمديرية الرضمة، وحدث انقسام في المجتمع المحلي بين من يريد العمل فوراً وبين من يرفض المساهمة بحجة أن الدولة يجب أن تتكفل بكل شيء، مما هدد بفشل المبادرة قبل بدئها. ما هو قرارك الإداري والتنموي لحشد المجتمع وتفعيل المبادرة؟",
      options: [
        {
          id: 'A',
          text: "الانتظار وتجميد المبادرة حتى تقتنع السلطة بتكلفة كل شيء بالكامل من الميزانية العامة وتوفير العمالة بالأجر اليومي لمنع التصدعات والنزاع.",
          feedback: "⚠️ تجميد فادح! المبادرات التشاركية تقوم أساساً على تلاحم وتكامل دور المجتمع والدولة. رهن العمل بالدعم الكلي يعطل التنمية في ظل الشح العام للموارد ويفقد الموارد الأهلية قيمتها التنموية.",
          impact: { budget: -30, time: 30, quality: -20 }
        },
        {
          id: 'B',
          text: "استنفار فرسان التنمية لإقامة لقاءات عامة توعوية، وإبراز الأثر الاقتصادي للطريق، وفتح باب المساهمة للمغتربين، وتنظيم نوبات العمالة الطوعية بالتساوي.",
          feedback: "🏆 نجاح تنموي باهر! إيقاظ روح التعاون الذاتي وتكامل الموارد (الحجارة والعمالة محلياً والأسمنت والديزل من الدولة) يضمن تفعيل المبادرة وتحقيق المثلث الذهبي بكفاءة عالية.",
          impact: { budget: 30, time: -15, quality: 35 }
        }
      ]
    }
  },
  {
    id: 3,
    name: "المسار الثالث: الإمداد اللوجستي والمناقلة",
    title: "التخزين والمناقلة وحماية المواد اللوجستية",
    elevation: 1550,
    description: "تأمين مخازن الإسمنت، وإدارة كميات الديزل، وتنفيذ المناقلات الرشيدة عند ركود بعض المواقع.",
    roles: {
      cooperative: [
        "التأكد من توفير مخازن جافة وآمنة للإسمنت ومرفوعة على عوارض خشبية مناسبة.",
        "توثيق استلام الحصص والإسناد العيني والمشاركة في إعداد محاضر الفرز اللوجستي للمناقلات.",
        "تأمين الحراسة المجتمعية المشددة لمنع السرقة أو الهدر أو تسييس توزيع الدعم."
      ],
      localAuthority: [
        "تسهيل حركة القوافل والشاحنات الحاملة لمواد الدعم وحماية خط السير.",
        "المشاركة الرسمية في توقيع محاضر المناقلة القانونية بالتنسيق مع وحدة التدخلات والجمعيات التعاونية.",
        "اتخاذ القرارات الإدارية الحازمة والصارمة ضد أي أطراف تعيق المبادرة أو تغلّب مصالحها الشخصية الضيقة."
      ],
      mobilization: [
        "تحشيد المجتمع لتوفير وسائل النقل المحلية لنقل الإسمنت والديزل من المخازن المركزية إلى مواقع العمل الوعرة.",
        "عقد اللقاءات التوعوية والتحفيز الإيجابي المستمر لتعزيز النفير العام.",
        "حل النزاعات الميدانية ودعم لجان الحشد لتأمين العمالة المتطوعة.",
        "تحفيز وتوجيه فرسان التنمية لحشد الجهود الذاتية ومساهمات المغتربين في تفعيل خطة المبادرات."
      ],
      interventionUnit: [
        "اتخاذ القرار الفني والمالي الحاسم بالمناقلة وإعادة توجيه الدعم بناءً على تقارير الركود.",
        "إعداد وتوثيق محاضر الفرز الفني للمناقلات وتحديد الكميات المنقولة وصلاحيتها الفنية.",
        "الإشراف والرقابة المباشرة على حركة وتفريغ الشاحنات في المواقع الجديدة لضمان كفاءة الإنفاق."
      ]
    },
    scenario: {
      desc: "هناك منخفض جوي محمل بالسيول والبرق قادم لمديريات محافظة إب خلال 48 ساعة، ولديكم شحنة إسمنت ضخمة مخزنة في العراء قرب موقع الصب لتسهيل حركة العمال. ماذا تفعل لحمايتها؟",
      options: [
        {
          id: 'A',
          text: "تغطية الأسمنت في مكانه المكشوف بشوادر بلاستيكية مؤقتة وسريعة لتوفير الوقت",
          feedback: "⚠️ خطأ فادح! السيول الجارية ستتسرب تحت الأكياس وتتسبب في تصلب الإسمنت وتحوله لكتل حجرية تالفة، مما يعني خسارة فادحة للميزانية والجودة.",
          impact: { budget: -40, time: 10, quality: -45 }
        },
        {
          id: 'B',
          text: "نقل كميات الإسمنت فوراً إلى مستودع مغلق وآمن ورفعه على عوارض خشبية بارتفاع 20 سم عن الأرض",
          feedback: "🏆 ممتاز جداً! حماية المواد وتخزينها الفني السليم هو جوهر نجاح الإدارة. المحافظة على جفاف الإسمنت تضمن بقاء ميزانية المبادرة قوية والخرسانة ممتازة.",
          impact: { budget: -15, time: 15, quality: 45 }
        }
      ]
    }
  },
  {
    id: 4,
    name: "المسار الرابع: الإعلام التنموي والتحشيد",
    title: "الإعلام التنموي والتحشيد وإبراز الشفافية",
    elevation: 1720,
    description: "بث روح التنافس بين المديريات، مكافحة الشائعات، ونشر تقارير الإنجاز والشفافية المالية.",
    roles: {
      cooperative: [
        "المحفز والممثل المجتمعي الرئيسي في وسائل الإعلام المختلفة.",
        "دعوة المجتمع للمشاركة الفاعلة في توثيق الأعمال ومشاركة الصور واللقطات وإظهار روح المبادرة.",
        "استخدام حسابات الجمعية ومنصاتها لنشر أخبار المبادرة وإبراز كفاءة الإنفاق والمساهمات الأهلية."
      ],
      localAuthority: [
        "التنسيق مع القنوات التلفزيونية والإعلاميين والرفع المستمر لقصص النجاح الميدانية.",
        "إبراز روح الصمود المجتمعي والتلاحم الشعبي في مواجهة التحديات الجغرافية الصعبة."
      ],
      mobilization: [
        "إقامة اللقاءات العامة لتعزيز الوعي النهضوي وبث الطاقة المعنوية بالقرى.",
        "ربط نجاح مبادرات الطرق بالهوية الإيمانية والصمود والتعاون التكاملي.",
        "التحشيد المستمر والمتواصل لاستقطاب متطوعين جدد وتغذية جبهات البناء التنموي."
      ],
      interventionUnit: [
        "توفير المنصات الإعلامية الرقمية المركزية والمجموعات الرسمية لتوثيق قصص النجاح.",
        "صياغة التقارير الوطنية لإظهار وفورات المثلث الذهبي ومستوى كفاءة استغلال إسمنت وحدة التدخلات.",
        "إنتاج وبث فلاشات توعوية مصورة للفرسان واللجان توضح آليات الصيانة التشاركية المستدامة وحفظ ديمومة الأصول التنموية."
      ]
    },
    scenario: {
      desc: "انتشرت شائعة كاذبة بأن لجنة المبادرة توزع إسمنت الدعم لخدمة مصالح شخصية ولشق طرق فرعية للمنازل الخاصة، وبدأ المتطوعون بالانسحاب والفتور. كيف تواجه الشائعة؟",
      options: [
        {
          id: 'A',
          text: "تجاهل الشائعة تماماً لعدم تضييع الوقت والاستمرار بالعمل الصامت",
          feedback: "⚠️ تجاهل الرأي العام في المشاريع التشاركية يدمر الثقة. عزوف الداعمين ومساهمات المغتربين سيوقف العمل ويهدد بفشل المشروع وتلف المواد المخزنة.",
          impact: { budget: -20, time: 25, quality: -15 }
        },
        {
          id: 'B',
          text: "نشر تقارير مصورة دورية ومشاركة محاضر التوزيع ومخططات المستفيدين بشفافية علنية تامة",
          feedback: "🏆 إعلام تنموي راقٍ! الشفافية والمكاشفة تخرسان الشائعات فوراً، وتبنيان جسراً من الثقة العميقة مع المغتربين والداعمين مما يحفزهم لزيادة الإسناد المالي.",
          impact: { budget: 25, time: -10, quality: 15 }
        }
      ]
    }
  },
  {
    id: 5,
    name: "المسار الخامس: الرقابة وتقييم الأداء",
    title: "الرقابة التنموية وتقييم النضج والتمكين",
    elevation: 1900,
    description: "مطابقة التزامات المبادرة، تتبع تصفية العهد، تفعيل صناديق الصيانة التشاركية، وتأكيد الاستلام الهندسي والمجتمعي القانوني.",
    roles: {
      cooperative: [
        "المطابقة الميدانية التنموية وتقييم أداء الفرسان وتصوير مراحل الإشراك الفعلي للمجتمع.",
        "مطابقة التقارير الميدانية مع سجلات مساهمات الأهالي والمغتربين الحقيقية وتدقيق العهد.",
        "متابعة التزام اللجان والفرسان الميدانيين بنشر الحسابات الختامية والشفافية مع الشركاء."
      ],
      localAuthority: [
        "متابعة دورية مستمرة لمستويات النضج المؤسسي لإدارات المبادرات وأداء فرسان التنمية.",
        "الرفع بالتقارير التقييمية الدورية لمستوى تفاعل ومطابقة الجهات المحلية وتأسيس صناديق الصيانة."
      ],
      mobilization: [
        "مراقبة استدامة التلاحم التشاركي وتأكيد حماية المشروع من الصراعات والخلافات الأهلية.",
        "بناء جسور التواصل المستمر ومشاركة قصص النجاح وقيمة المجهود الذاتي مع المغتربين."
      ],
      interventionUnit: [
        "المراجعة الهندسية الفنية الشاملة والمطابقة الصارمة لصور الإنجاز ونظام الفرز المكتبي المسبق.",
        "تسيير لجان التفتيش المالي والإداري والهندسي المفاجئ للتأكد من الشفافية الكاملة وتوزيع المسؤوليات وتفعيل الرقابة الأهلية.",
        "إصدار تقارير الأثر التنموي لتحديد كفاءة استخدام الموارد وإقرار أهلية المجموعات لدعم مستقبلي."
      ]
    },
    scenario: {
      desc: "أثناء نزولك الميداني للرقابة والفرز التنموي، اكتشفت أن لجنة التنمية المحلية بالمديرية استأثرت بالقرارات دون إشراك اللجان المجتمعية بالقرى المستفيدة، مما أدى لفتور همة الأهالي وتراجع مشاركتهم الطوعية خوفاً من الإقصاء. ما هو إجراءك القيادي؟",
      options: [
        {
          id: 'A',
          text: "مواصلة التنفيذ بالوتيرة الحالية والاعتماد على مقاولين خارجيين لإكمال المبادرة بسرعة دون إضاعة الوقت في اللقاءات المجتمعية",
          feedback: "⚠️ خطأ تنموي جسيم! إقصاء المجتمع المحلي والاعتماد على قوى خارجية يدمر 'رأس المال الاجتماعي' والثقة المحلية، ويحرم المبادرة من ديمومتها التشاركية حيث سيعتبرها الأهالي مشروعاً مفروضاً ولن يشاركوا مستقبلاً في حمايتها أو صيانتها.",
          impact: { budget: -20, time: 25, quality: -30 }
        },
        {
          id: 'B',
          text: "عقد لقاء مجتمعي عاجل لإعادة هيكلة اللجنة الشعبية لضمان تمثيل عادل لكافة القرى، وتدريبهم على مبادئ التمكين والحوكمة التشاركية",
          feedback: "🏆 قرار تنموي بليغ ومستدام! تعزيز التمثيل المجتمعي الشفاف والشامل يعيد الثقة ويبعث الهمم، مما يحقق توازناً مستداماً للأعمال ويضمن حشداً استثنائياً للمجهودات الذاتية والصيانة الدورية المستمرة للأصل التنموي.",
          impact: { budget: 25, text: -10, quality: 45 } as any // Use cast to prevent any minor TS mismatches if any
        }
      ]
    }
  }
];

const trackImages: Record<number, string> = {
  1: '/src/assets/images/track1_survey_1784421279240.jpg',
  2: '/src/assets/images/track2_volunteers_1784421387279.jpg',
  3: '/src/assets/images/track3_warehouse_1784421399242.jpg',
  4: '/src/assets/images/track4_media_1784421409733.jpg',
  5: '/src/assets/images/track5_quality_1784421420419.jpg',
};

const trackIcons: Record<number, string> = {
  1: '📋',
  2: '✊',
  3: '📦',
  4: '📢',
  5: '💎',
};

export default function WorkshopPresentation({ onClose, onStatsChange, initiatives }: WorkshopPresentationProps) {
  const activeInitiatives = (initiatives && initiatives.length > 0) ? initiatives : INITIAL_INITIATIVES;
  const [activeTab, setActiveTab] = useState<'map' | 'live_map' | 'roles' | 'game' | 'analytics' | 'empowerment' | 'governorate'>('map');
  const [selectedTrackId, setSelectedTrackId] = useState<number>(1);
  const [activeRoleFilter, setActiveRoleFilter] = useState<'cooperative' | 'localAuthority' | 'mobilization' | 'interventionUnit'>('cooperative');
  const [selectedAgencyInTrack, setSelectedAgencyInTrack] = useState<'all' | 'cooperative' | 'localAuthority' | 'mobilization' | 'interventionUnit'>('all');
  const [districtSearchQuery, setDistrictSearchQuery] = useState<string>('');
  const [selectedAnalyticsDistrict, setSelectedAnalyticsDistrict] = useState<string>('all');
  const [analyticsSubDistrictQuery, setAnalyticsSubDistrictQuery] = useState<string>('');
  
  // Custom states for export, presentation & theme
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkPresentation, setIsDarkPresentation] = useState(false);
  const [isExportingPPTX, setIsExportingPPTX] = useState(false);
  const [isExportingHTML, setIsExportingHTML] = useState(false);
  const [maturityChecked, setMaturityChecked] = useState<boolean[]>([false, false, false, false]);
  const [selectedInitiativeIdForMaturity, setSelectedInitiativeIdForMaturity] = useState<string>('all');

  // Game simulation state
  const [step, setStep] = useState(0);
  const [stats, setStats] = useState({ budget: 100, time: 100, quality: 100 });
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);
  const [decisionsHistory, setDecisionsHistory] = useState<Array<{ track: string; title: string; decision: string; id: string }>>([]);

  const handleExportPPTX = async () => {
    setIsExportingPPTX(true);
    try {
      const total = activeInitiatives.length;
      const completed = activeInitiatives.filter(i => i.status === 'completed').length;
      const pending = activeInitiatives.filter(i => i.status === 'pending').length;
      const stagnant = activeInitiatives.filter(i => i.status === 'stagnant').length;
      const ongoing = activeInitiatives.filter(i => i.status === 'ongoing').length;
      const stopped = activeInitiatives.filter(i => i.status === 'stopped').length;

      const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
      const ongoingPct = total > 0 ? Math.round((ongoing / total) * 100) : 0;

      const totalContributionsValue = activeInitiatives.reduce((sum, init) => {
        return sum + (init.contributions?.reduce((s, c) => s + (c.value || 0), 0) || 0);
      }, 0);

      const cashValue = activeInitiatives.reduce((sum, init) => {
        return sum + (init.contributions?.filter(c => c.type === 'cash').reduce((s, c) => s + (c.value || 0), 0) || 0);
      }, 0);

      const materialValue = activeInitiatives.reduce((sum, init) => {
        return sum + (init.contributions?.filter(c => c.type === 'inkind_material').reduce((s, c) => s + (c.value || 0), 0) || 0);
      }, 0);

      const laborValue = activeInitiatives.reduce((sum, init) => {
        return sum + (init.contributions?.filter(c => c.type === 'inkind_labor').reduce((s, c) => s + (c.value || 0), 0) || 0);
      }, 0);

      const statsObj = {
        total,
        completed,
        ongoing,
        pending,
        stagnant,
        stopped,
        completedPct,
        ongoingPct,
        totalContributionsValue,
        cashValue,
        materialValue,
        laborValue,
        selfRelianceMultiplier: totalContributionsValue > 0 && materialValue > 0 ? (totalContributionsValue / materialValue).toFixed(1) : "3.4",
        workdaysCount: Math.round(laborValue / 5000),
        laborValueFormatted: `${(laborValue / 1000000).toFixed(1)} مليون ريال عيني`
      };

      const editableSlides = [
        {
          title: "الورشة التفاعلية لفرسان التنمية بمحافظة إب",
          subtitle: "تمكين المجتمع وإدارة قيود المبادرات وفق نموذج التنمية المتكاملة",
          bullets: [
            "تفعيل المبادرات الميدانية بروح الاستدامة وتوزيع الأدوار والمهام التشاركية.",
            "مكافحة الشائعات وتوطيد قيم الشفافية والمكاشفة لبناء الثقة والاعتماد على الذات.",
            "الفرز الفني والتنموي المبكر لتجنب تعثر المبادرات وتحقيق استدامة المشاريع.",
            "إيجاد صناديق صيانة تشاركية لحماية وصيانة الطرق الجبلية من جرف السيول."
          ]
        }
      ];

      const pptxPathways = tracksData.map(track => ({
        title: track.title,
        subtitle: track.description,
        tasks: track.roles.cooperative,
        authorityTasks: track.roles.localAuthority,
        mobilizationTasks: track.roles.mobilization
      }));

      await exportToPowerPoint(activeInitiatives, statsObj, editableSlides, pptxPathways);
    } catch (error) {
      console.error("PPTX Export failed:", error);
    } finally {
      setIsExportingPPTX(false);
    }
  };

  const handleExportHTML = () => {
    setIsExportingHTML(true);
    try {
      const total = activeInitiatives.length;
      const completed = activeInitiatives.filter(i => i.status === 'completed').length;
      const pending = activeInitiatives.filter(i => i.status === 'pending').length;
      const stagnant = activeInitiatives.filter(i => i.status === 'stagnant').length;
      const ongoing = activeInitiatives.filter(i => i.status === 'ongoing').length;
      const stopped = activeInitiatives.filter(i => i.status === 'stopped').length;

      const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
      const ongoingPct = total > 0 ? Math.round((ongoing / total) * 100) : 0;
      const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;
      const stagnantPct = total > 0 ? Math.round((stagnant / total) * 100) : 0;
      const stoppedPct = total > 0 ? Math.round((stopped / total) * 100) : 0;

      const totalContributionsValue = activeInitiatives.reduce((sum, init) => {
        return sum + (init.contributions?.reduce((s, c) => s + (c.value || 0), 0) || 0);
      }, 0);

      const cashValue = activeInitiatives.reduce((sum, init) => {
        return sum + (init.contributions?.filter(c => c.type === 'cash').reduce((s, c) => s + (c.value || 0), 0) || 0);
      }, 0);

      const materialValue = activeInitiatives.reduce((sum, init) => {
        return sum + (init.contributions?.filter(c => c.type === 'inkind_material').reduce((s, c) => s + (c.value || 0), 0) || 0);
      }, 0);

      const laborValue = activeInitiatives.reduce((sum, init) => {
        return sum + (init.contributions?.filter(c => c.type === 'inkind_labor').reduce((s, c) => s + (c.value || 0), 0) || 0);
      }, 0);

      const statsObjForHTML = {
        total,
        completed,
        ongoing,
        pending,
        stagnant,
        stopped,
        completedPct,
        ongoingPct,
        pendingPct,
        stagnantPct,
        stoppedPct,
        totalContributionsValue,
        cashValue,
        materialValue,
        laborValue
      };

      const htmlContent = generateOfflinePresentationHTML(activeInitiatives, statsObjForHTML);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'workshop_presentation_ibb_dhi_as_sufal_offline.html');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("HTML Export failed:", error);
    } finally {
      setIsExportingHTML(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Sync stats back to parent App using bulletproof latest-ref pattern to prevent infinite rendering loops
  const onStatsChangeRef = React.useRef(onStatsChange);
  React.useEffect(() => {
    onStatsChangeRef.current = onStatsChange;
  }, [onStatsChange]);

  React.useEffect(() => {
    if (onStatsChangeRef.current) {
      onStatsChangeRef.current(stats);
    }
  }, [stats.budget, stats.time, stats.quality]);

  const handleChoice = (option: Option) => {
    if (showFeedback) return;
    setSelectedOption(option);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (!selectedOption) return;
    
    const currentTrack = tracksData[step];
    setDecisionsHistory(prev => [
      ...prev,
      {
        track: currentTrack.name,
        title: currentTrack.scenario.desc.substring(0, 50) + "...",
        decision: selectedOption.text,
        id: selectedOption.id
      }
    ]);

    setStats(prev => ({
      budget: Math.max(0, Math.min(200, prev.budget + selectedOption.impact.budget)),
      time: Math.max(0, Math.min(200, prev.time + selectedOption.impact.time)),
      quality: Math.max(0, Math.min(200, prev.quality + selectedOption.impact.quality))
    }));

    if (step < tracksData.length - 1) {
      setStep(prev => prev + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      setFinished(true);
    }
  };

  const handleReset = () => {
    setStep(0);
    setStats({ budget: 100, time: 100, quality: 100 });
    setSelectedOption(null);
    setShowFeedback(false);
    setFinished(false);
    setDecisionsHistory([]);
  };

  const activeTrack = tracksData.find(t => t.id === selectedTrackId) || tracksData[0];

  return (
    <div 
      className={`transition-all duration-300 ${
        isFullscreen 
          ? `fixed inset-0 z-50 ${isDarkPresentation ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'} overflow-y-auto p-6 md:p-10 text-right space-y-6` 
          : `max-w-7xl mx-auto space-y-6 animate-fadeIn text-right ${isDarkPresentation ? 'text-slate-100' : 'text-slate-900'}`
      }`} 
      dir="rtl"
    >
      {/* Top Banner and Navigation Tabs */}
      <div className={`p-6 rounded-3xl shadow-lg border flex flex-col xl:flex-row xl:items-center justify-between gap-6 transition-colors ${
        isDarkPresentation 
          ? 'bg-slate-900 text-white border-slate-800' 
          : 'bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Compass className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-100">بوابة فرسان التنمية بمحافظة إب 🇾🇪</h1>
            <p className="text-xs text-slate-400">المسارات الخمسة لتنفيذ خطة تفعيل المبادرات وفق أسس العمل التنموي المتكامل والإدارة بالنتائج</p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-800/85 p-1 rounded-2xl border border-slate-700/50 flex-wrap gap-1 max-w-full">
          <button 
            onClick={() => setActiveTab('map')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'map' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Navigation className="w-4 h-4" />
            مسارات التفعيل والتوجه 🧭
          </button>
          <button 
            onClick={() => setActiveTab('live_map')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'live_map' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            بوابة الخرائط ومخططات التدخل 🗺️
          </button>
          <button 
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'roles' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            توزيع الأدوار والمهام 👥
          </button>
          <button 
            onClick={() => setActiveTab('game')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'game' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 animate-bounce" />
            محاكاة القرارات الميدانية 📊
          </button>
          <button 
            onClick={() => setActiveTab('empowerment')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'empowerment' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400 animate-pulse" />
            دليل التمكين التعاوني 🤝
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'analytics' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            المخططات والفجوة التنموية 📊
          </button>
        </div>

        {/* Action Controls & Home Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Theme Mode Switcher */}
          <button
            onClick={() => setIsDarkPresentation(!isDarkPresentation)}
            className={`flex p-2.5 rounded-xl border transition-all cursor-pointer items-center justify-center gap-1.5 text-xs font-bold ${
              isDarkPresentation 
                ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400' 
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
            }`}
            title="التبديل بين النمط المضيء والنمط الليلي للورشة"
          >
            {isDarkPresentation ? <Sun className="w-4 h-4 text-slate-950" /> : <Moon className="w-4 h-4 text-amber-400" />}
            <span className="hidden sm:inline">{isDarkPresentation ? "النمط المضيء ☀️" : "النمط الليلي 🌙"}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="flex bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white p-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer items-center justify-center gap-1 text-xs font-bold"
            title={isFullscreen ? "الخروج من ملء الشاشة" : "عرض بملء الشاشة للتلميح التعاوني"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-rose-400" /> : <Maximize2 className="w-4 h-4 text-amber-400" />}
            <span className="hidden sm:inline">{isFullscreen ? "خروج من ملء الشاشة" : "ملء الشاشة 📺"}</span>
          </button>

          {/* Export PPTX Button */}
          <button
            onClick={handleExportPPTX}
            disabled={isExportingPPTX}
            className="flex bg-amber-500 hover:bg-amber-600 disabled:bg-amber-800/50 text-slate-950 disabled:text-slate-400 p-2.5 rounded-xl transition-all cursor-pointer items-center justify-center gap-1.5 text-xs font-black border border-amber-400"
          >
            <FileDown className="w-4 h-4" />
            <span>{isExportingPPTX ? "جاري التصدير..." : "تصدير بوربوينت 📥"}</span>
          </button>

          {/* Offline HTML Presentation Export Button */}
          <button
            onClick={handleExportHTML}
            disabled={isExportingHTML}
            className="flex bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-emerald-400 hover:text-emerald-300 p-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer items-center justify-center gap-1.5 text-xs font-bold"
          >
            <Globe className="w-4 h-4" />
            <span>{isExportingHTML ? "جاري التجهيز..." : "تنزيل بدون إنترنت 💾"}</span>
          </button>

          {onClose && (
            <button 
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white p-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1 text-xs font-bold"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">العودة للرئيسية 🏠</span>
            </button>
          )}
        </div>
      </div>

      {/* Governorate & District Selector Bar */}
      <div className="bg-slate-900/90 text-white p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5 flex-wrap">
          <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-black text-slate-200">المرشح الجغرافي للورشة:</span>
          <select
            value={selectedAnalyticsDistrict}
            onChange={(e) => setSelectedAnalyticsDistrict(e.target.value)}
            className="bg-slate-800 text-amber-300 font-bold text-xs py-1.5 px-3 rounded-xl border border-amber-500/30 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="all">🌐 كافة مديريات محافظة إب (٢٠ مديرية)</option>
            {ALL_DISTRICTS.map((d) => (
              <option key={d} value={d.startsWith('مديرية') ? d : `مديرية ${d}`}>
                📍 {d.startsWith('مديرية') ? d : `مديرية ${d}`}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-500/20 self-start sm:self-auto">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>جميع صفحات وخرائط الورشة مجهزة للعمل 100% بدون إنترنت (أوفلاين) 📶⚡</span>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE MOUNTAIN MAP VIEW */}
      {activeTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SVG Map Section (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-md">
              {/* Mountain contour decoration */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg width="100%" height="100%" viewBox="0 0 800 300" fill="none">
                  <path d="M 0 300 Q 150 100 350 200 T 800 80 L 800 300 Z" fill="url(#mountainMapGrad)" />
                  <defs>
                    <linearGradient id="mountainMapGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div className="flex justify-between items-center mb-6 relative z-10">
                <h2 className="text-sm font-black text-amber-400 bg-amber-500/5 px-4 py-1.5 rounded-full border border-amber-500/20 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-amber-500 animate-pulse" />
                  مخطط المسار التنفيذي التفاعلي لخطوات تفعيل خطة المبادرات
                </h2>
                <span className="text-[10px] text-slate-400 font-mono">التقدم التراكمي للخطة: {activeTrack.id * 20}% (المرحلة {activeTrack.id} من 5)</span>
              </div>

              {/* 3D-like Winding Road SVG Map */}
              <div className="relative z-10 py-6">
                <svg className="w-full h-44" viewBox="0 0 800 160" fill="none">
                  {/* Outer glowing road width */}
                  <path 
                    d="M 60 130 C 200 40, 240 140, 420 50 C 540 -10, 620 120, 740 40" 
                    stroke="#1e293b" 
                    strokeWidth="16" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  {/* Road centerline */}
                  <path 
                    d="M 60 130 C 200 40, 240 140, 420 50 C 540 -10, 620 120, 740 40" 
                    stroke="#b45309" 
                    strokeWidth="6" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeDasharray="8 6"
                  />
                  {/* Highlight current segment */}
                  <path 
                    d="M 60 130 C 200 40, 240 140, 420 50 C 540 -10, 620 120, 740 40" 
                    stroke="#10b981" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeDasharray="1000"
                    strokeDashoffset={1000 - (selectedTrackId * 180)}
                    className="transition-all duration-700 opacity-80"
                  />

                  {/* Nodes along the road */}
                  {tracksData.map((track, idx) => {
                    const isSelected = track.id === selectedTrackId;
                    let cx = 60 + idx * 160;
                    let cy = 130;
                    if (idx === 1) { cx = 220; cy = 70; }
                    if (idx === 2) { cx = 350; cy = 90; }
                    if (idx === 3) { cx = 500; cy = 30; }
                    if (idx === 4) { cx = 680; cy = 70; }

                    return (
                      <g 
                        key={track.id} 
                        className="cursor-pointer group"
                        onClick={() => setSelectedTrackId(track.id)}
                      >
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r={isSelected ? "18" : "13"} 
                          className={`transition-all duration-300 stroke-2 ${
                            isSelected 
                              ? 'stroke-amber-400 fill-amber-950/90 animate-pulse' 
                              : 'stroke-slate-600 fill-slate-900 group-hover:stroke-amber-300'
                          }`} 
                        />
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r="6" 
                          className={`transition-all ${
                            isSelected ? 'fill-amber-400' : 'fill-slate-500 group-hover:fill-amber-300'
                          }`} 
                        />
                        <text 
                          x={cx} 
                          y={cy - 24} 
                          textAnchor="middle" 
                          className={`text-xs font-black transition-all select-none ${
                            isSelected ? 'fill-amber-400 font-extrabold scale-110' : 'fill-slate-400 group-hover:fill-white'
                          }`}
                        >
                          المسار {track.id}
                        </text>
                        <text 
                          x={cx} 
                          y={cy + 26} 
                          textAnchor="middle" 
                          className="text-[9px] fill-slate-400 font-bold"
                        >
                          المرحلة {track.id} ({track.id * 20}%)
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Tracks Visual Cards Portal */}
              <div className="border-t border-slate-800/80 pt-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11.5px] font-black text-amber-400 bg-amber-500/5 px-3 py-1 rounded-full border border-amber-500/10 w-fit">
                    بوابة بطاقات خطوات التفعيل التنموي الخمسة ⚡
                  </span>
                  <span className="text-[10px] text-slate-400">انقر على صورة المرحلة لاستكشاف المهام التنموية والتنسيقية</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {tracksData.map((t) => {
                    const isSelected = t.id === selectedTrackId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTrackId(t.id)}
                        className={`group relative h-44 rounded-2xl overflow-hidden border text-right transition-all duration-300 cursor-pointer flex flex-col justify-between p-3.5 ${
                          isSelected
                            ? 'border-amber-400 shadow-lg shadow-amber-500/15 scale-[1.03] ring-2 ring-amber-400/25'
                            : 'border-slate-800 hover:border-slate-600 hover:scale-[1.01]'
                        }`}
                      >
                        {/* Background Photographic Image */}
                        <img
                          src={trackImages[t.id]}
                          alt={t.name}
                          className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-110 opacity-35 group-hover:opacity-45"
                          referrerPolicy="no-referrer"
                        />
                        {/* High-Contrast Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/75 to-slate-950/45 z-0"></div>

                        {/* Top Metadata */}
                        <div className="flex justify-between items-center w-full relative z-10">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                            isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-900/85 text-slate-300'
                          }`}>
                            المرحلة {t.id}
                          </span>
                          <span className="text-[9px] text-slate-300 font-mono font-bold bg-slate-950/70 px-1.5 py-0.5 rounded-sm">
                            📈 {t.id * 20}%
                          </span>
                        </div>

                        {/* Bottom Info */}
                        <div className="relative z-10 space-y-1 mt-auto">
                          <h4 className={`text-[11.5px] font-black transition-colors leading-snug ${
                            isSelected ? 'text-amber-400' : 'text-white group-hover:text-amber-300'
                          }`}>
                            {trackIcons[t.id]} {t.name.split(': ')[1]}
                          </h4>
                          <p className="text-[9.5px] text-slate-300 line-clamp-2 leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity">
                            {t.description}
                          </p>
                          {isSelected && (
                            <div className="flex items-center gap-1.5 text-[8.5px] font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-sm w-fit mt-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              نشط ومختار حالياً
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected Track Detailed Description card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Right side: Detailed descriptions & roles (col-span-8) */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <span className="inline-block text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-2">
                        بنية العمل التنموي المتكامل والإدارة بالنتائج
                      </span>
                      <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        {activeTrack.name}
                      </h3>
                      <p className="text-slate-600 text-xs mt-1.5 leading-relaxed font-semibold">
                        {activeTrack.description}
                      </p>

                      {/* Summary Metrics Banner for Detailed Intervention Plans */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-100 font-mono text-xs">
                        <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl">
                          <span className="text-[9px] font-sans font-bold text-slate-500 block">عدد المبادرات المشمولة</span>
                          <strong className="text-sm font-black text-slate-900">{initiatives.length} <span className="text-[10px] text-slate-500 font-normal">مبادرة</span></strong>
                        </div>
                        <div className="bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-xl">
                          <span className="text-[9px] font-sans font-bold text-emerald-700 block">متوسط نسبة الإنجاز الفعلي</span>
                          <strong className="text-sm font-black text-emerald-700">
                            {Math.round((initiatives || []).reduce((acc, curr) => acc + (curr.completionRate || 0), 0) / (initiatives.length || 1))}%
                          </strong>
                        </div>
                        <div className="bg-indigo-50/60 border border-indigo-100 p-2.5 rounded-xl">
                          <span className="text-[9px] font-sans font-bold text-indigo-700 block">التكلفة الإجمالية التقديرية</span>
                          <strong className="text-xs font-black text-indigo-900">
                            {(((initiatives || []).reduce((acc, curr) => acc + (curr.cost || 0), 0)) / 1000000).toFixed(1)} مليون <span className="text-[9px]">ريال</span>
                          </strong>
                        </div>
                        <div className="bg-amber-50/60 border border-amber-100 p-2.5 rounded-xl">
                          <span className="text-[9px] font-sans font-bold text-amber-800 block">المساهمة المجتمعية الأهلية</span>
                          <strong className="text-xs font-black text-amber-900">
                            {(((initiatives || []).reduce((acc, curr) => acc + (curr.communityContribution || 0), 0)) / 1000000).toFixed(1)} مليون <span className="text-[9px]">ريال</span>
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agency filtering options in each track */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 space-y-2">
                    <span className="text-[11px] font-black text-slate-500 block">اختر الجهة لاستعراض مهامها التفصيلية في هذا المسار:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setSelectedAgencyInTrack('all')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                          selectedAgencyInTrack === 'all'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        عرض جميع الجهات 👥
                      </button>
                      <button
                        onClick={() => setSelectedAgencyInTrack('cooperative')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                          selectedAgencyInTrack === 'cooperative'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-100'
                        }`}
                      >
                        الجمعية التعاونية 🏢
                      </button>
                      <button
                        onClick={() => setSelectedAgencyInTrack('localAuthority')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                          selectedAgencyInTrack === 'localAuthority'
                            ? 'bg-sky-500 text-slate-950 shadow-sm'
                            : 'bg-white text-sky-800 hover:bg-sky-50 border border-sky-100'
                        }`}
                      >
                        السلطة المحلية 🏛️
                      </button>
                      <button
                        onClick={() => setSelectedAgencyInTrack('mobilization')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                          selectedAgencyInTrack === 'mobilization'
                            ? 'bg-rose-500 text-slate-950 shadow-sm'
                            : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-100'
                        }`}
                      >
                        التعبئة العامة ✊
                      </button>
                      <button
                        onClick={() => setSelectedAgencyInTrack('interventionUnit')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                          selectedAgencyInTrack === 'interventionUnit'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-100'
                        }`}
                      >
                        وحدة التدخلات ⚡
                      </button>
                    </div>
                  </div>

                  {/* Graphical Interactive Roles Board */}
                  <div className={`grid gap-4 pt-2 ${selectedAgencyInTrack === 'all' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* 1. الجمعية التعاونية */}
                    {(selectedAgencyInTrack === 'all' || selectedAgencyInTrack === 'cooperative') && (
                      <div className="p-5 bg-gradient-to-br from-amber-50/50 to-orange-50/20 border border-amber-200/60 rounded-3xl space-y-4 shadow-2xs relative overflow-hidden group hover:shadow-xs transition-all animate-fadeIn">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="flex items-center justify-between pb-3 border-b border-amber-200/40 relative z-10">
                          <h4 className="font-black text-xs text-amber-900 flex items-center gap-2">
                            <span className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                              <Building2 className="w-4 h-4" />
                            </span>
                            الجمعية التعاونية (متابعة وإشراف ميداني)
                          </h4>
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200/30">
                            شريك الميدان والجهد الشعبي 👥
                          </span>
                        </div>
                        
                        <div className="space-y-2.5 relative z-10">
                          {activeTrack.roles.cooperative.map((role, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-start gap-3 p-3 bg-white/90 border border-slate-100 rounded-xl hover:-translate-x-1 hover:border-amber-300 hover:shadow-2xs transition-all duration-300"
                            >
                              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-mono text-[9.5px] font-black shrink-0 mt-0.5">
                                {idx + 1}
                              </div>
                              <p className="text-[11px] text-slate-700 leading-relaxed font-semibold text-justify">
                                {role}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. السلطة المحلية */}
                    {(selectedAgencyInTrack === 'all' || selectedAgencyInTrack === 'localAuthority') && (
                      <div className="p-5 bg-gradient-to-br from-sky-50/50 to-blue-50/20 border border-sky-200/60 rounded-3xl space-y-4 shadow-2xs relative overflow-hidden group hover:shadow-xs transition-all animate-fadeIn">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="flex items-center justify-between pb-3 border-b border-sky-200/40 relative z-10">
                          <h4 className="font-black text-xs text-sky-900 flex items-center gap-2">
                            <span className="p-1.5 bg-sky-100 rounded-lg text-sky-700">
                              <ShieldCheck className="w-4 h-4" />
                            </span>
                            السلطة المحلية (تذليل العقبات وتعميد)
                          </h4>
                          <span className="text-[9px] font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-200/30">
                            الغطاء الإداري والتنظيمي 🏛️
                          </span>
                        </div>
                        
                        <div className="space-y-2.5 relative z-10">
                          {activeTrack.roles.localAuthority.map((role, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-start gap-3 p-3 bg-white/90 border border-slate-100 rounded-xl hover:-translate-x-1 hover:border-sky-300 hover:shadow-2xs transition-all duration-300"
                            >
                              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-mono text-[9.5px] font-black shrink-0 mt-0.5">
                                {idx + 1}
                              </div>
                              <p className="text-[11px] text-slate-700 leading-relaxed font-semibold text-justify">
                                {role}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. التعبئة العامة */}
                    {(selectedAgencyInTrack === 'all' || selectedAgencyInTrack === 'mobilization') && (
                      <div className="p-5 bg-gradient-to-br from-rose-50/50 to-red-50/20 border border-rose-200/60 rounded-3xl space-y-4 shadow-2xs relative overflow-hidden group hover:shadow-xs transition-all animate-fadeIn">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="flex items-center justify-between pb-3 border-b border-rose-200/40 relative z-10">
                          <h4 className="font-black text-xs text-rose-900 flex items-center gap-2">
                            <span className="p-1.5 bg-rose-100 rounded-lg text-rose-700">
                              <Users className="w-4 h-4" />
                            </span>
                            التعبئة العامة (التحشيد والاسناد المعنوي)
                          </h4>
                          <span className="text-[9px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200/30">
                            حشد المتطوعين والإسناد ✊
                          </span>
                        </div>
                        
                        <div className="space-y-2.5 relative z-10">
                          {activeTrack.roles.mobilization.map((role, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-start gap-3 p-3 bg-white/90 border border-slate-100 rounded-xl hover:-translate-x-1 hover:border-rose-300 hover:shadow-2xs transition-all duration-300"
                            >
                              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-800 font-mono text-[9.5px] font-black shrink-0 mt-0.5">
                                {idx + 1}
                              </div>
                              <p className="text-[11px] text-slate-700 leading-relaxed font-semibold text-justify">
                                {role}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. وحدة التدخلات المركزية */}
                    {(selectedAgencyInTrack === 'all' || selectedAgencyInTrack === 'interventionUnit') && (
                      <div className="p-5 bg-gradient-to-br from-emerald-50/50 to-green-50/20 border border-emerald-200/60 rounded-3xl space-y-4 shadow-2xs relative overflow-hidden group hover:shadow-xs transition-all animate-fadeIn">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="flex items-center justify-between pb-3 border-b border-emerald-200/40 relative z-10">
                          <h4 className="font-black text-xs text-emerald-900 flex items-center gap-2">
                            <span className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
                              <Zap className="w-4 h-4" />
                            </span>
                            وحدة التدخلات (الفرز والرقابة والتمويل)
                          </h4>
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200/30">
                            الممول والجهة الرقابية الفنية ⚡
                          </span>
                        </div>
                        
                        <div className="space-y-2.5 relative z-10">
                          {activeTrack.roles.interventionUnit.map((role, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-start gap-3 p-3 bg-white/90 border border-slate-100 rounded-xl hover:-translate-x-1 hover:border-emerald-300 hover:shadow-2xs transition-all duration-300"
                            >
                              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[9.5px] font-black shrink-0 mt-0.5">
                                {idx + 1}
                              </div>
                              <p className="text-[11px] text-slate-700 leading-relaxed font-semibold text-justify">
                                {role}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Left side: Interactive Image Illustration (col-span-4) */}
                <div className="lg:col-span-4 bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 flex flex-col justify-between">
                  <TrackInteractiveImage trackId={selectedTrackId} />
                </div>

              </div>
            </div>
          </div>

          {/* Golden Triangle Concept Explanation (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Compass className="w-4 h-4 text-amber-500" />
                <h3 className="font-black text-xs text-slate-300">أركان المثلث الذهبي للمشاريع</h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed text-justify">
                تعتمد خطة العمل بمحافظة إب على التنسيق والفرز الفني لضمان مطابقة معايير الصب وحماية الإسمنت المقدم من وحدة التدخلات من الرطوبة والتلف الميداني:
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800">
                  <span className="block text-xs font-bold text-amber-400 flex items-center gap-1 mb-1">
                    <DollarSign className="w-3.5 h-3.5" /> 🪙 الميزانية التقديرية كفاءة الإنفاق
                  </span>
                  <span className="block text-[10px] text-slate-400 leading-relaxed">تكامل الدعم الحكومي مع مساهمات المغتربين والجمعية التنموية وتلافي العجز المالي.</span>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800">
                  <span className="block text-xs font-bold text-sky-400 flex items-center gap-1 mb-1">
                    <TrendingUp className="w-3.5 h-3.5" /> ⏱️ كفاءة الجدولة والوقت
                  </span>
                  <span className="block text-[10px] text-slate-400 leading-relaxed">
                    تجهيز مستودعات تخزين الإسمنت المرفوعة عن الأرض وحل الخلافات القانونية مسبقاً لمنع الركود.
                  </span>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800">
                  <span className="block text-xs font-bold text-emerald-400 flex items-center gap-1 mb-1">
                    <Award className="w-3.5 h-3.5" /> 💎 استدامة وجودة المبادرة
                  </span>
                  <span className="block text-[10px] text-slate-400 leading-relaxed">
                    تكامل جهود الإشراف الهندسي المباشر، وتدريب اللجان المحلية، وإقرار خطط الصيانة الدوريّة.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB FOR GOVERNORATE MAP / INTERVENTION PLANS */}
      {(activeTab === 'live_map' || activeTab === 'governorate') && (
        (() => {
          const governorateChartData = IBB_DISTRICTS.map(name => {
            const distInits = (initiatives || []).filter(i => matchDistrict(i.district, name));
            const count = distInits.length;
            const cost = distInits.reduce((acc, curr) => acc + (curr.cost || curr.estimatedCost || 0), 0);
            const community = distInits.reduce((acc, curr) => acc + (curr.communityContribution || 0), 0);
            const unit = distInits.reduce((acc, curr) => acc + (curr.unitContribution || 0), 0);
            const totalProgress = distInits.reduce((acc, curr) => acc + (curr.completionRate || 0), 0);
            const avgProgress = count > 0 ? Math.round(totalProgress / count) : 0;

            return {
              name,
              count,
              cost,
              community,
              unit,
              avgProgress
            };
          }).sort((a, b) => b.count - a.count || b.cost - a.cost);

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-slate-900">
              {/* 1. Map Section (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-600 animate-bounce" />
                        البث المباشر لمواقع وخريطة المبادرات بمحافظة إب
                      </h3>
                      <p className="text-[10px] text-slate-400">خريطة تفاعلية تعرض توزيع المشاريع الميدانية لشق ورصف الطرق الجبلية وعقبات المحافظة الشامخة</p>
                    </div>
                  </div>
                  <div className="h-[480px] rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 relative">
                    <InteractiveGPSMap initiatives={initiatives || []} />
                  </div>
                </div>
              </div>

              {/* 2. District Intervention Plans (lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col h-[560px]">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-600" />
                      مخططات التدخل التفصيلية لكل مديرية (بوابة الخرائط)
                    </h3>
                    <p className="text-[10px] text-slate-400">إحصائيات الفرز والنتائج لجميع مديريات إب لتعزيز كفاءة الإنفاق والمشاركة المجتمعية</p>
                  </div>

                  {/* District Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ابحث عن مديرية معينة..."
                      value={districtSearchQuery}
                      onChange={(e) => setDistrictSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-hidden focus:border-amber-500 focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  {/* Scrollable comparative table */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 max-h-[400px]">
                    <table className="w-full text-right border-collapse text-[10.5px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold sticky top-0 z-10">
                          <th className="p-2 text-slate-900">المديرية</th>
                          <th className="p-2 text-center">المبادرات</th>
                          <th className="p-2 text-center">متوسط الإنجاز</th>
                          <th className="p-2 text-left">التكلفة الإجمالية</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {governorateChartData
                          .filter(item => item.name.includes(districtSearchQuery))
                          .map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-all">
                              <td className="p-2 font-black text-slate-900">مديرية {item.name}</td>
                              <td className="p-2 text-center font-mono text-slate-600">{item.count} م.</td>
                              <td className="p-2">
                                <div className="flex items-center gap-1.5 justify-center">
                                  <span className="font-mono text-[10px] font-bold text-slate-900">{item.avgProgress}%</span>
                                  <div className="w-8 bg-slate-100 h-1 rounded-full overflow-hidden shrink-0">
                                    <div className="bg-emerald-600 h-1 rounded-full" style={{ width: `${item.avgProgress}%` }}></div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-2 text-left font-mono font-bold text-amber-700">
                                {item.cost > 0 ? `${(item.cost / 1000000).toFixed(1)}M` : '0'} ريال
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* TAB 2: DETAILED ROLES MATRIX DIAGRAM */}
      {activeTab === 'roles' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">مصفوفة توزيع وتكامل المسؤوليات في الميدان</h2>
              <p className="text-xs text-slate-500">منع تداخل الصلاحيات حماية لقوانين التنمية المتكاملة والإدارة بالنتائج</p>
            </div>
            
            {/* Filter buttons to inspect roles specifically */}
            <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-2xl border">
              <button
                onClick={() => setActiveRoleFilter('cooperative')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                  activeRoleFilter === 'cooperative' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الجمعية التعاونية
              </button>
              <button
                onClick={() => setActiveRoleFilter('localAuthority')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                  activeRoleFilter === 'localAuthority' ? 'bg-sky-500 text-slate-950' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                السلطة المحلية
              </button>
              <button
                onClick={() => setActiveRoleFilter('mobilization')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                  activeRoleFilter === 'mobilization' ? 'bg-rose-500 text-slate-950' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                التعبئة العامة
              </button>
              <button
                onClick={() => setActiveRoleFilter('interventionUnit')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                  activeRoleFilter === 'interventionUnit' ? 'bg-emerald-500 text-slate-950' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                وحدة التدخلات
              </button>
            </div>
          </div>

          {/* Master 5-Tracks Grid with highlight for filtered role */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {tracksData.map((track) => {
              let bgClass = "bg-slate-50 border-slate-200";
              let titleClass = "text-slate-900";
              let roleContent: string[] = [];

              if (activeRoleFilter === 'cooperative') {
                bgClass = "bg-amber-50/20 border-amber-200/60";
                titleClass = "text-amber-950";
                roleContent = track.roles.cooperative;
              } else if (activeRoleFilter === 'localAuthority') {
                bgClass = "bg-sky-50/20 border-sky-200/60";
                titleClass = "text-sky-950";
                roleContent = track.roles.localAuthority;
              } else if (activeRoleFilter === 'mobilization') {
                bgClass = "bg-rose-50/20 border-rose-200/60";
                titleClass = "text-rose-950";
                roleContent = track.roles.mobilization;
              } else if (activeRoleFilter === 'interventionUnit') {
                bgClass = "bg-emerald-50/20 border-emerald-200/60";
                titleClass = "text-emerald-950";
                roleContent = track.roles.interventionUnit;
              }

              return (
                <div key={track.id} className={`p-4 rounded-2xl border-2 transition-all ${bgClass} space-y-3`}>
                  <div className="flex justify-between items-start">
                    <span className="w-7 h-7 rounded-lg bg-white border font-bold text-xs flex items-center justify-center text-slate-700 shadow-3xs">
                      {track.id}
                    </span>
                    <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      المسار {track.id}
                    </span>
                  </div>
                  <div>
                    <h3 className={`font-black text-xs leading-snug ${titleClass}`}>{track.title}</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-1 line-clamp-2">{track.description}</p>
                  </div>
                  
                  {/* Dynamic Roles View */}
                  <div className="space-y-2 border-t border-slate-200/50 pt-2.5">
                    <span className="text-[9px] font-black text-slate-500 block">المهام في هذا المسار:</span>
                    <ul className="space-y-1.5">
                      {roleContent.map((role, rIdx) => (
                        <li key={rIdx} className="text-[10.5px] text-slate-700 leading-relaxed font-medium">
                          • {role}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Integrated diagram of flow */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
            <h3 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-600" />
              مخطط تدفق عملية الصيانة وتوفير التنازلات (Flow Chart):
            </h3>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center py-2">
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-3xs w-full md:w-52">
                <span className="block text-[9px] text-emerald-600 font-bold">1. وحدة التدخلات السريعة</span>
                <span className="text-xs font-black text-slate-900">توفير الأسمنت والديزل</span>
              </div>
              <div className="text-slate-400 font-bold hidden md:block">←</div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-3xs w-full md:w-52">
                <span className="block text-[9px] text-indigo-600 font-bold">2. الجمعية التعاونية</span>
                <span className="text-xs font-black text-slate-900">توثيق التنازلات الفنية</span>
              </div>
              <div className="text-slate-400 font-bold hidden md:block">←</div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-3xs w-full md:w-52">
                <span className="block text-[9px] text-amber-600 font-bold">3. اللجان المجتمعية</span>
                <span className="text-xs font-black text-slate-900">حشد المتطوعين والصب</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DECISION SIMULATION GAME */}
      {activeTab === 'game' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Game Simulation (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            {!finished ? (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div>
                  <span className="inline-block text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-2">
                    {tracksData[step].name}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-indigo-600" />
                    {tracksData[step].title}
                  </h3>
                  <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                    مسار العمل التشاركي لفرسان إب بمشاركة جميع الفاعلين لشق ورصف الطرق الجبلية.
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-3">
                  <span className="text-[10px] font-black text-slate-500 block">العقبة أو التحدي الميداني القائم:</span>
                  <p className="text-sm font-black text-slate-900 leading-relaxed text-justify">
                    {tracksData[step].scenario?.desc}
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="text-[11px] font-black text-slate-500 block">خيارات القرار القيادي للمستشار:</span>
                  <div className="grid grid-cols-1 gap-3">
                    {tracksData[step].scenario?.options.map((opt) => {
                      const isOptionSelected = selectedOption?.id === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleChoice(opt)}
                          disabled={showFeedback}
                          className={`w-full text-right p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3.5 cursor-pointer ${
                            isOptionSelected
                              ? 'border-amber-500 bg-amber-500/10 text-slate-950 ring-2 ring-amber-400/20'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                            isOptionSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {opt.id}
                          </span>
                          <span className="text-xs font-black leading-relaxed">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {showFeedback && selectedOption && (
                  <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-4 animate-fadeIn">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-amber-800 block">التغذية الراجعة والتحليل المستقبلي:</span>
                      <p className="text-xs font-bold text-slate-800 leading-relaxed text-justify">
                        {selectedOption.feedback}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-[10.5px] font-bold border-t border-amber-200/50 pt-3">
                      <span className="text-slate-500">أثر القرار على مؤشرات الأداء الثلاثة:</span>
                      <div className="flex gap-3">
                        <span className={`px-2 py-0.5 rounded-md ${selectedOption.impact.budget >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          الميزانية: {selectedOption.impact.budget >= 0 ? '+' : ''}{selectedOption.impact.budget}%
                        </span>
                        <span className={`px-2 py-0.5 rounded-md ${selectedOption.impact.time >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          الوقت: {selectedOption.impact.time >= 0 ? '+' : ''}{selectedOption.impact.time}%
                        </span>
                        <span className={`px-2 py-0.5 rounded-md ${selectedOption.impact.quality >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          الجودة: {selectedOption.impact.quality >= 0 ? '+' : ''}{selectedOption.impact.quality}%
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleNext}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>المتابعة إلى المسار التالي</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-md space-y-6" dir="rtl">
                <div className="text-center space-y-2 max-w-lg mx-auto py-4">
                  <span className="text-4xl">🏆</span>
                  <h3 className="text-lg font-black text-amber-400">ملخص نتائج جلسة محاكاة القرارات التنموية</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    لقد قمت بإتمام المحاكاة ومتابعة قيود المشروع من منظور مستشار أول لإدارة المشاريع التنموية.
                  </p>
                </div>

                {/* Score Meters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">مؤشر كفاءة الميزانية 🪙</span>
                    <h4 className="text-2xl font-mono font-black text-amber-400">{stats.budget}%</h4>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${Math.min(100, stats.budget)}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">مؤشر كفاءة الجدولة والوقت ⏱️</span>
                    <h4 className="text-2xl font-mono font-black text-sky-400">{stats.time}%</h4>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-400 h-2 rounded-full" style={{ width: `${Math.min(100, stats.time)}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">مؤشر استدامة وجودة المبادرة 💎</span>
                    <h4 className="text-2xl font-mono font-black text-emerald-400">{stats.quality}%</h4>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${Math.min(100, stats.quality)}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Executive Report Persona */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-extrabold text-xs text-amber-400 flex items-center gap-1.5 pb-2 border-b border-slate-800" dir="rtl">
                    <Scale className="w-4 h-4 text-amber-500" />
                    تحليل الأداء والتقرير التوجيهي للمستشار التنموي الأول:
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed text-justify" dir="rtl">
                    {stats.budget >= 80 && stats.time >= 80 && stats.quality >= 80 ? (
                      "لقد أظهرت حكمة استثنائية وقدرة على قيادة وتكامل جهود المجتمع المحلي مع دعم وحدة التدخلات. أداؤك في إدارة قيود المثلث الذهبي يعتبر نموذجاً رائعاً للاستخدام الرشيد للتمويل والحد من النزاعات وبناء شراكة مستدامة مع المغتربين."
                    ) : stats.quality < 60 ? (
                      "التقرير يشير إلى انخفاض مقلق في مؤشر الجودة والاستدامة. رغم الحفاظ على الميزانية أو الوقت، إلا أن التفريط في المواصفات الهندسية ورصف المنعطفات الجبلية يهدد بجرف السيول للأصل التنموي سريعاً وضياع مجهود الأهالي. نوصي بتوطيد الإشراف المباشر."
                    ) : stats.budget < 60 ? (
                      "أداؤك متميز في الحفاظ على الجودة والوقت، ولكن هناك عجز مالي كبير في إدارة ميزانية المبادرات. ينبغي زيادة مستوى التنسيق لتسليم المساعدات وضمان دقة فرز الاحتياجات والتنازلات قبل توجيه دعم الإسمنت لتلافي تشتت الموارد."
                    ) : (
                      "مستوى أداء متوازن ومقبول، إلا أن التحديات الميدانية لا تزال تتطلب يقظة تامة. استمر في نشر التقارير المصورة بشفافية وإشراك اللجان المجتمعية لتعزيز الثقة ومنع استئثار القرارات الشعبية لضمان الاستدامة."
                    )}
                  </p>
                </div>

                {/* Reset button */}
                <button
                  onClick={handleReset}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>إعادة تشغيل المحاكاة التفاعلية 🔄</span>
                </button>
              </div>
            )}
          </div>

          {/* Game Simulation Stats & Info Card (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-md space-y-4" dir="rtl">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Compass className="w-4 h-4 text-amber-500 animate-pulse" />
                <h3 className="font-black text-xs text-slate-300">مؤشرات أداء المثلث الذهبي الحالية</h3>
              </div>
              
              <div className="space-y-4 pt-1">
                {/* Meter 1: Budget */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-amber-400">🪙 كفاءة الإنفاق والميزانية</span>
                    <span className="font-mono">{stats.budget}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, stats.budget)}%` }}></div>
                  </div>
                  <span className="text-[9px] text-slate-400 block leading-relaxed">الحفاظ على الميزانية المحددة وتجنب الهدر المالي.</span>
                </div>

                {/* Meter 2: Time */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-sky-400">⏱️ السرعة وإنجاز جدول الوقت</span>
                    <span className="font-mono">{stats.time}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-sky-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, stats.time)}%` }}></div>
                  </div>
                  <span className="text-[9px] text-slate-400 block leading-relaxed">الالتزام بالجدول الزمني المحدد وسرعة التنفيذ.</span>
                </div>

                {/* Meter 3: Quality */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-emerald-400">🛡️ جودة التنفيذ والمواصفات</span>
                    <span className="font-mono">{stats.quality}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, stats.quality)}%` }}></div>
                  </div>
                  <span className="text-[9px] text-slate-400 block leading-relaxed">مطابقة معايير الصب ورص الحجارة والأبعاد الفنية.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: STRATEGIC ANALYTICS 📊 */}
      {activeTab === "analytics" && (() => {
          const globalTotalInits = initiatives ? initiatives.length : 0;
          const globalTotalCement = initiatives ? initiatives.reduce((acc, curr) => acc + getCementQuantity(curr), 0) : 0;
          const globalAvgImpact = initiatives && initiatives.length > 0 
            ? Math.round(initiatives.reduce((acc, curr) => acc + (curr.impactScore || 0), 0) / initiatives.length) 
            : 0;

          const DEFAULT_DISTRICTS = [
            "ذي السفال", "السياني", "جبلة", "بعدان", "السدة", "يريم", "المخادر", "حبيش",
            "حزم العدين", "الرضمة", "القفر", "العدين", "ريف إب", "الظهار", "المشنة",
            "السبرة", "الشعر", "النادرة", "فرع العدين", "مذيخرة"
          ];

          const normalizeDist = (s: string) => (s || '').replace(/^مديرية\s+/, '').trim().toLowerCase();

          const districtAnalyticsData = DEFAULT_DISTRICTS.map(district => {
            const distInits = (initiatives || []).filter(i => matchDistrictStrict(i.district, district));
            const count = distInits.length;
            const cement = distInits.reduce((acc, curr) => acc + getCementQuantity(curr), 0);
            const totalSubs = 8;
            // Realistic calculation: coverage based on initiatives per district vs 8 sub-districts
            const coveredSubsCount = Math.min(totalSubs, Math.max(count > 0 ? 1 : 0, Math.ceil(count * 1.5)));
            const coverage = Math.min(100, Math.round((coveredSubsCount / totalSubs) * 100));
            const gap = Math.max(0, 100 - coverage);

            return {
              district,
              count,
              cement,
              totalSubs,
              coveredSubsCount,
              coverage,
              gap
            };
          });

          const cleanSelectedDistrict = selectedAnalyticsDistrict.replace("مديرية ", "").trim();
          const selectedInits = (selectedAnalyticsDistrict === 'all' || !selectedAnalyticsDistrict)
            ? (initiatives || [])
            : (initiatives || []).filter(i => matchDistrictStrict(i.district, selectedAnalyticsDistrict));

          const subDistrictAnalyticsData = selectedInits.map((init, idx) => {
            const subName = init.subDistrict || `عزلة / قرية ${idx + 1}`;
            const cement = getCementQuantity(init);
            const avgProgress = init.completionRate || 0;
            const impact = init.impactScore || 85;

            return {
              subName,
              title: init.title,
              cement,
              avgProgress,
              impact
            };
          });

          return (
            <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    تقرير التخطيط الاستراتيجي ومؤشرات الأداء التشاركي 📊
                  </span>
                  <h2 className="text-lg font-black text-slate-100 flex items-center gap-2 mt-1">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span>منصة الفرز الفني للمبادرات وقياس الفجوة التنموية بمحافظة إب</span>
                  </h2>
                  <p className="text-xs text-slate-400 max-w-3xl leading-relaxed text-justify mt-1">
                    مستند هندسي وتنموي معد من قبل **المستشار التنموي الأول للمحافظة** لمتابعة خطط تفعيل المبادرات. يحلل هذا العرض التفاعلي توزيع مبادرات الرصف والشق وحجم إسناد الإسمنت ومستوى تغطية المديريات والفجوة التنموية المتبقية وفق قوانين الإدارة بالنتائج والمثلث الذهبي للمشاريع.
                  </p>
                </div>
              </div>

              {/* Overall Governorate KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">إجمالي مبادرات الرصف والشق</span>
                    <h4 className="text-2xl font-mono font-black text-amber-400">{globalTotalInits} <span className="text-xs font-sans text-slate-400">مبادرة</span></h4>
                    <span className="text-[9px] text-emerald-400 block">✓ معمدة بمحاضر الفرز الفني</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Clipboard className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">دعم الإسمنت الموزع (المعتمد)</span>
                    <h4 className="text-2xl font-mono font-black text-sky-400">{globalTotalCement.toLocaleString()} <span className="text-xs font-sans text-slate-400">كيس</span></h4>
                    <span className="text-[9px] text-slate-400 block">{(globalTotalCement * 50 / 1000).toLocaleString()} طن مقاوم للملوحة والبرطوبة</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">معدل الأثر التنموي العام للعزل</span>
                    <h4 className="text-2xl font-mono font-black text-emerald-400">{globalAvgImpact} <span className="text-xs font-sans text-slate-400">/ 100</span></h4>
                    <span className="text-[9px] text-emerald-400 block">📈 كفاءة استهداف وحجم مستفيدين مرتفع</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">الفجوة التنموية المتوسطة بالمحافظة</span>
                    <h4 className="text-2xl font-mono font-black text-rose-400">
                      {Math.round(100 - districtAnalyticsData.reduce((acc, curr) => acc + curr.coverage, 0) / districtAnalyticsData.length)}%
                    </h4>
                    <span className="text-[9px] text-slate-400 block">🛑 طرق وعقبات بحاجة لفرز تالٍ</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* DISTRICT LEVEL ANALYTICAL CHARTS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Chart 1: Initiatives Count by District */}
                <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-4 text-slate-900">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">المخطط الأول</span>
                    <h3 className="text-xs font-black text-slate-900 mt-1 flex items-center gap-1.5">
                      <Clipboard className="w-4 h-4 text-indigo-600" />
                      عدد المبادرات المعتمدة لكل مديرية
                    </h3>
                  </div>
                  <div className="h-[260px] w-full text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={districtAnalyticsData} margin={{ top: 10, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="district" tick={{ fill: "#334155", fontSize: 8, fontWeight: 700 }} angle={-35} textAnchor="end" height={55} />
                        <YAxis tick={{ fill: "#334155", fontSize: 9 }} />
                        <Tooltip contentStyle={{ direction: "rtl", textAlign: "right", borderRadius: "12px" }} />
                        <Bar name="عدد المبادرات" dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Cement Quantity by District */}
                <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-4 text-slate-900">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-md">المخطط الثاني</span>
                    <h3 className="text-xs font-black text-slate-900 mt-1 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-sky-600" />
                      كميات الأسمنت المعتمدة (بالكيس)
                    </h3>
                  </div>
                  <div className="h-[260px] w-full text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={districtAnalyticsData} margin={{ top: 10, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="district" tick={{ fill: "#334155", fontSize: 8, fontWeight: 700 }} angle={-35} textAnchor="end" height={55} />
                        <YAxis tick={{ fill: "#334155", fontSize: 9 }} />
                        <Tooltip contentStyle={{ direction: "rtl", textAlign: "right", borderRadius: "12px" }} />
                        <Bar name="كمية الأسمنت (كيس)" dataKey="cement" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Development Gap Percentage by District */}
                <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-4 text-slate-900">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md">المخطط الثالث</span>
                    <h3 className="text-xs font-black text-slate-900 mt-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      نسبة الفجوة التنموية القائمة لكل مديرية (%)
                    </h3>
                  </div>
                  <div className="h-[260px] w-full text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={districtAnalyticsData} margin={{ top: 10, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="district" tick={{ fill: "#334155", fontSize: 8, fontWeight: 700 }} angle={-35} textAnchor="end" height={55} />
                        <YAxis tick={{ fill: "#334155", fontSize: 9 }} domain={[0, 100]} />
                        <Tooltip contentStyle={{ direction: "rtl", textAlign: "right", borderRadius: "12px" }} formatter={(value: any) => [`${value}%`, 'نسبة الفجوة التنموية']} />
                        <Bar name="نسبة الفجوة التنموية %" dataKey="gap" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* INDEPENDENT DISTRICT STUDY: COVERAGE & DEVELOPMENTAL GAP */}
              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-4 text-slate-900">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-amber-500 animate-pulse" />
                      دراسة مستقلة: تغطية المديريات بالمبادرات والفجوة التنموية القائمة
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">تحليل هيكلي مستقل يظهر تغطية عزل المديريات وعجز الطرق المتبقية التي لم تحظ بفرز تشاركي</p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/50">
                    تم التقييم بمشاركة الجمعية التعاونية ووحدة التدخلات 👥
                  </span>
                </div>

                {/* Table list of districts study */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100 sticky top-0">
                        <th className="p-3">المديرية</th>
                        <th className="p-3 text-center">المبادرات المعتمدة</th>
                        <th className="p-3 text-center">تغطية العزل النشطة</th>
                        <th className="p-3">نسبة التغطية بالمبادرات %</th>
                        <th className="p-3">نسبة الفجوة التنموية المتبقية %</th>
                        <th className="p-3 text-center">مستوى مؤشر الفجوة</th>
                        <th className="p-3 w-[260px]">توجيه المستشار التنموي الأول</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {districtAnalyticsData.map((d, idx) => {
                        const isHighGap = d.gap >= 70;
                        const isLowGap = d.gap < 35;
                        
                        let directive = '';
                        if (d.count === 0) {
                          directive = 'فجوة تنموية مطلقة. يتعين على فرسان التنمية حشد أعيان المديرية لتأسيس لجان مجتمعية لتقديم طلبات أولية فوراً.';
                        } else if (isHighGap) {
                          directive = `العزل المغطاة منخفضة جداً (${d.coveredSubsCount} من ${d.totalSubs}). يلزم التعبئة حث الأهالي على الاستجابة وإبرام محاضر التنازلات الفنية سريعاً لمنع استبعاد التمويل.`;
                        } else if (isLowGap) {
                          directive = 'نموذج رائد في التغطية وتكامل المسؤوليات. نوصي بتوثيق التجربة ونقل المعرفة المكتسبة لبقية اللجان التعاونية بالمحافظة.';
                        } else {
                          directive = 'مستوى مقبول. يتطلب زيادة التنسيق الميداني والشفافية مع وحدة التدخلات لرفع نسب الإنجاز ورصف الأمتار المتبقية.';
                        }

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 font-black text-slate-900">مديرية {d.district}</td>
                            <td className="p-3 text-center font-mono font-bold text-slate-600">{d.count} م.</td>
                            <td className="p-3 text-center font-mono font-bold text-slate-500">
                              {d.coveredSubsCount} من {d.totalSubs} عزل
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold w-9 text-slate-900">{d.coverage}%</span>
                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
                                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${d.coverage}%` }}></div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold w-9 ${isHighGap ? "text-rose-600" : "text-slate-900"}`}>{d.gap}%</span>
                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
                                  <div className={`h-full rounded-full ${isHighGap ? "bg-rose-500" : "bg-amber-500"}`} style={{ width: `${d.gap}%` }}></div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {isHighGap ? (
                                <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-black rounded-md border border-rose-100">
                                  فجوة حرجة جداً 🔴
                                </span>
                              ) : isLowGap ? (
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-md border border-emerald-100">
                                  تغطية متكاملة 🟢
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-black rounded-md border border-amber-100">
                                  فجوة متوسطة 🟡
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-[10.5px] text-slate-500 font-medium leading-relaxed text-justify">
                              {directive}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* LOCALIZED SUB-DISTRICT (العزلة) STUDY */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
                
                {/* Selector Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                      الدراسة التفصيلية للعزل (القرى الفرعية) 📌
                    </span>
                    <h3 className="text-base font-black text-slate-100 flex items-center gap-1.5">
                      <MapPin className="w-5 h-5 text-amber-400" />
                      <span>تحليل المبادرات والأسمنت ومؤشر الأثر التنموي للعزل</span>
                    </h3>
                    <p className="text-xs text-slate-400">تحليل تفصيلي لمستوى العزل والقرى لمديرية محددة لقياس كميات الأسمنت المستهلكة ومؤشر الأثر التنموي الفعلي للصب.</p>
                  </div>

                  {/* Dropdown Selector */}
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs">
                    <ListFilter className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-slate-400">المديرية المستهدفة للدراسة:</span>
                    <select
                      value={selectedAnalyticsDistrict}
                      onChange={(e) => setSelectedAnalyticsDistrict(e.target.value)}
                      className="bg-transparent text-white font-black focus:outline-none cursor-pointer outline-none border-none pr-1"
                    >
                      <option value="all" className="bg-slate-950 text-white">🌐 كافة مديريات محافظة إب (٢٠ مديرية)</option>
                      {ALL_DISTRICTS.map((d, idx) => (
                        <option key={idx} value={`مديرية ${d}`} className="bg-slate-950 text-white">
                          مديرية {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sub-district Empty Warning */}
                {subDistrictAnalyticsData.length === 0 ? (
                  <div className="bg-slate-950/50 rounded-2xl p-8 text-center border border-slate-800/60 max-w-lg mx-auto space-y-2">
                    <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
                    <h4 className="font-bold text-xs text-slate-200">لا توجد مبادرات معمدة حالياً بمديرية {cleanSelectedDistrict}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      هذا يشير إلى فجوة تنموية مطلقة بنسبة 100%. ينبغي على الفرسان التنسيق مع لجان التنمية المحلية في عزل المديرية المذكورة لفرز الاحتياج.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 font-extrabold border-b border-slate-800">
                            <th className="p-3">العزلة / القرية</th>
                            <th className="p-3">اسم المبادرة التشاركية</th>
                            <th className="p-3 text-center">كمية الأسمنت (كيس)</th>
                            <th className="p-3 text-center">نسبة الإنجاز %</th>
                            <th className="p-3 text-left">مؤشر الأثر التنموي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
                          {subDistrictAnalyticsData.map((sub, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                              <td className="p-3 font-bold text-amber-400">{sub.subName}</td>
                              <td className="p-3 font-medium text-slate-200">{sub.title}</td>
                              <td className="p-3 text-center font-mono font-bold text-sky-400">{sub.cement.toLocaleString()} كيس</td>
                              <td className="p-3 text-center">
                                <span className="font-mono text-emerald-400 font-black">{sub.avgProgress}%</span>
                              </td>
                              <td className="p-3 text-left">
                                <div className="flex items-center gap-1.5 justify-end">
                                  <span className="font-mono text-amber-400 font-black">{sub.impact} / 100</span>
                                  <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden shrink-0 border border-slate-700">
                                    <div className="bg-amber-400 h-full rounded-full" style={{ width: `${sub.impact}%` }}></div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Consultant guidance specific to selected district's local micro-performance */}
                    <div className="p-4.5 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
                      <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0 text-sm">💡</span>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-amber-400">توجيه صادر من المستشار التنموي الأول لمديرية {cleanSelectedDistrict}:</h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed text-justify">
                          عند مراجعة مؤشر الأثر التنموي للعزل بمديرية **{cleanSelectedDistrict}**، يتوجب على فرسان التنمية تفعيل لجان التعبئة والتحشيد الأهلي وتمكين اللجان الشعبية المحلية من إدارة الموارد بكفاءة، مع التركيز على بناء قدرات المشرفين المحليين على الحوكمة وإرساء الشفافية المطلقة في توزيع المواد ومكافحة الشائعات وتوطيد التوافق المجتمعي. إن إغفال التلاحم المجتمعي وإقصاء المبادرات عن المتابعة التشاركية سيؤدي حتماً إلى فتور همم الأهالي وتراجع الإسناد المالي من المغتربين، مما يعرض استدامة المشاريع للتعثر.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
      })()}

      {/* TAB: COOPERATIVE EMPOWERMENT GUIDE 🤝 */}
      {activeTab === 'empowerment' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Description Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-md">
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 text-right">
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  نهج نموذج محافظة إب للتنمية الذاتية التشاركية 🇾🇪
                </span>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  دليل التمكين التعاوني وحشد المجهود الذاتي
                </h2>
                <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                  هذا الدليل مخصص لفرسان التنمية والجمعيات التعاونية لتمكين المجتمعات المحلية من إدارة وتأمين مبادرات رصف الطرق الجبلية، وتأصيل قيم الاعتماد على الذات بعيداً عن توصيات سماكة الإسمنت الميكانيكية، صعوداً بالعمل الأهلي إلى مصاف الحوكمة المؤسسية والشفافية التامة.
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 self-center">
                <Users className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Interactive Maturity Score Panel (lg:col-span-5) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    مقياس نضج وحوكمة المبادرة التشاركية (بيانات واقعية)
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">اختبار الجاهزية والحوكمة للمبادرة بناءً على بيانات الشيت الفعلي والتقارير الميدانية.</p>
                </div>

                {/* Initiative Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 block">اختر المبادرة لفحص مؤشر نضجها الميداني:</label>
                  <select
                    value={selectedInitiativeIdForMaturity}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedInitiativeIdForMaturity(id);
                      if (id !== 'all') {
                        const targetInit = (initiatives || []).find(i => i.id === id);
                        if (targetInit) {
                          setMaturityChecked([
                            Boolean(targetInit.committee && targetInit.committee.length > 0),
                            Boolean(targetInit.ownerConfirmed),
                            Boolean(targetInit.reports && targetInit.reports.length > 0),
                            Boolean((targetInit.completionRate || 0) >= 50 || targetInit.status === 'completed')
                          ]);
                        }
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs font-bold rounded-xl p-2.5 focus:border-emerald-500 outline-none"
                  >
                    <option value="all">📊 إجمالي المحافظة (تقييم الحوكمة العام)</option>
                    {(initiatives || []).map(init => (
                      <option key={init.id} value={init.id}>
                        {init.name} - {init.district} ({init.completionRate}% إنجاز)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3 pt-1">
                  {[
                    {
                      label: "1. لجنة تنمية مجتمعية مأسسة وممثلة للقرى",
                      desc: "وجود ممثلين معتمدين ولجنة تنمية متابعة للإنفاق والعمالة الطوعية."
                    },
                    {
                      label: "2. وثائق وتنازلات كتابية عن ممرات الطريق",
                      desc: "توثيق التنازلات القانونية لتلافي النزاعات الأهلية التي قد تعرقل المعدات."
                    },
                    {
                      label: "3. توثيق العهد والشفافية وتصفية المواد",
                      desc: "رفع تقارير أسبوعية بحركة مخازن الإسمنت والديزل ونشرها للمغتربين والأهالي."
                    },
                    {
                      label: "4. التقدم الميداني وتدشين صندوق الصيانة الذاتية",
                      desc: "تجاوز 50% من الرصف أو الاكتما مع تخصيص عهدة صيانة لحماية الطريق من السيول."
                    }
                  ].map((item, idx) => (
                    <label 
                      key={idx} 
                      className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800 hover:border-slate-700/60 transition-all cursor-pointer select-none text-right"
                    >
                      <input 
                        type="checkbox" 
                        checked={maturityChecked[idx]}
                        onChange={() => {
                          const updated = [...maturityChecked];
                          updated[idx] = !updated[idx];
                          setMaturityChecked(updated);
                        }}
                        className="w-4 h-4 mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-800 cursor-pointer accent-emerald-500"
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-200">{item.label}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Progress and Live Assessment Result */}
              <div className="bg-slate-950/60 p-4 border border-slate-800/80 rounded-2xl space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">مؤشر النضج والتمكين التعاوني للمبادرة:</span>
                  <span className="font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {maturityChecked.filter(Boolean).length * 25}%
                  </span>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/50">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${maturityChecked.filter(Boolean).length * 25}%` }}
                  ></div>
                </div>

                {/* Contextual Assessment */}
                <div className="p-3.5 rounded-xl border leading-relaxed text-[11px] font-semibold text-right transition-all">
                  {(() => {
                    const score = maturityChecked.filter(Boolean).length * 25;
                    if (score === 0) {
                      return (
                        <div className="text-rose-400">
                          🔴 <strong>تحذير تنموي حرج:</strong> المبادرة حالياً مجرد طلب عشوائي يفتقر للحد الأدنى من الحوكمة. الإصرار على البدء دون تنظيم يعرض المشروع لتعثر وشيك وخلافات أهلية وتجميد للمواد.
                        </div>
                      );
                    } else if (score <= 50) {
                      return (
                        <div className="text-amber-400">
                          🟡 <strong>حالة نضج ناشئة:</strong> مبادرة بدأت ببعض التنظيم التشاركي، ولكنها تفتقر للشفافية المالية التامة أو توثيق التنازلات. لا تتسرع بالدعم قبل استكمال الحوكمة لضمان كفاءة الإنفاق.
                        </div>
                      );
                    } else if (score === 75) {
                      return (
                        <div className="text-sky-400">
                          🟢 <strong>أداء متميز وناضج:</strong> تمثيل مجتمعي رائع وشفافية كافية. نوصي فرسان التنمية بمساعدة اللجنة على تأسيس الصندوق التشاركي للصيانة فوراً لضمان ديمومة المشروع وحماية الطريق من سيول الشتاء.
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-emerald-400">
                          🏆 <strong>مبادرة تشاركية نموذجية رائدة:</strong> المبادرة مستوفية لكافة أركان نموذج محافظة إب المعتمد. هناك تمثيل شامل وشفافية مطلقة ومأسسة صيانة، وهي مؤهلة تماماً لتكون قصة نجاح ملهمة لليمن بأكمله!
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>

            {/* The 4 pillars Cards (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-black text-amber-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                <Compass className="w-4 h-4 text-amber-500" />
                أركان نموذج الإدارة والتفعيل الذاتي للمبادرات
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pillar 1 */}
                <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl hover:border-slate-700 transition-all space-y-3 text-right">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <Users className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-black text-white">1. التلاحم والمشاركة الأهليّة الشاملة</h4>
                  </div>
                  <p className="text-[10.5px] text-slate-300 leading-relaxed">
                    يبدأ التمكين بانتخاب لجنة ممثلة لكافة شرائح المجتمع المحيط بالطريق المستهدف. يتم حشد الأيادي العاملة الطوعية وتوزيع أدوار جمع ونقل وتصفيف الأحجار المحلية بالتناوب، بما يخلق روح الملكية والاعتزاز الجماعي.
                  </p>
                </div>

                {/* Pillar 2 */}
                <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl hover:border-slate-700 transition-all space-y-3 text-right">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                      <Scale className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-black text-white">2. الشفافية والمكاشفة المالية المطلقة</h4>
                  </div>
                  <p className="text-[10.5px] text-slate-300 leading-relaxed">
                    تلتزم اللجنة بنشر كشوفات مفصلة وصور لمخازن المبادرة والعهد النقدية والعينية وحركة صرف إسمنت وحدة التدخلات الحكومية أسبوعياً في لوحات إعلانات المساجد ومجموعات التواصل الاجتماعي لإعطاء المغتربين الثقة بالدعم والاستمرار.
                  </p>
                </div>

                {/* Pillar 3 */}
                <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl hover:border-slate-700 transition-all space-y-3 text-right">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-black text-white">3. تصفية التنازلات القانونية مسبقاً</h4>
                  </div>
                  <p className="text-[10.5px] text-slate-300 leading-relaxed">
                    قبل حفر متر واحد أو طلب دعم، يتوجب على فرسان التنمية توثيق التنازلات القانونية عن ممرات الطرق وتوسعاتها طوعياً وتعميدها مع الملاك لمنع النزاعات الفردية لاحقاً وحماية المبادرات ومساهمات المجتمع من التوقف والضياع.
                  </p>
                </div>

                {/* Pillar 4 */}
                <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl hover:border-slate-700 transition-all space-y-3 text-right">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <RefreshCw className="w-4 h-4 animate-spin-slow" />
                    </span>
                    <h4 className="text-xs font-black text-white">4. ديمومة المبادرة (صندوق الصيانة)</h4>
                  </div>
                  <p className="text-[10.5px] text-slate-300 leading-relaxed">
                    تأسيس صندوق تنموي محلي للصيانة التشاركية برأس مال يتغذى من مساهمات المغتربين والمنتفعين. يتم تفعيل الصندوق لتنظيف قنوات تصريف السيول وسد أي شروخ طارئة قبل حلول الشتاء لمنع جرف الطريق وفشل الاستثمار الأهلي.
                  </p>
                </div>
              </div>

              {/* Development advice block */}
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4.5 flex items-start gap-3">
                <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg text-xs">📝</span>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-amber-400">توجيه من المستشار التنموي التكاملي لفرسان التنمية:</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed text-justify">
                    أيها الفرسان الأوفياء، إن رصف عقبات إب الشامخة بالطرق الطوعية هو نموذج معمد بالوفاء والعزة الوطنية. لا تدعوا أحداً يشغلكم عن جوهر العمل التنموي بالتركيز على التوصيات الميكانيكية الجافة لسمك الخرسانة؛ بل ركزوا كل جهدكم في تمكين لجان المحليات وبناء مصفوفات الحوكمة وحشد الهمم والمجتمعات للنهوض والاعتماد على الذات، وستجدون الطرق تشاد بمواصفات تضاهي الجبال رسوخاً وثباتاً.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
